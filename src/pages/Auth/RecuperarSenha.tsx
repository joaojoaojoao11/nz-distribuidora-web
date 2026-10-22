// /recuperar-senha — "Esqueci minha senha / primeiro acesso".
//
// Aceita e-mail, CPF ou CNPJ (plano de login por documento, Fase 2). Pelo
// documento, é também a porta de entrada das contas que nasceram da base do
// NZERP sem senha: o cliente digita o CNPJ e o link de criar a senha vai para o
// e-mail que a NZ tem dele.
//
// A chamada passa pelo servidor (/api/nz/conta) e a resposta é sempre a mesma:
// quem digita o e-mail ou o CNPJ de outra pessoa não descobre se ela tem conta
// na NZ — nem para qual e-mail o link foi (D4).

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { chamarConta, digitarIdentificador, tipoIdentificador } from '../../lib/shop/conta';
import { validarCpfCnpj } from '../../lib/documento';
import { LinkVendas } from '../../components/ContatoVendas/ContatoVendas';
import styles from './Auth.module.css';

export default function RecuperarSenha() {
  // Vindo do Entrar ou do cadastro, o que a pessoa já digitou chega pelo state (fora da URL).
  const location = useLocation();
  const inicial = (location.state as { identificador?: unknown } | null)?.identificador;
  const [identificador, setIdentificador] = useState(typeof inicial === 'string' ? inicial : '');
  const [enviado, setEnviado] = useState<'email' | 'documento' | null>(null);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    const tipo = tipoIdentificador(identificador);
    if (tipo === 'invalido') {
      setErro('Digite o e-mail, o CPF ou o CNPJ da conta.');
      return;
    }
    if (tipo === 'documento' && !validarCpfCnpj(identificador)) {
      setErro('CPF/CNPJ inválido — confira os dígitos.');
      return;
    }
    setLoading(true);
    await chamarConta({ op: 'recuperar-senha', identificador: identificador.trim() }).catch(() => null);
    setLoading(false);
    setEnviado(tipo);
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Criar ou recuperar senha</h1>

        {enviado ? (
          <>
            <div className={styles.okMsg}>
              {enviado === 'email' ? (
                <>
                  Se existe uma conta com <strong>{identificador.trim()}</strong>, o link para criar a senha já está a caminho. Confira também a caixa de spam.
                </>
              ) : (
                <>
                  Se o CPF/CNPJ <strong>{identificador}</strong> tem conta na NZ, o link para criar a senha está a caminho do e-mail cadastrado. Confira também a
                  caixa de spam.
                </>
              )}
            </div>
            <p className={styles.hint}>Não chegou em alguns minutos? A NZ confere o seu cadastro e manda o acesso.</p>
            <LinkVendas className={styles.submitBtnSecundario} mensagem="Olá! Estou tentando acessar o site da NZ e não recebi o link para criar a senha.">
              Falar com a NZ
            </LinkVendas>
            <div className={styles.linkRow}>
              <Link to="/login">Voltar para o login</Link>
            </div>
          </>
        ) : (
          <>
            <p className={styles.authSub}>
              Esqueceu a senha ou é o primeiro acesso? Digite o e-mail, o CPF ou o CNPJ da conta e mandamos um link para você criar a senha.
            </p>
            <form className={styles.form} onSubmit={enviar}>
              {erro && <div className={styles.errorMsg}>{erro}</div>}
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="recuperar-identificador">
                  E-mail, CPF ou CNPJ
                </label>
                <input
                  id="recuperar-identificador"
                  type="text"
                  className={styles.input}
                  placeholder="seu@email.com ou CPF/CNPJ"
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={identificador}
                  onChange={(e) => {
                    const novo = e.target.value;
                    setIdentificador((anterior) => digitarIdentificador(anterior, novo));
                  }}
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
