// /painel/avaliacoes — avaliar o que comprou, e acompanhar o que já escreveu.
//
// A lista de "o que posso avaliar" vem do servidor, que junta as compras do
// site com as do NZERP. Quem não comprou nada não vê formulário nenhum — não
// existe caminho na tela para avaliar produto que a pessoa não tem.
//
// A moderação é dita na cara: a avaliação entra como pendente e o cliente
// acompanha o estado dela aqui. Sumir com a avaliação sem explicação é o tipo
// de coisa que faz o cliente achar que a loja censura nota baixa.

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  enviarAvaliacao,
  minhasAvaliacoes,
  possoAvaliar,
  esquecerAvaliaveis,
  textoDoErro,
  type MinhaAvaliacao,
  type ProdutoAvaliavel,
  type RegrasDePonto,
} from '../../lib/shop/avaliacoes';
import styles from './Painel.module.css';

const ROTULO_STATUS: Record<string, string> = {
  pendente: 'Em análise',
  aprovada: 'Publicada',
  recusada: 'Não publicada',
};

function Estrelas({ nota, onChange }: { nota: number; onChange?: (n: number) => void }) {
  return (
    <span className={styles.estrelasEntrada}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          className={`${styles.estrelaBtn} ${i <= nota ? styles.estrelaAcesa : ''}`}
          onClick={() => onChange?.(i)}
          disabled={!onChange}
          aria-label={`${i} ${i === 1 ? 'estrela' : 'estrelas'}`}
          aria-pressed={i === nota}
        >
          ★
        </button>
      ))}
    </span>
  );
}

