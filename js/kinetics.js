/**
 * Pure Bioprocess Hydrodynamics, Stiff Heun/Exponential ODE Integrator,
 * History Compaction & Time-Weighted KPI Engine.
 * Zero DOM dependencies — runs identically on the UI thread and inside Web Workers.
 */

export const MAX_HISTORY_POINTS = 1500;
export const RECENT_HIGH_RES_COUNT = 300;

export function createDefaultSimState() {
  return {
    reactorType: 'str_rushton', // 'str_rushton', 'str_marine', 'airlift', 'pbr', 'static'
    volume_L: 20.0,
    rpm: 450,
    vvm: 1.2,
    temp_C: 30.0,
    ph: 6.85,
    activeFault: 'none',
    autoDOEnabled: false,
    targetDOSat: 30.0,
    time_h: 0.0,
    X: 0.80,
    S: 35.0,
    N: 5.0,
    CL: 0.0078,
    P: 0.00,
    C_star: 0.0078,
    X_contam: 0.0,
    phage_titer: 0.0,
    osmolarity_mOsm: 290.0,
    biofouling_factor: 1.0,
    culture_purity: 100.0,
    cn_ratio: 2.80,
    mu_max: 0.35,
    Ks: 2.0,
    Kn: 0.15,
    Ko: 0.0008,
    kd: 0.012,
    Yxs: 0.48,
    Yxn: 5.5,
    ms: 0.020,
    Yxo: 1.10,
    mo: 0.015,
    Yps: 0.85,
    alpha: 0.15,
    beta: 0.010,
    optTemp: 30.0,
    optPh: 6.85,
    tempSigma: 7.0,
    phSigma: 1.1,
    vTipCrit: 3.0,
    kShear: 0.045,
    mu: 0.0,
    netMu: 0.0,
    peakX: 0.80,
    isRunning: true,
    speedMultiplier: 5,
    feedPulseActive: false,
    feedNitrogenPulseActive: false,
    feedPulseTimer: 0.0,
    batchHistory: [],
    s_fed_total: 0.0,
    n_fed_total: 0.0,
    currentStrainKey: 'ecoli',
    initial_X: 0.80,
    initial_S: 35.0,
    initial_N: 5.0,
    activeView: 'sim'
  };
}

export function computeHydrodynamics(state, regimeLabels = null) {
  const D_tank = 0.25;
  const D_impeller = D_tank * 0.35;
  const rho = 1000;
  const mu_visc = 0.001;
  const staticLbl = (regimeLabels && regimeLabels.static) || 'Static (Zero Shear)';
  const turbLbl = (regimeLabels && regimeLabels.turbulent) || 'Fully Turbulent';

  if (state.reactorType === 'static') {
    return {
      Re: 0,
      v_tip: 0.0,
      P_density_kW_m3: 0.0,
      kla: 1.0,
      regime: staticLbl
    };
  }

  const effectiveRpm = (state.activeFault === 'impeller_stall') ? 0.0 : state.rpm;
  const effectiveVvm = (state.activeFault === 'compressor') ? 0.005 : state.vvm;
  const N_rps = effectiveRpm / 60.0;

  const Re = (rho * N_rps * Math.pow(D_impeller, 2)) / mu_visc;
  const v_tip = Math.PI * D_impeller * N_rps;

  let Np = 5.0;
  if (state.reactorType === 'str_marine') Np = 0.87;
  if (state.reactorType === 'airlift') Np = 0.0;
  if (state.reactorType === 'pbr') Np = 0.1;

  const P_watts = Np * rho * Math.pow(N_rps, 3) * Math.pow(D_impeller, 5);
  const P_density_kW_m3 = (P_watts / (state.volume_L / 1000.0)) / 1000.0;

  const Fg_m3_s = (effectiveVvm * state.volume_L) / (1000.0 * 60.0);
  const A_tank = Math.PI * Math.pow(D_tank / 2.0, 2);
  const vs_m_s = Fg_m3_s / A_tank;

  let kla = 0.026 * Math.pow(Math.max(1.0, (P_watts / (state.volume_L / 1000.0))), 0.4) * Math.pow(Math.max(0.0001, vs_m_s), 0.5) * 3600.0;
  if (state.reactorType === 'airlift') {
    kla = 0.32 * Math.pow(Math.max(0.0001, vs_m_s), 0.7) * 3600.0;
  }
  if (state.activeFault === 'compressor') {
    kla = 1.8;
  }
  if (state.activeFault === 'biofouling') {
    kla *= 0.40;
  }
  kla = Math.max(1.0, Math.min(180.0, kla));

  return { Re, v_tip, P_density_kW_m3, kla, regime: turbLbl };
}

