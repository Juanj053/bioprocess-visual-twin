/**
 * Automatic Microbial Growth Phase Classification & Visualization Helper
 * Shared across live SCADA telemetry and Results Dashboard.
 */

export const GrowthPhaseMeta = {
  lag: {
    key: 'lag',
    color: '#94a3b8',
    bgLight: 'rgba(148, 163, 184, 0.12)',
    bgDark: 'rgba(148, 163, 184, 0.08)',
    dotClass: 'bg-slate-400',
    badgeBg: 'bg-slate-100 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800/40',
    short: 'LAG'
  },
  exponential: {
    key: 'exponential',
    color: '#10b981',
    bgLight: 'rgba(16, 185, 129, 0.10)',
    bgDark: 'rgba(16, 185, 129, 0.10)',
    dotClass: 'bg-emerald-500 animate-pulse',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
    short: 'LOG / EXP'
  },
  deceleration: {
    key: 'deceleration',
    color: '#f59e0b',
    bgLight: 'rgba(245, 158, 11, 0.10)',
    bgDark: 'rgba(245, 158, 11, 0.10)',
    dotClass: 'bg-amber-500',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
    short: 'DECEL'
  },
  stationary: {
    key: 'stationary',
    color: '#8b5cf6',
    bgLight: 'rgba(139, 92, 246, 0.10)',
    bgDark: 'rgba(139, 92, 246, 0.10)',
    dotClass: 'bg-purple-500',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40',
    short: 'STAT'
  },
  death: {
    key: 'death',
    color: '#ef4444',
    bgLight: 'rgba(239, 68, 68, 0.12)',
    bgDark: 'rgba(239, 68, 68, 0.14)',
    dotClass: 'bg-rose-500',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40',
    short: 'LYSIS / DEATH'
  }
};

export function classifyInstantaneousPhase(state, strainsCatalog = null) {
  if (!state) return 'lag';
  const X = state.X;
  const S = state.S;
  const N = state.N;
  const mu = state.mu || 0;
  const netMu = state.netMu !== undefined ? state.netMu : mu;
  const strainObj = (strainsCatalog && strainsCatalog[state.currentStrainKey]) ? strainsCatalog[state.currentStrainKey] : null;
  const muMax = state.mu_max || (strainObj && strainObj.mu_max) || 0.65;
  const x0 = state.initial_X || 0.8;
  const peakX = Math.max(x0, state.peakX || X);
  const purity = state.culture_purity !== undefined ? state.culture_purity : (state.purity_pct !== undefined ? state.purity_pct : 100.0);
  const fault = state.activeFault || 'none';

  if (fault === 'contam_phage' || fault === 'phage' || purity < 80.0 || (netMu < -0.015 && (peakX - X > 0.10 || netMu < -0.05))) {
    return 'death';
  }
  if (S <= 0.8 || (X >= x0 + 1.2 && mu < 0.04 && S <= 2.0)) {
    return 'stationary';
  }
  if (state.time_h <= 2.2 || (X < x0 + 0.40 && mu < 0.22 * muMax)) {
    return 'lag';
  }
  if (mu < 0.38 * muMax || S <= 4.0 || N <= 0.5) {
    return 'deceleration';
  }
  return 'exponential';
}

export function analyzeBatchGrowthPhases(history, strainMuMax = 0.65) {
  if (!history || history.length === 0) return { pointPhases: [], segments: [], currentPhase: 'lag' };
  const pointPhases = [];
  const xArr = history.map(h => h.X);
  const xMax = Math.max(...xArr);
  const x0 = history[0].X;
  const deltaXTot = Math.max(0.1, xMax - x0);
  const muArr = history.map(h => h.mu || 0);
  const obsMuMax = Math.max(0.05, ...muArr);

  let currentState = 'lag';

  for (let i = 0; i < history.length; i++) {
    const h = history[i];
    const xi = h.X;
    const si = h.S;
    const mui = h.mu || 0;
    const purity = h.culture_purity !== undefined ? h.culture_purity : (h.purity_pct !== undefined ? h.purity_pct : 100.0);
    const ti = h.time_h;

    if (currentState === 'lag') {
      if ((purity < 80.0 && xi < xMax - 0.15) || (xi < xMax - 0.25 && mui < -0.015)) {
        currentState = 'death';
      } else if (si <= 0.8) {
        currentState = 'stationary';
      } else if ((xi >= x0 + 0.06 * deltaXTot && mui >= 0.20 * obsMuMax) || (ti >= 2.5 && mui >= 0.20 * obsMuMax)) {
        currentState = 'exponential';
      }
    } else if (currentState === 'exponential') {
      if ((purity < 80.0 && xi < xMax - 0.15) || (xi < xMax - 0.25 && mui < -0.015)) {
        currentState = 'death';
      } else if (si <= 0.8 || (xi >= xMax * 0.97 && mui < 0.04)) {
        currentState = 'stationary';
      } else if (si <= 4.0 || (xi >= x0 + 0.75 * deltaXTot && mui < 0.30 * obsMuMax)) {
        currentState = 'deceleration';
      }
    } else if (currentState === 'deceleration') {
      if ((purity < 80.0 && xi < xMax - 0.15) || (xi < xMax - 0.25 && mui < -0.015)) {
        currentState = 'death';
      } else if (si <= 0.8 || (xi >= xMax * 0.96 && mui < 0.05)) {
        currentState = 'stationary';
      } else if (si > 8.0 && mui >= 0.40 * obsMuMax && (i > 0 && history[i - 1].S <= 4.0)) {
        currentState = 'exponential';
      }
    } else if (currentState === 'stationary') {
      if ((purity < 80.0 && xi < xMax - 0.15) || (xi < xMax - 0.30 && mui < -0.015)) {
        currentState = 'death';
      } else if (si > 5.0 && mui >= 0.20 * obsMuMax) {
        currentState = 'exponential';
      }
    }
    pointPhases.push(currentState);
  }

  const segments = [];
  if (history.length > 0) {
    let curr = pointPhases[0];
    let startIdx = 0;
    for (let i = 1; i < history.length; i++) {
      if (pointPhases[i] !== curr) {
        segments.push({
          phase: curr,
          startIndex: startIdx,
          endIndex: i - 1,
          startTime: history[startIdx].time_h,
          endTime: history[i - 1].time_h,
          duration: Math.max(0.1, history[i - 1].time_h - history[startIdx].time_h),
          deltaX: history[i - 1].X - history[startIdx].X,
          startX: history[startIdx].X,
          endX: history[i - 1].X,
          maxMu: Math.max(...muArr.slice(startIdx, i))
        });
        curr = pointPhases[i];
        startIdx = i;
      }
    }
    segments.push({
      phase: curr,
      startIndex: startIdx,
      endIndex: history.length - 1,
      startTime: history[startIdx].time_h,
      endTime: history[history.length - 1].time_h,
      duration: Math.max(0.1, history[history.length - 1].time_h - history[startIdx].time_h),
      deltaX: history[history.length - 1].X - history[startIdx].X,
      startX: history[startIdx].X,
      endX: history[history.length - 1].X,
      maxMu: Math.max(...muArr.slice(startIdx))
    });
  }

  return {
    pointPhases,
    segments,
    currentPhase: pointPhases[pointPhases.length - 1] || 'lag'
  };
}

