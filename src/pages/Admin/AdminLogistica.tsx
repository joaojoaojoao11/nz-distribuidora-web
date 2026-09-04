// Aba Logística do painel admin.
//
// Três seções: perfis de embalagem (com atribuição às linhas do catálogo),
// transportadoras e diagnóstico.
//
// Decisão de modelagem visível aqui: peso e medida são cadastrados por PERFIL e
// ligados a uma LINHA, não por produto. As 92 cores Metamark 7 Series são o
// mesmo filme físico, e 320 dos 505 itens do catálogo vivem em arquivo .ts,
// fora do banco — cadastrar item a item não os alcançaria.
//
// As credenciais das transportadoras NÃO aparecem nem são editáveis aqui: são
// variáveis de ambiente lidas só em api/. O painel exibe apenas se existem.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './Admin.module.css';

/** Linhas do catálogo — espelha LineKey de src/lib/shop/types.ts. */
const LINE_KEYS: { key: string; label: string }[] = [
  { key: 'nzwrap', label: 'NZWRAP Premium' },
  { key: 'mcx', label: 'MetaCast MCX' },
  { key: 'm7', label: 'Metamark 7 Series' },
  { key: 'oracal-651', label: 'Oracal 651' },
  { key: 'oracal-670', label: 'Oracal 670RA' },
  { key: 'sh-wrapping', label: 'SH Wrapping' },
  { key: 'etherna', label: 'Etherna Decor' },
  { key: 'sh-decor', label: 'SH Decor' },
  { key: 'avery', label: 'Avery Dennison' },
  { key: 'md80', label: 'Metamark MD-80' },
  { key: 'ppf', label: 'NZPPF' },
];

interface Perfil {
  id: string;
  nome: string;
  formato: 'rolo' | 'caixa' | 'tubo';
  peso_kg: number;
  comprimento_cm: number;
  largura_cm: number;
  altura_cm: number;
  observacao: string | null;
  ativo: boolean;
}

interface PerfilLinha {
  id: string;
  profile_id: string;
  line_key: string;
  is_default: boolean;
}

interface Transportadora {
  id: string;
  slug: string;
  nome: string;
  ativo: boolean;
  cep_origem: string;
  dias_manuseio: number;
  modalidade: string | null;
  ordem: number;
}

interface StatusCredencial {
  slug: string;
  configurada: boolean;
  modo: string;
}

const FORM_VAZIO = {
  nome: '',
  formato: 'rolo' as Perfil['formato'],
  peso_kg: '',
  comprimento_cm: '',
  largura_cm: '',
  altura_cm: '',
  observacao: '',
};

