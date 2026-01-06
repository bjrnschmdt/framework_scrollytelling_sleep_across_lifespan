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
  domain: yDomain,
  grid: true,
  label: "Schlafdauer (Stunden)",
});

const sexLabels = { Female: "weiblich", Male: "männlich" };
const formatSex = (value) => sexLabels[value] ?? value;

const defaultFx = { label: null, tickFormat: formatSex };

function dotPlot(
  data,
  { width = 600, height = 400, yDomain, xMax = 10, qradius = 3 } = {}
) {
  const oddXMax = xMax % 2 === 0 ? xMax + 1 : xMax;
  return Plot.plot({
    height,
    width,
    y: defaultY(yDomain),
    x: { domain: [-0.5, oddXMax - 0.5], axis: null },
    fx: defaultFx,
    marks: [
      Plot.dotY(
        data,
        Plot.stackX({
          offset: "center",
          fx: "group",
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

function hopPlot(
  data,
  { width = 600, height = 400, yDomain, qradius = 3, index = 0 } = {}
) {
  return Plot.plot({
    width,
    height,
    y: defaultY(yDomain),
    fx: defaultFx,
    marks: [
      Plot.dotY(pickNthByGroup(data, index), {
        fx: "group",
        y: "q",
        r: qradius,
        stroke: "none",
        fill: themeForeground,
        symbol: { draw: personSymbol },
      }),
    ],
  });
}

function hopTracedPlot(
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
    y: defaultY(yDomain),
    fx: defaultFx,
    color: {
      range: [themeBackgroundAlt, themeForeground],
    },
    marks: [
      Plot.dotY(pickForwardWindowByGroup(data, index, window), {
        fx: "group",
        y: "q",
        r: qradius,
        stroke: "none",
        fill: (d) => (1 / hopCount) * (d.order ?? 0),
        symbol: { draw: personSymbol },
      }),
    ],
  });
}

function percentilePlot(data, { width = 600, height = 400, yDomain } = {}) {
  // ...existing code...
  return Plot.plot({
    width,
    height,
    x: { axis: null },
    y: defaultY(yDomain),
    fx: defaultFx,
    marks: [
      Plot.dotY(data, {
        fx: "group",
        x: 0,
        y: "q",
        fill: themeForeground,
      }),
      Plot.textY(data, {
        fx: "group",
        x: 0,
        y: "q",
        dx: 20,
        text: (d) => format(".0%")(d.p),
      }),
    ],
  });
}

function boxPlot(data, { width = 600, height = 400, yDomain } = {}) {
  // ...existing code...
  return Plot.plot({
    width,
    height,
    x: { axis: null },
    y: defaultY(yDomain),
    fx: defaultFx,
    marks: [
      Plot.ruleX(data, {
        fx: "group",
        x: 0,
        y1: "whisker_low",
        y2: "q1",
        stroke: themeForeground,
        marker: "tick",
      }),
      Plot.ruleX(data, {
        fx: "group",
        x: 0,
        y1: "q3",
        y2: "whisker_high",
        stroke: themeForeground,
        marker: "tick",
      }),
      Plot.barY(data, {
        fx: "group",
        x: 0,
        y1: "q1",
        y2: "q3",
        fill: interpolateLab(themeBackgroundAlt, themeForeground)(0.2),
        stroke: themeForeground,
      }),
      Plot.tickY(data, {
        fx: "group",
        x: 0,
        y: "median",
        stroke: themeForeground,
      }),
    ],
  });
}
// Export all plot functions as named exports
export { dotPlot, hopPlot, hopTracedPlot, percentilePlot, boxPlot };
