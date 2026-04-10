import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Auth.module.css';

export default function Register() {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'client', company: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (form.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      setLoading(false);
      return;
    }

    const { error: err } = await signUp(form.email, form.password, {
      full_name: form.name,
      phone: form.phone,
      role: form.role,
      company_name: form.company || undefined
    });

    if (err) {
      setError(err.includes('already registered') ? 'Este email já está cadastrado.' : err);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className={styles.authPage}>
        <div className={styles.authCard}>
          <div className={styles.successMsg}>
            <h3>✅ Cadastro Enviado!</h3>
            <p>Seu cadastro foi recebido com sucesso. Um administrador irá revisar e aprovar seu acesso em breve.</p>
          </div>
          <Link to="/login" className={styles.backToSite}>← Ir para Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Criar Conta</h1>
        <p className={styles.authSub}>Cadastre-se para acessar a NZ Distribuidora</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.errorMsg}>{error}</div>}

          <div className={styles.inputGroup}>
            <label className={styles.label}>Tipo de Conta</label>
            <div className={styles.roleSelector}>
              <button type="button" className={`${styles.roleBtn} ${form.role === 'client' ? styles.roleBtnActive : ''}`} onClick={() => update('role', 'client')}>Cliente Final</button>
              <button type="button" className={`${styles.roleBtn} ${form.role === 'reseller' ? styles.roleBtnActive : ''}`} onClick={() => update('role', 'reseller')}>Revendedor</button>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Nome Completo</label>
            <input type="text" className={styles.input} placeholder="João da Silva" required value={form.name} onChange={(e) => update('name', e.target.value)} />
          </div>

          {form.role === 'reseller' && (
            <div className={styles.inputGroup}>
              <label className={styles.label}>Nome da Empresa</label>
              <input type="text" className={styles.input} placeholder="Sua Empresa LTDA" value={form.company} onChange={(e) => update('company', e.target.value)} />
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label}>Email</label>
            <input type="email" className={styles.input} placeholder="seu@email.com" required value={form.email} onChange={(e) => update('email', e.target.value)} />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>WhatsApp</label>
            <input type="tel" className={styles.input} placeholder="(11) 99999-9999" required value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Senha</label>
            <input type="password" className={styles.input} placeholder="Mínimo 6 caracteres" required value={form.password} onChange={(e) => update('password', e.target.value)} />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Cadastrando...' : 'CRIAR MINHA CONTA'}
          </button>
        </form>

        <div className={styles.linkRow}>
          Já tem conta? <Link to="/login">Entrar</Link>
        </div>
        <Link to="/" className={styles.backToSite}>← Voltar ao site</Link>
      </div>
    </div>
  );
}
