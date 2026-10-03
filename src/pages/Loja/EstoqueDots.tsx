// Três bolinhas: o que dá para vender AGORA, sem abrir a página do produto.
//
// Verde   = existe rolo fechado no pátio (dá para vender rolo).
// Laranja = existe rolo aberto, isto é, ponta (dá para vender fracionado).
// Vermelha= existe pedaço no estoque do parceiro Inova, do Jardel. Não é nosso
//           (não é consignado), mas dá para vender fracionado por lá. Pedido do
//           João em 2026-10-03. A lista chega em foto, de vez em quando: quando
//           fica velha a bolinha esmaece e o título avisa (PARCEIRO_DIAS_VALIDADE).
//
// Pedido do João (2026-09-08): "assim vamos saber rapidamente o que tem em
// estoque". Vendedor no balcão percorrendo o mostruário não pode abrir 60
// páginas para descobrir o que sai hoje.
//
// SÓ ADMIN, e quem decide isso é o SERVIDOR: o campo `estoque` só é montado
// para o papel admin em api/_lib/handlers/precos.ts. Aqui não há checagem de
// papel nenhuma — se houvesse, bastaria o DevTools para burlar. O componente
// simplesmente não recebe o dado quando não deve.
//
// O número vem junto do preço (uma requisição por página de cards) e não de
// /api/nz/estoque, que consulta o ERP ao vivo por SKU: 60 cards seriam 60
// consultas ao ERP para desenhar duas bolinhas.

import { usePreco, type EstoqueParceiro } from '../../lib/shop/precos';
import styles from './EstoqueDots.module.css';

interface Contagem {
  rolosFechados: number;
  rolosAbertos: number;
  parceiros?: EstoqueParceiro[];
}

/** Depois disso a lista do parceiro é palpite: a bolinha fica apagada. */
export const PARCEIRO_DIAS_VALIDADE = 30;

export function listaVelha(listaDe: string, hoje = new Date()): boolean {
  const dias = (hoje.getTime() - new Date(`${listaDe}T12:00:00`).getTime()) / 86_400_000;
  return dias > PARCEIRO_DIAS_VALIDADE;
}

const metros = (m: number) => `${m.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} m`;

export function dataCurta(listaDe: string): string {
  const [, mes, dia] = listaDe.split('-');
  return `${dia}/${mes}`;
}

/**
 * Pedaços iguais viram um só: "6 × 17 m · rolo fechado" em vez de seis vezes
 * o mesmo número. Mantém a ordem (maior primeiro) que o servidor mandou.
 */
export function agruparPecas(pecas: EstoqueParceiro['pecas']): string[] {
  const grupos: { metros: number; status: string; qtd: number }[] = [];
  for (const x of pecas) {
    const g = grupos.find((y) => y.metros === x.metros && y.status === x.status);
    if (g) g.qtd += 1;
    else grupos.push({ ...x, qtd: 1 });
  }
  return grupos.map(
    (g) => `${g.qtd > 1 ? `${g.qtd} × ` : ''}${metros(g.metros)}${g.status === 'fechado' ? ' · rolo fechado' : ''}`
  );
}

/** "Inova (Jardel): 7 m + 2 m · lista de 03/10" — uma linha por parceiro. */
export function descreverParceiros(parceiros: EstoqueParceiro[]): string {
  return parceiros
    .map((p) => {
      const pecas = agruparPecas(p.pecas).join(' + ');
      const velha = listaVelha(p.listaDe) ? ' — lista antiga, confirmar' : '';
      return `${p.nome}: ${pecas} · lista de ${dataCurta(p.listaDe)}${velha}`;
    })
    .join('\n');
}

/** Versão que já tem os números (página do produto, que os busca por outro caminho). */
export function BolinhasDeEstoque({ estoque }: { estoque: Contagem | undefined }) {
  if (!estoque) return null;
  const { rolosFechados, rolosAbertos } = estoque;
  const parceiros = estoque.parceiros?.filter((p) => p.pecas.length > 0) ?? [];
  if (rolosFechados <= 0 && rolosAbertos <= 0 && !parceiros.length) return null;
  const parceiroVelho = parceiros.length > 0 && parceiros.every((p) => listaVelha(p.listaDe));
  const textoParceiro = parceiros.length ? `No parceiro — ${descreverParceiros(parceiros)}` : '';

  return (
    <span className={styles.grupo}>
      {rolosFechados > 0 && (
        <span
          className={`${styles.bolinha} ${styles.fechado}`}
          title={`${rolosFechados} rolo${rolosFechados > 1 ? 's' : ''} fechado${rolosFechados > 1 ? 's' : ''} no pátio`}
          aria-label={`${rolosFechados} rolo${rolosFechados > 1 ? 's' : ''} fechado${rolosFechados > 1 ? 's' : ''} no pátio`}
          role="img"
        />
      )}
      {rolosAbertos > 0 && (
        <span
          className={`${styles.bolinha} ${styles.aberto}`}
          title={`${rolosAbertos} rolo${rolosAbertos > 1 ? 's' : ''} aberto${rolosAbertos > 1 ? 's' : ''} · fracionado`}
          aria-label={`${rolosAbertos} rolo${rolosAbertos > 1 ? 's' : ''} aberto${rolosAbertos > 1 ? 's' : ''}, fracionado`}
          role="img"
        />
      )}
      {parceiros.length > 0 && (
        <span
          className={`${styles.bolinha} ${styles.parceiro} ${parceiroVelho ? styles.velho : ''}`}
          title={textoParceiro}
          aria-label={textoParceiro}
          role="img"
        />
      )}
    </span>
  );
}

/** Versão do card: lê o mesmo cache de preço que o card já usa. */
export default function EstoqueDots({ slug, selecao }: { slug: string; selecao?: string }) {
  const { item } = usePreco(slug, selecao);
  return <BolinhasDeEstoque estoque={item?.estoque} />;
}
