import * as d3 from "npm:d3";
import { precalculateHeights, calculateCX } from "./plotDot.js";
import { settings } from "./settings.js";
import { ScrollInteraction } from "./scrollInteraction.js";
import { parse } from "npm:path-data";
import { color as d3color } from "npm:d3-color";
import { interpolateRgb } from "npm:d3-interpolate";

const { ageMin, ageMax } = settings;

// Helper to convert snake_case to camelCase
export function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

// Functions
export function set(input, value) {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

export function generateParticipantData(meanSleep, sdSleep, n, name, extent) {
  const data = [];
  const normalSleep = d3.randomNormal(meanSleep, sdSleep);

  for (let i = 0; i < n; i++) {
    let randSleep = normalSleep(); // directly generates a normally distributed sleep time
    let randAge = extent[0] + Math.random() * (extent[1] - extent[0]);

    data.push({ study: name, sleepTime: randSleep, age: randAge });
  }
  return data;
}

export function calculateQuantiles(data, n) {
  const filteredData = data
    .map((d) => d.sleepTime)
    .filter((d) => d !== null && !isNaN(d));

  const quantiles = [];

  // Calculate quantile positions using integers, then convert to float
  for (let i = 1; i <= n; i++) {
    const p = (0.5 + i - 1) / n; // Avoid cumulative floating-point errors
    const q = d3.quantileSorted(filteredData, p);
    quantiles.push({ p: parseFloat(p.toFixed(10)), q }); // Format `p` to limit floating-point precision
  }
  return quantiles;
}

export function calculatePercentiles(data) {
  const filteredData = data
    .map((d) => d.sleepTime)
    .filter((d) => d !== null && !isNaN(d));

  // Array to store percentiles from 0 to 100
  let agePercentiles = Array.from({ length: 91 }, (v, i) => {
    let p = (i + 5) / 100; // p ranges from 0.05 to 0.95
    return {
      age: data.x0,
      p: p,
      q: d3.quantileSorted(filteredData, p),
    };
  });
  return agePercentiles;
}

/**
 * Retrieves the nearestPValue for a given age and sleeptime from the dataSet Map.
 * Safely handles undefined values for age or sleeptime.
 *
 * @param {Map<number, any>} dataSet - The Map where each key is the bin's start age (e.g., 5, 6, 7...),
 *                                     and each value is an object that has { ageRange, estimatesData, ... }.
 * @param {number|undefined} age - The age we want to look up. Might be undefined.
 * @param {number|undefined} sleeptime - The sleeptime value whose nearestPValue we want to retrieve. Might be undefined.
 * @returns {number|null} The nearestPValue if found, otherwise null.
 */
export function getNearestPValue(dataSet, age, sleeptime) {
  // 1. Find the correct bin object in the Map for the specified age
  //    Each entry in dataSet is like:
  //    key: <startAge>
  //    value: {
  //       ageRange: { start, end },
  //       boxPlotData: { ... },
  //       dotPlotData: [...],
  //       estimatesPlotData: [
  //         { sleeptime: 4, nearestPValue: 0.05 },
  //         ...
  //       ],
  //       percentilePlotData: [...]
  //    }
  if (typeof age === "undefined" || typeof sleeptime === "undefined") {
    console.warn("Either age or sleeptime is undefined; returning null.");
    return null;
  }

  let binObj = null;

  for (let [binStartAge, binValue] of dataSet.entries()) {
    const { start, end } = binValue.ageRange;
    if (age >= start && age < end) {
      binObj = binValue;
      break;
    }
  }

  if (!binObj) {
    console.warn(`No bin found for age ${age}`);
    return null;
  }

  // 2. Among this bin’s estimatesData array, find the item whose sleeptime is closest to the requested sleeptime
  const { estimatesPlotData } = binObj;
  if (!estimatesPlotData || !Array.isArray(estimatesPlotData)) {
    console.warn(
      `No valid estimatesPlotData array found for age range [${binObj.ageRange.start}, ${binObj.ageRange.end})`,
    );
    return null;
  }

  const bestMatch = estimatesPlotData.reduce((acc, cur) => {
    if (!acc) return cur;
    const distAcc = Math.abs(acc.sleeptime - sleeptime);
    const distCur = Math.abs(cur.sleeptime - sleeptime);
    return distCur < distAcc ? cur : acc;
  }, null);

  // 3. Return the nearestPValue (or null if nothing was found)
  return bestMatch ? bestMatch.nearestPValue : null;
}

export function getTruePercentage(
  dataSet,
  { age = undefined, sleepTime = undefined } = {},
) {
  // Use optional chaining and fallback values
  const trueValue =
    dataSet.get(age)?.estimatesPlotData?.find((d) => d.sleeptime === sleepTime)
      ?.nearestPValue ?? null;

  return trueValue;
}

export function getTrueSleep(
  dataSet,
  { age = undefined, percentage = undefined } = {},
) {
  const estimatesPlotData = dataSet.get(age)?.estimatesPlotData;

  if (
    !Array.isArray(estimatesPlotData) ||
    typeof percentage !== "number" ||
    Number.isNaN(percentage)
  ) {
    return null;
  }

  const bestMatch = estimatesPlotData.reduce((acc, cur) => {
    if (
      typeof cur.nearestPValue !== "number" ||
      Number.isNaN(cur.nearestPValue)
    ) {
      return acc;
    }

    if (!acc) return cur;

    const distAcc = Math.abs(acc.nearestPValue - percentage);
    const distCur = Math.abs(cur.nearestPValue - percentage);
    return distCur < distAcc ? cur : acc;
  }, null);

  return bestMatch ? bestMatch.sleeptime : null;
}

// probability density function

export function epanechnikov(bandwidth) {
  return (x) =>
    Math.abs((x /= bandwidth)) <= 1 ? (0.75 * (1 - x * x)) / bandwidth : 0;
}

export function kde(kernel, thresholds, data) {
  return thresholds.map((t) => [t, d3.mean(data, (d) => kernel(t - d))]);
}

// Helper function to parse URL parameters
export function getURLParameter(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

export const ageFormat = d3.format("02");

export function formatTime(value) {
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

export function createDebouncedLogger(callback, delay) {
  let timer;
  return (data) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      callback(data);
    }, delay);
  };
}

