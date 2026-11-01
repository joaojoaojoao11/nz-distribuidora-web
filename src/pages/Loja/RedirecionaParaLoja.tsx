// Página antiga de item de uma linha da vitrine → anúncio da NZSTORE.
//
// No acesso direto quem redireciona é o servidor (308, api/_lib/vitrineLinhas.ts).
// Este componente cobre a navegação dentro do app: espera o catálogo do banco,
// acha o anúncio pelo endereço antigo e troca a URL. Item que não está à venda
// volta para a página da linha.

import { Navigate, useLocation } from 'react-router-dom';
import { getShopItem, getShopItemByLegacyPath, useCatalogoEstado } from '../../lib/shop/store';
import { VITRINES } from '../../lib/shop/vitrineLinhas';

export default function RedirecionaParaLoja({ linha }: { linha: keyof typeof VITRINES }) {
  const { pathname } = useLocation();
  const estado = useCatalogoEstado();
  const vitrine = VITRINES[linha];

  if (estado !== 'banco' && estado !== 'falhou') return <div style={{ minHeight: '70vh' }} />;

  const caminho = pathname.replace(/\/+$/, '').toLowerCase();
  const slug = caminho.split('/').pop() ?? '';
  const item =
    getShopItemByLegacyPath(caminho) ??
    // A 651 morou em /wrap antes de ir para /sign; o banco guarda o endereço antigo.
    (linha === 'oracal-651' ? getShopItemByLegacyPath(`/wrap/oracal-651/${slug}`) : undefined) ??
    // A Imprimax nunca teve endereço antigo no banco: o anúncio é imprimax-<slug>.
    (linha === 'imprimax' ? getShopItem(`imprimax-${slug}`) : undefined);

  const destino = item && item.lineKey === linha ? `/loja/${item.slug}` : vitrine.pagina;
  return <Navigate to={destino} replace />;
}
