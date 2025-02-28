// percentileLines.js
import * as d3 from "npm:d3";
import { interpolatePath } from "npm:d3-interpolate-path";
import { settings } from "./settings.js";

const { mostProminent, lessProminent, lineWidths, colors } = settings;

/**
 * Computes the stroke properties (opacity and width) for a given percentile key,
 * based on which percentile set is selected.
 *
 * @param {number} percentileKey - The percentile key (e.g. 5, 6, 7, etc.).
 * @param {Array} showPercentiles - Array of selected percentile groups, e.g. ["A", "B", "C"].
 * @returns {{ strokeOpacity: number, strokeWidth: number }} The stroke opacity and width.
 */
const getStrokeProperties = (percentileKey, showPercentiles) => {
  let strokeOpacity = 0.4;
  let strokeWidth = lineWidths.regular;

  if (mostProminent.includes(percentileKey) && showPercentiles.includes("A")) {
    strokeOpacity = 0.4;
    strokeWidth = lineWidths.regular;
  } else if (
    lessProminent.includes(percentileKey) &&
    percentileKey % 5 === 0 &&
    showPercentiles.includes("B")
  ) {
    strokeOpacity = 0.4;
    strokeWidth = lineWidths.thin;
  } else if (showPercentiles.includes("C")) {
    strokeOpacity = 0.2;
    strokeWidth = lineWidths.regular;
  }
  return { strokeOpacity, strokeWidth };
};

/**
 * Flattens the data from the dataSet Map into an array of data points.
 *
 * Each data point is an object: { age, percentile, tst }.
 *
 * @param {Map} dataSet - Map of plot data.
 * @returns {Array<Object>} Flattened data array.
 */
const flattenData = (dataSet) => {
  const dataArray = Array.from(dataSet.values());
  return dataArray.flatMap((d) =>
    d.percentile.map((p) => ({
      age: d.ageRange.start,
      percentile: Math.round(p.p * 100),
      tst: p.q,
    }))
  );
};

const mapToStableLength = (flatData, tickValues) => {
  // Convert tickValues to a Set for fast lookup
  const tickSet = new Set(tickValues);

  // Map flatData, overriding tst when age is not in tickValues
  return flatData.map((d) => ({
    ...d,
    tst: tickSet.has(d.age) ? d.tst : undefined, // Keep `tst` if age is in tickValues, otherwise set to undefined
  }));
};

/**
 * Filters the flattened data by sampling every Nth data point based on the step
 * between ticks. In other words, if the tick step is 10, only data points whose
 * x value (age) lies on a grid defined by (domainMin + n*step) are kept.
 *
 * @param {Array<Object>} flatData - Flattened data array.
 * @param {Function} xScaleSVG - The x scale.
 * @param {number} tickCount - The desired number of ticks.
 * @returns {Array<Object>} Filtered data array.
 */
const filterDataByTickStep = (flatData, xScaleSVG, tickCount) => {
  const [domainMin, domainMax] = xScaleSVG.domain();

  // Compute the tick step using d3.tickStep
  const step = d3.tickStep(domainMin, domainMax, tickCount);

  // Filter the data: keep data points whose (age - domainMin)/step is nearly an integer.
  return flatData.filter((d) => {
    const relative = (d.age - domainMin) / step;
    return Math.abs(relative - Math.round(relative)) < 1e-6;
  });
};

/**
 * Filters the flattened data by keeping only data points whose age matches one of the given tick values.
 *
 * @param {Array<Object>} flatData - Flattened data array.
 * @param {Array<number>} tickValues - Array of tick values to filter by.
 * @returns {Array<Object>} Filtered data array.
 */
const filterDataByTickValues = (flatData, tickValues) => {
  // Convert the tick array into a Set for fast lookup
  const tickSet = new Set(tickValues);

  // Filter the data: keep only data points whose age is in the tickSet.
  return flatData.filter((d) => tickSet.has(d.age));
};

