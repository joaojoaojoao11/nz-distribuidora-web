// Busca por imagem — o painel da "Lente".
//
// O que ele faz é pequeno e local: lê a foto no navegador, tira as cores
// dominantes (k-means em Lab, src/lib/shop/color/paleta.ts), deixa a pessoa
// escolher uma delas ou tocar num ponto da foto, e devolve UM HEX para a loja
// ordenar o catálogo por distância de cor. Por este caminho a foto nunca sai
// do aparelho.
//
// Em paralelo, se a flag `lente_ia_ativa` estiver ligada, a mesma foto
// reduzida vai a /api/nz/lente, que responde acabamento e padrão no vocabulário
// da loja — o que pixel nenhum diz (fosco × brilhante, carbono, madeira). É
// enriquecimento: se falhar ou demorar, a busca por cor segue igual.
//
// Portal em document.body: a barra de busca é sticky com backdrop-filter, e
// um `position: fixed` dentro dela nasce atrás do conteúdo (a pedra do
// carrinho e da seleção).
//
// Nenhum setState síncrono dentro de efeito: o que depende de prop é derivado
// durante o render (idioma do `qSync` da Loja); o que depende de trabalho
// assíncrono só grava depois do `await`.

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, ImagePlus, Pipette } from 'lucide-react';
import { closeModal, useModalLock } from '../../hooks/useModalLock';
import { reduzirImagem } from '../../lib/imagem/reduzir';
import { analisarImagem, corNoPonto, type ImagemAnalisada } from '../../lib/shop/color/paletaNavegador';
import { COLOR_LABEL } from '../../lib/shop/color/lexicon';
import { FINISH_LABEL, type FinishId } from '../../lib/shop/finish/tree';
import { PATTERN_LABEL, type PatternFamilyId } from '../../lib/shop/pattern/taxonomy';
import {
  imagemDoDataTransfer,
  interpretarImagem,
  type EstadoLeitura,
  type ExtrasDaLente,
} from '../../lib/shop/lente';
import styles from './LenteImagem.module.css';

interface Props {
  /** Foto que chegou por arrastar/colar. `null` = o painel pede uma. */
  arquivoInicial: File | null;
  onFechar: () => void;
  /** `hex` sem `#`, minúsculo; `null` só no caso do filme transparente. */
  onBuscar: (hex: string | null, extras?: ExtrasDaLente) => void;
}

/** Lado maior da foto que vai ao modelo e serve de pré-visualização. */
const LADO_ENVIO = 768;

type Leitura = EstadoLeitura | { estado: 'consultando' };

interface Resultado {
  preview: string;
  analise: ImagemAnalisada;
}

function mensagemDeErro(e: unknown): string {
  const m = e instanceof Error ? e.message : '';
  if (m === 'nao-imagem') return 'Isso não é uma imagem. Mande uma foto em JPG, PNG ou WebP.';
  if (m === 'imagem-grande-demais') return 'A imagem é grande demais. Tire um print ou reduza antes.';
  return 'Não consegui ler esta imagem. Se for HEIC do iPhone, tire um print da foto ou converta para JPG.';
}

