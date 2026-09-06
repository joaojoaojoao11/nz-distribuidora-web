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

/** Cidade/UF do CEP digitado — confirma para o visitante que é o lugar certo. */
interface Endereco {
  localidade: string;
  uf: string;
  bairro?: string;
}

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

/**
 * Consulta o ViaCEP só para EXIBIR onde fica o CEP. A cotação não depende
 * disso: quem valida o CEP de verdade é a transportadora. Se o ViaCEP estiver
 * fora do ar, o campo funciona igual, apenas sem a confirmação visual.
 */
async function buscarEndereco(cep: string, signal: AbortSignal): Promise<Endereco | null> {
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal });
    if (!res.ok) return null;
    const json = (await res.json()) as Endereco & { erro?: boolean | string };
    if (json.erro || !json.localidade) return null;
    return { localidade: json.localidade, uf: json.uf, bairro: json.bairro };
  } catch {
    return null;
  }
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
  // Texto livre enquanto digita: com o número direto no estado não dava para
  // apagar o campo para escrever "12" — o valor voltava para 1 a cada tecla.
  const [qtdTexto, setQtdTexto] = useState(String(QTD_MIN));
  const [endereco, setEndereco] = useState<Endereco | null>(null);
  const [cepDesconhecido, setCepDesconhecido] = useState(false);
  const [estado, setEstado] = useState<Estado>({ tipo: 'inicial' });
  const [formatoId, setFormatoId] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cepBusca = useRef<AbortController | null>(null);

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
    if (cepBusca.current) cepBusca.current.abort();
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
    setQtdTexto(String(valor));
    if (estado.tipo !== 'ok' && estado.tipo !== 'carregando') return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      void consultar(cep, formatoId, valor);
    }, DEBOUNCE_MS);
  };

  /** Confirma o que foi digitado à mão: campo vazio ou fora da faixa volta ao válido. */
  const confirmarQtdTexto = () => {
    const n = Number(qtdTexto.replace(/\D/g, ''));
    mudarQtd(Number.isFinite(n) && n > 0 ? n : QTD_MIN);
  };

  /**
   * CEP digitado. Ao completar 8 dígitos: procura a cidade (só para exibir) e
   * dispara a cotação sozinho — o visitante não precisa achar o botão. Antes
   * disso, limpa o que estava na tela para não misturar CEP novo com resultado
   * antigo.
   */
  const mudarCep = (bruto: string) => {
    const formatado = formatarCep(bruto);
    setCep(formatado);
    const digits = formatado.replace(/\D/g, '');
    setEndereco(null);
    setCepDesconhecido(false);
    if (cepBusca.current) cepBusca.current.abort();
    if (debounce.current) clearTimeout(debounce.current);
    if (digits.length !== 8) return;

    const ctrl = new AbortController();
    cepBusca.current = ctrl;
    void buscarEndereco(digits, ctrl.signal).then((end) => {
      if (ctrl.signal.aborted) return;
      if (end) setEndereco(end);
      else setCepDesconhecido(true);
    });
    debounce.current = setTimeout(() => {
      void consultar(formatado, formatoId, qtd);
    }, 250);
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
        <div className={styles.campo}>
          <label className={styles.rotulo} htmlFor="prazo-cep">
            CEP de entrega
          </label>
          <input
            id="prazo-cep"
            type="text"
            className={styles.input}
            placeholder="00000-000"
            value={cep}
            onChange={(e) => mudarCep(e.target.value)}
            inputMode="numeric"
            autoComplete="postal-code"
            enterKeyHint="search"
            maxLength={9}
          />
        </div>

        <div className={styles.campo}>
          <label className={styles.rotulo} htmlFor="prazo-qtd">
            Volumes
          </label>
          <div className={styles.qtdWrap}>
            <button
              type="button"
              className={styles.qtdBtn}
              onClick={() => mudarQtd(qtd - 1)}
              disabled={qtd <= QTD_MIN}
              aria-label="Menos um volume"
            >
              −
            </button>
            <input
              id="prazo-qtd"
              type="text"
              className={styles.qtdInput}
              value={qtdTexto}
              onChange={(e) => setQtdTexto(e.target.value.replace(/\D/g, '').slice(0, 2))}
              onBlur={confirmarQtdTexto}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  confirmarQtdTexto();
                }
              }}
              inputMode="numeric"
              aria-label="Quantidade de volumes"
            />
            <button
              type="button"
              className={styles.qtdBtn}
              onClick={() => mudarQtd(qtd + 1)}
              disabled={qtd >= QTD_MAX}
              aria-label="Mais um volume"
            >
              +
            </button>
          </div>
        </div>

        <button
          type="submit"
          className={styles.submit}
          disabled={estado.tipo === 'carregando' || cep.replace(/\D/g, '').length !== 8}
        >
          {estado.tipo === 'carregando' ? 'CONSULTANDO…' : 'CONSULTAR'}
        </button>
      </form>

      {/* Confirmação de onde fica o CEP: é o que evita cotar para a cidade
          errada sem perceber. Some quando o CEP ainda está incompleto. */}
      {endereco && (
        <p className={styles.endereco}>
          {endereco.bairro ? `${endereco.bairro}, ` : ''}
          {endereco.localidade} · {endereco.uf}
        </p>
      )}
      {cepDesconhecido && <p className={styles.erro}>CEP não encontrado. Confira o número.</p>}

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
