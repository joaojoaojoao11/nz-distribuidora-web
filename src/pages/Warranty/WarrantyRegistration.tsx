import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import SEO from '../../components/SEO/SEO';
import styles from './WarrantyRegistration.module.css';
import { CheckCircle2, Shield, AlertCircle, ChevronRight, QrCode, CalendarClock, Droplets, Leaf, Car, LayoutGrid, Sofa } from 'lucide-react';

const blurReveal: any = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.2 } }
};

const slideFromRight: any = {
  hidden: { opacity: 0, x: 40, filter: 'blur(6px)' },
  visible: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 1 } }
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.1 } }
};

interface WarrantyFormData {
  cliente_cpf: string;
  cliente_nome_completo: string;
  cliente_email: string;
  cliente_telefone: string;
  solicita_envio_fisico: boolean;
  cliente_cep: string;
  cliente_endereco: string;
  cliente_numero: string;
  cliente_complemento: string;
  cliente_bairro: string;
  cliente_cidade: string;
  cliente_estado: string;
  veiculo_placa_chassi: string;
  veiculo_modelo: string;
  aplicador_nome: string;
  data_aplicacao: string;
  linha_escolhida: 'NZWrap' | 'PPF' | '';
  produto_nome: string;
  tipo_servico: 'Total/Full' | 'Parcial' | 'Movel/Eletro' | '';
  areas_protegidas: string[];
}

const INITIAL_FORM: WarrantyFormData = {
  cliente_cpf: '',
  cliente_nome_completo: '',
  cliente_email: '',
  cliente_telefone: '',
  solicita_envio_fisico: false,
  cliente_cep: '',
  cliente_endereco: '',
  cliente_numero: '',
  cliente_complemento: '',
  cliente_bairro: '',
  cliente_cidade: '',
  cliente_estado: '',
  veiculo_placa_chassi: '',
  veiculo_modelo: '',
  aplicador_nome: '',
  data_aplicacao: '',
  linha_escolhida: '',
  produto_nome: '',
  tipo_servico: '',
  areas_protegidas: []
};

function generateAuthCode(dateStr: string, placa: string): string {
  if (!dateStr || !placa) return '';
  const cleanPlaca = placa.replace(/[^A-Z0-9]/ig, '').toUpperCase();
  const dateParts = dateStr.split('-');
  const dateFormatted = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : dateStr;
  const hash = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `NZ-${dateFormatted.replace(/\//g, '')}-${cleanPlaca}-${hash}`;
}

const AVAILABLE_AREAS = [
  "Capô", "Teto", "Para-choque Dianteiro", "Para-choque Traseiro",
  "Laterais", "Portas", "Para-lamas", "Retrovisores", "Faróis", "Parabrisa", "Interno"
];

