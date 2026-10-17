// /validar-garantia — conferir um certificado pelo código (ou pelo QR, que
// abre esta página com ?id=).
//
// A consulta é a RPC `validar_garantia`: recebe o código e devolve SÓ o que o
// certificado mostra, com o CPF já mascarado no servidor. Antes isto era um
// select('*') anônimo na tabela, que deixava listar todas as garantias.
//
// Sem código, a página mostra um campo para digitar — antes mostrava "Registro
// inexistente ()". O certificado é o mesmo componente do registro.

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Copy, Printer, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import SEO from '../../components/SEO/SEO';
import { supabase } from '../../lib/supabase';
import { copiar } from '../../lib/shop/checkout';
import { VENDAS, linkWhatsApp } from '../../lib/contatos';
import { urlDeValidacao } from '../../lib/garantia';
import Certificado, { type DadosCertificado } from './Certificado';
import styles from './WarrantyValidator.module.css';

// O que `validar_garantia` devolve.
interface Linha {
  cpf_mascarado: string;
  veiculo_modelo: string | null;
  veiculo_placa_chassi: string | null;
  aplicador_nome: string | null;
  data_aplicacao: string | null;
  produto_nome: string | null;
  linha_escolhida: string | null;
  tipo_servico: string | null;
  codigo_autenticacao: string;
  areas_protegidas: string[] | null;
  garantia_anos: number | null;
  durabilidade_anos: number | null;
}

type Estado = { tipo: 'vazio' } | { tipo: 'buscando'; codigo: string } | { tipo: 'achou'; codigo: string; dados: DadosCertificado } | { tipo: 'nao-achou'; codigo: string };

const limparCodigo = (v: string) => v.toUpperCase().replace(/\s+/g, '').trim();

function paraCertificado(l: Linha): DadosCertificado {
  const servico = l.tipo_servico ?? '';
  return {
    produto: l.produto_nome ?? '',
    linha: l.linha_escolhida ?? 'PPF',
    servico,
    areas: servico === 'Parcial' ? (l.areas_protegidas ?? []) : [],
    modelo: l.veiculo_modelo ?? '',
    placa: l.veiculo_placa_chassi ?? '',
    aplicador: (l.aplicador_nome ?? '').trim(),
    data: l.data_aplicacao ?? '',
    // Envelopamentos antigos foram gravados com 0 anos e o certificado sempre
    // mostrou 3 — o validador segue mostrando o mesmo.
    garantiaAnos: l.garantia_anos || (l.linha_escolhida === 'NZWrap' ? 3 : 0),
    codigo: l.codigo_autenticacao,
    proprietario: l.cpf_mascarado,
  };
}

