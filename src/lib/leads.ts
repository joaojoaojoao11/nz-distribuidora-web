// Formulários abertos do site (pedido de aplicador, cupom surpresa das páginas
// NZPPF) → /api/nz/lead. Quem grava é o servidor, que também avisa a NZ por
// e-mail. Lança em erro: a tela decide o que dizer.

export async function enviarLead(op: 'aplicador' | 'cupom', dados: Record<string, unknown>): Promise<void> {
  let r: Response;
  try {
    r = await fetch('/api/nz/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op, dados }),
    });
  } catch {
    throw new Error('sem-conexao');
  }
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error || `http-${r.status}`);
  }
}
