// logger.js

// Helper function to initialize the logging system
export function initializeLogger() {
  window["optimizely"] = window["optimizely"] || [];
}

// Log a generic event
export function logEvent(eventName, tags = {}) {
  try {
    console.log("Log event", eventName, tags);
    window["optimizely"] = window["optimizely"] || [];
    window["optimizely"].push({
      type: "event",
      eventName,
      tags,
    });
  } catch (error) {
    console.error("Logging failed", error);
  }
}

// Specific loggers for known events
export function logSectionVisible(step) {
  logEvent("kielscn_schlafdauer_sctn_visible", {
    section: parseInt(step, 10),
  });
}

export function logInput(parameterName, value) {
  logEvent(`kielscn_schlafdauer_input_${parameterName}`, {
    [parameterName]: value,
  });
}

export function logBtnEstimate({ estimateValue, trueValue, age, sleepTime }) {
  logEvent("kielscn_schlafdauer_btn_estimate", {
    age_value: age,
    sleepTime_value: sleepTime,
    estimate_value: estimateValue,
    true_value: trueValue,
  });
}

// Used in pointerInteraction.js
export function logInteraction(event) {
  logEvent("kielscn_schlafdauer_input_custom", {
    age_value: event.age,
    sleepTime_value: event.sleepTime,
  });
}
