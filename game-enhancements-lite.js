(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const HELP = {
    order: {
      title: "Como jugar",
      steps: [
        "Arrastra cada tarjeta y colócala en el orden correcto.",
        "Revisa de arriba hacia abajo antes de verificar.",
        "Cuando termines, pulsa Verificar al final.",
      ],
    },
    timeline: {
      title: "Como jugar",
      steps: [
        "Lee todos los pasos del proceso.",
        "Muévelos hasta formar la secuencia correcta.",
        "Verifica solo cuando el proceso esté completo.",
      ],
    },
    dropfill: {
      title: "Como jugar",
      steps: [
        "Arrastra o toca las palabras del banco.",
        "Llena todos los espacios vacíos.",
        "Después revisa la frase completa y pulsa Verificar.",
      ],
    },
    classify: {
      title: "Como jugar",
      steps: [
        "Lee cada tarjeta del banco.",
        "Arrástrala a la caja correcta según su categoría.",
        "No dejes tarjetas fuera antes de verificar.",
      ],
    },
    memory: {
      title: "Como jugar",
      steps: [
        "Toca dos cartas para descubrir lo que esconden.",
        "Recuerda su posición para encontrar las parejas.",
        "Completa todas las parejas y luego verifica.",
      ],
    },
    target: {
      title: "Como jugar",
      steps: [
        "Lee con calma todas las tarjetas que aparecen en pantalla.",
        "Debes tocar varias tarjetas correctas: marca solo las ideas que sí cumplen la misión del temario.",
        "Deja sin seleccionar los distractores y luego pulsa Verificar.",
      ],
    },
    choice: {
      title: "Como jugar",
      steps: [
        "Observa todas las opciones de cierre o solución.",
        "Elige la alternativa más completa y correcta.",
        "Verifica al finalizar tu elección.",
      ],
    },
    cubes: {
      title: "Como jugar",
      steps: [
        "Lee una por una las palabras que aparecen dentro de los cubos.",
        "Toca todos los cubos que sí pertenecen al temario que estás jugando y deja sin tocar los distractores.",
        "Antes de verificar, revisa si elegiste varias palabras correctas y no marcaste cubos de otros temas.",
      ],
    },
    pair: {
      title: "Como jugar",
      steps: [
        "Lee todas las tarjetas con calma y compáralas entre sí.",
        "Debes marcar varias tarjetas que sí pertenecen al mismo grupo del temario.",
        "Deja sin tocar las palabras distractoras, revisa tu selección y luego pulsa Verificar.",
      ],
    },
    wordhunt: {
      title: "Como jugar",
      steps: [
        "Busca únicamente las palabras secretas del tema.",
        "Marca las palabras correctas una por una.",
        "Cuando termines tu búsqueda, pulsa Verificar.",
      ],
    },
  };

  const LEVELS = {
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

  const TOPIC_CONTENT = {
    carta: {
      learn: "Aprendes a organizar una carta, expresar gratitud y cerrar con respeto.",
      words: ["saludo", "gratitud", "despedida", "firma", "destinatario", "mensaje"],
      challenge: "Piensa que parte de la carta ayuda a mostrar carino y respeto.",
    },
    receta: {
      learn: "Aprendes a seguir un orden, usar ingredientes y cuidar la higiene al explicar un proceso.",
      words: ["ingredientes", "pasos", "medidas", "mezclar", "servir", "utensilios"],
      challenge: "Antes de verificar, revisa si cada paso mantiene el orden correcto del proceso.",
    },
    expositivo: {
      learn: "Aprendes a informar con datos, subtitulos y explicaciones claras.",
      words: ["dato", "subtitulo", "fuente", "explicacion", "titulo", "informacion"],
      challenge: "Preguntate si tu respuesta informa con hechos o solo con opiniones.",
    },
    comentario: {
      learn: "Aprendes a opinar con razones, ejemplos y lenguaje respetuoso.",
      words: ["opinion", "razon", "ejemplo", "respeto", "dialogo", "argumento"],
      challenge: "Revisa si tu eleccion ayuda a dialogar o si puede sonar irrespetuosa.",
    },
    anuncio: {
      learn: "Aprendes a comunicar un mensaje claro, atractivo y con datos importantes.",
      words: ["mensaje", "voz", "invitacion", "horario", "publico", "lugar"],
      challenge: "Comprueba si tu respuesta informa y motiva al publico al mismo tiempo.",
    },
  };

  const COMPETENCY_SUPPORT = {
    order: {
      C1: "Reconoce y organiza ideas del texto en el orden correcto.",
      C2: "Usa pensamiento logico para construir una secuencia con sentido.",
      C3: "Relaciona el mensaje con acciones y decisiones del contexto.",
    },
    timeline: {
      C1: "Comprende las ideas principales de cada paso del texto.",
      C2: "Ordena procesos y secuencias usando logica y observacion.",
      C3: "Conecta el proceso con situaciones reales y responsables.",
    },
    dropfill: {
      C1: "Completa mensajes con palabras adecuadas y coherentes.",
      C2: "Analiza que palabra encaja mejor segun el contexto.",
      C3: "Relaciona el mensaje con acciones utiles y cercanas a su realidad.",
    },
    classify: {
      C1: "Distingue palabras, ideas y partes del texto con precision.",
      C2: "Clasifica informacion segun criterios claros y ordenados.",
      C3: "Reconoce categorias relacionadas con valores, salud o convivencia.",
    },
    memory: {
      C1: "Refuerza vocabulario y conceptos propios del temario.",
      C2: "Ejercita memoria, atencion y relacion entre elementos.",
      C3: "Asocia ideas del tema con su uso en la vida diaria.",
    },
    target: {
      C1: "Identifica mensajes correctos y expresiones adecuadas del tema.",
      C2: "Compara opciones y decide cuales cumplen la consigna.",
      C3: "Selecciona ideas utiles para actuar, convivir y cuidar su entorno.",
    },
    choice: {
      C1: "Reconoce la mejor formulacion final del mensaje.",
      C2: "Evalua alternativas y elige la mas completa y coherente.",
      C3: "Relaciona la mejor respuesta con decisiones responsables.",
    },
    cubes: {
      C1: "Diferencia palabras propias del tema y vocabulario distractor.",
      C2: "Filtra informacion usando observacion y criterio.",
      C3: "Vincula conceptos del juego con acciones del contexto real.",
    },
    pair: {
      C1: "Relaciona ideas que pertenecen al mismo campo del temario.",
      C2: "Agrupa conceptos usando comparacion, analisis y logica.",
      C3: "Asocia esas ideas con valores, salud, ambiente o convivencia.",
    },
    wordhunt: {
      C1: "Reconoce vocabulario clave del texto o del temario.",
      C2: "Busca y discrimina informacion relevante entre distractores.",
      C3: "Conecta palabras importantes con mensajes utiles para su entorno.",
    },
  };

  const addActivityTags = () => {
    app.querySelectorAll(".activity-box").forEach((card) => {
      if (card.dataset.liteReady === "1") return;
      card.dataset.liteReady = "1";
      const title = card.querySelector("h4")?.textContent || "";
      const number = Number((title.match(/^(\d+)/) || [])[1] || 1);
      const level = LEVELS[number] || "Basico";
      const strip = document.createElement("div");
      strip.className = "activity-extra";
      strip.innerHTML = `
        <div class="activity-tags">
          <span class="activity-tag level-tag">Nivel ${level}</span>
          <span class="activity-tag">Interactivo</span>
          <span class="activity-tag">Visual</span>
          <span class="activity-tag">C1 C2 C3</span>
        </div>
        <div class="activity-note">Actividad organizada por nivel, instrucciones guiadas y competencias integradas.</div>
      `;
      card.appendChild(strip);
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
          <button class="competency-close" type="button" data-close-competency="1">x</button>
          <div class="competency-chip">Competencias</div>
          <h3 id="competencyTitle"></h3>
          <p class="competency-text"></p>
        </div>
      `;
      app.appendChild(modal);
    }
  };

  const addGuides = () => {
    app.querySelectorAll(".play-card[data-g]").forEach((card) => {
      if (card.dataset.guideLiteReady === "1") return;
      card.dataset.guideLiteReady = "1";

      const type = card.dataset.k;
      const number = Number((card.dataset.g || "").split("-").pop() || 1);
      const help = HELP[type];
      if (!help) return;
      const competencyMap = COMPETENCY_SUPPORT[type] || COMPETENCY_SUPPORT.order;

      const guide = document.createElement("section");
      guide.className = "game-guide-grid";
      guide.innerHTML = `
        <article class="guide-card guide-card-main">
          <div>
            <div class="guide-label">${help.title}</div>
            <ol class="guide-list">
              ${help.steps.map((step) => `<li>${step}</li>`).join("")}
            </ol>
          </div>
        </article>
        <article class="guide-card competency-guide-card">
          <div class="guide-label">Competencias que trabajas</div>
          <div class="competency-mini-grid">
            ${["C1", "C2", "C3"].map((key) => `
              <button class="competency-mini-card" type="button" data-competency-key="${key}">
                <strong>${key}</strong>
                <span>${competencyMap[key]}</span>
              </button>
            `).join("")}
          </div>
        </article>
      `;

      const top = card.querySelector(".play-top");
      top?.insertAdjacentElement("afterend", guide);
    });
  };

  const expandBoards = () => {
    app.querySelectorAll(".play-card .game-board").forEach((board) => {
      if (board.dataset.expandedLite === "1") return;
      board.dataset.expandedLite = "1";
      const chip = board.querySelector(".instruction-chip");
      if (chip) chip.classList.add("instruction-chip-hero");
    });

    app.querySelectorAll(".drag-strip").forEach((strip, index) => {
      if (strip.querySelector(".story-badge")) return;
      const badge = document.createElement("span");
      badge.className = "story-badge";
      badge.textContent = `Paso ${index + 1}`;
      strip.insertBefore(badge, strip.firstChild);
    });

    app.querySelectorAll(".memory-grid").forEach((grid) => {
      if (grid.parentElement.querySelector(".memory-progress-lite")) return;
      const note = document.createElement("div");
      note.className = "memory-progress memory-progress-lite";
      note.textContent = "Encuentra todas las parejas antes de verificar.";
      grid.parentElement.insertBefore(note, grid);
    });

  };

  const moveGameStatusBesideCompetencies = () => {
    app.querySelectorAll(".play-card[data-g]").forEach((card) => {
      const guideGrid = card.querySelector(".game-guide-grid");
      const statusPanel = card.querySelector(".radial-status-grid, .radial-fill-topbar");
      if (!guideGrid || !statusPanel) return;
      if (guideGrid.querySelector(".game-status-guide")) return;

      const article = document.createElement("article");
      article.className = "guide-card game-status-guide";
      article.innerHTML = `<div class="guide-label">Progreso del juego</div>`;
      article.appendChild(statusPanel);
      guideGrid.appendChild(article);
    });
  };

  const refresh = () => {
    prepareCompetencyButtons();
    addActivityTags();
    addGuides();
    expandBoards();
    moveGameStatusBesideCompetencies();
  };

  app.addEventListener("click", (event) => {
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
    }
  });

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

  const observer = new MutationObserver(() => refresh());
  observer.observe(app, { childList: true, subtree: true });
  refresh();
})();
