/* =========================================================================
   Caso práctico del Bloque 4 · «Un cuaderno fiable para Viajes Lunaria»
   Enunciado en #/caso/b4. La solución maestra (#/caso/b4/solucion) NO está
   aquí: vive en api/casos/b4-solucion.js y la entrega la API solo al
   profesorado (o al alumnado si el caso está en «casos_abiertos» de
   api/config.php).
   Empresa, personas y documentos son ficticios.
   Campos de texto en Markdown mínimo (negrita, cursiva, listas, código).
   ========================================================================= */
(function () {
  'use strict';
  const D = PL.D, K = PL.K;
  const { P, rect, frame, box, card, txt, chip, arrow, path, icon, robot, person, bubble, win, msg, paper, bars, stamp, show, pulse, glow, qmark, clamp, line } = D;
  const { banner, badge } = K;
  const late = a => clamp(a * 2 - 1);

  /* ---------------- documentos del caso ---------------- */
  const DOCS = [
    {
      id: 'politica-v3', file: '01-politica-cancelaciones-v3-2026.md', title: 'Política de cancelaciones y reembolsos v3.0',
      tag: 'Política · 2026',
      text: `# Viajes Lunaria · Política de cancelaciones y reembolsos

Versión 3.0 · Aprobada por Dirección el 12/02/2026 · Vigente desde el 1 de marzo de 2026
Sustituye a la versión 2.1 (2024).

## §1. Objeto y ámbito
Esta política se aplica a los paquetes vacacionales y escapadas que vende Viajes Lunaria (transporte + alojamiento, o alojamiento + actividades).
No se aplica a los billetes de avión, tren o autobús vendidos por separado: se rigen por las condiciones de cada transportista, que el agente debe consultar en la reserva.

## §2. Plazos y porcentajes de reembolso
Cuando el cliente cancela, se le devuelve un porcentaje del importe total según los días que falten para la salida:

| Días antes de la salida | Reembolso |
|---|---|
| Más de 30 días | 100 % menos 25 € de gastos de gestión |
| Entre 15 y 30 días | 70 % |
| Entre 7 y 14 días | 40 % |
| Menos de 7 días | Sin reembolso (salvo §4) |

Los gastos de gestión se aplican una sola vez por reserva.

## §3. Plazo de devolución
El reembolso se abona en un máximo de 14 días naturales desde que Viajes Lunaria acepta la cancelación, por el mismo medio de pago utilizado en la compra.

## §4. Excepciones por fuerza mayor
Si el viajero no puede viajar por hospitalización o fallecimiento suyo o de un familiar de primer grado, se reembolsa el 100 % sin gastos de gestión, en cualquier plazo, siempre que se aporte justificante en los 10 días naturales siguientes a la cancelación.

Las reservas con tarifa «Última hora» no son reembolsables en ningún caso, tampoco por fuerza mayor. El cliente puede cambiar la fecha una sola vez, pagando 30 €, si el nuevo viaje se realiza en los 6 meses siguientes.

## §5. Seguro opcional «Lunaria Tranquilo»
Precio: 39 € por persona. Amplía el reembolso al 100 % hasta 48 horas antes de la salida por cualquier causa justificada documentalmente (enfermedad, motivos laborales, citación judicial). Debe contratarse en el momento de la reserva. No se aplica a la tarifa «Última hora».

## §6. Cambios de titular
El cliente puede ceder su plaza a otra persona sin coste hasta 7 días antes de la salida, comunicándolo por escrito.

## §7. Temporada alta
Para salidas entre el 15 de julio y el 31 de agosto, ambos incluidos, el tramo «Entre 15 y 30 días» de la tabla del §2 pasa a ser del 50 %. El resto de tramos no cambia.

## §8. Responsable
Responsable de la política: Dirección de Operaciones. Revisión anual.
`
    },
    {
      id: 'politica-v2', file: '02-politica-cancelaciones-2024.md', title: 'Política de cancelaciones (archivo de 2024)',
      tag: 'Política · 2024',
      text: `# Viajes Lunaria · Política de cancelaciones

Versión 2.1 · Vigente desde el 1 de enero de 2024

## 1. Ámbito
Paquetes vacacionales y escapadas vendidos por Viajes Lunaria.

## 2. Reembolsos según antelación
- Más de 30 días antes de la salida: reembolso del 100 %, sin gastos.
- Entre 15 y 30 días: 75 %.
- Entre 7 y 14 días: 50 %.
- Menos de 7 días: sin reembolso.

## 3. Plazo de devolución
Las devoluciones se realizan en un plazo de 30 días desde la cancelación.

## 4. Fuerza mayor
En caso de enfermedad grave u hospitalización del viajero, se devuelve el 100 % del importe con cualquier tarifa, presentando justificante médico.

## 5. Seguro de cancelación
Seguro opcional «Lunaria Tranquilo»: 35 € por persona.
`
    },
    {
      id: 'faq-web', file: '03-faq-web-noviembre-2025.md', title: 'Preguntas frecuentes de la web',
      tag: 'Web · nov. 2025',
      text: `# Preguntas frecuentes · viajeslunaria.example

Última revisión: noviembre de 2025

**¿Puedo cancelar mi viaje sin gastos?**
Sí: si cancelas con más de 30 días de antelación, te devolvemos el 100 % del importe.

**¿Cuánto tardáis en devolver el dinero?**
Normalmente, en un plazo de 30 días.

**¿Qué es la tarifa «Última hora»?**
Precios especiales para salidas en los próximos 15 días. Consulta las condiciones al reservar.

**¿Tenéis seguro de cancelación?**
Sí, el seguro «Lunaria Tranquilo» cuesta 35 € por persona.

**¿Cuál es vuestro horario?**
Atendemos de lunes a viernes, de 9:00 a 19:00.
`
    },
    {
      id: 'manual', file: '04-manual-atencion-cliente-v1-4.md', title: 'Manual interno de atención al cliente v1.4',
      tag: 'Manual · ene. 2026',
      text: `# Viajes Lunaria · Manual de atención al cliente

Versión 1.4 · Enero de 2026 · Uso interno del equipo de atención

## 1. Tono
Trato de usted salvo que el cliente prefiera el tuteo. Frases cortas. Nunca culpar al cliente.

## 2. Canales y horario
Teléfono y chat: de lunes a viernes, de 9:00 a 14:00 y de 16:00 a 19:00; sábados, de 10:00 a 13:00.
En julio y agosto: de lunes a viernes, de 8:00 a 15:00; sábados, cerrado.

## 3. Cancelaciones
Antes de responder a una cancelación, comprueba en la reserva: fecha de salida, tipo de tarifa y si tiene el seguro «Lunaria Tranquilo».
Calcula el importe siempre con la política de cancelaciones vigente. Nunca prometas un importe sin haberlo comprobado.

## 4. Fuerza mayor
Pide el justificante (informe de hospitalización o certificado de defunción) y registra el caso en el CRM con la etiqueta FM. Recuerda al cliente el plazo de 10 días para aportarlo.

## 5. Escalado
Escala a la responsable de atención al cliente, Marta Ruiz (extensión 214), en un plazo máximo de 24 horas cuando:
- la reclamación supere los 500 €;
- el cliente mencione abogados, la OMIC o una hoja de reclamaciones;
- el cliente pida hablar con Dirección.
No ofrezcas compensaciones ni descuentos sin su aprobación.

## 6. Datos personales
No copies datos de clientes (nombre, DNI, teléfono, correo, datos de salud) en herramientas externas ni en chats de inteligencia artificial que no estén aprobados por la empresa.
`
    },
    {
      id: 'acta', file: '05-acta-comite-direccion-2026-10-28.md', title: 'Acta del comité de dirección (28/10/2026)',
      tag: 'Acta · 28/10/2026',
      text: `# Acta del comité de dirección · 28 de octubre de 2026

Asistentes: Dirección General, Dirección de Operaciones, Atención al Cliente, Finanzas.

## Acuerdos
1. A partir del 1 de diciembre de 2026, los gastos de gestión por cancelación (tabla del §2 de la política) bajan de 25 € a 15 €. Operaciones publicará la versión 3.1 de la política antes de esa fecha.
2. El precio del seguro «Lunaria Tranquilo» sube a 45 € por persona para las reservas realizadas a partir del 1 de enero de 2027.
3. Se estudia ampliar la temporada alta a Semana Santa. No hay decisión: Finanzas presentará un informe en enero.

## Tareas
- Operaciones: versión 3.1 de la política (antes del 1/12/2026).
- Marketing: actualizar la FAQ de la web (sin fecha).
`
    },
    {
      id: 'reclamaciones', file: '06-reclamaciones-octubre-2026.md', title: 'Exportación del CRM: reclamaciones de octubre',
      tag: 'CRM · oct. 2026',
      text: `# Exportación CRM · Reclamaciones · Octubre 2026
Uso interno. Contiene datos personales de clientes.

| Fecha | Cliente | DNI | Teléfono | Correo | Motivo | Importe | Estado |
|---|---|---|---|---|---|---|---|
| 02/10 | Laura Prieto Gil | 00000001R | 600 000 101 | laura.prieto@example.com | Retraso en reembolso | 420 € | Cerrada |
| 07/10 | Andrés Molina Paz | 00000002W | 600 000 102 | a.molina@example.com | Hospitalización (FM) | 1.150 € | En curso |
| 15/10 | Sofía Herrera León | 00000003A | 600 000 103 | sofia.h@example.com | Tarifa «Última hora» | 680 € | Escalada |
| 23/10 | Javier Ortega Ruiz | 00000004G | 600 000 104 | jortega@example.com | Cambio de titular | 0 € | Cerrada |

(Datos ficticios creados para este ejercicio.)
`
    }
  ];

  /* ---------------- preguntas de la fase 3 ---------------- */
  const PREGUNTAS = [
    { n: 1, q: 'Una clienta cancela hoy (10/11/2026) un paquete a Lisboa de 1.200 € que sale el 1 de diciembre de 2026. ¿Cuánto le devolvemos?', foco: 'Cálculo directo con la tabla' },
    { n: 2, q: 'Un cliente cancela con 20 días de antelación un paquete de 2.000 € que sale el 10 de agosto de 2027. ¿Cuánto le devolvemos?', foco: 'Regla y excepción en apartados distintos' },
    { n: 3, q: '¿En cuántos días devolvemos el dinero tras una cancelación?', foco: 'Fuentes que se contradicen' },
    { n: 4, q: 'Un cliente con tarifa «Última hora» ha sido hospitalizado y no puede viajar. ¿Qué le ofrecemos?', foco: 'La excepción de la excepción' },
    { n: 5, q: 'Si un cliente cancela el 15 de diciembre de 2026 un paquete de 800 € que sale el 20 de febrero de 2027, ¿cuánto le devolveremos?', foco: 'Una decisión reciente que aún no está en la política' },
    { n: 6, q: 'Un cliente nos compró solo un billete de avión Madrid–Roma y quiere cancelarlo. ¿Qué porcentaje le devolvemos?', foco: 'Ámbito de la norma' },
    { n: 7, q: '¿Cuál es el teléfono de la responsable de calidad?', foco: 'Lo que no consta' },
    { n: 8, q: 'Una clienta reclama 650 € por un reembolso y dice que va a acudir a la OMIC. ¿Qué tengo que hacer?', foco: 'Procedimiento interno' }
  ];

  /* ---------------- viñetas del enunciado ---------------- */
  const PANELS_CASO = [
    {
      title: 'El encargo',
      caption: 'El equipo de atención de Viajes Lunaria responde mal sobre cancelaciones y te piden un cuaderno fiable.',
      steps: [
        'Viajes Lunaria es una agencia de viajes con seis agentes de atención al cliente.',
        'Cada día reciben decenas de consultas sobre cancelaciones, y cada agente responde «de memoria».',
        'El mes pasado se devolvió dinero con porcentajes antiguos y hubo tres reclamaciones.',
        'Te encargan montar en Gemini Notebook un cuaderno de consulta fiable, con respuestas citadas y verificadas.'
      ],
      draw(g) {
        show(g.at(0), () => { card(14, 14, 200, 120, 'VIAJES LUNARIA', P.teal); [0, 1, 2].forEach(i => person(30 + i * 56, 44, { shirt: [P.orange, P.blue, P.purple][i], still: true })); txt('6 agentes · atención al cliente', 114, 112, { size: 8, color: P.light, align: 'center' }); });
        show(g.at(1), () => { ['¿Cuánto me devolvéis?', '¿Y si estoy enfermo?', '¿Cuándo llega el dinero?'].forEach((q, i) => msg(232, 14 + i * 34, 230, q, { who: 'user', size: 8 })); });
        show(g.at(2), () => { box(232, 118, 230, 40, { fill: P.gray2 }); txt('Reembolsos con el porcentaje de 2024', 242, 124, { size: 8.5, color: P.white }); txt('→ 3 reclamaciones', 242, 140, { size: 8.5, color: P.red }); stamp('PORCENTAJE ANTIGUO', 120, 160, { a: late(g.at(2)), size: 8.5 }); });
        show(g.at(3), () => {
          const w = win(14, 172, 448, 58, 'Gemini Notebook · Atención Viajes Lunaria');
          ['fuentes vigentes', 'respuestas citadas', 'citas verificadas'].forEach((s, i) => chip(s, w.x + 8 + i * 146, w.y + 6, { fill: P.mint, size: 8, icon: 'check', iconTint: P.ink, w: 138 }));
          banner('Tu misión: que cada respuesta se pueda comprobar', { y: 240, h: 22 });
        });
      }
    },
    {
      title: 'Seis documentos, varias trampas',
      caption: 'Te entregan seis archivos. No todos deben entrar en el cuaderno y no todos dicen lo mismo.',
      steps: [
        'Te pasan seis documentos: dos versiones de la política, la FAQ de la web, el manual interno, un acta y una exportación del CRM.',
        'Algunos se contradicen: plazos, porcentajes y precios no coinciden entre sí.',
        'Y no todo lo que hay en la carpeta debería salir de la empresa.',
        'Antes de preguntar nada, decide qué entra en el cuaderno y por qué.'
      ],
      draw(g) {
        const docs = [['Política', '2026'], ['Política', '2024'], ['FAQ web', '2025'], ['Manual', '2026'], ['Acta', '28/10'], ['CRM', 'oct.']];
        docs.forEach((d, i) => show(g.at(0), () => {
          const x = 14 + i * 77;
          paper(x, 20, 68, 92, { title: d[0], size: 7.5, lines: 6, seed: i + 2 });
          chip(d[1], x + 34, 118, { align: 'center', fill: P.paper, size: 7.5 });
        }));
        show(g.at(1), () => { txt('¿30 días o 14?   ¿75 % o 70 %?   ¿35 €, 39 € o 45 €?', 240, 146, { size: 9, color: P.orange, align: 'center' }); qmark(60, 140); qmark(404, 140); });
        show(g.at(2), () => { icon('lock', 40, 172, 2); txt('¿Todo esto puede ir a una herramienta externa?', 70, 178, { size: 8.5, color: P.red }); });
        show(g.at(3), () => { person(330, 160, { shirt: P.teal, label: 'tú' }); bubble(366, 162, 100, 40, { text: '¿Qué subo y qué no?', tx: 358, ty: 182, size: 8.5 }); banner('Primero, elegir bien las fuentes', { y: 240, h: 22 }); });
      }
    }
  ];

  PL.practicas = PL.practicas || {};
  PL.practicas.b4 = {
    id: 'b4', block: 'b4',
    titulo: 'Un cuaderno fiable para Viajes Lunaria',
    subtitulo: 'Caso práctico del Bloque 4 · Gemini Notebook',
    duracion: '2 horas · en parejas',
    hoy: 'lunes, 10 de noviembre de 2026',
    contexto: [
      '**Viajes Lunaria** (empresa ficticia) es una agencia de viajes de Granada con seis agentes de atención al cliente. Cada día responden decenas de consultas sobre cancelaciones y reembolsos, y cada uno lo hace «de memoria». El mes pasado se devolvió dinero con los porcentajes de 2024 y hubo tres reclamaciones.',
      'La responsable de atención te encarga montar en **Gemini Notebook** (antes NotebookLM) un cuaderno de consulta que el equipo pueda usar con confianza: que responda con la documentación vigente, que cite cada afirmación y que diga «no consta» cuando no lo sepa. Te entrega una carpeta con **seis documentos** y una lista de **ocho preguntas reales** del último mes.',
      'Para este ejercicio, **hoy es lunes, 10 de noviembre de 2026**.'
    ],
    objetivos: [
      'Seleccionar fuentes con criterio de autoridad, fecha, versión y privacidad.',
      'Obtener respuestas citadas y verificar cada cita con S·R·C y A·F·V.',
      'Comprobar en la práctica cómo una fuente caducada contamina las respuestas.',
      'Diagnosticar si un fallo es de recuperación o de generación.',
      'Diseñar instrucciones, metadatos, troceado y un banco de pruebas para un asistente real.'
    ],
    docs: DOCS,
    preguntas: PREGUNTAS,
    fases: [
      {
        n: 1, titulo: 'Elegir las fuentes', min: 15,
        texto: 'Descarga los seis documentos y **léelos antes de subir nada**. Para cada uno decide: *subir*, *no subir* o *subir solo para el experimento de la fase 4 (desmarcado)*. Justifica cada decisión con autoridad, fecha, versión y privacidad.',
        entrega: 'Tabla: documento · decisión · justificación.'
      },
      {
        n: 2, titulo: 'Crear el cuaderno', min: 10,
        texto: '1. Entra en Gemini Notebook con la cuenta indicada por el profesorado y crea un cuaderno llamado «Atención Viajes Lunaria · fuentes vigentes».\n2. Añade **solo** las fuentes que decidiste subir. Puedes subir el archivo `.md` o usar «Copiar texto» y pegarlo como texto copiado.\n3. Comprueba que se han procesado bien: abre la política y busca la tabla del §2.\n4. Si tu versión permite personalizar las instrucciones del chat, pega unas instrucciones de anclaje (escríbelas tú: las necesitarás en la fase 6).',
        entrega: 'Captura del panel de fuentes.'
      },
      {
        n: 3, titulo: 'Preguntar y verificar', min: 40,
        texto: 'Haz las **ocho preguntas** de una en una, tal como están escritas. Para cada una, **abre todas las citas** y anota: la respuesta de la herramienta, las fuentes citadas, el veredicto de cada cita (*respalda*, *respalda en parte*, *no respalda* o *contradice*) con S·R·C y A·F·V, y si la respuesta final es correcta. Si no lo es, escribe la respuesta correcta con su cita.',
        entrega: 'Tabla de verificación de las ocho preguntas.'
      },
      {
        n: 4, titulo: 'Experimento de contaminación', min: 15,
        texto: 'Añade (o marca) la **política de 2024** y la **FAQ de la web** y repite las preguntas **1, 3 y 5**. Anota qué cambia y qué fuentes se citan ahora. Después, **vuelve a desmarcarlas o elimínalas**.',
        entrega: 'Comparación antes / después y una conclusión de dos líneas.'
      },
      {
        n: 5, titulo: 'Diagnosticar los fallos', min: 15,
        texto: 'Para cada respuesta incorrecta de las fases 3 y 4, decide si el fallo fue de **recuperación** (el fragmento correcto no estaba entre las citas) o de **generación** (estaba, pero la respuesta no lo usó bien), y propone un arreglo concreto.',
        entrega: 'Tabla: pregunta · síntoma · tipo de fallo · evidencia · arreglo.'
      },
      {
        n: 6, titulo: 'Diseñar para producción', min: 20,
        texto: 'La empresa quiere convertir el cuaderno en un asistente interno. Entrega:\n\n- **Instrucciones de sistema** para el asistente (anclaje, prioridad de fuentes, «no consta», formato de respuesta).\n- **Esquema de metadatos** para cada fragmento y **estrategia de troceado** para la política.\n- **Banco de pruebas** de al menos 6 preguntas nuevas, con respuesta esperada y fuente, que incluya trampas.\n- Qué hay que hacer en el cuaderno el **1 de diciembre de 2026**.',
        entrega: 'Documento breve con los cuatro apartados.'
      }
    ],
    evaluacion: [['Selección de fuentes y privacidad', '1,5'], ['Respuestas correctas (P1-P8)', '3'], ['Verificación de citas', '2'], ['Diagnóstico', '1,5'], ['Diseño para producción', '2']],
    panels: PANELS_CASO,
    solucion: null            // se carga desde api/index.php?a=caso_solucion&id=b4 (solo profesorado o casos abiertos)
  };
})();
