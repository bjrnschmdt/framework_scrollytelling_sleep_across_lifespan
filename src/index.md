---
theme: [midnight, alt]
---

```js
import {
  getTrueValue,
  getURLParameter,
  createDebouncedLogger,
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
const { xScaleSVG, yScaleSVG, timeScale } = createScales({ w, h });
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
const scrollyStep = Mutable(0);
const setScrollyStep = (x) => (scrollyStep.value = x);
```

```js
const scrollyProps = getSteps(ageValue, sleepTimeValue, chartValue, variant);
```

```js
const stepProps = scrollyProps[scrollyStep];
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
};
```

```js
function getSteps(age, sleepTime, chartValue, variant) {
  return {
    0: { ...baseStep },
    1: { ...baseStep },
    2: { ...baseStep, showPointcloud: true },
    3: { ...baseStep, showPointcloud: true, showPercentiles: ["C"] },
    4: {
      ...baseStep,
      age: 31,
      sleepTime: 7,
      showPointcloud: true,
      showPercentiles: ["C"],
      tooltipText: "Karin",
    },
    5: {
      ...baseStep,
      age,
      sleepTime,
      showPointcloud: true,
      showPercentiles: ["C"],
      tooltipText: "Du",
    },
    6: {
      ...baseStep,
      age,
      sleepTime,
      showPointcloud: true,
      showPercentiles: ["C"],
      variant,
    },
    7: {
      ...baseStep,
      age,
      sleepTime,
      showPointcloud: true,
      showPercentiles: ["C"],
      variant,
    },
    8: {
      ...baseStep,
      age: chartValue.age,
      sleepTime: chartValue.sleepTime,
      showPointcloud: true,
      showPercentiles: ["C"],
      isExplorable: true,
      variant,
    },
  };
}
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
const ageInput = Inputs.range([ageMin, ageMax], {
  step: 1,
  label: "Alter",
  value: def.age,
});
const ageValue = Generators.input(ageInput);
```

```js
const sleepTimeInput = Inputs.range([sleepMin, sleepMax], {
  step: 0.25,
  label: "Schlafdauer",
  value: def.sleepTime,
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
    target.scrollIntoView({ behavior: "smooth" });
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
const container = d3.create("div");
container.style("position", "relative");
container.style("background-color", `var(--theme-background)`);

const canvas = container.append("canvas").node();
const context = canvas.getContext("2d");

// Initialize the value of the container
container.node().value = {
  age: undefined,
  sleepTime: undefined,
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
  .append("clipPath")
  .attr("id", "plot-clip")
  .append("rect")
  .attr("x", 0)
  .attr("y", 0)
  .attr("width", w)
  .attr("height", h);

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
});

const crosshair = initializeCrosshair(svg, xScaleSVG, yScaleSVG, w, h);

// Setup the pointer interactions like pointerMoved and pointerClicked
const pointerInteraction = new PointerInteraction(svg, {
  margin,
  w,
  h,
  xScaleSVG,
  yScaleSVG,
  container,
});

function update({ data, stepProps, hopIndex }) {
  // Update the pointcloud visibility
  pointcloud.setVisibility(stepProps.showPointcloud);
  pointerInteraction.isExplorable = () => stepProps?.isExplorable || false;

  switch (stepProps.variant) {
    case "percentile":
      updatePercentilePlot(data, xScaleSVG, yScaleSVG);
      break;
    case "dot":
      updateDotPlot(data, stepProps, xScaleSVG, yScaleSVG, h);
      break;
    case "box":
      updateBoxPlot(data, xScaleSVG, yScaleSVG);
      break;
    case "hop":
      updateHOPPlot(data, {
        xScaleSVG,
        yScaleSVG,
        hopIndex,
        h,
      });
      break;
    case "hop_traced":
      updateHOPPlot(data, {
        xScaleSVG,
        yScaleSVG,
        hopCount,
        hopIndex,
        h,
      });
      break;
    case "none":
      exitPlot();
      break;
    default:
      console.error("Unknown plot type selected");
  }

  // Draw percentiles
  drawGroupedPercentileLines(svg, {
    dataSet,
    showPercentiles: stepProps.showPercentiles,
    xScaleSVG,
    yScaleSVG,
  });

  // Draw recommended Area
  drawRecommendedArea(svg, container, {
    xScaleSVG,
    yScaleSVG,
  });

  updateCrosshairs(stepProps, crosshair, xScaleSVG, yScaleSVG, w);
}

container.node().update = update;
```

