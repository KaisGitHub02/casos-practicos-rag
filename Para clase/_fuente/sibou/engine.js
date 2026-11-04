/* =========================================================================
   Sibou Lab · Motor de dibujo pixel art
   Lienzo lógico de 480 × 270 px que se escala sin suavizado.
   Cada viñeta recibe un objeto `g` con el paso actual y su progreso.
   ========================================================================= */
(function () {
  'use strict';

  const W = 480;
  const H = 270;

  const P = {
    bg: '#0f1528', bg2: '#141c33', grid: '#222d4b', ink: '#0a0f1d',
    white: '#f7f3e8', paper: '#ece6d6', light: '#c9d2e3',
    blue: '#4f86e0', sky: '#8ec5ff', orange: '#f28c38', navy: '#5d6b85',
    mint: '#6fdc9f', green: '#3fae6b', purple: '#a184f0', red: '#ef5a5a',
    yellow: '#f7cf5a', pink: '#f39ac1', teal: '#3cc6c6',
    gray: '#26314f', gray2: '#36446a', gray3: '#4a5a84',
    skin: '#f1c39b', skin2: '#b9805a', hair: '#3b2a20'
  };

  const FONTS = {
    pixel: '"Pixelify Sans", "Tiny5", "Courier New", monospace',
    sans: '"Atkinson Hyperlegible", Arial, sans-serif',
    mono: '"JetBrains Mono", "Courier New", monospace'
  };

  let c = null;     // contexto actual
  let T = 0;        // tiempo global en segundos
  let LBL = null;   // textos sustituidos por el editor { original: nuevo }
  let CAP = null;   // Set donde se capturan los textos dibujados (editor)

  /** Texto que se dibuja: aplica las sustituciones del editor y lo captura */
  function L(s) {
    const k = String(s);
    if (CAP) CAP.add(k);
    if (LBL && Object.prototype.hasOwnProperty.call(LBL, k)) return LBL[k];
    return s;
  }

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => 1 - Math.pow(1 - clamp(t), 3);
  const R = Math.round;

  /* ---------- color ---------- */
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const target = amt < 0 ? 0 : 255;
    const k = Math.abs(amt);
    r = R(r + (target - r) * k); g = R(g + (target - g) * k); b = R(b + (target - b) * k);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /* ---------- primitivas ---------- */
  function rect(x, y, w, h, col) { c.fillStyle = col; c.fillRect(R(x), R(y), R(w), R(h)); }
  function frame(x, y, w, h, col, t = 2) { rect(x, y, w, t, col); rect(x, y + h - t, w, t, col); rect(x, y, t, h, col); rect(x + w - t, y, t, h, col); }

  function box(x, y, w, h, o = {}) {
    const fill = o.fill || P.gray, border = o.border || P.ink;
    if (o.shadow !== false) { c.fillStyle = 'rgba(0,0,0,.38)'; c.fillRect(R(x + 4), R(y + 4), R(w - 1), R(h - 1)); }
    rect(x + 1, y, w - 2, h, border);
    rect(x, y + 1, w, h - 2, border);
    rect(x + 2, y + 2, w - 4, h - 4, fill);
    if (o.hi !== false && !o.flat) rect(x + 2, y + 2, w - 4, 2, shade(fill, 0.18));
  }

  function card(x, y, w, h, title, color = P.blue, o = {}) {
    box(x, y, w, h, { fill: o.fill || P.gray, border: o.border || P.ink, shadow: o.shadow });
    rect(x + 2, y + 2, w - 4, 15, color);
    rect(x + 2, y + 15, w - 4, 2, shade(color, -0.35));
    if (title) txt(title, x + 7, y + 4.5, { size: o.size || 9, color: o.titleColor || P.ink, maxW: w - 14, fit: true, weight: 700 });
    if (o.active) { const on = Math.floor(T * 3) % 2 === 0; frame(x - 3, y - 3, w + 6, h + 6, on ? P.yellow : shade(P.yellow, -0.4), 2); }
    return y + 21;
  }

  /* ---------- texto ---------- */
  /* Pixelify solo para textos en mayúsculas (títulos, etiquetas); el resto en Atkinson, más legible */
  const LOWER = /[a-zñáéíóúü0-9]/;
  function pick(s, o) { return o.font || (LOWER.test(String(s)) ? 'sans' : 'pixel'); }
  /* Escala del texto: legible de lejos (tamaño mínimo 8 y un 8 % más grande) */
  const TEXT_SCALE = 1.08;
  const eff = size => Math.max(size, 8) * TEXT_SCALE;
  function font(size, o = {}) { const f = o.font || 'pixel'; const z = eff(size); return f === 'pixel' ? `600 ${z * 1.1}px ${FONTS.pixel}` : `${o.weight || (f === 'sans' ? 700 : 600)} ${z}px ${FONTS[f]}`; }
  function measure(s, size, o = {}) { s = L(s); c.font = font(size, Object.assign({}, o, { font: pick(s, o) })); return c.measureText(String(s)).width; }

  function wrapLines(s, maxW, size, o) {
    c.font = font(size, o);
    const out = [];
    String(s).split('\n').forEach(par => {
      if (!maxW) { out.push(par); return; }
      const words = par.split(' ');
      let line = '';
      words.forEach(wd => {
        const test = line ? line + ' ' + wd : wd;
        if (c.measureText(test).width > maxW && line) { out.push(line); line = wd; } else line = test;
      });
      out.push(line);
    });
    return out;
  }

  /** Texto con ajuste automático. o: size, color, align, maxW, fit, lh, font, weight, valign, a */
  function txt(s, x, y, o = {}) { return rawTxt(L(s), x, y, o); }
  function rawTxt(s, x, y, o = {}) {
    o = Object.assign({}, o, { font: pick(s, o) });
    let size = o.size || 10;
    if (o.fit && o.maxW) { c.font = font(size, o); while (size > 5 && c.measureText(String(s)).width > o.maxW) { size -= 0.5; c.font = font(size, o); } }
    const lines = o.fit ? [String(s)] : wrapLines(s, o.maxW, size, o);
    const lh = o.lh || R(eff(size) * 1.24);
    c.font = font(size, o);
    c.fillStyle = o.color || P.white;
    c.textAlign = o.align || 'left';
    c.textBaseline = 'top';
    let yy = y;
    if (o.valign === 'middle') yy = y - (lines.length * lh) / 2 + (lh - eff(size)) / 2;
    if (o.shadow) { c.fillStyle = o.shadow; lines.forEach((ln, i) => c.fillText(ln, x + 1, yy + i * lh + 1)); c.fillStyle = o.color || P.white; }
    lines.forEach((ln, i) => c.fillText(ln, x, yy + i * lh));
    let w = 0; lines.forEach(ln => { w = Math.max(w, c.measureText(ln).width); });
    return { w, h: lines.length * lh, lines: lines.length, size };
  }

  function typed(s, p) { s = L(s); const n = Math.floor(String(s).length * clamp(p)); return String(s).slice(0, n); }

  /* ---------- etiquetas ---------- */
  function chip(s, x, y, o = {}) {
    const size = o.size || 9, pad = o.pad == null ? 5 : o.pad;
    const tw = measure(s, size, o);
    const w = o.w || R(tw + pad * 2 + (o.icon ? 14 : 0));
    const h = o.h || R(size + 8);
    let xx = x;
    if (o.align === 'center') xx = x - w / 2;
    if (o.align === 'right') xx = x - w;
    box(xx, y, w, h, { fill: o.fill || P.blue, border: o.border || P.ink, shadow: o.shadow || false });
    if (o.icon) icon(o.icon, xx + 4, y + (h - 12) / 2, 1, o.iconTint);
    const tx = o.icon ? xx + 14 + (w - 14) / 2 : xx + w / 2;
    txt(s, tx, y + (h - size) / 2 + 0.5, { size, color: o.color || P.ink, align: 'center', maxW: w - 6, fit: true, font: o.font, weight: o.weight });
    if (o.strike) rect(xx + 3, y + h / 2 - 1, w - 6, 2, o.strike);
    return { x: xx, y, w, h, cx: xx + w / 2, cy: y + h / 2 };
  }

  /* ---------- flechas y trazos ---------- */
  function line(x1, y1, x2, y2, col = P.white, w = 2, dash) {
    c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'butt';
    c.setLineDash(dash ? [4, 3] : []);
    c.beginPath(); c.moveTo(R(x1), R(y1)); c.lineTo(R(x2), R(y2)); c.stroke();
    c.setLineDash([]);
  }
  function arrow(x1, y1, x2, y2, o = {}) {
    const p = o.p == null ? 1 : clamp(o.p);
    if (p <= 0) return;
    const col = o.color || P.white, w = o.w || 2, head = o.head || 6;
    const xe = lerp(x1, x2, p), ye = lerp(y1, y2, p);
    const a = Math.atan2(ye - y1, xe - x1);
    const back = p > 0.1 ? head * 0.6 : 0;
    line(x1, y1, xe - Math.cos(a) * back, ye - Math.sin(a) * back, col, w, o.dash);
    if (p > 0.1) {
      c.fillStyle = col; c.beginPath();
      c.moveTo(xe, ye);
      c.lineTo(xe - head * Math.cos(a - 0.5), ye - head * Math.sin(a - 0.5));
      c.lineTo(xe - head * Math.cos(a + 0.5), ye - head * Math.sin(a + 0.5));
      c.closePath(); c.fill();
    }
  }
  /** Trazo por puntos con flecha final */
  function path(pts, o = {}) {
    const p = o.p == null ? 1 : clamp(o.p);
    if (p <= 0) return;
    let total = 0; const seg = [];
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); total += d; }
    let left = total * p;
    for (let i = 1; i < pts.length; i++) {
      const [x1, y1] = pts[i - 1], [x2, y2] = pts[i];
      if (left <= 0) break;
      const f = Math.min(1, left / seg[i - 1]);
      const last = i === pts.length - 1 || f < 1;
      if (last && o.arrow !== false) arrow(x1, y1, lerp(x1, x2, f), lerp(y1, y2, f), o);
      else line(x1, y1, lerp(x1, x2, f), lerp(y1, y2, f), o.color || P.white, o.w || 2, o.dash);
      left -= seg[i - 1];
    }
  }

  /* ---------- sprites ---------- */
  const BASE = { k: P.ink, w: P.white, y: P.yellow, r: P.red, g: P.mint, b: P.blue, o: P.orange, p: P.purple, n: P.navy, s: P.skin, h: P.hair, l: P.light, c: P.sky, i: P.pink, t: P.teal, e: P.green, x: P.gray2 };
  const SPR = {};
  const cache = new Map();
  function defSprite(name, tint, rows) { SPR[name] = { tint, rows, w: rows[0].length, h: rows.length }; }

  function spriteCanvas(name, colors) {
    const key = name + '|' + JSON.stringify(colors);
    if (cache.has(key)) return cache.get(key);
    const s = SPR[name];
    const cv = document.createElement('canvas');
    cv.width = s.w; cv.height = s.h;
    const x = cv.getContext('2d');
    const tint = colors['#'] || s.tint;
    const map = Object.assign({}, BASE, { '#': tint, D: shade(tint, -0.42), L: shade(tint, 0.45) }, colors);
    s.rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const ch = row[i]; if (ch === '.' || ch === ' ') continue; x.fillStyle = map[ch] || '#ff00ff'; x.fillRect(i, j, 1, 1); } });
    cache.set(key, cv);
    return cv;
  }
  function sprite(name, x, y, s = 2, colors = {}) {
    if (!SPR[name]) return;
    const cv = spriteCanvas(name, colors);
    c.drawImage(cv, R(x), R(y), cv.width * s, cv.height * s);
  }
  function icon(name, x, y, s = 2, tint) { sprite(name, x, y, s, tint ? { '#': tint } : {}); }
  function spriteSize(name, s = 2) { const d = SPR[name]; return d ? { w: d.w * s, h: d.h * s } : { w: 0, h: 0 }; }

  /* ---------- personajes ---------- */
  function robot(x, y, o = {}) {
    const s = o.s || 2;
    const bob = o.still ? 0 : R(Math.sin(T * 2.6 + (o.phase || 0)) * 1);
    const yy = y + bob;
    sprite('robot', x, yy, s, { '#': o.color || P.blue });
    const px = (i, j, w, h, col) => rect(x + i * s, yy + j * s, w * s, h * s, col);
    const mood = o.mood || 'happy';
    const blink = (T + (o.phase || 0)) % 3.4 < 0.14;
    if (mood === 'alert' || mood === 'wrong') {
      px(5, 4, 1, 1, P.red); px(6, 5, 1, 1, P.red); px(5, 6, 1, 1, P.red); px(6, 4, 1, 1, P.red); px(5, 5, 1, 1, P.red); px(6, 6, 1, 1, P.red);
      px(9, 4, 2, 3, P.red); px(6, 7, 4, 1, P.red);
      if (mood === 'wrong') { px(9, 4, 2, 3, P.ink); px(9, 4, 1, 1, P.red); px(10, 5, 1, 1, P.red); px(9, 6, 1, 1, P.red); px(10, 4, 1, 1, P.red); px(10, 6, 1, 1, P.red); px(9, 5, 1, 1, P.red); }
    } else if (mood === 'confused') {
      px(5, 5, 2, blink ? 1 : 2, P.sky); px(9, 6, 2, 1, P.sky); px(6, 7, 1, 1, P.sky); px(8, 7, 2, 1, P.sky);
    } else if (mood === 'think') {
      px(6, 4, 2, blink ? 1 : 2, P.sky); px(10, 4, 1, blink ? 1 : 2, P.sky); px(7, 7, 2, 1, P.sky);
    } else if (mood === 'sure') {
      px(5, 5, 2, 1, P.yellow); px(9, 5, 2, 1, P.yellow); px(5, 7, 6, 1, P.yellow);
    } else {
      px(5, 4, 2, blink ? 1 : 2, P.mint); px(9, 4, 2, blink ? 1 : 2, P.mint); px(5, 6, 1, 1, P.mint); px(10, 6, 1, 1, P.mint); px(6, 7, 4, 1, P.mint);
    }
    if (o.label) txt(o.label, x + 8 * s, yy + 20 * s, { size: 8, align: 'center', color: o.labelColor || P.light });
    return { w: 16 * s, h: 19 * s, cx: x + 8 * s, top: yy };
  }

  function person(x, y, o = {}) {
    const s = o.s || 2;
    const bob = o.still ? 0 : R(Math.sin(T * 2 + (o.phase || 1)) * 0.6);
    sprite('person', x, y + bob, s, { '#': o.shirt || P.orange, h: o.hair || P.hair, s: o.skin || P.skin, n: o.pants || P.navy });
    if (o.label) txt(o.label, x + 6 * s, y + 20 * s, { size: 8, align: 'center', color: o.labelColor || P.light });
    return { w: 12 * s, h: 19 * s, cx: x + 6 * s };
  }

  /* ---------- globos y ventanas ---------- */
  function bubble(x, y, w, h, o = {}) {
    const fill = o.fill || P.white, border = o.border || P.ink;
    const tx = o.tx, ty = o.ty;
    if (tx != null) {
      const bx = clamp(tx, x + 10, x + w - 10);
      const down = ty > y + h, up = ty < y;
      c.fillStyle = border; c.beginPath();
      if (down) { c.moveTo(bx - 7, y + h - 2); c.lineTo(tx, ty); c.lineTo(bx + 7, y + h - 2); }
      else if (up) { c.moveTo(bx - 7, y + 2); c.lineTo(tx, ty); c.lineTo(bx + 7, y + 2); }
      else { const by = clamp(ty, y + 8, y + h - 8); const sx = tx < x ? x + 2 : x + w - 2; c.moveTo(sx, by - 6); c.lineTo(tx, ty); c.lineTo(sx, by + 6); }
      c.closePath(); c.fill();
    }
    box(x, y, w, h, { fill, border, shadow: o.shadow });
    if (tx != null) {
      const bx = clamp(tx, x + 10, x + w - 10);
      const down = ty > y + h, up = ty < y;
      c.fillStyle = fill; c.beginPath();
      if (down) { c.moveTo(bx - 4, y + h - 3); c.lineTo(lerp(bx, tx, 0.55), lerp(y + h, ty, 0.55)); c.lineTo(bx + 4, y + h - 3); }
      else if (up) { c.moveTo(bx - 4, y + 3); c.lineTo(lerp(bx, tx, 0.55), lerp(y, ty, 0.55)); c.lineTo(bx + 4, y + 3); }
      else { const by = clamp(ty, y + 8, y + h - 8); const sx = tx < x ? x + 3 : x + w - 3; c.moveTo(sx, by - 3); c.lineTo(lerp(sx, tx, 0.5), lerp(by, ty, 0.5)); c.lineTo(sx, by + 3); }
      c.closePath(); c.fill();
    }
    if (o.text) txt(o.text, x + w / 2, y + h / 2, { size: o.size || 9, color: o.color || P.ink, align: 'center', valign: 'middle', maxW: w - 12, font: o.font });
  }

  function win(x, y, w, h, title, o = {}) {
    box(x, y, w, h, { fill: o.fill || P.gray, border: P.ink, shadow: o.shadow });
    rect(x + 2, y + 2, w - 4, 13, o.bar || P.gray3);
    rect(x + 6, y + 6, 4, 4, P.red); rect(x + 12, y + 6, 4, 4, P.yellow); rect(x + 18, y + 6, 4, 4, P.mint);
    if (title) txt(title, x + 27, y + 4.5, { size: 8, color: o.titleColor || P.white, maxW: w - 34, fit: true });
    return { x: x + 6, y: y + 20, w: w - 12, h: h - 26 };
  }

  /** Mensaje de chat. Devuelve la altura ocupada */
  function msg(x, y, w, s, o = {}) {
    const size = o.size || 8.5;
    const user = o.who === 'user';
    const lines = wrapLines(L(s), w - 14, size, { font: o.font || 'sans' });
    const lh = R(eff(size) * 1.26);
    const h = lines.length * lh + 10;
    const fill = o.fill || (user ? P.blue : P.white);
    box(x, y, w, h, { fill, border: P.ink, shadow: false });
    rawTxt(lines.join('\n'), x + 7, y + 5.5, { size, color: o.color || P.ink, lh, font: o.font || 'sans' });
    return h;
  }

  /** Hoja de papel con esquina doblada; o.rows: líneas de texto o barras */
  function paper(x, y, w, h, o = {}) {
    const fill = o.fill || P.paper;
    box(x, y, w, h, { fill, border: P.ink, shadow: o.shadow });
    rect(x + w - 12, y, 12, 12, o.bgc || P.bg);
    rect(x + w - 12, y + 1, 11, 11, shade(fill, -0.22));
    rect(x + w - 12, y + 10, 12, 2, P.ink); rect(x + w - 2, y + 10, 2, 2, P.ink);
    rect(x + w - 13, y, 2, 12, P.ink);
    if (o.title) txt(o.title, x + 7, y + 6, { size: o.size || 8, color: P.ink, maxW: w - 24, fit: true, weight: 700 });
    if (o.lines) bars(x + 8, y + (o.title ? 20 : 10), w - 18, o.lines, { color: o.lineColor || P.light, seed: o.seed || 1, gap: o.gap });
  }

  function rnd(seed) { const v = Math.sin(seed * 9301 + 49297) * 233280; return v - Math.floor(v); }
  function bars(x, y, w, n, o = {}) {
    const gap = o.gap || 7;
    for (let i = 0; i < n; i++) {
      const lw = R(w * (0.55 + 0.45 * rnd((o.seed || 1) * 31 + i)));
      rect(x, y + i * gap, i === n - 1 ? R(lw * 0.6) : lw, 3, (o.colors && o.colors[i]) || o.color || P.light);
    }
  }

  /* ---------- datos ---------- */
  function probBars(x, y, items, o = {}) {
    const lw = o.labelW || 70, bw = o.barW || 120, gap = o.gap || 18, p = o.p == null ? 1 : o.p;
    items.forEach((it, i) => {
      const yy = y + i * gap;
      const hl = o.highlight === i;
      txt(it.label, x + lw - 6, yy + 1, { size: o.size || 9, color: hl ? P.yellow : P.white, align: 'right', maxW: lw - 6, fit: true, font: o.font });
      rect(x + lw, yy, bw, 11, P.ink);
      rect(x + lw + 1, yy + 1, bw - 2, 9, P.gray2);
      rect(x + lw + 1, yy + 1, Math.max(0, (bw - 2) * it.v * p), 9, it.color || (hl ? P.orange : P.blue));
      if (o.pct !== false) txt(R(it.v * 100 * p) + '%', x + lw + bw + 5, yy + 1, { size: 8.5, color: hl ? P.yellow : P.light });
      if (hl && o.blink !== false && Math.floor(T * 3) % 2 === 0) frame(x + lw - 2, yy - 2, bw + 4, 15, P.yellow, 1);
    });
  }

  function meter(x, y, w, v, o = {}) {
    const n = o.n || 10, h = o.h || 10, gap = 2;
    const sw = (w - gap * (n - 1)) / n;
    const on = R(clamp(v) * n);
    for (let i = 0; i < n; i++) {
      let col = P.gray2;
      if (i < on) col = o.color || (i < n * 0.34 ? P.red : i < n * 0.67 ? P.yellow : P.mint);
      rect(x + i * (sw + gap), y, sw, h, P.ink);
      rect(x + i * (sw + gap) + 1, y + 1, sw - 2, h - 2, col);
    }
    if (o.label) txt(o.label, x, y - 11, { size: 8, color: o.labelColor || P.light });
  }

  function stamp(s, x, y, o = {}) {
    const a = o.a == null ? 1 : o.a;
    if (a <= 0) return;
    const col = o.color || P.red, size = o.size || 13;
    c.save();
    c.translate(R(x), R(y));
    c.rotate(o.angle == null ? -0.14 : o.angle);
    const sc = 1 + (1 - ease(a)) * 0.8;
    c.scale(sc, sc);
    c.globalAlpha *= clamp(a * 1.4);
    const w = measure(s, size, { weight: 700 }) + 14;
    const h = size + 10;
    c.fillStyle = 'rgba(10,15,29,.55)'; c.fillRect(-w / 2, -h / 2, w, h);
    c.strokeStyle = col; c.lineWidth = 2; c.strokeRect(-w / 2, -h / 2, w, h);
    c.strokeRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6);
    txt(s, 0, -size / 2 + 0.5, { size, color: col, align: 'center', weight: 700 });
    c.restore();
  }

  /** Tabla sencilla. cols: anchos; rows: arrays de celdas (texto o {t,color,icon,fill}) */
  function table(x, y, cols, rows, o = {}) {
    const rh = o.rh || 18;
    let yy = y;
    rows.forEach((row, j) => {
      let xx = x;
      const head = j === 0 && o.head !== false;
      const rowA = o.rowAlpha ? o.rowAlpha(j) : 1;
      if (rowA <= 0) { xx = x; yy += rh; return; }
      c.save(); c.globalAlpha *= rowA;
      row.forEach((cell, i) => {
        const cw = cols[i];
        const cl = typeof cell === 'object' && cell !== null ? cell : { t: cell };
        const fill = cl.fill || (head ? (o.headFill || P.navy) : (j % 2 ? P.gray : P.gray2));
        rect(xx, yy, cw, rh, P.ink);
        rect(xx + 1, yy + 1, cw - 2, rh - 2, fill);
        if (cl.icon) icon(cl.icon, xx + cw / 2 - 6, yy + rh / 2 - 6, 1, cl.color);
        else if (cl.t != null) txt(cl.t, i === 0 && !head && o.leftFirst !== false ? xx + 5 : xx + cw / 2, yy + rh / 2 - (o.size || 8) / 2, { size: o.size || 8, color: cl.color || (head ? P.white : P.light), align: i === 0 && !head && o.leftFirst !== false ? 'left' : 'center', maxW: cw - 8, fit: true, font: cl.font });
        xx += cw;
      });
      c.restore();
      yy += rh;
    });
    return yy;
  }

  /** Cadena de nodos con flechas. nodes: [{t, icon, color}] */
  function flow(nodes, x, y, w, o = {}) {
    const bw = o.bw || 70, bh = o.bh || 54, n = nodes.length;
    const gap = n > 1 ? (w - n * bw) / (n - 1) : 0;
    const active = o.active == null ? -1 : o.active;
    const pos = [];
    nodes.forEach((nd, i) => {
      const xx = x + i * (bw + gap);
      const reveal = o.reveal ? o.reveal(i) : 1;
      pos.push({ x: xx, y, cx: xx + bw / 2, cy: y + bh / 2 });
      if (reveal <= 0) return;
      c.save(); c.globalAlpha *= reveal;
      const col = i === active ? P.orange : (i < active ? P.mint : (nd.color || P.blue));
      card(xx, y, bw, bh, nd.t, col, { active: i === active && o.blink !== false, size: o.size || 8 });
      if (nd.icon) icon(nd.icon, xx + bw / 2 - 12, y + 22 + (bh - 54) / 2, 2, nd.tint || (i <= active ? P.yellow : P.white));
      if (nd.sub) txt(nd.sub, xx + bw / 2, y + bh - 12, { size: 7, align: 'center', color: P.light, maxW: bw - 6, fit: true });
      if (i < n - 1 && gap > 8) arrow(xx + bw + 2, y + bh / 2, xx + bw + gap - 2, y + bh / 2, { color: i < active ? P.mint : P.navy, p: o.reveal ? o.reveal(i + 1) : 1 });
      c.restore();
    });
    return pos;
  }

  /* ---------- efectos ---------- */
  function show(a, fn, dy = 6) {
    if (a <= 0.001) return;
    c.save(); c.globalAlpha *= clamp(a);
    if (dy) c.translate(0, R((1 - ease(a)) * dy));
    fn();
    c.restore();
  }
  function pop(a, cx, cy, fn) {
    if (a <= 0.001) return;
    const e = ease(a);
    const k = 0.6 + 0.4 * e + Math.sin(e * Math.PI) * 0.08;
    c.save(); c.globalAlpha *= clamp(a * 1.5);
    c.translate(cx, cy); c.scale(k, k); c.translate(-cx, -cy);
    fn();
    c.restore();
  }
  function pulse(x, y, col = P.yellow, size = 14) {
    const ph = (T * 1.2) % 1;
    const s = R(size * (0.6 + ph));
    c.save(); c.globalAlpha *= 1 - ph;
    frame(x - s, y - s, s * 2, s * 2, col, 2);
    c.restore();
  }
  function blink(period = 0.6) { return Math.floor(T / period) % 2 === 0; }
  function glow(x, y, w, h, col = P.yellow) { if (blink(0.4)) frame(x - 3, y - 3, w + 6, h + 6, col, 2); else frame(x - 2, y - 2, w + 4, h + 4, shade(col, -0.45), 1); }
  function sparkle(x, y, col = P.yellow) {
    const k = Math.floor(T * 6) % 4;
    const d = [2, 4, 6, 4][k];
    rect(x - 1, y - d, 2, d * 2, col); rect(x - d, y - 1, d * 2, 2, col);
  }
  function qmark(x, y, col = P.yellow, s = 2) { const b = R(Math.sin(T * 4 + x) * 1.5); icon('question', x, y + b, s, col); }

  /* ---------- escenario ---------- */
  function background(o = {}) {
    rect(0, 0, W, H, o.color || P.bg);
    for (let x = 6; x < W; x += 12) for (let y = 6; y < H; y += 12) rect(x, y, 1, 1, P.grid);
    if (o.floor) {
      rect(0, o.floor, W, H - o.floor, P.bg2);
      rect(0, o.floor, W, 2, P.gray2);
      for (let x = 0; x < W; x += 24) rect(x + ((T * 6) % 24), o.floor + 6, 8, 1, P.grid);
    }
  }

  /* ---------- objeto g para cada viñeta ---------- */
  function makeG(step, p, time, total) {
    return {
      step, p, t: time, total,
      at(k) { return step > k ? 1 : step === k ? p : 0; },
      on(k) { return step === k; },
      from(k) { return step >= k; },
      past(k) { return step > k; },
      until(k) { return step <= k ? 1 : step === k + 1 ? 1 - p : 0; },
      span(a, b) { return step >= a && step <= b; }
    };
  }

  function renderPanel(ctx, panel, step, p, time, capture) {
    c = ctx; T = time;
    LBL = panel.labels && Object.keys(panel.labels).length ? panel.labels : null;
    CAP = capture || null;
    const sc = ctx.canvas.width / W;
    ctx.setTransform(sc, 0, 0, sc, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 1;
    try {
      background(panel.bg || {});
      panel.draw(makeG(step, ease(p), time, (panel.steps || []).length));
    } catch (err) {
      console.error('Error dibujando la viñeta «' + (panel.title || '?') + '»', err);
      ctx.globalAlpha = 1;
      rect(0, 0, W, H, P.bg);
      rawTxt('No se pudo dibujar esta viñeta', W / 2, H / 2 - 8, { align: 'center', color: P.red, size: 12 });
    }
    LBL = null; CAP = null;
  }

  /** Textos que aparecen en una viñeta (recorre todos sus pasos) */
  function panelTexts(panel) {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const set = new Set();
    const n = Math.max(1, (panel.steps || []).length);
    const plain = Object.assign({}, panel, { labels: null });
    for (let i = 0; i < n; i++) renderPanel(ctx, plain, i, 1, 1, set);
    return Array.from(set).filter(s => /[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(s));
  }

  /* ======================= SPRITES ======================= */
  defSprite('doc', P.navy, [
    '.#######....', '.#wwwww##...', '.#wwwww#w#..', '.#wwwww####.', '.#wkkkkkww#.', '.#wwwwwwww#.',
    '.#wkkkkkkw#.', '.#wwwwwwww#.', '.#wkkkkkkw#.', '.#wwwwwwww#.', '.#wkkkkwww#.', '.##########.']);
  defSprite('mail', P.navy, [
    '............', '############', '##wwwwwwww##', '#w#wwwwww#w#', '#ww#wwww#ww#', '#www#ww#www#',
    '#wwww##wwww#', '#wwwwwwwwww#', '#wwwwwwwwww#', '############', '............', '............']);
  defSprite('folder', P.yellow, [
    '............', '.DDDD.......', 'D####D......', 'D#####DDDDD.', 'DLLLLLLLLLLD', 'D##########D',
    'D##########D', 'D##########D', 'D##########D', 'D##########D', '.DDDDDDDDDD.', '............']);
  defSprite('db', P.purple, [
    '...DDDDDD...', '.DDLLLLLLDD.', 'DLLLLLLLLLLD', 'D#LLLLLLLL#D', 'D##DDDDDD##D', 'D##########D',
    'DD########DD', 'D#DDDDDDDD#D', 'D##########D', 'DD########DD', '.DDDDDDDDDD.', '............']);
  defSprite('search', P.white, [
    '..####......', '.#cccc#.....', '#cwwccc#....', '#cwcccc#....', '#cccccc#....', '#cccccc#....',
    '.#cccc#.....', '..####D#....', '......D##...', '.......D##..', '........D##.', '.........DD.']);
  defSprite('shield', P.mint, [
    '.DDDDDDDDDD.', 'D##########D', 'D#LL#######D', 'D#L########D', 'D##########D', 'D##########D',
    '.D########D.', '.D########D.', '..D######D..', '...D####D...', '....DDDD....', '............']);
  defSprite('lock', P.yellow, [
    '...DDDDDD...', '..D......D..', '..D......D..', '..D......D..', '.DDDDDDDDDD.', '.D########D.',
    '.D###kk###D.', '.D###kk###D.', '.D########D.', '.D########D.', '.DDDDDDDDDD.', '............']);
  defSprite('check', P.mint, [
    '............', '..........##', '.........###', '........###.', '.......###..', '##....###...',
    '###..###....', '.######.....', '..####......', '...##.......', '............', '............']);
  defSprite('cross', P.red, [
    '............', '.##......##.', '.###....###.', '..###..###..', '...######...', '....####....',
    '....####....', '...######...', '..###..###..', '.###....###.', '.##......##.', '............']);
  defSprite('warn', P.yellow, [
    '.....##.....', '....####....', '....####....', '...##kk##...', '...##kk##...', '..###kk###..',
    '..###kk###..', '.####kk####.', '.##########.', '#####kk#####', '############', '............']);
  defSprite('gear', P.light, [
    '.....##.....', '..#.####.#..', '.##########.', '..###DD###..', '.###D..D###.', '####D..D####',
    '####D..D####', '.###D..D###.', '..###DD###..', '.##########.', '..#.####.#..', '.....##.....']);
  defSprite('chip', P.navy, [
    '..#.#..#.#..', '.DDDDDDDDDD.', '#D########D#', '.D#yyyyyy#D.', '#D#y####y#D#', '.D#y#ww#y#D.',
    '#D#y#ww#y#D#', '.D#y####y#D.', '#D#yyyyyy#D#', '.D########D.', '.DDDDDDDDDD.', '..#.#..#.#..']);
  defSprite('chat', P.white, [
    '............', '.DDDDDDDDDD.', 'D##########D', 'D##########D', 'D#kk#kk#kk#D', 'D##########D',
    'D##########D', '.DD#DDDDDDD.', '..D#D.......', '.DD.........', '............', '............']);
  defSprite('globe', P.sky, [
    '....kkkk....', '..kkccggkk..', '.kccgggccck.', '.kcgggcccck.', 'kccggccccggk', 'kcccccccgggk',
    'kcccccccgggk', 'kccgcccccggk', '.kcgggcccck.', '.kccggcccck.', '..kkccccckk.', '....kkkk....']);
  defSprite('star', P.yellow, [
    '.....##.....', '.....##.....', '....####....', '############', '.##########.', '..########..',
    '...######...', '..########..', '..###..###..', '.###....###.', '.##......##.', '............']);
  defSprite('clock', P.navy, [
    '...DDDDDD...', '.DDwwwwwwDD.', '.DwwwwkwwwD.', 'DwwwwwkwwwwD', 'DwwwwwkwwwwD', 'DwwwwwkkkkwD',
    'DwwwwwwwwwwD', 'DwwwwwwwwwwD', '.DwwwwwwwwD.', '.DDwwwwwwDD.', '...DDDDDD...', '............']);
  defSprite('coin', P.yellow, [
    '...DDDDDD...', '.DD######DD.', '.D##L#####D.', 'D##L###D###D', 'D#L###DDD##D', 'D#L####D###D',
    'D#####DDD##D', 'D######D###D', '.D########D.', '.DD######DD.', '...DDDDDD...', '............']);
  defSprite('image', P.navy, [
    '............', 'DDDDDDDDDDDD', 'DcccccccyycD', 'DcccccccyycD', 'DccccccccccD', 'DcccgccccccD',
    'DccgggccgccD', 'DcgggggggggD', 'DggggggggggD', 'DDDDDDDDDDDD', '............', '............']);
  defSprite('phone', P.navy, [
    '..DDDDDDDD..', '..D######D..', '..D#cccc#D..', '..D#cccc#D..', '..D#cccc#D..', '..D#cccc#D..',
    '..D#cccc#D..', '..D#cccc#D..', '..D#cccc#D..', '..D######D..', '..D##ww##D..', '..DDDDDDDD..']);
  defSprite('book', P.blue, [
    '............', '.DDDD..DDDD.', 'D####DD####D', 'D#kk#DD#kk#D', 'D####DD####D', 'D#kk#DD#kk#D',
    'D####DD####D', 'D#kk#DD#kk#D', 'D####DD####D', 'DDDDDDDDDDDD', '.....DD.....', '............']);
  defSprite('link', P.sky, [
    '............', '............', '............', '.####..####.', '#....##....#', '#..######..#',
    '#....##....#', '.####..####.', '............', '............', '............', '............']);
  defSprite('eye', P.navy, [
    '............', '............', '............', '...######...', '.##wwwwww##.', '#wwwkkkkwww#',
    '#wwwkkkkwww#', '.##wwwwww##.', '...######...', '............', '............', '............']);
  defSprite('user', P.light, [
    '....####....', '...######...', '...######...', '...######...', '....####....', '............',
    '..########..', '.##########.', '.##########.', '.##########.', '............', '............']);
  defSprite('bulb', P.yellow, [
    '...DDDDDD...', '..D######D..', '.D##LL####D.', '.D#L######D.', '.D########D.', '.D########D.',
    '..D######D..', '...D####D...', '...nnnnnn...', '...llllll...', '...nnnnnn...', '....llll....']);
  defSprite('target', P.red, [
    '...######...', '.##wwwwww##.', '.#ww####ww#.', '#ww#wwww#ww#', '#w#ww##ww#w#', '#w#w####w#w#',
    '#w#w####w#w#', '#w#ww##ww#w#', '#ww#wwww#ww#', '.#ww####ww#.', '.##wwwwww##.', '...######...']);
  defSprite('question', P.yellow, [
    '...######...', '..########..', '.###....###.', '.##......##.', '........###.', '.......###..',
    '.....####...', '.....##.....', '.....##.....', '............', '.....##.....', '.....##.....']);
  defSprite('calendar', P.red, [
    '..k....k....', '############', '############', '#wwwwwwwwww#', '#wkwkwkwkww#', '#wwwwwwwwww#',
    '#wkwkwkwkww#', '#wwwwwwwwww#', '#wkwkwrrwww#', '#wwwwwrrwww#', '############', '............']);
  defSprite('server', P.gray3, [
    'DDDDDDDDDDDD', 'D##########D', 'D#gg######yD', 'D##########D', 'DDDDDDDDDDDD', 'D##########D',
    'D#gg######yD', 'D##########D', 'DDDDDDDDDDDD', '....DDDD....', '..DDDDDDDD..', '............']);
  defSprite('cloud', P.light, [
    '............', '............', '....####....', '...######...', '.#########..', '###########.',
    '############', '############', '.##########.', '............', '............', '............']);
  defSprite('plug', P.light, [
    '...#...#....', '...#...#....', '.#########..', '.#########..', '.#########..', '..#######...',
    '...#####....', '.....#......', '.....#......', '.....##.....', '......###...', '........##..']);
  defSprite('pencil', P.yellow, [
    '.........rr.', '........rrrr', '.......#rrr.', '......###r..', '.....###....', '....###.....',
    '...###......', '..###.......', '.s##........', '.ss.........', 'k...........', '............']);
  defSprite('pin', P.red, [
    '...######...', '..########..', '.###wwww###.', '.###wwww###.', '.##########.', '..########..',
    '...######...', '....####....', '.....##.....', '.....##.....', '............', '............']);
  defSprite('tv', P.purple, [
    '...k....k...', '....k..k....', 'DDDDDDDDDDDD', 'D##########D', 'D#L########D', 'D##########D',
    'D##########D', 'D##########D', 'DDDDDDDDDDDD', '..DD....DD..', '............', '............']);
  defSprite('camera', P.navy, [
    '............', '...DDD......', 'DDDDDDDDDDDD', 'D###DDDD###D', 'D##DccccD##D', 'D##DcwccD##D',
    'D##DccccD##D', 'D###DDDD###D', 'DDDDDDDDDDDD', '............', '............', '............']);
  defSprite('palette', P.paper, [
    '............', '...######...', '.##########.', '#rr######bb#', '#rr######bb#', '#######..###',
    '#gg####..###', '#gg########.', '.##yy####...', '..#yy###....', '...###......', '............']);
  defSprite('key', P.yellow, [
    '............', '............', '............', '.####.......', '#....#######', '#....#######',
    '.####...#.#.', '........#.#.', '............', '............', '............', '............']);
  defSprite('bolt', P.yellow, [
    '......###...', '.....###....', '....###.....', '...#######..', '......###...', '.....###....',
    '....###.....', '...##.......', '..#.........', '............', '............', '............']);
  defSprite('list', P.white, [
    '............', '############', '#wwwwwwwwww#', '#gwkkkkkkww#', '#wwwwwwwwww#', '#gwkkkkkkww#',
    '#wwwwwwwwww#', '#rwkkkkkkww#', '#wwwwwwwwww#', '############', '............', '............']);
  defSprite('scissors', P.light, [
    '.##......##.', '#..#....#..#', '#..#....#..#', '.##.#..#.##.', '.....##.....', '.....##.....',
    '....#..#....', '...#....#...', '..#......#..', '.#........#.', '#..........#', '............']);
  defSprite('cat', P.orange, [
    '.#....#.....', '.##..##.....', '.######.....', '.#k##k#.....', '.######.....', '..#ii#......',
    '..#####.....', '.#######....', '.#######..#.', '.########.#.', '.#########..', '..##..##....']);
  defSprite('robot', P.blue, [
    '.......yy.......', '.......kk.......', '...DDDDDDDDDD...', '..D##########D..', '..D#kkkkkkkk#D..',
    '..D#kkkkkkkk#D..', '..D#kkkkkkkk#D..', '..D#kkkkkkkk#D..', '..D##########D..', '...DDDDDDDDDD...',
    '.....DD##DD.....', '..DDDDDDDDDDDD..', '.DD##########DD.', 'D#D####yy####D#D', 'D#D##########D#D',
    'DDD##########DDD', '...DDDDDDDDDD...', '....DD....DD....', '...DDD....DDD...']);
  defSprite('person', P.orange, [
    '...hhhhhh...', '..hhhhhhhh..', '..hssssssh..', '..skssssks..', '..ssssssss..', '..sssrrsss..',
    '...ssssss...', '....ssss....', '..########..', '.##########.', '############', '##.######.##',
    'ss.######.ss', '...######...', '...nnnnnn...', '...nn..nn...', '...nn..nn...', '...nn..nn...', '..kkk..kkk..']);

  window.PL = window.PL || {};
  PL.W = W; PL.H = H; PL.P = P;
  PL.renderPanel = renderPanel;
  PL.panelTexts = panelTexts;
  PL.sprites = SPR;
  PL.D = {
    P, W, H, clamp, lerp, ease, shade, rect, frame, box, card, txt, measure, typed, chip, line, arrow, path,
    sprite, icon, spriteSize, robot, person, bubble, win, msg, paper, bars, probBars, meter, stamp, table, flow,
    show, pop, pulse, blink, glow, sparkle, qmark, rnd,
    get T() { return T; },
    get ctx() { return c; }
  };
})();
