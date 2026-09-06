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
  const { user } = useAuth();
  const [trocando, setTrocando] = useState(false);
  const [senha, setSenha] = useState('');
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
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) {
      setMsg({ tipo: 'erro', texto: textoDoErroAuth(error.message) });
      return;
    }
    setSenha('');
    setTrocando(false);
    setMsg({ tipo: 'ok', texto: 'Senha alterada.' });
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
        <h2 className={styles.subtitulo}>Senha</h2>
        {msg && <p className={msg.tipo === 'ok' ? styles.ok : styles.erro}>{msg.texto}</p>}
        {trocando ? (
          <form className={styles.form} onSubmit={trocarSenha}>
            <label className={styles.campo}>
              <span>Nova senha</span>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                minLength={8}
                autoComplete="new-password"
              />
            </label>
            <div className={styles.acoesBloco}>
              <button type="submit" className={styles.salvar}>
                Salvar senha
              </button>
              <button type="button" className={styles.botaoSecundario} onClick={() => setTrocando(false)}>
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className={styles.acoesBloco}>
            <button type="button" className={styles.botaoSecundario} onClick={() => setTrocando(true)}>
              Alterar senha
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