export default function PainelAvaliacoes() {
  const { user } = useAuth();
  const [avaliaveis, setAvaliaveis] = useState<ProdutoAvaliavel[]>([]);
  const [regras, setRegras] = useState<RegrasDePonto | null>(null);
  const [minhas, setMinhas] = useState<MinhaAvaliacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState<string | null>(null);
  const [nota, setNota] = useState(0);
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!user) return;
    try {
      const [a, m] = await Promise.all([possoAvaliar(), minhasAvaliacoes()]);
      setAvaliaveis(a.produtos);
      setRegras(a.regras);
      setMinhas(m.avaliacoes);
    } catch (e) {
      setAviso(textoDoErro(e));
    } finally {
      setCarregando(false);
    }
  }, [user]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const abrir = (slug: string) => {
    setAberto(slug);
    setNota(0);
    setTitulo('');
    setTexto('');
    setAviso(null);
  };

  const enviar = async (slug: string) => {
    if (nota < 1) {
      setAviso('Escolha uma nota de 1 a 5.');
      return;
    }
    if (texto.trim().length < 20) {
      setAviso('Escreva um pouco mais — pelo menos 20 caracteres.');
      return;
    }
    setEnviando(true);
    setAviso(null);
    try {
      const r = await enviarAvaliacao({ slug, nota, titulo: titulo.trim() || undefined, texto: texto.trim() });
      setAberto(null);
      // A lista de avaliáveis mudou; o cache da página do produto também.
      esquecerAvaliaveis();
      await carregar();
      setAviso(`Avaliação enviada. Assim que for publicada, ${r.pontosPrevistos} pontos entram na sua conta.`);
    } catch (e) {
      setAviso(textoDoErro(e));
    } finally {
      setEnviando(false);
    }
  };

  if (carregando) return <p className={styles.mudo}>Carregando…</p>;

  const previstos = regras
    ? regras.base + (texto.trim().length >= regras.minimoTextoLongo ? regras.textoLongo : 0)
    : 0;

  return (
    <>
      {aviso && <p className={styles.aviso}>{aviso}</p>}

      {avaliaveis.length === 0 && minhas.length === 0 ? (
        <div className={styles.vazio}>
          <p className={styles.mudo}>
            Quando você comprar, os produtos aparecem aqui para avaliar — e cada avaliação publicada vira pontos que
            viram desconto.
          </p>
          <Link to="/loja" className={styles.botaoSecundario}>
            Ir para a loja
          </Link>
        </div>
      ) : null}

      {avaliaveis.length > 0 && (
        <>
          <h3 className={styles.secaoTitulo}>
            Você comprou e ainda não avaliou
            <small>
              {regras
                ? `${regras.base} pontos por avaliação publicada, +${regras.textoLongo} se você contar bem como usou`
                : 'cada avaliação publicada vira pontos'}
            </small>
          </h3>
          <ul className={styles.cartoes}>
            {avaliaveis.map((p) => (
              <li key={p.slug} className={styles.cartaoPedido}>
                <div className={styles.cartaoTopo}>
                  <Link to={`/loja/${p.slug}`} className={styles.cartaoNumero}>
                    {p.nome}
                  </Link>
                  {p.origem === 'nzerp' && <span className={styles.selo}>NZ</span>}
                </div>

                {aberto === p.slug ? (
                  <div className={styles.formAvaliacao}>
                    <label className={styles.campoRotulo}>Sua nota</label>
                    <Estrelas nota={nota} onChange={setNota} />

                    <label className={styles.campoRotulo} htmlFor={`t-${p.slug}`}>
                      Título <span className={styles.mudo}>(opcional)</span>
                    </label>
                    <input
                      id={`t-${p.slug}`}
                      className={styles.campo}
                      value={titulo}
                      maxLength={120}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Resumo em uma linha"
                    />

                    <label className={styles.campoRotulo} htmlFor={`x-${p.slug}`}>
                      Como foi usar
                    </label>
                    <textarea
                      id={`x-${p.slug}`}
                      className={styles.campoTexto}
                      value={texto}
                      maxLength={3000}
                      rows={5}
                      onChange={(e) => setTexto(e.target.value)}
                      placeholder="Em que aplicou, como se comportou na hora da instalação, o que você diria para quem está pensando em comprar."
                    />
                    <p className={styles.contadorTexto}>
                      {texto.trim().length} caracteres
                      {regras && texto.trim().length < regras.minimoTextoLongo
                        ? ` · ${regras.minimoTextoLongo - texto.trim().length} para ganhar +${regras.textoLongo} pontos`
                        : ''}
                      {regras ? ` · ${previstos} pontos` : ''}
                    </p>

                    <p className={styles.mudo}>
                      Sua avaliação passa por conferência antes de aparecer na loja. Nota baixa é publicada do mesmo
                      jeito, e os pontos não dependem da nota que você der.
                    </p>

                    <div className={styles.cartaoAcoes}>
                      <button
                        type="button"
                        className={styles.botaoPrincipal}
                        disabled={enviando}
                        onClick={() => void enviar(p.slug)}
                      >
                        {enviando ? 'Enviando…' : 'Enviar avaliação'}
                      </button>
                      <button type="button" className={styles.botaoSecundario} onClick={() => setAberto(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.cartaoRodape}>
                    <span className={styles.mudo}>
                      {p.quando ? `Comprado em ${new Date(p.quando).toLocaleDateString('pt-BR')}` : ''}
                    </span>
                    <button type="button" className={styles.botaoSecundario} onClick={() => abrir(p.slug)}>
                      Avaliar
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {minhas.length > 0 && (
        <>
          <h3 className={styles.secaoTitulo}>Suas avaliações</h3>
          <ul className={styles.cartoes}>
            {minhas.map((a) => (
              <li key={a.id} className={styles.cartaoPedido}>
                <div className={styles.cartaoTopo}>
                  <Link to={`/loja/${a.produto_slug}`} className={styles.cartaoNumero}>
                    {a.produto_slug}
                  </Link>
                  <span
                    className={`${styles.pagChip} ${
                      a.status === 'aprovada' ? styles.pagOk : a.status === 'recusada' ? styles.pagRuim : styles.pagPendente
                    }`}
                  >
                    {ROTULO_STATUS[a.status] ?? a.status}
                  </span>
                </div>
                <div className={styles.cartaoStatus}>
                  <Estrelas nota={a.nota} />
                  <span className={styles.mudo}>{new Date(a.criado_em).toLocaleDateString('pt-BR')}</span>
                </div>
                {a.titulo && <strong>{a.titulo}</strong>}
                <p className={styles.itensErp}>{a.texto}</p>
                {a.motivo_recusa && <p className={styles.aviso}>{a.motivo_recusa}</p>}
                {a.resposta_loja && (
                  <p className={styles.itensErp}>
                    <strong>Resposta da NZ:</strong> {a.resposta_loja}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
