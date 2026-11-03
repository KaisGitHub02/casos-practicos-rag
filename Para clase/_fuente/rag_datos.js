/* ══════════════════════════════════════════
   RAG y Gemini Notebook · datos de las diapositivas
   - CP_STEPS / CP_WHO: raíl superior (lo usa casos.js).
   - CP_DATA.method: pestañas de «Cómo vamos a trabajar».
   - RAG_DATA: conceptos, caso y entrega (lo usa rag.js).
   Las viñetas pixel art y las explicaciones completas salen de
   sibou/b4.js y sibou/caso-b4.js (copias de Sibou Lab).
   Empresa, personas y documentos del caso son ficticios.
   ══════════════════════════════════════════ */

window.CP_STEPS = [
  { id: 'e-problema',   who: 'c1', label: 'Problema',   slide: 'e-problema' },
  { id: 'e-embeddings', who: 'c1', label: 'Embeddings', slide: 'e-embeddings' },
  { id: 'e-chunking',   who: 'c1', label: 'Chunking',   slide: 'e-chunking' },
  { id: 'e-indice',     who: 'c1', label: 'Índice',     slide: 'e-indice' },
  { id: 'e-prompt',     who: 'c1', label: 'Prompt',     slide: 'e-prompt' },
  { id: 'e-rag',        who: 'c1', label: 'RAG',        slide: 'e-rag' },
  { id: 'e-evaluar',    who: 'c1', label: 'Evaluar',    slide: 'e-evaluar' },
  { id: 'e-citas',      who: 'c1', label: 'Citas',      slide: 'e-citas' },
  { id: 'e-notebook',   who: 'c1', label: 'Notebook',   slide: 'e-notebook' },
  { id: 'c-contexto',   who: 'c2', label: 'Contexto',   slide: 'c-contexto' },
  { id: 'c-hoy',        who: 'c2', label: 'Hoy',        slide: 'c-hoy' },
  { id: 'c-docs',       who: 'c2', label: 'Documentos', slide: 'c-docs' },
  { id: 'c-preguntas',  who: 'c2', label: 'Preguntas',  slide: 'c-preguntas' },
  { id: 'c-reto',       who: 'c2', label: 'Encargo',    slide: 'c-reto' },
  { id: 'm-fases',      who: 'm',  label: 'Fases',      slide: 'm-fases' },
  { id: 'm-verificar',  who: 'm',  label: 'Verificar',  slide: 'm-verificar' },
  { id: 'entrega',      who: 'm',  label: 'Entregar',   slide: 'entrega' }
];

window.CP_WHO = {
  c1: { name: 'Explicación' },
  c2: { name: 'Caso · Viajes Lunaria' },
  m:  { name: 'Método' }
};

/* Líneas de la portada y el cierre */
window.CP_LANES = [
  { who: 'c1', stops: ['¿Por qué inventa?', 'Embeddings y troceado', 'Índice y prompt', 'Citas que prueban'] },
  { who: 'c2', stops: ['Seis documentos', 'Un cuaderno', 'Ocho preguntas', 'Cada cita, verificada'] }
];

window.CP_DATA = {
  method: [
    {
      n: 1, t: 'Entender', d: 'Por qué una IA inventa',
      doing: 'Ved qué sabe de verdad un modelo de lenguaje y por qué, ante un dato que no tiene, responde algo plausible en lugar de decir «no lo sé».',
      out: 'Saber reconocer una respuesta sin respaldo.',
      trap: 'Fiarse de una respuesta porque suena segura.'
    },
    {
      n: 2, t: 'Abrir la caja', d: 'Las piezas de RAG',
      doing: 'Recorred una a una las piezas: embeddings, troceado, índice, prompt aumentado y evaluación. Cada viñeta enseña un paso y dónde puede fallar.',
      out: 'Poder señalar en qué pieza está un error.',
      trap: 'Quedarse en «RAG busca en tus documentos» sin saber cómo.'
    },
    {
      n: 3, t: 'Practicar', d: 'Un caso real en Gemini Notebook',
      doing: 'Montad un cuaderno para el equipo de atención de Viajes Lunaria con sus documentos, que esconden versiones caducadas, excepciones y datos que no deben subirse.',
      out: 'Un cuaderno con fuentes vigentes y ocho respuestas citadas.',
      trap: 'Subir todo «para que tenga más información».'
    },
    {
      n: 4, t: 'Verificar', d: 'Cada cita, abierta y comprobada',
      doing: 'Abrid cada cita y comprobad que demuestra la afirmación exacta. Si algo falla, decid si fue la búsqueda o la respuesta, y cómo lo arreglaríais.',
      out: 'Tabla de verificación, diagnóstico y diseño para producción.',
      trap: 'Contar citas en lugar de leerlas.'
    }
  ]
};

