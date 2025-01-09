import { dotbin } from "./dotBin.js";
import * as d3 from "npm:d3";
import {
  generateParticipantData,
  calculateQuantiles,
  calculatePercentiles,
} from "./helperFunctions.js";

import { settings } from "./settings.js";

const {
  ageMin,
  ageMax,
  thresholdsAge,
  thresholdsSleep,
  qstep,
  numQuantiles,
  smooth,
} = settings;

const metaStudy = [
  { name: "ABCD", n: 3444, extent: [0.99, 3.39], mean: 10.6, sd: 0.7 },
  { name: "CheckKid", n: 10362, extent: [3.97, 13.2], mean: 11.2, sd: 0.6 },
  { name: "EPHE", n: 127, extent: [6.0, 9.0], mean: 10.1, sd: 1.0 },
  { name: "CSHQ", n: 1504, extent: [2.16, 13.7], mean: 10.6, sd: 0.9 },
  { name: "ENERGY", n: 396, extent: [10.0, 14.0], mean: 9.6, sd: 0.9 },
  { name: "Dewald", n: 954, extent: [11.0, 23.5], mean: 7.9, sd: 1.2 },
  { name: "AGHLS", n: 340, extent: [41.0, 45.0], mean: 7.7, sd: 1.1 },
  { name: "MORGEN", n: 22847, extent: [20.1, 65.8], mean: 7.3, sd: 0.9 },
  { name: "Lifelines", n: 63446, extent: [20.0, 68.0], mean: 7.1, sd: 0.9 },
  { name: "HELIUS", n: 23563, extent: [18.0, 73.0], mean: 6.9, sd: 1.3 },
  {
    name: "NESDA Controls",
    n: 601,
    extent: [20.0, 67.0],
    mean: 7.4,
    sd: 0.9,
  },
  {
    name: "AMIGO",
    n: 14670,
    extent: [23.0, 80.0],
    mean: 7.0,
    sd: 1.0,
  },
  { name: "NEO", n: 5808, extent: [44.0, 66.0], mean: 6.9, sd: 1.1 },
  {
    name: "Rotterdam Study",
    n: 9818,
    extent: [45.5, 98.9],
    mean: 6.8,
    sd: 0.9,
  },
  { name: "LASA", n: 1535, extent: [60.0, 100.0], mean: 7.5, sd: 1.3 },
  // following are studies conducted in Great Britain and the USA
  /* { name: "Biobank", n: 405331, extent: [41.0, 65.0], mean: 7.1, sd: 1.1 },
    { name: "Biobank", n: 66428, extent: [65.0, 100.0], mean: 7.3, sd: 1.1 },
    { name: "NHIS", n: 47123, extent: [18.0, 26.0], mean: 7.3, sd: 1.4 },
    { name: "NHIS", n: 108332, extent: [26.0, 41.0], mean: 7.0, sd: 1.3 },
    { name: "NHIS", n: 164834, extent: [41.0, 65.0], mean: 6.9, sd: 1.4 },
    { name: "NHIS", n: 89328, extent: [65.0, 100.0], mean: 7.5, sd: 1.6 } */
];

// bins

const ageBins = d3
  .bin()
  .domain([ageMin, ageMax])
  .thresholds(thresholdsAge)
  .value((d) => d.age);

export const simulatedData = metaStudy.flatMap((study) =>
  generateParticipantData(
    study.mean,
    study.sd,
    study.n,
    study.name,
    study.extent
  )
);

const ageBinnedData = ageBins(simulatedData)
  .filter((bin) => bin.x0 !== bin.x1) // the extra filter step ensures that there is no empty bin
  .map((bin) => bin.sort((a, b) => d3.ascending(a.sleepTime, b.sleepTime))); // sorted to apply d3.quantileSorted() later for efficiency

// data

const dataPercentilePlot = ageBinnedData.map((age) => {
  const percentileResults = calculatePercentiles(age);

  // Add x0 and x1 to the quantile array as properties
  percentileResults.x0 = age.x0; // Retain x0 from the CDF
  percentileResults.x1 = age.x1; // Retain x1 from the CDF

  // Add a stable "id" to each percentile entry
  percentileResults.forEach((d) => {
    d.id = `percentileItem-${d.p}`;
  });
  return percentileResults;
});

// Bin the data and derive the values (inter-quartile range, outliers…) for each bin.
const dataBoxPlot = d3
  .bin()
  .domain([ageMin, ageMax])
  .thresholds(thresholdsAge)
  .value((d) => d.age)(simulatedData)
  .map((bin) => {
    bin.sort((a, b) => a.sleepTime - b.sleepTime);
    const values = bin.map((d) => d.sleepTime);
    const [min, max] = [values[0], values[values.length - 1]];
    const [q1, q2, q3] = [
      d3.quantile(values, 0.25),
      d3.quantile(values, 0.5),
      d3.quantile(values, 0.75),
    ];
    const iqr = q3 - q1; // interquartile range
    const [r0, r1] = [
      Math.max(min, q1 - iqr * 1.5),
      Math.min(max, q3 + iqr * 1.5),
    ];
    const outliers = bin
      .filter((v) => v.sleepTime < r0 || v.sleepTime > r1)
      .map((d) => d.sleepTime);

    // Only return the statistics instead of the whole data points
    return {
      id: "boxItem",
      quartiles: [q1, q2, q3],
      range: [r0, r1],
      outliers,
      count: bin.length,
      x0: bin.x0,
      x1: bin.x1,
    };
  })
  .filter((bin) => bin.x0 !== bin.x1); // the extra filter step ensures that there is no empty bin

