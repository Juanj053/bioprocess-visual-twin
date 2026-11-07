"""
Batch analytics and bioprocess performance indicator (KPI) calculator.
"""

from typing import Dict, Any, List, Optional
import numpy as np


def detect_growth_phases(
    time_h: np.ndarray | List[float],
    biomass_g_L: np.ndarray | List[float],
    substrate_g_L: np.ndarray | List[float],
    mu_h1: Optional[np.ndarray | List[float]] = None,
    purity_pct: Optional[np.ndarray | List[float]] = None,
) -> Dict[str, Any]:
    """Automatically differentiates and segments microbial growth phases over time.

    Identifies standard biological phases:
      - 'lag': Lag / Adaptation Phase
      - 'exponential': Exponential / Logarithmic Growth Phase
      - 'deceleration': Deceleration / Nutrient Limiting Transition Phase
      - 'stationary': Stationary / Nutrient Exhaustion Plateau Phase
      - 'death': Lysis / Cell Death Phase

    Args:
        time_h: Elapsed time array in hours.
        biomass_g_L: Biomass concentration X (g/L).
        substrate_g_L: Substrate concentration S (g/L).
        mu_h1: Optional specific growth rate array (h⁻¹).
        purity_pct: Optional culture sterility / purity array (%).

    Returns:
        Dictionary with:
          - 'point_phases': list of phase keys per input timepoint
          - 'segments': list of contiguous phase intervals with durations & biomass delta
          - 'current_phase': active phase at the latest timepoint
    """
    t = np.asarray(time_h, dtype=float)
    x = np.asarray(biomass_g_L, dtype=float)
    s = np.asarray(substrate_g_L, dtype=float)
    n_pts = len(t)
    if n_pts < 2:
        return {
            "point_phases": ["lag"] * n_pts,
            "segments": [],
            "current_phase": "lag",
        }

    # Compute instantaneous specific growth rate mu if not provided
    if mu_h1 is not None:
        mu = np.asarray(mu_h1, dtype=float)
    else:
        dt = np.gradient(t)
        dt[dt <= 0] = 1e-6
        dx = np.gradient(x)
        x_safe = np.clip(x, 1e-4, None)
        mu = dx / (dt * x_safe)

    x_max = float(np.max(x))
    x_min = float(x[0])
    delta_x_tot = max(1e-4, x_max - x_min)
    mu_max = max(1e-4, float(np.max(mu)))

    point_phases: List[str] = []
    current_state = "lag"

    for i in range(n_pts):
        xi = x[i]
        si = s[i]
        mui = mu[i]
        purity = purity_pct[i] if purity_pct is not None else 100.0

        if current_state == "lag":
            if (purity < 80.0 and xi < x_max - 0.15) or (xi < x_max - 0.25 and mui < -0.015):
                current_state = "death"
            elif si <= 0.8:
                current_state = "stationary"
            elif (xi >= x_min + 0.06 * delta_x_tot and mui >= 0.20 * mu_max) or (t[i] >= 3.0 and mui >= 0.20 * mu_max):
                current_state = "exponential"
        elif current_state == "exponential":
            if (purity < 80.0 and xi < x_max - 0.15) or (xi < x_max - 0.25 and mui < -0.015):
                current_state = "death"
            elif si <= 0.8 or (xi >= x_max * 0.97 and mui < 0.04):
                current_state = "stationary"
            elif si <= 4.0 or (xi >= x_min + 0.75 * delta_x_tot and mui < 0.30 * mu_max):
                current_state = "deceleration"
        elif current_state == "deceleration":
            if (purity < 80.0 and xi < x_max - 0.15) or (xi < x_max - 0.25 and mui < -0.015):
                current_state = "death"
            elif si <= 0.8 or (xi >= x_max * 0.96 and mui < 0.05):
                current_state = "stationary"
            elif si > 8.0 and mui >= 0.40 * mu_max and (i > 0 and s[i - 1] <= 4.0):
                current_state = "exponential"  # pulse reactivation
        elif current_state == "stationary":
            if (purity < 80.0 and xi < x_max - 0.15) or (xi < x_max - 0.30 and mui < -0.015):
                current_state = "death"
            elif si > 5.0 and mui >= 0.20 * mu_max:
                current_state = "exponential"  # pulse reactivation

        point_phases.append(current_state)

    # Compress into contiguous segments
    segments: List[Dict[str, Any]] = []
    if n_pts > 0:
        curr_p = point_phases[0]
        start_idx = 0
        for i in range(1, n_pts):
            if point_phases[i] != curr_p:
                dur = float(t[i - 1] - t[start_idx])
                dx_seg = float(x[i - 1] - x[start_idx])
                segments.append({
                    "phase": curr_p,
                    "start_time_h": round(float(t[start_idx]), 2),
                    "end_time_h": round(float(t[i - 1]), 2),
                    "duration_h": round(max(0.0, dur), 2),
                    "delta_biomass_g_L": round(dx_seg, 3),
                    "start_biomass_g_L": round(float(x[start_idx]), 3),
                    "end_biomass_g_L": round(float(x[i - 1]), 3),
                })
                curr_p = point_phases[i]
                start_idx = i

        dur = float(t[-1] - t[start_idx])
        dx_seg = float(x[-1] - x[start_idx])
        segments.append({
            "phase": curr_p,
            "start_time_h": round(float(t[start_idx]), 2),
            "end_time_h": round(float(t[-1]), 2),
            "duration_h": round(max(0.0, dur), 2),
            "delta_biomass_g_L": round(dx_seg, 3),
            "start_biomass_g_L": round(float(x[start_idx]), 3),
            "end_biomass_g_L": round(float(x[-1]), 3),
        })

    return {
        "point_phases": point_phases,
        "segments": segments,
        "current_phase": point_phases[-1] if point_phases else "lag",
    }


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

    # Growth phase segmentation
    growth_phases = detect_growth_phases(t, x, s, mu_h1=None)

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
        "growth_phases": growth_phases,
    }