export function renderGrowthPhaseBreakdownDOM(phaseAnalysis, targetPrefix = 'dash-', translateFn = (k) => k) {
  const bar = document.getElementById(`${targetPrefix}growth-phase-bar`);
  const legend = document.getElementById(`${targetPrefix}growth-phase-legend`);
  if (!bar || !legend || !phaseAnalysis || !phaseAnalysis.segments) return;

  const totalDuration = phaseAnalysis.segments.reduce((acc, s) => acc + s.duration, 0) || 1;

  bar.innerHTML = phaseAnalysis.segments.map(seg => {
    const meta = GrowthPhaseMeta[seg.phase] || GrowthPhaseMeta.lag;
    const pct = Math.max(3, (seg.duration / totalDuration) * 100);
    return `<div style="width: ${pct}%; background-color: ${meta.color};" class="h-full transition-all" title="${translateFn('phase_' + seg.phase)}: ${seg.startTime.toFixed(1)}h - ${seg.endTime.toFixed(1)}h (${seg.duration.toFixed(1)}h)"></div>`;
  }).join('');

  legend.innerHTML = phaseAnalysis.segments.map(seg => {
    const meta = GrowthPhaseMeta[seg.phase] || GrowthPhaseMeta.lag;
    return `
      <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${meta.badgeBg}">
        <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${meta.color}"></span>
        <span>${translateFn('phase_' + seg.phase)}:</span>
        <b>${seg.startTime.toFixed(1)}-${seg.endTime.toFixed(1)}h</b>
        <span class="text-gray-400">(&Delta;X: ${seg.deltaX >= 0 ? '+' : ''}${seg.deltaX.toFixed(2)})</span>
      </span>
    `;
  }).join('');
}

export function createGrowthPhaseBackgroundPlugin(getIsDarkFn) {
  return {
    id: 'growthPhaseBackground',
    beforeDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea || !scales.x) return;
      const phases = chart.data.phases;
      if (!phases || phases.length < 2) return;

      const isDark = getIsDarkFn ? getIsDarkFn() : true;
      ctx.save();

      let currPhase = phases[0];
      let startIdx = 0;

      for (let i = 1; i <= phases.length; i++) {
        if (i === phases.length || phases[i] !== currPhase) {
          const xLeft = scales.x.getPixelForValue(startIdx);
          const xRight = (i === phases.length) ? chartArea.right : scales.x.getPixelForValue(i - 1);

          const meta = GrowthPhaseMeta[currPhase] || GrowthPhaseMeta.lag;
          ctx.fillStyle = isDark ? meta.bgDark : meta.bgLight;
          const w = Math.max(0, xRight - xLeft);
          ctx.fillRect(xLeft, chartArea.top, w, chartArea.bottom - chartArea.top);

          if (chart.canvas && chart.canvas.id === 'dashChartGrowth' && w > 28) {
            ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.40)' : 'rgba(0, 0, 0, 0.40)';
            ctx.font = '600 9px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(meta.short, xLeft + w / 2, chartArea.top + 13);
          }

          if (i < phases.length) {
            ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(xRight, chartArea.top);
            ctx.lineTo(xRight, chartArea.bottom);
            ctx.stroke();
            ctx.setLineDash([]);
            currPhase = phases[i];
            startIdx = i;
          }
        }
      }
      ctx.restore();
    }
  };
}
