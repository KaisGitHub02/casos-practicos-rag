/* ══════════════════════════════════════════
   Solución del caso · comportamiento
   Lee la solución de b4-solucion.js (la misma que usa Sibou Lab) y
   las piezas comunes de rag.js (window.RAG). Se carga antes de
   casos.js, que pone la navegación y el raíl.
   ══════════════════════════════════════════ */

window.CP_STEPS = [
  { id: 's-idea',       who: 'c1', label: 'Idea',        slide: 's-idea' },
  { id: 's-fuentes',    who: 'c1', label: 'Fuentes',     slide: 's-fuentes' },
  { id: 's-respuestas', who: 'c1', label: 'Respuestas',  slide: 's-respuestas' },
  { id: 's-diag',       who: 'c1', label: 'Diagnóstico', slide: 's-diag' },
  { id: 's-diseno',     who: 'c1', label: 'Diseño',      slide: 's-diseno' },
  { id: 's-rubrica',    who: 'c1', label: 'Rúbrica',     slide: 's-rubrica' },
  { id: 's-notas',      who: 'c1', label: 'Notas',       slide: 's-notas' }
];
window.CP_WHO = { c1: { name: 'Solución' } };
window.CP_LANES = [
  { who: 'c1', stops: ['Diez fuentes', 'Catorce respuestas', 'Inyección y diagnóstico', 'Rúbrica'] }
];

