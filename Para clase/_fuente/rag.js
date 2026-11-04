/* ══════════════════════════════════════════
   RAG y Gemini Notebook · comportamiento propio
   Se carga ANTES de casos.js: crea las diapositivas de los conceptos
   para que casos.js las cuente al arrancar.
   1. Utilidades
   2. Diapositivas de conceptos
   3. Reproductor de viñetas pixel art (motor de Sibou Lab)
   4. Explicación completa (lector)
   5. Caso: pestañas, notas, documentos y preguntas
   6. Método: fases, veredictos, pesos y lista de entrega
   7. Descargas
   ══════════════════════════════════════════ */

(() => {
  'use strict';

  /* ═════════ 1. Utilidades ═════════ */

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (id) => `<svg class="ic" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const md = (t) => (window.PL && PL.md ? PL.md.render(t) : `<p>${esc(t)}</p>`);
  const mdi = (t) => (window.PL && PL.md ? PL.md.inline(t) : esc(t));
  const EASE = 'cubic-bezier(.16, 1, .3, 1)';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const DATA = window.RAG_DATA || {};
  const CASO = (window.PL && PL.practicas && PL.practicas.b4) || null;
  const conceptById = (id) => ((window.PL && PL.concepts) || []).find((c) => c.id === id);

  /* Misma entrada suave que usa casos.js al cambiar de contenido */
  function swap(node) {
    if (!node || reduceMotion.matches) return;
    node.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: EASE });
  }

  /* Lista de selección única, igual que los exploradores de casos.js (↑ ↓ para moverse) */
  function buildCaseList(host, entries, onSelect) {
    const buttons = entries.map(([id, c], i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'case';
      b.innerHTML = `<span class="case__dot" aria-hidden="true"></span><span><b>${esc(c.label)}</b>${c.short ? `<span>${esc(c.short)}</span>` : ''}</span>`;
      b.setAttribute('role', 'radio');
      b.dataset.case = id;
      b.tabIndex = i === 0 ? 0 : -1;
      host.append(b);
      return b;
    });
    const select = (b, focus, first) => {
      buttons.forEach((x) => { const on = x === b; x.setAttribute('aria-checked', String(on)); x.tabIndex = on ? 0 : -1; });
      if (focus) b.focus();
      onSelect(b.dataset.case, first);
    };
    buttons.forEach((b, i) => {
      b.addEventListener('click', () => select(b, false));
      b.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        e.preventDefault();
        select(buttons[(i + (e.key === 'ArrowDown' ? 1 : buttons.length - 1)) % buttons.length], true);
      });
    });
    if (buttons[0]) select(buttons[0], false, true);
  }

  async function copyText(text, btn) {
    try { await navigator.clipboard.writeText(text); }
    catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.append(ta); ta.select();
      try { document.execCommand('copy'); } catch (__) { /* sin portapapeles */ }
      ta.remove();
    }
    if (!btn) return;
    const old = btn.innerHTML;
    btn.classList.add('is-done');
    btn.innerHTML = `${icon('tick')}Copiado`;
    setTimeout(() => { btn.classList.remove('is-done'); btn.innerHTML = old; }, 1500);
  }

  function download(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* sin almacenamiento */ } }
  };

  /* ═════════ 2. Diapositivas de conceptos ═════════ */

  (() => {
    const tpl = $('#tpl-conceptos');
    if (!tpl || !DATA.conceptos) return;
    const total = DATA.conceptos.length;
    const html = DATA.conceptos.map((k) => {
      const c = conceptById(k.concept);
      const nPanels = c ? c.panels.length : 0;
      return `<section class="slide slide--module" id="${k.slide}" data-step="${k.slide}" data-who="c1" data-section="Explicación · ${esc(k.n)}. ${esc(k.title)}" aria-label="Concepto ${k.n}: ${esc(k.title)}">
        <div class="module module--concept">
          <div class="module__text">
            <p class="concept-n">Concepto ${k.n} de ${total}</p>
            <h2 class="module__title">${esc(k.title)}</h2>
            <ul class="chips">${k.chips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
            <p class="module__claim">${esc(k.claim)}</p>
            <h3 class="module__label">Lo esencial</h3>
            <ol class="how">${k.how.map((t) => `<li>${t}</li>`).join('')}</ol>
            <dl class="deps">${k.deps.map(([ic, dt, dd]) => `<div><dt>${icon(ic)}${esc(dt)}</dt><dd>${esc(dd)}</dd></div>`).join('')}</dl>
            ${c ? `<button type="button" class="btn concept-more" data-reader="${esc(k.concept)}">${icon('book')}Leer la explicación completa</button>` : ''}
          </div>
          <div class="viewer viewer--px">
            <div class="px" data-px="concept:${esc(k.concept)}" aria-label="${nPanels} viñetas animadas"></div>
          </div>
        </div>
      </section>`;
    }).join('');
    const holder = document.createElement('div');
    holder.innerHTML = html;
    tpl.replaceWith(...holder.children);
  })();

  /* ═════════ 3. Reproductor de viñetas pixel art ═════════
     Usa PL.renderPanel (sibou/engine.js). Solo anima mientras la
     diapositiva está a la vista. */

  const players = [];

  function stepMs(text, speed) { return (2600 + String(text).length * 42) * speed; }

  function mountPlayer(host, panels, opts = {}) {
    if (!host || !panels || !panels.length || !window.PL || !PL.renderPanel) return;
    host.innerHTML = `
      <div class="px__bar">
        <span class="px__title"><span class="px__kicker"></span><b class="px__name"></b></span>
        <span class="px__panels" role="tablist" aria-label="Viñetas">${panels.map((p, i) => `<button type="button" class="px__panel" role="tab" data-panel="${i}" title="${esc(p.title)}">${i + 1}</button>`).join('')}</span>
      </div>
      <div class="px__stage" tabindex="0" aria-label="Viñeta. Con el foco aquí, las flechas avanzan los pasos y Esc vuelve a las diapositivas.">
        <canvas width="1440" height="810" role="img" aria-label="Viñeta animada en pixel art. La narración de cada paso aparece debajo."></canvas>
        <button type="button" class="px__hit px__hit--prev" data-act="prev" aria-label="Paso anterior"></button>
        <button type="button" class="px__hit px__hit--next" data-act="next" aria-label="Paso siguiente"></button>
      </div>
      <div class="px__foot">
        <div class="px__narr">
          <p class="px__meta"><span class="px__count"></span><span class="px__dots"></span><span class="px__timer" hidden><i></i></span></p>
          <p class="px__text" aria-live="polite"></p>
        </div>
        <div class="px__ctrl">
          <button type="button" class="icon-btn" data-act="prev" aria-label="Paso anterior" title="Paso anterior">${icon('prev')}</button>
          <button type="button" class="btn btn--primary px__play" data-act="play"></button>
          <button type="button" class="icon-btn" data-act="next" aria-label="Paso siguiente" title="Paso siguiente">${icon('next')}</button>
        </div>
      </div>
      <p class="px__caption"></p>`;

    const cv = $('canvas', host);
    const ctx = cv.getContext('2d');
    const st = { panel: 0, step: 0, t0: performance.now(), playing: false, nextAt: 0, visible: false, seen: new Set() };
    const timer = $('.px__timer', host), timerBar = $('.px__timer i', host);
    const steps = () => panels[st.panel].steps || [''];

    function ui() {
      const p = panels[st.panel], s = steps();
      $('.px__kicker', host).textContent = `Viñeta ${st.panel + 1} de ${panels.length}`;
      $('.px__name', host).textContent = p.title;
      $('.px__caption', host).textContent = p.caption || '';
      $('.px__count', host).textContent = `Paso ${st.step + 1} de ${s.length}`;
      $('.px__text', host).textContent = s[st.step];
      $('.px__dots', host).innerHTML = s.map((_, i) => `<button type="button" class="${i === st.step ? 'on' : i < st.step ? 'past' : ''}" data-step="${i}" aria-label="Ir al paso ${i + 1}"></button>`).join('');
      if (st.step === s.length - 1) st.seen.add(st.panel);
      $$('.px__panel', host).forEach((b, i) => { b.setAttribute('aria-selected', String(i === st.panel)); b.classList.toggle('is-seen', st.seen.has(i)); });
      $('.px__play', host).innerHTML = st.playing ? `${icon('pause')}Pausa` : `${icon('play')}Reproducir`;
      timer.hidden = !st.playing;
    }
    function set(panel, step) {
      st.panel = Math.max(0, Math.min(panels.length - 1, panel));
      st.step = Math.max(0, Math.min(steps().length - 1, step));
      st.t0 = performance.now();
      st.nextAt = st.t0 + stepMs(steps()[st.step], 1);
      ui();
    }
    function next() {
      if (st.step < steps().length - 1) return set(st.panel, st.step + 1);
      if (st.panel < panels.length - 1) return set(st.panel + 1, 0);
      st.playing = false; ui();
    }
    function prev() {
      if (st.step > 0) return set(st.panel, st.step - 1);
      if (st.panel > 0) set(st.panel - 1, (panels[st.panel - 1].steps || ['']).length - 1);
    }
    function frame(now) {
      if (st.visible && !document.hidden) {
        if (st.playing && now >= st.nextAt) next();
        if (st.playing) { const total = stepMs(steps()[st.step], 1); timerBar.style.transform = `scaleX(${Math.min(1, Math.max(0, 1 - (st.nextAt - now) / total)).toFixed(3)})`; }
        PL.renderPanel(ctx, panels[st.panel], st.step, Math.min(1, (now - st.t0) / 750), now / 1000);
      }
      requestAnimationFrame(frame);
    }

    host.addEventListener('click', (e) => {
      const t = e.target.closest('[data-act],[data-step],[data-panel]');
      if (!t) return;
      if (t.dataset.step != null) return set(st.panel, Number(t.dataset.step));
      if (t.dataset.panel != null) return set(Number(t.dataset.panel), 0);
      if (t.dataset.act === 'next') next();
      if (t.dataset.act === 'prev') prev();
      if (t.dataset.act === 'play') { st.playing = !st.playing; st.nextAt = performance.now() + stepMs(steps()[st.step], 1); ui(); }
    });

    /* Con el foco en el visor, las flechas avanzan los pasos (no las diapositivas) */
    host.addEventListener('keydown', (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const onBtn = e.target.tagName === 'BUTTON';
      if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); prev(); }
      else if ((e.key === ' ' || e.key === 'Enter') && !onBtn) { e.preventDefault(); e.stopPropagation(); st.playing = !st.playing; st.nextAt = performance.now() + stepMs(steps()[st.step], 1); ui(); }
      else if (e.key === 'Escape') { e.stopPropagation(); document.activeElement.blur(); }
    });

    const io = new IntersectionObserver((list) => {
      list.forEach((en) => {
        const was = st.visible;
        st.visible = en.isIntersecting && !!en.target.closest('.slide.is-active, html.is-reflow .slide');
        if (st.visible && !was && opts.autoplay !== false && !st.started) { st.started = true; set(0, 0); }
        if (!st.visible) { st.playing = false; ui(); }
      });
    }, { threshold: 0.2 });
    io.observe(cv);

    set(0, 0);
    players.push({ host, set, st, io });
    requestAnimationFrame(frame);
  }

  /* Las diapositivas cambian de clase al navegar: vuelve a medir la visibilidad */
  new MutationObserver(() => {
    players.forEach((p) => {
      const on = !!p.host.closest('.slide.is-active') || document.documentElement.classList.contains('is-reflow');
      const shown = on && !p.host.closest('[hidden]');
      if (shown !== p.st.visible) { p.st.visible = shown; if (!shown) p.st.playing = false; }
    });
  }).observe(document.getElementById('slides') || document.body, { subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });

  $$('[data-px]').forEach((host) => {
    const key = host.dataset.px;
    if (key.startsWith('concept:')) { const c = conceptById(key.slice(8)); if (c) mountPlayer(host, c.panels); }
    if (key === 'caso' && CASO) mountPlayer(host, CASO.panels);
  });

  /* ═════════ 4. Explicación completa ═════════ */

  (() => {
    const box = $('#reader');
    if (!box) return;
    const title = $('#reader-title');
    const body = $('#reader-body');
    let lastFocus = null;

    function open(id) {
      const c = conceptById(id);
      if (!c) return;
      lastFocus = document.activeElement;
      title.textContent = c.title;
      const list = (h, items, fn) => (items && items.length ? `<h3>${h}</h3>${fn(items)}` : '');
      body.innerHTML = `<p class="reader__idea">${mdi(c.idea)}</p>`
        + c.explain.map(md).join('')
        + list('Ejemplos', c.examples, (xs) => `<ul class="reader__ex">${xs.map((e) => `<li><b>${mdi(e[0])}</b> ${mdi(e[1])}</li>`).join('')}</ul>`)
        + list('Errores frecuentes', c.mistakes, (xs) => `<ul>${xs.map((m) => `<li>${mdi(m)}</li>`).join('')}</ul>`)
        + list('Vocabulario', c.terms, (xs) => `<dl class="reader__terms">${xs.map((t) => `<div><dt>${mdi(t[0])}</dt><dd>${mdi(t[1])}</dd></div>`).join('')}</dl>`)
        + list('Para profundizar', (PL.sources || {})[c.id], (xs) => `<ul class="reader__src">${xs.map((x) => `<li><a href="${esc(x[1])}" target="_blank" rel="noopener">${esc(x[0])}</a>${x[2] ? `<span>${mdi(x[2])}</span>` : ''}</li>`).join('')}</ul>`);
      /* Sin internet no hay Mermaid: se enseña el diagrama como texto */
      $$('.mermaid', body).forEach((m) => { const pre = document.createElement('pre'); pre.textContent = m.textContent; m.replaceWith(pre); });
      box.hidden = false;
      body.scrollTop = 0;
      $('#reader-close').focus();
      if (!reduceMotion.matches) $('.reader__panel', box).animate([{ opacity: 0, transform: 'translateY(10px) scale(.99)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: EASE });
    }
    function close() { box.hidden = true; if (lastFocus) lastFocus.focus(); }

    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-reader]');
      if (t) open(t.dataset.reader);
    });
    $('#reader-close').addEventListener('click', close);
    window.addEventListener('hashchange', () => { if (!box.hidden) close(); });
    box.addEventListener('click', (e) => { if (e.target === box) close(); });
    /* Mientras está abierto, las flechas no cambian de diapositiva */
    document.addEventListener('keydown', (e) => {
      if (box.hidden) return;
      e.stopImmediatePropagation();
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        const f = $$('button, a[href]', box);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    }, true);
  })();

  /* ═════════ 5. Caso ═════════ */

  /* Pestañas «Lo que contó Marta» / «En viñetas» */
  $$('[data-rag-tabs]').forEach((tabs) => {
    const btns = $$('[data-pane]', tabs);
    const select = (b) => {
      btns.forEach((x) => { const on = x === b; x.setAttribute('aria-selected', String(on)); const p = document.getElementById(x.dataset.pane); if (p) p.hidden = !on; });
      swap(document.getElementById(b.dataset.pane));
    };
    btns.forEach((b) => b.addEventListener('click', () => select(b)));
  });

  /* Notas de la reunión */
  (() => {
    const ul = $('[data-rag-notas]');
    if (ul && DATA.notas) ul.innerHTML = DATA.notas.map((n) => `<li>${esc(n)}</li>`).join('');
  })();

  /* Documentos: lista, vista y acciones */
  (() => {
    const list = $('[data-rag-docs]');
    const view = $('#doc-view');
    const title = $('#doc-title span');
    if (!list || !view || !CASO) return;
    let cur = null;

    /* Markdown sencillo de los documentos: títulos, tablas, listas y párrafos */
    function render(text) {
      const out = [];
      const lines = text.replace(/\r/g, '').split('\n');
      let i = 0;
      const inl = (s) => esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
      while (i < lines.length) {
        const l = lines[i];
        if (/^#\s/.test(l)) { out.push(`<h1>${inl(l.slice(2))}</h1>`); i++; continue; }
        if (/^##\s/.test(l)) { out.push(`<h2>${inl(l.slice(3))}</h2>`); i++; continue; }
        if (/^\|/.test(l)) {
          const rows = [];
          while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i]); i++; }
          const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
          const body = rows.filter((r) => !/^\|\s*-/.test(r));
          out.push(`<div class="doc__table"><table><thead><tr>${cells(body[0]).map((c) => `<th>${inl(c)}</th>`).join('')}</tr></thead><tbody>${body.slice(1).map((r) => `<tr>${cells(r).map((c) => `<td>${inl(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
          continue;
        }
        if (/^-\s/.test(l)) {
          const items = [];
          while (i < lines.length && /^-\s/.test(lines[i])) { items.push(lines[i].slice(2)); i++; }
          out.push(`<ul>${items.map((t) => `<li>${inl(t)}</li>`).join('')}</ul>`);
          continue;
        }
        if (l.trim() === '') { i++; continue; }
        const par = [];
        while (i < lines.length && lines[i].trim() !== '' && !/^(#|\||-\s)/.test(lines[i])) { par.push(lines[i]); i++; }
        out.push(`<p>${par.map(inl).join('<br>')}</p>`);
      }
      return out.join('');
    }

    buildCaseList(list, CASO.docs.map((d, i) => [String(i), { label: d.title, short: `${d.file}` }]), (id, first) => {
      cur = CASO.docs[Number(id)];
      title.textContent = cur.file;
      view.innerHTML = render(cur.text);
      view.parentElement.scrollTop = 0;
      if (!first) { swap(view); swap(title); }
    });

    $$('[data-doc-act]').forEach((b) => b.addEventListener('click', () => {
      if (!cur) return;
      if (b.dataset.docAct === 'dl') download(cur.file, cur.text);
      else copyText(cur.text, b);
    }));
  })();

  /* Preguntas: anotar respuesta, citas y veredicto (se guarda en este navegador) */
  const Q_KEY = 'rag-b4-respuestas';
  const VERDICTS = ['', 'Respalda', 'Respalda en parte', 'No respalda', 'Contradice', 'Desactualizada', 'Sin cita'];
  (() => {
    const list = $('[data-rag-preguntas]');
    const view = $('#q-view');
    const title = $('#q-title span');
    if (!list || !view || !CASO) return;
    const saved = store.get(Q_KEY, {});

    buildCaseList(list, CASO.preguntas.map((p) => [String(p.n), { label: `P${p.n} · ${p.q.length > 30 ? p.q.slice(0, 28).trim() + '…' : p.q}` }]), (id, first) => {
      const p = CASO.preguntas.find((x) => String(x.n) === id);
      const a = saved[id] || {};
      title.textContent = `Pregunta ${p.n} de ${CASO.preguntas.length}`;
      view.innerHTML = `<p class="qform__q">${esc(p.q)}</p>
        <button type="button" class="btn rag-btn qform__copy" data-copy-q="${id}">${icon('copy')}Copiar la pregunta</button>
        <label class="qform__f"><span>Qué respondió la herramienta</span><textarea data-k="resp" rows="3" placeholder="Copia aquí la respuesta tal cual.">${esc(a.resp || '')}</textarea></label>
        <label class="qform__f"><span>Qué fuentes citó (documento y apartado)</span><textarea data-k="citas" rows="2" placeholder="[1] Política … §… · [2] …">${esc(a.citas || '')}</textarea></label>
        <div class="qform__row">
          <label class="qform__f"><span>Veredicto de la cita principal</span><select data-k="ver">${VERDICTS.map((v) => `<option value="${esc(v)}" ${a.ver === v ? 'selected' : ''}>${v ? esc(v) : 'Elige…'}</option>`).join('')}</select></label>
          <label class="qform__f"><span>¿La respuesta es correcta?</span><select data-k="ok">${['', 'Sí', 'No', 'En parte'].map((v) => `<option value="${v}" ${a.ok === v ? 'selected' : ''}>${v || 'Elige…'}</option>`).join('')}</select></label>
        </div>
        <label class="qform__f"><span>Por qué (S·R·C y A·F·V) y, si falla, la respuesta correcta con su cita</span><textarea data-k="porque" rows="3">${esc(a.porque || '')}</textarea></label>`;
      $$('[data-k]', view).forEach((f) => f.addEventListener('input', () => {
        saved[id] = Object.assign(saved[id] || {}, { [f.dataset.k]: f.value });
        store.set(Q_KEY, saved);
        const btn = list.querySelector(`[data-case="${id}"]`);
        if (btn) btn.classList.toggle('is-filled', Object.values(saved[id]).some(Boolean));
      }));
      $('[data-copy-q]', view).addEventListener('click', (e) => copyText(p.q, e.currentTarget));
      if (!first) swap(view);
    });
    CASO.preguntas.forEach((p) => {
      const b = list.querySelector(`[data-case="${p.n}"]`);
      if (b && saved[p.n] && Object.values(saved[p.n]).some(Boolean)) b.classList.add('is-filled');
    });
  })();

  /* ═════════ 6. Método ═════════ */

  /* Fases del caso, con las mismas pestañas que «Cómo vamos a trabajar» */
  (() => {
    const host = $('[data-rag-fases]');
    const detail = $('#fase-detail');
    if (!host || !detail || !CASO) return;
    const fases = CASO.fases;
    const tabs = fases.map((f, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mstep';
      b.setAttribute('role', 'tab');
      b.id = `fase-${i}`;
      b.setAttribute('aria-controls', 'fase-detail');
      b.innerHTML = `<span class="mstep__n">${f.n}</span><span class="mstep__txt"><b>${esc(f.titulo)}</b><span>${f.min} minutos</span></span>`;
      host.append(b);
      return b;
    });
    const select = (i, focus, first) => {
      const f = fases[i];
      tabs.forEach((t, j) => { t.setAttribute('aria-selected', String(i === j)); t.tabIndex = i === j ? 0 : -1; t.classList.toggle('is-past', j < i); });
      detail.setAttribute('aria-labelledby', tabs[i].id);
      detail.innerHTML = `<div class="fase__what"><h3>${icon('target')}Qué hacéis</h3>${md(f.texto)}</div>`
        + `<div><h3>${icon('file')}Qué entregáis</h3><p>${mdi(f.entrega)}</p></div>`
        + `<div><h3>${icon('clock')}Tiempo</h3><p>${f.min} minutos${f.n === 3 ? '. Es la fase central: no la recortéis. Después, descanso de 10 minutos.' : '.'}</p></div>`;
      if (focus) tabs[i].focus();
      if (!first) swap(detail);
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i, false));
      t.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        if (!t.matches(':focus-visible')) return;
        e.preventDefault(); e.stopPropagation();
        select((i + (e.key === 'ArrowRight' ? 1 : fases.length - 1)) % fases.length, true);
      });
    });
    select(0, false, true);
  })();

  /* Veredictos con un ejemplo cada uno */
  (() => {
    const list = $('[data-rag-verificar]');
    const view = $('#v-view');
    const title = $('#v-title span');
    const data = DATA.verificar;
    if (!list || !view || !data) return;
    const row = ([k, v, tone]) => `<li class="vrow vrow--${tone}"><span class="vrow__k">${esc(k)}</span><span class="vrow__v">${esc(v)}</span>${icon(tone === 'ok' ? 'tick' : tone === 'ko' ? 'close' : 'warn')}</li>`;
    buildCaseList(list, Object.entries(data), (id, first) => {
      const v = data[id];
      title.textContent = v.label;
      view.innerHTML = `<div class="verify__claim"><span>Afirmación de la respuesta</span><p>${esc(v.claim)}</p></div>
        <div class="verify__cite"><span>Cita abierta</span><p>${esc(v.cite)}</p></div>
        <div class="verify__cols">
          <div><h4>S·R·C · la cita frente a la afirmación</h4><ul class="vlist">${v.src.map(row).join('')}</ul></div>
          <div><h4>A·F·V · la fuente</h4><ul class="vlist">${v.afv.map(row).join('')}</ul></div>
        </div>
        <p class="verify__why verify__why--${v.tone}"><b>${esc(v.label)}.</b> ${esc(v.why)}</p>`;
      if (!first) { swap(view); swap(title); }
    });
  })();

  /* Pesos y lista de entrega (casos.js convierte después la lista en casillas) */
  (() => {
    const bar = $('[data-rag-pesos-bar]');
    const ol = $('[data-rag-pesos]');
    const todo = $('[data-rag-check]');
    if (bar && ol && DATA.pesos) {
      bar.innerHTML = DATA.pesos.map((p, i) => `<span class="w${i + 1}" style="--w: ${p[1]}"></span>`).join('');
      ol.innerHTML = DATA.pesos.map((p, i) => `<li class="w${i + 1}"><b>${esc(p[0])}</b><em>${p[1]} %</em><span>${esc(p[2])}</span></li>`).join('');
    }
    if (todo && DATA.checklist) todo.innerHTML = DATA.checklist.map((t) => `<li>${esc(t)}</li>`).join('');
  })();

  /* ═════════ 7. Descargas ═════════ */

  const plantilla = (withAnswers) => CASO.plantilla(withAnswers ? store.get(Q_KEY, {}) : {});
  /* Piezas compartidas con la solución del docente (Solo docente/…/solucion.js) */
  window.RAG = { $, $$, esc, icon, md, mdi, swap, buildCaseList, mountPlayer, copyText, download };

  $$('[data-rag-dl]').forEach((b) => b.addEventListener('click', () => {
    if (!CASO) return;
    if (b.dataset.ragDl === 'respuestas') download('entrega-viajes-lunaria.md', plantilla(true));
    else download('plantilla-entrega-viajes-lunaria.md', plantilla(false));
  }));
})();
