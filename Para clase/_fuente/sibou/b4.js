/* Bloque 4 · RAG, embeddings y Gemini Notebook */
(function () {
  'use strict';
  const D = PL.D, K = PL.K;
  const { P, rect, frame, box, card, txt, chip, arrow, path, icon, sprite, robot, person, bubble, win, msg, paper, bars, probBars, meter, stamp, table, flow, show, pop, pulse, blink, glow, sparkle, qmark, typed, lerp, ease, clamp, line, measure, rnd } = D;
  const { banner, heading, mail, axes, dot, circle, knob, tokens, badge, code, vbars, scale, ticket } = K;
  const late = a => clamp(a * 2 - 1);

  PL.block({
    id: 'b4', n: 4, short: 'RAG y Gemini Notebook', title: 'RAG, embeddings y Gemini Notebook', hours: 6, color: '#3cc6c6',
    question: '¿Cómo responde una IA sobre fuentes propias sin inventar?',
    evidence: 'Cuaderno de Gemini Notebook con fuentes vigentes, respuestas citadas y verificadas',
    idea: 'Un modelo responde con lo que aprendió, no con tus documentos. RAG busca primero los fragmentos relevantes de fuentes autorizadas, los pone delante del modelo y le pide que responda solo con ellos y citando. Cada pieza del camino —trocear, buscar, filtrar, redactar, citar— puede fallar, y por eso se aprende a diagnosticarla.',
    intro: [
      'Este bloque responde a una pregunta muy práctica: **¿cómo consigo que una IA conteste sobre mis documentos sin inventar?** Empezamos por el problema: un modelo de lenguaje no consulta nada, predice texto. Ante una pregunta sobre algo privado, reciente o muy concreto no tiene un «no lo sé» automático y produce la respuesta más probable, que puede ser una invención con apariencia de dato.',
      'Después abrimos la caja y vemos las piezas una a una:\n\n- **Embeddings**: cómo se convierte un texto en una lista de números para medir parecidos de significado (y qué se les escapa).\n- **Chunking**: cómo y dónde trocear un documento para que cada fragmento conserve su sentido.\n- **Índices vectoriales**: cómo se encuentra en milisegundos lo más parecido entre millones de fragmentos, y cómo se filtra por fecha y permisos.\n- **El prompt aumentado**: qué texto recibe de verdad el modelo y qué instrucciones le impiden rellenar huecos.',
      'Con todo eso montamos el flujo completo de **RAG** y aprendemos a **evaluarlo**: distinguir si un error viene de la búsqueda o de la redacción. Cerramos con lo que convierte una **cita** en prueba y con un taller en **Gemini Notebook** (antes NotebookLM).\n\nEl bloque termina con un **caso práctico**: el equipo de atención al cliente de una agencia de viajes necesita un cuaderno fiable, y sus documentos esconden versiones caducadas, excepciones lejanas, contradicciones y un archivo que no debería subirse nunca.'
    ]
  });

  /* huella vectorial en barras */
  function vec(x, y, seed, w = 60, h = 14, col = P.teal) {
    for (let i = 0; i < 10; i++) { const v = rnd(seed * 13 + i); rect(x + i * (w / 10), y + h - v * h, w / 10 - 1, v * h, col); }
  }
  /* paquete que recorre una ruta en bucle; t en segundos (D.T) */
  function packet(pts, period, col = P.yellow, phase = 0, size = 4) {
    const segs = []; let total = 0;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(d); total += d; }
    let left = (((D.T + phase) % period) / period) * total;
    for (let i = 0; i < segs.length; i++) {
      if (left <= segs[i]) { const f = left / segs[i]; const x = lerp(pts[i][0], pts[i + 1][0], f), y = lerp(pts[i][1], pts[i + 1][1], f); rect(x - size / 2 - 1, y - size / 2 - 1, size + 2, size + 2, P.ink); rect(x - size / 2, y - size / 2, size, size, col); return; }
      left -= segs[i];
    }
  }
  /* posición intermedia entre dos puntos según el avance p (0-1), con suavizado */
  const mix = (a, b, p) => [lerp(a[0], b[0], ease(clamp(p))), lerp(a[1], b[1], ease(clamp(p)))];

  /* bloque de texto con barra de color a la izquierda (instrucciones, fragmentos, pregunta) */
  function slab(x, y, w, h, label, col, lines) {
    box(x, y, w, h, { fill: P.gray2, shadow: false });
    rect(x + 2, y + 2, 5, h - 4, col);
    txt(label, x + 13, y + 5, { size: 7.5, color: col, weight: 700 });
    (lines || []).forEach((l, i) => txt(l, x + 13, y + 18 + i * 12, { size: 8, color: P.white, maxW: w - 20, fit: true, font: 'sans' }));
  }

  /* ------------------------------------------------------------------ */
  PL.concept({
    id: 'problema-fuentes', block: 'b4', slide: 'S2', title: 'Una IA general no conoce tus fuentes',
    idea: 'Un modelo de lenguaje responde con lo que aprendió al entrenarse; no consulta tus documentos. Ante algo privado, reciente o muy específico no tiene un «no lo sé» automático: genera la continuación más probable, que puede ser una invención con forma de dato.',
    explain: [
      '**Qué «sabe» un modelo.** Durante el entrenamiento, un modelo de lenguaje lee una cantidad enorme de texto y ajusta miles de millones de parámetros para predecir la siguiente palabra. Lo que queda dentro no es una base de datos que se pueda consultar, sino una **compresión estadística** de patrones. La analogía útil: alguien que leyó una biblioteca gigantesca hace un año y ahora responde **de memoria**, sin poder volver a abrir ningún libro.',
      '**Tres huecos que ningún modelo general cubre:**\n\n- **Lo privado.** Nunca estuvo en sus datos: la política interna de tu empresa, un expediente, los apuntes de esta asignatura.\n- **Lo reciente.** Ocurrió después de su **fecha de corte**: la decisión que se tomó ayer, la tarifa que cambió la semana pasada.\n- **Lo muy específico** (la «cola larga»). Quizá apareció en sus datos, pero tan pocas veces que lo recuerda mal o mezcla versiones: el artículo exacto de una ordenanza municipal, el precio de 2023 frente al de 2026.',
      '**Por qué inventa en lugar de callar.** El modelo genera palabra a palabra eligiendo continuaciones probables. Si preguntas «¿qué criterios exactos se evalúan?», la continuación más probable es una lista de criterios con porcentajes, porque así son los textos que vio. **No existe una casilla interna fiable de «esto no lo sé»**, y el tono seguro no mide la exactitud. Eso es una **alucinación**: una respuesta fluida, segura y sin respaldo. Por eso es peligrosa: se confunde la fluidez con el conocimiento comprobado.',
      '**Señales de alarma** en una respuesta sin fuentes: cifras exactas sin origen, nombres propios internos («según nuestra política…»), fechas recientes, porcentajes redondos y listas demasiado limpias. Que la herramienta tenga **búsqueda web** o **memoria** no cambia el fondo: la web no contiene tus documentos privados, y la memoria del chat guarda fragmentos de conversaciones, no la versión vigente de tus archivos.',
      '**Tres maneras de darle al modelo el conocimiento que le falta:**\n\n- **Reentrenarlo o ajustarlo (fine-tuning).** Sirve para cambiar estilo o comportamiento. Es caro, hay que repetirlo cada vez que cambian los datos y no permite citar de dónde sale cada respuesta.\n- **Pegar el documento en la conversación** (contexto largo). Funciona con pocos documentos, pero tiene un límite de tamaño, cuesta más en cada pregunta y obliga al modelo a encontrar la aguja en el pajar.\n- **RAG** (generación aumentada por recuperación). Primero **busca** los fragmentos relevantes en una colección de documentos y luego se los entrega al modelo junto con la pregunta. Se actualiza cambiando los documentos y permite **citar**. Es lo que hacen Gemini Notebook y la mayoría de los asistentes corporativos.',
      '**Demostración para clase.** Pregunta a un chat sin documentos «¿qué criterios exactos se evalúan en la práctica de SDD de este máster?», anota los detalles inventados y repite la pregunta en un cuaderno que tenga los apuntes como fuente. Abre las citas y compara.'
    ],
    panels: [
      {
        title: 'Una pregunta sin fuentes',
        caption: 'Un chat general responde sobre los criterios de evaluación de este máster sin tener los apuntes.',
        steps: [
          'Preguntamos a un chat sin documentos: «¿Qué criterios exactos se evalúan en la práctica de SDD de este máster?».',
          'La respuesta es inmediata, ordenada y segura.',
          'Pero los criterios y los porcentajes no salen de ningún documento: son plausibles e inventados.',
          'El peligro: la fluidez del texto se confunde con conocimiento comprobado.'
        ],
        draw(g) {
          const w = win(14, 12, 300, 224, 'Chat general · sin documentos');
          show(g.at(0), () => msg(w.x + 60, w.y, 226, '¿Qué criterios exactos se evalúan en la práctica de SDD de este máster?', { who: 'user' }));
          show(g.at(1), () => {
            box(w.x, w.y + 44, 240, 120, { fill: P.white, shadow: false });
            txt('Se evalúan cuatro criterios:', w.x + 8, w.y + 50, { size: 8.5, color: P.ink, font: 'sans' });
            ['1. Creatividad (30 %)', '2. Uso de herramientas (25 %)', '3. Presentación oral (25 %)', '4. Trabajo en equipo (20 %)'].forEach((l, i) => { txt(l, w.x + 14, w.y + 70 + i * 20, { size: 8.5, color: P.ink, font: 'sans' }); if (g.from(2)) rect(w.x + 12, w.y + 80 + i * 20, 150, 1.5, P.red); });
            robot(w.x + 248, w.y + 80, { s: 1, mood: 'sure', color: P.purple });
          });
          show(g.at(2), () => { ['sin fuente', 'inventado', 'inventado', 'inventado'].forEach((t, i) => chip(t, 330, 84 + i * 20, { fill: P.red, size: 7.5 })); stamp('NO CONSTA EN LOS APUNTES', 400, 200, { a: late(g.at(2)), size: 8.5 }); });
          show(g.at(3), () => banner('Fluidez ≠ conocimiento comprobado', { y: 242, h: 22 }));
        }
      },
      {
        title: 'Predecir no es consultar',
        caption: 'Por dentro, el modelo no busca el dato: elige la continuación más probable del texto.',
        steps: [
          'La pregunta llega al modelo. No hay ningún documento que consultar: solo lo que aprendió.',
          'El modelo va escribiendo y, en cada paso, calcula qué palabra es más probable a continuación.',
          'Elige «30 %» porque en textos parecidos suele aparecer un porcentaje así, no porque lo sepa.',
          '«No lo sé» casi nunca es la continuación más probable. El tono seguro no mide la exactitud.'
        ],
        draw(g) {
          show(g.at(0), () => { msg(14, 14, 230, '¿Qué criterios exactos se evalúan en la práctica de SDD?', { who: 'user' }); robot(24, 120, { s: 2, mood: g.from(2) ? 'sure' : 'think', color: P.purple }); });
          show(g.at(1), () => {
            box(70, 66, 178, 46, { fill: P.white });
            txt('Se evalúan cuatro criterios:', 78, 72, { size: 8.5, color: P.ink, font: 'sans' });
            txt('1. Creatividad (' + (g.from(2) ? '30 %' : '') + (blink(0.5) ? '▌' : ''), 78, 88, { size: 8.5, color: P.ink, font: 'sans' });
            card(264, 14, 202, 150, 'SIGUIENTE PALABRA', P.purple, { size: 8 });
            probBars(268, 44, [{ label: '30 %', v: 0.41 }, { label: '25 %', v: 0.33 }, { label: '20 %', v: 0.18 }, { label: 'no lo sé', v: 0.02, color: P.mint }], { labelW: 58, barW: 100, gap: 26, highlight: g.from(2) ? 0 : -1, p: g.at(1) });
          });
          show(g.at(2), () => { arrow(264, 52, 236, 90, { color: P.yellow, dash: true }); txt('elige lo frecuente,\nno lo comprobado', 365, 150, { size: 8.5, color: P.yellow, align: 'center' }); });
          show(g.at(3), () => { glow(270, 120, 192, 14, P.mint); txt('la opción honesta casi nunca gana', 365, 178, { size: 8, color: P.mint, align: 'center' }); banner('No hay una casilla interna fiable de «no lo sé»', { y: 236 }); });
        }
      },
      {
        title: 'Tres huecos que el modelo no cubre',
        caption: 'Lo privado, lo reciente y lo muy específico quedan fuera de lo que aprendió el modelo.',
        steps: [
          'El modelo aprendió de datos disponibles hasta una fecha de corte.',
          'Lo reciente queda fuera: las noticias de esta semana y la decisión de ayer.',
          'Lo privado nunca estuvo: documentos internos, expedientes, los apuntes de esta clase.',
          'Lo muy específico apareció tan pocas veces que lo recuerda borroso y mezcla versiones.',
          'La búsqueda web o la memoria del chat no garantizan acceso a tu documento privado ni a su versión vigente.'
        ],
        draw(g) {
          rect(30, 92, 420, 4, P.light);
          show(g.at(0), () => { rect(30, 80, 250, 28, 'rgba(79,134,224,.35)'); txt('lo que aprendió el modelo', 155, 62, { size: 9, color: P.sky, align: 'center' }); rect(278, 72, 4, 44, P.yellow); txt('fecha de corte', 280, 122, { size: 8, color: P.yellow, align: 'center' }); });
          show(g.at(1), () => { chip('RECIENTE', 330, 40, { fill: P.orange, size: 8 }); chip('noticias de esta semana', 300, 60, { fill: P.paper, size: 7.5 }); chip('la decisión de ayer', 330, 104, { fill: P.paper, size: 7.5 }); });
          show(g.at(2), () => {
            box(14, 150, 220, 70, { fill: P.gray2 });
            icon('lock', 24, 160, 2);
            txt('PRIVADO · nunca estuvo', 56, 162, { size: 8, color: P.red });
            ['política interna', 'expedientes', 'apuntes'].forEach((s, i) => chip(s, 24 + i * 70, 190, { fill: P.red, size: 7.5, w: 66 }));
          });
          show(g.at(3), () => {
            box(246, 150, 220, 70, { fill: P.gray2 });
            txt('MUY ESPECÍFICO · borroso', 258, 162, { size: 8, color: P.purple });
            [0, 1, 2, 3, 4].forEach(i => dot(120 + i * 30 + rnd(i) * 10, 88 + rnd(i + 5) * 10, P.purple, 2));
            chip('tarifa 2023 o 2026?', 258, 190, { fill: P.purple, size: 7.5 }); qmark(400, 186, P.purple, 2); qmark(430, 190, P.purple, 2);
          });
          show(g.at(4), () => banner('Web o memoria ≠ acceso a tu documento privado y vigente', { y: 236 }));
        }
      },
      {
        title: 'Tres formas de darle conocimiento',
        caption: 'Reentrenar, pegar el documento en la conversación o recuperar fragmentos (RAG): ventajas de cada vía.',
        steps: [
          'Reentrenar o ajustar el modelo: cambia su comportamiento, pero es caro, lento de actualizar y no cita.',
          'Pegar los documentos en la conversación: sirve para pocos documentos; con muchos no caben y cada pregunta cuesta más.',
          'RAG: buscar primero los fragmentos relevantes y dárselos al modelo. Se actualiza cambiando documentos y permite citar.',
          'Gemini Notebook y casi todos los asistentes corporativos usan la tercera vía.'
        ],
        draw(g) {
          const opts = [
            ['AJUSTAR EL MODELO', 'gear', P.orange, [0.15, 0.05, 0.2], 'cambia estilo, no da citas'],
            ['PEGAR EN EL CHAT', 'doc', P.sky, [0.75, 0.45, 0.35], 'pocos documentos'],
            ['RAG', 'search', P.mint, [0.85, 0.9, 0.75], 'buscar → responder → citar']
          ];
          opts.forEach((o, i) => show(g.at(i), () => {
            const x = 14 + i * 156;
            card(x, 14, 140, 210, o[0], o[2], { active: g.on(i) || (g.on(3) && i === 2) });
            icon(o[1], x + 54, 40, 3);
            ['fácil de actualizar', 'permite citar', 'coste bajo'].forEach((l, j) => meter(x + 12, 104 + j * 30, 116, o[3][j], { label: l, n: 8 }));
            txt(o[4], x + 70, 196, { size: 8, color: o[2], align: 'center', maxW: 128 });
          }));
          show(g.at(3), () => banner('RAG: buscar primero, responder después', { y: 236 }));
        }
      },
      {
        title: 'La misma pregunta, con las fuentes',
        caption: 'Un cuaderno con los apuntes de la asignatura responde citando el fragmento de origen.',
        steps: [
          'Creamos un cuaderno y añadimos los apuntes de la asignatura como fuente.',
          'Hacemos la misma pregunta.',
          'La respuesta enumera los criterios reales de la rúbrica, cada uno con su marca de cita.',
          'Abrimos la cita: el fragmento de los apuntes respalda exactamente la respuesta.'
        ],
        draw(g) {
          show(g.at(0), () => { card(14, 14, 110, 220, 'FUENTES', P.teal); chip('apuntes.md', 22, 42, { icon: 'doc', fill: P.mint, size: 7.5, w: 94 }); });
          show(g.at(1), () => { box(134, 14, 186, 34, { fill: P.blue }); txt('¿Qué criterios se evalúan en la práctica de SDD?', 142, 20, { size: 8, color: P.ink, maxW: 172, font: 'sans' }); });
          show(g.at(2), () => {
            box(134, 56, 186, 140, { fill: P.white });
            ['Concreción', 'Control', 'Verificabilidad', 'Ejecución', 'Aprendizaje'].forEach((c, i) => { txt('• ' + c, 142, 64 + i * 24, { size: 9, color: P.ink, font: 'sans' }); chip('1', 300, 62 + i * 24, { fill: P.yellow, size: 7, w: 14, h: 13, pad: 2 }); });
          });
          show(g.at(3), () => {
            arrow(322, 70, 336, 70, { color: P.yellow });
            paper(338, 30, 128, 170, { title: 'apuntes.md · B3' });
            txt('Rúbrica', 346, 50, { size: 8, color: P.navy, font: 'sans' });
            rect(344, 64, 114, 76, 'rgba(247,207,90,.55)');
            ['| Concreción |', '| Control |', '| Verificabilidad |', '| Ejecución |', '| Aprendizaje |'].forEach((l, i) => txt(l, 348, 68 + i * 14, { size: 7.5, color: P.ink, font: 'mono' }));
            icon('check', 390, 160, 2);
          });
        }
      }
    ],
    examples: [
      ['Política interna', '«¿Cuántos días de teletrabajo permite nuestra política?» sin aportar la política: respuesta genérica o inventada.'],
      ['Decisión reciente', 'El modelo no sabe que ayer se cambió de proveedor; responde con el anterior.'],
      ['Cola larga', 'Pregunta por el precio público de una tasa municipal: mezcla cifras de años distintos.'],
      ['Apuntes', 'Sin los apuntes, inventa criterios de evaluación plausibles, con porcentajes redondos.']
    ],
    mistakes: [
      'Preguntar por documentos propios a un chat que no los tiene.',
      'Creer que la memoria del chat o la búsqueda web equivalen a conocer tus archivos vigentes.',
      'Dar por buena una respuesta porque «suena» a tu empresa o porque el tono es seguro.',
      'Pensar que reentrenar el modelo es la forma normal de que «se sepa» tus documentos.'
    ],
    questions: [
      ['¿Por qué es peligrosa una respuesta plausible sobre información interna?', 'Porque parece correcta y puede usarse para decidir, aunque no se apoye en ningún documento. El error pasa inadvertido precisamente por su verosimilitud.'],
      ['¿Por qué un modelo no responde simplemente «no lo sé» cuando le falta un dato?', 'Porque genera la continuación más probable del texto y, ante una pregunta con forma de «¿cuáles son los criterios?», lo probable es una lista de criterios. No tiene un indicador interno fiable de ignorancia; hay que dárselo con fuentes e instrucciones.'],
      ['Si una herramienta tiene búsqueda web, ¿conoce tus documentos privados?', 'No. La búsqueda web accede a contenido público; tus documentos internos solo están disponibles si los aportas o la herramienta está conectada a ellos con permisos.'],
      ['¿Cuándo elegirías pegar un documento en el chat y cuándo montarías un RAG?', 'Pegar sirve para una consulta puntual con uno o dos documentos cortos. RAG compensa cuando hay muchos documentos, cambian a menudo, varias personas preguntan lo mismo o se necesitan citas y control de permisos.']
    ],
    quiz: [
      { q: 'Un LLM general, ¿conoce los documentos internos de tu empresa?', o: ['No, salvo que se los proporciones o esté conectado a ellos', 'Sí, siempre', 'Sí, si tiene búsqueda web', 'Solo si son recientes'], c: 0, why: 'Lo privado no forma parte de su entrenamiento.' },
      { q: 'Sin fuentes, ante una pregunta sobre información que no tiene, el modelo puede…', o: ['Negarse siempre', 'Buscar en tu ordenador', 'Generar una respuesta plausible pero inventada', 'Llamar a un experto'], c: 2, why: 'Elige la continuación más probable, aunque no esté respaldada.' },
      { q: 'La fecha de corte de un modelo indica…', o: ['Cuándo caduca la licencia', 'La hora del servidor', 'La versión de la interfaz', 'Hasta cuándo llegan los datos con los que se entrenó'], c: 3, why: 'Lo posterior no está en lo aprendido.' },
      { q: '¿Qué vía permite actualizar el conocimiento cambiando documentos y citar el origen?', o: ['Ajustar el modelo (fine-tuning)', 'RAG', 'Subir la temperatura', 'Escribir el prompt en inglés'], c: 1, why: 'RAG recupera de una colección que se puede actualizar y conserva la procedencia.' }
    ],
    terms: [['Fecha de corte', 'Momento hasta el que llegan los datos con los que se entrenó un modelo.'], ['Alucinación', 'Respuesta fluida y segura que no está respaldada por datos reales.'], ['Cola larga', 'Información muy específica que aparece pocas veces en los datos y el modelo recuerda mal.'], ['Fine-tuning', 'Ajuste de un modelo ya entrenado con datos propios para cambiar su comportamiento.']]
  });

  /* ------------------------------------------------------------------ */
  PL.concept({
    id: 'embeddings', block: 'b4', slide: 'S4', title: 'Embeddings: el significado como posición',
    idea: 'Un embedding convierte un texto en un vector: una lista fija de números que funciona como coordenadas en un mapa de significado. Textos que significan algo parecido quedan cerca aunque no compartan palabras, pero «cerca» no quiere decir «verdadero» ni «exacto».',
    explain: [
      '**Qué es.** Un modelo de embeddings recibe un texto (una frase, un párrafo, a veces una imagen) y devuelve un **vector**: una lista de números de longitud fija, por ejemplo 768 o 3.072. Da igual que el texto tenga tres palabras o trescientas: el vector siempre mide lo mismo. Ese vector es una **posición** en un espacio de muchas dimensiones donde la distancia equivale a diferencia de significado.',
      '**Cómo aprende el mapa.** El modelo se entrena con millones de pares de textos que «van juntos» (una pregunta y su respuesta, un título y su párrafo, una frase y su traducción) y otros que no. Aprende a **acercar** los primeros y **alejar** los segundos. Por eso «gato» y «felino», o «contrato» y «contract», acaban cerca: aparecen en contextos parecidos. Las dimensiones no tienen un nombre legible («dimensión 412 = animales» no existe); el mapa en dos dimensiones de las viñetas es una simplificación para poder dibujarlo.',
      '**Cómo se mide la cercanía.** Lo habitual es la **similitud coseno**, que compara la **dirección** de dos vectores: vale 1 si apuntan igual, 0 si son perpendiculares (nada que ver) y −1 si son opuestos. Un ejemplo con vectores de solo dos números:\n\n```\nA «el gato duerme»       = (3, 4)\nB «el felino descansa»   = (4, 3)\nC «factura pendiente»    = (4, −3)\n\ncos(A, B) = (3·4 + 4·3) / (5 · 5) = 24/25 = 0,96   → muy parecidos\ncos(A, C) = (3·4 + 4·(−3)) / (5 · 5) = 0/25 = 0    → nada que ver\n```',
      '**Para qué sirve.** Búsqueda semántica (encontrar «dificultades económicas» cuando se busca «dinero»), agrupar documentos por tema, detectar duplicados, recomendar contenido parecido y buscar entre idiomas. En RAG, es la pieza que permite encontrar el fragmento que responde a una pregunta aunque use otras palabras.',
      '**Qué se le escapa.** El embedding resume el significado general y pierde detalles que a menudo son lo importante:\n\n- **Negaciones:** «se permite» y «no se permite» quedan casi en el mismo punto.\n- **Números y fechas:** «plazo de 2025» y «plazo de 2026» son vecinos.\n- **Códigos y nombres raros:** «RX-2231» y «RX-2213» pueden parecer idénticos.\n\nPor eso los sistemas serios combinan la búsqueda por significado con **búsqueda por palabras clave**, **filtros de metadatos** (fecha, versión) y **lectura humana** de la cita.',
      '**Dos reglas prácticas.** Documentos y preguntas deben convertirse con **el mismo modelo** de embeddings: vectores de modelos distintos no son comparables, igual que no se pueden mezclar coordenadas de dos mapas diferentes. Y si se cambia de modelo, hay que **volver a calcular** los vectores de toda la colección.'
    ],
    panels: [
      {
        title: 'Del texto al vector',
        caption: 'Un modelo de embeddings convierte una frase en una lista de números que la sitúa en un mapa de significado.',
        steps: [
          'Partimos de un fragmento de texto: «El gato duerme en el sofá».',
          'Un modelo de embeddings lo procesa.',
          'Devuelve un vector: una lista de cientos o miles de números, siempre de la misma longitud.',
          'Ese vector es una posición en un espacio de significado (aquí simplificado a dos dimensiones).'
        ],
        draw(g) {
          show(g.at(0), () => { box(14, 30, 150, 50, { fill: P.paper }); txt('«El gato duerme en el sofá»', 89, 42, { size: 9.5, color: P.ink, align: 'center', maxW: 136, font: 'sans' }); sprite('cat', 76, 88, 2); });
          arrow(166, 56, 190, 56, { p: g.at(1), color: P.sky });
          show(g.at(1), () => { card(192, 24, 96, 66, 'MODELO DE EMBEDDINGS', P.teal, { size: 6.5 }); icon('chip', 228, 52, 2); });
          arrow(290, 56, 312, 56, { p: g.at(2), color: P.sky });
          show(g.at(2), () => {
            box(314, 22, 152, 72, { fill: P.ink, border: P.gray3 });
            txt('[ 0,12  −0,83  0,44', 322, 32, { size: 8.5, color: P.yellow, font: 'mono' });
            txt('  0,07   0,91 −0,26', 322, 48, { size: 8.5, color: P.yellow, font: 'mono' });
            txt('  …  (768 números) ]', 322, 64, { size: 8.5, color: P.light, font: 'mono' });
          });
          show(g.at(3), () => {
            card(150, 110, 316, 140, 'MAPA DE SIGNIFICADO (2D)', P.purple);
            axes(166, 134, 284, 104);
            dot(300, 170, P.yellow, 5); pulse(300, 170, P.yellow, 10);
            chip('«el gato duerme en el sofá»', 312, 156, { fill: P.yellow, size: 7.5 });
            arrow(390, 94, 310, 160, { color: P.yellow, dash: true });
          });
        }
      },
      {
        title: 'Cómo aprende el mapa',
        caption: 'Entrenamiento por contraste: los pares que van juntos se acercan y los que no, se alejan.',
        steps: [
          'Al principio, el modelo coloca las frases al azar: el mapa todavía no significa nada.',
          'Le enseñamos millones de pares que van juntos: una pregunta y su respuesta, una palabra y su traducción.',
          'Con cada par, acerca un poco las dos frases y aleja las que no tienen nada que ver.',
          'Después de millones de ejemplos, lo parecido queda cerca. Ese es el mapa que usa la búsqueda.'
        ],
        draw(g) {
          card(14, 14, 452, 214, 'ESPACIO DE SIGNIFICADO', P.purple);
          const pts = [
            ['¿Cuándo me devolvéis el dinero?', [70, 196], [250, 66], P.mint],
            ['Reembolso en 14 días', [380, 206], [282, 96], P.mint],
            ['contrato', [380, 60], [110, 160], P.sky],
            ['contract', [60, 92], [150, 188], P.sky],
            ['gato', [250, 200], [74, 62], P.orange],
            ['felino', [190, 56], [112, 90], P.orange]
          ];
          const p = g.step < 2 ? 0 : g.step === 2 ? g.at(2) * 0.55 : 0.55 + g.at(3) * 0.45;
          const pos = pts.map(q => mix(q[1], q[2], p));
          if (g.from(1) && !g.from(3)) [[0, 1], [2, 3], [4, 5]].forEach(([i, j]) => line(pos[i][0], pos[i][1], pos[j][0], pos[j][1], pts[i][3], 1, true));
          if (g.on(2)) {
            line(pos[0][0], pos[0][1], pos[4][0], pos[4][1], P.red, 1, true);
            const m = [(pos[0][0] + pos[4][0]) / 2, (pos[0][1] + pos[4][1]) / 2];
            chip('se aleja', m[0], m[1] - 20, { align: 'center', fill: P.red, size: 7 });
            line(30, 210, 54, 210, P.mint, 1, true); txt('los pares se acercan', 60, 205, { size: 8, color: P.mint });
            line(200, 210, 224, 210, P.red, 1, true); txt('lo que no tiene relación se aleja', 230, 205, { size: 8, color: P.red });
          }
          pts.forEach((q, i) => { dot(pos[i][0], pos[i][1], q[3], 4); txt(q[0], pos[i][0] + 8, pos[i][1] - 4, { size: 7.5, color: q[3], maxW: 150, fit: true }); });
          if (g.on(0)) qmark(420, 44, P.light, 2);
          if (g.from(1) && !g.from(3)) chip('pares de ejemplo × 1.000.000', 456, 40, { align: 'right', fill: P.yellow, size: 7.5 });
          show(g.at(3), () => { [[240, 52, 206, 58], [100, 146, 112, 56], [64, 48, 112, 56]].forEach(f => frame(f[0], f[1], f[2], f[3], P.white, 1)); banner('Lo parecido queda cerca porque así lo aprendió', { y: 236 }); });
        }
      },
      {
        title: 'Un mapa de significado',
        caption: 'Frases representadas como puntos: las que significan algo parecido forman grupos.',
        steps: [
          'Las frases sobre gatos quedan juntas aunque usen palabras distintas: «gato» y «felino», «sofá» y «sillón».',
          'Las frases sobre dinero forman otro grupo: «falta de dinero», «dificultades económicas», «pago pendiente».',
          'Llega una consulta: «problemas para pagar». Sus vecinos más cercanos están en el grupo del dinero.',
          'Cerca = significado parecido, aunque no compartan ni una palabra.'
        ],
        draw(g) {
          axes(24, 14, 432, 214);
          const A = [['el gato duerme en el sofá', 90, 60], ['el felino descansa en el sillón', 120, 92], ['mi mascota ronronea', 70, 120]];
          const B = [['falta de dinero', 300, 152], ['dificultades económicas', 318, 180], ['pago pendiente del proveedor', 282, 206]];
          show(g.at(0), () => { frame(50, 44, 210, 96, P.orange, 1); A.forEach(a => { dot(a[1], a[2], P.orange, 4); txt(a[0], a[1] + 8, a[2] - 5, { size: 8, color: P.orange }); }); sprite('cat', 220, 100, 2); });
          show(g.at(1), () => { frame(268, 138, 196, 84, P.mint, 1); B.forEach(b => { dot(b[1], b[2], P.mint, 4); txt(b[0], b[1] + 8, b[2] - 5, { size: 8, color: P.mint, maxW: 140, fit: true }); }); icon('coin', 428, 146, 2); });
          show(g.at(2), () => {
            const qx = 396, qy = 118;
            B.forEach(b => line(qx, qy, b[1], b[2], P.yellow, 1, true));
            dot(qx, qy, P.yellow, 5); pulse(qx, qy, P.yellow, 10);
            chip('consulta: «problemas para pagar»', 466, 92, { fill: P.yellow, size: 8, align: 'right' });
          });
          show(g.at(3), () => banner('Cerca = significado parecido, aunque cambien las palabras', { y: 238, h: 24 }));
        }
      },
      {
        title: 'Medir la cercanía: el ángulo',
        caption: 'La similitud coseno compara hacia dónde apuntan dos vectores, no lo largos que son.',
        steps: [
          'A «el gato duerme» = (3, 4) y B «el felino descansa» = (4, 3). Dos flechas que salen del origen.',
          'Forman un ángulo muy pequeño: apuntan casi a la misma zona del mapa. Coseno ≈ 0,96.',
          'C «factura pendiente» = (4, −3) forma un ángulo recto con A. Coseno = 0: nada que ver.',
          'El cálculo: se multiplican las coordenadas una a una, se suman y se divide entre las longitudes.',
          'Se compara la dirección: 1 = mismo sentido, 0 = sin relación, −1 = opuesto.'
        ],
        draw(g) {
          const ox = 70, oy = 140, u = 22;
          const pt = v => [ox + v[0] * u, oy - v[1] * u];
          line(30, oy, 230, oy, P.gray3, 1); line(ox, 20, ox, 250, P.gray3, 1);
          const A = pt([3, 4]), B = pt([4, 3]), C = pt([4, -3]);
          show(g.at(0), () => {
            arrow(ox, oy, A[0], A[1], { color: P.orange, w: 3 }); chip('A gato', A[0] - 10, A[1] - 22, { fill: P.orange, size: 7.5 });
            arrow(ox, oy, B[0], B[1], { color: P.yellow, w: 3 }); chip('B felino', B[0] + 4, B[1] - 6, { fill: P.yellow, size: 7.5 });
          }, 0);
          show(g.at(1), () => { for (let k = 0; k <= 6; k++) { const a1 = Math.atan2(4, 3), a2 = Math.atan2(3, 4), a = lerp(a1, a2, k / 6); rect(ox + Math.cos(a) * 40 - 1, oy - Math.sin(a) * 40 - 1, 3, 3, P.mint); } txt('ángulo\npequeño', 16, 84, { size: 8, color: P.mint }); arrow(52, 100, ox + 24, oy - 34, { color: P.mint, head: 4 }); }, 0);
          show(g.at(2), () => { arrow(ox, oy, C[0], C[1], { color: P.sky, w: 3 }); chip('C factura', C[0] + 4, C[1] - 6, { fill: P.sky, size: 7.5 }); rect(ox + 10, oy - 2, 2, 12, P.red); rect(ox + 2, oy + 8, 10, 2, P.red); txt('90°', ox - 30, oy + 6, { size: 8, color: P.red }); }, 0);
          show(g.at(3), () => {
            card(250, 14, 216, 150, 'SIMILITUD COSENO', P.purple);
            txt('cos(A,B) = (3·4 + 4·3) / (5·5)', 260, 42, { size: 8.5, color: P.white, font: 'mono' });
            txt('         = 24 / 25 = 0,96', 260, 58, { size: 8.5, color: P.mint, font: 'mono' });
            txt('cos(A,C) = (3·4 + 4·(−3)) / (5·5)', 260, 86, { size: 8.5, color: P.white, font: 'mono', maxW: 200, fit: true });
            txt('         = 0 / 25 = 0', 260, 102, { size: 8.5, color: P.sky, font: 'mono' });
            txt('5 = longitud de cada vector', 260, 132, { size: 8, color: P.light });
          });
          show(g.at(4), () => {
            const sx = 262, sw = 190;
            rect(sx, 196, sw, 6, P.gray2); rect(sx, 196, sw / 2, 6, P.red); rect(sx + sw / 2, 196, sw / 2, 6, P.mint);
            [['−1', 0, 'opuesto'], ['0', 0.5, 'sin relación'], ['1', 1, 'mismo sentido']].forEach(m => { rect(sx + sw * m[1] - 1, 190, 2, 18, P.white); txt(m[0], sx + sw * m[1], 176, { size: 8, align: 'center' }); txt(m[2], sx + sw * m[1], 212, { size: 7.5, align: 'center', color: P.light }); });
            banner('Se compara la dirección, no la longitud', { y: 238, h: 22 });
          });
        }
      },
      {
        title: 'Ctrl+F frente a búsqueda semántica',
        caption: 'Buscar «dinero» en un informe que nunca usa esa palabra.',
        steps: [
          'Un informe dice: «La familia atraviesa dificultades económicas desde marzo».',
          'Búsqueda literal (Ctrl+F) de «dinero»: 0 resultados. La palabra no aparece.',
          'Búsqueda semántica de «dinero»: recupera el fragmento, porque su significado está cerca.',
          'La búsqueda semántica encuentra formulaciones equivalentes, pero el fragmento todavía hay que leerlo y validarlo.'
        ],
        draw(g) {
          show(g.at(0), () => { paper(14, 14, 200, 140, { title: 'informe-caso-12.pdf' }); bars(24, 38, 170, 3, { seed: 3 }); rect(22, 66, 182, 34, g.from(2) ? 'rgba(111,220,159,.5)' : 'rgba(0,0,0,0)'); txt('«La familia atraviesa dificultades económicas desde marzo.»', 26, 70, { size: 8.5, color: P.ink, maxW: 176, font: 'sans' }); bars(24, 110, 170, 4, { seed: 8 }); });
          show(g.at(1), () => {
            card(232, 14, 234, 90, 'BÚSQUEDA LITERAL (CTRL+F)', P.red);
            box(244, 40, 140, 22, { fill: P.white, shadow: false }); txt('dinero', 252, 46, { size: 9, color: P.ink, font: 'mono' }); icon('search', 390, 40, 2);
            txt('0 resultados', 300, 76, { size: 11, color: P.red, weight: 700 });
          });
          show(g.at(2), () => {
            card(232, 116, 234, 100, 'BÚSQUEDA SEMÁNTICA', P.mint);
            box(244, 142, 140, 22, { fill: P.white, shadow: false }); txt('dinero', 252, 148, { size: 9, color: P.ink, font: 'mono' }); icon('search', 390, 142, 2);
            chip('«dificultades económicas…»  0,82', 244, 176, { fill: P.mint, size: 8 });
            arrow(240, 184, 208, 90, { color: P.mint, dash: true });
          });
          show(g.at(3), () => banner('Encuentra lo equivalente, pero hay que leerlo y validarlo', { y: 230 }));
        }
      },
      {
        title: 'Qué capta y qué se le escapa',
        caption: 'Los embeddings son buenos con sinónimos e idiomas y malos con negaciones, cifras y códigos.',
        steps: [
          'Capta bien los sinónimos y las paráfrasis: «baja laboral» queda junto a «incapacidad temporal».',
          'También entre idiomas, en muchos modelos: «contrato» queda junto a «contract».',
          'Se le escapan las negaciones, las cifras y fechas, y los códigos: todos quedan «cerca» de su contrario.',
          'Solución habitual: combinar con búsqueda por palabras clave, filtros de fecha y versión, y lectura humana.'
        ],
        draw(g) {
          show(g.at(0), () => {
            card(14, 14, 220, 200, 'LO CAPTA BIEN', P.mint);
            chip('baja laboral', 24, 44, { fill: P.paper, size: 8.5 }); txt('≈', 124, 46, { size: 11, color: P.mint }); chip('incapacidad temporal', 136, 44, { fill: P.paper, size: 8, w: 90 });
            chip('no puedo pagar', 24, 74, { fill: P.paper, size: 8.5 }); txt('≈', 124, 76, { size: 11, color: P.mint }); chip('impago', 136, 74, { fill: P.paper, size: 8.5 });
          });
          show(g.at(1), () => { chip('contrato', 24, 104, { fill: P.paper, size: 8.5 }); txt('≈', 124, 106, { size: 11, color: P.mint }); chip('contract', 136, 104, { fill: P.paper, size: 8.5 }); icon('globe', 104, 150, 3); icon('check', 150, 160, 2); });
          show(g.at(2), () => {
            card(246, 14, 220, 200, 'SE LE ESCAPA', P.red);
            [['se permite', 'NO se permite', 'negación'], ['plazo 2025', 'plazo 2026', 'cifras y fechas'], ['RX-2231', 'RX-2213', 'códigos']].forEach((r, i) => {
              const y = 44 + i * 52;
              chip(r[0], 256, y, { fill: P.paper, size: 8 }); txt('≈ ?', 344, y + 2, { size: 9, color: P.red }); chip(r[1], 370, y, { fill: P.paper, size: 8, w: 88 });
              txt(r[2], 356, y + 24, { size: 7.5, color: P.light, align: 'center' });
            });
          });
          show(g.at(3), () => banner('Significado + palabras clave + filtros + lectura humana', { y: 232 }));
        }
      },
      {
        title: 'Cercanía no es verdad',
        caption: 'Dos casos en los que un fragmento cercano no sirve como respuesta.',
        steps: [
          '«El plazo es el 5 de mayo» y «El plazo NO es el 5 de mayo» comparten casi todas las palabras…',
          '…y quedan muy cerca en el mapa, aunque se contradicen.',
          'Otro caso: preguntamos por el plazo de 2026 y lo más cercano es el plazo de 2025. Cercano, pero no responde.',
          'Por eso la recuperación se combina con filtros, metadatos (fecha, versión) y revisión humana.'
        ],
        draw(g) {
          show(g.at(0), () => { chip('«El plazo es el 5 de mayo»', 20, 20, { fill: P.mint, size: 9 }); chip('«El plazo NO es el 5 de mayo»', 20, 46, { fill: P.red, size: 9 }); });
          show(g.at(1), () => {
            card(250, 14, 216, 96, 'EN EL MAPA', P.purple);
            dot(340, 70, P.mint, 4); dot(352, 76, P.red, 4); frame(326, 56, 40, 34, P.yellow, 1);
            txt('casi en el mismo punto', 358, 92, { size: 7.5, color: P.yellow, align: 'center' });
            stamp('SE CONTRADICEN', 130, 90, { a: late(g.at(1)), size: 9 });
          });
          show(g.at(2), () => {
            box(14, 124, 452, 70, { fill: P.gray2 });
            txt('Pregunta: «¿Cuál es el plazo de 2026?»', 24, 132, { size: 9 });
            chip('Recuperado: «El plazo de 2025 fue el 30 de abril»  0,91', 24, 152, { fill: P.orange, size: 8.5 });
            txt('cercano… pero no responde a la pregunta', 24, 176, { size: 8.5, color: P.orange });
          });
          show(g.at(3), () => { ['filtros', 'metadatos (fecha, versión)', 'revisión humana'].forEach((s, i) => chip(s, 24 + i * 150, 210, { fill: P.mint, size: 9, w: 140, icon: i === 2 ? 'user' : 'check', iconTint: P.ink })); });
        }
      }
    ],
    examples: [
      ['Sinónimos', '«Baja laboral» recupera fragmentos que hablan de «incapacidad temporal».'],
      ['Otro idioma', 'Muchos modelos sitúan cerca «contrato» y «contract».'],
      ['Agrupar', 'Clasificar 3.000 reclamaciones por tema sin leerlas una a una: se agrupan por cercanía.'],
      ['Límite', '«Se permite» y «no se permite» pueden quedar muy próximos.']
    ],
    mistakes: [
      'Pensar que un embedding «entiende» o verifica el contenido.',
      'Confundir similitud alta con respuesta correcta.',
      'Olvidar las negaciones, fechas, cifras y códigos al recuperar.',
      'Mezclar vectores de dos modelos de embeddings distintos.'
    ],
    questions: [
      ['Escribe un par de frases con significado parecido y vocabulario diferente, y otro par con vocabulario parecido y significado opuesto.', 'Ejemplo 1: «El pedido se retrasará» / «La entrega llegará más tarde». Ejemplo 2: «El curso es obligatorio» / «El curso no es obligatorio». El primer par queda cerca y debe; el segundo queda cerca y no debería.'],
      ['Calcula la similitud coseno entre (1, 0) y (0, 1), y entre (2, 2) y (1, 1). ¿Qué te dice cada resultado?', 'Entre (1,0) y (0,1): (0+0)/(1·1) = 0, perpendiculares, sin relación. Entre (2,2) y (1,1): (2+2)/(√8·√2) = 4/4 = 1, misma dirección aunque uno sea el doble de largo. El coseno ignora la longitud.'],
      ['¿Por qué una búsqueda literal perdería parte de la información relevante?', 'Porque solo encuentra las palabras exactas. Si el documento usa sinónimos o paráfrasis («dificultades económicas» en lugar de «dinero»), no aparece.'],
      ['¿Por qué la búsqueda semántica no resuelve por sí sola contradicciones, fechas o negaciones?', 'Porque mide parecido de significado general, no exactitud. Un fragmento cercano puede estar desactualizado, decir lo contrario o hablar de otro año. Hacen falta filtros, búsqueda por palabras clave y lectura humana.']
    ],
    quiz: [
      { q: 'Un embedding es…', o: ['Una imagen comprimida en miniatura', 'Una lista de números que representa un contenido', 'Un tipo de instrucción para el modelo', 'Una copia de seguridad del documento'], c: 1, why: 'Convierte un fragmento en un vector de longitud fija.' },
      { q: 'Dos textos con embeddings cercanos…', o: ['Tienen significado parecido, aunque cambien las palabras', 'Son idénticos', 'Son verdaderos', 'Son del mismo autor'], c: 0, why: 'La cercanía refleja similitud de significado.' },
      { q: 'Una similitud coseno de 0 entre dos vectores indica que…', o: ['Son idénticos', 'Son opuestos', 'Apuntan en direcciones perpendiculares: no tienen relación', 'Uno de los dos está vacío'], c: 2, why: '1 = misma dirección, 0 = perpendiculares, −1 = opuestos.' },
      { q: '¿Qué se le escapa con más facilidad a un embedding?', o: ['Los sinónimos', 'Las traducciones', 'Las paráfrasis', 'Las negaciones, las cifras y los códigos'], c: 3, why: 'Quedan cerca de su contrario porque comparten casi todo el texto.' }
    ],
    terms: [['Embedding', 'Representación numérica de un contenido que permite comparar su significado.'], ['Vector', 'Lista ordenada de números; en IA, la forma habitual de un embedding.'], ['Similitud semántica', 'Medida de cuánto se parecen dos contenidos en significado.'], ['Similitud coseno', 'Medida que compara la dirección de dos vectores: 1 igual, 0 sin relación, −1 opuesta.'], ['Espacio vectorial', 'El «mapa» de muchas dimensiones en el que cada embedding es un punto.']]
  });

  /* ------------------------------------------------------------------ */
  PL.concept({
    id: 'chunking', block: 'b4', slide: 'S6', title: 'Chunking: trocear antes de recuperar',
    idea: 'Antes de indexar, cada documento se divide en fragmentos (chunks) con su procedencia. Dónde y cómo se corta decide qué se puede encontrar: un corte en mal sitio separa una regla de su excepción y la respuesta sale mal aunque todo lo demás funcione.',
    explain: [
      '**Por qué trocear.** Por tres motivos:\n\n- **Precisión.** Un único vector para un documento de 40 páginas es la media de todo lo que dice: se parece un poco a muchas preguntas y mucho a ninguna. Un vector por fragmento apunta a una idea concreta.\n- **Espacio.** Al modelo solo le caben unos cuantos fragmentos junto a la pregunta, no el archivo entero.\n- **Citas.** Se puede citar «p. 7, §3» en lugar de «en algún lugar del PDF».',
      '**Cuatro estrategias de corte**, de más simple a más cuidadosa:\n\n- **Tamaño fijo.** Cada N palabras o tokens, con un **solapamiento** (por ejemplo, del 10 al 20 %) para no perder lo que cae en el borde. Es rápido, pero corta frases, tablas y apartados por la mitad.\n- **Por estructura.** Se corta donde el documento ya tiene costuras: títulos, apartados, artículos, filas de una tabla. Respeta las unidades de sentido.\n- **Recursiva.** Intenta cortar por apartado; si el apartado es demasiado largo, por párrafo; si aún lo es, por frase. Es la opción por defecto de muchas herramientas.\n- **Semántica.** Calcula embeddings de cada frase y corta donde cambia el tema. Es más cara y conviene revisarla.',
      '**Cuánto debe medir un fragmento.** Un fragmento demasiado grande mezcla temas, añade ruido y ocupa espacio; uno demasiado pequeño pierde condiciones: se queda con la regla pero no con la fecha que dice si sigue vigente, o con la frase pero no con la excepción que la matiza. Un punto de partida habitual son fragmentos de **unos cientos de palabras** con algo de solapamiento, pero **no existe un tamaño universal**: depende del tipo de documento, del idioma y de las preguntas que se esperan.',
      '**El fragmento huérfano.** Un fragmento que dice solo «Excepto del 15 de julio al 31 de agosto: 50 %» no se entiende sin saber de qué documento y apartado viene. Una técnica muy eficaz es **heredar el contexto**: anteponer a cada fragmento la ruta de títulos («Política de cancelaciones v3 › §7 Temporada alta») antes de calcular su embedding. Con las tablas, igual: un fragmento por fila **repitiendo los encabezados**.',
      '**Metadatos.** Cada fragmento guarda datos sobre su origen: documento, versión, fecha de vigencia, página, apartado, área y permisos. Sirven para citar, para filtrar versiones caducadas y para no mostrar a nadie lo que no puede ver.',
      '**Cómo se comprueba.** No a ojo: con preguntas de prueba. Para cada una se mira qué fragmentos se han recuperado y si cada uno contiene **todo** lo necesario (regla, excepción, fecha). En herramientas como Gemini Notebook el troceado es automático y no se configura, pero se ve su efecto al abrir las citas.'
    ],
    panels: [
      {
        title: 'Trocear un documento',
        caption: 'Un documento se corta en fragmentos que se solapan y llevan etiquetas de procedencia.',
        steps: [
          'Partimos de un documento largo: la política de teletrabajo, 12 páginas.',
          'Se divide en fragmentos (chunks) de tamaño parecido.',
          'Entre fragmentos consecutivos se deja un solapamiento, para no perder lo que queda en el borde.',
          'Cada fragmento conserva metadatos: documento, página, apartado y fecha.'
        ],
        draw(g) {
          show(g.at(0), () => { paper(14, 14, 120, 220, { title: 'politica.pdf' }); bars(24, 38, 96, 22, { seed: 9, gap: 8.5 }); });
          const cuts = [62, 114, 166];
          show(g.at(1), () => cuts.forEach(y => { line(10, y, 140, y, P.yellow, 2, true); icon('scissors', 140, y - 6, 1); }));
          const ch = [['chunk 1', 'p. 1', '§1 Objeto'], ['chunk 2', 'p. 2', '§2 Días'], ['chunk 3', 'p. 3', '§3 Excepciones'], ['chunk 4', 'p. 4', '§4 Equipos']];
          ch.forEach((c, i) => show(g.at(1) * clamp(g.at(1) * 4 - i), () => {
            const x = 170 + (i % 2) * 150, y = 16 + Math.floor(i / 2) * 116;
            box(x, y, 136, 70, { fill: P.paper });
            txt(c[0], x + 8, y + 6, { size: 8.5, color: P.ink });
            bars(x + 8, y + 22, 118, 4, { seed: i + 2, gap: 8 });
            if (g.from(2) && i > 0) rect(x + 4, y + 20, 128, 10, 'rgba(242,140,56,.45)');
            if (g.from(3)) { chip(c[1], x, y + 74, { fill: P.teal, size: 7 }); chip(c[2], x + 34, y + 74, { fill: P.yellow, size: 7 }); chip('2026', x + 104, y + 74, { fill: P.light, size: 7 }); }
          }));
          show(g.at(2), () => chip('solape', 300, 120, { align: 'center', fill: P.orange, size: 8 }));
        }
      },
      {
        title: 'Cuatro estrategias de corte',
        caption: 'El mismo documento cortado de cuatro maneras. Barras naranjas: títulos; colores: temas.',
        steps: [
          'Tamaño fijo: corta cada N palabras, caiga donde caiga. Rápido, pero parte títulos y frases.',
          'Por estructura: corta en los títulos y apartados que ya tiene el documento.',
          'Recursiva: por apartado; si uno es demasiado largo, lo vuelve a cortar por párrafo.',
          'Semántica: corta donde cambia el tema, detectado con embeddings.',
          'La mayoría de herramientas usan la recursiva por defecto; con documentos bien estructurados, la de estructura suele ganar.'
        ],
        draw(g) {
          const names = ['TAMAÑO FIJO', 'ESTRUCTURA', 'RECURSIVA', 'SEMÁNTICA'];
          const topic = [P.sky, P.sky, P.sky, P.pink, P.pink, P.pink, P.pink, P.mint, P.mint, P.mint];
          names.forEach((n, k) => show(g.at(k), () => {
            const x = 14 + k * 116, y = 22;
            txt(n, x + 52, 8, { size: 8, color: g.on(k) ? P.yellow : P.light, align: 'center' });
            paper(x, y, 104, 196, {});
            for (let i = 0; i < 10; i++) {
              const yy = y + 12 + i * 15;
              const isHead = [0, 4, 8].includes(i);
              rect(x + 8, yy, isHead ? 46 : 80 - rnd(i + k) * 18, isHead ? 5 : 3, k === 3 ? topic[i] : (isHead ? P.orange : P.navy));
            }
            const cuts = k === 0 ? [50, 75, 110, 135] : k === 1 ? [66, 126] : k === 2 ? [66, 100, 126] : [53, 113];
            cuts.forEach(cy => { line(x + 2, y + cy, x + 102, y + cy, k === 0 ? P.red : P.yellow, 2, true); });
            if (k === 0) chip('corta títulos', x + 52, y + 168, { align: 'center', fill: P.red, size: 7 });
            if (k === 2) chip('subcorte', x + 52, y + 168, { align: 'center', fill: P.yellow, size: 7 });
            if (k === 3) chip('cambio de tema', x + 52, y + 168, { align: 'center', fill: P.pink, size: 7 });
            if (k === 1) chip('sigue los títulos', x + 52, y + 168, { align: 'center', fill: P.mint, size: 7 });
          }));
          show(g.at(4), () => banner('Empieza por la estructura del documento', { y: 236 }));
        }
      },
      {
        title: 'Demasiado grande, equilibrado, demasiado pequeño',
        caption: 'Tres tamaños de fragmento. Colores: regla (azul), excepción (naranja), fecha de vigencia (amarillo) y ruido (gris).',
        steps: [
          'Demasiado grande: incluye la regla, la excepción, la fecha… y mucho ruido de otros temas. Diluye lo útil y ocupa contexto.',
          'Equilibrado: una idea central con su excepción y su fecha. Lo que hace falta para responder.',
          'Demasiado pequeño: solo la regla. Se pierde la excepción y la respuesta será incompleta.',
          'No hay tamaño universal: hay que inspeccionar qué fragmento se recupera.'
        ],
        draw(g) {
          const cols = [{ t: 'DEMASIADO GRANDE', col: P.red, seg: [P.gray3, P.gray3, P.blue, P.orange, P.yellow, P.gray3, P.gray3, P.gray3, P.gray3], note: 'ruido · ocupa contexto', ic: 'cross' }, { t: 'EQUILIBRADO', col: P.mint, seg: [P.blue, P.orange, P.yellow], note: 'idea + condiciones', ic: 'check' }, { t: 'DEMASIADO PEQUEÑO', col: P.orange, seg: [P.blue], note: 'pierde la excepción', ic: 'cross' }];
          cols.forEach((cl, k) => show(g.at(k), () => {
            const x = 14 + k * 156;
            card(x, 14, 140, 206, cl.t, cl.col, { active: g.on(k) });
            cl.seg.forEach((sc, i) => rect(x + 14, 40 + i * 15, 112, 11, sc));
            frame(x + 10, 36, 120, cl.seg.length * 15 + 4, P.white, 1);
            icon(cl.ic, x + 58, 182, 2);
            txt(cl.note, x + 70, 204, { size: 8, color: cl.col, align: 'center' });
          }));
          show(g.at(3), () => banner('Inspecciona qué fragmento se recupera', { y: 232 }));
        }
      },
      {
        title: 'Un corte en mal sitio cambia el sentido',
        caption: 'La regla y su excepción quedan en fragmentos distintos y solo se recupera la regla.',
        steps: [
          'Texto: «Se permite el teletrabajo dos días por semana, excepto durante el cierre trimestral».',
          'El corte cae justo antes de «excepto». La regla queda en un fragmento y la excepción en otro.',
          'Pregunta: «¿Puedo teletrabajar la semana del cierre?». Se recupera solo el primer fragmento → «Sí, dos días». Incorrecto.',
          'Con un corte por frase completa (o un solapamiento suficiente), regla y excepción viajan juntas → «No durante el cierre».'
        ],
        draw(g) {
          show(g.at(0), () => { box(14, 14, 452, 40, { fill: P.paper }); txt('«Se permite el teletrabajo dos días por semana,', 24, 20, { size: 9.5, color: P.ink, font: 'sans' }); txt('excepto durante el cierre trimestral.»', 24, 36, { size: 9.5, color: P.ink, font: 'sans' }); });
          show(g.at(1), () => {
            line(20, 34, 300, 34, P.yellow, 2, true); icon('scissors', 302, 28, 1);
            box(14, 66, 220, 34, { fill: P.blue }); txt('A: «…dos días por semana,»', 22, 77, { size: 8.5, color: P.ink });
            box(246, 66, 220, 34, { fill: P.orange }); txt('B: «excepto durante el cierre…»', 254, 77, { size: 8.5, color: P.ink });
          });
          show(g.at(2), () => {
            txt('«¿Puedo teletrabajar la semana del cierre?»', 24, 112, { size: 9 });
            chip('recupera A', 24, 130, { fill: P.blue, size: 8 });
            robot(100, 126, { s: 1, mood: 'sure', color: P.purple });
            bubble(124, 126, 112, 26, { text: '«Sí, dos días.»', tx: 118, ty: 138, size: 9 });
            stamp('INCORRECTO', 300, 140, { a: late(g.at(2)), size: 11 });
          });
          show(g.at(3), () => {
            box(14, 170, 452, 34, { fill: P.mint }); txt('A+B: «…dos días por semana, excepto durante el cierre…»', 22, 181, { size: 8.5, color: P.ink });
            robot(100, 212, { s: 1, mood: 'happy', color: P.purple });
            bubble(124, 212, 220, 26, { text: '«No durante el cierre trimestral.»', tx: 118, ty: 224, size: 9 });
            icon('check', 360, 216, 2);
          });
        }
      },
      {
        title: 'El fragmento huérfano',
        caption: 'Un fragmento sin su encabezado no se entiende; heredar la ruta de títulos le devuelve el sentido.',
        steps: [
          'Un fragmento recuperado dice solo: «Excepto del 15 de julio al 31 de agosto: 50 %».',
          '¿Excepto qué? ¿50 % de qué? ¿De qué documento y versión? Ni el modelo ni tú lo sabéis.',
          'Solución: anteponer a cada fragmento la ruta de títulos de la que procede.',
          'Además, metadatos que viajan con él: versión, vigencia y página. Ahora se puede entender, filtrar y citar.'
        ],
        draw(g) {
          show(g.at(0), () => { box(110, 70, 260, 46, { fill: P.paper }); txt('«Excepto del 15 de julio al 31 de agosto: 50 %.»', 240, 86, { size: 9.5, color: P.ink, align: 'center', maxW: 240, font: 'sans' }); });
          if (!g.from(3)) show(g.at(1), () => { robot(30, 70, { s: 2, mood: 'confused', color: P.purple }); qmark(70, 50); qmark(390, 80); qmark(420, 60); txt('¿excepto qué?\n¿de qué documento?', 410, 110, { size: 8, color: P.yellow, align: 'center' }); });
          show(g.at(2), () => { box(110, 36, 260, 30, { fill: P.teal }); txt('Política de cancelaciones v3 › §7 Temporada alta › tramo 15-30 días', 240, 46, { size: 8, color: P.ink, align: 'center', maxW: 248, fit: true }); arrow(240, 66, 240, 72, { color: P.teal }); });
          show(g.at(3), () => { [['v3.0', P.mint], ['vigente desde 01/03/2026', P.yellow], ['p. 3', P.light]].forEach((m, i) => chip(m[0], [130, 182, 334][i], 124, { fill: m[1], size: 7.5 })); robot(30, 150, { s: 2, mood: 'happy', color: P.purple }); bubble(80, 150, 200, 40, { text: 'Entre el 15/7 y el 31/8, cancelar con 15-30 días devuelve el 50 %.', tx: 74, ty: 168, size: 8, font: 'sans' }); icon('check', 300, 162, 2); banner('Cada fragmento debe entenderse solo', { y: 236 }); });
        }
      }
    ],
    examples: [
      ['Tablas', 'Si se corta una tabla por la mitad, las cifras pierden su encabezado. Mejor una fila por fragmento, repitiendo encabezados.'],
      ['Excepciones', '«Salvo», «excepto» o «no se aplica cuando» deben viajar con la regla.'],
      ['Contexto heredado', 'Anteponer «Manual de acogida › Vacaciones ›» a cada fragmento de ese apartado.'],
      ['Metadatos', 'Página, versión y fecha permiten citar y descartar versiones antiguas.']
    ],
    mistakes: [
      'Elegir un tamaño fijo sin revisar qué se recupera.',
      'Cortar en medio de frases, tablas, listas o justo antes de un «excepto».',
      'Perder los metadatos de procedencia al trocear.',
      'Dejar fragmentos huérfanos que no se entienden sin su título.'
    ],
    questions: [
      ['¿Qué condición se pierde si el fragmento es demasiado corto?', 'Excepciones, fechas de vigencia, definiciones o el sujeto de la regla. El fragmento queda «limpio» pero incompleto, y la respuesta puede ser incorrecta.'],
      ['¿Para qué sirve el solapamiento entre fragmentos?', 'Para que la información que cae en el borde de un corte aparezca también en el fragmento siguiente, reduciendo el riesgo de separar una idea de sus condiciones.'],
      ['Tienes un convenio colectivo con artículos numerados y una tabla salarial. ¿Cómo lo trocearías?', 'Por estructura: un fragmento por artículo (y por apartado si el artículo es largo), anteponiendo «Convenio 2026 › Capítulo › Artículo». La tabla, una fila por fragmento repitiendo los encabezados. Metadatos: versión, vigencia y página.'],
      ['¿Cómo comprobarías en Gemini Notebook si el troceado está funcionando bien?', 'Abriendo las citas de varias respuestas y mirando si el fragmento recuperado contiene todo lo necesario (regla, excepción, fecha) o si falta contexto.']
    ],
    quiz: [
      { q: 'Un chunk demasiado grande…', o: ['Siempre es mejor', 'Pierde la excepción', 'No se puede indexar', 'Mezcla temas, añade ruido y ocupa contexto'], c: 3, why: 'Diluye el pasaje útil entre información irrelevante.' },
      { q: 'El solapamiento entre chunks sirve para…', o: ['Ahorrar espacio', 'No perder información en los bordes del corte', 'Cifrar el texto', 'Traducir'], c: 1, why: 'Lo que queda en el borde aparece en ambos fragmentos.' },
      { q: '¿Qué estrategia corta en los títulos y apartados que ya tiene el documento?', o: ['Por estructura', 'Tamaño fijo', 'Aleatoria', 'Por número de páginas'], c: 0, why: 'Aprovecha las costuras naturales del documento.' },
      { q: 'Anteponer «Política v3 › §7 Temporada alta» a un fragmento sirve para…', o: ['Que ocupe menos', 'Que se entienda por sí solo y se busque mejor', 'Ocultar el texto', 'Traducirlo'], c: 1, why: 'Evita fragmentos huérfanos sin contexto.' }
    ],
    terms: [['Chunk', 'Fragmento de un documento que se indexa y recupera de forma independiente.'], ['Chunking', 'Proceso de dividir documentos en fragmentos.'], ['Metadato', 'Dato sobre el dato: documento de origen, página, fecha, versión, permisos…'], ['Solapamiento', 'Parte de texto compartida entre fragmentos consecutivos.'], ['Chunking recursivo', 'Cortar por apartado y, si no cabe, por párrafo y luego por frase.'], ['Contexto heredado', 'Ruta de títulos que se antepone a un fragmento para que se entienda solo.']]
  });

  /* ------------------------------------------------------------------ */
  PL.concept({
    id: 'vectorial', block: 'b4', slide: 'S7', title: 'Índices y bases de datos vectoriales',
    idea: 'Los fragmentos se guardan con su vector y sus metadatos en un índice capaz de encontrar, en milisegundos y entre millones, los más parecidos a una pregunta. Antes de llegar al modelo, se filtran por fecha, versión y permisos, y a menudo se combinan con búsqueda por palabras y se reordenan.',
    explain: [
      '**Qué guarda cada registro.** Un índice vectorial es como una tabla en la que cada fila es un fragmento: un **identificador**, el **texto**, su **vector** y sus **metadatos** (documento, versión, fecha de vigencia, página, área, quién puede verlo). FAISS, Chroma, Qdrant, Pinecone, Weaviate o la extensión pgvector de PostgreSQL son ejemplos conocidos; los nombres cambian, el concepto no.',
      '**Búsqueda exacta frente a aproximada.** La forma ingenua de buscar es comparar la pregunta con **todos** los vectores: con mil fragmentos es inmediato; con cien millones, demasiado lento. Por eso los índices usan búsqueda **aproximada de vecinos cercanos** (ANN). La más extendida, **HNSW**, organiza los vectores como un grafo de «vecinos de vecinos» y salta de nodo en nodo hacia la zona de la pregunta, como quien pregunta a varios desconocidos hasta llegar a la calle correcta. Hace unos cientos de comparaciones en lugar de millones y, **casi siempre**, encuentra los mejores. Cambia un poco de exactitud por muchísima velocidad.',
      '**Cuántos y con qué umbral.** La búsqueda devuelve los **k** fragmentos más cercanos (top-k), cada uno con su puntuación de similitud. Se puede añadir un **umbral**: si ni el mejor llega a un mínimo, es más honesto responder «no consta» que forzar una respuesta con material flojo.',
      '**Filtros de metadatos.** Se usan para descartar versiones caducadas, limitar a un área o tipo de documento y, sobre todo, **respetar permisos**: que nadie obtenga a través del asistente un fragmento que no podría abrir directamente. Hay dos formas:\n\n- **Pre-filtrado:** se busca solo entre los fragmentos permitidos. Es lo seguro para permisos.\n- **Post-filtrado:** se busca entre todos y después se descartan. Más simple, pero puede quedarse sin resultados válidos y, si se hace mal, filtrar información sensible.',
      '**Búsqueda híbrida.** Como los embeddings fallan con códigos, nombres propios y cifras, muchos sistemas lanzan **dos búsquedas** a la vez: una por **palabras clave** (el algoritmo clásico se llama BM25) y otra por **significado**, y fusionan los resultados. La primera encuentra «RX-2231» exacto; la segunda, «no puedo pagar» cuando el texto dice «impago».',
      '**Reordenación (reranking).** Un segundo modelo, más lento pero más preciso, lee la pregunta junto a cada uno de los 20-50 candidatos y los vuelve a ordenar. Al modelo generativo solo pasan los 3-5 mejores. Es una de las mejoras más rentables de un RAG.'
    ],
    panels: [
      {
        title: 'Guardar vectores con sus metadatos',
        caption: 'Cada fila del índice une un fragmento, su vector y sus etiquetas.',
        steps: [
          'Cada fragmento del documento…',
          '…se convierte en un vector (su huella de significado).',
          'Vector y metadatos se guardan juntos en el índice: documento, página, fecha y permisos.',
          'El índice está listo para buscar por significado y filtrar por etiquetas.'
        ],
        draw(g) {
          const rows = [['chunk 1', 'politica.pdf', 'p. 1', '2026', 'todos'], ['chunk 2', 'politica.pdf', 'p. 2', '2026', 'todos'], ['chunk 3', 'nominas.xlsx', 'h. 1', '2026', 'RR. HH.'], ['chunk 4', 'politica-2023.pdf', 'p. 2', '2023', 'todos']];
          show(g.at(0), () => rows.forEach((r, i) => { box(14, 40 + i * 40, 70, 30, { fill: P.paper, shadow: false }); txt(r[0], 49, 50 + i * 40, { size: 8.5, color: P.ink, align: 'center' }); }));
          show(g.at(1), () => rows.forEach((r, i) => { arrow(88, 55 + i * 40, 104, 55 + i * 40, { color: P.sky, head: 4 }); box(108, 40 + i * 40, 76, 30, { fill: P.ink, shadow: false, border: P.gray3 }); vec(116, 47 + i * 40, i + 1, 60, 16); }));
          show(g.at(2), () => {
            icon('db', 196, 8, 2); txt('ÍNDICE VECTORIAL', 226, 14, { size: 9, color: P.purple });
            table(192, 36, [86, 40, 40, 66], [['documento', 'pág.', 'fecha', 'permiso']].concat(rows.map(r => [r[1], r[2], r[3], { t: r[4], color: r[4] === 'todos' ? P.mint : P.orange }])), { rh: 40, size: 7.5, leftFirst: true });
          });
          show(g.at(3), () => banner('Buscar por significado · filtrar por etiquetas', { y: 236 }));
        }
      },
      {
        title: 'Buscar los vecinos más cercanos',
        caption: 'La pregunta se convierte en un punto del mismo mapa y se buscan los fragmentos más próximos.',
        steps: [
          'El índice contiene miles de fragmentos, cada uno como un punto en el espacio de significado.',
          'La pregunta «¿Cuántos días de teletrabajo puedo hacer?» se convierte también en un punto, con el mismo modelo.',
          'Se buscan los vecinos más cercanos: los 3 fragmentos más similares (top-k = 3).',
          'Esos fragmentos, ordenados por similitud, son los candidatos a entrar en el contexto del modelo.'
        ],
        draw(g) {
          card(14, 14, 290, 226, 'ESPACIO DE SIGNIFICADO', P.purple);
          for (let i = 0; i < 46; i++) dot(30 + rnd(i * 3) * 258, 38 + rnd(i * 7 + 2) * 190, P.gray3, 2);
          const qx = 170, qy = 128;
          const nn = [[184, 116, 0.89], [150, 140, 0.84], [192, 150, 0.79]];
          nn.forEach(n => dot(n[0], n[1], g.from(2) ? P.mint : P.gray3, 3));
          show(g.at(1), () => { dot(qx, qy, P.yellow, 5); chip('pregunta', qx - 50, qy - 8, { align: 'center', fill: P.yellow, size: 8 }); }, 0);
          show(g.at(2), () => { const r = 14 + g.at(2) * 22; frame(qx - r, qy - r, r * 2, r * 2, P.yellow, 1); nn.forEach((n, i) => { line(qx, qy, n[0], n[1], P.mint, 1); txt(String(i + 1), n[0] + 5, n[1] - 10, { size: 8, color: P.mint }); }); }, 0);
          show(g.at(3), () => {
            card(316, 14, 150, 226, 'TOP 3', P.mint);
            [['§2 Días de teletrabajo', 0.89], ['§3 Excepciones', 0.84], ['FAQ teletrabajo', 0.79]].forEach((f, i) => { badge(i + 1, 324, 44 + i * 58, P.mint); txt(f[0], 344, 44 + i * 58, { size: 8, maxW: 116 }); txt('similitud ' + String(f[1]).replace('.', ','), 344, 62 + i * 58, { size: 7.5, color: P.mint }); });
          });
        }
      },
      {
        title: 'Exacta o aproximada',
        caption: 'Comparar con todos los fragmentos o saltar por un grafo de vecinos hasta la zona correcta.',
        steps: [
          'Búsqueda exacta: la pregunta se compara con todos los fragmentos. Con millones, tarda demasiado.',
          'Búsqueda aproximada (HNSW): los fragmentos forman un grafo en el que cada uno conoce a sus vecinos.',
          'Se entra por un nodo cualquiera y se salta siempre al vecino más cercano a la pregunta.',
          'En pocos saltos llega a la zona correcta: cientos de comparaciones en lugar de millones, y casi siempre acierta.'
        ],
        draw(g) {
          show(g.at(0), () => {
            card(14, 14, 216, 200, 'EXACTA', P.orange, { active: g.on(0) });
            const qx = 122, qy = 120;
            for (let i = 0; i < 34; i++) { const x = 28 + rnd(i * 5) * 188, y = 40 + rnd(i * 11 + 3) * 160; line(qx, qy, x, y, 'rgba(242,140,56,.35)', 1); dot(x, y, P.gray3, 2); }
            dot(qx, qy, P.yellow, 4);
            txt('1.000.000 comparaciones', 122, 198, { size: 8, color: P.orange, align: 'center' });
          });
          const N = [[270, 60], [320, 40], [372, 70], [430, 52], [290, 120], [350, 110], [410, 130], [450, 160], [300, 180], [370, 170], [420, 195]];
          const E = [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 2], [5, 6], [6, 3], [6, 7], [4, 8], [8, 9], [9, 5], [9, 10], [10, 7], [9, 6]];
          const hop = [0, 4, 5, 9, 10];
          show(g.at(1), () => {
            card(246, 14, 220, 200, 'APROXIMADA · HNSW', P.mint, { active: g.on(1) || g.on(2) });
            E.forEach(e => line(N[e[0]][0], N[e[0]][1], N[e[1]][0], N[e[1]][1], P.gray3, 1));
            N.forEach(n => dot(n[0], n[1], P.light, 3));
            dot(438, 196, P.yellow, 4); txt('pregunta', 438, 176, { size: 7.5, color: P.yellow, align: 'center' });
          });
          show(g.at(2), () => {
            const k = Math.min(hop.length - 1, Math.floor(g.at(2) * hop.length));
            for (let i = 0; i < k; i++) line(N[hop[i]][0], N[hop[i]][1], N[hop[i + 1]][0], N[hop[i + 1]][1], P.yellow, 3);
            dot(N[hop[k]][0], N[hop[k]][1], P.yellow, 5);
            badge(1, N[0][0] - 20, N[0][1] - 8, P.yellow);
          }, 0);
          show(g.at(3), () => { txt('≈ 300 comparaciones', 356, 198, { size: 8, color: P.mint, align: 'center' }); banner('Un poco menos exacta, muchísimo más rápida', { y: 232 }); });
        }
      },
      {
        title: 'Filtros: fecha, permisos y tipo',
        caption: 'Entre los fragmentos cercanos, los metadatos descartan los caducados y los no autorizados.',
        steps: [
          'La búsqueda devuelve cuatro fragmentos cercanos a la pregunta.',
          'Filtro de fecha: se descarta la política de 2023, ya derogada.',
          'Filtro de permisos: quien pregunta no es de RR. HH.; se descarta el fragmento de nóminas. Mejor aún si se filtra antes de buscar.',
          'Al modelo solo llega lo relevante, vigente y autorizado.'
        ],
        draw(g) {
          const res = [['§2 Días de teletrabajo', '2026', 'todos', null], ['Política 2023 · §2', '2023', 'todos', 1], ['Nóminas · complemento', '2026', 'RR. HH.', 2], ['§3 Excepciones', '2026', 'todos', null]];
          res.forEach((r, i) => show(g.at(0), () => {
            const y = 16 + i * 46, out = r[3] != null && g.at(r[3]) > 0.5;
            box(14, y, 300, 38, { fill: out ? P.gray : P.gray2, shadow: false });
            txt(r[0], 24, y + 7, { size: 9, color: out ? P.gray3 : P.white });
            chip(r[1], 24, y + 20, { fill: r[1] === '2023' ? P.orange : P.light, size: 7 }); chip(r[2], 64, y + 20, { fill: r[2] === 'todos' ? P.mint : P.pink, size: 7 });
            if (out) { rect(20, y + 18, 288, 2, P.red); icon('cross', 290, y + 12, 1); }
            if (!out && g.from(3)) icon('check', 290, y + 12, 1);
          }, 4));
          show(g.at(1), () => chip('filtro: vigente', 330, 66, { fill: P.orange, size: 8.5, icon: 'calendar' }));
          show(g.at(2), () => chip('filtro: permisos', 330, 112, { fill: P.pink, size: 8.5, icon: 'lock' }));
          show(g.at(3), () => { arrow(320, 180, 360, 180, { color: P.mint }); robot(370, 160, { color: P.purple }); txt('solo lo relevante,\nvigente y autorizado', 386, 206, { size: 7.5, color: P.mint, align: 'center' }); });
        }
      },
      {
        title: 'Búsqueda híbrida y reordenación',
        caption: 'Palabras clave y significado buscan a la vez; un reordenador elige los mejores candidatos.',
        steps: [
          'Pregunta: «¿Qué garantía tiene el modelo RX-2231 si no puedo pagar la reparación?».',
          'La búsqueda por palabras clave encuentra el código exacto «RX-2231», que los embeddings confunden.',
          'La búsqueda por significado encuentra «impago» y «financiación», que no comparten palabras con la pregunta.',
          'Se fusionan los candidatos y un reordenador lee cada uno junto a la pregunta.',
          'Solo pasan al modelo los tres mejores, ordenados.'
        ],
        draw(g) {
          show(g.at(0), () => { box(14, 10, 452, 26, { fill: P.blue }); txt('«¿Qué garantía tiene el RX-2231 si no puedo pagar la reparación?»', 240, 17, { size: 8.5, color: P.ink, align: 'center', maxW: 440, fit: true, font: 'sans' }); });
          show(g.at(1), () => { card(14, 48, 170, 80, 'PALABRAS CLAVE', P.orange); chip('Ficha RX-2231 · garantía', 22, 74, { fill: P.paper, size: 7.5 }); chip('Manual RX-2231 · p. 4', 22, 98, { fill: P.paper, size: 7.5 }); });
          show(g.at(2), () => { card(14, 140, 170, 80, 'SIGNIFICADO', P.purple); chip('Política de impagos §2', 22, 166, { fill: P.paper, size: 7.5 }); chip('Financiación de reparaciones', 22, 190, { fill: P.paper, size: 7.5 }); });
          show(g.at(3), () => { arrow(188, 88, 222, 130, { color: P.orange }); arrow(188, 180, 222, 142, { color: P.purple }); card(226, 98, 100, 76, 'REORDENADOR', P.teal, { active: g.on(3) }); icon('target', 262, 126, 2); });
          show(g.at(4), () => {
            arrow(328, 136, 344, 136, { color: P.mint });
            card(346, 60, 120, 150, 'AL MODELO', P.mint);
            ['Ficha RX-2231', 'Impagos §2', 'Financiación'].forEach((t, i) => { badge(i + 1, 352, 86 + i * 38, P.mint); txt(t, 372, 88 + i * 38, { size: 8, maxW: 90, fit: true }); });
          });
        }
      }
    ],
    examples: [
      ['Filtro de fecha', 'Excluir políticas caducadas o priorizar la versión vigente.'],
      ['Filtro de permisos', 'Impedir que se recuperen documentos que la persona no puede consultar.'],
      ['Búsqueda híbrida', 'Un soporte técnico que encuentra referencias de producto exactas y descripciones de averías con otras palabras.'],
      ['Umbral', 'Si ningún fragmento supera 0,75 de similitud, el asistente responde «no consta» y deriva a una persona.']
    ],
    mistakes: [
      'Indexar documentos sin fecha ni versión.',
      'Olvidar los permisos: el índice puede «saltarse» el control de acceso.',
      'Confiar solo en embeddings para códigos, referencias o nombres propios.',
      'Centrarse en el nombre de la herramienta en lugar de en el flujo.'
    ],
    questions: [
      ['¿Qué metadato usarías para no recuperar una política caducada?', 'La fecha de vigencia o el estado de la versión (vigente / derogada), y filtrar por él en la búsqueda.'],
      ['¿Por qué los permisos deben aplicarse en la recuperación y, si es posible, antes de buscar?', 'Porque, si no, una persona podría obtener a través del asistente información de documentos a los que no tiene acceso directo. Filtrar antes de buscar evita que el fragmento prohibido llegue siquiera a la lista de candidatos.'],
      ['¿En qué tipo de preguntas añadirías búsqueda por palabras clave a la búsqueda semántica?', 'En las que contienen códigos, referencias, nombres propios, siglas o cifras exactas: números de pedido, modelos de producto, artículos de una ley.'],
      ['¿Qué ocurriría si se indexan documentos contradictorios y sin fecha?', 'El sistema podría recuperar indistintamente versiones antiguas y nuevas, y el modelo mezclarlas o elegir la equivocada sin que se note.']
    ],
    quiz: [
      { q: 'Un índice vectorial sirve para…', o: ['Traducir textos', 'Generar imágenes', 'Buscar rápidamente los vectores más cercanos a una consulta', 'Guardar contraseñas'], c: 2, why: 'Es la búsqueda de vecinos cercanos a gran escala.' },
      { q: 'La búsqueda aproximada (ANN, por ejemplo HNSW)…', o: ['Compara con todos los vectores', 'Cambia un poco de exactitud por mucha velocidad', 'Solo funciona con imágenes', 'Necesita reentrenar el modelo'], c: 1, why: 'Navega por un grafo de vecinos en lugar de compararlo todo.' },
      { q: 'Para no recuperar documentos que la persona no puede ver, se usa…', o: ['Bajar la temperatura del modelo', 'Añadir más tokens al contexto', 'Escribir un prompt más largo y detallado', 'Filtros de permisos en la recuperación'], c: 3, why: 'Los permisos deben respetarse al recuperar.' },
      { q: 'La búsqueda híbrida combina…', o: ['Búsqueda por palabras clave y búsqueda por significado', 'Dos modelos generativos', 'Texto e imágenes siempre', 'Búsqueda web y correo'], c: 0, why: 'Cada una cubre los puntos débiles de la otra.' }
    ],
    terms: [['Índice vectorial', 'Estructura que guarda vectores y metadatos y permite buscar los más cercanos a una consulta.'], ['Top-k', 'Número de fragmentos más parecidos que devuelve la búsqueda.'], ['ANN', 'Búsqueda aproximada de vecinos cercanos: rápida y casi siempre exacta.'], ['HNSW', 'Algoritmo de búsqueda aproximada basado en un grafo de vecinos en varias capas.'], ['Búsqueda híbrida', 'Combinación de búsqueda por palabras clave (como BM25) y búsqueda vectorial.'], ['Reordenación (reranking)', 'Segundo paso que reordena los candidatos con un modelo más preciso.']]
  });

  /* ------------------------------------------------------------------ */
  PL.concept({
    id: 'contexto-aumentado', block: 'b4', slide: 'S8', title: 'El prompt aumentado: lo que de verdad lee el modelo',
    idea: 'El modelo no consulta el índice: recibe un texto montado por el sistema con instrucciones, los fragmentos recuperados numerados y la pregunta. Lo que no esté en ese texto no existe para la respuesta, y las instrucciones deciden si rellena huecos o dice «no consta».',
    explain: [
      '**Del índice al modelo hay un paso que no se ve.** Cuando la búsqueda termina, el sistema **construye un prompt** y es ese texto, y solo ese, el que lee el modelo. Tiene tres partes:\n\n1. **Instrucciones** (el «prompt de sistema»): quién es el asistente, que responda solo con las fuentes, que cite cada afirmación y qué hacer si no hay evidencia.\n2. **Fragmentos recuperados**, numerados y con su procedencia (documento, apartado, versión, fecha).\n3. **La pregunta** de la persona, a veces con el historial de la conversación.',
      'Un ejemplo de prompt aumentado completo:\n\n```\nERES el asistente de atención al cliente de Viajes Lunaria.\nResponde SOLO con la información de las FUENTES.\nCita la fuente entre corchetes tras cada afirmación: [1], [2].\nSi las fuentes no contienen la respuesta, di «No consta en la\ndocumentación» y sugiere derivar a una persona.\nSi dos fuentes se contradicen, dilo y prioriza la versión vigente.\n\nFUENTES\n[1] Política de cancelaciones v3.0 (vigente 01/03/2026) › §2 Plazos\n    «Entre 15 y 30 días antes de la salida: reembolso del 70 %.»\n[2] Política de cancelaciones v3.0 › §7 Temporada alta\n    «Del 15/7 al 31/8, el tramo de 15-30 días se reduce al 50 %.»\n\nPREGUNTA\nCancelo un viaje del 5 de agosto con 20 días de antelación.\n¿Cuánto me devolvéis?\n```',
      '**La ventana de contexto.** Todo el prompt (instrucciones, fragmentos, historial y respuesta) tiene que caber en un límite de tokens. Los fragmentos **compiten por el espacio**.\n\n- **Pocos fragmentos** (top-k bajo): puede faltar justo la excepción.\n- **Demasiados**: entra ruido, sube el coste y el modelo atiende peor. Está documentado que muchos modelos aprovechan peor la información situada **en mitad** de un contexto largo que la del principio o el final (el efecto *lost in the middle*, Liu et al., 2023).',
      '**Instrucciones de anclaje (grounding).** Sin ellas, el modelo mezcla lo recuperado con su conocimiento general y el resultado parece citado pero no lo está. Con ellas, aparece el comportamiento que buscamos: **«no consta en las fuentes»**. Son instrucciones, no garantías: el modelo puede saltárselas, y por eso se evalúa.',
      '**Las preguntas de seguimiento.** En una conversación, «¿y en agosto?» no se puede buscar tal cual: no dice de qué se habla. Los buenos sistemas **reescriben** primero la pregunta en una versión autónoma («¿Cuánto se devuelve al cancelar con 20 días de antelación un viaje en agosto?») y buscan con esa.',
      '**En Gemini Notebook** no ves este prompt, pero el principio es el mismo: la herramienta recupera fragmentos de las **fuentes seleccionadas**, los numera y pide al modelo que responda con ellos. Por eso, desmarcar una fuente la saca del contexto, y una pregunta ambigua recupera fragmentos peores.'
    ],
    panels: [
      {
        title: 'Anatomía del prompt aumentado',
        caption: 'Instrucciones, fragmentos numerados y pregunta: el único texto que lee el modelo.',
        steps: [
          'El sistema escribe primero las instrucciones: responder solo con las fuentes, citar y decir «no consta» si falta evidencia.',
          'Después pega los fragmentos recuperados, numerados y con su procedencia.',
          'Al final, la pregunta de la persona.',
          'El modelo lee todo junto y responde citando [1] y [2]. Lo que no esté en este texto no existe para él.'
        ],
        draw(g) {
          show(g.at(0), () => slab(14, 12, 290, 58, 'INSTRUCCIONES', P.yellow, ['Responde SOLO con las FUENTES.', 'Cita [n] tras cada afirmación.', 'Si no consta, dilo.']));
          show(g.at(1), () => slab(14, 76, 290, 64, 'FUENTES RECUPERADAS', P.teal, ['[1] Política v3.0 (vigente) › §2: 15-30 días → 70 %', '[2] Política v3.0 › §7: del 15/7 al 31/8 → 50 %', '[3] Manual de atención › Escalado']));
          show(g.at(2), () => slab(14, 146, 290, 46, 'PREGUNTA', P.sky, ['Viaje del 5 de agosto, cancelo con 20 días…']));
          show(g.at(3), () => {
            path([[306, 114], [330, 114]], { color: P.purple });
            robot(334, 92, { s: 2, color: P.purple });
            bubble(312, 150, 156, 62, { text: 'Al ser temporada alta, se devuelve el 50 % [2] en lugar del 70 % [1].', tx: 366, ty: 140, size: 8, font: 'sans' });
            banner('Lo que no está en el prompt no existe para la respuesta', { y: 236 });
          });
        }
      },
      {
        title: '¿Cuántos fragmentos? (top-k)',
        caption: 'Pocos fragmentos dejan fuera la excepción; demasiados entierran lo importante en el medio.',
        steps: [
          'k = 1: solo entra el fragmento más parecido, la regla general (70 %). La excepción de temporada alta se queda fuera.',
          'k = 4: entran la regla, la excepción y algo de contexto. Suficiente para responder bien.',
          'k = 20: entra de todo. Más coste, más ruido y la excepción queda enterrada en mitad del contexto.',
          'No hay un número mágico: se ajusta con preguntas de prueba.'
        ],
        draw(g) {
          const C = [
            { t: 'k = 1', col: P.orange, seg: [P.blue], note: 'falta la excepción', ic: 'cross' },
            { t: 'k = 4', col: P.mint, seg: [P.blue, P.orange, P.gray3, P.gray3], note: 'regla + excepción', ic: 'check' },
            { t: 'k = 20', col: P.red, seg: [P.blue, P.gray3, P.gray3, P.gray3, P.gray3, P.gray3, P.gray3, P.orange, P.gray3, P.gray3, P.gray3, P.gray3, P.gray3, P.gray3], note: 'perdida en el medio', ic: 'warn' }
          ];
          C.forEach((cl, k) => show(g.at(k), () => {
            const x = 14 + k * 156;
            card(x, 14, 140, 206, cl.t, cl.col, { active: g.on(k) });
            cl.seg.forEach((sc, i) => rect(x + 14, 38 + i * 10, 112, 7, sc));
            if (k === 2) { frame(x + 10, 104, 120, 13, P.yellow, 1); qmark(x + 116, 120, P.yellow, 1); }
            icon(cl.ic, x + 58, 182, 2);
            txt(cl.note, x + 70, 204, { size: 8, color: cl.col, align: 'center' });
          }));
          show(g.at(3), () => banner('Azul: regla · naranja: excepción · gris: ruido', { y: 232 }));
        }
      },
      {
        title: 'Perdida en el medio',
        caption: 'Muchos modelos aprovechan mejor lo que está al principio y al final de un contexto largo.',
        steps: [
          'Metemos veinte fragmentos en el prompt, uno detrás de otro.',
          'La curva muestra cuánto aprovecha el modelo cada posición: mucho al principio y al final, poco en medio.',
          'Si la excepción que importa cae en la posición 10, es fácil que la respuesta la ignore.',
          'Solución: menos fragmentos, bien ordenados y lo más relevante arriba. Para eso sirve reordenar.'
        ],
        draw(g) {
          const x0 = 40, x1 = 440, n = 20, w = (x1 - x0) / n;
          const u = i => { const t = i / (n - 1); return 0.22 + 0.78 * Math.pow(2 * t - 1, 2); };
          const key = g.from(3) ? 0 : 9;
          txt('posición en el prompt →', 240, 186, { size: 8, color: P.light, align: 'center' });
          for (let i = 0; i < n; i++) {
            const isKey = g.from(2) && i === key;
            show(clamp(g.at(0) * 2.2 - i / n), () => {
              rect(x0 + i * w + 2, 160, w - 4, 18, isKey ? P.orange : P.gray3);
              txt(String(i + 1), x0 + i * w + w / 2, 165, { size: 6.5, color: P.ink, align: 'center' });
            }, 0);
          }
          show(g.at(1), () => {
            const m = n * 5;
            for (let i = 0; i < m; i++) { const t = i / (m - 1); if (t > g.at(1) * 1.05) break; const x = x0 + w / 2 + t * (x1 - x0 - w), y = 150 - u(t * (n - 1)) * 110; rect(x - 1, y - 1, 3, 3, P.mint); }
            txt('cuánto se aprovecha', 46, 30, { size: 8, color: P.mint });
          }, 0);
          show(g.at(2), () => {
            const x = x0 + key * w + w / 2, y = 150 - u(key) * 110;
            line(x, 158, x, y + 4, P.orange, 2, true);
            chip(g.from(3) ? 'excepción arriba: se usa' : 'excepción en el medio: se pierde', clamp(x, 110, 370), y - 26, { align: 'center', fill: g.from(3) ? P.mint : P.orange, size: 8 });
          }, 0);
          show(g.at(3), () => banner('Menos fragmentos y lo importante primero', { y: 236 }));
        }
      },
      {
        title: 'Instrucciones de anclaje',
        caption: 'La misma pregunta, sin instrucciones de anclaje y con ellas, cuando las fuentes no tienen la respuesta.',
        steps: [
          'Pregunta: «¿Cuál es el teléfono de la responsable de calidad?». Ninguna fuente lo contiene.',
          'Sin anclaje: el modelo rellena con un teléfono «típico» y pone una cita al primer fragmento que encontró.',
          'Con anclaje («si no consta, dilo»): reconoce el límite y propone derivar a una persona.',
          'Las instrucciones ayudan mucho, pero no son una garantía: hay que comprobar.'
        ],
        draw(g) {
          show(g.at(0), () => { box(60, 10, 360, 30, { fill: P.blue }); txt('«¿Cuál es el teléfono de la responsable de calidad?»', 240, 19, { size: 9, color: P.ink, align: 'center', font: 'sans' }); });
          show(g.at(1), () => {
            card(14, 54, 218, 150, 'SIN ANCLAJE', P.red, { active: g.on(1) });
            robot(26, 92, { s: 2, mood: 'sure', color: P.purple });
            bubble(66, 82, 156, 56, { text: '«Es el 958 000 111 [1].»', tx: 62, ty: 108, size: 9, font: 'sans' });
            chip('[1] = Manual › Horarios', 123, 150, { align: 'center', fill: P.paper, size: 7.5 });
            stamp('CITA FALSA', 123, 184, { a: late(g.at(1)), size: 10 });
          });
          show(g.at(2), () => {
            card(248, 54, 218, 150, 'CON ANCLAJE', P.mint, { active: g.on(2) });
            robot(260, 92, { s: 2, mood: 'happy', color: P.purple });
            bubble(300, 82, 156, 56, { text: '«No consta en la documentación. ¿Lo derivo?»', tx: 296, ty: 108, size: 8.5, font: 'sans' });
            icon('check', 344, 156, 2);
          });
          show(g.at(3), () => banner('Instrucción ≠ garantía: se evalúa con preguntas de prueba', { y: 220 }));
        }
      },
      {
        title: 'Preguntas de seguimiento',
        caption: 'Una pregunta incompleta se reescribe en versión autónoma antes de buscar.',
        steps: [
          'Primera pregunta: «¿Cuánto me devolvéis si cancelo con 20 días?». Respuesta: 70 % [1].',
          'Seguimiento: «¿Y en agosto?». Buscada tal cual, no dice de qué se habla y recupera fragmentos al azar.',
          'El sistema la reescribe usando el historial: «¿Cuánto se devuelve al cancelar con 20 días un viaje en agosto?».',
          'Con la pregunta completa, recupera la excepción de temporada alta: 50 % [2].'
        ],
        draw(g) {
          const w = win(14, 10, 250, 230, 'Conversación');
          show(g.at(0), () => { msg(w.x + 50, w.y, 186, '¿Cuánto me devolvéis si cancelo con 20 días?', { who: 'user' }); msg(w.x, w.y + 36, 160, 'El 70 % [1].', {}); });
          show(g.at(1), () => { msg(w.x + 120, w.y + 70, 116, '¿Y en agosto?', { who: 'user' }); });
          show(g.at(1), () => { card(280, 14, 186, 70, 'BUSCAR «¿Y EN AGOSTO?»', P.red, { size: 7.5 }); chip('Manual › horario de verano', 290, 40, { fill: P.paper, size: 7.5 }); chip('FAQ › agosto cerrado', 290, 60, { fill: P.paper, size: 7.5 }); }, 0);
          show(g.at(2), () => { arrow(370, 88, 370, 104, { color: P.yellow }); box(280, 106, 186, 52, { fill: P.yellow }); txt('¿Cuánto se devuelve al cancelar con 20 días un viaje en agosto?', 373, 112, { size: 8, color: P.ink, align: 'center', maxW: 172, font: 'sans' }); });
          show(g.at(3), () => { chip('[2] Política v3 › §7 Temporada alta', 373, 168, { align: 'center', fill: P.mint, size: 7.5 }); msg(w.x, w.y + 104, 200, 'En temporada alta (15/7-31/8), el 50 % [2].', {}); icon('check', 360, 196, 2); });
        }
      }
    ],
    examples: [
      ['Instrucción de anclaje', '«Responde solo con las fuentes; si no está, di "no consta"».'],
      ['Citas obligatorias', '«Tras cada afirmación, indica entre corchetes el número de la fuente».'],
      ['Contradicciones', '«Si dos fuentes discrepan, muéstralo y da prioridad a la versión vigente».'],
      ['Reescritura', '«¿Y para menores?» → «¿Qué descuento tienen los menores de 12 años en el paquete Granada Express?».']
    ],
    mistakes: [
      'Creer que el modelo «ve» todo el índice cuando solo ve los fragmentos recuperados.',
      'Meter 30 fragmentos «por si acaso» y enterrar lo importante.',
      'No decir qué hacer cuando no hay evidencia: el modelo rellenará.',
      'Buscar con preguntas de seguimiento sin reescribirlas.'
    ],
    questions: [
      ['¿Qué tres partes tiene un prompt aumentado y para qué sirve cada una?', 'Instrucciones (cómo comportarse: solo fuentes, citar, «no consta»), fragmentos recuperados numerados con procedencia (la evidencia) y la pregunta (lo que hay que responder).'],
      ['Redacta una instrucción de anclaje para un asistente de RR. HH.', 'Ejemplo: «Responde solo con la información de las fuentes adjuntas, citando [n] tras cada afirmación. Si no está, responde "No consta en la documentación de RR. HH." y sugiere escribir a rrhh@… No uses conocimiento general sobre legislación laboral».'],
      ['¿Por qué no conviene aumentar el top-k sin límite?', 'Porque añade ruido, coste y tiempo, y la información clave puede quedar en mitad de un contexto largo, donde los modelos la aprovechan peor.'],
      ['Una persona pregunta «¿y para menores?» tras hablar de un paquete concreto. ¿Qué debe hacer el sistema antes de buscar?', 'Reescribir la pregunta en una versión autónoma que incluya el tema y el paquete, usando el historial, y buscar con esa versión.']
    ],
    quiz: [
      { q: 'El modelo generativo en un RAG…', o: ['Consulta directamente todo el índice', 'Lee solo el prompt con instrucciones, fragmentos recuperados y pregunta', 'Lee todos los documentos originales', 'No recibe la pregunta'], c: 1, why: 'Lo que no está en el prompt no existe para la respuesta.' },
      { q: 'Una instrucción de anclaje sirve para…', o: ['Que responda solo con las fuentes y diga «no consta» si falta evidencia', 'Que escriba más rápido', 'Ahorrar tokens', 'Traducir'], c: 0, why: 'Reduce el relleno con conocimiento general.' },
      { q: 'El efecto «lost in the middle» describe que…', o: ['El modelo olvida la pregunta', 'Los fragmentos se borran', 'Muchos modelos aprovechan peor la información en mitad de un contexto largo', 'Las citas se desordenan'], c: 2, why: 'Por eso no conviene meter demasiados fragmentos.' },
      { q: '«¿Y en agosto?» debería, antes de buscar…', o: ['Buscarse tal cual', 'Ignorarse', 'Responderse sin fuentes', 'Reescribirse como pregunta autónoma con el historial'], c: 3, why: 'Así la búsqueda sabe de qué se habla.' }
    ],
    terms: [['Prompt aumentado', 'Texto que recibe el modelo con instrucciones, fragmentos recuperados y pregunta.'], ['Anclaje (grounding)', 'Instrucciones y mecanismos que obligan a responder a partir de las fuentes.'], ['Ventana de contexto', 'Cantidad máxima de tokens que el modelo puede leer y escribir en una petición.'], ['Lost in the middle', 'Tendencia a aprovechar peor la información situada en mitad de un contexto largo.']]
  });

  /* ------------------------------------------------------------------ */
  PL.concept({
    id: 'rag', block: 'b4', slide: 'S9', title: 'RAG: recuperar antes de generar',
    idea: 'RAG (Retrieval-Augmented Generation) une todas las piezas: preparar las fuentes una vez (trocear, vectorizar, indexar) y, en cada pregunta, recuperar los fragmentos relevantes y autorizados, ponerlos en el prompt y generar una respuesta con citas. Reduce las invenciones, pero no las elimina.',
    explain: [
      '**Dos fases.** Un sistema RAG tiene una parte que se hace **una vez** (y cada vez que cambian los documentos) y otra que ocurre **en cada pregunta**:\n\n- **Indexación:** reunir fuentes autorizadas → extraer el texto (y revisar que no esté mal escaneado) → trocear → calcular embeddings → guardar en el índice con metadatos.\n- **Consulta:** la pregunta (reescrita si es de seguimiento) → embedding → búsqueda híbrida con filtros de vigencia y permisos → reordenación → prompt aumentado → respuesta con citas.',
      'El mismo flujo, en un diagrama:\n\n```mermaid\nflowchart LR\n  subgraph Indexación\n  F[Fuentes autorizadas] --> T[Trocear] --> E1[Embeddings] --> I[(Índice + metadatos)]\n  end\n  subgraph Consulta\n  P[Pregunta] --> E2[Embedding] --> R[Buscar y filtrar]\n  I --> R\n  R --> K[Reordenar top-k] --> C[Prompt aumentado] --> G[Respuesta con citas]\n  end\n```',
      '**Qué aporta.** Responder sobre documentación propia **sin reentrenar** el modelo; trabajar con información **nueva** (basta con actualizar las fuentes); **trazabilidad**, si se conservan y se abren las citas; **control de acceso**, si los permisos se aplican al recuperar; y menos huecos rellenados con conocimiento general.',
      '**RAG frente a las alternativas.**\n\n- **Ajuste fino (fine-tuning):** adecuado para enseñar un estilo, un formato o una tarea. Inadecuado para datos que cambian o que hay que citar.\n- **Contexto largo** (pegar los documentos): bueno para una consulta puntual sobre pocos documentos. Caro y poco controlable con muchos.\n- **RAG:** la opción por defecto cuando hay muchos documentos, cambian, hay que citar o hay permisos. Se pueden combinar: un modelo ajustado al tono de la empresa que, además, usa RAG.',
      '**Dónde puede fallar.** En cada pieza: fuentes obsoletas, contradictorias o mal escaneadas (RAG **hereda** esos problemas, no los corrige); un corte que separa regla y excepción; una búsqueda que trae el fragmento equivocado o no supera los filtros; un modelo que malinterpreta una evidencia correcta o une dos fuentes en una conclusión que ninguna dice; y una persona que no abre la cita. RAG tampoco sustituye los permisos ni la política de datos de la organización.',
      '**Variantes que oirás.** *RAG agéntico* (el modelo decide si buscar, qué buscar y repite la búsqueda si lo encontrado no basta), *GraphRAG* (usa un grafo de entidades y relaciones además de fragmentos) y RAG **multimodal** (recupera también imágenes, tablas o audio). Todas mantienen la misma idea: **recuperar antes de generar**.'
    ],
    panels: [
      {
        title: 'El flujo completo',
        caption: 'Arriba, la preparación de las fuentes; abajo, lo que ocurre con cada pregunta.',
        steps: [
          'Se incorporan documentos autorizados al sistema.',
          'El sistema extrae el texto, lo divide en fragmentos y los indexa con sus metadatos.',
          'La persona formula una pregunta, que se transforma en un vector para buscar por significado.',
          'Se recuperan los fragmentos más relevantes, aplicando filtros de fuente, fecha o permisos.',
          'Pregunta y fragmentos entran juntos en el contexto del modelo, que redacta la respuesta con citas.'
        ],
        draw(g) {
          txt('PREPARACIÓN (una vez)', 20, 8, { size: 8, color: P.light });
          txt('CADA PREGUNTA', 20, 112, { size: 8, color: P.light });
          const top = flow([{ t: 'FUENTES', icon: 'folder' }, { t: 'TROCEAR', icon: 'scissors' }, { t: 'ÍNDICE', icon: 'db' }], 20, 22, 290, { bw: 82, bh: 56, active: g.step <= 1 ? g.step * 1.5 | 0 : -1, reveal: i => g.at(i === 0 ? 0 : 1) });
          const bot = flow([{ t: 'PREGUNTA', icon: 'question' }, { t: 'VECTOR', icon: 'chip' }, { t: 'RECUPERAR', icon: 'search' }, { t: 'CONTEXTO', icon: 'list' }, { t: 'RESPUESTA', icon: 'chat' }], 20, 128, 440, { bw: 76, bh: 56, active: g.step >= 2 ? [0, 0, 1, 2, 4][g.step] : -1, reveal: i => g.at([2, 2, 3, 4, 4][i]) });
          show(g.at(3), () => { path([[top[2].cx, 80], [top[2].cx, 104], [bot[2].cx, 104], [bot[2].cx, 126]], { color: P.mint }); chip('filtros', bot[2].cx + 8, 92, { fill: P.yellow, size: 7 }); });
          show(g.at(4), () => { chip('respuesta + citas [1][2]', 360, 200, { align: 'center', fill: P.mint, size: 9, icon: 'link' }); robot(330, 22, { color: P.purple }); txt('modelo generativo', 346, 64, { size: 7.5, color: P.light, align: 'center' }); arrow(bot[3].cx, 126, 346, 70, { color: P.purple, dash: true }); });
          if (g.on(3)) banner('Se recupera antes de generar', { y: 240, h: 22 });
        }
      },
      {
        title: 'Lo que resuelve RAG',
        caption: 'Cuatro ventajas de responder a partir de fuentes recuperadas, cada una en acción.',
        steps: [
          'Documentación propia sin reentrenar: los documentos entran en el índice; el modelo no se toca.',
          'Información nueva: se cambia la versión 2025 por la 2026 en el índice y la siguiente respuesta ya la usa.',
          'Trazabilidad: cada afirmación lleva un número que abre el fragmento exacto.',
          'Menos huecos: donde antes el modelo rellenaba con algo plausible, ahora hay un fragmento o un «no consta».'
        ],
        draw(g) {
          const C = [[14, 16], [246, 16], [14, 128], [246, 128]];
          const T = ['SIN REENTRENAR', 'INFORMACIÓN NUEVA', 'TRAZABILIDAD', 'MENOS HUECOS'];
          C.forEach((c, i) => show(g.at(i), () => card(c[0], c[1], 220, 104, T[i], P.mint, { active: g.on(i) })));
          show(g.at(0), () => {
            const [x, y] = C[0];
            icon('doc', x + 16, y + 40, 2); icon('doc', x + 16, y + 66, 2);
            packet([[x + 46, y + 56], [x + 108, y + 56]], 1.4, P.yellow);
            icon('db', x + 112, y + 42, 3);
            icon('gear', x + 178, y + 46, 2); line(x + 172, y + 44, x + 206, y + 78, P.red, 2); txt('el modelo no cambia', x + 110, y + 86, { size: 7.5, color: P.light, align: 'center' });
          });
          show(g.at(1), () => {
            const [x, y] = C[1], sw = g.at(1) > 0.6;
            chip('política 2025', x + 14, y + 36, { fill: sw ? P.gray3 : P.orange, size: 8, strike: sw ? P.red : null });
            chip('política 2026', x + 14, y + 62, { fill: P.mint, size: 8, a: 1 });
            arrow(x + 120, y + 70, x + 150, y + 70, { color: P.mint, p: g.at(1) });
            icon('db', x + 156, y + 48, 3);
            txt('basta con actualizar el índice', x + 110, y + 88, { size: 7.5, color: P.light, align: 'center' });
          });
          show(g.at(2), () => {
            const [x, y] = C[2];
            box(x + 12, y + 30, 110, 40, { fill: P.white, shadow: false }); txt('El reembolso es del 70 %', x + 18, y + 36, { size: 7.5, color: P.ink, font: 'sans', maxW: 80 });
            chip('1', x + 102, y + 34, { fill: P.yellow, size: 7, w: 14, h: 13, pad: 2 }); glow(x + 102, y + 34, 14, 13, P.yellow);
            arrow(x + 124, y + 42, x + 146, y + 42, { color: P.yellow });
            paper(x + 148, y + 26, 62, 66, { title: '§2' }); rect(x + 152, y + 48, 54, 14, 'rgba(247,207,90,.6)'); txt('15-30 d: 70 %', x + 179, y + 51, { size: 6.5, color: P.ink, align: 'center', font: 'sans' }); bars(x + 154, y + 70, 48, 2, { seed: 5, color: P.light });
          });
          show(g.at(3), () => {
            const [x, y] = C[3];
            txt('antes', x + 56, y + 28, { size: 7.5, color: P.red, align: 'center' }); txt('ahora', x + 166, y + 28, { size: 7.5, color: P.mint, align: 'center' });
            box(x + 14, y + 42, 84, 34, { fill: P.gray2, shadow: false }); qmark(x + 46, y + 48, P.red, 2);
            box(x + 122, y + 42, 84, 34, { fill: P.gray2, shadow: false }); chip('[2] §7', x + 164, y + 50, { align: 'center', fill: P.mint, size: 7.5 });
            txt('o «no consta»', x + 164, y + 82, { size: 7.5, color: P.light, align: 'center' });
          });
        }
      },
      {
        title: 'Dónde puede fallar',
        caption: 'Cinco puntos débiles a lo largo del flujo. RAG reduce riesgos, no los elimina.',
        steps: [
          'Recuperación: puede traer un fragmento irrelevante o incompleto.',
          'Fuentes: no corrige documentos obsoletos, contradictorios o mal escaneados.',
          'Generación: el modelo puede interpretar mal una evidencia correcta o inventar una conexión.',
          'Permisos: no sustituye el control de acceso ni la política de datos.',
          'Persona usuaria: si no abre la cita, el error pasa inadvertido.'
        ],
        draw(g) {
          const nodes = flow([{ t: 'FUENTES', icon: 'folder' }, { t: 'RECUPERAR', icon: 'search' }, { t: 'MODELO', icon: 'chip' }, { t: 'RESPUESTA', icon: 'chat' }], 20, 70, 440, { bw: 84, bh: 56 });
          const fails = [[1, 'fragmento erróneo', 0, true, 22], [0, 'obsoleto o mal escaneado', 1, false, 160], [2, 'malinterpreta o inventa', 2, true, 22], [0, 'no sustituye los permisos', 3, false, 182], [3, 'nadie abre la cita', 4, false, 160]];
          fails.forEach(f => show(g.at(f[2]), () => {
            const n = nodes[f[0]];
            icon('warn', n.cx - 12, f[3] ? 46 : 130, 2);
            chip(f[1], Math.max(70, n.cx), f[4], { align: 'center', fill: P.red, size: 8 });
            if (g.on(f[2])) pulse(n.cx, n.cy, P.red, 30);
          }));
          show(g.at(4), () => banner('RAG reduce el riesgo; no lo elimina', { y: 236 }));
        }
      },
      {
        title: 'Checklist de calidad de un sistema con fuentes',
        caption: 'Preguntas para evaluar un asistente que responde a partir de documentos.',
        steps: [
          '¿Las fuentes son fiables, vigentes y autorizadas? ¿Se identifican versión y fecha?',
          '¿Respeta los permisos de quien pregunta? ¿Incluye citas navegables y relevantes?',
          '¿La cita respalda la afirmación exacta, no solo el tema? ¿Qué hace cuando no hay evidencia o es contradictoria?',
          '¿Hay una persona responsable de actualizar y retirar fuentes?'
        ],
        draw(g) {
          const items = [['Fuentes fiables, vigentes y autorizadas', 0], ['Versión y fecha identificables', 0], ['Respeta los permisos de quien pregunta', 1], ['Citas navegables y relevantes', 1], ['La cita respalda la afirmación exacta', 2], ['Responde bien sin evidencia o con contradicciones', 2], ['Responsable de actualizar y retirar fuentes', 3]];
          items.forEach((it, i) => show(g.at(it[1]), () => {
            const y = 14 + i * 34;
            box(14, y, 380, 28, { fill: P.gray2, shadow: false });
            badge(i + 1, 20, y + 7, P.teal);
            txt(it[0], 42, y + 9, { size: 9, maxW: 340, fit: true });
            icon('check', 372, y + 8, 1);
          }, 4));
          show(g.at(3), () => { person(420, 200, { shirt: P.teal, label: 'responsable' }); });
        }
      },
      {
        title: 'RAG, ajuste fino o contexto largo',
        caption: 'Tres formas de llevar conocimiento propio al modelo, comparadas en cinco situaciones.',
        steps: [
          'Si los datos cambian a menudo, reentrenar no compensa; RAG solo necesita actualizar las fuentes.',
          'Con cientos de documentos, pegarlos en el chat no cabe ni sale a cuenta.',
          'Para citar el origen y controlar permisos, RAG es la única de las tres que lo hace de forma natural.',
          'Para cambiar el tono o el formato, el ajuste fino es la herramienta adecuada.',
          'Se pueden combinar: un modelo ajustado al estilo de la empresa que, además, usa RAG.'
        ],
        draw(g) {
          const head = ['', 'AJUSTE FINO', 'CONTEXTO LARGO', 'RAG'];
          const rows = [
            ['Datos que cambian', { t: 'reentrenar', color: P.red }, { t: 'pegar de nuevo', color: P.yellow }, { t: 'actualizar fuentes', color: P.mint }],
            ['Cientos de documentos', { t: 'sí', color: P.mint }, { t: 'no caben', color: P.red }, { t: 'sí', color: P.mint }],
            ['Citas y permisos', { t: 'no', color: P.red }, { t: 'a medias', color: P.yellow }, { t: 'sí', color: P.mint }],
            ['Cambiar tono o formato', { t: 'sí', color: P.mint }, { t: 'a medias', color: P.yellow }, { t: 'no es su función', color: P.red }]
          ];
          table(14, 18, [134, 106, 106, 106], [head].concat(rows), { rh: 38, size: 8.5, rowAlpha: j => j === 0 ? 1 : g.at(j - 1) });
          show(g.at(4), () => banner('Por defecto, RAG; para el estilo, ajuste fino; se pueden combinar', { y: 222 }));
        }
      },
      {
        title: 'Una pregunta, de principio a fin',
        caption: 'El recorrido completo de una pregunta real, pieza a pieza, con lo que pasa dentro de cada una.',
        steps: [
          'Llega la pregunta: «Cancelo con 20 días un viaje del 10 de agosto. ¿Cuánto me devolvéis?».',
          'Búsqueda híbrida: palabras clave y significado devuelven 20 candidatos.',
          'Filtros: fuera la política de 2024 (derogada) y la exportación del CRM (sin permiso).',
          'Reordenación: la tabla del §2 y la excepción de temporada alta (§7) suben a los primeros puestos.',
          'Prompt aumentado: instrucciones de anclaje, [1] §2, [2] §7 y la pregunta.',
          'Respuesta: «El 50 % [1][2]». Y la persona abre las dos citas antes de contestar al cliente.'
        ],
        draw(g) {
          const nodes = flow([{ t: 'PREGUNTA', icon: 'question' }, { t: 'BUSCAR', icon: 'search' }, { t: 'FILTRAR', icon: 'lock' }, { t: 'REORDENAR', icon: 'star' }, { t: 'PROMPT', icon: 'list' }, { t: 'RESPUESTA', icon: 'chat' }], 14, 14, 452, { bw: 66, bh: 54, active: g.step, size: 7 });
          if (g.step > 0) { const a = nodes[g.step - 1], b = nodes[g.step]; const m = mix([a.cx, a.cy + 30], [b.cx, b.cy + 30], g.at(g.step)); rect(m[0] - 4, m[1] - 4, 8, 8, P.ink); rect(m[0] - 3, m[1] - 3, 6, 6, P.yellow); }
          const panel = (fn) => { box(14, 86, 452, 142, { fill: P.gray2, shadow: false }); fn(); };
          if (g.on(0)) panel(() => { person(30, 116, { shirt: P.teal, still: true }); bubble(70, 106, 380, 50, { text: '«Cancelo con 20 días un viaje del 10 de agosto. ¿Cuánto me devolvéis?»', tx: 62, ty: 132, size: 9, font: 'sans' }); txt('pregunta autónoma: no hace falta reescribirla', 240, 180, { size: 8, color: P.light, align: 'center' }); });
          if (g.on(1)) panel(() => { for (let i = 0; i < 20; i++) { const x = 30 + (i % 10) * 43, y = 104 + Math.floor(i / 10) * 40; show(clamp(g.at(1) * 3 - i / 10), () => { box(x, y, 36, 30, { fill: P.paper, shadow: false }); bars(x + 5, y + 7, 26, 3, { seed: i + 1, gap: 6, color: P.navy }); }, 0); } txt('20 candidatos · palabras clave + significado', 240, 196, { size: 8.5, color: P.light, align: 'center' }); });
          if (g.on(2)) panel(() => { [['Política v3 §2', 0], ['Política v3 §7', 0], ['Política 2024 §2', 1], ['CRM · reclamaciones', 2], ['Manual §5', 0]].forEach((r, i) => { const y = 96 + i * 24, out = r[1] && g.at(2) > 0.5; chip(r[0], 30, y, { fill: out ? P.gray3 : P.paper, size: 8, w: 170, strike: out ? P.red : null }); if (r[1] === 1) chip('derogada', 214, y, { fill: P.orange, size: 7.5, icon: 'calendar' }); if (r[1] === 2) chip('sin permiso', 214, y, { fill: P.pink, size: 7.5, icon: 'lock' }); }); });
          if (g.on(3)) panel(() => { [['Política v3 §2 · tabla', 0.91, 2], ['Política v3 §7 · temporada alta', 0.88, 4], ['Manual §3 · cancelaciones', 0.62, 1], ['FAQ (no indexada)', 0, -1]].slice(0, 3).forEach((r, i) => { const y = 100 + i * 34, from = 100 + r[2] * 22, yy = lerp(from, y, ease(g.at(3))); badge(i + 1, 30, yy + 4, i < 2 ? P.mint : P.gray3); txt(r[0], 52, yy + 4, { size: 9, color: i < 2 ? P.white : P.light }); txt(String(r[1]).replace('.', ','), 330, yy + 4, { size: 8.5, color: P.mint }); }); });
          if (g.on(4)) panel(() => { slab(24, 94, 432, 34, 'INSTRUCCIONES', P.yellow, ['Solo con las fuentes · cita [n] · si no consta, dilo']); slab(24, 132, 432, 46, 'FUENTES', P.teal, ['[1] Política v3.0 §2: 15-30 días → 70 %', '[2] Política v3.0 §7: 15/7-31/8 → 50 %']); slab(24, 182, 432, 34, 'PREGUNTA', P.sky, ['20 días · salida 10 de agosto']); });
          if (g.on(5)) panel(() => {
            robot(26, 104, { s: 2, color: P.purple });
            bubble(70, 98, 172, 44, { text: 'El 50 %: es temporada alta [1][2].', tx: 64, ty: 120, size: 9, font: 'sans' });
            [['[1] §2 · tabla', '15-30 días → 70 %'], ['[2] §7 · temporada alta', '15/7-31/8 → 50 %']].forEach((c, i) => {
              const x = 262 + i * 102;
              show(clamp(g.at(5) * 2 - i * 0.5), () => { paper(x, 94, 96, 80, { title: c[0], size: 6.5 }); bars(x + 6, 112, 80, 2, { seed: i + 3, color: P.light }); rect(x + 4, 128, 88, 18, 'rgba(247,207,90,.65)'); txt(c[1], x + 8, 132, { size: 7.5, color: P.ink, font: 'sans' }); bars(x + 6, 152, 80, 2, { seed: i + 7, color: P.light }); }, 0);
            });
            arrow(244, 120, 258, 130, { color: P.yellow });
            person(190, 160, { shirt: P.teal, still: true });
            show(late(g.at(5)), () => { icon('check', 262, 186, 2); icon('check', 364, 186, 2); txt('antes de contestar, la persona abre y comprueba las dos citas', 240, 212, { size: 8, color: P.mint, align: 'center' }); }, 0);
          });
        }
      }
    ],
    examples: [
      ['Asistente de RR. HH.', 'Responde sobre la política vigente citando el apartado, y deriva a una persona si no hay evidencia.'],
      ['Soporte técnico', 'Recupera fragmentos de manuales por referencia de producto y muestra la página de origen.'],
      ['Atención al cliente', 'Un agente consulta plazos y excepciones de reembolso con la cita de la política vigente.'],
      ['Estudio', 'Un cuaderno de Gemini Notebook con los apuntes de la asignatura.']
    ],
    mistakes: [
      'Creer que RAG elimina las alucinaciones.',
      'Indexar todo sin revisar calidad, versión ni permisos.',
      'No abrir las citas porque «ya vienen de las fuentes».',
      'Usar ajuste fino para que el modelo «se sepa» documentos que cambian cada mes.'
    ],
    questions: [
      ['¿En qué punto del flujo RAG puede producirse una respuesta incorrecta?', 'En casi todos: fuentes obsoletas o mal escaneadas, troceado que separa condiciones, recuperación del fragmento equivocado, filtros mal aplicados, generación que malinterpreta o inventa, y citas que no respaldan la frase exacta.'],
      ['¿Qué tipo de pregunta no debería responder un sistema RAG sin escalarla a una persona?', 'Las de alto impacto o con evidencia insuficiente o contradictoria: decisiones legales, sanitarias, económicas o sobre personas concretas, y reclamaciones con importes elevados.'],
      ['Una empresa quiere que su chatbot «hable como la marca» y responda sobre un catálogo que cambia cada semana. ¿Qué propones?', 'Combinar: un ajuste fino o unas instrucciones de estilo para el tono, y RAG sobre el catálogo para los datos, que se actualizan reindexando sin tocar el modelo.'],
      ['Explica RAG con tus palabras en una frase.', 'Ejemplo: «Antes de responder, el sistema busca en mis documentos los fragmentos relevantes, se los pasa al modelo junto con la pregunta y me muestra de dónde sale cada afirmación».']
    ],
    quiz: [
      { q: 'RAG significa…', o: ['Retrieval-Augmented Generation: generación aumentada por recuperación', 'Random Answer Generator', 'Rapid AI Growth', 'Reentrenar Antes de Generar'], c: 0, why: 'Recupera fuentes y las añade al contexto antes de generar.' },
      { q: '¿Qué NO garantiza RAG?', o: ['Responder sobre documentación propia', 'Trabajar con información nueva', 'La exactitud del fragmento que se recupera en cada consulta', 'Mostrar citas si se conservan'], c: 2, why: 'La recuperación puede fallar.' },
      { q: 'Para actualizar la información de un sistema RAG…', o: ['Hay que reentrenar el modelo', 'No se puede', 'Se sube la temperatura', 'Basta con actualizar las fuentes indexadas'], c: 3, why: 'Es una de sus ventajas principales.' },
      { q: 'Para que un asistente adopte el tono de la marca, lo más adecuado es…', o: ['Ajuste fino o instrucciones de estilo', 'Más fragmentos en el top-k', 'Búsqueda híbrida', 'Un índice más grande'], c: 0, why: 'RAG aporta datos; el estilo se trabaja con instrucciones o ajuste fino.' }
    ],
    terms: [['RAG', 'Retrieval-Augmented Generation: arquitectura que recupera fragmentos de fuentes y los añade al contexto antes de generar.'], ['Indexación', 'Fase en la que se trocean, vectorizan y guardan las fuentes.'], ['Contexto recuperado', 'Fragmentos de las fuentes que se entregan al modelo junto con la pregunta.'], ['RAG agéntico', 'Variante en la que el modelo decide cuándo y qué buscar, y puede repetir la búsqueda.']]
  });

  /* ------------------------------------------------------------------ */
  PL.concept({
    id: 'evaluar-rag', block: 'b4', slide: 'S10', title: 'Evaluar un RAG: ¿falló la búsqueda o la respuesta?',
    idea: 'Ante una respuesta mala, la primera pregunta es: ¿estaba el fragmento correcto entre los recuperados? Si no, el fallo está en las fuentes, el troceado o la búsqueda; si sí, está en la generación. Se mide con un banco de preguntas de prueba que incluye las trampas que importan.',
    explain: [
      '**Separar el fallo en dos.** Un RAG tiene dos mitades que fallan por motivos distintos y se arreglan de forma distinta:\n\n1. **¿Se recuperó la evidencia correcta?** Mira los fragmentos que llegaron al modelo (en Gemini Notebook, abriendo las citas). Si el fragmento que responde no está, el problema es de **recuperación**: la fuente no estaba, estaba mal escaneada, el corte separó la excepción, un filtro la descartó o la pregunta era ambigua.\n2. **¿La respuesta se apoya en esa evidencia?** Si el fragmento estaba pero la respuesta lo contradice, lo exagera o le añade cosas, el problema es de **generación**: instrucciones de anclaje débiles, demasiado ruido en el contexto o un modelo que mezcla fuentes.',
      '**Tres medidas que se usan en la práctica** (la llamada «tríada de RAG»):\n\n- **Relevancia del contexto:** ¿lo recuperado sirve para esta pregunta? Una variante muy útil es el **recall@k**: ¿está el fragmento correcto entre los k recuperados?\n- **Fidelidad** (*faithfulness* o *groundedness*): ¿cada afirmación de la respuesta está respaldada por el contexto? Una respuesta puede ser correcta «por casualidad» y aun así no ser fiel.\n- **Relevancia de la respuesta:** ¿responde a lo que se preguntó, o a otra cosa parecida?',
      '**El banco de pruebas** (*golden set*). Entre 20 y 50 preguntas reales, cada una con su **respuesta esperada** y el **fragmento que la respalda**. No basta con preguntas fáciles: hay que incluir a propósito las trampas que más daño hacen:\n\n- Preguntas **sin respuesta** en las fuentes (debe decir «no consta»).\n- Preguntas que dependen de una **excepción** alejada de la regla.\n- Preguntas con **versiones** antiguas y nuevas en la colección.\n- Preguntas sobre información **reciente** que solo está en un acta o un correo.\n- Preguntas que alguien **no debería** poder responder por permisos.\n\nCada vez que se cambia algo (el troceado, el top-k, las instrucciones, el modelo), se vuelve a pasar el banco completo y se compara.',
      '**Del síntoma a la causa:**\n\n- Responde con la **versión antigua** → faltan metadatos de vigencia o el filtro no se aplica → marcar versiones, retirar las derogadas o filtrar.\n- **Olvida la excepción** → corte en mal sitio o top-k demasiado bajo → trocear por estructura, heredar títulos, subir k o reordenar.\n- **Inventa cuando no consta** → anclaje débil → instrucción explícita de «no consta» y umbral de similitud.\n- **Cita, pero la cita no dice eso** → fallo de generación → exigir cita por afirmación y revisar con muestra humana.\n- **Muestra lo que no debía** → permisos no aplicados en la recuperación → pre-filtrado por permisos.',
      '**Evaluación automática.** Existen herramientas (por ejemplo, RAGAS) que usan un modelo como «juez» para puntuar fidelidad y relevancia a escala. Son útiles para comparar versiones, pero el juez también se equivoca: se **valida con una muestra revisada por personas**, sobre todo en las preguntas de alto impacto.'
    ],
    panels: [
      {
        title: 'Árbol de diagnóstico',
        caption: 'Dos preguntas bastan para saber en qué mitad del sistema está el fallo.',
        steps: [
          'Una respuesta es incorrecta. Antes de tocar nada, abrimos los fragmentos que recibió el modelo.',
          '¿Está el fragmento correcto entre los recuperados? Si no: fallo de recuperación.',
          'Causas de recuperación: la fuente falta o está mal escaneada, un corte malo, un filtro o una pregunta ambigua.',
          'Si el fragmento sí estaba: ¿la respuesta se apoya en él? Si no: fallo de generación.',
          'Causas de generación: anclaje débil, demasiado ruido en el contexto o mezcla de fuentes.'
        ],
        draw(g) {
          show(g.at(0), () => { chip('respuesta incorrecta', 240, 8, { align: 'center', fill: P.red, size: 9, icon: 'cross', iconTint: P.ink }); arrow(240, 30, 240, 44, { color: P.light }); });
          show(g.at(1), () => {
            box(110, 46, 260, 34, { fill: P.yellow }); txt('¿Está el fragmento correcto entre los recuperados?', 240, 56, { size: 8.5, color: P.ink, align: 'center', maxW: 248, fit: true, font: 'sans' });
            path([[110, 63], [76, 63], [76, 100]], { color: P.red }); txt('NO', 86, 50, { size: 8, color: P.red });
          });
          show(g.at(2), () => {
            card(14, 102, 140, 116, 'RECUPERACIÓN', P.red, { active: g.on(2) });
            ['fuente ausente', 'mal escaneada', 'corte malo', 'filtro / permisos', 'pregunta ambigua'].forEach((s, i) => txt('· ' + s, 22, 126 + i * 17, { size: 8, color: P.white }));
          });
          show(g.at(3), () => {
            path([[370, 63], [404, 63], [404, 88]], { color: P.mint }); txt('SÍ', 388, 50, { size: 8, color: P.mint });
            box(260, 90, 206, 34, { fill: P.yellow }); txt('¿La respuesta se apoya en él?', 363, 100, { size: 8.5, color: P.ink, align: 'center', font: 'sans' });
            path([[300, 124], [300, 140]], { color: P.red }); txt('NO', 310, 128, { size: 8, color: P.red });
            path([[430, 124], [430, 140]], { color: P.mint }); txt('SÍ', 440, 128, { size: 8, color: P.mint }); chip('respuesta fundada', 424, 144, { align: 'center', fill: P.mint, size: 7.5, icon: 'check', iconTint: P.ink });
          });
          show(g.at(4), () => {
            card(176, 142, 196, 82, 'GENERACIÓN', P.orange, { active: g.on(4) });
            ['anclaje débil', 'demasiado ruido', 'mezcla de fuentes'].forEach((s, i) => txt('· ' + s, 184, 166 + i * 17, { size: 8, color: P.white }));
            banner('Primero ¿se encontró?, después ¿se usó bien?', { y: 236 });
          });
        }
      },
      {
        title: 'La tríada de evaluación',
        caption: 'Pregunta, contexto y respuesta: tres relaciones que se miden por separado.',
        steps: [
          'Tres piezas: la pregunta, el contexto recuperado y la respuesta.',
          'Relevancia del contexto (pregunta ↔ contexto): ¿lo recuperado sirve para esta pregunta?',
          'Fidelidad (contexto ↔ respuesta): ¿cada afirmación está respaldada por el contexto?',
          'Relevancia de la respuesta (respuesta ↔ pregunta): ¿responde a lo que se preguntó?',
          'Si una de las tres falla, la respuesta no es fiable, aunque «suene» bien.'
        ],
        draw(g) {
          const A = [240, 40], B = [90, 196], C = [390, 196];
          show(g.at(0), () => {
            card(A[0] - 60, A[1] - 24, 120, 44, 'PREGUNTA', P.sky); icon('question', A[0] - 6, A[1] - 2, 1);
            card(B[0] - 70, B[1] - 22, 140, 44, 'CONTEXTO', P.teal); icon('doc', B[0] - 6, B[1] + 2, 1);
            card(C[0] - 70, C[1] - 22, 140, 44, 'RESPUESTA', P.purple); icon('chat', C[0] - 6, C[1] + 2, 1);
          });
          show(g.at(1), () => { line(A[0] - 40, A[1] + 22, B[0] + 20, B[1] - 24, g.on(1) ? P.yellow : P.mint, 3); chip('relevancia del contexto', 118, 104, { align: 'center', fill: P.mint, size: 7.5 }); }, 0);
          show(g.at(2), () => { line(B[0] + 72, B[1], C[0] - 72, C[1], g.on(2) ? P.yellow : P.mint, 3); chip('fidelidad', 240, 206, { align: 'center', fill: P.mint, size: 8 }); }, 0);
          show(g.at(3), () => { line(A[0] + 40, A[1] + 22, C[0] - 20, C[1] - 24, g.on(3) ? P.yellow : P.mint, 3); chip('relevancia de la respuesta', 364, 104, { align: 'center', fill: P.mint, size: 7.5 }); }, 0);
          show(g.at(4), () => banner('Las tres a la vez, o la respuesta no es fiable', { y: 236 }));
        }
      },
      {
        title: 'Recall@k: ¿llegó el fragmento correcto?',
        caption: 'Para cada pregunta de prueba se mira si el fragmento que la responde está entre los k recuperados.',
        steps: [
          'Cada fila es una pregunta de prueba; cada casilla, uno de los k = 4 fragmentos recuperados, del más al menos parecido.',
          'En amarillo, el fragmento que de verdad responde. En 6 de las 8 preguntas está entre los cuatro primeros.',
          'Recall@4 = 6 / 8 = 75 %. En las otras dos, el modelo ni siquiera recibió la evidencia: no puede acertar.',
          'Con k = 8 también aparecen, pero entra el doble de ruido. Suele ser mejor arreglar el troceado o reordenar.'
        ],
        draw(g) {
          const hit = [1, 0, 2, -1, 0, 3, -1, 1], late = [-1, -1, -1, 5, -1, -1, 6, -1];
          const k = g.from(3) ? 8 : 4;
          txt('PREGUNTA', 18, 12, { size: 7.5, color: P.light });
          txt('FRAGMENTOS RECUPERADOS · K = ' + k, 84, 12, { size: 7.5, color: P.light });
          hit.forEach((h, r) => show(clamp(g.at(0) * 2 - r / 8), () => {
            const y = 28 + r * 25;
            txt('P' + (r + 1), 24, y + 3, { size: 9, color: P.white });
            for (let c = 0; c < k; c++) {
              const isHit = g.from(1) && (c === h || (k === 8 && c === late[r]));
              rect(84 + c * 30, y, 26, 18, isHit ? P.yellow : (c >= 4 ? P.gray2 : P.gray3));
              if (c >= 4) frame(84 + c * 30, y, 26, 18, P.red, 1);
            }
            if (g.from(1)) { const ok = h >= 0 || (k === 8 && late[r] >= 0); icon(ok ? 'check' : 'cross', 84 + k * 30 + 4, y + 2, 1); }
          }, 0));
          show(g.at(2), () => { card(370, 30, 96, 76, 'RECALL@4', P.purple, { size: 8 }); txt('75 %', 418, 56, { size: 17, color: P.yellow, align: 'center', weight: 700 }); txt('6 de 8', 418, 84, { size: 8, color: P.light, align: 'center' }); }, 0);
          show(g.at(3), () => { card(370, 116, 96, 62, 'RECALL@8', P.red, { size: 8 }); txt('100 %', 418, 140, { size: 14, color: P.yellow, align: 'center', weight: 700 }); txt('con el doble de ruido', 418, 160, { size: 7, color: P.light, align: 'center' }); chip('+ ruido', 266, 226, { align: 'center', fill: P.red, size: 8 }); banner('Mide si llega la evidencia antes de culpar al modelo', { y: 244, h: 20 }); }, 0);
        }
      },
      {
        title: 'Un banco de preguntas de prueba',
        caption: 'Preguntas con respuesta y fragmento esperados, incluidas las trampas que más daño hacen.',
        steps: [
          'Cada fila: tipo de pregunta, respuesta esperada y si el sistema acierta.',
          'Las fáciles casi siempre salen bien. No son las que preocupan.',
          'Las trampas: la excepción lejana, la versión antigua, lo que no consta y lo que no se debe mostrar.',
          'Tras cada cambio en el sistema, se vuelve a pasar el banco completo y se comparan los resultados.'
        ],
        draw(g) {
          const rows = [
            ['TIPO', 'ESPERADO', 'v1', 'v2'],
            ['directa', '70 % [§2]', { icon: 'check' }, { icon: 'check' }],
            ['excepción lejana', '50 % [§7]', { icon: 'cross' }, { icon: 'check' }],
            ['versión antigua', '14 días, no 30', { icon: 'cross' }, { icon: 'check' }],
            ['no consta', '«no consta»', { icon: 'cross' }, { icon: 'check' }],
            ['permisos', 'no mostrar', { icon: 'check' }, { icon: 'check' }]
          ];
          table(14, 14, [150, 150, 64, 64], rows, { rh: 32, size: 8.5, rowAlpha: j => j === 0 ? g.at(0) : j === 1 ? g.at(1) : j <= 5 ? g.at(2) : 1 });
          show(g.at(2), () => { frame(12, 76, 432, 132, P.yellow, 2); txt('TRAM\nPAS', 462, 128, { size: 7, color: P.yellow, align: 'center' }); }, 0);
          show(g.at(3), () => { txt('v1 → v2: corte por estructura + filtro de vigencia + anclaje', 240, 214, { size: 8.5, color: P.mint, align: 'center' }); banner('Mide antes y después de cada cambio', { y: 236 }); });
        }
      },
      {
        title: 'Del síntoma a la causa',
        caption: 'Los fallos más habituales, su causa probable y el arreglo que se prueba primero.',
        steps: [
          'Responde con la versión antigua → faltan metadatos de vigencia → marcar versiones y retirar las derogadas.',
          'Olvida la excepción → corte en mal sitio o k bajo → trocear por estructura, heredar títulos y reordenar.',
          'Inventa cuando no consta → anclaje débil → instrucción de «no consta» y umbral de similitud.',
          'La cita no dice eso → fallo de generación → exigir cita por afirmación y revisar con personas.'
        ],
        draw(g) {
          const R = [
            ['versión antigua', 'sin vigencia', 'marcar y filtrar versiones'],
            ['olvida la excepción', 'corte / k bajo', 'estructura + reordenar'],
            ['inventa', 'anclaje débil', '«no consta» + umbral'],
            ['cita que no dice eso', 'generación', 'cita por afirmación + revisión']
          ];
          [['SÍNTOMA', 14, P.red], ['CAUSA', 170, P.orange], ['ARREGLO', 326, P.mint]].forEach(h => txt(h[0], h[1] + 70, 8, { size: 8, color: h[2], align: 'center' }));
          R.forEach((r, i) => show(g.at(i), () => {
            const y = 26 + i * 52;
            chip(r[0], 14, y, { fill: P.red, size: 8, w: 140, h: 30 });
            arrow(156, y + 15, 168, y + 15, { color: P.light, head: 4 });
            chip(r[1], 170, y, { fill: P.orange, size: 8, w: 140, h: 30 });
            arrow(312, y + 15, 324, y + 15, { color: P.light, head: 4 });
            chip(r[2], 326, y, { fill: P.mint, size: 8, w: 140, h: 30 });
          }));
          show(g.at(3), () => banner('Cambia una cosa cada vez y vuelve a medir', { y: 236 }));
        }
      }
    ],
    examples: [
      ['Recall@k', 'De 40 preguntas de prueba, en 34 el fragmento correcto está entre los 4 recuperados: recall@4 = 85 %.'],
      ['Fidelidad', 'La respuesta dice «14 días hábiles» y la fuente dice «14 días naturales»: no es fiel aunque se parezca.'],
      ['Banco con trampas', 'Incluir a propósito la pregunta cuya respuesta solo está en el acta de ayer.'],
      ['Juez automático', 'Usar un modelo para puntuar 500 respuestas y revisar a mano una muestra de 50.']
    ],
    mistakes: [
      'Cambiar el modelo cuando el fallo estaba en la recuperación.',
      'Probar solo con preguntas fáciles.',
      'Cambiar varias cosas a la vez y no saber cuál mejoró el resultado.',
      'Fiarse de un juez automático sin revisión humana.'
    ],
    questions: [
      ['El asistente responde con el plazo de 2024 en lugar del de 2026. ¿Es un fallo de recuperación o de generación? ¿Cómo lo arreglarías?', 'De recuperación (o de fuentes): se recuperó el fragmento de la versión derogada. Se arregla retirando la versión antigua, marcando la vigencia como metadato y filtrando por ella.'],
      ['¿Qué diferencia hay entre una respuesta correcta y una respuesta fiel?', 'Correcta: coincide con la realidad. Fiel: cada afirmación está respaldada por el contexto recuperado. Una respuesta puede ser correcta por casualidad (con conocimiento general) sin ser fiel, y eso es un riesgo.'],
      ['Diseña cinco preguntas de prueba para un asistente de la política de vacaciones de tu empresa.', 'Una directa (días anuales), una de excepción (días extra por antigüedad), una de versión (si cambió el año pasado), una sin respuesta (algo que la política no regula) y una de permisos (los días que le quedan a un compañero concreto).']
    ],
    quiz: [
      { q: 'Si el fragmento correcto NO está entre los recuperados, el fallo es de…', o: ['Generación', 'Recuperación (fuentes, troceado, búsqueda o filtros)', 'La persona usuaria', 'La interfaz'], c: 1, why: 'El modelo no puede usar lo que no recibió.' },
      { q: 'La fidelidad (faithfulness) mide si…', o: ['La respuesta es larga', 'La respuesta es amable', 'Cada afirmación está respaldada por el contexto recuperado', 'La pregunta es clara'], c: 2, why: 'Es la relación contexto ↔ respuesta.' },
      { q: 'Un buen banco de pruebas incluye…', o: ['Preguntas sin respuesta, excepciones, versiones y permisos', 'Solo preguntas fáciles', 'Solo preguntas del día', 'Preguntas inventadas por el modelo'], c: 0, why: 'Las trampas son las que más daño hacen en producción.' }
    ],
    terms: [['Recall@k', 'Proporción de preguntas en las que el fragmento correcto está entre los k recuperados.'], ['Fidelidad', 'Grado en que la respuesta se apoya solo en el contexto recuperado.'], ['Banco de pruebas', 'Conjunto de preguntas con respuesta y fuente esperadas para evaluar un sistema.'], ['LLM como juez', 'Uso de un modelo para puntuar respuestas de otro de forma automática.']]
  });

  /* ------------------------------------------------------------------ */
  PL.concept({
    id: 'citas', block: 'b4', slide: 'S13', title: 'Citas: evidencia o decoración',
    idea: 'Una cita vale como evidencia cuando el fragmento afirma lo mismo que la respuesta: el mismo sujeto, la misma regla o dato y las mismas condiciones, en una fuente con autoridad, vigente y en su contexto. Compartir tema o palabras no basta.',
    explain: [
      '**Relevante no es suficiente.** Una cita puede hablar del tema (relevante) sin demostrar la afirmación concreta (evidencia suficiente). Un estudio de Stanford sobre buscadores generativos encontró que solo alrededor del **74,5 %** de las citas respaldaban por completo la frase a la que acompañaban (Liu, Zhang y Liang, 2023). Una de cada cuatro, no.',
      '**Método S·R·C** para comparar afirmación y fragmento:\n\n- **Sujeto:** ¿habla de lo mismo? («paquetes vacacionales» no es «billetes de avión sueltos»).\n- **Regla o dato:** ¿afirma lo mismo? («70 %» no es «hasta el 70 %»; «14 días naturales» no es «14 días hábiles»).\n- **Condiciones:** ¿con las mismas condiciones y excepciones? («entre 15 y 30 días antes», «salvo temporada alta»).',
      '**Y tres preguntas sobre la fuente (A·F·V):** ¿qué **autoridad** tiene (política oficial, borrador, blog, FAQ)? ¿De qué **fecha** es? ¿Qué **versión**, y sigue vigente? Un blog de 2021 y la política aprobada de 2026 no valen lo mismo, aunque digan casi lo mismo.',
      '**Seis formas de que una cita falle:**\n\n- **Decorativa:** comparte vocabulario, pero no afirma lo mismo.\n- **Recortada:** omite el «salvo…» o el «solo en…» que estaba en la línea siguiente.\n- **Desactualizada:** respalda la frase, pero la fuente está derogada.\n- **Mal atribuida:** la información existe, pero en otra fuente distinta de la citada.\n- **Fusionada:** la afirmación combina dos fuentes y ninguna dice el conjunto («el seguro cuesta 45 € y cubre la fuerza mayor»).\n- **Inferencia disfrazada:** el modelo deduce algo razonable y lo presenta como si estuviera escrito.',
      '**Verificar en cinco pasos:** 1) aísla una afirmación; 2) abre su cita; 3) aplica S·R·C; 4) lee las líneas de antes y después; 5) comprueba A·F·V. Veredicto: **respalda**, **respalda en parte**, **no respalda** o **contradice**. Para decisiones importantes, vuelve siempre a la fuente original.'
    ],
    panels: [
      {
        title: 'Cita exacta frente a cita decorativa',
        caption: 'Dos citas para la misma afirmación. Solo una la demuestra.',
        steps: [
          'Afirmación de la respuesta: «La revisión es obligatoria antes de publicar».',
          'Cita 1: «Todo contenido debe revisarse antes de su publicación». Mismo sujeto, misma obligación, misma condición.',
          'Cita 2: «Las revisiones pueden mejorar la calidad del contenido». Comparte vocabulario, pero no habla de obligación.',
          'Relevancia temática no es evidencia suficiente.'
        ],
        draw(g) {
          show(g.at(0), () => { box(60, 12, 360, 34, { fill: P.yellow }); txt('«La revisión es obligatoria antes de publicar.»', 240, 22, { size: 10, color: P.ink, align: 'center', font: 'sans' }); });
          show(g.at(1), () => {
            card(14, 64, 218, 150, 'CITA 1 · EXACTA', P.mint, { active: g.on(1) });
            txt('«Todo contenido debe revisarse antes de su publicación.»', 123, 90, { size: 9.5, align: 'center', maxW: 196, font: 'sans' });
            ['sujeto ✓', 'obligación ✓', 'antes de publicar ✓'].forEach((s, i) => chip(s, 123, 136 + i * 22, { align: 'center', fill: P.mint, size: 8, w: 140 }));
          });
          show(g.at(2), () => {
            card(248, 64, 218, 150, 'CITA 2 · DECORATIVA', P.red, { active: g.on(2) });
            txt('«Las revisiones pueden mejorar la calidad del contenido.»', 357, 90, { size: 9.5, align: 'center', maxW: 196, font: 'sans' });
            ['tema ✓', 'obligación ✗', 'condición ✗'].forEach((s, i) => chip(s, 357, 136 + i * 22, { align: 'center', fill: i ? P.red : P.mint, size: 8, w: 140 }));
          });
          show(g.at(3), () => banner('Relevante ≠ evidencia suficiente', { y: 232 }));
        }
      },
      {
        title: 'Lee el contexto de la cita',
        caption: 'Al ampliar el fragmento citado aparece una condición que cambia el sentido.',
        steps: [
          'La cita parece perfecta: «La revisión es obligatoria antes de publicar».',
          'Ampliamos el fragmento y leemos las líneas anteriores y posteriores…',
          '…«En los proyectos piloto de 2023, la revisión es obligatoria antes de publicar». La obligación tenía límites.',
          'Antes de reutilizar una cita, lee su contexto: puede estar recortada.'
        ],
        draw(g) {
          paper(60, 14, 360, 200, { title: 'manual-de-estilo.pdf · p. 7' });
          show(g.at(1), () => { bars(74, 44, 330, 2, { seed: 4, gap: 10 }); bars(74, 150, 330, 3, { seed: 7, gap: 10 }); }, 0);
          const y = 98;
          if (g.from(2)) { rect(70, y - 26, 340, 20, 'rgba(242,140,56,.45)'); txt('En los proyectos piloto de 2023,', 76, y - 22, { size: 10, color: P.ink, font: 'sans' }); }
          rect(70, y - 4, 340, 22, 'rgba(247,207,90,.55)');
          txt('la revisión es obligatoria antes de publicar.', 76, y, { size: 10, color: P.ink, font: 'sans' });
          if (g.from(2)) { rect(70, y + 22, 340, 20, 'rgba(242,140,56,.45)'); txt('Desde 2024 se aplica solo a contenido externo.', 76, y + 26, { size: 10, color: P.ink, font: 'sans' }); }
          show(g.at(1), () => { arrow(240, 66, 240, 74, { color: P.yellow }); arrow(240, 152, 240, 144, { color: P.yellow }); }, 0);
          show(g.at(2), () => stamp('CONDICIÓN', 380, 60, { a: late(g.at(2)), color: P.orange, size: 10 }));
          show(g.at(3), () => banner('Lee las líneas anteriores y posteriores', { y: 232 }));
        }
      },
      {
        title: 'Seis formas de que una cita falle',
        caption: 'Lo que afirma la respuesta (A) frente a lo que dice la cita (C). Todas pasan inadvertidas si no se abre la fuente.',
        steps: [
          'Decorativa: comparte palabras, no afirma lo mismo. Recortada: le falta el «salvo…» de la línea siguiente.',
          'Desactualizada: respalda la frase, pero la fuente está derogada. Mal atribuida: el dato existe, pero en otra fuente.',
          'Fusionada: une dos fuentes en algo que ninguna dice. Inferencia disfrazada: deduce algo y lo presenta como escrito.',
          'Ninguna se detecta contando citas: solo leyéndolas.'
        ],
        draw(g) {
          const F = [
            ['DECORATIVA', P.red, '«La revisión es obligatoria»', '«Revisar mejora la calidad»'],
            ['RECORTADA', P.orange, '«Siempre puedes teletrabajar»', '«…dos días, salvo en el cierre»'],
            ['DESACTUALIZADA', P.yellow, '«Devolvemos en 30 días»', '«30 días» · versión de 2023'],
            ['MAL ATRIBUIDA', P.pink, '«Plazo: 14 días [1]»', '[1] no lo dice; está en [3]'],
            ['FUSIONADA', P.purple, '«Cuesta 45 € y cubre FM»', '[1] 45 € (2027) · [2] FM'],
            ['INFERENCIA', P.sky, '«Vale para todas las tarifas»', 'la fuente no lo dice']
          ];
          F.forEach((f, i) => show(g.at(Math.floor(i / 2)), () => {
            const x = 14 + (i % 2) * 230, y = 10 + Math.floor(i / 2) * 74;
            card(x, y, 220, 66, f[0], f[1], { active: g.on(Math.floor(i / 2)) });
            chip('A', x + 8, y + 24, { fill: P.sky, size: 7, w: 14, h: 14, pad: 2 }); txt(f[2], x + 28, y + 26, { size: 8, maxW: 186, fit: true, font: 'sans' });
            chip('C', x + 8, y + 44, { fill: P.paper, size: 7, w: 14, h: 14, pad: 2 }); txt(f[3], x + 28, y + 46, { size: 8, maxW: 172, fit: true, font: 'sans', color: P.light });
            icon('cross', x + 200, y + 44, 1);
          }));
          show(g.at(3), () => banner('No cuentes citas: léelas', { y: 236 }));
        }
      },
      {
        title: 'Verificar una cita en cinco pasos',
        caption: 'Un procedimiento fijo para decidir si una cita respalda la afirmación.',
        steps: [
          '1 · Aísla una afirmación concreta de la respuesta. 2 · Abre su cita.',
          '3 · Compara S·R·C: ¿mismo sujeto, misma regla o dato, mismas condiciones?',
          '4 · Lee las líneas de antes y después. 5 · Comprueba A·F·V: autoridad, fecha y versión.',
          'Veredicto: respalda, respalda en parte, no respalda o contradice.'
        ],
        draw(g) {
          const S = [['Aísla una afirmación', 0], ['Abre la cita', 0], ['Sujeto · Regla · Condiciones', 1], ['Lee antes y después', 2], ['Autoridad · Fecha · Versión', 2]];
          S.forEach((s, i) => show(g.at(s[1]), () => {
            const y = 14 + i * 34;
            box(14, y, 250, 28, { fill: P.gray2, shadow: false });
            badge(i + 1, 20, y + 7, P.teal);
            txt(s[0], 42, y + 9, { size: 9, maxW: 214, fit: true });
          }, 4));
          show(g.at(3), () => {
            card(282, 14, 184, 170, 'VEREDICTO', P.purple);
            [['RESPALDA', P.mint], ['RESPALDA EN PARTE', P.yellow], ['NO RESPALDA', P.orange], ['CONTRADICE', P.red]].forEach((v, i) => chip(v[0], 374, 42 + i * 34, { align: 'center', fill: v[1], size: 8.5, w: 160 }));
            banner('Si importa, vuelve a la fuente original', { y: 236 });
          });
        }
      },
      {
        title: 'Autoridad, fecha y versión',
        caption: 'La misma regla aparece en tres fuentes de distinto valor.',
        steps: [
          'Fuente A: un blog personal de 2021 que resume la norma.',
          'Fuente B: un borrador interno, versión 0.3, sin aprobar.',
          'Fuente C: la política oficial vigente, versión 2.0 de 2026.',
          'Solo C sirve como evidencia para una decisión. Autoridad, fecha y versión también cuentan.'
        ],
        draw(g) {
          const src = [['A · BLOG PERSONAL', '2021', 'resumen no oficial', 0.2, P.red], ['B · BORRADOR v0.3', '2025', 'sin aprobar', 0.45, P.orange], ['C · POLÍTICA v2.0', '2026', 'oficial y vigente', 0.95, P.mint]];
          src.forEach((s, i) => show(g.at(i), () => {
            const x = 14 + i * 156;
            card(x, 14, 140, 200, s[0], s[4], { active: g.on(i) || (g.on(3) && i === 2) });
            icon(i === 0 ? 'globe' : 'doc', x + 52, 42, 3);
            chip(s[1], x + 70, 90, { align: 'center', fill: P.paper, size: 9, icon: 'calendar' });
            txt(s[2], x + 70, 118, { size: 8.5, align: 'center', color: P.light });
            meter(x + 14, 160, 112, s[3], { label: 'valor como evidencia', n: 8 });
            if (g.from(3)) icon(i === 2 ? 'check' : 'cross', x + 58, 184, 2);
          }));
          show(g.at(3), () => banner('Autoridad · fecha · versión', { y: 232 }));
        }
      }
    ],
    examples: [
      ['Cita suficiente', 'El fragmento afirma la misma regla, con el mismo sujeto y condiciones.'],
      ['Cita decorativa', 'Habla del tema con palabras parecidas, pero no prueba la conclusión.'],
      ['Cita recortada', 'Omite «salvo» o «solo en» y cambia el alcance de la norma.'],
      ['Cita fusionada', '«El seguro cuesta 45 € [1] y cubre la fuerza mayor [2]»: el precio sale de un acta futura y la cobertura, de otra fuente.']
    ],
    mistakes: [
      'Contar las citas en lugar de leerlas.',
      'Aceptar una cita porque comparte palabras clave.',
      'Ignorar la fecha o la versión de la fuente citada.',
      'No distinguir lo que dice la fuente de lo que el modelo deduce.'
    ],
    questions: [
      ['¿Cómo distingues relevancia temática de evidencia suficiente?', 'Comparando la afirmación con el fragmento: ¿mismo sujeto, misma regla o dato, mismas condiciones? Si solo comparte el tema o el vocabulario, es relevante pero no evidencia.'],
      ['La respuesta dice «el reembolso se hace en 14 días hábiles [1]» y la fuente [1] dice «14 días naturales». ¿Qué veredicto das?', '«Respalda en parte» o «no respalda»: sujeto y cifra coinciden, pero la unidad cambia el plazo real. Hay que corregir la respuesta.'],
      ['¿Qué puede fallar aunque una respuesta cite una fuente?', 'Que la fuente no diga exactamente eso, que esté recortada, que sea antigua o no oficial, que el dato esté en otra fuente o que la afirmación combine dos fuentes.'],
      ['¿Qué tres datos de una fuente comprobarías antes de usarla para decidir?', 'Autoridad (quién la emite), fecha y versión (si está vigente).']
    ],
    quiz: [
      { q: 'Una cita es evidencia suficiente cuando…', o: ['Comparte el mismo tema general', 'Demuestra exactamente lo que afirma la respuesta, no solo el tema', 'Es la fuente con más texto disponible', 'Es la primera que aparece en la búsqueda'], c: 1, why: 'Debe demostrar la frase concreta.' },
      { q: 'S·R·C significa…', o: ['Sistema, Recuperación, Contexto', 'Sujeto, Regla o dato, Condiciones', 'Síntesis, Resumen, Cita', 'Seguridad, Riesgo, Control'], c: 1, why: 'Las tres cosas que deben coincidir entre afirmación y fragmento.' },
      { q: '¿Por qué leer las líneas que rodean una cita?', o: ['Por cortesía', 'Para contar palabras', 'Porque una condición cercana puede cambiar el sentido', 'No es necesario'], c: 2, why: 'Las citas recortadas engañan.' },
      { q: 'Una cita «fusionada» es aquella en la que…', o: ['La fuente está en otro idioma', 'La afirmación combina dos fuentes y ninguna dice el conjunto', 'Se cita dos veces lo mismo', 'La cita es muy larga'], c: 1, why: 'Cada parte puede estar respaldada y el conjunto no.' }
    ],
    terms: [['Cita', 'Referencia localizable al fragmento de una fuente que respalda una afirmación.'], ['Evidencia suficiente', 'Fragmento que demuestra la afirmación exacta, no solo el tema.'], ['S·R·C', 'Sujeto, Regla o dato, Condiciones: lo que debe coincidir entre afirmación y cita.'], ['A·F·V', 'Autoridad, Fecha y Versión: lo que se comprueba de la fuente.']]
  });

  /* ------------------------------------------------------------------ */
  PL.concept({
    id: 'notebooklm', block: 'b4', slide: 'S11', title: 'Taller: Gemini Notebook (antes NotebookLM)',
    idea: 'Gemini Notebook es un RAG listo para usar: tú eliges las fuentes, la herramienta las trocea e indexa, y cada respuesta llega con citas numeradas. Lo que se practica no son los botones, que cambian, sino el flujo fuente → pregunta → respuesta → cita → verificación.',
    explain: [
      '**Qué es.** Gemini Notebook (el producto que Google llamaba NotebookLM, en notebook.google y dentro de la app de Gemini) es un entorno para trabajar con **un conjunto cerrado de fuentes**: PDF, documentos y presentaciones de Google, páginas web, vídeos de YouTube, audio o texto pegado. Responde a partir de ellas y muestra **citas** que abren el fragmento exacto. Las opciones, los límites y los formatos cambian con frecuencia: comprueba la ayuda oficial antes del taller.',
      '**Cómo encaja con lo que hemos visto:**\n\n- El **panel de fuentes** es la colección autorizada. Al añadir una fuente, la herramienta la trocea y la indexa por ti (no eliges el tamaño de los fragmentos).\n- Las **casillas de cada fuente** funcionan como un filtro: solo se busca en las fuentes marcadas.\n- El **chat** construye un prompt aumentado con los fragmentos recuperados y tu pregunta.\n- Los **números de cita** te llevan al fragmento usado: ahí haces la verificación S·R·C y A·F·V.\n- Las **notas** y el panel de **Studio** (guías de estudio, preguntas frecuentes, mapas mentales, resúmenes de audio o vídeo, tarjetas o cuestionarios) generan contenido a partir de las fuentes. **También hay que validarlo**: son textos generados, no copias.',
      '**Pasos del taller:**\n\n1. Crea un cuaderno con un **nombre descriptivo** («Atención Viajes Lunaria · fuentes vigentes»).\n2. Añade solo fuentes **autorizadas, vigentes y sin datos personales**. Comprueba que se han procesado bien (abre una y busca una tabla).\n3. Pregunta algo explícito en una fuente y **abre la cita**.\n4. Pregunta algo que **no esté** y observa si la herramienta reconoce el límite.\n5. Pregunta algo que dependa de una **excepción** o de una **versión** y comprueba si la encuentra.\n6. Desmarca y marca fuentes para ver cómo **cambia la respuesta**.\n7. Genera una guía de estudio o unas preguntas frecuentes y **valida una muestra** con las citas.',
      '**Preguntas que obligan a usar evidencia.** En lugar de «hazme un resumen», pide estructura y procedencia: «Compara cómo definen RAG los documentos y cita la fuente de cada diferencia», «Extrae los plazos en una tabla con plazo, porcentaje, condición y cita; si falta, escribe "no especificado"», «Si las fuentes se contradicen, muéstrame ambas y dime cuál es más reciente».',
      '**Privacidad y uso responsable.** No subas datos personales, documentos confidenciales ni material sin permiso. Usa la cuenta que indique tu organización y revisa sus condiciones de uso de datos. Que una herramienta cite no la convierte en responsable: la decisión sigue siendo tuya.',
      '**Alternativas equivalentes.** Un *Gem* de Gemini o un proyecto de Claude o ChatGPT con archivos adjuntos siguen el mismo patrón (fuentes + instrucciones + citas), con distinta forma de mostrar las citas. El método de verificación es idéntico.'
    ],
    panels: [
      {
        title: 'Qué hace por dentro',
        caption: 'Cada parte de la interfaz corresponde a una pieza de RAG.',
        steps: [
          'Panel de fuentes = la colección autorizada. Al añadir una fuente, la herramienta la trocea y la indexa.',
          'Casillas de cada fuente = filtro: solo se busca en las fuentes marcadas.',
          'Chat = prompt aumentado: tu pregunta más los fragmentos recuperados.',
          'Números de cita = la evidencia: al pulsarlos se abre el fragmento usado.',
          'Studio (guías, mapas, audio…) = contenido generado a partir de las fuentes: también hay que validarlo.'
        ],
        draw(g) {
          const w = win(10, 8, 460, 176, 'Gemini Notebook · Atención Viajes Lunaria');
          box(w.x, w.y, 120, 146, { fill: P.gray2, shadow: false }); txt('FUENTES', w.x + 8, w.y + 6, { size: 8, color: P.teal });
          ['Política v3', 'Manual', 'Acta 28/10', 'Política v2'].forEach((s, i) => { const on = i < 3 || !g.from(1); rect(w.x + 8, w.y + 24 + i * 22, 9, 9, on ? P.mint : P.gray3); txt(s, w.x + 22, w.y + 24 + i * 22, { size: 8, color: on ? P.white : P.gray3 }); });
          box(w.x + 128, w.y, 192, 146, { fill: P.gray, shadow: false }); txt('CHAT', w.x + 136, w.y + 6, { size: 8, color: P.sky });
          msg(w.x + 176, w.y + 22, 138, '¿Cuánto devolvemos a 20 días?', { who: 'user', size: 7.5 });
          box(w.x + 134, w.y + 58, 180, 40, { fill: P.white, shadow: false }); txt('El 70 % del importe', w.x + 140, w.y + 64, { size: 8, color: P.ink, font: 'sans' }); chip('1', w.x + 246, w.y + 62, { fill: P.yellow, size: 7, w: 14, h: 13, pad: 2 });
          box(w.x + 328, w.y, 120, 146, { fill: P.gray2, shadow: false }); txt('STUDIO', w.x + 336, w.y + 6, { size: 8, color: P.purple });
          ['Guía de estudio', 'Preguntas frec.', 'Mapa mental', 'Resumen audio'].forEach((s, i) => chip(s, w.x + 336, w.y + 24 + i * 24, { fill: P.paper, size: 7, w: 104 }));
          const lab = [['COLECCIÓN + ÍNDICE', 110, P.teal], ['FILTRO', 40, P.mint], ['PROMPT AUMENTADO', 230, P.sky], ['EVIDENCIA', 262, P.yellow], ['GENERADO: VALIDAR', 404, P.purple]];
          lab.forEach((l, i) => show(g.at(i), () => {
            const y = 196 + (i % 2) * 22;
            chip(l[0], l[1], y, { align: 'center', fill: l[2], size: 7.5 });
            const ty = [w.y + 50, w.y + 92, w.y + 80, w.y + 70, w.y + 90][i];
            const tx = [w.x + 70, w.x + 12, w.x + 230, w.x + 253, w.x + 388][i];
            arrow(l[1], y, tx, ty + 8, { color: l[2], dash: true, head: 4 });
            if (i === 1) frame(w.x + 6, w.y + 88, 112, 14, P.red, 1);
            if (i === 3) glow(w.x + 246, w.y + 62, 14, 13, P.yellow);
          }));
        }
      },
      {
        title: 'Fuente → pregunta → respuesta → cita',
        caption: 'Recreación simplificada de un cuaderno basado en fuentes (la interfaz real puede variar).',
        steps: [
          'Creamos un cuaderno con nombre descriptivo y añadimos tres o cuatro fuentes autorizadas.',
          'Preguntamos algo cuya respuesta esté explícita en una fuente.',
          'La respuesta llega con marcas de cita numeradas.',
          'Abrimos la cita: aparece el fragmento exacto. Ahora sí podemos comprobar.'
        ],
        draw(g) {
          const w = win(10, 8, 460, 254, 'Gemini Notebook · Fundamentos de IA aplicada');
          show(g.at(0), () => {
            box(w.x, w.y, 120, 222, { fill: P.gray2, shadow: false });
            txt('FUENTES', w.x + 8, w.y + 6, { size: 8, color: P.teal });
            ['apuntes.md', 'guia-rag.pdf', 'articulo-web', 'otra-asign.pdf'].forEach((s, i) => { icon('doc', w.x + 8, w.y + 24 + i * 24, 1, P.teal); txt(s, w.x + 24, w.y + 26 + i * 24, { size: 8, maxW: 88, fit: true }); icon('check', w.x + 104, w.y + 24 + i * 24, 1); });
          });
          show(g.at(1), () => { box(w.x + 128, w.y, 196, 34, { fill: P.blue, shadow: false }); txt('¿Qué no resuelve RAG?', w.x + 136, w.y + 11, { size: 9, color: P.ink, font: 'sans' }); });
          show(g.at(2), () => {
            box(w.x + 128, w.y + 42, 196, 120, { fill: P.white, shadow: false });
            [['No garantiza recuperar el fragmento correcto', 1], ['No corrige documentos obsoletos', 1], ['No sustituye los permisos', 2]].forEach((l, i) => { txt('• ' + l[0], w.x + 136, w.y + 50 + i * 34, { size: 8, color: P.ink, maxW: 160, font: 'sans' }); chip(String(l[1]), w.x + 306, w.y + 48 + i * 34, { fill: P.yellow, size: 7, w: 14, h: 13, pad: 2 }); });
          });
          show(g.at(3), () => {
            glow(w.x + 306, w.y + 48, 14, 13, P.yellow);
            box(w.x + 332, w.y, 116, 222, { fill: P.paper, shadow: false });
            txt('[1] apuntes.md', w.x + 338, w.y + 6, { size: 8, color: P.navy });
            txt('§5 «Qué no resuelve RAG»', w.x + 338, w.y + 20, { size: 7, color: P.navy, maxW: 106, fit: true });
            rect(w.x + 336, w.y + 36, 108, 56, 'rgba(247,207,90,.6)');
            txt('«No garantiza que se recupere el fragmento correcto. No corrige documentos obsoletos…»', w.x + 340, w.y + 40, { size: 7.5, color: P.ink, maxW: 100, font: 'sans' });
            bars(w.x + 340, w.y + 104, 96, 6, { seed: 3 });
          });
        }
      },
      {
        title: 'Cuando la respuesta no está en las fuentes',
        caption: 'Preguntamos algo que ninguna fuente contiene y comparamos dos comportamientos.',
        steps: [
          'Preguntamos: «¿Cuál es el horario de tutorías de la asignatura?». Ninguna fuente lo dice.',
          'Buen comportamiento: «Las fuentes no contienen esa información». Reconoce el límite.',
          'Mal comportamiento: «Los martes de 16 a 18 h». Completa el hueco con algo plausible.',
          'Siguiente paso: añadir una fuente autorizada que lo contenga, reformular… y nunca dar por buena una respuesta sin cita.'
        ],
        draw(g) {
          show(g.at(0), () => { box(60, 12, 360, 32, { fill: P.blue }); txt('«¿Cuál es el horario de tutorías de la asignatura?»', 240, 21, { size: 9.5, color: P.ink, align: 'center', font: 'sans' }); });
          show(g.at(1), () => {
            card(14, 60, 218, 120, 'RECONOCE EL LÍMITE', P.mint, { active: g.on(1) });
            robot(26, 98, { s: 2, mood: 'happy', color: P.purple });
            bubble(66, 88, 156, 54, { text: '«Las fuentes no contienen esa información.»', tx: 62, ty: 116, size: 8.5, font: 'sans' });
            icon('check', 110, 150, 2);
          });
          show(g.at(2), () => {
            card(248, 60, 218, 120, 'RELLENA EL HUECO', P.red, { active: g.on(2) });
            robot(260, 98, { s: 2, mood: 'sure', color: P.purple });
            bubble(300, 88, 156, 54, { text: '«Los martes de 16 a 18 h.»', tx: 296, ty: 116, size: 9, font: 'sans' });
            stamp('SIN CITA', 378, 160, { a: late(g.at(2)), size: 10 });
          });
          show(g.at(3), () => { chip('añadir fuente autorizada', 24, 196, { fill: P.mint, size: 8.5, icon: 'folder' }); chip('reformular la pregunta', 190, 196, { fill: P.paper, size: 8.5, icon: 'pencil' }); chip('sin cita, no vale', 346, 196, { fill: P.yellow, size: 8.5, icon: 'link' }); banner('Distingue respuesta basada en fuentes de conocimiento general', { y: 230, size: 8.5 }); });
        }
      },
      {
        title: 'Marcar y desmarcar fuentes',
        caption: 'La misma pregunta con la política vigente sola y con una versión derogada marcada.',
        steps: [
          'Solo con la política vigente marcada: «El reembolso se abona en un máximo de 14 días naturales [1]».',
          'Marcamos también la política antigua y la FAQ de la web. Repetimos la pregunta.',
          'Ahora responde «entre 14 y 30 días» o, peor, solo «30 días», citando la versión derogada.',
          'Una fuente caducada en el cuaderno contamina las respuestas. Retírala o déjala desmarcada.'
        ],
        draw(g) {
          const srcs = [['Política v3 · vigente', P.mint, true], ['Manual de atención', P.mint, true], ['Política v2 · derogada', P.orange, false], ['FAQ web · nov 2025', P.orange, false]];
          box(14, 14, 170, 150, { fill: P.gray2 }); txt('FUENTES', 22, 20, { size: 8, color: P.teal });
          srcs.forEach((s, i) => { const on = s[2] || g.from(1); rect(22, 40 + i * 28, 10, 10, on ? s[1] : P.gray3); txt(s[0], 38, 40 + i * 28, { size: 8, color: on ? P.white : P.gray3, maxW: 140, fit: true }); });
          show(g.at(1), () => { glow(18, 92, 162, 54, P.orange); }, 0);
          show(g.at(0), () => { if (!g.from(2)) { msg(200, 20, 266, '¿En cuántos días devolvemos el dinero?', { who: 'user' }); msg(200, 60, 266, 'En un máximo de 14 días naturales desde que se acepta la cancelación [1].', {}); chip('[1] Política v3 › §3', 200, 104, { fill: P.mint, size: 8 }); } });
          show(g.at(2), () => { msg(200, 20, 266, '¿En cuántos días devolvemos el dinero?', { who: 'user' }); msg(200, 60, 266, 'El reembolso se realiza en un plazo de 30 días [3][4].', {}); chip('[3] Política v2 (derogada)', 200, 104, { fill: P.orange, size: 8 }); chip('[4] FAQ web', 360, 104, { fill: P.orange, size: 8 }); stamp('CONTAMINADA', 330, 150, { a: late(g.at(2)), size: 10 }); });
          show(g.at(3), () => banner('Fuentes caducadas fuera, o desmarcadas', { y: 220 }));
        }
      },
      {
        title: 'Preguntas que obligan a usar evidencia',
        caption: '«Hazme un resumen» frente a tres preguntas de calidad para un cuaderno.',
        steps: [
          'Pregunta pobre: «Hazme un resumen». No pide evidencia ni estructura.',
          'Mejor: «Compara cómo los documentos definen RAG. Cita la fuente de cada diferencia y separa definiciones de inferencias».',
          'Mejor: «Extrae los plazos en una tabla con plazo, porcentaje, condición y cita. Si falta algo, escribe "no especificado"».',
          'Mejor: «Si las fuentes se contradicen, muéstrame ambas versiones y dime cuál es la más reciente».'
        ],
        draw(g) {
          show(g.at(0), () => { chip('«Hazme un resumen»', 20, 16, { fill: P.red, size: 10, icon: 'cross', iconTint: P.ink }); txt('sin evidencia · sin estructura', 200, 22, { size: 8.5, color: P.red }); });
          const good = [['COMPARAR', 'Compara las definiciones de RAG; cita la fuente de cada diferencia; separa definición e inferencia.', P.sky], ['EXTRAER', 'Plazos en tabla: plazo, porcentaje, condición y cita; si falta: «no especificado».', P.orange], ['CONTRASTAR', 'Si las fuentes se contradicen, muestra ambas y di cuál es más reciente.', P.purple]];
          good.forEach((gd, i) => show(g.at(i + 1), () => {
            const y = 50 + i * 64;
            card(14, y, 452, 56, gd[0], gd[2], { active: g.on(i + 1) });
            txt(gd[1], 24, y + 24, { size: 9, maxW: 400, font: 'sans' });
            icon('link', 444, y + 26, 1);
          }));
        }
      },
      {
        title: 'Flujo de estudio recomendado',
        caption: 'Un ciclo para usar el cuaderno durante todo el máster.',
        steps: [
          '1 · Guarda los materiales de cada clase en tu vault de Markdown. 2 · Añade al cuaderno solo las fuentes relevantes.',
          '3 · Haz preguntas de comprensión y pide citas. 4 · Convierte las respuestas revisadas en tarjetas, esquemas o notas propias.',
          '5 · Detecta lagunas: preguntas sin evidencia, contradicciones o términos no entendidos.',
          '6 · Vuelve a las fuentes primarias antes de estudiar o reutilizar una afirmación importante.'
        ],
        draw(g) {
          const st = [['VAULT', 'folder', 0], ['FUENTES', 'doc', 0], ['PREGUNTAS', 'question', 1], ['TARJETAS', 'list', 1], ['LAGUNAS', 'search', 2], ['PRIMARIAS', 'book', 3]];
          const cx = 240, cy = 130, rx = 176, ry = 90;
          const pos = st.map((_, i) => { const a = -Math.PI / 2 + i * (Math.PI * 2 / 6); return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
          pos.forEach((p, i) => { const q = pos[(i + 1) % 6]; arrow(lerp(p[0], q[0], 0.3), lerp(p[1], q[1], 0.3), lerp(p[0], q[0], 0.7), lerp(p[1], q[1], 0.7), { p: g.at(st[(i + 1) % 6][2]), color: P.mint }); });
          st.forEach((s, i) => show(g.at(s[2]), () => { card(pos[i][0] - 46, pos[i][1] - 24, 92, 48, (i + 1) + ' · ' + s[0], g.on(s[2]) ? P.orange : P.teal, { size: 7.5 }); icon(s[1], pos[i][0] - 12, pos[i][1] - 4, 2); }, 0));
          txt('ESTUDIAR\nCON FUENTES', cx, cy - 10, { size: 10, align: 'center', color: P.teal });
        }
      }
    ],
    examples: [
      ['Pregunta explícita', '«¿Qué tres efectos tienen los tokens según los apuntes?» → respuesta con cita al Bloque 1.'],
      ['Pregunta sin evidencia', '«¿Qué nota mínima hay que sacar?» → debería reconocer que no consta.'],
      ['Contraste de versiones', 'Marcar y desmarcar la versión antigua de un documento y comparar las respuestas.'],
      ['Guía de estudio', 'Pedir preguntas de repaso con la sección que las responde y validar una muestra.']
    ],
    mistakes: [
      'Cargar decenas de archivos desordenados «por si acaso».',
      'Dejar versiones caducadas marcadas como fuentes.',
      'Aceptar respuestas sin abrir ninguna cita.',
      'Subir documentos con datos personales o confidenciales.',
      'Dar por buenos los resúmenes de audio, mapas o guías sin validarlos.'
    ],
    questions: [
      ['¿Qué harías si la fuente no contiene la respuesta?', 'Aceptar que no consta, buscar y añadir una fuente autorizada que la contenga o reformular la pregunta. No completar el hueco con conocimiento general sin avisar.'],
      ['¿Qué parte de Gemini Notebook corresponde a cada pieza de RAG?', 'Panel de fuentes: colección e índice (troceado automático). Casillas: filtro. Chat: prompt aumentado. Números de cita: evidencia recuperada. Studio: contenido generado que hay que validar.'],
      ['¿Qué fuentes añadirías a tu cuaderno para este máster y cuáles no?', 'Sí: apuntes, guías oficiales, artículos autorizados, tus notas. No: documentos con datos personales, material sin permiso de uso, versiones caducadas o archivos irrelevantes que añaden ruido.'],
      ['Escribe una pregunta de calidad para tu cuaderno sobre el Bloque 2.', 'Ejemplo: «Extrae las piezas de una buena instrucción en una tabla con pieza, pregunta que responde y ejemplo, citando la sección de cada una».']
    ],
    quiz: [
      { q: 'El objetivo del taller de Gemini Notebook es…', o: ['Practicar el flujo de trabajo con fuentes', 'Memorizar la posición exacta de cada botón', 'Generar el resumen más largo posible', 'Subir tantos archivos como sea posible'], c: 0, why: 'Las interfaces cambian; el flujo permanece.' },
      { q: 'Desmarcar una fuente en el cuaderno…', o: ['La borra para siempre', 'La saca de la búsqueda: deja de usarse para responder', 'No tiene ningún efecto', 'La traduce'], c: 1, why: 'Funciona como un filtro sobre la colección.' },
      { q: 'Si las fuentes no contienen la respuesta, la herramienta debería…', o: ['Inventar algo plausible', 'Responder con conocimiento general sin avisar', 'Reconocer el límite', 'Cerrar el cuaderno'], c: 2, why: 'Es el comportamiento que se observa en el taller.' },
      { q: '¿Cuál es una pregunta que obliga a usar evidencia?', o: ['«Hazme un resumen»', '«Cuéntame algo»', '«¿Qué opinas?»', '«Extrae los plazos en una tabla con su cita»'], c: 3, why: 'Exige estructura y procedencia.' }
    ],
    terms: [['Gemini Notebook', 'Herramienta de Google (antes NotebookLM) para trabajar con un conjunto de fuentes y obtener respuestas citadas.'], ['Cuaderno', 'Espacio de trabajo que agrupa fuentes, preguntas y notas sobre un tema.'], ['Studio', 'Panel que genera guías, mapas, resúmenes de audio y otros formatos a partir de las fuentes.']]
  });
})();
