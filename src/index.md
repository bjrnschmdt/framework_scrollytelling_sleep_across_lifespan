---
theme: [midnight, alt, wide]
toc: false
style: custom-style.css
---

```js
import {
  set,
  getTrueValue,
  getURLParameter,
  createDebouncedLogger,
  formatTime,
  updateXDomain,
  programmaticScroll,
  debugLog,
  cumulativeSuccessAtIndex,
} from "./components/helperFunctions.js";
import isMobile from "./components/isMobile.js";
import { dataSet, simulatedData } from "./components/data.js";
import {
  generateDistributions,
  calculateAbsoluteSuccessRates,
} from "./components/generateGroupComparisons.js";
import { settings } from "./components/settings.js";
import { createScales } from "./components/createScales.js";
import {
  initializeCrosshair,
  updateCrosshairs,
} from "./components/crosshair.js";
import { PointerInteraction } from "./components/pointerInteraction.js";
import { ScrollInteraction } from "./components/scrollInteraction.js";
import { createAxes } from "./components/createAxes.js";
import { Pointcloud } from "./components/pointcloud.js";
import {
  initializeScatterPlot,
  updateScatterPlot,
  setScatterVisibility,
} from "./components/scatterPlot.js";
import {
  drawPercentiles,
  drawGroupedPercentileLines,
  updatePercentileLineScalesWithTicks,
} from "./components/percentileLines.js";
import { drawRecommendedArea } from "./components/recommendedArea.js";
import { updatePlot, exitPlot } from "./components/plot.js";
import { updateDotPlot } from "./components/plotDot.js";
import { updatePercentilePlot } from "./components/plotPercentile.js";
import { updateBoxPlot } from "./components/plotBox.js";
import { updateHOPPlot } from "./components/plotHOP.js";
import { setupIntersectionObserver } from "./components/intersectionObserver.js";
import {
  initializeLogger,
  logEvent,
  logSectionVisible,
  logInput,
  logBtnEstimate,
  logBtnEstimatePercentageA,
  logBtnEstimatePercentageB,
  logBtnEstimatePercentageC,
  logBtnEstimateSleepA,
  logBtnEstimateSleepB,
  logBtnEstimateSleepC,
  logBtnEstimateQuantity,
} from "./components/logger.js";
import {
  dotPlot,
  hopPlot,
  hopTracedPlot,
  percentilePlot,
  boxPlot,
} from "./components/plotComparison.js";
```

<!-- ```js
const simulatedData = FileAttachment("./data/simulatedData.json").json();
``` -->

<!-- ```js
const dataArray = FileAttachment("./data/dataSet.json").json();
``` -->

<!-- ```js
const robotoRegular = FileAttachment("./data/Roboto-Regular.ttf").href;
const robotoCondensedBold = FileAttachment(
  "./data/RobotoCondensed-Bold.ttf"
).href;
``` -->

<!-- ```js
const dataSet = new Map(dataArray);
``` -->

```js
const {
  ageMin,
  ageMax,
  sleepMin,
  sleepMax,
  margin,
  canvasScaleFactor,
  relativeHeight,
  hopCount,
  hopDuration,
  estimateSleepAge,
  qstepComp,
  qheightComp,
} = settings;
```

<!-- Setup -->

```js
const w = width;
```

```js
// mobile breakpoint
const isEnhanced = !(isMobile.any() || width <= 800);
```

```js
const scrollInfo = d3.select(".scroll-info"); // Adjust selector as needed
const outro = d3.select(".outro"); // Adjust selector as needed
```

```js
const initialVH = window.innerHeight; // Store initial height
```

```js
const currentVH = height;

// Calculate the necessary margin shift (negative to compensate for increased height)
const marginCompensation = initialVH - currentVH;
scrollInfo.style("margin-bottom", `${marginCompensation}px`);
outro.style("margin-top", `${marginCompensation * -1}px`);
```

<!-- ```js
const height = Generators.observe((change) => {
  // Define a function to notify the new height.
  const notify = () => change(window.innerHeight);

  // Set up the resize event listener.
  window.addEventListener("resize", notify);

  // Immediately notify the current height.
  notify();

  // Return a cleanup function that removes the event listener.
  return () => window.removeEventListener("resize", notify);
});
``` -->

```js
const height = Generators.observe((change) => {
  let timeout;

  // Define a function to notify the new height with debounce.
  const notify = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => change(window.innerHeight), 400); // Adjust debounce delay as needed
  };

  // Set up the resize event listener.
  window.addEventListener("resize", notify);

  // Immediately notify the current height.
  notify();

  // Return a cleanup function that removes the event listener.
  return () => {
    clearTimeout(timeout);
    window.removeEventListener("resize", notify);
  };
});
```

```js
const variant = getURLParameter("v") || "dot";
```

```js
logEvent("kielscn_schlafdauer_type", { type: variant });
```

```js
const def = {
  age: 89,
  sleepTime: 6.5,
  showRecommended: false,
  showPointcloud: true,
  showPercentiles: ["B", "C"],
  tooltipText: "Sie",
  isExplorable: false,
  variant: "none",
};
```

<!-- Analytics -->

```js
initializeLogger();
```

```js
logSectionVisible(scrollyStep);
```

```js
const debouncedLoggers = {
  age: createDebouncedLogger((value) => logInput("age", value), 500),
  sleepTime: createDebouncedLogger(
    (value) => logInput("sleeptime", value),
    500
  ),
  estimate: createDebouncedLogger((value) => logInput("estimate", value), 500),
  estimatePercentageA: createDebouncedLogger(
    (value) => logInput("estimate_percentage_a", value),
    500
  ),
  estimatePercentageB: createDebouncedLogger(
    (value) => logInput("estimate_percentage_b", value),
    500
  ),
  estimatePercentageC: createDebouncedLogger(
    (value) => logInput("estimate_percentage_c", value),
    500
  ),
  estimateSleepA: createDebouncedLogger(
    (value) => logInput("estimate_sleep_a", value),
    500
  ),
  estimateSleepB: createDebouncedLogger(
    (value) => logInput("estimate_sleep_b", value),
    500
  ),
  estimateSleepC: createDebouncedLogger(
    (value) => logInput("estimate_sleep_c", value),
    500
  ),
};
```

```js
debouncedLoggers.age(ageValue);
```

```js
debouncedLoggers.sleepTime(sleepTimeValue);
```

```js
debouncedLoggers.estimate(estimateValue);
```

```js
logInput("education", educationValue);
```

<!-- Scrollytelling -->

```js
// A helper that does a shallow diff (or deep diff if needed)
function diffStepProps(newProps, oldProps) {
  const diff = {};

  function arraysEqual(a, b) {
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((val, index) => val === b[index])
    );
  }

  for (const key in newProps) {
    if (Array.isArray(newProps[key]) && Array.isArray(oldProps[key])) {
      if (!arraysEqual(newProps[key], oldProps[key])) {
        diff[key] = { old: oldProps[key], new: newProps[key] };
      }
    } else if (newProps[key] !== oldProps[key]) {
      diff[key] = { old: oldProps[key], new: newProps[key] };
    }
  }
  return diff;
}
```

```js
const scrollyStep = Mutable(0);
const setScrollyStep = (x) => (scrollyStep.value = x);
```

```js
const stepProps = scrollyProps[scrollyStep];
```

```js
debugLog("update", "stepProps", stepProps);
```

```js
const baseStep = {
  age: undefined,
  sleepTime: undefined,
  showRecommended: false,
  showPointcloud: false,
  showPercentiles: [],
  tooltipText: undefined,
  isExplorable: false,
  variant: "none",
  xDomain: [5, 95],
  xDomainMobile: [5, 95],
  yDomain: [4, 13],
  ticks: d3.ticks(5, 95, 9), // 18/5, 45/2, 90/1
  xResolution: isEnhanced ? d3.ticks(5, 95, 90) : d3.ticks(5, 95, 30),
  triggerSource: null,
  height: initialHeight,
};
```

```js
const scrollyProps = {
  undefined: { ...baseStep, scrollStep: undefined, height: height },
  0: {
    ...baseStep,
    scrollStep: 0,
    height: height,
  },
  1: {
    ...baseStep,
    scrollStep: 1,
    height: height,
  },
  2: {
    ...baseStep,
    scrollStep: 2,
    height: height,
    showPointcloud: true,
  },
  3: {
    ...baseStep,
    scrollStep: 3,
    height: height,
    showPercentiles: ["C"],
  },
  4: {
    ...baseStep,
    scrollStep: 4,
    height: height,
    age: 31,
    sleepTime: 7,
    showPercentiles: ["C"],
    tooltipText: "Karin",
    xDomain: isEnhanced ? [5, 95] : [25.5, 36.5],
    xResolution: d3.ticks(5, 95, 90),
    ticks: isEnhanced ? d3.ticks(5, 95, 9) : d3.ticks(5, 95, 45),
  },
  5: {
    ...baseStep,
    scrollStep: 5,
    height: height,
    age: ageValue,
    sleepTime: sleepTimeValue,
    showPercentiles: ["C"],
    tooltipText: "Sie",
    xDomain: isEnhanced ? baseStep.xDomain : [ageValue - 5.5, ageValue + 5.5],
    xResolution: d3.ticks(5, 95, 90),
    ticks: isEnhanced ? d3.ticks(5, 95, 9) : d3.ticks(5, 95, 45),
    triggerSource: "slider",
  },
  6: {
    ...baseStep,
    scrollStep: 6,
    height: height,
    age: ageValue,
    sleepTime: sleepTimeValue,
    variant,
    xDomain: isEnhanced ? baseStep.xDomain : [ageValue - 5.5, ageValue + 5.5],
    xResolution: d3.ticks(5, 95, 90),
    ticks: isEnhanced ? d3.ticks(5, 95, 9) : d3.ticks(5, 95, 45),
  },
  7: {
    ...baseStep,
    scrollStep: 7,
    height: height,
    age: ageValue,
    sleepTime: sleepTimeValue,
    variant,
    xDomain: isEnhanced ? baseStep.xDomain : [ageValue - 5.5, ageValue + 5.5],
    xResolution: d3.ticks(5, 95, 90),
    ticks: isEnhanced ? d3.ticks(5, 95, 9) : d3.ticks(5, 95, 45),
  },
  8: {
    ...baseStep,
    scrollStep: 8,
    height: height,
    age: 20,
    sleepTime: 6.5,
    variant,
    xDomain: isEnhanced ? baseStep.xDomain : [20 - 5.5, 20 + 5.5],
    xResolution: d3.ticks(5, 95, 90),
    ticks: isEnhanced ? d3.ticks(5, 95, 9) : d3.ticks(5, 95, 45),
  },
  9: {
    ...baseStep,
    scrollStep: 9,
    height: height,
    age: 30,
    sleepTime: 6,
    variant,
    xDomain: isEnhanced ? baseStep.xDomain : [30 - 5.5, 30 + 5.5],
    xResolution: d3.ticks(5, 95, 90),
    ticks: isEnhanced ? d3.ticks(5, 95, 9) : d3.ticks(5, 95, 45),
  },
  10: {
    ...baseStep,
    scrollStep: 10,
    height: height,
    age: 40,
    sleepTime: 5.5,
    variant,
    xDomain: isEnhanced ? baseStep.xDomain : [40 - 5.5, 40 + 5.5],
    xResolution: d3.ticks(5, 95, 90),
    ticks: isEnhanced ? d3.ticks(5, 95, 9) : d3.ticks(5, 95, 45),
  },
  11: {
    ...baseStep,
    scrollStep: 11,
    height: height,
    age: estimateSleepAge.A.age,
    sleepTime: estimateValueSleepA,
    variant,
    xDomain: isEnhanced
      ? baseStep.xDomain
      : [estimateSleepAge.A.age - 5.5, estimateSleepAge.A.age + 5.5],
    xResolution: d3.ticks(5, 95, 90),
    ticks: isEnhanced ? d3.ticks(5, 95, 9) : d3.ticks(5, 95, 45),
  },
  12: {
    ...baseStep,
    scrollStep: 12,
    height: height,
    age: estimateSleepAge.B.age,
    sleepTime: estimateValueSleepB,
    variant,
    xDomain: isEnhanced
      ? baseStep.xDomain
      : [estimateSleepAge.B.age - 5.5, estimateSleepAge.B.age + 5.5],
    xResolution: d3.ticks(5, 95, 90),
    ticks: isEnhanced ? d3.ticks(5, 95, 9) : d3.ticks(5, 95, 45),
  },
  13: {
    ...baseStep,
    scrollStep: 13,
    height: height,
    age: estimateSleepAge.C.age,
    sleepTime: estimateValueSleepC,
    variant,
    xDomain: isEnhanced
      ? baseStep.xDomain
      : [estimateSleepAge.C.age - 5.5, estimateSleepAge.C.age + 5.5],
    xResolution: d3.ticks(5, 95, 90),
    ticks: isEnhanced ? d3.ticks(5, 95, 9) : d3.ticks(5, 95, 45),
  },
  14: {
    ...baseStep,
    scrollStep: 14,
    height: height,
    comparison: true,
  },
};
```

