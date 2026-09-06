// Bloco de prazo de entrega da página de produto.
//
// Mostra PRAZO para todo mundo e VALOR do frete só para admin — o servidor
// decide isso lendo o papel do JWT (api/_lib/handlers/prazo.ts) e simplesmente
// não manda o campo `valor` para os demais. Aqui não há checagem de papel:
// renderizamos o que chegou. É o desenho certo — o front nunca é o guardião.
//
// A quantidade existe porque o frete é cotado por peso: um rolo e dez rolos não
// custam o mesmo. O servidor multiplica o perfil de embalagem pela quantidade e
// manda à transportadora o maior peso entre real e cubado.
//
// Degrada em silêncio: `npm run dev` devolve 503 em todo /api/* (o devApiStub
// do vite.config.ts), e um produto de linha sem perfil de embalagem cadastrado
// responde 404 'sem-perfil'. Nos dois casos o bloco some em vez de mostrar erro
// — melhor não prometer prazo nenhum do que prometer um prazo inventado.

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { LineKey } from '../../lib/shop/types';
import styles from './PrazoEntrega.module.css';

const CEP_STORAGE_KEY = 'nz:cep';
const WHATSAPP_URL =
  'https://wa.me/5511920707565?text=Ol%C3%A1%2C%20quero%20saber%20o%20prazo%20de%20entrega%20de%20um%20produto.';

const QTD_MIN = 1;
const QTD_MAX = 50;
/** Trocar a quantidade refaz a consulta — com folga, para não disparar uma
    requisição por clique no + e bater no rate limit de 20/min do endpoint. */
const DEBOUNCE_MS = 550;

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

interface Prazo {
  carrier: string;
  nome: string;
  dias: number;
  modalidade?: string;
  /**
   * Id do serviço dentro da transportadora. O Melhor Envio devolve várias
   * opções (Jadlog .Package, Correios PAC…), então `carrier` sozinho não
   * identifica a linha — a chave do React é o par.
   */
  servico?: string;
  servicoNome?: string;
  transportadora?: string;
  /** Só chega para admin. Ausente para qualquer outro papel. */
  valor?: number;
}

interface Formato {
  id: string;
  nome: string;
}

interface Resposta {
  prazos: Prazo[];
  formato: Formato;
  formatos: Formato[];
  quantidade?: number;
  papel?: string;
  atualizadoEm: string;
}

type Estado =
  | { tipo: 'inicial' }
  | { tipo: 'carregando' }
  | { tipo: 'ok'; dados: Resposta }
  | { tipo: 'erro'; mensagem: string }
  | { tipo: 'indisponivel' };

