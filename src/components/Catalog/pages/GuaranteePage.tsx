import CatalogPage from '../CatalogPage';
import styles from '../Catalog.module.css';
import {
  usePageScale,
  useElementHidden,
} from '../useCatalogOverrides';
import EditableText from '../EditableText';
import { catalogMeta } from '../data/catalogData';

const PAGE_ID = 'guarantee';

interface GuaranteePageProps {
  qrDataUrl: string;
  pageNumber?: number;
  totalPages?: number;
}

/* ─── Conteúdo editorial ─────────────────────────────────────────────
   Substitui o antigo "modelo de certificado" (placeholders genéricos)
   por blocos que vendem a garantia: o que cobre, prazo por linha e
   o compromisso da marca. Cada item é editável via PageEditor.        */

const COVERAGE = [
  {
    title: 'AMARELAMENTO',
    desc: 'Perda de transparência por UV ou tempo. Cobertura total dentro do prazo.',
  },
  {
    title: 'DESCOLAMENTO',
    desc: 'Reaplicação sem custo se a borda soltar antes do fim da garantia.',
  },
  {
    title: 'TRINCAS E MANCHAS',
    desc: 'Defeito de fabricação coberto integralmente. Sem perícia.',
  },
  {
    title: 'DESLAMINAÇÃO',
    desc: 'Separação entre camadas resulta em substituição completa do filme.',
  },
];

const WARRANTY_TIERS = [
  { years: '12', name: 'LUXURY GLOSS' },
  { years: '10', name: 'PRIME GLOSS' },
  { years: '10', name: 'HEADLIGHT' },
  { years: '4',  name: 'FLOW GLOSS' },
  { years: '3',  name: 'CORE GLOSS' },
  { years: '2',  name: 'WINDSHIELD' },
];

const COMMITMENTS = [
  {
    title: 'TRANSFERÍVEL',
    desc: 'Acompanha o veículo. Se vender o carro, a garantia segue junto.',
  },
  {
    title: 'RASTREÁVEL',
    desc: 'Cada aplicação tem código único registrado e auditável.',
  },
  {
    title: 'SEM LETRAS MIÚDAS',
    desc: 'O que está no contrato vale. O que não está, não está.',
  },
];

