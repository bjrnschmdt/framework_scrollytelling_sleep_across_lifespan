---
theme: [midnight, alt]
---

<style>

.scroll-container {
  /* position: relative; */
  margin: 1rem auto;
}

.scroll-info {
  position: sticky;
  top: 0;
  margin: 0 auto;
  background-color: var(--theme-background-alt);
  /* z-index: -1; */
  /* pointer-events: none; */
  /* transition: z-index 0.3s ease, pointer-events 0.3s ease; */
}

/* .scroll-info.interactive {
  z-index: 3;
  pointer-events: auto;
} */

/* .scroll-info > div {
  position: relative;
} */

.scroll-info,
.scroll-section {
  transition: all 0.3s ease;
}
.scroll-section {
  position:relative;
  max-width: 32rem;
  margin: 0 auto 60vh;
  z-index: 2;
}

.scroll-section.inactive {
  opacity: 0.5; /* Adjust to desired dimming level */
  transition: opacity 0.3s ease; /* Smooth transition */
}

.scroll-section:last-of-type {
  margin-bottom: 30vh;
}

/* Style the buttons that are used to open and close the accordion panel */
/* .accordion {
  background-color: #eee;
  color: #444;
  cursor: pointer;
  padding: 18px;
  width: 100%;
  text-align: left;
  border: none;
  outline: none;
  transition: 0.4s;
} */

/* Add a background color to the button if it is clicked on (add the .active class with JS), and when you move the mouse over it (hover) */
/* .active, .accordion:hover {
  background-color: #ccc;
} */

/* Style the accordion panel. Note: hidden by default */
.panel {
  /* padding: 0 18px; */
  /* background-color: white; */
  display: none;
  overflow: hidden;
}

#answer {
  display: none;
  overflow: hidden;
}

</style>

```js
import { Generators } from "npm:@observablehq/stdlib";
import { Mutable } from "npm:@observablehq/stdlib";
import { getNearestPValue } from "./components/helperFunctions.js";
import { data, dataSet, simulatedData } from "./components/data.js";
import { settings } from "./components/settings.js";
import { element } from "./components/element.js";
```

```js
const {
  ageMin,
  ageMax,
  thresholdsAge,
  sleepMin,
  sleepMax,
  nthresholdsSleep,
  thresholdsSleep,
  margin,
  qstep,
  qdomain,
  canvasScaleFactor,
  percentileSelection,
  mostProminent,
  lessProminent,
  fontFamily,
  fontSize,
  icon,
} = settings;
```

```js
const w = width;
```

```js
const relativeHeight = 0.6;
```

```js
// Reactive height based on orientation
const h = (() => {
  const isLandscape = w > window.innerHeight;
  return isLandscape
    ? /* (w / 3) * 2 */ window.innerHeight * relativeHeight
    : window.innerHeight * relativeHeight; // 16:9 for landscape, 60vh for portrait
})();
```

```js
const recommended = Mutable(false);
const setTrue = () => (recommended.value = true);
const setFalse = () => (recommended.value = false);
```

```js
const def = {
  age: 89,
  sleepTime: 6.5,
  showRecommended: false,
  showPointcloud: true,
  showPercentiles: ["B", "C"],
  isExplorable: true,
  variant: "none",
};
```

```js
// !!! this may be not needed anymore since input binding is done with separate input declarations
// Still need this for... (don't recall right now)
const entity = Inputs.bind(
  Inputs.form({
    age: Inputs.range([ageMin, ageMax], {
      step: 1,
      label: "age",
      value: def.age,
    }),
    sleepTime: Inputs.range([sleepMin, sleepMax], {
      step: 0.25,
      label: "sleep duration",
      value: def.sleepTime,
    }),
    showRecommended: Inputs.toggle({ label: "Recommended", value: false }),
    showPointcloud: Inputs.toggle({ label: "Pointcloud", value: true }),
    showPercentiles: Inputs.checkbox(["A", "B", "C"], {
      label: "Percentiles",
      value: ["C"],
    }),
    tooltipText: Inputs.text({ label: "Tooltip text", value: "" }),
    isExplorable: Inputs.toggle({ label: "Explorable?", value: true }),
    variant: Inputs.radio(["box", "dot", "percentile", "none"], {
      label: "Select one",
      value: "none",
    }),
  }),
  chartElement
);
```

```js
const entityValue = Generators.input(entity);
```

```js
const personalizationValue = true;
```

```js
const isDisabled = Mutable(false);
const setDisabled = (x) => (isDisabled.value = x);
```

```js
const prediction = Inputs.button("Auflösung anzeigen", {
  value: null,
  reduce: (value) => buttonClicked(value),
  disabled: isDisabled,
});
```

```js
const predictionValue = Generators.input(prediction);
```

```js
const scrollTo = Inputs.button("Nochmal versuchen", {
  reduce: () => {
    const target = document.getElementById("user-input");
    target.scrollIntoView({ behavior: "smooth" });
  },
});
```

```js
const scrollToValue = Generators.input(scrollTo);
```

```js
const ageInput = Inputs.bind(
  Inputs.range([ageMin, ageMax], {
    step: 1,
    label: "Alter",
    value: def.age,
  }),
  entity.children[0]
);
const ageValue = Generators.input(ageInput);
```

```js
const sleepTimeInput = Inputs.bind(
  Inputs.range([sleepMin, sleepMax], {
    step: 0.25,
    label: "Schlafdauer",
    value: def.sleepTime,
  }),
  entity.children[1]
);
const sleepTimeValue = Generators.input(sleepTimeInput);
```

```js
const estimate = Inputs.range([0, 100], {
  label: "Schätzung in %",
  step: 1,
  value: 0,
  placeholder: "in %",
});
const estimateValue = Generators.input(estimate);
```

# Schlafdauer über die Lebensspanne

Hallo!
Wie lange schläfst du im Vergleich zu anderen? Wie alt sind Menschen, die so lange schlafen wie du? Und wie sieht es mit der Schlafdauer in der Gesamtbevölkerung so aus? Finde es mit unserer interaktiven Grafik heraus! Scrolle einfach nach unten - die Inhalte entfalten sich Schritt für Schritt, während du weiter scrollst.

