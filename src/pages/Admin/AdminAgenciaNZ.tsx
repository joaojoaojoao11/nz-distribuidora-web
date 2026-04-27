import { useState, type CSSProperties } from 'react';
import AdminCatalog from './AdminCatalog';
import AdminSocialImage from './AdminSocialImage';
import AdminSocialCarousel from './AdminSocialCarousel';
import OficinaNZ from './OficinaNZ';
import styles from './AdminAgenciaNZ.module.css';
import { useMotors } from '../../components/Agencia/motorsRegistry';
import {
  CATEGORY_LABELS,
  type MotorSpec,
  type MotorFamily,
} from '../../components/Agencia/motorTypes';
import { productLines } from '../../components/Catalog/data/catalogData';

const FAMILY_LABELS: Record<MotorFamily, string> = {
  'nzppf': 'NZPPF',
  'oracal-651': 'NZWRAP · Oracal 651',
  'oracal-670': 'NZWRAP · Oracal 670',
};

const FAMILY_ORDER: MotorFamily[] = ['nzppf', 'oracal-651', 'oracal-670'];

/**
 * Hub central da Agência NZ.
 *
 * Os motores (geradores) são lidos do registry central via `useMotors()`.
 * Para adicionar um novo motor built-in: adicione um MotorSpec em
 * `src/components/Agencia/builtinMotors.ts`. Para motores criados pelo
 * usuário (Fase 3): `addUserMotor(spec)` do registry.
 */
