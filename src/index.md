---
theme: [midnight, alt]
---

```js
import {
  getTrueValue,
  getURLParameter,
  calculateMargins,
} from "./components/helperFunctions.js";
import { dataSet, simulatedData } from "./components/data.js";
import { settings } from "./components/settings.js";
import { createScales } from "./components/createScales.js";
import {
  initializeCrosshair,
  updateCrosshairs,
} from "./components/crosshair.js";
import { PointerInteraction } from "./components/pointerInteraction.js";
import { createAxes } from "./components/createAxes.js";
import { Pointcloud } from "./components/pointcloud.js";
import { drawGroupedPercentileLines } from "./components/percentileLines.js";
import { drawRecommendedArea } from "./components/recommendedArea.js";
import { updatePlot, exitPlot } from "./components/plot.js";
import { updateDotPlot } from "./components/plotDot.js";
import { updatePercentilePlot } from "./components/plotPercentile.js";
import { updateBoxPlot } from "./components/plotBox.js";
import { updateHOPPlot, animateHOP } from "./components/plotHOP.js";
import {
  setupIntersectionObserver,
  getSteps,
} from "./components/intersectionObserver.js";
import { initializeLogger, logEstimateClick } from "./components/logger.js";
```

```js
const {
  ageMin,
  ageMax,
  sleepMin,
  sleepMax,
  margin,
  canvasScaleFactor,
  icon,
  relativeHeight,
  qstep,
  hopCount,
  hopDuration,
} = settings;
```

<!-- ```js
console.log("dataSet", dataSet);
``` -->

```js
const w = width;
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
const qdomain = [sleepMin, sleepMax];
const qwidth = h - margin.top - margin.bottom;
const qradius = (0.5 * qwidth * qstep) / (qdomain[1] - qdomain[0]);
const sideMargins = calculateMargins(dataSet, qradius);
```

```js
setupIntersectionObserver({
  dataSet,
  targets,
  info,
  getSteps: (age, sleepTime) => getSteps(age, sleepTime, variant),
  chartElement,
  setDisabled,
  ageInput,
  sleepTimeInput,
  estimateInput,
  relativeHeight,
});
```

```js
initializeLogger();
```

```js
const { xScaleSVG, yScaleSVG, timeScale } = createScales({ w, h, sideMargins });
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
const scrollTo = Inputs.button("Nochmal versuchen", {
  reduce: () => {
    const target = document.getElementById("user-input");
    target.scrollIntoView({ behavior: "smooth" });
  },
});
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
  reduce: (value) => buttonClicked(value),
  disabled: isDisabled,
});
const answerValue = Generators.input(answerInput);
```

```js
const feedbackAestheticInput = Inputs.radio(
  new Map([
    ["1", 1],
    ["2", 2],
    ["3", 3],
    ["4", 4],
    ["5 stimme voll zu", 5],
  ]),
  {
    /* label: "Die Gestaltung der Grafik war ansprechend."  */
    label: "stimme gar nicht zu",
  }
);
const feedbackAestheticValue = Generators.input(feedbackAestheticInput);
```

```js
const feedbackInterestInput = Inputs.radio(
  new Map([
    ["1", 1],
    ["2", 2],
    ["3", 3],
    ["4", 4],
    ["5 stimme voll zu", 5],
  ]),
  {
    /* label: "Die Gestaltung der Grafik war ansprechend."  */
    label: "stimme gar nicht zu",
  }
);
const feedbackInterestValue = Generators.input(feedbackInterestInput);
```

```js
console.log("feebackValue", feedbackAestheticValue);
```

```js
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
createAxes(svg, {
  xScaleSVG,
  timeScale,
  w,
  h,
  sideMargins,
});

const crosshair = initializeCrosshair(
  svg,
  xScaleSVG,
  yScaleSVG,
  w,
  h,
  sideMargins
);

// Setup the pointer interactions like pointerMoved and pointerClicked
new PointerInteraction(svg, container, {
  margin,
  w,
  h,
  xScaleSVG,
  yScaleSVG,
});

function update(data, index) {
  // Update the pointcloud visibility
  pointcloud.setVisibility(container.node().value.showPointcloud);
  /* console.log("data", data); */
  switch (container.node().value.variant) {
    case "percentile":
      updatePercentilePlot(data, xScaleSVG, yScaleSVG);
      break;
    case "dot":
      updateDotPlot(
        data,
        container.node().value,
        xScaleSVG,
        yScaleSVG,
        qradius
      );
      break;
    case "box":
      updateBoxPlot(data, xScaleSVG, yScaleSVG);
      break;
    case "hop":
      updateHOPPlot(data, {
        xScaleSVG,
        yScaleSVG,
        qradius,
        index,
      });
      break;
    case "hop_traced":
      updateHOPPlot(data, {
        xScaleSVG,
        yScaleSVG,
        qradius,
        hopCount,
        index,
      });
      break;
    case "none":
      exitPlot();
      break;
    default:
      console.error("Unknown plot type selected");
  }

  // Draw percentiles
  drawGroupedPercentileLines(svg, container, {
    dataSet,
    xScaleSVG,
    yScaleSVG,
  });

  // Draw recommended Area
  drawRecommendedArea(svg, container, {
    xScaleSVG,
    yScaleSVG,
  });

  updateCrosshairs(
    container.node().value,
    crosshair,
    xScaleSVG,
    yScaleSVG,
    w,
    sideMargins
  );
}

container.node().update = update;
```

