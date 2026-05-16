(function () {
  const app = document.getElementById("app");
  if (!app) return;

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function ensureStyle() {
    if (document.getElementById("student-progress-style")) return;
    const style = document.createElement("style");
    style.id = "student-progress-style";
    style.textContent = `
      .student-competency-popover{margin-top:12px;padding:16px 18px;border-radius:18px;background:linear-gradient(135deg,#ffffff,#f8f5ff);box-shadow:0 12px 28px rgba(93,104,152,.12);display:grid;gap:10px;border:1px solid rgba(148,163,184,.14)}
      .student-competency-popover-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
      .student-competency-popover strong{color:#284375;font-size:1rem}
      .student-competency-popover p{margin:0;color:#5d6a84;line-height:1.6}
      .student-competency-note{font-size:.88rem;color:#6d28d9;font-weight:700}
      .student-competency-close{border:none;border-radius:999px;padding:8px 12px;background:#efe8ff;color:#6d28d9;font:inherit;font-weight:800;cursor:pointer}
      .student-competency-pill{cursor:pointer;transition:transform .15s ease, box-shadow .15s ease}
      .student-competency-pill.active{box-shadow:0 8px 18px rgba(123,54,235,.18);transform:translateY(-1px)}
      .student-topic-metric-grid{display:grid;gap:12px}
      .student-topic-metric-card{padding:14px;border-radius:18px;background:linear-gradient(135deg,#ffffff,#f8f5ff);display:grid;gap:10px;box-shadow:0 10px 24px rgba(93,104,152,.08)}
      .student-topic-metric-card strong{color:#284375}
      .student-topic-average{font-size:.88rem;color:#5d6a84}
      .student-topic-bar-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
      .student-topic-bar{display:grid;gap:4px}
      .student-topic-bar label{font-size:.72rem;font-weight:900;color:#6d28d9;text-transform:uppercase}
      .student-topic-track{height:8px;border-radius:999px;background:#edf2ff;overflow:hidden}
      .student-topic-track i{display:block;height:100%;background:linear-gradient(135deg,#1f70ff,#7b36eb)}
      .student-topic-track i.warn{background:linear-gradient(135deg,#f59e0b,#f97316)}
      .student-topic-track i.danger{background:linear-gradient(135deg,#fb7185,#ef4444)}
      .student-topic-bar span{font-size:.75rem;color:#5d6a84}
      @media (max-width: 820px){
        .student-topic-bar-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
      }
    `;
    document.head.appendChild(style);
  }

  const COMPETENCIES = {
    C1: {
      title: "Competencia Comunicativa",
      text: "Comunica sus ideas, pensamientos y sentimientos con fluidez, mediante un modelo textual conveniente, en variadas situaciones y contextos, con el fin de demostrar conocimiento y uso adecuado de su lengua, a traves de diferentes medios y recursos."
    },
    C2: {
      title: "Pensamiento Logico, Creativo y Critico + Resolucion de Problemas + Cientifica y Tecnologica",
      text: "Elabora textos orales y escritos con creatividad y criticidad segun las conclusiones de los problemas abordados en investigaciones, y las publica a traves de medios variados."
    },
    C3: {
      title: "Etica y Ciudadana + Ambiental y de la Salud + Desarrollo Personal y Espiritual",
      text: "Caracteriza problemas sociales diversos, a traves de textos orales y escritos, con la finalidad de solucionarlos, canalizando emociones, sentimientos y relaciones humanas, asi como la preservacion de la salud y el ambiente, mediante el uso de recursos diversos."
    }
  };

  function bindCompetencyInfo(shell) {
    const pills = Array.from(shell.querySelectorAll(".real-pills .real-pill"));
    if (!pills.length) return;
    const bar = shell.querySelector(".real-pills");
    if (!bar) return;
    let openKey = "";
    let popover = shell.querySelector(".student-competency-popover");

    function closePopover() {
      openKey = "";
      pills.forEach((pill) => pill.classList.remove("active"));
      if (popover) {
        popover.remove();
        popover = null;
      }
    }

    function renderPopover(key) {
      const data = COMPETENCIES[key];
      if (!data) return;
      closePopover();
      openKey = key;
      const target = pills.find((pill) => pill.dataset.competencyKey === key);
      if (target) target.classList.add("active");
      popover = document.createElement("div");
      popover.className = "student-competency-popover";
      popover.innerHTML = `
        <div class="student-competency-popover-head">
          <div>
            <strong>${key}: ${data.title}</strong>
          </div>
          <button class="student-competency-close" type="button">Cerrar</button>
        </div>
        <p>${data.text}</p>
        <div class="student-competency-note">Esta competencia influye en tu calificacion segun los puntos que obtienes en las actividades del temario.</div>
      `;
      bar.insertAdjacentElement("afterend", popover);
      popover.querySelector(".student-competency-close")?.addEventListener("click", closePopover);
    }

    pills.forEach((pill) => {
      const key = pill.textContent.trim().toUpperCase();
      if (!COMPETENCIES[key]) return;
      pill.dataset.competencyKey = key;
      pill.classList.add("student-competency-pill");
      pill.setAttribute("role", "button");
      pill.setAttribute("tabindex", "0");
      pill.addEventListener("click", () => {
        if (openKey === key) {
          closePopover();
          return;
        }
        renderPopover(key);
      });
      pill.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          pill.click();
        }
      });
    });
  }

  function tone(value) {
    if (value >= 80) return "";
    if (value >= 50) return "warn";
    return "danger";
  }

  function enhanceStudent(studentId) {
    const helper = window.__YOYO_PROGRESS__;
    if (!helper || typeof helper.summarizeStudentProgress !== "function") return;
    const shell = app.querySelector(".real-student");
    const roster = shell?.querySelector(".real-side .roster");
    if (!shell || !roster) return;

    ensureStyle();

    let store = {};
    let students = [];
    try {
      store = JSON.parse(localStorage.getItem("yoyo_rg_p") || "{}") || {};
      students = JSON.parse(localStorage.getItem("yoyo_rg_s") || "[]") || [];
    } catch {}
    const student = students.find((item) => item.id === studentId) || { id: studentId, name: "" };
    const snapshot = helper.summarizeStudentProgress(student, store[studentId] || {});
    const cards = snapshot.topicCards || [];
    if (!cards.length) return;

    roster.innerHTML = `
      <div class="student-topic-metric-grid">
        ${cards.map((topic) => `
          <article class="student-topic-metric-card">
            <div>
              <strong>${escapeHtml(topic.title)}</strong>
              <div class="student-topic-average">Promedio: ${topic.progress}/100</div>
            </div>
            <div class="student-topic-bar-grid">
              ${["C1", "C2", "C3"].map((key) => `
                <div class="student-topic-bar">
                  <label>${key}</label>
                  <div class="student-topic-track"><i class="${tone(topic.competencies[key] || 0)}" style="width:${topic.competencies[key] || 0}%"></i></div>
                  <span>${topic.competencies[key] || 0}/100</span>
                </div>
              `).join("")}
              <div class="student-topic-bar">
                <label>Prom.</label>
                <div class="student-topic-track"><i class="${tone(topic.progress || 0)}" style="width:${topic.progress || 0}%"></i></div>
                <span>${topic.progress || 0}/100</span>
              </div>
            </div>
          </article>
        `).join("")}
      </div>
    `;

    bindCompetencyInfo(shell);
  }

  window.__YOYO_PROGRESS_UI__ = {
    enhanceStudent
  };

  const observer = new MutationObserver(() => {
    const session = (() => {
      try { return JSON.parse(localStorage.getItem("yoyo_rg_x") || "null"); } catch { return null; }
    })();
    if (!session || session.role !== "student") return;
    const shell = app.querySelector(".real-student");
    if (!shell || shell.dataset.progressEnhanced === "1") return;
    shell.dataset.progressEnhanced = "1";
    enhanceStudent(session.id);
  });

  observer.observe(app, { childList: true });
})();
