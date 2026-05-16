(function () {
  const PROGRESS_KEY = "yoyo_rg_p";

  const TOPICS = [
    { id: "carta", title: "La Carta de Agradecimiento" },
    { id: "receta", title: "La Receta" },
    { id: "expositivo", title: "El Texto Expositivo" },
    { id: "comentario", title: "El Comentario" },
    { id: "anuncio", title: "El Anuncio Radial" },
    { id: "oda", title: "La Oda" }
  ];

  const TOPIC_TITLES = Object.fromEntries(TOPICS.map((topic) => [topic.id, topic.title]));

  const GENERIC_COMPETENCIES = {
    1: ["C1", "C2"],
    2: ["C1"],
    3: ["C2", "C3"],
    4: ["C1", "C2"],
    5: ["C1", "C3"],
    6: ["C1", "C2", "C3"],
    7: ["C1", "C2"],
    8: ["C1", "C2"],
    9: ["C2", "C3"],
    10: ["C1", "C2", "C3"]
  };

  const RADIAL_COMPETENCIES = {
    1: ["C1"], 2: ["C1"], 3: ["C1"], 4: ["C1", "C2"], 5: ["C2", "C3"],
    6: ["C1", "C2"], 7: ["C1", "C2"], 8: ["C1"], 9: ["C2"], 10: ["C1", "C2", "C3"]
  };

  const ODA_COMPETENCIES = {
    1: ["C1", "C2"], 2: ["C1", "C2"], 3: ["C1", "C2"], 4: ["C1", "C2"], 5: ["C1", "C2", "C3"],
    6: ["C1", "C2", "C3"], 7: ["C1", "C2"], 8: ["C1", "C2"], 9: ["C1", "C2"], 10: ["C1", "C2", "C3"]
  };

  const LEVEL_COUNTS = {
    anuncio: { 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 5, 7: 5, 8: 5, 9: 5, 10: 3 },
    oda: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 3 }
  };

  const GAME_TITLES = {
    1: "Ordena la estructura",
    2: "Completa con arrastre",
    3: "Clasifica por colores",
    4: "Memoria visual",
    5: "Detective del temario",
    6: "Cubos 3D",
    7: "Relaciona ideas",
    8: "Sopa de palabras",
    9: "Linea del tiempo",
    10: "Cierre final"
  };

  let syncing = false;

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, Number(value || 0) || 0));
  }

  function clamp100(value) {
    return Math.max(0, Math.min(100, Math.round(Number(value || 0) || 0)));
  }

  function mean(values) {
    return values.length ? clamp100(values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length) : 0;
  }

  function getActivityMeta(activityId, entry) {
    const match = String(activityId || "").match(/^([a-z]+)-(\d+)$/);
    const topicId = entry && entry.topicId ? entry.topicId : (match ? match[1] : "general");
    const number = match ? Number(match[2]) : 0;
    const competencies = Array.isArray(entry && entry.c) && entry.c.length
      ? entry.c
      : topicId === "anuncio"
        ? (RADIAL_COMPETENCIES[number] || GENERIC_COMPETENCIES[number] || ["C1"])
        : topicId === "oda"
          ? (ODA_COMPETENCIES[number] || GENERIC_COMPETENCIES[number] || ["C1"])
          : (GENERIC_COMPETENCIES[number] || ["C1"]);
    const levelCount = Math.max(1, Number(entry && entry.levelCount || (LEVEL_COUNTS[topicId] && LEVEL_COUNTS[topicId][number]) || 1) || 1);
    return {
      id: activityId,
      topicId,
      topicTitle: TOPIC_TITLES[topicId] || topicId,
      number,
      title: entry && entry.activityName ? entry.activityName : (GAME_TITLES[number] || "Actividad"),
      competencies,
      levelCount
    };
  }

  function normalizeCurrent(entry, meta) {
    const rawMax = Math.max(1, Number(entry && entry.rawMax || 10) || 10);
    const rawScore = Math.max(0, Math.min(rawMax, Number(entry && (Object.prototype.hasOwnProperty.call(entry, "rawScore") ? entry.rawScore : entry.score) || 0) || 0));
    const percent = entry && Object.prototype.hasOwnProperty.call(entry, "percent")
      ? clamp01(entry.percent)
      : clamp01(rawScore / rawMax);
    return {
      rawScore,
      rawMax,
      percent,
      score: rawScore,
      levelCount: meta.levelCount,
      updatedAt: entry && entry.updatedAt ? entry.updatedAt : new Date().toISOString()
    };
  }

  function buildAttempt(activityId, entry, meta) {
    const normalized = normalizeCurrent(entry || {}, meta);
    return {
      activityId,
      activityName: entry && entry.activityName ? entry.activityName : meta.title,
      topicId: meta.topicId,
      topicTitle: meta.topicTitle,
      level: `Juego ${meta.number || activityId}`,
      competencies: meta.competencies,
      points: normalized.rawScore,
      rawMax: normalized.rawMax,
      percent: Number(normalized.percent.toFixed(4)),
      proportionalScore: 0,
      date: entry && entry.updatedAt ? entry.updatedAt : new Date().toISOString(),
      status: entry && entry.status ? entry.status : (entry && entry.ok ? "Logrado" : normalized.rawScore > 0 ? "En progreso" : "Necesita refuerzo")
    };
  }

  function mergeHistory(history, attempt) {
    const list = Array.isArray(history) ? history.slice() : [];
    if (!attempt) return list;
    const last = list[list.length - 1];
    if (
      last &&
      last.activityId === attempt.activityId &&
      last.points === attempt.points &&
      last.rawMax === attempt.rawMax &&
      last.percent === attempt.percent &&
      last.date === attempt.date
    ) {
      return list;
    }
    list.push(attempt);
    return list.slice(-40);
  }

  function normalizeEntry(activityId, incoming, previous) {
    const meta = getActivityMeta(activityId, incoming || previous || {});
    const prevNorm = previous ? normalizeCurrent(previous, meta) : null;
    const nextNorm = normalizeCurrent(incoming || previous || {}, meta);
    const nextIsBetter = !prevNorm || nextNorm.percent > prevNorm.percent || (nextNorm.percent === prevNorm.percent && nextNorm.rawScore >= prevNorm.rawScore);
    const best = nextIsBetter ? nextNorm : prevNorm;
    const source = nextIsBetter ? incoming : previous;
    const history = mergeHistory(previous && previous.history, incoming ? buildAttempt(activityId, incoming, meta) : null);
    return {
      ...(previous || {}),
      ...(incoming || {}),
      ...(source || {}),
      topicId: meta.topicId,
      topicTitle: meta.topicTitle,
      activityName: source && source.activityName ? source.activityName : meta.title,
      c: meta.competencies,
      levelCount: meta.levelCount,
      rawScore: best.rawScore,
      rawMax: best.rawMax,
      percent: Number(best.percent.toFixed(4)),
      score: best.rawScore,
      bestScore: best.rawScore,
      bestPercent: Number(best.percent.toFixed(4)),
      updatedAt: nextIsBetter ? nextNorm.updatedAt : (previous && previous.updatedAt) || nextNorm.updatedAt,
      attempts: Math.max(Number(incoming && incoming.attempts || 0), Number(previous && previous.attempts || 0), history.length),
      ok: Boolean((nextIsBetter ? incoming && incoming.ok : previous && previous.ok) || (previous && previous.ok)),
      status: nextIsBetter
        ? (incoming && incoming.status) || (incoming && incoming.ok ? "Logrado" : best.rawScore > 0 ? "En progreso" : "Necesita refuerzo")
        : (previous && previous.status) || (previous && previous.ok ? "Logrado" : best.rawScore > 0 ? "En progreso" : "Necesita refuerzo"),
      history
    };
  }

  function normalizeProgressStore(nextStore, previousStore) {
    const result = {};
    const current = previousStore && typeof previousStore === "object" ? previousStore : {};
    const incoming = nextStore && typeof nextStore === "object" ? nextStore : {};
    const studentIds = new Set([...Object.keys(current), ...Object.keys(incoming)]);
    studentIds.forEach((studentId) => {
      const prevStudent = current[studentId] && typeof current[studentId] === "object" ? current[studentId] : {};
      const nextStudent = incoming[studentId] && typeof incoming[studentId] === "object" ? incoming[studentId] : {};
      const merged = { ...prevStudent };
      Object.keys(nextStudent).forEach((activityId) => {
        merged[activityId] = normalizeEntry(activityId, nextStudent[activityId], prevStudent[activityId]);
      });
      result[studentId] = merged;
    });
    return result;
  }

  function topicTemplate(topic) {
    return {
      id: topic.id,
      title: topic.title,
      completed: 0,
      average: 0,
      competencies: { C1: 0, C2: 0, C3: 0 },
      completedLevels: { C1: {}, C2: {}, C3: {} }
    };
  }

  function computeTopicMetrics(studentProgress) {
    const progress = studentProgress && typeof studentProgress === "object" ? studentProgress : {};
    const totals = {};
    TOPICS.forEach((topic) => {
      const record = topicTemplate(topic);
      const maxLevels = { C1: 0, C2: 0, C3: 0 };
      for (let number = 1; number <= 10; number += 1) {
        const meta = getActivityMeta(`${topic.id}-${number}`, {});
        meta.competencies.forEach((key) => {
          maxLevels[key] += meta.levelCount;
        });
      }
      Object.entries(progress).forEach(([activityId, entry]) => {
        const meta = getActivityMeta(activityId, entry);
        if (meta.topicId !== topic.id) return;
        if (entry && entry.ok) record.completed += 1;
        const percent = clamp01(entry && (Object.prototype.hasOwnProperty.call(entry, "bestPercent") ? entry.bestPercent : entry.percent));
        meta.competencies.forEach((key) => {
          const valuePerLevel = 100 / Math.max(1, maxLevels[key] || 1);
          const proportionalScore = Number((valuePerLevel * meta.levelCount * percent).toFixed(2));
          record.completedLevels[key][`${activityId}_bundle`] = {
            rawScore: Number(entry && (Object.prototype.hasOwnProperty.call(entry, "bestScore") ? entry.bestScore : entry.score) || 0),
            rawMax: Number(entry && entry.rawMax || 10),
            percent,
            proportionalScore,
            levelCount: meta.levelCount
          };
        });
      });
      ["C1", "C2", "C3"].forEach((key) => {
        record.competencies[key] = clamp100(
          Object.values(record.completedLevels[key]).reduce((sum, item) => sum + Number(item && item.proportionalScore || 0), 0)
        );
      });
      record.average = clamp100((record.competencies.C1 + record.competencies.C2 + record.competencies.C3) / 3);
      totals[topic.id] = record;
    });
    return totals;
  }

  function buildHistoryRows(student, studentProgress) {
    const progress = studentProgress && typeof studentProgress === "object" ? studentProgress : {};
    const topicMetrics = computeTopicMetrics(progress);
    const rows = [];
    Object.entries(progress).forEach(([activityId, entry]) => {
      const meta = getActivityMeta(activityId, entry);
      const attempts = Array.isArray(entry && entry.history) && entry.history.length
        ? entry.history
        : [buildAttempt(activityId, entry || {}, meta)];
      attempts.forEach((attempt) => {
        const topic = topicMetrics[meta.topicId] || topicTemplate({ id: meta.topicId, title: meta.topicTitle });
        meta.competencies.forEach((competency) => {
          const value = topic.completedLevels[competency][`${activityId}_bundle`];
          rows.push({
            studentId: student && student.id ? student.id : "",
            studentName: student && student.name ? student.name : "",
            classCode: student && student.code ? student.code : "",
            section: student && student.section ? student.section : "",
            topicId: meta.topicId,
            topicTitle: meta.topicTitle,
            activityId,
            activityName: meta.title,
            level: attempt.level,
            competency,
            points: Number(attempt.points || 0),
            percent: Number(((attempt.percent || 0) * 100).toFixed(2)),
            proportionalScore: Number(value && value.proportionalScore || 0),
            topicC1: topic.competencies.C1,
            topicC2: topic.competencies.C2,
            topicC3: topic.competencies.C3,
            topicAverage: topic.average,
            date: attempt.date || entry && entry.updatedAt || "",
            status: attempt.status || entry && entry.status || "En progreso"
          });
        });
      });
    });
    return rows.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }

  function buildBestActivities(progress) {
    const store = progress && typeof progress === "object" ? progress : {};
    return Object.entries(store).map(([activityId, entry]) => {
      const meta = getActivityMeta(activityId, entry);
      const bestPercent = clamp01(entry && (Object.prototype.hasOwnProperty.call(entry, "bestPercent") ? entry.bestPercent : entry.percent));
      const levelCount = meta.levelCount;
      const completedLevels = Math.max(0, Math.min(levelCount, Math.round(bestPercent * levelCount)));
      return {
        activityId,
        activityName: meta.title,
        topicId: meta.topicId,
        topicTitle: meta.topicTitle,
        competencies: meta.competencies,
        bestScore: Number(entry && (Object.prototype.hasOwnProperty.call(entry, "bestScore") ? entry.bestScore : entry.score) || 0),
        bestPercent: Number((bestPercent * 100).toFixed(2)),
        attempts: Number(entry && entry.attempts || 0),
        levelCount,
        completedLevels,
        pendingLevels: Math.max(0, levelCount - completedLevels),
        status: entry && entry.status ? entry.status : (entry && entry.ok ? "Logrado" : bestPercent > 0 ? "En progreso" : "Necesita refuerzo"),
        date: entry && entry.updatedAt ? entry.updatedAt : ""
      };
    }).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }

  function summarizeStudentProgress(student, progress) {
    const metrics = computeTopicMetrics(progress);
    const topicCards = TOPICS.map((topic) => {
      const card = metrics[topic.id] || topicTemplate(topic);
      const weakest = Object.entries(card.competencies).sort((a, b) => a[1] - b[1])[0] || ["C1", 0];
      return {
        id: topic.id,
        title: topic.title,
        progress: card.average,
        completed: card.completed,
        total: 10,
        state: card.average >= 80 ? { label: "Excelente", tone: "good" } : card.average >= 50 ? { label: "En progreso", tone: "warn" } : { label: "Necesita apoyo", tone: "danger" },
        competencies: card.competencies,
        recommendation: weakest[1] >= 80 ? `Buen avance en ${weakest[0]} de ${topic.title}.` : weakest[1] >= 50 ? `Conviene practicar ${weakest[0]} en ${topic.title}.` : `Necesita refuerzo en ${weakest[0]} de ${topic.title}.`
      };
    });
    const historyRows = buildHistoryRows(student, progress);
    const bestActivities = buildBestActivities(progress);
    const completedGames = Object.values(progress || {}).filter((entry) => entry && entry.ok).length;
    const overallCompetencies = {
      C1: mean(topicCards.map((item) => item.competencies.C1)),
      C2: mean(topicCards.map((item) => item.competencies.C2)),
      C3: mean(topicCards.map((item) => item.competencies.C3))
    };
    const averagePercent = clamp100((overallCompetencies.C1 + overallCompetencies.C2 + overallCompetencies.C3) / 3);
    const lastRow = historyRows[0] || null;
    return {
      topicCards,
      historyRows,
      overallCompetencies,
      averagePercent,
      totalPoints: averagePercent,
      completedGames,
      pendingGames: Math.max(0, 60 - completedGames),
      pendingLevels: bestActivities.reduce((sum, item) => sum + item.pendingLevels, 0),
      failedAttempts: historyRows.filter((row) => row.status !== "Logrado").length,
      bestActivities,
      lastRow
    };
  }

  function installProgressPatch() {
    if (window.__YOYO_PROGRESS_PATCHED__) return;
    window.__YOYO_PROGRESS_PATCHED__ = true;
    const originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (key, value) {
      if (syncing || key !== PROGRESS_KEY) return originalSetItem(key, value);
      syncing = true;
      try {
        const nextStore = typeof value === "string" ? JSON.parse(value || "{}") : value;
        const prevStore = readJson(PROGRESS_KEY, {});
        const normalized = normalizeProgressStore(nextStore, prevStore);
        return originalSetItem(key, JSON.stringify(normalized));
      } catch {
        return originalSetItem(key, value);
      } finally {
        syncing = false;
      }
    };

    try {
      const current = readJson(PROGRESS_KEY, {});
      const normalized = normalizeProgressStore(current, current);
      originalSetItem(PROGRESS_KEY, JSON.stringify(normalized));
    } catch {}
  }

  window.__YOYO_PROGRESS__ = {
    normalizeProgressStore,
    getActivityMeta,
    computeTopicMetrics,
    summarizeStudentProgress,
    buildHistoryRows,
    buildBestActivities
  };

  installProgressPatch();
})();
