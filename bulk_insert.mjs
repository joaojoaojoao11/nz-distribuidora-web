// Bulk insert dos 27 posts via Supabase REST.
// Lê o .env do próprio projeto, monta payload com checklist auto-populada
// por formato (mesma lógica do AdminAgendaSocial.tsx → CHECKLIST_TEMPLATES).

import { readFileSync } from 'fs';

const ENV_PATH = './.env';
const env = Object.fromEntries(
  readFileSync(ENV_PATH, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const URL = env.VITE_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  console.error('FALTA: VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const TEMPLATES = {
  Foto:      ['Foto escolhida', 'Edição rápida', 'Legenda colada', 'Hashtags revisadas', 'Agendado no Meta Business'],
  Carrossel: ['Roteiro de 3-5 cards', 'Cards desenhados/montados', 'Capa criada', 'Legenda colada', 'Hashtags revisadas', 'Agendado no Meta Business'],
  Reel:      ['Roteiro escrito', 'Asset gravado', 'Edição feita', 'Capa do reel criada', 'Legenda colada', 'Hashtags revisadas', 'Agendado no Meta Business'],
  Story:     ['Asset bruto', 'Stickers / CTA inseridos', 'Postado'],
};

const checklistFor = (format) => (TEMPLATES[format] || []).map((label) => ({ label, done: false }));

const POSTS = [
  { account: 'nzppf',    title: 'Showcase Luxury — RAM cromada @adesivotech',                    format: 'Reel',      pillar: 'Showcase Luxury',     scheduled_for: '2026-04-28', notes: 'Cortar do bruto. Legenda 01 do banco. Marcar @nzgroup.br nos comentários.' },
  { account: 'joaowrap', title: 'Decisão difícil — neguei pedido grande',                        format: 'Reel',      pillar: 'Bastidor Empreendedor', scheduled_for: '2026-04-28', notes: 'Reel câmera 45s. Legenda 29 do banco. Voz natural, sem roteiro decorado.' },
  { account: 'nzgroup',  title: 'Cor da semana NZ Wrap: Stuttgart Sport Grey',                  format: 'Carrossel', pillar: 'Catálogo NZ Wrap',    scheduled_for: '2026-04-29', notes: '4 fotos em luzes diferentes (manhã/tarde/sunset/noite). Legenda 15 do banco. SKU NZW202.' },
  { account: 'nzppf',    title: 'TPU alifático vs PU comum — química explicada',                format: 'Carrossel', pillar: 'Educativo Técnico',   scheduled_for: '2026-04-30', notes: '4 cards. Legenda 02 do banco como base. Card final com CTA aplicador autorizado.' },
  { account: 'joaowrap', title: 'Top 3 erros que vejo na NZ Academy',                            format: 'Carrossel', pillar: 'Educação Aplicador',  scheduled_for: '2026-05-01', notes: '5 cards. Legenda 34 do banco. Pegar prints da última turma se autorizado pelos alunos.' },
  { account: 'nzppf',    title: 'Showcase Headlight Dark Black — close em farol',               format: 'Foto',      pillar: 'Showcase Headlight',  scheduled_for: '2026-05-02', notes: 'Legenda 11 do banco. Procurar 1 foto top no acervo /05_BASTIDOR/headlight.' },
  { account: 'nzgroup',  title: '+1.200 lojas. 10 estados. R$ 48mi.',                            format: 'Foto',      pillar: 'Captação Lojista',    scheduled_for: '2026-05-04', caption: 'Prova social pesada. CTA direto: Quer ser revendedor? Direct.', notes: 'Legenda 24 do banco. Marcar @joaowrap nos comentários.' },
  { account: 'nzppf',    title: 'Showcase Prime Black Piano em sedan executivo',                format: 'Reel',      pillar: 'Showcase Prime',      scheduled_for: '2026-05-05', notes: 'Legenda 04 do banco. 15s. Mostrar reflexo profundo e atribuição ao parceiro.' },
  { account: 'joaowrap', title: 'Por que TPU alifático é não-negociável em PPF premium',        format: 'Reel',      pillar: 'Autoridade Técnica',  scheduled_for: '2026-05-05', notes: 'Reel câmera 60s. Legenda 26 do banco. Direto, primeira pessoa.' },
  { account: 'nzgroup',  title: 'Setor de PPF cresce 3 dígitos no Brasil — dados',              format: 'Carrossel', pillar: 'Mercado',             scheduled_for: '2026-05-06', notes: 'Legenda 23 do banco. 4 cards de dado + 1 card de oportunidade pro lojista.' },
  { account: 'nzppf',    title: 'B2B Prime — abre faixa nova de venda na sua loja',             format: 'Carrossel', pillar: 'B2B Lojista',         scheduled_for: '2026-05-07', notes: 'Legenda 06 do banco. CTA: solicite tabela de revenda PRIME.' },
  { account: 'joaowrap', title: 'Dica rápida — temperatura do painel na aplicação',             format: 'Reel',      pillar: 'Educação Aplicador',  scheduled_for: '2026-05-08', notes: 'Reel curto 20s. Legenda 33 do banco. Mostrar termômetro de superfície.' },
  { account: 'nzppf',    title: 'Showcase Flow Clear Gloss — proteção sem mudar visual',        format: 'Foto',      pillar: 'Showcase Flow',       scheduled_for: '2026-05-09', notes: 'Legenda 07 do banco. Carro popular bem cuidado. CTA aplicador autorizado.' },
  { account: 'nzgroup',  title: 'Cor da semana NZ Wrap: Ferrari Metallic Red',                  format: 'Carrossel', pillar: 'Catálogo NZ Wrap',    scheduled_for: '2026-05-11', notes: 'Legenda inspirada na 15. SKU NZW201. 4 luzes diferentes.' },
  { account: 'nzppf',    title: 'Showcase Luxury Black em SUV — luxo absoluto',                 format: 'Reel',      pillar: 'Showcase Luxury',     scheduled_for: '2026-05-12', notes: 'Legenda 01 adaptada. Foco no acabamento Black do Luxury.' },
  { account: 'joaowrap', title: 'Rotina real de uma semana minha',                              format: 'Reel',      pillar: 'Bastidor Empreendedor', scheduled_for: '2026-05-12', notes: 'Reel dia-na-vida. Legenda 30 do banco. Mostrar visita a loja + Barueri + gravação.' },
  { account: 'nzgroup',  title: 'Catálogo SH Wrapping — Bentley Pink exclusivo',                format: 'Carrossel', pillar: 'Catálogo SH Wrapping', scheduled_for: '2026-05-13', notes: 'Legenda 20 do banco. Cor exclusiva, premium, com close textura.' },
  { account: 'nzppf',    title: 'Como funciona regeneração térmica — antes e depois com sol',   format: 'Reel',      pillar: 'Educativo Técnico',   scheduled_for: '2026-05-14', notes: 'Reel slow-motion 20s. Marca arranhão leve, expõe ao sol, mostra desaparecer.' },
  { account: 'joaowrap', title: 'Comparativo honesto — quando indicar Luxury vs Prime vs Flow vs Core', format: 'Carrossel', pillar: 'Autoridade Técnica',  scheduled_for: '2026-05-15', notes: '4 cards (1 por linha). Legenda 27 do banco. Não existe linha melhor — existe linha certa pro cliente certo.' },
  { account: 'nzppf',    title: 'Showcase Core Black Matte em pickup',                          format: 'Carrossel', pillar: 'Showcase Core',       scheduled_for: '2026-05-16', notes: 'Legenda 09 do banco. 3 fotos. CORE engenharia híbrida 80/20 — proteção real preço acessível.' },
  { account: 'nzgroup',  title: 'Próxima turma NZ Academy — vagas abertas',                     format: 'Reel',      pillar: 'NZ Academy',          scheduled_for: '2026-05-18', notes: 'Legenda 22 do banco. Reel 15s na sala. CTA: solicite agenda no WhatsApp.' },
  { account: 'nzppf',    title: 'Showcase Windshield — proteção invisível do parabrisa',       format: 'Reel',      pillar: 'Showcase Windshield', scheduled_for: '2026-05-19', notes: 'Legenda 13 do banco. Reel impacto visual de pedra no asfalto. Compatível com ADAS.' },
  { account: 'joaowrap', title: 'Análise — PPF de detalhe vai dominar 2026/2027',              format: 'Carrossel', pillar: 'Autoridade Técnica',  scheduled_for: '2026-05-19', notes: 'Carrossel análise. Headlight, windshield, soleira, retrovisor. É onde o cliente paga especialização.' },
  { account: 'nzgroup',  title: 'Oracal 670RA — RapidAir em ação',                              format: 'Reel',      pillar: 'Catálogo Oracal 670', scheduled_for: '2026-05-20', notes: 'Legenda 19 do banco. 15s mostrando aplicação sem bolha. NZ é distribuidor oficial Oracal.' },
  { account: 'nzppf',    title: 'Headlight Light Gray — o detalhe que só quem entende percebe', format: 'Foto',      pillar: 'Showcase Headlight',  scheduled_for: '2026-05-21', notes: 'Close-up. Legenda 12 adaptada (foco no Light Gray). Tom neutro refinado.' },
  { account: 'joaowrap', title: 'Reflexão sábado — o que sustenta marca',                       format: 'Foto',      pillar: 'Lifestyle',           scheduled_for: '2026-05-22', notes: 'Foto + texto. Legenda 39 do banco. Construir marca é insistir no padrão quando ninguém olha.' },
  { account: 'nzppf',    title: 'Margens médias por linha NZ PPF para o lojista',               format: 'Carrossel', pillar: 'B2B Lojista',         scheduled_for: '2026-05-23', notes: '4 cards (uma linha por card). CTA solicitar tabela de revenda. Sem números reais — usar percentuais relativos.' },
];

const payload = POSTS.map((p) => ({
  account: p.account,
  pillar: p.pillar || null,
  title: p.title,
  caption: p.caption || null,
  format: p.format || null,
  asset_url: p.asset_url || null,
  scheduled_for: p.scheduled_for || null,
  notes: p.notes || null,
  status: 'backlog',
  checklist: checklistFor(p.format),
  created_by: null,
}));

console.log(`Enviando ${payload.length} posts pro Supabase...`);

const r = await fetch(URL + '/rest/v1/social_posts', {
  method: 'POST',
  headers: {
    apikey: KEY,
    Authorization: 'Bearer ' + KEY,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  },
  body: JSON.stringify(payload),
});

console.log('HTTP', r.status, r.statusText);
const txt = await r.text();
if (!r.ok) {
  console.log('ERROR BODY:', txt.slice(0, 1500));
  process.exit(1);
}
const inserted = JSON.parse(txt);
console.log(`OK — ${inserted.length} posts inseridos`);

const byAccount = inserted.reduce((acc, p) => { acc[p.account] = (acc[p.account] || 0) + 1; return acc; }, {});
console.log('Por conta:', byAccount);

const byFormat = inserted.reduce((acc, p) => { acc[p.format || 'sem_formato'] = (acc[p.format || 'sem_formato'] || 0) + 1; return acc; }, {});
console.log('Por formato:', byFormat);

const dateMin = inserted.reduce((m, p) => p.scheduled_for && (!m || p.scheduled_for < m) ? p.scheduled_for : m, null);
const dateMax = inserted.reduce((m, p) => p.scheduled_for && (!m || p.scheduled_for > m) ? p.scheduled_for : m, null);
console.log(`Datas: ${dateMin} → ${dateMax}`);
