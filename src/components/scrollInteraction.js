import * as d3 from "npm:d3";
import {
  createDebouncedLogger,
  set,
  roundToStep,
  debugLog,
} from "./helperFunctions.js";
import { logInteraction } from "./logger.js";
import { settings } from "./settings.js";

// Destructure constants from settings for easy configuration.
const { sleepMin, sleepMax, margin } = settings;

export class ScrollInteraction {
  /**
   * Manages horizontal scrolling for the visualization.
   *
   * @param {HTMLElement} element - The scrollable container (default: `#body`).
   * @param {Object} chartElement - Observable's reactive chart object.
   * @param {Function} xScaleSVG - D3 scale function mapping age to pixel position.
   * @param {Function} yScaleSVG - D3 scale mapping the chart's vertical range.
   * @param {number} width - The width of the container.
   */
  constructor(
    element = document.querySelector("#body"),
    chartElement,
    xScaleSVG,
    yScaleSVG,
    width
  ) {
    this.element = element;
    this.chartElement = chartElement;
    this.xScaleSVG = xScaleSVG;
    this.yScaleSVG = yScaleSVG;
    this.width = width;

    // Flags to manage scroll behavior
    this.isExplorable = false;
    this.forceProgrammaticScroll = false;
    this.ignoreScrollEvent = false;

    // Bind event handlers to preserve "this" context and store them for cleanup.
    this.boundHandleScroll = this.handleScroll.bind(this);
    this.boundHandleVerticalScroll = this.handleVerticalScroll.bind(this);

    // Debounced logger for interaction tracking
    this.debouncedLogger = createDebouncedLogger(logInteraction, 500); // Log interactions after a 500ms delay

    this.init();
  }

  /**
   * Initializes the scroll event listeners.
   */
  init() {
    // The 'passive' flag helps improve scroll performance.
    this.element.addEventListener("scroll", this.boundHandleScroll, {
      passive: true,
    });
    window.addEventListener("scroll", this.boundHandleVerticalScroll, {
      passive: true,
    });
  }

  /**
   * Removes event listeners to clean up resources.
   */
  destroy() {
    this.element.removeEventListener("scroll", this.boundHandleScroll);
    window.removeEventListener("scroll", this.boundHandleVerticalScroll);
  }

  /**
   * Handles horizontal scrolling. Calculates the new age value based on the
   * current scroll position and updates the reactive chart if it changes.
   */
  handleScroll() {
    // Skip processing if a programmatic scroll was just triggered.
    if (this.ignoreScrollEvent) return;

    // Calculate the age by inverting the x-scale using the center of the view.
    const ageScroll = Math.round(
      this.xScaleSVG.invert(this.element.scrollLeft + this.width / 2)
    );

    // Update the reactive chart only if the age value has changed.
    if (ageScroll !== this.chartElement.value.age) {
      set(this.chartElement, { ...this.chartElement.value, age: ageScroll });
      debugLog("scrollInteraction", "set age", ageScroll);
    }

    this.debouncedLogger({
      age: ageScroll,
      sleepTime: this.chartElement.value.sleepTime,
    });
  }

