/**
 * @file crosshair.js
 * @description This module manages the creation and dynamic updates of crosshairs
 *              for a D3.js visualization. It includes functions for initializing
 *              the crosshair elements and updating their positions and styles
 *              based on user interactions or data changes.
 *
 * @exports initializeCrosshair - Function to set up the crosshair elements in the SVG.
 * @exports updateCrosshairs - Function to dynamically update the crosshair position,
 *                             tooltip visibility, and labels.
 */

import * as d3 from "npm:d3";
import { settings } from "./settings.js";
import { ageFormat, convertDecimalToTimeFormat } from "./helperFunctions.js";

const { ageMin, sleepMax, margin, fontFamily, fontSize, lineWidths } = settings;

export function initializeCrosshair(svg, xScaleSVG, yScaleSVG, w, h, margin) {
  const x = Number(xScaleSVG(ageMin));
  const y = Number(yScaleSVG(sleepMax));

  const crosshair = svg.append("g").attr("class", "crosshair");

  const tooltip = crosshair
    .append("g")
    .attr("class", "tooltip")
    .style("display", "none");

  // Tooltip text
  const tooltipText = tooltip
    .append("text")
    .attr("class", "tooltip-text")
    .attr("x", 0) // Centered above the crosshair
    .attr("y", -20) // Positioned within the rectangle
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .attr("fill", "white")
    .style("font", `${fontSize} ${fontFamily}`)
    .text("Name"); // Default placeholder text

  const crosshairPoint = crosshair
    .append("circle")
    .attr("class", "crosshairPoint")
    .attr("cx", x)
    .attr("cy", y)
    .attr("r", "4px")
    .attr("fill", "white")
    .attr("opacity", 0);

  const crosshairXLabel = crosshair
    .append("text")
    .attr("class", "crosshairLabel")
    .attr("x", x)
    .attr("y", h - margin.bottom)
    .attr("dy", 9)
    .style("fill", "white")
    .style("stroke", "black")
    .style("stroke-width", "6")
    .style("paint-order", "stroke")
    .style("font", `${fontSize} ${fontFamily}`)
    .style("text-anchor", "start")
    .style("alignment-baseline", "hanging")
    .text(`${ageFormat(ageMin)} Jahre (Alter)`);

  const crosshairXLine = crosshair
    .append("line")
    .attr("class", "crosshairLine")
    .attr("x1", x)
    .attr("x2", x)
    .attr("y1", h - margin.bottom)
    .attr("y2", h - margin.bottom + 6)
    .style("stroke", "white")
    .style("stroke-width", lineWidths.regular);

  const crosshairYLabel = crosshair
    .append("text")
    .attr("class", "crosshairLabel")
    .attr("x", margin.left)
    .attr("y", y)
    .attr("dy", -4)
    .style("fill", "white")
    .style("stroke", "black")
    .style("stroke-width", "4")
    .style("paint-order", "stroke")
    .style("font", `${fontSize} ${fontFamily}`)
    .style("text-anchor", "start")
    .style("alignment-baseline", "baseline")
    .text(`${convertDecimalToTimeFormat(sleepMax)} Stunden (Schlafdauer)`);

  const crosshairYLine = crosshair
    .append("line")
    .attr("class", "crosshairLine")
    .attr("x1", margin.left)
    .attr("x2", w - margin.right)
    .attr("y1", y)
    .attr("y2", y)
    .style("stroke", "white")
    .attr("stroke-opacity", 1)
    .style("stroke-width", 1);

  return {
    crosshairPoint: crosshairPoint,
    crosshairXLine: crosshairXLine,
    crosshairXLabel: crosshairXLabel,
    crosshairYLine: crosshairYLine,
    crosshairYLabel: crosshairYLabel,
    tooltip: tooltip,
    tooltipText: tooltipText,
  };
}

export function updateCrosshairs(
  data,
  {
    crosshairPoint,
    crosshairXLine,
    crosshairXLabel,
    crosshairYLine,
    crosshairYLabel,
    tooltip,
    tooltipText,
  },
  xScaleSVG,
  yScaleSVG,
  w
) {
  let x = Number(xScaleSVG(data.age));
  let y = Number(yScaleSVG(data.sleepTime));
  let textAge = data.age;
  let textSleep = data.sleepTime;
  let duration = 100;
  let tickOpacity = 0.4;
  let pointOpacity = 1;
  let intersect = data.age < 23;
  let labelXOffset = -6;

  // -------------------------
  // Tooltip visibility logic
  // -------------------------
  //
  // Show the tooltip only if "data.tooltipText" is defined.
  // Hide it otherwise.
  const tooltipIsVisible = data.tooltipText !== undefined;
  // If tooltip is visible, show the text from data.tooltipText
  if (tooltipIsVisible) {
    tooltipText.text(data.tooltipText);
    console.log("tooltipText", data.tooltipText);
  }

  // if cursor outside margins the crosshair get reset
  if (isNaN(x) || isNaN(y)) {
    x = Number(xScaleSVG(ageMin));
    y = Number(yScaleSVG(sleepMax));
    textAge = ageMin;
    textSleep = sleepMax;
    duration = 400;
    tickOpacity = 1;
    pointOpacity = 0;
    labelXOffset = 0;
  }

  // Transition the tooltip container
  tooltip
    .transition()
    .duration(duration)
    .style("display", tooltipIsVisible ? "block" : "none")
    .attr("transform", `translate(${x}, ${y})`);

  // Fade out the axis ticks if the crosshair is active
  d3.selectAll(".x-axis .tick")
    .transition()
    .duration(200)
    .attr("opacity", tickOpacity);

  d3.selectAll(".y-axis .tick text")
    .transition()
    .duration(200)
    .attr("opacity", tickOpacity);

  // Move the crosshair dot
  crosshairPoint
    .transition()
    .attr("cx", x)
    .attr("cy", y)
    .duration(duration)
    .attr("opacity", pointOpacity);

  // Move X label & line
  crosshairXLabel
    .transition()
    .duration(duration)
    .attr("x", x)
    .attr("dx", labelXOffset)
    .text(`${ageFormat(textAge)} Jahre (Alter)`);

  crosshairXLine.transition().duration(duration).attr("x1", x).attr("x2", x);

  // Move Y label & line
  crosshairYLabel
    .transition("dxTransitionLabel")
    .duration(200)
    .attr("x", intersect ? w - margin.right : margin.left);

  crosshairYLabel
    .transition("textanchorTransitionLabel")
    .duration(100)
    .delay(100)
    .style("text-anchor", intersect ? "end" : "start");

  crosshairYLabel
    .transition("xyTextTransitionLabel")
    .duration(duration)
    .attr("y", y)
    .text(`${convertDecimalToTimeFormat(textSleep)} Stunden (Schlafdauer)`);

  crosshairYLine.transition().duration(duration).attr("y1", y).attr("y2", y);
}
