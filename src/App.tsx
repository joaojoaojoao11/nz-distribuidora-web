import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import AnalyticsTracker from './components/AnalyticsTracker';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import FloatingWhatsApp from './components/FloatingWhatsApp/FloatingWhatsApp';
import './App.css';
// Efeito colateral: liga a cópia do carrinho no servidor (uma linha por
// usuário). Sem ela, carrinho abandonado não existe como dado.
import './lib/shop/carrinhoServidor';

// Code splitting por rota: a Home carrega no bundle inicial; o resto (admin com
// recharts/jspdf, mapas leaflet, three.js do simulador, catálogos) só baixa
// quando o visitante navega até lá. Corta o bundle inicial de ~3 MB.
const Loja = lazy(() => import('./pages/Loja/Loja'));
const LojaProduct = lazy(() => import('./pages/Loja/LojaProduct'));
const PainelLayout = lazy(() => import('./pages/Painel/PainelLayout'));
const PainelInicio = lazy(() => import('./pages/Painel/PainelInicio'));
const PainelDados = lazy(() => import('./pages/Painel/PainelDados'));
const PainelSeguranca = lazy(() => import('./pages/Painel/PainelSeguranca'));
const PainelPedidos = lazy(() => import('./pages/Painel/PainelPedidos'));
const PainelPagamentos = lazy(() => import('./pages/Painel/PainelPagamentos'));
const PainelCarrinho = lazy(() => import('./pages/Painel/PainelCarrinho'));
const PainelFavoritos = lazy(() => import('./pages/Painel/PainelFavoritos'));
const PainelVistos = lazy(() => import('./pages/Painel/PainelVistos'));
const PainelGarantias = lazy(() => import('./pages/Painel/PainelGarantias'));
const PainelCupons = lazy(() => import('./pages/Painel/PainelCupons'));
const PainelIndique = lazy(() => import('./pages/Painel/PainelIndique'));
const Carrinho = lazy(() => import('./pages/Loja/Carrinho'));
const Checkout = lazy(() => import('./pages/Loja/Checkout'));
const PedidoDetalhe = lazy(() => import('./pages/Painel/PedidoDetalhe'));
const Ppf = lazy(() => import('./pages/Ppf/Ppf'));
const LuxuryGloss = lazy(() => import('./pages/Ppf/LuxuryGloss'));
const PrimeGloss = lazy(() => import('./pages/Ppf/PrimeGloss'));
const FlowGloss = lazy(() => import('./pages/Ppf/FlowGloss'));
const CoreGloss = lazy(() => import('./pages/Ppf/CoreGloss'));
const Headlight = lazy(() => import('./pages/Ppf/Headlight'));
const Windshield = lazy(() => import('./pages/Ppf/Windshield'));
const Wrap = lazy(() => import('./pages/Wrap/Wrap'));
const NzwrapPremium = lazy(() => import('./pages/Wrap/WrapProducts').then(m => ({ default: m.NzwrapPremium })));
const ShColors = lazy(() => import('./pages/Wrap/WrapProducts').then(m => ({ default: m.ShColors })));
const Oracal970 = lazy(() => import('./pages/Wrap/WrapProducts').then(m => ({ default: m.Oracal970 })));
const Oracal651 = lazy(() => import('./pages/Wrap/WrapProducts').then(m => ({ default: m.Oracal651 })));
const Oracal670 = lazy(() => import('./pages/Wrap/WrapProducts').then(m => ({ default: m.Oracal670 })));
const Oracal670ColorPage = lazy(() => import('./pages/Wrap/Oracal670Colors'));
const Oracal651Colors = lazy(() => import('./pages/Wrap/Oracal651Colors'));
const ShWrappingColors = lazy(() => import('./pages/Wrap/ShWrappingColors'));
const NzwrapColorPage = lazy(() => import('./pages/Wrap/NzwrapColorPage'));
const MetamarkMcx = lazy(() => import('./pages/Wrap/WrapMetamark').then(m => ({ default: m.MetamarkMcx })));
const MetamarkM7 = lazy(() => import('./pages/Wrap/WrapMetamark').then(m => ({ default: m.MetamarkM7 })));
const Sign = lazy(() => import('./pages/Sign/Sign'));
const SignProduct = lazy(() => import('./pages/Sign/SignProduct'));
const Decor = lazy(() => import('./pages/Decor/Decor'));
const ShDecorCatalog = lazy(() => import('./pages/Decor/ShDecorCatalog'));
const ShDecorProduct = lazy(() => import('./pages/Decor/ShDecorProduct'));
const EthernaCatalog = lazy(() => import('./pages/Decor/EthernaCatalog'));
const EthernaProduct = lazy(() => import('./pages/Decor/EthernaProduct'));
const FindInstaller = lazy(() => import('./pages/FindInstaller/FindInstaller'));
const Company = lazy(() => import('./pages/Company/Company'));
const BlogList = lazy(() => import('./pages/Blog/BlogList'));
const BlogPost = lazy(() => import('./pages/Blog/BlogPost'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const RecuperarSenha = lazy(() => import('./pages/Auth/RecuperarSenha'));
const NovaSenha = lazy(() => import('./pages/Auth/NovaSenha'));
// Painel administrativo: casca com rotas aninhadas (AdminLayout) + uma página
// por aba. Antes era um componente só com as abas em `useState`.
const AdminLayout = lazy(() => import('./pages/Admin/AdminLayout'));
const AdminHome = lazy(() => import('./pages/Admin/AdminHome'));
const AdminLeads = lazy(() => import('./pages/Admin/AdminLeads'));
const AdminProdutos = lazy(() => import('./pages/Admin/AdminProdutos'));
const AdminProdutoEditor = lazy(() => import('./pages/Admin/AdminProdutoEditor'));
const AdminPedidos = lazy(() => import('./pages/Admin/AdminPedidos'));
const AdminLogistica = lazy(() => import('./pages/Admin/AdminLogistica'));
const AdminErp = lazy(() => import('./pages/Admin/AdminErp'));
const AdminAfiliados = lazy(() => import('./pages/Admin/AdminAfiliados'));
const AdminBlog = lazy(() => import('./pages/Admin/AdminBlog'));
const AdminAIBlog = lazy(() => import('./pages/Admin/AdminAIBlog'));
const AdminPromoPages = lazy(() => import('./pages/Admin/AdminPromoPages'));
const AdminAgenciaNZ = lazy(() => import('./pages/Admin/AdminAgenciaNZ'));
const AdminAgendaSocial = lazy(() => import('./pages/Admin/AdminAgendaSocial'));
const AdminClientes = lazy(() => import('./pages/Admin/AdminClientes'));
const AdminWarranties = lazy(() => import('./pages/Admin/AdminWarranties'));
const AdminEquipe = lazy(() => import('./pages/Admin/AdminEquipe'));
const AdminSettings = lazy(() => import('./pages/Admin/AdminSettings'));
const WarrantyRegistration = lazy(() => import('./pages/Warranty/WarrantyRegistration'));
const WarrantyValidator = lazy(() => import('./pages/Warranty/WarrantyValidator'));
const Interlagos = lazy(() => import('./pages/Interlagos/Interlagos'));
const PpfPromo = lazy(() => import('./pages/Links/PpfPromo'));
const NzGroupPromo = lazy(() => import('./pages/Links/NzGroupPromo'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Contact = lazy(() => import('./pages/Institutional/Contact'));
const Privacy = lazy(() => import('./pages/Institutional/Privacy'));
const Terms = lazy(() => import('./pages/Institutional/Terms'));

function RouteLoading() {
  return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        border: '3px solid rgba(255,212,0,0.25)', borderTopColor: '#FFD400',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Routes>
        {/* Admin (without Navbar/Footer) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Suspense fallback={<RouteLoading />}>
                <AdminLayout />
              </Suspense>
            </ProtectedRoute>
          }
        >
          <Route index element={<Suspense fallback={<RouteLoading />}><AdminHome /></Suspense>} />
          <Route path="produtos" element={<Suspense fallback={<RouteLoading />}><AdminProdutos /></Suspense>} />
          <Route path="produtos/novo" element={<Suspense fallback={<RouteLoading />}><AdminProdutoEditor /></Suspense>} />
          <Route path="produtos/:slug" element={<Suspense fallback={<RouteLoading />}><AdminProdutoEditor /></Suspense>} />
          <Route path="pedidos" element={<Suspense fallback={<RouteLoading />}><AdminPedidos /></Suspense>} />
          <Route path="logistica" element={<Suspense fallback={<RouteLoading />}><AdminLogistica /></Suspense>} />
          <Route path="erp" element={<Suspense fallback={<RouteLoading />}><AdminErp /></Suspense>} />
          <Route path="afiliados" element={<Suspense fallback={<RouteLoading />}><AdminAfiliados /></Suspense>} />
          <Route path="blog" element={<Suspense fallback={<RouteLoading />}><AdminBlog /></Suspense>} />
          <Route path="blog-ia" element={<Suspense fallback={<RouteLoading />}><AdminAIBlog /></Suspense>} />
          <Route path="promo" element={<Suspense fallback={<RouteLoading />}><AdminPromoPages /></Suspense>} />
          <Route path="agencia" element={<Suspense fallback={<RouteLoading />}><AdminAgenciaNZ /></Suspense>} />
          <Route path="agenda-social" element={<Suspense fallback={<RouteLoading />}><AdminAgendaSocial /></Suspense>} />
          <Route path="leads" element={<Suspense fallback={<RouteLoading />}><AdminLeads /></Suspense>} />
          <Route path="clientes" element={<Suspense fallback={<RouteLoading />}><AdminClientes /></Suspense>} />
          <Route path="garantias" element={<Suspense fallback={<RouteLoading />}><AdminWarranties /></Suspense>} />
          <Route path="usuarios" element={<Suspense fallback={<RouteLoading />}><AdminEquipe /></Suspense>} />
          <Route path="configuracoes" element={<Suspense fallback={<RouteLoading />}><AdminSettings /></Suspense>} />
        </Route>

        {/* Auth pages (without Footer, with Navbar) */}
        <Route path="/login" element={<><Navbar /><Suspense fallback={<RouteLoading />}><Login /></Suspense></>} />
        <Route path="/cadastro" element={<><Navbar /><Suspense fallback={<RouteLoading />}><Register /></Suspense></>} />
        <Route path="/recuperar-senha" element={<><Navbar /><Suspense fallback={<RouteLoading />}><RecuperarSenha /></Suspense></>} />
        <Route path="/nova-senha" element={<><Navbar /><Suspense fallback={<RouteLoading />}><NovaSenha /></Suspense></>} />

        {/* Hidden Linktree-style pages (no Navbar/Footer/Whatsapp) */}
        <Route path="/ppf-promo" element={<Suspense fallback={<RouteLoading />}><PpfPromo /></Suspense>} />
        <Route path="/nzgroup-promo" element={<Suspense fallback={<RouteLoading />}><NzGroupPromo /></Suspense>} />

        {/* Public pages */}
        <Route path="*" element={
          <div className="app-layout">
            <AnalyticsTracker />
            <Navbar />
            <main>
              <Suspense fallback={<RouteLoading />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/loja" element={<Loja />} />
                  <Route path="/loja/:slug" element={<LojaProduct />} />
                  {/* Conta do cliente: uma rota por tela, como o admin. O
                      detalhe do pedido fica FORA da casca — é uma página de
                      acompanhamento, com o próprio cabeçalho. */}
                  <Route path="/painel" element={<PainelLayout />}>
                    <Route index element={<PainelInicio />} />
                    <Route path="dados" element={<PainelDados />} />
                    <Route path="seguranca" element={<PainelSeguranca />} />
                    <Route path="pedidos" element={<PainelPedidos />} />
                    <Route path="pagamentos" element={<PainelPagamentos />} />
                    <Route path="carrinho" element={<PainelCarrinho />} />
                    <Route path="favoritos" element={<PainelFavoritos />} />
                    <Route path="vistos" element={<PainelVistos />} />
                    <Route path="garantias" element={<PainelGarantias />} />
                    <Route path="cupons" element={<PainelCupons />} />
                    <Route path="indique" element={<PainelIndique />} />
                  </Route>
                  <Route path="/carrinho" element={<Carrinho />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/painel/pedido/:numero" element={<PedidoDetalhe />} />
                  <Route path="/ppf" element={<Ppf />} />
                  <Route path="/ppf/luxury-gloss" element={<LuxuryGloss />} />
                  <Route path="/ppf/prime-gloss" element={<PrimeGloss />} />
                  <Route path="/ppf/flow-gloss" element={<FlowGloss />} />
                  <Route path="/ppf/core-gloss" element={<CoreGloss />} />
                  <Route path="/ppf/headlight" element={<Headlight />} />
                  <Route path="/ppf/windshield" element={<Windshield />} />
                  <Route path="/wrap" element={<Wrap />} />
                  <Route path="/wrap/nzwrap-premium" element={<NzwrapPremium />} />
                  <Route path="/wrap/nzwrap-premium/:sku" element={<NzwrapColorPage />} />
                  <Route path="/wrap/sh-colors" element={<ShColors />} />
                  <Route path="/wrap/sh-colors/:colorCode" element={<ShWrappingColors />} />
                  <Route path="/wrap/oracal-970ra" element={<Oracal970 />} />
                  <Route path="/wrap/oracal-651" element={<Oracal651 />} />
                  <Route path="/wrap/oracal-651/:id" element={<Oracal651Colors />} />
                  <Route path="/wrap/oracal-670ra" element={<Oracal670 />} />
                  <Route path="/wrap/oracal-670ra/:colorCode" element={<Oracal670ColorPage />} />
                  <Route path="/wrap/metamark-mcx" element={<MetamarkMcx />} />
                  <Route path="/wrap/metamark-7-series" element={<MetamarkM7 />} />
                  <Route path="/sign" element={<Sign />} />
                  <Route path="/sign/:slug" element={<SignProduct />} />
                  <Route path="/decor" element={<Decor />} />
                  <Route path="/decor/sh" element={<ShDecorCatalog />} />
                  <Route path="/decor/sh/:slug" element={<ShDecorProduct />} />
                  <Route path="/decor/etherna" element={<EthernaCatalog />} />
                  <Route path="/decor/etherna/:slug" element={<EthernaProduct />} />
                  <Route path="/sobre" element={<Company />} />
                  <Route path="/encontre-aplicador" element={<FindInstaller />} />
                  <Route path="/blog" element={<BlogList />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  <Route path="/interlagos" element={<Interlagos />} />
                  <Route path="/registro-garantia" element={<WarrantyRegistration />} />
                  <Route path="/validar-garantia" element={<WarrantyValidator />} />
                  <Route path="/contato" element={<Contact />} />
                  <Route path="/privacidade" element={<Privacy />} />
                  <Route path="/termos" element={<Terms />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
            <FloatingWhatsApp />
            <Footer />
          </div>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App;