/**
 * Draws (or updates) the percentile lines (each as a path element) within a single container group.
 *
 * The data is first flattened, then filtered by the tick step, and finally grouped by percentile.
 * Each percentile line is updated (or created/removed) as a path element using the D3 join pattern.
 *
 * @param {d3.Selection} svg - D3 selection of your SVG element.
 * @param {Object} config - Configuration object.
 * @param {Map} config.dataSet - Map of plot data.
 * @param {Function} config.xScaleSVG - x scale.
 * @param {Function} config.yScaleSVG - y scale.
 * @param {Array} config.showPercentiles - Array of selected percentile sets (e.g. ["A", "B", "C"]).
 */
export const drawPercentiles = (
  group,
  { dataSet, showPercentiles, xScaleSVG, yScaleSVG, tickValues, isEnhanced }
) => {
  const curveType = tickValues.length === 91 ? d3.curveNatural : d3.curveBasis;
  const curveTypeString =
    tickValues.length === 91 ? "d3.curveNatural" : "d3.curveBasis";
  console.log("curveType", curveTypeString);
  const lineGen = d3
    .line()
    .curve(curveType)
    /* .defined((d) => d.tst !== undefined) */ // Ignore undefined tst values
    .x((p) => xScaleSVG(p.age))
    .y((p) => yScaleSVG(p.tst));

  // Flatten the data and filter it based on the tick step.
  const flatData = flattenData(dataSet);

  /* const filteredDataByTickStep = filterDataByTickStep(
    flatData,
    xScaleSVG,
    tickCount
  ); */
  const filteredDataByTickValues = filterDataByTickValues(flatData, tickValues);

  const stableData = mapToStableLength(flatData, tickValues);

  // Group the filtered data by percentile.
  const groupedByPercentile = d3.groups(
    filteredDataByTickValues,
    (d) => d.percentile
  );

  console.log("groupedByPercentile", groupedByPercentile);

  // Filter groups based on the showPercentiles criteria.
  const visiblePercentiles = groupedByPercentile.filter(
    ([percentileKey]) =>
      (mostProminent.includes(percentileKey) &&
        showPercentiles.includes("A")) ||
      (lessProminent.includes(percentileKey) &&
        percentileKey % 5 === 0 &&
        showPercentiles.includes("B")) ||
      showPercentiles.includes("C")
  );

  /* console.log("visiblePercentiles", visiblePercentiles); */

  // Bind the visible percentile groups to path elements.
  const lines = group
    .selectAll("path.percentile-line")
    .data(visiblePercentiles, (d) => d[0]);

  // ENTER: Create new path elements.
  lines
    .enter()
    .append("path")
    .attr("class", "percentile-line")
    .attr("fill", "none")
    .attr("stroke", colors.text)
    .attr(
      "stroke-width",
      (d) => getStrokeProperties(d[0], showPercentiles).strokeWidth
    )
    .attr(
      "stroke-opacity",
      (d) => getStrokeProperties(d[0], showPercentiles).strokeOpacity
    )
    .attr("d", (d) => lineGen(d[1]))
    .style("opacity", 0)
    .transition("percentile-opacity")
    .duration(600)
    .ease(d3.easeCubicInOut)
    .style("opacity", 1);

  // UPDATE: Transition existing path elements to their new state.
  lines
    .transition()
    .duration(600)
    .ease(d3.easeCubicInOut)
    /* .attr("d", (d) => lineGen(d[1])) */
    .attrTween("d", function (d) {
      var previous = d3.select(this).attr("d");
      var current = lineGen(d[1]);
      return interpolatePath(previous, current);
    })
    .attr(
      "stroke-opacity",
      (d) => getStrokeProperties(d[0], showPercentiles).strokeOpacity
    )
    .attr(
      "stroke-width",
      (d) => getStrokeProperties(d[0], showPercentiles).strokeWidth
    );

  // EXIT: Remove path elements that are no longer needed.
  lines
    .exit()
    .transition()
    .duration(600)
    .ease(d3.easeCubicInOut)
    .style("opacity", 0)
    .remove();
};
