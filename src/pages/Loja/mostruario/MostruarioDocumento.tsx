// Mostruário da cor — o documento imprimível. Cada `[data-portfolio-page]`
// vira uma página A4 do PDF pelo mesmo rasterizador do portfólio NZPPF
// (generatePpfPortfolioPdf.ts), que procura exatamente esse atributo.
//
// Só é montado durante a geração, fora da tela (ver BotaoMostruario.tsx).
// Capa → páginas de fotos → ficha e contato. Sem preço: o arquivo é para o
// cliente final ver a cor, e preço muda.

import { forwardRef, type ReactNode } from 'react';
import type { DadosMostruario, LinhaDeFotos } from './montarMostruario';
import styles from './Mostruario.module.css';

const LOGO = '/assets/logos/logo-nz-completo-branco.svg';
/** O SVG é um quadrado de 810 com a marca no meio (176–631 × 267–505). */
const LOGO_CAIXA = { lado: 810, x: 176, y: 267, largura: 455, altura: 238 };

/** Logo recortado na marca: no quadrado inteiro ele sai com um terço do tamanho. */
function Logo({ altura }: { altura: number }) {
  const k = altura / LOGO_CAIXA.altura;
  return (
    <span className={styles.logoMoldura} style={{ width: LOGO_CAIXA.largura * k, height: altura }}>
      <img
        src={LOGO}
        alt=""
        style={{
          width: LOGO_CAIXA.lado * k,
          height: LOGO_CAIXA.lado * k,
          marginLeft: -LOGO_CAIXA.x * k,
          marginTop: -LOGO_CAIXA.y * k,
        }}
      />
    </span>
  );
}

function Cabecalho({ dados }: { dados: DadosMostruario }) {
  return (
    <header className={styles.cabecalho}>
      <Logo altura={40} />
      <span className={styles.cabecalhoCor}>
        {dados.nome}
        {dados.codigo && <span className={styles.cabecalhoCodigo}>{dados.codigo}</span>}
      </span>
    </header>
  );
}

function Rodape({ dados, n, total }: { dados: DadosMostruario; n: number; total: number }) {
  return (
    <footer className={styles.rodape}>
      <span>Mostruário de cor · NZ Group · {dados.data}</span>
      <span>
        {n} / {total}
      </span>
    </footer>
  );
}

function Pagina({ n, children, className }: { n: number; children: ReactNode; className?: string }) {
  return (
    <section data-portfolio-page={n} className={`${styles.pagina} ${className ?? ''}`}>
      {children}
    </section>
  );
}

/**
 * Foto da capa na largura toda, cortada no centro. O html2canvas não conhece
 * `object-fit`, então o corte é feito na mão: a imagem tem o tamanho dela e a
 * moldura esconde o que sobra.
 */
const CAPA_LARGURA = 1240;
const CAPA_ALTURA_MAX = 860;
function FotoDeCapa({ src, ar }: { src: string; ar: number }) {
  const alturaImg = CAPA_LARGURA / ar;
  const altura = Math.min(CAPA_ALTURA_MAX, alturaImg);
  return (
    <div className={styles.capaFoto} style={{ height: altura }}>
      <img src={src} alt="" style={{ width: CAPA_LARGURA, height: alturaImg, marginTop: (altura - alturaImg) / 2 }} />
    </div>
  );
}

function LinhaFotos({ linha }: { linha: LinhaDeFotos }) {
  return (
    <div className={styles.linhaFotos}>
      <div className={styles.fotos} style={{ height: linha.altura }}>
        {linha.fotos.map((f) => (
          <figure key={f.src} className={styles.foto} style={{ width: f.largura, height: linha.altura }}>
            <img src={f.src} alt="" />
            {!linha.legendaUnica && f.legenda && <figcaption className={styles.legenda}>{f.legenda}</figcaption>}
          </figure>
        ))}
      </div>
      {linha.legendaUnica && <p className={styles.legendaUnica}>{linha.legendaUnica}</p>}
    </div>
  );
}

