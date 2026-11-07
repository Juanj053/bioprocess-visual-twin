"""
Bioprocess Visual Twin: Interactive Bioreactor Physics & Telemetry Engine.
"""

__version__ = "2.2.0"
__author__ = "Juan José Álvarez Morales"
__license__ = "MIT"

from bioprocess_twin.kinetics import BioreactorKinetics, ReactorConfig
from bioprocess_twin.simulator import BioreactorSimulator
from bioprocess_twin.analytics import compute_batch_kpis

__all__ = ["BioreactorKinetics", "ReactorConfig", "BioreactorSimulator", "compute_batch_kpis"]
