// De quem é cada título do contas a receber do NZERP.
//
// O ERP é somente leitura (docs/PLANO_CONEXAO_NZERP.md §0): tudo o que este
// job decide é gravado em `erp_titulo_dono`, no banco do SITE.
//
// Três chaves, nesta ordem — a primeira que casar manda:
//
//   1. documento  CPF/CNPJ do título igual ao do cliente        (confiança alta)
//   2. orçamento  `quote_id` do título aponta para um orçamento
//                 daquele cliente                                (confiança alta)
//   3. nome       `cliente_nome` exatamente igual ao nome de UM
//                 cliente só                                     (confiança média)
//
// A chave 3 parece frouxa e não é: a view `v_accounts_receivable`, que as telas
// financeiras do próprio ERP usam, tem uma coluna `IDCliente` que É o
// `cliente_nome`. O ERP já key-a título por nome. Ainda assim, dois cuidados:
// só nome EXATO depois de normalizado, e só quando o nome pertence a um único
// cliente — nome repetido entre clientes fica de fora, com todos os seus
// títulos.
//
// O que não casa não vira nada. Título sem linha aqui não aparece para cliente
// nenhum; ele entra no relatório do admin e é atribuído à mão. Era o combinado:
// "o que não conseguir replicar não tem problema, só vamos relatando".
//
// Atribuição manual (`chave = 'manual'`) NUNCA é sobrescrita pelo job.

import type { Db } from '../papel.js';
import { somenteDigitos } from './documento.js';
import { clienteErp } from '../pedido/despachoErp.js';

