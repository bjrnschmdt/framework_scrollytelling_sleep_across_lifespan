import * as d3 from "npm:d3";
import { dotbin } from "./dotBin.js";
import { settings } from "./settings.js";

const { qstepComp } = settings;

const DEFAULT_SAMPLE_SIZE = 2000;
const PERCENTILE_POINTS = [0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95];
const HOP_PERCENTILE_POINTS = d3
  .range(0.01, 0.991, 0.01)
  .map((d) => d3.format(".2f")(d)); // 0.01..0.99 inclusive
const QUANTILE_DOT_POINTS = d3
  .range(0.025, 1, 0.05)
  .map((d) => d3.format(".3f")(d)); // 20 evenly spaced quantiles
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
      ...d,
      comparison,
      group,
      id: `${comparison}-hop-${group}-${d.p}`,
      value: d.value ?? d.q,
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

/**
 * Add cumulative success rates to hop arrays by pairwise comparison.
 * Writes per item: wins, success (0..1), comparisons, leader
 * Tie handling: 'split' = 0.5/0.5, 'favorA', or 'favorB'
 */
export function addCumulativeSuccessRates(
  hopGroups,
  { a = "A", b = "B", valueKey = "q", tie = "split" } = {}
) {
  const A = hopGroups?.[a] ?? [];
  const B = hopGroups?.[b] ?? [];
  const n = Math.min(A.length, B.length);

  if (n === 0) return hopGroups;

  let aWins = 0,
    bWins = 0;

  for (let i = 0; i < n; i++) {
    const av = A[i]?.[valueKey];
    const bv = B[i]?.[valueKey];

    let aInc = 0,
      bInc = 0;
    if (av > bv) aInc = 1;
    else if (bv > av) bInc = 1;
    else {
      if (tie === "split") aInc = bInc = 0.5;
      else if (tie === "favorA") aInc = 1;
      else if (tie === "favorB") bInc = 1;
    }

    aWins += aInc;
    bWins += bInc;
    const comparisons = i + 1;

    const leader =
      aWins === bWins ? "tie" : aWins > bWins ? a : b; // overall leader so far

    Object.assign(A[i], {
      wins: aWins,
      success: aWins / comparisons,
      comparisons,
      leader,
    });
    Object.assign(B[i], {
      wins: bWins,
      success: bWins / comparisons,
      comparisons,
      leader,
    });
  }

  return hopGroups;
}

/**
 * Compute absolute success rates by comparing every value in group A with every value in group B.
 * Suitable for percentile-based arrays (e.g., 100x100 = 10,000 comparisons).
 */
export function calculateAbsoluteSuccessRates(
  hopGroups,
  { a = "A", b = "B", valueKey = "q", tie = "split" } = {}
) {
  const A = hopGroups?.[a] ?? [];
  const B = hopGroups?.[b] ?? [];

  if (!A.length || !B.length)
    return { aWins: 0, bWins: 0, totalComparisons: 0, aSuccess: 0, bSuccess: 0 };

  let aWins = 0,
    bWins = 0;

  for (const avObj of A) {
    for (const bvObj of B) {
      const av = avObj?.[valueKey];
      const bv = bvObj?.[valueKey];
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
  }

  const totalComparisons = A.length * B.length;
  return {
    aWins,
    bWins,
    totalComparisons,
    aSuccess: aWins / totalComparisons,
    bSuccess: bWins / totalComparisons,
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
    const hopByGroup = {};

    for (const { name, mu, sigma } of groups) {
      const values = sampleNormal(mu, sigma, n);
      const groupPercentiles = percentileRows(values, name, comparison);
      const groupHopPercentiles = percentileRows(
        values,
        name,
        comparison,
        HOP_PERCENTILE_POINTS
      ).map((d, index) => ({ ...d, index, value: d.q }));

      box.push(boxRow(values, name, comparison));
      percentile.push(...groupPercentiles);
      quantileDot.push(...quantileDots(values, name, comparison));
      hopByGroup[name] = hops(groupHopPercentiles, name, comparison);
    }

    // Compute cumulative success on already shuffled hops (simulated random draws)
    const hopWithSuccess = addCumulativeSuccessRates(hopByGroup, {
      valueKey: "q",
    });

    const absoluteSuccessRates = calculateAbsoluteSuccessRates(hopWithSuccess, {
      valueKey: "q",
    });

    hop.push(...(hopWithSuccess.A ?? []), ...(hopWithSuccess.B ?? []));

    // Shuffled hops with cumulative success metrics retained by group
    const hopCumulative = {
      A: hopWithSuccess.A ?? [],
      B: hopWithSuccess.B ?? [],
    };

    result[comparison] = {
      box,
      percentile,
      quantileDot,
      hop,
      hopCumulative,
      absoluteSuccessRates,
    };
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
 * // data.comparisonA.box, data.comparisonA.percentile, data.comparisonA.quantileDot, data.comparisonA.hop, data.comparisonA.hopCumulative, data.comparisonA.absoluteSuccessRates
 */
