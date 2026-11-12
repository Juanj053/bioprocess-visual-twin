"""
Physical and biological kinetics for various bioreactor configurations.
Supports:
- Stirred Tank Bioreactor (STR - Rushton)
- Stirred Tank Bioreactor (STR - Marine Impeller)
- Airlift Loop Bioreactor
- Photobioreactor (PBR)
"""

from dataclasses import dataclass
from typing import Dict, Any, List
import math


@dataclass
class ReactorConfig:
    """Design and hydrodynamic specifications for the bioreactor vessel."""
    reactor_type: str = "str_rushton"  # "str_rushton", "str_marine", "airlift", "pbr", "static"
    working_volume_L: float = 20.0
    tank_diameter_m: float = 0.25
    liquid_height_m: float = 0.41
    
    # Operational controls
    rpm: float = 450.0
    vvm: float = 1.2
    temperature_C: float = 30.0
    ph: float = 6.85
    
    # Kinetic parameters
    mu_max: float = 0.35        # h^-1
    Ks: float = 2.0             # g/L
    Kn: float = 0.15            # g/L (Nitrogen limitation)
    Ko: float = 0.0008          # g/L (0.8 mg/L)
    kd: float = 0.012           # h^-1
    Yxs: float = 0.48           # g_X / g_S
    Yxn: float = 5.5            # g_X / g_N
    ms: float = 0.020           # g_S / (g_X * h)
    Yxo: float = 1.10           # g_X / g_O2
    mo: float = 0.015           # g_O2 / (g_X * h)
    Yps: float = 0.85           # g_P / g_S
    alpha: float = 0.15         # g_P / g_X
    beta: float = 0.010         # g_P / (g_X * h)
    C_star: float = 0.0078      # g/L O2 at 30°C
    
    # Environmental optima and tolerances
    opt_temperature_C: float = 30.0
    opt_ph: float = 6.85
    temp_sigma: float = 7.0
    ph_sigma: float = 1.1

    # Shear sensitivity threshold and lysis rate
    v_tip_crit_m_s: float = 3.0
    k_shear: float = 0.045

    # Version 2.0 Media and Contamination
    osmolarity_mOsm: float = 290.0
    biofouling_factor: float = 1.0
    phage_lysis_rate: float = 0.0
    competitor_biomass_g_L: float = 0.0


class BioreactorKinetics:
    """Computes hydrodynamic numbers (Re, P/V, kla) and coupled ODE derivatives."""

    def __init__(self, config: ReactorConfig | None = None):
        self.cfg = config or ReactorConfig()

    def compute_hydrodynamics(self, rpm: float | None = None, vvm: float | None = None) -> Dict[str, float]:
        """Calculates Reynolds number, tip speed, volumetric power and kla."""
        if self.cfg.reactor_type == "static":
            return {
                "reynolds": 0.0,
                "tip_speed_m_s": 0.0,
                "power_density_kW_m3": 0.0,
                "kla_h_inv": 1.0,
                "superficial_velocity_m_s": 0.0,
            }

        rpm_val = rpm if rpm is not None else self.cfg.rpm
        vvm_val = vvm if vvm is not None else self.cfg.vvm

        D_i = self.cfg.tank_diameter_m * 0.35
        rho = 1000.0  # kg/m^3
        mu_visc = 0.001  # Pa*s
        N_rps = rpm_val / 60.0

        Re = (rho * N_rps * (D_i ** 2)) / mu_visc
        v_tip = math.pi * D_i * N_rps

        # Power number Np
        if self.cfg.reactor_type == "str_rushton":
            Np = 5.0
        elif self.cfg.reactor_type == "str_marine":
            Np = 0.87
        elif self.cfg.reactor_type == "airlift":
            Np = 0.0
        else:
            Np = 0.1

        P_watts = Np * rho * (N_rps ** 3) * (D_i ** 5)
        P_density_kW_m3 = (P_watts / (self.cfg.working_volume_L / 1000.0)) / 1000.0

        Fg_m3_s = (vvm_val * self.cfg.working_volume_L) / (1000.0 * 60.0)
        A_tank = math.pi * ((self.cfg.tank_diameter_m / 2.0) ** 2)
        vs = Fg_m3_s / A_tank

        if self.cfg.reactor_type == "airlift":
            kla = 0.32 * (vs ** 0.7) * 3600.0
        else:
            p_vol = max(P_watts / (self.cfg.working_volume_L / 1000.0), 1.0)
            kla = 0.026 * (p_vol ** 0.4) * (vs ** 0.5) * 3600.0

        kla *= self.cfg.biofouling_factor
        kla = max(1.0, min(180.0, kla))

        return {
            "reynolds": Re,
            "tip_speed_m_s": v_tip,
            "power_density_kW_m3": P_density_kW_m3,
            "kla_h_inv": kla,
            "superficial_velocity_m_s": vs,
        }

    def derivatives(self, t: float, y: List[float]) -> List[float]:
        """ODE derivatives [dX/dt, dS/dt, dCL/dt, dP/dt] or [dX/dt, dS/dt, dCL/dt, dP/dt, dN/dt]."""
        X = max(y[0], 0.0)
        S = max(y[1], 0.0)
        CL = max(y[2], 0.0)
        P = max(y[3], 0.0)
        has_n = len(y) >= 5
        N = max(y[4], 0.0) if has_n else 5.0

        hydro = self.compute_hydrodynamics()
        kla = hydro["kla_h_inv"]

        # Dual Monod with Nitrogen limitation and Osmolar stress
        osmo_stress = max(0.0, self.cfg.osmolarity_mOsm - 350.0)
        i_osmo = 600.0 / (600.0 + osmo_stress)

        if S > 1e-4 and N > 1e-4 and CL > 1e-6:
            t_sig = max(0.5, self.cfg.temp_sigma)
            p_sig = max(0.1, self.cfg.ph_sigma)
            temp_factor = math.exp(-(((self.cfg.temperature_C - self.cfg.opt_temperature_C) / t_sig) ** 2))
            ph_factor = math.exp(-(((self.cfg.ph - self.cfg.opt_ph) / p_sig) ** 2))
            mu = (
                self.cfg.mu_max
                * (S / (self.cfg.Ks + S))
                * (N / (self.cfg.Kn + N))
                * (CL / (self.cfg.Ko + CL))
                * temp_factor
                * ph_factor
                * i_osmo
            )
        else:
            mu = 0.0

        qp = (self.cfg.alpha * mu + self.cfg.beta) if S > 1e-4 else 0.0
        qo2 = ((mu / self.cfg.Yxo) + self.cfg.mo) if S > 1e-4 else 0.0
        qn = (mu / self.cfg.Yxn) if N > 1e-4 else 0.0

        v_tip = hydro["tip_speed_m_s"]
        v_crit = max(0.1, self.cfg.v_tip_crit_m_s)
        kd_shear = self.cfg.k_shear * (((v_tip - v_crit) / v_crit) ** 2) if v_tip > v_crit else 0.0

        k_lysis = self.cfg.phage_lysis_rate

        dX_dt = (mu - (self.cfg.kd + kd_shear) - k_lysis) * X
        dS_dt = - ((mu / self.cfg.Yxs) + self.cfg.ms + (qp / self.cfg.Yps)) * X if S > 1e-4 else 0.0
        dCL_dt = kla * (self.cfg.C_star - CL) - qo2 * X
        dP_dt = qp * X
        dN_dt = - qn * X

        if has_n:
            return [dX_dt, dS_dt, dCL_dt, dP_dt, dN_dt]
        return [dX_dt, dS_dt, dCL_dt, dP_dt]
