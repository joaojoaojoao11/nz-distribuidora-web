// /painel/cupons — o que o cliente pode usar no carrinho.
//
// Hoje existe um tipo só de cupom no banco: o do afiliado (o próprio código de
// indicação). Cupom nominal ("a NZ deu 10% para o fulano") ainda não existe —
// `cupons` não tem coluna de dono, e inventar uma lista falsa seria pior que
// uma tela honesta. Então: o cupom de indicação, se houver, e um conferidor de
// código, que é o que resolve a dúvida real ("esse cupom que me passaram vale?").

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { BRL } from '../../lib/shop/precos';
import styles from './Painel.module.css';

interface MeuCupom {
  codigo: string;
  desconto_pct: number | null;
  desconto_valor: number | null;
  ativo: boolean;
  valido_ate: string | null;
  usos: number | null;
  limite_usos: number | null;
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
    void supabase
      .from('cupons')
      .select('codigo, desconto_pct, desconto_valor, ativo, valido_ate, usos, limite_usos')
      .eq('afiliado_user_id', user.id)
      .then(({ data }) => {
        if (!vivo) return;
        setMeus((data ?? []) as MeuCupom[]);
        setCarregando(false);
      });
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
