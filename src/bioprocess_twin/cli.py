"""
Command-Line Interface for Bioprocess Visual Twin.
"""

import argparse
import sys
import webbrowser
from pathlib import Path
import numpy as np

from bioprocess_twin.kinetics import ReactorConfig
from bioprocess_twin.simulator import BioreactorSimulator


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
    html_path = Path(__file__).resolve().parent.parent.parent / "index.html"
    if html_path.exists():
        print(f"🚀 Opening Bioprocess Visual Twin in browser: {html_path.as_uri()}")
        webbrowser.open(html_path.as_uri())
    else:
        print("❌ Could not locate index.html")


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
    ui_p = subparsers.add_parser("ui", help="Launch interactive web simulator in browser")

    args = parser.parse_args()
    if args.command == "simulate":
        run_simulate(args)
    elif args.command == "ui":
        run_ui(args)


if __name__ == "__main__":
    main()
