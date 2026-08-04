import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { buildSiteContext } from '../_lib/siteContext.js';

// Motor SEO IA da NZ Distribuidora — v2.
// Rodado pelo cron Vercel (ver vercel.json) E por disparo manual vindo da UI
// (botão "Disparar Agora" no AdminAIBlog). O disparo manual manda POST com
// { force: true, campaignId? } no corpo e o mesmo Bearer do CRON_SECRET.
//
// v2: no modo cron (sem force) roda em RODÍZIO — apenas UMA campanha por
// disparo, a vencida há mais tempo. Com 6 campanhas ativas e cron diário,
// cada cluster de tema volta a cada ~6 dias, sem canibalização.
//
// Texto: Claude (Anthropic API) com structured outputs — o JSON do artigo é
// garantido pela API, não pelo prompt (fim das quebras de parse do Gemini).
// Capa: pool de fotos próprias em blog_media/fallbacks/ (Gemini aposentado);
// capa personalizada é gerada na revisão diária via Cowork + Higgsfield.

const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL_BLOG || 'claude-sonnet-5';
const FALLBACK_COVER = 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=2669&auto=format&fit=crop';
const SITE_URL = 'https://www.nzgroup.com.br';
// Chave IndexNow (não é secreta por design — o arquivo público /{key}.txt prova a posse do domínio)
const INDEXNOW_KEY = 'a3f8c1d94b7e42068f5a9c2d1e6b3a70';
// Janela de tolerância: o cron Hobby da Vercel tem jitter; sem isso o disparo
// chega segundos antes do next_run_at e o dia inteiro é perdido.
const SCHEDULE_TOLERANCE_MS = 3 * 60 * 60 * 1000;

interface Campaign {
  id: string;
  theme: string;
  target_category_id: string | null;
  instructions: string | null;
  frequency_hours: number | null;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  auto_publish?: boolean | null;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface Article {
  title: string;
  slug: string;
  meta_description: string;
  focus_keyword: string;
  content: string;
  faq: FaqItem[];
}

interface LinkCandidate {
  title: string;
  path: string;
}

interface RunReport {
  campaignId: string;
  theme: string;
  status: 'posted' | 'draft_created' | 'skipped' | 'ai_error' | 'parse_error' | 'insert_error';
  postId?: string;
  title?: string;
  imageMode?: 'generated' | 'fallback';
  reason?: string;
}

// Páginas de produto sempre elegíveis para link interno nos artigos.
const PRODUCT_LINKS: LinkCandidate[] = [
  { title: 'NZPPF Luxury Gloss (190μ, 12 anos)', path: '/ppf/luxury-gloss' },
  { title: 'NZPPF Prime Gloss (190μ, 10 anos)', path: '/ppf/prime-gloss' },
  { title: 'NZPPF Flow Gloss (175μ, 4 anos)', path: '/ppf/flow-gloss' },
  { title: 'NZPPF Core Gloss (175μ, 3 anos)', path: '/ppf/core-gloss' },
  { title: 'NZ PPF Headlight (faróis)', path: '/ppf/headlight' },
  { title: 'NZ PPF Windshield (parabrisa)', path: '/ppf/windshield' },
  { title: 'Linhas de envelopamento NZWRAP', path: '/wrap' },
  { title: 'Encontre um aplicador credenciado', path: '/encontre-aplicador' },
  { title: 'Registro de garantia NZPPF', path: '/registro-garantia' },
];

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Schema do artigo: com structured outputs a API do Claude GARANTE que a
// resposta valida contra isto — sem parse quebrado, sem campo faltando.
const ARTICLE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'slug', 'meta_description', 'focus_keyword', 'content', 'faq'],
  properties: {
    title: { type: 'string' },
    slug: { type: 'string' },
    meta_description: { type: 'string' },
    focus_keyword: { type: 'string' },
    content: { type: 'string' },
    faq: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['question', 'answer'],
        properties: {
          question: { type: 'string' },
          answer: { type: 'string' },
        },
      },
    },
  },
};