<section class="scroll-container">
  <div class="scroll-info">${chartElement}</div>
  <div class="scroll-section card" data-step="1">Auf der Y-Achse links ist die Schlafdauer eingetragen, unten auf der X-Achse das Alter.</div>
  <div class="scroll-section card" data-step="2">Jeder winzige Punkt in der Wolke entspricht der Schlafdauer einer Person eines bestimmten Alters. Dazu haben Fachleute die Daten von über 150.000 Menschen aus verschiedenen Studien zusammengetragen. Je dichter die Wolke, desto mehr Menschen werden dort repräsentiert. Die Daten der Erwachsenen beruhen auf Selbsteinschätzungen, die der Kinder auf Angaben der Eltern. Studien zufolge unterliegt die Beurteilung der eigenen Schlafdauer oft Verzerrungen: Wer unter Schlafstörungen leidet, neigt dazu, die geschlafene Zeit zu unterschätzen. Gute Schläfer hingegen überschätzen sie häufig.</div>
  <div class="scroll-section card" data-step="3">Die Linien geben Perzentile an und zeigen, wie sich die Datenpunkte in der Stichprobe verteilen. Was das konkret heißt, siehst du im folgenden Bild:</div>
  <div class="scroll-section card" data-step="4">Karin ist 31 Jahre alt und liegt mit einer Schlafdauer von 7 Stunden im 50. Perzentil: Die eine Hälfte der 31-Jährigen schläft mehr, die andere weniger.</div>
   <div class="scroll-section card" data-step="5" id="user-input">
  Wie ist es bei dir? Gib hier dein Alter und deine übliche Schlafdauer (bspw. von letzter Nacht) ein, um dich in der Grafik verorten zu können! Wenn du weiter scrollst, kannst du dich mit anderen in deinem Alter vergleichen.
  ${ageInput}${sleepTimeInput}</div>
  <div class="scroll-section card" data-step="6">Die Figuren zeigen, wie lange Menschen in einem bestimmten Alter schlafen. Jede Figur steht für einen Anteil der Menschen in dieser Altersgruppe. Je höher oder tiefer eine Figur auf der Grafik ist, desto länger oder kürzer schlafen diese Menschen. Je mehr Figuren nebeneinanderstehen, desto mehr Menschen schlafen die Stundenanzahl, die links auf dieser Höhe angegeben ist.</div> 
    <div class="scroll-section card" data-step="7">Was würdest du schätzen, wie viel Prozent der Menschen in ${personalizationValue ? "deiner" : "dieser"} Altersgruppe schlafen kürzer als du?${estimate}${prediction}
      <div id="answer">Die richtige Antwort ist ${Math.round(getNearestPValue(dataSet, chartValue.age, chartValue.sleepTime) * 100)}% Versuche es gerne nochmal mit einem anderen Alter/Schlafdauer. Wenn du auf den Button klickst, scrollt die Seite wieder nach oben zur richtigen Stelle. Wenn du lieber fortfahren willst, scrolle wie gehabt weiter nach unten.${scrollTo}
      </div>
    </div>  
   <div class="scroll-section card" data-step="8">Jetzt kannst du die Grafik frei erkunden, indem du den Cursor in die Grafik bewegst.</div>
      <div class="scroll-section card" data-step="8">Jetzt kannst du die Grafik frei erkunden, indem du den Cursor in die Grafik bewegst.</div>

</section>

```js
console.log("dataSet", dataSet);
```

```js
/* const container = d3.select(element("div")); */
console.log("Codeblock executed");
const container = d3.create("div");
container.style("position", "relative");
container.style("background-color", `var(--theme-background)`);

const canvas = container.append("canvas").node();
const context = canvas.getContext("2d");

// Initialize the value of the container
container.node().value = {
  age: undefined,
  sleepTime: undefined,
  showRecommended: false,
  showPointcloud: true,
  showPercentiles: ["B", "C"],

  tooltipText: "",
  isExplorable: false,
  variant: "none",
};

canvas.width = w * canvasScaleFactor;
canvas.height = h * canvasScaleFactor;

canvas.style.width = `${w}px`;
canvas.style.height = `${h}px`;

const svg = container
  .append("svg")
  .attr("class", "svg")
  .attr("width", w)
  .attr("height", h)
  .style("position", "absolute")
  .style("top", "0px")
  .style("left", "0px");

const defs = svg.append("defs");

defs
  .append("symbol")
  .attr("id", "man-icon")
  .attr("viewBox", "0 -960 960 960")
  .append("path")
  .attr("d", icon)
  .attr("fill", "white");

const pointcloud = new Pointcloud(context, canvas);

// Create Axes
createXAxis(svg);
createYAxis(svg);

const crosshair = initializeCrosshair(svg);

// Setup the pointer interactions like pointerMoved and pointerClicked
new PointerInteraction(svg, container);

function update(data) {
  //console.log(data);

  // Update the pointcloud visibility
  pointcloud.setVisibility(container.node().value.showPointcloud);

  switch (container.node().value.variant) {
    case "percentile":
      updatePercentilePlot(data);
      break;
    case "dot":
      updateDotPlot(data, container.node().value);
      break;
    case "box":
      updateBoxPlot(data);
      break;
    case "none":
      exitPlot();
      break;
    default:
      console.error("Unknown plot type selected");
  }

  // Draw percentiles
  drawGroupedPercentileLines(svg, container);

  // Draw recommended Area
  drawRecommendedArea(svg, container);

  updateCrosshairs(container.node().value, crosshair);
}

container.node().update = update;
```

```js
const chartElement = container.node();
```

```js
const chartValue = Generators.input(chartElement);
```

```js
const cases = [
  { name: "Leo", age: 8.1, tib: 12 },
  { name: "Paula", age: 17.35, tib: 9 },
  { name: "Karin", age: 31.15, tib: 7 },
  { name: "Maria", age: 75, tib: 6 },
];
```

```js
function set(input, value) {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}
```

```js
const update = chartElement.update(dataSet.get(chartValue.age));
```

```js
const band = 1;
```

<!-- ---

### Crosshairs -->

