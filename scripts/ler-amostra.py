#!/usr/bin/env python3
"""
Leitura de cor de uma AMOSTRA FÍSICA, sem parâmetro escolhido a dedo.

POR QUE EXISTE
--------------
A leitura antiga era feita com uma janela HSV que eu escolhia olhando a foto.
Isso muda a resposta em 20 pontos: a ESG-030 lê S 87 numa janela e S 67 na
outra, nas MESMAS fotos. Quem escolhe a janela escolhe o resultado.

Aqui nada é escolhido por cor. O pipeline é sempre o mesmo:

  1. BALANÇO DE BRANCO por von Kries, a partir dos neutros da cena
     (mesa, papel, teclado). A foto de celular sai com dominante, e a
     dominante entra inteira na leitura se não for removida.
  2. BLOB DO CARTÃO: moda de matiz entre os pixels saturados, mantém quem
     está a ±25° dela, pega a maior componente conexa e erode a borda.
     Mão, teclado e mesa caem fora sozinhos.
  3. REGIÃO PLANA: dentro do blob, os 40% de menor gradiente (Sobel).
     Tira especular, dobra e sombra de vinco sem nomear nenhum dos três.
  4. JANELA POR PERCENTIL (25 a 96) do valor DAQUELA foto, nunca um número
     absoluto. A janela se adapta à foto em vez de ser imposta.
  5. MEDIANA de H (circular), S e V.

E o dado que faltava: a DISPERSÃO entre as fotos é parte da leitura.
sd(S) acima de 3 significa que as fotos discordam entre si e a amostra
precisa ser refotografada — não adianta escolher uma delas.

Também roda o TESTE MULTIESCALA de acabamento: variância de alta frequência
dividida pela luminância média, a 3, 5, 9 e 17 px. Flake tem energia alta já
em 3 px e a curva achata; sólido começa baixo e sobe monotonicamente.
Razão 3px/17px em torno de 0,50 é sólido.

USO
---
  python3 scripts/ler-amostra.py foto1.jpg foto2.jpg ...
"""
from __future__ import annotations

import colorsys
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

LADO_MAX = 1400


def carregar(caminho: str) -> np.ndarray:
    im = Image.open(caminho).convert('RGB')
    im.thumbnail((LADO_MAX, LADO_MAX))
    return np.asarray(im).astype(np.float32) / 255.0


def hsv(a: np.ndarray):
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
    h = (h * 60) % 360
    s = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0)
    return h, s, mx


def balanco_de_branco(a: np.ndarray, excluir: np.ndarray | None = None) -> np.ndarray:
    """von Kries a partir dos neutros claros da cena, FORA do cartão.

    O cartão tem de ficar fora da referência. Numa cor acinzentada (ESG-036
    Armor Green, S ~13) o próprio cartão passa no filtro de "neutro", e o balanço
    passava a usar a cor da amostra como se fosse branco: a correção apagava
    metade da saturação que devia medir (S 13 -> 8). O limite de neutro também
    desceu de 0,12 para 0,06 pelo mesmo motivo.
    """
    _, s, v = hsv(a)
    neutro = (s < 0.06) & (v > 0.45) & (v < 0.99)
    if excluir is not None:
        neutro &= ~ndimage.binary_dilation(excluir, np.ones((31, 31)))
    if neutro.sum() < 500:
        return a
    ganho = a[neutro].mean(0)
    ganho = ganho.mean() / np.maximum(ganho, 1e-6)
    return np.clip(a * ganho, 0, 1)


FAIXAS = {
    'vermelho': (330, 30), 'laranja': (12, 48), 'amarelo': (35, 75),
    'verde': (60, 200), 'azul': (175, 265), 'roxo': (250, 320), 'rosa': (290, 350),
}
FAMILIA = None  # preenchido por --familia


