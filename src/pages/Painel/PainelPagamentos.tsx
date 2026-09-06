// /painel/pagamentos — o histórico de cobrança, com as ações que o cliente
// procura no dia seguinte: 2ª via do boleto, copiar o Pix de novo e o recibo.
//
// Nada disso é dado novo. A tabela `pagamentos` já guarda `boleto_url`,
// `linha_digitavel`, `pix_payload`, `invoice_url`, `recibo_url`, `cartao_final`
// e `vencimento` desde o checkout — só não existia tela que mostrasse. O Pix
// só aparece enquanto vale: um QR expirado copiado por engano vira suporte.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { BRL } from '../../lib/shop/precos';
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

export default function PainelPagamentos() {
  const { user } = useAuth();
  const [lista, setLista] = useState<Pagamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [copiado, setCopiado] = useState<string | null>(null);
  // Relógio preso ao carregamento da tela: `Date.now()` no meio do render é
  // função impura e torna o resultado instável entre redesenhos (regra do
  // React 19). Um Pix que vence com a página aberta some no próximo F5.
  const [agora] = useState(() => Date.now());

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

  const copiar = async (id: string, texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(id);
      setTimeout(() => setCopiado((c) => (c === id ? null : c)), 1800);
    } catch {
      /* área de transferência bloqueada: o texto continua selecionável */
    }
  };

  if (carregando) return <p className={styles.mudo}>Carregando…</p>;

  if (lista.length === 0) {
    return (
      <div className={styles.vazio}>
        <p className={styles.mudo}>
          Nenhuma cobrança ainda. Quando você fechar um pedido pagando pelo site, o Pix, o boleto e o
          recibo ficam guardados aqui.
        </p>
        <Link to="/loja" className={styles.botaoSecundario}>
          Ir para a loja
        </Link>
      </div>
    );
  }

  const data = (v: string | null) => (v ? new Date(v).toLocaleDateString('pt-BR') : null);

  return (
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
              <span className={styles.cartaoData}>{new Date(p.criado_em).toLocaleDateString('pt-BR')}</span>
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
  );
}