```js
function initializeCrosshair(svg) {
  const x = Number(xScaleSVG(ageMin));
  const y = Number(yScaleSVG(sleepMax));

  const crosshair = svg.append("g").attr("class", "crosshair");

  const tooltip = crosshair
    .append("g")
    .attr("class", "tooltip")
    .style("display", "none");

  // Tooltip text
  const tooltipText = tooltip
    .append("text")
    .attr("class", "tooltip-text")
    .attr("x", 0) // Centered above the crosshair
    .attr("y", -20) // Positioned within the rectangle
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .attr("fill", "white")
    .style("font", `${fontSize} ${fontFamily}`)
    .text("Name"); // Default placeholder text

  const crosshairPoint = crosshair
    .append("circle")
    .attr("class", "crosshairPoint")
    .attr("cx", x)
    .attr("cy", y)
    .attr("r", "4px")
    .attr("fill", "white")
    .attr("opacity", 0);

  const crosshairXLabel = crosshair
    .append("text")
    .attr("class", "crosshairLabel")
    .attr("x", x)
    .attr("y", h - margin.bottom)
    .attr("dy", 9)
    .style("fill", "white")
    .style("stroke", "black")
    .style("stroke-width", "6")
    .style("paint-order", "stroke")
    .style("font", `${fontSize} ${fontFamily}`)
    .style("text-anchor", "start")
    .style("alignment-baseline", "hanging")
    .text(`${ageFormat(ageMin)} Jahre (Alter)`);

  const crosshairXLine = crosshair
    .append("line")
    .attr("class", "crosshairLine")
    .attr("x1", x)
    .attr("x2", x)
    .attr("y1", h - margin.bottom)
    .attr("y2", h - margin.bottom + 6)
    .style("stroke", "white")
    .style("stroke-width", lineWidths.regular);

  const crosshairYLabel = crosshair
    .append("text")
    .attr("class", "crosshairLabel")
    .attr("x", margin.left)
    .attr("y", y)
    .attr("dy", -4)
    .style("fill", "white")
    .style("stroke", "black")
    .style("stroke-width", "4")
    .style("paint-order", "stroke")
    .style("font", `${fontSize} ${fontFamily}`)
    .style("text-anchor", "start")
    .style("alignment-baseline", "baseline")
    .text(`${convertDecimalToTimeFormat(sleepMax)} Stunden (Schlafdauer)`);

  const crosshairYLine = crosshair
    .append("line")
    .attr("class", "crosshairLine")
    .attr("x1", margin.left)
    .attr("x2", w - margin.right)
    .attr("y1", y)
    .attr("y2", y)
    .style("stroke", "white")
    .attr("stroke-opacity", 1)
    .style("stroke-width", 1);

  return {
    crosshairPoint: crosshairPoint,
    crosshairXLine: crosshairXLine,
    crosshairXLabel: crosshairXLabel,
    crosshairYLine: crosshairYLine,
    crosshairYLabel: crosshairYLabel,
    tooltip: tooltip,
    tooltipText: tooltipText,
  };
}
```

```js
function updateCrosshairs(
  data,
  {
    crosshairPoint,
    crosshairXLine,
    crosshairXLabel,
    crosshairYLine,
    crosshairYLabel,
    tooltip,
    tooltipText,
  }
) {
  let x = Number(xScaleSVG(data.age));
  let y = Number(yScaleSVG(data.sleepTime));
  let textAge = data.age;
  let textSleep = data.sleepTime;
  let duration = 100;
  let tickOpacity = 0.4;
  let pointOpacity = 1;
  let intersect = data.age < 23;
  let labelXOffset = -6;

  console.log("tooltipText", data.tooltipText);

  // -------------------------
  // Tooltip visibility logic
  // -------------------------
  //
  // Show the tooltip only if "data.tooltipText" is defined.
  // Hide it otherwise.
  const tooltipIsVisible = data.tooltipText !== undefined;
  // If tooltip is visible, show the text from data.tooltipText
  if (tooltipIsVisible) {
    tooltipText.text(data.tooltipText);
  }

  // if cursor outside margins the crosshair get reset
  if (isNaN(x) || isNaN(y)) {
    x = Number(xScaleSVG(ageMin));
    y = Number(yScaleSVG(sleepMax));
    textAge = ageMin;
    textSleep = sleepMax;
    duration = 400;
    tickOpacity = 1;
    pointOpacity = 0;
    labelXOffset = 0;
  }

  // Transition the tooltip container
  tooltip
    .transition()
    .duration(duration)
    .style("display", tooltipIsVisible ? "block" : "none")
    .attr("transform", `translate(${x}, ${y})`);

  // Fade out the axis ticks if the crosshair is active
  d3.selectAll(".x-axis .tick")
    .transition()
    .duration(200)
    .attr("opacity", tickOpacity);

  d3.selectAll(".y-axis .tick text")
    .transition()
    .duration(200)
    .attr("opacity", tickOpacity);

  // Move the crosshair dot
  crosshairPoint
    .transition()
    .attr("cx", x)
    .attr("cy", y)
    .duration(duration)
    .attr("opacity", pointOpacity);

  // Move X label & line
  crosshairXLabel
    .transition()
    .duration(duration)
    .attr("x", x)
    .attr("dx", labelXOffset)
    .text(`${ageFormat(textAge)} Jahre (Alter)`);

  crosshairXLine.transition().duration(duration).attr("x1", x).attr("x2", x);

  // Move Y label & line
  crosshairYLabel
    .transition("dxTransitionLabel")
    .duration(200)
    .attr("x", intersect ? w - margin.right : margin.left);

  crosshairYLabel
    .transition("textanchorTransitionLabel")
    .duration(100)
    .delay(100)
    .style("text-anchor", intersect ? "end" : "start");

  crosshairYLabel
    .transition("xyTextTransitionLabel")
    .duration(duration)
    .attr("y", y)
    .text(`${convertDecimalToTimeFormat(textSleep)} Stunden (Schlafdauer)`);

  crosshairYLine.transition().duration(duration).attr("y1", y).attr("y2", y);
}
```

<!-- ---

### Pointer Functions -->

```js
class PointerInteraction {
  constructor(svg, container) {
    this.svg = svg;
    this.container = container;
    this.isPlotLocked = false;
    this.node = container.node();

    // Attach event listeners
    this.attachEventListeners();

    // Create a debounced logger
    this.debouncedLogger = createDebouncedLogger(logInteraction, 500); // 500ms delay
  }

  /**
   * Calculate the pointer's position and determine if it is within margins.
   * @param {Event} event - The pointer event.
   * @returns {Object} - An object with `x`, `y`, and `withinMargins`.
   */
  calculatePosition(event) {
    const [x, y] = d3.pointer(event);
    const withinMargins =
      x >= margin.left &&
      x <= w - margin.right &&
      y >= margin.top &&
      y <= h - margin.bottom;

    return { x, y, withinMargins };
  }

  /**
   * Map position to data values or reset if out of bounds.
   * @param {Object} position - The pointer position (x, y, withinMargins).
   * @returns {Object} - Updated interaction state.
   */
  calculateValue({ x, y, withinMargins }) {
    if (!withinMargins) {
      return {
        ...this.node.value,
        age: undefined,
        sleepTime: undefined,
      };
    }

    return {
      ...this.node.value,
      age: Math.round(xScaleSVG.invert(x)),
      sleepTime: roundToStep(yScaleSVG.invert(y), 0.25),
    };
  }

  /**
   * Update the cursor style based on the plot lock state.
   * @param {boolean} locked - Whether the plot is locked.
   */
  updateInteractionState(locked) {
    this.svg.style("cursor", locked ? "not-allowed" : "crosshair");
  }

  /**
   * Handle pointer movement and update interaction state.
   * @param {Event} event - The pointer move event.
   */
  pointerMoved(event) {
    if (
      !this.isValidEvent(event) ||
      this.isPlotLocked ||
      !this.node.value.isExplorable
    )
      return;

    const position = this.calculatePosition(event);
    const newValue = this.calculateValue(position);

    // Trigger an update only if the value changes
    if (!_.isEqual(this.node.value, newValue)) {
      this.node.value = newValue;
      this.node.dispatchEvent(new CustomEvent("input", { bubbles: true }));

      // Log the interaction with a debounce
      this.debouncedLogger(newValue);
    }
  }

  /**
   * Toggle the lock state of the plot on pointer click.
   */
  pointerClicked() {
    this.isPlotLocked = !this.isPlotLocked;
    this.updateInteractionState(this.isPlotLocked);
  }

  /**
   * Validate the event object.
   * @param {Event} event - The event to validate.
   * @returns {boolean} - Whether the event is valid.
   */
  isValidEvent(event) {
    return event !== null && typeof event === "object";
  }

  /**
   * Attach pointer event listeners to the SVG element.
   */
  attachEventListeners() {
    this.svg
      .on("pointerenter pointermove", this.pointerMoved.bind(this))
      .on("click", this.pointerClicked.bind(this))
      .on("touchstart", (event) => event.preventDefault()); // Prevent default touch behavior
  }
}
```

