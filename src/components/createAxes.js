// createAxes.js
import * as d3 from "npm:d3";
import { settings } from "./settings.js";
import { formatTime } from "./helperFunctions.js";

const { margin, fontSize, fontFamily } = settings;
const duration = 400;

// Helper function to style the x-axis
function styleXAxis(g) {
  g.selectAll(".tick text")
    .style("fill", "white")
    .style("font", `${fontSize} ${fontFamily}`);

  /* g.selectAll(".tick:first-of-type text").style("text-anchor", "start"); */
  g.selectAll(".tick line").attr("stroke", "white");
  g.select(".domain").attr("stroke", "white");
}

// Helper function to style the y-axis
function styleYAxis(g, { w }) {
  g.selectAll(".tick text")
    .attr("x", 0)
    .attr("dy", -4)
    .style("fill", "white")
    .style("font", `${fontSize} ${fontFamily}`)
    .style("stroke", "black")
    .style("stroke-width", "2")
    .style("paint-order", "stroke");

  g.selectAll(".tick line")
    .transition()
    .duration(100)
    .attr("x1", 0)
    .attr("x2", w - margin.left - margin.right)
    .attr("stroke-opacity", 0.4)
    .attr("stroke-dasharray", "2,2");

  g.select(".domain").remove(); // Remove the axis line
}

// Function to update tick opacity based on chartValue
function updateTickOpacity(stepProps) {
  const tickOpacity =
    stepProps.age === undefined || stepProps.sleepTime === undefined ? 1 : 0.4;

  d3.selectAll(".x-axis .tick text")
    .transition("tickXOpacityTransition")
    .duration(200)
    .attr("opacity", tickOpacity);

  d3.selectAll(".y-axis .tick text")
    .transition("tickYOpacityTransition")
    .duration(200)
    .attr("opacity", tickOpacity);
}

export function createAxes(svg, yAxisSVG, { xScaleSVG, yScaleSVG, w, h }) {
  const xAxis = (g, x, xTicks) => {
    g.call(
      d3.axisBottom(x).tickValues(xTicks) // Use dynamic tick values
      /* .tickFormat(d3.format("02")) */ // no formatting on request of SR
    );
    styleXAxis(g);
  };

  const yAxis = (g, y) => {
    g.call(
      d3
        .axisRight(y)
        .tickValues(y.ticks().slice(1)) // Exclude first tick
        .tickSize(w - margin.left - margin.right)
        .tickFormat(formatTime)
    );
    styleYAxis(g, { w });
  };

  const gx = svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${h - margin.bottom})`)
    .call(xAxis, xScaleSVG, d3.ticks(5, 95, 9)); // Default tick values

  const gy = yAxisSVG
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis, yScaleSVG);

  // Return update functions for dynamic transitions
  return {
    gx,
    gy,
    xAxis,
    yAxis,
    updateAxes: (x, y, newWidth, newHeight, xTicks, stepProps) => {
      gx.transition()
        .duration(600)
        .attr("transform", `translate(0,${newHeight - margin.bottom})`)
        .call(xAxis, x, xTicks)
        .selection()
        .call(styleXAxis); // Reapply styles for the x-axis

      gy.transition()
        .duration(600)
        .call(yAxis, y)
        .selection()
        .call((g) => styleYAxis(g, { w: newWidth })); // Reapply styles for the y-axis

      updateTickOpacity(stepProps); // Update tick opacity based on chartValue
    },
  };
}