```js
const personalizationValue =
  ageValue === def.age && sleepTimeValue === def.sleepTime;
```

```js
const isDisabled = Mutable(false);
const setDisabled = (x) => (isDisabled.value = x);
```

```js
const ageInput = Inputs.range([ageMin, ageMax - 1], {
  step: 1,
  label: "Alter",
  value: def.age,
});
const ageValue = Generators.input(ageInput);
```

```js
debugLog("inputs", "ageValue", ageValue);
```

```js
const sleepTimeInput = Inputs.range([sleepMin, sleepMax], {
  step: 0.25,
  label: "Schlafdauer",
  value: def.sleepTime,
  /* format: (x) => formatTime(x), */
});
const sleepTimeValue = Generators.input(sleepTimeInput);
```

```js
const estimateInput = Inputs.range([0, 100], {
  label: "Schätzung in %",
  step: 1,
  value: 0,
  placeholder: "in %",
});
const estimateValue = Generators.input(estimateInput);
```

```js
// This code is always reset/triggered when isDisabled changes. So we unfortunately cannot estimate how often a user clicks this button
const answerInput = Inputs.button("Antwort absenden", {
  value: null,
  reduce: (value) => btnEstimate(value),
  disabled: isDisabled,
});
const answerValue = Generators.input(answerInput);
```

```js
const educationInput = Inputs.select(
  new Map([
    ["Kein Schulabschluss", 0],
    ["Hauptschulabschluss", 1],
    ["Realschulabschluss", 2],
    ["Abitur", 3],
    ["Bachelor/Diplom (FH)", 4],
    ["Master/Magister/Diplom (Univ.)", 5],
    ["Promotion", 6],
  ]),
  {
    label: "Höchster Bildungsabschluss",
    value: 2,
  }
);
const educationValue = Generators.input(educationInput);
```

<!-- ********************************************************* -->
<!-- ********************************************************* -->
<!-- ********************************************************* -->

```js
debouncedLoggers.estimatePercentageA(estimateValuePercentageA);
```

```js
debouncedLoggers.estimatePercentageB(estimateValuePercentageB);
```

```js
debouncedLoggers.estimatePercentageC(estimateValuePercentageC);
```

```js
const estimateInputPercentageA = Inputs.range([0, 100], {
  label: "Schätzung in %",
  step: 1,
  value: 0,
  placeholder: "in %",
});
const estimateValuePercentageA = Generators.input(estimateInputPercentageA);
```

```js
const estimateInputPercentageB = Inputs.range([0, 100], {
  label: "Schätzung in %",
  step: 1,
  value: 0,
  placeholder: "in %",
});
const estimateValuePercentageB = Generators.input(estimateInputPercentageB);
```

```js
const estimateInputPercentageC = Inputs.range([0, 100], {
  label: "Schätzung in %",
  step: 1,
  value: 0,
  placeholder: "in %",
});
const estimateValuePercentageC = Generators.input(estimateInputPercentageC);
```

```js
const certaintyPercentageA = createSemanticDifferentialInput(
  "Wie sicher sind Sie sich mit Ihrer Antwort?",
  "gar nicht sicher",
  "sehr sicher",
  "certainty_percentage_a"
);
```

```js
const certaintyPercentageB = createSemanticDifferentialInput(
  "Wie sicher sind Sie sich mit Ihrer Antwort?",
  "gar nicht sicher",
  "sehr sicher",
  "certainty_percentage_b"
);
```

```js
const certaintyPercentageC = createSemanticDifferentialInput(
  "Wie sicher sind Sie sich mit Ihrer Antwort?",
  "gar nicht sicher",
  "sehr sicher",
  "certainty_percentage_c"
);
```

```js
// This code is always reset/triggered when isDisabled changes. So we unfortunately cannot estimate how often a user clicks this button
const answerPercentageInputA = Inputs.button("Antwort absenden", {
  value: null,
  reduce: (value) => btnEstimatePercentageA(value),
  disabled: isDisabledPercentageA,
});
const answerPercentileValueA = Generators.input(answerPercentageInputA);
```

```js
// This code is always reset/triggered when isDisabled changes. So we unfortunately cannot estimate how often a user clicks this button
const answerPercentageInputB = Inputs.button("Antwort absenden", {
  value: null,
  reduce: (value) => btnEstimatePercentageB(value),
  disabled: isDisabledPercentageB,
});
const answerPercentileValueB = Generators.input(answerPercentageInputB);
```

```js
// This code is always reset/triggered when isDisabled changes. So we unfortunately cannot estimate how often a user clicks this button
const answerPercentageInputC = Inputs.button("Antwort absenden", {
  value: null,
  reduce: (value) => btnEstimatePercentageC(value),
  disabled: isDisabledPercentageC,
});
const answerPercentileValueC = Generators.input(answerPercentageInputC);
```

```js
const isDisabledPercentageA = Mutable(false);
const setDisabledPercentageA = (x) => (isDisabledPercentageA.value = x);
```

```js
const isDisabledPercentageB = Mutable(false);
const setDisabledPercentageB = (x) => (isDisabledPercentageB.value = x);
```

```js
const isDisabledPercentageC = Mutable(false);
const setDisabledPercentageC = (x) => (isDisabledPercentageC.value = x);
```

```js
const btnEstimatePercentageA = (value) => {
  setDisabledPercentageA(true); // not needed anymore because button stays disabled after first click
  for (const input of estimateInputPercentageA.querySelectorAll("input")) {
    input.disabled = true;
  }
  for (const input of certaintyPercentageA.querySelectorAll("input")) {
    input.disabled = true;
  }
  logBtnEstimatePercentageA({
    estimateValuePercentageA,
    trueValue: Math.round(getTrueValue(dataSet, stepProps) * 100),
  });
  return value + 1;
};
```

```js
const btnEstimatePercentageB = (value) => {
  setDisabledPercentageB(true); // not needed anymore because button stays disabled after first click
  for (const input of estimateInputPercentageB.querySelectorAll("input")) {
    input.disabled = true;
  }
  for (const input of certaintyPercentageB.querySelectorAll("input")) {
    input.disabled = true;
  }
  logBtnEstimatePercentageB({
    estimateValuePercentageB,
    trueValue: Math.round(getTrueValue(dataSet, stepProps) * 100),
  });
  return value + 1;
};
```

```js
const btnEstimatePercentageC = (value) => {
  setDisabledPercentageC(true); // not needed anymore because button stays disabled after first click
  for (const input of estimateInputPercentageC.querySelectorAll("input")) {
    input.disabled = true;
  }
  for (const input of certaintyPercentageC.querySelectorAll("input")) {
    input.disabled = true;
  }
  logBtnEstimatePercentageC({
    estimateValuePercentageC,
    trueValue: Math.round(getTrueValue(dataSet, stepProps) * 100),
  });
  return value + 1;
};
```

<!-- ********************************************************* -->

```js
debouncedLoggers.estimateSleepA(estimateValueSleepA);
```

```js
debouncedLoggers.estimateSleepB(estimateValueSleepB);
```

```js
debouncedLoggers.estimateSleepC(estimateValueSleepC);
```

```js
const estimateInputSleepA = Inputs.range([sleepMin, sleepMax], {
  step: 0.25,
  label: "Schlafdauer in Stunden",
  value: dataSet.get(estimateSleepAge.A.age).box[0].quartiles[1],
});
const estimateValueSleepA = Generators.input(estimateInputSleepA);
```

```js
const estimateInputSleepB = Inputs.range([sleepMin, sleepMax], {
  step: 0.25,
  label: "Schlafdauer in Stunden",
  value: dataSet.get(estimateSleepAge.B.age).box[0].quartiles[1],
});
const estimateValueSleepB = Generators.input(estimateInputSleepB);
```

```js
const estimateInputSleepC = Inputs.range([sleepMin, sleepMax], {
  step: 0.25,
  label: "Schlafdauer in Stunden",
  value: dataSet.get(estimateSleepAge.C.age).box[0].quartiles[1],
});
const estimateValueSleepC = Generators.input(estimateInputSleepC);
```

```js
const certaintySleepA = createSemanticDifferentialInput(
  "Wie sicher sind Sie sich mit Ihrer Antwort?",
  "gar nicht sicher",
  "sehr sicher",
  "certainty_sleep_a"
);
```

