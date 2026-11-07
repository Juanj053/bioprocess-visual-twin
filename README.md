# <p align="center">bioprocess-visual-twin</p>
<p align="center">
  <strong>Physics-Based Interactive Bioreactor Digital Twin & Real-Time SCADA Telemetry Simulator</strong><br>
  <em>Continuous 60 FPS Hydrodynamic Fluid Rendering, Multi-Vessel Kinetics & Carbon Auditor</em><br>
  Developed by <a href="https://www.linkedin.com/in/juanj-alva">Ing. Juan José Álvarez Morales</a> • <strong>Elevate Biotech</strong>
</p>

<p align="center">
  <a href="https://juanj053.github.io/bioprocess-visual-twin/"><img src="https://img.shields.io/badge/Live%20Demo-Launch%20Simulator-06B6D4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Live Demo"></a>
  <a href="https://juanj053.github.io/bioprocess-visual-twin/dashboard.html"><img src="https://img.shields.io/badge/Analytics-Results%20Dashboard-4F46E5?style=for-the-badge&logo=databricks&logoColor=white" alt="Dashboard"></a>
  <a href="https://github.com/Juanj053/bioprocess-visual-twin/actions"><img src="https://img.shields.io/badge/CI-passing-brightgreen?style=for-the-badge&logo=githubactions&logoColor=white" alt="CI"></a>
  <a href="https://github.com/Juanj053/bioprocess-visual-twin/releases"><img src="https://img.shields.io/badge/Release-v2.3.0-blue?style=for-the-badge" alt="Release"></a>
  <a href="https://www.linkedin.com/in/juanj-alva"><img src="https://img.shields.io/badge/LinkedIn-Juan%20Jos%C3%A9%20%C3%81lvarez-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License"></a>
  <img src="https://img.shields.io/badge/3D%20Engine-Three.js%20WebGL-10B981?style=for-the-badge&logo=threedotjs&logoColor=white" alt="Engine">
</p>

---

### 🌐 [Launch Live Interactive 3D Simulator](https://juanj053.github.io/bioprocess-visual-twin/) • 📊 [Open Dedicated Results & Analytics Dashboard](https://juanj053.github.io/bioprocess-visual-twin/dashboard.html)

---

## 🧬 Executive Overview

In biochemical engineering and precision industrial biotechnology, computer simulations are traditionally confined to abstract terminal logs or static 2D Matplotlib plots. Engineers and students rarely get to **see and feel** the physical coupling between agitation speed, aeration micro-bubbles, fluid shear, and microbial biomass proliferation.

**`bioprocess-visual-twin`** bridges computational ODE kinetics with real-time **photorealistic 3D WebGL rendering powered by Three.js**. It allows bioengineers, researchers, and operators to interactively experiment with:
- **360° Interactive OrbitControls**: Pan, tilt, and zoom around the vessel in 3D with pre-configured camera view presets (Front, Impeller zoom, Vortex top-down).
- **Physical Borosilicate Glass & Stainless 316L Headplate**: PBR transmission materials with specular highlights, tri-clamp ports, and motor housing.
- **Dynamic 3D Impeller Swirl**: Rotating dual Rushton turbines or marine axial hydrofoils driving fluid mixing at real RPM.
- **Interactive 3D Bubble Swarm**: Helical swirl, radial dispersion, and buoyancy velocity scaling dynamically with aeration (vvm).
- **Broth Optical Turbidity ($OD_{600}$)**: Transitioning from translucent nutrient broth to dense golden-amber cell suspensions as biomass grows.
- **Active Thermal Jacket**: Real-time status glow reflecting heating/cooling PID controllers.
- **Fed-batch substrate pulse injection**: Instant visual and kinetic response upon glucose feeding.
- **Adaptive Mobile Ergonomics & Touch Controls (v2.2.0)**: Responsive 3D viewport height, touch anti-trapping mode (`3D Orbit` vs `Page Scroll`), swipeable vessel carousel, collapsible quick action drawer, segmented mobile subtabs, and coarse-pointer slider ergonomics.
- **Automatic Growth Phase Differentiation & Visual Shading (v2.3.0)**: Algorithmic detection and real-time visualization of the canonical microbial growth phases (**Lag**, **Exponential / Log**, **Deceleration**, **Stationary**, and **Lysis / Death**). Shaded canvas background bands in SCADA telemetry and batch analytics charts, real-time live SCADA phase badge, interactive milestone segmentation bar, and phase-annotated tooltips.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                          BIOPROCESS VISUAL TWIN 3D ARCHITECTURE (THREE.JS + ANALYTICS)                 │
└───────────────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                                    │
        ┌───────────────────────────────────────────┼───────────────────────────────────────────┐
        ▼                                           ▼                                           ▼
