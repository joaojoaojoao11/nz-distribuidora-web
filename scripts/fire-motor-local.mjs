// Dispara o Motor SEO IA localmente, replicando a lógica de api/cron/ai-writer.ts.
// Uso:
//   node scripts/fire-motor-local.mjs <campaignId>
// Requer no .env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const ENV_FILE = new URL('../.env', import.meta.url);
for (const line of readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const CAMPAIGN_ID = process.argv[2];

if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_KEY) {
  console.error('ENV ausente'); process.exit(1);
}
if (!CAMPAIGN_ID) {
  console.error('Uso: node scripts/fire-motor-local.mjs <campaignId>'); process.exit(1);
}

const TEXT_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'gemini-2.5-flash-image';
const BUCKET = 'blog_media';
const FALLBACK_COVER = 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=2669&auto=format&fit=crop';

// --- contexto NZ (cópia de api/_lib/siteContext.ts) ---
const NZ_BUSINESS_POSITIONING = `POSICIONAMENTO DA NZ DISTRIBUIDORA:
- É a maior distribuidora ATACADISTA de PPF e vinis automotivos premium do Brasil.
- O cliente principal do blog é o INSTALADOR profissional (B2B), em especial
  estéticas automotivas de São Paulo capital e Grande SP.
- O cliente final (dono do carro) lê também — então o conteúdo precisa ser
  técnico o suficiente pro instalador e compreensível pro apaixonado.
- CTA padrão: o instalador comprar direto da NZ e se credenciar; o dono do carro
  procurar uma estética parceira NZ na cidade dele.
- NÃO fazer promessa de preço, não citar concorrentes pelo nome, não chamar
  nenhuma marca de "pior" ou "inferior".`;

const NZ_PPF_LINES = `LINHAS OFICIAIS NZPPF (PPF = Paint Protection Film):
- NZPPF LUXURY GLOSS: 190μm (micras) de espessura, garantia de 12 ANOS. Top de linha.
- NZPPF PRIME GLOSS: 190μm, garantia de 10 ANOS. Premium intermediário.
- NZPPF FLOW GLOSS: 175μm, garantia de 4 ANOS. Linha intermediária.
- NZPPF CORE GLOSS: 175μm, garantia de 3 ANOS. Entrada / volume.
- NZ PPF HEADLIGHT: aplicação em faróis, garantia de 10 ANOS.
- NZ PPF WINDSHIELD: aplicação em para-brisas, 190μm, garantia de 2 ANOS.

NUNCA invente outros modelos de PPF que não estes 6. Nunca troque as micragens
nem os anos de garantia. Se precisar citar um modelo, use o nome exato acima.`;

const NZ_WRAP_LINES = `LINHAS OFICIAIS NZWRAP (envelopamento automotivo premium):
- NZWRAP PREMIUM: linha própria da NZ, acabamentos sólido brilhante, metálico
  brilhante, metálico fosco, camaleão.
- SH WRAPPING COLORS: linha parceira.

CATÁLOGO ORACAL 651: ~651 cores em vinil adesivo (não é envelopamento automotivo).
Uso principal: comunicação visual, recorte, fachada, frota. Não confundir com PPF.`;

const NZ_WARRANTY_RULES = `REGRAS DE GARANTIA:
- A garantia é concedida pela NZ mediante cadastro da apólice no sistema (QR code
  do instalador credenciado).
- Cada linha PPF tem prazo próprio (ver lista acima).
- Só instaladores credenciados pela NZ emitem a apólice oficial.
- A NZ NÃO garante aplicações feitas por instaladores não credenciados.`;

const SITE_CONTEXT = [NZ_BUSINESS_POSITIONING, NZ_PPF_LINES, NZ_WRAP_LINES, NZ_WARRANTY_RULES].join('\n\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function slugify(input) {
  return input.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

function buildSystemPrompt(campaign, usedKeywords) {
  return `Você é o Especialista Chefe do Departamento de Engenharia da NZ Distribuidora
(maior distribuidora atacadista de películas PPF e Adesivos Automotivos Premium do Brasil).
Seu papel é produzir CONTEÚDO TÉCNICO, MASSIVO e IMPLACÁVEL sobre PPF, envelopamento
e adesivos automotivos, com foco em ranqueamento orgânico.

=== CONTEXTO REAL DA NZ (use como verdade, não invente nada fora daqui) ===
${SITE_CONTEXT}
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
${campaign.instructions ? `Regras Adicionais da Campanha: ${campaign.instructions}` : ''}`;
}

const USER_PROMPT = `Gere e responda EXCLUSIVAMENTE em JSON estrito (sem crase, sem markdown envelopando o JSON),
validado, com as chaves:
{
  "title": "H1 forte SEO, até 70 caracteres, com o foco local quando fizer sentido",
  "slug": "url-amigavel-separada-hifens (máx 80 chars, só [a-z0-9-])",
  "meta_description": "Até 160 chars, CTR-driven, sem clickbait barato",
  "focus_keyword": "long-tail keyword real do tema (3+ palavras)",
  "content": "Artigo COMPLETO em Markdown oficial. Obrigatório: (a) 1200+ palavras, (b) pelo menos 2 headings H2 e 2 H3, (c) pelo menos 1 tabela comparativa, (d) pelo menos 1 lista numerada e 1 lista de bullets, (e) dicas de aplicação PRÁTICAS pro instalador, (f) fechamento com CTA dupla.",
  "cover_image_prompt": "Prompt em INGLÊS para gerar a thumb. Cena automotiva premium, detalhe de PPF ou vinil, estética de workshop moderno. SEM TEXTO, SEM LOGO, SEM MOLDURA."
}`;

async function callGeminiText(systemInstruction) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: USER_PROMPT }] }],
      systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
      generationConfig: { temperature: 0.75, responseMimeType: 'application/json' },
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.error(`[TEXT] HTTP ${res.status}:`, txt.slice(0, 600));
    return null;
  }
  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}

