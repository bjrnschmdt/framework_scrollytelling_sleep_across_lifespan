import * as d3 from "npm:d3";

import { settings } from "./settings.js";
const { iconPath } = settings;

export function updatePlot({
  data,
  plotClass,
  plotDataKey,
  enterFn,
  updateFn,
  exitFn = (exit) => exit.remove(),
  filterFn = (arr) => arr,
  preprocessFn = () => ({}),
  xScaleSVG,
  yScaleSVG,
}) {
  const svg = d3.select(".svg");

  if (!data || !data[plotDataKey] || data[plotDataKey].length === 0) {
    exitPlot();
    return;
  }

  const array = data[plotDataKey];
  const filteredData = filterFn(array);
  const preprocessed = preprocessFn(filteredData);

  const plotArea = {
    xMin: xScaleSVG.range()[0],
    xMax: xScaleSVG.range()[1],
    yMin: yScaleSVG.range()[1],
    yMax: yScaleSVG.range()[0],
    width: xScaleSVG.range()[1] - xScaleSVG.range()[0],
    height: yScaleSVG.range()[0] - yScaleSVG.range()[1],
  };

  const context = {
    data: filteredData,
    originalData: data,
    scales: {
      xScaleSVG,
      yScaleSVG,
    },
    plotArea,
    ...preprocessed,
  };

  // Ensure the defs and clipPath exist (defined only once)
  let defs = svg.select("defs");
  if (defs.empty()) {
    defs = svg.append("defs");
  }

  // Add or update the clipPath
  let clipPath = defs.select("#plot-clip");
  if (clipPath.empty()) {
    clipPath = defs.append("clipPath").attr("id", "plot-clip").append("rect");
  }

  clipPath
    .select("rect")
    .attr("x", plotArea.xMin)
    .attr("y", plotArea.yMin)
    .attr("width", plotArea.width)
    .attr("height", plotArea.height);

  // Add the man-icon symbol if it doesn't exist
  let manIcon = defs.select("#man-icon");
  if (manIcon.empty()) {
    manIcon = defs
      .append("symbol")
      .attr("id", "man-icon")
      .attr("viewBox", "0 -960 960 960")
      .append("path")
      .attr("d", iconPath) // Use the icon path provided
      .attr("fill", "white");
  }

  // Create or update the static plot-container group
  const plotContainer = svg
    .selectAll("g.plot-container")
    .data([null]) // Single static container
    .join((enter) =>
      enter
        .append("g")
        .attr("class", "plot-container")
        .attr("clip-path", "url(#plot-clip)")
    );

  // Create or update the dynamic plot group inside the container
  const plot = plotContainer
    .selectAll(`g.${plotClass}`)
    .data([null]) // Passing a dummy array of length 1 so .join() sees one container
    .join(
      (enter) =>
        enter
          .append("g")
          .attr("class", plotClass)
          .attr("transform", `translate(${xScaleSVG(data.ageRange.start)},0)`),
      (update) =>
        update
          .transition("transform")
          .duration(100)
          .ease(d3.easeCubic)
          .attr("transform", `translate(${xScaleSVG(data.ageRange.start)}, 0)`)
    );

  // Update the elements inside the plot group
  plot
    .selectAll(`.${plotClass}-element`)
    .data(filteredData, (d) => d.id)
    .join(
      (enter) => enterFn(enter, context).classed(`${plotClass}-element`, true),
      (update) => updateFn(update, context),
      (exit) => exitFn(exit, context)
    );
}

export function exitPlot() {
  const svg = d3.select(".svg");
  const plotClasses = [
    "dot-plot",
    "box-plot",
    "percentile-plot",
    "hop-plot",
    "hop-traced-plot",
  ];
  svg.selectAll(plotClasses.map((cls) => `.${cls}`).join(", ")).remove();
}
