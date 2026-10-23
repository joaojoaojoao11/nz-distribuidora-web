// /admin/cupons/novo e /admin/cupons/:codigo — a tela de UM cupom (criar ou
// editar), separada da lista (pedido do João, 21/10/2026). Campanha = todo
// mundo usa; nominal = um cliente da base. No modo edição mostra quem usou.

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { formatarCpfCnpj, normalizarDocumento } from '../../lib/documento';
import { ativarCupom, chamarIncentivos, salvarCupom } from '../../lib/shop/incentivos';
import { Avisos, Botao, Campo, Chip, Grade, PaginaAdmin, Secao } from './comuns/Pagina';
import { BRL, campoEstilo, dataBR, dataHoraBR } from './comuns/formato';
import styles from './Admin.module.css';
import ped from './AdminPedidos.module.css';

interface ClienteBusca {
  id: string;
  full_name: string | null;
  company_name: string | null;
  email: string | null;
  cpf_cnpj: string | null;
}

interface CupomVisto {
  codigo: string;
  tipo: string;
  descricao: string | null;
  desconto_pct: number | null;
  desconto_valor: number | null;
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
  dono: ClienteBusca | null;
  afiliado: ClienteBusca | null;
}

interface Uso {
  user_id: string;
  pedido_id: string | null;
  usado_em: string;
  cliente: { full_name: string | null; email: string | null } | null;
  pedido: { numero: number; status: string; total_final: number | null; total_estimado: number | null } | null;
}

const formVazio = { codigo: '', tipo: 'campanha', descricao: '', descontoPct: '', descontoValor: '', validoDe: '', validoAte: '', limiteUsos: '', usosPorCliente: '', soContaNova: false, donoUserId: '', donoNome: '', ativo: true };
const num = (s: string) => {
  const t = s.trim().replace(',', '.');
  return t === '' ? null : Number(t);
};
const dataInput = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }) : '');

