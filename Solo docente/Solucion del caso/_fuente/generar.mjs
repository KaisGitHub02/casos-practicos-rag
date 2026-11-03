/* ══════════════════════════════════════════
   Genera la solución del docente:
   - «Solucion - Viajes Lunaria.html»: presentación autocontenida.
   - «Solucion - Viajes Lunaria.md»: la misma solución en texto.
   Reutiliza el incrustador de «Para clase/_fuente/generar.mjs».

   Uso (desde esta carpeta _fuente):
     node generar.mjs
   ══════════════════════════════════════════ */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { inline } from '../../../Para clase/_fuente/generar.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_HTML = join(HERE, '..', 'Solucion - Viajes Lunaria.html');
const OUT_MD = join(HERE, '..', 'Solucion - Viajes Lunaria.md');

const html = inline(join(HERE, 'solucion.html'));
writeFileSync(OUT_HTML, html);
console.log(`Generado: ${OUT_HTML} (${Math.round(Buffer.byteLength(html) / 1024)} KB)`);

/* Lee los datos sin navegador: las funciones de dibujo se sustituyen por vacías */
const noop = new Proxy(function () {}, { get: () => noop, apply: () => undefined });
const ctx = { window: {}, PL: { D: noop, K: noop } };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync(join(HERE, '../../../Para clase/_fuente/sibou/caso-b4.js'), 'utf8'), ctx);
vm.runInContext(readFileSync(join(HERE, 'b4-solucion.js'), 'utf8'), ctx);
const C = ctx.PL.practicas.b4;
const S = C.solucion;

const L = [`# Solución · ${C.titulo}`, '', '> Solo docente. Para enseñar después de que las parejas presenten. No es la única respuesta válida.', '', S.resumen, ''];
L.push('## Fases 1 y 2 · Qué entra en el cuaderno', '', '| Documento | Decisión | Por qué |', '|---|---|---|');
S.fuentes.forEach((f) => L.push(`| ${f[0]} | ${f[1]} | ${f[3]} |`));
L.push('', '## Fase 3 · Las ocho respuestas', '');
S.respuestas.forEach((r) => {
  const p = C.preguntas.find((x) => x.n === r.n);
  L.push(`### P${r.n}. ${p.q}`, '', `*${p.foco}*`, '', `**Respuesta maestra.** ${r.respuesta}`, '', `- **Cálculo:** ${r.calculo}`, `- **Cita:** ${r.cita}`, `- **Trampa:** ${r.trampa}`, `- **Veredicto de ejemplo:** ${r.veredicto}`, '');
});
L.push('## Fase 4 · Contaminación', '', ...S.contaminacion.map((x) => `- ${x}`), '');
L.push('## Fase 5 · Diagnóstico', '', '| Síntoma | Tipo de fallo | Arreglo |', '|---|---|---|', ...S.diagnostico.map((d) => `| ${d.join(' | ')} |`), '');
L.push('## Fase 6 · Diseño para producción', '', '### Instrucciones de sistema', '', '```', S.instrucciones, '```', '', '### Metadatos', '', '```json', S.metadatos, '```', '', '### Troceado', '', ...S.troceado.map((x) => `- ${x}`), '', '### Banco de pruebas', '', '| Pregunta | Respuesta esperada | Fuente |', '|---|---|---|', ...S.banco.map((b) => `| ${b.join(' | ')} |`), '', '### El 1 de diciembre de 2026', '', S.plan1dic, '');
L.push('## Rúbrica (10 puntos)', '', '| Criterio | Pts. | Excelente | Suficiente | Insuficiente |', '|---|---|---|---|---|', ...S.rubrica.map((r) => `| ${r.join(' | ')} |`), '');
L.push('## Errores frecuentes', '', ...S.errores.map((x) => `- ${x}`), '', '## Notas para el profesorado', '', ...S.profesorado.map((x) => `- ${x}`), '');
writeFileSync(OUT_MD, L.join('\n'));
console.log(`Generado: ${OUT_MD}`);