export default function WarrantyValidator() {
  const [params, setParams] = useSearchParams();
  const codigoDaUrl = limparCodigo(params.get('id') ?? '');
  const [digitado, setDigitado] = useState(codigoDaUrl);
  const [resultado, setResultado] = useState<Estado>({ tipo: 'vazio' });
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!codigoDaUrl) return;
    let vivo = true;
    void supabase.rpc('validar_garantia', { p_codigo: codigoDaUrl }).then(({ data, error }) => {
      if (!vivo) return;
      const linha = (Array.isArray(data) ? data[0] : data) as Linha | null | undefined;
      setResultado(!error && linha ? { tipo: 'achou', codigo: codigoDaUrl, dados: paraCertificado(linha) } : { tipo: 'nao-achou', codigo: codigoDaUrl });
    });
    return () => {
      vivo = false;
    };
  }, [codigoDaUrl]);

  // O resultado guardado só vale para o código que está na URL agora.
  const estado: Estado = !codigoDaUrl ? { tipo: 'vazio' } : resultado.tipo !== 'vazio' && 'codigo' in resultado && resultado.codigo === codigoDaUrl ? resultado : { tipo: 'buscando', codigo: codigoDaUrl };

  const conferir = (e: React.FormEvent) => {
    e.preventDefault();
    const c = limparCodigo(digitado);
    if (c.length < 6) return;
    setParams({ id: c });
  };

  const copiarLink = async () => {
    if (await copiar(urlDeValidacao(codigoDaUrl))) {
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2200);
    }
  };

  const formulario = (
    <form className={styles.busca} onSubmit={conferir} role="search">
      <label className={styles.rotulo} htmlFor="v-codigo">
        Código do certificado
      </label>
      <div className={styles.buscaLinha}>
        <input
          id="v-codigo"
          value={digitado}
          onChange={(e) => setDigitado(e.target.value.toUpperCase())}
          placeholder="NZ-15102026-ABC1D23-X7K2P"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
          enterKeyHint="search"
        />
        <button type="submit" className={styles.primario} disabled={limparCodigo(digitado).length < 6}>
          <Search size={16} aria-hidden="true" /> Conferir
        </button>
      </div>
    </form>
  );

  return (
    <div className={styles.pagina}>
      <SEO
        title="Validar Certificado de Garantia NZPPF"
        description="Confira a autenticidade de um certificado de garantia NZPPF ou NZWRAP pelo código ou pelo QR do certificado."
        canonicalUrl="/validar-garantia"
      />

      <header className={styles.topo}>
        <p className={styles.eyebrow}>Garantia NZ</p>
        <h1 className={styles.titulo}>Conferir certificado</h1>
        {estado.tipo === 'vazio' && <p className={styles.lede}>Digite o código que está no certificado — ou aponte a câmera do celular para o QR dele.</p>}
      </header>

      {estado.tipo === 'vazio' && formulario}

      {estado.tipo === 'buscando' && (
        <div className={styles.esqueleto} aria-busy="true" aria-live="polite">
          <span className={styles.srOnly}>Conferindo o código {estado.codigo}…</span>
          <div />
          <div />
          <div />
        </div>
      )}

      {estado.tipo === 'achou' && (
        <>
          <div className={styles.status} role="status">
            <span className={styles.statusIconeOk} aria-hidden="true">
              <ShieldCheck size={22} />
            </span>
            <div>
              <p className={styles.statusTitulo}>Certificado válido</p>
              <p className={styles.statusTexto}>Esta garantia está registrada na NZ Distribuidora.</p>
            </div>
          </div>
          <Certificado dados={estado.dados} imprimivel />
          <div className={styles.acoes}>
            <button type="button" className={styles.secundario} onClick={() => window.print()}>
              <Printer size={16} aria-hidden="true" /> Salvar PDF ou imprimir
            </button>
            <button type="button" className={styles.secundario} onClick={() => void copiarLink()} aria-live="polite">
              <Copy size={16} aria-hidden="true" /> {copiado ? 'Link copiado' : 'Copiar link'}
            </button>
          </div>
          <button
            type="button"
            className={styles.outro}
            onClick={() => {
              setDigitado('');
              setParams({});
            }}
          >
            Conferir outro código
          </button>
        </>
      )}

      {estado.tipo === 'nao-achou' && (
        <>
          <div className={styles.status} role="status">
            <span className={styles.statusIconeAviso} aria-hidden="true">
              <ShieldAlert size={22} />
            </span>
            <div>
              <p className={styles.statusTitulo}>Não encontramos este código</p>
              <p className={styles.statusTexto}>
                <code className={styles.codigo}>{estado.codigo}</code> não está nos registros da NZ. Confira se foi digitado igual ao do
                certificado, com os hífens.
              </p>
            </div>
          </div>
          {formulario}
          <p className={styles.ajuda}>
            Continua sem aparecer?{' '}
            <a href={linkWhatsApp(VENDAS[0]!, `Olá! Tentei conferir o certificado de garantia ${estado.codigo} no site e não encontrei.`)} target="_blank" rel="noopener noreferrer">
              Fale com a NZ pelo WhatsApp
            </a>
            .
          </p>
        </>
      )}

      <p className={styles.rodape}>
        Registrou uma aplicação e ainda não tem certificado? <Link to="/registro-garantia">Registrar garantia</Link>
      </p>
    </div>
  );
}
