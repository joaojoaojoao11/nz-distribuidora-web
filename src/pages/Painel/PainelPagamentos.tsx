// /painel/pagamentos — o que o cliente deve à NZ, o que já pagou e como pagar.
//
// Em cima, **Com a NZ**: as parcelas do sistema da NZ (boletos, carnês, Pix de
// balcão), em três blocos — vencidos, a vencer e pagos nos últimos 12 meses.
// Cada título tem vencimento, parcela, valor, pedido/NF e UMA ação:
//   · cobrança viva no Asaas → "Pagar" (abre a página do Asaas), o Pix
//     copia-e-cola enquanto vale e a 2ª via do boleto;
//   · em aberto, sem cobrança, dentro do prazo → "Gerar Pix/boleto" (o ERP emite);
//   · vencido sem cobrança, ou qualquer coisa que o site não resolve sozinho →
//     "Fale com a NZ" (cobrança nova não nasce vencida: regra do financeiro);
//   · em acordo ou cedido → "Combinado com a NZ", sem botão.
// Tom informativo (D9): "Vencido em dd/mm" e o botão bastam. Quem cobra é a NZ.
// Ao voltar o foco para a aba, consulta de novo: o cliente pode ter acabado de
// pagar no Asaas em outra janela e o webhook já baixou o título.
//
// Embaixo, **Cobranças do site**: o que nasceu no checkout — 2ª via do boleto,
// copiar o Pix de novo e o recibo. Nada disso é dado novo: a tabela
// `pagamentos` guarda tudo desde o checkout. O Pix só aparece enquanto vale.

import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { BRL } from '../../lib/shop/precos';
import { VENDAS, linkWhatsApp } from '../../lib/contatos';
import { carregarHistoricoErp, pagarTitulo, type BlocoTitulo, type TituloErp } from '../../lib/shop/historicoErp';
import { FORMA_LABEL, PAGAMENTO_LABEL, tomDoPagamento } from './pedidoRotulos';
import styles from './Painel.module.css';

interface Pagamento {
  id: string;
  forma: string | null;
  status: string | null;
  valor: number | null;
  parcelas: number | null;
  vencimento: string | null;
  expira_em: string | null;
  pix_payload: string | null;
  boleto_url: string | null;
  linha_digitavel: string | null;
  invoice_url: string | null;
  recibo_url: string | null;
  cartao_bandeira: string | null;
  cartao_final: string | null;
  pago_em: string | null;
  criado_em: string;
  pedidos: { numero: number } | null;
}

/** Data só (AAAA-MM-DD) é dia local: sem o T12 o navegador lê como UTC e mostra o dia anterior. */
const data = (v: string | null | undefined) => (v ? new Date(v.length === 10 ? `${v}T12:00:00` : v).toLocaleDateString('pt-BR') : null);

const BLOCOS: { chave: BlocoTitulo; titulo: string; sub: string }[] = [
  { chave: 'vencido', titulo: 'Vencidos', sub: 'O vencimento já passou' },
  { chave: 'a_vencer', titulo: 'A vencer', sub: 'Em aberto, dentro do prazo' },
  { chave: 'pago', titulo: 'Pagos', sub: 'Últimos 12 meses' },
];

const PAGOS_DE_CARA = 5;

