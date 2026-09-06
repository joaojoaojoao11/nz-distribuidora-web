// /painel/indique — link de afiliado, cupom e comissões.
//
// Mesma regra de antes: o código nasce no primeiro acesso (o endpoint cria se
// não existir) e a comissão só é apurada quando o pedido é FATURADO no ERP —
// não na venda. Falha de rede aqui não derruba a tela; ela só diz que não
// carregou.

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { BRL } from '../../lib/shop/precos';
import styles from './Painel.module.css';

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
  pedidos: { numero: number; status: string } | null;
}

const STATUS_COMISSAO: Record<string, string> = {
  pendente: 'Pendente',
  apurada: 'Apurada',
  paga: 'Paga',
  cancelada: 'Cancelada',
};

export default function PainelIndique() {
  const { user } = useAuth();
  const [afiliado, setAfiliado] = useState<Afiliado | null>(null);
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [totais, setTotais] = useState<{ pendente: number; apurada: number; paga: number } | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!user) return;
    let vivo = true;
    void (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        if (!token) return;
        const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
        const [a, c] = await Promise.all([
          fetch('/api/nz/afiliado', { method: 'POST', headers: h, body: JSON.stringify({ op: 'meu' }) }),
          fetch('/api/nz/afiliado', { method: 'POST', headers: h, body: JSON.stringify({ op: 'comissoes' }) }),
        ]);
        if (!vivo) return;
        if (a.ok) setAfiliado((await a.json()) as Afiliado);
        if (c.ok) {
          const j = (await c.json()) as { comissoes: Comissao[]; totais: { pendente: number; apurada: number; paga: number } };
          setComissoes(j.comissoes);
          setTotais(j.totais);
        }
      } catch {
        /* sem afiliado nesta carga */
      } finally {
        if (vivo) setCarregando(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [user]);

  if (carregando) return <p className={styles.mudo}>Carregando…</p>;

  if (!afiliado) {
    return (
      <p className={styles.mudo}>
        Não consegui carregar seu link de indicação agora. Atualize a página em instantes.
      </p>
    );
  }

  const link = `${window.location.origin}/loja?ref=${afiliado.codigo}`;

  return (
    <>
      <section className={styles.bloco}>
        <p className={styles.mudo}>
          Compartilhe seu link. Quem chegar por ele e comprar em até {afiliado.diasAtribuicao} dias gera{' '}
          <strong>{afiliado.percentual}%</strong> de comissão para você, apurada quando o pedido é faturado.
          {afiliado.cupom?.desconto_pct
            ? ` Seu cupom ${afiliado.codigo} dá ${afiliado.cupom.desconto_pct}% de desconto para quem usar.`
            : ''}
        </p>
        <div className={styles.linkBox}>
          <code className={styles.link}>{link}</code>
          <button
            type="button"
            className={styles.copiar}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link);
                setCopiado(true);
                setTimeout(() => setCopiado(false), 1800);
              } catch {
                /* área de transferência bloqueada: o texto continua selecionável */
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
      </section>

      <section className={styles.bloco}>
        <h2 className={styles.subtitulo}>Comissões</h2>
        {comissoes.length === 0 ? (
          <p className={styles.mudo}>
            Nenhuma indicação virou compra ainda. A comissão entra aqui quando o pedido de quem você
            indicou é faturado.
          </p>
        ) : (
          <ul className={styles.pedidos}>
            {comissoes.map((c) => (
              <li key={c.id} className={styles.pedido}>
                <span className={styles.pedidoNumero}>#{c.pedidos?.numero ?? '—'}</span>
                <span className={styles.pedidoStatus}>
                  {STATUS_COMISSAO[c.status] ?? c.status} · {c.percentual}% de {BRL.format(Number(c.base_valor))}
                </span>
                <span className={styles.pedidoData}>{new Date(c.criado_em).toLocaleDateString('pt-BR')}</span>
                <span className={styles.pedidoTotal}>{BRL.format(Number(c.valor))}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
