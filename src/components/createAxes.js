// createAxes.js

import * as d3 from "npm:d3";
import { settings } from "./settings.js";

const { ageMin, ageMax, margin, fontSize, fontFamily } = settings;

export function createAxes(svg, { xScaleSVG, timeScale, w, h }) {
  // Append the x-axis group to the SVG and set its position based on height and margin
  svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${h - margin.bottom})`)
    .call(
      d3
        .axisBottom(xScaleSVG)
        .tickFormat(d3.format("02"))
        .tickValues(d3.range(ageMin, ageMax + 1, 5))
    )
    .call((g) => {
      // Styling specific ticks and lines
      g.selectAll(".tick text")
        .style("fill", "white")
        .style("font", `${fontSize} ${fontFamily}`);
      g.selectAll(".tick:first-of-type text").style("text-anchor", "start");
      g.selectAll(".tick line").attr("stroke", "white");
      g.select(".domain").attr("stroke", "white");
    });

  // Append the y-axis group to the SVG and set its position based on margin
  const yAxis = svg
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(
      d3
        .axisRight(timeScale)
        .tickSize(w - margin.left - margin.right)
        .tickFormat(d3.timeFormat("%H:%M"))
    )
    .call((g) => {
      // Custom styling for ticks and lines
      g.selectAll(".tick text")
        .style("fill", "white")
        .style("font", `${fontSize} ${fontFamily}`)
        .style("stroke", "black")
        .style("stroke-width", "2")
        .style("paint-order", "stroke")
        .attr("x", 0)
        .attr("dy", -4);
      g.selectAll(".tick line").attr("stroke", "white");
      g.selectAll(".tick:not(:first-of-type) line")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-dasharray", "2,2");
      g.selectAll(".tick:first-of-type").remove(); // Removes the first tick if necessary
      g.select(".domain").remove(); // Removes the axis line
    });
}
