// Aba Clientes & Revendedores do painel admin.
//
// Antes era uma tabela crua com 12 colunas e dois botões. Com cadastro de
// verdade entrando pelo site, o que a equipe precisa é: achar alguém, ver o que
// falta no cadastro, aprovar lojista com contexto (aprovado por quê?) e saber
// se a pessoa já é cliente no NZERP.
//
// Leitura por RLS de admin direto no Supabase; ações pela API (/api/nz/conta).

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { chamarConta, faltasDoCadastro, textoDoErroConta } from '../../lib/shop/conta';
import { formatarCpfCnpj } from '../../lib/documento';
import styles from './Admin.module.css';

interface Cliente {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  cpf_cnpj: string | null;
  ie: string | null;
  role: 'client' | 'reseller' | 'admin';
  is_approved: boolean;
  aprovado_em: string | null;
  aprovado_motivo: string | null;
  origem: string;
  erp_client_id: string | null;
  cadastro_completo_em: string | null;
  ultimo_acesso_em: string | null;
  created_at: string;
  address_street: string | null;
  address_number: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
}

const CAMPOS =
  'id, email, full_name, company_name, phone, cpf_cnpj, ie, role, is_approved, aprovado_em, aprovado_motivo, origem, erp_client_id, cadastro_completo_em, ultimo_acesso_em, created_at, address_street, address_number, address_city, address_state, address_zip';

type Filtro = 'todos' | 'pendentes' | 'lojistas' | 'sem-erp' | 'incompletos';

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'pendentes', label: 'Aguardando aprovação' },
  { id: 'lojistas', label: 'Lojistas' },
  { id: 'sem-erp', label: 'Sem cliente no ERP' },
  { id: 'incompletos', label: 'Cadastro incompleto' },
];

function data(v: string | null): string {
  return v ? new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—';
}

function endereco(c: Cliente): string {
  if (!c.address_street) return '—';
  return `${c.address_street}, ${c.address_number ?? 's/n'} — ${c.address_city ?? ''}/${c.address_state ?? ''}`;
}

