---
theme: [midnight, alt]
---

<style>
@import url('https://fonts.googleapis.com/css2?family=Roboto&display=swap');

.scroll-container {
  margin: 1rem auto;
}

.scroll-info {
  position: sticky;
  top: 0;
  margin: 0 auto;
  background-color: var(--theme-background-alt);
}

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
import {
  getNearestPValue,
  getURLParameter,
  ageFormat,
  timeFormat,
  createDebouncedLogger,
  logInteraction,
} from "./components/helperFunctions.js";
import { dataArray, dataSet, simulatedData } from "./components/data.js";
import { settings } from "./components/settings.js";
import { createScales } from "./components/createScales.js";
import { element } from "./components/element.js";
import {
  initializeCrosshair,
  updateCrosshairs,
} from "./components/crosshair.js";
import { PointerInteraction } from "./components/pointerInteraction.js";
import { createXAxis, createYAxis } from "./components/axes.js";
import { Pointcloud } from "./components/pointcloud.js";
import { drawGroupedPercentileLines } from "./components/percentileLines.js";
import { drawRecommendedArea } from "./components/recommendedArea.js";
import { updatePlot, exitPlot } from "./components/plot.js";
import { updateDotPlot } from "./components/plotDot.js";
import { updatePercentilePlot } from "./components/plotPercentile.js";
import { updateBoxPlot } from "./components/plotBox.js";
import { setupIntersectionObserver } from "./components/intersectionObserver.js";
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
  startTime,
  endTime,
  margin,
  qstep,
  qdomain,
  qradius,
  canvasScaleFactor,
  percentileSelection,
  mostProminent,
  lessProminent,
  fontFamily,
  fontSize,
  lineWidths,
  icon,
  colors,
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
setupIntersectionObserver({
  targets,
  info,
  getSteps,
  set,
  chartElement,
  setDisabled,
  ageInput,
  sleepTimeInput,
  estimate,
  relativeHeight,
  invalidation,
});
```

```js
const { xScaleSVG, yScaleSVG, timeScale, yScaleDotPlot, yScaleBoxPlot } =
  createScales({ w, h });
```

```js
const recommended = Mutable(false);
const setTrue = () => (recommended.value = true);
const setFalse = () => (recommended.value = false);
```

```js
const variant = getURLParameter("v") || "dot";
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
    tooltipText: Inputs.text({ label: "Tooltip text", value: undefined }),
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
/* const container = d3.select(element("div")); */
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
  tooltipText: undefined,
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

const pointcloud = new Pointcloud(context, canvas, {
  simulatedData,
  xScale: xScaleSVG,
  yScale: yScaleSVG,
});

// Create Axes
createXAxis(svg, xScaleSVG, h);
createYAxis(svg, timeScale, w);

const crosshair = initializeCrosshair(svg, xScaleSVG, yScaleSVG, w, h, margin);

// Setup the pointer interactions like pointerMoved and pointerClicked
new PointerInteraction(svg, container, {
  margin,
  w,
  h,
  xScaleSVG,
  yScaleSVG,
});

function update(data) {
  // Update the pointcloud visibility
  pointcloud.setVisibility(container.node().value.showPointcloud);

  switch (container.node().value.variant) {
    case "percentile":
      updatePercentilePlot(data, xScaleSVG, yScaleSVG);
      break;
    case "dot":
      updateDotPlot(data, container.node().value, xScaleSVG, yScaleDotPlot);
      break;
    case "box":
      updateBoxPlot(data, xScaleSVG, yScaleBoxPlot);
      break;
    case "none":
      exitPlot();
      break;
    default:
      console.error("Unknown plot type selected");
  }

  // Draw percentiles
  drawGroupedPercentileLines(svg, container, {
    dataArray,
    xScaleSVG,
    yScaleSVG,
  });

  // Draw recommended Area
  drawRecommendedArea(svg, container, {
    xScaleSVG,
    yScaleSVG,
  });

  updateCrosshairs(container.node().value, crosshair, xScaleSVG, yScaleSVG, w);
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
function set(input, value) {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}
```

```js
const update = chartElement.update(dataSet.get(chartValue.age));
```

<!-- --- ### Observer -->

```js
const info = document.querySelector(".scroll-info");
const targets = document.querySelectorAll(".scroll-section");
```

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
      variant: variant,
    },
    7: {
      age: age,
      sleepTime: sleepTime,
      showRecommended: false,
      showPointcloud: true,
      showPercentiles: ["C"],
      tooltipText: undefined,
      isExplorable: false,
      variant: variant,
    },
    8: {
      age: age,
      sleepTime: sleepTime,
      showRecommended: false,
      showPointcloud: true,
      showPercentiles: ["C"],
      tooltipText: undefined,
      isExplorable: true,
      variant: variant,
    },
  };
}
```
