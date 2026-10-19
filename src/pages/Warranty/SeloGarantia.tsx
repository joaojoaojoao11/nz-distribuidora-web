// /s/:codigo — o que abre quando alguém escaneia o QR do selo NZPPF colado no
// batente da porta (19/10/2026). O código do selo é o próprio endereço.
//
// A resposta é da RPC `conferir_selo` (migrations/2026-10-19_selos_garantia.sql),
// que devolve só o ESTADO do selo, nunca dados da garantia:
//   livre ............ selo autêntico, ainda sem garantia
//   em_analise ....... ligado a uma garantia que a NZ ainda está conferindo
//                      (mostra só a data do registro: sem placa e sem nome)
//   verificada ....... garantia aprovada → vai para /validar-garantia
//   cancelado ........ cancelado pela NZ
//   nao_reconhecido .. código que não existe (possível falsificação)
// Decisões do João (19/10): sem botão de registrar na tela do selo livre.
//
// O QR imprime o endereço em caixa-alta (HTTPS://NZGROUP.COM.BR/S/7KQ2XM9P);
// a rota do React não diferencia maiúscula e o servidor (api/render.ts) também não.

import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Clock3, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import SEO from '../../components/SEO/SEO';
import { supabase } from '../../lib/supabase';
import { VENDAS, linkWhatsApp } from '../../lib/contatos';
import { formatarSelo, limparSelo } from '../../lib/garantia';
import base from './WarrantyValidator.module.css';
import styles from './SeloGarantia.module.css';

type EstadoSelo = 'livre' | 'em_analise' | 'verificada' | 'cancelado' | 'nao_reconhecido';

interface Linha {
  estado: EstadoSelo;
  modelo: 'A' | 'B' | null;
  registrado_em: string | null;
  codigo_autenticacao: string | null;
}

type Tela = { tipo: 'buscando' } | { tipo: 'erro' } | { tipo: 'pronto'; linha: Linha };

const MODELO: Record<'A' | 'B', string> = { A: 'Prata holográfico', B: 'Black com faixa holográfica' };

const dataBr = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' });

