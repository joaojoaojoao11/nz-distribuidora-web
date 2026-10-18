// O certificado oficial de garantia em PDF e a etiqueta de envio.
//
// CÓDIGO CONGELADO: é o mesmo gerador do Admin antigo (commit 7410907, antes
// do d842bf0), linha por linha, para sair o MESMO arquivo de sempre — o
// modelo é o Certificado_NZ_NZ-09102026-UJF7F64-NC5LD.pdf do João.
// Não mude o layout, os textos, a data, as posições nem o nome do arquivo sem
// o João pedir aquela mudança específica (memória: feedback_layout_impressao_autorizacao).

import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

/** Os campos de garantias_nz que o PDF e a etiqueta usam. */
export interface CertificadoPdf {
  cliente_cpf: string;
  cliente_nome_completo: string;
  cliente_telefone?: string;
  cliente_cidade?: string;
  cliente_estado?: string;
  cliente_cep?: string;
  cliente_endereco?: string;
  cliente_numero?: string;
  cliente_complemento?: string;
  cliente_bairro?: string;
  veiculo_placa_chassi: string;
  veiculo_modelo: string;
  aplicador_nome: string;
  data_aplicacao: string;
  linha_escolhida: string;
  produto_nome: string;
  tipo_servico: string;
  codigo_autenticacao: string;
  garantia_anos: number;
  durabilidade_anos: number;
  areas_protegidas?: string[];
}

export async function gerarCertificadoPdf(warranty: CertificadoPdf) {
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

  // ROW 1: PROPRIETÁRIO (DESTAQUE MÁXIMO)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text('PROPRIETÁRIO DO VEÍCULO', 20, 65);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(212, 175, 55); // Destaque Ouro NZ
  doc.text(warranty.cliente_nome_completo ? warranty.cliente_nome_completo.toUpperCase() : 'NÃO INFORMADO', 20, 73);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text(`DOCUMENTO REGISTRADO: ${warranty.cliente_cpf}`, 20, 79);

  // ROW 2: INFO VEÍCULO E PRODUTO
  drawLabelValue('VEÍCULO (MODELO)', warranty.veiculo_modelo.toUpperCase(), 20, 95);
  drawLabelValue('PLACA / CHASSI', warranty.veiculo_placa_chassi.toUpperCase(), 110, 95);
  drawLabelValue('PRODUTO / LINHA', (warranty.produto_nome || warranty.linha_escolhida).toUpperCase(), 180, 95);
  
  // ROW 3: INSTALADOR E SERVICO
  drawLabelValue('ESTÚDIO APLICADOR OFICIAL', warranty.aplicador_nome.toUpperCase(), 20, 115);
  drawLabelValue('DATA DE APLICAÇÃO', new Date(warranty.data_aplicacao).toLocaleDateString('pt-BR'), 180, 115);

  let servicoText = warranty.tipo_servico.toUpperCase();
  if (warranty.tipo_servico.toUpperCase() === 'PARCIAL' && warranty.areas_protegidas && warranty.areas_protegidas.length > 0) {
    servicoText += ` (${warranty.areas_protegidas.join(', ')})`.toUpperCase();
  }
  
  let servicoFontSize = 14;
  if (servicoText.length > 30) servicoFontSize = 10;
  if (servicoText.length > 50) servicoFontSize = 8;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text('TIPO DE SERVIÇO / COBERTURA', 110, 115);
  doc.setFontSize(servicoFontSize);
  doc.setTextColor(255, 255, 255);
  const splitServico = doc.splitTextToSize(servicoText, 65);
  doc.text(splitServico, 110, 122);

  // Dynamic Warranty Terms Text
  const termsTitle = 'TERMOS DE COBERTURA OFICIAL';
  
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
  doc.text(termsTitle, 20, 142);
  
  doc.setFontSize(10);
  doc.setTextColor(180, 180, 180);
  doc.text(termsText, 20, 148, { maxWidth: 250, lineHeightFactor: 1.5 });

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
  return doc.output('blob');
}

export function gerarEtiquetaEnvio(warranty: CertificadoPdf) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4' 
  });

  // Outer Box for cutting (100x150 mm Thermal Label Ratio)
  doc.setLineWidth(0.5);
  doc.rect(5, 5, 100, 150);

  // Header - Remetente
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('REMETENTE (SENDER)', 10, 15);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('NZ DISTRIBUIDORA DE ADESIVOS LTDA', 10, 21);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('RUA FELIX ALVINO DA SILVA - 65', 10, 26);
  doc.text('VILA DO CONDE - BARUERI - SP', 10, 31);
  doc.text('CEP: 06445-140', 10, 36);

  doc.line(5, 42, 105, 42); // Line separator

  // Body - Destinatario
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('DESTINATÁRIO (RECEIVER)', 10, 48);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const nomeDest = doc.splitTextToSize(warranty.cliente_nome_completo?.toUpperCase() || 'N/A', 90);
  doc.text(nomeDest, 10, 56);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  let startY = 56 + (nomeDest.length * 6);
  
  const enderecoFormatado = `${warranty.cliente_endereco || ''}, ${warranty.cliente_numero || ''} ${warranty.cliente_complemento ? '- ' + warranty.cliente_complemento : ''}`;
  const endArr = doc.splitTextToSize(enderecoFormatado.toUpperCase(), 90);
  doc.text(endArr, 10, startY);
  startY += (endArr.length * 5);

  doc.text(`BAIRRO: ${warranty.cliente_bairro?.toUpperCase() || 'N/A'}`, 10, startY);
  startY += 6;
  doc.text(`${warranty.cliente_cidade?.toUpperCase()} - ${warranty.cliente_estado?.toUpperCase()}`, 10, startY);
  startY += 6;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`CEP: ${warranty.cliente_cep || 'N/A'}`, 10, startY + 4);

  if (warranty.cliente_telefone) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`TEL: ${warranty.cliente_telefone}`, 10, startY + 14);
  }

  doc.save(`Etiqueta_Envio_NZ_${warranty.codigo_autenticacao}.pdf`);
}
