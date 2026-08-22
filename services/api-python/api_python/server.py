"""Der Berichts-Dienst.

Ein Endpunkt, eine Abfrage. Die Konfiguration kommt aus der Umgebung —
und anders als bei den Rust- und C++-Diensten findet die Vollanalyse sie
hier wirklich: sie liest `.py`.

Bewusst mit dem Index-Zugriff und nicht mit `.get()`: das Muster der
Analyse trifft nur die Klammerform. Wer hier `.get("NAME", vorgabe)`
schreibt, bekommt eine Variable, die niemand vorgeschlagen bekommt.
Wo ein Vorgabewert noetig ist, steht er unten in `or`.
"""

import http.server
import json
import os
import sys

import psycopg

# Ohne Zugangsdaten gar nicht erst anlaufen. Ein Dienst, der startet und
# bei der ersten Anfrage umfaellt, verschiebt den Fehler nur dorthin, wo
# er niemandem mehr etwas sagt.
DATABASE_URL = os.environ["DATABASE_URL"] if "DATABASE_URL" in os.environ else None
PORT = int(os.environ["PYTHON_API_PORT"] if "PYTHON_API_PORT" in os.environ else "8084")
LOG_LEVEL = os.environ["LOG_LEVEL"] if "LOG_LEVEL" in os.environ else "info"


class Handler(http.server.BaseHTTPRequestHandler):
    def _json(self, code: int, koerper: object) -> None:
        rohdaten = json.dumps(koerper).encode()
        self.send_response(code)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(rohdaten)))
        self.end_headers()
        self.wfile.write(rohdaten)

    def do_GET(self) -> None:  # noqa: N802 — von der Basisklasse vorgegeben
        if self.path == "/health":
            self._json(200, {"ok": True})
            return
        if self.path == "/report":
            try:
                with psycopg.connect(DATABASE_URL) as db, db.cursor() as cur:
                    cur.execute("select count(*) from items")
                    (anzahl,) = cur.fetchone()
                self._json(200, {"items": anzahl})
            except psycopg.Error as e:
                if LOG_LEVEL == "debug":
                    print(e, file=sys.stderr)
                # 503, nicht 500: die Datenbank ist weg, nicht der Code kaputt.
                self._json(503, {"error": "database unavailable"})
            return
        self._json(404, {"error": "not found"})

    def log_message(self, format: str, *args: object) -> None:
        if LOG_LEVEL == "debug":
            super().log_message(format, *args)


def main() -> int:
    if not DATABASE_URL:
        print(
            "DATABASE_URL fehlt — ohne Datenbank hat dieser Dienst nichts zu tun",
            file=sys.stderr,
        )
        return 78  # EX_CONFIG
    server = http.server.ThreadingHTTPServer(("0.0.0.0", 8084), Handler)
    print(f"api-python hoert auf {PORT}")
    server.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