```js
const certaintySleepB = createSemanticDifferentialInput(
  "Wie sicher sind Sie sich mit Ihrer Antwort?",
  "gar nicht sicher",
  "sehr sicher",
  "certainty_sleep_b"
);
```

```js
const certaintySleepC = createSemanticDifferentialInput(
  "Wie sicher sind Sie sich mit Ihrer Antwort?",
  "gar nicht sicher",
  "sehr sicher",
  "certainty_sleep_c"
);
```

```js
// This code is always reset/triggered when isDisabled changes. So we unfortunately cannot estimate how often a user clicks this button
const answerSleepInputA = Inputs.button("Antwort absenden", {
  value: null,
  reduce: (value) => btnEstimateSleepA(value),
  disabled: isDisabledSleepA,
});
const answerSleepValueA = Generators.input(answerSleepInputA);
```

```js
// This code is always reset/triggered when isDisabled changes. So we unfortunately cannot estimate how often a user clicks this button
const answerSleepInputB = Inputs.button("Antwort absenden", {
  value: null,
  reduce: (value) => btnEstimateSleepB(value),
  disabled: isDisabledSleepB,
});
const answerSleepValueB = Generators.input(answerSleepInputB);
```

```js
// This code is always reset/triggered when isDisabled changes. So we unfortunately cannot estimate how often a user clicks this button
const answerSleepInputC = Inputs.button("Antwort absenden", {
  value: null,
  reduce: (value) => btnEstimateSleepC(value),
  disabled: isDisabledSleepC,
});
const answerSleepValueC = Generators.input(answerSleepInputC);
```

```js
const isDisabledSleepA = Mutable(false);
const setDisabledSleepA = (x) => (isDisabledSleepA.value = x);
```

```js
const isDisabledSleepB = Mutable(false);
const setDisabledSleepB = (x) => (isDisabledSleepB.value = x);
```

```js
const isDisabledSleepC = Mutable(false);
const setDisabledSleepC = (x) => (isDisabledSleepC.value = x);
```

```js
const btnEstimateSleepA = (value) => {
  setDisabledSleepA(true); // not needed anymore because button stays disabled after first click
  for (const input of estimateInputSleepA.querySelectorAll("input")) {
    input.disabled = true;
  }
  for (const input of certaintySleepA.querySelectorAll("input")) {
    input.disabled = true;
  }
  logBtnEstimateSleepA({
    estimateValueSleepA,
    trueValue: estimateSleepAge.A.sleepTime,
  });
  return value + 1;
};
```

```js
const btnEstimateSleepB = (value) => {
  setDisabledSleepB(true); // not needed anymore because button stays disabled after first click
  for (const input of estimateInputSleepB.querySelectorAll("input")) {
    input.disabled = true;
  }
  for (const input of certaintySleepB.querySelectorAll("input")) {
    input.disabled = true;
  }
  logBtnEstimateSleepB({
    estimateValueSleepB,
    trueValue: estimateSleepAge.B.sleepTime,
  });
  return value + 1;
};
```

```js
const btnEstimateSleepC = (value) => {
  setDisabledSleepC(true); // not needed anymore because button stays disabled after first click
  for (const input of estimateInputSleepC.querySelectorAll("input")) {
    input.disabled = true;
  }
  for (const input of certaintySleepC.querySelectorAll("input")) {
    input.disabled = true;
  }
  logBtnEstimateSleepC({
    estimateValueSleepC,
    trueValue: estimateSleepAge.C.sleepTime,
  });
  return value + 1;
};
```

<!-- ********************************************************* -->
<!-- ********************************************************* -->

<!-- ```js
const { aWins, bWins, totalComparisons, aSuccess, bSuccess } =
  calculateAbsoluteSuccessRates(plotData.comparisonA.hop);
console.log("Absolute Success Rates:", {
  aWins,
  bWins,
  totalComparisons,
  aSuccess,
  bSuccess,
});
``` -->

```js
const isDisabledQuantity = Mutable(false);
const setDisabledQuantity = (x) => (isDisabledQuantity.value = x);
```

```js
const estimateInputQuantity = Inputs.range([0, 100], {
  label: "In wievielen von 100 Fällen?",
  step: 1,
  value: 0,
  placeholder: "in %",
});
const estimateValueQuantity = Generators.input(estimateInputQuantity);
```

```js
const certaintyQuantity = createSemanticDifferentialInput(
  "Wie sicher sind Sie sich mit Ihrer Antwort?",
  "gar nicht sicher",
  "sehr sicher",
  "certainty_quantity"
);
```

```js
// This code is always reset/triggered when isDisabled changes. So we unfortunately cannot estimate how often a user clicks this button
const answerQuantityInput = Inputs.button("Antwort absenden", {
  value: null,
  reduce: (value) => btnEstimateQuantity(value),
  disabled: isDisabledQuantity,
});
const answerQuantityValue = Generators.input(answerQuantityInput);
```

```js
console.log("plotData", plotData);
```

```js
const btnEstimateQuantity = (value) => {
  setDisabledQuantity(true);
  for (const input of estimateInputQuantity.querySelectorAll("input")) {
    input.disabled = true;
  }
  for (const input of certaintyQuantity.querySelectorAll("input")) {
    input.disabled = true;
  }
  const i = Math.min(99, Number(hopIndex) || 0);

  const match = plotData.comparisonA?.hopCumulative?.A?.find(
    (d) => d.comparisons === i
  );
  const aSuccess = match?.success;

  const matchB = plotData.comparisonA?.hopCumulative?.B?.find(
    (d) => d.comparisons === i
  );
  const bSuccess = matchB?.success;

  console.log("i, aSuccess, bSuccess", i, aSuccess, bSuccess);

  const trueValueAtIndex = Math.round(100 * aSuccess);
  const trueValueQuantity = Math.round(
    100 * plotData.comparisonA.absoluteSuccessRates.aSuccess
  );

  logBtnEstimateQuantity({
    estimateValueQuantity,
    trueValue: trueValueQuantity,
    hopIndex,
    trueValueAtIndex,
  });

  return value + 1;
};
```

<!-- ********************************************************* -->
<!-- ********************************************************* -->
<!-- ********************************************************* -->

```js
const scrollTo = Inputs.button("Nochmal versuchen", {
  reduce: () => {
    logEvent("kielscn_schlafdauer_btn_retry");
    const target = document.getElementById("user-input");
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  },
});
const scrollToValue = Generators.input(scrollTo);
```

<!-- ```js
const aestheticsInput = Inputs.radio(
  new Map([
    ["1", 1],
    ["2", 2],
    ["3", 3],
    ["4", 4],
    ["5 stimme voll zu", 5],
  ]),
  {
    label: "stimme gar nicht zu",
  }
);
const aestheticsValue = Generators.input(aestheticsInput);
``` -->

<!-- ```js
const interestInput = Inputs.radio(
  new Map([
    ["1", 1],
    ["2", 2],
    ["3", 3],
    ["4", 4],
    ["5 stimme voll zu", 5],
  ]),
  {
    label: "stimme gar nicht zu",
  }
);
const interestValue = Generators.input(interestInput);
``` -->

```js
function createSemanticDifferentialInput(
  question,
  extremeLeft,
  extremeRight,
  logKey
) {
  const form = html`<form
    style="display: flex; flex-direction: column; align-items: flex-start; gap: 10px; margin-top: 10px; margin-bottom: 25px; max-width: 100%;"
  >
    <h2 style="font-weight: 500;">${question}</h2>
    <div
      style="display: flex; align-items: flex-end; gap: 20px; flex-wrap: no-wrap; justify-content: flex-start; width: 100%;"
    >
      <span style="align-self: flex-end; text-align: left; white-space: normal;"
        >${extremeLeft}</span
      >
      <div style="display: flex; gap: 5px; justify-content: center;">
        ${Array.from({ length: 5 }, (_, i) => {
          const wrapper = html`<div
            style="display: flex; flex-direction: column; align-items: center; gap: 4px;"
          >
            <span style="font-size: 0.9rem;">${i + 1}</span>
            <input
              type="radio"
              name="${logKey}"
              value="${i + 1}"
              style="margin: 0;"
            />
          </div>`;
          return wrapper;
        })}
      </div>
      <span
        style="align-self: flex-end; text-align: right; white-space: normal;"
        >${extremeRight}</span
      >
    </div>
  </form>`;

  form.onchange = () => {
    form.value = parseInt(form.querySelector("input:checked").value);
    logInput(logKey, form.value);
  };

  form.value = undefined; // Default value
  return form;
}
```

```js
function createShuffledSemanticDifferentialScale({
  id,
  question,
  items,
  scalePoints = 7,
}) {
  const labelMinWidth = 90;
  const radioMinWidth = 12;
  const radioSize = "clamp(16px, 2.2vw, 20px)";
  const columnGap = 0;
  const extremeFontSize = "clamp(0.8rem, 1.4vw, 1rem)";
  const gridTemplate = `minmax(${labelMinWidth}px, 4fr) repeat(${scalePoints}, minmax(${radioMinWidth}px, 1fr)) minmax(${labelMinWidth}px, 4fr)`;
  const shuffledItems = [...items];
  for (let i = shuffledItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
  }

  const form = html`<form
    style="display: flex; flex-direction: column; align-items: flex-start; gap: 10px; margin-top: 10px; margin-bottom: 25px; max-width: 100%;"
  >
    <h2 style="font-weight: 500;">${question}</h2>
    <div
      style="display: grid; grid-template-columns: ${gridTemplate}; align-items: end; gap: ${columnGap}px; width: 100%;"
    >
      <span style="text-align: left; white-space: normal;">&nbsp;</span>
      ${Array.from({ length: scalePoints }, (_, i) => {
        return html`<div
          style="display: flex; flex-direction: column; align-items: center; gap: 4px; justify-self: center;"
        >
          <span style="font-size: 0.9rem;">${i + 1}</span>
        </div>`;
      })}
      <span style="text-align: right; white-space: normal;">&nbsp;</span>
    </div>
    ${shuffledItems.map((item) => {
      return html`<div
        style="display: grid; grid-template-columns: ${gridTemplate}; align-items: center; gap: ${columnGap}px; width: 100%;"
      >
        <span
          style="text-align: left; white-space: normal; font-size: ${extremeFontSize}; padding-right: 6px; line-height: 1.2; word-break: break-word;"
          >${item.left}</span
        >
        ${Array.from({ length: scalePoints }, (_, i) => {
          const value = i + 1;
          const input = html`<div
            style="display: flex; flex-direction: column; align-items: center; gap: 4px; justify-self: center;"
          >
            <input
              type="radio"
              name="${id}_${item.id}"
              value="${value}"
              aria-label="${item.left} bis ${item.right}: ${value}"
              style="margin: 0;"
            />
          </div>`;
          input.querySelector("input").addEventListener("change", () => {
            updateFormValue();
            logInput(`${id}_${item.id}`, value);
            if (
              Object.values(form.value).every((v) => v !== null) &&
              !form.completionLogged
            ) {
              form.completionLogged = true;
              logEvent(`kielscn_schlafdauer_input_${id}_complete`, {
                ...form.value,
              });
            }
          });
          return input;
        })}
        <span
          style="text-align: right; white-space: normal; font-size: ${extremeFontSize}; padding-left: 6px; line-height: 1.2; word-break: break-word;"
          >${item.right}</span
        >
      </div>`;
    })}
  </form>`;

  const updateFormValue = () => {
    form.value = shuffledItems.reduce((acc, item) => {
      const selected = form.querySelector(
        `input[name="${id}_${item.id}"]:checked`
      );
      acc[item.id] = selected ? parseInt(selected.value, 10) : null;
      return acc;
    }, {});
  };

  updateFormValue();
  return form;
}
```

