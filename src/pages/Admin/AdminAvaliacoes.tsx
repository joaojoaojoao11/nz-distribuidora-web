// Admin → Avaliações: a fila de moderação e as campanhas de cashback.
//
// Nada é publicado sem passar por aqui. Duas coisas que a tela protege:
//
//   · **Não existe editar.** Só aprovar, recusar (com motivo) ou responder.
//     Avaliação editada pela loja é avaliação falsa com um passo a mais.
//   · **Recusar não é censurar nota baixa.** O motivo vai para o cliente na
//     conta dele — se a loja começar a recusar 1 estrela, isso vira visível.
//     Recuse o que é ofensa, spam ou dado errado, não o que é crítica.

import { useCallback, useEffect, useState } from 'react';
import {
  filaDeModeracao,
  listarCampanhasAdmin,
  moderar,
  responderAvaliacao,
  salvarCampanha,
  textoDoErro,
  type AvaliacaoPublica,
  type Campanha,
} from '../../lib/shop/avaliacoes';
import styles from './Admin.module.css';

type EmFila = AvaliacaoPublica & { status: string; motivo_recusa: string | null };

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const CAMPANHA_NOVA = { nome: '', descricao: '', pontos: 200, valor: 50, validadeDias: 90, limitePorUsuario: '', limiteTotal: '', ativo: true };

