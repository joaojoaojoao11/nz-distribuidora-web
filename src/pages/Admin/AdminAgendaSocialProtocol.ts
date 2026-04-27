import { supabase } from '../../lib/supabase';
import {
  type Account,
  type ChecklistItem,
  type SocialPost,
  type Status,
  templateChecklist,
} from './AdminAgendaSocial';
import type { AgendaObjective, AgendaTask } from './AdminAgendaSocialPlan';
import type { ExternalEvent } from './AdminAgendaSocialFeeds';

/* =====================================================================
   Protocolo Cowork — parsing + execution + export
   ─────────────────────────────────────────────────────────────────────
   Lógica pura (sem JSX) compartilhada pelos modais Importar/Comandar e
   Exportar. Faz parse de 4 formatos de payload, despacha 4 ações em 3
   tabelas, e gera o export estruturado pro Cowork digerir.
   ===================================================================== */

export type TableName = 'social_posts' | 'agenda_tasks' | 'agenda_objectives';
export const TABLE_NAMES: TableName[] = ['social_posts', 'agenda_tasks', 'agenda_objectives'];

export type ActionKind = 'create' | 'update' | 'delete' | 'advance_status';

const VALID_ACCOUNTS: Account[] = ['nzppf', 'nzgroup', 'joaowrap'];
const VALID_STATUSES: Status[] = ['backlog', 'em_producao', 'pronto', 'agendado', 'postado'];
const VALID_FORMATS = ['Foto', 'Carrossel', 'Reel', 'Story'];
const VALID_TASK_STATUS = ['pending', 'doing', 'done', 'dropped'] as const;
const VALID_OBJECTIVE_STATUS = ['open', 'done', 'dropped'] as const;
const VALID_OBJECTIVE_SCOPE = ['monthly', 'weekly'] as const;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const FORBIDDEN_PATCH_KEYS = new Set(['id', 'created_at', 'created_by']);

export type ParsedOp =
  | { kind: 'create'; table: TableName; data: Record<string, unknown>; sourceLabel: string }
  | { kind: 'update'; table: TableName; id: string; patch: Record<string, unknown>; sourceLabel: string }
  | { kind: 'delete'; table: TableName; ids: string[]; sourceLabel: string }
  | { kind: 'advance_status'; table: 'social_posts'; ids: string[]; sourceLabel: string };

export interface ParseResult {
  ops: ParsedOp[];
  errors: string[];
  /** Modo detectado, pra exibir hint no preview ("formato legado", etc). */
  detectedMode: 'legacy_posts' | 'grouped' | 'commands' | 'mixed' | 'empty' | 'unknown';
}

export interface TableExecCount {
  created: number;
  updated: number;
  deleted: number;
  advanced: number;
}

export interface ExecResult {
  social_posts: TableExecCount;
  agenda_tasks: TableExecCount;
  agenda_objectives: TableExecCount;
  errors: string[];
}

/* ─────────────────────────────────────────────────────────────────────
   Helpers de validação
   ───────────────────────────────────────────────────────────────────── */

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function pickString(raw: Record<string, unknown>, key: string): string | null {
  const v = raw[key];
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t === '' ? null : t;
}

function normalizeFormat(
  f: unknown
): { ok: true; value: string | null } | { ok: false; reason: string } {
  if (f === undefined || f === null) return { ok: true, value: null };
  if (typeof f !== 'string') return { ok: false, reason: 'format precisa ser string' };
  const trimmed = f.trim();
  if (trimmed === '') return { ok: true, value: null };
  const match = VALID_FORMATS.find((v) => v.toLowerCase() === trimmed.toLowerCase());
  if (!match) {
    return { ok: false, reason: `format "${trimmed}" inválido (use Foto, Carrossel, Reel ou Story)` };
  }
  return { ok: true, value: match };
}

/* ─────────────────────────────────────────────────────────────────────
   Builders de "data" pra cada tabela (rotina compartilhada por
   create direto e create dentro de comando).
   ───────────────────────────────────────────────────────────────────── */

