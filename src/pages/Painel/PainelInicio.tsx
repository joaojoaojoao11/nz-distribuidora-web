// /painel — o Início da conta, a CENTRAL do cliente (plano Central do cliente, Fase D / D10).
//
// Junta o que as outras abas já têm, sem dado novo:
//   · aviso de parcela vencida com a NZ, quando houver (D9: informativo, sem
//     e-mail e sem vermelho piscando — quem cobra é a NZ);
//   · três cartões: o último pedido (site ou NZ) e a situação, o próximo
//     vencimento com a NZ (com Pagar / Gerar Pix/boleto) e o saldo da carteira;
//   · atalhos (comprar de novo, carrinho guardado, indique e ganhe, garantias);
//   · os últimos pedidos, do site e da NZ juntos.
// No celular ele é TAMBÉM o menu: a lista de seções aparece abaixo do resumo,
// com linhas altas e uma frase de contexto em cada (os atalhos somem, o menu já
// leva a todas as telas).

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { totalItensCarrinho, useCarrinho } from '../../lib/shop/carrinho';
import { useFavoritos } from '../../lib/shop/listasPessoais';
import { BRL, usePrecosLote, usePrecosMapa } from '../../lib/shop/precos';
import { precoUnitario } from '../../lib/shop/unidade';
import { carregarHistoricoErp, pagarTitulo, type PedidoErp, type TituloErp } from '../../lib/shop/historicoErp';
import { meuSaldo, type Saldo } from '../../lib/shop/incentivos';
import { gruposVisiveis } from './painelNav';
import { PAGAMENTO_LABEL, STATUS_LABEL, type PedidoResumo } from './pedidoRotulos';
import BotaoTutorial from '../../components/Tutorial/BotaoTutorial';
import styles from './PainelInicio.module.css';
import { LinkVendas } from '../../components/ContatoVendas/ContatoVendas';

/** Um pedido na lista do Início, venha do site ou do sistema da NZ. */
interface PedidoCentral {
  chave: string;
  numero: number | null;
  daNz: boolean;
  situacao: string;
  transportadora: string | null;
  data: string | null;
  total: number | null;
  para: string;
}

/** Data só (AAAA-MM-DD) é dia local: sem o T12 o navegador lê como UTC e mostra o dia anterior. */
const data = (v: string | null | undefined) => (v ? new Date(v.length === 10 ? `${v}T12:00:00` : v).toLocaleDateString('pt-BR') : null);

const ENVIADOS = new Set(['ENVIADO', 'PRONTO_ENVIO', 'PREPARANDO_ENVIO', 'ENTREGUE']);

function doSite(p: PedidoResumo): PedidoCentral {
  return {
    chave: `site-${p.id}`,
    numero: p.numero,
    daNz: false,
    situacao:
      p.pagamento_status && p.pagamento_status !== 'nenhum' && p.pagamento_status !== 'pago'
        ? (PAGAMENTO_LABEL[p.pagamento_status] ?? p.pagamento_status)
        : (STATUS_LABEL[p.status] ?? p.status),
    transportadora: null,
    data: p.criado_em,
    total: p.total_final != null ? Number(p.total_final) : p.total_estimado != null ? Number(p.total_estimado) : null,
    para: `/painel/pedido/${p.numero}`,
  };
}

function daNz(p: PedidoErp): PedidoCentral {
  return {
    chave: `nz-${p.quoteId}`,
    numero: p.numero,
    daNz: true,
    situacao: STATUS_LABEL[p.status] ?? p.status,
    transportadora: ENVIADOS.has(p.status) ? p.transportadora : null,
    data: p.criadoEm,
    total: p.total,
    para: '/painel/pedidos',
  };
}

