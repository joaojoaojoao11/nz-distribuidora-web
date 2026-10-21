// /cadastro — criar conta na NZ.
//
// O que mudou da v1 (e por quê):
//   · TUDO vai num signUp só. Antes o telefone/documento/empresa iam num UPDATE
//     depois da criação; quando esse segundo passo falhava o perfil ficava só
//     com nome e e-mail — foi o que aconteceu com as contas de abril.
//   · O usuário já sai logado (o projeto tem confirmação automática de e-mail),
//     então vai para onde queria ir (?next=) em vez de voltar para o login.
//   · Lojista/revendedor cujo CNPJ já é cliente da NZ é reconhecido logo depois
//     de criar a conta (op `pos-cadastro`, que precisa de sessão): o endereço
//     vem do ERP. A aprovação automática por esse caminho exige e-mail
//     verificado — enquanto a confirmação de e-mail não existe, é manual.
//   · Cliente final não precisa de documento aqui — pede-se no checkout.
//   · Desde 20/10/2026 NINGUÉM nasce aprovado: três tipos (cliente final,
//     lojista/aplicador, revendedor), e a NZ libera em Admin → Clientes. A tela
//     promete "até 1 dia útil" e o painel mostra "Cadastro em análise".

import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { capturarRef, refVigente } from '../../lib/afiliado';
import { formatarCpfCnpj, somenteDigitos, tipoDocumento, validarCpfCnpj } from '../../lib/documento';
import { chamarConta, formatarTelefone, telefoneOk, textoDoErroAuth } from '../../lib/shop/conta';
import { ehEmpresa, TIPO_DESCRICAO, TIPO_LABEL, TIPOS_CLIENTE } from '../../lib/shop/papeis';
import { supabase } from '../../lib/supabase';
import styles from './Auth.module.css';

