"""Tests for simulator module."""

from bioprocess_twin.kinetics import ReactorConfig
from bioprocess_twin.simulator import BioreactorSimulator


def test_batch_simulation_trajectory():
    sim = BioreactorSimulator()
    res = sim.run_batch(duration_hours=20.0, n_points=50)

    assert len(res["time_h"]) == 50
    assert res["biomass_g_L"][-1] > res["biomass_g_L"][0]
    assert res["substrate_g_L"][-1] < res["substrate_g_L"][0]
    assert res["product_g_L"][-1] > 0.0


def test_stiff_high_kla_and_thermal_optima_stability():
    cfg = ReactorConfig(
        reactor_type="str_rushton",
        rpm=900.0,
        vvm=2.5,
        temperature_C=37.0,
        opt_temperature_C=37.0,
        ph=7.0,
        opt_ph=7.0,
        mu_max=0.65,
        v_tip_crit_m_s=4.5,
    )
    sim = BioreactorSimulator(cfg)
    res = sim.run_batch(duration_hours=18.0, n_points=100)

    do = res["dissolved_oxygen_g_L"]
    assert all(0.0 <= val <= cfg.C_star * 1.05 for val in do)
    assert res["biomass_g_L"][-1] > 5.0

