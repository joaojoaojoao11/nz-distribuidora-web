// /checkout — fechar o pedido com pagamento online (Pix, cartão, boleto).
//
// Uma página, quatro blocos: entrega (endereço + opções de frete com valor),
// pagamento (abas), revisão (aceite) e o resumo com o botão "Pagar". No
// desktop o resumo fica fixo à direita; no celular vira uma barra fixa no
// rodapé com o total e o botão, e os blocos empilham.
//
// Tudo que é valor vem de /api/nz/checkout (op resumo): subtotal, desconto,
// frete e parcelas. A página só escolhe. Ao pagar, o servidor recalcula tudo
// de novo — o que aparece aqui é para o cliente decidir, não para cobrar.
//
// O endereço é salvo no cadastro (user_profiles, RLS de dono) antes de pagar:
// é o endereço que o ERP fatura e que o cartão usa como cobrança.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { visitanteId } from '../../lib/afiliado';
import { formatarCpfCnpj, somenteDigitos, tipoDocumento, validarCpfCnpj } from '../../lib/documento';
import { limparCarrinho, useCarrinho } from '../../lib/shop/carrinho';
import { BRL } from '../../lib/shop/precos';
import {
  buscarCep,
  cartaoParaEnvio,
  chamarCheckout,
  formatarCep,
  textoDoErro,
  CheckoutError,
  CARTAO_VAZIO,
  errosDoCartao,
  type Resumo,
} from '../../lib/shop/checkout';
import FormaPagamento, { type EscolhaPagamento } from './FormaPagamento';
import styles from './Checkout.module.css';

interface Endereco {
  full_name: string;
  phone: string;
  cpf_cnpj: string;
  company_name: string;
  ie: string;
  address_zip: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
}

const VAZIO: Endereco = {
  full_name: '',
  phone: '',
  cpf_cnpj: '',
  company_name: '',
  ie: '',
  address_zip: '',
  address_street: '',
  address_number: '',
  address_complement: '',
  address_neighborhood: '',
  address_city: '',
  address_state: '',
};

