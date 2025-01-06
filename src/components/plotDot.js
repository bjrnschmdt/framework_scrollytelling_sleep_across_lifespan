import * as d3 from "npm:d3";
import { updatePlot } from "./plot.js";
import { settings } from "./settings.js";

const { qradius } = settings;

function precalculateHeights(data) {
  const totalHeightMap = new Map();
  data.forEach((dot) => {
    const x = dot.x;
    const count = totalHeightMap.get(x) || 0;
    totalHeightMap.set(x, count + 2 * qradius);
  });
  return totalHeightMap;
}

function getStackOffset(x, radius, stackMap) {
  let currentHeight = stackMap.get(x) || 0;
  stackMap.set(x, currentHeight + 2 * radius);
  return currentHeight;
}

function calculateCX(d, stackMap, totalHeightMap) {
  const offset = getStackOffset(d.x, qradius, stackMap);
  const totalHeight = totalHeightMap.get(d.x);
  return totalHeight / 2 - offset - qradius;
}

function enterDot(enter, context) {
  const { scales, stackMap, totalHeightMap, values } = context;
  const { yScaleDotPlot } = scales;

  return enter
    .append("use")
    .attr("href", "#man-icon")
    .attr("class", "dot-plot-element")
    .attr("x", (d) => calculateCX(d, stackMap, totalHeightMap) - 12)
    .attr("y", (d) => yScaleDotPlot(d.x) - 12)
    .attr("width", 24)
    .attr("height", 24)
    .attr("fill-opacity", (d) => (d.q <= values.sleepTime ? "1" : "0"))
    .style("stroke", "white")
    .style("stroke-width", 32);
}

function updateDot(update, context) {
  const { scales, stackMap, totalHeightMap, values } = context;
  const { yScaleDotPlot } = scales;

  return update
    .transition()
    .delay(100)
    .duration(400)
    .ease(d3.easeCubic)
    .attr("fill-opacity", (d) => (d.q <= values.sleepTime ? "1" : "0"))
    .attr("x", (d) => calculateCX(d, stackMap, totalHeightMap) - 12)
    .attr("y", (d) => yScaleDotPlot(d.x) - 12);
}

export function updateDotPlot(data, values, xScaleSVG, yScaleDotPlot) {
  const preprocessDotPlot = (plotData) => {
    return {
      stackMap: new Map(),
      totalHeightMap: precalculateHeights(plotData),
      values,
    };
  };

  updatePlot({
    data: data,
    plotClass: "dot-plot",
    plotDataKey: "dot",
    enterFn: enterDot,
    updateFn: updateDot,
    preprocessFn: preprocessDotPlot,
    xScaleSVG: xScaleSVG,
    yScaleDotPlot: yScaleDotPlot,
  });
}