def blob_do_cartao(h: np.ndarray, s: np.ndarray, v: np.ndarray) -> np.ndarray:
    """Maior região conexa de matiz coerente entre os pixels saturados.

    Sem --familia, o cartão é a região MAIS SATURADA da foto. Isso falha em cor
    acinzentada: na ESG-036 Armor Green (S ~20) a pele da mão e o reflexo azulado
    do teclado são mais saturados que o cartão, e a leitura saiu H 225 / H 4 —
    dispersão 69. Com --familia, a faixa de matiz só LOCALIZA o cartão; a janela
    de medida continua sem nenhum parâmetro escolhido a dedo.
    """
    if FAMILIA:
        lo, hi = FAIXAS[FAMILIA]
        dentro = ((h >= lo) | (h <= hi)) if lo > hi else ((h >= lo) & (h <= hi))
        cand = dentro & (s > 0.07) & (v > 0.30) & (v < 0.98)
    else:
        cand = (s > 0.20) & (v > 0.08) & (v < 0.98)
    if cand.sum() < 2000:
        cand = s > 0.12
    # moda de matiz em histograma circular de 5 graus
    hist, _ = np.histogram(h[cand], bins=72, range=(0, 360))
    centro = (np.argmax(hist) + 0.5) * 5
    d = np.abs(((h - centro + 180) % 360) - 180)
    m = cand & (d < 25)
    m = ndimage.binary_opening(m, np.ones((5, 5)))
    rot, n = ndimage.label(m)
    if n == 0:
        raise SystemExit('não achei o cartão nesta foto')
    tam = ndimage.sum(m, rot, range(1, n + 1))
    m = rot == (int(np.argmax(tam)) + 1)
    # erode para não encostar na borda nem no texto impresso
    return ndimage.binary_erosion(m, np.ones((9, 9)))


def ler(caminho: str):
    bruto = carregar(caminho)
    # acha o cartao na foto crua, tira ele da referencia de branco, balanceia,
    # e so entao localiza de novo para medir.
    blob0 = blob_do_cartao(*hsv(bruto))
    a = balanco_de_branco(bruto, excluir=blob0)
    h, s, v = hsv(a)
    blob = blob_do_cartao(h, s, v)

    lum = a.mean(2)
    gy, gx = np.gradient(lum)
    grad = np.hypot(gx, gy)
    limiar = np.percentile(grad[blob], 40)
    plano = blob & (grad <= limiar)
    if plano.sum() < 400:
        plano = blob

    lo, hi = np.percentile(v[plano], [25, 96])
    jan = plano & (v >= lo) & (v <= hi)
    if jan.sum() < 200:
        jan = plano

    ang = np.deg2rad(h[jan])
    hm = np.rad2deg(np.arctan2(np.sin(ang).mean(), np.cos(ang).mean())) % 360
    sm, vm = float(np.median(s[jan])), float(np.median(v[jan]))
    return hm, sm, vm, lum, blob


def multiescala(lum: np.ndarray, blob: np.ndarray) -> list[float]:
    """Variância de alta frequência / luminância média, a 3, 5, 9 e 17 px."""
    ys, xs = np.where(blob)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    cy, cx = (y0 + y1) // 2, (x0 + x1) // 2
    r = max(40, min(y1 - y0, x1 - x0) // 6)
    janela = lum[cy - r:cy + r, cx - r:cx + r]
    out = []
    for k in (3, 5, 9, 17):
        base = ndimage.uniform_filter(janela, k)
        out.append(float(np.std(janela - base) / max(janela.mean(), 1e-6) * 100))
    return out


def main() -> int:
    global FAMILIA
    args = sys.argv[1:]
    if '--familia' in args:
        i = args.index('--familia')
        FAMILIA = args[i + 1]
        del args[i:i + 2]
    caminhos = args
    if not caminhos:
        print(__doc__)
        return 1

    hs, ss, vs = [], [], []
    print(f"\n{'foto':34s}  {'H':>6s} {'S':>6s} {'V':>6s}   multiescala 3/5/9/17 px      razão")
    for c in caminhos:
        hm, sm, vm, lum, blob = ler(c)
        hs.append(hm)
        ss.append(sm * 100)
        vs.append(vm * 100)
        ms = multiescala(lum, blob)
        nome = c.split('/')[-1][:34]
        print(f'{nome:34s}  {hm:6.1f} {sm*100:6.1f} {vm*100:6.1f}   '
              + '  '.join(f'{x:5.2f}%' for x in ms)
              + f'   {ms[0]/ms[3]:5.2f}')

    ang = np.deg2rad(np.array(hs))
    H = np.rad2deg(np.arctan2(np.sin(ang).mean(), np.cos(ang).mean())) % 360
    S, V = float(np.mean(ss)), float(np.mean(vs))
    sdH = float(np.std(np.rad2deg(np.angle(np.exp(1j * (ang - np.deg2rad(H)))))))
    sdS, sdV = float(np.std(ss)), float(np.std(vs))

    r, g, b = colorsys.hsv_to_rgb(H / 360, S / 100, V / 100)
    hexa = '#%02X%02X%02X' % (round(r * 255), round(g * 255), round(b * 255))

    print(f'\nLEITURA   {hexa}   H {H:.1f}  S {S:.1f}  V {V:.1f}')
    print(f'dispersão sd(H) {sdH:.1f}  sd(S) {sdS:.1f}  sd(V) {sdV:.1f}'
          + ('   CONFIÁVEL' if sdS <= 3 else '   >>> sd(S) acima de 3: REFOTOGRAFAR a amostra'))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