```js
const aestheticsForm = createSemanticDifferentialInput(
  "Die Gestaltung der Grafik ist ansprechend.",
  "stimme gar nicht zu",
  "stimme voll zu",
  "aesthetic"
);

const interestForm = createSemanticDifferentialInput(
  "Das Thema interessiert mich.",
  "stimme gar nicht zu",
  "stimme voll zu",
  "interest"
);

const familiarityForm = createSemanticDifferentialInput(
  "Die folgende Visualisierung ist mir bekannt.",
  "stimme gar nicht zu",
  "stimme voll zu",
  "familiarity"
);

const manipulationCheck = createSemanticDifferentialInput(
  "Wählen Sie hier bitte die Antwort zwei.",
  "stimme gar nicht zu",
  "stimme voll zu",
  "manipulation_check"
);

const stimulationScale = createShuffledSemanticDifferentialScale({
  id: "skala_stimulation",
  question: "Die Beschäftigung mit dem Artikel empfinde ich als:",
  items: [
    { id: "langweilig_spannend", left: "langweilig", right: "spannend" },
    {
      id: "uninteressant_interessant",
      left: "uninteressant",
      right: "interessant",
    },
    {
      id: "einschlaefernd_aktivierend",
      left: "einschläfernd",
      right: "aktivierend",
    },
    { id: "minderwertig_wertvoll", left: "minderwertig", right: "wertvoll" },
  ],
});
const visualAestheticsScale = createShuffledSemanticDifferentialScale({
  id: "skala_visual_aesthetics",
  question: "Die visuelle Gestaltung des Artikels empfinde ich als:",
  items: [
    { id: "haesslich_schoen", left: "hässlich", right: "schön" },
    {
      id: "unaesthetisch_aesthetisch",
      left: "unästhetisch",
      right: "ästhetisch",
    },
    { id: "stillos_stilvoll", left: "stillos", right: "stilvoll" },
    {
      id: "nicht_ansprechend_ansprechend",
      left: "nicht ansprechend",
      right: "ansprechend",
    },
  ],
});
```

```js
function createBntQuestion({
  id,
  prompt,
  label,
  min,
  max,
  step = 1,
  defaultValue = 0,
  correctAnswer,
  onSubmit,
}) {
  const wrapper = document.createElement("div");
  wrapper.className = "bnt-question";

  const question = document.createElement("p");
  question.textContent = prompt;

  const slider = Inputs.range([min, max], { step, value: defaultValue, label });
  const sliderValue = Generators.input(slider);

  const submitBtn = Inputs.button("Antwort bestätigen", {
    value: 0,
    disabled: false,
    reduce: (value) => {
      const numericValue = Number(slider.value);
      const isCorrect = numericValue === correctAnswer;
      for (const input of slider.querySelectorAll("input")) {
        input.disabled = true;
      }
      submitBtn.querySelector("button").disabled = true;
      onSubmit(id, numericValue, isCorrect);
      return value + 1;
    },
  });

  wrapper.append(question, slider, submitBtn);

  return {
    node: wrapper,
    reset() {
      slider.value = defaultValue;
      slider.disabled = false;
      submitBtn.disabled = false;
    },
  };
}
```

```js
function createBntAdaptiveTest() {
  const container = document.createElement("div");
  container.className = "card bnt-container";

  const followUpContainer = document.createElement("div");
  followUpContainer.className = "bnt-follow-up";
  const q3Container = document.createElement("div");
  q3Container.className = "bnt-follow-up";

  const correctAnswers = {
    q1: 25,
    q2a: 30,
    q2b: 20,
    q3: 50,
  };
  const state = {
    q1: null,
    q2a: null,
    q2b: null,
    q3: null,
  };
  const locked = {
    q1: false,
    q2a: false,
    q2b: false,
    q3: false,
  };
  let lastScore = null;

  const handleSubmit = (id, value, isCorrect) => {
    state[id] = value;
    locked[id] = true;
    logEvent(`kielscn_schlafdauer_bnt_submit_${id}`, {
      question: id,
      value,
      correct: isCorrect,
    });

    if (id === "q1") {
      resetBranch(["q2a", "q2b", "q3"]);
      q3Container.innerHTML = "";
      if (isCorrect) {
        showFollowUp("q2b");
      } else {
        showFollowUp("q2a");
      }
    }

    if (id === "q2b") {
      if (isCorrect) {
        resetBranch(["q3"]);
        q3Container.innerHTML = "";
      } else {
        showQ3();
      }
    }

    updateScore();
  };

  const questions = {
    q1: createBntQuestion({
      id: "q1",
      prompt:
        "Von 1.000 Leuten in einer Kleinstadt sind 500 Mitglied im Gesangsverein. Von diesen 500 Mitgliedern im Gesangsverein sind 100 Männer. Von den 500 Einwohnern, die nicht im Gesangsverein sind, sind 300 Männer. Wie groß ist die Wahrscheinlichkeit, dass ein zufällig ausgewählter Mann ein Mitglied des Gesangsvereins ist? Bitte geben sie die Wahrscheinlichkeit in Prozent an.",
      label: "Antwort in Prozent",
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 0,
      correctAnswer: correctAnswers.q1,
      onSubmit: handleSubmit,
    }),
    q2a: createBntQuestion({
      id: "q2a",
      prompt:
        "Stellen Sie sich vor, wir werfen einen fünfseitigen Würfel 50 mal. Bei wie vielen dieser 50 Würfe würde dieser fünfseitige Würfel erwartungsgemäß eine ungerade Zahl zeigen (1, 3 oder 5)?",
      label: "Anzahl der Würfe",
      min: 0,
      max: 50,
      step: 1,
      defaultValue: 0,
      correctAnswer: correctAnswers.q2a,
      onSubmit: handleSubmit,
    }),
    q2b: createBntQuestion({
      id: "q2b",
      prompt:
        "Stellen Sie sich vor, wir werfen einen gezinkten Würfel (6 Seiten). Die Wahrscheinlichkeit, dass der Würfel eine 6 zeigt, ist doppelt so hoch wie die Wahrscheinlichkeit jeder der anderen Zahlen. Von 70 Würfen, bei wie vielen dieser 70 Würfe würde dieser Würfel erwartungsgemäß eine 6 zeigen?",
      label: "Anzahl der Würfe",
      min: 0,
      max: 70,
      step: 1,
      defaultValue: 0,
      correctAnswer: correctAnswers.q2b,
      onSubmit: handleSubmit,
    }),
    q3: createBntQuestion({
      id: "q3",
      prompt:
        "In einem Wald sind 20% der Pilze rot, 50% braun und 30% weiß. Ein roter Pilz ist mit einer Wahrscheinlichkeit von 20% giftig. Ein Pilz, der nicht rot ist, ist er mit einer Wahrscheinlichkeit von 5% giftig. Wie hoch ist die Wahrscheinlichkeit, dass ein zufällig ausgewählter Pilz giftig ist?",
      label: "Antwort in Prozent",
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 0,
      correctAnswer: correctAnswers.q3,
      onSubmit: handleSubmit,
    }),
  };

  container.append(questions.q1.node, followUpContainer, q3Container);

  function showFollowUp(questionKey) {
    followUpContainer.innerHTML = "";
    followUpContainer.appendChild(questions[questionKey].node);
  }

  function showQ3() {
    if (!q3Container.contains(questions.q3.node)) {
      q3Container.innerHTML = "";
      q3Container.appendChild(questions.q3.node);
    }
  }

  function resetBranch(keys) {
    keys.forEach((key) => {
      state[key] = null;
      locked[key] = false;
      questions[key].reset();
    });
  }

  function isCorrect(key) {
    return state[key] !== null && state[key] === correctAnswers[key];
  }

  function calculateScore() {
    if (!locked.q1) return null;

    if (!isCorrect("q1")) {
      if (!locked.q2a) return null;
      return isCorrect("q2a") ? 2 : 1;
    }

    if (!locked.q2b) return null;
    if (isCorrect("q2b")) return 4;

    if (!locked.q3) return null;
    return isCorrect("q3") ? 4 : 3;
  }

  function updateScore() {
    const score = calculateScore();
    if (score !== null && score !== lastScore) {
      logEvent("kielscn_schlafdauer_bnt_score", { score });
      lastScore = score;
    }
  }

  return container;
}
```

```js
const bntAdaptiveTest = createBntAdaptiveTest();
```

```js
const miniVlatImageUrls = {
  mv1: await FileAttachment("./data/TreeMap.png").url(),
  mv2: await FileAttachment("./data/Stacked100.png").url(),
  mv3: await FileAttachment("./data/Histogram.png").url(),
  mv4: await FileAttachment("./data/Choropleth.png").url(),
  mv5: await FileAttachment("./data/PieChart.png").url(),
  mv6: await FileAttachment("./data/BubbleChart.png").url(),
  mv7: await FileAttachment("./data/StackedBar.png").url(),
  mv8: await FileAttachment("./data/LineChart.png").url(),
  mv9: await FileAttachment("./data/BarChart.png").url(),
  mv10: await FileAttachment("./data/AreaChart.png").url(),
  mv11: await FileAttachment("./data/StackedArea.png").url(),
  mv12: await FileAttachment("./data/Scatterplot.png").url(),
};
```