async function callClaudeText(
  systemInstruction: string,
  userPrompt: string,
  apiKey: string,
): Promise<string | null> {
  const anthropic = new Anthropic({ apiKey });
  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 12000,
      system: systemInstruction,
      output_config: { format: { type: 'json_schema', schema: ARTICLE_SCHEMA } },
      messages: [{ role: 'user', content: userPrompt }],
    });

    if (response.stop_reason === 'refusal') {
      console.error('[ai-writer] Claude recusou a geração (stop_reason=refusal)');
      return null;
    }
    if (response.stop_reason === 'max_tokens') {
      console.error('[ai-writer] Claude estourou max_tokens — artigo truncado, descartando');
      return null;
    }

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    if (!text) {
      console.error('[ai-writer] Claude devolveu resposta sem texto');
      return null;
    }
    return text;
  } catch (err) {
    console.error('[ai-writer] Claude API falhou:', err instanceof Error ? err.message : err);
    return null;
  }
}

function buildSystemPrompt(
  campaign: Campaign,
  usedKeywords: string,
  campaignTitles: string[],
  linkCandidates: LinkCandidate[],
  siteContext: string,
): string {
  const currentYear = new Date().getFullYear();
  const linksBlock = linkCandidates
    .map((l) => `- [${l.title}](${l.path})`)
    .join('\n');

  return `
Você é o Especialista Chefe do Departamento de Engenharia da NZ Distribuidora
(maior distribuidora atacadista de películas PPF e Adesivos Automotivos Premium do Brasil).
Seu papel é produzir CONTEÚDO TÉCNICO, MASSIVO e IMPLACÁVEL sobre PPF, envelopamento
e adesivos automotivos, com foco em ranqueamento orgânico.

ANO ATUAL: ${currentYear}. Se citar ano em título, slug ou texto, use SOMENTE ${currentYear}.

=== CONTEXTO REAL DA NZ (use como verdade, não invente nada fora daqui) ===
${siteContext}
=== FIM DO CONTEXTO REAL ===

PÚBLICO:
- Principal: INSTALADORES PROFISSIONAIS de PPF e envelopamento (B2B).
- Secundário: dono de carro apaixonado pesquisando antes de fechar.
- Região foco: São Paulo capital + Grande SP. Cite cenários reais de SP sem forçar.

LINKS INTERNOS DISPONÍVEIS (inclua de 2 a 4 deles no corpo do artigo, em Markdown,
onde fizer sentido editorial — nunca em bloco no final):
${linksBlock}

REGRAS INVIOLÁVEIS:
1. NUNCA repita nenhum destes temas já cobertos: ${usedKeywords || 'nenhum'}.
${campaignTitles.length > 0 ? `1b. Esta campanha já publicou os títulos abaixo — escolha um ÂNGULO DIFERENTE de todos eles:\n${campaignTitles.map((t) => `   - ${t}`).join('\n')}` : ''}
2. Use SOMENTE nomes de produtos que aparecem no CONTEXTO REAL acima.
3. Respeite micragens e anos de garantia exatos das linhas NZPPF.
4. Nunca cite concorrentes pelo nome; nunca chame outra marca de "pior".
5. Nunca invente preços.

DIRETRIZES DESTA CAMPANHA:
Tema Cluster: ${campaign.theme}
${campaign.instructions ? `Regras Adicionais da Campanha: ${campaign.instructions}` : ''}
`.trim();
}

function buildUserPrompt(): string {
  return `
Gere o artigo preenchendo os campos do formato de saída:

- title: H1 forte SEO, até 70 caracteres, com o foco local quando fizer sentido.
- slug: url-amigavel-separada-hifens (máx 80 chars, só [a-z0-9-]).
- meta_description: até 160 chars, CTR-driven, sem clickbait barato.
- focus_keyword: long-tail keyword real do tema (3+ palavras).
- content: artigo COMPLETO em Markdown. Obrigatório: (a) 800 a 1100 palavras — denso e direto, sem enrolação nem enchimento, (b) pelo menos 2 headings H2 e 2 H3, (c) 1 tabela comparativa quando o tema pedir (micragem, durabilidade ou custo-benefício), (d) pelo menos 1 lista, (e) dicas PRÁTICAS aplicáveis, (f) 2 a 4 links internos da lista fornecida, embutidos no texto, (g) fechamento com CTA para o instalador comprar direto na NZ e para o dono do carro procurar uma estética parceira NZ em São Paulo.
- faq: de 3 a 5 itens, cada um com uma pergunta real que o público pesquisa no Google sobre o tema e uma resposta direta e completa em 2-4 frases.
`.trim();
}

