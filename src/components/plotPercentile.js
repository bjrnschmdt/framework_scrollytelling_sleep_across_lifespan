import * as d3 from "npm:d3";
import { updatePlot } from "./plot.js";
import { settings } from "./settings.js";

const { percentileSelection, fontSize, fontFamily } = settings;

function enterPercentile(enter, context) {
  const { scales } = context;
  const { yScaleSVG } = scales;

  return enter
    .append("text")
    .attr("class", "percentile-plot-element")
    .attr("y", (d) => yScaleSVG(d.q))
    .text((d) => `${Math.round(d.p * 100)}%`)
    .style("fill", "white")
    .style("font", `${fontSize} ${fontFamily}`)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle");
}

function updatePercentileFn(update, context) {
  const { scales } = context;
  const { yScaleSVG } = scales;

  return update
    .transition()
    .duration(100)
    .ease(d3.easeCubic)
    .attr("y", (d) => yScaleSVG(d.q));
}

export function updatePercentilePlot(data, xScaleSVG, yScaleSVG) {
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
    yScaleSVG: yScaleSVG,
  });
}