```js
function createMiniVlatQuiz() {
  const questions = [
    {
      id: "mv1",
      image: miniVlatImageUrls.mv1,
      alt: "Treemap, Kategorien Search/Portal, Software, Retail, Social Network, Computer",
      prompt: "eBay ist in der Kategorie „Software“ eingeordnet.",
      options: ["Wahr", "Falsch"],
      correct: "Falsch",
    },
    {
      id: "mv2",
      image: miniVlatImageUrls.mv2,
      alt: "Gestapelte Balken mit Anteilen an Gold-, Silber- und Bronzemedaillen für mehrere Länder",
      prompt: "Welches Land hat den niedrigsten Anteil an Goldmedaillen?",
      options: ["USA", "Großbritannien", "Japan", "Australien"],
      correct: "Großbritannien",
    },
    {
      id: "mv3",
      image: miniVlatImageUrls.mv3,
      alt: "Histogramm der Fahrstrecke und KundInnen",
      prompt:
        "Welche Entfernung sind die Kundinnen und Kunden am meisten gefahren?",
      options: ["60–70 km", "30–40 km", "20–30 km", "50–60 km"],
      correct: "30–40 km",
    },
    {
      id: "mv4",
      image: miniVlatImageUrls.mv4,
      alt: "Choropleth-Karte USA mit Arbeitslosenquoten 2020",
      prompt:
        "Im Jahr 2020 war die Arbeitslosenquote in Washington (WA) höher als in Wisconsin (WI).",
      options: ["Wahr", "Falsch"],
      correct: "Wahr",
    },
    {
      id: "mv5",
      image: miniVlatImageUrls.mv5,
      alt: "Kreisdiagramm der weltweiten Smartphone-Marktanteile 2021",
      prompt:
        "Wie hoch ist ungefähr der weltweite Smartphone-Marktanteil von Samsung?",
      options: ["17,6 %", "25,3 %", "10,9 %", "35,2 %"],
      correct: "17,6 %",
    },
    {
      id: "mv6",
      image: miniVlatImageUrls.mv6,
      alt: "Blasendiagramm Metro-Systeme mit Länge, Stationen und Fahrgästen",
      prompt: "Welche Stadt hat die größte Anzahl an U-Bahn-Stationen?",
      options: ["Peking", "Shanghai", "London", "Seoul"],
      correct: "Shanghai",
    },
    {
      id: "mv7",
      image: miniVlatImageUrls.mv7,
      alt: "Gestapelte Balken zu Zimmerservice-Kosten in Städten",
      prompt: "Wie viel kosten Erdnüsse in Seoul?",
      options: ["5,2 $", "6,1 $", "7,5 $", "4,5 $"],
      correct: "6,1 $",
    },
    {
      id: "mv8",
      image: miniVlatImageUrls.mv8,
      alt: "Liniendiagramm Ölpreis 2020 nach Monaten",
      prompt: "Wie hoch war der Preis für ein Barrel Öl im Februar 2020?",
      options: ["50,54 $", "47,02 $", "42,34 $", "43,48 $"],
      correct: "50,54 $",
    },
    {
      id: "mv9",
      image: miniVlatImageUrls.mv9,
      alt: "Balkendiagramm Internetgeschwindigkeit 2021 für Länder",
      prompt:
        "Wie hoch ist die durchschnittliche Internetgeschwindigkeit in Japan?",
      options: ["42,30 Mbit/s", "40,51 Mbit/s", "35,25 Mbit/s", "16,16 Mbit/s"],
      correct: "40,51 Mbit/s",
    },
    {
      id: "mv10",
      image: miniVlatImageUrls.mv10,
      alt: "Flächendiagramm Robusta-Kaffeepreise über die Zeit",
      prompt:
        "Wie hoch war der durchschnittliche Preis für ein Pfund Kaffee im Oktober 2019?",
      options: ["0,71 $", "0,90 $", "0,80 $", "0,63 $"],
      correct: "0,71 $",
    },
    {
      id: "mv11",
      image: miniVlatImageUrls.mv11,
      alt: "Gestapeltes Flächendiagramm beliebter Mädchennamen im Vereinigten Königreich",
      prompt:
        "Wie war das Verhältnis von Mädchen mit dem Namen „Isla“ zu Mädchen mit dem Namen „Amelia“ im Jahr 2012 im Vereinigten Königreich?",
      options: ["1 zu 1", "1 zu 2", "1 zu 3", "1 zu 4"],
      correct: "1 zu 2",
    },
    {
      id: "mv12",
      image: miniVlatImageUrls.mv12,
      alt: "Scatterplot Körpergröße und Gewicht von 85 Personen",
      prompt:
        "Es besteht ein negativer Zusammenhang zwischen der Körpergröße und dem Gewicht der 85 Männer.",
      options: ["Wahr", "Falsch"],
      correct: "Falsch",
    },
  ];

  const container = document.createElement("div");
  container.className = "card minivlat";

  const header = document.createElement("div");
  header.className = "minivlat-header";
  const intro = document.createElement("div");
  const introLead = document.createElement("p");
  introLead.textContent =
    "Dieser Test misst deine Fähigkeit, Diagramme zu lesen und zu interpretieren.";
  const introList = document.createElement("ol");
  [
    "Der Test besteht aus 12 Fragen.",
    "Für jede richtige Antwort bekommst du +1 Punkt; für falsche Antworten gibt es keinen Punktabzug.",
    "Das Quiz dauert etwa 5 Minuten (bis zu 25 Sekunden pro Frage).",
    "Wenn du dir bei einer Antwort unsicher bist, überspringe die Frage.",
  ].forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    introList.appendChild(li);
  });
  intro.append(introLead, introList);
  header.append(intro);

  const questionsWrap = document.createElement("div");
  questionsWrap.className = "minivlat-questions";

  let correctCount = 0;
  let answeredCount = 0;
  let completionLogged = false;

  const updateScore = () => {
    if (answeredCount === questions.length && !completionLogged) {
      completionLogged = true;
      logEvent("kielscn_schlafdauer_minivlat_complete", {
        score: correctCount,
        total: questions.length,
      });
    }
  };

  questions.forEach((q, i) => {
    const block = document.createElement("div");
    block.className = "minivlat-question";

    const qTitle = document.createElement("h3");
    qTitle.textContent = `Frage ${i + 1}`;
    const prompt = document.createElement("p");
    prompt.textContent = q.prompt;

    const img = new Image();
    img.src = q.image;
    img.alt = q.alt;
    img.loading = "lazy";

    const form = document.createElement("div");
    form.className = "minivlat-options";

    let answered = false;
    let attempts = 0;

    q.options.forEach((opt) => {
      const label = document.createElement("label");
      label.className = "minivlat-option";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = q.id;
      input.value = opt;
      input.addEventListener("change", () => {
        attempts += 1;
        const isCorrect = input.value === q.correct;
        if (!answered) {
          answered = true;
          answeredCount += 1;
          if (isCorrect) correctCount += 1;
        }
        logEvent("kielscn_schlafdauer_minivlat_answer", {
          id: q.id,
          choice: input.value,
          correct: isCorrect,
          attempt: attempts,
        });
        if (answered) {
          updateScore();
        }
      });
      label.append(input, document.createTextNode(opt));
      form.appendChild(label);
    });

    block.append(qTitle, img, prompt, form);
    questionsWrap.appendChild(block);
  });

  const divider = document.createElement("div");
  divider.className = "minivlat-divider";

  container.append(header, divider, questionsWrap);
  return container;
}
```

```js
function createFollowupQuestionsCard() {
  const questions = [
    {
      id: "delayed_recognition",
      question:
        "Kannten Sie den Artikel doch und es ist Ihnen erst später aufgefallen?",
      options: ["Ja", "Nein"],
    },
    {
      id: "data_use_honesty",
      question:
        "Seien Sie bitte ehrlich: Sollten wir Ihre Angaben in diesem Fragebogen für unsere Analysen verwenden?",
      options: ["Ja", "Nein"],
    },
    {
      id: "carefulness",
      question: "Wie sorgfältig haben Sie diese Studie bearbeitet?",
      options: [
        "Gar nicht sorgfältig",
        "wenig sorgfältig",
        "eher sorgfältig",
        "sehr sorgfältig",
      ],
    },
  ];

  const container = document.createElement("div");
  container.className = "card followup-card";

  const heading = document.createElement("h2");
  heading.textContent = "Noch ein paar abschließende Fragen:";

  const intro = document.createElement("p");
  intro.textContent =
    "Bitte beantworten Sie die folgenden Fragen. Ihre Antworten helfen uns, die Studie besser auszuwerten.";

  const questionsWrap = document.createElement("div");
  questionsWrap.className = "followup-questions";

  const answered = new Set();
  let completionLogged = false;

  const checkCompletion = () => {
    if (!completionLogged && answered.size === questions.length) {
      completionLogged = true;
      logEvent("kielscn_schlafdauer_followup_complete", {
        answered: Array.from(answered),
      });
    }
  };

  questions.forEach((q) => {
    const block = document.createElement("div");
    block.className = "followup-question";

    const prompt = document.createElement("p");
    prompt.textContent = q.question;

    const optionsWrap = document.createElement("div");
    optionsWrap.className = "followup-options";

    q.options.forEach((opt) => {
      const label = document.createElement("label");
      label.className = "followup-option";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `followup_${q.id}`;
      input.value = opt;

      input.addEventListener("change", () => {
        answered.add(q.id);
        logInput(`followup_${q.id}`, opt);
        logEvent("kielscn_schlafdauer_followup_answer", {
          id: q.id,
          choice: opt,
        });
        checkCompletion();
      });

      label.append(input, document.createTextNode(opt));
      optionsWrap.appendChild(label);
    });

    block.append(prompt, optionsWrap);
    questionsWrap.appendChild(block);
  });

  const feedbackWrap = document.createElement("div");
  feedbackWrap.className = "followup-feedback";

  const feedbackLabel = document.createElement("p");
  feedbackLabel.textContent =
    "Vielen Dank für Ihre Teilnahme! Möchten Sie uns noch etwas mitteilen?";

  const feedbackInput = document.createElement("textarea");
  feedbackInput.rows = 3;
  feedbackInput.placeholder = "Ihre Nachricht (optional)";

  const submit = document.createElement("button");
  submit.type = "button";
  submit.className = "followup-submit";
  submit.textContent = "Antwort senden";

  submit.addEventListener("click", () => {
    const text = feedbackInput.value.trim();
    logInput("followup_feedback", text);
    logEvent("kielscn_schlafdauer_followup_feedback_submitted", {
      hasText: text.length > 0,
    });
    feedbackInput.disabled = true;
    submit.disabled = true;
  });

  feedbackWrap.append(feedbackLabel, feedbackInput, submit);

  container.append(heading, intro, questionsWrap, feedbackWrap);
  return container;
}
```

```js
const miniVlatTest = createMiniVlatQuiz();
const followupQuestionsCard = createFollowupQuestionsCard();
```

```js
const shareBtn = Inputs.button("Teilen Sie diesen Artikel", {
  reduce: () => {
    if (navigator.share) {
      navigator
        .share({
          title: "Schau dir diese interaktive Grafik zur Schlafdauer an!",
          text: "So viel schlafen andere in Ihrem Alter",
          url: window.location.href,
        })
        .then(() => {
          logEvent("kielscn_schlafdauer_shared", { shared: true }); // Log success
        })
        .catch((error) => {
          logEvent("kielscn_schlafdauer_shared", { shared: false }); // Log failure
        });
    } else {
      console.log("Web Share API wird nicht unterstützt.");
    }
  },
});
```