function parseArticle(rawText: string): Article | null {
  try {
    const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/```$/, '');
    const parsed = JSON.parse(cleaned) as Partial<Article>;
    if (!parsed.title || !parsed.content || !parsed.focus_keyword) {
      console.error('[ai-writer] artigo incompleto:', Object.keys(parsed));
      return null;
    }
    const faq = Array.isArray(parsed.faq)
      ? parsed.faq.filter((f): f is FaqItem => !!f && typeof f.question === 'string' && typeof f.answer === 'string')
      : [];
    return {
      title: parsed.title,
      slug: parsed.slug || slugify(parsed.title),
      meta_description: parsed.meta_description || '',
      focus_keyword: parsed.focus_keyword,
      content: parsed.content,
      faq,
    };
  } catch (err) {
    console.error('[ai-writer] JSON parse falhou:', err, rawText.slice(0, 300));
    return null;
  }
}

// O modelo às vezes gruda em anos antigos ("Guia 2024"). Corrige de forma
// determinística em título/slug/meta — nunca no corpo (poderia citar fatos históricos).
function fixStaleYears(article: Article): void {
  const currentYear = new Date().getFullYear();
  const staleYear = /\b20\d{2}\b/g;
  const fix = (s: string) =>
    s.replace(staleYear, (y) => (Number(y) === currentYear ? y : String(currentYear)));
  article.title = fix(article.title);
  article.meta_description = fix(article.meta_description);
  article.slug = fix(article.slug);
}

// Rede de segurança: se o modelo ignorou a instrução de links internos,
// apendamos uma seção "Leia também" com posts relacionados por keyword.
function ensureInternalLinks(article: Article, recentPosts: LinkCandidate[]): void {
  const hasInternalLink = /\]\(\/(?:blog|ppf|wrap|sign|decor|encontre-aplicador|registro-garantia)/.test(article.content);
  if (hasInternalLink) return;

  const keywordWords = new Set(
    article.focus_keyword.toLowerCase().split(/\s+/).filter((w) => w.length > 3),
  );
  const scored = recentPosts
    .map((p) => {
      const titleWords = p.title.toLowerCase().split(/\s+/);
      const overlap = titleWords.filter((w) => keywordWords.has(w)).length;
      return { ...p, overlap };
    })
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 3);

  const picks = scored.length > 0 ? scored : PRODUCT_LINKS.slice(0, 3);
  article.content += `\n\n## Leia também\n\n${picks.map((p) => `- [${p.title}](${p.path})`).join('\n')}\n`;
}

// Fallback de capa variado: pool de imagens próprias em blog_media/fallbacks/,
// escolhida deterministicamente pelo slug (acaba com a mesma foto em todo post).
async function pickFallbackCover(supabase: SupabaseClient, slug: string): Promise<string> {
  try {
    const { data } = await supabase.storage.from('blog_media').list('fallbacks', { limit: 100 });
    const files = (data || []).filter((f) => f.name && /\.(jpe?g|png|webp)$/i.test(f.name));
    if (files.length === 0) return FALLBACK_COVER;
    let h = 0;
    for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const file = files[h % files.length];
    const { data: pub } = supabase.storage.from('blog_media').getPublicUrl(`fallbacks/${file.name}`);
    return pub?.publicUrl || FALLBACK_COVER;
  } catch {
    return FALLBACK_COVER;
  }
}

// IndexNow: avisa Bing/Yandex/parceiros na hora que um post novo vai ao ar.
// (O ping de sitemap do Google foi desativado em 2024 — lá o caminho é o
// sitemap com lastmod + Search Console.)
async function pingIndexNow(urls: string[]): Promise<void> {
  try {
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: 'www.nzgroup.com.br',
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    });
  } catch (err) {
    console.error('[ai-writer] IndexNow falhou (não-fatal):', err);
  }
}

