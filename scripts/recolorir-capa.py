#!/usr/bin/env python3
"""
Recolore o FILME de uma capa de rolo, preservando a composição pixel a pixel.

POR QUE ISTO EXISTE
-------------------
As capas de rolo da MetaCast MCX (e das demais linhas) foram geradas por IA a
partir de um template aprovado. A composição saiu certa — enquadramento, tubete,
paper label METAMARK, logo no canto superior esquerdo — mas a COR do filme saiu
com viés sistemático: mais escura e mais dessaturada que o chip do catálogo, às
vezes com o matiz deslocado. Medições da MCX: Volcano Red 32 pontos de valor
abaixo, Speed Green 24 e com matiz errado, Miami Blue 23, Chalk Grey 16,
Monza Yellow 12, Jet Black 10.

Regerar a imagem para corrigir a cor foi tentado e não funciona: o modelo
reconstrói a composição, o rótulo sai girado ou ilegível, e a capa deixa de
seguir o padrão da linha. A correção certa é aritmética, não generativa —
a composição já está aprovada, só o filme precisa andar no espaço de cor.

COMO FUNCIONA
-------------
1. Converte a imagem para HSV e mede a cor do filme (mediana de H, S e V sobre
   a máscara), para saber de ONDE se está partindo. Nada é chutado.
2. Monta uma máscara do filme por MATIZ + SATURAÇÃO. Numa capa de rolo o filme é
   a única região cromática grande: o fundo é branco, o tubete é papelão, o label
   é magenta. Uma faixa de matiz resolve sem segmentação. As bordas da máscara
   entram por rampa e levam um desfoque gaussiano leve, o que evita o halo que
   aparece quando se usa máscara binária (tentativa anterior com
   `binary_propagation` cresceu por cima do label e comeu a marca).
3. Aplica a transformação:
      matiz      — desloca para o alvo e COMPRIME o espalhamento em torno dele,
                   o que corrige matiz errado sem achatar a variação natural;
      saturação  — curva de gama, não multiplicação;
      valor      — curva de gama, não multiplicação.
   A gama é escolhida para levar a MEDIANA medida exatamente ao alvo mantendo
   0 em 0 e 1 em 1. Multiplicar estoura a crista do cilindro e fecha a barriga
   em preto; a gama preserva o gradiente inteiro.
4. Mede o resultado com o mesmo critério e imprime antes/depois. Se a medição
   final não bater com o alvo, a correção não foi aplicada — é o teste.

USO
---
    python3 scripts/recolorir-capa.py \\
        --entrada public/assets/images/shop/metamark-mcx/mcx-63-speed-green.webp \\
        --alvo '#548C46'

    # sobrescrevendo no lugar, depois de conferir:
    python3 scripts/recolorir-capa.py --entrada <arquivo> --alvo '#548C46' --no-lugar

O alvo é a LEITURA DE COR da amostra física (hex canônico medido no leque), não
o hex do chip da brochure. A leitura mora no comentário do slug em
`src/lib/shop/generic.ts`.

Requer: numpy, scipy, pillow.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, binary_fill_holes, gaussian_filter, label as rotular

# Faixa de matiz de cada família de cor, em graus. A máscara pega o filme por
# matiz; fora destas faixas está o que NÃO pode ser tocado (label magenta,
# papelão, fundo). `vermelho` cruza o zero e é tratado à parte.
#
# `neutro` é o caso dos pretos, brancos e cinzas (MCX-10, MCX-12, MCX-22,
# MCX-26, MCX-96, MCX-97...). Neles o filme NÃO tem matiz próprio para servir de
# máscara — um Gotham Black marca 11% de saturação, abaixo do piso que separa
# filme de fundo nas cores cromáticas. Aí a seleção inverte: pega-se o que é
# QUASE ACINZENTADO dentro de uma faixa de valor, o que exclui o fundo branco
# (claro demais) e o tubete de papelão (saturado e quente).
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


def hex_para_rgb(h: str) -> tuple[float, float, float]:
    h = h.strip().lstrip('#')
    if len(h) != 6:
        raise ValueError(f'hex inválido: {h}')
    return tuple(int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))  # type: ignore[return-value]


def rgb_para_hsv(a: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """a: (...,3) em 0..1 → (H em 0..360, S em 0..1, V em 0..1)."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = a.max(-1)
    d = mx - a.min(-1)
    v = mx
    s = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0.0)
    h = np.zeros_like(mx)
    m = d > 1e-6
    er = m & (mx == r)
    eg = m & (mx == g) & ~er
    eb = m & (mx == b) & ~er & ~eg
    dd = np.maximum(d, 1e-6)
    h[er] = (60 * (((g - b) / dd) % 6))[er]
    h[eg] = (60 * (((b - r) / dd) + 2))[eg]
    h[eb] = (60 * (((r - g) / dd) + 4))[eb]
    return h % 360, s, v


