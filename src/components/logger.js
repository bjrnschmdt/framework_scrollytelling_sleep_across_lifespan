// logger.js

// Helper function to initialize the logging system
export function initializeLogger() {
  window["optimizely"] = window["optimizely"] || [];
}

// Log a generic event
export function logEvent(eventName, tags = {}) {
  console.log("Log event", eventName, tags);
  /* console.log("Optimizely", window["optimizely"]); */
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

export function logEstimateClick({
  estimateValue,
  trueValue,
  section,
  age,
  sleepTime,
}) {
  logEvent("kielscn_schlafdauer_estimate_on_click", {
    section,
    age_value: age,
    sleepTime_value: sleepTime,
    estimate_value: estimateValue,
    true_value: trueValue,
  });
}

export function logEstimateSctnChange({
  estimate_value,
  true_value,
  section,
  age_value,
  sleepTime_value,
}) {
  logEvent("kielscn_schlafdauer_estimate_on_sctn_change", {
    section,
    age_value,
    sleepTime_value,
    estimate_value,
    true_value,
  });
}

// Used in pointerInteraction.js
export function logInteraction(event) {
  logEvent("kielscn_schlafdauer_exploration_changed", {
    age_value: event.age,
    sleepTime_value: event.sleepTime,
  });
}
