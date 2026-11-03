/* ══════════════════════════════════════════
   Casos prácticos · comportamiento
   1. Lienzo 16:9 escalado y modo estrecho
   2. Navegación entre diapositivas
   3. Raíl de cada bloque
   4. Diagramas interactivos (zoom, desplazamiento, resaltado)
   5. Paneles y vista ampliada
   6. Portada: dos líneas de trabajo
   7. Exploradores: método, ficheros, normas, gastos,
      esquema, especificación, tecnologías y entrega
   ══════════════════════════════════════════ */

(() => {
  'use strict';

  const STEPS = window.CP_STEPS || [];
  const WHO = window.CP_WHO || {};
  const DIAGRAMS = window.CP_DIAGRAMS || {};
  const DATA = window.CP_DATA || {};

  const TAGS = {
    manual: 'Manual',
    dolor: 'Punto de dolor',
    auto: 'Automático',
    ia: 'IA',
    humano: 'Decide una persona',
    pendiente: 'Por validar'
  };

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const EASE = 'cubic-bezier(.16, 1, .3, 1)';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const icon = (id) => `<svg class="ic" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function iconButton(iconId, label, extraClass = '') {
    const b = el('button', `icon-btn ${extraClass}`.trim(), icon(iconId));
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.title = label;
    return b;
  }

  /* Cambio de contenido con un leve desenfoque: une el estado anterior y el nuevo */
  function swap(node) {
    node.classList.remove('is-swapping');
    void node.offsetWidth;
    node.classList.add('is-swapping');
  }

  const stage = $('#stage');
  const slides = $$('.slide');
  const sectionLabel = $('#section-label');
  const counter = $('#slide-counter');
  const progressFill = $('#progress-fill');
  const prevBtn = $('#slide-prev');
  const nextBtn = $('#slide-next');
  const rail = $('#rail');
  const railTrack = $('#rail-track');
  const railMarker = $('#rail-marker');

  /* ═════════ 1. Lienzo ═════════ */

  function isReflow() { return document.documentElement.classList.contains('is-reflow'); }

  function fitStage() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const reflow = w < 820 || (w < 1100 && h > w * 1.1);
    document.documentElement.classList.toggle('is-reflow', reflow);
    if (reflow) {
      stage.style.removeProperty('--k');
    } else {
      stage.style.setProperty('--k', Math.min(w / 1600, h / 900).toFixed(4));
    }
  }
  fitStage();
  window.addEventListener('resize', fitStage);

  /* ═════════ 2. Diapositivas ═════════ */

  let current = -1;
  let running = [];

  function slideIndexById(id) { return slides.findIndex((s) => s.id === id); }

  function show(index, options = {}) {
    index = clamp(index, 0, slides.length - 1);
    if (index === current) return;
    const prev = slides[current];
    const next = slides[index];
    const dir = index > current ? 1 : -1;

    running.forEach((a) => a.finish());
    running = [];
    slides.forEach((s) => s.classList.remove('is-leaving'));

    stage.dataset.tone = next.dataset.tone || 'light';
    sectionLabel.textContent = next.dataset.section || '';

    slides.forEach((s) => {
      const active = s === next;
      s.inert = !active;
      s.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    next.classList.add('is-active');

    const animate = !options.instant && prev && !isReflow();
    if (prev) {
      prev.classList.remove('is-active');
      if (animate) {
        prev.classList.add('is-leaving');
        const out = prev.animate(
          reduceMotion.matches
            ? [{ opacity: 1 }, { opacity: 0 }]
            : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dir * 18}px)` }],
          { duration: reduceMotion.matches ? 160 : 240, easing: 'cubic-bezier(.4, 0, 1, 1)' }
        );
        out.onfinish = () => prev.classList.remove('is-leaving');
        running.push(out);
      }
    }
    if (animate) {
      running.push(next.animate(
        reduceMotion.matches
          ? [{ opacity: 0 }, { opacity: 1 }]
          : [
              { opacity: 0, transform: `translateX(${dir * 30}px)`, filter: 'blur(5px)' },
              { opacity: 1, transform: 'none', filter: 'blur(0)' }
            ],
        { duration: reduceMotion.matches ? 220 : 560, easing: EASE, delay: reduceMotion.matches ? 0 : 60, fill: 'backwards' }
      ));
    }

    current = index;
    const total = slides.length;
    counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
    progressFill.style.setProperty('--p', ((index + 1) / total).toFixed(4));
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === total - 1;

    if (!options.keepHash) {
      try { history.replaceState(null, '', `#${next.id}`); } catch (_) { /* file:// puede restringirlo */ }
    }

    updateRail(next, !animate);
    onSlideShown(next);
    if (isReflow()) window.scrollTo(0, 0);
  }

  function go(delta) { show(current + delta); }
  function goToId(id) {
    const i = slideIndexById(id);
    if (i >= 0) show(i);
  }

  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-goto]');
    if (!target || target.closest('.dg')) return;
    event.preventDefault();
    goToId(target.dataset.goto);
  });

  function toggleFullscreen() {
    const doc = document;
    if (doc.fullscreenElement) { doc.exitFullscreen?.(); return; }
    doc.documentElement.requestFullscreen?.().catch(() => {});
  }
  $('#btn-fullscreen').addEventListener('click', toggleFullscreen);

  function handleDeckKey(key, event) {
    if (lightbox.isOpen()) {
      if (key === 'Escape') lightbox.close();
      return;
    }
    switch (key) {
      case 'ArrowRight': case 'PageDown': case ' ':
        event?.preventDefault(); go(1); break;
      case 'ArrowLeft': case 'PageUp':
        event?.preventDefault(); go(-1); break;
      case 'Home': show(0); break;
      case 'End': show(slides.length - 1); break;
      case 'f': case 'F': toggleFullscreen(); break;
      default:
    }
  }

  document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const t = event.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (event.key === 'Tab' && lightbox.isOpen()) { lightbox.trap(event); return; }
    if (t && t.getAttribute && t.getAttribute('role') === 'tab' && /^Arrow(Left|Right)$/.test(event.key) && t.matches(':focus-visible')) return;
    if (event.key === ' ' && t && t.tagName === 'BUTTON') return;
    handleDeckKey(event.key, event);
  });

  /* Gestos táctiles: deslizar para cambiar de diapositiva (fuera de los visores) */
  let touchStart = null;
  $('#slides').addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1 || e.target.closest('.viewer')) { touchStart = null; return; }
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  $('#slides').addEventListener('touchend', (e) => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
    touchStart = null;
  });

  /* ═════════ 3. Raíl de cada bloque ═════════
     Se despliegan los pasos del bloque actual; los demás muestran solo su nombre. */

  const railSteps = new Map();
  const railSegs = new Map();
  Object.keys(WHO).forEach((who) => {
    const own = STEPS.filter((s) => s.who === who);
    if (!own.length) return;
    const seg = el('div', 'rail__seg');
    seg.dataset.who = who;
    const name = el('button', 'rail__who', esc(WHO[who].name));
    name.type = 'button';
    name.dataset.goto = own[0].slide;
    name.setAttribute('aria-label', `${WHO[who].name}: ir al inicio`);
    const list = el('ol', 'rail__steps');
    own.forEach((step) => {
      const li = el('li', 'rail__step');
      const btn = el('button', 'rail__btn', `<span class="rail__dot"></span><span>${esc(step.label)}</span>`);
      btn.type = 'button';
      btn.dataset.goto = step.slide;
      btn.setAttribute('aria-label', `${WHO[who].name}: ${step.label}`);
      li.append(btn);
      list.append(li);
      railSteps.set(step.id, li);
    });
    seg.append(name, list);
    railTrack.append(seg);
    railSegs.set(who, seg);
  });

  function updateRail(slide, instant) {
    const step = STEPS.find((s) => s.id === slide.dataset.step);
    rail.classList.toggle('is-visible', Boolean(step));
    if (!step) return;
    rail.dataset.who = step.who;
    const at = STEPS.indexOf(step);
    STEPS.forEach((s, i) => {
      const li = railSteps.get(s.id);
      li.classList.toggle('is-current', s.id === step.id);
      li.classList.toggle('is-done', s.who === step.who && i < at);
      const btn = li.firstElementChild;
      if (s.id === step.id) btn.setAttribute('aria-current', 'step'); else btn.removeAttribute('aria-current');
    });
    const segChanged = !railSegs.get(step.who).classList.contains('is-current');
    railSegs.forEach((seg, who) => seg.classList.toggle('is-current', who === step.who));

    const li = railSteps.get(step.id);
    const list = li.parentElement;
    const x = railTrack.offsetLeft + list.offsetLeft + li.offsetLeft + li.offsetWidth / 2;
    const jump = instant || segChanged || !railMarker.dataset.placed;
    if (jump) railMarker.style.transition = 'none';
    railMarker.style.setProperty('--x', `${x}px`);
    railMarker.dataset.placed = '1';
    if (jump) {
      void railMarker.offsetWidth;
      railMarker.style.transition = '';
    }
  }

  /* ═════════ 4. Diagramas interactivos ═════════ */

  let diagramCount = 0;

  function roundedPath(points, radius = 10) {
    const pts = [];
    points.forEach((p) => {
      const last = pts[pts.length - 1];
      if (!last || Math.abs(last[0] - p[0]) > .5 || Math.abs(last[1] - p[1]) > .5) pts.push(p);
    });
    const clean = pts.filter((p, i) => {
      if (i === 0 || i === pts.length - 1) return true;
      const a = pts[i - 1]; const b = pts[i + 1];
      return !((Math.abs(a[0] - p[0]) < .5 && Math.abs(p[0] - b[0]) < .5) || (Math.abs(a[1] - p[1]) < .5 && Math.abs(p[1] - b[1]) < .5));
    });
    let d = `M${clean[0][0]},${clean[0][1]}`;
    for (let i = 1; i < clean.length - 1; i++) {
      const [px, py] = clean[i - 1]; const [cx, cy] = clean[i]; const [nx, ny] = clean[i + 1];
      const d1 = Math.hypot(cx - px, cy - py); const d2 = Math.hypot(nx - cx, ny - cy);
      const r = Math.min(radius, d1 / 2, d2 / 2);
      const ax = cx - ((cx - px) / d1) * r; const ay = cy - ((cy - py) / d1) * r;
      const bx = cx + ((nx - cx) / d2) * r; const by = cy + ((ny - cy) / d2) * r;
      d += ` L${ax},${ay} Q${cx},${cy} ${bx},${by}`;
    }
    const end = clean[clean.length - 1];
    d += ` L${end[0]},${end[1]}`;
    return { d, points: clean };
  }

  function nodeContent(n) {
    let html = '';
    if (n.t) html += `<span class="dg-node__t">${esc(n.t)}</span>`;
    if (n.d) html += `<span class="dg-node__d">${esc(n.d)}</span>`;
    if (n.items) {
      html += `<ul class="dg-node__items">${n.items.map((it) =>
        `<li><span class="dg-node__t">${esc(it.t)}</span>${it.m ? `<span class="dg-node__m">${esc(it.m)}</span>` : ''}</li>`).join('')}</ul>`;
    }
    if (n.m) html += `<span class="dg-node__m">${esc(n.m)}</span>`;
    if (n.tag && TAGS[n.tag]) html += `<span class="dg-tag dg-tag--${n.tag}">${TAGS[n.tag]}</span>`;
    return html;
  }

  function sideOf(node, side) {
    switch (side) {
      case 'r': return { x: node.x + node.w, y: node.y + node.h / 2 };
      case 'l': return { x: node.x, y: node.y + node.h / 2 };
      case 't': return { x: node.x + node.w / 2, y: node.y };
      default: return { x: node.x + node.w / 2, y: node.y + node.h };
    }
  }

  function autoSides(a, b) {
    if (b.x >= a.x + a.w + 8) return ['r', 'l'];
    if (b.x + b.w <= a.x - 8) return ['l', 'r'];
    if (b.y >= a.y + a.h + 8) return ['b', 't'];
    return ['t', 'b'];
  }

  /**
   * Dibuja un diagrama dentro de `host` y devuelve su API.
   * `options.onNavigate(id)` se llama al pulsar un nodo con destino.
   */
  function renderDiagram(spec, host, options = {}) {
    const uid = `dg${++diagramCount}`;
    const root = el('div', `dg dg--${spec.layout || 'manual'}`);
    const gLayer = el('div', 'dg-groups');
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.classList.add('dg-edges');
    const nLayer = el('div', 'dg-nodes');
    root.append(gLayer, svg, nLayer);
    host.append(root);

    svg.innerHTML = `<defs>
      <marker id="${uid}-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0,0.5 L10,5 L0,9.5 z" fill="#8a96a8"/></marker>
      <marker id="${uid}-al" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0,0.5 L10,5 L0,9.5 z" fill="#4472c4"/></marker>
    </defs>`;

    const nodeW = spec.nodeW || 204;
    const groups = new Map((spec.groups || []).map((g) => [g.id, { ...g, nodes: [] }]));
    const nodes = new Map();

    /* Grupos */
    groups.forEach((g) => {
      g.el = el('div', `dg-group dg-group--${g.kind || 'input'}`);
      g.head = el('div', 'dg-group__head',
        `<div class="dg-group__t">${esc(g.t || '')}</div>${g.d ? `<div class="dg-group__d">${esc(g.d)}</div>` : ''}`);
      g.el.append(g.head);
      gLayer.append(g.el);
    });

    /* Nodos */
    (spec.nodes || []).forEach((src) => {
      const n = { ...src };
      const group = groups.get(n.g);
      const navigable = Boolean(n.goto && options.onNavigate);
      n.el = el(navigable ? 'button' : 'div', 'dg-node', nodeContent(n));
      if (navigable) {
        n.el.type = 'button';
        n.el.classList.add('dg-node--link');
        n.el.setAttribute('aria-label', `${n.t}. Ir a su diapositiva`);
      } else if (options.interactive) {
        n.el.tabIndex = 0;
      }
      if (group && group.kind === 'module') n.el.classList.add('dg-node--core');
      if (n.start) n.el.classList.add('dg-node--start');
      if (n.legacy) n.el.classList.add('dg-node--legacy');
      if (n.tag === 'dolor') n.el.classList.add('dg-node--dolor');
      n.el.style.width = `${n.w || nodeW}px`;
      nLayer.append(n.el);
      nodes.set(n.id, n);
      if (group) group.nodes.push(n);
    });

    /* Medidas reales (dependen de la tipografía) */
    nodes.forEach((n) => { n.w = n.el.offsetWidth; n.h = n.el.offsetHeight; });

    const PAD_X = 18; const PAD_T = 16; const PAD_B = 18;

    function measureHead(g, width) {
      g.el.style.width = `${width}px`;
      g.headH = g.head.offsetHeight;
      return g.headH;
    }

    if (spec.layout === 'columns') {
      const GAP_X = spec.gapX || 62;
      const GAP_Y = 22;
      const GROUP_GAP = 30;
      const cols = new Map();
      nodes.forEach((n) => {
        if (!cols.has(n.col)) cols.set(n.col, []);
        cols.get(n.col).push(n);
        n.x = n.col * (nodeW + GAP_X) + (nodeW - n.w) / 2;
      });
      groups.forEach((g) => {
        if (!g.nodes.length) return;
        const left = Math.min(...g.nodes.map((n) => n.col)) * (nodeW + GAP_X);
        const right = (Math.max(...g.nodes.map((n) => n.col)) + 1) * (nodeW + GAP_X) - GAP_X;
        g.x = left - PAD_X; g.w = right - left + PAD_X * 2;
        measureHead(g, g.w);
      });
      cols.forEach((list) => {
        let y = 0;
        list.forEach((n, i) => {
          if (i > 0) {
            const prev = list[i - 1];
            y += prev.g === n.g ? GAP_Y : PAD_B + GROUP_GAP + (groups.get(n.g)?.headH || 0) + PAD_T;
          }
          n.y = y;
          y += n.h;
        });
        const offset = -y / 2;
        list.forEach((n) => { n.y += offset; });
      });
    } else {
      nodes.forEach((n) => { n.y = n.cy - n.h / 2; });
      groups.forEach((g) => {
        if (!g.nodes.length) return;
        const left = Math.min(...g.nodes.map((n) => n.x));
        const right = Math.max(...g.nodes.map((n) => n.x + n.w));
        g.x = left - PAD_X; g.w = right - left + PAD_X * 2;
        measureHead(g, g.w);
      });
    }

    groups.forEach((g) => {
      if (!g.nodes.length) return;
      g.y = Math.min(...g.nodes.map((n) => n.y)) - PAD_T - g.headH;
      g.h = Math.max(...g.nodes.map((n) => n.y + n.h)) + PAD_B - g.y;
    });

    if (spec.layout === 'columns') {
      /* Grupos que ocupan solas sus columnas: misma altura para leer como una banda */
      const alone = [];
      groups.forEach((g) => {
        if (!g.nodes.length) return;
        const colsOf = new Set(g.nodes.map((n) => n.col));
        const shared = Array.from(nodes.values()).some((n) => colsOf.has(n.col) && n.g !== g.id);
        if (!shared) alone.push(g);
      });
      if (alone.length > 1) {
        const top = Math.min(...alone.map((g) => g.y));
        const bottom = Math.max(...alone.map((g) => g.y + g.h));
        alone.forEach((g) => { g.y = top; g.h = bottom - top; });
      }
    }

    /* Aristas: lados y puertos */
    const edges = (spec.edges || []).map((src, i) => {
      const e = { ...src, i, a: nodes.get(src.from), b: nodes.get(src.to) };
      if (!e.a || !e.b) return null;
      if (e.via) {
        const v0 = e.via[0]; const vl = e.via[e.via.length - 1];
        e.fs = e.fs || (v0[1] > e.a.y + e.a.h ? 'b' : v0[1] < e.a.y ? 't' : v0[0] > e.a.x ? 'r' : 'l');
        e.ts = e.ts || (vl[1] < e.b.y ? 't' : vl[1] > e.b.y + e.b.h ? 'b' : vl[0] < e.b.x ? 'l' : 'r');
      } else if (!e.fs || !e.ts) {
        if (e.my !== undefined) [e.fs, e.ts] = e.b.y > e.a.y ? ['b', 't'] : ['t', 'b'];
        else [e.fs, e.ts] = autoSides(e.a, e.b);
      }
      return e;
    }).filter(Boolean);

    const portGroups = new Map();
    const addPort = (node, side, edge, otherNode, end) => {
      const key = `${node.id}:${side}`;
      if (!portGroups.has(key)) portGroups.set(key, []);
      portGroups.get(key).push({ edge, other: otherNode, end });
    };
    edges.forEach((e) => {
      if (!e.via) {
        addPort(e.a, e.fs, e, e.b, 'start');
        addPort(e.b, e.ts, e, e.a, 'end');
      }
    });
    portGroups.forEach((list, key) => {
      const [id, side] = key.split(':');
      const node = nodes.get(id);
      const vertical = side === 'l' || side === 'r';
      list.sort((p, q) => vertical
        ? (p.other.y + p.other.h / 2) - (q.other.y + q.other.h / 2)
        : (p.other.x + p.other.w / 2) - (q.other.x + q.other.w / 2));
      const span = vertical ? node.h : node.w;
      const spread = list.length > 1 ? Math.min(span * 0.62, (list.length - 1) * 16) : 0;
      list.forEach((p, i) => {
        const base = sideOf(node, side);
        const off = list.length > 1 ? -spread / 2 + (spread * i) / (list.length - 1) : 0;
        const pt = vertical ? [base.x, base.y + off] : [base.x + off, base.y];
        p.edge[p.end === 'start' ? 'p0' : 'p1'] = pt;
      });
    });

    const anchorTo = (node, side, toward) => {
      const base = sideOf(node, side);
      if (side === 'l' || side === 'r') return [base.x, clamp(toward[1], node.y + 8, node.y + node.h - 8)];
      return [clamp(toward[0], node.x + 10, node.x + node.w - 10), base.y];
    };

    edges.forEach((e) => {
      let pts;
      if (e.via) {
        const start = anchorTo(e.a, e.fs, e.via[0]);
        const end = anchorTo(e.b, e.ts, e.via[e.via.length - 1]);
        pts = [start, ...e.via, end];
      } else {
        const [sx, sy] = e.p0; const [tx, ty] = e.p1;
        const h = (e.fs === 'r' || e.fs === 'l') && (e.ts === 'l' || e.ts === 'r');
        const v = (e.fs === 'b' || e.fs === 't') && (e.ts === 't' || e.ts === 'b');
        if (h) {
          const mx = e.mx !== undefined ? e.mx : (sx + tx) / 2;
          pts = [[sx, sy], [mx, sy], [mx, ty], [tx, ty]];
        } else if (v) {
          const my = e.my !== undefined ? e.my : (sy + ty) / 2;
          pts = [[sx, sy], [sx, my], [tx, my], [tx, ty]];
        } else if (e.fs === 'b' || e.fs === 't') {
          pts = [[sx, sy], [sx, ty], [tx, ty]];
        } else {
          pts = [[sx, sy], [tx, sy], [tx, ty]];
        }
      }
      const { d, points } = roundedPath(pts);
      e.points = points;
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('class', `dg-edge${e.dashed ? ' dg-edge--dashed' : ''}`);
      path.setAttribute('marker-end', `url(#${uid}-a)`);
      if (e.both) path.setAttribute('marker-start', `url(#${uid}-a)`);
      svg.append(path);
      e.path = path;

      if (e.label) {
        let lp;
        if (Array.isArray(e.labelAt)) {
          lp = e.labelAt;
        } else {
          const segs = [];
          for (let i = 0; i < points.length - 1; i++) {
            const [ax, ay] = points[i]; const [bx, by] = points[i + 1];
            segs.push({ i, len: Math.hypot(bx - ax, by - ay), mid: [(ax + bx) / 2, (ay + by) / 2], a: points[i], b: points[i + 1] });
          }
          if (e.labelAt === 'start') {
            const s = segs.find((sg) => sg.len > 30) || segs[0];
            lp = [s.a[0] + (s.b[0] - s.a[0]) * .5, s.a[1] + (s.b[1] - s.a[1]) * .5];
          } else {
            lp = segs.reduce((best, sg) => (sg.len > best.len ? sg : best), segs[0]).mid;
          }
        }
        e.labelEl = el('div', `dg-label${e.nowrap ? ' dg-label--nowrap' : ''}`, esc(e.label));
        e.labelEl.style.left = `${lp[0]}px`;
        e.labelEl.style.top = `${lp[1]}px`;
        nLayer.append(e.labelEl);
        e.lp = lp;
      }
    });

    /* Encaje del mundo: todo en coordenadas positivas con margen */
    const xs = []; const ys = [];
    nodes.forEach((n) => { xs.push(n.x, n.x + n.w); ys.push(n.y, n.y + n.h); });
    groups.forEach((g) => { if (g.nodes.length) { xs.push(g.x, g.x + g.w); ys.push(g.y, g.y + g.h); } });
    edges.forEach((e) => e.points.forEach(([x, y]) => { xs.push(x); ys.push(y); }));
    const M = 28;
    const minX = Math.min(...xs) - M; const minY = Math.min(...ys) - M;
    const width = Math.max(...xs) + M - minX;
    const height = Math.max(...ys) + M - minY;

    root.style.width = `${width}px`;
    root.style.height = `${height}px`;
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
    nodes.forEach((n) => { n.el.style.transform = `translate(${n.x - minX}px, ${n.y - minY}px)`; });
    groups.forEach((g) => {
      if (!g.nodes.length) { g.el.remove(); return; }
      Object.assign(g.el.style, { left: `${g.x - minX}px`, top: `${g.y - minY}px`, width: `${g.w}px`, height: `${g.h}px` });
    });
    edges.forEach((e) => {
      if (e.labelEl) { e.labelEl.style.left = `${e.lp[0] - minX}px`; e.labelEl.style.top = `${e.lp[1] - minY}px`; }
    });

    /* Resaltado de relaciones */
    function setLit(nodeIds, groupIds = []) {
      const litNodes = new Set(nodeIds);
      root.classList.toggle('is-focus', litNodes.size > 0 || groupIds.length > 0);
      const litEdges = new Set();
      edges.forEach((e) => {
        const lit = nodeIds.length === 1
          ? (e.from === nodeIds[0] || e.to === nodeIds[0])
          : (litNodes.has(e.from) && litNodes.has(e.to));
        if (lit) { litEdges.add(e); litNodes.add(e.from); litNodes.add(e.to); }
      });
      nodes.forEach((n) => {
        n.el.classList.toggle('is-lit', litNodes.has(n.id));
        n.el.classList.toggle('is-source', nodeIds.length === 1 && n.id === nodeIds[0]);
      });
      edges.forEach((e) => {
        const lit = litEdges.has(e);
        e.path.classList.toggle('is-lit', lit);
        e.path.setAttribute('marker-end', `url(#${uid}-${lit ? 'al' : 'a'})`);
        if (e.both) e.path.setAttribute('marker-start', `url(#${uid}-${lit ? 'al' : 'a'})`);
        if (e.labelEl) e.labelEl.classList.toggle('is-lit', lit);
      });
      const litGroups = new Set(groupIds);
      nodes.forEach((n) => { if (litNodes.has(n.id) && n.g) litGroups.add(n.g); });
      groups.forEach((g, id) => g.el.classList.toggle('is-lit', litGroups.has(id)));
      if (litEdges.size) svg.append(...Array.from(litEdges).map((e) => e.path));
    }

    function clearLit() {
      root.classList.remove('is-focus');
      nodes.forEach((n) => n.el.classList.remove('is-lit', 'is-source'));
      groups.forEach((g) => g.el.classList.remove('is-lit'));
      edges.forEach((e) => {
        e.path.classList.remove('is-lit');
        e.path.setAttribute('marker-end', `url(#${uid}-a)`);
        if (e.both) e.path.setAttribute('marker-start', `url(#${uid}-a)`);
        e.labelEl?.classList.remove('is-lit');
      });
    }

    nodes.forEach((n) => {
      const enter = () => { setLit([n.id]); options.onHover?.(n); };
      const leave = () => { clearLit(); };
      n.el.addEventListener('pointerenter', (ev) => { if (ev.pointerType !== 'touch') enter(); });
      n.el.addEventListener('pointerleave', leave);
      n.el.addEventListener('focus', enter);
      n.el.addEventListener('blur', leave);
      n.el.addEventListener('click', (ev) => {
        if (root.dataset.suppressClick === '1') return;
        options.onHover?.(n);
        if (n.goto && options.onNavigate) { ev.stopPropagation(); options.onNavigate(n.goto); }
        else setLit([n.id]);
      });
    });

    /* Entrada: nodos y después trazos, solo la primera vez que se ve */
    let revealed = false;
    function reveal() {
      if (revealed) return;
      revealed = true;
      if (reduceMotion.matches) return;
      const order = Array.from(nodes.values()).sort((p, q) => p.x - q.x);
      const minNodeX = order.length ? order[0].x : 0;
      const maxNodeX = order.length ? order[order.length - 1].x : 1;
      const span = Math.max(1, maxNodeX - minNodeX);
      order.forEach((n) => {
        const delay = ((n.x - minNodeX) / span) * 320;
        n.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380, delay, easing: EASE, fill: 'backwards' });
      });
      groups.forEach((g) => {
        if (!g.nodes.length) return;
        g.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: EASE, fill: 'backwards' });
      });
      edges.forEach((e) => {
        const delay = 220 + ((Math.min(...e.points.map((p) => p[0])) - minNodeX) / span) * 360;
        const markerEnd = e.path.getAttribute('marker-end');
        const markerStart = e.path.getAttribute('marker-start');
        if (e.dashed) {
          e.path.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, delay: delay + 200, fill: 'backwards' });
        } else {
          const len = e.path.getTotalLength();
          e.path.removeAttribute('marker-end');
          if (markerStart) e.path.removeAttribute('marker-start');
          const anim = e.path.animate(
            [{ strokeDasharray: `${len} ${len}`, strokeDashoffset: len }, { strokeDasharray: `${len} ${len}`, strokeDashoffset: 0 }],
            { duration: 620, delay, easing: EASE, fill: 'backwards' });
          anim.onfinish = anim.oncancel = () => {
            if (!e.path.getAttribute('marker-end')) e.path.setAttribute('marker-end', markerEnd);
            if (markerStart && !e.path.getAttribute('marker-start')) e.path.setAttribute('marker-start', markerStart);
          };
        }
        e.labelEl?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: delay + 360, fill: 'backwards' });
      });
    }

    function highlightGroup(groupId) {
      if (!groupId) { clearLit(); return; }
      const ids = Array.from(nodes.values()).filter((n) => n.g === groupId).map((n) => n.id);
      setLit(ids, [groupId]);
    }

    return { root, width, height, nodes, reveal, clearLit, highlightGroup };
  }

  /* ═════════ Lienzo con zoom y desplazamiento ═════════ */

  class PanZoom {
    constructor(viewport, content, opts = {}) {
      this.vp = viewport;
      this.content = content;
      this.opts = { min: .15, max: 4, pad: [24, 24, 72, 24], ...opts };
      this.s = 1; this.x = 0; this.y = 0;
      this.w = 1; this.h = 1;
      this.touched = false;
      this.pointers = new Map();
      this.bind();
      this.ro = new ResizeObserver(() => this.onResize());
      this.ro.observe(viewport);
    }

    setSize(w, h) { this.w = w; this.h = h; }

    local(clientX, clientY) {
      const r = this.vp.getBoundingClientRect();
      const k = r.width / (this.vp.clientWidth || 1) || 1;
      return [(clientX - r.left) / k, (clientY - r.top) / k];
    }

    apply() {
      this.content.style.transform = `translate(${this.x}px, ${this.y}px) scale(${this.s})`;
      this.opts.onChange?.(this.s);
    }

    fitState() {
      const vw = this.vp.clientWidth; const vh = this.vp.clientHeight;
      const [pt, pr, pb, pl] = this.opts.pad;
      const s = clamp(Math.min((vw - pl - pr) / this.w, (vh - pt - pb) / this.h), this.opts.min, this.opts.fitMax || 1.25);
      return { s, x: pl + (vw - pl - pr - this.w * s) / 2, y: pt + (vh - pt - pb - this.h * s) / 2 };
    }

    fit(animate = false) {
      if (!this.vp.clientWidth) return;
      this.touched = false;
      this.to(this.fitState(), animate);
    }

    to(target, animate) {
      cancelAnimationFrame(this.raf);
      if (!animate || reduceMotion.matches) {
        Object.assign(this, target);
        this.apply();
        return;
      }
      const from = { s: this.s, x: this.x, y: this.y };
      const t0 = performance.now();
      const dur = 340;
      const step = (now) => {
        const t = clamp((now - t0) / dur, 0, 1);
        const k = 1 - Math.pow(2, -10 * t);
        this.s = from.s + (target.s - from.s) * k;
        this.x = from.x + (target.x - from.x) * k;
        this.y = from.y + (target.y - from.y) * k;
        this.apply();
        if (t < 1) this.raf = requestAnimationFrame(step);
      };
      this.raf = requestAnimationFrame(step);
    }

    zoomAt(factor, px, py, animate = false) {
      const s = clamp(this.s * factor, this.opts.min, this.opts.max);
      const k = s / this.s;
      this.touched = true;
      this.to({ s, x: px - (px - this.x) * k, y: py - (py - this.y) * k }, animate);
    }

    zoomCenter(factor) {
      this.zoomAt(factor, this.vp.clientWidth / 2, this.vp.clientHeight / 2, true);
    }

    actual() {
      this.zoomAt(1 / this.s, this.vp.clientWidth / 2, this.vp.clientHeight / 2, true);
    }

    onResize() {
      if (!this.vp.clientWidth) return;
      if (!this.touched) this.fit(false);
    }

    bind() {
      const vp = this.vp;
      vp.addEventListener('wheel', (e) => {
        e.preventDefault();
        const unit = e.deltaMode === 1 ? 33 : 1;
        if (e.shiftKey && !e.ctrlKey) {
          this.touched = true;
          this.x -= (e.deltaY || e.deltaX) * unit;
          this.apply();
          return;
        }
        const factor = Math.exp(-e.deltaY * unit * (e.ctrlKey ? .01 : .0018));
        const [px, py] = this.local(e.clientX, e.clientY);
        this.zoomAt(factor, px, py);
      }, { passive: false });

      vp.addEventListener('dblclick', (e) => {
        if (e.target.closest('button')) return;
        const [px, py] = this.local(e.clientX, e.clientY);
        this.zoomAt(1.8, px, py, true);
      });

      vp.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || e.target.closest('.pz-tools, .pz-info, .shots__switch')) return;
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (this.pointers.size === 1) {
          this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, ox: this.x, oy: this.y, moved: false };
        } else if (this.pointers.size === 2) {
          const [a, b] = Array.from(this.pointers.values());
          this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: this.s };
          this.drag = null;
        }
      });

      vp.addEventListener('pointermove', (e) => {
        if (!this.pointers.has(e.pointerId)) return;
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (this.pinch && this.pointers.size === 2) {
          const [a, b] = Array.from(this.pointers.values());
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          const [px, py] = this.local((a.x + b.x) / 2, (a.y + b.y) / 2);
          this.zoomAt((this.pinch.s * (d / this.pinch.d)) / this.s, px, py);
          return;
        }
        const drag = this.drag;
        if (!drag || drag.id !== e.pointerId) return;
        const r = vp.getBoundingClientRect();
        const k = r.width / (vp.clientWidth || 1) || 1;
        const dx = (e.clientX - drag.x) / k; const dy = (e.clientY - drag.y) / k;
        if (!drag.moved && Math.hypot(dx, dy) > 4) {
          drag.moved = true;
          this.touched = true;
          vp.classList.add('is-dragging');
          try { vp.setPointerCapture(e.pointerId); } catch (_) { /* noop */ }
          this.content.querySelector('.dg')?.setAttribute('data-suppress-click', '1');
        }
        if (drag.moved) {
          this.x = drag.ox + dx; this.y = drag.oy + dy;
          this.apply();
        }
      });

      const end = (e) => {
        this.pointers.delete(e.pointerId);
        if (this.pointers.size < 2) this.pinch = null;
        if (this.drag && this.drag.id === e.pointerId) {
          if (this.drag.moved) {
            vp.classList.remove('is-dragging');
            const dg = this.content.querySelector('.dg');
            setTimeout(() => dg?.removeAttribute('data-suppress-click'), 0);
          }
          this.drag = null;
        }
      };
      vp.addEventListener('pointerup', end);
      vp.addEventListener('pointercancel', end);

      vp.addEventListener('keydown', (e) => {
        if (e.target !== vp) return;
        if (e.key === '+' || e.key === '=') { e.preventDefault(); this.zoomCenter(1.25); }
        if (e.key === '-' || e.key === '_') { e.preventDefault(); this.zoomCenter(.8); }
        if (e.key === '0') { e.preventDefault(); this.fit(true); }
      });
    }
  }

  function buildTools(pz, onExpand) {
    const tools = el('div', 'pz-tools');
    const out = iconButton('minus', 'Alejar');
    const zoom = el('button', 'pz-tools__zoom', '100%');
    zoom.type = 'button';
    zoom.title = 'Ver a tamaño real (100%)';
    zoom.setAttribute('aria-label', 'Ver a tamaño real');
    const inn = iconButton('plus', 'Acercar');
    const fit = iconButton('fit', 'Ajustar a la vista');
    out.addEventListener('click', () => pz.zoomCenter(.8));
    inn.addEventListener('click', () => pz.zoomCenter(1.25));
    zoom.addEventListener('click', () => pz.actual());
    fit.addEventListener('click', () => pz.fit(true));
    tools.append(out, zoom, inn, el('span', 'pz-tools__sep'), fit);
    if (onExpand) {
      const exp = iconButton('expand', 'Ampliar a pantalla completa');
      exp.addEventListener('click', onExpand);
      tools.append(exp);
    }
    const prevChange = pz.opts.onChange;
    pz.opts.onChange = (s) => { zoom.textContent = `${Math.round(s * 100)}%`; prevChange?.(s); };
    return tools;
  }

  /* Monta un diagrama con su lienzo, herramientas y panel de información */
  function mountDiagram(container, key, title, { expandable = true, inLightbox = false } = {}) {
    const spec = DIAGRAMS[key];
    if (!spec) return null;
    const vp = el('div', 'pz');
    vp.tabIndex = 0;
    vp.setAttribute('role', 'group');
    vp.setAttribute('aria-label', `${title}. Diagrama interactivo: rueda o + y − para el zoom, arrastrar para moverse, 0 para ajustar.`);
    const content = el('div', 'pz__content');
    vp.append(content);
    container.append(vp);

    let info = null;
    const onHover = spec.info ? (n) => {
      if (!info) return;
      info.classList.remove('pz-info--idle');
      info.innerHTML = `<b>${esc(n.t)}</b>${esc(n.desc || n.d || '')}`;
    } : null;

    const dg = renderDiagram(spec, content, {
      interactive: true,
      onNavigate: navigateFromDiagram,
      onHover
    });
    const pz = new PanZoom(vp, content, { pad: spec.info ? [24, 24, 92, 24] : [28, 28, 72, 28], fitMax: inLightbox ? 1.6 : 1.15 });
    pz.setSize(dg.width, dg.height);

    if (spec.info) {
      info = el('div', 'pz-info pz-info--idle', esc(spec.hint || ''));
      info.setAttribute('aria-live', 'polite');
      vp.append(info);
    } else {
      vp.append(el('div', 'pz-hint', 'Rueda: zoom · Arrastrar: mover · Doble clic: acercar'));
    }

    vp.addEventListener('click', (e) => {
      if (e.target === vp || e.target === content) dg.clearLit();
    });

    const tools = buildTools(pz, expandable ? () => openDiagramLightbox(key, title) : null);
    vp.append(tools);
    pz.fit(false);
    return { vp, pz, dg };
  }

  function navigateFromDiagram(id) {
    if (lightbox.isOpen()) lightbox.close();
    goToId(id);
  }

  /* ═════════ 5. Paneles y vista ampliada ═════════ */

  function initPanel(panel) {
    if (panel.dataset.ready === '1') return panel._api;
    if (!panel.dataset.diagram || !panel.clientWidth) return null;
    panel.dataset.ready = '1';
    panel._api = mountDiagram(panel, panel.dataset.diagram, panel.dataset.title || '');
    return panel._api;
  }

  const lightbox = (() => {
    const box = $('#lightbox');
    const title = $('#lightbox-title');
    const body = $('#lightbox-body');
    const closeBtn = $('#lightbox-close');
    let cleanup = null;
    let opener = null;

    function open(heading, build) {
      if (!box.hidden) close();
      opener = document.activeElement;
      title.textContent = heading;
      body.innerHTML = '';
      box.hidden = false;
      box.classList.remove('is-opening');
      void box.offsetWidth;
      box.classList.add('is-opening');
      cleanup = build(body) || null;
      closeBtn.focus();
    }

    function close() {
      if (box.hidden) return;
      cleanup?.();
      cleanup = null;
      body.innerHTML = '';
      box.hidden = true;
      if (opener && document.contains(opener)) opener.focus();
    }

    function trap(event) {
      const focusables = $$('button, [href], [tabindex]:not([tabindex="-1"])', box).filter((n) => !n.hidden && n.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0]; const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }

    closeBtn.addEventListener('click', close);
    return { open, close, trap, isOpen: () => !box.hidden };
  })();

  function openDiagramLightbox(key, title) {
    lightbox.open(title, (body) => {
      const api = mountDiagram(body, key, title, { expandable: false, inLightbox: true });
      requestAnimationFrame(() => api?.pz.fit(false));
      api?.vp.focus({ preventScroll: true });
      return () => api?.pz.ro.disconnect();
    });
  }

  /* ═════════ 6. Portada: dos líneas de trabajo ═════════ */

  /* Cada presentación puede definir sus líneas en window.CP_LANES */
  const LANES = window.CP_LANES || [
    { who: 'c1', stops: ['Cuatro horas cada lunes', 'Esquema', 'Especificación', 'Reporte'] },
    { who: 'c2', stops: ['150 tickets al mes', 'Esquema', 'Especificación', 'Reporte'] }
  ];

  function buildLanes(host) {
    const W = 1472; const H = 196;
    const x0 = 150; const x1 = W - 40;
    let html = '';
    LANES.forEach((lane, li) => {
      const yBase = 26 + li * 96;
      const n = lane.stops.length;
      const stopX = (i) => 210 + (i * (x1 - 120 - 210)) / (n - 1);
      const wave = (x) => yBase + Math.sin((x / W) * Math.PI * 2 + li * 1.4) * 9;
      let d = `M${x0},${wave(x0).toFixed(1)}`;
      for (let x = x0 + 16; x <= x1; x += 16) d += ` L${x},${wave(x).toFixed(1)}`;
      html += `<g class="lane lane--${lane.who}">`
        + `<text class="lane__name" x="0" y="${(wave(x0) + 5).toFixed(1)}">${esc(WHO[lane.who]?.name || '')}</text>`
        + `<path class="lane__base" d="${d}"/><path class="lane__line" d="${d}"/>`
        + lane.stops.map((label, i) => {
          const x = stopX(i); const y = wave(x);
          return `<g class="lane__stop"><circle class="lane__dot${i === 0 ? ' lane__dot--from' : ''}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7"/>`
            + `<text class="lane__label" x="${x.toFixed(1)}" y="${(y + 32).toFixed(1)}" text-anchor="middle">${esc(label)}</text></g>`;
        }).join('')
        + '</g>';
    });
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = html;
    host.append(svg);
    host._played = false;
  }

  function playLanes(host) {
    if (!host || host._played) return;
    host._played = true;
    if (reduceMotion.matches) return;
    $$('.lane', host).forEach((lane, li) => {
      const line = $('.lane__line', lane);
      const len = line.getTotalLength();
      const start = 250 + li * 180;
      line.animate([{ strokeDasharray: `${len} ${len}`, strokeDashoffset: len }, { strokeDasharray: `${len} ${len}`, strokeDashoffset: 0 }],
        { duration: 1400, delay: start, easing: EASE, fill: 'backwards' });
      $('.lane__name', lane).animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: start, easing: EASE, fill: 'backwards' });
      $$('.lane__stop', lane).forEach((g, i, all) => {
        g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, delay: start + 120 + (i / (all.length - 1)) * 1000, easing: EASE, fill: 'backwards' });
      });
    });
  }

  $$('[data-lanes]').forEach(buildLanes);

  /* ═════════ 7. Exploradores ═════════ */

  /* Lista con selección única (role="radio"), flechas ↑ ↓ para moverse */
  function buildCaseList(host, entries, onSelect) {
    const buttons = entries.map(([id, c], i) => {
      const b = el('button', 'case',
        `<span class="case__dot" aria-hidden="true"></span><span><b>${esc(c.label)}</b><span>${esc(c.short)}</span></span>`);
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.dataset.case = id;
      b.tabIndex = i === 0 ? 0 : -1;
      host.append(b);
      return b;
    });
    const select = (b, focus) => {
      buttons.forEach((x) => {
        const on = x === b;
        x.setAttribute('aria-checked', String(on));
        x.tabIndex = on ? 0 : -1;
      });
      if (focus) b.focus();
      onSelect(b.dataset.case);
    };
    buttons.forEach((b, i) => {
      b.addEventListener('click', () => select(b, false));
      b.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        e.preventDefault();
        select(buttons[(i + (e.key === 'ArrowDown' ? 1 : buttons.length - 1)) % buttons.length], true);
      });
    });
    buttons.forEach((x) => x.setAttribute('aria-checked', 'false'));
    buttons[0].setAttribute('aria-checked', 'true');
    onSelect(buttons[0].dataset.case, true);
  }

  /* Método: cuatro pasos con su detalle (pestañas, flechas ← →) */
  (() => {
    const host = $('[data-method]');
    const detail = $('#method-detail');
    const steps = DATA.method;
    if (!host || !detail || !steps) return;

    const tabs = steps.map((s, i) => {
      const b = el('button', 'mstep', `<span class="mstep__n">${s.n}</span><span class="mstep__txt"><b>${esc(s.t)}</b><span>${esc(s.d)}</span></span>`);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.id = `mstep-${i}`;
      b.setAttribute('aria-controls', 'method-detail');
      host.append(b);
      return b;
    });

    const select = (i, focus, first) => {
      const s = steps[i];
      tabs.forEach((t, j) => {
        t.setAttribute('aria-selected', String(i === j));
        t.tabIndex = i === j ? 0 : -1;
        t.classList.toggle('is-past', j < i);
      });
      detail.setAttribute('aria-labelledby', tabs[i].id);
      detail.innerHTML = `<div><h3>${icon('target')}Qué hacéis</h3><p>${esc(s.doing)}</p></div>`
        + `<div><h3>${icon('file')}Qué entregáis</h3><p>${esc(s.out)}</p></div>`
        + `<div class="method__trap"><h3>${icon('warn')}Error típico</h3><p>${esc(s.trap)}</p></div>`;
      if (focus) tabs[i].focus();
      if (!first) swap(detail);
    };

    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i, false));
      t.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        if (!t.matches(':focus-visible')) return;
        e.preventDefault();
        e.stopPropagation();
        select((i + (e.key === 'ArrowRight' ? 1 : steps.length - 1)) % steps.length, true);
      });
    });
    select(0, false, true);
  })();

  /* Caso 1: el fichero de cada tienda, tal y como llega */
  (() => {
    const host = $('#sheet-c1');
    const list = $('[data-cases="ficheros"]');
    const title = $('#file-title span');
    const data = DATA.ficheros;
    if (!host || !list || !data) return;

    const NOTE = { ok: 'check', warn: 'warn', manual: 'clock', question: 'question' };
    const letters = 'ABCDEFGH';
    const isLate = (at) => Number((at.match(/(\d{1,2}):\d{2}/) || [])[1]) >= 12;

    buildCaseList(list, Object.entries(data), (id, first) => {
      const f = data[id];
      const marked = new Set(f.marks.map(([r, c]) => `${r}-${c}`));
      title.textContent = `${f.label} · lo que llega el lunes`;
      host.innerHTML = `<ul class="sheet__files">${f.files.map((file, i) =>
          `<li class="${i < f.files.length - 1 ? 'is-old' : ''}">${icon('file')}<b>${esc(file.name)}</b><span class="${isLate(file.at) ? 'is-late' : ''}">recibido ${esc(file.at)}</span></li>`).join('')}</ul>`
        + '<div class="xl-wrap"><table class="xl">'
        + `<thead><tr><th class="xl__corner" aria-hidden="true"></th>${f.cols.map((_, c) => `<th class="xl__letter" aria-hidden="true">${letters[c]}</th>`).join('')}</tr></thead>`
        + `<tbody><tr class="xl__head"><th class="xl__num" scope="row">1</th>${f.cols.map((c) => `<th scope="col">${esc(c)}</th>`).join('')}</tr>`
        + f.rows.map((row, r) => `<tr><th class="xl__num" scope="row">${r + 2}</th>${row.map((v, c) =>
            `<td class="${marked.has(`${r}-${c}`) ? 'is-mark' : ''}">${v ? esc(v) : ''}</td>`).join('')}</tr>`).join('')
        + '</tbody></table></div>'
        + `<ul class="sheet__notes">${f.notes.map(([kind, text]) => `<li class="note note--${kind}">${icon(NOTE[kind])}<span>${esc(text)}</span></li>`).join('')}</ul>`;
      if (!first) swap(host);
    });
  })();

  /* Caso 2: normas de la política de gastos */
  (() => {
    const host = $('#rules-c2');
    if (!host || !DATA.normas) return;
    host.innerHTML = DATA.normas.map((n) => `<li class="rule" id="rule-${n.n}">`
      + `<p class="rule__top"><span class="rule__n">${esc(n.n)}</span><b>${esc(n.t)}</b></p>`
      + `<p class="rule__text">${esc(n.rule)}</p>`
      + `<p class="rule__how">${icon('user')}<span><b>Hoy:</b> ${esc(n.how)}</span></p></li>`).join('');
  })();

  /* Caso 2: cada gasto, formulario frente a ticket, y qué decidió Javier */
  (() => {
    const host = $('#exp-c2');
    const list = $('[data-cases="gastos"]');
    const title = $('#exp-title');
    const data = DATA.gastos;
    if (!host || !list || !data) return;

    const ruleName = Object.fromEntries((DATA.normas || []).map((n) => [n.n, n.t]));
    const revealed = new Set();
    let currentId = null;

    function verdictHtml(g) {
      const chips = g.rules.length
        ? `<ul class="verdict__rules">${g.rules.map((r) => `<li><b>${esc(r)}</b> ${esc(ruleName[r] || '')}</li>`).join('')}</ul>`
        : '';
      return `<div class="verdict">`
        + `<div class="verdict__top"><span class="verdict__pill verdict__pill--${g.verdict}">${esc(g.verdictText)}</span>${chips}<span class="verdict__time">${icon('clock')}${g.minutes} min de Javier</span></div>`
        + `<p class="verdict__why">${esc(g.why)}</p></div>`;
    }

    function renderVerdict(focus) {
      const g = data[currentId];
      const slot = $('.expense__decision', host);
      if (revealed.has(currentId)) {
        slot.innerHTML = verdictHtml(g);
        if (focus) swap(slot);
      } else {
        slot.innerHTML = `<p class="expense__ask">${icon('question')}<span>¿Lo aprobaríais tal cual, en parte, lo devolveríais o lo rechazaríais?</span></p>`
          + `<button type="button" class="btn btn--primary" data-reveal>${icon('eye')}Ver qué decidió Javier</button>`;
      }
    }

    host.addEventListener('click', (e) => {
      if (!e.target.closest('[data-reveal]') || !currentId) return;
      revealed.add(currentId);
      renderVerdict(true);
      $('.expense__decision', host).focus();
    });

    buildCaseList(list, Object.entries(data), (id, first) => {
      const g = data[id];
      currentId = id;
      title.textContent = `${g.label} · ${g.short}`;
      const t = g.ticket;
      host.innerHTML = '<div class="expense__grid">'
        + `<div class="expense__form"><h4>${icon('pen')}Lo que escribe el empleado</h4><dl>${g.form.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>`
        + `<div class="expense__photo"><h4>${icon('file')}La foto del ticket</h4>`
        + `<div class="receipt${t.blurry ? ' receipt--blurry' : ''}"><p class="receipt__shop">${esc(t.shop)}</p><p class="receipt__date">Fecha: ${esc(t.date)}</p>`
        + `<dl class="receipt__lines">${t.lines.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')}</dl>`
        + `<p class="receipt__total"><span>TOTAL</span><span>${esc(t.total)} €</span></p></div></div>`
        + '</div><div class="expense__decision" tabindex="-1" aria-live="polite"></div>';
      renderVerdict(false);
      if (!first) { swap(host); swap(title); }
    });
  })();

  /* Pistas: ocultas hasta que se pidan */
  $$('[data-hint]').forEach((box) => {
    const btn = $('.hint__btn', box);
    const text = $('.hint__text', box);
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      text.hidden = !open;
      btn.lastChild.textContent = open ? 'Ocultar pista' : 'Mostrar pista';
      if (open) swap(text);
    });
  });

  /* Paso 1: plantilla de esquema con trazo de boceto */
  const sketch = (() => {
    const host = $('[data-sketch]');
    if (!host) return null;

    /* Generador pseudoaleatorio con semilla: el boceto es siempre el mismo */
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const j = (a) => (rnd() - 0.5) * 2 * a;

    const roughLine = (x1, y1, x2, y2, a = 1.6) => {
      const mx = (x1 + x2) / 2 + j(a * 1.5); const my = (y1 + y2) / 2 + j(a * 1.5);
      return `M${(x1 + j(a)).toFixed(1)},${(y1 + j(a)).toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${(x2 + j(a)).toFixed(1)},${(y2 + j(a)).toFixed(1)}`;
    };
    const roughRect = (x, y, w, h) => [0, 1].map(() =>
      [roughLine(x, y, x + w, y), roughLine(x + w, y, x + w, y + h), roughLine(x + w, y + h, x, y + h), roughLine(x, y + h, x, y)].join(' ')).join(' ');
    const arrow = (x1, y1, x2, y2) => {
      const ang = Math.atan2(y2 - y1, x2 - x1);
      const h = (s) => `${(x2 - 11 * Math.cos(ang + s)).toFixed(1)},${(y2 - 11 * Math.sin(ang + s)).toFixed(1)}`;
      return `${roughLine(x1, y1, x2, y2, 1.2)} M${h(0.45)} L${x2},${y2} L${h(-0.45)}`;
    };

    const BOX = { w: 152, h: 92, gap: 34 };
    const FRAMES = [
      { t: 'Hoy', y: 34, boxes: [
        ['in', '¿Qué llega?', 'datos de entrada'],
        ['manual', 'Paso manual', '¿quién lo hace?'],
        ['dolor', 'Punto de dolor', '¿cuánto cuesta?'],
        ['manual', 'Paso manual', '¿cuánto tarda?'],
        ['in', '¿Qué sale?', '¿para quién?']
      ] },
      { t: 'Propuesta', y: 318, boxes: [
        ['in', 'Lo que llega', '¿cambia algo?'],
        ['auto', 'Automático', '¿con qué?'],
        ['ia', 'IA', '¿solo donde aporta?'],
        ['humano', 'Persona', '¿qué decide?'],
        ['in', 'Resultado', '¿qué mejora?']
      ] }
    ];
    const X0 = 40;

    let shapes = '';
    let texts = '';
    FRAMES.forEach((f) => {
      shapes += `<path class="sk-frame" pathLength="1" d="${roughRect(16, f.y - 8, 928, 214)}"/>`;
      texts += `<text class="sk-frame__t" x="30" y="${f.y + 18}">${f.t}</text>`;
      const by = f.y + 56;
      f.boxes.forEach(([kind, t, d], i) => {
        const x = X0 + i * (BOX.w + BOX.gap);
        shapes += `<rect class="sk-fill sk-fill--${kind}" x="${x + 3}" y="${by + 3}" width="${BOX.w - 6}" height="${BOX.h - 6}" rx="4"/>`;
        shapes += `<path class="sk-stroke sk-stroke--${kind}" pathLength="1" d="${roughRect(x, by, BOX.w, BOX.h)}"/>`;
        texts += `<text class="sk-t" x="${x + BOX.w / 2}" y="${by + 40}" text-anchor="middle">${esc(t)}</text>`
          + `<text class="sk-d" x="${x + BOX.w / 2}" y="${by + 63}" text-anchor="middle">${esc(d)}</text>`;
        if (i < f.boxes.length - 1) shapes += `<path class="sk-arrow" pathLength="1" d="${arrow(x + BOX.w + 4, by + BOX.h / 2, x + BOX.w + BOX.gap - 5, by + BOX.h / 2)}"/>`;
      });
    });
    /* Del dolor a la pieza que lo resuelve */
    const dx = X0 + 2 * (BOX.w + BOX.gap) + BOX.w / 2;
    shapes += `<path class="sk-link" d="M${dx - 20},${34 + 56 + BOX.h + 8} C${dx - 60},250 ${dx - 40},300 ${dx - 6},${318 + 50}"/>`;
    texts += `<text class="sk-note" x="${dx + 18}" y="262">cada dolor de arriba,</text><text class="sk-note" x="${dx + 18}" y="284">resuelto por una pieza de abajo</text>`;

    host.innerHTML = `<svg viewBox="0 0 960 560" role="img" aria-label="Plantilla: un marco Hoy y un marco Propuesta con cinco pasos cada uno, del dato de entrada al resultado">`
      + `<g class="sk-shapes">${shapes}</g><g class="sk-texts">${texts}</g></svg>`;

    let played = false;
    return {
      play() {
        if (played) return;
        played = true;
        if (reduceMotion.matches) return;
        $$('[pathLength]', host).forEach((p, i) => {
          p.animate([{ strokeDasharray: '1 1', strokeDashoffset: 1 }, { strokeDasharray: '1 1', strokeDashoffset: 0 }],
            { duration: 520, delay: 120 + i * 45, easing: 'cubic-bezier(.65, 0, .35, 1)', fill: 'backwards' });
        });
        $$('.sk-fill, .sk-link, .sk-texts text', host).forEach((n, i) => {
          n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 360, delay: 380 + i * 30, easing: EASE, fill: 'backwards' });
        });
      }
    };
  })();

  /* Paso 2: secciones de la especificación, vago frente a concreto */
  (() => {
    const host = $('#spec-view');
    const list = $('[data-cases="spec"]');
    const data = DATA.spec;
    if (!host || !list || !data) return;

    /* Resaltado mínimo de Markdown: listas, numeración y casillas */
    const md = (text) => text.split('\n').map((line) => {
      const e = esc(line);
      return e
        .replace(/^(\s*)- \[ \]/, '$1<span class="md-mk">- [ ]</span>')
        .replace(/^(\s*)- /, '$1<span class="md-mk">- </span>')
        .replace(/^(\d+\.) /, '<span class="md-mk">$1</span> ');
    }).join('\n');

    buildCaseList(list, Object.entries(data), (id, first) => {
      const s = data[id];
      host.innerHTML = `<p class="spec__h"><span class="md-mk">##</span>${esc(s.md.replace(/^## /, ' '))}</p>`
        + `<div class="spec__block spec__block--bad"><p class="spec__label">${icon('close')}Vago</p><pre>${md(s.vague)}</pre></div>`
        + `<div class="spec__block spec__block--good"><p class="spec__label">${icon('tick')}Concreto</p><pre>${md(s.good)}</pre></div>`
        + `<p class="spec__foot">La versión concreta da cifras, nombra a las personas y deja poco que adivinar. Así la IA no tiene que inventar.</p>`;
      if (!first) swap(host);
    });

    /* Plantilla descargable con todas las secciones */
    $('#spec-download')?.addEventListener('click', () => {
      const body = ['# Especificación · [nombre del caso]', '',
        '> Instrucción para la IA que construirá el reporte. Rellenad cada sección:',
        '> cuanto más concreta, menos tendrá que inventar.', '',
        ...Object.values(data).flatMap((s) => [s.md, `<!-- ${s.short}. Ejemplo vago: «${s.vague}» -->`, '', '', ''])
      ].join('\n');
      const url = URL.createObjectURL(new Blob([body], { type: 'text/markdown;charset=utf-8' }));
      const a = el('a');
      a.href = url;
      a.download = 'plantilla_especificacion.md';
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  })();

  /* Paso 3: con qué construir cada parte */
  (() => {
    const host = $('#tec-view');
    const list = $('[data-cases="tec"]');
    const title = $('#tec-title span');
    const data = DATA.tec;
    if (!host || !list || !data) return;

    buildCaseList(list, Object.entries(data), (id, first) => {
      const t = data[id];
      title.textContent = t.label;
      host.innerHTML = `<p class="tec__intro">${esc(t.intro)}</p><ul class="tec__list">${t.items.map((it) => '<li class="tec__item">'
        + `<p class="tec__name">${esc(it.name)}</p><p class="tec__when">${esc(it.when)}</p>`
        + `<p class="tec__ask"><span>Pedidlo así</span>${esc(it.ask)}</p></li>`).join('')}</ul>`;
      if (!first) { swap(host); swap(title); }
    });
  })();

  /* Entrega: lista para marcar (se recuerda en este navegador) */
  (() => {
    const KEY = 'cp-casos-todo';
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (_) { saved = {}; }
    const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (_) { /* sin almacenamiento */ } };

    $$('[data-todo]').forEach((ul) => {
      $$('li', ul).forEach((li, i) => {
        const id = `${ul.dataset.todo}-${i}`;
        const text = li.textContent.trim();
        const b = el('button', '', `<span class="todo__box" aria-hidden="true">${icon('tick')}</span><span>${esc(text)}</span>`);
        b.type = 'button';
        b.setAttribute('role', 'checkbox');
        b.setAttribute('aria-checked', String(Boolean(saved[id])));
        b.addEventListener('click', () => {
          const on = b.getAttribute('aria-checked') !== 'true';
          b.setAttribute('aria-checked', String(on));
          if (on) saved[id] = 1; else delete saved[id];
          persist();
        });
        li.replaceChildren(b);
      });
    });
  })();

  /* ═════════ Al mostrar una diapositiva ═════════ */

  function onSlideShown(slide) {
    playLanes($('[data-lanes]', slide));
    if ($('[data-sketch]', slide)) sketch?.play();
    $$('.panel', slide).forEach((panel) => {
      if (panel.hidden) return;
      const api = initPanel(panel);
      if (api) {
        api.pz.onResize();
        api.dg.reveal();
      }
    });
  }

  /* ═════════ Arranque ═════════ */

  function start() {
    const fromHash = slideIndexById(decodeURIComponent(window.location.hash.slice(1)));
    show(fromHash >= 0 ? fromHash : 0, { instant: true, keepHash: true });
    /* Prepara los diagramas visibles del resto de diapositivas (sin animarlos todavía) */
    $$('.panel[data-diagram]').forEach((panel) => { if (!panel.hidden) initPanel(panel); });
  }

  window.addEventListener('hashchange', () => {
    const i = slideIndexById(decodeURIComponent(window.location.hash.slice(1)));
    if (i >= 0 && i !== current) show(i, { keepHash: true });
  });

  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1500))]).then(start);

  window.casosPracticos = {
    next: () => go(1),
    previous: () => go(-1),
    goTo: (target) => (typeof target === 'number' ? show(target) : goToId(target))
  };
})();
