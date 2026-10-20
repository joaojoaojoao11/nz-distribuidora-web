// Entrega da loja (loja_config): retirada em São Paulo e frete grátis.
//
// Morava em "Pedidos & Pagamentos" junto com Pix e boleto; saiu de lá em
// 20/10/2026 porque é decisão de entrega, não de cobrança — quem pensa em
// frete abre a Logística. Os parâmetros de pagamento ficaram em
// /admin/pagamentos.

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './Admin.module.css';

interface Entrega {
  retirada_ativa: boolean;
  retirada_endereco: string;
  frete_gratis_acima: number | null;
}

export default function AdminLogisticaEntrega() {
  const [cfg, setCfg] = useState<Entrega | null>(null);
  const [form, setForm] = useState<{ retirada_endereco: string; frete_gratis_acima: string }>({ retirada_endereco: '', frete_gratis_acima: '' });
  const [msg, setMsg] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    void supabase
      .from('loja_config')
      .select('retirada_ativa, retirada_endereco, frete_gratis_acima')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setMsg(error.message);
          return;
        }
        const c = (data ?? { retirada_ativa: true, retirada_endereco: '', frete_gratis_acima: null }) as Entrega;
        setCfg(c);
        setForm({ retirada_endereco: c.retirada_endereco ?? '', frete_gratis_acima: c.frete_gratis_acima == null ? '' : String(c.frete_gratis_acima) });
      });
  }, []);

  const gravar = async (patch: Partial<Entrega>) => {
    setSalvando(true);
    setMsg('');
    const { error } = await supabase.from('loja_config').update({ ...patch, atualizado_em: new Date().toISOString() }).eq('id', 1);
    setSalvando(false);
    if (error) {
      setMsg(`Não salvou: ${error.message}`);
      return;
    }
    setCfg((c) => (c ? { ...c, ...patch } : c));
    setMsg('Salvo.');
  };

  if (!cfg) return null;

  return (
    <div className={styles.tableSection}>
      <h3 className={styles.tableSectionTitle}>Entrega da loja</h3>
      <p className={styles.tabDescription}>
        O que o cliente vê no checkout além das transportadoras: a opção de retirar em São Paulo e a
        partir de quanto o frete sai grátis. Pix, boleto e cartão ficam em Pagamento online.
      </p>
      <div className={styles.adminFormRow3}>
        <div className={styles.createField}>
          <label>Retirada em São Paulo</label>
          <button type="button" className={`${styles.actionBtn} ${cfg.retirada_ativa ? styles.actionBtnDeny : styles.actionBtnApprove}`} disabled={salvando} onClick={() => void gravar({ retirada_ativa: !cfg.retirada_ativa })}>
            {cfg.retirada_ativa ? 'OFERECIDA — desligar' : 'DESLIGADA — ligar'}
          </button>
        </div>
        <div className={styles.createField}>
          <label>Endereço mostrado ao cliente</label>
          <input value={form.retirada_endereco} onChange={(e) => setForm((f) => ({ ...f, retirada_endereco: e.target.value }))} placeholder="Av. Interlagos — São Paulo/SP (combinar horário)" />
        </div>
        <div className={styles.createField}>
          <label>Frete grátis acima de (R$, vazio = nunca)</label>
          <input type="number" min={0} value={form.frete_gratis_acima} onChange={(e) => setForm((f) => ({ ...f, frete_gratis_acima: e.target.value }))} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.75rem' }}>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionBtnApprove}`}
          disabled={salvando}
          onClick={() =>
            void gravar({
              retirada_endereco: form.retirada_endereco.trim(),
              frete_gratis_acima: form.frete_gratis_acima.trim() === '' ? null : Math.max(0, Number(form.frete_gratis_acima) || 0),
            })
          }
        >
          {salvando ? 'Salvando…' : 'Salvar entrega'}
        </button>
        {msg && <span style={{ color: msg.startsWith('Não') ? '#ff6b6b' : '#a1a1a6', fontSize: '0.85rem' }}>{msg}</span>}
      </div>
    </div>
  );
}
