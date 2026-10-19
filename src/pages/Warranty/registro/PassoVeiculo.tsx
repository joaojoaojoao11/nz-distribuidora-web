// Passo 3 — veículo (ou item) e aplicação.

import Campo from './Campo';
import { ariaDoCampo } from './aria';
import { digitandoPlaca, ehMovel, formatarPlaca, formatarSelo, hojeISO } from '../../../lib/garantia';
import type { PropsDoPasso } from './tipos';
import styles from './Registro.module.css';

interface Props extends PropsDoPasso {
  /** Empresa de quem está logado como lojista/aplicador. */
  aplicadorDaConta?: string;
}

export default function PassoVeiculo({ r, mudar, erros, mostrar, aplicadorDaConta }: Props) {
  const movel = ehMovel(r);
  const hoje = hojeISO();
  const ontem = hojeISO(-1);

  return (
    <div className={styles.form}>
      <Campo
        id="g-placa"
        rotulo={movel ? 'Identificação do item' : 'Placa ou chassi'}
        erro={erros.placa}
        mostrar={mostrar}
        dica={movel ? 'Número de série ou etiqueta interna.' : 'Mercosul (ABC1D23), antiga (ABC-1234) ou os 17 caracteres do chassi.'}
      >
        <input
          {...ariaDoCampo('g-placa', erros.placa, mostrar, true)}
          name="placa"
          value={r.placa}
          onChange={(e) => mudar({ placa: movel ? e.target.value : digitandoPlaca(e.target.value) })}
          onBlur={() => {
            if (!movel) mudar({ placa: formatarPlaca(r.placa) });
          }}
          placeholder={movel ? 'Ex.: SN-9F3K21' : 'ABC1D23'}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
          enterKeyHint="next"
          maxLength={movel ? 60 : 18}
        />
      </Campo>

      <Campo id="g-modelo" rotulo={movel ? 'Descrição do item' : 'Modelo do veículo'} erro={erros.modelo} mostrar={mostrar}>
        <input
          {...ariaDoCampo('g-modelo', erros.modelo, mostrar)}
          name="modelo"
          value={r.modelo}
          onChange={(e) => mudar({ modelo: e.target.value })}
          placeholder={movel ? 'Ex.: Geladeira Brastemp inox 540 L' : 'Ex.: Porsche 911 Carrera'}
          autoCapitalize="words"
          autoComplete="off"
          enterKeyHint="next"
          maxLength={120}
        />
      </Campo>

      <Campo id="g-data" rotulo="Data da aplicação" erro={erros.data} mostrar={mostrar}>
        <input
          {...ariaDoCampo('g-data', erros.data, mostrar)}
          name="data"
          type="date"
          value={r.data}
          min="2015-01-01"
          max={hoje}
          onChange={(e) => mudar({ data: e.target.value })}
        />
        <div className={styles.atalhos}>
          <button type="button" className={r.data === hoje ? `${styles.atalho} ${styles.atalhoAtivo}` : styles.atalho} aria-pressed={r.data === hoje} onClick={() => mudar({ data: hoje })}>
            Hoje
          </button>
          <button type="button" className={r.data === ontem ? `${styles.atalho} ${styles.atalhoAtivo}` : styles.atalho} aria-pressed={r.data === ontem} onClick={() => mudar({ data: ontem })}>
            Ontem
          </button>
        </div>
      </Campo>

      <Campo id="g-aplicador" rotulo="Aplicado por" erro={erros.aplicador} mostrar={mostrar} dica="Estúdio, loja ou profissional que fez a aplicação.">
        <input
          {...ariaDoCampo('g-aplicador', erros.aplicador, mostrar, true)}
          name="aplicador"
          value={r.aplicador}
          onChange={(e) => mudar({ aplicador: e.target.value })}
          placeholder="Nome do aplicador credenciado"
          autoCapitalize="words"
          autoComplete="organization"
          enterKeyHint="next"
          maxLength={120}
        />
        {aplicadorDaConta && aplicadorDaConta !== r.aplicador.trim() && (
          <div className={styles.atalhos}>
            <button type="button" className={styles.atalho} onClick={() => mudar({ aplicador: aplicadorDaConta })}>
              Fui eu: {aplicadorDaConta}
            </button>
          </div>
        )}
      </Campo>

      <Campo
        id="g-selo"
        rotulo="Código do selo de garantia"
        opcional
        erro={erros.selo}
        mostrar={mostrar}
        dica="Está no selo NZPPF colado no batente da porta, embaixo do QR."
      >
        <input
          {...ariaDoCampo('g-selo', erros.selo, mostrar, true)}
          name="selo"
          value={r.selo}
          onChange={(e) => mudar({ selo: formatarSelo(e.target.value) })}
          placeholder="Ex.: 7KQ2-XM9P"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
          enterKeyHint="done"
          maxLength={9}
        />
      </Campo>
    </div>
  );
}
