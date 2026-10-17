// Tela final do registro: o PROTOCOLO, não o certificado. A garantia só vale
// depois que alguém do admin aprova; aprovada, o certificado vai por e-mail.
//
// O comprovante usa as mesmas peças do certificado (Certificado.module.css),
// inclusive a impressão: "Salvar comprovante" imprime só ele, em fundo branco.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, Copy, Printer } from 'lucide-react';
import Cuidados from './Cuidados';
import { copiar } from '../../../lib/shop/checkout';
import { LOGO_DA_LINHA, dataHoraBr, formatarDataISO, nomeDeExibicao, textoDaCobertura } from '../../../lib/garantia';
import type { DadosCertificado } from '../Certificado';
import doc from '../Certificado.module.css';
import styles from './Registro.module.css';

interface Props {
  protocolo: string;
  criadoEm: string;
  dados: DadosCertificado;
  email: string;
  /** O e-mail com o protocolo saiu. */
  emailEnviado: boolean;
  logado: boolean;
  onOutra: () => void;
}

export default function Protocolo({ protocolo, criadoEm, dados, email, emailEnviado, logado, onOutra }: Props) {
  const titulo = useRef<HTMLHeadingElement>(null);
  const [copiado, setCopiado] = useState(false);
  const movel = dados.servico === 'Movel/Eletro';
  const tipo = dados.linha === 'NZWrap' ? 'NZWrap' : 'PPF';

  useEffect(() => {
    window.scrollTo({ top: 0 });
    titulo.current?.focus({ preventScroll: true });
  }, []);

  const copiarProtocolo = async () => {
    if (await copiar(protocolo)) {
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2200);
    }
  };

  const passos = [
    { feito: true, titulo: 'Registro recebido', texto: 'Você está aqui.' },
    { feito: false, titulo: 'Conferência da NZ', texto: `Confirmamos a aplicação com ${dados.aplicador || 'o aplicador'}.` },
    { feito: false, titulo: 'Certificado no seu e-mail', texto: 'Com código único e QR para qualquer pessoa conferir.' },
  ];

  return (
    <div>
      <p className={styles.eyebrow}>Garantia NZ</p>
      <div className={styles.emitidoTopo}>
        <span className={styles.protocoloIcone} aria-hidden="true">
          <Clock3 size={22} />
        </span>
        <div>
          <h1 className={styles.emitidoTitulo} ref={titulo} tabIndex={-1}>
            Registro recebido
          </h1>
          <p className={styles.emitidoTexto}>
            A NZ vai conferir os dados com o aplicador. Aprovada, a garantia chega com o certificado em <strong>{email}</strong>.
          </p>
        </div>
      </div>

      <article className={`${doc.cert} ${doc.imprimivel}`} aria-label="Comprovante de registro de garantia">
        <header className={doc.topo}>
          <div>
            <img src={LOGO_DA_LINHA[tipo]} alt={tipo === 'PPF' ? 'NZPPF' : 'NZWRAP'} className={doc.logo} />
            <p className={doc.tipo}>Comprovante de registro</p>
          </div>
          <span className={doc.situacao}>Em análise</span>
        </header>

        <p className={doc.protocoloRotulo}>Protocolo</p>
        <p className={doc.protocolo}>{protocolo}</p>
        <p className={doc.validade}>Registrado em {dataHoraBr(criadoEm)}</p>

        <dl className={doc.dados}>
          <div className={doc.dado}>
            <dt>Produto</dt>
            <dd>
              {nomeDeExibicao(dados.produto)} · {dados.garantiaAnos} anos
            </dd>
          </div>
          <div className={doc.dado}>
            <dt>Cobertura</dt>
            <dd>{textoDaCobertura(dados.servico, dados.areas)}</dd>
          </div>
          <div className={doc.dado}>
            <dt>{movel ? 'Item' : 'Veículo'}</dt>
            <dd>{dados.modelo}</dd>
          </div>
          <div className={doc.dado}>
            <dt>{movel ? 'Identificação' : 'Placa / chassi'}</dt>
            <dd>{dados.placa.toUpperCase()}</dd>
          </div>
          <div className={doc.dado}>
            <dt>Aplicado por</dt>
            <dd>{dados.aplicador}</dd>
          </div>
          <div className={doc.dado}>
            <dt>Data da aplicação</dt>
            <dd>{formatarDataISO(dados.data)}</dd>
          </div>
          <div className={`${doc.dado} ${doc.dadoLargo}`}>
            <dt>Proprietário</dt>
            <dd>{dados.proprietario}</dd>
          </div>
          <div className={`${doc.dado} ${doc.dadoLargo}`}>
            <dt>Certificado será enviado para</dt>
            <dd>{email}</dd>
          </div>
        </dl>
      </article>

      <ol className={styles.passosProtocolo}>
        {passos.map((p, i) => (
          <li key={p.titulo} className={p.feito ? styles.passoFeito : undefined}>
            <span className={styles.passoMarca} aria-hidden="true">
              {p.feito ? '✓' : i + 1}
            </span>
            <span>
              <strong>{p.titulo}</strong>
              {p.texto}
            </span>
          </li>
        ))}
      </ol>

      <div className={styles.emitidoAcoes}>
        <button type="button" className={styles.primario} onClick={() => window.print()}>
          <Printer size={16} aria-hidden="true" /> Salvar comprovante
        </button>
        <button type="button" className={styles.secundario} onClick={() => void copiarProtocolo()} aria-live="polite">
          <Copy size={16} aria-hidden="true" /> {copiado ? 'Protocolo copiado' : 'Copiar protocolo'}
        </button>
      </div>

      <p className={styles.conta}>
        {emailEnviado ? `Mandamos o protocolo para ${email}. ` : 'Guarde o número do protocolo. '}
        {logado ? 'Você acompanha a análise no seu painel.' : 'Com uma conta neste e-mail, você acompanha a análise no painel.'}
        <Link to={logado ? '/painel/garantias' : `/cadastro?next=${encodeURIComponent('/painel/garantias')}&email=${encodeURIComponent(email)}`}>
          {logado ? 'Minhas garantias' : 'Criar conta'}
        </Link>
      </p>

      <button type="button" className={styles.outra} onClick={onOutra}>
        Registrar outra garantia
      </button>

      <Cuidados tipo={tipo} movel={movel} aberto />
    </div>
  );
}
