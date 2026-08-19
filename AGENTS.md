# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que este repositório é

Não é software de produto. É **conhecimento de negócio versionado** que compila em dois
formatos a partir de uma fonte só. O conteúdo atual é um dossiê sobre a MSD/Merck Saúde
Animal com ramo aprofundado em identificação de pets (HomeAgain), escrito em pt-BR,
somente com fontes públicas.

O chassi (build, estilo, impressão, estrutura editorial) é deliberadamente separável do
conteúdo: quem clona pode **refazer o dossiê para outro escopo ou outro papel** sem
tocar em nenhum `.mjs`. Ver *Reproduzir para outro escopo*.

O harness é multiferramenta: o build regenera, a partir dos canônicos deste repo, os
arquivos que cada agente procura sob nome próprio (`MIRRORS` em `build.mjs`).

| Canônico — edite aqui | Gerado — não edite | Lido por |
|---|---|---|
| `CLAUDE.md` | `AGENTS.md` | Copilot, Codex, Cursor |
| `.claude/commands/novo-dossie.md` | `.github/prompts/novo-dossie.prompt.md` | Copilot Chat |

Todo `node build.mjs` reescreve os gerados (`mirrorAgentDocs()`), então alteração feita num
deles é desfeita no build seguinte, e conflito de merge neles se resolve rodando o build.
São cópias e não symlinks porque `git clone` no Windows sem `core.symlinks` materializa o
link como um arquivo de texto contendo o caminho — o agente lê `CLAUDE.md` e mais nada, sem
erro visível. O prompt file do Copilot não é cópia exata: `toCopilotPrompt()` troca o
frontmatter e converte `$ARGUMENTS` em `${input:escopo}`. Por isso o comando canônico
nomeia ferramentas de forma neutra ("pergunte ao usuário", "ferramentas de busca web"), com
o nome do Claude Code entre parênteses.

## Comandos

```bash
node build.mjs              # → dist/msd-dossie.html (único, autocontido)
node build.mjs --watch       # reconstrói a cada alteração em src/
node export-pdf.mjs         # rebuild + Chrome headless → dist/msd-dossie-v<versão>.pdf
CHROME_PATH=/usr/bin/chromium node export-pdf.mjs
```

Node 18+, zero dependências, sem `package.json`, sem lint, **sem suíte de testes**. A
verificação é o rodapé do build (`N seções · N nós`) e ler o PDF gerado. Para inspecionar
um PDF nesta máquina não há poppler/pdftoppm — use `pdfjs-dist` + `canvas` via npm num
diretório temporário fora do repo.

## Arquitetura

**Pipeline.** `src/manifest.json` é a única fonte de ordem, numeração e metadados.
`build.mjs` lê o manifest, concatena `sections/*.html` na ordem do array, e emite um HTML
único com CSS e JS **embutidos**. `export-pdf.mjs` importa `build()` e só orquestra o
navegador — não duplica estilo nenhum.

Quatro decisões que explicam quase todo o código:

1. **Saída single-file** — a CSP do artifact do Claude bloqueia CSS/JS externos. Daí
   existir um build: os arquivos ficam separados para editar, o publicável é um só.
2. **Numeração derivada da ordem.** `§n` das seções e `n` dos ramos vêm do índice no
   array; dentro de um ramo, escreva as folhas como `{{n}}.1`, `{{n}}.2` — o build
   substitui `{{n}}`. Reordenar o manifest renumera tudo, incluindo o índice lateral.
   Nunca escreva número de seção ou de nó à mão.
3. **A capa mora no mesmo HTML** e só aparece no papel (`print.css`). Consequência
   intencional: **o Ctrl+P do artifact publicado gera o mesmo PDF** que `export-pdf.mjs`.
4. **`print.css` é uma camada de impressão**, carregada depois de `styles.css`. Precisa
   garantir, nesta ordem: tema claro forçado (o bloco `prefers-color-scheme` não tem
   media type e imprimiria fundo preto), conteúdo de `<details>` fechado visível, e URLs
   das fontes escritas por extenso (o PDF circula offline).

