// logger.js
import { debugLog, toCamelCase } from "./helperFunctions.js";

let loggerEnvironment = "production";

function getBrowserDiagnostics() {
  const ua = navigator.userAgent || "";
  return {
    userAgent: ua,
    isFirefox: /\b(Firefox|FxiOS)\//.test(ua),
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack:
      navigator.doNotTrack ||
      window.doNotTrack ||
      navigator.msDoNotTrack ||
      "unspecified",
  };
}

function getOptimizelyStatus() {
  const optimizely = window.optimizely;
  const hasOptimizelyObject = Boolean(optimizely);
  const isInitialized =
    optimizely?.initialized === true ||
    (Object.prototype.hasOwnProperty.call(optimizely || {}, "initialized") &&
      optimizely.initialized !== false);
  const accountId = optimizely?.get?.("data")?.accountId || null;
  const hasApi = typeof optimizely?.push === "function";

  return {
    hasOptimizelyObject,
    isInitialized,
    accountId,
    hasApi,
    isReady: Boolean(isInitialized && accountId && hasApi),
  };
}

// Helper function to initialize the logging system
export function initializeLogger(_redirectUrl, environment = "production") {
  loggerEnvironment = environment;

  if (environment === "development") {
    window.optimizely = [];
    console.log(
      "[logger] Development mode active. Skipping production checks.",
    );
  }

  return false;
}

export function checkLoggerReadiness() {
  const diagnostics = getBrowserDiagnostics();
  const optimizely = getOptimizelyStatus();
  const browserAllowed = !diagnostics.isFirefox;
  const isReady =
    loggerEnvironment === "development" || (browserAllowed && optimizely.isReady);

  return {
    isReady,
    browserAllowed,
    diagnostics,
    optimizely,
  };
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
