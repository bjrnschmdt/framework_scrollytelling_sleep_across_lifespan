// createScales.js

import * as d3 from "npm:d3";
import { settings } from "./settings.js";

const {
  ageMin,
  ageMax,
  sleepMin,
  sleepMax,
  startTime,
  endTime,
  margin,
  // plus any additional settings you might need
} = settings;

export function createScales({ w, h }) {
  const xScaleSVG = d3
    .scaleLinear()
    .domain([ageMin, ageMax - 1]) // Adjusted to match the data, bin 95–96 equals 95
    .rangeRound([margin.left, w - margin.right])
    .clamp(false);

  const yScaleSVG = d3
    .scaleLinear()
    .domain([sleepMin, sleepMax])
    .rangeRound([h - margin.bottom, margin.top])
    .clamp(false);

  const timeScale = d3
    .scaleTime()
    .domain([startTime, endTime])
    .range([h - margin.bottom, margin.top])
    .clamp(true);

  return {
    xScaleSVG,
    yScaleSVG,
    timeScale,
  };
}
