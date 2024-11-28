import * as d3 from "npm:d3";

// Functions

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

// probability density function

export function epanechnikov(bandwidth) {
  return (x) =>
    Math.abs((x /= bandwidth)) <= 1 ? (0.75 * (1 - x * x)) / bandwidth : 0;
}

export function kde(kernel, thresholds, data) {
  return thresholds.map((t) => [t, d3.mean(data, (d) => kernel(t - d))]);
}
