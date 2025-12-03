import * as d3 from "npm:d3";
import { dotbin } from "./dotBin.js";
import { settings } from "./settings.js";

const { qstepComp } = settings;

const DEFAULT_SAMPLE_SIZE = 2000;
const PERCENTILE_POINTS = [0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95];
const HOP_PERCENTILE_POINTS = d3.range(0.01, 0.991, 0.01); // 0.01..0.99 inclusive
const QUANTILE_DOT_POINTS = d3.range(0.025, 1, 0.05); // 20 evenly spaced quantiles
/* export const Q_STEP = 540 / 20 / 60;  */ // 27 minutes expressed in hours

function sampleNormal(mu, sigma, n = DEFAULT_SAMPLE_SIZE) {
  const random = d3.randomNormal(mu, sigma);
  const values = Float64Array.from({ length: n }, random);
  return Array.from(values).sort((a, b) => a - b);
}

function boxSummary(values) {
  const q1 = d3.quantileSorted(values, 0.25);
  const median = d3.quantileSorted(values, 0.5);
  const q3 = d3.quantileSorted(values, 0.75);
  const [min, max] = d3.extent(values);
  return { q1, median, q3, whisker_low: min, whisker_high: max };
}

function percentileRows(values, group, comparison, points = PERCENTILE_POINTS) {
  return points.map((p) => ({
    comparison,
    group,
    id: `${comparison}-percentile-${group}-${p}`,
    p,
    q: d3.quantileSorted(values, p),
  }));
}

function quantileDots(values, group, comparison) {
  const quantiles = QUANTILE_DOT_POINTS.map((p) => ({
    comparison,
    group,
    id: `${comparison}-dot-${group}-${p}`,
    p,
    q: d3.quantileSorted(values, p),
  }));

  const binned = dotbin(
    quantiles.map((d) => d.q),
    qstepComp,
    true
  );

  return quantiles.map((d, i) => ({ ...d, x: binned[i] }));
}

function hops(percentiles, group, comparison) {
  const shuffled = d3.shuffle(
    percentiles.map((d) => ({
      comparison,
      group,
      id: `${comparison}-hop-${group}-${d.p}`,
      p: d.p,
      q: d.q,
    }))
  );
  return shuffled;
}

function boxRow(values, group, comparison) {
  const stats = boxSummary(values);
  return {
    comparison,
    group,
    id: `${comparison}-box-${group}`,
    ...stats,
  };
}

export function generateDistributions(comparisons, n = DEFAULT_SAMPLE_SIZE) {
  const result = {};

  for (const [comparison, params] of Object.entries(comparisons)) {
    const groups = [
      { name: "A", mu: params.muGroupA, sigma: params.sigmaGroupA },
      { name: "B", mu: params.muGroupB, sigma: params.sigmaGroupB },
    ];

    const box = [];
    const percentile = [];
    const quantileDot = [];
    const hop = [];

    for (const { name, mu, sigma } of groups) {
      const values = sampleNormal(mu, sigma, n);
      const groupPercentiles = percentileRows(values, name, comparison);
      const groupHopPercentiles = percentileRows(
        values,
        name,
        comparison,
        HOP_PERCENTILE_POINTS
      );

      box.push(boxRow(values, name, comparison));
      percentile.push(...groupPercentiles);
      quantileDot.push(...quantileDots(values, name, comparison));
      hop.push(...hops(groupHopPercentiles, name, comparison));
    }

    result[comparison] = { box, percentile, quantileDot, hop };
  }

  return result;
}

/**
 * Example:
 *
 * const comparisons = {
 *   comparisonA: { muGroupA: 7, sigmaGroupA: 0.5, muGroupB: 6, sigmaGroupB: 0.4 },
 *   comparisonB: { muGroupA: 7.5, sigmaGroupA: 0.45, muGroupB: 5.5, sigmaGroupB: 0.5 },
 * };
 *
 * const data = generateDistributions(comparisons);
 * // data.comparisonA.box, data.comparisonA.percentile, data.comparisonA.quantileDot, data.comparisonA.hop
 */