function buildPostCreate(
  raw: Record<string, unknown>,
  label: string
): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  const accountRaw = raw.account;
  if (typeof accountRaw !== 'string' || accountRaw.trim() === '') {
    return { ok: false, error: `${label}: account obrigatório (nzppf | nzgroup | joaowrap)` };
  }
  const account = accountRaw.trim() as Account;
  if (!VALID_ACCOUNTS.includes(account)) {
    return { ok: false, error: `${label}: account "${accountRaw}" inválido (nzppf | nzgroup | joaowrap)` };
  }

  const titleRaw = raw.title;
  if (typeof titleRaw !== 'string' || titleRaw.trim() === '') {
    return { ok: false, error: `${label}: title obrigatório` };
  }

  const formatRes = normalizeFormat(raw.format);
  if (!formatRes.ok) return { ok: false, error: `${label}: ${formatRes.reason}` };
  const format = formatRes.value;

  let scheduled: string | null = null;
  if (raw.scheduled_for !== undefined && raw.scheduled_for !== null && String(raw.scheduled_for).trim() !== '') {
    const s = String(raw.scheduled_for).trim();
    if (!ISO_DATE_RE.test(s)) {
      return { ok: false, error: `${label}: scheduled_for "${s}" não é YYYY-MM-DD` };
    }
    scheduled = s;
  }

  // Status: aceita override, default backlog. Comandos podem precisar de
  // status diferente (ex: importar batch já como 'agendado').
  let status: Status = 'backlog';
  if (raw.status !== undefined && raw.status !== null && String(raw.status).trim() !== '') {
    const s = String(raw.status).trim() as Status;
    if (!VALID_STATUSES.includes(s)) {
      return { ok: false, error: `${label}: status "${s}" inválido` };
    }
    status = s;
  }

  // Checklist: usa override válido senão deriva do format.
  let checklist: ChecklistItem[] = templateChecklist(format);
  if (Array.isArray(raw.checklist)) {
    const cleaned: ChecklistItem[] = [];
    for (const it of raw.checklist) {
      if (
        it && typeof it === 'object' &&
        typeof (it as { label?: unknown }).label === 'string' &&
        typeof (it as { done?: unknown }).done === 'boolean'
      ) {
        cleaned.push({
          label: (it as { label: string }).label,
          done: (it as { done: boolean }).done,
        });
      }
    }
    if (cleaned.length > 0) checklist = cleaned;
  }

  return {
    ok: true,
    data: {
      account,
      title: titleRaw.trim(),
      pillar: pickString(raw, 'pillar'),
      caption: pickString(raw, 'caption'),
      format,
      asset_url: pickString(raw, 'asset_url'),
      scheduled_for: scheduled,
      notes: pickString(raw, 'notes'),
      status,
      checklist,
    },
  };
}

function buildTaskCreate(
  raw: Record<string, unknown>,
  label: string
): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  const titleRaw = raw.title;
  if (typeof titleRaw !== 'string' || titleRaw.trim() === '') {
    return { ok: false, error: `${label}: title obrigatório` };
  }

  let due: string | null = null;
  if (raw.due_date !== undefined && raw.due_date !== null && String(raw.due_date).trim() !== '') {
    const s = String(raw.due_date).trim();
    if (!ISO_DATE_RE.test(s)) return { ok: false, error: `${label}: due_date "${s}" não é YYYY-MM-DD` };
    due = s;
  }

  let priority = 2;
  if (raw.priority !== undefined && raw.priority !== null) {
    const n = Number(raw.priority);
    if (!Number.isFinite(n) || n < 1 || n > 3) {
      return { ok: false, error: `${label}: priority "${raw.priority}" inválido (use 1, 2 ou 3)` };
    }
    priority = n;
  }

  let status: (typeof VALID_TASK_STATUS)[number] = 'pending';
  if (raw.status !== undefined && raw.status !== null && String(raw.status).trim() !== '') {
    const s = String(raw.status).trim() as (typeof VALID_TASK_STATUS)[number];
    if (!VALID_TASK_STATUS.includes(s)) {
      return { ok: false, error: `${label}: status "${s}" inválido (pending | doing | done | dropped)` };
    }
    status = s;
  }

  return {
    ok: true,
    data: {
      title: titleRaw.trim(),
      description: pickString(raw, 'description'),
      due_date: due,
      priority,
      status,
      objective_id: pickString(raw, 'objective_id'),
      social_post_id: pickString(raw, 'social_post_id'),
    },
  };
}

