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


def test_static_reactor_hydrodynamics():
    cfg = ReactorConfig(reactor_type="static", rpm=0, vvm=0)
    kin = BioreactorKinetics(cfg)
    h = kin.compute_hydrodynamics()

    assert h["reynolds"] == 0.0
    assert h["tip_speed_m_s"] == 0.0
    assert h["kla_h_inv"] == 1.0


def test_nitrogen_and_lysis_kinetics():
    cfg = ReactorConfig(phage_lysis_rate=2.0)
    kin = BioreactorKinetics(cfg)
    y0 = [1.0, 30.0, 0.0078, 0.0, 5.0]
    derivs = kin.derivatives(0.0, y0)

    assert len(derivs) == 5
    dX, dS, dCL, dP, dN = derivs
    assert dX < 0.0  # High viral lysis causes biomass drop
    assert dN < 0.0  # Nitrogen consumed during metabolism

