// /wrap/motos — Ação Moto (no menu NZWRAP; /motos redireciona): vitrine das cores que têm pedaço (ponta no pátio da NZ ou
// estoque do parceiro), com 3 fotos de moto envelopada cada. O objetivo é fazer
// os fracionados saírem: moto pede 2 a 4 metros, exatamente o tamanho de um
// pedaço que não serve mais para carro inteiro. Pedido do João em 2026-10-03.
//
// A metragem disponível NÃO aparece aqui (é dado de admin). A lista vem de
// motosCores.ts; o preço e o estoque continuam na página de cada produto.
// Só vitrine, sem condição comercial própria (João, 03/10).

import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO/SEO';
import { SITE_URL, SITE_WHATSAPP } from '../../lib/siteConfig';
import { CORES_MOTO, fotoMoto, type CorMoto } from './motosCores';
import styles from './AcaoMotos.module.css';

const METRAGEM = [
  { tipo: 'Naked', metros: '2 a 3 m', detalhe: 'Tanque, laterais, rabeta e paralama' },
  { tipo: 'Esportiva carenada', metros: '3 a 4 m', detalhe: 'Carenagem completa, tanque e rabeta' },
  { tipo: 'Big trail', metros: '3 a 4 m', detalhe: 'Tanque, carenagens laterais, bico e paralamas' },
];

const HERO = CORES_MOTO.find((c) => c.sku === 'SPWECC005') ?? CORES_MOTO[0];

export default function AcaoMotos() {
  return (
    <main className={styles.page}>
      <SEO
        title="Ação Moto — Envelopamento de Moto com Metragem Fracionada"
        description={`Cores de envelopamento em metragem fracionada para tanque, carenagens e paralamas: ${CORES_MOTO.length} cores com fotos em moto, Speed Wrapping, Oracal 670RA e Metamark MCX.`}
        canonicalUrl={`${SITE_URL}/wrap/motos`}
        imageUrl={`${SITE_URL}${fotoMoto(HERO.slug, 1)}`}
      />

      <section className={styles.hero}>
        <img className={styles.heroImg} src={fotoMoto(HERO.slug, 1)} alt={`Moto envelopada com ${HERO.marca} ${HERO.codigo} ${HERO.cor}`} />
        <div className={styles.heroVeu} aria-hidden="true" />
        <div className={styles.heroTexto}>
          <p className={styles.eyebrow}>Ação Moto · NZ</p>
          <h1 className={styles.titulo}>Cor nova na sua moto, com a metragem certa.</h1>
          <p className={styles.sub}>
            Separamos as cores que temos em metragem fracionada: pedaços prontos para tanque,
            carenagens, rabeta e paralama. Você leva só o que a moto pede.
          </p>
          <div className={styles.ctas}>
            <a className={styles.ctaPrimario} href="#cores">Ver as {CORES_MOTO.length} cores</a>
            <a className={styles.ctaSecundario} href={SITE_WHATSAPP} target="_blank" rel="noopener noreferrer">
              Chamar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className={styles.secao} aria-labelledby="metragem-titulo">
        <h2 id="metragem-titulo" className={styles.secaoTitulo}>Quanto filme vai numa moto</h2>
        <ul className={styles.metragem}>
          {METRAGEM.map((m) => (
            <li key={m.tipo} className={styles.metragemItem}>
              <span className={styles.metragemTipo}>{m.tipo}</span>
              <strong className={styles.metragemMetros}>{m.metros}</strong>
              <span className={styles.metragemDetalhe}>{m.detalhe}</span>
            </li>
          ))}
        </ul>
        <p className={styles.nota}>
          Referência com rolo de 1,52 m de largura. Cada moto é uma moto: mande o modelo no
          WhatsApp e a gente confirma a metragem antes do corte.
        </p>
      </section>

      <section id="cores" className={styles.secao} aria-labelledby="cores-titulo">
        <h2 id="cores-titulo" className={styles.secaoTitulo}>As cores da ação</h2>
        <p className={styles.nota}>
          Metragem limitada ao que está separado: quando um pedaço sai, a cor pode sair da lista.
        </p>
        <ul className={styles.grade}>
          {CORES_MOTO.map((c) => (
            <CartaoCor key={c.sku} cor={c} />
          ))}
        </ul>
      </section>

      <section className={styles.final}>
        <h2 className={styles.secaoTitulo}>Escolheu a cor?</h2>
        <p className={styles.sub}>Mande o modelo da moto e a cor. A gente separa o pedaço e envia.</p>
        <a className={styles.ctaPrimario} href={SITE_WHATSAPP} target="_blank" rel="noopener noreferrer">
          Falar com a NZ no WhatsApp
        </a>
      </section>
    </main>
  );
}

const VISTAS = ['3/4 de frente', 'perfil', 'detalhe do tanque'] as const;

function CartaoCor({ cor }: { cor: CorMoto }) {
  const [foto, setFoto] = useState<1 | 2 | 3>(1);
  const nome = `${cor.marca} ${cor.codigo} ${cor.cor}`;

  return (
    <li className={styles.cartao}>
      <img
        className={styles.cartaoImg}
        src={fotoMoto(cor.slug, foto)}
        alt={`Moto envelopada com ${nome}, ${VISTAS[foto - 1]}`}
        loading="lazy"
        width={1024}
        height={688}
      />
      <div className={styles.miniaturas} role="group" aria-label={`Fotos de ${nome}`}>
        {([1, 2, 3] as const).map((n) => (
          <button
            key={n}
            type="button"
            className={`${styles.miniatura} ${n === foto ? styles.miniaturaAtiva : ''}`}
            onClick={() => setFoto(n)}
            aria-pressed={n === foto}
            aria-label={`Ver ${VISTAS[n - 1]}`}
          >
            <img src={fotoMoto(cor.slug, n)} alt="" loading="lazy" />
          </button>
        ))}
      </div>
      <div className={styles.cartaoTexto}>
        <span className={styles.cartaoMarca}>{cor.marca} · {cor.codigo}</span>
        <h3 className={styles.cartaoCor}>{cor.cor}</h3>
        <Link className={styles.cartaoLink} to={`/loja/${cor.slug}`}>
          Ver na loja
        </Link>
      </div>
    </li>
  );
}
