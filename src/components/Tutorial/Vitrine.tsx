// Vitrine dos tutoriais "Como funciona" — só existe no localhost (rota
// /dev/tutoriais, registrada em App.tsx com import.meta.env.DEV). Lista todos os
// tutoriais por área, cada um com o botão do jeito que aparece na tela, para
// conferir texto e animação sem precisar de login nem de dados.
// Com ?passos=1, mostra TODOS os passos de todos os tutoriais de uma vez, com as
// cenas paradas no estado final: para revisar o texto inteiro numa leitura só.

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AREAS, carregarArea, ROTULO_PUBLICO, type Area } from '../../lib/tutoriais';
import BotaoTutorial from './BotaoTutorial';
import Cena from './Cenas';
import { comNegrito } from './negrito';
import s from './Tutorial.module.css';
import type { Tutorial } from './tipos';

const NOME_AREA: Record<Area, string> = {
  admin: 'Painel administrativo',
  conta: 'Área do cliente (/painel)',
  loja: 'Loja, carrinho, checkout e cadastro',
  garantia: 'Garantia',
};

export default function VitrineTutoriais() {
  const [porArea, setPorArea] = useState<Partial<Record<Area, Tutorial[]>>>({});
  const [params] = useSearchParams();
  const todosOsPassos = params.get('passos') === '1';

  useEffect(() => {
    let vivo = true;
    void Promise.all(AREAS.map(async (a) => [a, await carregarArea(a)] as const)).then((pares) => {
      if (vivo) setPorArea(Object.fromEntries(pares));
    });
    return () => {
      vivo = false;
    };
  }, []);

  const total = Object.values(porArea).reduce((soma, l) => soma + (l?.length ?? 0), 0);

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0c', padding: '2rem 16px 4rem' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <p style={{ color: '#8a8a8f', fontSize: '0.8rem' }}>
          Vitrine dos tutoriais “Como funciona” (só no localhost) · {total} tutoriais.{' '}
          {todosOsPassos ? (
            <a href="?" style={{ color: '#fff' }}>
              Voltar aos botões
            </a>
          ) : (
            <a href="?passos=1" style={{ color: '#fff' }}>
              Ver todos os passos de uma vez
            </a>
          )}
        </p>
        {AREAS.map((a) => {
          const lista = porArea[a] ?? [];
          if (!lista.length) return null;
          return (
            <section key={a}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.8rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ff4545', marginBottom: '0.8rem' }}>
                {NOME_AREA[a]} · {lista.length}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {lista.map((t) => (
                  <div
                    key={t.id}
                    style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem 0.9rem', padding: '0.8rem 1rem', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, background: '#111114' }}
                  >
                    <strong style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: '1.05rem' }}>{t.titulo}</strong>
                    <BotaoTutorial id={t.id} />
                    <span style={{ flexBasis: '100%', color: '#8a8a8f', fontSize: '0.74rem' }}>
                      {t.id} · {ROTULO_PUBLICO[t.publico]} · {t.passos.length} passos — {t.resumo}
                    </span>
                    {todosOsPassos && (
                      <div style={{ flexBasis: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginTop: '0.6rem' }}>
                        {t.passos.map((p, i) => (
                          <div key={i}>
                            <div className={s.palco}>
                              <Cena cena={p.cena} parado />
                            </div>
                            <div className={s.passo}>
                              <span className={s.contagem}>
                                Passo {i + 1} de {t.passos.length}
                              </span>
                              <h3 className={s.passoTitulo}>{p.titulo}</h3>
                              <p className={s.passoTexto}>{comNegrito(p.texto)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
