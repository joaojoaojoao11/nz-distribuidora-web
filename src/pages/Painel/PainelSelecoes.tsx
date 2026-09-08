// /painel/selecoes — os links que a equipe montou para clientes.
//
// Fica na conta e não no /admin de propósito: quem monta seleção é o vendedor,
// e ele já vive na loja e na própria conta. Pedir para ele abrir o painel
// administrativo para copiar um link seria mandá-lo para outro lugar do site no
// meio de uma conversa de WhatsApp.
//
// Duas abas porque são duas perguntas diferentes: "o que está de pé agora?"
// (ativas — copiar, mandar, encerrar) e "o que caiu?" (expiradas — renovar, que
// devolve o MESMO link, o que o cliente já tem na conversa).
//
// A leitura é direta no Supabase, com a RLS decidindo (dono ou equipe). Só as
// ESCRITAS passam pelo endpoint: renovar e encerrar mexem em prazo, e prazo não
// pode nascer do navegador.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { getShopItem, useShopCatalog } from '../../lib/shop/store';
import {
  encerrarSelecao,
  renovarSelecao,
  textoDoErroSelecao,
  urlDaSelecao,
  whatsappDaSelecao,
  type SelecaoDoPainel,
} from '../../lib/shop/selecoes';
import { estaAtiva, textoDeValidade } from '../../lib/shop/selecoes/regras';
import styles from './Painel.module.css';
import proprio from './PainelSelecoes.module.css';

type Aba = 'ativas' | 'expiradas';
const CHAVE_ABA = 'nz:painel:selecoes:aba';
/** Quantas miniaturas cabem antes de virar "e mais N". */
const MINIATURAS = 4;

