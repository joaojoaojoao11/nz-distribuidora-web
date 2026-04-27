import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './AdminAgendaSocial.module.css';
import type { CalendarFeed } from './AdminAgendaSocialFeeds';

interface FeedManagerProps {
  feeds: CalendarFeed[];
  errors: Record<string, string>;
  onClose: () => void;
  onChange: () => Promise<void>;
}

export default function FeedManagerModal({
  feeds, errors, onClose, onChange,
}: FeedManagerProps) {
  const [label, setLabel] = useState('');
  const [icsUrl, setIcsUrl] = useState('');
  const [color, setColor] = useState('#7e8c9b');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    const trimmedLabel = label.trim();
    const trimmedUrl = icsUrl.trim();
    if (!trimmedLabel || !trimmedUrl) {
      alert('Label e URL são obrigatórios.');
      return;
    }
    setSaving(true);
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase.from('calendar_feeds').insert({
      label: trimmedLabel,
      ics_url: trimmedUrl,
      color,
      enabled: true,
      created_by: user?.id || null,
    });
    if (error) {
      alert('Erro ao adicionar feed: ' + error.message);
      setSaving(false);
      return;
    }
    setLabel('');
    setIcsUrl('');
    setColor('#7e8c9b');
    await onChange();
    setSaving(false);
  }

  async function toggleEnabled(feed: CalendarFeed) {
    const { error } = await supabase
      .from('calendar_feeds')
      .update({ enabled: !feed.enabled })
      .eq('id', feed.id);
    if (error) {
      alert('Erro: ' + error.message);
      return;
    }
    await onChange();
  }

  async function removeFeed(feed: CalendarFeed) {
    if (!confirm(`Remover feed "${feed.label}"?`)) return;
    const { error } = await supabase.from('calendar_feeds').delete().eq('id', feed.id);
    if (error) {
      alert('Erro: ' + error.message);
      return;
    }
    await onChange();
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.modalWide}`} onClick={(e) => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h2>🔗 Agendas externas</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </header>
        <div className={styles.modalBody}>
          <p className={styles.importSubtitle}>
            Cole a URL pública <strong>.ics</strong> do Google Calendar (Configurações da agenda → Integrar agenda → URL pública no formato iCal). Eventos aparecem como chips read-only no Calendário e na Semana do Plano.
          </p>

          {feeds.length > 0 && (
            <div className={styles.feedList}>
              {feeds.map((f) => (
                <div key={f.id} className={styles.feedRow}>
                  <span className={styles.feedColorDot} style={{ background: f.color }} />
                  <div className={styles.feedInfo}>
                    <div className={styles.feedLabel}>{f.label}</div>
                    <div className={styles.feedUrl} title={f.ics_url}>{f.ics_url}</div>
                    {errors[f.id] && (
                      <div className={styles.feedError}>⚠ {errors[f.id]}</div>
                    )}
                  </div>
                  <label className={styles.feedToggle}>
                    <input
                      type="checkbox"
                      checked={f.enabled}
                      onChange={() => toggleEnabled(f)}
                    />
                    <span>{f.enabled ? 'on' : 'off'}</span>
                  </label>
                  <button
                    type="button"
                    className={styles.iconBtnDanger}
                    onClick={() => removeFeed(f)}
                    title="Remover"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <h3 className={styles.feedAddTitle}>+ Adicionar feed</h3>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>
              Label
              <input
                className={styles.formInput}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder='ex: "Pessoal", "Trabalho"'
              />
            </label>
            <label className={styles.formLabel}>
              Cor
              <input
                type="color"
                className={`${styles.formInput} ${styles.feedColorInput}`}
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </label>
          </div>
          <label className={styles.formLabel}>
            URL pública .ics
            <input
              className={styles.formInput}
              value={icsUrl}
              onChange={(e) => setIcsUrl(e.target.value)}
              placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
            />
          </label>
        </div>
        <footer className={styles.modalFooter}>
          <button className={styles.secondaryBtn} onClick={onClose} disabled={saving}>
            Fechar
          </button>
          <button className={styles.primaryBtn} onClick={handleAdd} disabled={saving}>
            {saving ? 'Adicionando…' : 'Adicionar'}
          </button>
        </footer>
      </div>
    </div>
  );
}
