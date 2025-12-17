// logger.js
import { debugLog, toCamelCase } from "./helperFunctions.js";

// Helper function to initialize the logging system
export function initializeLogger() {
  window["optimizely"] = window["optimizely"] || [];
}

// Log a generic event
export function logEvent(eventName, tags = {}) {
  try {
    debugLog("analytics", "Log event", eventName, tags);
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
    sctn: parseInt(step, 10),
  });
}

export function logInput(parameterName, value) {
  const camelCaseName = toCamelCase(parameterName);
  logEvent(`kielscn_schlafdauer_input_${parameterName}`, {
    [camelCaseName]: value,
  });
}

export function logBtnEstimate({ estimateValue, trueValue, age, sleepTime }) {
  logEvent("kielscn_schlafdauer_btn_estimate", {
    age,
    sleepTime,
    estimate: estimateValue,
    trueValue: trueValue,
  });
}

export function logBtnEstimatePercentageA({
  estimateValuePercentageA,
  trueValue,
}) {
  logEvent("kielscn_schlafdauer_btn_estimate_percentage_a", {
    estimatePercentageA: estimateValuePercentageA,
    trueValuePercentageA: trueValue,
  });
}

export function logBtnEstimatePercentageB({
  estimateValuePercentageB,
  trueValue,
}) {
  logEvent("kielscn_schlafdauer_btn_estimate_percentage_b", {
    estimatePercentageB: estimateValuePercentageB,
    trueValuePercentageB: trueValue,
  });
}

export function logBtnEstimatePercentageC({
  estimateValuePercentageC,
  trueValue,
}) {
  logEvent("kielscn_schlafdauer_btn_estimate_percentage_c", {
    estimatePercentageC: estimateValuePercentageC,
    trueValuePercentageC: trueValue,
  });
}

export function logBtnEstimatePercentageD({
  estimateValuePercentageD,
  trueValue,
}) {
  logEvent("kielscn_schlafdauer_btn_estimate_percentage_d", {
    estimatePercentageD: estimateValuePercentageD,
    trueValuePercentageD: trueValue,
  });
}

export function logBtnEstimateSleepA({ estimateValueSleepA, trueValue }) {
  logEvent("kielscn_schlafdauer_btn_estimate_sleep_a", {
    estimateSleepA: estimateValueSleepA,
    trueValueSleepA: trueValue,
  });
}

export function logBtnEstimateSleepB({ estimateValueSleepB, trueValue }) {
  logEvent("kielscn_schlafdauer_btn_estimate_sleep_b", {
    estimateSleepB: estimateValueSleepB,
    trueValueSleepB: trueValue,
  });
}

export function logBtnEstimateSleepC({ estimateValueSleepC, trueValue }) {
  logEvent("kielscn_schlafdauer_btn_estimate_sleep_c", {
    estimateSleepC: estimateValueSleepC,
    trueValueSleepC: trueValue,
  });
}

export function logBtnEstimateSleepD({ estimateValueSleepD, trueValue }) {
  logEvent("kielscn_schlafdauer_btn_estimate_sleep_d", {
    estimateSleepD: estimateValueSleepD,
    trueValueSleepD: trueValue,
  });
}

export function logBtnEstimateQuantityA({
  estimateValueQuantityA,
  trueValue,
  hopIndex,
  trueValueAtIndex,
}) {
  logEvent("kielscn_hirnentwicklung_btn_estimate_quantity_a", {
    estimateQuantityA: estimateValueQuantityA,
    trueValueQuantityA: trueValue,
    hopIndex: hopIndex,
    trueValueAtIndex: trueValueAtIndex,
  });
}

// Used in pointerInteraction.js
export function logInteraction(event) {
  logEvent("kielscn_schlafdauer_input_custom", {
    age: event.age,
    sleepTime: event.sleepTime,
  });
}
