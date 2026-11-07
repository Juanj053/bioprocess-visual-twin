# Changelog

All notable changes to the `bioprocess-visual-twin` simulator and digital twin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.2.0] - 2026-11-06

### Added
- **Adaptive Mobile Ergonomics & Responsive Layout Architecture**:
  - Re-architected top header to compress vertical space on mobile devices (height reduced from 271px down to ~76-120px).
  - Implemented collapsible mobile action drawer (`#mobile-actions-drawer`) housing simulation speed toggles (1x/5x/20x), substrate pulses, language switcher (EN/ES/DE), theme toggle, and CSV export.
  - Added smooth horizontal vessel carousel with momentum scrolling (`overflow-x-auto no-scrollbar scroll-smooth flex-nowrap`) preventing multi-line button wrapping.
  - Added native iOS Safari & Android safe-area insets (`env(safe-area-inset-top/bottom/left/right)`).
- **3D WebGL Viewport Touch Ergonomics & Anti-Trapping Mode**:
  - Implemented dual-mode touch interaction switcher (`#btn-touch-mode`) toggling between `3D Orbit` (`controls.enabled = true`) and `Page Scroll` (`controls.enabled = false; touch-action: pan-y;`) to prevent OrbitControls from trapping mobile users when scrolling vertically.
  - Added responsive viewport canvas bounds (`min-height: 320px; height: 40vh; max-height: 480px;`).
- **Mobile Sub-Navigation & Segmented Content Tabs**:
  - Added mobile segmented sub-tab bar (`[ 📊 Telemetry ]` / `[ ⚡ Faults ]` / `[ 🔬 Kinetics ]` / `[ All ]`) with `setMobileSubTab()` allowing single-tap section navigation on small screens.
  - Auto-restores full multi-column grid layout when resizing to desktop (`>= 1024px`).
- **Touch-Friendly Controls & iOS Safari Auto-Zoom Prevention**:
  - Enlarged range slider thumbs to 22px on touchscreens (`pointer: coarse`).
  - Added `inputmode="decimal"` and calibrated input font sizes to prevent unwanted iOS Safari viewport zoom upon input focus.
- **Responsive Batch Setup Modal Sheet**:
  - Adapted `#modal-setup` to an ergonomic sheet with sticky header and sticky footer (`Close` / `Launch Batch Simulation`).
- **Mobile-Optimized Results Dashboard (`dashboard.html` & `#view-dashboard`)**:
  - Responsive 2-column KPI grid on mobile.
  - Added horizontal swipe hints for data tables (`← Swipe to inspect →`).
  - Compact header actions with icon fallbacks on ultra-compact viewports.
- **100% Trilingual Parity (EN, ES, DE)**:
  - All new touch mode toggles, subtabs, and swipe hints fully localized.

---

## [2.1.0] - 2026-11-06

### Added
- **Full Batch Analytics & Results Dashboard (Interactive & Standalone Views)**:
  - Added dedicated Results Dashboard accessible in-app via the top navigation switcher `[ 3D Twin ]` / `[ Results Dashboard ]` and through telemetry shortcut `[ Analytics Dashboard ↗ ]`.
  - Created standalone dedicated results page [`dashboard.html`](dashboard.html) with auto-loading from `localStorage` and synthetic 36-hour fed-batch benchmark fallback.
  - Full-resolution continuous history recording (`State.batchHistory`) tracking all elapsed simulation snapshots from $t=0$ to $t_{\text{end}}$.
- **Executive Bioprocess KPI Suite (6 Multi-Metric Cards)**:
  - *Biomass & Growth Kinetics*: Net biomass produced ($\Delta X$), total harvestable dry cell weight ($M_X$), observed peak specific growth rate ($\mu_{\max}^{\text{obs}}$), and apparent generation doubling time ($t_d$).
  - *Substrate & Yields*: Substrate consumed ($\Delta S$), substrate conversion efficiency ($\eta_S$), biomass yield on substrate ($Y_{X/S}$), and biomass yield on nitrogen ($Y_{X/N}$).
  - *Product Formation*: Recombinant product harvest ($\Delta P$ and total $M_P$), volumetric productivity ($Q_P$), and product yield on substrate ($Y_{P/S}$).
  - *Carbon Balance Audit*: Total carbon input ($C_{\text{in}}$), biomass-fixed carbon ($C_X$), product carbon ($C_P$), mineralized $CO_2$, and carbon balance closure recovery percentage.
  - *Oxygen Transfer & Respiration*: Mean volumetric mass transfer coefficient ($\overline{k_L a}$), minimum dissolved oxygen ($DO_{\min}$), cumulative oxygen uptake integral ($\int OUR \cdot dt$), and hypoxia deficit duration ($t_{\text{hypoxia}}$ where $DO < 15\%$).
  - *Culture Sterility & Quality*: Final culture purity percentage, minimum purity reached, biological axenic/contamination status, and medium osmolarity.
