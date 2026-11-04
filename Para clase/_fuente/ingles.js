/* ══════════════════════════════════════════
   Caso de hoy · Profesor de inglés con IA
   Calculadora de costes: IA frente a profesores nativos.
   Los precios son orientativos para el ejercicio (orden de magnitud
   realista); los grupos deben verificar los vigentes de cada proveedor.
   ══════════════════════════════════════════ */

(() => {
  'use strict';

  const host = document.querySelector('[data-calc]');
  const out = document.querySelector('[data-calc-out]');
  if (!host || !out) return;

  /* Supuestos (€). Tokens por minuto de práctica: contexto, historial y fragmentos de RAG + respuesta del tutor */
  const LLM = { 'pequeño': { in: 0.15, out: 0.6 }, mediano: { in: 1, out: 4 }, grande: { in: 3, out: 15 } };
  const TOK_IN = 1500, TOK_OUT = 250;           // por minuto de práctica
  const STT = 0.006;                            // voz a texto, por minuto
  const TTS = 15, TTS_CHARS = 450;              // texto a voz: €/millón de caracteres y caracteres por minuto
  const WEEKS = 40;
  const NATIVO_GRUPO = 38, GRUPO = 6, NATIVO_1A1 = 55;
  const HOY = { gasto: 1900000, personas: 2700 };

  const eur = (v, d = 0) => v.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: d, minimumFractionDigits: d });
  const num = (v) => Math.round(v).toLocaleString('es-ES');
  const get = (k) => host.querySelector(`[data-in="${k}"]`);
  const show = (k, v) => { const n = host.querySelector(`[data-out="${k}"]`); if (n) n.textContent = v; };

  function calc() {
    const emp = +get('emp').value, min = +get('min').value, voz = +get('voz').value / 100, fijo = +get('fijo').value;
    const m = LLM[get('modelo').value];
    show('emp', num(emp)); show('min', min + ' min'); show('voz', Math.round(voz * 100) + ' %'); show('fijo', eur(fijo));

    const minutos = emp * min * WEEKS;
    const porMinTexto = (TOK_IN * m.in + TOK_OUT * m.out) / 1e6;
    const porMinVoz = STT + TTS_CHARS * TTS / 1e6;
    const porMin = porMinTexto + voz * porMinVoz;
    const variable = minutos * porMin;
    const ia = variable + fijo;
    const horas = emp * min * WEEKS / 60;
    const grupo = horas / GRUPO * NATIVO_GRUPO;
    const uno = horas * NATIVO_1A1;
    const hoyPorPersona = HOY.gasto / HOY.personas;
    const max = Math.max(ia, grupo);
    const bar = (v, cls) => `<span class="calc-bar ${cls}"><i style="width:${Math.max(1, Math.min(100, v / max * 100)).toFixed(1)}%"></i></span>`;

    out.innerHTML = `
      <div class="calc-kpis">
        <div><span>Coste IA al año</span><b>${eur(ia)}</b><small>${eur(variable)} de uso + ${eur(fijo)} fijos</small></div>
        <div><span>Por empleado y año</span><b>${eur(ia / emp)}</b><small>hoy: ${eur(hoyPorPersona)} por persona formada</small></div>
        <div><span>Ahorro frente a clases en grupo</span><b class="${grupo > ia ? 'is-ok' : 'is-ko'}">${grupo > ia ? '−' : '+'}${Math.abs(Math.round((1 - ia / grupo) * 100))} %</b><small>con las mismas horas de práctica</small></div>
      </div>
      <h3 class="calc-h">Las mismas ${num(horas)} horas de práctica al año</h3>
      <ul class="calc-rows">
        <li><span>Tutor con IA</span>${bar(ia, 'is-ia')}<b>${eur(ia)}</b></li>
        <li><span>Nativo, grupos de ${GRUPO} a ${NATIVO_GRUPO} €/h</span>${bar(grupo, 'is-grupo')}<b>${eur(grupo)}</b></li>
        <li><span>Nativo, 1 a 1 a ${NATIVO_1A1} €/h</span>${bar(uno, 'is-uno')}<b>${eur(uno)}${uno > max ? ` <em>(×${(uno / max).toFixed(0)})</em>` : ''}</b></li>
      </ul>
      <details class="calc-sup"><summary>Supuestos de la calculadora</summary>
        <ul>
          <li>${num(minutos)} minutos de práctica al año (${WEEKS} semanas).</li>
          <li>Por minuto: ${num(TOK_IN)} tokens de entrada y ${TOK_OUT} de salida → ${eur(porMinTexto, 4)} con el modelo ${get('modelo').value}.</li>
          <li>Voz: ${eur(STT, 3)}/min de voz a texto + ${TTS_CHARS} caracteres de texto a voz a ${TTS} €/millón → ${eur(porMinVoz, 4)} por minuto hablado.</li>
          <li>Coste medio por minuto: ${eur(porMin, 4)}.</li>
          <li>No incluye: desarrollo inicial (amortizadlo en «plataforma»), tutores humanos de apoyo, licencias de evaluación certificada ni impuestos.</li>
        </ul>
        <p>Precios inventados del orden de magnitud real en 2026. Vuestro plan debe usar los vigentes de los proveedores que elijáis.</p>
      </details>`;
  }

  host.addEventListener('input', calc);
  host.addEventListener('change', calc);
  calc();
})();
