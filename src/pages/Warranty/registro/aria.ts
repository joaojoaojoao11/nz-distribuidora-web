// Atributos de acessibilidade do <input> que mora dentro de um <Campo>.
export function ariaDoCampo(id: string, erro: string | undefined, mostrar: boolean, temDica = false) {
  const comErro = Boolean(mostrar && erro);
  return {
    id,
    'aria-invalid': comErro || undefined,
    'aria-describedby': comErro ? `${id}-erro` : temDica ? `${id}-dica` : undefined,
  };
}