function buildObjectiveCreate(
  raw: Record<string, unknown>,
  label: string
): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  const scopeRaw = raw.scope;
  if (typeof scopeRaw !== 'string' || scopeRaw.trim() === '') {
    return { ok: false, error: `${label}: scope obrigatório (monthly | weekly)` };
  }
  const scope = scopeRaw.trim() as (typeof VALID_OBJECTIVE_SCOPE)[number];
  if (!VALID_OBJECTIVE_SCOPE.includes(scope)) {
    return { ok: false, error: `${label}: scope "${scopeRaw}" inválido (monthly | weekly)` };
  }

  const titleRaw = raw.title;
  if (typeof titleRaw !== 'string' || titleRaw.trim() === '') {
    return { ok: false, error: `${label}: title obrigatório` };
  }

  const targetRaw = raw.target_date;
  if (typeof targetRaw !== 'string' || !ISO_DATE_RE.test(targetRaw.trim())) {
    return { ok: false, error: `${label}: target_date obrigatório no formato YYYY-MM-DD` };
  }

  let status: (typeof VALID_OBJECTIVE_STATUS)[number] = 'open';
  if (raw.status !== undefined && raw.status !== null && String(raw.status).trim() !== '') {
    const s = String(raw.status).trim() as (typeof VALID_OBJECTIVE_STATUS)[number];
    if (!VALID_OBJECTIVE_STATUS.includes(s)) {
      return { ok: false, error: `${label}: status "${s}" inválido (open | done | dropped)` };
    }
    status = s;
  }

  return {
    ok: true,
    data: {
      scope,
      title: titleRaw.trim(),
      description: pickString(raw, 'description'),
      target_date: targetRaw.trim(),
      status,
    },
  };
}

function buildCreate(
  table: TableName,
  raw: Record<string, unknown>,
  label: string
): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  if (table === 'social_posts') return buildPostCreate(raw, label);
  if (table === 'agenda_tasks') return buildTaskCreate(raw, label);
  return buildObjectiveCreate(raw, label);
}

/* ─────────────────────────────────────────────────────────────────────
   Parsing de comandos
   ───────────────────────────────────────────────────────────────────── */

function isCommand(raw: unknown): raw is Record<string, unknown> {
  return isPlainObject(raw) && typeof raw.action === 'string';
}

function parseTableName(t: unknown, label: string): { ok: true; value: TableName } | { ok: false; error: string } {
  if (typeof t !== 'string') return { ok: false, error: `${label}: table obrigatório` };
  const v = t.trim();
  if (v === 'social_posts' || v === 'agenda_tasks' || v === 'agenda_objectives') {
    return { ok: true, value: v };
  }
  // Aceita aliases curtos pra poupar dedo do Cowork.
  if (v === 'posts') return { ok: true, value: 'social_posts' };
  if (v === 'tasks') return { ok: true, value: 'agenda_tasks' };
  if (v === 'objectives') return { ok: true, value: 'agenda_objectives' };
  return { ok: false, error: `${label}: table "${v}" inválida (social_posts | agenda_tasks | agenda_objectives)` };
}