**Substituição de placeholders só acontece em dois lugares:** `{{chave}}` → `meta.chave`
em `cover.html`, e `{{n}}` nos arquivos de ramo. `masthead.html` e as seções são
injetados crus — texto hardcoded ali não vem do manifest.

**Versionamento descreve o estado do conhecimento, não o código do build.** A versão vive
só em `meta.version`; dali é carimbada na capa, no rodapé e no nome do PDF. Regras de
incremento e a lista de *fatos-âncora* de cada versão estão no `CHANGELOG.md` — se um
fato-âncora muda, a versão tem que subir.

## Onde editar

- **texto de uma seção** → `src/sections/<nome>.html` (só o miolo; `<section>` e o
  cabeçalho `§n / título` são gerados)
- **ramo da árvore** → `src/sections/arvore/NN-<nome>.html`
- **ordem, títulos, versão, URLs** → `src/manifest.json`
- **aparência** → `src/styles.css` (tela) e `src/print.css` (papel)
- **capa e cabeçalho** → `src/cover.html`, `src/masthead.html`
- `dist/` é saída, está no `.gitignore`, nunca edite
- `AGENTS.md` e `.github/prompts/` são gerados; edite o canônico correspondente

## Vocabulário de componentes

Use estas classes; não invente CSS novo para conteúdo novo. Todas estão em `styles.css`,
já testadas nos três estados de tema e no papel.

| Classe | Para quê |
|---|---|
| `p.lede` | parágrafo de abertura de seção |
| `.kpis` > `.kpi` (`.mark`) com `.v` / `.k` / `.src` | indicadores-âncora; `.src` é a fonte do número |
| `.callout` (`.warn`) com `span.label` | tese, alerta, armadilha |
| `ul.leaves` > `li` com `span.code` (+ `ul.sub`) | folhas de um ramo da árvore |
| `.flag`, `.flag.risk`, `.flag.you` | contexto / fragilidade documentada / toca seu produto |
| `.cards` > `.card` com `.ct` + `p` + `.ev` | análise; `.ev` é a evidência pública que sustenta |
| `.persona` com `.who` > `span` + `ul` | ator e seus incentivos |
| `ol.qlist` > `li` > `div` | perguntas numeradas |
| `.sources` > `p` > `span.lbl` + `a` | fonte com rótulo e link (URL impressa por extenso) |
| `.pill.p1/.p2/.p3` | referência cruzada curta ("Gap 3") |
| `.stackbar` > `.seg[data-n][data-p]` + `.legend` | barra empilhada; tooltip vem do `app.js` |
| `.tscroll` | envelope obrigatório de tabela larga (a página nunca rola na horizontal) |

**Cor só por token.** Os tokens ficam no topo de `styles.css` com os três estados de tema
(claro, escuro por sistema, escuro por escolha explícita). Cor declarada apenas dentro de
`@media (prefers-color-scheme: dark)` desaparece no estado "sistema" e deixa a página
ilegível.

## Convenções de conteúdo

