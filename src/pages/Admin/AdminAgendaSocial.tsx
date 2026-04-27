import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './AdminAgendaSocial.module.css';
import IdeaGeneratorModal from './AdminAgendaSocialIdeaGenerator';
import CalendarView from './AdminAgendaSocialCalendar';
import PlanView, { type AgendaObjective, type AgendaTask } from './AdminAgendaSocialPlan';
import FeedManagerModal from './AdminAgendaSocialFeedManager';
import { useCalendarFeeds, type ExternalEvent } from './AdminAgendaSocialFeeds';
import {
  buildExport,
  executeBatch,
  parseBatch,
  resolveRange,
  summarizeOps,
  type ExecResult,
  type ExportFilters,
  type ExportScope,
  type OpSummary,
  type ParseResult,
} from './AdminAgendaSocialProtocol';

// =====================================================================
// Tipos
// =====================================================================
export type Account = 'nzppf' | 'nzgroup' | 'joaowrap';
export type Status = 'backlog' | 'em_producao' | 'pronto' | 'agendado' | 'postado';

export interface ChecklistItem {
  label: string;
  done: boolean;
}

export interface SocialPost {
  id: string;
  account: Account;
  pillar: string | null;
  title: string;
  caption: string | null;
  format: string | null;
  asset_url: string | null;
  scheduled_for: string | null; // 'YYYY-MM-DD'
  status: Status;
  notes: string | null;
  checklist: ChecklistItem[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// =====================================================================
// Constantes
// =====================================================================
const STATUSES: { id: Status; label: string }[] = [
  { id: 'backlog',     label: 'Backlog' },
  { id: 'em_producao', label: 'Em Produção' },
  { id: 'pronto',      label: 'Pronto' },
  { id: 'agendado',    label: 'Agendado' },
  { id: 'postado',     label: 'Postado' },
];

const ACCOUNTS: { id: Account; label: string; tag: string; color: string }[] = [
  { id: 'nzppf',    label: '@nzppf',     tag: 'NZPPF',    color: '#D11E1E' },
  { id: 'nzgroup',  label: '@nzgroup.br', tag: 'NZGROUP', color: '#0A0A0A' },
  { id: 'joaowrap', label: '@joaowrap',  tag: 'JOAOWRAP', color: '#4A90D9' },
];

const FORMATS = ['Foto', 'Carrossel', 'Reel', 'Story'];

export const PILLARS_BY_ACCOUNT: Record<Account, string[]> = {
  nzppf: [
    'Showcase Luxury', 'Showcase Prime', 'Showcase Flow', 'Showcase Core',
    'Showcase Headlight', 'Showcase Windshield',
    'Educativo Técnico', 'B2B Lojista', 'Lançamento',
  ],
  nzgroup: [
    'Catálogo NZ Wrap', 'Catálogo SH Wrapping', 'Catálogo Oracal 651', 'Catálogo Oracal 670',
    'Captação Lojista', 'Mercado', 'Bastidor logístico', 'NZ Academy',
  ],
  joaowrap: [
    'Autoridade Técnica', 'Bastidor Empreendedor', 'Educação Aplicador', 'Lifestyle',
  ],
};

const CHECKLIST_TEMPLATES: Record<string, string[]> = {
  'Foto':      ['Foto escolhida', 'Edição rápida', 'Legenda colada', 'Hashtags revisadas', 'Agendado no Meta Business'],
  'Carrossel': ['Roteiro de 3-5 cards', 'Cards desenhados/montados', 'Capa criada', 'Legenda colada', 'Hashtags revisadas', 'Agendado no Meta Business'],
  'Reel':      ['Roteiro escrito', 'Asset gravado', 'Edição feita', 'Capa do reel criada', 'Legenda colada', 'Hashtags revisadas', 'Agendado no Meta Business'],
  'Story':     ['Asset bruto', 'Stickers / CTA inseridos', 'Postado'],
};

// =====================================================================
// Helpers
// =====================================================================
export function accountMeta(a: Account) {
  return ACCOUNTS.find((x) => x.id === a)!;
}

function formatBR(date: string | null) {
  if (!date) return '—';
  const [, m, d] = date.split('-');
  return `${d}/${m}`;
}

function nextStatus(s: Status): Status | null {
  const idx = STATUSES.findIndex((x) => x.id === s);
  return idx >= 0 && idx < STATUSES.length - 1 ? STATUSES[idx + 1].id : null;
}

function prevStatus(s: Status): Status | null {
  const idx = STATUSES.findIndex((x) => x.id === s);
  return idx > 0 ? STATUSES[idx - 1].id : null;
}

export function templateChecklist(format: string | null | undefined): ChecklistItem[] {
  if (!format) return [];
  const labels = CHECKLIST_TEMPLATES[format];
  if (!labels) return [];
  return labels.map((label) => ({ label, done: false }));
}

function checklistProgress(items: ChecklistItem[] | undefined | null): { done: number; total: number } {
  const list = items || [];
  return { done: list.filter((i) => i.done).length, total: list.length };
}

/** Garante que post vindo da DB tenha checklist como array (defensivo). */
function normalizePost(p: SocialPost): SocialPost {
  return { ...p, checklist: Array.isArray(p.checklist) ? p.checklist : [] };
}

/**
 * Formata Date local em 'YYYY-MM-DD' (sem timezone shift do toISOString).
 * Exportado pra ser usado também em AdminAgendaSocialCalendar.
 */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// Estado vazio para criar novo
const emptyPost = (): Partial<SocialPost> => ({
  account: 'nzppf',
  status: 'backlog',
  title: '',
  pillar: '',
  format: 'Foto',
  caption: '',
  asset_url: '',
  scheduled_for: '',
  notes: '',
  checklist: templateChecklist('Foto'),
});

// =====================================================================
// Componente principal
// =====================================================================
export default function AdminAgendaSocial() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterAccount, setFilterAccount] = useState<Account | 'all'>('all');
  const [view, setView] = useState<'kanban' | 'calendar' | 'plan'>('kanban');
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => startOfMonth(new Date()));

  // Feeds externos (iCal overlay) — compartilhados entre Calendar e Plan
  const calendarFeeds = useCalendarFeeds();

  // Modal de gerenciar feeds (aberto a partir do botão 🔗 no Calendar header)
  const [feedManagerOpen, setFeedManagerOpen] = useState(false);

  // Task pré-preenchida vinda do botão "+ tarefa" no card do post (kanban)
  // Quando setada, força view 'plan' que abre o TaskModal automaticamente.
  const [pendingTask, setPendingTask] = useState<Partial<AgendaTask> | null>(null);

  // Modal de criar/editar
  const [editing, setEditing] = useState<Partial<SocialPost> | null>(null);
  const [saving, setSaving] = useState(false);

  // Modal de gerar ideias
  const [ideasOpen, setIdeasOpen] = useState(false);

  // Modal de importação em lote (protocolo Cowork — entrada)
  const [importOpen, setImportOpen] = useState(false);
  // Modal de exportação (protocolo Cowork — saída)
  const [exportOpen, setExportOpen] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('social_posts')
      .select('*')
      .order('scheduled_for', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
    } else if (data) {
      setPosts((data as SocialPost[]).map(normalizePost));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  // Posts filtrados por conta
  const filtered = useMemo(() => {
    if (filterAccount === 'all') return posts;
    return posts.filter((p) => p.account === filterAccount);
  }, [posts, filterAccount]);

  // Agrupados por status (kanban)
  const grouped = useMemo(() => {
    const g: Record<Status, SocialPost[]> = {
      backlog: [], em_producao: [], pronto: [], agendado: [], postado: [],
    };
    for (const p of filtered) g[p.status].push(p);
    return g;
  }, [filtered]);

  // Agrupados por data (calendário)
  const postsByDate = useMemo(() => {
    const map = new Map<string, SocialPost[]>();
    for (const p of filtered) {
      if (!p.scheduled_for) continue;
      const arr = map.get(p.scheduled_for) || [];
      arr.push(p);
      map.set(p.scheduled_for, arr);
    }
    return map;
  }, [filtered]);

  // Counts gerais (para a barra de stats)
  const stats = useMemo(() => {
    const counts: Record<Status, number> = {
      backlog: 0, em_producao: 0, pronto: 0, agendado: 0, postado: 0,
    };
    for (const p of filtered) counts[p.status]++;
    return counts;
  }, [filtered]);

  // ----- ações -----
  const moveStatus = async (post: SocialPost, dir: 'next' | 'prev') => {
    const newStatus = dir === 'next' ? nextStatus(post.status) : prevStatus(post.status);
    if (!newStatus) return;
    const { error } = await supabase
      .from('social_posts')
      .update({ status: newStatus })
      .eq('id', post.id);
    if (error) { alert('Erro ao mover: ' + error.message); return; }
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, status: newStatus } : p));
  };

  const deletePost = async (post: SocialPost) => {
    if (!confirm(`Apagar "${post.title}"?`)) return;
    const { error } = await supabase.from('social_posts').delete().eq('id', post.id);
    if (error) { alert('Erro ao apagar: ' + error.message); return; }
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
  };

  const savePost = async () => {
    if (!editing || !editing.title?.trim()) {
      alert('Título é obrigatório.');
      return;
    }
    setSaving(true);

    const payload = {
      account:       editing.account,
      pillar:        editing.pillar?.trim() || null,
      title:         editing.title.trim(),
      caption:       editing.caption?.trim() || null,
      format:        editing.format?.trim() || null,
      asset_url:     editing.asset_url?.trim() || null,
      scheduled_for: editing.scheduled_for || null,
      status:        editing.status || 'backlog',
      notes:         editing.notes?.trim() || null,
      checklist:     editing.checklist || [],
    };

    if (editing.id) {
      const { data, error } = await supabase
        .from('social_posts').update(payload).eq('id', editing.id).select().single();
      if (error) { alert('Erro ao salvar: ' + error.message); setSaving(false); return; }
      if (data) setPosts((prev) => prev.map((p) => p.id === data.id ? normalizePost(data as SocialPost) : p));
    } else {
      const user = (await supabase.auth.getUser()).data.user;
      const { data, error } = await supabase
        .from('social_posts')
        .insert({ ...payload, created_by: user?.id || null })
        .select().single();
      if (error) { alert('Erro ao criar: ' + error.message); setSaving(false); return; }
      if (data) setPosts((prev) => [normalizePost(data as SocialPost), ...prev]);
    }
    setSaving(false);
    setEditing(null);
  };

  // =====================================================================
  // Render
  // =====================================================================
  const todayKey = dateKey(new Date());

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Agenda Social Media</h1>
          <p className={styles.subtitle}>Sistema operacional das três contas — @nzppf · @nzgroup.br · @joaowrap</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.viewToggle}>
            <button
              type="button"
              className={`${styles.viewBtn} ${view === 'kanban' ? styles.viewBtnActive : ''}`}
              onClick={() => setView('kanban')}
            >
              📋 Kanban
            </button>
            <button
              type="button"
              className={`${styles.viewBtn} ${view === 'calendar' ? styles.viewBtnActive : ''}`}
              onClick={() => setView('calendar')}
            >
              📅 Calendário
            </button>
            <button
              type="button"
              className={`${styles.viewBtn} ${view === 'plan' ? styles.viewBtnActive : ''}`}
              onClick={() => setView('plan')}
            >
              🎯 Plano
            </button>
          </div>
          <button className={styles.secondaryBtn} onClick={() => setIdeasOpen(true)}>
            💡 Gerar ideias
          </button>
          <button className={styles.secondaryBtn} onClick={() => setImportOpen(true)}>
            📥 Importar / Comandar
          </button>
          <button className={styles.secondaryBtn} onClick={() => setExportOpen(true)}>
            📤 Exportar
          </button>
          <button className={styles.primaryBtn} onClick={() => setEditing(emptyPost())}>
            + Novo post
          </button>
        </div>
      </header>

      {/* Filtros + stats */}
      <div className={styles.controls}>
        <div className={styles.filterGroup}>
          <button
            className={`${styles.filterBtn} ${filterAccount === 'all' ? styles.filterBtnActive : ''}`}
            onClick={() => setFilterAccount('all')}
          >
            Todos
          </button>
          {ACCOUNTS.map((a) => (
            <button
              key={a.id}
              className={`${styles.filterBtn} ${filterAccount === a.id ? styles.filterBtnActive : ''}`}
              onClick={() => setFilterAccount(a.id)}
              style={filterAccount === a.id ? { borderColor: a.color, color: a.color } : undefined}
            >
              {a.label}
            </button>
          ))}
        </div>
        <div className={styles.stats}>
          {STATUSES.map((s) => (
            <div key={s.id} className={styles.statChip}>
              <span className={styles.statLabel}>{s.label}</span>
              <span className={styles.statValue}>{stats[s.id]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Estado de loading/error */}
      {loading && <div className={styles.placeholder}>Carregando posts…</div>}
      {error && (
        <div className={styles.errorBox}>
          Erro: {error}
          <br />
          <small>Confira se a tabela <code>social_posts</code> foi criada no Supabase (rode o SQL <code>social_posts.sql</code>) e se a coluna <code>checklist</code> foi adicionada (<code>social_posts_v2.sql</code>).</small>
        </div>
      )}

      {/* Kanban */}
      {!loading && !error && view === 'kanban' && (
        <div className={styles.board}>
          {STATUSES.map((s) => (
            <div key={s.id} className={styles.column}>
              <div className={styles.columnHeader}>
                <span>{s.label}</span>
                <span className={styles.columnCount}>{grouped[s.id].length}</span>
              </div>
              <div className={styles.cardList}>
                {grouped[s.id].length === 0 && (
                  <div className={styles.emptyCol}>—</div>
                )}
                {grouped[s.id].map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onAdvance={() => moveStatus(post, 'next')}
                    onRetreat={() => moveStatus(post, 'prev')}
                    onEdit={() => setEditing(post)}
                    onDelete={() => deletePost(post)}
                    onCreateTask={() => {
                      setPendingTask({
                        title: `Tarefa: ${post.title}`,
                        description: '',
                        due_date: post.scheduled_for,
                        status: 'pending',
                        priority: 2,
                        social_post_id: post.id,
                      });
                      setView('plan');
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calendário */}
      {!loading && !error && view === 'calendar' && (
        <CalendarView
          month={calendarMonth}
          postsByDate={postsByDate}
          externalEvents={calendarFeeds.events}
          todayKey={todayKey}
          onPrevMonth={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          onNextMonth={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          onToday={() => setCalendarMonth(startOfMonth(new Date()))}
          onChipClick={(p) => setEditing(p)}
          onEmptyClick={(dateStr) => setEditing({ ...emptyPost(), scheduled_for: dateStr })}
          onOpenFeedManager={() => setFeedManagerOpen(true)}
        />
      )}

      {/* Plano */}
      {!loading && !error && view === 'plan' && (
        <PlanView
          posts={filtered}
          externalEvents={calendarFeeds.events}
          pendingTask={pendingTask}
          onPendingTaskConsumed={() => setPendingTask(null)}
          onPostEdit={(p) => setEditing(p)}
        />
      )}

      {/* Modal de criar/editar */}
      {editing && (
        <PostModal
          draft={editing}
          setDraft={setEditing}
          onClose={() => setEditing(null)}
          onSave={savePost}
          saving={saving}
        />
      )}

      {/* Modal de gerar ideias */}
      {ideasOpen && (
        <IdeaGeneratorModal
          defaultAccount={filterAccount === 'all' ? 'nzppf' : filterAccount}
          onClose={() => setIdeasOpen(false)}
          onCreated={loadPosts}
        />
      )}

      {/* Modal de importação em lote (Protocolo Cowork — entrada) */}
      {importOpen && (
        <ProtocolImportModal
          onClose={() => setImportOpen(false)}
          onExecuted={loadPosts}
        />
      )}

      {/* Modal de exportação (Protocolo Cowork — saída) */}
      {exportOpen && (
        <ProtocolExportModal
          posts={posts}
          externalEvents={calendarFeeds.events}
          onClose={() => setExportOpen(false)}
        />
      )}

      {/* Modal de gerenciamento de feeds externos (Calendário) */}
      {feedManagerOpen && (
        <FeedManagerModal
          feeds={calendarFeeds.feeds}
          events={calendarFeeds.events}
          errors={calendarFeeds.errors}
          onClose={() => setFeedManagerOpen(false)}
          onChange={calendarFeeds.reload}
        />
      )}
    </div>
  );
}

// =====================================================================
// Card individual
// =====================================================================
interface CardProps {
  post: SocialPost;
  onAdvance: () => void;
  onRetreat: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCreateTask: () => void;
}

function PostCard({ post, onAdvance, onRetreat, onEdit, onDelete, onCreateTask }: CardProps) {
  const acct = accountMeta(post.account);
  const canAdvance = nextStatus(post.status) !== null;
  const canRetreat = prevStatus(post.status) !== null;
  const progress = checklistProgress(post.checklist);

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <span
          className={styles.accountBadge}
          style={{ background: acct.color }}
        >
          {acct.tag}
        </span>
        {post.format && <span className={styles.formatTag}>{post.format}</span>}
      </div>
      <div className={styles.cardTitle} onClick={onEdit} role="button" tabIndex={0}>
        {post.title}
      </div>
      {post.pillar && <div className={styles.cardPillar}>{post.pillar}</div>}
      <div className={styles.cardMeta}>
        <span>📅 {formatBR(post.scheduled_for)}</span>
        {post.asset_url && (
          <a className={styles.cardLink} href={post.asset_url} target="_blank" rel="noreferrer">
            asset ↗
          </a>
        )}
      </div>
      {progress.total > 0 && (
        <div className={styles.cardChecklist}>
          <span className={styles.cardChecklistLabel}>🗸 {progress.done}/{progress.total}</span>
          <div className={styles.cardChecklistBar}>
            <div
              className={styles.cardChecklistBarFill}
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
      <div className={styles.cardActions}>
        <button
          className={styles.iconBtn}
          onClick={onRetreat}
          disabled={!canRetreat}
          title="Voltar status"
        >
          ←
        </button>
        <button className={styles.iconBtn} onClick={onEdit} title="Editar">✎</button>
        <button className={styles.iconBtn} onClick={onCreateTask} title="Criar tarefa vinculada">+T</button>
        <button className={styles.iconBtnDanger} onClick={onDelete} title="Apagar">×</button>
        <button
          className={styles.iconBtn}
          onClick={onAdvance}
          disabled={!canAdvance}
          title="Avançar status"
        >
          →
        </button>
      </div>
    </div>
  );
}

// =====================================================================
// Modal de criar/editar
// =====================================================================
interface ModalProps {
  draft: Partial<SocialPost>;
  setDraft: (d: Partial<SocialPost>) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}

function PostModal({ draft, setDraft, onClose, onSave, saving }: ModalProps) {
  const isEdit = !!draft.id;
  const account = (draft.account || 'nzppf') as Account;
  const pillarOptions = PILLARS_BY_ACCOUNT[account];
  const checklist = draft.checklist || [];
  const progress = checklistProgress(checklist);

  function handleFormatChange(newFormat: string) {
    const hasDone = checklist.some((i) => i.done);
    if (hasDone && !confirm('Mudar formato vai resetar a checklist atual. Continuar?')) {
      return;
    }
    setDraft({ ...draft, format: newFormat, checklist: templateChecklist(newFormat) });
  }

  function updateChecklistItem(idx: number, patch: Partial<ChecklistItem>) {
    const next = checklist.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    setDraft({ ...draft, checklist: next });
  }

  function removeChecklistItem(idx: number) {
    const next = checklist.filter((_, i) => i !== idx);
    setDraft({ ...draft, checklist: next });
  }

  function addChecklistItem() {
    const next = [...checklist, { label: 'Novo item', done: false }];
    setDraft({ ...draft, checklist: next });
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h2>{isEdit ? 'Editar post' : 'Novo post'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </header>

        <div className={styles.modalBody}>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>
              Conta
              <select
                className={styles.formInput}
                value={account}
                onChange={(e) => setDraft({ ...draft, account: e.target.value as Account, pillar: '' })}
              >
                {ACCOUNTS.map((a) => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
            </label>
            <label className={styles.formLabel}>
              Status
              <select
                className={styles.formInput}
                value={draft.status || 'backlog'}
                onChange={(e) => setDraft({ ...draft, status: e.target.value as Status })}
              >
                {STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label className={styles.formLabel}>
            Título do card *
            <input
              className={styles.formInput}
              value={draft.title || ''}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder='ex: "RAM cromada @adesivotech"'
            />
          </label>

          <div className={styles.formRow}>
            <label className={styles.formLabel}>
              Pilar / linha
              <input
                className={styles.formInput}
                value={draft.pillar || ''}
                onChange={(e) => setDraft({ ...draft, pillar: e.target.value })}
                list="pillar-options"
                placeholder="ex: Showcase Luxury"
              />
              <datalist id="pillar-options">
                {pillarOptions.map((p) => <option key={p} value={p} />)}
              </datalist>
            </label>
            <label className={styles.formLabel}>
              Formato
              <select
                className={styles.formInput}
                value={draft.format || 'Foto'}
                onChange={(e) => handleFormatChange(e.target.value)}
              >
                {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </label>
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel}>
              Data prevista
              <input
                type="date"
                className={styles.formInput}
                value={draft.scheduled_for || ''}
                onChange={(e) => setDraft({ ...draft, scheduled_for: e.target.value })}
              />
            </label>
            <label className={styles.formLabel}>
              Asset (URL)
              <input
                className={styles.formInput}
                value={draft.asset_url || ''}
                onChange={(e) => setDraft({ ...draft, asset_url: e.target.value })}
                placeholder="link Drive, pasta, foto…"
              />
            </label>
          </div>

          <label className={styles.formLabel}>
            Legenda completa
            <textarea
              className={styles.formTextarea}
              rows={6}
              value={draft.caption || ''}
              onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
              placeholder="Cole aqui a legenda do banco ou escreva direto."
            />
          </label>

          <label className={styles.formLabel}>
            Notas internas
            <textarea
              className={styles.formTextarea}
              rows={2}
              value={draft.notes || ''}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder="Anotações, lembretes, referências…"
            />
          </label>

          {/* Checklist de produção */}
          <div className={styles.checklistSection}>
            <header className={styles.checklistHeader}>
              <span className={styles.checklistTitle}>Checklist de produção</span>
              <span className={styles.checklistCount}>
                {progress.done}/{progress.total}
              </span>
            </header>
            <div className={styles.checklistBar}>
              <div
                className={styles.checklistBarFill}
                style={{ width: progress.total ? `${(progress.done / progress.total) * 100}%` : '0%' }}
              />
            </div>
            <div className={styles.checklistItems}>
              {checklist.map((item, i) => (
                <ChecklistRow
                  key={i}
                  item={item}
                  onToggle={() => updateChecklistItem(i, { done: !item.done })}
                  onLabelChange={(label) => updateChecklistItem(i, { label })}
                  onRemove={() => removeChecklistItem(i)}
                />
              ))}
              <button type="button" className={styles.checklistAddBtn} onClick={addChecklistItem}>
                + Adicionar item
              </button>
            </div>
          </div>
        </div>

        <footer className={styles.modalFooter}>
          <button className={styles.secondaryBtn} onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className={styles.primaryBtn} onClick={onSave} disabled={saving}>
            {saving ? 'Salvando…' : (isEdit ? 'Salvar alterações' : 'Criar post')}
          </button>
        </footer>
      </div>
    </div>
  );
}

// =====================================================================
// Linha da checklist (com edição inline do label)
// =====================================================================
interface ChecklistRowProps {
  item: ChecklistItem;
  onToggle: () => void;
  onLabelChange: (label: string) => void;
  onRemove: () => void;
}

function ChecklistRow({ item, onToggle, onLabelChange, onRemove }: ChecklistRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.label);

  // Sincroniza o draft local quando o label do item muda externamente.
  useEffect(() => { setDraft(item.label); }, [item.label]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== item.label) {
      onLabelChange(trimmed);
    } else {
      setDraft(item.label);
    }
    setEditing(false);
  }

  return (
    <div className={`${styles.checklistRow} ${item.done ? styles.checklistRowDone : ''}`}>
      <input
        type="checkbox"
        className={styles.checklistCheckbox}
        checked={item.done}
        onChange={onToggle}
      />
      {editing ? (
        <input
          className={styles.checklistEditInput}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setDraft(item.label); setEditing(false); }
          }}
          autoFocus
        />
      ) : (
        <span
          className={styles.checklistLabel}
          onClick={() => setEditing(true)}
          title="Clique para editar"
        >
          {item.label}
        </span>
      )}
      <button
        type="button"
        className={styles.checklistRemoveBtn}
        onClick={onRemove}
        title="Remover item"
      >
        ×
      </button>
    </div>
  );
}

// =====================================================================
// Protocolo Cowork — Importar / Comandar (modal de entrada)
// =====================================================================
//
// O modal aceita 4 formatos JSON: array legado de posts, objeto agrupado
// (posts/tasks/objectives), array de comandos, ou misto. A lógica pura de
// parsing/dispatch vive em AdminAgendaSocialProtocol.ts. TSV foi mantido
// por compatibilidade só pra formato legado.
//
// Validação tolerante: erros não bloqueiam — executa válidos, lista
// ignorados com motivo. Confirmação extra antes de delete > 5.

type ImportFormat = 'json' | 'tsv';

const JSON_PLACEHOLDER = `[
  { "action": "create", "table": "social_posts",
    "data": { "account": "nzppf", "title": "RAM cromada @adesivotech",
              "format": "Reel", "scheduled_for": "2026-04-29" } },
  { "action": "create", "table": "agenda_tasks",
    "data": { "title": "Visitar @adesivotech", "due_date": "2026-04-29",
              "priority": 1 } },
  { "action": "advance_status", "table": "social_posts",
    "ids": ["uuid-do-post"] }
]`;

const TSV_PLACEHOLDER = `account\ttitle\tformat\tpillar\tscheduled_for
nzppf\tRAM cromada @adesivotech\tReel\tShowcase Luxury\t2026-04-29
nzgroup\tCor da semana: Stuttgart\tCarrossel\tCatálogo NZ Wrap\t`;

/** Detecção tolerante de TSV antigo: header tem "account" e há tabs. */
function looksLikeTsv(text: string): boolean {
  const first = text.split(/\r?\n/, 1)[0] || '';
  return first.includes('\t') && /\baccount\b/i.test(first);
}

/**
 * Pra TSV (formato legado, só posts): converte pra JSON array de objetos
 * e dispara o parser unificado. Mantém a UX antiga viva sem duplicar lógica.
 */
function tsvToLegacyArray(text: string): { array: Record<string, unknown>[]; errors: string[] } {
  const errors: string[] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) {
    errors.push('TSV precisa de header + ao menos uma linha de dados');
    return { array: [], errors };
  }
  const headers = lines[0].split('\t').map((h) => h.trim().toLowerCase());
  const out: Record<string, unknown>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    const row: Record<string, unknown> = {};
    headers.forEach((h, j) => { row[h] = cols[j] ?? ''; });
    out.push(row);
  }
  return { array: out, errors };
}

interface ProtocolImportProps {
  onClose: () => void;
  onExecuted: () => void;
}

function ProtocolImportModal({ onClose, onExecuted }: ProtocolImportProps) {
  const [format, setFormat] = useState<ImportFormat>('json');
  const [text, setText] = useState('');
  const [executing, setExecuting] = useState(false);

  // Parsing reativo. TSV converte pro caminho JSON antes de chamar parseBatch.
  const parseRes: ParseResult = useMemo(() => {
    if (!text.trim()) return { ops: [], errors: [], detectedMode: 'empty' };
    if (format === 'tsv') {
      const { array, errors } = tsvToLegacyArray(text);
      if (errors.length) return { ops: [], errors, detectedMode: 'unknown' };
      return parseBatch(JSON.stringify(array));
    }
    return parseBatch(text);
  }, [text, format]);

  const summary: OpSummary = useMemo(() => summarizeOps(parseRes.ops), [parseRes.ops]);

  // Conta total de IDs marcados pra delete (usado pra confirm > 5).
  const deleteIdCount = useMemo(
    () => parseRes.ops.reduce((n, op) => (op.kind === 'delete' ? n + op.ids.length : n), 0),
    [parseRes.ops]
  );

  async function handleExecute() {
    if (parseRes.ops.length === 0) return;
    if (deleteIdCount > 5) {
      const ok = confirm(`Você está prestes a apagar ${deleteIdCount} registros. Continuar?`);
      if (!ok) return;
    }
    setExecuting(true);
    const result: ExecResult = await executeBatch(parseRes.ops);
    setExecuting(false);

    const lines: string[] = ['Execução do protocolo Cowork:'];
    pushExecLine(lines, 'posts', result.social_posts);
    pushExecLine(lines, 'tarefas', result.agenda_tasks);
    pushExecLine(lines, 'objetivos', result.agenda_objectives);
    if (result.errors.length > 0) {
      lines.push('');
      lines.push('Erros:');
      for (const e of result.errors) lines.push('· ' + e);
    }
    alert(lines.join('\n'));

    onExecuted();
    onClose();
  }

  const totalOps = parseRes.ops.length;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${styles.modalWide}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.modalHeader}>
          <h2>📥 Protocolo Cowork — Importar / Comandar</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </header>
        <div className={styles.modalBody}>
          <p className={styles.importSubtitle}>
            Cole o JSON entregue pelo Cowork. Suporta 4 formatos: array legado de
            posts, objeto agrupado, array de comandos, ou misto.
          </p>

          <div className={styles.viewToggle}>
            <button
              type="button"
              className={`${styles.viewBtn} ${format === 'json' ? styles.viewBtnActive : ''}`}
              onClick={() => setFormat('json')}
            >
              JSON
            </button>
            <button
              type="button"
              className={`${styles.viewBtn} ${format === 'tsv' ? styles.viewBtnActive : ''}`}
              onClick={() => {
                setFormat('tsv');
              }}
              title="TSV só suporta posts simples (formato legado)"
            >
              TSV (legado)
            </button>
          </div>

          <textarea
            className={`${styles.formTextarea} ${styles.importTextarea}`}
            value={text}
            onChange={(e) => {
              const v = e.target.value;
              setText(v);
              // Auto-detecta TSV pra evitar usuário esquecer de trocar o toggle.
              if (format === 'json' && looksLikeTsv(v)) setFormat('tsv');
            }}
            placeholder={format === 'json' ? JSON_PLACEHOLDER : TSV_PLACEHOLDER}
            rows={14}
            spellCheck={false}
          />

          {text.trim() !== '' && (
            <ProtocolPreview
              parseRes={parseRes}
              summary={summary}
            />
          )}
        </div>
        <footer className={styles.modalFooter}>
          <button className={styles.secondaryBtn} onClick={onClose} disabled={executing}>
            Cancelar
          </button>
          <button
            className={styles.primaryBtn}
            onClick={handleExecute}
            disabled={executing || totalOps === 0}
          >
            {executing
              ? 'Executando…'
              : totalOps === 0 ? 'Nada pra executar' : `Executar (${totalOps} ${totalOps === 1 ? 'operação' : 'operações'})`}
          </button>
        </footer>
      </div>
    </div>
  );
}

function pushExecLine(
  lines: string[],
  label: string,
  c: { created: number; updated: number; deleted: number; advanced: number }
) {
  const parts: string[] = [];
  if (c.created) parts.push(`${c.created} criados`);
  if (c.updated) parts.push(`${c.updated} atualizados`);
  if (c.deleted) parts.push(`${c.deleted} apagados`);
  if (c.advanced) parts.push(`${c.advanced} avançados`);
  if (parts.length === 0) return;
  lines.push(`· ${label}: ${parts.join(', ')}`);
}

function ProtocolPreview({ parseRes, summary }: { parseRes: ParseResult; summary: OpSummary }) {
  const { ops, errors, detectedMode } = parseRes;
  const modeLabels: Record<typeof detectedMode, string> = {
    empty: '—',
    legacy_posts: 'array legado de posts (compatibilidade)',
    grouped: 'objeto agrupado (posts/tasks/objectives)',
    commands: 'array de comandos',
    mixed: 'misto (kind + comandos)',
    unknown: 'formato não reconhecido',
  };

  const groupChips: { label: string; count: number }[] = [];
  if (summary.posts.create) groupChips.push({ label: `${summary.posts.create} posts (create)`, count: summary.posts.create });
  if (summary.posts.update) groupChips.push({ label: `${summary.posts.update} posts (update)`, count: summary.posts.update });
  if (summary.posts.delete) groupChips.push({ label: `${summary.posts.delete} posts (delete)`, count: summary.posts.delete });
  if (summary.posts.advance) groupChips.push({ label: `${summary.posts.advance} posts (advance_status)`, count: summary.posts.advance });
  if (summary.tasks.create) groupChips.push({ label: `${summary.tasks.create} tarefas (create)`, count: summary.tasks.create });
  if (summary.tasks.update) groupChips.push({ label: `${summary.tasks.update} tarefas (update)`, count: summary.tasks.update });
  if (summary.tasks.delete) groupChips.push({ label: `${summary.tasks.delete} tarefas (delete)`, count: summary.tasks.delete });
  if (summary.objectives.create) groupChips.push({ label: `${summary.objectives.create} objetivos (create)`, count: summary.objectives.create });
  if (summary.objectives.update) groupChips.push({ label: `${summary.objectives.update} objetivos (update)`, count: summary.objectives.update });
  if (summary.objectives.delete) groupChips.push({ label: `${summary.objectives.delete} objetivos (delete)`, count: summary.objectives.delete });

  return (
    <div className={styles.importPreview}>
      <div className={styles.importPreviewSummary}>
        Modo: {modeLabels[detectedMode]}
      </div>
      {ops.length > 0 && (
        <>
          <div className={styles.importPreviewSuccess}>
            ✓ Detectado:
          </div>
          <ul className={styles.protocolGroupList}>
            {groupChips.map((g, i) => (
              <li key={i} className={styles.protocolGroupChip}>{g.label}</li>
            ))}
          </ul>
        </>
      )}
      {errors.length > 0 && (
        <>
          <div className={styles.importPreviewSummary}>
            ⚠ {errors.length} {errors.length === 1 ? 'ignorado' : 'ignorados'}:
          </div>
          <ul className={styles.importPreviewErrors}>
            {errors.map((e, i) => (
              <li key={i} className={styles.importPreviewError}>{e}</li>
            ))}
          </ul>
        </>
      )}
      {ops.length === 0 && errors.length === 0 && (
        <div className={styles.importPreviewSummary}>Nenhuma operação detectada ainda.</div>
      )}
    </div>
  );
}

// =====================================================================
// Protocolo Cowork — Exportar (modal de saída)
// =====================================================================
//
// Carrega tasks + objectives sob demanda (RLS já aplica), agrega com posts
// (já em estado pelo parent) + external_events (do hook calendarFeeds), e
// monta o JSON serializável pro Cowork. Export é stateless do lado do server
// — toda transformação acontece em buildExport (módulo Protocol).

const SCOPE_LABELS: { value: ExportScope; label: string }[] = [
  { value: 'all',          label: 'Todos' },
  { value: 'this_week',    label: 'Esta semana' },
  { value: 'this_month',   label: 'Este mês' },
  { value: 'next_30_days', label: 'Próximos 30 dias' },
  { value: 'custom',       label: 'Datas personalizadas' },
];

interface ProtocolExportProps {
  posts: SocialPost[];
  externalEvents: Map<string, ExternalEvent[]>;
  onClose: () => void;
}

function ProtocolExportModal({ posts, externalEvents, onClose }: ProtocolExportProps) {
  const [filters, setFilters] = useState<ExportFilters>({
    scope: 'this_week',
    customStart: null,
    customEnd: null,
    accounts: 'all',
    tables: { posts: true, tasks: true, objectives: true, external_events: true },
  });

  const [tasks, setTasks] = useState<AgendaTask[]>([]);
  const [objectives, setObjectives] = useState<AgendaObjective[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'err'>('idle');

  // Carrega tasks + objectives ao abrir o modal — tabelas ainda podem não
  // estar populadas no estado do Plan (usuário pode nunca ter visitado).
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setLoadError(null);
      const [taskR, objR] = await Promise.all([
        supabase.from('agenda_tasks').select('*'),
        supabase.from('agenda_objectives').select('*'),
      ]);
      if (!alive) return;
      if (taskR.error) {
        setLoadError(`tarefas: ${taskR.error.message}`);
      }
      if (objR.error) {
        setLoadError((prev) => (prev ? `${prev}; objetivos: ${objR.error!.message}` : `objetivos: ${objR.error.message}`));
      }
      setTasks((taskR.data || []) as AgendaTask[]);
      setObjectives((objR.data || []) as AgendaObjective[]);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const payload = useMemo(
    () => buildExport(filters, { posts, tasks, objectives, externalEvents }),
    [filters, posts, tasks, objectives, externalEvents]
  );

  const json = useMemo(() => JSON.stringify(payload, null, 2), [payload]);

  const range = useMemo(() => resolveRange(filters), [filters]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopyState('ok');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('err');
    }
  }

  function selectAll() {
    const ta = document.getElementById('protocolExportArea') as HTMLTextAreaElement | null;
    if (ta) {
      ta.focus();
      ta.select();
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${styles.modalWide}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.modalHeader}>
          <h2>📤 Protocolo Cowork — Exportar</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </header>
        <div className={styles.modalBody}>
          <p className={styles.importSubtitle}>
            Snapshot do estado atual pra colar no chat do Cowork. Inclui resumo agregado +
            arrays completos. <code>created_by</code> é omitido (privacidade).
          </p>

          {loadError && (
            <div className={styles.errorBox}>
              Falha ao carregar dados pro export — {loadError}
            </div>
          )}

          {/* Filtro: escopo */}
          <div className={styles.exportFilterRow}>
            <span className={styles.exportFilterLabel}>Escopo</span>
            <div className={styles.exportFilterChips}>
              {SCOPE_LABELS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className={`${styles.exportFilterChip} ${filters.scope === s.value ? styles.exportFilterChipActive : ''}`}
                  onClick={() => setFilters((f) => ({ ...f, scope: s.value }))}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {filters.scope === 'custom' && (
            <div className={styles.formRow}>
              <label className={styles.formLabel}>
                Início
                <input
                  type="date"
                  className={styles.formInput}
                  value={filters.customStart || ''}
                  onChange={(e) => setFilters((f) => ({ ...f, customStart: e.target.value || null }))}
                />
              </label>
              <label className={styles.formLabel}>
                Fim
                <input
                  type="date"
                  className={styles.formInput}
                  value={filters.customEnd || ''}
                  onChange={(e) => setFilters((f) => ({ ...f, customEnd: e.target.value || null }))}
                />
              </label>
            </div>
          )}

          <div className={styles.exportRangeHint}>
            Range resolvido: {range.start ?? '∞'} → {range.end ?? '∞'}
          </div>

          {/* Filtro: tabelas */}
          <div className={styles.exportFilterRow}>
            <span className={styles.exportFilterLabel}>Tabelas</span>
            <div className={styles.exportFilterChips}>
              {(['posts', 'tasks', 'objectives', 'external_events'] as const).map((t) => (
                <label key={t} className={styles.exportFilterCheckbox}>
                  <input
                    type="checkbox"
                    checked={filters.tables[t]}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        tables: { ...f.tables, [t]: e.target.checked },
                      }))
                    }
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>

          {/* Filtro: conta */}
          <div className={styles.exportFilterRow}>
            <span className={styles.exportFilterLabel}>Conta (posts)</span>
            <div className={styles.exportFilterChips}>
              {([
                { id: 'all',     label: 'Todas' },
                { id: 'nzppf',    label: '@nzppf' },
                { id: 'nzgroup',  label: '@nzgroup.br' },
                { id: 'joaowrap', label: '@joaowrap' },
              ] as const).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={`${styles.exportFilterChip} ${filters.accounts === a.id ? styles.exportFilterChipActive : ''}`}
                  onClick={() => setFilters((f) => ({ ...f, accounts: a.id as ExportFilters['accounts'] }))}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resumo */}
          <div className={styles.exportSummary}>
            <span>posts: <strong>{payload.summary.posts.total}</strong></span>
            <span>tarefas: <strong>{payload.summary.tasks.total}</strong></span>
            <span>objetivos: <strong>{payload.summary.objectives.monthly + payload.summary.objectives.weekly}</strong></span>
            <span>eventos externos: <strong>{payload.summary.external_events.total}</strong></span>
          </div>

          {/* Pré-visualização JSON */}
          <textarea
            id="protocolExportArea"
            className={`${styles.formTextarea} ${styles.importTextarea} ${styles.exportPreview}`}
            value={loading ? 'Carregando tarefas e objetivos…' : json}
            readOnly
            rows={12}
            spellCheck={false}
          />
        </div>
        <footer className={styles.modalFooter}>
          <button type="button" className={styles.linkBtn} onClick={selectAll}>
            Selecionar tudo
          </button>
          <span style={{ flex: 1 }} />
          <button className={styles.secondaryBtn} onClick={onClose}>Fechar</button>
          <button
            className={styles.primaryBtn}
            onClick={handleCopy}
            disabled={loading}
          >
            {copyState === 'ok' && '✓ Copiado'}
            {copyState === 'err' && '⚠ Falha — use Selecionar tudo'}
            {copyState === 'idle' && '📋 Copiar pro clipboard'}
          </button>
        </footer>
      </div>
    </div>
  );
}
