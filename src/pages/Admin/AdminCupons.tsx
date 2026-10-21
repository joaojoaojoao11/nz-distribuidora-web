// /admin/cupons — a tela dos CUPONS da NZ (Fase 2, D21): cupom de CAMPANHA
// (qualquer um usa, com validade e limite) e cupom NOMINAL (criado para UM
// cliente da base — "a NZ deu 10% para o fulano"). Os cupons de afiliado
// aparecem aqui só para consulta (quem manda neles é a tela do afiliado); o
// super cupom de cada cliente tem a tela dele.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { formatarCpfCnpj } from '../../lib/documento';
import { ativarCupom, listarCupons, salvarCupom } from '../../lib/shop/incentivos';
import { Avisos, Botao, Campo, Chip, Grade, Metricas, PaginaAdmin, Secao } from './comuns/Pagina';
import { BRL, campoEstilo, dataBR, pctTexto } from './comuns/formato';
import styles from './Admin.module.css';
import ped from './AdminPedidos.module.css';

interface Cupom {
  codigo: string;
  tipo: 'afiliado' | 'campanha' | 'nominal' | 'super';
  descricao: string | null;
  desconto_pct: number | null;
  desconto_valor: number | null;
  comissao_pct: number | null;
  dono_user_id: string | null;
  afiliado_user_id: string | null;
  valido_de: string | null;
  valido_ate: string | null;
  limite_usos: number | null;
  usos: number;
  usos_por_cliente: number | null;
  so_conta_nova: boolean;
  ativo: boolean;
  criado_em: string;
  dono: { full_name: string | null; company_name: string | null; email: string | null } | null;
  afiliado: { full_name: string | null; company_name: string | null; email: string | null } | null;
  cashbackGerado: number;
}

interface ClienteBusca {
  id: string;
  full_name: string | null;
  company_name: string | null;
  email: string | null;
  cpf_cnpj: string | null;
}

const TIPO_ROTULO: Record<string, string> = { campanha: 'Campanha', nominal: 'Nominal', afiliado: 'Afiliado', super: 'Super cupom' };
const formVazio = { codigo: '', tipo: 'campanha', descricao: '', descontoPct: '', descontoValor: '', validoDe: '', validoAte: '', limiteUsos: '', usosPorCliente: '', soContaNova: false, donoUserId: '', donoNome: '' };

