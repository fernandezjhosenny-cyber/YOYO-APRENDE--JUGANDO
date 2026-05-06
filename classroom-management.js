(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const KEYS = {
    session: "yoyo_rg_x",
    students: "yoyo_rg_s",
    teachers: "yoyo_rg_t",
    progress: "yoyo_rg_p",
    classroom: "yoyo_classroom_mgmt_v2",
  };

  const TIME_OPTIONS = [5, 10, 15];
  const TODAY = () => new Date().toISOString().slice(0, 10);
  const VIEW = { signature: "", busy: false, mute: false, timer: null, teacherPrimedId: "" };

  const TOPICS = [
    { id: "carta", title: "La Carta de Agradecimiento" },
    { id: "receta", title: "La Receta" },
    { id: "expositivo", title: "El Texto Expositivo" },
    { id: "comentario", title: "El Comentario" },
    { id: "anuncio", title: "El Anuncio Radial" },
    { id: "oda", title: "La Oda" },
  ];

  const TITLES = {
    1: "Ordena la estructura",
    2: "Completa con arrastre",
    3: "Clasifica por colores",
    4: "Memoria visual",
    5: "Detective del temario",
    6: "Cubos 3D",
    7: "Relaciona ideas",
    8: "Sopa de palabras",
    9: "Linea del tiempo",
    10: "Cierre final",
  };

  const TOPIC_TITLE_OVERRIDES = {
    anuncio: { 5: "Detective del anuncio", 10: "Mi anuncio en la radio" },
    oda: { 5: "Detective de la oda", 10: "Crea tu oda con palabras magicas" },
  };

  const GENERIC_COMPETENCIES = {
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

  const RADIAL_COMPETENCIES = {
    1: ["C1"], 2: ["C1"], 3: ["C1"], 4: ["C1", "C2"], 5: ["C2", "C3"],
    6: ["C1", "C2"], 7: ["C1", "C2"], 8: ["C1"], 9: ["C2"], 10: ["C1", "C2", "C3"],
  };

  const ODA_COMPETENCIES = {
    1: ["C1", "C2"], 2: ["C1", "C2"], 3: ["C1", "C2"], 4: ["C1", "C2"], 5: ["C1", "C2", "C3"],
    6: ["C1", "C2", "C3"], 7: ["C1", "C2"], 8: ["C1", "C2"], 9: ["C1", "C2"], 10: ["C1", "C2", "C3"],
  };

  const ERROR_GROUPS = {
    1: ["Organizacion", "Comprension"],
    2: ["Ortografia", "Vocabulario"],
    3: ["Comprension", "Clasificacion"],
    4: ["Comprension", "Memoria"],
    5: ["Comprension", "Analisis"],
    6: ["Secuencia", "Creatividad"],
    7: ["Relacion de ideas", "Comprension"],
    8: ["Ortografia", "Vocabulario"],
    9: ["Pensamiento logico", "Secuencia"],
    10: ["Expresion escrita", "Expresion oral"],
  };

  const COMPETENCY_LABELS = {
    C1: "Competencia Comunicativa",
    C2: "Pensamiento logico, creativo y critico",
    C3: "Ambiental, salud, etica y ciudadania",
  };

  const ORTHOGRAPHY_REINFORCEMENTS = [
    { id: "orto-mayuscula", title: "Mayuscula inicial", clue: "Recuerda la mayuscula inicial.", prompt: "Selecciona la opcion correcta.", options: ["mama", "Mamá", "mamA"], answer: "Mamá" },
    { id: "orto-tilde", title: "Palabras con tilde", clue: "Busca la palabra con tilde correcta.", prompt: "Selecciona la palabra bien escrita.", options: ["cancion", "cancíon", "canción"], answer: "canción" },
    { id: "orto-rr", title: "Sonido fuerte", clue: "Observa la letra que falta.", prompt: "Completa la palabra: ca__o", options: ["r", "rr", "rrr"], answer: "rr" },
  ];

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getSession() {
    return readJson(KEYS.session, null);
  }

  function getStudents() {
    return readJson(KEYS.students, []);
  }

  function getTeachers() {
    return readJson(KEYS.teachers, []);
  }

  function getProgressStore() {
    return readJson(KEYS.progress, {});
  }

  function getStore() {
    return readJson(KEYS.classroom, { version: 2, teachers: {}, students: {}, updatedAt: 0 });
  }

  function saveStore(store) {
    store.updatedAt = Date.now();
    writeJson(KEYS.classroom, store);
  }

  function ensureTeacherState(store, teacherId) {
    store.teachers[teacherId] = store.teachers[teacherId] || {
      rosterOrder: [],
      activities: {},
      reinforcements: {},
      efemerides: [],
      dashboard: {
        selectedStudentId: "",
        search: "",
        topic: "all",
        competency: "all",
        date: "all",
        flag: "all",
        activityTopic: "all",
        detailOpen: false,
      },
    };
    store.teachers[teacherId].dashboard = store.teachers[teacherId].dashboard || {
      selectedStudentId: "",
      search: "",
      topic: "all",
      competency: "all",
      date: "all",
      flag: "all",
      activityTopic: "all",
      detailOpen: false,
    };
    return store.teachers[teacherId];
  }

  function ensureStudentState(store, student) {
    store.students[student.id] = store.students[student.id] || {};
    store.students[student.id].lockedName = store.students[student.id].lockedName || student.name;
    return store.students[student.id];
  }

  function withStore(mutator) {
    const store = getStore();
    mutator(store);
    saveStore(store);
    scheduleEnhance();
  }

  function getTopicMeta() {
    return TOPICS.map((topic) => ({
      ...topic,
      activities: Array.from({ length: 10 }, (_, index) => {
        const number = index + 1;
        const overrides = TOPIC_TITLE_OVERRIDES[topic.id] || {};
        const competencies =
          topic.id === "anuncio" ? RADIAL_COMPETENCIES[number] :
          topic.id === "oda" ? ODA_COMPETENCIES[number] :
          GENERIC_COMPETENCIES[number];
        return {
          id: `${topic.id}-${number}`,
          number,
          topicId: topic.id,
          title: overrides[number] || TITLES[number],
          competencies,
          errorGroups: ERROR_GROUPS[number],
        };
      }),
    }));
  }

  function getActivityConfig(teacherId, activityId) {
    const store = getStore();
    const teacher = ensureTeacherState(store, teacherId);
    teacher.activities[activityId] = teacher.activities[activityId] || {
      enabled: false,
      minutes: 10,
      startedAt: 0,
    };
    return teacher.activities[activityId];
  }

  function getOrderedStudents(teacherId) {
    const store = getStore();
    const teacher = ensureTeacherState(store, teacherId);
    const roster = getStudents().filter((student) => student.teacherId === teacherId);
    roster.forEach((student) => ensureStudentState(store, student));
    const saved = teacher.rosterOrder.filter((id) => roster.some((student) => student.id === id));
    const missing = roster.map((student) => student.id).filter((id) => !saved.includes(id));
    const next = [...saved, ...missing];
    if (JSON.stringify(next) !== JSON.stringify(teacher.rosterOrder)) {
      teacher.rosterOrder = next;
      saveStore(store);
    }
    return teacher.rosterOrder.map((id) => roster.find((student) => student.id === id)).filter(Boolean);
  }

  function normalizeScore(entry) {
    const raw = Number(entry?.score ?? entry?.finalScore ?? 0) || 0;
    return raw <= 10 ? Math.max(0, Math.min(100, raw * 10)) : Math.max(0, Math.min(100, Math.round(raw)));
  }

  function getStudentResults(studentId) {
    const progress = getProgressStore()[studentId] || {};
    return getTopicMeta().flatMap((topic) =>
      topic.activities.map((activity) => {
        const entry = progress[activity.id] || {};
        const score = normalizeScore(entry);
        const completed = Boolean(entry.ok || entry.completed || score > 0);
        const attempts = Number(entry.attempts ?? entry.attemptCount ?? 0) || 0;
        const timeSpent = Number(entry.timeSpent ?? entry.timeMs ?? 0) || 0;
        const updatedAt = entry.updatedAt || entry.lastPlayedAt || entry.completedAt || "";
        return {
          ...activity,
          score,
          completed,
          attempts,
          timeSpent,
          updatedAt,
        };
      })
    );
  }

  function average(list) {
    return list.length ? Math.round(list.reduce((sum, value) => sum + value, 0) / list.length) : 0;
  }

  function summarizeStudent(studentId) {
    const results = getStudentResults(studentId);
    const byTopic = {};
    const comp = { C1: [], C2: [], C3: [] };
    const weaknesses = {};
    let completed = 0;
    let total = 0;

    results.forEach((result) => {
      byTopic[result.topicId] = byTopic[result.topicId] || {
        title: TOPICS.find((topic) => topic.id === result.topicId)?.title || result.topicId,
        completed: 0,
        totalActivities: 0,
        totalScore: 0,
        competencyBuckets: { C1: [], C2: [], C3: [] },
      };
      const topic = byTopic[result.topicId];
      topic.totalActivities += 1;
      if (result.completed) {
        completed += 1;
        total += result.score;
        topic.completed += 1;
        topic.totalScore += result.score;
      }
      ["C1", "C2", "C3"].forEach((key) => {
        if (result.competencies.includes(key)) {
          const value = result.completed ? result.score : 0;
          comp[key].push(value);
          topic.competencyBuckets[key].push(value);
        }
      });
      if (!result.completed || result.score < 70 || result.attempts > 1) {
        result.errorGroups.forEach((group) => {
          weaknesses[group] = (weaknesses[group] || 0) + (result.score < 60 ? 2 : 1);
        });
      }
    });

    Object.values(byTopic).forEach((topic) => {
      topic.competencyScores = {
        C1: average(topic.competencyBuckets.C1),
        C2: average(topic.competencyBuckets.C2),
        C3: average(topic.competencyBuckets.C3),
      };
      delete topic.competencyBuckets;
    });

    return {
      completed,
      total,
      competencies: {
        C1: average(comp.C1),
        C2: average(comp.C2),
        C3: average(comp.C3),
      },
      byTopic,
      weaknesses: Object.entries(weaknesses)
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => ({ label, count })),
    };
  }

  function summarizeTeacher(teacherId) {
    const students = getOrderedStudents(teacherId);
    const summaries = students.map((student) => ({ student, summary: summarizeStudent(student.id) }));
    const competencies = { C1: [], C2: [], C3: [] };
    let completed = 0;
    let totalScore = 0;

    summaries.forEach(({ summary }) => {
      completed += summary.completed;
      totalScore += summary.total;
      competencies.C1.push(summary.competencies.C1);
      competencies.C2.push(summary.competencies.C2);
      competencies.C3.push(summary.competencies.C3);
    });

    return {
      students: summaries,
      completed,
      totalScore,
      competencies: {
        C1: average(competencies.C1),
        C2: average(competencies.C2),
        C3: average(competencies.C3),
      },
    };
  }

  function getActivityAccess(studentId, activityId) {
    const student = getStudents().find((item) => item.id === studentId);
    if (!student) return { open: false, reason: "Sin estudiante.", remainingMs: 0 };
    const cfg = getActivityConfig(student.teacherId, activityId);
    if (!cfg.enabled || !cfg.startedAt) return { open: false, reason: "Actividad bloqueada por el docente.", remainingMs: 0 };
    const endAt = cfg.startedAt + cfg.minutes * 60000;
    const remainingMs = endAt - Date.now();
    if (remainingMs <= 0) return { open: false, reason: "Tiempo finalizado. Espera que el docente la reactive.", remainingMs: 0 };
    return { open: true, remainingMs, endAt };
  }

  function getTodayEfemerides(teacherId) {
    const teacher = ensureTeacherState(getStore(), teacherId);
    return (teacher.efemerides || []).filter((item) => item.date === TODAY());
  }

  function getStudentReinforcements(teacherId, studentId) {
    const teacher = ensureTeacherState(getStore(), teacherId);
    const assigned = teacher.reinforcements[studentId] || {};
    return ORTHOGRAPHY_REINFORCEMENTS.filter((item) => assigned[item.id]?.assigned).map((item) => ({
      ...item,
      progress: assigned[item.id],
    }));
  }

  function formatRemaining(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const min = String(Math.floor(total / 60)).padStart(2, "0");
    const sec = String(total % 60).padStart(2, "0");
    return `${min}:${sec}`;
  }

  function formatMinutesLabel(minutes) {
    const value = Number(minutes || 0);
    return value > 0 ? `${value} min` : "Sin tiempo";
  }

  function formatDateLabel(value) {
    if (!value) return "Sin registro";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Sin registro";
    return date.toLocaleDateString("es-DO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function progressPercent(summary) {
    return Math.round((summary.completed / 60) * 100);
  }

  function averageCompetencies(summary) {
    return average([summary.competencies.C1, summary.competencies.C2, summary.competencies.C3]);
  }

  function getPerformanceState(summary) {
    const value = averageCompetencies(summary);
    if (value >= 85) return { label: "Avanzado", tone: "good" };
    if (value >= 60) return { label: "En proceso", tone: "warn" };
    return { label: "Necesita refuerzo", tone: "danger" };
  }

  function getCompetencyTone(score) {
    if (score >= 85) return "good";
    if (score >= 60) return "warn";
    return "danger";
  }

  function getLowestCompetencyKey(competencies) {
    return ["C1", "C2", "C3"].sort((left, right) => competencies[left] - competencies[right])[0];
  }

  function getTeacherDashboard(teacherState) {
    return {
      selectedStudentId: teacherState.dashboard?.selectedStudentId || "",
      search: teacherState.dashboard?.search || "",
      topic: teacherState.dashboard?.topic || "all",
      competency: teacherState.dashboard?.competency || "all",
      date: teacherState.dashboard?.date || "all",
      flag: teacherState.dashboard?.flag || "all",
      activityTopic: teacherState.dashboard?.activityTopic || "all",
      detailOpen: !!teacherState.dashboard?.detailOpen,
    };
  }

  function getActivityCompletionMap(studentSummaries) {
    const map = {};
    studentSummaries.forEach(({ student }) => {
      getStudentResults(student.id).forEach((result) => {
        map[result.id] = map[result.id] || { completed: 0, total: 0 };
        map[result.id].total += 1;
        if (result.completed) map[result.id].completed += 1;
      });
    });
    return map;
  }

  function getStudentHistory(studentId, teacherId) {
    return getStudentResults(studentId).map((result) => {
      const cfg = getActivityConfig(teacherId, result.id);
      const endAt = cfg.startedAt ? cfg.startedAt + cfg.minutes * 60000 : 0;
      const blocked = !cfg.enabled || (cfg.startedAt && endAt <= Date.now());
      const status = blocked ? "Bloqueado" : result.completed ? "Completado" : result.score > 0 ? "En proceso" : "Pendiente";
      return {
        ...result,
        status,
        assignedMinutes: cfg.minutes || 0,
        blocked,
      };
    });
  }

  function filterStudentHistory(history, filters) {
    return history.filter((item) => {
      if (filters.topic !== "all" && item.topicId !== filters.topic) return false;
      if (filters.competency !== "all" && !item.competencies.includes(filters.competency)) return false;
      if (filters.date !== "all" && item.updatedAt) {
        const played = new Date(item.updatedAt);
        const now = new Date();
        if (filters.date === "today" && played.toDateString() !== now.toDateString()) return false;
        if (filters.date === "week") {
          const diff = now.getTime() - played.getTime();
          if (diff > 7 * 24 * 60 * 60 * 1000) return false;
        }
      }
      return true;
    });
  }

  function buildStudentRecommendations(studentSummary) {
    const notes = [];
    const lowestKey = getLowestCompetencyKey(studentSummary.competencies);
    const weakTopic = Object.values(studentSummary.byTopic)
      .map((topic) => ({ ...topic, average: average([topic.competencyScores.C1, topic.competencyScores.C2, topic.competencyScores.C3]) }))
      .sort((left, right) => left.average - right.average)[0];
    const weakLabels = studentSummary.weaknesses.map((item) => item.label);

    if (weakTopic) {
      notes.push(`Necesita reforzar el temario ${weakTopic.title}.`);
    }
    if (lowestKey === "C1") {
      notes.push("Presenta dificultad en la competencia C1: comprensión y comunicación del texto.");
    } else if (lowestKey === "C2") {
      notes.push("Presenta dificultad en la competencia C2: análisis y relación de ideas.");
    } else {
      notes.push("Necesita apoyo en la competencia C3: sensibilidad, valores y expresión emocional.");
    }
    if (weakLabels.some((label) => /Ortografia|Vocabulario/i.test(label))) {
      notes.push("Se recomienda asignar refuerzo de ortografía y vocabulario.");
    }
    if (weakLabels.some((label) => /Clasificacion|Relacion de ideas|Comprension/i.test(label))) {
      notes.push("Se recomienda repetir los juegos de clasificación y relación de ideas.");
    }
    return [...new Set(notes)].slice(0, 4);
  }

  function getScoreLevel(score) {
    if (score >= 80) return "Avanzado";
    if (score >= 60) return "Intermedio";
    return "Basico";
  }

  function getTopicState(topic) {
    const progress = topic.totalActivities ? Math.round((topic.completed / topic.totalActivities) * 100) : 0;
    const competencyAverage = average([topic.competencyScores.C1, topic.competencyScores.C2, topic.competencyScores.C3]);
    const score = average([progress, competencyAverage]);
    if (score >= 80) return { label: "Dominado", tone: "good", score };
    if (score >= 60) return { label: "En proceso", tone: "warn", score };
    return { label: "Necesita refuerzo", tone: "danger", score };
  }

  function getTopicSignals(studentSummary) {
    return Object.entries(studentSummary.byTopic)
      .map(([topicId, topic]) => {
        const competencies = ["C1", "C2", "C3"].map((key) => ({
          key,
          score: topic.competencyScores[key],
          label: COMPETENCY_LABELS[key],
        }));
        const weakest = [...competencies].sort((a, b) => a.score - b.score)[0];
        const strongest = [...competencies].sort((a, b) => b.score - a.score)[0];
        return {
          topicId,
          title: topic.title,
          topic,
          state: getTopicState(topic),
          weakest,
          strongest,
        };
      })
      .sort((a, b) => a.state.score - b.state.score);
  }

  function buildTopicRecommendations(studentSummary) {
    return getTopicSignals(studentSummary).slice(0, 4).map((signal) => {
      const topicMeta = getTopicMeta().find((topic) => topic.id === signal.topicId);
      const suggestedGames = (topicMeta?.activities || [])
        .filter((activity) => activity.competencies.includes(signal.weakest.key))
        .slice(0, 3)
        .map((activity) => `${activity.number}. ${activity.title}`)
        .join(", ");
      return {
        topicId: signal.topicId,
        topicTitle: signal.title,
        competency: signal.weakest.key,
        message: `Refuerza ${signal.weakest.key} en el temario '${signal.title}' mediante juegos de ${signal.weakest.key === "C2" ? "analisis y relacion de ideas" : signal.weakest.key === "C3" ? "reflexion y expresion emocional" : "comprension y expresion del lenguaje"}.`,
        suggestedGames,
      };
    });
  }

  function buildTopicDiagnostics(studentSummary) {
    const signals = getTopicSignals(studentSummary);
    const notes = [];
    const weakest = signals[0];
    const strongest = [...signals].sort((a, b) => b.state.score - a.state.score)[0];
    if (weakest) {
      notes.push(`El estudiante presenta dificultad en ${weakest.weakest.key} del temario '${weakest.title}'.`);
    }
    if (strongest && strongest.strongest.score >= 80) {
      notes.push(`Buen desempeño en ${strongest.strongest.key} del temario '${strongest.title}'.`);
    }
    return notes;
  }

  function buildAdaptiveRoute(studentSummary) {
    const weakest = getTopicSignals(studentSummary)[0];
    if (!weakest) return null;
    const topicMeta = getTopicMeta().find((topic) => topic.id === weakest.topicId);
    const targetActivities = (topicMeta?.activities || []).filter((activity) => activity.competencies.includes(weakest.weakest.key));
    const nextActivity = targetActivities[0];
    return {
      topicTitle: weakest.title,
      competency: weakest.weakest.key,
      status: weakest.weakest.score < 30 ? "Alerta critica" : weakest.weakest.score < 60 ? "Reforzar" : weakest.weakest.score < 80 ? "Mantener nivel" : "Avanzar",
      level: weakest.weakest.score < 60 ? "Basico" : weakest.weakest.score < 80 ? "Intermedio" : "Avanzado",
      nextGame: nextActivity ? `${nextActivity.number}. ${nextActivity.title}` : "Sin juego sugerido",
    };
  }

  function getClassShareLink(teacher) {
    const origin = window.location.origin || "http://127.0.0.1:5500";
    const path = window.location.pathname || "/index.html";
    return `${origin}${path}?class=${encodeURIComponent(teacher?.code || "YOYO")}`;
  }

  function getOwnerTeacherId() {
    const saved = localStorage.getItem("yoyo_owner_teacher_id") || "";
    if (saved && getTeachers().some((teacher) => teacher.id === saved)) return saved;
    const firstTeacher = getTeachers()[0];
    return firstTeacher?.id || "";
  }

  function syncOwnerSessionFromUrl() {
    const url = new URL(window.location.href);
    const ownerMode = url.searchParams.get("owner");
    if (ownerMode !== "1") return;
    const ownerId = getOwnerTeacherId();
    if (!ownerId) return;
    const current = getSession();
    if (!current || current.role !== "teacher" || current.id !== ownerId) {
      writeJson(KEYS.session, { role: "teacher", id: ownerId });
    }
  }

  function buildTeacherScoresCsv(teacherId) {
    const rows = [["Alumno", "Temario", "Juego", "Puntuacion"]];
    const teacherStudents = getOrderedStudents(teacherId);
    teacherStudents.forEach((student) => {
      getStudentResults(student.id).forEach((result) => {
        rows.push([
          student.name,
          TOPICS.find((topic) => topic.id === result.topicId)?.title || result.topicId,
          `${result.number}. ${result.title}`,
          String(result.score || 0),
        ]);
      });
    });
    return "\uFEFF" + rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")).join("\r\n");
  }

  function downloadTeacherScoresCsv(teacherId) {
    const teacher = getTeachers().find((item) => item.id === teacherId);
    const blob = new Blob([buildTeacherScoresCsv(teacherId)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `YOYO_${(teacher?.code || "clase").replace(/\s+/g, "_")}_juegos.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function getStudentFlagReason(studentSummary) {
    const weak = studentSummary.weaknesses[0];
    return weak ? `${weak.label} (${weak.count})` : "Sin alerta";
  }

  function renderTeacherModule(teacherId) {
    const host = app.querySelector(".real-dashboard .real-panel");
    if (!host) return;
    host.querySelector(".classroom-admin-shell")?.remove();

    const summary = summarizeTeacher(teacherId);
    const teacherState = ensureTeacherState(getStore(), teacherId);
    const topics = getTopicMeta();

    const section = document.createElement("section");
    section.className = "classroom-admin-shell";
    section.innerHTML = `
      <div class="module-grid module-grid-2">
        <article class="module-card">
          <div class="module-kicker">Resumen general del curso</div>
          <div class="module-mini-grid">
            <div class="module-stat"><strong>${summary.students.length}</strong><span>Estudiantes</span></div>
            <div class="module-stat"><strong>${summary.completed}</strong><span>Actividades completadas</span></div>
            <div class="module-stat"><strong>${summary.totalScore}</strong><span>Puntos registrados</span></div>
            <div class="module-stat"><strong>${TOPICS.length}</strong><span>Temarios</span></div>
          </div>
        </article>
        <article class="module-card">
          <div class="module-kicker">Competencias del curso</div>
          <div class="module-competency-grid">
            ${["C1", "C2", "C3"].map((key) => `
              <div class="module-competency-card">
                <strong>${key}</strong>
                <span>${summary.competencies[key]}/100</span>
                <small>${COMPETENCY_LABELS[key]}</small>
              </div>
            `).join("")}
          </div>
        </article>
      </div>

      <div class="module-grid module-grid-2">
        <article class="module-card">
          <div class="module-kicker">Orden del grupo</div>
          <div class="module-stack">
            ${summary.students.map(({ student }, index) => `
              <div class="module-row">
                <div>
                  <strong>${escapeHtml(student.name)}</strong>
                  <span>Nombre bloqueado para seguimiento</span>
                </div>
                <div class="module-actions-inline">
                  <button class="module-btn ghost" type="button" data-roster-move="${student.id}" data-direction="-1" ${index === 0 ? "disabled" : ""}>Subir</button>
                  <button class="module-btn ghost" type="button" data-roster-move="${student.id}" data-direction="1" ${index === summary.students.length - 1 ? "disabled" : ""}>Bajar</button>
                </div>
              </div>
            `).join("")}
          </div>
        </article>
        <article class="module-card">
          <div class="module-kicker">Seguimiento rapido</div>
          <div class="module-stack">
            ${summary.students.map(({ student, summary: studentSummary }) => {
              const weak = studentSummary.weaknesses.slice(0, 3);
              return `
                <div class="module-row">
                  <div>
                    <strong>${escapeHtml(student.name)}</strong>
                    <span>${weak.length ? weak.map((item) => `${item.label} (${item.count})`).join(" · ") : "Sin debilidades frecuentes"}</span>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </article>
      </div>

      <article class="module-card">
        <div class="module-kicker">Control docente de actividades</div>
        <div class="module-stack">
          ${topics.map((topic) => {
            const activeCount = topic.activities.filter((activity) => {
              const cfg = teacherState.activities[activity.id];
              return cfg?.enabled && cfg?.startedAt && cfg.startedAt + cfg.minutes * 60000 > Date.now();
            }).length;
            return `
              <details class="module-topic" ${topic.id === "anuncio" ? "open" : ""}>
                <summary>${topic.title} <span>${activeCount}/${topic.activities.length} activas</span></summary>
                <div class="module-stack">
                  ${topic.activities.map((activity) => {
                    const cfg = getActivityConfig(teacherId, activity.id);
                    const endAt = cfg.startedAt ? cfg.startedAt + cfg.minutes * 60000 : 0;
                    const live = cfg.enabled && endAt > Date.now();
                    const status = !cfg.enabled ? "Bloqueada" : live ? `Activa · ${formatRemaining(endAt - Date.now())}` : "Tiempo vencido";
                    return `
                      <div class="module-activity-row">
                        <div>
                          <strong>${activity.number}. ${activity.title}</strong>
                          <span>${activity.competencies.join(", ")} · ${status}</span>
                        </div>
                        <div class="module-actions-inline">
                          <select data-activity-minutes="${activity.id}" class="module-select">
                            ${TIME_OPTIONS.map((minutes) => `<option value="${minutes}" ${cfg.minutes === minutes ? "selected" : ""}>${minutes} min</option>`).join("")}
                          </select>
                          <button class="module-btn" type="button" data-activity-start="${activity.id}">Activar</button>
                          <button class="module-btn ghost" type="button" data-activity-stop="${activity.id}">Bloquear</button>
                        </div>
                      </div>
                    `;
                  }).join("")}
                </div>
              </details>
            `;
          }).join("")}
        </div>
      </article>

      <article class="module-card">
        <div class="module-kicker">Perfiles por estudiante</div>
        <div class="module-stack">
          ${summary.students.map(({ student, summary: studentSummary }) => `
            <details class="module-topic module-student-profile">
              <summary>${escapeHtml(student.name)} <span>${studentSummary.completed}/60 actividades · ${studentSummary.total} pts</span></summary>
              <div class="module-grid module-grid-2">
                <article class="module-card module-card-embedded">
                  <div class="module-kicker">Perfil del estudiante</div>
                  <div class="module-stack">
                    <div class="module-row">
                      <div>
                        <strong>${escapeHtml(student.name)}</strong>
                        <span>Nombre guardado automaticamente para seguimiento.</span>
                      </div>
                      <div class="module-badge">Bloqueado</div>
                    </div>
                    <div class="module-row">
                      <div>
                        <strong>Avance general</strong>
                        <span>${studentSummary.completed}/60 actividades completadas · ${studentSummary.total} puntos acumulados</span>
                      </div>
                    </div>
                    <div class="module-row">
                      <div>
                        <strong>Competencias globales</strong>
                        <span>C1: ${studentSummary.competencies.C1} · C2: ${studentSummary.competencies.C2} · C3: ${studentSummary.competencies.C3}</span>
                      </div>
                    </div>
                  </div>
                </article>
                <article class="module-card module-card-embedded">
                  <div class="module-kicker">Debilidades detectadas</div>
                  <div class="module-stack">
                    ${studentSummary.weaknesses.slice(0, 5).map((item) => `<div class="module-row-mini"><strong>${item.label}</strong><span>${item.count}</span></div>`).join("") || `<div class="module-empty">Sin debilidades marcadas.</div>`}
                  </div>
                </article>
              </div>
              <article class="module-card module-card-embedded">
                <div class="module-kicker">Resultados por temario</div>
                <div class="module-stack">
                  ${Object.values(studentSummary.byTopic).map((topic) => `
                    <div class="module-topic-score-card">
                      <div class="module-row">
                        <div>
                          <strong>${escapeHtml(topic.title)}</strong>
                          <span>${topic.completed}/${topic.totalActivities} actividades · ${topic.completed ? Math.round(topic.totalScore / Math.max(1, topic.completed)) : 0} pts promedio</span>
                        </div>
                      </div>
                      <div class="module-row-mini">
                        <strong>Notas del temario</strong>
                        <span>Este temario genera tres notas separadas: C1, C2 y C3.</span>
                      </div>
                      <div class="module-competency-grid">
                        ${["C1", "C2", "C3"].map((key) => `
                          <div class="module-competency-card">
                            <strong>${key}</strong>
                            <span>${topic.competencyScores[key]}/100</span>
                            <small>${COMPETENCY_LABELS[key]}</small>
                          </div>
                        `).join("")}
                      </div>
                    </div>
                  `).join("")}
                </div>
              </article>
            </details>
          `).join("")}
        </div>
      </article>

      <div class="module-grid module-grid-2">
        <article class="module-card">
          <div class="module-kicker">Refuerzo de ortografia</div>
          <label class="module-label">Selecciona estudiante
            <select id="reinforcementStudent" class="module-select">
              ${summary.students.map(({ student }) => `<option value="${student.id}">${escapeHtml(student.name)}</option>`).join("")}
            </select>
          </label>
          <div class="module-stack">
            ${ORTHOGRAPHY_REINFORCEMENTS.map((item) => `
              <div class="module-row">
                <div>
                  <strong>${item.title}</strong>
                  <span>${item.prompt}</span>
                </div>
                <button class="module-btn" type="button" data-reinforcement-assign="${item.id}">Asignar</button>
              </div>
            `).join("")}
          </div>
        </article>

        <article class="module-card">
          <div class="module-kicker">Efemerides</div>
          <form id="efemeridesForm" class="module-stack">
            <input type="hidden" id="efemeridesEditId">
            <label class="module-label">Fecha
              <input class="module-input" id="efemeridesDate" type="date" value="${TODAY()}">
            </label>
            <label class="module-label">Titulo
              <input class="module-input" id="efemeridesTitle" type="text" placeholder="Ejemplo: Dia del libro">
            </label>
            <label class="module-label">Descripcion
              <textarea class="module-input" id="efemeridesDescription" rows="3" placeholder="Mensaje breve para estudiantes"></textarea>
            </label>
            <div class="module-actions-inline">
              <button class="module-btn" type="submit">Guardar efemeride</button>
              <button class="module-btn ghost" id="efemeridesReset" type="button">Limpiar</button>
            </div>
          </form>
          <div class="module-stack">
            ${(teacherState.efemerides || []).map((item) => `
              <div class="module-row">
                <div>
                  <strong>${escapeHtml(item.title)}</strong>
                  <span>${item.date} · ${escapeHtml(item.description)}</span>
                </div>
                <div class="module-actions-inline">
                  <button class="module-btn ghost" type="button" data-efemeride-edit="${item.id}">Editar</button>
                  <button class="module-btn ghost" type="button" data-efemeride-delete="${item.id}">Borrar</button>
                </div>
              </div>
            `).join("") || `<div class="module-empty">Todavia no hay efemerides registradas.</div>`}
          </div>
        </article>
      </div>
    `;

    host.appendChild(section);
    bindTeacherEvents(teacherId, section);
  }

  function renderTeacherModule(teacherId) {
    const host = app.querySelector(".real-dashboard .real-panel");
    if (!host) return;
    host.querySelector(".classroom-admin-shell")?.remove();

    const summary = summarizeTeacher(teacherId);
    const teacherState = ensureTeacherState(getStore(), teacherId);
    const teacher = getTeachers().find((item) => item.id === teacherId);
    const dashboard = getTeacherDashboard(teacherState);
    const topics = getTopicMeta();
    const completionMap = getActivityCompletionMap(summary.students);
    const activeActivities = topics.flatMap((topic) => topic.activities).filter((activity) => {
      const cfg = teacherState.activities[activity.id];
      return cfg?.enabled && cfg?.startedAt && cfg.startedAt + cfg.minutes * 60000 > Date.now();
    }).length;
    const averageGeneral = summary.students.length
      ? average(summary.students.map((item) => averageCompetencies(item.summary)))
      : 0;
    const lowestCompetency = getLowestCompetencyKey(summary.competencies);
    const filteredStudents = summary.students
      .filter(({ student, summary: studentSummary }) => {
        const search = dashboard.search.trim().toLowerCase();
        if (search && !student.name.toLowerCase().includes(search)) return false;
        if (dashboard.flag === "low" && averageCompetencies(studentSummary) >= 60) return false;
        if (dashboard.flag === "pending" && studentSummary.completed >= 60) return false;
        return true;
      })
      .sort((left, right) => {
        if (dashboard.competency !== "all") {
          return left.summary.competencies[dashboard.competency] - right.summary.competencies[dashboard.competency];
        }
        if (dashboard.topic !== "all") {
          const leftTopic = left.summary.byTopic[dashboard.topic];
          const rightTopic = right.summary.byTopic[dashboard.topic];
          const leftAvg = leftTopic ? average([leftTopic.competencyScores.C1, leftTopic.competencyScores.C2, leftTopic.competencyScores.C3]) : 0;
          const rightAvg = rightTopic ? average([rightTopic.competencyScores.C1, rightTopic.competencyScores.C2, rightTopic.competencyScores.C3]) : 0;
          return leftAvg - rightAvg;
        }
        return left.student.name.localeCompare(right.student.name, "es");
      });

    const selectedPack = dashboard.detailOpen
      ? (filteredStudents.find(({ student }) => student.id === dashboard.selectedStudentId) || null)
      : null;
    const selectedStudent = selectedPack?.student || null;
    const selectedSummary = selectedPack?.summary || null;
    const selectedHistory = selectedStudent ? filterStudentHistory(getStudentHistory(selectedStudent.id, teacherId), dashboard) : [];
    const selectedPending = selectedHistory.filter((item) => !item.completed && !item.blocked).length;
    const selectedBlocked = selectedHistory.filter((item) => item.blocked).length;
    const selectedFailed = selectedHistory.filter((item) => !item.completed && item.score > 0).length;
    const recommendations = selectedSummary ? buildStudentRecommendations(selectedSummary) : [];
    const topicRecommendations = selectedSummary ? buildTopicRecommendations(selectedSummary) : [];
    const topicDiagnostics = selectedSummary ? buildTopicDiagnostics(selectedSummary) : [];
    const adaptiveRoute = selectedSummary ? buildAdaptiveRoute(selectedSummary) : null;
    const activityTopic = topics.find((topic) => topic.id === (dashboard.activityTopic === "all" ? topics[0]?.id : dashboard.activityTopic)) || topics[0];
    const shareLink = getClassShareLink(teacher);
    const courseTopicOverview = topics.map((topic) => {
      const records = filteredStudents
        .map(({ summary: studentSummary }) => studentSummary.byTopic[topic.id])
        .filter(Boolean);
      const progress = records.length
        ? Math.round(average(records.map((record) => record.totalActivities ? (record.completed / record.totalActivities) * 100 : 0)))
        : 0;
      const competencyScores = {
        C1: records.length ? Math.round(average(records.map((record) => record.competencyScores.C1))) : 0,
        C2: records.length ? Math.round(average(records.map((record) => record.competencyScores.C2))) : 0,
        C3: records.length ? Math.round(average(records.map((record) => record.competencyScores.C3))) : 0,
      };
      const state = getTopicState({
        completed: progress,
        totalActivities: 100,
        competencyScores,
      });
      return {
        id: topic.id,
        title: topic.title,
        progress,
        competencyScores,
        state,
      };
    });
    const groupAlerts = filteredStudents
      .map(({ student, summary: studentSummary }) => {
        const weakestSignal = getTopicSignals(studentSummary)[0];
        return {
          student,
          signal: weakestSignal,
          score: averageCompetencies(studentSummary),
        };
      })
      .filter((item) => item.signal)
      .sort((left, right) => left.score - right.score)
      .slice(0, 4);

    const section = document.createElement("section");
    section.className = "classroom-admin-shell classroom-admin-dashboard";
    section.innerHTML = `
      <div class="module-summary-bar">
        <div class="module-summary-pill"><strong>${escapeHtml(teacher?.code || "Sin codigo")}</strong><span>Codigo unico de clase</span></div>
        <div class="module-summary-pill"><strong>${summary.students.length}</strong><span>Total de estudiantes</span></div>
        <div class="module-summary-pill"><strong>${activeActivities}</strong><span>Actividades activas</span></div>
        <div class="module-summary-pill"><strong>${averageGeneral}/100</strong><span>Promedio general</span></div>
        <div class="module-summary-pill"><strong>${lowestCompetency}</strong><span>Competencia mas baja</span></div>
      </div>

      <div class="teacher-dashboard-shell">
        <div class="teacher-left-column">
          <article class="module-card">
            <div class="module-kicker">Resumen del curso</div>
            <div class="module-stack">
              <div class="module-row">
                <div>
                  <strong>Codigo de clase</strong>
                  <span>${escapeHtml(teacher?.code || "Sin codigo")} · Escuela ${escapeHtml(teacher?.school || "")}</span>
                </div>
                <div class="module-badge">${summary.students.length} alumnos</div>
              </div>
              <div class="module-mini-grid module-mini-grid-compact">
                <div class="module-stat"><strong>${summary.completed}</strong><span>Completadas</span></div>
                <div class="module-stat"><strong>${summary.totalScore}</strong><span>Puntos</span></div>
                <div class="module-stat"><strong>${TOPICS.length}</strong><span>Temarios</span></div>
                <div class="module-stat"><strong>${filteredStudents.length}</strong><span>Visibles</span></div>
              </div>
              <div class="module-competency-grid">
                ${["C1", "C2", "C3"].map((key) => `
                  <div class="module-competency-card module-tone-${getCompetencyTone(summary.competencies[key])}">
                    <strong>${key}</strong>
                    <span>${summary.competencies[key]}/100</span>
                    <small>${COMPETENCY_LABELS[key]}</small>
                  </div>
                `).join("")}
              </div>
              <div class="module-stack">
                <div class="module-row-mini"><strong>1</strong><span>Activa juegos y define tiempo por temario.</span></div>
                <div class="module-row-mini"><strong>2</strong><span>Selecciona un estudiante y revisa su progreso.</span></div>
                <div class="module-row-mini"><strong>3</strong><span>Asigna refuerzo y toma decisiones con sus resultados.</span></div>
              </div>
            </div>
          </article>

          <article class="module-card">
            <div class="module-kicker">Filtros</div>
            <div class="module-filter-grid">
              <label class="module-label">Buscar estudiante
                <input class="module-input" type="text" value="${escapeHtml(dashboard.search)}" data-dashboard-search placeholder="Escribe un nombre">
              </label>
              <label class="module-label">Tema
                <select class="module-select" data-dashboard-topic>
                  <option value="all" ${dashboard.topic === "all" ? "selected" : ""}>Todos</option>
                  ${topics.map((topic) => `<option value="${topic.id}" ${dashboard.topic === topic.id ? "selected" : ""}>${topic.title}</option>`).join("")}
                </select>
              </label>
              <label class="module-label">Competencia
                <select class="module-select" data-dashboard-competency>
                  <option value="all" ${dashboard.competency === "all" ? "selected" : ""}>Todas</option>
                  <option value="C1" ${dashboard.competency === "C1" ? "selected" : ""}>C1</option>
                  <option value="C2" ${dashboard.competency === "C2" ? "selected" : ""}>C2</option>
                  <option value="C3" ${dashboard.competency === "C3" ? "selected" : ""}>C3</option>
                </select>
              </label>
              <label class="module-label">Fecha
                <select class="module-select" data-dashboard-date>
                  <option value="all" ${dashboard.date === "all" ? "selected" : ""}>Todas</option>
                  <option value="today" ${dashboard.date === "today" ? "selected" : ""}>Hoy</option>
                  <option value="week" ${dashboard.date === "week" ? "selected" : ""}>Esta semana</option>
                </select>
              </label>
              <label class="module-label">Alerta
                <select class="module-select" data-dashboard-flag>
                  <option value="all" ${dashboard.flag === "all" ? "selected" : ""}>Todos</option>
                  <option value="low" ${dashboard.flag === "low" ? "selected" : ""}>Bajo rendimiento</option>
                  <option value="pending" ${dashboard.flag === "pending" ? "selected" : ""}>Juegos pendientes</option>
                </select>
              </label>
            </div>
          </article>

          <article class="module-card">
            <div class="module-kicker">Panel de actividades</div>
            <div class="module-topic-chip-row">
              ${topics.map((topic) => `<button class="module-chip-toggle ${activityTopic.id === topic.id ? "active" : ""}" type="button" data-activity-topic="${topic.id}">${topic.title}</button>`).join("")}
            </div>
            <div class="module-activity-grid">
              ${activityTopic.activities.map((activity) => {
                const cfg = getActivityConfig(teacherId, activity.id);
                const endAt = cfg.startedAt ? cfg.startedAt + cfg.minutes * 60000 : 0;
                const live = cfg.enabled && endAt > Date.now();
                const state = !cfg.enabled ? "Bloqueado" : live ? "Activo" : "Pendiente";
                const completed = completionMap[activity.id]?.completed || 0;
                return `
                  <article class="module-activity-card">
                    <div class="module-activity-head">
                      <strong>${activity.number}. ${activity.title}</strong>
                      <span class="module-state-pill ${state === "Activo" ? "good" : state === "Pendiente" ? "warn" : "danger"}">${state}</span>
                    </div>
                    <div class="module-chip-row">
                      ${activity.competencies.map((item) => `<span class="module-mini-chip">${item}</span>`).join("")}
                    </div>
                    <div class="module-activity-meta">
                      <span>${formatMinutesLabel(cfg.minutes)}</span>
                      <span>${completed}/${summary.students.length} completaron</span>
                    </div>
                    <div class="module-actions-inline">
                      <select data-activity-minutes="${activity.id}" class="module-select module-select-sm">
                        ${TIME_OPTIONS.map((minutes) => `<option value="${minutes}" ${cfg.minutes === minutes ? "selected" : ""}>${minutes} min</option>`).join("")}
                      </select>
                      <button class="module-btn" type="button" data-activity-start="${activity.id}">Activar</button>
                      <button class="module-btn ghost" type="button" data-activity-stop="${activity.id}">Bloquear</button>
                    </div>
                  </article>
                `;
              }).join("")}
            </div>
          </article>

          <details class="module-card module-collapsible">
            <summary class="module-collapsible-summary">Orden del grupo</summary>
            <div class="module-stack">
              ${summary.students.map(({ student }, index) => `
                <div class="module-row">
                  <div>
                    <strong>${escapeHtml(student.name)}</strong>
                    <span>Nombre bloqueado para seguimiento</span>
                  </div>
                  <div class="module-actions-inline">
                    <button class="module-btn ghost" type="button" data-roster-move="${student.id}" data-direction="-1" ${index === 0 ? "disabled" : ""}>Subir</button>
                    <button class="module-btn ghost" type="button" data-roster-move="${student.id}" data-direction="1" ${index === summary.students.length - 1 ? "disabled" : ""}>Bajar</button>
                  </div>
                </div>
              `).join("")}
            </div>
          </details>

          <details class="module-card module-collapsible">
            <summary class="module-collapsible-summary">Refuerzo de ortografia</summary>
            <label class="module-label">Selecciona estudiante
              <select id="reinforcementStudent" class="module-select">
                ${summary.students.map(({ student }) => `<option value="${student.id}" ${selectedStudent?.id === student.id ? "selected" : ""}>${escapeHtml(student.name)}</option>`).join("")}
              </select>
            </label>
            <div class="module-stack">
              ${ORTHOGRAPHY_REINFORCEMENTS.map((item) => `
                <div class="module-row">
                  <div>
                    <strong>${item.title}</strong>
                    <span>${item.prompt}</span>
                  </div>
                  <button class="module-btn" type="button" data-reinforcement-assign="${item.id}">Asignar</button>
                </div>
              `).join("")}
            </div>
          </details>

          <details class="module-card module-collapsible">
            <summary class="module-collapsible-summary">Efemerides</summary>
            <form id="efemeridesForm" class="module-stack">
              <input type="hidden" id="efemeridesEditId">
              <label class="module-label">Fecha
                <input class="module-input" id="efemeridesDate" type="date" value="${TODAY()}">
              </label>
              <label class="module-label">Titulo
                <input class="module-input" id="efemeridesTitle" type="text" placeholder="Ejemplo: Dia del libro">
              </label>
              <label class="module-label">Descripcion
                <textarea class="module-input" id="efemeridesDescription" rows="3" placeholder="Mensaje breve para estudiantes"></textarea>
              </label>
              <div class="module-actions-inline">
                <button class="module-btn" type="submit">Guardar efemeride</button>
                <button class="module-btn ghost" id="efemeridesReset" type="button">Limpiar</button>
              </div>
            </form>
            <div class="module-stack">
              ${(teacherState.efemerides || []).map((item) => `
                <div class="module-row">
                  <div>
                    <strong>${escapeHtml(item.title)}</strong>
                    <span>${item.date} · ${escapeHtml(item.description)}</span>
                  </div>
                  <div class="module-actions-inline">
                    <button class="module-btn ghost" type="button" data-efemeride-edit="${item.id}">Editar</button>
                    <button class="module-btn ghost" type="button" data-efemeride-delete="${item.id}">Borrar</button>
                  </div>
                </div>
              `).join("") || `<div class="module-empty">Todavia no hay efemerides registradas.</div>`}
            </div>
          </details>
        </div>

        <div class="teacher-center-column">
          <article class="module-card">
            <div class="module-kicker">Lista de estudiantes</div>
            <div class="teacher-student-table">
              <div class="teacher-student-table-head">
                <span>Estudiante</span>
                <span>Progreso</span>
                <span>Puntos</span>
                <span>Estado</span>
                <span>Competencias</span>
              </div>
              <div class="teacher-student-list">
              ${filteredStudents.map(({ student, summary: studentSummary }) => {
                const state = getPerformanceState(studentSummary);
                return `
                  <button class="teacher-student-row ${selectedStudent?.id === student.id ? "selected" : ""}" type="button" data-student-select="${student.id}">
                    <div class="teacher-student-col teacher-student-main">
                      <div class="teacher-student-avatar">${escapeHtml(student.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase())}</div>
                      <div>
                        <strong>${escapeHtml(student.name)}</strong>
                        <span>${getStudentFlagReason(studentSummary)}</span>
                      </div>
                    </div>
                    <div class="teacher-student-col">
                      <strong>${progressPercent(studentSummary)}%</strong>
                      <span>general</span>
                    </div>
                    <div class="teacher-student-col">
                      <strong>${studentSummary.total}</strong>
                      <span>pts</span>
                    </div>
                    <div class="teacher-student-col">
                      <span class="module-state-pill ${state.tone}">${state.label}</span>
                    </div>
                    <div class="teacher-student-col teacher-student-side">
                      <div class="teacher-mini-bars">
                        ${["C1", "C2", "C3"].map((key) => `
                          <div class="teacher-mini-bar">
                            <label>${key}</label>
                            <span><i class="module-bar-fill ${getCompetencyTone(studentSummary.competencies[key])}" style="width:${studentSummary.competencies[key]}%"></i></span>
                          </div>
                        `).join("")}
                      </div>
                    </div>
                  </button>
                `;
              }).join("") || `<div class="module-empty">No hay estudiantes para ese filtro.</div>`}
              </div>
            </div>
          </article>
        </div>

        <div class="teacher-right-column">
          ${selectedStudent && selectedSummary ? `
            <article class="module-card">
              <div class="module-kicker">Detalle del estudiante</div>
              <div class="teacher-detail-head">
                <div>
                  <h3>${escapeHtml(selectedStudent.name)}</h3>
                  <p>${progressPercent(selectedSummary)}% de progreso general · ${selectedSummary.total} puntos acumulados</p>
                </div>
                <span class="module-badge">${getPerformanceState(selectedSummary).label}</span>
              </div>
              <div class="teacher-detail-metrics">
                <div class="module-stat"><strong>${selectedSummary.completed}</strong><span>Completados</span></div>
                <div class="module-stat"><strong>${selectedPending}</strong><span>Pendientes</span></div>
                <div class="module-stat"><strong>${selectedBlocked}</strong><span>Bloqueados</span></div>
                <div class="module-stat"><strong>${selectedFailed}</strong><span>Con dificultad</span></div>
              </div>
              <div class="module-competency-grid">
                ${["C1", "C2", "C3"].map((key) => `
                  <div class="module-competency-card module-tone-${getCompetencyTone(selectedSummary.competencies[key])}">
                    <strong>${key}</strong>
                    <span>${selectedSummary.competencies[key]}/100</span>
                    <small>${COMPETENCY_LABELS[key]}</small>
                  </div>
                `).join("")}
              </div>
            </article>

            <article class="module-card">
              <div class="module-kicker">Resultados por temario</div>
              <div class="module-stack">
                ${Object.values(selectedSummary.byTopic).map((topic) => `
                  <div class="module-topic-score-card">
                    <div class="module-row">
                      <div>
                        <strong>${escapeHtml(topic.title)}</strong>
                        <span>${topic.completed}/${topic.totalActivities} actividades</span>
                      </div>
                      <div class="module-badge">${topic.completed ? Math.round(topic.totalScore / Math.max(1, topic.completed)) : 0} pts</div>
                    </div>
                    <div class="module-competency-grid">
                      ${["C1", "C2", "C3"].map((key) => `
                        <div class="module-competency-card module-tone-${getCompetencyTone(topic.competencyScores[key])}">
                          <strong>${key}</strong>
                          <span>${topic.competencyScores[key]}/100</span>
                          <small>${COMPETENCY_LABELS[key]}</small>
                        </div>
                      `).join("")}
                    </div>
                  </div>
                `).join("")}
              </div>
            </article>

            <article class="module-card">
              <div class="module-kicker">Dificultades detectadas</div>
              <div class="module-stack">
                ${selectedSummary.weaknesses.slice(0, 6).map((item) => `<div class="module-row-mini"><strong>${item.label}</strong><span>${item.count}</span></div>`).join("") || `<div class="module-empty">Sin debilidades marcadas.</div>`}
              </div>
            </article>

            <article class="module-card">
              <div class="module-kicker">Recomendaciones automaticas</div>
              <div class="module-stack">
                ${recommendations.map((item) => `<div class="module-row-mini"><strong>Recomendacion</strong><span>${item}</span></div>`).join("") || `<div class="module-empty">Todavia no hay recomendaciones.</div>`}
              </div>
            </article>

            <article class="module-card">
              <div class="module-kicker">Historial por juego</div>
              <div class="module-history-table">
                <table class="teacher-history-table">
                  <thead>
                    <tr>
                      <th>Juego</th>
                      <th>Tema</th>
                      <th>Competencias</th>
                      <th>Puntuacion</th>
                      <th>Intentos</th>
                      <th>Tiempo usado</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${selectedHistory.map((item) => `
                      <tr>
                        <td>${item.number}. ${escapeHtml(item.title)}</td>
                        <td>${escapeHtml(TOPICS.find((topic) => topic.id === item.topicId)?.title || item.topicId)}</td>
                        <td>${item.competencies.join(", ")}</td>
                        <td>${item.score}/100</td>
                        <td>${item.attempts}</td>
                        <td>${item.timeSpent ? formatRemaining(item.timeSpent) : formatMinutesLabel(item.assignedMinutes)}</td>
                        <td><span class="module-state-pill ${item.status === "Completado" ? "good" : item.status === "Pendiente" ? "warn" : "danger"}">${item.status}</span></td>
                        <td>${formatDateLabel(item.updatedAt)}</td>
                      </tr>
                    `).join("") || `<tr><td colspan="8">No hay juegos para este filtro.</td></tr>`}
                  </tbody>
                </table>
              </div>
            </article>
          ` : `
            <article class="module-card">
              <div class="module-kicker">Detalle del estudiante</div>
              <div class="module-empty">Selecciona un estudiante para ver su progreso detallado.</div>
            </article>
          `}
        </div>
      </div>

      <div class="teacher-utility-row">
        <details class="module-card module-collapsible">
          <summary class="module-collapsible-summary">Orden del grupo</summary>
          <div class="module-stack">
            ${summary.students.map(({ student }, index) => `
              <div class="module-row">
                <div>
                  <strong>${escapeHtml(student.name)}</strong>
                  <span>Nombre bloqueado para seguimiento</span>
                </div>
                <div class="module-actions-inline">
                  <button class="module-btn ghost" type="button" data-roster-move="${student.id}" data-direction="-1" ${index === 0 ? "disabled" : ""}>Subir</button>
                  <button class="module-btn ghost" type="button" data-roster-move="${student.id}" data-direction="1" ${index === summary.students.length - 1 ? "disabled" : ""}>Bajar</button>
                </div>
              </div>
            `).join("")}
          </div>
        </details>

        <details class="module-card module-collapsible">
          <summary class="module-collapsible-summary">Refuerzo de ortografia</summary>
          <label class="module-label">Selecciona estudiante
            <select id="reinforcementStudent" class="module-select">
              ${summary.students.map(({ student }) => `<option value="${student.id}" ${selectedStudent?.id === student.id ? "selected" : ""}>${escapeHtml(student.name)}</option>`).join("")}
            </select>
          </label>
          <div class="module-stack">
            ${ORTHOGRAPHY_REINFORCEMENTS.map((item) => `
              <div class="module-row">
                <div>
                  <strong>${item.title}</strong>
                  <span>${item.prompt}</span>
                </div>
                <button class="module-btn" type="button" data-reinforcement-assign="${item.id}">Asignar</button>
              </div>
            `).join("")}
          </div>
        </details>

        <details class="module-card module-collapsible">
          <summary class="module-collapsible-summary">Efemerides</summary>
          <form id="efemeridesForm" class="module-stack">
            <input type="hidden" id="efemeridesEditId">
            <label class="module-label">Fecha
              <input class="module-input" id="efemeridesDate" type="date" value="${TODAY()}">
            </label>
            <label class="module-label">Titulo
              <input class="module-input" id="efemeridesTitle" type="text" placeholder="Ejemplo: Dia del libro">
            </label>
            <label class="module-label">Descripcion
              <textarea class="module-input" id="efemeridesDescription" rows="3" placeholder="Mensaje breve para estudiantes"></textarea>
            </label>
            <div class="module-actions-inline">
              <button class="module-btn" type="submit">Guardar efemeride</button>
              <button class="module-btn ghost" id="efemeridesReset" type="button">Limpiar</button>
            </div>
          </form>
          <div class="module-stack">
            ${(teacherState.efemerides || []).map((item) => `
              <div class="module-row">
                <div>
                  <strong>${escapeHtml(item.title)}</strong>
                  <span>${item.date} · ${escapeHtml(item.description)}</span>
                </div>
                <div class="module-actions-inline">
                  <button class="module-btn ghost" type="button" data-efemeride-edit="${item.id}">Editar</button>
                  <button class="module-btn ghost" type="button" data-efemeride-delete="${item.id}">Borrar</button>
                </div>
              </div>
            `).join("") || `<div class="module-empty">Todavia no hay efemerides registradas.</div>`}
          </div>
        </details>
      </div>
    `;

    host.appendChild(section);
    normalizeTeacherDashboard(section);
    bindTeacherEvents(teacherId, section);
    bindTeacherDashboardEvents(teacherId, section);
  }

  function normalizeTeacherDashboard(section) {
    const leftColumn = section.querySelector(".teacher-left-column");
    if (!leftColumn) return;
    leftColumn.querySelectorAll(".module-collapsible").forEach((card) => card.remove());
  }

  function renderTeacherModule(teacherId) {
    const host = app.querySelector(".real-dashboard");
    if (!host) return;
    host.innerHTML = "";
    host.classList.add("classroom-dashboard-root");

    const summary = summarizeTeacher(teacherId);
    const teacherState = ensureTeacherState(getStore(), teacherId);
    const teacher = getTeachers().find((item) => item.id === teacherId);
    const dashboard = getTeacherDashboard(teacherState);
    const topics = getTopicMeta();
    const completionMap = getActivityCompletionMap(summary.students);
    const activeActivities = topics.flatMap((topic) => topic.activities).filter((activity) => {
      const cfg = teacherState.activities[activity.id];
      return cfg?.enabled && cfg?.startedAt && cfg.startedAt + cfg.minutes * 60000 > Date.now();
    }).length;
    const averageGeneral = summary.students.length
      ? average(summary.students.map((item) => averageCompetencies(item.summary)))
      : 0;
    const lowestCompetency = getLowestCompetencyKey(summary.competencies);
    const allHistory = summary.students.flatMap(({ student }) => getStudentHistory(student.id, teacherId));
    const averageMinutes = allHistory.length
      ? Math.round(average(allHistory.map((item) => item.timeSpent ? Math.max(1, Math.round(item.timeSpent / 60000)) : (item.assignedMinutes || 0)).filter(Boolean)))
      : 0;
    const averageScore = allHistory.length ? Math.round(average(allHistory.map((item) => item.score || 0))) : averageGeneral;

    const filteredStudents = summary.students
      .filter(({ student, summary: studentSummary }) => {
        const search = dashboard.search.trim().toLowerCase();
        if (search && !student.name.toLowerCase().includes(search)) return false;
        if (dashboard.flag === "low" && averageCompetencies(studentSummary) >= 60) return false;
        if (dashboard.flag === "pending" && studentSummary.completed >= 60) return false;
        return true;
      })
      .sort((left, right) => {
        if (dashboard.competency !== "all") {
          return left.summary.competencies[dashboard.competency] - right.summary.competencies[dashboard.competency];
        }
        if (dashboard.topic !== "all") {
          const leftTopic = left.summary.byTopic[dashboard.topic];
          const rightTopic = right.summary.byTopic[dashboard.topic];
          const leftAvg = leftTopic ? average([leftTopic.competencyScores.C1, leftTopic.competencyScores.C2, leftTopic.competencyScores.C3]) : 0;
          const rightAvg = rightTopic ? average([rightTopic.competencyScores.C1, rightTopic.competencyScores.C2, rightTopic.competencyScores.C3]) : 0;
          return leftAvg - rightAvg;
        }
        return left.student.name.localeCompare(right.student.name, "es");
      });

    const selectedPack =
      filteredStudents.find(({ student }) => student.id === dashboard.selectedStudentId) ||
      null;
    const selectedStudent = selectedPack?.student || null;
    const selectedSummary = selectedPack?.summary || null;
    const selectedHistory = selectedStudent ? filterStudentHistory(getStudentHistory(selectedStudent.id, teacherId), dashboard) : [];
    const selectedPending = selectedHistory.filter((item) => !item.completed && !item.blocked).length;
    const selectedBlocked = selectedHistory.filter((item) => item.blocked).length;
    const selectedFailed = selectedHistory.filter((item) => !item.completed && item.score > 0).length;
    const recommendations = selectedSummary ? buildStudentRecommendations(selectedSummary) : [];
    const topicRecommendations = selectedSummary ? buildTopicRecommendations(selectedSummary) : [];
    const topicDiagnostics = selectedSummary ? buildTopicDiagnostics(selectedSummary) : [];
    const adaptiveRoute = selectedSummary ? buildAdaptiveRoute(selectedSummary) : null;
    const activityTopic = topics.find((topic) => topic.id === (dashboard.activityTopic === "all" ? topics[0]?.id : dashboard.activityTopic)) || topics[0];
    const shareLink = getClassShareLink(teacher);
    const courseTopicOverview = topics.map((topic) => {
      const records = filteredStudents
        .map(({ summary: studentSummary }) => studentSummary.byTopic[topic.id])
        .filter(Boolean);
      const progress = records.length
        ? Math.round(average(records.map((record) => record.totalActivities ? (record.completed / record.totalActivities) * 100 : 0)))
        : 0;
      const competencyScores = {
        C1: records.length ? Math.round(average(records.map((record) => record.competencyScores.C1))) : 0,
        C2: records.length ? Math.round(average(records.map((record) => record.competencyScores.C2))) : 0,
        C3: records.length ? Math.round(average(records.map((record) => record.competencyScores.C3))) : 0,
      };
      return {
        id: topic.id,
        title: topic.title,
        progress,
        competencyScores,
        state: getTopicState({
          completed: progress,
          totalActivities: 100,
          competencyScores,
        }),
      };
    });
    const groupAlerts = filteredStudents
      .map(({ student, summary: studentSummary }) => {
        const weakestSignal = getTopicSignals(studentSummary)[0];
        return weakestSignal ? {
          student,
          signal: weakestSignal,
          score: averageCompetencies(studentSummary),
        } : null;
      })
      .filter(Boolean)
      .sort((left, right) => left.score - right.score)
      .slice(0, 4);

    const section = document.createElement("section");
    section.className = "classroom-admin-shell classroom-admin-dashboard classroom-admin-dashboard-v2";
    section.innerHTML = `
      <div class="teacher-shell-wide">
        <aside class="teacher-nav-rail">
          <div class="teacher-brand-block">
            <strong>YOYO</strong>
            <span>Panel docente</span>
          </div>
          <div class="teacher-rail-menu">
            <button class="teacher-rail-link active" type="button" data-teacher-nav="summary">Resumen</button>
            <button class="teacher-rail-link" type="button" data-teacher-nav="students">Estudiantes</button>
            <button class="teacher-rail-link" type="button" data-teacher-nav="activities">Actividades</button>
            <button class="teacher-rail-link" type="button" data-teacher-nav="competencies">Competencias</button>
            <button class="teacher-rail-link" type="button" data-teacher-nav="reports">Reportes</button>
          </div>
          <div class="teacher-rail-footer">
            <strong>${escapeHtml(teacher?.name || "Docente YOYO")}</strong>
            <span>${escapeHtml(teacher?.school || "Curso activo")}</span>
          </div>
        </aside>

        <div class="teacher-workspace">
          <div class="teacher-page-head">
            <div>
              <h2>Estudiantes</h2>
              <p>Gestiona el progreso de tu curso y toma decisiones con una vista clara en una sola pantalla.</p>
            </div>
            <div class="teacher-head-actions">
              <button class="module-btn ghost" type="button" data-owner-home>Acceso propietaria</button>
              <button class="module-btn ghost" type="button" data-copy-code="${escapeHtml(teacher?.code || "Sin codigo")}">Copiar codigo</button>
              <button class="module-btn" type="button" data-copy-link="${escapeHtml(shareLink)}">Copiar link de clase</button>
              <button class="module-btn" type="button" data-export-scores>Descargar Excel</button>
              <div class="module-badge">${TOPICS.length} temarios</div>
            </div>
          </div>

          <div class="module-summary-bar teacher-summary-bar-wide" data-section-target="summary">
            <div class="module-summary-pill"><strong>${escapeHtml(teacher?.code || "Sin codigo")}</strong><span>Codigo de clase · link compartible</span></div>
            <div class="module-summary-pill"><strong>${summary.students.length}</strong><span>Total de estudiantes</span></div>
            <div class="module-summary-pill"><strong>${activeActivities}</strong><span>Actividades activas</span></div>
            <div class="module-summary-pill"><strong>${averageGeneral}%</strong><span>Promedio general</span></div>
            <div class="module-summary-pill"><strong>${averageMinutes || 0} min</strong><span>Tiempo promedio</span></div>
            <div class="module-summary-pill"><strong>${averageScore}%</strong><span>Precision promedio</span></div>
          </div>

          <div class="teacher-dashboard-shell teacher-dashboard-shell-v2 ${selectedStudent && selectedSummary ? "detail-open" : ""}">
            <div class="teacher-left-column teacher-left-column-v2">
              <article class="module-card" data-section-target="summary">
                <div class="module-kicker">Accesos rapidos</div>
                <div class="module-stack teacher-sequence-card">
                  <div class="module-row-mini"><strong>Codigo</strong><span>${escapeHtml(teacher?.code || "Sin codigo")}</span></div>
                  <div class="module-row-mini"><strong>Propietaria</strong><span>Tu acceso queda guardado en este equipo.</span></div>
                  <div class="module-row-mini"><strong>Exportacion</strong><span>Descarga el reporte por alumno, juego y puntuacion.</span></div>
                </div>
              </article>

              <article class="module-card" data-section-target="summary">
                <div class="module-kicker">Filtros</div>
                <div class="module-filter-grid teacher-filter-grid-wide">
                  <label class="module-label">Buscar estudiante
                    <input class="module-input" type="text" value="${escapeHtml(dashboard.search)}" data-dashboard-search placeholder="Escribe un nombre">
                  </label>
                  <label class="module-label">Tema
                    <select class="module-select" data-dashboard-topic>
                      <option value="all" ${dashboard.topic === "all" ? "selected" : ""}>Todos</option>
                      ${topics.map((topic) => `<option value="${topic.id}" ${dashboard.topic === topic.id ? "selected" : ""}>${topic.title}</option>`).join("")}
                    </select>
                  </label>
                  <label class="module-label">Competencia
                    <select class="module-select" data-dashboard-competency>
                      <option value="all" ${dashboard.competency === "all" ? "selected" : ""}>Todas</option>
                      <option value="C1" ${dashboard.competency === "C1" ? "selected" : ""}>C1</option>
                      <option value="C2" ${dashboard.competency === "C2" ? "selected" : ""}>C2</option>
                      <option value="C3" ${dashboard.competency === "C3" ? "selected" : ""}>C3</option>
                    </select>
                  </label>
                  <label class="module-label">Fecha
                    <select class="module-select" data-dashboard-date>
                      <option value="all" ${dashboard.date === "all" ? "selected" : ""}>Todas</option>
                      <option value="today" ${dashboard.date === "today" ? "selected" : ""}>Hoy</option>
                      <option value="week" ${dashboard.date === "week" ? "selected" : ""}>Esta semana</option>
                    </select>
                  </label>
                  <label class="module-label">Alerta
                    <select class="module-select" data-dashboard-flag>
                      <option value="all" ${dashboard.flag === "all" ? "selected" : ""}>Todos</option>
                      <option value="low" ${dashboard.flag === "low" ? "selected" : ""}>Bajo rendimiento</option>
                      <option value="pending" ${dashboard.flag === "pending" ? "selected" : ""}>Juegos pendientes</option>
                    </select>
                  </label>
                </div>
              </article>

              <article class="module-card" data-section-target="activities">
                <div class="module-kicker">Actividades por temario</div>
                <div class="module-topic-chip-row">
                  ${topics.map((topic) => `<button class="module-chip-toggle ${activityTopic.id === topic.id ? "active" : ""}" type="button" data-activity-topic="${topic.id}">${topic.title}</button>`).join("")}
                </div>
                <div class="module-activity-grid teacher-activity-grid-wide">
                  ${activityTopic.activities.map((activity) => {
                    const cfg = getActivityConfig(teacherId, activity.id);
                    const endAt = cfg.startedAt ? cfg.startedAt + cfg.minutes * 60000 : 0;
                    const live = cfg.enabled && endAt > Date.now();
                    const state = !cfg.enabled ? "Bloqueado" : live ? "Activo" : "Pendiente";
                    const completed = completionMap[activity.id]?.completed || 0;
                    return `
                      <article class="module-activity-card">
                        <div class="module-activity-head">
                          <strong>${activity.number}. ${activity.title}</strong>
                          <span class="module-state-pill ${state === "Activo" ? "good" : state === "Pendiente" ? "warn" : "danger"}">${state}</span>
                        </div>
                        <div class="module-chip-row">
                          ${activity.competencies.map((item) => `<span class="module-mini-chip">${item}</span>`).join("")}
                        </div>
                        <div class="module-activity-meta">
                          <span>${formatMinutesLabel(cfg.minutes)}</span>
                          <span>${completed}/${summary.students.length} completaron</span>
                        </div>
                        <div class="module-actions-inline">
                          <select data-activity-minutes="${activity.id}" class="module-select module-select-sm">
                            ${TIME_OPTIONS.map((minutes) => `<option value="${minutes}" ${cfg.minutes === minutes ? "selected" : ""}>${minutes} min</option>`).join("")}
                          </select>
                          <button class="module-btn" type="button" data-activity-start="${activity.id}">Activar</button>
                          <button class="module-btn ghost" type="button" data-activity-stop="${activity.id}">Bloquear</button>
                        </div>
                      </article>
                    `;
                  }).join("")}
                </div>
              </article>

              <details class="module-card module-collapsible">
                <summary class="module-collapsible-summary">Gestion del grupo</summary>
                <div class="module-stack">
                  ${summary.students.map(({ student }, index) => `
                    <div class="module-row">
                      <div>
                        <strong>${escapeHtml(student.name)}</strong>
                        <span>Nombre bloqueado para seguimiento</span>
                      </div>
                      <div class="module-actions-inline">
                        <button class="module-btn ghost" type="button" data-roster-move="${student.id}" data-direction="-1" ${index === 0 ? "disabled" : ""}>Subir</button>
                        <button class="module-btn ghost" type="button" data-roster-move="${student.id}" data-direction="1" ${index === summary.students.length - 1 ? "disabled" : ""}>Bajar</button>
                      </div>
                    </div>
                  `).join("")}
                </div>
              </details>

              <details class="module-card module-collapsible">
                <summary class="module-collapsible-summary">Refuerzo de ortografia</summary>
                <label class="module-label">Selecciona estudiante
                  <select id="reinforcementStudent" class="module-select">
                    ${summary.students.map(({ student }) => `<option value="${student.id}" ${selectedStudent?.id === student.id ? "selected" : ""}>${escapeHtml(student.name)}</option>`).join("")}
                  </select>
                </label>
                <div class="module-stack">
                  ${ORTHOGRAPHY_REINFORCEMENTS.map((item) => `
                    <div class="module-row">
                      <div>
                        <strong>${item.title}</strong>
                        <span>${item.prompt}</span>
                      </div>
                      <button class="module-btn" type="button" data-reinforcement-assign="${item.id}">Asignar</button>
                    </div>
                  `).join("")}
                </div>
              </details>

              <details class="module-card module-collapsible">
                <summary class="module-collapsible-summary">Efemerides</summary>
                <form id="efemeridesForm" class="module-stack">
                  <input type="hidden" id="efemeridesEditId">
                  <label class="module-label">Fecha
                    <input class="module-input" id="efemeridesDate" type="date" value="${TODAY()}">
                  </label>
                  <label class="module-label">Titulo
                    <input class="module-input" id="efemeridesTitle" type="text" placeholder="Ejemplo: Dia del libro">
                  </label>
                  <label class="module-label">Descripcion
                    <textarea class="module-input" id="efemeridesDescription" rows="3" placeholder="Mensaje breve para estudiantes"></textarea>
                  </label>
                  <div class="module-actions-inline">
                    <button class="module-btn" type="submit">Guardar efemeride</button>
                    <button class="module-btn ghost" id="efemeridesReset" type="button">Limpiar</button>
                  </div>
                </form>
                <div class="module-stack">
                  ${(teacherState.efemerides || []).map((item) => `
                    <div class="module-row">
                      <div>
                        <strong>${escapeHtml(item.title)}</strong>
                        <span>${item.date} · ${escapeHtml(item.description)}</span>
                      </div>
                      <div class="module-actions-inline">
                        <button class="module-btn ghost" type="button" data-efemeride-edit="${item.id}">Editar</button>
                        <button class="module-btn ghost" type="button" data-efemeride-delete="${item.id}">Borrar</button>
                      </div>
                    </div>
                  `).join("") || `<div class="module-empty">Todavia no hay efemerides registradas.</div>`}
                </div>
              </details>
            </div>

            <div class="teacher-center-column teacher-center-column-v2">
              <article class="module-card teacher-students-card" data-section-target="students">
                <div class="teacher-card-head">
                  <div>
                    <div class="module-kicker">Lista de estudiantes</div>
                    <p>Haz clic en un estudiante para actualizar su detalle al instante.</p>
                  </div>
                  <div class="module-badge">${filteredStudents.length} visibles</div>
                </div>
                <div class="teacher-student-table">
                  <div class="teacher-student-table-head teacher-student-table-head-v2">
                    <span>Estudiante</span>
                    <span>Progreso general</span>
                    <span>Actividades</span>
                    <span>Puntos</span>
                    <span>Estado</span>
                  </div>
                  <div class="teacher-student-list">
                    ${filteredStudents.map(({ student, summary: studentSummary }) => {
                      const state = getPerformanceState(studentSummary);
                      return `
                        <button class="teacher-student-row teacher-student-row-v2 ${selectedStudent?.id === student.id ? "selected" : ""}" type="button" data-student-select="${student.id}">
                          <div class="teacher-student-col teacher-student-main">
                            <div class="teacher-student-avatar">${escapeHtml(student.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase())}</div>
                            <div>
                              <strong>${escapeHtml(student.name)}</strong>
                              <span>${getStudentFlagReason(studentSummary)}</span>
                            </div>
                          </div>
                          <div class="teacher-student-col">
                            <strong>${progressPercent(studentSummary)}%</strong>
                            <div class="teacher-progress-line"><i class="module-bar-fill ${state.tone}" style="width:${progressPercent(studentSummary)}%"></i></div>
                          </div>
                          <div class="teacher-student-col">
                            <strong>${studentSummary.completed}/${studentSummary.totalActivities}</strong>
                            <span>Completadas</span>
                          </div>
                          <div class="teacher-student-col">
                            <strong>${studentSummary.total}</strong>
                            <span>Puntos</span>
                          </div>
                          <div class="teacher-student-col teacher-student-side">
                            <span class="module-state-pill ${state.tone}">${state.label}</span>
                            <div class="teacher-mini-bars">
                              ${["C1", "C2", "C3"].map((key) => `
                                <div class="teacher-mini-bar">
                                  <label>${key}</label>
                                  <span><i class="module-bar-fill ${getCompetencyTone(studentSummary.competencies[key])}" style="width:${studentSummary.competencies[key]}%"></i></span>
                                </div>
                              `).join("")}
                            </div>
                          </div>
                        </button>
                      `;
                    }).join("") || `<div class="module-empty">No hay estudiantes para ese filtro.</div>`}
                  </div>
                </div>
              </article>

              <div class="teacher-center-insights">
                <article class="module-card" data-section-target="competencies">
                  <div class="module-kicker">Rendimiento del curso por temario</div>
                  <div class="teacher-topic-overview-grid">
                    ${courseTopicOverview.map((topic) => `
                      <div class="module-topic-score-card">
                        <div class="module-row">
                          <div>
                            <strong>${escapeHtml(topic.title)}</strong>
                            <span>${topic.progress}% de progreso del grupo</span>
                          </div>
                          <div class="module-badge">${topic.state.label}</div>
                        </div>
                        <div class="teacher-topic-bars">
                          ${["C1", "C2", "C3"].map((key) => `
                            <div class="teacher-topic-bar">
                              <label>${key}</label>
                              <span><i class="module-bar-fill ${getCompetencyTone(topic.competencyScores[key])}" style="width:${topic.competencyScores[key]}%"></i></span>
                              <strong>${topic.competencyScores[key]}</strong>
                            </div>
                          `).join("")}
                        </div>
                      </div>
                    `).join("")}
                  </div>
                </article>

                <article class="module-card" data-section-target="reports">
                  <div class="module-kicker">Alertas y acciones del grupo</div>
                  <div class="teacher-recommend-grid">
                    ${groupAlerts.map((item) => `
                      <div class="module-row-mini">
                        <strong>${escapeHtml(item.student.name)}</strong>
                        <span>Dificultad en ${item.signal.weakest.key} del temario ${escapeHtml(item.signal.title)}.</span>
                      </div>
                    `).join("") || `<div class="module-empty">No hay alertas criticas en este momento.</div>`}
                  </div>
                </article>
              </div>
            </div>

            <div class="teacher-right-column teacher-right-column-v2 ${selectedStudent && selectedSummary ? "detail-visible" : "detail-hidden"}">
              ${selectedStudent && selectedSummary ? `
                <article class="module-card" data-section-target="competencies">
                  <div class="teacher-card-head">
                    <div>
                      <div class="module-kicker">Detalle del estudiante</div>
                      <h3>${escapeHtml(selectedStudent.name)}</h3>
                      <p>${progressPercent(selectedSummary)}% de progreso general · ${selectedSummary.total} puntos acumulados</p>
                    </div>
                    <div class="teacher-head-actions">
                      <span class="module-badge">${getPerformanceState(selectedSummary).label}</span>
                      <button class="module-btn ghost" type="button" data-clear-selection>Cerrar detalles del alumno</button>
                    </div>
                  </div>
                  <div class="teacher-detail-top">
                    <div class="teacher-ring-metric">
                      <strong>${progressPercent(selectedSummary)}%</strong>
                      <span>Progreso general</span>
                    </div>
                    <div class="teacher-detail-metrics">
                      <div class="module-stat"><strong>${selectedSummary.completed}</strong><span>Completados</span></div>
                      <div class="module-stat"><strong>${selectedPending}</strong><span>Pendientes</span></div>
                      <div class="module-stat"><strong>${selectedBlocked}</strong><span>Bloqueados</span></div>
                      <div class="module-stat"><strong>${selectedFailed}</strong><span>Con dificultad</span></div>
                    </div>
                  </div>
                </article>

                <article class="module-card" data-section-target="competencies">
                  <div class="module-kicker">Competencias generales</div>
                  <div class="teacher-split-panels">
                    <div class="module-competency-grid teacher-competency-grid">
                      ${["C1", "C2", "C3"].map((key) => `
                        <div class="module-competency-card module-tone-${getCompetencyTone(selectedSummary.competencies[key])}">
                          <strong>${key}</strong>
                          <span>${selectedSummary.competencies[key]}/100</span>
                          <small>${COMPETENCY_LABELS[key]}</small>
                        </div>
                      `).join("")}
                    </div>
                    <div class="teacher-strength-list">
                      ${selectedSummary.weaknesses.slice(0, 4).map((item) => `<div class="module-row-mini"><strong>${item.label}</strong><span>${item.count}</span></div>`).join("") || `<div class="module-empty">Sin dificultades marcadas.</div>`}
                    </div>
                  </div>
                </article>

                <article class="module-card" data-section-target="reports">
                  <div class="module-kicker">Rendimiento por temario</div>
                  <div class="module-stack">
                    ${Object.values(selectedSummary.byTopic).map((topic) => `
                      <div class="module-topic-score-card">
                        <div class="module-row">
                          <div>
                            <strong>${escapeHtml(topic.title)}</strong>
                            <span>${topic.completed}/${topic.totalActivities} actividades · ${Math.round((topic.completed / Math.max(1, topic.totalActivities)) * 100)}% progreso</span>
                          </div>
                          <div class="module-badge">${getTopicState(topic).label}</div>
                        </div>
                        <div class="teacher-topic-bars">
                          ${["C1", "C2", "C3"].map((key) => `
                            <div class="teacher-topic-bar">
                              <label>${key}</label>
                              <span><i class="module-bar-fill ${getCompetencyTone(topic.competencyScores[key])}" style="width:${topic.competencyScores[key]}%"></i></span>
                              <strong>${topic.competencyScores[key]}</strong>
                            </div>
                          `).join("")}
                        </div>
                      </div>
                    `).join("")}
                  </div>
                </article>

                <article class="module-card" data-section-target="reports">
                  <div class="module-kicker">Dificultades por temario</div>
                  <div class="teacher-recommend-grid">
                    ${topicDiagnostics.map((item) => `<div class="module-row-mini"><strong>Diagnostico</strong><span>${item}</span></div>`).join("") || `<div class="module-empty">Sin diagnosticos por temario.</div>`}
                  </div>
                </article>

                <article class="module-card" data-section-target="reports">
                  <div class="module-kicker">Recomendaciones por temario</div>
                  <div class="teacher-recommend-grid">
                    ${topicRecommendations.map((item) => `<div class="module-row-mini"><strong>${item.competency} - ${escapeHtml(item.topicTitle)}</strong><span>${item.message} ${item.suggestedGames ? `Juegos sugeridos: ${escapeHtml(item.suggestedGames)}.` : ""}</span></div>`).join("") || `<div class="module-empty">Todavia no hay recomendaciones.</div>`}
                  </div>
                </article>

                <article class="module-card" data-section-target="reports">
                  <div class="module-kicker">Ruta adaptativa</div>
                  <div class="teacher-recommend-grid">
                    ${adaptiveRoute ? `
                      <div class="module-row-mini"><strong>Temario actual</strong><span>${escapeHtml(adaptiveRoute.topicTitle)}</span></div>
                      <div class="module-row-mini"><strong>Competencia a reforzar</strong><span>${adaptiveRoute.competency}</span></div>
                      <div class="module-row-mini"><strong>Estado</strong><span>${adaptiveRoute.status}</span></div>
                      <div class="module-row-mini"><strong>Nivel sugerido</strong><span>${adaptiveRoute.level}</span></div>
                      <div class="module-row-mini"><strong>Proximo juego</strong><span>${escapeHtml(adaptiveRoute.nextGame)}</span></div>
                    ` : `<div class="module-empty">Sin ruta adaptativa disponible.</div>`}
                  </div>
                </article>

                <article class="module-card">
                  <div class="module-kicker">Historial por juego</div>
                  <div class="module-history-table">
                    <table class="teacher-history-table">
                      <thead>
                        <tr>
                          <th>Juego</th>
                          <th>Tema</th>
                          <th>Competencias</th>
                          <th>Puntuacion</th>
                          <th>Intentos</th>
                          <th>Tiempo</th>
                          <th>Estado</th>
                          <th>Nivel</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${selectedHistory.map((item) => `
                          <tr>
                            <td>${item.number}. ${escapeHtml(item.title)}</td>
                            <td>${escapeHtml(TOPICS.find((topic) => topic.id === item.topicId)?.title || item.topicId)}</td>
                            <td>${item.competencies.join(", ")}</td>
                            <td>${item.score}/100</td>
                            <td>${item.attempts}</td>
                            <td>${item.timeSpent ? formatRemaining(item.timeSpent) : formatMinutesLabel(item.assignedMinutes)}</td>
                            <td><span class="module-state-pill ${item.status === "Completado" ? "good" : item.status === "Pendiente" ? "warn" : "danger"}">${item.status}</span></td>
                            <td>${getScoreLevel(item.score)}</td>
                          </tr>
                        `).join("") || `<tr><td colspan="8">No hay juegos para este filtro.</td></tr>`}
                      </tbody>
                    </table>
                  </div>
                </article>
              ` : `
                <article class="module-card">
                  <div class="module-kicker">Detalle del estudiante</div>
                  <div class="module-empty">Selecciona un estudiante para ver su progreso detallado.</div>
                </article>
              `}
            </div>
          </div>
        </div>
      </div>
    `;

    host.appendChild(section);
    bindTeacherEvents(teacherId, section);
    bindTeacherDashboardEvents(teacherId, section);
  }

  function renderStudentModule(studentId) {
    const host = app.querySelector(".real-student .real-panel");
    const side = app.querySelector(".real-student .real-side");
    if (!host) return;
    host.querySelector(".classroom-student-shell")?.remove();
    side?.querySelector(".classroom-side-shell")?.remove();
    cleanupStudentAnalytics();

    const student = getStudents().find((item) => item.id === studentId);
    if (!student) return;
    const efemerides = getTodayEfemerides(student.teacherId);
    const reinforcements = getStudentReinforcements(student.teacherId, studentId);

    const shell = document.createElement("section");
    shell.className = "classroom-student-shell";
    shell.innerHTML = `
      ${efemerides.length ? `
        <article class="module-card module-student-banner">
          <div class="module-kicker">Efemerides de hoy</div>
          ${efemerides.map((item) => `
            <div class="module-stack">
              <strong>${escapeHtml(item.title)}</strong>
              <p>${escapeHtml(item.description)}</p>
            </div>
          `).join("")}
        </article>
      ` : ""}

      ${reinforcements.length ? `
        <article class="module-card">
          <div class="module-kicker">Refuerzo de ortografia</div>
          <div class="module-stack">
            ${reinforcements.map((item) => `
              <div class="module-orth-card" data-orth-card="${item.id}">
                <strong>${item.title}</strong>
                <p>${item.prompt}</p>
                <div class="module-options">
                  ${item.options.map((option) => `<button class="module-option" type="button" data-orth-option="${item.id}" data-value="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join("")}
                </div>
                <div class="module-actions-inline">
                  <button class="module-btn" type="button" data-orth-check="${item.id}">Verificar</button>
                  <span class="module-hint">${item.progress?.completed ? "Refuerzo aprobado" : item.clue}</span>
                </div>
              </div>
            `).join("")}
          </div>
        </article>
      ` : ""}
    `;
    const progressPanel = host.querySelector(".progress-panel");
    if (progressPanel) progressPanel.insertAdjacentElement("afterend", shell);
    else host.appendChild(shell);

    bindStudentEvents(studentId, shell);
    decorateStudentAccess(studentId);
  }

  function cleanupStudentAnalytics() {
    const studentRoot = app.querySelector(".real-student");
    if (!studentRoot) return;
    const blockedTitles = new Set([
      "Perfil del estudiante",
      "Debilidades detectadas",
      "Resultados por temario",
    ]);

    studentRoot.querySelectorAll(".module-card, .module-card-embedded, .module-topic-score-card").forEach((card) => {
      const title = card.querySelector(".module-kicker")?.textContent?.trim();
      if (title && blockedTitles.has(title)) {
        card.remove();
      }
    });
  }

  function bindTeacherEvents(teacherId, section) {
    section.querySelectorAll("[data-roster-move]").forEach((button) => {
      button.addEventListener("click", () => {
        const studentId = button.dataset.rosterMove;
        const direction = Number(button.dataset.direction);
        withStore((store) => {
          const teacher = ensureTeacherState(store, teacherId);
          const index = teacher.rosterOrder.indexOf(studentId);
          const next = index + direction;
          if (index < 0 || next < 0 || next >= teacher.rosterOrder.length) return;
          [teacher.rosterOrder[index], teacher.rosterOrder[next]] = [teacher.rosterOrder[next], teacher.rosterOrder[index]];
        });
      });
    });

    section.querySelectorAll("[data-activity-minutes]").forEach((select) => {
      select.addEventListener("change", () => {
        withStore((store) => {
          const teacher = ensureTeacherState(store, teacherId);
          const cfg = teacher.activities[select.dataset.activityMinutes] || { enabled: false, minutes: 10, startedAt: 0 };
          cfg.minutes = Number(select.value);
          teacher.activities[select.dataset.activityMinutes] = cfg;
        });
      });
    });

    section.querySelectorAll("[data-activity-start]").forEach((button) => {
      button.addEventListener("click", () => {
        withStore((store) => {
          const teacher = ensureTeacherState(store, teacherId);
          teacher.activities[button.dataset.activityStart] = {
            ...(teacher.activities[button.dataset.activityStart] || { minutes: 10 }),
            enabled: true,
            startedAt: Date.now(),
          };
        });
      });
    });

    section.querySelectorAll("[data-activity-stop]").forEach((button) => {
      button.addEventListener("click", () => {
        withStore((store) => {
          const teacher = ensureTeacherState(store, teacherId);
          teacher.activities[button.dataset.activityStop] = {
            ...(teacher.activities[button.dataset.activityStop] || { minutes: 10 }),
            enabled: false,
            startedAt: 0,
          };
        });
      });
    });

    section.querySelectorAll("[data-reinforcement-assign]").forEach((button) => {
      button.addEventListener("click", () => {
        const studentId = section.querySelector("#reinforcementStudent")?.value;
        if (!studentId) return;
        withStore((store) => {
          const teacher = ensureTeacherState(store, teacherId);
          teacher.reinforcements[studentId] = teacher.reinforcements[studentId] || {};
          teacher.reinforcements[studentId][button.dataset.reinforcementAssign] = {
            assigned: true,
            completed: false,
            attempts: 0,
            score: 0,
          };
        });
      });
    });

    section.querySelector("#efemeridesForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const id = section.querySelector("#efemeridesEditId")?.value || "";
      const date = section.querySelector("#efemeridesDate")?.value || TODAY();
      const title = section.querySelector("#efemeridesTitle")?.value.trim();
      const description = section.querySelector("#efemeridesDescription")?.value.trim();
      if (!title || !description) return;
      withStore((store) => {
        const teacher = ensureTeacherState(store, teacherId);
        if (id) {
          teacher.efemerides = teacher.efemerides.map((item) => item.id === id ? { ...item, date, title, description } : item);
        } else {
          teacher.efemerides.unshift({ id: `efe-${Date.now()}`, date, title, description });
        }
      });
    });

    section.querySelector("#efemeridesReset")?.addEventListener("click", () => {
      section.querySelector("#efemeridesEditId").value = "";
      section.querySelector("#efemeridesDate").value = TODAY();
      section.querySelector("#efemeridesTitle").value = "";
      section.querySelector("#efemeridesDescription").value = "";
    });

    section.querySelectorAll("[data-efemeride-edit]").forEach((button) => {
      button.addEventListener("click", () => {
        const teacher = ensureTeacherState(getStore(), teacherId);
        const item = (teacher.efemerides || []).find((entry) => entry.id === button.dataset.efemerideEdit);
        if (!item) return;
        section.querySelector("#efemeridesEditId").value = item.id;
        section.querySelector("#efemeridesDate").value = item.date;
        section.querySelector("#efemeridesTitle").value = item.title;
        section.querySelector("#efemeridesDescription").value = item.description;
      });
    });

    section.querySelectorAll("[data-efemeride-delete]").forEach((button) => {
      button.addEventListener("click", () => {
        withStore((store) => {
          const teacher = ensureTeacherState(store, teacherId);
          teacher.efemerides = (teacher.efemerides || []).filter((item) => item.id !== button.dataset.efemerideDelete);
        });
      });
    });

    section.querySelectorAll("[data-copy-code]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(button.dataset.copyCode || "");
          showToast("Codigo de clase copiado.");
        } catch {
          showToast("No se pudo copiar el codigo.");
        }
      });
    });

    section.querySelectorAll("[data-copy-link]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(button.dataset.copyLink || "");
          showToast("Link de clase copiado.");
        } catch {
          showToast("No se pudo copiar el link.");
        }
      });
    });

    section.querySelectorAll("[data-export-scores]").forEach((button) => {
      button.addEventListener("click", () => {
        downloadTeacherScoresCsv(teacherId);
        showToast("Planilla descargada.");
      });
    });

    section.querySelectorAll("[data-owner-home]").forEach((button) => {
      button.addEventListener("click", () => {
        localStorage.removeItem(KEYS.session);
        VIEW.teacherPrimedId = "";
        scheduleEnhance();
      });
    });
  }

  function bindTeacherDashboardEvents(teacherId, section) {
    section.querySelectorAll("[data-teacher-nav]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = section.querySelector(`[data-section-target="${button.dataset.teacherNav}"]`);
        section.querySelectorAll("[data-teacher-nav]").forEach((node) => node.classList.remove("active"));
        button.classList.add("active");
        target?.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
      });
    });

    section.querySelectorAll("[data-student-select]").forEach((button) => {
      button.addEventListener("click", () => {
        withStore((store) => {
          const teacher = ensureTeacherState(store, teacherId);
          teacher.dashboard.selectedStudentId = button.dataset.studentSelect;
          teacher.dashboard.detailOpen = true;
        });
      });
    });

    section.querySelectorAll("[data-clear-selection]").forEach((button) => {
      button.addEventListener("click", () => {
        withStore((store) => {
          const teacher = ensureTeacherState(store, teacherId);
          teacher.dashboard.selectedStudentId = "";
          teacher.dashboard.detailOpen = false;
        });
      });
    });

    section.querySelectorAll("[data-activity-topic]").forEach((button) => {
      button.addEventListener("click", () => {
        withStore((store) => {
          const teacher = ensureTeacherState(store, teacherId);
          teacher.dashboard.activityTopic = button.dataset.activityTopic;
        });
      });
    });

    const search = section.querySelector("[data-dashboard-search]");
    search?.addEventListener("input", () => {
      withStore((store) => {
        const teacher = ensureTeacherState(store, teacherId);
        teacher.dashboard.search = search.value;
      });
    });

    ["topic", "competency", "date", "flag"].forEach((key) => {
      const select = section.querySelector(`[data-dashboard-${key}]`);
      select?.addEventListener("change", () => {
        withStore((store) => {
          const teacher = ensureTeacherState(store, teacherId);
          teacher.dashboard[key] = select.value;
        });
      });
    });
  }

  function bindStudentEvents(studentId, shell) {
    const student = getStudents().find((item) => item.id === studentId);
    if (!student) return;

    shell.querySelectorAll("[data-orth-option]").forEach((button) => {
      button.addEventListener("click", () => {
        const card = button.closest("[data-orth-card]");
        card?.querySelectorAll("[data-orth-option]").forEach((node) => node.classList.remove("selected"));
        button.classList.add("selected");
      });
    });

    shell.querySelectorAll("[data-orth-check]").forEach((button) => {
      button.addEventListener("click", () => {
        const card = button.closest("[data-orth-card]");
        const selected = card?.querySelector("[data-orth-option].selected");
        const reinforcement = ORTHOGRAPHY_REINFORCEMENTS.find((item) => item.id === button.dataset.orthCheck);
        if (!selected || !reinforcement) return;
        const correct = selected.dataset.value === reinforcement.answer;
        withStore((store) => {
          const teacher = ensureTeacherState(store, student.teacherId);
          teacher.reinforcements[studentId] = teacher.reinforcements[studentId] || {};
          teacher.reinforcements[studentId][reinforcement.id] = {
            assigned: true,
            completed: correct,
            attempts: (teacher.reinforcements[studentId][reinforcement.id]?.attempts || 0) + 1,
            score: correct ? 100 : 0,
          };
        });
      });
    });
  }

  function decorateStudentAccess(studentId) {
    app.querySelectorAll(".activity-box[data-oa]").forEach((button) => {
      const access = getActivityAccess(studentId, button.dataset.oa);
      button.classList.toggle("module-locked", !access.open);
      button.disabled = !access.open;
      let note = button.querySelector(".module-lock-note");
      if (!note) {
        note = document.createElement("div");
        note.className = "module-lock-note";
        button.appendChild(note);
      }
      note.textContent = access.open ? `Tiempo disponible: ${formatRemaining(access.remainingMs)}` : access.reason;
    });

    const playCard = app.querySelector(".play-card[data-g]");
    if (!playCard) return;
    const activityId = playCard.dataset.g;
    const access = getActivityAccess(studentId, activityId);
    let chip = playCard.querySelector(".module-timer-chip");
    if (!chip) {
      chip = document.createElement("span");
      chip.className = "module-timer-chip";
      playCard.querySelector(".play-top .real-meta")?.appendChild(chip);
    }
    chip.textContent = access.open ? `Tiempo: ${formatRemaining(access.remainingMs)}` : "Bloqueada";

    playCard.querySelector(".classroom-lock-panel")?.remove();
    playCard.querySelectorAll("button, input, textarea, select").forEach((element) => {
      const keep = element.matches("[data-ba], [data-bt], #studentBack");
      element.disabled = !keep && !access.open;
    });

    if (!access.open) {
      const block = document.createElement("div");
      block.className = "classroom-lock-panel";
      block.innerHTML = `<strong>Actividad bloqueada</strong><p>${escapeHtml(access.reason)}</p>`;
      playCard.querySelector(".action-row")?.insertAdjacentElement("beforebegin", block);
    }
  }

  function enhanceWelcome() {
    return;
  }

  function showToast(text) {
    app.querySelector(".module-toast")?.remove();
    const toast = document.createElement("div");
    toast.className = "module-toast";
    toast.textContent = text;
    app.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  }

  function handleBlockedClicks(event) {
    const session = getSession();
    if (!session || session.role !== "student") return;
    const activity = event.target.closest("[data-oa]");
    if (!activity) return;
    const access = getActivityAccess(session.id, activity.dataset.oa);
    if (!access.open) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showToast(access.reason);
    }
  }

  function buildSignature() {
    const session = getSession();
    const store = getStore();
    if (!session) return `welcome:${store.updatedAt || 0}`;
    return JSON.stringify({ role: session.role, id: session.id, updatedAt: store.updatedAt || 0, route: app.textContent.length });
  }

  function ensureLockedNames() {
    const store = getStore();
    let changed = false;
    getStudents().forEach((student) => {
      if (!store.students[student.id]?.lockedName) {
        store.students[student.id] = store.students[student.id] || {};
        store.students[student.id].lockedName = student.name;
        changed = true;
      }
    });
    if (changed) saveStore(store);
  }

  function enhance() {
    if (VIEW.busy) return;
    VIEW.busy = true;
    VIEW.mute = true;
    try {
      syncOwnerSessionFromUrl();
      ensureLockedNames();
      const session = getSession();
      if (!session) {
        enhanceWelcome();
      } else if (session.role === "teacher") {
        if (!localStorage.getItem("yoyo_owner_teacher_id")) {
          localStorage.setItem("yoyo_owner_teacher_id", session.id);
        }
        if (VIEW.teacherPrimedId !== session.id) {
          withStore((store) => {
            const teacher = ensureTeacherState(store, session.id);
            teacher.dashboard.selectedStudentId = "";
            teacher.dashboard.detailOpen = false;
          });
          VIEW.teacherPrimedId = session.id;
        }
        renderTeacherModule(session.id);
      } else if (session.role === "student") {
        renderStudentModule(session.id);
        cleanupStudentAnalytics();
      }
      VIEW.signature = buildSignature();
      ensureTimer();
    } catch (error) {
      console.error("Classroom management render error:", error);
      app.innerHTML = `
        <section class="classroom-admin-shell">
          <article class="module-card">
            <div class="module-kicker">YOYO</div>
            <h3>No se pudo cargar el panel</h3>
            <p>${escapeHtml(error?.message || "Error desconocido")}</p>
          </article>
        </section>
      `;
    } finally {
      setTimeout(() => {
        VIEW.busy = false;
        VIEW.mute = false;
      }, 0);
    }
  }

  function scheduleEnhance() {
    const next = buildSignature();
    const session = getSession();
    const missingTeacher = !!session && session.role === "teacher" && !app.querySelector(".classroom-admin-shell");
    const missingStudent = !!session && session.role === "student" && !app.querySelector(".classroom-student-shell");
    if (next === VIEW.signature && !missingTeacher && !missingStudent) {
      if (session?.role === "student") decorateStudentAccess(session.id);
      return;
    }
    requestAnimationFrame(enhance);
  }

  function ensureTimer() {
    if (VIEW.timer) return;
    VIEW.timer = setInterval(() => {
      const session = getSession();
      if (session?.role === "student") decorateStudentAccess(session.id);
      if (!session || session?.role === "teacher") scheduleEnhance();
    }, 1000);
  }

  function injectStyles() {
    if (document.getElementById("classroom-management-style")) return;
    const style = document.createElement("style");
    style.id = "classroom-management-style";
    style.textContent = `
      .classroom-admin-shell,.classroom-student-shell,.classroom-side-shell{display:grid;gap:18px;margin-top:18px}
      .module-grid{display:grid;gap:16px}
      .module-grid-2{grid-template-columns:repeat(2,minmax(0,1fr))}
      .module-card,.module-card-tight,.module-card-embedded{padding:20px;border-radius:28px;background:linear-gradient(180deg,#ffffff,#faf7ff);box-shadow:0 18px 32px rgba(93,104,152,.12);border:1px solid rgba(148,163,184,.12)}
      .module-card-embedded{padding:16px;background:linear-gradient(180deg,#fffefb,#f7f2ff)}
      .module-kicker{font-size:12px;text-transform:uppercase;letter-spacing:.08em;font-weight:900;color:#7b36eb;margin-bottom:8px}
      .module-mini-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
      .module-competency-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
      .module-stat,.module-competency-card{padding:14px;border-radius:20px;background:linear-gradient(135deg,#eef5ff,#fff5e8);display:grid;gap:6px}
      .module-stat strong,.module-competency-card span{font-size:1.5rem;color:#1f5ec5}
      .module-stat span,.module-competency-card small,.module-row span,.module-empty,.module-hint,.module-card-tight p{color:#5d6a84;line-height:1.55}
      .module-stack{display:grid;gap:12px}
      .module-row,.module-activity-row{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:14px 16px;border-radius:20px;background:linear-gradient(135deg,#f6f8ff,#fff9ef)}
      .module-row strong,.module-activity-row strong,.module-student-profile summary{color:#284375}
      .module-actions-inline,.module-options{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
      .module-btn,.module-option{border:none;border-radius:16px;padding:10px 14px;font:inherit;font-weight:900;cursor:pointer}
      .module-btn{background:linear-gradient(135deg,#1f70ff,#7b36eb);color:#fff}
      .module-btn.ghost{background:rgba(123,54,235,.12);color:#7b36eb}
      .module-btn:disabled{opacity:.45;cursor:not-allowed}
      .module-select,.module-input{width:100%;padding:12px 14px;border-radius:16px;border:2px solid rgba(123,54,235,.12);background:#fff;font:inherit}
      .module-label{display:grid;gap:8px;color:#42506b;font-weight:800}
      .module-topic{border-radius:22px;background:rgba(255,255,255,.7);padding:14px 16px;border:1px solid rgba(148,163,184,.14)}
      .module-topic summary{display:flex;justify-content:space-between;gap:10px;cursor:pointer;font-weight:900}
      .module-row-mini{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid rgba(148,163,184,.12)}
      .module-badge{display:inline-flex;padding:8px 10px;border-radius:999px;background:rgba(123,54,235,.12);color:#7b36eb;font-weight:900}
      .module-topic-score-card{padding:14px;border-radius:22px;background:linear-gradient(135deg,#fffef8,#f4f2ff);display:grid;gap:12px}
      .module-orth-card{padding:16px;border-radius:22px;background:linear-gradient(135deg,#fffef8,#f4f2ff);display:grid;gap:10px}
      .module-option{background:#eef3fb;color:#41516c}
      .module-option.selected{background:linear-gradient(135deg,#ffe28f,#ffb862);color:#6f4300}
      .module-lock-note{margin-top:10px;padding:10px 12px;border-radius:16px;background:rgba(123,54,235,.08);color:#5d6a84;font-weight:800;line-height:1.45}
      .module-timer-chip{display:inline-flex;align-items:center;padding:10px 14px;border-radius:999px;background:linear-gradient(135deg,#ffecb1,#ffd978);color:#865800;font-weight:900}
      .classroom-lock-panel{padding:16px 18px;border-radius:24px;background:linear-gradient(135deg,#fff3f3,#ffe0e0);color:#99353b;display:grid;gap:8px}
      .module-login-note{margin-top:8px;color:#5d6a84;line-height:1.5;font-size:.92rem}
      .module-toast{position:fixed;bottom:20px;right:20px;z-index:60;max-width:320px;padding:14px 16px;border-radius:18px;background:linear-gradient(135deg,#1f70ff,#7b36eb);color:#fff;box-shadow:0 18px 34px rgba(66,82,179,.26);font-weight:800}
      .classroom-admin-dashboard{gap:16px}
      .module-summary-bar{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}
      .module-summary-pill{padding:16px 18px;border-radius:22px;background:linear-gradient(135deg,#ffffff,#f7f3ff);box-shadow:0 16px 30px rgba(93,104,152,.10);display:grid;gap:6px}
      .module-summary-pill strong{font-size:1.35rem;color:#1f5ec5}
      .module-summary-pill span{color:#5d6a84}
      .teacher-dashboard-shell{display:grid;grid-template-columns:280px minmax(480px,1.2fr) 380px;gap:18px;align-items:start}
      .teacher-left-column,.teacher-center-column,.teacher-right-column{display:grid;gap:16px;align-self:start}
      .module-mini-grid-compact{grid-template-columns:repeat(2,minmax(0,1fr))}
      .module-filter-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .teacher-left-column .module-filter-grid{grid-template-columns:1fr}
      .teacher-left-column .module-activity-grid{grid-template-columns:1fr}
      .teacher-left-column .module-card{padding:18px}
      .module-tone-good{background:linear-gradient(135deg,#edfdf3,#f7fff9)}
      .module-tone-warn{background:linear-gradient(135deg,#fff8e8,#fff3da)}
      .module-tone-danger{background:linear-gradient(135deg,#fff1f1,#ffe6e6)}
      .module-state-pill{display:inline-flex;align-items:center;justify-content:center;padding:7px 10px;border-radius:999px;font-size:.78rem;font-weight:900}
      .module-state-pill.good{background:#dcfce7;color:#15803d}
      .module-state-pill.warn{background:#fef3c7;color:#b45309}
      .module-state-pill.danger{background:#fee2e2;color:#b91c1c}
      .module-topic-chip-row,.module-chip-row{display:flex;flex-wrap:wrap;gap:8px}
      .module-chip-toggle,.module-mini-chip{border:none;border-radius:999px;padding:8px 12px;font:inherit;font-weight:800}
      .module-chip-toggle{background:#eef2ff;color:#5b4ac7;cursor:pointer}
      .module-chip-toggle.active{background:linear-gradient(135deg,#1f70ff,#7b36eb);color:#fff}
      .module-mini-chip{background:#f3ebff;color:#6d28d9}
      .module-activity-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .module-activity-card{padding:14px;border-radius:22px;background:linear-gradient(135deg,#fffef8,#f6f8ff);display:grid;gap:10px;border:1px solid rgba(148,163,184,.14)}
      .module-activity-head,.module-activity-meta,.teacher-detail-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
      .module-select-sm{min-width:88px}
      .teacher-student-table{display:grid;gap:10px}
      .teacher-student-table-head{display:grid;grid-template-columns:minmax(220px,1.4fr) 90px 90px 130px minmax(180px,1fr);gap:12px;padding:0 12px;color:#6d28d9;font-size:.78rem;font-weight:900;text-transform:uppercase;letter-spacing:.06em}
      .teacher-student-list{display:grid;gap:10px;max-height:calc(100vh - 250px);overflow:auto;padding-right:4px}
      .teacher-student-row{border:none;width:100%;text-align:left;padding:14px 16px;border-radius:22px;background:linear-gradient(135deg,#ffffff,#f8f5ff);box-shadow:0 12px 24px rgba(93,104,152,.08);display:grid;grid-template-columns:minmax(220px,1.4fr) 90px 90px 130px minmax(180px,1fr);gap:12px;align-items:center;cursor:pointer}
      .teacher-student-row.selected{outline:3px solid rgba(123,54,235,.25);background:linear-gradient(135deg,#f8f5ff,#eef6ff)}
      .teacher-student-col{display:grid;gap:4px;align-items:center}
      .teacher-student-main{display:flex;gap:12px;align-items:center}
      .teacher-student-avatar{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;font-weight:900;color:#6d28d9;background:linear-gradient(135deg,#ede9fe,#fde7ff)}
      .teacher-student-main strong{display:block;color:#284375}
      .teacher-student-main span,.teacher-row-note,.teacher-detail-head p{color:#5d6a84}
      .teacher-student-side{display:grid;gap:8px}
      .teacher-mini-bars{display:grid;gap:6px}
      .teacher-mini-bar{display:grid;grid-template-columns:32px 1fr;gap:8px;align-items:center}
      .teacher-mini-bar label{font-size:.78rem;font-weight:900;color:#6d28d9}
      .teacher-mini-bar span{display:block;height:8px;border-radius:999px;background:#eef2ff;overflow:hidden}
      .module-bar-fill{display:block;height:100%;border-radius:999px;background:#22c55e}
      .module-bar-fill.warn{background:#f59e0b}
      .module-bar-fill.danger{background:#ef4444}
      .teacher-detail-head h3{margin:0;color:#284375}
      .teacher-detail-head p{margin:4px 0 0}
      .teacher-detail-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
      .teacher-right-column{position:sticky;top:16px;max-height:calc(100vh - 96px);overflow:auto;padding-right:4px}
      .module-history-table{overflow:auto}
      .teacher-history-table{width:100%;border-collapse:collapse;font-size:.92rem}
      .teacher-history-table th,.teacher-history-table td{padding:10px 8px;border-bottom:1px solid rgba(148,163,184,.14);text-align:left;vertical-align:top}
      .teacher-history-table th{color:#6d28d9;font-size:.78rem;text-transform:uppercase;letter-spacing:.06em}
      .teacher-history-table td{color:#42506b}
      .module-collapsible{padding:0;overflow:hidden}
      .module-collapsible-summary{padding:18px 20px;cursor:pointer;font-weight:900;color:#284375;list-style:none}
      .module-collapsible[open]>.module-collapsible-summary{border-bottom:1px solid rgba(148,163,184,.12)}
      .module-collapsible > *:not(summary){padding:0 20px 20px}
      .teacher-utility-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
      .classroom-admin-dashboard-v2{width:100%;max-width:none}
      .classroom-dashboard-root{display:block;width:100%}
      .teacher-shell-wide{display:grid;grid-template-columns:180px minmax(0,1fr);gap:24px;align-items:start}
      .teacher-nav-rail{min-height:calc(100vh - 120px);padding:24px 18px;border-radius:30px;background:linear-gradient(180deg,#ffffff,#f8f4ff);box-shadow:0 18px 40px rgba(93,104,152,.12);display:grid;grid-template-rows:auto 1fr auto;gap:22px}
      .teacher-brand-block{display:grid;gap:4px}
      .teacher-brand-block strong{font-size:1.8rem;color:#6d28d9}
      .teacher-brand-block span,.teacher-rail-footer span{color:#5d6a84}
      .teacher-rail-menu{display:grid;gap:10px}
      .teacher-rail-link{border:none;background:transparent;color:#52627f;padding:12px 14px;border-radius:16px;text-align:left;font:inherit;font-weight:800}
      .teacher-rail-link.active{background:linear-gradient(135deg,#efe8ff,#eef5ff);color:#6d28d9}
      .teacher-rail-footer{display:grid;gap:4px;padding-top:14px;border-top:1px solid rgba(148,163,184,.12)}
      .teacher-workspace{display:grid;gap:18px;min-width:0}
      .teacher-page-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;padding:6px 4px}
      .teacher-page-head h2{margin:0;color:#284375;font-size:2rem}
      .teacher-page-head p{margin:6px 0 0;color:#5d6a84;max-width:720px}
      .teacher-head-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}
      .teacher-summary-bar-wide{grid-template-columns:repeat(6,minmax(0,1fr))}
      .teacher-dashboard-shell-v2{grid-template-columns:260px minmax(0,1fr);gap:24px;align-items:start}
      .teacher-dashboard-shell-v2.detail-open{grid-template-columns:260px minmax(540px,1.3fr) 420px}
      .teacher-left-column-v2,.teacher-center-column-v2,.teacher-right-column-v2{display:grid;gap:18px;min-width:0;align-self:start}
      .teacher-center-column-v2 .module-card,.teacher-right-column-v2 .module-card,.teacher-left-column-v2 .module-card{height:auto}
      .teacher-filter-grid-wide{grid-template-columns:1fr}
      .teacher-activity-grid-wide{grid-template-columns:1fr}
      .teacher-students-card{min-height:calc(100vh - 230px)}
      .teacher-dashboard-shell-v2:not(.detail-open) .teacher-student-table-head-v2{grid-template-columns:minmax(280px,1.6fr) 180px 140px 110px 220px}
      .teacher-dashboard-shell-v2:not(.detail-open) .teacher-student-row-v2{grid-template-columns:minmax(280px,1.6fr) 180px 140px 110px 220px}
      .teacher-card-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:14px}
      .teacher-card-head h3{margin:0;color:#284375}
      .teacher-card-head p{margin:6px 0 0;color:#5d6a84}
      .teacher-student-table-head-v2{grid-template-columns:minmax(240px,1.35fr) 150px 120px 90px 180px}
      .teacher-student-row-v2{grid-template-columns:minmax(240px,1.35fr) 150px 120px 90px 180px;padding:16px 18px}
      .teacher-student-row-v2 strong{color:#284375}
      .teacher-progress-line{width:100%;height:8px;border-radius:999px;background:#edf2ff;overflow:hidden;margin-top:6px}
      .teacher-progress-line .module-bar-fill{height:100%}
      .teacher-detail-top{display:grid;grid-template-columns:140px 1fr;gap:14px;align-items:stretch}
      .teacher-ring-metric{border-radius:24px;padding:18px;background:linear-gradient(135deg,#eef8ff,#f9f0ff);display:grid;place-items:center;text-align:center;gap:6px}
      .teacher-ring-metric strong{font-size:2rem;color:#1f5ec5}
      .teacher-ring-metric span{color:#5d6a84}
      .teacher-split-panels{display:grid;grid-template-columns:1.1fr .9fr;gap:14px}
      .teacher-strength-list{display:grid;gap:10px;align-content:start}
      .teacher-topic-bars{display:grid;gap:10px}
      .teacher-topic-bar{display:grid;grid-template-columns:34px 1fr 42px;gap:8px;align-items:center}
      .teacher-topic-bar label{font-size:.82rem;font-weight:900;color:#6d28d9}
      .teacher-topic-bar span{display:block;height:10px;border-radius:999px;background:#edf2ff;overflow:hidden}
      .teacher-topic-bar strong{text-align:right;color:#42506b;font-size:.84rem}
      .teacher-recommend-grid{display:grid;gap:10px}
      .teacher-center-insights{display:grid;grid-template-columns:1.1fr .9fr;gap:18px}
      .teacher-topic-overview-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .teacher-right-column-v2{max-height:calc(100vh - 150px);overflow:auto;padding-right:6px}
      .teacher-right-column-v2.detail-hidden{display:none}
      .teacher-right-column-v2 .module-card{scroll-margin-top:20px}
      @media (max-width:1180px){
        .module-summary-bar{grid-template-columns:repeat(3,minmax(0,1fr))}
        .teacher-dashboard-shell{grid-template-columns:minmax(280px,1fr) minmax(320px,1fr)}
        .teacher-right-column{grid-column:1 / -1;position:static;max-height:none;overflow:visible;padding-right:0}
        .teacher-utility-row{grid-template-columns:1fr}
        .teacher-shell-wide{grid-template-columns:1fr}
        .teacher-nav-rail{min-height:auto;grid-template-rows:auto auto auto}
        .teacher-dashboard-shell-v2,.teacher-dashboard-shell-v2.detail-open{grid-template-columns:minmax(280px,1fr) minmax(320px,1fr)}
        .teacher-right-column-v2{grid-column:1 / -1;max-height:none;overflow:visible;padding-right:0}
        .teacher-summary-bar-wide{grid-template-columns:repeat(3,minmax(0,1fr))}
      }
      @media (max-width:980px){
        .module-grid-2,.module-mini-grid,.module-competency-grid,.teacher-detail-metrics,.module-summary-bar,.module-activity-grid,.module-filter-grid,.teacher-utility-row{grid-template-columns:1fr}
        .teacher-dashboard-shell{grid-template-columns:1fr}
        .module-row,.module-activity-row,.module-activity-head,.module-activity-meta,.teacher-detail-head{flex-direction:column;align-items:flex-start}
        .teacher-student-table-head{display:none}
        .teacher-student-row{grid-template-columns:1fr}
        .teacher-page-head,.teacher-card-head{flex-direction:column;align-items:flex-start}
        .teacher-dashboard-shell-v2,.teacher-dashboard-shell-v2.detail-open,.teacher-shell-wide,.teacher-split-panels,.teacher-detail-top,.teacher-center-insights,.teacher-topic-overview-grid{grid-template-columns:1fr}
        .teacher-summary-bar-wide,.teacher-filter-grid-wide{grid-template-columns:1fr}
        .teacher-student-row-v2{grid-template-columns:1fr}
      }
    `;
    document.head.appendChild(style);
  }

  injectStyles();
  document.addEventListener("click", handleBlockedClicks, true);
  window.addEventListener("storage", scheduleEnhance);
  scheduleEnhance();
})();
