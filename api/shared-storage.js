const SHARED_KEYS = new Set([
  "yoyo_rg_t",
  "yoyo_rg_s",
  "yoyo_rg_p",
  "yoyo_rg_u",
  "yoyo_classroom_mgmt_v2",
  "yoyo_owner_teacher_id",
  "yoyo_rg_mail_outbox",
]);

globalThis.__YOYO_VERCEL_SHARED__ = globalThis.__YOYO_VERCEL_SHARED__ || {
  version: 1,
  updatedAt: 0,
  keys: {},
};

function setHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
}

export default function handler(req, res) {
  setHeaders(res);

  if (req.method === "GET") {
    return res.status(200).json(globalThis.__YOYO_VERCEL_SHARED__);
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "method-not-allowed" });
  }

  const updates = req.body?.updates;
  if (!updates || typeof updates !== "object") {
    return res.status(400).json({ error: "invalid-updates" });
  }

  Object.entries(updates).forEach(([key, value]) => {
    if (!SHARED_KEYS.has(key)) return;
    if (value === null || typeof value === "undefined") {
      delete globalThis.__YOYO_VERCEL_SHARED__.keys[key];
      return;
    }
    globalThis.__YOYO_VERCEL_SHARED__.keys[key] = String(value);
  });

  globalThis.__YOYO_VERCEL_SHARED__.updatedAt = Date.now();
  return res.status(200).json(globalThis.__YOYO_VERCEL_SHARED__);
}
