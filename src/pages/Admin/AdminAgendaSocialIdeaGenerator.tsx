import { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './AdminAgendaSocial.module.css';
import {
  PILLARS_BY_ACCOUNT,
  templateChecklist,
  type Account,
} from './AdminAgendaSocial';
import { NZWRAP_COLORS } from '../../lib/data/nzwrapColors';
import { productLines } from '../../components/Catalog/data/catalogData';

// =====================================================================
// Tipos e dados
// =====================================================================

const ACCOUNTS_LABEL: Record<Account, string> = {
  nzppf:    '@nzppf',
  nzgroup:  '@nzgroup.br',
  joaowrap: '@joaowrap',
};

interface IdeaTemplate {
  title: string;     // pode conter placeholders {chave}
  format: string;    // 'Foto' | 'Carrossel' | 'Reel' | 'Story'
}

/**
 * Banco de templates por (conta × pilar). Cobre todos os pilares de
 * PILLARS_BY_ACCOUNT — pilares sem entrada explícita caem no fallback
 * genérico em generateIdeas().
 *
 * Placeholders usam {chave} e são preenchidos pelo dicionário FILLERS
 * em runtime, com matching por contexto quando o usuário fornece um.
 */
const IDEA_BANK: Record<Account, Record<string, IdeaTemplate[]>> = {
  nzppf: {
    'Showcase Luxury': [
      { title: '{carro} aplicação Luxury — brilho que vira presença', format: 'Reel' },
      { title: 'Antes e depois: {carro} com Luxury Gloss', format: 'Carrossel' },
      { title: 'Detalhe do acabamento espelhado — close em {parte}', format: 'Foto' },
      { title: '{carro} no entardecer com Luxury — 12 anos de garantia', format: 'Foto' },
    ],
    'Showcase Prime': [
      { title: '{carro} com Prime Gloss — TPU 100% virgem', format: 'Reel' },
      { title: 'Por que escolher Prime: case real em {carro}', format: 'Carrossel' },
      { title: 'Close no top-coat nano-dúplex — {parte} de {carro}', format: 'Foto' },
    ],
    'Showcase Flow': [
      { title: 'Flow Gloss em {carro} — nova formulação G2, 7 anos de garantia', format: 'Reel' },
      { title: '{carro} com Flow: hidrofobia em ação na chuva', format: 'Reel' },
      { title: 'Detalhamento Flow no {parte} — TPU técnico G2 185μ', format: 'Foto' },
    ],
    'Showcase Core': [
      { title: 'Core Gloss em {carro} — entrada premium pra frota', format: 'Carrossel' },
      { title: 'Híbrido 80/20 que protege de verdade — {carro}', format: 'Reel' },
      { title: 'Antes e depois Core no {parte} de {carro}', format: 'Foto' },
    ],
    'Showcase Headlight': [
      { title: 'Headlight Dark Black em {carro} — detalhes definem o conjunto', format: 'Foto' },
      { title: 'Antes/depois farol — {carro} ganhou outro nível', format: 'Carrossel' },
      { title: 'Aplicação de Headlight em {carro}: passo a passo', format: 'Reel' },
    ],
    'Showcase Windshield': [
      { title: 'Windshield em {carro} — proteção do parabrisa que ninguém vê', format: 'Reel' },
      { title: 'O que acontece com um parabrisa SEM Windshield', format: 'Carrossel' },
      { title: 'Garantia 2 anos contra trincas — Windshield em {carro}', format: 'Foto' },
    ],
    'Educativo Técnico': [
      { title: 'TPU vs PU comum — {dor} explicada', format: 'Carrossel' },
      { title: '+32% de brilho: o que isso significa na prática', format: 'Reel' },
      { title: '5 perguntas que todo cliente faz sobre PPF', format: 'Carrossel' },
      { title: 'Diferença entre {linha_ppf} e {linha_ppf} em 60 segundos', format: 'Reel' },
      { title: 'O que ninguém te conta sobre {dor} no PPF', format: 'Carrossel' },
    ],
    'B2B Lojista': [
      { title: '+1.200 lojas escolheram NZ — por quê', format: 'Carrossel' },
      { title: 'Como nossa rede cresceu {numero}% em 12 meses', format: 'Reel' },
      { title: '3 motivos pra um aplicador autorizado NZ vender mais', format: 'Carrossel' },
      { title: 'Suporte técnico NZ na prática — bastidor', format: 'Reel' },
    ],
    'Lançamento': [
      { title: 'Chegou: {linha_ppf} disponível em toda a rede', format: 'Reel' },
      { title: 'O que muda na nova {linha_ppf} — versão {numero}', format: 'Carrossel' },
      { title: 'Primeira aplicação da nova {linha_ppf} em {carro}', format: 'Foto' },
    ],
  },

  nzgroup: {
    'Catálogo NZ Wrap': [
      { title: 'Cor da semana: {cor_wrap}', format: 'Carrossel' },
      { title: '{cor_wrap} aplicado em {carro} — clicks reais', format: 'Foto' },
      { title: 'Como o {cor_wrap} muda em diferentes luzes', format: 'Reel' },
      { title: 'Top 5 cores NZ Wrap mais pedidas do mês', format: 'Carrossel' },
    ],
    'Catálogo SH Wrapping': [
      { title: 'Linha SH Wrapping — referência em finos', format: 'Carrossel' },
      { title: 'SH Wrapping em {carro}: mostragem de luz a luz', format: 'Reel' },
      { title: 'Por que profissionais escolhem SH Wrapping', format: 'Carrossel' },
    ],
    'Catálogo Oracal 651': [
      { title: 'Oracal 651: o vinil mais popular do mundo — por quê', format: 'Carrossel' },
      { title: '62 cores Oracal 651 em ação — qual a sua?', format: 'Reel' },
      { title: 'Recortes precisos com 651 — passo a passo', format: 'Reel' },
      { title: 'Sinalização premium feita com Oracal 651', format: 'Foto' },
    ],
    'Catálogo Oracal 670': [
      { title: 'Oracal 670RA — a evolução do 651 para wrapping', format: 'Carrossel' },
      { title: 'RapidAir® em ação — aplicação sem bolhas', format: 'Reel' },
      { title: '670RA em {carro}: cobertura full panel sem emendas', format: 'Foto' },
    ],
    'Captação Lojista': [
      { title: '+1.200 lojas. 10 estados. R$ 48mi.', format: 'Foto' },
      { title: 'Por que ser parceiro NZ Group em {numero} pontos', format: 'Carrossel' },
      { title: 'Como funciona a parceria — visita à matriz', format: 'Reel' },
      { title: 'Lojas NZ no Brasil — mapa atualizado', format: 'Foto' },
    ],
    'Mercado': [
      { title: 'Mercado de envelopamento cresceu {numero}% em 2025', format: 'Carrossel' },
      { title: 'Tendência {ano}: cores foscas dominam o wrapping', format: 'Reel' },
      { title: 'O que muda no mercado de PPF este {mes}', format: 'Carrossel' },
    ],
    'Bastidor logístico': [
      { title: 'Bastidor: pedido sai da matriz — destino {estado}', format: 'Reel' },
      { title: 'Como o estoque NZ é montado pra atender 1.200 lojas', format: 'Carrossel' },
      { title: 'Embalagem NZ: cuidado em cada rolo', format: 'Foto' },
    ],
    'NZ Academy': [
      { title: 'Próxima turma NZ Academy — vagas abertas', format: 'Carrossel' },
      { title: 'Top 3 erros de aplicação que vejo na Academy', format: 'Reel' },
      { title: 'Aluno NZ Academy mostra primeira aplicação', format: 'Reel' },
    ],
  },

  joaowrap: {
    'Autoridade Técnica': [
      { title: 'Por que TPU alifático é diferente — em 60 segundos', format: 'Reel' },
      { title: 'Como eu avalio um PPF antes de aplicar', format: 'Carrossel' },
      { title: 'Erro comum em {dor} que vejo nos grupos', format: 'Reel' },
    ],
    'Bastidor Empreendedor': [
      { title: 'Decisão difícil dessa semana: {tema_decisao}', format: 'Reel' },
      { title: 'Por que recusei pedido de {numero} mil — bastidor', format: 'Reel' },
      { title: 'O que mudou no NZ Group nos últimos 6 meses', format: 'Carrossel' },
      { title: 'Reunião de fábrica — bastidor de {mes}', format: 'Reel' },
    ],
    'Educação Aplicador': [
      { title: 'Top {numero} dicas pra fechar mais venda de PPF', format: 'Carrossel' },
      { title: 'Como precificar {linha_ppf} sem perder margem', format: 'Reel' },
      { title: 'Aplicador iniciante: o que ninguém te conta', format: 'Carrossel' },
    ],
    'Lifestyle': [
      { title: 'Rotina de quem trabalha com PPF de alto padrão', format: 'Reel' },
      { title: 'Carro do mês — {carro} que rodou na garagem', format: 'Foto' },
      { title: 'Café da manhã + ronda do dia — bastidor', format: 'Reel' },
    ],
  },
};

// =====================================================================
// Listas de fillers — derivam do código real onde possível
// =====================================================================

/** Title-cases o nome da cor wrap, removendo prefixo "NZWRAP". */
function prettifyWrapName(name: string): string {
  return name
    .replace(/^NZWRAP\s+/i, '')
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

const FILLERS: Record<string, string[]> = {
  carro: [
    'Lamborghini Urus', 'Porsche 911', 'BMW M3', 'BYD DM1', 'RAM 2500',
    'Range Rover', 'Tesla Model Y', 'Audi RS6', 'Mercedes G63', 'Ferrari Roma',
  ],
  parte: ['capô', 'paralama', 'porta', 'soleira', 'farol', 'maçaneta', 'teto', 'spoiler'],
  dor: ['amarelamento', 'descolamento', 'durabilidade real', 'regeneração térmica', 'top-coat fraco', 'adesivo errado'],
  // Cores de wrap puxadas do código real (nzwrapColors.ts), com nomes title-cased.
  cor_wrap: NZWRAP_COLORS.map((c) => prettifyWrapName(c.name)),
  // Linhas PPF puxadas do código real (catalogData.ts)
  linha_ppf: productLines.map((p) => p.shortName),
  tema_decisao: [
    'recusar pedido grande', 'demitir parceiro mal-alinhado',
    'segurar lançamento por mais 30 dias', 'mudar fornecedor de fábrica',
    'reorganizar logística de 3 estados', 'pausar campanha cara que não converteu',
  ],
  numero: ['3', '5', '7', '10', '12', '32'],
  ano: ['2025', '2026'],
  estado: ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS', 'BA'],
  mes: [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ],
};

// =====================================================================
// Gerador de ideias
// =====================================================================

interface GeneratedIdea {
  title: string;
  format: string;
  pillar: string;
  selected: boolean;
}

function fillPlaceholders(template: string, context: string): string {
  const ctx = context.toLowerCase().trim();
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const list = FILLERS[key];
    if (!list || list.length === 0) return `{${key}}`;
    // Prefer match contextual se o usuário deu um termo
    if (ctx) {
      const match = list.find(
        (v) => v.toLowerCase().includes(ctx) || ctx.includes(v.toLowerCase())
      );
      if (match) return match;
    }
    return list[Math.floor(Math.random() * list.length)];
  });
}

