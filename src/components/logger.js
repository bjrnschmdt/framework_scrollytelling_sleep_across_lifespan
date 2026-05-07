// logger.js
import { debugLog, toCamelCase } from "./helperFunctions.js";

// Helper function to initialize the logging system
export function initializeLogger(redirectUrl, environment = "production") {
  if (environment === "development") {
    window.optimizely = [];
    console.log(
      "[logger] Development mode active. Skipping production checks.",
    );
    return false;
  }

  window.setTimeout(() => {
    const optimizely = window.optimizely;
    const isInitialized = Object.keys(optimizely || {}).includes("initialized");
    const accountId = optimizely?.get?.("data")?.accountId || null;

    if (!isInitialized || !accountId) {
      console.log("[logger] Optimizely check failed", {
        isInitialized,
        accountId,
      });
      window.location.replace(redirectUrl);
    }
  }, 5000);

  return false;
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

// Used in pointerInteraction.js
export function logInteraction(event) {
  logEvent("kielscn_schlafdauer_input_custom", {
    age: event.age,
    sleepTime: event.sleepTime,
  });
}
