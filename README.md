# Dossiê MSD Saúde Animal

Base de conhecimento sobre o cliente (MSD/Merck Animal Health) e análise de mercado da
vertical de identificação de pets, com aprofundamento no HomeAgain. Só fontes públicas.

O conteúdo mora em arquivos separados em `src/`. Um build concatena tudo em um HTML
único e autocontido em `dist/`, que é o formato que o artifact do Claude exige — a
CSP do artifact bloqueia CSS e JS externos, então nada pode ficar em arquivo à parte
no resultado final.

Dois formatos saem da mesma fonte:

| Formato | Para quê | Como gerar |
|---|---|---|
| **HTML** | leitura e navegação; publicado como artifact | `node build.mjs` |
| **PDF** | fonte de verdade para circular fora daqui — anexar em e-mail, subir em wiki, levar para reunião, alimentar outra ferramenta | `node export-pdf.mjs` |

```bash
node build.mjs
```

```bash
node export-pdf.mjs
```

```bash
node build.mjs --watch
```

Sem dependências de runtime. Node 18+. O PDF precisa de um Chrome, Chromium ou Edge
instalado (ver *Exportar em PDF* abaixo).

## Estrutura

```
msd/
├── build.mjs                    gerador do HTML (sem deps)
├── export-pdf.mjs               orquestra o Chrome headless para imprimir o PDF
├── CHANGELOG.md                 o que mudou em cada versão do conhecimento
├── dist/                        saída — não edite, é regenerada
│   ├── msd-dossie.html
│   └── msd-dossie-v1.0.0.pdf
└── src/
    ├── manifest.json            versão, ordem das seções e dos nós da árvore
    ├── styles.css               tokens de cor/tipografia e todos os componentes
    ├── print.css                camada de impressão (PDF e Ctrl+P do artifact)
    ├── app.js                   expandir/recolher a árvore, tooltip do gráfico
    ├── cover.html               capa — existe só no papel
    ├── masthead.html            cabeçalho da página
    └── sections/
        ├── numeros.html         §0  indicadores-âncora
        ├── arvore.html          §1  introdução da árvore (os nós vêm abaixo)
        ├── arvore/
        │   ├── 01-corporacao.html      Merck & Co. / MSD
        │   ├── 02-unidade.html         MSD Animal Health
        │   ├── 03-ahi.html             Animal Health Intelligence
        │   ├── 04-homeagain.html       HomeAgain — anatomia do produto
        │   ├── 05-fragmentacao.html    registros fragmentados
        │   ├── 06-brasil.html          operação brasileira (+ gráfico)
        │   ├── 07-regulatorio.html     ISO, UK, UE, EUA, Brasil
        │   ├── 08-tecnologia.html      OneCRM, canais, ativos digitais
        │   └── 09-glossario.html       jargão do domínio
        ├── mercado.html         §2  quatro camadas competitivas
        ├── forcas.html          §3
        ├── gaps.html            §4
        ├── usuarios.html        §5  personas
        ├── tendencias.html      §6
        ├── oportunidades.html   §7
        ├── perguntas.html       §8  o que perguntar ao cliente
        └── fontes.html          §9  links e armadilhas de pesquisa
```

## Como atualizar

**Editar um trecho existente** — abra o arquivo da seção e edite HTML direto. Os
arquivos em `sections/` contêm só o miolo: o `<section>` e o cabeçalho `§n / título`
são gerados pelo build a partir do `manifest.json`.

**Acrescentar uma seção** — crie `src/sections/nova.html` e adicione a entrada no
`manifest.json`. A numeração (`§0`, `§1`, …) e o índice lateral saem da ordem do array;
inserir uma seção no meio renumera tudo sozinho.

**Acrescentar um ramo da árvore** — crie o arquivo em `src/sections/arvore/` e
registre em `sections[].tree.nodes`. Dentro do arquivo, escreva os códigos das folhas
como `{{n}}.1`, `{{n}}.2` — o build substitui `{{n}}` pelo número do nó. Assim reordenar
ramos não quebra a numeração interna.

