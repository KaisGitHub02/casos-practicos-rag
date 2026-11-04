# Casos prácticos de IA · Inglés con IA y Bloque 4 (RAG)

La presentación empieza por el **caso de hoy**: un cliente (Grupo Velantis,
ficticio) que quiere un profesor de inglés con IA para 20.000 empleados.
Los grupos de cuatro preparan diagramas de flujo y de secuencia, un mock de
la app en Excalidraw, arquitectura y modelos, costes (con una calculadora
frente a profesores nativos), plan de implantación con hitos, fiabilidad y
riesgos, y lo defienden ante el cliente.

Después viene el Bloque 4:

Explicación del bloque y un caso práctico ficticio para el máster: por qué una
IA inventa, cómo funciona RAG pieza a pieza (embeddings, troceado, índice,
prompt aumentado, evaluación y citas) y un caso en Gemini Notebook en el que
cada respuesta tiene que poder demostrarse. Empresa, personas y documentos
del caso son inventados.

Sigue la misma estructura y el mismo estilo que `casos-practicos-master-ia`
(reutiliza su `casos.css`, su `casos.js`, sus fuentes y sus logos).

## Enlaces

- **Explicación y caso (alumnos):** `docs/index.html`, publicado en la raíz de GitHub Pages.
- **Solución (docente):** `docs/solucion/index.html`, publicado en `/solucion/`.

## Estructura

```
Para clase/                 Presentación del bloque (explicación + caso)
  _fuente/                  rag.html, rag.css, rag.js, rag_datos.js, generar.mjs
    ingles.js               Calculadora de costes del caso de hoy
    labs.js                 Laboratorios interactivos (embeddings, troceado, modelo)
    casos.css, casos.js     De casos-practicos-master-ia (casos.js admite window.CP_LANES)
    sibou/                  Copia de Sibou Lab: motor de viñetas pixel art,
                            conceptos del Bloque 4 y datos del caso
Solo docente/
  Solucion del caso/        Solución en HTML y en Markdown
    _fuente/                solucion.html/css/js, b4-solucion.js, generar.mjs
docs/                       Lo que sirve GitHub Pages (se genera, no se edita)
publicar.mjs                Regenera todo y actualiza docs/
```

## Actualizar

Necesita Node.js 18 o superior. Después de cambiar algo en `_fuente`:

```
node publicar.mjs
```

Los textos de los conceptos, las viñetas y los datos del caso salen de Sibou Lab
(`js/content/b4.js`, `js/content/caso-b4.js` y `api/casos/b4-solucion.js`). Si
se cambian allí, hay que volver a copiarlos en `Para clase/_fuente/sibou/` y en
`Solo docente/Solucion del caso/_fuente/` antes de publicar.

## Ojo al publicar

`docs/solucion/` queda en una URL pública de GitHub Pages: cualquiera que la
conozca puede abrirla. Si la solución no debe verla el alumnado antes de la
sesión, no publiquéis esa carpeta hasta después (o usad la versión protegida
de Sibou Lab, que solo la entrega al profesorado).
