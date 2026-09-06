// /painel — a conta do cliente final e do lojista.
//
// Existia como destino do login e do menu, mas nunca teve rota (caía em 404).
// Aqui vive o que o usuário precisa ver sobre si: o status do cadastro (a
// aprovação é o que libera preço), os dados cadastrais que o pedido vai usar,
// os pedidos feitos pelo site e, na Fase 6, o link de afiliado e as comissões.
//
// Quem não está logado vai para o login e volta para cá.

import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatarCpfCnpj, somenteDigitos, tipoDocumento, validarCpfCnpj } from '../../lib/documento';
import styles from './Painel.module.css';

interface Perfil {
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  cpf_cnpj: string | null;
  ie: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
}

interface Afiliado {
  codigo: string;
  ativo: boolean;
  percentual: number;
  diasAtribuicao: number;
  cupom: { desconto_pct: number | null; desconto_valor: number | null; ativo: boolean } | null;
}

interface Comissao {
  id: string;
  base_valor: number;
  percentual: number;
  valor: number;
  status: 'pendente' | 'apurada' | 'paga' | 'cancelada';
  criado_em: string;
  paga_em: string | null;
  pedidos: { numero: number; status: string } | null;
}

interface Pedido {
  id: string;
  numero: number;
  status: string;
  total_estimado: number | null;
  criado_em: string;
  erp_quote_number: number | null;
}

const VAZIO: Perfil = {
  full_name: '',
  company_name: '',
  phone: '',
  cpf_cnpj: '',
  ie: '',
  address_street: '',
  address_number: '',
  address_complement: '',
  address_neighborhood: '',
  address_city: '',
  address_state: '',
  address_zip: '',
};

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const STATUS_LABEL: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  ABERTO: 'Enviado — aguardando o vendedor',
  AGUARDANDO: 'Aguardando',
  APROVADO: 'Aprovado',
  FATURADO: 'Faturado',
  FATURADO_PARCIAL: 'Faturado parcialmente',
  PREPARANDO_ENVIO: 'Preparando envio',
  PRONTO_ENVIO: 'Pronto para envio',
  ENVIADO: 'Enviado',
  ENTREGUE: 'Entregue',
  NAO_ENTREGUE: 'Não entregue',
  DADOS_INCOMPLETOS: 'Dados incompletos',
  NAO_APROVADO: 'Não aprovado',
  CANCELADO: 'Cancelado',
};

