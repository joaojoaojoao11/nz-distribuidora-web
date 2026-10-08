// Mostruário da cor — o documento imprimível. Cada `[data-portfolio-page]`
// vira uma página A4 do PDF pelo mesmo rasterizador do portfólio NZPPF
// (generatePpfPortfolioPdf.ts), que procura exatamente esse atributo.
//
// Só é montado durante a geração, fora da tela (ver BotaoMostruario.tsx).
// Capa → fotos por seção (a cor aplicada, a amostra real) → o material, com
// ficha e aviso. A versão "com contato" acrescenta o logo, a Central de Vendas
// e o QR da loja; a "sem contato" não tem nada que leve à NZ. Sem preço nas
// duas: o arquivo é para o cliente final ver a cor, e preço muda.

import { forwardRef, type ReactNode } from 'react';
import type { DadosMostruario, FotoMostruario, LinhaDeFotos, PaginaDeFotos } from './montarMostruario';
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
      {dados.comContato ? <Logo altura={40} /> : <span className={styles.sobretitulo}>Mostruário de cor</span>}
      <span className={styles.cabecalhoCor}>
        {dados.titulo}
        {dados.codigo && <span className={styles.cabecalhoCodigo}>{dados.codigo}</span>}
      </span>
    </header>
  );
}

function Rodape({ dados, n, total }: { dados: DadosMostruario; n: number; total: number }) {
  return (
    <footer className={styles.rodape}>
      <span>{dados.comContato ? `Mostruário de cor · NZ Group · ${dados.data}` : `Mostruário de cor · ${dados.data}`}</span>
      <span>
        {n} / {total}
      </span>
    </footer>
  );
}

function Pagina({ n, children }: { n: number; children: ReactNode }) {
  return (
    <section data-portfolio-page={n} className={styles.pagina}>
      {children}
    </section>
  );
}

function Titulo({ children }: { children: ReactNode }) {
  return <h2 className={styles.h2}>{children}</h2>;
}

/**
 * Foto da capa na largura toda, cortada no centro. O html2canvas não conhece
 * `object-fit`, então o corte é feito na mão: a imagem tem o tamanho dela e a
 * moldura esconde o que sobra.
 */
