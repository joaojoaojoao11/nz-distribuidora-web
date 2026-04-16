import { createClient } from '@supabase/supabase-js';

// Função Serverless Vercel Edge/Node
export default async function handler(req, res) {
  // Segurança de Endpoint (Opcional CRON_SECRET)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized Access to NZ Neural Core' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    // O service role key garante permissão para inserir posts ignorando RLS
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!supabaseUrl || !geminiKey) {
      throw new Error("Credenciais do Motor IA Ausentes no Ambiente.");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Busca Campanhas Ativas
    const { data: campaigns, error: campError } = await supabase
      .from('blog_ai_campaigns')
      .select('*')
      .eq('is_active', true);

    if (campError) throw campError;
    if (!campaigns || campaigns.length === 0) {
      return res.status(200).json({ message: 'Motor em Repouso. Sem campanhas ativas.' });
    }

    let postsCreated = 0;

    for (const campaign of campaigns) {
      // 2. Scheduler Check (Frequência em horas)
      const now = new Date();
      const nextRun = campaign.next_run_at ? new Date(campaign.next_run_at) : new Date(0);

      // Se a data atual não passou do nextRun, a IA dorme
      if (now.getTime() < nextRun.getTime()) continue;

      // 3. Busca de Memória Semântica para Análise (Evitar Canibalização)
      const { data: memoryLogs } = await supabase
        .from('blog_ai_memory_log')
        .select('generated_keyword, generated_title')
        .order('created_at', { ascending: false })
        .limit(30);

      const usedKeywords = memoryLogs?.map(log => log.generated_keyword).join(", ") || "nenhuma";
      
      const systemInstruction = `
        Você é o Especialista Chefe do Departamento de Engenharia da NZ Distribuidora (a maior distribuidora atacadista de películas PPF e Adesivos Automotivos Premium do Brasil).
        O seu papel exclusivo é produzir CONTEÚDO MASSIVO, TÉCNICO e IMPLACÁVEL sobre PPF Automotivo com foco no ranqueamento orgânico.
        
        Você DEVE focar estrategicamente em SÃO PAULO. Cite (sem forçar muito) cenários de estéticas automotivas em SP, trânsito de São Paulo, ou o mercado paulista de estética.
        FOCO ABSOLUTO do público: INSTALADORES DE PPF. Explique como se estivesse repassando dicas avançadas para B2B, mas garantindo que o entusiasta final chore de vontade de levar o carro dele na estética que compra da NZ.
        
        REGRA INVIOLÁVEL: NÃO REPETIR jamais os seguintes temas que já postamos: ${usedKeywords}.
        
        DIRETRIZES DA CAMPANHA ATUAL DO MOTOR:
        Tema Cluster: ${campaign.theme}
        ${campaign.instructions ? `Regras Adicionais NZ: ${campaign.instructions}` : ''}
      `;

      const promptPayload = `
        Gere e responda EXCLUSIVAMENTE NO FORMATO JSON estrito (sem crase, sem markdowns extras envelopando o JSON), validado, com as seguintes chaves:
        {
          "title": "H1 Forte SEO que cause impacto",
          "slug": "url-amigavel-separada-hifens",
          "meta_description": "Breve frase SEO e CTR para o Google",
          "focus_keyword": "long-tail keyword do tema",
          "content": "Artigo completo em Markdown Oficial. Faça gigante, use títulos h2, h3, tabelas (obrigatório pelo menos 1 tabela de comparação tipo micragem ou custo benefício), listas e dicas de aplicação reais. Termine dizendo para comprar o PPF direto na NZ e seja um parceiro oficial em São Paulo.",
          "cover_image_prompt": "Prompt em inglês para geração da thumb"
        }
      `;

      // 4. Conexão Neural (Gemini 2.0 Flash REST API)
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
      
      const geminiResponse = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: promptPayload }] }],
          systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.75,
            responseMimeType: "application/json"
          }
        })
      });

      const geminiData = await geminiResponse.json();
      
      if (!geminiData.candidates || geminiData.candidates.length === 0) {
        console.error("Gemini Failure", geminiData);
        continue;
      }
      
      const jsonText = geminiData.candidates[0].content.parts[0].text;
      const article = JSON.parse(jsonText);

      // 5. Inserção na Plataforma (RAG / Publicação)
      const defaultImage = 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=2669&auto=format&fit=crop';
      
      const newPost = {
        title: article.title,
        slug: article.slug,
        meta_description: article.meta_description,
        focus_keyword: article.focus_keyword,
        content: article.content,
        status: 'published',
        published_at: new Date().toISOString(),
        author: 'Engenharia NZ',
        category_id: campaign.target_category_id,
        cover_image_url: defaultImage
      };

      const { error: postError } = await supabase.from('blog_posts').insert(newPost);
      if (postError) {
        console.error("Supabase Post Insertion Error:", postError);
        continue;
      }

      // 6. Atualização de Memória e Ciclo
      await supabase.from('blog_ai_memory_log').insert({
        generated_title: article.title,
        generated_keyword: article.focus_keyword
      });

      const nextDate = new Date();
      nextDate.setHours(nextDate.getHours() + (campaign.frequency_hours || 24));
      
      await supabase.from('blog_ai_campaigns')
        .update({ 
          last_run_at: new Date().toISOString(),
          next_run_at: nextDate.toISOString()
        })
        .eq('id', campaign.id);

      postsCreated++;
    }

    return res.status(200).json({ success: true, message: `Disparo concluído. ${postsCreated} publicações geradas no cluster B2B local.` });

  } catch (err) {
    console.error("Erro Crítico no Motor:", err);
    return res.status(500).json({ error: err.message, status: "ENGINE_FAILURE" });
  }
}
