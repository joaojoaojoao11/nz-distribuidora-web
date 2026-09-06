// Bloco de disponibilidade da página de produto.
//
// O que aparece depende do PAPEL, e o papel é decidido no servidor
// (_lib/handlers/estoque.ts), nunca aqui. Este componente só desenha o que recebe —
// se ele tentasse decidir, bastaria abrir o DevTools para ver o dado do nível
// de cima.
//
// Some inteiro quando: o item não está mapeado para um SKU do ERP, o espelho
// ainda não tem esse SKU, ou a API está fora do ar (503 do devApiStub em
// `npm run dev`). Melhor não dizer nada do que dizer errado sobre estoque.

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './Disponibilidade.module.css';

type Nivel = 'pronta-entrega' | 'ultimas-unidades' | 'sob-encomenda';

interface Lpn {
  lpn: string;
  quant_ml: number;
  status_rolo: string;
  lote: string | null;
  coluna: string | null;
  prateleira: string | null;
  caixa: string | null;
  empresa_id: string | null;
}

interface Resposta {
  mapeado: boolean;
  semDados?: boolean;
  papel: 'anonimo' | 'client' | 'reseller' | 'admin';
  disponibilidade?: Nivel;
  atualizadoEm?: string;
  saldo?: {
    metrosLineares: number;
    rolosFechados: number;
    rolosAbertos: number;
    larguraM: number | null;
    metragemPadrao: number | null;
  };
  lpns?: Lpn[] | { erro: string };
  estoqueMinimo?: number | null;
  /** Só admin: o mesmo rótulo da tabela de preço do ERP. */
  rotuloErp?: 'ESTOQUE' | 'DROP';
  erpSku?: string;
}

const ROTULO: Record<Nivel, string> = {
  'pronta-entrega': 'Pronta entrega · SP',
  'ultimas-unidades': 'Últimas unidades',
  'sob-encomenda': 'Sob encomenda',
};

