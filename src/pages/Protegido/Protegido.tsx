// /s — a página que abre quando alguém escaneia o QR do selo NZPPF colado no
// batente da porta (22/10/2026). O QR é o MESMO em todos os selos
// (HTTPS://NZGROUP.COM.BR/S, em caixa-alta: a rota não diferencia); /s/<código>
// (o QR antigo, de selo único) redireciona para cá. Fora do menu e do Google
// (noindex): a página é só de quem escaneou.
//
// Celular primeiro. Movimento em SVG/CSS + framer-motion, sem vídeo nem 3D
// pesado: o QR costuma ser lido na garagem, às vezes no 4G. Quem pediu
// "reduzir movimento" no aparelho vê tudo parado (movimento.ts).
// Cada abertura conta uma vez por sessão em selo_escaneios
// (migrations/2026-10-22c_selo_escaneios.sql), sem dado de quem escaneou; o
// localhost não conta.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarClock, Check, Droplets, Leaf, MapPin, MessageCircle, Share2, ShieldCheck, Waves } from 'lucide-react';
import SEO from '../../components/SEO/SEO';
import { supabase } from '../../lib/supabase';
import { SITE_URL } from '../../lib/siteConfig';
import { VENDAS, linkWhatsApp } from '../../lib/contatos';
import Cabecalho from './Cabecalho';
import Camadas from './Camadas';
import Guilloche from './Guilloche';
import Linhas from './Linhas';
import Manifesto from './Manifesto';
import Poderes from './Poderes';
import SeloHolo from './SeloHolo';
import { CUIDADOS } from './protegidoConfig';
import { useMovimento } from './movimento';
import s from './Protegido.module.css';

const SUAVE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const ICONES_CUIDADO = [CalendarClock, Droplets, Waves, Leaf];

export default function Protegido() {
  const movimento = useMovimento();

  useEffect(() => {
    if (import.meta.env.DEV) return;
    try {
      if (sessionStorage.getItem('nz:selo-escaneio')) return;
      sessionStorage.setItem('nz:selo-escaneio', '1');
    } catch {
      /* sem sessionStorage: conta mesmo assim */
    }
    void supabase.rpc('registrar_escaneio_selo').then(() => undefined);
  }, []);

  return (
    <div className={`${s.pagina} ${movimento ? '' : s.parado}`}>
      <SEO
        title="Veículo protegido com NZPPF"
        description="Este veículo tem NZPPF, a melhor solução de PPF do Brasil. Conheça as linhas e os cuidados com o seu PPF."
        canonicalUrl="/s"
        imageUrl="/assets/images/protegido/og-protegido.jpg"
        noindex
      />

      <header className={s.topo}>
        <Link to="/ppf" aria-label="NZPPF">
          <img src="/assets/images/protegido/logo-nzppf.svg" alt="NZPPF" />
        </Link>
      </header>

      <Heroi movimento={movimento} />
      <Manifesto movimento={movimento} />
      <Poderes movimento={movimento} />
      <Camadas movimento={movimento} />
      <Linhas movimento={movimento} />
      <Cuidados movimento={movimento} />
      <Garantia movimento={movimento} />
      <Fecho movimento={movimento} />
    </div>
  );
}

function Heroi({ movimento }: { movimento: boolean }) {
  const linha = (i: number) =>
    movimento
      ? { initial: { y: '108%' }, animate: { y: '0%' }, transition: { duration: 0.9, delay: 0.15 + i * 0.1, ease: SUAVE } }
      : {};
  const surge = (atraso: number) =>
    movimento ? { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay: atraso, ease: SUAVE } } : {};

  return (
    <section className={s.heroi}>
      <div className={s.heroiFundo} aria-hidden="true" />
      <div className={s.heroiGui} aria-hidden="true">
        <Guilloche className={s.heroiGuiSvg} movimento={movimento} atraso={0.1} />
      </div>
      <div className={s.heroiGrade}>
        <div className={s.heroiTexto}>
          <motion.span className={s.olho} {...surge(0.05)}>
            Selo de garantia NZPPF
          </motion.span>
          <h1 className={s.titulo}>
            <span className={s.tituloLinha}>
              <motion.span {...linha(0)}>Este veículo está</motion.span>
            </span>
            <span className={s.tituloLinha}>
              <motion.span className={s.holoTexto} {...linha(1)}>
                protegido.
              </motion.span>
            </span>
          </h1>
          <motion.p className={s.sub} {...surge(0.45)}>
            Cada detalhe que você vê ganhou uma camada que você não vê: <strong>NZPPF, a melhor solução de PPF do Brasil.</strong>
          </motion.p>
          <motion.span className={s.rolar} {...surge(0.9)} aria-hidden="true">
            Role para ver
            <span className={s.rolarLinha} />
          </motion.span>
        </div>
        <SeloHolo movimento={movimento} />
      </div>
    </section>
  );
}

