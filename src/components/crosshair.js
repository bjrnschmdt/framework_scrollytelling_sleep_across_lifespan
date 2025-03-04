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
import { ageFormat, formatTime } from "./helperFunctions.js";

const { margin, fontFamily, fontSize, lineWidths } = settings;

export function initializeCrosshair({
  svg,
  xScaleSVG,
  yScaleSVG,
  width,
  height,
  yAxisSVG,
  isEnhanced,
}) {
  const domainX = xScaleSVG.domain()[0];
  const domainY = yScaleSVG.domain()[1];

  /* console.log("domainX", domainX);
  console.log("domainY", domainY); */

  const x = Number(xScaleSVG(domainX));
  const y = Number(yScaleSVG(domainY));

  /* console.log("x", x);
  console.log("y", y); */

  const crosshair = svg.append("g").attr("class", "crosshair");
  const crosshairYGroup = yAxisSVG
    .append("g")
    .attr("class", "crosshair-y-group");
  const tickExtremesXAxis = yAxisSVG
    .append("g")
    .attr("class", "tick-extremes")
    .attr("transform", `translate(0,${height - margin.bottom})`);

  const xTickLeft = tickExtremesXAxis
    .append("line")
    .attr("class", "tick-extremes-line")
    .attr("x1", margin.left)
    .attr("x2", margin.left)
    .attr("y1", 0)
    .attr("y2", 6)
    .style("stroke", "white")
    .style("stroke-width", lineWidths.thick);

  const xTickRight = tickExtremesXAxis
    .append("line")
    .attr("class", "tick-extremes-line")
    .attr("x1", width - margin.right)
    .attr("x2", width - margin.right)
    .attr("y1", 0)
    .attr("y2", 6)
    .style("stroke", "white")
    .style("stroke-width", lineWidths.thick);

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
    .attr("dominant-baseline", "middle")
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
    .attr("y", height - margin.bottom)
    .attr("dy", 7)
    .style("fill", "white")
    .style("stroke", "black")
    .style("stroke-width", "5")
    .style("paint-order", "stroke")
    .style("font", `${fontSize} ${fontFamily}`)
    .style("text-anchor", "start")
    .style("dominant-baseline", "hanging")
    .text(`${domainX} Jahre (Alter)`);

  const crosshairXLine = crosshair
    .append("line")
    .attr("class", "crosshairLine")
    .attr("x1", x)
    .attr("x2", x)
    .attr("y1", height - margin.bottom)
    .attr("y2", height - margin.bottom + 6)
    .style("stroke", "white")
    .style("stroke-width", lineWidths.regular);

  const crosshairYLegend = crosshairYGroup
    .append("text")
    .attr("class", "crosshairLegend")
    .attr("x", margin.left)
    .attr("y", y)
    .attr("dy", -4)
    .style("fill", "white")
    .style("stroke", "black")
    .style("stroke-width", "4")
    .style("paint-order", "stroke")
    .style("font", `${fontSize} ${fontFamily}`)
    .style("text-anchor", "start")
    .style("dominant-baseline", "baseline")
    .text(`${formatTime(domainY)} Stunden (Schlafdauer)`)
    .style("display", isEnhanced ? "none" : "block");

  const crosshairYLabel = crosshairYGroup
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
    .style("dominant-baseline", "baseline")
    .text(
      isEnhanced
        ? `${formatTime(domainY)} Stunden (Schlafdauer)`
        : `${formatTime(domainY)}`
    );

  const crosshairYLine = crosshairYGroup
    .append("line")
    .attr("class", "crosshairLine")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
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
    crosshairYLegend: crosshairYLegend,
    crosshairYLabel: crosshairYLabel,
    tooltip: tooltip,
    tooltipText: tooltipText,
    tickExtremesXAxis: tickExtremesXAxis,
  };
}

export function updateCrosshairs(
  data,
  {
    crosshairPoint,
    crosshairXLine,
    crosshairXLabel,
    crosshairYLine,
    crosshairYLegend,
    crosshairYLabel,
    tooltip,
    tooltipText,
    tickExtremesXAxis,
  },
  xScaleSVG,
  yScaleSVG,
  isEnhanced,
  duration = 100
) {
  let x = Number(xScaleSVG(data.age));
  let y = Number(yScaleSVG(data.sleepTime));
  let textAge = data.age;
  let textSleep = data.sleepTime;
  /* let duration = 100; */
  let tickOpacity = 0.4;
  let pointOpacity = 1;
  let intersect = data.age < 23;
  let labelXOffset = -6;

  const domainX = xScaleSVG.domain()[0];
  const domainY = yScaleSVG.domain()[1];
  const rangeX = xScaleSVG.range()[1];
  const rangeY = yScaleSVG.range()[0];

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
  }

  /* if (isEnhanced) {
    duration = 100;
  } */

  // if cursor outside margins the crosshair get reset
  if (isNaN(x) || isNaN(y)) {
    x = Number(xScaleSVG(domainX));
    y = Number(yScaleSVG(domainY));
    textAge = domainX;
    textSleep = domainY;
    duration = 600;
    tickOpacity = 1;
    pointOpacity = 0;
    labelXOffset = 0;
  }

  // Move the tick extremes
  tickExtremesXAxis
    .transition("tickExtremesTransition")
    .duration(duration)
    .attr("transform", `translate(0,${rangeY})`);

  // Transition the tooltip container
  tooltip
    .transition()
    .duration(duration)
    .style("display", tooltipIsVisible ? "block" : "none")
    .attr("transform", `translate(${x}, ${y})`);

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
    .attr("y", rangeY)
    .attr("dx", labelXOffset)
    .text(`${textAge} Jahre (Alter)`);

  crosshairXLine
    .transition()
    .duration(duration)
    .attr("x1", x)
    .attr("x2", x)
    .attr("y1", rangeY)
    .attr("y2", rangeY + 6);

  // Move Y label & line
  crosshairYLabel
    .transition("dxTransitionLabel")
    .duration(duration)
    .attr("x", isEnhanced ? (intersect ? rangeX : margin.left) : margin.left);

  crosshairYLabel
    .transition("textanchorTransitionLabel")
    .duration(duration)
    .delay(100)
    .style("text-anchor", isEnhanced ? (intersect ? "end" : "start") : "start");

  crosshairYLabel
    .transition("xyTextTransitionLabel")
    .duration(duration)
    .attr("y", y)
    .text(
      isEnhanced
        ? `${formatTime(textSleep)} Stunden (Schlafdauer)`
        : `${formatTime(textSleep)}`
    );

  crosshairYLine
    .transition()
    .duration(duration)
    /* .attr("x2", rangeX) */
    .attr("y1", y)
    .attr("y2", y);
}