[ 3D WEBGL PBR RENDERER ]                   [ COUPLED ODE ENGINE ]                      [ RESULTS & SCADA DASHBOARD ]
• 360° OrbitControls Camera                 • Dual Monod Growth: μ(S, CL)               • 6 Executive Batch KPIs
• Borosilicate Glass Transmission           • Dual Carbon/Nitrogen Balances             • 4 Synchronized Chart.js Plots
• Rushton, Marine & Static Models           • Oxygen Transfer: kla(C* - CL)             • Stoichiometric Audit (11 metrics)
• 3D Helical Bubble Swarm                   • Luedeking-Piret: dP/dt                    • Uncompressed Telemetry Inspector
• Real-time Broth Turbidity (OD600)         • Environmental Contamination Kinetics      • Trilingual (EN / ES / DE) Support
• Active Thermal Jacket Glow                • Temperature & pH Arrhenius                • CSV & JSON Export / Print Layout
```

---

## ⚙️ Supported Bioreactor Vessels

| Vessel Type | Agitation Mechanism | Hydrodynamic Features | Best Application |
| :--- | :--- | :--- | :--- |
| **STR (Rushton Turbines)** | Dual 6-blade disk turbines ($N_p = 5.0$) + 4 wall baffles | Radial flow, high gas dispersion, high shear stress | Microbial high-density fermentation (*E. coli*, Yeast) |
| **STR (Marine Propeller)** | 3-blade axial hydrofoil ($N_p = 0.87$) | Top-to-bottom axial circulation, low shear stress | Shear-sensitive mammalian cell culture (CHO, Hybridoma) |
| **Airlift Loop Bioreactor** | Concentric internal draft tube (No moving parts) | Riser gas-lift flow, downcomer recirculation | Filamentous fungi, pelleted cultures, low energy demand |
| **Photobioreactor (PBR)** | External illumination + $\text{CO}_2$ injection | Spectral irradiance tuning, photosynthetic carbon capture | Microalgae (*Chlorella*, *Spirulina*), cyanobacteria |

---

## 📐 Mathematical & Hydrodynamic Formulation

### 1. Mass Transfer & Power Consumption (Van't Riet)
For stirred vessels:
$$P = N_p \cdot \rho \cdot N^3 \cdot D_i^5 \quad [\text{Watts}]$$
$$\frac{P}{V} = \frac{P}{V_L} \quad [\text{kW/m}^3]$$
$$k_L a = 0.026 \cdot \left(\frac{P}{V}\right)^{0.4} \cdot (v_s)^{0.5} \cdot 3600 \quad [\text{h}^{-1}]$$

For bubble columns and airlift vessels:
$$k_L a = 0.32 \cdot (v_s)^{0.7} \cdot 3600 \quad [\text{h}^{-1}]$$
where $v_s = \frac{F_g}{A_{\text{tank}}}$ is the superficial gas velocity.

### 2. Dual Monod & Coupled ODEs
$$\mu(S, C_L) = \mu_{\max} \cdot \left( \frac{S}{K_S + S} \right) \cdot \left( \frac{C_L}{K_{O_2} + C_L} \right) \cdot f(T) \cdot f(\text{pH})$$

$$\frac{dX}{dt} = (\mu - k_d) X$$
$$\frac{dS}{dt} = - \left( \frac{\mu}{Y_{X/S}} + m_S + \frac{\alpha \mu + \beta}{Y_{P/S}} \right) X$$
$$\frac{dC_L}{dt} = k_L a \cdot (C^* - C_L) - \left( \frac{\mu}{Y_{X/O_2}} + m_{O_2} \right) X$$
$$\frac{dP}{dt} = (\alpha \mu + \beta) X$$

---

## 🚀 Quick Start

### 1. Instant Browser Execution (Zero Install)
Launch the application directly in any modern desktop or mobile browser:
👉 **[juanj053.github.io/bioprocess-visual-twin](https://juanj053.github.io/bioprocess-visual-twin/)**

### 2. Local Python Installation
```bash
git clone https://github.com/Juanj053/bioprocess-visual-twin.git
cd bioprocess-visual-twin

