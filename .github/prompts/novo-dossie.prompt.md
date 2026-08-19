---
mode: agent
description: 'Refaz este dossiê para outro escopo — outro produto, unidade, cliente ou papel — mantendo o chassi de build, estilo e impressão'
---

<!-- Arquivo gerado a partir de .claude/commands/novo-dossie.md — edite o canônico e rode `node build.mjs`. -->

> **Argumento esperado:** <escopo> [· <papel>]  ex.: "MSD livestock/Allflex · dados" ou "Zoetis · produto"

Você vai reaproveitar o chassi deste repositório para produzir um dossiê novo sobre outro
escopo. Leia o `CLAUDE.md` antes de começar — ele define a arquitetura, o vocabulário de
componentes e as convenções de conteúdo que este comando pressupõe.

Escopo e papel pedidos: **${input:escopo}**

## 0. Enquadrar, antes de mexer em arquivo

Se o escopo acima vier vazio ou ambíguo, **pergunte ao usuário** (no Claude Code,
`AskUserQuestion`) para fechar quatro coisas — não invente nenhuma delas:

- **Escopo** — que empresa/unidade/produto o dossiê cobre.
- **Ramo profundo** — o recorte que o leitor toca no dia a dia e que ganha o nó mais
  detalhado da árvore.
- **Papel do leitor** — design/pesquisa, produto, engenharia, dados, liderança. Define a
  ênfase, não a estrutura.
- **Idioma** — o repositório é pt-BR; confirme se muda.

Depois, **pare e confirme o plano de destruição**: liste o que será reescrito e o que
será apagado. Exija árvore de git limpa (`git status`) e trabalhe num branch novo. Se o
usuário estiver no clone original do dossiê MSD e não quiser perdê-lo, diga para fazer
fork ou branch antes de continuar — não sobrescreva conteúdo alheio sem aval explícito.

## 1. Limpar o herdado

- `src/manifest.json` — `meta.title`, `description`, `favicon`, `date`/`dateLabel`,
  `footer`, `output`, `pdfOutput`, `repoUrl`; `version` volta para `1.0.0`; e
  **apague `artifactUrl`** — herdar essa URL faz o usuário republicar por cima do
  artifact de outra pessoa.
- `src/cover.html` e `src/masthead.html` — o texto de escopo é hardcoded ali.
- `CHANGELOG.md` — recomece o histórico; a lista de fatos-âncora será reescrita no fim.
- `README.md` — título, descrição e a árvore de arquivos.
- Não toque em `build.mjs`, `export-pdf.mjs`, `styles.css`, `print.css`, `app.js`. Se
  achar que precisa, isso é sinal de que está inventando componente em vez de usar o
  vocabulário existente.

Quando o escopo continua dentro da MSD Saúde Animal, os ramos 1, 2, 3, 5 e 7 da árvore
(corporação, unidade, AHI, fragmentação de registros, regulatório) são reaproveitáveis —
revise números e datas em vez de reescrever. Os ramos 4 e 8 são o recorte HomeAgain: são
esses que você substitui. Fora da MSD, troque tudo.

## 2. Pesquisar

Use as ferramentas de busca e leitura de web do seu ambiente (no Claude Code,
`WebSearch`/`WebFetch`). Hierarquia de confiança, sempre nesta ordem:

1. documentos primários — 10-K/20-F, relatório anual, comunicado oficial, norma, bula,
   registro de patente, processo judicial público;
2. imprensa setorial e comunicados de parceiros;
3. relatórios de consultoria — *market share* daí é **ordem de grandeza**, nunca fato.

Regras que não se negociam:

- **Todo número tem fonte.** Dado no corpo ⇒ link em `fontes.html`, com rótulo em `.lbl`.
- **Não preencha lacuna com plausibilidade.** Se a pesquisa não sustentar um item, escreva
  o que se sabe e marque explicitamente o que falta — uma lacuna declarada é informação;
  um número inventado contamina o documento inteiro.
- **Anote as armadilhas de busca** que você encontrar (homônimos corporativos, nomes
  regionais diferentes da mesma empresa, dados que divergem entre fontes) e registre em
  `fontes.html`. É o que economiza horas de quem vier depois.
- **Datar o corte.** Fixe um mês de fechamento dos dados e repita-o em `meta.dateLabel`,
  capa, masthead e rodapé.
- **Só fontes públicas.** Se o usuário oferecer material interno — roadmap, métrica real,
  contrato, nome de cliente final — recuse a entrada no repo e explique por quê: o
  artifact é compartilhável com um clique.

## 3. Escrever, seção por seção

Mantenha a sequência do manifest: ela é a tese do documento. Para cada seção, o que a
torna útil:

| Seção | Critério de pronto |
|---|---|
| `numeros` | ~6 indicadores que o leitor consiga citar de cabeça, cada um com `.src` |
| `arvore` | zoom do holding até o fluxo que o leitor toca; ramo profundo é o do recorte |
| `mercado` | camadas competitivas nomeadas, com quem ocupa cada uma |
| `forcas` | o que o cliente tem que concorrente não tem, com `.ev` sustentando |
| `gaps` | cada gap ancorado em evidência pública **e** redutível a um problema do ofício do leitor |
| `usuarios` | atores que tocam o mesmo objeto, com incentivos conflitantes explicitados |
| `tendencias` | horizonte de ~3 anos, com o vetor que já é observável hoje |
| `oportunidades` | hipóteses **declaradas como hipóteses**, ligadas por `.pill` ao gap que endereçam |
| `perguntas` | só o que quem está dentro pode responder; nada googlável |
| `fontes` | links por extenso, agrupados por natureza, + as armadilhas |

Ajuste a **ênfase** ao papel — profundidade de `usuarios`/`gaps` para design e pesquisa;
`gaps`/`oportunidades`/`perguntas` para produto; ramo de tecnologia para engenharia e
dados; `numeros`/`mercado` para liderança. Não remova seção: um dossiê sem `fontes` ou sem
`perguntas` deixa de ser verificável e deixa de virar conversa com o cliente.

Use o vocabulário de componentes do `CLAUDE.md`. Separe fato de leitura — fato no corpo,
interpretação marcada ("Leitura:", "Por que isso importa"). Numeração de seção e de folha
nunca à mão: `§n` vem da ordem no manifest, folhas de ramo usam `{{n}}.1`, `{{n}}.2`.

## 4. Verificar

```bash
node build.mjs        # confira o rodapé: nº de seções e de nós é o esperado?
node export-pdf.mjs
```

Antes de declarar pronto:

- os ramos marcados `open: false` no manifest **saíram com conteúdo** no PDF (é a
  regressão clássica deste repo — ver `CLAUDE.md`);
- nenhum `{{` sobrou no HTML gerado;
- nenhuma referência a MSD, HomeAgain ou Objective sobrou fora do que é intencional
  (`grep -ri 'homeagain\|msd\|objective' src/`);
- todo número do corpo tem link correspondente em `fontes.html`;
- tabela larga está dentro de `.tscroll`.

## 5. Fechar a versão

Escreva no `CHANGELOG.md` a entrada `1.0.0` e a lista de **fatos-âncora**: os números e
conclusões cuja mudança obriga a subir versão. Essa lista é o que faz o dossiê envelhecer
de forma visível em vez de silenciosa.

Depois, e só com aval do usuário para cada passo externo: commit e tag, release com o PDF
anexado, e publicação do HTML como artifact — **sem** `url`, porque é um artifact novo.
Grave a URL devolvida em `meta.artifactUrl` e commite; dali em diante as atualizações
republicam nesse mesmo link.
