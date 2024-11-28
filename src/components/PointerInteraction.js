import * as d3 from "npm:d3";
import throttle from "npm:lodash/throttle"; // For throttling pointerMoved

class PointerInteraction {
  constructor(svg, container, config) {
    this.svg = svg;
    this.container = container;
    this.isPlotLocked = false;
    this.node = container.node();

    // Destructure configuration parameters
    const { margin, width, height, xScale, yScale } = config;
    this.margin = margin;
    this.width = width;
    this.height = height;
    this.xScale = xScale;
    this.yScale = yScale;

    // Bind methods once
    this.pointerMoved = throttle(this.pointerMoved.bind(this), 16); // Throttle to ~60fps
    this.pointerClicked = this.pointerClicked.bind(this);
    this.preventTouchStart = this.preventTouchStart.bind(this);

    this.attachEventListeners();
  }

  calculatePosition(event) {
    const [mx, my] = d3.pointer(event, this.svg.node());
    const { left, right, top, bottom } = this.margin;
    const { width, height } = this;

    const withinMargins =
      mx >= left && mx <= width - right && my >= top && my <= height - bottom;

    return {
      withinMargins,
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
      age: Math.round(this.xScale.invert(x)),
      sleepTime: this.roundToStep(this.yScale.invert(y), 0.25),
    };
  }

  roundToStep(value, step) {
    return Math.round(value / step) * step;
  }

  updateInteractionState(locked) {
    this.svg.style("cursor", locked ? "not-allowed" : "crosshair");
  }

  pointerMoved(event) {
    if (this.isPlotLocked || this.node.value.isExplorable) return;

    const position = this.calculatePosition(event);
    const newValue = this.calculateValue(position);

    const { age, sleepTime } = this.node.value;
    const { age: newAge, sleepTime: newSleepTime } = newValue;

    // Shallow comparison instead of _.isEqual
    if (age !== newAge || sleepTime !== newSleepTime) {
      this.node.value = newValue;
      this.node.dispatchEvent(new CustomEvent("input", { bubbles: true }));
    }
  }

  pointerClicked() {
    this.isPlotLocked = !this.isPlotLocked;
    this.updateInteractionState(this.isPlotLocked);
  }

  preventTouchStart(event) {
    event.preventDefault();
  }

  attachEventListeners() {
    this.svg
      .on("pointerenter pointermove", this.pointerMoved)
      .on("click", this.pointerClicked)
      .on("touchstart", this.preventTouchStart);
  }
}

export default PointerInteraction;
