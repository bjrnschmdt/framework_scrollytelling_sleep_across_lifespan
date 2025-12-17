import * as d3 from "npm:d3";
import { Generators } from "npm:@observablehq/stdlib";

const estimatePercentageSetup = {
  A: {
    name: "Alina",
    age: 35,
    sleepTime: 5.75,
  },
  B: {
    name: "Mehmet",
    age: 41,
    sleepTime: 8.25,
  },
  C: {
    name: "Liu",
    age: 70,
    sleepTime: 6.75,
  },
  D: {
    name: "Carmen",
    age: 55,
    sleepTime: 6.15,
  },
};

const estimateSleepSetup = {
  A: {
    name: "John",
    age: 25,
    sleepTime: 8,
  },
  B: {
    name: "Eva",
    age: 32,
    sleepTime: 7,
  },
  C: {
    name: "Josef",
    age: 74,
    sleepTime: 5.5,
  },
  D: {
    name: "Andrea",
    age: 45,
    sleepTime: 6.5,
  },
};

const relativeHeight = 0.6;

const margin = {
  top: 32,
  right: 0,
  bottom: 32,
  left: 0,
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
const ageMax = 96;
const nthresholdsAge = 91;
const thresholdsAge = d3.ticks(ageMin, ageMax, nthresholdsAge);
const fontFamily = "Open Sans";
const fontSize = "13px";
const iconPath =
  "M400-80v-280h-80v-240q0-33 23.5-56.5T400-680h160q33 0 56.5 23.5T640-600v240h-80v280H400Zm80-640q-33 0-56.5-23.5T400-800q0-33 23.5-56.5T480-880q33 0 56.5 23.5T560-800q0 33-23.5 56.5T480-720Z";
const personPath =
  "M 0 -9.5 A 2.4 2.5 0 0 0 -2.4 -7 A 2.4 2.5 0 0 0 0 -4.5 A 2.4 2.5 0 0 0 2.4 -7 A 2.4 2.5 0 0 0 0 -9.5 z M -2.8 -4.2 C -3.7 -4.2 -4.3 -3.6 -4.3 -2.7 L -4.3 1.8 C -4.3 2.6 -3.7 3.3 -2.8 3.3 L -2.8 3.3 L -2.8 8.7 C -2.8 9.2 -2.4 9.6 -1.9 9.6 L 1.9 9.6 C 2.4 9.6 2.8 9.2 2.8 8.7 L 2.8 3.3 L 2.8 3.3 C 3.7 3.3 4.3 2.6 4.3 1.8 L 4.3 -2.7 C 4.3 -3.6 3.7 -4.2 2.8 -4.2 L -2.8 -4.2 Z";

const qstep = 540 / 20 / 60;

// Convert sleep time hours to JavaScript date objects
const startTime = new Date();
startTime.setHours(sleepMin, 0, 0, 0); // Set hours, minutes, seconds, milliseconds

// Convert sleep time hours to JavaScript date objects
const endTime = new Date();
endTime.setHours(sleepMax, 0, 0, 0); // Set hours, minutes, seconds, milliseconds

const casesData = [
  { name: "Leo", age: 8.1, tib: 12 },
  { name: "Paula", age: 17.35, tib: 9 },
  { name: "Karin", age: 31.15, tib: 7 },
  { name: "Maria", age: 75, tib: 6 },
];

export const settings = {
  relativeHeight,
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
  iconPath,
  personPath,
  colors,
  startTime,
  endTime,
  casesData,
  hopCount: 5,
  hopDuration: 400,
  estimatePercentageSetup,
  estimateSleepSetup,
  qstepComp: 0.25,
  qheightComp: 400,
};
