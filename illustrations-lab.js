const TAU = Math.PI * 2;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const parseHex = (value) => {
  const hex = value.replace("#", "").trim();
  if (hex.length === 3) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
    };
  }
  if (hex.length === 6) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  return null;
};

const parseColor = (value) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("#")) {
    return parseHex(trimmed);
  }
  const match = trimmed.match(/rgba?\\(([^)]+)\\)/);
  if (!match) return null;
  const parts = match[1].split(/[,\\s]+/).filter(Boolean);
  if (parts.length < 3) return null;
  const normalize = (part) => {
    if (part.endsWith("%")) {
      return Math.round(parseFloat(part) * 2.55);
    }
    return Math.round(parseFloat(part));
  };
  return {
    r: normalize(parts[0]),
    g: normalize(parts[1]),
    b: normalize(parts[2]),
  };
};

const withAlpha = (value, alpha) => {
  const rgb = parseColor(value);
  if (!rgb) return value;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

const makeRandom = (seed = 1) => {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

const drawRoundedRect = (ctx, x, y, w, h, r) => {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

const drawGlow = (ctx, x, y, radius, color, alpha = 1) => {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, withAlpha(color, alpha));
  gradient.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
};

const getPalette = () => {
  const styles = getComputedStyle(document.documentElement);
  const getVar = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
  const orange = getVar("--airspace-orange", getVar("--accent-2", "#f59f66"));
  const pink = getVar("--airspace-pink", orange);
  const neutralDark = getVar("--airspace-neutral-dark", getVar("--airspace-ink", "#0a2436"));
  const neutral = getVar("--airspace-neutral", neutralDark);
  const neutralDeep = getVar("--airspace-neutral-deep", neutralDark);
  const skyTop = getVar("--airspace-sky-top", neutralDark);
  const skyBottom = getVar("--airspace-sky-bottom", neutralDeep);
  const green = getVar("--airspace-green", getVar("--accent", "#00c46a"));
  const ink = getVar("--airspace-ink", getVar("--ink", "#0a2436"));
  return { skyTop, skyBottom, orange, pink, green, ink, neutralDark, neutral, neutralDeep };
};

const palette = getPalette();
const primaryAlpha = (alpha) => withAlpha(palette.green, alpha);
const secondaryAlpha = (alpha) => withAlpha(palette.orange, alpha);
const accentAlpha = (alpha) => withAlpha(palette.pink, alpha);
const greenAlpha = (alpha) => withAlpha(palette.green, alpha);

const drawStripeBackdrop = (ctx, w, h, options = {}) => {
  const {
    top = palette.skyTop,
    bottom = palette.skyBottom,
    glowBase = palette.green,
    glowAlpha = 0.35,
    glowX = 0.5,
    glowY = 0.78,
  } = options;
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, top);
  bg.addColorStop(1, bottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const warm = ctx.createRadialGradient(w * glowX, h * glowY, 0, w * glowX, h * glowY, h * 0.7);
  warm.addColorStop(0, withAlpha(glowBase, glowAlpha));
  warm.addColorStop(1, withAlpha(glowBase, 0));
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, w, h);
};

const drawDot = (ctx, x, y, radius, color) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
};

const drawBezier = (ctx, p0, p1, p2, p3) => {
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
  ctx.stroke();
};

const createErrorOverlay = () => {
  let overlay = null;
  return {
    show(message) {
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "debug-overlay";
        document.body.appendChild(overlay);
      }
      overlay.textContent = message;
    },
  };
};

const errorOverlay = createErrorOverlay();

const makePathSampler = (points) => {
  const lengths = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const length = Math.hypot(dx, dy);
    lengths.push(length);
    total += length;
  }
  return {
    pointAt(t) {
      let distance = clamp(t, 0, 1) * total;
      for (let i = 0; i < lengths.length; i += 1) {
        if (distance <= lengths[i]) {
          const local = lengths[i] === 0 ? 0 : distance / lengths[i];
          return {
            x: lerp(points[i].x, points[i + 1].x, local),
            y: lerp(points[i].y, points[i + 1].y, local),
          };
        }
        distance -= lengths[i];
      }
      return points[points.length - 1];
    },
  };
};

const attachPointer = (container, scene) => {
  const onMove = (event) => {
    const rect = container.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    scene.pointer.tx = clamp(x * 2 - 1, -1, 1);
    scene.pointer.ty = clamp(y * 2 - 1, -1, 1);
    scene.pointer.active = true;
  };
  const onLeave = () => {
    scene.pointer.tx = 0;
    scene.pointer.ty = 0;
    scene.pointer.active = false;
  };
  container.addEventListener("pointermove", onMove);
  container.addEventListener("pointerleave", onLeave);
};

const resizeScene = (scene, width, height) => {
  const w = Math.max(1, Math.floor(width));
  const h = Math.max(1, Math.floor(height));
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  scene.w = w;
  scene.h = h;
  scene.dpr = dpr;
  scene.canvas.width = Math.floor(w * dpr);
  scene.canvas.height = Math.floor(h * dpr);
  scene.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (scene.onResize) {
    scene.onResize();
  }
  scene.needsRender = true;
};

