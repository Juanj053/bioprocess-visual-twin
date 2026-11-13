/**
 * Shared Analytics & Results Dashboard UI Engine
 * Eliminates code duplication between index.html (#view-dashboard) and dashboard.html,
 * and powers A/B Run Comparison (Run A Baseline vs Active Run B).
 */
import { computeBatchKpis } from './kinetics.js';

export const STORAGE_KEY_BATCH = 'bioprocess_batch_run';
export const STORAGE_KEY_BASELINE = 'bioprocess_baseline_run';

export function loadBatchPayload() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BATCH);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.history) && parsed.history.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return null;
}

export function saveBatchPayload(payload) {
  try {
    localStorage.setItem(STORAGE_KEY_BATCH, JSON.stringify(payload));
  } catch (e) {}
}

export function loadBaselinePayload() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BASELINE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.history) && parsed.history.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return null;
}

export function saveBaselinePayload(payload) {
  try {
    const cloned = JSON.parse(JSON.stringify(payload));
    localStorage.setItem(STORAGE_KEY_BASELINE, JSON.stringify(cloned));
    return cloned;
  } catch (e) {
    return null;
  }
}

export function clearBaselinePayload() {
  try {
    localStorage.removeItem(STORAGE_KEY_BASELINE);
  } catch (e) {}
}

export function getDashboardChartOptions(yTitle, y1Title, isDark, phaseTranslateFn = null) {
  const textColor = isDark ? '#9aa0a6' : '#5f6368';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

  const scales = {
    x: {
      title: { display: true, text: 'Time (h)', color: textColor, font: { family: 'JetBrains Mono', size: 10 } },
      ticks: { color: textColor, font: { family: 'JetBrains Mono', size: 9 }, maxTicksLimit: 12 },
      grid: { color: gridColor }
    },
    y: {
      title: { display: !!yTitle, text: yTitle || '', color: textColor, font: { family: 'JetBrains Mono', size: 10 } },
      ticks: { color: textColor, font: { family: 'JetBrains Mono', size: 9 } },
      grid: { color: gridColor }
    }
  };

  if (y1Title) {
    scales.y1 = {
      position: 'right',
      title: { display: true, text: y1Title, color: textColor, font: { family: 'JetBrains Mono', size: 10 } },
      ticks: { color: textColor, font: { family: 'JetBrains Mono', size: 9 } },
      grid: { drawOnChartArea: false }
    };
  }

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? 'rgba(27, 28, 32, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#f1f3f4' : '#202124',
        bodyColor: isDark ? '#dadce0' : '#3c4043',
        borderColor: isDark ? '#383b42' : '#dadce0',
        borderWidth: 1,
        titleFont: { family: 'JetBrains Mono', size: 11 },
        bodyFont: { family: 'JetBrains Mono', size: 11 },
        callbacks: phaseTranslateFn ? {
          afterTitle: function(context) {
            if (context && context[0]) {
              const idx = context[0].dataIndex;
              const phases = context[0].chart.data.phases;
              if (phases && phases[idx]) {
                const pKey = phases[idx];
                return `[ ${phaseTranslateFn('phase_' + pKey) || pKey.toUpperCase()} ]`;
              }
            }
            return '';
          }
        } : undefined
      }
    },
    scales
  };
}

/**
 * Piecewise-linear interpolation of baseline Run A series onto Run B's timestamps
 * so two simulations of different durations or sampling rates overlay cleanly.
 */
export function interpolateSeriesAtTimes(targetHistory, sourceHistory, field) {
  if (!sourceHistory || sourceHistory.length === 0) return [];
  const srcLen = sourceHistory.length;
  const maxSrcT = sourceHistory[srcLen - 1].time_h;
  let cursor = 0;

  return targetHistory.map((pt) => {
    const t = pt.time_h;
    if (t <= sourceHistory[0].time_h) return sourceHistory[0][field];
    if (t > maxSrcT) return null;
    while (cursor < srcLen - 2 && sourceHistory[cursor + 1].time_h < t) {
      cursor++;
    }
    const p0 = sourceHistory[cursor];
    const p1 = sourceHistory[Math.min(cursor + 1, srcLen - 1)];
    const span = p1.time_h - p0.time_h;
    if (span <= 1e-6) return p0[field];
    const frac = Math.min(1, Math.max(0, (t - p0.time_h) / span));
    return (p0[field] || 0) + frac * ((p1[field] || 0) - (p0[field] || 0));
  });
}

