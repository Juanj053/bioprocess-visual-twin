"""Tests for bioprocess-visual-twin kinetics."""

import pytest
from bioprocess_twin.kinetics import ReactorConfig, BioreactorKinetics


def test_hydrodynamics_calculation():
    cfg = ReactorConfig(reactor_type="str_rushton", rpm=450, vvm=1.2)
    kin = BioreactorKinetics(cfg)
    h = kin.compute_hydrodynamics()

    assert h["reynolds"] > 10000.0  # Fully turbulent
    assert 1.5 < h["tip_speed_m_s"] < 3.0
    assert 30.0 < h["kla_h_inv"] < 120.0


def test_airlift_hydrodynamics():
    cfg = ReactorConfig(reactor_type="airlift", rpm=0, vvm=1.2)
    kin = BioreactorKinetics(cfg)
    h = kin.compute_hydrodynamics()

    assert h["power_density_kW_m3"] == 0.0  # No mechanical impeller
    assert h["kla_h_inv"] > 15.0  # Aeration driven


def test_derivatives_direction():
    cfg = ReactorConfig()
    kin = BioreactorKinetics(cfg)
    y0 = [0.80, 35.0, 0.0078, 0.0]
    derivs = kin.derivatives(0.0, y0)

    dX, dS, dCL, dP = derivs
    assert dX > 0.0  # Cell growth
    assert dS < 0.0  # Glucose consumption
    assert dP > 0.0  # Product formation
