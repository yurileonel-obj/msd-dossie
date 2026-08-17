#!/usr/bin/env node
/**
 * Exporta o dossiê em PDF: dist/msd-dossie-v<versão>.pdf
 *
 * Reconstrói o HTML e manda um Chrome headless imprimir. Toda a aparência do
 * papel vem de src/print.css — este script só orquestra o navegador, não
 * duplica estilo nenhum. O mesmo CSS governa o Ctrl+P do artifact publicado.
 *
 *   node export-pdf.mjs
 *   CHROME_PATH=/usr/bin/chromium node export-pdf.mjs
 *
 * Procura um renderizador nesta ordem: $CHROME_PATH, Chrome/Chromium/Edge no
 * Linux, e por fim o Chrome/Edge do Windows quando rodando sob WSL. No caso
 * WSL o HTML é copiado para o %TEMP% do Windows, porque o Chrome do Windows
 * não lê caminhos do sistema de arquivos do WSL de forma confiável.
 */

import { execFileSync, execSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, rm, stat, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { build } from './build.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));

const LINUX_CANDIDATES = [
  'chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable', 'microsoft-edge',
];

const WINDOWS_CANDIDATES = [
  '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
  '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/mnt/c/Program Files/Microsoft/Edge/Application/msedge.exe',
];

function which(bin) {
  try {
    return execSync(`command -v ${bin}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null;
  } catch {
    return null;
  }
}

function findRenderer() {
  if (process.env.CHROME_PATH) {
    if (!existsSync(process.env.CHROME_PATH)) throw new Error(`CHROME_PATH não existe: ${process.env.CHROME_PATH}`);
    return { bin: process.env.CHROME_PATH, windows: process.env.CHROME_PATH.endsWith('.exe') };
  }
  for (const c of LINUX_CANDIDATES) {
    const bin = which(c);
    if (bin) return { bin, windows: false };
  }
  for (const bin of WINDOWS_CANDIDATES) {
    if (existsSync(bin)) return { bin, windows: true };
  }
  throw new Error(
    'nenhum Chrome/Chromium/Edge encontrado.\n' +
    '  Linux:   sudo apt install chromium-browser\n' +
    '  ou:      CHROME_PATH=/caminho/para/chrome node export-pdf.mjs'
  );
}

/** %TEMP% do Windows visto de dentro do WSL. */
function windowsTempDir() {
  const win = execSync("cmd.exe /c 'echo %TEMP%' 2>/dev/null", { encoding: 'utf8' }).trim().replace(/\r/g, '');
  return execSync(`wslpath ${JSON.stringify(win)}`, { encoding: 'utf8' }).trim();
}

const toWin = (p) => execSync(`wslpath -w ${JSON.stringify(p)}`, { encoding: 'utf8' }).trim();

async function main() {
  const { outPath: htmlPath, meta } = await build({ quiet: true });

  const pdfPath = resolve(ROOT, (meta.pdfOutput ?? 'dist/dossie-v{{version}}.pdf').replace('{{version}}', meta.version));
  await mkdir(dirname(pdfPath), { recursive: true });

  const { bin, windows } = findRenderer();
  console.log(`  renderizador: ${bin}`);

  const flags = [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--no-pdf-header-footer',
    '--virtual-time-budget=4000',
  ];

  if (!windows) {
    execFileSync(bin, [...flags, `--print-to-pdf=${pdfPath}`, `file://${htmlPath}`], { stdio: ['ignore', 'ignore', 'pipe'] });
  } else {
    // O Chrome do Windows não enxerga /home do WSL de forma confiável:
    // copia entrada e saída por um diretório que os dois lados leem.
    const stage = await mkdtemp(join(windowsTempDir(), 'msd-dossie-'));
    try {
      const stagedHtml = join(stage, basename(htmlPath));
      const stagedPdf = join(stage, basename(pdfPath));
      await copyFile(htmlPath, stagedHtml);

      const winDir = toWin(stage);
      const winHtmlUrl = 'file:///' + toWin(stagedHtml).replace(/\\/g, '/');

      execFileSync(bin, [...flags, `--print-to-pdf=${winDir}\\${basename(pdfPath)}`, winHtmlUrl], {
        stdio: ['ignore', 'ignore', 'pipe'],
      });

      if (!existsSync(stagedPdf)) throw new Error('o Chrome não produziu o PDF (verifique o log acima)');
      await copyFile(stagedPdf, pdfPath);
    } finally {
      await rm(stage, { recursive: true, force: true });
    }
  }

  const { size } = await stat(pdfPath);
  // O nó raiz de /Pages carrega o total; os aninhados carregam parciais — daí o máximo.
  const counts = [...(await readFile(pdfPath, 'latin1')).matchAll(/\/Count\s+(\d+)/g)].map((m) => +m[1]);
  const pages = counts.length ? Math.max(...counts) : null;

  console.log(`✓ ${pdfPath}`);
  console.log(`  v${meta.version} · ${(size / 1024).toFixed(0)} KB${pages ? ` · ${pages} páginas` : ''}`);
}

await main();
