---
theme: [midnight, alt, wide]
toc: false
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
} from "./components/helperFunctions.js";
import { dataSet, simulatedData } from "./components/data.js";
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
/* import PercentileLines from "./components/PercentileLines.js"; */
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
} from "./components/logger.js";
```

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
} = settings;
```

<!-- Setup -->

```js
const w = width;
```

<!-- ```js
w;
const h = window.innerHeight;
``` -->

```js
// mobile breakpoint
const isEnhanced = width > 800;
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
    (value) => logInput("sleepTime", value),
    500
  ),
  estimate: createDebouncedLogger((value) => logInput("estimate", value), 500),
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
logInput("aesthetics", aestheticsValue);
```

```js
logInput("interest", interestValue);
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
const stableStepProps = Mutable(baseStep);
const setStableStepProps = (x) => {
  stableStepProps.value = x;
};
```

```js
const changes = diffStepProps(stepProps, stableStepProps);
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
  xResolution: isEnhanced ? d3.ticks(5, 95, 90) : d3.ticks(5, 95, 18),
  triggerSource: null,
  height: initialHeight,
};
```

```js
const scrollyProps = {
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
    showPointcloud: true,
    showPercentiles: ["C"],
  },
  4: {
    ...baseStep,
    scrollStep: 4,
    height: height,
    age: 31,
    sleepTime: 7,
    showPointcloud: false,
    showPercentiles: ["C"],
    tooltipText: "Karin",
    xDomain: isEnhanced ? [5, 95] : [25.5, 36.5],
    xResolution: d3.ticks(5, 95, 90),
    ticks: d3.ticks(5, 95, 45),
  },
  5: {
    ...baseStep,
    scrollStep: 5,
    height: height,
    age: ageValue,
    sleepTime: sleepTimeValue,
    showPointcloud: true,
    showPercentiles: ["C"],
    tooltipText: "Du",
    xDomain: isEnhanced ? baseStep.xDomain : [ageValue - 5.5, ageValue + 5.5],
    xResolution: d3.ticks(5, 95, 90),
    ticks: d3.ticks(5, 95, 45),
    triggerSource: "slider",
  },
  6: {
    ...baseStep,
    scrollStep: 6,
    height: height,
    age: ageValue,
    sleepTime: sleepTimeValue,
    showPointcloud: true,
    showPercentiles: ["C"],
    variant,
    xDomain: isEnhanced ? baseStep.xDomain : [ageValue - 5.5, ageValue + 5.5],
    xResolution: d3.ticks(5, 95, 90),
    ticks: d3.ticks(5, 95, 45),
  },
  7: {
    ...baseStep,
    scrollStep: 7,
    height: height,
    age: ageValue,
    sleepTime: sleepTimeValue,
    showPointcloud: true,
    showPercentiles: ["C"],
    variant,
    xDomain: isEnhanced ? baseStep.xDomain : [ageValue - 5.5, ageValue + 5.5],
    xResolution: d3.ticks(5, 95, 90),
    ticks: d3.ticks(5, 95, 45),
  },
  8: {
    ...baseStep,
    scrollStep: 8,
    height: height,
    age: chartValue.age,
    sleepTime: chartValue.sleepTime,
    showPointcloud: true,
    showPercentiles: ["C"],
    isExplorable: true,
    variant,
    xDomain: isEnhanced
      ? baseStep.xDomain
      : [chartValue.age - 5.5, chartValue.age + 5.5],
    xResolution: d3.ticks(5, 95, 90),
    ticks: isEnhanced ? d3.ticks(5, 95, 9) : d3.ticks(5, 95, 45),
    triggerSource: "scroll",
  },
  9: {
    ...baseStep,
    scrollStep: 9,
    height: height,
    age: chartValue.age,
    sleepTime: chartValue.sleepTime,
    showPointcloud: true,
    showPercentiles: ["C"],
    isExplorable: true,
    variant,
    xDomain: isEnhanced
      ? baseStep.xDomain
      : [chartValue.age - 5.5, chartValue.age + 5.5],
    xResolution: d3.ticks(5, 95, 90),
    ticks: isEnhanced ? d3.ticks(5, 95, 9) : d3.ticks(5, 95, 45),
    triggerSource: "scroll",
  },
  10: {
    ...baseStep,
    scrollStep: 10,
    height: height,
    showPointcloud: true,
    showPercentiles: ["C"],
    variant,
    xDomain: [5, 10.5],
    xResolution: d3.ticks(5, 95, 90),
    ticks: isEnhanced ? d3.ticks(5, 95, 90) : d3.ticks(5, 95, 90),
  },
  11: {
    ...baseStep,
    scrollStep: 11,
    height: height,
    showPointcloud: true,
    showPercentiles: ["C"],
    variant,
    xDomain: [5, 10.5],
    xResolution: d3.ticks(5, 95, 90),
    ticks: isEnhanced ? d3.ticks(5, 95, 90) : d3.ticks(5, 95, 90),
  },
  12: {
    ...baseStep,
    scrollStep: 12,
    height: height,
    showPointcloud: true,
    showPercentiles: ["C"],
    variant,
    xDomain: [10.5, 17.5],
    xResolution: d3.ticks(5, 95, 90),
    ticks: isEnhanced ? d3.ticks(5, 95, 90) : d3.ticks(5, 95, 90),
  },
  13: {
    ...baseStep,
    scrollStep: 13,
    height: height,
    showPointcloud: true,
    showPercentiles: ["C"],
    variant,
    xDomain: isEnhanced ? [17.5, 67.5] : [17.5, 67.5],
    xResolution: d3.ticks(5, 95, 90),
    ticks: d3.ticks(5, 95, 18),
  },
  14: {
    ...baseStep,
    scrollStep: 14,
    height: height,
    showPointcloud: true,
    showPercentiles: ["C"],
    variant,
    xDomain: isEnhanced ? [64, 95] : [62.5, 92.5],
    xResolution: d3.ticks(5, 95, 90),
    ticks: d3.ticks(5, 95, 18),
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
const answerInput = Inputs.button("Auflösung anzeigen", {
  value: null,
  reduce: (value) => btnEstimate(value),
  disabled: isDisabled,
});
const answerValue = Generators.input(answerInput);
```

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

