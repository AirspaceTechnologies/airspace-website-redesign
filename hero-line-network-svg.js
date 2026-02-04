(() => {
  const network = document.querySelector(".hero-network");
  const svg = network?.querySelector(".hero-line-svg");
  const group = svg?.querySelector(".mesh-group");
  const sparkGroup = svg?.querySelector(".spark-group");
  if (!network || !svg || !group || !sparkGroup) return;

  const NS = "http://www.w3.org/2000/svg";
  const TAU = Math.PI * 2;

  const viewBox = svg.viewBox.baseVal;
  const viewWidth = viewBox.width || 1200;
  const viewHeight = viewBox.height || 800;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const centerX = parseFloat(network.dataset.heroCenterX || "0.78");
  const centerY = parseFloat(network.dataset.heroCenterY || "0.5");
  const fillRatio = parseFloat(network.dataset.heroFill || "0.98");
  const fps = Math.max(0, parseFloat(network.dataset.heroFps || "60"));
  const sparkCount = Math.max(0, parseInt(network.dataset.heroSparks || "100", 10));

  const segments = 20;
  const spokes = 7;
  const diagEvery = 3;
  const nodeStep = 3;

  const nodes = [];
  for (let i = 0; i < segments; i += 1) {
    const t = i / (segments - 1);
    for (let j = 0; j < spokes; j += 1) {
      nodes.push({
        t,
        phi: (j / spokes) * TAU,
        seed: Math.random() * TAU,
        drift: (Math.random() - 0.5) * 0.12,
      });
    }
  }

  const edges = [];
  for (let i = 0; i < segments; i += 1) {
    for (let j = 0; j < spokes; j += 1) {
      const idx = i * spokes + j;
      const nextJ = i * spokes + ((j + 1) % spokes);
      edges.push([idx, nextJ]);
      if (i + 1 < segments) {
        const nextI = (i + 1) * spokes + j;
        edges.push([idx, nextI]);
        if (j % diagEvery === 0) {
          const nextDiag = (i + 1) * spokes + ((j + 1) % spokes);
          edges.push([idx, nextDiag]);
        }
      }
    }
  }

  const palette = {
    green: [0, 211, 122],
    teal: [52, 200, 255],
    mint: [134, 245, 200],
  };

  const lerp = (a, b, t) => a + (b - a) * t;
  const mixColor = (a, b, t) => {
    const r = Math.round(lerp(a[0], b[0], t));
    const g = Math.round(lerp(a[1], b[1], t));
    const bVal = Math.round(lerp(a[2], b[2], t));
    return `rgb(${r}, ${g}, ${bVal})`;
  };
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const rotatePoint = (x, y, z, tiltX, tiltY) => {
    const cosX = Math.cos(tiltX);
    const sinX = Math.sin(tiltX);
    const cosY = Math.cos(tiltY);
    const sinY = Math.sin(tiltY);

    const y1 = y * cosX - z * sinX;
    const z1 = y * sinX + z * cosX;
    const x2 = x * cosY + z1 * sinY;
    const z2 = -x * sinY + z1 * cosY;

    return { x: x2, y: y1, z: z2 };
  };

  const computeNormalized = (time) => {
    const tiltX = 0.48 + Math.sin(time * 0.18) * 0.12;
    const tiltY = -0.32 + Math.cos(time * 0.14) * 0.14;
    const cameraZ = 2.6;
    const fov = 1.6;

    const normalized = [];
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    nodes.forEach((node) => {
      const twist = node.t * TAU * 1.55 + time * 0.32 + node.seed * 0.08;
      const wave = Math.sin(node.t * TAU * 2 + time * 0.6 + node.seed) * 0.055;
      const radius = 0.38 + wave;
      const tube = 0.16 + Math.sin(node.t * TAU * 3 + time * 0.5 + node.seed) * 0.03;
      const ringAngle = node.phi + time * 0.24 + node.seed * 0.12;

      const x = (radius + tube * Math.cos(ringAngle)) * Math.cos(twist);
      const y = (radius + tube * Math.cos(ringAngle)) * Math.sin(twist);
      const z = (node.t - 0.5) * 1.5 + tube * Math.sin(ringAngle) * 0.8 + node.drift;

      const rotated = rotatePoint(x, y, z, tiltX, tiltY);
      const perspective = fov / (fov + rotated.z + cameraZ);

      const px = rotated.x * perspective;
      const py = rotated.y * perspective;
      const depth = (rotated.z + 1.4) / 2.8;

      normalized.push({ x: px, y: py, depth: Math.max(0, Math.min(depth, 1)) });

      minX = Math.min(minX, px);
      maxX = Math.max(maxX, px);
      minY = Math.min(minY, py);
      maxY = Math.max(maxY, py);
    });

    return { normalized, minX, maxX, minY, maxY };
  };

  const scaleSamples = 6;
  let minHeightSpan = Infinity;
  for (let i = 0; i < scaleSamples; i += 1) {
    const sample = computeNormalized(i * 0.9);
    const heightSpan = Math.max(0.0001, sample.maxY - sample.minY);
    minHeightSpan = Math.min(minHeightSpan, heightSpan);
  }
  const baseScale = (viewHeight * fillRatio) / Math.max(minHeightSpan, 0.0001);

  const lineEls = edges.map(() => {
    const line = document.createElementNS(NS, "line");
    line.setAttribute("class", "mesh-line");
    group.appendChild(line);
    return line;
  });

  const nodeEls = [];
  nodes.forEach((_, i) => {
    if (i % nodeStep !== 0) return;
    const circle = document.createElementNS(NS, "circle");
    circle.setAttribute("class", "mesh-node");
    group.appendChild(circle);
    nodeEls.push({ el: circle, idx: i });
  });

  const sparkColors = ["rgb(243, 155, 94)", "rgb(245, 122, 160)"];
  const sparks = Array.from({ length: sparkCount }, () => ({
    edgeIndex: 0,
    t: 0,
    speed: 0,
    length: 0,
    color: sparkColors[0],
    thickness: 1,
    alpha: 0.6,
    delay: 0,
  }));

  const resetSpark = (spark, delayed) => {
    spark.edgeIndex = Math.floor(Math.random() * edges.length);
    spark.t = -Math.random() * 0.4;
    spark.speed = 2.2 + Math.random() * 3.0;
    spark.length = 0.06 + Math.random() * 0.12;
    spark.color = sparkColors[Math.random() < 0.5 ? 0 : 1];
    spark.thickness = 1 + Math.random() * 1.6;
    spark.alpha = 0.5 + Math.random() * 0.45;
    spark.delay = delayed ? Math.random() * 1.4 : 0;
  };

  sparks.forEach((spark) => resetSpark(spark, true));

  const sparkEls = sparks.map(() => {
    const line = document.createElementNS(NS, "line");
    line.setAttribute("class", "spark-line");
    sparkGroup.appendChild(line);
    return line;
  });

  const screenPoints = nodes.map(() => ({ x: 0, y: 0, depth: 0 }));
  let lastSparkTime = 0;

  const render = (timeMs) => {
    const time = timeMs * 0.00035;
    const { normalized, minX, maxX, minY, maxY } = computeNormalized(time);
    const offsetX = viewWidth * centerX - ((minX + maxX) / 2) * baseScale;
    const offsetY = viewHeight * centerY - ((minY + maxY) / 2) * baseScale;

    normalized.forEach((point, i) => {
      screenPoints[i].x = offsetX + point.x * baseScale;
      screenPoints[i].y = offsetY + point.y * baseScale;
      screenPoints[i].depth = point.depth;
    });

    edges.forEach(([aIdx, bIdx], i) => {
      const a = screenPoints[aIdx];
      const b = screenPoints[bIdx];
      const depth = (a.depth + b.depth) * 0.5;
      const alpha = 0.12 + (1 - depth) * 0.45;
      const strokeWidth = 0.8 + (1 - depth) * 1.4;

      const line = lineEls[i];
      line.setAttribute("x1", a.x.toFixed(2));
      line.setAttribute("y1", a.y.toFixed(2));
      line.setAttribute("x2", b.x.toFixed(2));
      line.setAttribute("y2", b.y.toFixed(2));
      line.setAttribute("stroke", mixColor(palette.teal, palette.green, 1 - depth));
      line.setAttribute("stroke-opacity", alpha.toFixed(2));
      line.setAttribute("stroke-width", strokeWidth.toFixed(2));
    });

    nodeEls.forEach(({ el, idx }) => {
      const point = screenPoints[idx];
      const depth = point.depth;
      el.setAttribute("cx", point.x.toFixed(2));
      el.setAttribute("cy", point.y.toFixed(2));
      el.setAttribute("r", (1.6 + (1 - depth) * 2.2).toFixed(2));
      el.setAttribute("fill", mixColor(palette.mint, palette.green, 1 - depth));
      el.setAttribute("fill-opacity", (0.18 + (1 - depth) * 0.5).toFixed(2));
    });

    const dt = lastSparkTime ? Math.min(0.05, (timeMs - lastSparkTime) / 1000) : 0;
    lastSparkTime = timeMs;

    sparks.forEach((spark, i) => {
      const line = sparkEls[i];
      if (spark.delay > 0) {
        spark.delay -= dt;
        line.setAttribute("stroke-opacity", "0");
        return;
      }

      spark.t += spark.speed * dt;
      if (spark.t > 1 + spark.length) {
        resetSpark(spark, true);
        line.setAttribute("stroke-opacity", "0");
        return;
      }

      const [aIdx, bIdx] = edges[spark.edgeIndex];
      const a = screenPoints[aIdx];
      const b = screenPoints[bIdx];
      const startT = clamp(spark.t, 0, 1);
      const endT = clamp(spark.t + spark.length, 0, 1);

      if (endT <= 0 || startT >= 1) {
        line.setAttribute("stroke-opacity", "0");
        return;
      }

      const sx = a.x + (b.x - a.x) * startT;
      const sy = a.y + (b.y - a.y) * startT;
      const ex = a.x + (b.x - a.x) * endT;
      const ey = a.y + (b.y - a.y) * endT;
      const depth = (a.depth + b.depth) * 0.5;
      const alpha = spark.alpha * (0.35 + (1 - depth) * 0.65);

      line.setAttribute("x1", sx.toFixed(2));
      line.setAttribute("y1", sy.toFixed(2));
      line.setAttribute("x2", ex.toFixed(2));
      line.setAttribute("y2", ey.toFixed(2));
      line.setAttribute("stroke", spark.color);
      line.setAttribute("stroke-opacity", alpha.toFixed(2));
      line.setAttribute("stroke-width", (spark.thickness + (1 - depth) * 0.8).toFixed(2));
    });
  };

  render(0);
  if (prefersReducedMotion || fps <= 0) return;

  let lastTime = 0;
  let slowFrames = 0;
  const minInterval = 1000 / fps;

  const tick = (timeMs) => {
    if (timeMs - lastTime < minInterval) {
      requestAnimationFrame(tick);
      return;
    }
    lastTime = timeMs;

    const start = performance.now();
    render(timeMs);
    const duration = performance.now() - start;

    if (duration > 30) {
      slowFrames += 1;
    } else {
      slowFrames = Math.max(0, slowFrames - 1);
    }

    if (slowFrames >= 4) return;
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
})();
