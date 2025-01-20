// pointerInteraction.js
import * as d3 from "npm:d3";
import _ from "npm:lodash";

import { createDebouncedLogger, set } from "./helperFunctions.js";
import { logInteraction } from "./logger.js";

function roundToStep(value, step) {
  return Math.round(value / step) * step;
}

/**
 * PointerInteraction handles all pointer-based (mouse/touch) interactivity on an SVG.
 */
export class PointerInteraction {
  /**
   * @param {d3.Selection} svg - A D3 selection of your SVG container.
   * @param {d3.Selection} container - A D3 selection or DOM element holding shared state (`.node().value`).
   * @param {object} config - Object to hold all parameters normally referenced as globals:
   *                         { margin, w, h, xScaleSVG, yScaleSVG }
   */
  constructor(svg, container, { margin, w, h, xScaleSVG, yScaleSVG }) {
    this.svg = svg;
    this.container = container;
    this.margin = margin;
    this.w = w;
    this.h = h;
    this.xScaleSVG = xScaleSVG;
    this.yScaleSVG = yScaleSVG;
    this.isPlotLocked = false;
    this.node = container.node();

    // Attach event listeners
    this.attachEventListeners();

    // Create a debounced logger
    this.debouncedLogger = createDebouncedLogger(logInteraction, 500); // 500ms delay
  }

  /**
   * Calculate the pointer's position and determine if it is within margins.
   */
  calculatePosition(event) {
    const [x, y] = d3.pointer(event);
    const withinMargins =
      x >= this.margin.left &&
      x <= this.w - this.margin.right &&
      y >= this.margin.top &&
      y <= this.h - this.margin.bottom;

    return { x, y, withinMargins };
  }

  /**
   * Map position to data values or reset if out of bounds.
   */
  calculateValue({ x, y, withinMargins }) {
    if (!withinMargins) {
      return {
        ...this.node.value,
        age: undefined,
        sleepTime: undefined,
      };
    }

    return {
      ...this.node.value,
      age: Math.round(this.xScaleSVG.invert(x)),
      sleepTime: roundToStep(this.yScaleSVG.invert(y), 0.25),
    };
  }

  /**
   * Update the cursor style based on the plot lock state.
   */
  updateInteractionState(locked) {
    this.svg.style("cursor", locked ? "not-allowed" : "crosshair");
  }

  /**
   * Handle pointer movement and update interaction state.
   */
  pointerMoved(event) {
    if (
      !this.isValidEvent(event) ||
      this.isPlotLocked ||
      !this.node.value.isExplorable
    ) {
      return;
    }

    const position = this.calculatePosition(event);
    const newValue = this.calculateValue(position);

    // Trigger an update only if the value changes
    if (!_.isEqual(this.node.value, newValue)) {
      set(this.node, newValue);

      // Log the interaction with a debounce
      this.debouncedLogger(newValue);
    }
  }

  /**
   * Toggle the lock state of the plot on pointer click.
   */
  pointerClicked() {
    this.isPlotLocked = !this.isPlotLocked;
    this.updateInteractionState(this.isPlotLocked);
  }

  /**
   * Validate the event object.
   */
  isValidEvent(event) {
    return event !== null && typeof event === "object";
  }

  /**
   * Attach pointer event listeners to the SVG element.
   */
  attachEventListeners() {
    this.svg
      .on("pointerenter pointermove", this.pointerMoved.bind(this))
      .on("click", this.pointerClicked.bind(this))
      .on("touchstart", (event) => event.preventDefault()); // Prevent default touch behavior
  }
}