export default function Painel() {
  const { user, profile, loading, isAdmin, isApproved, signOut } = useAuth();
  const [perfil, setPerfil] = useState<Perfil>(VAZIO);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [afiliado, setAfiliado] = useState<Afiliado | null>(null);
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [totais, setTotais] = useState<{ pendente: number; apurada: number; paga: number } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const carregar = useCallback(async () => {
    if (!user) return;
    const [{ data: p }, { data: ped }] = await Promise.all([
      supabase
        .from('user_profiles')
        .select(
          'full_name, company_name, phone, cpf_cnpj, ie, address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_zip'
        )
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('pedidos')
        .select('id, numero, status, total_estimado, criado_em, erp_quote_number')
        .eq('user_id', user.id)
        .order('criado_em', { ascending: false })
        .limit(50),
    ]);
    if (p) {
      const limpo = { ...VAZIO };
      for (const k of Object.keys(VAZIO) as (keyof Perfil)[]) limpo[k] = (p as Perfil)[k] ?? '';
      setPerfil(limpo);
    }
    setPedidos((ped ?? []) as Pedido[]);
    setCarregando(false);

    // Afiliado: o código nasce no primeiro acesso ao painel. Falha aqui não
    // derruba a página — a seção simplesmente não aparece.
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (token) {
        const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
        const [a, c] = await Promise.all([
          fetch('/api/nz/afiliado', { method: 'POST', headers: h, body: JSON.stringify({ op: 'meu' }) }),
          fetch('/api/nz/afiliado', { method: 'POST', headers: h, body: JSON.stringify({ op: 'comissoes' }) }),
        ]);
        if (a.ok) setAfiliado((await a.json()) as Afiliado);
        if (c.ok) {
          const j = (await c.json()) as { comissoes: Comissao[]; totais: { pendente: number; apurada: number; paga: number } };
          setComissoes(j.comissoes);
          setTotais(j.totais);
        }
      }
    } catch {
      /* sem afiliado nesta carga */
    }
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar();
  }, [carregar]);

  if (loading) return null;
  if (!user) return <Navigate to="/login?next=/painel" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;

  const lojista = profile?.role === 'reseller';
  const doc = perfil.cpf_cnpj ?? '';

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (doc && !validarCpfCnpj(doc)) {
      setMsg({ tipo: 'erro', texto: 'CPF/CNPJ inválido — confira os dígitos.' });
      return;
    }
    if (lojista && tipoDocumento(doc) !== 'cnpj') {
      setMsg({ tipo: 'erro', texto: 'Lojista precisa de CNPJ.' });
      return;
    }
    setSalvando(true);
    const patch: Partial<Perfil> = { ...perfil, cpf_cnpj: doc ? somenteDigitos(doc) : null };
    for (const k of Object.keys(patch) as (keyof Perfil)[]) if (patch[k] === '') patch[k] = null;
    const { error } = await supabase.from('user_profiles').update(patch).eq('id', user.id);
    setSalvando(false);
    setMsg(error ? { tipo: 'erro', texto: error.message } : { tipo: 'ok', texto: 'Dados salvos.' });
  };

  const set = (k: keyof Perfil) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setPerfil((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className={`container ${styles.pagina}`}>
      <header className={styles.cabecalho}>
        <div>
          <span className={styles.rotulo}>{lojista ? 'Conta de lojista' : 'Conta de cliente'}</span>
          <h1 className={styles.titulo}>{perfil.full_name || user.email}</h1>
        </div>
        <button type="button" className={styles.sair} onClick={() => void signOut()}>
          Sair
        </button>
      </header>

      {/* ------------------------------------------------------ status */}
      <section className={`${styles.bloco} ${isApproved ? styles.blocoOk : styles.blocoPendente}`}>
        {isApproved ? (
          <>
            <strong>Cadastro aprovado.</strong> Você vê preço de rolo fechado e de metro em toda a{' '}
            <Link to="/loja">loja</Link>.
          </>
        ) : (
          <>
            <strong>Cadastro em análise.</strong> A NZ confere os dados e libera os preços — costuma
            levar um dia útil. Complete o cadastro abaixo para acelerar
            {lojista ? ' (CNPJ e inscrição estadual são obrigatórios para lojista)' : ''}.
          </>
        )}
      </section>

      {/* ------------------------------------------------------- dados */}
      <section className={styles.bloco}>
        <h2 className={styles.subtitulo}>Meus dados</h2>
        {carregando ? (
          <p className={styles.mudo}>Carregando…</p>
        ) : (
          <form className={styles.form} onSubmit={salvar}>
            <label className={styles.campo}>
              <span>Nome</span>
              <input value={perfil.full_name ?? ''} onChange={set('full_name')} required />
            </label>
            <label className={styles.campo}>
              <span>WhatsApp</span>
              <input value={perfil.phone ?? ''} onChange={set('phone')} inputMode="tel" />
            </label>
            <label className={styles.campo}>
              <span>{lojista ? 'CNPJ' : 'CPF ou CNPJ'}</span>
              <input
                value={formatarCpfCnpj(doc)}
                onChange={set('cpf_cnpj')}
                inputMode="numeric"
                required={lojista}
                placeholder={lojista ? '00.000.000/0000-00' : '000.000.000-00'}
              />
            </label>
            {(lojista || tipoDocumento(doc) === 'cnpj') && (
              <>
                <label className={styles.campo}>
                  <span>Razão social</span>
                  <input value={perfil.company_name ?? ''} onChange={set('company_name')} required={lojista} />
                </label>
                <label className={styles.campo}>
                  <span>Inscrição estadual</span>
                  <input value={perfil.ie ?? ''} onChange={set('ie')} placeholder="ou ISENTO" />
                </label>
              </>
            )}

            <h3 className={styles.subsub}>Endereço de entrega</h3>
            <label className={styles.campo}>
              <span>CEP</span>
              <input value={perfil.address_zip ?? ''} onChange={set('address_zip')} inputMode="numeric" />
            </label>
            <label className={`${styles.campo} ${styles.campoLargo}`}>
              <span>Rua</span>
              <input value={perfil.address_street ?? ''} onChange={set('address_street')} />
            </label>
            <label className={styles.campo}>
              <span>Número</span>
              <input value={perfil.address_number ?? ''} onChange={set('address_number')} />
            </label>
            <label className={styles.campo}>
              <span>Complemento</span>
              <input value={perfil.address_complement ?? ''} onChange={set('address_complement')} />
            </label>
            <label className={styles.campo}>
              <span>Bairro</span>
              <input value={perfil.address_neighborhood ?? ''} onChange={set('address_neighborhood')} />
            </label>
            <label className={styles.campo}>
              <span>Cidade</span>
              <input value={perfil.address_city ?? ''} onChange={set('address_city')} />
            </label>
            <label className={styles.campo}>
              <span>UF</span>
              <input value={perfil.address_state ?? ''} onChange={set('address_state')} maxLength={2} />
            </label>

            {msg && <p className={msg.tipo === 'ok' ? styles.ok : styles.erro}>{msg.texto}</p>}
            <button type="submit" className={styles.salvar} disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar dados'}
            </button>
          </form>
        )}
      </section>

      {/* ---------------------------------------------------- afiliado */}
      {afiliado && (
        <section className={styles.bloco}>
          <h2 className={styles.subtitulo}>Indique e ganhe</h2>
          <p className={styles.mudo}>
            Compartilhe seu link. Quem chegar por ele e comprar em até {afiliado.diasAtribuicao} dias gera{' '}
            <strong>{afiliado.percentual}%</strong> de comissão para você, apurada quando o pedido é faturado.
            {afiliado.cupom?.desconto_pct ? ` Seu cupom ${afiliado.codigo} dá ${afiliado.cupom.desconto_pct}% de desconto.` : ''}
          </p>
          <div className={styles.linkBox}>
            <code className={styles.link}>{`${window.location.origin}/loja?ref=${afiliado.codigo}`}</code>
            <button
              type="button"
              className={styles.copiar}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(`${window.location.origin}/loja?ref=${afiliado.codigo}`);
                  setCopiado(true);
                  setTimeout(() => setCopiado(false), 1800);
                } catch {
                  /* clipboard bloqueado: o texto continua selecionável */
                }
              }}
            >
              {copiado ? 'Copiado' : 'Copiar link'}
            </button>
          </div>
          {totais && (
            <p className={styles.totais}>
              Pendente {BRL.format(totais.pendente)} · Apurada {BRL.format(totais.apurada)} · Paga {BRL.format(totais.paga)}
            </p>
          )}
          {comissoes.length > 0 && (
            <ul className={styles.pedidos}>
              {comissoes.map((c) => (
                <li key={c.id} className={styles.pedido}>
                  <span className={styles.pedidoNumero}>#{c.pedidos?.numero ?? '—'}</span>
                  <span className={styles.pedidoStatus}>
                    {c.status} · {c.percentual}% de {BRL.format(Number(c.base_valor))}
                  </span>
                  <span className={styles.pedidoData}>{new Date(c.criado_em).toLocaleDateString('pt-BR')}</span>
                  <span className={styles.pedidoTotal}>{BRL.format(Number(c.valor))}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ----------------------------------------------------- pedidos */}
      <section className={styles.bloco}>
        <h2 className={styles.subtitulo}>Meus pedidos</h2>
        {pedidos.length === 0 ? (
          <p className={styles.mudo}>
            Nenhum pedido pelo site ainda. Os pedidos feitos aqui aparecem com o mesmo status do NZERP.
          </p>
        ) : (
          <ul className={styles.pedidos}>
            {pedidos.map((p) => (
              <li key={p.id} className={styles.pedido}>
                <span className={styles.pedidoNumero}>#{p.numero}</span>
                <span className={styles.pedidoStatus}>{STATUS_LABEL[p.status] ?? p.status}</span>
                <span className={styles.pedidoData}>{new Date(p.criado_em).toLocaleDateString('pt-BR')}</span>
                <span className={styles.pedidoTotal}>
                  {p.total_estimado != null ? BRL.format(Number(p.total_estimado)) : '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
