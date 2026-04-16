import { useState, useEffect } from 'react';
import styles from './Admin.module.css';

interface SettingsData {
  razao_social: string;
  cnpj: string;
  telefone: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export default function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [formData, setFormData] = useState<SettingsData>({
    razao_social: 'NZ DISTRIBUIDORA DE ADESIVOS LTDA',
    cnpj: '',
    telefone: '',
    endereco: 'RUA FELIX ALVINO DA SILVA',
    numero: '65',
    bairro: 'VILA DO CONDE',
    cidade: 'BARUERI',
    estado: 'SP',
    cep: '06445-140'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSave = async () => {
    setLoading(true);
    // Simular salvamento em DB
    setTimeout(() => {
      setLoading(false);
      setSaved(true);
    }, 800);
  };

  return (
    <div className={styles.tableSection}>
      <h2 className={styles.tableSectionTitle} style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Configurações Globais</h2>
      <p className={styles.tabDescription} style={{ marginBottom: '2rem' }}>
        Gerencie informações corporativas persistentes utilizadas pela plataforma (ex: Remetente nas etiquetas de envio).
      </p>

      <div className={styles.createModal} style={{ margin: 0 }}>
        <h3 className={styles.createModalTitle} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          Dados da Empresa
        </h3>

        <div className={styles.createGrid}>
          <div className={styles.createField}>
            <label>Razão Social / Fantasia</label>
            <input 
              name="razao_social" 
              value={formData.razao_social} 
              onChange={handleChange}
              placeholder="Ex: NZ Distribuidora" 
            />
          </div>
          <div className={styles.createField}>
            <label>CNPJ</label>
            <input 
              name="cnpj" 
              value={formData.cnpj} 
              onChange={handleChange}
              placeholder="00.000.000/0000-00" 
            />
          </div>
          
          <div className={styles.createField}>
            <label>Telefone Comercial</label>
            <input 
              name="telefone" 
              value={formData.telefone} 
              onChange={handleChange}
              placeholder="(11) 99999-9999" 
            />
          </div>
          <div className={styles.createField}>
            <label>CEP</label>
            <input 
              name="cep" 
              value={formData.cep} 
              onChange={handleChange}
              placeholder="00000-000" 
            />
          </div>

          <div className={styles.createField} style={{ gridColumn: '1 / -1' }}>
            <label>Endereço Físico (Rua/Avenida)</label>
            <input 
              name="endereco" 
              value={formData.endereco} 
              onChange={handleChange}
              placeholder="Rua Exemplo..." 
            />
          </div>

          <div className={styles.createField}>
            <label>Número</label>
            <input 
              name="numero" 
              value={formData.numero} 
              onChange={handleChange}
              placeholder="123" 
            />
          </div>
          <div className={styles.createField}>
            <label>Bairro</label>
            <input 
              name="bairro" 
              value={formData.bairro} 
              onChange={handleChange}
              placeholder="Centro" 
            />
          </div>

          <div className={styles.createField}>
            <label>Cidade</label>
            <input 
              name="cidade" 
              value={formData.cidade} 
              onChange={handleChange}
              placeholder="São Paulo" 
            />
          </div>
          <div className={styles.createField}>
            <label>Estado (UF)</label>
            <input 
              name="estado" 
              value={formData.estado} 
              onChange={handleChange}
              placeholder="SP" 
              maxLength={2}
            />
          </div>
        </div>

        <div className={styles.createActions} style={{ marginTop: '2rem' }}>
          {saved && <span style={{ color: '#25D366', fontSize: '0.8rem', alignSelf: 'center', marginRight: '1rem', fontWeight: 'bold' }}>✓ SALVO COM SUCESSO</span>}
          <button 
            className={styles.createBtnConfirm} 
            onClick={handleSave}
            disabled={loading}
            style={{ width: '150px' }}
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}
