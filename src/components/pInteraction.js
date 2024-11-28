import * as d3 from "npm:d3";

class PInteraction {
  constructor(svg, container) {
    this.svg = svg;
    this.container = container;
    this.isPlotLocked = false;
    this.node = container.node();
    this.attachEventListeners();
  }

  calculatePosition(event) {
    const [mx, my] = d3.pointer(event);
    return {
      withinMargins:
        mx >= margin.left &&
        mx <= w - margin.right &&
        my >= margin.top &&
        my <= h - margin.bottom,
      x: mx,
      y: my,
    };
  }

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

  updateInteractionState(locked) {
    this.svg.style("cursor", locked ? "not-allowed" : "crosshair");
  }

  pointerMoved(event) {
    if (
      !this.isValidEvent(event) ||
      this.isPlotLocked ||
      !this.node.value.isExplorable
    )
      return;

    const position = this.calculatePosition(event);
    const newValue = this.calculateValue(position);

    if (!_.isEqual(this.node.value, newValue)) {
      this.node.value = newValue;
      this.node.dispatchEvent(new CustomEvent("input"), { bubbles: true });
    }
  }

  pointerClicked() {
    this.isPlotLocked = !this.isPlotLocked;
    this.updateInteractionState(this.isPlotLocked);
  }

  isValidEvent(event) {
    return event !== null;
  }

  attachEventListeners() {
    this.svg
      .on("pointerenter pointermove", this.pointerMoved.bind(this))
      .on("click", this.pointerClicked.bind(this))
      .on("touchstart", (event) => event.preventDefault());
  }
}

export default PInteraction;