async function logRun(supabase: SupabaseClient, report: RunReport): Promise<void> {
  try {
    await supabase.from('blog_ai_run_log').insert({
      campaign_id: report.campaignId,
      post_id: report.postId || null,
      status: report.status,
      reason: report.reason || null,
      image_mode: report.imageMode || null,
    });
  } catch (err) {
    console.error('[ai-writer] run_log falhou (não-fatal):', err);
  }
}

function isDue(campaign: Campaign, now: Date): boolean {
  if (!campaign.next_run_at) return true;
  return now.getTime() >= new Date(campaign.next_run_at).getTime() - SCHEDULE_TOLERANCE_MS;
}

async function processCampaign(
  campaign: Campaign,
  supabase: SupabaseClient,
  anthropicKey: string,
  siteContext: string,
  force: boolean,
): Promise<RunReport> {
  // 1) Checagem de agenda (com tolerância pro jitter do cron)
  const now = new Date();
  if (!force && !isDue(campaign, now)) {
    return { campaignId: campaign.id, theme: campaign.theme, status: 'skipped', reason: 'not_yet' };
  }

  // 2) Memória semântica global (anti-canibalização) + títulos da própria campanha
  const { data: memoryLogs } = await supabase
    .from('blog_ai_memory_log')
    .select('generated_keyword, generated_title, campaign_id')
    .order('created_at', { ascending: false })
    .limit(30);
  const usedKeywords = memoryLogs?.map((l) => l.generated_keyword).filter(Boolean).join(', ') || '';
  const campaignTitles = (memoryLogs || [])
    .filter((l) => l.campaign_id === campaign.id && l.generated_title)
    .slice(0, 5)
    .map((l) => l.generated_title as string);

  // 2b) Posts recentes para interlinking
  const { data: recent } = await supabase
    .from('blog_posts')
    .select('title, slug')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(15);
  const recentPosts: LinkCandidate[] = (recent || []).map((p) => ({
    title: p.title,
    path: `/blog/${p.slug}`,
  }));
  const linkCandidates = [...recentPosts, ...PRODUCT_LINKS];

  // 3) Chama o Claude (structured outputs — JSON garantido pela API)
  const rawText = await callClaudeText(
    buildSystemPrompt(campaign, usedKeywords, campaignTitles, linkCandidates, siteContext),
    buildUserPrompt(),
    anthropicKey,
  );
  if (!rawText) {
    return { campaignId: campaign.id, theme: campaign.theme, status: 'ai_error', reason: 'no_text' };
  }

  const article = parseArticle(rawText);
  if (!article) {
    return { campaignId: campaign.id, theme: campaign.theme, status: 'parse_error', reason: 'bad_json' };
  }

  fixStaleYears(article);
  ensureInternalLinks(article, recentPosts);

  // 4) Garante slug único
  const { data: existing } = await supabase
    .from('blog_posts')
    .select('id')
    .eq('slug', article.slug)
    .limit(1);
  if (existing && existing.length > 0) {
    article.slug = `${article.slug}-${Date.now().toString(36)}`;
  }

  // 5) Capa: foto do pool próprio (determinística por slug). A capa
  // personalizada é feita na revisão diária (Cowork + Higgsfield).
  const imageMode: 'generated' | 'fallback' = 'fallback';
  const coverImageUrl = await pickFallbackCover(supabase, article.slug);

  // 6) Insere o post — publica direto só se a campanha tiver auto_publish
  const autoPublish = campaign.auto_publish !== false;
  const newPost = {
    title: article.title,
    slug: article.slug,
    meta_description: article.meta_description,
    focus_keyword: article.focus_keyword,
    content: article.content,
    faq: article.faq.length > 0 ? article.faq : null,
    status: (autoPublish ? 'published' : 'draft') as 'published' | 'draft',
    published_at: autoPublish ? new Date().toISOString() : null,
    author: 'Engenharia NZ',
    category_id: campaign.target_category_id,
    cover_image_url: coverImageUrl,
  };

  const { data: inserted, error: postError } = await supabase
    .from('blog_posts')
    .insert(newPost)
    .select('id')
    .single();

  if (postError || !inserted) {
    console.error('[ai-writer] insert falhou:', postError);
    return {
      campaignId: campaign.id,
      theme: campaign.theme,
      status: 'insert_error',
      reason: postError?.message || 'unknown',
    };
  }

  // 7) Atualiza memória (agora com rastreabilidade completa) e agenda próximo
  await supabase.from('blog_ai_memory_log').insert({
    campaign_id: campaign.id,
    post_id: inserted.id,
    generated_title: article.title,
    generated_keyword: article.focus_keyword,
    generated_slug: article.slug,
  });

  // -2h de folga: somado à tolerância de 3h, garante que o cron do dia
  // seguinte sempre encontre a campanha vencida.
  const next = new Date();
  next.setHours(next.getHours() + (campaign.frequency_hours || 24) - 2);
  await supabase
    .from('blog_ai_campaigns')
    .update({
      last_run_at: new Date().toISOString(),
      next_run_at: next.toISOString(),
    })
    .eq('id', campaign.id);

  // 8) Notifica IndexNow (só quando publicou de fato)
  if (autoPublish) {
    await pingIndexNow([`${SITE_URL}/blog/${article.slug}`]);
  }

  return {
    campaignId: campaign.id,
    theme: campaign.theme,
    status: autoPublish ? 'posted' : 'draft_created',
    postId: inserted.id,
    title: article.title,
    imageMode,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Parse body primeiro (disparo manual traz force/campaignId)
  const body = (typeof req.body === 'string' ? safeJson(req.body) : req.body) || {};
  const force: boolean = body?.force === true;
  const onlyCampaignId: string | undefined = body?.campaignId;

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!supabaseUrl || !supabaseKey || !anthropicKey) {
      return res.status(500).json({
        error: 'ENV ausente',
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseKey,
        hasAnthropicKey: !!anthropicKey,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // AUTH — aceita 2 modos:
    //  1) Bearer CRON_SECRET (usado pelo cron da Vercel)
    //  2) Bearer <supabase access_token> de usuário com role='admin' (botão "Disparar Agora")
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;
    let authorized = false;

    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      authorized = true;
    } else if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
      if (!userErr && user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile?.role === 'admin') authorized = true;
      }
    }

    if (!authorized) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const siteContext = buildSiteContext();

    let query = supabase.from('blog_ai_campaigns').select('*').eq('is_active', true);
    if (onlyCampaignId) query = query.eq('id', onlyCampaignId);

    const { data: campaigns, error: campError } = await query;
    if (campError) throw campError;
    if (!campaigns || campaigns.length === 0) {
      return res.status(200).json({ message: 'Motor em repouso. Sem campanhas ativas.', runs: [] });
    }

    // Seleção de campanhas a processar:
    // - Disparo manual (force): processa exatamente o que foi pedido.
    // - Cron: RODÍZIO — só a campanha vencida há mais tempo (1 post/dia).
    let toProcess: Campaign[] = campaigns as Campaign[];
    if (!force && !onlyCampaignId) {
      const now = new Date();
      const due = toProcess
        .filter((c) => isDue(c, now))
        .sort((a, b) => {
          const ta = a.last_run_at ? new Date(a.last_run_at).getTime() : 0;
          const tb = b.last_run_at ? new Date(b.last_run_at).getTime() : 0;
          return ta - tb;
        });
      toProcess = due.slice(0, 1);
      if (toProcess.length === 0) {
        return res.status(200).json({ message: 'Nenhuma campanha vencida neste disparo.', runs: [] });
      }
    }

    const runs: RunReport[] = [];
    for (const campaign of toProcess) {
      const report = await processCampaign(campaign, supabase, anthropicKey, siteContext, force);
      runs.push(report);
      await logRun(supabase, report);
    }

    const postsCreated = runs.filter((r) => r.status === 'posted' || r.status === 'draft_created').length;
    return res.status(200).json({
      success: true,
      message: `Disparo concluído. ${postsCreated}/${runs.length} artigos gerados.`,
      runs,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ai-writer] Erro crítico:', err);
    return res.status(500).json({ error: msg, status: 'ENGINE_FAILURE' });
  }
}

function safeJson(raw: string): Record<string, unknown> | null {
  try { return JSON.parse(raw); } catch { return null; }
}
