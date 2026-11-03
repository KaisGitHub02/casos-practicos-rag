/* =========================================================================
   Sibou Lab · Markdown mínimo y seguro
   Convierte los textos escritos por el profesorado (negrita, cursiva,
   código, enlaces, listas, párrafos, bloques de código y diagramas
   Mermaid) a HTML. Escapa siempre primero: nunca deja pasar una etiqueta
   HTML escrita a mano.
   ========================================================================= */
(function () {
  'use strict';
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = u => (/^https?:\/\//i.test(String(u || '')) ? String(u) : '#');

  /** Formato dentro de una línea: enlaces, negrita, cursiva, código. */
  function inline(line) {
    let s = esc(line);
    s = s.replace(/\[([^\[\]]+)\]\((https?:\/\/[^\s()]+)\)/g, (m, t, u) => `<a href="${safeUrl(u)}" target="_blank" rel="noopener noreferrer">${t}</a>`);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    return s;
  }

  /** Párrafos y listas con «-» o «1.» (sin bloques ```` ``` ````, ya extraídos por render()). */
  function renderBlocks(src) {
    if (!src.trim()) return '';
    return src.split(/\n{2,}/).map(block => {
      const lines = block.split('\n').filter(l => l.trim() !== '');
      if (!lines.length) return '';
      const isUl = lines.every(l => /^\s*[-*]\s+/.test(l));
      const isOl = !isUl && lines.every(l => /^\s*\d+[.)]\s+/.test(l));
      if (isUl) return '<ul>' + lines.map(l => `<li>${inline(l.replace(/^\s*[-*]\s+/, ''))}</li>`).join('') + '</ul>';
      if (isOl) return '<ol>' + lines.map(l => `<li>${inline(l.replace(/^\s*\d+[.)]\s+/, ''))}</li>`).join('') + '</ol>';
      return '<p>' + lines.map(inline).join('<br>') + '</p>';
    }).join('');
  }

  /**
   * Bloque completo: extrae primero los bloques de código ``` ``` (que pueden
   * tener líneas en blanco dentro) y reparte el resto en párrafos y listas.
   * ```mermaid ... ``` se convierte en un diagrama; cualquier otro lenguaje,
   * en un bloque de código con el texto literal (sin resaltado).
   */
  function render(text) {
    const src = String(text == null ? '' : text).replace(/\r\n/g, '\n');
    if (!src.trim()) return '';
    const FENCE = /```[ \t]*([\w-]*)\n([\s\S]*?)```/g;
    let out = '', last = 0, m;
    while ((m = FENCE.exec(src))) {
      out += renderBlocks(src.slice(last, m.index));
      const lang = (m[1] || '').toLowerCase(), code = m[2].replace(/\n$/, '');
      out += lang === 'mermaid' ? `<div class="mermaid">${esc(code)}</div>` : `<pre><code>${esc(code)}</code></pre>`;
      last = FENCE.lastIndex;
    }
    out += renderBlocks(src.slice(last));
    return out;
  }

  /** Convierte en diagrama los `.mermaid` presentes en `root` (si la librería Mermaid está cargada). */
  function renderDiagrams(root) {
    const scope = root || document;
    const w = typeof window !== 'undefined' ? window : null;
    if (!w || !w.mermaid) return;
    const nodes = Array.from(scope.querySelectorAll('.mermaid'));
    if (!nodes.length) return;
    try { w.mermaid.run({ nodes }); } catch (e) { /* diagrama inválido: se deja el texto escapado */ }
  }

  PL.md = { render, inline, renderDiagrams };
})();
