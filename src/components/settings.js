import * as d3 from "npm:d3";
import { Generators } from "npm:@observablehq/stdlib";

const relativeHeight = 0.6;

// This doesn't work because the generator output is an async function
export const w = Generators.width(document.querySelector("main"));

const h = (() => {
  const isLandscape = w > window.innerHeight;
  return isLandscape
    ? /* (w / 3) * 2 */ window.innerHeight * relativeHeight
    : window.innerHeight * relativeHeight; // 16:9 for landscape, 60vh for portrait
})();

const margin = {
  top: 64,
  right: 16,
  bottom: 64,
  left: 16,
};

const lineWidths = {
  thin: 0.5,
  regular: 1,
  medium: 1.5,
  thick: 2,
};

const colors = {
  background: "black",
  grid: "white",
  recommended: "#2e807d",
  acceptable: "#3d1438",
  text: "white",
  strokeOutline: "black",
};

// sleep axis settings
const sleepMin = 4;
const sleepMax = 13;
const sleepStep = 0.25;
/* const nthresholdsSleep = 18;
const thresholdsSleep = d3.ticks(sleepMin, sleepMax, nthresholdsSleep); */
const nthresholdsSleep = 36;
const thresholdsSleep = d3.range(sleepMin, sleepMax + sleepStep, sleepStep);

const ageMin = 5;
const ageMax = 95;
const nthresholdsAge = 90;
const thresholdsAge = d3.ticks(ageMin, ageMax, nthresholdsAge);
const fontFamily = "Roboto";
const fontSize = "12px";
const icon =
  "M400-80v-280h-80v-240q0-33 23.5-56.5T400-680h160q33 0 56.5 23.5T640-600v240h-80v280H400Zm80-640q-33 0-56.5-23.5T400-800q0-33 23.5-56.5T480-880q33 0 56.5 23.5T560-800q0 33-23.5 56.5T480-720Z";

const qwidth = h - margin.top - margin.bottom;
const qdomain = [sleepMin, sleepMax];
const qstep = 540 / 20 / 60;
const qradius = (0.5 * qwidth * qstep) / (qdomain[1] - qdomain[0]);

// Convert sleep time hours to JavaScript date objects
const startTime = new Date();
startTime.setHours(sleepMin, 0, 0, 0); // Set hours, minutes, seconds, milliseconds

// Convert sleep time hours to JavaScript date objects
const endTime = new Date();
endTime.setHours(sleepMax, 0, 0, 0); // Set hours, minutes, seconds, milliseconds

export const settings = {
  w,
  h,
  ageMin,
  ageMax,
  nthresholdsAge,
  thresholdsAge,
  sleepMin,
  sleepMax,
  nthresholdsSleep,
  thresholdsSleep,
  canvasScaleFactor: 2,
  margin,
  qstep, // quantile step size in hours
  qdomain, // quantile domain in hours
  qwidth,
  qradius,
  numQuantiles: 20, // number of quantiles
  smooth: false, // quantile dot plot smoothing
  canvasScaleFactor: 2,
  percentileSelection: [0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95],
  mostProminent: [5, 10, 25, 50, 75, 90, 95], // Most significant percentiles
  lessProminent: [
    5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95,
  ], // Steps of 5
  fontFamily,
  fontSize,
  lineWidths,
  icon,
  colors,
  startTime,
  endTime,
};