export function evaluateKineticsRates(state, snap, hydro, kLysis, activeFault) {
  const X = Math.max(0.0, snap.X);
  const X_contam = Math.max(0.0, snap.X_contam);
  const S = Math.max(0.0, snap.S);
  const N = Math.max(0.0, snap.N);
  const CL = Math.max(0.0, snap.CL);

  const osmoStress = Math.max(0.0, state.osmolarity_mOsm - 350.0);
  const I_osmo = 600.0 / (600.0 + osmoStress);

  let mu = 0.0;
  if (S > 1e-4 && N > 1e-4 && CL > 1e-6) {
    const tOpt = state.optTemp !== undefined ? state.optTemp : 30.0;
    const pOpt = state.optPh !== undefined ? state.optPh : 6.85;
    const tSig = Math.max(0.5, state.tempSigma !== undefined ? state.tempSigma : 7.0);
    const pSig = Math.max(0.1, state.phSigma !== undefined ? state.phSigma : 1.1);
    const temp_factor = Math.exp(-Math.pow((state.temp_C - tOpt) / tSig, 2));
    const ph_factor = Math.exp(-Math.pow((state.ph - pOpt) / pSig, 2));
    mu = state.mu_max * (S / (state.Ks + S)) * (N / (state.Kn + N)) * (CL / (state.Ko + CL)) * temp_factor * ph_factor * I_osmo;
  }

  let mu_contam = 0.0;
  let q_s_contam = 0.0;
  let q_o_contam = 0.0;
  let q_n_contam = 0.0;
  if (X_contam > 1e-5) {
    if (S > 1e-4 && N > 1e-4 && CL > 1e-6) {
      mu_contam = 0.72 * (S / (0.25 + S)) * (N / (0.15 + N)) * (CL / (0.0006 + CL));
    }
    q_s_contam = (mu_contam / 0.40 + 0.02) * X_contam;
    q_o_contam = (mu_contam / 1.05 + 0.015) * X_contam;
    q_n_contam = (mu_contam / 5.2) * X_contam;
  }

  const vTipCrit = Math.max(0.1, state.vTipCrit || 3.0);
  const kdShear = hydro.v_tip > vTipCrit
    ? (state.kShear || 0.045) * Math.pow((hydro.v_tip - vTipCrit) / vTipCrit, 2)
    : 0.0;

  const q_P = S > 1e-4 ? (state.alpha * mu + state.beta) : 0.0;
  const q_O2 = S > 1e-4 ? ((mu / state.Yxo) + state.mo) : 0.0;
  const q_N = N > 1e-4 ? (mu / state.Yxn) : 0.0;

  const netMu = mu - (state.kd + kdShear) - kLysis;
  const dX = netMu * X;
  const dX_contam = (activeFault === 'contam_bacteria')
    ? (mu_contam - 0.01) * X_contam
    : -0.05 * X_contam;
  const dS = S > 1e-4 ? -(((mu / state.Yxs) + state.ms + (q_P / state.Yps)) * X + q_s_contam) : 0.0;
  const dN = N > 1e-4 ? -(q_N * X + q_n_contam) : 0.0;
  const dP = q_P * X;
  const totalOUR_g_L_h = q_O2 * X + q_o_contam;

  return { mu, netMu, mu_contam, dX, dX_contam, dS, dN, dP, totalOUR_g_L_h };
}