<!-- Main Visualization code -->

```js
const initialWidth = document
  .querySelector("main")
  .getBoundingClientRect().width;
const initialHeight = window.innerHeight;
```

```js
const container = d3.create("div");
container.style("position", "relative");

const yAxisSVG = container
  .append("svg")
  .attr("width", width)
  .attr("height", initialHeight)
  .style("position", "absolute")
  .style("pointer-events", "none")
  .style("z-index", 1);

// Create a scrolling div containing the area shape and the horizontal axis.
const body = container
  .append("div")
  .attr("id", "body")
  .style("position", "relative")
  .style("overflow-x", "hidden")
  .style("-webkit-overflow-scrolling", "touch");

const canvas = body.append("canvas").node();
const context = canvas.getContext("2d");

// Initialize the value of the container
container.node().value = {
  age: isEnhanced ? undefined : 89,
  sleepTime: isEnhanced ? undefined : 0,
};

canvas.width = width * canvasScaleFactor;
canvas.height = initialHeight * canvasScaleFactor;

canvas.style.width = `${width}px`;
canvas.style.height = `${initialHeight}px`;
canvas.style.display = "block";

let totalWidth = width;

const svg = body
  .append("svg")
  .attr("class", "svg")
  .attr("width", width)
  .attr("height", initialHeight)
  .style("position", "absolute")
  .style("top", "0px")
  .style("left", "0px")
  .style("display", "block");

const defs = svg.append("defs");

const clipPath = defs
  .append("clipPath")
  .attr("id", "plot-clip")
  .append("rect")
  .attr("x", margin.left)
  .attr("y", margin.top)
  .attr("width", width - margin.left - margin.right)
  .attr("height", initialHeight - margin.top - margin.bottom);

const { xScaleSVG, yScaleSVG, timeScale } = createScales({
  w: width,
  h: initialHeight,
});

/* const pointcloud = new Pointcloud(context, canvas, {
  simulatedData,
  xScale: xScaleSVG,
  yScale: yScaleSVG,
}); */

// Inside your chart setup function
const scatterGroup = initializeScatterPlot(svg, {
  simulatedData,
  xScaleSVG,
  yScaleSVG,
});

// Create Axes
const { gx, gy, xAxis, yAxis, updateAxes /* , styleYAxis  */ } = createAxes(
  svg,
  yAxisSVG,
  {
    xScaleSVG,
    yScaleSVG,
    w: width,
    h: initialHeight,
  }
);

const percentilesGroup = svg.append("g").attr("class", "percentiles");
const crosshair = initializeCrosshair({
  svg,
  xScaleSVG,
  yScaleSVG,
  width,
  height: initialHeight,
  yAxisSVG,
  isEnhanced,
});

const { crosshairXLine, crosshairYLine } = crosshair;

// Setup the pointer interactions like pointerMoved and pointerClicked

let pointerInteraction;
let scrollInteraction;
if (isEnhanced) {
  pointerInteraction = new PointerInteraction(svg, {
    margin,
    w: width,
    h: initialHeight,
    xScaleSVG,
    yScaleSVG,
    container,
  });
} else {
  /* scrollInteraction = new ScrollInteraction(body.node()); */
  scrollInteraction = new ScrollInteraction(
    body.node(),
    container.node(),
    xScaleSVG,
    yScaleSVG,
    width
  );
}

let currentWidth = initialWidth;
let currentHeight = initialHeight;
let currentStepProps = baseStep;

function updateChart({ data, stepProps, hopIndex, isEnhanced }) {
  debugLog("update", "updateChart");
  const changes = diffStepProps(stepProps, currentStepProps);
  debugLog("update", "changes", changes);

  // Setup update plan
  let updatePlan = {
    updateHeight: false,
    updateWidth: false,
    updateScrollState: false,
    updateDimensions: false,
    updateScales: false,
    updateAxes: false,
    updateInteractions: false,
    updatePercentiles: false,
    updatePointcloud: false,
    updatePlots: false,
    updateCrosshairs: false,
    updateScroll: false,
    updateScatterplot: false,
    // ... add other update flags as necessary
  };
  if (stepProps.variant === "hop" || stepProps.variant === "hop_traced") {
    updatePlan.updatePlots = true;
  }
  if (changes.xDomain) {
    const absDomainOld = changes.xDomain?.old[1] - changes.xDomain?.old[0];
    const absDomainNew = changes.xDomain?.new[1] - changes.xDomain?.new[0];
    const isDomainChange = absDomainOld !== absDomainNew;
    updatePlan.updateWidth = isDomainChange; // if domain interval changes, update width
    updatePlan.updateDimensions = isDomainChange; // if domain interval changes, update dimensions
    updatePlan.updateScales = isDomainChange; // if domain interval changes, update scales
    updatePlan.updateAxes = isDomainChange; // if domain interval changes, update axes
    updatePlan.updatePercentiles = isDomainChange; // if domain interval changes, update percentiles
    updatePlan.updatePointcloud = isDomainChange; // if domain interval changes, update pointcloud
    updatePlan.updateScatterplot = isDomainChange; // if domain interval changes, update scatterplot
    updatePlan.updateScroll = true;
  }
  if (changes.height) {
    updatePlan.updateHeight = true;
    updatePlan.updateDimensions = true;
    updatePlan.updateScales = true;
    updatePlan.updateAxes = true;
    updatePlan.updatePercentiles = true;
    updatePlan.updatePointcloud = true;
    updatePlan.updateScatterplot = true;
    updatePlan.updatePlots = true;
    updatePlan.updateCrosshairs = true;
  }
  if (changes.isExplorable) {
    updatePlan.updateInteractions = true;
  }
  if (changes.showPercentiles) {
    updatePlan.updatePercentiles = true;
  }
  if (changes.xresolution) {
    updatePlan.updatePercentiles = true;
  }
  if (changes.scrollStep) {
    updatePlan.updateScrollState = true;
    updatePlan.updateAxes = true; // necessary for desktop ticks to be updated
    /* updatePlan.updateScroll = true; */
  }
  if (changes.variant || changes.age || changes.sleepTime || changes.height) {
    updatePlan.updatePlots = true;
  }
  if (changes.age || changes.sleepTime || changes.tooltipText) {
    updatePlan.updateCrosshairs = true;
  }
  if (changes.showPointcloud) {
    /* updatePlan.updatePointcloud = true; */
    updatePlan.updateScatterplot = true;
  }

  debugLog("update", "updatePlan", updatePlan);

  // Execute updates based on the update plan

  let newWidth = currentWidth;
  let newHeight = currentHeight;

  if (updatePlan.updateInteractions) {
    // Update dimensions/state in pointerInteraction or scrollInteraction.
    // setting this before updating the xScale is important
    debugLog("update", "updateInteractions");
    if (isEnhanced) {
      pointerInteraction.isExplorable = stepProps.isExplorable || false;
    } else if (!isEnhanced) {
      /* debugLog(
          "update",
          "set horizontal scrolling to",
          stepProps.isExplorable
        ); */
      scrollInteraction.setExplorable(stepProps.isExplorable || false); // attention! this uses the old xScaleSVG for calculating the element.scrollLeft
    }
  }

  if (updatePlan.updateWidth) {
    // Update width based on new xDomain.
    debugLog("update", "updateWidth");
    const { totalWidth } = updateXDomain(xScaleSVG, stepProps, width, margin); // attention! this mutates the xScaleSVG
    newWidth = totalWidth;
  }

  if (updatePlan.updateHeight) {
    debugLog("update", "updateHeight");
    newHeight = stepProps.height;
  }

  if (updatePlan.updateScrollState && !isEnhanced) {
    // Update scroll state in pointerInteraction or scrollInteraction.
    debugLog("update", "updateScrollState");
    scrollInteraction.setForceProgrammaticScroll(true);
  }

  if (updatePlan.updateDimensions) {
    // Update SVG, canvas, and clipPath dimensions.
    debugLog("update", "updateDimensions");

    canvas.width = newWidth * canvasScaleFactor; // domain change
    canvas.height = newHeight * canvasScaleFactor; // height change

    canvas.style.width = `${newWidth}px`; // domain change
    canvas.style.height = `${newHeight}px`; // height change

    svg
      .transition("updateDimensions")
      .duration(600)
      .attr("width", newWidth)
      .attr("height", newHeight);

    yAxisSVG.attr("height", newHeight); // height change

    clipPath
      .transition("transitionClipPath")
      .duration(600)
      .attr("width", newWidth - margin.left - margin.right) // domain change
      .attr("height", newHeight - margin.top - margin.bottom); // height change

    if (isEnhanced) {
      pointerInteraction.setDimensions(width, newHeight); // height change
    }
  }

  if (updatePlan.updateScales) {
    debugLog("update", "updateScales");
    // Recalculate scales based on new dimensions or domain.
    xScaleSVG
      .domain([ageMin, ageMax - 1])
      .range([margin.left, newWidth - margin.right]);
    yScaleSVG.range([newHeight - margin.bottom, margin.top]);
  }

  if (updatePlan.updateAxes) {
    // Update axes with new scales.
    debugLog("update", "updateAxes");
    updateAxes(xScaleSVG, yScaleSVG, width, newHeight, stepProps); // both change
  }

  if (updatePlan.updatePercentiles) {
    // Redraw or update percentile elements.
    debugLog("update", "updatePercentiles");
    drawPercentiles(percentilesGroup, {
      dataSet, // could be array
      showPercentiles: stepProps.showPercentiles,
      xScaleSVG,
      yScaleSVG,
      tickValues: stepProps.xResolution,
      isEnhanced,
    });
  }

  if (updatePlan.updatePointcloud) {
    // Update pointcloud if needed.
    debugLog("update", "updatePointcloud");
    /* pointcloud.setVisibility(stepProps.showPointcloud); */
  }

  if (updatePlan.updateScatterplot) {
    // Update scatterplot if needed.
    debugLog("update", "updateScatterplot");
    setScatterVisibility(stepProps.showPointcloud);
    updateScatterPlot(scatterGroup, {
      xScaleSVG,
      yScaleSVG,
    });
  }

  if (updatePlan.updatePlots) {
    // Execute type specific plot updates.
    debugLog("update", "updatePlots");
    debugLog("update", "variant", stepProps.variant);
    switch (stepProps.variant) {
      case "percentile":
        updatePercentilePlot(data, xScaleSVG, yScaleSVG);
        break;
      case "dot":
        updateDotPlot(data, stepProps, xScaleSVG, yScaleSVG, newHeight);
        break;
      case "box":
        updateBoxPlot(data, xScaleSVG, yScaleSVG);
        break;
      case "hop":
        updateHOPPlot(data, {
          xScaleSVG,
          yScaleSVG,
          hopIndex,
          h: newHeight,
        });
        break;
      case "hop_traced":
        updateHOPPlot(data, {
          xScaleSVG,
          yScaleSVG,
          hopCount,
          hopIndex,
          h: newHeight,
        });
        break;
      case "none":
        exitPlot();
        break;
      default:
        console.error("Unknown plot type selected");
    }
  }

  // Default duration based on trigger source
  let duration = getDuration(stepProps.triggerSource);

  if (changes.height) {
    duration = getDuration("height");
    debugLog("update", "height change", duration);
  }

  // Override for section changes
  if (changes.scrollStep) {
    duration = 600; // Override with custom value for section change
  }

  debugLog("update", "final duration", duration);

  if (updatePlan.updateCrosshairs) {
    // Refresh crosshairs. Maybe adjust the duration.
    debugLog("update", "updateCrosshairs", duration);
    // duration on mobile and on height change should be ? ms
    // duration on mobile and on slider change should be ? ms
    // duration on mobile and on scroll change should be ? ms
    // duration on desktop and on height change should be ? ms
    // duration on desktop and on slider change should be ? ms
    // duration on desktop and on scroll change should be ? ms
    /* const duration = stepProps.triggerSource === "slider" ? 600 : 600; */

    updateCrosshairs(
      stepProps,
      crosshair,
      xScaleSVG,
      yScaleSVG,
      isEnhanced,
      duration
    );
  }

  if (updatePlan.updateScroll) {
    debugLog("update", "updateScroll", duration);
    /* const duration = stepProps.triggerSource === "slider" ? 600 : 600; */

    if (!isEnhanced) {
      scrollInteraction.programmaticScroll(stepProps.xDomain[0], duration);
    } else {
      programmaticScroll({
        targetDomainLeft: stepProps.xDomain[0],
        element: body.node(),
        xScale: xScaleSVG,
        duration: 600,
      });
    }
  }
  currentWidth = newWidth;
  currentHeight = newHeight;
  currentStepProps = stepProps;
}

container.node().updateChart = updateChart;
```

