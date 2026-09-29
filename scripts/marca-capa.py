#!/usr/bin/env python3
"""Estampa a marca oficial numa capa de rolo ja corrigida na cor.

POR QUE EXISTE
--------------
Normalmente o `publicar-cor.mjs` compoe a marca no momento do download, e a
correcao de cor vem depois. Isso funciona enquanto a faixa de matiz do filme nao
alcanca o vermelho do logotipo.

Nao funciona para cor de matiz acima de ~345: ela cai na familia 'vermelho' do
`recolorir-capa.py`, que vai de 330 a 30 graus, e o vermelho da marca Speed
Wrapping esta em 1,6 graus — dentro da mesma faixa. Corrigir a capa com a marca
ja aplicada repinta a marca.

Nessas cores a ordem se inverte: baixar sem marca (tirar `logo` do manifesto),
corrigir a cor, e estampar por ultimo com este script.

USO
    python3 scripts/marca-capa.py --capa <arquivo.webp> \
        [--marca scripts/data/marca-speed-wrapping.png] \
        [--largura 0.26] [--esquerda 0.025] [--topo 0.025]
"""
import argparse
from PIL import Image

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--capa', required=True)
    ap.add_argument('--marca', default='scripts/data/marca-speed-wrapping.png')
    ap.add_argument('--largura', type=float, default=0.26)
    ap.add_argument('--esquerda', type=float, default=0.025)
    ap.add_argument('--topo', type=float, default=0.025)
    ap.add_argument('--qualidade', type=int, default=92)
    a = ap.parse_args()

    capa = Image.open(a.capa).convert('RGB')
    lado = capa.size[0]
    marca = Image.open(a.marca).convert('RGBA')
    larg = int(round(lado * a.largura))
    marca = marca.resize((larg, int(round(marca.size[1] * larg / marca.size[0]))), Image.LANCZOS)
    capa.paste(marca, (int(round(lado*a.esquerda)), int(round(lado*a.topo))), marca)
    capa.save(a.capa, 'WEBP', quality=a.qualidade)
    print('marca aplicada: %dx%d em (%d,%d) sobre capa de %d px'
          % (*marca.size, lado*a.esquerda, lado*a.topo, lado))

main()