```js
const chartElement = container.node();
const chartValue = Generators.input(chartElement);
```

```js
const update = chartElement.update(dataSet.get(chartValue.age), j);
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

```js
/* console.log("j", j); */
console.log("chartValue", chartValue);
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
  const trueValue = Math.round(getTrueValue(dataSet, chartValue) * 100);
  logEstimateClick({
    estimateValue,
    trueValue,
    section: 7,
    age: chartValue.age,
    sleepTime: chartValue.sleepTime,
  });
  return value + 1;
};
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
  <div class="scroll-section card" data-step="7">Was würdest du schätzen, wie viel Prozent der Menschen in ${personalizationValue ? "deiner" : "dieser"} Altersgruppe schlafen kürzer als du?${estimateInput}${answerInput}
    <div id="answer">Die richtige Antwort ist ${Math.round(getTrueValue(dataSet, chartValue) * 100)}% Versuche es gerne nochmal mit einem anderen Alter/Schlafdauer. Wenn du auf den Button klickst, scrollt die Seite wieder nach oben zur richtigen Stelle. Wenn du lieber fortfahren willst, scrolle wie gehabt weiter nach unten.${scrollTo}
    </div>
  </div>  
  <div class="scroll-section card" data-step="8">Jetzt kannst du die Grafik frei erkunden, indem du den Cursor in die Grafik bewegst.</div>
</section>
<div class="card">
    <h2>Altersgruppe bis 10 Jahre</h2>
    <p> Um die vielen neuen Eindrücke und das Gelernte zu verarbeiten, braucht das Gehirn in den ersten Lebensjahren besonders viel Schlaf. Bis zum Jugendalter ist die durchschnittliche Schlafdauer daher am höchsten. Sie streut auch vergleichsweise wenig – die Perzentillinien liegen nah beieinander.</p>
    <h2>11–17 Jahre</h2>
    <p>Während der Pubertät fällt die Schlafdauer dramatisch ab; gleichzeitig nimmt die Streuung zu. Da sich in dieser Phase die innere Uhr meist auf spätere Bettzeiten einstellt, die Schule aber in der Regel früh beginnt, bekommen Jugendliche oft weniger Schlaf, als es Fachleute empfehlen.</p>
    <h2>18–65 Jahre</h2>
    <p>Im Erwachsenenalter stabilisiert sich die Schlafzeit und liegt im Mittel bei 7 Stunden. Dies ist auch die Lebensphase, in der die meisten Menschen einer festen Arbeit nachgehen und damit einen geregelten Tagesablauf haben. Man kann also nicht sagen, ob die Stabilisierung auf biologische Faktoren (das Ende der Pubertät) zurückgeht oder eher auf die Lebensumstände.</p>
    <h2>Über 66 Jahre</h2>
    <p>Im Rentenalter ändert sich zwar die mittlere Schlafdauer von 7 Stunden nicht, dafür aber die Streuung: Die Perzentillinien driften erst weiter auseinander, um im späteren Verlauf wieder zusammenzurücken. Wie Studien gezeigt haben, sinkt mit dem Alter zudem die Schlafeffizienz. Die Menschen verbringen deutlich mehr Zeit im Bett, als sie tatsächlich schlafen.</p>
</div>
<div class="card">
  <p>Uns interessiert deine Meinung: wie stehst du zu folgenden Aussagen?</p>
  <h2>Die Gestaltung der Grafik war ansprechend.</h2>
  ${feedbackAestheticInput}
  <h2>Das Thema hat mich interessiert.</h2>
  ${feedbackInterestInput}
</div>

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
  margin: 0 auto 60vh;
  z-index: 2;
}

.card {
  max-width: 32rem;
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
