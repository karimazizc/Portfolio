document.addEventListener("DOMContentLoaded", () => {
  // Register plugins
  gsap.registerPlugin(ScrambleTextPlugin, SplitText);

  const creativityText = document.getElementById("creativity-text");
  const split = new SplitText(creativityText, {
    type: "lines",
    mask: "lines", // Using the new masking feature
    linesClass: "line"
  });
  // Set initial state (hidden)
  gsap.set(split.lines, {
    y: "100%",
    opacity: 0
  });
  gsap.to(split.lines, {
    y: "0%",
    opacity: 1,
    duration: 0.6,
    stagger: 0.08,
    ease: "power3.out",
    delay: 0.2
  });
});
class TextHeatReveal {
  constructor(canvas, imgSrc, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", {
      willReadFrequently: true
    });
    this.W = canvas.width;
    this.H = canvas.height;
    this.res = options.resolution || 96;
    this.characters = options.characters || "GSAPHEATEFFECT!@#$%&*()_+";
    this.fontSize = options.fontSize || 10;
    this.fontFamily = options.fontFamily || "monospace";
    this.words = options.words || [
      "CREATE",
      "INSPIRE",
      "DESIGN",
      "IMAGINE",
      "VISION",
      "IDEA",
      "DREAM"
    ];
    this.heat = {
      current: new Float32Array(this.res * this.res).fill(0),
      lastTime: 0,
      active: false,
      maxValue: 0
    };
    this.P = {
      grid: {
        size: options.gridSize || 20,
        weight: options.textWeight || 1,
        contrast: options.contrast || 1.2,
        minBrightness: options.minBrightness || 0.25,
        textOpacity: options.textOpacity || 0.85
      },
      effect: {
        strength: options.strength || 16.5,
        diffusion: options.diffusion || 0.92,
        decay: options.decay || 0.98,
        threshold: options.threshold || 0.04
      },
      image: {
        brightness: options.imageBrightness || 1.2,
        contrast: options.imageContrast || 1.3
      }
    };
    this.scrambleInterval = options.scrambleInterval || 500;
    this.scrambleAmount = options.scrambleAmount || 0.08;
    this.scrambleActive = true;
    this.coverCanvas = document.createElement("canvas");
    this.coverCanvas.width = this.W;
    this.coverCanvas.height = this.H;
    this.coverCtx = this.coverCanvas.getContext("2d");
    this.coverData = null;
    this.staticCanvas = document.createElement("canvas");
    this.staticCanvas.width = this.W;
    this.staticCanvas.height = this.H;
    this.staticCtx = this.staticCanvas.getContext("2d");
    this.staticRendered = false;
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.fps = 0;
    this.lowPerformanceMode = false;
    this.charGrid = [];
    this.img = new Image();
    this.img.crossOrigin = "anonymous";
    this.img.onload = () => this._prepareCover();
    this.img.onerror = () => {
      this.img.src = "https://assets.codepen.io/7558/bw-spheres-003.jpg";
    };
    this.img.src = imgSrc;

    // Store the container element for fade-in effect
    this.container = document.getElementById("canvas-container");
  }

  _prepareCover() {
    this.coverCtx.fillStyle = "black";
    this.coverCtx.fillRect(0, 0, this.W, this.H);
    const scale = Math.max(this.W / this.img.width, this.H / this.img.height);
    const sw = this.img.width * scale,
      sh = this.img.height * scale;
    const ox = (this.W - sw) / 2,
      oy = (this.H - sh) / 2;
    this.coverCtx.filter = `brightness(${this.P.image.brightness}) contrast(${this.P.image.contrast})`;
    this.coverCtx.drawImage(this.img, ox, oy, sw, sh);
    this.coverCtx.filter = "none";
    this.coverData = this.coverCtx.getImageData(0, 0, this.W, this.H);
    this._clearHeat();
    this._generateCharGrid();
    this._placeWordsInGrid();
    this._renderStaticGrid();
    this._render();
    this._bindEvents();
    this._startScrambling();
    this._monitorPerformance();

    // Start the fade-in of the canvas container
    setTimeout(() => {
      this.container.classList.add("visible");
    }, 100); // Small delay to ensure DOM is ready

    // Then start the character animation
    this._createInitialAnimation();
  }

  _createInitialAnimation() {
    // Create a deep copy of the character grid
    const originalGrid = [];
    for (let i = 0; i < this.charGrid.length; i++) {
      originalGrid.push({ ...this.charGrid[i] });
    }

    // Clear the char grid but preserve word characters for visibility
    this.charGrid.forEach((cell) => {
      // Preserve word characters but make other characters empty
      if (!cell.isWordChar) {
        cell.char = " ";
        cell.brightness = 0;
      } else {
        // Keep word characters but make them slightly visible from the start
        cell.brightness = 0.25; // Reduced from 0.3
      }
    });

    // Render initial state with visible word characters
    this._renderStaticGrid();
    this._render();

    // Animate in each character in sequence
    let count = 0;
    const totalCells = this.charGrid.length;
    const duration = 800;

    // Create a sequence of indices to animate with word cells at the end
    const indices = this._createAnimationIndices();

    // Animation timer
    const startTime = performance.now();

    const animateIn = () => {
      const now = performance.now();
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Calculate how many cells should be visible based on progress
      const visibleCount = Math.floor(progress * totalCells);

      // Reveal cells according to our pattern
      for (let i = 0; i < visibleCount; i++) {
        const idx = indices[i];

        // Set non-word cells to random characters with increasing brightness
        if (i >= count && !this.charGrid[idx].isWordChar) {
          const originalCell = originalGrid[idx];
          this.charGrid[idx].char = this._getRandomChar();
          // Add fade-in effect by gradually increasing brightness
          const fadeProgress = Math.min(1, progress * 1.5); // Faster fade-in
          this.charGrid[idx].brightness =
            originalCell.brightness * fadeProgress;
          count = i;
        }
      }

      // After all cells are revealed, stabilize them to their original state
      if (progress >= 1) {
        // Restore all non-word cells to their original state
        for (let i = 0; i < this.charGrid.length; i++) {
          if (!this.charGrid[i].isWordChar) {
            this.charGrid[i] = { ...originalGrid[i] };
          }
        }
        this._renderStaticGrid();
        this._render();
        return;
      }

      // Render current state
      this._renderStaticGrid();
      this._render();

      // Continue animation
      requestAnimationFrame(animateIn);
    };

    // Start animation
    animateIn();
  }

  _createAnimationIndices() {
    // Create array of indices, putting word characters last to ensure they're visible
    const nonWordIndices = [];
    const wordIndices = [];

    // Separate word and non-word indices
    for (let i = 0; i < this.charGrid.length; i++) {
      if (this.charGrid[i].isWordChar) {
        wordIndices.push(i);
      } else {
        nonWordIndices.push(i);
      }
    }

    // Shuffle non-word indices for interesting reveal
    this._shuffleArray(nonWordIndices);

    // Combine arrays with word indices at the end
    return [...nonWordIndices, ...wordIndices];
  }

  _shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  _getRandomChar() {
    return this.characters.charAt(
      Math.floor(Math.random() * this.characters.length)
    );
  }

  _monitorPerformance() {
    const checkPerformance = () => {
      this.frameCount++;
      const now = performance.now();
      if (now - this.lastFrameTime >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastFrameTime = now;
        if (this.fps < 30 && !this.lowPerformanceMode) {
          this.lowPerformanceMode = true;
          this.scrambleInterval = 1000;
          this.scrambleAmount = 0.05;
          clearInterval(this.scrambleTimer);
          this._startScrambling();
        } else if (this.fps > 50 && this.lowPerformanceMode) {
          this.lowPerformanceMode = false;
          this.scrambleInterval = 500;
          this.scrambleAmount = 0.08;
          clearInterval(this.scrambleTimer);
          this._startScrambling();
        }
      }
      requestAnimationFrame(checkPerformance);
    };
    checkPerformance();
  }

  _placeWordsInGrid() {
    const { W, H, P } = this;
    const gridSize = P.grid.size;
    const cols = Math.floor(W / gridSize);
    const rows = Math.floor(H / gridSize);

    // Reset any previously marked word characters
    this.charGrid.forEach((cell) => {
      cell.isWordChar = false;
    });

    // Place each word
    this.words.forEach((word) => {
      // Try multiple placements for each word
      const placementCount = Math.max(1, Math.floor(Math.random() * 2) + 1);

      for (let placement = 0; placement < placementCount; placement++) {
        // Choose random direction: 0=horizontal, 1=vertical, 2=diagonal
        const direction = Math.floor(Math.random() * 3);

        // Try to find a valid placement
        let startX,
          startY,
          valid = false;
        let attempts = 0;

        while (!valid && attempts < 20) {
          attempts++;

          // Random starting position
          startX = Math.floor(Math.random() * cols);
          startY = Math.floor(Math.random() * rows);

          // Check if word fits in chosen direction
          valid = true;

          if (direction === 0) {
            // Horizontal
            if (startX + word.length > cols) valid = false;
          } else if (direction === 1) {
            // Vertical
            if (startY + word.length > rows) valid = false;
          } else {
            // Diagonal
            if (startX + word.length > cols || startY + word.length > rows)
              valid = false;
          }

          if (valid) {
            // Place the word in the grid
            for (let i = 0; i < word.length; i++) {
              let x, y;

              // Calculate position based on direction
              if (direction === 0) {
                // Horizontal
                x = (startX + i) * gridSize;
                y = startY * gridSize;
              } else if (direction === 1) {
                // Vertical
                x = startX * gridSize;
                y = (startY + i) * gridSize;
              } else {
                // Diagonal
                x = (startX + i) * gridSize;
                y = (startY + i) * gridSize;
              }

              // Find the matching cell by coordinates
              const cellIndex = this.charGrid.findIndex(
                (cell) => cell.x === x && cell.y === y
              );

              if (cellIndex !== -1) {
                // Set the character and mark as word character
                this.charGrid[cellIndex].char = word[i];
                this.charGrid[cellIndex].isWordChar = true;
                this.charGrid[cellIndex].brightness = Math.max(
                  this.charGrid[cellIndex].brightness,
                  0.65
                );
              }
            }
          }
        }
      }
    });
  }

  _generateCharGrid() {
    const { W, H, P } = this;
    const gridSize = P.grid.size;
    const minBrightness = P.grid.minBrightness;

    // Clear existing grid
    this.charGrid = [];

    // Create grid cells
    for (let y = 0; y < H; y += gridSize) {
      for (let x = 0; x < W; x += gridSize) {
        // Sample image brightness at this position
        const pi = (Math.floor(y) * W + Math.floor(x)) * 4;
        let gray =
          (this.coverData.data[pi] * 0.299 +
            this.coverData.data[pi + 1] * 0.587 +
            this.coverData.data[pi + 2] * 0.114) /
          255;

        // Apply contrast with minimum brightness
        gray = Math.max(
          minBrightness,
          Math.min(1, (gray - 0.5) * P.grid.contrast + 0.5)
        );

        // Create cell with random character
        const randomChar = this.characters.charAt(
          Math.floor(Math.random() * this.characters.length)
        );

        this.charGrid.push({
          x,
          y,
          char: randomChar,
          weight: gray * P.grid.weight,
          brightness: gray,
          isWordChar: false
        });
      }
    }
  }

  _renderStaticGrid() {
    const { staticCtx, W, H, P } = this;

    // Clear canvas
    staticCtx.clearRect(0, 0, W, H);
    staticCtx.fillStyle = "black";
    staticCtx.fillRect(0, 0, W, H);

    // Set default font
    staticCtx.font = `${this.fontSize}px ${this.fontFamily}`;
    staticCtx.textAlign = "center";
    staticCtx.textBaseline = "middle";

    // Draw each character
    this.charGrid.forEach((cell) => {
      const { x, y, char, brightness, isWordChar } = cell;

      // Calculate font size based on brightness
      const sizeFactor = isWordChar ? 0.8 : 0.5; // Make word chars bigger
      const size = this.fontSize * (sizeFactor + brightness * 0.8);

      // Set font with bold for word characters
      staticCtx.font = `${isWordChar ? "bold" : ""} ${size}px ${
        this.fontFamily
      }`;

      // Calculate color with higher brightness for word characters, but less bright than before
      const colorFactor = isWordChar ? 1.3 : 1.1;
      const finalBrightness =
        Math.min(1, brightness * colorFactor) * P.grid.textOpacity;

      // Set fill style
      staticCtx.fillStyle = `rgba(255, 255, 255, ${finalBrightness})`;

      // Draw the character
      staticCtx.fillText(char, x + P.grid.size / 2, y + P.grid.size / 2);
    });

    this.staticRendered = true;
  }

  _startScrambling() {
    this.scrambleTimer = setInterval(() => {
      if (
        this.scrambleActive &&
        (!this.heat.active || this.lowPerformanceMode)
      ) {
        this._scrambleRandomChars();
      }
    }, this.scrambleInterval);
  }

  _scrambleRandomChars() {
    if (this.heat.active && this.heat.maxValue > 0.5) {
      return;
    }

    const numChars = Math.floor(this.charGrid.length * this.scrambleAmount);

    for (let i = 0; i < numChars; i++) {
      const randomIndex = Math.floor(Math.random() * this.charGrid.length);
      const cell = this.charGrid[randomIndex];

      // Only scramble non-word characters
      if (!cell.isWordChar) {
        cell.char = this.characters.charAt(
          Math.floor(Math.random() * this.characters.length)
        );
      }
    }

    this._renderStaticGrid();

    if (!this.heat.active) {
      this._render();
    }
  }

  _bindEvents() {
    const c = this.canvas;
    c.addEventListener("pointermove", (e) => this._move(e), {
      passive: true
    });
    c.addEventListener("pointerdown", (e) => this._down(e), {
      passive: true
    });
    c.addEventListener("pointerleave", () => this._leave(), {
      passive: true
    });
    c.addEventListener("pointercancel", () => this._leave(), {
      passive: true
    });
    document.addEventListener("visibilitychange", () => {
      this.scrambleActive = !document.hidden;
    });
  }

  _start() {
    if (!this.heat.active) {
      this.heat.active = true;
      this._anim();
    }
  }

  _stop() {
    this.heat.active = false;
    cancelAnimationFrame(this._raf);
    this._render();
  }

  _anim = () => {
    this._update();
    this._render();
    if (this.heat.active) {
      this._raf = requestAnimationFrame(this._anim);
    }
  };

  _render() {
    const { ctx, W, H, res, P, heat, coverCanvas, staticCanvas } = this;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(staticCanvas, 0, 0);
    if (heat.active || heat.maxValue > 0) {
      const gridSize = P.grid.size;
      const threshold = P.effect.threshold;
      for (let y = 0; y < H; y += gridSize) {
        for (let x = 0; x < W; x += gridSize) {
          const idx =
            Math.floor((y / H) * res) * res + Math.floor((x / W) * res);
          if (heat.current[idx] > threshold) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, gridSize, gridSize);
            ctx.clip();
            ctx.drawImage(coverCanvas, 0, 0);
            ctx.restore();
          }
        }
      }
    }
  }

  _update() {
    const now = performance.now();
    if (!this.heat.lastTime) {
      this.heat.lastTime = now;
      return;
    }
    const dt = Math.min(30, now - this.heat.lastTime) / 16.67;
    this.heat.lastTime = now;
    const H = this.heat;
    const P = this.P.effect;
    H.maxValue = 0;
    const tempGrid = new Float32Array(this.res * this.res);
    const res = this.res;
    for (let y = 1; y < res - 1; y++) {
      for (let x = 1; x < res - 1; x++) {
        const idx = y * res + x;
        if (
          H.current[idx] < P.threshold &&
          H.current[idx - res] < P.threshold &&
          H.current[idx + res] < P.threshold &&
          H.current[idx - 1] < P.threshold &&
          H.current[idx + 1] < P.threshold
        ) {
          continue;
        }
        const up = H.current[idx - res];
        const down = H.current[idx + res];
        const left = H.current[idx - 1];
        const right = H.current[idx + 1];
        const upLeft = H.current[idx - res - 1];
        const upRight = H.current[idx - res + 1];
        const downLeft = H.current[idx + res - 1];
        const downRight = H.current[idx + res + 1];
        const neighbors =
          (up + down + left + right) * 0.15 +
          (upLeft + upRight + downLeft + downRight) * 0.05;
        tempGrid[idx] =
          H.current[idx] * (1 - P.diffusion) + neighbors * P.diffusion;
        tempGrid[idx] *= P.decay;
        if (tempGrid[idx] < P.threshold) {
          tempGrid[idx] = 0;
        } else {
          H.maxValue = Math.max(H.maxValue, tempGrid[idx]);
        }
      }
    }
    H.current.set(tempGrid);
    for (let i = 0; i < res; i++) {
      H.current[i] *= P.decay;
      H.current[(res - 1) * res + i] *= P.decay;
      H.current[i * res] *= P.decay;
      H.current[i * res + (res - 1)] *= P.decay;
    }
    if (H.maxValue <= P.threshold) {
      this._stop();
    }
  }

  _addHeat(px, py, amount = 1) {
    const nx = (px / this.W) * this.res;
    const ny = (py / this.H) * this.res;
    const rad = this.lowPerformanceMode ? 8 : 12;
    for (let i = -rad; i <= rad; i++) {
      for (let j = -rad; j <= rad; j++) {
        const x = Math.floor(nx + i);
        const y = Math.floor(ny + j);
        if (x < 0 || x >= this.res || y < 0 || y >= this.res) continue;
        const idx = y * this.res + x;
        const d = Math.hypot(i, j);

        if (d <= rad) {
          const intensity = amount * Math.pow(1 - d / rad, 1.5);
          this.heat.current[idx] += intensity;
          this.heat.current[idx] = Math.min(1, this.heat.current[idx]);
          this.heat.maxValue = Math.max(
            this.heat.maxValue,
            this.heat.current[idx]
          );
        }
      }
    }
    this._start();
  }

  _move(e) {
    const now = performance.now();
    if (now - (this._lastEvt || 0) < 30) return;
    this._lastEvt = now;
    const { x, y } = this._coords(e);
    if (this._lastX != null) {
      const d = Math.hypot(x - this._lastX, y - this._lastY);
      if (d > 2) this._addHeat(x, y, Math.min(d * 0.03, 0.8));
    }
    this._lastX = x;
    this._lastY = y;
  }

  _down(e) {
    const { x, y } = this._coords(e);
    this._addHeat(x, y, 1.5);
    this._lastX = x;
    this._lastY = y;
  }

  _leave() {
    this._lastX = this._lastY = null;
  }

  _coords(e) {
    const r = this.canvas.getBoundingClientRect();
    const cx =
      (e.clientX !== undefined ? e.clientX : e.touches[0].clientX) - r.left;
    const cy =
      (e.clientY !== undefined ? e.clientY : e.touches[0].clientY) - r.top;
    return {
      x: cx * (this.W / r.width),
      y: cy * (this.H / r.height)
    };
  }

  _clearHeat() {
    this.heat.current.fill(0);
    this.heat.lastTime = 0;
    this.heat.maxValue = 0;
  }

  destroy() {
    if (this.scrambleTimer) {
      clearInterval(this.scrambleTimer);
    }
    this._stop();
    this.canvas.removeEventListener("pointermove", this._move);
    this.canvas.removeEventListener("pointerdown", this._down);
    this.canvas.removeEventListener("pointerleave", this._leave);
    this.canvas.removeEventListener("pointercancel", this._leave);
    document.removeEventListener("visibilitychange", this._visibilityChange);
  }
}