(() => {
  'use strict';
  const R = window.RAG;
  const CASO = window.PL && PL.practicas && PL.practicas.b4;
  const S = CASO && CASO.solucion;
  if (!R || !S) return;
  const { $, $$, esc, icon, md, mdi, swap, buildCaseList, mountPlayer, copyText } = R;
  const set = (key, html) => { const n = $(`[data-sol="${key}"]`); if (n) n.innerHTML = html; };

  /* Idea de fondo y viñetas */
  set('resumen', mdi(S.resumen));
  mountPlayer($('[data-sol-px]'), S.panels);

  /* Fuentes: una tarjeta por documento */
  const TONE = { ok: 'Subir', warn: 'Solo control', ko: 'No subir' };
  set('fuentes', S.fuentes.map((f, i) => `<li class="rule sol-src sol-src--${esc(f[2])}">
      <p class="rule__top"><span class="rule__n">${String(i + 1).padStart(2, '0')}</span><b>${esc(f[0].replace(/^\d+ · /, ''))}</b></p>
      <p class="sol-src__dec"><span class="pill pill--${esc(f[2])}">${esc(TONE[f[2]] || '')}</span>${f[1].toLowerCase().startsWith((TONE[f[2]] || '').toLowerCase()) && f[1].length <= (TONE[f[2]] || '').length ? '' : esc(f[1])}</p>
      <p class="rule__text">${mdi(f[3])}</p></li>`).join(''));

  /* Las ocho respuestas */
  const VERD = [['respalda en parte', 'warn'], ['no respalda', 'ko'], ['contradice', 'ko'], ['desactualizada', 'warn'], ['respalda', 'ok']];
  const tagVerdicts = (html) => VERD.reduce((h, [w, tone]) => h.replace(new RegExp(`<strong>(${w})</strong>`, 'gi'), `<strong class="verd verd--${tone}">$1</strong>`), html);
  const lista = $('[data-sol="lista"]');
  const view = $('#sol-q-view');
  const title = $('#sol-q-title span');
  const foco = $('#sol-q-foco');
  if (lista && view) {
    buildCaseList(lista, S.respuestas.map((r) => {
      const p = CASO.preguntas.find((x) => x.n === r.n);
      return [String(r.n), { label: `P${r.n} · ${p.foco}` }];
    }), (id, first) => {
      const r = S.respuestas.find((x) => String(x.n) === id);
      const p = CASO.preguntas.find((x) => x.n === r.n);
      title.textContent = `Pregunta ${r.n}`;
      foco.textContent = p.foco;
      view.innerHTML = `<p class="sol-answer__q">${esc(p.q)}</p>
        <div class="sol-answer__a"><span>Respuesta maestra</span>${md(r.respuesta)}</div>
        <dl class="sol-answer__grid">
          <div><dt>${icon('target')}Cálculo y razonamiento</dt><dd>${md(r.calculo)}</dd></div>
          <div><dt>${icon('file')}Cita que la demuestra</dt><dd>${md(r.cita)}</dd></div>
          <div><dt>${icon('warn')}La trampa</dt><dd>${md(r.trampa)}</dd></div>
          <div><dt>${icon('eye')}Veredicto de ejemplo</dt><dd>${tagVerdicts(md(r.veredicto))}</dd></div>
        </dl>`;
      view.parentElement.scrollTop = 0;
      if (!first) { swap(view); swap(title); }
    });
  }

  /* Contaminación y diagnóstico */
  set('contaminacion', S.contaminacion.map((x) => `<li>${mdi(x)}</li>`).join(''));
  set('diagnostico', `<table><thead><tr><th>Síntoma</th><th>Tipo de fallo</th><th>Arreglo</th></tr></thead><tbody>${S.diagnostico.map((d) => `<tr><td><b>${esc(d[0])}</b></td><td>${mdi(d[1])}</td><td>${mdi(d[2])}</td></tr>`).join('')}</tbody></table>`);

  /* Diseño para producción */
  const PIEZAS = {
    instrucciones: { label: 'Instrucciones de sistema', short: 'Prioridad de fuentes, «no consta» y defensa frente a inyecciones', html: () => `<pre class="sol-code">${esc(S.instrucciones)}</pre>`, text: () => S.instrucciones },
    metadatos: { label: 'Metadatos de cada fragmento', short: 'Vigencia, autoridad, ruta y permisos', html: () => `<pre class="sol-code">${esc(S.metadatos)}</pre>`, text: () => S.metadatos },
    troceado: { label: 'Troceado y permisos', short: 'Por tipo de documento', html: () => `<ul class="sol-list">${S.troceado.map((x) => `<li>${mdi(x)}</li>`).join('')}</ul>`, text: () => S.troceado.map((x) => '- ' + x).join('\n') },
    banco: { label: 'Banco de pruebas', short: 'Doce preguntas, cuatro de ataque', html: () => `<div class="sol-table"><table><thead><tr><th>Pregunta</th><th>Respuesta esperada</th><th>Fuente</th></tr></thead><tbody>${S.banco.map((b) => `<tr><td>${esc(b[0])}</td><td>${esc(b[1])}</td><td>${esc(b[2])}</td></tr>`).join('')}</tbody></table></div>`, text: () => ['| Pregunta | Respuesta esperada | Fuente |', '|---|---|---|', ...S.banco.map((b) => `| ${b.join(' | ')} |`)].join('\n') },
    plan: { label: 'Plan de mantenimiento', short: '1 de diciembre, 1 de enero y v3.1', html: () => `<div class="sol-plan">${md(S.plan1dic)}</div>`, text: () => S.plan1dic }
  };
  let pieza = null;
  const dl = $('[data-sol="diseno-lista"]');
  const dv = $('#sol-d-view');
  const dt = $('#sol-d-title span');
  if (dl && dv) {
    buildCaseList(dl, Object.entries(PIEZAS), (id, first) => {
      pieza = PIEZAS[id];
      dt.textContent = pieza.label;
      dv.innerHTML = pieza.html();
      if (!first) { swap(dv); swap(dt); }
    });
    $('#sol-d-copy').addEventListener('click', (e) => { if (pieza) copyText(pieza.text(), e.currentTarget); });
  }

  /* Rúbrica, errores y notas */
  set('rubrica', `<table><thead><tr><th>Criterio</th><th>Pts.</th><th>Excelente</th><th>Suficiente</th><th>Insuficiente</th></tr></thead><tbody>${S.rubrica.map((r) => `<tr><td><b>${esc(r[0])}</b></td><td class="num">${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td>${esc(r[4])}</td></tr>`).join('')}</tbody></table>`);
  set('errores', S.errores.map((x) => `<li>${mdi(x)}</li>`).join(''));
  set('profesorado', S.profesorado.map((x) => `<li>${mdi(x)}</li>`).join(''));
})();
