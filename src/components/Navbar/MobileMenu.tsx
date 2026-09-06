// Menu do celular — lista vertical, uma coluna.
//
// Substitui o overlay que reaproveitava o markup do desktop. Aquele empilhava
// logotipos de 80px, transformava os dropdowns em duas colunas e centralizava
// tudo numa altura fixa SEM rolagem: com 15 itens o conteúdo estourava para
// cima e para baixo, e o usuário via o menu começando no meio (NZWRAP) e
// terminando cortado (BLOG), sem alcançar "Entrar".
//
// Duas decisões estruturais:
//
// 1. Só existe no DOM quando está aberto. O overlay anterior ficava montado e
//    escondido por CSS — foi assim que os links dos dropdowns continuaram
//    recebendo toque por cima da loja (commit 63d7de7). Aqui, fechado é
//    inexistente: não há o que tocar por engano.
// 2. Sub-itens sempre visíveis, sem acordeão. O João pediu lista; acordeão
//    acrescenta um toque e um estado para chegar ao mesmo lugar, e a rolagem
//    já resolve o comprimento.

import { Link, useLocation } from 'react-router-dom';
import { useModalLock } from '../../hooks/useModalLock';
import { useCarrinho } from '../../lib/shop/carrinho';
import { buildNavItems } from './navItems';
import styles from './MobileMenu.module.css';

const WHATSAPP_URL =
  'https://wa.me/5511920707565?text=Ol%C3%A1%2C%20cheguei%20pelo%20site%20da%20NZ.';

interface Props {
  onClose: () => void;
  isAdmin: boolean;
  logado: boolean;
  contagens: { shDecor: number; etherna: number };
}

export default function MobileMenu({ onClose, isAdmin, logado, contagens }: Props) {
  const { pathname } = useLocation();
  const itens = buildNavItems(contagens);
  const carrinho = useCarrinho();

  // Trava a rolagem do fundo (do jeito que o iOS respeita), faz o Voltar do
  // Android fechar o menu em vez de sair da página, e esconde o botão
  // flutuante do WhatsApp enquanto o menu está aberto.
  useModalLock(true, onClose);

  const ativo = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <nav className={styles.painel} aria-label="Menu principal">
      <ul className={styles.lista}>
        {/* A loja abre a lista e é o único item com marcação de destaque: é
            para onde o menu existe para levar. */}
        <li>
          <Link
            to="/loja"
            onClick={onClose}
            className={`${styles.item} ${styles.itemLoja} ${
              ativo('/loja') ? styles.itemAtivo : ''
            }`}
          >
            <img
              src="/assets/logos/logo-nzstore-branco.png"
              alt="NZSTORE"
              className={styles.logoLoja}
              width={836}
              height={126}
            />
            <span className={styles.itemHint}>catálogo completo</span>
          </Link>
        </li>

        {itens.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              onClick={onClose}
              className={`${styles.item} ${ativo(item.to, item.exact) ? styles.itemAtivo : ''}`}
            >
              {item.label}
            </Link>

            {item.children && (
              <ul className={styles.sublista}>
                {item.children.map((sub) => (
                  <li key={sub.to}>
                    <Link
                      to={sub.to}
                      onClick={onClose}
                      className={`${styles.subitem} ${
                        pathname === sub.to ? styles.itemAtivo : ''
                      }`}
                    >
                      {sub.label}
                      {sub.hint && <span className={styles.itemHint}>{sub.hint}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      <div className={styles.rodape}>
        {carrinho.length > 0 && (
          <Link to="/carrinho" onClick={onClose} className={styles.conta}>
            Carrinho · {carrinho.length} item{carrinho.length > 1 ? 'ns' : ''}
          </Link>
        )}
        <Link
          to={logado ? (isAdmin ? '/admin' : '/painel') : '/login'}
          onClick={onClose}
          className={styles.conta}
        >
          {logado ? (isAdmin ? 'Painel administrativo' : 'Minha conta') : 'Entrar'}
        </Link>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className={styles.whats}
        >
          Falar no WhatsApp
        </a>
      </div>
    </nav>
  );
}
