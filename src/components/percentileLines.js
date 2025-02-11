// percentileLines.js
import * as d3 from "npm:d3";
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
  { dataSet, showPercentiles, xScaleSVG, yScaleSVG }
) => {
  const lineGen = d3
    .line()
    .curve(d3.curveNatural)
    .x((p) => xScaleSVG(p.age))
    .y((p) => yScaleSVG(p.tst));

  // Flatten the data and filter it based on the tick step.
  const flatData = flattenData(dataSet);

  // Group the filtered data by percentile.
  const groupedByPercentile = d3.groups(flatData, (d) => d.percentile);

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
    .attr("d", (d) => lineGen(d[1]))
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
