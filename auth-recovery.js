(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const KEYS = {
    teachers: "yoyo_rg_t",
    mail: "yoyo_rg_mail_outbox",
  };

  const VIEW = { busy: false };

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

  function getTeachers() {
    return readJson(KEYS.teachers, []);
  }

  function saveTeachers(teachers) {
    writeJson(KEYS.teachers, teachers);
  }

  function saveMailRecord(kind, to, subject, body) {
    const outbox = readJson(KEYS.mail, []);
    outbox.unshift({
      id: `mail-${Date.now()}`,
      kind,
      to,
      subject,
      body,
      createdAt: new Date().toISOString(),
    });
    writeJson(KEYS.mail, outbox.slice(0, 50));
  }

  function tryCopy(text) {
    if (!navigator.clipboard?.writeText) return;
    navigator.clipboard.writeText(text).catch(() => {});
  }

  function openMailDraft(to, subject, body, kind) {
    const href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    saveMailRecord(kind, to, subject, body);
    tryCopy(body);
    const link = document.createElement("a");
    link.href = href;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function showFormNotice(form, type, text) {
    if (!form) return;
    form.querySelector(".auth-helper-note")?.remove();
    const note = document.createElement("div");
    note.className = `real-msg ${type} auth-helper-note`;
    note.textContent = text;
    form.appendChild(note);
  }

  function buildWelcomeBody(teacher, password) {
    return [
      `Bienvenido/a a la plataforma YOYO, ${teacher.name}.`,
      "",
      "Tu cuenta docente fue creada correctamente.",
      `Correo registrado: ${teacher.email}`,
      `Contrasena registrada: ${password}`,
      `Codigo de escuela: ${teacher.school}`,
      `Codigo de clase: ${teacher.code}`,
      "",
      "Gracias por formar parte de YOYO.",
      "Ya puedes entrar y comenzar a trabajar con tus estudiantes.",
    ].join("\n");
  }

  function buildRecoveryBody(teacher, tempPassword) {
    return [
      `Hola, ${teacher.name}.`,
      "",
      "Recibimos una solicitud para recuperar tu contrasena en YOYO.",
      `Tu nueva contrasena temporal es: ${tempPassword}`,
      "",
      "Te recomendamos entrar a la plataforma y guardarla en un lugar seguro.",
      "Si no hiciste esta solicitud, avisa al soporte de la escuela.",
    ].join("\n");
  }

  function createTempPassword() {
    return `YOYO${Math.floor(1000 + Math.random() * 9000)}`;
  }

  function enhancePasswordField(input) {
    if (!input || input.dataset.eyeReady === "1") return;
    input.dataset.eyeReady = "1";
    const wrapper = document.createElement("div");
    wrapper.className = "auth-password-wrap";
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "auth-eye-btn";
    toggle.setAttribute("aria-label", "Mostrar contrasena");
    toggle.textContent = "👁";
    toggle.addEventListener("click", () => {
      const visible = input.type === "text";
      input.type = visible ? "password" : "text";
      toggle.textContent = visible ? "👁" : "🙈";
      toggle.setAttribute("aria-label", visible ? "Mostrar contrasena" : "Ocultar contrasena");
    });
    wrapper.appendChild(toggle);
  }

  function installPasswordToggles(root) {
    root.querySelectorAll('input[type="password"]').forEach(enhancePasswordField);
  }

  function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function syncTeacherRecoveryEmails() {
    const teachers = getTeachers();
    let changed = false;
    teachers.forEach((teacher) => {
      if (!teacher.recoveryEmail) {
        teacher.recoveryEmail = teacher.email;
        changed = true;
      }
    });
    if (changed) saveTeachers(teachers);
  }

  function installTeacherRegisterEnhancements(root) {
    const form = root.querySelector("#tr");
    if (!form || form.dataset.authRegisterReady === "1") return;
    form.dataset.authRegisterReady = "1";

    form.addEventListener(
      "submit",
      () => {
        const email = normalizeEmail(form.querySelector('input[name="email"]')?.value);
        const password = form.querySelector('input[name="password"]')?.value?.trim() || "";
        window.setTimeout(() => {
          const teachers = getTeachers();
          const teacher = teachers.find((item) => normalizeEmail(item.email) === email);
          if (!teacher) return;

          let changed = false;
          if (!teacher.recoveryEmail) {
            teacher.recoveryEmail = teacher.email;
            changed = true;
          }
          if (!teacher.welcomeSentAt) {
            openMailDraft(
              teacher.recoveryEmail,
              "Bienvenido/a a YOYO",
              buildWelcomeBody(teacher, password),
              "welcome"
            );
            teacher.welcomeSentAt = new Date().toISOString();
            changed = true;
          }
          if (changed) saveTeachers(teachers);
        }, 40);
      },
      true
    );
  }

  function renderRecoveryBox(form) {
    if (form.querySelector(".auth-recovery-box")) return;
    const box = document.createElement("div");
    box.className = "auth-recovery-box";
    box.innerHTML = `
      <div class="auth-recovery-copy">
        <strong>Recuperar contrasena</strong>
        <span>Escribe tu correo y te preparamos un mensaje de recuperacion.</span>
      </div>
      <div class="auth-recovery-row">
        <input class="auth-recovery-input" type="email" placeholder="Correo registrado" id="teacherRecoveryEmail">
        <button class="real-action auth-recovery-btn" type="button" id="teacherRecoverySend">Enviar recuperacion</button>
      </div>
    `;
    form.appendChild(box);

    box.querySelector("#teacherRecoverySend")?.addEventListener("click", () => {
      const email = normalizeEmail(box.querySelector("#teacherRecoveryEmail")?.value);
      const teachers = getTeachers();
      const teacher = teachers.find((item) => normalizeEmail(item.email) === email || normalizeEmail(item.recoveryEmail) === email);
      if (!teacher) {
        showFormNotice(form, "error", "No encontramos un docente registrado con ese correo.");
        return;
      }

      const tempPassword = createTempPassword();
      teacher.password = tempPassword;
      teacher.recoveryEmail = teacher.recoveryEmail || teacher.email;
      teacher.passwordResetAt = new Date().toISOString();
      saveTeachers(teachers);

      openMailDraft(
        teacher.recoveryEmail,
        "Recuperacion de contrasena YOYO",
        buildRecoveryBody(teacher, tempPassword),
        "recovery"
      );

      showFormNotice(
        form,
        "success",
        "Preparamos el mensaje de recuperacion y copiamos el contenido. Si tu equipo no abre correo automaticamente, revisa tu aplicacion de correo o pega el mensaje copiado."
      );
    });
  }

  function installTeacherLoginEnhancements(root) {
    const form = root.querySelector("#lg");
    const isTeacherLogin = !!form && !!form.querySelector('input[name="id"][type="email"]');
    if (!form || !isTeacherLogin || form.dataset.authLoginReady === "1") return;
    form.dataset.authLoginReady = "1";

    const forgot = document.createElement("button");
    forgot.type = "button";
    forgot.className = "auth-forgot-link";
    forgot.textContent = "Olvide mi contrasena";
    forgot.addEventListener("click", () => renderRecoveryBox(form));
    form.appendChild(forgot);
  }

  function enhanceAuth() {
    if (VIEW.busy) return;
    VIEW.busy = true;
    try {
      syncTeacherRecoveryEmails();
      const auth = app.querySelector(".real-auth");
      if (!auth) return;
      installPasswordToggles(auth);
      installTeacherRegisterEnhancements(auth);
      installTeacherLoginEnhancements(auth);
    } finally {
      window.setTimeout(() => {
        VIEW.busy = false;
      }, 0);
    }
  }

  function injectStyles() {
    if (document.getElementById("auth-recovery-style")) return;
    const style = document.createElement("style");
    style.id = "auth-recovery-style";
    style.textContent = `
      .auth-password-wrap {
        position: relative;
        display: flex;
        align-items: center;
      }
      .auth-password-wrap input {
        width: 100%;
        padding-right: 54px;
      }
      .auth-eye-btn {
        position: absolute;
        right: 10px;
        border: none;
        background: rgba(123, 54, 235, 0.12);
        color: #6d28d9;
        width: 36px;
        height: 36px;
        border-radius: 999px;
        cursor: pointer;
        font-size: 16px;
      }
      .auth-forgot-link {
        margin-top: 6px;
        border: none;
        background: transparent;
        color: #6d28d9;
        font-weight: 800;
        cursor: pointer;
        text-align: left;
        padding: 0;
      }
      .auth-recovery-box {
        margin-top: 14px;
        padding: 14px;
        border-radius: 18px;
        background: linear-gradient(135deg, #f7f1ff, #eef8ff);
        display: grid;
        gap: 10px;
      }
      .auth-recovery-copy {
        display: grid;
        gap: 4px;
        color: #4a5b7c;
      }
      .auth-recovery-row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .auth-recovery-input {
        flex: 1 1 220px;
        padding: 12px 14px;
        border-radius: 14px;
        border: 2px solid rgba(123, 54, 235, 0.14);
        font: inherit;
      }
      .auth-recovery-btn {
        min-width: 180px;
      }
    `;
    document.head.appendChild(style);
  }

  injectStyles();
  const observer = new MutationObserver(() => window.requestAnimationFrame(enhanceAuth));
  observer.observe(app, { childList: true, subtree: true });
  enhanceAuth();
})();