def hsv_para_rgb(h: np.ndarray, s: np.ndarray, v: np.ndarray) -> np.ndarray:
    hh = (h % 360) / 60.0
    i = np.floor(hh).astype(int) % 6
    f = hh - np.floor(hh)
    p = v * (1 - s)
    q = v * (1 - s * f)
    t = v * (1 - s * (1 - f))
    r = np.choose(i, [v, q, p, p, t, v])
    g = np.choose(i, [t, v, v, q, p, p])
    b = np.choose(i, [p, p, t, v, v, q])
    return np.stack([r, g, b], -1)


def rampa(x: np.ndarray, lo: float, hi: float) -> np.ndarray:
    return np.clip((x - lo) / (hi - lo), 0.0, 1.0)


def montar_mascara(
    h: np.ndarray, s: np.ndarray, v: np.ndarray,
    familia: str, sat_min: float, val_min: float, feather: float,
    val_max: float = 0.80, sat_max: float = 0.34,
) -> np.ndarray:
    """Máscara suave do filme. Bordas por rampa + gaussiana: sem halo, sem
    invadir o label."""
    if familia == 'neutro':
        ms = 1 - rampa(s, sat_max * 0.7, sat_max)   # descarta papelão e magenta
        mv = rampa(v, val_min * 0.5, val_min) * (1 - rampa(v, val_max, val_max + 0.12))
        return np.clip(gaussian_filter(ms * mv, feather), 0.0, 1.0)
    lo, hi = FAIXAS[familia]
    larg = 14.0  # largura da rampa de matiz, em graus
    if lo > hi:  # faixa que cruza 0° (vermelho)
        dentro = rampa(h, lo - larg, lo) + rampa(-h, -hi, -hi + larg)
        mh = np.clip(dentro, 0, 1)
    else:
        mh = rampa(h, lo, lo + larg) * (1 - rampa(h, hi - larg, hi))
    ms = rampa(s, sat_min * 0.6, sat_min)
    # O teto de valor também vale para cor cromática, e não valia. Numa cor
    # escura e fraca como a MCX-66 Army Olive (S 20%, V 25%) a saturação NÃO
    # separa filme de fundo: o filme desce a 3,8% nas sombras e o branco do
    # estúdio está em 2%. Quem separa é o valor. Sem este teto, era preciso
    # subir o sat_min para proteger o fundo, e aí a máscara perdia as partes
    # escuras do rolo — a capa saía remendada.
    mv = rampa(v, val_min * 0.5, val_min) * (1 - rampa(v, val_max, val_max + 0.12))
    return np.clip(gaussian_filter(mh * ms * mv, feather), 0.0, 1.0)