export default function AdminClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState('');
  const [aberto, setAberto] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { data: linhas, error } = await supabase
      .from('user_profiles')
      .select(CAMPOS)
      .neq('role', 'admin')
      .order('created_at', { ascending: false })
      .limit(1000);
    if (error) setErro(error.message);
    setClientes((linhas ?? []) as Cliente[]);
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const digitos = termo.replace(/\D/g, '');
    return clientes.filter((c) => {
      if (filtro === 'pendentes' && c.is_approved) return false;
      if (filtro === 'lojistas' && c.role !== 'reseller') return false;
      if (filtro === 'sem-erp' && c.erp_client_id) return false;
      if (filtro === 'incompletos' && c.cadastro_completo_em) return false;
      if (!termo) return true;
      return (
        (c.full_name ?? '').toLowerCase().includes(termo) ||
        (c.email ?? '').toLowerCase().includes(termo) ||
        (c.company_name ?? '').toLowerCase().includes(termo) ||
        (digitos.length >= 3 && (c.cpf_cnpj ?? '').includes(digitos)) ||
        (digitos.length >= 3 && (c.phone ?? '').replace(/\D/g, '').includes(digitos))
      );
    });
  }, [clientes, busca, filtro]);

  const aprovar = async (c: Cliente, aprovado: boolean) => {
    setOcupado(c.id);
    setErro('');
    const { error } = await supabase
      .from('user_profiles')
      .update({
        is_approved: aprovado,
        aprovado_em: aprovado ? new Date().toISOString() : null,
        aprovado_motivo: aprovado ? 'liberado pelo painel administrativo' : null,
      })
      .eq('id', c.id);
    if (error) setErro(error.message);
    else await carregar();
    setOcupado('');
  };

  const procurarNoErp = async (c: Cliente) => {
    setOcupado(c.id);
    setErro('');
    try {
      const r = await chamarConta<{ jaCliente: boolean; aprovouAgora: boolean; motivo: string | null }>({ op: 'reavaliar', userId: c.id });
      if (!r.jaCliente) setErro(`Nenhum cliente no NZERP com este documento ou e-mail (${c.email}).`);
      await carregar();
    } catch (e) {
      setErro(textoDoErroConta(e));
    } finally {
      setOcupado('');
    }
  };

  const exportarCsv = () => {
    const cab = ['nome', 'email', 'telefone', 'documento', 'empresa', 'tipo', 'aprovado', 'cadastro_completo', 'erp', 'criado_em'];
    const linhas = lista.map((c) => [
      c.full_name ?? '',
      c.email ?? '',
      c.phone ?? '',
      c.cpf_cnpj ?? '',
      c.company_name ?? '',
      c.role,
      c.is_approved ? 'sim' : 'nao',
      c.cadastro_completo_em ? 'sim' : 'nao',
      c.erp_client_id ? 'sim' : 'nao',
      c.created_at,
    ]);
    const csv = [cab, ...linhas].map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientes-nz-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pendentes = clientes.filter((c) => !c.is_approved).length;

  return (
    <div className={styles.tableSection}>
      <p className={styles.tabDescription}>
        Contas criadas no site. Cliente final é liberado automaticamente; lojista precisa de aprovação — ou é reconhecido sozinho quando o CNPJ e o e-mail
        batem com um cliente ativo do NZERP.
      </p>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Contas</div>
          <div className={styles.metricValue}>{clientes.length}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Aguardando aprovação</div>
          <div className={`${styles.metricValue} ${pendentes ? styles.metricValueWarning : ''}`}>{pendentes}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Vinculadas ao ERP</div>
          <div className={styles.metricValue}>{clientes.filter((c) => c.erp_client_id).length}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center', marginBottom: '1rem' }}>
        <div className={styles.createField} style={{ minWidth: '260px', flex: 1 }}>
          <input placeholder="Buscar por nome, e-mail, empresa, documento ou telefone" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        {FILTROS.map((f) => (
          <button key={f.id} className={`${styles.actionBtn} ${filtro === f.id ? styles.actionBtnApprove : ''}`} onClick={() => setFiltro(f.id)}>
            {f.label}
          </button>
        ))}
        <button className={styles.createBtn} onClick={exportarCsv}>
          ↓ CSV
        </button>
      </div>

      {erro && <div className={styles.createError}>{erro}</div>}

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Contato</th>
              <th>Documento</th>
              <th>Tipo</th>
              <th>Cadastro</th>
              <th>ERP</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((c) => {
              const faltas = faltasDoCadastro(c);
              return (
                <tr key={c.id} onClick={() => setAberto(aberto === c.id ? null : c.id)} style={{ cursor: 'pointer' }}>
                  <td>
                    {c.full_name || '—'}
                    {c.company_name && <div style={{ fontSize: '0.72rem', color: '#777' }}>{c.company_name}</div>}
                    {aberto === c.id && (
                      <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '0.35rem', lineHeight: 1.6 }}>
                        {endereco(c)}
                        {c.address_zip ? ` · CEP ${c.address_zip}` : ''}
                        <br />
                        Origem: {c.origem} · criado em {data(c.created_at)} · último acesso {data(c.ultimo_acesso_em)}
                        {c.aprovado_motivo && (
                          <>
                            <br />
                            Aprovação: {c.aprovado_motivo}
                          </>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    {c.email || '—'}
                    <div style={{ fontSize: '0.72rem', color: '#777' }}>{c.phone || '—'}</div>
                  </td>
                  <td>{c.cpf_cnpj ? formatarCpfCnpj(c.cpf_cnpj) : '—'}</td>
                  <td>
                    <span className={`${styles.badge} ${c.role === 'reseller' ? styles.badgeReseller : ''}`}>{c.role === 'reseller' ? 'Lojista' : 'Cliente'}</span>
                  </td>
                  <td>
                    {c.cadastro_completo_em ? (
                      <span className={`${styles.badge} ${styles.badgeApproved}`}>completo</span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgePending}`} title={faltas.join(', ')}>
                        falta {faltas.length}
                      </span>
                    )}
                  </td>
                  <td>{c.erp_client_id ? <span className={`${styles.badge} ${styles.badgeApproved}`}>vinculado</span> : '—'}</td>
                  <td>
                    {c.is_approved ? (
                      <span className={`${styles.badge} ${styles.badgeApproved}`}>Aprovado</span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgePending}`}>Pendente</span>
                    )}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {!c.is_approved ? (
                      <button className={`${styles.actionBtn} ${styles.actionBtnApprove}`} onClick={() => void aprovar(c, true)} disabled={ocupado === c.id}>
                        ✅ Aprovar
                      </button>
                    ) : (
                      <button className={`${styles.actionBtn} ${styles.actionBtnDeny}`} onClick={() => void aprovar(c, false)} disabled={ocupado === c.id}>
                        🔒 Revogar
                      </button>
                    )}
                    {!c.erp_client_id && (
                      <button className={styles.actionBtn} onClick={() => void procurarNoErp(c)} disabled={ocupado === c.id}>
                        🔎 Procurar no ERP
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!carregando && lista.length === 0 && (
              <tr>
                <td colSpan={8} className={styles.emptyState}>
                  Nenhuma conta com esse filtro.
                </td>
              </tr>
            )}
            {carregando && (
              <tr>
                <td colSpan={8} className={styles.emptyState}>
                  Carregando…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
