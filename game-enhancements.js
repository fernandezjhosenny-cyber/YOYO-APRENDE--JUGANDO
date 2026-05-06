(() => {
  const app = document.getElementById("app");
  if (!app) return;
  const PROGRESS_KEY = "yoyo_rg_p";
  const SESSION_KEY = "yoyo_rg_x";
  const STUDENTS_KEY = "yoyo_rg_s";
  const UI_STATE_KEY = "yoyo_rg_u";
  const TEACHER_CONFIG_KEY = "yoyo_rg_cfg";
  const ACTIVE_GAME_KEY = "yoyo_rg_active";
  const NOTICE_KEY = "yoyo_rg_notice";

  const EVALS = {
    "carta-1": { total: 5, correct: ["Saludo", "Agradecimiento", "Mensaje principal", "Despedida", "Firma"], area: "orden de la carta" },
    "carta-2": { total: 2, correct: ["agradecerte", "ayuda"], area: "completar ideas de gratitud" },
    "carta-3": { total: 4, groups: { Carta: ["Fecha", "Firma"], "No carta": ["Ingredientes", "Titular"] }, area: "partes de la carta" },
    "carta-4": { total: 4, area: "memoria visual del formato de carta" },
    "carta-5": { total: 3, correct: ["Gracias por explicarme con paciencia."], area: "mensaje principal" },
    "carta-6": { total: 3, correct: ["SALUDO", "FIRMA", "GRATITUD"], area: "elementos clave" },
    "carta-7": { total: 3, correct: ["SALUDO", "FIRMA", "GRATITUD"], area: "relacion de ideas" },
    "carta-8": { total: 3, correct: ["gratitud", "saludo", "firma"], area: "vocabulario de la carta" },
    "carta-9": { total: 4, correct: ["Pienso en la persona", "Escribo el saludo", "Agradezco con detalles", "Cierro con afecto"], area: "secuencia de escritura" },
    "carta-10": { total: 3, correct: ["Escribir una carta clara, respetuosa y afectuosa."], area: "cierre adecuado" },
    "receta-1": { total: 5, correct: ["Ingredientes", "Lavar", "Mezclar", "Servir", "Limpiar"], area: "orden de la receta" },
    "receta-2": { total: 2, correct: ["lavar", "mezclar"], area: "pasos de preparacion" },
    "receta-3": { total: 4, groups: { Receta: ["Ingredientes", "Paso 1"], "No receta": ["Opinion", "Firma"] }, area: "estructura de la receta" },
    "receta-4": { total: 4, area: "memoria de cocina" },
    "receta-5": { total: 3, correct: ["Lavar las manos antes de cocinar."], area: "seguridad e higiene" },
    "receta-6": { total: 3, correct: ["PASOS", "MEZCLAR", "INGREDIENTES"], area: "conceptos esenciales" },
    "receta-7": { total: 3, correct: ["INGREDIENTES", "PASOS", "MEDIDAS"], area: "componentes de la receta" },
    "receta-8": { total: 3, correct: ["ingredientes", "pasos", "medidas"], area: "vocabulario de receta" },
    "receta-9": { total: 4, correct: ["Busco utensilios", "Organizo ingredientes", "Sigo pasos", "Sirvo el plato"], area: "secuencia culinaria" },
    "receta-10": { total: 3, correct: ["Seguir el orden y cuidar la higiene."], area: "decision final" },
    "expositivo-1": { total: 5, correct: ["Titulo", "Subtitulo", "Datos", "Explicacion", "Cierre"], area: "organizacion expositiva" },
    "expositivo-2": { total: 2, correct: ["datos", "explicaciones"], area: "completar informacion" },
    "expositivo-3": { total: 4, groups: { Dato: ["La Tierra gira alrededor del Sol", "La Luna refleja luz"], Opinion: ["La ciencia es aburrida", "Los planetas son tristes"] }, area: "datos y opiniones" },
    "expositivo-4": { total: 4, area: "memoria del texto expositivo" },
    "expositivo-5": { total: 3, correct: ["La Tierra gira alrededor del Sol."], area: "seleccion de informacion real" },
    "expositivo-6": { total: 3, correct: ["DATOS", "SUBTITULO", "EXPLICAR"], area: "elementos informativos" },
    "expositivo-7": { total: 3, correct: ["DATOS", "SUBTITULO", "EXPLICAR"], area: "relacion de conceptos" },
    "expositivo-8": { total: 3, correct: ["dato", "explicacion", "subtitulo"], area: "vocabulario expositivo" },
    "expositivo-9": { total: 4, correct: ["Busco informacion", "Selecciono datos", "Explico el tema", "Comparto resultados"], area: "proceso de investigacion" },
    "expositivo-10": { total: 3, correct: ["Explicar con claridad usando informacion real."], area: "proposito del texto" },
    "comentario-1": { total: 4, correct: ["Opinion", "Razon", "Ejemplo", "Cierre respetuoso"], area: "orden del comentario" },
    "comentario-2": { total: 2, correct: ["claro", "respetuoso"], area: "completar comentario" },
    "comentario-3": { total: 4, groups: { Respetuoso: ["Entiendo tu idea, pero pienso distinto", "Buen punto, agregaria un ejemplo"], Irrespetuoso: ["Eso es tonto", "Tu opinion no vale"] }, area: "uso del respeto" },
    "comentario-4": { total: 4, area: "memoria del comentario" },
    "comentario-5": { total: 3, correct: ["Me gusto porque el personaje resolvio el problema con respeto."], area: "opinion fundamentada" },
    "comentario-6": { total: 3, correct: ["OPINION", "RAZON", "RESPETO"], area: "componentes del comentario" },
    "comentario-7": { total: 3, correct: ["OPINION", "RAZON", "RESPETO"], area: "relacion de ideas" },
    "comentario-8": { total: 3, correct: ["opinion", "argumento", "respeto"], area: "vocabulario argumentativo" },
    "comentario-9": { total: 4, correct: ["Leo el texto", "Pienso mi postura", "Escribo razones", "Comparto con respeto"], area: "proceso de opinion" },
    "comentario-10": { total: 3, correct: ["Opinar con respeto, razones y ejemplos."], area: "cierre reflexivo" },
    "anuncio-1": { total: 5, correct: ["Apertura", "Mensaje", "Datos", "Invitacion", "Cierre"], area: "estructura del anuncio radial" },
    "anuncio-2": { total: 2, correct: ["informar", "motivar"], area: "proposito del anuncio" },
    "anuncio-3": { total: 4, groups: { Anuncio: ["Invitacion final", "Datos del evento"], "No anuncio": ["Ingredientes", "Firma personal"] }, area: "elementos del anuncio" },
    "anuncio-4": { total: 4, area: "memoria del anuncio" },
    "anuncio-5": { total: 3, correct: ["Ven a la jornada de reciclaje este jueves a las 10."], area: "mensaje radial claro" },
    "anuncio-6": { total: 3, correct: ["VOZ", "MENSAJE", "INVITACION"], area: "componentes del anuncio" },
    "anuncio-7": { total: 3, correct: ["MENSAJE", "VOZ", "INVITACION"], area: "relacion del mensaje" },
    "anuncio-8": { total: 3, correct: ["mensaje", "voz", "invitacion"], area: "vocabulario radial" },
    "anuncio-9": { total: 4, correct: ["Pienso el publico", "Redacto el mensaje", "Practico la voz", "Presento el anuncio"], area: "secuencia del anuncio" },
    "anuncio-10": { total: 1, correct: ["Comunicar con entusiasmo y datos claros."], area: "construccion del anuncio" },
  };

  const GAME_HELP = {
    order: {
      title: "Ordena paso a paso",
      icon: "🧩",
      steps: ["Arrastra cada tarjeta", "Organiza de arriba hacia abajo", "Verifica una sola vez"],
      mode: "Arrastre guiado",
    },
    timeline: {
      title: "Construye la secuencia",
      icon: "🕒",
      steps: ["Mueve cada paso", "Observa el orden correcto", "Cierra con Verificar"],
      mode: "Linea temporal",
    },
    dropfill: {
      title: "Completa con piezas",
      icon: "🧠",
      steps: ["Toca o arrastra palabras", "Llena todos los espacios", "Verifica sin repetir"],
      mode: "Completar por arrastre",
    },
    classify: {
      title: "Clasifica por categorias",
      icon: "🎨",
      steps: ["Arrastra cada tarjeta", "Ubicala en su caja", "Revisa antes de verificar"],
      mode: "Clasificacion visual",
    },
    memory: {
      title: "Encuentra parejas",
      icon: "🃏",
      steps: ["Toca dos cartas", "Recuerda su ubicacion", "Completa todas las parejas"],
      mode: "Memoria visual",
    },
    target: {
      title: "Toca la tarjeta correcta",
      icon: "🎯",
      steps: ["Lee con calma el reto que aparece en cada tarjeta.", "Toca solo la tarjeta que responde mejor a la consigna.", "Si la actividad tiene varios retos, completa todos antes de verificar.", "Presiona Verificar una sola vez al final."],
      mode: "Seleccion guiada",
    },
    choice: {
      title: "Elige la mejor solucion",
      icon: "💡",
      steps: ["Lee cada consigna del reto.", "Selecciona una respuesta en cada bloque de tarjetas.", "Revisa que todos los retos queden contestados.", "Pulsa Verificar cuando termines toda la actividad."],
      mode: "Decision final",
    },
    cubes: {
      title: "Pulsa los cubos correctos",
      icon: "🧊",
      steps: ["Observa los nombres escritos en cada cubo.", "Selecciona solamente los cubos que pertenecen al tema.", "No pulses cubos distractores.", "Verifica cuando ya tengas todos los cubos correctos marcados."],
      mode: "Seleccion multiple",
    },
    pair: {
      title: "Relaciona ideas",
      icon: "🔗",
      steps: ["Observa el grupo correcto", "Marca las ideas que coinciden", "Cierra tu evaluacion"],
      mode: "Relacion de conceptos",
    },
    wordhunt: {
      title: "Sopa de palabras guiada",
      icon: "🔎",
      steps: ["Mira las palabras objetivo que aparecen arriba del tablero.", "Toca las letras en orden para formar una palabra completa.", "Cuando una palabra este bien formada, quedara marcada como encontrada.", "Encuentra todas las palabras objetivo antes de verificar."],
      mode: "Sopa de letras guiada",
    },
  };

  const ACTIVITY_LEVELS = {
    1: "Basico",
    2: "Basico",
    3: "Intermedio",
    4: "Intermedio",
    5: "Intermedio",
    6: "Avanzado",
    7: "Avanzado",
    8: "Avanzado",
    9: "Dificil",
    10: "Dificil",
  };

  const PROMPT_PACKS = {
    "carta-5": [
      { title: "Elige el mejor mensaje de agradecimiento", ok: "Gracias por explicarme con paciencia.", options: ["Gracias por explicarme con paciencia.", "No quiero escribir.", "Hazlo tu."] },
      { title: "Selecciona una despedida adecuada", ok: "Con carino y gratitud.", options: ["Con carino y gratitud.", "Me voy ya.", "Eso es todo."] },
      { title: "Selecciona la intencion correcta", ok: "Agradecer una ayuda recibida.", options: ["Agradecer una ayuda recibida.", "Dar una orden.", "Narrar una receta."] },
    ],
    "receta-5": [
      { title: "Selecciona la accion mas segura", ok: "Lavar las manos antes de cocinar.", options: ["Lavar las manos antes de cocinar.", "Jugar con el fuego.", "Correr en la cocina."] },
      { title: "Elige una buena practica", ok: "Organizar ingredientes antes de empezar.", options: ["Organizar ingredientes antes de empezar.", "Mezclar sin leer.", "Usar utensilios sucios."] },
      { title: "Selecciona un paso correcto", ok: "Seguir el orden de la receta.", options: ["Seguir el orden de la receta.", "Saltar todos los pasos.", "Agregar cualquier cosa."] },
    ],
    "expositivo-5": [
      { title: "Identifica la informacion real", ok: "La Tierra gira alrededor del Sol.", options: ["La Tierra gira alrededor del Sol.", "El Sol esta triste.", "Los oceanos hablan."] },
      { title: "Selecciona otro dato verificable", ok: "La Luna refleja la luz del Sol.", options: ["La Luna refleja la luz del Sol.", "La Luna cocina pastel.", "Los planetas cantan."] },
      { title: "Elige la mejor idea para informar", ok: "Usar hechos y explicaciones claras.", options: ["Usar hechos y explicaciones claras.", "Inventar sin revisar.", "Escribir solo opiniones."] },
    ],
    "comentario-5": [
      { title: "Elige una opinion fundamentada", ok: "Me gusto porque el personaje resolvio el problema con respeto.", options: ["Me gusto porque el personaje resolvio el problema con respeto.", "No sirve.", "Da igual todo."] },
      { title: "Selecciona una frase respetuosa", ok: "Entiendo tu idea, pero pienso diferente.", options: ["Entiendo tu idea, pero pienso diferente.", "Tu opinion no vale.", "Eso es ridiculo."] },
      { title: "Elige un buen argumento", ok: "Mi comentario tiene razones y ejemplo.", options: ["Mi comentario tiene razones y ejemplo.", "No explico nada.", "Solo critico."] },
    ],
    "anuncio-5": [
      { title: "Selecciona el mejor mensaje radial", ok: "Ven a la jornada de reciclaje este jueves a las 10.", options: ["Ven a la jornada de reciclaje este jueves a las 10.", "No vengas.", "No recuerdo la hora."] },
      { title: "Elige una llamada a la accion correcta", ok: "Te esperamos con entusiasmo.", options: ["Te esperamos con entusiasmo.", "Haz lo que quieras.", "No importa asistir."] },
      { title: "Selecciona la informacion mas clara", ok: "Lugar, fecha y hora del evento.", options: ["Lugar, fecha y hora del evento.", "Solo una emocion.", "Un mensaje sin datos."] },
    ],
    "carta-10": [
      { title: "Elige la mejor solucion final", ok: "Escribir una carta clara, respetuosa y afectuosa.", options: ["Escribir una carta clara, respetuosa y afectuosa.", "Mezclar pasos sin orden.", "Gritar el mensaje."] },
      { title: "Selecciona el mejor tono", ok: "Amable y agradecido.", options: ["Amable y agradecido.", "Molesto y agresivo.", "Confuso y vacio."] },
      { title: "Elige el mejor cierre", ok: "Despedida y firma al final.", options: ["Despedida y firma al final.", "Ingredientes al final.", "Titulo en el cierre."] },
    ],
    "receta-10": [
      { title: "Elige la mejor solucion final", ok: "Seguir el orden y cuidar la higiene.", options: ["Seguir el orden y cuidar la higiene.", "Olvidar los ingredientes.", "Saltar los pasos."] },
      { title: "Selecciona lo mas importante al cocinar", ok: "Orden, limpieza y cuidado.", options: ["Orden, limpieza y cuidado.", "Prisa y desorden.", "Improvisar sin leer."] },
      { title: "Elige un buen cierre de receta", ok: "Servir despues de completar los pasos.", options: ["Servir despues de completar los pasos.", "Servir al inicio.", "Nunca revisar el resultado."] },
    ],
    "expositivo-10": [
      { title: "Elige la mejor conclusion", ok: "Explicar con claridad usando informacion real.", options: ["Explicar con claridad usando informacion real.", "Escribir sin datos.", "Inventar sin revisar."] },
      { title: "Selecciona un recurso correcto", ok: "Datos, titulos y explicaciones.", options: ["Datos, titulos y explicaciones.", "Solo emociones.", "Rimas sin sentido."] },
      { title: "Elige el mejor objetivo", ok: "Informar al lector con claridad.", options: ["Informar al lector con claridad.", "Confundir al lector.", "Ocultar el tema."] },
    ],
    "comentario-10": [
      { title: "Elige la mejor conclusion", ok: "Opinar con respeto, razones y ejemplos.", options: ["Opinar con respeto, razones y ejemplos.", "Criticar sin explicar.", "Hablar sin escuchar."] },
      { title: "Selecciona el mejor cierre", ok: "Cerrar con una idea clara y respetuosa.", options: ["Cerrar con una idea clara y respetuosa.", "Cerrar insultando.", "Cerrar sin razon."] },
      { title: "Elige lo mas importante al comentar", ok: "Escuchar, pensar y argumentar.", options: ["Escuchar, pensar y argumentar.", "Interrumpir siempre.", "No leer el texto."] },
    ],
  };

  const PAIR_PACKS = {
    "carta-7": [
      { title: "Marca las ideas que pertenecen a una carta de agradecimiento", correct: ["SALUDO", "FIRMA", "GRATITUD"], extra: ["INGREDIENTES", "RADIO"] },
      { title: "Selecciona las partes que ayudan a cerrar correctamente", correct: ["DESPEDIDA", "FIRMA"], extra: ["TITULO", "PASO 1"] },
      { title: "Relaciona lo que expresa afecto y agradecimiento", correct: ["GRACIAS", "CARINO"], extra: ["SARTEN", "ANUNCIO"] },
    ],
    "receta-7": [
      { title: "Selecciona los elementos propios de una receta", correct: ["INGREDIENTES", "PASOS", "MEDIDAS"], extra: ["OPINION", "FIRMA"] },
      { title: "Marca las acciones importantes al cocinar", correct: ["LAVAR", "MEZCLAR"], extra: ["GRITAR", "SALTAR"] },
      { title: "Relaciona palabras de cocina", correct: ["UTENSILIOS", "SERVIR"], extra: ["DESPEDIDA", "ARGUMENTO"] },
    ],
    "expositivo-7": [
      { title: "Selecciona las partes del texto expositivo", correct: ["DATOS", "SUBTITULO", "EXPLICAR"], extra: ["FIRMA", "DESPEDIDA"] },
      { title: "Marca los recursos que ayudan a informar", correct: ["DATOS", "TITULO"], extra: ["INSULTO", "RECETA"] },
      { title: "Relaciona ideas propias de investigar", correct: ["FUENTE", "INFORMACION"], extra: ["SARTEN", "VOZ"] },
    ],
    "comentario-7": [
      { title: "Marca los elementos del comentario", correct: ["OPINION", "RAZON", "RESPETO"], extra: ["SARTEN", "RADIO"] },
      { title: "Selecciona las acciones para comentar bien", correct: ["LEER", "ARGUMENTAR"], extra: ["GRITAR", "BURLARSE"] },
      { title: "Relaciona ideas de dialogo respetuoso", correct: ["ESCUCHAR", "EJEMPLO"], extra: ["INSULTO", "INGREDIENTE"] },
    ],
    "anuncio-7": [
      { title: "Selecciona los elementos del anuncio radial", correct: ["MENSAJE", "VOZ", "INVITACION"], extra: ["RECETA", "POEMA"] },
      { title: "Marca lo que necesita un buen anuncio", correct: ["PUBLICO", "DATOS"], extra: ["DESORDEN", "SILENCIO"] },
      { title: "Relaciona ideas de difusion clara", correct: ["HORARIO", "LUGAR"], extra: ["FIRMA", "OPINION"] },
    ],
  };

  const FILL_PACKS = {
    "carta-2": [
      { parts: ["Escribo para", "____", "por tu", "____", "."], correct: ["agradecerte", "ayuda"], options: ["agradecerte", "ayuda", "receta", "anuncio"] },
      { parts: ["Mi", "____", "debe mostrar", "____", "."], correct: ["carta", "gratitud"], options: ["carta", "gratitud", "radio", "mezcla"] },
      { parts: ["Al final escribo la", "____", "y luego la", "____", "."], correct: ["despedida", "firma"], options: ["despedida", "firma", "sarten", "titulo"] },
    ],
    "receta-2": [
      { parts: ["Primero debo", "____", "y luego", "____", "los ingredientes."], correct: ["lavar", "mezclar"], options: ["lavar", "mezclar", "gritar", "correr"] },
      { parts: ["Una receta necesita", "____", "claros y", "____", "."], correct: ["pasos", "medidas"], options: ["pasos", "medidas", "poema", "firma"] },
      { parts: ["Antes de cocinar organizo los", "____", "y preparo los", "____", "."], correct: ["ingredientes", "utensilios"], options: ["ingredientes", "utensilios", "despedidas", "opiniones"] },
    ],
    "expositivo-2": [
      { parts: ["Un texto expositivo presenta", "____", "y", "____", "para informar."], correct: ["datos", "explicaciones"], options: ["datos", "explicaciones", "saltos", "ingredientes"] },
      { parts: ["El", "____", "anuncia el tema y el", "____", "lo organiza."], correct: ["titulo", "subtitulo"], options: ["titulo", "subtitulo", "firma", "saludo"] },
      { parts: ["Para investigar busco", "____", "y escribo", "____", "."], correct: ["fuentes", "informacion"], options: ["fuentes", "informacion", "sarten", "gritos"] },
    ],
    "comentario-2": [
      { parts: ["Mi comentario debe ser", "____", "y", "____", "para dialogar mejor."], correct: ["claro", "respetuoso"], options: ["claro", "respetuoso", "duro", "desordenado"] },
      { parts: ["Una opinion necesita", "____", "y un buen", "____", "."], correct: ["razones", "ejemplo"], options: ["razones", "ejemplo", "ingrediente", "radio"] },
      { parts: ["Antes de comentar debo", "____", "y luego", "____", "."], correct: ["leer", "pensar"], options: ["leer", "pensar", "burlarme", "saltar"] },
    ],
    "anuncio-2": [
      { parts: ["Un anuncio radial debe", "____", "y", "____", "al publico."], correct: ["informar", "motivar"], options: ["informar", "motivar", "callar", "ocultar"] },
      { parts: ["Un buen anuncio dice el", "____", "y el", "____", "."], correct: ["lugar", "horario"], options: ["lugar", "horario", "poema", "ingrediente"] },
      { parts: ["La", "____", "del locutor y la", "____", "final ayudan a convencer."], correct: ["voz", "invitacion"], options: ["voz", "invitacion", "firma", "despedida"] },
    ],
  };

  const COMPETENCY_INFO = {
    C1: {
      title: "Competencia 1: Competencia Comunicativa",
      text: "Comunica sus ideas, pensamientos y sentimientos con fluidez, mediante un modelo textual conveniente, en variadas situaciones y contextos, con el fin de demostrar conocimiento y uso adecuado de su lengua, a traves de diferentes medios y recursos.",
    },
    C2: {
      title: "Competencia 2: Pensamiento Logico, Creativo y Critico, Resolucion de Problemas y Cientifica y Tecnologica",
      text: "Elabora textos orales y escritos con creatividad y criticidad segun las conclusiones de los problemas abordados en investigaciones, y las publica a traves de medios variados.",
    },
    C3: {
      title: "Competencia 3: Ambiental de la salud, Etica y Ciudadana y Desarrollo Personal y Espiritual",
      text: "Caracteriza problemas sociales diversos, a traves de textos orales y escritos, con la finalidad de solucionarlos, canalizando emociones, sentimientos, relaciones humanas, asi como la preservacion de la salud y el ambiente, mediante el uso de recursos diversos.",
    },
  };

  let draggedToken = null;

  const readJson = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };

  const writeJson = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  let activeTimerId = null;
  let activeTimerActivityId = "";

  const sessionStudentId = () => readJson(SESSION_KEY, null)?.id || "";

  const defaultTeacherSettings = () => ({
    studentOrder: [],
    activities: ACTIVITY_CATALOG.reduce((acc, activity) => {
      acc[activity.id] = { enabled: true, duration: 0 };
      return acc;
    }, {}),
  });

  const getTeacherSettings = (teacherId) => {
    const store = readJson(TEACHER_CONFIG_KEY, {});
    const saved = store[teacherId] || {};
    const base = defaultTeacherSettings();
    return {
      studentOrder: Array.isArray(saved.studentOrder) ? saved.studentOrder : [],
      activities: Object.keys(base.activities).reduce((acc, activityId) => {
        const current = saved.activities?.[activityId] || {};
        acc[activityId] = {
          enabled: current.enabled !== false,
          duration: Number(current.duration || 0),
        };
        return acc;
      }, {}),
    };
  };

  const updateTeacherSettings = (teacherId, updater) => {
    const store = readJson(TEACHER_CONFIG_KEY, {});
    const next = typeof updater === "function" ? updater(getTeacherSettings(teacherId)) : updater;
    store[teacherId] = next;
    writeJson(TEACHER_CONFIG_KEY, store);
    return next;
  };

  const getStudentById = (studentId) =>
    readJson(STUDENTS_KEY, []).find((student) => student.id === studentId) || null;

  const getTeacherForStudent = (studentId) => {
    const student = getStudentById(studentId);
    return student ? student.teacherId : "";
  };

  const orderedStudentsForTeacher = (teacherId) => {
    const students = readJson(STUDENTS_KEY, []).filter((student) => student.teacherId === teacherId);
    const settings = getTeacherSettings(teacherId);
    const orderMap = new Map(settings.studentOrder.map((studentId, index) => [studentId, index]));
    return [...students].sort((left, right) => {
      const a = orderMap.has(left.id) ? orderMap.get(left.id) : Number.MAX_SAFE_INTEGER;
      const b = orderMap.has(right.id) ? orderMap.get(right.id) : Number.MAX_SAFE_INTEGER;
      if (a !== b) return a - b;
      return String(left.name || "").localeCompare(String(right.name || ""));
    });
  };

  const activitySettingsForStudent = (studentId, activityId) => {
    const teacherId = getTeacherForStudent(studentId);
    if (!teacherId) return { enabled: true, duration: 0 };
    return getTeacherSettings(teacherId).activities[activityId] || { enabled: true, duration: 0 };
  };

  const formatDuration = (minutes) => {
    const total = Number(minutes || 0);
    return total > 0 ? `${total} min` : "Sin tiempo";
  };

  const readStudentUiState = (studentId) => readJson(UI_STATE_KEY, {})[studentId] || { topic: "", act: "" };

  const writeStudentUiState = (studentId, patch) => {
    const state = readJson(UI_STATE_KEY, {});
    state[studentId] = { ...(state[studentId] || {}), ...patch };
    writeJson(UI_STATE_KEY, state);
  };

  const setStudentNotice = (studentId, message) => {
    const notices = readJson(NOTICE_KEY, {});
    notices[studentId] = message;
    writeJson(NOTICE_KEY, notices);
  };

  const consumeStudentNotice = (studentId) => {
    const notices = readJson(NOTICE_KEY, {});
    const message = notices[studentId];
    if (!message) return "";
    delete notices[studentId];
    writeJson(NOTICE_KEY, notices);
    return message;
  };

  const readActiveGames = () => readJson(ACTIVE_GAME_KEY, {});

  const clearActiveGame = (studentId) => {
    const active = readActiveGames();
    if (active[studentId]) {
      delete active[studentId];
      writeJson(ACTIVE_GAME_KEY, active);
    }
    if (activeTimerId) {
      clearInterval(activeTimerId);
      activeTimerId = null;
      activeTimerActivityId = "";
    }
  };

  const closeStudentActivity = (studentId, reason) => {
    if (!studentId) return;
    const active = readActiveGames();
    if (!active[studentId]) return;
    writeStudentUiState(studentId, { act: "" });
    setStudentNotice(studentId, reason);
    clearActiveGame(studentId);
  };

  const getProgressEntry = (activityId) => {
    const sid = sessionStudentId();
    if (!sid) return null;
    const progress = readJson(PROGRESS_KEY, {});
    return normalizeStoredEntry(progress[sid]?.[activityId] || null, activityId);
  };

  const saveProgressEntry = (activityId, payload) => {
    const sid = sessionStudentId();
    if (!sid) return;
    const progress = readJson(PROGRESS_KEY, {});
    progress[sid] = progress[sid] || {};
    progress[sid][activityId] = payload;
    writeJson(PROGRESS_KEY, progress);
  };

  const clearEvaluationMarks = (card, keepWrong = false) => {
    card.querySelectorAll(".correct, .wrong").forEach((node) => {
      node.classList.remove("correct");
      if (!keepWrong) node.classList.remove("wrong");
    });
  };

  const normalizeStoredEntry = (entry, activityId) => {
    if (!entry) return null;
    if (entry.attempts) return entry;
    return {
      attemptCount: entry.attempted ? 2 : 0,
      attempts: entry.attempted
        ? [
            {
              attemptNumber: 1,
              correctCount: entry.correctCount ?? entry.total ?? 0,
              total: entry.total ?? 1,
              score: entry.score ?? 0,
              level: entry.level ?? "En proceso",
              feedback: entry.feedback ?? "",
              details: entry.details ?? [],
              errors: Math.max(0, (entry.total ?? 1) - (entry.correctCount ?? 0)),
            },
            {
              attemptNumber: 2,
              correctCount: entry.correctCount ?? entry.total ?? 0,
              total: entry.total ?? 1,
              score: entry.score ?? 0,
              level: entry.level ?? "En proceso",
              feedback: entry.feedback ?? "",
              details: entry.details ?? [],
              errors: Math.max(0, (entry.total ?? 1) - (entry.correctCount ?? 0)),
            },
          ]
        : [],
      finalScore: entry.score ?? 0,
      finalLevel: entry.level ?? "En proceso",
      latest: entry,
      c: entry.c ?? competenciesFor(activityId),
      msg: entry.msg ?? "",
      ok: entry.ok ?? false,
      topicId: entry.topicId ?? String(activityId).split("-")[0],
      completed: !!entry.attempted,
    };
  };

  const levelForScore = (correct, total) => {
    const ratio = total ? correct / total : 0;
    if (ratio >= 0.85) return "Logrado";
    if (ratio >= 0.5) return "En proceso";
    return "Debes reforzar";
  };

  const competenciesFor = (activityId) => {
    const number = Number(String(activityId).split("-").pop());
    const map = {
      1: ["C1", "C2"],
      2: ["C1"],
      3: ["C2", "C3"],
      4: ["C1", "C2"],
      5: ["C1", "C3"],
      6: ["C1", "C2", "C3"],
      7: ["C1", "C2"],
      8: ["C1", "C2"],
      9: ["C2", "C3"],
      10: ["C1", "C2", "C3"],
    };
    return map[number] || [];
  };

  const TOPIC_LABELS = {
    carta: "La Carta de Agradecimiento",
    receta: "La Receta",
    expositivo: "El Texto Expositivo",
    comentario: "El Comentario",
    anuncio: "El Anuncio Radial",
  };

  const ACTIVITY_LABELS = {
    1: "Ordena la estructura",
    2: "Completa con arrastre",
    3: "Clasifica por colores",
    4: "Memoria visual",
    5: "Apunta al blanco",
    6: "Cubos 3D",
    7: "Relaciona ideas",
    8: "Sopa de palabras",
    9: "Linea del tiempo",
    10: "Carta final",
  };

  const ACTIVITY_CATALOG = Object.keys(TOPIC_LABELS).flatMap((topicId) =>
    Array.from({ length: 10 }, (_, index) => {
      const number = index + 1;
      return {
        id: `${topicId}-${number}`,
        topicId,
        topicLabel: TOPIC_LABELS[topicId],
        number,
        title: ACTIVITY_LABELS[number],
      };
    })
  );

  const feedbackFor = (activityId, result) => {
    const area = EVALS[activityId]?.area || "esta competencia";
    if (result.correctCount === result.total) {
      return `Lograste dominar ${area}. Mantén este nivel de precisión.`;
    }
    if (result.correctCount === 0) {
      return `Debes mejorar en ${area}. Revisa con tu docente cómo se organiza correctamente.`;
    }
    return `Debes mejorar en ${area}. Observa con atención las partes que quedaron fuera de lugar.`;
  };

  const markTokens = (nodes, okSet, attr) => {
    let correctCount = 0;
    nodes.forEach((node) => {
      const value = node.dataset[attr];
      const isCorrect = okSet.has(value);
      node.classList.remove("correct", "wrong");
      node.classList.add(isCorrect ? "correct" : "wrong");
      if (isCorrect) correctCount += 1;
    });
    return correctCount;
  };

  const wordSearchDirections = [
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: 1 },
    { dx: -1, dy: 1 },
  ];

  const canPlaceWord = (grid, rows, cols, word, row, col, direction) => {
    for (let index = 0; index < word.length; index += 1) {
      const nextRow = row + direction.dy * index;
      const nextCol = col + direction.dx * index;
      if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= cols) return false;
      const current = grid[nextRow * cols + nextCol];
      if (current && current !== word[index]) return false;
    }
    return true;
  };

  const placeWord = (grid, rows, cols, word) => {
    const attempts = 80;
    for (let tryIndex = 0; tryIndex < attempts; tryIndex += 1) {
      const direction = wordSearchDirections[Math.floor(Math.random() * wordSearchDirections.length)];
      const startRow = Math.floor(Math.random() * rows);
      const startCol = Math.floor(Math.random() * cols);
      if (!canPlaceWord(grid, rows, cols, word, startRow, startCol, direction)) continue;
      for (let index = 0; index < word.length; index += 1) {
        const nextRow = startRow + direction.dy * index;
        const nextCol = startCol + direction.dx * index;
        grid[nextRow * cols + nextCol] = word[index];
      }
      return true;
    }
    return false;
  };

  const evaluateActivity = (card) => {
    const activityId = card.dataset.g;
    const config = EVALS[activityId];
    if (!config) return { correctCount: 0, total: 1, score: 0, details: ["No se pudo evaluar esta actividad."], level: "En proceso" };

    const type = card.dataset.k;
    let correctCount = 0;
    const details = [];

    if (type === "order" || type === "timeline") {
      const current = [...card.querySelectorAll("[data-dv]")].map((node) => node.dataset.dv);
      [...card.querySelectorAll("[data-dv]")].forEach((node, index) => {
        const ok = current[index] === config.correct[index];
        node.classList.add(ok ? "correct" : "wrong");
        if (ok) correctCount += 1;
      });
      if (correctCount < config.total) details.push(`La secuencia correcta refuerza ${config.area}.`);
    } else if (type === "dropfill") {
      [...card.querySelectorAll("[data-s]")].forEach((slot, index) => {
        const ok = (slot.dataset.v || "") === config.correct[index];
        slot.classList.add(ok ? "correct" : "wrong");
        if (ok) correctCount += 1;
      });
      if (correctCount < config.total) details.push("Cada espacio debe completarse con la palabra precisa del contexto.");
    } else if (type === "classify") {
      Object.entries(config.groups).forEach(([group, labels]) => {
        const set = new Set(labels);
        [...card.querySelectorAll(`[data-z="${group}"] [data-token]`)].forEach((token) => {
          const ok = set.has(token.dataset.token);
          token.classList.add(ok ? "correct" : "wrong");
          if (ok) correctCount += 1;
        });
      });
      if (correctCount < config.total) details.push("Revisa qué elementos pertenecen realmente a cada categoría.");
    } else if (type === "memory") {
      correctCount = [...card.querySelectorAll(".memory-card.matched")].length / 2;
      if (correctCount < config.total) details.push("Debes identificar todas las parejas visuales del contenido.");
    } else if (type === "target" || type === "choice") {
      if (PROMPT_PACKS[activityId]) {
        PROMPT_PACKS[activityId].forEach((prompt, index) => {
          const group = `${activityId}-${index}`;
          const buttons = [...card.querySelectorAll(`[data-multi-group="${group}"]`)];
          const selected = buttons.find((button) => button.classList.contains("selected"));
          buttons.forEach((button) => {
            if (button.dataset.ch === prompt.ok) {
              button.classList.add("correct");
            } else if (button === selected) {
              button.classList.add("wrong");
            }
          });
          if (selected?.dataset.ch === prompt.ok) correctCount += 1;
        });
        if (correctCount < config.total) details.push(`Debes mejorar en ${config.area} con respuestas mas completas.`);
      } else {
        const selected = card.querySelector("[data-ch].selected");
        const ok = !!selected && config.correct.includes(selected.dataset.ch);
        card.querySelectorAll("[data-ch]").forEach((button) => {
          const isCorrect = config.correct.includes(button.dataset.ch);
          if (button === selected) {
            button.classList.add(ok ? "correct" : "wrong");
          } else if (isCorrect) {
            button.classList.add("correct");
          }
        });
        correctCount = ok ? 1 : 0;
        if (!ok) details.push(`La mejor respuesta debia enfocarse en ${config.area}.`);
      }
    } else if (type === "cubes") {
      correctCount = markTokens([...card.querySelectorAll("[data-cb].selected")], new Set(config.correct), "cb");
      const selected = [...card.querySelectorAll("[data-cb].selected")].length;
      if (selected > correctCount) details.push("Elegiste cubos que no pertenecen a la respuesta correcta.");
    } else if (type === "pair") {
      correctCount = markTokens([...card.querySelectorAll("[data-pr].selected")], new Set(config.correct), "pr");
      const selected = [...card.querySelectorAll("[data-pr].selected")].length;
      if (selected > correctCount) details.push("Debes elegir solamente las ideas que sí forman el grupo correcto.");
    } else if (type === "wordhunt") {
      correctCount = markTokens([...card.querySelectorAll("[data-wp].selected")], new Set(config.correct), "wp");
      const selected = [...card.querySelectorAll("[data-wp].selected")].length;
      if (selected > correctCount) details.push("Marcaste palabras que no pertenecen a la sopa de letras objetivo.");
    }

    const total = config.total;
    const score = Math.round((correctCount / total) * 10);
    const level = levelForScore(correctCount, total);
    const feedback = feedbackFor(activityId, { correctCount, total });
    if (!details.length) details.push(feedback);

    return { correctCount, total, score, level, feedback, details };
  };

  const topicCompetencyTemplate = () =>
    Object.keys(TOPIC_LABELS).reduce((acc, key) => {
      acc[key] = { C1: 0, C2: 0, C3: 0, total: 0, completed: 0 };
      return acc;
    }, {});

  const studentTopicCompetencies = (studentId) => {
    const progress = readJson(PROGRESS_KEY, {})[studentId] || {};
    const totals = topicCompetencyTemplate();

    Object.entries(progress).forEach(([activityId, entry]) => {
      const normalized = normalizeStoredEntry(entry, activityId);
      const topicId = String(activityId).split("-")[0];
      if (!totals[topicId]) return;
      const competencies = normalized.c || competenciesFor(activityId);
      totals[topicId].total += normalized.finalScore || 0;
      if (normalized.completed) totals[topicId].completed += 1;
      competencies.forEach((key) => {
        totals[topicId][key] += normalized.finalScore || 0;
      });
    });

    return totals;
  };

  const teacherTopicCompetencies = (teacherId) => {
    const students = readJson(STUDENTS_KEY, []).filter((student) => student.teacherId === teacherId);
    const totals = topicCompetencyTemplate();

    students.forEach((student) => {
      const studentTotals = studentTopicCompetencies(student.id);
      Object.keys(TOPIC_LABELS).forEach((topicId) => {
        totals[topicId].C1 += studentTotals[topicId].C1;
        totals[topicId].C2 += studentTotals[topicId].C2;
        totals[topicId].C3 += studentTotals[topicId].C3;
        totals[topicId].total += studentTotals[topicId].total;
        totals[topicId].completed += studentTotals[topicId].completed;
      });
    });

    return totals;
  };

  const buildCompetencySummary = (totals) => `
    <div class="topic-competency-list">
      ${Object.entries(TOPIC_LABELS)
        .map(
          ([topicId, label]) => `
            <article class="topic-competency-card">
              <h4>${label}:</h4>
              <div class="topic-activity-meta">
                <span>Actividades: ${totals[topicId].completed}</span>
                <span>Puntos: ${totals[topicId].total}</span>
              </div>
              <div class="topic-competency-row">
                <span class="competency-score">C1: ${totals[topicId].C1}</span>
                <span class="competency-score">C2: ${totals[topicId].C2}</span>
                <span class="competency-score">C3: ${totals[topicId].C3}</span>
              </div>
            </article>
          `
        )
        .join("")}
    </div>
  `;

  const buildTeacherAttemptSummary = (studentId) => {
    const progress = readJson(PROGRESS_KEY, {})[studentId] || {};
    const entries = Object.entries(progress)
      .map(([activityId, entry]) => normalizeStoredEntry(entry, activityId))
      .filter(Boolean)
      .flatMap((entry) =>
        (entry.attempts || []).map((attempt) => ({
          topicId: entry.topicId,
          attempt,
        }))
      );

    if (!entries.length) {
      return `<div class="teacher-attempt-empty">Sin intentos registrados todavia.</div>`;
    }

    return `
      <div class="teacher-attempt-list">
        ${entries
          .slice(-8)
          .reverse()
          .map(
            ({ topicId, attempt }) => `
              <div class="teacher-attempt-item">
                <strong>${TOPIC_LABELS[topicId] || topicId}</strong>
                <span>Intento ${attempt.attemptNumber}: ${attempt.correctCount}/${attempt.total}</span>
                <span>Fallos: ${attempt.errors}</span>
              </div>
            `
          )
          .join("")}
      </div>
    `;
  };

  const lockCard = (card, result) => {
    if (!card || card.dataset.locked === "1") return;
    card.dataset.locked = "1";
    card.classList.add("evaluation-locked");
    clearActiveGame(sessionStudentId());

    card.querySelectorAll("button, [draggable='true']").forEach((node) => {
      if (node.dataset.v) return;
      node.setAttribute("draggable", "false");
      node.disabled = true;
    });

    card.querySelectorAll(".slot,.zone,.zone-bank,.zone-token,.drag-strip,.memory-card,.letter-tile,.radio-piece,.radio-slot-card,.mission-choice,.pair-choice,.fill-pack-chip,.fill-pack-slot").forEach((node) => {
      node.classList.add("locked");
    });

    const verifyButton = card.querySelector("[data-v]");
    if (verifyButton) {
      verifyButton.disabled = true;
      verifyButton.textContent = "Evaluacion cerrada";
    }

    const actionBadge = card.querySelector(".action-row .status-badge");
    if (actionBadge) {
      actionBadge.textContent = `Resultado: ${result.correctCount} de ${result.total} correctas`;
    }

    card.querySelector(".evaluation-summary")?.remove();
    const summary = document.createElement("section");
    summary.className = "evaluation-summary";
    summary.innerHTML = `
      <div class="evaluation-pill">Evaluacion final completada</div>
      <h4>Resultado: ${result.correctCount} de ${result.total} correctas</h4>
      <p><strong>Nivel:</strong> ${result.level}</p>
      <p><strong>Puntuacion final:</strong> ${result.score}/10</p>
      <p><strong>Retroalimentacion:</strong> ${result.feedback}</p>
      <ul class="evaluation-list">
        ${result.details.map((detail) => `<li>${detail}</li>`).join("")}
      </ul>
    `;
    card.appendChild(summary);
  };

  const showAttemptSummary = (card, result, attemptNumber) => {
    if (!card) return;
    card.dataset.locked = "0";
    card.querySelector(".evaluation-summary")?.remove();
    const summary = document.createElement("section");
    summary.className = "evaluation-summary attempt-summary";
    summary.innerHTML = `
      <div class="evaluation-pill">Intento ${attemptNumber} de 2</div>
      <h4>Resultado parcial: ${result.correctCount} de ${result.total} correctas</h4>
      <p><strong>Nivel:</strong> ${result.level}</p>
      <p><strong>Retroalimentacion:</strong> Aun tienes un segundo intento. Revisa tus fallos antes de volver a verificar.</p>
      <ul class="evaluation-list">
        ${result.details.map((detail) => `<li>${detail}</li>`).join("")}
      </ul>
    `;
    card.appendChild(summary);

    const actionBadge = card.querySelector(".action-row .status-badge");
    if (actionBadge) {
      actionBadge.textContent = `Intento 1: ${result.correctCount}/${result.total}`;
    }
    const verifyButton = card.querySelector("[data-v]");
    if (verifyButton) {
      verifyButton.textContent = "Verificar segundo intento";
    }
  };

  app.addEventListener(
    "click",
    (event) => {
      const competencyButton = event.target.closest("[data-competency-key]");
      if (competencyButton) {
        const info = COMPETENCY_INFO[competencyButton.dataset.competencyKey];
        const modal = app.querySelector(".competency-modal");
        if (info && modal) {
          modal.querySelector("#competencyTitle").textContent = info.title;
          modal.querySelector(".competency-text").textContent = info.text;
          modal.classList.remove("hidden");
        }
        return;
      }

      if (event.target.closest("[data-close-competency]")) {
        app.querySelector(".competency-modal")?.classList.add("hidden");
        return;
      }

      const multiChoice = event.target.closest("[data-multi-group]");
      if (multiChoice && !multiChoice.disabled) {
        const group = multiChoice.dataset.multiGroup;
        app.querySelectorAll(`[data-multi-group="${group}"]`).forEach((button) => button.classList.remove("selected"));
        multiChoice.classList.add("selected");
        return;
      }

      const pairChoice = event.target.closest("[data-pair-group]");
      if (pairChoice && !pairChoice.disabled) {
        pairChoice.classList.toggle("selected");
        return;
      }

      const button = event.target.closest("[data-v]");
      if (!button) return;

      const card = button.closest("[data-g]");
      const activityId = card?.dataset.g;
      if (!card || !activityId) return;

      const existing = getProgressEntry(activityId);
      if (existing?.attemptCount >= 2 || existing?.completed) {
        event.preventDefault();
        event.stopImmediatePropagation();
        lockCard(card, existing.latest || existing);
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      const result =
        card.dataset.k === "pair" && PAIR_PACKS[activityId]
          ? evaluatePairPack(card, activityId)
          : card.dataset.k === "dropfill" && FILL_PACKS[activityId]
            ? evaluateFillPack(card, activityId)
            : evaluateActivity(card);
      const attemptNumber = (existing?.attemptCount || 0) + 1;
      const attemptRecord = {
        attemptNumber,
        correctCount: result.correctCount,
        total: result.total,
        score: result.score,
        level: result.level,
        feedback: result.feedback,
        details: result.details,
        errors: Math.max(0, result.total - result.correctCount),
      };
      const payload = {
        attemptCount: attemptNumber,
        attempts: [...(existing?.attempts || []), attemptRecord],
        finalScore: attemptNumber === 2 ? result.score : existing?.finalScore || 0,
        finalLevel: attemptNumber === 2 ? result.level : existing?.finalLevel || result.level,
        latest: {
          ok: result.correctCount === result.total,
          score: attemptNumber === 2 ? result.score : 0,
          correctCount: result.correctCount,
          total: result.total,
          level: result.level,
          feedback: result.feedback,
          details: result.details,
          msg: `Resultado: ${result.correctCount} de ${result.total} correctas`,
        },
        c: competenciesFor(activityId),
        msg: `Resultado: ${result.correctCount} de ${result.total} correctas`,
        ok: result.correctCount === result.total,
        topicId: String(activityId).split("-")[0],
        completed: attemptNumber >= 2,
      };
      saveProgressEntry(activityId, payload);

      if (attemptNumber === 1) {
        clearEvaluationMarks(card, true);
        showAttemptSummary(card, result, 1);
      } else {
        lockCard(card, payload.latest);
      }
    },
    true
  );

  app.addEventListener("keydown", (event) => {
    const competencyButton = event.target.closest?.("[data-competency-key]");
    if (competencyButton && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      competencyButton.click();
    }
    if (event.key === "Escape") {
      app.querySelector(".competency-modal")?.classList.add("hidden");
    }
  });

  app.addEventListener("change", (event) => {
    return;
  });

  document.addEventListener("visibilitychange", () => {});

  window.addEventListener("beforeunload", () => {});

  const activateZone = (zone) => {
    zone.classList.add("zone-active");
  };

  const clearZone = (zone) => {
    zone.classList.remove("zone-active");
  };

  const moveToken = (target) => {
    if (!draggedToken || !target) return;
    target.appendChild(draggedToken);
    draggedToken.classList.add("token-dropped");
    setTimeout(() => draggedToken?.classList.remove("token-dropped"), 280);
  };

  const prepareClassifyGames = () => {
    const classifyCards = app.querySelectorAll('[data-k="classify"]');
    classifyCards.forEach((card) => {
      const activityId = card.dataset.g;
      const config = EVALS[activityId];
      const bank = card.querySelector(".zone-bank");
      const zones = card.querySelectorAll(".zone");
      const tokens = card.querySelectorAll(".zone-token");

      if (!card.querySelector(".classify-guide") && config?.groups) {
        const guide = document.createElement("section");
        guide.className = "exact-instructions classify-guide";
        guide.innerHTML = `
          <div class="exact-title">Instrucciones exactas de esta actividad</div>
          <ol class="exact-list">
            <li>Lee todas las tarjetas que aparecen en el banco.</li>
            <li>Arrastra cada tarjeta a la caja correcta segun su categoria.</li>
            <li>No debe quedar ninguna tarjeta suelta fuera de las cajas.</li>
            <li>${Object.entries(config.groups).map(([group, items]) => `${group}: ${items.length} tarjetas`).join(" | ")}</li>
            <li>Cuando completes toda la clasificacion, baja al final y pulsa Verificar.</li>
          </ol>
        `;
        card.querySelector(".game-board")?.insertAdjacentElement("afterbegin", guide);
      }

      tokens.forEach((token) => {
        if (token.dataset.enhanced === "1") return;
        token.dataset.enhanced = "1";

        token.addEventListener("dragstart", () => {
          draggedToken = token;
          token.classList.add("dragging");
        });

        token.addEventListener("dragend", () => {
          token.classList.remove("dragging");
          draggedToken = null;
          zones.forEach(clearZone);
        });

        token.addEventListener("click", () => {
          if (!bank) return;
          const inZone = token.closest(".zone");
          if (inZone) {
            bank.appendChild(token);
            token.classList.add("token-dropped");
            setTimeout(() => token.classList.remove("token-dropped"), 280);
          }
        });
      });

      zones.forEach((zone) => {
        const bucket = zone.querySelector(".zone-items");
        if (!bucket) return;

        zone.addEventListener("dragover", (event) => {
          event.preventDefault();
          activateZone(zone);
        });

        zone.addEventListener("dragleave", () => clearZone(zone));

        zone.addEventListener("drop", (event) => {
          event.preventDefault();
          clearZone(zone);
          moveToken(bucket);
        });
      });

      if (bank && bank.dataset.enhanced !== "1") {
        bank.dataset.enhanced = "1";

        bank.addEventListener("dragover", (event) => {
          event.preventDefault();
          bank.classList.add("zone-bank-active");
        });

        bank.addEventListener("dragleave", () => {
          bank.classList.remove("zone-bank-active");
        });

        bank.addEventListener("drop", (event) => {
          event.preventDefault();
          bank.classList.remove("zone-bank-active");
          moveToken(bank);
        });
      }
    });
  };

  const hydrateLockedCards = () => {
    app.querySelectorAll("[data-g]").forEach((card) => {
      const saved = getProgressEntry(card.dataset.g);
      if (saved?.completed && saved?.latest) {
        lockCard(card, saved.latest);
      } else if ((saved?.attemptCount || 0) === 1 && saved?.attempts?.[0]) {
        showAttemptSummary(card, saved.attempts[0], 1);
      }
    });
  };

  const prepareGuides = () => {
    app.querySelectorAll(".activity-box").forEach((card) => {
      if (card.dataset.guideReady === "1") return;
      card.dataset.guideReady = "1";
      const title = card.querySelector("h4")?.textContent || "";
      const numberMatch = title.match(/^(\d+)/);
      const level = ACTIVITY_LEVELS[Number(numberMatch?.[1] || 1)] || "Basico";
      const lower = title.toLowerCase();
      const labels = [];
      if (lower.includes("ordena") || lower.includes("linea")) labels.push("Arrastrar");
      if (lower.includes("clasifica")) labels.push("Clasificar");
      if (lower.includes("memoria")) labels.push("Memoria");
      if (lower.includes("carta final") || lower.includes("apunta")) labels.push("Seleccion");
      if (lower.includes("sopa")) labels.push("Busqueda");
      if (lower.includes("completa")) labels.push("Completar");
      if (lower.includes("cubos")) labels.push("Cubos 3D");
      if (lower.includes("relaciona")) labels.push("Pensamiento");
      const strip = document.createElement("div");
      strip.className = "activity-extra";
      strip.innerHTML = `
        <div class="activity-tags">
          <span class="activity-tag level-tag">Nivel ${level}</span>
          ${(labels.length ? labels : ["Interactivo", "Evaluacion"]).map((label) => `<span class="activity-tag">${label}</span>`).join("")}
        </div>
        <div class="activity-note">Incluye instrucciones guiadas y evaluacion de hasta 2 intentos.</div>
      `;
      card.appendChild(strip);
    });

    app.querySelectorAll(".play-card[data-g]").forEach((card) => {
      if (card.dataset.helpReady === "1") return;
      card.dataset.helpReady = "1";
      const type = card.dataset.k;
      const activityId = card.dataset.g;
      const help = GAME_HELP[type];
      const area = EVALS[activityId]?.area || "esta actividad";
      const level = ACTIVITY_LEVELS[Number(String(activityId).split("-").pop())] || "Basico";
      if (!help) return;

      const guide = document.createElement("section");
      guide.className = "game-guide-grid";
      guide.innerHTML = `
        <article class="guide-card guide-card-main">
          <div class="guide-icon">${help.icon}</div>
          <div>
            <div class="guide-label">Como jugar</div>
            <h4>${help.title}</h4>
            <ol class="guide-list">
              ${help.steps.map((step) => `<li>${step}</li>`).join("")}
            </ol>
          </div>
        </article>
        <article class="guide-card">
          <div class="guide-label">Que se evalua</div>
          <p>${area}</p>
          <span class="guide-mode">${help.mode}</span>
          <span class="guide-level">Nivel ${level}</span>
        </article>
        <article class="guide-card guide-warning">
          <div class="guide-label">Regla importante</div>
          <p>Esta actividad permite hasta 2 intentos. En el primero no se muestran las respuestas correctas.</p>
        </article>
      `;

      const top = card.querySelector(".play-top");
      top?.insertAdjacentElement("afterend", guide);

      const board = card.querySelector(".game-board");
      if (board && !board.querySelector(".board-mission")) {
        const mission = document.createElement("div");
        mission.className = "board-mission";
        mission.innerHTML = `
          <div class="board-mission-label">Mision de la actividad</div>
          <p>Completa la tarea con atencion. Tendras hasta 2 intentos y la correccion completa aparecera al finalizar el segundo.</p>
        `;
        board.insertAdjacentElement("afterbegin", mission);
      }
    });
  };

  const prepareMemoryGames = () => {
    app.querySelectorAll('[data-k="memory"]').forEach((card) => {
      if (card.dataset.memoryReady === "1") return;
      card.dataset.memoryReady = "1";
      const board = card.querySelector(".game-board");
      if (!board) return;

      const guide = document.createElement("section");
      guide.className = "exact-instructions memory-guide";
      guide.innerHTML = `
        <div class="exact-title">Instrucciones exactas de esta actividad</div>
        <ol class="exact-list">
          <li>Toca dos cartas para descubrir lo que esconden.</li>
          <li>Si forman pareja, quedaran visibles.</li>
          <li>Si no coinciden, debes recordar su posicion para volver a intentarlo.</li>
          <li>Encuentra todas las parejas antes de bajar al final y pulsar Verificar.</li>
        </ol>
        <div class="memory-progress" data-memory-progress>Parejas encontradas: 0</div>
      `;
      board.insertAdjacentElement("afterbegin", guide);

      const updateMemoryProgress = () => {
        const matchedPairs = card.querySelectorAll(".memory-card.matched").length / 2;
        const node = card.querySelector("[data-memory-progress]");
        if (node) node.textContent = `Parejas encontradas: ${matchedPairs}`;
      };

      card.querySelectorAll(".memory-card").forEach((memoryCard) => {
        memoryCard.addEventListener("click", () => setTimeout(updateMemoryProgress, 500));
      });
      updateMemoryProgress();
    });
  };

  const prepareFillPackInteractions = () => {
    app.querySelectorAll(".fill-pack-chip").forEach((chip) => {
      if (chip.dataset.fillWire === "1") return;
      chip.dataset.fillWire = "1";

      let dragged = null;
      chip.addEventListener("dragstart", () => {
        dragged = chip;
        chip.classList.add("dragging");
        window.__yoyoFillChip = chip;
      });
      chip.addEventListener("dragend", () => {
        chip.classList.remove("dragging");
        window.__yoyoFillChip = null;
      });
      chip.addEventListener("click", () => {
        const group = chip.dataset.fillPackWord;
        const emptySlot = [...app.querySelectorAll(`[data-fill-pack-slot^="${group}-"]`)].find((slot) => slot.dataset.fill !== "1");
        if (emptySlot && !chip.disabled) {
          emptySlot.textContent = chip.dataset.w;
          emptySlot.dataset.v = chip.dataset.w;
          emptySlot.dataset.fill = "1";
          chip.disabled = true;
          chip.classList.add("used");
        }
      });
    });

    app.querySelectorAll(".fill-pack-slot").forEach((slot) => {
      if (slot.dataset.slotWire === "1") return;
      slot.dataset.slotWire = "1";
      slot.addEventListener("dragover", (event) => {
        event.preventDefault();
        slot.classList.add("zone-active");
      });
      slot.addEventListener("dragleave", () => {
        slot.classList.remove("zone-active");
      });
      slot.addEventListener("drop", (event) => {
        event.preventDefault();
        slot.classList.remove("zone-active");
        const chip = window.__yoyoFillChip;
        if (!chip || chip.disabled) return;
        slot.textContent = chip.dataset.w;
        slot.dataset.v = chip.dataset.w;
        slot.dataset.fill = "1";
        chip.disabled = true;
        chip.classList.add("used");
      });
      slot.addEventListener("click", () => {
        if (slot.dataset.fill !== "1") return;
        const card = slot.closest(".fill-pack-card");
        const word = slot.dataset.v;
        const chip = card?.querySelector(`.fill-pack-chip[data-w="${word}"]`);
        if (chip) {
          chip.disabled = false;
          chip.classList.remove("used");
        }
        slot.textContent = "Arrastra aqui";
        slot.dataset.v = "";
        slot.dataset.fill = "0";
      });
    });
  };

  const prepareCompetencyButtons = () => {
    app.querySelectorAll(".real-student .real-pills .real-pill").forEach((pill) => {
      const key = pill.textContent.trim();
      if (!COMPETENCY_INFO[key] || pill.dataset.competencyReady === "1") return;
      pill.dataset.competencyReady = "1";
      pill.dataset.competencyKey = key;
      pill.classList.add("competency-button");
      pill.setAttribute("role", "button");
      pill.setAttribute("tabindex", "0");
      pill.setAttribute("title", `Ver definicion de ${key}`);
    });

    if (!app.querySelector(".competency-modal")) {
      const modal = document.createElement("div");
      modal.className = "competency-modal hidden";
      modal.innerHTML = `
        <div class="competency-backdrop" data-close-competency="1"></div>
        <div class="competency-dialog" role="dialog" aria-modal="true" aria-labelledby="competencyTitle">
          <button class="competency-close" type="button" data-close-competency="1">×</button>
          <div class="competency-chip">Competencias</div>
          <h3 id="competencyTitle"></h3>
          <p class="competency-text"></p>
        </div>
      `;
      app.appendChild(modal);
    }
  };

  const prepareMissionPacks = () => {
    app.querySelectorAll('[data-k="target"],[data-k="choice"]').forEach((card) => {
      const activityId = card.dataset.g;
      const prompts = PROMPT_PACKS[activityId];
      if (!prompts || card.dataset.missionReady === "1" || activityId === "anuncio-10" || activityId === "carta-10") return;
      card.dataset.missionReady = "1";

      const board = card.querySelector(".game-board");
      const grid = card.querySelector(".target-grid");
      if (!board || !grid) return;
      grid.style.display = "none";

      const pack = document.createElement("section");
      pack.className = "mission-pack";
      pack.innerHTML = `
        <div class="exact-instructions">
          <div class="exact-title">Instrucciones exactas de esta actividad</div>
          <ol class="exact-list">
            <li>Lee cada reto uno por uno.</li>
            <li>En cada reto debes tocar solo una tarjeta correcta.</li>
            <li>Esta actividad tiene ${prompts.length} retos y debes responderlos todos.</li>
            <li>Cuando completes todas las respuestas, baja hasta el final y pulsa Verificar.</li>
          </ol>
        </div>
        <div class="mission-pack-head">
          <div class="mission-pack-badge">Nivel ${ACTIVITY_LEVELS[Number(activityId.split("-").pop())] || "Basico"}</div>
          <p>Completa las 3 decisiones de esta misma actividad antes de verificar.</p>
        </div>
        <div class="mission-pack-grid">
          ${prompts
            .map(
              (prompt, index) => `
                <article class="mission-card">
                  <div class="mission-card-label">Reto ${index + 1}</div>
                  <h4>${prompt.title}</h4>
                  <div class="multi-choice-grid">
                    ${prompt.options
                      .map(
                        (option) => `
                          <button class="target-card mission-choice" data-ch="${option}" data-multi-group="${activityId}-${index}" type="button">
                            ${option}
                          </button>
                        `
                      )
                      .join("")}
                  </div>
                </article>
              `
            )
            .join("")}
        </div>
      `;

      board.appendChild(pack);
    });
  };

  const prepareCubeGames = () => {
    app.querySelectorAll('[data-k="cubes"]').forEach((card) => {
      if (card.dataset.cubeReady === "1") return;
      card.dataset.cubeReady = "1";

      const activityId = card.dataset.g;
      const cubes = [...card.querySelectorAll("[data-cb]")];
      const correct = EVALS[activityId]?.total || 3;
      const board = card.querySelector(".game-board");
      if (!board) return;

      const panel = document.createElement("section");
      panel.className = "exact-instructions exact-instructions-cubes";
      panel.innerHTML = `
        <div class="exact-title">Instrucciones exactas de esta actividad</div>
        <ol class="exact-list">
          <li>Lee el nombre escrito en cada cubo.</li>
          <li>Debes seleccionar exactamente ${correct} cubos correctos.</li>
          <li>Los cubos correctos pertenecen al tema que estas trabajando.</li>
          <li>No selecciones cubos que sean distractores o pertenezcan a otro tema.</li>
          <li>Cuando termines, baja hasta el final y pulsa Verificar.</li>
        </ol>
        <div class="cube-progress" data-cube-progress>Seleccionados: 0 de ${correct}</div>
      `;
      board.insertAdjacentElement("afterbegin", panel);

      const refreshCubeProgress = () => {
        const selected = card.querySelectorAll("[data-cb].selected").length;
        const progress = card.querySelector("[data-cube-progress]");
        if (progress) progress.textContent = `Seleccionados: ${selected} de ${correct}`;
      };

      cubes.forEach((cube) => cube.addEventListener("click", () => setTimeout(refreshCubeProgress, 0)));
      refreshCubeProgress();
    });
  };

  const preparePairGames = () => {
    app.querySelectorAll('[data-k="pair"]').forEach((card) => {
      const activityId = card.dataset.g;
      const packs = PAIR_PACKS[activityId];
      if (!packs || card.dataset.pairReady === "1") return;
      card.dataset.pairReady = "1";

      const board = card.querySelector(".game-board");
      const original = card.querySelector(".choice-grid");
      if (!board || !original) return;
      original.style.display = "none";

      const section = document.createElement("section");
      section.className = "pair-pack";
      section.innerHTML = `
        <div class="exact-instructions">
          <div class="exact-title">Instrucciones exactas de esta actividad</div>
          <ol class="exact-list">
            <li>Lee cada reto por separado.</li>
            <li>En cada reto debes seleccionar todas las ideas correctas.</li>
            <li>No marques tarjetas que no pertenezcan al grupo pedido.</li>
            <li>Completa todos los retos y luego baja al final para pulsar Verificar.</li>
          </ol>
        </div>
        <div class="pair-pack-grid">
          ${packs
            .map((pack, index) => {
              const options = [...pack.correct, ...pack.extra].sort(() => Math.random() - 0.5);
              return `
                <article class="pair-pack-card">
                  <div class="mission-card-label">Reto ${index + 1}</div>
                  <h4>${pack.title}</h4>
                  <div class="pair-choice-grid">
                    ${options
                      .map(
                        (option) => `
                          <button class="match-card choice-card pair-choice" data-pair-group="${activityId}-${index}" data-pr="${option}" type="button">
                            ${option}
                          </button>
                        `
                      )
                      .join("")}
                  </div>
                </article>
              `;
            })
            .join("")}
        </div>
      `;

      board.appendChild(section);
    });
  };

  const prepareFillMissionPacks = () => {
    app.querySelectorAll('[data-k="dropfill"]').forEach((card) => {
      const activityId = card.dataset.g;
      const packs = FILL_PACKS[activityId];
      if (!packs || card.dataset.fillPackReady === "1") return;
      card.dataset.fillPackReady = "1";

      const board = card.querySelector(".game-board");
      const sentence = card.querySelector(".slot-sentence");
      const bank = card.querySelector(".word-bank");
      if (!board || !sentence || !bank) return;
      sentence.style.display = "none";
      bank.style.display = "none";

      const section = document.createElement("section");
      section.className = "fill-pack";
      section.innerHTML = `
        <div class="exact-instructions">
          <div class="exact-title">Instrucciones exactas de esta actividad</div>
          <ol class="exact-list">
            <li>Completa cada reto arrastrando palabras al espacio correcto.</li>
            <li>Cada bloque tiene dos espacios que debes llenar correctamente.</li>
            <li>No dejes ningun espacio vacio.</li>
            <li>Completa todos los retos y luego baja hasta Verificar.</li>
          </ol>
        </div>
        <div class="fill-pack-grid">
          ${packs
            .map((pack, index) => `
              <article class="fill-pack-card" data-fill-pack="${activityId}-${index}">
                <div class="mission-card-label">Reto ${index + 1}</div>
                <div class="fill-pack-sentence">
                  ${pack.parts
                    .map((part, partIndex) =>
                      part === "____"
                        ? `<div class="slot fill-pack-slot" data-fill-pack-slot="${activityId}-${index}-${partIndex}" data-fill-index="${partIndex}">Arrastra aqui</div>`
                        : `<span>${part}</span>`
                    )
                    .join("")}
                </div>
                <div class="word-bank fill-pack-bank">
                  ${pack.options
                    .map(
                      (option) => `
                        <button class="word-chip fill-pack-chip" draggable="true" data-fill-pack-word="${activityId}-${index}" data-w="${option}" type="button">
                          ${option}
                        </button>
                      `
                    )
                    .join("")}
                </div>
              </article>
            `)
            .join("")}
        </div>
      `;

      board.appendChild(section);
    });
  };

  const evaluatePairPack = (card, activityId) => {
    const packs = PAIR_PACKS[activityId];
    if (!packs) return null;
    let correctCount = 0;
    const details = [];

    packs.forEach((pack, index) => {
      const expected = new Set(pack.correct);
      const buttons = [...card.querySelectorAll(`[data-pair-group="${activityId}-${index}"]`)];
      const selected = buttons.filter((button) => button.classList.contains("selected"));
      buttons.forEach((button) => {
        if (expected.has(button.dataset.pr)) {
          button.classList.add("correct");
        } else if (button.classList.contains("selected")) {
          button.classList.add("wrong");
        }
      });
      const selectedCorrect = selected.filter((button) => expected.has(button.dataset.pr)).length;
      if (selected.length === pack.correct.length && selectedCorrect === pack.correct.length) {
        correctCount += 1;
      }
    });

    if (correctCount < packs.length) {
      details.push("Debes relacionar todas las ideas correctas en cada reto del grupo.");
    }

    return {
      correctCount,
      total: packs.length,
      score: Math.round((correctCount / packs.length) * 10),
      level: levelForScore(correctCount, packs.length),
      feedback: feedbackFor(activityId, { correctCount, total: packs.length }),
      details: details.length ? details : [feedbackFor(activityId, { correctCount, total: packs.length })],
    };
  };

  const evaluateFillPack = (card, activityId) => {
    const packs = FILL_PACKS[activityId];
    if (!packs) return null;
    let correctCount = 0;

    packs.forEach((pack, index) => {
      const slots = [...card.querySelectorAll(`[data-fill-pack-slot^="${activityId}-${index}-"]`)];
      let packOk = true;
      slots.forEach((slot, slotIndex) => {
        const expected = pack.correct[slotIndex];
        const ok = (slot.dataset.v || "") === expected;
        slot.classList.add(ok ? "correct" : "wrong");
        if (!ok) packOk = false;
      });
      if (packOk) correctCount += 1;
    });

    return {
      correctCount,
      total: packs.length,
      score: Math.round((correctCount / packs.length) * 10),
      level: levelForScore(correctCount, packs.length),
      feedback: feedbackFor(activityId, { correctCount, total: packs.length }),
      details: [
        correctCount === packs.length
          ? "Completaste correctamente todos los bloques con arrastre."
          : "Debes revisar con mas atencion las palabras que colocas en cada espacio.",
      ],
    };
  };

  const prepareSimpleTargetGames = () => {
    app.querySelectorAll('[data-k="target"]').forEach((card) => {
      if (card.dataset.targetReady === "1") return;
      card.dataset.targetReady = "1";
      const board = card.querySelector(".game-board");
      const choices = card.querySelectorAll("[data-ch]").length;
      if (!board) return;

      const panel = document.createElement("section");
      panel.className = "exact-instructions";
      panel.innerHTML = `
        <div class="exact-title">Instrucciones exactas de esta actividad</div>
        <ol class="exact-list">
          <li>Lee las ${choices} tarjetas que aparecen en pantalla.</li>
          <li>Analiza cual tarjeta responde mejor a la consigna del tema.</li>
          <li>Toca solamente una tarjeta correcta.</li>
          <li>No cambies tu respuesta cuando ya hayas revisado.</li>
          <li>Luego baja al final y pulsa Verificar.</li>
        </ol>
      `;
      board.insertAdjacentElement("afterbegin", panel);
    });
  };

  const prepareSideSummaries = () => {
    const session = readJson(SESSION_KEY, null);
    if (!session) return;

    if (session.role === "student") {
      const side = app.querySelector(".real-student .real-side");
      if (side) {
        const totals = studentTopicCompetencies(session.id);
        const codeValue =
          side.querySelector("strong")?.textContent?.trim() || "Sin codigo";
        const nextHtml = `
          <h3 class="list-title-main">Clase vinculada</h3>
          <div class="empty-main">Codigo activo:<br><strong>${codeValue}</strong></div>
          ${buildCompetencySummary(totals)}
        `;
        if (side.dataset.summaryHtml !== nextHtml) {
          side.innerHTML = nextHtml;
          side.dataset.summaryHtml = nextHtml;
        }
      }
    }

    if (session.role === "teacher") {
      const side = app.querySelector(".real-dashboard .real-side");
      if (side) {
        const totals = teacherTopicCompetencies(session.id);
        const students = orderedStudentsForTeacher(session.id);
        const nextHtml = `
          <h3 class="list-title-main">Mis estudiantes</h3>
          <div class="teacher-roster-detailed">
            ${
              students.length
                ? students
                    .map((student, index) => `
                      <article class="teacher-student-card">
                        <div class="teacher-student-head">
                          <div>
                            <div class="teacher-order-line">Orden ${index + 1}</div>
                            <strong>${student.name}</strong>
                          </div>
                          <span class="real-chip">${studentTopicCompetencies(student.id).total} pts</span>
                        </div>
                        <div class="teacher-order-actions">
                          <button class="real-ghost order-btn" data-order-student="${student.id}" data-order-dir="up" type="button">Subir</button>
                          <button class="real-ghost order-btn" data-order-student="${student.id}" data-order-dir="down" type="button">Bajar</button>
                        </div>
                        ${buildTeacherAttemptSummary(student.id)}
                      </article>
                    `)
                    .join("")
                : `<div class="teacher-attempt-empty">Todavia no hay estudiantes unidos.</div>`
            }
          </div>
          <div class="teacher-summary-block">
            <h3 class="list-title-main">Competencias por temario</h3>
            ${buildCompetencySummary(totals)}
          </div>
        `;
        if (side.dataset.summaryHtml !== nextHtml) {
          side.innerHTML = nextHtml;
          side.dataset.summaryHtml = nextHtml;
        }
      }
    }
  };

  const prepareTeacherControls = () => {};

  const prepareStudentControls = () => {};

  const prepareRadioGame = () => {
    const card = app.querySelector('[data-g="anuncio-10"][data-k="choice"]');
    if (!card || card.dataset.radioEnhanced === "1") return;
    card.dataset.radioEnhanced = "1";

    const board = card.querySelector(".game-board");
    const originalGrid = card.querySelector(".target-grid");
    if (!board || !originalGrid) return;

    originalGrid.style.display = "none";

    const hiddenChoices = [...originalGrid.querySelectorAll("[data-ch]")];
    const correctChoice = hiddenChoices.find((button) =>
      button.dataset.ch?.includes("Comunicar con entusiasmo")
    );
    const wrongChoice =
      hiddenChoices.find((button) => button !== correctChoice) || hiddenChoices[0];

    const pieces = [
      { slot: "inicio", text: "Atencion, comunidad escolar!", ok: true },
      { slot: "inicio", text: "No escuches nada.", ok: false },
      { slot: "mensaje", text: "Este viernes tendremos una jornada de reciclaje.", ok: true },
      { slot: "mensaje", text: "Tal vez pase algo, no sabemos.", ok: false },
      { slot: "cierre", text: "Te esperamos con entusiasmo a las 10 de la manana.", ok: true },
      { slot: "cierre", text: "Fin del mensaje sin datos.", ok: false },
    ];

    const builder = document.createElement("section");
    builder.className = "radio-builder";
    builder.innerHTML = `
      <div class="radio-stage">
        <div class="radio-slot-card" data-radio-slot="inicio">
          <div class="radio-slot-label">Inicio</div>
          <div class="radio-slot-drop">Arrastra una apertura</div>
        </div>
        <div class="radio-slot-card" data-radio-slot="mensaje">
          <div class="radio-slot-label">Mensaje</div>
          <div class="radio-slot-drop">Arrastra la idea central</div>
        </div>
        <div class="radio-slot-card" data-radio-slot="cierre">
          <div class="radio-slot-label">Cierre</div>
          <div class="radio-slot-drop">Arrastra una invitacion final</div>
        </div>
      </div>
      <div class="radio-bank">
        ${pieces
          .map(
            (piece, index) => `
              <button
                class="radio-piece"
                draggable="true"
                type="button"
                data-piece-index="${index}"
                data-piece-slot="${piece.slot}"
                data-piece-ok="${piece.ok ? "1" : "0"}"
              >
                ${piece.text}
              </button>
            `
          )
          .join("")}
      </div>
      <div class="radio-preview">
        <div class="radio-preview-title">Cabina de radio</div>
        <div class="radio-bubble" data-radio-preview>
          Arrastra bloques para crear un anuncio claro y emocionante.
        </div>
      </div>
    `;

    board.appendChild(builder);

    let draggedPiece = null;

    const refreshPreview = () => {
      const chosen = [...builder.querySelectorAll(".radio-slot-card")].map((slotCard) => {
        const piece = slotCard.querySelector(".radio-piece");
        return piece ? piece.textContent.trim() : "";
      });

      const preview = builder.querySelector("[data-radio-preview]");
      if (!preview) return;

      const complete = chosen.every(Boolean);
      preview.textContent = complete
        ? `📻 ${chosen.join(" ")}`
        : "Arrastra bloques para crear un anuncio claro y emocionante.";

      const allCorrect = [...builder.querySelectorAll(".radio-slot-card")].every((slotCard) => {
        const piece = slotCard.querySelector(".radio-piece");
        return piece && piece.dataset.pieceOk === "1" && piece.dataset.pieceSlot === slotCard.dataset.radioSlot;
      });

      hiddenChoices.forEach((choice) => choice.classList.remove("selected"));
      (complete && allCorrect ? correctChoice : wrongChoice)?.classList.add("selected");
    };

    const sendBackToBank = (piece) => {
      const bank = builder.querySelector(".radio-bank");
      if (!bank) return;
      bank.appendChild(piece);
      piece.classList.add("token-dropped");
      setTimeout(() => piece.classList.remove("token-dropped"), 260);
      refreshPreview();
    };

    builder.querySelectorAll(".radio-piece").forEach((piece) => {
      piece.addEventListener("dragstart", () => {
        draggedPiece = piece;
        piece.classList.add("dragging");
      });

      piece.addEventListener("dragend", () => {
        piece.classList.remove("dragging");
        draggedPiece = null;
        builder.querySelectorAll(".radio-slot-card").forEach((slotCard) => {
          slotCard.classList.remove("zone-active");
        });
      });

      piece.addEventListener("dblclick", () => {
        if (piece.closest(".radio-slot-card")) {
          sendBackToBank(piece);
        }
      });
    });

    builder.querySelectorAll(".radio-slot-card").forEach((slotCard) => {
      const dropZone = slotCard.querySelector(".radio-slot-drop");
      if (!dropZone) return;

      slotCard.addEventListener("dragover", (event) => {
        event.preventDefault();
        slotCard.classList.add("zone-active");
      });

      slotCard.addEventListener("dragleave", () => {
        slotCard.classList.remove("zone-active");
      });

      slotCard.addEventListener("drop", (event) => {
        event.preventDefault();
        slotCard.classList.remove("zone-active");
        if (!draggedPiece) return;

        const existing = slotCard.querySelector(".radio-piece");
        if (existing) {
          sendBackToBank(existing);
        }

        dropZone.replaceWith(draggedPiece);
        draggedPiece.classList.add("token-dropped");
        setTimeout(() => draggedPiece?.classList.remove("token-dropped"), 260);
        refreshPreview();
      });
    });

    const bank = builder.querySelector(".radio-bank");
    if (bank) {
      bank.addEventListener("dragover", (event) => {
        event.preventDefault();
        bank.classList.add("zone-bank-active");
      });

      bank.addEventListener("dragleave", () => {
        bank.classList.remove("zone-bank-active");
      });

      bank.addEventListener("drop", (event) => {
        event.preventDefault();
        bank.classList.remove("zone-bank-active");
        if (draggedPiece) {
          bank.appendChild(draggedPiece);
          refreshPreview();
        }
      });
    }

    refreshPreview();
  };

  const prepareCartaFinalGame = () => {
    const card = app.querySelector('[data-g="carta-10"][data-k="choice"]');
    if (!card || card.dataset.cartaFinalReady === "1") return;
    card.dataset.cartaFinalReady = "1";

    const board = card.querySelector(".game-board");
    const originalGrid = card.querySelector(".target-grid");
    if (!board || !originalGrid) return;
    originalGrid.style.display = "none";

    const prompts = PROMPT_PACKS["carta-10"];
    const section = document.createElement("section");
    section.className = "mission-pack carta-final-pack";
    section.innerHTML = `
      <div class="exact-instructions">
        <div class="exact-title">Instrucciones exactas de esta actividad</div>
        <ol class="exact-list">
          <li>Lee cada bloque de la carta final.</li>
          <li>En cada bloque debes tocar una sola respuesta correcta.</li>
          <li>Debes completar los 3 bloques antes de verificar.</li>
          <li>Cuando termines, baja al final y pulsa Verificar.</li>
        </ol>
      </div>
      <div class="mission-pack-head">
        <div class="mission-pack-badge">Nivel Dificil</div>
        <p>Construye una carta final correcta seleccionando tono, cierre y solucion adecuada.</p>
      </div>
      <div class="mission-pack-grid wide-pack-grid">
        ${prompts
          .map(
            (prompt, index) => `
              <article class="mission-card carta-final-card">
                <div class="mission-card-label">Bloque ${index + 1}</div>
                <h4>${prompt.title}</h4>
                <div class="multi-choice-grid">
                  ${prompt.options
                    .map(
                      (option) => `
                        <button class="target-card mission-choice carta-final-choice" data-ch="${option}" data-multi-group="carta-10-${index}" type="button">
                          ${option}
                        </button>
                      `
                    )
                    .join("")}
                </div>
              </article>
            `
          )
          .join("")}
      </div>
    `;

    board.appendChild(section);
  };

  const prepareWordSearchGames = () => {
    const cards = app.querySelectorAll('[data-k="wordhunt"]');
    cards.forEach((card) => {
      if (card.dataset.wordhuntEnhanced === "1") return;
      card.dataset.wordhuntEnhanced = "1";

      const activityId = card.dataset.g;
      const board = card.querySelector(".game-board");
      const originalBank = card.querySelector(".word-bank");
      if (!board || !originalBank) return;

      const targetWords = (EVALS[activityId]?.correct || [])
        .map((word) => String(word || "").toUpperCase())
        .filter(Boolean);

      const rows = Math.max(7, targetWords.length + 3);
      const cols = Math.max(8, ...targetWords.map((word) => word.length + 1));
      const filler = "AEIOULNRSTMPCDG";
      const letters = Array.from({ length: rows * cols }, () => "");

      [...targetWords]
        .sort((a, b) => b.length - a.length)
        .forEach((word) => {
          placeWord(letters, rows, cols, word);
        });

      for (let index = 0; index < letters.length; index += 1) {
        if (!letters[index]) {
          letters[index] = filler[Math.floor(Math.random() * filler.length)];
        }
      }

      originalBank.style.display = "none";

      const widget = document.createElement("section");
      widget.className = "word-search-widget";
      widget.innerHTML = `
        <div class="exact-instructions">
          <div class="exact-title">Instrucciones exactas de esta actividad</div>
          <ol class="exact-list">
            <li>Observa las palabras objetivo que aparecen arriba.</li>
            <li>Busca las letras en distintas partes del tablero; no siempre estaran en la misma fila.</li>
            <li>Toca las letras en el orden correcto para formar una palabra completa.</li>
            <li>Cada vez que formes una palabra correcta, quedara marcada como encontrada.</li>
            <li>Debes encontrar exactamente ${targetWords.length} palabras.</li>
            <li>Cuando encuentres todas, baja al final y pulsa Verificar.</li>
          </ol>
        </div>
        <div class="word-search-top">
          <div class="instruction-chip">Toca letras para descubrir palabras secretas</div>
          <div class="word-search-goals">
            ${targetWords
              .map(
                (word) => `
                  <div class="goal-chip" data-goal-word="${word}">
                    ${word}
                  </div>
                `
              )
              .join("")}
          </div>
        </div>
        <div class="word-search-grid">
          ${letters
            .map(
              (letter, index) => `
                <button class="letter-tile" type="button" data-letter-index="${index}" data-letter="${letter}">
                  ${letter}
                </button>
              `
            )
            .join("")}
        </div>
        <div class="word-search-preview">
          <div class="helper-main">Palabra actual</div>
          <div class="word-search-current" data-current-word>Selecciona letras para formar una palabra</div>
          <button class="real-ghost" type="button" data-clear-word>Limpiar seleccion</button>
        </div>
      `;

      board.appendChild(widget);

      const hiddenButtons = [...originalBank.querySelectorAll("[data-wp]")];
      const correctButtons = hiddenButtons.filter((button) =>
        targetWords.includes((button.dataset.wp || "").toUpperCase())
      );
      const wrongButtons = hiddenButtons.filter(
        (button) => !targetWords.includes((button.dataset.wp || "").toUpperCase())
      );

      const currentWord = widget.querySelector("[data-current-word]");
      const goalChips = [...widget.querySelectorAll("[data-goal-word]")];
      const letterTiles = [...widget.querySelectorAll("[data-letter-index]")];
      const pickedTiles = [];
      const foundWords = new Set();

      const syncHiddenSelection = () => {
        hiddenButtons.forEach((button) => button.classList.remove("selected"));
        correctButtons.forEach((button) => {
          if (foundWords.has((button.dataset.wp || "").toUpperCase())) {
            button.classList.add("selected");
          }
        });
      };

      const clearSelection = () => {
        pickedTiles.splice(0, pickedTiles.length);
        letterTiles.forEach((tile) => tile.classList.remove("selected"));
        if (currentWord) {
          currentWord.textContent = foundWords.size === targetWords.length
            ? "Todas las palabras encontradas"
            : "Selecciona letras para formar una palabra";
        }
      };

      const checkCurrentWord = () => {
        const assembled = pickedTiles.map((tile) => tile.dataset.letter).join("");
        if (currentWord) currentWord.textContent = assembled || "Selecciona letras para formar una palabra";
        if (!assembled) return;

        if (targetWords.includes(assembled) && !foundWords.has(assembled)) {
          foundWords.add(assembled);
          goalChips
            .filter((chip) => chip.dataset.goalWord === assembled)
            .forEach((chip) => chip.classList.add("found"));
          pickedTiles.forEach((tile) => {
            tile.classList.add("found");
            tile.classList.remove("selected");
          });
          syncHiddenSelection();
          pickedTiles.splice(0, pickedTiles.length);
          if (currentWord) currentWord.textContent = `Encontraste: ${assembled}`;
          return;
        }

        if (assembled.length >= cols) {
          widget.classList.add("word-search-wrong");
          setTimeout(() => widget.classList.remove("word-search-wrong"), 280);
          clearSelection();
        }
      };

      letterTiles.forEach((tile) => {
        tile.addEventListener("click", () => {
          if (tile.classList.contains("found")) return;
          if (tile.classList.contains("selected")) {
            tile.classList.remove("selected");
            const index = pickedTiles.indexOf(tile);
            if (index >= 0) pickedTiles.splice(index, 1);
            checkCurrentWord();
            return;
          }
          tile.classList.add("selected");
          pickedTiles.push(tile);
          checkCurrentWord();
        });
      });

      widget.querySelector("[data-clear-word]")?.addEventListener("click", clearSelection);
      syncHiddenSelection();
    });
  };

  const restoreWelcomeHero = () => {
    const heroPanel = app.querySelector(".real-hero .progress-panel");
    if (!heroPanel || heroPanel.dataset.restored === "1") return;
    heroPanel.dataset.restored = "1";
    heroPanel.innerHTML = `
      <div class="helper-main">Materia</div>
      <h3 class="game-hero-title" style="margin:0;">LENGUA ESPANOLA</h3>
      <p class="muted-main" style="color:#eef5ff;">Aprender jugando, crear y descubrir con alegria.</p>
    `;
  };

  const prepareFillGames = () => {
    const cards = app.querySelectorAll('[data-k="dropfill"]');
    cards.forEach((card) => {
      if (card.dataset.fillEnhanced === "1") return;
      card.dataset.fillEnhanced = "1";

      const sentence = card.querySelector(".slot-sentence");
      const bank = card.querySelector(".word-bank");
      if (!sentence || !bank) return;

      sentence.classList.add("sentence-builder");
      bank.classList.add("fill-bank");

      const slots = [...card.querySelectorAll("[data-s]")];
      const words = [...card.querySelectorAll("[data-w]")];

      const updatePreview = () => {
        const completed = slots.every((slot) => slot.dataset.fill === "1");
        card.querySelectorAll(".slot").forEach((slot) => {
          if (slot.dataset.fill === "1") {
            slot.classList.add("slot-filled");
          } else {
            slot.classList.remove("slot-filled");
          }
        });
        const hint = card.querySelector("[data-fill-hint]");
        if (hint) {
          hint.textContent = completed
            ? "Frase completa. Ahora verifica tu respuesta."
            : "Arrastra o toca una palabra para completar los espacios.";
        }
      };

      const helper = document.createElement("div");
      helper.className = "fill-helper";
      helper.setAttribute("data-fill-hint", "1");
      helper.textContent = "Arrastra o toca una palabra para completar los espacios.";
      sentence.parentElement?.insertBefore(helper, sentence.nextSibling);

      const refillSlot = (slot) => {
        const previousWord = slot.dataset.v;
        if (!previousWord) return;
        const original = words.find((word) => word.dataset.w === previousWord && word.disabled);
        if (original) {
          original.disabled = false;
          original.classList.remove("used");
        } else {
          const clone = document.createElement("button");
          clone.type = "button";
          clone.className = "word-chip";
          clone.draggable = true;
          clone.dataset.w = previousWord;
          clone.textContent = previousWord;
          bank.appendChild(clone);
          wireWord(clone);
        }
        slot.textContent = "Arrastra aqui";
        slot.dataset.v = "";
        slot.dataset.fill = "0";
      };

      const placeWord = (slot, word) => {
        if (!slot || !word) return;
        if (slot.dataset.fill === "1") {
          refillSlot(slot);
        }
        slot.textContent = word.dataset.w || word.textContent || "";
        slot.dataset.v = word.dataset.w || word.textContent || "";
        slot.dataset.fill = "1";
        word.disabled = true;
        word.classList.add("used");
        updatePreview();
      };

      let draggedWord = null;

      const wireWord = (word) => {
        if (word.dataset.wired === "1") return;
        word.dataset.wired = "1";

        word.addEventListener("dragstart", () => {
          draggedWord = word;
          word.classList.add("dragging");
        });

        word.addEventListener("dragend", () => {
          word.classList.remove("dragging");
          draggedWord = null;
        });

        word.addEventListener("click", () => {
          const emptySlot = slots.find((slot) => slot.dataset.fill !== "1");
          if (emptySlot && !word.disabled) {
            placeWord(emptySlot, word);
          }
        });
      };

      words.forEach(wireWord);

      slots.forEach((slot) => {
        slot.classList.add("fill-slot");
        slot.addEventListener("dragover", (event) => {
          event.preventDefault();
          slot.classList.add("zone-active");
        });
        slot.addEventListener("dragleave", () => {
          slot.classList.remove("zone-active");
        });
        slot.addEventListener("drop", (event) => {
          event.preventDefault();
          slot.classList.remove("zone-active");
          if (draggedWord && !draggedWord.disabled) {
            placeWord(slot, draggedWord);
          }
        });
        slot.addEventListener("click", () => {
          if (slot.dataset.fill === "1") {
            refillSlot(slot);
            updatePreview();
          }
        });
      });

      updatePreview();
    });
  };

  const prepareOrderGames = () => {
    const cards = app.querySelectorAll('[data-k="order"],[data-k="timeline"]');
    cards.forEach((card) => {
      if (card.dataset.orderEnhanced === "1") return;
      card.dataset.orderEnhanced = "1";

      const list = card.querySelector(".drag-strip-list");
      if (!list) return;

      list.classList.add("order-track");

      const helper = document.createElement("section");
      helper.className = "order-helper";
      helper.innerHTML = `
        <div class="helper-main">Mision</div>
        <div class="order-helper-text">Arrastra las piezas para construir el orden correcto. Cada tarjeta representa una parte importante.</div>
      `;
      list.parentElement?.insertBefore(helper, list);

      const strips = [...list.querySelectorAll(".drag-strip")];
      strips.forEach((strip, index) => {
        strip.classList.add("story-card");
        strip.setAttribute("data-order-index", String(index));

        const badge = document.createElement("div");
        badge.className = "story-badge";
        badge.textContent = `Paso ${index + 1}`;
        strip.insertBefore(badge, strip.firstChild);
      });

      let dragged = null;

      strips.forEach((strip) => {
        strip.addEventListener("dragstart", () => {
          dragged = strip;
          strip.classList.add("dragging");
        });

        strip.addEventListener("dragend", () => {
          strip.classList.remove("dragging");
          dragged = null;
          [...list.children].forEach((child, idx) => {
            const badge = child.querySelector(".story-badge");
            const num = child.querySelector(".drag-num");
            if (badge) badge.textContent = `Paso ${idx + 1}`;
            if (num) num.textContent = `${idx + 1}`;
          });
        });

        strip.addEventListener("dragover", (event) => {
          event.preventDefault();
          strip.classList.add("zone-active");
        });

        strip.addEventListener("dragleave", () => {
          strip.classList.remove("zone-active");
        });

        strip.addEventListener("drop", (event) => {
          event.preventDefault();
          strip.classList.remove("zone-active");
          if (!dragged || dragged === strip) return;
          const children = [...list.children];
          const draggedIndex = children.indexOf(dragged);
          const dropIndex = children.indexOf(strip);
          if (draggedIndex < dropIndex) {
            list.insertBefore(dragged, strip.nextSibling);
          } else {
            list.insertBefore(dragged, strip);
          }
        });
      });
    });
  };

  const observer = new MutationObserver(() => {
    restoreWelcomeHero();
    hydrateLockedCards();
    prepareCompetencyButtons();
    prepareSideSummaries();
    prepareTeacherControls();
    prepareStudentControls();
    prepareGuides();
    prepareMissionPacks();
    prepareSimpleTargetGames();
    prepareCubeGames();
    preparePairGames();
    prepareFillMissionPacks();
    prepareFillPackInteractions();
    prepareClassifyGames();
    prepareMemoryGames();
    prepareCartaFinalGame();
    prepareRadioGame();
    prepareWordSearchGames();
    prepareFillGames();
    prepareOrderGames();
  });

  observer.observe(app, { childList: true, subtree: true });
  restoreWelcomeHero();
  hydrateLockedCards();
  prepareCompetencyButtons();
  prepareSideSummaries();
  prepareTeacherControls();
  prepareStudentControls();
  prepareGuides();
  prepareMissionPacks();
  prepareSimpleTargetGames();
  prepareCubeGames();
  preparePairGames();
  prepareFillMissionPacks();
  prepareFillPackInteractions();
  prepareClassifyGames();
  prepareMemoryGames();
  prepareCartaFinalGame();
  prepareRadioGame();
  prepareWordSearchGames();
  prepareFillGames();
  prepareOrderGames();
})();
