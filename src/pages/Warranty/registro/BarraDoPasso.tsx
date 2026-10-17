// Barra fixa do celular: voltar, o que já foi escolhido e o botão do passo.
// Tocar no resumo abre a prévia do certificado numa folha de baixo para cima,
// que fecha no X, no fundo, no "voltar" do celular ou puxando a alça para baixo.
//
// Vai por portal direto no <body>: dentro de um ancestral com `transform`
// (a animação de troca de passo) ou `backdrop-filter`, `position: fixed`
// passa a contar a partir dele e a barra sai do rodapé — foi o que aconteceu
// com o painel do carrinho.

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronUp, X } from 'lucide-react';
import Certificado, { type DadosCertificado } from '../Certificado';
import { closeModal, useModalLock } from '../../../hooks/useModalLock';
import { useBarraFixa } from '../../../hooks/useBarraFixa';
import styles from './Registro.module.css';

interface Props {
  rotuloPasso: string;
  resumo: string;
  onVoltar?: () => void;
  acao?: { rotulo: string; onClick: () => void; carregando?: boolean } | null;
  previa: DadosCertificado | null;
}

/** Quanto puxar a alça para baixo para a folha fechar. */
const LIMIAR_FECHAR = 90;

export default function BarraDoPasso({ rotuloPasso, resumo, onVoltar, acao, previa }: Props) {
  const [aberta, setAberta] = useState(false);
  const [arrasto, setArrasto] = useState(0);
  const inicio = useRef<number | null>(null);
  const fecharDireto = () => {
    setAberta(false);
    setArrasto(0);
  };
  const fechar = () => closeModal(fecharDireto);
  // Formulário: o botão do WhatsApp some enquanto a barra existe — subindo,
  // ele caía em cima dos campos.
  useBarraFixa(true, 'ocultar');
  useModalLock(aberta, fecharDireto);

  const puxar = {
    onTouchStart: (e: React.TouchEvent) => {
      inicio.current = e.touches[0]?.clientY ?? null;
    },
    onTouchMove: (e: React.TouchEvent) => {
      if (inicio.current == null) return;
      setArrasto(Math.max(0, (e.touches[0]?.clientY ?? 0) - inicio.current));
    },
    onTouchEnd: () => {
      inicio.current = null;
      if (arrasto > LIMIAR_FECHAR) fechar();
      else setArrasto(0);
    },
  };

  return createPortal(
    <>
      <div className={styles.barra}>
        {onVoltar && (
          <button type="button" className={styles.barraVoltar} onClick={onVoltar} aria-label="Voltar um passo">
            <ChevronLeft size={22} />
          </button>
        )}
        <button
          type="button"
          className={styles.barraResumo}
          onClick={() => setAberta(true)}
          disabled={!previa}
          aria-label={previa ? `${rotuloPasso}. ${resumo}. Ver prévia do certificado` : undefined}
        >
          <span className={styles.barraPasso}>{rotuloPasso}</span>
          <span className={styles.barraProduto}>
            <span>{resumo}</span>
            {previa && <ChevronUp size={15} aria-hidden="true" />}
          </span>
        </button>
        {acao && (
          <button type="button" className={styles.primario} onClick={acao.onClick} disabled={acao.carregando}>
            {acao.rotulo}
          </button>
        )}
      </div>

      {aberta && previa && (
        <>
          <div className={styles.fundo} onClick={fechar} aria-hidden="true" />
          <div
            className={styles.folha}
            role="dialog"
            aria-modal="true"
            aria-label="Prévia do certificado"
            style={arrasto ? { transform: `translateY(${arrasto}px)`, transition: 'none' } : undefined}
          >
            <div className={styles.folhaAlca} {...puxar} aria-hidden="true">
              <span />
            </div>
            <div className={styles.folhaTopo} {...puxar}>
              <p className={styles.lateralRotulo}>Prévia do certificado</p>
              <button type="button" className={styles.folhaFechar} onClick={fechar} aria-label="Fechar prévia">
                <X size={20} />
              </button>
            </div>
            <Certificado dados={previa} compacto />
          </div>
        </>
      )}
    </>,
    document.body
  );
}
