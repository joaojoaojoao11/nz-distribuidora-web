// Passo 2 — onde foi aplicado. Carro inteiro e móvel avançam sozinhos; "parte
// do carro" abre as peças (lista + desenho) e um atalho para o kit frontal.

import { Car, Check, LayoutGrid, Sofa } from 'lucide-react';
import DiagramaCarro from './DiagramaCarro';
import { AREAS, KIT_FRONTAL, linhaPorId, type TipoServico } from '../../../lib/garantia';
import type { PropsDoPasso } from './tipos';
import styles from './Registro.module.css';

interface Props extends PropsDoPasso {
  onEscolher: (servico: TipoServico) => void;
}

const OPCOES: { servico: TipoServico; nome: string; detalhe: string; Icone: typeof Car; soPpf?: boolean }[] = [
  { servico: 'Total/Full', nome: 'Carro inteiro', detalhe: 'Todas as peças pintadas', Icone: Car },
  { servico: 'Parcial', nome: 'Parte do carro', detalhe: 'Kit frontal ou peças avulsas', Icone: LayoutGrid },
  { servico: 'Movel/Eletro', nome: 'Móvel ou eletrodoméstico', detalhe: 'Bancadas, geladeiras, painéis', Icone: Sofa, soPpf: true },
];

export default function PassoCobertura({ r, mudar, erros, mostrar, onEscolher }: Props) {
  const ppf = linhaPorId(r.linhaId)?.tipo === 'PPF';
  const opcoes = OPCOES.filter((o) => !o.soPpf || ppf);
  const kitCompleto = KIT_FRONTAL.every((a) => r.areas.includes(a));

  const alternar = (area: string) =>
    mudar({ areas: r.areas.includes(area) ? r.areas.filter((a) => a !== area) : [...r.areas, area] });

  const alternarKit = () =>
    mudar({
      areas: kitCompleto ? r.areas.filter((a) => !KIT_FRONTAL.includes(a)) : [...r.areas, ...KIT_FRONTAL.filter((a) => !r.areas.includes(a))],
    });

  return (
    <>
      <ul className={opcoes.length === 2 ? `${styles.opcoes} ${styles.opcoes2}` : styles.opcoes}>
        {opcoes.map(({ servico, nome, detalhe, Icone }) => {
          const ativa = r.servico === servico;
          return (
            <li key={servico}>
              <button
                type="button"
                name="servico"
                className={ativa ? `${styles.opcao} ${styles.opcaoAtiva}` : styles.opcao}
                aria-pressed={ativa}
                onClick={() => onEscolher(servico)}
              >
                <span className={styles.opcaoIcone} aria-hidden="true">
                  <Icone size={20} strokeWidth={1.6} />
                </span>
                <span className={styles.opcaoNome}>{nome}</span>
                <span className={styles.opcaoDetalhe}>{detalhe}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {mostrar && erros.servico && (
        <p className={styles.erroCampo} role="alert">
          {erros.servico}
        </p>
      )}

      {r.servico === 'Parcial' && (
        <section className={styles.areas} aria-labelledby="titulo-areas">
          <div className={styles.areasTopo}>
            <h3 className={styles.areasTitulo} id="titulo-areas">
              Quais peças?
            </h3>
            <button type="button" className={kitCompleto ? `${styles.kit} ${styles.kitAtivo}` : styles.kit} aria-pressed={kitCompleto} onClick={alternarKit}>
              Kit frontal
            </button>
          </div>
          <div className={styles.areasCorpo}>
            <DiagramaCarro areas={r.areas} onAlternar={alternar} />
            <ul className={styles.lista}>
              {AREAS.map((area) => {
                const ativa = r.areas.includes(area);
                return (
                  <li key={area}>
                    <button
                      type="button"
                      name="areas"
                      className={ativa ? `${styles.area} ${styles.areaAtiva}` : styles.area}
                      role="checkbox"
                      aria-checked={ativa}
                      onClick={() => alternar(area)}
                    >
                      <span className={styles.areaCheck} aria-hidden="true">
                        <Check size={13} strokeWidth={3} />
                      </span>
                      {area}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          {mostrar && erros.areas && (
            <p className={styles.erroCampo} role="alert">
              {erros.areas}
            </p>
          )}
        </section>
      )}
    </>
  );
}