const createNfoScene = ({ ctx }) => {
  return {
    render({ w, h, time, pointer }) {
      ctx.clearRect(0, 0, w, h);
      drawStripeBackdrop(ctx, w, h, { glowX: 0.48, glowY: 0.76 });

      const hub = { x: w * 0.56 + pointer.x * 4, y: h * 0.42 + pointer.y * 4 };
      const driverCount = 18;
      const flightCount = 16;
      const driverPick = 7;
      const flightPick = 5;

      const cycle = (time * 0.00032) % 1;
      const driverDur = 0.3;
      const flightDur = 0.32;
      const burstDur = 1 - driverDur - flightDur;
      const driverPhase = clamp(cycle / driverDur, 0, 1);
      const flightPhase = clamp((cycle - driverDur) / flightDur, 0, 1);
      const burstPhase = clamp((cycle - driverDur - flightDur) / burstDur, 0, 1);
      const driverEase = driverPhase * driverPhase * driverPhase;
      const flightEase = flightPhase * flightPhase * flightPhase;
      const burstEase = 1 - Math.pow(1 - burstPhase, 2);

      const cubicPoint = (p0, p1, p2, p3, t) => {
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const uuu = uu * u;
        const ttt = tt * t;
        return {
          x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
          y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
        };
      };

      const drawPartialBezier = (p0, p1, p2, p3, progress) => {
        ctx.beginPath();
        const steps = 20;
        for (let i = 0; i <= steps; i += 1) {
          const t = (progress * i) / steps;
          const point = cubicPoint(p0, p1, p2, p3, t);
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
      };

      ctx.lineWidth = 1.1;
      ctx.strokeStyle = primaryAlpha(0.35);

      const driverLines = [];
      for (let i = 0; i < driverCount; i += 1) {
        const t = i / (driverCount - 1);
        const start = { x: w * 0.08, y: lerp(h * 0.2, h * 0.86, t) };
        const c1 = { x: w * 0.24, y: lerp(h * 0.18, h * 0.82, t) };
        const c2 = { x: w * 0.42, y: lerp(h * 0.22, h * 0.78, t) };
        driverLines.push({ start, c1, c2, end: hub });
        drawBezier(ctx, start, c1, c2, hub);
        drawDot(ctx, start.x, start.y, 2, primaryAlpha(0.7));

        if (i % 3 === 0) {
          const pulseT = (time * 0.00008 + i * 0.11) % 1;
          const pulse = cubicPoint(start, c1, c2, hub, pulseT);
          drawGlow(ctx, pulse.x, pulse.y, 10, palette.green, 0.2);
          drawDot(ctx, pulse.x, pulse.y, 2.2, primaryAlpha(0.35));
        }
      }

      const flightLines = [];
      for (let i = 0; i < flightCount; i += 1) {
        const t = i / (flightCount - 1);
        const end = { x: w * 0.92, y: lerp(h * 0.18, h * 0.72, t) };
        const c1 = { x: hub.x + w * 0.14, y: hub.y - h * 0.18 + t * h * 0.12 };
        const c2 = { x: end.x - w * 0.2, y: end.y - h * 0.08 };
        flightLines.push({ start: hub, c1, c2, end });
        drawBezier(ctx, hub, c1, c2, end);
        drawDot(ctx, end.x, end.y, 2, primaryAlpha(0.7));

        if (i % 4 === 0) {
          const pulseT = (time * 0.00006 + i * 0.17) % 1;
          const pulse = cubicPoint(hub, c1, c2, end, pulseT);
          drawGlow(ctx, pulse.x, pulse.y, 9, palette.green, 0.16);
          drawDot(ctx, pulse.x, pulse.y, 2, primaryAlpha(0.3));
        }
      }

      const chosenDriver = driverLines[Math.min(driverPick, driverLines.length - 1)];
      const chosenFlight = flightLines[Math.min(flightPick, flightLines.length - 1)];
      const auraPulse = 0.22 + 0.08 * (0.5 + 0.5 * Math.sin(time * 0.0012));

      drawGlow(ctx, hub.x, hub.y, 28, palette.orange, auraPulse);
      drawDot(ctx, hub.x, hub.y, 3.6, palette.orange);
      drawGlow(ctx, chosenFlight.end.x, chosenFlight.end.y, 24, palette.orange, auraPulse * 0.7);

      if (driverPhase > 0) {
        ctx.strokeStyle = secondaryAlpha(0.9);
        ctx.lineWidth = 2.4;
        drawPartialBezier(chosenDriver.start, chosenDriver.c1, chosenDriver.c2, chosenDriver.end, driverEase);
        const dot = cubicPoint(
          chosenDriver.start,
          chosenDriver.c1,
          chosenDriver.c2,
          chosenDriver.end,
          driverEase
        );
        drawGlow(ctx, dot.x, dot.y, 20, palette.orange, 0.6);
        drawDot(ctx, dot.x, dot.y, 3.8, palette.orange);
      }

      if (cycle > driverDur) {
        ctx.strokeStyle = secondaryAlpha(0.85);
        ctx.lineWidth = 2.2;
        drawPartialBezier(chosenFlight.start, chosenFlight.c1, chosenFlight.c2, chosenFlight.end, flightEase);
      }

      if (cycle > driverDur) {
        const hubShock = clamp((cycle - driverDur) / 0.25, 0, 1);
        const hubRadius = Math.hypot(w, h) * 0.08 * hubShock;
        const hubAlpha = 0.45 * (1 - hubShock);
        ctx.strokeStyle = secondaryAlpha(hubAlpha);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, hubRadius, 0, TAU);
        ctx.stroke();
      }

      if (burstPhase > 0) {
        const diag = Math.hypot(w, h);
        const launchVector = {
          x: chosenFlight.end.x - hub.x,
          y: chosenFlight.end.y - hub.y,
        };
        const launchAngle = Math.atan2(launchVector.y, launchVector.x);
        const shockProgress = clamp(burstPhase / 0.45, 0, 1);
        const rayProgress = clamp((burstPhase - 0.25) / 0.75, 0, 1);
        const shockRadius = diag * 0.18 * shockProgress;
        const shockAlpha = 0.6 * (1 - shockProgress);

        ctx.strokeStyle = secondaryAlpha(shockAlpha);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(chosenFlight.end.x, chosenFlight.end.y, shockRadius, 0, TAU);
        ctx.stroke();

        const burstCount = 30;
        ctx.lineWidth = 1.4;
        for (let i = 0; i < burstCount; i += 1) {
          const angle = launchAngle + lerp(-0.8, 0.8, i / (burstCount - 1));
          const length = diag * (0.1 + 0.55 * rayProgress);
          const x = chosenFlight.end.x + Math.cos(angle) * length;
          const y = chosenFlight.end.y + Math.sin(angle) * length;
          ctx.strokeStyle = secondaryAlpha(0.25 + rayProgress * 0.6);
          ctx.beginPath();
          ctx.moveTo(chosenFlight.end.x, chosenFlight.end.y);
          ctx.lineTo(x, y);
          ctx.stroke();
        }

        drawGlow(ctx, chosenFlight.end.x, chosenFlight.end.y, 34, palette.orange, 0.2 + rayProgress * 0.35);
        drawGlow(ctx, hub.x, hub.y, 34, palette.orange, 0.2 + rayProgress * 0.2);
      }
    },
  };
};

