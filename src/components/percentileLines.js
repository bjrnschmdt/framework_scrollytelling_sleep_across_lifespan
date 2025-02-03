// percentileLines.js
import * as d3 from "npm:d3";
import { settings } from "./settings.js"; // Default settings

/**
 * Class representing percentile lines for a scrollytelling visualization.
 */
export class PercentileLines {
  /**
   * @param {d3.Selection} svg - The D3 selection for the SVG element.
   * @param {object} options - Configuration options.
   * @param {Map} options.dataSet - A Map containing the data for the plot.
   * @param {function} options.xScaleSVG - D3 scale function for x positions.
   * @param {function} options.yScaleSVG - D3 scale function for y positions.
   * @param {object} [options.config] - Optional configuration.
   *        Expected keys: mostProminent, lessProminent, lineWidths, colors, showPercentiles.
   */
  constructor(svg, { dataSet, xScaleSVG, yScaleSVG, config = {} } = {}) {
    this.svg = svg;
    this.dataSet = dataSet;
    this.xScaleSVG = xScaleSVG;
    this.yScaleSVG = yScaleSVG;
    this.show = false; // Default visibility state

    // Merge default settings with user-provided configuration.
    this.config = {
      mostProminent: config.mostProminent || settings.mostProminent,
      lessProminent: config.lessProminent || settings.lessProminent,
      lineWidths: config.lineWidths || settings.lineWidths,
      colors: config.colors || settings.colors,
    };

    // Store showPercentiles as an instance property
    // (You can provide an initial value via config if needed.)
    this.showPercentiles = config.showPercentiles || [];

    // Create a unified container for percentile lines.
    this.group = svg
      .append("g")
      .attr("class", "percentile-lines")
      .attr("clip-path", "url(#plot-clip)");
  }

  /**
   * Sets the array of percentile keys to display.
   * @param {Array} showPercentiles - e.g. ["A", "B", "C"]
   */
  setShowPercentiles(showPercentiles) {
    this.showPercentiles = showPercentiles;
  }

  /**
   * Sets the visibility of the percentile lines.
   * @param {boolean} visible - True to show, false to hide.
   */
  setVisibility(visible) {
    this.show = visible;
    this.group.style("display", visible ? "block" : "none");
  }

  /**
   * Renders or updates the percentile lines. If no argument is provided,
   * the instance's stored showPercentiles value is used.
   *
   * @param {Array} [showPercentiles] - An array of keys (e.g., ["A", "B", "C"])
   *                                    determining which percentiles to display.
   */
  render(showPercentiles = this.showPercentiles) {
    if (!this.show) return;
    if (!this.dataSet) {
      console.warn("PercentileLines.render: dataSet is undefined");
      return;
    }

    // Prepare the data: flatten and group by percentile.
    const dataArray = Array.from(this.dataSet.values());
    const flattenedData = dataArray.flatMap((d) =>
      d.percentile.map((p) => ({
        age: d.ageRange.start,
        percentile: Math.round(p.p * 100),
        tst: p.q,
      }))
    );

    const groupedByPercentile = d3.groups(flattenedData, (d) => d.percentile);

    // Filter groups based on the display rules.
    const visiblePercentiles = groupedByPercentile.filter(([percentileKey]) =>
      this._shouldDisplayPercentile(Number(percentileKey), showPercentiles)
    );

    // Bind data to groups of percentile lines.
    const percentileGroups = this.group
      .selectAll(".percentile-group")
      .data(visiblePercentiles, (d) => d[0]);

    // ENTER selection: Create new groups for new data.
    const enterGroups = percentileGroups
      .enter()
      .append("g")
      .attr("class", "percentile-group")
      .style("opacity", 0);

    enterGroups.each((d, i, nodes) => {
      const percentileKey = Number(d[0]);
      const percentileData = d[1];
      const { strokeOpacity, strokeWidth } = this._getStrokeAttributes(
        percentileKey,
        showPercentiles
      );

      d3.select(nodes[i])
        .append("path")
        .datum(percentileData)
        .attr("fill", "none")
        .attr("stroke", this.config.colors.text)
        .attr("stroke-width", strokeWidth)
        .attr("stroke-opacity", strokeOpacity)
        .attr("d", this._lineGenerator());
    });

    // Animate new groups into view.
    enterGroups
      .transition()
      .duration(600)
      .ease(d3.easeCubicInOut)
      .style("opacity", 1);

    // UPDATE selection: Update existing groups with new data or style.
    percentileGroups.each((d, i, nodes) => {
      const percentileKey = Number(d[0]);
      const percentileData = d[1];
      const { strokeOpacity, strokeWidth } = this._getStrokeAttributes(
        percentileKey,
        showPercentiles
      );
      d3.select(nodes[i])
        .select("path")
        .datum(percentileData)
        .transition()
        .duration(600)
        .ease(d3.easeCubicInOut)
        .attr("stroke-width", strokeWidth)
        .attr("stroke-opacity", strokeOpacity)
        .attr("d", this._lineGenerator());
    });

    // EXIT selection: Fade out and remove groups that are no longer needed.
    percentileGroups
      .exit()
      .transition()
      .duration(600)
      .ease(d3.easeCubicInOut)
      .style("opacity", 0)
      .remove();
  }