export default function AdminCupons() {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'campanha' | 'nominal' | 'afiliado'>('todos');
  const [form, setForm] = useState(formVazio);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [sugestoes, setSugestoes] = useState<ClienteBusca[]>([]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const r = await listarCupons(['campanha', 'nominal', 'afiliado']);
      setCupons(r.cupons as unknown as Cupom[]);
      setErro('');
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // Busca de cliente para o cupom nominal (RLS de admin em user_profiles).
  useEffect(() => {
    const termo = buscaCliente.trim();
    if (termo.length < 3) {
      setSugestoes([]);
      return;
    }
    const t = setTimeout(() => {
      const digitos = termo.replace(/\D/g, '');
      let q = supabase.from('user_profiles').select('id, full_name, company_name, email, cpf_cnpj').neq('role', 'admin').limit(8);
      q = digitos.length >= 4 ? q.ilike('cpf_cnpj', `%${digitos}%`) : q.or(`full_name.ilike.%${termo.replace(/[%_,]/g, '')}%,email.ilike.%${termo.replace(/[%_,]/g, '')}%,company_name.ilike.%${termo.replace(/[%_,]/g, '')}%`);
      void q.then(({ data }) => setSugestoes((data ?? []) as ClienteBusca[]));
    }, 300);
    return () => clearTimeout(t);
  }, [buscaCliente]);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return cupons.filter((c) => {
      if (filtro !== 'todos' && c.tipo !== filtro) return false;
      if (!t) return true;
      return [c.codigo, c.descricao, c.dono?.full_name, c.dono?.email, c.afiliado?.full_name, c.afiliado?.email].some((x) => (x ?? '').toLowerCase().includes(t));
    });
  }, [cupons, busca, filtro]);

  const num = (s: string) => {
    const t = s.trim().replace(',', '.');
    return t === '' ? null : Number(t);
  };

  const salvar = async () => {
    const codigo = form.codigo.trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9-]{2,23}$/.test(codigo)) {
      setErro('Código: de 3 a 24 letras, números ou hífen, sem espaço.');
      return;
    }
    if (form.tipo === 'nominal' && !form.donoUserId) {
      setErro('Cupom nominal precisa de um cliente da base.');
      return;
    }
    const pct = num(form.descontoPct);
    const val = num(form.descontoValor);
    if ((pct == null || pct <= 0) && (val == null || val <= 0)) {
      setErro('Informe o desconto em % ou em R$.');
      return;
    }
    setSalvando(true);
    setErro('');
    setMsg('');
    try {
      await salvarCupom({
        codigo,
        tipo: form.tipo,
        descricao: form.descricao,
        descontoPct: pct,
        descontoValor: val,
        validoDe: form.validoDe ? new Date(form.validoDe).toISOString() : '',
        validoAte: form.validoAte ? new Date(`${form.validoAte}T23:59:59-03:00`).toISOString() : '',
        limiteUsos: num(form.limiteUsos),
        usosPorCliente: num(form.usosPorCliente),
        soContaNova: form.soContaNova,
        donoUserId: form.tipo === 'nominal' ? form.donoUserId : '',
        ativo: true,
      });
      setMsg(`Cupom ${codigo} salvo.`);
      setForm(formVazio);
      setBuscaCliente('');
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setSalvando(false);
    }
  };

  const alternar = async (c: Cupom) => {
    try {
      await ativarCupom(c.codigo, !c.ativo);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  };

  const descontoTexto = (c: Cupom) => (c.desconto_pct ? `${pctTexto(c.desconto_pct)}%` : c.desconto_valor ? BRL.format(Number(c.desconto_valor)) : c.tipo === 'afiliado' ? 'regra do afiliado' : '—');
  const ativos = cupons.filter((c) => c.ativo).length;

  return (
    <PaginaAdmin
      titulo="Cupons"
      descricao={
        <>
          Cupom de <strong>campanha</strong> (qualquer cliente usa, com validade e limite) e cupom <strong>nominal</strong> (criado para um cliente da base: só ele usa). O cupom de cada{' '}
          <Link to="/admin/afiliados" style={{ color: '#fff' }}>afiliado</Link> aparece aqui para consulta; o <Link to="/admin/super-cupons" style={{ color: '#fff' }}>super cupom</Link> de cada cliente tem a
          tela dele. O desconto do cupom chega ao NZERP rateado por item e sai na NF.
        </>
      }
    >
      <Avisos erro={erro} msg={msg} />
      <Metricas
        itens={[
          { rotulo: 'Cupons', valor: cupons.length },
          { rotulo: 'Ativos', valor: ativos },
          { rotulo: 'Usos', valor: cupons.reduce((s, c) => s + Number(c.usos), 0) },
          { rotulo: 'Nominais', valor: cupons.filter((c) => c.tipo === 'nominal').length },
        ]}
      />

      <Secao
        titulo="Novo cupom"
        descricao="Campanha: para todo mundo. Nominal: para um cliente só (procure pelo nome, e-mail ou CPF/CNPJ). Vazio em validade e limite = sem limite."
        acoes={
          <Botao variante="principal" disabled={salvando} onClick={() => void salvar()}>
            {salvando ? 'Salvando…' : 'Salvar cupom'}
          </Botao>
        }
      >
        <Grade min={170}>
          <Campo label="Código" dica="letras, números ou hífen">
            <input style={campoEstilo} value={form.codigo} placeholder="ex.: NZ10 ou MARIA15" onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value.toUpperCase() }))} />
          </Campo>
          <Campo label="Tipo">
            <select style={campoEstilo} value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}>
              <option value="campanha">campanha (todo mundo)</option>
              <option value="nominal">nominal (um cliente)</option>
            </select>
          </Campo>
          <Campo label="Desconto (%)">
            <input style={campoEstilo} inputMode="decimal" value={form.descontoPct} onChange={(e) => setForm((f) => ({ ...f, descontoPct: e.target.value }))} />
          </Campo>
          <Campo label="ou desconto (R$)">
            <input style={campoEstilo} inputMode="decimal" value={form.descontoValor} onChange={(e) => setForm((f) => ({ ...f, descontoValor: e.target.value }))} />
          </Campo>
          <Campo label="Vale de">
            <input style={campoEstilo} type="date" value={form.validoDe} onChange={(e) => setForm((f) => ({ ...f, validoDe: e.target.value }))} />
          </Campo>
          <Campo label="Vale até">
            <input style={campoEstilo} type="date" value={form.validoAte} onChange={(e) => setForm((f) => ({ ...f, validoAte: e.target.value }))} />
          </Campo>
          <Campo label="Limite de usos (total)">
            <input style={campoEstilo} inputMode="numeric" value={form.limiteUsos} onChange={(e) => setForm((f) => ({ ...f, limiteUsos: e.target.value }))} />
          </Campo>
          <Campo label="Usos por cliente">
            <input style={campoEstilo} inputMode="numeric" value={form.usosPorCliente} onChange={(e) => setForm((f) => ({ ...f, usosPorCliente: e.target.value }))} />
          </Campo>
          <Campo label="Só conta nova" dica="quem já comprou não usa">
            <select style={campoEstilo} value={form.soContaNova ? '1' : ''} onChange={(e) => setForm((f) => ({ ...f, soContaNova: e.target.value === '1' }))}>
              <option value="">não</option>
              <option value="1">sim</option>
            </select>
          </Campo>
          <Campo label="Descrição (só a equipe vê)">
            <input style={campoEstilo} value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
          </Campo>
        </Grade>
        {form.tipo === 'nominal' && (
          <div style={{ marginTop: '0.75rem', position: 'relative', maxWidth: 520 }}>
            <Campo label="Cliente" dica={form.donoNome ? `escolhido: ${form.donoNome}` : 'nome, e-mail ou CPF/CNPJ (3 letras ou mais)'}>
              <input style={campoEstilo} value={buscaCliente} onChange={(e) => setBuscaCliente(e.target.value)} />
            </Campo>
            {sugestoes.length > 0 && (
              <div style={{ position: 'absolute', zIndex: 5, left: 0, right: 0, background: '#141417', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, marginTop: 2 }}>
                {sugestoes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 0, color: '#ddd', padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.85rem' }}
                    onClick={() => {
                      const nome = s.full_name || s.company_name || s.email || s.id;
                      setForm((f) => ({ ...f, donoUserId: s.id, donoNome: nome }));
                      setBuscaCliente(nome);
                      setSugestoes([]);
                    }}
                  >
                    {s.full_name || '—'} <small className={ped.mudo}>· {s.company_name ?? ''} · {s.email ?? ''} · {s.cpf_cnpj ? formatarCpfCnpj(s.cpf_cnpj) : ''}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Secao>

      <Secao
        titulo={`Cupons (${filtrados.length})`}
        acoes={
          <>
            <input className={ped.busca} placeholder="Buscar por código, descrição ou cliente" value={busca} onChange={(e) => setBusca(e.target.value)} />
            {(['todos', 'campanha', 'nominal', 'afiliado'] as const).map((f) => (
              <button key={f} type="button" className={`${styles.periodBtn} ${filtro === f ? styles.periodBtnActive : ''}`} onClick={() => setFiltro(f)}>
                {f === 'todos' ? 'Todos' : TIPO_ROTULO[f]}
              </button>
            ))}
          </>
        }
      >
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo</th>
                <th>Desconto</th>
                <th>De quem / para quem</th>
                <th>Validade</th>
                <th>Usos</th>
                <th>Regras</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.codigo}>
                  <td>
                    <code>{c.codigo}</code>
                    {c.descricao && <div className={ped.mudo} style={{ fontSize: '0.72rem' }}>{c.descricao}</div>}
                  </td>
                  <td>{TIPO_ROTULO[c.tipo] ?? c.tipo}</td>
                  <td>{descontoTexto(c)}</td>
                  <td>
                    {c.tipo === 'nominal' && c.dono ? `para ${c.dono.full_name || c.dono.company_name || c.dono.email}` : ''}
                    {c.tipo === 'afiliado' && c.afiliado ? `afiliado ${c.afiliado.full_name || c.afiliado.company_name || c.afiliado.email}` : ''}
                    {c.tipo === 'campanha' ? <span className={ped.mudo}>todo mundo</span> : ''}
                  </td>
                  <td className={ped.mudo}>
                    {c.valido_de ? `de ${dataBR(c.valido_de)} ` : ''}
                    {c.valido_ate ? `até ${dataBR(c.valido_ate)}` : c.valido_de ? '' : 'sem prazo'}
                  </td>
                  <td>
                    {c.usos}
                    {c.limite_usos != null ? ` / ${c.limite_usos}` : ''}
                  </td>
                  <td className={ped.mudo} style={{ fontSize: '0.72rem' }}>
                    {[c.usos_por_cliente != null ? `${c.usos_por_cliente} por cliente` : null, c.so_conta_nova ? 'só conta nova' : null].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td>{c.ativo ? <Chip tom="ok">ativo</Chip> : <Chip tom="neutro">desligado</Chip>}</td>
                  <td>
                    {c.tipo !== 'afiliado' ? (
                      <Botao variante={c.ativo ? 'perigo' : 'neutro'} onClick={() => void alternar(c)}>
                        {c.ativo ? 'Desligar' : 'Ligar'}
                      </Botao>
                    ) : (
                      <Link to={`/admin/afiliados/${c.afiliado_user_id}`} className={styles.actionBtn} style={{ textDecoration: 'none' }}>
                        Tela do afiliado
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
              {!carregando && filtrados.length === 0 && (
                <tr>
                  <td colSpan={9} className={styles.emptyState}>
                    Nenhum cupom com esse filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Secao>
    </PaginaAdmin>
  );
}
