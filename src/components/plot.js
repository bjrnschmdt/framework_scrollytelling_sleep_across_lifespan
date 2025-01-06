import * as d3 from "npm:d3";

export function updatePlot({
  data,
  plotClass,
  plotDataKey,
  enterFn,
  updateFn,
  filterFn = (arr) => arr,
  preprocessFn = () => ({}),
  xScaleSVG,
  yScaleDotPlot,
  yScaleBoxPlot,
  yScalePercentile,
}) {
  const svg = d3.select(".svg");

  if (!data || !data[plotDataKey] || data[plotDataKey].length === 0) {
    svg.selectAll(`.${plotClass}`).remove();
    return;
  }

  const array = data[plotDataKey];
  const filteredData = filterFn(array);
  const preprocessed = preprocessFn(filteredData);

  const context = {
    data: filteredData,
    originalData: data,
    scales: { xScaleSVG, yScaleDotPlot, yScaleBoxPlot, yScalePercentile },
    ...preprocessed,
  };

  const plot = svg
    .selectAll(`g.${plotClass}`)
    // Passing a dummy array of length 1 so that .join() sees “one container”
    .data([null])
    .join((enter) => enter.append("g").attr("class", plotClass))
    .attr("transform", `translate(${xScaleSVG(data.ageRange.start)},0)`);

  plot
    .selectAll(`.${plotClass}-element`)
    .data(filteredData, (d) => d.id)
    .join(
      (enter) => enterFn(enter, context).classed(`${plotClass}-element`, true),
      (update) => updateFn(update, context),
      (exit) => exit.remove()
    );
}

export function exitPlot() {
  const svg = d3.select(".svg");
  const plotClasses = ["dot-plot", "box-plot", "percentile-plot"];
  svg
    .selectAll(plotClasses.map((cls) => `.${cls}`).join(", "))
    .transition("opacity")
    .duration(200)
    .style("opacity", 0)
    .remove();
}
