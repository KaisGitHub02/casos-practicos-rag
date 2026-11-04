/* ══════════════════════════════════════════
   Caso de hoy · Licitación del tutor de inglés con IA
   Plantilla económica simplificada: coste total a tres años por
   persona activa, con el contrato de la academia y el pico de uso.
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
  const WEEKS = 44;                             // semanas laborables con práctica
  const TUTOR = { grupo: 8, min: 45, eur: 38 }; // sesión mensual en grupo con tutor humano
  const ACADEMIA = { hoy: 1900000, personas: 2700, minimo: 760000 }; // anexo D
  const APP = 96;                               // licencia anual de app (anexo C)
  const OFERTA_ACADEMIA = 14 * 12;              // tutores con IA de la academia, por usuario y año
  const ARRANQUE = 0.5;                         // año 1: despliegue completo desde octubre
  const PICO = 0.3;                             // parte de la práctica semanal en las 10 horas punta

  const eur = (v) => {
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toLocaleString('es-ES', { maximumFractionDigits: 2 })} M€`;
    return v.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  };
  const eur4 = (v) => v.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 4, minimumFractionDigits: 4 });
  const num = (v) => Math.round(v).toLocaleString('es-ES');
  const get = (k) => host.querySelector(`[data-in="${k}"]`);
  const show = (k, v) => { const n = host.querySelector(`[data-out="${k}"]`); if (n) n.textContent = v; };

  function calc() {
    const emp = +get('emp').value, act = +get('act').value / 100, min = +get('min').value, voz = +get('voz').value / 100;
    const setup = +get('setup').value, fijo = +get('fijo').value, conTutor = get('tutor').checked;
    const m = LLM[get('modelo').value];
    const activos = emp * act;
    show('emp', num(emp)); show('act', `${Math.round(act * 100)} % · ${num(activos)} personas`); show('min', min + ' min'); show('voz', Math.round(voz * 100) + ' %'); show('setup', eur(setup)); show('fijo', eur(fijo));

    const minutos = activos * min * WEEKS;
    const porMinTexto = (TOK_IN * m.in + TOK_OUT * m.out) / 1e6;
    const porMinVoz = STT + TTS_CHARS * TTS / 1e6;
    const porMin = porMinTexto + voz * porMinVoz;
    const uso = minutos * porMin;
    const tutores = conTutor ? activos * 12 * (TUTOR.min / 60) * TUTOR.eur / TUTOR.grupo : 0;

    const filas = [
      ['Puesta en marcha', [setup, 0, 0]],
      ['Uso de modelos (voz y texto)', [uso * ARRANQUE, uso, uso]],
      ['Equipo, plataforma y soporte', [fijo, fijo, fijo]],
      ['Tutores humanos', [tutores * ARRANQUE, tutores, tutores]],
      ['Academia (mínimo del contrato)', [ACADEMIA.minimo, 0, 0]]
    ];
    const anio = [0, 1, 2].map((i) => filas.reduce((s, f) => s + f[1][i], 0));
    const tco = anio[0] + anio[1] + anio[2];
    const run = uso + fijo + tutores;
    const porActivo = run / activos;
    const porHora = run / (minutos / 60);
    const pico = activos * min * PICO / 600;
    const okAnio1 = anio[0] <= ACADEMIA.hoy;

    const comp = [
      ['Vuestra propuesta', porActivo, 'is-ia'],
      ['Academia hoy (2.700 personas)', ACADEMIA.hoy / ACADEMIA.personas, 'is-grupo'],
      ['Licencias de app, misma adopción', APP / act, 'is-uno'],
      ['Tutores IA de la academia, misma adopción', OFERTA_ACADEMIA / act, 'is-uno']
    ];
    const max = Math.max(...comp.map((c) => c[1]));
    const bar = (v, cls) => `<span class="calc-bar ${cls}"><i style="width:${Math.max(1, Math.min(100, v / max * 100)).toFixed(1)}%"></i></span>`;

    out.innerHTML = `
      <div class="calc-kpis">
        <div><span>TCO a tres años</span><b>${eur(tco)}</b><small>la academia, sin cambios: ${eur(ACADEMIA.hoy * 3)}</small></div>
        <div><span>Por persona activa y año</span><b>${eur(porActivo)}</b><small>${eur(porHora)} por hora de práctica</small></div>
        <div><span>Año 1 frente al límite de 1,9 M€</span><b class="${okAnio1 ? 'is-ok' : 'is-ko'}">${eur(anio[0])}</b><small>${okAnio1 ? 'cabe en el presupuesto' : 'excede el presupuesto: replanificad'}</small></div>
      </div>
      <table class="rfp-t calc-t">
        <thead><tr><th></th><th>Año 1</th><th>Año 2</th><th>Año 3</th></tr></thead>
        <tbody>${filas.map((f) => `<tr><td>${f[0]}</td>${f[1].map((v) => `<td>${v ? eur(v) : '—'}</td>`).join('')}</tr>`).join('')}
          <tr class="is-total"><td>Total</td>${anio.map((v) => `<td>${eur(v)}</td>`).join('')}</tr></tbody>
      </table>
      <h3 class="calc-h">Coste por persona activa y año</h3>
      <ul class="calc-rows">${comp.map((c) => `<li><span>${c[0]}</span>${bar(c[1], c[2])}<b>${eur(c[1])}</b></li>`).join('')}</ul>
      <p class="calc-pico"><b>Pico estimado: ~${num(pico)} sesiones de voz simultáneas.</b> El requisito N1 pide 2.000. ¿Lo aceptáis, lo negociáis o lo dimensionáis por tramos?</p>
      <details class="calc-sup"><summary>Supuestos de la plantilla</summary>
        <ul>
          <li>${num(minutos)} minutos de práctica al año (${WEEKS} semanas). Coste medio por minuto: ${eur4(porMin)}.</li>
          <li>Por minuto: ${num(TOK_IN)} tokens de entrada y ${TOK_OUT} de salida (${eur4(porMinTexto)} con el modelo ${get('modelo').value}); voz: ${eur4(STT)}/min de voz a texto y ${TTS_CHARS} caracteres de texto a voz a ${TTS} €/millón.</li>
          <li>Año 1: despliegue completo desde octubre (la mitad del uso) y mínimo del contrato de la academia (anexo D).</li>
          <li>Tutor humano: una sesión de ${TUTOR.min} min al mes en grupos de ${TUTOR.grupo} a ${TUTOR.eur} €/h.</li>
          <li>Pico: el ${Math.round(PICO * 100)} % de la práctica semanal cae en 10 horas punta.</li>
          <li>Las licencias y la oferta de la academia se pagan por persona con acceso, practique o no. El piloto de 2024 se quedó en un 6-11 % de personas activas.</li>
          <li>No incluye impuestos, tiempo de las personas en formación ni el examen externo de nivel.</li>
        </ul>
        <p>Precios inventados del orden de magnitud real en 2026. Vuestra oferta debe usar los vigentes de los proveedores que elijáis.</p>
      </details>`;
  }

  host.addEventListener('input', calc);
  host.addEventListener('change', calc);
  calc();
})();