export default function PainelSelecoes() {
  const { user, isAdmin, loading } = useAuth();
  // O catálogo é o que transforma slug em foto e nome nas miniaturas.
  useShopCatalog();

  const [linhas, setLinhas] = useState<SelecaoDoPainel[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [aba, setAba] = useState<Aba>(() => {
    try {
      const s = sessionStorage.getItem(CHAVE_ABA);
      return s === 'expiradas' ? 'expiradas' : 'ativas';
    } catch {
      return 'ativas';
    }
  });

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from('selecoes')
      .select(
        'id, token, titulo, slugs, mostrar_preco, acrescimo_pct, expira_em, criado_em, renovada_em, encerrada_em, visitas, ultima_visita_em'
      )
      .order('criado_em', { ascending: false })
      .limit(200);
    if (error) setErro(error.message);
    setLinhas((data ?? []) as SelecaoDoPainel[]);
    setCarregando(false);
  }, []);

  useEffect(() => {
    if (!user || !isAdmin) return;
    // Carga inicial da lista.
    void carregar();
  }, [user, isAdmin, carregar]);

  const { ativas, expiradas } = useMemo(() => {
    const a: SelecaoDoPainel[] = [];
    const e: SelecaoDoPainel[] = [];
    for (const s of linhas) (estaAtiva(s) ? a : e).push(s);
    return { ativas: a, expiradas: e };
  }, [linhas]);

  const trocarAba = (id: Aba) => {
    setAba(id);
    try {
      sessionStorage.setItem(CHAVE_ABA, id);
    } catch {
      /* modo privado: só não lembra */
    }
  };

  const copiar = async (s: SelecaoDoPainel) => {
    try {
      await navigator.clipboard.writeText(urlDaSelecao(s.token));
      setCopiado(s.id);
      setTimeout(() => setCopiado(null), 2400);
    } catch {
      setMsg('Não consegui copiar. O link está no botão "Abrir".');
    }
  };

  const renovar = async (s: SelecaoDoPainel) => {
    setOcupado(s.id);
    setMsg('');
    try {
      const r = await renovarSelecao(s.id);
      setLinhas((l) =>
        l.map((x) => (x.id === s.id ? { ...x, expira_em: r.expiraEm, encerrada_em: null, renovada_em: new Date().toISOString() } : x))
      );
      // O link é o mesmo que o cliente já tem: é isso que renovar significa.
      setMsg('Renovada por mais 24 h — o mesmo link volta a abrir.');
      trocarAba('ativas');
    } catch (e) {
      setMsg(textoDoErroSelecao(e));
    } finally {
      setOcupado(null);
    }
  };

  const encerrar = async (s: SelecaoDoPainel) => {
    setOcupado(s.id);
    setMsg('');
    try {
      await encerrarSelecao(s.id);
      setLinhas((l) => l.map((x) => (x.id === s.id ? { ...x, encerrada_em: new Date().toISOString() } : x)));
      setMsg('Encerrada. O link parou de abrir agora.');
      setConfirmando(null);
    } catch (e) {
      setMsg(textoDoErroSelecao(e));
    } finally {
      setOcupado(null);
    }
  };

  if (loading) return null;
  // Esconder o item do menu não protege a tela: quem digitar a URL cai aqui.
  if (!isAdmin) return <Navigate to="/painel" replace />;

  const lista = aba === 'ativas' ? ativas : expiradas;

  return (
    <>
      <div className={proprio.abas} role="tablist">
        {(['ativas', 'expiradas'] as Aba[]).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={aba === id}
            className={`${proprio.aba} ${aba === id ? proprio.abaAtiva : ''}`}
            onClick={() => trocarAba(id)}
          >
            {id === 'ativas' ? 'Ativas' : 'Expiradas'}
            <span className={proprio.abaContador}>{id === 'ativas' ? ativas.length : expiradas.length}</span>
          </button>
        ))}
      </div>

      {msg && <p className={styles.ok}>{msg}</p>}
      {erro && <p className={styles.erro}>{erro}</p>}

      {carregando ? (
        <p className={styles.mudo}>Carregando…</p>
      ) : lista.length === 0 ? (
        <div className={styles.vazio}>
          <p className={styles.mudo}>
            {aba === 'ativas'
              ? 'Nenhuma seleção de pé agora. Monte uma na loja: filtre, tire o que não serve e toque em CONCLUIR.'
              : 'Nenhuma seleção expirada.'}
          </p>
          {aba === 'ativas' && (
            <Link to="/loja" className={styles.botaoSecundario}>
              Montar uma na loja
            </Link>
          )}
        </div>
      ) : (
        <ul className={proprio.lista}>
          {lista.map((s) => {
            const itens = s.slugs.slice(0, MINIATURAS).map((slug) => getShopItem(slug));
            const restantes = s.slugs.length - itens.length;
            const encerrada = Boolean(s.encerrada_em);
            return (
              <li key={s.id} className={proprio.cartao}>
                <div className={proprio.topo}>
                  <div className={proprio.identidade}>
                    <strong className={proprio.titulo}>
                      {s.titulo || `Seleção de ${new Date(s.criado_em).toLocaleDateString('pt-BR')}`}
                    </strong>
                    <span className={proprio.meta}>
                      {s.slugs.length} {s.slugs.length === 1 ? 'produto' : 'produtos'} ·{' '}
                      {encerrada
                        ? `encerrada em ${new Date(s.encerrada_em as string).toLocaleDateString('pt-BR')}`
                        : textoDeValidade(s.expira_em)}
                      {s.visitas > 0 && ` · ${s.visitas} ${s.visitas === 1 ? 'abertura' : 'aberturas'}`}
                    </span>
                  </div>
                  <span className={s.mostrar_preco ? proprio.chipPreco : proprio.chipSemPreco}>
                    {s.mostrar_preco
                      ? Number(s.acrescimo_pct) > 0
                        ? `Preço visível · +${Number(s.acrescimo_pct)}%`
                        : 'Preço visível'
                      : 'Sem preço'}
                  </span>
                </div>

                <div className={proprio.miniaturas}>
                  {itens.map((i, n) =>
                    i ? (
                      <span
                        key={`${s.id}-${n}`}
                        className={proprio.mini}
                        title={i.name}
                        style={i.image ? { backgroundImage: `url(${i.image})` } : i.hex ? { background: i.hex } : undefined}
                      />
                    ) : (
                      <span key={`${s.id}-${n}`} className={`${proprio.mini} ${proprio.miniVazia}`} />
                    )
                  )}
                  {restantes > 0 && <span className={proprio.maisN}>+{restantes}</span>}
                </div>

                <div className={proprio.acoes}>
                  {!encerrada && estaAtiva(s) && (
                    <>
                      <a href={urlDaSelecao(s.token)} target="_blank" rel="noopener noreferrer" className={styles.botaoSecundario}>
                        Abrir
                      </a>
                      <button type="button" className={styles.botaoSecundario} onClick={() => void copiar(s)}>
                        {copiado === s.id ? 'Copiado ✓' : 'Copiar link'}
                      </button>
                      <a
                        href={whatsappDaSelecao(s.token, s.titulo)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.botaoSecundario}
                      >
                        WhatsApp
                      </a>
                    </>
                  )}

                  <button
                    type="button"
                    className={styles.botaoSecundario}
                    disabled={ocupado === s.id}
                    onClick={() => void renovar(s)}
                  >
                    {ocupado === s.id ? '…' : 'Renovar 24 h'}
                  </button>

                  {!encerrada && estaAtiva(s) &&
                    (confirmando === s.id ? (
                      <span className={proprio.confirma}>
                        Encerrar agora?
                        <button type="button" className={styles.botaoPerigo} disabled={ocupado === s.id} onClick={() => void encerrar(s)}>
                          Sim, encerrar
                        </button>
                        <button type="button" className={styles.botaoSecundario} onClick={() => setConfirmando(null)}>
                          Não
                        </button>
                      </span>
                    ) : (
                      <button type="button" className={styles.botaoSecundario} onClick={() => setConfirmando(s.id)}>
                        Encerrar
                      </button>
                    ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
