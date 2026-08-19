#!/usr/bin/env node
/**
 * Monta o dossiê a partir de src/ e escreve um HTML único e autocontido.
 *
 * O artifact do Claude bloqueia qualquer requisição externa (CSP), então CSS e JS
 * precisam ser embutidos. É por isso que existe um build: os arquivos ficam
 * separados para edição, e o publicável é um só.
 *
 * De carona, regenera os arquivos que outras ferramentas leem — ver MIRRORS.
 *
 *   node build.mjs            → dist/msd-dossie.html (+ AGENTS.md, .github/prompts/)
 *   node build.mjs --watch    → reconstrói a cada alteração em src/
 */

import { readFile, writeFile, mkdir, lstat, rm } from 'node:fs/promises';
import { watch } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');

const read = (...p) => readFile(join(SRC, ...p), 'utf8');

/** Escapa apenas o necessário para atributos HTML. */
const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/**
 * Arquivos gerados a partir de um canônico do repo, para que cada ferramenta ache o
 * harness sob o nome que ela procura. `via` transforma; sem ele é cópia byte a byte.
 */
const MIRRORS = [
  // Instruções. O Claude Code lê CLAUDE.md; Copilot, Codex e Cursor leem AGENTS.md.
  { from: 'CLAUDE.md', to: 'AGENTS.md' },
  // Comando. Assim /novo-dossie se digita igual no Claude Code e no Copilot Chat.
  { from: '.claude/commands/novo-dossie.md', to: '.github/prompts/novo-dossie.prompt.md', via: toCopilotPrompt },
];

/**
 * Converte um comando do Claude Code em prompt file do Copilot.
 *
 * Aqui não dá cópia byte a byte como no AGENTS.md: o frontmatter é outro (`mode`,
 * `description`) e o argumento tem outra sintaxe (`$ARGUMENTS` → `${input:…}`). O
 * `argument-hint`, que o Copilot não tem, é rebaixado a texto no corpo — some do
 * autocomplete, mas o leitor continua sabendo o formato esperado.
 */
function toCopilotPrompt(source, from) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(source);
  const front = m ? m[1] : '';
  const body = m ? source.slice(m[0].length) : source;

  const field = (k) => (new RegExp(`^${k}:\\s*(.+)$`, 'm').exec(front)?.[1] ?? '').trim();
  const quoted = (v) => `'${v.replace(/'/g, "''")}'`;

  const description = field('description');
  const hint = field('argument-hint');

  // filter por `!== null`, não por Boolean: '' aqui é linha em branco intencional.
  return [
    '---',
    'mode: agent',
    description ? `description: ${quoted(description)}` : null,
    '---',
    '',
    `<!-- Arquivo gerado a partir de ${from} — edite o canônico e rode \`node build.mjs\`. -->`,
    '',
    hint ? `> **Argumento esperado:** ${hint}` : null,
    '',
    body.replace(/\$ARGUMENTS/g, '${input:escopo}').trimStart(),
  ]
    .filter((line) => line !== null)
    .join('\n');
}

/**
 * Reescreve todos os MIRRORS a partir dos canônicos. Os canônicos mandam: alteração
 * feita no arquivo gerado é desfeita no build seguinte.
 *
 * Symlink em vez de cópia seria mais elegante e foi a primeira tentativa, mas
 * `git clone` no Windows sem core.symlinks materializa o link como um arquivo de
 * texto com o caminho dentro — o agente lê "CLAUDE.md" e mais nada, sem erro
 * visível. Cópia funciona em qualquer ambiente; o preço é poder divergir, e é isso
 * que esta função elimina.
 */
export async function mirrorAgentDocs({ quiet = false } = {}) {
  const written = [];

  for (const { from, to, via } of MIRRORS) {
    const source = await readFile(join(ROOT, from), 'utf8').catch(() => null);
    if (source === null) continue;

    const wanted = via ? via(source, from) : source;
    const target = join(ROOT, to);

    // Um alvo que ainda seja symlink precisa morrer antes do write, senão o write
    // atravessa o link e sobrescreve o próprio canônico.
    const link = await lstat(target).catch(() => null);
    if (link?.isSymbolicLink()) await rm(target);
    else if ((await readFile(target, 'utf8').catch(() => null)) === wanted) continue;

    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, wanted, 'utf8');
    written.push(to);
  }

  if (written.length && !quiet) console.log(`✓ espelhado: ${written.join(', ')}`);
  return { written };
}