const MostruarioDocumento = forwardRef<HTMLDivElement, { dados: DadosMostruario }>(function MostruarioDocumento(
  { dados },
  ref
) {
  const total = 2 + dados.paginasDeFotos.length;
  const temFicha = dados.ficha.length > 0 || dados.fichaLinha.length > 0;

  return (
    <div className={styles.palco} ref={ref} aria-hidden="true">
      {/* ---------------------------------------------------------- capa */}
      <Pagina n={1}>
        <header className={styles.capaTopo}>
          <Logo altura={64} />
          <span className={styles.selo}>Mostruário de cor</span>
        </header>

        {dados.capa && <FotoDeCapa src={dados.capa.src} ar={dados.capa.ar} />}

        <div className={styles.capaTexto}>
          <p className={styles.linhaRotulo}>{dados.linha}</p>
          <h1 className={styles.nome}>{dados.nome}</h1>
          <div className={styles.etiquetas}>
            {dados.codigo && <span className={styles.codigo}>{dados.codigo}</span>}
            {dados.acabamento && <span className={styles.etiqueta}>{dados.acabamento}</span>}
            {dados.familia && <span className={styles.etiqueta}>{dados.familia}</span>}
            {dados.hex && (
              <span className={styles.hex}>
                <span className={styles.bolinha} style={{ background: dados.hex }} />
                {dados.hex.toUpperCase()} aproximado
              </span>
            )}
          </div>
          <p className={styles.textoCapa}>{dados.textoCapa}</p>
        </div>

        <Rodape dados={dados} n={1} total={total} />
      </Pagina>

      {/* ---------------------------------------------------------- fotos */}
      {dados.paginasDeFotos.map((linhas, i) => (
        <Pagina key={i} n={i + 2}>
          <Cabecalho dados={dados} />
          <div className={styles.areaFotos}>
            {linhas.map((l, j) => (
              <LinhaFotos key={j} linha={l} />
            ))}
          </div>
          <Rodape dados={dados} n={i + 2} total={total} />
        </Pagina>
      ))}

      {/* ---------------------------------------------------------- ficha e contato */}
      <Pagina n={total}>
        <Cabecalho dados={dados} />
        <div className={styles.final}>
          {dados.sobre && (
            <section>
              <h2 className={styles.h2}>Sobre {dados.fichaLinhaLabel ? `a linha ${dados.fichaLinhaLabel}` : 'a cor'}</h2>
              <p className={styles.paragrafo}>{dados.sobre}</p>
            </section>
          )}

          {temFicha && (
            <section>
              <h2 className={styles.h2}>Ficha técnica</h2>
              <dl className={styles.ficha}>
                {[...dados.ficha, ...dados.fichaLinha].map((s) => (
                  <div key={`${s.label}-${s.value}`} className={styles.fichaItem}>
                    <dt>{s.label}</dt>
                    <dd>{s.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {dados.aplicacoes.length > 0 && (
            <section>
              <h2 className={styles.h2}>Onde se aplica</h2>
              <p className={styles.paragrafo}>{dados.aplicacoes.join(' · ')}</p>
            </section>
          )}

          <div className={styles.fecho}>
          <p className={styles.aviso}>
            As cores em tela e em impressão são aproximadas. A amostra física é a única referência fiel: peça a sua
            junto com o orçamento.
          </p>

          <section className={styles.contato}>
            <div className={styles.contatoTexto}>
              <h2 className={styles.h2}>Fale com a NZ</h2>
              <ul className={styles.telefones}>
                {dados.contatos.map((c) => (
                  <li key={c.telefone}>
                    <span>{c.nome}</span>
                    <strong>{c.exibicao}</strong>
                  </li>
                ))}
              </ul>
              <p className={styles.endereco}>
                WhatsApp · NZ Group · Barueri-SP
                <br />
                www.nzgroup.com.br · @nzgroup.br
              </p>
            </div>
            <div className={styles.qr}>
              <img src={dados.qr} alt="" />
              <span>Veja esta cor na loja</span>
            </div>
          </section>
          </div>
        </div>
        <Rodape dados={dados} n={total} total={total} />
      </Pagina>
    </div>
  );
});

export default MostruarioDocumento;
