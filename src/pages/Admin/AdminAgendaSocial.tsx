import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './AdminAgendaSocial.module.css';
import IdeaGeneratorModal from './AdminAgendaSocialIdeaGenerator';
import CalendarView from './AdminAgendaSocialCalendar';
import PlanView, { type AgendaTask } from './AdminAgendaSocialPlan';
import FeedManagerModal from './AdminAgendaSocialFeedManager';
import { useCalendarFeeds } from './AdminAgendaSocialFeeds';

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

  // Modal de importação em lote
  const [importOpen, setImportOpen] = useState(false);

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
            📥 Importar em lote
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

      {/* Modal de importação em lote */}
      {importOpen && (
        <BulkImportModal
          onClose={() => setImportOpen(false)}
          onImported={loadPosts}
        />
      )}

      {/* Modal de gerenciamento de feeds externos (Calendário) */}
      {feedManagerOpen && (
        <FeedManagerModal
          feeds={calendarFeeds.feeds}
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
// Importação em lote (JSON / TSV) — canal de colaboração com o Cowork
// =====================================================================
type ImportFormat = 'json' | 'tsv';

interface BulkPost {
  account: Account;
  title: string;
  pillar: string | null;
  caption: string | null;
  format: string | null;
  asset_url: string | null;
  scheduled_for: string | null;
  notes: string | null;
  checklist: ChecklistItem[];
}

interface BulkParseResult {
  valid: BulkPost[];
  errors: string[];
}

const VALID_ACCOUNTS: Account[] = ['nzppf', 'nzgroup', 'joaowrap'];
const VALID_FORMATS_LIST = ['Foto', 'Carrossel', 'Reel', 'Story'];
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function pickString(raw: Record<string, unknown>, key: string): string | null {
  const v = raw[key];
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  return trimmed === '' ? null : trimmed;
}

function normalizeFormat(
  f: unknown
): { ok: true; value: string | null } | { ok: false; reason: string } {
  if (f === undefined || f === null) return { ok: true, value: null };
  if (typeof f !== 'string') return { ok: false, reason: 'format precisa ser string' };
  const trimmed = f.trim();
  if (trimmed === '') return { ok: true, value: null };
  const match = VALID_FORMATS_LIST.find((v) => v.toLowerCase() === trimmed.toLowerCase());
  if (!match) {
    return { ok: false, reason: `format "${trimmed}" inválido (use Foto, Carrossel, Reel ou Story)` };
  }
  return { ok: true, value: match };
}

function validateRow(
  raw: Record<string, unknown>,
  label: string
): { ok: true; post: BulkPost } | { ok: false; error: string } {
  const accountRaw = raw.account;
  if (typeof accountRaw !== 'string' || accountRaw.trim() === '') {
    return { ok: false, error: `${label}: account obrigatório` };
  }
  const accountTrim = accountRaw.trim() as Account;
  if (!VALID_ACCOUNTS.includes(accountTrim)) {
    return { ok: false, error: `${label}: account "${accountRaw}" inválido (use nzppf, nzgroup ou joaowrap)` };
  }

  const titleRaw = raw.title;
  if (typeof titleRaw !== 'string' || titleRaw.trim() === '') {
    return { ok: false, error: `${label}: title vazio` };
  }

  const formatResult = normalizeFormat(raw.format);
  if (!formatResult.ok) return { ok: false, error: `${label}: ${formatResult.reason}` };
  const format = formatResult.value;

  let scheduled: string | null = null;
  if (raw.scheduled_for !== undefined && raw.scheduled_for !== null && String(raw.scheduled_for).trim() !== '') {
    const s = String(raw.scheduled_for).trim();
    if (!ISO_DATE_RE.test(s)) {
      return { ok: false, error: `${label}: scheduled_for "${s}" não é YYYY-MM-DD` };
    }
    scheduled = s;
  }

  // Checklist: aceita override do payload se vier bem-formada; senão deriva do format.
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
    post: {
      account: accountTrim,
      title: titleRaw.trim(),
      pillar: pickString(raw, 'pillar'),
      caption: pickString(raw, 'caption'),
      format,
      asset_url: pickString(raw, 'asset_url'),
      scheduled_for: scheduled,
      notes: pickString(raw, 'notes'),
      checklist,
    },
  };
}

function parseJsonBulk(text: string): BulkParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'JSON inválido';
    return { valid: [], errors: [`JSON inválido: ${msg}`] };
  }
  if (!Array.isArray(parsed)) {
    return { valid: [], errors: ['Esperado um array JSON `[ {...}, {...} ]`'] };
  }
  const valid: BulkPost[] = [];
  const errors: string[] = [];
  parsed.forEach((raw, idx) => {
    if (!raw || typeof raw !== 'object') {
      errors.push(`Item ${idx + 1}: não é um objeto`);
      return;
    }
    const result = validateRow(raw as Record<string, unknown>, `Item ${idx + 1}`);
    if (result.ok) valid.push(result.post);
    else errors.push(result.error);
  });
  return { valid, errors };
}

