"""
Batch analytics and bioprocess performance indicator (KPI) calculator.
"""

from typing import Dict, Any, List, Optional
import numpy as np


def compute_batch_kpis(
    time_h: np.ndarray | List[float],
    biomass_g_L: np.ndarray | List[float],
    substrate_g_L: np.ndarray | List[float],
    dissolved_oxygen_pct: np.ndarray | List[float],
    product_g_L: np.ndarray | List[float],
    nitrogen_g_L: Optional[np.ndarray | List[float]] = None,
    volume_L: float = 15.0,
    s_fed_total: float = 0.0,
    n_fed_total: float = 0.0,
) -> Dict[str, Any]:
    """Computes comprehensive bioprocess KPIs over a batch trajectory.

    Args:
        time_h: Array of elapsed time in hours.
        biomass_g_L: Biomass concentration X (g/L).
        substrate_g_L: Carbon substrate concentration S (g/L).
        dissolved_oxygen_pct: Dissolved oxygen DO (%).
        product_g_L: Target product concentration P (g/L).
        nitrogen_g_L: Optional nitrogen concentration N (g/L).
        volume_L: Working volume in liters.
        s_fed_total: Total pulsed/fed substrate (g/L).
        n_fed_total: Total pulsed/fed nitrogen (g/L).

    Returns:
        Dictionary of calculated bioprocess KPIs.
    """
    t = np.asarray(time_h, dtype=float)
    x = np.asarray(biomass_g_L, dtype=float)
    s = np.asarray(substrate_g_L, dtype=float)
    d_o = np.asarray(dissolved_oxygen_pct, dtype=float)
    p = np.asarray(product_g_L, dtype=float)

    if len(t) < 2:
        return {"error": "Insufficient data points for batch KPI computation"}

    t_batch = float(t[-1] - t[0])
    if t_batch <= 0:
        t_batch = 1e-6

    # Biomass dynamics
    x0 = float(x[0])
    xf = float(x[-1])
    delta_x = max(0.0, xf - x0)
    total_biomass_g = xf * volume_L

    # Specific growth rate estimation
    dt = np.diff(t)
    dt[dt <= 0] = 1e-6
    dx = np.diff(x)
    x_mid = 0.5 * (x[:-1] + x[1:])
    x_mid[x_mid <= 1e-4] = 1e-4
    mu_instant = dx / (dt * x_mid)
    mu_max_obs = float(np.max(mu_instant)) if len(mu_instant) > 0 else 0.0
    mu_max_obs = max(0.0, mu_max_obs)
    doubling_time_h = float(np.log(2.0) / mu_max_obs) if mu_max_obs > 1e-4 else 0.0

    # Substrate dynamics
    s0 = float(s[0])
    sf = float(s[-1])
    delta_s = max(0.0, (s0 + s_fed_total) - sf)
    s_conversion_pct = (delta_s / max(1e-4, s0 + s_fed_total)) * 100.0

    # Yields
    y_xs = delta_x / max(1e-4, delta_s) if delta_s > 1e-4 else 0.0

    # Product dynamics
    p0 = float(p[0])
    pf = float(p[-1])
    delta_p = max(0.0, pf - p0)
    total_product_g = pf * volume_L
    volumetric_prod_qp = delta_p / t_batch
    y_ps = delta_p / max(1e-4, delta_s) if delta_s > 1e-4 else 0.0

    # Nitrogen dynamics
    delta_n = 0.0
    y_xn = 0.0
    if nitrogen_g_L is not None:
        n = np.asarray(nitrogen_g_L, dtype=float)
        n0 = float(n[0])
        nf = float(n[-1])
        delta_n = max(0.0, (n0 + n_fed_total) - nf)
        y_xn = delta_x / max(1e-4, delta_n) if delta_n > 1e-4 else 0.0

    # Carbon balance
    c_in = delta_s * 0.400
    c_biomass = delta_x * 0.480
    c_product = delta_p * 0.450
    c_co2 = max(0.0, c_in - (c_biomass + c_product))
    c_recovery_pct = ((c_biomass + c_product + c_co2) / max(1e-4, c_in)) * 100.0 if c_in > 1e-4 else 100.0

    # Oxygenation
    min_do_pct = float(np.min(d_o))
    hypoxia_time_h = float(np.sum(dt[d_o[:-1] < 15.0])) if len(dt) > 0 else 0.0

    return {
        "batch_duration_h": round(t_batch, 2),
        "initial_biomass_g_L": round(x0, 3),
        "final_biomass_g_L": round(xf, 3),
        "delta_biomass_g_L": round(delta_x, 3),
        "total_biomass_harvest_g": round(total_biomass_g, 2),
        "mu_max_observed_h1": round(mu_max_obs, 3),
        "doubling_time_h": round(doubling_time_h, 2),
        "initial_substrate_g_L": round(s0, 2),
        "final_substrate_g_L": round(sf, 2),
        "substrate_consumed_g_L": round(delta_s, 2),
        "substrate_conversion_pct": round(s_conversion_pct, 1),
        "yield_y_xs_g_g": round(y_xs, 3),
        "final_product_g_L": round(pf, 3),
        "delta_product_g_L": round(delta_p, 3),
        "total_product_harvest_g": round(total_product_g, 2),
        "volumetric_productivity_qp_g_L_h": round(volumetric_prod_qp, 3),
        "yield_y_ps_g_g": round(y_ps, 3),
        "delta_nitrogen_g_L": round(delta_n, 3),
        "yield_y_xn_g_g": round(y_xn, 3),
        "carbon_in_g_C_L": round(c_in, 2),
        "carbon_biomass_g_C_L": round(c_biomass, 2),
        "carbon_product_g_C_L": round(c_product, 2),
        "carbon_co2_g_C_L": round(c_co2, 2),
        "carbon_balance_recovery_pct": round(c_recovery_pct, 1),
        "min_dissolved_oxygen_pct": round(min_do_pct, 1),
        "hypoxia_duration_h": round(hypoxia_time_h, 2),
    }
