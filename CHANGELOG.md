# Changelog

Versionamento do conteúdo do dossiê. Formato baseado em
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

A versão descreve **o estado do conhecimento**, não o código do build:

| Incremento | Quando | Exemplo |
|---|---|---|
| **maior** (2.0.0) | uma conclusão central muda ou uma seção é reescrita | a MSD anuncia spin-off da unidade animal e a §4 inteira precisa ser refeita |
| **menor** (1.1.0) | entra ramo, seção ou análise nova | acrescentar um ramo sobre farmacovigilância |
| **correção** (1.0.1) | número atualizado, link corrigido, ajuste de texto | resultado do 1T26 substitui a projeção |

Cada versão publicada vira uma tag `vX.Y.Z` e um release no GitHub com o PDF anexado.

---

## [1.0.1] — 2026-08-17

### Corrigido

- **Ramos 6 a 9 da árvore saíam vazios no PDF** — apareciam só o número e o título,
  sem o conteúdo. São exatamente os ramos que o `manifest.json` marca como recolhidos
  (`open: false`): Brasil, Regulatório, Tecnologia e Glossário.

  Causa: desde o Chrome 128 o conteúdo de um `<details>` fechado vive no
  pseudo-elemento `::details-content` com `content-visibility: hidden`, que a regra
  `display: block` nos filhos não sobrescreve. A correção abre os ramos por
  JavaScript antes de imprimir, disparada por `?print=1` na exportação e por
  `beforeprint` no Ctrl+P; o CSS ficou como reforço para navegadores que suportam o
  pseudo-elemento.

> **O PDF da v1.0.0 está incompleto.** Use este.

## [1.0.0] — 2026-08-17

Primeira versão completa. Dados públicos fechados em agosto de 2026.

### Adicionado

- **Árvore de conhecimento** com nove ramos: corporação-mãe (Merck & Co. / MSD),
  unidade MSD Animal Health, Animal Health Intelligence, anatomia do HomeAgain,
  fragmentação de registros, operação brasileira, regulatório, tecnologia e canais,
  e glossário do domínio.
- **Análise de mercado**: quatro camadas competitivas, seis forças da MSD, oito gaps
  com evidência pública, cinco personas, seis tendências até 2029 e sete frentes de
  oportunidade para o HomeAgain.
- **Dez perguntas** para levar ao cliente e converter conhecimento público em
  conhecimento de negócio.
- Seção de fontes com trinta links e três armadilhas de pesquisa documentadas
  (com destaque para Merck & Co. ≠ Merck KGaA).
- Build sem dependências (`build.mjs`) gerando HTML único e autocontido.
- Exportação em PDF (`export-pdf.mjs`) com capa versionada, sumário e URLs das
  fontes impressas por extenso.

### Fatos-âncora desta versão

Se algum destes mudar, a versão precisa ser incrementada:

- Grupo Merck & Co. / MSD: receita de US$ 65,0 bi em 2025.
- Unidade Saúde Animal: US$ 6,4 bi (+8%), sendo livestock US$ 3,9 bi (+13%) e
  companion animal US$ 2,5 bi (+2%). Bravecto US$ 1,1 bi.
- Brasil: R$ 1,7 bi em 2024, meta de R$ 2 bi em 2025; segundo maior mercado da unidade.
- Apenas ~58% dos chips encontrados em abrigos têm cadastro com contato do tutor.
- Maio de 2026: Merck Animal Health adota Salesforce Agentforce 360 / Data 360 como
  OneCRM, com microchips de pets entre as fontes de dado a unificar.

[1.0.0]: https://github.com/yurileonel-obj/msd-dossie/releases/tag/v1.0.0
