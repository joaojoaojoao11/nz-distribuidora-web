// Aba Clientes do painel admin.
//
// Antes era uma tabela crua com 12 colunas e dois botões. Com cadastro de
// verdade entrando pelo site, o que a equipe precisa é: achar alguém, ver o que
// falta no cadastro, aprovar com contexto (como quê? por quê?) e saber se a
// pessoa já é cliente no NZERP.
//
// Desde 20/10/2026 NINGUÉM nasce aprovado e existem três tipos de acesso
// (cliente final, lojista/aplicador, revendedor) — o tipo decide o preço que a
// pessoa vê (Admin → Preços por acesso). Aprovar, revogar e mudar o tipo passam
// pelo servidor (/api/nz/conta): ficam no equipe_log e o cliente recebe e-mail
// quando é liberado. Leitura por RLS de admin direto no Supabase.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { chamarConta, faltasDoCadastro, textoDoErroConta } from '../../lib/shop/conta';
import { formatarCpfCnpj } from '../../lib/documento';
import { TIPO_LABEL, TIPOS_CLIENTE, type TipoAcesso } from '../../lib/shop/papeis';
import AdminTitulosErp from './AdminTitulosErp';
import styles from './Admin.module.css';

interface Cliente {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  cpf_cnpj: string | null;
  ie: string | null;
  role: TipoAcesso;
  is_approved: boolean;
  aprovado_em: string | null;
  aprovado_motivo: string | null;
  origem: string;
  erp_client_id: string | null;
  erp_candidato_id: string | null;
  erp_candidato_motivo: string | null;
  cadastro_completo_em: string | null;
  ultimo_acesso_em: string | null;
  created_at: string;
  address_street: string | null;
  address_number: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
}

interface ContextoAdmin {
  recarregarBadges: () => Promise<void> | void;
}

const CAMPOS =
  'id, email, full_name, company_name, phone, cpf_cnpj, ie, role, is_approved, aprovado_em, aprovado_motivo, origem, erp_client_id, erp_candidato_id, erp_candidato_motivo, cadastro_completo_em, ultimo_acesso_em, created_at, address_street, address_number, address_city, address_state, address_zip';

type Filtro = 'todos' | 'pendentes' | 'client' | 'lojista' | 'reseller' | 'sem-erp' | 'incompletos';

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'pendentes', label: 'Aguardando aprovação' },
  { id: 'client', label: 'Clientes finais' },
  { id: 'lojista', label: 'Lojistas' },
  { id: 'reseller', label: 'Revendedores' },
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

const badgeTipo = (role: TipoAcesso) => (role === 'client' ? styles.badge : `${styles.badge} ${styles.badgeReseller}`);

