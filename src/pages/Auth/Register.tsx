import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { formatarCpfCnpj, somenteDigitos, tipoDocumento, validarCpfCnpj } from '../../lib/documento';
import styles from './Auth.module.css';

export default function Register() {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'client', company: '', documento: '', ie: '' });
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

    // Lojista compra com nota: CNPJ e razão social são obrigatórios. Cliente
    // final pode cadastrar CPF agora ou no painel, antes do primeiro pedido.
    const lojista = form.role === 'reseller';
    if (form.documento && !validarCpfCnpj(form.documento)) {
      setError('CPF/CNPJ inválido — confira os dígitos.');
      setLoading(false);
      return;
    }
    if (lojista && tipoDocumento(form.documento) !== 'cnpj') {
      setError('Lojista precisa de CNPJ válido.');
      setLoading(false);
      return;
    }
    if (lojista && !form.company.trim()) {
      setError('Informe a razão social.');
      setLoading(false);
      return;
    }

    const { error: err } = await signUp(form.email, form.password, {
      full_name: form.name,
      phone: form.phone,
      role: form.role,
      company_name: form.company || undefined,
      cpf_cnpj: form.documento ? somenteDigitos(form.documento) : undefined,
      ie: form.ie || undefined,
      indicado_por: (() => {
        try {
          return window.localStorage.getItem('nz:ref');
        } catch {
          return null;
        }
      })(),
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
        <p className={styles.authSub}>Cadastre-se para ver preços e pedir pelo site</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.errorMsg}>{error}</div>}

          <div className={styles.inputGroup}>
            <label className={styles.label}>Tipo de Conta</label>
            <div className={styles.roleSelector}>
              <button type="button" className={`${styles.roleBtn} ${form.role === 'client' ? styles.roleBtnActive : ''}`} onClick={() => update('role', 'client')}>Cliente final</button>
              <button type="button" className={`${styles.roleBtn} ${form.role === 'reseller' ? styles.roleBtnActive : ''}`} onClick={() => update('role', 'reseller')}>Lojista</button>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Nome Completo</label>
            <input type="text" className={styles.input} placeholder="João da Silva" required value={form.name} onChange={(e) => update('name', e.target.value)} />
          </div>

          {form.role === 'reseller' && (
            <div className={styles.inputGroup}>
              <label className={styles.label}>Razão social</label>
              <input type="text" className={styles.input} placeholder="Sua Empresa LTDA" required value={form.company} onChange={(e) => update('company', e.target.value)} />
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label}>{form.role === 'reseller' ? 'CNPJ' : 'CPF ou CNPJ (opcional agora)'}</label>
            <input type="text" inputMode="numeric" className={styles.input} placeholder={form.role === 'reseller' ? '00.000.000/0000-00' : '000.000.000-00'} required={form.role === 'reseller'} value={formatarCpfCnpj(form.documento)} onChange={(e) => update('documento', e.target.value)} />
          </div>

          {form.role === 'reseller' && (
            <div className={styles.inputGroup}>
              <label className={styles.label}>Inscrição estadual</label>
              <input type="text" className={styles.input} placeholder="ou ISENTO" value={form.ie} onChange={(e) => update('ie', e.target.value)} />
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
