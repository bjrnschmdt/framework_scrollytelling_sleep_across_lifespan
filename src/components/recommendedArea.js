// recommendedArea.js
import * as d3 from "npm:d3";

import { settings } from "./settings.js";
const { lineWidths, colors } = settings;

/**
 * Draws a recommended “area band” on the chart and transitions it in/out.
 *
 * @param {d3.Selection} svg           - The main D3 SVG selection.
 * @param {d3.Selection} container     - A D3 selection whose `.node().value` holds current “state”.
 * @param {object}        config       - Configuration object containing everything needed to draw.
 * @param {array}         config.sleepData     - Preprocessed array of data with recommended sleep ranges.
 * @param {function}      config.xScaleSVG     - A D3 scale for x-position (age).
 * @param {function}      config.yScaleSVG     - A D3 scale for y-position (sleepTime).
 */
export function drawRecommendedArea(
  svg,
  container,
  { sleepData, xScaleSVG, yScaleSVG }
) {
  // Check the “showRecommended” flag from container’s “state”
  const recommendedData = container.node().value.showRecommended
    ? [sleepData]
    : [];

  // Bind data for the recommended group
  const group = svg.selectAll(".recommended-group").data(recommendedData);

  group.join(
    // ENTER
    (enter) => {
      const g = enter
        .append("g")
        .attr("class", "recommended-group")
        .style("opacity", 0) // Start invisible
        .call((g) =>
          g
            .transition() // Fade-in transition
            .duration(600)
            .ease(d3.easeCubicInOut)
            .style("opacity", 1)
        );

      // Build an area generator specific to the recommended range
      const areaGenerator = d3
        .area()
        .x((d) => xScaleSVG(d.age))
        .y0((d) => yScaleSVG(d.recommended[0]))
        .y1((d) => yScaleSVG(d.recommended[1]))
        .curve(d3.curveStepAfter);

      // The main “fill” area
      g.append("path")
        .attr("fill", colors.recommended)
        .attr("fill-opacity", 0.2)
        .attr("d", areaGenerator);

      // Lines bounding the recommended range
      const lowerLine = areaGenerator.lineY0();
      const upperLine = areaGenerator.lineY1();

      g.append("path")
        .attr("d", lowerLine)
        .attr("stroke", colors.recommended)
        .attr("stroke-width", lineWidths.medium)
        .attr("fill", "none");

      g.append("path")
        .attr("d", upperLine)
        .attr("stroke", colors.recommended)
        .attr("stroke-width", lineWidths.medium)
        .attr("fill", "none");
    },
    // UPDATE
    (update) => update,
    // EXIT
    (exit) =>
      exit
        .transition()
        .duration(600)
        .ease(d3.easeCubicInOut)
        .style("opacity", 0)
        .remove()
  );
}
