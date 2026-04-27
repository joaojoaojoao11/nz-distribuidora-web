import { useEffect, useState } from 'react';
import { BUILTIN_MOTORS } from './builtinMotors';
import type { MotorSpec } from './motorTypes';

const USER_MOTORS_LS_KEY = 'nzppf_agencia_user_motors_v1';

/* ─── Migration helper (Fase 4: instagram-post → social-image) ─── */

/**
 * Migra motores user salvos em localStorage com schema antigo
 * (config.type === 'instagram-post' da Fase 3) pro novo schema
 * social-image. Idempotente — só converte uma vez.
 *
 * Mapeamento:
 *   - config.type 'instagram-post' → 'social-image'
 *   - config.defaultTemplate (hero/feature/announce) some — vira só layout 'hero-bottom-cta'
 *     (no schema novo, "template" como variação de fonte morre — vira só 1 layout)
 *   - defaultFormat = 'feed-1x1' (motor antigo era sempre 1080×1080)
 *   - copyTemplates: chaves '${oldTemplate}-${tone}' viram '${newLayout}-${tone}'
 *     (todas mapeadas pra 'hero-bottom-cta-${tone}')
 *   - lockedInputs: 'template' some, vira 'layout'
 */
function migrateUserMotors(): void {
  if (typeof window === 'undefined') return;
  const raw = window.localStorage.getItem(USER_MOTORS_LS_KEY);
  if (!raw) return;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }
  if (!Array.isArray(parsed)) return;

  let mutated = false;
  const migrated = parsed.map((motor: unknown) => {
    if (
      !motor ||
      typeof motor !== 'object' ||
      !('config' in motor) ||
      typeof (motor as { config: unknown }).config !== 'object' ||
      (motor as { config: { type?: unknown } }).config === null
    ) {
      return motor;
    }
    const m = motor as { config: { type?: unknown; copyTemplates?: Record<string, unknown>; lockedInputs?: unknown[]; defaultProductSlug?: unknown; defaultTone?: unknown; hashtags?: unknown[] } };
    if (m.config.type !== 'instagram-post') return motor;
    mutated = true;

    const oldConfig = m.config;
    const newCopy: Record<string, unknown> = {};
    if (oldConfig.copyTemplates) {
      for (const [oldKey, val] of Object.entries(oldConfig.copyTemplates)) {
        // 'announce-promocional' -> 'hero-bottom-cta-promocional'
        const tone = String(oldKey).split('-')[1] || 'aspiracional';
        newCopy[`hero-bottom-cta-${tone}`] = val;
      }
    }

    const newLocked = (oldConfig.lockedInputs || [])
      .map((k) => (k === 'template' ? 'layout' : k))
      .filter((k): k is 'format' | 'layout' | 'productSlug' | 'tone' =>
        ['format', 'layout', 'productSlug', 'tone'].includes(String(k))
      );

    return {
      ...(motor as object),
      config: {
        type: 'social-image',
        defaultFormat: 'feed-1x1',
        defaultLayout: 'hero-bottom-cta',
        defaultProductSlug: oldConfig.defaultProductSlug,
        defaultTone: oldConfig.defaultTone,
        copyTemplates: newCopy,
        hashtags: oldConfig.hashtags,
        lockedInputs: newLocked,
      },
    };
  });

  if (mutated) {
    window.localStorage.setItem(USER_MOTORS_LS_KEY, JSON.stringify(migrated));
    console.info('[motorsRegistry] Motores user migrados pro schema social-image.');
  }
}

// Executa migration na carga do módulo (uma vez por sessão)
migrateUserMotors();

/* ─── Storage de motores user (localStorage MVP — Fase 5 vira Supabase) ─── */

function loadUserMotors(): MotorSpec[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(USER_MOTORS_LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filtra entradas malformadas defensivamente
    return parsed.filter(
      (m): m is MotorSpec =>
        m && typeof m === 'object' && m.metadata && m.config
    );
  } catch (err) {
    console.warn('[motorsRegistry] Falha ao ler localStorage:', err);
    return [];
  }
}

function saveUserMotors(motors: MotorSpec[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(USER_MOTORS_LS_KEY, JSON.stringify(motors));
    // Notifica outras abas/componentes via custom event
    window.dispatchEvent(new CustomEvent('nzppf:motors-updated'));
  } catch (err) {
    console.error('[motorsRegistry] Falha ao gravar localStorage:', err);
  }
}

/* ─── API pública do registry ─── */

export function getAllMotors(): MotorSpec[] {
  // User motors aparecem ANTES dos built-in soon — visualmente sobem como "novidades"
  const user = loadUserMotors();
  const liveBuiltin = BUILTIN_MOTORS.filter((m) => m.metadata.status === 'live');
  const soonBuiltin = BUILTIN_MOTORS.filter((m) => m.metadata.status === 'soon');
  return [...liveBuiltin, ...user, ...soonBuiltin];
}

export function getMotor(id: string): MotorSpec | undefined {
  return getAllMotors().find((m) => m.metadata.id === id);
}

export function addUserMotor(spec: MotorSpec): void {
  if (spec.metadata.source !== 'user') {
    throw new Error('addUserMotor exige source="user"');
  }
  const current = loadUserMotors();
  // Substitui se já existe um com mesmo id
  const filtered = current.filter((m) => m.metadata.id !== spec.metadata.id);
  saveUserMotors([...filtered, spec]);
}

export function removeUserMotor(id: string): void {
  const current = loadUserMotors();
  saveUserMotors(current.filter((m) => m.metadata.id !== id));
}

export function clearAllUserMotors(): void {
  saveUserMotors([]);
}

/* ─── Hook React reativo ─── */

/**
 * Hook que retorna todos os motores e atualiza quando localStorage muda.
 * Usar em vez de chamar getAllMotors() direto em componentes.
 */
export function useMotors(): MotorSpec[] {
  const [motors, setMotors] = useState<MotorSpec[]>(() => getAllMotors());

  useEffect(() => {
    const refresh = () => setMotors(getAllMotors());
    window.addEventListener('nzppf:motors-updated', refresh);
    window.addEventListener('storage', refresh); // outras abas
    return () => {
      window.removeEventListener('nzppf:motors-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return motors;
}
