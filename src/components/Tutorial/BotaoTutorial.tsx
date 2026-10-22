// Botão "Como funciona" (pedido do João, 22/10/2026): explica em poucos passos,
// com uma animação curta em cada um, como funciona a tela ou a função onde ele
// está. O conteúdo vem de src/lib/tutoriais/ pelo `id` (carregado à parte, por
// área); um id sem tutorial não desenha nada. Abre só no clique. A bolinha
// vermelha some depois da primeira vez que a pessoa abre (lembrado neste
// navegador).

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, RotateCcw, X } from 'lucide-react';
import { carregarTutorial, ROTULO_PUBLICO } from '../../lib/tutoriais';
import Cena from './Cenas';
import { comNegrito } from './negrito';
import type { Tutorial } from './tipos';
import s from './Tutorial.module.css';

const CHAVE_VISTO = (id: string) => `nz:tutorial-visto:${id}`;

function jaViu(id: string): boolean {
  try {
    return window.localStorage.getItem(CHAVE_VISTO(id)) === '1';
  } catch {
    return false;
  }
}

function marcarVisto(id: string) {
  try {
    window.localStorage.setItem(CHAVE_VISTO(id), '1');
  } catch {
    /* navegador sem armazenamento: a bolinha só volta a aparecer */
  }
}

/** O texto da área chega à parte (ver lib/tutoriais/index.ts); até lá o botão não aparece. */
function useTutorial(id: string): Tutorial | undefined {
  const [carregado, setCarregado] = useState<{ id: string; tutorial: Tutorial | undefined } | null>(null);
  useEffect(() => {
    let vivo = true;
    void carregarTutorial(id).then((tutorial) => {
      if (vivo) setCarregado({ id, tutorial });
    });
    return () => {
      vivo = false;
    };
  }, [id]);
  return carregado?.id === id ? carregado.tutorial : undefined;
}

