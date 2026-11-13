"""
Command-Line Interface for Bioprocess Visual Twin.
"""

import argparse
import functools
import http.server
import sys
import webbrowser
from http.server import ThreadingHTTPServer
from pathlib import Path

from bioprocess_twin.kinetics import ReactorConfig
from bioprocess_twin.simulator import BioreactorSimulator


class _BioprocessHTTPHandler(http.server.SimpleHTTPRequestHandler):
    """Static HTTP handler with explicit MIME types for ES modules and PWA assets."""

    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "application/javascript; charset=utf-8",
        ".mjs": "application/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".html": "text/html; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".webmanifest": "application/manifest+json; charset=utf-8",
        ".svg": "image/svg+xml",
    }

    quiet: bool = False

    def log_message(self, format: str, *args: object) -> None:
        if not self.quiet:
            super().log_message(format, *args)


class _ReusableThreadingHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def create_ui_server(
    host: str = "127.0.0.1",
    port: int = 8765,
    web_root: Path | None = None,
    quiet: bool = False,
) -> tuple[ThreadingHTTPServer, str]:
    """Create a local HTTP server for the ES-module and Web Worker web UI."""
    root = (web_root or Path(__file__).resolve().parent.parent.parent).resolve()
    if not (root / "index.html").exists():
        raise FileNotFoundError(f"Could not locate index.html under {root}")

    handler_cls = type(
        "_ConfiguredBioprocessHTTPHandler",
        (_BioprocessHTTPHandler,),
        {"quiet": quiet},
    )
    handler = functools.partial(handler_cls, directory=str(root))
    server = _ReusableThreadingHTTPServer((host, port), handler)
    actual_port = server.server_address[1]
    url = f"http://{host}:{actual_port}/index.html"
    return server, url


def run_simulate(args: argparse.Namespace) -> None:
    cfg = ReactorConfig(
        reactor_type=args.type,
        rpm=args.rpm,
        vvm=args.vvm,
        temperature_C=args.temp,
        ph=args.ph,
    )
    sim = BioreactorSimulator(cfg)
    res = sim.run_batch(duration_hours=args.duration, n_points=args.points)

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    header = "time_h,biomass_g_L,substrate_g_L,dissolved_oxygen_g_L,product_g_L\n"
    lines = [header]
    for i in range(len(res["time_h"])):
        lines.append(
            f"{res['time_h'][i]:.4f},{res['biomass_g_L'][i]:.4f},"
            f"{res['substrate_g_L'][i]:.4f},{res['dissolved_oxygen_g_L'][i]:.6f},"
            f"{res['product_g_L'][i]:.4f}\n"
        )

    with open(out_path, "w", encoding="utf-8") as f:
        f.writelines(lines)

    print(f"✅ Simulation ({args.type}) exported to: {out_path} ({len(res['time_h'])} timepoints)")
    print(f"   Final Biomass: {res['biomass_g_L'][-1]:.2f} g/L | Product: {res['product_g_L'][-1]:.2f} g/L")


def run_ui(args: argparse.Namespace) -> None:
    try:
        server, url = create_ui_server(host=args.host, port=args.port)
    except FileNotFoundError as exc:
        print(f"❌ {exc}", file=sys.stderr)
        sys.exit(1)

    print(f"🚀 Bioprocess Visual Twin server listening at: {url}")
    print("   Press Ctrl+C to stop.")
    if not args.no_browser:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Stopping Bioprocess Visual Twin UI server.")
    finally:
        server.server_close()


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="bioprocess-twin",
        description="Bioprocess Visual Twin CLI & Simulation Engine",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Simulate
    sim_p = subparsers.add_parser("simulate", help="Run ODE batch simulation")
    sim_p.add_argument("--type", type=str, default="str_rushton", choices=["str_rushton", "str_marine", "airlift", "pbr"])
    sim_p.add_argument("--duration", type=float, default=40.0)
    sim_p.add_argument("--rpm", type=float, default=450.0)
    sim_p.add_argument("--vvm", type=float, default=1.2)
    sim_p.add_argument("--temp", type=float, default=30.0)
    sim_p.add_argument("--ph", type=float, default=6.85)
    sim_p.add_argument("--points", type=int, default=400)
    sim_p.add_argument("--output", type=str, default="results/batch_run.csv")

    # UI
    ui_p = subparsers.add_parser("ui", help="Serve interactive web simulator over local HTTP")
    ui_p.add_argument("--host", type=str, default="127.0.0.1", help="Bind host address")
    ui_p.add_argument("--port", type=int, default=8765, help="HTTP server port (0 for auto)")
    ui_p.add_argument("--no-browser", action="store_true", help="Do not open browser automatically")

    args = parser.parse_args()
    if args.command == "simulate":
        run_simulate(args)
    elif args.command == "ui":
        run_ui(args)


if __name__ == "__main__":
    main()
