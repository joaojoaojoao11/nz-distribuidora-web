// /painel/cupons — os cupons da pessoa e um conferidor de código.
//
// Dois tipos: o cupom de AFILIADO (o próprio código de indicação — quem usa é
// o indicado) e o cupom NOMINAL (`cupons.dono_user_id`: "a NZ deu 10% para o
// fulano" — só o dono usa). A lista vem da rota do servidor (op `meus-cupons`):
// até 21/10/2026 a tela lia `cupons` direto do navegador, e como a política da
// tabela é só de admin, todo mundo via a lista vazia (B4 do plano de indicação).

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { BRL } from '../../lib/shop/precos';
import styles from './Painel.module.css';

interface MeuCupom {
  codigo: string;
  tipo?: string;
  desconto_pct: number | null;
  desconto_valor: number | null;
  ativo: boolean;
  valido_ate: string | null;
  usos: number | null;
  limite_usos: number | null;
  /** 'dono' = cupom nominal para EU usar; 'afiliado' = meu código, para DISTRIBUIR. */
  papel?: 'dono' | 'afiliado';
}

interface Conferencia {
  valido: boolean;
  descontoPct?: number | null;
  descontoValor?: number | null;
}

export default function PainelCupons() {
  const { user } = useAuth();
  const [meus, setMeus] = useState<MeuCupom[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [codigo, setCodigo] = useState('');
  const [conferindo, setConferindo] = useState(false);
  const [resultado, setResultado] = useState<Conferencia | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let vivo = true;
    void (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        if (!token) return;
        const r = await fetch('/api/nz/afiliado', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ op: 'meus-cupons' }),
        });
        if (!vivo) return;
        if (r.ok) {
          const j = (await r.json()) as { cupons?: MeuCupom[] };
          setMeus(j.cupons ?? []);
        }
      } catch {
        /* sem cupons nesta carga */
      } finally {
        if (vivo) setCarregando(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [user]);

  const conferir = async (e: React.FormEvent) => {
    e.preventDefault();
    const cod = codigo.trim().toUpperCase();
    if (!cod) return;
    setConferindo(true);
    setResultado(null);
    try {
      const r = await fetch('/api/nz/afiliado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'validar', codigo: cod }),
      });
      setResultado(r.ok ? ((await r.json()) as Conferencia) : { valido: false });
    } catch {
      setResultado({ valido: false });
    } finally {
      setConferindo(false);
    }
  };

  const desconto = (pct: number | null, valor: number | null) =>
    pct ? `${pct}% de desconto` : valor ? `${BRL.format(Number(valor))} de desconto` : 'desconto aplicado no carrinho';

  return (
    <>
      <section className={styles.bloco}>
        <h2 className={styles.subtitulo}>Meus cupons</h2>
        {carregando ? (
          <p className={styles.mudo}>Carregando…</p>
        ) : meus.length === 0 ? (
          <p className={styles.mudo}>
            Você não tem cupom próprio no momento. Quem indica ganha um: veja{' '}
            <Link to="/painel/indique">Indique e ganhe</Link>.
          </p>
        ) : (
          <ul className={styles.cupons}>
            {meus.map((c) => (
              <li key={c.codigo} className={c.ativo ? styles.cupom : `${styles.cupom} ${styles.cupomMorto}`}>
                <div>
                  <span className={styles.cupomCodigo}>{c.codigo}</span>
                  <span className={styles.cupomRegra}>
                    {c.papel === 'afiliado' ? 'seu código de indicação — quem usa é quem você indica · ' : ''}
                    {desconto(c.desconto_pct, c.desconto_valor)}
                    {c.valido_ate ? ` · até ${new Date(c.valido_ate).toLocaleDateString('pt-BR')}` : ''}
                    {c.limite_usos ? ` · ${c.usos ?? 0}/${c.limite_usos} usos` : ''}
                    {!c.ativo ? ' · inativo' : ''}
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.botaoSecundario}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(c.codigo);
                      setCopiado(c.codigo);
                      setTimeout(() => setCopiado(null), 1800);
                    } catch {
                      /* área de transferência bloqueada */
                    }
                  }}
                >
                  {copiado === c.codigo ? 'Copiado' : 'Copiar'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.bloco}>
        <h2 className={styles.subtitulo}>Conferir um código</h2>
        <p className={styles.mudo}>Recebeu um cupom e quer saber se ainda vale? Confira aqui antes de fechar o pedido.</p>
        <form className={styles.form} onSubmit={conferir}>
          <label className={styles.campo}>
            <span>Código</span>
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="NZ-XXXXX" />
          </label>
          <div className={styles.acoesBloco}>
            <button type="submit" className={styles.salvar} disabled={conferindo}>
              {conferindo ? 'Conferindo…' : 'Conferir'}
            </button>
          </div>
        </form>
        {resultado && (
          <p className={resultado.valido ? styles.ok : styles.erro}>
            {resultado.valido
              ? `Cupom válido — ${desconto(resultado.descontoPct ?? null, resultado.descontoValor ?? null)}.`
              : 'Cupom inválido, esgotado ou fora do prazo.'}
          </p>
        )}
      </section>
    </>
  );
}