```js
function createDebouncedLogger(callback, delay) {
  let timer;
  return (data) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      callback(data);
    }, delay);
  };
}
```

```js
function logInteraction({ age, sleepTime }) {
  /* console.log(`Logging interaction: Age=${age}, SleepTime=${sleepTime}`); */
  window["optimizely"] = window["optimizely"] || [];
  window["optimizely"].push({
    type: "event",
    eventName: "kielscn_schlafdauer_sctn_8_input_changed",
    tags: {
      age_value: age,
      sleepTime_value: sleepTime,
    },
  });
}
```

<!-- ---

### Axes -->

```js
function createXAxis(svg) {
  // Append the x-axis group to the SVG and set its position based on height and margin
  const xAxis = svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${h - margin.bottom})`)
    .call(
      d3
        .axisBottom(xScaleSVG)
        .tickFormat(d3.format("02"))
        .tickValues(d3.range(ageMin, ageMax + 1, 5))
    )
    .call((g) => {
      // Styling specific ticks and lines
      g.selectAll(".tick text")
        .style("fill", "white")
        .style("font", `${fontSize} ${fontFamily}`);
      g.selectAll(".tick:first-of-type text").style("text-anchor", "start");
      g.selectAll(".tick line").attr("stroke", "white");
      g.select(".domain").attr("stroke", "white");
    });
}
```

```js
// Convert sleep time hours to JavaScript date objects
const startTime = new Date();
startTime.setHours(sleepMin, 0, 0, 0); // Set hours, minutes, seconds, milliseconds
```

```js
// Convert sleep time hours to JavaScript date objects
const endTime = new Date();
endTime.setHours(sleepMax, 0, 0, 0); // Set hours, minutes, seconds, milliseconds
```

```js
function createYAxis(svg) {
  // Append the y-axis group to the SVG and set its position based on margin
  const yAxis = svg
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(
      d3
        .axisRight(timeScale)
        .tickSize(w - margin.left - margin.right)
        .tickFormat(d3.timeFormat("%H:%M"))
    )
    .call((g) => {
      // Custom styling for ticks and lines
      g.selectAll(".tick text")
        .style("fill", "white")
        .style("font", `${fontSize} ${fontFamily}`)
        .style("stroke", "black")
        .style("stroke-width", "2")
        .style("paint-order", "stroke")
        .attr("x", 0)
        .attr("dy", -4);
      g.selectAll(".tick line").attr("stroke", "white");
      g.selectAll(".tick:not(:first-of-type) line")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-dasharray", "2,2");
      g.selectAll(".tick:first-of-type").remove(); // Removes the first tick if necessary
      g.select(".domain").remove(); // Removes the axis line
    });
}
```

```js
function formatTickX(d) {
  // Check if the previous element sibling of the parent node is a 'path', which would mean this is the first tick
  return this.parentNode.previousElementSibling &&
    this.parentNode.previousElementSibling.tagName === "path"
    ? `${d} Jahre (Alter)`
    : `${d}`;
}
```

```js
function formatTickY(d) {
  // Check if the previous element sibling of the parent node is a 'path', which would mean this is the first tick
  return this.parentNode.nextSibling ? `${d}` : `${d} Stunden (Schlafdauer)`;
}
```

<!-- ---

### Helper Functions -->

```js
function transitionPlot(selection, data) {
  selection
    .transition("transform")
    .duration(100)
    .ease(d3.easeCubic)
    .attr("transform", `translate(${xScaleSVG(data.ageRange.start)}, 0)`);
}
```

```js
function updatePlot({
  data,
  plotClass,
  plotDataKey,
  enterFn,
  updateFn,
  preprocessFn = () => ({}),
  filterFn = (data) => data,
  useElements = true, // New parameter to switch between the two methods
}) {
  const svg = d3.select(".svg");

  // Check if data is undefined, empty
  if (!data || !data[plotDataKey] || data[plotDataKey].length === 0) {
    svg
      .selectAll(`.${plotClass}`)
      .transition("opacity")
      .duration(200)
      .style("opacity", 0)
      .remove();
    return;
  }

  // Apply the filter function
  const filteredData = filterFn(data[plotDataKey]);

  // Run preprocessing function and get preprocessed data
  const preprocessData = preprocessFn(filteredData);

  // Bind data, considering whether it's an array or a single object
  let plot = svg.selectAll(`.${plotClass}`).data([filteredData], () => 1);
  let plotEnter;
  if (useElements) {
    // For dot and percentile plots
    plotEnter = plot
      .enter()
      .append("g")
      .attr("class", plotClass)
      .attr("transform", `translate(${xScaleSVG(data.ageRange.start)}, 0)`)
      .style("opacity", 0);

    plotEnter.transition("opacity").duration(200).style("opacity", 1);

    plot = plot.merge(plotEnter);

    plot.call(transitionPlot, data);

    plot
      .selectAll(`.${plotClass}-element`)
      .data(
        (d) => d || [],
        (d) => d.p
      )
      .join(
        (enter) => enterFn(enter, preprocessData),
        (update) => updateFn(update, preprocessData),
        (exit) => exit.remove()
      );
  } else {
    // For box plots
    // Apply transitions to the box plot based on data.
    transitionPlot(plot, data);
    plot.join(
      (enter) => enterFn(enter, { ageRange: data.ageRange }),
      (update) => updateFn(update, { ageRange: data.ageRange }),
      (exit) => exit.remove()
    );
  }
}
```

```js
/**
 * Exits any currently visible plot by fading it out and removing it from the DOM.
 * The function targets plots with classes 'dot', 'box', and 'percentile'.
 */