export default function GuaranteePage({ qrDataUrl, pageNumber = 17, totalPages }: GuaranteePageProps) {
  const scale = usePageScale(PAGE_ID);
  const qrLabelHidden = useElementHidden(PAGE_ID, 'qr.label');
  const qrUrlHidden = useElementHidden(PAGE_ID, 'qr.url');

  return (
    <CatalogPage
      pageNumber={pageNumber}
      totalPages={totalPages}
      pageId={PAGE_ID}
      style={{ ['--user-scale' as string]: scale }}
    >
      <div className={styles.safeArea}>
        <div className={styles.pageHeader}>
          <div>
            <EditableText
              pageId={PAGE_ID}
              fieldKey="pageSection"
              defaultValue="12  ·  GARANTIA OFICIAL"
              as="div"
              className={styles.pageSection}
            />
            <div className={styles.h2} style={{ marginTop: 16 }}>
              <EditableText pageId={PAGE_ID} fieldKey="h2.l1" defaultValue="NOSSA" />
              <br />
              <EditableText
                pageId={PAGE_ID}
                fieldKey="h2.l2"
                defaultValue="GARANTIA."
                style={{ color: '#D4AF37' }}
              />
            </div>
          </div>
          <EditableText
            pageId={PAGE_ID}
            fieldKey="badge"
            defaultValue="COBERTURA OFICIAL NZ"
            as="div"
            className={styles.darkBadge}
          />
        </div>

        <EditableText
          pageId={PAGE_ID}
          fieldKey="intro"
          defaultValue="Garantia que vive na rua, não no papel. Cada NZPPF é registrado com código único — proteção que segue o carro, não o cliente."
          as="p"
          className={styles.body}
          style={{ maxWidth: 1400, marginTop: 16 }}
        />

        {/* ───── Bloco 1: O QUE COBRIMOS ───── */}
        <div className={styles.guaranteeSection}>
          <EditableText
            pageId={PAGE_ID}
            fieldKey="coverageHeader"
            defaultValue="O QUE COBRIMOS"
            as="div"
            className={styles.guaranteeSectionHeader}
          />
          <div className={styles.guaranteeGrid2x2}>
            {COVERAGE.map((c, i) => (
              <CoverageCard
                key={i}
                index={i}
                defaultTitle={c.title}
                defaultDesc={c.desc}
              />
            ))}
          </div>
        </div>

        {/* ───── Bloco 2: PRAZOS POR LINHA ───── */}
        <div className={styles.guaranteeSection}>
          <EditableText
            pageId={PAGE_ID}
            fieldKey="warrantyHeader"
            defaultValue="PRAZO POR LINHA"
            as="div"
            className={styles.guaranteeSectionHeader}
          />
          <div className={styles.warrantyTiers}>
            {WARRANTY_TIERS.map((t, i) => (
              <WarrantyTierItem
                key={i}
                index={i}
                defaultYears={t.years}
                defaultName={t.name}
              />
            ))}
          </div>
        </div>

        {/* ───── Bloco 3: NOSSO COMPROMISSO ───── */}
        <div className={styles.guaranteeSection}>
          <EditableText
            pageId={PAGE_ID}
            fieldKey="commitmentHeader"
            defaultValue="NOSSO COMPROMISSO"
            as="div"
            className={styles.guaranteeSectionHeader}
          />
          <div className={styles.guaranteeGrid3x1}>
            {COMMITMENTS.map((c, i) => (
              <CommitmentCard
                key={i}
                index={i}
                defaultTitle={c.title}
                defaultDesc={c.desc}
              />
            ))}
          </div>
        </div>

        {/* ───── Pull quote + QR ───── */}
        <div className={styles.guaranteeFooter}>
          <EditableText
            pageId={PAGE_ID}
            fieldKey="pullQuote"
            defaultValue="Garantia não é promessa. É contrato."
            as="div"
            className={styles.guaranteePullQuote}
          />

          {!(qrLabelHidden && qrUrlHidden) && (
            <div
              className={styles.guaranteeQrBlock}
              data-page-link-url={`${catalogMeta.baseUrl}/garantia`}
            >
              <div className={styles.guaranteeQrImg}>
                {qrDataUrl ? <img src={qrDataUrl} alt="QR · Detalhamento técnico da garantia" /> : null}
              </div>
              <div className={styles.guaranteeQrCaption}>
                <EditableText
                  pageId={PAGE_ID}
                  fieldKey="qr.label"
                  defaultValue="DETALHAMENTO TÉCNICO"
                  as="div"
                  className={styles.qrLabel}
                  style={{ color: '#D4AF37' }}
                />
                <EditableText
                  pageId={PAGE_ID}
                  fieldKey="qr.url"
                  defaultValue="nzgroup.com.br/garantia"
                  as="div"
                  className={styles.qrUrl}
                  style={{ color: '#D4AF37' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </CatalogPage>
  );
}

/* ─── Sub-componentes ────────────────────────────────────────────── */

interface CoverageCardProps {
  index: number;
  defaultTitle: string;
  defaultDesc: string;
}

function CoverageCard({ index, defaultTitle, defaultDesc }: CoverageCardProps) {
  const titleHidden = useElementHidden(PAGE_ID, `coverage.${index}.title`);
  const descHidden = useElementHidden(PAGE_ID, `coverage.${index}.desc`);
  if (titleHidden && descHidden) return null;
  return (
    <div className={styles.coverageCard}>
      <div className={styles.coverageCheck} aria-hidden>✓</div>
      <div className={styles.coverageBody}>
        <EditableText
          pageId={PAGE_ID}
          fieldKey={`coverage.${index}.title`}
          defaultValue={defaultTitle}
          as="div"
          className={styles.coverageTitle}
        />
        <EditableText
          pageId={PAGE_ID}
          fieldKey={`coverage.${index}.desc`}
          defaultValue={defaultDesc}
          as="div"
          className={styles.coverageDesc}
        />
      </div>
    </div>
  );
}

interface WarrantyTierItemProps {
  index: number;
  defaultYears: string;
  defaultName: string;
}

function WarrantyTierItem({ index, defaultYears, defaultName }: WarrantyTierItemProps) {
  const yearsHidden = useElementHidden(PAGE_ID, `tier.${index}.years`);
  const nameHidden = useElementHidden(PAGE_ID, `tier.${index}.name`);
  if (yearsHidden && nameHidden) return null;
  return (
    <div className={styles.warrantyTierItem}>
      <EditableText
        pageId={PAGE_ID}
        fieldKey={`tier.${index}.years`}
        defaultValue={defaultYears}
        as="span"
        className={styles.warrantyTierYears}
      />
      <EditableText
        pageId={PAGE_ID}
        fieldKey={`tier.${index}.name`}
        defaultValue={defaultName}
        as="span"
        className={styles.warrantyTierName}
      />
    </div>
  );
}

interface CommitmentCardProps {
  index: number;
  defaultTitle: string;
  defaultDesc: string;
}

function CommitmentCard({ index, defaultTitle, defaultDesc }: CommitmentCardProps) {
  const titleHidden = useElementHidden(PAGE_ID, `commitment.${index}.title`);
  const descHidden = useElementHidden(PAGE_ID, `commitment.${index}.desc`);
  if (titleHidden && descHidden) return null;
  return (
    <div className={styles.commitmentCard}>
      <EditableText
        pageId={PAGE_ID}
        fieldKey={`commitment.${index}.title`}
        defaultValue={defaultTitle}
        as="div"
        className={styles.commitmentTitle}
      />
      <EditableText
        pageId={PAGE_ID}
        fieldKey={`commitment.${index}.desc`}
        defaultValue={defaultDesc}
        as="div"
        className={styles.commitmentDesc}
      />
    </div>
  );
}