export function buildStoichRows(k) {
  return [
    {
      name: { en: 'Biomass Yield on Substrate', es: 'Rendimiento de Biomasa en Sustrato', de: 'Biomasseausbeute auf Substrat' },
      sym: 'Y_X/S', val: `${k.yxs.toFixed(3)}`, unit: 'g_X / g_S', ref: '0.40 - 0.55', ok: k.yxs >= 0.35 && k.yxs <= 0.60
    },
    {
      name: { en: 'Biomass Yield on Nitrogen', es: 'Rendimiento de Biomasa en Nitrógeno', de: 'Biomasseausbeute auf Stickstoff' },
      sym: 'Y_X/N', val: `${k.yxn.toFixed(2)}`, unit: 'g_X / g_N', ref: '4.5 - 6.5', ok: k.yxn >= 4.0
    },
    {
      name: { en: 'Product Yield on Substrate', es: 'Rendimiento de Producto en Sustrato', de: 'Produktausbeute auf Substrat' },
      sym: 'Y_P/S', val: `${k.yps.toFixed(3)}`, unit: 'g_P / g_S', ref: '0.05 - 0.40', ok: true
    },
    {
      name: { en: 'Max Specific Growth Rate', es: 'Tasa Máxima de Crecimiento Específico', de: 'Max. spezifische Wachstumsrate' },
      sym: 'μ_max', val: `${k.muMaxObs.toFixed(3)}`, unit: 'h⁻¹', ref: '0.05 - 0.85', ok: k.muMaxObs > 0.02
    },
    {
      name: { en: 'Apparent Doubling Time', es: 'Tiempo Aparente de Duplicación', de: 'Scheinbare Verdopplungszeit' },
      sym: 't_d', val: `${k.doublingTime.toFixed(2)}`, unit: 'h', ref: '0.8 - 18.0', ok: k.doublingTime > 0
    },
    {
      name: { en: 'Volumetric Productivity', es: 'Productividad Volumétrica', de: 'Volumetrische Produktivität' },
      sym: 'Q_P', val: `${k.qp.toFixed(3)}`, unit: 'g_P / L / h', ref: '0.05 - 0.50', ok: true
    },
    {
      name: { en: 'Carbon Balance Closure', es: 'Cierre del Balance de Carbono', de: 'Kohlenstoffbilanz-Schluss' },
      sym: '% C_Rec', val: `${k.cRecovery.toFixed(1)}%`, unit: '%', ref: '95.0% - 105.0%', ok: k.cRecovery >= 92.0 && k.cRecovery <= 108.0
    },
    {
      name: { en: 'Mean Mass Transfer Coeff', es: 'Coeficiente Medio de Transferencia', de: 'Mittlerer Stoffübergangskoeffizient' },
      sym: 'kLa', val: `${k.avgKla.toFixed(1)}`, unit: 'h⁻¹', ref: '10.0 - 250.0', ok: k.avgKla > 0
    },
    {
      name: { en: 'Minimum Dissolved Oxygen', es: 'Oxígeno Disuelto Mínimo', de: 'Minimaler gelöster Sauerstoff' },
      sym: 'DO_min', val: `${k.minDO.toFixed(1)}%`, unit: '%', ref: '> 20.0%', ok: k.minDO >= 20.0
    },
    {
      name: { en: 'Hypoxia Duration (DO < 15%)', es: 'Duración de Hipoxia (OD < 15%)', de: 'Hypoxiedauer (DO < 15%)' },
      sym: 't_hypox', val: `${k.hypoxiaHours.toFixed(2)}`, unit: 'h', ref: '0.00 h (Target)', ok: k.hypoxiaHours === 0
    },
    {
      name: { en: 'Culture Sterility & Quality', es: 'Esterilidad y Calidad del Cultivo', de: 'Kultursterilität & Qualität' },
      sym: 'Purity', val: `${k.finalPurity.toFixed(1)}%`, unit: '%', ref: '100.0% (Axenic)', ok: k.finalPurity >= 95.0
    }
  ];
}

export function renderStoichTableDOM(tbody, k, lang = 'en') {
  if (!tbody) return;
  const rows = buildStoichRows(k);
  tbody.innerHTML = rows.map(r => {
    const label = (typeof r.name === 'object') ? (r.name[lang] || r.name.en) : r.name;
    const badge = r.ok
      ? '<span class="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 text-[10px] font-semibold">PASS</span>'
      : '<span class="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 text-[10px] font-semibold">ALERT</span>';
    return `
      <tr class="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition">
        <td class="py-2.5 px-3 font-medium">${label}</td>
        <td class="py-2.5 px-3 text-gray-500 dark:text-gray-400 font-bold">${r.sym}</td>
        <td class="py-2.5 px-3 tabular-nums font-semibold text-gray-900 dark:text-gray-100">${r.val}</td>
        <td class="py-2.5 px-3 text-gray-500 dark:text-gray-400">${r.unit}</td>
        <td class="py-2.5 px-3 text-gray-500 dark:text-gray-400">${r.ref}</td>
        <td class="py-2.5 px-3">${badge}</td>
      </tr>
    `;
  }).join('');
}

