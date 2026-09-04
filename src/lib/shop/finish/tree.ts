// Árvore de acabamentos.
//
// Decisão central: acabamento é um CONJUNTO DE TAGS, não um valor único.
// 'Metálico Fosco' vira ['metalico', 'fosco'] porque as strings do mundo real
// são combinações de dois eixos independentes (textura × brilho). Tratá-las
// como um enum único obrigaria a inventar um valor para cada combinação.
//
// A árvore existe só para EXPANDIR CONSULTA, nunca para expandir o dado:
//   buscar "fosco"     → fosco + acetinado
//   buscar "acetinado" → só acetinado
// Por isso um item acetinado NÃO recebe a tag 'fosco' no cadastro. Se recebesse,
// "azul acetinado" e "azul fosco" devolveriam o mesmo conjunto.

export type FinishId =
  | 'brilhante'
  | 'fosco'
  | 'acetinado'
  | 'metalico'
  | 'cromado'
  | 'escovado'
  | 'perolado'
  | 'camaleao'
  | 'carbono'
  | 'texturizado'
  | 'transparente'
  | 'solido'
  | 'refletivo';

export const FINISH_PARENT: Partial<Record<FinishId, FinishId>> = {
  acetinado: 'fosco',
  cromado: 'metalico',
  escovado: 'metalico',
  perolado: 'metalico',
};

export const FINISH_LABEL: Record<FinishId, string> = {
  brilhante: 'Brilhante',
  fosco: 'Fosco',
  acetinado: 'Acetinado',
  metalico: 'Metálico',
  cromado: 'Cromado',
  escovado: 'Escovado',
  perolado: 'Perolado',
  camaleao: 'Camaleão',
  carbono: 'Carbono',
  texturizado: 'Texturizado',
  transparente: 'Transparente',
  solido: 'Sólido',
  refletivo: 'Refletivo',
};

/** Ordem de exibição na sidebar; os filhos aparecem indentados sob o pai. */
export const FINISH_ORDER: FinishId[] = [
  'brilhante',
  'fosco',
  'acetinado',
  'metalico',
  'cromado',
  'escovado',
  'perolado',
  'camaleao',
  'carbono',
  'texturizado',
  'refletivo',
  'solido',
  'transparente',
];

const CHILDREN: Partial<Record<FinishId, FinishId[]>> = (() => {
  const map: Partial<Record<FinishId, FinishId[]>> = {};
  for (const [child, parent] of Object.entries(FINISH_PARENT) as [FinishId, FinishId][]) {
    (map[parent] ??= []).push(child);
  }
  return map;
})();

/** O próprio id mais toda a sua descendência. `fosco` → ['fosco', 'acetinado']. */
export function finishDescendants(id: FinishId): FinishId[] {
  const out: FinishId[] = [id];
  for (let i = 0; i < out.length; i++) {
    for (const child of CHILDREN[out[i]] ?? []) {
      if (!out.includes(child)) out.push(child);
    }
  }
  return out;
}

/** O próprio id mais seus ancestrais. `acetinado` → ['acetinado', 'fosco']. */
export function finishAncestors(id: FinishId): FinishId[] {
  const out: FinishId[] = [id];
  let current = FINISH_PARENT[id];
  while (current && !out.includes(current)) {
    out.push(current);
    current = FINISH_PARENT[current];
  }
  return out;
}

export function finishChildren(id: FinishId): FinishId[] {
  return CHILDREN[id] ?? [];
}

export function isFinishId(value: string): value is FinishId {
  return value in FINISH_LABEL;
}
