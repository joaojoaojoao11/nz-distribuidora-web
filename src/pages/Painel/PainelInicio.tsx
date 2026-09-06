// /painel — o Início da conta.
//
// No computador é um resumo (status, dois cartões, últimos pedidos). No celular
// ele é TAMBÉM o menu: a lista de seções aparece abaixo do resumo, com linhas
// altas e uma frase de contexto em cada. É o padrão de ajustes do celular —
// nada de gaveta competindo com o hambúrguer do site.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { totalItensCarrinho, useCarrinho } from '../../lib/shop/carrinho';
import { useFavoritos } from '../../lib/shop/listasPessoais';
import { BRL, usePrecosLote, usePrecosMapa } from '../../lib/shop/precos';
import { SITE_WHATSAPP } from '../../lib/siteConfig';
import { GRUPOS } from './painelNav';
import { PAGAMENTO_LABEL, STATUS_LABEL, type PedidoResumo } from './pedidoRotulos';
import styles from './PainelInicio.module.css';

export default function PainelInicio() {
  const { user, isAdmin, isApproved, cadastroCompleto } = useAuth();
  const carrinho = useCarrinho();
  const favoritos = useFavoritos();
  const { itens: precos } = usePrecosMapa();
  const [pedidos, setPedidos] = useState<PedidoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [garantias, setGarantias] = useState(0);

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
    return () => {
      vivo = false;
    };
  }, [user]);

  // Total do carrinho: só fecha quando todo item tem preço (o mesmo critério da
  // página do carrinho — meio total é pior que nenhum).
  let totalCarrinho: number | null = 0;
  for (const i of carrinho) {
    const p = precos.get(i.slug);
    const unit = i.unidade === 'rolo' ? p?.rolo : p?.metro;
    if (unit == null) {
      totalCarrinho = null;
      break;
    }
    totalCarrinho += Number(unit) * i.qtd;
  }

  const emAberto = pedidos.filter((p) => !['FATURADO', 'ENTREGUE', 'CANCELADO', 'NAO_APROVADO'].includes(p.status)).length;
  const contagem = (c?: string) =>
    c === 'carrinho'
      ? totalItensCarrinho(carrinho)
      : c === 'favoritos'
        ? favoritos.length
        : c === 'garantias'
          ? garantias
          : c === 'pedidos'
            ? pedidos.length
            : 0;

  return (
    <>
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
          <a className={styles.falarNz} href={SITE_WHATSAPP} target="_blank" rel="noopener noreferrer">
            Falar com a NZ
          </a>
        )}
      </section>

      {/* ----------------------------------------------------------- cartões */}
      <div className={styles.cartoes}>
        <Link to="/painel/pedidos" className={styles.cartao}>
          <span className={styles.cartaoRotulo}>Pedidos</span>
          <span className={styles.cartaoValor}>{carregando ? '—' : pedidos.length}</span>
          <span className={styles.cartaoPe}>
            {carregando ? 'carregando…' : emAberto ? `${emAberto} em andamento` : 'nenhum em andamento'}
          </span>
        </Link>

        <Link to="/painel/carrinho" className={carrinho.length ? `${styles.cartao} ${styles.cartaoDestaque}` : styles.cartao}>
          <span className={styles.cartaoRotulo}>Carrinho guardado</span>
          <span className={styles.cartaoValor}>
            {carrinho.length === 0 ? 'vazio' : totalCarrinho == null ? '—' : BRL.format(totalCarrinho)}
          </span>
          <span className={styles.cartaoPe}>
            {carrinho.length === 0
              ? 'nada esperando por você'
              : `${totalItensCarrinho(carrinho)} ${totalItensCarrinho(carrinho) > 1 ? 'itens' : 'item'} · retomar`}
          </span>
        </Link>

        <Link to="/painel/favoritos" className={styles.cartao}>
          <span className={styles.cartaoRotulo}>Favoritos</span>
          <span className={styles.cartaoValor}>{favoritos.length}</span>
          <span className={styles.cartaoPe}>{favoritos.length ? 'cores separadas' : 'nada separado ainda'}</span>
        </Link>
      </div>

      {/* --------------------------------------------------- últimos pedidos */}
      {pedidos.length > 0 && (
        <section className={styles.secao}>
          <div className={styles.secaoTopo}>
            <h2>Últimos pedidos</h2>
            <Link to="/painel/pedidos">ver todos</Link>
          </div>
          <ul className={styles.lista}>
            {pedidos.map((p) => (
              <li key={p.id}>
                <Link to={`/painel/pedido/${p.numero}`} className={styles.linha}>
                  <span className={styles.linhaTitulo}>Pedido #{p.numero}</span>
                  <span className={styles.linhaMeta}>
                    {new Date(p.criado_em).toLocaleDateString('pt-BR')} ·{' '}
                    {p.pagamento_status && p.pagamento_status !== 'nenhum'
                      ? (PAGAMENTO_LABEL[p.pagamento_status] ?? p.pagamento_status)
                      : (STATUS_LABEL[p.status] ?? p.status)}
                  </span>
                  <span className={styles.linhaValor}>
                    {p.total_final != null
                      ? BRL.format(Number(p.total_final))
                      : p.total_estimado != null
                        ? BRL.format(Number(p.total_estimado))
                        : '—'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ------------------------------------------------- o menu do celular */}
      <nav className={styles.menuCelular} aria-label="Seções da conta">
        {GRUPOS.map((g) => (
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
