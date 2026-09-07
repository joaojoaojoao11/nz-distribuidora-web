// Ficha técnica da página do produto — as quatro camadas numa lista só.
//
// A ordem na tela repete a precedência do dado (src/lib/shop/linhas.ts):
// primeiro o que é DESTE item (código, cor, largura do rolo), depois o que
// vale para a LINHA inteira, com o rótulo dizendo qual linha é. Sem essa
// separação visível, "Garantia 12 anos" ao lado de "Código NZP08" parece
// promessa daquele rolo específico — e é da linha.
//
// Segue a regra do template: cada bloco devolve `null` quando não tem dado.
// Produto sem ficha nenhuma não abre seção vazia.

import { useState } from 'react';
import { useLinhas } from '../../lib/shop/store';
import { fichaDoItem } from '../../lib/shop/linhas';
import type { ShopItem, ShopSpec } from '../../lib/shop/types';
import styles from './FichaTecnica.module.css';

/** Acima disto, a ficha da linha vem recolhida: 16 itens empurram tudo. */
const VISIVEIS = 6;

/**
 * Fontes sem `specs` (as cores criadas do ERP) ganham ficha sintética do que
 * existir. Estava dentro do LojaProduct; veio junto para cá porque é camada A.
 */
function varianteSintetica(item: ShopItem): ShopSpec[] {
  return [
    ...(item.code ? [{ label: 'Código', value: item.code }] : []),
    ...(item.finishLabel ? [{ label: 'Acabamento', value: item.finishLabel }] : []),
    ...(item.hex ? [{ label: 'Hex aproximado', value: item.hex.toUpperCase() }] : []),
    ...(item.durabilidadeAnos ? [{ label: 'Durabilidade', value: `${item.durabilidadeAnos} anos` }] : []),
    ...(item.garantiaAnos ? [{ label: 'Garantia', value: `${item.garantiaAnos} anos` }] : []),
    { label: 'Marca', value: item.brand },
  ];
}

function Linhas({ specs }: { specs: ShopSpec[] }) {
  return (
    <>
      {specs.map((s) => (
        <div key={`${s.label}-${s.value}`} className={styles.specRow}>
          <dt className={styles.specLabel}>{s.label}</dt>
          <dd className={styles.specValue}>{s.value}</dd>
        </div>
      ))}
    </>
  );
}

/**
 * O parágrafo ao lado da foto. Fica aqui, e não no LojaProduct, porque a
 * resolução é a mesma: quando a COR não tem texto próprio, herda o da linha.
 * São 787 produtos publicados sem descrição nenhuma — para eles, isto é a
 * diferença entre uma página muda e uma página que explica o material.
 */
export function DescricaoDoProduto({ item, className }: { item: ShopItem; className?: string }) {
  const indice = useLinhas();
  const texto = fichaDoItem(item, indice).descricao;
  if (!texto) return null;
  return <p className={className}>{texto}</p>;
}

export default function FichaTecnica({ item }: { item: ShopItem }) {
  const indice = useLinhas();
  const [aberta, setAberta] = useState(false);

  const base = item.specs.length ? item : { ...item, specs: varianteSintetica(item) };
  const ficha = fichaDoItem(base, indice);
  if (!ficha.temFicha) return null;

  const daLinha = ficha.linha;
  const recolher = daLinha.length > VISIVEIS;
  const mostradas = recolher && !aberta ? daLinha.slice(0, VISIVEIS) : daLinha;
  const escondidas = daLinha.length - mostradas.length;

  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Ficha técnica</h2>

        <dl className={styles.specs}>
          <Linhas specs={ficha.variante} />

          {daLinha.length > 0 && (
            <>
              {ficha.linhaLabel && (
                <div className={styles.divisor}>
                  <span className={styles.divisorLinha}>{ficha.linhaLabel}</span>
                  <span className={styles.divisorNota}>vale para toda a linha</span>
                </div>
              )}
              <Linhas specs={mostradas} />
            </>
          )}
        </dl>

        {recolher && (
          <button type="button" className={styles.verMais} onClick={() => setAberta((a) => !a)}>
            {aberta ? 'Ver menos' : `Ver ficha completa (mais ${escondidas})`}
          </button>
        )}

        {ficha.tds && (
          <a className={styles.tds} href={ficha.tds.url} target="_blank" rel="noopener noreferrer">
            {ficha.tds.titulo}
          </a>
        )}

        {/* Procedência. Só aparece quando existe: ficha sem fonte não ganha
            selo de fonte — seria pior que não dizer nada. */}
        {(ficha.fonteUrl || ficha.conferidoEm) && (
          <p className={styles.fonte}>
            {ficha.fonteUrl && (
              <>
                Dados técnicos do fabricante ·{' '}
                <a href={ficha.fonteUrl} target="_blank" rel="noopener noreferrer nofollow">
                  site oficial
                </a>
              </>
            )}
            {ficha.fonteUrl && ficha.conferidoEm ? ' · ' : null}
            {ficha.conferidoEm && `conferido em ${new Date(ficha.conferidoEm + 'T12:00:00').toLocaleDateString('pt-BR')}`}
          </p>
        )}
      </section>

      {ficha.aplicacoes.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Onde se aplica</h2>
          <ul className={styles.aplicacoes}>
            {ficha.aplicacoes.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
      )}

      {ficha.textoVenda && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Sobre {ficha.linhaLabel ?? 'a linha'}</h2>
          <div className={styles.texto}>
            {ficha.textoVenda.split(/\n{2,}/).map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
        </section>
      )}

      {ficha.cuidados && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Aplicação e cuidados</h2>
          <div className={styles.texto}>
            {ficha.cuidados.split(/\n{2,}/).map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