export default function AdminAgenciaNZ() {
  const motors = useMotors();
  const [activeView, setActiveView] = useState<string | null>(null);

  if (activeView === 'oficina') {
    return (
      <div className={styles.docWrap}>
        <button className={styles.backButton} onClick={() => setActiveView(null)}>
          ← Voltar à Agência NZ
        </button>
        <OficinaNZ />
      </div>
    );
  }

  const activeMotor = activeView ? motors.find((m) => m.metadata.id === activeView) : null;

  if (activeMotor) {
    return (
      <div className={styles.docWrap}>
        <button className={styles.backButton} onClick={() => setActiveView(null)}>
          ← Voltar à Agência NZ
        </button>
        {renderActiveMotor(activeMotor)}
      </div>
    );
  }

  const liveBuiltinMotors = motors.filter(
    (m) => m.metadata.status === 'live' && m.metadata.source === 'builtin'
  );
  const userMotors = motors.filter((m) => m.metadata.source === 'user');

  // Agrupa built-ins por família (NZPPF, Oracal 651, Oracal 670).
  // Motores sem `family` declarada caem em 'nzppf' por compatibilidade.
  const builtinByFamily = new Map<MotorFamily, MotorSpec[]>();
  for (const motor of liveBuiltinMotors) {
    const family = (motor.metadata.family || 'nzppf') as MotorFamily;
    const arr = builtinByFamily.get(family) || [];
    arr.push(motor);
    builtinByFamily.set(family, arr);
  }
  const builtinFamilyGroups = FAMILY_ORDER.map((family) => ({
    family,
    label: FAMILY_LABELS[family],
    motors: builtinByFamily.get(family) || [],
  })).filter((g) => g.motors.length > 0);

  // Agrupa user motors por linha de produto (via config.defaultProductSlug em social-image).
  // Motores sem linha vão pra "Sem linha específica".
  const userMotorsByLine = new Map<string, MotorSpec[]>();
  const userMotorsNoLine: MotorSpec[] = [];
  for (const motor of userMotors) {
    const slug =
      motor.config.type === 'social-image' || motor.config.type === 'social-carousel'
        ? motor.config.defaultProductSlug
        : undefined;
    if (slug) {
      const arr = userMotorsByLine.get(slug) || [];
      arr.push(motor);
      userMotorsByLine.set(slug, arr);
    } else {
      userMotorsNoLine.push(motor);
    }
  }

  // Ordena segundo a sequência canônica das linhas (luxury → prime → flow → core → headlight → windshield),
  // omitindo grupos vazios.
  const orderedLineGroups = productLines
    .map((line) => ({
      slug: line.slug,
      title: line.title,
      accent: line.accent,
      motors: userMotorsByLine.get(line.slug) || [],
    }))
    .filter((g) => g.motors.length > 0);

  return (
    <div className={styles.hubWrap}>
      <header className={styles.hubHeader}>
        <div className={styles.hubHeaderTop}>
          <div>
            <div className={styles.eyebrow}>NZ GROUP · MATERIAIS DE MARKETING</div>
            <h1 className={styles.title}>Agência NZ</h1>
            <p className={styles.subtitle}>
              Geradores automatizados de documentos comerciais e visuais, todos
              construídos a partir do conteúdo oficial do site. Identidade
              padronizada, comunicação alinhada — tudo num só lugar.
            </p>
          </div>
          <button className={styles.oficinaCta} onClick={() => setActiveView('oficina')}>
            <span className={styles.oficinaCtaIcon}>⚙️</span>
            <span>
              <strong>Oficina NZ</strong>
              <small>Criar novo gerador</small>
            </span>
          </button>
        </div>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Motores integrados</h2>
        <div className={styles.familyGroupsWrap}>
          {builtinFamilyGroups.map((group) => (
            <div key={group.family} className={styles.familyGroup}>
              <div className={styles.familyHeader}>
                <span className={styles.familyBar} />
                <span className={styles.familyName}>{group.label}</span>
                <span className={styles.familyCount}>
                  {group.motors.length}{' '}
                  {group.motors.length === 1 ? 'motor' : 'motores'}
                </span>
              </div>
              <div className={styles.cardGrid}>
                {group.motors.map((motor) => (
                  <MotorCard
                    key={motor.metadata.id}
                    motor={motor}
                    onOpen={() => setActiveView(motor.metadata.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {userMotors.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Criados por você <span className={styles.sectionCount}>{userMotors.length}</span>
          </h2>
          <div className={styles.lineGroupsWrap}>
            {orderedLineGroups.map((group) => (
              <LineGroup
                key={group.slug}
                title={group.title}
                accent={group.accent}
                motors={group.motors}
                onOpen={(id) => setActiveView(id)}
              />
            ))}
            {userMotorsNoLine.length > 0 && (
              <LineGroup
                title="Sem linha específica"
                accent="#888"
                motors={userMotorsNoLine}
                onOpen={(id) => setActiveView(id)}
              />
            )}
          </div>
        </section>
      )}

    </div>
  );
}

interface LineGroupProps {
  title: string;
  accent: string;
  motors: MotorSpec[];
  onOpen: (id: string) => void;
}

function LineGroup({ title, accent, motors, onOpen }: LineGroupProps) {
  const [collapsed, setCollapsed] = useState(false);
  const accentVar = { ['--line-accent' as string]: accent } as CSSProperties;
  return (
    <div className={styles.lineGroup} style={accentVar}>
      <button
        type="button"
        className={styles.lineGroupHeader}
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
      >
        <span className={styles.lineGroupBar} />
        <span className={styles.lineGroupName}>{title}</span>
        <span className={styles.lineGroupCount}>
          {motors.length} {motors.length === 1 ? 'motor' : 'motores'}
        </span>
        <span className={styles.lineGroupChevron} aria-hidden="true">
          {collapsed ? '▸' : '▾'}
        </span>
      </button>
      {!collapsed && (
        <div className={styles.cardGrid}>
          {motors.map((motor) => (
            <MotorCard
              key={motor.metadata.id}
              motor={motor}
              onOpen={() => onOpen(motor.metadata.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface MotorCardProps {
  motor: MotorSpec;
  onOpen?: () => void;
  disabled?: boolean;
}

function MotorCard({ motor, onOpen, disabled = false }: MotorCardProps) {
  const { metadata } = motor;
  return (
    <button
      className={`${styles.card} ${disabled ? styles.cardDisabled : ''}`}
      onClick={onOpen}
      disabled={disabled}
      type="button"
    >
      <div className={styles.cardIcon}>{metadata.icon}</div>
      <div className={styles.cardBody}>
        <div className={styles.cardCategory}>{CATEGORY_LABELS[metadata.category]}</div>
        <div className={styles.cardSubtitle}>{metadata.subtitle}</div>
        <div className={styles.cardTitle}>{metadata.title}</div>
        <div className={styles.cardDesc}>{metadata.description}</div>
      </div>
      <div className={styles.cardFooter}>
        {disabled ? (
          <span className={styles.cardBadgeSoon}>Em breve</span>
        ) : (
          <>
            <span className={styles.cardBadgeLive}>
              {metadata.source === 'user' ? 'Criado por você' : 'Disponível'}
            </span>
            {metadata.estimatedTime && (
              <span className={styles.cardEta}>{metadata.estimatedTime}</span>
            )}
          </>
        )}
      </div>
    </button>
  );
}

function renderActiveMotor(motor: MotorSpec) {
  switch (motor.config.type) {
    case 'catalog-pdf':
      return <AdminCatalog />;
    case 'social-image':
      return <AdminSocialImage motor={motor} />;
    case 'social-carousel':
      return <AdminSocialCarousel motor={motor} />;
    default:
      return (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
          Tipo de motor desconhecido.
        </div>
      );
  }
}
