# NZ GROUP NEW WEBSITE - MANUAL E ARQUITETURA

Bem-vindo ao Mapa do Projeto `nzgroupnewwebsite` (anteriormente `nz-distribuidora-web`). Este documento serve como o "Google Maps" oficial do código fonte para que Agentes de IA e Devs humanos possam encontrar rapidamente qualquer componente e continuem a desenvolver a plataforma seguindo os padrões "Taste-Skill" de altíssima performance.

---

## 1. Topologia do Projeto

A stack é enxuta e focada em performance (Headless-Ready): 
- **React 19** + **Vite** (Build Tool)
- **React Router DOM 7** (Navegação SPA sem recarregamentos)
- Sem TailwindCSS nativamente. Estilização purista via **CSS Modules**.

A árvore do diretório principal fica em `src/`:

```
src/
├── App.tsx          <-- Ponto de entrada do Roteamento (Router Config)
├── index.css        <-- Variáveis Globais (Cores, Fontes Clamps, Margens Base)
├── main.tsx         <-- Montagem root do React (Injeção no DOM)
├── components/      <-- Fragmentos Modulares e Globais (Reutilizáveis)
├── pages/           <-- Rotas/Visões de Tela Inteira
└── assets/          <-- (Usar preferencialmente a pasta 'public' raiz para SVGs)
```

---

## 2. Padrões de Estilização (A Regra de Ouro)

Este repositório foi reconstruído com base na filosofia de design premium **"Taste-Skill"**. 

**Nunca injete Bootstrap ou utilitários pesados.** Siga estas diretrizes:
1. **Glassmorphism Base:** Utilize transparências sob pretos profundos (Ex: `rgba(12,12,12,0.8)`) com `backdrop-filter: blur(10px)`.
2. **Tipografia Absoluta:** O site carrega o Google Fonts *Outfit* (Títulos/Hero) e *Inter* (Corpo do texto).
3. **Escala Responsiva (`clamp`):** Os títulos utilizam `clamp(3rem, 5vw, 5rem)` em vez limiares (Media Queries), diminuindo linhas de código.
4. **Cores Semânticas:**
   - `--bg-primary`: Estúdio super escuro (`#0a0a0a`).
   - `--accent-red`: Vermelho "Romani" / Agressivo (`#d11e1e`).

---

## 3. Diretório de Componentes (`/src/components`)

Se precisar editar algo global que repete por todo site, o componente está aqui:

* **`/Navbar`**: A barra de linkagem fluida no topo da tela. Possui efeito de desfoque sobreposto.
* **`/Footer`**: O rodapé universal contendo a logo matriz e chaves de contato.
* **`/Showcase`**: O grid de seleção horizontal utilizado apenas na Home Page para transitar entre PPF e WRAP.
* **`/About`**: Um trecho na Página Inicial (*Homepage*) encarregado do convite rápido e estatísticas base.
* **`/Hero`**: Componente exclusivo de impacto da Home Page contendo Animações Limpas (*Fade-Up*).

---

## 4. Diretório de Visualizações / Rotas (`/src/pages`)

Cada subdiretório em `pages/` representa uma etapa completa injetada no `App.tsx`. Ao criar uma tela nova, faça aqui em uma pasta própria e declare o módulo `TitlePage.module.css` localmente:

* **`/Home` (Homepage)**: Junta os componentes `Hero`, `Showcase`, e `About` numa estrutura única (`/`).
* **`/Ppf` (Linha PPF)**: Landing page ultra descritiva sobre as polímeros automotivos Premium (Luxury, Prime, Flow).
* **`/Wrap` (Linha Wrap)**: Landing page arquitetada para exibir as pilastras logísticas: >250 Cores a pronta entrega, >500 Exclusivas, e a seção rubra de Consultoria.
* **`/Company` (Sobre Nós)**: O Quartel General. Exibe a carta do fundador João Soares e dados físicos em Barueri.

---

## 5. Notas Finais para Agentes (Machine Learning Memory)

- **Imagens Vetoriais (LOGOS)**: Todos os SVGs foram devidamente limpos e organizados semanticamente na arquitetura `/public/assets/logos/` (ex: `logo-nz-ppf.svg`, `logo-nz-wrap.svg`). Ao puxar qualquer logo corporativa no código, utilize caminhos absolutos como `src="/assets/logos/nome-da-logo.svg"`.
- Favicon foi recortado matematicamente e movido para `public/assets/icons/favicon-zoomed.svg`.
- Mantenha `task.md` sempre vivo com base nesse mapa.
