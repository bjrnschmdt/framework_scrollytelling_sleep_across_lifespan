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
```

```js
const initialVH = window.innerHeight; // Store initial height
```

```js
const currentVH = height;

// Calculate the necessary margin shift (negative to compensate for increased height)
const marginCompensation = initialVH - currentVH;
/* console.log("Margin compensation:", marginCompensation); */
scrollInfo.style("margin-bottom", `${marginCompensation}px`);
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
console.log("height", height);
```

<!-- ```js
chartElement;
// this has to be called once the chartElement is available
const scrollLeft = Generators.observe((change) => {
  const element = document.querySelector("#body");
  if (!element) return;

  const onScroll = () => change(element.scrollLeft);
  element.addEventListener("scroll", onScroll);
  onScroll(); // Initialize with the current value

  return () => element.removeEventListener("scroll", onScroll);
});
```

```js
const ageScroll = Math.round(xScaleSVG.invert(scrollLeft + width / 2));
```

```js
if (ageScroll !== chartElement.value.age /* && scrollyStep.value === 7 */) {
  console.log("set ChartElement to ageScroll", ageScroll);
  set(chartElement, { ...chartElement.value, age: ageScroll });
}
```

```js
console.log("ageScroll", ageScroll);
``` -->

```js
/* console.log("chartValue", chartValue); */
```

```js
/* const { xScaleSVG, yScaleSVG, timeScale } = createScales({ w, h }); */
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
const debouncedWidth = createDebouncedLogger(
  (value) => console.log("width", value),
  500
);
```

```js
debouncedWidth(width);
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
// Initial computation of stepProps from your getSteps function:
/* const initialStepProps = scrollyProps[scrollyStep]; */
```

```js
const stableStepProps = Mutable(baseStep);
const setStableStepProps = (x) => {
  console.log("New stableStepProps value:", x);
  stableStepProps.value = x;
};
```

```js
const prevDimensions = Mutable({ width: initialWidth, height: initialHeight });
const setPrevDimensions = (x) => {
  console.log("New prevDimensions value:", x);
  prevDimensions.value = x;
};
```

```js
// reset the stableStepProps to the baseStep on resize
// This is a quick and dirty way to reset the stableStepProps on resize
// I might want to do this in a more controlled way
// maybe adding debounce to the resize event
/* width, height; */
/* setStableStepProps(baseStep); */
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
console.log("stepProps", stepProps);
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
  mobileTicks: d3.ticks(5, 95, 18), // 18/5, 45/2, 90/1
  triggerSource: null,
};
```

```js
const scrollyProps = {
  0: { ...baseStep, scrollStep: 0 },
  1: { ...baseStep, scrollStep: 1 },
  2: {
    ...baseStep,
    scrollStep: 2,
    showPointcloud: true,
  },
  3: {
    ...baseStep,
    scrollStep: 3,
    showPointcloud: true,
    showPercentiles: ["C"],
  },
  4: {
    ...baseStep,
    scrollStep: 4,
    age: 31,
    sleepTime: 7,
    showPointcloud: false,
    showPercentiles: ["C"],
    tooltipText: "Karin",
    xDomain: isEnhanced ? [5, 95] : [26, 36],
    mobileTicks: d3.ticks(5, 95, 90),
  },
  5: {
    ...baseStep,
    scrollStep: 5,
    age: ageValue,
    sleepTime: sleepTimeValue,
    showPointcloud: true,
    showPercentiles: ["C"],
    tooltipText: "Du",
    xDomain: isEnhanced ? baseStep.xDomain : [ageValue - 5, ageValue + 5],
    mobileTicks: d3.ticks(5, 95, 90),
    triggerSource: "slider",
  },
  6: {
    ...baseStep,
    scrollStep: 6,
    age: ageValue,
    sleepTime: sleepTimeValue,
    showPointcloud: true,
    showPercentiles: ["C"],
    variant,
    xDomain: isEnhanced ? baseStep.xDomain : [ageValue - 5, ageValue + 5],
    mobileTicks: d3.ticks(5, 95, 90),
  },
  7: {
    ...baseStep,
    scrollStep: 7,
    age: ageValue,
    sleepTime: sleepTimeValue,
    showPointcloud: true,
    showPercentiles: ["C"],
    variant,
    xDomain: isEnhanced ? baseStep.xDomain : [ageValue - 5, ageValue + 5],
    mobileTicks: d3.ticks(5, 95, 90),
  },
  8: {
    ...baseStep,
    scrollStep: 8,
    age: chartValue.age,
    sleepTime: chartValue.sleepTime,
    showPointcloud: true,
    showPercentiles: ["C"],
    isExplorable: true,
    variant,
    xDomain: isEnhanced
      ? baseStep.xDomain
      : [chartValue.age - 5, chartValue.age + 5],
    mobileTicks: d3.ticks(5, 95, 90),
    triggerSource: "scroll",
  },
  9: {
    ...baseStep,
    scrollStep: 9,
    showPointcloud: true,
    showPercentiles: ["C"],
    variant,
  },
  10: {
    ...baseStep,
    scrollStep: 10,
    showPointcloud: true,
    showPercentiles: ["C"],
    variant,
    xDomain: [5, 10],
    mobileTicks: d3.ticks(5, 95, 90),
  },
  11: {
    ...baseStep,
    scrollStep: 11,
    showPointcloud: true,
    showPercentiles: ["C"],
    variant,
    xDomain: [11, 17],
    mobileTicks: d3.ticks(5, 95, 90),
  },
  12: {
    ...baseStep,
    scrollStep: 12,
    showPointcloud: true,
    showPercentiles: ["C"],
    variant,
    xDomain: [18, 65],
    mobileTicks: d3.ticks(5, 95, 90),
  },
  13: {
    ...baseStep,
    scrollStep: 13,
    showPointcloud: true,
    showPercentiles: ["C"],
    variant,
    xDomain: [66, 94],
    mobileTicks: d3.ticks(5, 95, 90),
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
console.log("ageValue", ageValue);
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
console.log("block rerun");
const container = d3.create("div");
container.style("position", "relative");

const yAxisSVG = container
  .append("svg")
  .attr("width", initialWidth)
  .attr("height", initialHeight)
  .style("position", "absolute")
  .style("pointer-events", "none")
  .style("z-index", 1);

// Create a scrolling div containing the area shape and the horizontal axis.
const body = container
  .append("div")
  .attr("id", "body")
  .style("position", "relative")
  .style("overflow-x", "scroll")
  .style("-webkit-overflow-scrolling", "touch");

const canvas = body.append("canvas").node();
const context = canvas.getContext("2d");

// Initialize the value of the container
container.node().value = {
  age: isEnhanced ? undefined : 20,
  sleepTime: isEnhanced ? undefined : 7,
};

console.log("main:", initialWidth, initialHeight);

canvas.width = initialWidth * canvasScaleFactor;
canvas.height = initialHeight * canvasScaleFactor;

canvas.style.width = `${initialWidth}px`;
canvas.style.height = `${initialHeight}px`;
canvas.style.display = "block";

let totalWidth = initialWidth;

const svg = body
  .append("svg")
  .attr("class", "svg")
  .attr("width", initialWidth)
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
  .attr("width", initialWidth - margin.left - margin.right)
  .attr("height", initialHeight - margin.top - margin.bottom);

const { xScaleSVG, yScaleSVG, timeScale } = createScales({
  w: initialWidth,
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
    w: initialWidth,
    h: initialHeight,
  }
);

const percentilesGroup = svg.append("g").attr("class", "percentiles");
/* .attr("clip-path", "url(#plot-clip)") */ const crosshair =
  initializeCrosshair(svg, xScaleSVG, yScaleSVG, initialWidth, initialHeight);

const { crosshairXLine, crosshairYLine } = crosshair;

// Setup the pointer interactions like pointerMoved and pointerClicked

let pointerInteraction;
let scrollInteraction;
if (isEnhanced) {
  pointerInteraction = new PointerInteraction(svg, {
    margin,
    w: initialWidth,
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
    initialWidth
  );
}

let isTransitioning = false;

function updateChart({
  data,
  stepProps,
  changes,
  hopIndex,
  newWidth,
  newHeight,
  prevDimensions,
  isEnhanced,
}) {
  console.log("updateChart");
  // only set scrollLeft if the chart is not explorable
  // meaning the slider input section is visible
  // to prevent the scrollLeft to set the chartValue
  // as only intended in the chart input section
  if (
    changes?.age &&
    !stepProps.isExplorable &&
    stepProps.triggerSource === "slider"
  ) {
    scrollInteraction.programmaticScroll(
      changes.age.new ?? stepProps.xDomain[0],
      100
    );
  }

  const isScrolling = !isEnhanced ? scrollInteraction.getScrollState() : false; // Fetch only if mobile

  /* console.log("updateChart"); */
  console.log(
    "prevHeight",
    prevDimensions.height,
    "newHeight",
    newHeight,
    "isScrolling",
    isScrolling,
    "changes",
    changes
  );

  // domain transition
  if (
    /* (!isScrolling || isEnhanced) &&  */ // Skip condition if horizontal scrolling is happening on mobile, like in the explorable section
    prevDimensions.width !== newWidth ||
    prevDimensions.height !== newHeight ||
    (changes?.xDomain && changes?.scrollStep) // Only run domain updates if NOT triggered by slider and a step change happens
  ) {
    isTransitioning = true; // Prevents updates during transition

    console.log(
      "domains or dimensions changed",
      changes,
      prevDimensions,
      newWidth,
      newHeight
    );

    /* if (stepProps.age === undefined || stepProps.sleepTime === undefined) {
      console.log("age or sleepTime is undefined");
      return;
    } */

    // calculating the absolute domain for calculating new total width
    const { start, end, totalWidth } = updateXDomain(
      xScaleSVG,
      stepProps,
      changes,
      newWidth,
      margin
    );

    yScaleSVG.range([newHeight - margin.bottom, margin.top]); // dimension change

    canvas.width = totalWidth * canvasScaleFactor; // domain change
    canvas.height = newHeight * canvasScaleFactor; // domain change

    canvas.style.width = `${totalWidth}px`; // domain change
    canvas.style.height = `${newHeight}px`; // domain change

    svg
      .transition("updateDimensions")
      .duration(600)
      .attr("width", totalWidth)
      .attr("height", newHeight); // domain change
    yAxisSVG.attr("width", newWidth).attr("height", newHeight); // dimension change

    clipPath
      .attr("width", totalWidth - margin.left - margin.right)
      .attr("height", newHeight - margin.top - margin.bottom);

    if (isEnhanced) {
      pointerInteraction.setDimensions(newWidth, newHeight);
    }

    updateAxes(xScaleSVG, yScaleSVG, newWidth, newHeight);

    // Update crosshairs
    updateCrosshairs(
      stepProps,
      crosshair,
      xScaleSVG,
      yScaleSVG,
      isEnhanced,
      600
    );

    drawPercentiles(percentilesGroup, {
      dataSet,
      showPercentiles: stepProps.showPercentiles,
      xScaleSVG,
      yScaleSVG,
      tickValues: stepProps.mobileTicks,
    });

    // Necessary for the transition to work; otherwise, the transition would be interrupted by a new call to update triggered by the mutable setStableStepProps
    /* if (Object.keys(changes).length === 0) {
      return;
    } */

    const element = body.node();
    const duration = 600;

    !isEnhanced && scrollInteraction.setTransitionState(true); // Notify that a transition starts

    const transition = d3
      .transition("scrollLeftTweenDomain")
      .duration(duration);
    // Scroll animation
    transition.tween("scrollDomain", function () {
      const interpolator = d3.interpolateNumber(element.scrollLeft, end);
      return function (t) {
        console.log(
          "interpolator(t) dimension or domain change",
          interpolator(t)
        );
        element.scrollLeft = interpolator(t);
      };
    });

    transition.on("end", () => {
      !isEnhanced && scrollInteraction.setTransitionState(false); // Notify that transition has ended
      if (stepProps.isExplorable && !isEnhanced) {
        scrollInteraction.setExplorable(true);
      }
    });

    setPrevDimensions({ width: newWidth, height: newHeight });
  }

  // Update only if there are changes
  if (Object.keys(changes).length > 0) {
    /* console.log("changes", changes); */

    // Update pointcloud visibility
    /* if (changes.showPointcloud) {
      pointcloud.setVisibility(stepProps.showPointcloud);
    } */

    // Update percentiles visibility
    /* if (changes.showPercentiles) {
      drawPercentiles(svg, {
        dataSet,
        showPercentiles: stepProps.showPercentiles,
        xScaleSVG,
        yScaleSVG,
        tickValues: stepProps.mobileTicks,
      });
    } */

    // Update exploration mode
    if ("isExplorable" in changes && isEnhanced) {
      pointerInteraction.isExplorable = stepProps?.isExplorable || false;
    } else if ("isExplorable" in changes && !isEnhanced) {
      scrollInteraction.isExplorable = stepProps?.isExplorable || false;
    }

    // Update type specific plot
    if (changes.variant || changes.age || changes.sleepTime) {
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

    // Update crosshairs
    if (changes.age || changes.sleepTime || changes.tooltipText) {
      updateCrosshairs(
        stepProps,
        crosshair,
        xScaleSVG,
        yScaleSVG,
        isEnhanced,
        100
      );
    }

    setStableStepProps(stepProps);
  }
}

container.node().updateChart = updateChart;
/* container.node().updateDimensions = updateDimensions; */
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
  newWidth: width,
  newHeight: height,
  prevDimensions,
  isEnhanced,
});
```

```js
chartValue;
const j = (async function* () {
  for (let j = 0; variant === "hop" || variant === "hop_traced"; ++j) {
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
    ? `Super, die richtige Lösung ist ${trueValue}%. Wenn du magst, versuche es gerne nochmal mit einem anderen Alter oder einer anderen Schlafdauer.`
    : `Die richtige Antwort ist ${trueValue}%. Wenn du magst, versuche es gerne nochmal mit einem anderen Alter oder einer anderen Schlafdauer.`;

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
    "Hier haben wir die Perzentillinien noch zusätzlich beschriftet, damit du dich besser zurechtfinden kannst. Die Beschriftung bezieht sich jeweils auf die gerade ausgewählte Altersgruppe.",
  hop: "Diese Darstellung zeigt jeweils einzelne Datenpunkte, also einzelne Personen und ihre Schlafdauer. Je nachdem wie häufig und wo die Datenpunkte auftauchen, kannst du abschätzen, wie viele Menschen eine bestimmte Stundenanzahl schlafen. Die Datenpunkte beziehen sich jeweils auf die gerade ausgewählte Altersgruppe.",
  hop_traced:
    "Diese Darstellung zeigt jeweils einzelne Datenpunkte, also einzelne Personen und ihre Schlafdauer. Je nachdem wie häufig und wo die Datenpunkte auftauchen, kannst du abschätzen, wie viele Menschen eine bestimmte Stundenanzahl schlafen. Die Datenpunkte beziehen sich jeweils auf die gerade ausgewählte Altersgruppe.",
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

```js

```

# Schlafdauer über die Lebensspanne

Wie lange schläfst du im Vergleich zu anderen? Wie alt sind Menschen, die so lange schlafen wie du? Und wie sieht es mit der Schlafdauer in der Gesamtbevölkerung so aus? Finde es mit unserer interaktiven Grafik heraus! Scrolle einfach nach unten - die Inhalte entfalten sich Schritt für Schritt, während du weiter scrollst.

<section class="scroll-container">
  <div class="scroll-info">${chartElement}</div>
  <div class="scroll-section card" data-step="1"><p>Auf der Y-Achse links ist die Schlafdauer eingetragen, unten auf der X-Achse das Alter.</p></div>
  <div class="scroll-section card" data-step="2"><p>Jeder winzige Punkt in der Wolke entspricht der Schlafdauer einer Person eines bestimmten Alters. Dazu haben Fachleute die Daten von über 150.000 Menschen aus verschiedenen Studien zusammengetragen. Je dichter die Wolke, desto mehr Menschen werden dort repräsentiert. Die Daten der Erwachsenen beruhen auf Selbsteinschätzungen, die der Kinder auf Angaben der Eltern. Studien zufolge unterliegt die Beurteilung der eigenen Schlafdauer oft Verzerrungen: Wer unter Schlafstörungen leidet, neigt dazu, die geschlafene Zeit zu unterschätzen. Gute Schläfer hingegen überschätzen sie häufig.</p></div>
  <div class="scroll-section card" data-step="3"><p>Die Linien geben Perzentile an und zeigen, wie sich die Datenpunkte in der Stichprobe verteilen. Was das konkret heißt, siehst du im folgenden Bild:</p></div>
  <div class="scroll-section card" data-step="4"><p>Karin ist 31 Jahre alt und liegt mit einer Schlafdauer von 7 Stunden im 50. Perzentil: Die eine Hälfte der 31-Jährigen schläft mehr, die andere weniger.</p></div>
   <div class="scroll-section card" data-step="5" id="user-input"><p>
  Wie ist es bei dir? Gib hier dein Alter und deine übliche Schlafdauer (bspw. von letzter Nacht) ein, um dich in der Grafik verorten zu können! Wenn du weiter scrollst, kannst du dich mit anderen in deinem Alter vergleichen.</p>
  ${ageInput}${sleepTimeInput}</div>
  <div class="scroll-section card" data-step="6">
  <p>Die Figuren zeigen, wie lange Menschen in einem bestimmten Alter schlafen. Jede Figur steht für einen Anteil der Menschen in dieser Altersgruppe. Je höher oder tiefer eine Figur auf der Grafik ist, desto länger oder kürzer schlafen diese Menschen. Je mehr Figuren nebeneinanderstehen, desto mehr Menschen schlafen die Stundenanzahl, die links auf dieser Höhe angegeben ist.</p></div> 
  <div class="scroll-section card" data-step="7"><p>Was würdest du schätzen, wie viel Prozent der Menschen in ${personalizationValue ? "dieser" : "deiner"} Altersgruppe schlafen kürzer als du?${estimateInput}${answerInput}${feedbackInput}</div>  
  <div class="scroll-section card" data-step="8"><p>Bewege den Mauszeiger in die Grafik, um sie frei zu erkunden. Ein Klick fixiert die Ansicht, ein weiterer Klick löst sie wieder.</div>
  <div class="scroll-section card" data-step="9">
  <p>Uns interessiert deine Meinung: wie stehst du zu folgenden Aussagen?</p>
  <h2>Die Gestaltung der Grafik war ansprechend.</h2>
  ${aestheticsInput}
  <h2>Das Thema hat mich interessiert.</h2>
  ${interestInput}
</div>
    <div class="scroll-section card" data-step="10"><h2>Altersgruppe bis 10 Jahre</h2>
    <p> Um die vielen neuen Eindrücke und das Gelernte zu verarbeiten, braucht das Gehirn in den ersten Lebensjahren besonders viel Schlaf. Bis zum Jugendalter ist die durchschnittliche Schlafdauer daher am höchsten. Sie streut auch vergleichsweise wenig – die Perzentillinien liegen nah beieinander.</p>
    </div>
    <div class="scroll-section card" data-step="11"><h2>11–17 Jahre</h2>
    <p>Während der Pubertät fällt die Schlafdauer dramatisch ab; gleichzeitig nimmt die Streuung zu. Da sich in dieser Phase die innere Uhr meist auf spätere Bettzeiten einstellt, die Schule aber in der Regel früh beginnt, bekommen Jugendliche oft weniger Schlaf, als es Fachleute empfehlen.</p>
    </div>
      <div class="scroll-section card" data-step="12"><h2>18–65 Jahre</h2>
    <p>Im Erwachsenenalter stabilisiert sich die Schlafzeit und liegt im Mittel bei 7 Stunden. Dies ist auch die Lebensphase, in der die meisten Menschen einer festen Arbeit nachgehen und damit einen geregelten Tagesablauf haben. Man kann also nicht sagen, ob die Stabilisierung auf biologische Faktoren (das Ende der Pubertät) zurückgeht oder eher auf die Lebensumstände.</p>
   </div>
  <div class="scroll-section card" data-step="13"><h2>Über 66 Jahre</h2>
    <p>Im Rentenalter ändert sich zwar die mittlere Schlafdauer von 7 Stunden nicht, dafür aber die Streuung: Die Perzentillinien driften erst weiter auseinander, um im späteren Verlauf wieder zusammenzurücken. Wie Studien gezeigt haben, sinkt mit dem Alter zudem die Schlafeffizienz. Die Menschen verbringen deutlich mehr Zeit im Bett, als sie tatsächlich schlafen.</p>
</div>
</section>
<!-- <div class="outro card">
  <p>Uns interessiert deine Meinung: wie stehst du zu folgenden Aussagen?</p>
  <h2>Die Gestaltung der Grafik war ansprechend.</h2>
  ${aestheticsInput}
  <h2>Das Thema hat mich interessiert.</h2>
  ${interestInput}
</div> -->

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
  margin: 0 auto 80svh;
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
  margin-bottom: 80svh;
}

.outro {
  margin: 0 auto 2rem;
}

#answer {
  display: none;
  overflow: hidden;
}

</style>
