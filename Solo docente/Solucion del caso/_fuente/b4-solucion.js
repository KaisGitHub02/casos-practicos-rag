/* =========================================================================
   Caso práctico del Bloque 4 · Solución maestra
   NO es accesible directamente: la sirve api/index.php?a=caso_solucion&id=b4
   solo a administradores, o al alumnado si «b4» está en «casos_abiertos»
   de api/config.php. Requiere que js/content/caso-b4.js ya esté cargado.
   ========================================================================= */
(function () {
  'use strict';
  const D = PL.D, K = PL.K;
  const { P, rect, box, card, txt, chip, arrow, icon, robot, bubble, show } = D;
  const { banner } = K;

  /* ---------------- viñetas de la solución ---------------- */
  const PANELS_SOL = [
    {
      title: 'El mapa de trampas',
      caption: 'Dónde estaba cada trampa del caso y qué comprobación la desactiva.',
      steps: [
        'Versión caducada: la política de 2024 no dice que esté derogada. Se detecta con la fecha y la versión (A·F·V).',
        'Fuente de poca autoridad: la FAQ de la web está desactualizada y contradice la política vigente.',
        'Excepción lejana: la temporada alta (§7) está a cinco apartados de la tabla (§2).',
        'Información reciente: el acta cambia los gastos de gestión antes de que se actualice la política.',
        'Datos personales: la exportación del CRM no debe subirse; lo prohíbe el propio manual (§6).'
      ],
      draw(g) {
        const T = [
          ['POLÍTICA 2024', 'versión caducada', 'fecha + versión', P.orange],
          ['FAQ WEB', 'poca autoridad', 'autoridad', P.orange],
          ['POLÍTICA v3 §7', 'excepción lejana', 'leer toda la norma', P.yellow],
          ['ACTA 28/10', 'dato reciente', 'fecha de efecto', P.sky],
          ['CRM', 'datos personales', 'no subir', P.red]
        ];
        T.forEach((t, i) => show(g.at(i), () => {
          const y = 12 + i * 44;
          card(14, y, 140, 38, t[0], t[3], { size: 7.5, active: g.on(i) });
          icon('doc', 20, y + 20, 1);
          arrow(158, y + 19, 186, y + 19, { color: P.light, head: 4 });
          chip(t[1], 190, y + 8, { fill: P.gray2, color: P.white, size: 8.5, w: 130, h: 22 });
          arrow(324, y + 19, 344, y + 19, { color: P.light, head: 4 });
          chip(t[2], 348, y + 8, { fill: P.mint, size: 8.5, w: 118, h: 22, icon: 'check', iconTint: P.ink });
        }));
      }
    },
    {
      title: 'La pregunta 2, paso a paso',
      caption: 'Cómo debería resolverse una pregunta cuya respuesta depende de dos apartados alejados.',
      steps: [
        'Pregunta: paquete de 2.000 € que sale el 10/8/2027, cancelado con 20 días.',
        'La búsqueda encuentra la tabla del §2: entre 15 y 30 días → 70 % (1.400 €). Respuesta incompleta.',
        'Si también recupera el §7 (temporada alta, del 15/7 al 31/8), el tramo baja al 50 %.',
        'Respuesta correcta: 1.000 €, citando §2 y §7. Si la herramienta solo cita §2, la verificación lo detecta.'
      ],
      draw(g) {
        show(g.at(0), () => { box(14, 10, 452, 30, { fill: P.blue }); txt('2.000 € · salida 10/08/2027 · cancela con 20 días', 240, 19, { size: 9, color: P.ink, align: 'center', font: 'sans' }); });
        show(g.at(1), () => { card(14, 54, 210, 92, 'POLÍTICA v3 › §2', P.teal); txt('Entre 15 y 30 días → 70 %', 24, 80, { size: 9, font: 'sans' }); txt('= 1.400 €', 24, 100, { size: 11, color: g.from(2) ? P.red : P.yellow, weight: 700 }); if (g.from(2)) rect(22, 106, 70, 2, P.red); });
        show(g.at(2), () => { card(256, 54, 210, 92, 'POLÍTICA v3 › §7', P.yellow); txt('Del 15/7 al 31/8: el tramo de', 266, 80, { size: 9, font: 'sans' }); txt('15-30 días pasa al 50 %', 266, 96, { size: 9, font: 'sans' }); arrow(254, 100, 228, 100, { color: P.yellow }); });
        show(g.at(3), () => {
          robot(30, 166, { s: 2, mood: 'happy', color: P.purple });
          bubble(76, 160, 250, 46, { text: 'Al ser temporada alta, se devuelve el 50 %: 1.000 € [§2][§7].', tx: 70, ty: 182, size: 8.5, font: 'sans' });
          icon('check', 340, 172, 2);
          banner('Una respuesta, dos apartados, dos citas', { y: 236 });
        });
      }
    }
  ];

  /* ---------------- solución maestra ---------------- */
  const SOL = {
    resumen: 'Un buen trabajo **no se mide por el número de respuestas acertadas, sino por cuántas se pueden demostrar**. La solución maestra deja en el cuaderno solo las fuentes vigentes y autorizadas (política v3.0, manual y acta), excluye la exportación del CRM por contener datos personales y usa la política de 2024 y la FAQ únicamente para el experimento de contaminación. Las ocho preguntas tienen una respuesta exacta con cita; en tres de ellas (2, 4 y 5) la respuesta correcta depende de leer más allá del primer fragmento.',
    fuentes: [
      ['01 · Política v3.0', 'Subir', 'ok', 'Fuente oficial, aprobada y vigente desde el 01/03/2026. Es la base de todas las respuestas sobre importes y plazos.'],
      ['02 · Política 2024', 'No subir (o solo desmarcada, para la fase 4)', 'warn', 'Es la versión 2.1, sustituida por la 3.0 (lo dice la propia v3.0). El archivo no indica que esté derogada: hay que deducirlo por versión y fecha. Si se deja marcada, contamina las respuestas (75 %, 30 días, 35 €).'],
      ['03 · FAQ web', 'No subir (o solo desmarcada, para la fase 4)', 'warn', 'Autoridad baja (resumen comercial) y desactualizada (noviembre de 2025). Contradice la política vigente en plazos, gastos y precio del seguro. Útil para detectar qué hay que corregir en la web, no como fuente de verdad.'],
      ['04 · Manual de atención v1.4', 'Subir', 'ok', 'Documento interno vigente con procedimientos (escalado, fuerza mayor, horarios). No contiene importes: remite a la política.'],
      ['05 · Acta del 28/10/2026', 'Subir', 'ok', 'Contiene decisiones recientes que todavía no están en la política (gastos de gestión de 15 € desde el 01/12/2026; seguro de 45 € desde el 01/01/2027). Hay que citarla indicando su fecha de efecto.'],
      ['06 · Reclamaciones del CRM', 'No subir nunca', 'ko', 'Contiene nombres, DNI, teléfonos, correos y datos de salud (hospitalización). El §6 del manual prohíbe copiar datos de clientes en chats de IA no aprobados. Además, no aporta nada a las preguntas del equipo.']
    ],
    respuestas: [
      {
        n: 1, respuesta: '**840 €** (el 70 % de 1.200 €).',
        calculo: 'Del 10/11/2026 al 01/12/2026 hay 21 días → tramo «entre 15 y 30 días» → 70 %. 1.200 × 0,70 = 840 €. No es temporada alta y no hay gastos de gestión en ese tramo.',
        cita: 'Política v3.0 › §2: «Entre 15 y 30 días | 70 %».',
        trampa: 'Con la política de 2024 marcada, la herramienta puede responder 75 % (900 €). Si la cita apunta a «Versión 2.1 · 2024», el veredicto A·F·V es «desactualizada».',
        veredicto: 'Respuesta típica correcta y bien citada: **respalda**.'
      },
      {
        n: 2, respuesta: '**1.000 €** (el 50 % de 2.000 €).',
        calculo: '20 días → tramo «entre 15 y 30 días». La salida (10/08/2027) está entre el 15/7 y el 31/8 → temporada alta: ese tramo baja al 50 %. 2.000 × 0,50 = 1.000 €.',
        cita: 'Política v3.0 › §2 (tabla) **y** §7: «el tramo "Entre 15 y 30 días" de la tabla del §2 pasa a ser del 50 %».',
        trampa: 'Excepción lejana: la regla está en el §2 y la excepción, cinco apartados después. Es frecuente que la herramienta responda 1.400 € citando solo el §2. Una respuesta que cita solo el §2 «respalda en parte»: el sujeto y la regla coinciden, pero faltan las condiciones (S·R·**C**).',
        veredicto: 'Si responde 1.400 € con cita al §2: **respalda en parte** → la respuesta es incorrecta. Fallo de recuperación (el §7 no llegó) o de generación (llegó y no lo aplicó): abre las citas para saberlo.'
      },
      {
        n: 3, respuesta: 'En un **máximo de 14 días naturales** desde que se acepta la cancelación, por el mismo medio de pago.',
        calculo: 'No hay cálculo. Ojo a «naturales» (no «hábiles») y a «desde que se acepta» (no «desde que el cliente cancela»).',
        cita: 'Política v3.0 › §3: «se abona en un máximo de 14 días naturales desde que Viajes Lunaria acepta la cancelación».',
        trampa: 'La FAQ («normalmente, en un plazo de 30 días») y la política de 2024 («30 días») contradicen la vigente. Si aparecen las tres, la respuesta debe señalar la contradicción y priorizar la v3.0 por autoridad, fecha y versión.',
        veredicto: '«14 días hábiles» con cita al §3: **respalda en parte** (cambia la unidad). «30 días» con cita a la FAQ: **desactualizada**.'
      },
      {
        n: 4, respuesta: '**No hay reembolso**, ni siquiera por fuerza mayor. Se le puede ofrecer **cambiar la fecha una sola vez pagando 30 €**, si el nuevo viaje es en los 6 meses siguientes. El seguro tampoco cubre esta tarifa.',
        calculo: 'No hay cálculo.',
        cita: 'Política v3.0 › §4, segundo párrafo: «Las reservas con tarifa "Última hora" no son reembolsables en ningún caso, tampoco por fuerza mayor…» y §5: «No se aplica a la tarifa "Última hora"».',
        trampa: 'La excepción de la excepción. El primer párrafo del §4 (fuerza mayor → 100 %) se parece mucho a la pregunta; el segundo lo anula para esta tarifa. Si el corte o la respuesta se quedan con el primer párrafo, se promete un reembolso del 100 % que no corresponde. La política de 2024 también dice «100 % con cualquier tarifa».',
        veredicto: '«100 % por fuerza mayor» citando el §4: **contradice** (la misma fuente, leída entera, dice lo contrario).'
      },
      {
        n: 5, respuesta: '**785 €** (800 € menos 15 € de gastos de gestión), según el acta del 28/10/2026. Conviene confirmar que Operaciones ha publicado la versión 3.1 de la política, porque la v3.0 todavía dice 25 € (775 €).',
        calculo: 'Del 15/12/2026 al 20/02/2027 hay 67 días → «más de 30 días» → 100 % menos gastos de gestión. Desde el 01/12/2026, los gastos son 15 €: 800 − 15 = 785 €.',
        cita: 'Acta del 28/10/2026 › Acuerdo 1 («a partir del 1 de diciembre de 2026, los gastos de gestión… bajan de 25 € a 15 €») + Política v3.0 › §2 (estructura del tramo).',
        trampa: 'Información reciente. La política vigente hoy dice 25 €; el acta cambia el dato con fecha de efecto futura. Una respuesta de 775 € citando solo la política no es «inventada», pero estará desactualizada en la fecha de la cancelación. La FAQ dice «sin gastos» (800 €).',
        veredicto: 'Respuesta excelente: da el importe, cita las dos fuentes y menciona la fecha de efecto. 775 € citando solo la política: **respalda en parte** (cita correcta, condición temporal ignorada).'
      },
      {
        n: 6, respuesta: '**La política de cancelaciones no se aplica.** Los billetes sueltos se rigen por las condiciones de la aerolínea, que hay que consultar en la reserva. No se puede dar un porcentaje.',
        calculo: 'No hay cálculo.',
        cita: 'Política v3.0 › §1: «No se aplica a los billetes de avión, tren o autobús vendidos por separado: se rigen por las condiciones de cada transportista».',
        trampa: 'Ámbito. La pregunta comparte casi todas las palabras con el §2 («cancelar», «porcentaje», «devolver») y la herramienta puede aplicar la tabla. Es un error de **sujeto** (S·R·C): un billete suelto no es un paquete.',
        veredicto: 'Un porcentaje con cita al §2: **no respalda** (el sujeto de la cita es otro).'
      },
      {
        n: 7, respuesta: '**No consta** en la documentación. Las fuentes solo mencionan a la responsable de **atención al cliente** (Marta Ruiz, extensión 214) para los escalados, que no es lo mismo que una responsable de calidad.',
        calculo: 'No hay cálculo.',
        cita: 'Ninguna para el teléfono pedido. Manual › §5 para la extensión de atención al cliente, si se menciona como alternativa.',
        trampa: 'Pregunta sin respuesta con un «vecino» muy parecido. Es fácil que la herramienta conteste «extensión 214» como si fuera la de calidad: cita **mal atribuida** o de sujeto distinto.',
        veredicto: '«Extensión 214» presentada como el teléfono de calidad: **no respalda**. «No consta; para escalados, extensión 214 (atención al cliente)»: correcta.'
      },
      {
        n: 8, respuesta: '**Escalar a la responsable de atención al cliente (Marta Ruiz, ext. 214) en un máximo de 24 horas**, porque supera los 500 € y menciona la OMIC. No ofrecer compensaciones ni descuentos sin su aprobación. Registrar el caso.',
        calculo: 'Dos condiciones de escalado se cumplen a la vez: importe superior a 500 € y mención a la OMIC.',
        cita: 'Manual v1.4 › §5: «Escala… en un plazo máximo de 24 horas cuando: la reclamación supere los 500 €; el cliente mencione abogados, la OMIC…» y «No ofrezcas compensaciones ni descuentos sin su aprobación».',
        trampa: 'Pocas: es la pregunta de control. Vigila que la respuesta no invente un procedimiento genérico (por ejemplo, «envía un formulario de reclamación») que no está en el manual.',
        veredicto: 'Respuesta típica correcta y bien citada: **respalda**.'
      }
    ],
    contaminacion: [
      'P1 pasa de 840 € a **900 €** (75 %) o a una respuesta ambigua «entre el 70 % y el 75 %».',
      'P3 pasa de 14 días a **30 días**, o a «entre 14 y 30 días», a menudo citando la FAQ o la v2.1.',
      'P5 puede pasar a **800 €** («sin gastos», según la FAQ y la v2.1).',
      'Conclusión: **RAG hereda los problemas de las fuentes**. La herramienta no sabe cuál está vigente si nadie se lo dice. La solución no es «preguntar mejor», sino retirar las fuentes caducadas o marcarlas con metadatos de vigencia.'
    ],
    diagnostico: [
      ['P2 responde 1.400 €', 'Recuperación (si el §7 no aparece en las citas) o generación (si aparece y no se aplica)', 'Trocear por apartados heredando el título; reordenar; instrucción: «aplica siempre las excepciones de temporada alta»; añadir la pregunta al banco de pruebas.'],
      ['P3 responde 30 días', 'Fuentes: hay versiones caducadas en la colección', 'Retirar v2.1 y FAQ, o filtrar por metadato «vigente».'],
      ['P4 promete el 100 %', 'Generación (se queda con el primer párrafo del §4) o corte que separa los dos párrafos', 'Mantener cada apartado entero en un fragmento; instrucción: «revisa si la tarifa tiene condiciones propias».'],
      ['P5 responde 775 €', 'Fuentes: dato reciente fuera de la política', 'Publicar la v3.1; mientras tanto, mantener el acta como fuente con su fecha de efecto.'],
      ['P6 da un porcentaje', 'Generación: sujeto distinto (billete frente a paquete)', 'Instrucción: «comprueba el ámbito (§1) antes de aplicar la tabla»; pregunta de ámbito en el banco.'],
      ['P7 da la extensión 214', 'Generación: anclaje débil, completa con un vecino parecido', 'Instrucción de «no consta» explícita y revisión de citas mal atribuidas.']
    ],
    instrucciones: `Eres el asistente interno de consulta del equipo de atención al cliente de Viajes Lunaria.

FUENTES
- Responde SOLO con la información de las fuentes del cuaderno.
- Prioridad: 1) acuerdos del acta con fecha de efecto, 2) Política de cancelaciones v3.0, 3) Manual de atención v1.4.
- Si una fuente tiene fecha de efecto futura, dilo y da el dato que corresponde a la fecha de la cancelación.

CÓMO RESPONDER
- Empieza por la respuesta (importe, plazo o acción) en una frase.
- Después, el cálculo paso a paso si hay importes: días hasta la salida, tramo, porcentaje, gastos.
- Cita la fuente y el apartado tras cada afirmación: [Política v3.0 §2].
- Antes de aplicar la tabla, comprueba: ámbito (§1), tarifa «Última hora» (§4), seguro (§5) y temporada alta (§7).

LÍMITES
- Si las fuentes no contienen la respuesta, di «No consta en la documentación» y propone escalar.
- Si dos fuentes se contradicen, muéstralo.
- No inventes importes, teléfonos, plazos ni procedimientos.
- No pidas ni repitas datos personales de clientes.`,
    metadatos: `{
  "doc_id": "politica-cancelaciones",
  "version": "3.0",
  "estado": "vigente",              // vigente | derogada | borrador
  "vigente_desde": "2026-03-01",
  "vigente_hasta": null,
  "autoridad": "Dirección de Operaciones",
  "tipo": "politica",               // politica | manual | acta | faq
  "apartado": "§7 Temporada alta",
  "ruta": "Política de cancelaciones v3.0 › §7 Temporada alta",
  "permisos": ["atencion", "operaciones"],
  "contiene_datos_personales": false
}`,
    troceado: [
      '**Un fragmento por apartado** (§1 a §8): son cortos y cada uno es una unidad de sentido. No usar tamaño fijo: partiría el §4 entre sus dos párrafos.',
      '**La tabla del §2 entera en un fragmento**, con su encabezado. Si se trocea por filas, repetir «Días antes de la salida | Reembolso» en cada una.',
      '**Heredar la ruta de títulos** en cada fragmento: «Política de cancelaciones v3.0 › §7 Temporada alta».',
      '**Enlazar excepciones con su regla**: añadir al fragmento del §2 una nota «Ver excepciones en §4 (fuerza mayor, Última hora), §5 (seguro) y §7 (temporada alta)», o recuperar siempre §4, §5 y §7 cuando se recupera el §2.',
      '**Metadatos de vigencia** para filtrar: la v2.1 queda como «derogada» y no se recupera.',
      '**El acta**, un fragmento por acuerdo, con su fecha de efecto como metadato.'
    ],
    banco: [
      ['Cancelación a 45 días de un paquete de 600 € (salida en marzo de 2027)', '585 € (100 % − 15 €)', 'Acta ac. 1 + Política §2'],
      ['Cancelación a 10 días de un paquete de 1.000 €', '400 € (40 %)', 'Política §2'],
      ['Cancelación a 20 días de un viaje del 20 de julio de 2027 (900 €)', '450 € (50 %, temporada alta)', 'Política §2 + §7'],
      ['Cliente con seguro que cancela 3 días antes por motivos laborales justificados', '100 %', 'Política §5'],
      ['¿Puedo ceder mi plaza a mi hermano 5 días antes?', 'No sin coste: solo hasta 7 días antes', 'Política §6'],
      ['¿Atendéis los sábados de agosto?', 'No: en julio y agosto, los sábados está cerrado', 'Manual §2'],
      ['¿Cuántas reclamaciones tuvimos en octubre?', 'No consta (y no debe constar: datos del CRM)', '—'],
      ['¿Ampliamos la temporada alta a Semana Santa?', 'No hay decisión; pendiente de informe en enero', 'Acta ac. 3']
    ],
    plan1dic: 'El 1 de diciembre de 2026 hay que: 1) añadir al cuaderno la versión 3.1 de la política en cuanto se publique; 2) **retirar o desmarcar la v3.0**; 3) mantener el acta mientras haya acuerdos sin incorporar (el seguro de 45 € entra el 01/01/2027); 4) volver a pasar el banco de pruebas completo; y 5) pedir a Marketing que corrija la FAQ de la web, que sigue diciendo 30 días, «sin gastos» y 35 €.',
    rubrica: [
      ['Selección de fuentes y privacidad', '1,5', 'Excluye el CRM y explica por qué (datos personales, manual §6). Identifica v2.1 y FAQ como caducadas o de poca autoridad. Justifica cada decisión con A·F·V.', 'Excluye el CRM pero no justifica las demás decisiones, o deja marcadas fuentes caducadas sin darse cuenta.', 'Sube los seis documentos.'],
      ['Respuestas correctas (P1-P8)', '3', '7-8 correctas, con cálculo explícito y acotando la P5 (fecha de efecto).', '5-6 correctas; falla alguna de las trampas (P2, P4, P5, P6 o P7).', '4 o menos.'],
      ['Verificación de citas', '2', 'Abre todas las citas, aplica S·R·C y A·F·V y da un veredicto razonado; detecta al menos una cita «respalda en parte» o «no respalda».', 'Abre las citas, pero los veredictos son genéricos («está bien»).', 'No abre las citas o se limita a contarlas.'],
      ['Diagnóstico', '1,5', 'Separa recuperación y generación con evidencia (qué fragmentos aparecieron) y propone un arreglo concreto para cada fallo.', 'Diagnostica, pero sin apoyarse en lo que muestran las citas.', 'No diagnostica o atribuye todo a «la IA se equivoca».'],
      ['Diseño para producción', '2', 'Instrucciones con anclaje, prioridad de fuentes y «no consta»; metadatos de vigencia y permisos; troceado por apartados; banco con al menos 6 preguntas que incluyan trampas; plan para el 1 de diciembre.', 'Incluye la mayoría de las piezas, pero el banco solo tiene preguntas fáciles o faltan los metadatos de vigencia.', 'Instrucciones genéricas («sé preciso») sin anclaje ni banco de pruebas.']
    ],
    errores: [
      'Subir los seis documentos «para que tenga más información».',
      'Dar por buena la respuesta de la P2 porque «tiene cita».',
      'Contar días mal (incluir o excluir el día de salida sin criterio). Para este caso basta con ser coherente; lo importante es el tramo.',
      'Confundir «respalda en parte» con «respalda»: un dato correcto con una condición omitida produce una respuesta incorrecta.',
      'Atribuir todos los fallos al modelo sin mirar qué fragmentos se recuperaron.',
      'Escribir instrucciones del tipo «sé preciso y no inventes» sin decir qué hacer cuando no consta.'
    ],
    profesorado: [
      '**Duración orientativa:** 2 horas (15 + 10 + 40 + 15 + 15 + 20 minutos) más 5 minutos de cierre. En sesiones cortas, haced las fases 1-4 en clase y la 6 como tarea.',
      '**Organización:** parejas. Una persona pregunta y la otra verifica las citas; se intercambian a mitad de la fase 3.',
      '**Resultados variables:** Gemini Notebook no siempre falla en las mismas preguntas. Si una trampa no «salta», pedid al alumnado que explique por qué la herramienta la resolvió (qué fragmentos citó). Es igual de valioso.',
      '**Variante avanzada:** repetir la fase 3 con un Gem de Gemini o un proyecto de otra herramienta con los mismos archivos y comparar la calidad de las citas.',
      '**Cierre sugerido:** pedir a cada pareja la cita que más le costó verificar y por qué.'
    ]
  };

  PL.practicas.b4.solucion = Object.assign({ panels: PANELS_SOL }, SOL);
})();
