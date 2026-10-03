#!/usr/bin/env python3
"""
Tira o matiz da DOADORA que sobrou no brilho, depois de recolorir uma capa.

POR QUE EXISTE
--------------
`recolorir-capa.py` deixa o especular de fora da máscara de propósito: o
`--val-max` corta acima de 0,80 para a gama de valor não achatar a crista do
cilindro. Isso preserva o brilho — mas preserva também o MATIZ dele.

Numa capa azul o filete especular é um branco-azulado, e isso lê como reflexo.
Recolorindo aquela capa para verde, o corpo vira verde e o filete continua AZUL.
O olho não lê mais reflexo: lê uma faixa pintada por cima. A capa inteira passa a
parecer acetinada, mesmo com a medição de brilho intacta — foi exatamente o que
aconteceu na ESG-035 (o corpo fechou em H 88,5 · S 46,5 · V 49,8, exato, e a capa
ainda assim parecia fosca).

Subir o `--val-max` para incluir o especular na máscara NÃO resolve: aí a gama de
valor come a crista e o resultado fica pior, sem brilho nenhum.

A correção é separar as duas coisas. O corpo do filme ganha matiz novo pela
recoloração; o especular só precisa perder o matiz VELHO e virar branco neutro —
que é o que um reflexo é de verdade.

COMO FUNCIONA
-------------
Seleciona os pixels claros que ainda carregam o matiz da doadora, e leva a
saturação deles a zero com rampa suave nas bordas, sem tocar no valor. O logo
fica fora por matiz (o vermelho da Speed Wrapping lê ~2°) e o fundo fica fora
por saturação.

USO
---
  python3 scripts/neutralizar-especular.py \\
    --entrada public/assets/images/shop/speed-wrapping/{slug}.webp \\
    --matiz-doadora 175,265 --no-lugar
"""
from __future__ import annotations

import argparse
import sys

import numpy as np
from PIL import Image
from scipy import ndimage


def rgb_para_hsv(a):
    mx, mn = a.max(2), a.min(2)
    d = mx - mn
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    h = np.zeros_like(mx)
    m = d > 1e-6
    i = (mx == r) & m
    h[i] = ((g - b)[i] / d[i]) % 6
    i = (mx == g) & m
    h[i] = ((b - r)[i] / d[i]) + 2
    i = (mx == b) & m
    h[i] = ((r - g)[i] / d[i]) + 4
    return (h * 60) % 360, np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0), mx


def rampa(x, lo, hi):
    return np.clip((x - lo) / (hi - lo), 0, 1)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--entrada', required=True)
    ap.add_argument('--saida')
    ap.add_argument('--no-lugar', action='store_true')
    ap.add_argument('--matiz-doadora', required=True,
                    help='faixa de matiz da capa de origem, ex "175,265" para azul')
    ap.add_argument('--sat-max', type=float, default=0.38,
                    help='acima disto é cor de verdade, não resto de especular')
    ap.add_argument('--val-min', type=float, default=0.55,
                    help='abaixo disto é sombra, não brilho')
    ap.add_argument('--feather', type=float, default=1.5)
    ap.add_argument('--qualidade', type=int, default=88)
    o = ap.parse_args()

    lo, hi = (float(x) for x in o.matiz_doadora.split(','))
    im = Image.open(o.entrada).convert('RGB')
    a = np.asarray(im).astype(np.float32) / 255.
    h, s, v = rgb_para_hsv(a)

    larg = 15
    if lo > hi:
        mh = np.clip(rampa(h, lo - larg, lo) + rampa(-h, -hi, -hi + larg), 0, 1)
    else:
        mh = rampa(h, lo - larg, lo) * (1 - rampa(h, hi, hi + larg))
    ms = 1 - rampa(s, o.sat_max * 0.7, o.sat_max)
    mv = rampa(v, o.val_min, o.val_min + 0.10)
    m = ndimage.gaussian_filter(mh * ms * mv, o.feather)

    # saturacao a zero = levar cada canal ao maximo do pixel, mantendo o valor
    saida = a * (1 - m[..., None]) + v[..., None] * m[..., None]
    saida = np.clip(saida, 0, 1)

    antes_s = float(np.median(s[m > 0.5])) if (m > 0.5).any() else 0.0
    _, s2, _ = rgb_para_hsv(saida)
    depois_s = float(np.median(s2[m > 0.5])) if (m > 0.5).any() else 0.0
    print(f'brilho neutralizado   {(m > 0.5).mean()*100:.1f}% da imagem   '
          f'S {antes_s*100:.1f} -> {depois_s*100:.1f}')

    dest = o.entrada if o.no_lugar else (o.saida or o.entrada.rsplit('.', 1)[0] + '-neutro.png')
    out = Image.fromarray((saida * 255).round().astype(np.uint8))
    if dest.lower().endswith('.webp'):
        out.save(dest, 'WEBP', quality=o.qualidade, method=6)
    else:
        out.save(dest)
    print(f'gravado em  {dest}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
