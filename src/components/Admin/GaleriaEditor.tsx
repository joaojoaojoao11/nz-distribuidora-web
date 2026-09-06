// Galeria do produto: arrastar para subir, arrastar para reordenar, marcar
// capa, escrever o alt, apagar. Fotos, vídeo curto e vídeo por link.
//
// A conversão para WebP acontece no navegador (src/lib/admin/midia.ts) antes de
// qualquer byte sair da máquina — a Vercel Hobby não aguentaria receber os
// originais e o Supabase Free não redimensiona.
//
// Reordenar é drag-and-drop nativo do HTML5 (sem biblioteca) com alternativa de
// teclado nos botões ← →: quem cadastra 300 cores faz isso com a mão cansada.

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  LIMITES,
  MIME_IMAGEM,
  MIME_VIDEO,
  MidiaErro,
  apagarDoBucket,
  avaliarConjunto,
  avaliarMidia,
  caminhoNoBucket,
  enviarBlob,
  formatarBytes,
  lerVideoExterno,
  processarImagem,
  processarVideo,
  type Midia,
} from '../../lib/admin/midia';
import styles from './GaleriaEditor.module.css';

interface Props {
  produtoId: string;
  slug: string;
  /** Avisa o editor para atualizar a pré-visualização. */
  onMudou?: (midias: Midia[]) => void;
}

interface ItemFila {
  id: string;
  nome: string;
  progresso: number;
  erro?: string;
}

const CAMPOS = 'id, produto_id, tipo, url, poster_url, alt, ordem, capa, largura, altura, duracao_s, tamanho_bytes, origem';