export async function build({ quiet = false } = {}) {
  const manifest = JSON.parse(await read('manifest.json'));
  const { meta, sections } = manifest;

  const [css, printCss, js, masthead, coverRaw] = await Promise.all([
    read('styles.css'),
    read('print.css'),
    read('app.js'),
    read('masthead.html'),
    read('cover.html'),
  ]);

  // A capa só aparece no papel, mas mora no mesmo HTML: assim o Ctrl+P do
  // artifact publicado gera exatamente o mesmo PDF que o export automatizado.
  const cover = coverRaw.replace(/\{\{(\w+)\}\}/g, (_, k) => meta[k] ?? '');

  // Numeração das seções (§0, §1, …) e dos nós da árvore (1, 2, …) é derivada
  // da ordem no manifest. Reordenar lá renumera tudo, incluindo o índice.
  const built = [];
  for (const [i, s] of sections.entries()) {
    let html = await read('sections', s.file);

    if (s.tree) {
      const nodes = [];
      for (const [j, node] of s.tree.nodes.entries()) {
        const n = j + 1;
        const body = (await read('sections', s.tree.dir, node.file)).replaceAll('{{n}}', String(n));
        nodes.push(
          `<details class="node"${node.open ? ' open' : ''}>\n` +
          `  <summary><span class="code">${n}</span><span>${node.title}</span><span class="chev">›</span></summary>\n` +
          `  <div class="node-body">\n${body}\n  </div>\n` +
          `</details>`
        );
      }
      html += '\n' + nodes.join('\n\n');
    }

    built.push({ ...s, n: i, html });
  }

  const toc = built
    .map((s) => `          <li><a href="#${attr(s.id)}"><span class="n">§${s.n}</span> ${s.nav ?? s.title}</a></li>`)
    .join('\n');

  const body = built
    .map((s) =>
      `      <section id="${attr(s.id)}">\n` +
      `        <div class="sec-head"><span class="n">§${s.n}</span><h2>${s.title}</h2></div>\n` +
      `${s.html}\n` +
      `      </section>`
    )
    .join('\n\n');

  const footer = [`v${meta.version}`, ...meta.footer]
    .map((f) => `        <span>${f}</span>`)
    .join('\n');

  // <title> vem primeiro de propósito: o publicador só varre os primeiros 8KB.
  const out = `<title>${meta.title}</title>
<style>
${css}
${printCss}</style>

<div class="wrap">

  <section class="cover">
${cover.trim().split('\n').map((l) => '    ' + l).join('\n')}
  </section>

  <header class="masthead">
${masthead.trim().split('\n').map((l) => '    ' + l).join('\n')}
  </header>

  <div class="cols">

    <nav class="toc" aria-label="Índice">
      <div class="toc-title">Índice</div>
      <details open>
        <summary>Índice</summary>
        <ol>
${toc}
        </ol>
      </details>
    </nav>

    <main>

${body}

      <footer class="end">
${footer}
      </footer>

    </main>
  </div>
</div>

<div id="tip" role="status" aria-live="polite"></div>

<script>
${js}</script>
`;

  const outPath = resolve(ROOT, meta.output ?? 'dist/msd-dossie.html');
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, out, 'utf8');

  // Dentro do build de propósito: é o único ponto por onde todo mundo passa,
  // incluindo o export-pdf.mjs e o --watch.
  await mirrorAgentDocs({ quiet });

  if (!quiet) {
    const kb = (Buffer.byteLength(out, 'utf8') / 1024).toFixed(1);
    const nodes = sections.find((s) => s.tree)?.tree.nodes.length ?? 0;
    console.log(`✓ ${outPath}  (v${meta.version} · ${kb} KB · ${built.length} seções · ${nodes} nós na árvore)`);
  }
  return { outPath, meta };
}

// Só roda sozinho quando invocado direto; export-pdf.mjs importa build().
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await build();

  if (process.argv.includes('--watch')) {
    console.log('… observando src/ (ctrl-c para sair)');
    let pending = null;
    watch(SRC, { recursive: true }, () => {
      clearTimeout(pending);
      pending = setTimeout(() => build().catch((e) => console.error('✗', e.message)), 80);
    });
  }
}