**Mudar aparência** — tudo em `src/styles.css`. As cores estão em tokens no topo, com
os três estados de tema (claro, escuro por preferência do sistema, escuro por escolha
explícita). Não declare cor fora dos tokens: uma cor definida só dentro de
`@media (prefers-color-scheme: dark)` some no estado "sistema" e a página fica ilegível.

## Exportar em PDF

```bash
node export-pdf.mjs
```

Gera `dist/msd-dossie-v<versão>.pdf` — capa versionada, sumário, cada seção
começando em página nova, ramos da árvore impressos abertos e as URLs das fontes
escritas por extenso (o PDF circula offline).

O script procura um renderizador nesta ordem: `$CHROME_PATH`, depois
Chrome/Chromium/Edge no Linux, e por fim o Chrome ou Edge do Windows quando você
está no WSL. Neste último caso o HTML é copiado para o `%TEMP%` do Windows antes de
imprimir, porque o Chrome do Windows não lê o sistema de arquivos do WSL de forma
confiável. Para apontar um binário específico:

```bash
CHROME_PATH=/usr/bin/chromium node export-pdf.mjs
```

Toda a aparência do papel vem de `src/print.css`, que fica dentro do mesmo HTML — ou
seja, **o Ctrl+P do artifact publicado gera o mesmo PDF** que este script. O
exportador só orquestra o navegador; não duplica estilo nenhum.

Uma limitação conhecida: o PDF sai **sem numeração de página**. O Chrome não suporta
as margin-boxes do CSS (`@page { @bottom-right { content: counter(page) } }`), e a
alternativa seria ligar o cabeçalho padrão do navegador, que estampa `file:///...` no
rodapé. A capa carrega versão e data, que é o que importa para rastreabilidade.

## Versionamento

A versão descreve **o estado do conhecimento**, não o código do build. As regras de
incremento e o histórico estão no [CHANGELOG.md](CHANGELOG.md).

A versão vive em um lugar só — `meta.version` no `src/manifest.json` — e dali é
carimbada na capa do PDF, no rodapé do HTML e no nome do arquivo PDF.

Para publicar uma versão nova:

```bash
node build.mjs && node export-pdf.mjs
```

```bash
git add -A && git commit -m "vX.Y.Z: <o que mudou>" && git tag vX.Y.Z && git push --follow-tags
```

```bash
gh release create vX.Y.Z dist/msd-dossie-vX.Y.Z.pdf --title "vX.Y.Z" --notes-from-tag
```

O PDF é distribuído como **anexo do release**, não commitado no repositório — binário
versionado incha o histórico e nunca dá diff legível. Quem precisa da fonte de verdade
baixa do release; quem precisa editar clona e roda o build.

## Publicar a versão web

O dossiê já está publicado como artifact privado:

<https://claude.ai/code/artifact/085424fe-a691-4df7-b7b9-2aa4625cd9ea>

Para atualizar mantendo **o mesmo link**, peça ao Claude para republicar
`dist/msd-dossie.html` passando essa URL. Publicar sem a URL cria um artifact novo e
separado — o link antigo continua com a versão velha. A URL também está gravada em
`manifest.json` (`meta.artifactUrl`).

## Convenções de conteúdo

- **Todo número tem fonte.** Se entrar um dado novo, entra também o link em `fontes.html`.
- **Separar fato de leitura.** Fatos ficam no corpo; interpretação vem marcada
  ("Leitura:", "Por que isso importa"). O que é hipótese está declarado como hipótese.
- **Marcadores da árvore** — `<span class="flag">contexto</span>` fato estrutural,
  `flag risk` fragilidade documentada, `flag you` toca diretamente o HomeAgain.
- **Nada confidencial aqui.** Este repositório é de fontes públicas. Informação interna
  do cliente (roadmap, métricas reais, contratos) não deve entrar — inclusive porque o
  artifact é compartilhável com um clique.
