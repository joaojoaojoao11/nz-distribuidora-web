// Bloco de compra da página de produto.
//
// Antes eram dois botões vazados iguais ("Adicionar rolo fechado" / "Adicionar
// metros"), um campo numérico nu para cada e um link "Ver carrinho" de canto —
// três decisões concorrendo pelo mesmo espaço, nenhuma delas em destaque.
//
// Agora a tela pergunta uma coisa de cada vez, na ordem em que a pessoa
// decide: (1) rolo fechado ou metro, (2) quanto, (3) adicionar. O subtotal
// aparece antes do clique, então ninguém precisa ir ao carrinho para saber o
// que vai gastar. Confirmação é o painel lateral (MiniCarrinho), não o texto
// do próprio botão.

import { useState } from 'react';
import { adicionarAoCarrinho } from '../../lib/shop/carrinho';
import { abrirPainelCarrinho } from '../../lib/shop/painelCarrinho';
import { BRL, type PrecoItem } from '../../lib/shop/precos';
import styles from './Comprar.module.css';

export interface ProdutoDoCarrinho {
  nome: string;
  codigo: string | null;
  imagem: string | null;
  hex: string | null;
}

interface Props {
  slug: string;
  produto: ProdutoDoCarrinho;
  preco: PrecoItem;
  /** Linha divisória no topo — some quando não há nada acima dele. */
  separador?: boolean;
}

const PASSO = { rolo: 1, metro: 0.5 } as const;
const MINIMO = { rolo: 1, metro: 0.5 } as const;
const MAXIMO = { rolo: 50, metro: 500 } as const;

// Duas casas: a largura do rolo é 1,52 m — com uma casa virava "1,5 m".
const numero = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

export default function Comprar({ slug, produto, preco, separador = true }: Props) {
  const temRolo = preco.rolo != null;
  const temMetro = preco.metro != null;
  const [unidade, setUnidade] = useState<'rolo' | 'metro'>(temRolo ? 'rolo' : 'metro');
  const [qtds, setQtds] = useState<{ rolo: number; metro: number }>({ rolo: 1, metro: 1 });

  if (!temRolo && !temMetro) return null;

  const atual = temRolo && temMetro ? unidade : temRolo ? 'rolo' : 'metro';
  const qtd = qtds[atual];
  const unitario = Number(atual === 'rolo' ? preco.rolo : preco.metro);
  const subtotal = unitario * qtd;

  const mudarQtd = (valor: number) => {
    const limitado = Math.min(MAXIMO[atual], Math.max(MINIMO[atual], Number.isFinite(valor) ? valor : MINIMO[atual]));
    // Metro anda de 0,5 em 0,5; rolo é inteiro. Sem isso o digitado à mão
    // entra com casas que o pedido não aceita.
    const ajustado = atual === 'rolo' ? Math.round(limitado) : Math.round(limitado * 2) / 2;
    setQtds((a) => ({ ...a, [atual]: ajustado }));
  };

  const adicionar = () => {
    adicionarAoCarrinho({ slug, nome: produto.nome, codigo: produto.codigo, imagem: produto.imagem, hex: produto.hex, unidade: atual, qtd });
    abrirPainelCarrinho({ slug, unidade: atual });
  };

  const medida = [preco.metragemPadrao ? `${numero(Number(preco.metragemPadrao))} m` : null, preco.larguraM ? `${numero(Number(preco.larguraM))} m` : null]
    .filter(Boolean)
    .join(' × ');

  return (
    <div className={separador ? styles.bloco : `${styles.bloco} ${styles.semSeparador}`}>
      {temRolo && temMetro && (
        <div className={styles.unidades} role="group" aria-label="Como você quer comprar">
          <button type="button" className={atual === 'rolo' ? styles.unidadeAtiva : styles.unidade} aria-pressed={atual === 'rolo'} onClick={() => setUnidade('rolo')}>
            <span className={styles.unidadeNome}>Rolo fechado</span>
            <span className={styles.unidadeDetalhe}>{medida || 'rolo inteiro'}</span>
            <span className={styles.unidadePreco}>{BRL.format(Number(preco.rolo))}</span>
          </button>
          <button type="button" className={atual === 'metro' ? styles.unidadeAtiva : styles.unidade} aria-pressed={atual === 'metro'} onClick={() => setUnidade('metro')}>
            <span className={styles.unidadeNome}>Por metro</span>
            <span className={styles.unidadeDetalhe}>cortado do rolo</span>
            <span className={styles.unidadePreco}>
              {BRL.format(Number(preco.metro))}
              <small>/m</small>
            </span>
          </button>
        </div>
      )}

      <div className={styles.quantidade}>
        <span className={styles.rotulo}>Quantidade</span>
        <div className={styles.contador}>
          <button type="button" aria-label="Diminuir" onClick={() => mudarQtd(qtd - PASSO[atual])} disabled={qtd <= MINIMO[atual]}>
            −
          </button>
          <input
            type="number"
            inputMode="decimal"
            min={MINIMO[atual]}
            max={MAXIMO[atual]}
            step={PASSO[atual]}
            value={qtd}
            onChange={(e) => mudarQtd(Number(e.target.value))}
            aria-label={atual === 'rolo' ? 'Rolos fechados' : 'Metros'}
          />
          <button type="button" aria-label="Aumentar" onClick={() => mudarQtd(qtd + PASSO[atual])} disabled={qtd >= MAXIMO[atual]}>
            +
          </button>
        </div>
        <span className={styles.unidadeTexto}>{atual === 'rolo' ? (qtd > 1 ? 'rolos fechados' : 'rolo fechado') : 'metros'}</span>
      </div>

      <div className={styles.subtotal}>
        <span>Subtotal</span>
        <strong>{BRL.format(subtotal)}</strong>
      </div>

      <button type="button" className={styles.adicionar} onClick={adicionar}>
        Adicionar ao carrinho
      </button>
      <p className={styles.nota}>Frete e forma de pagamento no passo seguinte.</p>
    </div>
  );
}
