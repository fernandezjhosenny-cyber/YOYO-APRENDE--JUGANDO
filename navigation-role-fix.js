(function () {
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

  function enhance() {
    applyRoleSeparation(app);
    wireLogoutButtons(app);
    wireBackButtons(app);
    applyCopyFixes(app);
  }

  enhance();
  const observer = new MutationObserver(enhance);
  observer.observe(app, { childList: true, subtree: true });
})();
