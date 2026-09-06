// Painel lateral do carrinho — a confirmação de que adicionar funcionou.
//
// O problema que ele resolve: antes, adicionar mudava o texto do próprio botão
// por 1,8 s e incrementava um "🛒 1" no topo da página. Quem estava olhando
// para o botão não via o topo, e quem estava olhando para o topo não via o
// botão. O painel abre no lugar onde o olho está indo de qualquer jeito (a
// borda da tela), mostra o que entrou, quanto está dando e qual é o próximo
// passo — e fecha sozinho no Esc, no toque fora e no "voltar" do Android
// (useModalLock).
//
// Vai para o <body> por portal: ele é montado dentro da <nav>, e a navbar tem
// backdrop-filter — o que faz dela o bloco de contenção de qualquer
// position:fixed descendente. Sem o portal o painel ancora na barra, não na
// tela, e sai pela direita.

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { closeModal, temSentinela, useModalLock } from '../../hooks/useModalLock';
import { alterarQuantidade, removerDoCarrinho, totalItensCarrinho, useCarrinho } from '../../lib/shop/carrinho';
import { fecharPainelCarrinho, usePainelCarrinho } from '../../lib/shop/painelCarrinho';
import { BRL, usePrecosLote, usePrecosMapa } from '../../lib/shop/precos';
import styles from './MiniCarrinho.module.css';

export default function MiniCarrinho() {
  const painel = usePainelCarrinho();
  const itens = useCarrinho();
  const { itens: precos } = usePrecosMapa();
  const navegar = useNavigate();
  const fechar = () => closeModal(fecharPainelCarrinho);

  // Link daqui de dentro NÃO pode passar por `closeModal`: o history.back() da
  // sentinela chega depois do push do router e desfaz a navegação — foi o que
  // deixou "Ir para o carrinho" sem efeito. Mesma saída da paleta de busca:
  // fecha o estado e navega com `replace`, que consome a sentinela. Clique com
  // modificador (nova aba, botão do meio) segue o comportamento normal do <a>.
  const irPara = (e: React.MouseEvent, destino: string) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    fecharPainelCarrinho();
    navegar(destino, { replace: temSentinela() });
  };
  const primeiro = useRef<HTMLAnchorElement>(null);

  // Itens vindos de outras páginas podem não ter preço no cache desta sessão.
  usePrecosLote(itens.map((i) => i.slug));
  useModalLock(Boolean(painel), fecharPainelCarrinho);

  useEffect(() => {
    if (painel) primeiro.current?.focus();
  }, [painel]);

  if (!painel) return null;

  let total: number | null = 0;
  for (const i of itens) {
    const p = precos.get(i.slug);
    const unit = i.unidade === 'rolo' ? p?.rolo : p?.metro;
    if (unit == null) {
      total = null;
      break;
    }
    total += Number(unit) * i.qtd;
  }

  const n = totalItensCarrinho(itens);

  return createPortal(
    <>
      <div className={styles.fundo} onClick={fechar} aria-hidden="true" />
      <aside className={styles.painel} role="dialog" aria-modal="true" aria-label="Carrinho">
        <header className={styles.topo}>
          <span className={styles.titulo}>
            {painel.destaque ? (
              <>
                <span className={styles.check} aria-hidden="true">
                  ✓
                </span>
                Adicionado ao carrinho
              </>
            ) : (
              'Seu carrinho'
            )}
          </span>
          <button type="button" className={styles.fechar} onClick={fechar} aria-label="Fechar">
            ✕
          </button>
        </header>

        {itens.length === 0 ? (
          <p className={styles.vazio}>O carrinho está vazio.</p>
        ) : (
          <ul className={styles.lista}>
            {itens.map((i) => {
              const p = precos.get(i.slug);
              const unit = i.unidade === 'rolo' ? p?.rolo : p?.metro;
              const novo = painel.destaque?.slug === i.slug && painel.destaque.unidade === i.unidade;
              return (
                <li key={`${i.slug}|${i.unidade}`} className={novo ? styles.itemNovo : styles.item}>
                  <span className={styles.thumb}>
                    {i.imagem ? <img src={i.imagem} alt="" loading="lazy" /> : <span style={{ background: i.hex ?? '#222' }} />}
                  </span>
                  <span className={styles.info}>
                    <Link to={`/loja/${i.slug}`} className={styles.nome} onClick={(e) => irPara(e, `/loja/${i.slug}`)}>
                      {i.nome}
                    </Link>
                    <span className={styles.meta}>
                      {i.qtd.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}{' '}
                      {i.unidade === 'rolo' ? (i.qtd > 1 ? 'rolos fechados' : 'rolo fechado') : 'm'}
                      {unit != null ? ` · ${BRL.format(Number(unit) * i.qtd)}` : ''}
                    </span>
                    <span className={styles.acoes}>
                      <button
                        type="button"
                        aria-label={`Diminuir ${i.nome}`}
                        onClick={() => alterarQuantidade(i.slug, i.unidade, i.qtd - (i.unidade === 'rolo' ? 1 : 0.5))}
                      >
                        −
                      </button>
                      <button
                        type="button"
                        aria-label={`Aumentar ${i.nome}`}
                        onClick={() => alterarQuantidade(i.slug, i.unidade, i.qtd + (i.unidade === 'rolo' ? 1 : 0.5))}
                      >
                        +
                      </button>
                      <button type="button" className={styles.remover} onClick={() => removerDoCarrinho(i.slug, i.unidade)}>
                        remover
                      </button>
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <footer className={styles.rodape}>
          {itens.length > 0 && (
            <div className={styles.total}>
              <span>
                Subtotal · {n} {n > 1 ? 'itens' : 'item'}
              </span>
              <strong>{total == null ? 'calculando…' : BRL.format(total)}</strong>
            </div>
          )}
          <Link to="/carrinho" className={styles.principal} onClick={(e) => irPara(e, '/carrinho')} ref={primeiro}>
            {itens.length > 0 ? 'Ir para o carrinho' : 'Abrir o carrinho'}
          </Link>
          <button type="button" className={styles.continuar} onClick={fechar}>
            Continuar comprando
          </button>
          <p className={styles.nota}>Frete e forma de pagamento no passo seguinte.</p>
        </footer>
      </aside>
    </>,
    document.body
  );
}
