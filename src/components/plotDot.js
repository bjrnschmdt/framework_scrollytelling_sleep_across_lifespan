import * as d3 from "npm:d3";
import { updatePlot } from "./plot.js";
import { settings } from "./settings.js";

const { sleepMin, sleepMax, margin, qstep } = settings;

export function precalculateHeights(data, qradius) {
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

export function calculateCX(d, stackMap, totalHeightMap, qradius) {
  const offset = getStackOffset(d.x, qradius, stackMap);
  const totalHeight = totalHeightMap.get(d.x);
  return totalHeight / 2 - offset - qradius;
}

function enterDot(enter, context) {
  const { scales, stackMap, totalHeightMap, values, qradius } = context;
  const { yScaleSVG } = scales;

  return enter
    .append("use")
    .attr("href", "#man-icon")
    .attr("class", "dot-plot-element")
    .attr(
      "x",
      (d) => calculateCX(d, stackMap, totalHeightMap, qradius) - qradius
    )
    .attr("y", (d) => yScaleSVG(d.x) - qradius)
    .attr("width", 2 * qradius)
    .attr("height", 2 * qradius)
    .attr("fill-opacity", (d) => (d.q <= values.sleepTime ? "1" : "0"))
    .style("stroke", "white")
    .style("stroke-width", 3 * qradius);
}

function updateDot(update, context) {
  const { scales, stackMap, totalHeightMap, values, qradius } = context;
  const { yScaleSVG } = scales;

  return update
    .transition()
    .delay(100)
    .duration(400)
    .ease(d3.easeCubic)
    .attr("fill-opacity", (d) => (d.q <= values.sleepTime ? "1" : "0"))
    .attr("x", (d) => calculateCX(d, stackMap, totalHeightMap, qradius) - 12)
    .attr("y", (d) => yScaleSVG(d.x) - 12);
}

export function updateDotPlot(data, values, xScaleSVG, yScaleSVG, h) {
  const qdomain = [sleepMin, sleepMax];
  const qwidth = h - margin.top - margin.bottom;
  const qradius = (0.5 * qwidth * qstep) / (qdomain[1] - qdomain[0]);

  const preprocessDotPlot = (plotData) => {
    return {
      stackMap: new Map(),
      totalHeightMap: precalculateHeights(plotData, qradius),
      values,
    };
  };

  updatePlot({
    data: data,
    plotClass: "dot-plot",
    plotDataKey: "dot",
    enterFn: (enter, context) => enterDot(enter, { ...context, qradius }),
    updateFn: (update, context) => updateDot(update, { ...context, qradius }),
    preprocessFn: preprocessDotPlot,
    xScaleSVG: xScaleSVG,
    yScaleSVG: yScaleSVG,
  });
}