function exitPlot() {
  const svg = d3.select(".svg");

  // Define the possible plot classes
  const plotClasses = ["dot-plot", "box-plot", "percentile-plot"];

  // Select all plots with the specified classes and apply the exit transition
  svg
    .selectAll(plotClasses.map((cls) => `.${cls}`).join(", "))
    .transition("opacity")
    .duration(200)
    .style("opacity", 0)
    .remove();
}
```

```js
function roundToStep(value, step) {
  return Math.round(value / step) * step;
}
```

```js
const timeFormat = d3.timeFormat("%H:%M");
```

```js
const ageFormat = d3.format("02");
```

```js
function convertDecimalToTimeFormat(decimalHour) {
  const hours = Math.floor(decimalHour); // Get the whole number part for hours
  const minutes = Math.round((decimalHour - hours) * 60); // Convert the decimal part to minutes

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return timeFormat(date); // Format the date to HH:MM
}
```

<!-- ---

### Box Plot -->

```js
const updateBox = (update) => {
  update
    .select(".range")
    .transition()
    .duration(400)
    .attr(
      "d",
      (d) => `M0,${yScaleBoxPlot(d.range[1])} V${yScaleBoxPlot(d.range[0])}`
    );

  update
    .select(".quartiles")
    .transition()
    .duration(400)
    .attr(
      "d",
      (d) => `
          M${-10},${yScaleBoxPlot(d.quartiles[2])}
          H${10}
          V${yScaleBoxPlot(d.quartiles[0])}
          H${-10}
          Z
        `
    );

  update
    .select(".median")
    .transition()
    .duration(400)
    .attr("d", (d) => `M${-10},${yScaleBoxPlot(d.quartiles[1])} H${10}`);

  return update;
};
```

```js
const enterBox = (enter, { ageRange }) => {
  let boxEnter = enter
    .append("g")
    .attr("class", "box")
    .attr("transform", `translate(${xScaleSVG(ageRange.start)}, 0)`)
    .attr("opacity", 0);

  boxEnter
    .append("path")
    .attr("class", "range")
    .attr("stroke", "white")
    .attr("stroke-width", lineWidths.regular);

  boxEnter
    .append("path")
    .attr("class", "quartiles")
    .attr("stroke", "white")
    .attr("stroke-width", lineWidths.regular);

  boxEnter
    .append("path")
    .attr("class", "median")
    .attr("stroke", "white")
    .attr("stroke-width", lineWidths.regular);

  boxEnter.transition().duration(400).attr("opacity", 1);

  return boxEnter;
};
```

```js
function updateBoxPlot(data) {
  const enterBoxPlot = (enter, { ageRange }) => enterBox(enter, { ageRange });
  const updateBoxPlot = (update) => updateBox(update);

  updatePlot({
    data: data,
    plotClass: "box",
    plotDataKey: "boxPlotData",
    enterFn: enterBoxPlot,
    updateFn: updateBoxPlot,
    useElements: false,
  });
}
```

<!-- ---

### Dot Plot -->

```js
function precalculateHeights(data) {
  const totalHeightMap = new Map();
  data.forEach((dot) => {
    const x = dot.x;
    const count = totalHeightMap.get(x) || 0;
    totalHeightMap.set(x, count + 2 * qradius);
  });
  return totalHeightMap;
}
```

```js
function getStackOffset(x, radius, stackMap) {
  let currentHeight = stackMap.get(x) || 0;
  stackMap.set(x, currentHeight + 2 * radius);
  return currentHeight;
}
```

```js
function calculateCX(d, stackMap, totalHeightMap) {
  const offset = getStackOffset(d.x, qradius, stackMap);
  const totalHeight = totalHeightMap.get(d.x);
  return totalHeight / 2 - offset - qradius;
}
```

```js
function enterDot(enter, values, stackMap, totalHeightMap) {
  return enter
    .append("use")
    .attr("href", "#man-icon")
    .attr("class", "dot-plot-element")
    .attr("x", (d) => calculateCX(d, stackMap, totalHeightMap) - 12)
    .attr("y", (d) => yScaleDotPlot(d.x) - 12) // offset of half the height
    .attr("width", 24)
    .attr("height", 24)
    .attr("fill-opacity", (d) => (d.q <= values.sleepTime ? "1" : "0"))
    .style("stroke", "white")
    .style("stroke-width", 32);
}
```

```js
function updateDot(update, values, stackMap, totalHeightMap) {
  return update
    .transition()
    .delay(100)
    .duration(400)
    .ease(d3.easeCubic)
    .attr("fill-opacity", (d) => (d.q <= values.sleepTime ? "1" : "0"))
    .attr("x", (d) => calculateCX(d, stackMap, totalHeightMap) - 12)
    .attr("y", (d) => yScaleDotPlot(d.x) - 12); // offset of half the height
}
```

```js
function updateDotPlot(data, values) {
  const preprocessDotPlot = (plotData) => {
    return {
      stackMap: new Map(),
      totalHeightMap: precalculateHeights(plotData),
    };
  };

  const enterDotPlot = (enter, { stackMap, totalHeightMap }) =>
    enterDot(enter, values, stackMap, totalHeightMap);
  const updateDotPlot = (update, { stackMap, totalHeightMap }) =>
    updateDot(update, values, stackMap, totalHeightMap);

  updatePlot({
    data: data,
    plotClass: "dot-plot",
    plotDataKey: "dotPlotData",
    enterFn: enterDotPlot,
    updateFn: updateDotPlot,
    preprocessFn: preprocessDotPlot,
  });
}
```

<!-- ---

### Percentile Plot -->

```js
function enterPercentile(enter) {
  return enter
    .append("text")
    .attr("class", "percentile-plot-element")
    .attr("y", (d) => yScaleSVG(d.q))
    .text((d) => `${Math.round(d.p * 100)}%`) // Improved percentage display
    .style("fill", "white")
    .style("font", "10px Roboto")
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle");
}
```

```js
function updatePercentile(update) {
  return update
    .transition()
    .duration(100)
    .ease(d3.easeCubic)
    .attr("y", (d) => yScaleSVG(d.q));
}
```

```js
function updatePercentilePlot(data) {
  const filterPercentilePlot = (plotData) => {
    return plotData.filter((item) => percentileSelection.includes(item.p));
  };

  const enterPercentilePlot = (enter) => enterPercentile(enter); // Assuming enterDot doesn't require additional data
  const updatePercentilePlot = (update) => updatePercentile(update); // Assuming updateDot doesn't require additional data

  updatePlot({
    data: data,
    plotClass: "percentile-plot",
    plotDataKey: "percentilePlotData",
    enterFn: enterPercentilePlot,
    updateFn: updatePercentilePlot,
    filterFn: filterPercentilePlot,
  });
}
```

<!-- ---

### Settings -->

```js
const lineWidths = {
  thin: 0.5,
  regular: 1,
  medium: 1.5,
  thick: 2,
};
```

```js
const colors = {
  background: "black",
  grid: "white",
  recommended: "#2e807d",
  acceptable: "#3d1438",
  text: "white",
  strokeOutline: "black",
};
```

<!-- ---

### Setup

---

### Scales -->

```js
const xScaleSVG = d3
  .scaleLinear()
  .domain([ageMin, ageMax]) // Data space
  .rangeRound([margin.left, w - margin.right]) // Pixel space
  .clamp(true);
