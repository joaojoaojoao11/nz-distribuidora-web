// A telinha que aparece ao CONCLUIR uma seleção.
//
// Foi o pedido do João com a /loja aberta em modo curadoria: "na seleção
// montada, abrir uma telinha de configuração, que eu posso mostrar os preços
// apenas daqueles itens selecionados [...] um campo de aumentar preço em %".
//
// Ela faz duas perguntas e nada mais — mostrar preço? de quanto é o acréscimo?
// — porque é o que muda o link. Título é conveniência para reencontrar depois.
//
// Dois estados na mesma janela: ANTES (o formulário) e DEPOIS (o link pronto,
// para copiar e mandar). Separar em duas telas obrigaria a fechar uma e abrir
// outra no momento em que a pessoa só quer copiar e colar no WhatsApp.
//
// Portal em document.body por causa do `backdrop-filter` da navbar: um
// `position: fixed` dentro dela vira filho do contexto de composição dela e o
// painel aparece atrás do conteúdo (mesma pedra do MiniCarrinho).

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  criarSelecao,
  textoDoErroSelecao,
  urlDaSelecao,
  whatsappDaSelecao,
  type SelecaoCriada,
} from '../../lib/shop/selecoes';
import { MAX_ACRESCIMO_PCT, MAX_SELECAO, MAX_TITULO, validarConfig } from '../../lib/shop/selecoes/regras';
import styles from './SelecaoConfig.module.css';

interface Props {
  slugs: string[];
  onFechar: () => void;
  /** Chamado depois de gerar: a loja sai do modo curadoria e limpa o `?fora=`. */
  onConcluir: () => void;
}

