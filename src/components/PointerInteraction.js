// pointerInteraction.js
import * as d3 from "npm:d3";

import { createDebouncedLogger, set } from "./helperFunctions.js";
import { logInteraction } from "./logger.js";

/**
 * Utility function to round a value to the nearest step.
 * @param {number} value - The value to round.
 * @param {number} step - The step size for rounding.
 * @returns {number} - The rounded value.
 */
function roundToStep(value, step) {
  return Math.round(value / step) * step;
}

/**
 * PointerInteraction handles pointer-based interactivity (mouse/touch) for an SVG element.
 */
export class PointerInteraction {
  /**
   * Initializes the PointerInteraction class with the given configuration.
   * @param {d3.Selection} svg - D3 selection of the SVG container.
   * @param {object} config - Configuration object containing the following properties:
   * @param {object} config.margin - Margins of the SVG (top, right, bottom, left).
   * @param {number} config.w - Width of the SVG.
   * @param {number} config.h - Height of the SVG.
   * @param {d3.Scale} config.xScaleSVG - D3 scale for the x-axis.
   * @param {d3.Scale} config.yScaleSVG - D3 scale for the y-axis.
   * @param {d3.Selection} config.container - D3 selection of the container wrapping the SVG.
   */

  constructor(svg, { margin, w, h, xScaleSVG, yScaleSVG, container }) {
    this.svg = svg;
    this.margin = margin;
    this.w = w;
    this.h = h;
    this.xScaleSVG = xScaleSVG;
    this.yScaleSVG = yScaleSVG;

    this.container = container;
    this.node = container.node(); // DOM node of the container

    this.isPlotLocked = false; // Whether pointer interactions are disabled
    this.isExplorable = false; // Whether the plot is in an interactive state

    // Attach event listeners to the SVG
    this.attachEventListeners();

    // Debounced logger for interaction tracking
    this.debouncedLogger = createDebouncedLogger(logInteraction, 500); // Log interactions after a 500ms delay
  }

  /**
   * Calculates the pointer position relative to the SVG and checks if it is within margins.
   * @param {Event} event - The pointer event.
   * @returns {object} - An object containing x, y coordinates and a boolean indicating if it's within margins.
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
   * Maps pointer position to data values or resets values if out of bounds.
   * @param {object} position - Object containing x, y coordinates and withinMargins status.
   * @returns {object|null} - An object with `newAge` and `newSleepTime` or `null` if out of bounds.
   */
  calculateValue({ x, y, withinMargins }) {
    if (!withinMargins) {
      return {
        newAge: undefined,
        newSleepTime: undefined,
      };
    }

    return {
      newAge: Math.round(this.xScaleSVG.invert(x)),
      newSleepTime: roundToStep(this.yScaleSVG.invert(y), 0.25),
    };
  }

  /**
   * Updates the SVG cursor style based on the plot's lock state.
   * @param {boolean} locked - Whether the plot is locked.
   */
  updateInteractionState(locked) {
    this.svg.style("cursor", locked ? "not-allowed" : "crosshair");
  }

  /**
   * Handles pointer movement, calculates position and value, and triggers updates if values change.
   * @param {Event} event - The pointer event.
   */
  pointerMoved(event) {
    // Ignore invalid events or if interaction is not allowed
    if (
      !this.isValidEvent(event) ||
      this.isPlotLocked ||
      !this.isExplorable()
    ) {
      return;
    }

    const position = this.calculatePosition(event);
    const value = this.calculateValue(position);

    if (!value) {
      return; // Do nothing if pointer is outside the allowed area
    }

    const { newAge, newSleepTime } = value;

    const currentAge = this.node.value.age;
    const currentSleepTime = this.node.value.sleepTime;

    // Update only if values have changed
    const ageChanged = currentAge !== newAge;
    const sleepTimeChanged = currentSleepTime !== newSleepTime;

    if (ageChanged || sleepTimeChanged) {
      if (ageChanged) {
        set(this.node, { ...this.node.value, age: newAge });
      }
      if (sleepTimeChanged) {
        set(this.node, { ...this.node.value, sleepTime: newSleepTime });
      }

      // Log interaction data with debounce
      this.debouncedLogger({ age: newAge, sleepTime: newSleepTime });
    }
  }

  /**
   * Toggles the lock state of the plot when the pointer is clicked.
   */
  pointerClicked() {
    this.isPlotLocked = !this.isPlotLocked; // Toggle lock state
    this.updateInteractionState(this.isPlotLocked);
  }

  /**
   * Validates the event to ensure it is non-null and of the correct type.
   * @param {Event} event - The event to validate.
   * @returns {boolean} - `true` if the event is valid, otherwise `false`.
   */
  isValidEvent(event) {
    return event !== null && typeof event === "object";
  }

  /**
   * Attaches pointer event listeners to the SVG element.
   */
  attachEventListeners() {
    this.svg
      .on("pointerenter pointermove", this.pointerMoved.bind(this))
      .on("click", this.pointerClicked.bind(this))
      .on("touchstart", (event) => event.preventDefault()); // Prevent default touch behaviors
  }
}
