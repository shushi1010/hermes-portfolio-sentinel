#!/usr/bin/env python3
"""
Build portfolio_data.json from Excel and serve static viewer.

Usage:
  python3 run_viewer.py
"""

from __future__ import annotations

import argparse
import errno
import http.server
import socketserver
from pathlib import Path
import socket
import sys

from build_data import main as build_data_main

PORT = 8765
HOST = "0.0.0.0"
VIEWER_DIR = Path(__file__).resolve().parent


def get_local_ip() -> str:
    """Best-effort local IP for LAN hint."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("8.8.8.8", 80))
        return sock.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        sock.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve local/LAN viewer")
    parser.add_argument("--host", default=HOST, help="Bind host, default: 0.0.0.0")
    parser.add_argument("--port", type=int, default=PORT, help="Bind port, default: 8765")
    args = parser.parse_args()

    build_data_main()

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(VIEWER_DIR), **kwargs)

    class Server(socketserver.ThreadingTCPServer):
        allow_reuse_address = True

    try:
        with Server((args.host, args.port), Handler) as httpd:
            local_ip = get_local_ip()
            print(f"[OK] Viewer running at http://127.0.0.1:{args.port}")
            print(f"[OK] LAN access: http://{local_ip}:{args.port}")
            print("[INFO] Press Ctrl+C to stop")
            httpd.serve_forever()
    except OSError as e:
        if e.errno == errno.EADDRINUSE:
            print(f"[ERROR] Port {args.port} is already in use.")
            print("[HINT] Stop existing process or start with another port, e.g.")
            print("       python3 run_viewer.py --port 8766")
            sys.exit(1)
        raise


if __name__ == "__main__":
    main()