```js
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
```

```js
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
let currentStepProps = baseStep;

function updateChart({ data, stepProps, /* changes, */ hopIndex, isEnhanced }) {
  debugLog("update", "updateChart");
  const changes = diffStepProps(stepProps, currentStepProps);
  debugLog("update", "changes", changes);

  let duration = null;

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
    updatePlan.updateScroll = true;
  }
  if (changes.height) {
    updatePlan.updateHeight = true;
    updatePlan.updateDimensions = true;
    updatePlan.updateScales = true;
    updatePlan.updateAxes = true;
    updatePlan.updatePercentiles = true;
    updatePlan.updatePointcloud = true;
    updatePlan.updatePlots = true;
    updatePlan.updateCrosshairs = true;
  }
  if (changes.isExplorable) {
    updatePlan.updateInteractions = true;
  }
  if (changes.showPercentiles) {
    updatePlan.updatePercentiles = true;
  }
  if (changes.scrollStep) {
    updatePlan.updateScrollState = true;
    /* updatePlan.updateScroll = true; */
  }
  if (changes.variant || changes.age || changes.sleepTime || changes.height) {
    updatePlan.updatePlots = true;
  }
  if (changes.age || changes.sleepTime || changes.tooltipText) {
    updatePlan.updateCrosshairs = true;
  }
  if (changes.showPointcloud) {
    updatePlan.updatePointcloud = true;
  }

  debugLog("update", "updatePlan", updatePlan);

  // Execute updates based on the update plan

  let newWidth = currentWidth;
  let newHeight = svg.attr("height");

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
      .attr("width", newWidth) // domain change
      .attr("height", newHeight); // height change

    yAxisSVG.attr("height", newHeight); // height change

    clipPath
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
    updateAxes(xScaleSVG, yScaleSVG, width, newHeight, stepProps.ticks); // both change
  }

  if (updatePlan.updatePercentiles) {
    // Redraw or update percentile elements.
    debugLog("update", "updatePercentiles");
    drawPercentiles(percentilesGroup, {
      dataSet,
      showPercentiles: stepProps.showPercentiles,
      xScaleSVG,
      yScaleSVG,
      tickValues: stepProps.xResolution,
    });
  }

  if (updatePlan.updatePointcloud) {
    // Update pointcloud if needed.
    debugLog("update", "updatePointcloud");
    /* pointcloud.setVisibility(stepProps.showPointcloud); */
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

  if (changes.age || changes.sleepTime) {
    duration = getDuration(stepProps.triggerSource);
    debugLog("update", "age and height change", duration);
  }

  if (changes.height) {
    duration = getDuration("height");
    debugLog("update", "height change", duration);
  }

  if (changes.xDomain) {
    duration = 600;
    debugLog("update", "xDomain change", duration);
  }

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
  currentStepProps = stepProps;
}

container.node().updateChart = updateChart;
```

