import * as d3 from "npm:d3";
import { createDebouncedLogger, set } from "./helperFunctions.js";

export class ScrollInteraction {
  /**
   * Manages horizontal scrolling for the visualization.
   * @param {HTMLElement} element - The scrollable container (default: `#body`).
   * @param {Object} chartElement - Observable's reactive chart object.
   * @param {Function} xScaleSVG - D3 scale function mapping age to pixel position.
   * @param {number} width - The width of the container.
   */
  constructor(
    element = document.querySelector("#body"),
    chartElement,
    xScaleSVG,
    width
  ) {
    // Scroll container element (default: #body)
    this.element = element;

    // Reference to the Observable chart element, which holds the state
    this.chartElement = chartElement;

    // D3 scale function mapping age to horizontal pixel position
    this.xScaleSVG = xScaleSVG;

    // Width of the scrollable area
    this.width = width;

    // State tracking
    this.isScrolling = false; // Tracks whether user scrolling is happening
    this.isExplorable = false; // Controls whether the user can scroll manually
    this.ignoreScrollEvent = false; // Prevents unwanted scroll events
    /* this.isTransitioning = false; */ // Prevents updates during domain transitions
    this.lastTouchTime = 0; // Helps detect quick swipe gestures
    this.scrollTimeout = null; // Timeout for debounce-like scroll detection
    this.scrollLeft = 0; // Stores current scroll position
    this.updateSource = null; // Track the source of updates (either 'scroll' or 'slider')

    this.init(); // Attach event listeners
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

  /**
   * Handles the scroll event.
   * - Updates the scroll state and syncs it with `chartElement`.
   * - Prevents interactions during transitions.
   */
  /*   handleScroll(event) {
    if (!this.isExplorable || this.isTransitioning) {
      event.stopPropagation(); // Stops scroll event propagation
      return;
    }

    this.isScrolling = true;
    this.updateScrollState();

    // Debounce-like behavior: wait 150ms after scrolling stops
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false;
    }, 150);
  } */

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
   * Updates the current scroll position and syncs it with the `chartElement`'s age.
   */
  /*   updateScrollState() {
    this.scrollLeft = this.element.scrollLeft; // Get current scroll position

    // Convert scroll position to age using the xScale function
    const ageScroll = Math.round(
      this.xScaleSVG.invert(this.scrollLeft + this.width / 2)
    );

    // Sync age value with the visualization only if it has changed
    if (ageScroll !== this.chartElement.value.age) {
      console.log("set ChartElement to ageScroll", ageScroll);
      set(this.chartElement, { ...this.chartElement.value, age: ageScroll });
    }
  } */

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
}
