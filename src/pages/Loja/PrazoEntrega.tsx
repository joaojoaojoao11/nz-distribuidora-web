// Bloco de prazo de entrega da página de produto.
//
// Mostra PRAZO, nunca valor de frete — o servidor descarta o preço antes de
// responder. O texto do rodapé deixa isso explícito para o visitante.
//
// Degrada em silêncio: `npm run dev` devolve 503 em todo /api/* (o devApiStub
// do vite.config.ts), e um produto de linha sem perfil de embalagem cadastrado
// responde 404 'sem-perfil'. Nos dois casos o bloco some em vez de mostrar erro
// — melhor não prometer prazo nenhum do que prometer um prazo inventado.

import { useCallback, useState } from 'react';
import type { LineKey } from '../../lib/shop/types';
import styles from './PrazoEntrega.module.css';

const CEP_STORAGE_KEY = 'nz:cep';
const WHATSAPP_URL =
  'https://wa.me/5511920707565?text=Ol%C3%A1%2C%20quero%20saber%20o%20prazo%20de%20entrega%20de%20um%20produto.';

interface Prazo {
  carrier: string;
  nome: string;
  dias: number;
  modalidade?: string;
}

interface Formato {
  id: string;
  nome: string;
}

interface Resposta {
  prazos: Prazo[];
  formato: Formato;
  formatos: Formato[];
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
  const [estado, setEstado] = useState<Estado>({ tipo: 'inicial' });
  const [formatoId, setFormatoId] = useState<string | null>(null);

  const consultar = useCallback(
    async (cepBruto: string, profileId: string | null) => {
      const digits = cepBruto.replace(/\D/g, '');
      if (digits.length !== 8) {
        setEstado({ tipo: 'erro', mensagem: 'Informe um CEP com 8 dígitos.' });
        return;
      }

      setEstado({ tipo: 'carregando' });
      try {
        const res = await fetch('/api/logistica/prazo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, lineKey, cep: digits, profileId }),
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

  // Sem perfil cadastrado ou API fora do ar: o bloco inteiro desaparece.
  if (estado.tipo === 'indisponivel') return null;

  return (
    <section className={styles.block} aria-labelledby="prazo-titulo">
      <h2 id="prazo-titulo" className={styles.title}>
        Prazo de entrega
      </h2>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          void consultar(cep, formatoId);
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
        <button type="submit" className={styles.submit} disabled={estado.tipo === 'carregando'}>
          {estado.tipo === 'carregando' ? 'CONSULTANDO…' : 'VER PRAZO'}
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
                  void consultar(cep, e.target.value);
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
            {estado.dados.prazos.map((p) => (
              <li key={p.carrier} className={styles.prazo}>
                <span className={styles.prazoCarrier}>{p.nome}</span>
                <span className={styles.prazoDias}>
                  até {p.dias} {p.dias === 1 ? 'dia útil' : 'dias úteis'}
                </span>
              </li>
            ))}
          </ul>

          <p className={styles.nota}>
            Prazo estimado em dias úteis a partir da confirmação do pedido, já incluindo a
            expedição. <strong>Valores de frete sob consulta</strong> —{' '}
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              fale com a gente
            </a>
            .
          </p>
        </>
      )}
    </section>
  );
}
