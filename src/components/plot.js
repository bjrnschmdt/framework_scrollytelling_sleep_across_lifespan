import * as d3 from "npm:d3";

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
  yScaleDotPlot,
  yScaleBoxPlot,
  yScalePercentile,
}) {
  const svg = d3.select(".svg");

  if (!data || !data[plotDataKey] || data[plotDataKey].length === 0) {
    exitPlot();
    return;
  }

  const array = data[plotDataKey];
  const filteredData = filterFn(array);
  const preprocessed = preprocessFn(filteredData);

  const context = {
    data: filteredData,
    originalData: data,
    scales: {
      xScaleSVG,
      yScaleSVG,
      yScaleDotPlot,
      yScaleBoxPlot,
      yScalePercentile,
    },
    ...preprocessed,
  };

  /*   console.log("filteredData", filteredData);
   */
  const plot = svg
    .selectAll(`g.${plotClass}`)
    // Passing a dummy array of length 1 so that .join() sees “one container”
    .data([null])
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
  const plotClasses = ["dot-plot", "box-plot", "percentile-plot", "hop-plot"];
  svg.selectAll(plotClasses.map((cls) => `.${cls}`).join(", ")).remove();
}