window.RAG_DATA = {

  /* ───────────── Explicación: un concepto por diapositiva ─────────────
     concept: id del concepto en sibou/b4.js (viñetas y explicación completa) */
  conceptos: [
    {
      slide: 'e-problema', concept: 'problema-fuentes', n: 1,
      title: 'Una IA general no conoce tus fuentes',
      chips: ['Fecha de corte', 'Alucinación', 'Tres huecos'],
      claim: 'Un modelo responde de memoria. Ante lo privado, lo reciente o lo muy específico no tiene un «no lo sé»: escribe lo más probable.',
      how: [
        'Lo que aprendió es una <b>compresión estadística</b> de textos, no una base de datos que se pueda consultar.',
        'Genera palabra a palabra la continuación <b>más probable</b>; «no lo sé» casi nunca lo es.',
        'Para darle conocimiento hay tres vías: <b>ajustarlo</b>, <b>pegar documentos</b> o <b>RAG</b>.'
      ],
      deps: [
        ['warn', 'Señales', 'Cifras exactas sin origen, nombres internos, fechas recientes.'],
        ['lock', 'Lo privado', 'Nunca estuvo en sus datos: ni la web ni la memoria del chat lo arreglan.'],
        ['target', 'La salida', 'RAG: buscar primero, responder después y citar.']
      ]
    },
    {
      slide: 'e-embeddings', concept: 'embeddings', n: 2,
      title: 'Embeddings: el significado como posición',
      chips: ['Vector', 'Similitud coseno', 'Búsqueda semántica'],
      claim: 'Un texto se convierte en una lista de números. Lo que significa algo parecido queda cerca, aunque no comparta palabras.',
      how: [
        'Un modelo de embeddings devuelve un <b>vector de longitud fija</b>: unas coordenadas en un mapa de significado.',
        'Se compara con la <b>similitud coseno</b>: 1 misma dirección, 0 sin relación, −1 opuesta.',
        'Encuentra <b>sinónimos y paráfrasis</b>, también entre idiomas.'
      ],
      deps: [
        ['warn', 'Se le escapa', 'Negaciones, cifras, fechas y códigos quedan cerca de su contrario.'],
        ['tool', 'Regla', 'El mismo modelo para documentos y preguntas.'],
        ['eye', 'Cerca ≠ verdad', 'Lo recuperado hay que leerlo.']
      ]
    },
    {
      slide: 'e-chunking', concept: 'chunking', n: 3,
      title: 'Chunking: trocear antes de recuperar',
      chips: ['Fragmento', 'Solapamiento', 'Metadatos'],
      claim: 'Dónde se corta un documento decide qué se puede encontrar. Un corte en mal sitio separa la regla de su excepción.',
      how: [
        'Se trocea por <b>precisión</b>, por <b>espacio</b> en el prompt y para poder <b>citar</b> la página exacta.',
        'Cuatro estrategias: <b>tamaño fijo</b>, <b>estructura</b>, <b>recursiva</b> y <b>semántica</b>.',
        'Cada fragmento debe <b>entenderse solo</b>: se le antepone la ruta de títulos.'
      ],
      deps: [
        ['warn', 'Riesgo', 'Cortar justo antes de un «excepto» o partir una tabla.'],
        ['file', 'Metadatos', 'Documento, versión, vigencia, página y permisos.'],
        ['check', 'Se comprueba', 'Con preguntas de prueba, mirando qué se recupera.']
      ]
    },
    {
      slide: 'e-indice', concept: 'vectorial', n: 4,
      title: 'Índices y bases de datos vectoriales',
      chips: ['Top-k', 'HNSW', 'Búsqueda híbrida'],
      claim: 'El índice encuentra en milisegundos los fragmentos más parecidos a la pregunta y filtra los caducados y los no autorizados.',
      how: [
        'Cada fila guarda <b>texto, vector y metadatos</b>.',
        'La búsqueda <b>aproximada</b> salta por un grafo de vecinos: casi tan exacta, muchísimo más rápida.',
        'La <b>búsqueda híbrida</b> añade palabras clave, y un <b>reordenador</b> elige los mejores candidatos.'
      ],
      deps: [
        ['lock', 'Permisos', 'Se filtran antes de buscar: nadie ve lo que no podría abrir.'],
        ['clock', 'Vigencia', 'Las versiones derogadas no deben recuperarse.'],
        ['target', 'Umbral', 'Si nada se parece lo bastante, mejor «no consta».']
      ]
    },
    {
      slide: 'e-prompt', concept: 'contexto-aumentado', n: 5,
      title: 'El prompt aumentado: lo que de verdad lee el modelo',
      chips: ['Instrucciones', 'Fragmentos', 'Anclaje'],
      claim: 'El modelo no ve el índice: ve un texto con instrucciones, fragmentos numerados y la pregunta. Lo que no esté ahí no existe.',
      how: [
        'Tres partes: <b>instrucciones</b>, <b>fragmentos recuperados</b> con su procedencia y la <b>pregunta</b>.',
        'El <b>anclaje</b> («responde solo con las fuentes; si no consta, dilo») evita el relleno.',
        'Las preguntas de seguimiento se <b>reescriben</b> antes de buscar.'
      ],
      deps: [
        ['warn', 'Pocos fragmentos', 'Falta la excepción.'],
        ['warn', 'Demasiados', 'Ruido, coste y lo importante perdido en el medio.'],
        ['bulb', 'Instrucción ≠ garantía', 'Se comprueba con preguntas de prueba.']
      ]
    },
    {
      slide: 'e-rag', concept: 'rag', n: 6,
      title: 'RAG: recuperar antes de generar',
      chips: ['Indexación', 'Consulta', 'Citas'],
      claim: 'Preparar las fuentes una vez y, en cada pregunta, recuperar lo relevante, ponerlo delante del modelo y responder citando.',
      how: [
        '<b>Indexación</b>: fuentes autorizadas → trocear → embeddings → índice con metadatos.',
        '<b>Consulta</b>: pregunta → buscar y filtrar → reordenar → prompt aumentado → respuesta con citas.',
        'Frente al ajuste fino: se actualiza <b>cambiando documentos</b> y permite <b>citar</b>.'
      ],
      deps: [
        ['warn', 'Hereda', 'Fuentes obsoletas o mal escaneadas siguen siéndolo.'],
        ['lock', 'No sustituye', 'Ni los permisos ni la política de datos.'],
        ['eye', 'Reduce, no elimina', 'Las invenciones siguen siendo posibles.']
      ]
    },
    {
      slide: 'e-evaluar', concept: 'evaluar-rag', n: 7,
      title: 'Evaluar un RAG: ¿falló la búsqueda o la respuesta?',
      chips: ['Recall@k', 'Fidelidad', 'Banco de pruebas'],
      claim: 'Ante una respuesta mala, primero: ¿estaba el fragmento correcto entre los recuperados? Eso separa dos problemas muy distintos.',
      how: [
        'Si <b>no estaba</b>: fallo de recuperación (fuente, corte, filtro o pregunta).',
        'Si <b>estaba</b> y la respuesta no lo usa bien: fallo de generación.',
        'Se mide con la <b>tríada</b>: relevancia del contexto, fidelidad y relevancia de la respuesta.'
      ],
      deps: [
        ['check', 'Banco de pruebas', 'Incluye a propósito excepciones, versiones, «no consta» y permisos.'],
        ['tool', 'Un cambio cada vez', 'Y se vuelve a medir.'],
        ['user', 'Juez automático', 'Útil, pero se valida con una muestra humana.']
      ]
    },
    {
      slide: 'e-citas', concept: 'citas', n: 8,
      title: 'Citas: evidencia o decoración',
      chips: ['S·R·C', 'A·F·V', 'Veredicto'],
      claim: 'Una cita prueba algo solo si dice lo mismo que la respuesta: mismo sujeto, misma regla y mismas condiciones, en una fuente vigente.',
      how: [
        '<b>S·R·C</b>: sujeto, regla o dato, condiciones.',
        '<b>A·F·V</b>: autoridad, fecha y versión de la fuente.',
        'Veredicto: <b>respalda</b>, <b>en parte</b>, <b>no respalda</b> o <b>contradice</b>.'
      ],
      deps: [
        ['warn', 'Seis fallos', 'Decorativa, recortada, desactualizada, mal atribuida, fusionada e inferida.'],
        ['eye', 'Contexto', 'Lee las líneas de antes y después.'],
        ['bulb', 'Dato', 'En un estudio, solo ~3 de cada 4 citas respaldaban su frase.']
      ]
    },
    {
      slide: 'e-notebook', concept: 'notebooklm', n: 9,
      title: 'Gemini Notebook (antes NotebookLM)',
      chips: ['Fuentes', 'Citas', 'Studio'],
      claim: 'Un RAG listo para usar: tú eliges las fuentes y cada respuesta llega con citas que abren el fragmento usado.',
      how: [
        'Panel de fuentes = <b>colección e índice</b>; las casillas, un <b>filtro</b>.',
        'El chat = <b>prompt aumentado</b>; los números = la <b>evidencia</b>.',
        'Studio genera guías, mapas o audio: <b>también hay que validarlo</b>.'
      ],
      deps: [
        ['lock', 'Privacidad', 'Nada de datos personales ni confidenciales.'],
        ['clock', 'Versiones', 'Una fuente caducada marcada contamina las respuestas.'],
        ['question', 'Pregunta bien', 'Pide tablas, citas y «no especificado» si falta.']
      ]
    }
  ],

  /* ───────────── Caso: notas de la reunión con Marta ───────────── */
  notas: [
    '«Cada agente tiene la política descargada en su escritorio. No sé si todos tienen la misma versión.»',
    '«Lo que quiero es que la herramienta diga "no lo sé" antes que inventarse algo.»',
    '«En el comité del 28 de octubre se bajaron los gastos de gestión. Todavía no está en la política.»',
    '«La FAQ de la web la lleva Marketing. Creo que no se ha tocado desde el año pasado.»',
    '«Con la tarifa Última hora siempre hay lío cuando alguien se pone enfermo.»',
    '«En verano hay alguna condición distinta, pero no me acuerdo de cuál.»',
    '«Si alguien amenaza con ir a la OMIC, me lo tienen que pasar a mí.»',
    '«Os paso también una exportación del CRM con las reclamaciones de octubre, por si os sirve.»',
    '«Trabajamos con la cuenta de Google de la empresa.»',
    '«A veces nos piden cancelar un vuelo suelto y no sabemos qué porcentaje aplicar.»'
  ],

  /* ───────────── Método: cómo verificar una cita ─────────────
     Ejemplos neutros (otra empresa) para no dar la solución del caso. */
  verificar: {
    respalda: {
      label: 'Respalda', short: 'Dice lo mismo, con sus condiciones', tone: 'ok',
      claim: 'El teletrabajo se permite dos días por semana.',
      cite: '«Se permite el teletrabajo dos días por semana.» · Política de teletrabajo v2 (2026), §2',
      src: [['Sujeto', 'teletrabajo', 'ok'], ['Regla', 'dos días por semana', 'ok'], ['Condiciones', 'sin condiciones adicionales', 'ok']],
      afv: [['Autoridad', 'política oficial', 'ok'], ['Fecha', '2026', 'ok'], ['Versión', 'v2, vigente', 'ok']],
      why: 'Mismo sujeto, misma regla y ninguna condición omitida, en la versión vigente.'
    },
    parte: {
      label: 'Respalda en parte', short: 'Falta una condición o cambia un detalle', tone: 'warn',
      claim: 'Puedes teletrabajar dos días cualquier semana.',
      cite: '«Se permite el teletrabajo dos días por semana, excepto durante el cierre trimestral.» · Política v2, §2',
      src: [['Sujeto', 'teletrabajo', 'ok'], ['Regla', 'dos días por semana', 'ok'], ['Condiciones', 'omite «excepto durante el cierre»', 'ko']],
      afv: [['Autoridad', 'política oficial', 'ok'], ['Fecha', '2026', 'ok'], ['Versión', 'v2, vigente', 'ok']],
      why: 'La cita es buena, pero la respuesta borra la excepción. Resultado: una respuesta incorrecta con una cita correcta.'
    },
    no: {
      label: 'No respalda', short: 'Habla del tema, no de la afirmación', tone: 'ko',
      claim: 'El teletrabajo es obligatorio los viernes.',
      cite: '«El teletrabajo mejora la conciliación y reduce desplazamientos.» · Blog interno (2024)',
      src: [['Sujeto', 'teletrabajo', 'ok'], ['Regla', 'no dice nada de obligación', 'ko'], ['Condiciones', 'no habla de viernes', 'ko']],
      afv: [['Autoridad', 'blog, no oficial', 'ko'], ['Fecha', '2024', 'warn'], ['Versión', 'sin versión', 'warn']],
      why: 'Comparte vocabulario, pero no demuestra nada de lo que se afirma. Es una cita decorativa.'
    },
    contradice: {
      label: 'Contradice', short: 'La fuente, leída entera, dice lo contrario', tone: 'ko',
      claim: 'Con justificante médico se devuelve todo, con cualquier tarifa.',
      cite: '«…se reembolsa el 100 % con justificante. Las tarifas promocionales no son reembolsables en ningún caso.» · Condiciones v4, §5',
      src: [['Sujeto', 'reembolso por enfermedad', 'ok'], ['Regla', '100 %', 'ok'], ['Condiciones', 'la línea siguiente lo excluye', 'ko']],
      afv: [['Autoridad', 'condiciones oficiales', 'ok'], ['Fecha', '2026', 'ok'], ['Versión', 'v4, vigente', 'ok']],
      why: 'La primera frase parece respaldarla, pero la siguiente la anula para algunas tarifas. Leer el contexto lo cambia todo.'
    },
    caducada: {
      label: 'Desactualizada', short: 'Respalda, pero la fuente ya no vale', tone: 'warn',
      claim: 'El plazo de devolución es de 30 días.',
      cite: '«Las devoluciones se realizan en 30 días.» · Condiciones v2 (2023)',
      src: [['Sujeto', 'devoluciones', 'ok'], ['Regla', '30 días', 'ok'], ['Condiciones', 'sin condiciones', 'ok']],
      afv: [['Autoridad', 'condiciones oficiales', 'ok'], ['Fecha', '2023', 'ko'], ['Versión', 'v2, sustituida por la v4', 'ko']],
      why: 'S·R·C encaja, pero A·F·V no: hay una versión posterior. Por eso hay que comprobar siempre la fuente, no solo el texto.'
    }
  },

  /* ───────────── Entrega ───────────── */
  pesos: [
    ['Selección de fuentes y privacidad', 15, 'Qué subís, qué no y por qué: autoridad, fecha, versión y datos personales.'],
    ['Respuestas correctas', 30, 'Las ocho preguntas, con cálculo explícito cuando hay importes.'],
    ['Verificación de citas', 20, 'Cada cita abierta, con S·R·C, A·F·V y un veredicto razonado.'],
    ['Diagnóstico', 15, 'Recuperación o generación, con la evidencia de qué se citó.'],
    ['Diseño para producción', 20, 'Instrucciones, metadatos, troceado, banco de pruebas y plan para el 1 de diciembre.']
  ],
  checklist: [
    'Hemos leído los seis documentos antes de subir nada',
    'El cuaderno solo tiene fuentes vigentes y sin datos personales',
    'Hemos abierto todas las citas de las ocho preguntas',
    'Cada veredicto dice qué falla: sujeto, regla, condición, autoridad, fecha o versión',
    'Cada fallo está diagnosticado como recuperación o generación, con evidencia',
    'Las instrucciones dicen qué hacer cuando algo no consta',
    'El banco de pruebas incluye trampas, no solo preguntas fáciles'
  ]
};