```js
// Define duration values (set your desired durations in ms)
const durations = {
  mobile: {
    height: 600,
    slider: 100,
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

<!-- ```js
function updatePointcloudScales(pointcloud, { xScaleSVG, yScaleSVG }) {
  pointcloud.transitionScales(xScaleSVG.copy(), yScaleSVG.copy(), 1000); // Animate over 1 second
}
``` -->

```js
const chartElement = container.node();
const chartValue = Generators.input(chartElement);
```

```js
const updateChart = chartElement.updateChart({
  data: dataSet.get(stepProps.age),
  stepProps,
  changes,
  hopIndex: j,
  isEnhanced,
});
```

```js
const j = (async function* () {
  for (
    let j = 0;
    stepProps.variant === "hop" || stepProps.variant === "hop_traced";
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
  feedbackInput.style.display = "block";
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
const feedbackInput = html`<div id="answer" style="display: none;"></div>`;
const feedbackValue = Generators.input(feedbackInput);
```

```js
feedbackInput.innerHTML = ""; // Clear existing content

const trueValue = Math.round(getTrueValue(dataSet, stepProps) * 100);
const estimated = estimateValue;

const message = document.createElement("p");
message.textContent =
  Math.abs(estimated - trueValue) <= 5
    ? `Super, die richtige Lösung ist ${trueValue}%. Wenn Sie wollen, versuchen Sie es gerne nochmal mit einem anderen Alter oder einer anderen Schlafdauer.`
    : `Die richtige Antwort ist ${trueValue}%. Wenn Sie wollen, versuchen Sie es gerne nochmal mit einem anderen Alter oder einer anderen Schlafdauer.`;

feedbackInput.appendChild(message);
feedbackInput.appendChild(scrollTo); // Append the button as an element
```

```js
// Get the div where the visualization description will be displayed
const visualizationDescriptionDiv = document.querySelector(
  '.scroll-section[data-step="6"]'
);

// Object to store descriptions for each visualization type
const visualizationDescriptions = {
  dot: "Die Figuren zeigen, wie lange Menschen in einem bestimmten Alter schlafen. Jede Figur steht für einen Anteil der Menschen in dieser Altersgruppe. Je höher oder tiefer eine Figur auf der Grafik ist, desto länger oder kürzer schlafen diese Menschen. Je mehr Figuren nebeneinanderstehen, desto mehr Menschen schlafen die Stundenanzahl, die links auf dieser Höhe angegeben ist.",
  box: "Die hier gezeigte Boxplot-Darstellung zeigt, wie die Daten verteilt sind. Dabei sind die Hälfte der Daten im mittleren Bereich, also in der Box, abgebildet. Die Balken oben und unten zeigen die längsten und kürzesten Schlafdauern und bilden die andere Hälfte der Daten ab. Der Boxplot bezieht sich jeweils auf die gerade ausgewählte Altersgruppe.",
  percentile:
    "Hier haben wir die Perzentillinien noch zusätzlich beschriftet, damit Sie sich besser zurechtfinden können. Die Beschriftung bezieht sich jeweils auf die gerade ausgewählte Altersgruppe.",
  hop: "Diese Darstellung zeigt jeweils einzelne Datenpunkte, also einzelne Personen und ihre Schlafdauer. Je nachdem wie häufig und wo die Datenpunkte auftauchen, können Sie abschätzen, wie viele Menschen eine bestimmte Stundenanzahl schlafen. Die Datenpunkte beziehen sich jeweils auf die gerade ausgewählte Altersgruppe.",
  hop_traced:
    "Diese Darstellung zeigt jeweils einzelne Datenpunkte, also einzelne Personen und ihre Schlafdauer. Je nachdem wie häufig und wo die Datenpunkte auftauchen, können Sie abschätzen, wie viele Menschen eine bestimmte Stundenanzahl schlafen. Die Datenpunkte beziehen sich jeweils auf die gerade ausgewählte Altersgruppe.",
  none: "No specific visualization selected.",
};

// Function to update the description based on the visualization type
function updateVisualizationDescription(visualizationType) {
  const description =
    visualizationDescriptions[visualizationType] ||
    visualizationDescriptions.none;
  visualizationDescriptionDiv.textContent = description;
}

// Example usage: Update the description based on the current visualization type
updateVisualizationDescription(variant);
```

# Schlafdauer über die Lebensspanne

Wie lange schlafen Sie im Vergleich zu anderen? Wie alt sind Menschen, die so lange schlafen wie Sie? Und wie sieht es mit der Schlafdauer in der Gesamtbevölkerung so aus? Finden Sie es mit unserer interaktiven Grafik heraus! Scrollen Sie einfach nach unten - die Inhalte entfalten sich Schritt für Schritt, während Sie weiter scrollen.

<section class="scroll-container">
<div class="scroll-info">${chartElement}</div>

<div class="scroll-section card" data-step="1">
  <p>Auf der Y-Achse links ist die Schlafdauer eingetragen, unten auf der X-Achse das Alter.</p>
</div>
<div class="scroll-section card" data-step="2">
  <p>Jeder winzige Punkt in der Wolke entspricht der Schlafdauer einer Person eines bestimmten Alters. Dazu haben Fachleute die Daten von über 150.000 Menschen aus verschiedenen Studien zusammengetragen. Je dichter die Wolke, desto mehr Menschen werden dort repräsentiert.</p>
</div>
<div class="scroll-section card" data-step="3">
  <p>Die Linien geben Perzentile an und zeigen, wie sich die Datenpunkte in der Stichprobe verteilen. Was das konkret heißt, sehen Sie im folgenden Bild:</p>
</div>
<div class="scroll-section card" data-step="4">
  <p>Karin ist 31 Jahre alt und liegt mit einer Schlafdauer von 7 Stunden im 50. Perzentil: Die eine Hälfte der 31-Jährigen schläft mehr, die andere weniger.</p>
</div>
<div class="scroll-section card" data-step="5" id="user-input">
  <p>Wie ist es bei Ihnen? Geben Sie hier Ihr Alter und Ihre übliche Schlafdauer (bspw. von letzter Nacht) ein, um sich in der Grafik verorten zu können! Wenn Sie weiter scrollen, können Sie sich mit anderen in Ihrem Alter vergleichen.</p>${ageInput}${sleepTimeInput}
</div>
<div class="scroll-section card" data-step="6">
  <p>Die Figuren zeigen, wie lange Menschen in einem bestimmten Alter schlafen. Jede Figur steht für einen Anteil der Menschen in dieser Altersgruppe. Je höher oder tiefer eine Figur auf der Grafik ist, desto länger oder kürzer schlafen diese Menschen. Je mehr Figuren nebeneinanderstehen, desto mehr Menschen schlafen die Stundenanzahl, die links auf dieser Höhe angegeben ist.</p>
</div>
<div class="scroll-section card" data-step="7">
  <p>Was würden Sie schätzen, wie viel Prozent der Menschen in ${personalizationValue ? "dieser" : "deiner"} Altersgruppe schlafen kürzer als Sie?${estimateInput}${answerInput}${feedbackInput}
</div>
<div class="scroll-section card" data-step="8">
  <p>Bewegen Sie den Mauszeiger in die Grafik, um sie frei zu erkunden. Ein Klick fixiert die Ansicht, ein weiterer Klick löst sie wieder. Wenn Sie genug erkundet haben, scrollen Sie einfach weiter.
</div>
<div class="scroll-section card" data-step="9">
  <p>Uns interessiert Ihre Meinung: wie stehen Sie zu folgenden Aussagen?</p>
  <h2>Die Gestaltung der Grafik war ansprechend.</h2>${aestheticsInput}<h2>Das Thema hat mich interessiert.</h2>${interestInput}</div>
<div class="scroll-section card" data-step="10">
  <p>Sehen wir uns nun die Altersgruppen ein wenig genauer an. Dafür haben wir näher herangezoomt. Die x-Achse unten hat sich also verändert und zeigt jeweils nur die Altersgruppe an, um die es gerade geht.</p>
</div>
<div class="scroll-section card" data-step="11"><h2>Altersgruppe bis 10 Jahre</h2>
  <p>Um die vielen neuen Eindrücke und das Gelernte zu verarbeiten, braucht das Gehirn in den ersten Lebensjahren besonders viel Schlaf. Bis zum Jugendalter ist die durchschnittliche Schlafdauer daher am höchsten. Sie streut auch vergleichsweise wenig – die Perzentillinien liegen nah beieinander.</p>
</div>
<div class="scroll-section card" data-step="12">
  <h2>11–17 Jahre</h2>
  <p>Während der Pubertät fällt die Schlafdauer dramatisch ab; gleichzeitig nimmt die Streuung zu. Da sich in dieser Phase die innere Uhr meist auf spätere Bettzeiten einstellt, die Schule aber in der Regel früh beginnt, bekommen Jugendliche oft weniger Schlaf, als es Fachleute empfehlen.</p>
</div>
<div class="scroll-section card" data-step="13">
  <h2>18–65 Jahre</h2>
  <p>Im Erwachsenenalter stabilisiert sich die Schlafzeit und liegt im Mittel bei 7 Stunden. Dies ist auch die Lebensphase, in der die meisten Menschen einer festen Arbeit nachgehen und damit einen geregelten Tagesablauf haben. Man kann also nicht sagen, ob die Stabilisierung auf biologische Faktoren (das Ende der Pubertät) zurückgeht oder eher auf die Lebensumstände.</p>
</div>
<div class="scroll-section card" data-step="14">
  <h2>Über 66 Jahre</h2>
  <p>Im Rentenalter ändert sich zwar die mittlere Schlafdauer von 7 Stunden nicht, dafür aber die Streuung: Die Perzentillinien driften erst weiter auseinander, um im späteren Verlauf wieder zusammenzurücken. Wie Studien gezeigt haben, sinkt mit dem Alter zudem die Schlafeffizienz. Die Menschen verbringen deutlich mehr Zeit im Bett, als sie tatsächlich schlafen.</p>
</div>
</section>

<div class="outro card">
  <p>Studien zufolge unterliegt die Beurteilung der eigenen Schlafdauer oft Verzerrungen. Wer unter Schlafstörungen leidet, neigt dazu, die geschlafene Zeit zu unterschätzen. Gute Schläfer hingegen überschätzen sie häufig. Dieses Phänomen ist nur eins von vielen, mit denen sich die Schlafforschung befasst. Auf unseren Themenseiten finden Sie zahlreiche Artikel zu den Themen <a href="https://www.spektrum.de/thema/schlaf/1295691">Schlaf</a> und <a href="https://www.spektrum.de/thema/traeumen/1356995">Träumen</a>.</p>
  <p>Methodischer Hintergrund: Die Basis für die Grafik sind die Daten <a href="https://www.nature.com/articles/s41562-020-00965-x">dieser</a> Metaanalyse von Kocevska et al. Eine Metaanalyse fügt die Ergebnisse von vielen einzelnen Studien zusammen und gewinnt dadurch an Aussagekraft. Aus den statistischen Kennwerten haben wir eine realistische Verteilung nachgebildet und daraus die Perzentile berechnet.</p>
  <p>Die Grafik wurde erstellt vom Kiel Science Communication Network (KielSCN).</p>
  <p><em>Texte:</em> Stephan Reiche, Anna von Hopffgarten und Carolin Wagener</p>
  <p><em>Grafikdesign und Umsetzung:</em> Björn Döge</p>
</div>

<!-- CSS -->

<style>
@import url('https://fonts.googleapis.com/css2?family=Roboto&display=swap');

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

</style>
