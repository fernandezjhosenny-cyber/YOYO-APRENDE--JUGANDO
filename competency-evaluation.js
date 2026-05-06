if (typeof window !== "undefined" && typeof document !== "undefined") {
  var __source = (function () {/*
(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const KEYS = {
    session: "yoyo_rg_x",
    students: "yoyo_rg_s",
    progress: "yoyo_rg_p",
    evalStore: "yoyo_comp_eval",
    evalConfig: "yoyo_comp_eval_cfg",
    order: "yoyo_radial_order_state",
    fill: "yoyo_radial_fill_state",
    classify: "yoyo_radial_classify_state",
    memory: "yoyo_radial_memory_state",
    detective: "yoyo_radial_detective_state",
    cubes: "yoyo_radial_cubes_state",
    pair: "yoyo_radial_pair_state",
    wordsearch: "yoyo_radial_wordsearch_state",
    timeline: "yoyo_radial_timeline_state",
    studio: "yoyo_radial_studio_state",
  };

  const CONFIG_DEFAULTS = {
    attemptPolicy: "best",
    reinforcementBelow: 60,
  };

  const COMPETENCIES = {
    C1: {
      short: "Competencia Comunicativa",
      full:
        "Comunica sus ideas, pensamientos y sentimientos con fluidez, mediante un modelo textual conveniente, en variadas situaciones y contextos, con el fin de demostrar conocimiento y uso adecuado de su lengua, a traves de diferentes medios y recursos.",
    },
    C2: {
      short: "Pensamiento logico, creativo y critico",
      full:
        "Elabora textos orales y escritos con creatividad y criticidad segun las conclusiones de los problemas abordados en investigaciones, y las publica a traves de medios variados.",
    },
    C3: {
      short: "Ambiental, salud, etica y ciudadania",
      full:
        "Caracteriza problemas sociales diversos, a traves de textos orales y escritos, con la finalidad de solucionarlos, canalizando emociones, sentimientos, relaciones humanas, asi como la preservacion de la salud y el ambiente, mediante el uso de recursos diversos.",
    },
  };

  const GAME_META = {
    "anuncio-1": {
      label: "1. Ordena la estructura",
      competencies: ["C1"],
      maxRaw: 60,
      levelCount: 4,
      reinforcement:
        "Refuerzo sugerido: volver a organizar la llamada, la presentacion, la argumentacion y el cierre con tarjetas guiadas.",
      extractor: (studentId) => extractSummedState(KEYS.order, studentId, { levelCount: 4 }),
    },
    "anuncio-2": {
      label: "2. Completa con arrastre",
      competencies: ["C1"],
      maxRaw: 40,
      levelCount: 4,
      reinforcement:
        "Refuerzo sugerido: completar anuncios con banco de palabras, cuidando coherencia, vocabulario y cierre persuasivo.",
      extractor: (studentId) => extractSummedState(KEYS.fill, studentId, { levelCount: 4 }),
    },
    "anuncio-3": {
      label: "3. Clasifica por colores",
      competencies: ["C1"],
      maxRaw: 60,
      levelCount: 4,
      reinforcement:
        "Refuerzo sugerido: clasificar oraciones interrogativas, imperativas e informativas dentro de anuncios radiales.",
      extractor: (studentId) => extractSummedState(KEYS.classify, studentId, { levelCount: 4 }),
    },
    "anuncio-4": {
      label: "4. Memoria visual",
      competencies: ["C1", "C2"],
      maxRaw: 200,
      levelCount: 4,
      reinforcement:
        "Refuerzo sugerido: practicar parejas de conceptos y ejemplos del anuncio radial para fortalecer memoria y asociacion.",
      extractor: (studentId) => extractMemoryState(studentId),
    },
    "anuncio-5": {
      label: "5. Detective del anuncio",
      competencies: ["C2", "C3"],
      maxRaw: 160,
      levelCount: 4,
      reinforcement:
        "Refuerzo sugerido: analizar anuncios sociales y comerciales identificando intencion, publico, problema y accion propuesta.",
      extractor: (studentId) => extractDetectiveState(studentId),
    },
    "anuncio-6": {
      label: "6. Cubos 3D",
      competencies: ["C1", "C2"],
      maxRaw: 75,
      levelCount: 5,
      reinforcement:
        "Refuerzo sugerido: reconstruir anuncios con frases mezcladas y distinguir cubos distractores antes de verificar.",
      extractor: (studentId) => extractSummedState(KEYS.cubes, studentId, { levelCount: 5, hintMode: "boolean" }),
    },
    "anuncio-7": {
      label: "7. Relaciona ideas",
      competencies: ["C1", "C2"],
      maxRaw: 235,
      levelCount: 5,
      reinforcement:
        "Refuerzo sugerido: relacionar partes, funciones, recursos persuasivos y ejemplos del anuncio radial.",
      extractor: (studentId) => extractPairState(studentId),
    },
    "anuncio-8": {
      label: "8. Sopa de palabras",
      competencies: ["C1"],
      maxRaw: 385,
      levelCount: 5,
      reinforcement:
        "Refuerzo sugerido: reforzar vocabulario del anuncio radial con lectura guiada, definiciones cortas y busqueda dirigida.",
      extractor: (studentId) => extractWordsearchState(studentId),
    },
    "anuncio-9": {
      label: "9. Linea del tiempo",
      competencies: ["C2"],
      maxRaw: 75,
      levelCount: 5,
      reinforcement:
        "Refuerzo sugerido: ordenar nuevamente el proceso de planificacion, redaccion, revision y presentacion del anuncio radial.",
      extractor: (studentId) => extractSummedState(KEYS.timeline, studentId, { levelCount: 5, hintMode: "count" }),
    },
    "anuncio-10": {
      label: "10. Mi anuncio en la radio",
      competencies: ["C1", "C2", "C3"],
      maxRaw: 145,
      levelCount: 3,
      reinforcement:
        "Refuerzo sugerido: revisar el guion, fortalecer la pregunta inicial, el cierre imperativo y la claridad del audio grabado.",
      extractor: (studentId) => extractStudioState(studentId),
    },
  };

  let lastRenderSignature = "";
  let refreshQueued = false;

  injectStyles();
  ensureConfig();

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

  function ensureConfig() {
    const current = readJson(KEYS.evalConfig, null);
    if (!current) writeJson(KEYS.evalConfig, CONFIG_DEFAULTS);
  }

  function getConfig() {
    return { ...CONFIG_DEFAULTS, ...readJson(KEYS.evalConfig, {}) };
  }

  function getSession() {
    return readJson(KEYS.session, null);
  }

  function getStudents() {
    return readJson(KEYS.students, []);
  }

  function getProgressStore() {
    return readJson(KEYS.progress, {});
  }

  function getEvalStore() {
    return readJson(KEYS.evalStore, {});
  }

  function sumNumbers(source) {
    if (!source || typeof source !== "object") return 0;
    return Object.values(source).reduce((sum, value) => sum + (typeof value === "number" ? value : 0), 0);
  }

  function countPositive(source) {
    if (!source || typeof source !== "object") return 0;
    return Object.values(source).filter((value) => typeof value === "number" && value > 0).length;
  }

  function countTruthy(source) {
    if (!source || typeof source !== "object") return 0;
    return Object.values(source).filter(Boolean).length;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function toPercent(rawScore, maxRaw) {
    if (!maxRaw) return 0;
    return clamp(Math.round((rawScore / maxRaw) * 100), 0, 100);
  }

  function labelForScore(score, completed) {
    if (!completed) return "Pendiente";
    if (score >= 90) return "Excelente";
    if (score >= 80) return "Muy bueno";
    if (score >= 70) return "Aprobado";
    if (score >= 60) return "Necesita mejorar";
    return "Reprobado / Quemado";
  }

  function readStateByStudent(key, studentId) {
    const bag = readJson(key, {});
    return bag?.[studentId] || null;
  }

  function normalizeFallbackProgress(studentId, gameId, maxRaw) {
    const entry = getProgressStore()?.[studentId]?.[gameId];
    if (!entry) return null;
    const rawBase =
      typeof entry.finalScore === "number"
        ? entry.finalScore
        : typeof entry.score === "number"
        ? entry.score
        : 0;
    const rawScore = clamp(rawBase * 10, 0, maxRaw);
    const completed = Boolean(entry.completed || entry.ok || entry.attempted);
    return {
      rawScore,
      completed,
      attempts: entry.attemptCount || 0,
      hints: 0,
      errors: Math.max(0, 10 - rawBase),
      levelCount: completed ? 1 : 0,
      meaningful: completed || rawScore > 0,
    };
  }

  function extractSummedState(key, studentId, options) {
    const state = readStateByStudent(key, studentId);
    if (!state) return null;
    const levelCount = options.levelCount || 0;
    const attempts = sumNumbers(state.attempts);
    const rawScore = sumNumbers(state.scores);
    const completedLevels = Math.max(countPositive(state.scores), countTruthy(state.solved));
    let hints = 0;
    if (options.hintMode === "count") hints = sumNumbers(state.hints);
    if (options.hintMode === "boolean") hints = countTruthy(state.hintUsed);
    const completed = Boolean(state.finished) || completedLevels >= levelCount;
    return {
      rawScore,
      completed,
      attempts,
      hints,
      errors: Math.max(0, attempts - completedLevels),
      levelCount: completedLevels,
      meaningful: rawScore > 0 || attempts > 0 || hints > 0 || completed,
    };
  }

  function extractMemoryState(studentId) {
    const state = readStateByStudent(KEYS.memory, studentId);
    if (!state) return null;
    const attempts = sumNumbers(state.attempts);
    const rawScore = sumNumbers(state.scores);
    const completedLevels = countPositive(state.scores);
    return {
      rawScore,
      completed: Boolean(state.finished) || completedLevels >= 4,
      attempts,
      hints: 0,
      errors: Math.max(0, attempts - completedLevels),
      levelCount: completedLevels,
      meaningful: rawScore > 0 || attempts > 0 || completedLevels > 0,
    };
  }

  function extractDetectiveState(studentId) {
    const state = readStateByStudent(KEYS.detective, studentId);
    if (!state) return null;
    const rawScore = sumNumbers(state.scores);
    const checkedCases = countTruthy(state.checked);
    const solvedQuestions = Math.round(rawScore / 10);
    return {
      rawScore,
      completed: Boolean(state.finished) || checkedCases >= 4,
      attempts: checkedCases,
      hints: 0,
      errors: Math.max(0, 16 - solvedQuestions),
      levelCount: checkedCases,
      meaningful: rawScore > 0 || checkedCases > 0,
    };
  }

  function extractPairState(studentId) {
    const state = readStateByStudent(KEYS.pair, studentId);
    if (!state) return null;
    const rawScore = sumNumbers(state.scores);
    const attempts = sumNumbers(state.attempts);
    const completedLevels = Math.max(countTruthy(state.solved), countPositive(state.scores));
    const correctRelations = Object.values(state.scores || {}).reduce(
      (sum, value) => sum + Math.floor((value || 0) / 10),
      0
    );
    return {
      rawScore,
      completed: Boolean(state.finished) || completedLevels >= 5,
      attempts,
      hints: 0,
      errors: Math.max(0, 21 - correctRelations),
      levelCount: completedLevels,
      meaningful: rawScore > 0 || attempts > 0 || completedLevels > 0,
    };
  }

  function extractWordsearchState(studentId) {
    const state = readStateByStudent(KEYS.wordsearch, studentId);
    if (!state) return null;
    const rawScore = sumNumbers(state.scores);
    const hints = sumNumbers(state.hints);
    const completedLevels = countPositive(state.scores);
    const foundWords = Object.values(state.found || {}).reduce(
      (sum, value) => sum + (Array.isArray(value) ? value.length : 0),
      0
    );
    return {
      rawScore,
      completed: Boolean(state.finished) || completedLevels >= 5,
      attempts: foundWords,
      hints,
      errors: 0,
      levelCount: completedLevels,
      meaningful: rawScore > 0 || foundWords > 0 || hints > 0 || completedLevels > 0,
    };
  }

  function extractStudioState(studentId) {
    const state = readStateByStudent(KEYS.studio, studentId);
    if (!state) return null;
    const rawScore =
      (state.classifyScore || 0) +
      (state.fragmentScore || 0) +
      (state.createScore || 0) +
      (state.createBonus || 0) +
      (state.audioEvaluation?.score || 0);
    const phaseCount =
      (Object.keys(state.classifySolved || {}).length > 0 ? 1 : 0) +
      (Object.keys(state.fragmentSolved || {}).length > 0 ? 1 : 0) +
      (state.createValidated ? 1 : 0);
    const audioUsed = state.audioEvaluation ? 1 : 0;
    return {
      rawScore,
      completed: Boolean(state.finished) || phaseCount >= 3,
      attempts: phaseCount,
      hints: 0,
      errors: state.createValidated ? 0 : 1,
      levelCount: phaseCount,
      audioScore: state.audioEvaluation?.score || 0,
      meaningful: rawScore > 0 || phaseCount > 0 || audioUsed > 0,
    };
  }

  function buildGameSnapshot(studentId, gameId) {
    const meta = GAME_META[gameId];
    const extracted = meta.extractor(studentId) || normalizeFallbackProgress(studentId, gameId, meta.maxRaw);
    if (!extracted) {
      return {
        gameId,
        label: meta.label,
        competencies: meta.competencies,
        rawScore: 0,
        maxRaw: meta.maxRaw,
        score: 0,
        attempts: 0,
        hints: 0,
        errors: 0,
        completed: false,
        status: "Pendiente",
        reinforcementRequired: false,
        reinforcementNote: meta.reinforcement,
        levelCount: 0,
        meaningful: false,
      };
    }

    const score = extracted.completed || extracted.rawScore > 0 ? toPercent(extracted.rawScore, meta.maxRaw) : 0;
    const status = labelForScore(score, Boolean(extracted.completed));
    return {
      gameId,
      label: meta.label,
      competencies: meta.competencies,
      rawScore: clamp(Math.round(extracted.rawScore || 0), 0, meta.maxRaw),
      maxRaw: meta.maxRaw,
      score,
      attempts: extracted.attempts || 0,
      hints: extracted.hints || 0,
      errors: extracted.errors || 0,
      completed: Boolean(extracted.completed),
      status,
      reinforcementRequired: Boolean(extracted.completed) && score < getConfig().reinforcementBelow,
      reinforcementNote: meta.reinforcement,
      levelCount: extracted.levelCount || 0,
      audioScore: extracted.audioScore || 0,
      meaningful: Boolean(extracted.meaningful),
    };
  }

  function snapshotSignature(snapshot) {
    return [
      snapshot.score,
      snapshot.completed ? 1 : 0,
      snapshot.attempts,
      snapshot.hints,
      snapshot.errors,
      snapshot.levelCount,
      snapshot.audioScore || 0,
    ].join("|");
  }

  function computeGameRecord(previous, snapshot, policy) {
    const history = Array.isArray(previous?.history) ? previous.history.slice() : [];
    const signature = snapshotSignature(snapshot);
    const latestSignature = previous?.latestSignature || "";
    const meaningful = snapshot.meaningful;
    let latest = previous?.latest || null;
    let best = previous?.best || null;

    if (meaningful && signature !== latestSignature) {
      latest = {
        ...snapshot,
        timestamp: new Date().toISOString(),
      };
      history.push(latest);
      while (history.length > 15) history.shift();
      if (!best || snapshot.score > best.score || (snapshot.score === best.score && snapshot.completed && !best.completed)) {
        best = latest;
      }
    } else {
      latest = previous?.latest || (meaningful ? { ...snapshot, timestamp: new Date().toISOString() } : null);
      best = previous?.best || latest;
    }

    const selected = policy === "last" ? latest || best || snapshot : best || latest || snapshot;
    const hasFail = history.some((item) => item.completed && item.score < getConfig().reinforcementBelow);
    const refuerzoAprobado = hasFail && selected.completed && selected.score >= getConfig().reinforcementBelow;

    return {
      label: snapshot.label,
      competencies: snapshot.competencies,
      latestSignature: meaningful ? signature : previous?.latestSignature || "",
      latest,
      best,
      selected,
      history,
      refuerzo: {
        required: Boolean(selected.completed) && selected.score < getConfig().reinforcementBelow,
        approved: refuerzoAprobado,
        pending: hasFail && !refuerzoAprobado,
        note: snapshot.reinforcementNote,
      },
    };
  }

  function computeCompetencySummary(gameRecords) {
    return Object.entries(COMPETENCIES).reduce((acc, [key, meta]) => {
      const games = Object.values(gameRecords).filter((game) => game.competencies.includes(key));
      const total = games.reduce((sum, game) => sum + (game.selected?.score || 0), 0);
      const average = games.length ? Math.round(total / games.length) : 0;
      acc[key] = {
        ...meta,
        average,
        games: games.map((game) => ({
          gameId: game.selected?.gameId || "",
          label: game.label,
          score: game.selected?.score || 0,
          status: game.selected?.status || "Pendiente",
        })),
      };
      return acc;
    }, {});
  }

  function computeStudentSummary(gameRecords) {
    const records = Object.values(gameRecords);
    const completedGames = records.filter((game) => game.selected?.completed).length;
    const failedGames = records.filter(
      (game) => game.selected?.completed && (game.selected?.score || 0) < getConfig().reinforcementBelow
    ).length;
    const pendingReinforcement = records.filter((game) => game.refuerzo?.pending || game.refuerzo?.required).length;
    const approvedReinforcement = records.filter((game) => game.refuerzo?.approved).length;
    return {
      completedGames,
      failedGames,
      pendingReinforcement,
      approvedReinforcement,
    };
  }

  function syncStudentEvaluation(studentId) {
    const config = getConfig();
    const store = getEvalStore();
    const previousStudent = store[studentId] || { games: {} };
    const nextGames = {};

    Object.keys(GAME_META).forEach((gameId) => {
      const snapshot = buildGameSnapshot(studentId, gameId);
      const previousGame = previousStudent.games?.[gameId] || null;
      nextGames[gameId] = computeGameRecord(previousGame, snapshot, config.attemptPolicy);
    });

    const competencies = computeCompetencySummary(nextGames);
    const studentSummary = computeStudentSummary(nextGames);
    const nextStudent = {
      games: nextGames,
      competencies,
      summary: studentSummary,
      policy: config.attemptPolicy,
      updatedAt: new Date().toISOString(),
    };

    const prevSerialized = JSON.stringify(previousStudent);
    const nextSerialized = JSON.stringify(nextStudent);
    if (prevSerialized !== nextSerialized) {
      store[studentId] = nextStudent;
      writeJson(KEYS.evalStore, store);
    }
    return store[studentId] || nextStudent;
  }

  function syncVisibleData() {
    const session = getSession();
    if (!session) return;
    if (session.role === "student") {
      syncStudentEvaluation(session.id);
      return;
    }
    if (session.role === "teacher") {
      getStudents()
        .filter((student) => student.teacherId === session.id)
        .forEach((student) => syncStudentEvaluation(student.id));
    }
  }

  function getStudentEvaluation(studentId) {
    const store = getEvalStore();
    return store[studentId] || syncStudentEvaluation(studentId);
  }

  function renderStudentPanel(studentId) {
    const host = app.querySelector(".real-student .real-panel");
    if (!host) return;
    const evaluation = getStudentEvaluation(studentId);
    if (!evaluation) return;

    host.querySelector(".competency-eval-panel")?.remove();
    const section = document.createElement("section");
    section.className = "competency-eval-panel";
    section.innerHTML = `
      <div class="competency-head">
        <div>
          <div class="competency-kicker">Evaluacion por competencias</div>
          <h3>El anuncio radial</h3>
          <p>Modo de nota activa: ${evaluation.policy === "last" ? "ultimo intento" : "mejor intento"}.</p>
        </div>
        <div class="competency-mini-stats">
          <span class="eval-pill">Juegos completados: ${evaluation.summary.completedGames}/10</span>
          <span class="eval-pill danger">Juegos reprobados: ${evaluation.summary.failedGames}</span>
          <span class="eval-pill warn">Refuerzos pendientes: ${evaluation.summary.pendingReinforcement}</span>
          <span class="eval-pill success">Refuerzos aprobados: ${evaluation.summary.approvedReinforcement}</span>
        </div>
      </div>
      <div class="student-competency-summary">
        <article class="student-summary-card">
          <div class="summary-label">Juegos completados</div>
          <strong>${evaluation.summary.completedGames}/10</strong>
          <span>Actividades finalizadas del anuncio radial</span>
        </article>
        <article class="student-summary-card">
          <div class="summary-label">Juegos reprobados</div>
          <strong>${evaluation.summary.failedGames}</strong>
          <span>Actividades por debajo de 60 puntos</span>
        </article>
        <article class="student-summary-card">
          <div class="summary-label">Refuerzos pendientes</div>
          <strong>${evaluation.summary.pendingReinforcement}</strong>
          <span>Practicas obligatorias por mejorar</span>
        </article>
        <article class="student-summary-card">
          <div class="summary-label">Refuerzos aprobados</div>
          <strong>${evaluation.summary.approvedReinforcement}</strong>
          <span>Refuerzos superados con exito</span>
        </article>
      </div>
      <div class="competency-modal hidden" id="studentCompetencyModal" aria-hidden="true"></div>
    `;

    const progressPanel = host.querySelector(".progress-panel");
    if (progressPanel) progressPanel.insertAdjacentElement("afterend", section);
    else host.appendChild(section);

    updateStudentHeaderPills(evaluation);
  }

  function renderTeacherPanel(teacherId) {
    const host = app.querySelector(".real-teacher .real-panel");
    if (!host) return;

    const students = getStudents().filter((student) => student.teacherId === teacherId);
    const evaluations = students.map((student) => ({
      student,
      evaluation: getStudentEvaluation(student.id),
    }));

    host.querySelector(".teacher-competency-panel")?.remove();
    const section = document.createElement("section");
    section.className = "teacher-competency-panel";

    const classCompetencies = Object.keys(COMPETENCIES).reduce((acc, key) => {
      const averages = evaluations.map(({ evaluation }) => evaluation?.competencies?.[key]?.average || 0);
      acc[key] = averages.length ? Math.round(averages.reduce((sum, value) => sum + value, 0) / averages.length) : 0;
      return acc;
    }, {});

    section.innerHTML = `
      <div class="competency-head">
        <div>
          <div class="competency-kicker">Panel docente de competencias</div>
          <h3>El anuncio radial</h3>
          <p>Seguimiento por juego, competencias evaluadas, estado y refuerzo de cada estudiante.</p>
        </div>
        <div class="competency-mini-stats">
          <span class="eval-pill">Estudiantes: ${students.length}</span>
          <span class="eval-pill">C1 promedio: ${classCompetencies.C1}/100</span>
          <span class="eval-pill">C2 promedio: ${classCompetencies.C2}/100</span>
          <span class="eval-pill">C3 promedio: ${classCompetencies.C3}/100</span>
        </div>
      </div>
      <div class="competency-bars teacher-bars">
        ${Object.entries(COMPETENCIES)
          .map(
            ([key, meta]) => `
              <article class="competency-card">
                <div class="competency-row">
                  <strong>${key}</strong>
                  <span>${classCompetencies[key]}/100</span>
                </div>
                <div class="competency-track"><span style="width:${classCompetencies[key]}%"></span></div>
                <p>${meta.short}</p>
              </article>
            `
          )
          .join("")}
      </div>
      <div class="competency-table-wrap">
        <table class="competency-table teacher-table">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Juego</th>
              <th>Puntaje</th>
              <th>Competencias evaluadas</th>
              <th>Estado</th>
              <th>Refuerzo asignado</th>
            </tr>
          </thead>
          <tbody>
            ${evaluations
              .map(({ student, evaluation }) => {
                const rows = Object.values(evaluation?.games || {}).map((game) => {
                  const selected = game.selected || {};
                  return `
                    <tr>
                      <td>
                        <strong>${student.name}</strong>
                        <div class="table-note">Codigo clase: ${student.classCode || "sin codigo"}</div>
                      </td>
                      <td>${game.label}</td>
                      <td>${selected.score || 0}/100</td>
                      <td>${game.competencies.join(", ")}</td>
                      <td><span class="status-chip ${statusClass(selected.status)}">${selected.status || "Pendiente"}</span></td>
                      <td>
                        ${game.refuerzo?.approved ? "Refuerzo aprobado" : game.refuerzo?.required ? "Refuerzo obligatorio" : "No aplica"}
                        <div class="table-note">${game.refuerzo?.required || game.refuerzo?.approved ? game.refuerzo.note : "Sin refuerzo pendiente."}</div>
                      </td>
                    </tr>
                  `;
                });
                return rows.join("");
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    host.appendChild(section);
  }

  function updateStudentHeaderPills(evaluation) {
    const pills = app.querySelectorAll(".real-student .real-pills .real-pill");
    if (!pills.length) return;
    pills.forEach((pill) => {
      const text = pill.textContent.trim();
      const key = text.startsWith("C1") ? "C1" : text.startsWith("C2") ? "C2" : text.startsWith("C3") ? "C3" : "";
      if (!key) return;
      const score = evaluation.competencies?.[key]?.average ?? 0;
      const button = pill.tagName === "BUTTON" ? pill : document.createElement("button");
      button.type = "button";
      button.className = `${pill.className} competency-button`;
      button.dataset.competencyKey = key;
      button.textContent = `${key}: ${score}`;
      button.title = COMPETENCIES[key].short;
      button.setAttribute("aria-label", `${key} ${COMPETENCIES[key].short}: ${score} de 100`);
      button.onclick = () => openCompetencyModal(evaluation, key);
      if (pill !== button) pill.replaceWith(button);
    });
  }

  function openCompetencyModal(evaluation, key) {
    const modal = app.querySelector("#studentCompetencyModal");
    const competency = evaluation.competencies?.[key];
    const meta = COMPETENCIES[key];
    if (!modal || !competency || !meta) return;
    modal.innerHTML = `
      <div class="competency-backdrop" data-close-competency="1"></div>
      <div class="competency-dialog" role="dialog" aria-modal="true" aria-labelledby="competencyDialogTitle">
        <button class="competency-close" type="button" data-close-competency="1" aria-label="Cerrar detalle">&times;</button>
        <span class="competency-chip">${key}: ${competency.average}/100</span>
        <h3 id="competencyDialogTitle">${meta.short}</h3>
        <p class="competency-text">${meta.full}</p>
        <div class="competency-mini-stats">
          <span class="eval-pill">Juegos que la evalúan: ${competency.games.length}</span>
          <span class="eval-pill">${competency.average >= 90 ? "Excelente" : competency.average >= 80 ? "Muy bueno" : competency.average >= 70 ? "Aprobado" : competency.average >= 60 ? "Necesita mejorar" : "Reforzar"}</span>
        </div>
        <div class="student-activity-reports">
          ${competency.games
            .map(
              (game) => `
                <article class="activity-report-row">
                  <strong>${game.label}</strong>
                  <p>Puntaje: ${game.score}/100. Estado: ${game.status}.</p>
                </article>
              `
            )
            .join("")}
        </div>
      </div>
    `;
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    modal.querySelectorAll("[data-close-competency]").forEach((node) => {
      node.addEventListener("click", closeCompetencyModal);
    });
  }

  function closeCompetencyModal() {
    const modal = app.querySelector("#studentCompetencyModal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = "";
  }

  function statusClass(status) {
    if (status === "Excelente") return "excellent";
    if (status === "Muy bueno") return "verygood";
    if (status === "Aprobado") return "approved";
    if (status === "Necesita mejorar") return "warn";
    if (status === "Reprobado / Quemado") return "danger";
    return "pending";
  }

  function refreshUi() {
    syncVisibleData();
    const session = getSession();
    if (!session) return;
    if (session.role === "student") renderStudentPanel(session.id);
    if (session.role === "teacher") renderTeacherPanel(session.id);
    lastRenderSignature = buildRenderSignature(session);
  }

  function buildRenderSignature(session) {
    if (!session) return "";
    const evalStore = getEvalStore();
    if (session.role === "student") {
      return JSON.stringify({
        role: "student",
        studentId: session.id,
        evaluation: evalStore[session.id]?.updatedAt || "",
        appText: app.textContent.length,
      });
    }
    const studentIds = getStudents()
      .filter((student) => student.teacherId === session.id)
      .map((student) => `${student.id}:${evalStore[student.id]?.updatedAt || ""}`);
    return JSON.stringify({
      role: "teacher",
      teacherId: session.id,
      students: studentIds,
      appText: app.textContent.length,
    });
  }

  function scheduleRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(() => {
      refreshQueued = false;
      const session = getSession();
      if (!session) return;
      const signature = buildRenderSignature(session);
      if (signature !== lastRenderSignature) refreshUi();
    });
  }

  function injectStyles() {
    if (document.getElementById("competency-eval-style")) return;
    const style = document.createElement("style");
    style.id = "competency-eval-style";
    style.textContent = `
      .competency-eval-panel,
      .teacher-competency-panel {
        margin-top: 18px;
        padding: 22px;
        border-radius: 28px;
        background: linear-gradient(180deg, rgba(255,255,255,.96), rgba(247,243,255,.95));
        box-shadow: 0 22px 48px rgba(118, 74, 188, 0.12);
        border: 1px solid rgba(148, 163, 184, 0.18);
      }
      .competency-head {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        align-items: flex-start;
        margin-bottom: 18px;
        flex-wrap: wrap;
      }
      .competency-kicker {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: .08em;
        font-weight: 800;
        color: #7c3aed;
        margin-bottom: 6px;
      }
      .competency-head h3 {
        margin: 0;
        font-size: 28px;
        color: #2f2a5a;
      }
      .competency-head p {
        margin: 6px 0 0;
        color: #5a6688;
      }
      .competency-mini-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .eval-pill {
        padding: 10px 14px;
        border-radius: 999px;
        background: #ede9fe;
        color: #6d28d9;
        font-weight: 700;
        font-size: 13px;
      }
      .eval-pill.warn { background: #fff7ed; color: #c2410c; }
      .eval-pill.danger { background: #fee2e2; color: #b91c1c; }
      .eval-pill.success { background: #dcfce7; color: #15803d; }
      .competency-bars {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 18px;
      }
      .student-competency-summary {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
      }
      .student-summary-card {
        border-radius: 22px;
        padding: 16px;
        background: linear-gradient(180deg, #ffffff, #f8f6ff);
        border: 1px solid rgba(148, 163, 184, 0.15);
      }
      .summary-label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: .06em;
        font-weight: 800;
        color: #7c3aed;
        margin-bottom: 8px;
      }
      .student-summary-card strong {
        display: block;
        color: #2f2a5a;
        font-size: 28px;
        line-height: 1;
        margin-bottom: 8px;
      }
      .student-summary-card span {
        color: #5b647b;
        font-size: 13px;
        line-height: 1.4;
      }
      .teacher-bars { margin-bottom: 22px; }
      .competency-card {
        border-radius: 22px;
        padding: 16px;
        background: linear-gradient(180deg, #ffffff, #f8f6ff);
        border: 1px solid rgba(148, 163, 184, 0.15);
      }
      .competency-row {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: baseline;
        margin-bottom: 10px;
      }
      .competency-row strong {
        color: #2f2a5a;
        font-size: 15px;
      }
      .competency-row span {
        color: #7c3aed;
        font-weight: 800;
      }
      .competency-track {
        position: relative;
        height: 12px;
        border-radius: 999px;
        background: #ede9fe;
        overflow: hidden;
        margin-bottom: 10px;
      }
      .competency-track span {
        position: absolute;
        inset: 0 auto 0 0;
        border-radius: 999px;
        background: linear-gradient(90deg, #60a5fa, #8b5cf6, #f59e0b);
      }
      .competency-card p {
        margin: 0;
        color: #5b647b;
        font-size: 13px;
        line-height: 1.45;
      }
      .competency-table-wrap {
        overflow-x: auto;
      }
      .competency-table {
        width: 100%;
        border-collapse: collapse;
        min-width: 900px;
      }
      .competency-table th,
      .competency-table td {
        text-align: left;
        padding: 12px 10px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.16);
        vertical-align: top;
      }
      .competency-table th {
        color: #5b4ac7;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: .04em;
      }
      .competency-table td {
        color: #2f3855;
        font-size: 14px;
      }
      .table-note {
        margin-top: 4px;
        color: #74809f;
        font-size: 12px;
      }
      .status-chip {
        display: inline-flex;
        align-items: center;
        padding: 8px 12px;
        border-radius: 999px;
        font-weight: 800;
        font-size: 12px;
      }
      .status-chip.excellent { background: #dcfce7; color: #166534; }
      .status-chip.verygood { background: #dbeafe; color: #1d4ed8; }
      .status-chip.approved { background: #fef3c7; color: #b45309; }
      .status-chip.warn { background: #ffedd5; color: #c2410c; }
      .status-chip.danger { background: #fee2e2; color: #b91c1c; }
      .status-chip.pending { background: #eef2ff; color: #6366f1; }
      @media (max-width: 960px) {
        .competency-bars {
          grid-template-columns: 1fr;
        }
        .student-competency-summary {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  const observer = new MutationObserver(() => scheduleRefresh());
  observer.observe(app, { childList: true, subtree: true });
  window.addEventListener("storage", scheduleRefresh);
  window.addEventListener("click", () => setTimeout(scheduleRefresh, 60));
  setInterval(scheduleRefresh, 1500);
  refreshUi();
})();
*/}).toString();
  __source = __source.slice(__source.indexOf("/*") + 2, __source.lastIndexOf("*/"));
  (0, eval)(__source);
}