- **Todo número tem fonte.** Dado novo no corpo ⇒ link novo em `fontes.html`.
- **Separar fato de leitura.** Fato no corpo; interpretação marcada ("Leitura:", "Por que
  isso importa"); hipótese declarada como hipótese.
- **Nada confidencial.** Só fontes públicas. Roadmap interno, métricas reais, contratos e
  nomes de clientes finais não entram — inclusive porque o artifact é compartilhável com
  um clique. Se o usuário oferecer material interno, mantenha fora do repo.

## Publicar

```bash
node build.mjs && node export-pdf.mjs
git add -A && git commit -m "vX.Y.Z: <o que mudou>" && git tag vX.Y.Z && git push --follow-tags
gh release create vX.Y.Z dist/msd-dossie-vX.Y.Z.pdf --title "vX.Y.Z" --notes-from-tag
```

O PDF é distribuído como **anexo do release**, nunca commitado.

**Versão web:** para atualizar mantendo o mesmo link, republique `dist/msd-dossie.html`
passando `meta.artifactUrl` como `url` da ferramenta Artifact. Publicar sem a `url` cria
um artifact novo e separado, e o link antigo fica com a versão velha.

## Reproduzir para outro escopo

O caso de uso principal de quem clona: manter o chassi e trocar o conteúdo para o **seu**
produto, cliente ou papel (design, produto, dados, outra unidade da MSD). O comando
`/novo-dossie` conduz esse processo de ponta a ponta — do enquadramento de escopo à
publicação — e se digita igual no Claude Code e no Copilot Chat. O que segue é o mapa que
ele pressupõe.

Três camadas, da mais reaproveitável para a menos:

1. **Chassi — reaproveite intacto.** `build.mjs`, `export-pdf.mjs`, `styles.css`,
   `print.css`, `app.js`. Não precisam de alteração para trocar de assunto.
2. **Estrutura editorial — reaproveite o esqueleto.** A sequência das seções é a tese do
   documento e funciona para qualquer cliente: números-âncora → árvore de conhecimento →
   panorama competitivo → forças → gaps → personas → tendências → oportunidades →
   perguntas ao cliente → fontes. Enfatize conforme o papel: design/pesquisa se apoia em
   `usuarios` e `gaps`; produto em `gaps`, `oportunidades` e `perguntas`; engenharia no
   ramo de tecnologia; liderança em `numeros` e `mercado`.
3. **Conteúdo — troque.** Na árvore atual, os ramos 1, 2, 3, 5 e 7 (corporação, unidade,
   AHI, fragmentação, regulatório) valem para qualquer pessoa dentro da MSD Saúde Animal.
   Os ramos 4 (anatomia do HomeAgain) e 8 (tecnologia e canais) são os específicos: são
   eles que você substitui pelo *seu* ramo profundo. Fora da MSD, troque tudo.

Passos ao refazer:

1. `src/manifest.json` — `meta.title`, `description`, `favicon`, `version` (volte para
   `1.0.0`), `date`/`dateLabel`, `footer`, `output`, `pdfOutput`, `repoUrl`, e
   **apague ou substitua `artifactUrl`** (deixar a URL herdada faz você republicar por
   cima do artifact de outra pessoa).
2. `src/cover.html` e `src/masthead.html` — o texto de escopo está hardcoded ali.
3. `src/sections/` — reescreva o miolo; adicione ou remova arquivos registrando no
   manifest (`sections[]` e `sections[].tree.nodes`).
4. `CHANGELOG.md` — recomece o histórico e reescreva a lista de fatos-âncora: é ela que
   diz quando a versão precisa subir.
5. `README.md` e a árvore de arquivos dentro dele.
6. Só fontes públicas, na mesma disciplina de "todo número tem fonte".

Ao pesquisar conteúdo novo, prefira documentos primários (10-K, comunicados oficiais,
normas) a relatórios de consultoria; trate *market share* de consultoria como ordem de
grandeza. Registre em `fontes.html` as armadilhas de busca que você encontrar — elas
economizam horas de quem vier depois.

## Armadilhas conhecidas

- **Merck & Co. (o cliente) ≠ Merck KGaA (Darmstadt).** Buscas por estratégia de IA,
  plataformas de LLM ou diretoria de dados da "Merck" retornam a empresa alemã.
  "Merck Animal Health" e "MSD Animal Health" são a mesma empresa — pesquise os dois.
- **Ramo fechado sai vazio no PDF.** Desde o Chrome 128 o conteúdo de um `<details>`
  fechado vive em `::details-content` com `content-visibility: hidden`, que `display:
  block` nos filhos não sobrescreve. A garantia é JS: `?print=1` (usado pelo exportador,
  porque `--print-to-pdf` headless não dispara `beforeprint` de forma confiável) e
  `beforeprint` (Ctrl+P). O CSS é só reforço. Ao mexer em `app.js` ou `print.css`,
  reexporte e confira os ramos marcados `open: false` no manifest.
- **WSL.** Sem Chrome no Linux, o exportador cai no Chrome/Edge do Windows e copia o HTML
  para o `%TEMP%` antes de imprimir — o Chrome do Windows não lê `/home` do WSL de forma
  confiável.
- **O PDF sai sem numeração de página.** O Chrome não suporta margin-boxes do CSS
  (`@page { @bottom-right { content: counter(page) } }`) e a alternativa estamparia
  `file:///...` no rodapé. A capa carrega versão e data — é o que rastreia.
