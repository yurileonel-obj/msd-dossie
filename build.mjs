#!/usr/bin/env node
/**
 * Monta o dossiê a partir de src/ e escreve um HTML único e autocontido.
 *
 * O artifact do Claude bloqueia qualquer requisição externa (CSP), então CSS e JS
 * precisam ser embutidos. É por isso que existe um build: os arquivos ficam
 * separados para edição, e o publicável é um só.
 *
 *   node build.mjs            → dist/msd-dossie.html
 *   node build.mjs --watch    → reconstrói a cada alteração em src/
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { watch } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');

const read = (...p) => readFile(join(SRC, ...p), 'utf8');

/** Escapa apenas o necessário para atributos HTML. */
const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

async function build() {
  const manifest = JSON.parse(await read('manifest.json'));
  const { meta, sections } = manifest;

  const [css, js, masthead] = await Promise.all([
    read('styles.css'),
    read('app.js'),
    read('masthead.html'),
  ]);

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

  const footer = meta.footer.map((f) => `        <span>${f}</span>`).join('\n');

  // <title> vem primeiro de propósito: o publicador só varre os primeiros 8KB.
  const out = `<title>${meta.title}</title>
<style>
${css}</style>

<div class="wrap">

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

  const kb = (Buffer.byteLength(out, 'utf8') / 1024).toFixed(1);
  console.log(`✓ ${outPath}  (${kb} KB · ${built.length} seções · ${sections.find((s) => s.tree)?.tree.nodes.length ?? 0} nós na árvore)`);
  return outPath;
}

await build();

if (process.argv.includes('--watch')) {
  console.log('… observando src/ (ctrl-c para sair)');
  let pending = null;
  watch(SRC, { recursive: true }, () => {
    clearTimeout(pending);
    pending = setTimeout(() => build().catch((e) => console.error('✗', e.message)), 80);
  });
}