```

```js
const yScaleSVG = d3
  .scaleLinear()
  .domain([sleepMin, sleepMax]) // Data space
  .rangeRound([h - margin.bottom, margin.top]) // Pixel space, inverted because canvas y=0 is at the top
  .clamp(true);
```

```js
const timeScale = d3
  .scaleTime()
  .domain([startTime, endTime])
  .range([h - margin.bottom, margin.top])
  .clamp(true);
```

```js
const xScaleDotPlot = d3
  .scaleLinear()
  .domain([0, qymax])
  .range([0, qymax * qradius * 2]);
```

```js
const yScaleDotPlot = d3
  .scaleLinear()
  .domain([sleepMin, sleepMax])
  .range([h - margin.bottom, margin.top]);
```

```js
const xScaleBoxPlot = d3
  .scaleLinear()
  .domain([ageMin, ageMax])
  .rangeRound([margin.left, w - margin.right]);
```

```js
const yScaleBoxPlot = d3
  .scaleLinear()
  .domain([sleepMin, sleepMax])
  .range([h - margin.bottom, margin.top]);
```

```js
const rangeSteps = d3.range(4, 13.5, 0.5); // Creates an array from 4 to 13 with steps of 0.5
```

```js
const rangeValues = d3.range(
  h - margin.bottom,
  margin.top,
  ((margin.top - (h - margin.bottom)) / rangeSteps.length) * -1
);
```

```js
d3.range(
  h - margin.bottom,
  margin.top,
  ((margin.top - (h - margin.bottom)) / rangeSteps.length) * -1
);
```

```js
const yScaleCrosshair = d3
  .scaleThreshold()
  .domain(rangeSteps) // Data space
  .range(d3.range(h - margin.bottom, margin.top, -1)); // Assuming equal step in pixel space // Assuming equal step in pixel space
```

```js
const yScaleCrosshair1 = d3
  .scaleQuantize()
  .domain([h - margin.bottom, margin.top])
  .range(thresholdsSleep);
```

```js
const yScaleQuantize = d3
  .scaleQuantize()
  .domain(d3.range(h - margin.bottom, margin.top, -1))
  .range([4, 13]); // Assuming equal step in pixel space
```

<!-- ---

### Quantile Dot Plots -->

```js
const qwidth = h - margin.top - margin.bottom;
```

```js
// find the maximum amount of stacked dots
const qymax = Math.max(
  ...data.map((obj) =>
    Math.max(
      ...d3
        .rollup(
          obj.dotPlotData,
          (v) => v.length, // Count the entries
          (d) => d.x // Group by the x value
        )
        .values()
    )
  )
);
```

```js
const qradius = (0.5 * qwidth * qstep) / (qdomain[1] - qdomain[0]);
```

<!-- ---

### Percentile Lines Plot -->

```js
function drawGroupedPercentileLines(svg, container) {
  const percentiles = container.node().value.showPercentiles;

  // Create or select a group for all percentile lines
  let allPercentilesGroup = svg.select(".all-percentiles");

  if (allPercentilesGroup.empty()) {
    allPercentilesGroup = svg.append("g").attr("class", "all-percentiles");
  }

  // Filter the data based on the percentiles array
  const visiblePercentiles = groupedByPercentile.filter((value) => {
    const percentileKey = value[0]; // The percentile key (5, 6, 7, etc.)
    return (
      (mostProminent.includes(percentileKey) && percentiles.includes("A")) ||
      (lessProminent.includes(percentileKey) &&
        percentileKey % 5 === 0 &&
        percentiles.includes("B")) ||
      percentiles.includes("C")
    );
  });

  // Bind data to the percentile group
  const percentileGroups = allPercentilesGroup
    .selectAll(".percentile-group")
    .data(visiblePercentiles, (d) => d[0]); // Use the first item in the array as the key

  // Use join to handle enter, update, and exit
  percentileGroups.join(
    (enter) => {
      const group = enter
        .append("g")
        .attr("class", "percentile-group")
        .style("opacity", 0); // Start with 0 opacity for fade-in

      // Draw lines with the provided styles
      group.each(function (d) {
        const percentileKey = d[0]; // The percentile key (5, 6, 7, etc.)
        const percentileData = d[1]; // The array of percentile data objects (age, tst, etc.)

        if (
          mostProminent.includes(percentileKey) &&
          percentiles.includes("A")
        ) {
          drawPercentileLines(
            d3.select(this),
            percentileData,
            0.4,
            lineWidths.regular,
            colors.text
          );
        } else if (
          lessProminent.includes(percentileKey) &&
          percentileKey % 5 === 0 &&
          percentiles.includes("B")
        ) {
          drawPercentileLines(
            d3.select(this),
            percentileData,
            0.4,
            lineWidths.thin,
            colors.text
          );
        } else if (percentiles.includes("C")) {
          drawPercentileLines(
            d3.select(this),
            percentileData,
            0.2,
            lineWidths.regular,
            colors.text
          );
        }
      });

      group
        .transition()
        .duration(600)
        .ease(d3.easeCubicInOut)
        .style("opacity", 1); // Fade in
    },

    // Update: Keep elements that are still present
    (update) => update,

    // Exit: Fade out and remove lines when percentiles are no longer visible
    (exit) =>
      exit
        .transition()
        .duration(600)
        .ease(d3.easeCubicInOut)
        .style("opacity", 0)
        .remove() // Remove after transition
  );
}
```

```js
function drawPercentileLines(
  selection,
  data,
  opacity,
  strokeWidth,
  strokeColor
) {
  selection
    .append("path")
    .datum(data) // Bind the data to the path
    .attr("fill", "none")
    .attr("stroke", strokeColor)
    .attr("stroke-width", strokeWidth)
    .attr("stroke-opacity", opacity)
    .attr("d", lineGenerator); // Use the line generator to set the "d" attribute
}
```

```js
const lineGenerator = d3
  .line()
  .curve(d3.curveNatural)
  .x((d) => xScaleSVG(d.age))
  .y((d) => yScaleSVG(d.tst));