export default function GaleriaEditor({ produtoId, slug, onMudou }: Props) {
  const [midias, setMidias] = useState<Midia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [fila, setFila] = useState<ItemFila[]>([]);
  const [erro, setErro] = useState('');
  const [sobre, setSobre] = useState(false);
  const [link, setLink] = useState('');
  const arrastado = useRef<string | null>(null);
  const [alvo, setAlvo] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from('produto_midia')
      .select(CAMPOS)
      .eq('produto_id', produtoId)
      .order('capa', { ascending: false })
      .order('ordem');
    if (error) setErro(error.message);
    const lista = (data ?? []) as Midia[];
    setMidias(lista);
    setCarregando(false);
    onMudou?.(lista);
  }, [produtoId, onMudou]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // ------------------------------------------------------------- upload
  const receber = async (arquivos: File[]) => {
    setErro('');
    let ordem = midias.length;
    const temCapa = midias.some((m) => m.capa);

    for (const file of arquivos) {
      const chave = `${file.name}-${Date.now()}-${Math.random()}`;
      setFila((f) => [...f, { id: chave, nome: file.name, progresso: 5 }]);
      const andar = (p: number) => setFila((f) => f.map((x) => (x.id === chave ? { ...x, progresso: p } : x)));

      try {
        if (MIME_VIDEO.includes(file.type)) {
          const v = await processarVideo(file);
          andar(35);
          const urlVideo = await enviarBlob(caminhoNoBucket(slug, file.type === 'video/webm' ? 'webm' : 'mp4'), v.arquivo, file.type);
          andar(75);
          const urlPoster = await enviarBlob(caminhoNoBucket(slug, 'webp', '-poster'), v.poster, 'image/webp');
          andar(92);
          const { error } = await supabase.from('produto_midia').insert({
            produto_id: produtoId,
            tipo: 'video',
            url: urlVideo,
            poster_url: urlPoster,
            ordem: ordem++,
            largura: v.largura,
            altura: v.altura,
            duracao_s: v.duracao,
            tamanho_bytes: v.tamanho,
            origem: 'upload',
          });
          if (error) throw new MidiaErro(error.message);
        } else {
          // A primeira foto de um produto sem capa entra como capa — e capa é
          // quadrada, porque o card da loja é quadrado.
          const seraCapa = !temCapa && ordem === midias.length;
          const img = await processarImagem(file, { quadrado: seraCapa });
          andar(50);
          const url = await enviarBlob(caminhoNoBucket(slug, 'webp'), img.blob, 'image/webp');
          andar(90);
          const { error } = await supabase.from('produto_midia').insert({
            produto_id: produtoId,
            tipo: 'imagem',
            url,
            ordem: ordem++,
            capa: seraCapa,
            largura: img.largura,
            altura: img.altura,
            tamanho_bytes: img.tamanho,
            origem: 'upload',
          });
          if (error) throw new MidiaErro(error.message);
        }
        setFila((f) => f.filter((x) => x.id !== chave));
      } catch (e) {
        const texto = e instanceof Error ? e.message : String(e);
        setFila((f) => f.map((x) => (x.id === chave ? { ...x, erro: texto, progresso: 100 } : x)));
      }
    }
    await carregar();
  };

  const adicionarLink = async () => {
    setErro('');
    const externo = lerVideoExterno(link);
    if (!externo) {
      setErro('Não reconheci o link. Use YouTube, Vimeo ou Instagram.');
      return;
    }
    const { error } = await supabase.from('produto_midia').insert({
      produto_id: produtoId,
      tipo: 'video-externo',
      url: externo.embedUrl,
      poster_url: externo.thumbnail,
      ordem: midias.length,
      origem: 'externo',
    });
    if (error) setErro(error.message);
    setLink('');
    await carregar();
  };

  // -------------------------------------------------------------- ações
  const definirCapa = async (m: Midia) => {
    if (m.tipo !== 'imagem') return;
    // O índice único parcial só admite uma capa: limpa antes de marcar.
    await supabase.from('produto_midia').update({ capa: false }).eq('produto_id', produtoId).eq('capa', true);
    const { error } = await supabase.from('produto_midia').update({ capa: true }).eq('id', m.id);
    if (error) setErro(error.message);
    await carregar();
  };

  const salvarAlt = async (m: Midia, alt: string) => {
    if ((m.alt ?? '') === alt) return;
    await supabase.from('produto_midia').update({ alt: alt.trim() || null }).eq('id', m.id);
    setMidias((l) => l.map((x) => (x.id === m.id ? { ...x, alt } : x)));
  };

  const remover = async (m: Midia) => {
    if (!confirm(`Remover esta ${m.tipo === 'imagem' ? 'foto' : 'mídia'} do produto?`)) return;
    const { error } = await supabase.from('produto_midia').delete().eq('id', m.id);
    if (error) {
      setErro(error.message);
      return;
    }
    // Arquivo estático do repositório não é nosso para apagar.
    if (m.origem === 'upload') {
      await apagarDoBucket(m.url);
      if (m.poster_url) await apagarDoBucket(m.poster_url);
    }
    await carregar();
  };

  const gravarOrdem = async (lista: Midia[]) => {
    setMidias(lista);
    onMudou?.(lista);
    await Promise.all(lista.map((m, i) => supabase.from('produto_midia').update({ ordem: i }).eq('id', m.id)));
    await carregar();
  };

  const mover = (id: string, passo: number) => {
    const i = midias.findIndex((m) => m.id === id);
    const j = i + passo;
    if (i < 0 || j < 0 || j >= midias.length) return;
    const lista = [...midias];
    [lista[i], lista[j]] = [lista[j], lista[i]];
    void gravarOrdem(lista);
  };

  const soltarNoItem = (destinoId: string) => {
    const origemId = arrastado.current;
    setAlvo(null);
    arrastado.current = null;
    if (!origemId || origemId === destinoId) return;
    const lista = [...midias];
    const de = lista.findIndex((m) => m.id === origemId);
    const para = lista.findIndex((m) => m.id === destinoId);
    if (de < 0 || para < 0) return;
    const [item] = lista.splice(de, 1);
    lista.splice(para, 0, item);
    void gravarOrdem(lista);
  };

  const avisosGerais = avaliarConjunto(midias);
  const pesoTotal = midias.reduce((s, m) => s + (m.tamanho_bytes ?? 0), 0);

  return (
    <div className={styles.wrap}>
      <div>
        <div
          className={`${styles.solta} ${sobre ? styles.soltaAtiva : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setSobre(true);
          }}
          onDragLeave={() => setSobre(false)}
          onDrop={(e) => {
            e.preventDefault();
            setSobre(false);
            const arquivos = [...e.dataTransfer.files].filter((f) => MIME_IMAGEM.includes(f.type) || MIME_VIDEO.includes(f.type));
            if (arquivos.length) void receber(arquivos);
          }}
        >
          <strong style={{ color: '#fff', fontSize: '0.9rem' }}>Arraste fotos e vídeos aqui</strong>
          <p className={styles.dica}>
            JPG, PNG, WebP ou AVIF · vídeo MP4/WebM de até {LIMITES.videoDuracaoMaxS}s e 25 MB. As fotos viram WebP de{' '}
            {LIMITES.ladoMax} px automaticamente.
          </p>
          <div className={styles.botoes}>
            <label className={styles.botao} style={{ cursor: 'pointer' }}>
              Escolher arquivos
              <input
                type="file"
                multiple
                hidden
                accept={[...MIME_IMAGEM, ...MIME_VIDEO].join(',')}
                onChange={(e) => {
                  const arquivos = [...(e.target.files ?? [])];
                  e.target.value = '';
                  if (arquivos.length) void receber(arquivos);
                }}
              />
            </label>
          </div>
          <div className={styles.linkBox}>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="…ou cole um link do YouTube / Instagram"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void adicionarLink();
                }
              }}
            />
            <button type="button" className={styles.botao} onClick={() => void adicionarLink()} disabled={!link.trim()}>
              Adicionar
            </button>
          </div>
        </div>

        {erro && <div className={styles.erroCaixa}>{erro}</div>}

        {fila.length > 0 && (
          <ul className={styles.fila}>
            {fila.map((f) => (
              <li key={f.id} className={`${styles.filaItem} ${f.erro ? styles.filaErro : ''}`}>
                <span className={styles.filaNome}>{f.nome}</span>
                <span>{f.erro ? 'falhou' : `${f.progresso}%`}</span>
                {f.erro ? (
                  <span style={{ gridColumn: '1 / -1', fontSize: '0.72rem' }}>{f.erro}</span>
                ) : (
                  <span className={styles.barra}>
                    <span className={styles.barraInterna} style={{ width: `${f.progresso}%` }} />
                  </span>
                )}
                {f.erro && (
                  <button type="button" className={styles.mini} onClick={() => setFila((x) => x.filter((y) => y.id !== f.id))}>
                    ok
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {carregando ? (
          <p className={styles.vazio}>Carregando mídia…</p>
        ) : midias.length === 0 ? (
          <p className={styles.vazio}>Nenhuma foto ainda. Na loja este produto aparece como um quadrado da cor.</p>
        ) : (
          <ul className={styles.grade}>
            {midias.map((m, i) => {
              const avisos = avaliarMidia(m);
              return (
                <li
                  key={m.id}
                  className={`${styles.card} ${m.capa ? styles.cardCapa : ''} ${alvo === m.id ? styles.cardAlvo : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setAlvo(m.id);
                  }}
                  onDragLeave={() => setAlvo((a) => (a === m.id ? null : a))}
                  onDrop={() => soltarNoItem(m.id)}
                >
                  <div
                    className={styles.thumbWrap}
                    draggable
                    onDragStart={() => {
                      arrastado.current = m.id;
                    }}
                    onDragEnd={() => {
                      arrastado.current = null;
                      setAlvo(null);
                    }}
                  >
                    {m.tipo === 'imagem' ? (
                      <img src={m.url} alt={m.alt ?? ''} loading="lazy" />
                    ) : m.poster_url ? (
                      <img src={m.poster_url} alt={m.alt ?? ''} loading="lazy" />
                    ) : (
                      <video src={m.url} muted playsInline preload="metadata" />
                    )}
                    {m.capa && <span className={`${styles.selo} ${styles.seloCapa}`}>capa</span>}
                    {m.tipo !== 'imagem' && (
                      <span className={`${styles.selo} ${styles.seloTipo}`}>
                        {m.tipo === 'video' ? `vídeo ${m.duracao_s ? `${Math.round(m.duracao_s)}s` : ''}` : 'link'}
                      </span>
                    )}
                  </div>

                  <div className={styles.corpo}>
                    <input
                      defaultValue={m.alt ?? ''}
                      placeholder="Texto alternativo"
                      onBlur={(e) => void salvarAlt(m, e.target.value)}
                    />
                    <div className={styles.meta}>
                      {m.largura && m.altura ? <span>{m.largura}×{m.altura}</span> : null}
                      <span>{formatarBytes(m.tamanho_bytes)}</span>
                      {m.origem === 'estatico' && <span>arquivo do site</span>}
                    </div>
                    <div className={styles.acoes}>
                      <button type="button" className={styles.mini} onClick={() => mover(m.id, -1)} disabled={i === 0} title="Mover para trás">
                        ←
                      </button>
                      <button
                        type="button"
                        className={styles.mini}
                        onClick={() => mover(m.id, 1)}
                        disabled={i === midias.length - 1}
                        title="Mover para frente"
                      >
                        →
                      </button>
                      {m.tipo === 'imagem' && (
                        <button
                          type="button"
                          className={`${styles.mini} ${m.capa ? styles.miniAtiva : ''}`}
                          onClick={() => void definirCapa(m)}
                          disabled={m.capa}
                        >
                          {m.capa ? '★ capa' : '☆ capa'}
                        </button>
                      )}
                      <button type="button" className={`${styles.mini} ${styles.miniPerigo}`} onClick={() => void remover(m)}>
                        remover
                      </button>
                    </div>
                    {avisos.length > 0 && (
                      <ul className={styles.avisos}>
                        {avisos.map((a) => (
                          <li key={a.texto} className={a.nivel === 'erro' ? styles.avisoErro : undefined}>
                            {a.texto}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ------------------------------------------------- orientações */}
      <aside className={styles.guia}>
        <h4>Orientações</h4>
        <dl>
          <div>
            <dt>Capa · 1:1</dt>
            <dd>Mínimo 1000×1000, ideal 1200. O material em si — rolo, amostra ou aplicação — em fundo neutro, luz branca, sem texto nem logo.</dd>
          </div>
          <div>
            <dt>Galeria · 2 a 8 fotos</dt>
            <dd>4:3 ou 3:2, 1600 px no lado maior. Ordem que funciona: aplicação geral → detalhe da textura → ambiente.</dd>
          </div>
          <div>
            <dt>Vídeo · até {LIMITES.videoDuracaoMaxS}s</dt>
            <dd>Vertical (Reels) ou 16:9, 1080p, até 25 MB. Toca sem som na loja. A capa do vídeo é gerada sozinha.</dd>
          </div>
          <div>
            <dt>Texto alternativo</dt>
            <dd>6 a 14 palavras descrevendo a foto. Serve para leitor de tela e para o Google Imagens.</dd>
          </div>
        </dl>
        <p className={styles.guiaNao}>
          Evite: foto de catálogo do fornecedor com logo, print de tela, sombra do celular e cor editada além do real — o cliente compara
          com a amostra física.
        </p>
        {midias.length > 0 && (
          <p className={styles.guiaNao}>
            {midias.length} mídia(s) · {formatarBytes(pesoTotal)} no total.
          </p>
        )}
        {avisosGerais.length > 0 && (
          <ul className={styles.avisos} style={{ marginTop: '0.6rem' }}>
            {avisosGerais.map((a) => (
              <li key={a.texto} className={a.nivel === 'erro' ? styles.avisoErro : undefined}>
                {a.texto}
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
