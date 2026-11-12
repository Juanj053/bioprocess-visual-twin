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


def test_strain_specific_optima_and_shear_lysis():
    # E. coli profile at 37°C should not suffer 30°C penalty when opt_temperature_C=37.0
    cfg_opt = ReactorConfig(
        temperature_C=37.0,
        opt_temperature_C=37.0,
        ph=7.0,
        opt_ph=7.0,
        rpm=300.0,
        v_tip_crit_m_s=4.5,
    )
    cfg_generic = ReactorConfig(
        temperature_C=37.0,
        opt_temperature_C=30.0,
        ph=7.0,
        opt_ph=6.85,
        rpm=300.0,
        v_tip_crit_m_s=4.5,
    )
    y0 = [1.0, 30.0, 0.0078, 0.0, 5.0]
    dx_opt = BioreactorKinetics(cfg_opt).derivatives(0.0, y0)[0]
    dx_gen = BioreactorKinetics(cfg_generic).derivatives(0.0, y0)[0]
    assert dx_opt > dx_gen

    # Shear-sensitive CHO configuration under excessive tip speed (> 1.5 m/s)
    cfg_low_shear = ReactorConfig(rpm=120.0, v_tip_crit_m_s=1.5, k_shear=0.25)
    cfg_high_shear = ReactorConfig(rpm=750.0, v_tip_crit_m_s=1.5, k_shear=0.25)
    dx_low = BioreactorKinetics(cfg_low_shear).derivatives(0.0, y0)[0]
    dx_high = BioreactorKinetics(cfg_high_shear).derivatives(0.0, y0)[0]
    assert dx_high < dx_low