const image = new TextHeatReveal(
  document.getElementById("canvas"),
  "https://cdn.cosmos.so/a8bf7aec-4414-4a8f-991b-d7d2f970a626?format=jpeg",
  {
    gridSize: 12,
    fontSize: 10,
    characters: "✦❍QWERTYUIOPASDFGHJKLZXCVBNM*+",
    resolution: 96,
    diffusion: 0.92,
    decay: 0.98,
    threshold: 0.04,
    contrast: 1.25,
    minBrightness: 0.15,
    textOpacity: 0.55,
    imageBrightness: 1,
    imageContrast: 1.0,
    scrambleInterval: 1500,
    scrambleAmount: 0.08,
    words: ["CREATE", "INSPIRE", "DESIGN", "IMAGINE", "VISION", "IDEA", "DREAM"]
  }
);

window.addEventListener("beforeunload", () => {
  if (image) image.destroy();
});

document.addEventListener("DOMContentLoaded", () => {
	// Register GSAP Plugins
  gsap.registerPlugin(ScrollTrigger);
  // Parallax Layers
  document.querySelectorAll('[data-parallax-layers]').forEach((triggerElement) => {
    let tl = gsap.timeline({
      scrollTrigger: {
        trigger: triggerElement,
        start: "0% 0%",
        end: "100% 0%",
        scrub: 0
      }
    });
    const layers = [
      { layer: "1", yPercent: 70 },
      { layer: "2", yPercent: 55 },
      { layer: "3", yPercent: 40 },
      { layer: "4", yPercent: 10 }
    ];
    layers.forEach((layerObj, idx) => {
      tl.to(
        triggerElement.querySelectorAll(`[data-parallax-layer="${layerObj.layer}"]`),
        {
          yPercent: layerObj.yPercent,
          ease: "none"
        },
        idx === 0 ? undefined : "<"
      );
    });
  });
});
/* Lenis */
const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {lenis.raf(time * 1000);});
gsap.ticker.lagSmoothing(0);