const GOOGLE_ATIVO = import.meta.env.VITE_GOOGLE_LOGIN === '1';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const next = new URLSearchParams(location.search).get('next');
  const destino = next && next.startsWith('/') && !next.startsWith('//') ? next : null;

  // Link de indicação direto para o cadastro (/cadastro?ref=NZ-XXXXX): as rotas
  // de auth ficam fora do layout público, onde o AnalyticsTracker captura o
  // ?ref= — sem isto a indicação se perdia quando o link apontava para cá (B2).
  useEffect(() => {
    capturarRef(location.search);
  }, [location.search]);

  // ?email= vem do certificado de garantia recém-emitido ("Criar conta").
  const [form, setForm] = useState(() => ({
    name: '',
    email: new URLSearchParams(location.search).get('email')?.trim().toLowerCase() ?? '',
    phone: '',
    password: '',
    role: 'client',
    company: '',
    documento: '',
    ie: '',
  }));
  const [verSenha, setVerSenha] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Conta criada, e-mail ainda não confirmado: a tela vira "confira sua caixa".
  const [confirmar, setConfirmar] = useState<string | null>(null);
  // Reenvio com espera de 60 s (o Supabase também limita; aqui é só para não
  // deixar a pessoa clicar dez vezes).
  const [aguardandoReenvio, setAguardandoReenvio] = useState(false);
  const [reenvioMsg, setReenvioMsg] = useState('');

  const empresa = ehEmpresa(form.role);
  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || form.name.trim().length < 3) return setError('Escreva seu nome completo.');
    if (!telefoneOk(form.phone)) return setError('WhatsApp incompleto — com DDD, por favor.');
    if (form.password.length < 8) return setError('A senha precisa de pelo menos 8 caracteres.');
    if (empresa) {
      if (!validarCpfCnpj(form.documento) || tipoDocumento(form.documento) !== 'cnpj') return setError('Lojista e revendedor precisam de CNPJ válido.');
      if (!form.company.trim()) return setError('Informe a razão social.');
    } else if (form.documento && !validarCpfCnpj(form.documento)) {
      return setError('CPF/CNPJ inválido — confira os dígitos.');
    }

    setLoading(true);
    const { error: err, semSessao } = await signUp(form.email, form.password, {
      full_name: form.name,
      phone: form.phone,
      role: form.role,
      company_name: form.company || undefined,
      cpf_cnpj: form.documento ? somenteDigitos(form.documento) : undefined,
      ie: form.ie || undefined,
      // Código do afiliado que trouxe esta pessoa, só se ainda está na janela
      // de atribuição. O servidor (handle_new_user) resolve o código para o
      // usuário do afiliado e grava em user_profiles.indicado_por (B2).
      indicado_por: refVigente(),
    }, destino);

    if (err) {
      setError(textoDoErroAuth(err));
      setLoading(false);
      return;
    }

    // Confirmação de e-mail ligada (20/10/2026): a conta existe, mas só vale
    // depois do clique no e-mail. O pós-cadastro (vínculo com o NZERP e aviso
    // à equipe) roda no primeiro login (AuthContext).
    if (semSessao) {
      setConfirmar(form.email.trim().toLowerCase());
      setLoading(false);
      return;
    }

    // Sessão aberta na hora (confirmação desligada): procura o cliente no
    // NZERP, copia o endereço que a NZ já tem e avisa a equipe que há cadastro
    // para aprovar. Best-effort: falhar aqui não impede a conta de existir.
    const vinculo = await chamarConta<{ aprovouAgora: boolean; jaCliente: boolean; aguardandoConfirmacao?: boolean }>({ op: 'pos-cadastro' }).catch(() => null);
    // Ninguém nasce aprovado: o painel mostra "Cadastro em análise". Quem veio
    // de "entre para ver o preço" volta para lá (e vê o mesmo aviso no preço).
    navigate(destino ?? '/painel', {
      replace: true,
      state: {
        recemCadastrado: true,
        reconhecido: Boolean(vinculo?.jaCliente),
        aprovouAgora: Boolean(vinculo?.aprovouAgora),
        // Achou cadastro parecido no NZERP, mas o e-mail não foi verificado:
        // a equipe confirma o vínculo antes de liberar histórico e preço.
        aguardandoConfirmacao: Boolean(vinculo?.aguardandoConfirmacao),
      },
    });
  };

  const entrarComGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${destino ?? '/loja'}` },
    });
  };

  const reenviar = async () => {
    if (!confirmar || aguardandoReenvio) return;
    setReenvioMsg('');
    setAguardandoReenvio(true);
    window.setTimeout(() => setAguardandoReenvio(false), 60_000);
    const emailRedirectTo = `${window.location.origin}/login?confirmado=1${destino ? `&next=${encodeURIComponent(destino)}` : ''}`;
    const { error: err } = await supabase.auth.resend({ type: 'signup', email: confirmar, options: { emailRedirectTo } });
    setReenvioMsg(err ? textoDoErroAuth(err.message) : 'Enviamos de novo. Pode levar um minuto para chegar.');
  };

  if (confirmar) {
    return (
      <div className={styles.authPage}>
        <div className={styles.authCard}>
          <h1 className={styles.authTitle}>Confirme seu e-mail</h1>
          <div className={styles.successMsg}>
            <h3>Falta um clique</h3>
            <p>
              Mandamos um e-mail para <strong>{confirmar}</strong> com o botão "Confirmar meu e-mail". Clique nele para ativar a conta — depois a NZ confere o
              cadastro e libera os preços em até 1 dia útil.
            </p>
          </div>
          <p className={styles.hint}>Não chegou? Confira o spam e a pasta de promoções. O link vale 30 minutos.</p>
          {reenvioMsg && <p className={styles.hint}>{reenvioMsg}</p>}
          <button type="button" className={styles.submitBtn} onClick={() => void reenviar()} disabled={aguardandoReenvio}>
            {aguardandoReenvio ? 'ENVIADO — AGUARDE 1 MINUTO' : 'REENVIAR E-MAIL'}
          </button>
          <div className={styles.linkRow}>
            E-mail errado?{' '}
            <button type="button" className={styles.verSenha} onClick={() => setConfirmar(null)}>
              Trocar e-mail
            </button>
          </div>
          <Link to="/" className={styles.backToSite}>
            ← Voltar ao site
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Criar Conta</h1>
        <p className={styles.authSub}>Crie sua conta. A NZ confere o cadastro e libera os preços em até 1 dia útil.</p>

        {GOOGLE_ATIVO && (
          <>
            <button type="button" className={styles.googleBtn} onClick={() => void entrarComGoogle()}>
              Continuar com Google
            </button>
            <p className={styles.hint}>
              Ao continuar com Google você aceita os <Link to="/termos">termos de uso</Link> e a <Link to="/privacidade">política de privacidade</Link>.
            </p>
            <div className={styles.divisor}>ou</div>
          </>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.errorMsg}>{error}</div>}

          <div className={styles.inputGroup}>
            <label className={styles.label}>Tipo de conta</label>
            <div className={styles.roleSelector}>
              {TIPOS_CLIENTE.map((t) => (
                <button key={t} type="button" className={`${styles.roleBtn} ${form.role === t ? styles.roleBtnActive : ''}`} onClick={() => update('role', t)}>
                  {TIPO_LABEL[t]}
                </button>
              ))}
            </div>
            <p className={styles.hint}>{TIPO_DESCRICAO[form.role as keyof typeof TIPO_DESCRICAO] ?? TIPO_DESCRICAO.client}</p>
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

          {empresa && (
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
                <p className={styles.hint}>Se este CNPJ já compra na NZ, a liberação é mais rápida.</p>
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
