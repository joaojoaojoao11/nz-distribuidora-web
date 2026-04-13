import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Auth.module.css';

export default function Login() {
  const { signIn, profile, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [waitingProfile, setWaitingProfile] = useState(false);

  // Reage à mudança de profile após o login (resolve o bug de closure stale)
  useEffect(() => {
    if (waitingProfile && user && profile) {
      if (profile.role === 'admin') navigate('/admin');
      else navigate('/painel');
      setLoading(false);
      setWaitingProfile(false);
    }
  }, [waitingProfile, user, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = await signIn(email, password);
    if (err) {
      // Traduz mensagens comuns de erro
      if (err === 'Invalid login credentials') {
        setError('Email ou senha incorretos.');
      } else if (err.includes('Failed to fetch') || err.includes('NetworkError')) {
        setError('Erro de conexão. Verifique sua internet ou tente novamente.');
      } else {
        setError(err);
      }
      setLoading(false);
      return;
    }

    // Marca para aguardar o profile carregar via useEffect
    setWaitingProfile(true);
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
