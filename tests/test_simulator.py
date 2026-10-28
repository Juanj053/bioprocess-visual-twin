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
