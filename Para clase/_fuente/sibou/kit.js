/* =========================================================================
   Sibou Lab · Registro de contenidos y piezas visuales reutilizables
   ========================================================================= */
(function () {
  'use strict';
  const D = PL.D;
  const { P, rect, frame, box, txt, chip, icon, measure, lerp, clamp } = D;

  /* ---------- registro ---------- */
  PL.blocks = [];
  PL.concepts = [];
  PL.block = b => { PL.blocks.push(b); };
  PL.concept = cpt => {
    const blk = PL.blocks.find(b => b.id === cpt.block);
    cpt.blockIndex = PL.blocks.indexOf(blk);
    PL.concepts.push(cpt);
  };

  const TOKEN_COLORS = [P.blue, P.orange, P.purple, P.mint, P.yellow, P.pink, P.teal, P.sky];

  /* ---------- piezas ---------- */
  const K = {
    TOKEN_COLORS,

    /** Franja inferior con una idea destacada */
    banner(s, o = {}) {
      const y = o.y == null ? 236 : o.y, x = o.x == null ? 16 : o.x, w = o.w || 448, h = o.h || 24;
      box(x, y, w, h, { fill: o.fill || P.ink, border: o.border || (o.color || P.yellow), shadow: false });
      let tx = x + w / 2;
      if (o.icon) { const tw = measure(s, o.size || 9) + 18; icon(o.icon, x + w / 2 - tw / 2 - 2, y + h / 2 - 6, 1, o.color || P.yellow); tx += 9; }
      txt(s, tx, y + h / 2 - (o.size || 9) / 2, { size: o.size || 9, color: o.color || P.yellow, align: 'center', maxW: w - 30, fit: true });
    },

    /** Título breve dentro del lienzo */
    heading(s, o = {}) {
      txt(s, o.x == null ? 240 : o.x, o.y == null ? 10 : o.y, { size: o.size || 11, color: o.color || P.yellow, align: o.align || 'center', maxW: o.maxW || 452, fit: true, weight: 700 });
    },

    /** Tarjeta de correo pequeña con etiqueta opcional */
    mail(x, y, o = {}) {
      const w = o.w || 50, h = o.h || 34;
      box(x, y, w, h, { fill: o.fill || P.white, shadow: o.shadow });
      icon('mail', x + 5, y + 5, 1, o.tint || P.navy);
      if (o.title) txt(o.title, x + 20, y + 6, { size: o.size || 7, color: P.ink, maxW: w - 24, fit: true });
      D.bars(x + 6, y + 20, w - 12, 2, { color: P.light, seed: o.seed || 3, gap: 5 });
      if (o.tag) chip(o.tag, x + w / 2, y + h - 4, { align: 'center', size: 6.5, fill: o.tagColor || (o.tag === 'spam' ? P.red : P.mint), h: 11, pad: 3 });
      return { w, h };
    },

    /** Ejes de un gráfico de dispersión */
    axes(x, y, w, h, xl, yl, o = {}) {
      rect(x, y, 2, h, o.color || P.light);
      rect(x, y + h - 2, w, 2, o.color || P.light);
      if (xl) txt(xl, x + w, y + h + 4, { size: 7.5, color: P.light, align: 'right' });
      if (yl) txt(yl, x + 5, y - 2, { size: 7.5, color: P.light });
    },

    dot(x, y, col, r = 3) { rect(x - r, y - r, r * 2, r * 2, P.ink); rect(x - r + 1, y - r + 1, r * 2 - 2, r * 2 - 2, col); },

    /** Círculo pixelado relleno */
    circle(cx, cy, r, col) {
      for (let j = -r; j <= r; j++) {
        const hw = Math.round(Math.sqrt(r * r - j * j));
        rect(cx - hw, cy + j, hw * 2, 1, col);
      }
    },

    /** Dial giratorio (0..1) */
    knob(cx, cy, r, v, o = {}) {
      K.circle(cx, cy, r + 2, P.ink);
      K.circle(cx, cy, r, o.fill || P.gray3);
      K.circle(cx, cy, r - 4, shade(o.fill || P.gray3, -0.25));
      const a = Math.PI * 0.75 + v * Math.PI * 1.5;
      D.line(cx, cy, cx + Math.cos(a) * (r - 3), cy + Math.sin(a) * (r - 3), o.color || P.yellow, 3);
      for (let i = 0; i <= 10; i++) {
        const b = Math.PI * 0.75 + (i / 10) * Math.PI * 1.5;
        rect(cx + Math.cos(b) * (r + 6) - 1, cy + Math.sin(b) * (r + 6) - 1, 2, 2, i / 10 <= v ? (o.color || P.yellow) : P.gray3);
      }
      if (o.label) txt(o.label, cx, cy + r + 10, { size: 8, align: 'center', color: P.light });
    },

    /** Fila de tokens (chips de colores). Devuelve posiciones */
    tokens(list, x, y, o = {}) {
      const gap = o.gap == null ? 3 : o.gap;
      let xx = x;
      const out = [];
      const widths = list.map(t => Math.round(measure(t.replace(/ /g, '·'), o.size || 9, { font: o.font || 'mono' }) + 10));
      const total = widths.reduce((a, b) => a + b, 0) + gap * (list.length - 1);
      if (o.align === 'center') xx = x - total / 2;
      list.forEach((t, i) => {
        const a = o.reveal ? o.reveal(i) : 1;
        const col = o.colors ? o.colors[i] : TOKEN_COLORS[i % TOKEN_COLORS.length];
        if (a > 0) D.show(a, () => chip(t.replace(/ /g, '·'), xx, y, { size: o.size || 9, fill: col, w: widths[i], font: o.font || 'mono', weight: 600 }), o.dy == null ? 4 : o.dy);
        out.push({ x: xx, w: widths[i], cx: xx + widths[i] / 2 });
        xx += widths[i] + gap;
      });
      return { items: out, w: total, x0: o.align === 'center' ? x - total / 2 : x };
    },

    /** Número dentro de un cuadrado */
    badge(n, x, y, col = P.orange, o = {}) {
      const s = o.s || 14;
      box(x, y, s, s, { fill: col, shadow: false });
      txt(String(n), x + s / 2, y + s / 2 - 4, { size: o.size || 8.5, color: P.ink, align: 'center', weight: 700 });
    },

    /** Línea de código monoespaciada con coloreado sencillo */
    code(lines, x, y, o = {}) {
      const size = o.size || 8, lh = o.lh || Math.round(size * 1.45);
      lines.forEach((ln, i) => {
        const a = o.reveal ? o.reveal(i) : 1;
        if (a <= 0) return;
        const item = typeof ln === 'string' ? { t: ln } : ln;
        D.show(a, () => {
          if (item.hl) rect(x - 3, y + i * lh - 2, (o.w || 200), lh, item.hl);
          txt(item.t, x, y + i * lh, { size, color: item.color || o.color || P.white, font: 'mono', weight: 500, maxW: o.maxW, fit: !!o.maxW });
          if (item.strike) rect(x, y + i * lh + size / 2, measure(item.t, size, { font: 'mono', weight: 500 }), 1.5, item.strike);
        }, 3);
      });
      return y + lines.length * lh;
    },

    /** Mini gráfico de barras vertical */
    vbars(x, y, w, h, vals, o = {}) {
      const n = vals.length, gap = o.gap || 4;
      const bw = (w - gap * (n - 1)) / n;
      vals.forEach((v, i) => {
        const a = o.reveal ? o.reveal(i) : 1;
        const bh = Math.max(1, h * clamp(v) * a);
        rect(x + i * (bw + gap), y + h - bh, bw, bh, P.ink);
        rect(x + i * (bw + gap) + 1, y + h - bh + 1, bw - 2, bh - 1, (o.colors && o.colors[i]) || o.color || P.blue);
        if (o.labels) txt(o.labels[i], x + i * (bw + gap) + bw / 2, y + h + 3, { size: 7, color: P.light, align: 'center', maxW: bw + gap, fit: true });
      });
      rect(x - 2, y + h, w + 4, 2, P.light);
    },

    /** Balanza: tilt -1..1 (positivo = baja la derecha) */
    scale(cx, y, tilt, left, right, o = {}) {
      const len = o.len || 90;
      const dy = tilt * 14;
      rect(cx - 2, y, 4, 46, P.light);
      rect(cx - 16, y + 44, 32, 5, P.light);
      D.line(cx - len, y + 4 - dy, cx + len, y + 4 + dy, P.light, 3);
      [[-1, left, -dy], [1, right, dy]].forEach(([s, item, d]) => {
        const px = cx + s * len;
        D.line(px, y + 4 + d, px - 18, y + 26 + d, P.navy, 1);
        D.line(px, y + 4 + d, px + 18, y + 26 + d, P.navy, 1);
        rect(px - 24, y + 26 + d, 48, 4, P.light);
        if (item) item(px, y + 26 + d);
      });
    },

    /** Escalera de pasos numerados */
    ticket(x, y, label, o = {}) {
      const w = o.w || 60, h = o.h || 20;
      box(x, y, w, h, { fill: o.fill || P.paper, shadow: false });
      rect(x + 3, y + 3, 3, h - 6, o.color || P.orange);
      txt(label, x + 10, y + h / 2 - 3.5, { size: 7, color: P.ink, maxW: w - 14, fit: true });
    }
  };

  function shade(hex, amt) { return D.shade(hex, amt); }

  PL.K = K;
})();