export default function Checkout() {
  const { user, profile, loading, isApproved, isAdmin } = useAuth();
  const itens = useCarrinho();
  const navigate = useNavigate();

  const [end, setEnd] = useState<Endereco>(VAZIO);
  const [endCarregado, setEndCarregado] = useState(false);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [resumoErro, setResumoErro] = useState('');
  const [cotando, setCotando] = useState(false);
  const [cupom, setCupom] = useState('');
  const [freteId, setFreteId] = useState('');
  const [pag, setPag] = useState<EscolhaPagamento>({ forma: 'PIX', parcelas: 1, cartao: CARTAO_VAZIO });
  const [aceite, setAceite] = useState(false);
  const [obs, setObs] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const cepBusca = useRef<AbortController | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ------------------------------------------------------------ cadastro
  useEffect(() => {
    if (!user) return;
    void supabase
      .from('user_profiles')
      .select('full_name, phone, cpf_cnpj, company_name, ie, address_zip, address_street, address_number, address_complement, address_neighborhood, address_city, address_state')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const p = (data ?? {}) as Partial<Endereco>;
        const limpo = { ...VAZIO };
        for (const k of Object.keys(VAZIO) as (keyof Endereco)[]) limpo[k] = p[k] ?? '';
        limpo.address_zip = formatarCep(limpo.address_zip);
        setEnd(limpo);
        setEndCarregado(true);
      });
  }, [user]);

  // -------------------------------------------------------------- resumo
  const itensEnvio = useMemo(() => itens.map((i) => ({ slug: i.slug, qtd: i.qtd, unidade: i.unidade, lpns: i.lpns })), [itens]);
  const cepDigits = end.address_zip.replace(/\D/g, '');

  const carregarResumo = useCallback(
    async (cupomCodigo: string) => {
      if (!itensEnvio.length || !endCarregado) return;
      setCotando(true);
      setResumoErro('');
      try {
        const r = await chamarCheckout<Resumo>({ op: 'resumo', itens: itensEnvio, cupom: cupomCodigo, cep: cepDigits });
        setResumo(r);
      } catch (e) {
        setResumoErro(textoDoErro(e));
      } finally {
        setCotando(false);
      }
    },
    [itensEnvio, endCarregado, cepDigits]
  );

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => void carregarResumo(cupom.trim().toUpperCase()), 350);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
    // O cupom entra só quando o usuário clica "Aplicar"; aqui reage a itens/CEP.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregarResumo]);

  // Frete escolhido some da lista (CEP mudou)? Escolhe o primeiro.
  useEffect(() => {
    if (!resumo) return;
    if (!resumo.fretes.some((f) => f.id === freteId)) {
      setFreteId(resumo.fretes[0]?.id ?? '');
    }
  }, [resumo, freteId]);

  const set = (k: keyof Endereco) => (e: React.ChangeEvent<HTMLInputElement>) => setEnd((p) => ({ ...p, [k]: e.target.value }));

  const mudarCep = (bruto: string) => {
    const cep = formatarCep(bruto);
    setEnd((p) => ({ ...p, address_zip: cep }));
    if (cepBusca.current) cepBusca.current.abort();
    const d = cep.replace(/\D/g, '');
    if (d.length !== 8) return;
    const ctrl = new AbortController();
    cepBusca.current = ctrl;
    void buscarCep(d, ctrl.signal).then((r) => {
      if (!r || ctrl.signal.aborted) return;
      setEnd((p) => ({
        ...p,
        address_street: r.logradouro || p.address_street,
        address_neighborhood: r.bairro || p.address_neighborhood,
        address_city: r.localidade,
        address_state: r.uf,
      }));
    });
  };

  // ------------------------------------------------------------- totais
  const frete = resumo?.fretes.find((f) => f.id === freteId) ?? null;
  const totalSemFrete = resumo ? Math.max(0, resumo.subtotal - resumo.desconto) : 0;
  const total = Math.round((totalSemFrete + (frete?.valor ?? 0)) * 100) / 100;
  const parcelas = useMemo(() => {
    // O servidor calcula as parcelas sobre itens − cupom; com o frete o valor
    // muda um pouco. Recalcula aqui só para exibir; o servidor valida ao pagar.
    if (!resumo) return [{ n: 1, valor: total }];
    const lista: { n: number; valor: number }[] = [];
    for (let n = 1; n <= resumo.config.cartaoMaxParcelas; n++) {
      const v = Math.round((total / n) * 100) / 100;
      if (n > 1 && v < resumo.config.cartaoParcelaMinima) break;
      lista.push({ n, valor: v });
    }
    return lista;
  }, [resumo, total]);

  const lojista = profile?.role === 'reseller';
  const enderecoOk =
    end.full_name.trim().length >= 3 &&
    somenteDigitos(end.phone).length >= 10 &&
    validarCpfCnpj(end.cpf_cnpj) &&
    (!lojista || tipoDocumento(end.cpf_cnpj) === 'cnpj') &&
    cepDigits.length === 8 &&
    end.address_street.trim() &&
    end.address_number.trim() &&
    end.address_city.trim() &&
    end.address_state.trim().length === 2;
  const cartaoOk = pag.forma !== 'CREDIT_CARD' || Object.keys(errosDoCartao(pag.cartao)).length === 0;
  const podePagar = Boolean(resumo && !resumo.invalidos.length && frete && enderecoOk && cartaoOk && aceite && !enviando && !cotando && total > 0);

  // -------------------------------------------------------------- pagar
  const salvarEndereco = async () => {
    if (!user) return;
    const patch: Record<string, string | null> = {
      full_name: end.full_name.trim(),
      phone: end.phone.trim(),
      cpf_cnpj: somenteDigitos(end.cpf_cnpj),
      company_name: end.company_name.trim() || null,
      ie: end.ie.trim() || null,
      address_zip: cepDigits,
      address_street: end.address_street.trim(),
      address_number: end.address_number.trim(),
      address_complement: end.address_complement.trim() || null,
      address_neighborhood: end.address_neighborhood.trim() || null,
      address_city: end.address_city.trim(),
      address_state: end.address_state.trim().toUpperCase(),
    };
    const { error } = await supabase.from('user_profiles').update(patch).eq('id', user.id);
    if (error) throw new Error(`Não consegui salvar o endereço: ${error.message}`);
  };

  const pagar = async () => {
    if (!podePagar || !frete) return;
    setErro('');
    setEnviando(true);
    try {
      await salvarEndereco();
      const r = await chamarCheckout<{ ok: true; numero: number }>({
        op: 'pagar',
        itens: itensEnvio,
        cupom: resumo?.cupom.codigo ?? '',
        freteId: frete.id,
        forma: pag.forma,
        parcelas: pag.forma === 'CREDIT_CARD' ? pag.parcelas : 1,
        cartao: pag.forma === 'CREDIT_CARD' ? cartaoParaEnvio(pag.cartao) : undefined,
        aceite: true,
        observacoes: obs,
        visitante: visitanteId(),
      });
      limparCarrinho();
      navigate(`/painel/pedido/${r.numero}`, { replace: true, state: { recemCriado: true } });
    } catch (e) {
      if (e instanceof CheckoutError && e.codigo === 'frete-indisponivel') {
        void carregarResumo(cupom.trim().toUpperCase());
      }
      if (e instanceof CheckoutError && e.codigo === 'cadastro-incompleto') {
        setErro(`Falta no cadastro: ${((e.extra.faltando as string[]) ?? []).join(', ')}.`);
      } else setErro(textoDoErro(e));
    } finally {
      setEnviando(false);
    }
  };

  // -------------------------------------------------------------- gates
  if (loading) return null;
  if (!user) return <Navigate to="/login?next=/checkout" replace />;
  if (!isApproved && !isAdmin) {
    return (
      <div className={`container ${styles.pagina}`}>
        <h1 className={styles.titulo}>Checkout</h1>
        <p className={styles.mudo}>Seu cadastro está em análise. Assim que for aprovado, você paga por aqui.</p>
      </div>
    );
  }
  if (!itens.length) {
    return (
      <div className={`container ${styles.pagina}`}>
        <h1 className={styles.titulo}>Checkout</h1>
        <p className={styles.mudo}>
          O carrinho está vazio. <Link to="/loja">Ir para a loja</Link>
        </p>
      </div>
    );
  }
  if (resumo && !resumo.checkoutAtivo && !isAdmin) {
    return (
      <div className={`container ${styles.pagina}`}>
        <h1 className={styles.titulo}>Checkout</h1>
        <p className={styles.mudo}>
          O pagamento online ainda não está aberto. <Link to="/carrinho">Envie o pedido pelo carrinho</Link> e o vendedor fecha com você.
        </p>
      </div>
    );
  }

  return (
    <div className={`container ${styles.pagina}`}>
      <h1 className={styles.titulo}>Checkout</h1>

      <div className={styles.layout}>
        <div className={styles.passos}>
          {/* ------------------------------------------------- 1. entrega */}
          <section className={styles.bloco}>
            <h2 className={styles.subtitulo}>
              <span className={styles.num}>1</span> Entrega
            </h2>
            <div className={styles.form}>
              <label className={styles.campo}>
                <span>Nome completo</span>
                <input value={end.full_name} onChange={set('full_name')} autoComplete="name" />
              </label>
              <label className={styles.campo}>
                <span>WhatsApp</span>
                <input value={end.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" placeholder="(11) 99999-9999" />
              </label>
              <label className={styles.campo}>
                <span>{lojista ? 'CNPJ' : 'CPF ou CNPJ'}</span>
                <input value={formatarCpfCnpj(end.cpf_cnpj)} onChange={set('cpf_cnpj')} inputMode="numeric" />
              </label>
              {(lojista || tipoDocumento(end.cpf_cnpj) === 'cnpj') && (
                <>
                  <label className={styles.campo}>
                    <span>Razão social</span>
                    <input value={end.company_name} onChange={set('company_name')} autoComplete="organization" />
                  </label>
                  <label className={styles.campo}>
                    <span>Inscrição estadual</span>
                    <input value={end.ie} onChange={set('ie')} placeholder="ou ISENTO" />
                  </label>
                </>
              )}
              <label className={styles.campo}>
                <span>CEP</span>
                <input value={end.address_zip} onChange={(e) => mudarCep(e.target.value)} inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" maxLength={9} />
              </label>
              <label className={`${styles.campo} ${styles.campoLargo}`}>
                <span>Rua</span>
                <input value={end.address_street} onChange={set('address_street')} autoComplete="address-line1" />
              </label>
              <label className={styles.campo}>
                <span>Número</span>
                <input value={end.address_number} onChange={set('address_number')} />
              </label>
              <label className={styles.campo}>
                <span>Complemento</span>
                <input value={end.address_complement} onChange={set('address_complement')} autoComplete="address-line2" />
              </label>
              <label className={styles.campo}>
                <span>Bairro</span>
                <input value={end.address_neighborhood} onChange={set('address_neighborhood')} />
              </label>
              <label className={styles.campo}>
                <span>Cidade</span>
                <input value={end.address_city} onChange={set('address_city')} autoComplete="address-level2" />
              </label>
              <label className={styles.campo}>
                <span>UF</span>
                <input value={end.address_state} onChange={set('address_state')} maxLength={2} autoComplete="address-level1" />
              </label>
            </div>

            <h3 className={styles.subsub}>Como você quer receber</h3>
            {cepDigits.length !== 8 ? (
              <p className={styles.mudo}>Informe o CEP para ver as opções de entrega.</p>
            ) : cotando && !resumo ? (
              <p className={styles.mudo}>Calculando o frete…</p>
            ) : resumoErro ? (
              <p className={styles.erro}>{resumoErro}</p>
            ) : !resumo?.fretes.length ? (
              <p className={styles.erro}>
                Não conseguimos cotar a entrega para este CEP agora.
                {resumo?.freteSemPerfil.length ? ` Itens sem cadastro de embalagem: ${resumo.freteSemPerfil.join(', ')}.` : ''}
              </p>
            ) : (
              <ul className={styles.fretes}>
                {resumo.fretes.map((f) => (
                  <li key={f.id}>
                    <label className={`${styles.frete} ${freteId === f.id ? styles.freteAtivo : ''}`}>
                      <input type="radio" name="frete" value={f.id} checked={freteId === f.id} onChange={() => setFreteId(f.id)} />
                      <span className={styles.freteNome}>
                        {f.nome}
                        {f.retirada && resumo.config.retiradaEndereco ? <small>{resumo.config.retiradaEndereco}</small> : null}
                      </span>
                      <span className={styles.fretePrazo}>{f.retirada ? 'a combinar' : `${f.dias} ${f.dias === 1 ? 'dia útil' : 'dias úteis'}`}</span>
                      <span className={styles.freteValor}>{f.valor === 0 ? 'grátis' : BRL.format(f.valor)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            {cotando && resumo && <p className={styles.mudoPequeno}>Atualizando…</p>}
          </section>

          {/* ---------------------------------------------- 2. pagamento */}
          <section className={styles.bloco}>
            <h2 className={styles.subtitulo}>
              <span className={styles.num}>2</span> Pagamento
            </h2>
            <FormaPagamento
              valor={pag}
              onChange={setPag}
              parcelas={parcelas}
              total={total}
              pixExpiraMin={resumo?.config.pixExpiraMin ?? 30}
              boletoVencimentoDias={resumo?.config.boletoVencimentoDias ?? 3}
              boletoMinimo={resumo?.config.boletoMinimo ?? 0}
              cpfPadrao={somenteDigitos(end.cpf_cnpj)}
              desabilitado={enviando}
            />
          </section>

          {/* ------------------------------------------------ 3. revisão */}
          <section className={styles.bloco}>
            <h2 className={styles.subtitulo}>
              <span className={styles.num}>3</span> Revisão
            </h2>
            <label className={styles.campo}>
              <span>Observações (opcional)</span>
              <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} maxLength={1000} />
            </label>
            <label className={styles.aceite}>
              <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} />
              <span>
                Li e aceito os <Link to="/termos" target="_blank">termos de compra</Link>. Confirmo que o endereço acima está correto.
              </span>
            </label>
            {erro && <p className={styles.erro}>{erro}</p>}
          </section>
        </div>

        {/* ------------------------------------------------------ resumo */}
        <aside className={styles.resumo}>
          <h2 className={styles.subtitulo}>Resumo</h2>
          <ul className={styles.itens}>
            {(resumo?.itens ?? itens.map((i) => ({ slug: i.slug, nome: i.nome, unidade: i.unidade, qtd: i.qtd, unit: 0, total: 0, metragem: null }))).map((i) => (
              <li key={`${i.slug}|${i.unidade}`}>
                <span className={styles.itemNome}>
                  {i.nome}
                  <small>
                    {i.qtd} {i.unidade === 'rolo' ? (i.qtd === 1 ? 'rolo fechado' : 'rolos fechados') : 'm'}
                  </small>
                </span>
                <span>{i.total ? BRL.format(i.total) : '—'}</span>
              </li>
            ))}
          </ul>
          {resumo?.invalidos.length ? <p className={styles.erro}>Indisponíveis: {resumo.invalidos.join(', ')}. Remova do carrinho.</p> : null}

          <div className={styles.cupom}>
            <input value={cupom} onChange={(e) => setCupom(e.target.value.toUpperCase())} placeholder="Cupom" aria-label="Cupom" />
            <button type="button" onClick={() => void carregarResumo(cupom.trim().toUpperCase())} disabled={cotando}>
              Aplicar
            </button>
          </div>
          {resumo?.cupom.invalido && <p className={styles.erro}>Cupom inválido.</p>}
          {resumo?.cupom.codigo && <p className={styles.ok}>Cupom {resumo.cupom.codigo} aplicado.</p>}

          <div className={styles.totais}>
            <div>
              <span>Itens</span>
              <strong>{resumo ? BRL.format(resumo.subtotal) : '…'}</strong>
            </div>
            {resumo && resumo.desconto > 0 && (
              <div>
                <span>Cupom</span>
                <strong>− {BRL.format(resumo.desconto)}</strong>
              </div>
            )}
            <div>
              <span>Entrega</span>
              <strong>{frete ? (frete.valor === 0 ? 'grátis' : BRL.format(frete.valor)) : '—'}</strong>
            </div>
            <div className={styles.totalFinal}>
              <span>Total</span>
              <strong>{resumo ? BRL.format(total) : '…'}</strong>
            </div>
            {pag.forma === 'CREDIT_CARD' && pag.parcelas > 1 && (
              <p className={styles.mudoPequeno}>
                {pag.parcelas}x de {BRL.format(parcelas.find((p) => p.n === pag.parcelas)?.valor ?? total / pag.parcelas)} sem juros
              </p>
            )}
          </div>

          <button type="button" className={styles.pagar} onClick={pagar} disabled={!podePagar}>
            {enviando ? 'Processando…' : pag.forma === 'PIX' ? `Gerar Pix de ${BRL.format(total)}` : pag.forma === 'BOLETO' ? `Gerar boleto de ${BRL.format(total)}` : `Pagar ${BRL.format(total)}`}
          </button>
          {!podePagar && !enviando && (
            <p className={styles.mudoPequeno}>
              {!enderecoOk ? 'Complete o endereço e o documento.' : !frete ? 'Escolha a entrega.' : !cartaoOk ? 'Confira os dados do cartão.' : !aceite ? 'Aceite os termos.' : ''}
            </p>
          )}
          <Link to="/carrinho" className={styles.voltar}>
            Voltar ao carrinho
          </Link>
        </aside>
      </div>

      {/* Celular: total e botão sempre à mão. */}
      <div className={styles.barra}>
        <div>
          <span className={styles.barraRotulo}>Total</span>
          <strong>{resumo ? BRL.format(total) : '…'}</strong>
        </div>
        <button type="button" className={styles.pagar} onClick={pagar} disabled={!podePagar}>
          {enviando ? 'Processando…' : pag.forma === 'PIX' ? 'Gerar Pix' : pag.forma === 'BOLETO' ? 'Gerar boleto' : 'Pagar'}
        </button>
      </div>
    </div>
  );
}
