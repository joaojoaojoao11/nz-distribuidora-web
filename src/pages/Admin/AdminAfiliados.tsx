// Aba Afiliados & Cupons do painel admin.
//
// Três listas e uma configuração:
//   · afiliados  — quem gerou link; percentual individual (vazio = padrão)
//   · cupons     — de afiliado (nascem com o código) e de campanha (criados aqui)
//   · comissões  — geradas pelo retorno do ERP ao FATURAR; aqui só se marca
//                  como paga (o pagamento em si é manual, por decisão)
//   · loja_config — percentual padrão e dias de atribuição
//
// Tudo por RLS de admin (nz_is_admin), direto no Supabase.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './Admin.module.css';

interface Afiliado {
  user_id: string;
  codigo: string;
  percentual: number | null;
  ativo: boolean;
  criado_em: string;
  user_profiles?: { full_name: string | null; email: string | null; role: string } | null;
}

interface Cupom {
  codigo: string;
  tipo: 'afiliado' | 'campanha';
  desconto_pct: number | null;
  desconto_valor: number | null;
  afiliado_user_id: string | null;
  valido_ate: string | null;
  limite_usos: number | null;
  usos: number;
  ativo: boolean;
}

interface Comissao {
  id: string;
  pedido_id: string;
  afiliado_user_id: string;
  base_valor: number;
  percentual: number;
  valor: number;
  status: 'pendente' | 'apurada' | 'paga' | 'cancelada';
  evento_erp: string | null;
  criado_em: string;
  paga_em: string | null;
  pedidos?: { numero: number; status: string } | null;
}