function parseCommand(
  cmd: Record<string, unknown>,
  label: string
): { ok: true; op: ParsedOp } | { ok: false; error: string } {
  const action = String(cmd.action).trim() as ActionKind;
  const tableRes = parseTableName(cmd.table, label);
  if (!tableRes.ok) return { ok: false, error: tableRes.error };
  const table = tableRes.value;

  if (action === 'create') {
    if (!isPlainObject(cmd.data)) {
      return { ok: false, error: `${label}: action "create" exige campo "data" (objeto)` };
    }
    const built = buildCreate(table, cmd.data, label);
    if (!built.ok) return { ok: false, error: built.error };
    return { ok: true, op: { kind: 'create', table, data: built.data, sourceLabel: label } };
  }

  if (action === 'update') {
    const idRaw = cmd.id;
    if (typeof idRaw !== 'string' || idRaw.trim() === '') {
      return { ok: false, error: `${label}: action "update" exige "id" (string)` };
    }
    if (!isPlainObject(cmd.patch)) {
      return { ok: false, error: `${label}: action "update" exige "patch" (objeto)` };
    }
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(cmd.patch)) {
      if (FORBIDDEN_PATCH_KEYS.has(k)) continue; // silenciosamente ignora id/created_at/created_by
      patch[k] = v;
    }
    if (Object.keys(patch).length === 0) {
      return { ok: false, error: `${label}: patch vazio (depois de remover campos protegidos)` };
    }
    return { ok: true, op: { kind: 'update', table, id: idRaw.trim(), patch, sourceLabel: label } };
  }

  if (action === 'delete') {
    const idsRaw = cmd.ids;
    if (!Array.isArray(idsRaw) || idsRaw.length === 0) {
      return { ok: false, error: `${label}: action "delete" exige "ids" (array não-vazio)` };
    }
    const ids: string[] = [];
    for (const id of idsRaw) {
      if (typeof id === 'string' && id.trim() !== '') ids.push(id.trim());
    }
    if (ids.length === 0) {
      return { ok: false, error: `${label}: nenhum id válido em "ids"` };
    }
    return { ok: true, op: { kind: 'delete', table, ids, sourceLabel: label } };
  }

  if (action === 'advance_status') {
    if (table !== 'social_posts') {
      return { ok: false, error: `${label}: advance_status só funciona em social_posts` };
    }
    const idsRaw = cmd.ids;
    if (!Array.isArray(idsRaw) || idsRaw.length === 0) {
      return { ok: false, error: `${label}: action "advance_status" exige "ids" (array não-vazio)` };
    }
    const ids: string[] = [];
    for (const id of idsRaw) {
      if (typeof id === 'string' && id.trim() !== '') ids.push(id.trim());
    }
    if (ids.length === 0) return { ok: false, error: `${label}: nenhum id válido em "ids"` };
    return { ok: true, op: { kind: 'advance_status', table: 'social_posts', ids, sourceLabel: label } };
  }

  return { ok: false, error: `${label}: action "${action}" desconhecida (use create, update, delete, advance_status)` };
}

/* ─────────────────────────────────────────────────────────────────────
   Detecção de formato + dispatch principal
   ───────────────────────────────────────────────────────────────────── */

function tableFromKind(kind: unknown): TableName | null {
  if (typeof kind !== 'string') return null;
  const v = kind.trim().toLowerCase();
  if (v === 'post' || v === 'posts' || v === 'social_post' || v === 'social_posts') return 'social_posts';
  if (v === 'task' || v === 'tasks' || v === 'agenda_task' || v === 'agenda_tasks') return 'agenda_tasks';
  if (v === 'objective' || v === 'objectives' || v === 'agenda_objective' || v === 'agenda_objectives') return 'agenda_objectives';
  return null;
}

