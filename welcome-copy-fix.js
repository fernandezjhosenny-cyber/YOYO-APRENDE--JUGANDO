(function () {
  const COPY = {
    eyebrow: "Plataforma Educativa Interactiva",
    sub: "Lengua Espa\u00F1ola",
    question: "\u00BFQui\u00E9n eres?",
    signIn: "Iniciar Sesi\u00F3n",
    teacherCreateNote: "Solo el docente crea cuenta.",
    email: "Correo electr\u00F3nico",
    password: "Contrase\u00F1a",
    schoolCode: "C\u00F3digo de la Escuela",
    classCode: "C\u00F3digo de clase",
    heroEyebrow: "Nueva experiencia activa",
    heroBody: "Cada actividad es una pantalla \u00FAnica tipo app infantil.",
  };

  function applyWelcomeCopyFix() {
    const app = document.getElementById("app");
    if (!app) return;

    const heroPanel = app.querySelector(".real-card.real-hero .progress-panel");
    if (heroPanel) heroPanel.remove();

    const eyebrow = app.querySelector(".real-brand-copy .eyebrow-main");
    if (eyebrow) eyebrow.textContent = COPY.eyebrow;

    const sub = app.querySelector(".real-brand-copy .real-sub");
    if (sub) sub.textContent = COPY.sub;

    const question = app.querySelector(".welcome-question");
    if (question) question.textContent = COPY.question;

    const heroEyebrow = app.querySelector(".progress-panel .helper-main");
    if (heroEyebrow) heroEyebrow.textContent = COPY.heroEyebrow;

    const heroBody = app.querySelector(".progress-panel .muted-main");
    if (heroBody) heroBody.textContent = COPY.heroBody;

    app.querySelectorAll("[data-t]").forEach((button) => {
      const text = (button.textContent || "").trim().toLowerCase();
      if (text.includes("iniciar")) button.textContent = COPY.signIn;
    });

    const teacherCreateNote = app.querySelector("#tr .real-msg.success");
    if (teacherCreateNote) teacherCreateNote.textContent = COPY.teacherCreateNote;

    app.querySelectorAll(".real-field").forEach((field) => {
      const labelNode = field.childNodes[0];
      const labelText = (labelNode?.textContent || "").trim().toLowerCase();
      if (labelText === "correo electronico") labelNode.textContent = COPY.email;
      if (labelText === "contrasena") labelNode.textContent = COPY.password;
      if (labelText === "codigo de la escuela") labelNode.textContent = COPY.schoolCode;
      if (labelText === "codigo de clase") labelNode.textContent = COPY.classCode;
    });
  }

  function scheduleApply() {
    window.requestAnimationFrame(applyWelcomeCopyFix);
  }

  scheduleApply();

  const app = document.getElementById("app");
  if (!app) return;

  const observer = new MutationObserver(scheduleApply);
  observer.observe(app, { childList: true, subtree: true });
})();
