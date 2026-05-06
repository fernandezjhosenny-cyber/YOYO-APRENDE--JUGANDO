(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const TARGET_GAME = "anuncio-8";
  const SESSION_KEY = "yoyo_rg_x";
  const PROGRESS_KEY = "yoyo_rg_p";
  const STATE_KEY = "yoyo_radial_wordsearch_state";
  const LETTERS = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";

  const LEVELS = [
    {
      title: "Nivel 1",
      subtitle: "Vocabulario básico",
      prompt: "Busca las palabras del anuncio radial dentro de la cuadrícula y selecciónalas en orden.",
      size: 10,
      words: [
        ["ANUNCIO", "Mensaje que busca informar o convencer."],
        ["RADIO", "Medio por donde se puede escuchar el anuncio."],
        ["MENSAJE", "Idea principal que se comunica."],
        ["PRODUCTO", "Objeto o servicio que se promociona."],
        ["PUBLICO", "Personas a quienes va dirigido el anuncio."],
        ["COMPRA", "Acción que el anuncio puede motivar."],
      ],
    },
    {
      title: "Nivel 2",
      subtitle: "Estructura del anuncio radial",
      prompt: "Encuentra palabras relacionadas con las partes que organizan un anuncio radial.",
      size: 11,
      words: [
        ["LLAMADA", "Inicio que capta la atención."],
        ["PRESENTACION", "Parte donde se da a conocer el producto o idea."],
        ["ARGUMENTACION", "Razones o beneficios para convencer."],
        ["CIERRE", "Final que invita a actuar."],
        ["IMPLICACION", "Llamado final para que el público haga algo."],
        ["ESTRUCTURA", "Organización del anuncio."],
      ],
    },
    {
      title: "Nivel 3",
      subtitle: "Lenguaje persuasivo",
      prompt: "Identifica vocabulario persuasivo que ayuda a convencer al oyente.",
      size: 12,
      words: [
        ["PERSUASION", "Forma de convencer al oyente."],
        ["BENEFICIO", "Ventaja que ofrece el producto o acción."],
        ["OFERTA", "Oportunidad especial para llamar la atención."],
        ["APROVECHA", "Palabra que invita a actuar."],
        ["PRUEBA", "Mandato usado para convencer."],
        ["DELICIOSO", "Adjetivo persuasivo."],
        ["SALUDABLE", "Palabra que presenta una cualidad positiva."],
        ["URGENTE", "Palabra que crea necesidad de actuar rápido."],
      ],
    },
    {
      title: "Nivel 4",
      subtitle: "Gramática del anuncio radial",
      prompt: "Busca palabras gramaticales que aparecen dentro del lenguaje del anuncio radial.",
      size: 12,
      words: [
        ["IMPERATIVA", "Oración que ordena, aconseja o invita."],
        ["INTERROGATIVA", "Oración que pregunta."],
        ["INFORMATIVA", "Oración que da datos o explica."],
        ["ADJETIVO", "Palabra que describe cualidades."],
        ["VERBO", "Palabra que expresa acción."],
        ["ORACION", "Conjunto de palabras con sentido completo."],
        ["TONO", "Forma en que se expresa la voz."],
        ["VOZ", "Recurso oral usado en el anuncio."],
      ],
    },
    {
      title: "Nivel 5",
      subtitle: "Anuncio de interés social",
      prompt: "Encuentra palabras clave de los anuncios radiales que promueven prevención y cuidado.",
      size: 12,
      words: [
        ["DENGUE", "Enfermedad transmitida por mosquitos."],
        ["CHIKUNGUNYA", "Enfermedad que también puede transmitirse por mosquitos."],
        ["MOSQUITOS", "Insectos que pueden transmitir enfermedades."],
        ["CRIADEROS", "Lugares donde se reproducen mosquitos."],
        ["PREVENCION", "Acciones para evitar problemas."],
        ["COMUNIDAD", "Grupo de personas que comparten un lugar."],
        ["FAMILIA", "Grupo cercano que se debe proteger."],
        ["SALUD", "Bienestar del cuerpo."],
      ],
    },
  ];

  let audioContext = null;

  function getStudentId() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      return session?.role === "student" ? session.id : "guest";
    } catch {
      return "guest";
    }
  }

  function createState() {
    return {
      levelIndex: 0,
      found: {},
      scores: {},
      stars: {},
      hints: {},
      bonus: {},
      checks: {},
      feedback: null,
      selection: [],
      finished: false,
      puzzles: {},
    };
  }

  function ensureState(state) {
    const levelIndex = state.levelIndex;
    state.found[levelIndex] = state.found[levelIndex] || [];
    state.scores[levelIndex] = state.scores[levelIndex] || 0;
    state.stars[levelIndex] = state.stars[levelIndex] || 0;
    state.hints[levelIndex] = state.hints[levelIndex] || 0;
    state.bonus[levelIndex] = Boolean(state.bonus[levelIndex]);
    state.checks[levelIndex] = state.checks[levelIndex] || 0;
    state.puzzles[levelIndex] = state.puzzles[levelIndex] || buildPuzzle(LEVELS[levelIndex]);
    state.selection = Array.isArray(state.selection) ? state.selection : [];
  }

  function loadState() {
    const studentId = getStudentId();
    try {
      const all = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
      return all[studentId] || createState();
    } catch {
      return createState();
    }
  }

  function saveState(state) {
    const studentId = getStudentId();
    const all = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
    all[studentId] = state;
    localStorage.setItem(STATE_KEY, JSON.stringify(all));
  }

  function buildPuzzle(level) {
    const size = Math.max(level.size, ...level.words.map(([display]) => normalizeWord(display).length));
    const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => ""));
    const directions = [
      [1, 0],
      [0, 1],
      [1, 1],
      [-1, 1],
    ];
    const placements = [];

    level.words.forEach(([display, definition]) => {
      const word = normalizeWord(display);
      let placed = false;

      for (let attempt = 0; attempt < 240 && !placed; attempt += 1) {
        const [dx, dy] = directions[Math.floor(Math.random() * directions.length)];
        const startCol = randomInt(dx === -1 ? word.length - 1 : 0, dx === 1 ? size - word.length : size - 1);
        const startRow = randomInt(0, dy === 1 ? size - word.length : size - 1);
        const cells = [];
        let valid = true;

        for (let index = 0; index < word.length; index += 1) {
          const col = startCol + dx * index;
          const row = startRow + dy * index;
          const current = grid[row]?.[col];
          if (current === undefined || (current && current !== word[index])) {
            valid = false;
            break;
          }
          cells.push({ row, col, letter: word[index], key: `${row}-${col}` });
        }

        if (!valid) continue;

        cells.forEach((cell) => {
          grid[cell.row][cell.col] = cell.letter;
        });

        placements.push({
          display,
          normalized: word,
          definition,
          cells,
          path: cells.map((cell) => cell.key),
          reversePath: [...cells].reverse().map((cell) => cell.key),
        });
        placed = true;
      }

      if (!placed) {
        throw new Error(`No se pudo colocar la palabra ${display}`);
      }
    });

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (!grid[row][col]) {
          grid[row][col] = LETTERS[Math.floor(Math.random() * LETTERS.length)];
        }
      }
    }

    return { size, grid, placements };
  }

  function totalScore(state) {
    return Object.values(state.scores).reduce((sum, value) => sum + value, 0);
  }

  function totalStars(state) {
    return Object.values(state.stars).reduce((sum, value) => sum + value, 0);
  }

  function mount() {
    renameActivityCard();

    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    if (!card || card.dataset.radialWordsearchReady === "1") return;
    card.dataset.radialWordsearchReady = "1";

    const title = card.querySelector(".play-top h3");
    const text = card.querySelector(".play-top .muted-main");
    if (title && title.textContent !== "8. Sopa de palabras") title.textContent = "8. Sopa de palabras";
    if (text && text.textContent !== "Encuentra vocabulario clave del anuncio radial en una cuadrícula interactiva.") {
      text.textContent = "Encuentra vocabulario clave del anuncio radial en una cuadrícula interactiva.";
    }

    const board = card.querySelector(".game-board");
    const actionRow = card.querySelector(".action-row");
    if (!board || !actionRow) return;

    const state = loadState();
    ensureState(state);
    saveState(state);
    render(card, board, actionRow, state);
  }

  function renameActivityCard() {
    app.querySelectorAll(`[data-oa="${TARGET_GAME}"]`).forEach((button) => {
      const heading = button.querySelector("h4");
      const copy = button.querySelector("p");
      if (heading && heading.textContent !== "8. Sopa de palabras") heading.textContent = "8. Sopa de palabras";
      if (copy && copy.textContent !== "Busca vocabulario del anuncio radial y descubre su significado.") {
        copy.textContent = "Busca vocabulario del anuncio radial y descubre su significado.";
      }
    });
  }

  function render(card, board, actionRow, state) {
    if (state.finished) {
      renderFinal(board, actionRow, state);
      return;
    }

    ensureState(state);
    const level = LEVELS[state.levelIndex];
    const puzzle = state.puzzles[state.levelIndex];
    const found = new Set(state.found[state.levelIndex]);
    const selection = state.selection;
    const currentWord = selection.map((cell) => cell.letter).join("");
    const hintCells = getHintCells(state, puzzle);
    const allFound = found.size === puzzle.placements.length;
    const reviewed = (state.checks[state.levelIndex] || 0) > 0;

    board.innerHTML = `
      <section class="radial-wordsearch-app">
        <div class="radial-fill-topbar">
          <article class="radial-fill-stat">
            <div class="radial-kicker">Progreso</div>
            <strong>${level.title}</strong>
            <span>${level.subtitle}</span>
          </article>
          <article class="radial-fill-stat">
            <div class="radial-kicker">Puntos acumulados</div>
            <strong>${totalScore(state)}</strong>
            <span>${"★".repeat(Math.max(1, totalStars(state) || 1))}</span>
          </article>
          <article class="radial-fill-stat">
            <div class="radial-kicker">Meta</div>
            <strong>${found.size}/${puzzle.placements.length}</strong>
            <span>palabras encontradas</span>
          </article>
        </div>

        <section class="radial-fill-help">
          <div>
            <div class="radial-kicker">Cómo jugar</div>
            <p>${level.prompt}</p>
          </div>
          <button class="real-ghost" type="button" data-word-repeat="1">Repetir instrucciones</button>
        </section>

        <section class="radial-wordsearch-stage">
          <div class="instruction-chip">Selecciona letras contiguas y luego presiona Verificar</div>

          <div class="radial-wordsearch-layout">
            <div class="radial-wordsearch-board">
              <div class="word-search-preview">
                <div class="word-search-current">${currentWord || "Selecciona una palabra de la cuadrícula"}</div>
                <div class="real-meta">
                  <span class="status-badge">Pistas usadas: ${state.hints[state.levelIndex]}</span>
                  <span class="status-badge">${allFound ? "nivel completado" : "buscando palabras"}</span>
                </div>
              </div>

              <div class="word-search-grid radial-wordsearch-grid" style="grid-template-columns:repeat(${puzzle.size}, minmax(0, 1fr));">
                ${puzzle.grid
                  .map((row, rowIndex) =>
                    row
                      .map((letter, colIndex) => {
                        const key = `${rowIndex}-${colIndex}`;
                        const selected = selection.some((cell) => cell.key === key);
                        const relatedPlacements = puzzle.placements.filter(
                          (placement) => placement.path.includes(key)
                        );
                        const isFound = relatedPlacements.some((placement) => found.has(placement.display));
                        const isLocked =
                          relatedPlacements.length > 0 &&
                          relatedPlacements.every((placement) => found.has(placement.display));
                        const hinted = hintCells.includes(key);
                        return `
                          <button
                            class="letter-tile radial-word-tile ${selected ? "selected" : ""} ${isFound ? "found" : ""} ${hinted ? "hint" : ""}"
                            data-word-cell="${key}"
                            data-word-letter="${letter}"
                            data-word-row="${rowIndex}"
                            data-word-col="${colIndex}"
                            type="button"
                            ${isLocked ? "disabled" : ""}
                          >
                            ${letter}
                          </button>
                        `;
                      })
                      .join("")
                  )
                  .join("")}
              </div>
            </div>

            <aside class="radial-wordsearch-side">
              <section class="content-card radial-word-list-card">
                <div class="radial-kicker">Palabras del nivel</div>
                <div class="radial-word-goals">
                  ${puzzle.placements
                    .map(
                      (placement) => `
                        <button
                          class="goal-chip ${found.has(placement.display) ? "found" : ""}"
                          type="button"
                          data-word-goal="${escapeHtml(placement.display)}"
                        >
                          ${escapeHtml(formatLabel(placement.display))}
                        </button>
                      `
                    )
                    .join("")}
                </div>
              </section>

              <section class="content-card radial-word-definition-card">
                <div class="radial-kicker">Significado</div>
                <div class="radial-word-definitions">
                  ${
                    found.size
                      ? puzzle.placements
                          .filter((placement) => found.has(placement.display))
                          .map(
                            (placement) => `
                              <article class="radial-word-definition">
                                <strong>${escapeHtml(formatLabel(placement.display))}</strong>
                                <p>${escapeHtml(placement.definition)}</p>
                              </article>
                            `
                          )
                          .join("")
                      : `<p class="radial-word-empty">Cada palabra encontrada mostrará aquí su definición breve.</p>`
                  }
                </div>
              </section>
            </aside>
          </div>
        </section>

        <section class="radial-fill-feedback ${state.feedback?.type || ""}">
          <div class="radial-kicker">Retroalimentación</div>
          <strong>${state.feedback?.title || "Busca vocabulario clave del anuncio radial."}</strong>
          <p>${state.feedback?.text || "Selecciona las letras de una palabra en orden. Cuando completes una palabra correcta, verás su significado dentro del tema."}</p>
        </section>

        <details class="radial-teacher-panel">
          <summary>Panel docente</summary>
          <div class="radial-teacher-grid">
            <article>
              <h4>Objetivo</h4>
              <p>Reconocer vocabulario clave del anuncio radial y comprender su función.</p>
            </article>
            <article>
              <h4>Competencias</h4>
              <p>Comunicativa, pensamiento lógico, creativo y crítico, y ética y ciudadana.</p>
            </article>
            <article>
              <h4>Uso en clase</h4>
              <p>Puede utilizarse después de explicar el tema para reforzar palabras, estructura, recursos persuasivos y gramática en contexto.</p>
            </article>
            <article>
              <h4>Evidencia</h4>
              <p>El estudiante identifica vocabulario del anuncio radial y asocia cada palabra con su significado dentro del contenido trabajado.</p>
            </article>
          </div>
        </details>
      </section>
    `;

    actionRow.innerHTML = `
      <button class="real-ghost" type="button" data-word-hint="1">Pista</button>
      <button class="real-ghost" type="button" data-word-clear="1" ${selection.length ? "" : "disabled"}>Limpiar selección</button>
      <button class="real-ghost" type="button" data-word-reset="1">Reintentar</button>
      <button class="real-action" type="button" data-word-check="1">Verificar</button>
      <button class="real-action ${reviewed ? "" : "radial-disabled"}" type="button" data-word-next="1" ${reviewed ? "" : "disabled"}>Siguiente nivel</button>
    `;

    bindBoard(board, actionRow, state);
  }

  function bindBoard(board, actionRow, state) {
    board.querySelectorAll("[data-word-cell]").forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.wordCell;
        const letter = button.dataset.wordLetter;
        const row = Number(button.dataset.wordRow);
        const col = Number(button.dataset.wordCol);
        const last = state.selection[state.selection.length - 1];
        const existingIndex = state.selection.findIndex((cell) => cell.key === key);

        if (last && last.key === key) {
          state.selection.pop();
          state.feedback = {
            type: "",
            title: "Selección ajustada",
            text: "Quitaste la última letra. Sigue formando la palabra en una línea recta.",
          };
        } else if (existingIndex >= 0) {
          state.selection = state.selection.slice(0, existingIndex + 1);
          state.feedback = {
            type: "",
            title: "Retroceso realizado",
            text: "Puedes volver atrás dentro de la misma palabra y continuar desde ese punto.",
          };
        } else {
          const nextCell = { key, letter, row, col };
          state.selection.push(nextCell);
          state.feedback = {
            type: "",
            title: "Selección en progreso",
            text: "Sigue marcando letras y luego presiona Verificar para comprobar si formaste una palabra correcta.",
          };
        }
        playTone("select");
        saveState(state);
        render(board.closest(".play-card"), board, actionRow, state);
      });
    });

    board.querySelectorAll("[data-word-goal]").forEach((button) => {
      button.addEventListener("click", () => {
        const goal = decodeHtml(button.dataset.wordGoal);
        const placement = state.puzzles[state.levelIndex].placements.find((item) => item.display === goal);
        state.feedback = {
          type: "",
          title: formatLabel(goal),
          text: placement ? placement.definition : "Sigue buscando esta palabra dentro de la cuadrícula.",
        };
        saveState(state);
        render(board.closest(".play-card"), board, actionRow, state);
      });
    });

    board.querySelector("[data-word-repeat]")?.addEventListener("click", () => {
      state.feedback = {
        type: "",
        title: "Instrucciones repetidas",
        text: LEVELS[state.levelIndex].prompt,
      };
      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });

    actionRow.querySelector("[data-word-hint]")?.addEventListener("click", () => {
      const puzzle = state.puzzles[state.levelIndex];
      const found = new Set(state.found[state.levelIndex]);
      const nextWord = puzzle.placements.find((placement) => !found.has(placement.display));
      if (!nextWord) return;

      state.hints[state.levelIndex] += 1;
      state.scores[state.levelIndex] = Math.max(0, state.scores[state.levelIndex] - 2);
      state.feedback = {
        type: "",
        title: "Pista activada",
        text: `Busca la palabra ${formatLabel(nextWord.display)}. Empieza por la letra ${nextWord.cells[0].letter}.`,
      };
      playTone("hint");
      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });

    actionRow.querySelector("[data-word-clear]")?.addEventListener("click", () => {
      state.selection = [];
      state.feedback = {
        type: "",
        title: "Selección limpiada",
        text: "Ahora puedes volver a marcar otra palabra desde el inicio.",
      };
      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });

    actionRow.querySelector("[data-word-reset]")?.addEventListener("click", () => {
      resetLevel(state, state.levelIndex);
      state.feedback = {
        type: "",
        title: "Nivel reiniciado",
        text: "Se generó una nueva cuadrícula para este nivel. Busca las palabras otra vez con calma.",
      };
      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });

    actionRow.querySelector("[data-word-check]")?.addEventListener("click", () => {
      verifySelection(state);
      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });

    actionRow.querySelector("[data-word-next]")?.addEventListener("click", () => {
      if ((state.checks[state.levelIndex] || 0) === 0) return;
      if (state.levelIndex === LEVELS.length - 1) {
        state.finished = true;
        persistPlatformSuccess();
        playTone("victory");
      } else {
        state.levelIndex += 1;
        state.selection = [];
        ensureState(state);
        state.feedback = {
          type: "",
          title: `Ahora vas a ${LEVELS[state.levelIndex].title}`,
          text: LEVELS[state.levelIndex].prompt,
        };
        playTone("success");
      }
      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });
  }

  function verifySelection(state) {
    state.checks[state.levelIndex] = (state.checks[state.levelIndex] || 0) + 1;
    const selection = state.selection;
    const puzzle = state.puzzles[state.levelIndex];
    const found = new Set(state.found[state.levelIndex]);

    if (!selection.length) {
      state.feedback = {
        type: "error",
        title: "Primero selecciona letras",
        text: "Marca algunas letras de la cuadrícula y luego verifica. La retroalimentación te dirá si formaste una palabra del tema.",
      };
      playTone("error");
      return;
    }

    if (!isStraightContiguous(selection)) {
      state.feedback = {
        type: "error",
        title: "Selección inválida",
        text: "Las letras deben estar una al lado de la otra en línea recta: horizontal, vertical o diagonal.",
      };
      state.selection = [];
      playTone("error");
      return;
    }

    const keys = selection.map((cell) => cell.key);
    const match = puzzle.placements.find((placement) => {
      if (found.has(placement.display)) return false;
      return samePath(keys, placement.path) || samePath(keys, placement.reversePath);
    });

    if (!match) {
      state.feedback = {
        type: "error",
        title: "Esa no es una palabra objetivo",
        text: "Revisa el orden de las letras y compáralo con la lista del nivel antes de verificar otra vez.",
      };
      state.selection = [];
      playTone("error");
      return;
    }

    state.found[state.levelIndex].push(match.display);
    state.scores[state.levelIndex] += 10;
    state.selection = [];

    if (state.found[state.levelIndex].length === puzzle.placements.length && !state.bonus[state.levelIndex]) {
      if (state.hints[state.levelIndex] === 0) {
        state.scores[state.levelIndex] += 5;
      }
      state.bonus[state.levelIndex] = true;
      state.stars[state.levelIndex] = state.hints[state.levelIndex] === 0 ? 3 : state.hints[state.levelIndex] <= 2 ? 2 : 1;
      state.feedback = {
        type: "success",
        title: `${formatLabel(match.display)} encontrada`,
        text: `${match.definition} Nivel completado con ${state.scores[state.levelIndex]} puntos.`,
      };
      playTone("victory");
      return;
    }

    state.feedback = {
      type: "success",
      title: `${formatLabel(match.display)} encontrada`,
      text: match.definition,
    };
    playTone("success");
  }

  function renderFinal(board, actionRow, state) {
    const score = totalScore(state);
    const stars = totalStars(state);
    board.innerHTML = `
      <section class="radial-final-screen radial-wordsearch-final">
        <div class="radial-kicker">Juego completado</div>
        <h3>Terminaste Sopa de palabras</h3>
        <p>Puntuación total: <strong>${score}</strong></p>
        <p>Estrellas acumuladas: <strong>${"★".repeat(Math.max(1, stars))}</strong></p>
        <p>${score >= 260 ? "Excelente. Reconoces vocabulario, estructura, gramática y anuncios de interés social con mucha seguridad." : "Buen trabajo. Ya dominas muchas palabras del anuncio radial y puedes seguir reforzando su significado en contexto."}</p>
      </section>
    `;

    actionRow.innerHTML = `
      <button class="real-action" type="button" data-word-replay="1">Volver a jugar</button>
      <button class="real-ghost" type="button" data-word-close="1">Listo</button>
    `;

    actionRow.querySelector("[data-word-replay]")?.addEventListener("click", () => {
      const next = createState();
      ensureState(next);
      saveState(next);
      mountReset();
    });
    actionRow.querySelector("[data-word-close]")?.addEventListener("click", () => location.reload());
  }

  function mountReset() {
    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    const board = card?.querySelector(".game-board");
    const actionRow = card?.querySelector(".action-row");
    if (!card || !board || !actionRow) return;
    render(card, board, actionRow, loadState());
  }

  function resetLevel(state, levelIndex) {
    state.found[levelIndex] = [];
    state.scores[levelIndex] = 0;
    state.stars[levelIndex] = 0;
    state.hints[levelIndex] = 0;
    state.bonus[levelIndex] = false;
    state.checks[levelIndex] = 0;
    state.selection = [];
    state.puzzles[levelIndex] = buildPuzzle(LEVELS[levelIndex]);
  }

  function getHintCells(state, puzzle) {
    const found = new Set(state.found[state.levelIndex]);
    const placement = puzzle.placements.find((item) => !found.has(item.display));
    if (!placement || !state.hints[state.levelIndex]) return [];
    return [placement.path[0]];
  }

  function isStraightContiguous(selection) {
    if (selection.length < 2) return false;
    const dx = selection[1].col - selection[0].col;
    const dy = selection[1].row - selection[0].row;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1 || (dx === 0 && dy === 0)) return false;
    for (let index = 1; index < selection.length; index += 1) {
      const prev = selection[index - 1];
      const next = selection[index];
      if (next.col - prev.col !== dx || next.row - prev.row !== dy) return false;
    }
    return true;
  }

  function samePath(a, b) {
    return a.length === b.length && a.every((item, index) => item === b[index]);
  }

  function persistPlatformSuccess() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      if (!session?.id) return;
      const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
      progress[session.id] = progress[session.id] || {};
      progress[session.id][TARGET_GAME] = {
        ok: true,
        score: 10,
        c: ["C1", "C2", "C3"],
        msg: "Encontraste vocabulario clave del anuncio radial y comprendiste su significado.",
        topicId: "anuncio",
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {}
  }

  function playTone(type) {
    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      const now = audioContext.currentTime;
      const presets = {
        select: [380, 0.04],
        hint: [470, 0.06],
        success: [640, 0.08],
        error: [220, 0.08],
        victory: [760, 0.18],
      };
      const [frequency, duration] = presets[type] || presets.select;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch {}
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function normalizeWord(text) {
    return String(text)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "")
      .toUpperCase();
  }

  function formatLabel(text) {
    return String(text)
      .toLowerCase()
      .replace(/(^|\s)\S/g, (match) => match.toUpperCase())
      .replace("Publico", "Público")
      .replace("Persuasion", "Persuasión")
      .replace("Presentacion", "Presentación")
      .replace("Argumentacion", "Argumentación")
      .replace("Implicacion", "Implicación")
      .replace("Oracion", "Oración")
      .replace("Prevencion", "Prevención");
  }

  function decodeHtml(text) {
    const area = document.createElement("textarea");
    area.innerHTML = text;
    return area.value;
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  const observer = new MutationObserver(() => mount());
  observer.observe(app, { childList: true, subtree: true });
  mount();
})();
