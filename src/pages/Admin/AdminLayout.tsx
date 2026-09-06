// Casca do painel administrativo: barra lateral, cabeçalho e a área de
// conteúdo, que agora é uma ROTA.
//
// Antes o painel inteiro vivia em `Dashboard.tsx` com as abas em `useState`:
// `/admin` era uma URL só. Dava para chegar em qualquer tela, mas não para
// voltar a ela — F5 caía no dashboard, o botão Voltar do navegador saía do
// painel e não existia link para mandar a alguém ("abre o produto tal"). Com
// rotas aninhadas cada aba tem endereço, o histórico funciona e o editor de
// produto pode ser `/admin/produtos/:slug`.
//
// O menu ficou agrupado: 16 itens planos numa coluna não dizem o que é
// operação da loja, o que é conteúdo e o que é sistema.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { PROMO_PAGES } from '../../lib/promoPages';
import BuscaGlobal from './BuscaGlobal';
import { GRUPOS, tituloDaRota, type ItemNav } from './adminNav';
import styles from './Admin.module.css';

const CHAVE_GRUPOS = 'nz:admin:grupos-fechados';

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [gaveta, setGaveta] = useState(false);
  const [busca, setBusca] = useState(false);
  const [fechados, setFechados] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(CHAVE_GRUPOS) ?? '[]') as string[];
    } catch {
      return [];
    }
  });
  const [contagens, setContagens] = useState({ clientes: 0, garantias: 0, promo: 0 });

  const carregarBadges = useCallback(async () => {
    const [{ count: clientes }, { count: garantias }] = await Promise.all([
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }).neq('role', 'admin').eq('is_approved', false),
      supabase.from('garantias_nz').select('id', { count: 'exact', head: true }).eq('certificado_gerado', false),
    ]);
    let promo = 0;
    for (const p of PROMO_PAGES) {
      if (!p.statusColuna) continue;
      const { count } = await supabase.from(p.tabela).select('id', { count: 'exact', head: true }).eq(p.statusColuna, 'pendente');
      promo += count ?? 0;
    }
    setContagens({ clientes: clientes ?? 0, garantias: garantias ?? 0, promo });
  }, []);

  useEffect(() => {
    // Carga inicial dos contadores do menu.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregarBadges();
  }, [carregarBadges]);

  // Trocar de tela fecha a gaveta do celular — a navegação é o sistema externo
  // aqui, e a gaveta só reage a ela.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGaveta(false);
  }, [location.pathname]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setBusca(true);
      }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, []);

  const alternarGrupo = (id: string) => {
    setFechados((f) => {
      const novo = f.includes(id) ? f.filter((x) => x !== id) : [...f, id];
      try {
        localStorage.setItem(CHAVE_GRUPOS, JSON.stringify(novo));
      } catch {
        /* modo privado: só não lembra */
      }
      return novo;
    });
  };

  const titulo = useMemo(() => tituloDaRota(location.pathname), [location.pathname]);
  const sair = async () => {
    await signOut();
    navigate('/');
  };

  const badge = (chave?: ItemNav['badge']) => (chave ? contagens[chave] : 0);

  return (
    <div className={styles.adminLayout}>
      {gaveta && <button type="button" className={styles.gavetaFundo} aria-label="Fechar menu" onClick={() => setGaveta(false)} />}

      <aside className={`${styles.sidebar} ${gaveta ? styles.sidebarAberta : ''}`}>
        <div className={styles.sidebarLogo}>
          <h2>NZ Admin</h2>
          <span>Painel de Gestão</span>
        </div>

        <nav className={styles.sidebarNav}>
          <NavLink to="/admin" end className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}>
            <span>📊</span> <span>Dashboard</span>
          </NavLink>

          {GRUPOS.map((g) => {
            const fechado = fechados.includes(g.id);
            const pendentes = g.itens.reduce((s, i) => s + badge(i.badge), 0);
            return (
              <div key={g.id} className={styles.grupo}>
                <button type="button" className={styles.grupoTitulo} onClick={() => alternarGrupo(g.id)} aria-expanded={!fechado}>
                  <span>{g.nome}</span>
                  {fechado && pendentes > 0 && <span className={styles.navBadge}>{pendentes}</span>}
                  <span className={styles.grupoSeta}>{fechado ? '+' : '−'}</span>
                </button>
                {!fechado &&
                  g.itens.map((i) => (
                    <NavLink key={i.para} to={i.para} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}>
                      <span>{i.icone}</span> <span>{i.rotulo}</span>
                      {badge(i.badge) > 0 && <span className={styles.navBadge}>{badge(i.badge)}</span>}
                    </NavLink>
                  ))}
              </div>
            );
          })}

          <Link to="/" className={styles.navLink}>
            <span>🌐</span> <span>Ver site</span>
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={() => void sair()}>
            <span>🚪</span> <span>Sair</span>
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.headerEsquerda}>
            <button type="button" className={styles.menuBtn} onClick={() => setGaveta(true)} aria-label="Abrir menu">
              ☰
            </button>
            <h1 className={styles.headerTitle}>{titulo}</h1>
          </div>
          <div className={styles.headerDireita}>
            <button type="button" className={styles.buscaBtn} onClick={() => setBusca(true)}>
              <span>🔍</span> <span className={styles.buscaBtnTexto}>Buscar</span>
              <kbd>Ctrl K</kbd>
            </button>
            <span className={styles.headerUser}>{profile?.full_name || 'Admin'}</span>
          </div>
        </div>

        <Outlet context={{ recarregarBadges: carregarBadges }} />
      </main>

      {busca && <BuscaGlobal onFechar={() => setBusca(false)} />}
    </div>
  );
}
