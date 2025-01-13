import * as d3 from "npm:d3";
import { updatePlot } from "./plot.js";

function enterHOP(enter, context) {
  const { qradius } = context;
  const { yScaleSVG } = context.scales;

  return enter
    .append("use")
    .attr("href", "#man-icon")
    .attr("x", -qradius)
    .attr("y", (d) => yScaleSVG(d.sleepTime))
    .attr("width", 2 * qradius)
    .attr("height", 2 * qradius)
    .style("opacity", 0)
    .call((enter) =>
      enter.transition("hopEnter").delay(150).style("opacity", 1)
    );
}

function updateHOP(update) {
  return update.call((update) =>
    update
      .transition("hopUpdate")
      .duration(1000)
      .ease(d3.easeLinear)
      .style("opacity", (d, i) => (1 / 4) * i)
  );
}

export function updateHOPPlot(data, context) {
  const { xScaleSVG, yScaleSVG, qradius, hopCount, index } = context;

  updatePlot({
    data,
    plotClass: "hop-plot",
    plotDataKey: "hop",
    enterFn: (enter, context) => enterHOP(enter, { ...context, qradius }),
    updateFn: (update, context) => updateHOP(update, { ...context, qradius }),
    filterFn: (arr) => arr.slice(index, index + hopCount),
    xScaleSVG,
    yScaleSVG,
  });
}
