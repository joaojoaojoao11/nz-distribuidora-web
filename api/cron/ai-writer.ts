import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { generateBlogCoverImage } from '../_lib/aiImage';
import { buildSiteContext } from '../_lib/siteContext';

// Motor SEO IA da NZ Distribuidora.
// Rodado pelo cron Vercel (ver vercel.json) E por disparo manual vindo da UI
// (botão "Disparar Agora" no AdminAIBlog). O disparo manual manda POST com
// { force: true, campaignId? } no corpo e o mesmo Bearer do CRON_SECRET.

const TEXT_MODEL = 'gemini-2.5-flash';
const FALLBACK_COVER = 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=2669&auto=format&fit=crop';

interface Campaign {
  id: string;
  theme: string;
  target_category_id: string | null;
  instructions: string | null;
  frequency_hours: number | null;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
}

interface Article {
  title: string;
  slug: string;
  meta_description: string;
  focus_keyword: string;
  content: string;
  cover_image_prompt: string;
}

interface RunReport {
  campaignId: string;
  theme: string;
  status: 'posted' | 'skipped' | 'gemini_error' | 'parse_error' | 'insert_error';
  postId?: string;
  title?: string;
  imageMode?: 'generated' | 'fallback';
  reason?: string;
}

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function callGeminiText(
  systemInstruction: string,
  userPrompt: string,
  apiKey: string,
): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: 0.75,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.error(`[ai-writer] Gemini TEXT ${res.status}:`, txt.slice(0, 400));
    return null;
  }

  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error('[ai-writer] Gemini TEXT resposta vazia:', JSON.stringify(json).slice(0, 400));
    return null;
  }
  return text;
}

