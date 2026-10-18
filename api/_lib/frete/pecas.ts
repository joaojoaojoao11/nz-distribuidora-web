// Regras de frete de PEÇA (camisetas da Coleção NZPPF 2026) — módulo PURO,
// sem import, para o autoteste (scripts/test-frete.mjs) rodar sem Supabase.
//
// Usado por `cotar` (handlers/prazo.ts), que serve à página de produto e ao
// checkout (frete/carrinho.ts). Os perfis de ROLO não mudam nada: têm
// `itens_por_volume = 1` e `dias_producao = 0` (padrões da migration
// 2026-10-17c_loja_vestuario.sql).

export interface PerfilPeca {
  peso_kg: number;
  valor_declarado?: number;
  dias_producao?: number;
  itens_por_volume?: number;
  peso_adicional_kg?: number;
}

/** Dias de produção do perfil (0 quando ausente: rolos e banco sem a migration). */
export function diasDeProducao(profile: Pick<PerfilPeca, 'dias_producao'>): number {
  const n = Math.floor(Number(profile.dias_producao) || 0);
  return n > 0 ? n : 0;
}

/**
 * Peças → volumes, para perfil de PEÇA (`itens_por_volume > 1`).
 *
 * As peças são repartidas igualmente entre o mínimo de volumes que as comporta:
 * com 3 por envelope, 1–3 camisetas = 1 envelope e 4 = 2 envelopes de 2. O peso
 * de cada volume é o do perfil (embalagem + 1 peça) mais `peso_adicional_kg`
 * por peça extra; o valor declarado acompanha o número de peças. Perfil de rolo
 * (1 por volume) passa intacto: a quantidade continua sendo de volumes.
 */
export function volumesDoPerfil<T extends PerfilPeca>(profile: T, qtd: number): { perfil: T; volumes: number } {
  const cap = Math.max(1, Math.floor(Number(profile.itens_por_volume) || 1));
  if (cap <= 1) return { perfil: profile, volumes: qtd };
  const pecas = Math.max(1, Math.round(qtd));
  const volumes = Math.ceil(pecas / cap);
  const porVolume = Math.ceil(pecas / volumes);
  const extra = Math.max(0, Number(profile.peso_adicional_kg) || 0);
  return {
    volumes,
    perfil: {
      ...profile,
      peso_kg: Math.round((Number(profile.peso_kg) + (porVolume - 1) * extra) * 1000) / 1000,
      valor_declarado: Number(profile.valor_declarado ?? 100) * porVolume,
    },
  };
}
