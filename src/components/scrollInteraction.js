import * as d3 from "npm:d3";
import { createDebouncedLogger, set, roundToStep } from "./helperFunctions.js";
import { settings } from "./settings.js";

const { sleepMin, sleepMax, margin } = settings;

export class ScrollInteraction {
  /**
   * Manages horizontal scrolling for the visualization.
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
    // Scroll container element (default: #body)
    this.element = element;

    // Reference to the Observable chart element, which holds the state
    this.chartElement = chartElement;

    // D3 scale function mapping age to horizontal pixel position
    this.xScaleSVG = xScaleSVG;
    this.yScaleSVG = yScaleSVG;

    // Width of the scrollable area
    this.width = width;

    // State tracking
    this.isScrolling = false; // Tracks whether user scrolling is happening
    this.isExplorable = false; // Controls whether the user can scroll manually
    this.ignoreScrollEvent = false; // Prevents unwanted scroll events
    this.lastTouchTime = 0; // Helps detect quick swipe gestures
    this.scrollTimeout = null; // Timeout for debounce-like scroll detection
    this.scrollLeft = 0; // Stores current scroll position
    this.updateSource = null; // Track the source of updates (either 'scroll' or 'slider')

    // Add debounced vertical scroll listener for sleepTime updates.
    // This will update chartValue.sleepTime when the window scroll is within the defined area.
    this.debouncedVerticalScroll = this.debounce(
      this.handleVerticalScroll.bind(this),
      100
    );
    window.addEventListener(
      "scroll",
      /* this.debouncedVerticalScroll */ this.handleVerticalScroll.bind(this)
    );

    this.init(); // Attach event listeners
  }

  /**
   * A simple debounce helper.
   * @param {Function} func - The function to debounce.
   * @param {number} wait - Delay in milliseconds.
   * @returns {Function}
   */
  debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(this, args);
      }, wait);
    };
  }

  /**
   * Initializes event listeners for scrolling and touch interactions.
   */
  init() {
    this.element.addEventListener(
      "touchstart",
      this.handleTouchStart.bind(this),
      { passive: false }
    );
    this.element.addEventListener(
      "touchmove",
      this.handleTouchMove.bind(this),
      { passive: false }
    );
    this.element.addEventListener("touchend", this.handleTouchEnd.bind(this), {
      passive: true,
    });
    this.element.addEventListener("scroll", this.handleScroll.bind(this), {
      passive: true,
    });

    // Set initial scroll position
    /* this.updateScrollState(); */
  }

  /**
   * Handles the start of a touch event.
   * Blocks scrolling if explorability is disabled.
   */
  handleTouchStart(event) {
    if (!this.isExplorable) {
      event.preventDefault(); // Prevents user-initiated scrolling
      return;
    }
    this.lastTouchTime = Date.now();
    this.isScrolling = true;
  }

  /**
   * Handles touch movement.
   * Blocks scrolling if explorability is disabled.
   */
  handleTouchMove(event) {
    if (!this.isExplorable) {
      event.preventDefault(); // Stops unwanted movement
      return;
    }
    this.isScrolling = true;
  }

  /**
   * Handles the end of a touch event.
   * Detects quick swipes and allows inertia scrolling.
   */
  handleTouchEnd() {
    if (!this.isExplorable) return;

    setTimeout(() => {
      if (Date.now() - this.lastTouchTime < 500) {
        this.isScrolling = true; // Allows inertia scrolling
      }
    }, 50);
  }

  handleScroll() {
    // Skip processing if a programmatic scroll was just triggered
    if (
      /* this.isTransitioning ||  */ this.updateSource === "slider" ||
      this.ignoreScrollEvent
    ) {
      /* console.log("Ignoring scroll event"); */
      return;
    }
    /* console.log("handleScroll called"); */
    this.isScrolling = true;
    this.updateSource = "scroll";

    const ageScroll = Math.round(
      this.xScaleSVG.invert(this.element.scrollLeft + this.width / 2)
    );

    if (ageScroll !== this.chartElement.value.age) {
      /* console.log("set ChartElement to ageScroll", ageScroll); */
      set(this.chartElement, { ...this.chartElement.value, age: ageScroll });
    }

    // Reset scrolling state after a delay
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      /* console.log("set isScrolling to false"); */
      this.isScrolling = false;
      this.updateSource = null;
    }, 150);
  }

  /**
   * Programmatically scrolls to a specific position.
   * @param {number} scrollValue - The pixel value to scroll to.
   */
  /*  programmaticScroll(scrollValue) {
    this.element.scrollLeft = scrollValue;
  } */

  programmaticScroll(targetDomainLeft, duration) {
    if (this.isScrolling) return;
    /* console.log("programmaticScroll called"); */

    this.isTransitioning = true;
    /* console.log("set isTransitioning to true"); */
    this.updateSource = "slider";

    // Set flag to ignore subsequent scroll events
    this.ignoreScrollEvent = true;

    // Use the provided left-bound value directly:
    const targetScroll = this.xScaleSVG(targetDomainLeft);
    const element = this.element;
    /* console.log("targetDomainLeft", targetDomainLeft);
    console.log("targetScroll", targetScroll); */

    d3.transition()
      .duration(duration)
      .tween("scrollTween", function () {
        const interpolator = d3.interpolateNumber(
          element.scrollLeft,
          targetScroll
        );
        return function (t) {
          console.log("tween", interpolator(t));
          element.scrollLeft = interpolator(t);
        };
      })
      .on("end", () => {
        /* this.isTransitioning = false; */
        this.updateSource = null;
        /* console.log("set isTransitioning to false"); */
        // Clear the ignore flag after a short delay to allow the final scroll event to be suppressed
        setTimeout(() => {
          this.ignoreScrollEvent = false;
          console.log("set ignoreScrollEvent to false");
        }, 200);
      });
  }

  /**
   * Returns whether the user is actively scrolling.
   * @returns {boolean} `true` if scrolling, `false` otherwise.
   */
  getScrollState() {
    return this.isScrolling;
  }

  /**
   * Enables or disables user-initiated scrolling.
   * @param {boolean} state - `true` to enable scrolling, `false` to disable.
   */
  setExplorable(state) {
    this.isExplorable = state;
    console.log(`ScrollExplorable set to: ${state}`);
  }

  /**
   * Sets whether a domain transition is in progress.
   * Prevents unwanted updates during animations.
   * @param {boolean} isTransitioning - `true` to block updates, `false` otherwise.
   */
  /* setTransitionState(isTransitioning) {
    this.isTransitioning = isTransitioning;
    console.log(`Transition state set to: ${isTransitioning}`);
  } */

  /**
   * Checks the vertical scroll position of the page and,
   * if it falls between the lower boundary of the element with data-step="8"
   * and the upper boundary of the element with data-step="9",
   * calculates a new sleepTime value (with an offset so that the effective scroll
   * position is centered on the chart) and updates the chartElement.
   */
  handleVerticalScroll() {
    if (!this.isExplorable) {
      return;
    }
    // Select the two step elements
    const step8 = document.querySelector('[data-step="8"]');
    const step9 = document.querySelector('[data-step="9"]');
    if (!step8 || !step9) return;

    // Get the absolute positions for step8 and step9
    const step8Rect = step8.getBoundingClientRect();
    const step9Rect = step9.getBoundingClientRect();
    const lowerBoundary = step8Rect.bottom + window.scrollY;
    const upperBoundary = step9Rect.top + window.scrollY;

    // Calculate the offset based on the chart's vertical range and top margin:
    const chartRange = this.yScaleSVG.range();
    const chartHeight = Math.abs(chartRange[1] - chartRange[0]);
    const offset = chartHeight / 2 + margin.top;

    // Adjust currentScrollY so that it reflects the center of the chart.
    const currentScrollY = window.scrollY + offset;
    /* console.log(
      "Adjusted vertical scroll:",
      currentScrollY,
      " (window.scrollY + offset:",
      window.scrollY,
      "+",
      offset,
      ")"
    ); */

    // Only update if within the desired vertical range
    if (currentScrollY >= lowerBoundary && currentScrollY <= upperBoundary) {
      // Create a linear scale mapping the vertical scroll position to sleepTime
      const sleepScale = d3
        .scaleLinear()
        .domain([lowerBoundary, upperBoundary])
        .range([sleepMin, sleepMax])
        .clamp(true);
      const newSleepTimeUnrounded = sleepScale(currentScrollY);
      const newSleepTime = roundToStep(newSleepTimeUnrounded, 0.25);
      console.log("newSleepTime", newSleepTime);

      // Update chartElement.sleepTime only if it has changed
      if (this.chartElement.value.sleepTime !== newSleepTime) {
        set(this.chartElement, {
          ...this.chartElement.value,
          sleepTime: newSleepTime,
        });
      }
    }
  }

  // --- (Optional) Clean up when the component is unmounted ---
  destroy() {
    window.removeEventListener(
      "scroll",
      /* this.debouncedVerticalScroll */ this.handleVerticalScroll.bind(this)
    );
    // Remove any other event listeners if necessary.
  }
}