export function parseBatch(text: string): ParseResult {
  const trimmed = text.trim();
  if (trimmed === '') {
    return { ops: [], errors: [], detectedMode: 'empty' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'JSON inválido';
    return { ops: [], errors: [`JSON inválido: ${msg}`], detectedMode: 'unknown' };
  }

  // (B) Objeto agrupado
  if (isPlainObject(parsed) && !Array.isArray(parsed)) {
    return parseGroupedObject(parsed);
  }

  if (!Array.isArray(parsed)) {
    return { ops: [], errors: ['Esperado um array ou objeto JSON'], detectedMode: 'unknown' };
  }

  if (parsed.length === 0) {
    return { ops: [], errors: [], detectedMode: 'empty' };
  }

  // Inspeciona itens pra escolher entre A, C, D
  const hasAnyCommand = parsed.some((it) => isCommand(it));
  const hasAnyKind = parsed.some((it) => isPlainObject(it) && 'kind' in it);

  if (!hasAnyCommand && !hasAnyKind) {
    // (A) Array legado: todos viram create social_posts
    return parseLegacyPostsArray(parsed);
  }

  if (hasAnyCommand && !hasAnyKind && parsed.every((it) => isCommand(it))) {
    return parseCommandArray(parsed, 'commands');
  }

  // (D) Mixed: itens podem ser comando ou {kind: ...}
  return parseCommandArray(parsed, 'mixed');
}

function parseGroupedObject(obj: Record<string, unknown>): ParseResult {
  const ops: ParsedOp[] = [];
  const errors: string[] = [];

  const groups: { key: string; table: TableName }[] = [
    { key: 'posts', table: 'social_posts' },
    { key: 'social_posts', table: 'social_posts' },
    { key: 'tasks', table: 'agenda_tasks' },
    { key: 'agenda_tasks', table: 'agenda_tasks' },
    { key: 'objectives', table: 'agenda_objectives' },
    { key: 'agenda_objectives', table: 'agenda_objectives' },
  ];

  let touchedAny = false;
  for (const { key, table } of groups) {
    const arr = obj[key];
    if (arr === undefined) continue;
    touchedAny = true;
    if (!Array.isArray(arr)) {
      errors.push(`Chave "${key}" precisa ser array`);
      continue;
    }
    arr.forEach((raw, idx) => {
      const label = `${key}[${idx}]`;
      if (!isPlainObject(raw)) {
        errors.push(`${label}: não é objeto`);
        return;
      }
      // Se trouxer "action", trata como comando.
      if (isCommand(raw)) {
        const r = parseCommand(raw, label);
        if (r.ok) ops.push(r.op);
        else errors.push(r.error);
        return;
      }
      const built = buildCreate(table, raw, label);
      if (built.ok) ops.push({ kind: 'create', table, data: built.data, sourceLabel: label });
      else errors.push(built.error);
    });
  }

  if (!touchedAny) {
    return {
      ops: [],
      errors: ['Objeto sem chaves reconhecidas (use posts | tasks | objectives)'],
      detectedMode: 'unknown',
    };
  }

  return { ops, errors, detectedMode: 'grouped' };
}

function parseLegacyPostsArray(arr: unknown[]): ParseResult {
  const ops: ParsedOp[] = [];
  const errors: string[] = [];
  arr.forEach((raw, idx) => {
    const label = `Item ${idx + 1}`;
    if (!isPlainObject(raw)) {
      errors.push(`${label}: não é objeto`);
      return;
    }
    const built = buildPostCreate(raw, label);
    if (built.ok) ops.push({ kind: 'create', table: 'social_posts', data: built.data, sourceLabel: label });
    else errors.push(built.error);
  });
  return { ops, errors, detectedMode: 'legacy_posts' };
}

function parseCommandArray(arr: unknown[], mode: 'commands' | 'mixed'): ParseResult {
  const ops: ParsedOp[] = [];
  const errors: string[] = [];
  arr.forEach((raw, idx) => {
    const label = `Item ${idx + 1}`;
    if (!isPlainObject(raw)) {
      errors.push(`${label}: não é objeto`);
      return;
    }
    if (isCommand(raw)) {
      const r = parseCommand(raw, label);
      if (r.ok) ops.push(r.op);
      else errors.push(r.error);
      return;
    }
    const kindTable = tableFromKind((raw as Record<string, unknown>).kind);
    if (kindTable) {
      const built = buildCreate(kindTable, raw, label);
      if (built.ok) ops.push({ kind: 'create', table: kindTable, data: built.data, sourceLabel: label });
      else errors.push(built.error);
      return;
    }
    errors.push(`${label}: sem "action" nem "kind" reconhecido (use kind: post | task | objective ou action: create | update | delete | advance_status)`);
  });
  return { ops, errors, detectedMode: mode };
}

/* ─────────────────────────────────────────────────────────────────────
   Resumo agrupado (pra preview do modal)
   ───────────────────────────────────────────────────────────────────── */

export interface OpSummary {
  posts: { create: number; update: number; delete: number; advance: number };
  tasks: { create: number; update: number; delete: number };
  objectives: { create: number; update: number; delete: number };
  total: number;
}

export function summarizeOps(ops: ParsedOp[]): OpSummary {
  const s: OpSummary = {
    posts: { create: 0, update: 0, delete: 0, advance: 0 },
    tasks: { create: 0, update: 0, delete: 0 },
    objectives: { create: 0, update: 0, delete: 0 },
    total: 0,
  };
  for (const op of ops) {
    if (op.table === 'social_posts') {
      if (op.kind === 'create') s.posts.create++;
      else if (op.kind === 'update') s.posts.update++;
      else if (op.kind === 'delete') s.posts.delete += op.ids.length;
      else if (op.kind === 'advance_status') s.posts.advance += op.ids.length;
    } else if (op.table === 'agenda_tasks') {
      if (op.kind === 'create') s.tasks.create++;
      else if (op.kind === 'update') s.tasks.update++;
      else if (op.kind === 'delete') s.tasks.delete += op.ids.length;
    } else if (op.table === 'agenda_objectives') {
      if (op.kind === 'create') s.objectives.create++;
      else if (op.kind === 'update') s.objectives.update++;
      else if (op.kind === 'delete') s.objectives.delete += op.ids.length;
    }
    s.total += op.kind === 'delete' || op.kind === 'advance_status' ? op.ids.length : 1;
  }
  return s;
}

/* ─────────────────────────────────────────────────────────────────────
   Execução
   ───────────────────────────────────────────────────────────────────── */

function emptyExec(): ExecResult {
  return {
    social_posts: { created: 0, updated: 0, deleted: 0, advanced: 0 },
    agenda_tasks: { created: 0, updated: 0, deleted: 0, advanced: 0 },
    agenda_objectives: { created: 0, updated: 0, deleted: 0, advanced: 0 },
    errors: [],
  };
}

function nextStatusKey(s: Status): Status | null {
  const idx = VALID_STATUSES.indexOf(s);
  if (idx < 0 || idx >= VALID_STATUSES.length - 1) return null;
  return VALID_STATUSES[idx + 1];
}

export async function executeBatch(ops: ParsedOp[]): Promise<ExecResult> {
  const result = emptyExec();
  if (ops.length === 0) return result;

  const user = (await supabase.auth.getUser()).data.user;
  const createdBy = user?.id || null;

  // Agrupa creates por tabela pra um único insert por tabela.
  const createsByTable: Record<TableName, Record<string, unknown>[]> = {
    social_posts: [],
    agenda_tasks: [],
    agenda_objectives: [],
  };

  // Updates / deletes / advances vão sequenciais, agrupando deletes por tabela.
  const deletesByTable: Record<TableName, string[]> = {
    social_posts: [],
    agenda_tasks: [],
    agenda_objectives: [],
  };
  const advancePostIds: string[] = [];
  const updateOps: Extract<ParsedOp, { kind: 'update' }>[] = [];

  for (const op of ops) {
    if (op.kind === 'create') {
      createsByTable[op.table].push({ ...op.data, created_by: createdBy });
    } else if (op.kind === 'update') {
      updateOps.push(op);
    } else if (op.kind === 'delete') {
      for (const id of op.ids) deletesByTable[op.table].push(id);
    } else if (op.kind === 'advance_status') {
      for (const id of op.ids) advancePostIds.push(id);
    }
  }

  // 1) Inserts em batch por tabela
  for (const table of TABLE_NAMES) {
    const rows = createsByTable[table];
    if (rows.length === 0) continue;
    const { error } = await supabase.from(table).insert(rows);
    if (error) {
      result.errors.push(`Insert em ${table}: ${error.message}`);
    } else {
      result[table].created += rows.length;
    }
  }

  // 2) Updates individuais (cada um tem patch único)
  for (const op of updateOps) {
    const { error } = await supabase.from(op.table).update(op.patch).eq('id', op.id);
    if (error) {
      result.errors.push(`Update ${op.table}#${op.id}: ${error.message}`);
    } else {
      result[op.table].updated++;
    }
  }

  // 3) Deletes em batch por tabela
  for (const table of TABLE_NAMES) {
    const ids = deletesByTable[table];
    if (ids.length === 0) continue;
    const { error } = await supabase.from(table).delete().in('id', ids);
    if (error) {
      result.errors.push(`Delete em ${table}: ${error.message}`);
    } else {
      result[table].deleted += ids.length;
    }
  }

  // 4) advance_status em social_posts: lê status atuais, agrupa por novo status, atualiza em batch.
  if (advancePostIds.length > 0) {
    const { data: rows, error: readErr } = await supabase
      .from('social_posts')
      .select('id, status')
      .in('id', advancePostIds);
    if (readErr) {
      result.errors.push(`advance_status (read): ${readErr.message}`);
    } else if (rows) {
      const byNext = new Map<Status, string[]>();
      for (const r of rows as { id: string; status: Status }[]) {
        const next = nextStatusKey(r.status);
        if (!next) continue; // já em 'postado' — ignora silenciosamente
        const arr = byNext.get(next) || [];
        arr.push(r.id);
        byNext.set(next, arr);
      }
      for (const [next, ids] of byNext) {
        const { error } = await supabase.from('social_posts').update({ status: next }).in('id', ids);
        if (error) {
          result.errors.push(`advance_status → ${next}: ${error.message}`);
        } else {
          result.social_posts.advanced += ids.length;
        }
      }
    }
  }

  return result;
}

/* =====================================================================
   Export pro Cowork
   ===================================================================== */

export type ExportScope = 'all' | 'this_week' | 'this_month' | 'next_30_days' | 'custom';

export interface ExportFilters {
  scope: ExportScope;
  customStart: string | null;
  customEnd: string | null;
  accounts: 'all' | Account;
  tables: {
    posts: boolean;
    tasks: boolean;
    objectives: boolean;
    external_events: boolean;
  };
}

export interface ExportRange {
  /** YYYY-MM-DD inclusivo. null = sem limite. */
  start: string | null;
  end: string | null;
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
}

export function resolveRange(filters: ExportFilters, today: Date = new Date()): ExportRange {
  switch (filters.scope) {
    case 'all':
      return { start: null, end: null };
    case 'this_week': {
      const monday = getMonday(today);
      const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
      return { start: dateKey(monday), end: dateKey(sunday) };
    }
    case 'this_month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // último dia do mês
      return { start: dateKey(start), end: dateKey(end) };
    }
    case 'next_30_days': {
      const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);
      return { start: dateKey(today), end: dateKey(end) };
    }
    case 'custom':
      return {
        start: filters.customStart && ISO_DATE_RE.test(filters.customStart) ? filters.customStart : null,
        end: filters.customEnd && ISO_DATE_RE.test(filters.customEnd) ? filters.customEnd : null,
      };
  }
}

