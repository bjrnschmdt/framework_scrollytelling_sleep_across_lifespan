// intersectionObserver.js

import { set } from "./helperFunctions.js";
import { settings } from "./settings.js";
import { logSectionVisible, logEstimateSctnChange } from "./logger.js";
import { getTrueValue } from "./helperFunctions.js";

const { relativeHeight } = settings;

/**
 * Sets up an Intersection Observer to observe multiple “scroll-section”
 * elements and run custom logic when they enter/exit the viewport.
 *
 * @param {object} params - Configuration object for this setup function.
 * @param {NodeListOf<Element>} params.targets - The scroll-section elements to be observed.
 * @param {HTMLElement} params.info - The element that might toggle interactive states (e.g., .scroll-info).
 * @param {Function} params.getSteps - A function returning the steps object (e.g., getSteps(age, sleepTime)).
 * @param {Function} params.set - A function used to update the chart’s value (e.g., set(chartElement, steps[step])).
 * @param {HTMLElement} params.chartElement - The main element whose .value is updated (the container or chart node).
 * @param {Function} params.setDisabled - A function to disable/enable certain form inputs or buttons.
 * @param {HTMLInputElement} params.ageInput - The input holding the current age value.
 * @param {HTMLInputElement} params.sleepTimeInput - The input holding the current sleepTime value.
 * @param {HTMLInputElement} params.estimateInput - An input element that might be reset (e.g., to 0).
 * @param {number} params.relativeHeight - A number used to calculate observer’s rootMargin offset.
 * @param {Promise} params.invalidation - A promise to clean up (disconnect) the observer when the notebook is invalidated.
 */
export function setupIntersectionObserver({
  dataSet,
  targets,
  info,
  getSteps,
  chartElement,
  setDisabled,
  ageInput,
  sleepTimeInput,
  estimateInput,
  invalidation,
}) {
  // Define the callback
  const observerCallback = (entries, observer) => {
    entries.forEach((entry) => {
      const visibleSection = entry.target;
      const step = visibleSection.dataset.step;

      // Fetch the latest values (age, sleepTime) without making the cell reactive
      const currentAgeValue = ageInput.value;
      const currentSleepTimeValue = sleepTimeInput.value;

      // Build or fetch the steps object
      const steps = getSteps(currentAgeValue, currentSleepTimeValue);

      if (entry.isIntersecting) {
        // Section is visible
        visibleSection.classList.remove("inactive");

        // Optional analytics/tracking
        logSectionVisible(
          parseInt(step, 10),
          steps[step].age,
          steps[step].sleepTime
        );

        // Update the chart element’s value for the current step
        set(chartElement, steps[step]);

        // If it's the last section (step 8 in your example), do something special
        if (step === "8") {
          info.classList.add("interactive");
        }
      } else {
        // Section is not visible
        visibleSection.classList.add("inactive");

        // Only log the estimate if this is the special section at step 7
        if (step === "7") {
          const currentEstimateValue = estimateInput.value;
          logEstimateSctnChange({
            section: 7,
            age_value: steps[step].age,
            sleepTime_value: steps[step].sleepTime,
            estimate_value: currentEstimateValue,
            true_value: Math.round(
              getTrueValue(dataSet, chartElement.value) * 100
            ),
          });

          // Reset estimate inputs when a new section becomes visible
          const target = document.getElementById("answer");
          if (target) {
            target.style.display = "none";
          }
          setDisabled(false);
          set(estimateInput, 0);
        }

        // Remove interaction if the last section is no longer visible
        if (step === "8") {
          info.classList.remove("interactive");
        }
      }
    });
  };

  // Configure the observer
  const observerOptions = {
    root: null, // Uses the viewport as the root
    rootMargin: `0% 0% -${100 - relativeHeight * 100}% 0%`,
    // threshold: 0.5, // Uncomment if you want a specific threshold
  };

  const observer = new IntersectionObserver(observerCallback, observerOptions);

  // Observe all targets
  targets.forEach((target) => {
    observer.observe(target);
  });

  // Disconnect the observer when the cell is invalidated (Observable-specific)
  if (invalidation && typeof invalidation.then === "function") {
    invalidation.then(() => observer.disconnect());
  }
}

export function getSteps(age, sleepTime, variant) {
  return {
    0: {
      age: undefined,
      sleepTime: undefined,
      showRecommended: false,
      showPointcloud: false,
      showPercentiles: [],
      tooltipText: undefined,
      isExplorable: false,
      variant: "none",
    },
    1: {
      age: undefined,
      sleepTime: undefined,
      showRecommended: false,
      showPointcloud: false,
      showPercentiles: [],
      tooltipText: undefined,
      isExplorable: false,
      variant: "none",
    },
    2: {
      age: undefined,
      sleepTime: undefined,
      showRecommended: false,
      showPointcloud: true,
      showPercentiles: [],

      tooltipText: undefined,
      isExplorable: false,
      variant: "none",
    },
    3: {
      age: undefined,
      sleepTime: undefined,
      showRecommended: false,
      showPointcloud: true,
      showPercentiles: ["C"],
      tooltipText: undefined,
      isExplorable: false,
      variant: "none",
    },
    4: {
      age: 31,
      sleepTime: 7,
      showRecommended: false,
      showPointcloud: true,
      showPercentiles: ["C"],
      tooltipText: "Karin",
      isExplorable: false,
      variant: "none",
    },
    5: {
      age: age,
      sleepTime: sleepTime,
      showRecommended: false,
      showPointcloud: true,
      showPercentiles: ["C"],
      tooltipText: "Du",
      isExplorable: false,
      variant: "none",
    },
    6: {
      age: age,
      sleepTime: sleepTime,
      showRecommended: false,
      showPointcloud: true,
      showPercentiles: ["C"],
      tooltipText: undefined,
      isExplorable: false,
      variant: variant,
    },
    7: {
      age: age,
      sleepTime: sleepTime,
      showRecommended: false,
      showPointcloud: true,
      showPercentiles: ["C"],
      tooltipText: undefined,
      isExplorable: false,
      variant: variant,
    },
    8: {
      age: age,
      sleepTime: sleepTime,
      showRecommended: false,
      showPointcloud: true,
      showPercentiles: ["C"],
      tooltipText: undefined,
      isExplorable: true,
      variant: variant,
    },
  };
}