const createGroundScene = ({ ctx }) => {
  const random = makeRandom(48);
  const cols = 10;
  const rows = 6;
  const marginX = 0.14;
  const marginY = 0.2;
  const jitter = 0;

  const grid = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      grid.push({
        row: r,
        col: c,
        x: lerp(marginX, 1 - marginX, c / (cols - 1)),
        y: lerp(marginY, 1 - marginY, r / (rows - 1)),
        jx: (random() * 2 - 1) * jitter,
        jy: (random() * 2 - 1) * jitter,
      });
    }
  }

  const indexFor = (row, col) => row * cols + col;

  let orangeIndex = 0;
  let minDist = Infinity;
  grid.forEach((point, index) => {
    const dx = point.x - 0.5;
    const dy = point.y - 0.5;
    const dist = dx * dx + dy * dy;
    if (dist < minDist) {
      minDist = dist;
      orangeIndex = index;
    }
  });

  let route = [];
  let segmentIndex = 0;
  let segmentTimer = 0;
  let lastTime = 0;

  const buildRoute = () => {
    let start = Math.floor(random() * grid.length);
    if (start === orangeIndex) start = (start + 1) % grid.length;

    route = [start];
    let current = start;
    const target = grid[orangeIndex];
    let guard = 0;
    while (
      (grid[current].row !== target.row || grid[current].col !== target.col) &&
      guard < rows * cols
    ) {
      const stepRow = Math.sign(target.row - grid[current].row);
      const stepCol = Math.sign(target.col - grid[current].col);
      const nextRow = grid[current].row + stepRow;
      const nextCol = grid[current].col + stepCol;
      const next = indexFor(nextRow, nextCol);
      route.push(next);
      current = next;
      guard += 1;
    }
    segmentIndex = 0;
    segmentTimer = 0;
  };

  buildRoute();

  return {
    render({ w, h, time, pointer }) {
      ctx.clearRect(0, 0, w, h);
      drawStripeBackdrop(ctx, w, h, { glowBase: palette.green, glowAlpha: 0.18, glowX: 0.55, glowY: 0.62 });

      const fieldShiftX = pointer.x * 6;
      const fieldShiftY = pointer.y * 5;

      grid.forEach((point, index) => {
        const x = (point.x + point.jx) * w + fieldShiftX;
        const y = (point.y + point.jy) * h + fieldShiftY;
        if (index === orangeIndex) return;
        drawDot(ctx, x, y, 2.1, primaryAlpha(0.65));
      });

      if (lastTime === 0) {
        lastTime = time;
      }
      const dt = Math.max(0, time - lastTime);
      lastTime = time;
      const burstDuration = 180;
      const holdDuration = 90;
      const segmentTotal = burstDuration + holdDuration;
      segmentTimer += dt;
      while (segmentTimer >= segmentTotal) {
        segmentTimer -= segmentTotal;
        segmentIndex += 1;
        if (segmentIndex >= route.length - 1) {
          buildRoute();
          break;
        }
      }
      const inBurst = segmentTimer <= burstDuration;
      const burstPhase = clamp(segmentTimer / burstDuration, 0, 1);

      if (route.length > 1) {
        const from = grid[route[segmentIndex]];
        const to = grid[route[segmentIndex + 1]];
        const ax = (from.x + from.jx) * w + fieldShiftX;
        const ay = (from.y + from.jy) * h + fieldShiftY;
        const bx = (to.x + to.jx) * w + fieldShiftX;
        const by = (to.y + to.jy) * h + fieldShiftY;
        const progress = inBurst ? easeInOut(burstPhase) : 1;
        const headX = lerp(ax, bx, progress);
        const headY = lerp(ay, by, progress);

        ctx.strokeStyle = secondaryAlpha(0.5);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        const startPoint = grid[route[0]];
        ctx.moveTo((startPoint.x + startPoint.jx) * w + fieldShiftX, (startPoint.y + startPoint.jy) * h + fieldShiftY);
        for (let i = 1; i <= segmentIndex; i += 1) {
          const point = grid[route[i]];
          ctx.lineTo((point.x + point.jx) * w + fieldShiftX, (point.y + point.jy) * h + fieldShiftY);
        }
        ctx.lineTo(headX, headY);
        ctx.stroke();

        drawGlow(ctx, headX, headY, 14, palette.orange, 0.4);
        drawDot(ctx, headX, headY, 3, palette.orange);
      }

      const orangePoint = grid[orangeIndex];
      const ox = (orangePoint.x + orangePoint.jx) * w + fieldShiftX;
      const oy = (orangePoint.y + orangePoint.jy) * h + fieldShiftY;
      const pulse = 0.5 + 0.5 * Math.sin(time * 0.0022);
      drawGlow(ctx, ox, oy, 20 + pulse * 8, palette.orange, 0.55);
      drawDot(ctx, ox, oy, 3.6, palette.orange);
    },
  };
};

const createCharterScene = ({ ctx }) => {
  const ringCount = 9;
  const ringRadii = Array.from({ length: ringCount }, () => 0);
  let lastW = 0;
  let lastH = 0;

  return {
    render({ w, h, time, pointer }) {
      ctx.clearRect(0, 0, w, h);
      drawStripeBackdrop(ctx, w, h, { glowX: 0.5, glowY: 0.62 });

      const baseX = w * 0.5;
      const baseY = h * 0.5;
      const minDim = Math.min(w, h);
      const maxRadius = Math.hypot(w, h) * 0.5;
      const minRadius = minDim * 0.08;
      const ringGap = (maxRadius - minRadius) / (ringCount - 1);
      const minGap = ringGap * 0.65;
      const dotPadding = ringGap * 0.4 + 6;

      if (w !== lastW || h !== lastH || ringRadii[0] === 0) {
        for (let i = 0; i < ringCount; i += 1) {
          ringRadii[i] = minRadius + ringGap * i;
        }
        lastW = w;
        lastH = h;
      }

      const autoPhase = time * 0.0007;
      const autoX = Math.sin(autoPhase) * 0.85;
      const autoY = Math.cos(autoPhase * 0.9 + 1.2) * 0.7;
      const motionX = pointer.active ? pointer.x : autoX;
      const motionY = pointer.active ? pointer.y : autoY;
      const desiredX = baseX + motionX * w * 0.18;
      const desiredY = baseY + motionY * h * 0.18;
      const desiredDx = desiredX - baseX;
      const desiredDy = desiredY - baseY;
      const desiredDist = Math.hypot(desiredDx, desiredDy);
      const influenceBand = ringGap * 2.2;

      for (let i = 0; i < ringCount; i += 1) {
        const baseRadius = minRadius + ringGap * i;
        const floatOffset =
          Math.sin(time * 0.0003 + i * 1.4) * ringGap * 0.08 +
          Math.cos(time * 0.00017 + i * 0.9) * ringGap * 0.05;
        const delta = desiredDist - baseRadius;
        const influence = clamp(1 - Math.abs(delta) / influenceBand, 0, 1);
        const bump = delta * influence * 0.25;
        let target = baseRadius + floatOffset + bump;

        if (i === 0) {
          target = Math.max(target, desiredDist + dotPadding);
        } else {
          target = Math.max(target, ringRadii[i - 1] + minGap);
        }

        ringRadii[i] += (target - ringRadii[i]) * 0.12;
      }

      const maxDotDist = Math.max(ringRadii[0] - dotPadding, 0);
      const clampedDist = Math.min(desiredDist, maxDotDist);
      const ratio = desiredDist > 0 ? clampedDist / desiredDist : 0;
      const dotX = baseX + desiredDx * ratio;
      const dotY = baseY + desiredDy * ratio;

      for (let i = 0; i < ringCount; i += 1) {
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = primaryAlpha(Math.min(0.22 + i * 0.03, 0.55));
        ctx.beginPath();
        ctx.arc(baseX, baseY, ringRadii[i], 0, TAU);
        ctx.stroke();
      }

      const pulse = 0.5 + 0.5 * Math.sin(time * 0.0012);
      drawGlow(ctx, dotX, dotY, 46 + pulse * 8, palette.orange, 0.22);
      drawDot(ctx, dotX, dotY, 4.2, palette.orange);
    },
  };
};