```js
// Define duration values (set your desired durations in ms)
const durations = {
  mobile: {
    height: 600,
    slider: 200,
    scroll: 100,
  },
  desktop: {
    height: 600,
    slider: 100,
    scroll: 100,
  },
};
```

```js
// Function to get the appropriate duration
function getDuration(eventType) {
  if (!isEnhanced) {
    return durations.mobile[eventType] || 600; // Default to 300ms if undefined
  } else {
    return durations.desktop[eventType] || 500; // Default to 500ms if undefined
  }
}
```

```js
/* function updatePointcloudScales(pointcloud, { xScaleSVG, yScaleSVG }) {
  pointcloud.transitionScales(xScaleSVG.copy(), yScaleSVG.copy(), 1000); // Animate over 1 second
} */
```

```js
const chartElement = container.node();
const chartValue = Generators.input(chartElement);
```

```js
const updateChart = chartElement.updateChart({
  data: dataSet.get(stepProps.age),
  stepProps,
  hopIndex,
  isEnhanced,
});
```

```js
const hopIndex = (async function* () {
  for (
    let j = 0;
    stepProps.variant === "hop" ||
    stepProps.variant === "hop_traced" ||
    (variant === "hop" && stepProps.comparison) ||
    (variant === "hop_traced" && stepProps.comparison);
    ++j
  ) {
    yield j;
    await new Promise((resolve) => setTimeout(resolve, hopDuration));
  }
})();
```

<!-- --- Observer -->

```js
const targets = document.querySelectorAll(".scroll-section");
```

```js
setupIntersectionObserver({
  targets,
  setDisabled,
  estimateInput,
  invalidation,
  setScrollyStep,
});
```

<!-- Helper functions -->

```js
const btnEstimate = (value) => {
  setDisabled(true);
  for (const input of estimateInput.querySelectorAll("input")) {
    input.disabled = true;
  }
  logBtnEstimate({
    estimateValue,
    trueValue: Math.round(getTrueValue(dataSet, stepProps) * 100),
    age: stepProps.age,
    sleepTime: stepProps.sleepTime,
  });
  return value + 1;
};
```

<!-- HTML -->

```js
// Get the div where the visualization description will be displayed
const visualizationDescriptionDiv = document.querySelector(
  '.scroll-section[data-step="6"]'
);

// Object to store descriptions for each visualization type
const visualizationDescriptions = {
  dot: "<p>Die Figuren zeigen, wie lange Menschen in einem bestimmten Alter schlafen. Jede Figur steht für einen Anteil der Menschen in dieser Altersgruppe. Je höher oder tiefer eine Figur auf der Grafik ist, desto länger oder kürzer schlafen diese Menschen. Je mehr Figuren nebeneinanderstehen, desto mehr Menschen schlafen die Stundenanzahl, die links auf dieser Höhe angegeben ist.</p>",
  box: "<p>Die hier gezeigte Boxplot-Darstellung zeigt, wie die Daten verteilt sind. Dabei sind die Hälfte der Daten im mittleren Bereich, also in der Box, abgebildet. Die Balken oben und unten zeigen die längsten und kürzesten Schlafdauern und bilden die andere Hälfte der Daten ab. Der Boxplot bezieht sich jeweils auf die gerade ausgewählte Altersgruppe.</p>",
  percentile:
    "<p>Hier haben wir die Perzentillinien noch zusätzlich beschriftet, damit Sie sich besser zurechtfinden können. Die Beschriftung bezieht sich jeweils auf die gerade ausgewählte Altersgruppe.</p>",
  hop: "<p>Diese Darstellung zeigt jeweils einzelne Datenpunkte, also einzelne Personen und ihre Schlafdauer. Je nachdem wie häufig und wo die Datenpunkte auftauchen, können Sie abschätzen, wie viele Menschen eine bestimmte Stundenanzahl schlafen. Die Datenpunkte beziehen sich jeweils auf die gerade ausgewählte Altersgruppe.</p>",
  hop_traced:
    "<p>Diese Darstellung zeigt jeweils einzelne Datenpunkte, also einzelne Personen und ihre Schlafdauer. Je nachdem wie häufig und wo die Datenpunkte auftauchen, können Sie abschätzen, wie viele Menschen eine bestimmte Stundenanzahl schlafen. Die Datenpunkte beziehen sich jeweils auf die gerade ausgewählte Altersgruppe.</p>",
  none: "<p>No specific visualization selected.</p>",
};

// Function to update the description based on the visualization type
function updateVisualizationDescription(visualizationType) {
  const description =
    visualizationDescriptions[visualizationType] ||
    visualizationDescriptions.none;
  visualizationDescriptionDiv.innerHTML = description;
}

// Example usage: Update the description based on the current visualization type
updateVisualizationDescription(variant);
```

```js
const stepContent = {
  4: {
    desktop: `<p>Karin ist 31&nbsp;Jahre alt und liegt mit einer Schlafdauer von 7&nbsp;Stunden im 50.&nbsp;Perzentil: Die eine Hälfte der 31-Jährigen schläft mehr, die andere weniger.</p>`,
    mobile: `<p>Karin ist 31&nbsp;Jahre alt und liegt mit einer Schlafdauer von 7&nbsp;Stunden im 50.&nbsp;Perzentil: Die eine Hälfte der 31-Jährigen schläft mehr, die andere weniger.</p><p>Damit es besser erkennbar ist, haben wir näher herangezoomt. Die x-Achse unten hat sich also verändert und zeigt jeweils nur den Altersbereich an, um den es gerade geht.</p>`,
  },
};

function appendStepContent(step) {
  const stepDiv = document.querySelector(
    `.scroll-section[data-step="${step}"]`
  );

  if (stepDiv) {
    // Check if the content is already present
    if (!stepDiv.dataset.appended) {
      // Create a wrapper div for the new content
      const newContent = document.createElement("div");
      newContent.innerHTML = isEnhanced
        ? stepContent[step].desktop
        : stepContent[step].mobile;

      // Append content
      stepDiv.appendChild(newContent);

      // Mark this step as updated to prevent duplicate insertions
      stepDiv.dataset.appended = "true";
    }
  }
}

// Update all steps
[4].forEach(appendStepContent);
```

```js
const comparisons = {
  comparisonA: { muGroupA: 7, sigmaGroupA: 0.5, muGroupB: 6, sigmaGroupB: 0.4 },
  comparisonB: {
    muGroupA: 7.5,
    sigmaGroupA: 0.45,
    muGroupB: 5.5,
    sigmaGroupB: 0.5,
  },
};
```

```js
const plotData = FileAttachment("./data/data_success_rates.json").json();
```

<!-- ```js
const plotData = generateDistributions(comparisons);
``` -->

<!-- Hop Data -->

```js
const hopDomain = d3.extent(plotData.comparisonA.hop, (d) => d.q);
```

<!-- Quantile Dot Plot Data -->

```js
const qradius = (0.5 * qheightComp * qstepComp) / (qdomain[1] - qdomain[0]);
```

```js
const qdomain = d3.extent(plotData.comparisonA.quantileDot, (d) => d.x);
```

```js
const qxmax = d3.least(
  d3.rollups(
    plotData.comparisonA.quantileDot.map((d) => d.x),
    (v) => v.length,
    (d) => d
  ),
  ([, length]) => -length
)[1];
```

```js
const plots = {
  dot: (width) =>
    dotPlot(plotData.comparisonA.quantileDot, {
      width,
      height: qheightComp,
      yDomain: qdomain,
      xMax: qxmax,
      qradius,
    }),
  hop: (width) =>
    hopPlot(plotData.comparisonA.hop, {
      width,
      height: qheightComp,
      yDomain: hopDomain,
      qradius,
      animate: true,
      duration: hopDuration,
      index: hopIndex,
    }),
  hop_traced: (width) =>
    hopTracedPlot(plotData.comparisonA.hop, {
      width,
      height: qheightComp,
      yDomain: hopDomain,
      qradius,
      animate: true,
      duration: hopDuration,
      window: hopCount,
      index: hopIndex,
    }),
  percentile: (width) =>
    percentilePlot(plotData.comparisonA.percentile, {
      width,
      height: qheightComp,
      yDomain: hopDomain,
    }),
  box: (width) =>
    boxPlot(plotData.comparisonA.box, {
      width,
      height: qheightComp,
      /* yDomain: hopDomain, */
    }),
};
```

# So viel schlafen andere in Ihrem Alter

