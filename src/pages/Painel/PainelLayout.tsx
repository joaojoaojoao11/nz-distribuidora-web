// Casca da área do cliente: cabeçalho, menu e a área de conteúdo, que agora é
// uma ROTA.
//
// Antes `/painel` era uma página só, com 586 linhas e cinco blocos empilhados:
// não dava para mandar um link ("abre seus pagamentos"), F5 sempre caía no topo
// e no celular era preciso rolar o formulário de cadastro inteiro para chegar
// nos pedidos.
//
// Diferença de propósito para o painel admin: aqui NÃO existe gaveta. No admin
// ela se paga porque são 16 telas e o dia inteiro dentro delas; o cliente entra
// duas vezes por mês, e uma gaveta lateral competiria com o hambúrguer do site
// — dois menus diferentes no mesmo canto da tela. O padrão aqui é o dos ajustes
// do celular: a página inicial É a lista (PainelInicio), cada tela abre cheia e
// tem um "‹ Minha conta" no topo.

import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { totalItensCarrinho, useCarrinho } from '../../lib/shop/carrinho';
import { useFavoritos } from '../../lib/shop/listasPessoais';
import { GRUPOS, tituloDaRota, type Contador } from './painelNav';
import styles from './PainelLayout.module.css';

export type Contagens = Partial<Record<Contador, number>>;

export default function PainelLayout() {
  const { user, profile, loading, isAdmin, isApproved, signOut } = useAuth();
  const location = useLocation();
  const carrinho = useCarrinho();
  const favoritos = useFavoritos();
  const [contagens, setContagens] = useState<Contagens>({});

  const carregarContagens = useCallback(async () => {
    if (!user) return;
    const [{ count: pedidos }, { data: garantias }, { data: cupom }] = await Promise.all([
      supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.rpc('minhas_garantias'),
      supabase.from('afiliados').select('codigo').eq('user_id', user.id).maybeSingle(),
    ]);
    setContagens({
      pedidos: pedidos ?? 0,
      garantias: Array.isArray(garantias) ? garantias.length : 0,
      cupons: cupom ? 1 : 0,
    });
  }, [user]);

  useEffect(() => {
    // Carga dos contadores do menu.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregarContagens();
  }, [carregarContagens]);

  if (loading) return null;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;

  const naInicial = location.pathname === '/painel' || location.pathname === '/painel/';
  const papel = isAdmin ? 'Conta da equipe NZ' : profile?.role === 'reseller' ? 'Conta de lojista' : 'Conta de cliente';

  const numero = (c?: Contador): number | undefined => {
    if (!c) return undefined;
    if (c === 'carrinho') return totalItensCarrinho(carrinho);
    if (c === 'favoritos') return favoritos.length;
    return contagens[c];
  };

  return (
    <div className={`container ${styles.pagina}`}>
      <header className={styles.cabecalho}>
        <div className={styles.identidade}>
          <span className={styles.rotulo}>{papel}</span>
          <h1 className={styles.nome}>{profile?.full_name || user.email}</h1>
          {!isApproved && !isAdmin && <span className={styles.chipAnalise}>Cadastro em análise</span>}
        </div>
        <div className={styles.acoes}>
          {isAdmin && (
            <Link to="/admin" className={styles.secundario}>
              Painel administrativo
            </Link>
          )}
          <button type="button" className={styles.secundario} onClick={() => void signOut()}>
            Sair
          </button>
        </div>
      </header>

      {/* Volta do celular. No desktop a coluna da esquerda já diz onde se está. */}
      {!naInicial && (
        <Link to="/painel" className={styles.voltar}>
          ‹ Minha conta
        </Link>
      )}

      <div className={styles.corpo}>
        <nav className={styles.lateral} aria-label="Seções da conta">
          <NavLink to="/painel" end className={({ isActive }) => (isActive ? styles.itemAtivo : styles.item)}>
            <span className={styles.icone} aria-hidden="true">
              ◈
            </span>
            Início
          </NavLink>

          {GRUPOS.map((g) => (
            <div key={g.id}>
              <span className={styles.grupo}>{g.nome}</span>
              {g.itens.map((i) => {
                const n = numero(i.contador);
                return (
                  <NavLink key={i.para} to={i.para} className={({ isActive }) => (isActive ? styles.itemAtivo : styles.item)}>
                    <span className={styles.icone} aria-hidden="true">
                      {i.icone}
                    </span>
                    {i.rotulo}
                    {n ? <span className={styles.contador}>{n}</span> : null}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.conteudo}>
          {!naInicial && <h2 className={styles.tituloTela}>{tituloDaRota(location.pathname)}</h2>}
          <Outlet />
        </div>
      </div>
    </div>
  );
}
