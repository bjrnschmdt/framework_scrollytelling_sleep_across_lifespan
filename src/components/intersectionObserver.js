// intersectionObserver.js

import { set } from "./helperFunctions.js";
import { settings } from "./settings.js";

const { relativeHeight } = settings;

/**
 * Sets up an Intersection Observer to observe multiple “scroll-section”
 * elements and run custom logic when they enter/exit the viewport.
 *
 * @param {object} params - Configuration object for this setup function.
 * @param {NodeListOf<Element>} params.targets - The scroll-section elements to be observed.
 * @param {Function} params.setDisabled - A function to disable/enable certain form inputs or buttons
 * @param {Generator} params.estimateInput - Reactive input that handles user estimation data.
 * @param {Promise} params.invalidation - A promise to clean up (disconnect) the observer when the notebook is invalidated.
 * @param {Function} params.setScrollyStep - Function to update the current scroll step based on visible section.

 */
export function setupIntersectionObserver({
  targets,
  setDisabled,
  estimateInput,
  invalidation,
  setScrollyStep,
}) {
  // Define the callback
  const observerCallback = (entries, observer) => {
    entries.forEach((entry) => {
      const visibleSection = entry.target;
      const step = visibleSection.dataset.step;

      if (entry.isIntersecting) {
        setScrollyStep(parseInt(step, 10));

        // Section is visible
        visibleSection.classList.remove("inactive");
      } else {
        // Section is not visible
        visibleSection.classList.add("inactive");

        if (step === "7") {
          // Reset estimate inputs when a new section becomes visible
          const target = document.getElementById("answer");
          if (target) {
            target.style.display = "none";
          }
          setDisabled(false);
          set(estimateInput, 0);
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
