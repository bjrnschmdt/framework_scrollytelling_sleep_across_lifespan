// percentileLines.js
import * as d3 from "npm:d3";

import { settings } from "./settings.js";
const { mostProminent, lessProminent, lineWidths, colors } = settings;

/**
 * Draw percentile lines on your chart, based on which percentile sets are
 * selected in container.node().value.showPercentiles.
 *
 * @param {d3.Selection} svg - D3 selection of your SVG.
 * @param {object} config - Holds references to scales, data, and styling.
 * @param {array} config.dataSet - An map of plot data.
 * @param {function} config.xScaleSVG - A D3 scale for x positions (age).
 * @param {function} config.yScaleSVG - A D3 scale for y positions (sleepTime).
 * @param {array} config.showPercentiles - An array of selected percentiles.
 */
export function drawGroupedPercentileLines(
  svg,
  { dataSet, showPercentiles, xScaleSVG, yScaleSVG }
) {
  // Create or select a group for all percentile lines
  let allPercentilesGroup = svg.select(".all-percentiles");
  if (allPercentilesGroup.empty()) {
    allPercentilesGroup = svg.append("g").attr("class", "all-percentiles");
  }

  const dataArray = Array.from(dataSet.values()); // Convert Map to Array

  const flattenedData = dataArray.flatMap((d) =>
    d.percentile.map((p) => ({
      age: d.ageRange.start,
      percentile: Math.round(p.p * 100),
      tst: p.q,
    }))
  );

  const groupedByPercentile = d3.groups(flattenedData, (d) => d.percentile);
  // Filter the data based on the percentiles array
  const visiblePercentiles = groupedByPercentile.filter((value) => {
    const percentileKey = value[0]; // The percentile key (5, 6, 7, etc.)
    return (
      // Only show if it matches your logic for “A”, “B”, or “C”
      (mostProminent.includes(percentileKey) &&
        showPercentiles.includes("A")) ||
      (lessProminent.includes(percentileKey) &&
        percentileKey % 5 === 0 &&
        showPercentiles.includes("B")) ||
      showPercentiles.includes("C")
    );
  });

  // Bind data to the percentile group
  const percentileGroups = allPercentilesGroup
    .selectAll(".percentile-group")
    .data(visiblePercentiles, (d) => d[0]); // Use the first item in the array as the key

  // Use join to handle enter, update, and exit
  percentileGroups.join(
    // ENTER
    (enter) => {
      const group = enter
        .append("g")
        .attr("class", "percentile-group")
        .style("opacity", 0); // Start with 0 opacity for fade-in

      group.each(function (d) {
        const percentileKey = d[0]; // The percentile key (5, 6, 7, etc.)
        const percentileData = d[1]; // The array of percentile data objects (age, tst, etc.)

        // Decide which stroke width / opacity to use based on percentileKey
        let strokeOpacity = 0.4;
        let strokeWidth = lineWidths.regular;

        if (
          mostProminent.includes(percentileKey) &&
          showPercentiles.includes("A")
        ) {
          // e.g. thick lines or standard lines
          strokeOpacity = 0.4;
          strokeWidth = lineWidths.regular;
        } else if (
          lessProminent.includes(percentileKey) &&
          percentileKey % 5 === 0 &&
          showPercentiles.includes("B")
        ) {
          // e.g. thinner lines
          strokeOpacity = 0.4;
          strokeWidth = lineWidths.thin;
        } else if (showPercentiles.includes("C")) {
          // e.g. some default
          strokeOpacity = 0.2;
          strokeWidth = lineWidths.regular;
        }

        // Actually draw the lines
        drawPercentileLines(
          d3.select(this),
          percentileData,
          strokeOpacity,
          strokeWidth,
          colors.text,
          xScaleSVG,
          yScaleSVG
        );
      });

      // Animate the group in
      group
        .transition()
        .duration(600)
        .ease(d3.easeCubicInOut)
        .style("opacity", 1); // Fade in
    },

    // UPDATE: Keep elements that remain visible
    (update) => update,

    // EXIT: Fade out and remove lines when not visible
    (exit) =>
      exit
        .transition()
        .duration(600)
        .ease(d3.easeCubicInOut)
        .style("opacity", 0)
        .remove()
  );
}

/**
 * A helper that draws a single percentile “line” path for a given percentile dataset.
 * You’ll likely call this within drawGroupedPercentileLines.
 */
function drawPercentileLines(
  selection,
  data,
  opacity,
  strokeWidth,
  strokeColor,
  xScaleSVG,
  yScaleSVG
) {
  // Build a local line generator that uses x/y scales
  const lineGenerator = d3
    .line()
    .curve(d3.curveNatural)
    .x((d) => xScaleSVG(d.age))
    .y((d) => yScaleSVG(d.tst));

  selection
    .append("path")
    .datum(data) // Bind percentile data to the path
    .attr("fill", "none")
    .attr("stroke", strokeColor)
    .attr("stroke-width", strokeWidth)
    .attr("stroke-opacity", opacity)
    .attr("d", lineGenerator);
}
