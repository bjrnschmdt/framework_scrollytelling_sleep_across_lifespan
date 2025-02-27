import * as d3 from "npm:d3";

let sampledData = null;
let scatterVisible = true; // Toggle visibility state

/**
 * Initializes the scatterplot by creating a group for points.
 * @param {d3.Selection} svg - D3 selection of the SVG element.
 * @param {Object} config - Configuration object.
 * @param {Array} config.simulatedData - Array of data objects.
 * @param {Function} config.xScaleSVG - x scale.
 * @param {Function} config.yScaleSVG - y scale.
 */
export const initializeScatterPlot = (
  svg,
  { simulatedData, xScaleSVG, yScaleSVG }
) => {
  const scatterGroup = svg
    .append("g")
    .attr("class", "scatterplot")
    .attr("clip-path", "url(#plot-clip)");

  if (!sampledData) {
    const width = xScaleSVG.range()[1] - xScaleSVG.range()[0];
    const sampleSize = Math.max(100, Math.floor(width * 5));
    sampledData = d3.shuffle(simulatedData).slice(0, sampleSize); // No reshuffling
  }

  updateScatterPlot(scatterGroup, { xScaleSVG, yScaleSVG });

  return scatterGroup;
};

/**
 * Updates the scatterplot dynamically based on screen width.
 * Also controls visibility based on `scatterVisible`.
 * @param {d3.Selection} group - D3 selection of the scatterplot group.
 * @param {Object} config - Configuration object.
 * @param {Function} config.xScaleSVG - x scale.
 * @param {Function} config.yScaleSVG - y scale.
 */
export const updateScatterPlot = (group, { xScaleSVG, yScaleSVG }) => {
  const dataToUse = scatterVisible ? sampledData : []; // Empty dataset hides points
  console.log("dataToUse", dataToUse);

  // Get the number of currently rendered points before updating
  const existingPointsCount = group.selectAll("circle").size();

  // Define easing function for delay (slow start, fast middle, slow end)
  const easeFunction = d3.easeExpInOut; // You can experiment with different easing functions

  // Create a delay scale mapping index position to a range of delays
  const delayScale = d3
    .scaleSequential(easeFunction)
    .domain([0, Math.max(existingPointsCount - 1, dataToUse.length - 1)]) // Ensure valid range
    .range([100, 800]); // Adjust delay range (min/max delay in ms)

  group
    .selectAll("circle")
    .data(dataToUse, (d) => d.age + d.sleepTime)
    .join(
      (enter) =>
        enter
          .append("circle")
          .attr("r", 1.5)
          .attr("fill", "#999")
          .attr("cx", (d) => xScaleSVG(d.age))
          .attr("cy", (d) => yScaleSVG(d.sleepTime))
          .attr("opacity", 0)
          .transition("scatterPlotTransitionEnter")
          .duration(400)
          .delay((d, i) => delayScale(i)) // Apply eased delay
          .attr("opacity", 1),
      (update) =>
        update
          .transition("scatterPlotTransitionUpdate")
          .duration(600)
          .attr("cx", (d) => xScaleSVG(d.age))
          .attr("cy", (d) => yScaleSVG(d.sleepTime)),
      (exit) =>
        exit
          .transition("scatterPlotTransitionExit")
          .duration(400) // Reverse easing for smooth exit
          .delay((d, i) => delayScale(existingPointsCount - 1 - i)) // Use previous count instead of dataToUse
          .attr("opacity", 0)
          .remove()
    );
};

/**
 * Sets scatterplot visibility explicitly and updates the chart.
 * @param {boolean} isVisible - Whether the scatterplot should be visible.
 */
export const setScatterVisibility = (isVisible) => {
  scatterVisible = isVisible;
};
