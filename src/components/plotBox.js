import * as d3 from "npm:d3";
import { updatePlot } from "./plot.js";
import { settings } from "./settings.js";

const { lineWidths } = settings;

function enterBox(enter, context) {
  const { yScaleSVG } = context.scales;

  const boxEnter = enter.append("g");

  // range path
  boxEnter
    .append("path")
    .attr("class", "range")
    .attr("stroke", "white")
    .attr("stroke-width", lineWidths.regular)
    .attr("d", (d) => `M0,${yScaleSVG(d.range[1])}V${yScaleSVG(d.range[0])}`);

  // quartiles path
  boxEnter
    .append("path")
    .attr("class", "quartiles")
    .attr("stroke", "white")
    .attr("stroke-width", lineWidths.regular)
    .attr(
      "d",
      (d) =>
        `M-10,${yScaleSVG(d.quartiles[2])}
       H10V${yScaleSVG(d.quartiles[0])}
       H-10Z`
    );

  // median path
  boxEnter
    .append("path")
    .attr("class", "median")
    .attr("stroke", "white")
    .attr("stroke-width", lineWidths.regular)
    .attr("d", (d) => `M-10,${yScaleSVG(d.quartiles[1])}H10`);

  return boxEnter;
}

function updateBox(update, context) {
  const { yScaleSVG } = context.scales;

  // range path
  update
    .select(".range")
    .transition()
    .duration(400)
    .attr("d", (d) => `M0,${yScaleSVG(d.range[1])}V${yScaleSVG(d.range[0])}`);

  // quartiles path
  update
    .select(".quartiles")
    .transition()
    .duration(400)
    .attr(
      "d",
      (d) =>
        `M-10,${yScaleSVG(d.quartiles[2])}
       H10V${yScaleSVG(d.quartiles[0])}
       H-10Z`
    );

  // median path
  update
    .select(".median")
    .transition()
    .duration(400)
    .attr("d", (d) => `M-10,${yScaleSVG(d.quartiles[1])}H10`);

  return update;
}

export function updateBoxPlot(data, xScaleSVG, yScaleSVG) {
  updatePlot({
    data,
    plotClass: "box-plot",
    plotDataKey: "box", // if you renamed "boxPlotData" to "box"
    enterFn: enterBox,
    updateFn: updateBox,
    xScaleSVG,
    yScaleSVG,
    // no filterFn or preprocessFn needed if none required
  });
}