/** `compacto`: no celular mostra só o ícone (para cabeçalho apertado, como o do admin). */
export default function BotaoTutorial({ id, rotulo = 'Como funciona', compacto = false }: { id: string; rotulo?: string; compacto?: boolean }) {
  const tutorial = useTutorial(id);
  const [aberto, setAberto] = useState(false);
  const [passo, setPasso] = useState(0);
  const [direcao, setDirecao] = useState(1);
  const [rodada, setRodada] = useState(0);
  const [visto, setVisto] = useState(() => jaViu(id));
  const botaoRef = useRef<HTMLButtonElement>(null);
  const janelaRef = useRef<HTMLDivElement>(null);
  const parado = useReducedMotion() ?? false;
  // Com "reduzir movimento" ligado as cenas abrem paradas; a pessoa pode pedir
  // para ver a animação (vale até fechar a janela).
  const [animarMesmo, setAnimarMesmo] = useState(false);
  const semMovimento = parado && !animarMesmo;

  const total = tutorial?.passos.length ?? 0;

  const irPara = (novo: number) => {
    if (novo < 0 || novo >= total) return;
    setDirecao(novo > passo ? 1 : -1);
    setPasso(novo);
    setRodada(0);
  };

  const fechar = () => {
    setAberto(false);
    botaoRef.current?.focus();
  };

  const abrir = () => {
    setPasso(0);
    setDirecao(1);
    setRodada(0);
    setAnimarMesmo(false);
    setAberto(true);
    if (!visto) {
      marcarVisto(id);
      setVisto(true);
    }
  };

  // Página parada atrás e foco na janela.
  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    janelaRef.current?.focus();
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [aberto]);

  // Teclado no documento inteiro (Esc fecha, setas trocam o passo): ao trocar
  // de passo o botão focado some junto com a cena, e o foco cai no body.
  useEffect(() => {
    if (!aberto) return;
    const teclas = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAberto(false);
        botaoRef.current?.focus();
        return;
      }
      const novo = e.key === 'ArrowRight' ? passo + 1 : e.key === 'ArrowLeft' ? passo - 1 : -1;
      if (novo < 0 || novo >= total) return;
      setDirecao(novo > passo ? 1 : -1);
      setPasso(novo);
      setRodada(0);
    };
    window.addEventListener('keydown', teclas);
    return () => window.removeEventListener('keydown', teclas);
  }, [aberto, passo, total]);

  if (!tutorial) return null;
  const atual = tutorial.passos[passo];
  const nomeDoBotao = rotulo === tutorial.titulo ? rotulo : `${rotulo}: ${tutorial.titulo}`;
  const ultimo = passo === total - 1;

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        className={compacto ? `${s.botao} ${s.botaoCompacto}` : s.botao}
        onClick={abrir}
        aria-haspopup="dialog"
        aria-label={nomeDoBotao}
        title={nomeDoBotao}
      >
        <span className={s.botaoIcone} aria-hidden="true">
          <Play size={10} strokeWidth={2.6} fill="currentColor" style={{ marginLeft: 1 }} />
        </span>
        <span className={s.botaoTexto}>{rotulo}</span>
        {!visto && <span className={s.novo} aria-hidden="true" />}
      </button>

      {createPortal(
        <AnimatePresence>
          {aberto && (
            <motion.div
              className={s.fundo}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: parado ? 0 : 0.2 }}
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) fechar();
              }}
            >
              <motion.div
                ref={janelaRef}
                className={s.janela}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`tutorial-${id}-titulo`}
                tabIndex={-1}
                initial={parado ? false : { opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={parado ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className={s.topo}>
                  <div>
                    <span className={s.olho}>Como funciona · {ROTULO_PUBLICO[tutorial.publico]}</span>
                    <h2 id={`tutorial-${id}-titulo`} className={s.titulo}>
                      {tutorial.titulo}
                    </h2>
                    <p className={s.resumo}>{tutorial.resumo}</p>
                  </div>
                  <button type="button" className={s.fechar} onClick={fechar} aria-label="Fechar o tutorial">
                    <X size={18} />
                  </button>
                </div>

                <div className={s.corpo}>
                  {/* Sem initial={false}: ele passaria para as cenas e desligaria a animação delas. */}
                  <AnimatePresence mode="wait" custom={direcao}>
                    <motion.div
                      key={passo}
                      custom={direcao}
                      initial={parado ? false : { opacity: 0, x: 28 * direcao }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={parado ? { opacity: 0 } : { opacity: 0, x: -28 * direcao }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                    >
                      <div className={s.palco}>
                        <Cena key={rodada} cena={atual.cena} parado={semMovimento} />
                        {semMovimento ? (
                          <button
                            type="button"
                            className={s.repetir}
                            onClick={() => {
                              setAnimarMesmo(true);
                              setRodada((r) => r + 1);
                            }}
                          >
                            <Play size={10} fill="currentColor" /> ver animação
                          </button>
                        ) : (
                          <button type="button" className={s.repetir} onClick={() => setRodada((r) => r + 1)} aria-label="Repetir a animação">
                            <RotateCcw size={11} /> repetir
                          </button>
                        )}
                      </div>
                      <div className={s.passo} aria-live="polite">
                        <span className={s.contagem}>
                          Passo {passo + 1} de {total}
                        </span>
                        <h3 className={s.passoTitulo}>{atual.titulo}</h3>
                        <p className={s.passoTexto}>{comNegrito(atual.texto)}</p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className={s.rodape}>
                  <div className={s.pontos} aria-label="Passos">
                    {tutorial.passos.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        aria-current={i === passo ? 'step' : undefined}
                        aria-label={`Passo ${i + 1}: ${p.titulo}`}
                        className={`${s.pontoNav} ${i === passo ? s.pontoAtual : ''}`}
                        onClick={() => irPara(i)}
                      >
                        <span />
                      </button>
                    ))}
                  </div>
                  <div className={s.acoes}>
                    <button type="button" className={s.nav} onClick={() => irPara(passo - 1)} disabled={passo === 0}>
                      <ChevronLeft size={16} /> Voltar
                    </button>
                    {ultimo ? (
                      <button type="button" className={`${s.nav} ${s.navPrincipal}`} onClick={fechar}>
                        Entendi
                      </button>
                    ) : (
                      <button type="button" className={`${s.nav} ${s.navPrincipal}`} onClick={() => irPara(passo + 1)}>
                        Próximo <ChevronRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