export default function AdminLogistica() {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [vinculos, setVinculos] = useState<PerfilLinha[]>([]);
  const [carriers, setCarriers] = useState<Transportadora[]>([]);
  const [credenciais, setCredenciais] = useState<StatusCredencial[]>([]);
  const [modo, setModo] = useState<string>('—');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Perfil | null>(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  // Diagnóstico
  const [testeCep, setTesteCep] = useState('');
  const [testePerfil, setTestePerfil] = useState('');
  const [testeResultado, setTesteResultado] = useState<unknown>(null);
  const [testando, setTestando] = useState(false);

  // Nenhum setState antes do primeiro await: `loading` já nasce true e é
  // desligado no fim. Recarregar depois de uma alteração acontece em silêncio,
  // sem piscar o spinner — as tabelas são pequenas e a troca é instantânea.
  const carregar = useCallback(async () => {
    const [p, v, c] = await Promise.all([
      supabase.from('shipping_profiles').select('*').order('nome'),
      supabase.from('shipping_profile_lines').select('*'),
      supabase.from('shipping_carriers').select('*').order('ordem'),
    ]);

    setErro('');

    // A tabela pode ainda não existir se a migration não tiver sido aplicada —
    // dizer isso é mais útil do que uma tela vazia sem explicação.
    if (p.error) {
      setErro(
        `Não consegui ler shipping_profiles: ${p.error.message}. A migration migrations/2026-09-03_logistica_transportadoras.sql já foi aplicada?`
      );
      setLoading(false);
      return;
    }

    setPerfis((p.data ?? []) as unknown as Perfil[]);
    setVinculos((v.data ?? []) as unknown as PerfilLinha[]);
    setCarriers((c.data ?? []) as unknown as Transportadora[]);
    setLoading(false);
  }, []);

  const carregarCredenciais = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const res = await fetch('/api/logistica/testar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (!res.ok) return;
      const json = (await res.json()) as { modo: string; carriers: StatusCredencial[] };
      setModo(json.modo);
      setCredenciais(json.carriers ?? []);
    } catch {
      // `npm run dev` devolve 503 em /api/*: sem diagnóstico, mas a aba funciona.
    }
  }, []);

  useEffect(() => {
    // A regra do React Compiler marca qualquer setState alcançável a partir de
    // um efeito, mesmo depois de await, e não distingue o padrão canônico de
    // buscar dados no mount. Não há setState síncrono em `carregar`.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar();
    void carregarCredenciais();
  }, [carregar, carregarCredenciais]);

  const abrirModal = (perfil?: Perfil) => {
    if (perfil) {
      setEditando(perfil);
      setForm({
        nome: perfil.nome,
        formato: perfil.formato,
        peso_kg: String(perfil.peso_kg),
        comprimento_cm: String(perfil.comprimento_cm),
        largura_cm: String(perfil.largura_cm),
        altura_cm: String(perfil.altura_cm),
        observacao: perfil.observacao ?? '',
      });
    } else {
      setEditando(null);
      setForm(FORM_VAZIO);
    }
    setErro('');
    setModalAberto(true);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');

    const payload = {
      nome: form.nome.trim(),
      formato: form.formato,
      peso_kg: parseFloat(form.peso_kg) || 0,
      comprimento_cm: parseFloat(form.comprimento_cm) || 0,
      largura_cm: parseFloat(form.largura_cm) || 0,
      altura_cm: parseFloat(form.altura_cm) || 0,
      observacao: form.observacao.trim() || null,
    };

    const { error } = editando
      ? await supabase.from('shipping_profiles').update(payload).eq('id', editando.id)
      : await supabase.from('shipping_profiles').insert([payload]);

    if (error) setErro(error.message);
    else {
      setModalAberto(false);
      await carregar();
    }
    setSalvando(false);
  };

  const remover = async (perfil: Perfil) => {
    if (!window.confirm(`Remover o perfil "${perfil.nome}"? As linhas ligadas a ele ficam sem prazo.`))
      return;
    const { error } = await supabase.from('shipping_profiles').delete().eq('id', perfil.id);
    if (error) setErro(error.message);
    await carregar();
  };

  const alternarLinha = async (perfilId: string, lineKey: string) => {
    const existente = vinculos.find((v) => v.profile_id === perfilId && v.line_key === lineKey);
    if (existente) {
      await supabase.from('shipping_profile_lines').delete().eq('id', existente.id);
    } else {
      // O primeiro perfil de uma linha vira o padrão automaticamente — senão a
      // linha ficaria com perfil cadastrado e nenhum default, e o endpoint teria
      // que escolher arbitrariamente.
      const jaTemPadrao = vinculos.some((v) => v.line_key === lineKey && v.is_default);
      const { error } = await supabase
        .from('shipping_profile_lines')
        .insert([{ profile_id: perfilId, line_key: lineKey, is_default: !jaTemPadrao }]);
      if (error) setErro(error.message);
    }
    await carregar();
  };

  const definirPadrao = async (perfilId: string, lineKey: string) => {
    // Índice único parcial no banco garante um padrão por linha; limpar antes
    // evita bater na constraint.
    const atuais = vinculos.filter((v) => v.line_key === lineKey && v.is_default);
    for (const v of atuais) {
      await supabase.from('shipping_profile_lines').update({ is_default: false }).eq('id', v.id);
    }
    const alvo = vinculos.find((v) => v.profile_id === perfilId && v.line_key === lineKey);
    if (alvo) {
      await supabase.from('shipping_profile_lines').update({ is_default: true }).eq('id', alvo.id);
    }
    await carregar();
  };

  const alternarCarrier = async (c: Transportadora) => {
    await supabase.from('shipping_carriers').update({ ativo: !c.ativo }).eq('id', c.id);
    await carregar();
  };

  const atualizarCarrier = async (c: Transportadora, campo: string, valor: string | number) => {
    await supabase.from('shipping_carriers').update({ [campo]: valor }).eq('id', c.id);
    await carregar();
  };

  const testar = async () => {
    setTestando(true);
    setTesteResultado(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch('/api/logistica/testar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
        body: JSON.stringify({ cep: testeCep.replace(/\D/g, ''), profileId: testePerfil }),
      });
      setTesteResultado(await res.json());
    } catch (err) {
      setTesteResultado({ erro: err instanceof Error ? err.message : String(err) });
    }
    setTestando(false);
  };

  // Cobertura: sem isso ninguém percebe que metade do catálogo não mostra prazo.
  const linhasSemPerfil = LINE_KEYS.filter((l) => !vinculos.some((v) => v.line_key === l.key));

  if (loading) return <p style={{ color: '#a1a1a6' }}>Carregando logística…</p>;

  return (
    <div>
      <p className={styles.tabDescription}>
        Peso e medidas são cadastrados por <strong>perfil de embalagem</strong> e ligados a uma
        linha do catálogo — não produto a produto. A página de produto usa isso para consultar o{' '}
        <strong>prazo</strong> de entrega. Valor de frete nunca é exibido no site.
      </p>

      {erro && (
        <div className={styles.createError} style={{ marginBottom: '1rem' }}>
          {erro}
        </div>
      )}

      {/* ---------------------------------------------------- cobertura */}
      {linhasSemPerfil.length > 0 && (
        <div
          className={styles.tableSection}
          style={{ borderLeft: '3px solid #ff4444', marginBottom: '1.5rem' }}
        >
          <h3 className={styles.tableSectionTitle}>
            {linhasSemPerfil.length} linha(s) sem perfil de embalagem
          </h3>
          <p style={{ color: '#a1a1a6', fontSize: '0.85rem' }}>
            Produtos destas linhas não mostram prazo de entrega:{' '}
            {linhasSemPerfil.map((l) => l.label).join(', ')}.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------ perfis */}
      <div className={styles.tableSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className={styles.tableSectionTitle}>Perfis de embalagem ({perfis.length})</h3>
          <button type="button" className={styles.createBtn} onClick={() => abrirModal()}>
            + Novo perfil
          </button>
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Perfil</th>
                <th>Formato</th>
                <th>Peso</th>
                <th>C × L × A (cm)</th>
                <th>Linhas do catálogo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {perfis.map((p) => {
                const meus = vinculos.filter((v) => v.profile_id === p.id);
                return (
                  <tr key={p.id}>
                    <td>{p.nome}</td>
                    <td>{p.formato}</td>
                    <td>{p.peso_kg} kg</td>
                    <td>
                      {p.comprimento_cm} × {p.largura_cm} × {p.altura_cm}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {LINE_KEYS.map((l) => {
                          const vinculo = meus.find((v) => v.line_key === l.key);
                          const ativo = Boolean(vinculo);
                          return (
                            <button
                              key={l.key}
                              type="button"
                              onClick={() => alternarLinha(p.id, l.key)}
                              onDoubleClick={() => ativo && definirPadrao(p.id, l.key)}
                              title={
                                ativo
                                  ? vinculo?.is_default
                                    ? 'Padrão da linha. Clique para desvincular.'
                                    : 'Vinculado. Duplo clique para tornar padrão.'
                                  : 'Clique para vincular'
                              }
                              style={{
                                padding: '0.15rem 0.45rem',
                                borderRadius: '99px',
                                fontSize: '0.68rem',
                                cursor: 'pointer',
                                border: `1px solid ${ativo ? '#d11e1e' : 'rgba(255,255,255,0.15)'}`,
                                background: vinculo?.is_default
                                  ? 'rgba(209,30,30,0.25)'
                                  : ativo
                                    ? 'rgba(209,30,30,0.1)'
                                    : 'transparent',
                                color: ativo ? '#f5f5f7' : '#6b6b70',
                              }}
                            >
                              {l.label}
                              {vinculo?.is_default ? ' ★' : ''}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      <button type="button" className={styles.actionBtn} onClick={() => abrirModal(p)}>
                        Editar
                      </button>
                      <button type="button" className={styles.actionBtn} onClick={() => remover(p)}>
                        Remover
                      </button>
                    </td>
                  </tr>
                );
              })}
              {perfis.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    Nenhum perfil cadastrado. Sem perfil, nenhum produto mostra prazo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --------------------------------------------- transportadoras */}
      <div className={styles.tableSection}>
        <h3 className={styles.tableSectionTitle}>Transportadoras — modo: {modo}</h3>
        <p style={{ color: '#6b6b70', fontSize: '0.8rem', marginBottom: '0.8rem' }}>
          Credenciais ficam em variável de ambiente do servidor e não são editáveis aqui. Enquanto
          o modo for <code>mock</code>, os prazos são simulados e não devem ser divulgados.
        </p>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Transportadora</th>
                <th>Credencial</th>
                <th>CEP origem</th>
                <th>Dias de manuseio</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {carriers.map((c) => {
                const cred = credenciais.find((k) => k.slug === c.slug);
                return (
                  <tr key={c.id}>
                    <td>{c.nome}</td>
                    <td>
                      <span className={styles.badge}>
                        {cred ? (cred.configurada ? '✓ configurada' : '✗ ausente') : '—'}
                      </span>
                    </td>
                    <td>
                      <input
                        className={styles.adminInput}
                        defaultValue={c.cep_origem}
                        onBlur={(e) =>
                          atualizarCarrier(c, 'cep_origem', e.target.value.replace(/\D/g, ''))
                        }
                        style={{ maxWidth: 120 }}
                      />
                    </td>
                    <td>
                      <input
                        className={styles.adminInput}
                        type="number"
                        min={0}
                        defaultValue={c.dias_manuseio}
                        onBlur={(e) =>
                          atualizarCarrier(c, 'dias_manuseio', Number(e.target.value) || 0)
                        }
                        style={{ maxWidth: 80 }}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => alternarCarrier(c)}
                      >
                        {c.ativo ? 'Ativa — desativar' : 'Inativa — ativar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------- diagnóstico */}
      <div className={styles.tableSection}>
        <h3 className={styles.tableSectionTitle}>Teste de prazo</h3>
        <div className={styles.adminFormRow3}>
          <div className={styles.adminFormGroup}>
            <label className={styles.adminLabel}>Perfil</label>
            <select
              className={styles.adminInput}
              value={testePerfil}
              onChange={(e) => setTestePerfil(e.target.value)}
            >
              <option value="">Selecione…</option>
              {perfis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.adminFormGroup}>
            <label className={styles.adminLabel}>CEP de destino</label>
            <input
              className={styles.adminInput}
              value={testeCep}
              onChange={(e) => setTesteCep(e.target.value)}
              placeholder="01310100"
            />
          </div>
          <div className={styles.adminFormGroup}>
            <label className={styles.adminLabel}>&nbsp;</label>
            <button
              type="button"
              className={styles.createBtnConfirm}
              onClick={testar}
              disabled={testando || !testePerfil || testeCep.replace(/\D/g, '').length !== 8}
            >
              {testando ? 'Consultando…' : 'Consultar'}
            </button>
          </div>
        </div>

        {testeResultado != null && (
          <pre
            style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#0a0a0c',
              borderRadius: 8,
              color: '#a1a1a6',
              fontSize: '0.75rem',
              overflowX: 'auto',
            }}
          >
            {JSON.stringify(testeResultado, null, 2)}
          </pre>
        )}
      </div>

      {/* ------------------------------------------------------- modal */}
      {modalAberto && (
        <div className={styles.modalOverlay} onClick={() => setModalAberto(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.createModalTitle}>
              {editando ? 'Editar perfil' : 'Novo perfil de embalagem'}
            </h3>
            {erro && <div className={styles.createError}>{erro}</div>}
            <form onSubmit={salvar} className={styles.createGrid}>
              <div className={styles.createField}>
                <label className={styles.adminLabel}>Nome</label>
                <input
                  className={styles.adminInput}
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Rolo Etherna 1,22 × 25 m"
                  required
                />
              </div>
              <div className={styles.createField}>
                <label className={styles.adminLabel}>Formato</label>
                <select
                  className={styles.adminInput}
                  value={form.formato}
                  onChange={(e) =>
                    setForm({ ...form, formato: e.target.value as Perfil['formato'] })
                  }
                >
                  <option value="rolo">Rolo</option>
                  <option value="caixa">Caixa</option>
                  <option value="tubo">Tubo</option>
                </select>
              </div>
              <div className={styles.createField}>
                <label className={styles.adminLabel}>Peso (kg)</label>
                <input
                  className={styles.adminInput}
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={form.peso_kg}
                  onChange={(e) => setForm({ ...form, peso_kg: e.target.value })}
                  required
                />
              </div>
              <div className={styles.createField}>
                <label className={styles.adminLabel}>Comprimento (cm)</label>
                <input
                  className={styles.adminInput}
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={form.comprimento_cm}
                  onChange={(e) => setForm({ ...form, comprimento_cm: e.target.value })}
                  required
                />
              </div>
              <div className={styles.createField}>
                <label className={styles.adminLabel}>Largura (cm)</label>
                <input
                  className={styles.adminInput}
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={form.largura_cm}
                  onChange={(e) => setForm({ ...form, largura_cm: e.target.value })}
                  required
                />
              </div>
              <div className={styles.createField}>
                <label className={styles.adminLabel}>Altura (cm)</label>
                <input
                  className={styles.adminInput}
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={form.altura_cm}
                  onChange={(e) => setForm({ ...form, altura_cm: e.target.value })}
                  required
                />
              </div>
              <div className={styles.createField} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.adminLabel}>Observação</label>
                <textarea
                  className={styles.adminTextarea}
                  value={form.observacao}
                  onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                  rows={2}
                />
              </div>
              <div className={styles.createActions}>
                <button
                  type="button"
                  className={styles.createBtnCancel}
                  onClick={() => setModalAberto(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.createBtnConfirm} disabled={salvando}>
                  {salvando ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
