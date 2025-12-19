import { settings } from "./settings.js";
import * as Plot from "npm:@observablehq/plot";
import { format } from "npm:d3-format";
import { interpolateLab } from "npm:d3-interpolate";
import {
  toTurtle,
  resolveCssColor,
  pickNthByGroup,
  pickForwardWindowByGroup,
} from "./helperFunctions.js";

const { colors, personPath, hopCount, hopDuration } = settings;

const themeBackgroundAlt = resolveCssColor("--theme-background-alt");
const themeForeground = resolveCssColor("--theme-foreground");

// Person symbol for plots
const personSymbol = toTurtle(personPath, {
  scaleFn: (area) => Math.sqrt(area) / 20,
});

// Common plot config helpers
const defaultY = (yDomain) => ({
  tickFormat: () => "",
  domain: yDomain,
  grid: true,
  label: null,
});
const defaultFx = { label: null };

function genericDotPlot(
  data,
  { width = 600, height = 400, yDomain, xMax = 10, qradius = 3 } = {}
) {
  console.log("dotPlot data", data);
  return Plot.plot({
    width,
    height,
    marginLeft: 10,
    x: {
      label: "x-Achse",
      tickFormat: () => "",
      domain: [-4, xMax + 4],
      axis: null,
    },
    y: defaultY(yDomain),
    marks: [
      Plot.dotY(
        data,
        Plot.stackX({
          offset: "center",
          y: "x",
          r: qradius,
          stroke: "none",
          fill: themeForeground,
          symbol: { draw: personSymbol },
        })
      ),
    ],
  });
}

function genericHopPlot(
  data,
  { width = 600, height = 400, yDomain, qradius = 3, index = 0 } = {}
) {
  /* console.log("hopPlot data", data); */
  return Plot.plot({
    width,
    height,
    marginLeft: 10,
    y: defaultY(yDomain),
    marks: [
      Plot.dotY(pickNthByGroup(data, index), {
        y: "q",
        r: qradius,
        stroke: "none",
        fill: themeForeground,
        symbol: { draw: personSymbol },
      }),
    ],
  });
}

function genericHopTracedPlot(
  data,
  {
    width = 600,
    height = 400,
    yDomain,
    qradius = 3,
    window = hopCount,
    index = 0,
  } = {}
) {
  return Plot.plot({
    width,
    height,
    marginLeft: 10,
    y: defaultY(yDomain),
    color: {
      range: [themeBackgroundAlt, themeForeground],
    },
    marks: [
      Plot.dotY(pickForwardWindowByGroup(data, index, window), {
        y: "q",
        r: qradius,
        stroke: "none",
        fill: (d) => (1 / hopCount) * (d.order ?? 0),
        symbol: { draw: personSymbol },
      }),
    ],
  });
}

function genericPercentilePlot(
  data,
  { width = 600, height = 400, yDomain } = {}
) {
  return Plot.plot({
    width,
    height,
    marginLeft: 10,
    x: {
      label: "x-Achse",
      tickFormat: () => "",
      axis: null,
    },
    y: defaultY(yDomain),
    marks: [
      Plot.dotY(data, {
        x: 0,
        y: "q",
        fill: themeForeground,
      }),
      Plot.textY(data, {
        x: 0,
        y: "q",
        dx: 20,
        text: (d) => format(".0%")(d.p),
      }),
    ],
  });
}

function genericBoxPlot(data, { width = 600, height = 400, yDomain } = {}) {
  return Plot.plot({
    width,
    height,
    marginLeft: 10,
    x: {
      label: "x-Achse",
      tickFormat: () => "",
      axis: null,
      padding: 0.5,
    },
    y: defaultY(yDomain),
    marks: [
      Plot.ruleX(data, {
        x: 0,
        y1: "whisker_low",
        y2: "q1",
        stroke: themeForeground,
        marker: "tick",
      }),
      Plot.ruleX(data, {
        x: 0,
        y1: "q3",
        y2: "whisker_high",
        stroke: themeForeground,
        marker: "tick",
      }),
      Plot.barY(data, {
        x: 0,
        y1: "q1",
        y2: "q3",
        fill: interpolateLab(themeBackgroundAlt, themeForeground)(0.2),
        stroke: themeForeground,
      }),
      Plot.tickY(data, {
        x: 0,
        y: "median",
        stroke: themeForeground,
      }),
    ],
  });
}
// Export all plot functions as named exports
export {
  genericDotPlot,
  genericHopPlot,
  genericHopTracedPlot,
  genericPercentilePlot,
  genericBoxPlot,
};
