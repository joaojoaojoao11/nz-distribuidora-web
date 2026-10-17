// Campo do vinil aplicado (envelopamento), com sugestões do que a NZ vende:
// as cores NZWRAP do site e as linhas de envelopamento da loja (Speed, SH,
// Oracal, MetaCast…). Texto livre continua valendo — a sugestão só poupa
// digitação e deixa o nome igual ao do catálogo.
//
// As listas só carregam quando a pessoa entra no campo: quem registra PPF não
// baixa nada disso.

import { useMemo, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import styles from './Registro.module.css';

interface Sugestao {
  valor: string;
  nome: string;
  marca: string;
  hex: string | null;
  busca: string;
}

interface Props {
  id: string;
  value: string;
  onChange: (v: string) => void;
  invalido?: boolean;
  descritoPor?: string;
}

const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const tituloDe = (s: string) => s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());

let promessa: Promise<Sugestao[]> | null = null;

function carregarSugestoes(): Promise<Sugestao[]> {
  if (promessa) return promessa;
  promessa = (async () => {
    const [nzwrap, loja] = await Promise.all([
      import('../../../lib/data/nzwrapColors').then((m) => m.NZWRAP_COLORS).catch(() => []),
      supabase
        .from('loja_catalogo')
        .select('nome, marca_exibicao, brand_key, codigo, hex, hex_amostra')
        .eq('vertical', 'WRAP')
        .eq('kind', 'cor')
        .neq('brand_key', 'etherna')
        .limit(800)
        .then(({ data }) => (data ?? []) as { nome: string; marca_exibicao: string | null; codigo: string | null; hex: string | null; hex_amostra: string | null }[], () => []),
    ]);
    const lista: Sugestao[] = [];
    const vistos = new Set<string>();
    const incluir = (s: Omit<Sugestao, 'busca'>, extra = '') => {
      const chave = normalizar(s.valor);
      if (!s.valor.trim() || vistos.has(chave)) return;
      vistos.add(chave);
      lista.push({ ...s, busca: normalizar(`${s.valor} ${extra}`) });
    };
    for (const c of nzwrap) {
      incluir({ valor: c.name, nome: tituloDe(c.name.replace(/^NZWRAP\s+/i, '')), marca: `NZWRAP · ${c.finish}`, hex: c.hex || null }, c.sku);
    }
    for (const p of loja) {
      const marca = (p.marca_exibicao ?? '').trim();
      const nome = (p.nome ?? '').trim();
      incluir({ valor: marca && !normalizar(nome).startsWith(normalizar(marca)) ? `${marca} ${nome}` : nome, nome, marca: marca || 'Loja NZ', hex: p.hex || p.hex_amostra || null }, p.codigo ?? '');
    }
    return lista;
  })();
  return promessa;
}

export default function SugestoesCor({ id, value, onChange, invalido, descritoPor }: Props) {
  const [todas, setTodas] = useState<Sugestao[]>([]);
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const pediu = useRef(false);

  const filtradas = useMemo(() => {
    const termos = normalizar(value).split(/\s+/).filter(Boolean);
    if (!termos.length || value.trim().length < 2) return [];
    return todas.filter((s) => termos.every((t) => s.busca.includes(t))).slice(0, 6);
  }, [todas, value]);

  const mostrar = aberto && filtradas.length > 0;
  const listaId = `${id}-sugestoes`;

  const carregar = () => {
    if (pediu.current) return;
    pediu.current = true;
    void carregarSugestoes().then(setTodas);
  };

  const escolher = (s: Sugestao) => {
    onChange(s.valor);
    setAberto(false);
    setAtivo(-1);
  };

  const teclas = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!mostrar) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAtivo((a) => (a + 1) % filtradas.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAtivo((a) => (a <= 0 ? filtradas.length - 1 : a - 1));
    } else if (e.key === 'Enter' && ativo >= 0 && filtradas[ativo]) {
      e.preventDefault();
      escolher(filtradas[ativo]);
    } else if (e.key === 'Escape') {
      setAberto(false);
    }
  };

  return (
    <div className={styles.sugestoes}>
      <input
        id={id}
        name="material"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setAberto(true);
          setAtivo(-1);
        }}
        onFocus={() => {
          carregar();
          setAberto(true);
        }}
        onBlur={() => setAberto(false)}
        onKeyDown={teclas}
        placeholder="Ex.: NZWRAP Ferrari Metallic Red"
        autoComplete="off"
        autoCapitalize="words"
        enterKeyHint="next"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={mostrar}
        aria-controls={listaId}
        aria-activedescendant={mostrar && ativo >= 0 ? `${listaId}-${ativo}` : undefined}
        aria-invalid={invalido || undefined}
        aria-describedby={descritoPor}
      />
      {mostrar && (
        <ul className={styles.sugestoesLista} id={listaId} role="listbox">
          {filtradas.map((s, i) => (
            <li
              key={s.valor}
              id={`${listaId}-${i}`}
              role="option"
              aria-selected={i === ativo}
              className={i === ativo ? `${styles.sugestao} ${styles.sugestaoAtiva}` : styles.sugestao}
              // mousedown, não click: o blur do campo fecharia a lista antes.
              onMouseDown={(e) => {
                e.preventDefault();
                escolher(s);
              }}
            >
              <span className={styles.amostra} style={s.hex ? { background: s.hex } : undefined} aria-hidden="true" />
              <span className={styles.sugestaoNome}>
                {s.nome}
                <small>{s.marca}</small>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