export default function AdminCupomEditor() {
  const { codigo: codigoParam } = useParams();
  const navigate = useNavigate();
  const editando = Boolean(codigoParam);
  const [form, setForm] = useState(formVazio);
  const [cupom, setCupom] = useState<CupomVisto | null>(null);
  const [usos, setUsos] = useState<Uso[]>([]);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [sugestoes, setSugestoes] = useState<ClienteBusca[]>([]);
  const [carregando, setCarregando] = useState(editando);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');

  const carregar = useCallback(async () => {
    if (!codigoParam) return;
    setCarregando(true);
    try {
      const r = await chamarIncentivos<{ cupom: CupomVisto; usos: Uso[] }>({ op: 'cupom-ver', codigo: codigoParam });
      setCupom(r.cupom);
      setUsos(r.usos);
      const c = r.cupom;
      setForm({
        codigo: c.codigo,
        tipo: c.tipo === 'nominal' ? 'nominal' : 'campanha',
        descricao: c.descricao ?? '',
        descontoPct: c.desconto_pct != null ? String(c.desconto_pct) : '',
        descontoValor: c.desconto_valor != null ? String(c.desconto_valor) : '',
        validoDe: dataInput(c.valido_de),
        validoAte: dataInput(c.valido_ate),
        limiteUsos: c.limite_usos != null ? String(c.limite_usos) : '',
        usosPorCliente: c.usos_por_cliente != null ? String(c.usos_por_cliente) : '',
        soContaNova: Boolean(c.so_conta_nova),
        donoUserId: c.dono_user_id ?? '',
        donoNome: c.dono ? c.dono.full_name || c.dono.company_name || c.dono.email || '' : '',
        ativo: c.ativo,
      });
      setBuscaCliente(c.dono ? c.dono.full_name || c.dono.company_name || c.dono.email || '' : '');
      setErro('');
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setCarregando(false);
    }
  }, [codigoParam]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    const termo = buscaCliente.trim();
    if (termo.length < 3 || termo === form.donoNome) {
      setSugestoes([]);
      return;
    }
    const t = setTimeout(() => {
      const digitos = termo.replace(/\D/g, '');
      const limpo = termo.replace(/[%_,]/g, '');
      let q = supabase.from('user_profiles').select('id, full_name, company_name, email, cpf_cnpj').neq('role', 'admin').limit(8);
      // Documento: pelos números (como sempre) ou com as letras do CNPJ novo (jul/2026).
      q = digitos.length >= 4 ? q.or(`cpf_cnpj.ilike.%${digitos}%,cpf_cnpj.ilike.%${normalizarDocumento(termo)}%`) : q.or(`full_name.ilike.%${limpo}%,email.ilike.%${limpo}%,company_name.ilike.%${limpo}%`);
      void q.then(({ data }) => setSugestoes((data ?? []) as ClienteBusca[]));
    }, 300);
    return () => clearTimeout(t);
  }, [buscaCliente, form.donoNome]);

  const salvar = async () => {
    const codigo = form.codigo.trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9-]{2,23}$/.test(codigo)) {
      setErro('Código: de 3 a 24 letras, números ou hífen, sem espaço.');
      return;
    }
    if (form.tipo === 'nominal' && !form.donoUserId) {
      setErro('Cupom nominal precisa de um cliente da base: procure e escolha na lista.');
      return;
    }
    const pct = num(form.descontoPct);
    const val = num(form.descontoValor);
    if ((pct == null || pct <= 0) && (val == null || val <= 0)) {
      setErro('Informe o desconto em % ou em R$.');
      return;
    }
    if (pct != null && pct > 100) {
      setErro('Desconto em % não pode passar de 100.');
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
        validoDe: form.validoDe ? new Date(`${form.validoDe}T00:00:00-03:00`).toISOString() : '',
        validoAte: form.validoAte ? new Date(`${form.validoAte}T23:59:59-03:00`).toISOString() : '',
        limiteUsos: num(form.limiteUsos),
        usosPorCliente: num(form.usosPorCliente),
        soContaNova: form.soContaNova,
        donoUserId: form.tipo === 'nominal' ? form.donoUserId : '',
        ativo: form.ativo,
      });
      setMsg(`Cupom ${codigo} salvo.`);
      if (!editando) navigate(`/admin/cupons/${codigo}`, { replace: true });
      else await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setSalvando(false);
    }
  };

  const alternar = async () => {
    if (!cupom) return;
    try {
      await ativarCupom(cupom.codigo, !cupom.ativo);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  };

  if (carregando) return <p className={ped.mudo}>Carregando…</p>;
  const ehAfiliado = cupom?.tipo === 'afiliado' || cupom?.tipo === 'super';

  return (
    <PaginaAdmin
      titulo={editando ? `Cupom ${form.codigo}` : 'Novo cupom'}
      tutorial="admin.cupom-editor"
      voltar={{ para: '/admin/cupons', rotulo: 'Cupons' }}
      descricao={
        editando && cupom
          ? `${cupom.tipo === 'nominal' ? 'Nominal' : cupom.tipo === 'campanha' ? 'Campanha' : cupom.tipo === 'afiliado' ? 'Cupom de afiliado' : 'Super cupom'} · criado em ${dataBR(cupom.criado_em)} · ${cupom.usos} uso${cupom.usos === 1 ? '' : 's'}`
          : 'Campanha: qualquer cliente usa. Nominal: um cliente da base (procure pelo nome, e-mail ou CPF/CNPJ). Vazio em validade e limite = sem limite.'
      }
      acoes={
        <>
          {cupom && (cupom.ativo ? <Chip tom="ok">ativo</Chip> : <Chip tom="neutro">desligado</Chip>)}
          {cupom && !ehAfiliado && (
            <Botao variante={cupom.ativo ? 'perigo' : 'neutro'} onClick={() => void alternar()}>
              {cupom.ativo ? 'Desligar' : 'Ligar'}
            </Botao>
          )}
          {!ehAfiliado && (
            <Botao variante="principal" disabled={salvando} onClick={() => void salvar()}>
              {salvando ? 'Salvando…' : 'Salvar cupom'}
            </Botao>
          )}
        </>
      }
    >
      <Avisos erro={erro} msg={msg} />

      {ehAfiliado ? (
        <Secao titulo="Este cupom não se edita aqui" descricao="Cupom de afiliado se configura na tela do afiliado; super cupom, na tela de super cupons.">
          <p className={ped.mudo}>{cupom?.afiliado ? `Afiliado: ${cupom.afiliado.full_name || cupom.afiliado.email}` : cupom?.dono ? `Dono: ${cupom.dono.full_name || cupom.dono.email}` : ''}</p>
        </Secao>
      ) : (
        <Secao titulo="Regras do cupom">
          <Grade min={190}>
            <Campo label="Código" dica="letras, números ou hífen; não muda depois de criado">
              <input style={campoEstilo} value={form.codigo} disabled={editando} placeholder="ex.: NZ10 ou MARIA15" onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value.toUpperCase() }))} />
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
            <Campo label="Ativo">
              <select style={campoEstilo} value={form.ativo ? '1' : ''} onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.value === '1' }))}>
                <option value="1">sim</option>
                <option value="">não</option>
              </select>
            </Campo>
            <Campo label="Descrição (só a equipe vê)">
              <input style={campoEstilo} value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
            </Campo>
          </Grade>
          {form.tipo === 'nominal' && (
            <div style={{ marginTop: '0.9rem', position: 'relative', maxWidth: 560 }}>
              <Campo label="Cliente (nominal)" dica={form.donoNome ? `escolhido: ${form.donoNome}` : 'nome, e-mail ou CPF/CNPJ (3 letras ou mais)'}>
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
      )}

      {editando && (
        <Secao titulo={`Quem usou (${usos.length})`} descricao="Um registro por pedido pago ou faturado com este cupom.">
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>Cliente</th>
                  <th>Pedido</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {usos.map((u) => (
                  <tr key={`${u.user_id}-${u.pedido_id}`}>
                    <td>{dataHoraBR(u.usado_em)}</td>
                    <td>{u.cliente?.full_name || u.cliente?.email || u.user_id.slice(0, 8)}</td>
                    <td>{u.pedido ? `#${u.pedido.numero} · ${u.pedido.status}` : '—'}</td>
                    <td>{u.pedido ? BRL.format(Number(u.pedido.total_final ?? u.pedido.total_estimado ?? 0)) : '—'}</td>
                  </tr>
                ))}
                {usos.length === 0 && (
                  <tr>
                    <td colSpan={4} className={styles.emptyState}>
                      Ninguém usou ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Secao>
      )}
    </PaginaAdmin>
  );
}
