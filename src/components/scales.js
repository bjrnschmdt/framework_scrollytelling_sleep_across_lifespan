import * as d3 from "npm:d3";
import { settings } from "./settings.js";

const { w, ageMin, ageMax, margin } = settings;

/* console.log("w", w);
console.log("ageMin", ageMin); */

export const xScaleSVG = d3
  .scaleLinear()
  .domain([ageMin, ageMax]) // Data space
  .rangeRound([margin.left, w - margin.right]) // Pixel space
  .clamp(true);
