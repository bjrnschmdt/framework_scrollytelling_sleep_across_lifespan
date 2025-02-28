import * as d3 from "npm:d3";

let sampledData = null;
let scatterVisible = false;

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
    sampledData = d3.shuffle(simulatedData).slice(0, sampleSize); // Shuffle once

    // Sort the sampled data by age to ensure left-to-right animation
    sampledData.sort((a, b) => a.age - b.age);
  }

  updateScatterPlot(scatterGroup, { xScaleSVG, yScaleSVG });

  return scatterGroup;
};

/**
 * Updates the scatterplot dynamically with a left-to-right appearance.
 * @param {d3.Selection} group - The scatterplot group.
 * @param {Object} config - Configuration object.
 * @param {Function} config.xScaleSVG - x scale.
 * @param {Function} config.yScaleSVG - y scale.
 */
export const updateScatterPlot = (group, { xScaleSVG, yScaleSVG }) => {
  console.log("updateScatterPlot", scatterVisible);
  const dataToUse = scatterVisible ? sampledData : []; // Hide if not visible

  // Sort data by age for left-to-right effect
  dataToUse.sort((a, b) => a.age - b.age);

  // Define delay scale based on x (age)
  const ageExtent = d3.extent(dataToUse, (d) => d.age);
  const delayScale = d3.scaleLinear().domain(ageExtent).range([0, 1500]);

  // Define a noise factor to introduce slight randomness at the appearing front
  const falloffFraction = 1; // 10% of points at the appearing edge will have noise
  const totalPoints = dataToUse.length;
  const falloffStartIndex = Math.floor(totalPoints * (1 - falloffFraction));

  console.log("dataToUse ", dataToUse);

  group
    .selectAll("circle")
    .data(dataToUse, (d) => d.age + d.sleepTime)
    .join(
      (enter) =>
        enter
          .append("circle")
          .attr("r", 1)
          .attr("fill", "#999")
          .attr("cx", (d) => xScaleSVG(d.age))
          .attr("cy", (d) => yScaleSVG(d.sleepTime))
          .attr("opacity", 0)
          .transition("scatterPlotTransitionEnter")
          .duration(400)
          .delay((d, i) => {
            let baseDelay = delayScale(d.age);
            if (i >= falloffStartIndex) {
              baseDelay += Math.random() * 300 - 150; // Add noise (-150ms to +150ms)
            }
            return baseDelay;
          })
          .on("start", function () {
            // If scatterVisible is false, remove immediately instead of transitioning
            if (!scatterVisible) {
              d3.select(this).remove();
            }
          })
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
          .duration(400)
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
