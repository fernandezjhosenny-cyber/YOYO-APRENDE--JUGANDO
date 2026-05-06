from __future__ import annotations

import json
import mimetypes
import time
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Lock
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
PORT = 5500
STORAGE_FILE = ROOT / ".yoyo-shared-storage.json"
STORAGE_LOCK = Lock()
MANAGED_KEYS = {
    "yoyo_rg_t",
    "yoyo_rg_s",
    "yoyo_rg_p",
    "yoyo_rg_x",
    "yoyo_rg_u",
    "yoyo_classroom_mgmt_v2",
    "yoyo_owner_teacher_id",
    "yoyo_rg_mail_outbox",
}


def ensure_storage() -> None:
    if STORAGE_FILE.exists():
        return
    STORAGE_FILE.write_text(
        json.dumps({"version": 1, "updatedAt": 0, "keys": {}}, ensure_ascii=False),
        encoding="utf-8",
    )


def read_storage() -> dict:
    ensure_storage()
    try:
        raw = STORAGE_FILE.read_text(encoding="utf-8")
        data = json.loads(raw)
        if not isinstance(data, dict):
            raise ValueError("Invalid storage format")
        data.setdefault("version", 1)
        data.setdefault("updatedAt", 0)
        data.setdefault("keys", {})
        if not isinstance(data["keys"], dict):
            data["keys"] = {}
        return data
    except Exception:
        return {"version": 1, "updatedAt": 0, "keys": {}}


def write_storage(data: dict) -> dict:
    data["updatedAt"] = int(time.time() * 1000)
    STORAGE_FILE.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    return data


class YoyoHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, format: str, *args) -> None:
        return

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/shared-storage":
            self._send_json(read_storage())
            return
        if parsed.path == "/shared-storage-bootstrap.js":
            payload = "window.__YOYO_SHARED_STATE__ = " + json.dumps(read_storage(), ensure_ascii=False) + ";"
            self._send_bytes(payload.encode("utf-8"), "application/javascript; charset=utf-8")
            return
        super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path != "/api/shared-storage":
            self.send_error(HTTPStatus.NOT_FOUND, "Not Found")
            return

        length = int(self.headers.get("Content-Length", "0") or 0)
        raw_body = self.rfile.read(length).decode("utf-8") if length else "{}"
        try:
            payload = json.loads(raw_body or "{}")
        except json.JSONDecodeError:
            self._send_json({"error": "invalid-json"}, status=HTTPStatus.BAD_REQUEST)
            return

        updates = payload.get("updates", {})
        if not isinstance(updates, dict):
            self._send_json({"error": "invalid-updates"}, status=HTTPStatus.BAD_REQUEST)
            return

        with STORAGE_LOCK:
            state = read_storage()
            for key, value in updates.items():
                if key not in MANAGED_KEYS:
                    continue
                if value is None:
                    state["keys"].pop(key, None)
                else:
                    state["keys"][key] = str(value)
            state = write_storage(state)

        self._send_json(state)

    def guess_type(self, path: str) -> str:
        if path.endswith(".js"):
            return "application/javascript; charset=utf-8"
        if path.endswith(".css"):
            return "text/css; charset=utf-8"
        if path.endswith(".html"):
            return "text/html; charset=utf-8"
        if path.endswith(".json"):
            return "application/json; charset=utf-8"
        return mimetypes.guess_type(path)[0] or "application/octet-stream"

    def _send_json(self, data: dict, status: HTTPStatus = HTTPStatus.OK) -> None:
        self._send_bytes(json.dumps(data, ensure_ascii=False).encode("utf-8"), "application/json; charset=utf-8", status)

    def _send_bytes(self, payload: bytes, content_type: str, status: HTTPStatus = HTTPStatus.OK) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


if __name__ == "__main__":
    ensure_storage()
    server = ThreadingHTTPServer(("127.0.0.1", PORT), YoyoHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