const createSpecialtyScene = ({ ctx }) => {
  const state = {
    dots: [],
    cycleStart: 0,
    cycleIndex: 0,
    fillRatio: 0,
    direction: 1,
    outcomeColor: palette.green,
    lastW: 0,
    lastH: 0,
  };

  const buildGrid = (w, h) => {
    const spacing = clamp(Math.min(w, h) * 0.085, 18, 26);
    const cols = Math.max(10, Math.floor(w / spacing) + 1);
    const rows = Math.max(6, Math.floor(h / spacing) + 1);
    const gridW = (cols - 1) * spacing;
    const gridH = (rows - 1) * spacing;
    const startX = (w - gridW) / 2;
    const startY = (h - gridH) / 2;

    state.dots = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const phase = ((r * 37 + c * 23) % 100) / 100;
        state.dots.push({
          x: startX + c * spacing,
          y: startY + r * spacing,
          filled: false,
          stagger: 0,
          phase,
        });
      }
    }
  };

  const resetCycle = (now) => {
    state.cycleStart = now;
    state.cycleIndex += 1;
    const seed = Math.floor(Math.random() * 2147483646) || 1;
    const rand = makeRandom(seed);
    const fillProbability = 0.25 + rand() * 0.5;
    let filledCount = 0;
    state.dots.forEach((dot) => {
      dot.filled = rand() < fillProbability;
      dot.stagger = rand() * 0.6;
      if (dot.filled) filledCount += 1;
    });
    state.fillRatio = state.dots.length ? filledCount / state.dots.length : 0;
    if (state.fillRatio <= 0.5) {
      state.outcomeColor = palette.green;
      state.direction = 1;
    } else {
      state.outcomeColor = palette.pink;
      state.direction = -1;
    }
  };

  const fillDuration = 1600;
  const flyDuration = 1000;
  const cycleDuration = fillDuration + flyDuration;

  return {
    render({ w, h, time }) {
      ctx.clearRect(0, 0, w, h);
      drawStripeBackdrop(ctx, w, h, { glowX: 0.55, glowY: 0.7 });

      if (w !== state.lastW || h !== state.lastH || state.dots.length === 0) {
        buildGrid(w, h);
        state.lastW = w;
        state.lastH = h;
        resetCycle(time);
      }

      let elapsed = time - state.cycleStart;
      if (elapsed >= cycleDuration) {
        resetCycle(time);
        elapsed = 0;
      }

      const inFill = elapsed < fillDuration;
      const fillProgress = clamp(elapsed / fillDuration, 0, 1);
      const flyProgress = clamp((elapsed - fillDuration) / flyDuration, 0, 1);
      const eased = easeInOut(flyProgress);
      const offsetX = state.direction * w * 1.15 * eased;
      const emptyColor = withAlpha(palette.orange, 0.22);
      const flyColor = withAlpha(state.outcomeColor, 0.95);

      state.dots.forEach((dot) => {
        const x = dot.x + offsetX;
        if (inFill) {
          if (dot.filled) {
            const appear = clamp((fillProgress - dot.stagger) / 0.4, 0, 1);
            const easedAppear = easeInOut(appear);
            const glowPulse = 0.6 + 0.4 * Math.sin(time * 0.006 + dot.phase * TAU);
            const glowAlpha = 0.2 * easedAppear * glowPulse;
            if (glowAlpha > 0.01) {
              drawDot(ctx, x, dot.y, 4.2, withAlpha(palette.orange, glowAlpha));
            }
            drawDot(ctx, x, dot.y, 1.9, withAlpha(palette.orange, 0.2 + 0.75 * easedAppear));
          } else {
            drawDot(ctx, x, dot.y, 1.9, emptyColor);
          }
        } else {
          drawDot(ctx, x, dot.y, 1.9, flyColor);
        }
      });
    },
  };
};

const createSpeedScene = ({ ctx, container }) => {
  const random = makeRandom(24);
  const fieldDots = Array.from({ length: 48 }, () => ({
    x: random(),
    y: random(),
    radius: 0.7 + random() * 1.6,
    alpha: 0.12 + random() * 0.2,
    phase: random() * TAU,
  }));
  const burstParticles = Array.from({ length: 10 }, () => ({
    angle: random() * TAU,
    speed: 0.6 + random() * 0.6,
  }));

  const state = {
    grid: [],
    lastW: 0,
    lastH: 0,
    card: null,
    cardTitle: null,
    cardBody: null,
    cardMeta: null,
    cardAnchor: { leftX: 0, rightX: 0, centerX: 0, centerY: 0 },
    lastStateIndex: -1,
    flipTimer: null,
    flipReset: null,
  };

  const cardStates = [
    { title: "Placing Order", body: "Optimizing Route", meta: "Generating Quote" },
    { title: "Order placed", body: "Dispatch queued", meta: "Tracking enabled" },
    { title: "Current ETA", body: "01:42 PM", meta: "On schedule" },
    { title: "Current departed", body: "SAN -> PHX", meta: "" },
  ];

  const stateDurations = [1700, 1500, 1800, 1800];
  const totalDuration = stateDurations.reduce((sum, value) => sum + value, 0);

  const ensureCard = () => {
    if (state.card) return;
    state.card = container ? container.querySelector(".overlay--speed .card") : null;
    if (!state.card) return;
    state.cardTitle = state.card.querySelector(".card-title");
    state.cardBody = state.card.querySelector(".card-body");
    state.cardMeta = state.card.querySelector(".card-meta");
  };

  const updateCardMetrics = () => {
    ensureCard();
    if (!state.card || !container) return;
    const containerRect = container.getBoundingClientRect();
    const cardRect = state.card.getBoundingClientRect();
    state.cardAnchor = {
      leftX: cardRect.left - containerRect.left,
      rightX: cardRect.right - containerRect.left,
      centerX: cardRect.left - containerRect.left + cardRect.width / 2,
      centerY: cardRect.top - containerRect.top + cardRect.height / 2,
    };
  };

  const setCardState = (index, options = {}) => {
    ensureCard();
    const next = cardStates[index % cardStates.length];
    if (!state.card || !next) return;
    if (prefersReducedMotion || options.immediate) {
      state.card.classList.remove("is-flipping");
      if (state.cardTitle) state.cardTitle.textContent = next.title;
      if (state.cardBody) state.cardBody.textContent = next.body;
      if (state.cardMeta) {
        state.cardMeta.textContent = next.meta;
        state.cardMeta.style.display = next.meta ? "block" : "none";
      }
      return;
    }
    window.clearTimeout(state.flipTimer);
    window.clearTimeout(state.flipReset);
    state.card.classList.add("is-flipping");
    state.flipTimer = window.setTimeout(() => {
      if (state.cardTitle) state.cardTitle.textContent = next.title;
      if (state.cardBody) state.cardBody.textContent = next.body;
      if (state.cardMeta) {
        state.cardMeta.textContent = next.meta;
        state.cardMeta.style.display = next.meta ? "block" : "none";
      }
    }, 240);
    state.flipReset = window.setTimeout(() => {
      state.card.classList.remove("is-flipping");
    }, 700);
  };

  const buildGrid = (w, h) => {
    const columns = 10;
    const rows = 6;
    const left = w * 0.12;
    const right = w * 0.72;
    const top = h * 0.2;
    const bottom = h * 0.8;
    const nextGrid = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < columns; c += 1) {
        const x = lerp(left, right, columns === 1 ? 0.5 : c / (columns - 1));
        const y = lerp(top, bottom, rows === 1 ? 0.5 : r / (rows - 1));
        nextGrid.push({
          x,
          y,
          phase: random() * TAU,
          scan: c / (columns - 1) * 0.7 + r / (rows - 1) * 0.3,
        });
      }
    }
    state.grid = nextGrid;
  };

  const getState = (time) => {
    let t = time % totalDuration;
    for (let i = 0; i < stateDurations.length; i += 1) {
      const duration = stateDurations[i];
      if (t <= duration) {
        return { index: i, progress: duration === 0 ? 0 : t / duration };
      }
      t -= duration;
    }
    return { index: 0, progress: 0 };
  };

  const drawField = (w, h, time) => {
    fieldDots.forEach((dot) => {
      const driftX = Math.sin(time * 0.0004 + dot.phase) * 6;
      const driftY = Math.cos(time * 0.0003 + dot.phase) * 4;
      drawDot(
        ctx,
        dot.x * w + driftX,
        dot.y * h + driftY,
        dot.radius,
        withAlpha(palette.orange, dot.alpha)
      );
    });
  };

  return {
    onResize() {
      updateCardMetrics();
    },
    render({ w, h, time, pointer }) {
      ctx.clearRect(0, 0, w, h);
      drawStripeBackdrop(ctx, w, h, { glowX: 0.48, glowY: 0.76, glowAlpha: 0.32 });

      if (w !== state.lastW || h !== state.lastH || state.grid.length === 0) {
        buildGrid(w, h);
        updateCardMetrics();
        state.lastW = w;
        state.lastH = h;
      }

      const timeline = getState(time);
      if (timeline.index !== state.lastStateIndex) {
        setCardState(timeline.index, { immediate: state.lastStateIndex === -1 });
        state.lastStateIndex = timeline.index;
      }

      const cardAnchor = state.cardAnchor || {};
      const cardLeftX = Number.isFinite(cardAnchor.leftX) && cardAnchor.leftX > 0 ? cardAnchor.leftX : w * 0.64;
      const cardCenterY =
        Number.isFinite(cardAnchor.centerY) && cardAnchor.centerY > 0 ? cardAnchor.centerY : h * 0.5;
      const leftOfCardX = cardLeftX - w * 0.05;
      const leftOfCardY = cardCenterY + pointer.y * 4;
      const dartTargetX = w * 0.12;
      const dartTargetY = h * 0.32 + pointer.y * 8;

      drawField(w, h, time);

      if (timeline.index === 0) {
        const scan = (time * 0.0002) % 1;
        state.grid.forEach((dot) => {
          const driftX = Math.sin(time * 0.001 + dot.phase) * 2 + pointer.x * 4;
          const driftY = Math.cos(time * 0.0011 + dot.phase) * 2 + pointer.y * 3;
          const scanBoost = Math.max(0, 1 - Math.abs(dot.scan - scan) * 4);
          const pulse = (Math.sin(time * 0.002 + dot.phase) + 1) * 0.5;
          const alpha = 0.18 + pulse * 0.2 + scanBoost * 0.55;
          const radius = 1.2 + scanBoost * 1.4;
          drawDot(ctx, dot.x + driftX, dot.y + driftY, radius, withAlpha(palette.orange, alpha));
        });
      } else if (timeline.index === 1) {
        const collapse = easeInOut(timeline.progress);
        const targetX = leftOfCardX;
        const targetY = leftOfCardY;
        state.grid.forEach((dot) => {
          const x = lerp(dot.x, targetX, collapse);
          const y = lerp(dot.y, targetY, collapse);
          const alpha = lerp(0.16, 0.92, collapse);
          const radius = lerp(1.2, 2.8, collapse);
          drawDot(ctx, x, y, radius, withAlpha(palette.orange, alpha));
        });
        drawGlow(ctx, targetX, targetY, 26, palette.orange, 0.4 + 0.25 * collapse);
      } else if (timeline.index === 2) {
        const dash = easeInOut(timeline.progress);
        const arc = Math.sin(timeline.progress * Math.PI) * h * 0.08;
        const x = lerp(leftOfCardX, dartTargetX, dash);
        const y = lerp(leftOfCardY, dartTargetY, dash) - arc;

        ctx.strokeStyle = withAlpha(palette.orange, 0.25);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(leftOfCardX, leftOfCardY);
        ctx.lineTo(dartTargetX, dartTargetY);
        ctx.stroke();

        for (let i = 0; i < 6; i += 1) {
          const trailT = clamp(timeline.progress - i * 0.08, 0, 1);
          const trailEase = easeInOut(trailT);
          const trailArc = Math.sin(trailT * Math.PI) * h * 0.08;
          const tx = lerp(leftOfCardX, dartTargetX, trailEase);
          const ty = lerp(leftOfCardY, dartTargetY, trailEase) - trailArc;
          drawDot(ctx, tx, ty, 2.4 - i * 0.2, withAlpha(palette.orange, 0.45 - i * 0.06));
        }

        drawGlow(ctx, x, y, 22, palette.orange, 0.6);
        drawDot(ctx, x, y, 3.2, palette.orange);
      } else {
        const launch = Math.pow(timeline.progress, 0.65);
        const exitX = w * 1.15;
        const exitY = h * 0.12;
        const x = lerp(dartTargetX, exitX, launch);
        const y = lerp(dartTargetY, exitY, launch) - Math.sin(timeline.progress * Math.PI) * h * 0.05;

        const shock = easeInOut(timeline.progress);
        ctx.strokeStyle = withAlpha(palette.orange, 0.4 * (1 - shock));
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(dartTargetX, dartTargetY, shock * Math.min(w, h) * 0.42, 0, TAU);
        ctx.stroke();

        burstParticles.forEach((particle) => {
          const distance = shock * (Math.min(w, h) * 0.22) * particle.speed;
          const px = dartTargetX + Math.cos(particle.angle) * distance;
          const py = dartTargetY + Math.sin(particle.angle) * distance;
          drawDot(ctx, px, py, 1.6, withAlpha(palette.orange, 0.5 * (1 - shock)));
        });

        drawGlow(ctx, x, y, 26, palette.orange, 0.65 * (1 - timeline.progress));
        drawDot(ctx, x, y, 3.4, palette.orange);
      }
    },
  };
};

