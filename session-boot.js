(function () {
  const SESSION_KEYS = ["yoyo_rg_x"];
  const HANDOFF_KEY = "yoyo_auth_handoff";
  const STALE_UI_KEYS = [
    "yoyo_rg_u",
    "yoyo_classroom_mgmt_v2",
    "yoyo_owner_teacher_id",
  ];

  let restored = false;
  try {
    const handoff = sessionStorage.getItem(HANDOFF_KEY);
    if (handoff) {
      localStorage.setItem("yoyo_rg_x", handoff);
      sessionStorage.removeItem(HANDOFF_KEY);
      restored = true;
    }
  } catch {}

  if (restored) {
    STALE_UI_KEYS.forEach((key) => {
      try { localStorage.removeItem(key); } catch {}
      try { sessionStorage.removeItem(key); } catch {}
    });
    try {
      const url = new URL(window.location.href);
      let changed = false;
      if (url.searchParams.get("owner") === "1") {
        url.searchParams.delete("owner");
        changed = true;
      }
      if (url.searchParams.get("auth") === "1") {
        url.searchParams.delete("auth");
        changed = true;
      }
      if (changed) {
        const next = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "") + url.hash;
        window.history.replaceState({}, "", next);
      }
    } catch {}
    return;
  }

  SESSION_KEYS.forEach((key) => {
    try { localStorage.removeItem(key); } catch {}
    try { sessionStorage.removeItem(key); } catch {}
  });

  STALE_UI_KEYS.forEach((key) => {
    try { localStorage.removeItem(key); } catch {}
    try { sessionStorage.removeItem(key); } catch {}
  });

  try {
    const url = new URL(window.location.href);
    let changed = false;
    if (url.searchParams.get("owner") === "1") {
      url.searchParams.delete("owner");
      changed = true;
    }
    if (url.searchParams.get("auth") === "1") {
      url.searchParams.delete("auth");
      changed = true;
    }
    if (changed) {
      const next = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "") + url.hash;
      window.history.replaceState({}, "", next);
    }
  } catch {}
})();