export default function SelecaoConfig({ slugs, onFechar, onConcluir }: Props) {
  const [titulo, setTitulo] = useState('');
  const [mostrarPreco, setMostrarPreco] = useState(false);
  const [acrescimo, setAcrescimo] = useState('0');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [criada, setCriada] = useState<SelecaoCriada | null>(null);
  const [copiado, setCopiado] = useState<'ok' | 'erro' | null>(null);
  const caixaRef = useRef<HTMLDivElement>(null);

  // Esc fecha e o fundo não rola. Sem a trava de rolagem, arrastar sobre o véu
  // move a lista atrás e a pessoa perde o lugar onde estava.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    window.addEventListener('keydown', tecla);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', tecla);
      document.body.style.overflow = overflow;
    };
  }, [onFechar]);

  useEffect(() => {
    caixaRef.current?.focus();
  }, []);

  const pct = Number(acrescimo.replace(',', '.')) || 0;
  const problemas = validarConfig({ slugs, mostrarPreco, acrescimoPct: pct, titulo });
  const problemaDe = (campo: string) => problemas.find((p) => p.campo === campo)?.mensagem;

  const gerar = async () => {
    if (problemas.length) {
      setErro(problemas[0].mensagem);
      return;
    }
    setEnviando(true);
    setErro('');
    try {
      const r = await criarSelecao({ slugs, titulo: titulo.trim() || undefined, mostrarPreco, acrescimoPct: pct });
      setCriada(r);
      // Copia de imediato: no fluxo real a pessoa vai direto para o WhatsApp, e
      // um clique a menos é um passo a menos entre montar e mandar.
      try {
        await navigator.clipboard.writeText(r.url);
        setCopiado('ok');
      } catch {
        // Sem permissão de área de transferência: o campo abaixo mostra o link.
      }
    } catch (e) {
      setErro(textoDoErroSelecao(e));
    } finally {
      setEnviando(false);
    }
  };

  const copiar = async () => {
    if (!criada) return;
    try {
      await navigator.clipboard.writeText(criada.url);
      setCopiado('ok');
    } catch {
      setCopiado('erro');
    }
    setTimeout(() => setCopiado(null), 2600);
  };

  const fecharTudo = () => {
    if (criada) onConcluir();
    onFechar();
  };

  return createPortal(
    <div className={styles.veu} role="presentation" onClick={fecharTudo}>
      <div
        className={styles.caixa}
        role="dialog"
        aria-modal="true"
        aria-labelledby="selconf-titulo"
        tabIndex={-1}
        ref={caixaRef}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.cabecalho}>
          <h2 id="selconf-titulo" className={styles.tituloTela}>
            {criada ? 'Seleção pronta' : 'Configurar seleção'}
          </h2>
          <span className={styles.contagem}>
            {slugs.length} {slugs.length === 1 ? 'item' : 'itens'}
          </span>
          <button type="button" className={styles.fechar} onClick={fecharTudo} aria-label="Fechar">
            ✕
          </button>
        </header>

        {!criada ? (
          <>
            <label className={styles.campo}>
              <span className={styles.rotulo}>Título (opcional)</span>
              <input
                type="text"
                className={styles.entrada}
                placeholder="Ex.: Cliente João — foscos 3M"
                maxLength={MAX_TITULO}
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
              <span className={styles.ajuda}>Só você vê. Serve para reencontrar em Minhas seleções.</span>
            </label>

            <label className={styles.toggleLinha}>
              <input
                type="checkbox"
                className={styles.toggle}
                checked={mostrarPreco}
                onChange={(e) => setMostrarPreco(e.target.checked)}
              />
              <span>
                <span className={styles.rotulo}>Mostrar preço para quem abrir o link</span>
                <span className={styles.ajuda}>
                  Quem abrir vê o preço destes {slugs.length} {slugs.length === 1 ? 'item' : 'itens'} sem precisar de
                  cadastro. O resto do catálogo continua fechado.
                </span>
              </span>
            </label>

            <label className={`${styles.campo} ${!mostrarPreco ? styles.campoDesligado : ''}`}>
              <span className={styles.rotulo}>Acréscimo sobre o preço (%)</span>
              <input
                type="number"
                className={styles.entrada}
                min={0}
                max={MAX_ACRESCIMO_PCT}
                step={0.5}
                inputMode="decimal"
                disabled={!mostrarPreco}
                value={acrescimo}
                onChange={(e) => setAcrescimo(e.target.value)}
              />
              <span className={styles.ajuda}>
                Aplicado só nesta seleção, sobre o preço de atacado. O cliente vê o valor final, nunca a conta.
              </span>
              {problemaDe('acrescimoPct') && <span className={styles.erroCampo}>{problemaDe('acrescimoPct')}</span>}
            </label>

            <p className={styles.resumo}>
              {slugs.length} {slugs.length === 1 ? 'item' : 'itens'} ·{' '}
              {mostrarPreco ? (pct > 0 ? `atacado + ${pct}%` : 'preço de atacado') : 'sem preço'} · link válido por 24 h
            </p>

            {problemaDe('slugs') && <p className={styles.erro}>{problemaDe('slugs')}</p>}
            {erro && <p className={styles.erro}>{erro}</p>}

            <div className={styles.acoes}>
              <button type="button" className={styles.cancelar} onClick={onFechar}>
                Cancelar
              </button>
              <button
                type="button"
                className={styles.principal}
                disabled={enviando || slugs.length === 0 || slugs.length > MAX_SELECAO}
                onClick={() => void gerar()}
              >
                {enviando ? 'GERANDO…' : 'GERAR LINK'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className={styles.pronto}>
              {criada.itens} {criada.itens === 1 ? 'produto' : 'produtos'} ·{' '}
              {mostrarPreco ? (pct > 0 ? `com preço (atacado + ${pct}%)` : 'com preço de atacado') : 'sem preço'} ·
              válida até {new Date(criada.expiraEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </p>

            {criada.ignorados.length > 0 && (
              <p className={styles.aviso}>
                {criada.ignorados.length}{' '}
                {criada.ignorados.length === 1 ? 'item não existe mais no cadastro e ficou' : 'itens não existem mais no cadastro e ficaram'}{' '}
                de fora.
              </p>
            )}

            <div className={styles.linkCaixa}>
              <input className={styles.link} readOnly value={urlDaSelecao(criada.token)} onFocus={(e) => e.currentTarget.select()} />
              <button type="button" className={styles.copiar} onClick={() => void copiar()}>
                {copiado === 'ok' ? 'COPIADO ✓' : copiado === 'erro' ? 'NÃO CONSEGUI' : 'COPIAR'}
              </button>
            </div>

            <div className={styles.acoes}>
              <Link to="/painel/selecoes" className={styles.cancelar} onClick={fecharTudo}>
                Minhas seleções
              </Link>
              <a
                className={styles.principal}
                href={whatsappDaSelecao(criada.token, titulo.trim() || null)}
                target="_blank"
                rel="noopener noreferrer"
              >
                ENVIAR NO WHATSAPP
              </a>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
