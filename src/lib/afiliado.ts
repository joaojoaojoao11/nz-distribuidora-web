// Atribuição de afiliado no cliente.
//
// Um link compartilhado chega como ?ref=NZ-ABCDE. Guardamos o código por 30
// dias (último clique vence) e um id de visitante estável, e avisamos o
// servidor, que grava em `atribuicoes`. No cadastro o código vira
// `user_profiles.indicado_por`; no pedido vira `pedidos.afiliado_user_id`
// (resolvido no servidor pelo código). Nada disto dá acesso a nada: é só
// para saber quem indicou.

const CHAVE_REF = 'nz:ref';
const CHAVE_REF_EM = 'nz:ref:em';
const CHAVE_VISITANTE = 'nz:visitante';
const DIAS = 30;

function ler(chave: string): string | null {
  try {
    return window.localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function gravar(chave: string, valor: string) {
  try {
    window.localStorage.setItem(chave, valor);
  } catch {
    /* storage bloqueado: segue sem atribuição */
  }
}

export function visitanteId(): string {
  let id = ler(CHAVE_VISITANTE);
  if (!id) {
    id = `v_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
    gravar(CHAVE_VISITANTE, id);
  }
  return id;
}

/** Código de afiliado vigente (ou null se expirou / nunca houve). */
export function refVigente(): string | null {
  const ref = ler(CHAVE_REF);
  const em = Number(ler(CHAVE_REF_EM) ?? 0);
  if (!ref || !em) return null;
  if (Date.now() - em > DIAS * 86400000) return null;
  return ref;
}

/** Chamado a cada navegação: captura ?ref= e registra o clique. */
export function capturarRef(search: string) {
  const params = new URLSearchParams(search);
  const bruto = params.get('ref');
  if (!bruto) return;
  const codigo = bruto.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9-]{2,23}$/.test(codigo)) return;
  gravar(CHAVE_REF, codigo);
  gravar(CHAVE_REF_EM, String(Date.now()));
  void fetch('/api/nz/afiliado', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ op: 'clique', codigo, visitante: visitanteId() }),
    keepalive: true,
  }).catch(() => {});
}