const CAPA_LARGURA = 1240;
const CAPA_ALTURA_MAX = 820;
function FotoDeCapa({ foto }: { foto: FotoMostruario }) {
  const alturaImg = CAPA_LARGURA / foto.ar;
  const altura = Math.min(CAPA_ALTURA_MAX, alturaImg);
  return (
    <div className={styles.capaFoto} style={{ height: altura }}>
      <img src={foto.src} alt="" style={{ width: CAPA_LARGURA, height: alturaImg, marginTop: (altura - alturaImg) / 2 }} />
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

function PaginaFotos({ dados, pagina, n, total }: { dados: DadosMostruario; pagina: PaginaDeFotos; n: number; total: number }) {
  return (
    <Pagina n={n}>
      <Cabecalho dados={dados} />
      <div className={styles.areaFotos}>
        <div className={styles.secaoTopo}>
          <Titulo>{pagina.titulo}</Titulo>
          {pagina.subtitulo && <p className={styles.subtitulo}>{pagina.subtitulo}</p>}
        </div>
        {pagina.linhas.map((l, j) => (
          <LinhaFotos key={j} linha={l} />
        ))}
      </div>
      <Rodape dados={dados} n={n} total={total} />
    </Pagina>
  );
}

/** Foto do rolo ao lado da ficha: largura fixa, altura pela proporção. */
function FotoDoMaterial({ foto }: { foto: FotoMostruario }) {
  const largura = 380;
  const altura = Math.min(460, largura / foto.ar);
  return (
    <div className={styles.materialFoto} style={{ width: largura, height: altura }}>
      <img src={foto.src} alt="" style={{ width: largura, height: largura / foto.ar, marginTop: (altura - largura / foto.ar) / 2 }} />
    </div>
  );
}

const MostruarioDocumento = forwardRef<HTMLDivElement, { dados: DadosMostruario }>(function MostruarioDocumento(
  { dados },
  ref
) {
  const total = 2 + dados.paginasDeFotos.length;
  const temMaterial = dados.ficha.length > 0 || dados.produto;

  return (
    <div className={styles.palco} ref={ref} aria-hidden="true">
      {/* ---------------------------------------------------------- capa */}
      <Pagina n={1}>
        <header className={styles.capaTopo}>
          {dados.comContato ? <Logo altura={60} /> : <span className={styles.sobretitulo}>Mostruário de cor</span>}
          <span className={styles.sobretitulo}>{dados.comContato ? 'Mostruário de cor' : dados.data}</span>
        </header>

        {dados.capa && <FotoDeCapa foto={dados.capa} />}

        <div className={styles.capaTexto}>
          <div className={styles.marcaLinha}>
            <span className={styles.marca}>{dados.marca}</span>
            {dados.codigo && <span className={styles.codigo}>{dados.codigo}</span>}
          </div>
          <h1 className={styles.titulo}>{dados.titulo}</h1>

          {dados.detalhes.length > 0 && (
            <dl className={styles.detalhes}>
              {dados.detalhes.map((d) => (
                <div key={d.rotulo} className={styles.detalhe}>
                  <dt>{d.rotulo}</dt>
                  <dd>
                    {d.rotulo === 'Cor' && dados.hex && (
                      <span className={styles.bolinha} style={{ background: dados.hex }} />
                    )}
                    {d.valor}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <p className={styles.introducao}>{dados.introducao}</p>
        </div>

        <Rodape dados={dados} n={1} total={total} />
      </Pagina>

      {/* ---------------------------------------------------------- fotos */}
      {dados.paginasDeFotos.map((p, i) => (
        <PaginaFotos key={i} dados={dados} pagina={p} n={i + 2} total={total} />
      ))}

      {/* ---------------------------------------------------------- o material */}
      <Pagina n={total}>
        <Cabecalho dados={dados} />
        <div className={styles.final}>
          {temMaterial && (
            <section>
              <Titulo>O material</Titulo>
              <div className={styles.material}>
                {dados.produto && <FotoDoMaterial foto={dados.produto} />}
                {dados.ficha.length > 0 && (
                  <dl className={dados.produto ? styles.fichaColuna : styles.fichaGrade}>
                    {dados.ficha.map((s) => (
                      <div key={`${s.label}-${s.value}`} className={styles.fichaItem}>
                        <dt>{s.label}</dt>
                        <dd>{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </section>
          )}

          {dados.aplicacoes.length > 0 && (
            <section>
              <Titulo>Onde se aplica</Titulo>
              <ul className={styles.aplicacoes}>
                {dados.aplicacoes.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </section>
          )}

          {dados.sobre && (
            <section>
              <Titulo>{dados.sobreTitulo}</Titulo>
              <p className={styles.paragrafo}>{dados.sobre}</p>
            </section>
          )}

          {/* Com contato, aviso e contato vão para o pé da página. Sem contato
              só sobra o aviso, que fica logo depois da ficha. */}
          <div className={dados.comContato ? styles.fecho : styles.fechoSemContato}>
            <p className={styles.aviso}>
              <strong>Referência de cor.</strong> {dados.aviso}
            </p>

            {dados.comContato && (
              <section className={styles.contato}>
                <div className={styles.contatoTexto}>
                  <Titulo>Fale com a NZ</Titulo>
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
                {dados.qr && (
                  <div className={styles.qr}>
                    <img src={dados.qr} alt="" />
                    <span>Veja esta cor na loja</span>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
        <Rodape dados={dados} n={total} total={total} />
      </Pagina>
    </div>
  );
});

export default MostruarioDocumento;
