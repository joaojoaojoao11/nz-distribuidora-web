// Aba Usuários do painel admin — a equipe da NZ.
//
// A regra: quem tem usuário ATIVO no NZERP tem acesso administrativo ao site.
// A lista é o cruzamento das duas bases; dar ou tirar acesso se faz no NZERP
// (Gestão de Usuários) e sincroniza aqui.
//
// O acesso ao site nasce por convite: a pessoa cria a PRÓPRIA senha. A senha do
// ERP não vale aqui — ela está em texto puro naquela base e nunca é lida por
// este código.
//
// Enquanto o site não tiver SMTP próprio, o Supabase entrega no máximo 2 e-mails
// por hora. Por isso o botão padrão gera o link e o admin manda no WhatsApp; o
// envio por e-mail fica atrás de uma caixinha.

import { useCallback, useEffect, useState } from 'react';
import { chamarEquipe, textoDoErroConta } from '../../lib/shop/conta';
import styles from './Admin.module.css';

type StatusEquipe = 'sem-conta' | 'convidado' | 'ativo' | 'bloqueado' | 'fora-do-erp';

interface Pessoa {
  erpUserId: string | null;
  nome: string;
  email: string;
  erpRole: string | null;
  ativoErp: boolean;
  permissoes: string[];
  status: StatusEquipe;
  siteUserId: string | null;
  convidadoEm: string | null;
  ultimoAcesso: string | null;
  ultimoLogin: string | null;
}

const STATUS_LABEL: Record<StatusEquipe, string> = {
  'sem-conta': 'Sem acesso',
  convidado: 'Convidado',
  ativo: 'Com acesso',
  bloqueado: 'Bloqueado',
  'fora-do-erp': 'Fora do ERP',
};

const STATUS_CLASSE: Record<StatusEquipe, string> = {
  'sem-conta': styles.badgePending,
  convidado: styles.badgeReseller,
  ativo: styles.badgeApproved,
  bloqueado: styles.badgeAdmin,
  'fora-do-erp': styles.badgeAdmin,
};

function data(v: string | null): string {
  return v ? new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—';
}