function inRange(date: string | null, range: ExportRange): boolean {
  if (!date) return range.start === null && range.end === null; // sem data → entra só em "all"
  if (range.start !== null && date < range.start) return false;
  if (range.end !== null && date > range.end) return false;
  return true;
}

export interface ExternalEventExport {
  feed_label: string;
  title: string;
  date: string;
  all_day: boolean;
}

export interface ExportSummary {
  posts: {
    total: number;
    by_status: Record<string, number>;
    by_account: Record<string, number>;
  };
  tasks: {
    total: number;
    by_status: Record<string, number>;
  };
  objectives: {
    monthly: number;
    weekly: number;
    open: number;
    done: number;
  };
  external_events: { total: number };
}

export interface ExportPayload {
  exported_at: string;
  scope: ExportScope;
  range: ExportRange;
  filters: {
    accounts: 'all' | Account;
    tables: ExportFilters['tables'];
  };
  summary: ExportSummary;
  posts?: Omit<SocialPost, 'created_by'>[];
  tasks?: Omit<AgendaTask, 'created_by'>[];
  objectives?: Omit<AgendaObjective, 'created_by'>[];
  external_events?: ExternalEventExport[];
}

/** Remove chave 'created_by' (privacidade) sem perder tipo nas chaves restantes. */
function stripCreatedBy<T extends { created_by?: unknown }>(row: T): Omit<T, 'created_by'> {
  const { created_by: _omit, ...rest } = row;
  void _omit;
  return rest;
}