/** Nome comparável: sem acento, sem pontuação, espaços colapsados, minúsculo. */
export function normalizarNome(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw
    .normalize('NFD') // separa a letra do acento; a linha abaixo joga fora U+0300–U+036F

    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Sufixos societários não distinguem empresa nenhuma; sozinhos, não valem. */
const GENERICOS = new Set(['ltda', 'me', 'epp', 'eireli', 'sa', 's a', 'mei', 'cliente', 'consumidor', 'consumidor final', 'diversos', 'nao informado']);

export interface ResumoAtribuicao {
  titulosLidos: number;
  porDocumento: number;
  porOrcamento: number;
  porNome: number;
  semDono: number;
  ambiguos: number;
  duracaoMs: number;
  erro?: string;
}

interface ClienteErp {
  id: string;
  nome: string | null;
  name: string | null;
  cpf_cnpj: string | null;
  document: string | null;
}

interface TituloErp {
  id: string;
  cliente_nome: string | null;
  cliente_cpf_cnpj: string | null;
  quote_id: string | null;
  vencimento: string | null;
  valor: number | null;
}

const LOTE = 500;

export async function atribuirTitulos(site: Db): Promise<ResumoAtribuicao> {
  const t0 = Date.now();
  const vazio: ResumoAtribuicao = { titulosLidos: 0, porDocumento: 0, porOrcamento: 0, porNome: 0, semDono: 0, ambiguos: 0, duracaoMs: 0 };
  const erp = await clienteErp();
  if (!erp) return { ...vazio, erro: 'sem-erp' };

  // ------------------------------------------------------------- clientes
  const { data: clientesData, error: cErr } = await erp.from('clients').select('id, nome, name, cpf_cnpj, document');
  if (cErr) return { ...vazio, duracaoMs: Date.now() - t0, erro: `clients: ${cErr.message}` };
  const clientes = (clientesData ?? []) as ClienteErp[];

  const porDocumento = new Map<string, string>();
  const porNome = new Map<string, string | null>(); // null = nome ambíguo, não usar
  const nomesAmbiguos = new Set<string>();
  for (const c of clientes) {
    const doc = somenteDigitos(c.cpf_cnpj ?? c.document);
    if (doc.length >= 11 && !porDocumento.has(doc)) porDocumento.set(doc, c.id);
    for (const bruto of [c.nome, c.name]) {
      const n = normalizarNome(bruto);
      if (!n || n.length < 4 || GENERICOS.has(n)) continue;
      if (!porNome.has(n)) porNome.set(n, c.id);
      else if (porNome.get(n) !== c.id) {
        porNome.set(n, null);
        nomesAmbiguos.add(n);
      }
    }
  }

  // -------------------------------------------------- orçamentos por cliente
  // `quotes` não guarda client_id; guarda o documento. É o mesmo caminho da
  // chave 1, um passo depois.
  const { data: quotesData } = await erp.from('quotes').select('id, cpf_cnpj, client_name');
  const quoteDono = new Map<string, string>();
  for (const q of (quotesData ?? []) as { id: string; cpf_cnpj: string | null; client_name: string | null }[]) {
    const doc = somenteDigitos(q.cpf_cnpj);
    const alvo = (doc.length >= 11 ? porDocumento.get(doc) : undefined) ?? porNome.get(normalizarNome(q.client_name)) ?? undefined;
    if (alvo) quoteDono.set(q.id, alvo);
  }

  // ----------------------------------------------------- o que já é manual
  const { data: manuaisData } = await site.from('erp_titulo_dono').select('titulo_id').eq('chave', 'manual');
  const manuais = new Set(((manuaisData ?? []) as { titulo_id: string }[]).map((m) => m.titulo_id));

  // --------------------------------------------------------------- títulos
  const r: ResumoAtribuicao = { ...vazio };
  const ambiguosVistos = new Set<string>();
  let de = 0;
  for (;;) {
    const { data: titulosData, error: tErr } = await erp
      .from('contas_receber')
      .select('id, cliente_nome, cliente_cpf_cnpj, quote_id, vencimento, valor')
      .is('deleted_at', null)
      .order('id', { ascending: true })
      .range(de, de + LOTE - 1);
    if (tErr) return { ...r, duracaoMs: Date.now() - t0, erro: `contas_receber: ${tErr.message}` };
    const titulos = (titulosData ?? []) as TituloErp[];
    if (!titulos.length) break;
    r.titulosLidos += titulos.length;

    const linhas: Record<string, unknown>[] = [];
    for (const t of titulos) {
      if (manuais.has(t.id)) continue;

      let dono: string | undefined;
      let chave: 'documento' | 'orcamento' | 'nome' | undefined;

      const doc = somenteDigitos(t.cliente_cpf_cnpj);
      if (doc.length >= 11) {
        dono = porDocumento.get(doc);
        if (dono) chave = 'documento';
      }
      if (!dono && t.quote_id) {
        dono = quoteDono.get(t.quote_id);
        if (dono) chave = 'orcamento';
      }
      if (!dono) {
        const n = normalizarNome(t.cliente_nome);
        if (n && nomesAmbiguos.has(n)) {
          r.ambiguos++;
          ambiguosVistos.add(n);
        } else if (n) {
          const achou = porNome.get(n);
          if (achou) {
            dono = achou;
            chave = 'nome';
          }
        }
      }

      if (!dono || !chave) {
        r.semDono++;
        continue;
      }
      if (chave === 'documento') r.porDocumento++;
      else if (chave === 'orcamento') r.porOrcamento++;
      else r.porNome++;

      linhas.push({
        titulo_id: t.id,
        erp_client_id: dono,
        chave,
        confianca: chave === 'nome' ? 'media' : 'alta',
        cliente_nome: t.cliente_nome,
        vencimento: t.vencimento,
        valor: t.valor,
        atualizado_em: new Date().toISOString(),
      });
    }

    if (linhas.length) {
      const { error } = await site.from('erp_titulo_dono').upsert(linhas, { onConflict: 'titulo_id' });
      if (error) return { ...r, duracaoMs: Date.now() - t0, erro: `gravar: ${error.message}` };
    }
    if (titulos.length < LOTE) break;
    de += LOTE;
  }

  r.duracaoMs = Date.now() - t0;
  await site.from('erp_atribuicao_log').insert({
    titulos_lidos: r.titulosLidos,
    por_documento: r.porDocumento,
    por_orcamento: r.porOrcamento,
    por_nome: r.porNome,
    sem_dono: r.semDono,
    ambiguos: r.ambiguos,
    duracao_ms: r.duracaoMs,
  });
  return r;
}

/**
 * Os títulos que sobraram, para o relatório do admin — nome, valor e
 * vencimento, o bastante para escolher o dono sem abrir o ERP.
 */
export async function titulosSemDono(site: Db, limite = 200): Promise<{ id: string; nome: string | null; valor: number | null; vencimento: string | null; documento: boolean }[]> {
  const erp = await clienteErp();
  if (!erp) return [];
  const { data: donos } = await site.from('erp_titulo_dono').select('titulo_id');
  const temDono = new Set(((donos ?? []) as { titulo_id: string }[]).map((d) => d.titulo_id));
  const { data } = await erp
    .from('contas_receber')
    .select('id, cliente_nome, cliente_cpf_cnpj, valor, vencimento')
    .is('deleted_at', null)
    .order('vencimento', { ascending: false })
    .limit(2000);
  const fora: { id: string; nome: string | null; valor: number | null; vencimento: string | null; documento: boolean }[] = [];
  for (const t of (data ?? []) as TituloErp[]) {
    if (temDono.has(t.id)) continue;
    fora.push({ id: t.id, nome: t.cliente_nome, valor: t.valor, vencimento: t.vencimento, documento: somenteDigitos(t.cliente_cpf_cnpj).length >= 11 });
    if (fora.length >= limite) break;
  }
  return fora;
}
