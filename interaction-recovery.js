(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const K = {
    t: "yoyo_rg_t",
    s: "yoyo_rg_s",
    x: "yoyo_rg_x",
    u: "yoyo_rg_u",
    p: "yoyo_rg_p",
  };

  let memoryFirst = null;

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

  function session() {
    return read(K.x, null);
  }

  function studentId() {
    const x = session();
    return x && x.role === "student" ? x.id : "";
  }

  function normalize(text) {
    return String(text || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  }

  function uiState(id) {
    const all = read(K.u, {});
    return all[id] || { topic: "", act: "" };
  }

  function setUI(id, nextState) {
    const all = read(K.u, {});
    all[id] = { ...(all[id] || {}), ...nextState };
    write(K.u, all);
  }

  function clearActivityProgress(id, activityId) {
    const progress = read(K.p, {});
    if (progress[id] && progress[id][activityId]) {
      delete progress[id][activityId];
      write(K.p, progress);
    }
  }

  function clearOdaGameState(id, activityId) {
    const map = {
      "oda-1": "yoyo_oda_order_state",
      "oda-2": "yoyo_oda_fill_state",
      "oda-3": "yoyo_oda_classify_state",
      "oda-4": "yoyo_oda_memory_state",
      "oda-5": "yoyo_oda_detective_state",
      "oda-6": "yoyo_oda_cubes_state",
    };
    const key = map[activityId];
    if (!key) return;
    const all = read(key, {});
    if (all[id]) {
      delete all[id];
      write(key, all);
    }
  }

  function teachers() {
    return read(K.t, []);
  }

  function students() {
    return read(K.s, []);
  }

  function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function cubes(ok, bad) {
    const colors = [
      "linear-gradient(135deg,#7b36eb,#a756f7)",
      "linear-gradient(135deg,#1f70ff,#49b5ff)",
      "linear-gradient(135deg,#ff9b54,#ffbe3d)",
      "linear-gradient(135deg,#33c48d,#7de2b8)",
      "linear-gradient(135deg,#ff758c,#ff9ab1)",
      "linear-gradient(135deg,#6a89cc,#b8c6ff)",
    ];
    return shuffle([
      ...ok.map((label, index) => ({ l: label, ok: true, c: colors[index % colors.length] })),
      ...bad.map((label, index) => ({ l: label, ok: false, c: colors[(index + 3) % colors.length] })),
    ]);
  }

  function baseTopicData(id) {
    const data = {
      carta: {
        order: ["Saludo", "Agradecimiento", "Mensaje principal", "Despedida", "Firma"],
        fill: { b: "Escribo para", m: " por tu", e: ".", ans: ["agradecerte", "ayuda"], ex: ["receta", "anuncio"] },
        classify: { g: ["Carta", "No carta"], it: [{ l: "Fecha", g: "Carta" }, { l: "Firma", g: "Carta" }, { l: "Ingredientes", g: "No carta" }, { l: "Titular", g: "No carta" }] },
        memory: ["Saludo", "Firma", "Despedida", "Gratitud"],
        target: { ok: "Gracias por explicarme con paciencia.", o: ["Gracias por explicarme con paciencia.", "No quiero escribir.", "Hazlo tu."] },
        cubes: cubes(["SALUDO", "FIRMA", "GRATITUD"], ["RECETA", "RADIO", "PLANETA"]),
        match: ["SALUDO", "FIRMA", "GRATITUD"],
        word: { a: ["gratitud", "saludo", "firma"], e: ["sarten", "radio", "cuento"] },
        timeline: ["Pienso en la persona", "Escribo el saludo", "Agradezco con detalles", "Cierro con afecto"],
        final: { ok: "Escribir una carta clara, respetuosa y afectuosa.", o: ["Escribir una carta clara, respetuosa y afectuosa.", "Mezclar pasos sin orden.", "Gritar el mensaje."] },
      },
      receta: {
        order: ["Ingredientes", "Lavar", "Mezclar", "Servir", "Limpiar"],
        fill: { b: "Primero debo", m: " y luego", e: " los ingredientes.", ans: ["lavar", "mezclar"], ex: ["correr", "gritar"] },
        classify: { g: ["Receta", "No receta"], it: [{ l: "Ingredientes", g: "Receta" }, { l: "Paso 1", g: "Receta" }, { l: "Opinion", g: "No receta" }, { l: "Firma", g: "No receta" }] },
        memory: ["Ingredientes", "Pasos", "Medidas", "Servir"],
        target: { ok: "Lavar las manos antes de cocinar.", o: ["Lavar las manos antes de cocinar.", "Jugar con el fuego.", "Correr en la cocina."] },
        cubes: cubes(["PASOS", "MEZCLAR", "INGREDIENTES"], ["OPINION", "FIRMA", "CARTA"]),
        match: ["INGREDIENTES", "PASOS", "MEDIDAS"],
        word: { a: ["ingredientes", "pasos", "medidas"], e: ["poema", "firma", "debate"] },
        timeline: ["Busco utensilios", "Organizo ingredientes", "Sigo pasos", "Sirvo el plato"],
        final: { ok: "Seguir el orden y cuidar la higiene.", o: ["Seguir el orden y cuidar la higiene.", "Olvidar los ingredientes.", "Saltar los pasos."] },
      },
      expositivo: {
        order: ["Titulo", "Subtitulo", "Datos", "Explicacion", "Cierre"],
        fill: { b: "Un texto expositivo presenta", m: " y", e: " para informar.", ans: ["datos", "explicaciones"], ex: ["saltos", "ingredientes"] },
        classify: { g: ["Dato", "Opinion"], it: [{ l: "La Tierra gira alrededor del Sol", g: "Dato" }, { l: "La ciencia es aburrida", g: "Opinion" }, { l: "La Luna refleja luz", g: "Dato" }, { l: "Los planetas son tristes", g: "Opinion" }] },
        memory: ["Dato", "Subtitulo", "Titulo", "Explicacion"],
        target: { ok: "La Tierra gira alrededor del Sol.", o: ["La Tierra gira alrededor del Sol.", "El Sol esta triste.", "Los oceanos hablan."] },
        cubes: cubes(["DATOS", "SUBTITULO", "EXPLICAR"], ["FIRMA", "INGREDIENTE", "DESPEDIDA"]),
        match: ["DATOS", "SUBTITULO", "EXPLICAR"],
        word: { a: ["dato", "explicacion", "subtitulo"], e: ["firma", "azucar", "despedida"] },
        timeline: ["Busco informacion", "Selecciono datos", "Explico el tema", "Comparto resultados"],
        final: { ok: "Explicar con claridad usando informacion real.", o: ["Explicar con claridad usando informacion real.", "Escribir sin datos.", "Inventar sin revisar."] },
      },
      comentario: {
        order: ["Opinion", "Razon", "Ejemplo", "Cierre respetuoso"],
        fill: { b: "Mi comentario debe ser", m: " y", e: " para dialogar mejor.", ans: ["claro", "respetuoso"], ex: ["duro", "desordenado"] },
        classify: { g: ["Respetuoso", "Irrespetuoso"], it: [{ l: "Entiendo tu idea, pero pienso distinto", g: "Respetuoso" }, { l: "Eso es tonto", g: "Irrespetuoso" }, { l: "Buen punto, agregaria un ejemplo", g: "Respetuoso" }, { l: "Tu opinion no vale", g: "Irrespetuoso" }] },
        memory: ["Opinion", "Razon", "Respeto", "Ejemplo"],
        target: { ok: "Me gusto porque el personaje resolvio el problema con respeto.", o: ["Me gusto porque el personaje resolvio el problema con respeto.", "No sirve.", "Da igual todo."] },
        cubes: cubes(["OPINION", "RAZON", "RESPETO"], ["SARTEN", "RADIO", "FIRMA"]),
        match: ["OPINION", "RAZON", "RESPETO"],
        word: { a: ["opinion", "argumento", "respeto"], e: ["ingrediente", "despedida", "subtitulo"] },
        timeline: ["Leo el texto", "Pienso mi postura", "Escribo razones", "Comparto con respeto"],
        final: { ok: "Opinar con respeto, razones y ejemplos.", o: ["Opinar con respeto, razones y ejemplos.", "Criticar sin explicar.", "Hablar sin escuchar."] },
      },
      anuncio: {
        order: ["Apertura", "Mensaje", "Datos", "Invitacion", "Cierre"],
        fill: { b: "Un anuncio radial debe", m: " y", e: " al publico.", ans: ["informar", "motivar"], ex: ["callar", "ocultar"] },
        classify: { g: ["Anuncio", "No anuncio"], it: [{ l: "Invitacion final", g: "Anuncio" }, { l: "Datos del evento", g: "Anuncio" }, { l: "Ingredientes", g: "No anuncio" }, { l: "Firma personal", g: "No anuncio" }] },
        memory: ["Mensaje", "Voz", "Invitacion", "Cierre"],
        target: { ok: "Ven a la jornada de reciclaje este jueves a las 10.", o: ["Ven a la jornada de reciclaje este jueves a las 10.", "No vengas.", "No recuerdo la hora."] },
        cubes: cubes(["VOZ", "MENSAJE", "INVITACION"], ["FIRMA", "RECETA", "POEMA"]),
        match: ["MENSAJE", "VOZ", "INVITACION"],
        word: { a: ["mensaje", "voz", "invitacion"], e: ["despedida", "ingrediente", "subtitulo"] },
        timeline: ["Pienso el publico", "Redacto el mensaje", "Practico la voz", "Presento el anuncio"],
        final: { ok: "Comunicar con entusiasmo y datos claros.", o: ["Comunicar con entusiasmo y datos claros.", "Hablar sin objetivo.", "Olvidar el publico."] },
      },
    };

    if (id === "oda") {
      return {
        order: ["Titulo de la oda", "Objeto admirado", "Cualidades", "Emocion poetica", "Cierre poetico"],
        fill: { b: "Una oda expresa", m: " hacia", e: " usando lenguaje poetico.", ans: ["admiracion", "algo especial"], ex: ["receta", "instrucciones"] },
        classify: { g: ["Lenguaje de oda", "No es oda"], it: [{ l: "Belleza y admiracion", g: "Lenguaje de oda" }, { l: "Versos de elogio", g: "Lenguaje de oda" }, { l: "Lista de compras", g: "No es oda" }, { l: "Pasos de cocina", g: "No es oda" }] },
        memory: ["Oda", "Verso", "Admiracion", "Poeta"],
        target: { ok: "Oh naturaleza, inspiras mi alegria cada manana.", o: ["Oh naturaleza, inspiras mi alegria cada manana.", "Agrega dos tazas de agua.", "La clase empieza a las ocho."] },
        cubes: cubes(["ODA", "VERSO", "ELOGIO"], ["RECETA", "RADIO", "FIRMA"]),
        match: ["ODA", "VERSO", "ELOGIO"],
        word: { a: ["oda", "verso", "elogio"], e: ["sarten", "radio", "firma"] },
        timeline: ["Elijo lo que admiro", "Pienso sus cualidades", "Escribo versos", "Cierro con emocion"],
        final: { ok: "Expresar admiracion con versos y lenguaje poetico.", o: ["Expresar admiracion con versos y lenguaje poetico.", "Dar instrucciones sin emocion.", "Escribir datos sueltos sin ritmo."] },
      };
    }

    return data[id];
  }

  function makeTopic(id) {
    const d = baseTopicData(id);
    return {
      id,
      a: [
        { id: `${id}-1`, topicId: id, n: 1, k: "order", c: ["C1", "C2"], items: shuffle(d.order), ok: d.order },
        { id: `${id}-2`, topicId: id, n: 2, k: "dropfill", c: ["C1"], ans: d.fill.ans },
        { id: `${id}-3`, topicId: id, n: 3, k: "classify", c: ["C2", "C3"], g: d.classify.g, it: d.classify.it },
        { id: `${id}-4`, topicId: id, n: 4, k: "memory", c: ["C1", "C2"] },
        { id: `${id}-5`, topicId: id, n: 5, k: "target", c: ["C1", "C3"], ok: d.target.ok },
        { id: `${id}-6`, topicId: id, n: 6, k: "cubes", c: ["C1", "C2", "C3"], ok: d.cubes.filter((i) => i.ok).map((i) => i.l) },
        { id: `${id}-7`, topicId: id, n: 7, k: "pair", c: ["C1", "C2"], ok: [...d.match].sort() },
        { id: `${id}-8`, topicId: id, n: 8, k: "wordhunt", c: ["C1", "C2"], ok: [...d.word.a].sort() },
        { id: `${id}-9`, topicId: id, n: 9, k: "timeline", c: ["C2", "C3"], items: shuffle(d.timeline), ok: d.timeline },
        { id: `${id}-10`, topicId: id, n: 10, k: "choice", c: ["C1", "C2", "C3"], ok: d.final.ok },
      ],
    };
  }

  const TOPICS = ["carta", "receta", "expositivo", "comentario", "anuncio", "oda"].map(makeTopic);

  function findGame(id) {
    return TOPICS.flatMap((topic) => topic.a).find((activity) => activity.id === id);
  }

  function eq(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  function feedbackMessage(activity, ok, attempts) {
    if (ok) {
      return attempts === 1
        ? "Logro: completaste la actividad correctamente en el primer intento. Ahora explica con tus palabras por que tu respuesta es adecuada."
        : "Logro: corregiste tu respuesta y completaste la actividad. Revisa que cambio te ayudo a mejorar.";
    }
    return "Tu respuesta fue revisada. Observa con calma que parte necesitas mejorar y vuelve a intentarlo.";
  }

  function saveResult(sid, activity, ok) {
    const progress = read(K.p, {});
    progress[sid] = progress[sid] || {};
    const prev = progress[sid][activity.id] || { attempts: 0 };
    if (prev.ok) return prev;
    const attempts = Number(prev.attempts || 0) + 1;
    const score = ok ? (attempts === 1 ? 10 : 6) : 0;
    progress[sid][activity.id] = {
      ok,
      score,
      c: activity.c,
      msg: feedbackMessage(activity, ok, attempts),
      topicId: activity.topicId,
      attempts,
    };
    write(K.p, progress);
    return progress[sid][activity.id];
  }

  function fillSlot(slot, chip) {
    if (!slot || slot.dataset.fill === "1") return;
    slot.textContent = chip.dataset.w;
    slot.dataset.v = chip.dataset.w;
    slot.dataset.fill = "1";
    chip.classList.add("used");
    chip.disabled = true;
  }

  function evaluateGame(card, activity) {
    if (!activity) return false;
    if (activity.k === "order" || activity.k === "timeline") {
      const current = [...card.querySelectorAll("[data-dv]")].map((item) => item.dataset.dv);
      return eq(current, activity.ok);
    }
    if (activity.k === "dropfill") {
      const current = activity.ans.map((_, index) => card.querySelector(`[data-s="${index}"]`)?.dataset.v || "");
      return eq(current, activity.ans);
    }
    if (activity.k === "classify") {
      const placed = [...card.querySelectorAll("[data-z] [data-token]")];
      return placed.length === activity.it.length && activity.g.every((group) => {
        const zone = [...card.querySelectorAll(`[data-z="${group}"] [data-token]`)];
        const expected = activity.it.filter((item) => item.g === group).length;
        return zone.length === expected && zone.every((token) => token.dataset.group === group);
      });
    }
    if (activity.k === "memory") {
      return [...card.querySelectorAll("[data-m]")].every((item) => item.classList.contains("matched"));
    }
    if (activity.k === "target" || activity.k === "choice") {
      return card.querySelector(".selected")?.dataset.ch === activity.ok;
    }
    if (activity.k === "cubes") {
      const current = [...card.querySelectorAll("[data-cb].selected")].map((item) => item.dataset.cb).sort();
      return eq(current, [...activity.ok].sort());
    }
    if (activity.k === "pair") {
      const current = [...card.querySelectorAll("[data-pr].selected")].map((item) => item.dataset.pr).sort();
      return eq(current, [...activity.ok].sort());
    }
    if (activity.k === "wordhunt") {
      const current = [...card.querySelectorAll("[data-wp].selected")].map((item) => item.dataset.wp).sort();
      return eq(current, [...activity.ok].sort());
    }
    return false;
  }

  function handleClick(event) {
    const sid = studentId();
    const target = event.target;

    const topicButton = target.closest("[data-ot]");
    if (sid && topicButton) {
      event.preventDefault();
      event.stopPropagation();
      setUI(sid, { topic: topicButton.dataset.ot, act: "" });
      location.reload();
      return;
    }

    const openActivity = target.closest("[data-oa]");
    if (sid && openActivity) {
      event.preventDefault();
      event.stopPropagation();
      if ((openActivity.dataset.oa || "").startsWith("oda-")) {
        clearActivityProgress(sid, openActivity.dataset.oa);
        clearOdaGameState(sid, openActivity.dataset.oa);
      }
      setUI(sid, { act: openActivity.dataset.oa });
      location.reload();
      return;
    }

    const backTopics = target.closest("[data-bt]");
    if (sid && backTopics) {
      event.preventDefault();
      event.stopPropagation();
      setUI(sid, { topic: "", act: "" });
      location.reload();
      return;
    }

    const backActivities = target.closest("[data-ba]");
    if (sid && backActivities) {
      event.preventDefault();
      event.stopPropagation();
      setUI(sid, { act: "" });
      location.reload();
      return;
    }

    const backButton = target.closest("#bk");
    if (sid && backButton) {
      event.preventDefault();
      event.stopPropagation();
      const state = uiState(sid);
      if (state.act) setUI(sid, { act: "" });
      else if (state.topic) setUI(sid, { topic: "", act: "" });
      location.reload();
      return;
    }

    const logout = target.closest("#lo");
    if (logout) {
      event.preventDefault();
      event.stopPropagation();
      localStorage.removeItem(K.x);
      location.reload();
      return;
    }

    const choice = target.closest("[data-ch]");
    if (choice) {
      event.preventDefault();
      choice.parentElement?.querySelectorAll("[data-ch]").forEach((item) => item.classList.remove("selected"));
      choice.classList.add("selected");
      return;
    }

    const multi = target.closest("[data-cb],[data-wp],[data-pr]");
    if (multi) {
      event.preventDefault();
      multi.classList.toggle("selected");
      return;
    }

    const wordChip = target.closest("[data-w]");
    if (wordChip) {
      event.preventDefault();
      const slot = [...document.querySelectorAll('.slot:not([data-fill="1"])')][0];
      if (slot) fillSlot(slot, wordChip);
      return;
    }

    const memoryCard = target.closest("[data-m]");
    if (memoryCard) {
      event.preventDefault();
      if (memoryCard.classList.contains("matched")) return;
      memoryCard.classList.remove("hidden");
      memoryCard.classList.add("revealed");
      memoryCard.textContent = memoryCard.dataset.m;
      if (!memoryFirst) {
        memoryFirst = memoryCard;
        return;
      }
      if (memoryFirst === memoryCard) return;
      if (memoryFirst.dataset.m === memoryCard.dataset.m) {
        memoryFirst.classList.add("matched", "correct");
        memoryCard.classList.add("matched", "correct");
        memoryFirst = null;
        return;
      }
      const previous = memoryFirst;
      memoryFirst = null;
      setTimeout(() => {
        [previous, memoryCard].forEach((item) => {
          item.classList.remove("revealed");
          item.classList.add("hidden", "wrong");
          item.textContent = "?";
          setTimeout(() => item.classList.remove("wrong"), 350);
        });
      }, 450);
      return;
    }

    const verifyButton = target.closest("[data-v]");
    if (sid && verifyButton) {
      event.preventDefault();
      const card = verifyButton.closest("[data-g]");
      if (!card) return;
      const activity = findGame(card.dataset.g);
      const ok = evaluateGame(card, activity);
      saveResult(sid, activity, ok);
      location.reload();
    }
  }

  app.addEventListener("click", handleClick, true);

  const bindDirectNav = () => {
    const sid = studentId();
    if (!sid) return;
    app.querySelectorAll("[data-ot]").forEach((button) => {
      if (button.dataset.navReady === "1") return;
      button.dataset.navReady = "1";
      button.addEventListener("click", () => {
        setUI(sid, { topic: button.dataset.ot, act: "" });
        location.reload();
      });
    });
    app.querySelectorAll("[data-oa]").forEach((button) => {
      if (button.dataset.navReady === "1") return;
      button.dataset.navReady = "1";
      button.addEventListener("click", () => {
        if ((button.dataset.oa || "").startsWith("oda-")) {
          clearActivityProgress(sid, button.dataset.oa);
          clearOdaGameState(sid, button.dataset.oa);
        }
        setUI(sid, { act: button.dataset.oa });
        location.reload();
      });
    });
    app.querySelectorAll("[data-bt]").forEach((button) => {
      if (button.dataset.navReady === "1") return;
      button.dataset.navReady = "1";
      button.addEventListener("click", () => {
        setUI(sid, { topic: "", act: "" });
        location.reload();
      });
    });
    app.querySelectorAll("[data-ba]").forEach((button) => {
      if (button.dataset.navReady === "1") return;
      button.dataset.navReady = "1";
      button.addEventListener("click", () => {
        setUI(sid, { act: "" });
        location.reload();
      });
    });
    const back = app.querySelector("#bk");
    if (back && back.dataset.navReady !== "1") {
      back.dataset.navReady = "1";
      back.addEventListener("click", () => {
        const state = uiState(sid);
        if (state.act) setUI(sid, { act: "" });
        else if (state.topic) setUI(sid, { topic: "", act: "" });
        location.reload();
      });
    }
  };

  new MutationObserver(() => bindDirectNav()).observe(app, { childList: true, subtree: true });
  bindDirectNav();
})();