function parseTsvBulk(text: string): BulkParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return { valid: [], errors: [] };
  if (lines.length < 2) {
    return { valid: [], errors: ['TSV precisa de header + ao menos uma linha de dados'] };
  }
  const headers = lines[0].split('\t').map((h) => h.trim().toLowerCase());
  const valid: BulkPost[] = [];
  const errors: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    const raw: Record<string, unknown> = {};
    headers.forEach((h, j) => {
      raw[h] = cols[j] ?? '';
    });
    const result = validateRow(raw, `Linha ${i + 1}`);
    if (result.ok) valid.push(result.post);
    else errors.push(result.error);
  }
  return { valid, errors };
}

/**
 * Parser puro de input em lote — separa lógica de UI pra facilitar
 * inspeção mental e testes. Exportado pra reuso eventual.
 */
export function parseBulkInput(text: string, format: ImportFormat): BulkParseResult {
  if (!text.trim()) return { valid: [], errors: [] };
  return format === 'json' ? parseJsonBulk(text) : parseTsvBulk(text);
}

const JSON_PLACEHOLDER = `[
  {
    "account": "nzppf",
    "title": "RAM cromada @adesivotech",
    "format": "Reel",
    "pillar": "Showcase Luxury",
    "scheduled_for": "2026-04-29",
    "caption": "Brilho que vira presença...",
    "notes": "Cortar do bruto."
  },
  {
    "account": "nzgroup",
    "title": "Cor da semana: Stuttgart Sport Grey",
    "format": "Carrossel",
    "pillar": "Catálogo NZ Wrap"
  }
]`;

const TSV_PLACEHOLDER = `account\ttitle\tformat\tpillar\tscheduled_for
nzppf\tRAM cromada @adesivotech\tReel\tShowcase Luxury\t2026-04-29
nzgroup\tCor da semana: Stuttgart\tCarrossel\tCatálogo NZ Wrap\t`;

interface BulkImportProps {
  onClose: () => void;
  onImported: () => void;
}

function BulkImportModal({ onClose, onImported }: BulkImportProps) {
  const [format, setFormat] = useState<ImportFormat>('json');
  const [text, setText] = useState('');
  const [creating, setCreating] = useState(false);

  const result = useMemo(() => parseBulkInput(text, format), [text, format]);

  async function handleImport() {
    if (result.valid.length === 0) return;
    setCreating(true);
    const user = (await supabase.auth.getUser()).data.user;
    const payload = result.valid.map((p) => ({
      account: p.account,
      pillar: p.pillar,
      title: p.title,
      caption: p.caption,
      format: p.format,
      asset_url: p.asset_url,
      scheduled_for: p.scheduled_for,
      notes: p.notes,
      status: 'backlog' as const,
      checklist: p.checklist,
      created_by: user?.id || null,
    }));
    const { error } = await supabase.from('social_posts').insert(payload);
    if (error) {
      alert('Erro ao importar: ' + error.message);
      setCreating(false);
      return;
    }
    alert(`${result.valid.length} ${result.valid.length === 1 ? 'post importado' : 'posts importados'} no Backlog.`);
    setCreating(false);
    onImported();
    onClose();
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${styles.modalWide}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.modalHeader}>
          <h2>📥 Importar posts em lote</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </header>
        <div className={styles.modalBody}>
          <p className={styles.importSubtitle}>
            Cole o JSON ou TSV abaixo. O Cowork pode te entregar nesse formato.
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
              onClick={() => setFormat('tsv')}
            >
              TSV
            </button>
          </div>

          <textarea
            className={`${styles.formTextarea} ${styles.importTextarea}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={format === 'json' ? JSON_PLACEHOLDER : TSV_PLACEHOLDER}
            rows={14}
            spellCheck={false}
          />

          {text.trim() !== '' && (
            <div className={styles.importPreview}>
              {result.valid.length > 0 && (
                <div className={styles.importPreviewSuccess}>
                  ✓ {result.valid.length} {result.valid.length === 1 ? 'post válido detectado' : 'posts válidos detectados'}
                </div>
              )}
              {result.errors.length > 0 && (
                <>
                  <div className={styles.importPreviewSummary}>
                    ⚠ {result.errors.length} {result.errors.length === 1 ? 'ignorado' : 'ignorados'}:
                  </div>
                  <ul className={styles.importPreviewErrors}>
                    {result.errors.map((e, i) => (
                      <li key={i} className={styles.importPreviewError}>{e}</li>
                    ))}
                  </ul>
                </>
              )}
              {result.valid.length === 0 && result.errors.length === 0 && (
                <div className={styles.importPreviewSummary}>Nenhum post detectado ainda.</div>
              )}
            </div>
          )}
        </div>
        <footer className={styles.modalFooter}>
          <button className={styles.secondaryBtn} onClick={onClose} disabled={creating}>
            Cancelar
          </button>
          <button
            className={styles.primaryBtn}
            onClick={handleImport}
            disabled={creating || result.valid.length === 0}
          >
            {creating
              ? 'Importando…'
              : `Importar ${result.valid.length} ${result.valid.length === 1 ? 'post' : 'posts'}`}
          </button>
        </footer>
      </div>
    </div>
  );
}
