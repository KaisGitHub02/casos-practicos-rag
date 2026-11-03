/* Fuentes para profundizar: enlaces verificados de los apuntes v2 (comprobados el 8 de octubre de 2026). Formato: [título, url, nota] */
PL.sources = {
 "que-es-ia": [
  [
   "Updated definition of an AI system — OECD.AI",
   "https://oecd.ai/en/wonk/ai-system-definition-update",
   "En inglés. Definición oficial de la OCDE de «sistema de IA», que sirve de base a la del Reglamento europeo de IA. Útil para ver que la IA se define por inferir salidas a partir de entradas, no por «pensar»."
  ],
  [
   "¿Qué es la inteligencia artificial? — IBM Think",
   "https://www.ibm.com/es-es/think/topics/artificial-intelligence",
   "Introducción divulgativa en español a qué es la IA, sus tipos y sus usos."
  ]
 ],
 "mapa-ia": [
  [
   "IA vs. machine learning vs. deep learning vs. redes neuronales — IBM Think",
   "https://www.ibm.com/es-es/think/topics/ai-vs-machine-learning-vs-deep-learning-vs-neural-networks",
   "Explica en español la jerarquía anidada: «el machine learning es un subconjunto de la IA; el deep learning es un subconjunto del machine learning»."
  ],
  [
   "¿Qué es el aprendizaje automático? — Google for Developers",
   "https://developers.google.com/machine-learning/intro-to-ml/what-is-ml?hl=es-419",
   "Curso introductorio de Google, en español, que presenta los tipos de aprendizaje y la IA generativa."
  ]
 ],
 "supervisado": [
  [
   "Aprendizaje supervisado — Google for Developers",
   "https://developers.google.com/machine-learning/intro-to-ml/supervised?hl=es-419",
   "Explica en español los datos etiquetados, el entrenamiento y la diferencia entre clasificación y regresión."
  ],
  [
   "¿Qué es el aprendizaje supervisado? — IBM Think",
   "https://www.ibm.com/es-es/think/topics/supervised-learning",
   "Desarrolla los conjuntos de datos etiquetados («verdad de referencia»), la clasificación (ejemplo del spam) y la regresión (previsión de ingresos)."
  ]
 ],
 "no-supervisado": [
  [
   "¿Qué es el aprendizaje no supervisado? — IBM Think",
   "https://www.ibm.com/es-es/think/topics/unsupervised-learning",
   "Explica en español el agrupamiento, las reglas de asociación y la reducción de dimensionalidad. Entre los retos, incluye la necesidad de validación humana y la falta de transparencia de los criterios de agrupación."
  ],
  [
   "¿Qué es el agrupamiento en clústeres? — Google for Developers",
   "https://developers.google.com/machine-learning/clustering/overview?hl=es-419",
   "Curso de Google, en español, con usos como la segmentación de mercado y la detección de anomalías."
  ]
 ],
 "refuerzo": [
  [
   "Specification gaming: the flip side of AI ingenuity — Google DeepMind",
   "https://deepmind.google/blog/specification-gaming-the-flip-side-of-ai-ingenuity/",
   "(en inglés, 2020). Artículo de investigación divulgativa con los casos reales del barco de *Coast Runners* y del bloque de Lego. Es la fuente del aviso «cuidado con lo que premias»."
  ],
  [
   "¿Qué es el aprendizaje por refuerzo? — IBM Think",
   "https://www.ibm.com/es-es/think/topics/reinforcement-learning",
   "Explica en español el agente, el entorno, la recompensa y la política."
  ]
 ],
 "valor": [
  [
   "User Needs + Defining Success — People + AI Guidebook (Google PAIR)",
   "https://pair.withgoogle.com/chapter/user-needs/",
   "En inglés. Guía de diseño de Google con la sección «Decide if AI adds unique value»: cuándo conviene la IA y cuándo funciona mejor una solución basada en reglas (previsibilidad, alto coste del error, necesidad de transparencia)."
  ],
  [
   "Reglas del aprendizaje automático — Google for Developers",
   "https://developers.google.com/machine-learning/guides/rules-of-ml?hl=es-419",
   "Guía de ingeniería de Google; su regla n.º 1 es «No tengas miedo de lanzar un producto sin aprendizaje automático»."
  ]
 ],
 "siguiente-token": [
  [
   "Introducción a los modelos de lenguaje grandes — Curso intensivo de aprendizaje automático de Google",
   "https://developers.google.com/machine-learning/crash-course/llm?hl=es-419",
   "Módulo en español que define un modelo de lenguaje como un sistema que «estima la probabilidad de que un token o una secuencia de tokens aparezcan dentro de una secuencia más larga». También explica el contexto y los Transformers."
  ],
  [
   "¿Qué son los modelos de lenguaje de gran tamaño (LLM)? — IBM Think",
   "https://www.ibm.com/es-es/think/topics/large-language-models",
   "Introducción divulgativa en español al entrenamiento y al funcionamiento de los LLM."
  ]
 ],
 "tokens": [
  [
   "What are tokens and how to count them? — Centro de ayuda de OpenAI",
   "https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them",
   "En inglés. Documentación oficial con las reglas aproximadas (1 token ≈ 4 caracteres en inglés), la diferencia entre tokens de entrada y de salida, y la recomendación de medir con el tokenizador."
  ],
  [
   "Tokenizer — OpenAI Platform",
   "https://platform.openai.com/tokenizer",
   "Herramienta oficial para pegar un texto y ver cómo se divide en tokens. Prueba con una frase en español, una URL y un fragmento de código para reproducir la escena 2."
  ]
 ],
 "contexto": [
  [
   "Context windows — Documentación de Claude (Anthropic)",
   "https://platform.claude.com/docs/en/build-with-claude/context-windows",
   "En inglés. Define la ventana como la «memoria de trabajo» del modelo, incluida la propia respuesta, y advierte de que más contexto no es automáticamente mejor (*context rot*)."
  ],
  [
   "Lost in the Middle: How Language Models Use Long Contexts — Liu et al., arXiv / TACL",
   "https://arxiv.org/abs/2307.03172",
   "En inglés. Investigación de Stanford y otros centros: el rendimiento es mayor cuando la información relevante está al principio o al final del contexto, y cae cuando está en medio."
  ]
 ],
 "temperatura": [
  [
   "¿Qué es la temperatura de LLM? — IBM Think",
   "https://www.ibm.com/es-es/think/topics/llm-temperature",
   "Explicación en español: la temperatura regula la aleatoriedad. Matiza que no equivale exactamente a «creatividad»."
  ],
  [
   "How to generate text: using different decoding methods — Hugging Face",
   "https://huggingface.co/blog/how-to-generate",
   "En inglés. Artículo técnico de referencia: bajar la temperatura hace más probable lo probable y menos probable lo improbable, y, cuando tiende a cero, equivale a la decodificación voraz."
  ]
 ],
 "alucinacion": [
  [
   "Why language models hallucinate — OpenAI",
   "https://openai.com/index/why-language-models-hallucinate/",
   "(en inglés, septiembre de 2025). Artículo de investigación de Kalai, Nachum, Vempala y Zhang: los modelos alucinan, en parte, porque el entrenamiento y la evaluación premian adivinar frente a reconocer la incertidumbre."
  ],
  [
   "Reduce hallucinations — Documentación de Claude (Anthropic)",
   "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations",
   "En inglés. Guía práctica con técnicas concretas: permitir el «no lo sé», usar citas literales, verificar cada afirmación con una cita y restringirse a los documentos aportados."
  ]
 ],
 "modelos": [
  [
   "The Open Source AI Definition 1.0 — Open Source Initiative",
   "https://opensource.org/ai/open-source-ai-definition",
   "En inglés. Definición oficial de qué es «*open source*» en IA: exige información de los datos, el código y los parámetros. Es la referencia para no confundirlo con «pesos abiertos»."
  ],
  [
   "LLM de código abierto vs. propietarios — IBM Think",
   "https://www.ibm.com/es-es/think/topics/open-source-llms",
   "Análisis en español de las ventajas (control de los datos dentro de la propia red) y de los costes (infraestructura y despliegue) de los modelos abiertos frente a los propietarios."
  ]
 ],
 "prompt": [
  [
   "Prompting best practices — Documentación de Claude (Anthropic)",
   "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices",
   "En inglés. Guía oficial. Su principio «Be clear and direct» incluye la regla de oro de enseñar el prompt a un colega con poco contexto."
  ],
  [
   "¿Qué es la ingeniería de prompts? — IBM Think",
   "https://www.ibm.com/es-es/think/topics/prompt-engineering",
   "Introducción en español a qué es el *prompt engineering* y a técnicas como el *zero-shot*, el *few-shot* y la cadena de pensamiento."
  ]
 ],
 "anatomia-prompt": [
  [
   "Prompt engineering — Documentación de la API de OpenAI",
   "https://developers.openai.com/api/docs/guides/prompt-engineering",
   "En inglés. Guía oficial. Propone organizar el prompt en identidad, instrucciones, ejemplos y contexto, y delimitar las partes con Markdown o etiquetas XML."
  ],
  [
   "Prompting best practices: Structure prompts with XML tags — Anthropic",
   "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices",
   "En inglés. Sección de la guía oficial que explica por qué separar instrucciones, contexto, ejemplos y entradas reduce los errores de interpretación."
  ]
 ],
 "estrategias": [
  [
   "Prompting best practices: Use examples effectively — Anthropic",
   "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices",
   "En inglés. Recomienda de 3 a 5 ejemplos relevantes y variados, y explica cómo pedir al modelo que razone antes de responder."
  ],
  [
   "Prompt engineering: Few-shot learning — Documentación de la API de OpenAI",
   "https://developers.openai.com/api/docs/guides/prompt-engineering",
   "En inglés. Recomienda incluir en el prompt ejemplos de entrada y salida variados para que el modelo aprenda el patrón sin reentrenarlo, y separar los ejemplos de las instrucciones."
  ]
 ],
 "validar": [
  [
   "Artificial Intelligence Risk Management Framework: Generative AI Profile (NIST AI 600-1)",
   "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf",
   "(en inglés, PDF). Marco oficial del Instituto Nacional de Estándares y Tecnología de EE. UU. Identifica la confabulación entre los riesgos de la IA generativa y propone acciones de verificación y supervisión humana."
  ],
  [
   "Evaluating Verifiability in Generative Search Engines — Liu, Zhang y Liang, arXiv / EMNLP 2023",
   "https://arxiv.org/abs/2304.09848",
   "En inglés. Auditoría de cuatro buscadores generativos: solo el 51,5 % de las frases estaban plenamente respaldadas por sus citas, y solo el 74,5 % de las citas respaldaban su frase. Es la evidencia empírica de la escena 3."
  ]
 ],
 "privacidad": [
  [
   "Anonimización y seudonimización — Blog de la AEPD",
   "https://www.aepd.es/prensa-y-comunicacion/blog/anonimizacion-y-seudonimizacion",
   "Explicación oficial de la Agencia Española de Protección de Datos sobre la diferencia entre ambos conceptos y el riesgo de reidentificación."
  ],
  [
   "10 malentendidos relacionados con la anonimización — AEPD y SEPD",
   "https://aepd.es/guias/10-malentendidos-anonimizacion.pdf",
   "(PDF). Documento conjunto de la AEPD y el Supervisor Europeo de Protección de Datos que desmonta ideas erróneas, como que la seudonimización equivale a la anonimización o que anonimizar es siempre posible y definitivo."
  ]
 ],
 "markdown": [
  [
   "Sintaxis básica de escritura y formato — GitHub Docs",
   "https://docs.github.com/es/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax",
   "Referencia oficial en español con títulos, negrita, listas, listas de tareas, enlaces, citas y código."
  ],
  [
   "GitHub Flavored Markdown Spec",
   "https://github.github.com/gfm/",
   "En inglés. Especificación formal de GFM, basada en CommonMark, que define las tablas, las listas de tareas y el tachado."
  ]
 ],
 "obsidian": [
  [
   "Enlaces internos — Ayuda de Obsidian",
   "https://obsidian.md/es/help/links",
   "Documentación oficial en español sobre los enlaces wiki `[[ ]]`, los enlaces Markdown, los enlaces a encabezados y el texto visible personalizado."
  ],
  [
   "Sintaxis de formato básico — Ayuda de Obsidian",
   "https://obsidian.md/es/help/syntax",
   "Guía oficial en español de títulos, listas, tablas y otros elementos de Markdown en Obsidian."
  ]
 ],
 "prompt-no-basta": [
  [
   "Spec-driven development with AI: Get started with a new open source toolkit — The GitHub Blog",
   "https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/",
   "(en inglés, septiembre de 2025). Artículo de GitHub que presenta Spec Kit y explica por qué un prompt vago obliga al modelo a adivinar los requisitos no expresados."
  ],
  [
   "Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl — Birgitta Böckeler, martinfowler.com",
   "https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html",
   "(en inglés, octubre de 2025). Análisis crítico de una referencia reconocida en ingeniería de software: qué es una spec y en qué niveles se aplica el SDD."
  ]
 ],
 "spec": [
  [
   "¿Qué son los criterios de aceptación? — Atlassian",
   "https://www.atlassian.com/es/work-management/project-management/acceptance-criteria",
   "Guía en español del fabricante de Jira: definición, ejemplos y consejos para escribir criterios claros y comprobables."
  ],
  [
   "Understanding Spec-Driven-Development — martinfowler.com",
   "https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html",
   "En inglés. Define la spec como un artefacto estructurado, orientado al comportamiento y escrito en lenguaje natural, que guía a los agentes de IA."
  ]
 ],
 "flujo-sdd": [
  [
   "github/spec-kit — Repositorio oficial de Spec Kit (GitHub)",
   "https://github.com/github/spec-kit",
   "En inglés. Kit de código abierto que implementa el ciclo con fases explícitas (*constitution*, *specify*, *plan*, *tasks*, *implement*) y plantillas reutilizables."
  ],
  [
   "Spec-driven development with AI — The GitHub Blog",
   "https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/",
   "En inglés. Describe las cuatro fases (*specify*, *plan*, *tasks*, *implement*) y por qué separar los requisitos estables de la implementación facilita iterar."
  ]
 ],
 "spec-ejemplo": [
  [
   "github/spec-kit — Plantillas y flujo de Spec Kit",
   "https://github.com/github/spec-kit",
   "En inglés. Incluye plantillas reales de especificación, plan y tareas que se pueden comparar con la del Taller Sierra."
  ],
  [
   "¿Qué son los criterios de aceptación? — Atlassian",
   "https://www.atlassian.com/es/work-management/project-management/acceptance-criteria",
   "Ejemplos de criterios de aceptación bien y mal formulados para practicar la última sección de la spec."
  ]
 ],
 "trazabilidad": [
  [
   "Artificial Intelligence Risk Management Framework (AI RMF 1.0) — NIST",
   "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf",
   "(en inglés, PDF). Marco oficial que define las características de una IA fiable, entre ellas la responsabilidad y la transparencia, y la importancia de documentar los procesos."
  ],
  [
   "Understanding Spec-Driven-Development — martinfowler.com",
   "https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html",
   "En inglés. Distingue entre las specs que se descartan y las que se conservan («spec-anchored») para el mantenimiento posterior, que es la base de la trazabilidad."
  ]
 ],
 "problema-fuentes": [
  [
   "What is retrieval-augmented generation? — IBM Research",
   "https://research.ibm.com/blog/retrieval-augmented-generation-RAG",
   "En inglés. Explicación de los investigadores de IBM: un modelo solo conoce lo que aprendió, y RAG lo ancla en fuentes externas actualizadas y verificables."
  ],
  [
   "¿Qué es la generación aumentada por recuperación (RAG)? — Google Cloud",
   "https://cloud.google.com/use-cases/retrieval-augmented-generation?hl=es",
   "Página oficial en español que presenta RAG como la solución al conocimiento limitado y desactualizado de los modelos, con anclaje (*grounding*) y citas."
  ]
 ],
 "embeddings": [
  [
   "Embeddings — Curso intensivo de aprendizaje automático de Google",
   "https://developers.google.com/machine-learning/crash-course/embeddings?hl=es-419",
   "Módulo en español del curso de Google: qué es un embedding y cómo los elementos similares quedan próximos en el «espacio de embedding»."
  ],
  [
   "Información general sobre la búsqueda vectorial — Microsoft Learn",
   "https://learn.microsoft.com/es-es/azure/search/vector-search-overview",
   "Documentación oficial en español. Explica la búsqueda por similitud conceptual («perro» y «canino»), multilingüe y multimodal."
  ]
 ],
 "chunking": [
  [
   "Fragmentos de documentos — Azure AI Search, Microsoft Learn",
   "https://learn.microsoft.com/es-es/azure/search/vector-search-how-to-chunk-documents",
   "Documentación oficial en español sobre las técnicas de fragmentación (tamaño fijo, variable o semántica), el solapamiento recomendado y los factores que hay que considerar."
  ],
  [
   "Chunking Strategies for LLM Applications — Pinecone",
   "https://www.pinecone.io/learn/chunking-strategies/",
   "En inglés. Guía técnica de un proveedor de bases vectoriales: compara estrategias de fragmentación y explica cómo elegirlas según el contenido y las consultas."
  ]
 ],
 "vectorial": [
  [
   "What is a Vector Database & How Does it Work? — Pinecone",
   "https://www.pinecone.io/learn/vector-database/",
   "En inglés. Explica qué es una base de datos vectorial, la búsqueda aproximada de vecinos (ANN), el filtrado por metadatos y el control de acceso."
  ],
  [
   "¿Qué es una base de datos vectorial? — IBM Think",
   "https://www.ibm.com/es-es/think/topics/vector-database",
   "Introducción en español al almacenamiento y la búsqueda de embeddings, y a su papel en RAG."
  ]
 ],
 "rag": [
  [
   "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks — Lewis et al., arXiv / NeurIPS 2020",
   "https://arxiv.org/abs/2005.11401",
   "En inglés. El artículo original que introdujo el término RAG: combina un modelo generativo con un índice de documentos recuperables."
  ],
  [
   "¿Qué es la generación aumentada por recuperación (RAG)? — AWS",
   "https://aws.amazon.com/es/what-is/retrieval-augmented-generation/",
   "Explicación oficial en español de los cuatro pasos (crear datos externos, recuperar, aumentar el prompt, actualizar las fuentes) y de sus beneficios, entre ellos la atribución de fuentes."
  ]
 ],
 "contexto-aumentado": [
  [
   "Lost in the Middle: How Language Models Use Long Contexts — Liu et al., arXiv / TACL 2024",
   "https://arxiv.org/abs/2307.03172",
   "En inglés. Demuestra que muchos modelos aprovechan peor la información situada en mitad de un contexto largo. Justifica no meter fragmentos «por si acaso»."
  ],
  [
   "Introducing Contextual Retrieval — Anthropic",
   "https://www.anthropic.com/news/contextual-retrieval",
   "En inglés. Cómo añadir a cada fragmento el contexto de su documento antes de indexarlo, y cómo combinar búsqueda por palabras clave, embeddings y reordenación."
  ]
 ],
 "evaluar-rag": [
  [
   "The RAG Triad — TruLens",
   "https://www.trulens.org/getting_started/core_concepts/rag_triad/",
   "En inglés. Explica las tres medidas de la tríada: relevancia del contexto, fidelidad (groundedness) y relevancia de la respuesta."
  ],
  [
   "Ragas: documentación",
   "https://docs.ragas.io/en/stable/",
   "En inglés. Biblioteca abierta para evaluar sistemas RAG con métricas como fidelidad, relevancia y recall del contexto."
  ]
 ],
 "citas": [
  [
   "Evaluating Verifiability in Generative Search Engines — Liu, Zhang y Liang, arXiv / EMNLP 2023",
   "https://arxiv.org/abs/2304.09848",
   "En inglés. Estudio de Stanford: solo el 74,5 % de las citas de los buscadores generativos respaldaban su frase. Es la justificación empírica de abrir siempre las citas."
  ],
  [
   "Reduce hallucinations: Verify with citations — Documentación de Claude (Anthropic)",
   "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations",
   "En inglés. Técnica oficial para exigir una cita literal por afirmación y retirar las afirmaciones sin respaldo."
  ]
 ],
 "notebooklm": [
  [
   "Información sobre Gemini Notebook — Ayuda de NotebookLM (Google)",
   "https://support.google.com/notebooklm/answer/16164461?hl=es",
   "Página oficial en español: qué tipos de fuentes admite, qué formatos genera (guías de estudio, resúmenes, resúmenes en audio, mapas conceptuales) y su énfasis en las «citas claras» basadas en las fuentes. Consulta también la disponibilidad y la protección de datos antes del taller."
  ],
  [
   "Evaluating Verifiability in Generative Search Engines — Liu et al., 2023",
   "https://arxiv.org/abs/2304.09848",
   "En inglés. Recordatorio de por qué el paso «abrir la cita» del taller no es opcional."
  ]
 ],
 "pregunta-correcta": [
  [
   "Define success criteria and build evaluations — Documentación de Claude (Anthropic)",
   "https://platform.claude.com/docs/en/test-and-evaluate/develop-tests",
   "En inglés. Explica cómo definir criterios de éxito específicos, medibles, alcanzables y relevantes, y cómo evaluarlos. Es la base para convertir «¿cuál es mejor?» en una pregunta respondible."
  ],
  [
   "User Needs + Defining Success — People + AI Guidebook (Google PAIR)",
   "https://pair.withgoogle.com/chapter/user-needs/",
   "En inglés. Guía de diseño que parte de la necesidad de la persona usuaria, y no de la tecnología, para decidir qué herramienta o enfoque usar."
  ]
 ],
 "chatgpt": [
  [
   "Proyectos en ChatGPT — Centro de ayuda de OpenAI",
   "https://help.openai.com/es-es/articles/10169521-projects-in-chatgpt",
   "Guía oficial en español sobre los chats, los archivos, las instrucciones y el uso compartido dentro de los proyectos."
  ],
  [
   "¿Qué es la función Canvas de ChatGPT y cómo la uso? — Centro de ayuda de OpenAI",
   "https://help.openai.com/es-es/articles/9930697-what-is-the-canvas-feature-in-chatgpt-and-how-do-i-use-it",
   "Guía oficial del espacio de edición: edición directa, atajos y disponibilidad. Para los GPT personalizados, consulta además [Crear un GPT](https://help.openai.com/es-es/articles/8554397-creating-a-gpt) y sus condiciones según el plan."
  ]
 ],
 "claude": [
  [
   "¿Qué son los artefactos y cómo los uso? — Centro de ayuda de Claude",
   "https://support.claude.com/es/articles/17153992-que-son-los-artefactos-y-como-los-uso",
   "Explicación oficial de los *artifacts*: qué son, en qué planes están y cómo se editan, iteran y comparten."
  ],
  [
   "¿Cómo puedo crear y gestionar proyectos? — Centro de ayuda de Claude",
   "https://support.claude.com/es/articles/9519177-como-puedo-crear-y-gestionar-proyectos",
   "Guía oficial de los proyectos: base de conocimiento, instrucciones del proyecto, visibilidad y permisos de lectura o edición."
  ]
 ],
 "comparar": [
  [
   "Holistic Evaluation of Language Models (HELM) — Liang et al., Stanford CRFM, arXiv",
   "https://arxiv.org/abs/2211.09110",
   "En inglés. Marco de evaluación de Stanford que compara 30 modelos en 42 escenarios con siete métricas (precisión, calibración, robustez, equidad, sesgo, toxicidad y eficiencia). Muestra por qué una única prueba no basta para declarar un ganador."
  ],
  [
   "Define success criteria and build evaluations — Anthropic",
   "https://platform.claude.com/docs/en/test-and-evaluate/develop-tests",
   "En inglés. Cómo diseñar casos de prueba coherentes y métodos de puntuación (coincidencia exacta, escalas, rúbricas), aplicables a la matriz de comparación de clase."
  ]
 ],
 "organizacion": [
  [
   "What is the Model Context Protocol (MCP)? — Documentación oficial de MCP",
   "https://modelcontextprotocol.io/docs/getting-started/intro",
   "En inglés. Definición oficial del estándar, la analogía del USB-C y ejemplos de conexión con datos, herramientas y flujos."
  ],
  [
   "LLM06:2025 Excessive Agency — OWASP Gen AI Security Project",
   "https://genai.owasp.org/llmrisk/llm062025-excessive-agency/",
   "En inglés. Ficha de OWASP sobre la agencia excesiva y sus mitigaciones (mínimas funciones, mínimo privilegio, aprobación humana). Como ampliación en español: [Inteligencia artificial agéntica desde la perspectiva de protección de datos — AEPD](https://www.aepd.es/guias/orientaciones-ia-agentica.pdf)."
  ]
 ],
 "cierre": [
  [
   "Alfabetización en IA: preguntas y respuestas — Comisión Europea",
   "https://digital-strategy.ec.europa.eu/es/faqs/ai-literacy-questions-answers",
   "Página oficial de la Comisión sobre el artículo 4 del Reglamento de IA: qué exige, desde cuándo se aplica y cómo se supervisa."
  ],
  [
   "Artificial Intelligence Risk Management Framework (AI RMF 1.0) — NIST",
   "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf",
   "(en inglés, PDF). Marco de referencia internacional para gestionar los riesgos de la IA con responsabilidad, transparencia y supervisión humana."
  ]
 ]
};
