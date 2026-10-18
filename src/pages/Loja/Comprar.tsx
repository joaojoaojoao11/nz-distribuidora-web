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
//
// PEÇA (unidade 'UN' no ERP — camisetas da coleção): não há rolo nem metro.
// Some o seletor de unidade, a quantidade é inteira (1 a 10) e o item entra no
// carrinho como 'un'. O tamanho é escolhido acima, na página; até lá o botão
// fica travado com o texto de `bloqueio`.

import { useState } from 'react';
import { adicionarAoCarrinho } from '../../lib/shop/carrinho';
import { abrirPainelCarrinho } from '../../lib/shop/painelCarrinho';
import { BRL, type PrecoItem } from '../../lib/shop/precos';
import { ajustarQtd, MAXIMO, MINIMO, PASSO, rotuloQtd, vendePorUnidade, type UnidadeVenda } from '../../lib/shop/unidade';
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
  /** Falta uma escolha antes de comprar (ex.: "Escolha o tamanho"): trava o botão. */
  bloqueio?: string;
}

// Duas casas: a largura do rolo é 1,52 m — com uma casa virava "1,5 m".
const numero = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

export default function Comprar({ slug, produto, preco, separador = true, bloqueio }: Props) {
  const porPeca = vendePorUnidade(preco.unidade);
  const temRolo = preco.rolo != null;
  const temMetro = preco.metro != null;
  const [unidade, setUnidade] = useState<'rolo' | 'metro'>(temRolo ? 'rolo' : 'metro');
  const [qtds, setQtds] = useState<Record<UnidadeVenda, number>>({ rolo: 1, metro: 1, un: 1 });

  if (!temRolo && !temMetro) return null;
  // Peça precisa do preço "de rolo" (é o preço por peça que o checkout cobra).
  if (porPeca && !temRolo) return null;

  const atual: UnidadeVenda = porPeca ? 'un' : temRolo && temMetro ? unidade : temRolo ? 'rolo' : 'metro';
  const qtd = qtds[atual];
  const unitario = Number(atual === 'metro' ? preco.metro : preco.rolo);
  const subtotal = unitario * qtd;

  const mudarQtd = (valor: number) => {
    // Metro anda de 0,5 em 0,5; rolo e peça são inteiros. Sem isso o digitado
    // à mão entra com casas que o pedido não aceita.
    setQtds((a) => ({ ...a, [atual]: ajustarQtd(atual, valor) }));
  };

  const adicionar = () => {
    if (bloqueio) return;
    adicionarAoCarrinho({ slug, nome: produto.nome, codigo: produto.codigo, imagem: produto.imagem, hex: produto.hex, unidade: atual, qtd });
    abrirPainelCarrinho({ slug, unidade: atual });
  };

  const medida = [preco.metragemPadrao ? `${numero(Number(preco.metragemPadrao))} m` : null, preco.larguraM ? `${numero(Number(preco.larguraM))} m` : null]
    .filter(Boolean)
    .join(' × ');

  return (
    <div className={separador ? styles.bloco : `${styles.bloco} ${styles.semSeparador}`}>
      {!porPeca && temRolo && temMetro && (
        <div className={styles.unidades} role="group" aria-label="Como você quer comprar">
          <button type="button" className={atual === 'rolo' ? styles.unidadeAtiva : styles.unidade} aria-pressed={atual === 'rolo'} onClick={() => setUnidade('rolo')}>
            <span className={styles.unidadeNome}>Rolo fechado</span>
            <span className={styles.unidadeDetalhe}>{medida || 'rolo inteiro'}</span>
            <span className={styles.unidadePreco}>{BRL.format(Number(preco.rolo))}</span>
          </button>
          <button type="button" className={atual === 'metro' ? styles.unidadeAtiva : styles.unidade} aria-pressed={atual === 'metro'} onClick={() => setUnidade('metro')}>
            <span className={styles.unidadeNome}>Por metro</span>
            <span className={styles.unidadeDetalhe}>{preco.metroCheio != null ? 'ação moto' : 'cortado do rolo'}</span>
            <span className={styles.unidadePreco}>
              {/* Promoção Moto: a tabela riscada; o checkout cobra o preço de saída. */}
              {preco.metroCheio != null && <s className={styles.cheio}>{BRL.format(Number(preco.metroCheio))}</s>}
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
            inputMode={atual === 'metro' ? 'decimal' : 'numeric'}
            min={MINIMO[atual]}
            max={MAXIMO[atual]}
            step={PASSO[atual]}
            value={qtd}
            onChange={(e) => mudarQtd(Number(e.target.value))}
            aria-label={atual === 'rolo' ? 'Rolos fechados' : atual === 'un' ? 'Unidades' : 'Metros'}
          />
          <button type="button" aria-label="Aumentar" onClick={() => mudarQtd(qtd + PASSO[atual])} disabled={qtd >= MAXIMO[atual]}>
            +
          </button>
        </div>
        <span className={styles.unidadeTexto}>{atual === 'metro' ? 'metros' : rotuloQtd(atual, qtd)}</span>
      </div>

      <div className={styles.subtotal}>
        <span>Subtotal</span>
        <strong>{BRL.format(subtotal)}</strong>
      </div>

      <button type="button" className={styles.adicionar} onClick={adicionar} disabled={Boolean(bloqueio)} aria-disabled={Boolean(bloqueio)}>
        {bloqueio ?? 'Adicionar ao carrinho'}
      </button>
      <p className={styles.nota}>Frete e forma de pagamento no passo seguinte.</p>
    </div>
  );
}