export function renderTelemetryTableDOM(tbody, history, limit = '50', filterQuery = '') {
  if (!tbody) return;
  let filtered = history;
  if (filterQuery) {
    filtered = history.filter(h =>
      h.time_h.toString().includes(filterQuery) ||
      h.X.toString().includes(filterQuery) ||
      h.S.toString().includes(filterQuery) ||
      h.DO_pct.toString().includes(filterQuery)
    );
  }
  const rowsToRender = (limit === 'all') ? filtered : filtered.slice(-parseInt(limit, 10));

  if (rowsToRender.length === 0) {
    tbody.innerHTML = '<tr><td colspan="12" class="py-6 text-center text-gray-400 dark:text-gray-500">No telemetry records logged yet.</td></tr>';
    return;
  }

  tbody.innerHTML = rowsToRender.map(h => `
    <tr class="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition">
      <td class="py-1.5 px-3 tabular-nums font-bold text-gray-900 dark:text-gray-100">${h.time_h.toFixed(2)}</td>
      <td class="py-1.5 px-3 tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">${h.X.toFixed(2)}</td>
      <td class="py-1.5 px-3 tabular-nums text-amber-600 dark:text-amber-400 font-semibold">${h.S.toFixed(1)}</td>
      <td class="py-1.5 px-3 tabular-nums text-blue-600 dark:text-blue-400">${h.N.toFixed(2)}</td>
      <td class="py-1.5 px-3 tabular-nums ${h.DO_pct < 20 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-sky-600 dark:text-sky-400'}">${h.DO_pct.toFixed(1)}%</td>
      <td class="py-1.5 px-3 tabular-nums text-purple-600 dark:text-purple-400 font-semibold">${h.P.toFixed(2)}</td>
      <td class="py-1.5 px-3 tabular-nums">${(h.mu || 0).toFixed(3)}</td>
      <td class="py-1.5 px-3 tabular-nums">${(h.kla || 0).toFixed(1)}</td>
      <td class="py-1.5 px-3 tabular-nums">${(h.our || 0).toFixed(1)}</td>
      <td class="py-1.5 px-3 tabular-nums">${(h.temp || 30.0).toFixed(1)}</td>
      <td class="py-1.5 px-3 tabular-nums">${(h.ph || 6.85).toFixed(2)}</td>
      <td class="py-1.5 px-3 tabular-nums font-medium ${(h.culture_purity || 100) < 95 ? 'text-red-500' : 'text-teal-600 dark:text-teal-400'}">${(h.culture_purity !== undefined ? h.culture_purity : 100).toFixed(1)}%</td>
    </tr>
  `).join('');
}

export function buildFullBatchCSV(history) {
  let csv = "Time_h,Biomass_g_L,Substrate_g_L,Nitrogen_g_L,DO_pct,Product_g_L,Mu_h1,kLa_h1,OUR_mmol_L_h,qS_g_g_h,qP_g_g_h,Temp_C,pH,CulturePurity_pct,Osmolarity_mOsm,CN_Ratio\n";
  for (const h of history) {
    csv += `${h.time_h},${h.X},${h.S},${h.N},${h.DO_pct},${h.P},${h.mu},${h.kla},${h.our},${h.qs},${h.qp},${h.temp},${h.ph},${h.culture_purity},${h.osmolarity},${h.cn_ratio}\n`;
  }
  return csv;
}

export function formatDeltaBadge(label, deltaVal, unit, higherIsBetter = true, digits = 2) {
  const sign = deltaVal > 0 ? '+' : '';
  const isNeutral = Math.abs(deltaVal) < Math.pow(10, -(digits + 1));
  const good = higherIsBetter ? deltaVal > 0 : deltaVal < 0;
  let badgeClass = 'bg-gray-100 dark:bg-[#282a2e] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#383b42]';
  if (!isNeutral) {
    badgeClass = good
      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40';
  }
  return `<span class="px-2 py-0.5 rounded-lg border text-[11px] font-mono tabular-nums ${badgeClass}">${label}: <b>${sign}${deltaVal.toFixed(digits)} ${unit}</b></span>`;
}

export function renderComparisonPanelDOM(panelEl, summaryEl, deltasEl, kpisB, baselinePayload, translateFn) {
  if (!panelEl || !summaryEl || !deltasEl) return;
  if (!baselinePayload || !baselinePayload.history || baselinePayload.history.length === 0) {
    summaryEl.innerText = translateFn('ab_none_msg');
    deltasEl.innerHTML = '';
    return;
  }
  const baseMeta = baselinePayload.metadata || {};
  const kpisA = computeBatchKpis(baselinePayload.history, baseMeta);
  summaryEl.innerHTML = `Run A: <b>${baseMeta.strainName || baseMeta.strain || 'Run A'}</b> (${baseMeta.reactorType || 'str_rushton'}, ${kpisA.tEnd.toFixed(1)} h) &rarr; <b>${translateFn('ab_delta_lbl')}</b>`;
  deltasEl.innerHTML = [
    formatDeltaBadge('ΔX', kpisB.deltaX - kpisA.deltaX, 'g/L', true, 2),
    formatDeltaBadge('Final P', kpisB.finalP - kpisA.finalP, 'g/L', true, 2),
    formatDeltaBadge('Q_P', kpisB.qp - kpisA.qp, 'g/L/h', true, 3),
    formatDeltaBadge('Y_X/S', kpisB.yxs - kpisA.yxs, 'g/g', true, 3),
    formatDeltaBadge('Hypoxia', kpisB.hypoxiaHours - kpisA.hypoxiaHours, 'h', false, 2),
    formatDeltaBadge('Purity', kpisB.finalPurity - kpisA.finalPurity, '%', true, 1)
  ].join('');
}
