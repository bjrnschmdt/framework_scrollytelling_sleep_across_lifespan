import * as d3 from "npm:d3";
import { updatePlot } from "./plot.js";
import { settings } from "./settings.js";

const { hopDuration } = settings;

function enterHOP(enter, context) {
  const { qradius, hopCount } = context;
  const { yScaleSVG } = context.scales;

  return enter
    .append("use")
    .attr("href", "#man-icon")
    .attr("x", -qradius)
    .attr("y", (d) => yScaleSVG(d.sleepTime))
    .attr("width", 2 * qradius)
    .attr("height", 2 * qradius)
    .style("opacity", (d, i, nodes) => {
      const arrayLength = nodes.length; // Get the current array length
      return (i + 1) / arrayLength; // Dynamically calculate opacity
    });
}

function updateHOP(update, context) {
  const { hopCount } = context;

  return update.call((update) =>
    update
      .transition("hopUpdate")
      .duration(hopDuration)
      .ease(d3.easeLinear)
      .style("opacity", (d, i) => (1 / hopCount) * (i + 1))
  );
}

function filterFn(arr, context) {
  const { index, hopCount } = context;
  const maxLength = hopCount; // Desired maximum length of the array
  const adjustedIndex = index % arr.length; // Wrap index using modulo
  const result = [];

  // Build up the array incrementally
  const currentLength = Math.min(index + 1, maxLength); // Determine current array size
  for (let i = 0; i < currentLength; i++) {
    const currentIndex = (adjustedIndex - i + arr.length) % arr.length;
    result.unshift(arr[currentIndex]);
  }
  return result;
}

export function updateHOPPlot(data, context) {
  const { xScaleSVG, yScaleSVG, qradius, hopCount = 1, index } = context;

  updatePlot({
    data,
    plotClass: "hop-plot",
    plotDataKey: "hop",
    enterFn: (enter, context) =>
      enterHOP(enter, { ...context, qradius, hopCount }),
    updateFn: (update, context) => updateHOP(update, { ...context, hopCount }),
    filterFn: (arr) => filterFn(arr, { index, hopCount }),
    xScaleSVG,
    yScaleSVG,
  });
}
