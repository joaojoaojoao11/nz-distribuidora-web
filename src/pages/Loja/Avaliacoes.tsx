// O bloco de avaliações na página do produto.
//
// Regras de tela que vieram do plano (docs/PLANO_PROVA_SOCIAL.md):
//
//   · **Sem avaliação, o bloco some.** Não existe "seja o primeiro a avaliar"
//     com cinco estrelas vazias fingindo conteúdo — o vazio honesto é melhor
//     que o enfeite. Quem não comprou e não há o que ler não vê nada.
//   · **Mas quem PODE comentar comenta aqui mesmo.** O formulário abre na
//     própria página do produto. Mandar o cliente para outra tela procurar o
//     produto numa lista é o mesmo que não oferecer.
//   · **Nota baixa fica.** Catálogo só com cinco estrelas é o sinal de fraude
//     mais óbvio que existe. A distribuição inteira aparece.
//   · **"Avaliação incentivada" é dito, não escondido.** Quem avalia ganha
//     pontos; a lei permite o incentivo e exige a informação.

import { useEffect, useState } from 'react';
import {
  enviarAvaliacao,
  esquecerAvaliaveis,
  listarAvaliacoes,
  possoAvaliarSlug,
  textoDoErro,
  type AvaliacaoPublica,
  type ResumoAvaliacoes,
} from '../../lib/shop/avaliacoes';
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


/** O formulário de avaliação, na própria página do produto. */
function Formulario({ slug, aoEnviar }: { slug: string; aoEnviar: () => void }) {
  const [nota, setNota] = useState(0);
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const enviar = async () => {
    if (nota < 1) {
      setErro('Escolha uma nota de 1 a 5.');
      return;
    }
    if (texto.trim().length < 20) {
      setErro('Escreva um pouco mais — pelo menos 20 caracteres.');
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      await enviarAvaliacao({ slug, nota, titulo: titulo.trim() || undefined, texto: texto.trim() });
      // A lista de "posso avaliar" mudou; o cache da sessão precisa cair.
      esquecerAvaliaveis();
      aoEnviar();
    } catch (e) {
      setErro(textoDoErro(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={styles.formulario}>
      <label className={styles.rotulo}>Sua nota</label>
      <span className={styles.estrelasEntrada}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            className={`${styles.estrelaBtn} ${i <= nota ? styles.estrelaAcesa : ''}`}
            onClick={() => setNota(i)}
            aria-label={`${i} ${i === 1 ? 'estrela' : 'estrelas'}`}
            aria-pressed={i === nota}
          >
            ★
          </button>
        ))}
      </span>

      <label className={styles.rotulo} htmlFor={`tit-${slug}`}>
        Título <span className={styles.mudo}>(opcional)</span>
      </label>
      <input id={`tit-${slug}`} className={styles.campo} value={titulo} maxLength={120} onChange={(e) => setTitulo(e.target.value)} placeholder="Resumo em uma linha" />

      <label className={styles.rotulo} htmlFor={`txt-${slug}`}>
        Como foi usar
      </label>
      <textarea
        id={`txt-${slug}`}
        className={styles.campoTexto}
        value={texto}
        maxLength={3000}
        rows={5}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Em que aplicou, como se comportou na instalação, o que você diria para quem está pensando em comprar."
      />
      <p className={styles.contador}>{texto.trim().length} caracteres</p>

      {erro && <p className={styles.erro}>{erro}</p>}

      <p className={styles.mudo}>
        Sua avaliação passa por conferência antes de aparecer aqui. Nota baixa é publicada do mesmo jeito, e os pontos
        que você ganha não dependem da nota que der.
      </p>

      <button type="button" className={styles.enviar} disabled={enviando} onClick={() => void enviar()}>
        {enviando ? 'Enviando…' : 'Enviar avaliação'}
      </button>
    </div>
  );
}

const data = (s: string) => new Date(s).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

export default function Avaliacoes({ slug }: { slug: string }) {
  const [podeAvaliar, setPodeAvaliar] = useState(false);
  const [lista, setLista] = useState<AvaliacaoPublica[]>([]);
  const [resumo, setResumo] = useState<ResumoAvaliacoes | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [todas, setTodas] = useState(false);
  const [escrevendo, setEscrevendo] = useState(false);
  const [enviada, setEnviada] = useState(false);

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

  // Confirmação de envio: vale para os dois estados abaixo.
  const recibo = (
    <p className={styles.recibo}>
      Avaliação enviada. Ela aparece aqui assim que for conferida — e os pontos entram na sua conta junto.
    </p>
  );

  // Sem avaliação nenhuma: quem não pode comentar não vê NADA. Nem título, nem
  // estrela vazia, nem "seja o primeiro" — não há o que ler, então não há bloco.
  if (!resumo || resumo.total === 0) {
    if (!podeAvaliar && !enviada) return null;
    return (
      <section className={styles.bloco}>
        {enviada ? (
          recibo
        ) : escrevendo ? (
          <>
            <h2 className={styles.titulo}>Avaliar este produto</h2>
            <Formulario
              slug={slug}
              aoEnviar={() => {
                setEscrevendo(false);
                setEnviada(true);
              }}
            />
          </>
        ) : (
          <div className={styles.chamada}>
            <p className={styles.chamadaTexto}>
              Você comprou este produto. Ninguém avaliou ainda — a sua é a primeira que quem chegar aqui vai ler.
            </p>
            <button type="button" className={styles.enviar} onClick={() => setEscrevendo(true)}>
              Avaliar este produto
            </button>
          </div>
        )}
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

      {enviada && recibo}

      {podeAvaliar && !enviada && (
        escrevendo ? (
          <Formulario
            slug={slug}
            aoEnviar={() => {
              setEscrevendo(false);
              setEnviada(true);
            }}
          />
        ) : (
          <div className={styles.chamada}>
            <p className={styles.chamadaTexto}>Você comprou este produto e ainda não avaliou.</p>
            <button type="button" className={styles.enviar} onClick={() => setEscrevendo(true)}>
              Avaliar este produto
            </button>
          </div>
        )
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
