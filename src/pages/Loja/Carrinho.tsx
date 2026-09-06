// /carrinho — revisão e envio do pedido para o NZERP.
//
// O que a página faz: lista os itens (preço pelo mesmo endpoint da loja,
// então respeita o papel), aceita cupom, mostra o endereço do cadastro (o
// pedido vai com ele) e envia. O total é ESTIMADO — quem precifica e aprova
// é o vendedor no ERP; o cliente acompanha o status em /painel.

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { chamarCheckout } from '../../lib/shop/checkout';
import { supabase } from '../../lib/supabase';
import { visitanteId } from '../../lib/afiliado';
import { alterarQuantidade, limparCarrinho, removerDoCarrinho, useCarrinho } from '../../lib/shop/carrinho';
import { BRL, usePreco, usePrecosLote, usePrecosMapa } from '../../lib/shop/precos';
import type { ItemCarrinho } from '../../lib/shop/carrinho';
import styles from './Carrinho.module.css';

interface Endereco {
  address_street: string | null;
  address_number: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  cpf_cnpj: string | null;
  phone: string | null;
}

export default function Carrinho() {
  const { user, loading, isApproved, isAdmin } = useAuth();
  const itens = useCarrinho();
  const navigate = useNavigate();
  usePrecosLote(itens.map((i) => i.slug));

  const [cupom, setCupom] = useState('');
  const [cupomInfo, setCupomInfo] = useState<{ valido: boolean; descontoPct?: number | null; descontoValor?: number | null; motivo?: string } | null>(null);
  const [obs, setObs] = useState('');
  const [endereco, setEndereco] = useState<Endereco | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState<{ numero: number; erpQuoteNumber: number } | null>(null);
  // Pagamento online aberto? Decidido no servidor (loja_config.checkout_ativo);
  // o admin vê o botão sempre, para testar antes de abrir.
  const [checkoutAtivo, setCheckoutAtivo] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    void supabase
      .from('user_profiles')
      .select('address_street, address_number, address_city, address_state, address_zip, cpf_cnpj, phone')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => setEndereco((data as Endereco | null) ?? null));
  }, [user]);

  useEffect(() => {
    if (!user || !(isApproved || isAdmin) || !itens.length) return;
    let vivo = true;
    chamarCheckout<{ checkoutAtivo: boolean }>({ op: 'resumo', itens: itens.slice(0, 1).map((i) => ({ slug: i.slug, qtd: i.qtd, unidade: i.unidade })) })
      .then((r) => {
        if (vivo) setCheckoutAtivo(Boolean(r.checkoutAtivo) || isAdmin);
      })
      .catch(() => {
        if (vivo) setCheckoutAtivo(isAdmin);
      });
    return () => {
      vivo = false;
    };
    // Só precisa saber se está ligado; um item basta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isApproved, isAdmin, itens.length > 0]);

  const cadastroCompleto = Boolean(
    endereco?.address_street && endereco.address_city && endereco.address_state && endereco.address_zip && endereco.cpf_cnpj && endereco.phone
  );

  const validarCupom = async () => {
    const codigo = cupom.trim().toUpperCase();
    if (!codigo) {
      setCupomInfo(null);
      return;
    }
    const r = await fetch('/api/nz/afiliado', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'validar', codigo }) });
    setCupomInfo(r.ok ? await r.json() : { valido: false });
  };

  const enviar = async () => {
    setErro('');
    setEnviando(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Sessão expirada — entre de novo.');
      const r = await fetch('/api/nz/pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          itens: itens.map((i) => ({ slug: i.slug, qtd: i.qtd, unidade: i.unidade, lpns: i.lpns })),
          cupom: cupomInfo?.valido ? cupom.trim().toUpperCase() : '',
          observacoes: obs,
          visitante: visitanteId(),
        }),
      });
      const j = (await r.json()) as { ok?: boolean; numero?: number; erpQuoteNumber?: number; error?: string; faltando?: string[]; invalidos?: string[]; message?: string };
      if (!r.ok || !j.ok) {
        if (j.error === 'cadastro-incompleto') setErro(`Complete o cadastro no painel antes de pedir: ${(j.faltando ?? []).join(', ')}.`);
        else if (j.error === 'cupom-invalido') setErro('Cupom inválido ou já usado.');
        else if (j.error === 'itens-invalidos') setErro(`Alguns itens não estão disponíveis: ${(j.invalidos ?? []).join(', ')}.`);
        else if (j.error === 'aguardando-aprovacao') setErro('Seu cadastro ainda está em análise.');
        else if (j.error === 'erp-indisponivel') setErro(`O pedido #${j.numero} foi guardado, mas o NZERP não respondeu. Tente enviar de novo em instantes.`);
        else setErro(j.message ?? 'Não foi possível enviar o pedido.');
        return;
      }
      limparCarrinho();
      setSucesso({ numero: j.numero!, erpQuoteNumber: j.erpQuoteNumber! });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha de rede.');
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return null;

  if (sucesso) {
    return (
      <div className={`container ${styles.pagina}`}>
        <section className={styles.sucesso}>
          <h1 className={styles.titulo}>Pedido #{sucesso.numero} enviado</h1>
          <p>
            Ele já está no NZERP como orçamento nº {sucesso.erpQuoteNumber}. Um vendedor confere estoque, frete e
            condição de pagamento e entra em contato. Acompanhe o status em <Link to="/painel">Minha conta</Link>.
          </p>
          <Link to="/loja" className={styles.voltar}>
            Continuar na loja
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className={`container ${styles.pagina}`}>
      <h1 className={styles.titulo}>Carrinho</h1>

      {itens.length === 0 ? (
        <p className={styles.mudo}>
          Nada aqui ainda. Na página de um produto, escolha rolo fechado ou metros e adicione.{' '}
          <Link to="/loja">Ir para a loja</Link>
        </p>
      ) : (
        <div className={styles.layout}>
          <ul className={styles.lista}>
            {itens.map((i) => (
              <Linha key={`${i.slug}|${i.unidade}`} item={i} />
            ))}
          </ul>

          <aside className={styles.resumo}>
            <Total itens={itens} cupom={cupomInfo} />

            {!user ? (
              <Link to="/login?next=/carrinho" className={styles.enviar}>
                Entrar para pedir
              </Link>
            ) : !isApproved && !isAdmin ? (
              <p className={styles.aviso}>Seu cadastro está em análise. Assim que for aprovado, você envia o pedido daqui.</p>
            ) : (
              <>
                {checkoutAtivo && (
                  <>
                    <Link to="/checkout" className={styles.enviar}>
                      Fechar pedido e pagar
                    </Link>
                    <p className={styles.nota}>Pix, cartão em até 6x ou boleto. Frete calculado no checkout.</p>
                    <details className={styles.ouOrcamento}>
                      <summary>Prefere enviar como orçamento, sem pagar agora?</summary>
                      <p className={styles.nota}>O vendedor confere estoque, frete e condição e fecha com você.</p>
                    </details>
                  </>
                )}
                <label className={styles.campo}>
                  <span>Cupom</span>
                  <div className={styles.cupomLinha}>
                    <input value={cupom} onChange={(e) => setCupom(e.target.value)} onBlur={validarCupom} placeholder="NZ-XXXXX" />
                    <button type="button" onClick={validarCupom}>
                      Aplicar
                    </button>
                  </div>
                  {cupomInfo && (
                    <small className={cupomInfo.valido ? styles.ok : styles.erro}>
                      {cupomInfo.valido
                        ? `Cupom aplicado${cupomInfo.descontoPct ? ` — ${cupomInfo.descontoPct}%` : cupomInfo.descontoValor ? ` — ${BRL.format(Number(cupomInfo.descontoValor))}` : ''}.`
                        : 'Cupom inválido.'}
                    </small>
                  )}
                </label>

                <label className={styles.campo}>
                  <span>Observações para o vendedor</span>
                  <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={3} maxLength={1000} />
                </label>

                <div className={styles.endereco}>
                  <span className={styles.rotulo}>Entrega</span>
                  {cadastroCompleto ? (
                    <p>
                      {endereco!.address_street}, {endereco!.address_number ?? 's/n'} — {endereco!.address_city}/{endereco!.address_state} · CEP {endereco!.address_zip}
                      <br />
                      <Link to="/painel">alterar no painel</Link>
                    </p>
                  ) : (
                    <p className={styles.erro}>
                      Falta completar documento, telefone ou endereço. <Link to="/painel">Completar cadastro</Link>
                    </p>
                  )}
                </div>

                {erro && <p className={styles.erro}>{erro}</p>}

                <button type="button" className={checkoutAtivo ? styles.limpar : styles.enviar} onClick={enviar} disabled={enviando || !cadastroCompleto}>
                  {enviando ? 'Enviando…' : checkoutAtivo ? 'Enviar como orçamento' : 'Enviar pedido ao NZERP'}
                </button>
                <p className={styles.nota}>
                  Sem pagamento aqui: o vendedor confirma estoque, frete e condição e fecha com você. Frete à parte.
                </p>
              </>
            )}
            <button type="button" className={styles.limpar} onClick={() => navigate('/loja')}>
              Continuar comprando
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}

function Linha({ item }: { item: ItemCarrinho }) {
  const { item: preco } = usePreco(item.slug);
  const unit = item.unidade === 'rolo' ? preco?.rolo : preco?.metro;
  const subtotal = unit != null ? Number(unit) * item.qtd : null;
  return (
    <li className={styles.item}>
      <Link to={`/loja/${item.slug}`} className={styles.thumb} aria-hidden="true">
        {item.imagem ? <img src={item.imagem} alt="" /> : <span style={{ background: item.hex ?? '#222' }} />}
      </Link>
      <div className={styles.itemInfo}>
        <Link to={`/loja/${item.slug}`} className={styles.itemNome}>
          {item.nome}
        </Link>
        <span className={styles.itemMeta}>
          {item.codigo ? `${item.codigo} · ` : ''}
          {item.unidade === 'rolo' ? `rolo fechado${preco?.metragemPadrao ? ` de ${preco.metragemPadrao} m` : ''}` : 'metro linear'}
          {item.lpns.length ? ` · rolos ${item.lpns.join(', ')}` : ''}
        </span>
        {unit != null && (
          <span className={styles.itemPreco}>
            {BRL.format(Number(unit))} / {item.unidade === 'rolo' ? 'rolo' : 'm'}
          </span>
        )}
      </div>
      <div className={styles.qtd}>
        <button type="button" aria-label="Menos" onClick={() => alterarQuantidade(item.slug, item.unidade, item.qtd - (item.unidade === 'rolo' ? 1 : 0.5))}>
          −
        </button>
        <input
          type="number"
          min={item.unidade === 'rolo' ? 1 : 0.5}
          step={item.unidade === 'rolo' ? 1 : 0.5}
          value={item.qtd}
          onChange={(e) => alterarQuantidade(item.slug, item.unidade, Number(e.target.value))}
        />
        <button type="button" aria-label="Mais" onClick={() => alterarQuantidade(item.slug, item.unidade, item.qtd + (item.unidade === 'rolo' ? 1 : 0.5))}>
          +
        </button>
      </div>
      <span className={styles.itemSubtotal}>{subtotal != null ? BRL.format(subtotal) : '—'}</span>
      <button type="button" className={styles.remover} aria-label="Remover" onClick={() => removerDoCarrinho(item.slug, item.unidade)}>
        ✕
      </button>
    </li>
  );
}

function Total({ itens, cupom }: { itens: ItemCarrinho[]; cupom: { valido: boolean; descontoPct?: number | null; descontoValor?: number | null } | null }) {
  // Soma sobre o mapa de preços já carregado; só fecha quando todos chegaram.
  const { itens: mapa } = usePrecosMapa();
  const total = useMemo(() => {
    let s = 0;
    for (const i of itens) {
      const p = mapa.get(i.slug);
      const unit = i.unidade === 'rolo' ? p?.rolo : p?.metro;
      if (unit == null) return null;
      s += Number(unit) * i.qtd;
    }
    return Math.round(s * 100) / 100;
  }, [itens, mapa]);
  if (total == null) return <p className={styles.mudo}>Calculando…</p>;
  let desconto = 0;
  if (cupom?.valido) {
    if (cupom.descontoPct) desconto = Math.round(total * (Number(cupom.descontoPct) / 100) * 100) / 100;
    else if (cupom.descontoValor) desconto = Math.min(total, Number(cupom.descontoValor));
  }
  return (
    <div className={styles.totais}>
      <div>
        <span>Subtotal</span>
        <strong>{BRL.format(total)}</strong>
      </div>
      {desconto > 0 && (
        <div>
          <span>Cupom</span>
          <strong>− {BRL.format(desconto)}</strong>
        </div>
      )}
      <div className={styles.totalFinal}>
        <span>Total estimado</span>
        <strong>{BRL.format(Math.max(0, total - desconto))}</strong>
      </div>
    </div>
  );
}
