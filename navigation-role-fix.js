(function () {
  if (window.location.protocol === "file:") {
    return;
  }

  const app = document.getElementById("app");
  if (!app) return;

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem("yoyo_rg_x") || "null");
    } catch {
      return null;
    }
  }

  function clearSessionAndReturn() {
    try { localStorage.removeItem("yoyo_rg_x"); } catch {}
    try { sessionStorage.removeItem("yoyo_rg_x"); } catch {}
    const current = new URL(window.location.href);
    current.searchParams.delete("owner");
    window.location.href =
      current.pathname +
      (current.searchParams.toString() ? `?${current.searchParams.toString()}` : "") +
      current.hash;
  }

  function wireLogoutButtons(root) {
    root.querySelectorAll("#lo").forEach((button) => {
      button.textContent = "Cerrar sesi\u00f3n";
      if (button.dataset.logoutFixed === "1") return;
      button.dataset.logoutFixed = "1";
      button.addEventListener("click", () => {
        window.setTimeout(clearSessionAndReturn, 30);
      }, true);
    });
  }

  function wireBackButtons(root) {
    root.querySelectorAll("#bk").forEach((button) => {
      button.textContent = "Atr\u00e1s";
    });

    root.querySelectorAll("[data-ba]").forEach((button) => {
      button.textContent = "Volver al temario";
    });

    root.querySelectorAll("[data-bt]").forEach((button) => {
      button.textContent = "Volver a los temarios";
    });

    const teacherActions = root.querySelector(".teacher-page-head .teacher-head-actions");
    if (teacherActions && !teacherActions.querySelector("[data-fixed-back]")) {
      const back = document.createElement("button");
      back.type = "button";
      back.className = "module-btn ghost";
      back.dataset.fixedBack = "1";
      back.addEventListener("click", () => {
        const clear = root.querySelector(".teacher-right-column-v2.detail-visible [data-clear-selection]");
        if (clear) {
          clear.click();
          return;
        }
        const summary = root.querySelector('[data-section-target="summary"]');
        root.querySelectorAll("[data-teacher-nav]").forEach((node) => node.classList.remove("active"));
        root.querySelector('[data-teacher-nav="summary"]')?.classList.add("active");
        summary?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      teacherActions.insertBefore(back, teacherActions.firstChild);
    }

    const teacherBack = teacherActions?.querySelector("[data-fixed-back]");
    if (teacherBack) {
      const detailVisible = !!root.querySelector(".teacher-right-column-v2.detail-visible");
      teacherBack.textContent = detailVisible ? "Cerrar detalles del alumno" : "Volver al resumen";
    }
  }

  function applyRoleSeparation(root) {
    const session = getSession();
    document.body.classList.remove("yoyo-role-teacher", "yoyo-role-student", "yoyo-role-guest");

    if (!session) {
      document.body.classList.add("yoyo-role-guest");
      return;
    }

    if (session.role === "teacher") {
      document.body.classList.add("yoyo-role-teacher");
      root.querySelectorAll(".real-student, .classroom-student-shell").forEach((node) => node.remove());
      return;
    }

    document.body.classList.add("yoyo-role-student");
    root.querySelectorAll(".real-dashboard .teacher-shell-wide, .real-dashboard .classroom-admin-shell").forEach((node) => node.remove());
    root.querySelectorAll("[data-owner-home]").forEach((node) => node.remove());
  }

  function applyCopyFixes(root) {
    const visionTitle = document.getElementById("visionTitle");
    if (visionTitle) visionTitle.textContent = "Visi\u00f3n y valores";

    root.querySelectorAll(".module-kicker").forEach((node) => {
      if ((node.textContent || "").trim() === "YOYO") return;
    });
  }

  function ensureCompetencyStyles() {
    if (document.getElementById("yoyoCompetencyInfoStyle")) return;
    const style = document.createElement("style");
    style.id = "yoyoCompetencyInfoStyle";
    style.textContent = `
      .yoyo-competency-toggle{
        border:none;
        border-radius:999px;
        padding:10px 16px;
        font:inherit;
        font-weight:800;
        cursor:pointer;
        background:linear-gradient(135deg,#fff4cf,#ffe7a3);
        color:#8a6311;
        box-shadow:0 10px 22px rgba(202,168,84,.18);
      }
      .yoyo-competency-toggle.active{
        background:linear-gradient(135deg,#1f70ff,#7b36eb);
        color:#fff;
        box-shadow:0 14px 28px rgba(75,85,180,.24);
      }
      .yoyo-competency-card{
        margin-top:12px;
        padding:16px 18px;
        border-radius:22px;
        background:linear-gradient(135deg,#f6f0ff,#eef7ff);
        box-shadow:0 14px 28px rgba(93,104,152,.12);
        display:grid;
        gap:8px;
      }
      .yoyo-competency-card.hidden{display:none}
      .yoyo-competency-card strong{
        color:#6d28d9;
        font-size:1rem;
      }
      .yoyo-competency-card p{
        margin:0;
        color:#42506b;
        line-height:1.6;
      }
    `;
    document.head.appendChild(style);
  }

  function wireCompetencyInfo(root) {
    const session = getSession();
    if (!session || session.role !== "student") return;

    const pills = root.querySelector(".real-student .real-pills");
    if (!pills) return;

    ensureCompetencyStyles();

    const definitions = {
      C1: {
        title: "C1: Competencia Comunicativa",
        text: "Comunica sus ideas, pensamientos y sentimientos con fluidez, mediante un modelo textual conveniente, en variadas situaciones y contextos, con el fin de demostrar conocimiento y uso adecuado de su lengua, a través de diferentes medios y recursos."
      },
      C2: {
        title: "C2: Pensamiento Lógico, Creativo y Crítico + Resolución de Problemas + Científica y Tecnológica",
        text: "Elabora textos orales y escritos con creatividad y criticidad según las conclusiones de los problemas abordados en investigaciones, y las publica a través de medios variados."
      },
      C3: {
        title: "C3: Ética y Ciudadana + Ambiental y de la Salud + Desarrollo Personal y Espiritual",
        text: "Caracteriza problemas sociales diversos, a través de textos orales y escritos, con la finalidad de solucionarlos, canalizando emociones, sentimientos y relaciones humanas, así como la preservación de la salud y el ambiente, mediante el uso de recursos diversos."
      }
    };

    let card = root.querySelector(".yoyo-competency-card");
    if (!card) {
      card = document.createElement("article");
      card.className = "yoyo-competency-card hidden";
      card.innerHTML = "<strong></strong><p></p>";
      pills.insertAdjacentElement("afterend", card);
    }

    [...pills.querySelectorAll(".real-pill, .real-chip")].forEach((node) => {
      const key = (node.textContent || "").trim();
      if (!definitions[key]) return;
      if (node.dataset.competencyFixed === "1") return;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "yoyo-competency-toggle";
      button.dataset.competency = key;
      button.dataset.competencyFixed = "1";
      button.textContent = key;
      node.replaceWith(button);
    });

    pills.querySelectorAll(".yoyo-competency-toggle").forEach((button) => {
      if (button.dataset.competencyBound === "1") return;
      button.dataset.competencyBound = "1";
      button.addEventListener("click", () => {
        const next = button.dataset.competency || "";
        const current = root.dataset.activeCompetency || "";

        pills.querySelectorAll(".yoyo-competency-toggle").forEach((item) => item.classList.remove("active"));

        if (current === next) {
          delete root.dataset.activeCompetency;
          card.classList.add("hidden");
          return;
        }

        root.dataset.activeCompetency = next;
        button.classList.add("active");
        card.querySelector("strong").textContent = definitions[next].title;
        card.querySelector("p").textContent = definitions[next].text;
        card.classList.remove("hidden");
      });
    });
  }

  function enhance() {
    applyRoleSeparation(app);
    wireLogoutButtons(app);
    wireBackButtons(app);
    applyCopyFixes(app);
    wireCompetencyInfo(app);
  }

  enhance();
  const observer = new MutationObserver(enhance);
  observer.observe(app, { childList: true, subtree: true });
})();
