#!/usr/bin/env python3
"""
Mede a cor da lataria de uma foto de aplicação e compara com a leitura da cor.

POR QUE ISTO EXISTE
-------------------
Toda foto de aplicação gerada precisa ser conferida contra a leitura da amostra
antes de entrar no anúncio. Isso vinha sendo feito com script escrito na hora,
uma versão por cor, e o custo apareceu: máscara contaminada pelo mar ao fundo
numa foto de costa, patch de "teto" que na verdade pegou o para-brisa, e uma
versão que simplesmente quebrou. Erro de medição custa uma rodada inteira de
geração, que é a parte cara.

Aqui a máscara é definida por código e a medida é sempre a mesma, então os
números de cores diferentes podem ser comparados entre si.

COMO FUNCIONA
-------------
1. Reduz a imagem a uma grade de células e mede cada célula. Medir por célula, e
   não por pixel, é o que torna o número comparável ao que o olho vê: num painel
   escuro o ruído do sensor infla a saturação por pixel sem que ninguém enxergue
   cor nenhuma ali. Na MCX-12 a mesma foto deu S 14% por pixel e S 6% por célula
   — a segunda é a verdadeira.
2. Seleciona as células de lataria por matiz e por faixa de valor. Céu, asfalto,
   concreto e vegetação caem fora por matiz ou por serem claros demais.
3. Para cores neutras (preto, branco, cinza) não existe matiz para separar, então
   a seleção usa valor + baixa saturação — o mesmo raciocínio de `--familia
   neutro` no recolorir-capa.py.
4. Imprime mediana, percentis e o desvio contra a leitura. Percentil importa:
   uma foto pode ter a mediana certa e mesmo assim estar errada se o capô abrir
   40 pontos acima do flanco, que foi o defeito da primeira Bavarian Blue.

USO
---
    python3 scripts/medir-cor.py --alvo '#2B67A8' --familia azul foto1.png foto2.png

    # cores neutras:
    python3 scripts/medir-cor.py --alvo '#272729' --familia neutro *.jpg

    # recortando a janela quando o fundo tem a mesma cor do carro (mar, céu,
    # vegetação numa cor verde), em frações da imagem: esquerda,topo,dir,base
    python3 scripts/medir-cor.py --alvo '#2B67A8' --familia azul \\
        --janela 0.13,0.50,0.95,0.84 foto.png

LIMITE CONHECIDO
----------------
Quando o CENÁRIO compartilha a faixa de matiz da cor, a janela pode não bastar.
Na MCX-66 Army Olive, num pátio com céu cinza-azulado e musgo na parede, a
medida deu H 154 a 169 enquanto amostras tiradas direto do painel da lataria
davam H 126 a 132 — o alvo. Céu e musgo entraram na máscara e puxaram o matiz
para o ciano. O sinal de alerta é a medida discordar do que o recolorir-capa.py
reporta como matiz de origem: as duas usam a mesma faixa, então divergência
grande quer dizer contaminação. Nesse caso, amostre um recorte só de lataria
antes de concluir que a foto está errada.

Requer: numpy, pillow.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

# Mesmas faixas do recolorir-capa.py, propositalmente: se a máscara que mede é
# diferente da máscara que corrige, o número medido não descreve o que mudou.
FAIXAS = {
    'neutro': None,
    'vermelho': (330.0, 30.0),
    'laranja': (12.0, 48.0),
    'amarelo': (35.0, 75.0),
    'verde': (72.0, 200.0),
    'azul': (175.0, 265.0),
    'roxo': (250.0, 320.0),
    'rosa': (290.0, 350.0),
}


def hex_para_hsv(h: str) -> tuple[float, float, float]:
    h = h.strip().lstrip('#')
    rgb = np.array([int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)], dtype=np.float32)
    hh, ss, vv = rgb_para_hsv(rgb)
    return float(hh), float(ss), float(vv)


def rgb_para_hsv(a: np.ndarray):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = a.max(-1)
    d = mx - a.min(-1)
    v = mx
    s = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0.0)
    h = np.zeros_like(mx)
    m = d > 1e-6
    er, eg = m & (mx == r), m & (mx == g) & ~(m & (mx == r))
    eb = m & (mx == b) & ~er & ~eg
    dd = np.maximum(d, 1e-6)
    h[er] = (60 * (((g - b) / dd) % 6))[er]
    h[eg] = (60 * (((b - r) / dd) + 2))[eg]
    h[eb] = (60 * (((r - g) / dd) + 4))[eb]
    return h % 360, s, v


def grade(a: np.ndarray, n: int) -> np.ndarray:
    H, W = a.shape[:2]
    ch, cw = H // n, W // n
    if ch < 1 or cw < 1:
        return a.reshape(-1, 1, 3).mean(1).reshape(H, W, 3)
    return a[:n * ch, :n * cw].reshape(n, ch, n, cw, 3).mean(axis=(1, 3))


def mascara(h, s, v, familia, sat_min, v_lo, v_hi):
    if familia == 'neutro':
        return (v >= v_lo) & (v <= v_hi) & (s <= 0.35)
    lo, hi = FAIXAS[familia]
    dentro = (h >= lo) | (h <= hi) if lo > hi else (h >= lo) & (h <= hi)
    return dentro & (s >= sat_min) & (v >= v_lo) & (v <= v_hi)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('imagens', nargs='+')
    ap.add_argument('--alvo', required=True, help="hex da leitura da amostra, ex '#2B67A8'")
    ap.add_argument('--familia', default='verde', choices=sorted(FAIXAS))
    ap.add_argument('--janela', help='recorte em frações: esq,topo,dir,base (ex 0.13,0.50,0.95,0.84)')
    ap.add_argument('--grade', type=int, default=48, help='células por lado (padrão 48)')
    ap.add_argument('--sat-min', type=float, default=0.25)
    ap.add_argument('--v-min', type=float, default=0.10)
    ap.add_argument('--v-max', type=float, default=0.97)
    args = ap.parse_args()

    ha, sa, va = hex_para_hsv(args.alvo)
    print(f'leitura     {args.alvo.upper()}  H {ha:.0f}  S {sa * 100:.1f}  V {va * 100:.1f}   (família {args.familia})')
    print()
    print(f'{"arquivo":<34} {"hex":>8} {"H":>5} {"S":>5} {"V":>5}  {"ΔH":>5} {"ΔS":>5} {"ΔV":>5}   '
          f'{"iluminado S/V":>13}  céls')

    falhas = 0
    for p in args.imagens:
        caminho = Path(p)
        if not caminho.exists():
            print(f'{caminho.name:<38}  não encontrado', file=sys.stderr)
            falhas += 1
            continue
        a = np.asarray(Image.open(caminho).convert('RGB')).astype(np.float32) / 255.0
        if args.janela:
            fx0, fy0, fx1, fy1 = (float(z) for z in args.janela.split(','))
            H, W = a.shape[:2]
            a = a[int(fy0 * H):int(fy1 * H), int(fx0 * W):int(fx1 * W)]
        cel = grade(a, args.grade)
        h, s, v = rgb_para_hsv(cel)
        sel = mascara(h, s, v, args.familia, args.sat_min, args.v_min, args.v_max)
        if sel.sum() < 30:
            print(f'{caminho.name:<38}  máscara vazia — família ou janela errada', file=sys.stderr)
            falhas += 1
            continue
        rgb = [float(np.median(cel[..., k][sel])) for k in range(3)]
        hm, sm, vm = (float(z) for z in rgb_para_hsv(np.array(rgb, dtype=np.float32)))

        # Painéis iluminados = quartil mais claro da lataria. É a parte da foto
        # comparável à leitura: a mediana do carro inteiro sempre cai abaixo da
        # amostra porque metade da lataria está em sombra. Nas fotos aprovadas da
        # MCX-63 a mediana deu 15 a 19 pontos abaixo da leitura e mesmo assim as
        # fotos estavam certas — era a sombra puxando, não a cor.
        vs, ss = v[sel], s[sel]
        corte = np.percentile(vs, 75)
        lit = vs >= corte
        lit_v, lit_s = float(np.median(vs[lit])) * 100, float(np.median(ss[lit])) * 100

        # Matiz não significa nada em cor quase acinzentada: a 3% de saturação
        # um único nível de canal move o matiz dezenas de graus.
        dh_txt = '    —' if sm < 0.10 else f'{(hm - ha + 180) % 360 - 180:+5.0f}'
        hexo = '#%02X%02X%02X' % tuple(int(round(z * 255)) for z in rgb)
        print(f'{caminho.name:<34} {hexo:>8} {hm:5.0f} {sm * 100:5.1f} {vm * 100:5.1f}  '
              f'{dh_txt} {(sm - sa) * 100:+5.1f} {(vm - va) * 100:+5.1f}   '
              f'{lit_s:5.1f} /{lit_v:5.1f}  {sel.sum():5d}')

        # O defeito que a primeira Bavarian Blue teve: o capô e o teto abriram 40
        # pontos acima do flanco E perderam saturação, virando um azul-céu pálido
        # que não parece a mesma cor do resto do carro. Amplitude larga sozinha
        # NÃO é defeito — foto externa com saia em sombra sempre tem. O que
        # denuncia é a saturação DESABAR justamente onde o valor sobe.
        # O limiar começou em 0,55 e disparou numa foto boa da Bavarian Blue por
        # uma casa decimal (35,4 contra 35,5). As quatro fotos aprovadas dela
        # caem entre 0,55 e 0,65, então 0,55 não tem folga nenhuma. Em 0,45 as
        # aprovadas passam com margem e o capô lavado de verdade — que era um
        # azul-céu pálido, quase branco — continua sendo pego.
        if sm >= 0.20 and lit_s < sm * 100 * 0.45:
            print(f'{"":<34}  {"ATENÇÃO":>8}: saturação cai de {sm * 100:.0f} para {lit_s:.0f} nos '
                  f'painéis iluminados — capô/teto lavado, lendo como outra cor')
            falhas += 1

    return 1 if falhas else 0


if __name__ == '__main__':
    raise SystemExit(main())