def achar_label(h: np.ndarray, s: np.ndarray, v: np.ndarray, margem: int) -> np.ndarray:
    """Disco do paper label METAMARK, para ficar FORA da recoloração.

    O campo magenta do label (matiz ~330°) cai dentro da faixa 'vermelho' e
    'rosa'. Sem esta proteção, recolorir uma capa vermelha repinta a marca e
    deixa um halo de matiz oposto na borda serrilhada entre o magenta e o
    branco do label. Aqui o magenta é achado, o maior blob é tomado como o
    label, os furos (o texto branco por dentro) são preenchidos e o resultado
    é dilatado pela margem — crescer a PROTEÇÃO é inócuo, ao contrário de
    crescer a máscara do filme.
    """
    # A saturação mínima é 0,55, não 0,30, e o motivo é concreto: numa capa roxa
    # (MCX-87 Plum Crazy) parte do próprio filme cai na faixa de matiz do
    # magenta. A 0,30 isso marcava 13,6% da imagem, o maior blob unia label e
    # lataria, e a elipse resultante cobria o rolo inteiro — a correção deixava
    # uma mancha oval enorme por cima do filme. A 0,55 as capas roxa, verde e
    # azul convergem todas em ~1,9%, que é o label e mais nada. O campo magenta
    # impresso é muito mais saturado que qualquer filme da linha.
    magenta = ((h >= 300) & (h <= 352) & (s >= 0.55) & (v >= 0.15))
    if magenta.sum() < 200:
        return np.zeros_like(magenta)
    marcas, n = rotular(magenta)
    if n == 0:
        return np.zeros_like(magenta)
    maior = 1 + int(np.argmax(np.bincount(marcas.ravel())[1:]))
    disco = binary_fill_holes(marcas == maior)
    # Cinto e suspensório: o label ocupa uns 3% da capa. Se o blob passou de 8%,
    # alguma coisa se fundiu com ele e proteger aquilo faria mais estrago do que
    # não proteger nada.
    if disco.mean() > 0.08:
        return np.zeros_like(magenta)
    # o label é maior que só o campo magenta: fecha a elipse inteira pelo bbox
    ys, xs = np.nonzero(disco)
    cy, cx = (ys.min() + ys.max()) / 2, (xs.min() + xs.max()) / 2
    ry, rx = (ys.max() - ys.min()) / 2 + margem, (xs.max() - xs.min()) / 2 + margem
    Y, X = np.ogrid[:h.shape[0], :h.shape[1]]
    elipse = ((Y - cy) / max(ry, 1)) ** 2 + ((X - cx) / max(rx, 1)) ** 2 <= 1.0
    return binary_dilation(disco | elipse, iterations=2)


