---
theme: [midnight, alt]
---

```js
import {
  getTrueValue,
  getURLParameter,
  createDebouncedLogger,
  formatTime,
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
/* import PercentileLines from "./components/PercentileLines.js"; */
import {
  drawGroupedPercentileLines,
  updatePercentileLineScales,
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
// Create a mutable that holds the full object (as your “source of truth”)
const stableStepProps = Mutable(baseStep);
const setStableStepProps = (x) => (stableStepProps.value = x);
```

```js
const changes = diffStepProps(stepProps, stableStepProps);
```

```js
/* console.log("Changes:", changes); */
```

```js
const scrollyStep = Mutable(0);
const setScrollyStep = (x) => (scrollyStep.value = x);
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
  xDomain: [5, 94],
  yDomain: [4, 13],
};
```

```js
const scrollyProps = {
  0: { ...baseStep },
  1: { ...baseStep },
  2: {
    ...baseStep,
    showPointcloud: true,
  },
  3: {
    ...baseStep,
    showPointcloud: true,
    showPercentiles: ["C"],
  },
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
    age: ageValue,
    sleepTime: sleepTimeValue,
    showPointcloud: true,
    showPercentiles: ["C"],
    tooltipText: "Du",
  },
  6: {
    ...baseStep,
    age: ageValue,
    sleepTime: sleepTimeValue,
    showPointcloud: true,
    showPercentiles: ["C"],
    variant,
  },
  7: {
    ...baseStep,
    age: ageValue,
    sleepTime: sleepTimeValue,
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
  9: {
    ...baseStep,
    age: chartValue.age,
    sleepTime: chartValue.sleepTime,
    showPointcloud: true,
    showPercentiles: ["C"],
    isExplorable: true,
    variant,
  },
  10: {
    ...baseStep,
    age: chartValue.age,
    sleepTime: chartValue.sleepTime,
    showPointcloud: true,
    showPercentiles: ["C"],
    isExplorable: true,
    variant,
    xDomain: [5, 10],
  },
  11: {
    ...baseStep,
    age: chartValue.age,
    sleepTime: chartValue.sleepTime,
    showPointcloud: true,
    showPercentiles: ["C"],
    isExplorable: true,
    variant,
    xDomain: [11, 17],
  },
  12: {
    ...baseStep,
    age: chartValue.age,
    sleepTime: chartValue.sleepTime,
    showPointcloud: true,
    showPercentiles: ["C"],
    isExplorable: true,
    variant,
    xDomain: [18, 65],
  },
  13: {
    ...baseStep,
    age: chartValue.age,
    sleepTime: chartValue.sleepTime,
    showPointcloud: true,
    showPercentiles: ["C"],
    isExplorable: true,
    variant,
    xDomain: [66, 94],
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
  .attr("x", margin.left)
  .attr("y", margin.top)
  .attr("width", w - margin.left - margin.right)
  .attr("height", h - margin.top - margin.bottom);

const pointcloud = new Pointcloud(context, canvas, {
  simulatedData,
  xScale: xScaleSVG,
  yScale: yScaleSVG,
});

/* const percentileLines = new PercentileLines(svg, { xScaleSVG, yScaleSVG }); */

// Create Axes
const { gx, gy, xAxis, yAxis, updateAxes } = createAxes(svg, {
  xScaleSVG,
  yScaleSVG,
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

/* const zoom = d3.zoom().scaleExtent([0.5, 8]).on("zoom", zoomed);

function zoomed({ transform }) {
  const zx = transform.rescaleX(xScaleSVG).interpolate(d3.interpolateRound);
  const zy = transform.rescaleY(yScaleSVG).interpolate(d3.interpolateRound);
  gx.call(xAxis, zx);
  gy.call(yAxis, zy);
}

svg.call(zoom).call(zoom.transform, d3.zoomIdentity); */

function updateChart({ data, stepProps, changes, hopIndex }) {
  // Update only if there are changes
  if (Object.keys(changes).length > 0) {
    /* console.log("changes", changes); */

    // Update if the domain has changed
    if (changes.xDomain || changes.yDomain) {
      // Update scales
      xScaleSVG.domain(stepProps.xDomain);
      yScaleSVG.domain(stepProps.yDomain);

      updatePercentileLineScales(svg, { xScaleSVG, yScaleSVG });

      updatePointcloudScales(pointcloud, {
        xScaleSVG,
        yScaleSVG,
      });

      // Update axes
      updateAxes(xScaleSVG, yScaleSVG);

      // Update crosshairs
      updateCrosshairs(stepProps, crosshair, xScaleSVG, yScaleSVG, w);
    }

    // Update pointcloud visibility
    if (changes.showPointcloud) {
      pointcloud.setVisibility(stepProps.showPointcloud);
    }

    // Update percentiles visibility
    if (changes.showPercentiles) {
      drawGroupedPercentileLines(svg, {
        dataSet,
        showPercentiles: stepProps.showPercentiles,
        xScaleSVG,
        yScaleSVG,
      });
    }

    // Update exploration mode
    if (changes.isExplorable) {
      pointerInteraction.isExplorable = () => stepProps?.isExplorable || false;
    }

    // Update type specific plot
    if (changes.variant || changes.age || changes.sleepTime) {
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
    }

    // Update crosshairs
    if (changes.age || changes.sleepTime || changes.tooltipText) {
      updateCrosshairs(stepProps, crosshair, xScaleSVG, yScaleSVG, w);
    }

    setStableStepProps(stepProps);
  }
}

container.node().updateChart = updateChart;
```