export function integrateBioprocessStep(state, dtHours, regimeLabels = null) {
  if (state.activeFault === 'thermal_shock') {
    state.temp_C = 42.0;
  }

  if (state.feedPulseActive) {
    state.S += 5.0;
    state.s_fed_total = (state.s_fed_total || 0.0) + 5.0;
    state.feedPulseActive = false;
  }
  if (state.feedNitrogenPulseActive) {
    state.N += 2.0;
    state.n_fed_total = (state.n_fed_total || 0.0) + 2.0;
    state.feedNitrogenPulseActive = false;
  }

  let hydro = computeHydrodynamics(state, regimeLabels);
  const maxSubDt = Math.min(0.005, 0.25 / Math.max(1.0, hydro.kla));
  const nSteps = Math.max(1, Math.min(400, Math.ceil(dtHours / maxSubDt)));
  const subDt = dtHours / nSteps;

  let actuatorMode = 'standby';
  let lastRates = null;

  for (let stepIdx = 0; stepIdx < nSteps; stepIdx++) {
    if (state.autoDOEnabled && state.reactorType !== 'static') {
      const currentDOSat = (state.CL / state.C_star) * 100.0;
      const doError = state.targetDOSat - currentDOSat;

      if (doError > 2.0) {
        if (state.rpm < 800) {
          state.rpm = Math.min(800, state.rpm + 12.0 * subDt * 60.0);
        } else if (state.vvm < 2.5) {
          state.vvm = Math.min(2.5, state.vvm + 0.15 * subDt * 60.0);
        }
        actuatorMode = 'boosting';
      } else if (doError < -5.0) {
        if (state.vvm > 0.8) {
          state.vvm = Math.max(0.8, state.vvm - 0.1 * subDt * 60.0);
        } else if (state.rpm > 300) {
          state.rpm = Math.max(300, state.rpm - 10.0 * subDt * 60.0);
        }
        actuatorMode = 'throttling';
      } else {
        actuatorMode = 'holding';
      }
      hydro = computeHydrodynamics(state, regimeLabels);
    }

    let kLysis = 0.0;
    if (state.activeFault === 'contam_phage' && state.phage_titer > 0) {
      state.phage_titer = Math.min(50.0, state.phage_titer + 1.5 * subDt);
      kLysis = 1.9 * (state.phage_titer / (1.0 + state.phage_titer));
    }

    const k1 = evaluateKineticsRates(state, state, hydro, kLysis, state.activeFault);

    const cEq1 = state.C_star - (k1.totalOUR_g_L_h / hydro.kla);
    const expFactor = Math.exp(-hydro.kla * subDt);
    const clPred = Math.max(1e-5, Math.min(state.C_star * 1.05, cEq1 + (state.CL - cEq1) * expFactor));

    const snapPred = {
      X: Math.max(0.01, state.X + k1.dX * subDt),
      X_contam: Math.max(0.0, state.X_contam + k1.dX_contam * subDt),
      S: Math.max(0.0, state.S + k1.dS * subDt),
      N: Math.max(0.0, state.N + k1.dN * subDt),
      CL: clPred,
      P: Math.max(0.0, state.P + k1.dP * subDt)
    };

    const k2 = evaluateKineticsRates(state, snapPred, hydro, kLysis, state.activeFault);

    state.X = Math.max(0.01, state.X + 0.5 * (k1.dX + k2.dX) * subDt);
    state.X_contam = Math.max(0.0, state.X_contam + 0.5 * (k1.dX_contam + k2.dX_contam) * subDt);
    state.S = Math.max(0.0, state.S + 0.5 * (k1.dS + k2.dS) * subDt);
    state.N = Math.max(0.0, state.N + 0.5 * (k1.dN + k2.dN) * subDt);
    state.P = Math.max(0.0, state.P + 0.5 * (k1.dP + k2.dP) * subDt);

    const qO2Avg = 0.5 * (k1.totalOUR_g_L_h + k2.totalOUR_g_L_h);
    const cEqAvg = state.C_star - (qO2Avg / hydro.kla);
    state.CL = Math.max(1e-5, Math.min(state.C_star * 1.05, cEqAvg + (state.CL - cEqAvg) * expFactor));

    state.time_h += subDt;
    state.peakX = Math.max(state.peakX || state.X, state.X);
    lastRates = k2;
  }

  const totalBio = state.X + state.X_contam;
  state.culture_purity = totalBio > 0.01 ? (state.X / totalBio) * 100.0 : 100.0;
  state.cn_ratio = (state.S * 0.40) / Math.max(0.01, state.N);
  state.mu = lastRates ? lastRates.mu : 0.0;
  state.netMu = lastRates ? lastRates.netMu : 0.0;

  return { mu: state.mu, kla: hydro.kla, hydro, mu_contam: lastRates ? lastRates.mu_contam : 0.0, actuatorMode };
}

export function buildHistoryPoint(state, simStep = null, displayedDO = undefined) {
  const doPct = displayedDO !== undefined ? displayedDO : ((state.CL / Math.max(1e-6, state.C_star)) * 100.0);
  const muVal = simStep ? simStep.mu : 0.0;
  const klaVal = simStep ? simStep.kla : 0.0;
  const ourVal = simStep ? Math.max(0, klaVal * (state.C_star - state.CL) * 1000.0 / 32.0) : 0.0;
  const qsVal = simStep ? (muVal / (state.Yxs || 0.48) + (state.ms || 0.02)) : 0.0;
  const qpVal = simStep ? (state.alpha * muVal + state.beta) : 0.0;

  return {
    time_h: parseFloat(state.time_h.toFixed(2)),
    X: parseFloat(state.X.toFixed(3)),
    S: parseFloat(state.S.toFixed(2)),
    N: parseFloat(state.N.toFixed(2)),
    DO_pct: parseFloat(doPct.toFixed(1)),
    P: parseFloat(state.P.toFixed(3)),
    mu: parseFloat(muVal.toFixed(3)),
    kla: parseFloat(klaVal.toFixed(1)),
    our: parseFloat(ourVal.toFixed(2)),
    qs: parseFloat(qsVal.toFixed(3)),
    qp: parseFloat(qpVal.toFixed(3)),
    temp: parseFloat(state.temp_C.toFixed(1)),
    ph: parseFloat(state.ph.toFixed(2)),
    culture_purity: parseFloat(state.culture_purity.toFixed(1)),
    osmolarity: Math.round(state.osmolarity_mOsm),
    cn_ratio: parseFloat(state.cn_ratio.toFixed(2)),
    p_density: simStep ? parseFloat(simStep.hydro.P_density_kW_m3.toFixed(3)) : 0.0
  };
}

