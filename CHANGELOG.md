# Changelog

All notable changes to the `bioprocess-visual-twin` simulator and digital twin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-11-06

### Added
- **Process Fault Injection Sandbox**:
  - Interactive process disturbance injection panel with real-time SCADA state updates:
    - *Air Compressor Failure*: Airflow drops to 0 vvm, 3D bubble sparging particles stop, $k_L a$ collapses to natural surface diffusion ($1.8\text{ h}^{-1}$), and critical hypoxia alarm triggers.
    - *Agitator Motor Mechanical Stall*: Rotation RPM drops to 0, 3D impeller shaft stops spinning, liquid surface vortex subsides, and power density collapses.
    - *Dissolved Oxygen Sensor Drift*: Simulates calibration decalibration ($+25\%$ positive offset) demonstrating sensor degradation risks.
    - *Thermal Inactivation Runaway*: Broth temperature jumps to $42^\circ\text{C}$, triggering Arrhenius cell inactivation and collapsing specific growth rate $\mu$.
- **Closed-Loop Cascade Controller (Auto-DO PID)**:
  - Automated adaptive feedback loop maintaining Dissolved Oxygen above critical setpoint ($30\%$ saturation).
  - Cascading actuation logic: automatically boosts agitator speed up to $800\text{ RPM}$ and aeration up to $2.5\text{ vvm}$ under high biological oxygen demand, throttling back during stationary phase.
  - Active controller telemetry state readout (`Boosting RPM/VVM ⚡`, `Holding Setpoint 🔒`, `Throttling Down 💤`).
- **Interactive Luedeking-Piret Kinetics Parameters**:
  - Real-time sliders for growth-associated ($\alpha$) and non-growth-associated ($\beta$) product synthesis coefficients.
  - Automated classification badge (Primary Metabolite / Secondary / Mixed Luedeking-Piret).
- **Academic Inspiration & References**:
  - Added formal academic citations and acknowledgements honoring the open-source architectures of *Ashray et al.* (Mammalian Perfusion Bioreactor Digital Twin) and the *Pioreactor* automated control ecosystem.

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
