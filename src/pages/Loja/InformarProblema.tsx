// "Informar um problema" — o caminho de volta da página do produto.
//
// Pedido do João (2026-09-08): "em todo produto tenha um botão de informar
// problema, que o usuário pode clicar, escrever uma mensagem, até anexar uma
// imagem, que vai para esse painel também".
//
// SEM LOGIN. Quem mais enxerga a foto errada é o instalador no pátio e o
// vendedor com o cliente ao lado — exigir cadastro para avisar garantiria que
// ninguém avisasse. O contato é opcional e só serve se a pessoa quiser resposta.
//
// A foto é encolhida AQUI, no navegador: a que sai do celular tem 4 a 12 MB e o
// corpo de uma função da Vercel para em 4,5 MB. Mandar o arquivo cru falharia
// justo para quem está com pressa.

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { ImagemGrandeDemais, reduzirImagem } from '../../lib/imagem/reduzir';
import styles from './InformarProblema.module.css';

const MOTIVOS = [
  { id: 'preco', rotulo: 'Preço não aparece ou está errado' },
  { id: 'foto', rotulo: 'Foto errada ou faltando' },
  { id: 'estoque', rotulo: 'Estoque / disponibilidade' },
  { id: 'descricao', rotulo: 'Descrição ou ficha técnica' },
  { id: 'outro', rotulo: 'Outro' },
] as const;

const MIN_MENSAGEM = 10;
const MAX_MENSAGEM = 1000;

interface Props {
  slug: string;
  nome: string;
  onFechar: () => void;
}

export default function InformarProblema({ slug, nome, onFechar }: Props) {
  const [motivo, setMotivo] = useState<string>('foto');
  const [mensagem, setMensagem] = useState('');
  const [contato, setContato] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [pronto, setPronto] = useState(false);
  const caixaRef = useRef<HTMLDivElement>(null);

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

  // Se já está logado, o contato vem preenchido — um campo a menos.
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email;
      if (email) setContato((c) => c || email);
    });
  }, []);

  useEffect(() => {
    if (!arquivo) {
      setPrevia(null);
      return;
    }
    const url = URL.createObjectURL(arquivo);
    setPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);

  const enviar = async () => {
    const texto = mensagem.trim();
    if (texto.length < MIN_MENSAGEM) {
      setErro(`Escreva pelo menos ${MIN_MENSAGEM} caracteres para a gente entender o que houve.`);
      return;
    }
    setEnviando(true);
    setErro('');

    try {
      let imagem: { tipo: string; base64: string } | undefined;
      if (arquivo) {
        try {
          const r = await reduzirImagem(arquivo);
          imagem = { tipo: r.tipo, base64: r.base64 };
        } catch (e) {
          setErro(
            e instanceof ImagemGrandeDemais
              ? 'A imagem ficou grande demais mesmo depois de reduzir. Tente outra foto.'
              : 'Não consegui ler essa imagem. Tente outra, ou envie sem foto.'
          );
          setEnviando(false);
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch('/api/nz/ocorrencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          op: 'informar',
          slug,
          motivo,
          mensagem: texto,
          contato: contato.trim() || undefined,
          url: window.location.href,
          site: honeypot,
          imagem,
        }),
      });

      if (res.status === 429) {
        setErro('Muitos envios seguidos deste aparelho. Tente daqui a pouco.');
        return;
      }
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setErro(
          json.error === 'mensagem-curta'
            ? `Escreva pelo menos ${MIN_MENSAGEM} caracteres.`
            : 'Não consegui enviar agora. Tente de novo em instantes.'
        );
        return;
      }
      setPronto(true);
      setTimeout(onFechar, 2200);
    } catch {
      setErro('Não consegui enviar agora. Verifique a conexão e tente de novo.');
    } finally {
      setEnviando(false);
    }
  };

  return createPortal(
    <div className={styles.veu} role="presentation" onClick={onFechar}>
      <div
        className={styles.caixa}
        role="dialog"
        aria-modal="true"
        aria-labelledby="problema-titulo"
        ref={caixaRef}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.cabecalho}>
          <h2 id="problema-titulo" className={styles.titulo}>
            Informar um problema
          </h2>
          <button type="button" className={styles.fechar} onClick={onFechar} aria-label="Fechar">
            ✕
          </button>
        </header>

        {pronto ? (
          <p className={styles.sucesso}>Recebemos, obrigado. A equipe NZ vai olhar.</p>
        ) : (
          <>
            <p className={styles.produto}>{nome}</p>

            <label className={styles.campo}>
              <span className={styles.rotulo}>O que está errado?</span>
              <select className={styles.entrada} value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                {MOTIVOS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.rotulo}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.campo}>
              <span className={styles.rotulo}>Conte o que aconteceu</span>
              <textarea
                className={styles.area}
                rows={4}
                maxLength={MAX_MENSAGEM}
                placeholder="Ex.: a foto mostra um carro preto, mas o nome diz branco."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
              />
              <span className={styles.contador}>
                {mensagem.trim().length}/{MAX_MENSAGEM}
              </span>
            </label>

            <label className={styles.campo}>
              <span className={styles.rotulo}>Foto (opcional)</span>
              <input
                type="file"
                className={styles.arquivo}
                accept="image/*"
                capture="environment"
                onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              />
              {previa && (
                <span className={styles.previa}>
                  <img src={previa} alt="Pré-visualização do que você vai enviar" />
                  <button type="button" className={styles.tirarFoto} onClick={() => setArquivo(null)}>
                    tirar
                  </button>
                </span>
              )}
            </label>

            <label className={styles.campo}>
              <span className={styles.rotulo}>Seu contato (opcional)</span>
              <input
                type="text"
                className={styles.entrada}
                placeholder="e-mail ou WhatsApp, se quiser resposta"
                maxLength={120}
                value={contato}
                onChange={(e) => setContato(e.target.value)}
              />
            </label>

            {/* Honeypot: invisível para gente, irresistível para robô. */}
            <input
              type="text"
              className={styles.armadilha}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />

            {erro && <p className={styles.erro}>{erro}</p>}

            <div className={styles.acoes}>
              <button type="button" className={styles.cancelar} onClick={onFechar}>
                Cancelar
              </button>
              <button type="button" className={styles.principal} disabled={enviando} onClick={() => void enviar()}>
                {enviando ? 'ENVIANDO…' : 'ENVIAR'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