export function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Computes the new x-domain and total width but does not modify the original scale.
 * @param {Object} xScale - D3 scale object for x-axis.
 * @param {Object} stepProps - Current scrollytelling step properties.
 * @param {number} width - New chart width.
 * @param {number} margin - Margin settings.
 * @returns {Object} - Returns { totalWidth }
 */
export function updateXDomain(xScale, stepProps, width, margin) {
  const absoluteDomain = stepProps.xDomain[1] - stepProps.xDomain[0];
  const domainWithOffset = ageMin + absoluteDomain;
  const newDomain = [ageMin, domainWithOffset];

  // Create a copy of xScale to perform calculations
  const tempScale = xScale.copy();
  tempScale.domain(newDomain).range([margin.left, width - margin.right]);
  const totalWidth = tempScale(ageMax - 1) + margin.right;

  // Return values without mutating the original xScale
  return { totalWidth };
}

export function programmaticScroll({
  targetDomainLeft,
  element,
  xScale,
  duration,
}) {
  const targetScroll = xScale(targetDomainLeft);

  d3.transition()
    .duration(duration)
    .tween("scrollTween", function () {
      const interpolator = d3.interpolateNumber(
        element.scrollLeft,
        targetScroll,
      );
      return function (t) {
        /* console.log("tween", interpolator(t)); */
        element.scrollLeft = interpolator(t);
      };
    });
}

/**
 * Utility function to round a value to the nearest step.
 * @param {number} value - The value to round.
 * @param {number} step - The step size for rounding.
 * @returns {number} - The rounded value.
 */
export function roundToStep(value, step) {
  return Math.round(value / step) * step;
}

export function toTurtle(svgPath, options = {}) {
  const { scaleFn = (area) => Math.sqrt(area) / 16 } = options;
  const type = { M: "moveTo", L: "lineTo", C: "bezierCurveTo", Z: "closePath" };
  const segs = parse(svgPath, { normalize: true });
  const cmds = segs.map(
    (s) => (ctx, len) => ctx[type[s.type]](...s.values.map((d) => d * len)),
  );
  return (ctx, area) => cmds.forEach((fn) => fn(ctx, scaleFn(area)));
}

/**
 * Resolves a CSS color string to a hex value.
 * If already hex, returns as-is. If color-mix(), parses and mixes.
 * @param {string} colorStr - CSS color string (hex, rgb, color-mix, etc)
 * @returns {string} Hex color string (e.g. #e9e7e5)
 */
export function resolveCssColor(colorStr) {
  const hexRegex = /^#([0-9a-fA-F]{3,8})$/;
  const input = (colorStr ?? "").trim();
  if (hexRegex.test(input)) {
    return input;
  }
  const cssVar = getCssVar(colorStr);
  const resolved = cssVar || input;
  if (hexRegex.test(resolved)) {
    return resolved;
  }
  if (resolved.trim().startsWith("color-mix(")) {
    try {
      return colorMixToHex(resolved);
    } catch (e) {
      // fallback: return original string if parsing fails
      return resolved;
    }
  }
  // Optionally, handle rgb()/rgba() or named colors here if needed
  return resolved;
}

