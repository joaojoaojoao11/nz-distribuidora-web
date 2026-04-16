import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './Admin.module.css';
import { motion } from 'framer-motion';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string;
  focus_keyword: string;
  cover_image_url: string;
  status: 'draft' | 'published';
  published_at: string;
  author: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
}

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '', slug: '', content: '', meta_description: '', focus_keyword: '',
    cover_image_url: '', status: 'draft', author: 'NZ Editor', category_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [postsRes, catRes] = await Promise.all([
      supabase.from('blog_posts').select('*').order('created_at', { ascending: false }),
      supabase.from('blog_categories').select('*').order('name')
    ]);

    if (postsRes.data) setPosts(postsRes.data as BlogPost[]);
    if (catRes.data) setCategories(catRes.data);
    setLoading(false);
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData(post);
    setShowEditor(true);
  };

  const handleCreateNew = () => {
    setEditingPost(null);
    setFormData({
      title: '', slug: '', content: '', meta_description: '', focus_keyword: '',
      cover_image_url: '', status: 'draft', author: 'NZ Editor', category_id: categories.length > 0 ? categories[0].id : ''
    });
    setShowEditor(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta postagem?')) return;
    await supabase.from('blog_posts').delete().eq('id', id);
    fetchData();
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: !editingPost ? generateSlug(title) : prev.slug
    }));
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setUploadingImage(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('blog_media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('blog_media').getPublicUrl(filePath);
      
      setFormData(prev => ({ ...prev, cover_image_url: data.publicUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erro ao fazer upload da imagem.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug) {
      alert('Título e Slug são obrigatórios');
      return;
    }

    const payload = {
      ...formData,
      published_at: formData.status === 'published' && !formData.published_at ? new Date().toISOString() : formData.published_at,
    };

    if (editingPost) {
      const { error } = await supabase.from('blog_posts').update(payload).eq('id', editingPost.id);
      if (error) alert('Erro ao atualizar: ' + error.message);
    } else {
      const { error } = await supabase.from('blog_posts').insert(payload);
      if (error) alert('Erro ao criar: ' + error.message);
    }

    setShowEditor(false);
    fetchData();
  };

  if (showEditor) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.tableSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 className={styles.tableSectionTitle}>{editingPost ? 'Editar Postagem' : 'Nova Postagem'}</h2>
          <button className={styles.actionBtn} onClick={() => setShowEditor(false)}>Voltar / Cancelar</button>
        </div>

        <form onSubmit={handleSave} className={styles.adminFormGrid}>
          <div className={styles.adminFormRow2}>
            <div className={styles.adminFormGroup}>
              <label className={styles.adminLabel}>Título do Post</label>
              <input 
                className={styles.adminInput} 
                value={formData.title} 
                onChange={e => handleTitleChange(e.target.value)} 
                required 
              />
            </div>
            <div className={styles.adminFormGroup}>
              <label className={styles.adminLabel}>Slug da URL</label>
              <input 
                className={styles.adminInput} 
                value={formData.slug} 
                onChange={e => setFormData({ ...formData, slug: e.target.value })} 
                required 
              />
            </div>
          </div>

          <div className={styles.adminFormRow3}>
            <div className={styles.adminFormGroup}>
              <label className={styles.adminLabel}>Categoria</label>
              <select 
                className={styles.adminSelect} 
                value={formData.category_id} 
                onChange={e => setFormData({ ...formData, category_id: e.target.value })}
              >
                <option value="">Sem Categoria</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className={styles.adminFormGroup}>
              <label className={styles.adminLabel}>Autor</label>
              <input 
                className={styles.adminInput} 
                value={formData.author} 
                onChange={e => setFormData({ ...formData, author: e.target.value })} 
              />
            </div>
            <div className={styles.adminFormGroup}>
              <label className={styles.adminLabel}>Status</label>
              <select 
                className={styles.adminSelect} 
                value={formData.status} 
                onChange={e => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
              >
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
              </select>
            </div>
          </div>

          <div className={styles.adminFormRow2}>
            <div className={styles.adminFormGroup}>
              <label className={styles.adminLabel}>Meta Description (Google SEO)</label>
              <textarea 
                className={styles.adminTextarea} 
                style={{ height: '80px', minHeight: '80px' }}
                value={formData.meta_description} 
                onChange={e => setFormData({ ...formData, meta_description: e.target.value })} 
              />
            </div>
            <div className={styles.adminFormGroup}>
              <label className={styles.adminLabel}>Palavra Chave Foco</label>
              <input 
                className={styles.adminInput} 
                value={formData.focus_keyword} 
                onChange={e => setFormData({ ...formData, focus_keyword: e.target.value })} 
                placeholder="Ex: envelopamento ppf, adesivo premium..."
              />
            </div>
          </div>

          <div className={styles.adminFormGroup}>
             <label className={styles.adminLabel}>Imagem de Capa Única</label>
             <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 style={{ display: 'none' }} 
                 accept="image/*"
                 onChange={e => { if (e.target.files && e.target.files[0]) handleImageUpload(e.target.files[0]) }} 
               />
               <button 
                 type="button" 
                 className={styles.actionBtn} 
                 onClick={() => fileInputRef.current?.click()}
                 disabled={uploadingImage}
               >
                 {uploadingImage ? 'ON IT...' : 'UPLOAD DA MÁQUINA'}
               </button>
               {formData.cover_image_url && (
                 <img src={formData.cover_image_url} alt="Cover" style={{ height: '40px', borderRadius: '0', border: '1px solid #333' }} />
               )}
               <input 
                 className={styles.adminInput} 
                 style={{ flex: 1 }}
                 value={formData.cover_image_url} 
                 onChange={e => setFormData({ ...formData, cover_image_url: e.target.value })} 
                 placeholder="Ou cole a URL Pública / CDN da imagem"
               />
             </div>
          </div>

          <div className={styles.adminFormGroup}>
            <label className={styles.adminLabel}>Corpo do Artigo (Markdown Oficial NZ)</label>
            <textarea 
              className={styles.adminTextarea} 
              style={{ minHeight: '500px', fontSize: '0.8rem', lineHeight: '1.6', fontFamily: 'monospace' }}
              value={formData.content} 
              onChange={e => setFormData({ ...formData, content: e.target.value })} 
              placeholder="# Título Principal\n\nEste é um parágrafo longo e detalhado...\n\n## Subtítulo\n- Item 1\n- Item 2"
              required 
            />
          </div>

          <button type="submit" className={styles.adminFormSubmit}>
            {editingPost ? 'Salvar Alterações' : 'Publicar Postagem'}
          </button>
        </form>
      </motion.div>
    );
  }

  return (
    <div className={styles.tableSection}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <p className={styles.tabDescription} style={{ margin: 0 }}>Gerencie as postagens do blog da NZ Distribuidora (Marketizando via SEO).</p>
        <button className={styles.createBtn} onClick={handleCreateNew}>+ Nova Postagem</button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Capa</th>
              <th>Título</th>
              <th>Status</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(post => (
              <tr key={post.id}>
                <td>
                  {post.cover_image_url ? (
                    <img src={post.cover_image_url} alt={post.title} style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                  ) : '—'}
                </td>
                <td style={{ fontWeight: 600 }}>{post.title}</td>
                <td>
                  <span className={`${styles.badge} ${post.status === 'published' ? styles.badgeApproved : styles.badgePending}`}>
                    {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                  </span>
                </td>
                <td>
                  {post.published_at ? new Date(post.published_at).toLocaleDateString('pt-BR') : '—'}
                </td>
                <td>
                  <button className={`${styles.actionBtn} ${styles.actionBtnApprove}`} onClick={() => handleEdit(post)}>Editar</button>
                  <button className={`${styles.actionBtn} ${styles.actionBtnDeny}`} onClick={() => handleDelete(post.id)}>Excluir</button>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr><td colSpan={5} className={styles.emptyState}>Nenhuma postagem encontrada.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
