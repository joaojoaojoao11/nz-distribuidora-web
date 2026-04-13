import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './Admin.module.css';

interface WebProduct {
  id: string;
  brand: string;
  slug: string;
  sku: string | null;
  name: string;
  technical_name: string | null;
  finish_type: string | null;
  hex_code: string | null;
  technical_description: string | null;
  ai_prompt_parameter: string | null;
  price: number;
  stock: number;
  is_active: boolean;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<WebProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<WebProduct | null>(null);

  const [formData, setFormData] = useState({
    brand: 'SH Wrapping',
    slug: '',
    sku: '',
    name: '',
    technical_name: '',
    finish_type: '',
    hex_code: '#000000',
    technical_description: '',
    ai_prompt_parameter: '',
    price: '0',
    stock: '0',
    is_active: true
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('web_catalog_products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const handleOpenModal = (product?: WebProduct) => {
    setErrorMsg('');
    if (product) {
      setEditingProduct(product);
      setFormData({
        brand: product.brand || 'SH Wrapping',
        slug: product.slug,
        sku: product.sku || '',
        name: product.name,
        technical_name: product.technical_name || '',
        finish_type: product.finish_type || '',
        hex_code: product.hex_code || '#000000',
        technical_description: product.technical_description || '',
        ai_prompt_parameter: product.ai_prompt_parameter || '',
        price: product.price.toString(),
        stock: product.stock.toString(),
        is_active: product.is_active
      });
    } else {
      setEditingProduct(null);
      setFormData({
        brand: 'SH Wrapping',
        slug: '',
        sku: '',
        name: '',
        technical_name: '',
        finish_type: '',
        hex_code: '#000000',
        technical_description: '',
        ai_prompt_parameter: '',
        price: '0',
        stock: '0',
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    const payload = {
      brand: formData.brand,
      slug: formData.slug,
      sku: formData.sku || null,
      name: formData.name,
      technical_name: formData.technical_name || null,
      finish_type: formData.finish_type || null,
      hex_code: formData.hex_code || null,
      technical_description: formData.technical_description || null,
      ai_prompt_parameter: formData.ai_prompt_parameter || null,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock) || 0,
      is_active: formData.is_active
    };

    if (editingProduct) {
      const { error } = await supabase
        .from('web_catalog_products')
        .update(payload)
        .eq('id', editingProduct.id);

      if (error) setErrorMsg(error.message);
      else {
        setShowModal(false);
        fetchProducts();
      }
    } else {
      const { error } = await supabase
        .from('web_catalog_products')
        .insert([payload]);

      if (error) setErrorMsg(error.message);
      else {
        setShowModal(false);
        fetchProducts();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este produto?')) return;
    await supabase.from('web_catalog_products').delete().eq('id', id);
    fetchProducts();
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.tableHeader}>
        <h2 style={{ color: '#fff', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Matriz de Produtos (E-commerce)
        </h2>
        <button onClick={() => handleOpenModal()} className={styles.actionBtn} style={{ background: '#ff4444', color: '#fff' }}>
          + Novo Produto
        </button>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <div style={{ padding: '2rem', color: '#8c8e8f' }}>Carregando catálogo...</div>
        ) : (
          <table className={styles.adminTable} style={{ borderCollapse: 'separate', borderSpacing: '0 0.5rem', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ minWidth: '100px', borderBottom: 'none' }}>Marca</th>
                <th style={{ minWidth: '180px', borderBottom: 'none' }}>Cód / Cor</th>
                <th style={{ minWidth: '220px', borderBottom: 'none' }}>Nome Técnico</th>
                <th style={{ minWidth: '350px', borderBottom: 'none' }}>Instrução Prompt IA</th>
                <th style={{ minWidth: '100px', borderBottom: 'none' }}>Status</th>
                <th style={{ minWidth: '120px', borderBottom: 'none', textAlign: 'right', paddingRight: '1.5rem' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#6d7275' }}>
                    Nenhum produto cadastrado na nova matriz E-commerce.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} style={{ 
                    background: `linear-gradient(90deg, ${p.hex_code}1A, rgba(15, 15, 18, 0.95) 30%)`,
                    borderLeft: `4px solid ${p.hex_code}`,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}>
                    <td style={{ borderBottom: 'none', borderTopLeftRadius: '6px', borderBottomLeftRadius: '6px' }}>
                      <span className={styles.badge} style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#888', background: 'rgba(0,0,0,0.4)', padding: '0.3rem 0.6rem' }}>{p.brand}</span>
                    </td>
                    <td style={{ borderBottom: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%', background: p.hex_code || '#000',
                          border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0,
                          boxShadow: `0 0 10px ${p.hex_code}40`
                        }} />
                        <div>
                           <strong style={{ display: 'block', fontSize: '0.9rem', color: '#fff' }}>{p.name}</strong>
                           <span style={{ fontSize: '0.75rem', color: p.hex_code, fontFamily: 'monospace', opacity: 0.9 }}>{p.sku || p.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ borderBottom: 'none' }}>
                      <span style={{ color: '#ccc', fontSize: '0.85rem', display: 'block', fontWeight: 600 }}>{p.technical_name || '—'}</span>
                      <span style={{ fontSize: '0.75rem', color: '#888' }}>{p.finish_type}</span>
                    </td>
                    <td style={{ borderBottom: 'none' }}>
                      <div style={{ 
                        fontFamily: 'monospace', 
                        color: '#b0b3b8', 
                        fontSize: '0.75rem', 
                        background: 'rgba(0, 0, 0, 0.3)', 
                        padding: '0.6rem', 
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        maxWidth: '380px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.4
                      }} title={p.ai_prompt_parameter || 'Sem prompt'}>
                        <span style={{ color: '#4A90D9', marginRight: '4px' }}>&gt;_</span>
                        {p.ai_prompt_parameter || 'Sem parâmetros de IA configurados'}
                      </div>
                    </td>
                    <td style={{ borderBottom: 'none' }}>
                      {p.is_active ? <span className={styles.badge} style={{ borderColor: 'rgba(37, 211, 102, 0.4)', color: '#25D366', background: 'rgba(37, 211, 102, 0.1)', padding: '0.3rem 0.6rem' }}>Ativo</span> : <span className={styles.badge} style={{ padding: '0.3rem 0.6rem' }}>Inativo</span>}
                    </td>
                     <td style={{ borderBottom: 'none', borderTopRightRadius: '6px', borderBottomRightRadius: '6px', textAlign: 'right', paddingRight: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', position: 'relative', zIndex: 10 }}>
                        <button type="button" onClick={() => handleOpenModal(p)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 0.8rem', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.2s', zIndex: 10 }}>Editar</button>
                        <button type="button" onClick={() => handleDelete(p.id)} style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', padding: '0.4rem 0.8rem', borderRadius: '4px', color: '#ff4444', cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.2s', zIndex: 10 }}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#fff' }}>{editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#6d7275', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>
            
            {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}

            <form onSubmit={handleSave} className={styles.createGrid} style={{ gap: '1.5rem' }}>
              <div className={styles.createField}>
                <label>Marca</label>
                <select value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}>
                  <option value="SH Wrapping">SH Wrapping</option>
                  <option value="NZ PPF">NZ PPF</option>
                  <option value="Oracal 670">Oracal 670</option>
                </select>
              </div>

              <div className={styles.createField}>
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>Nome Comercial <span style={{ color: '#ff4444' }}>*</span></label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Fantastic Purple" />
              </div>

              <div className={styles.createField}>
                <label>Nome Técnico</label>
                <input value={formData.technical_name} onChange={e => setFormData({...formData, technical_name: e.target.value})} placeholder="Ex: FANTASTIC PURPLE (EM-102)" />
              </div>

              <div className={styles.createField}>
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>Slug (URL única) <span style={{ color: '#ff4444' }}>*</span></label>
                <input required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="Ex: fantastic-purple" />
              </div>

              <div className={styles.createField}>
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>Cód. HEX (Cor) <span style={{ color: '#ff4444' }}>*</span></label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input type="color" value={formData.hex_code} onChange={e => setFormData({...formData, hex_code: e.target.value})} style={{ height: '44px', width: '48px', padding: '0', border: 'none', cursor: 'pointer', background: 'transparent' }} />
                  <input required value={formData.hex_code} onChange={e => setFormData({...formData, hex_code: e.target.value})} placeholder="#000000" style={{ flex: 1 }} />
                </div>
              </div>

              <div className={styles.createField}>
                <label>Acabamento</label>
                <input value={formData.finish_type} onChange={e => setFormData({...formData, finish_type: e.target.value})} placeholder="Ex: Camaleão Brilhante" />
              </div>

              <div className={styles.createField}>
                <label>SKU (Integração ERP)</label>
                <input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="Ex: 670RA-010" />
              </div>

              <div className={styles.createField}>
                <label>Preço Venda (E-commerce)</label>
                <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              </div>

              <div className={styles.createField} style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ color: '#4A90D9' }}>&gt;_</span>  Parâmetro de IA (AI Prompt)
                </label>
                <textarea 
                  value={formData.ai_prompt_parameter} 
                  onChange={e => setFormData({...formData, ai_prompt_parameter: e.target.value})} 
                  style={{ minHeight: '80px', fontFamily: 'monospace', fontSize: '0.85rem', color: '#4A90D9', background: 'rgba(74, 144, 217, 0.05)', borderColor: 'rgba(74, 144, 217, 0.2)' }}
                  placeholder="Instruções para geração de imagens (ex: Camaleão de base prata-lilás explodindo em magenta néon...)" 
                />
              </div>

              <div className={styles.createField} style={{ gridColumn: '1 / -1' }}>
                <label>Descrição Técnica (Ficha Técnica / App)</label>
                <textarea 
                  value={formData.technical_description} 
                  onChange={e => setFormData({...formData, technical_description: e.target.value})} 
                  style={{ minHeight: '100px', fontSize: '0.85rem', lineHeight: '1.5' }}
                  placeholder="Diferenciais do produto, durabilidade, espessura..."
                />
              </div>

              <div className={styles.createField}>
                <label>Estoque (Unid.)</label>
                <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
              </div>

              <div className={styles.createField} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.25rem' }}>
                <input 
                  type="checkbox" 
                  id="isActive" 
                  checked={formData.is_active} 
                  onChange={e => setFormData({...formData, is_active: e.target.checked})} 
                  style={{ width: '1.2rem', height: '1.2rem', accentColor: '#ff4444', flexShrink: 0 }}
                />
                <label htmlFor="isActive" style={{ cursor: 'pointer', fontWeight: 600, color: '#fff', fontSize: '0.8rem', letterSpacing: '0.5px' }}>Cor Ativa no E-commerce</label>
              </div>

              <div className={styles.createActions} style={{ gridColumn: '1 / -1', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.createBtnCancel}>Cancelar</button>
                <button type="submit" className={styles.createBtnConfirm} disabled={saving}>
                  {saving ? 'Registrando...' : 'Salvar Matriz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
