import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './AdminAgendaSocial.module.css';
import {
  accountMeta,
  dateKey,
  type SocialPost,
} from './AdminAgendaSocial';
import type { ExternalEvent } from './AdminAgendaSocialFeeds';

// =====================================================================
// Tipos
// =====================================================================
export interface AgendaObjective {
  id: string;
  scope: 'monthly' | 'weekly';
  title: string;
  description: string | null;
  target_date: string; // YYYY-MM-DD
  status: 'open' | 'done' | 'dropped';
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface AgendaTask {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: 'pending' | 'doing' | 'done' | 'dropped';
  priority: number; // 1=alta, 2=média, 3=baixa
  objective_id: string | null;
  social_post_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// =====================================================================
// Helpers
// =====================================================================
function getMonday(d: Date): Date {
  const day = d.getDay(); // 0 = domingo
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) =>
    new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
  );
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfNextMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

function formatLongBR(d: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d);
}

function formatMonthBR(d: Date): string {
  const raw = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(d);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function formatShortBR(d: Date): string {
  const raw = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(d);
  const day = d.getDate();
  return `${raw.charAt(0).toUpperCase()}${raw.slice(1).replace(/\.$/, '')} ${day}`;
}

const PRIORITY_LABELS: Record<number, string> = { 1: 'Alta', 2: 'Média', 3: 'Baixa' };
const PRIORITY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'Alta' },
  { value: 2, label: 'Média' },
  { value: 3, label: 'Baixa' },
];

// =====================================================================
// PlanView — orquestra as 3 zonas
// =====================================================================
interface PlanViewProps {
  posts: SocialPost[]; // já filtrados por conta no parent
  externalEvents: Map<string, ExternalEvent[]>;
  /** Task pré-preenchida vinda do botão "+ tarefa" no kanban. Quando muda
   *  pra non-null, PlanView abre o TaskModal já com esses valores. */
  pendingTask: Partial<AgendaTask> | null;
  onPendingTaskConsumed: () => void;
  onPostEdit: (p: SocialPost) => void;
}