interface Config {
  percentual_afiliado_padrao: number;
  dias_atribuicao: number;
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function AdminAfiliados() {
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(true);
  const [novo, setNovo] = useState({ codigo: '', desconto_pct: '', desconto_valor: '', valido_ate: '', limite_usos: '' });

  const carregar = useCallback(async () => {
    const [a, c, k, cfg] = await Promise.all([
      supabase.from('afiliados').select('*, user_profiles(full_name, email, role)').order('criado_em', { ascending: false }).limit(500),
      supabase.from('cupons').select('*').order('criado_em', { ascending: false }).limit(500),
      supabase.from('comissoes').select('*, pedidos(numero, status)').order('criado_em', { ascending: false }).limit(500),
      supabase.from('loja_config').select('percentual_afiliado_padrao, dias_atribuicao').eq('id', 1).maybeSingle(),
    ]);
    const e = a.error ?? c.error ?? k.error ?? cfg.error;
    setErro(e ? e.message : '');
    setAfiliados((a.data ?? []) as Afiliado[]);
    setCupons((c.data ?? []) as Cupom[]);
    setComissoes((k.data ?? []) as Comissao[]);
    setConfig((cfg.data as Config | null) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar();
  }, [carregar]);

  const salvarConfig = async (patch: Partial<Config>) => {
    const { error } = await supabase.from('loja_config').update({ ...patch, atualizado_em: new Date().toISOString() }).eq('id', 1);
    if (error) setErro(error.message);
    await carregar();
  };

  const alternarAfiliado = async (a: Afiliado) => {
    const { error } = await supabase.from('afiliados').update({ ativo: !a.ativo }).eq('user_id', a.user_id);
    if (error) setErro(error.message);
    await carregar();
  };

  const percentualAfiliado = async (a: Afiliado, v: string) => {
    const n = v.trim() === '' ? null : Number(v);
    const { error } = await supabase.from('afiliados').update({ percentual: n }).eq('user_id', a.user_id);
    if (error) setErro(error.message);
    await carregar();
  };

  const criarCupom = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const codigo = novo.codigo.trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9-]{2,23}$/.test(codigo)) {
      setErro('Código: 3 a 24 caracteres, letras, números e hífen.');
      return;
    }
    const { error } = await supabase.from('cupons').insert({
      codigo,
      tipo: 'campanha',
      desconto_pct: novo.desconto_pct ? Number(novo.desconto_pct) : null,
      desconto_valor: novo.desconto_valor ? Number(novo.desconto_valor) : null,
      valido_ate: novo.valido_ate ? new Date(novo.valido_ate).toISOString() : null,
      limite_usos: novo.limite_usos ? Number(novo.limite_usos) : null,
    });
    if (error) setErro(error.message);
    else setNovo({ codigo: '', desconto_pct: '', desconto_valor: '', valido_ate: '', limite_usos: '' });
    await carregar();
  };

  const alternarCupom = async (c: Cupom) => {
    const { error } = await supabase.from('cupons').update({ ativo: !c.ativo }).eq('codigo', c.codigo);
    if (error) setErro(error.message);
    await carregar();
  };

  const editarCupom = async (c: Cupom, patch: Partial<Cupom>) => {
    const { error } = await supabase.from('cupons').update(patch).eq('codigo', c.codigo);
    if (error) setErro(error.message);
    await carregar();
  };

  const marcarComissao = async (k: Comissao, status: Comissao['status']) => {
    const patch: Record<string, unknown> = { status };
    if (status === 'paga') patch.paga_em = new Date().toISOString();
    if (status === 'apurada') patch.apurada_em = new Date().toISOString();
    const { error } = await supabase.from('comissoes').update(patch).eq('id', k.id);
    if (error) setErro(error.message);
    await carregar();
  };

  if (loading) return <p style={{ color: '#a1a1a6' }}>Carregando afiliados…</p>;

  const nomeDe = (userId: string) => {
    const a = afiliados.find((x) => x.user_id === userId);
    return a ? `${a.user_profiles?.full_name ?? a.user_profiles?.email ?? '—'} (${a.codigo})` : userId.slice(0, 8);
  };
  const total = (status: Comissao['status']) => comissoes.filter((c) => c.status === status).reduce((s, c) => s + Number(c.valor), 0);

  return (
    <div>
      <p className={styles.tabDescription}>
        Link de indicação e cupons. Qualquer usuário logado gera seu código no painel; a comissão nasce
        quando o pedido vinculado é <strong>faturado</strong> no NZERP. O pagamento é manual — aqui só
        se marca como paga.
      </p>

      {erro && (
        <div className={styles.createError} style={{ marginBottom: '1rem' }}>
          {erro}
        </div>
      )}

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Afiliados</span>
          <span className={styles.metricValue}>{afiliados.length}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Comissão pendente</span>
          <span className={styles.metricValueWarning}>{BRL.format(total('pendente'))}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Comissão apurada</span>
          <span className={styles.metricValue}>{BRL.format(total('apurada'))}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Comissão paga</span>
          <span className={styles.metricValue}>{BRL.format(total('paga'))}</span>
        </div>
      </div>

      {/* ------------------------------------------------------ config */}
      {config && (
        <div className={styles.tableSection}>
          <h3 className={styles.tableSectionTitle}>Regras</h3>
          <div className={styles.createGrid}>
            <div className={styles.createField}>
              <label>Percentual padrão de comissão (%)</label>
              <input
                type="number"
                step="0.5"
                defaultValue={config.percentual_afiliado_padrao}
                onBlur={(e) => salvarConfig({ percentual_afiliado_padrao: Number(e.target.value) || 0 })}
              />
            </div>
            <div className={styles.createField}>
              <label>Janela de atribuição (dias, último clique)</label>
              <input
                type="number"
                defaultValue={config.dias_atribuicao}
                onBlur={(e) => salvarConfig({ dias_atribuicao: Number(e.target.value) || 30 })}
              />
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------- afiliados */}
      <div className={styles.tableSection}>
        <h3 className={styles.tableSectionTitle}>Afiliados</h3>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Quem</th>
                <th>Código</th>
                <th>% individual</th>
                <th>Desde</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {afiliados.map((a) => (
                <tr key={a.user_id}>
                  <td>
                    {a.user_profiles?.full_name ?? '—'}
                    <br />
                    <span style={{ color: '#777', fontSize: '0.72rem' }}>
                      {a.user_profiles?.email ?? ''} · {a.user_profiles?.role === 'reseller' ? 'lojista' : 'cliente'}
                    </span>
                  </td>
                  <td>
                    <code style={{ color: '#fff' }}>{a.codigo}</code>
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.5"
                      defaultValue={a.percentual ?? ''}
                      placeholder={`padrão ${config?.percentual_afiliado_padrao ?? ''}`}
                      onBlur={(e) => percentualAfiliado(a, e.target.value)}
                      style={{ width: 90, background: 'rgba(15,15,18,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.4rem 0.5rem' }}
                    />
                  </td>
                  <td>{new Date(a.criado_em).toLocaleDateString('pt-BR')}</td>
                  <td>
                    {a.ativo ? (
                      <span className={`${styles.badge} ${styles.badgeApproved}`}>ativo</span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeAdmin}`}>inativo</span>
                    )}
                  </td>
                  <td>
                    <button type="button" className={`${styles.actionBtn} ${a.ativo ? styles.actionBtnDeny : styles.actionBtnApprove}`} onClick={() => alternarAfiliado(a)}>
                      {a.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
              {afiliados.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    Ninguém gerou link ainda. O código nasce quando o usuário abre /painel.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------ cupons */}
      <div className={styles.tableSection}>
        <h3 className={styles.tableSectionTitle}>Cupons</h3>
        <form onSubmit={criarCupom} className={styles.createGrid} style={{ gridTemplateColumns: 'repeat(6, 1fr)', alignItems: 'end' }}>
          <div className={styles.createField}>
            <label>Código</label>
            <input value={novo.codigo} onChange={(e) => setNovo({ ...novo, codigo: e.target.value })} placeholder="FESTIVAL10" required />
          </div>
          <div className={styles.createField}>
            <label>% desconto</label>
            <input type="number" step="0.5" value={novo.desconto_pct} onChange={(e) => setNovo({ ...novo, desconto_pct: e.target.value })} />
          </div>
          <div className={styles.createField}>
            <label>R$ desconto</label>
            <input type="number" step="0.01" value={novo.desconto_valor} onChange={(e) => setNovo({ ...novo, desconto_valor: e.target.value })} />
          </div>
          <div className={styles.createField}>
            <label>Válido até</label>
            <input type="date" value={novo.valido_ate} onChange={(e) => setNovo({ ...novo, valido_ate: e.target.value })} />
          </div>
          <div className={styles.createField}>
            <label>Limite de usos</label>
            <input type="number" value={novo.limite_usos} onChange={(e) => setNovo({ ...novo, limite_usos: e.target.value })} />
          </div>
          <button type="submit" className={styles.createBtn}>
            Criar cupom
          </button>
        </form>

        <div className={styles.tableScroll} style={{ marginTop: '1rem' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo</th>
                <th>Desconto</th>
                <th>Válido até</th>
                <th>Usos</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cupons.map((c) => (
                <tr key={c.codigo}>
                  <td>
                    <code style={{ color: '#fff' }}>{c.codigo}</code>
                    {c.afiliado_user_id && (
                      <>
                        <br />
                        <span style={{ color: '#777', fontSize: '0.72rem' }}>{nomeDe(c.afiliado_user_id)}</span>
                      </>
                    )}
                  </td>
                  <td>{c.tipo}</td>
                  <td>
                    <input
                      type="number"
                      step="0.5"
                      defaultValue={c.desconto_pct ?? ''}
                      placeholder="%"
                      onBlur={(e) => editarCupom(c, { desconto_pct: e.target.value === '' ? null : Number(e.target.value) })}
                      style={{ width: 70, background: 'rgba(15,15,18,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.4rem 0.5rem' }}
                    />{' '}
                    {c.desconto_valor ? BRL.format(Number(c.desconto_valor)) : ''}
                  </td>
                  <td>{c.valido_ate ? new Date(c.valido_ate).toLocaleDateString('pt-BR') : '—'}</td>
                  <td>
                    {c.usos}
                    {c.limite_usos != null ? ` / ${c.limite_usos}` : ''}
                  </td>
                  <td>
                    {c.ativo ? (
                      <span className={`${styles.badge} ${styles.badgeApproved}`}>ativo</span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeAdmin}`}>inativo</span>
                    )}
                  </td>
                  <td>
                    <button type="button" className={`${styles.actionBtn} ${c.ativo ? styles.actionBtnDeny : styles.actionBtnApprove}`} onClick={() => alternarCupom(c)}>
                      {c.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
              {cupons.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    Nenhum cupom.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --------------------------------------------------- comissões */}
      <div className={styles.tableSection}>
        <h3 className={styles.tableSectionTitle}>Comissões</h3>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Afiliado</th>
                <th>Base</th>
                <th>%</th>
                <th>Comissão</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {comissoes.map((k) => (
                <tr key={k.id}>
                  <td>
                    #{k.pedidos?.numero ?? '—'}
                    <br />
                    <span style={{ color: '#777', fontSize: '0.72rem' }}>
                      {k.pedidos?.status ?? ''} · {new Date(k.criado_em).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td>{nomeDe(k.afiliado_user_id)}</td>
                  <td>{BRL.format(Number(k.base_valor))}</td>
                  <td>{k.percentual}%</td>
                  <td>
                    <strong style={{ color: '#fff' }}>{BRL.format(Number(k.valor))}</strong>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${k.status === 'paga' ? styles.badgeApproved : k.status === 'cancelada' ? styles.badgeAdmin : styles.badgePending}`}>
                      {k.status}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {k.status !== 'paga' && k.status !== 'cancelada' && (
                      <>
                        <button type="button" className={`${styles.actionBtn} ${styles.actionBtnApprove}`} onClick={() => marcarComissao(k, 'paga')}>
                          Marcar paga
                        </button>{' '}
                        <button type="button" className={`${styles.actionBtn} ${styles.actionBtnDeny}`} onClick={() => marcarComissao(k, 'cancelada')}>
                          Cancelar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {comissoes.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    Nenhuma comissão ainda — nasce quando um pedido indicado é faturado no NZERP.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
