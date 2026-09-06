// /painel/dados — o cadastro que o pedido usa.
//
// Saiu do arquivão de 586 linhas sem mudar a regra: mesma validação de
// CPF/CNPJ, mesmo ViaCEP do checkout, mesmo endereço de cobrança separado. O
// que mudou é onde a checklist do que falta aparece — aqui, na tela onde dá
// para resolver, e não no Início, onde só dava para ler.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatarCpfCnpj, somenteDigitos, tipoDocumento, validarCpfCnpj } from '../../lib/documento';
import { buscarCep, formatarCep } from '../../lib/shop/checkout';
import { faltasDoCadastro, formatarTelefone, telefoneOk, UFS } from '../../lib/shop/conta';
import styles from './Painel.module.css';

interface Perfil {
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  cpf_cnpj: string | null;
  ie: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  cobranca_igual_entrega?: boolean | null;
  cobranca_cep?: string | null;
  cobranca_numero?: string | null;
}

const VAZIO: Perfil = {
  full_name: '',
  company_name: '',
  phone: '',
  cpf_cnpj: '',
  ie: '',
  address_street: '',
  address_number: '',
  address_complement: '',
  address_neighborhood: '',
  address_city: '',
  address_state: '',
  address_zip: '',
  cobranca_cep: '',
  cobranca_numero: '',
};

const CAMPOS =
  'full_name, company_name, phone, cpf_cnpj, ie, address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_zip, cobranca_cep, cobranca_numero, cobranca_igual_entrega';

