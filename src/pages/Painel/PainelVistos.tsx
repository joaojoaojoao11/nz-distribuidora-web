// /painel/vistos — o rastro dos últimos produtos abertos.
//
// Não sai de `analytics_events`: aquilo guarda a SESSÃO, não o usuário, e não
// responde "o que EU vi". São os últimos 24, no navegador, ligados à conta.

import { Link } from 'react-router-dom';
import { limparVistos, useVistos } from '../../lib/shop/listasPessoais';
import GradeLembrados from './GradeLembrados';
import styles from './Painel.module.css';

export default function PainelVistos() {
  const vistos = useVistos();

  if (vistos.length === 0) {
    return (
      <div className={styles.vazio}>
        <p className={styles.mudo}>
          Nada por aqui ainda. Os produtos que você abrir na loja ficam nesta lista para você achar de
          novo sem procurar.
        </p>
        <Link to="/loja" className={styles.botaoSecundario}>
          Ir para a loja
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className={styles.acoesTopo}>
        <span className={styles.mudo}>
          {vistos.length} {vistos.length > 1 ? 'produtos' : 'produto'} · os mais recentes primeiro
        </span>
        <button type="button" className={styles.botaoSecundario} onClick={limparVistos}>
          Limpar histórico
        </button>
      </div>
      <GradeLembrados itens={vistos} />
    </>
  );
}
