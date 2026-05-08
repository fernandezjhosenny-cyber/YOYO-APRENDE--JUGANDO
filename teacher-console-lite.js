(function () {
  const app = document.getElementById("app");
  if (!app) return;

  const KEYS = {
    teachers: "yoyo_rg_t",
    students: "yoyo_rg_s",
    session: "yoyo_rg_x",
    progress: "yoyo_rg_p"
  };

  const TOPICS = [
    { id: "carta", title: "La Carta de Agradecimiento" },
    { id: "receta", title: "La Receta" },
    { id: "expositivo", title: "El Texto Expositivo" },
    { id: "comentario", title: "El Comentario" },
    { id: "anuncio", title: "El Anuncio Radial" },
    { id: "oda", title: "La Oda" }
  ];

  const COMPETENCY_LABELS = {
    C1: "Competencia Comunicativa",
    C2: "Pensamiento Lógico, Creativo y Crítico",
    C3: "Ética y Ciudadana"
  };

  const TOTAL_GAMES = 60;

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
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getSession() {
    return readJson(KEYS.session, null);
  }

  function getTeacher() {
    const session = getSession();
    if (!session || session.role !== "teacher") return null;
    return readJson(KEYS.teachers, []).find((item) => item.id === session.id) || null;
  }

  function getState() {
    return {
      student: app.dataset.teacherLiteStudent || "all",
      section: app.dataset.teacherLiteSection || "all",
      topic: app.dataset.teacherLiteTopic || "all",
      competency: app.dataset.teacherLiteCompetency || "all",
      status: app.dataset.teacherLiteStatus || "all",
      support: app.dataset.teacherLiteSupport || "all",
      selected: app.dataset.teacherLiteSelected || "",
      expanded: app.dataset.teacherLiteExpanded || "",
      toast: app.dataset.teacherLiteToast || ""
    };
  }

  function setState(patch) {
    Object.entries(patch).forEach(([key, value]) => {
      const dataKey = `teacherLite${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      if (value === "" || value == null || value === "all") {
        delete app.dataset[dataKey];
      } else {
        app.dataset[dataKey] = value;
      }
    });
  }

  function clearToastLater() {
    window.clearTimeout(window.__teacherLiteToastTimer);
    window.__teacherLiteToastTimer = window.setTimeout(() => {
      delete app.dataset.teacherLiteToast;
      if (app.querySelector(".teacher-lite-shell")) renderLiteTeacher();
    }, 2400);
  }

  function showToast(message) {
    setState({ toast: message });
    renderLiteTeacher();
    clearToastLater();
  }

  function formatDate(value) {
    if (!value) return "Sin registro";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Sin registro";
    return new Intl.DateTimeFormat("es-DO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function isToday(value) {
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    const now = new Date();
    return date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
  }

  function stateFromPercent(value) {
    if (value >= 80) return { label: "Excelente", tone: "good" };
    if (value >= 50) return { label: "En progreso", tone: "warn" };
    return { label: "Necesita apoyo", tone: "danger" };
  }

  function toneForValue(value) {
    return stateFromPercent(value).tone;
  }

  function levelForValue(value) {
    if (value >= 80) return "Alto";
    if (value >= 50) return "Medio";
    return "Bajo";
  }

  function getTopicTitle(topicId) {
    return TOPICS.find((item) => item.id === topicId)?.title || topicId;
  }

  function gameLabel(id) {
    const match = String(id || "").match(/^(.+)-(\d+)$/);
    if (!match) return id || "Actividad";
    return `Juego ${match[2]}`;
  }

  function sectionLabel(student, teacher) {
    return student.section || teacher.school || "Sección general";
  }

  function mean(values) {
    return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
  }

  function percentForEntries(entries) {
    if (!entries.length) return 0;
    return mean(entries.map((entry) => Math.max(0, Math.min(100, Math.round((Number(entry.score || 0) / 10) * 100)))));
  }

  function competencyAverage(entries, competency) {
    return percentForEntries(entries.filter((entry) => entry.competencies.includes(competency)));
  }

  function recommendationForCompetency(topicTitle, competency, value) {
    if (value >= 80) {
      return `Buen desempeño en ${competency} de ${topicTitle}. Conviene felicitar y avanzar.`;
    }
    if (value >= 50) {
      return `Refuerza ${competency} en ${topicTitle} con práctica guiada e ideas clave.`;
    }
    return `Repite un juego básico de ${topicTitle} enfocado en ${competency}.`;
  }

  function buildStudentSummary(student, teacher, rawProgress) {
    const entries = Object.entries(rawProgress || {}).map(([id, item]) => ({
      id,
      topicId: item?.topicId || String(id).split("-")[0],
      score: Number(item?.score || 0),
      attempts: Number(item?.attempts || 1),
      ok: Boolean(item?.ok),
      competencies: Array.isArray(item?.c) ? item.c : [],
      date: item?.updatedAt || item?.date || null
    }));

    const totalPoints = entries.reduce((sum, entry) => sum + entry.score, 0);
    const averagePercent = percentForEntries(entries);
    const overallState = stateFromPercent(averagePercent);
    const completedGames = entries.filter((entry) => entry.ok).length;
    const pendingGames = Math.max(0, TOTAL_GAMES - completedGames);
    const failedAttempts = entries.reduce((sum, entry) => sum + Math.max(0, entry.attempts - 1), 0);
    const lastEntry = [...entries].filter((entry) => entry.date).sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null;
    const overallCompetencies = {
      C1: competencyAverage(entries, "C1"),
      C2: competencyAverage(entries, "C2"),
      C3: competencyAverage(entries, "C3")
    };
    const weakestCompetency = Object.entries(overallCompetencies).sort((a, b) => a[1] - b[1])[0]?.[0] || "C1";

    const topicCards = TOPICS.map((topic) => {
      const topicEntries = entries.filter((entry) => entry.topicId === topic.id);
      const completed = topicEntries.filter((entry) => entry.ok).length;
      const competencies = {
        C1: competencyAverage(topicEntries, "C1"),
        C2: competencyAverage(topicEntries, "C2"),
        C3: competencyAverage(topicEntries, "C3")
      };
      const progress = percentForEntries(topicEntries);
      const weakest = Object.entries(competencies).sort((a, b) => a[1] - b[1])[0]?.[0] || "C1";
      return {
        id: topic.id,
        title: topic.title,
        progress,
        completed,
        total: 10,
        state: stateFromPercent(progress),
        competencies,
        recommendation: recommendationForCompetency(topic.title, weakest, competencies[weakest] || 0)
      };
    });

    const gameRows = entries.map((entry) => ({
      id: entry.id,
      name: gameLabel(entry.id),
      topicId: entry.topicId,
      topic: getTopicTitle(entry.topicId),
      score: entry.score,
      competency: entry.competencies.join(", ") || "C1",
      date: formatDate(entry.date),
      attempts: entry.attempts,
      status: entry.ok ? "Logrado" : entry.score > 0 ? "En proceso" : "Necesita refuerzo"
    }));

    const weakestTopic = [...topicCards].sort((a, b) => a.progress - b.progress)[0] || null;
    const strongestTopic = [...topicCards].sort((a, b) => b.progress - a.progress)[0] || null;
    const workedTopics = topicCards.filter((topic) => topic.progress > 0);
    const recommendation = weakestTopic
      ? weakestTopic.progress >= 80
        ? "Felicitar por su avance y proponer un reto nuevo."
        : weakestTopic.progress >= 50
          ? `Asignar una práctica breve en ${weakestTopic.title}.`
          : `Reforzar ${weakestCompetency} en ${weakestTopic.title} con actividades básicas.`
      : "Invita al estudiante a completar su primera actividad.";

    const riskScore = (100 - averagePercent) + pendingGames + failedAttempts * 6 + Math.max(0, 50 - totalPoints);

    return {
      student,
      section: sectionLabel(student, teacher),
      lastAccess: formatDate(student.lastAccess || lastEntry?.date),
      averagePercent,
      totalPoints,
      overallState,
      lastActivity: lastEntry ? `${gameLabel(lastEntry.id)} · ${getTopicTitle(lastEntry.topicId)}` : "Sin actividad",
      timeMinutes: entries.reduce((sum, entry) => sum + Math.max(1, entry.attempts) * 4, 0),
      completedGames,
      pendingGames,
      failedAttempts,
      overallCompetencies,
      weakestCompetency,
      topicCards,
      workedTopics,
      strongestTopic,
      weakestTopic,
      gameRows,
      recommendation,
      riskScore
    };
  }

  function filterStudents(students, state) {
    return students.filter((item) => {
      if (state.student !== "all" && item.student.id !== state.student) return false;
      if (state.section !== "all" && item.section !== state.section) return false;
      if (state.status !== "all") {
        const hasStatus = item.gameRows.some((row) => row.status === state.status);
        if (!hasStatus) return false;
      }
      if (state.support === "support" && item.overallState.label !== "Necesita apoyo") return false;
      if (state.topic !== "all") {
        const topic = item.topicCards.find((card) => card.id === state.topic);
        if (!topic) return false;
        if (state.competency !== "all" && topic.competencies[state.competency] <= 0) return false;
      }
      if (state.competency !== "all" && state.topic === "all" && item.overallCompetencies[state.competency] <= 0) return false;
      return true;
    });
  }

  function exportStudentCsv(summary) {
    const lines = [
      ["Nombre", "Sección", "Juego", "Temario", "Puntaje", "Competencia", "Fecha", "Intentos", "Estado"].join(","),
      ...summary.gameRows.map((row) => [
        `"${summary.student.name}"`,
        `"${summary.section}"`,
        `"${row.name}"`,
        `"${row.topic}"`,
        row.score,
        `"${row.competency}"`,
        `"${row.date}"`,
        row.attempts,
        `"${row.status}"`
      ].join(","))
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${summary.student.name.replace(/\s+/g, "_")}_reporte.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function escapeXml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&apos;");
  }

  function columnName(index) {
    let name = "";
    let current = index + 1;
    while (current > 0) {
      const rem = (current - 1) % 26;
      name = String.fromCharCode(65 + rem) + name;
      current = Math.floor((current - 1) / 26);
    }
    return name;
  }

  function createWorksheetXml(rows) {
    const body = rows.map((row, rowIndex) => {
      const cells = row.map((value, colIndex) => {
        const ref = `${columnName(colIndex)}${rowIndex + 1}`;
        if (typeof value === "number") {
          return `<c r="${ref}"><v>${value}</v></c>`;
        }
        return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
      }).join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    }).join("");

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${body}</sheetData>
</worksheet>`;
  }

  function crc32(bytes) {
    if (!window.__teacherLiteCrcTable) {
      const table = new Uint32Array(256);
      for (let n = 0; n < 256; n += 1) {
        let c = n;
        for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        table[n] = c >>> 0;
      }
      window.__teacherLiteCrcTable = table;
    }
    let crc = 0 ^ (-1);
    for (let i = 0; i < bytes.length; i += 1) {
      crc = (crc >>> 8) ^ window.__teacherLiteCrcTable[(crc ^ bytes[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  function uint16(value) {
    return new Uint8Array([value & 255, (value >>> 8) & 255]);
  }

  function uint32(value) {
    return new Uint8Array([value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]);
  }

  function concatBytes(chunks) {
    const size = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const out = new Uint8Array(size);
    let offset = 0;
    chunks.forEach((chunk) => {
      out.set(chunk, offset);
      offset += chunk.length;
    });
    return out;
  }

  function zipStore(files) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    files.forEach((file) => {
      const nameBytes = encoder.encode(file.name);
      const dataBytes = typeof file.data === "string" ? encoder.encode(file.data) : file.data;
      const crc = crc32(dataBytes);
      const localHeader = concatBytes([
        uint32(0x04034b50),
        uint16(20),
        uint16(0),
        uint16(0),
        uint16(0),
        uint16(0),
        uint32(crc),
        uint32(dataBytes.length),
        uint32(dataBytes.length),
        uint16(nameBytes.length),
        uint16(0),
        nameBytes,
        dataBytes
      ]);
      localParts.push(localHeader);

      const centralHeader = concatBytes([
        uint32(0x02014b50),
        uint16(20),
        uint16(20),
        uint16(0),
        uint16(0),
        uint16(0),
        uint16(0),
        uint32(crc),
        uint32(dataBytes.length),
        uint32(dataBytes.length),
        uint16(nameBytes.length),
        uint16(0),
        uint16(0),
        uint16(0),
        uint16(0),
        uint32(0),
        uint32(offset),
        nameBytes
      ]);
      centralParts.push(centralHeader);
      offset += localHeader.length;
    });

    const centralDirectory = concatBytes(centralParts);
    const localDirectory = concatBytes(localParts);
    const endRecord = concatBytes([
      uint32(0x06054b50),
      uint16(0),
      uint16(0),
      uint16(files.length),
      uint16(files.length),
      uint32(centralDirectory.length),
      uint32(localDirectory.length),
      uint16(0)
    ]);

    return new Blob([localDirectory, centralDirectory, endRecord], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
  }

  function exportRowsToXlsx(rows, fileName) {
    const sheetXml = createWorksheetXml(rows);
    const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Seguimiento" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;
    const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
    const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;
    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>`;

    const blob = zipStore([
      { name: "[Content_Types].xml", data: contentTypes },
      { name: "_rels/.rels", data: rootRels },
      { name: "xl/workbook.xml", data: workbookXml },
      { name: "xl/_rels/workbook.xml.rels", data: workbookRels },
      { name: "xl/worksheets/sheet1.xml", data: sheetXml },
      { name: "xl/styles.xml", data: stylesXml }
    ]);

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function buildExcelRows(summaries, state) {
    const rows = [[
      "Nombre del estudiante",
      "Sección",
      "Temario trabajado",
      "Nombre de la actividad o juego",
      "Competencia evaluada",
      "Puntuación obtenida",
      "Fecha de realización",
      "Estado"
    ]];

    const byTopic = new Map();
    TOPICS.forEach((topic) => byTopic.set(topic.id, []));

    summaries.forEach((summary) => {
      summary.gameRows.forEach((row) => {
        if (state.topic !== "all" && row.topicId !== state.topic) return;
        if (state.competency !== "all" && !row.competency.includes(state.competency)) return;
        if (state.status !== "all" && row.status !== state.status) return;
        if (!byTopic.has(row.topicId)) byTopic.set(row.topicId, []);
        byTopic.get(row.topicId).push([
          summary.student.name,
          summary.section,
          row.topic,
          row.name,
          row.competency,
          row.score,
          row.date,
          row.status
        ]);
      });
    });

    TOPICS.forEach((topic) => {
      const topicRows = byTopic.get(topic.id) || [];
      if (!topicRows.length) return;
      rows.push([topic.title, "", "", "", "", "", "", ""]);
      topicRows.forEach((row) => rows.push(row));
      rows.push(["", "", "", "", "", "", "", ""]);
    });

    return rows;
  }

  function ensureStyle() {
    if (document.getElementById("teacherConsoleLiteStyle")) return;
    const style = document.createElement("style");
    style.id = "teacherConsoleLiteStyle";
    style.textContent = `
      .teacher-lite-shell{display:grid;grid-template-columns:180px minmax(0,1fr);gap:24px;align-items:start}
      .teacher-lite-nav{padding:22px 16px;border-radius:28px;background:linear-gradient(180deg,#ffffff,#f8f4ff);box-shadow:0 18px 40px rgba(93,104,152,.12);display:grid;grid-template-rows:auto 1fr auto;gap:18px;min-height:calc(100vh - 110px);position:sticky;top:18px}
      .teacher-lite-brand strong{display:block;font-size:2.2rem;color:#6d28d9}
      .teacher-lite-brand span,.teacher-lite-meta small,.teacher-lite-empty,.teacher-lite-copy,.teacher-lite-placeholder{color:#5d6a84}
      .teacher-lite-links{display:grid;gap:12px}
      .teacher-lite-link{padding:14px 16px;border-radius:18px;background:#eef2ff;color:#5b3fd1;font-weight:800}
      .teacher-lite-link.active{background:linear-gradient(135deg,#ede9fe,#dbeafe)}
      .teacher-lite-main{display:grid;gap:18px;min-width:0}
      .teacher-lite-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
      .teacher-lite-head h2{margin:0;color:#284375;font-size:2rem}
      .teacher-lite-head p{margin:6px 0 0;color:#5d6a84;max-width:760px}
      .teacher-lite-actions{display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end}
      .teacher-lite-btn{border:none;border-radius:999px;padding:11px 16px;font:inherit;font-weight:800;cursor:pointer}
      .teacher-lite-btn.primary{background:linear-gradient(135deg,#1f70ff,#7b36eb);color:#fff}
      .teacher-lite-btn.ghost{background:#efe8ff;color:#6d28d9}
      .teacher-lite-summary{display:grid;grid-template-columns:repeat(4,minmax(170px,1fr));gap:14px}
      .teacher-lite-card{padding:18px 20px;border-radius:24px;background:linear-gradient(135deg,#ffffff,#f8f4ff);box-shadow:0 14px 28px rgba(93,104,152,.10)}
      .teacher-lite-card strong{display:block;font-size:1.8rem;color:#1f5ec5}
      .teacher-lite-card span{color:#5d6a84}
      .teacher-lite-grid{display:grid;grid-template-columns:minmax(390px,.92fr) minmax(520px,1.08fr);gap:18px;align-items:start}
      .teacher-lite-stack{display:grid;gap:18px}
      .teacher-lite-panel{padding:20px;border-radius:26px;background:linear-gradient(135deg,#ffffff,#f9f5ff);box-shadow:0 16px 32px rgba(93,104,152,.10);min-width:0}
      .teacher-lite-kicker{font-size:.8rem;font-weight:900;letter-spacing:.08em;color:#6d28d9;text-transform:uppercase;margin-bottom:10px}
      .teacher-lite-filter-grid{display:grid;grid-template-columns:repeat(2,minmax(210px,1fr));gap:16px 18px}
      .teacher-lite-field{display:grid;gap:6px;font-size:.84rem;font-weight:700;color:#52627f}
      .teacher-lite-field select{border:1px solid rgba(141,160,202,.22);border-radius:16px;padding:10px 12px;font:inherit;background:#fff}
      .teacher-lite-list,.teacher-lite-attention-list{display:grid;gap:12px}
      .teacher-lite-student{display:grid;grid-template-columns:minmax(230px,1.8fr) minmax(170px,.95fr) minmax(150px,.85fr);gap:16px;align-items:center;padding:18px;border-radius:22px;background:linear-gradient(135deg,#ffffff,#f8f5ff);box-shadow:0 10px 24px rgba(93,104,152,.08)}
      .teacher-lite-student.active{outline:3px solid rgba(123,54,235,.18)}
      .teacher-lite-student-main{display:flex;gap:12px;align-items:center;min-width:0}
      .teacher-lite-student-main button{all:unset;cursor:pointer;display:block}
      .teacher-lite-student-copy{display:grid;gap:4px}
      .teacher-lite-student-copy small{display:block;line-height:1.3}
      .teacher-lite-student-metric,.teacher-lite-student-side{display:grid;gap:8px}
      .teacher-lite-student-side{justify-items:start}
      .teacher-lite-stat-label{font-size:.76rem;font-weight:800;color:#6d28d9;text-transform:uppercase;letter-spacing:.04em}
      .teacher-lite-avatar{width:50px;height:50px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#ede9fe,#dbeafe);color:#6d28d9;font-weight:900}
      .teacher-lite-student strong,.teacher-lite-section{display:block;color:#284375}
      .teacher-lite-student small,.teacher-lite-meta-note,.teacher-lite-topic-copy,.teacher-lite-table td,.teacher-lite-attention-copy{color:#5d6a84}
      .teacher-lite-badge{display:inline-flex;align-items:center;justify-content:center;padding:8px 12px;border-radius:999px;font-weight:800;background:#efe8ff;color:#6d28d9}
      .teacher-lite-badge.good{background:#dcfce7;color:#15803d}
      .teacher-lite-badge.warn{background:#fef3c7;color:#b45309}
      .teacher-lite-badge.danger{background:#fee2e2;color:#b91c1c}
      .teacher-lite-progress{width:100%;height:9px;border-radius:999px;background:#edf2ff;overflow:hidden;margin-top:6px}
      .teacher-lite-progress i{display:block;height:100%;border-radius:999px;background:#22c55e}
      .teacher-lite-progress i.warn{background:#f59e0b}
      .teacher-lite-progress i.danger{background:#ef4444}
      .teacher-lite-inline-bars{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:8px}
      .teacher-lite-inline-bars div{display:grid;gap:4px}
      .teacher-lite-inline-bars label{font-size:.74rem;font-weight:900;color:#6d28d9}
      .teacher-lite-attention-item{padding:12px 14px;border-radius:18px;background:#fff;border:1px solid rgba(148,163,184,.12);display:grid;gap:6px}
      .teacher-lite-detail-grid{display:grid;gap:16px}
      .teacher-lite-detail-head{display:flex;justify-content:space-between;gap:12px;align-items:center}
      .teacher-lite-detail-tools{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}
      .teacher-lite-close{width:38px;height:38px;border:none;border-radius:999px;background:#fee2e2;color:#b91c1c;font:inherit;font-weight:900;cursor:pointer}
      .teacher-lite-summary-card{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
      .teacher-lite-mini{padding:14px;border-radius:20px;background:#fff;border:1px solid rgba(148,163,184,.12)}
      .teacher-lite-mini strong{display:block;font-size:1.1rem;color:#1f5ec5}
      .teacher-lite-topic-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
      .teacher-lite-chip{display:inline-flex;align-items:center;justify-content:center;padding:8px 12px;border-radius:999px;background:#eef2ff;color:#5b3fd1;font-weight:800;font-size:.84rem}
      .teacher-lite-topic-list{display:grid;gap:10px}
      .teacher-lite-topic{padding:12px;border-radius:18px;background:#fff;border:1px solid rgba(148,163,184,.12);display:grid;gap:10px}
      .teacher-lite-topic-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
      .teacher-lite-topic-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .teacher-lite-topic-meta div{padding:10px 12px;border-radius:16px;background:#f8faff}
      .teacher-lite-topic-meta strong{display:block;color:#1f5ec5}
      .teacher-lite-competency-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
      .teacher-lite-competency{padding:10px 12px;border-radius:16px;background:linear-gradient(135deg,#fdfcff,#f4f7ff);display:grid;gap:4px}
      .teacher-lite-competency label{font-size:.75rem;font-weight:900;color:#6d28d9}
      .teacher-lite-strength-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .teacher-lite-strength{padding:14px;border-radius:20px;border:1px solid rgba(148,163,184,.12);background:#fff}
      .teacher-lite-strength.good{background:linear-gradient(135deg,#f0fdf4,#ffffff)}
      .teacher-lite-strength.warn{background:linear-gradient(135deg,#fff7ed,#ffffff)}
      .teacher-lite-note{font-size:.84rem;color:#5d6a84;margin-top:8px}
      .teacher-lite-table-wrap{overflow:auto}
      .teacher-lite-table{width:100%;border-collapse:collapse;font-size:.92rem}
      .teacher-lite-table th,.teacher-lite-table td{padding:10px 8px;border-bottom:1px solid rgba(148,163,184,.14);text-align:left;vertical-align:top}
      .teacher-lite-table th{color:#6d28d9;font-size:.78rem;text-transform:uppercase;letter-spacing:.06em}
      .teacher-lite-recommend{padding:16px;border-radius:20px;background:linear-gradient(135deg,#eef8ff,#f9f0ff);color:#284375}
      .teacher-lite-empty-panel{display:grid;place-items:center;min-height:420px;text-align:center;color:#5d6a84}
      .teacher-lite-toast{padding:14px 16px;border-radius:18px;background:linear-gradient(135deg,#1f70ff,#7b36eb);color:#fff;font-weight:800;box-shadow:0 16px 30px rgba(66,82,179,.24)}
      @media (max-width: 1220px){
        .teacher-lite-shell{grid-template-columns:1fr}
        .teacher-lite-grid,.teacher-lite-summary-card,.teacher-lite-competency-grid,.teacher-lite-inline-bars,.teacher-lite-strength-grid,.teacher-lite-topic-meta{grid-template-columns:1fr}
        .teacher-lite-summary{grid-template-columns:repeat(3,minmax(130px,1fr))}
        .teacher-lite-nav{min-height:auto}
      }
      @media (max-width: 820px){
        .teacher-lite-filter-grid,.teacher-lite-summary,.teacher-lite-summary-card{grid-template-columns:1fr}
        .teacher-lite-head{flex-direction:column}
        .teacher-lite-actions{justify-content:flex-start}
        .teacher-lite-student{grid-template-columns:1fr}
        .teacher-lite-detail-head{align-items:flex-start;flex-direction:column}
        .teacher-lite-detail-tools{justify-content:flex-start}
      }
    `;
    document.head.appendChild(style);
  }

  function renderLiteTeacher() {
    const session = getSession();
    if (!session || session.role !== "teacher") return false;
    const current = app.querySelector(".real-dashboard");
    if (!current) return false;

    const teacher = getTeacher();
    if (!teacher) return false;

    const students = readJson(KEYS.students, []).filter((item) => item.teacherId === teacher.id);
    const progress = readJson(KEYS.progress, {});
    const state = getState();
    const summaries = students.map((student) => buildStudentSummary(student, teacher, progress[student.id] || {}));
    const filtered = filterStudents(summaries, state);
    const selected = filtered.find((item) => item.student.id === state.selected) || null;
    const attentionStudents = [...summaries]
      .filter((item) => item.overallState.label !== "Excelente" || item.failedAttempts >= 3 || item.completedGames <= 2)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 1);
    const selectedTopics = selected
      ? (selected.topicCards.filter((topic) => topic.progress > 0).sort((a, b) => b.progress - a.progress))
      : [];
    const visibleTopics = selected
      ? ((selectedTopics.length ? selectedTopics : selected.topicCards).slice(0, state.expanded === "more" ? 4 : 2))
      : [];

    const averagePercent = mean(filtered.map((item) => item.averagePercent));
    const activeToday = filtered.filter((item) => isToday(item.student.lastAccess) || isToday(item.gameRows[0]?.date)).length;
    const totalCompleted = filtered.reduce((sum, item) => sum + item.completedGames, 0);
    const averagePoints = mean(filtered.map((item) => item.totalPoints));
    const competencySummary = {
      C1: mean(filtered.map((item) => item.overallCompetencies.C1)),
      C2: mean(filtered.map((item) => item.overallCompetencies.C2)),
      C3: mean(filtered.map((item) => item.overallCompetencies.C3))
    };
    const weakestCompetency = Object.entries(competencySummary).sort((a, b) => a[1] - b[1])[0]?.[0] || "C1";
    const topicNeedingHelp = TOPICS.map((topic) => ({
      id: topic.id,
      title: topic.title,
      score: mean(filtered.map((item) => item.topicCards.find((card) => card.id === topic.id)?.progress || 0))
    })).sort((a, b) => a.score - b.score)[0] || { title: "Sin datos", score: 0 };
    const sections = [...new Set(summaries.map((item) => item.section))].sort();

    ensureStyle();

    current.outerHTML = `
      <section class="real-dashboard teacher-lite-shell">
        <aside class="teacher-lite-nav">
          <div class="teacher-lite-brand">
            <strong>YOYO</strong>
            <span>Consola Lite del Maestro</span>
          </div>
          <div class="teacher-lite-links">
            <div class="teacher-lite-link active">Resumen</div>
            <div class="teacher-lite-link">Estudiantes</div>
            <div class="teacher-lite-link">Temarios</div>
            <div class="teacher-lite-link">Reportes</div>
          </div>
          <div class="teacher-lite-meta">
            <strong>${escapeHtml(teacher.name)}</strong><br>
            <small>${escapeHtml(teacher.school)}</small>
          </div>
        </aside>

        <div class="teacher-lite-main">
          <div class="teacher-lite-head">
            <div>
              <h2>Estudiantes</h2>
              <p>Seguimiento personalizado, rápido y claro para cada estudiante sin mezclar roles ni cargar una consola pesada.</p>
            </div>
            <div class="teacher-lite-actions">
              <button class="teacher-lite-btn ghost" type="button" data-lite-back-main>Volver al panel principal</button>
              <button class="teacher-lite-btn ghost" type="button" data-lite-copy-code>Copiar código</button>
              <button class="teacher-lite-btn primary" type="button" data-lite-copy-link>Copiar link de clase</button>
              <button class="teacher-lite-btn primary" type="button" data-lite-export-course>Descargar Excel del curso</button>
              <button class="teacher-lite-btn ghost" type="button" data-lite-logout>Cerrar sesión</button>
            </div>
          </div>

          ${state.toast ? `<div class="teacher-lite-toast">${escapeHtml(state.toast)}</div>` : ""}

          <div class="teacher-lite-summary">
            <article class="teacher-lite-card"><strong>${filtered.length}</strong><span>Total de estudiantes</span></article>
            <article class="teacher-lite-card"><strong>${activeToday}</strong><span>Activos hoy</span></article>
            <article class="teacher-lite-card"><strong>${totalCompleted}</strong><span>Actividades completadas</span></article>
            <article class="teacher-lite-card"><strong>${averagePercent}%</strong><span>${escapeHtml(topicNeedingHelp.title)} · ${weakestCompetency}</span></article>
          </div>

          <div class="teacher-lite-grid">
            <div class="teacher-lite-stack">
              <section class="teacher-lite-panel">
                <div class="teacher-lite-kicker">Filtros y estudiantes</div>
                <div class="teacher-lite-filter-grid">
                  <label class="teacher-lite-field">Estudiante
                    <select data-lite-filter="student">
                      <option value="all" ${state.student === "all" ? "selected" : ""}>Todos</option>
                      ${summaries.map((item) => `<option value="${item.student.id}" ${state.student === item.student.id ? "selected" : ""}>${escapeHtml(item.student.name)}</option>`).join("")}
                    </select>
                  </label>
                  <label class="teacher-lite-field">Sección
                    <select data-lite-filter="section">
                      <option value="all" ${state.section === "all" ? "selected" : ""}>Todas</option>
                      ${sections.map((section) => `<option value="${escapeHtml(section)}" ${state.section === section ? "selected" : ""}>${escapeHtml(section)}</option>`).join("")}
                    </select>
                  </label>
                  <label class="teacher-lite-field">Temario
                    <select data-lite-filter="topic">
                      <option value="all" ${state.topic === "all" ? "selected" : ""}>Todos</option>
                      ${TOPICS.map((topic) => `<option value="${topic.id}" ${state.topic === topic.id ? "selected" : ""}>${topic.title}</option>`).join("")}
                    </select>
                  </label>
                  <label class="teacher-lite-field">Competencia
                    <select data-lite-filter="competency">
                      <option value="all" ${state.competency === "all" ? "selected" : ""}>Todas</option>
                      <option value="C1" ${state.competency === "C1" ? "selected" : ""}>C1</option>
                      <option value="C2" ${state.competency === "C2" ? "selected" : ""}>C2</option>
                      <option value="C3" ${state.competency === "C3" ? "selected" : ""}>C3</option>
                    </select>
                  </label>
                  <label class="teacher-lite-field">Estado
                    <select data-lite-filter="status">
                      <option value="all" ${state.status === "all" ? "selected" : ""}>Todos</option>
                      <option value="Logrado" ${state.status === "Logrado" ? "selected" : ""}>Logrado</option>
                      <option value="En progreso" ${state.status === "En progreso" ? "selected" : ""}>En progreso</option>
                      <option value="Necesita refuerzo" ${state.status === "Necesita refuerzo" ? "selected" : ""}>Necesita refuerzo</option>
                    </select>
                  </label>
                  <label class="teacher-lite-field">Atención
                    <select data-lite-filter="support">
                      <option value="all" ${state.support === "all" ? "selected" : ""}>Todos</option>
                      <option value="support" ${state.support === "support" ? "selected" : ""}>Necesitan apoyo</option>
                    </select>
                  </label>
                </div>

                <div class="teacher-lite-list" style="margin-top:14px;">
                  ${filtered.length ? filtered.map((item) => `
                    <article class="teacher-lite-student ${selected?.student.id === item.student.id ? "active" : ""}">
                      <div class="teacher-lite-student-main">
                        <div class="teacher-lite-avatar">${escapeHtml(item.student.name.slice(0, 1).toUpperCase())}</div>
                        <div class="teacher-lite-student-copy">
                          <button type="button" data-lite-student="${item.student.id}">
                            <strong>${escapeHtml(item.student.name)}</strong>
                            <small>Sección: ${escapeHtml(item.section)}</small>
                            <small>Último acceso: ${escapeHtml(item.lastAccess)}</small>
                          </button>
                        </div>
                      </div>
                      <div class="teacher-lite-student-metric">
                        <span class="teacher-lite-stat-label">Progreso general</span>
                        <strong>${item.averagePercent}%</strong>
                        <div class="teacher-lite-progress"><i class="${item.overallState.tone}" style="width:${item.averagePercent}%"></i></div>
                      </div>
                      <div class="teacher-lite-student-side">
                        <span class="teacher-lite-stat-label">Puntaje</span>
                        <strong>${item.totalPoints}</strong>
                        <span class="teacher-lite-badge ${item.overallState.tone}">${item.overallState.label}</span>
                        <div class="teacher-lite-actions" style="margin-top:8px;justify-content:flex-start;">
                          <button class="teacher-lite-btn ghost" type="button" data-lite-student="${item.student.id}">Ver detalle</button>
                        </div>
                      </div>
                    </article>
                  `).join("") : `<div class="teacher-lite-empty">No hay estudiantes para ese filtro.</div>`}
                </div>
              </section>

              <section class="teacher-lite-panel">
                <div class="teacher-lite-kicker">Estudiantes que necesitan atención</div>
                <div class="teacher-lite-attention-list">
                  ${attentionStudents.length ? attentionStudents.slice(0, 2).map((item) => `
                    <article class="teacher-lite-attention-item">
                      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
                        <div>
                          <strong>${escapeHtml(item.student.name)}</strong>
                          <div class="teacher-lite-attention-copy">${escapeHtml(item.section)} · ${item.averagePercent}% general</div>
                        </div>
                        <span class="teacher-lite-badge ${item.overallState.tone}">${item.overallState.label}</span>
                      </div>
                      <div class="teacher-lite-attention-copy">Refuerzo sugerido: ${escapeHtml(item.weakestTopic?.title || "Temario inicial")}.</div>
                    </article>
                  `).join("") : `<div class="teacher-lite-empty">No hay alertas en este momento.</div>`}
                </div>
              </section>
            </div>

            <section class="teacher-lite-panel">
              ${selected ? `
                <div class="teacher-lite-detail-grid">
                  <div>
                    <div class="teacher-lite-detail-head">
                      <div>
                        <div class="teacher-lite-kicker">Resumen del estudiante</div>
                        <div class="teacher-lite-topic-copy">Vista rápida del seguimiento personalizado.</div>
                      </div>
                      <div class="teacher-lite-detail-tools">
                        <button class="teacher-lite-btn ghost" type="button" data-lite-toggle-more>${state.expanded === "more" ? "Ver menos" : "Ver más"}</button>
                        <button class="teacher-lite-close" type="button" data-lite-close-detail aria-label="Cerrar detalles del alumno">×</button>
                      </div>
                    </div>
                    <div class="teacher-lite-summary-card">
                      <div class="teacher-lite-mini"><strong>${escapeHtml(selected.student.name)}</strong><span>Nombre</span></div>
                      <div class="teacher-lite-mini"><strong>${escapeHtml(selected.section)}</strong><span>Sección</span></div>
                      <div class="teacher-lite-mini"><strong>${selected.averagePercent}%</strong><span>Progreso general</span></div>
                      <div class="teacher-lite-mini"><strong>${escapeHtml(selected.lastActivity)}</strong><span>Última actividad</span></div>
                      <div class="teacher-lite-mini"><strong>${selected.completedGames}</strong><span>Juegos completados</span></div>
                      <div class="teacher-lite-mini"><strong>${selected.pendingGames}</strong><span>Juegos pendientes</span></div>
                      <div class="teacher-lite-mini"><strong>${selected.totalPoints}</strong><span>Puntaje total</span></div>
                      <div class="teacher-lite-mini"><strong>${selected.overallState.label}</strong><span>Nivel de desempeño</span></div>
                    </div>
                    ${state.expanded === "more" ? `
                    <div class="teacher-lite-summary-card" style="margin-top:10px;">
                      <div class="teacher-lite-mini"><strong>${selected.totalPoints}</strong><span>Puntaje total</span></div>
                      <div class="teacher-lite-mini"><strong>${selected.timeMinutes} min</strong><span>Tiempo de uso</span></div>
                      <div class="teacher-lite-mini"><strong>${selected.failedAttempts}</strong><span>Intentos fallidos</span></div>
                      <div class="teacher-lite-mini"><strong>${selected.overallState.label}</strong><span>Nivel de desempeÃ±o</span></div>
                      <div class="teacher-lite-mini"><strong>${selected.workedTopics.length}</strong><span>Temarios trabajados</span></div>
                      <div class="teacher-lite-mini"><strong>${selected.overallCompetencies.C1}%</strong><span>C1</span></div>
                      <div class="teacher-lite-mini"><strong>${selected.overallCompetencies.C2}%</strong><span>C2</span></div>
                      <div class="teacher-lite-mini"><strong>${selected.overallCompetencies.C3}%</strong><span>C3</span></div>
                    </div>
                    <div class="teacher-lite-topic-chips">
                      ${selected.workedTopics.length
                        ? selected.workedTopics.map((topic) => `<span class="teacher-lite-chip">${escapeHtml(topic.title)}</span>`).join("")
                        : `<span class="teacher-lite-chip">Sin temarios trabajados</span>`}
                    </div>
                    <div class="teacher-lite-strength-grid">
                      <article class="teacher-lite-strength good">
                        <div class="teacher-lite-kicker">Fortaleza principal</div>
                        <strong>${escapeHtml(selected.strongestTopic?.title || "Sin datos")}</strong>
                        <div class="teacher-lite-topic-copy">${selected.strongestTopic?.progress || 0}% de progreso</div>
                      </article>
                      <article class="teacher-lite-strength warn">
                        <div class="teacher-lite-kicker">Debilidad principal</div>
                        <strong>${escapeHtml(selected.weakestTopic?.title || "Sin datos")}</strong>
                        <div class="teacher-lite-topic-copy">${selected.weakestTopic?.progress || 0}% de progreso</div>
                      </article>
                    </div>
                    ` : ""}
                  </div>

                  <div>
                    <div class="teacher-lite-kicker">Progreso por temario</div>
                    <div class="teacher-lite-topic-list">
                      ${visibleTopics.map((topic) => `
                        <article class="teacher-lite-topic">
                          <div class="teacher-lite-topic-head">
                            <div>
                              <strong>${escapeHtml(topic.title)}</strong>
                              <div class="teacher-lite-topic-copy">${topic.progress}% · ${topic.state.label}</div>
                            </div>
                            <span class="teacher-lite-badge ${topic.state.tone}">${topic.state.label}</span>
                          </div>
                          <div class="teacher-lite-topic-meta">
                            <div><strong>${topic.progress}%</strong><small>Promedio del temario</small></div>
                            <div><strong>${topic.completed}/${topic.total}</strong><small>Actividades completadas</small></div>
                          </div>
                          <div class="teacher-lite-competency-grid">
                            ${["C1", "C2", "C3"].map((key) => `
                              <div class="teacher-lite-competency">
                                <label>${key}: ${COMPETENCY_LABELS[key]}</label>
                                <strong>${topic.competencies[key]}%</strong>
                                <div class="teacher-lite-progress"><i class="${toneForValue(topic.competencies[key])}" style="width:${topic.competencies[key]}%"></i></div>
                              </div>
                            `).join("")}
                          </div>
                        </article>
                      `).join("")}
                    </div>
                  </div>

                  <div class="teacher-lite-recommend">
                    <div class="teacher-lite-kicker">Recomendación para este estudiante</div>
                    <strong>${escapeHtml(selected.recommendation)}</strong>
                    <div class="teacher-lite-actions" style="margin-top:12px;justify-content:flex-start;">
                      <button class="teacher-lite-btn ghost" type="button" data-lite-action="assign">Asignar actividad</button>
                      <button class="teacher-lite-btn ghost" type="button" data-lite-action="report">Descargar reporte</button>
                      <button class="teacher-lite-btn primary" type="button" data-lite-action="feedback">Enviar retroalimentación</button>
                      <button class="teacher-lite-btn ghost" type="button" data-lite-action="reset">Reiniciar progreso</button>
                      <button class="teacher-lite-btn ghost" type="button" data-lite-close-detail>Volver atrás</button>
                    </div>
                  </div>
                </div>
              ` : `
                <div class="teacher-lite-empty-panel">
                  <div>
                    <div class="teacher-lite-kicker">Seguimiento personalizado</div>
                    <h3 style="margin:0 0 10px;color:#284375">Selecciona un estudiante</h3>
                    <p class="teacher-lite-placeholder" style="margin:0">Haz clic en un estudiante para ver su progreso, competencias, juegos, temarios y recomendación personalizada.</p>
                  </div>
                </div>
              `}
            </section>
          </div>
        </div>
      </section>
    `;

    bindLiteTeacher(teacher, selected);
    return true;
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {}
  }

  function bindLiteTeacher(teacher, selected) {
    app.querySelector("[data-lite-copy-code]")?.addEventListener("click", async () => {
      await copyText(teacher.code);
      showToast("Código copiado.");
    });

    app.querySelector("[data-lite-copy-link]")?.addEventListener("click", async () => {
      await copyText(getShareLink(teacher));
      showToast("Link de clase copiado.");
    });

    app.querySelector("[data-lite-export-course]")?.addEventListener("click", () => {
      const allStudents = readJson(KEYS.students, []).filter((item) => item.teacherId === teacher.id);
      const allProgress = readJson(KEYS.progress, {});
      const currentState = getState();
      const summaries = filterStudents(
        allStudents.map((student) => buildStudentSummary(student, teacher, allProgress[student.id] || {})),
        currentState
      );
      const rows = buildExcelRows(summaries, currentState);
      exportRowsToXlsx(rows, `reporte_curso_${teacher.code}.xlsx`);
      showToast("Excel del curso descargado.");
    });

    app.querySelector("[data-lite-logout]")?.addEventListener("click", () => {
      try { localStorage.removeItem(KEYS.session); } catch {}
      window.location.reload();
    });

    app.querySelector("[data-lite-back-main]")?.addEventListener("click", () => {
      setState({ selected: "", expanded: "" });
      renderLiteTeacher();
    });

    app.querySelector("[data-lite-close-detail]")?.addEventListener("click", () => {
      setState({ selected: "", expanded: "" });
      renderLiteTeacher();
    });

    app.querySelector("[data-lite-toggle-more]")?.addEventListener("click", () => {
      setState({ expanded: getState().expanded === "more" ? "" : "more" });
      renderLiteTeacher();
    });

    app.querySelectorAll("[data-lite-student]").forEach((button) => {
      button.addEventListener("click", () => {
        setState({ selected: button.dataset.liteStudent || "", expanded: "" });
        renderLiteTeacher();
      });
    });

    app.querySelectorAll("[data-lite-filter]").forEach((select) => {
      select.addEventListener("change", () => {
        setState({
          [select.dataset.liteFilter]: select.value,
          selected: "",
          expanded: ""
        });
        renderLiteTeacher();
      });
    });

    app.querySelectorAll("[data-lite-action]").forEach((button) => {
      button.addEventListener("click", () => {
        if (!selected) return;
        const action = button.dataset.liteAction;
        if (action === "assign") {
          showToast(`Actividad sugerida para ${selected.student.name}.`);
          return;
        }
        if (action === "report") {
          const rows = buildExcelRows([selected], { ...getState(), topic: "all", competency: "all", status: "all" });
          exportRowsToXlsx(rows, `reporte_${selected.student.name.replace(/\s+/g, "_")}.xlsx`);
          showToast(`Reporte descargado de ${selected.student.name}.`);
          return;
        }
        if (action === "feedback") {
          showToast(`Retroalimentación lista para ${selected.student.name}.`);
          return;
        }
        if (action === "reset") {
          const progress = readJson(KEYS.progress, {});
          delete progress[selected.student.id];
          writeJson(KEYS.progress, progress);
          showToast(`Progreso reiniciado para ${selected.student.name}.`);
          setState({ selected: "", expanded: "" });
          renderLiteTeacher();
        }
      });
    });
  }

  function mount() {
    const session = getSession();
    if (!session || session.role !== "teacher") return false;
    return renderLiteTeacher();
  }

  const observer = new MutationObserver(() => {
    const session = getSession();
    if (!session || session.role !== "teacher") return;
    if (!app.querySelector(".teacher-lite-shell")) {
      if (renderLiteTeacher()) observer.disconnect();
    }
  });
  if (!mount()) {
    observer.observe(app, { childList: true, subtree: true });
  }
})();