  /**
   * Smoothly scrolls the container horizontally to a target domain value.
   *
   * @param {number} targetDomainLeft - The domain value to scroll to.
   * @param {number} duration - Duration of the scroll animation in milliseconds.
   */
  programmaticScroll(targetDomainLeft, duration) {
    // Only perform programmatic scrolling if not in explorable mode
    // or if a forced scroll is requested.
    debugLog(
      "scrollInteraction",
      "programmaticScroll fired",
      this.isExplorable,
      this.forceProgrammaticScroll
    );
    if (this.isExplorable && !this.forceProgrammaticScroll) return;

    // Reset force flag and ignore subsequent scroll events during animation.
    this.forceProgrammaticScroll = false;
    this.ignoreScrollEvent = true;
    debugLog(
      "scrollInteraction",
      "set this.ignoreScrollEvent true",
      this.ignoreScrollEvent
    );

    // Calculate the target scroll offset based on the x-scale.
    const targetScroll = this.xScaleSVG(targetDomainLeft);
    const element = this.element;

    debugLog("scrollInteraction", "element.scrollLeft", element.scrollLeft);
    debugLog("scrollInteraction", "targetDomainLeft", targetDomainLeft);
    debugLog("scrollInteraction", "targetScroll", targetScroll);

    // Use D3 transitions to smoothly animate the scrollLeft property.
    d3.transition()
      .duration(duration)
      .tween("scrollTween", function () {
        const interpolator = d3.interpolateNumber(
          element.scrollLeft,
          targetScroll
        );
        return function (t) {
          // Using requestAnimationFrame here ensures a smooth update.
          debugLog("scrollInteraction", "tween", interpolator(t));
          requestAnimationFrame(() => {
            element.scrollLeft = interpolator(t);
          });
        };
      })
      .on("end", () => {
        // Re-enable scroll event processing after a brief delay.
        // Consider adding an "interrupt" handler if needed.
        setTimeout(() => {
          this.ignoreScrollEvent = false;
          debugLog(
            "scrollInteraction",
            "set this.ignoreScrollEvent false",
            this.ignoreScrollEvent
          );
        }, 150);
      });
  }

  /**
   * Enables or disables user-initiated scrolling.
   *
   * @param {boolean} state - `true` to enable scrolling, `false` to disable.
   */
  setExplorable(state) {
    // Only update if there's a change in state.
    if (state === this.isExplorable) return;

    this.isExplorable = state;

    this.element.style.overflowX = state ? "scroll" : "hidden";
    // If disabling exploration, reset the scroll position based on the current age.
    if (!state) {
      this.element.scrollLeft = this.xScaleSVG(
        this.chartElement.value.age - 5.5
      );
    }
  }

  /**
   * Sets a flag to force programmatic scrolling even if explorable mode is active.
   *
   * @param {boolean} state - True to force programmatic scrolling.
   */
  setForceProgrammaticScroll(state) {
    this.forceProgrammaticScroll = state;
  }

  /**
   * Handles vertical scrolling. When in explorable mode and if the window's scroll
   * is within a specified range (between elements with data-step="8" and data-step="9"),
   * calculates a new sleepTime value and updates the reactive chart.
   */
  handleVerticalScroll() {
    // Only proceed if in explorable mode.
    if (!this.isExplorable) return;

    // Select the two DOM elements that define the vertical scroll boundaries.
    const step8 = document.querySelector('[data-step="8"]');
    const step9 = document.querySelector('[data-step="9"]');
    if (!step8 || !step9) return; // Exit if boundaries are not found.

    // Get the absolute positions for the boundary elements.
    const step8Rect = step8.getBoundingClientRect();
    const step9Rect = step9.getBoundingClientRect();
    const lowerBoundary = step8Rect.bottom + window.scrollY;
    const upperBoundary = step9Rect.top + window.scrollY;

    // Calculate the vertical offset: half the chart's height plus the top margin.
    const chartRange = this.yScaleSVG.range();
    const chartHeight = Math.abs(chartRange[1] - chartRange[0]);
    const offset = chartHeight / 2 + margin.top;

    // Adjust the current scrollY to represent the chart's center position.
    const currentScrollY = window.scrollY + offset;

    // Update the sleepTime only if the current scroll is within the boundaries.
    // Map the vertical scroll position linearly to a sleepTime value.
    const sleepScale = d3
      .scaleLinear()
      .domain([lowerBoundary, upperBoundary])
      .range([sleepMin, sleepMax])
      .clamp(true);

    const newSleepTimeUnrounded = sleepScale(currentScrollY);
    const newSleepTime = roundToStep(newSleepTimeUnrounded, 0.25);

    // Update the chart if the sleepTime has changed.
    if (this.chartElement.value.sleepTime !== newSleepTime) {
      set(this.chartElement, {
        ...this.chartElement.value,
        sleepTime: newSleepTime,
      });

      // Log interaction data with debounce
      this.debouncedLogger({
        age: this.chartElement.value.age,
        sleepTime: newSleepTime,
      });
    }
  }
}