export default function PlanView({
  posts, externalEvents, pendingTask, onPendingTaskConsumed, onPostEdit,
}: PlanViewProps) {
  const [objectives, setObjectives] = useState<AgendaObjective[]>([]);
  const [tasks, setTasks] = useState<AgendaTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [monthDate, setMonthDate] = useState<Date>(() => startOfMonth(new Date()));
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));

  const [editingObjective, setEditingObjective] =
    useState<Partial<AgendaObjective> | null>(null);
  const [editingTask, setEditingTask] = useState<Partial<AgendaTask> | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [objR, taskR] = await Promise.all([
      supabase.from('agenda_objectives').select('*').order('target_date', { ascending: true }),
      supabase.from('agenda_tasks').select('*').order('due_date', { ascending: true, nullsFirst: false }),
    ]);
    if (objR.error) {
      setError(objR.error.message);
      setLoading(false);
      return;
    }
    if (taskR.error) {
      setError(taskR.error.message);
      setLoading(false);
      return;
    }
    setObjectives((objR.data || []) as AgendaObjective[]);
    setTasks((taskR.data || []) as AgendaTask[]);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Quando vem uma task pré-preenchida do kanban, abre o modal
  useEffect(() => {
    if (pendingTask) {
      setEditingTask(pendingTask);
      onPendingTaskConsumed();
    }
  }, [pendingTask, onPendingTaskConsumed]);

  // ──────────── Cálculos derivados ────────────
  const monthStartKey = dateKey(monthDate);
  const monthEndKey = dateKey(startOfNextMonth(monthDate));
  const weekStartKey = dateKey(weekStart);
  const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7);
  const weekEndKey = dateKey(weekEnd);
  const todayKey = dateKey(new Date());

  const monthlyObjectives = useMemo(
    () => objectives.filter(
      (o) => o.scope === 'monthly' && o.target_date >= monthStartKey && o.target_date < monthEndKey
    ),
    [objectives, monthStartKey, monthEndKey]
  );

  const weeklyObjectives = useMemo(
    () => objectives.filter(
      (o) => o.scope === 'weekly' && o.target_date >= weekStartKey && o.target_date < weekEndKey
    ),
    [objectives, weekStartKey, weekEndKey]
  );

  const tasksByObjective = useMemo(() => {
    const m = new Map<string, AgendaTask[]>();
    for (const t of tasks) {
      if (t.objective_id) {
        const arr = m.get(t.objective_id) || [];
        arr.push(t);
        m.set(t.objective_id, arr);
      }
    }
    return m;
  }, [tasks]);

  const tasksByDate = useMemo(() => {
    const m = new Map<string, AgendaTask[]>();
    for (const t of tasks) {
      if (!t.due_date) continue;
      const arr = m.get(t.due_date) || [];
      arr.push(t);
      m.set(t.due_date, arr);
    }
    return m;
  }, [tasks]);

  const postsByDate = useMemo(() => {
    const m = new Map<string, SocialPost[]>();
    for (const p of posts) {
      if (!p.scheduled_for) continue;
      const arr = m.get(p.scheduled_for) || [];
      arr.push(p);
      m.set(p.scheduled_for, arr);
    }
    return m;
  }, [posts]);

  const todayTasks = useMemo(() => {
    return tasks
      .filter((t) => t.due_date === todayKey && t.status !== 'dropped')
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        const sOrder: Record<AgendaTask['status'], number> = { doing: 0, pending: 1, done: 2, dropped: 3 };
        return sOrder[a.status] - sOrder[b.status];
      });
  }, [tasks, todayKey]);

  // ──────────── Ações ────────────
  async function toggleTaskDone(t: AgendaTask) {
    const newStatus: AgendaTask['status'] = t.status === 'done' ? 'pending' : 'done';
    const { error } = await supabase.from('agenda_tasks').update({ status: newStatus }).eq('id', t.id);
    if (error) { alert('Erro: ' + error.message); return; }
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: newStatus } : x)));
  }

  async function toggleObjectiveDone(o: AgendaObjective) {
    const newStatus: AgendaObjective['status'] = o.status === 'done' ? 'open' : 'done';
    const { error } = await supabase.from('agenda_objectives').update({ status: newStatus }).eq('id', o.id);
    if (error) { alert('Erro: ' + error.message); return; }
    setObjectives((prev) => prev.map((x) => (x.id === o.id ? { ...x, status: newStatus } : x)));
  }

  async function deleteObjective(o: AgendaObjective) {
    if (!confirm(`Apagar objetivo "${o.title}"?`)) return;
    const { error } = await supabase.from('agenda_objectives').delete().eq('id', o.id);
    if (error) { alert('Erro: ' + error.message); return; }
    setObjectives((prev) => prev.filter((x) => x.id !== o.id));
  }

  async function deleteTask(t: AgendaTask) {
    if (!confirm(`Apagar tarefa "${t.title}"?`)) return;
    const { error } = await supabase.from('agenda_tasks').delete().eq('id', t.id);
    if (error) { alert('Erro: ' + error.message); return; }
    setTasks((prev) => prev.filter((x) => x.id !== t.id));
  }

  // ──────────── Render ────────────
  if (error) {
    return (
      <div className={styles.errorBox}>
        Erro: {error}
        <br />
        <small>
          Confira se rodou <code>social_posts_v3.sql</code> no Supabase
          (cria <code>agenda_objectives</code> e <code>agenda_tasks</code>).
        </small>
      </div>
    );
  }

  return (
    <div className={styles.plan}>
      {loading && <div className={styles.placeholder}>Carregando plano…</div>}

      {/* ───── ZONA 1 — MÊS ───── */}
      <section className={styles.planZone}>
        <header className={styles.planZoneHeader}>
          <h2 className={styles.planZoneTitle}>{formatMonthBR(monthDate)}</h2>
          <div className={styles.calendarNav}>
            <button
              type="button" className={styles.calendarNavBtn}
              onClick={() => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            >←</button>
            <button
              type="button" className={styles.calendarNavBtn}
              onClick={() => setMonthDate(startOfMonth(new Date()))}
            >Hoje</button>
            <button
              type="button" className={styles.calendarNavBtn}
              onClick={() => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            >→</button>
          </div>
        </header>
        <div className={styles.planObjectives}>
          {monthlyObjectives.map((o) => (
            <ObjectiveCard
              key={o.id}
              objective={o}
              taskStats={statsForObjective(tasksByObjective.get(o.id) || [])}
              onEdit={() => setEditingObjective(o)}
              onToggleDone={() => toggleObjectiveDone(o)}
              onDelete={() => deleteObjective(o)}
            />
          ))}
          <button
            type="button"
            className={styles.planAddCard}
            onClick={() =>
              setEditingObjective({
                scope: 'monthly',
                target_date: monthStartKey,
                title: '',
                description: '',
                status: 'open',
              })
            }
          >
            + Objetivo do mês
          </button>
        </div>
      </section>

      {/* ───── ZONA 2 — SEMANA ───── */}
      <section className={styles.planZone}>
        <header className={styles.planZoneHeader}>
          <h2 className={styles.planZoneTitle}>
            Semana de {formatShortBR(weekStart)} a {formatShortBR(getWeekDays(weekStart)[6])}
          </h2>
          <div className={styles.calendarNav}>
            <button
              type="button" className={styles.calendarNavBtn}
              onClick={() => {
                const next = new Date(weekStart);
                next.setDate(next.getDate() - 7);
                setWeekStart(next);
              }}
            >←</button>
            <button
              type="button" className={styles.calendarNavBtn}
              onClick={() => setWeekStart(getMonday(new Date()))}
            >Esta semana</button>
            <button
              type="button" className={styles.calendarNavBtn}
              onClick={() => {
                const next = new Date(weekStart);
                next.setDate(next.getDate() + 7);
                setWeekStart(next);
              }}
            >→</button>
          </div>
        </header>

        {weeklyObjectives.length > 0 && (
          <div className={styles.planWeeklyObjectivesRow}>
            {weeklyObjectives.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`${styles.planWeeklyObjective} ${o.status === 'done' ? styles.planWeeklyObjectiveDone : ''}`}
                onClick={() => setEditingObjective(o)}
                title={o.description || ''}
              >
                🎯 {o.title}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          className={styles.linkBtn}
          onClick={() =>
            setEditingObjective({
              scope: 'weekly',
              target_date: dateKey(weekStart),
              title: '',
              description: '',
              status: 'open',
            })
          }
        >
          + Objetivo da semana
        </button>

        <div className={styles.planWeekGrid}>
          {getWeekDays(weekStart).map((day) => {
            const key = dateKey(day);
            const dayTasks = tasksByDate.get(key) || [];
            const dayPosts = postsByDate.get(key) || [];
            const dayExt = externalEvents.get(key) || [];
            const isToday = key === todayKey;
            return (
              <div
                key={key}
                className={`${styles.planWeekCol} ${isToday ? styles.planWeekColToday : ''}`}
              >
                <div className={styles.planWeekColHeader}>{formatShortBR(day)}</div>
                <div className={styles.planWeekColBody}>
                  {dayTasks.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`${styles.planWeekTask} ${t.status === 'done' ? styles.planWeekTaskDone : ''}`}
                      onClick={() => setEditingTask(t)}
                      title={t.description || t.title}
                    >
                      <span className={styles.planTaskPriority} data-priority={t.priority}>
                        {t.priority === 1 ? '⬤' : t.priority === 2 ? '◐' : '○'}
                      </span>
                      <span className={styles.planTaskTitle}>{t.title}</span>
                    </button>
                  ))}
                  {dayPosts.map((p) => {
                    const acct = accountMeta(p.account);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={styles.planWeekPost}
                        style={{ borderLeftColor: acct.color }}
                        onClick={() => onPostEdit(p)}
                        title={p.title}
                      >
                        <span
                          className={styles.calendarChipBadge}
                          style={{ background: acct.color }}
                        >{acct.tag}</span>
                        <span className={styles.calendarChipTitle}>{p.title}</span>
                      </button>
                    );
                  })}
                  {dayExt.map((e, i) => (
                    <div
                      key={`${e.feedId}-${i}`}
                      className={styles.planWeekExternal}
                      style={{ borderLeftColor: e.feedColor }}
                      title={`${e.feedLabel}: ${e.title}`}
                    >
                      <span
                        className={styles.calendarChipBadge}
                        style={{ background: e.feedColor }}
                      >
                        {e.feedLabel.slice(0, 3).toUpperCase()}
                      </span>
                      <span className={styles.calendarChipTitle}>{e.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ───── ZONA 3 — HOJE ───── */}
      <section className={`${styles.planZone} ${styles.planTodayZone}`}>
        <header className={styles.planZoneHeader}>
          <h2 className={styles.planZoneTitle}>
            Hoje · {formatLongBR(new Date())}
          </h2>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() =>
              setEditingTask({
                title: '',
                description: '',
                due_date: todayKey,
                status: 'pending',
                priority: 2,
              })
            }
          >
            + Tarefa de hoje
          </button>
        </header>
        <div className={styles.planTodayList}>
          {todayTasks.length === 0 && (
            <div className={styles.placeholder}>Nada agendado pra hoje. Respira.</div>
          )}
          {todayTasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              objectives={objectives}
              posts={posts}
              onToggle={() => toggleTaskDone(t)}
              onEdit={() => setEditingTask(t)}
              onDelete={() => deleteTask(t)}
            />
          ))}
        </div>
      </section>

      {/* Modais */}
      {editingObjective && (
        <ObjectiveModal
          draft={editingObjective}
          onClose={() => setEditingObjective(null)}
          onSaved={async () => { setEditingObjective(null); await reload(); }}
        />
      )}
      {editingTask && (
        <TaskModal
          draft={editingTask}
          objectives={objectives}
          posts={posts}
          onClose={() => setEditingTask(null)}
          onSaved={async () => { setEditingTask(null); await reload(); }}
        />
      )}
    </div>
  );
}

// =====================================================================
// ObjectiveCard (mensal)
// =====================================================================
function statsForObjective(taskList: AgendaTask[]): { total: number; done: number } {
  const total = taskList.length;
  const done = taskList.filter((t) => t.status === 'done').length;
  return { total, done };
}

interface ObjectiveCardProps {
  objective: AgendaObjective;
  taskStats: { total: number; done: number };
  onEdit: () => void;
  onToggleDone: () => void;
  onDelete: () => void;
}

function ObjectiveCard({ objective, taskStats, onEdit, onToggleDone, onDelete }: ObjectiveCardProps) {
  const isDone = objective.status === 'done';
  const pct = taskStats.total > 0 ? (taskStats.done / taskStats.total) * 100 : 0;
  return (
    <div className={`${styles.planObjectiveCard} ${isDone ? styles.planObjectiveCardDone : ''}`}>
      <div className={styles.planObjectiveTop}>
        <button
          type="button"
          className={styles.planObjectiveStatus}
          onClick={onToggleDone}
          title={isDone ? 'Reabrir' : 'Marcar como concluído'}
        >
          {isDone ? '✓' : '○'}
        </button>
        <div className={styles.planObjectiveTitle} onClick={onEdit} role="button" tabIndex={0}>
          {objective.title}
        </div>
        <button
          type="button"
          className={styles.iconBtnDanger}
          onClick={onDelete}
          title="Apagar"
        >×</button>
      </div>
      {objective.description && (
        <div className={styles.planObjectiveDesc}>{objective.description}</div>
      )}
      <div className={styles.planObjectiveStats}>
        {taskStats.total > 0
          ? `${taskStats.total} ${taskStats.total === 1 ? 'tarefa' : 'tarefas'} · ${taskStats.done} concluída${taskStats.done === 1 ? '' : 's'}`
          : 'Sem tarefas vinculadas ainda'}
      </div>
      {taskStats.total > 0 && (
        <div className={styles.checklistBar}>
          <div className={styles.checklistBarFill} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

// =====================================================================
// TaskRow (zona Hoje)
// =====================================================================
interface TaskRowProps {
  task: AgendaTask;
  objectives: AgendaObjective[];
  posts: SocialPost[];
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function TaskRow({ task, objectives, posts, onToggle, onEdit, onDelete }: TaskRowProps) {
  const linkedObj = task.objective_id ? objectives.find((o) => o.id === task.objective_id) : null;
  const linkedPost = task.social_post_id ? posts.find((p) => p.id === task.social_post_id) : null;
  return (
    <div className={`${styles.planTaskRow} ${task.status === 'done' ? styles.planTaskRowDone : ''}`}>
      <input
        type="checkbox"
        className={styles.checklistCheckbox}
        checked={task.status === 'done'}
        onChange={onToggle}
      />
      <div className={styles.planTaskMain}>
        <div className={styles.planTaskRowTitle} onClick={onEdit} role="button" tabIndex={0}>
          {task.title}
        </div>
        <div className={styles.planTaskMeta}>
          <span className={styles.planTaskPriorityTag} data-priority={task.priority}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          {linkedObj && (
            <span className={styles.planTaskLink}>🎯 {linkedObj.title}</span>
          )}
          {linkedPost && (
            <span className={styles.planTaskLink}>📅 {linkedPost.title}</span>
          )}
        </div>
      </div>
      <button type="button" className={styles.iconBtnDanger} onClick={onDelete} title="Apagar">×</button>
    </div>
  );
}

// =====================================================================
// ObjectiveModal
// =====================================================================
interface ObjectiveModalProps {
  draft: Partial<AgendaObjective>;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

function ObjectiveModal({ draft, onClose, onSaved }: ObjectiveModalProps) {
  const [d, setD] = useState<Partial<AgendaObjective>>(draft);
  const [saving, setSaving] = useState(false);
  const isEdit = !!draft.id;

  async function handleSave() {
    if (!d.title?.trim()) { alert('Título é obrigatório.'); return; }
    if (!d.target_date) { alert('Data alvo é obrigatória.'); return; }
    if (!d.scope) { alert('Escopo é obrigatório.'); return; }
    setSaving(true);

    const payload = {
      scope:        d.scope,
      title:        d.title.trim(),
      description:  d.description?.trim() || null,
      target_date:  d.target_date,
      status:       d.status || 'open',
    };

    if (isEdit && draft.id) {
      const { error } = await supabase.from('agenda_objectives').update(payload).eq('id', draft.id);
      if (error) { alert('Erro: ' + error.message); setSaving(false); return; }
    } else {
      const user = (await supabase.auth.getUser()).data.user;
      const { error } = await supabase.from('agenda_objectives').insert({ ...payload, created_by: user?.id || null });
      if (error) { alert('Erro: ' + error.message); setSaving(false); return; }
    }
    setSaving(false);
    await onSaved();
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h2>{isEdit ? 'Editar objetivo' : 'Novo objetivo'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </header>
        <div className={styles.modalBody}>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>
              Escopo
              <select
                className={styles.formInput}
                value={d.scope || 'monthly'}
                onChange={(e) => setD({ ...d, scope: e.target.value as AgendaObjective['scope'] })}
              >
                <option value="monthly">Mensal</option>
                <option value="weekly">Semanal</option>
              </select>
            </label>
            <label className={styles.formLabel}>
              Data alvo
              <input
                type="date"
                className={styles.formInput}
                value={d.target_date || ''}
                onChange={(e) => setD({ ...d, target_date: e.target.value })}
              />
            </label>
          </div>
          <label className={styles.formLabel}>
            Título *
            <input
              className={styles.formInput}
              value={d.title || ''}
              onChange={(e) => setD({ ...d, title: e.target.value })}
              placeholder='ex: "Fechar 5 lojas novas em SP"'
            />
          </label>
          <label className={styles.formLabel}>
            Descrição
            <textarea
              className={styles.formTextarea}
              rows={4}
              value={d.description || ''}
              onChange={(e) => setD({ ...d, description: e.target.value })}
              placeholder="Por que esse objetivo importa? Critério claro de sucesso."
            />
          </label>
          <label className={styles.formLabel}>
            Status
            <select
              className={styles.formInput}
              value={d.status || 'open'}
              onChange={(e) => setD({ ...d, status: e.target.value as AgendaObjective['status'] })}
            >
              <option value="open">Aberto</option>
              <option value="done">Concluído</option>
              <option value="dropped">Cancelado</option>
            </select>
          </label>
        </div>
        <footer className={styles.modalFooter}>
          <button className={styles.secondaryBtn} onClick={onClose} disabled={saving}>Cancelar</button>
          <button className={styles.primaryBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando…' : (isEdit ? 'Salvar alterações' : 'Criar objetivo')}
          </button>
        </footer>
      </div>
    </div>
  );
}

// =====================================================================
// TaskModal
// =====================================================================
interface TaskModalProps {
  draft: Partial<AgendaTask>;
  objectives: AgendaObjective[];
  posts: SocialPost[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}

function TaskModal({ draft, objectives, posts, onClose, onSaved }: TaskModalProps) {
  const [d, setD] = useState<Partial<AgendaTask>>(draft);
  const [saving, setSaving] = useState(false);
  const isEdit = !!draft.id;

  const openObjectives = useMemo(() => objectives.filter((o) => o.status === 'open'), [objectives]);
  const eligiblePosts = useMemo(
    () => posts.filter((p) => p.status === 'backlog' || p.status === 'em_producao' || p.status === 'pronto'),
    [posts]
  );

  async function handleSave() {
    if (!d.title?.trim()) { alert('Título é obrigatório.'); return; }
    setSaving(true);

    const payload = {
      title:          d.title.trim(),
      description:    d.description?.trim() || null,
      due_date:       d.due_date || null,
      status:         d.status || 'pending',
      priority:       d.priority ?? 2,
      objective_id:   d.objective_id || null,
      social_post_id: d.social_post_id || null,
    };

    if (isEdit && draft.id) {
      const { error } = await supabase.from('agenda_tasks').update(payload).eq('id', draft.id);
      if (error) { alert('Erro: ' + error.message); setSaving(false); return; }
    } else {
      const user = (await supabase.auth.getUser()).data.user;
      const { error } = await supabase.from('agenda_tasks').insert({ ...payload, created_by: user?.id || null });
      if (error) { alert('Erro: ' + error.message); setSaving(false); return; }
    }
    setSaving(false);
    await onSaved();
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h2>{isEdit ? 'Editar tarefa' : 'Nova tarefa'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </header>
        <div className={styles.modalBody}>
          <label className={styles.formLabel}>
            Título *
            <input
              className={styles.formInput}
              value={d.title || ''}
              onChange={(e) => setD({ ...d, title: e.target.value })}
              placeholder='ex: "Gravar Reel RAM cromada"'
            />
          </label>
          <label className={styles.formLabel}>
            Descrição
            <textarea
              className={styles.formTextarea}
              rows={3}
              value={d.description || ''}
              onChange={(e) => setD({ ...d, description: e.target.value })}
            />
          </label>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>
              Prazo
              <input
                type="date"
                className={styles.formInput}
                value={d.due_date || ''}
                onChange={(e) => setD({ ...d, due_date: e.target.value })}
              />
            </label>
            <label className={styles.formLabel}>
              Prioridade
              <select
                className={styles.formInput}
                value={d.priority ?? 2}
                onChange={(e) => setD({ ...d, priority: Number(e.target.value) })}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>
              Status
              <select
                className={styles.formInput}
                value={d.status || 'pending'}
                onChange={(e) => setD({ ...d, status: e.target.value as AgendaTask['status'] })}
              >
                <option value="pending">A fazer</option>
                <option value="doing">Em andamento</option>
                <option value="done">Concluída</option>
                <option value="dropped">Cancelada</option>
              </select>
            </label>
            <label className={styles.formLabel}>
              Objetivo (opcional)
              <select
                className={styles.formInput}
                value={d.objective_id || ''}
                onChange={(e) => setD({ ...d, objective_id: e.target.value || null })}
              >
                <option value="">— nenhum —</option>
                {openObjectives.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.scope === 'monthly' ? '🗓️' : '📌'} {o.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={styles.formLabel}>
            Post vinculado (opcional)
            <select
              className={styles.formInput}
              value={d.social_post_id || ''}
              onChange={(e) => setD({ ...d, social_post_id: e.target.value || null })}
            >
              <option value="">— nenhum —</option>
              {eligiblePosts.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.account}] {p.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <footer className={styles.modalFooter}>
          <button className={styles.secondaryBtn} onClick={onClose} disabled={saving}>Cancelar</button>
          <button className={styles.primaryBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando…' : (isEdit ? 'Salvar alterações' : 'Criar tarefa')}
          </button>
        </footer>
      </div>
    </div>
  );
}
