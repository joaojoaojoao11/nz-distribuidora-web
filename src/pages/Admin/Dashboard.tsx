import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import styles from './Admin.module.css';

interface Lead { id: string; name: string; email: string; phone: string; source: string; created_at: string; }
interface UserProfile { id: string; full_name: string; email?: string; role: string; company_name: string | null; phone: string | null; is_approved: boolean; created_at: string; }

export default function Dashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'users'>('dashboard');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: leadsData } = await supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(50);
    if (leadsData) setLeads(leadsData);

    const { data: usersData } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false });
    if (usersData) {
      // Fetch emails from auth (via profile data)
      setUsers(usersData);
    }
  };

  const approveUser = async (userId: string) => {
    await supabase.from('user_profiles').update({ is_approved: true }).eq('id', userId);
    loadData();
  };

  const denyUser = async (userId: string) => {
    await supabase.from('user_profiles').update({ is_approved: false }).eq('id', userId);
    loadData();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const pendingUsers = users.filter(u => !u.is_approved && u.role !== 'admin');
  const totalUsers = users.filter(u => u.role !== 'admin').length;

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') return <span className={`${styles.badge} ${styles.badgeAdmin}`}>Admin</span>;
    if (role === 'reseller') return <span className={`${styles.badge} ${styles.badgeReseller}`}>Revendedor</span>;
    return <span className={styles.badge}>Cliente</span>;
  };

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <h2>NZ Admin</h2>
          <span>Painel de Gestão</span>
        </div>
        <nav className={styles.sidebarNav}>
          <button className={`${styles.navLink} ${activeTab === 'dashboard' ? styles.navLinkActive : ''}`} onClick={() => setActiveTab('dashboard')}>
            <span>📊</span> <span>Dashboard</span>
          </button>
          <button className={`${styles.navLink} ${activeTab === 'leads' ? styles.navLinkActive : ''}`} onClick={() => setActiveTab('leads')}>
            <span>📩</span> <span>Leads</span>
          </button>
          <button className={`${styles.navLink} ${activeTab === 'users' ? styles.navLinkActive : ''}`} onClick={() => setActiveTab('users')}>
            <span>👥</span> <span>Usuários</span>
          </button>
          <Link to="/" className={styles.navLink}>
            <span>🌐</span> <span>Ver Site</span>
          </Link>
        </nav>
        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={handleSignOut}>
            <span>🚪</span> <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.mainContent}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>
            {activeTab === 'dashboard' && 'Dashboard'}
            {activeTab === 'leads' && 'Leads & Contatos'}
            {activeTab === 'users' && 'Gestão de Usuários'}
          </h1>
          <span className={styles.headerUser}>{profile?.full_name || 'Admin'}</span>
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Cadastros Pendentes</div>
                <div className={`${styles.metricValue} ${pendingUsers.length > 0 ? styles.metricValueWarning : ''}`}>{pendingUsers.length}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Total de Leads</div>
                <div className={styles.metricValue}>{leads.length}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Usuários Cadastrados</div>
                <div className={styles.metricValue}>{totalUsers}</div>
              </div>
            </div>

            {pendingUsers.length > 0 && (
              <div className={styles.tableSection}>
                <h3 className={styles.tableSectionTitle}>🟡 Cadastros Pendentes de Aprovação</h3>
                <table className={styles.table}>
                  <thead><tr><th>Nome</th><th>Telefone</th><th>Tipo</th><th>Data</th><th>Ações</th></tr></thead>
                  <tbody>
                    {pendingUsers.map(u => (
                      <tr key={u.id}>
                        <td>{u.full_name || '—'}</td>
                        <td>{u.phone || '—'}</td>
                        <td>{getRoleBadge(u.role)}</td>
                        <td>{formatDate(u.created_at)}</td>
                        <td>
                          <button className={`${styles.actionBtn} ${styles.actionBtnApprove}`} onClick={() => approveUser(u.id)}>✅ Aprovar</button>
                          <button className={`${styles.actionBtn} ${styles.actionBtnDeny}`} onClick={() => denyUser(u.id)}>❌ Negar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className={styles.tableSection}>
              <h3 className={styles.tableSectionTitle}>📩 Últimos Leads</h3>
              <table className={styles.table}>
                <thead><tr><th>Nome</th><th>WhatsApp</th><th>Email</th><th>Origem</th><th>Data</th></tr></thead>
                <tbody>
                  {leads.slice(0, 10).map(l => (
                    <tr key={l.id}>
                      <td>{l.name}</td>
                      <td>{l.phone || '—'}</td>
                      <td>{l.email || '—'}</td>
                      <td>{l.source || '—'}</td>
                      <td>{formatDate(l.created_at)}</td>
                    </tr>
                  ))}
                  {leads.length === 0 && <tr><td colSpan={5} className={styles.emptyState}>Nenhum lead recebido ainda.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* LEADS TAB */}
        {activeTab === 'leads' && (
          <div className={styles.tableSection}>
            <table className={styles.table}>
              <thead><tr><th>Nome</th><th>WhatsApp</th><th>Email</th><th>Origem</th><th>Data</th></tr></thead>
              <tbody>
                {leads.map(l => (
                  <tr key={l.id}>
                    <td>{l.name}</td>
                    <td>{l.phone || '—'}</td>
                    <td>{l.email || '—'}</td>
                    <td>{l.source || '—'}</td>
                    <td>{formatDate(l.created_at)}</td>
                  </tr>
                ))}
                {leads.length === 0 && <tr><td colSpan={5} className={styles.emptyState}>Nenhum lead recebido.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className={styles.tableSection}>
            <table className={styles.table}>
              <thead><tr><th>Nome</th><th>Empresa</th><th>Telefone</th><th>Tipo</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {users.filter(u => u.role !== 'admin').map(u => (
                  <tr key={u.id}>
                    <td>{u.full_name || '—'}</td>
                    <td>{u.company_name || '—'}</td>
                    <td>{u.phone || '—'}</td>
                    <td>{getRoleBadge(u.role)}</td>
                    <td>{u.is_approved ? <span className={`${styles.badge} ${styles.badgeApproved}`}>Aprovado</span> : <span className={`${styles.badge} ${styles.badgePending}`}>Pendente</span>}</td>
                    <td>
                      {!u.is_approved ? (
                        <button className={`${styles.actionBtn} ${styles.actionBtnApprove}`} onClick={() => approveUser(u.id)}>✅ Aprovar</button>
                      ) : (
                        <button className={`${styles.actionBtn} ${styles.actionBtnDeny}`} onClick={() => denyUser(u.id)}>🔒 Revogar</button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.filter(u => u.role !== 'admin').length === 0 && <tr><td colSpan={6} className={styles.emptyState}>Nenhum usuário cadastrado.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
