// /admin/leads — contatos que chegaram pelos formulários do site.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './Admin.module.css';

interface Lead {
  id: string; name: string; email: string; phone: string;
  source: string; status: string; created_at: string;
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);

  const carregar = useCallback(async () => {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(200);
    setLeads((data ?? []) as Lead[]);
  }, []);

  useEffect(() => {
    // Carga inicial: buscar no banco é efeito de verdade; o estado da tela é
    // consequência da resposta.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar();
  }, [carregar]);

  const toggleLeadStatus = async (leadId: string, current: string) => {
    const next = current === 'attended' ? 'pending' : 'attended';
    await supabase.from('leads').update({ status: next }).eq('id', leadId);
    await carregar();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

  return (
    <div className={styles.tableSection}>
      <table className={styles.table}>
        <thead><tr><th>Nome</th><th>WhatsApp</th><th>Email</th><th>Origem</th><th>Status</th><th>Data</th></tr></thead>
        <tbody>
          {leads.map(l => (
            <tr key={l.id}>
              <td>{l.name}</td>
              <td>{l.phone || '—'}</td>
              <td>{l.email || '—'}</td>
              <td>{l.source || '—'}</td>
              <td>
                <button className={`${styles.badge} ${l.status === 'attended' ? styles.badgeApproved : styles.badgePending}`} onClick={() => toggleLeadStatus(l.id, l.status)} style={{ cursor: 'pointer' }}>
                  {l.status === 'attended' ? 'Atendido' : 'Pendente'}
                </button>
              </td>
              <td>{formatDate(l.created_at)}</td>
            </tr>
          ))}
          {leads.length === 0 && <tr><td colSpan={6} className={styles.emptyState}>Nenhum lead recebido.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
