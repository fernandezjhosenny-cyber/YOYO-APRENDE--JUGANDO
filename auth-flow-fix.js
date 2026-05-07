(function () {
  const app = document.getElementById("app");
  if (!app) return;

  const KEYS = {
    teachers: "yoyo_rg_t",
  };

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

  function createId(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function createClassCode(teachers) {
    let code = "";
    do {
      const letters = Array.from({ length: 3 }, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
      ).join("");
      code = `${letters}${Math.floor(100 + Math.random() * 900)}`;
    } while (teachers.some((teacher) => teacher.code === code));
    return code;
  }

  function showAuthNotice(message, tone) {
    app.querySelector(".auth-flow-fix-msg")?.remove();
    const form = app.querySelector("#tr, #lg");
    if (!form) return;
    const box = document.createElement("div");
    box.className = `real-msg ${tone} auth-flow-fix-msg`;
    box.textContent = message;
    form.insertAdjacentElement("beforebegin", box);
  }

  function getActiveRole() {
    return app.querySelector("[data-r].active")?.dataset.r || "student";
  }

  function normalizeName(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  }

  function rerunRealGames() {
    const url = new URL(window.location.href);
    url.searchParams.set("ts", Date.now().toString());
    window.location.href = url.toString();
  }

  function startSession(session) {
    const serialized = JSON.stringify(session);
    localStorage.setItem("yoyo_rg_x", serialized);
    try {
      sessionStorage.setItem("yoyo_auth_handoff", serialized);
    } catch {}
    app.innerHTML = `
      <section class="real-shell">
        <article class="real-card real-hero">
          <div class="real-msg success auth-flow-fix-msg">Entrando a tu panel...</div>
        </article>
      </section>
    `;
    window.setTimeout(rerunRealGames, 30);
  }

  function wireTeacherRegister() {
    const form = app.querySelector("#tr");
    if (!form || form.dataset.authFlowFix === "1") return;
    form.dataset.authFlowFix = "1";

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();

      try {
        const data = new FormData(form);
        const name = String(data.get("name") || "").trim();
        const email = String(data.get("email") || "").trim().toLowerCase();
        const password = String(data.get("password") || "").trim();
        const school = String(data.get("school") || "").trim().toUpperCase();

        if (!name || !email || !password || !school) {
          showAuthNotice("Completa todos los campos del docente.", "error");
          return;
        }

        const teachers = readJson(KEYS.teachers, []);
        if (teachers.some((teacher) => teacher.email === email)) {
          showAuthNotice("Ya existe un docente con ese correo.", "error");
          return;
        }

        const teacher = {
          id: createId("teacher"),
          name,
          email,
          password,
          school,
          code: createClassCode(teachers),
        };

        teachers.push(teacher);
        writeJson(KEYS.teachers, teachers);

        try { localStorage.setItem("yoyo_owner_teacher_id", teacher.id); } catch {}
        startSession({ role: "teacher", id: teacher.id });
      } catch (error) {
        showAuthNotice(`No se pudo completar el registro: ${error?.message || "Error desconocido"}`, "error");
      }
    }, true);
  }

  function wireLogin() {
    const form = app.querySelector("#lg");
    if (!form || form.dataset.authFlowFix === "1") return;
    form.dataset.authFlowFix = "1";

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();

      try {
        const data = new FormData(form);
        const role = getActiveRole();

        if (role === "teacher") {
          const email = String(data.get("id") || "").trim().toLowerCase();
          const password = String(data.get("pw") || "").trim();
          const teachers = readJson(KEYS.teachers, []);
          const teacher = teachers.find((item) => item.email === email && item.password === password);

          if (!teacher) {
            showAuthNotice("Credenciales incorrectas.", "error");
            return;
          }

          try { localStorage.setItem("yoyo_owner_teacher_id", teacher.id); } catch {}
          startSession({ role: "teacher", id: teacher.id });
          return;
        }

        const name = String(data.get("id") || "").trim();
        const password = String(data.get("pw") || "").trim();
        const classCode = String(data.get("cc") || "").trim().toUpperCase();
        const teachers = readJson(KEYS.teachers, []);
        const students = readJson("yoyo_rg_s", []);
        const teacher = teachers.find((item) => item.code === classCode);

        if (!teacher) {
          showAuthNotice("El código de clase no existe.", "error");
          return;
        }

        let student = students.find((item) => item.teacherId === teacher.id && normalizeName(item.name) === normalizeName(name));
        if (!student) {
          student = {
            id: createId("student"),
            name,
            password,
            teacherId: teacher.id,
            code: teacher.code,
          };
          students.push(student);
          writeJson("yoyo_rg_s", students);
        } else if (student.password !== password) {
          showAuthNotice("La contraseña no coincide con la registrada para este estudiante.", "error");
          return;
        }

        startSession({ role: "student", id: student.id });
      } catch (error) {
        showAuthNotice(`No se pudo iniciar sesión: ${error?.message || "Error desconocido"}`, "error");
      }
    }, true);
  }

  function enhance() {
    wireTeacherRegister();
    wireLogin();
  }

  enhance();
  const observer = new MutationObserver(enhance);
  observer.observe(app, { childList: true, subtree: true });
})();
