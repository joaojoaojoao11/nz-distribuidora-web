// As cenas animadas do botão "Como funciona". Cada uma recebe só dados (tipos.ts)
// e anima o mecanismo em poucos segundos, em laço ou uma vez só. Com "reduzir
// movimento" ligado no aparelho, aparecem paradas no estado final (o texto do
// passo continua explicando tudo) e a janela oferece "ver animação".

import { useEffect, useSyncExternalStore } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import {
  BadgeCheck,
  Banknote,
  Calendar,
  CarFront,
  Camera,
  CircleCheck,
  Clock,
  CreditCard,
  Download,
  Eye,
  Flag,
  Gift,
  Heart,
  Landmark,
  Link,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Percent,
  QrCode,
  Receipt,
  Search,
  ShoppingCart,
  Star,
  Store,
  Ticket,
  Trophy,
  Truck,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { Cena as CenaDados, Icone, Tom } from './tipos';
import s from './Tutorial.module.css';

const ICONES: Record<Icone, LucideIcon> = {
  usuario: User,
  usuarios: Users,
  loja: Store,
  cupom: Ticket,
  carrinho: ShoppingCart,
  nota: Receipt,
  relogio: Clock,
  carteira: Wallet,
  pix: QrCode,
  banco: Landmark,
  check: CircleCheck,
  selo: BadgeCheck,
  trofeu: Trophy,
  link: Link,
  bandeira: Flag,
  presente: Gift,
  percentual: Percent,
  calendario: Calendar,
  dinheiro: Banknote,
  download: Download,
  whatsapp: MessageCircle,
  busca: Search,
  caminhao: Truck,
  cartao: CreditCard,
  estrela: Star,
  olho: Eye,
  coracao: Heart,
  cadeado: Lock,
  email: Mail,
  mapa: MapPin,
  camera: Camera,
  caixa: Package,
};

/** Cor de cada tom (as mesmas dos chips do admin; "marca" é o vermelho NZ, mais claro para o fundo escuro). */
const COR: Record<Tom, string> = {
  ok: '#4ade80',
  atencao: '#fbbf24',
  erro: '#f87171',
  info: '#7cb8ff',
  neutro: '#a1a1a6',
  marca: '#ff4545',
};
const APAGADO = 'rgba(255, 255, 255, 0.16)';
const TEXTO_APAGADO = '#6b6b70';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Celular: as cenas em fila viram coluna. */
const CONSULTA_ESTREITO = '(max-width: 560px)';
function useEstreito(): boolean {
  return useSyncExternalStore(
    (avisar) => {
      const m = window.matchMedia(CONSULTA_ESTREITO);
      m.addEventListener('change', avisar);
      return () => m.removeEventListener('change', avisar);
    },
    () => window.matchMedia(CONSULTA_ESTREITO).matches,
    () => false
  );
}

/**
 * Quadros-chave de "acende no instante `t` do ciclo e fica aceso até o fim".
 * Devolve valores e tempos para um laço de duração `ciclo` segundos.
 */
function acendeEm(t: number, ciclo: number, apagado: string, aceso: string) {
  const a = Math.min(0.9, Math.max(0, t / ciclo));
  const b = Math.min(0.94, a + 0.06);
  return { valores: [apagado, apagado, aceso, aceso, apagado], tempos: [0, a, b, 0.97, 1] };
}

const laco = (ciclo: number, tempos: number[]) => ({ duration: ciclo, times: tempos, repeat: Infinity, ease: 'linear' as const });

/** Tempos de "aceso só entre `a` e `b`" (frações do ciclo), para valores [apagado, apagado, aceso, aceso, apagado, apagado]. */
function janela(a: number, b: number): number[] {
  const e = Math.min(0.03, (b - a) / 4);
  return [0, a, a + e, b - e, b, 1];
}

// ------------------------------------------------------------------ fluxo

function Fluxo({ cena, parado }: { cena: Extract<CenaDados, { tipo: 'fluxo' }>; parado: boolean }) {
  const estreito = useEstreito();
  const n = cena.etapas.length;
  const passo = 1.1; // segundos por seta
  const ciclo = Math.max(1, n - 1) * passo + 1.4;
  return (
    <div className={`${s.fluxo} ${estreito ? s.fluxoColuna : ''}`}>
      {cena.etapas.map((e, i) => {
        const Ic = ICONES[e.icone];
        const cor = COR[e.tom ?? 'marca'];
        const borda = acendeEm(i * passo, ciclo, APAGADO, cor);
        const tinta = acendeEm(i * passo, ciclo, TEXTO_APAGADO, cor);
        const ini = i * passo;
        const fim = (i + 1) * passo;
        const ta = ini / ciclo;
        const tb = fim / ciclo;
        const eixo = estreito ? 'top' : 'left';
        return (
          <div key={i} className={s.fluxoItem}>
            <div className={s.fluxoEtapa}>
              <motion.div
                className={s.fluxoIcone}
                style={parado ? { borderColor: cor, color: cor } : undefined}
                animate={parado ? undefined : { borderColor: borda.valores, color: tinta.valores, scale: [1, 1, 1.12, 1, 1] }}
                transition={
                  parado
                    ? undefined
                    : {
                        borderColor: laco(ciclo, borda.tempos),
                        color: laco(ciclo, tinta.tempos),
                        scale: laco(ciclo, [0, Math.min(0.9, ta + (i === 0 ? 0 : 0.01)), Math.min(0.93, ta + 0.05), Math.min(0.96, ta + 0.11), 1]),
                      }
                }
              >
                <Ic size={22} strokeWidth={1.8} />
              </motion.div>
              <span className={s.fluxoRotulo}>{e.rotulo}</span>
            </div>
            {i < n - 1 && (
              <div className={s.trilho} aria-hidden="true">
                {!parado && (
                  <motion.span
                    className={s.ponto}
                    style={{ [eixo]: '0%' }}
                    animate={{ [eixo]: ['0%', '0%', '100%', '100%'], opacity: [0, 0, 1, 1, 0, 0] }}
                    transition={{
                      [eixo]: laco(ciclo, [0, ta, tb, 1]),
                      opacity: laco(ciclo, [0, ta, Math.min(tb, ta + 0.02), Math.max(ta + 0.02, tb - 0.02), tb, 1]),
                    }}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------ linha do tempo

function LinhaTempo({ cena, parado }: { cena: Extract<CenaDados, { tipo: 'linhaTempo' }>; parado: boolean }) {
  const n = cena.marcos.length;
  const enche = 3.4;
  const ciclo = enche + 1.6;
  const meia = 50 / n; // centro da primeira e da última coluna, em %
  return (
    <div className={s.tempo} style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
      <div className={s.tempoTrilho} style={{ left: `${meia}%`, right: `${meia}%` }} aria-hidden="true">
        <motion.div
          className={s.tempoCheio}
          style={parado ? { width: '100%' } : { width: '0%' }}
          animate={parado ? undefined : { width: ['0%', '100%', '100%', '0%'] }}
          transition={parado ? undefined : laco(ciclo, [0, enche / ciclo, 0.97, 1])}
        />
      </div>
      {cena.marcos.map((m, i) => {
        const cor = COR[m.tom ?? 'marca'];
        const t = n > 1 ? (i / (n - 1)) * enche : 0;
        const fundo = acendeEm(t, ciclo, '#1a1a1e', cor);
        const tinta = acendeEm(t, ciclo, TEXTO_APAGADO, '#f5f5f7');
        return (
          <div key={i} className={s.tempoMarco}>
            <motion.span
              className={s.tempoBolinha}
              style={parado ? { background: cor, borderColor: cor } : undefined}
              animate={parado ? undefined : { background: fundo.valores, borderColor: acendeEm(t, ciclo, APAGADO, cor).valores }}
              transition={parado ? undefined : { background: laco(ciclo, fundo.tempos), borderColor: laco(ciclo, fundo.tempos) }}
            />
            <motion.span
              className={s.tempoRotulo}
              style={parado ? { color: '#f5f5f7' } : undefined}
              animate={parado ? undefined : { color: tinta.valores }}
              transition={parado ? undefined : laco(ciclo, tinta.tempos)}
            >
              {m.rotulo}
            </motion.span>
            {m.sub && <span className={s.tempoSub}>{m.sub}</span>}
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------ carteira

function Contador({ valor, atraso, parado }: { valor: number; atraso: number; parado: boolean }) {
  const mv = useMotionValue(parado ? valor : 0);
  const texto = useTransform(mv, (v) => BRL.format(v));
  useEffect(() => {
    if (parado) return;
    const c = animate(mv, valor, { duration: 1.3, delay: atraso, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [mv, valor, atraso, parado]);
  return <motion.span>{texto}</motion.span>;
}

function Carteira({ cena, parado }: { cena: Extract<CenaDados, { tipo: 'carteira' }>; parado: boolean }) {
  return (
    <div className={s.carteira}>
      <div className={s.carteiraTopo}>
        <Wallet size={16} strokeWidth={1.8} />
        <span>{cena.titulo}</span>
        <span className={s.exemplo}>exemplo</span>
      </div>
      <ul className={s.carteiraLinhas}>
        {cena.linhas.map((l, i) => (
          <motion.li
            key={i}
            className={s.carteiraLinha}
            initial={parado ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.35, duration: 0.35 }}
          >
            <span className={s.carteiraRotulo}>{l.rotulo}</span>
            {l.status && (
              <span className={s.miniChip} style={{ color: COR[l.tom], borderColor: COR[l.tom] }}>
                {l.status}
              </span>
            )}
            <span className={s.carteiraValor} style={{ color: l.valor < 0 ? '#f87171' : COR[l.tom] }}>
              {l.valor < 0 ? '− ' : '+ '}
              {BRL.format(Math.abs(l.valor))}
            </span>
          </motion.li>
        ))}
      </ul>
      {cena.total && (
        <div className={s.carteiraTotal}>
          <span>{cena.total.rotulo}</span>
          <strong>
            <Contador valor={cena.total.valor} atraso={0.25 + cena.linhas.length * 0.35} parado={parado} />
          </strong>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------------- cupom

function Cupom({ cena, parado }: { cena: Extract<CenaDados, { tipo: 'cupom' }>; parado: boolean }) {
  const letras = cena.codigo.split('');
  const fimCodigo = 0.3 + letras.length * 0.09;
  return (
    <div className={s.cupomCena}>
      <div className={s.cupom}>
        <Ticket size={18} strokeWidth={1.8} className={s.cupomIcone} />
        <span className={s.cupomEtiqueta}>cupom</span>
        <span className={s.cupomCodigo} aria-label={cena.codigo}>
          {letras.map((c, i) => (
            <motion.span key={i} aria-hidden="true" initial={parado ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.09, duration: 0.2 }}>
              {c}
            </motion.span>
          ))}
          {!parado && <motion.span className={s.cursor} aria-hidden="true" animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.9, repeat: Infinity }} />}
        </span>
      </div>
      <div className={s.selos}>
        {cena.selos.map((sl, i) => (
          <motion.span
            key={i}
            className={s.selo}
            style={{ color: COR[sl.tom], borderColor: COR[sl.tom] }}
            initial={parado ? false : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: fimCodigo + 0.2 + i * 0.3, type: 'spring', stiffness: 380, damping: 18 }}
          >
            {sl.texto}
          </motion.span>
        ))}
      </div>
      {cena.legenda && <p className={s.legenda}>{cena.legenda}</p>}
    </div>
  );
}

// ------------------------------------------------------------------- status

function Status({ cena, parado }: { cena: Extract<CenaDados, { tipo: 'status' }>; parado: boolean }) {
  const estreito = useEstreito();
  const n = cena.estados.length;
  const vez = 1.4;
  const ciclo = n * vez;
  return (
    <div className={`${s.status} ${estreito ? s.statusColuna : ''}`}>
      {cena.estados.map((e, i) => {
        const cor = COR[e.tom];
        // aceso só na sua vez: [i·vez, (i+1)·vez] dentro do ciclo
        const tempos = janela((i * vez) / ciclo, ((i + 1) * vez) / ciclo);
        const op = [0.4, 0.4, 1, 1, 0.4, 0.4];
        const esc = [1, 1, 1.06, 1.06, 1, 1];
        return (
          <div key={i} className={s.statusItem}>
            <motion.div
              className={s.statusCaixa}
              style={parado ? { opacity: 1 } : undefined}
              animate={parado ? undefined : { opacity: op, scale: esc }}
              transition={parado ? undefined : { opacity: laco(ciclo, tempos), scale: laco(ciclo, tempos) }}
            >
              <span className={s.statusChip} style={{ color: cor, borderColor: cor, background: `${cor}14` }}>
                {e.texto}
              </span>
              {e.sub && <span className={s.statusSub}>{e.sub}</span>}
            </motion.div>
            {i < n - 1 && (
              <span className={s.statusSeta} aria-hidden="true">
                {estreito ? '↓' : '→'}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------- níveis

function Niveis({ cena, parado }: { cena: Extract<CenaDados, { tipo: 'niveis' }>; parado: boolean }) {
  const n = cena.niveis.length;
  const ate = Math.min(n - 1, Math.max(0, cena.ate ?? n - 1));
  const anda = 0.9 * Math.max(1, ate) + 0.4;
  const ciclo = anda + 1.6;
  const meia = 50 / n;
  const destino = n > 1 ? (ate / (n - 1)) * 100 : 0;
  return (
    <div className={s.tempo} style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
      <div className={s.tempoTrilho} style={{ left: `${meia}%`, right: `${meia}%` }} aria-hidden="true">
        <motion.div
          className={s.tempoCheio}
          style={parado ? { width: `${destino}%` } : { width: '0%' }}
          animate={parado ? undefined : { width: ['0%', `${destino}%`, `${destino}%`, '0%'] }}
          transition={parado ? undefined : laco(ciclo, [0, anda / ciclo, 0.97, 1])}
        />
        <motion.span
          className={s.carro}
          style={parado ? { left: `${destino}%` } : { left: '0%' }}
          animate={parado ? undefined : { left: ['0%', `${destino}%`, `${destino}%`, '0%'] }}
          transition={parado ? undefined : laco(ciclo, [0, anda / ciclo, 0.97, 1])}
        >
          <CarFront size={18} strokeWidth={1.8} />
        </motion.span>
      </div>
      {cena.niveis.map((nv, i) => {
        const alcanca = i <= ate;
        // o carro anda em linha reta: chega à parada i em (i / ate) do trajeto
        const t = ate > 0 ? (i / ate) * anda : 0;
        const fundo = acendeEm(t, ciclo, '#1a1a1e', COR.marca);
        return (
          <div key={i} className={s.tempoMarco}>
            <motion.span
              className={s.tempoBolinha}
              style={parado && alcanca ? { background: COR.marca, borderColor: COR.marca } : undefined}
              animate={parado || !alcanca ? undefined : { background: fundo.valores, borderColor: acendeEm(t, ciclo, APAGADO, COR.marca).valores }}
              transition={parado || !alcanca ? undefined : { background: laco(ciclo, fundo.tempos), borderColor: laco(ciclo, fundo.tempos) }}
            />
            <span className={s.tempoRotulo} style={{ color: '#f5f5f7' }}>
              {i === n - 1 ? <Trophy size={12} strokeWidth={2} style={{ marginRight: 3, verticalAlign: '-1px' }} /> : null}
              {nv.nome}
            </span>
            {nv.sub && <span className={s.tempoSub}>{nv.sub}</span>}
          </div>
        );
      })}
    </div>
  );
}

// --------------------------------------------------------------- formulário

function Formulario({ cena, parado }: { cena: Extract<CenaDados, { tipo: 'formulario' }>; parado: boolean }) {
  const n = cena.campos.length;
  const vez = 1.1;
  const ciclo = (n + 1) * vez;
  const anel = (i: number) => ({ tempos: janela((i * vez) / ciclo, ((i + 1) * vez) / ciclo), valores: [APAGADO, APAGADO, COR.marca, COR.marca, APAGADO, APAGADO] });
  const botao = anel(n);
  return (
    <div className={s.form}>
      {cena.titulo && <div className={s.formTitulo}>{cena.titulo}</div>}
      <div className={s.formGrade}>
        {cena.campos.map((c, i) => {
          const r = anel(i);
          return (
            <div key={i} className={s.formCampo}>
              <span className={s.formRotulo}>{c.rotulo}</span>
              <motion.span
                className={s.formCaixa}
                animate={parado ? undefined : { borderColor: r.valores }}
                transition={parado ? undefined : laco(ciclo, r.tempos)}
              >
                {c.valor ? c.valor : <span className={s.formVazio} />}
              </motion.span>
            </div>
          );
        })}
      </div>
      <motion.span
        className={s.formSalvar}
        animate={parado ? undefined : { borderColor: botao.valores, color: ['#a1a1a6', '#a1a1a6', '#ffffff', '#ffffff', '#a1a1a6', '#a1a1a6'] }}
        transition={parado ? undefined : { borderColor: laco(ciclo, botao.tempos), color: laco(ciclo, botao.tempos) }}
      >
        Salvar
      </motion.span>
    </div>
  );
}

// --------------------------------------------------------------- comparação

function Comparacao({ cena, parado }: { cena: Extract<CenaDados, { tipo: 'comparacao' }>; parado: boolean }) {
  const estreito = useEstreito();
  return (
    <div className={s.comparacao} style={{ gridTemplateColumns: estreito ? '1fr' : `repeat(${cena.colunas.length}, 1fr)` }}>
      {cena.colunas.map((c, ci) => {
        const Ic = ICONES[c.icone];
        const cor = COR[c.tom ?? 'marca'];
        return (
          <motion.div
            key={ci}
            className={s.compCartao}
            style={{ borderColor: `${cor}55` }}
            initial={parado ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + ci * 0.25, duration: 0.4 }}
          >
            <div className={s.compTitulo} style={{ color: cor }}>
              <Ic size={16} strokeWidth={1.9} />
              {c.titulo}
            </div>
            <ul>
              {c.itens.map((it, ii) => (
                <motion.li
                  key={ii}
                  initial={parado ? false : { opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + ci * 0.25 + ii * 0.22, duration: 0.3 }}
                >
                  <CircleCheck size={13} strokeWidth={2} style={{ color: cor, flex: '0 0 auto', marginTop: 3 }} />
                  <span>{it}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- despacho

/** `parado`: desenha o estado final, sem animar (quem chama decide: "reduzir movimento" do aparelho, a menos que a pessoa peça para ver). */
export default function Cena({ cena, parado }: { cena: CenaDados; parado: boolean }) {
  switch (cena.tipo) {
    case 'fluxo':
      return <Fluxo cena={cena} parado={parado} />;
    case 'linhaTempo':
      return <LinhaTempo cena={cena} parado={parado} />;
    case 'carteira':
      return <Carteira cena={cena} parado={parado} />;
    case 'cupom':
      return <Cupom cena={cena} parado={parado} />;
    case 'status':
      return <Status cena={cena} parado={parado} />;
    case 'niveis':
      return <Niveis cena={cena} parado={parado} />;
    case 'formulario':
      return <Formulario cena={cena} parado={parado} />;
    case 'comparacao':
      return <Comparacao cena={cena} parado={parado} />;
  }
}
