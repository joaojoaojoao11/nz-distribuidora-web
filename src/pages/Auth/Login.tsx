import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { textoDoErroAuth } from '../../lib/shop/conta';
import { supabase } from '../../lib/supabase';
import styles from './Auth.module.css';

const GOOGLE_ATIVO = import.meta.env.VITE_GOOGLE_LOGIN === '1';

export default function Login() {
  const { signIn, profile, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // ?next=/loja/x — quem veio de "entre para ver o preço" volta para o produto.
  const next = new URLSearchParams(location.search).get('next');
  const destinoSeguro = next && next.startsWith('/') && !next.startsWith('//') ? next : null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [waitingProfile, setWaitingProfile] = useState(false);

  // Reage à mudança de profile após o login (resolve o bug de closure stale)
  useEffect(() => {
    if (waitingProfile && user && profile) {
      if (destinoSeguro) navigate(destinoSeguro);
      else if (profile.role === 'admin') navigate('/admin');
      else navigate('/painel');
      // O destino depende do perfil, que chega depois do login: a navegação é
      // o "sistema externo" aqui e o estado só volta ao normal junto com ela.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      setWaitingProfile(false);
    }
  }, [waitingProfile, user, profile, navigate, destinoSeguro]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = await signIn(email, password);
    if (err) {
      setError(textoDoErroAuth(err));
      setLoading(false);
      return;
    }

    // Marca para aguardar o profile carregar via useEffect
    setWaitingProfile(true);
  };

  const entrarComGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${destinoSeguro ?? '/painel'}` },
    });
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Entrar</h1>
        <p className={styles.authSub}>Acesse sua conta NZ Distribuidora</p>

        {GOOGLE_ATIVO && (
          <>
            <button type="button" className={styles.googleBtn} onClick={() => void entrarComGoogle()}>
              Continuar com Google
            </button>
            <div className={styles.divisor}>ou</div>
          </>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.errorMsg}>{error}</div>}

          <div className={styles.inputGroup}>
            <label className={styles.label}>E-mail</label>
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

          <div className={styles.inputGroup}>
            <label className={styles.label}>Senha</label>
            <div className={styles.senhaWrap}>
              <input
                type={verSenha ? 'text' : 'password'}
                className={styles.input}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className={styles.verSenha} onClick={() => setVerSenha((v) => !v)}>
                {verSenha ? 'ocultar' : 'mostrar'}
              </button>
            </div>
          </div>

          <Link to="/recuperar-senha" className={styles.esqueci}>
            Esqueci minha senha
          </Link>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Entrando...' : 'ENTRAR'}
          </button>
        </form>

        <div className={styles.linkRow}>
          Não tem conta? <Link to={destinoSeguro ? `/cadastro?next=${encodeURIComponent(destinoSeguro)}` : '/cadastro'}>Criar conta</Link>
        </div>
        <Link to="/" className={styles.backToSite}>
          ← Voltar ao site
        </Link>
      </div>
    </div>
  );
}
