(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const KEYS = {
    session: "yoyo_rg_x",
    students: "yoyo_rg_s",
    progress: "yoyo_rg_p",
  };

  const TOPICS = {
    carta: "La Carta de Agradecimiento",
    receta: "La Receta",
    expositivo: "El Texto Expositivo",
    comentario: "El Comentario",
    anuncio: "El Anuncio Radial",
    oda: "La Oda",
  };

  const LABELS = {
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

  const COMPETENCIES = {
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

  const STICKERS = [
    { min: 400, name: "Corona de Lectura", emoji: "👑" },
    { min: 250, name: "Super Estrella", emoji: "🌟" },
    { min: 120, name: "Detective de Ideas", emoji: "🕵️" },
    { min: 60, name: "Explorador Creativo", emoji: "🚀" },
    { min: 10, name: "Semilla de Aprendizaje", emoji: "🌱" },
  ];

  const read = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const session = () => read(KEYS.session, null);
  const students = () => read(KEYS.students, []);
  const progressStore = () => read(KEYS.progress, {});

  const activityMeta = (activityId) => {
    const [topicId, rawNumber] = String(activityId).split("-");
    const number = Number(rawNumber || 0);
    const topic = TOPICS[topicId] || topicId;
    const title = LABELS[number] || activityId;
    const metaByNumber = {
      1: {
        intention: `Organizar las partes esenciales del tema ${topic} con secuencia logica.`,
        attends: "Secuenciacion, comprension global y construccion del orden textual.",
        learning: `El alumno aprende a reconocer como se estructura ${topic}.`,
        diversity: "Usa apoyo visual, manipulacion de tarjetas y lectura breve para estudiantes visuales y kinestesicos.",
        exercises: "Practicar ordenando tarjetas fisicas, recortables o secuencias ilustradas.",
        steps: ["Leer todas las piezas", "Identificar inicio, desarrollo y cierre", "Ordenar con logica", "Revisar el producto final"],
      },
      2: {
        intention: `Completar ideas claves del tema ${topic} usando vocabulario preciso.`,
        attends: "Comprension de contexto, cohesion y vocabulario funcional.",
        learning: `El alumno aprende a completar frases de ${topic} con palabras pertinentes.`,
        diversity: "Favorece el arrastre visual y la asociacion concreta palabra-contexto.",
        exercises: "Completar frases guiadas, usar banco de palabras con apoyo de color y pictogramas.",
        steps: ["Leer la frase completa", "Detectar lo que falta", "Comparar opciones", "Colocar la palabra correcta"],
      },
      3: {
        intention: `Clasificar informacion del tema ${topic} segun categorias correctas.`,
        attends: "Pensamiento logico, discriminacion de rasgos y analisis comparativo.",
        learning: `El alumno aprende a diferenciar lo que pertenece y no pertenece a ${topic}.`,
        diversity: "Permite trabajar con color, agrupaciones y movimiento para distintos estilos de aprendizaje.",
        exercises: "Clasificar tarjetas, usar cajas de colores y contrastar ejemplos y contraejemplos.",
        steps: ["Leer cada tarjeta", "Analizar su significado", "Llevarla a la categoria correcta", "Comprobar que no sobre ninguna"],
      },
      4: {
        intention: `Consolidar conceptos del tema ${topic} mediante memoria visual.`,
        attends: "Atencion sostenida, memoria de trabajo y asociacion visual.",
        learning: `El alumno refuerza palabras y conceptos frecuentes de ${topic}.`,
        diversity: "Apoya estudiantes que aprenden mejor con repeticion visual, ritmo propio y pistas espaciales.",
        exercises: "Tarjetas de memoria, parejas ilustradas y juegos de observacion breve.",
        steps: ["Observar las cartas", "Recordar ubicaciones", "Encontrar parejas", "Repetir la estrategia con las restantes"],
      },
      5: {
        intention: `Seleccionar la mejor respuesta comunicativa dentro del tema ${topic}.`,
        attends: "Toma de decisiones, juicio linguistico y lectura comprensiva.",
        learning: `El alumno aprende a identificar respuestas adecuadas en ${topic}.`,
        diversity: "Presenta opciones visibles y comparables para alumnos que requieren apoyos de eleccion guiada.",
        exercises: "Elegir entre opciones, justificar oralmente y contrastar respuestas adecuadas e inadecuadas.",
        steps: ["Leer todas las opciones", "Detectar la consigna", "Comparar cual cumple mejor", "Elegir solo una"],
      },
      6: {
        intention: `Identificar conceptos clave del tema ${topic} a traves de seleccion multiple.`,
        attends: "Discriminacion conceptual, atencion selectiva y relacion semantica.",
        learning: `El alumno reconoce las palabras esenciales de ${topic}.`,
        diversity: "Trabaja con color, ritmo y seleccion simple para fortalecer la concentracion.",
        exercises: "Subrayado de palabras clave, bingo de conceptos y cubos conceptuales.",
        steps: ["Leer cada cubo", "Descartar distractores", "Seleccionar los conceptos correctos", "Revisar el conjunto"],
      },
      7: {
        intention: `Relacionar ideas principales del tema ${topic} para construir sentido.`,
        attends: "Conexion de conceptos, razonamiento y pensamiento critico.",
        learning: `El alumno conecta ideas que forman parte de ${topic}.`,
        diversity: "Aporta retos segmentados y favorece conexiones visuales entre conceptos.",
        exercises: "Emparejar ideas, crear mapas simples y unir conceptos con lineas o colores.",
        steps: ["Leer el reto", "Buscar ideas compatibles", "Relacionar las correctas", "Comprobar la coherencia"],
      },
      8: {
        intention: `Reconocer vocabulario relevante del tema ${topic} en un contexto ludico.`,
        attends: "Conciencia visual de palabras, atencion y rastreo lexical.",
        learning: `El alumno amplía el vocabulario clave de ${topic}.`,
        diversity: "Permite diferentes ritmos, apoyo visual y exploracion autonoma del tablero.",
        exercises: "Sopas de letras, caza de palabras, lectura en voz alta y resaltado de vocabulario.",
        steps: ["Leer las palabras objetivo", "Buscar patrones visuales", "Seleccionar letras en orden", "Confirmar cada palabra encontrada"],
      },
      9: {
        intention: `Construir procesos del tema ${topic} mediante una linea temporal o secuencial.`,
        attends: "Secuenciacion, organizacion temporal y comprension de procesos.",
        learning: `El alumno aprende a ordenar el proceso de ${topic} paso a paso.`,
        diversity: "Favorece el aprendizaje visual y la descomposicion por pasos cortos.",
        exercises: "Lineas del tiempo, tiras de proceso, organizadores visuales y secuencias con imagen.",
        steps: ["Leer todos los pasos", "Buscar cual va primero", "Ordenar el proceso completo", "Revisar la secuencia final"],
      },
      10: {
        intention: `Integrar lo aprendido en ${topic} tomando una decision final fundamentada.`,
        attends: "Sintesis, transferencia del aprendizaje y reflexion final.",
        learning: `El alumno demuestra una comprension global del tema ${topic}.`,
        diversity: "Brinda cierre guiado con opciones claras y apoya la metacognicion.",
        exercises: "Eleccion razonada, cierre oral, autoevaluacion guiada y reflexion final.",
        steps: ["Leer la situacion final", "Recordar lo aprendido", "Comparar respuestas", "Elegir la solucion mas completa"],
      },
    };
    return {
      id: activityId,
      topicId,
      topic,
      title,
      competencies: COMPETENCIES[number] || [],
      ...(metaByNumber[number] || metaByNumber[1]),
    };
  };

  const normalizeEntry = (entry, activityId) => {
    if (!entry) return null;
    if (entry.attempts) return entry;
    return {
      attemptCount: entry.attempted ? 2 : 0,
      attempts: [],
      finalScore: entry.score ?? 0,
      finalLevel: entry.level ?? "En proceso",
      latest: {
        score: entry.score ?? 0,
        correctCount: entry.correctCount ?? 0,
        total: entry.total ?? 1,
        feedback: entry.feedback ?? "",
        details: entry.details ?? [],
      },
      topicId: entry.topicId ?? String(activityId).split("-")[0],
      completed: !!entry.attempted,
      ok: !!entry.ok,
      msg: entry.msg ?? "",
      c: entry.c ?? [],
    };
  };

  const studentEntries = (studentId) => {
    const store = progressStore()[studentId] || {};
    return Object.entries(store)
      .map(([activityId, entry]) => ({ activityId, entry: normalizeEntry(entry, activityId), meta: activityMeta(activityId) }))
      .filter(({ entry }) => !!entry);
  };

  const studentSummary = (studentId) => {
    const entries = studentEntries(studentId);
    const completed = entries.filter(({ entry }) => entry.completed);
    const score = completed.reduce((acc, { entry }) => acc + (entry.finalScore || 0), 0);
    const average = completed.length ? Math.round((score / (completed.length * 10)) * 100) : 0;
    const topicMap = Object.keys(TOPICS).reduce((acc, key) => {
      acc[key] = { completed: 0, score: 0, activities: [] };
      return acc;
    }, {});

    entries.forEach(({ activityId, entry, meta }) => {
      const topicId = meta.topicId;
      topicMap[topicId].activities.push({ activityId, entry, meta });
      if (entry.completed) {
        topicMap[topicId].completed += 1;
        topicMap[topicId].score += entry.finalScore || 0;
      }
    });

    const strengths = Object.values(topicMap)
      .filter((topic) => topic.completed)
      .map((topic) => ({
        topic: topic.activities[0]?.meta.topic || "",
        ratio: topic.completed ? topic.score / (topic.completed * 10) : 0,
      }))
      .sort((a, b) => b.ratio - a.ratio);

    const weakTopics = strengths.filter((topic) => topic.ratio < 0.7);
    const bestTopic = strengths[0]?.topic || "en construccion";
    const weakTopic = weakTopics[0]?.topic || strengths[strengths.length - 1]?.topic || "las actividades pendientes";

    return {
      entries,
      completedCount: completed.length,
      totalScore: score,
      average,
      topicMap,
      bestTopic,
      weakTopic,
      stickers: STICKERS.filter((sticker) => score >= sticker.min).slice(0, 3),
    };
  };

  const recommendationForStudent = (summary) => {
    if (summary.average >= 85) return "Puede avanzar a retos de produccion escrita, explicacion oral y actividades de extension creativa.";
    if (summary.average >= 60) return `Conviene reforzar ${summary.weakTopic} con ejemplos guiados, comparacion de modelos y practica corta antes de nuevos retos.`;
    return `Necesita apoyo cercano en ${summary.weakTopic}, usando actividades paso a paso, lectura compartida y manipulacion visual antes de volver a evaluar.`;
  };

  const learningForStudent = (summary) =>
    `Esta aprendiendo especialmente ${summary.bestTopic}, fortaleciendo comprension textual, organizacion de ideas y uso funcional del lenguaje.`;

  const parentReport = (student) => {
    const summary = studentSummary(student.id);
    return [
      `Reporte para familias - ${student.name}`,
      `Progreso general: ${summary.average}%`,
      `Actividades completadas: ${summary.completedCount} de 50`,
      `Lo que esta aprendiendo: ${learningForStudent(summary)}`,
      `Debilidad principal: ${summary.weakTopic}`,
      `Retroalimentacion personalizada: ${recommendationForStudent(summary)}`,
      `Recompensas obtenidas: ${summary.stickers.length ? summary.stickers.map((item) => `${item.emoji} ${item.name}`).join(", ") : "Aun en proceso"}`,
      "",
    ].join("\n");
  };

  const stepByStepText = (meta, entry) =>
    [
      `Tema: ${meta.topic}`,
      `Actividad: ${meta.title}`,
      `Intencion pedagogica: ${meta.intention}`,
      `Paso a paso sugerido: ${meta.steps.join(" -> ")}`,
      `Que atiende: ${meta.attends}`,
      `Correccion para el alumno: ${entry.latest?.feedback || entry.msg || "Revisar la actividad con el docente."}`,
      `Detalle: ${(entry.latest?.details || []).join(" | ") || "Sin detalle adicional."}`,
    ].join(" | ");

  const csvEscape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

  const buildTeacherCsv = (teacherId) => {
    const rows = [
      [
        "Alumno",
        "Tema",
        "Actividad",
        "Intencion pedagogica",
        "Que atiende",
        "Atencion a la diversidad",
        "Competencias",
        "Resultado final",
        "Nivel",
        "Intentos",
        "Retroalimentacion",
        "Ejercicio sugerido",
        "Paso a paso",
      ],
    ];

    students()
      .filter((student) => student.teacherId === teacherId)
      .forEach((student) => {
        studentEntries(student.id).forEach(({ entry, meta }) => {
          rows.push([
            student.name,
            meta.topic,
            meta.title,
            meta.intention,
            meta.attends,
            meta.diversity,
            meta.competencies.join(" / "),
            `${entry.finalScore || 0}/10`,
            entry.finalLevel || "En proceso",
            entry.attemptCount || 0,
            entry.latest?.feedback || entry.msg || "",
            meta.exercises,
            meta.steps.join(" -> "),
          ]);
        });
      });

    return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  };

  const buildStudentCsv = (student) => {
    const rows = [
      ["Alumno", "Tema", "Actividad", "Resultado", "Nivel", "Lo que aprende", "Debilidad detectada", "Ejercicio sugerido", "Paso a paso"],
    ];
    studentEntries(student.id).forEach(({ entry, meta }) => {
      rows.push([
        student.name,
        meta.topic,
        meta.title,
        `${entry.finalScore || 0}/10`,
        entry.finalLevel || "En proceso",
        meta.learning,
        entry.finalScore >= 7 ? "Sin debilidad marcada en esta actividad." : `Conviene reforzar ${meta.attends}.`,
        meta.exercises,
        meta.steps.join(" -> "),
      ]);
    });
    return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  };

  const downloadFile = (filename, content, type = "text/plain;charset=utf-8") => {
    const blob = new Blob([content], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 0);
  };

  const injectTeacherAnalytics = (teacherId) => {
    const panel = app.querySelector(".real-dashboard .real-panel");
    if (!panel) return;
    const teacherStudents = students().filter((student) => student.teacherId === teacherId);
    const summaries = teacherStudents.map((student) => ({ student, summary: studentSummary(student.id) }));
    const allFinished = teacherStudents.length > 0 && summaries.every(({ summary }) => summary.completedCount >= 50);
    const signature = JSON.stringify(
      summaries.map(({ student, summary }) => [student.id, summary.completedCount, summary.totalScore, summary.average])
    );

    const existing = panel.querySelector(".analytics-panel");
    if (existing?.dataset.signature === signature) return;

    const actionPlan = allFinished
      ? "Todos los estudiantes completaron los temarios. El siguiente paso recomendado es trabajar produccion escrita, revision entre pares y proyectos integrados por tema."
      : "Aun no todos han terminado. Se recomienda cerrar primero las actividades pendientes y reforzar los temas con menor promedio antes de avanzar al cierre final.";

    const section = document.createElement("section");
    section.className = "analytics-panel";
    section.dataset.signature = signature;
    section.innerHTML = `
      <div class="analytics-head">
        <div>
          <div class="helper-main">Analitica pedagogica</div>
          <h3>Retroalimentacion, reportes y plan de accion</h3>
        </div>
        <div class="analytics-actions">
          <button class="real-action" type="button" data-download-teacher-csv="${teacherId}">Descargar Excel CSV</button>
          <button class="real-ghost" type="button" data-download-parent-reports="${teacherId}">Reportes para padres</button>
        </div>
      </div>
      <article class="teacher-plan-card">
        <div class="evaluation-pill">Plan de accion docente</div>
        <p>${actionPlan}</p>
      </article>
      <div class="student-feedback-grid">
        ${summaries
          .map(({ student, summary }) => `
            <article class="student-feedback-card">
              <div class="teacher-student-head">
                <div>
                  <strong>${student.name}</strong>
                  <div class="teacher-order-line">Promedio ${summary.average}%</div>
                </div>
                <span class="real-chip">${summary.totalScore} pts</span>
              </div>
              <p><strong>Lo que aprende:</strong> ${learningForStudent(summary)}</p>
              <p><strong>Debilidad principal:</strong> ${summary.weakTopic}</p>
              <p><strong>Retroalimentacion personalizada:</strong> ${recommendationForStudent(summary)}</p>
              <p><strong>Stickers y recompensas:</strong> ${summary.stickers.length ? summary.stickers.map((item) => `${item.emoji} ${item.name}`).join(" | ") : "Aun sin recompensa exclusiva"}</p>
              <div class="student-report-actions">
                <button class="real-ghost" type="button" data-download-student-csv="${student.id}">Descargar resultados</button>
                <button class="real-ghost" type="button" data-download-student-json="${student.id}">Descargar progreso JSON</button>
              </div>
              <div class="student-activity-reports">
                ${summary.entries
                  .filter(({ entry }) => entry.completed)
                  .slice(0, 6)
                  .map(({ activityId, entry, meta }) => `
                    <div class="activity-report-row">
                      <strong>${meta.topic} - ${meta.title}</strong>
                      <span>${entry.finalScore || 0}/10 | ${entry.finalLevel || "En proceso"}</span>
                      <p>${stepByStepText(meta, entry)}</p>
                    </div>
                  `)
                  .join("") || `<div class="teacher-attempt-empty">Aun no hay actividades completadas por este alumno.</div>`}
              </div>
            </article>
          `)
          .join("") || `<div class="teacher-attempt-empty">Todavia no hay estudiantes con progreso.</div>`}
      </div>
    `;

    if (existing) existing.replaceWith(section);
    else panel.appendChild(section);
  };

  const injectStudentAnalytics = (studentId) => {
    const panel = app.querySelector(".real-student .real-panel");
    if (!panel) return;
    const student = students().find((item) => item.id === studentId);
    if (!student) return;
    const summary = studentSummary(studentId);
    const signature = JSON.stringify([summary.completedCount, summary.totalScore, summary.average]);
    const existing = panel.querySelector(".student-analytics-panel");
    if (existing?.dataset.signature === signature) return;

    const section = document.createElement("section");
    section.className = "student-analytics-panel";
    section.dataset.signature = signature;
    section.innerHTML = `
      <div class="analytics-head">
        <div>
          <div class="helper-main">Mi progreso</div>
          <h3>Retroalimentacion personalizada</h3>
        </div>
        <div class="analytics-actions">
          <button class="real-ghost" type="button" data-download-student-csv="${studentId}">Descargar mis resultados</button>
          <button class="real-ghost" type="button" data-download-student-json="${studentId}">Descargar mi progreso</button>
        </div>
      </div>
      <div class="student-feedback-grid single-student-grid">
        <article class="student-feedback-card">
          <div class="evaluation-pill">Lo que estoy aprendiendo</div>
          <p>${learningForStudent(summary)}</p>
          <p><strong>Debilidad a reforzar:</strong> ${summary.weakTopic}</p>
          <p><strong>Ejercicios sugeridos:</strong> ${recommendationForStudent(summary)}</p>
          <p><strong>Atencion a mi forma de aprender:</strong> Se recomiendan apoyos visuales, ejemplos paso a paso, manipulacion y practica guiada segun el resultado de cada juego.</p>
          <div class="reward-strip">
            ${summary.stickers.length
              ? summary.stickers.map((item) => `<span class="reward-badge">${item.emoji} ${item.name}</span>`).join("")
              : `<span class="reward-badge">🎯 Sigue jugando para ganar stickers exclusivos</span>`}
          </div>
        </article>
      </div>
    `;

    const progressPanel = panel.querySelector(".progress-panel");
    if (existing) existing.replaceWith(section);
    else if (progressPanel) progressPanel.insertAdjacentElement("afterend", section);
    else panel.appendChild(section);
  };

  app.addEventListener("click", (event) => {
    const teacherCsv = event.target.closest("[data-download-teacher-csv]");
    if (teacherCsv) {
      const teacherId = teacherCsv.dataset.downloadTeacherCsv;
      downloadFile(`resultados_docente_${teacherId}.csv`, buildTeacherCsv(teacherId), "text/csv;charset=utf-8");
      return;
    }

    const parentReports = event.target.closest("[data-download-parent-reports]");
    if (parentReports) {
      const teacherId = parentReports.dataset.downloadParentReports;
      const text = students()
        .filter((student) => student.teacherId === teacherId)
        .map((student) => parentReport(student))
        .join("\n------------------------------\n\n");
      downloadFile(`reportes_familias_${teacherId}.txt`, text);
      return;
    }

    const studentCsv = event.target.closest("[data-download-student-csv]");
    if (studentCsv) {
      const studentId = studentCsv.dataset.downloadStudentCsv;
      const student = students().find((item) => item.id === studentId);
      if (student) downloadFile(`resultados_${student.name.replaceAll(" ", "_")}.csv`, buildStudentCsv(student), "text/csv;charset=utf-8");
      return;
    }

    const studentJson = event.target.closest("[data-download-student-json]");
    if (studentJson) {
      const studentId = studentJson.dataset.downloadStudentJson;
      const student = students().find((item) => item.id === studentId);
      if (!student) return;
      const payload = {
        student,
        summary: studentSummary(studentId),
        generatedAt: new Date().toISOString(),
      };
      downloadFile(`progreso_${student.name.replaceAll(" ", "_")}.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
    }
  });

  const refresh = () => {
    const current = session();
    if (!current) return;
    if (current.role === "teacher") injectTeacherAnalytics(current.id);
    if (current.role === "student") injectStudentAnalytics(current.id);
  };

  const observer = new MutationObserver(() => refresh());
  observer.observe(app, { childList: true, subtree: true });
  refresh();
})();
