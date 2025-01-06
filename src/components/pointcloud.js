import * as d3 from "npm:d3";

import { settings } from "./settings.js";
const { ageMin, ageMax, colors, canvasScaleFactor } = settings;

/**
 * A class to render a point cloud of simulated data on an HTML canvas.
 */
export class Pointcloud {
  /**
   * @param {CanvasRenderingContext2D} context       - The 2D rendering context for the canvas.
   * @param {HTMLCanvasElement} canvas               - The canvas DOM element.
   * @param {object} config                          - Configuration object.
   * @param {array}  config.simulatedData            - Array of data points to plot (each {age, sleepTime}).
   * @param {function} config.xScale                 - D3 scale function for the x-axis (age).
   * @param {function} config.yScale                 - D3 scale function for the y-axis (sleepTime).
   * @param {number} config.canvasScaleFactor        - Scaling factor for HiDPI screens.
   */
  constructor(context, canvas, { simulatedData, xScale, yScale }) {
    if (
      !context ||
      !canvas ||
      !simulatedData ||
      !xScale ||
      !yScale ||
      !colors ||
      typeof ageMin === "undefined" ||
      typeof ageMax === "undefined" ||
      typeof canvasScaleFactor === "undefined"
    ) {
      throw new Error("Missing required parameters for Pointcloud.");
    }

    this.context = context;
    this.canvas = canvas;
    this.simulatedData = simulatedData;
    this.xScale = xScale;
    this.yScale = yScale;
    this.colors = colors;
    this.ageMin = ageMin;
    this.ageMax = ageMax;
    this.canvasScaleFactor = canvasScaleFactor;

    // Fade/visibility settings
    this.alpha = 0; // Initial transparency
    this.alphaMax = 0.3; // Max opacity
    this.visible = false;
    this.fadeDuration = 600; // ms
  }

  /**
   * Draws all points on the canvas at the specified alpha transparency.
   */
  draw(alpha) {
    // Clear the canvas to avoid ghosting
    this.context.fillStyle = this.colors.background;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Set the point color and transparency
    this.context.fillStyle = this.colors.text;
    this.context.globalAlpha = alpha;

    // Filter data based on age range
    this.simulatedData
      .filter((d) => d.age >= this.ageMin && d.age <= this.ageMax)
      .forEach((point) => {
        this.context.beginPath();
        this.context.arc(
          this.xScale(point.age) * this.canvasScaleFactor,
          this.yScale(point.sleepTime) * this.canvasScaleFactor,
          0.5, // radius in canvas space
          0,
          2 * Math.PI
        );
        this.context.fill();
      });

    // Reset alpha to default
    this.context.globalAlpha = 1;
  }

  /**
   * Fade in the points by gradually increasing alpha over time.
   */
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

  /**
   * Fade out the points by gradually decreasing alpha.
   */
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
        // Once fully faded, clear the canvas
        this.context.fillStyle = this.colors.background;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
    };

    requestAnimationFrame(fade);
    this.visible = false;
  }

  /**
   * Sets visibility and triggers the appropriate fade in or fade out.
   */
  setVisibility(visible) {
    if (visible && !this.visible) {
      this.fadeIn();
    } else if (!visible && this.visible) {
      this.fadeOut();
    }
  }
}
