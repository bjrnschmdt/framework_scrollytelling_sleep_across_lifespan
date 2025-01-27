// createAxes.js
import * as d3 from "npm:d3";
import { settings } from "./settings.js";
import { formatTime } from "./helperFunctions.js";

const { margin, fontSize, fontFamily } = settings;

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
    .attr("x1", 0)
    .attr("x2", w - margin.left - margin.right)
    .attr("stroke-opacity", 0.4)
    .attr("stroke-dasharray", "2,2");

  g.select(".domain").remove(); // Remove the axis line
}

// Helper function to style the x-axis
function styleXAxis(g) {
  g.selectAll(".tick text")
    .style("fill", "white")
    .style("font", `${fontSize} ${fontFamily}`);

  /* g.selectAll(".tick:first-of-type text").style("text-anchor", "start"); */
  g.selectAll(".tick line").attr("stroke", "white");
  g.select(".domain").attr("stroke", "white");
}

export function createAxes(svg, { xScaleSVG, yScaleSVG, w, h }) {
  const xAxis = (g) => {
    g.call(d3.axisBottom(xScaleSVG).tickFormat(d3.format("02")));
    styleXAxis(g);
  };

  const yAxis = (g) => {
    g.call(
      d3
        .axisRight(yScaleSVG)
        .tickValues(yScaleSVG.ticks().slice(1)) // Exclude first tick
        .tickSize(w - margin.left - margin.right)
        .tickFormat(formatTime)
    );
    styleYAxis(g, { w });
  };

  const gx = svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${h - margin.bottom})`)
    .call(xAxis);

  const gy = svg
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis);

  // Return update functions for dynamic transitions
  return {
    gx,
    gy,
    xAxis,
    yAxis,
    updateAxes: () => {
      gx.transition().duration(1000).call(xAxis).selection().call(styleXAxis); // Reapply styles for the x-axis

      gy.transition()
        .duration(1000)
        .call(yAxis)
        .selection()
        .call((g) => styleYAxis(g, { w })); // Reapply styles for the y-axis
    },
  };
}
