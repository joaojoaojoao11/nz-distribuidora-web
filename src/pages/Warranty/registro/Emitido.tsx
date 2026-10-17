// Tela final: o certificado de verdade (com QR que escaneia), as ações e os
// cuidados. A página sobe para o topo e o foco vai para o título — antes ela
// ficava rolada no fim e mostrava o bloco antifraude no lugar do certificado.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Copy, Printer, Send } from 'lucide-react';
import Certificado, { type DadosCertificado } from '../Certificado';
import Cuidados from './Cuidados';
import { copiar } from '../../../lib/shop/checkout';
import { nomeDeExibicao, urlDeValidacao } from '../../../lib/garantia';
import styles from './Registro.module.css';

interface Props {
  dados: DadosCertificado & { codigo: string };
  email: string;
  logado: boolean;
  onOutra: () => void;
}

export default function Emitido({ dados, email, logado, onOutra }: Props) {
  const titulo = useRef<HTMLHeadingElement>(null);
  const [copiado, setCopiado] = useState(false);
  const url = urlDeValidacao(dados.codigo);
  const resumo = `Certificado de garantia ${nomeDeExibicao(dados.produto)} — ${dados.modelo} ${dados.placa}`.trim();

  useEffect(() => {
    window.scrollTo({ top: 0 });
    titulo.current?.focus({ preventScroll: true });
  }, []);

  const enviar = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'Certificado de garantia NZ', text: resumo, url });
        return;
      } catch (e) {
        // Cancelar o compartilhamento não é erro; outra falha cai no WhatsApp.
        if (e instanceof DOMException && e.name === 'AbortError') return;
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${resumo}\nConfira em: ${url}`)}`, '_blank', 'noopener');
  };

  const copiarLink = async () => {
    if (await copiar(url)) {
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2200);
    }
  };

  const cadastro = `/cadastro?next=${encodeURIComponent('/painel/garantias')}${email ? `&email=${encodeURIComponent(email)}` : ''}`;

  return (
    <div>
      <p className={styles.eyebrow}>Garantia NZ</p>
      <div className={styles.emitidoTopo}>
        <span className={styles.emitidoIcone} aria-hidden="true">
          <CheckCircle2 size={24} />
        </span>
        <div>
          <h1 className={styles.emitidoTitulo} ref={titulo} tabIndex={-1}>
            Garantia registrada
          </h1>
          <p className={styles.emitidoTexto}>O certificado já vale. Qualquer pessoa confere com o código ou pelo QR.</p>
        </div>
      </div>

      <Certificado dados={dados} imprimivel />

      <div className={styles.emitidoAcoes}>
        <button type="button" className={styles.primario} onClick={() => void enviar()}>
          <Send size={16} aria-hidden="true" /> Enviar certificado
        </button>
        <button type="button" className={styles.secundario} onClick={() => window.print()}>
          <Printer size={16} aria-hidden="true" /> Salvar PDF ou imprimir
        </button>
        <button type="button" className={styles.secundario} onClick={() => void copiarLink()} aria-live="polite">
          <Copy size={16} aria-hidden="true" /> {copiado ? 'Link copiado' : 'Copiar link'}
        </button>
      </div>

      {logado ? (
        <p className={styles.conta}>
          Se o CPF ou o e-mail forem os da sua conta, esta garantia aparece no seu painel.
          <Link to="/painel/garantias">Minhas garantias</Link>
        </p>
      ) : (
        <p className={styles.conta}>
          Crie uma conta {email ? `com ${email} ` : ''}para ter o certificado sempre à mão no painel.
          <Link to={cadastro}>Criar conta</Link>
        </p>
      )}

      <button type="button" className={styles.outra} onClick={onOutra}>
        Registrar outra garantia
      </button>

      <Cuidados tipo={dados.linha === 'NZWrap' ? 'NZWrap' : 'PPF'} movel={dados.servico === 'Movel/Eletro'} aberto />
    </div>
  );
}
