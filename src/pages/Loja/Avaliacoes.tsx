// O bloco de avaliações na página do produto.
//
// Regras de tela que vieram do plano (docs/PLANO_PROVA_SOCIAL.md):
//
//   · **Sem avaliação, o bloco some.** Não existe "seja o primeiro a avaliar"
//     com cinco estrelas vazias fingindo conteúdo — o vazio honesto é melhor
//     que o enfeite. Só quem PODE avaliar vê um convite, e ele é discreto.
//   · **Nota baixa fica.** Catálogo só com cinco estrelas é o sinal de fraude
//     mais óbvio que existe. A distribuição inteira aparece.
//   · **"Avaliação incentivada" é dito, não escondido.** Quem avalia ganha
//     pontos; a lei permite o incentivo e exige a informação.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarAvaliacoes, possoAvaliarSlug, type AvaliacaoPublica, type ResumoAvaliacoes } from '../../lib/shop/avaliacoes';
import styles from './Avaliacoes.module.css';

function Estrelas({ nota, tamanho = 1 }: { nota: number; tamanho?: number }) {
  return (
    <span className={styles.estrelas} style={{ fontSize: `${tamanho}rem` }} aria-label={`${nota} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(nota) ? styles.cheia : styles.vazia} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

const data = (s: string) => new Date(s).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

export default function Avaliacoes({ slug }: { slug: string }) {
  const [podeAvaliar, setPodeAvaliar] = useState(false);
  const [lista, setLista] = useState<AvaliacaoPublica[]>([]);
  const [resumo, setResumo] = useState<ResumoAvaliacoes | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [todas, setTodas] = useState(false);

  useEffect(() => {
    // Só pergunta se o visitante está logado; a função devolve false na hora
    // para quem não está, e guarda a resposta por sessão.
    let vivo = true;
    void possoAvaliarSlug(slug).then((pode) => vivo && setPodeAvaliar(pode));
    return () => {
      vivo = false;
    };
  }, [slug]);

  useEffect(() => {
    // Nada de `setCarregando(true)` aqui: setState sincrono dentro do efeito e
    // o que o React 19 proibe (`react-hooks/set-state-in-effect`). O estado
    // nasce carregando e so muda quando a resposta chega.
    let vivo = true;
    void listarAvaliacoes(slug)
      .then((r) => {
        if (!vivo) return;
        setLista(r.avaliacoes);
        setResumo(r.resumo);
        setCarregando(false);
      })
      .catch(() => vivo && setCarregando(false));
    return () => {
      vivo = false;
    };
  }, [slug]);

  if (carregando) return null;

  // Sem avaliação nenhuma: só aparece se ESTE visitante pode escrever a
  // primeira. Para todo mundo, o bloco não existe.
  if (!resumo || resumo.total === 0) {
    if (!podeAvaliar) return null;
    return (
      <section className={styles.bloco}>
        <h2 className={styles.titulo}>Avaliações</h2>
        <p className={styles.convite}>
          Você comprou este produto. Ninguém avaliou ainda — sua avaliação é a primeira que quem chegar aqui vai ler.{' '}
          <Link to="/painel/avaliacoes" className={styles.linkConvite}>
            Avaliar e ganhar pontos
          </Link>
        </p>
      </section>
    );
  }

  const total = Number(resumo.total);
  const media = Number(resumo.media);
  const barras = [
    { n: 5, q: resumo.n5 },
    { n: 4, q: resumo.n4 },
    { n: 3, q: resumo.n3 },
    { n: 2, q: resumo.n2 },
    { n: 1, q: resumo.n1 },
  ];
  const mostradas = todas ? lista : lista.slice(0, 4);

  return (
    <section className={styles.bloco}>
      <h2 className={styles.titulo}>
        Avaliações <span className={styles.contagem}>{total}</span>
      </h2>

      <div className={styles.resumo}>
        <div className={styles.media}>
          <strong>{media.toFixed(1).replace('.', ',')}</strong>
          <Estrelas nota={media} tamanho={0.95} />
          <span className={styles.mudo}>
            {total} {total === 1 ? 'avaliação' : 'avaliações'} de quem comprou
          </span>
        </div>

        <div className={styles.distribuicao}>
          {barras.map((b) => (
            <div key={b.n} className={styles.linhaBarra}>
              <span className={styles.rotuloBarra}>{b.n}★</span>
              <span className={styles.trilho}>
                <span className={styles.preenche} style={{ width: `${total ? (b.q / total) * 100 : 0}%` }} />
              </span>
              <span className={styles.qtdBarra}>{b.q}</span>
            </div>
          ))}
        </div>
      </div>

      {podeAvaliar && (
        <p className={styles.convite}>
          Você comprou este produto.{' '}
          <Link to="/painel/avaliacoes" className={styles.linkConvite}>
            Avaliar e ganhar pontos
          </Link>
        </p>
      )}

      <ul className={styles.lista}>
        {mostradas.map((a) => (
          <li key={a.id} className={styles.item}>
            <div className={styles.itemTopo}>
              <Estrelas nota={a.nota} tamanho={0.8} />
              {a.titulo && <strong className={styles.itemTitulo}>{a.titulo}</strong>}
            </div>

            <p className={styles.itemTexto}>{a.texto}</p>

            {a.foto_url && (
              <img src={a.foto_url} alt={`Aplicação enviada por ${a.autor_nome}`} className={styles.itemFoto} loading="lazy" />
            )}

            <div className={styles.itemRodape}>
              <span className={styles.autor}>{a.autor_nome}</span>
              {a.autor_cidade && <span className={styles.mudo}>{a.autor_cidade}</span>}
              <span className={styles.selo} title="Este cliente comprou este produto na NZ">
                compra verificada
              </span>
              {a.aplicador && <span className={styles.selo}>aplicador profissional</span>}
              <span className={styles.mudo}>{data(a.criado_em)}</span>
              {/* Exigência legal e escolha de desenho: quem ganhou ponto por
                  avaliar tem que aparecer dito. */}
              {a.incentivada && (
                <span className={styles.incentivada} title="O cliente recebeu pontos do programa de fidelidade por avaliar. Os pontos não dependem da nota dada.">
                  avaliação incentivada
                </span>
              )}
            </div>

            {a.resposta_loja && (
              <div className={styles.resposta}>
                <span className={styles.respostaQuem}>Resposta da NZ</span>
                <p>{a.resposta_loja}</p>
              </div>
            )}
          </li>
        ))}
      </ul>

      {lista.length > 4 && !todas && (
        <button type="button" className={styles.verMais} onClick={() => setTodas(true)}>
          Ver as {lista.length} avaliações
        </button>
      )}
    </section>
  );
}
