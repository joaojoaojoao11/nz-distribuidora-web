// Vitrine dos tutoriais "Como funciona" — só existe no localhost (rota
// /dev/tutoriais, registrada em App.tsx com import.meta.env.DEV). Mostra o
// cabeçalho de cada tela com o botão, do jeito que aparece no admin, para
// conferir texto e animação sem precisar de login nem de dados.

import { PaginaAdmin } from '../../pages/Admin/comuns/Pagina';
import { TUTORIAIS_ADMIN } from '../../lib/tutoriais/admin';

export default function VitrineTutoriais() {
  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0c', padding: '2rem 16px 4rem' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        <p style={{ color: '#8a8a8f', fontSize: '0.8rem' }}>
          Vitrine dos tutoriais (só no localhost). Cada bloco é o cabeçalho da tela no admin, com o botão “Como funciona”.
        </p>
        {TUTORIAIS_ADMIN.map((t) => (
          <section key={t.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem' }}>
            <PaginaAdmin titulo={t.titulo} tutorial={t.id} descricao={`${t.id} · ${t.passos.length} passos — ${t.resumo}`}>
              {null}
            </PaginaAdmin>
          </section>
        ))}
      </div>
    </main>
  );
}