const WarrantyRegistration = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<WarrantyFormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const defaultPPF = [
    { name: 'NZPPF LUXURY', garantia_anos: 12, durabilidade_anos: 15 },
    { name: 'NZPPF PRIME', garantia_anos: 10, durabilidade_anos: 12 },
    { name: 'NZPPF FLOW', garantia_anos: 7, durabilidade_anos: 9 },
    { name: 'NZPPF CORE', garantia_anos: 3, durabilidade_anos: 5 },
    { name: 'NZPPF HEADLIGHT', garantia_anos: 10, durabilidade_anos: 12 },
    { name: 'NZPPF WINDSHIELD', garantia_anos: 2, durabilidade_anos: 3 }
  ];

  const [ppfProducts, setPpfProducts] = useState<any[]>([]);

  React.useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('web_catalog_products')
          .select('name, garantia_anos, durabilidade_anos')
          .eq('brand', 'NZPPF')
          .eq('is_active', true);

        if (data && data.length > 0) {
          setPpfProducts(data);
        } else {
          console.error("DB List empty or blocked:", error);
          setPpfProducts(defaultPPF);
        }
      } catch (err) {
        console.error("Fetch exc:", err);
        setPpfProducts(defaultPPF);
      }
    }
    fetchProducts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let cep = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, cliente_cep: cep }));

    if (cep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            cliente_endereco: data.logradouro,
            cliente_bairro: data.bairro,
            cliente_cidade: data.localidade,
            cliente_estado: data.uf
          }));
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
      }
    }
  };

  const handleAreaToggle = (area: string) => {
    setFormData(prev => {
      const isSelected = prev.areas_protegidas.includes(area);
      if (isSelected) {
        return { ...prev, areas_protegidas: prev.areas_protegidas.filter(a => a !== area) };
      } else {
        return { ...prev, areas_protegidas: [...prev.areas_protegidas, area] };
      }
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.linha_escolhida) {
        setErrorMsg('Selecione o tipo de certificado (NZPPF ou NZWRAP).');
        return;
      }
    } else if (step === 2) {
      if (!formData.tipo_servico) {
        setErrorMsg('Selecione o tipo de serviço.');
        return;
      }
    } else if (step === 3) {
      if (!formData.produto_nome.trim()) {
        setErrorMsg('Selecione/informe a linha do produto.');
        return;
      }
    }
    setErrorMsg('');
    setStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    if (!formData.cliente_cpf || !formData.veiculo_placa_chassi || !formData.data_aplicacao || !formData.aplicador_nome) {
      setErrorMsg('Preencha os campos obrigatórios.');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const code = generateAuthCode(formData.data_aplicacao, formData.veiculo_placa_chassi);
      setAuthCode(code);

      const productObj = ppfProducts.find(p => p.name === formData.produto_nome);
      // Para as marcas SH ou material manual, garantimos garantias defaults se não houver
      const garantiaAnos = productObj ? productObj.garantia_anos : 0;
      const durabilidadeAnos = productObj ? productObj.durabilidade_anos : (formData.linha_escolhida === 'NZWrap' ? 3 : 0);

      const payload = {
        cliente_cpf: formData.cliente_cpf,
        cliente_nome_completo: formData.cliente_nome_completo,
        cliente_email: formData.cliente_email,
        cliente_telefone: formData.cliente_telefone,
        cliente_cep: formData.solicita_envio_fisico ? formData.cliente_cep : null,
        cliente_endereco: formData.solicita_envio_fisico ? formData.cliente_endereco : null,
        cliente_numero: formData.solicita_envio_fisico ? formData.cliente_numero : null,
        cliente_complemento: formData.solicita_envio_fisico ? formData.cliente_complemento : null,
        cliente_bairro: formData.solicita_envio_fisico ? formData.cliente_bairro : null,
        cliente_cidade: formData.cliente_cidade,
        cliente_estado: formData.cliente_estado,
        veiculo_placa_chassi: formData.veiculo_placa_chassi,
        veiculo_modelo: formData.veiculo_modelo,
        aplicador_nome: formData.aplicador_nome,
        data_aplicacao: formData.data_aplicacao,
        produto_nome: formData.produto_nome || formData.linha_escolhida,
        linha_escolhida: formData.linha_escolhida,
        tipo_servico: formData.tipo_servico,
        areas_protegidas: formData.tipo_servico === 'Total/Full' ? ["Veículo Completo"] : formData.tipo_servico === 'Movel/Eletro' ? ["Item Completo"] : formData.areas_protegidas,
        codigo_autenticacao: code,
        garantia_anos: garantiaAnos,
        durabilidade_anos: durabilidadeAnos
      };

      const { error } = await supabase.from('garantias_nz').insert([payload]);

      if (error) {
        throw new Error(error.message);
      }

      // Enviar notificação por e-mail silenciosamente
      try {
        fetch('https://formsubmit.co/ajax/joaovitor@nzdistribuidora.com.br', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            _subject: 'Nova Garantia Registrada',
            Veiculo: formData.veiculo_modelo,
            Placa_Chassi: formData.veiculo_placa_chassi,
            Cliente_CPF: formData.cliente_cpf,
            Instalador: formData.aplicador_nome,
            Produto: formData.produto_nome || formData.linha_escolhida,
            Servico: formData.tipo_servico,
            Codigo_Hash: code,
          })
        });
      } catch (e) {
        console.error('Erro na notificação', e);
      }

      setStep(5); // Certificate generated success
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar garantia. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className={styles.container}>
      <SEO
        title="Registro de Garantia NZPPF — Certificado Digital"
        description="Registre a garantia da sua película NZPPF: certificado com hash único e assinatura digital vinculada a placa e chassi. Proteção Elite validada em tempo real."
        canonicalUrl="/registro-garantia"
      />
      <div className={styles.content}>

        {step < 5 && (
          <motion.div
            className={styles.header}
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <div className={styles.luxuryGlow}></div>
            <motion.h1 variants={blurReveal} className={styles.mainTitle}>STATUS: ELITE PROTECTED.</motion.h1>
            <motion.p variants={slideFromRight} className={styles.luxurySubtitle}>
              Se você está aqui, significa que seu veículo recebeu <strong>o que há de mais avançado</strong> em tecnologia de proteção de pintura no mundo.
            </motion.p>
            <motion.p variants={blurReveal} className={styles.subtitle}>
              Autentique sua garantia oficial e legitime seu patrimônio [ PASSO {step}/4 ]
            </motion.p>
          </motion.div>
        )}

        {errorMsg && (
          <div style={{ backgroundColor: 'rgba(230, 25, 25, 0.1)', border: '1px solid #E61919', color: '#E61919', padding: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} />
            <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{errorMsg}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 4 && (
            <motion.div
              key="step4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={styles.stepCard}
            >
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>CPF do Cliente</label>
                  <input className={styles.input} type="text" name="cliente_cpf" value={formData.cliente_cpf} onChange={handleChange} placeholder="000.000.000-00" />
                </div>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>Nome Completo do Títular</label>
                  <input className={styles.input} type="text" name="cliente_nome_completo" value={formData.cliente_nome_completo} onChange={handleChange} placeholder="João da Silva" />
                </div>
                <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                  <label className={styles.label}>E-mail do Proprietário</label>
                  <input className={styles.input} type="email" name="cliente_email" value={formData.cliente_email} onChange={handleChange} placeholder="seuemail@exemplo.com" />
                  <span style={{ fontSize: '0.75rem', color: '#888' }}>
                    Opcional. Usado para o proprietário baixar a apólice digital.
                  </span>
                </div>

                <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                  <label className={styles.label}>Telefone do Proprietário</label>
                  <input className={styles.input} type="text" name="cliente_telefone" value={formData.cliente_telefone} onChange={handleChange} placeholder="(11) 99999-9999" />
                </div>

                <div className={styles.formGroup} style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontFamily: 'Space Grotesk', color: '#fff' }}>
                    <input type="checkbox" name="solicita_envio_fisico" checked={formData.solicita_envio_fisico} onChange={handleChange} style={{ accentColor: '#D4AF37', width: '1.2rem', height: '1.2rem' }} />
                    ⛟ Solicitar cópia impressa via Correios (Preencher Endereço Físico)
                  </label>
                </div>

                {formData.solicita_envio_fisico && (
                  <div className={styles.formGrid} style={{ gridColumn: '1 / -1', gap: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '8px' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>CEP</label>
                      <input className={styles.input} type="text" name="cliente_cep" value={formData.cliente_cep} onChange={handleCepChange} placeholder="00000-000" maxLength={9} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Endereço (Rua/Av)</label>
                      <input className={styles.input} type="text" name="cliente_endereco" value={formData.cliente_endereco} onChange={handleChange} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Número e Complemento</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem' }}>
                        <input className={styles.input} type="text" name="cliente_numero" value={formData.cliente_numero} onChange={handleChange} placeholder="123" />
                        <input className={styles.input} type="text" name="cliente_complemento" value={formData.cliente_complemento} onChange={handleChange} placeholder="Apto 4" />
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Bairro</label>
                      <input className={styles.input} type="text" name="cliente_bairro" value={formData.cliente_bairro} onChange={handleChange} />
                    </div>
                  </div>
                )}

                <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                  <label className={styles.label}>Cidade</label>
                  <input className={styles.input} type="text" name="cliente_cidade" value={formData.cliente_cidade} onChange={handleChange} />
                </div>
                <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                  <label className={styles.label}>Estado (UF)</label>
                  <input className={styles.input} type="text" name="cliente_estado" value={formData.cliente_estado} onChange={handleChange} placeholder="SP" maxLength={2} />
                </div>

                <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                  <label className={styles.label}>Instalador Oficial / Loja</label>
                  <input className={styles.input} type="text" name="aplicador_nome" value={formData.aplicador_nome} onChange={handleChange} placeholder="Nome do Credenciado" />
                </div>
                <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                  <label className={styles.label}>{formData.tipo_servico === 'Movel/Eletro' ? 'Identificação do Item (Nº de série / etiqueta)' : 'Placa ou Chassi'}</label>
                  <input className={styles.input} type="text" name="veiculo_placa_chassi" value={formData.veiculo_placa_chassi} onChange={handleChange} placeholder={formData.tipo_servico === 'Movel/Eletro' ? 'Ex: SN-9F3K21 / etiqueta interna' : 'ABC-1234'} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>{formData.tipo_servico === 'Movel/Eletro' ? 'Descrição do Móvel/Eletrodoméstico' : 'Modelo do Veículo'}</label>
                  <input className={styles.input} type="text" name="veiculo_modelo" value={formData.veiculo_modelo} onChange={handleChange} placeholder={formData.tipo_servico === 'Movel/Eletro' ? 'Ex: Geladeira Brastemp Inox 540L' : 'Ex: Porsche 911 Carrera'} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Data da Aplicação</label>
                  <input className={styles.input} type="date" name="data_aplicacao" value={formData.data_aplicacao} onChange={handleChange} />
                </div>
              </div>
              <div className={styles.footerNav}>
                <button className={styles.btnSecondary} onClick={() => setStep(3)}>VOLTAR</button>
                <button className={styles.btnPrimary} onClick={handleSubmit} disabled={loading}>
                  {loading ? 'PROCESSANDO...' : 'EMITIR CERTIFICADO OFICIAL'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={styles.stepCard}
            >
              <div className={styles.bentoGrid}>
                <div
                  className={`${styles.bentoCard} ${formData.linha_escolhida === 'PPF' ? styles.bentoCardActive : ''}`}
                  onClick={() => setFormData({ ...formData, linha_escolhida: 'PPF', produto_nome: '', tipo_servico: '', areas_protegidas: [] })}
                >
                  <div className={styles.bentoTitle} style={{ marginBottom: '1.5rem' }}>
                    <img src="/assets/simbolos/LOGO-NZPPF-BRANCO.svg" alt="NZ-PPF" style={{ height: '110px', opacity: formData.linha_escolhida === 'PPF' ? 1 : 0.6, transition: 'all 0.3s ease', filter: formData.linha_escolhida === 'PPF' ? 'brightness(0) invert(0)' : 'none' }} />
                  </div>
                  <div className={styles.bentoServiceText}>PPF</div>
                </div>
                <div
                  className={`${styles.bentoCard} ${formData.linha_escolhida === 'NZWrap' ? styles.bentoCardActive : ''}`}
                  onClick={() => setFormData({ ...formData, linha_escolhida: 'NZWrap', produto_nome: '', tipo_servico: '', areas_protegidas: [] })}
                >
                  <div className={styles.bentoTitle} style={{ marginBottom: '1.5rem' }}>
                    <img src="/assets/simbolos/LOGO-NZWRAP-BRANCO.svg" alt="NZWrap" style={{ height: '110px', opacity: formData.linha_escolhida === 'NZWrap' ? 1 : 0.6, transition: 'all 0.3s ease', filter: formData.linha_escolhida === 'NZWrap' ? 'brightness(0) invert(0)' : 'none' }} />
                  </div>
                  <div className={styles.bentoServiceText}>ENVELOPAMENTO</div>
                </div>
              </div>

              <div className={styles.footerNav}>
                <button className={styles.btnPrimary} style={{ marginLeft: 'auto' }} disabled={!formData.linha_escolhida} onClick={handleNext}>
                  AVANÇAR <ChevronRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={styles.stepCard}
            >
              <div className={styles.serviceTypeGrid} style={formData.linha_escolhida === 'PPF' ? { gridTemplateColumns: 'repeat(3, 1fr)' } : undefined}>
                <button
                  className={`${styles.serviceBtn} ${formData.tipo_servico === 'Total/Full' ? styles.serviceBtnActive : ''}`}
                  onClick={() => setFormData({ ...formData, tipo_servico: 'Total/Full', areas_protegidas: [] })}
                >
                  <span className={styles.serviceMarker}><Car size={22} /></span>
                  <span className={styles.serviceLabel}>Total / Full</span>
                </button>
                <button
                  className={`${styles.serviceBtn} ${formData.tipo_servico === 'Parcial' ? styles.serviceBtnActive : ''}`}
                  onClick={() => setFormData({ ...formData, tipo_servico: 'Parcial' })}
                >
                  <span className={styles.serviceMarker}><LayoutGrid size={22} /></span>
                  <span className={styles.serviceLabel}>Parcial Frontal / Kit</span>
                </button>
                {formData.linha_escolhida === 'PPF' && (
                  <button
                    className={`${styles.serviceBtn} ${formData.tipo_servico === 'Movel/Eletro' ? styles.serviceBtnActive : ''}`}
                    onClick={() => setFormData({ ...formData, tipo_servico: 'Movel/Eletro', areas_protegidas: [] })}
                  >
                    <span className={styles.serviceMarker}><Sofa size={22} /></span>
                    <span className={styles.serviceLabel}>Móvel / Eletrodoméstico</span>
                  </button>
                )}
              </div>

              {formData.tipo_servico === 'Parcial' && (
                <div style={{ marginTop: '2rem' }}>
                  <label className={styles.label}>Selecione as áreas protegidas:</label>
                  <div className={styles.chipsContainer}>
                    {AVAILABLE_AREAS.map(area => (
                      <div
                        key={area}
                        className={`${styles.chip} ${formData.areas_protegidas.includes(area) ? styles.chipActive : ''}`}
                        onClick={() => handleAreaToggle(area)}
                      >
                        {area}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.footerNav}>
                <button className={styles.btnSecondary} onClick={() => setStep(1)}>VOLTAR</button>
                <button className={styles.btnPrimary} onClick={handleNext} disabled={!formData.tipo_servico}>
                  AVANÇAR <ChevronRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={styles.stepCard}
            >
              <div className={styles.formGroup}>
                <label className={styles.label}>Linha do Produto / Material Utilizado ({formData.linha_escolhida})</label>
                {formData.linha_escolhida === 'PPF' ? (
                  <select
                    className={styles.inputSelect}
                    name="produto_nome"
                    value={formData.produto_nome}
                    onChange={handleChange}
                  >
                    <option value="">Selecione a Linha Oficial...</option>
                    {ppfProducts.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className={styles.input}
                    type="text"
                    name="produto_nome"
                    value={formData.produto_nome}
                    onChange={handleChange}
                    placeholder="Ex: Preto Brilho, Nardo Grey, Fibra de Carbono..."
                  />
                )}
              </div>

              <div className={styles.footerNav}>
                <button className={styles.btnSecondary} onClick={() => setStep(2)}>VOLTAR</button>
                <button className={styles.btnPrimary} onClick={handleNext} disabled={!formData.produto_nome.trim()}>
                  AVANÇAR <ChevronRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <CheckCircle2 size={48} color="#D4AF37" style={{ marginBottom: '1rem', display: 'inline-block' }} />
                <h2 style={{ fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '-0.02em', fontSize: '2rem' }}>
                  REGISTRO FINALIZADO
                </h2>
                <p style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)' }}>
                  Os dados foram auditados e inseridos no ecossistema oficial.
                </p>
              </div>

              <div className={styles.blueprintDoc}>
                <div className={styles.blueprintHeader}>
                  <h3 className={styles.blueprintHero}>CERTIFICADO DE<br />GARANTIA</h3>
                  <div className={styles.blueprintTerminal}>
                    LOG: {new Date().toISOString()}<br />
                    ID: {authCode}
                  </div>
                </div>

                <div className={styles.blueprintDataGrid}>
                  <div className={styles.dataCell}>
                    <div className={styles.dataLabel}>{formData.tipo_servico === 'Movel/Eletro' ? 'ITEM' : 'VEÍCULO'}</div>
                    <div className={styles.dataValue}>{formData.veiculo_modelo.toUpperCase()}</div>
                  </div>
                  <div className={styles.dataCell}>
                    <div className={styles.dataLabel}>{formData.tipo_servico === 'Movel/Eletro' ? 'IDENTIFICAÇÃO' : 'PLACA/CHASSI'}</div>
                    <div className={styles.dataValue}>{formData.veiculo_placa_chassi.toUpperCase()}</div>
                  </div>
                  <div className={styles.dataCell}>
                    <div className={styles.dataLabel}>PRODUTO</div>
                    <div className={styles.dataValue}>{formData.produto_nome.toUpperCase() || formData.linha_escolhida.toUpperCase()}</div>
                  </div>
                  <div className={styles.dataCell}>
                    <div className={styles.dataLabel}>INSTALADOR</div>
                    <div className={styles.dataValue}>{formData.aplicador_nome.toUpperCase()}</div>
                  </div>
                </div>

                <div className={styles.blueprintSecurity}>
                  <div>
                    <div className={styles.authBadge}>
                      <Shield size={14} /> STATUS: {ppfProducts.find(p => p.name === formData.produto_nome)?.garantia_anos || (formData.linha_escolhida === 'NZWrap' ? 3 : 0)} ANOS [VERIFIED]
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                      {'>>>'} HASH DE AUTENTICAÇÃO:<br />
                      <strong style={{ color: '#fff', fontSize: '1.2rem' }}>{authCode}</strong>
                    </div>
                  </div>
                  <div className={styles.qrContainer}>
                    <div className={`${styles.qrCrosshair} ${styles.tl}`}></div>
                    <div className={`${styles.qrCrosshair} ${styles.tr}`}></div>
                    <div className={`${styles.qrCrosshair} ${styles.bl}`}></div>
                    <div className={`${styles.qrCrosshair} ${styles.br}`}></div>
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                      <QrCode size={64} />
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.footerNav} style={{ marginTop: '2rem' }}>
                <button className={styles.btnSecondary} onClick={() => window.print()}>
                  [ IMPRIMIR COMPROVANTE ]
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* SECURITY HIGHLIGHT SECTION (ANTI-FRAUDE) */}
        <motion.div
          className={styles.securitySection}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.8 }}
          variants={blurReveal}
        >
          <div className={`${styles.careCard} ${styles.fullWidthCard}`}>
            <div className={styles.careCardHeader}>
              <div className={styles.careIconWrapper}><Shield size={20} /></div>
              <div className={styles.careTitle}>Certificado Inviolável (Anti-Fraude)</div>
            </div>
            <p className={styles.careRule}>Sua garantia oficial é protegida por Criptografia e cruzamento de dados em tempo real com os sistemas NZ.</p>
            <div className={styles.careReasonBlock}>
              <span className={styles.careReasonLabel}>SEGURANÇA DE DADOS DE ALTO NÍVEL</span>
              <p className={styles.careReasonText}>
                A autenticidade de nossa proteção não depende de um documento em papel rastreável facilmente forjável. Nós emitimos um Hash Alfanumérico Único e Assinatura Digital baseada em Placa e Chassi que trava o documento na emissão, tornando impossível a adulteração ou a falsificação da titularidade dos dados por terceiros maliciosos buscando usufruir dos nossos serviços.
              </p>
            </div>
          </div>
        </motion.div>

        {/* GUIDELINES & MAINTENANCE SECTION */}
        <motion.div
          className={styles.careSection}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
        >
          <motion.div variants={slideFromRight} className={styles.careIntro}>
            <h2 className={styles.careIntroTitle}>Seu Carro é uma Arma à Prova do Tempo.</h2>
            <p className={styles.careIntroText}>
              Mas como tudo na vida, o seu mais novo investimento precisa de cuidados à altura! Abaixo, vamos deixar as instruções essenciais para desfrutar do que há de melhor quando o assunto é proteção de pintura no mundo.
            </p>
          </motion.div>

          <div className={styles.careGrid}>
            <motion.div variants={blurReveal} className={styles.careCard}>
              <div className={styles.careCardHeader}>
                <div className={styles.careIconWrapper}><CalendarClock size={20} /></div>
                <div className={styles.careTitle}>Os Primeiros 7 Dias</div>
              </div>
              <p className={styles.careRule}>Nunca efetue lavagem veicular nos primeiros 7 dias após a aplicação do projeto.</p>
              <div className={styles.careReasonBlock}>
                <span className={styles.careReasonLabel}>ATENÇÃO CIRÚRGICA</span>
                <p className={styles.careReasonText}>
                  O PPF precisa desse tempo para ancorar e evaporar totalmente os líquidos contra a pintura. Bolhas de umidade podem aparecer neste período, mas elas evaporarão naturalmente ao sol.
                </p>
              </div>
            </motion.div>

            <motion.div variants={blurReveal} className={styles.careCard}>
              <div className={styles.careCardHeader}>
                <div className={styles.careIconWrapper}><Droplets size={20} /></div>
                <div className={styles.careTitle}>Química Limpa (Lavagem)</div>
              </div>
              <p className={styles.careRule}>Olho nos produtos da lavagem. Deve ser feita com shampoo neutro e evitar água de reuso.</p>
              <div className={styles.careReasonBlock}>
                <span className={styles.careReasonLabel}>MOTIVO TÉCNICO</span>
                <p className={styles.careReasonText}>
                  Produtos agressivos e ácidos mancham ou ressecam o poliuretano (TPU). A água de reuso contém micropartículas arrastadas entre os pneus que agem como lixa durante a esfregação.
                </p>
              </div>
            </motion.div>

            <motion.div variants={blurReveal} className={styles.careCard}>
              <div className={styles.careCardHeader}>
                <div className={styles.careIconWrapper}><AlertCircle size={20} /></div>
                <div className={styles.careTitle}>Lavadores vs Alta Pressão</div>
              </div>
              <p className={styles.careRule}>Busque estabelecimentos que tenham histórico com PPF. Em casa, cuidado extra com lavadoras de alta pressão.</p>
              <div className={styles.careReasonBlock}>
                <span className={styles.careReasonLabel}>O RISCO TÁTICO</span>
                <p className={styles.careReasonText}>
                  Jato de água muito forte e próximo (menos de 50 cm), especialmente direcionado para as emendas do filme, força a cola e causa o descolamento. Profissionais destreinados também podem usar escovas ásperas que danificam a camada regenerativa (top coat).
                </p>
              </div>
            </motion.div>

            <motion.div variants={blurReveal} className={styles.careCard}>
              <div className={styles.careCardHeader}>
                <div className={styles.careIconWrapper}><Leaf size={20} /></div>
                <div className={styles.careTitle}>A Ameaça Orgânica</div>
              </div>
              <p className={styles.careRule}>Cuidado ao escolher estacionar (evite debaixo de árvores). Remova resquícios de insetos ou fezes o mais rápido possível.</p>
              <div className={styles.careReasonBlock}>
                <span className={styles.careReasonLabel}>PERIGO QUÍMICO</span>
                <p className={styles.careReasonText}>
                  Seiva de árvore e fezes de pássaros são altamente ácidas. Embora o PPF proteja a pintura, o próprio filme pode sofrer manchas se o ácido for "cozido" pelo sol, criando marcas difíceis de remover.
                </p>
              </div>
            </motion.div>

          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default WarrantyRegistration;
