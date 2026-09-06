// Escolha da forma de pagamento: três abas (Pix, cartão, boleto) com o que
// decide a escolha em uma linha, e o formulário do cartão.
//
// Usado no checkout e na página do pedido (novo pagamento). O estado do cartão
// vive aqui, no componente, e vai embora com ele: nada em contexto, nada em
// storage. Validação local (Luhn, validade, CVV) só para evitar ida ao servidor
// com erro de digitação — quem aprova é o Asaas.

import { useId, useState } from 'react';
import { BRL } from '../../lib/shop/precos';
import { bandeiraDoNumero, errosDoCartao, formatarNumeroCartao, formatarValidade, type DadosCartaoForm, type Forma } from '../../lib/shop/checkout';
import { formatarCpfCnpj } from '../../lib/documento';
import styles from './FormaPagamento.module.css';

export interface EscolhaPagamento {
  forma: Forma;
  parcelas: number;
  cartao: DadosCartaoForm;
}

interface Props {
  valor: EscolhaPagamento;
  onChange: (v: EscolhaPagamento) => void;
  parcelas: { n: number; valor: number }[];
  total: number;
  pixExpiraMin: number;
  boletoVencimentoDias: number;
  boletoMinimo: number;
  cpfPadrao?: string;
  desabilitado?: boolean;
}

