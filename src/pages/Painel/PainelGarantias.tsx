// /painel/garantias — os certificados emitidos no nome de quem está logado.
//
// Vem da RPC `minhas_garantias`, que casa por CPF/CNPJ (só os dígitos, porque o
// formulário grava formatado) ou pelo e-mail da conta. A tabela em si ficou
// fechada em 2026-09-10: antes ela deixava QUALQUER visitante ler, alterar e
// apagar todas as garantias — com CPF, telefone e endereço dentro.
//
// Se o cliente registrou a garantia com outro CPF/e-mail, nada aparece. A tela
// diz isso em vez de fingir que ele não tem garantia nenhuma.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import styles from './Painel.module.css';

interface Garantia {
  id: string;
  produto_nome: string | null;
  linha_escolhida: string | null;
  tipo_servico: string | null;
  veiculo_modelo: string | null;
  veiculo_placa_chassi: string | null;
  aplicador_nome: string | null;
  data_aplicacao: string | null;
  garantia_anos: number | null;
  durabilidade_anos: number | null;
  codigo_autenticacao: string;
  certificado_gerado: boolean | null;
  pdf_url: string | null;
}

export default function PainelGarantias() {
  const { user } = useAuth();
  const [lista, setLista] = useState<Garantia[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!user) return;
    let vivo = true;
    void supabase.rpc('minhas_garantias').then(({ data }) => {
      if (!vivo) return;
      setLista((data ?? []) as Garantia[]);
      setCarregando(false);
    });
    return () => {
      vivo = false;
    };
  }, [user]);

  if (carregando) return <p className={styles.mudo}>Carregando…</p>;

  if (lista.length === 0) {
    return (
      <div className={styles.vazio}>
        <p className={styles.mudo}>
          Nenhuma garantia no seu nome. Achamos pelo CPF/CNPJ e pelo e-mail do seu cadastro — se o
          registro foi feito com outro documento ou outro e-mail, ele não aparece aqui.
        </p>
        <Link to="/registro-garantia" className={styles.botaoSecundario}>
          Registrar uma garantia
        </Link>
      </div>
    );
  }

  return (
    <ul className={styles.cartoes}>
      {lista.map((g) => (
        <li key={g.id} className={styles.cartaoPedido}>
          <div className={styles.cartaoTopo}>
            <span className={styles.cartaoNumero}>{g.produto_nome ?? g.linha_escolhida ?? 'Garantia NZ'}</span>
            <span className={styles.cartaoData}>
              {g.data_aplicacao ? new Date(g.data_aplicacao).toLocaleDateString('pt-BR') : '—'}
            </span>
          </div>

          <div className={styles.cartaoStatus}>
            <span
              className={`${styles.pagChip} ${g.certificado_gerado ? styles.pagOk : styles.pagPendente}`}
            >
              {g.certificado_gerado ? 'Certificado emitido' : 'Em processamento'}
            </span>
            <span>
              {g.veiculo_modelo ?? '—'}
              {g.veiculo_placa_chassi ? ` · ${g.veiculo_placa_chassi}` : ''}
              {g.aplicador_nome ? ` · aplicado por ${g.aplicador_nome.trim()}` : ''}
            </span>
          </div>

          <div className={styles.cartaoRodape}>
            <span className={styles.cartaoTotal}>
              {g.garantia_anos ? `${g.garantia_anos} anos` : '—'}
              {g.durabilidade_anos ? <small> · vida útil {g.durabilidade_anos} anos</small> : null}
            </span>
            <div className={styles.cartaoAcoes}>
              <Link className={styles.botaoSecundario} to={`/validar-garantia?id=${encodeURIComponent(g.codigo_autenticacao)}`}>
                Ver certificado
              </Link>
              {g.pdf_url && (
                <a className={styles.botaoSecundario} href={g.pdf_url} target="_blank" rel="noopener noreferrer">
                  Baixar PDF
                </a>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
