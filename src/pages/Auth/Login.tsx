import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Auth.module.css';

export default function Login() {
  const { signIn, profile } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = await signIn(email, password);
    if (err) {
      setError(err === 'Invalid login credentials' ? 'Email ou senha incorretos.' : err);
      setLoading(false);
      return;
    }

    // Wait for profile to load
    setTimeout(() => {
      if (profile?.role === 'admin') navigate('/admin');
      else navigate('/painel');
      setLoading(false);
    }, 500);
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Entrar</h1>
        <p className={styles.authSub}>Acesse sua conta NZ Distribuidora</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.errorMsg}>{error}</div>}

          <div className={styles.inputGroup}>
            <label className={styles.label}>Email</label>
            <input type="email" className={styles.input} placeholder="seu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Senha</label>
            <input type="password" className={styles.input} placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Entrando...' : 'ENTRAR'}
          </button>
        </form>

        <div className={styles.linkRow}>
          Não tem conta? <Link to="/cadastro">Criar conta</Link>
        </div>
        <Link to="/" className={styles.backToSite}>← Voltar ao site</Link>
      </div>
    </div>
  );
}
