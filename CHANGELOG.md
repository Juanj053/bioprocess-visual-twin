# Changelog

All notable changes to the `bioprocess-visual-twin` simulator and digital twin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.4.0] - 2026-11-06

### Added
- **Multilanguage (i18n) Engine**:
  - Full trilingual support for English (`EN`), Español (`ES`), and Deutsch (`DE`).
  - Seamless in-app language switching via header segmented controls and setup modal with `localStorage` preference persistence.
  - Complete localized dictionary covering vessel classifications, telemetry streaming axes, SCADA metrics, fault injection sandboxes, and safety alarms.
- **Batch Setup & Biological Benchmark Strain Presets**:
  - Interactive Batch Setup modal accessible on startup and via the `Batch Setup` header control.
  - Pre-configured literature-validated organism presets:
    - *Escherichia coli BL21(DE3)*: Rapid aerobic bacterium for recombinant synthesis ($\mu_{\max} = 0.65\text{ h}^{-1}$).
    - *Pichia pastoris (K. phaffii)*: High cell-density methylotrophic yeast ($\mu_{\max} = 0.22\text{ h}^{-1}$).
    - *Saccharomyces cerevisiae*: Facultative Crabtree yeast ($\mu_{\max} = 0.38\text{ h}^{-1}$).
    - *CHO Cells (Mammalian)*: Shear-sensitive therapeutic mAb suspension culture ($\mu_{\max} = 0.038\text{ h}^{-1}$).
  - Parameter customization for initial biomass ($X_0$), glucose substrate ($S_0$), volume ($V$), broth temperature, and pH.
- **Static Culture Vessel (5th Reactor Class)**:
  - Added `Static Vessel` (`Recipiente Estático` / `Statisches Gefäß`) for unagitated stationary bioprocesses.
  - 3D physical modeling in Three.js with passive headspace breather filter, perfectly calm flat broth surface, and deactivated drive shaft.
  - Physical decoupling: locks mechanical agitation to $0\text{ RPM}$ and sparging to $0\text{ VVM}$, shifting oxygenation purely to passive surface diffusion ($k_L a = 1.0\text{ h}^{-1}$) with zero shear risk.

---

## [1.3.0] - 2026-11-06

### Added
- **Automatic Light & Dark Mode Engine with Dynamic 3D & Telemetry Synchronization**:
  - Full automatic OS detection via `prefers-color-scheme` with reactive listener for real-time system changes.
  - Header segmented control allowing explicit user override between `System`, `Light`, and `Dark` with `localStorage` persistence.
  - Three.js 3D Viewport synchronization: dynamically reconfigures scene clear color, background, and volumetric fog (`#f1f3f4` in light mode vs `#191a1d` in dark mode) for seamless surface integration.
  - Chart.js Telemetry synchronization: scales, grid lines, and telemetry curve palettes adapt immediately to ambient theme without resetting batch history.

### Changed
- **Anti-Neon Minimalist Redesign (Google & Antigravity Aesthetic)**:
  - Eliminated all neon accents, glowing cyan/magenta box-shadows, and saturated borders.
  - Adopted quiet, laboratory-grade neutral surfaces: Google White/Gray-50 (`#ffffff` / `#f8f9fa`) in light mode and Charcoal/Slate (`#212226` / `#16171a`) in dark mode.
  - Muted, intentional semantic status indicators (Google Blue, Sage Green, Warm Amber, Brick Red) reserved strictly for functional process feedback.
  - Precision sliders and segmented controls with subtle border states and zero eye fatigue.

---

## [1.2.1] - 2026-11-06

### Changed
- **Institutional Frontend Redesign (Google Minimalist & Antigravity Aesthetic)**:
  - Eliminated all consumer emojis, replacing them with crisp, geometric, monochromatic inline SVGs for all vessel types, playback actions, sensors, alarms, and disturbance sandboxes.
  - Institutional Typography: Integrated Inter & Plus Jakarta Sans with JetBrains Mono tabular numbers (`font-variant-numeric: tabular-nums`) across all SCADA KPI figures to prevent digit shifting during real-time streaming.
  - Google Dark Surface & Elevation: Replaced legacy saturated gradients with an obsidian dark theme (`#080b11`), hairline borders (`border-white/[0.07]`), and discrete colored status dots (`w-1.5 h-1.5 rounded-full`).
  - Google Segmented Controls: Converted reactor selection tabs, speed pills, and fault injection switches into sleek segmented control bars.
  - Metric Card Refactor: Replaced heavy colored left borders (`border-l-4`) with elevated Google Cloud Monitoring-style cards featuring live status chips and uppercase micro-labels.
- **Fixed**:
  - Resolved `doSatPercent` variable scope in telemetry chart loop.
  - Removed deprecated `thickness` property from Three.js r128 `MeshPhysicalMaterial`, achieving 0 console errors and clean rendering.
  - Added embedded SVG favicon to avoid browser 404 requests.

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
