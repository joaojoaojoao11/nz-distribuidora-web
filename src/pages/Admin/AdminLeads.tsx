// /admin/leads — contatos que chegaram pelos formulários do site.
//
// Duas origens na mesma lista: `leads` (cupom surpresa das páginas NZPPF) e
// `installer_leads` ("Encontre um aplicador"). Antes o pedido de aplicador não
// aparecia em tela nenhuma — o lead ficava só na tabela. Os dois também chegam
// por e-mail desde 18/10/2026 (/api/nz/lead).

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './Admin.module.css';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  created_at: string;
}

interface PedidoAplicador {
  id: string;
  full_name: string;
  whatsapp: string;
  city: string | null;
  state: string | null;
  vehicle: string | null;
  service_type: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface Linha {
  id: string;
  tabela: 'leads' | 'installer_leads';
  nome: string;
  whatsapp: string;
  email: string;
  origem: string;
  detalhe: string;
  atendido: boolean;
  data: string;
}

function linkWhats(telefone: string): string | null {
  let d = telefone.replace(/\D/g, '');
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  return d.length >= 12 && d.length <= 13 ? `https://wa.me/${d}` : null;
}

export default function AdminLeads() {
  const [linhas, setLinhas] = useState<Linha[]>([]);

  const carregar = useCallback(async () => {
    const [{ data: leads }, { data: aplicadores }] = await Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('installer_leads').select('*').order('created_at', { ascending: false }).limit(200),
    ]);
    const todas: Linha[] = [
      ...((leads ?? []) as Lead[]).map((l) => ({
        id: l.id,
        tabela: 'leads' as const,
        nome: l.name,
        whatsapp: l.phone || '',
        email: l.email || '',
        origem: l.source || '—',
        detalhe: '',
        atendido: l.status === 'attended',
        data: l.created_at,
      })),
      ...((aplicadores ?? []) as PedidoAplicador[]).map((a) => ({
        id: a.id,
        tabela: 'installer_leads' as const,
        nome: a.full_name,
        whatsapp: a.whatsapp || '',
        email: '',
        origem: `Aplicador · ${a.service_type ?? ''}${a.city ? ` · ${a.city}${a.state ? `/${a.state}` : ''}` : ''}`,
        detalhe: [a.vehicle, a.notes].filter(Boolean).join(' · '),
        atendido: a.status === 'attended',
        data: a.created_at,
      })),
    ].sort((x, y) => y.data.localeCompare(x.data));
    setLinhas(todas);
  }, []);

  useEffect(() => {
    // Carga inicial: buscar no banco é efeito de verdade; o estado da tela é
    // consequência da resposta.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar();
  }, [carregar]);

  const alternar = async (l: Linha) => {
    const proximo = l.atendido ? (l.tabela === 'leads' ? 'pending' : 'new') : 'attended';
    await supabase.from(l.tabela).update({ status: proximo }).eq('id', l.id);
    await carregar();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

  return (
    <div className={styles.tableSection}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>WhatsApp</th>
            <th>Email</th>
            <th>Origem</th>
            <th>Detalhe</th>
            <th>Status</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => {
            const zap = linkWhats(l.whatsapp);
            return (
              <tr key={`${l.tabela}:${l.id}`}>
                <td>{l.nome}</td>
                <td>
                  {zap ? (
                    <a href={zap} target="_blank" rel="noopener noreferrer">
                      {l.whatsapp}
                    </a>
                  ) : (
                    l.whatsapp || '—'
                  )}
                </td>
                <td>{l.email || '—'}</td>
                <td>{l.origem}</td>
                <td>{l.detalhe || '—'}</td>
                <td>
                  <button
                    className={`${styles.badge} ${l.atendido ? styles.badgeApproved : styles.badgePending}`}
                    onClick={() => void alternar(l)}
                    style={{ cursor: 'pointer' }}
                  >
                    {l.atendido ? 'Atendido' : 'Pendente'}
                  </button>
                </td>
                <td>{formatDate(l.data)}</td>
              </tr>
            );
          })}
          {linhas.length === 0 && (
            <tr>
              <td colSpan={7} className={styles.emptyState}>
                Nenhum lead recebido.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
