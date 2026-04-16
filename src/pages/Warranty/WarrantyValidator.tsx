import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ShieldCheck, ShieldAlert, BadgeInfo, Building2, Calendar, FileText, ChevronLeft } from 'lucide-react';
import styles from './WarrantyValidator.module.css';

interface ValidatorWarrantyData {
  id: string;
  cliente_cpf: string;
  veiculo_modelo: string;
  veiculo_placa_chassi: string;
  aplicador_nome: string;
  data_aplicacao: string;
  produto_nome: string;
  linha_escolhida: string;
  tipo_servico: string;
  areas_protegidas: string[];
  garantia_anos: number;
  durabilidade_anos: number;
}

export default function WarrantyValidator() {
  const [searchParams] = useSearchParams();
  const authCode = searchParams.get('id');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ValidatorWarrantyData | null>(null);

  useEffect(() => {
    async function verifyHash() {
      if (!authCode) {
        setLoading(false);
        return;
      }

      const { data: result, error } = await supabase
        .from('garantias_nz')
        .select('*')
        .eq('codigo_autenticacao', authCode)
        .single();

      if (!error && result) {
        setData(result);
      }
      setLoading(false);
    }
    verifyHash();
  }, [authCode]);

  // Função para ofuscar CPF mantendo apenas últimos 2 dígitos finais visualizáveis e o resto trocado.
  // Exemplo: 462.282.318-71 vira ***.***.***-71  ou ********71
  const maskCpf = (cpfStr: string) => {
    if (!cpfStr) return '***.***.***-**';
    const clean = cpfStr.replace(/\D/g, '');
    if (clean.length === 11) {
      return `***.***.***-${clean.substring(9, 11)}`;
    } else if (clean.length === 14) {
      // CNPJ handling
      return `**.***.***/****-${clean.substring(12, 14)}`;
    }
    return `***.***.***-**`;
  };

  const getCardStyle = () => {
    if (loading) return styles.pendingBorder;
    if (data) return styles.validBorder;
    return styles.invalidBorder;
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        
        <div className={styles.logoWrapper}>
          <img src="https://ioioiycmyctllqgntrct.supabase.co/storage/v1/object/public/system-assets/NZ-BRANCO.png" alt="NZ Distribuidora" className={styles.logo} />
        </div>

        <div className={`${styles.card} ${getCardStyle()}`}>
          {loading ? (
            <div className={styles.statusHeader}>
              <div className={styles.scannerRing}></div>
              <h2 className={`${styles.statusTitle} ${styles.pending}`}>ACESSANDO MAINFRAME...</h2>
              <p className={styles.statusDesc}>Rastreando código e certificando assinatura digital hash do documento no servidor.</p>
            </div>
          ) : data ? (
            <>
              <div className={styles.statusHeader}>
                <div className={`${styles.statusIcon} ${styles.valid}`}>
                  <ShieldCheck size={32} />
                </div>
                <h2 className={`${styles.statusTitle} ${styles.valid}`}>CERTIFICADO VERIFICADO</h2>
                <p className={styles.statusDesc}>
                  A proteção deste veículo se encontra <strong>oficialmente autenticada e homologada</strong> no ecossistema da NZ Distribuidora.
                </p>
              </div>

              <div className={styles.dataGrid}>
                <div className={styles.dataRow}>
                  <div className={styles.dataLabel}>PROPRIETÁRIO OFUSCADO</div>
                  <div className={styles.dataValue}>{maskCpf(data.cliente_cpf)}</div>
                </div>

                <div className={styles.dataRow}>
                  <div className={styles.dataLabel}>VEÍCULO REGISTRADO</div>
                  <div className={styles.dataValue}>
                    {data.veiculo_modelo.toUpperCase()} <br/>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
                      PLACA/CHASSI: {data.veiculo_placa_chassi.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className={styles.dataRow}>
                  <div className={styles.dataLabel}>MATERIAL APLICADO</div>
                  <div className={styles.dataValue}>
                    {data.produto_nome.toUpperCase()} <br/>
                    <span style={{ fontSize: '0.8rem', color: '#D4AF37' }}>
                      {data.tipo_servico === 'Total/Full' ? 'COBERTURA FULL' : `COBERTURA PARCIAL (${(data.areas_protegidas || []).join(', ')})`}
                    </span>
                  </div>
                </div>

                <div className={styles.dataRow}>
                  <div className={styles.dataLabel}>DADOS DE ORIGEM</div>
                  <div className={styles.dataValue}>
                    <Building2 size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    {data.aplicador_nome.toUpperCase()} <br/>
                    <Calendar size={14} style={{ display: 'inline', marginRight: '6px', marginTop: '6px' }} />
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)'}}>Emitido: {new Date(data.data_aplicacao).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                <div className={styles.dataRow}>
                  <div className={styles.dataLabel}>STATUS DA GARANTIA</div>
                  <div className={styles.dataValue}>
                    <strong>{data.garantia_anos || (data.linha_escolhida === 'NZWrap' ? 3 : 0)} ANOS</strong>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block' }}>
                      Expectativa de Vida Útil: {data.durabilidade_anos || (data.linha_escolhida === 'NZWrap' ? 5 : 0)} ANOS
                    </span>
                  </div>
                </div>

              </div>
              
              <div className={styles.hashDisplay}>
                HASH ID: {data.codigo_autenticacao}
              </div>
            </>
          ) : (
            <div className={styles.statusHeader}>
              <div className={`${styles.statusIcon} ${styles.invalid}`}>
                <ShieldAlert size={32} />
              </div>
              <h2 className={`${styles.statusTitle} ${styles.invalid}`}>REGISTRO INEXISTENTE</h2>
              <p className={styles.statusDesc}>
                O Código Hash informado <strong>({authCode})</strong> não foi localizado no servidor Master da NZ Distribuidora. 
                Este certificado eletrônico não possui valor perante a matriz ou pode ter sido adulterado. Em caso de dúvidas contate o emissor.
              </p>
            </div>
          )}

          <button className={styles.actionButton} onClick={() => navigate('/')}>
            <ChevronLeft size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            VOLTAR AO SITE NZ
          </button>
        </div>

      </div>
    </div>
  );
}
