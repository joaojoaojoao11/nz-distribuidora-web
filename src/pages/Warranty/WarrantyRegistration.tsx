import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import styles from './WarrantyRegistration.module.css';
import { CheckCircle2, Shield, AlertCircle, ChevronRight, QrCode, CalendarClock, Droplets, Droplet, Leaf } from 'lucide-react';

const blurReveal = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } }
};

const slideFromRight = {
  hidden: { opacity: 0, x: 40, filter: 'blur(6px)' },
  visible: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 1, ease: [0.22, 1, 0.36, 1] } }
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.1 } }
};

interface WarrantyFormData {
  cliente_cpf: string;
  veiculo_placa_chassi: string;
  veiculo_modelo: string;
  aplicador_nome: string;
  data_aplicacao: string;
  linha_escolhida: 'NZWrap' | 'PPF' | '';
  produto_nome: string;
  tipo_servico: 'Total/Full' | 'Parcial' | '';
  areas_protegidas: string[];
}

const INITIAL_FORM: WarrantyFormData = {
  cliente_cpf: '',
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
  return `NZ-${dateFormatted.replace(/\//g,'')}-${cleanPlaca}-${hash}`;
}

const AVAILABLE_AREAS = [
  "Capô", "Teto", "Para-choque Dianteiro", "Para-choque Traseiro", 
  "Laterais", "Portas", "Para-lamas", "Retrovisores", "Faróis", "Interno"
];