export default function PainelDados() {
  const { user, profile, recarregarPerfil } = useAuth();
  const [perfil, setPerfil] = useState<Perfil>(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [cobrancaPropria, setCobrancaPropria] = useState(false);
  const cepBusca = useRef<AbortController | null>(null);

  const carregar = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('user_profiles').select(CAMPOS).eq('id', user.id).maybeSingle();
    if (data) {
      const bruto = data as Perfil;
      const limpo = { ...VAZIO };
      for (const k of Object.keys(VAZIO) as (keyof Perfil)[]) {
        const v = bruto[k];
        (limpo as Record<string, unknown>)[k] = typeof v === 'string' ? v : '';
      }
      limpo.phone = formatarTelefone(limpo.phone ?? '');
      limpo.address_zip = formatarCep(limpo.address_zip ?? '');
      limpo.cobranca_cep = formatarCep(limpo.cobranca_cep ?? '');
      setPerfil(limpo);
      setCobrancaPropria(bruto.cobranca_igual_entrega === false);
    }
    setCarregando(false);
  }, [user]);

  useEffect(() => {
    // Carga inicial do cadastro.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar();
  }, [carregar]);

  const lojista = profile?.role === 'reseller';
  const doc = perfil.cpf_cnpj ?? '';
  const faltando = faltasDoCadastro(perfil);

  const set = (k: keyof Perfil) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setPerfil((p) => ({ ...p, [k]: e.target.value }));

  /** CEP completo preenche rua/bairro/cidade/UF (ViaCEP), como no checkout. */
  const mudarCep = (bruto: string) => {
    const cep = formatarCep(bruto);
    setPerfil((p) => ({ ...p, address_zip: cep }));
    if (cepBusca.current) cepBusca.current.abort();
    const d = somenteDigitos(cep);
    if (d.length !== 8) return;
    const ctrl = new AbortController();
    cepBusca.current = ctrl;
    void buscarCep(d, ctrl.signal).then((r) => {
      if (!r || ctrl.signal.aborted) return;
      setPerfil((p) => ({
        ...p,
        address_street: r.logradouro || p.address_street,
        address_neighborhood: r.bairro || p.address_neighborhood,
        address_city: r.localidade,
        address_state: r.uf,
      }));
    });
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!user) return;
    if (doc && !validarCpfCnpj(doc)) {
      setMsg({ tipo: 'erro', texto: 'CPF/CNPJ inválido — confira os dígitos.' });
      return;
    }
    if (lojista && tipoDocumento(doc) !== 'cnpj') {
      setMsg({ tipo: 'erro', texto: 'Lojista precisa de CNPJ.' });
      return;
    }
    if (perfil.phone && !telefoneOk(perfil.phone)) {
      setMsg({ tipo: 'erro', texto: 'WhatsApp incompleto — informe o DDD.' });
      return;
    }
    setSalvando(true);
    const patch: Record<string, unknown> = {
      ...perfil,
      cpf_cnpj: doc ? somenteDigitos(doc) : null,
      address_zip: somenteDigitos(perfil.address_zip ?? '') || null,
      address_state: (perfil.address_state ?? '').toUpperCase() || null,
      cobranca_igual_entrega: !cobrancaPropria,
      cobranca_cep: cobrancaPropria ? somenteDigitos(perfil.cobranca_cep ?? '') || null : null,
      cobranca_numero: cobrancaPropria ? perfil.cobranca_numero || null : null,
    };
    for (const k of Object.keys(patch)) if (patch[k] === '') patch[k] = null;
    const { error } = await supabase.from('user_profiles').update(patch).eq('id', user.id);
    setSalvando(false);
    if (!error) await recarregarPerfil();
    setMsg(error ? { tipo: 'erro', texto: error.message } : { tipo: 'ok', texto: 'Dados salvos.' });
  };

  if (carregando) return <p className={styles.mudo}>Carregando…</p>;

  return (
    <section className={styles.bloco}>
      {faltando.length > 0 && (
        <div className={styles.pendencia}>
          <p>Para fechar um pedido pelo site ainda falta:</p>
          <ul className={styles.checklist}>
            {faltando.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      <form className={styles.form} onSubmit={salvar}>
        <label className={styles.campo}>
          <span>Nome</span>
          <input value={perfil.full_name ?? ''} onChange={set('full_name')} required />
        </label>
        <label className={styles.campo}>
          <span>WhatsApp</span>
          <input
            value={perfil.phone ?? ''}
            onChange={(e) => setPerfil((x) => ({ ...x, phone: formatarTelefone(e.target.value) }))}
            inputMode="tel"
            autoComplete="tel"
            maxLength={15}
            placeholder="(11) 99999-9999"
          />
        </label>
        <label className={styles.campo}>
          <span>{lojista ? 'CNPJ' : 'CPF ou CNPJ'}</span>
          <input
            value={formatarCpfCnpj(doc)}
            onChange={set('cpf_cnpj')}
            inputMode="numeric"
            required={lojista}
            placeholder={lojista ? '00.000.000/0000-00' : '000.000.000-00'}
          />
        </label>
        {(lojista || tipoDocumento(doc) === 'cnpj') && (
          <>
            <label className={styles.campo}>
              <span>Razão social</span>
              <input value={perfil.company_name ?? ''} onChange={set('company_name')} required={lojista} />
            </label>
            <label className={styles.campo}>
              <span>Inscrição estadual</span>
              <input value={perfil.ie ?? ''} onChange={set('ie')} placeholder="ou ISENTO" />
            </label>
          </>
        )}

        <h3 className={styles.subsub}>Endereço de entrega</h3>
        <label className={styles.campo}>
          <span>CEP</span>
          <input
            value={perfil.address_zip ?? ''}
            onChange={(e) => mudarCep(e.target.value)}
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={9}
            placeholder="00000-000"
          />
        </label>
        <label className={`${styles.campo} ${styles.campoLargo}`}>
          <span>Rua</span>
          <input value={perfil.address_street ?? ''} onChange={set('address_street')} />
        </label>
        <label className={styles.campo}>
          <span>Número</span>
          <input value={perfil.address_number ?? ''} onChange={set('address_number')} />
        </label>
        <label className={styles.campo}>
          <span>Complemento</span>
          <input value={perfil.address_complement ?? ''} onChange={set('address_complement')} />
        </label>
        <label className={styles.campo}>
          <span>Bairro</span>
          <input value={perfil.address_neighborhood ?? ''} onChange={set('address_neighborhood')} />
        </label>
        <label className={styles.campo}>
          <span>Cidade</span>
          <input value={perfil.address_city ?? ''} onChange={set('address_city')} />
        </label>
        <label className={styles.campo}>
          <span>UF</span>
          <select value={(perfil.address_state ?? '').toUpperCase()} onChange={set('address_state')}>
            <option value="">—</option>
            {UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </label>

        {/* Cartão de crédito confere o endereço do titular; às vezes ele é o da
            fatura, não o da entrega. */}
        <label className={styles.chaveCobranca}>
          <input type="checkbox" checked={cobrancaPropria} onChange={(e) => setCobrancaPropria(e.target.checked)} />
          <span>O endereço de cobrança do cartão é diferente</span>
        </label>
        {cobrancaPropria && (
          <>
            <label className={styles.campo}>
              <span>CEP de cobrança</span>
              <input
                value={perfil.cobranca_cep ?? ''}
                onChange={(e) => setPerfil((x) => ({ ...x, cobranca_cep: formatarCep(e.target.value) }))}
                inputMode="numeric"
                maxLength={9}
                placeholder="00000-000"
              />
            </label>
            <label className={styles.campo}>
              <span>Número de cobrança</span>
              <input value={perfil.cobranca_numero ?? ''} onChange={set('cobranca_numero')} />
            </label>
          </>
        )}

        {msg && <p className={msg.tipo === 'ok' ? styles.ok : styles.erro}>{msg.texto}</p>}
        <button type="submit" className={styles.salvar} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar dados'}
        </button>
      </form>
    </section>
  );
}