function buildSystemPrompt(campaign: Campaign, usedKeywords: string, siteContext: string): string {
  return `
Você é o Especialista Chefe do Departamento de Engenharia da NZ Distribuidora
(maior distribuidora atacadista de películas PPF e Adesivos Automotivos Premium do Brasil).
Seu papel é produzir CONTEÚDO TÉCNICO, MASSIVO e IMPLACÁVEL sobre PPF, envelopamento
e adesivos automotivos, com foco em ranqueamento orgânico.

=== CONTEXTO REAL DA NZ (use como verdade, não invente nada fora daqui) ===
${siteContext}
=== FIM DO CONTEXTO REAL ===

PÚBLICO:
- Principal: INSTALADORES PROFISSIONAIS de PPF e envelopamento (B2B).
- Secundário: dono de carro apaixonado pesquisando antes de fechar.
- Região foco: São Paulo capital + Grande SP. Cite cenários reais de SP sem forçar.

REGRAS INVIOLÁVEIS:
1. NUNCA repita nenhum destes temas já cobertos: ${usedKeywords || 'nenhum'}.
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
Gere e responda EXCLUSIVAMENTE em JSON estrito (sem crase, sem markdown envelopando o JSON),
validado, com as chaves:
{
  "title": "H1 forte SEO, até 70 caracteres, com o foco local quando fizer sentido",
  "slug": "url-amigavel-separada-hifens (máx 80 chars, só [a-z0-9-])",
  "meta_description": "Até 160 chars, CTR-driven, sem clickbait barato",
  "focus_keyword": "long-tail keyword real do tema (3+ palavras)",
  "content": "Artigo COMPLETO em Markdown oficial. Obrigatório: (a) 1200+ palavras, (b) pelo menos 2 headings H2 e 2 H3, (c) pelo menos 1 tabela comparativa (micragem, durabilidade ou custo-benefício), (d) pelo menos 1 lista numerada e 1 lista de bullets, (e) dicas de aplicação PRÁTICAS pro instalador, (f) fechamento com CTA para o instalador comprar direto na NZ e para o dono do carro procurar uma estética parceira NZ em São Paulo.",
  "cover_image_prompt": "Prompt em INGLÊS para gerar a thumb. Cena automotiva premium, detalhe de PPF ou vinil, estética de workshop moderno. SEM TEXTO, SEM LOGO, SEM MOLDURA."
}
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
    return {
      title: parsed.title,
      slug: parsed.slug || slugify(parsed.title),
      meta_description: parsed.meta_description || '',
      focus_keyword: parsed.focus_keyword,
      content: parsed.content,
      cover_image_prompt: parsed.cover_image_prompt || `${parsed.title} — premium automotive paint protection workshop scene`,
    };
  } catch (err) {
    console.error('[ai-writer] JSON parse falhou:', err, rawText.slice(0, 300));
    return null;
  }
}

async function processCampaign(
  campaign: Campaign,
  supabase: SupabaseClient,
  geminiKey: string,
  siteContext: string,
  force: boolean,
): Promise<RunReport> {
  // 1) Schedule check (a UI já calcula o next_run_at; respeitamos a menos que force=true)
  const now = new Date();
  const nextRun = campaign.next_run_at ? new Date(campaign.next_run_at) : new Date(0);
  if (!force && now.getTime() < nextRun.getTime()) {
    return { campaignId: campaign.id, theme: campaign.theme, status: 'skipped', reason: 'not_yet' };
  }

  // 2) Memória semântica pra evitar canibalização
  const { data: memoryLogs } = await supabase
    .from('blog_ai_memory_log')
    .select('generated_keyword, generated_title')
    .order('created_at', { ascending: false })
    .limit(30);
  const usedKeywords = memoryLogs?.map((l) => l.generated_keyword).filter(Boolean).join(', ') || '';

  // 3) Chama Gemini Text
  const rawText = await callGeminiText(
    buildSystemPrompt(campaign, usedKeywords, siteContext),
    buildUserPrompt(),
    geminiKey,
  );
  if (!rawText) {
    return { campaignId: campaign.id, theme: campaign.theme, status: 'gemini_error', reason: 'no_text' };
  }

  const article = parseArticle(rawText);
  if (!article) {
    return { campaignId: campaign.id, theme: campaign.theme, status: 'parse_error', reason: 'bad_json' };
  }

  // 4) Garante slug único
  const { data: existing } = await supabase
    .from('blog_posts')
    .select('id')
    .eq('slug', article.slug)
    .limit(1);
  if (existing && existing.length > 0) {
    article.slug = `${article.slug}-${Date.now().toString(36)}`;
  }

  // 5) Gera imagem de capa (se falhar, fallback Unsplash e segue)
  let imageMode: 'generated' | 'fallback' = 'fallback';
  let coverImageUrl = FALLBACK_COVER;
  const generated = await generateBlogCoverImage(article.cover_image_prompt, geminiKey, supabase);
  if (generated) {
    imageMode = 'generated';
    coverImageUrl = generated.publicUrl;
  }

  // 6) Insere o post
  const newPost = {
    title: article.title,
    slug: article.slug,
    meta_description: article.meta_description,
    focus_keyword: article.focus_keyword,
    content: article.content,
    status: 'published' as const,
    published_at: new Date().toISOString(),
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

  // 7) Atualiza memória e agenda próximo
  await supabase.from('blog_ai_memory_log').insert({
    generated_title: article.title,
    generated_keyword: article.focus_keyword,
  });

  const next = new Date();
  next.setHours(next.getHours() + (campaign.frequency_hours || 24));
  await supabase
    .from('blog_ai_campaigns')
    .update({
      last_run_at: new Date().toISOString(),
      next_run_at: next.toISOString(),
    })
    .eq('id', campaign.id);

  return {
    campaignId: campaign.id,
    theme: campaign.theme,
    status: 'posted',
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
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!supabaseUrl || !supabaseKey || !geminiKey) {
      return res.status(500).json({
        error: 'ENV ausente',
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseKey,
        hasGeminiKey: !!geminiKey,
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

    const runs: RunReport[] = [];
    for (const campaign of campaigns as Campaign[]) {
      const report = await processCampaign(campaign, supabase, geminiKey, siteContext, force);
      runs.push(report);
    }

    const postsCreated = runs.filter((r) => r.status === 'posted').length;
    return res.status(200).json({
      success: true,
      message: `Disparo concluído. ${postsCreated}/${runs.length} publicações geradas.`,
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
