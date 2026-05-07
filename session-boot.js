(function () {
  const SESSION_KEYS = ["yoyo_rg_x"];

  SESSION_KEYS.forEach((key) => {
    try { localStorage.removeItem(key); } catch {}
    try { sessionStorage.removeItem(key); } catch {}
  });

  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("owner") === "1") {
      url.searchParams.delete("owner");
      const next = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "") + url.hash;
      window.history.replaceState({}, "", next);
    }
  } catch {}
})();