```js
const chartElement = container.node();
const chartValue = Generators.input(chartElement);
```

```js
const update = chartElement.update({
  data: dataSet.get(stepProps.age),
  stepProps,
  hopIndex: j,
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
  const target = document.getElementById("answer");
  target.style.display = "block";
  const trueValue = Math.round(getTrueValue(dataSet, stepProps) * 100);
  console.log("trueValue", trueValue);
  logBtnEstimate({
    estimateValue,
    trueValue,
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
  <div class="scroll-section card" data-step="7">Was würdest du schätzen, wie viel Prozent der Menschen in ${personalizationValue ? "dieser" : "deiner"} Altersgruppe schlafen kürzer als du?${estimateInput}${answerInput}
    <div id="answer">Die richtige Antwort ist ${Math.round(getTrueValue(dataSet, stepProps) * 100)}% Versuche es gerne nochmal mit einem anderen Alter/Schlafdauer. Wenn du auf den Button klickst, scrollt die Seite wieder nach oben zur richtigen Stelle. Wenn du lieber fortfahren willst, scrolle wie gehabt weiter nach unten.${scrollTo}
    </div>
  </div>  
  <div class="scroll-section card" data-step="8">Jetzt kannst du die Grafik frei erkunden, indem du den Cursor in die Grafik bewegst.</div>
</section>
<div class="outro card">
    <h2>Altersgruppe bis 10 Jahre</h2>
    <p> Um die vielen neuen Eindrücke und das Gelernte zu verarbeiten, braucht das Gehirn in den ersten Lebensjahren besonders viel Schlaf. Bis zum Jugendalter ist die durchschnittliche Schlafdauer daher am höchsten. Sie streut auch vergleichsweise wenig – die Perzentillinien liegen nah beieinander.</p>
    <h2>11–17 Jahre</h2>
    <p>Während der Pubertät fällt die Schlafdauer dramatisch ab; gleichzeitig nimmt die Streuung zu. Da sich in dieser Phase die innere Uhr meist auf spätere Bettzeiten einstellt, die Schule aber in der Regel früh beginnt, bekommen Jugendliche oft weniger Schlaf, als es Fachleute empfehlen.</p>
    <h2>18–65 Jahre</h2>
    <p>Im Erwachsenenalter stabilisiert sich die Schlafzeit und liegt im Mittel bei 7 Stunden. Dies ist auch die Lebensphase, in der die meisten Menschen einer festen Arbeit nachgehen und damit einen geregelten Tagesablauf haben. Man kann also nicht sagen, ob die Stabilisierung auf biologische Faktoren (das Ende der Pubertät) zurückgeht oder eher auf die Lebensumstände.</p>
    <h2>Über 66 Jahre</h2>
    <p>Im Rentenalter ändert sich zwar die mittlere Schlafdauer von 7 Stunden nicht, dafür aber die Streuung: Die Perzentillinien driften erst weiter auseinander, um im späteren Verlauf wieder zusammenzurücken. Wie Studien gezeigt haben, sinkt mit dem Alter zudem die Schlafeffizienz. Die Menschen verbringen deutlich mehr Zeit im Bett, als sie tatsächlich schlafen.</p>
</div>
<div class="outro card">
  <p>Uns interessiert deine Meinung: wie stehst du zu folgenden Aussagen?</p>
  <h2>Die Gestaltung der Grafik war ansprechend.</h2>
  ${aestheticsInput}
  <h2>Das Thema hat mich interessiert.</h2>
  ${interestInput}
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
  margin-bottom: 60vh;
}

.outro {
  margin: 0 auto 2rem;
}

#answer {
  display: none;
  overflow: hidden;
}

</style>