const createPrecisionScene = ({ ctx }) => {
  return {
    render({ w, h, time }) {
      ctx.clearRect(0, 0, w, h);
      drawStripeBackdrop(ctx, w, h, { glowX: 0.55, glowY: 0.72 });

      const startX = -w * 0.1;
      const endX = w * 1.1;
      const baseY = h * 0.62;
      const amplitude = h * 0.18;
      const count = 52;

      ctx.strokeStyle = primaryAlpha(0.35);
      ctx.lineWidth = 1;
      for (let i = 0; i < count; i += 1) {
        const t = i / (count - 1);
        const x = lerp(startX, endX, t);
        const y = baseY - Math.sin(t * TAU * 1.1 + time * 0.0006) * amplitude;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + h * 0.28);
        ctx.stroke();
        drawDot(ctx, x, y, 2.1, secondaryAlpha(0.85));
      }

      ctx.strokeStyle = primaryAlpha(0.6);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < count; i += 1) {
        const t = i / (count - 1);
        const x = lerp(startX, endX, t);
        const y = baseY - Math.sin(t * TAU * 1.1 + time * 0.0006) * amplitude;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const pingPong = (time * 0.00022) % 2;
      const focusT = pingPong <= 1 ? pingPong : 2 - pingPong;
      const fx = lerp(startX, endX, focusT);
      const fy = baseY - Math.sin(focusT * TAU * 1.1 + time * 0.0006) * amplitude;
      drawGlow(ctx, fx, fy, 24, palette.orange, 0.55);
      drawDot(ctx, fx, fy, 3.4, palette.orange);
    },
  };
};