export default function AdminEquipe() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState('');
  const [porEmail, setPorEmail] = useState(false);
  const [link, setLink] = useState<{ email: string; url: string } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [aviso, setAviso] = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const r = await chamarEquipe<{ pessoas: Pessoa[]; erpDisponivel: boolean }>({ op: 'listar' });
      setPessoas(r.pessoas);
      if (!r.erpDisponivel) setErro('Não consegui ler os usuários do NZERP (credencial ausente ou base fora do ar).');
    } catch (e) {
      setErro(textoDoErroConta(e));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const agir = async (chave: string, body: Record<string, unknown>, sucesso?: (r: Record<string, unknown>) => void) => {
    setOcupado(chave);
    setErro('');
    setAviso('');
    try {
      const r = await chamarEquipe<Record<string, unknown>>(body);
      sucesso?.(r);
      await carregar();
    } catch (e) {
      setErro(textoDoErroConta(e));
    } finally {
      setOcupado('');
    }
  };

  const convidar = (p: Pessoa) =>
    agir(`convite:${p.email}`, { op: 'convidar', erpUserId: p.erpUserId, enviarEmail: porEmail }, (r) => {
      if (r.status === 'promovido') setAviso(`${p.email} já tinha conta no site — virou administrador agora.`);
      else if (r.porEmail) setAviso(`Convite enviado para ${p.email}.`);
      else if (typeof r.link === 'string') setLink({ email: p.email, url: r.link });
    });

  const copiarLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* clipboard bloqueado: o texto continua selecionável na caixa */
    }
  };

  const comAcesso = pessoas.filter((p) => p.status === 'ativo').length;
  const pendentes = pessoas.filter((p) => p.status === 'sem-conta' || p.status === 'convidado').length;
  const noErp = pessoas.filter((p) => p.erpUserId && p.ativoErp).length;

  return (
    <div className={styles.tableSection}>
      <p className={styles.tabDescription}>
        Quem tem usuário ativo no NZERP tem acesso administrativo ao site. Para dar ou tirar acesso, faça no NZERP (Gestão de Usuários) e sincronize aqui.
        A pessoa cria a própria senha pelo convite — a senha do ERP não vale no site.
      </p>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Ativos no NZERP</div>
          <div className={styles.metricValue}>{noErp}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Com acesso ao site</div>
          <div className={styles.metricValue}>{comAcesso}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Falta entrar</div>
          <div className={`${styles.metricValue} ${pendentes ? styles.metricValueWarning : ''}`}>{pendentes}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', alignItems: 'center', margin: '0 0 1rem' }}>
        <button className={styles.createBtn} onClick={() => void agir('sync', { op: 'sincronizar' }, () => setAviso('Sincronizado com o NZERP.'))} disabled={ocupado === 'sync'}>
          {ocupado === 'sync' ? 'Sincronizando…' : '↻ Sincronizar com o ERP'}
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#888' }}>
          <input type="checkbox" checked={porEmail} onChange={(e) => setPorEmail(e.target.checked)} />
          Enviar convite por e-mail (limite de 2/hora enquanto não houver SMTP próprio)
        </label>
      </div>

      {erro && <div className={styles.createError}>{erro}</div>}
      {aviso && <p className={styles.tabDescription}>{aviso}</p>}

      {link && (
        <div className={styles.createModal}>
          <h4 className={styles.createModalTitle}>Link de convite — {link.email}</h4>
          <p className={styles.tabDescription}>
            Vale 24 horas e serve uma vez só. Mande no WhatsApp da pessoa; ela abre e escolhe a própria senha.
          </p>
          <div className={styles.createField}>
            <input readOnly value={link.url} onFocus={(e) => e.currentTarget.select()} style={{ fontSize: '0.75rem' }} />
          </div>
          <div className={styles.createActions}>
            <button className={styles.createBtnCancel} onClick={() => setLink(null)}>
              Fechar
            </button>
            <button className={styles.createBtnConfirm} onClick={() => void copiarLink()}>
              {copiado ? 'Copiado ✓' : 'Copiar link'}
            </button>
          </div>
        </div>
      )}

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Papel no ERP</th>
              <th>Acesso ao site</th>
              <th>Convidado</th>
              <th>Último acesso</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pessoas.map((p) => (
              <tr key={p.email}>
                <td>{p.nome}</td>
                <td>{p.email}</td>
                <td>
                  {p.erpRole ?? '—'}
                  {p.erpUserId && !p.ativoErp && <span className={`${styles.badge} ${styles.badgePending}`}>inativo</span>}
                </td>
                <td>
                  <span className={`${styles.badge} ${STATUS_CLASSE[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                </td>
                <td>{data(p.convidadoEm)}</td>
                <td>{data(p.ultimoLogin ?? p.ultimoAcesso)}</td>
                <td>
                  {p.erpUserId && p.ativoErp && (p.status === 'sem-conta' || p.status === 'convidado' || p.status === 'bloqueado') && (
                    <button className={`${styles.actionBtn} ${styles.actionBtnApprove}`} onClick={() => void convidar(p)} disabled={ocupado === `convite:${p.email}`}>
                      {ocupado === `convite:${p.email}` ? '…' : p.status === 'sem-conta' ? '✉ Convidar' : '↻ Novo link'}
                    </button>
                  )}
                  {p.siteUserId && p.status === 'ativo' && (
                    <button
                      className={`${styles.actionBtn} ${styles.actionBtnDeny}`}
                      onClick={() => void agir(`off:${p.email}`, { op: 'desativar', siteUserId: p.siteUserId })}
                      disabled={ocupado === `off:${p.email}`}
                    >
                      🔒 Remover acesso
                    </button>
                  )}
                  {p.siteUserId && p.status === 'fora-do-erp' && (
                    <button
                      className={`${styles.actionBtn} ${styles.actionBtnDeny}`}
                      onClick={() => void agir(`off:${p.email}`, { op: 'desativar', siteUserId: p.siteUserId })}
                      disabled={ocupado === `off:${p.email}`}
                    >
                      🔒 Remover acesso
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!carregando && pessoas.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  Nenhum usuário encontrado no NZERP.
                </td>
              </tr>
            )}
            {carregando && (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  Carregando…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
