// /painel/pontos — saldo, extrato, campanhas e os cupons já resgatados.
//
// Desde a Fase 2 do plano de indicação (21/10/2026) o resgate vira CRÉDITO NA
// CARTEIRA (D14): os pontos saem daqui e o valor entra em "Indique e ganhe".
// Antes (até 20/10) o resgate gravava um cupom `tipo='cashback'` que a tabela
// recusava — sempre falhava (B1). Histórico: docs/PLANO_PROVA_SOCIAL.md.

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BRL } from '../../lib/shop/precos';
import {
  meusPontos,
  resgatarCampanha,
  textoDoErro,
  type Campanha,
  type CupomDoCliente,
  type MovimentoDePonto,
  type RegrasDePonto,
} from '../../lib/shop/avaliacoes';
import styles from './Painel.module.css';

const MOTIVO: Record<string, string> = {
  avaliacao: 'Avaliação publicada',
  resgate: 'Resgate de cashback',
  ajuste: 'Ajuste da NZ',
  estorno: 'Estorno',
};

const dia = (s: string) => new Date(s).toLocaleDateString('pt-BR');

export default function PainelPontos() {
  const { user } = useAuth();
  const [saldo, setSaldo] = useState(0);
  const [extrato, setExtrato] = useState<MovimentoDePonto[]>([]);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [cupons, setCupons] = useState<CupomDoCliente[]>([]);
  const [regras, setRegras] = useState<RegrasDePonto | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!user) return;
    try {
      const r = await meusPontos();
      setSaldo(r.saldo);
      setExtrato(r.extrato);
      setCampanhas(r.campanhas);
      setCupons(r.cupons);
      setRegras(r.regras);
    } catch (e) {
      setAviso(textoDoErro(e));
    } finally {
      setCarregando(false);
    }
  }, [user]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const resgatar = async (c: Campanha) => {
    if (!window.confirm(`Trocar ${c.pontos} pontos por ${BRL.format(c.valor)} de crédito na sua carteira?`)) return;
    setOcupado(c.id);
    setAviso(null);
    try {
      const r = await resgatarCampanha(c.id);
      await carregar();
      setAviso(`Pronto: ${BRL.format(r.valor)} entraram na sua carteira. Veja em "Indique e ganhe".`);
    } catch (e) {
      setAviso(textoDoErro(e));
    } finally {
      setOcupado(null);
    }
  };

  const copiar = async (codigo: string) => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(codigo);
      setTimeout(() => setCopiado((c) => (c === codigo ? null : c)), 1800);
    } catch {
      /* área de transferência bloqueada: o código continua selecionável */
    }
  };

  if (carregando) return <p className={styles.mudo}>Carregando…</p>;

  return (
    <>
      {aviso && <p className={styles.aviso}>{aviso}</p>}

      <div className={styles.saldoPontos}>
        <span className={styles.saldoNumero}>{saldo.toLocaleString('pt-BR')}</span>
        <span className={styles.saldoRotulo}>pontos disponíveis</span>
        {regras && (
          <span className={styles.mudo}>
            Cada avaliação publicada vale {regras.base} pontos, +{regras.textoLongo} quando você conta bem como usou.
            Os pontos não dependem da nota que você dá.
          </span>
        )}
      </div>

      {saldo === 0 && (
        <p className={styles.convitePontos}>
          Você ainda não tem pontos.{' '}
          <Link to="/painel/avaliacoes" className={styles.linkForte}>
            Avalie o que já comprou
          </Link>{' '}
          para começar.
        </p>
      )}

      {campanhas.length > 0 && (
        <>
          <h3 className={styles.secaoTitulo}>
            Trocar por crédito
            <small>O crédito entra na sua carteira (Indique e ganhe) e vale por 12 meses.</small>
          </h3>
          <ul className={styles.cartoes}>
            {campanhas.map((c) => {
              const falta = c.pontos - saldo;
              return (
                <li key={c.id} className={styles.cartaoPedido}>
                  <div className={styles.cartaoTopo}>
                    <span className={styles.cartaoNumero}>{c.nome}</span>
                    <span className={styles.cartaoData}>{c.pontos.toLocaleString('pt-BR')} pontos</span>
                  </div>
                  {c.descricao && <p className={styles.itensErp}>{c.descricao}</p>}
                  <div className={styles.cartaoRodape}>
                    <span className={styles.cartaoTotal}>
                      {BRL.format(c.valor)}
                      <small> de crédito · vale {c.validade_dias} dias</small>
                    </span>
                    <div className={styles.cartaoAcoes}>
                      {falta > 0 ? (
                        <span className={styles.mudo}>faltam {falta.toLocaleString('pt-BR')} pontos</span>
                      ) : (
                        <button type="button" className={styles.botaoPrincipal} disabled={ocupado === c.id} onClick={() => void resgatar(c)}>
                          {ocupado === c.id ? 'Resgatando…' : 'Resgatar'}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {cupons.length > 0 && (
        <>
          <h3 className={styles.secaoTitulo}>Seus cupons</h3>
          <ul className={styles.cartoes}>
            {cupons.map((c) => {
              const usado = c.limite_usos != null && c.usos >= c.limite_usos;
              const vencido = Boolean(c.valido_ate && c.valido_ate < new Date().toISOString().slice(0, 10));
              const morto = usado || vencido || !c.ativo;
              return (
                <li key={c.codigo} className={styles.cartaoPedido}>
                  <div className={styles.cartaoTopo}>
                    <span className={styles.cartaoNumero}>{c.codigo}</span>
                    <span className={`${styles.pagChip} ${morto ? styles.pagRuim : styles.pagOk}`}>
                      {usado ? 'Usado' : vencido ? 'Vencido' : 'Disponível'}
                    </span>
                  </div>
                  <div className={styles.cartaoRodape}>
                    <span className={styles.cartaoTotal}>
                      {c.desconto_valor != null ? BRL.format(Number(c.desconto_valor)) : '—'}
                      {c.valido_ate ? <small> até {dia(c.valido_ate)}</small> : null}
                    </span>
                    {!morto && (
                      <div className={styles.cartaoAcoes}>
                        <button type="button" className={styles.botaoSecundario} onClick={() => void copiar(c.codigo)}>
                          {copiado === c.codigo ? 'Copiado' : 'Copiar código'}
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {extrato.length > 0 && (
        <>
          <h3 className={styles.secaoTitulo}>Extrato</h3>
          <ul className={styles.cartoes}>
            {extrato.map((m) => (
              <li key={m.id} className={styles.linhaExtrato}>
                <span className={styles.extratoQuando}>{dia(m.criado_em)}</span>
                <span className={styles.extratoQue}>{m.descricao || MOTIVO[m.motivo] || m.motivo}</span>
                <span className={`${styles.extratoPontos} ${m.pontos > 0 ? styles.extratoMais : styles.extratoMenos}`}>
                  {m.pontos > 0 ? '+' : ''}
                  {m.pontos.toLocaleString('pt-BR')}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