export interface ExportInputs {
  posts: SocialPost[];
  tasks: AgendaTask[];
  objectives: AgendaObjective[];
  externalEvents: Map<string, ExternalEvent[]>;
}

export function buildExport(filters: ExportFilters, inputs: ExportInputs, now: Date = new Date()): ExportPayload {
  const range = resolveRange(filters, now);

  // Posts: filtra por range (em scheduled_for) e conta.
  let posts = inputs.posts;
  if (filters.accounts !== 'all') {
    posts = posts.filter((p) => p.account === filters.accounts);
  }
  posts = posts.filter((p) => inRange(p.scheduled_for, range));

  // Tasks: filtra por range (due_date).
  const tasks = inputs.tasks.filter((t) => inRange(t.due_date, range));

  // Objectives: filtra por range (target_date).
  const objectives = inputs.objectives.filter((o) => inRange(o.target_date, range));

  // External events: aplaina o Map e filtra por range.
  const externalEvents: ExternalEventExport[] = [];
  for (const [date, list] of inputs.externalEvents) {
    if (!inRange(date, range)) continue;
    for (const e of list) {
      externalEvents.push({
        feed_label: e.feedLabel,
        title: e.title,
        date,
        all_day: true,
      });
    }
  }

  const summary: ExportSummary = {
    posts: {
      total: posts.length,
      by_status: {},
      by_account: {},
    },
    tasks: {
      total: tasks.length,
      by_status: {},
    },
    objectives: {
      monthly: 0,
      weekly: 0,
      open: 0,
      done: 0,
    },
    external_events: { total: externalEvents.length },
  };

  for (const p of posts) {
    summary.posts.by_status[p.status] = (summary.posts.by_status[p.status] || 0) + 1;
    summary.posts.by_account[p.account] = (summary.posts.by_account[p.account] || 0) + 1;
  }
  for (const t of tasks) {
    summary.tasks.by_status[t.status] = (summary.tasks.by_status[t.status] || 0) + 1;
  }
  for (const o of objectives) {
    if (o.scope === 'monthly') summary.objectives.monthly++;
    else if (o.scope === 'weekly') summary.objectives.weekly++;
    if (o.status === 'open') summary.objectives.open++;
    else if (o.status === 'done') summary.objectives.done++;
  }

  const payload: ExportPayload = {
    exported_at: now.toISOString(),
    scope: filters.scope,
    range,
    filters: {
      accounts: filters.accounts,
      tables: filters.tables,
    },
    summary,
  };

  if (filters.tables.posts) payload.posts = posts.map(stripCreatedBy);
  if (filters.tables.tasks) payload.tasks = tasks.map(stripCreatedBy);
  if (filters.tables.objectives) payload.objectives = objectives.map(stripCreatedBy);
  if (filters.tables.external_events) payload.external_events = externalEvents;

  return payload;
}