```

<!-- ---

### Recommended Area -->

```js
function drawRecommendedArea(svg, container) {
  const recommendedData = container.node().value.showRecommended
    ? [sleepData]
    : [];

  const group = svg.selectAll(".recommended-group").data(recommendedData);

  group.join(
    // Enter: Draw the area and lines when recommendedData has content
    (enter) => {
      const g = enter
        .append("g") // Append a group for the recommended area
        .attr("class", "recommended-group")
        .style("opacity", 0) // Start invisible
        .call((g) =>
          g
            .transition() // Apply fade-in transition
            .duration(600)
            .ease(d3.easeCubicInOut)
            .style("opacity", 1)
        );

      g.append("path")
        .attr("fill", colors.recommended)
        .attr("fill-opacity", 0.2)
        .attr("d", areaGenerator);

      const lowerLine = areaGenerator.lineY0();
      const upperLine = areaGenerator.lineY1();

      g.append("path")
        .attr("d", lowerLine)
        .attr("stroke", colors.recommended)
        .attr("stroke-width", lineWidths.medium)
        .attr("fill", "none");

      g.append("path")
        .attr("d", upperLine)
        .attr("stroke", colors.recommended)
        .attr("stroke-width", lineWidths.medium)
        .attr("fill", "none");
    },

    // Update: Keep the group in place if it remains the same
    (update) => update,

    // Exit: Remove the area and lines when recommendedData is empty
    (exit) =>
      exit
        .transition() // Apply fade-out transition
        .duration(600)
        .ease(d3.easeCubicInOut)
        .style("opacity", 0)
        .remove()
  );
}
```

```js
const areaGenerator = d3
  .area()
  .x((d) => xScaleSVG(d.age))
  .y0((d) => yScaleSVG(d.recommended[0]))
  .y1((d) => yScaleSVG(d.recommended[1]))
  .curve(d3.curveStepAfter);
```

```js
// Process sleep data in an observable notebook cell
const sleepData = sleepGuidelines
  .flatMap((group) => {
    const [startAge, endAge] = group.ageRange.split("–").map(Number);

    return [
      ...(startAge < ageMin && endAge >= ageMin
        ? [{ age: ageMin, ...group }]
        : []),
      ...(startAge >= ageMin ? [{ age: startAge, ...group }] : []),
      ...(endAge > ageMin && endAge <= ageMax
        ? [{ age: endAge, ...group }]
        : []),
    ];
  })
  .concat(
    sleepGuidelines.at(-1).ageRange.split("–")[1] > ageMax
      ? [
          {
            age: ageMax,
            ...sleepGuidelines.at(-1),
          },
        ]
      : []
  );
```

```js
const sleepGuidelines = [
  { ageRange: "1–2", recommended: [11, 14], acceptable: [9, 16] },
  { ageRange: "3–5", recommended: [10, 13], acceptable: [8, 14] },
  { ageRange: "6–13", recommended: [9, 11], acceptable: [7, 12] },
  { ageRange: "14–17", recommended: [8, 10], acceptable: [7, 11] },
  { ageRange: "18–25", recommended: [7, 9], acceptable: [6, 11] },
  { ageRange: "26–40", recommended: [7, 9], acceptable: [6, 10] },
  { ageRange: "41–65", recommended: [7, 9], acceptable: [6, 10] },
  { ageRange: "66–98", recommended: [7, 8], acceptable: [5, 9] },
];
```

<!-- ---

### Point Cloud -->

```js
class Pointcloud {
  constructor(context, canvas) {
    if (
      !context ||
      !canvas ||
      !simulatedData ||
      !xScaleSVG ||
      !yScaleSVG ||
      !colors ||
      typeof ageMin === "undefined" ||
      typeof ageMax === "undefined" ||
      typeof canvasScaleFactor === "undefined"
    ) {
      throw new Error("Missing required parameters");
    }

    this.context = context;
    this.simulatedData = simulatedData;
    this.xScale = xScaleSVG;
    this.yScale = yScaleSVG;
    this.canvas = canvas;
    this.colors = colors;
    this.alpha = 0; // Initial transparency
    this.alphaMax = 0.3;
    this.visible = false;
    this.fadeDuration = 600;
  }

  // Draw points on the canvas with the specified alpha transparency
  draw(alpha) {
    this.context.fillStyle = this.colors.background;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillStyle = this.colors.text;
    this.context.globalAlpha = alpha;

    this.simulatedData
      .filter((d) => d.age >= ageMin && d.age <= ageMax)
      .forEach((point) => {
        this.context.beginPath();
        this.context.arc(
          this.xScale(point.age) * canvasScaleFactor,
          this.yScale(point.sleepTime) * canvasScaleFactor,
          0.5,
          0,
          2 * Math.PI
        );
        this.context.fill();
      });

    this.context.globalAlpha = 1; // Reset alpha to default
  }

