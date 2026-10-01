/**
 * Correção de cor em JavaScript puro, sem Python.
 *
 * POR QUE EXISTE
 * --------------
 * A correção morava só em `scripts/recolorir-capa.py`, e o `--tudo` do
 * publicar-cor.mjs dependia de achar na máquina um Python com numpy, scipy e
 * pillow. Na máquina de produção não tinha, e o comando único parava no meio —
 * com as imagens já baixadas e nada commitado.
 *
 * Aqui está a MESMA matemática, sobre buffer cru do sharp, que o projeto já usa
 * para converter as imagens. Zero dependência nova.
 *
 * O Python continua existindo e continua sendo a referência documentada: é a
 * ferramenta de inspeção manual, onde dá para ver antes/depois e mexer nos
 * parâmetros. Este módulo é o caminho automático. Quem mexer em um tem que
 * mexer no outro — a conferência é rodar os dois na mesma imagem e comparar
 * `depois`.
 */

export const FAIXAS = {
  neutro: null,
  vermelho: [330, 30], laranja: [12, 48], amarelo: [35, 75],
  verde: [72, 200], azul: [175, 265], roxo: [250, 320], rosa: [290, 350],
  // salvia: verde-acinzentado amarelado (ESG-036 Armor Green, H 76). Cai bem na
  // borda de 'verde' (rampa 72-86) e de 'amarelo' (termina em 75): nas duas a
  // mascara pegava menos da metade do filme.
  salvia: [50, 115],
  // malva: rosa pastel que atravessa a borda de 'rosa' (termina em 350). Na ESG-040
  // Oolong Milk Tea Pink as geracoes nascem entre H 340 e 349 e a mascara 'rosa'
  // saia vazia no macro. Cruza 0 graus, entao pega o vermelho do logo (H ~2):
  // usar sempre com `marca_depois`, nunca com `logo`.
  malva: [300, 5],
  // dourado: ouro/latão metálico (EDG-025 Solar Gold, H 45). As gerações nascem
  // entre H 37 e 41, na borda de 'laranja' (rampa 34-48) e de 'amarelo' (rampa
  // 35-49): em H 41 as duas dão 0,5 e a capa saiu com máscara vazia. Longe do
  // vermelho do logo (H ~1), então vale com `logo`.
  dourado: [22, 62],
  // violeta: roxo-azulado (EDG-027 Midnight Purple, H 255). Nasce entre H 255 e
  // 275, na rampa de entrada de 'roxo' (250-264) e na de saida de 'azul'
  // (251-265). Longe do vermelho do logo — vale com `logo`.
  violeta: [225, 285],
  // orquidea: rosa-orquidea (EMT-024 Pearl Pink, H 323). As geracoes nascem em H 333-337,
  // fora de 'rosa' (rampa 336-350); 'malva' cruza 0 grau e deixou as lanternas vermelhas
  // do i8 rosa-magenta. Termina em 352: vermelho de lanterna e do logo (H >= 355) fica de
  // fora, entao vale com `logo`.
  orquidea: [305, 352],
  // musgo: verde-musgo/oliva escuro (EDG-026 Sonoma Green, cartao H ~89 com balanco de
  // branco). O gerador entrega esse verde em H 50-64, fora de 'verde' (comeca em 72) e
  // na rampa de 'salvia' (50-64): a correcao precisa pegar de H ~54 ate o alvo.
  musgo: [40, 130],
  // militar: verde-militar fosco (EMA-007 Army Green, H 105). O gerador entrega H ~84 e a
  // lataria acinzentada (S 10-18) pede sat_min baixo; com 'musgo' (40-130) isso tingia o
  // concreto amarelado (H 40-60) e com 'verde' (ate 200) o cinza-azulado do hangar. 65-130
  // deixa os dois de fora.
  militar: [65, 130],
};

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const rampa = (x, lo, hi) => clamp((x - lo) / (hi - lo), 0, 1);

export function rgbParaHsv(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d > 1e-6) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, mx > 1e-6 ? d / mx : 0, mx];
}

export function hsvParaRgb(h, s, v) {
  const hh = ((((h % 360) + 360) % 360)) / 60;
  const i = Math.floor(hh) % 6, f = hh - Math.floor(hh);
  const p = v * (1 - s), q = v * (1 - s * f), t = v * (1 - s * (1 - f));
  return [[v, q, p, p, t, v][i], [t, v, v, q, p, p][i], [p, p, t, v, v, q][i]];
}

/** Desfoque de caixa separável, duas passadas: aproxima gaussiana. */
function borrar(m, W, H, raio) {
  if (raio < 1) return m;
  const a = new Float32Array(W * H), b = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let s = 0, n = 0;
      for (let k = -raio; k <= raio; k++) {
        const xx = x + k; if (xx < 0 || xx >= W) continue;
        s += m[y * W + xx]; n++;
      }
      a[y * W + x] = s / n;
    }
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let s = 0, n = 0;
      for (let k = -raio; k <= raio; k++) {
        const yy = y + k; if (yy < 0 || yy >= H) continue;
        s += a[yy * W + x]; n++;
      }
      b[y * W + x] = s / n;
    }
  }
  return b;
}

function mediana(arr) {
  if (!arr.length) return 0;
  const z = Float64Array.from(arr).sort();
  return z[z.length >> 1];
}

/**
 * @param {Buffer} buf  RGB cru, 3 bytes por pixel
 * @param {object} o    { W, H, alvo:[h,s,v], familia, manterValor, manterMatiz }
 */
