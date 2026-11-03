/* ══════════════════════════════════════════
   Regenera las dos presentaciones y copia en docs/ lo que
   publica GitHub Pages:
     docs/index.html            Bloque 4: explicación y caso (alumnos)
     docs/solucion/index.html   Solución del docente, con su .md

   Uso (desde esta carpeta):
     node publicar.mjs
   ══════════════════════════════════════════ */

import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const CLASE = join(ROOT, 'Para clase');
const SOL = join(ROOT, 'Solo docente', 'Solucion del caso');
const DOCS = join(ROOT, 'docs');

for (const dir of [join(CLASE, '_fuente'), join(SOL, '_fuente')]) {
  execFileSync(process.execPath, ['generar.mjs'], { cwd: dir, stdio: 'inherit' });
}

mkdirSync(join(DOCS, 'solucion'), { recursive: true });
writeFileSync(join(DOCS, '.nojekyll'), '');
copyFileSync(join(CLASE, 'Bloque 4 - RAG y Gemini Notebook.html'), join(DOCS, 'index.html'));
copyFileSync(join(SOL, 'Solucion - Viajes Lunaria.html'), join(DOCS, 'solucion', 'index.html'));
copyFileSync(join(SOL, 'Solucion - Viajes Lunaria.md'), join(DOCS, 'solucion', 'solucion-viajes-lunaria.md'));

console.log('Listo: docs/ actualizado.');