export function compactHistoryArray(history, maxPoints = MAX_HISTORY_POINTS, tailCount = RECENT_HIGH_RES_COUNT) {
  const len = history.length;
  if (len <= maxPoints) return history;
  const olderEnd = Math.max(1, len - tailCount);
  const compacted = [history[0]];
  for (let i = 1; i < olderEnd; i += 2) {
    compacted.push(history[i]);
  }
  for (let i = olderEnd; i < len; i++) {
    compacted.push(history[i]);
  }
  return compacted;
}

export function computeBatchKpis(history, meta = {}) {
  const first = history[0];
  const last = history[history.length - 1];
  const tEnd = last.time_h;
  const vol = meta.volume_L || 20.0;

  const deltaX = Math.max(0.0, last.X - first.X);
  const totalDCW = last.X * vol;
  const muMaxObs = Math.max(...history.map(h => h.mu || 0), 0.0);
  const doublingTime = muMaxObs > 0.005 ? (Math.LN2 / muMaxObs) : 0.0;

  const sFed = meta.s_fed_total || 0.0;
  const deltaS = Math.max(0.0, (first.S + sFed) - last.S);
  const sConversion = (deltaS / Math.max(0.01, first.S + sFed)) * 100.0;
  const yxs = deltaS > 0.005 ? (deltaX / deltaS) : 0.0;

  const nFed = meta.n_fed_total || 0.0;
  const deltaN = Math.max(0.0, (first.N + nFed) - last.N);
  const yxn = deltaN > 0.005 ? (deltaX / deltaN) : 0.0;

  const deltaP = Math.max(0.0, last.P - first.P);
  const totalP = last.P * vol;
  const qp = tEnd > 0.01 ? (deltaP / tEnd) : 0.0;
  const yps = deltaS > 0.005 ? (deltaP / deltaS) : 0.0;

  const cIn = deltaS * 0.40;
  const cFixed = (deltaX * 0.48) + (deltaP * 0.45);
  const cCO2 = Math.max(0.0, cIn - cFixed);
  const cRecovery = cIn > 0.01 ? (((cFixed + cCO2) / cIn) * 100.0) : 100.0;

  const minDO = Math.min(...history.map(h => h.DO_pct));
  const avgKla = history.reduce((sum, h) => sum + (h.kla || 0), 0) / history.length;

  let totalOUR = 0.0;
  let hypoxiaHours = 0.0;
  for (let i = 1; i < history.length; i++) {
    const dt = Math.max(0.0, (history[i].time_h || 0) - (history[i - 1].time_h || 0));
    totalOUR += 0.5 * ((history[i - 1].our || 0) + (history[i].our || 0)) * dt;
    const h0 = history[i - 1].DO_pct < 15.0 ? 1.0 : 0.0;
    const h1 = history[i].DO_pct < 15.0 ? 1.0 : 0.0;
    hypoxiaHours += 0.5 * (h0 + h1) * dt;
  }

  const finalPurity = last.culture_purity !== undefined ? last.culture_purity : 100.0;
  const minPurity = Math.min(...history.map(h => h.culture_purity !== undefined ? h.culture_purity : 100.0));

  return {
    tEnd,
    vol,
    finalX: last.X,
    finalP: last.P,
    finalOsmo: last.osmolarity || 290,
    deltaX,
    totalDCW,
    muMaxObs,
    doublingTime,
    deltaS,
    sConversion,
    yxs,
    deltaN,
    yxn,
    deltaP,
    totalP,
    qp,
    yps,
    cIn,
    cFixed,
    cCO2,
    cRecovery,
    minDO,
    avgKla,
    totalOUR,
    hypoxiaHours,
    finalPurity,
    minPurity
  };
}