const createVisibilityScene = ({ ctx, container }) => {
  const random = makeRandom(52);
  const fieldDots = Array.from({ length: 64 }, () => ({
    x: random(),
    y: random(),
    radius: 0.7 + random() * 1.5,
    alpha: 0.08 + random() * 0.22,
    drift: random() * TAU,
  }));
  const pulses = [];
  const cardStates = [
    { title: "Live Update", body: "Status synced", meta: "Just now" },
    { title: "Drop Confirmed", body: "Location locked", meta: "Realtime ping" },
    { title: "Visibility", body: "Signal refreshed", meta: "T+00:08" },
    { title: "Tracking", body: "Route aligned", meta: "Instant sync" },
    { title: "Update", body: "New scan", meta: "T+00:12" },
    { title: "Status Pulse", body: "Package active", meta: "Now" },
  ];

  const state = {
    nextPulse: 0,
    cardIndex: 0,
    overlay: null,
    cardStack: null,
  };

  const ensureOverlay = () => {
    if (state.overlay || !container) return;
    state.overlay = container.querySelector(".overlay--visibility");
    state.cardStack = state.overlay ? state.overlay.querySelector(".card-stack") : null;
  };

  const spawnCards = (nx, ny, w, h) => {
    ensureOverlay();
    if (!state.cardStack) return;
    const count = prefersReducedMotion ? 1 : 2 + Math.floor(random() * 3);
    for (let i = 0; i < count; i += 1) {
      const data = cardStates[state.cardIndex % cardStates.length];
      state.cardIndex += 1;
      const card = document.createElement("div");
      card.className = "card visibility-card";
      card.innerHTML = `
        <p class="card-title">${data.title}</p>
        <p class="card-body">${data.body}</p>
        <span class="card-meta">${data.meta}</span>
      `;

      const jitterX = (random() - 0.5) * 120;
      const jitterY = (random() - 0.5) * 80;
      const baseX = nx * w + jitterX;
      const baseY = ny * h + jitterY;
      const safeX = clamp(baseX, 90, w - 90);
      const safeY = clamp(baseY, 50, h - 50);
      card.style.left = `${safeX}px`;
      card.style.top = `${safeY}px`;

      const driftX = (random() - 0.5) * 26;
      const driftY = -18 - random() * 20;
      card.style.setProperty("--drift-x", `${driftX}px`);
      card.style.setProperty("--drift-y", `${driftY}px`);

      const delay = prefersReducedMotion ? 0 : i * 90;
      card.style.animationDelay = `${delay}ms`;
      state.cardStack.appendChild(card);

      const lifespan = prefersReducedMotion ? 2200 : 1600 + delay;
      window.setTimeout(() => {
        card.remove();
      }, lifespan);
    }

    while (state.cardStack.childElementCount > 16) {
      state.cardStack.removeChild(state.cardStack.firstElementChild);
    }
  };

  const spawnPulse = (time, w, h) => {
    const nx = 0.16 + random() * 0.68;
    const ny = 0.22 + random() * 0.56;
    pulses.push({ nx, ny, start: time, seed: random() * TAU });
    if (pulses.length > 7) pulses.shift();
    spawnCards(nx, ny, w, h);
  };

  return {
    render({ w, h, time, paused, lowPower }) {
      ctx.clearRect(0, 0, w, h);
      drawStripeBackdrop(ctx, w, h, { glowX: 0.45, glowY: 0.75 });

      ctx.lineWidth = 1;
      ctx.strokeStyle = primaryAlpha(0.16);
      ctx.setLineDash([2, 6]);
      ctx.lineDashOffset = -time * 0.04;

      const laneCount = 6;
      for (let i = 0; i < laneCount; i += 1) {
        const t = i / (laneCount - 1);
        const y = lerp(h * 0.2, h * 0.82, t);
        ctx.beginPath();
        ctx.moveTo(w * 0.12, y);
        ctx.lineTo(w * 0.88, y);
        ctx.stroke();

        const dotCount = 5;
        for (let j = 0; j < dotCount; j += 1) {
          if ((i + j) % 2 !== 0) continue;
          const dt = j / (dotCount - 1);
          const x = lerp(w * 0.14, w * 0.86, dt);
          drawDot(ctx, x, y, 1.6, primaryAlpha(0.22));
        }
      }
      ctx.setLineDash([]);

      fieldDots.forEach((dot) => {
        const wobble = Math.sin(time * 0.0005 + dot.drift) * 4;
        drawDot(ctx, dot.x * w + wobble, dot.y * h, dot.radius, primaryAlpha(dot.alpha));
      });

      if (!paused) {
        if (state.nextPulse === 0) {
          state.nextPulse = time + 300;
        }
        const interval = prefersReducedMotion || lowPower ? 1800 : 700 + random() * 500;
        if (time >= state.nextPulse) {
          spawnPulse(time, w, h);
          state.nextPulse = time + interval;
        }
      }

      const pulseDuration = 1500;
      const maxRadius = Math.min(w, h) * 0.42;
      for (let i = pulses.length - 1; i >= 0; i -= 1) {
        const pulse = pulses[i];
        const age = time - pulse.start;
        const progress = age / pulseDuration;
        if (progress > 1.35) {
          pulses.splice(i, 1);
          continue;
        }

        const x = pulse.nx * w;
        const y = pulse.ny * h;
        const ringCount = 3;
        for (let r = 0; r < ringCount; r += 1) {
          const ringT = progress - r * 0.18;
          if (ringT < 0 || ringT > 1) continue;
          const radius = ringT * maxRadius + r * 8;
          const alpha = (1 - ringT) * (0.32 - r * 0.05);
          ctx.strokeStyle = withAlpha(palette.orange, clamp(alpha, 0, 0.35));
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, TAU);
          ctx.stroke();

          const tickAngle = pulse.seed + ringT * TAU * 0.35;
          const tx = x + Math.cos(tickAngle) * radius;
          const ty = y + Math.sin(tickAngle) * radius;
          drawDot(ctx, tx, ty, 2.1, secondaryAlpha(0.75));
        }

        if (progress < 0.28) {
          const glowStrength = 1 - progress / 0.28;
          drawGlow(ctx, x, y, 32 + glowStrength * 12, palette.orange, 0.25 + glowStrength * 0.25);
          drawDot(ctx, x, y, 3.4, palette.orange);
        }
      }
    },
  };
};