export default function PainelPagamentos() {
  const { user } = useAuth();
  const [lista, setLista] = useState<Pagamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [copiado, setCopiado] = useState<string | null>(null);
  // Relógio preso ao carregamento da tela: `Date.now()` no meio do render é
  // função impura e torna o resultado instável entre redesenhos (regra do
  // React 19). Um Pix que vence com a página aberta some no próximo F5.
  const [agora] = useState(() => Date.now());
  const [titulos, setTitulos] = useState<TituloErp[]>([]);
  const [vinculado, setVinculado] = useState(false);
  const [carregandoNz, setCarregandoNz] = useState(true);
  const [gerando, setGerando] = useState<string | null>(null);
  const [avisos, setAvisos] = useState<Record<string, string>>({});
  const [todosPagos, setTodosPagos] = useState(false);

  useEffect(() => {
    if (!user) return;
    let vivo = true;
    void supabase
      .from('pagamentos')
      .select(
        'id, forma, status, valor, parcelas, vencimento, expira_em, pix_payload, boleto_url, linha_digitavel, invoice_url, recibo_url, cartao_bandeira, cartao_final, pago_em, criado_em, pedidos(numero)'
      )
      .order('criado_em', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (!vivo) return;
        setLista((data ?? []) as unknown as Pagamento[]);
        setCarregando(false);
      });
    return () => {
      vivo = false;
    };
  }, [user]);

  // As parcelas do NZERP vêm por fora: atravessam duas bases e não podem
  // segurar o desenho das cobranças do site. Ao voltar o foco para a aba,
  // consulta de novo (o cliente pode ter acabado de pagar no Asaas).
  useEffect(() => {
    let vivo = true;
    const buscar = (fresco: boolean) =>
      carregarHistoricoErp(user?.id, { fresco }).then((h) => {
        if (!vivo) return;
        setTitulos(h.titulos);
        setVinculado(h.vinculado);
        setCarregandoNz(false);
      });
    void buscar(false);
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') void buscar(true);
    };
    document.addEventListener('visibilitychange', aoVoltar);
    return () => {
      vivo = false;
      document.removeEventListener('visibilitychange', aoVoltar);
    };
  }, [user?.id]);

  const copiar = async (id: string, texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(id);
      setTimeout(() => setCopiado((c) => (c === id ? null : c)), 1800);
    } catch {
      /* área de transferência bloqueada: o texto continua selecionável */
    }
  };

  const gerar = async (t: TituloErp) => {
    setGerando(t.id);
    setAvisos((a) => ({ ...a, [t.id]: '' }));
    const r = await pagarTitulo(t.id);
    if (r.ok) {
      setTitulos((l) => l.map((x) => (x.id === t.id ? r.titulo : x)));
      if (r.titulo.faturaUrl) window.open(r.titulo.faturaUrl, '_blank', 'noopener');
    } else {
      setAvisos((a) => ({ ...a, [t.id]: r.mensagem }));
    }
    setGerando(null);
  };

  if (carregando) return <p className={styles.mudo}>Carregando…</p>;

  const temNz = titulos.length > 0;

  if (lista.length === 0 && !temNz) {
    return (
      <div className={styles.vazio}>
        <p className={styles.mudo}>
          {carregandoNz
            ? 'Buscando suas parcelas na NZ…'
            : vinculado
              ? 'Nenhuma parcela em aberto com a NZ e nenhuma cobrança do site ainda. Quando você fechar um pedido pagando pelo site, o Pix, o boleto e o recibo ficam guardados aqui.'
              : 'Nenhuma cobrança ainda. Quando você fechar um pedido pagando pelo site, o Pix, o boleto e o recibo ficam guardados aqui.'}
        </p>
        <Link to="/loja" className={styles.botaoSecundario}>
          Ir para a loja
        </Link>
      </div>
    );
  }

  return (
    <>
      {temNz && (
        <>
          <h3 className={styles.secaoTitulo}>
            Com a NZ
            <small>Parcelas do sistema da NZ — boletos, carnês e Pix de balcão</small>
          </h3>
          {BLOCOS.map((b) => {
            const itens = titulos.filter((t) => t.bloco === b.chave);
            if (!itens.length) return null;
            const visiveis = b.chave === 'pago' && !todosPagos ? itens.slice(0, PAGOS_DE_CARA) : itens;
            const soma = itens.reduce((s, t) => s + (b.chave === 'pago' ? (t.valorPago ?? t.valor ?? 0) : (t.saldo ?? t.valor ?? 0)), 0);
            return (
              <section key={b.chave} className={styles.blocoTitulos}>
                <h4 className={styles.blocoTitulo}>
                  {b.titulo}
                  <span>
                    {itens.length} · {BRL.format(soma)}
                  </span>
                  <small>{b.sub}</small>
                </h4>
                <ul className={styles.cartoes}>
                  {visiveis.map((t) => (
                    <CartaoTitulo
                      key={t.id}
                      t={t}
                      agora={agora}
                      copiado={copiado}
                      copiar={copiar}
                      gerando={gerando === t.id}
                      aviso={avisos[t.id]}
                      onGerar={() => void gerar(t)}
                    />
                  ))}
                </ul>
                {b.chave === 'pago' && itens.length > PAGOS_DE_CARA && (
                  <button type="button" className={styles.botaoSecundario} onClick={() => setTodosPagos((v) => !v)}>
                    {todosPagos ? 'Mostrar menos' : `Ver todos os ${itens.length} pagos`}
                  </button>
                )}
              </section>
            );
          })}
        </>
      )}

      {lista.length > 0 && (
        <>
          {temNz && (
            <h3 className={styles.secaoTitulo}>
              Cobranças do site
              <small>O que nasceu no checkout da loja</small>
            </h3>
          )}
          <ul className={styles.cartoes}>
            {lista.map((p) => {
              const tom = tomDoPagamento(p.status);
              // Pix vencido não é oferecido: copiar um QR morto vira chamado.
              const pixVivo = Boolean(p.pix_payload) && (!p.expira_em || new Date(p.expira_em).getTime() > agora);
              return (
                <li key={p.id} className={styles.cartaoPedido}>
                  <div className={styles.cartaoTopo}>
                    {p.pedidos?.numero ? (
                      <Link to={`/painel/pedido/${p.pedidos.numero}`} className={styles.cartaoNumero}>
                        Pedido #{p.pedidos.numero}
                      </Link>
                    ) : (
                      <span className={styles.cartaoNumero}>Cobrança</span>
                    )}
                    <span className={styles.cartaoData}>{data(p.criado_em)}</span>
                  </div>

                  <div className={styles.cartaoStatus}>
                    {tom && (
                      <span
                        className={`${styles.pagChip} ${tom === 'ok' ? styles.pagOk : tom === 'pendente' ? styles.pagPendente : styles.pagRuim}`}
                      >
                        {PAGAMENTO_LABEL[p.status!] ?? p.status}
                      </span>
                    )}
                    <span>
                      {FORMA_LABEL[p.forma ?? ''] ?? p.forma ?? '—'}
                      {p.parcelas && p.parcelas > 1 ? ` · ${p.parcelas}x` : ''}
                      {p.cartao_final ? ` · ${p.cartao_bandeira ?? 'cartão'} final ${p.cartao_final}` : ''}
                      {p.vencimento && !p.pago_em ? ` · vence ${data(p.vencimento)}` : ''}
                      {p.pago_em ? ` · pago em ${data(p.pago_em)}` : ''}
                    </span>
                  </div>

                  <div className={styles.cartaoRodape}>
                    <span className={styles.cartaoTotal}>{p.valor != null ? BRL.format(Number(p.valor)) : '—'}</span>
                    <div className={styles.cartaoAcoes}>
                      {pixVivo && (
                        <button type="button" className={styles.botaoSecundario} onClick={() => void copiar(p.id, p.pix_payload!)}>
                          {copiado === p.id ? 'Copiado' : 'Copiar Pix'}
                        </button>
                      )}
                      {p.linha_digitavel && (
                        <button
                          type="button"
                          className={styles.botaoSecundario}
                          onClick={() => void copiar(`${p.id}-lin`, p.linha_digitavel!)}
                        >
                          {copiado === `${p.id}-lin` ? 'Copiada' : 'Copiar linha digitável'}
                        </button>
                      )}
                      {p.boleto_url && (
                        <a className={styles.botaoSecundario} href={p.boleto_url} target="_blank" rel="noopener noreferrer">
                          2ª via do boleto
                        </a>
                      )}
                      {p.recibo_url && (
                        <a className={styles.botaoSecundario} href={p.recibo_url} target="_blank" rel="noopener noreferrer">
                          Recibo
                        </a>
                      )}
                      {!p.recibo_url && p.invoice_url && (
                        <a className={styles.botaoSecundario} href={p.invoice_url} target="_blank" rel="noopener noreferrer">
                          Ver cobrança
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}

/** Um título da NZ: vencimento, parcela, valor, pedido/NF e a ação que cabe (D7). */
function CartaoTitulo({
  t,
  agora,
  copiado,
  copiar,
  gerando,
  aviso,
  onGerar,
}: {
  t: TituloErp;
  agora: number;
  copiado: string | null;
  copiar: (id: string, texto: string) => Promise<void>;
  gerando: boolean;
  aviso?: string;
  onGerar: () => void;
}) {
  const pixVivo = Boolean(t.pixPayload) && (!t.pixExpira || new Date(t.pixExpira).getTime() > agora);
  const pagarUrl = t.faturaUrl ?? t.boletoUrl;
  const falar = linkWhatsApp(
    VENDAS[0],
    `Olá! Sou cliente da NZ e quero combinar o pagamento do documento ${t.documento ?? ''}${t.vencimento ? ` (vencimento ${data(t.vencimento)})` : ''}.`
  );
  const chip =
    t.bloco === 'pago'
      ? { cls: styles.pagOk, txt: `Pago${t.pagoEm ? ` em ${data(t.pagoEm)}` : ''}` }
      : t.bloco === 'vencido'
        ? { cls: styles.pagRuim, txt: `Vencido em ${data(t.vencimento)}` }
        : { cls: styles.pagPendente, txt: `Vence ${data(t.vencimento) ?? '—'}` };
  const parcial = t.status === 'parcial' && t.saldo != null && t.valor != null && t.saldo < t.valor;
  const detalhes = [
    parcial ? 'pago em parte' : '',
    t.orcamento ? `Pedido #${t.orcamento}` : '',
    t.notaFiscal ? `NF ${t.notaFiscal}` : '',
    t.forma ? (FORMA_LABEL[t.forma.toLowerCase()] ?? t.forma) : '',
  ].filter(Boolean);

  let acoes: ReactNode;
  if (t.bloco === 'pago') {
    acoes = t.faturaUrl ? (
      <a className={styles.botaoSecundario} href={t.faturaUrl} target="_blank" rel="noopener noreferrer">
        Ver cobrança
      </a>
    ) : null;
  } else if (t.combinado) {
    acoes = <span className={styles.combinado}>Combinado com a NZ</span>;
  } else if (t.cobrancaViva && pagarUrl) {
    acoes = (
      <>
        <a className={styles.botaoPrincipal} href={pagarUrl} target="_blank" rel="noopener noreferrer">
          Pagar
        </a>
        {pixVivo && (
          <button type="button" className={styles.botaoSecundario} onClick={() => void copiar(t.id, t.pixPayload!)}>
            {copiado === t.id ? 'Copiado' : 'Copiar Pix'}
          </button>
        )}
        {t.boletoUrl && (
          <a className={styles.botaoSecundario} href={t.boletoUrl} target="_blank" rel="noopener noreferrer">
            2ª via do boleto
          </a>
        )}
      </>
    );
  } else if (t.pagavel && !t.vencido) {
    acoes = (
      <button type="button" className={styles.botaoPrincipal} disabled={gerando} onClick={onGerar}>
        {gerando ? 'Gerando…' : 'Gerar Pix/boleto'}
      </button>
    );
  } else {
    acoes = (
      <a className={styles.botaoSecundario} href={falar} target="_blank" rel="noopener noreferrer">
        Fale com a NZ
      </a>
    );
  }

  return (
    <li className={styles.cartaoPedido}>
      <div className={styles.cartaoTopo}>
        <span className={styles.cartaoNumero}>
          {t.documento ? `Documento ${t.documento}` : 'Parcela'}
          {t.parcela ? ` · ${t.parcela}` : ''}
          <span className={styles.selo}>NZ</span>
        </span>
        <span className={styles.cartaoData}>{data(t.vencimento) ?? '—'}</span>
      </div>

      <div className={styles.cartaoStatus}>
        <span className={`${styles.pagChip} ${chip.cls}`}>{chip.txt}</span>
        <span>{detalhes.join(' · ')}</span>
      </div>

      <div className={styles.cartaoRodape}>
        <span className={styles.cartaoTotal}>
          {parcial ? (
            <>
              {BRL.format(t.saldo!)} <small>de {BRL.format(t.valor!)}</small>
            </>
          ) : t.bloco === 'pago' && t.valorPago != null ? (
            BRL.format(t.valorPago)
          ) : t.valor != null ? (
            BRL.format(t.valor)
          ) : (
            '—'
          )}
        </span>
        <div className={styles.cartaoAcoes}>{acoes}</div>
      </div>
      {aviso && <p className={styles.avisoTitulo}>{aviso}</p>}
    </li>
  );
}