export function recolorir(buf, o) {
  const { W, H } = o;
  const [hAlvo, sAlvo, vAlvo] = o.alvo;
  const satMin = o.satMin ?? 0.18, valMin = o.valMin ?? 0.09;
  const valMax = o.valMax ?? 0.80, satMax = o.satMax ?? 0.34;
  const N = W * H;

  const Hh = new Float32Array(N), Ss = new Float32Array(N), Vv = new Float32Array(N);
  for (let p = 0; p < N; p++) {
    const [h, s, v] = rgbParaHsv(buf[p * 3] / 255, buf[p * 3 + 1] / 255, buf[p * 3 + 2] / 255);
    Hh[p] = h; Ss[p] = s; Vv[p] = v;
  }

  const m = new Float32Array(N);
  const faixa = FAIXAS[o.familia];
  const larg = 14;
  for (let p = 0; p < N; p++) {
    let mh;
    if (faixa === null) {
      mh = 1 - rampa(Ss[p], satMax * 0.7, satMax);
    } else {
      const [lo, hi] = faixa;
      mh = lo > hi
        ? clamp(rampa(Hh[p], lo - larg, lo) + rampa(-Hh[p], -hi, -hi + larg), 0, 1)
        : rampa(Hh[p], lo, lo + larg) * (1 - rampa(Hh[p], hi - larg, hi));
    }
    const ms = faixa === null ? 1 : rampa(Ss[p], satMin * 0.6, satMin);
    const mv = rampa(Vv[p], valMin * 0.5, valMin) * (1 - rampa(Vv[p], valMax, valMax + 0.12));
    m[p] = mh * ms * mv;
  }
  const mask = borrar(m, W, H, o.feather ?? 1);

  const sel = [];
  for (let p = 0; p < N; p++) if (mask[p] > 0.5) sel.push(p);
  if (sel.length < 500) throw new Error('máscara vazia — família de matiz errada para esta imagem?');

  const medH = mediana(sel.map((p) => Hh[p]));
  const medS = mediana(sel.map((p) => Ss[p]));
  const medV = mediana(sel.map((p) => Vv[p]));

  // gama que leva a mediana ao alvo mantendo 0 em 0 e 1 em 1.
  // Multiplicar estoura a crista do cilindro; a gama preserva o gradiente.
  const gama = (de, para) => (de <= 1e-4 || de >= 0.9999 ? 1 : Math.log(para) / Math.log(de));
  const gamaS = clamp(gama(medS, sAlvo), 0.15, 6);
  const gamaV = o.manterValor ? 1 : clamp(gama(medV, vAlvo), 0.15, 6);
  const dMatiz = ((((hAlvo - medH + 180) % 360) + 360) % 360) - 180;
  const comp = o.compressaoMatiz ?? 0.60;

  let corteS = 0, corteV = 0, nMask = 0;
  const saida = Buffer.allocUnsafe(N * 3);
  for (let p = 0; p < N; p++) {
    const w = mask[p];
    let r = buf[p * 3] / 255, g = buf[p * 3 + 1] / 255, b = buf[p * 3 + 2] / 255;
    if (w > 0.002) {
      // matiz é circular: a diferença tem de vir pelo caminho curto, senão numa
      // imagem vermelha os pixels logo acima de 0° são jogados para o outro lado
      // da roda e aparece um anel da cor oposta.
      const dh = ((((Hh[p] - medH + 180) % 360) + 360) % 360) - 180;
      const h2 = o.manterMatiz ? Hh[p] : hAlvo + dh * comp;
      const s2 = clamp(Math.pow(Ss[p], gamaS), 0, 1);
      const v2 = clamp(Math.pow(Vv[p], gamaV), 0, 1);
      // Estouro e o que a correcao CRIA, nao o total de pixels no teto.
      // Numa cor de saturacao quase maxima (a ESG-033 Python Green le S 98) boa
      // parte dos pixels ja nasce em 100% — isso e a cor, nao dano. Contar o
      // total abortava a publicacao de uma correcao que tinha fechado exata.
      if (Ss[p] > 0.02) {
        nMask++;
        if (s2 >= 0.999 && Ss[p] < 0.999) corteS++;
        if (v2 >= 0.999 && Vv[p] < 0.999) corteV++;
      }
      const [r2, g2, b2] = hsvParaRgb(h2, s2, v2);
      r = r * (1 - w) + r2 * w; g = g * (1 - w) + g2 * w; b = b * (1 - w) + b2 * w;
    }
    saida[p * 3] = clamp(Math.round(r * 255), 0, 255);
    saida[p * 3 + 1] = clamp(Math.round(g * 255), 0, 255);
    saida[p * 3 + 2] = clamp(Math.round(b * 255), 0, 255);
  }

  // Mede de novo com o mesmo critério. Se a medição final não bate com o alvo,
  // a correção não foi aplicada — é o teste, não um relatório.
  const dH = [], dS = [], dV = [];
  for (const p of sel) {
    const [h, s, v] = rgbParaHsv(saida[p * 3] / 255, saida[p * 3 + 1] / 255, saida[p * 3 + 2] / 255);
    dH.push(h); dS.push(s); dV.push(v);
  }
  return {
    antes: { h: medH, s: medS * 100, v: medV * 100 },
    depois: { h: mediana(dH), s: mediana(dS) * 100, v: mediana(dV) * 100 },
    gamaS, gamaV, dMatiz,
    corteS: nMask ? (corteS / nMask) * 100 : 0,
    corteV: nMask ? (corteV / nMask) * 100 : 0,
    buf: saida,
  };
}

export function hexParaHsv(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return rgbParaHsv(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}
