// drawCases.js
import * as d3 from "npm:d3";
import { settings } from "./settings.js";

const { casesData, colors } = settings;

/**
 * Draws a small set of circles (“cases”) on the SVG.
 *
 * @param {d3.Selection} svg - A D3 selection of your SVG container
 * @param {object} config    - Configuration object holding everything needed to draw the cases
 * @param {array}  config.casesData        - An array of case objects (e.g. [{ name, age, tib }, ...])
 * @param {function} config.xScale    - A D3 scale for x-position (age)
 * @param {function} config.yScale    - A D3 scale for y-position (tib or sleepTime)
 * @param {number} [config.radius=2.5] - Optional circle radius for each case
 */
export function drawCases(svg, { xScale, yScale, radius = 2.5 }) {
  // Create a container group for the cases
  const casesGroup = svg.append("g").attr("id", "casesGroup");

  // Bind data and create circles
  casesGroup
    .selectAll("circle")
    .data(casesData)
    .join("circle")
    .attr("cx", (d) => xScale(d.age))
    .attr("cy", (d) => yScale(d.tib))
    .attr("r", radius)
    .attr("fill", colors.text);
}
