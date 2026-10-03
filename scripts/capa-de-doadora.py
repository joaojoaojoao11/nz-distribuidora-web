#!/usr/bin/env python3
"""
Faz a capa de uma cor nova a partir de uma capa APROVADA, em UMA passada só.

POR QUE EXISTE
--------------
A receita da doadora tinha virado três comandos em sequência — recolorir,
neutralizar o especular, salvar — e cada um decodificava e reencodava o webp.
Duas gerações de perda em cima de uma imagem que já é lossy: o campo de cor
ganhava granulado e bloco, e o resultado parecia acetinado e sujo mesmo com a
medição de cor exata. Aqui tudo acontece em memória e o webp é escrito UMA vez.

E resolve os dois defeitos que sobravam depois da recoloração pura:

1. BRILHO COM O MATIZ DA DOADORA. O `recolorir-capa.py` deixa o especular fora da
   máscara de propósito (`--val-max 0,80`), senão a gama de valor achata a crista
   do cilindro. Só que preserva o matiz junto: recolorindo uma capa AZUL para
   verde, o corpo vira verde e o filete continua AZUL. O olho para de ler reflexo
   e lê uma faixa pintada por cima — a capa inteira fica fosca, e NENHUMA métrica
   de contraste acusa, porque o defeito é de cor.

2. BRILHO ESTREITO DEMAIS. Quando a cor nova é bem mais escura que a doadora
   (ESG-035 lê V 50, a doadora ESG-034 lê V 68), a gama de valor escurece o corpo
   e a banda clara encolhe junto. Sobra um filete fino sobre um campo chapado,
   que é a assinatura visual do acetinado. O reforço aqui devolve a banda larga e
   macia do padrão aprovado.

ORDEM DAS ETAPAS, e cada uma existe por um motivo:
    recolorir -> neutralizar -> alisar -> reforcar brilho -> gravar

Alisar vem ANTES do reforço, senão o reforço espalha o granulado junto.

USO
---
  python3 scripts/capa-de-doadora.py \\
    --doadora public/assets/images/shop/speed-wrapping/{slug-aprovado}.webp \\
    --saida   public/assets/images/shop/speed-wrapping/{slug-novo}.webp \\
    --alvo '#637F44' --familia-doadora azul
"""
from __future__ import annotations

import argparse
import importlib.util
import pathlib
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

AQUI = pathlib.Path(__file__).resolve().parent
_spec = importlib.util.spec_from_file_location('recolorir_capa', AQUI / 'recolorir-capa.py')
rc = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(rc)

FAIXAS = rc.FAIXAS