function Cuidados({ movimento }: { movimento: boolean }) {
  return (
    <section className={s.secao} aria-labelledby="cuidados-titulo">
      <Cabecalho id="cuidados-titulo" olho="Para durar ainda mais" titulo="Quatro cuidados simples." movimento={movimento} />
      <ol className={s.cuidadosGrade}>
        {CUIDADOS.map((c, i) => {
          const Icone = ICONES_CUIDADO[i];
          return (
            <motion.li
              key={c.titulo}
              className={s.cuidado}
              initial={movimento ? { opacity: 0, y: 24 } : false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.7, delay: (i % 2) * 0.08, ease: SUAVE }}
            >
              <span className={s.cuidadoIcone} aria-hidden="true">
                <Icone size={20} />
              </span>
              <span>
                <strong className={s.cuidadoTitulo}>{c.titulo}</strong>
                <span className={s.cuidadoTexto}>{c.texto}</span>
              </span>
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}

function Garantia({ movimento }: { movimento: boolean }) {
  return (
    <section className={s.secao}>
      <motion.div
        className={s.garantia}
        initial={movimento ? { opacity: 0, y: 32 } : false}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9, ease: SUAVE }}
      >
        <span className={s.garantiaIcone} aria-hidden="true">
          <ShieldCheck size={26} />
        </span>
        <h2 className={s.h2}>A garantia está registrada na NZ.</h2>
        <p className={s.garantiaTexto}>
          Quem aplicou registrou a garantia no site da NZ. Depois de aprovada, o certificado chega ao e-mail do dono do veículo, com o código para consultar quando
          quiser.
        </p>
        <Link to="/validar-garantia" className={s.botao}>
          Consultar minha garantia
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </motion.div>
    </section>
  );
}

function Fecho({ movimento }: { movimento: boolean }) {
  const [copiado, setCopiado] = useState(false);
  const compartilhar = async () => {
    const dados = { title: 'NZPPF', text: 'Meu carro está protegido com NZPPF, a melhor solução de PPF do Brasil.', url: `${SITE_URL}/ppf` };
    if (navigator.share) {
      try {
        await navigator.share(dados);
      } catch {
        /* a pessoa fechou o compartilhamento */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${dados.text} ${dados.url}`);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2400);
    } catch {
      /* sem área de transferência: nada a fazer */
    }
  };

  return (
    <footer className={s.fecho}>
      <div className={s.fechoGui} aria-hidden="true">
        <Guilloche className={s.heroiGuiSvg} movimento={false} />
      </div>
      <Cabecalho olho="Gostou do que viu?" titulo="Leve a mesma proteção para o seu carro." centro movimento={movimento} />
      <div className={s.fechoBotoes}>
        <Link to="/encontre-aplicador" className={s.botao}>
          <MapPin size={18} aria-hidden="true" />
          Encontrar um instalador
        </Link>
        <a
          href={linkWhatsApp(VENDAS[0]!, 'Olá! Escaneei o selo NZPPF de um carro e quero saber mais sobre o PPF.')}
          target="_blank"
          rel="noopener noreferrer"
          className={s.botaoSec}
        >
          <MessageCircle size={18} aria-hidden="true" />
          Falar com a NZ
        </a>
        <button type="button" className={s.botaoSec} onClick={() => void compartilhar()}>
          {copiado ? <Check size={18} aria-hidden="true" /> : <Share2 size={18} aria-hidden="true" />}
          {copiado ? 'Link copiado' : 'Compartilhar'}
        </button>
      </div>
      <div className={s.assinatura}>
        <img src="/assets/images/protegido/logo-nzgroup.svg" alt="NZ GROUP" className={s.assinaturaLogo} />
        <p className={s.slogan}>Made for those who take quality seriously.</p>
      </div>
      <nav className={s.rodape} aria-label="NZ GROUP">
        <Link to="/ppf">Conheça o NZPPF</Link>
        <Link to="/">nzgroup.com.br</Link>
      </nav>
    </footer>
  );
}