const WarrantyRegistration = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<WarrantyFormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [ppfProducts, setPpfProducts] = useState<any[]>([]);

  React.useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase
        .from('web_catalog_products')
        .select('name, garantia_anos, durabilidade_anos')
        .eq('brand', 'NZPPF')
        .eq('is_active', true);
      if (data) {
        setPpfProducts(data);
      }
    }
    fetchProducts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
      if (!formData.cliente_cpf || !formData.veiculo_placa_chassi || !formData.data_aplicacao || !formData.aplicador_nome) {
        setErrorMsg('Preencha os campos obrigatórios.');
        return;
      }
    } else if (step === 2) {
      if (!formData.linha_escolhida) {
        setErrorMsg('Selecione uma linha de produto.');
        return;
      }
    }
    setErrorMsg('');
    setStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    if (!formData.tipo_servico) {
      setErrorMsg('Selecione o tipo de serviço.');
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
        cliente_cpf: formData.cliente_cpf.replace(/\D/g, ''), // Keep only numbers
        veiculo_placa_chassi: formData.veiculo_placa_chassi,
        veiculo_modelo: formData.veiculo_modelo,
        aplicador_nome: formData.aplicador_nome,
        data_aplicacao: formData.data_aplicacao,
        produto_nome: formData.produto_nome || formData.linha_escolhida,
        linha_escolhida: formData.linha_escolhida,
        tipo_servico: formData.tipo_servico,
        areas_protegidas: formData.tipo_servico === 'Total/Full' ? ["Veículo Completo"] : formData.areas_protegidas,
        codigo_autenticacao: code,
        garantia_anos: garantiaAnos,
        durabilidade_anos: durabilidadeAnos
      };

      const { error } = await supabase.from('garantias_nz').insert([payload]);

      if (error) {
        throw new Error(error.message);
      }

      setStep(4); // Certificate generated success
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
      <div className={styles.content}>
        
        {step < 4 && (
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
              Autentique sua garantia oficial e legitime seu patrimônio [ PASSO {step}/3 ]
            </motion.p>
          </motion.div>
        )}

        {errorMsg && (
          <div style={{ backgroundColor: 'rgba(230, 25, 25, 0.1)', border: '1px solid #E61919', color: '#E61919', padding: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} />
            <span style={{fontFamily: 'monospace', fontSize: '0.85rem'}}>{errorMsg}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
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
                <div className={styles.formGroup}>
                  <label className={styles.label}>Instalador Oficial / Loja</label>
                  <input className={styles.input} type="text" name="aplicador_nome" value={formData.aplicador_nome} onChange={handleChange} placeholder="Nome do Credenciado" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Placa ou Chassi</label>
                  <input className={styles.input} type="text" name="veiculo_placa_chassi" value={formData.veiculo_placa_chassi} onChange={handleChange} placeholder="ABC-1234" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Modelo do Veículo</label>
                  <input className={styles.input} type="text" name="veiculo_modelo" value={formData.veiculo_modelo} onChange={handleChange} placeholder="Ex: Porsche 911 Carrera" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Data da Aplicação</label>
                  <input className={styles.input} type="date" name="data_aplicacao" value={formData.data_aplicacao} onChange={handleChange} />
                </div>
              </div>
              <div className={styles.footerNav}>
                <button className={styles.btnPrimary} style={{marginLeft: 'auto'}} onClick={handleNext}>
                  AVANÇAR <ChevronRight size={16} style={{display:'inline', verticalAlign:'middle'}}/>
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
              <div className={styles.bentoGrid}>
                <div 
                  className={`${styles.bentoCard} ${formData.linha_escolhida === 'PPF' ? styles.bentoCardActive : ''}`}
                  onClick={() => setFormData({...formData, linha_escolhida: 'PPF', produto_nome: ''})}
                >
                  <div className={styles.bentoTitle} style={{ marginBottom: '1.5rem' }}>
                    <img src="/assets/simbolos/LOGO-NZPPF-BRANCO.svg" alt="NZ-PPF" style={{ height: '110px', opacity: formData.linha_escolhida === 'PPF' ? 1 : 0.6, transition: 'all 0.3s ease', filter: formData.linha_escolhida === 'PPF' ? 'brightness(0) invert(0)' : 'none' }} />
                  </div>
                  <div className={styles.bentoServiceText}>PPF</div>
                </div>
                <div 
                  className={`${styles.bentoCard} ${formData.linha_escolhida === 'NZWrap' ? styles.bentoCardActive : ''}`}
                  onClick={() => setFormData({...formData, linha_escolhida: 'NZWrap', produto_nome: ''})}
                >
                  <div className={styles.bentoTitle} style={{ marginBottom: '1.5rem' }}>
                    <img src="/assets/simbolos/LOGO-NZWRAP-BRANCO.svg" alt="NZWrap" style={{ height: '110px', opacity: formData.linha_escolhida === 'NZWrap' ? 1 : 0.6, transition: 'all 0.3s ease', filter: formData.linha_escolhida === 'NZWrap' ? 'brightness(0) invert(0)' : 'none' }} />
                  </div>
                  <div className={styles.bentoServiceText}>ENVELOPAMENTO</div>
                </div>
              </div>

              {formData.linha_escolhida && (
                <div className={styles.formGroup} style={{marginTop: '2rem'}}>
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
              )}

              <div className={styles.footerNav}>
                <button className={styles.btnSecondary} onClick={() => setStep(1)}>VOLTAR</button>
                <button className={styles.btnPrimary} disabled={!formData.linha_escolhida || !formData.produto_nome.trim()} onClick={handleNext}>
                  AVANÇAR <ChevronRight size={16} style={{display:'inline', verticalAlign:'middle'}}/>
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
              <div className={styles.serviceTypeGrid}>
                <button 
                  className={`${styles.serviceBtn} ${formData.tipo_servico === 'Total/Full' ? styles.serviceBtnActive : ''}`}
                  onClick={() => setFormData({...formData, tipo_servico: 'Total/Full', areas_protegidas: []})}
                >
                  <Shield size={24} style={{marginBottom: '0.5rem'}}/>
                  <br/>
                  Total / Full
                </button>
                <button 
                  className={`${styles.serviceBtn} ${formData.tipo_servico === 'Parcial' ? styles.serviceBtnActive : ''}`}
                  onClick={() => setFormData({...formData, tipo_servico: 'Parcial'})}
                >
                  [+]<br/>
                  Parcial Frontal / Kit
                </button>
              </div>

              {formData.tipo_servico === 'Parcial' && (
                <div style={{marginTop: '2rem'}}>
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
                <button className={styles.btnSecondary} onClick={() => setStep(2)}>VOLTAR</button>
                <button className={styles.btnPrimary} onClick={handleSubmit} disabled={loading || !formData.tipo_servico}>
                  {loading ? 'PROCESSANDO...' : 'EMITIR CERTIFICADO OFICIAL'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div style={{textAlign: 'center', marginBottom: '2rem'}}>
                <CheckCircle2 size={48} color="#D4AF37" style={{marginBottom: '1rem', display: 'inline-block'}}/>
                <h2 style={{fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '-0.02em', fontSize: '2rem'}}>
                  REGISTRO FINALIZADO
                </h2>
                <p style={{fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)'}}>
                  Os dados foram auditados e inseridos no ecossistema oficial.
                </p>
              </div>

              <div className={styles.blueprintDoc}>
                <div className={styles.blueprintHeader}>
                  <h3 className={styles.blueprintHero}>CERTIFICADO DE<br/>GARANTIA</h3>
                  <div className={styles.blueprintTerminal}>
                    LOG: {new Date().toISOString()}<br/>
                    ID: {authCode}
                  </div>
                </div>

                <div className={styles.blueprintDataGrid}>
                  <div className={styles.dataCell}>
                    <div className={styles.dataLabel}>VEÍCULO</div>
                    <div className={styles.dataValue}>{formData.veiculo_modelo.toUpperCase()}</div>
                  </div>
                  <div className={styles.dataCell}>
                    <div className={styles.dataLabel}>PLACA/CHASSI</div>
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
                    <div style={{fontFamily: 'monospace', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)'}}>
                      {'>>>'} HASH DE AUTENTICAÇÃO:<br/>
                      <strong style={{color: '#fff', fontSize: '1.2rem'}}>{authCode}</strong>
                    </div>
                  </div>
                  <div className={styles.qrContainer}>
                    <div className={`${styles.qrCrosshair} ${styles.tl}`}></div>
                    <div className={`${styles.qrCrosshair} ${styles.tr}`}></div>
                    <div className={`${styles.qrCrosshair} ${styles.bl}`}></div>
                    <div className={`${styles.qrCrosshair} ${styles.br}`}></div>
                    <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000'}}>
                      <QrCode size={64}/>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.footerNav} style={{marginTop: '2rem'}}>
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
