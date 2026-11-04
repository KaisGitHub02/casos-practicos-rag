/* =========================================================================
   Laboratorios interactivos del Bloque 4 (diapositivas l-espacio,
   l-troceado y l-modelo). Se montan la primera vez que se muestra su
   diapositiva:
   espacio    Explorador del espacio de embeddings (3D, vecinos)
   troceado   Troceado en vivo (estrategias, solapamiento, recuperación)
   modelo     Por dentro del modelo (tokens, atención, siguiente palabra)
   Son modelos didácticos: coordenadas, atención y probabilidades están
   preparadas para enseñar el concepto; no salen de un modelo real.
   ========================================================================= */
(function () {
  'use strict';
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rnd = seed => { const v = Math.sin(seed * 9301 + 49297) * 233280; return v - Math.floor(v); };
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Lienzo nítido en pantallas de alta densidad */
  function fitCanvas(cv, h) {
    const w = cv.parentElement.clientWidth, dpr = window.devicePixelRatio || 1;
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  /* =====================================================================
     1 · ESPACIO DE EMBEDDINGS
     ===================================================================== */
  const GROUPS = [
    { id: 'animales', label: 'Animales', color: '#f28c38', c: [-62, 38, -20], words: ['gato', 'felino', 'minino', 'gatito', 'perro', 'cachorro', 'mascota', 'ronronea', 'veterinario'] },
    { id: 'dinero', label: 'Dinero', color: '#6fdc9f', c: [44, -40, 30], words: ['dinero', 'pago', 'factura', 'impago', 'deuda', 'dificultades económicas', 'préstamo', 'no puedo pagar', 'transferencia'] },
    { id: 'viajes', label: 'Viajes', color: '#8ec5ff', c: [58, 42, -26], words: ['viaje', 'vuelo', 'hotel', 'maleta', 'aeropuerto', 'escapada', 'billete', 'reserva', 'vacaciones'] },
    { id: 'cancelar', label: 'Cancelaciones', color: '#f7cf5a', c: [62, 4, 8], words: ['cancelar', 'anular', 'devolución', 'reembolso', 'penalización', 'gastos de gestión', 'fuerza mayor', 'plazo', 'temporada alta'] },
    { id: 'legal', label: 'Normas y contratos', color: '#a184f0', c: [6, -14, -62], words: ['contrato', 'contract', 'cláusula', 'firma', 'política', 'se permite', 'no se permite', 'obligatorio', 'excepción'] },
    { id: 'comida', label: 'Comida', color: '#ef5a5a', c: [-50, -46, 34], words: ['paella', 'tortilla', 'menú', 'restaurante', 'cena', 'tapa', 'desayuno'] },
    { id: 'emociones', label: 'Emociones', color: '#f39ac1', c: [-28, 6, 66], words: ['alegría', 'felicidad', 'contento', 'tristeza', 'enfado', 'miedo', 'preocupación'] }
  ];
  /* Casos especiales: posiciones pensadas para enseñar algo */
  const SPECIAL = {
    'gato': [-70, 44, -16], 'felino': [-66, 50, -12], 'minino': [-76, 40, -22], 'gatito': [-72, 36, -10], 'ronronea': [-60, 40, -26],
    'perro': [-86, 66, -44], 'cachorro': [-92, 60, -50], 'mascota': [-78, 54, -32],
    'reembolso': [52, -16, 18],                 // entre dinero y cancelaciones
    'no puedo pagar': [40, -30, 22],
    'se permite': [6, -10, -58], 'no se permite': [9, -12, -56],   // negación: casi el mismo punto
    'contract': [0, -16, -66],                  // otro idioma, mismo significado
    'veterinario': [-46, 20, -2],
    'preocupación': [-6, -8, 52],               // emociones cerca de dinero
    'temporada alta': [60, 24, -6]              // cancelaciones cerca de viajes
  };
  let POINTS = null;
  function points() {
    if (POINTS) return POINTS;
    POINTS = [];
    GROUPS.forEach(g => g.words.forEach((w, i) => {
      const s = hash(w);
      const p = SPECIAL[w] || [g.c[0] + (rnd(s) - 0.5) * 44, g.c[1] + (rnd(s + 1) - 0.5) * 44, g.c[2] + (rnd(s + 2) - 0.5) * 44];
      POINTS.push({ w, g, p });
    }));
    return POINTS;
  }
  /* cercanía en el mapa: 1 en el mismo punto, tiende a 0 al alejarse */
  const cos = (a, b) => Math.exp(-((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) / (2 * 38 * 38));
  const QUERIES = ['problemas para pagar', 'quiero anular mi viaje', 'mi gato está malo', 'no se permite cancelar', 'cena con alegría'];

  /* Coloca una frase libre como media de las palabras conocidas (bolsa de palabras) */
  function placeQuery(text) {
    const STOP = new Set(['para', 'con', 'los', 'las', 'del', 'una', 'uno', 'que', 'por', 'esta', 'este', 'mis', 'muy', 'mas']);
    const toks = norm(text).split(/[^a-z0-9ñ]+/).filter(t => (t.length > 2 && !STOP.has(t)) || t === 'no');
    const known = [], unknown = [];
    const P = points();
    const ALIAS = { pagar: 'pago', anular: 'anular', viaje: 'viaje', malo: 'veterinario', enfermo: 'veterinario', problemas: 'preocupación', cancelar: 'cancelar', permite: 'se permite', comer: 'menú', cena: 'cena', alegria: 'alegría', devolver: 'devolución', dinero: 'dinero', hotel: 'hotel', vuelo: 'vuelo', gato: 'gato', perro: 'perro', triste: 'tristeza', contento: 'contento', contrato: 'contrato', factura: 'factura', reserva: 'reserva', plazo: 'plazo' };
    toks.forEach(t => {
      const direct = P.find(p => norm(p.w) === t) || (ALIAS[t] && P.find(p => p.w === ALIAS[t])) || P.find(p => norm(p.w).startsWith(t.slice(0, 5)) && t.length > 4);
      if (direct) known.push(direct); else unknown.push(t);
    });
    if (!known.length) return { p: null, known, unknown };
    const p = [0, 1, 2].map(k => known.reduce((a, x) => a + x.p[k], 0) / known.length);
    if (toks.includes('no')) { p[2] += 2; }
    const unknownShown = unknown.filter(u => u !== 'no');
    return { p, known, unknown: unknownShown };
  }

  function viewEspacio(root) {
    root.innerHTML = `
      <div class="lab-grid">
        <section class="lab-stage card" aria-label="Espacio de embeddings en 3D">
          <div class="lab-stage__bar">
            <span>Arrastra para girar · rueda para acercar · pulsa un punto para ver sus vecinos</span>
            <span class="lab-tools">
              <label><input type="checkbox" data-k="labels" checked> Etiquetas</label>
              <label><input type="checkbox" data-k="spin"> Girar solo</label>
              <button type="button" class="btn small" data-act="reset">Recentrar</button>
            </span>
          </div>
          <canvas class="lab-canvas" role="img" aria-label="Nube de puntos en tres dimensiones; cada punto es una palabra o frase"></canvas>
          <ul class="lab-legend">${GROUPS.map(g => `<li><button type="button" data-group="${g.id}" aria-pressed="true"><i style="background:${g.color}"></i>${esc(g.label)}</button></li>`).join('')}</ul>
        </section>
        <aside class="lab-side">
          <section class="card">
            <h2 class="lab-h">Busca o escribe una frase</h2>
            <form class="lab-search" data-act="search"><input type="search" placeholder="p. ej. problemas para pagar" aria-label="Palabra o frase" list="lab-words"><button class="btn small primary">Colocar</button></form>
            <datalist id="lab-words">${points().map(p => `<option value="${esc(p.w)}">`).join('')}</datalist>
            <p class="lab-chips">${QUERIES.map(q => `<button type="button" class="chip-btn" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</p>
            <div class="lab-k"><label>Vecinos: <input type="range" min="3" max="10" value="5" data-k="k"> <b data-out="k">5</b></label></div>
          </section>
          <section class="card lab-result" aria-live="polite"><p class="hint">Elige un punto o escribe una frase.</p></section>
        </aside>
      </div>`;

    const cv = root.querySelector('.lab-canvas');
    const st = { ax: -0.35, ay: 0.6, zoom: 1, sel: null, query: null, k: 5, labels: true, spin: false, hidden: new Set(), drag: null, hover: null, alive: true };
    const P = points();
    const H = () => Math.min(470, Math.max(300, cv.parentElement.clientWidth * 0.55));
    let size = fitCanvas(cv, H());
    const onResize = () => { size = fitCanvas(cv, H()); };
    window.addEventListener('resize', onResize);

    function project(p) {
      const [x, y, z] = p;
      const cy = Math.cos(st.ay), sy = Math.sin(st.ay), cx = Math.cos(st.ax), sx = Math.sin(st.ax);
      const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
      const y1 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
      const f = 300, s = f / (f + z2) * Math.min(size.w, size.h) / 168 * st.zoom;
      return { x: size.w / 2 + x1 * s, y: size.h / 2 - y1 * s, z: z2, s };
    }
    function neighbours(origin, exclude) {
      return P.filter(p => p !== exclude && !st.hidden.has(p.g.id)).map(p => ({ p, sim: cos(origin, p.p) })).sort((a, b) => b.sim - a.sim).slice(0, st.k);
    }
    function current() {
      if (st.query && st.query.p) return { origin: st.query.p, label: '«' + st.query.text + '»', exclude: null };
      if (st.sel) return { origin: st.sel.p, label: st.sel.w, exclude: st.sel };
      return null;
    }
    function result() {
      const box = root.querySelector('.lab-result');
      const cur = current();
      if (st.query && !st.query.p) { box.innerHTML = `<h2 class="lab-h">«${esc(st.query.text)}»</h2><p class="lab-warn">Ninguna palabra de la frase está en el vocabulario de este mapa: no se puede colocar. A los modelos reales les pasa algo parecido con jerga, siglas o códigos que casi no vieron al entrenarse.</p>`; return; }
      if (!cur) { box.innerHTML = '<p class="hint">Elige un punto o escribe una frase.</p>'; return; }
      const nn = neighbours(cur.origin, cur.exclude);
      const vec = cur.origin.map(v => (v / 100).toFixed(2).replace('.', ','));
      box.innerHTML = `<h2 class="lab-h">${esc(cur.label)}</h2>
        <p class="lab-vec">coordenadas <code>[ ${vec.join('  ')} ]</code><span>3 números aquí · 768 o más en un modelo real</span></p>
        ${st.query ? `<p class="lab-small">Colocada como la media de: ${st.query.known.map(k => `<b>${esc(k.w)}</b>`).join(', ')}${st.query.unknown.length ? ` · sin posición: ${st.query.unknown.map(esc).join(', ')}` : ''}</p>` : ''}
        <h3 class="lab-h3">Vecinos más cercanos (cercanía en el mapa)</h3>
        <ol class="lab-nn">${nn.map(n => `<li><button type="button" data-w="${esc(n.p.w)}"><i style="background:${n.p.g.color}"></i>${esc(n.p.w)}</button><span class="lab-bar"><span style="width:${clamp(n.sim, 0, 1) * 100}%"></span></span><b>${n.sim.toFixed(2).replace('.', ',')}</b></li>`).join('')}</ol>
        ${tip(cur, nn)}`;
    }
    function tip(cur, nn) {
      const w = st.sel && st.sel.w;
      if (w === 'se permite' || w === 'no se permite') return '<p class="lab-tip">Fíjate: «se permite» y «no se permite» están casi en el mismo punto. La cercanía mide parecido de tema, no si dicen lo mismo.</p>';
      if (w === 'contrato' || w === 'contract') return '<p class="lab-tip">«contrato» y «contract» quedan juntos: muchos modelos colocan cerca la misma idea en distintos idiomas.</p>';
      if (w === 'reembolso') return '<p class="lab-tip">«reembolso» cae entre el grupo del dinero y el de las cancelaciones: comparte significado con los dos.</p>';
      if (st.query) return '<p class="lab-tip">La frase se ha colocado con la media de sus palabras. Los modelos reales leen la frase entera con su contexto, pero la idea es la misma: un texto nuevo se convierte en coordenadas y se buscan sus vecinos.</p>';
      return '';
    }
    function draw() {
      if (!st.alive) return;
      if (!root.closest('.slide.is-active') && !document.documentElement.classList.contains('is-reflow')) { requestAnimationFrame(draw); return; }
      if (!size.w) size = fitCanvas(cv, H());
      if (st.spin && !st.drag && !reduceMotion()) st.ay += 0.004;
      const { ctx, w, h } = size;
      ctx.fillStyle = '#0f1528'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#222d4b'; for (let x = 6; x < w; x += 14) for (let y = 6; y < h; y += 14) ctx.fillRect(x, y, 1, 1);
      // ejes
      [[[-90, 0, 0], [90, 0, 0]], [[0, -90, 0], [0, 90, 0]], [[0, 0, -90], [0, 0, 90]]].forEach(([a, b]) => { const pa = project(a), pb = project(b); ctx.strokeStyle = 'rgba(169,179,204,.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke(); });
      const cur = current();
      const nn = cur ? neighbours(cur.origin, cur.exclude) : [];
      const nnSet = new Set(nn.map(n => n.p));
      const qp = cur ? project(cur.origin) : null;
      if (qp) nn.forEach((n, i) => { const pp = project(n.p.p); ctx.strokeStyle = 'rgba(247,207,90,' + (0.85 - i * 0.07) + ')'; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(qp.x, qp.y); ctx.lineTo(pp.x, pp.y); ctx.stroke(); ctx.setLineDash([]); });
      const proj = P.filter(p => !st.hidden.has(p.g.id)).map(p => ({ p, q: project(p.p) })).sort((a, b) => b.q.z - a.q.z);
      st.screen = proj;
      ctx.textBaseline = 'middle';
      proj.forEach(({ p, q }) => {
        const r = clamp(3.5 * q.s, 2.5, 7), on = p === st.sel || nnSet.has(p) || p === st.hover;
        const dim = cur && !on;
        ctx.globalAlpha = dim ? 0.35 : 1;
        ctx.fillStyle = '#0a0f1d'; ctx.fillRect(Math.round(q.x - r - 1), Math.round(q.y - r - 1), Math.round(r * 2 + 2), Math.round(r * 2 + 2));
        ctx.fillStyle = p.g.color; ctx.fillRect(Math.round(q.x - r), Math.round(q.y - r), Math.round(r * 2), Math.round(r * 2));
        if (p === st.sel) { ctx.strokeStyle = '#f7cf5a'; ctx.lineWidth = 2; ctx.strokeRect(q.x - r - 4, q.y - r - 4, r * 2 + 8, r * 2 + 8); }
        if ((st.labels && !cur) || on || (st.labels && cur && !dim)) { ctx.font = (on ? '700 ' : '600 ') + (on ? 13 : 11) + 'px "Atkinson Hyperlegible", Arial, sans-serif'; ctx.fillStyle = on ? '#ffffff' : 'rgba(238,241,248,.75)'; ctx.fillText(p.w, q.x + r + 4, q.y); }
        ctx.globalAlpha = 1;
      });
      if (st.query && st.query.p) { const r = 7; ctx.fillStyle = '#0a0f1d'; ctx.fillRect(qp.x - r - 2, qp.y - r - 2, r * 2 + 4, r * 2 + 4); ctx.fillStyle = '#f7cf5a'; ctx.fillRect(qp.x - r, qp.y - r, r * 2, r * 2); ctx.font = '700 13px "Atkinson Hyperlegible", Arial, sans-serif'; ctx.fillStyle = '#f7cf5a'; ctx.fillText('«' + st.query.text + '»', qp.x + 12, qp.y - 14); }
      requestAnimationFrame(draw);
    }
    function pick(ev) {
      const rc = cv.getBoundingClientRect(), x = ev.clientX - rc.left, y = ev.clientY - rc.top;
      let best = null, bd = 14;
      (st.screen || []).forEach(({ p, q }) => { const d = Math.hypot(q.x - x, q.y - y); if (d < bd) { bd = d; best = p; } });
      return best;
    }
    cv.addEventListener('pointerdown', e => { st.drag = { x: e.clientX, y: e.clientY, ax: st.ax, ay: st.ay, moved: false }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => {
      if (st.drag) { const dx = e.clientX - st.drag.x, dy = e.clientY - st.drag.y; if (Math.abs(dx) + Math.abs(dy) > 3) st.drag.moved = true; st.ay = st.drag.ay + dx * 0.008; st.ax = clamp(st.drag.ax + dy * 0.008, -1.4, 1.4); }
      else { st.hover = pick(e); cv.style.cursor = st.hover ? 'pointer' : 'grab'; }
    });
    cv.addEventListener('pointerup', e => { const d = st.drag; st.drag = null; if (d && !d.moved) { const p = pick(e); if (p) { st.sel = p; st.query = null; result(); } } });
    cv.addEventListener('wheel', e => { e.preventDefault(); st.zoom = clamp(st.zoom * (e.deltaY < 0 ? 1.1 : 0.9), 0.5, 3); }, { passive: false });
    const setQuery = text => {
      const t = text.trim(); if (!t) return;
      const exact = P.find(p => norm(p.w) === norm(t));
      if (exact) { st.sel = exact; st.query = null; }
      else { st.query = Object.assign({ text: t }, placeQuery(t)); st.sel = null; }
      result();
    };
    root.querySelector('[data-act="search"]').addEventListener('submit', e => { e.preventDefault(); setQuery(e.target.querySelector('input').value); });
    root.addEventListener('click', e => {
      const q = e.target.closest('[data-q]'); if (q) { root.querySelector('.lab-search input').value = q.dataset.q; setQuery(q.dataset.q); }
      const w = e.target.closest('[data-w]'); if (w) setQuery(w.dataset.w);
      const g = e.target.closest('[data-group]'); if (g) { const id = g.dataset.group; if (st.hidden.has(id)) st.hidden.delete(id); else st.hidden.add(id); g.setAttribute('aria-pressed', String(!st.hidden.has(id))); result(); }
      if (e.target.closest('[data-act="reset"]')) { st.ax = -0.35; st.ay = 0.6; st.zoom = 1; }
    });
    root.querySelector('[data-k="labels"]').addEventListener('change', e => { st.labels = e.target.checked; });
    root.querySelector('[data-k="spin"]').addEventListener('change', e => { st.spin = e.target.checked; });
    root.querySelector('[data-k="k"]').addEventListener('input', e => { st.k = +e.target.value; root.querySelector('[data-out="k"]').textContent = st.k; result(); });

    st.sel = P.find(p => p.w === 'gato'); result();
    requestAnimationFrame(draw);
    return () => { st.alive = false; window.removeEventListener('resize', onResize); };
  }

  /* =====================================================================
     2 · TROCEADO EN VIVO
     ===================================================================== */
  const CHUNK_COLORS = ['#4f86e0', '#f28c38', '#3fae6b', '#a184f0', '#ef5a5a', '#3cc6c6', '#d9a21b', '#f39ac1'];

  function sampleTexts() {
    const docs = ((PL.practicas || {}).b4 || {}).docs || [];
    const pick = id => (docs.find(d => d.id === id) || {}).text;
    return [
      ['Política de cancelaciones v3.0', pick('politica-v3')],
      ['Anexo de grupos', pick('anexo-grupos')],
      ['Póliza del seguro', pick('poliza')],
      ['Texto libre (pega el tuyo)', '']
    ].filter(x => x[1] != null);
  }

  /* Devuelve [{start, end}] sobre el texto original */
  function splitFixed(t, size, ov) {
    const out = [], step = Math.max(20, Math.round(size * (1 - ov)));
    for (let s = 0; s < t.length; s += step) { out.push({ start: s, end: Math.min(t.length, s + size) }); if (s + size >= t.length) break; }
    return out;
  }
  function units(t, re) { const out = []; let last = 0, m; re.lastIndex = 0; while ((m = re.exec(t))) { const end = m.index + m[0].length; if (end > last) out.push({ start: last, end }); last = end; } if (last < t.length) out.push({ start: last, end: t.length }); return out.filter(u => t.slice(u.start, u.end).trim()); }
  function pack(us, size) {
    const out = []; let cur = null;
    us.forEach(u => {
      if (!cur) cur = { start: u.start, end: u.end };
      else if (u.end - cur.start <= size) cur.end = u.end;
      else { out.push(cur); cur = { start: u.start, end: u.end }; }
    });
    if (cur) out.push(cur);
    return out;
  }
  function recursive(t, start, end, size, seps) {
    if (end - start <= size || !seps.length) return [{ start, end }];
    const [sep, ...rest] = seps;
    const piece = t.slice(start, end);
    const parts = []; let last = 0, i;
    while ((i = piece.indexOf(sep, last + 1)) !== -1) { parts.push({ start: start + last, end: start + i }); last = i; }
    parts.push({ start: start + last, end });
    if (parts.length === 1) return recursive(t, start, end, size, rest);
    const small = [];
    parts.forEach(p => { if (p.end - p.start > size) small.push(...recursive(t, p.start, p.end, size, rest)); else small.push(p); });
    return pack(small, size);
  }
  function addOverlap(chunks, t, ov) {
    if (!ov) return chunks;
    return chunks.map((c, i) => i === 0 ? c : { start: Math.max(chunks[i - 1].start, c.start - Math.round((c.end - c.start) * ov)), end: c.end });
  }
  function chunkText(t, strategy, size, ov) {
    let ch;
    if (strategy === 'fijo') return splitFixed(t, size, ov);
    if (strategy === 'frases') ch = pack(units(t, /[.!?»:](?=\s)|\n+/g), size);
    else if (strategy === 'recursiva') ch = recursive(t, 0, t.length, size, ['\n## ', '\n\n', '\n', '. ', ' ']);
    else { // estructura: una sección por título y, si no cabe, recursiva dentro
      const heads = []; const re = /^#{1,3} .*/gm; let m; while ((m = re.exec(t))) heads.push(m.index);
      if (!heads.length || heads[0] > 0) heads.unshift(0);
      ch = [];
      heads.forEach((h, i) => { const e = i + 1 < heads.length ? heads[i + 1] : t.length; ch.push(...recursive(t, h, e, size, ['\n\n', '\n', '. ', ' '])); });
    }
    return addOverlap(ch.filter(c => t.slice(c.start, c.end).trim()), t, ov);
  }
  function headingPath(t, pos) {
    const before = t.slice(0, pos + 1);
    const h1 = [...before.matchAll(/^# (.*)$/gm)].pop(), h2 = [...before.matchAll(/^## (.*)$/gm)].pop();
    return [h1 && h1[1], h2 && h2[1]].filter(Boolean).join(' › ');
  }
  function warnings(t, c, inherit) {
    const w = [], text = t.slice(c.start, c.end);
    const prev = t[c.start - 1];
    if (c.start > 0 && prev && !/[\n.:»]/.test(prev) && !/^\s/.test(text)) w.push('empieza a mitad de frase');
    const lines = text.split('\n');
    const tableLines = lines.filter(l => /^\|/.test(l.trim()));
    if (tableLines.length) {
      const allTable = t.split('\n').filter(l => /^\|/.test(l.trim())).length;
      const hasHeader = /\|\s*-{2,}/.test(text);
      if (tableLines.length < allTable && !hasHeader) w.push('trozo de tabla sin encabezado');
    }
    if (/\b(excepto|salvo|no se aplica|tampoco)\b/i.test(text.slice(0, 80)) && c.start > 0) w.push('empieza por una excepción: ¿viaja con su regla?');
    if (!inherit && !/^#/m.test(text)) w.push('sin título: puede quedar huérfano');
    return w;
  }
  function lexScore(q, text) {
    const stop = new Set(['para', 'como', 'cuanto', 'cuánto', 'que', 'con', 'los', 'las', 'del', 'una', 'por', 'sin', 'mas', 'más', 'esta', 'este', 'antes']);
    const qs = [...new Set(norm(q).split(/[^a-z0-9ñ]+/).filter(x => x.length > 3 && !stop.has(x)))];
    const tx = norm(text);
    const hits = qs.filter(x => tx.includes(x.slice(0, Math.max(4, x.length - 2))));
    return { score: hits.length / Math.sqrt(Math.max(1, text.length / 300)), hits };
  }

  function viewTroceado(root) {
    const samples = sampleTexts();
    root.innerHTML = `
      <section class="card lab-controls">
        <label>Documento <select data-k="doc">${samples.map((s, i) => `<option value="${i}">${esc(s[0])}</option>`).join('')}</select></label>
        <label>Estrategia <select data-k="strategy"><option value="fijo">Tamaño fijo</option><option value="frases">Por frases</option><option value="recursiva">Recursiva</option><option value="estructura" selected>Por estructura (títulos)</option></select></label>
        <label>Tamaño máximo <input type="range" min="120" max="1400" step="20" value="520" data-k="size"> <b data-out="size">520</b> caracteres</label>
        <label>Solapamiento <input type="range" min="0" max="40" step="5" value="10" data-k="ov"> <b data-out="ov">10</b> %</label>
        <label class="lab-check"><input type="checkbox" data-k="inherit" checked> Heredar la ruta de títulos</label>
      </section>
      <div class="lab-split">
        <section class="card">
          <div class="lab-split__head"><h2 class="lab-h">El documento, troceado</h2><span class="lab-stats" aria-live="polite"></span></div>
          <textarea class="lab-text" data-k="text" rows="6" aria-label="Texto del documento" hidden></textarea>
          <div class="lab-doc" aria-label="Documento con los fragmentos coloreados"></div>
          <p class="lab-small">Cada color es un fragmento. Las zonas rayadas son solapamiento: aparecen en dos fragmentos.</p>
        </section>
        <section class="card">
          <h2 class="lab-h">Pregunta de prueba</h2>
          <form class="lab-search" data-act="ask"><input type="search" value="Cancelo con 20 días un viaje del 10 de agosto, ¿cuánto me devolvéis?" aria-label="Pregunta de prueba"><button class="btn small primary">Recuperar</button></form>
          <p class="lab-small">Búsqueda por palabras clave simplificada: puntúa cada fragmento por las palabras de la pregunta que contiene.</p>
          <ol class="lab-top" aria-live="polite"></ol>
          <h2 class="lab-h lab-h--mt">Fragmentos</h2>
          <ol class="lab-chunks"></ol>
        </section>
      </div>`;

    const $ = s => root.querySelector(s);
    const st = { doc: 0, strategy: 'estructura', size: 520, ov: 0.1, inherit: true, text: samples[0][1], q: $('[data-act="ask"] input').value };
    const ta = $('[data-k="text"]');

    function render() {
      const t = st.text || '';
      const chunks = chunkText(t, st.strategy, st.size, st.ov);
      // documento coloreado por cobertura
      const cover = new Array(t.length).fill(null).map(() => []);
      chunks.forEach((c, i) => { for (let k = c.start; k < c.end; k++) cover[k].push(i); });
      let html = '', k = 0;
      while (k < t.length) {
        const key = cover[k].join(','); let e = k + 1;
        while (e < t.length && cover[e].join(',') === key) e++;
        const ids = cover[k];
        const col = ids.length ? CHUNK_COLORS[ids[ids.length - 1] % CHUNK_COLORS.length] : 'transparent';
        const cls = ids.length > 1 ? 'ov' : '';
        const col2 = ids.length > 1 ? CHUNK_COLORS[ids[0] % CHUNK_COLORS.length] : col;
        html += `<span class="${cls}" style="--c:${col};--c2:${col2}" data-chunk="${ids[ids.length - 1] ?? ''}">${esc(t.slice(k, e))}</span>`;
        k = e;
      }
      $('.lab-doc').innerHTML = html || '<p class="hint">Pega un texto para trocearlo.</p>';
      const avg = chunks.length ? Math.round(chunks.reduce((a, c) => a + c.end - c.start, 0) / chunks.length) : 0;
      const warnCount = chunks.reduce((a, c) => a + warnings(t, c, st.inherit).length, 0);
      $('.lab-stats').innerHTML = `<b>${chunks.length}</b> fragmentos · media <b>${avg}</b> caracteres · <b class="${warnCount ? 'is-warn' : ''}">${warnCount}</b> avisos`;
      // lista de fragmentos
      $('.lab-chunks').innerHTML = chunks.map((c, i) => {
        const w = warnings(t, c, st.inherit), path = headingPath(t, c.start);
        return `<li style="--c:${CHUNK_COLORS[i % CHUNK_COLORS.length]}" data-chunk="${i}"><header><b>Fragmento ${i + 1}</b><span>${c.end - c.start} car.</span></header>
          ${st.inherit && path ? `<p class="lab-path">${esc(path)}</p>` : ''}
          <p class="lab-snip">${esc(t.slice(c.start, c.end).trim().slice(0, 180))}${c.end - c.start > 180 ? '…' : ''}</p>
          ${w.length ? `<ul class="lab-warns">${w.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</li>`;
      }).join('');
      // recuperación
      const scored = chunks.map((c, i) => { const body = (st.inherit ? headingPath(t, c.start) + ' ' : '') + t.slice(c.start, c.end); return Object.assign({ i }, lexScore(st.q, body)); }).filter(s => s.hits.length).sort((a, b) => b.score - a.score).slice(0, 3);
      $('.lab-top').innerHTML = scored.length ? scored.map((s, r) => `<li><span class="lab-rank">${r + 1}</span><button type="button" data-goto-chunk="${s.i}" style="--c:${CHUNK_COLORS[s.i % CHUNK_COLORS.length]}">Fragmento ${s.i + 1}</button><span class="lab-hits">${s.hits.map(esc).join(' · ')}</span></li>`).join('')
        + `<li class="lab-tip">¿Está entre los tres la regla <b>y</b> su excepción? Prueba con «Por estructura» y con «Tamaño fijo» de 200: el resultado cambia.</li>`
        : '<li class="hint">Ningún fragmento contiene palabras de la pregunta.</li>';
    }
    root.addEventListener('input', e => {
      const k = e.target.dataset.k; if (!k) return;
      if (k === 'size') { st.size = +e.target.value; $('[data-out="size"]').textContent = st.size; }
      if (k === 'ov') { st.ov = +e.target.value / 100; $('[data-out="ov"]').textContent = e.target.value; }
      if (k === 'text') st.text = e.target.value;
      render();
    });
    root.addEventListener('change', e => {
      const k = e.target.dataset.k; if (!k) return;
      if (k === 'strategy') st.strategy = e.target.value;
      if (k === 'inherit') st.inherit = e.target.checked;
      if (k === 'doc') { st.doc = +e.target.value; const s = samples[st.doc]; ta.hidden = s[1] !== ''; st.text = s[1] || ta.value; }
      render();
    });
    $('[data-act="ask"]').addEventListener('submit', e => { e.preventDefault(); st.q = e.target.querySelector('input').value; render(); });
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-goto-chunk]'); if (!b) return;
      const el = root.querySelector(`.lab-chunks [data-chunk="${b.dataset.gotoChunk}"]`);
      if (el) { el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' }); el.classList.remove('is-flash'); void el.offsetWidth; el.classList.add('is-flash'); }
    });
    render();
    return () => {};
  }

  /* =====================================================================
     3 · POR DENTRO DEL MODELO
     ===================================================================== */
  const SUFFIXES = ['ciones', 'ción', 'mente', 'iendo', 'ando', 'ados', 'adas', 'ado', 'ada', 'idad', 'aciones', 'ería', 'ista'];
  function tokenize(text) {
    const out = [];
    (text.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+|[^\sA-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]/g) || []).forEach((w, i, arr) => {
      const space = i > 0;
      if (w.length >= 8) {
        const suf = SUFFIXES.find(s => w.toLowerCase().endsWith(s) && w.length - s.length >= 3);
        if (suf) { out.push({ t: w.slice(0, w.length - suf.length), space }); out.push({ t: suf, space: false, piece: true }); return; }
        if (w.length >= 11) { const m = Math.ceil(w.length / 2); out.push({ t: w.slice(0, m), space }); out.push({ t: w.slice(m), space: false, piece: true }); return; }
      }
      out.push({ t: w, space: space && /\w/.test(w) });
    });
    return out.map(tk => Object.assign(tk, { id: hash(tk.t.toLowerCase()) % 50000 }));
  }
  /* Relaciones que hacen que un token «atienda» a otro (ilustrativas) */
  const RELATED = [['política', 'cancelaciones', 'cancela'], ['devolver', 'importe', 'dinero', 'reembolso'], ['gato', 'duerme', 'sofá'], ['fuentes', 'respuesta', 'contienen', 'decir', 'asistente'], ['días', 'plazo', 'antes'], ['temporada', 'alta', 'agosto']];
  const related = (a, b) => { const x = norm(a), y = norm(b); if (x.length > 3 && (x.startsWith(y.slice(0, 4)) || y.startsWith(x.slice(0, 4)))) return 1; return RELATED.some(g => g.some(w => norm(w).startsWith(x.slice(0, 5))) && g.some(w => norm(w).startsWith(y.slice(0, 5)))) ? 1 : 0; };
  function attention(toks, i) {
    const raw = toks.map((t, j) => {
      if (j > i) return -Infinity;
      let s = -0.35 * (i - j);
      if (j === 0) s += 0.8;                        // el primer token recibe atención extra (efecto conocido)
      if (j !== i && related(toks[i].t, t.t)) s += 2.2;
      if (/^[.,;:¿?¡!«»]$/.test(t.t)) s -= 1.2;
      if (j === i) s += 0.6;
      return s;
    });
    const m = Math.max(...raw), ex = raw.map(v => v === -Infinity ? 0 : Math.exp(v - m)), sum = ex.reduce((a, b) => a + b, 0);
    return ex.map(v => v / sum);
  }
  const PRESETS = [
    'La política de cancelaciones permite devolver el',
    'Si las fuentes no contienen la respuesta, el asistente debe decir',
    'El gato duerme en el',
    'Con 20 días de antelación en temporada alta se devuelve el'
  ];
  const NEXT = {
    'devolver el': [['importe', 0.31], ['dinero', 0.27], ['100', 0.12], ['70', 0.09], ['billete', 0.06], ['viaje', 0.05], ['gato', 0.004]],
    'debe decir': [['que', 0.36], ['«no', 0.21], ['la', 0.12], ['algo', 0.09], ['siempre', 0.06], ['sí', 0.03]],
    'en el': [['sofá', 0.38], ['sillón', 0.17], ['suelo', 0.14], ['jardín', 0.08], ['coche', 0.04], ['avión', 0.01]],
    'devuelve el': [['50', 0.29], ['70', 0.24], ['importe', 0.18], ['dinero', 0.11], ['100', 0.07]],
    'el importe': [['total', 0.34], ['íntegro', 0.18], ['del', 0.17], ['.', 0.12], ['sin', 0.08]],
    'el dinero': [['en', 0.28], ['.', 0.22], ['al', 0.16], ['del', 0.12], ['íntegro', 0.07]],
    'decir que': [['no', 0.42], ['las', 0.14], ['consta', 0.11], ['la', 0.1], ['sí', 0.05]],
    'que no': [['consta', 0.46], ['lo', 0.16], ['hay', 0.12], ['sabe', 0.09], ['puede', 0.05]],
    'el sofá': [['.', 0.41], ['del', 0.17], ['de', 0.14], ['mientras', 0.09], ['y', 0.08]],
    '*': [['.', 0.18], ['de', 0.15], ['y', 0.12], ['la', 0.1], ['el', 0.09], ['en', 0.08], ['que', 0.07]]
  };
  function nextDist(text) {
    const words = text.trim().split(/\s+/).map(w => w.toLowerCase());
    const key2 = words.slice(-2).join(' ');
    return NEXT[key2] || NEXT[words.slice(-1)[0]] || NEXT['*'];
  }
  function withTemp(dist, T) {
    const logits = dist.map(([w, p]) => [w, Math.log(p)]);
    const m = Math.max(...logits.map(x => x[1] / T)), ex = logits.map(([w, l]) => [w, Math.exp(l / T - m)]), s = ex.reduce((a, x) => a + x[1], 0);
    return ex.map(([w, v]) => [w, v / s]);
  }

  function viewModelo(root) {
    root.innerHTML = `
      <section class="card">
        <form class="lab-search" data-act="text"><input type="text" value="${esc(PRESETS[0])}" aria-label="Frase de entrada"><button class="btn small primary">Analizar</button></form>
        <p class="lab-chips">${PRESETS.map(p => `<button type="button" class="chip-btn" data-preset="${esc(p)}">${esc(p)}…</button>`).join('')}</p>
      </section>
      <ol class="lab-steps">
        <li class="card"><h2 class="lab-h"><span class="lab-num">1</span>Tokens</h2><p class="lab-small">El texto se parte en trozos (palabras o partes de palabra). Cada uno tiene un número de identificación.</p><div class="lab-tokens" data-k="tokens"></div></li>
        <li class="card"><h2 class="lab-h"><span class="lab-num">2</span>Embeddings de cada token</h2><p class="lab-small">Cada token se convierte en un vector. Aquí ves 16 de sus números como barras; un modelo real usa miles.</p><div class="lab-vecs" data-k="vecs"></div></li>
        <li class="card"><h2 class="lab-h"><span class="lab-num">3</span>Atención</h2><p class="lab-small">Pulsa un token: las líneas muestran a qué tokens anteriores «mira» para entender el contexto. Solo puede mirar hacia atrás.</p><canvas class="lab-attn" aria-label="Pesos de atención entre tokens"></canvas><p class="lab-attn-info" aria-live="polite"></p></li>
        <li class="card"><h2 class="lab-h"><span class="lab-num">4</span>Siguiente token</h2>
          <div class="lab-next-tools"><label>Temperatura <input type="range" min="0.1" max="2" step="0.1" value="1" data-k="temp"> <b data-out="temp">1,0</b></label><button type="button" class="btn small primary" data-act="gen">Generar el siguiente</button><button type="button" class="btn small" data-act="undo">Deshacer</button></div>
          <ol class="lab-probs" aria-live="polite"></ol>
          <p class="lab-tip lab-temp-tip"></p></li>
      </ol>`;

    const $ = s => root.querySelector(s);
    const st = { text: PRESETS[0], sel: null, T: 1, history: [], alive: true };
    const cv = $('.lab-attn');
    let toks = [];

    function vecBars(tk) { const s = hash(tk.t.toLowerCase()); return Array.from({ length: 16 }, (_, i) => rnd(s * 7 + i) * 2 - 1); }
    function renderTokens() {
      toks = tokenize(st.text);
      if (st.sel == null || st.sel >= toks.length) st.sel = toks.length - 1;
      $('[data-k="tokens"]').innerHTML = toks.map((t, i) => `<button type="button" class="tok ${t.piece ? 'is-piece' : ''} ${i === st.sel ? 'is-sel' : ''}" data-tok="${i}" style="--c:${CHUNK_COLORS[i % CHUNK_COLORS.length]}"><span>${esc(t.t)}</span><small>${t.id}</small></button>`).join('')
        + `<p class="lab-small">${toks.length} tokens para ${st.text.trim().split(/\s+/).length} palabras.</p>`;
      $('[data-k="vecs"]').innerHTML = toks.map((t, i) => `<div class="vec ${i === st.sel ? 'is-sel' : ''}"><span>${esc(t.t)}</span><i>${vecBars(t).map(v => `<b class="${v < 0 ? 'neg' : ''}" style="--a:${Math.abs(v).toFixed(2)}"></b>`).join('')}</i></div>`).join('');
      drawAttention(); renderNext();
    }
    function drawAttention() {
      const H = 210; const { ctx, w } = fitCanvas(cv, H);
      ctx.fillStyle = '#0f1528'; ctx.fillRect(0, 0, w, H);
      if (!toks.length) return;
      const gap = w / toks.length, y = H - 34;
      const xs = toks.map((_, i) => gap * i + gap / 2);
      const att = attention(toks, st.sel);
      att.forEach((a, j) => {
        if (j === st.sel || a < 0.01) return;
        const x1 = xs[st.sel], x2 = xs[j], mid = (x1 + x2) / 2, hgt = Math.min(H - 60, Math.abs(x1 - x2) * 0.55 + 20);
        ctx.strokeStyle = `rgba(247,207,90,${0.15 + a * 0.85})`; ctx.lineWidth = 1 + a * 10;
        ctx.beginPath(); ctx.moveTo(x1, y - 8); ctx.quadraticCurveTo(mid, y - 8 - hgt, x2, y - 8); ctx.stroke();
      });
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      toks.forEach((t, i) => {
        const a = att[i] || 0;
        ctx.fillStyle = i === st.sel ? '#f7cf5a' : `rgba(238,241,248,${0.45 + a * 0.55})`;
        ctx.font = `${i === st.sel ? 700 : 600} ${clamp(gap / 4.2, 9, 14)}px "Atkinson Hyperlegible", Arial, sans-serif`;
        ctx.fillText(t.t, xs[i], y);
        if (i < st.sel && a >= 0.01) { ctx.fillStyle = '#6fdc9f'; ctx.font = '600 10px "JetBrains Mono", monospace'; ctx.fillText(Math.round(a * 100) + '%', xs[i], y + 16); }
      });
      const top = att.map((a, j) => [a, j]).filter(([, j]) => j !== st.sel).sort((a, b) => b[0] - a[0])[0];
      $('.lab-attn-info').innerHTML = top ? `«<b>${esc(toks[st.sel].t)}</b>» mira sobre todo a «<b>${esc(toks[top[1]].t)}</b>» (${Math.round(top[0] * 100)} %).` : '';
    }
    function renderNext() {
      const dist = withTemp(nextDist(st.text), st.T).sort((a, b) => b[1] - a[1]);
      $('.lab-probs').innerHTML = dist.map(([w, p], i) => `<li class="${i === 0 ? 'is-top' : ''}"><span class="lab-w">${esc(w)}</span><span class="lab-bar"><span style="width:${(p * 100).toFixed(1)}%"></span></span><b>${(p * 100).toFixed(1).replace('.', ',')} %</b></li>`).join('');
      $('.lab-temp-tip').textContent = st.T < 0.5 ? 'Temperatura baja: casi siempre elige la opción más probable. Respuestas estables y repetitivas.' : st.T > 1.4 ? 'Temperatura alta: las opciones raras ganan peso. Más variedad… y más riesgo de disparates.' : 'Temperatura media: suele elegir lo más probable, pero no siempre.';
    }
    function sample() {
      const dist = withTemp(nextDist(st.text), st.T); let r = Math.random(), w = dist[0][0];
      for (const [x, p] of dist) { if ((r -= p) <= 0) { w = x; break; } }
      st.history.push(st.text);
      st.text = st.text + (/^[.,;:]$/.test(w) ? '' : ' ') + w;
      $('[data-act="text"] input').value = st.text; st.sel = null; renderTokens();
    }
    $('[data-act="text"]').addEventListener('submit', e => { e.preventDefault(); st.text = e.target.querySelector('input').value; st.history = []; st.sel = null; renderTokens(); });
    root.addEventListener('click', e => {
      const p = e.target.closest('[data-preset]'); if (p) { st.text = p.dataset.preset; st.history = []; $('[data-act="text"] input').value = st.text; st.sel = null; renderTokens(); }
      const t = e.target.closest('[data-tok]'); if (t) { st.sel = +t.dataset.tok; renderTokens(); }
      if (e.target.closest('[data-act="gen"]')) sample();
      if (e.target.closest('[data-act="undo"]') && st.history.length) { st.text = st.history.pop(); $('[data-act="text"] input').value = st.text; st.sel = null; renderTokens(); }
    });
    $('[data-k="temp"]').addEventListener('input', e => { st.T = +e.target.value; $('[data-out="temp"]').textContent = st.T.toFixed(1).replace('.', ','); renderNext(); });
    const onResize = () => drawAttention();
    window.addEventListener('resize', onResize);
    renderTokens();
    return () => window.removeEventListener('resize', onResize);
  }

  /* ===================================================================== */
  const LABS = {
    espacio: {
      title: 'Explorador del espacio de embeddings', kicker: 'Embeddings', back: 'embeddings', view: viewEspacio,
      idea: 'Cada palabra o frase es un punto. Lo que significa algo parecido queda cerca. Gira el espacio, elige un punto y mira sus vecinos, o escribe una frase y observa dónde cae.',
      note: 'Mapa didáctico: las coordenadas están preparadas a mano para enseñar el concepto (grupos de significado, negaciones, otro idioma) y la cercanía se mide por distancia en este mapa de 3 dimensiones. Un modelo real usa cientos o miles de dimensiones, aprende las posiciones de millones de textos y suele comparar con la similitud coseno.'
    },
    troceado: {
      title: 'Troceado en vivo', kicker: 'Chunking', back: 'chunking', view: viewTroceado,
      idea: 'Elige un documento del caso, una estrategia y un tamaño, y mira dónde caen los cortes, qué se solapa y qué avisos aparecen. Después lanza una pregunta y comprueba qué fragmentos se recuperarían.',
      note: 'La recuperación de este laboratorio es por palabras clave y simplificada, para que se vea el efecto del troceado. Un sistema real usa embeddings, búsqueda híbrida y reordenación.'
    },
    modelo: {
      title: 'Por dentro del modelo', kicker: 'Tokens y atención', back: 'problema-fuentes', view: viewModelo,
      idea: 'Escribe una frase y sigue su recorrido: se parte en tokens, cada token se convierte en un vector, la atención relaciona unos tokens con otros y, al final, el modelo reparte probabilidades entre las posibles palabras siguientes.',
      note: 'Modelo de juguete: los tokens, la atención y las probabilidades son ilustrativos y están preparados para enseñar el mecanismo; no salen de un modelo real.'
    }
  };

  /** Laboratorio recomendado para cada concepto */
  const FOR_CONCEPT = { embeddings: 'espacio', vectorial: 'espacio', chunking: 'troceado', 'problema-fuentes': 'modelo', 'contexto-aumentado': 'modelo' };

  /* Monta cada laboratorio la primera vez que se ve su diapositiva (necesita medidas reales) */
  const mounted = new Set();
  function mountVisible() {
    document.querySelectorAll('[data-lab]').forEach((host) => {
      const id = host.dataset.lab;
      if (mounted.has(host) || !LABS[id]) return;
      if (!host.closest('.slide.is-active') && !document.documentElement.classList.contains('is-reflow')) return;
      if (!host.clientWidth) return;
      mounted.add(host);
      LABS[id].view(host);
    });
  }
  new MutationObserver(mountVisible).observe(document.getElementById('slides') || document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
  window.addEventListener('load', mountVisible);
  setTimeout(mountVisible, 600);
})();
