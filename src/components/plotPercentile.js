import * as d3 from "npm:d3";
import { updatePlot } from "./plot.js";
import { settings } from "./settings.js";

const { percentileSelection } = settings;

function enterPercentile(enter, context) {
  const { scales } = context;
  const { yScalePercentile } = scales;

  return enter
    .append("text")
    .attr("class", "percentile-plot-element")
    .attr("y", (d) => yScalePercentile(d.q))
    .text((d) => `${Math.round(d.p * 100)}%`)
    .style("fill", "white")
    .style("font", "10px Roboto")
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle");
}

function updatePercentileFn(update, context) {
  const { scales } = context;
  const { yScalePercentile } = scales;

  return update
    .transition()
    .duration(100)
    .ease(d3.easeCubic)
    .attr("y", (d) => yScalePercentile(d.q));
}

export function updatePercentilePlot(data, xScaleSVG, yScalePercentile) {
  const filterPercentilePlot = (plotData) =>
    plotData.filter((item) => percentileSelection.includes(item.p));

  updatePlot({
    data: data,
    plotClass: "percentile-plot",
    plotDataKey: "percentile",
    enterFn: enterPercentile,
    updateFn: updatePercentileFn,
    filterFn: filterPercentilePlot,
    xScaleSVG: xScaleSVG,
    yScalePercentile: yScalePercentile,
  });
}
