(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const KEYS = {
    teachers: "yoyo_teachers_v2",
    students: "yoyo_students_v2",
    session: "yoyo_session_v2",
  };

  const TOPICS = [
["💌", "La Carta de Agradecimiento"],
["🍓", "La Receta"],
["📘", "El Texto Expositivo"],
["💬", "El Comentario"],
["📻", "El Anuncio Radial"],
["🎼", "La Oda"],
  ];

  const ui = {
    tab: "login",
    role: "student",
    message: null,
  };

  init();

  function init() {
    render();
  }

  function render() {
    const session = read(KEYS.session, null);
    if (!session) {
      renderAccess();
      bindAccess();
      return;
    }
    if (session.role === "teacher") {
      renderTeacher(session.userId);
      bindTeacher();
      return;
    }
    renderStudent(session.userId);
    bindStudent();
  }

  function renderAccess() {
    app.innerHTML = `
      <section class="app-shell app-shell-welcome">
        <article class="glass-card welcome-hero-card">
          <div class="welcome-brand welcome-brand-large">
            <div class="welcome-logo welcome-logo-large" aria-hidden="true">
              <div class="welcome-string"></div>
              <div class="welcome-yoyo">
                <div class="welcome-yoyo-core"></div>
              </div>
            </div>
            <div class="welcome-copy">
              <p class="eyebrow-main">Plataforma educativa interactiva</p>
              <h1 class="welcome-title welcome-title-large">YOYO</h1>
              <p class="welcome-tagline welcome-tagline-large">Aprendo Jugando</p>
              <p class="welcome-subject welcome-subject-large">Lengua Espanola</p>
            </div>
          </div>

          <div class="subject-main">
            <p>Materia</p>
            <h2>LENGUA ESPANOLA</h2>
            <div class="muted-main">
              Un espacio alegre y limpio para primaria, con acceso por codigo de clase,
              panel para docentes y temarios para estudiantes.
            </div>
          </div>
        </article>

        <aside class="auth-card auth-card-welcome">
          <div class="welcome-center">
            <h2 class="welcome-question">¿Quien eres?</h2>
          </div>

          <div class="role-row-main">
            <button class="role-btn-main ${ui.role === "student" ? "active" : ""}" data-role="student" type="button">Estudiante</button>
            <button class="role-btn-main ${ui.role === "teacher" ? "active" : ""}" data-role="teacher" type="button">Docente</button>
          </div>

          <div class="tab-row-main">
            <button class="tab-btn-main ${ui.tab === "login" ? "active" : ""}" data-tab="login" type="button">Iniciar sesion</button>
            <button class="tab-btn-main ${ui.tab === "register" ? "active" : ""}" data-tab="register" type="button">Crear cuenta</button>
          </div>

          ${ui.tab === "register" ? registerTemplate() : loginTemplate()}
          ${messageTemplate()}
        </aside>
      </section>
    `;
  }

  function registerTemplate() {
    return `
      <form class="form-main" id="registerFormMain">
        <div class="login-help-main login-help-info">El registro esta disponible solo para docentes.</div>
        <label class="field-main">Nombre completo<input name="name" type="text" required></label>
        <label class="field-main">Correo electronico<input name="email" type="email" required></label>
        <label class="field-main">Contrasena<input name="password" type="password" required></label>
        <label class="field-main">Codigo de la escuela<input name="schoolCode" type="text" required></label>
        <button class="primary-btn-main" type="submit">Registrarse</button>
      </form>
    `;
  }

  function loginTemplate() {
    return `
      <form class="form-main" id="loginFormMain">
        <label class="field-main">${ui.role === "student" ? "Nombre completo" : "Correo electronico"}<input name="email" type="${ui.role === "student" ? "text" : "email"}" placeholder="${ui.role === "student" ? "Tu nombre completo" : "nombre@correo.com"}" required></label>
        <label class="field-main">Contrasena<input name="password" type="password" placeholder="Escribe tu contrasena" required></label>
        ${ui.role === "student" ? `<label class="field-main">Codigo de Clase<input name="classCode" type="text" placeholder="ej: ABC123"></label><div class="login-help-main">Requerido para acceder - Solicita a tu docente</div>` : ``}
        <button class="primary-btn-main" type="submit">Acceder</button>
      </form>
    `;
  }

  function renderTeacher(userId) {
    const teacher = teachers().find((item) => item.id === userId);
    if (!teacher) {
      localStorage.removeItem(KEYS.session);
      render();
      return;
    }
    const linkedStudents = students().filter((item) => item.teacherId === teacher.id);
    app.innerHTML = `
      <section class="dashboard-shell">
        <article class="panel-card-main">
          <div class="topbar-main">
            <div>
              <p class="helper-main">Panel del docente</p>
              <h2 class="title-main">Hola, ${escapeHtml(teacher.name)}</h2>
            </div>
            <button class="logout-btn-main" id="logoutMain" type="button">Cerrar sesion</button>
          </div>

          <div class="row-flex">
            <span class="pill-main alt">Escuela: ${escapeHtml(teacher.schoolCode)}</span>
            <span class="pill-main">Clase: ${escapeHtml(teacher.classCode)}</span>
          </div>

          <p class="muted-main">Comparte tu codigo unico para que tus estudiantes se unan automaticamente a tu grupo.</p>

          <div class="code-wrap">
            <div>
              <div class="helper-main">Codigo unico de clase</div>
              <p class="code-text-main" id="codeTextMain">${teacher.classCode}</p>
              <div class="helper-main">Este codigo identifica tu grupo y aparece en el panel del docente.</div>
            </div>
            <button class="copy-btn-main" id="copyCodeMain" type="button">Compartir codigo</button>
          </div>

          ${messageTemplate()}
        </article>

        <aside class="side-stack">
          <section class="side-card">
            <p class="helper-main">Mis estudiantes</p>
            <h3 class="list-title-main">Estudiantes vinculados</h3>
            ${linkedStudents.length ? `
              <div class="student-list-main">
                ${linkedStudents.map(renderTeacherStudentItem).join("")}
              </div>
            ` : `<div class="empty-main">Aun no hay estudiantes unidos. Comparte el codigo <strong>${teacher.classCode}</strong>.</div>`}
          </section>

          <section class="side-card">
            <h3 class="list-title-main">Vista del grupo</h3>
            <div class="helper-main">Cada estudiante que use tu codigo quedara vinculado automaticamente y aparecera aqui.</div>
          </section>
        </aside>
      </section>
    `;
  }

  function renderStudent(userId) {
    const student = students().find((item) => item.id === userId);
    if (!student) {
      localStorage.removeItem(KEYS.session);
      render();
      return;
    }
    const teacher = student.teacherId ? teachers().find((item) => item.id === student.teacherId) : null;
    app.innerHTML = `
      <section class="student-shell">
        <article class="panel-card-main">
          <div class="topbar-main">
            <div>
              <div class="helper-main">Panel del estudiante</div>
              <h2 class="title-main">Hola, ${escapeHtml(student.name)}</h2>
            </div>
            <div class="row-flex">
              <button class="copy-btn-main" id="backMain" type="button">Atras</button>
              <button class="logout-btn-main" id="logoutMain" type="button">Cerrar sesion</button>
            </div>
          </div>

          <div class="row-flex">
            <span class="pill-main alt">${teacher ? `Clase de ${escapeHtml(teacher.name)}` : "Sin clase unida"}</span>
            <span class="pill-main">C1</span>
            <span class="pill-main">C2</span>
            <span class="pill-main">C3</span>
          </div>

          ${teacher ? `
            <p class="muted-main">Ya estas unido a la clase con codigo <strong>${student.joinedClassCode}</strong>. Estos son tus temarios de Lengua Espanola.</p>
            ${window.YoyoGames ? window.YoyoGames.renderStudentExperience(student) : ""}
          ` : `<p class="muted-main">Introduce el codigo del maestro para acceder a las actividades asignadas.</p>`}
        </article>

        <aside class="side-stack">
          <section class="side-card">
            <h3 class="list-title-main">Clase vinculada</h3>
            <div class="helper-main">Tu acceso ya quedo unido automaticamente a la clase del docente desde el inicio de sesion.</div>
            <div class="empty-main">Codigo de clase activo: <strong>${escapeHtml(student.joinedClassCode || "No disponible")}</strong></div>
          </section>

          <section class="side-card">
            <div class="helper-main">Temarios de Lengua Espanola</div>
            <h3 class="list-title-main">Lista asignada</h3>
<div class="muted-main">La Carta de Agradecimiento, La Receta, El Texto Expositivo, El Comentario, El Anuncio Radial y La Oda.</div>
          </section>
        </aside>
      </section>
    `;
  }

  function bindAccess() {
    document.querySelectorAll("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        ui.tab = button.dataset.tab;
        if (ui.tab === "register") {
          ui.role = "teacher";
        }
        ui.message = null;
        render();
      });
    });
    document.querySelectorAll("[data-role]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextRole = button.dataset.role;
        if (ui.tab === "register" && nextRole === "student") {
          ui.tab = "login";
        }
        ui.role = nextRole;
        ui.message = null;
        render();
      });
    });
    document.getElementById("registerFormMain")?.addEventListener("submit", onRegister);
    document.getElementById("loginFormMain")?.addEventListener("submit", onLogin);
  }

  function bindTeacher() {
    document.getElementById("logoutMain")?.addEventListener("click", logout);
    document.getElementById("copyCodeMain")?.addEventListener("click", async () => {
      const code = document.getElementById("codeTextMain")?.textContent?.trim() || "";
      try {
        await copyText(code);
        ui.message = { type: "success", text: `Codigo ${code} copiado correctamente.` };
      } catch (_error) {
        ui.message = { type: "success", text: `Comparte este codigo con tu grupo: ${code}` };
      }
      render();
    });
  }

  function renderTeacherStudentItem(student) {
    const status = window.YoyoGames?.getStudentStatus ? window.YoyoGames.getStudentStatus(student.id) : { totalScore: 0 };
    return `
      <article class="student-item-main">
        <div>
          <p class="student-name-main">${escapeHtml(student.name)}</p>
          <div class="student-email">${escapeHtml(student.email || "Acceso con nombre y codigo de clase")}</div>
        </div>
        <span class="progress-main">${status.totalScore ? `${status.totalScore} pts` : student.joinedClassCode ? "Temarios asignados" : "Pendiente"}</span>
      </article>
    `;
  }

  function bindStudent() {
    document.getElementById("backMain")?.addEventListener("click", goBackWithoutLogout);
    document.getElementById("logoutMain")?.addEventListener("click", logout);
    const session = read(KEYS.session, null);
    if (session?.role === "student" && window.YoyoGames?.bindStudentInteractions) {
      window.YoyoGames.bindStudentInteractions(session.userId, render);
    }
  }

  function onRegister(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = value(data, "name");
    const email = value(data, "email").toLowerCase();
    const password = value(data, "password");
    const schoolCode = value(data, "schoolCode").toUpperCase();

    if (!name || !email || !password || !schoolCode) {
      ui.message = { type: "error", text: "Completa todos los campos requeridos." };
      render();
      return;
    }
    if (existsEmail(email)) {
      ui.message = { type: "error", text: "Ya existe una cuenta registrada con ese correo." };
      render();
      return;
    }

    const list = teachers();
    list.push({
      id: createId("teacher"),
      name,
      email,
      password,
      schoolCode,
      classCode: createClassCode(list),
    });
    localStorage.setItem(KEYS.teachers, JSON.stringify(list));

    ui.tab = "login";
    ui.role = "teacher";
    ui.message = { type: "success", text: "Cuenta creada correctamente. Ahora inicia sesion." };
    render();
  }

  function onLogin(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = value(data, "email").toLowerCase();
    const password = value(data, "password");
    const classCode = value(data, "classCode").toUpperCase();

    if (ui.role === "student") {
      if (!classCode) {
        ui.message = { type: "error", text: "El estudiante debe ingresar el codigo de clase del docente." };
        render();
        return;
      }

      const teacher = teachers().find((item) => item.classCode === classCode);
      if (!teacher) {
        ui.message = { type: "error", text: "El codigo de clase no existe. Solicita el codigo correcto a tu docente." };
        render();
        return;
      }

      const studentList = students();
      const normalizedInput = normalizeIdentity(email);
      const studentIndex = studentList.findIndex((item) => {
        if (item.teacherId !== teacher.id) return false;
        const normalizedInput = normalizeIdentity(email);
        const normalizedName = normalizeIdentity(item.name);
        const byFullName = normalizedName === normalizedInput;
        return byFullName;
      });

      let studentRecord;
      if (studentIndex === -1) {
        studentRecord = {
          id: createId("student"),
          name: email.trim(),
          email: "",
          password,
          schoolCode: teacher.schoolCode,
          teacherId: teacher.id,
          joinedClassCode: teacher.classCode,
        };
        studentList.push(studentRecord);
      } else {
        const currentStudent = studentList[studentIndex];
        if (currentStudent.password !== password) {
          ui.message = { type: "error", text: "La contrasena no coincide con la registrada para este estudiante." };
          render();
          return;
        }
        studentRecord = {
          ...currentStudent,
          teacherId: teacher.id,
          joinedClassCode: teacher.classCode,
        };
        studentList[studentIndex] = studentRecord;
      }

      localStorage.setItem(KEYS.students, JSON.stringify(studentList));
      localStorage.setItem(KEYS.session, JSON.stringify({ role: ui.role, userId: studentRecord.id }));
      ui.message = { type: "success", text: `Acceso correcto. Quedaste vinculado a la clase ${teacher.classCode}.` };
      render();
      return;
    }

    const user = teachers().find((item) => item.email === email && item.password === password);

    if (!user) {
      ui.message = { type: "error", text: "Credenciales incorrectas. Verifica tu correo y contrasena." };
      render();
      return;
    }

    localStorage.setItem(KEYS.session, JSON.stringify({ role: ui.role, userId: user.id }));
    ui.message = null;
    render();
  }

  function onJoinClass(event) {
    event.preventDefault();
    const session = read(KEYS.session, null);
    if (!session || session.role !== "student") return;
    const code = value(new FormData(event.currentTarget), "classCode").toUpperCase();
    const teacher = teachers().find((item) => item.classCode === code);

    if (!teacher) {
      ui.message = { type: "error", text: "El codigo de clase no existe. Revisa y vuelve a intentarlo." };
      render();
      return;
    }

    const list = students();
    const index = list.findIndex((item) => item.id === session.userId);
    if (index === -1) return;
    list[index] = { ...list[index], teacherId: teacher.id, joinedClassCode: teacher.classCode };
    localStorage.setItem(KEYS.students, JSON.stringify(list));
    ui.message = { type: "success", text: `Te uniste correctamente a la clase ${teacher.classCode}.` };
    render();
  }

  function logout() {
    localStorage.removeItem(KEYS.session);
    ui.message = null;
    render();
  }

  function goBackWithoutLogout() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    render();
  }

  function messageTemplate() {
    return ui.message ? `<div class="message-main ${ui.message.type}">${escapeHtml(ui.message.text)}</div>` : "";
  }

  function teachers() {
    return read(KEYS.teachers, []);
  }

  function students() {
    return read(KEYS.students, []);
  }

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function value(formData, key) {
    return String(formData.get(key) || "").trim();
  }

  function normalizeIdentity(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  }

  function existsEmail(email) {
    return teachers().some((item) => item.email === email) || students().some((item) => item.email === email);
  }

  function createId(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function createClassCode(list) {
    let code = "";
    do {
      code = Array.from({ length: 3 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join("") + Math.floor(100 + Math.random() * 900);
    } while (list.some((item) => item.classCode === code));
    return code;
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const input = document.createElement("textarea");
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }
})();