export default function AdminClientes() {
  const contexto = useOutletContext<ContextoAdmin | undefined>();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [ocupado, setOcupado] = useState('');
  const [aberto, setAberto] = useState<string | null>(null);
  // O tipo escolhido para aprovar alguém pendente (padrão: o que a pessoa pediu).
  const [tipoParaAprovar, setTipoParaAprovar] = useState<Record<string, TipoAcesso>>({});

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
      if ((filtro === 'client' || filtro === 'lojista' || filtro === 'reseller') && c.role !== filtro) return false;
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

  const acao = async (c: Cliente, body: Record<string, unknown>, okMsg: (r: Record<string, unknown>) => string) => {
    setOcupado(c.id);
    setErro('');
    setMsg('');
    try {
      const r = await chamarConta<Record<string, unknown>>({ ...body, userId: c.id });
      setMsg(okMsg(r));
      await carregar();
      await contexto?.recarregarBadges();
    } catch (e) {
      setErro(textoDoErroConta(e));
    } finally {
      setOcupado('');
    }
  };

  const aprovar = (c: Cliente) => {
    const tipo = tipoParaAprovar[c.id] ?? c.role;
    void acao(c, { op: 'aprovar', tipo }, (r) => `${c.full_name || c.email} liberado como ${TIPO_LABEL[tipo].toLowerCase()}${r.emailEnviado ? ' — e-mail enviado ao cliente.' : ' (o e-mail não saiu; avise pelo WhatsApp).'}`);
  };

  const revogar = (c: Cliente) => {
    const motivo = window.prompt(`Revogar o acesso de ${c.full_name || c.email}? A pessoa deixa de ver preços e comprar. Motivo (opcional):`, '');
    if (motivo === null) return;
    void acao(c, { op: 'revogar', motivo }, () => `Acesso de ${c.full_name || c.email} revogado.`);
  };

  const mudarTipo = (c: Cliente, tipo: TipoAcesso) => {
    if (tipo === c.role) return;
    void acao(c, { op: 'mudar-tipo', tipo }, () => `${c.full_name || c.email} agora é ${TIPO_LABEL[tipo].toLowerCase()}.`);
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
      TIPO_LABEL[c.role] ?? c.role,
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
    <>
      <div className={styles.tableSection}>
        <p className={styles.tabDescription}>
          Contas criadas no site. <strong>Ninguém vê preço nem compra antes de você aprovar.</strong> Ao aprovar, escolha o tipo de acesso — é ele que
          decide a tabela que a pessoa vê (<Link to="/admin/precos" style={{ color: '#fff' }}>Preços por acesso</Link>). O cliente recebe um e-mail
          quando é liberado. Combinado com quem se cadastra: até 1 dia útil.
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
        {msg && <p style={{ color: '#a1a1a6', fontSize: '0.85rem' }}>{msg}</p>}

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Contato</th>
                <th>Documento</th>
                <th>Tipo de acesso</th>
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
                              {c.aprovado_em ? ` (${data(c.aprovado_em)})` : ''}
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
                    <td onClick={(e) => e.stopPropagation()}>
                      {c.is_approved ? (
                        // Aprovado: trocar o tipo vale na hora (muda o preço que a pessoa vê).
                        <select value={c.role} disabled={ocupado === c.id} onChange={(e) => mudarTipo(c, e.target.value as TipoAcesso)} style={{ background: 'rgba(15,15,18,0.8)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', padding: '0.3rem 0.4rem', fontSize: '0.78rem' }}>
                          {TIPOS_CLIENTE.map((t) => (
                            <option key={t} value={t}>
                              {TIPO_LABEL[t]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={badgeTipo(c.role)}>{TIPO_LABEL[c.role] ?? c.role}</span>
                      )}
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
                    <td>
                      {c.erp_client_id ? (
                        <span className={`${styles.badge} ${styles.badgeApproved}`}>vinculado</span>
                      ) : c.erp_candidato_id ? (
                        <span
                          className={`${styles.badge} ${styles.badgePending}`}
                          title={`Parece ser cliente do NZERP (achado por ${c.erp_candidato_motivo === 'email' ? 'e-mail' : 'documento'}). O e-mail ainda não foi verificado: confirme antes de liberar histórico e preço.`}
                        >
                          candidato
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {c.is_approved ? (
                        <span className={`${styles.badge} ${styles.badgeApproved}`}>Aprovado</span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgePending}`}>Pendente</span>
                      )}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {!c.is_approved ? (
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <select
                            value={tipoParaAprovar[c.id] ?? c.role}
                            onChange={(e) => setTipoParaAprovar((m) => ({ ...m, [c.id]: e.target.value as TipoAcesso }))}
                            style={{ background: 'rgba(15,15,18,0.8)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', padding: '0.3rem 0.4rem', fontSize: '0.78rem' }}
                            title="Aprovar como"
                          >
                            {TIPOS_CLIENTE.map((t) => (
                              <option key={t} value={t}>
                                {TIPO_LABEL[t]}
                              </option>
                            ))}
                          </select>
                          <button className={`${styles.actionBtn} ${styles.actionBtnApprove}`} onClick={() => aprovar(c)} disabled={ocupado === c.id}>
                            ✅ Aprovar
                          </button>
                        </div>
                      ) : (
                        <button className={`${styles.actionBtn} ${styles.actionBtnDeny}`} onClick={() => revogar(c)} disabled={ocupado === c.id}>
                          🔒 Revogar
                        </button>
                      )}
                      {!c.erp_client_id && (
                        <button className={styles.actionBtn} onClick={() => void procurarNoErp(c)} disabled={ocupado === c.id}>
                          {c.erp_candidato_id ? '✔ Confirmar vínculo' : '🔎 Procurar no ERP'}
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

      <AdminTitulosErp contas={clientes} />
    </>
  );
}
