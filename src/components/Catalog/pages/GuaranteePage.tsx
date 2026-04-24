import CatalogPage from '../CatalogPage';
import styles from '../Catalog.module.css';
import { safeSpacing, sanitizeCatalogText } from '../textHelpers';

interface GuaranteePageProps {
  qrDataUrl: string;
}

const certFields = [
  { label: 'PROPRIETÁRIO',          value: 'NOME DO CLIENTE' },
  { label: 'CPF',                   value: '000.000.000-00' },
  { label: 'VEÍCULO',               value: 'MODELO / PLACA' },
  { label: 'LINHA APLICADA',        value: 'NZPPF LUXURY GLOSS', accent: true },
  { label: 'APLICADOR CERTIFICADO', value: 'NZ STUDIO OFICIAL' },
  { label: 'DATA DE APLICAÇÃO',     value: '00 / 00 / 0000' }
];

export default function GuaranteePage({ qrDataUrl }: GuaranteePageProps) {
  return (
    <CatalogPage pageNumber={12}>
      <div className={styles.safeArea}>
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.pageSection}>12  ·  GARANTIA OFICIAL</div>
            <div className={styles.h2} style={{ marginTop: 16 }}>
              NOSSA<br />
              <span style={{ color: '#D4AF37' }}>GARANTIA.</span>
            </div>
          </div>
          <div className={styles.darkBadge}>ANTI-FRAUDE · CRIPTOGRAFADO</div>
        </div>

        <p className={styles.body} style={{ maxWidth: 1300, marginTop: 16 }}>
          {safeSpacing('Cada aplicação NZ PPF gera um certificado oficial criptografado, validado em tempo real no nosso sistema. Garantia rastreável, transferível e protegida contra falsificação.')}
        </p>

        <div className={styles.certBlock}>
          <div className={styles.certHead}>
            <div>
              <div className={styles.certTitle}>
                {'CERTIFICADO OFICIAL DE GARANTIA'}
              </div>
              <div className={styles.certSubtitle}>NZPPF  ·  REGISTRO ÚNICO</div>
            </div>
            <div className={styles.seal}>SELO<br />OFICIAL</div>
          </div>

          <div className={styles.certFields}>
            {certFields.map((f) => (
              <div key={f.label} className={styles.certField}>
                <div className={styles.fieldLabel}>{sanitizeCatalogText(f.label)}</div>
                <div className={styles.fieldValue} style={f.accent ? { color: '#D4AF37' } : undefined}>
                  {sanitizeCatalogText(f.value)}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.certFooter}>
            <div className={styles.certCode}>
              CÓDIGO DE AUTENTICAÇÃO
              <strong>NZ-XXXXXX-XXXXXX</strong>
            </div>
            <div className={styles.certQr}>
              {qrDataUrl ? <img src={qrDataUrl} alt="QR Code" /> : null}
            </div>
          </div>
        </div>
      </div>
    </CatalogPage>
  );
}
