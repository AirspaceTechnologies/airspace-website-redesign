(() => {
  const canvas = document.querySelector(".hero-cables-canvas");
  const container = canvas?.parentElement;
  if (!canvas || !container) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const TAU = Math.PI * 2;
  const prefersReducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduceMotion = prefersReducedMotionQuery.matches;

  if (prefersReducedMotionQuery.addEventListener) {
    prefersReducedMotionQuery.addEventListener("change", (event) => {
      reduceMotion = event.matches;
    });
  } else if (prefersReducedMotionQuery.addListener) {
    prefersReducedMotionQuery.addListener((event) => {
      reduceMotion = event.matches;
    });
  }

  let width = 0;
  let height = 0;
  let dpr = 1;

  const resize = () => {
    const rect = container.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
  } else {
    window.addEventListener("resize", resize);
  }
  resize();

  const palette = {
    green: "#00c46a",
    orange: "#f39b5e",
    pink: "#f57aa0",
    teal: "#15a4ff",
  };

  const lerp = (a, b, t) => a + (b - a) * t;
  const mixColor = (a, b, t) => {
    const ar = parseInt(a.slice(1, 3), 16);
    const ag = parseInt(a.slice(3, 5), 16);
    const ab = parseInt(a.slice(5, 7), 16);
    const br = parseInt(b.slice(1, 3), 16);
    const bg = parseInt(b.slice(3, 5), 16);
    const bb = parseInt(b.slice(5, 7), 16);
    return `rgb(${Math.round(lerp(ar, br, t))}, ${Math.round(lerp(ag, bg, t))}, ${Math.round(lerp(ab, bb, t))})`;
  };

  const getRibbonGradient = (x0, y0, x1, y1) => {
    const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    gradient.addColorStop(0, palette.green);
    gradient.addColorStop(0.3, palette.orange);
    gradient.addColorStop(0.55, palette.pink);
    gradient.addColorStop(0.78, palette.orange);
    gradient.addColorStop(1, palette.green);
    return gradient;
  };

  const buildRibbon = (time, config) => {
    const points = [];
    const count = 140;
    const baseX = width * config.originX;
    const baseY = height * config.originY;
    const spanX = width * config.spanX;
    const spanY = height * config.spanY;

    for (let i = 0; i <= count; i += 1) {
      const t = i / count;
      const wave = Math.sin(t * TAU * config.wave + time * config.speed + config.phase) * config.waveAmp;
      const x = baseX + t * spanX + wave * width * 0.08;
      const y = baseY + t * spanY + Math.sin(t * TAU * 0.6 + time * 0.3) * height * 0.04;
      points.push({ x, y });
    }

    const normals = [];
    const tangents = [];
    for (let i = 0; i < points.length; i += 1) {
      const prev = points[Math.max(0, i - 1)];
      const next = points[Math.min(points.length - 1, i + 1)];
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.hypot(dx, dy) || 1;
      normals.push({ x: -dy / len, y: dx / len });
      tangents.push({ x: dx / len, y: dy / len });
    }

    return { points, normals, tangents };
  };

  const drawRibbon = (time, config, data) => {
    const { points, normals } = data ?? buildRibbon(time, config);
    const halfWidth = config.width;

    ctx.beginPath();
    points.forEach((point, i) => {
      const normal = normals[i];
      const edge = (i / (points.length - 1)) * TAU;
      const taper = 0.65 + Math.sin(edge) * 0.35;
      const w = halfWidth * taper;
      ctx.lineTo(point.x + normal.x * w, point.y + normal.y * w);
    });
    for (let i = points.length - 1; i >= 0; i -= 1) {
      const point = points[i];
      const normal = normals[i];
      const edge = (i / (points.length - 1)) * TAU;
      const taper = 0.65 + Math.sin(edge) * 0.35;
      const w = halfWidth * taper;
      ctx.lineTo(point.x - normal.x * w, point.y - normal.y * w);
    }
    ctx.closePath();

    const gradient = getRibbonGradient(
      width * 0.2,
      height * 0.15,
      width * 0.95,
      height * 0.85
    );

    ctx.save();
    ctx.globalAlpha = config.opacity;
    ctx.fillStyle = gradient;
    ctx.shadowColor = "rgba(245, 122, 160, 0.28)";
    ctx.shadowBlur = 40;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = gradient;
    ctx.lineWidth = config.width * 0.35;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(255, 255, 255, 0.28)";
    ctx.shadowBlur = 28;
    ctx.stroke();
    ctx.restore();
  };

  const orbiters = Array.from({ length: 140 }, () => ({
    t: Math.random(),
    radius: 0.012 + Math.random() * 0.03,
    speed: 0.12 + Math.random() * 0.25,
    phase: Math.random() * TAU,
    size: 0.0025 + Math.random() * 0.0035,
    color: Math.random(),
  }));

  const getOrbitPoint = (ribbon, orbiter, time) => {
    const count = ribbon.points.length;
    const t = (orbiter.t + time * orbiter.speed) % 1;
    const idx = Math.min(count - 1, Math.floor(t * (count - 1)));
    const point = ribbon.points[idx];
    const normal = ribbon.normals[idx];
    const tangent = ribbon.tangents[idx];
    const angle = time * 2.1 + orbiter.phase + t * TAU * 1.1;
    const radius = width * orbiter.radius;
    const orbitX = normal.x * Math.cos(angle) * radius + tangent.x * Math.sin(angle) * radius * 0.35;
    const orbitY = normal.y * Math.cos(angle) * radius + tangent.y * Math.sin(angle) * radius * 0.35;
    const depth = Math.sin(angle);
    return { x: point.x + orbitX, y: point.y + orbitY, depth };
  };

  const drawOrbitLine = (ribbon, time) => {
    const steps = 90;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = mixColor(palette.teal, "#ffffff", 0.25);
    ctx.lineWidth = width * 0.006;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(21, 164, 255, 0.35)";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const idx = Math.min(ribbon.points.length - 1, Math.floor(t * (ribbon.points.length - 1)));
      const point = ribbon.points[idx];
      const normal = ribbon.normals[idx];
      const tangent = ribbon.tangents[idx];
      const angle = time * 1.8 + t * TAU * 1.2;
      const radius = width * 0.028;
      const x = point.x + normal.x * Math.cos(angle) * radius + tangent.x * Math.sin(angle) * radius * 0.35;
      const y = point.y + normal.y * Math.cos(angle) * radius + tangent.y * Math.sin(angle) * radius * 0.35;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  };

  const drawOrbiters = (ribbon, time) => {
    orbiters.forEach((orbiter, i) => {
      const { x, y, depth } = getOrbitPoint(ribbon, orbiter, time);
      const radius = width * orbiter.size * (0.7 + 0.3 * depth);
      const color =
        orbiter.color < 0.4 ? palette.green : orbiter.color < 0.7 ? palette.orange : palette.pink;
      ctx.save();
      ctx.globalAlpha = 0.35 + depth * 0.25;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TAU);
      ctx.fill();
      ctx.restore();
    });
  };

  const render = (time) => {
    if (!width || !height) return;
    ctx.clearRect(0, 0, width, height);

    const baseTime = time * 0.0008;

    const mainRibbon = buildRibbon(baseTime, {
      originX: 0.62,
      originY: -0.1,
      spanX: 0.45,
      spanY: 1.1,
      width: width * 0.06,
      wave: 1.1,
      waveAmp: 0.6,
      speed: 0.8,
      phase: 0,
      opacity: 0.88,
    });
    drawRibbon(baseTime, {
      originX: 0.62,
      originY: -0.1,
      spanX: 0.45,
      spanY: 1.1,
      width: width * 0.06,
      wave: 1.1,
      waveAmp: 0.6,
      speed: 0.8,
      phase: 0,
      opacity: 0.88,
    }, mainRibbon);

    const ribbonMid = buildRibbon(baseTime + 0.4, {
      originX: 0.58,
      originY: -0.05,
      spanX: 0.48,
      spanY: 1.05,
      width: width * 0.045,
      wave: 1.4,
      waveAmp: 0.55,
      speed: 0.9,
      phase: 1.2,
      opacity: 0.76,
    });
    drawRibbon(baseTime + 0.4, {
      originX: 0.58,
      originY: -0.05,
      spanX: 0.48,
      spanY: 1.05,
      width: width * 0.045,
      wave: 1.4,
      waveAmp: 0.55,
      speed: 0.9,
      phase: 1.2,
      opacity: 0.76,
    }, ribbonMid);

    const ribbonThin = buildRibbon(baseTime + 0.8, {
      originX: 0.64,
      originY: -0.12,
      spanX: 0.42,
      spanY: 1.12,
      width: width * 0.03,
      wave: 1.6,
      waveAmp: 0.5,
      speed: 1.0,
      phase: 2.4,
      opacity: 0.64,
    });
    drawRibbon(baseTime + 0.8, {
      originX: 0.64,
      originY: -0.12,
      spanX: 0.42,
      spanY: 1.12,
      width: width * 0.03,
      wave: 1.6,
      waveAmp: 0.5,
      speed: 1.0,
      phase: 2.4,
      opacity: 0.64,
    }, ribbonThin);

    drawOrbitLine(mainRibbon, baseTime);
    drawOrbiters(mainRibbon, baseTime);
  };

  const tick = (timeMs) => {
    render(timeMs);
    if (!reduceMotion) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
})();
