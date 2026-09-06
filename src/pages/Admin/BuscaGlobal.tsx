// Ctrl+K no painel: acha produto, pedido ou cliente e leva até lá.
//
// Antes, encontrar um produto era: abrir a aba Produtos, esperar 1.292 linhas
// carregarem e digitar na busca da tabela. Com 16 abas e nenhuma delas com
// endereço, "onde eu vejo isso" era a pergunta mais cara do painel.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import styles from './Admin.module.css';

interface Achado {
  tipo: 'produto' | 'pedido' | 'cliente';
  titulo: string;
  detalhe: string;
  destino: string;
}

const ICONE: Record<Achado['tipo'], string> = { produto: '🏷️', pedido: '💳', cliente: '🛒' };

export default function BuscaGlobal({ onFechar }: { onFechar: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [achados, setAchados] = useState<Achado[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    campo.current?.focus();
  }, []);

  const buscar = useCallback(async (termo: string) => {
    const t = termo.trim();
    if (t.length < 2) {
      setAchados([]);
      return;
    }
    setBuscando(true);
    const like = `%${t}%`;
    const numero = Number(t.replace(/\D/g, ''));

    const [prod, ped, cli] = await Promise.all([
      supabase.from('produtos').select('slug, nome, codigo, erp_sku, linha_label').or(`nome.ilike.${like},slug.ilike.${like},codigo.ilike.${like},erp_sku.ilike.${like}`).limit(6),
      Number.isFinite(numero) && numero > 0
        ? supabase.from('pedidos').select('numero, status, pagamento_status, total_final, total_estimado').eq('numero', numero).limit(3)
        : Promise.resolve({ data: [] }),
      supabase.from('user_profiles').select('id, full_name, email, role').neq('role', 'admin').or(`full_name.ilike.${like},email.ilike.${like},company_name.ilike.${like}`).limit(5),
    ]);

    const lista: Achado[] = [
      ...((prod.data ?? []) as { slug: string; nome: string; codigo: string | null; erp_sku: string | null; linha_label: string | null }[]).map((p) => ({
        tipo: 'produto' as const,
        titulo: p.nome,
        detalhe: [p.codigo, p.erp_sku, p.linha_label].filter(Boolean).join(' · '),
        destino: `/admin/produtos/${p.slug}`,
      })),
      ...((ped.data ?? []) as { numero: number; status: string; pagamento_status: string | null }[]).map((p) => ({
        tipo: 'pedido' as const,
        titulo: `Pedido #${p.numero}`,
        detalhe: `${p.status}${p.pagamento_status && p.pagamento_status !== 'nenhum' ? ` · ${p.pagamento_status}` : ''}`,
        destino: '/admin/pedidos',
      })),
      ...((cli.data ?? []) as { id: string; full_name: string | null; email: string | null; role: string }[]).map((c) => ({
        tipo: 'cliente' as const,
        titulo: c.full_name || c.email || 'sem nome',
        detalhe: `${c.email ?? ''} · ${c.role === 'reseller' ? 'lojista' : 'cliente'}`,
        destino: '/admin/clientes',
      })),
    ];
    setAchados(lista);
    setAtivo(0);
    setBuscando(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void buscar(q), 250);
    return () => clearTimeout(t);
  }, [q, buscar]);

  const ir = (a: Achado) => {
    navigate(a.destino);
    onFechar();
  };

  return (
    <div
      className={styles.buscaOverlay}
      role="dialog"
      aria-modal="true"
      onClick={onFechar}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onFechar();
      }}
    >
      <div className={styles.buscaCaixa} onClick={(e) => e.stopPropagation()}>
        <input
          ref={campo}
          className={styles.buscaCampo}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Produto, nº do pedido, cliente…"
          onKeyDown={(e) => {
            if (e.key === 'Escape') onFechar();
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setAtivo((i) => Math.min(i + 1, achados.length - 1));
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setAtivo((i) => Math.max(i - 1, 0));
            }
            if (e.key === 'Enter' && achados[ativo]) ir(achados[ativo]);
          }}
        />
        {buscando && <div className={styles.loadingBar}><div className={styles.loadingBarInner} /></div>}
        {achados.length > 0 ? (
          <ul className={styles.buscaLista}>
            {achados.map((a, i) => (
              <li key={`${a.tipo}-${a.destino}-${a.titulo}`}>
                <button type="button" className={`${styles.buscaItem} ${i === ativo ? styles.buscaItemAtivo : ''}`} onClick={() => ir(a)}>
                  <span>{ICONE[a.tipo]}</span>
                  <span className={styles.buscaTitulo}>{a.titulo}</span>
                  <span className={styles.buscaDetalhe}>{a.detalhe}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          q.trim().length >= 2 && !buscando && <p className={styles.buscaVazio}>Nada encontrado.</p>
        )}
      </div>
    </div>
  );
}
