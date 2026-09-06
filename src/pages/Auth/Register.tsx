// /cadastro — criar conta na NZ.
//
// O que mudou da v1 (e por quê):
//   · TUDO vai num signUp só. Antes o telefone/documento/empresa iam num UPDATE
//     depois da criação; quando esse segundo passo falhava o perfil ficava só
//     com nome e e-mail — foi o que aconteceu com as contas de abril.
//   · O usuário já sai logado (o projeto tem confirmação automática de e-mail),
//     então vai para onde queria ir (?next=) em vez de voltar para o login.
//   · Lojista cujo CNPJ já é cliente da NZ é reconhecido logo depois de criar a
//     conta (op `pos-cadastro`, que precisa de sessão): o endereço vem do ERP e
//     o cadastro nasce aprovado, sem esperar liberação manual.
//   · Cliente final não precisa de documento aqui — pede-se no checkout.

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { formatarCpfCnpj, somenteDigitos, tipoDocumento, validarCpfCnpj } from '../../lib/documento';
import { chamarConta, formatarTelefone, telefoneOk, textoDoErroAuth } from '../../lib/shop/conta';
import { supabase } from '../../lib/supabase';
import styles from './Auth.module.css';

const GOOGLE_ATIVO = import.meta.env.VITE_GOOGLE_LOGIN === '1';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const next = new URLSearchParams(location.search).get('next');
  const destino = next && next.startsWith('/') && !next.startsWith('//') ? next : null;

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'client', company: '', documento: '', ie: '' });
  const [verSenha, setVerSenha] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const lojista = form.role === 'reseller';
  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || form.name.trim().length < 3) return setError('Escreva seu nome completo.');
    if (!telefoneOk(form.phone)) return setError('WhatsApp incompleto — com DDD, por favor.');
    if (form.password.length < 8) return setError('A senha precisa de pelo menos 8 caracteres.');
    if (lojista) {
      if (!validarCpfCnpj(form.documento) || tipoDocumento(form.documento) !== 'cnpj') return setError('Lojista precisa de CNPJ válido.');
      if (!form.company.trim()) return setError('Informe a razão social.');
    } else if (form.documento && !validarCpfCnpj(form.documento)) {
      return setError('CPF/CNPJ inválido — confira os dígitos.');
    }

    setLoading(true);
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
      setError(textoDoErroAuth(err));
      setLoading(false);
      return;
    }

    // Agora existe sessão: procura o cliente no NZERP, copia o endereço que a
    // NZ já tem e — lojista com CNPJ e e-mail conferindo — aprova na hora.
    // Best-effort: falhar aqui não impede a conta de existir.
    const vinculo = await chamarConta<{ aprovouAgora: boolean; jaCliente: boolean }>({ op: 'pos-cadastro' }).catch(() => null);
    navigate(destino ?? (lojista ? '/painel' : '/loja'), {
      replace: true,
      state: { recemCadastrado: true, reconhecido: Boolean(vinculo?.jaCliente), aprovouAgora: Boolean(vinculo?.aprovouAgora) },
    });
  };

  const entrarComGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${destino ?? '/loja'}` },
    });
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Criar Conta</h1>
        <p className={styles.authSub}>Cadastre-se para ver preços e comprar pelo site</p>

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
            <label className={styles.label}>Tipo de conta</label>
            <div className={styles.roleSelector}>
              <button type="button" className={`${styles.roleBtn} ${!lojista ? styles.roleBtnActive : ''}`} onClick={() => update('role', 'client')}>
                Cliente final
              </button>
              <button type="button" className={`${styles.roleBtn} ${lojista ? styles.roleBtnActive : ''}`} onClick={() => update('role', 'reseller')}>
                Lojista / aplicador
              </button>
            </div>
            <p className={styles.hint}>
              {lojista
                ? 'Compra com CNPJ e preço de revenda. A NZ confere o cadastro antes de liberar a tabela.'
                : 'Compra para você, com preço de varejo. Liberado na hora.'}
            </p>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Nome completo</label>
            <input
              type="text"
              className={styles.input}
              placeholder="João da Silva"
              required
              autoComplete="name"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
            />
          </div>

          {lojista && (
            <>
              <div className={styles.inputGroup}>
                <label className={styles.label}>CNPJ</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className={styles.input}
                  placeholder="00.000.000/0000-00"
                  required
                  value={formatarCpfCnpj(form.documento)}
                  onChange={(e) => update('documento', e.target.value)}
                />
                <p className={styles.hint}>Se este CNPJ já compra na NZ, reconhecemos e liberamos o preço de revenda na hora.</p>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Razão social</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Sua Empresa LTDA"
                  required
                  autoComplete="organization"
                  value={form.company}
                  onChange={(e) => update('company', e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Inscrição estadual</label>
                <input type="text" className={styles.input} placeholder="ou ISENTO" value={form.ie} onChange={(e) => update('ie', e.target.value)} />
              </div>
            </>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label}>E-mail</label>
            <input
              type="email"
              className={styles.input}
              placeholder="seu@email.com"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>WhatsApp</label>
            <input
              type="tel"
              inputMode="tel"
              className={styles.input}
              placeholder="(11) 99999-9999"
              required
              autoComplete="tel"
              maxLength={15}
              value={form.phone}
              onChange={(e) => update('phone', formatarTelefone(e.target.value))}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Senha</label>
            <div className={styles.senhaWrap}>
              <input
                type={verSenha ? 'text' : 'password'}
                className={styles.input}
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
              />
              <button type="button" className={styles.verSenha} onClick={() => setVerSenha((v) => !v)}>
                {verSenha ? 'ocultar' : 'mostrar'}
              </button>
            </div>
          </div>

          <p className={styles.hint}>
            Ao criar a conta você aceita os <Link to="/termos">termos de uso</Link> e a <Link to="/privacidade">política de privacidade</Link> da NZ.
          </p>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Criando...' : 'CRIAR MINHA CONTA'}
          </button>
        </form>

        <div className={styles.linkRow}>
          Já tem conta? <Link to={destino ? `/login?next=${encodeURIComponent(destino)}` : '/login'}>Entrar</Link>
        </div>
        <Link to="/" className={styles.backToSite}>
          ← Voltar ao site
        </Link>
      </div>
    </div>
  );
}