export default function Disponibilidade({ slug, nome }: { slug: string; nome?: string }) {
  const [dados, setDados] = useState<Resposta | null>(null);
  // Seleção do admin nos botões "comprar de uma vez": N rolos fechados e/ou
  // pontas específicas. Vira o texto do pedido no WhatsApp até o carrinho
  // (Fase 7) existir.
  const [fechados, setFechados] = useState(0);
  const [pontas, setPontas] = useState<string[]>([]);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;

        const res = await fetch('/api/nz/estoque', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ slug }),
        });
        if (!res.ok) return;
        const json = (await res.json()) as Resposta;
        if (!cancelado) setDados(json);
      } catch {
        // API indisponível: o bloco não renderiza. Silencioso de propósito.
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [slug]);

  const lpnsOk = Array.isArray(dados?.lpns) ? dados.lpns : [];
  const rolosFechados = lpnsOk.filter((l) => l.status_rolo === 'ROLO FECHADO');
  const rolosAbertos = lpnsOk.filter((l) => l.status_rolo === 'ROLO ABERTO');

  if (!dados?.mapeado || dados.semDados || !dados.disponibilidade) return null;

  const nivel = dados.disponibilidade;
  const metrosFechado = rolosFechados[0]?.quant_ml ?? dados.saldo?.metragemPadrao ?? 0;
  const pedidoTexto = (() => {
    const partes: string[] = [];
    if (fechados > 0) partes.push(`${fechados} rolo(s) fechado(s) de ${metrosFechado} m`);
    for (const lpn of pontas) {
      const l = rolosAbertos.find((r) => r.lpn === lpn);
      if (l) partes.push(`ponta ${l.lpn} (${formatarMetros(l.quant_ml)})`);
    }
    if (!partes.length) return null;
    return `Pedido interno — ${nome ?? slug}${dados.erpSku ? ` (${dados.erpSku})` : ''}: ${partes.join(' + ')}.`;
  })();

  return (
    <section className={styles.block} aria-labelledby="disp-titulo">
      <h2 id="disp-titulo" className={styles.title}>
        Disponibilidade
      </h2>

      <span className={`${styles.badge} ${styles[nivel]}`}>{ROTULO[nivel]}</span>
      {dados.rotuloErp && (
        <span
          className={`${styles.badge} ${dados.rotuloErp === 'ESTOQUE' ? styles['pronta-entrega'] : styles['sob-encomenda']}`}
          title="Mesmo rótulo da tabela de preço do NZERP"
        >
          ERP · {dados.rotuloErp}
        </span>
      )}

      {/* Nível lojista: números reais. Só chega aqui se o servidor mandou. */}
      {dados.saldo && (
        <dl className={styles.saldo}>
          <div className={styles.saldoRow}>
            <dt>Disponível</dt>
            <dd>{formatarMetros(dados.saldo.metrosLineares)}</dd>
          </div>
          <div className={styles.saldoRow}>
            <dt>Rolos fechados</dt>
            <dd>{dados.saldo.rolosFechados}</dd>
          </div>
          <div className={styles.saldoRow}>
            <dt>Rolos abertos</dt>
            <dd>{dados.saldo.rolosAbertos}</dd>
          </div>
          {dados.saldo.larguraM && (
            <div className={styles.saldoRow}>
              <dt>Largura</dt>
              <dd>{dados.saldo.larguraM} m</dd>
            </div>
          )}
        </dl>
      )}

      {/* Nível admin: botões por quantidade. Sem reserva — é o que está no
          pátio AGORA; quem fecha o pedido é o vendedor no ERP. */}
      {dados.papel === 'admin' && (rolosFechados.length > 0 || rolosAbertos.length > 0) && (
        <div className={styles.compra}>
          <p className={styles.compraTitulo}>Comprar de uma vez <span>disponível agora · sem reserva</span></p>
          {rolosFechados.length > 0 && (
            <div className={styles.compraLinha}>
              {Array.from({ length: rolosFechados.length }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`${styles.compraBtn} ${fechados === n ? styles.compraBtnAtivo : ''}`}
                  onClick={() => setFechados(fechados === n ? 0 : n)}
                >
                  {n} rolo{n > 1 ? 's' : ''} fechado{n > 1 ? 's' : ''}
                  <small>{formatarMetros(n * metrosFechado)}</small>
                </button>
              ))}
            </div>
          )}
          {rolosAbertos.length > 0 && (
            <div className={styles.compraLinha}>
              {rolosAbertos.map((l) => (
                <button
                  key={l.lpn}
                  type="button"
                  className={`${styles.compraBtn} ${pontas.includes(l.lpn) ? styles.compraBtnAtivo : ''}`}
                  onClick={() => setPontas(pontas.includes(l.lpn) ? pontas.filter((p) => p !== l.lpn) : [...pontas, l.lpn])}
                >
                  ponta {l.lpn}
                  <small>{formatarMetros(l.quant_ml)}</small>
                </button>
              ))}
            </div>
          )}
          {pedidoTexto && (
            <a
              className={styles.compraCta}
              href={`https://wa.me/5511920707565?text=${encodeURIComponent(pedidoTexto)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Enviar pedido interno · WhatsApp
            </a>
          )}
        </div>
      )}

      {/* Nível admin: detalhe por rolo físico, lido ao vivo no ERP. */}
      {Array.isArray(dados.lpns) && dados.lpns.length > 0 && (
        <details className={styles.lpns}>
          <summary className={styles.lpnsSummary}>
            {dados.lpns.length} rolo(s) no pátio — detalhe interno
          </summary>
          <div className={styles.lpnsScroll}>
            <table className={styles.lpnsTable}>
              <thead>
                <tr>
                  <th>LPN</th>
                  <th>Metros</th>
                  <th>Status</th>
                  <th>Endereço</th>
                </tr>
              </thead>
              <tbody>
                {dados.lpns.map((l) => (
                  <tr key={l.lpn}>
                    <td>{l.lpn}</td>
                    <td>{formatarMetros(l.quant_ml)}</td>
                    <td>{l.status_rolo}</td>
                    <td>{[l.coluna, l.prateleira, l.caixa].filter(Boolean).join(' · ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {dados.atualizadoEm && (
        <p className={styles.nota}>
          Estoque sincronizado do NZERP em {new Date(dados.atualizadoEm).toLocaleString('pt-BR')}.
          {dados.papel === 'anonimo' || dados.papel === 'client'
            ? ' Quantidades exatas para revendas cadastradas.'
            : ''}
        </p>
      )}
    </section>
  );
}

function formatarMetros(valor: number): string {
  return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} m`;
}