const createControlScene = ({ ctx }) => {
  const random = makeRandom(37);
  const branchTargets = [
    { x: 0.76, y: 0.14 },
    { x: 0.8, y: 0.22 },
    { x: 0.84, y: 0.3 },
    { x: 0.87, y: 0.38 },
    { x: 0.9, y: 0.46 },
    { x: 0.9, y: 0.54 },
    { x: 0.87, y: 0.62 },
    { x: 0.84, y: 0.7 },
    { x: 0.8, y: 0.78 },
    { x: 0.76, y: 0.86 },
  ];
  let targetIndex = Math.floor(random() * branchTargets.length);
  let direction = 1;
  let segmentIndex = 0;
  let segmentTimer = 0;
  let lastTime = 0;
  const segmentDuration = 1400;
  const holdDuration = 180;

  const pickNextTarget = () => {
    if (branchTargets.length <= 1) {
      targetIndex = 0;
      return;
    }
    let next = Math.floor(random() * branchTargets.length);
    if (next === targetIndex) {
      next = (next + 1) % branchTargets.length;
    }
    targetIndex = next;
  };

  const cubicPoint = (p0, p1, p2, p3, t) => {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    return {
      x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
      y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
    };
  };

  const sampleSegment = (segment, t, reverse = false) => {
    const localT = reverse ? 1 - t : t;
    return cubicPoint(segment.start, segment.c1, segment.c2, segment.end, localT);
  };

  return {
    render({ w, h, time, pointer }) {
      ctx.clearRect(0, 0, w, h);
      drawStripeBackdrop(ctx, w, h, { glowX: 0.5, glowY: 0.72 });

      const originX = w * 0.2 + pointer.x * 6;
      const originY = h * 0.6 + pointer.y * 4;
      const branchX = w * 0.52;
      const branchY = h * 0.48;

      const trunkStart = { x: originX, y: originY };
      const trunkEnd = { x: branchX, y: branchY };
      const trunk = {
        start: trunkStart,
        c1: {
          x: lerp(trunkStart.x, trunkEnd.x, 0.35),
          y: lerp(trunkStart.y, trunkEnd.y, 0.35),
        },
        c2: {
          x: lerp(trunkStart.x, trunkEnd.x, 0.7),
          y: lerp(trunkStart.y, trunkEnd.y, 0.7),
        },
        end: trunkEnd,
      };

      const endpoints = branchTargets.map((target) => ({
        x: w * target.x,
        y: h * target.y,
      }));

      const branches = endpoints.map((end) => {
        const start = { x: branchX, y: branchY };
        return {
          start,
          c1: {
            x: lerp(start.x, end.x, 0.4),
            y: lerp(start.y, end.y, 0.4),
          },
          c2: {
            x: lerp(start.x, end.x, 0.75),
            y: lerp(start.y, end.y, 0.75),
          },
          end,
        };
      });

      ctx.lineWidth = 1.2;
      ctx.strokeStyle = primaryAlpha(0.55);
      ctx.setLineDash([3, 7]);
      ctx.lineDashOffset = -time * 0.05;

      drawBezier(ctx, trunk.start, trunk.c1, trunk.c2, trunk.end);
      branches.forEach((branch) => {
        drawBezier(ctx, branch.start, branch.c1, branch.c2, branch.end);
      });

      ctx.setLineDash([]);
      drawDot(ctx, originX, originY, 3.2, palette.green);
      drawDot(ctx, branchX, branchY, 3.2, palette.green);
      endpoints.forEach((end) => {
        drawDot(ctx, end.x, end.y, 3.1, palette.green);
      });

      if (lastTime === 0) {
        lastTime = time;
      }
      const dt = Math.max(0, time - lastTime);
      lastTime = time;
      segmentTimer += dt;

      const segmentTotal = segmentDuration + holdDuration;
      while (segmentTimer >= segmentTotal) {
        segmentTimer -= segmentTotal;
        segmentIndex += 1;
        if (segmentIndex >= 2) {
          segmentIndex = 0;
          if (direction === 1) {
            direction = -1;
          } else {
            direction = 1;
            pickNextTarget();
          }
        }
      }

      const activeBranch = branches[targetIndex] || branches[0];
      const travelSegments =
        direction === 1
          ? [
              { segment: trunk, reverse: false },
              { segment: activeBranch, reverse: false },
            ]
          : [
              { segment: activeBranch, reverse: true },
              { segment: trunk, reverse: true },
            ];

      const travel = travelSegments[segmentIndex] || travelSegments[0];
      const progress = clamp(segmentTimer / segmentDuration, 0, 1);
      const eased = easeInOut(progress);
      const point = sampleSegment(travel.segment, eased, travel.reverse);

      drawGlow(ctx, point.x, point.y, 18, palette.orange, 0.55);
      drawDot(ctx, point.x, point.y, 3.2, palette.orange);
    },
  };
};

const createSavingsScene = ({ ctx }) => {
  const random = makeRandom(17);
  const lineCount = 22;
  const lineConfigs = Array.from({ length: lineCount }, (_, index) => {
    const spread = lerp(-1, 1, index / (lineCount - 1));
    return {
      spread,
      amp: lerp(0.02, 0.06, random()),
      amp2: lerp(0.015, 0.045, random()),
      freq: lerp(3.4, 6.6, random()),
      freq2: lerp(6.8, 11.4, random()),
      phase: random() * TAU,
      phase2: random() * TAU,
      speed: lerp(0.0002, 0.00055, random()),
      dashOffset: random() * 18,
    };
  });

  return {
    render({ w, h, time, pointer }) {
      ctx.clearRect(0, 0, w, h);
      drawStripeBackdrop(ctx, w, h, { glowX: 0.52, glowY: 0.76 });

      const leftX = -w * 0.06;
      const rightX = w * 0.9;
      const startY = h * 0.3;
      const endY = h * 0.74;
      const steps = 44;

      const baseCurve = (t) => {
        const eased = easeInOut(t);
        const slope = lerp(startY, endY, eased);
        const sway = Math.sin(t * TAU * 0.7 + 1.1) * h * 0.015;
        return slope + sway;
      };

      ctx.lineWidth = 1.1;
      ctx.setLineDash([3, 7]);

      lineConfigs.forEach((line) => {
        const centerWeight = 1 - Math.abs(line.spread);
        const alpha = lerp(0.16, 0.42, centerWeight);
        ctx.strokeStyle = primaryAlpha(alpha);
        ctx.lineDashOffset = -(time * 0.04 + line.dashOffset);
        ctx.beginPath();
        for (let i = 0; i < steps; i += 1) {
          const t = i / (steps - 1);
          const x = lerp(leftX, rightX, t);
          const falloff = Math.pow(1 - t, 1.7);
          const offset = line.spread * h * 0.12 * falloff;
          const wiggle =
            Math.sin(t * line.freq + line.phase + time * line.speed) * h * line.amp * falloff +
            Math.sin(t * line.freq2 + line.phase2) * h * line.amp2 * falloff;
          const y = baseCurve(t) + offset + wiggle;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      ctx.setLineDash([]);
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = primaryAlpha(0.75);
      ctx.beginPath();
      for (let i = 0; i < steps; i += 1) {
        const t = i / (steps - 1);
        const x = lerp(leftX, rightX, t);
        const y = baseCurve(t);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.lineWidth = 2;
      ctx.strokeStyle = secondaryAlpha(0.75);
      ctx.beginPath();
      for (let i = Math.floor(steps * 0.6); i < steps; i += 1) {
        const t = i / (steps - 1);
        const x = lerp(leftX, rightX, t);
        const y = baseCurve(t);
        if (i === Math.floor(steps * 0.6)) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const pulseT = (time * 0.00018) % 1;
      const pulseX = lerp(leftX, rightX, pulseT);
      const pulseY = baseCurve(pulseT);
      drawGlow(ctx, pulseX, pulseY, 24, palette.orange, 0.45);
      drawDot(ctx, pulseX, pulseY, 3.4, palette.orange);

      drawGlow(ctx, rightX - w * 0.02, baseCurve(1), 36, palette.green, 0.3);
      drawDot(ctx, leftX, baseCurve(0), 2.4, secondaryAlpha(0.75));
      drawDot(ctx, rightX, baseCurve(1), 2.6, secondaryAlpha(0.85));
    },
  };
};

const createPromiseScene = ({ ctx }) => {
  const random = makeRandom(53);
  const lineCount = 20;
  const lineConfigs = Array.from({ length: lineCount }, (_, index) => ({
    offset: index / (lineCount - 1),
    amp: lerp(0.018, 0.048, random()),
    freq: lerp(2.4, 5.6, random()),
    phase: random() * TAU,
    speed: lerp(0.00012, 0.00032, random()),
    drift: lerp(0.00008, 0.0002, random()),
  }));

  const segments = [
    { from: "strain", to: "strain", duration: 1800 },
    { from: "strain", to: "smooth", duration: 1500 },
    { from: "smooth", to: "smooth", duration: 2200 },
    { from: "smooth", to: "strain", duration: 1500 },
  ];
  const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0);

  const warp = (t, strength) => {
    if (strength <= 0) return t;
    const k = lerp(1, 0.45, strength);
    if (t < 0.5) return 0.5 * Math.pow(t / 0.5, k);
    return 1 - 0.5 * Math.pow((1 - t) / 0.5, k);
  };

  const getSegment = (time) => {
    let t = time % totalDuration;
    for (let i = 0; i < segments.length; i += 1) {
      const segment = segments[i];
      if (t <= segment.duration) {
        const progress = segment.duration === 0 ? 1 : t / segment.duration;
        return {
          ...segment,
          progress,
          hold: segment.from === segment.to,
        };
      }
      t -= segment.duration;
    }
    return { ...segments[0], progress: 0, hold: true };
  };

  return {
    render({ w, h, time, pointer }) {
      ctx.clearRect(0, 0, w, h);
      drawStripeBackdrop(ctx, w, h, { glowX: 0.52, glowY: 0.7, glowAlpha: 0.3 });

      const segment = prefersReducedMotion
        ? { from: "smooth", to: "smooth", progress: 1, hold: true }
        : getSegment(time);
      const fromStrength = segment.from === "strain" ? 1 : 0;
      const toStrength = segment.to === "strain" ? 1 : 0;
      const intensity = segment.hold ? fromStrength : lerp(fromStrength, toStrength, easeInOut(segment.progress));
      const smoothness = 1 - intensity;

      if (smoothness > 0.2) {
        drawGlow(ctx, w * 0.5, h * 0.52, Math.min(w, h) * 0.35, palette.green, 0.16 * smoothness);
      }

      const left = w * 0.08;
      const right = w * 0.92;
      const top = h * 0.18;
      const bottom = h * 0.82;
      const steps = 72;

      lineConfigs.forEach((line) => {
        const warped = warp(line.offset, intensity);
        const baseY = lerp(top, bottom, warped);
        const ampScale = lerp(0.45, 1.2, intensity);
        const drift = Math.sin(time * line.drift + line.phase) * h * line.amp * 0.35 * intensity;
        const centerWeight = 1 - Math.abs(line.offset - 0.5) * 1.8;
        const alpha = clamp(0.18 + centerWeight * 0.22 + smoothness * 0.08, 0.15, 0.55);

        ctx.strokeStyle = withAlpha(palette.green, alpha);
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        for (let i = 0; i < steps; i += 1) {
          const t = i / (steps - 1);
          const x = lerp(left, right, t) + pointer.x * 3;
          const wave =
            Math.sin(t * TAU * line.freq + time * line.speed + line.phase) * h * line.amp * ampScale;
          const y = baseY + wave + drift + pointer.y * 2.5;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
    },
  };
};

const sceneFactories = {
  nfo: createNfoScene,
  ground: createGroundScene,
  charter: createCharterScene,
  specialty: createSpecialtyScene,
  speed: createSpeedScene,
  precision: createPrecisionScene,
  visibility: createVisibilityScene,
  control: createControlScene,
  savings: createSavingsScene,
  promise: createPromiseScene,
};

const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let prefersReducedMotion = reduceMotionQuery.matches;
const handleReduceMotion = (event) => {
  prefersReducedMotion = event.matches;
  scenes.forEach((scene) => {
    scene.needsRender = true;
  });
};
if (reduceMotionQuery.addEventListener) {
  reduceMotionQuery.addEventListener("change", handleReduceMotion);
} else if (reduceMotionQuery.addListener) {
  reduceMotionQuery.addListener(handleReduceMotion);
}

let scrolling = false;
let scrollTimer = 0;
window.addEventListener("scroll", () => {
  scrolling = true;
  window.clearTimeout(scrollTimer);
  scrollTimer = window.setTimeout(() => {
    scrolling = false;
    scenes.forEach((scene) => {
      scene.needsRender = true;
    });
  }, 120);
});

const scenes = [];
const hasResizeObserver = "ResizeObserver" in window;
const hasIntersectionObserver = "IntersectionObserver" in window;
const resizeObserver = hasResizeObserver
  ? new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const scene = entry.target.__scene;
        if (!scene) return;
        resizeScene(scene, entry.contentRect.width, entry.contentRect.height);
      });
    })
  : null;

const intersectionObserver = hasIntersectionObserver
  ? new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const scene = entry.target.__scene;
          if (!scene) return;
          scene.active = entry.isIntersecting;
        });
      },
      { threshold: 0.15 }
    )
  : null;

