// /nova-senha — define a senha.
//
// Atende dois caminhos que terminam igual:
//   · "esqueci minha senha" (link type=recovery);
//   · convite da equipe (link type=invite) — quem tem usuário no NZERP recebe
//     este link para criar a própria senha do site. A senha do ERP não vale
//     aqui, de propósito.
//
// O link do Supabase pode chegar como `#access_token=…` (implicit) ou `?code=…`
// (PKCE). O cliente resolve o primeiro sozinho; o segundo é trocado aqui.

import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { textoDoErroAuth } from '../../lib/shop/conta';
import styles from './Auth.module.css';

type Estado = 'verificando' | 'pronto' | 'invalido' | 'salvo';

export default function NovaSenha() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<Estado>('verificando');
  const [senha, setSenha] = useState('');
  const [repetir, setRepetir] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [erroLink, setErroLink] = useState('');

  const preparar = useCallback(async () => {
    const url = new URL(window.location.href);
    const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
    const descricao = url.searchParams.get('error_description') ?? hash.get('error_description');
    if (descricao) {
      setErroLink(textoDoErroAuth(descricao));
      setEstado('invalido');
      return;
    }

    const code = url.searchParams.get('code');
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setErroLink(textoDoErroAuth(error.message));
        setEstado('invalido');
        return;
      }
    }

    // O link implícito é consumido pelo próprio cliente na carga da página; dá
    // uma volta no event loop antes de concluir que não há sessão.
    const { data } = await supabase.auth.getSession();
    setEstado(data.session ? 'pronto' : 'invalido');
    if (!data.session) setErroLink('Este link não vale mais. Peça um novo.');
  }, []);

  useEffect(() => {
    // Consumir o link é efeito de verdade (mexe na URL e cria a sessão); o
    // estado da tela é consequência dele.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void preparar();
  }, [preparar]);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (senha.length < 8) return setErro('A senha precisa de pelo menos 8 caracteres.');
    if (senha !== repetir) return setErro('As duas senhas não são iguais.');

    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) return setErro(textoDoErroAuth(error.message));

    setEstado('salvo');
    const { data } = await supabase.auth.getUser();
    const id = data.user?.id;
    const { data: perfil } = id ? await supabase.from('user_profiles').select('role').eq('id', id).maybeSingle() : { data: null };
    const admin = (perfil as { role?: string } | null)?.role === 'admin';
    setTimeout(() => navigate(admin ? '/admin' : '/painel', { replace: true }), 1200);
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Definir senha</h1>

        {estado === 'verificando' && <p className={styles.authSub}>Conferindo o link…</p>}

        {estado === 'invalido' && (
          <>
            <div className={styles.errorMsg}>{erroLink}</div>
            <div className={styles.linkRow}>
              <Link to="/recuperar-senha">Pedir um link novo</Link>
            </div>
          </>
        )}

        {estado === 'salvo' && <div className={styles.okMsg}>Senha definida. Entrando…</div>}

        {estado === 'pronto' && (
          <>
            <p className={styles.authSub}>Escolha uma senha de pelo menos 8 caracteres.</p>
            <form className={styles.form} onSubmit={salvar}>
              {erro && <div className={styles.errorMsg}>{erro}</div>}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Nova senha</label>
                <div className={styles.senhaWrap}>
                  <input
                    type={verSenha ? 'text' : 'password'}
                    className={styles.input}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                  <button type="button" className={styles.verSenha} onClick={() => setVerSenha((v) => !v)}>
                    {verSenha ? 'ocultar' : 'mostrar'}
                  </button>
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Repita a senha</label>
                <input
                  type={verSenha ? 'text' : 'password'}
                  className={styles.input}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={repetir}
                  onChange={(e) => setRepetir(e.target.value)}
                />
              </div>
              <button type="submit" className={styles.submitBtn}>
                SALVAR SENHA
              </button>
            </form>
          </>
        )}

        <Link to="/" className={styles.backToSite}>
          ← Voltar ao site
        </Link>
      </div>
    </div>
  );
}
