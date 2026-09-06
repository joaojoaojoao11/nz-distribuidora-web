// /painel/carrinho — o que o cliente deixou para depois.
//
// É o lado do CLIENTE do "carrinho abandonado": a mesma linha da tabela
// `carrinhos` que alimenta o relatório do admin. A lista mostrada é a local (é
// a que vale agora); do servidor vem só a data — "guardado desde" é a
// informação que faz a tela significar alguma coisa.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { alterarQuantidade, limparCarrinho, removerDoCarrinho, totalItensCarrinho, useCarrinho } from '../../lib/shop/carrinho';
import { BRL, usePrecosLote, usePrecosMapa } from '../../lib/shop/precos';
import styles from './Painel.module.css';

export default function PainelCarrinho() {
  const { user } = useAuth();
  const itens = useCarrinho();
  const { itens: precos } = usePrecosMapa();
  const [desde, setDesde] = useState<string | null>(null);

  usePrecosLote(itens.map((i) => i.slug));

  useEffect(() => {
    if (!user) return;
    let vivo = true;
    void supabase
      .from('carrinhos')
      .select('atualizado_em')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (vivo) setDesde((data?.atualizado_em as string | undefined) ?? null);
      });
    return () => {
      vivo = false;
    };
  }, [user]);

  if (itens.length === 0) {
    return (
      <div className={styles.vazio}>
        <p className={styles.mudo}>
          Nada guardado. O que você colocar no carrinho fica aqui, esperando — e agora acompanha a sua
          conta, então dá para começar no celular e terminar no computador.
        </p>
        <Link to="/loja" className={styles.botaoSecundario}>
          Ir para a loja
        </Link>
      </div>
    );
  }

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

  return (
    <>
      <p className={styles.mudo}>
        {n} {n > 1 ? 'itens' : 'item'} guardado{n > 1 ? 's' : ''}
        {desde ? ` desde ${new Date(desde).toLocaleDateString('pt-BR')}` : ''}.
      </p>

      <ul className={styles.itensCarrinho}>
        {itens.map((i) => {
          const p = precos.get(i.slug);
          const unit = i.unidade === 'rolo' ? p?.rolo : p?.metro;
          const passo = i.unidade === 'rolo' ? 1 : 0.5;
          return (
            <li key={`${i.slug}|${i.unidade}`} className={styles.itemCarrinho}>
              <Link to={`/loja/${i.slug}`} className={styles.itemFoto} aria-hidden="true" tabIndex={-1}>
                {i.imagem ? <img src={i.imagem} alt="" loading="lazy" /> : <span style={{ background: i.hex ?? '#222' }} />}
              </Link>
              <div className={styles.itemInfo}>
                <Link to={`/loja/${i.slug}`} className={styles.itemNome}>
                  {i.nome}
                </Link>
                <span className={styles.itemMeta}>
                  {i.qtd.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}{' '}
                  {i.unidade === 'rolo' ? (i.qtd > 1 ? 'rolos fechados' : 'rolo fechado') : 'm'}
                  {unit != null ? ` · ${BRL.format(Number(unit) * i.qtd)}` : ''}
                </span>
              </div>
              <div className={styles.itemAcoes}>
                <button type="button" aria-label={`Diminuir ${i.nome}`} onClick={() => alterarQuantidade(i.slug, i.unidade, i.qtd - passo)}>
                  −
                </button>
                <button type="button" aria-label={`Aumentar ${i.nome}`} onClick={() => alterarQuantidade(i.slug, i.unidade, i.qtd + passo)}>
                  +
                </button>
                <button type="button" className={styles.itemRemover} onClick={() => removerDoCarrinho(i.slug, i.unidade)}>
                  remover
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className={styles.carrinhoRodape}>
        <span className={styles.carrinhoTotal}>
          <small>Subtotal</small>
          <strong>{total == null ? 'calculando…' : BRL.format(total)}</strong>
        </span>
        <div className={styles.acoesBloco}>
          <Link to="/carrinho" className={styles.salvar}>
            Retomar a compra
          </Link>
          <button type="button" className={styles.botaoSecundario} onClick={limparCarrinho}>
            Esvaziar
          </button>
        </div>
      </div>
    </>
  );
}
