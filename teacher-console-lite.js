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

  function escapeXml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&apos;");
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
      toast: app.dataset.teacherLiteToast || ""
    };
  }

  function setState(patch) {
    Object.entries(patch).forEach(([key, value]) => {
      const dataKey = `teacherLite${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      if (!value || value === "all") delete app.dataset[dataKey];
      else app.dataset[dataKey] = value;
    });
  }

  function clearToastLater() {
    window.clearTimeout(window.__teacherLiteToastTimer);
    window.__teacherLiteToastTimer = window.setTimeout(() => {
      delete app.dataset.teacherLiteToast;
      if (app.querySelector(".teacher-lite-shell")) renderLiteTeacher();
    }, 2200);
  }

  function showToast(message) {
    setState({ toast: message });
    renderLiteTeacher();
    clearToastLater();
  }

  function mean(values) {
    return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
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
    const now = new Date();
    return !Number.isNaN(date.getTime()) &&
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
  }

  function stateFromPercent(value) {
    if (value >= 80) return { label: "Excelente", tone: "good" };
    if (value >= 50) return { label: "En progreso", tone: "warn" };
    return { label: "Necesita apoyo", tone: "danger" };
  }

  function getTopicTitle(topicId) {
    return TOPICS.find((item) => item.id === topicId)?.title || topicId;
  }

  function sectionLabel(student, teacher) {
    return student.section || teacher.school || "Seccion general";
  }

  function gameLabel(id) {
    const match = String(id || "").match(/^(.+)-(\d+)$/);
    return match ? `Juego ${match[2]}` : "Actividad";
  }

  function normalizePercentScore(value) {
    const raw = Number(value || 0) || 0;
    return raw <= 10 ? Math.max(0, Math.min(100, raw * 10)) : Math.max(0, Math.min(100, Math.round(raw)));
  }

  function percentForEntries(entries) {
    if (!entries.length) return 0;
    return mean(entries.map((entry) => normalizePercentScore(entry.score)));
  }

  function competencyAverage(entries, competency) {
    return percentForEntries(entries.filter((entry) => entry.competencies.includes(competency)));
  }

  function recommendationForCompetency(topicTitle, competency, value) {
    if (value >= 80) return `Buen avance en ${competency} de ${topicTitle}.`;
    if (value >= 50) return `Conviene practicar ${competency} en ${topicTitle}.`;
    return `Necesita refuerzo en ${competency} de ${topicTitle}.`;
  }

  function buildStudentSummary(student, teacher, rawProgress) {
    const helper = window.__YOYO_PROGRESS__;
    if (helper && typeof helper.summarizeStudentProgress === "function") {
      const snapshot = helper.summarizeStudentProgress(student, rawProgress || {});
      const gameRows = (snapshot.historyRows || []).map((row) => ({
        id: row.activityId,
        name: row.activityName,
        topicId: row.topicId,
        topic: row.topicTitle,
        level: row.level || "Nivel",
        score: Math.round(Number(row.points || 0)),
        percent: Math.round(Number(row.percent || 0)),
        proportionalScore: Math.round(Number(row.proportionalScore || 0)),
        competency: row.competency || "C1",
        date: formatDate(row.date),
        rawDate: row.date || "",
        attempts: 1,
        status: row.status || "En progreso"
      }));
      const topicCards = (snapshot.topicCards || []).map((topic) => ({
        ...topic,
        recommendation:
          topic.recommendation ||
          recommendationForCompetency(
            topic.title,
            Object.entries(topic.competencies || {}).sort((a, b) => a[1] - b[1])[0]?.[0] || "C1",
            Object.entries(topic.competencies || {}).sort((a, b) => a[1] - b[1])[0]?.[1] || 0
          )
      }));
      const lastWorkedTopic =
        (snapshot.lastRow && topicCards.find((topic) => topic.id === snapshot.lastRow.topicId)) ||
        [...topicCards].sort((a, b) => b.progress - a.progress)[0] ||
        null;
      const strongestTopic = [...topicCards].sort((a, b) => b.progress - a.progress)[0] || null;
      const weakestTopic = [...topicCards].sort((a, b) => a.progress - b.progress)[0] || null;
      const overallState = stateFromPercent(snapshot.averagePercent || 0);
      return {
        student,
        section: sectionLabel(student, teacher),
        lastAccess: formatDate(student.lastAccess || snapshot.lastRow?.date),
        averagePercent: Number(snapshot.averagePercent || 0),
        totalPoints: Number(snapshot.totalPoints || 0),
        overallState,
        lastActivity: snapshot.lastRow ? `${snapshot.lastRow.activityName} · ${snapshot.lastRow.topicTitle}` : "Sin actividad",
        completedGames: Number(snapshot.completedGames || 0),
        pendingGames: Number(snapshot.pendingGames || 0),
        pendingLevels: Number(snapshot.pendingLevels || 0),
        failedAttempts: Number(snapshot.failedAttempts || 0),
        overallCompetencies: snapshot.overallCompetencies || { C1: 0, C2: 0, C3: 0 },
        topicCards,
        workedTopics: topicCards.filter((topic) => topic.progress > 0),
        lastTopicSummary: lastWorkedTopic,
        strongestTopic,
        weakestTopic,
        gameRows,
        historyRows: snapshot.historyRows || [],
        bestActivities: snapshot.bestActivities || [],
        recommendation: snapshot.recommendation || (weakestTopic ? weakestTopic.recommendation : "Invitar a completar su primera actividad."),
        riskScore: (100 - Number(snapshot.averagePercent || 0)) + Number(snapshot.pendingGames || 0) + Number(snapshot.failedAttempts || 0) * 6 + Math.max(0, 50 - Number(snapshot.totalPoints || 0))
      };
    }

    const entries = Object.entries(rawProgress || {}).map(([id, item]) => ({
      id,
      topicId: item?.topicId || String(id).split("-")[0],
      score: normalizePercentScore(item?.score || 0),
      attempts: Number(item?.attempts || 1),
      ok: Boolean(item?.ok),
      competencies: Array.isArray(item?.c) ? item.c : [],
      date: item?.updatedAt || item?.date || ""
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
      status: entry.ok ? "Logrado" : entry.score > 0 ? "En progreso" : "Necesita refuerzo"
    }));

    const workedTopics = topicCards.filter((topic) => topic.progress > 0);
    const lastTopicSummary = lastEntry
      ? topicCards.find((topic) => topic.id === lastEntry.topicId) || null
      : ([...workedTopics].sort((a, b) => b.progress - a.progress)[0] || null);
    const strongestTopic = [...topicCards].sort((a, b) => b.progress - a.progress)[0] || null;
    const weakestTopic = [...topicCards].sort((a, b) => a.progress - b.progress)[0] || null;
    const recommendation = weakestTopic
      ? weakestTopic.progress >= 80
        ? "Felicitar por su avance y proponer un nuevo reto."
        : weakestTopic.progress >= 50
          ? `Asignar practica breve en ${weakestTopic.title}.`
          : `Repetir un juego basico en ${weakestTopic.title}.`
      : "Invitar a completar su primera actividad.";

    const riskScore = (100 - averagePercent) + pendingGames + failedAttempts * 6 + Math.max(0, 50 - totalPoints);

    return {
      student,
      section: sectionLabel(student, teacher),
      lastAccess: formatDate(student.lastAccess || lastEntry?.date),
      averagePercent,
      totalPoints,
      overallState,
      lastActivity: lastEntry ? `${gameLabel(lastEntry.id)} · ${getTopicTitle(lastEntry.topicId)}` : "Sin actividad",
      completedGames,
      pendingGames,
      failedAttempts,
      overallCompetencies,
      topicCards,
      workedTopics,
      lastTopicSummary,
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
      if (state.support === "support" && item.overallState.label !== "Necesita apoyo") return false;
      if (state.topic !== "all") {
        const topic = item.topicCards.find((card) => card.id === state.topic);
        if (!topic) return false;
        if (state.competency !== "all" && topic.competencies[state.competency] <= 0) return false;
      }
      if (state.competency !== "all" && state.topic === "all" && item.overallCompetencies[state.competency] <= 0) return false;
      if (state.status !== "all") {
        const status = item.lastTopicSummary?.state.label === "Excelente"
          ? "Logrado"
          : item.lastTopicSummary?.state.label === "En progreso"
            ? "En progreso"
            : "Necesita refuerzo";
        if (status !== state.status) return false;
      }
      return true;
    });
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
        if (typeof value === "number") return `<c r="${ref}"><v>${value}</v></c>`;
        return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
      }).join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    }).join("");

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${body}</sheetData>
</worksheet>`;
  }

  function uint16(value) {
    const bytes = new Uint8Array(2);
    new DataView(bytes.buffer).setUint16(0, value, true);
    return bytes;
  }

  function uint32(value) {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value, true);
    return bytes;
  }

  function strBytes(value) {
    return new TextEncoder().encode(value);
  }

  function concatBytes(parts) {
    const size = parts.reduce((sum, part) => sum + part.length, 0);
    const merged = new Uint8Array(size);
    let offset = 0;
    parts.forEach((part) => {
      merged.set(part, offset);
      offset += part.length;
    });
    return merged;
  }

  function zipStore(files) {
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    files.forEach((file) => {
      const nameBytes = strBytes(file.name);
      const dataBytes = strBytes(file.data);
      const localHeader = concatBytes([
        uint32(0x04034b50), uint16(20), uint16(0), uint16(0),
        uint16(0), uint16(0), uint32(0), uint32(dataBytes.length), uint32(dataBytes.length),
        uint16(nameBytes.length), uint16(0), nameBytes, dataBytes
      ]);
      localParts.push(localHeader);

      const centralHeader = concatBytes([
        uint32(0x02014b50), uint16(20), uint16(20), uint16(0), uint16(0),
        uint16(0), uint16(0), uint32(0), uint32(dataBytes.length), uint32(dataBytes.length),
        uint16(nameBytes.length), uint16(0), uint16(0), uint16(0), uint16(0),
        uint32(0), uint32(offset), nameBytes
      ]);
      centralParts.push(centralHeader);
      offset += localHeader.length;
    });

    const centralDirectory = concatBytes(centralParts);
    const localDirectory = concatBytes(localParts);
    const endRecord = concatBytes([
      uint32(0x06054b50), uint16(0), uint16(0),
      uint16(files.length), uint16(files.length),
      uint32(centralDirectory.length), uint32(localDirectory.length), uint16(0)
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
      "Codigo de clase",
      "Seccion",
      "Temario trabajado",
      "Nombre de la actividad o juego",
      "Nivel",
      "Competencia evaluada",
      "Puntuacion obtenida",
      "Porcentaje logrado",
      "Nota proporcional",
      "Nota C1",
      "Nota C2",
      "Nota C3",
      "Promedio",
      "Fecha de realizacion",
      "Estado"
    ]];

    const byTopic = new Map();
    TOPICS.forEach((topic) => byTopic.set(topic.id, []));

    summaries.forEach((summary) => {
      const sourceRows = Array.isArray(summary.historyRows) && summary.historyRows.length
        ? summary.historyRows
        : summary.gameRows;
      sourceRows.forEach((row) => {
        if (state.topic !== "all" && row.topicId !== state.topic) return;
        const rowCompetency = row.competency || (Array.isArray(row.competencies) ? row.competencies.join(", ") : "C1");
        if (state.competency !== "all" && !String(rowCompetency).includes(state.competency)) return;
        if (state.status !== "all" && row.status !== state.status) return;
        const topicCard = summary.topicCards.find((item) => item.id === row.topicId);
        byTopic.get(row.topicId)?.push([
          summary.student.name,
          summary.student.code || "",
          summary.section,
          row.topicTitle || row.topic,
          row.activityName || row.name,
          row.level || "Nivel",
          rowCompetency,
          Number(row.points ?? row.score ?? 0),
          Number(row.percent ?? 0),
          Number(row.proportionalScore ?? 0),
          topicCard?.competencies?.C1 ?? 0,
          topicCard?.competencies?.C2 ?? 0,
          topicCard?.competencies?.C3 ?? 0,
          topicCard?.progress ?? 0,
          row.date ? formatDate(row.date) : (row.rawDate || row.date || ""),
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

  function buildStudentProgressRows(summary) {
    const rows = [
      ["Reporte de progreso del estudiante", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["Nombre del estudiante", summary.student.name, "Codigo de clase", summary.student.code || "", "", "", "", "", "", "", "", "", "", "", ""],
      ["Seccion", summary.section, "Ultimo acceso", summary.lastAccess, "", "", "", "", "", "", "", "", "", "", ""],
      ["Promedio general", `${summary.averagePercent}/100`, "Ultima actividad", summary.lastActivity, "", "", "", "", "", "", "", "", "", "", ""],
      ["Juegos completados", summary.completedGames, "Juegos pendientes", summary.pendingGames, "Niveles pendientes", summary.pendingLevels || 0, "", "", "", "", "", "", "", "", ""],
      ["Puntaje total", summary.totalPoints, "", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["Competencias generales", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["C1", `${summary.overallCompetencies.C1}/100`, "C2", `${summary.overallCompetencies.C2}/100`, "C3", `${summary.overallCompetencies.C3}/100`, "", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["Temarios trabajados", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    ];

    summary.topicCards.forEach((topic) => {
      if (topic.progress <= 0 && topic.completed <= 0) return;
      rows.push(
        [topic.title, "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["Promedio general del temario", `${topic.progress}/100`, "Actividades completadas", `${topic.completed}/${topic.total}`, "Estado", topic.state.label, "", "", "", "", "", "", "", "", ""],
        ["C1", `${topic.competencies.C1}/100`, "C2", `${topic.competencies.C2}/100`, "C3", `${topic.competencies.C3}/100`, "", "", "", "", "", "", "", "", ""],
        ["Recomendacion", topic.recommendation, "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
      );
    });

    rows.push(
      ["Fortalezas", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["Temario con mejor avance", summary.strongestTopic?.title || "Sin datos", "Progreso", `${summary.strongestTopic?.progress || 0}/100`, "", "", "", "", "", "", "", "", "", "", ""],
      ["Debilidades", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["Temario a reforzar", summary.weakestTopic?.title || "Sin datos", "Progreso", `${summary.weakestTopic?.progress || 0}/100`, "", "", "", "", "", "", "", "", "", "", ""],
      ["Recomendacion general", summary.recommendation, "", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["Mejor puntuacion por actividad", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["Juego", "Temario", "Competencias", "Mejor puntuacion", "Porcentaje", "Intentos", "Niveles pendientes", "Estado", "", "", "", "", "", "", ""]
    );

    (summary.bestActivities || []).forEach((row) => {
      rows.push([
        row.activityName,
        row.topicTitle,
        (row.competencies || []).join(", "),
        row.bestScore,
        `${row.bestPercent}%`,
        row.attempts,
        row.pendingLevels,
        row.status,
        "", "", "", "", "", "", ""
      ]);
    });

    rows.push(
      ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["Historial por actividad", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["Temario", "Juego", "Nivel", "Competencia", "Puntos obtenidos", "Porcentaje", "Nota proporcional", "Fecha", "Estado", "", "", "", "", "", ""]
    );

    (summary.historyRows || []).forEach((row) => {
      rows.push([
        row.topicTitle || row.topic,
        row.activityName || row.name,
        row.level || "Nivel",
        row.competency || "C1",
        Number(row.points ?? row.score ?? 0),
        `${Number(row.percent || 0)}%`,
        Number(row.proportionalScore ?? 0),
        row.date ? formatDate(row.date) : (row.rawDate || row.date || ""),
        row.status || "",
        "", "", "", "", "", ""
      ]);
    });

    return rows;
  }

  function ensureStyle() {
    if (document.getElementById("teacherConsoleLiteStyle")) return;
    const style = document.createElement("style");
    style.id = "teacherConsoleLiteStyle";
    style.textContent = `
      .teacher-lite-shell{display:grid;grid-template-columns:170px minmax(0,1fr);gap:22px;align-items:start}
      .teacher-lite-nav{padding:20px 14px;border-radius:28px;background:linear-gradient(180deg,#ffffff,#f8f4ff);box-shadow:0 18px 40px rgba(93,104,152,.10);display:grid;grid-template-rows:auto 1fr auto;gap:18px;min-height:calc(100vh - 110px);position:sticky;top:18px}
      .teacher-lite-brand strong{display:block;font-size:2rem;color:#6d28d9}
      .teacher-lite-brand span,.teacher-lite-meta small,.teacher-lite-empty,.teacher-lite-placeholder{color:#5d6a84}
      .teacher-lite-links{display:grid;gap:12px}
      .teacher-lite-link{padding:14px 16px;border-radius:18px;background:#eef2ff;color:#5b3fd1;font-weight:800}
      .teacher-lite-link.active{background:linear-gradient(135deg,#ede9fe,#dbeafe)}
      .teacher-lite-main{display:grid;gap:18px;min-width:0}
      .teacher-lite-head{display:flex;justify-content:flex-end;gap:16px;align-items:flex-start}
      .teacher-lite-actions{display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end}
      .teacher-lite-btn{border:none;border-radius:999px;padding:11px 16px;font:inherit;font-weight:800;cursor:pointer}
      .teacher-lite-btn.primary{background:linear-gradient(135deg,#1f70ff,#7b36eb);color:#fff}
      .teacher-lite-btn.ghost{background:#efe8ff;color:#6d28d9}
      .teacher-lite-summary{display:grid;grid-template-columns:repeat(4,minmax(160px,1fr));gap:14px}
      .teacher-lite-card{padding:18px 20px;border-radius:24px;background:linear-gradient(135deg,#ffffff,#f8f4ff);box-shadow:0 14px 28px rgba(93,104,152,.08)}
      .teacher-lite-card strong{display:block;font-size:1.8rem;color:#1f5ec5}
      .teacher-lite-card span{color:#5d6a84}
      .teacher-lite-grid{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:18px;align-items:start}
      .teacher-lite-stack{display:grid;gap:18px}
      .teacher-lite-panel{padding:20px;border-radius:26px;background:linear-gradient(135deg,#ffffff,#f9f5ff);box-shadow:0 16px 32px rgba(93,104,152,.08);min-width:0}
      .teacher-lite-kicker{font-size:.8rem;font-weight:900;letter-spacing:.08em;color:#6d28d9;text-transform:uppercase;margin-bottom:10px}
      .teacher-lite-filter-grid{display:grid;grid-template-columns:repeat(2,minmax(200px,1fr));gap:16px 18px}
      .teacher-lite-field{display:grid;gap:6px;font-size:.84rem;font-weight:700;color:#52627f}
      .teacher-lite-field select{border:1px solid rgba(141,160,202,.22);border-radius:16px;padding:10px 12px;font:inherit;background:#fff}
      .teacher-lite-list,.teacher-lite-attention-list{display:grid;gap:12px}
        .teacher-lite-student{display:grid;grid-template-columns:minmax(260px,1.5fr) minmax(280px,1.2fr) minmax(170px,.7fr);gap:14px;align-items:center;padding:18px;border-radius:22px;background:linear-gradient(135deg,#ffffff,#f8f5ff);box-shadow:0 10px 24px rgba(93,104,152,.08)}
        .teacher-lite-student-main{display:flex;gap:12px;align-items:center;min-width:0}
        .teacher-lite-student-copy{display:grid;gap:4px}
        .teacher-lite-student-copy strong{display:block;color:#284375}
        .teacher-lite-student-copy small{display:block;color:#5d6a84;line-height:1.3}
        .teacher-lite-avatar{width:50px;height:50px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#ede9fe,#dbeafe);color:#6d28d9;font-weight:900}
        .teacher-lite-student-side{display:grid;gap:8px;justify-items:start}
        .teacher-lite-topic-summary{display:grid;gap:8px;min-width:0}
        .teacher-lite-topic-summary strong{color:#284375}
        .teacher-lite-bars{display:grid;grid-template-columns:repeat(4,minmax(58px,1fr));gap:10px}
        .teacher-lite-bar{display:grid;gap:4px}
        .teacher-lite-bar label{font-size:.72rem;font-weight:900;color:#6d28d9;text-transform:uppercase}
        .teacher-lite-bar-track{height:8px;border-radius:999px;background:#edf2ff;overflow:hidden}
        .teacher-lite-bar-track i{display:block;height:100%;background:linear-gradient(135deg,#1f70ff,#7b36eb)}
        .teacher-lite-bar-track i.warn{background:linear-gradient(135deg,#f59e0b,#f97316)}
        .teacher-lite-bar-track i.danger{background:linear-gradient(135deg,#fb7185,#ef4444)}
        .teacher-lite-bar span{font-size:.76rem;color:#5d6a84}
        .teacher-lite-stat-label{font-size:.76rem;font-weight:800;color:#6d28d9;text-transform:uppercase;letter-spacing:.04em}
      .teacher-lite-progress{height:8px;border-radius:999px;background:#edf2ff;overflow:hidden}
      .teacher-lite-progress i{display:block;height:100%;border-radius:999px}
      .teacher-lite-progress i.good{background:linear-gradient(135deg,#22c55e,#34d399)}
      .teacher-lite-progress i.warn{background:linear-gradient(135deg,#f59e0b,#fbbf24)}
      .teacher-lite-progress i.danger{background:linear-gradient(135deg,#ef4444,#fb7185)}
      .teacher-lite-badge{display:inline-flex;align-items:center;justify-content:center;padding:8px 12px;border-radius:999px;font-weight:800;background:#efe8ff;color:#6d28d9}
      .teacher-lite-badge.good{background:#dcfce7;color:#15803d}
      .teacher-lite-badge.warn{background:#fef3c7;color:#b45309}
      .teacher-lite-badge.danger{background:#fee2e2;color:#b91c1c}
      .teacher-lite-empty,.teacher-lite-empty-panel{padding:18px;border-radius:18px;background:#f8faff}
      .teacher-lite-attention-item{padding:14px;border-radius:18px;background:#fff;border:1px solid rgba(148,163,184,.12);display:grid;gap:8px}
      .teacher-lite-toast{padding:14px 16px;border-radius:18px;background:linear-gradient(135deg,#1f70ff,#7b36eb);color:#fff;font-weight:800;box-shadow:0 16px 30px rgba(66,82,179,.24)}
      @media (max-width: 1220px){
        .teacher-lite-shell,.teacher-lite-grid{grid-template-columns:1fr}
        .teacher-lite-summary{grid-template-columns:repeat(2,minmax(140px,1fr))}
        .teacher-lite-nav{min-height:auto}
      }
      @media (max-width: 820px){
        .teacher-lite-filter-grid,.teacher-lite-summary{grid-template-columns:1fr}
        .teacher-lite-head{flex-direction:column}
        .teacher-lite-actions{justify-content:flex-start}
        .teacher-lite-student{grid-template-columns:1fr}
      }
    `;
    document.head.appendChild(style);
  }

  function getShareLink() {
    const url = new URL(window.location.href);
    url.search = "";
    return url.toString();
  }

  function shouldShowWelcome(teacherId) {
    const key = `yoyo_teacher_welcome_${teacherId}`;
    if (sessionStorage.getItem(key) === "1") return false;
    sessionStorage.setItem(key, "1");
    return true;
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {}
  }

  function renderLiteTeacher(reason) {
    console.count("[YOYO_DEBUG] teacher-console renderLiteTeacher");
    if (reason) console.info("[YOYO_DEBUG] teacher-console reason", reason);
    const session = getSession();
    if (!session || session.role !== "teacher") return false;
    const current = app.querySelector(".teacher-lite-shell, .real-dashboard, .real-shell");
    if (!current) return false;

    const teacher = getTeacher();
    if (!teacher) return false;

    const students = readJson(KEYS.students, []).filter((item) => item.teacherId === teacher.id);
    const progress = readJson(KEYS.progress, {});
    const state = getState();
    const summaries = students.map((student) => buildStudentSummary(student, teacher, progress[student.id] || {}));
    const filtered = filterStudents(summaries, state);
    const attentionStudents = [...summaries]
      .filter((item) => item.overallState.label !== "Excelente" || item.failedAttempts >= 3 || item.completedGames <= 2)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 2);

    const averagePercent = mean(filtered.map((item) => item.averagePercent));
    const activeToday = filtered.filter((item) => isToday(item.student.lastAccess) || isToday(item.gameRows[0]?.date)).length;
    const totalCompleted = filtered.reduce((sum, item) => sum + item.completedGames, 0);
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
    const welcomeMessage = shouldShowWelcome(teacher.id)
      ? `Bienvenida, ${teacher.name}. Tu clase ${teacher.code} esta lista para dar seguimiento a tus estudiantes.`
      : "";

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
            <div class="teacher-lite-actions">
              <button class="teacher-lite-btn ghost" type="button" data-lite-back-main>Volver al panel principal</button>
              <button class="teacher-lite-btn ghost" type="button" data-lite-copy-code>Copiar codigo</button>
              <button class="teacher-lite-btn primary" type="button" data-lite-export-course>Descargar Excel del curso</button>
              <button class="teacher-lite-btn ghost" type="button" data-lite-logout>Cerrar sesion</button>
            </div>
          </div>

          ${welcomeMessage ? `<div class="teacher-lite-toast">${escapeHtml(welcomeMessage)}</div>` : ""}
          ${state.toast ? `<div class="teacher-lite-toast">${escapeHtml(state.toast)}</div>` : ""}

          <div class="teacher-lite-summary">
            <article class="teacher-lite-card"><strong>${escapeHtml(teacher.code)}</strong><span>Codigo de clase</span></article>
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
                  <label class="teacher-lite-field">Seccion
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
                  <label class="teacher-lite-field">Atencion
                    <select data-lite-filter="support">
                      <option value="all" ${state.support === "all" ? "selected" : ""}>Todos</option>
                      <option value="support" ${state.support === "support" ? "selected" : ""}>Necesitan apoyo</option>
                    </select>
                  </label>
                </div>

                <div class="teacher-lite-list" style="margin-top:14px;">
                  ${filtered.length ? filtered.map((item) => `
                      <article class="teacher-lite-student">
                        <div class="teacher-lite-student-main">
                          <div class="teacher-lite-avatar">${escapeHtml(item.student.name.slice(0, 1).toUpperCase())}</div>
                          <div class="teacher-lite-student-copy">
                            <strong>${escapeHtml(item.student.name)}</strong>
                            <small>Seccion: ${escapeHtml(item.section)}</small>
                            <small>Ultimo acceso: ${escapeHtml(item.lastAccess)}</small>
                            <small>Ultimo temario: ${escapeHtml(item.lastTopicSummary?.title || "Sin actividad")}</small>
                          </div>
                        </div>
                        <div class="teacher-lite-topic-summary">
                          <strong>${escapeHtml(item.lastTopicSummary?.title || "Sin actividad")}</strong>
                          <div class="teacher-lite-bars">
                            ${["C1", "C2", "C3"].map((key) => {
                              const value = item.lastTopicSummary?.competencies?.[key] || 0;
                              const tone = value >= 80 ? "" : value >= 50 ? "warn" : "danger";
                              return `<div class="teacher-lite-bar"><label>${key}</label><div class="teacher-lite-bar-track"><i class="${tone}" style="width:${value}%"></i></div><span>${value}/100</span></div>`;
                            }).join("")}
                            <div class="teacher-lite-bar">
                              <label>Prom.</label>
                              <div class="teacher-lite-bar-track"><i class="${item.lastTopicSummary?.progress >= 80 ? "" : item.lastTopicSummary?.progress >= 50 ? "warn" : "danger"}" style="width:${item.lastTopicSummary?.progress || 0}%"></i></div>
                              <span>${item.lastTopicSummary?.progress || 0}/100</span>
                            </div>
                          </div>
                        </div>
                        <div class="teacher-lite-student-side">
                          <span class="teacher-lite-badge ${item.overallState.tone}">${item.overallState.label}</span>
                          <div class="teacher-lite-actions" style="margin-top:8px;justify-content:flex-start;">
                            <button class="teacher-lite-btn primary" type="button" data-lite-download-student="${item.student.id}">Descargar progreso</button>
                          </div>
                      </div>
                    </article>
                  `).join("") : `<div class="teacher-lite-empty">No hay estudiantes para ese filtro.</div>`}
                </div>
              </section>

              <section class="teacher-lite-panel">
              <div class="teacher-lite-kicker">Estudiantes que necesitan atencion</div>
              <div class="teacher-lite-attention-list">
                ${attentionStudents.length ? attentionStudents.map((item) => `
                  <article class="teacher-lite-attention-item">
                    <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
                      <div>
                        <strong>${escapeHtml(item.student.name)}</strong>
                        <div class="teacher-lite-placeholder">${escapeHtml(item.section)} · ${item.averagePercent}% general</div>
                      </div>
                      <span class="teacher-lite-badge ${item.overallState.tone}">${item.overallState.label}</span>
                    </div>
                    <div class="teacher-lite-placeholder">Refuerzo sugerido: ${escapeHtml(item.weakestTopic?.title || "Temario inicial")}.</div>
                  </article>
                `).join("") : `<div class="teacher-lite-empty">No hay alertas en este momento.</div>`}
              </div>
              </section>
            </div>

              <section class="teacher-lite-panel">
                <div class="teacher-lite-kicker" style="margin-top:16px;">Vista ligera del seguimiento</div>
                <div class="teacher-lite-empty-panel">
                  <p class="teacher-lite-placeholder" style="margin:0">En esta pantalla solo se muestra el resumen del ultimo temario trabajado con sus notas C1, C2, C3 y promedio. El detalle completo del estudiante se genera al usar <strong>Descargar progreso</strong>.</p>
                </div>
              </section>
          </div>
        </div>
      </section>
    `;

    bindLiteTeacher(teacher, summaries);
    return true;
  }

  function bindLiteTeacher(teacher, summaries) {
    console.count("[YOYO_DEBUG] teacher-console bindLiteTeacher");
    app.querySelector("[data-lite-copy-code]")?.addEventListener("click", async () => {
      await copyText(teacher.code);
      showToast("Codigo copiado.");
    });

    app.querySelector("[data-lite-copy-link]")?.addEventListener("click", async () => {
      await copyText(getShareLink());
      showToast("Link de clase copiado.");
    });

    app.querySelector("[data-lite-export-course]")?.addEventListener("click", () => {
      const currentState = getState();
      const rows = buildExcelRows(filterStudents(summaries, currentState), currentState);
      exportRowsToXlsx(rows, `reporte_curso_${teacher.code}.xlsx`);
      showToast("Excel del curso descargado.");
    });

    app.querySelector("[data-lite-logout]")?.addEventListener("click", () => {
      try { localStorage.removeItem(KEYS.session); } catch {}
      window.location.reload();
    });

    app.querySelector("[data-lite-back-main]")?.addEventListener("click", () => {
      setState({ student: "all", section: "all", topic: "all", competency: "all", status: "all", support: "all" });
      renderLiteTeacher();
    });

    app.querySelectorAll("[data-lite-filter]").forEach((select) => {
      select.addEventListener("change", () => {
        setState({ [select.dataset.liteFilter]: select.value });
        renderLiteTeacher();
      });
    });

    app.querySelectorAll("[data-lite-download-student]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = summaries.find((item) => item.student.id === button.dataset.liteDownloadStudent);
        if (!target) return;
        exportRowsToXlsx(buildStudentProgressRows(target), `reporte_${target.student.name.replace(/\s+/g, "_")}.xlsx`);
        showToast(`Progreso descargado de ${target.student.name}.`);
      });
    });
  }

  function mount(reason) {
    console.count("[YOYO_DEBUG] teacher-console mount");
    const session = getSession();
    if (!session || session.role !== "teacher") return false;
    return renderLiteTeacher(reason || "direct-mount");
  }

  window.__YOYO_TEACHER_LITE_RENDER = function (reason) {
    console.count("[YOYO_DEBUG] teacher-console external render");
    return renderLiteTeacher(reason || "external");
  };

  mount("initial-load");
})();
