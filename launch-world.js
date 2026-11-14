// ---------- Launch site world ----------
// The world is 8000px wide (x = -4000 to 4000) with the launch pad at x = 0.
// West of the pad: assembly building, rolling hills, then mountains.
// East of the pad: hills, then a beach and the ocean.
// World y points down; y = 0 is the top of the launch pad.

const WORLD_LEFT = -4000;
const WORLD_RIGHT = 4000;
const PAD_HEIGHT = 16; // The pad is a raised slab; the ground around it is at y = 16
const WATER_LEVEL = PAD_HEIGHT + 30;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Smooth 0 → 1 blend between edge0 and edge1 (works in either direction)
function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

// Seeded random numbers, so the map looks the same every time
function seededRandom(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A repeatable "random" number for any x position
function hash(x) {
  const s = Math.sin(x * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// How high the land is at x (bigger = higher). Flat around the launch site.
function terrainHeight(x) {
  const hillAmount = Math.max(smoothstep(-1100, -1600, x), smoothstep(350, 900, x));
  const rolling =
    45 * (Math.sin(x * 0.0021 + 1.3) + 1) +
    22 * (Math.sin(x * 0.0057 + 0.4) + 1) +
    7 * Math.sin(x * 0.019 + 2.1) +
    3 * Math.sin(x * 0.061);
  let h = rolling * hillAmount;

  // Mountains far to the west
  h += 520 * smoothstep(-2600, -3900, x) * (0.75 + 0.25 * Math.sin(x * 0.013));

  // Coastlines: the land slopes down under the sea to the east of the pad,
  // and again far to the west past the mountains. The rest of the planet is ocean.
  const coast = Math.max(smoothstep(2300, 2800, x), smoothstep(-9000, -10000, x));
  h = h * (1 - coast) - 90 * coast;
  return h;
}

function groundY(x) {
  return PAD_HEIGHT - terrainHeight(x);
}

// Trees and buried rocks are placed once, across the whole world
const worldTrees = [];
const worldRocks = [];
(function placeScenery() {
  const rng = seededRandom(42);
  for (let i = 0; i < 700; i++) {
    const x = WORLD_LEFT + rng() * (WORLD_RIGHT - WORLD_LEFT);
    const size = 14 + rng() * 28;
    const nearSite = x > -1150 && x < 450;
    const pastTreeLine = x < -3300;
    const atCoast = x > 2250 || x < -8600;
    if (!nearSite && !pastTreeLine && !atCoast) worldTrees.push({ x, size });
  }
  worldTrees.sort((a, b) => a.size - b.size); // small (far) trees first

  for (let i = 0; i < 450; i++) {
    worldRocks.push({
      x: WORLD_LEFT + rng() * (WORLD_RIGHT - WORLD_LEFT),
      depth: 18 + rng() * 260,
      rx: 3 + rng() * 9,
      ry: 2 + rng() * 5,
    });
  }
})();

// Clouds float between 600 m and 4,000 m up, so you can see the rocket climbing.
// (The world is drawn at 10 pixels per metre, so 600 m = 6,000 px.)
// The sky is split into a grid of cells; each cell may hold one cloud, decided
// by a repeatable random number, so clouds go on forever in every direction.
const CLOUD_CELL_WIDTH = 700;
const CLOUD_CELL_HEIGHT = 2000;
const CLOUD_TOP = -40000;
const CLOUD_BOTTOM = -6000;

function drawClouds(ctx, xMin, xMax, top, bottom) {
  const firstCol = Math.floor((xMin - 300) / CLOUD_CELL_WIDTH);
  const lastCol = Math.floor((xMax + 300) / CLOUD_CELL_WIDTH);
  const firstRow = Math.floor(Math.max(top - 200, CLOUD_TOP) / CLOUD_CELL_HEIGHT);
  const lastRow = Math.floor(Math.min(bottom + 200, CLOUD_BOTTOM) / CLOUD_CELL_HEIGHT);

  for (let col = firstCol; col <= lastCol; col++) {
    for (let row = firstRow; row <= lastRow; row++) {
      const seed = col * 73.13 + row * 19.71;
      if (hash(seed) > 0.55) continue; // about half the cells have a cloud
      const cx = col * CLOUD_CELL_WIDTH + hash(seed + 1) * CLOUD_CELL_WIDTH;
      const cy = row * CLOUD_CELL_HEIGHT + hash(seed + 2) * CLOUD_CELL_HEIGHT;
      const count = 3 + Math.floor(hash(seed + 3) * 4);
      ctx.fillStyle = `rgba(200, 215, 235, ${0.08 + hash(seed + 4) * 0.12})`;
      for (let p = 0; p < count; p++) {
        const r = 30 + hash(seed + 10 + p) * 30;
        const dx = (p - count / 2) * 40 + hash(seed + 20 + p) * 20;
        const dy = hash(seed + 30 + p) * 18 - 9;
        ctx.beginPath();
        ctx.ellipse(cx + dx, cy + dy, r * 1.4, r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// What the rocket would land on at world x (pixels): the pad, the ground, or
// the sea. Returns its world y (pixels, down is positive) and whether it's water.
function surfaceAt(x) {
  if (Math.abs(x) <= 120) return { y: 0, water: false }; // top of the launch pad
  if (isSea(x)) return { y: WATER_LEVEL, water: true };
  return { y: groundY(x), water: false };
}

// True where the ground is under the sea (only near the coasts, never inland)
function isSea(x) {
  return (x > 2300 || x < -8800) && groundY(x) > WATER_LEVEL;
}

// The name of the area at world x (pixels), used for science
function surfaceBiome(x) {
  if (Math.abs(x) <= 150) return "launchPad";
  if (isSea(x)) return "ocean";
  if (x > 2250 || x < -8600) return "beach";
  if (x < -2600) return "mountains";
  if (x > 900 || x < -1600) return "hills";
  return "grasslands";
}

// ---------- The Moon's surface ----------
// Grey rolling ground (higher highlands, lower lowlands) peppered with craters.
// x and the result are in metres (not pixels).
const MOON_CRATER_CELL = 400; // metres: each stretch this long may hold one crater

function moonBaseHeight(x) {
  return 600 * Math.sin(x / 9000) + 250 * Math.sin(x / 2300 + 1.3) + 60 * Math.sin(x / 410 + 0.7);
}

function moonCrater(cell) {
  if (hash(cell * 7.31 + 5) < 0.4) return null;
  return {
    center: (cell + 0.2 + 0.6 * hash(cell * 3.7 + 1)) * MOON_CRATER_CELL,
    radius: 50 + 120 * hash(cell * 1.9 + 2),
  };
}

function moonTerrainHeight(x) {
  let h = moonBaseHeight(x);
  const cell = Math.floor(x / MOON_CRATER_CELL);
  for (let c = cell - 1; c <= cell + 1; c++) {
    const crater = moonCrater(c);
    if (!crater) continue;
    const d = Math.abs(x - crater.center) / crater.radius;
    if (d < 1) h -= crater.radius * 0.3 * (1 - d * d); // the bowl
    if (d < 1.8) h += crater.radius * 0.1 * Math.exp(-(((d - 1) / 0.18) ** 2)); // the raised rim
  }
  return h;
}

function moonBiome(x) {
  return moonBaseHeight(x) > 0 ? "moonHighlands" : "moonLowlands";
}

// Draws the Moon's surface (in the same pixel world as drawLaunchWorld)
function drawMoonSurface(ctx, xMin, xMax, bottom) {
  const y = (px) => -moonTerrainHeight(px / 10) * 10; // metres → pixels (10 px per metre)
  const step = Math.max(4, Math.round((xMax - xMin) / 600));
  ctx.beginPath();
  ctx.moveTo(xMin, y(xMin));
  for (let x = xMin; x <= xMax; x += step) ctx.lineTo(x, y(x));
  ctx.lineTo(xMax, y(xMax));
  const deepest = Math.max(bottom, y(xMin), y(xMax)) + 2000;
  ctx.lineTo(xMax, deepest);
  ctx.lineTo(xMin, deepest);
  ctx.closePath();
  const rock = ctx.createLinearGradient(0, y((xMin + xMax) / 2) - 400, 0, y((xMin + xMax) / 2) + 2000);
  rock.addColorStop(0, "#8d8d94");
  rock.addColorStop(0.3, "#5e5e66");
  rock.addColorStop(1, "#2c2c32");
  ctx.fillStyle = rock;
  ctx.fill();

  // Light dusty edge on top
  ctx.save();
  ctx.clip();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#b5b5bc";
  ctx.beginPath();
  for (let x = xMin; x <= xMax; x += step) {
    if (x === xMin) ctx.moveTo(x, y(x) + 2);
    else ctx.lineTo(x, y(x) + 2);
  }
  ctx.stroke();

  // Pebbles and boulders on the surface
  ctx.fillStyle = "rgba(60, 60, 68, 0.8)";
  for (let x = Math.floor(xMin / 40) * 40; x <= xMax; x += 40) {
    const r = hash(x * 0.013 + 9);
    if (r < 0.55) continue;
    const size = 2 + (r - 0.55) * 30;
    ctx.beginPath();
    ctx.ellipse(x + r * 20, y(x + r * 20) - size * 0.3, size, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// High up, the planet appears below the rocket with a glowing blue rim of air.
// The higher you go, the more it curves (at 15 km it's almost flat).
// Near the Moon it's the Moon instead: grey, with no air glowing around it.
function drawPlanetBelow(ctx, view, dpr) {
  const altitude = view.altitude || 0;
  const onMoon = view.body === "moon";
  const fade = smoothstep(15000, 30000, altitude);
  if (fade <= 0) return;

  const width = view.width;
  const height = view.height;
  const radius = width * clamp((onMoon ? 133000 : 400000) / altitude, 0.9, 30);
  const limbY = height * 0.88;
  const centerX = width / 2;
  const centerY = limbY + radius;

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in screen pixels
  ctx.globalAlpha = fade;

  if (onMoon) {
    const dust = ctx.createLinearGradient(0, limbY, 0, height);
    dust.addColorStop(0, "#8a8a92");
    dust.addColorStop(1, "#3a3a40");
    ctx.fillStyle = dust;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // Glowing atmosphere around the edge
  const glow = ctx.createRadialGradient(centerX, centerY, radius, centerX, centerY, radius + 45);
  glow.addColorStop(0, "rgba(90, 170, 255, 0.55)");
  glow.addColorStop(1, "rgba(90, 170, 255, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 45, 0, Math.PI * 2);
  ctx.fill();

  // The planet itself (night side: dark oceans and land)
  const surface = ctx.createLinearGradient(0, limbY, 0, height);
  surface.addColorStop(0, "#1d3b5a");
  surface.addColorStop(1, "#0b1622");
  ctx.fillStyle = surface;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  // Thin bright edge
  ctx.strokeStyle = "rgba(150, 210, 255, 0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

// Traces the ground surface from xMin to xMax as a canvas path
function traceSurface(ctx, xMin, xMax, offsetY = 0) {
  ctx.beginPath();
  for (let x = xMin; x <= xMax; x += 4) {
    const y = groundY(x) + offsetY;
    if (x === xMin) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
}

function drawRidge(ctx, xMin, xMax, base, amp, phase, color) {
  ctx.beginPath();
  ctx.moveTo(xMin, PAD_HEIGHT + 10);
  for (let x = xMin; x <= xMax; x += 8) {
    const y =
      -base -
      amp * (0.5 + 0.5 * Math.sin(x * 0.0035 + phase)) -
      amp * 0.35 * Math.sin(x * 0.011 + phase * 2) -
      amp * 0.1 * Math.sin(x * 0.04 + phase);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(xMax, PAD_HEIGHT + 10);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawTree(ctx, x, size) {
  const y = groundY(x) + 2;
  ctx.fillStyle = "#3b2a1e";
  ctx.fillRect(x - size * 0.05, y - size * 0.25, size * 0.1, size * 0.25);
  for (let k = 0; k < 3; k++) {
    const bottom = y - size * (0.18 + k * 0.22);
    const width = size * (0.5 - k * 0.12);
    const top = bottom - size * 0.42;
    ctx.fillStyle = k % 2 ? "#22442b" : "#1c3a24";
    ctx.beginPath();
    ctx.moveTo(x - width / 2, bottom);
    ctx.lineTo(x, top);
    ctx.lineTo(x + width / 2, bottom);
    ctx.closePath();
    ctx.fill();
  }
}

function drawAssemblyBuilding(ctx) {
  const left = -840;
  const right = -580;
  const top = PAD_HEIGHT - 210;

  ctx.fillStyle = "#59616b";
  ctx.fillRect(left, top, right - left, PAD_HEIGHT - top);
  ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
  ctx.fillRect(right - 50, top, 50, PAD_HEIGHT - top);
  ctx.fillStyle = "#6b7380";
  ctx.fillRect(left - 6, top - 8, right - left + 12, 8);

  // Big sliding door with panel lines
  ctx.fillStyle = "#3a4048";
  ctx.fillRect(left + 50, top + 40, 120, PAD_HEIGHT - top - 40);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  for (let y = top + 52; y < PAD_HEIGHT; y += 12) {
    ctx.beginPath();
    ctx.moveTo(left + 50, y);
    ctx.lineTo(left + 170, y);
    ctx.stroke();
  }

  // Lit windows
  ctx.fillStyle = "#f7d27a";
  for (let x = left + 12; x < right - 12; x += 22) {
    if (hash(x) > 0.35) ctx.fillRect(x, top + 14, 10, 6);
  }

  // Red warning light on the roof
  drawGlow(ctx, right - 20, top - 12, 18, "rgba(255, 60, 60, 0.5)");
  ctx.fillStyle = "#ff4040";
  ctx.beginPath();
  ctx.arc(right - 20, top - 12, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawRoad(ctx) {
  ctx.fillStyle = "#2c2f33";
  ctx.fillRect(-580, PAD_HEIGHT, 440, 6);
  ctx.strokeStyle = "#c9a227";
  ctx.lineWidth = 1;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(-580, PAD_HEIGHT + 3);
  ctx.lineTo(-140, PAD_HEIGHT + 3);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawGlow(ctx, x, y, radius, color) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, color);
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawFloodlight(ctx, x, facing) {
  const top = PAD_HEIGHT - 170;
  ctx.strokeStyle = "#4b525c";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, PAD_HEIGHT);
  ctx.lineTo(x, top);
  ctx.stroke();

  ctx.fillStyle = "#6b7380";
  ctx.fillRect(x - 8, top - 6, 16, 8);
  ctx.fillStyle = "#fff4d6";
  ctx.fillRect(x - 7 + facing * 2, top - 2, 14, 3);

  drawGlow(ctx, x, top, 220, "rgba(255, 240, 200, 0.10)");
}

function drawLaunchPad(ctx) {
  // Concrete slab with sloped sides
  const slab = ctx.createLinearGradient(0, 0, 0, PAD_HEIGHT);
  slab.addColorStop(0, "#8a8f96");
  slab.addColorStop(1, "#5f646b");
  ctx.fillStyle = slab;
  ctx.beginPath();
  ctx.moveTo(-145, PAD_HEIGHT);
  ctx.lineTo(-120, 0);
  ctx.lineTo(120, 0);
  ctx.lineTo(145, PAD_HEIGHT);
  ctx.closePath();
  ctx.fill();

  // Flame trench under the rocket
  ctx.fillStyle = "#16181b";
  ctx.fillRect(-32, 3, 64, PAD_HEIGHT - 3);

  // Scorch marks
  drawGlow(ctx, 0, 1, 60, "rgba(0, 0, 0, 0.35)");

  ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
  ctx.fillRect(-120, 0, 240, 1.5);
}

function drawTower(ctx, rocketWidth, rocketHeight) {
  const left = Math.max(rocketWidth / 2, 24) + 22;
  const width = 26;
  const height = Math.max(rocketHeight + 30, 120);
  const top = -height;

  ctx.strokeStyle = "#a33a2a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(left, 0);
  ctx.lineTo(left, top);
  ctx.moveTo(left + width, 0);
  ctx.lineTo(left + width, top);
  ctx.stroke();

  // Cross bracing
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let y = 0; y > top + 1; y -= width) {
    const next = Math.max(y - width, top);
    ctx.moveTo(left, y);
    ctx.lineTo(left + width, next);
    ctx.moveTo(left + width, y);
    ctx.lineTo(left, next);
    ctx.moveTo(left, next);
    ctx.lineTo(left + width, next);
  }
  ctx.stroke();

  // Access arm reaching to the rocket
  if (rocketHeight > 0) {
    const armY = -rocketHeight * 0.8;
    ctx.fillStyle = "#7d2d21";
    ctx.fillRect(rocketWidth / 2 + 2, armY - 3, left - rocketWidth / 2 - 2, 6);
  }

  // Top platform and red light
  ctx.fillStyle = "#7d2d21";
  ctx.fillRect(left - 4, top - 4, width + 8, 5);
  drawGlow(ctx, left + width / 2, top - 10, 20, "rgba(255, 60, 60, 0.55)");
  ctx.fillStyle = "#ff4040";
  ctx.beginPath();
  ctx.arc(left + width / 2, top - 10, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

// Draws the part of the world around the pad that fits on screen.
//   zoom       = how big the world is drawn (1 = normal)
//   padScreenY = where the top of the pad sits on screen, in pixels from the top
function drawLaunchWorld(canvas, view) {
  const dpr = window.devicePixelRatio || 1;
  const pixelWidth = Math.round(view.width * dpr);
  const pixelHeight = Math.round(view.height * dpr);
  // Only resize the canvas when needed (resizing is slow and this runs every frame)
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Move the camera: centered on the pad, zoomed in, and raised by cameraY
  // (cameraY is the world height shown where the pad normally sits; it goes
  // negative as the camera follows the rocket upward)
  const cameraY = view.cameraY || 0;
  const scale = dpr * view.zoom;
  const cameraX = view.cameraX || 0;
  ctx.setTransform(
    scale,
    0,
    0,
    scale,
    dpr * (view.width / 2 - cameraX * view.zoom),
    dpr * (view.padScreenY - cameraY * view.zoom)
  );

  // Only draw what's on screen. The land and sea carry on past the edges of
  // the detailed map: mountains forever to the west, ocean forever to the east.
  const halfWidth = view.width / 2 / view.zoom;
  const xMin = Math.floor((cameraX - halfWidth - 40) / 4) * 4;
  const xMax = Math.ceil((cameraX + halfWidth + 40) / 4) * 4;
  const top = cameraY - view.padScreenY / view.zoom - 50;
  const bottom = cameraY + (view.height - view.padScreenY) / view.zoom + 50;

  if (view.body === "moon") {
    drawPlanetBelow(ctx, view, dpr);
    // Only draw the ground when it's on screen (the Moon's hills reach about ±1 km)
    if (bottom > -12000) drawMoonSurface(ctx, xMin, xMax, bottom);
    return;
  }

  drawClouds(ctx, xMin, xMax, top, bottom);
  drawPlanetBelow(ctx, view, dpr);

  // Once the camera is far above the ground, there is nothing else to draw
  if (bottom < -1500) return;

  // Distant mountain ridges, then haze near the horizon
  drawRidge(ctx, xMin, xMax, 70, 110, 1.7, "#141d2a");
  drawRidge(ctx, xMin, xMax, 20, 70, 4.2, "#18241f");
  const haze = ctx.createLinearGradient(0, -320, 0, PAD_HEIGHT);
  haze.addColorStop(0, "rgba(80, 120, 170, 0)");
  haze.addColorStop(1, "rgba(80, 120, 170, 0.18)");
  ctx.fillStyle = haze;
  ctx.fillRect(xMin, -320, xMax - xMin, PAD_HEIGHT + 320);

  // Ground: layers of dirt under the surface
  traceSurface(ctx, xMin, xMax);
  ctx.lineTo(xMax, bottom);
  ctx.lineTo(xMin, bottom);
  ctx.closePath();
  const dirt = ctx.createLinearGradient(0, -300, 0, 400);
  dirt.addColorStop(0, "#4a3627");
  dirt.addColorStop(0.5, "#3a2a1e");
  dirt.addColorStop(1, "#1f1610");
  ctx.fillStyle = dirt;
  ctx.fill();

  ctx.save();
  ctx.clip();

  // Soil layers that follow the shape of the land
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.18)";
  [45, 100, 175, 260].forEach((depth) => {
    traceSurface(ctx, xMin, xMax, depth);
    ctx.stroke();
  });

  // Buried rocks
  ctx.fillStyle = "rgba(120, 110, 100, 0.45)";
  worldRocks.forEach((rock) => {
    if (rock.x < xMin - 20 || rock.x > xMax + 20) return;
    ctx.beginPath();
    ctx.ellipse(rock.x, groundY(rock.x) + rock.depth, rock.rx, rock.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // Dark topsoil band just under the grass
  ctx.lineWidth = 14;
  ctx.strokeStyle = "#33402a";
  traceSurface(ctx, xMin, xMax, 7);
  ctx.stroke();
  ctx.restore();

  // Grass on top, with a lighter edge
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#3f7a35";
  traceSurface(ctx, xMin, xMax, 1);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#6aa850";
  traceSurface(ctx, xMin, xMax, -1);
  ctx.stroke();

  // Sandy beach by the sea
  ctx.lineWidth = 7;
  ctx.strokeStyle = "#9c8a5e";
  if (xMax > 2250 && xMin < 2900) {
    traceSurface(ctx, Math.max(xMin, 2252), Math.min(xMax, 2900), 1);
    ctx.stroke();
  }
  if (xMin < -8600 && xMax > -9200) {
    traceSurface(ctx, Math.max(xMin, -9200), Math.min(xMax, -8600), 1);
    ctx.stroke();
  }

  // Grass tufts (not on the pad, road, beach or underwater)
  ctx.strokeStyle = "#4f8a3e";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = Math.floor(xMin / 5) * 5; x <= xMax; x += 5) {
    const onSite = x > -590 && x < 150;
    if (onSite || x > 2250 || x < -8600) continue;
    const r = hash(x);
    const gx = x + r * 4;
    const gy = groundY(gx);
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + (r - 0.5) * 4, gy - 3 - r * 5);
  }
  ctx.stroke();

  // Trees
  worldTrees.forEach((tree) => {
    if (tree.x > xMin - 30 && tree.x < xMax + 30) drawTree(ctx, tree.x, tree.size);
  });

  // Ocean: water fills anywhere the ground dips below sea level
  const waterTop = WATER_LEVEL;
  const water = ctx.createLinearGradient(0, waterTop, 0, waterTop + 200);
  water.addColorStop(0, "rgba(30, 80, 120, 0.92)");
  water.addColorStop(1, "rgba(8, 24, 42, 0.98)");
  ctx.fillStyle = water;
  let runStart = null;
  for (let x = xMin; x <= xMax + 4; x += 4) {
    const wet = x <= xMax && isSea(x);
    if (wet && runStart === null) runStart = x;
    if (!wet && runStart !== null) {
      ctx.fillRect(runStart, waterTop, x - runStart, bottom - waterTop);
      // Little wave highlights
      ctx.save();
      ctx.strokeStyle = "rgba(160, 210, 255, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let wx = Math.ceil(runStart / 30) * 30; wx < x - 20; wx += 30) {
        const wy = waterTop + 4 + hash(wx) * 20;
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx + 10 + hash(wx + 1) * 12, wy);
      }
      ctx.stroke();
      ctx.restore();
      runStart = null;
    }
  }

  // Launch site
  drawRoad(ctx);
  drawAssemblyBuilding(ctx);
  drawFloodlight(ctx, -230, 1);
  drawFloodlight(ctx, 230, -1);
  drawLaunchPad(ctx);
  drawTower(ctx, view.rocketWidth, view.rocketHeight);
}
