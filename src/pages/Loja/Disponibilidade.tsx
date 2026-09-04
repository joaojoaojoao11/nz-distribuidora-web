// Bloco de disponibilidade da página de produto.
//
// O que aparece depende do PAPEL, e o papel é decidido no servidor
// (api/loja/estoque.ts), nunca aqui. Este componente só desenha o que recebe —
// se ele tentasse decidir, bastaria abrir o DevTools para ver o dado do nível
// de cima.
//
// Some inteiro quando: o item não está mapeado para um SKU do ERP, o espelho
// ainda não tem esse SKU, ou a API está fora do ar (503 do devApiStub em
// `npm run dev`). Melhor não dizer nada do que dizer errado sobre estoque.

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './Disponibilidade.module.css';

type Nivel = 'em-estoque' | 'ultimas-unidades' | 'sob-encomenda';

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
}

const ROTULO: Record<Nivel, string> = {
  'em-estoque': 'Em estoque',
  'ultimas-unidades': 'Últimas unidades',
  'sob-encomenda': 'Sob encomenda',
};

export default function Disponibilidade({ slug }: { slug: string }) {
  const [dados, setDados] = useState<Resposta | null>(null);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;

        const res = await fetch('/api/loja/estoque', {
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

  if (!dados?.mapeado || dados.semDados || !dados.disponibilidade) return null;

  const nivel = dados.disponibilidade;

  return (
    <section className={styles.block} aria-labelledby="disp-titulo">
      <h2 id="disp-titulo" className={styles.title}>
        Disponibilidade
      </h2>

      <span className={`${styles.badge} ${styles[nivel]}`}>{ROTULO[nivel]}</span>

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