export default function PainelInicio() {
  const { user, isAdmin, isApproved, cadastroCompleto } = useAuth();
  const carrinho = useCarrinho();
  const favoritos = useFavoritos();
  const { itens: precos } = usePrecosMapa();
  const [pedidos, setPedidos] = useState<PedidoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [garantias, setGarantias] = useState(0);
  // O que vem do sistema da NZ (pedidos e parcelas) — a mesma consulta, em cache, das abas Pedidos e Pagamentos.
  const [pedidosNz, setPedidosNz] = useState<PedidoErp[]>([]);
  const [titulos, setTitulos] = useState<TituloErp[]>([]);
  const [carregandoNz, setCarregandoNz] = useState(true);
  const [saldo, setSaldo] = useState<Saldo | null>(null);
  const [gerando, setGerando] = useState(false);
  const [avisoPagar, setAvisoPagar] = useState('');

  usePrecosLote(carrinho.map((i) => i.slug));

  useEffect(() => {
    if (!user) return;
    let vivo = true;
    void (async () => {
      const [{ data: ped }, { data: gar }] = await Promise.all([
        supabase
          .from('pedidos')
          .select('id, numero, status, pagamento_status, total_estimado, total_final, criado_em')
          .eq('user_id', user.id)
          .order('criado_em', { ascending: false })
          .limit(3),
        supabase.rpc('minhas_garantias'),
      ]);
      if (!vivo) return;
      setPedidos((ped ?? []) as PedidoResumo[]);
      setGarantias(Array.isArray(gar) ? gar.length : 0);
      setCarregando(false);
    })();
    // Duas bases e a carteira: cada uma chega quando chegar, sem segurar o resto da tela.
    void carregarHistoricoErp(user.id).then((h) => {
      if (!vivo) return;
      setPedidosNz(h.pedidos);
      setTitulos(h.titulos);
      setCarregandoNz(false);
    });
    void meuSaldo()
      .then((r) => {
        if (vivo) setSaldo(r.saldo);
      })
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, [user]);

  // Total do carrinho: só fecha quando todo item tem preço (o mesmo critério da
  // página do carrinho — meio total é pior que nenhum).
  let totalCarrinho: number | null = 0;
  for (const i of carrinho) {
    const p = precos.get(i.slug);
    const unit = precoUnitario(i.unidade, p);
    if (unit == null) {
      totalCarrinho = null;
      break;
    }
    totalCarrinho += Number(unit) * i.qtd;
  }

  const contagem = (c?: string) =>
    c === 'carrinho'
      ? totalItensCarrinho(carrinho)
      : c === 'favoritos'
        ? favoritos.length
        : c === 'garantias'
          ? garantias
          : c === 'pedidos'
            ? pedidos.length + pedidosNz.length
            : 0;

  // ------------------------------------------------------------ a central
  const recentes = [...pedidos.map(doSite), ...pedidosNz.map(daNz)]
    .sort((a, b) => new Date(b.data ?? 0).getTime() - new Date(a.data ?? 0).getTime())
    .slice(0, 3);
  const ultimo = recentes[0] ?? null;

  const vencidos = titulos.filter((t) => t.bloco === 'vencido');
  const somaVencidos = vencidos.reduce((s, t) => s + (t.saldo ?? t.valor ?? 0), 0);
  const proximo =
    titulos
      .filter((t) => t.bloco === 'a_vencer')
      .sort((a, b) => String(a.vencimento ?? '').localeCompare(String(b.vencimento ?? '')))[0] ?? null;

  const gerar = async (t: TituloErp) => {
    setGerando(true);
    setAvisoPagar('');
    const r = await pagarTitulo(t.id);
    if (r.ok) {
      setTitulos((l) => l.map((x) => (x.id === t.id ? r.titulo : x)));
      if (r.titulo.faturaUrl) window.open(r.titulo.faturaUrl, '_blank', 'noopener');
    } else {
      setAvisoPagar(r.mensagem);
    }
    setGerando(false);
  };

  let acaoProximo = (
    <Link to="/painel/pagamentos" className={styles.acao}>
      Ver pagamentos
    </Link>
  );
  if (proximo && !proximo.combinado && proximo.cobrancaViva && (proximo.faturaUrl ?? proximo.boletoUrl)) {
    acaoProximo = (
      <a className={styles.acaoPrincipal} href={(proximo.faturaUrl ?? proximo.boletoUrl)!} target="_blank" rel="noopener noreferrer">
        Pagar
      </a>
    );
  } else if (proximo && !proximo.combinado && proximo.pagavel) {
    acaoProximo = (
      <button type="button" className={styles.acaoPrincipal} disabled={gerando} onClick={() => void gerar(proximo)}>
        {gerando ? 'Gerando…' : 'Gerar Pix/boleto'}
      </button>
    );
  }

  return (
    <>
      <div style={{ marginBottom: '0.9rem' }}>
        <BotaoTutorial id="conta.inicio" rotulo="Como funciona a sua conta" />
      </div>
      {/* ------------------------------------------------------------ status */}
      <section className={isApproved || isAdmin ? `${styles.status} ${styles.statusOk}` : `${styles.status} ${styles.statusPendente}`}>
        {isApproved || isAdmin ? (
          <p>
            <strong>Cadastro aprovado.</strong> Você vê preço de rolo fechado e de metro em toda a <Link to="/loja">loja</Link>.
          </p>
        ) : (
          <p>
            <strong>Cadastro em análise.</strong> A NZ confere os dados e libera os preços — costuma levar um dia útil.
          </p>
        )}
        {cadastroCompleto ? (
          <p className={styles.statusNota}>✓ Cadastro completo — pronto para fechar pedido pelo site.</p>
        ) : (
          <p className={styles.statusNota}>
            Faltam dados para fechar pedido pelo site. <Link to="/painel/dados">Completar agora</Link>
          </p>
        )}
        {!isApproved && !isAdmin && (
          <LinkVendas className={styles.falarNz} mensagem="Olá! Sou cliente e estou no meu painel do site da NZ.">
            Falar com a NZ
          </LinkVendas>
        )}
      </section>

      {/* -------------------------------------------- aviso de vencidos (D9) */}
      {vencidos.length > 0 && (
        <section className={styles.aviso}>
          <p>
            <strong>
              {vencidos.length === 1 ? '1 parcela vencida' : `${vencidos.length} parcelas vencidas`} com a NZ
            </strong>
            , somando {BRL.format(somaVencidos)}. Dá para pagar pelo site ou combinar com a NZ.
          </p>
          <Link to="/painel/pagamentos" className={styles.acao}>
            Ver pagamentos
          </Link>
        </section>
      )}

      {/* ----------------------------------------------------------- cartões */}
      <div className={styles.cartoes}>
        <article className={styles.cartao}>
          <span className={styles.cartaoRotulo}>Último pedido</span>
          <span className={styles.cartaoValor}>
            {ultimo ? (
              <>
                #{ultimo.numero ?? '—'}
                {ultimo.daNz && <span className={styles.selo}>NZ</span>}
              </>
            ) : carregando || carregandoNz ? (
              '—'
            ) : (
              'nenhum'
            )}
          </span>
          <span className={styles.cartaoPe}>
            {ultimo
              ? [ultimo.situacao, ultimo.transportadora, data(ultimo.data)].filter(Boolean).join(' · ')
              : carregando || carregandoNz
                ? 'carregando…'
                : 'nenhum pedido ainda'}
          </span>
          <div className={styles.cartaoAcao}>
            {ultimo ? (
              <Link to={ultimo.para} className={styles.acao}>
                Ver pedido
              </Link>
            ) : (
              <Link to="/loja" className={styles.acao}>
                Ir para a loja
              </Link>
            )}
          </div>
        </article>

        <article className={styles.cartao}>
          <span className={styles.cartaoRotulo}>Próximo vencimento</span>
          <span className={styles.cartaoValor}>{proximo ? BRL.format(proximo.saldo ?? proximo.valor ?? 0) : '—'}</span>
          <span className={styles.cartaoPe}>
            {proximo
              ? `vence ${data(proximo.vencimento) ?? '—'}${proximo.documento ? ` · ${proximo.documento}` : ''}${proximo.combinado ? ' · combinado com a NZ' : ''}`
              : carregandoNz
                ? 'carregando…'
                : 'nada a vencer com a NZ'}
          </span>
          <div className={styles.cartaoAcao}>{acaoProximo}</div>
          {avisoPagar && <p className={styles.cartaoAviso}>{avisoPagar}</p>}
        </article>

        <article className={styles.cartao}>
          <span className={styles.cartaoRotulo}>Saldo da carteira</span>
          <span className={styles.cartaoValor}>{saldo ? BRL.format(saldo.disponivel) : '—'}</span>
          <span className={styles.cartaoPe}>
            {!saldo
              ? 'carregando…'
              : saldo.aLiberar > 0
                ? `+ ${BRL.format(saldo.aLiberar)} a liberar`
                : saldo.disponivel > 0
                  ? 'use no carrinho ou peça o saque'
                  : 'cashback de indicação cai aqui'}
          </span>
          <div className={styles.cartaoAcao}>
            <Link to="/painel/indique" className={styles.acao}>
              Ver carteira
            </Link>
          </div>
        </article>
      </div>

      {/* ----------------------------------------------------------- atalhos */}
      <section className={`${styles.secao} ${styles.soComputador}`}>
        <div className={styles.secaoTopo}>
          <h2>Atalhos</h2>
        </div>
        <div className={styles.atalhos}>
          <Link to="/painel/pedidos" className={styles.atalho}>
            <b>Comprar de novo</b>
            <small>os itens dos seus pedidos</small>
          </Link>
          <Link to="/painel/carrinho" className={carrinho.length ? `${styles.atalho} ${styles.atalhoDestaque}` : styles.atalho}>
            <b>Carrinho guardado</b>
            <small>
              {carrinho.length === 0
                ? 'vazio'
                : `${totalItensCarrinho(carrinho)} ${totalItensCarrinho(carrinho) > 1 ? 'itens' : 'item'}${totalCarrinho != null ? ` · ${BRL.format(totalCarrinho)}` : ''}`}
            </small>
          </Link>
          <Link to="/painel/indique" className={styles.atalho}>
            <b>Indique e ganhe</b>
            <small>cashback por indicação</small>
          </Link>
          <Link to="/painel/garantias" className={styles.atalho}>
            <b>Minhas garantias</b>
            <small>{garantias ? `${garantias} ${garantias > 1 ? 'certificados' : 'certificado'}` : 'certificados no seu nome'}</small>
          </Link>
        </div>
      </section>

      {/* --------------------------------------------------- últimos pedidos */}
      {recentes.length > 0 && (
        <section className={styles.secao}>
          <div className={styles.secaoTopo}>
            <h2>Últimos pedidos</h2>
            <Link to="/painel/pedidos">ver todos</Link>
          </div>
          <ul className={styles.lista}>
            {recentes.map((p) => (
              <li key={p.chave}>
                <Link to={p.para} className={styles.linha}>
                  <span className={styles.linhaTitulo}>
                    Pedido #{p.numero ?? '—'}
                    {p.daNz && <span className={styles.selo}>NZ</span>}
                  </span>
                  <span className={styles.linhaMeta}>
                    {[data(p.data), p.situacao, p.transportadora].filter(Boolean).join(' · ')}
                  </span>
                  <span className={styles.linhaValor}>{p.total != null ? BRL.format(p.total) : '—'}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ------------------------------------------------- o menu do celular */}
      <nav className={styles.menuCelular} aria-label="Seções da conta">
        {gruposVisiveis(isAdmin).map((g) => (
          <div key={g.id}>
            <span className={styles.menuGrupo}>{g.nome}</span>
            {g.itens.map((i) => {
              const n = contagem(i.contador);
              return (
                <Link key={i.para} to={i.para} className={styles.menuItem}>
                  <span className={styles.menuIcone} aria-hidden="true">
                    {i.icone}
                  </span>
                  <span className={styles.menuTexto}>
                    <b>{i.rotulo}</b>
                    <small>{n ? `${n} · ${i.dica}` : i.dica}</small>
                  </span>
                  <span className={styles.menuSeta} aria-hidden="true">
                    ›
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </>
  );
}
