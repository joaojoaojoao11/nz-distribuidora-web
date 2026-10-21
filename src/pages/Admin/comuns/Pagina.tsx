// Peças padronizadas das telas do admin (pedido do João, 21/10/2026: títulos,
// textos e formulários iguais em todas as telas). Usa as classes que já
// existem em Admin.module.css e AdminPedidos.module.css — nada novo de CSS.
//
//   <PaginaAdmin titulo descricao voltar acoes>  cabeçalho da tela
//   <Secao titulo descricao>                     bloco com título
//   <Metricas itens>                             cartões de número
//   <Campo label dica>                           rótulo + campo
//   <Botao variante>                             ação (neutra, principal, perigo)
//   <Chip tom>                                   etiqueta de status
//   <Avisos erro msg>                            erro em vermelho, aviso em cinza
//
// Formatação (BRL, datas, percentual) e o estilo dos campos ficam em
// comuns/formato.ts (o Fast Refresh exige arquivo só de componentes).

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from '../Admin.module.css';
import ped from '../AdminPedidos.module.css';

export function PaginaAdmin(p: { titulo: string; descricao?: ReactNode; voltar?: { para: string; rotulo: string }; acoes?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <header className={ped.topo}>
        <div>
          {p.voltar && (
            <Link to={p.voltar.para} className={ped.voltar}>
              ← {p.voltar.rotulo}
            </Link>
          )}
          <h2 className={ped.titulo}>{p.titulo}</h2>
          {p.descricao && <p className={ped.mudo}>{p.descricao}</p>}
        </div>
        {p.acoes && <div className={ped.topoDireita}>{p.acoes}</div>}
      </header>
      {p.children}
    </div>
  );
}

export function Secao(p: { titulo: string; descricao?: ReactNode; acoes?: ReactNode; children: ReactNode }) {
  return (
    <div className={styles.tableSection}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h3 className={styles.tableSectionTitle}>{p.titulo}</h3>
          {p.descricao && <p className={styles.tabDescription}>{p.descricao}</p>}
        </div>
        {p.acoes && <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>{p.acoes}</div>}
      </div>
      {p.children}
    </div>
  );
}

export function Metricas(p: { itens: { rotulo: string; valor: ReactNode; alerta?: boolean }[] }) {
  return (
    <div className={styles.metricsGrid}>
      {p.itens.map((m) => (
        <div key={m.rotulo} className={styles.metricCard}>
          <div className={styles.metricLabel}>{m.rotulo}</div>
          <div className={`${styles.metricValue} ${m.alerta ? styles.metricValueWarning : ''}`}>{m.valor}</div>
        </div>
      ))}
    </div>
  );
}

export function Campo(p: { label: string; dica?: string; children: ReactNode; largura?: number | string }) {
  return (
    <div className={styles.createField} style={p.largura ? { width: p.largura, minWidth: 0 } : undefined}>
      <label>{p.label}</label>
      {p.children}
      {p.dica && <small className={ped.mudo}>{p.dica}</small>}
    </div>
  );
}

export function Botao(p: { variante?: 'neutro' | 'principal' | 'perigo'; disabled?: boolean; onClick?: () => void; children: ReactNode; title?: string; type?: 'button' | 'submit' }) {
  const cls = p.variante === 'principal' ? `${styles.actionBtn} ${styles.actionBtnApprove}` : p.variante === 'perigo' ? `${styles.actionBtn} ${styles.actionBtnDeny}` : styles.actionBtn;
  return (
    <button type={p.type ?? 'button'} className={cls} disabled={p.disabled} onClick={p.onClick} title={p.title}>
      {p.children}
    </button>
  );
}

export function Chip(p: { tom: 'ok' | 'atencao' | 'erro' | 'neutro' | 'info'; children: ReactNode; title?: string }) {
  const cls = p.tom === 'ok' ? ped.ok : p.tom === 'atencao' ? ped.atencao : p.tom === 'erro' ? ped.erro : p.tom === 'info' ? ped.info : ped.neutro;
  return (
    <span className={`${ped.chip} ${cls}`} title={p.title}>
      {p.children}
    </span>
  );
}

export function Avisos(p: { erro?: string; msg?: string }) {
  return (
    <>
      {p.erro && <p className={ped.aviso}>{p.erro}</p>}
      {p.msg && <p className={ped.msg}>{p.msg}</p>}
    </>
  );
}

/** Linhas de um formulário em grade responsiva. */
export function Grade(p: { children: ReactNode; min?: number }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${p.min ?? 200}px, 1fr))`, gap: '0.75rem 1rem', alignItems: 'end' }}>{p.children}</div>;
}
