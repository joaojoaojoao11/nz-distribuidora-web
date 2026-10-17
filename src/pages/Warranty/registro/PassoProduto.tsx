// Passo 1 — o que foi aplicado. Junta o "PPF ou envelopamento" e o "qual
// linha" de antes: escolher a linha já diz o que é. Linha NZPPF avança
// sozinha; envelopamento abre o campo do vinil aqui mesmo.

import Campo from './Campo';
import SugestoesCor from './SugestoesCor';
import { ENVELOPAMENTO, LINHAS_PPF, type LinhaGarantia } from '../../../lib/garantia';
import type { PropsDoPasso } from './tipos';
import styles from './Registro.module.css';

interface Props extends PropsDoPasso {
  onEscolher: (linha: LinhaGarantia) => void;
}

function CartaoLinha({ linha, ativa, larga, onEscolher }: { linha: LinhaGarantia; ativa: boolean; larga?: boolean; onEscolher: () => void }) {
  const classes = [styles.linha, larga ? styles.linhaLarga : '', ativa ? styles.linhaAtiva : ''].filter(Boolean).join(' ');
  return (
    <button type="button" name="linhaId" className={classes} aria-pressed={ativa} onClick={onEscolher}>
      <img src={linha.foto} alt="" className={styles.linhaFoto} loading="lazy" decoding="async" width={640} height={400} />
      <span className={styles.linhaCorpo}>
        <span className={styles.linhaNome}>{linha.tipo === 'PPF' ? `NZPPF ${linha.rotulo}` : linha.rotulo}</span>
        <span className={styles.linhaDetalhe}>{linha.detalhe}</span>
        <span className={styles.selo}>{linha.garantiaAnos} anos de garantia</span>
      </span>
    </button>
  );
}

export default function PassoProduto({ r, mudar, erros, mostrar, onEscolher }: Props) {
  const envelopamento = r.linhaId === ENVELOPAMENTO.id;
  return (
    <>
      <p className={styles.grupoRotulo} id="grupo-ppf">
        NZPPF · proteção de pintura
      </p>
      <ul className={styles.linhas} aria-labelledby="grupo-ppf">
        {LINHAS_PPF.map((l) => (
          <li key={l.id}>
            <CartaoLinha linha={l} ativa={r.linhaId === l.id} onEscolher={() => onEscolher(l)} />
          </li>
        ))}
      </ul>

      <p className={styles.grupoRotulo} id="grupo-wrap">
        Envelopamento
      </p>
      <ul className={styles.linhas} aria-labelledby="grupo-wrap">
        <li className={styles.itemLargo}>
          <CartaoLinha linha={ENVELOPAMENTO} ativa={envelopamento} larga onEscolher={() => onEscolher(ENVELOPAMENTO)} />
        </li>
      </ul>

      {mostrar && erros.linhaId && (
        <p className={styles.erroCampo} role="alert">
          {erros.linhaId}
        </p>
      )}

      {envelopamento && (
        <div className={styles.material}>
          <Campo
            id="g-material"
            rotulo="Vinil aplicado"
            erro={erros.material}
            mostrar={mostrar}
            dica="Comece a digitar a cor ou o código e escolha na lista — ou escreva do seu jeito."
          >
            <SugestoesCor
              id="g-material"
              value={r.material}
              onChange={(material) => mudar({ material })}
              invalido={Boolean(mostrar && erros.material)}
              descritoPor={mostrar && erros.material ? 'g-material-erro' : 'g-material-dica'}
            />
          </Campo>
        </div>
      )}
    </>
  );
}
