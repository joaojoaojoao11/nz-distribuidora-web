// Revisão — o que vai para o certificado, bloco a bloco, com "alterar" ao
// lado. No computador a prévia do certificado já está na lateral; no celular
// ela aparece aqui, acima dos blocos.

import Certificado, { type DadosCertificado } from '../Certificado';
import { formatarCpfCnpj } from '../../../lib/documento';
import { ehMovel, formatarDataISO, garantiaDoRascunho, nomeDeExibicao, produtoDoRascunho, textoDaCobertura, type Passo, type Rascunho } from '../../../lib/garantia';
import styles from './Registro.module.css';

interface Props {
  r: Rascunho;
  previa: DadosCertificado;
  onAlterar: (p: Passo) => void;
}

export default function Revisao({ r, previa, onAlterar }: Props) {
  const { anos } = garantiaDoRascunho(r);
  const movel = ehMovel(r);
  const contato = [r.email.trim(), r.telefone.trim()].filter(Boolean).join(' · ');
  const local = [r.cidade.trim(), r.uf].filter(Boolean).join('/');

  const blocos: { passo: Passo; titulo: string; linhas: string[] }[] = [
    { passo: 'produto', titulo: 'Produto', linhas: [nomeDeExibicao(produtoDoRascunho(r)), `${anos} anos de garantia`] },
    { passo: 'cobertura', titulo: 'Onde foi aplicado', linhas: [textoDaCobertura(r.servico, r.areas)] },
    {
      passo: 'veiculo',
      titulo: movel ? 'Item e aplicação' : 'Veículo e aplicação',
      linhas: [`${r.modelo.trim()} · ${r.placa.trim().toUpperCase()}`, `Aplicado por ${r.aplicador.trim()} em ${formatarDataISO(r.data)}`],
    },
    {
      passo: 'proprietario',
      titulo: 'Proprietário',
      linhas: [
        `${r.nome.trim()} · ${formatarCpfCnpj(r.cpf)}`,
        contato,
        local,
        r.impresso ? `Via impressa para ${r.rua.trim()}, ${r.numero.trim()}${r.complemento.trim() ? ` — ${r.complemento.trim()}` : ''}` : '',
      ].filter(Boolean),
    },
  ];

  return (
    <>
      <div className={styles.soCelular}>
        <Certificado dados={previa} compacto />
        <p className={styles.aviso}>Confira os dados abaixo antes de emitir.</p>
      </div>
      <ul className={styles.blocos}>
        {blocos.map((b) => (
          <li key={b.passo} className={styles.bloco}>
            <div>
              <p className={styles.blocoTitulo}>{b.titulo}</p>
              <p className={styles.blocoTexto}>
                {b.linhas[0]}
                {b.linhas.slice(1).map((l) => (
                  <small key={l}>{l}</small>
                ))}
              </p>
            </div>
            <button type="button" className={styles.alterar} onClick={() => onAlterar(b.passo)} aria-label={`Alterar ${b.titulo.toLowerCase()}`}>
              Alterar
            </button>
          </li>
        ))}
      </ul>
      <p className={styles.aviso}>
        Depois de emitido, o certificado fica vinculado à placa e ao CPF informados — eles não mudam mais.
      </p>
    </>
  );
}