function generateIdeas(
  account: Account,
  pillar: string,
  count: number,
  context: string
): { title: string; format: string; pillar: string }[] {
  const bank = IDEA_BANK[account]?.[pillar] || [];
  const ideas: { title: string; format: string; pillar: string }[] = [];

  if (bank.length === 0) {
    // Fallback: pilar sem templates dedicados — gera entradas mínimas
    // que o usuário edita depois.
    for (let i = 0; i < count; i++) {
      const trimmed = context.trim();
      ideas.push({
        title: trimmed ? `${pillar} — ${trimmed}` : `${pillar} — ideia ${i + 1}`,
        format: 'Foto',
        pillar,
      });
    }
    return ideas;
  }

  for (let i = 0; i < count; i++) {
    const tpl = bank[Math.floor(Math.random() * bank.length)];
    ideas.push({
      title: fillPlaceholders(tpl.title, context),
      format: tpl.format,
      pillar,
    });
  }
  return ideas;
}

// =====================================================================
// Modal
// =====================================================================
interface IdeaGeneratorProps {
  defaultAccount: Account;
  onClose: () => void;
  onCreated: () => void;
}

export default function IdeaGeneratorModal({
  defaultAccount, onClose, onCreated,
}: IdeaGeneratorProps) {
  const [account, setAccount] = useState<Account>(defaultAccount);
  const [pillar, setPillar] = useState<string>(PILLARS_BY_ACCOUNT[defaultAccount][0]);
  const [count, setCount] = useState<number>(5);
  const [context, setContext] = useState('');
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [creating, setCreating] = useState(false);

  const pillarOptions = useMemo(() => PILLARS_BY_ACCOUNT[account], [account]);

  function handleAccountChange(next: Account) {
    setAccount(next);
    setPillar(PILLARS_BY_ACCOUNT[next][0]);
  }

  function handleGenerate() {
    if (!pillar) return;
    const generated = generateIdeas(account, pillar, count, context);
    setIdeas(generated.map((g) => ({ ...g, selected: true })));
  }

  function toggleSelect(idx: number) {
    setIdeas((prev) => prev.map((i, j) => (j === idx ? { ...i, selected: !i.selected } : i)));
  }

  function updateTitle(idx: number, title: string) {
    setIdeas((prev) => prev.map((i, j) => (j === idx ? { ...i, title } : i)));
  }

  function selectAll(value: boolean) {
    setIdeas((prev) => prev.map((i) => ({ ...i, selected: value })));
  }

  async function handleCreate() {
    const selected = ideas.filter((i) => i.selected && i.title.trim());
    if (selected.length === 0) {
      alert('Nenhuma ideia selecionada (ou títulos vazios).');
      return;
    }
    setCreating(true);
    const user = (await supabase.auth.getUser()).data.user;
    const payload = selected.map((i) => ({
      account,
      pillar: i.pillar,
      title: i.title.trim(),
      format: i.format,
      status: 'backlog' as const,
      checklist: templateChecklist(i.format),
      created_by: user?.id || null,
    }));
    const { error } = await supabase.from('social_posts').insert(payload);
    if (error) {
      alert('Erro: ' + error.message);
      setCreating(false);
      return;
    }
    alert(`${selected.length} ${selected.length === 1 ? 'ideia adicionada' : 'ideias adicionadas'} ao backlog.`);
    setCreating(false);
    onCreated();
    onClose();
  }

  const selectedCount = ideas.filter((i) => i.selected).length;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${styles.modalWide}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.modalHeader}>
          <h2>💡 Gerar ideias</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </header>

        <div className={styles.modalBody}>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>
              Conta
              <select
                className={styles.formInput}
                value={account}
                onChange={(e) => handleAccountChange(e.target.value as Account)}
              >
                {(Object.keys(ACCOUNTS_LABEL) as Account[]).map((a) => (
                  <option key={a} value={a}>{ACCOUNTS_LABEL[a]}</option>
                ))}
              </select>
            </label>
            <label className={styles.formLabel}>
              Pilar
              <select
                className={styles.formInput}
                value={pillar}
                onChange={(e) => setPillar(e.target.value)}
              >
                {pillarOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel}>
              Quantidade
              <input
                type="number"
                min={1}
                max={10}
                className={styles.formInput}
                value={count}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n)) setCount(Math.max(1, Math.min(10, Math.round(n))));
                }}
              />
            </label>
            <label className={styles.formLabel}>
              Contexto (opcional)
              <input
                className={styles.formInput}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder='ex: "BMW M3", "Ferrari Metallic Red"'
              />
            </label>
          </div>

          <div className={styles.ideaActions}>
            <button type="button" className={styles.primaryBtn} onClick={handleGenerate}>
              Gerar
            </button>
            {ideas.length > 0 && (
              <>
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => selectAll(true)}
                >
                  Selecionar todas
                </button>
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => selectAll(false)}
                >
                  Desmarcar todas
                </button>
              </>
            )}
          </div>

          {ideas.length > 0 && (
            <div className={styles.ideaList}>
              {ideas.map((idea, i) => (
                <div
                  key={i}
                  className={`${styles.ideaRow} ${idea.selected ? styles.ideaRowSelected : ''}`}
                >
                  <input
                    type="checkbox"
                    className={styles.checklistCheckbox}
                    checked={idea.selected}
                    onChange={() => toggleSelect(i)}
                  />
                  <input
                    className={styles.ideaTitleInput}
                    value={idea.title}
                    onChange={(e) => updateTitle(i, e.target.value)}
                  />
                  <span className={styles.ideaFormatTag}>{idea.format}</span>
                </div>
              ))}
            </div>
          )}

          {ideas.length === 0 && (
            <div className={styles.ideaEmpty}>
              Escolha conta e pilar e clique <strong>Gerar</strong> para criar
              {' '}{count} ideias a partir do banco interno.
              <br />
              <small>
                Sem chamadas a IA externa — templates determinísticos com cores
                e linhas reais do código (NZ Wrap, PPF).
              </small>
            </div>
          )}
        </div>

        <footer className={styles.modalFooter}>
          <button className={styles.secondaryBtn} onClick={onClose} disabled={creating}>
            Cancelar
          </button>
          <button
            className={styles.primaryBtn}
            onClick={handleCreate}
            disabled={creating || selectedCount === 0}
          >
            {creating
              ? 'Criando…'
              : `Adicionar ${selectedCount} ao Backlog`}
          </button>
        </footer>
      </div>
    </div>
  );
}