document.querySelectorAll(".canvas").forEach((container) => {
  const name = container.dataset.scene;
  const factory = sceneFactories[name];
  if (!factory) return;
  const canvas = container.querySelector("canvas");
  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!ctx) return;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const scene = factory({ container, canvas, ctx });
  scene.canvas = canvas;
  scene.ctx = ctx;
  scene.container = container;
  scene.name = name;
  scene.pointer = { x: 0, y: 0, tx: 0, ty: 0, active: false };
  scene.time = 0;
  scene.active = true;
  scene.needsRender = true;
  scene.pausedFrameRendered = false;
  container.__scene = scene;
  scenes.push(scene);

  attachPointer(container, scene);
  const rect = container.getBoundingClientRect();
  resizeScene(scene, rect.width, rect.height);
  if (resizeObserver) {
    resizeObserver.observe(container);
  }
  if (intersectionObserver) {
    intersectionObserver.observe(container);
  } else {
    scene.active = true;
  }
});

if (!resizeObserver) {
  const legacyResize = () => {
    scenes.forEach((scene) => {
      resizeScene(scene, scene.container.clientWidth, scene.container.clientHeight);
    });
  };
  window.addEventListener("resize", legacyResize);
}

let lastTime = performance.now();
const frameTimes = [];
let lowPower = false;

const updatePerformance = (dt) => {
  frameTimes.push(dt);
  if (frameTimes.length > 45) frameTimes.shift();
  if (!lowPower && frameTimes.length === 45) {
    const average = frameTimes.reduce((sum, value) => sum + value, 0) / frameTimes.length;
    if (average > 42) {
      lowPower = true;
    }
  }
};

const tick = (now) => {
  const dt = Math.min(60, now - lastTime);
  lastTime = now;

  if (!prefersReducedMotion && !scrolling) {
    updatePerformance(dt);
  }

  scenes.forEach((scene) => {
    scene.pointer.x += (scene.pointer.tx - scene.pointer.x) * 0.08;
    scene.pointer.y += (scene.pointer.ty - scene.pointer.y) * 0.08;
    const paused = prefersReducedMotion || scrolling || lowPower;
    if (!paused) {
      scene.time += dt;
      scene.pausedFrameRendered = false;
    }
    if (paused && scene.pausedFrameRendered && !scene.needsRender) return;
    try {
      scene.render({
        w: scene.w,
        h: scene.h,
        time: scene.time,
        pointer: scene.pointer,
        paused,
        lowPower,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errorOverlay.show(`Illustration error in ${scene.name}: ${message}`);
      scene.active = false;
      return;
    }
    if (paused) {
      scene.pausedFrameRendered = true;
    }
    scene.needsRender = false;
  });

  requestAnimationFrame(tick);
};

requestAnimationFrame(tick);

window.addEventListener("error", (event) => {
  if (!event || !event.message) return;
  errorOverlay.show(`Illustration error: ${event.message}`);
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason instanceof Error ? event.reason.message : String(event.reason || "");
  if (reason) {
    errorOverlay.show(`Illustration error: ${reason}`);
  }
});