```js
function updatePointcloudScales(pointcloud, { xScaleSVG, yScaleSVG }) {
  pointcloud.transitionScales(xScaleSVG.copy(), yScaleSVG.copy(), 1000); // Animate over 1 second
}
```

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
  <div class="scroll-section card" data-step="1">Auf der Y-Achse links ist die Schlafdauer eingetragen, unten auf der X-Achse das Alter.</div>
  <div class="scroll-section card" data-step="2">Jeder winzige Punkt in der Wolke entspricht der Schlafdauer einer Person eines bestimmten Alters. Dazu haben Fachleute die Daten von über 150.000 Menschen aus verschiedenen Studien zusammengetragen. Je dichter die Wolke, desto mehr Menschen werden dort repräsentiert. Die Daten der Erwachsenen beruhen auf Selbsteinschätzungen, die der Kinder auf Angaben der Eltern. Studien zufolge unterliegt die Beurteilung der eigenen Schlafdauer oft Verzerrungen: Wer unter Schlafstörungen leidet, neigt dazu, die geschlafene Zeit zu unterschätzen. Gute Schläfer hingegen überschätzen sie häufig.</div>
  <div class="scroll-section card" data-step="3">Die Linien geben Perzentile an und zeigen, wie sich die Datenpunkte in der Stichprobe verteilen. Was das konkret heißt, siehst du im folgenden Bild:</div>
  <div class="scroll-section card" data-step="4">Karin ist 31 Jahre alt und liegt mit einer Schlafdauer von 7 Stunden im 50. Perzentil: Die eine Hälfte der 31-Jährigen schläft mehr, die andere weniger.</div>
   <div class="scroll-section card" data-step="5" id="user-input">
  Wie ist es bei dir? Gib hier dein Alter und deine übliche Schlafdauer (bspw. von letzter Nacht) ein, um dich in der Grafik verorten zu können! Wenn du weiter scrollst, kannst du dich mit anderen in deinem Alter vergleichen.
  ${ageInput}${sleepTimeInput}</div>
  <div class="scroll-section card" data-step="6">Die Figuren zeigen, wie lange Menschen in einem bestimmten Alter schlafen. Jede Figur steht für einen Anteil der Menschen in dieser Altersgruppe. Je höher oder tiefer eine Figur auf der Grafik ist, desto länger oder kürzer schlafen diese Menschen. Je mehr Figuren nebeneinanderstehen, desto mehr Menschen schlafen die Stundenanzahl, die links auf dieser Höhe angegeben ist.</div> 
  <div class="scroll-section card" data-step="7">Was würdest du schätzen, wie viel Prozent der Menschen in ${personalizationValue ? "dieser" : "deiner"} Altersgruppe schlafen kürzer als du?${estimateInput}${answerInput}${feedbackInput}</div>  
  <div class="scroll-section card" data-step="8">Bewege den Mauszeiger in die Grafik, um sie frei zu erkunden. Ein Klick fixiert die Ansicht, ein weiterer Klick löst sie wieder.</div>
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
    <h2>Altersgruppe bis 10 Jahre</h2>
    <p> Um die vielen neuen Eindrücke und das Gelernte zu verarbeiten, braucht das Gehirn in den ersten Lebensjahren besonders viel Schlaf. Bis zum Jugendalter ist die durchschnittliche Schlafdauer daher am höchsten. Sie streut auch vergleichsweise wenig – die Perzentillinien liegen nah beieinander.</p>
    <h2>11–17 Jahre</h2>
    <p>Während der Pubertät fällt die Schlafdauer dramatisch ab; gleichzeitig nimmt die Streuung zu. Da sich in dieser Phase die innere Uhr meist auf spätere Bettzeiten einstellt, die Schule aber in der Regel früh beginnt, bekommen Jugendliche oft weniger Schlaf, als es Fachleute empfehlen.</p>
    <h2>18–65 Jahre</h2>
    <p>Im Erwachsenenalter stabilisiert sich die Schlafzeit und liegt im Mittel bei 7 Stunden. Dies ist auch die Lebensphase, in der die meisten Menschen einer festen Arbeit nachgehen und damit einen geregelten Tagesablauf haben. Man kann also nicht sagen, ob die Stabilisierung auf biologische Faktoren (das Ende der Pubertät) zurückgeht oder eher auf die Lebensumstände.</p>
    <h2>Über 66 Jahre</h2>
    <p>Im Rentenalter ändert sich zwar die mittlere Schlafdauer von 7 Stunden nicht, dafür aber die Streuung: Die Perzentillinien driften erst weiter auseinander, um im späteren Verlauf wieder zusammenzurücken. Wie Studien gezeigt haben, sinkt mit dem Alter zudem die Schlafeffizienz. Die Menschen verbringen deutlich mehr Zeit im Bett, als sie tatsächlich schlafen.</p>
</div> -->
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