# Install via uv or pip
uv pip install -e ".[dev]"

# Run unit tests
pytest -v tests/

# Launch local simulation CLI
bioprocess-twin simulate --type str_rushton --duration 40.0 --rpm 450 --output results/run.csv

# Launch interactive UI in your default browser
bioprocess-twin ui
```

---

## 📂 Repository Architecture

```
bioprocess-visual-twin/
├── .github/workflows/
│   └── deploy-pages.yml         # Automated GitHub Actions test and GitHub Pages deployment
├── src/bioprocess_twin/
│   ├── __init__.py              # Package entrypoint (v2.3.0)
│   ├── kinetics.py              # Hydrodynamics (Re, P/V, kla) and Monod ODE system
│   ├── simulator.py             # Numerical stiff Radau / RK45 timecourse solver
│   ├── analytics.py             # Batch KPIs, Carbon closure, stoichiometric audit, and growth phases
│   └── cli.py                   # Command-line interface (simulate, ui)
├── tests/
│   ├── test_kinetics.py         # Unit tests for hydrodynamics and derivatives
│   ├── test_simulator.py        # Numerical integration trajectory tests
│   └── test_analytics.py        # Stoichiometric & KPI verification tests
├── index.html                   # 3D Twin + Integrated Results Dashboard (EN/ES/DE)
├── dashboard.html               # Dedicated Standalone Batch Analytics Dashboard
├── pyproject.toml               # PEP 517/621 packaging (Hatchling)
├── CITATION.cff                 # Academic citation metadata
├── LICENSE                      # MIT License
└── README.md                    # Documentation & scientific guide
```

---

## 💡 Academic Inspiration & Open-Source References

This digital twin simulator synthesizes pioneering open-source principles and industrial control architectures:
- **Fault Resilience & Perfusion Modeling:** Process disturbance concepts and real-time fault injection architectures inspired by the open-source mammalian digital twin work of *Ashray et al.* ([`bioreactor-digital-twin`](https://github.com/Ashray16/bioreactor-digital-twin)).
- **Cascading Process Control:** Cascade dissolved oxygen control and aeration loops influenced by the open-source automated bioreactor platform *Pioreactor* ([`Pioreactor/pioreactor`](https://github.com/Pioreactor/pioreactor)).
- **Biochemical Engineering Principles:** Multiphase mass transfer correlations ($k_L a$ via Van't Riet, 1979) and mixed-growth product formation (*Luedeking & Piret, 1959*) adapted from standard biochemical engineering treatises (*Bailey & Ollis; Doran, 2013*).

---

## 📜 Citation

If you utilize this simulator in your academic coursework, research publications, or industrial training programs, please cite:

```bibtex
@software{alvarez_morales_2026_bioprocess_visual_twin,
  author       = {Álvarez Morales, Juan José},
  title        = {bioprocess-visual-twin: Physics-based Interactive Bioreactor Digital Twin and Real-time SCADA Telemetry Simulator},
  month        = nov,
  year         = 2026,
  publisher    = {GitHub},
  version      = {2.3.0},
  url          = {https://github.com/Juanj053/bioprocess-visual-twin}
}
```

---

## 👨‍🔬 Author & Collaborations

**Ing. Juan José Álvarez Morales**  
*Biotechnology Engineer (Universidad Técnica de Ambato)*  
*Founder & Chief Bioengineer at Elevate Biotech • Research Lead at Agromanper*  
Ambato, Ecuador 🇪🇨  

- **LinkedIn:** [linkedin.com/in/juanj-alva](https://www.linkedin.com/in/juanj-alva)  
- **Email:** [jjalvarezm77@gmail.com](mailto:jjalvarezm77@gmail.com)  
- **GitHub:** [@Juanj053](https://github.com/Juanj053)  
- **Research Collaboration:** Open for academic collaborations, biomanufacturing scale-up modeling, and digital twin deployment.
