(function () {
  const app = document.getElementById("app");
  if (!app) return;

  const SESSION_KEY = "yoyo_rg_x";
  const STUDENTS_KEY = "yoyo_rg_s";
  const LC_KEY = "yoyo_literacy_center_v1";
  const MAX_ATTEMPTS = 2;
  const recentSubmits = new Map();

  const CATEGORIES = [
    {
      id: "lectura",
      icon: "📖",
      title: "Comprensión Lectora",
      levels: [
        {
          type: "readingQuiz",
          title: "Nivel 1 · Leer y responder",
          passage: "Ana regó las plantas del jardín antes de ir a la escuela. Después guardó su cuaderno azul y se despidió de su mamá con una sonrisa.",
          questions: [
            {
              prompt: "¿Qué hizo Ana antes de ir a la escuela?",
              options: ["Regó las plantas", "Escuchó un anuncio", "Preparó una merienda"],
              answer: 0
            },
            {
              prompt: "¿Qué guardó Ana?",
              options: ["Su paraguas", "Su cuaderno azul", "Una receta"],
              answer: 1
            },
            {
              prompt: "¿Cómo se despidió de su mamá?",
              options: ["Con una sonrisa", "Con enojo", "Sin hablar"],
              answer: 0
            }
          ]
        },
        {
          type: "readingQuiz",
          title: "Nivel 2 · Comprensión breve",
          passage: "Luis llevó su paraguas porque el cielo estaba oscuro y podía llover. Caminó rápido hasta la escuela y llegó justo antes de que empezaran las clases.",
          questions: [
            {
              prompt: "¿Por qué Luis llevó su paraguas?",
              options: ["Porque hacía mucho calor", "Porque podía llover", "Porque iba a la playa"],
              answer: 1
            },
            {
              prompt: "¿A dónde caminó Luis?",
              options: ["A la escuela", "Al parque", "A la biblioteca"],
              answer: 0
            },
            {
              prompt: "¿Cuándo llegó Luis?",
              options: ["Después del recreo", "Antes de que empezaran las clases", "Muy tarde en la noche"],
              answer: 1
            }
          ]
        },
        {
          type: "readingQuiz",
          title: "Nivel 3 · Secuencia del texto",
          passage: "María llegó a casa de su abuela, la saludó con cariño y luego le dio un abrazo fuerte. Después se sentaron juntas a conversar.",
          questions: [
            {
              prompt: "¿Qué pasó primero?",
              options: ["Le dio un abrazo", "Llegó a la casa", "Se sentaron a conversar"],
              answer: 1
            },
            {
              prompt: "¿Qué hizo María después de llegar?",
              options: ["Se fue al parque", "Saludó a su abuela", "Preparó una receta"],
              answer: 1
            },
            {
              prompt: "¿Qué hicieron al final?",
              options: ["Conversaron juntas", "Escucharon un anuncio radial", "Volvieron a la escuela"],
              answer: 0
            }
          ]
        },
        {
          type: "readingQuiz",
          title: "Nivel 4 · Idea principal",
          passage: "Los árboles limpian el aire, dan sombra y sirven de hogar para muchos animales. También ayudan a mantener fresco el ambiente y hacen más bonitos los espacios.",
          questions: [
            {
              prompt: "¿Cuál es la idea principal del texto?",
              options: [
                "Los árboles ayudan mucho a la vida.",
                "Los árboles solo son verdes.",
                "Los animales duermen todo el día."
              ],
              answer: 0
            },
            {
              prompt: "¿Qué hacen los árboles con el aire?",
              options: ["Lo ensucian", "Lo limpian", "Lo esconden"],
              answer: 1
            },
            {
              prompt: "¿Qué dan los árboles?",
              options: ["Ruido", "Sombra", "Tareas"],
              answer: 1
            }
          ]
        },
        {
          type: "readingQuiz",
          title: "Nivel 5 · Comprensión global",
          passage: "En la biblioteca, Sofía encontró un libro sobre planetas. Leyó con atención y aprendió que Saturno tiene anillos y que Marte es conocido como el planeta rojo.",
          questions: [
            {
              prompt: "¿Dónde estaba Sofía?",
              options: ["En la biblioteca", "En la cocina", "En el patio"],
              answer: 0
            },
            {
              prompt: "¿Qué aprendió sobre Saturno?",
              options: ["Que tiene anillos", "Que es un juguete", "Que está dentro del mar"],
              answer: 0
            },
            {
              prompt: "¿Cómo se conoce a Marte?",
              options: ["El planeta azul", "El planeta rojo", "El planeta de papel"],
              answer: 1
            }
          ]
        }
      ]
    },
    {
      id: "ortografia",
      icon: "✍️",
      title: "Ortografía",
      levels: [
        {
          type: "choice",
          title: "Nivel 1 · Completa palabras",
          prompt: "¿Cuál palabra está bien escrita?",
          options: ["escuela", "escuelaa", "eskuela"],
          answer: 0
        },
        {
          type: "choice",
          title: "Nivel 2 · Elige la palabra correcta",
          prompt: "Selecciona la opción correcta.",
          options: ["corazón", "corason", "corasón"],
          answer: 0
        },
        {
          type: "choice",
          title: "Nivel 3 · Detecta el error",
          prompt: "¿En cuál opción hay un error ortográfico?",
          options: ["La niña canta.", "Mi mamá cocina.", "El arvol es alto."],
          answer: 2
        },
        {
          type: "choice",
          title: "Nivel 4 · Separa sílabas",
          prompt: "¿Cuál separación silábica es correcta para “camino”?",
          options: ["ca-mi-no", "cam-i-no", "c-a-mino"],
          answer: 0
        },
        {
          type: "choice",
          title: "Nivel 5 · Mayúsculas y puntuación",
          prompt: "¿Cuál oración está escrita correctamente?",
          options: [
            "mi perro se llama Toby.",
            "Mi perro se llama Toby.",
            "Mi perro se llama toby"
          ],
          answer: 1
        }
      ]
    },
    {
      id: "caligrafia",
      icon: "🖊️",
      title: "Caligrafía",
      levels: [
        {
          type: "text",
          title: "Nivel 1 · Copia y escribe",
          prompt: "Copia esta oración: “Hoy escribo con orden y cuidado.”",
          expected: "Hoy escribo con orden y cuidado.",
          minWords: 6
        },
        {
          type: "order",
          title: "Nivel 2 · Ordena letras",
          intro: "Forma la palabra correcta.",
          choices: ["l", "á", "p", "i", "z"],
          answer: ["l", "á", "p", "i", "z"]
        },
        {
          type: "choice",
          title: "Nivel 3 · Forma palabras",
          prompt: "¿Cuál palabra está mejor formada?",
          options: ["cuaderno", "cuadreno", "cuaderon"],
          answer: 0
        },
        {
          type: "text",
          title: "Nivel 4 · Copia con atención",
          prompt: "Escribe: “Mi letra mejora cuando practico todos los días.”",
          expected: "Mi letra mejora cuando practico todos los días.",
          minWords: 8
        },
        {
          type: "text",
          title: "Nivel 5 · Escritura ordenada",
          prompt: "Escribe una oración clara con al menos 7 palabras sobre tu escuela.",
          keywords: ["escuela"],
          minWords: 7
        }
      ]
    },
    {
      id: "vocabulario",
      icon: "🧠",
      title: "Vocabulario",
      levels: [
        {
          type: "choice",
          title: "Nivel 1 · Sinónimos",
          prompt: "¿Cuál es sinónimo de “feliz”?",
          options: ["contento", "lento", "oscuro"],
          answer: 0
        },
        {
          type: "choice",
          title: "Nivel 2 · Antónimos",
          prompt: "¿Cuál es antónimo de “grande”?",
          options: ["alto", "pequeño", "brillante"],
          answer: 1
        },
        {
          type: "choice",
          title: "Nivel 3 · Relaciona palabras",
          prompt: "¿Qué palabra se relaciona mejor con “biblioteca”?",
          options: ["libros", "pelota", "sartén"],
          answer: 0
        },
        {
          type: "choice",
          title: "Nivel 4 · Completa significado",
          prompt: "Una palabra “amable” describe a una persona…",
          options: ["grosera", "cortés y cariñosa", "silenciosa"],
          answer: 1
        },
        {
          type: "choice",
          title: "Nivel 5 · Precisión léxica",
          prompt: "¿Qué palabra encaja mejor? “El médico hizo una ______ del paciente.”",
          options: ["revisión", "receta", "mochila"],
          answer: 0
        }
      ]
    },
    {
      id: "fluidez",
      icon: "🎧",
      title: "Fluidez Lectora",
      levels: [
        {
          type: "timed",
          title: "Nivel 1 · Lectura con cronómetro",
          text: "Lee en voz alta: “La luna ilumina el camino de los viajeros por la noche.”",
          targetSeconds: 18
        },
        {
          type: "timed",
          title: "Nivel 2 · Repetición de palabras",
          text: "Lee tres veces: “mariposa, jardín, alegría”.",
          targetSeconds: 15
        },
        {
          type: "timed",
          title: "Nivel 3 · Lectura rápida",
          text: "Lee: “Cada mañana, Julia abre su cuaderno y escribe una nueva idea.”",
          targetSeconds: 16
        },
        {
          type: "choice",
          title: "Nivel 4 · Atención al leer",
          prompt: "Después de leer, marca la palabra que sí apareció en la frase.",
          options: ["cuaderno", "cuchara", "ventana"],
          answer: 0
        },
        {
          type: "timed",
          title: "Nivel 5 · Fluidez final",
          text: "Lee: “El pequeño colibrí visitó cada flor del jardín antes de que saliera el sol.”",
          targetSeconds: 18
        }
      ]
    },
    {
      id: "redaccion",
      icon: "📝",
      title: "Redacción",
      levels: [
        {
          type: "text",
          title: "Nivel 1 · Escribe una oración",
          prompt: "Escribe una oración completa sobre tu familia.",
          minWords: 5
        },
        {
          type: "text",
          title: "Nivel 2 · Continúa el texto",
          prompt: "Continúa: “Hoy fui al parque y…”",
          keywords: ["parque"],
          minWords: 6
        },
        {
          type: "text",
          title: "Nivel 3 · Describe una imagen simple",
          prompt: "Describe esta escena con una oración: 🌳🐦☀️",
          minWords: 6
        },
        {
          type: "order",
          title: "Nivel 4 · Organiza párrafos",
          intro: "Ordena las ideas para formar un texto breve.",
          choices: ["Finalmente, regresé a casa.", "Primero preparé mi mochila.", "Después salí hacia la escuela."],
          answer: ["Primero preparé mi mochila.", "Después salí hacia la escuela.", "Finalmente, regresé a casa."]
        },
        {
          type: "text",
          title: "Nivel 5 · Redacción final",
          prompt: "Escribe dos oraciones sobre por qué te gusta aprender.",
          keywords: ["aprender"],
          minWords: 10
        }
      ]
    }
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
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getSession() {
    return readJson(SESSION_KEY, null);
  }

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .replace(/\s+/g, " ");
  }

  function words(value) {
    return normalizeText(value).split(" ").filter(Boolean);
  }

  function clamp100(value) {
    return Math.max(0, Math.min(100, Math.round(Number(value || 0) || 0)));
  }

  function levelRecord() {
    return {
      attemptsUsed: 0,
      locked: false,
      bestScore: 0,
      completed: false,
      updatedAt: "",
      lastType: "",
      lastErrors: 0,
      lastPercent: 0
    };
  }

  function emptyCategoryProgress() {
    const levels = {};
    for (let level = 1; level <= 5; level += 1) {
      levels[`nivel-${level}`] = levelRecord();
    }
    return {
      score: 0,
      progress: 0,
      attempts: 0,
      bestScore: 0,
      completedLevels: 0,
      levels
    };
  }

  function emptyStudentProgress() {
    return {
      lectura: emptyCategoryProgress(),
      ortografia: emptyCategoryProgress(),
      caligrafia: emptyCategoryProgress(),
      vocabulario: emptyCategoryProgress(),
      fluidez: emptyCategoryProgress(),
      redaccion: emptyCategoryProgress()
    };
  }

  function getStore() {
    return readJson(LC_KEY, {});
  }

  function saveStore(store) {
    writeJson(LC_KEY, store);
  }

  function ensureStudentProgress(studentId) {
    const store = getStore();
    store[studentId] = store[studentId] || emptyStudentProgress();
    CATEGORIES.forEach((category) => {
      store[studentId][category.id] = store[studentId][category.id] || emptyCategoryProgress();
      for (let level = 1; level <= 5; level += 1) {
        store[studentId][category.id].levels[`nivel-${level}`] =
          store[studentId][category.id].levels[`nivel-${level}`] || levelRecord();
      }
    });
    saveStore(store);
    return store[studentId];
  }

  function summarizeCategory(studentId, categoryId) {
    const student = ensureStudentProgress(studentId);
    const category = student[categoryId] || emptyCategoryProgress();
    const rows = Object.values(category.levels || {});
    const scores = rows.map((row) => Number(row.bestScore || 0));
    const completedLevels = rows.filter((row) => row.completed).length;
    const attempts = rows.reduce((sum, row) => sum + Number(row.attemptsUsed || 0), 0);
    const errors = rows.reduce((sum, row) => sum + Number(row.lastErrors || 0), 0);
    const score = clamp100(scores.reduce((sum, value) => sum + value, 0) / Math.max(1, scores.length));
    const progress = clamp100((completedLevels / 5) * 100);
    const bestScore = Math.max(0, ...scores);
    return {
      score,
      progress,
      attempts,
      bestScore,
      completedLevels,
      errors,
      levels: category.levels || {}
    };
  }

  function summarizeStudent(studentId) {
    const student = ensureStudentProgress(studentId);
    const categories = CATEGORIES.map((category) => ({
      id: category.id,
      icon: category.icon,
      title: category.title,
      ...summarizeCategory(studentId, category.id)
    }));
    return {
      categories,
      average: clamp100(categories.reduce((sum, item) => sum + item.score, 0) / Math.max(1, categories.length)),
      attempts: categories.reduce((sum, item) => sum + item.attempts, 0),
      completedLevels: categories.reduce((sum, item) => sum + item.completedLevels, 0),
      exhaustedLevels: categories.reduce((sum, item) => {
        return sum + Object.values(item.levels || {}).filter((level) => level.locked).length;
      }, 0)
    };
  }

  function updateStudentLevel(studentId, categoryId, levelIndex, result) {
    const store = getStore();
    store[studentId] = store[studentId] || emptyStudentProgress();
    store[studentId][categoryId] = store[studentId][categoryId] || emptyCategoryProgress();
    const key = `nivel-${levelIndex}`;
    const current = store[studentId][categoryId].levels[key] || levelRecord();
    const nextAttempts = Math.min(MAX_ATTEMPTS, Number(current.attemptsUsed || 0) + 1);
    const nextBest = Math.max(Number(current.bestScore || 0), Number(result.score || 0));
    store[studentId][categoryId].levels[key] = {
      ...current,
      attemptsUsed: nextAttempts,
      locked: nextAttempts >= MAX_ATTEMPTS,
      bestScore: nextBest,
      completed: current.completed || result.score >= 70,
      updatedAt: new Date().toISOString(),
      lastType: result.type || "",
      lastErrors: Number(result.errors || 0),
      lastPercent: Number(result.percent || 0)
    };
    saveStore(store);
    return summarizeCategory(studentId, categoryId);
  }

  function getLevelState(studentId, categoryId, levelIndex) {
    const student = ensureStudentProgress(studentId);
    return student?.[categoryId]?.levels?.[`nivel-${levelIndex}`] || levelRecord();
  }

  function ensureStyle() {
    if (document.getElementById("literacy-center-style")) return;
    const style = document.createElement("style");
    style.id = "literacy-center-style";
    style.textContent = `
      .literacy-entry-card{padding:20px;border:none;border-radius:24px;background:linear-gradient(135deg,#fff7ea,#f5f1ff);box-shadow:0 14px 30px rgba(93,104,152,.10);display:grid;gap:10px;text-align:left;cursor:pointer}
      .literacy-entry-card strong{font-size:1.15rem;color:#284375}
      .literacy-entry-card p,.literacy-entry-card small{margin:0;color:#5d6a84}
      .literacy-chip-row{display:flex;flex-wrap:wrap;gap:8px}
      .literacy-chip{display:inline-flex;padding:6px 10px;border-radius:999px;background:#efe8ff;color:#6d28d9;font-size:.78rem;font-weight:800}
      .literacy-side-card{margin-top:14px;padding:14px;border-radius:18px;background:linear-gradient(135deg,#fff,#f8f5ff);box-shadow:0 10px 24px rgba(93,104,152,.08);display:grid;gap:10px}
      .literacy-side-card h4,.literacy-center-modal h3,.literacy-teacher-panel h3{margin:0;color:#284375}
      .literacy-side-list,.literacy-teacher-list{display:grid;gap:10px}
      .literacy-side-item,.literacy-teacher-item,.literacy-category-card,.literacy-level-card{padding:12px;border-radius:16px;background:#fff;border:1px solid rgba(148,163,184,.16);display:grid;gap:8px}
      .literacy-metric-row,.literacy-score-row,.literacy-teacher-bars{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .literacy-mini-track,.literacy-level-track{height:8px;border-radius:999px;background:#edf2ff;overflow:hidden}
      .literacy-mini-track i,.literacy-level-track i{display:block;height:100%;background:linear-gradient(135deg,#1f70ff,#7b36eb)}
      .literacy-mini-track i.warn,.literacy-level-track i.warn{background:linear-gradient(135deg,#f59e0b,#f97316)}
      .literacy-mini-track i.danger,.literacy-level-track i.danger{background:linear-gradient(135deg,#fb7185,#ef4444)}
      .literacy-center-modal{position:fixed;inset:18px;z-index:40;background:rgba(241,245,255,.92);backdrop-filter:blur(6px);padding:18px;border-radius:28px;display:grid;grid-template-rows:auto 1fr;gap:16px;overflow:auto}
      .literacy-modal-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
      .literacy-modal-actions{display:flex;flex-wrap:wrap;gap:10px}
      .literacy-btn{border:none;border-radius:999px;padding:10px 14px;font:inherit;font-weight:800;cursor:pointer}
      .literacy-btn.primary{background:linear-gradient(135deg,#1f70ff,#7b36eb);color:#fff}
      .literacy-btn.ghost{background:#efe8ff;color:#6d28d9}
      .literacy-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
      .literacy-level-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}
      .literacy-level-card.locked{background:#fff1f2}
      .literacy-play-card{padding:16px;border-radius:20px;background:#fff;display:grid;gap:14px;box-shadow:0 10px 24px rgba(93,104,152,.08)}
      .literacy-play-card p,.literacy-play-card label,.literacy-play-card small{margin:0;color:#5d6a84}
      .literacy-order-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
      .literacy-play-card textarea,.literacy-play-card select,.literacy-play-card input[type="text"]{width:100%;padding:12px 14px;border-radius:14px;border:1px solid #d9e2f5;font:inherit;background:#fff}
      .literacy-play-card fieldset{border:none;padding:0;margin:0;display:grid;gap:10px}
      .literacy-feedback{padding:12px 14px;border-radius:16px;background:#eff6ff;color:#284375;font-weight:700}
      .literacy-feedback.warn{background:#fff7ed;color:#b45309}
      .literacy-feedback.danger{background:#fff1f2;color:#be123c}
      .literacy-teacher-panel{margin-top:18px}
      .literacy-teacher-list{grid-template-columns:repeat(2,minmax(0,1fr))}
      .literacy-teacher-item strong{color:#284375}
      .literacy-empty{padding:14px;border-radius:16px;background:#fff;color:#5d6a84}
      @media (max-width: 960px){
        .literacy-grid,.literacy-teacher-list{grid-template-columns:1fr}
        .literacy-level-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
      }
      @media (max-width: 680px){
        .literacy-center-modal{inset:8px;padding:14px}
        .literacy-order-grid,.literacy-metric-row,.literacy-score-row,.literacy-teacher-bars{grid-template-columns:1fr}
        .literacy-level-grid{grid-template-columns:1fr}
      }
    `;
    document.head.appendChild(style);
  }

  function tone(value) {
    if (value >= 80) return "";
    if (value >= 50) return "warn";
    return "danger";
  }

  function getCategory(categoryId) {
    return CATEGORIES.find((item) => item.id === categoryId) || null;
  }

  function evaluateChoice(level, container) {
    const checked = container.querySelector('input[name="lc-choice"]:checked');
    if (!checked) return { score: 0, errors: 1, percent: 0, message: "Selecciona una respuesta." };
    const correct = Number(checked.value) === Number(level.answer);
    return {
      score: correct ? 100 : 35,
      errors: correct ? 0 : 1,
      percent: correct ? 1 : 0.35,
      message: correct ? "Respuesta correcta." : "Respuesta revisada. Vuelve a leer y compara mejor las opciones."
    };
  }

  function evaluateReadingQuiz(level, container) {
    const answers = Array.from(container.querySelectorAll("input[data-lc-reading]:checked"));
    if (answers.length !== (level.questions || []).length) {
      return {
        score: 0,
        errors: (level.questions || []).length,
        percent: 0,
        message: "Responde las tres preguntas antes de revisar."
      };
    }
    let correct = 0;
    (level.questions || []).forEach((question, index) => {
      const choice = container.querySelector(`input[data-lc-reading="${index}"]:checked`);
      if (choice && Number(choice.value) === Number(question.answer)) correct += 1;
    });
    const total = Math.max(1, (level.questions || []).length);
    const percent = correct / total;
    return {
      score: clamp100(percent * 100),
      errors: total - correct,
      percent,
      message: correct === total
        ? "Muy bien. Comprendiste el texto y respondiste correctamente."
        : "El texto ya fue revisado. Lee otra vez y compara mejor cada pregunta."
    };
  }

  function evaluateTrueFalse(level, container) {
    const answers = Array.from(container.querySelectorAll("select[data-lc-bool]")).map((select) => select.value);
    if (answers.some((value) => !value)) {
      return { score: 0, errors: level.items.length, percent: 0, message: "Completa todas las respuestas." };
    }
    let correct = 0;
    level.items.forEach((item, index) => {
      const value = answers[index] === "true";
      if (value === item.answer) correct += 1;
    });
    const percent = correct / Math.max(1, level.items.length);
    return {
      score: clamp100(percent * 100),
      errors: level.items.length - correct,
      percent,
      message: correct === level.items.length ? "Muy bien. Comprendiste la lectura." : "Sigue practicando la comprensión del texto."
    };
  }

  function evaluateOrder(level, container) {
    const answers = Array.from(container.querySelectorAll("select[data-lc-order]")).map((select) => select.value);
    if (answers.some((value) => !value)) {
      return { score: 0, errors: level.answer.length, percent: 0, message: "Completa toda la secuencia." };
    }
    let correct = 0;
    level.answer.forEach((item, index) => {
      if (answers[index] === item) correct += 1;
    });
    const percent = correct / Math.max(1, level.answer.length);
    return {
      score: clamp100(percent * 100),
      errors: level.answer.length - correct,
      percent,
      message: correct === level.answer.length ? "Secuencia correcta." : "La secuencia necesita ajustes."
    };
  }

  function evaluateText(level, container) {
    const textarea = container.querySelector("textarea[data-lc-text]");
    const value = String(textarea?.value || "").trim();
    const list = words(value);
    if (!value) {
      return { score: 0, errors: 1, percent: 0, message: "Escribe tu respuesta antes de revisar." };
    }
    let score = 35;
    let errors = 0;
    if (level.expected) {
      const expectedWords = words(level.expected);
      const overlap = expectedWords.filter((word) => list.includes(word)).length;
      score = clamp100((overlap / Math.max(1, expectedWords.length)) * 100);
      errors = Math.max(0, expectedWords.length - overlap);
    } else {
      if (list.length >= Number(level.minWords || 1)) score += 35;
      else errors += 1;
      if ((level.keywords || []).every((keyword) => normalizeText(value).includes(normalizeText(keyword)))) score += 30;
      else if ((level.keywords || []).length) errors += 1;
    }
    const percent = score / 100;
    return {
      score,
      errors,
      percent,
      message: score >= 80 ? "Buen trabajo de escritura." : score >= 50 ? "Vas bien, pero puedes mejorar tu respuesta." : "Necesita más desarrollo y cuidado al escribir."
    };
  }

  function evaluateTimed(level, container) {
    const timer = Number(container.dataset.lcElapsed || 0);
    const usedTimer = container.dataset.lcStarted === "1" && timer > 0;
    if (!usedTimer) {
      return { score: 0, errors: 1, percent: 0, message: "Inicia el cronómetro y termina tu lectura para registrar el nivel." };
    }
    const target = Number(level.targetSeconds || 15);
    const diff = Math.max(0, timer - target);
    const penalty = Math.min(45, diff * 5);
    const score = clamp100(100 - penalty);
    return {
      score,
      errors: diff > 0 ? 1 : 0,
      percent: score / 100,
      message: score >= 80 ? "Lectura realizada con buena fluidez." : "Puedes mejorar tu ritmo lector con más práctica."
    };
  }

  function evaluateLevel(level, container) {
    if (level.type === "readingQuiz") return evaluateReadingQuiz(level, container);
    if (level.type === "choice") return evaluateChoice(level, container);
    if (level.type === "truefalse") return evaluateTrueFalse(level, container);
    if (level.type === "order") return evaluateOrder(level, container);
    if (level.type === "text") return evaluateText(level, container);
    if (level.type === "timed") return evaluateTimed(level, container);
    return { score: 0, errors: 1, percent: 0, message: "Actividad no disponible." };
  }

  function ensureStudentShell(session) {
    const shell = app.querySelector(".real-student");
    if (!shell || !session || session.role !== "student") return;
    ensureStyle();
    renderStudentSummary(shell, session.id);
    renderStudentEntry(shell, session.id);
  }

  function renderStudentEntry(shell, studentId) {
    const topicGrid = shell.querySelector(".topic-grid");
    if (!topicGrid || topicGrid.querySelector(".literacy-entry-card")) return;
    const summary = summarizeStudent(studentId);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "literacy-entry-card";
    card.innerHTML = `
      <strong>✍️ Centro de Lectura y Escritura</strong>
      <p>Ortografía, caligrafía, comprensión lectora, vocabulario, fluidez y redacción.</p>
      <div class="literacy-chip-row">
        <span class="literacy-chip">Promedio: ${summary.average}/100</span>
        <span class="literacy-chip">Niveles: ${summary.completedLevels}/30</span>
        <span class="literacy-chip">Intentos: ${summary.attempts}</span>
      </div>
      <small>Sección independiente y ligera del resto de los temarios.</small>
    `;
    card.addEventListener("click", () => openLiteracyCenter(studentId));
    topicGrid.appendChild(card);
  }

  function renderStudentSummary(shell, studentId) {
    const side = shell.querySelector(".real-side");
    if (!side) return;
    const summary = summarizeStudent(studentId);
    let card = side.querySelector(".literacy-side-card");
    if (!card) {
      card = document.createElement("section");
      card.className = "literacy-side-card";
      side.appendChild(card);
    }
    card.innerHTML = `
      <h4>✍️ Centro de Lectura y Escritura</h4>
      <div class="literacy-side-list">
        ${summary.categories.map((category) => `
          <article class="literacy-side-item">
            <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
              <strong>${category.icon} ${escapeHtml(category.title)}</strong>
              <span class="literacy-chip">${category.score}/100</span>
            </div>
            <div class="literacy-mini-track"><i class="${tone(category.score)}" style="width:${category.score}%"></i></div>
            <div class="literacy-metric-row">
              <small>Progreso: ${category.progress}%</small>
              <small>Intentos: ${category.attempts}</small>
            </div>
          </article>
        `).join("")}
      </div>
    `;
  }

  function openLiteracyCenter(studentId, categoryId = "", levelIndex = 0) {
    const shell = app.querySelector(".real-student");
    if (!shell) return;
    ensureStyle();
    let modal = shell.querySelector(".literacy-center-modal");
    if (!modal) {
      modal = document.createElement("section");
      modal.className = "literacy-center-modal";
      shell.querySelector(".real-panel")?.appendChild(modal);
    }
    modal.dataset.studentId = studentId;
    modal.dataset.categoryId = categoryId;
    modal.dataset.levelIndex = levelIndex ? String(levelIndex) : "";
    renderLiteracyModal(modal);
  }

  function closeLiteracyCenter() {
    const modal = app.querySelector(".literacy-center-modal");
    if (modal) modal.remove();
  }

  function renderCategoryOverview(studentId, category) {
    const summary = summarizeCategory(studentId, category.id);
    return `
      <article class="literacy-category-card">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
          <strong>${category.icon} ${escapeHtml(category.title)}</strong>
          <span class="literacy-chip">${summary.score}/100</span>
        </div>
        <div class="literacy-mini-track"><i class="${tone(summary.score)}" style="width:${summary.score}%"></i></div>
        <div class="literacy-metric-row">
          <small>Niveles: ${summary.completedLevels}/5</small>
          <small>Intentos: ${summary.attempts}</small>
        </div>
        <button class="literacy-btn ghost" type="button" data-lc-open-category="${category.id}">Entrar</button>
      </article>
    `;
  }

  function renderLevels(studentId, category) {
    const summary = summarizeCategory(studentId, category.id);
    return `
      <div class="literacy-level-grid">
        ${category.levels.map((level, index) => {
          const levelNumber = index + 1;
          const state = summary.levels[`nivel-${levelNumber}`] || levelRecord();
          const remaining = Math.max(0, MAX_ATTEMPTS - Number(state.attemptsUsed || 0));
          return `
            <article class="literacy-level-card ${state.locked ? "locked" : ""}">
              <strong>${escapeHtml(level.title)}</strong>
              <div class="literacy-level-track"><i class="${tone(state.bestScore)}" style="width:${state.bestScore}%"></i></div>
              <small>Mejor nota: ${state.bestScore}/100</small>
              <small>${state.locked ? "Intentos agotados" : `Intentos restantes: ${remaining}/${MAX_ATTEMPTS}`}</small>
              <button class="literacy-btn ${state.locked ? "ghost" : "primary"}" type="button" data-lc-open-level="${category.id}:${levelNumber}" ${state.locked ? "disabled" : ""}>${state.locked ? "Bloqueado" : "Jugar nivel"}</button>
            </article>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderPlay(category, levelIndex, studentId) {
    const level = category.levels[levelIndex - 1];
    const state = getLevelState(studentId, category.id, levelIndex);
    const remaining = Math.max(0, MAX_ATTEMPTS - Number(state.attemptsUsed || 0));
    let content = "";

    if (level.type === "choice") {
      content = `
        <p>${escapeHtml(level.prompt)}</p>
        <fieldset>
          ${level.options.map((option, index) => `
            <label><input type="radio" name="lc-choice" value="${index}"> ${escapeHtml(option)}</label>
          `).join("")}
        </fieldset>
      `;
    } else if (level.type === "readingQuiz") {
      content = `
        <div class="literacy-side-item">
          <strong>Lectura breve</strong>
          <p>${escapeHtml(level.passage)}</p>
        </div>
        <fieldset>
          ${(level.questions || []).map((question, questionIndex) => `
            <div class="literacy-side-item">
              <strong>Pregunta ${questionIndex + 1}</strong>
              <p>${escapeHtml(question.prompt)}</p>
              <div style="display:grid;gap:8px;">
                ${(question.options || []).map((option, optionIndex) => `
                  <label>
                    <input type="radio" name="lc-reading-${questionIndex}" data-lc-reading="${questionIndex}" value="${optionIndex}">
                    ${escapeHtml(option)}
                  </label>
                `).join("")}
              </div>
            </div>
          `).join("")}
        </fieldset>
      `;
    } else if (level.type === "truefalse") {
      content = `
        <p>${escapeHtml(level.text)}</p>
        <fieldset>
          ${level.items.map((item, index) => `
            <label>${escapeHtml(item.text)}
              <select data-lc-bool="${index}">
                <option value="">Selecciona</option>
                <option value="true">Verdadero</option>
                <option value="false">Falso</option>
              </select>
            </label>
          `).join("")}
        </fieldset>
      `;
    } else if (level.type === "order") {
      content = `
        <p>${escapeHtml(level.intro)}</p>
        <div class="literacy-order-grid">
          ${level.answer.map((_, index) => `
            <label>Paso ${index + 1}
              <select data-lc-order="${index}">
                <option value="">Selecciona</option>
                ${level.choices.map((choice) => `<option value="${escapeHtml(choice)}">${escapeHtml(choice)}</option>`).join("")}
              </select>
            </label>
          `).join("")}
        </div>
      `;
    } else if (level.type === "text") {
      content = `
        <p>${escapeHtml(level.prompt)}</p>
        <textarea data-lc-text rows="6" placeholder="Escribe aquí..."></textarea>
      `;
    } else if (level.type === "timed") {
      content = `
        <p>${escapeHtml(level.text)}</p>
        <div class="literacy-score-row">
          <button class="literacy-btn ghost" type="button" data-lc-start-timer="1">Iniciar cronómetro</button>
          <button class="literacy-btn ghost" type="button" data-lc-stop-timer="1">Terminar lectura</button>
        </div>
        <small data-lc-timer-readout>Tiempo registrado: 0 s</small>
      `;
    }

    return `
      <article class="literacy-play-card" data-lc-play="${category.id}:${levelIndex}">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
          <div>
            <h3>${escapeHtml(category.icon)} ${escapeHtml(level.title)}</h3>
            <small>${state.locked ? "Intentos agotados" : `Intentos restantes: ${remaining}/${MAX_ATTEMPTS}`}</small>
          </div>
          <span class="literacy-chip">Mejor nota: ${state.bestScore}/100</span>
        </div>
        ${content}
        <div class="literacy-score-row">
          <button class="literacy-btn ghost" type="button" data-lc-back-category="${category.id}">Volver</button>
          <button class="literacy-btn primary" type="button" data-lc-submit="${category.id}:${levelIndex}" ${state.locked ? "disabled" : ""}>Revisar respuesta</button>
        </div>
        ${state.locked ? `<div class="literacy-feedback danger">Has alcanzado el límite de intentos para este nivel.</div>` : ""}
      </article>
    `;
  }

  function renderLiteracyModal(modal) {
    const studentId = modal.dataset.studentId;
    const categoryId = modal.dataset.categoryId || "";
    const levelIndex = Number(modal.dataset.levelIndex || 0);
    const summary = summarizeStudent(studentId);
    const category = categoryId ? getCategory(categoryId) : null;

    modal.innerHTML = `
      <div class="literacy-modal-head">
        <div>
          <h3>✍️ Centro de Lectura y Escritura</h3>
          <p class="teacher-lite-placeholder">Sección independiente con progreso, intentos y notas propias.</p>
        </div>
        <div class="literacy-modal-actions">
          ${category ? `<button class="literacy-btn ghost" type="button" data-lc-home="1">Volver a categorías</button>` : ""}
          <button class="literacy-btn ghost" type="button" data-lc-close="1">Cerrar</button>
        </div>
      </div>
      <div class="literacy-content">
        ${!category ? `
          <div class="literacy-score-row" style="margin-bottom:14px;">
            <div class="literacy-side-item">
              <strong>Promedio general</strong>
              <div class="literacy-mini-track"><i class="${tone(summary.average)}" style="width:${summary.average}%"></i></div>
              <small>${summary.average}/100</small>
            </div>
            <div class="literacy-side-item">
              <strong>Intentos y niveles</strong>
              <small>Intentos usados: ${summary.attempts}</small>
              <small>Niveles completados: ${summary.completedLevels}/30</small>
              <small>Niveles agotados: ${summary.exhaustedLevels}</small>
            </div>
          </div>
          <div class="literacy-grid">
            ${CATEGORIES.map((item) => renderCategoryOverview(studentId, item)).join("")}
          </div>
        ` : levelIndex > 0 ? renderPlay(category, levelIndex, studentId) : `
          <div class="literacy-side-item" style="margin-bottom:14px;">
            <strong>${category.icon} ${escapeHtml(category.title)}</strong>
            <small>Notas separadas del resto de los temarios.</small>
          </div>
          ${renderLevels(studentId, category)}
        `}
      </div>
    `;

    bindModal(modal);
  }

  function bindModal(modal) {
    modal.querySelector("[data-lc-close]")?.addEventListener("click", closeLiteracyCenter);
    modal.querySelector("[data-lc-home]")?.addEventListener("click", () => {
      modal.dataset.categoryId = "";
      modal.dataset.levelIndex = "";
      renderLiteracyModal(modal);
    });
    modal.querySelectorAll("[data-lc-open-category]").forEach((button) => {
      button.addEventListener("click", () => {
        modal.dataset.categoryId = button.dataset.lcOpenCategory;
        modal.dataset.levelIndex = "";
        renderLiteracyModal(modal);
      });
    });
    modal.querySelectorAll("[data-lc-open-level]").forEach((button) => {
      button.addEventListener("click", () => {
        const [categoryId, levelIndex] = button.dataset.lcOpenLevel.split(":");
        modal.dataset.categoryId = categoryId;
        modal.dataset.levelIndex = levelIndex;
        renderLiteracyModal(modal);
      });
    });
    modal.querySelectorAll("[data-lc-back-category]").forEach((button) => {
      button.addEventListener("click", () => {
        modal.dataset.categoryId = button.dataset.lcBackCategory;
        modal.dataset.levelIndex = "";
        renderLiteracyModal(modal);
      });
    });
    modal.querySelectorAll("[data-lc-start-timer]").forEach((button) => {
      button.addEventListener("click", () => {
        const play = button.closest("[data-lc-play]");
        if (!play) return;
        play.dataset.lcStarted = "1";
        play.dataset.lcStartTime = String(Date.now());
        const readout = play.querySelector("[data-lc-timer-readout]");
        if (readout) readout.textContent = "Tiempo registrado: leyendo...";
      });
    });
    modal.querySelectorAll("[data-lc-stop-timer]").forEach((button) => {
      button.addEventListener("click", () => {
        const play = button.closest("[data-lc-play]");
        if (!play || play.dataset.lcStarted !== "1") return;
        const elapsed = Math.max(1, Math.round((Date.now() - Number(play.dataset.lcStartTime || 0)) / 1000));
        play.dataset.lcElapsed = String(elapsed);
        const readout = play.querySelector("[data-lc-timer-readout]");
        if (readout) readout.textContent = `Tiempo registrado: ${elapsed} s`;
      });
    });
    modal.querySelectorAll("[data-lc-submit]").forEach((button) => {
      button.addEventListener("click", () => {
        const [categoryId, levelIndexRaw] = button.dataset.lcSubmit.split(":");
        const levelIndex = Number(levelIndexRaw);
        const category = getCategory(categoryId);
        const studentId = modal.dataset.studentId;
        if (!category || !studentId) return;
        const key = `${studentId}:${categoryId}:${levelIndex}`;
        const now = Date.now();
        if (button.dataset.lcBusy === "1") return;
        if (now - Number(recentSubmits.get(key) || 0) < 700) return;
        recentSubmits.set(key, now);
        const current = getLevelState(studentId, categoryId, levelIndex);
        if (current.locked || Number(current.attemptsUsed || 0) >= MAX_ATTEMPTS) {
          renderLiteracyModal(modal);
          return;
        }
        button.dataset.lcBusy = "1";
        button.disabled = true;
        const play = button.closest("[data-lc-play]");
        const level = category.levels[levelIndex - 1];
        const result = evaluateLevel(level, play);
        updateStudentLevel(studentId, categoryId, levelIndex, {
          score: result.score,
          type: level.type,
          errors: result.errors,
          percent: result.percent
        });
        const feedback = document.createElement("div");
        feedback.className = `literacy-feedback ${result.score >= 80 ? "" : result.score >= 50 ? "warn" : "danger"}`;
        feedback.textContent = result.message;
        play.appendChild(feedback);
        window.setTimeout(() => {
          renderStudentSummary(app.querySelector(".real-student"), studentId);
          if (result.score >= 70) {
            if (levelIndex < category.levels.length) {
              modal.dataset.categoryId = categoryId;
              modal.dataset.levelIndex = String(levelIndex + 1);
            } else {
              modal.dataset.categoryId = categoryId;
              modal.dataset.levelIndex = "";
            }
          }
          renderLiteracyModal(modal);
        }, 700);
      });
    });
  }

  function renderTeacherSection(shell) {
    const main = shell.querySelector(".teacher-lite-main");
    if (!main || main.querySelector(".literacy-teacher-panel")) return;
    const students = readJson(STUDENTS_KEY, []);
    const session = getSession();
    if (!session || session.role !== "teacher") return;
    const ownStudents = students.filter((student) => student.teacherId === session.id);
    const summaries = ownStudents.map((student) => ({
      student,
      summary: summarizeStudent(student.id)
    }));
    const course = CATEGORIES.map((category) => {
      const scores = summaries.map((item) => item.summary.categories.find((entry) => entry.id === category.id)?.score || 0);
      return {
        icon: category.icon,
        title: category.title,
        average: clamp100(scores.reduce((sum, value) => sum + value, 0) / Math.max(1, scores.length))
      };
    });
    const panel = document.createElement("section");
    panel.className = "teacher-lite-panel literacy-teacher-panel";
    panel.innerHTML = `
      <div class="teacher-lite-kicker">Centro de Lectura y Escritura</div>
      <div class="literacy-score-row" style="margin-bottom:14px;">
        ${course.map((item) => `
          <article class="literacy-side-item">
            <strong>${item.icon} ${escapeHtml(item.title)}</strong>
            <div class="literacy-mini-track"><i class="${tone(item.average)}" style="width:${item.average}%"></i></div>
            <small>${item.average}/100</small>
          </article>
        `).join("")}
      </div>
      <div class="literacy-teacher-list">
        ${summaries.length ? summaries.map((item) => {
          const weakest = [...item.summary.categories].sort((a, b) => a.score - b.score)[0];
          return `
            <article class="literacy-teacher-item">
              <strong>${escapeHtml(item.student.name)}</strong>
              <small>Promedio del centro: ${item.summary.average}/100</small>
              <small>Niveles completados: ${item.summary.completedLevels}/30</small>
              <small>Intentos usados: ${item.summary.attempts}</small>
              <small>Niveles agotados: ${item.summary.exhaustedLevels}</small>
              <small>Dificultad principal: ${weakest ? `${weakest.title} (${weakest.score}/100)` : "Sin datos"}</small>
            </article>
          `;
        }).join("") : `<div class="literacy-empty">Todavía no hay estudiantes registrados en esta clase.</div>`}
      </div>
    `;
    main.appendChild(panel);
  }

  function ensureTeacherShell(session) {
    const shell = app.querySelector(".teacher-lite-shell");
    if (!shell || !session || session.role !== "teacher") return;
    ensureStyle();
    renderTeacherSection(shell);
  }

  function mount() {
    const session = getSession();
    if (!session) return;
    if (session.role === "student") ensureStudentShell(session);
    if (session.role === "teacher") ensureTeacherShell(session);
  }

  const observer = new MutationObserver(() => mount());
  observer.observe(app, { childList: true });

  window.__YOYO_LITERACY_CENTER__ = {
    summarizeStudent,
    summarizeCategory,
    openLiteracyCenter
  };

  mount();
})();
