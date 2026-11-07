"""Tests for bioprocess batch analytics and KPI calculations."""

import numpy as np
from bioprocess_twin.analytics import compute_batch_kpis


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