  /**
   * Updates the scales and smoothly transitions the paths.
   * @param {function} xScaleSVG - The new D3 scale for the x-axis.
   * @param {function} yScaleSVG - The new D3 scale for the y-axis.
   */
  updateScales(xScaleSVG, yScaleSVG) {
    this.xScaleSVG = xScaleSVG;
    this.yScaleSVG = yScaleSVG;

    // Update the paths using the new scales.
    this.group
      .selectAll(".percentile-group path")
      .transition()
      .duration(1000)
      .ease(d3.easeCubicInOut)
      .attr("d", this._lineGenerator());
  }

  /**
   * Optionally update the data set.
   * @param {Map} dataSet - The new data set.
   */
  updateDataSet(dataSet) {
    this.dataSet = dataSet;
  }

  /**
   * Creates a D3 line generator using the current scales.
   * @returns {d3.Line} A D3 line generator.
   * @private
   */
  _lineGenerator() {
    return d3
      .line()
      .curve(d3.curveNatural)
      .x((d) => this.xScaleSVG(d.age))
      .y((d) => this.yScaleSVG(d.tst));
  }

  /**
   * Determines if a given percentile key should be displayed.
   * @param {number} percentileKey - The percentile value (e.g., 5, 10, 15, etc.).
   * @param {Array} showPercentiles - The array of display keys (e.g., ["A", "B", "C"]).
   * @returns {boolean} True if the percentile should be shown; otherwise, false.
   * @private
   */
  _shouldDisplayPercentile(percentileKey, showPercentiles) {
    if (
      this.config.mostProminent.includes(percentileKey) &&
      showPercentiles.includes("A")
    ) {
      return true;
    }
    if (
      this.config.lessProminent.includes(percentileKey) &&
      percentileKey % 5 === 0 &&
      showPercentiles.includes("B")
    ) {
      return true;
    }
    if (showPercentiles.includes("C")) {
      return true;
    }
    return false;
  }

  /**
   * Determines the stroke opacity and width for a percentile line.
   * @param {number} percentileKey - The percentile value.
   * @param {Array} showPercentiles - The array of display keys.
   * @returns {object} An object with strokeOpacity and strokeWidth properties.
   * @private
   */
  _getStrokeAttributes(percentileKey, showPercentiles) {
    let strokeOpacity = 0.4;
    let strokeWidth = this.config.lineWidths.regular;

    if (
      this.config.mostProminent.includes(percentileKey) &&
      showPercentiles.includes("A")
    ) {
      strokeOpacity = 0.4;
      strokeWidth = this.config.lineWidths.regular;
    } else if (
      this.config.lessProminent.includes(percentileKey) &&
      percentileKey % 5 === 0 &&
      showPercentiles.includes("B")
    ) {
      strokeOpacity = 0.4;
      strokeWidth = this.config.lineWidths.thin;
    } else if (showPercentiles.includes("C")) {
      strokeOpacity = 0.2;
      strokeWidth = this.config.lineWidths.regular;
    }
    return { strokeOpacity, strokeWidth };
  }
}

export default PercentileLines;
