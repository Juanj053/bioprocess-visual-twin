"""Tests for bioprocess batch analytics and KPI calculations."""

import numpy as np
from bioprocess_twin.analytics import compute_batch_kpis, detect_growth_phases


def test_batch_kpi_computation():
    time_h = np.linspace(0.0, 24.0, 100)
    # Exponential-like growth and substrate consumption
    biomass = 0.8 + 12.0 / (1.0 + np.exp(-0.35 * (time_h - 12.0)))
    substrate = 35.0 - 2.2 * (biomass - 0.8)
    dissolved_oxygen = np.clip(100.0 - 6.0 * biomass, 18.0, 100.0)
    product = 0.25 * (biomass - 0.8)
    nitrogen = np.clip(5.0 - 0.3 * (biomass - 0.8), 0.5, 5.0)

    kpis = compute_batch_kpis(
        time_h=time_h,
        biomass_g_L=biomass,
        substrate_g_L=substrate,
        dissolved_oxygen_pct=dissolved_oxygen,
        product_g_L=product,
        nitrogen_g_L=nitrogen,
        volume_L=20.0,
    )

    assert kpis["batch_duration_h"] == 24.0
    assert kpis["initial_biomass_g_L"] == round(biomass[0], 3)
    assert kpis["final_biomass_g_L"] == round(biomass[-1], 3)
    assert kpis["delta_biomass_g_L"] > 10.0
    assert kpis["total_biomass_harvest_g"] > 200.0
    assert kpis["yield_y_xs_g_g"] > 0.40
    assert kpis["yield_y_ps_g_g"] > 0.05
    assert kpis["volumetric_productivity_qp_g_L_h"] > 0.10
    assert kpis["carbon_balance_recovery_pct"] >= 99.0
    assert kpis["min_dissolved_oxygen_pct"] >= 18.0
    assert kpis["hypoxia_duration_h"] == 0.0
    assert "growth_phases" in kpis
    assert len(kpis["growth_phases"]["segments"]) > 0


def test_detect_growth_phases():
    time_h = np.linspace(0.0, 30.0, 150)
    biomass = np.zeros_like(time_h)
    for i, ti in enumerate(time_h):
        if ti <= 3.0:
            biomass[i] = 0.8 + 0.05 * (ti / 3.0)
        elif ti <= 15.0:
            biomass[i] = biomass[i - 1] + (ti - time_h[i - 1]) * 0.45 * biomass[i - 1] * (1.0 - biomass[i - 1] / 14.0)
        elif ti <= 20.0:
            biomass[i] = biomass[i - 1] + (ti - time_h[i - 1]) * 0.15 * biomass[i - 1] * (1.0 - biomass[i - 1] / 14.0)
        else:
            biomass[i] = 14.0
    substrate = np.clip(35.0 - 2.2 * (biomass - 0.8), 0.0, 35.0)

    phases_res = detect_growth_phases(time_h, biomass, substrate)
    assert "point_phases" in phases_res
    assert len(phases_res["point_phases"]) == len(time_h)
    assert "segments" in phases_res
    assert len(phases_res["segments"]) >= 3

    seg_names = [s["phase"] for s in phases_res["segments"]]
    assert "lag" in seg_names
    assert "exponential" in seg_names
    assert "stationary" in seg_names or "deceleration" in seg_names
    assert phases_res["current_phase"] in ["stationary", "deceleration"]

