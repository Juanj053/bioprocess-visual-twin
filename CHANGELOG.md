# Changelog

All notable changes to the `bioprocess-visual-twin` simulator and digital twin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-11-06

### Added
- **3D WebGL Engine Upgrade**:
  - Replaced the initial 2D Canvas rendering pipeline with a hardware-accelerated **Three.js WebGL 3D photorealistic engine**.
  - Integrated full **$360^\circ$ OrbitControls**: interactive camera rotation, mouse wheel zoom, and pan controls.
  - Realistic Borosilicate 3.3 glass vessel cylinder with optical transparency, thickness refraction, specular reflections, and steel support flanges.
  - Physical 3D fluid volume with animated free-surface meniscus dynamic wave oscillation based on agitator speed (RPM).
  - Volumetric 3D gas sparging particle system with buoyancy forces, bubble coalescence, and turbulent radial dispersion.
  - 3D mechanical components:
    - Motor top-drive assembly with rotating drive shaft.
    - Dual Rushton turbine impellers with rotating radial blades.
    - Dual Marine pitched-blade propellers with directional axial flow streamlines.
    - Airlift internal draft tube with pneumatic loop circulation.
    - Packed-Bed porous catalytic matrix with interstitial fluid percolation.
    - Standard internal baffles ($4 \times 90^\circ$) preventing vortex cavitation.
    - Ring sparger with micro-orifice bubble generation.
    - Helical internal cooling coil.
    - Standard sensory probes (Dissolved Oxygen, pH, PT-100 temperature).

### Improved
- Real-time synchronization between 3D hydrodynamic animations and the coupled ODE kinetic solver (Monod growth, Pirt maintenance, and Van't Riet $k_L a$ oxygen mass transfer).
- Enhanced mobile and touch responsiveness for OrbitControls navigation.

---

## [1.0.0] - 2026-10-28

### Added
- Initial release of `bioprocess-visual-twin`.
- Real-time 60 FPS interactive bioreactor fluid dynamics and SCADA telemetry dashboard.
- Dual Monod growth kinetics with substrate limitation and specific cell death rate.
- Interactive SCADA parameters: Agitator RPM, Airflow (vvm), Initial Glucose ($S_0$), and Inoculum Biomass ($X_0$).
- Real-time Chart.js telemetry tracking Biomass ($X$), Glucose Substrate ($S$), Bio-Product ($P$), and Dissolved Oxygen ($DO$).
- 4 Bioreactor Geometries: STR (Rushton), STR (Marine), Airlift Loop, and Packed-Bed Reactor.
- Standalone zero-dependency single-file HTML/JS deployment for instant web delivery via GitHub Pages.
- Python bioprocess kinetic test suite (`tests/`).