  // Fade in the points by gradually increasing the alpha value
  fadeIn() {
    const startTime = performance.now();
    const fade = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / this.fadeDuration, this.alphaMax);
      this.alpha = progress;
      this.draw(this.alpha);
      if (progress < this.alphaMax) {
        requestAnimationFrame(fade);
      }
    };
    requestAnimationFrame(fade);
    this.visible = true;
  }

  // Fade out the points by gradually decreasing the alpha value
  fadeOut() {
    const startTime = performance.now();
    const fade = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / this.fadeDuration, this.alphaMax);
      this.alpha = this.alphaMax - progress;
      this.draw(this.alpha);
      if (progress < this.alphaMax) {
        requestAnimationFrame(fade);
      } else {
        this.context.fillStyle = this.colors.background;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
    };
    requestAnimationFrame(fade);
    this.visible = false;
  }

  // Set the visibility of the points and trigger the appropriate fade method
  setVisibility(visible) {
    if (visible && !this.visible) {
      this.fadeIn();
    } else if (!visible && this.visible) {
      this.fadeOut();
    }
  }
}
```

<!-- ---

### Cases -->

```js
function drawCases(svg) {
  const casesGroup = svg.append("g").attr("id", "casesGroup");
  casesGroup
    .selectAll("circle")
    .data(cases) // Bind data for each case
    .join("circle") // Create a circle for each case
    .attr("cx", (d) => xScaleSVG(d.age)) // Set the x-coordinate based on the age
    .attr("cy", (d) => yScaleSVG(d.tib)) // Set the y-coordinate based on the tib
    .attr("r", 2.5) // Radius of the circle
    .attr("fill", colors.text); // Fill color of the circles
}
```

<!-- ---

### data -->

```js
const ageGroups = [
  { ageRange: "5–10", name: "bis 10 Jahre" },
  { ageRange: "11–17", name: "11–17 Jahre" },
  { ageRange: "18–65", name: "18–65 Jahre" },
  { ageRange: "66–95", name: "über 66 Jahre" },
];
```

```js
const groupedByPercentile = d3.groups(flattenedData, (d) => d.percentile);
```

```js
const flattenedData = data.flatMap((d) =>
  d.percentilePlotData.map((p) => ({
    age: d.ageRange.start,
    percentile: Math.round(p.p * 100),
    tst: p.q,
  }))
);
```

<style>
@import url('https://fonts.googleapis.com/css2?family=Roboto&display=swap');
</style>

```js
const targetSection = document.querySelector(
  '.scroll-section.card[data-step="5"]'
);
```

```js
const lastSection = document.querySelector(
  '.scroll-section.card[data-step="8"]'
);
```

```js
const info = document.querySelector(".scroll-info");
const targets = document.querySelectorAll(".scroll-section");

const observerCallback = (entries, observer) => {
  entries.forEach((entry) => {
    const visibleSection = entry.target;
    const step = visibleSection.dataset.step;

    if (entry.isIntersecting) {
      // Section is visible
      visibleSection.classList.remove("inactive");
      /* console.log(`Section ${step} is now visible.`); */

      // Fetch the latest values without making the cell reactive
      const currentAgeValue = ageInput.value;
      const currentSleepTimeValue = sleepTimeInput.value;

      // Get the steps object
      const steps = getSteps(currentAgeValue, currentSleepTimeValue);

      window["optimizely"] = window["optimizely"] || [];
      window["optimizely"].push({
        type: "event",
        eventName: "kielscn_schlafdauer_sctn_visible",
        tags: {
          section: step,
          age_value: steps[step].age,
          sleepTime_value: steps[step].sleepTime,
        },
      });

      // Update the chartElement with the current step
      set(chartElement, steps[step]);

      // reseting the prediction visibility
      const target = document.getElementById("answer");
      target.style.display = "none";
      setDisabled(false);
      set(estimate, 0);

      // Additional behavior for the last section (step 8)
      if (step === "8") {
        info.classList.add("interactive");
        /* console.log("Enabled interactive graphic for the last section."); */
      }
    } else {
      // Section is not visible
      visibleSection.classList.add("inactive");

      // Remove interaction if the last section is no longer visible
      if (step === "8") {
        info.classList.remove("interactive");
        /* console.log(
          "Disabled interactive graphic as the last section is no longer visible."
        ); */
      }
    }
  });
};

const observerOptions = {
  root: null, // Use the viewport as the root
  rootMargin: `0% 0% -${100 - relativeHeight * 100}% 0%`, // Adjust as needed
  /* threshold: 0.5, */ // Trigger when 50% of the section is visible
};

const observer = new IntersectionObserver(observerCallback, observerOptions);

targets.forEach((target) => {
  observer.observe(target);
});

invalidation.then(() => observer.disconnect());
```

<!-- ```js
predictionValue; // run this block when the button is clicked
const target = document.getElementById("answer");
target.style.display = "block";

console.log("code run");

window["optimizely"] = window["optimizely"] || [];
window["optimizely"].push({
  type: "event",
  eventName: "kielscn_schlafdauer_sctn_7_input_changed",
  tags: {
    estimate_value: document.querySelector(
      '.scroll-section.card[data-step="7"] input[type=number]'
    ).value,
  },
});
``` -->

```js
const buttonClicked = (value) => {
  setDisabled(true);
  const target = document.getElementById("answer");
  target.style.display = "block";

  window["optimizely"] = window["optimizely"] || [];
  window["optimizely"].push({
    type: "event",
    eventName: "kielscn_schlafdauer_sctn_7_input_changed",
    tags: {
      estimate_value: document.querySelector(
        '.scroll-section.card[data-step="7"] input[type=number]'
      ).value,
    },
  });
  return value + 1;
};
```

```js
function getSteps(age, sleepTime) {
  return {
    0: {
      age: undefined,
      sleepTime: undefined,
      showRecommended: false,
      showPointcloud: false,
      showPercentiles: [],

      tooltipText: undefined,
      isExplorable: false,
      variant: "none",
    },
    1: {
      age: undefined,
      sleepTime: undefined,
      showRecommended: false,
      showPointcloud: false,
      showPercentiles: [],

      tooltipText: undefined,
      isExplorable: false,
      variant: "none",
    },
    2: {
      age: undefined,
      sleepTime: undefined,
      showRecommended: false,
      showPointcloud: true,
      showPercentiles: [],

      tooltipText: undefined,
      isExplorable: false,
      variant: "none",
    },
    3: {
      age: undefined,
      sleepTime: undefined,
      showRecommended: false,
      showPointcloud: true,
      showPercentiles: ["C"],

      tooltipText: undefined,
      isExplorable: false,
      variant: "none",
    },
    4: {
      age: 31,
      sleepTime: 7,
      showRecommended: false,
      showPointcloud: true,
      showPercentiles: ["C"],
      tooltipText: "Karin",
      isExplorable: false,
      variant: "none",
    },
    5: {
      age: age,
      sleepTime: sleepTime,
      showRecommended: false,
      showPointcloud: true,
      showPercentiles: ["C"],

      tooltipText: "Du",
      isExplorable: false,
      variant: "none",
    },
    6: {
      age: age,
      sleepTime: sleepTime,
      showRecommended: false,
      showPointcloud: true,
      showPercentiles: ["C"],

      tooltipText: undefined,
      isExplorable: false,
      variant: "dot",
    },
    7: {
      age: age,
      sleepTime: sleepTime,
      showRecommended: false,
      showPointcloud: true,
      showPercentiles: ["C"],

      tooltipText: undefined,
      isExplorable: false,
      variant: "dot",
    },
    8: {
      age: age,
      sleepTime: sleepTime,
      showRecommended: false,
      showPointcloud: true,
      showPercentiles: ["C"],

      tooltipText: undefined,
      isExplorable: true,
      variant: "dot",
    },
  };
}
```