export default function LenteImagem({ arquivoInicial, onFechar, onBuscar }: Props) {
  const [arquivo, setArquivo] = useState<File | null>(arquivoInicial);
  // Prop nova (colou outra imagem com o painel aberto) vira arquivo novo —
  // derivado no render, não em efeito.
  const [inicialVisto, setInicialVisto] = useState(arquivoInicial);
  if (inicialVisto !== arquivoInicial) {
    setInicialVisto(arquivoInicial);
    if (arquivoInicial) setArquivo(arquivoInicial);
  }

  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [erro, setErro] = useState('');
  const [leitura, setLeitura] = useState<Leitura | null>(null);
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const [pontoHex, setPontoHex] = useState<string | null>(null);
  const [acabamentos, setAcabamentos] = useState<FinishId[]>([]);
  const [padrao, setPadrao] = useState<PatternFamilyId | null>(null);
  const [arrastando, setArrastando] = useState(false);
  // Trocar de arquivo zera tudo o que era do anterior — no render.
  const [arquivoVisto, setArquivoVisto] = useState<File | null>(arquivoInicial);
  if (arquivoVisto !== arquivo) {
    setArquivoVisto(arquivo);
    setResultado(null);
    setErro('');
    setLeitura(null);
    setEscolhida(null);
    setPontoHex(null);
    setAcabamentos([]);
    setPadrao(null);
  }

  const caixaRef = useRef<HTMLDivElement>(null);
  const pendente = useRef<(() => void) | null>(null);

  // Fechar passa pelo histórico quando o hook empilhou a sentinela (no Android
  // o botão voltar fecha o painel). O que estiver pendente — a busca — roda
  // depois que o painel saiu.
  const aoFechar = () => {
    const acao = pendente.current;
    pendente.current = null;
    onFechar();
    acao?.();
  };
  useModalLock(true, aoFechar);
  const fechar = () => closeModal(aoFechar);
  const concluir = (hex: string | null, extras?: ExtrasDaLente) => {
    pendente.current = () => onBuscar(hex, extras);
    closeModal(aoFechar);
  };

  useEffect(() => {
    caixaRef.current?.focus();
  }, []);

  // Lê a foto: reduz para o envio/preview e extrai a paleta, em paralelo.
  // Depois, sem esperar, pergunta ao modelo (se a flag estiver ligada).
  useEffect(() => {
    if (!arquivo) return;
    let vivo = true;
    const tarefa = async () => {
      try {
        if (!arquivo.type.startsWith('image/')) throw new Error('nao-imagem');
        const [reduzida, analise] = await Promise.all([
          reduzirImagem(arquivo, LADO_ENVIO),
          analisarImagem(arquivo),
        ]);
        if (!vivo) return;
        setResultado({ preview: `data:image/jpeg;base64,${reduzida.base64}`, analise });
        setLeitura({ estado: 'consultando' });
        const r = await interpretarImagem(reduzida.base64, 'image/jpeg');
        if (!vivo) return;
        setLeitura(r);
        if (r.estado === 'ok') {
          setAcabamentos(r.leitura.acabamentos);
          setPadrao(r.leitura.familiaPadrao);
        }
      } catch (e) {
        if (vivo) setErro(mensagemDeErro(e));
      }
    };
    void tarefa();
    return () => {
      vivo = false;
    };
  }, [arquivo]);

  const analise = resultado?.analise ?? null;
  const processando = Boolean(arquivo) && !resultado && !erro;
  const corAtiva = escolhida ?? analise?.paleta[0]?.hex ?? null;
  const leituraOk = leitura?.estado === 'ok' ? leitura.leitura : null;
  const transparente = Boolean(leituraOk?.transparente);

  // Só manda extras quando o modelo leu: sem leitura, os filtros da pessoa
  // ficam como estão.
  const extras: ExtrasDaLente | undefined = leituraOk
    ? { finishes: acabamentos, patterns: padrao ? [padrao] : [] }
    : undefined;

  const receberArquivo = (f: File | null) => {
    if (f) setArquivo(f);
  };
  const aoEscolherArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    receberArquivo(e.target.files?.[0] ?? null);
    // Permite escolher o mesmo arquivo de novo.
    e.target.value = '';
  };

  const tocarNaFoto = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!analise) return;
    const r = e.currentTarget.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const hex = corNoPonto(analise, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    if (hex) {
      setPontoHex(hex);
      setEscolhida(hex);
    }
  };

  const buscar = () => {
    if (!corAtiva) return;
    concluir(corAtiva.replace('#', '').toLowerCase(), extras);
  };

  const familiasTexto = leituraOk?.familias.map((f) => COLOR_LABEL[f]).join(' / ') ?? '';

  return createPortal(
    <div className={styles.veu} onClick={fechar} role="presentation">
      <div
        ref={caixaRef}
        className={styles.caixa}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lente-titulo"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.cabecalho}>
          <Camera size={18} strokeWidth={1.8} aria-hidden="true" />
          <h2 id="lente-titulo" className={styles.titulo}>
            Buscar por imagem
          </h2>
          <button type="button" className={styles.fechar} onClick={fechar} aria-label="Fechar">
            ✕
          </button>
        </div>

        {!arquivo || erro ? (
          <>
            <div
              className={`${styles.zona} ${arrastando ? styles.zonaArrasto : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                if (!arrastando) setArrastando(true);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
                setArrastando(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setArrastando(false);
                receberArquivo(imagemDoDataTransfer(e.dataTransfer));
              }}
            >
              <ImagePlus size={30} strokeWidth={1.4} aria-hidden="true" />
              <p className={styles.zonaTitulo}>Arraste uma foto aqui</p>
              <p className={styles.zonaTexto}>ou cole com Ctrl+V uma imagem copiada</p>
              <div className={styles.zonaAcoes}>
                <label className={styles.botaoSec}>
                  <input type="file" accept="image/*" className={styles.inputOculto} onChange={aoEscolherArquivo} />
                  ESCOLHER ARQUIVO
                </label>
                <label className={`${styles.botaoSec} ${styles.tirarFoto}`}>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className={styles.inputOculto}
                    onChange={aoEscolherArquivo}
                  />
                  <Camera size={15} strokeWidth={1.8} aria-hidden="true" />
                  TIRAR FOTO
                </label>
              </div>
            </div>
            {erro && (
              <p className={styles.erro} role="alert">
                {erro}
              </p>
            )}
          </>
        ) : (
          <div className={styles.lida}>
            {processando ? (
              <p className={styles.processando}>Lendo as cores da foto…</p>
            ) : (
              resultado && (
                <>
                  {/* O tamanho da imagem É o tamanho do elemento (sem object-fit),
                      senão o toque cairia no ponto errado. */}
                  <img
                    src={resultado.preview}
                    alt=""
                    className={styles.preview}
                    onClick={tocarNaFoto}
                    title="Toque num ponto para pegar a cor dele"
                  />
                  {resultado.analise.paleta.length > 0 && (
                    <>
                      <div className={styles.paleta} role="radiogroup" aria-label="Cores encontradas na foto">
                        {resultado.analise.paleta.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            role="radio"
                            aria-checked={corAtiva === c.hex}
                            className={`${styles.swatch} ${corAtiva === c.hex ? styles.swatchAtiva : ''}`}
                            style={{ background: c.hex }}
                            onClick={() => setEscolhida(c.hex)}
                            title={`${c.hex.toUpperCase()} · ${Math.round(c.peso * 100)}% da foto`}
                          >
                            <span className={styles.swatchPeso}>{Math.round(c.peso * 100)}%</span>
                          </button>
                        ))}
                        {pontoHex && !resultado.analise.paleta.some((c) => c.hex === pontoHex) && (
                          <button
                            type="button"
                            role="radio"
                            aria-checked={corAtiva === pontoHex}
                            className={`${styles.swatch} ${corAtiva === pontoHex ? styles.swatchAtiva : ''}`}
                            style={{ background: pontoHex }}
                            onClick={() => setEscolhida(pontoHex)}
                            title={`${pontoHex.toUpperCase()} · ponto tocado`}
                          >
                            <Pipette size={13} strokeWidth={2} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                      {corAtiva && (
                        <p className={styles.corAtiva}>
                          <span className={styles.corAtivaSwatch} style={{ background: corAtiva }} aria-hidden="true" />
                          <span className={styles.corAtivaHex}>{corAtiva.toUpperCase()}</span>
                          <span className={styles.dica}>· toque na foto para pegar outra cor</span>
                        </p>
                      )}
                    </>
                  )}

                  {leitura?.estado === 'consultando' && <p className={styles.leitura}>Lendo o material…</p>}
                  {leituraOk && !transparente && (
                    <div className={styles.leitura}>
                      <span className={styles.leituraTitulo}>Entendi:</span>{' '}
                      <span className={styles.leituraTexto}>{leituraOk.descricao || familiasTexto}</span>
                      {(acabamentos.length > 0 || padrao) && (
                        <div className={styles.chips}>
                          {acabamentos.map((a) => (
                            <button
                              key={a}
                              type="button"
                              className={styles.chip}
                              onClick={() => setAcabamentos((l) => l.filter((x) => x !== a))}
                              aria-label={`Tirar o filtro ${FINISH_LABEL[a]}`}
                            >
                              {FINISH_LABEL[a]} <span aria-hidden="true">✕</span>
                            </button>
                          ))}
                          {padrao && (
                            <button
                              type="button"
                              className={styles.chip}
                              onClick={() => setPadrao(null)}
                              aria-label={`Tirar o filtro ${PATTERN_LABEL[padrao]}`}
                            >
                              {PATTERN_LABEL[padrao]} <span aria-hidden="true">✕</span>
                            </button>
                          )}
                          <span className={styles.dica}>entram junto com a cor · toque para tirar</span>
                        </div>
                      )}
                    </div>
                  )}
                  {leituraOk && transparente && (
                    <div className={styles.leitura}>
                      <span className={styles.leituraTitulo}>Parece um filme transparente.</span>{' '}
                      <span className={styles.leituraTexto}>Cor não ajuda aqui; veja a linha de proteção.</span>
                      <div className={styles.chips}>
                        <button
                          type="button"
                          className={styles.chip}
                          onClick={() => concluir(null, { colors: ['transparente'], finishes: [], patterns: [] })}
                        >
                          VER TRANSPARENTES →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )
            )}
          </div>
        )}

        <label className={styles.manual}>
          <Pipette size={14} strokeWidth={1.8} aria-hidden="true" />
          <span>{arquivo && !erro ? 'Ou ajuste a cor na mão' : 'Ou escolha a cor na mão'}</span>
          <input
            type="color"
            className={styles.manualInput}
            value={corAtiva ?? '#1f63b8'}
            onChange={(e) => setEscolhida(e.target.value)}
            aria-label="Escolher cor manualmente"
          />
        </label>

        <p className={styles.aviso}>A cor da foto depende da luz. Confirme no mostruário físico antes de fechar.</p>

        <div className={styles.acoes}>
          <button
            type="button"
            className={styles.cancelar}
            onClick={arquivo && !erro ? () => setArquivo(null) : fechar}
          >
            {arquivo && !erro ? 'TROCAR IMAGEM' : 'CANCELAR'}
          </button>
          <button type="button" className={styles.principal} disabled={!corAtiva} onClick={buscar}>
            BUSCAR ESSA COR
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
