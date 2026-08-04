import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './Admin.module.css';
import { motion } from 'framer-motion';

export interface AICampaign {
  id: string;
  theme: string;
  target_category_id: string | null;
  instructions: string | null;
  frequency_hours: number;
  is_active: boolean;
  auto_publish?: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
}

export interface Category {
  id: string;
  name: string;
}

export interface AIMemoryLog {
  id: string;
  generated_title: string;
  generated_keyword: string;
  created_at: string;
}

export interface AIRunLog {
  id: string;
  created_at: string;
  status: string | null;
  reason: string | null;
  image_mode: string | null;
}

export default function AdminAIBlog() {
  const [campaigns, setCampaigns] = useState<AICampaign[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [logs, setLogs] = useState<AIMemoryLog[]>([]);
  const [runLogs, setRunLogs] = useState<AIRunLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AICampaign | null>(null);
  const [firingCampaignId, setFiringCampaignId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<AICampaign>>({
    theme: '',
    target_category_id: '',
    instructions: '',
    frequency_hours: 24,
    is_active: true,
    auto_publish: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [campaignRes, catRes, logsRes, runsRes] = await Promise.all([
      supabase.from('blog_ai_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('blog_categories').select('*').order('name'),
      supabase.from('blog_ai_memory_log').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('blog_ai_run_log').select('*').order('created_at', { ascending: false }).limit(15)
    ]);

    if (campaignRes.data) setCampaigns(campaignRes.data as AICampaign[]);
    if (catRes.data) setCategories(catRes.data as Category[]);
    if (logsRes.data) setLogs(logsRes.data as AIMemoryLog[]);
    if (runsRes.data) setRunLogs(runsRes.data as AIRunLog[]);
    setLoading(false);
  };

  const handleEdit = (campaign: AICampaign) => {
    setEditingCampaign(campaign);
    setFormData(campaign);
    setShowEditor(true);
  };

  const handleCreateNew = () => {
    setEditingCampaign(null);
    setFormData({
      theme: '',
      target_category_id: categories.length > 0 ? categories[0].id : null,
      instructions: '',
      frequency_hours: 24,
      is_active: true,
      // Campanha nova nasce gerando RASCUNHO — valide o tom antes de ligar a
      // publicação automática.
      auto_publish: false
    });
    setShowEditor(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este cronograma IA?')) return;
    await supabase.from('blog_ai_campaigns').delete().eq('id', id);
    fetchData();
  };

  const handleToggleActive = async (campaign: AICampaign) => {
    await supabase.from('blog_ai_campaigns').update({ is_active: !campaign.is_active }).eq('id', campaign.id);
    fetchData();
  };

  const handleFireNow = async (campaign: AICampaign) => {
    const destino = campaign.auto_publish === false
      ? 'gerar 1 RASCUNHO para você revisar na aba Blog'
      : 'gerar 1 post e publicar imediatamente no blog';
    if (!window.confirm(`Disparar o Motor AGORA para a campanha "${campaign.theme}"?\n\nIsto vai ${destino}.`)) {
      return;
    }
    setFiringCampaignId(campaign.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('Sessão expirada. Faça login novamente.');
        return;
      }
      const response = await fetch('/api/cron/ai-writer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ force: true, campaignId: campaign.id }),
      });
      const json = await response.json();
      if (!response.ok) {
        alert(`Motor falhou: ${json.error || response.status}`);
        return;
      }
      const run = json.runs?.[0];
      if (!run) {
        alert('Motor rodou mas não reportou execução. Veja logs Vercel.');
        return;
      }
      if (run.status === 'posted') {
        alert(`Post publicado!\n\nTítulo: ${run.title}\nImagem: ${run.imageMode === 'generated' ? 'gerada pela IA' : 'fallback do pool'}`);
      } else if (run.status === 'draft_created') {
        alert(`Rascunho criado!\n\nTítulo: ${run.title}\nImagem: ${run.imageMode === 'generated' ? 'gerada pela IA' : 'fallback do pool'}\n\nRevise e publique na aba Blog.`);
      } else {
        alert(`Motor rodou mas não gerou artigo. Status: ${run.status}. Motivo: ${run.reason || '-'}`);
      }
      fetchData();
    } catch (err) {
      alert(`Erro: ${err instanceof Error ? err.message : 'desconhecido'}`);
    } finally {
      setFiringCampaignId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.theme) {
      alert('Tema principal é obrigatório');
      return;
    }

    const payload = {
      theme: formData.theme,
      target_category_id: formData.target_category_id || null,
      instructions: formData.instructions,
      frequency_hours: formData.frequency_hours,
      is_active: formData.is_active,
      auto_publish: formData.auto_publish !== false
    };

    if (editingCampaign) {
      const { error } = await supabase.from('blog_ai_campaigns').update(payload).eq('id', editingCampaign.id);
      if (error) alert('Erro ao atualizar: ' + error.message);
    } else {
      const { error } = await supabase.from('blog_ai_campaigns').insert(payload);
      if (error) alert('Erro ao criar: ' + error.message);
    }

    setShowEditor(false);
    fetchData();
  };

  if (showEditor) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.tableSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 className={styles.tableSectionTitle}>{editingCampaign ? 'Editar Cronograma' : 'Novo Cronograma IA'}</h2>
            <p className={styles.tabDescription}>Treine o Motor sobre qual assunto ele deverá manter o site vivo e atualizado.</p>
          </div>
          <button className={styles.actionBtn} onClick={() => setShowEditor(false)}>Voltar / Cancelar</button>
        </div>

        <form onSubmit={handleSave} className={styles.adminFormGrid}>
          <div className={styles.adminFormGroup}>
            <label className={styles.adminLabel}>Tema Geral / Cluster Orgânico</label>
            <input
              className={styles.adminInput}
              value={formData.theme}
              onChange={e => setFormData({ ...formData, theme: e.target.value })}
              placeholder="Ex: Diferença entre película PPF e vitrificador..."
              required
            />
          </div>

          <div className={styles.adminFormRow3}>
            <div className={styles.adminFormGroup}>
              <label className={styles.adminLabel}>Categoria de Destino</label>
              <select
                className={styles.adminSelect}
                value={formData.target_category_id || ''}
                onChange={e => setFormData({ ...formData, target_category_id: e.target.value })}
              >
                <option value="">Sem Categoria</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className={styles.adminFormGroup}>
              <label className={styles.adminLabel}>Frequência de Postagem</label>
              <select
                className={styles.adminSelect}
                value={formData.frequency_hours}
                onChange={e => setFormData({ ...formData, frequency_hours: Number(e.target.value) })}
              >
                <option value={12}>2x ao dia (12h)</option>
                <option value={24}>1x ao dia (24h)</option>
                <option value={48}>A cada dois dias (48h)</option>
                <option value={168}>1x por semana (168h)</option>
              </select>
            </div>
            <div className={styles.adminFormGroup}>
              <label className={styles.adminLabel}>Status Inicial</label>
              <select
                className={styles.adminSelect}
                value={formData.is_active ? 'active' : 'paused'}
                onChange={e => setFormData({ ...formData, is_active: e.target.value === 'active' })}
              >
                <option value="active">Motor Ligado</option>
                <option value="paused">Pausado</option>
              </select>
            </div>
            <div className={styles.adminFormGroup}>
              <label className={styles.adminLabel}>Publicação</label>
              <select
                className={styles.adminSelect}
                value={formData.auto_publish === false ? 'draft' : 'auto'}
                onChange={e => setFormData({ ...formData, auto_publish: e.target.value === 'auto' })}
              >
                <option value="draft">Rascunho para revisão</option>
                <option value="auto">Publicar automaticamente</option>
              </select>
            </div>
          </div>

          <div className={styles.adminFormGroup}>
            <label className={styles.adminLabel}>Instruções Customizadas (System Prompt Especial)</label>
            <textarea
              className={styles.adminTextarea}
              style={{ minHeight: '120px' }}
              value={formData.instructions || ''}
              onChange={e => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Aqui você dita a regra pro Gemini: 'Seja divertido', 'Sempre termine pedindo para falar com nosso contato...', 'Direcione o conteúdo para instaladores mais experientes...'"
            />
          </div>

          <button type="submit" className={styles.adminFormSubmit}>
            {editingCampaign ? 'Salvar Configurações' : 'Ligar o Motor de IA'}
          </button>
        </form>
      </motion.div>
    );
  }

  return (
    <div className={styles.tableSection}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <p className={styles.tabDescription} style={{ margin: 0 }}>Gerencie as diretrizes robóticas que alimentam o Blog da NZ 24/7 de forma inteligente.</p>
        <button className={styles.createBtn} onClick={handleCreateNew}>+ Definir Novo Cronograma</button>
      </div>

      {loading ? (
        <p>Acessando Núcleo Neural...</p>
      ) : (
        <>
          <h3 className={styles.createModalLabel} style={{ marginTop: '2rem' }}>Cronogramas Cadastrados</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Status</th>
                <th>Tema Base</th>
                <th>Frequência</th>
                <th>Publicação</th>
                <th>Próximo Disparo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(camp => (
                <tr key={camp.id}>
                  <td>
                    <button
                      onClick={() => handleToggleActive(camp)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '1.2rem', padding: '0.2rem'
                      }}
                      title="Clique para alternar o Motor"
                    >
                      {camp.is_active ? 'ALIVE' : 'PAUSED'}
                    </button>
                  </td>
                  <td style={{ fontWeight: 600 }}>{camp.theme}</td>
                  <td>a cada {camp.frequency_hours}h</td>
                  <td>
                    <span style={{ color: camp.auto_publish === false ? '#FFD400' : '#00C9A7', fontSize: '0.85rem' }}>
                      {camp.auto_publish === false ? 'Rascunho' : 'Automática'}
                    </span>
                  </td>
                  <td>
                    {camp.next_run_at
                      ? new Date(camp.next_run_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                      : 'Aguardando'
                    }
                  </td>
                  <td>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleFireNow(camp)}
                      disabled={firingCampaignId === camp.id}
                      title="Gera 1 post agora, ignorando o cronograma"
                    >
                      {firingCampaignId === camp.id ? 'Disparando...' : 'Disparar Agora'}
                    </button>
                    <button className={`${styles.actionBtn} ${styles.actionBtnApprove}`} onClick={() => handleEdit(camp)}>Ajustar Motor</button>
                    <button className={`${styles.actionBtn} ${styles.actionBtnDeny}`} onClick={() => handleDelete(camp.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr><td colSpan={6} className={styles.emptyState}>Nenhum cronograma de IA rodando. O blog depende unicamente de postagens humanas.</td></tr>
              )}
            </tbody>
          </table>

          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className={styles.createModalLabel}>Saúde do Motor (Últimas Execuções do Cron)</h3>
            {(() => {
              const generated = runLogs.filter(r => r.status === 'posted' || r.status === 'draft_created');
              const last = runLogs[0];
              return (
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', margin: '12px 0 16px', fontSize: '0.9rem' }}>
                  <span>Última execução: <strong>{last ? `${new Date(last.created_at).toLocaleString('pt-BR')} — ${last.status}` : 'nenhuma registrada'}</strong></span>
                  <span>Artigos nas últimas {runLogs.length} execuções: <strong style={{ color: '#00C9A7' }}>{generated.length}</strong></span>
                  <span>Texto: <strong style={{ color: '#00C9A7' }}>Claude</strong> · Capa: <strong>pool de fotos</strong> (personalizar na revisão)</span>
                </div>
              );
            })()}
            <table className={styles.table} style={{ opacity: 0.8 }}>
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>Status</th>
                  <th>Motivo</th>
                  <th>Capa</th>
                </tr>
              </thead>
              <tbody>
                {runLogs.map(run => (
                  <tr key={run.id}>
                    <td>{new Date(run.created_at).toLocaleString('pt-BR')}</td>
                    <td style={{ color: run.status === 'posted' || run.status === 'draft_created' ? '#00C9A7' : '#FF6B6B' }}>{run.status || '-'}</td>
                    <td>{run.reason || '-'}</td>
                    <td>{run.image_mode === 'generated' ? 'IA' : run.image_mode === 'fallback' ? 'fallback' : '-'}</td>
                  </tr>
                ))}
                {runLogs.length === 0 && (
                  <tr><td colSpan={4} className={styles.emptyState}>Nenhuma execução registrada ainda (o log começa a partir do motor v2).</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className={styles.createModalLabel}>Memória Semântica (Últimas Decisões Autônomas do Bot)</h3>
            <table className={styles.table} style={{ opacity: 0.8 }}>
              <thead>
                <tr>
                  <th>Data do Dano (Quando publicou)</th>
                  <th>Palavra Chave Rejeitada/Usada</th>
                  <th>Geração Efetuada</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td>{new Date(log.created_at).toLocaleString('pt-BR')}</td>
                    <td style={{ color: '#00C9A7' }}>{log.generated_keyword}</td>
                    <td>{log.generated_title}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={3} className={styles.emptyState}>A IA ainda não gerou artigos, nada na memória.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
