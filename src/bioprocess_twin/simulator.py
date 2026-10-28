"""
Time-course ODE integration engine for bioreactors.
"""

from typing import Dict, Any, List
import numpy as np
import scipy.integrate as spi

from bioprocess_twin.kinetics import ReactorConfig, BioreactorKinetics


class BioreactorSimulator:
    """Executes high-resolution numerical simulations."""

    def __init__(self, config: ReactorConfig | None = None):
        self.cfg = config or ReactorConfig()
        self.kinetics = BioreactorKinetics(self.cfg)

    def run_batch(
        self,
        duration_hours: float = 40.0,
        n_points: int = 400,
        y0: List[float] | None = None,
    ) -> Dict[str, np.ndarray]:
        """Runs batch fermentation simulation."""
        init_state = y0 or [0.80, 35.0, self.cfg.C_star, 0.0]
        t_eval = np.linspace(0.0, duration_hours, n_points)

        sol = spi.solve_ivp(
            fun=self.kinetics.derivatives,
            t_span=(0.0, duration_hours),
            y0=init_state,
            t_eval=t_eval,
            method="Radau",
            rtol=1e-6,
            atol=1e-8,
        )

        if not sol.success:
            sol = spi.solve_ivp(
                fun=self.kinetics.derivatives,
                t_span=(0.0, duration_hours),
                y0=init_state,
                t_eval=t_eval,
                method="RK45",
            )

        return {
            "time_h": sol.t,
            "biomass_g_L": sol.y[0],
            "substrate_g_L": sol.y[1],
            "dissolved_oxygen_g_L": sol.y[2],
            "product_g_L": sol.y[3],
        }
