// /painel/seguranca — e-mail de acesso, senha e último acesso.
//
// O bloco "Acesso" do painel antigo só trocava a senha. Ganhou o que o cliente
// pergunta quando desconfia de alguma coisa: quando esta conta entrou pela
// última vez e por onde ela foi criada (site, convite ou Google) — dado que já
// estava em `user_profiles` e nunca tinha sido mostrado.
//
// Trocar o e-mail fica de fora até existir e-mail transacional: o Supabase
// dispara confirmação nos DOIS endereços, e hoje isso cairia no vazio.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { textoDoErroAuth } from '../../lib/shop/conta';
import styles from './Painel.module.css';

const ORIGEM_LABEL: Record<string, string> = {
  site: 'cadastro pelo site',
  convite: 'convite da equipe NZ',
  google: 'entrada com Google',
  erp: 'importada do NZERP',
};

export default function PainelSeguranca() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [trocando, setTrocando] = useState(false);
  const [atual, setAtual] = useState('');
  const [senha, setSenha] = useState('');
  const [repetir, setRepetir] = useState('');
  const [salvando, setSalvando] = useState(false);
  // Conta que só entra pelo Google não tem senha: não há "senha atual" a pedir.
  const temSenha = (user?.app_metadata?.providers as string[] | undefined)?.includes('email') ?? true;
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [conta, setConta] = useState<{ ultimo_acesso_em: string | null; origem: string | null; created_at: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    let vivo = true;
    void supabase
      .from('user_profiles')
      .select('ultimo_acesso_em, origem, created_at')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (vivo) setConta((data as typeof conta) ?? null);
      });
    return () => {
      vivo = false;
    };
  }, [user]);

  const trocarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (senha.length < 8) {
      setMsg({ tipo: 'erro', texto: 'A senha precisa de pelo menos 8 caracteres.' });
      return;
    }
    if (senha !== repetir) {
      setMsg({ tipo: 'erro', texto: 'As duas senhas não são iguais.' });
      return;
    }
    setSalvando(true);
    try {
      // Sessão esquecida aberta num computador alheio não pode trocar a senha
      // sem saber a atual.
      if (temSenha) {
        if (!user?.email) return;
        const { error: errAtual } = await supabase.auth.signInWithPassword({ email: user.email, password: atual });
        if (errAtual) {
          setMsg({ tipo: 'erro', texto: 'A senha atual não confere.' });
          return;
        }
      }
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) {
        setMsg({ tipo: 'erro', texto: textoDoErroAuth(error.message) });
        return;
      }
      // Quem tinha a senha antiga (ou uma sessão roubada) perde o acesso.
      await supabase.auth.signOut({ scope: 'others' }).catch(() => undefined);
      setAtual('');
      setSenha('');
      setRepetir('');
      setTrocando(false);
      setMsg({ tipo: 'ok', texto: temSenha ? 'Senha alterada. Os outros aparelhos foram desconectados.' : 'Senha definida.' });
    } finally {
      setSalvando(false);
    }
  };

  const sairDeTodos = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const data = (v: string | null | undefined) => (v ? new Date(v).toLocaleString('pt-BR') : '—');

  return (
    <>
      <section className={styles.bloco}>
        <h2 className={styles.subtitulo}>E-mail de acesso</h2>
        <p className={styles.mudo}>
          <strong>{user?.email}</strong>
        </p>
        <p className={styles.mudo}>
          Para trocar o e-mail da conta, fale com a NZ — a troca exige confirmação nos dois endereços.
        </p>
      </section>

      <section className={styles.bloco}>
        <h2 className={styles.subtitulo}>{temSenha ? 'Senha' : 'Definir uma senha'}</h2>
        {msg && <p className={msg.tipo === 'ok' ? styles.ok : styles.erro}>{msg.texto}</p>}
        {trocando ? (
          <form className={styles.form} onSubmit={trocarSenha}>
            {temSenha && (
              <label className={styles.campo}>
                <span>Senha atual</span>
                <input type="password" value={atual} onChange={(e) => setAtual(e.target.value)} required autoComplete="current-password" />
              </label>
            )}
            <label className={styles.campo}>
              <span>Nova senha</span>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                minLength={8}
                required
                autoComplete="new-password"
              />
            </label>
            <label className={styles.campo}>
              <span>Repita a nova senha</span>
              <input
                type="password"
                value={repetir}
                onChange={(e) => setRepetir(e.target.value)}
                minLength={8}
                required
                autoComplete="new-password"
              />
            </label>
            <div className={styles.acoesBloco}>
              <button type="submit" className={styles.salvar} disabled={salvando}>
                {salvando ? 'Salvando…' : 'Salvar senha'}
              </button>
              <button type="button" className={styles.botaoSecundario} onClick={() => setTrocando(false)}>
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className={styles.acoesBloco}>
            <button type="button" className={styles.botaoSecundario} onClick={() => setTrocando(true)}>
              {temSenha ? 'Alterar senha' : 'Definir senha'}
            </button>
            <button type="button" className={styles.botaoSecundario} onClick={() => void sairDeTodos()}>
              Sair de todos os aparelhos
            </button>
          </div>
        )}
      </section>

      <section className={styles.bloco}>
        <h2 className={styles.subtitulo}>Atividade da conta</h2>
        <dl className={styles.definicoes}>
          <div>
            <dt>Último acesso</dt>
            <dd>{data(conta?.ultimo_acesso_em)}</dd>
          </div>
          <div>
            <dt>Conta criada em</dt>
            <dd>{data(conta?.created_at)}</dd>
          </div>
          <div>
            <dt>Origem</dt>
            <dd>{conta?.origem ? (ORIGEM_LABEL[conta.origem] ?? conta.origem) : '—'}</dd>
          </div>
        </dl>
        <p className={styles.mudo}>
          Viu um acesso que não reconhece? Troque a senha acima e avise a NZ.
        </p>
      </section>
    </>
  );
}