export default function SeloGarantia() {
  const { codigo: bruto = '' } = useParams();
  const codigo = limparSelo(bruto);
  const [tentativa, setTentativa] = useState(0);
  // O resultado guardado só vale para o código (e a tentativa) da tela agora.
  const chave = `${codigo}#${tentativa}`;
  const [resultado, setResultado] = useState<{ chave: string; tela: Tela } | null>(null);

  useEffect(() => {
    let vivo = true;
    void supabase.rpc('conferir_selo', { p_codigo: codigo }).then(({ data, error }) => {
      if (!vivo) return;
      const linha = (Array.isArray(data) ? data[0] : data) as Linha | null | undefined;
      setResultado({ chave, tela: error || !linha ? { tipo: 'erro' } : { tipo: 'pronto', linha } });
    });
    return () => {
      vivo = false;
    };
  }, [codigo, chave]);

  const tela: Tela = resultado && resultado.chave === chave ? resultado.tela : { tipo: 'buscando' };

  const impresso = formatarSelo(codigo) || bruto.toUpperCase();
  const ajuda = (texto: string) => (
    <p className={base.ajuda}>
      Dúvidas?{' '}
      <a href={linkWhatsApp(VENDAS[0]!, texto)} target="_blank" rel="noopener noreferrer">
        Fale com a NZ pelo WhatsApp
      </a>
      .
    </p>
  );

  if (tela.tipo === 'pronto' && tela.linha.estado === 'verificada' && tela.linha.codigo_autenticacao) {
    return <Navigate to={`/validar-garantia?id=${encodeURIComponent(tela.linha.codigo_autenticacao)}`} replace />;
  }

  const linha = tela.tipo === 'pronto' ? tela.linha : null;
  const modelo = linha?.modelo ? MODELO[linha.modelo] : null;

  return (
    <div className={base.pagina}>
      <SEO title="Selo de garantia NZPPF" description="Conferência do selo de garantia NZPPF colado no veículo." canonicalUrl={`/s/${codigo}`} noindex />

      <header className={base.topo}>
        <p className={base.eyebrow}>Selo de garantia NZPPF</p>
        <h1 className={base.titulo}>Conferência do selo</h1>
      </header>

      {tela.tipo === 'buscando' && (
        <div className={base.esqueleto} aria-busy="true" aria-live="polite">
          <span className={base.srOnly}>Conferindo o selo {impresso}…</span>
          <div />
          <div />
          <div />
        </div>
      )}

      {tela.tipo === 'erro' && (
        <>
          <div className={base.status} role="status">
            <span className={base.statusIconeAviso} aria-hidden="true">
              <ShieldAlert size={22} />
            </span>
            <div>
              <p className={base.statusTitulo}>Não conseguimos conferir agora</p>
              <p className={base.statusTexto}>Confira a internet e tente de novo.</p>
            </div>
          </div>
          <button type="button" className={base.secundario} onClick={() => setTentativa((n) => n + 1)}>
            Tentar de novo
          </button>
        </>
      )}

      {linha?.estado === 'livre' && (
        <>
          <div className={base.status} role="status">
            <span className={base.statusIconeOk} aria-hidden="true">
              <ShieldCheck size={22} />
            </span>
            <div>
              <p className={base.statusTitulo}>Selo autêntico NZPPF</p>
              <p className={base.statusTexto}>Este selo é original da NZ e ainda não está vinculado a nenhuma garantia.</p>
            </div>
          </div>
          <Ficha codigo={impresso} modelo={modelo} situacao="Sem garantia vinculada" />
        </>
      )}

      {linha?.estado === 'em_analise' && (
        <>
          <div className={base.status} role="status">
            <span className={styles.iconeAnalise} aria-hidden="true">
              <Clock3 size={22} />
            </span>
            <div>
              <p className={base.statusTitulo}>Selo em análise</p>
              <p className={base.statusTexto}>Este selo está vinculado a uma garantia que a NZ está conferindo. Aprovada, este QR passa a mostrar o certificado.</p>
            </div>
          </div>
          <Ficha codigo={impresso} modelo={modelo} situacao="Garantia em análise" registro={linha.registrado_em ? dataBr(linha.registrado_em) : null} />
        </>
      )}

      {/* Aprovada sem código (não deveria acontecer): trata como em análise, sem link. */}
      {linha?.estado === 'verificada' && !linha.codigo_autenticacao && <Ficha codigo={impresso} modelo={modelo} situacao="Garantia aprovada" />}

      {linha?.estado === 'cancelado' && (
        <>
          <div className={base.status} role="status">
            <span className={styles.iconeErro} aria-hidden="true">
              <ShieldX size={22} />
            </span>
            <div>
              <p className={base.statusTitulo}>Selo cancelado</p>
              <p className={base.statusTexto}>Este selo foi cancelado pela NZ e não vale como garantia.</p>
            </div>
          </div>
          <Ficha codigo={impresso} modelo={modelo} situacao="Cancelado" />
          {ajuda(`Olá! Escaneei o selo de garantia ${impresso} e ele aparece como cancelado.`)}
        </>
      )}

      {linha?.estado === 'nao_reconhecido' && (
        <>
          <div className={base.status} role="status">
            <span className={styles.iconeErro} aria-hidden="true">
              <ShieldX size={22} />
            </span>
            <div>
              <p className={base.statusTitulo}>Selo não reconhecido</p>
              <p className={base.statusTexto}>
                <code className={base.codigo}>{impresso || '—'}</code> não está nos registros da NZ. Se este selo veio colado num veículo, ele pode
                não ser original.
              </p>
            </div>
          </div>
          {ajuda(`Olá! Escaneei um selo de garantia NZPPF (${impresso}) e ele não foi reconhecido no site.`)}
        </>
      )}
    </div>
  );
}

function Ficha({ codigo, modelo, situacao, registro }: { codigo: string; modelo: string | null; situacao: string; registro?: string | null }) {
  return (
    <dl className={styles.ficha}>
      <div>
        <dt>Código do selo</dt>
        <dd className={styles.codigoSelo}>{codigo}</dd>
      </div>
      {modelo && (
        <div>
          <dt>Modelo</dt>
          <dd>{modelo}</dd>
        </div>
      )}
      <div>
        <dt>Situação</dt>
        <dd>{situacao}</dd>
      </div>
      {registro && (
        <div>
          <dt>Registrada em</dt>
          <dd>{registro}</dd>
        </div>
      )}
    </dl>
  );
}
