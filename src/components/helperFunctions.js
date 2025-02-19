import * as d3 from "npm:d3";
import { precalculateHeights, calculateCX } from "./plotDot.js";
import { settings } from "./settings.js";

const { ageMin, ageMax } = settings;

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
      `No valid estimatesPlotData array found for age range [${binObj.ageRange.start}, ${binObj.ageRange.end})`
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

export function getTrueValue(dataSet, stepProps) {
  const age = stepProps.age;
  const sleepTime = stepProps.sleepTime;

  // Use optional chaining and fallback values
  const trueValue =
    dataSet.get(age)?.estimatesPlotData?.find((d) => d.sleeptime === sleepTime)
      ?.nearestPValue ?? null;

  return trueValue;
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

/**
 * Updates the x-domain and recomputes necessary dimensions.
 * @param {Object} xScale - D3 scale object for x-axis.
 * @param {Object} stepProps - Current scrollytelling step properties.
 * @param {Object} changes - Object tracking changes in properties.
 * @param {number} width - New chart width.
 * @param {number} margin - Margin settings.
 * @returns {Object} - Returns { start, end, totalWidth }
 */
export function updateXDomain(xScale, stepProps, width, margin) {
  const absoluteDomain = stepProps.xDomain[1] - stepProps.xDomain[0];
  const domainWithOffset = ageMin + absoluteDomain;
  const newDomain = [ageMin, domainWithOffset];

  // Temporarily update scale to compute total width
  xScale.domain(newDomain).range([margin.left, width - margin.right]);
  const totalWidth = xScale(ageMax - 1) + margin.right;

  // Reset domain to original but adjust range
  xScale
    .domain([ageMin, ageMax - 1])
    .range([margin.left, totalWidth - margin.right]);

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
        targetScroll
      );
      return function (t) {
        console.log("tween", interpolator(t));
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
