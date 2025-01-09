// logger.js

// Helper function to initialize the logging system
export function initializeLogger() {
  window["optimizely"] = window["optimizely"] || [];
}

// Log a generic event
export function logEvent(eventName, tags = {}) {
  console.log("Log event", eventName, tags);
  window["optimizely"].push({
    type: "event",
    eventName,
    tags,
  });
}

// Specific loggers for known events
export function logSectionVisible(step, age, sleepTime) {
  logEvent("kielscn_schlafdauer_sctn_visible", {
    section: parseInt(step, 10),
    age_value: age,
    sleepTime_value: sleepTime,
  });
}

export function logEstimateClick(estimateValue, trueValue) {
  logEvent("kielscn_schlafdauer_estimate_on_click", {
    estimate_value: estimateValue,
    true_value: trueValue,
  });
}

export function logEstimateSctnChange(estimateValue, trueValue) {
  logEvent("kielscn_schlafdauer_estimate_on_sctn_change", {
    estimate_value: estimateValue,
    true_value: trueValue,
  });
}

// Used in pointerInteraction.js
export function logInteraction(age, sleepTime) {
  logEvent("kielscn_schlafdauer_exploration_changed", {
    age_value: age,
    sleepTime_value: sleepTime,
  });
}