def gama(de: float, para: float) -> float:
    if de <= 1e-4 or de >= 0.9999:
        return 1.0
    return float(np.clip(np.log(para) / np.log(de), 0.15, 6.0))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--doadora', required=True, help='capa aprovada de origem')
    ap.add_argument('--saida', required=True, help='capa da cor nova')
    ap.add_argument('--alvo', required=True, help="hex da leitura da amostra, ex '#637F44'")
    ap.add_argument('--familia-doadora', required=True, choices=sorted(FAIXAS),
                    help='familia de matiz da capa DE ORIGEM, nao a da cor nova')
    ap.add_argument('--compressao-matiz', type=float, default=0.60)
    ap.add_argument('--val-max', type=float, default=0.80)
    ap.add_argument('--brilho-min', type=float, default=0.50,
                    help='onde comeca a banda clara; menor = banda mais larga')
    ap.add_argument('--contraste', type=float, default=1.35,
                    help='abertura do gradiente do cilindro em torno da mediana (1 desliga)')
    ap.add_argument('--reforco', type=float, default=0.18,
                    help='halo suave em volta da crista; forte demais leiteia a imagem')
    ap.add_argument('--alisar', type=float, default=0.80,
                    help='quanto do granulado sai nas areas planas (0 desliga)')
    ap.add_argument('--qualidade', type=int, default=95)
    o = ap.parse_args()

    a = np.asarray(Image.open(o.doadora).convert('RGB')).astype(np.float32) / 255.
    h, s, v = rc.rgb_para_hsv(a)
    hA, sA, vA = rc.rgb_para_hsv(np.array(rc.hex_para_rgb(o.alvo), np.float32)[None, None, :])
    hA, sA, vA = float(hA), float(sA), float(vA)

    # 1. RECOLORIR ---------------------------------------------------------
    m = rc.montar_mascara(h, s, v, o.familia_doadora, 0.18, 0.09, 1.2, o.val_max, 0.34)
    sel = m > 0.5
    if sel.sum() < 500:
        sys.exit('mascara vazia — familia da DOADORA errada?')
    medH, medS, medV = (float(np.median(x[sel])) for x in (h, s, v))
    gS, gV = gama(medS, sA), gama(medV, vA)
    dh = ((h - medH + 180) % 360) - 180
    h2 = hA + dh * o.compressao_matiz
    s2 = np.clip(s ** gS, 0, 1)
    v2 = np.clip(v ** gV, 0, 1)
    a = a * (1 - m[..., None]) + rc.hsv_para_rgb(h2, s2, v2) * m[..., None]

    # 2. NEUTRALIZAR o matiz da doadora que sobrou no brilho ----------------
    h, s, v = rc.rgb_para_hsv(a)
    lo, hi = FAIXAS[o.familia_doadora]
    larg = 15.0
    if lo > hi:
        mh = np.clip(rc.rampa(h, lo - larg, lo) + rc.rampa(-h, -hi, -hi + larg), 0, 1)
    else:
        mh = rc.rampa(h, lo - larg, lo) * (1 - rc.rampa(h, hi, hi + larg))
    mn = gaussian_filter(mh * (1 - rc.rampa(s, 0.27, 0.38))
                         * rc.rampa(v, o.brilho_min, o.brilho_min + 0.10), 1.5)
    a = np.clip(a * (1 - mn[..., None]) + v[..., None] * mn[..., None], 0, 1)

    # 3. ALISAR o granulado, so nas areas planas ---------------------------
    if o.alisar > 0:
        lum = a.mean(2)
        gy, gx = np.gradient(gaussian_filter(lum, 1.0))
        grad = np.hypot(gx, gy)
        plano = 1 - rc.rampa(grad, 0.004, 0.020)
        peso = (plano * o.alisar * (m > 0.02))[..., None]
        a = np.clip(a * (1 - peso) + gaussian_filter(a, (1.8, 1.8, 0)) * peso, 0, 1)

    # 4. REFORCAR o brilho -------------------------------------------------
    # Duas coisas diferentes, e a ordem importa.
    #
    # (a) CONTRASTE do gradiente do cilindro. Quando a cor nova e mais escura que
    #     a doadora, a gama de valor comprime a diferenca entre a crista e a aba
    #     de baixo, e o cilindro fica chapado — que e a assinatura do acetinado.
    #     Abrir o gradiente em torno da MEDIANA devolve o "molhado" sem mexer na
    #     cor media: a mediana e ponto fixo da transformacao, entao a medicao
    #     continua batendo o alvo.
    # (b) HALO em volta da crista, so depois. Sozinho ele leiteia a imagem
    #     inteira em vez de dar brilho — testado em 0,75 e fica pastel. Por isso
    #     ele e fraco e vem DEPOIS do contraste, que e quem faz o trabalho.
    rolo = (m > 0.02) | (mn > 0.02)
    if o.contraste != 1.0:
        h3, s3, v3 = rc.rgb_para_hsv(a)
        # ancora na mediana do FILME, nao do rolo inteiro: o rolo inclui o tubete
        # branco e a banda ja neutralizada, e ancorar neles puxa a cor para baixo.
        med = float(np.median(v3[sel]))
        v4 = np.clip(med + (v3 - med) * o.contraste, 0, 1)
        peso = gaussian_filter(rolo.astype(np.float32), 1.5)[..., None]
        a = np.clip(a * (1 - peso) + rc.hsv_para_rgb(h3, s3, v4) * peso, 0, 1)
    if o.reforco > 0:
        _, _, v3 = rc.rgb_para_hsv(a)
        crista = rc.rampa(v3, np.percentile(v3[rolo], 80), np.percentile(v3[rolo], 98)) * rolo
        halo = gaussian_filter(crista, 10) * o.reforco
        a = np.clip(a + (1 - a) * halo[..., None], 0, 1)

    # 5. GRAVAR uma vez -----------------------------------------------------
    h, s, v = rc.rgb_para_hsv(a)
    faixa = FAIXAS[rc.FAIXAS and next(k for k, val in FAIXAS.items()
                                      if val and val[0] <= hA <= val[1])] \
        if any(val and val[0] <= hA <= val[1] for val in FAIXAS.values()) else None
    fin = (np.abs(((h - hA + 180) % 360) - 180) < 25) & (s > 0.2)
    print(f'filme      H {np.median(h[fin]):.1f}  S {np.median(s[fin])*100:.1f}  '
          f'V {np.median(v[fin])*100:.1f}     alvo  H {hA:.1f}  S {sA*100:.1f}  V {vA*100:.1f}')
    resid = ((h > lo - 10) & (h < hi + 10) & (s > 0.06)).mean() * 100 if lo < hi else 0
    print(f'residuo da doadora   {resid:.2f}% da imagem')

    out = Image.fromarray((a * 255).round().astype(np.uint8))
    dest = o.saida
    if dest.lower().endswith('.webp'):
        out.save(dest, 'WEBP', quality=o.qualidade, method=6)
    else:
        out.save(dest)
    print(f'gravado em  {dest}   ({pathlib.Path(dest).stat().st_size/1024:.0f} kB)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