export default function FormaPagamento({ valor, onChange, parcelas, total, pixExpiraMin, boletoVencimentoDias, boletoMinimo, cpfPadrao, desabilitado }: Props) {
  const id = useId();
  const [tocado, setTocado] = useState<Partial<Record<keyof DadosCartaoForm, boolean>>>({});
  const erros = errosDoCartao(valor.cartao);
  const bandeira = bandeiraDoNumero(valor.cartao.numero);
  const boletoOk = total >= boletoMinimo;

  const setForma = (forma: Forma) => {
    if (desabilitado) return;
    onChange({ ...valor, forma, cartao: forma === 'CREDIT_CARD' ? { ...valor.cartao, cpf: valor.cartao.cpf || cpfPadrao || '' } : valor.cartao });
  };
  const setCartao = (k: keyof DadosCartaoForm, v: string) => onChange({ ...valor, cartao: { ...valor.cartao, [k]: v } });

  const abas: { forma: Forma; titulo: string; linha: string; ok: boolean }[] = [
    { forma: 'PIX', titulo: 'Pix', linha: `Aprovação na hora · código vale ${pixExpiraMin} min`, ok: true },
    { forma: 'CREDIT_CARD', titulo: 'Cartão', linha: parcelas.length > 1 ? `Até ${parcelas[parcelas.length - 1].n}x sem juros` : 'À vista, aprovação na hora', ok: true },
    { forma: 'BOLETO', titulo: 'Boleto', linha: boletoOk ? `Vence em ${boletoVencimentoDias} dias úteis · compensa em até 3 dias úteis` : `Só a partir de ${BRL.format(boletoMinimo)}`, ok: boletoOk },
  ];

  return (
    <div className={styles.wrap}>
      <div className={styles.abas} role="tablist" aria-label="Forma de pagamento">
        {abas.map((a) => (
          <button
            key={a.forma}
            type="button"
            role="tab"
            aria-selected={valor.forma === a.forma}
            className={`${styles.aba} ${valor.forma === a.forma ? styles.abaAtiva : ''}`}
            onClick={() => setForma(a.forma)}
            disabled={desabilitado || !a.ok}
          >
            <span className={styles.abaTitulo}>{a.titulo}</span>
            <span className={styles.abaLinha}>{a.linha}</span>
          </button>
        ))}
      </div>

      {valor.forma === 'PIX' && (
        <p className={styles.nota}>
          Você recebe o QR Code e o código "copia e cola" na próxima tela. Assim que o banco confirmar, o pedido entra em separação.
        </p>
      )}

      {valor.forma === 'BOLETO' && (
        <p className={styles.nota}>
          O boleto é gerado na hora, com linha digitável e PDF. O pedido só é separado depois que o banco compensar o pagamento
          (até 3 dias úteis). Também enviamos por e-mail.
        </p>
      )}

      {valor.forma === 'CREDIT_CARD' && (
        <div className={styles.cartao}>
          <label className={`${styles.campo} ${styles.campoLargo}`} htmlFor={`${id}-numero`}>
            <span>Número do cartão {bandeira ? `· ${bandeira}` : ''}</span>
            <input
              id={`${id}-numero`}
              className={tocado.numero && erros.numero ? styles.inputErro : ''}
              value={formatarNumeroCartao(valor.cartao.numero)}
              onChange={(e) => setCartao('numero', e.target.value.replace(/\D/g, ''))}
              onBlur={() => setTocado((t) => ({ ...t, numero: true }))}
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="0000 0000 0000 0000"
              disabled={desabilitado}
            />
            {tocado.numero && erros.numero && <small>{erros.numero}</small>}
          </label>
          <label className={`${styles.campo} ${styles.campoLargo}`} htmlFor={`${id}-nome`}>
            <span>Nome impresso no cartão</span>
            <input
              id={`${id}-nome`}
              className={tocado.nome && erros.nome ? styles.inputErro : ''}
              value={valor.cartao.nome}
              onChange={(e) => setCartao('nome', e.target.value.toUpperCase())}
              onBlur={() => setTocado((t) => ({ ...t, nome: true }))}
              autoComplete="cc-name"
              autoCapitalize="characters"
              disabled={desabilitado}
            />
            {tocado.nome && erros.nome && <small>{erros.nome}</small>}
          </label>
          <label className={styles.campo} htmlFor={`${id}-validade`}>
            <span>Validade</span>
            <input
              id={`${id}-validade`}
              className={tocado.validade && erros.validade ? styles.inputErro : ''}
              value={formatarValidade(valor.cartao.validade)}
              onChange={(e) => setCartao('validade', formatarValidade(e.target.value))}
              onBlur={() => setTocado((t) => ({ ...t, validade: true }))}
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/AA"
              disabled={desabilitado}
            />
            {tocado.validade && erros.validade && <small>{erros.validade}</small>}
          </label>
          <label className={styles.campo} htmlFor={`${id}-cvv`}>
            <span>CVV</span>
            <input
              id={`${id}-cvv`}
              className={tocado.cvv && erros.cvv ? styles.inputErro : ''}
              value={valor.cartao.cvv}
              onChange={(e) => setCartao('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
              onBlur={() => setTocado((t) => ({ ...t, cvv: true }))}
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="123"
              disabled={desabilitado}
            />
            {tocado.cvv && erros.cvv && <small>{erros.cvv}</small>}
          </label>
          <label className={styles.campo} htmlFor={`${id}-cpf`}>
            <span>CPF/CNPJ do titular</span>
            <input
              id={`${id}-cpf`}
              className={tocado.cpf && erros.cpf ? styles.inputErro : ''}
              value={formatarCpfCnpj(valor.cartao.cpf)}
              onChange={(e) => setCartao('cpf', e.target.value.replace(/\D/g, '').slice(0, 14))}
              onBlur={() => setTocado((t) => ({ ...t, cpf: true }))}
              inputMode="numeric"
              disabled={desabilitado}
            />
            {tocado.cpf && erros.cpf && <small>{erros.cpf}</small>}
          </label>
          <label className={styles.campo} htmlFor={`${id}-parcelas`}>
            <span>Parcelas</span>
            <select id={`${id}-parcelas`} value={valor.parcelas} onChange={(e) => onChange({ ...valor, parcelas: Number(e.target.value) })} disabled={desabilitado}>
              {parcelas.map((p) => (
                <option key={p.n} value={p.n}>
                  {p.n}x de {BRL.format(p.valor)} {p.n > 1 ? 'sem juros' : 'à vista'}
                </option>
              ))}
            </select>
          </label>
          <p className={styles.seguro}>Os dados do cartão vão direto para o processador de pagamento e não ficam guardados na NZ.</p>
        </div>
      )}
    </div>
  );
}
