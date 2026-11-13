/**
 * Web Worker Fast-Forward Bioprocess Trajectory Solver
 * Executes full-batch or horizon-step ODE trajectories off the main 60 FPS UI thread.
 */
import {
  integrateBioprocessStep,
  buildHistoryPoint,
  compactHistoryArray,
  MAX_HISTORY_POINTS,
  RECENT_HIGH_RES_COUNT
} from './kinetics.js';

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  if (type !== 'RUN_FAST_FORWARD') return;

  const t0 = performance.now();
  const {
    state,
    existingHistory = [],
    durationHours = 48.0,
    sampleIntervalHours = 0.25,
    mode = 'restart', // 'restart' | 'continue'
    labels = null
  } = payload || {};

  const simState = Object.assign({}, state);
  let history = [];

  if (mode === 'restart') {
    simState.time_h = 0.0;
    simState.X = simState.initial_X || 0.80;
    simState.peakX = simState.X;
    simState.netMu = 0.0;
    simState.mu = 0.0;
    simState.X_contam = simState.activeFault === 'contam_bacteria' ? 0.05 : 0.0;
    simState.phage_titer = simState.activeFault === 'contam_phage' ? 0.5 : 0.0;
    simState.culture_purity = 100.0;
    simState.S = simState.initial_S || 35.0;
    simState.N = simState.initial_N || 5.0;
    simState.CL = simState.C_star || 0.0078;
    simState.P = 0.0;
    simState.s_fed_total = 0.0;
    simState.n_fed_total = 0.0;
    history.push(buildHistoryPoint(simState, null));
  } else {
    history = Array.isArray(existingHistory) ? existingHistory.slice() : [];
    if (history.length === 0) {
      history.push(buildHistoryPoint(simState, null));
    }
  }

  const dt = Math.max(0.05, sampleIntervalHours);
  const totalSteps = Math.max(1, Math.round(durationHours / dt));

  for (let i = 0; i < totalSteps; i++) {
    const stepDt = (i === totalSteps - 1) ? Math.max(1e-4, durationHours - i * dt) : dt;
    const simStep = integrateBioprocessStep(simState, stepDt, labels);
    const satPct = Math.min(105.0, Math.max(0.0, (simState.CL / Math.max(1e-6, simState.C_star)) * 100.0));
    const displayedDO = simState.activeFault === 'sensor_drift' ? Math.min(100.0, satPct * 1.25) : satPct;
    history.push(buildHistoryPoint(simState, simStep, displayedDO));
    if (history.length > MAX_HISTORY_POINTS) {
      history = compactHistoryArray(history, MAX_HISTORY_POINTS, RECENT_HIGH_RES_COUNT);
    }
  }

  const elapsedMs = performance.now() - t0;

  self.postMessage({
    type: 'FAST_FORWARD_DONE',
    payload: {
      mode,
      durationHours,
      elapsedMs,
      finalState: simState,
      history
    }
  });
});
