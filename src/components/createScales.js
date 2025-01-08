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
    .domain([ageMin, ageMax])
    .rangeRound([margin.left, w - margin.right])
    .clamp(true);

  const yScaleSVG = d3
    .scaleLinear()
    .domain([sleepMin, sleepMax])
    .rangeRound([h - margin.bottom, margin.top])
    .clamp(true);

  const timeScale = d3
    .scaleTime()
    .domain([startTime, endTime])
    .range([h - margin.bottom, margin.top])
    .clamp(true);

  const yScaleDotPlot = d3
    .scaleLinear()
    .domain([sleepMin, sleepMax])
    .range([h - margin.bottom, margin.top]);

  const yScaleBoxPlot = d3
    .scaleLinear()
    .domain([sleepMin, sleepMax])
    .range([h - margin.bottom, margin.top]);

  return {
    xScaleSVG,
    yScaleSVG,
    timeScale,
    yScaleDotPlot,
    yScaleBoxPlot,
  };
}
