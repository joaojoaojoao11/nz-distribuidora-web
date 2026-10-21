// /painel/pontos — saldo, extrato, campanhas e os cupons já resgatados.
//
// O resgate está FECHADO desde 21/10/2026 (B1 do plano de indicação): ele
// gravava um cupom `tipo='cashback'` que a tabela recusa, então sempre
// falhava. Na Fase 2 o resgate vira crédito na carteira (D14). A tela mostra as
// campanhas e o saldo, e diz que o resgate chega em breve; o servidor também
// recusa (api/_lib/handlers/avaliacoes.ts). Histórico: docs/PLANO_PROVA_SOCIAL.md.

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BRL } from '../../lib/shop/precos';
import {
  meusPontos,
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
            <small>Em breve o crédito vai direto para a sua conta, para usar na próxima compra. Seus pontos ficam guardados.</small>
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
                        // B1: o botão "Resgatar" volta na Fase 2, como crédito na conta.
                        <span className={styles.mudo}>você já pode trocar · resgate em breve</span>
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
