/* ══════════════════════════════════════════
   Genera la versión para compartir del bloque:
   un único HTML autocontenido (estilos, fuentes,
   imágenes, datos, viñetas y comportamiento incrustados).

   Uso (desde esta carpeta _fuente):
     node generar.mjs
   ══════════════════════════════════════════ */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'Bloque 4 - RAG y Gemini Notebook.html');

const TYPES = { '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml' };
const dataUri = (file) => `data:${TYPES[extname(file).toLowerCase()]};base64,${readFileSync(file).toString('base64')}`;
const inlineScript = (code) => code.replace(/<\/script/gi, '<\\/script');

/**
 * Devuelve el HTML de `htmlFile` con sus hojas de estilo, scripts, fuentes
 * e imágenes incrustados. Las rutas son relativas al archivo que las cita.
 * Lo usa también el generador de la solución.
 */
export function inline(htmlFile) {
  const dir = dirname(htmlFile);
  let html = readFileSync(htmlFile, 'utf8');

  html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) => {
    const file = resolve(dir, href);
    const css = readFileSync(file, 'utf8')
      .replace(/url\("(?!data:)([^"]+)"\)/g, (u, path) => `url("${dataUri(resolve(dirname(file), path))}")`);
    return `<style>\n${css}\n</style>`;
  });
  html = html.replace(/<script src="([^"]+)"><\/script>/g,
    (m, src) => `<script>\n${inlineScript(readFileSync(resolve(dir, src), 'utf8'))}\n</script>`);
  html = html.replace(/ src="([^"]+\.(?:png|jpe?g|svg))"/g, (m, path) => ` src="${dataUri(resolve(dir, path))}"`);

  if (/<link rel="stylesheet"|<script src=|url\("(?!data:)/.test(html)) {
    throw new Error('No se han podido incrustar todos los recursos.');
  }
  return html;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const html = inline(join(HERE, 'rag.html'));
  writeFileSync(OUT, html);
  console.log(`Generado: ${OUT} (${Math.round(Buffer.byteLength(html) / 1024)} KB)`);
}
