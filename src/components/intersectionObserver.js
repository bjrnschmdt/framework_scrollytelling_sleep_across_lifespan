// intersectionObserver.js
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
 * @param {HTMLInputElement} params.estimate - An input element that might be reset (e.g., to 0).
 * @param {number} params.relativeHeight - A number used to calculate observer’s rootMargin offset.
 * @param {Promise} params.invalidation - A promise to clean up (disconnect) the observer when the notebook is invalidated.
 */
export function setupIntersectionObserver({
  targets,
  info,
  getSteps,
  set,
  chartElement,
  setDisabled,
  ageInput,
  sleepTimeInput,
  estimate,
  relativeHeight,
  invalidation,
}) {
  // Define the callback
  const observerCallback = (entries, observer) => {
    entries.forEach((entry) => {
      const visibleSection = entry.target;
      const step = visibleSection.dataset.step;

      if (entry.isIntersecting) {
        // Section is visible
        visibleSection.classList.remove("inactive");

        // Fetch the latest values (age, sleepTime) without making the cell reactive
        const currentAgeValue = ageInput.value;
        const currentSleepTimeValue = sleepTimeInput.value;

        // Build or fetch the steps object
        const steps = getSteps(currentAgeValue, currentSleepTimeValue);

        // Optional analytics/tracking
        window["optimizely"] = window["optimizely"] || [];
        window["optimizely"].push({
          type: "event",
          eventName: "kielscn_schlafdauer_sctn_visible",
          tags: {
            section: parseInt(step, 10),
            age_value: steps[step].age,
            sleepTime_value: steps[step].sleepTime,
          },
        });

        // Update the chart element’s value for the current step
        set(chartElement, steps[step]);

        // Reset certain UI elements when a new section becomes visible
        const target = document.getElementById("answer");
        if (target) {
          target.style.display = "none";
        }
        setDisabled(false);
        set(estimate, 0);

        // If it's the last section (step 8 in your example), do something special
        if (step === "8") {
          info.classList.add("interactive");
        }
      } else {
        // Section is not visible
        visibleSection.classList.add("inactive");

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