function formatarCep(valor: string): string {
  const digits = valor.replace(/\D/g, '').slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export default function PrazoEntrega({ slug, lineKey }: { slug: string; lineKey: LineKey }) {
  // O CEP fica guardado para não ser pedido de novo a cada produto visitado.
  // Lido no inicializador, não num efeito: já está disponível no primeiro
  // render e não dispara um segundo.
  const [cep, setCep] = useState(() => {
    try {
      return formatarCep(localStorage.getItem(CEP_STORAGE_KEY) ?? '');
    } catch {
      // localStorage bloqueado (janela anônima, cookies desativados).
      return '';
    }
  });
  const [qtd, setQtd] = useState(QTD_MIN);
  const [estado, setEstado] = useState<Estado>({ tipo: 'inicial' });
  const [formatoId, setFormatoId] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const consultar = useCallback(
    async (cepBruto: string, profileId: string | null, quantidade: number) => {
      const digits = cepBruto.replace(/\D/g, '');
      if (digits.length !== 8) {
        setEstado({ tipo: 'erro', mensagem: 'Informe um CEP com 8 dígitos.' });
        return;
      }

      setEstado({ tipo: 'carregando' });
      try {
        // Token quando houver sessão: é o que faz o servidor devolver o valor
        // do frete para admin. Sem sessão a consulta funciona igual, só sem
        // valor — o endpoint é público.
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;

        const res = await fetch('/api/nz/prazo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ slug, lineKey, cep: digits, profileId, qtd: quantidade }),
        });

        // 404 sem-perfil e 503 (dev stub / sem transportadora ativa) não são
        // erro do visitante: o bloco simplesmente não se aplica.
        if (res.status === 404 || res.status === 503) {
          setEstado({ tipo: 'indisponivel' });
          return;
        }
        if (res.status === 429) {
          setEstado({ tipo: 'erro', mensagem: 'Muitas consultas seguidas. Tente em um minuto.' });
          return;
        }
        // O CEP passou na regex de 8 dígitos mas não existe: a transportadora é
        // quem sabe disso. Dizer é melhor do que sumir com o bloco.
        if (res.status === 422) {
          setEstado({ tipo: 'erro', mensagem: 'CEP não encontrado. Confira o número.' });
          return;
        }
        if (!res.ok) {
          setEstado({ tipo: 'indisponivel' });
          return;
        }

        const dados = (await res.json()) as Resposta;
        if (!dados.prazos?.length) {
          setEstado({ tipo: 'indisponivel' });
          return;
        }

        setFormatoId(dados.formato.id);
        setEstado({ tipo: 'ok', dados });
        try {
          localStorage.setItem(CEP_STORAGE_KEY, digits);
        } catch {
          // idem
        }
      } catch {
        setEstado({ tipo: 'indisponivel' });
      }
    },
    [slug, lineKey]
  );

  // Só limpa o timer pendente ao desmontar. Nenhum setState aqui.
  useEffect(() => () => {
    if (debounce.current) clearTimeout(debounce.current);
  }, []);

  /**
   * Muda a quantidade e, se já houver resultado na tela, refaz a consulta com
   * folga. O debounce vive no handler (e não num efeito) porque quem dispara é
   * o clique: efeito com setState atrasado é justamente o padrão que o React
   * Compiler acusa.
   */
  const mudarQtd = (proxima: number) => {
    const valor = Math.min(QTD_MAX, Math.max(QTD_MIN, Math.floor(proxima) || QTD_MIN));
    setQtd(valor);
    if (estado.tipo !== 'ok' && estado.tipo !== 'carregando') return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      void consultar(cep, formatoId, valor);
    }, DEBOUNCE_MS);
  };

  // Sem perfil cadastrado ou API fora do ar: o bloco inteiro desaparece.
  if (estado.tipo === 'indisponivel') return null;

  const mostraValor = estado.tipo === 'ok' && estado.dados.prazos.some((p) => p.valor != null);

  return (
    <section className={styles.block} aria-labelledby="prazo-titulo">
      <h2 id="prazo-titulo" className={styles.title}>
        Prazo de entrega
      </h2>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          void consultar(cep, formatoId, qtd);
        }}
      >
        <label className={styles.field}>
          <span className="sr-only">CEP de entrega</span>
          <input
            type="text"
            className={styles.input}
            placeholder="Seu CEP"
            value={cep}
            onChange={(e) => setCep(formatarCep(e.target.value))}
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={9}
            aria-label="CEP de entrega"
          />
        </label>

        <div className={styles.qtdWrap}>
          <button
            type="button"
            className={styles.qtdBtn}
            onClick={() => mudarQtd(qtd - 1)}
            disabled={qtd <= QTD_MIN}
            aria-label="Diminuir quantidade"
          >
            −
          </button>
          <input
            type="number"
            className={styles.qtdInput}
            value={qtd}
            onChange={(e) => mudarQtd(Number(e.target.value))}
            min={QTD_MIN}
            max={QTD_MAX}
            inputMode="numeric"
            aria-label="Quantidade de volumes"
          />
          <button
            type="button"
            className={styles.qtdBtn}
            onClick={() => mudarQtd(qtd + 1)}
            disabled={qtd >= QTD_MAX}
            aria-label="Aumentar quantidade"
          >
            +
          </button>
        </div>

        <button type="submit" className={styles.submit} disabled={estado.tipo === 'carregando'}>
          {estado.tipo === 'carregando' ? 'CONSULTANDO…' : 'CONSULTAR'}
        </button>
      </form>

      {estado.tipo === 'erro' && <p className={styles.erro}>{estado.mensagem}</p>}

      {estado.tipo === 'ok' && (
        <>
          {/* Seletor só aparece quando a linha tem mais de um formato de envio:
              com um formato só, escolher não faria sentido. */}
          {estado.dados.formatos.length > 1 && (
            <label className={styles.formatoWrap}>
              <span className={styles.formatoLabel}>Formato</span>
              <select
                className={styles.formatoSelect}
                value={formatoId ?? estado.dados.formato.id}
                onChange={(e) => {
                  setFormatoId(e.target.value);
                  void consultar(cep, e.target.value, qtd);
                }}
              >
                {estado.dados.formatos.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select>
            </label>
          )}

          <ul className={styles.prazos}>
            {estado.dados.prazos.map((p, i) => (
              // A lista já vem ordenada pelo servidor (prazo, depois valor):
              // a primeira linha é a entrega mais rápida e ganha destaque.
              <li
                key={`${p.carrier}:${p.servico ?? ''}`}
                className={`${styles.prazo} ${i === 0 ? styles.prazoDestaque : ''}`}
              >
                <span className={styles.prazoCarrier}>{p.nome}</span>
                <span className={styles.prazoInfo}>
                  {p.valor != null && <strong className={styles.prazoValor}>{BRL.format(p.valor)}</strong>}
                  <span className={styles.prazoDias}>
                    até {p.dias} {p.dias === 1 ? 'dia útil' : 'dias úteis'}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          {mostraValor ? (
            <p className={styles.nota}>
              Prazo em dias úteis a partir da confirmação do pedido, já incluindo a expedição.
              Valores cotados para <strong>{estado.dados.quantidade ?? qtd} volume(s)</strong> deste
              formato. <strong>O valor do frete aparece apenas para o login administrativo</strong> —
              o cliente vê somente o prazo.
            </p>
          ) : (
            <p className={styles.nota}>
              Prazo estimado em dias úteis a partir da confirmação do pedido, já incluindo a
              expedição, para <strong>{estado.dados.quantidade ?? qtd} volume(s)</strong>.{' '}
              <strong>Valores de frete sob consulta</strong> —{' '}
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                fale com a gente
              </a>
              .
            </p>
          )}
        </>
      )}
    </section>
  );
}