- **4 Synchronized High-Resolution Analytical Charts (Chart.js)**:
  - *Growth & Nutrients*: Dual-axis trajectory of $X(t)$, $S(t)$, $N(t)$, and $P(t)$.
  - *Respiration & Transfer*: Dissolved oxygen $DO(t)$, oxygen uptake rate $OUR(t)$, and $k_L a(t)$.
  - *Specific Kinetic Rates*: $\mu(t)$, $q_S(t)$, and $q_P(t)$.
  - *Quality & Environment*: Culture purity %, broth temperature, pH, and osmolarity.
- **Bioprocess Stoichiometric & Kinetic Verification Table**:
  - Trilingual audit table with 11 formal parameters, symbols, calculated batch values, units, benchmark ranges, and real-time validation badges (`PASS` / `ALERT`).
- **Full Time-Series Telemetry Audit Log**:
  - Searchable, paginated data table displaying all historical timepoints with real-time text query filtering.
- **Dataset Export & GMP Release Dossier**:
  - Full-resolution uncompressed CSV export (`exportFullBatchCSV()`).
  - Scientific JSON batch manifest export (`exportBatchJSON()`).
  - Print-optimized CSS (`@media print`) generating official laboratory summary dossiers.
- **Companion Python Analytics Module**:
  - Added `src/bioprocess_twin/analytics.py` with `compute_batch_kpis()` and comprehensive unit tests in `tests/test_analytics.py`.

---

## [2.0.0] - 2026-11-06

### Added
- **Dynamic Multilingual Strain Cards (i18n Bug Fix)**:
  - Resolved dynamic strain re-rendering issue where strain names, categories, and scientific descriptions remained in English upon language switch.
  - Implemented `renderStrainCards()` triggered on startup, language toggle, and modal activation.
  - Full trilingual descriptions and taxonomy metadata across English (`EN`), Español (`ES`), and Deutsch (`DE`).
- **Expanded 8-Organism Industrial Benchmark Suite (1-Click Presets)**:
  - Expanded library from 4 to 8 industrial and research cell lines:
    - *Escherichia coli BL21(DE3)*: Recombinant protein expression benchmark.
    - *Pichia pastoris (K. phaffii)*: High-density methylotrophic yeast fed-batch.
    - *Saccharomyces cerevisiae*: Classic Crabtree-positive industrial brewer's yeast.
    - *CHO Cells (Mammalian)*: Shear-sensitive monoclonal antibody (mAb) suspension.
    - *Bacillus subtilis 168*: Secretory spore-forming host for industrial amylases and proteases ($\mu_{\max} = 0.55\text{ h}^{-1}$).
    - *Streptomyces coelicolor*: Filamentous actinobacterium for secondary metabolite and antibiotic biosyntheses ($\mu_{\max} = 0.12\text{ h}^{-1}$, high maintenance $\beta$).
    - *Chlorella vulgaris*: High-efficiency phototrophic microalgae for bio-sequestration and lipids ($\mu_{\max} = 0.08\text{ h}^{-1}$).
    - *Lactobacillus plantarum*: Food-grade lactic acid producer with acid tolerance down to pH 3.8 ($\mu_{\max} = 0.42\text{ h}^{-1}$).
- **Version 2.0 Bioprocess Engineering Modules**:
  - **Media Composition Engine & Dual-Nutrient Limiting Kinetics**:
    - Nitrogen state variable ($N$), half-saturation constant $K_n = 0.15\text{ g/L}$, and stoichiometric biomass yield on nitrogen $Y_{x/n} = 5.5\text{ g/g}$.
    - Dual Mancz-Monod kinetic model: $\mu = \mu_{\max} \left(\frac{S}{K_s + S}\right) \left(\frac{N}{K_n + N}\right) \left(\frac{C_L}{K_o + C_L}\right) f(T) f(\text{pH}) I_{\text{osmo}}$.
    - Media Osmolar Stress inhibition function ($I_{\text{osmo}}$) factoring in hypertonic osmolar pressure ($> 350\text{ mOsm/kg}$).
    - Real-time Carbon-to-Nitrogen ($C/N$) mass ratio auditor in SCADA dashboard with dynamic limitation warnings.
    - Interactive Nitrogen Spike feeding button (`+2 g/L`) for fed-batch nitrogen rescue.
  - **Biological & Environmental Contamination Sandbox**:
    - *Bacterial Microflora Competition*: Opportunistic competitor microflora invasion ($X_{\text{contam}}$) depleting nutrients, dropping DO, and tinting broth with a biogenic yellow-green turbidity.
    - *Bacteriophage Lysis Shock*: Exponential viral cascade causing rapid cell membrane rupture, biomass collapse, visual broth clearance, and DO rebound.
    - *Sparger Biofouling*: Gas distributor occlusion reducing volumetric mass transfer coefficient $k_L a$ by 60%.
    - *SIP (Steam-in-Place) & CIP Sanitization*: Thermal-chemical sterilization routine restoring culture purity to 100% and sterilizing competitor load.
- **SCADA UI & Data Export Upgrades**:
  - 4-column responsive operational auditing grid: Hydrodynamics, Carbon Auditor, Media & Contamination Auditor (v2.0), and Thermal & pH Controllers.
  - CSV dataset exporter updated with `Nitrogen_g_L` and `CulturePurity_pct` columns.

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
