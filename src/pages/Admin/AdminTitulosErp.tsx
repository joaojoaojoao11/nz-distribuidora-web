// Admin → Clientes: os títulos do NZERP que o job não conseguiu atribuir.
//
// O job (api/_lib/conta/atribuirTitulos.ts) decide o dono de cada título do
// contas a receber por documento, por orçamento ou por nome exato e não
// ambíguo, e grava no banco do SITE — o NZERP não é escrito em momento nenhum.
// Hoje isso resolve ~95% dos títulos vivos.
//
// Os que sobram vêm parar aqui. Era o combinado com o João: "o que não
// conseguir replicar não tem problema, só vamos relatando para ir consertando
// com o tempo". Título sem dono não aparece para cliente nenhum — o silêncio é
// o padrão seguro, e esta tela é o caminho de sair dele.
//
// A atribuição à mão é feita para uma CONTA DO SITE já vinculada a um cliente
// do ERP, porque é isso que a pergunta realmente é: quem vai enxergar este
// título quando entrar em /painel/pagamentos.

import { useCallback, useEffect, useState } from 'react';
import { chamarConta, textoDoErroConta } from '../../lib/shop/conta';
import styles from './Admin.module.css';

interface TituloSemDono {
  id: string;
  nome: string | null;
  valor: number | null;
  vencimento: string | null;
  documento: boolean;
}

interface Rodada {
  rodou_em: string;
  titulos_lidos: number;
  por_documento: number;
  por_orcamento: number;
  por_nome: number;
  sem_dono: number;
  ambiguos: number;
  duracao_ms: number | null;
}

export interface ContaVinculada {
  id: string;
  erp_client_id: string | null;
  full_name: string | null;
  company_name: string | null;
  email: string | null;
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dia = (s: string | null) => (s ? new Date(`${s}T12:00:00`).toLocaleDateString('pt-BR') : '—');

export default function AdminTitulosErp({ contas }: { contas: ContaVinculada[] }) {
  const [titulos, setTitulos] = useState<TituloSemDono[]>([]);
  const [rodada, setRodada] = useState<Rodada | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState('');
  const [escolha, setEscolha] = useState<Record<string, string>>({});

  const vinculadas = contas.filter((c) => c.erp_client_id);

  const carregar = useCallback(async () => {
    try {
      const r = await chamarConta<{ titulos: TituloSemDono[]; ultimaRodada: Rodada | null }>({ op: 'titulos-sem-dono' });
      setTitulos(r.titulos ?? []);
      setRodada(r.ultimaRodada ?? null);
    } catch (e) {
      setMsg(textoDoErroConta(e));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const rodar = async () => {
    setOcupado(true);
    setMsg('');
    try {
      const r = await chamarConta<Rodada & { porDocumento: number; porOrcamento: number; porNome: number; semDono: number; ambiguos: number; titulosLidos: number }>({
        op: 'atribuir-titulos',
      });
      setMsg(
        `${r.titulosLidos} títulos lidos: ${r.porDocumento} por documento, ${r.porOrcamento} por orçamento, ${r.porNome} por nome. ` +
          `${r.semDono} sem dono e ${r.ambiguos} de nome repetido ficaram para atribuir à mão.`
      );
      await carregar();
    } catch (e) {
      setMsg(textoDoErroConta(e));
    } finally {
      setOcupado(false);
    }
  };

  const atribuir = async (tituloId: string) => {
    const contaId = escolha[tituloId];
    const conta = vinculadas.find((c) => c.id === contaId);
    if (!conta?.erp_client_id) return;
    setOcupado(true);
    setMsg('');
    try {
      await chamarConta({ op: 'atribuir-titulo', tituloId, erpClientId: conta.erp_client_id });
      setTitulos((t) => t.filter((x) => x.id !== tituloId));
      setMsg(`Título atribuído a ${conta.company_name || conta.full_name || conta.email}.`);
    } catch (e) {
      setMsg(textoDoErroConta(e));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className={styles.tableSection}>
      <h3 className={styles.tableSectionTitle}>
        Títulos do NZERP sem dono
        {titulos.length > 0 && <> — {titulos.length}</>}
      </h3>
      <p className={styles.tabDescription}>
        O site decide de quem é cada parcela do contas a receber por documento, por orçamento ou por nome
        exato — a mesma chave que o próprio NZERP usa na view financeira dele. Nada disso é gravado no ERP:
        a decisão mora no banco do site. O que não casou está aqui, e enquanto estiver <strong>não aparece
        para cliente nenhum</strong>.
      </p>

      {rodada && (
        <p style={{ color: '#a1a1a6', fontSize: '0.85rem' }}>
          Última rodada em {new Date(rodada.rodou_em).toLocaleString('pt-BR')}: {rodada.titulos_lidos} títulos —{' '}
          {rodada.por_documento} por documento, {rodada.por_orcamento} por orçamento, {rodada.por_nome} por nome,{' '}
          {rodada.sem_dono} sem dono, {rodada.ambiguos} de nome repetido.
        </p>
      )}

      <button type="button" className={styles.actionBtn} disabled={ocupado} onClick={() => void rodar()}>
        {ocupado ? 'Rodando…' : 'Rodar a atribuição agora'}
      </button>
      {msg && <p style={{ color: '#a1a1a6' }}>{msg}</p>}

      {carregando ? (
        <p style={{ color: '#a1a1a6' }}>Carregando…</p>
      ) : titulos.length === 0 ? (
        <p style={{ color: '#a1a1a6' }}>Nenhum título sobrando. Todos têm dono.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome no título</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Por que sobrou</th>
                <th>Atribuir a</th>
              </tr>
            </thead>
            <tbody>
              {titulos.map((t) => (
                <tr key={t.id}>
                  <td>{t.nome ?? '—'}</td>
                  <td>{t.valor != null ? BRL.format(Number(t.valor)) : '—'}</td>
                  <td>{dia(t.vencimento)}</td>
                  <td>{t.documento ? 'Documento não bate com nenhum cliente' : 'Sem documento e o nome não é único'}</td>
                  <td>
                    <select value={escolha[t.id] ?? ''} onChange={(e) => setEscolha((x) => ({ ...x, [t.id]: e.target.value }))}>
                      <option value="">escolher conta…</option>
                      {vinculadas.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.company_name || c.full_name || c.email}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      disabled={ocupado || !escolha[t.id]}
                      onClick={() => void atribuir(t.id)}
                    >
                      Atribuir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