Finden Sie es mit unserer interaktiven Grafik heraus! Wie lange schlafen Sie im Vergleich zu anderen? Wie alt sind Menschen, die so lange schlafen wie Sie? Und wie sieht es mit der Schlafdauer in der Gesamtbevölkerung aus?
Scrollen Sie einfach nach unten - die Inhalte entfalten sich Schritt für Schritt, während Sie weiter scrollen.

<section class="scroll-container">
<div class="scroll-info">${chartElement}</div>

<div class="scroll-section card" data-step="1">
  <p>Auf der Y-Achse links ist die Schlafdauer eingetragen, unten auf der X-Achse das Alter.</p>
</div>
<div class="scroll-section card" data-step="2">
  <p>Jeder winzige Punkt in der Wolke entspricht der Schlafdauer einer Person eines bestimmten Alters. Dazu haben Fachleute die Daten von über 150.000&nbsp;Menschen aus verschiedenen Studien zusammengetragen. Je dichter die Wolke, desto mehr Menschen werden dort repräsentiert.</p>
</div>
<div class="scroll-section card" data-step="3">
  <p>Die Linien geben Perzentile an und zeigen, wie sich die Datenpunkte in der Stichprobe verteilen. Was das konkret heißt, sehen Sie im folgenden Bild:</p>
</div>
<div class="scroll-section card" data-step="4">
</div>
<div class="scroll-section card" data-step="5" id="user-input">
  <p>Wie ist es bei Ihnen? Geben Sie hier Ihr Alter und Ihre übliche Schlafdauer (bspw. von letzter Nacht) ein, um sich in der Grafik verorten zu können! Wenn Sie weiter scrollen, können Sie sich mit anderen in Ihrem Alter vergleichen.</p>${ageInput}${sleepTimeInput}
  <p class="disclaimer">Die auf dieser Seite erhobenen Daten werden in vollständig anonymisierter Form für wissenschaftliche Zwecke durch das Kiel Science Communication Network verwendet. Es ist kein Rückschluss auf Ihre Person möglich.</p>
</div>
<div class="scroll-section card" data-step="6">
  <!-- Description Variant -->
</div>
<div class="scroll-section card" data-step="7">
  <p>Was würden Sie schätzen, wie viel Prozent der Menschen in ${personalizationValue ? "dieser" : "Ihrer"} Altersgruppe schlafen kürzer als Sie?${estimateInput}${answerInput}</p>
</div>
<div class="scroll-section card" data-step="8">

## **Wie haben Sie den Artikel erlebt?**

---

${stimulationScale}

---

${visualAestheticsScale}

---

## **Was trifft für Sie zu?**

---

${aestheticsForm}

---

${manipulationCheck}

---

${interestForm}

---

${educationInput}

</div>
<div class="scroll-section card" data-step="9">
<p>Was würden Sie schätzen, wie viel Prozent der 20-Jährigen schlafen kürzer als Sie?${estimateInputPercentageA}${certaintyPercentageA}${answerPercentageInputA}</p>
</div>
<div class="scroll-section card" data-step="10">
<p>Was würden Sie schätzen, wie viel Prozent der 30-Jährigen schlafen kürzer als Sie?${estimateInputPercentageB}${certaintyPercentageB}${answerPercentageInputB}</p>
</div>
<div class="scroll-section card" data-step="11">
<p>Was würden Sie schätzen, wie viel Prozent der 40-Jährigen schlafen kürzer als Sie?${estimateInputPercentageC}${certaintyPercentageC}${answerPercentageInputC}</p>
</div>
<div class="scroll-section card" data-step="12">

<!-- prettier-ignore -->
Wir wissen, dass ${Math.round(getTrueValue(dataSet, estimateSleepAge.A) * 100)}% der Gesamtpopulation **weniger/mehr** schlafen als **Name**. Was schätzen Sie: auf welcher Höhe müsste der schwarze Punkt für die Schlafdauer von **Name** liegen, um genau das abzubilden? Sie können den Punkt verschieben, indem Sie den Regler bewegen.

${estimateInputSleepA}

---

${certaintySleepA}
${answerSleepInputA}

</div>
<div class="scroll-section card" data-step="13">

<!-- prettier-ignore -->
Wir wissen, dass ${Math.round(getTrueValue(dataSet, estimateSleepAge.A) * 100)}% der Gesamtpopulation **weniger/mehr** schlafen als **Name**. Was schätzen Sie: auf welcher Höhe müsste der schwarze Punkt für die Schlafdauer von **Name** liegen, um genau das abzubilden? Sie können den Punkt verschieben, indem Sie den Regler bewegen.

${estimateInputSleepB}

---

${certaintySleepB}
${answerSleepInputB}

</div>
<div class="scroll-section card" data-step="14">

<!-- prettier-ignore -->
Wir wissen, dass ${Math.round(getTrueValue(dataSet, estimateSleepAge.A) * 100)}% der Gesamtpopulation **weniger/mehr** schlafen als **Name**. Was schätzen Sie: auf welcher Höhe müsste der schwarze Punkt für die Schlafdauer von **Name** liegen, um genau das abzubilden? Sie können den Punkt verschieben, indem Sie den Regler bewegen.

${estimateInputSleepC}

---

${certaintySleepC}
${answerSleepInputC}

</div>
<div class="scroll-section card" data-step="15">
Schaut man nur auf die Mediane, könnte man meinen: Die Werte der Männer liegen klar über denen der Frauen. Blicken wir jedoch auf die Verteilungen, zeigt sich, dass es längst nicht so eindeutig ist. Gleichzeitig wird die Interpretation dadurch anspruchsvoller.

${(variant === "all" ? Object.keys(plots) : [variant])
.map(k => resize((width) => plots[k](width)))}

${estimateInputQuantity}

---

${certaintyQuantity}
${answerQuantityInput}

</div>

</section>

${bntAdaptiveTest}
${miniVlatTest}
${followupQuestionsCard}

<!-- <div class="outro card">
  <h2>Hinter den Daten</h2>
  <p>Studien zufolge unterliegt die Beurteilung der eigenen Schlafdauer oft Verzerrungen. Wer unter Schlafstörungen leidet, neigt dazu, die geschlafene Zeit zu unterschätzen. Gute Schläfer hingegen überschätzen sie häufig. Dieses Phänomen ist nur eins von vielen, mit denen sich die Schlafforschung befasst. Auf unseren Themenseiten finden Sie zahlreiche Artikel zu den Themen <a href="https://www.spektrum.de/thema/schlaf/1295691">Schlaf</a> und <a href="https://www.spektrum.de/thema/traeumen/1356995">Träumen</a>.</p>
  <p>Methodischer Hintergrund: Die Basis für die Grafik sind die Daten <a href="https://www.nature.com/articles/s41562-020-00965-x">dieser</a> Metaanalyse von Kocevska et al. Eine Metaanalyse fügt die Ergebnisse von vielen einzelnen Studien zusammen und gewinnt dadurch an Aussagekraft. Aus den statistischen Kennwerten haben wir eine realistische Verteilung nachgebildet und daraus die Perzentile berechnet.</p>
  <p>Die Grafik wurde erstellt vom Kiel Science Communication Network (KielSCN).</p>
  <p>Texte: Stephan Reiche/KielSCN, Anna von Hopffgarten/Spektrum der Wissenschaft und Carolin Wagener/Spektrum der Wissenschaft</br>Grafikdesign und Umsetzung: Björn Döge/KielSCN</p>
  ${shareBtn}
</div> -->

<!-- CSS -->

<style>
.scroll-container {
  margin: 1rem auto;
  padding-bottom: 1vh; /* hack to ensure last section scrolls past svg to */
}

.scroll-info {
  position: sticky;
  top: 0;
  margin: 0 auto;
}

.scroll-info,
.scroll-section {
  /* transition: all 0.3s ease; */
}
.scroll-section {
  position: relative;
  margin: 0 auto 100svh;
  z-index: 2;
  opacity: 1;
}

.card {
  max-width: 32rem;
}

.scroll-section.inactive > * {
  opacity: 0.5; /* Adjust to desired dimming level */
  transition: opacity 0.3s ease; /* Smooth transition */
}

.scroll-section:last-of-type {
  margin-bottom: 100svh;
}

.outro {
  margin: 0 auto 2rem;
  transition: margin 0.6s ease;
}

.outro button {
  display: block;
  margin: auto;
}

#answer {
  display: none;
  overflow: hidden;
}

#body {
  overflow-x: scroll;
  -ms-overflow-style: none;  /* Hide scrollbar for Internet Explorer and Edge */
  scrollbar-width: none;  /* Hide scrollbar for Firefox */
}

#body::-webkit-scrollbar {
  display: none;  /* Hide scrollbar for Chrome, Safari, and newer Edge */
}

.disclaimer {
  font-size: 0.8rem;
  color: #888;
}

.bnt-container {
  margin: 10svh auto 20svh;
}

.bnt-follow-up {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bnt-question {
  margin-top: 1rem;
}

.bnt-answer-value {
  font-size: 0.95rem;
  color: #b8b8b8;
}

.minivlat {
  margin: 10svh auto 20svh;
  position: relative;
  z-index: 4;
}

.minivlat-header h2 {
  margin-bottom: 0.25rem;
}

.minivlat-header p {
  margin-top: 0;
  font-size: 0.95rem;
}

.minivlat-header ol {
  margin: 0.25rem 0 0;
  padding-left: 1.25rem;
}

.minivlat-divider {
  height: 1px;
  background: #333;
  margin: 1rem 0 1.5rem;
}

.minivlat-questions {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.minivlat-question img {
  width: 100%;
  height: auto;
  margin: 0.5rem 0;
  border: 1px solid #333;
  border-radius: 6px;
}

.minivlat-question {
  padding-bottom: 1.25rem;
  border-bottom: 1px solid #333;
}

.minivlat-question:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.minivlat-options {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.minivlat-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.bnt-submit {
  margin-top: 0.75rem;
}

.bnt-score {
  font-weight: 600;
  margin-top: 1rem;
}

.followup-card {
  margin: 10svh auto 20svh;
}

.followup-questions {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.followup-question {
  padding-bottom: 1rem;
  border-bottom: 1px solid #333;
}

.followup-question:last-child {
  border-bottom: none;
  padding-bottom: 0.5rem;
}

.followup-options {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.35rem;
}

.followup-option {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  cursor: pointer;
}

.followup-feedback {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.followup-feedback textarea {
  width: 100%;
  min-height: 100px;
  padding: 0.65rem;
  border-radius: 6px;
  border: 1px solid #444;
  background: #0e0e0e;
  color: #eee;
  resize: vertical;
}

.followup-submit {
  align-self: flex-start;
  padding: 0.55rem 1.25rem;
  border: 1px solid #444;
  border-radius: 6px;
  background: #fff;
  color: #111;
  cursor: pointer;
}

.followup-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

</style>
