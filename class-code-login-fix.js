(function () {
  const KEYS = {
    teachers: "yoyo_rg_t",
    students: "yoyo_rg_s",
    session: "yoyo_rg_x"
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeCode(value) {
    return String(value || "").trim().replace(/\s+/g, "").toUpperCase();
  }

  function normalizeName(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  }

  function teacherCode(teacher) {
    return normalizeCode(teacher && (teacher.code || teacher.classCode || teacher.classId));
  }

  function teacherActive(teacher) {
    return !!teacher && teacher.active !== false && String(teacher.status || "").toLowerCase() !== "inactive";
  }

  function cid(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function syncStoredClassCodes() {
    const teachers = read(KEYS.teachers, []);
    const students = read(KEYS.students, []);

    let changedTeachers = false;
    let changedStudents = false;

    const nextTeachers = teachers.map((teacher) => {
      const code = teacherCode(teacher);
      if (!code) return teacher;
      if (teacher.code === code && teacher.classCode === code && teacher.active !== undefined) {
        return teacher;
      }
      changedTeachers = true;
      return {
        ...teacher,
        code,
        classCode: code,
        active: teacher.active !== false,
        status: teacher.status || "active"
      };
    });

    const nextStudents = students.map((student) => {
      const code = normalizeCode(student.code);
      if (student.code === code) return student;
      changedStudents = true;
      return {
        ...student,
        code
      };
    });

    if (changedTeachers) write(KEYS.teachers, nextTeachers);
    if (changedStudents) write(KEYS.students, nextStudents);
  }

  function showFormError(form, message) {
    let box = form.querySelector(".real-msg.error.class-code-fix");
    if (!box) {
      box = document.createElement("div");
      box.className = "real-msg error class-code-fix";
      form.appendChild(box);
    }
    box.textContent = message;
  }

  function clearFormError(form) {
    form.querySelector(".real-msg.error.class-code-fix")?.remove();
  }

  function handleStudentLogin(form) {
    const data = new FormData(form);
    const identity = String(data.get("id") || "").trim();
    const password = String(data.get("pw") || "").trim();
    const classCode = normalizeCode(data.get("cc"));

    if (!identity || !password || !classCode) {
      showFormError(form, "Completa todos los campos del estudiante.");
      return;
    }

    const teachers = read(KEYS.teachers, []);
    const teacher = teachers.find((item) => teacherActive(item) && teacherCode(item) === classCode);

    if (!teacher) {
      showFormError(form, "El codigo de clase no existe.");
      return;
    }

    const students = read(KEYS.students, []);
    const normalizedName = normalizeName(identity);
    let student = students.find((item) => item.teacherId === teacher.id && normalizeName(item.name) === normalizedName);

    if (!student) {
      student = {
        id: cid("student"),
        name: identity,
        password,
        teacherId: teacher.id,
        code: teacherCode(teacher)
      };
      students.push(student);
    } else if (String(student.password || "") !== password) {
      showFormError(form, "La contrasena no coincide con la registrada para este estudiante.");
      return;
    } else {
      student.code = teacherCode(teacher);
    }

    clearFormError(form);
    write(KEYS.students, students);
    write(KEYS.session, { role: "student", id: student.id });
    window.location.reload();
  }

  syncStoredClassCodes();

  document.addEventListener(
    "submit",
    (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.id !== "lg") return;

      const codeField = form.querySelector('input[name="cc"]');
      if (!codeField) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      handleStudentLogin(form);
    },
    true
  );
})();