def medir(a: np.ndarray, sel: np.ndarray) -> dict:
    h, s, v = rgb_para_hsv(a)
    rgb = [int(round(float(np.median(a[..., k][sel])) * 255)) for k in range(3)]
    return {
        'hex': '#%02X%02X%02X' % tuple(rgb),
        'h': float(np.median(h[sel])),
        's': float(np.median(s[sel])) * 100,
        'v': float(np.median(v[sel])) * 100,
        'v_p10_p90': tuple(np.percentile(v[sel], [10, 90]) * 100),
        's_p10_p90': tuple(np.percentile(s[sel], [10, 90]) * 100),
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--entrada', required=True, help='capa de origem (.webp/.png/.jpg)')
    ap.add_argument('--alvo', required=True, help="hex da LEITURA da amostra, ex '#548C46'")
    ap.add_argument('--saida', help='destino; padrão = <entrada>-recolorido.png')
    ap.add_argument('--no-lugar', action='store_true', help='sobrescreve a entrada, no formato dela')
    ap.add_argument('--familia', default='verde', choices=sorted(FAIXAS),
                    help="faixa de matiz do filme; use 'neutro' para pretos, brancos e cinzas E TAMBÉM "
                         "para cor fraca, abaixo de ~15%% de saturação: na MCX-66 Army Olive (S 11%%) a "
                         "máscara por matiz deixava remendo e a por valor saiu limpa (padrão: verde)")
    ap.add_argument('--val-max', type=float, default=0.80,
                    help="só em --familia neutro: acima disto é o fundo branco do estúdio")
    ap.add_argument('--sat-max', type=float, default=0.34,
                    help="só em --familia neutro: acima disto é papelão ou o magenta do label")
    ap.add_argument('--compressao-matiz', type=float, default=0.60,
                    help='0 = todo o filme vira um matiz só; 1 = mantém o espalhamento original (padrão: 0.60)')
    ap.add_argument('--sat-min', type=float, default=0.18, help='abaixo disto é cinza/branco e não entra na máscara')
    ap.add_argument('--val-min', type=float, default=0.09, help='abaixo disto é preto e não entra na máscara')
    ap.add_argument('--feather', type=float, default=1.2, help='desfoque da borda da máscara, em px')
    ap.add_argument('--margem-label', type=int, default=10,
                    help='folga em px em volta do paper label protegido (0 desliga a proteção)')
    ap.add_argument('--janela',
                    help='limita a correção a um recorte, em frações: esq,topo,dir,base. Existe porque '
                         'em FOTO o cenário divide a faixa de matiz com o carro: na MCX-65, céu cinza-azulado '
                         'entrou na máscara e a rotação de 34 graus deixou o céu verde. A borda é suavizada, '
                         'então não fica emenda visível')
    ap.add_argument('--qualidade', type=int, default=88, help='qualidade do webp de saída')
    ap.add_argument('--manter-valor', action='store_true',
                    help='corrige matiz e saturação e deixa o valor como está — é o caso de FOTO '
                         'de cena, onde a mediana fica abaixo da leitura porque metade da lataria '
                         'está em sombra, e levantar isso clarearia o carro inteiro sem motivo')
    ap.add_argument('--manter-matiz', action='store_true',
                    help='não desloca o matiz; use quando só a saturação ou o valor estão fora')
    args = ap.parse_args()

    src = Path(args.entrada)
    if not src.exists():
        print(f'erro: não achei {src}', file=sys.stderr)
        return 1

    im = Image.open(src).convert('RGB')
    a = np.asarray(im).astype(np.float32) / 255.0
    h, s, v = rgb_para_hsv(a)

    mask = montar_mascara(h, s, v, args.familia, args.sat_min, args.val_min, args.feather,
                          args.val_max, args.sat_max)
    if args.janela:
        fx0, fy0, fx1, fy1 = (float(z) for z in args.janela.split(','))
        H, W = h.shape
        rect = np.zeros(h.shape, np.float32)
        rect[int(fy0 * H):int(fy1 * H), int(fx0 * W):int(fx1 * W)] = 1.0
        # borda suave: emenda dura apareceria se a janela cortasse o próprio carro
        mask = mask * gaussian_filter(rect, max(6.0, min(H, W) * 0.01))

    label = achar_label(h, s, v, args.margem_label) if args.margem_label > 0 else np.zeros(h.shape, bool)
    if label.any():
        mask = mask * gaussian_filter((~label).astype(np.float32), args.feather)
    nucleo = mask > 0.8
    if nucleo.sum() < 500:
        print('erro: máscara vazia — família de matiz errada para esta capa?', file=sys.stderr)
        return 1

    antes = medir(a, nucleo)
    h_alvo, s_alvo, v_alvo = rgb_para_hsv(np.array(hex_para_rgb(args.alvo), dtype=np.float32))
    h_alvo, s_alvo, v_alvo = float(h_alvo), float(s_alvo), float(v_alvo)

    # Gama que leva a mediana medida exatamente ao alvo, preservando 0 e 1.
    gama_s = np.log(max(s_alvo, 1e-4)) / np.log(max(antes['s'] / 100, 1e-4))
    gama_v = 1.0 if args.manter_valor else np.log(max(v_alvo, 1e-4)) / np.log(max(antes['v'] / 100, 1e-4))

    # Matiz é CIRCULAR: a diferença tem de vir pelo caminho curto. Sem isto, numa
    # capa vermelha os pixels logo acima de 0° distam ~346° dos logo abaixo de
    # 360°, a compressão os joga para o outro lado da roda e aparece um anel
    # verde em volta do label. Foi exatamente o que o teste do Volcano Red pegou.
    dh = (h - antes['h'] + 180.0) % 360.0 - 180.0
    h2 = h.copy() if args.manter_matiz else (h_alvo + dh * args.compressao_matiz) % 360.0
    s2 = np.clip(np.clip(s, 1e-4, 1.0) ** gama_s, 0, 1)
    v2 = np.clip(np.clip(v, 1e-4, 1.0) ** gama_v, 0, 1)

    m = mask[..., None]
    out = np.clip(a * (1 - m) + hsv_para_rgb(h2, s2, v2) * m, 0, 1)
    depois = medir(out, nucleo)

    dst = Path(args.entrada) if args.no_lugar else Path(args.saida or src.with_name(src.stem + '-recolorido.png'))
    img = Image.fromarray((out * 255 + 0.5).astype(np.uint8))
    if dst.suffix.lower() == '.webp':
        img.save(dst, 'WEBP', quality=args.qualidade, method=6)
    else:
        img.save(dst)

    cob = mask.mean() * 100
    prot = f' · label protegido {label.mean() * 100:.1f}%' if label.any() else ' · label NÃO encontrado'
    print(f'máscara     {cob:.1f}% da imagem   (gama S {gama_s:.3f} · gama V {gama_v:.3f} · matiz {h_alvo - antes["h"]:+.1f}°{prot})')
    print(f'antes       {antes["hex"]}  H {antes["h"]:.1f}  S {antes["s"]:.1f}  V {antes["v"]:.1f}')
    print(f'depois      {depois["hex"]}  H {depois["h"]:.1f}  S {depois["s"]:.1f}  V {depois["v"]:.1f}')
    print(f'alvo        {args.alvo.upper()}  H {h_alvo:.1f}  S {s_alvo * 100:.1f}  V {v_alvo * 100:.1f}')
    # Estouro de verdade, medido: quanto do filme encostou no teto de S ou de V.
    # Passar de ~2% quer dizer que a correção pedida é grande demais para esta
    # capa — o gradiente perde informação e a peça fica chapada. Nesse caso a
    # capa precisa ser REGERADA na cor certa, não corrigida.
    _, s_fin, v_fin = rgb_para_hsv(out)
    corte_s = float((s_fin[nucleo] >= 0.995).mean()) * 100
    corte_v = float((v_fin[nucleo] >= 0.995).mean()) * 100
    print(f'gradiente   V {depois["v_p10_p90"][0]:.0f}→{depois["v_p10_p90"][1]:.0f}   '
          f'S {depois["s_p10_p90"][0]:.0f}→{depois["s_p10_p90"][1]:.0f}   '
          f'(estouro S {corte_s:.1f}% · V {corte_v:.1f}%)')
    print(f'gravado em  {dst}')

    saida = 0
    # Matiz só entra na conta do erro quando há cor suficiente para ele
    # significar algo. Num preto a 5% de saturação um nível de canal move o
    # matiz dezenas de graus, e a capa da MCX-12 disparava alarme por isso
    # estando correta.
    dh_err = 0.0 if depois['s'] < 10 or args.manter_matiz else abs((depois['h'] - h_alvo + 180) % 360 - 180)
    # Com --manter-valor a diferença de valor é intencional, não desvio.
    dv_err = 0.0 if args.manter_valor else abs(depois['v'] - v_alvo * 100)
    erro = max(dh_err, abs(depois['s'] - s_alvo * 100), dv_err)
    if erro > 1.5:
        print(f'ATENÇÃO: desvio de {erro:.1f} contra o alvo — confira antes de publicar', file=sys.stderr)
        saida = 2
    # Estouro não é o único jeito de estragar a imagem. Uma gama de valor longe
    # de 1 aplicada sobre JPEG amplifica a quantização em blocos 8x8: na foto de
    # detalhe da MCX-87, corrigir V de 68 para 46 deu gama 2,0 e o painel saiu
    # com bandas e blocos visíveis, apesar de estouro zero. Fonte tão longe do
    # alvo assim precisa ser REGERADA, não corrigida.
    if not 0.6 <= gama_v <= 1.6 or not 0.5 <= gama_s <= 2.0:
        print(f'ATENÇÃO: correção agressiva (gama V {gama_v:.2f} · gama S {gama_s:.2f}). '
              f'Em JPEG isso costuma sair com bandas — confira a imagem de perto, '
              f'e se aparecer bloco, regere em vez de corrigir.', file=sys.stderr)
        saida = max(saida, 4)
    if max(corte_s, corte_v) > 2.0:
        print(f'ATENÇÃO: {max(corte_s, corte_v):.1f}% do filme estourou — correção grande demais, '
              f'esta capa precisa ser regerada na cor, não corrigida', file=sys.stderr)
        saida = 3
    return saida


if __name__ == '__main__':
    raise SystemExit(main())
