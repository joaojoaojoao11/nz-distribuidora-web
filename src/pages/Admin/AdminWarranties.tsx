import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import styles from './Admin.module.css';

interface Warranty {
  id: string;
  cliente_cpf: string;
  veiculo_placa_chassi: string;
  veiculo_modelo: string;
  aplicador_nome: string;
  data_aplicacao: string;
  linha_escolhida: string;
  produto_nome: string;
  tipo_servico: string;
  codigo_autenticacao: string;
  certificado_gerado: boolean;
  data_geracao?: string;
  garantia_anos: number;
  durabilidade_anos: number;
  areas_protegidas?: string[];
  created_at: string;
}

export default function AdminWarranties({ onUpdate }: { onUpdate?: () => void }) {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWarranties();
  }, []);

  const loadWarranties = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('garantias_nz')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setWarranties(data as Warranty[]);
    setLoading(false);
  };

  const generateCertificatePDF = async (warranty: Warranty) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Background
    doc.setFillColor(15, 15, 17); // tactical dark
    doc.rect(0, 0, 297, 210, 'F');

    // Inner Border
    doc.setDrawColor(212, 175, 55); // Gold
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 277, 190);
    
    // Header text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text('CERTIFICADO OFICIAL DE GARANTIA', 20, 30);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(180, 180, 180);
    doc.text('NZ DISTRIBUIDORA E IMPORTADORA LTDA | SISTEMA DE AUTENTICAÇÃO E RASTREABILIDADE', 20, 38);

    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.2);
    doc.line(20, 48, 277, 48);

    // Grid details
    const drawLabelValue = (label: string, value: string, x: number, y: number) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      doc.text(label, x, y);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      // Limit length or generic text wrap if needed, but these are short
      doc.text(value, x, y + 7);
    };

    drawLabelValue('CLIENTE (CPF / CNPJ)', warranty.cliente_cpf, 20, 65);
    drawLabelValue('PLACA / CHASSI', warranty.veiculo_placa_chassi.toUpperCase(), 110, 65);
    drawLabelValue('VEÍCULO (MODELO)', warranty.veiculo_modelo.toUpperCase(), 180, 65);

    drawLabelValue('PRODUTO / LINHA', (warranty.produto_nome || warranty.linha_escolhida).toUpperCase(), 20, 90);
    
    let servicoText = warranty.tipo_servico.toUpperCase();
    if (warranty.tipo_servico.toUpperCase() === 'PARCIAL' && warranty.areas_protegidas && warranty.areas_protegidas.length > 0) {
      servicoText += ` (${warranty.areas_protegidas.join(', ')})`.toUpperCase();
    }
    
    // Auto-adjust font size for very long partial areas
    let servicoFontSize = 14;
    if (servicoText.length > 30) servicoFontSize = 10;
    if (servicoText.length > 50) servicoFontSize = 8;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text('TIPO DE SERVIÇO', 110, 90);
    doc.setFontSize(servicoFontSize);
    doc.setTextColor(255, 255, 255);
    // Use doc.splitTextToSize to handle multiple lines if it gets huge, but let's just shrink font for now or wrap.
    const splitServico = doc.splitTextToSize(servicoText, 65);
    doc.text(splitServico, 110, 97);

    drawLabelValue('DATA DE APLICAÇÃO', new Date(warranty.data_aplicacao).toLocaleDateString('pt-BR'), 180, 90);

    drawLabelValue('APLICADOR OFICIAL / ESTÚDIO', warranty.aplicador_nome.toUpperCase(), 20, 115);

    // Dynamic Warranty Terms Text
    let termsTitle = 'TERMOS DE COBERTURA OFICIAL';
    
    // Fallbacks just in case the data is old or missing
    const garAnos = warranty.garantia_anos || 0;
    const durAnos = warranty.durabilidade_anos || 0;
    
    let termsText = '';

    if (warranty.linha_escolhida.toUpperCase() === 'NZWRAP') {
      termsText = `Garantia oficial NZWrap contra defeitos de fabricação. Cobertura válida por ${garAnos || 3} ANOS a partir da data de aplicação, sujeita às avaliações técnicas e manutenções preventivas corretas. Expectativa de durabilidade: ${durAnos || 5} ANOS.`;
    } else {
      termsText = `Garantia Autêntica NZPPF: ${garAnos} ANOS de cobertura oficial contra amarelamento precoce, delaminação e rachaduras estruturais sob condições normais de uso. Expectativa de Vida Útil e Durabilidade: ${durAnos} ANOS, desde que preservadas as manutenções trimestrais exigidas e excluindo polimentos agressivos.`;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(212, 175, 55);
    doc.text(termsTitle, 20, 137);
    
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 180);
    doc.text(termsText, 20, 143, { maxWidth: 250, lineHeightFactor: 1.5 });

    // Auth box
    doc.setFillColor(25, 25, 28);
    doc.rect(20, 160, 257, 30, 'F');
    doc.setDrawColor(50, 50, 50);
    doc.rect(20, 160, 257, 30);
    
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('HASH DE ATIVAÇÃO / CÓDIGO DE SEGURANÇA ÚNICO:', 25, 170);
    
    doc.setFont('courier', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(212, 175, 55); // Gold highlight
    doc.text(warranty.codigo_autenticacao, 25, 182);

    try {
      const validationUrl = `${window.location.origin}/validar-garantia?id=${warranty.codigo_autenticacao}`;
      const qrDataUrl = await QRCode.toDataURL(validationUrl, {
        errorCorrectionLevel: 'H',
        margin: 0,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      doc.addImage(qrDataUrl, 'PNG', 236, 161, 28, 28);
    } catch (qrErr) {
      console.error("Erro ao gerar QR Code:", qrErr);
    }

    try {
      const logoUrl = warranty.linha_escolhida.toUpperCase() === 'NZWRAP' 
        ? '/assets/simbolos/LOGO-NZWRAP-BRANCO.svg' 
        : '/assets/simbolos/LOGO-NZPPF-BRANCO.svg';

      const img = new Image();
      img.crossOrigin = 'Anonymous';
      await new Promise<void>((resolve) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 1080;
          canvas.height = 1080;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            // Posiciona a logo no lado superior direito, grande.
            // A largura total da border é 287mm. x=230, y=10.
            doc.addImage(dataUrl, 'PNG', 230, 8, 52, 52);
          }
          resolve();
        };
        img.onerror = () => resolve(); // resolve silently to not break download
        img.src = logoUrl;
      });
    } catch(e) {
      console.error('Falha ao carregar a logo para o PDF', e);
    }

    doc.save(`Certificado_NZ_${warranty.codigo_autenticacao}.pdf`);
  };

  const handleGenerateCertificate = async (warrantyItem: Warranty) => {
    const generatedDate = new Date().toISOString();
    const { error } = await supabase
      .from('garantias_nz')
      .update({ certificado_gerado: true, data_geracao: generatedDate })
      .eq('id', warrantyItem.id);

    if (error) {
      alert('Erro ao marcar certificado como gerado: ' + error.message);
      return;
    }

    // Gerar e baixar PDF (atualiza a data localmente para envio no pdf tbm se preciso)
    const updatedWarranty = {...warrantyItem, certificado_gerado: true, data_geracao: generatedDate};
    await generateCertificatePDF(updatedWarranty);
    
    // Atualiza a tabela
    loadWarranties();
    if (onUpdate) onUpdate();
  };

  const handleDownloadPDF = async (warrantyItem: Warranty) => {
    await generateCertificatePDF(warrantyItem);
  };

  const handleDeleteCertificate = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja EXCLUIR / NEGAR este registro de garantia? Esta ação apagará permanentemente o registro.')) {
      return;
    }
    const { error } = await supabase
      .from('garantias_nz')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Erro ao excluir garantia: ' + error.message);
      return;
    }
    
    // Atualiza a tabela
    loadWarranties();
    if (onUpdate) onUpdate();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  return (
    <div className={styles.tableSection}>
      <p className={styles.tabDescription}>
        Gerenciamento de Garantias Oficiais e emissão de Certificados via painel tático.
      </p>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Carregando dados...</div>
      ) : (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente (CPF)</th>
                <th>Veículo</th>
                <th>Placa</th>
                <th>Aplicador</th>
                <th>Código (Hash)</th>
                <th>Emissão (PDF)</th>
                <th>Status</th>
                <th>Ações</th>
                <th>Gerenciar</th>
              </tr>
            </thead>
            <tbody>
              {warranties.map(w => (
                <tr key={w.id}>
                  <td>{formatDate(w.data_aplicacao)}</td>
                  <td>{w.cliente_cpf}</td>
                  <td>{w.veiculo_modelo}</td>
                  <td>{w.veiculo_placa_chassi}</td>
                  <td>{w.aplicador_nome}</td>
                  <td style={{ fontFamily: 'monospace', color: '#D4AF37' }}>{w.codigo_autenticacao}</td>
                  <td style={{ color: w.data_geracao ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                    {w.data_geracao ? new Date(w.data_geracao).toLocaleString('pt-BR') : '-'}
                  </td>
                  <td>
                    {w.certificado_gerado ? (
                      <span className={`${styles.badge} ${styles.badgeApproved}`}>Emitido</span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgePending}`}>Pendente</span>
                    )}
                  </td>
                  <td>
                    {!w.certificado_gerado ? (
                      <button 
                        className={`${styles.actionBtn}`} 
                        style={{ backgroundColor: '#D4AF37', color: '#000', fontWeight: 'bold' }}
                        onClick={() => handleGenerateCertificate(w)}
                      >
                        ⚡ GERAR CERTIFICADO
                      </button>
                    ) : (
                      <button 
                        className={`${styles.actionBtn}`} 
                        style={{ backgroundColor: '#2ba84a', color: '#fff', fontWeight: 'bold' }}
                        onClick={() => handleDownloadPDF(w)}
                      >
                        ⬇ BAIXAR CERTIFICADO
                      </button>
                    )}
                  </td>
                  <td>
                    <button 
                      className={`${styles.actionBtn}`} 
                      style={{ backgroundColor: '#9e1a1a', color: '#fff', fontWeight: 'bold' }}
                      onClick={() => handleDeleteCertificate(w.id)}
                    >
                      ✖ EXCLUIR
                    </button>
                  </td>
                </tr>
              ))}
              {warranties.length === 0 && (
                <tr>
                  <td colSpan={10} className={styles.emptyState}>Nenhuma garantia registrada no momento.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
