"""
Bioprocess Visual Twin: Interactive Bioreactor Physics & Telemetry Engine.
"""

__version__ = "1.0.0"
__author__ = "Juan José Álvarez Morales"
__license__ = "MIT"

from bioprocess_twin.kinetics import BioreactorKinetics, ReactorConfig
from bioprocess_twin.simulator import BioreactorSimulator

__all__ = ["BioreactorKinetics", "ReactorConfig", "BioreactorSimulator"]