const quantiles = ageBinnedData.map((bin) => {
  const quantileResults = calculateQuantiles(bin, numQuantiles);

  // Add x0 and x1 to the quantile array as properties
  quantileResults.x0 = bin.x0; // Retain x0 from the CDF
  quantileResults.x1 = bin.x1; // Retain x1 from the CDF
  return quantileResults;
});

const dotBins = quantiles.map((quantile) => {
  // Extract values and sort them
  const values = quantile.map((d) => d.q).sort(d3.ascending);

  // Create dot bins from the sorted values
  const bins = dotbin(values, qstep, smooth);

  // Add x0 and x1 to the bins as properties
  bins.x0 = quantile.x0; // Retain x0 from the quantile
  bins.x1 = quantile.x1; // Retain x1 from the quantile
  return bins;
});

const dataDotPlot = quantiles.map((subArray, i) => {
  // Create an enhanced sub-array from quantiles, attaching dotBins data and x0, x1 properties
  const enhancedSubArray = subArray.map((obj, j) => {
    return {
      p: obj.p, // probability value from quantile
      q: obj.q, // quantile value
      x: dotBins[i][j], // corresponding dot bin value
      id: `dotItem-${obj.p}`, // unique identifier
    };
  });

  // Add x0 and x1 to each sub-array as properties
  enhancedSubArray.x0 = dotBins[i].x0; // Get x0 from the corresponding dotBin
  enhancedSubArray.x1 = dotBins[i].x1; // Get x1 from the corresponding dotBin

  return enhancedSubArray;
});

export const dataEstimates = (() => {
  // We'll build an array that parallels dataBoxPlot, dataDotPlot, dataPercentilePlot, etc.
  let estimatesArray = [];

  // Loop over each bin defined by thresholdsAge
  for (let i = 0; i < thresholdsAge.length - 1; i++) {
    const x0 = thresholdsAge[i];
    const x1 = thresholdsAge[i + 1];

    // Find the corresponding percentile data for this bin
    const percentilePlot = dataPercentilePlot.find(
      (item) => item.x0 === x0 && item.x1 === x1
    );
    if (!percentilePlot) {
      // no matching percentile data
      continue;
    }

    // percentilePlot is an array of { p, q }
    // For each thresholdsSleep value, find the percentile whose q is closest to that sleepVal
    const estimatesPlotData = thresholdsSleep.map((sleepVal) => {
      let nearestQObj = percentilePlot.reduce((acc, cur) => {
        if (!acc) return cur;
        let distAcc = Math.abs(acc.q - sleepVal);
        let distCur = Math.abs(cur.q - sleepVal);
        return distCur < distAcc ? cur : acc;
      }, null);

      // Instead of returning nearestQObj.q, we return nearestQObj.p
      return {
        sleeptime: sleepVal,
        nearestPValue: nearestQObj ? nearestQObj.p : null,
      };
    });

    // Push the resulting object into the array
    estimatesArray.push({
      x0,
      x1,
      estimatesPlotData,
    });
  }

  return estimatesArray;
})();

export const dataSet = (() => {
  let combinedData = new Map(); // Using Map to ensure unique keys with more control

  // Iterate through each threshold range defined by consecutive thresholds
  for (let i = 0; i < thresholdsAge.length - 1; i++) {
    let x0 = thresholdsAge[i];
    let x1 = thresholdsAge[i + 1];

    // Find and combine matching entries from dataBoxPlot and data
    let boxPlot = dataBoxPlot.find((item) => item.x0 === x0 && item.x1 === x1);
    let dotPlot = dataDotPlot.find((item) => item.x0 === x0 && item.x1 === x1);
    let percentilePlot = dataPercentilePlot.find(
      (item) => item.x0 === x0 && item.x1 === x1
    );
    const estimates = dataEstimates.find(
      (item) => item.x0 === x0 && item.x1 === x1
    );

    if (boxPlot && dotPlot && percentilePlot) {
      combinedData.set(x0, {
        ageRange: { start: x0, end: x1 },
        box: [boxPlot],
        dot: dotPlot.map((dp) => ({ p: dp.p, q: dp.q, x: dp.x, id: dp.id })),
        percentile: percentilePlot.map((dp) => ({
          p: dp.p,
          q: dp.q,
          id: dp.id,
        })),
        estimatesPlotData: estimates.estimatesPlotData,
      });
    } else {
      console.warn(`No matching data found for age range: ${x0} to ${x1}`);
    }
  }

  return combinedData;
})();
