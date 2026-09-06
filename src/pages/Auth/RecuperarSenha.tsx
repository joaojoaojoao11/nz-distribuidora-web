// /recuperar-senha — pede o e-mail de redefinição.
//
// A chamada passa pelo servidor (/api/nz/conta) em vez de ir direto ao Supabase
// para que a resposta seja sempre a mesma: quem digita o e-mail de outra pessoa
// não descobre se ela tem conta na NZ.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { chamarConta } from '../../lib/shop/conta';
import styles from './Auth.module.css';

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await chamarConta({ op: 'recuperar-senha', email }).catch(() => null);
    setLoading(false);
    setEnviado(true);
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Recuperar senha</h1>

        {enviado ? (
          <>
            <div className={styles.okMsg}>
              Se existe uma conta com <strong>{email}</strong>, o link para criar uma nova senha já está a caminho. Confira também a caixa de spam.
            </div>
            <div className={styles.linkRow}>
              <Link to="/login">Voltar para o login</Link>
            </div>
          </>
        ) : (
          <>
            <p className={styles.authSub}>Mandamos um link para você criar uma senha nova.</p>
            <form className={styles.form} onSubmit={enviar}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>E-mail da conta</label>
                <input
                  type="email"
                  className={styles.input}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Enviando...' : 'ENVIAR LINK'}
              </button>
            </form>
            <div className={styles.linkRow}>
              Lembrou? <Link to="/login">Entrar</Link>
            </div>
          </>
        )}

        <Link to="/" className={styles.backToSite}>
          ← Voltar ao site
        </Link>
      </div>
    </div>
  );
}