export function colorMixToHex(input) {
  const m = input.match(
    /^color-mix\(\s*in\s+([a-z-]+)\s*,\s*(.*?)\s*,\s*(.*?)\s*\)$/i,
  );
  if (!m) throw new Error("Invalid color-mix() string");
  const space = m[1].toLowerCase();
  if (space !== "srgb")
    throw new Error('Only "in srgb" supported with d3-interpolate');

  const [c1tok, c2tok] = splitTopLevelByComma(m[2] + "," + m[3]); // ensure exactly 2 tokens
  const { color: c1, pct: p1 } = parseColorToken(c1tok);
  const { color: c2, pct: p2 } = parseColorToken(c2tok);

  // Resolve weights per CSS Color Module Level 5 rules
  let w1, w2;
  if (p1 == null && p2 == null) {
    w1 = 50;
    w2 = 50;
  } else if (p1 != null && p2 == null) {
    w1 = p1;
    w2 = 100 - p1;
  } else if (p1 == null && p2 != null) {
    w1 = 100 - p2;
    w2 = p2;
  } else {
    w1 = p1;
    w2 = p2;
  }

  const t = w2 / (w1 + w2); // 0 → c1, 1 → c2
  const mix = interpolateRgb(c1, c2); // sRGB interpolation
  const rgb = mix(t);
  const hex = d3color(rgb)?.formatHex();
  if (!hex) throw new Error("Failed to compute color");
  return hex; // e.g. "#e9e7e5"
}

/**
 * @param {Object[]} rows  tidy rows
 * @param {number} index   0 = first per group, 1 = second, ...
 * @param {Object} [opts]
 * @param {string} [opts.metricKey='metric']
 * @param {string} [opts.sexKey='sex']
 * @param {(a:Object,b:Object)=>number} [opts.comparator] // optional sort inside groups
 * @returns {Object[]} one row per (metric,sex)
 */
export function pickNthByGroup(rows, index, opts = {}) {
  const { groupKey = "group", comparator } = opts;
  // group by group
  const groups = new Map();
  for (const r of rows) {
    const k = `${r[groupKey]}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  // optionally sort within groups, then take N-th
  const out = [];
  for (const arr of groups.values()) {
    if (comparator) arr.sort(comparator);
    const m = arr.length;
    if (m === 0) continue;
    const idx = ((index % m) + m) % m; // safe modulo for negatives
    const row = arr[idx];
    if (row) out.push(row);
  }
  return out;
}

/**
 * Forward window per (metric,sex): i, i+1, ..., i+(n-1), wrapping within group.
 * Adds order: 0 = start, 1 = next, ...
 *
 * @param {Object[]} rows
 * @param {number} i
 * @param {number} n
 * @param {Object} [opts]
 * @param {string} [opts.metricKey='metric']
 * @param {string} [opts.sexKey='sex']
 * @param {(a:Object,b:Object)=>number} [opts.comparator]
 * @returns {Object[]} n rows per group with .order
 */
export function pickForwardWindowByGroup(rows, i, n, opts = {}) {
  const { groupKey = "group", comparator } = opts;
  const mod = (x, m) => ((x % m) + m) % m;
  // group by group
  const groups = new Map();
  for (const r of rows) {
    const k = `${r[groupKey]}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const out = [];
  for (const arr0 of groups.values()) {
    const arr = comparator ? [...arr0].sort(comparator) : arr0;
    const m = arr.length;
    if (!m) continue;
    const start = mod(i, m);
    for (let k = 0; k < n; k++) {
      const idx = mod(start + k, m);
      out.push({ ...arr[idx], order: k });
    }
  }
  return out;
}

function parseColorToken(token) {
  // "<color> <percent>?" → { color, pct|null }
  const m = token.trim().match(/^(.+?)(?:\s+([0-9]*\.?[0-9]+)\s*%)?$/);
  if (!m) throw new Error("Bad color token: " + token);
  const color = m[1].trim();
  const pct = m[2] != null ? parseFloat(m[2]) : null;
  return { color, pct };
}

function splitTopLevelByComma(s) {
  // splits into exactly two parts at the top-level comma
  let depth = 0,
    idx = -1;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    else if (ch === "," && depth === 0) {
      idx = i;
      break;
    }
  }
  if (idx === -1) throw new Error("Expected two comma-separated color tokens");
  const a = s.slice(0, idx).trim();
  const b = s.slice(idx + 1).trim();
  return [a, b];
}

// Utility to get CSS variable value
export const getCssVar = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function cumulativeSuccessAtIndex(hopA, hopB, i, tie = "split") {
  const n = Math.min(hopA.length, hopB.length);
  if (n === 0)
    return { aWins: 0, bWins: 0, comparisons: 0, aSuccess: 0, bSuccess: 0 };

  let aWins = 0,
    bWins = 0;
  const comparisons = i + 1;

  for (let k = 0; k < comparisons; k++) {
    const idx = k % n; // wrap around
    const av = hopA[idx].value,
      bv = hopB[idx].value;

    if (av > bv) aWins++;
    else if (bv > av) bWins++;
    else {
      if (tie === "split") {
        aWins += 0.5;
        bWins += 0.5;
      } else if (tie === "favorA") aWins++;
      else if (tie === "favorB") bWins++;
    }
  }

  return {
    aWins,
    bWins,
    comparisons,
    aSuccess: aWins / comparisons,
    bSuccess: bWins / comparisons,
  };
}

// Usage: debugLog("general", "This is a general debug message.");
export function debugLog(flag, ...args) {
  if (DEBUG[flag]) console.log(`[${flag.toUpperCase()}]`, ...args);
}

const DEBUG = {
  general: false,
  scroll: false,
  update: false,
  inputs: false,
  analytics: true,
  ScrollInteraction: false,
};
