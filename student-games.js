(function () {
  const STORAGE_KEYS = {
    progress: "yoyo_games_progress_v1",
    ui: "yoyo_games_ui_v1",
  };

  const TOPIC_CONFIGS = [
    {
      id: "carta",
      title: "La Carta de Agradecimiento",
      icon: "💌",
      color: "linear-gradient(135deg,#ffdca8,#ffb6b9)",
      summary: "Expresa gratitud, organiza ideas y fortalece mensajes amables.",
      phrases: ["Gracias por ayudarme con la tarea.", "Te agradezco tu apoyo.", "Valoro mucho tu compania."],
      distractors: ["No me importa tu ayuda.", "Hazlo rapido.", "Estoy molesto contigo."],
      pairs: [["Saludo", "Querida maestra:"], ["Motivo", "Gracias por orientarme en clase."], ["Despedida", "Con carino,"], ["Firma", "Ana"]],
      classify: { groups: ["Pertenece a la carta", "No pertenece"], items: [["Fecha", 0], ["Ingredientes", 1], ["Firma", 0], ["Titular", 1]] },
      fill: { before: "Escribo esta carta para", answers: ["agradecerte", "tu ayuda"], after: " por todo lo que haces." },
      order: ["Fecha", "Saludo", "Mensaje de agradecimiento", "Despedida", "Firma"],
      keywords: ["gratitud", "saludo", "firma"],
      extras: ["respeto", "receta", "anuncio", "emocion"],
      timeline: ["Pienso en quien recibira la carta", "Escribo el saludo", "Explico mi agradecimiento", "Cierro con afecto"],
      target: { prompt: "Apunta a la frase mas amable", options: ["Gracias por tu paciencia.", "No quiero escribir.", "Hazlo tu."], correct: "Gracias por tu paciencia." },
    },
    {
      id: "receta",
      title: "La Receta",
      icon: "🍓",
      color: "linear-gradient(135deg,#b8f2d6,#70d6ff)",
      summary: "Ordena pasos, ingredientes y acciones para cocinar con claridad.",
      phrases: ["Primero lava las frutas.", "Mezcla los ingredientes con cuidado.", "Sirve en un plato limpio."],
      distractors: ["Corre sin mirar.", "Guarda el lapiz en la olla.", "Olvida los pasos."],
      pairs: [["Titulo", "Batido de fresas"], ["Ingredientes", "Leche y fresas"], ["Paso", "Licua durante un minuto"], ["Cierre", "Sirve frio"]],
      classify: { groups: ["Pertenece a la receta", "No pertenece"], items: [["Ingredientes", 0], ["Opinion", 1], ["Paso", 0], ["Saludo", 1]] },
      fill: { before: "Para la receta necesito", answers: ["lavar", "mezclar"], after: " los ingredientes con orden." },
      order: ["Reunir ingredientes", "Lavar", "Mezclar o cocinar", "Servir", "Limpiar"],
      keywords: ["ingredientes", "pasos", "medidas"],
      extras: ["cuento", "firma", "poema", "debate"],
      timeline: ["Busco utensilios", "Organizo ingredientes", "Sigo instrucciones", "Presento el plato"],
      target: { prompt: "Apunta a la accion correcta", options: ["Lavar las manos antes de cocinar.", "Jugar con el fuego.", "Mezclar cuadernos con frutas."], correct: "Lavar las manos antes de cocinar." },
    },
    {
      id: "expositivo",
      title: "El Texto Expositivo",
      icon: "📘",
      color: "linear-gradient(135deg,#c7ceff,#d6b8ff)",
      summary: "Investiga, explica y comunica informacion con orden y evidencia.",
      phrases: ["Un texto expositivo informa con datos.", "Las ideas se organizan por subtitulos.", "Las imagenes apoyan la comprension."],
      distractors: ["Solo sirve para rimar.", "No necesita informacion.", "Siempre termina con una despedida."],
      pairs: [["Titulo", "Los planetas del sistema solar"], ["Subtitulo", "Caracteristicas principales"], ["Dato", "La Tierra gira alrededor del Sol"], ["Imagen", "Apoya la informacion"]],
      classify: { groups: ["Dato", "Opinion"], items: [["El agua hierve a 100 grados", 0], ["Las plantas son hermosas", 1], ["La Luna no emite luz propia", 0], ["La ciencia es aburrida", 1]] },
      fill: { before: "Un texto expositivo presenta", answers: ["datos", "explicaciones"], after: " para informar con claridad." },
      order: ["Elegir tema", "Investigar", "Organizar ideas", "Escribir datos", "Revisar"],
      keywords: ["dato", "explicacion", "subtitulo"],
      extras: ["firma", "ingrediente", "despedida", "rima"],
      timeline: ["Leo fuentes confiables", "Selecciono datos", "Redacto explicaciones", "Comparto resultados"],
      target: { prompt: "Apunta al dato comprobable", options: ["La Tierra gira alrededor del Sol.", "Las estrellas son tristes.", "El cielo siempre piensa."], correct: "La Tierra gira alrededor del Sol." },
    },
    {
      id: "comentario",
      title: "El Comentario",
      icon: "💬",
      color: "linear-gradient(135deg,#ffd0e8,#ffc36b)",
      summary: "Opina con respeto, justifica ideas y dialoga con sentido critico.",
      phrases: ["Opino que el cuento es interesante porque deja una ensenanza.", "Estoy de acuerdo y explico mi razon.", "Respeto la idea de mis companeros."],
      distractors: ["Tu idea no sirve.", "No pienso explicar nada.", "Me burlo del autor."],
      pairs: [["Opinion", "Me gusto el final"], ["Razon", "Porque el personaje cambio"], ["Respeto", "Escucho a los demas"], ["Cierre", "Recomiendo leerlo"]],
      classify: { groups: ["Comentario respetuoso", "Comentario irrespetuoso"], items: [["Entiendo tu idea, pero pienso distinto", 0], ["Tu opinion no vale", 1], ["Buen punto, agregaria un ejemplo", 0], ["Eso es tonto", 1]] },
      fill: { before: "Mi comentario debe ser", answers: ["claro", "respetuoso"], after: " para dialogar mejor." },
      order: ["Presento mi opinion", "Explico mis razones", "Aporto ejemplo", "Cierro con respeto"],
      keywords: ["opinion", "argumento", "respeto"],
      extras: ["ingrediente", "firma", "fecha", "titulo"],
      timeline: ["Leo el texto", "Pienso mi postura", "Escribo razones", "Comparto respetuosamente"],
      target: { prompt: "Apunta al mejor comentario", options: ["No sirve.", "Me gusto porque el personaje resolvio el problema con respeto.", "Da igual todo."], correct: "Me gusto porque el personaje resolvio el problema con respeto." },
    },
    {
      id: "anuncio",
      title: "El Anuncio Radial",
      icon: "📻",
      color: "linear-gradient(135deg,#b8f7ff,#ffd36e)",
      summary: "Crea mensajes llamativos, claros y utiles para la comunidad.",
      phrases: ["Atencion, este viernes tendremos feria escolar.", "Te invitamos a participar con alegria.", "Recuerda la hora y el lugar del evento."],
      distractors: ["No dire nada importante.", "Habla sin objetivo.", "Olvida invitar al publico."],
      pairs: [["Apertura", "Atencion comunidad escolar"], ["Mensaje", "Habra jornada de lectura"], ["Invitacion", "Te esperamos manana"], ["Cierre", "No faltes"]],
      classify: { groups: ["Pertenece al anuncio", "No pertenece"], items: [["Invitacion final", 0], ["Ingredientes", 1], ["Datos del evento", 0], ["Firma personal", 1]] },
      fill: { before: "Un anuncio radial debe", answers: ["informar", "motivar"], after: " al publico con claridad." },
      order: ["Llamar la atencion", "Decir el mensaje", "Dar datos importantes", "Invitar", "Cerrar"],
      keywords: ["mensaje", "voz", "invitacion"],
      extras: ["despedida de carta", "ingrediente", "subtitulo", "rima"],
      timeline: ["Pienso el publico", "Redacto el mensaje", "Practico la voz", "Presento el anuncio"],
      target: { prompt: "Apunta al mejor anuncio", options: ["Ven a la jornada de reciclaje este jueves a las 10.", "No vengas a la actividad.", "No recuerdo la hora."], correct: "Ven a la jornada de reciclaje este jueves a las 10." },
    },
  ];

  const COMPETENCY_TEXT = {
    C1: "Comunicativa",
    C2: "Pensamiento logico, creativo y critico",
    C3: "Ambiental, salud, etica y ciudadana",
  };

  const GAME_TEMPLATES = [
    { key: "choice", title: "Cartas de apuntar", competencies: ["C1"], builder: buildChoice },
    { key: "match", title: "Aparea y conecta", competencies: ["C1", "C2"], builder: buildMatch },
    { key: "classify", title: "Clasifica con color", competencies: ["C2", "C3"], builder: buildClassify },
    { key: "fill", title: "Llena el mensaje", competencies: ["C1"], builder: buildFill },
    { key: "order", title: "Ordena las partes", competencies: ["C2"], builder: buildOrder },
    { key: "multi", title: "Cubos de ideas", competencies: ["C1", "C2", "C3"], builder: buildMulti },
    { key: "timeline", title: "Linea del tiempo", competencies: ["C2", "C3"], builder: buildTimeline },
    { key: "target", title: "Apunta correcto", competencies: ["C1", "C3"], builder: buildTarget },
    { key: "wordhunt", title: "Sopa de palabras", competencies: ["C1", "C2"], builder: buildWordHunt },
    { key: "creative", title: "Reto creativo 3D", competencies: ["C1", "C2", "C3"], builder: buildCreative },
  ];

  const TOPICS = TOPIC_CONFIGS.map((config) => ({
    ...config,
    activities: GAME_TEMPLATES.map((template, index) => template.builder(config, template, index + 1)),
  }));

  window.YoyoGames = {
    renderStudentExperience,
    bindStudentInteractions,
    getStudentStatus,
  };

  function renderStudentExperience(student) {
    const activeTopicId = getUiState(student.id).activeTopicId;
    if (!activeTopicId) {
      return renderTopicGrid(student);
    }
    const topic = TOPICS.find((item) => item.id === activeTopicId) || TOPICS[0];
    return renderTopicStage(student, topic);
  }

  function renderTopicGrid(student) {
    const summary = getStudentStatus(student.id);
    return `
      <div class="student-topic-grid">
        ${TOPICS.map((topic) => {
          const topicProgress = summary.byTopic[topic.id] || { done: 0, score: 0 };
          return `
            <button class="student-topic-card" data-topic-open="${topic.id}" type="button" style="background:${topic.color}">
              <span class="student-topic-icon">${topic.icon}</span>
              <h3>${topic.title}</h3>
              <p>${topic.summary}</p>
              <div class="student-topic-meta">
                <span class="student-topic-chip">${topic.activities.length} juegos</span>
                <span class="student-topic-chip">${topicProgress.done}/10 completados</span>
                <span class="student-topic-chip">${topicProgress.score} pts</span>
              </div>
            </button>
          `;
        }).join("")}
      </div>
      <section class="summary-card">
        <h4>Progreso general</h4>
        <div class="competency-chips">
          <span class="competency-chip">C1: ${summary.competencies.C1} pts</span>
          <span class="competency-chip">C2: ${summary.competencies.C2} pts</span>
          <span class="competency-chip">C3: ${summary.competencies.C3} pts</span>
          <span class="competency-chip">Total: ${summary.totalScore} pts</span>
        </div>
      </section>
    `;
  }

  function renderTopicStage(student, topic) {
    const progress = getProgress();
    const studentProgress = progress[student.id] || {};
    return `
      <section class="topic-stage">
        <div class="topic-stage-header">
          <div>
            <p class="helper-main">Temario activo</p>
            <h3 class="topic-stage-title">${topic.title}</h3>
            <p class="muted-main">${topic.summary}</p>
          </div>
          <button class="back-topic-button" data-topic-back="true" type="button">Volver a los 5 temarios</button>
        </div>
        <div class="topic-stage-grid">
          ${topic.activities.map((activity) => renderActivityCard(student.id, topic, activity, studentProgress[activity.id])).join("")}
        </div>
      </section>
    `;
  }

  function renderActivityCard(studentId, topic, activity, result) {
    return `
      <article class="game-card" data-activity-id="${activity.id}" data-topic-id="${topic.id}" data-game-type="${activity.type}">
        <div class="game-card-head">
          <div>
            <h4>${activity.index}. ${activity.title}</h4>
            <p>${activity.prompt}</p>
          </div>
          <span class="game-points">10 pts</span>
        </div>
        <div class="competency-chips">
          ${activity.competencies.map((code) => `<span class="competency-chip">${code}</span>`).join("")}
        </div>
        ${renderGameContent(activity)}
        <div class="game-actions">
          <button class="verify-button" data-game-check="${activity.id}" type="button">Verificar al instante</button>
          <div class="game-card-footer">
            <span class="game-status-chip">${result?.correct ? "Correcto" : result ? "Reintentar" : "Pendiente"}</span>
          </div>
        </div>
        ${result ? `<div class="feedback-box ${result.correct ? "success" : "error"}">${result.message}</div>` : ""}
      </article>
    `;
  }

  function renderGameContent(activity) {
    if (activity.type === "choice" || activity.type === "target") {
      return `<div class="option-list">${activity.options.map((option, index) => `<button class="option-button" data-choice-index="${index}" type="button">${option}</button>`).join("")}</div>`;
    }
    if (activity.type === "multi" || activity.type === "wordhunt" || activity.type === "creative") {
      const className = activity.type === "creative" ? "cube-grid" : "option-list";
      const itemClass = activity.type === "creative" ? "cube-button" : "option-button";
      return `<div class="${className}">${activity.options.map((option, index) => `<button class="${itemClass}" data-multi-index="${index}" type="button"${option.color ? ` style="background:${option.color}"` : ""}>${option.label || option}</button>`).join("")}</div>`;
    }
    if (activity.type === "fill") {
      return `
        <div class="fill-list">
          <div class="fill-inline">
            <span>${activity.parts[0]}</span>
            <input class="fill-input" data-fill-index="0" type="text">
            <span>${activity.parts[1]}</span>
            <input class="fill-input" data-fill-index="1" type="text">
            <span>${activity.parts[2]}</span>
          </div>
        </div>
      `;
    }
    if (activity.type === "match") {
      return `<div class="pair-list">${activity.left.map((label, index) => `<label class="pair-row">${label}<select data-match-index="${index}"><option value="">Selecciona</option>${activity.right.map((option) => `<option value="${option}">${option}</option>`).join("")}</select></label>`).join("")}</div>`;
    }
    if (activity.type === "classify") {
      return `<div class="classify-list">${activity.items.map((item, index) => `<label class="classify-row">${item.label}<select data-classify-index="${index}"><option value="">Clasifica</option>${activity.groups.map((group) => `<option value="${group}">${group}</option>`).join("")}</select></label>`).join("")}</div>`;
    }
    if (activity.type === "order" || activity.type === "timeline") {
      return `<div class="${activity.type === "order" ? "order-list" : "timeline-list"}">${activity.items.map((item, index) => `<label class="${activity.type === "order" ? "order-row" : "timeline-row"}">${item}<select data-order-index="${index}"><option value="">Posicion</option>${activity.items.map((_, orderIndex) => `<option value="${orderIndex + 1}">${orderIndex + 1}</option>`).join("")}</select></label>`).join("")}</div>`;
    }
    return "";
  }

  function bindStudentInteractions(studentId, rerender) {
    document.querySelectorAll("[data-topic-open]").forEach((button) => {
      button.addEventListener("click", () => {
        setUiState(studentId, { activeTopicId: button.dataset.topicOpen });
        rerender();
      });
    });
    document.querySelectorAll("[data-topic-back]").forEach((button) => {
      button.addEventListener("click", () => {
        setUiState(studentId, { activeTopicId: "" });
        rerender();
      });
    });
    document.querySelectorAll("[data-choice-index]").forEach((button) => {
      button.addEventListener("click", () => {
        const siblings = button.parentElement.querySelectorAll("[data-choice-index]");
        siblings.forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
      });
    });
    document.querySelectorAll("[data-multi-index]").forEach((button) => {
      button.addEventListener("click", () => {
        button.classList.toggle("selected");
      });
    });
    document.querySelectorAll("[data-game-check]").forEach((button) => {
      button.addEventListener("click", () => {
        const card = button.closest("[data-activity-id]");
        if (!card) return;
        const topic = TOPICS.find((item) => item.id === card.dataset.topicId);
        const activity = topic?.activities.find((item) => item.id === card.dataset.activityId);
        if (!activity) return;
        const evaluation = evaluateActivity(card, activity);
        saveResult(studentId, topic.id, activity, evaluation);
        rerender();
      });
    });
  }

  function evaluateActivity(card, activity) {
    if (activity.type === "choice" || activity.type === "target") {
      const selected = card.querySelector(".option-button.selected");
      const value = selected ? selected.textContent.trim() : "";
      return finish(value === activity.correct, activity.feedback);
    }
    if (activity.type === "multi" || activity.type === "wordhunt" || activity.type === "creative") {
      const values = [...card.querySelectorAll("[data-multi-index].selected")].map((item) => item.textContent.trim()).sort();
      const expected = [...activity.correct].sort();
      return finish(JSON.stringify(values) === JSON.stringify(expected), activity.feedback);
    }
    if (activity.type === "fill") {
      const values = activity.answers.map((_, index) => (card.querySelector(`[data-fill-index="${index}"]`)?.value || "").trim().toLowerCase());
      const expected = activity.answers.map((item) => item.toLowerCase());
      return finish(JSON.stringify(values) === JSON.stringify(expected), activity.feedback);
    }
    if (activity.type === "match") {
      const values = activity.left.map((_, index) => card.querySelector(`[data-match-index="${index}"]`)?.value || "");
      const expected = activity.matches;
      return finish(JSON.stringify(values) === JSON.stringify(expected), activity.feedback);
    }
    if (activity.type === "classify") {
      const values = activity.items.map((_, index) => card.querySelector(`[data-classify-index="${index}"]`)?.value || "");
      const expected = activity.items.map((item) => item.group);
      return finish(JSON.stringify(values) === JSON.stringify(expected), activity.feedback);
    }
    if (activity.type === "order" || activity.type === "timeline") {
      const selections = activity.items.map((_, index) => Number(card.querySelector(`[data-order-index="${index}"]`)?.value || 0));
      const expected = activity.items.map((_, index) => activity.correctOrder.indexOf(activity.items[index]) + 1);
      return finish(JSON.stringify(selections) === JSON.stringify(expected), activity.feedback);
    }
    return finish(false, activity.feedback);
  }

  function finish(correct, feedback) {
    return {
      correct,
      score: correct ? 10 : 0,
      message: correct ? `Excelente. ${feedback.success}` : `Aun no. ${feedback.error}`,
    };
  }

  function saveResult(studentId, topicId, activity, evaluation) {
    const progress = getProgress();
    progress[studentId] = progress[studentId] || {};
    progress[studentId][activity.id] = {
      topicId,
      score: evaluation.score,
      correct: evaluation.correct,
      competencies: activity.competencies,
      message: evaluation.message,
    };
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(progress));
  }

  function getStudentStatus(studentId) {
    const progress = getProgress()[studentId] || {};
    const summary = { totalScore: 0, competencies: { C1: 0, C2: 0, C3: 0 }, byTopic: {} };
    TOPICS.forEach((topic) => {
      summary.byTopic[topic.id] = { done: 0, score: 0 };
      topic.activities.forEach((activity) => {
        const record = progress[activity.id];
        if (!record) return;
        summary.byTopic[topic.id].done += record.correct ? 1 : 0;
        summary.byTopic[topic.id].score += record.score || 0;
        summary.totalScore += record.score || 0;
        activity.competencies.forEach((code) => {
          if (record.correct) {
            summary.competencies[code] += Math.round((record.score || 0) / activity.competencies.length);
          }
        });
      });
    });
    return summary;
  }

  function getProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.progress) || "{}");
    } catch (_error) {
      return {};
    }
  }

  function getUiState(studentId) {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.ui) || "{}");
      return raw[studentId] || { activeTopicId: "" };
    } catch (_error) {
      return { activeTopicId: "" };
    }
  }

  function setUiState(studentId, nextState) {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.ui) || "{}");
    raw[studentId] = { ...(raw[studentId] || {}), ...nextState };
    localStorage.setItem(STORAGE_KEYS.ui, JSON.stringify(raw));
  }

  function buildChoice(config, template, index) {
    return {
      id: `${config.id}-${template.key}`,
      index,
      type: "choice",
      title: template.title,
      prompt: `Selecciona la mejor frase para el temario ${config.title}.`,
      options: shuffle([config.phrases[0], ...config.distractors.slice(0, 2)]),
      correct: config.phrases[0],
      competencies: template.competencies,
      feedback: { success: "Demostraste comprension y uso adecuado del lenguaje.", error: "Revisa cual opcion comunica mejor la idea principal." },
    };
  }

  function buildMatch(config, template, index) {
    const shuffledRight = shuffle(config.pairs.map((pair) => pair[1]));
    return {
      id: `${config.id}-${template.key}`,
      index,
      type: "match",
      title: template.title,
      prompt: "Relaciona cada parte con su ejemplo correcto.",
      left: config.pairs.map((pair) => pair[0]),
      right: shuffledRight,
      matches: config.pairs.map((pair) => pair[1]),
      competencies: template.competencies,
      feedback: { success: "Relacionaste correctamente las partes del temario.", error: "Observa mejor la funcion de cada parte antes de unir." },
    };
  }

  function buildClassify(config, template, index) {
    return {
      id: `${config.id}-${template.key}`,
      index,
      type: "classify",
      title: template.title,
      prompt: "Clasifica cada tarjeta en la categoria adecuada.",
      groups: config.classify.groups,
      items: config.classify.items.map(([label, groupIndex]) => ({ label, group: config.classify.groups[groupIndex] })),
      competencies: template.competencies,
      feedback: { success: "Clasificaste con pensamiento critico y buen criterio.", error: "Hay tarjetas en la categoria incorrecta. Intenta otra vez." },
    };
  }

  function buildFill(config, template, index) {
    return {
      id: `${config.id}-${template.key}`,
      index,
      type: "fill",
      title: template.title,
      prompt: "Completa el texto con las palabras correctas.",
      parts: [config.fill.before, " y ", config.fill.after],
      answers: config.fill.answers,
      competencies: template.competencies,
      feedback: { success: "Completaste el mensaje con precision.", error: "Verifica vocabulario y sentido del texto." },
    };
  }

  function buildOrder(config, template, index) {
    return {
      id: `${config.id}-${template.key}`,
      index,
      type: "order",
      title: template.title,
      prompt: "Organiza la estructura en el orden correcto.",
      items: shuffle(config.order),
      correctOrder: config.order,
      competencies: template.competencies,
      feedback: { success: "Organizaste las partes con logica.", error: "Observa la secuencia correcta del temario." },
    };
  }

  function buildMulti(config, template, index) {
    return {
      id: `${config.id}-${template.key}`,
      index,
      type: "multi",
      title: template.title,
      prompt: "Selecciona los 3 cubos que si pertenecen al temario.",
      options: shuffle([...config.keywords, ...config.extras]),
      correct: config.keywords,
      competencies: template.competencies,
      feedback: { success: "Elegiste ideas clave del contenido.", error: "Algunos cubos no corresponden al temario." },
    };
  }

  function buildTimeline(config, template, index) {
    return {
      id: `${config.id}-${template.key}`,
      index,
      type: "timeline",
      title: template.title,
      prompt: "Ubica cada paso en la linea del tiempo.",
      items: shuffle(config.timeline),
      correctOrder: config.timeline,
      competencies: template.competencies,
      feedback: { success: "Seguiste la secuencia temporal correctamente.", error: "La linea del tiempo aun no esta bien ordenada." },
    };
  }

  function buildTarget(config, template, index) {
    return {
      id: `${config.id}-${template.key}`,
      index,
      type: "target",
      title: template.title,
      prompt: config.target.prompt,
      options: shuffle(config.target.options),
      correct: config.target.correct,
      competencies: template.competencies,
      feedback: { success: "Apuntaste a la mejor opcion.", error: "La opcion correcta comunica mejor el objetivo del temario." },
    };
  }

  function buildWordHunt(config, template, index) {
    return {
      id: `${config.id}-${template.key}`,
      index,
      type: "wordhunt",
      title: template.title,
      prompt: "Encuentra las 3 palabras escondidas relacionadas con el temario.",
      options: shuffle([...config.keywords, ...config.extras]).map((item) => ({ label: item })),
      correct: config.keywords,
      competencies: template.competencies,
      feedback: { success: "Encontraste las palabras clave.", error: "Vuelve a leer y busca solo conceptos del temario." },
    };
  }

  function buildCreative(config, template, index) {
    const cubeOptions = shuffle([
      ...config.keywords.map((item, idx) => ({ label: item.toUpperCase(), color: cubeColors[idx % cubeColors.length] })),
      ...config.extras.slice(0, 3).map((item, idx) => ({ label: item.toUpperCase(), color: cubeColors[(idx + 3) % cubeColors.length] })),
    ]);
    return {
      id: `${config.id}-${template.key}`,
      index,
      type: "creative",
      title: template.title,
      prompt: "Escoge los cubos 3D que ayudan a resolver este reto del temario.",
      options: cubeOptions,
      correct: config.keywords.map((item) => item.toUpperCase()),
      competencies: template.competencies,
      feedback: { success: "Superaste el reto creativo con pensamiento logico.", error: "Selecciona solo los cubos que representan ideas clave." },
    };
  }

  const cubeColors = [
    "linear-gradient(135deg,#7b36eb,#a756f7)",
    "linear-gradient(135deg,#1f70ff,#49b5ff)",
    "linear-gradient(135deg,#ff9b54,#ffbe3d)",
    "linear-gradient(135deg,#33c48d,#7de2b8)",
    "linear-gradient(135deg,#ff758c,#ff9ab1)",
    "linear-gradient(135deg,#6a89cc,#b8c6ff)",
  ];

  function shuffle(items) {
    const clone = [...items];
    for (let i = clone.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [clone[i], clone[j]] = [clone[j], clone[i]];
    }
    return clone;
  }
})();
