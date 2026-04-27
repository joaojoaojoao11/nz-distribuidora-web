import { useMemo } from 'react';
import styles from './AdminAgendaSocial.module.css';
import { accountMeta, dateKey, type SocialPost } from './AdminAgendaSocial';

interface CalendarProps {
  month: Date;
  postsByDate: Map<string, SocialPost[]>;
  todayKey: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onChipClick: (p: SocialPost) => void;
  onEmptyClick: (dateStr: string) => void;
}

/**
 * Gera 42 células (6×7) cobrindo o mês com cauda do mês anterior e
 * cabeça do próximo. Domingo é o primeiro dia da grid (Intl pt-BR).
 */
function getCalendarCells(monthDate: Date): { date: Date; inMonth: boolean }[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay(); // 0 = domingo
  const lastDay = new Date(year, month + 1, 0).getDate();

  const cells: { date: Date; inMonth: boolean }[] = [];
  // Cauda do mês anterior
  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month, -i), inMonth: false });
  }
  // Mês atual
  for (let d = 1; d <= lastDay; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true });
  }
  // Cabeça do próximo mês até completar 42 células
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    cells.push({
      date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
      inMonth: false,
    });
  }
  return cells;
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function CalendarView({
  month, postsByDate, todayKey, onPrevMonth, onNextMonth, onToday, onChipClick, onEmptyClick,
}: CalendarProps) {
  const cells = useMemo(() => getCalendarCells(month), [month]);
  const monthLabelRaw = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(month);
  const monthLabel = monthLabelRaw.charAt(0).toUpperCase() + monthLabelRaw.slice(1);

  return (
    <div className={styles.calendar}>
      <div className={styles.calendarHeader}>
        <h2 className={styles.calendarMonthLabel}>{monthLabel}</h2>
        <div className={styles.calendarNav}>
          <button type="button" className={styles.calendarNavBtn} onClick={onPrevMonth} title="Mês anterior">←</button>
          <button type="button" className={styles.calendarNavBtn} onClick={onToday}>Hoje</button>
          <button type="button" className={styles.calendarNavBtn} onClick={onNextMonth} title="Próximo mês">→</button>
        </div>
      </div>
      <div className={styles.calendarWeekdays}>
        {WEEKDAY_LABELS.map((l) => (
          <div key={l} className={styles.calendarWeekday}>{l}</div>
        ))}
      </div>
      <div className={styles.calendarGrid}>
        {cells.map((cell, i) => {
          const key = dateKey(cell.date);
          const dayPosts = postsByDate.get(key) || [];
          const isToday = key === todayKey;
          const cellClass = [
            styles.calendarCell,
            cell.inMonth ? '' : styles.calendarCellOutside,
            isToday ? styles.calendarCellToday : '',
          ].filter(Boolean).join(' ');
          return (
            <div
              key={i}
              className={cellClass}
              onClick={() => {
                if (cell.inMonth && dayPosts.length === 0) onEmptyClick(key);
              }}
            >
              <div className={styles.calendarDayNum}>{cell.date.getDate()}</div>
              <div className={styles.calendarChips}>
                {dayPosts.map((p) => {
                  const acct = accountMeta(p.account);
                  return (
                    <button
                      type="button"
                      key={p.id}
                      className={styles.calendarChip}
                      style={{ borderLeftColor: acct.color }}
                      onClick={(e) => { e.stopPropagation(); onChipClick(p); }}
                      title={p.title}
                    >
                      <span className={styles.calendarChipBadge} style={{ background: acct.color }}>{acct.tag}</span>
                      <span className={styles.calendarChipTitle}>{p.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
