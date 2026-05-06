(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const STORAGE = {
    teachers: "yoyo_rg_t",
    students: "yoyo_rg_s",
    session: "yoyo_rg_x",
    ui: "yoyo_rg_u",
    progress: "yoyo_rg_p",
  };

  const ui = { role: "student", tab: "login", msg: null, cel: null };

  const TOPIC_DATA = {
    carta: {
      order: ["Fecha", "Saludo", "Agradecimiento", "Mensaje principal", "Despedida", "Firma"],
      fill: {
        segments: [
          { type: "text", value: "Querida maestra, hoy escribo para" },
          { type: "slot" },
          { type: "text", value: "tu paciencia, tu" },
          { type: "slot" },
          { type: "text", value: "y la forma en que logras" },
          { type: "slot" },
          { type: "text", value: "cada tema con mucha" },
          { type: "slot" },
          { type: "text", value: "y dedicacion." },
        ],
        answers: ["agradecerte", "apoyo", "ensenarme", "claridad"],
        extra: ["mezclar", "cocinar", "anunciar", "freir"],
      },
      classify: {
        groups: ["Partes de la carta", "No pertenece"],
        items: [
          { label: "Fecha", group: "Partes de la carta" },
          { label: "Saludo cordial", group: "Partes de la carta" },
          { label: "Mensaje de gratitud", group: "Partes de la carta" },
          { label: "Despedida afectuosa", group: "Partes de la carta" },
          { label: "Firma final", group: "Partes de la carta" },
          { label: "Nombre del destinatario", group: "Partes de la carta" },
          { label: "Ingredientes", group: "No pertenece" },
          { label: "Titular radial", group: "No pertenece" },
          { label: "Medidas de cocina", group: "No pertenece" },
          { label: "Opinion del lector", group: "No pertenece" },
        ],
      },
      memory: ["Saludo", "Firma", "Despedida", "Gratitud", "Destinatario", "Fecha", "Mensaje", "Afecto"],
      target: {
        correct: [
          "Gracias por explicarme con paciencia y por animarme a seguir aprendiendo.",
          "Escribir con afecto y respeto a quien ayudas.",
          "Recordar el saludo, el mensaje y la firma mejora la carta.",
        ],
        options: [
          "Gracias por explicarme con paciencia y por animarme a seguir aprendiendo.",
          "No quiero escribir esta carta.",
          "La receta lleva sal y agua.",
          "Habla mas duro por la radio.",
          "Olvidar el saludo y la firma.",
          "Escribir con afecto y respeto a quien ayudas.",
          "Recordar el saludo, el mensaje y la firma mejora la carta.",
          "Mezclar ingredientes dentro de la carta es correcto.",
        ],
      },
      cubes: { correct: ["SALUDO", "FIRMA", "GRATITUD", "DESPEDIDA", "MENSAJE", "FECHA"], extra: ["PLANETA", "RECETA", "MICROFONO", "SARTEN", "VOLCAN", "INGREDIENTES"] },
      match: {
        correct: ["RESPETO", "AFECTO", "CLARIDAD", "GRATITUD", "SALUDO", "FIRMA"],
        options: ["RESPETO", "AFECTO", "CLARIDAD", "GRATITUD", "SALUDO", "FIRMA", "RUIDO", "FUEGO", "AZUCAR", "RADIO", "SARTEN", "PLANETA"],
      },
      wordhunt: {
        answers: ["gratitud", "saludo", "firma", "mensaje", "despedida"],
        extra: ["sarten", "receta", "volcan", "radio", "pasillo"],
      },
      timeline: ["Pienso en la persona", "Escribo la fecha", "Redacto el saludo", "Agradezco con detalles", "Cierro con afecto", "Firmo la carta"],
      final: {
        correct: "Escribir una carta clara, respetuosa, afectuosa y bien organizada.",
        options: [
          "Escribir una carta clara, respetuosa, afectuosa y bien organizada.",
          "Mezclar ideas sin saludo ni despedida.",
          "Hablar por radio en lugar de escribir.",
          "Olvidar a quien va dirigida la carta.",
        ],
      },
    },
    receta: {
      order: ["Titulo", "Ingredientes", "Utensilios", "Paso 1", "Paso 2", "Servir"],
      fill: {
        segments: [
          { type: "text", value: "Antes de cocinar debo" },
          { type: "slot" },
          { type: "text", value: "las manos, luego" },
          { type: "slot" },
          { type: "text", value: "los ingredientes, despues" },
          { type: "slot" },
          { type: "text", value: "las cantidades y por ultimo" },
          { type: "slot" },
          { type: "text", value: "el plato con cuidado." },
        ],
        answers: ["lavar", "organizar", "medir", "servir"],
        extra: ["gritar", "correr", "olvidar", "romper"],
      },
      classify: {
        groups: ["Elementos de receta", "No pertenece"],
        items: [
          { label: "Ingredientes", group: "Elementos de receta" },
          { label: "Utensilios", group: "Elementos de receta" },
          { label: "Pasos numerados", group: "Elementos de receta" },
          { label: "Cantidad exacta", group: "Elementos de receta" },
          { label: "Tiempo de coccion", group: "Elementos de receta" },
          { label: "Higiene al cocinar", group: "Elementos de receta" },
          { label: "Firma personal", group: "No pertenece" },
          { label: "Opinion del lector", group: "No pertenece" },
          { label: "Despedida cordial", group: "No pertenece" },
          { label: "Anuncio por radio", group: "No pertenece" },
        ],
      },
      memory: ["Ingredientes", "Pasos", "Medidas", "Servir", "Higiene", "Utensilios", "Mezclar", "Cocinar"],
      target: {
        correct: [
          "Lavar las manos y seguir el orden de preparacion ayuda a cocinar con seguridad.",
          "Usar medidas y utensilios adecuados mejora la receta.",
          "Leer los pasos antes de cocinar evita errores en la preparacion.",
        ],
        options: [
          "Lavar las manos y seguir el orden de preparacion ayuda a cocinar con seguridad.",
          "Jugar con el fuego hace la receta mas divertida.",
          "Quitar todos los ingredientes para ahorrar tiempo.",
          "Mezclar sin leer ningun paso.",
          "Usar medidas y utensilios adecuados mejora la receta.",
          "Olvidar la higiene no afecta el resultado.",
          "Leer los pasos antes de cocinar evita errores en la preparacion.",
          "Servir primero y preparar despues es buena idea.",
        ],
      },
      cubes: { correct: ["PASOS", "MEZCLAR", "INGREDIENTES", "MEDIDAS", "UTENSILIOS", "SERVIR"], extra: ["FIRMA", "ANUNCIO", "DISCUSION", "MICROFONO", "SALUDO", "TITULAR"] },
      match: {
        correct: ["INGREDIENTES", "PASOS", "MEDIDAS", "UTENSILIOS", "HIGIENE", "SERVIR"],
        options: ["INGREDIENTES", "PASOS", "MEDIDAS", "UTENSILIOS", "HIGIENE", "SERVIR", "OPINION", "FIRMA", "RADIO", "SALUDO", "DESPEDIDA", "MICROFONO"],
      },
      wordhunt: {
        answers: ["ingredientes", "pasos", "medidas", "mezclar", "servir"],
        extra: ["poema", "firma", "comentario", "anuncio", "planeta"],
      },
      timeline: ["Busco utensilios", "Lavo las manos", "Organizo ingredientes", "Sigo los pasos", "Pruebo la mezcla", "Sirvo el plato"],
      final: {
        correct: "Seguir el orden, usar medidas y cuidar la higiene durante toda la receta.",
        options: [
          "Seguir el orden, usar medidas y cuidar la higiene durante toda la receta.",
          "Saltar pasos si parecen faciles.",
          "Olvidar los utensilios y las cantidades.",
          "Escribir una despedida en lugar de cocinar.",
        ],
      },
    },
    expositivo: {
      order: ["Titulo", "Subtitulo", "Idea principal", "Datos", "Explicacion", "Cierre"],
      fill: {
        segments: [
          { type: "text", value: "Un texto expositivo presenta" },
          { type: "slot" },
          { type: "text", value: "reales, usa" },
          { type: "slot" },
          { type: "text", value: "claras, organiza la" },
          { type: "slot" },
          { type: "text", value: "y busca" },
          { type: "slot" },
          { type: "text", value: "al lector sobre un tema." },
        ],
        answers: ["datos", "explicaciones", "informacion", "informar"],
        extra: ["despedirse", "cocinar", "gritar", "mezclar"],
      },
      classify: {
        groups: ["Dato", "Opinion"],
        items: [
          { label: "La Tierra gira alrededor del Sol", group: "Dato" },
          { label: "La Luna refleja luz solar", group: "Dato" },
          { label: "Los volcanes expulsan gases y lava", group: "Dato" },
          { label: "Los mamiferos alimentan a sus crias", group: "Dato" },
          { label: "El agua cambia de estado con la temperatura", group: "Dato" },
          { label: "La ciencia es aburrida", group: "Opinion" },
          { label: "Los planetas son tristes", group: "Opinion" },
          { label: "Investigar es feo", group: "Opinion" },
          { label: "Todos los datos son complicados", group: "Opinion" },
          { label: "Aprender ciencias da sueno", group: "Opinion" },
        ],
      },
      memory: ["Dato", "Subtitulo", "Titulo", "Explicacion", "Fuente", "Tema", "Resumen", "Informacion"],
      target: {
        correct: [
          "La Tierra gira alrededor del Sol y tarda un ano en completar la vuelta.",
          "Los datos cientificos ayudan a explicar un tema con claridad.",
          "Un texto expositivo informa usando hechos y explicaciones.",
        ],
        options: [
          "La Tierra gira alrededor del Sol y tarda un ano en completar la vuelta.",
          "El Sol esta feliz todos los dias.",
          "Los oceanos hablan en secreto.",
          "La Luna cocina por la noche.",
          "Los datos cientificos ayudan a explicar un tema con claridad.",
          "Un texto expositivo no necesita informacion real.",
          "Un texto expositivo informa usando hechos y explicaciones.",
          "Las opiniones sustituyen los datos en cualquier investigacion.",
        ],
      },
      cubes: { correct: ["DATOS", "SUBTITULO", "EXPLICAR", "FUENTE", "TEMA", "INFORMAR"], extra: ["FIRMA", "INGREDIENTE", "DESPEDIDA", "APLAUSO", "COCINAR", "SALUDO"] },
      match: {
        correct: ["DATOS", "SUBTITULO", "EXPLICAR", "INVESTIGAR", "TEMA", "FUENTE"],
        options: ["DATOS", "SUBTITULO", "EXPLICAR", "INVESTIGAR", "TEMA", "FUENTE", "SALTAR", "FREIR", "ABRAZO", "RADIO", "FIRMA", "INGREDIENTE"],
      },
      wordhunt: {
        answers: ["dato", "explicacion", "subtitulo", "tema", "fuente"],
        extra: ["firma", "azucar", "despedida", "comentario", "microfono"],
      },
      timeline: ["Busco informacion", "Selecciono datos confiables", "Organizo ideas", "Explico el tema", "Reviso claridad", "Comparto resultados"],
      final: {
        correct: "Explicar con claridad usando informacion real, ordenada y facil de comprender.",
        options: [
          "Explicar con claridad usando informacion real, ordenada y facil de comprender.",
          "Escribir solo opiniones sin datos.",
          "Inventar informacion para terminar rapido.",
          "Usar ingredientes en vez de datos.",
        ],
      },
    },
    comentario: {
      order: ["Tema", "Opinion", "Razon", "Ejemplo", "Cierre respetuoso", "Firma opcional"],
      fill: {
        segments: [
          { type: "text", value: "Mi comentario debe ser" },
          { type: "slot" },
          { type: "text", value: "tener buenas" },
          { type: "slot" },
          { type: "text", value: "usar un" },
          { type: "slot" },
          { type: "text", value: "adecuado y expresar" },
          { type: "slot" },
          { type: "text", value: "por las ideas de los demas." },
        ],
        answers: ["claro", "razones", "lenguaje", "respeto"],
        extra: ["ruido", "azucar", "miedo", "sarten"],
      },
      classify: {
        groups: ["Respetuoso", "Irrespetuoso"],
        items: [
          { label: "Entiendo tu idea, pero pienso distinto", group: "Respetuoso" },
          { label: "Buen punto, agregaria un ejemplo", group: "Respetuoso" },
          { label: "No comparto esa idea por esta razon", group: "Respetuoso" },
          { label: "Gracias por tu opinion, aqui va la mia", group: "Respetuoso" },
          { label: "Tu idea me hace pensar en otro ejemplo", group: "Respetuoso" },
          { label: "Eso es tonto", group: "Irrespetuoso" },
          { label: "Tu opinion no vale", group: "Irrespetuoso" },
          { label: "Callate, yo tengo razon", group: "Irrespetuoso" },
          { label: "Nadie quiere escuchar eso", group: "Irrespetuoso" },
          { label: "Estas mal y punto", group: "Irrespetuoso" },
        ],
      },
      memory: ["Opinion", "Razon", "Respeto", "Ejemplo", "Dialogo", "Argumento", "Postura", "Escucha"],
      target: {
        correct: [
          "Me gusto la historia porque el personaje resolvio el problema con respeto y creatividad.",
          "Estoy de acuerdo porque el personaje explico sus razones con respeto.",
          "Un buen comentario usa razones claras y cuida el lenguaje.",
        ],
        options: [
          "Me gusto la historia porque el personaje resolvio el problema con respeto y creatividad.",
          "No sirve y ya.",
          "Da igual todo lo que lei.",
          "Prefiero cocinar una receta.",
          "Estoy de acuerdo porque el personaje explico sus razones con respeto.",
          "Criticar sin argumentos siempre es mejor.",
          "Un buen comentario usa razones claras y cuida el lenguaje.",
          "Hablar con gritos mejora cualquier opinion.",
        ],
      },
      cubes: { correct: ["OPINION", "RAZON", "RESPETO", "EJEMPLO", "DIALOGO", "ARGUMENTO"], extra: ["SARTEN", "RADIO", "FIRMA", "PLANETA", "INGREDIENTE", "MICROFONO"] },
      match: {
        correct: ["OPINION", "RAZON", "RESPETO", "EJEMPLO", "DIALOGO", "ARGUMENTO"],
        options: ["OPINION", "RAZON", "RESPETO", "EJEMPLO", "DIALOGO", "ARGUMENTO", "GRITO", "FUEGO", "AZUCAR", "RECETA", "SARTEN", "MICROFONO"],
      },
      wordhunt: {
        answers: ["opinion", "argumento", "respeto", "ejemplo", "dialogo"],
        extra: ["ingrediente", "despedida", "subtitulo", "microfono", "volcan"],
      },
      timeline: ["Leo el texto", "Pienso mi postura", "Busco razones", "Agrego un ejemplo", "Reviso el respeto", "Comparto mi comentario"],
      final: {
        correct: "Opinar con respeto, razones claras y ejemplos que apoyen la idea.",
        options: [
          "Opinar con respeto, razones claras y ejemplos que apoyen la idea.",
          "Criticar sin explicar nada.",
          "Hablar sin escuchar a nadie.",
          "Escribir una receta en vez de comentar.",
        ],
      },
    },
    anuncio: {
      order: ["Apertura", "Mensaje principal", "Lugar", "Fecha y hora", "Invitacion", "Cierre"],
      fill: {
        segments: [
          { type: "text", value: "Un anuncio radial debe" },
          { type: "slot" },
          { type: "text", value: "con claridad, incluir" },
          { type: "slot" },
          { type: "text", value: "importantes, cuidar la" },
          { type: "slot" },
          { type: "text", value: "y lograr" },
          { type: "slot" },
          { type: "text", value: "al publico." },
        ],
        answers: ["informar", "datos", "voz", "motivar"],
        extra: ["ocultar", "silenciar", "mezclar", "despedida"],
      },
      classify: {
        groups: ["Parte del anuncio", "No pertenece"],
        items: [
          { label: "Invitacion final", group: "Parte del anuncio" },
          { label: "Datos del evento", group: "Parte del anuncio" },
          { label: "Mensaje principal", group: "Parte del anuncio" },
          { label: "Publico al que va dirigido", group: "Parte del anuncio" },
          { label: "Lugar de la actividad", group: "Parte del anuncio" },
          { label: "Hora del evento", group: "Parte del anuncio" },
          { label: "Ingredientes", group: "No pertenece" },
          { label: "Firma personal", group: "No pertenece" },
          { label: "Despedida de carta", group: "No pertenece" },
          { label: "Opinion del lector", group: "No pertenece" },
        ],
      },
      memory: ["Mensaje", "Voz", "Invitacion", "Cierre", "Horario", "Publico", "Lugar", "Ritmo"],
      target: {
        correct: [
          "Ven a la jornada de reciclaje este jueves a las 10 de la manana en el patio escolar.",
          "Te esperamos con entusiasmo para cuidar el ambiente juntos.",
          "Un buen anuncio dice que actividad se hara, cuando y donde.",
        ],
        options: [
          "Ven a la jornada de reciclaje este jueves a las 10 de la manana en el patio escolar.",
          "No vengas porque no importa.",
          "Olvide la hora y el lugar.",
          "Trae una sarten y una receta.",
          "Te esperamos con entusiasmo para cuidar el ambiente juntos.",
          "Un anuncio no necesita publico ni horario.",
          "Un buen anuncio dice que actividad se hara, cuando y donde.",
          "Hablar sin mensaje claro tambien informa bien.",
        ],
      },
      cubes: { correct: ["VOZ", "MENSAJE", "INVITACION", "HORARIO", "PUBLICO", "LUGAR"], extra: ["FIRMA", "RECETA", "POEMA", "INGREDIENTE", "DESPEDIDA", "OPINION"] },
      match: {
        correct: ["MENSAJE", "VOZ", "INVITACION", "PUBLICO", "HORARIO", "LUGAR"],
        options: ["MENSAJE", "VOZ", "INVITACION", "PUBLICO", "HORARIO", "LUGAR", "SAL", "FIRMA", "DESPEDIDA", "CUENTO", "INGREDIENTE", "OPINION"],
      },
      wordhunt: {
        answers: ["mensaje", "voz", "invitacion", "horario", "publico"],
        extra: ["despedida", "ingrediente", "subtitulo", "sarten", "opinion"],
      },
      timeline: ["Pienso el publico", "Escribo el mensaje", "Agrego lugar y hora", "Practico la voz", "Ensayo el ritmo", "Presento el anuncio"],
      final: {
        correct: "Comunicar con entusiasmo, datos claros y una invitacion que motive a participar.",
        options: [
          "Comunicar con entusiasmo, datos claros y una invitacion que motive a participar.",
          "Hablar sin objetivo ni publico.",
          "Olvidar la fecha y el lugar.",
          "Leer una carta en vez del anuncio.",
        ],
      },
    },
  };

  function cubeSet(config) {
    const colors = [
      "linear-gradient(135deg,#7b36eb,#a756f7)",
      "linear-gradient(135deg,#1f70ff,#49b5ff)",
      "linear-gradient(135deg,#ff9b54,#ffbe3d)",
      "linear-gradient(135deg,#33c48d,#7de2b8)",
      "linear-gradient(135deg,#ff758c,#ff9ab1)",
      "linear-gradient(135deg,#6a89cc,#b8c6ff)",
      "linear-gradient(135deg,#ffcc33,#ff8c42)",
      "linear-gradient(135deg,#4bc0c8,#7f7fd5)",
    ];
    return shuffle([
      ...config.correct.map((label, index) => ({ label, ok: true, color: colors[index % colors.length] })),
      ...config.extra.map((label, index) => ({ label, ok: false, color: colors[(index + 4) % colors.length] })),
    ]);
  }

  function buildTopic(id, icon, title, color) {
    const content = TOPIC_DATA[id];
    const finalTitles = {
      carta: "Cierre de la carta",
      receta: "Cierre de la receta",
      expositivo: "Conclusion expositiva",
      comentario: "Conclusion del comentario",
      anuncio: "Cierre del anuncio",
    };
    return {
      id,
      icon,
      title,
      color,
      summary: "Juegos visuales, amplios y con mas contenido para pensar y organizar ideas.",
      activities: [
        { id: `${id}-1`, topicId: id, number: 1, kind: "order", title: "Ordena la estructura", prompt: "Ordena todas las partes del temario desde el inicio hasta el cierre correcto.", competencies: ["C1", "C2"], items: shuffle(content.order), correct: content.order },
        { id: `${id}-2`, topicId: id, number: 2, kind: "dropfill", title: "Completa con arrastre", prompt: "Completa la frase larga usando todas las palabras correctas del banco.", competencies: ["C1"], segments: content.fill.segments, answers: content.fill.answers, extra: content.fill.extra },
        { id: `${id}-3`, topicId: id, number: 3, kind: "classify", title: "Clasifica por colores", prompt: "Clasifica varias tarjetas entre ideas correctas e ideas que no pertenecen al temario.", competencies: ["C2", "C3"], groups: content.classify.groups, items: shuffle(content.classify.items) },
        { id: `${id}-4`, topicId: id, number: 4, kind: "memory", title: "Memoria visual", prompt: "Encuentra todas las parejas relacionadas con este tema.", competencies: ["C1", "C2"], cards: shuffle([...content.memory, ...content.memory]) },
        { id: `${id}-5`, topicId: id, topicTitle: title, number: 5, kind: "target", title: "Apunta al blanco", prompt: `Mision: lee todas las tarjetas y selecciona varias opciones correctas. Debes marcar solo las ideas que si representan ${title}; las demas son distractores.`, competencies: ["C1", "C3"], options: shuffle(content.target.options), correct: [...content.target.correct].sort() },
        { id: `${id}-6`, topicId: id, topicTitle: title, number: 6, kind: "cubes", title: "Cubos 3D", prompt: `Lee todos los cubos y selecciona solo las palabras que si pertenecen a ${title}. No toques los cubos de otros temas.`, competencies: ["C1", "C2", "C3"], options: cubeSet(content.cubes), correct: content.cubes.correct },
        { id: `${id}-7`, topicId: id, topicTitle: title, number: 7, kind: "pair", title: "Relaciona ideas", prompt: `Mision: lee todas las tarjetas y selecciona varias ideas que si pertenecen al mismo grupo de ${title}. No marques las palabras distractoras.`, competencies: ["C1", "C2"], options: shuffle(content.match.options), correct: [...content.match.correct].sort() },
        { id: `${id}-8`, topicId: id, number: 8, kind: "wordhunt", title: "Sopa de palabras", prompt: "Marca todas las palabras secretas del tema entre varias palabras distractoras.", competencies: ["C1", "C2"], options: shuffle([...content.wordhunt.answers, ...content.wordhunt.extra]), correct: [...content.wordhunt.answers].sort() },
        { id: `${id}-9`, topicId: id, number: 9, kind: "timeline", title: "Linea del tiempo", prompt: "Arrastra los pasos y construye una secuencia completa de trabajo.", competencies: ["C2", "C3"], items: shuffle(content.timeline), correct: content.timeline },
        { id: `${id}-10`, topicId: id, number: 10, kind: "choice", title: finalTitles[id] || "Cierre final", prompt: "Escoge la mejor solucion final entre varias respuestas amplias.", competencies: ["C1", "C2", "C3"], options: shuffle(content.final.options), correct: content.final.correct },
      ],
    };
  }

  const TOPICS = [
    buildTopic("carta", "??", "La Carta de Agradecimiento", "linear-gradient(135deg,#ffd7a8,#ffb4c1)"),
    buildTopic("receta", "??", "La Receta", "linear-gradient(135deg,#b7f5d3,#7ad6ff)"),
    buildTopic("expositivo", "??", "El Texto Expositivo", "linear-gradient(135deg,#d6d4ff,#c5b0ff)"),
    buildTopic("comentario", "??", "El Comentario", "linear-gradient(135deg,#ffd0e7,#ffc36b)"),
    buildTopic("anuncio", "??", "El Anuncio Radial", "linear-gradient(135deg,#b8f6ff,#ffe08a)"),
  ];

  render();

  function render() {
    const session = read(STORAGE.session, null);
    if (!session) {
      renderWelcome();
      bindWelcome();
      return;
    }
    if (session.role === "teacher") {
      renderTeacher(session.id);
      bindTeacher();
      return;
    }
    renderStudent(session.id);
    bindStudent();
  }

  function renderWelcome() {
    app.innerHTML = `
      <section class="real-shell">
        <article class="real-card real-hero">
          <div class="real-brand">
            <div class="welcome-logo welcome-logo-large">
              <div class="welcome-string"></div>
              <div class="welcome-yoyo"><div class="welcome-yoyo-core"></div></div>
            </div>
            <div class="real-brand-copy">
              <p class="eyebrow-main">Plataforma educativa interactiva</p>
              <h1>YOYO</h1>
              <p class="real-tag">Aprendo Jugando</p>
              <p class="real-sub">Lengua Espanola</p>
            </div>
          </div>
        </article>
        <aside class="real-auth">
          <div class="welcome-center"><h2 class="welcome-question">Quien eres?</h2></div>
          <div class="real-toggle">
            <button class="real-btn ${ui.role === "student" ? "active" : ""}" data-role="student" type="button">Estudiante</button>
            <button class="real-btn ${ui.role === "teacher" ? "active" : ""}" data-role="teacher" type="button">Docente</button>
          </div>
          <div class="real-toggle">
            <button class="real-btn ${ui.tab === "login" ? "active" : ""}" data-tab="login" type="button">Iniciar sesion</button>
            <button class="real-btn ${ui.tab === "register" ? "active" : ""}" data-tab="register" type="button">Crear cuenta</button>
          </div>
          ${ui.tab === "register" ? teacherRegisterTemplate() : loginTemplate()}
          ${messageTemplate()}
        </aside>
      </section>
    `;
  }

  function teacherRegisterTemplate() {
    return `
      <form class="real-form" id="teacherRegister">
        <div class="real-msg success">Solo el docente crea cuenta.</div>
        <label class="real-field">Nombre completo<input name="name" required></label>
        <label class="real-field">Correo electronico<input name="email" type="email" required></label>
        <label class="real-field">Contrasena<input name="password" type="password" required></label>
        <label class="real-field">Codigo de la escuela<input name="school" required></label>
        <button class="real-action" type="submit">Registrarse</button>
      </form>
    `;
  }

  function loginTemplate() {
    if (ui.role === "teacher") {
      return `
        <form class="real-form" id="loginForm">
          <label class="real-field">Correo electronico<input name="identity" type="email" required></label>
          <label class="real-field">Contrasena<input name="password" type="password" required></label>
          <button class="real-action" type="submit">Entrar</button>
        </form>
      `;
    }
    return `
      <form class="real-form" id="loginForm">
        <label class="real-field">Nombre completo<input name="identity" required></label>
        <label class="real-field">Contrasena<input name="password" type="password" required></label>
        <label class="real-field">Codigo de clase<input name="classCode" required></label>
        <button class="real-action" type="submit">Entrar</button>
      </form>
    `;
  }

  function renderTeacher(teacherId) {
    const teacher = getTeachers().find((item) => item.id === teacherId);
    if (!teacher) {
      logout();
      return;
    }
    const roster = getStudents().filter((item) => item.teacherId === teacherId);
    app.innerHTML = `
      <section class="real-dashboard">
        <article class="real-panel">
          <div class="real-header">
            <div>
              <p class="helper-main">Panel del docente</p>
              <h2 class="title-main">Hola, ${escapeHtml(teacher.name)}</h2>
            </div>
            <button class="real-ghost" id="logoutBtn" type="button">Cerrar sesion</button>
          </div>
          <div class="real-pills">
            <span class="real-pill">Escuela: ${escapeHtml(teacher.school)}</span>
            <span class="real-chip">Clase: ${escapeHtml(teacher.code)}</span>
          </div>
          <div class="real-code">
            <div>
              <div class="helper-main">Codigo unico de clase</div>
              <strong id="activeCode">${teacher.code}</strong>
            </div>
            <button class="real-action" id="copyCodeBtn" type="button">Copiar codigo</button>
          </div>
          ${messageTemplate()}
        </article>
        <aside class="real-side">
          <h3 class="list-title-main">Mis estudiantes</h3>
          ${roster.length ? `<div class="roster">${roster.map((student) => {
            const summary = summarize(student.id);
            return `<article class="roster-item"><div><strong>${escapeHtml(student.name)}</strong><div class="student-email">Vinculado correctamente</div></div><span class="real-chip">${summary.total} pts</span></article>`;
          }).join("")}</div>` : `<div class="empty-main">Todavia no hay estudiantes unidos.</div>`}
        </aside>
      </section>
    `;
  }

  function renderStudent(studentId) {
    const student = getStudents().find((item) => item.id === studentId);
    if (!student) {
      logout();
      return;
    }
    const teacher = getTeachers().find((item) => item.id === student.teacherId);
    const state = getUiState(studentId);
    const summary = summarize(studentId);
    const percentage = Math.min(100, Math.round((summary.completed / 50) * 100));

    app.innerHTML = `
      <section class="real-student">
        <article class="real-panel">
          <div class="real-header">
            <div>
              <p class="helper-main">Panel del estudiante</p>
              <h2 class="title-main">Hola, ${escapeHtml(student.name)}</h2>
            </div>
            <div class="real-meta">
              <button class="real-ghost" id="backBtn" type="button">Atras</button>
              <button class="real-ghost" id="logoutBtn" type="button">Cerrar sesion</button>
            </div>
          </div>
          <div class="real-pills">
            <span class="real-chip">${teacher ? `Clase de ${escapeHtml(teacher.name)}` : "Clase activa"}</span>
            <span class="real-pill">C1</span>
            <span class="real-pill">C2</span>
            <span class="real-pill">C3</span>
          </div>
          <section class="progress-panel">
            <div class="helper-main">Aventura activa</div>
            <h3 class="game-hero-title" style="margin:0;">${motivation(summary.total)}</h3>
            <div class="real-meta"><span class="status-badge">Puntos: ${summary.total}</span><span class="status-badge">Completados: ${summary.completed}/50</span></div>
            <div class="progress-bar"><div style="width:${percentage}%"></div></div>
          </section>
          ${ui.cel ? celebrationTemplate() : ""}
          ${!state.topic ? topicsTemplate(studentId) : !state.activity ? activitiesTemplate(studentId, state.topic) : gameTemplate(studentId, state.topic, state.activity)}
        </article>
        <aside class="real-side">
          <h3 class="list-title-main">Clase vinculada</h3>
          <div class="empty-main">Codigo activo: <strong>${escapeHtml(student.code)}</strong></div>
          <div class="real-meta" style="margin-top:12px;"><span class="real-chip">C1: ${summary.competencies.C1}</span><span class="real-chip">C2: ${summary.competencies.C2}</span><span class="real-chip">C3: ${summary.competencies.C3}</span></div>
        </aside>
      </section>
    `;
  }

  function topicsTemplate(studentId) {
    const summary = summarize(studentId);
    return `<div class="topic-grid">${TOPICS.map((topic) => {
      const topicStats = summary.byTopic[topic.id] || { done: 0, score: 0 };
      return `<button class="topic-box" data-open-topic="${topic.id}" style="background:${topic.color}" type="button"><div class="student-topic-icon">${topic.icon}</div><h3>${topic.title}</h3><p>${topic.summary}</p><div class="real-meta"><span class="real-chip">10 actividades</span><span class="real-chip">${topicStats.done}/10</span><span class="real-chip">${topicStats.score} pts</span></div></button>`;
    }).join("")}</div>`;
  }

  function activitiesTemplate(studentId, topicId) {
    const topic = TOPICS.find((item) => item.id === topicId);
    const progress = (read(STORAGE.progress, {})[studentId] || {});
    return `<section class="topic-stage"><div class="real-header"><div><p class="helper-main">Temario</p><h3 class="topic-stage-title">${topic.title}</h3><p class="muted-main">Elige una actividad. Cada juego ahora tiene mas piezas, mas tarjetas y mas contenido para pensar.</p></div><button class="real-ghost" data-back-topics="1" type="button">Volver a los temarios</button></div><div class="activity-grid">${topic.activities.map((activity) => {
      const result = progress[activity.id];
      return `<button class="activity-box" data-open-activity="${activity.id}" type="button"><h4>${activity.number}. ${activity.title}</h4><p>${activity.prompt}</p><div class="real-meta">${activity.competencies.map((item) => `<span class="real-chip">${item}</span>`).join("")}<span class="real-pill">${result?.ok ? "Completado" : "Jugar"}</span></div></button>`;
    }).join("")}</div></section>`;
  }

  function gameTemplate(studentId, topicId, activityId) {
    const topic = TOPICS.find((item) => item.id === topicId);
    const activity = topic.activities.find((item) => item.id === activityId);
    const result = (read(STORAGE.progress, {})[studentId] || {})[activityId];
    return `<section class="single-stage"><article class="play-card" data-g="${activity.id}" data-k="${activity.kind}"><div class="play-top"><div><div class="instruction-chip">${topic.title}</div><h3>${activity.number}. ${activity.title}</h3><p class="muted-main">${activity.prompt}</p></div><div class="real-meta"><button class="real-ghost" data-back-activities="1" type="button">Volver al temario</button><span class="status-badge">+10 pts</span></div></div>${boardTemplate(activity)}<div class="action-row"><button class="real-action" data-verify="${activity.id}" type="button">Verificar</button><span class="status-badge">${result?.ok ? "Correcto" : result ? "Intentalo otra vez" : "Pendiente"}</span></div>${result ? `<div class="celebrate ${result.ok ? "success" : "error"}"><div class="confetti"><span>?</span><span>?</span><span>?</span></div><div><strong>${result.ok ? randomTitle() : "Sigue asi!"}</strong><div>${result.msg}</div></div></div>` : ""}</article></section>`;
  }

  function boardTemplate(activity) {
    if (activity.kind === "order" || activity.kind === "timeline") {
      return `<div class="game-board"><div class="instruction-chip">Arrastra y organiza las tarjetas</div><div class="drag-strip-list" data-drag-board="1">${activity.items.map((item, index) => `<div class="drag-strip" draggable="true" data-drag-value="${escapeAttribute(item)}"><span class="drag-num">${index + 1}</span><span>${item}</span></div>`).join("")}</div></div>`;
    }
    if (activity.kind === "dropfill") {
      return `<div class="game-board"><div class="instruction-chip">Arrastra palabras a los espacios</div><div class="slot-sentence">${activity.segments.map((segment, index) => segment.type === "text" ? `<span>${segment.value}</span>` : `<div class="slot" data-slot="${index}">Arrastra aqui</div>`).join("")}</div><div class="word-bank">${shuffle([...activity.answers, ...activity.extra]).map((word) => `<button class="word-chip" draggable="true" data-word="${escapeAttribute(word)}" type="button">${word}</button>`).join("")}</div></div>`;
    }
    if (activity.kind === "classify") {
      const zoneColors = [
        { tone: "#8b5cf6", soft: "linear-gradient(180deg,#f3e8ff,#ede9fe)" },
        { tone: "#22c55e", soft: "linear-gradient(180deg,#ecfdf5,#dcfce7)" },
        { tone: "#f59e0b", soft: "linear-gradient(180deg,#fff7ed,#ffedd5)" },
        { tone: "#ec4899", soft: "linear-gradient(180deg,#fdf2f8,#fce7f3)" },
      ];
      return `<div class="game-board"><div class="instruction-chip">Arrastra cada tarjeta a la caja de color correcta. Lee el titulo de cada caja antes de soltarla.</div><div class="classify-zones">${activity.groups.map((group, index) => `<div class="zone" data-zone="${escapeAttribute(group)}" style="--zone-tone:${zoneColors[index % zoneColors.length].tone};--zone-soft:${zoneColors[index % zoneColors.length].soft};"><h4>${group}</h4><div class="zone-items"></div></div>`).join("")}</div><div class="word-bank classify-bank">${activity.items.map((item) => `<div class="zone-token" draggable="true" data-token="${escapeAttribute(item.label)}" data-group="${escapeAttribute(item.group)}">${item.label}</div>`).join("")}</div></div>`;
    }
    if (activity.kind === "memory") {
      return `<div class="game-board"><div class="instruction-chip">Encuentra las parejas</div><div class="memory-grid">${activity.cards.map((card) => `<button class="memory-card hidden" data-memory="${escapeAttribute(card)}" type="button">?</button>`).join("")}</div></div>`;
    }
    if (activity.kind === "target" || activity.kind === "choice") {
      const chipText = activity.kind === "target"
        ? `Lee todas las tarjetas y marca varias opciones correctas sobre ${activity.topicTitle}. No selecciones los distractores.`
        : "Lee todas las opciones y toca la solucion final mas completa.";
      return `<div class="game-board"><div class="instruction-chip">${chipText}</div><div class="target-grid">${activity.options.map((option) => `<button class="${activity.kind === "choice" ? "choice-card" : "target-card"}" data-choice="${escapeAttribute(option)}" type="button">${option}</button>`).join("")}</div></div>`;
    }
    if (activity.kind === "cubes") {
      return `<div class="game-board"><div class="instruction-chip">Toca todos los cubos que pertenecen a ${activity.topicTitle}. Deja sin tocar los cubos de otros temas.</div><div class="cube-grid-real">${activity.options.map((option) => `<button class="cube-card" data-cube="${escapeAttribute(option.label)}" style="background:${option.color}" type="button">${option.label}</button>`).join("")}</div></div>`;
    }
    if (activity.kind === "pair") {
      return `<div class="game-board"><div class="instruction-chip">Selecciona varias tarjetas que si pertenecen al mismo grupo de ${activity.topicTitle}. Debes encontrar ${activity.correct.length} ideas correctas.</div><div class="choice-grid">${activity.options.map((option) => `<button class="match-card choice-card" data-pair="${escapeAttribute(option)}" type="button">${option}</button>`).join("")}</div></div>`;
    }
    if (activity.kind === "wordhunt") {
      return `<div class="game-board"><div class="instruction-chip">Marca solo las palabras secretas</div><div class="word-bank">${activity.options.map((option) => `<button class="word-chip" data-wordpick="${escapeAttribute(option)}" type="button">${option}</button>`).join("")}</div></div>`;
    }
    return `<div class="game-board"></div>`;
  }

  function bindWelcome() {
    all("[data-role]").forEach((button) => {
      button.onclick = () => {
        ui.role = button.dataset.role;
        if (ui.role === "student" && ui.tab === "register") ui.tab = "login";
        ui.msg = null;
        render();
      };
    });
    all("[data-tab]").forEach((button) => {
      button.onclick = () => {
        ui.tab = button.dataset.tab;
        if (ui.tab === "register") ui.role = "teacher";
        ui.msg = null;
        render();
      };
    });
    byId("teacherRegister")?.addEventListener("submit", registerTeacher);
    byId("loginForm")?.addEventListener("submit", login);
  }

  function bindTeacher() {
    byId("logoutBtn")?.addEventListener("click", logout);
    byId("copyCodeBtn")?.addEventListener("click", async () => {
      await copyText(byId("activeCode")?.textContent || "");
      ui.msg = { type: "success", text: "Codigo copiado correctamente." };
      render();
    });
  }

  function bindStudent() {
    const session = read(STORAGE.session, null);
    if (!session) return;
    const studentId = session.id;
    byId("logoutBtn")?.addEventListener("click", logout);
    byId("backBtn")?.addEventListener("click", () => {
      const state = getUiState(studentId);
      if (state.activity) setUiState(studentId, { activity: "" });
      else if (state.topic) setUiState(studentId, { topic: "", activity: "" });
      render();
    });
    all("[data-open-topic]").forEach((button) => button.onclick = () => { setUiState(studentId, { topic: button.dataset.openTopic, activity: "" }); render(); });
    all("[data-back-topics]").forEach((button) => button.onclick = () => { setUiState(studentId, { topic: "", activity: "" }); render(); });
    all("[data-open-activity]").forEach((button) => button.onclick = () => { setUiState(studentId, { activity: button.dataset.openActivity }); render(); });
    all("[data-back-activities]").forEach((button) => button.onclick = () => { setUiState(studentId, { activity: "" }); render(); });
    bindChoiceGames();
    bindMemoryGame();
    bindDragSort();
    bindDragWords();
    bindDragZones();
    all("[data-verify]").forEach((button) => {
      button.onclick = () => {
        const card = button.closest("[data-g]");
        const activity = findActivity(card.dataset.g);
        const ok = evaluateGame(card, activity);
        saveProgress(studentId, activity, ok);
        ui.cel = { type: ok ? "success" : "error", text: ok ? "Ganaste 10 puntos y una lluvia de estrellas." : "Sigue practicando. Este juego tiene mas piezas para pensar mejor." };
        render();
      };
    });
  }

  function bindChoiceGames() {
    all("[data-choice]").forEach((button) => {
      button.onclick = () => {
        if (button.classList.contains("target-card")) {
          button.classList.toggle("selected");
          return;
        }
        all("[data-choice]", button.parentElement).forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
      };
    });
    all("[data-cube],[data-wordpick],[data-pair]").forEach((button) => {
      button.onclick = () => button.classList.toggle("selected");
    });
  }

  function bindMemoryGame() {
    let first = null;
    all("[data-memory]").forEach((card) => {
      card.onclick = () => {
        if (card.classList.contains("matched")) return;
        card.classList.remove("hidden");
        card.classList.add("revealed");
        card.textContent = card.dataset.memory;
        if (!first) {
          first = card;
          return;
        }
        if (first === card) return;
        if (first.dataset.memory === card.dataset.memory) {
          first.classList.add("matched", "correct");
          card.classList.add("matched", "correct");
          first = null;
          return;
        }
        const previous = first;
        first = null;
        setTimeout(() => {
          [previous, card].forEach((item) => {
            item.classList.remove("revealed");
            item.classList.add("hidden", "wrong");
            item.textContent = "?";
            setTimeout(() => item.classList.remove("wrong"), 320);
          });
        }, 420);
      };
    });
  }

  function bindDragSort() {
    let dragged = null;
    all("[data-drag-value]").forEach((item) => {
      item.addEventListener("dragstart", () => {
        dragged = item;
        item.classList.add("dragging");
      });
      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        dragged = null;
      });
      item.addEventListener("dragover", (event) => event.preventDefault());
      item.addEventListener("drop", (event) => {
        event.preventDefault();
        if (!dragged || dragged === item) return;
        const parent = item.parentElement;
        const siblings = [...parent.children];
        const from = siblings.indexOf(dragged);
        const to = siblings.indexOf(item);
        if (from < to) parent.insertBefore(dragged, item.nextSibling);
        else parent.insertBefore(dragged, item);
      });
    });
  }

  function bindDragWords() {
    let dragged = null;
    all("[data-word]").forEach((chip) => {
      chip.addEventListener("dragstart", () => { dragged = chip; });
      chip.onclick = () => {
        const slot = all('.slot:not([data-filled="1"])')[0];
        if (slot) fillSlot(slot, chip);
      };
    });
    all("[data-slot]").forEach((slot) => {
      slot.addEventListener("dragover", (event) => event.preventDefault());
      slot.addEventListener("drop", (event) => {
        event.preventDefault();
        if (dragged) fillSlot(slot, dragged);
      });
    });
  }

  function fillSlot(slot, chip) {
    if (slot.dataset.filled === "1") return;
    slot.textContent = chip.dataset.word;
    slot.dataset.value = chip.dataset.word;
    slot.dataset.filled = "1";
    chip.classList.add("used");
    chip.disabled = true;
  }

  function bindDragZones() {
    let dragged = null;
    all("[data-token]").forEach((token) => token.addEventListener("dragstart", () => { dragged = token; }));
    all("[data-zone]").forEach((zone) => {
      zone.addEventListener("dragover", (event) => event.preventDefault());
      zone.addEventListener("drop", (event) => {
        event.preventDefault();
        if (!dragged) return;
        zone.querySelector(".zone-items").appendChild(dragged);
      });
    });
  }

  function evaluateGame(card, activity) {
    if (activity.kind === "order" || activity.kind === "timeline") {
      const current = all("[data-drag-value]", card).map((item) => item.dataset.dragValue);
      return isEqual(current, activity.correct);
    }
    if (activity.kind === "dropfill") {
      const current = activity.answers.map((_, index) => all(`[data-slot="${index * 2 + 1}"]`, card)[0]?.dataset.value || "");
      return isEqual(current, activity.answers);
    }
    if (activity.kind === "classify") {
      return activity.groups.every((group) => all(`[data-zone="${cssEscape(group)}"] [data-token]`, card).every((item) => item.dataset.group === group)) && all("[data-token]", card).length === activity.items.length;
    }
    if (activity.kind === "memory") return all("[data-memory]", card).every((item) => item.classList.contains("matched"));
    if (activity.kind === "target") {
      const current = all(".selected", card).map((item) => item.dataset.choice).sort();
      return isEqual(current, [...activity.correct].sort());
    }
    if (activity.kind === "choice") return all(".selected", card)[0]?.dataset.choice === activity.correct;
    if (activity.kind === "cubes") {
      const current = all("[data-cube].selected", card).map((item) => item.dataset.cube).sort();
      return isEqual(current, [...activity.correct].sort());
    }
    if (activity.kind === "pair") {
      const current = all("[data-pair].selected", card).map((item) => item.dataset.pair).sort();
      return isEqual(current, [...activity.correct].sort());
    }
    if (activity.kind === "wordhunt") {
      const current = all("[data-wordpick].selected", card).map((item) => item.dataset.wordpick).sort();
      return isEqual(current, [...activity.correct].sort());
    }
    return false;
  }

  function saveProgress(studentId, activity, ok) {
    const progress = read(STORAGE.progress, {});
    progress[studentId] = progress[studentId] || {};
    progress[studentId][activity.id] = {
      ok,
      score: ok ? 10 : 0,
      competencies: activity.competencies,
      msg: ok ? "Actividad completada correctamente." : "Todavia no esta correcta. Revisa con calma cada parte del juego.",
      topicId: activity.topicId,
    };
    localStorage.setItem(STORAGE.progress, JSON.stringify(progress));
  }

  function registerTeacher(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = value(form, "name");
    const email = value(form, "email").toLowerCase();
    const password = value(form, "password");
    const school = value(form, "school").toUpperCase();
    if (!name || !email || !password || !school) {
      ui.msg = { type: "error", text: "Completa todos los campos del docente." };
      render();
      return;
    }
    const teachers = getTeachers();
    if (teachers.some((item) => item.email === email)) {
      ui.msg = { type: "error", text: "Ya existe un docente con ese correo." };
      render();
      return;
    }
    teachers.push({ id: createId("teacher"), name, email, password, school, code: createClassCode(teachers) });
    localStorage.setItem(STORAGE.teachers, JSON.stringify(teachers));
    ui.role = "teacher";
    ui.tab = "login";
    ui.msg = { type: "success", text: "Cuenta creada correctamente. Ahora inicia sesion." };
    render();
  }

  function login(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const identity = value(form, "identity");
    const password = value(form, "password");
    if (ui.role === "teacher") {
      const teacher = getTeachers().find((item) => item.email === identity.toLowerCase() && item.password === password);
      if (!teacher) {
        ui.msg = { type: "error", text: "Credenciales incorrectas." };
        render();
        return;
      }
      setSession({ role: "teacher", id: teacher.id });
      ui.msg = null;
      render();
      return;
    }
    const classCode = value(form, "classCode").toUpperCase();
    const teacher = getTeachers().find((item) => item.code === classCode);
    if (!teacher) {
      ui.msg = { type: "error", text: "El codigo de clase no existe." };
      render();
      return;
    }
    const normalizedName = normalize(identity);
    const students = getStudents();
    let student = students.find((item) => item.teacherId === teacher.id && normalize(item.name) === normalizedName);
    if (!student) {
      student = { id: createId("student"), name: identity, password, teacherId: teacher.id, code: teacher.code };
      students.push(student);
    } else if (student.password !== password) {
      ui.msg = { type: "error", text: "La contrasena no coincide con la registrada para este estudiante." };
      render();
      return;
    }
    localStorage.setItem(STORAGE.students, JSON.stringify(students));
    setSession({ role: "student", id: student.id });
    ui.msg = null;
    render();
  }

  function summarize(studentId) {
    const progress = read(STORAGE.progress, {})[studentId] || {};
    const summary = { total: 0, completed: 0, competencies: { C1: 0, C2: 0, C3: 0 }, byTopic: {} };
    TOPICS.forEach((topic) => {
      summary.byTopic[topic.id] = { done: 0, score: 0 };
      topic.activities.forEach((activity) => {
        const saved = progress[activity.id];
        if (!saved) return;
        summary.total += saved.score;
        summary.byTopic[topic.id].score += saved.score;
        if (saved.ok) {
          summary.completed += 1;
          summary.byTopic[topic.id].done += 1;
          activity.competencies.forEach((competency) => {
            summary.competencies[competency] += Math.round(saved.score / activity.competencies.length);
          });
        }
      });
    });
    return summary;
  }

  function getUiState(studentId) {
    const allState = read(STORAGE.ui, {});
    return allState[studentId] || { topic: "", activity: "" };
  }

  function setUiState(studentId, nextState) {
    const allState = read(STORAGE.ui, {});
    allState[studentId] = { ...(allState[studentId] || {}), ...nextState };
    localStorage.setItem(STORAGE.ui, JSON.stringify(allState));
  }

  function findActivity(activityId) {
    return TOPICS.flatMap((topic) => topic.activities).find((activity) => activity.id === activityId);
  }

  function messageTemplate() {
    return ui.msg ? `<div class="real-msg ${ui.msg.type}">${ui.msg.text}</div>` : "";
  }

  function celebrationTemplate() {
    return `<div class="celebrate ${ui.cel.type}"><div class="confetti"><span>?</span><span>?</span><span>?</span></div><div><strong>${ui.cel.type === "success" ? randomTitle() : "Sigue asi!"}</strong><div>${ui.cel.text}</div></div></div>`;
  }

  function randomTitle() {
    const titles = ["Excelente!", "Genial!", "Eres un genio!", "Fantastico!"];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  function motivation(points) {
    if (points >= 300) return "Eres un genio!";
    if (points >= 150) return "Excelente! Sigue asi";
    if (points >= 50) return "Genial! Ya estas sumando estrellas";
    return "Comienza tu aventura de juegos";
  }

  function getTeachers() { return read(STORAGE.teachers, []); }
  function getStudents() { return read(STORAGE.students, []); }
  function setSession(value) { localStorage.setItem(STORAGE.session, JSON.stringify(value)); }

  function logout() {
    localStorage.removeItem(STORAGE.session);
    ui.msg = null;
    ui.cel = null;
    render();
  }

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function value(form, key) { return String(form.get(key) || "").trim(); }

  function normalize(text) {
    return String(text || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
  }

  function createId(prefix) { return `${prefix}-${Math.random().toString(36).slice(2, 10)}`; }

  function createClassCode(teachers) {
    let code = "";
    do {
      code = Array.from({ length: 3 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join("") + Math.floor(100 + Math.random() * 900);
    } while (teachers.some((item) => item.code === code));
    return code;
  }

  function escapeHtml(text) {
    return String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function escapeAttribute(text) { return escapeHtml(text); }
  async function copyText(text) { if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text); }
  function all(selector, root = document) { return [...root.querySelectorAll(selector)]; }
  function byId(id) { return document.getElementById(id); }
  function isEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  function shuffle(array) {
    const copy = [...array];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function cssEscape(text) {
    if (window.CSS?.escape) return window.CSS.escape(text);
    return String(text).replace(/"/g, '\\"');
  }
})();
