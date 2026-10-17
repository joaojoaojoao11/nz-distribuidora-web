// O certificado de garantia — um componente só para o registro (prévia ao vivo
// e sucesso), o /validar-garantia e o que mais precisar mostrar uma garantia.
//
// Antes cada tela tinha o seu: o registro com um QR desenhado (um ícone, que
// não escaneava) e um "LOG:" em UTC; o validador com outro layout. O dourado
// aparece aqui uma vez só, no selo — é a "assinatura" do documento.
//
// `imprimivel` marca a cópia que o `window.print()` deve imprimir: as regras
// de @media print do módulo escondem a página e deixam só ela, em fundo branco.

import { useEffect, useState } from 'react';
import { LOGO_DA_LINHA, formatarDataISO, nomeDeExibicao, textoDaCobertura, urlDeValidacao, validaAte, type TipoLinha } from '../../lib/garantia';
import styles from './Certificado.module.css';

export interface DadosCertificado {
  produto: string;
  linha: string;
  servico: string;
  areas: string[];
  modelo: string;
  placa: string;
  aplicador: string;
  data: string;
  garantiaAnos: number;
  /** Sem código é prévia: o código e o QR só existem depois de emitir. */
  codigo?: string;
  /** Nome (no registro) ou CPF mascarado (no validador). */
  proprietario?: string;
}

interface Props {
  dados: DadosCertificado;
  compacto?: boolean;
  imprimivel?: boolean;
}

function Valor({ children }: { children: string }) {
  return children ? <dd>{children}</dd> : <dd className={styles.vazio}>—</dd>;
}

export default function Certificado({ dados, compacto = false, imprimivel = false }: Props) {
  const [qr, setQr] = useState<{ codigo: string; url: string } | null>(null);
  const movel = dados.servico === 'Movel/Eletro';
  const tipo: TipoLinha = dados.linha === 'NZWrap' ? 'NZWrap' : 'PPF';
  const ate = validaAte(dados.data, dados.garantiaAnos);
  const codigo = dados.codigo ?? '';

  useEffect(() => {
    if (!codigo || compacto) return;
    let vivo = true;
    // `qrcode` só entra quando há certificado emitido: não pesa no formulário.
    // O pacote é CommonJS: conforme o empacotamento, as funções vêm no
    // `default` ou direto no módulo.
    void import('qrcode').then((m) =>
      ((m as unknown as { default?: typeof m }).default ?? m).toDataURL(urlDeValidacao(codigo), {
        errorCorrectionLevel: 'M',
        margin: 0,
        width: 240,
        color: { dark: '#0a0a0a', light: '#ffffff' },
      }).then((url) => {
        if (vivo) setQr({ codigo, url });
      })
    );
    return () => {
      vivo = false;
    };
  }, [codigo, compacto]);

  const qrAtual = qr && qr.codigo === codigo ? qr.url : null;
  const classes = [styles.cert, compacto ? styles.compacto : '', imprimivel ? styles.imprimivel : ''].filter(Boolean).join(' ');

  return (
    <article className={classes} aria-label="Certificado de garantia">
      <header className={styles.topo}>
        <div>
          <img src={LOGO_DA_LINHA[tipo]} alt={tipo === 'PPF' ? 'NZPPF' : 'NZWRAP'} className={styles.logo} />
          <p className={styles.tipo}>Certificado de garantia</p>
        </div>
        <div className={styles.seloBloco}>
          <div className={styles.selo} aria-label={dados.garantiaAnos ? `${dados.garantiaAnos} anos de garantia` : 'Garantia'}>
            <span className={styles.seloNum}>{dados.garantiaAnos || '—'}</span>
            <span className={styles.seloRotulo}>{dados.garantiaAnos === 1 ? 'ano' : 'anos'}</span>
          </div>
          {!compacto && <span className={styles.slogan}>Elite protected</span>}
        </div>
      </header>

      <h3 className={dados.produto ? styles.produto : `${styles.produto} ${styles.vazio}`}>
        {dados.produto ? nomeDeExibicao(dados.produto) : 'Produto'}
      </h3>
      <p className={styles.validade}>
        {dados.garantiaAnos ? `${dados.garantiaAnos} anos de garantia` : 'Garantia'}
        {ate ? ` · válida até ${ate}` : ''}
      </p>

      <dl className={styles.dados}>
        <div className={styles.dado}>
          <dt>{movel ? 'Item' : 'Veículo'}</dt>
          <Valor>{dados.modelo}</Valor>
        </div>
        <div className={styles.dado}>
          <dt>{movel ? 'Identificação' : 'Placa / chassi'}</dt>
          <Valor>{dados.placa.toUpperCase()}</Valor>
        </div>
        <div className={`${styles.dado} ${styles.dadoLargo}`}>
          <dt>Cobertura</dt>
          <Valor>{textoDaCobertura(dados.servico, dados.areas)}</Valor>
        </div>
        <div className={styles.dado}>
          <dt>Aplicado por</dt>
          <Valor>{dados.aplicador}</Valor>
        </div>
        <div className={styles.dado}>
          <dt>Data da aplicação</dt>
          <Valor>{formatarDataISO(dados.data)}</Valor>
        </div>
        {dados.proprietario !== undefined && (
          <div className={`${styles.dado} ${styles.dadoLargo}`}>
            <dt>Proprietário</dt>
            <Valor>{dados.proprietario}</Valor>
          </div>
        )}
      </dl>

      {!compacto && (
        <footer className={styles.rodape}>
          <div className={styles.codigoBloco}>
            <span className={styles.codigoRotulo}>Código do certificado</span>
            {codigo ? <span className={styles.codigo}>{codigo}</span> : <span className={styles.vazio}>gerado ao emitir</span>}
            {codigo && <span className={styles.conferir}>Confira em nzgroup.com.br/validar-garantia</span>}
          </div>
          {codigo && (
            <div className={styles.qr}>
              {qrAtual ? <img src={qrAtual} alt="QR para conferir este certificado" width={88} height={88} /> : null}
            </div>
          )}
        </footer>
      )}
    </article>
  );
}
