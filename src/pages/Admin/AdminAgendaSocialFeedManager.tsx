import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './AdminAgendaSocial.module.css';
import { parseICal, type CalendarFeed } from './AdminAgendaSocialFeeds';

interface FeedManagerProps {
  feeds: CalendarFeed[];
  errors: Record<string, string>;
  onClose: () => void;
  onChange: () => Promise<void>;
}

type TestResult =
  | { kind: 'idle' }
  | { kind: 'testing' }
  | { kind: 'ok'; count: number; sample: string | null }
  | { kind: 'error'; message: string };

const URL_PLACEHOLDER =
  'https://calendar.google.com/calendar/ical/seu-email%40gmail.com/private-XXXX/basic.ics';

export default function FeedManagerModal({
  feeds, errors, onClose, onChange,
}: FeedManagerProps) {
  const [label, setLabel] = useState('');
  const [icsUrl, setIcsUrl] = useState('');
  const [color, setColor] = useState('#7e8c9b');
  const [saving, setSaving] = useState(false);
  // Guia abre automaticamente quando ainda não há feed nenhum (primeira vez)
  const [helpOpen, setHelpOpen] = useState(feeds.length === 0);
  const [test, setTest] = useState<TestResult>({ kind: 'idle' });

  async function handleTest() {
    const trimmedUrl = icsUrl.trim();
    if (!trimmedUrl) {
      alert('Cole a URL antes de testar.');
      return;
    }
    setTest({ kind: 'testing' });
    try {
      const r = await fetch(trimmedUrl);
      if (!r.ok) {
        setTest({ kind: 'error', message: `O servidor respondeu HTTP ${r.status}. Verifica se a URL está correta.` });
        return;
      }
      const txt = await r.text();
      // Parser precisa de um feed shape mínimo — usamos placeholder
      const events = parseICal(txt, {
        id: 'preview',
        label: label || 'preview',
        ics_url: trimmedUrl,
        color,
        enabled: true,
        created_at: '',
      });
      setTest({
        kind: 'ok',
        count: events.length,
        sample: events[0]?.title || null,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setTest({
        kind: 'error',
        message: `Não consegui buscar essa URL: ${msg}. Pode ser CORS (URL só funciona dentro do Google) ou URL incorreta.`,
      });
    }
  }

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
    setTest({ kind: 'idle' });
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
            Sobreponha eventos do Google Calendar (ou outra fonte iCal) como
            chips read-only no Calendário e na Semana do Plano. Os eventos
            ficam só na visualização — a Agenda NZ nunca escreve neles.
          </p>

          {/* ───── Guia passo-a-passo expansível ───── */}
          <button
            type="button"
            className={styles.feedHelpToggle}
            onClick={() => setHelpOpen((v) => !v)}
            aria-expanded={helpOpen}
          >
            <span className={styles.feedHelpToggleIcon}>{helpOpen ? '▾' : '▸'}</span>
            Como pegar a URL no Google Calendar?
          </button>
          {helpOpen && (
            <ol className={styles.feedHelpSteps}>
              <li>
                <span className={styles.feedHelpStepNum}>1</span>
                <span>
                  Abra <strong><a href="https://calendar.google.com/calendar/u/0/r/settings" target="_blank" rel="noreferrer">calendar.google.com</a></strong> num navegador onde você esteja logado.
                </span>
              </li>
              <li>
                <span className={styles.feedHelpStepNum}>2</span>
                <span>
                  Clique no <strong>⚙ engrenagem</strong> no canto superior direito → <strong>Settings</strong>.
                </span>
              </li>
              <li>
                <span className={styles.feedHelpStepNum}>3</span>
                <span>
                  Na sidebar esquerda, em <strong>"Settings for my calendars"</strong>, clique no nome da agenda que quer importar (geralmente seu email/nome).
                </span>
              </li>
              <li>
                <span className={styles.feedHelpStepNum}>4</span>
                <span>
                  Role até a seção <strong>"Integrate calendar"</strong>.
                </span>
              </li>
              <li>
                <span className={styles.feedHelpStepNum}>5</span>
                <span>
                  Copie o campo <strong>"Secret address in iCal format"</strong> — uma URL longa começando com <code>https://calendar.google.com/calendar/ical/...</code> e terminando em <code>.ics</code>.
                </span>
              </li>
              <li>
                <span className={styles.feedHelpStepNum}>6</span>
                <span>
                  Cola aqui embaixo, dá um label (ex: "Pessoal"), escolhe uma cor e clica <strong>Testar</strong>. Se aparecer ✓ N eventos, dá <strong>Adicionar</strong>.
                </span>
              </li>
              <li className={styles.feedHelpWarning}>
                <span className={styles.feedHelpStepNum}>⚠</span>
                <span>
                  A "Secret address" dá <strong>acesso de leitura</strong> à agenda inteira. Não compartilhe e remova qualquer feed se desconfiar que vazou.
                </span>
              </li>
            </ol>
          )}

          {/* ───── Lista de feeds existentes ───── */}
          {feeds.length > 0 && (
            <>
              <h3 className={styles.feedAddTitle}>Feeds cadastrados</h3>
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
            </>
          )}

          {/* ───── Form de adicionar ───── */}
          <h3 className={styles.feedAddTitle}>+ Adicionar feed</h3>

          <label className={styles.formLabel}>
            URL pública .ics
            <input
              className={styles.formInput}
              value={icsUrl}
              onChange={(e) => { setIcsUrl(e.target.value); setTest({ kind: 'idle' }); }}
              placeholder={URL_PLACEHOLDER}
              spellCheck={false}
            />
            <small className={styles.fieldHint}>
              Cole a "Secret address in iCal format" das configurações da sua agenda no Google Calendar (passo 5 do guia acima).
            </small>
          </label>

          <div className={styles.formRow}>
            <label className={styles.formLabel}>
              Label
              <input
                className={styles.formInput}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder='ex: "Pessoal", "Trabalho", "NZ"'
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

          {/* ───── Resultado do teste ───── */}
          {test.kind === 'ok' && (
            <div className={styles.feedTestOk}>
              ✓ {test.count} {test.count === 1 ? 'evento encontrado' : 'eventos encontrados'}
              {test.sample && (
                <span className={styles.feedTestSample}> — exemplo: "{test.sample}"</span>
              )}
            </div>
          )}
          {test.kind === 'error' && (
            <div className={styles.feedTestErr}>
              ✕ {test.message}
            </div>
          )}
          {test.kind === 'testing' && (
            <div className={styles.feedTestPending}>Testando feed…</div>
          )}
        </div>
        <footer className={styles.modalFooter}>
          <button className={styles.secondaryBtn} onClick={onClose} disabled={saving}>
            Fechar
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={handleTest}
            disabled={saving || test.kind === 'testing' || !icsUrl.trim()}
          >
            {test.kind === 'testing' ? 'Testando…' : 'Testar feed'}
          </button>
          <button
            className={styles.primaryBtn}
            onClick={handleAdd}
            disabled={saving || !icsUrl.trim() || !label.trim()}
          >
            {saving ? 'Adicionando…' : 'Adicionar'}
          </button>
        </footer>
      </div>
    </div>
  );
}