export default function AdminAvaliacoes() {
  const [aba, setAba] = useState<'pendente' | 'aprovada' | 'recusada'>('pendente');
  const [lista, setLista] = useState<EmFila[]>([]);
  const [pendentes, setPendentes] = useState(0);
  const [campanhas, setCampanhas] = useState<(Campanha & { ativo: boolean })[]>([]);
  const [rascunho, setRascunho] = useState<Record<string, unknown>>({ ...CAMPANHA_NOVA });
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState('');
  const [resposta, setResposta] = useState<Record<string, string>>({});

  const carregar = useCallback(async () => {
    try {
      const [f, c] = await Promise.all([filaDeModeracao(aba), listarCampanhasAdmin()]);
      setLista(f.avaliacoes);
      setPendentes(f.pendentes);
      setCampanhas(c.campanhas);
    } catch (e) {
      setMsg(textoDoErro(e));
    } finally {
      setCarregando(false);
    }
  }, [aba]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const decidir = async (a: EmFila, aprovar: boolean) => {
    let motivo: string | undefined;
    if (!aprovar) {
      const digitado = window.prompt(
        'Por que esta avaliação não vai ser publicada? O cliente lê este texto na conta dele.\n\nRecuse ofensa, spam ou dado errado — não recuse crítica.'
      );
      if (digitado === null) return;
      motivo = digitado.trim() || 'Não atende às regras de publicação.';
    }
    setOcupado(true);
    setMsg('');
    try {
      const r = await moderar(a.id, aprovar, motivo);
      await carregar();
      setMsg(
        aprovar
          ? `Publicada. ${r.pontosCreditados > 0 ? `${r.pontosCreditados} pontos creditados ao cliente.` : 'Os pontos já tinham sido creditados antes.'}`
          : 'Avaliação recusada e o motivo foi para o cliente.'
      );
    } catch (e) {
      setMsg(textoDoErro(e));
    } finally {
      setOcupado(false);
    }
  };

  const responder = async (id: string) => {
    const texto = (resposta[id] ?? '').trim();
    setOcupado(true);
    try {
      await responderAvaliacao(id, texto);
      await carregar();
      setMsg(texto ? 'Resposta publicada.' : 'Resposta removida.');
    } catch (e) {
      setMsg(textoDoErro(e));
    } finally {
      setOcupado(false);
    }
  };

  const salvar = async () => {
    setOcupado(true);
    setMsg('');
    try {
      await salvarCampanha(rascunho);
      setRascunho({ ...CAMPANHA_NOVA });
      await carregar();
      setMsg('Campanha salva.');
    } catch (e) {
      setMsg(textoDoErro(e));
    } finally {
      setOcupado(false);
    }
  };

  const campo = (chave: string, valor: unknown) => setRascunho((r) => ({ ...r, [chave]: valor }));

  if (carregando) return <p style={{ color: '#a1a1a6' }}>Carregando…</p>;

  return (
    <div>
      <p className={styles.tabDescription}>
        Avaliação de produto só aparece na loja depois de passar por aqui. Quem escreve é quem comprou — o servidor
        confere a compra antes de aceitar. <strong>Recuse ofensa, spam ou dado errado; não recuse crítica.</strong> Nota
        baixa publicada e bem respondida vende mais que catálogo só com cinco estrelas, que é o sinal de fraude mais
        conhecido que existe.
      </p>
      {msg && <p style={{ color: '#a1a1a6' }}>{msg}</p>}

      {/* --------------------------------------------------- moderação */}
      <div className={styles.tableSection}>
        <h3 className={styles.tableSectionTitle}>
          Avaliações
          {pendentes > 0 && <> — {pendentes} esperando</>}
        </h3>

        <div className={styles.createField} style={{ maxWidth: 320 }}>
          <label>Mostrar</label>
          <select value={aba} onChange={(e) => setAba(e.target.value as typeof aba)}>
            <option value="pendente">Esperando moderação</option>
            <option value="aprovada">Publicadas</option>
            <option value="recusada">Recusadas</option>
          </select>
        </div>

        {lista.length === 0 ? (
          <p style={{ color: '#a1a1a6' }}>Nada nesta lista.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Nota</th>
                  <th>Avaliação</th>
                  <th>Quem</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lista.map((a) => (
                  <tr key={a.id}>
                    <td style={{ maxWidth: 160 }}>{a.produto_slug}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{'★'.repeat(a.nota)}</td>
                    <td style={{ maxWidth: 420 }}>
                      {a.titulo && (
                        <>
                          <strong>{a.titulo}</strong>
                          <br />
                        </>
                      )}
                      {a.texto}
                      {a.foto_url && (
                        <>
                          <br />
                          <a href={a.foto_url} target="_blank" rel="noopener noreferrer">
                            ver foto
                          </a>
                        </>
                      )}
                      {a.motivo_recusa && (
                        <>
                          <br />
                          <span style={{ color: '#ff6b6b' }}>Recusada: {a.motivo_recusa}</span>
                        </>
                      )}
                      {a.status === 'aprovada' && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <input
                            placeholder="Resposta da NZ (aparece embaixo da avaliação)"
                            defaultValue={a.resposta_loja ?? ''}
                            onChange={(e) => setResposta((r) => ({ ...r, [a.id]: e.target.value }))}
                            style={{ width: '100%' }}
                          />
                          <button
                            type="button"
                            className={styles.actionBtn}
                            disabled={ocupado}
                            onClick={() => void responder(a.id)}
                          >
                            Salvar resposta
                          </button>
                        </div>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {a.autor_nome}
                      {a.autor_cidade ? (
                        <>
                          <br />
                          <span style={{ color: '#888', fontSize: '0.8em' }}>{a.autor_cidade}</span>
                        </>
                      ) : null}
                      {a.aplicador ? (
                        <>
                          <br />
                          <span style={{ color: '#888', fontSize: '0.8em' }}>aplicador</span>
                        </>
                      ) : null}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {a.status !== 'aprovada' && (
                        <button type="button" className={styles.actionBtn} disabled={ocupado} onClick={() => void decidir(a, true)}>
                          Publicar
                        </button>
                      )}
                      {a.status !== 'recusada' && (
                        <button type="button" className={styles.actionBtn} disabled={ocupado} onClick={() => void decidir(a, false)}>
                          Recusar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --------------------------------------------------- campanhas */}
      <div className={styles.tableSection}>
        <h3 className={styles.tableSectionTitle}>Campanhas de cashback</h3>
        <p className={styles.tabDescription}>
          Quanto vale trocar pontos por crédito. O crédito sai como <strong>cupom de valor, nominal ao cliente</strong> —
          só ele consegue usar. Não sai dinheiro da conta: a chave do Asaas foi guardada sem permissão de saque, de
          propósito.
        </p>

        {campanhas.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Campanha</th>
                  <th>Pontos</th>
                  <th>Crédito</th>
                  <th>Validade</th>
                  <th>Resgatados</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {campanhas.map((c) => (
                  <tr key={c.id}>
                    <td>
                      {c.nome}
                      {!c.ativo && <span style={{ color: '#888' }}> (desligada)</span>}
                      {c.descricao ? (
                        <>
                          <br />
                          <span style={{ color: '#888', fontSize: '0.85em' }}>{c.descricao}</span>
                        </>
                      ) : null}
                    </td>
                    <td>{c.pontos}</td>
                    <td>{BRL.format(Number(c.valor))}</td>
                    <td>{c.validade_dias} dias</td>
                    <td>
                      {c.resgatados}
                      {c.limite_total ? ` / ${c.limite_total}` : ''}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        disabled={ocupado}
                        onClick={() => void salvarCampanha({ id: c.id, nome: c.nome, descricao: c.descricao, pontos: c.pontos, valor: c.valor, validadeDias: c.validade_dias, limitePorUsuario: c.limite_por_usuario, limiteTotal: c.limite_total, ativo: !c.ativo }).then(carregar)}
                      >
                        {c.ativo ? 'Desligar' : 'Ligar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h4 style={{ marginTop: '1.25rem' }}>Nova campanha</h4>
        <div className={styles.createGrid}>
          <div className={styles.createField}>
            <label>Nome</label>
            <input value={String(rascunho.nome ?? '')} onChange={(e) => campo('nome', e.target.value)} placeholder="R$ 50 de crédito" />
          </div>
          <div className={styles.createField}>
            <label>Pontos necessários</label>
            <input type="number" min={1} value={String(rascunho.pontos ?? '')} onChange={(e) => campo('pontos', e.target.value)} />
          </div>
          <div className={styles.createField}>
            <label>Crédito (R$)</label>
            <input type="number" min={1} step="0.01" value={String(rascunho.valor ?? '')} onChange={(e) => campo('valor', e.target.value)} />
          </div>
          <div className={styles.createField}>
            <label>Validade do cupom (dias)</label>
            <input type="number" min={1} value={String(rascunho.validadeDias ?? '')} onChange={(e) => campo('validadeDias', e.target.value)} />
          </div>
          <div className={styles.createField}>
            <label>Limite por cliente</label>
            <input type="number" min={1} value={String(rascunho.limitePorUsuario ?? '')} onChange={(e) => campo('limitePorUsuario', e.target.value)} placeholder="sem limite" />
          </div>
          <div className={styles.createField}>
            <label>Limite total</label>
            <input type="number" min={1} value={String(rascunho.limiteTotal ?? '')} onChange={(e) => campo('limiteTotal', e.target.value)} placeholder="sem limite" />
          </div>
          <div className={styles.createField} style={{ gridColumn: '1 / -1' }}>
            <label>Descrição</label>
            <input value={String(rascunho.descricao ?? '')} onChange={(e) => campo('descricao', e.target.value)} placeholder="Como o cliente usa o crédito" />
          </div>
        </div>
        <button type="button" className={styles.actionBtn} disabled={ocupado} onClick={() => void salvar()}>
          {ocupado ? 'Salvando…' : 'Criar campanha'}
        </button>
      </div>
    </div>
  );
}
