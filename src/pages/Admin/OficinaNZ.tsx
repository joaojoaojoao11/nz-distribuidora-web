import { useState } from 'react';
import styles from './OficinaNZ.module.css';
import AdminSocialImage from './AdminSocialImage';
import { generateMotorFromPrompt } from '../../components/Agencia/oficinaApi';
import { addUserMotor } from '../../components/Agencia/motorsRegistry';
import type { MotorSpec } from '../../components/Agencia/motorTypes';

type View = 'idle' | 'loading' | 'preview' | 'error';

const EXAMPLE_PROMPTS = [
  'Gerador de Stories Black Friday para Luxury com 50% off, anúncio direto.',
  'Post de lançamento da linha Headlight Dark Black, tom aspiracional e sofisticado.',
  'Anúncio promocional do Core para revendas — preço acessível, garantia 3 anos.',
  'Post técnico do Windshield falando de compatibilidade ADAS e proteção anti-impacto.',
];

export default function OficinaNZ() {
  const [prompt, setPrompt] = useState('');
  const [view, setView] = useState<View>('idle');
  const [motor, setMotor] = useState<MotorSpec | null>(null);
  const [error, setError] = useState<string>('');

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setView('loading');
    setError('');
    setMotor(null);

    const result = await generateMotorFromPrompt(prompt);

    if (!result.ok) {
      setError(result.error);
      setView('error');
      return;
    }

    setMotor(result.motor);
    setView('preview');
  }

  function handleSave() {
    if (!motor) return;
    addUserMotor(motor);
    // Volta pro estado inicial — motor já apareceu no hub via useMotors()
    const savedTitle = motor.metadata.title;
    setMotor(null);
    setPrompt('');
    setView('idle');
    alert(`Motor "${savedTitle}" salvo na Agência NZ.`);
  }

  function handleRetry() {
    handleGenerate();
  }

  function handleEdit() {
    setView('idle');
  }

  function handleUseExample(text: string) {
    setPrompt(text);
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.eyebrow}>NZ GROUP · WORKSHOP DE CRIAÇÃO</div>
        <h1 className={styles.title}>Oficina NZ</h1>
        <p className={styles.subtitle}>
          Descreva o motor que você quer e a IA monta — pronto pra aparecer na
          Agência NZ. Por enquanto, todos os motores criados aqui são variações
          de Post Instagram (1080×1080).
        </p>
      </header>

      <section className={styles.formSection}>
        <label className={styles.fieldLabel}>O que você quer criar?</label>
        <textarea
          className={styles.promptInput}
          placeholder='Ex: "Gerador de stories Instagram para promoção sazonal de Black Friday, formato 1080×1920, com countdown e desconto destacado."'
          rows={5}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={view === 'loading'}
          maxLength={2000}
        />

        <div className={styles.examples}>
          <div className={styles.examplesLabel}>Exemplos rápidos:</div>
          <div className={styles.examplesList}>
            {EXAMPLE_PROMPTS.map((ex, i) => (
              <button
                key={i}
                type="button"
                className={styles.exampleChip}
                onClick={() => handleUseExample(ex)}
                disabled={view === 'loading'}
              >
                {ex.slice(0, 60)}…
              </button>
            ))}
          </div>
        </div>

        <button
          className={styles.submitButton}
          onClick={handleGenerate}
          disabled={!prompt.trim() || view === 'loading'}
        >
          {view === 'loading' ? 'Gerando…' : 'Criar motor com IA'}
        </button>

        {view === 'error' && (
          <div className={styles.errorBox}>
            ❌ <strong>Erro:</strong> {error}
            <div className={styles.errorActions}>
              <button onClick={handleRetry}>Tentar de novo</button>
              <button onClick={handleEdit}>Editar prompt</button>
            </div>
          </div>
        )}
      </section>

      {view === 'preview' && motor && (
        <section className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <div>
              <div className={styles.previewEyebrow}>PRÉ-VISUALIZAÇÃO</div>
              <h2 className={styles.previewTitle}>
                {motor.metadata.icon} {motor.metadata.title}
              </h2>
              <p className={styles.previewDescription}>
                {motor.metadata.description}
              </p>
            </div>
            <div className={styles.previewActions}>
              <button className={styles.secondaryButton} onClick={handleRetry}>
                ↻ Gerar de novo
              </button>
              <button className={styles.primaryButton} onClick={handleSave}>
                ✓ Salvar na Agência
              </button>
            </div>
          </div>

          <div className={styles.previewFrame}>
            <AdminSocialImage motor={motor} />
          </div>
        </section>
      )}

      {view !== 'preview' && (
        <section className={styles.roadmap}>
          <h2 className={styles.roadmapTitle}>Como funciona</h2>
          <div className={styles.roadmapGrid}>
            <div className={styles.roadmapItem}>
              <div className={styles.roadmapStep}>01</div>
              <h3>Descreva</h3>
              <p>Em linguagem natural, conta o que você quer.</p>
            </div>
            <div className={styles.roadmapItem}>
              <div className={styles.roadmapStep}>02</div>
              <h3>IA monta</h3>
              <p>Claude interpreta e gera a configuração do motor.</p>
            </div>
            <div className={styles.roadmapItem}>
              <div className={styles.roadmapStep}>03</div>
              <h3>Você revisa</h3>
              <p>Preview ao vivo. Aprove ou regere com 1 clique.</p>
            </div>
            <div className={styles.roadmapItem}>
              <div className={styles.roadmapStep}>04</div>
              <h3>Vira card</h3>
              <p>Aparece na Agência NZ pronto pra usar quantas vezes quiser.</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