function parseArticle(rawText) {
  try {
    const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/```$/, '');
    const p = JSON.parse(cleaned);
    if (!p.title || !p.content || !p.focus_keyword) {
      console.error('[PARSE] incompleto:', Object.keys(p)); return null;
    }
    return {
      title: p.title,
      slug: p.slug || slugify(p.title),
      meta_description: p.meta_description || '',
      focus_keyword: p.focus_keyword,
      content: p.content,
      cover_image_prompt: p.cover_image_prompt || `${p.title} — premium automotive paint protection workshop scene`,
    };
  } catch (err) {
    console.error('[PARSE] JSON falhou:', err.message, rawText.slice(0, 300));
    return null;
  }
}

function dressBlogImagePrompt(raw) {
  const base = raw?.trim() || 'Automotive paint protection film installation, premium workshop';
  return [
    base,
    'Cinematic 8k automotive editorial photograph.',
    'Moody lighting, shallow depth of field, premium detailing studio vibe.',
    'No text, no logos, no watermarks, no frames, no borders.',
    'Horizontal composition, centered subject, clean background.',
    'Photorealistic, no illustration, no 3d render look.',
  ].join(' ');
}

async function callGeminiImage(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.error(`[IMG] HTTP ${res.status}:`, txt.slice(0, 600));
    return null;
  }
  const json = await res.json();
  const part = json.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
  if (!part?.inlineData) {
    console.error('[IMG] sem inlineData:', JSON.stringify(json).slice(0, 400));
    return null;
  }
  return { mime: part.inlineData.mimeType || 'image/png', base64: part.inlineData.data };
}

async function uploadCover(mime, base64) {
  const ext = mime.includes('jpeg') ? 'jpg' : mime.includes('webp') ? 'webp' : 'png';
  const fileName = `ai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filePath = `covers/${fileName}`;
  const buffer = Buffer.from(base64, 'base64');
  const { error: upErr } = await supabase.storage.from(BUCKET)
    .upload(filePath, buffer, { contentType: mime, upsert: false });
  if (upErr) { console.error('[UPLOAD]', upErr); return null; }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return { publicUrl: data?.publicUrl, path: filePath };
}

// ------- MAIN -------
console.log(`[motor] buscando campanha ${CAMPAIGN_ID}...`);
const { data: campaign, error: cErr } = await supabase
  .from('blog_ai_campaigns').select('*').eq('id', CAMPAIGN_ID).single();
if (cErr || !campaign) { console.error('campanha não encontrada:', cErr); process.exit(1); }

console.log(`[motor] tema: ${campaign.theme.slice(0, 80)}...`);

const { data: memLogs } = await supabase
  .from('blog_ai_memory_log').select('generated_keyword').order('created_at', { ascending: false }).limit(30);
const usedKeywords = (memLogs || []).map(l => l.generated_keyword).filter(Boolean).join(', ');

console.log('[motor] chamando Gemini TEXT...');
const raw = await callGeminiText(buildSystemPrompt(campaign, usedKeywords));
if (!raw) { console.error('falha Gemini text'); process.exit(2); }

const article = parseArticle(raw);
if (!article) { console.error('falha parse'); process.exit(3); }
console.log(`[motor] título: ${article.title}`);
console.log(`[motor] slug: ${article.slug}`);
console.log(`[motor] content: ${article.content.length} chars`);

const { data: exist } = await supabase.from('blog_posts').select('id').eq('slug', article.slug).limit(1);
if (exist?.length) article.slug = `${article.slug}-${Date.now().toString(36)}`;

console.log('[motor] chamando Gemini IMAGE...');
let coverUrl = FALLBACK_COVER, imageMode = 'fallback';
const img = await callGeminiImage(dressBlogImagePrompt(article.cover_image_prompt));
if (img) {
  const up = await uploadCover(img.mime, img.base64);
  if (up) { coverUrl = up.publicUrl; imageMode = 'generated'; console.log(`[motor] capa: ${up.path}`); }
}
if (imageMode === 'fallback') console.log('[motor] fallback Unsplash usado');

console.log('[motor] inserindo post...');
const { data: inserted, error: insErr } = await supabase
  .from('blog_posts').insert({
    title: article.title,
    slug: article.slug,
    meta_description: article.meta_description,
    focus_keyword: article.focus_keyword,
    content: article.content,
    status: 'published',
    published_at: new Date().toISOString(),
    author: 'Engenharia NZ',
    category_id: campaign.target_category_id,
    cover_image_url: coverUrl,
  }).select('id').single();
if (insErr) { console.error('[INSERT]', insErr); process.exit(4); }

await supabase.from('blog_ai_memory_log').insert({
  generated_title: article.title, generated_keyword: article.focus_keyword,
});

const next = new Date(); next.setHours(next.getHours() + (campaign.frequency_hours || 24));
await supabase.from('blog_ai_campaigns').update({
  last_run_at: new Date().toISOString(), next_run_at: next.toISOString(),
}).eq('id', campaign.id);

console.log('\n=============== RESULT ===============');
console.log(JSON.stringify({
  postId: inserted.id,
  title: article.title,
  slug: article.slug,
  focus_keyword: article.focus_keyword,
  content_chars: article.content.length,
  imageMode,
  coverUrl,
}, null, 2));
