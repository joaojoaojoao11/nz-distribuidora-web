import { useCallback, useMemo, useState, type AnchorHTMLAttributes, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import SellerModal from '../SellerModal/SellerModal';
import { DECOR, MENSAGEM_PADRAO, ehRotaDecor, linkWhatsApp } from '../../lib/contatos';
import { ContatoCtx, useContatoVendas } from './contexto';

// Botão de contato do site: abre a "Central de Vendas" (Vendas 1, 2 e 3) com a mensagem já escrita.
// Nas páginas /decor o contato vai direto para a Daniela (NZDECOR), sem a janela.

export function ContatoVendasProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [mensagem, setMensagem] = useState<string | null>(null);

  // Trocou de página com a janela aberta (ex.: "voltar" do celular): fecha. Só o caminho conta —
  // filtro da loja e ?cor= do Metamark mexem na URL sem trocar de página.
  // Ajuste durante o render (padrão do React), sem efeito.
  const [paginaVista, setPaginaVista] = useState(pathname);
  if (paginaVista !== pathname) {
    setPaginaVista(pathname);
    if (mensagem !== null) setMensagem(null);
  }

  const abrir = useCallback((msg?: string) => {
    if (ehRotaDecor(pathname)) {
      window.open(linkWhatsApp(DECOR, msg ?? 'Olá! Vim pelo site da NZDECOR e gostaria de mais informações.'), '_blank');
      return;
    }
    setMensagem(msg ?? MENSAGEM_PADRAO);
  }, [pathname]);

  const fechar = useCallback(() => setMensagem(null), []);
  const valor = useMemo(() => ({ abrir }), [abrir]);

  return (
    <ContatoCtx.Provider value={valor}>
      {children}
      <SellerModal open={mensagem !== null} onClose={fechar} mensagem={mensagem ?? MENSAGEM_PADRAO} />
    </ContatoCtx.Provider>
  );
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> & {
  mensagem?: string;
  children: ReactNode;
};

/** Link no lugar do antigo <a href="https://wa.me/...">: mantém o visual, abre a Central de Vendas. */
export function LinkVendas({ mensagem, children, ...resto }: LinkProps) {
  const { abrir } = useContatoVendas();
  return (
    <a
      href="#contato"
      role="button"
      {...resto}
      onClick={(e) => {
        // pode estar dentro de um cartão clicável (ShopCard): não deixa o clique subir
        e.preventDefault();
        e.stopPropagation();
        abrir(mensagem);
      }}
    >
      {children}
    </a>
  );
}
