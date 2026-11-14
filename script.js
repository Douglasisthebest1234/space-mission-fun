// Create twinkling stars for the background
const starsContainer = document.getElementById("stars");
const STAR_COUNT = 150;

for (let i = 0; i < STAR_COUNT; i++) {
  const star = document.createElement("div");
  star.className = "star";

  const size = Math.random() * 2 + 1;
  star.style.width = size + "px";
  star.style.height = size + "px";
  star.style.top = Math.random() * 100 + "%";
  star.style.left = Math.random() * 100 + "%";
  star.style.animationDelay = Math.random() * 3 + "s";

  starsContainer.appendChild(star);
}

// ---------- Flying objects: comets, ships, satellites ----------
const objectsLayer = document.getElementById("spaceObjects");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function random(min, max) {
  return Math.random() * (max - min) + min;
}

// A comet streaks diagonally across the sky, then is removed
function launchComet() {
  const comet = document.createElement("div");
  comet.className = "comet";

  const w = window.innerWidth;
  const h = window.innerHeight;
  const length = random(80, 180);
  comet.style.width = length + "px";

  // Start somewhere along the top or right edge, travel down and to the left
  const startX = random(w * 0.3, w + 100);
  const startY = random(-100, h * 0.3);
  const distance = random(w * 0.6, w * 1.1);
  const angle = random(145, 165) * (Math.PI / 180);
  const endX = startX + Math.cos(angle) * distance;
  const endY = startY + Math.sin(angle) * distance;
  // Point the bright head (right end of the element) in the direction of travel
  const rotation = angle * (180 / Math.PI);

  objectsLayer.appendChild(comet);

  const animation = comet.animate(
    [
      { transform: `translate(${startX}px, ${startY}px) rotate(${rotation}deg)`, opacity: 0 },
      { opacity: 1, offset: 0.1 },
      { opacity: 1, offset: 0.8 },
      { transform: `translate(${endX}px, ${endY}px) rotate(${rotation}deg)`, opacity: 0 },
    ],
    { duration: random(1200, 2200), easing: "ease-in" }
  );
  animation.onfinish = () => comet.remove();
}

// Ships, satellites and UFOs drift slowly from one side to the other
const flyerTypes = [
  { icon: "🛰️", size: [28, 40], speed: [18000, 26000], spin: true },
  { icon: "🚀", size: [26, 36], speed: [9000, 14000], rocket: true },
  { icon: "🛸", size: [28, 40], speed: [12000, 18000] },
  { icon: "☄️", size: [22, 30], speed: [7000, 10000] },
];

function launchFlyer() {
  const type = flyerTypes[Math.floor(Math.random() * flyerTypes.length)];
  const flyer = document.createElement("div");
  flyer.className = "flyer";

  const inner = document.createElement("span");
  inner.textContent = type.icon;
  inner.style.fontSize = random(type.size[0], type.size[1]) + "px";
  flyer.appendChild(inner);

  const w = window.innerWidth;
  const h = window.innerHeight;
  const goingRight = Math.random() < 0.5;
  const startX = goingRight ? -80 : w + 80;
  const endX = goingRight ? w + 80 : -80;
  const startY = random(h * 0.05, h * 0.9);
  const endY = startY + random(-h * 0.2, h * 0.2);

  // The rocket emoji points up-right, so tilt it to face its direction of travel
  let baseRotation = 0;
  if (type.rocket) baseRotation = goingRight ? 45 : -135;
  if (!goingRight && !type.rocket) flyer.style.scale = "-1 1";

  const spinAmount = type.spin ? random(-90, 90) : 0;

  objectsLayer.appendChild(flyer);

  const animation = flyer.animate(
    [
      { transform: `translate(${startX}px, ${startY}px) rotate(${baseRotation}deg)` },
      { transform: `translate(${endX}px, ${endY}px) rotate(${baseRotation + spinAmount}deg)` },
    ],
    { duration: random(type.speed[0], type.speed[1]), easing: "linear" }
  );
  animation.onfinish = () => flyer.remove();
}

// Keep launching new objects at random intervals
function scheduleComets() {
  launchComet();
  setTimeout(scheduleComets, random(1500, 4000));
}

function scheduleFlyers() {
  launchFlyer();
  setTimeout(scheduleFlyers, random(4000, 8000));
}

if (!reduceMotion) {
  setTimeout(scheduleComets, 800);
  setTimeout(scheduleFlyers, 1500);
}

// Start button (game will be added later)
const startButton = document.getElementById("startButton");

const startPage = document.getElementById("startPage");
const missionMenu = document.getElementById("missionMenu");

// Pressing Start hides the welcome screen and shows the mission menu
startButton.addEventListener("click", () => {
  startPage.hidden = true;
  missionMenu.hidden = false;
});

// Back button returns to the welcome screen
const backButton = document.getElementById("backButton");

backButton.addEventListener("click", () => {
  missionMenu.hidden = true;
  startPage.hidden = false;
});

// ---------- "Are you sure?" page for each mode ----------
const modes = {
  creative: {
    name: "Creative",
    description:
      "All rocket parts are unlocked and there is no budget. Build anything you want, instantly.",
  },
  science: {
    name: "Science",
    description:
      "You start with only a few parts, but there is no budget. Collect science to unlock new parts.",
  },
  business: {
    name: "Business",
    description:
      "Just like Science mode: start with a few parts and collect science to unlock more. But this time you have a budget to manage.",
  },
};

const confirmPage = document.getElementById("confirmPage");
const confirmMode = document.getElementById("confirmMode");
const confirmDescription = document.getElementById("confirmDescription");
const confirmBackButton = document.getElementById("confirmBackButton");
const confirmButton = document.getElementById("confirmButton");

let selectedMode = null;

// Clicking a mode shows the warning page with that mode's description
document.querySelectorAll(".menu-option").forEach((button) => {
  button.addEventListener("click", () => {
    selectedMode = button.dataset.mission;
    confirmMode.textContent = modes[selectedMode].name + " Mode";
    confirmDescription.textContent = modes[selectedMode].description;
    missionMenu.hidden = true;
    confirmPage.hidden = false;
  });
});

// Back returns to the mission menu
confirmBackButton.addEventListener("click", () => {
  confirmPage.hidden = true;
  missionMenu.hidden = false;
});

// I'm Sure opens the rocket builder
confirmButton.addEventListener("click", () => {
  openBuilder(selectedMode);
});

// ---------- Rocket building page ----------

// Every rocket part. "startsUnlocked" parts are available in Science and Business
// from the beginning; the others must be unlocked (Creative has everything).
//   liquid = liquid-fuel engine, needs fuel tanks
//   solid  = solid-fuel engine, fuel is built in
//   tank   = liquid fuel tank ("height" is how tall it is drawn)
//   pod    = command pod that controls the rocket ("crew" = seats; 0 = probe)
//   nose   = nose cone that makes the rocket more aerodynamic
//   wing   = wings and fins that keep the rocket stable
const parts = [
  { id: "nose-s", type: "nose", name: "Small Nose Cone", mass: 0.1, cost: 100, size: 0.8, height: 36, startsUnlocked: true },
  { id: "nose-m", type: "nose", name: "Nose Cone", mass: 0.2, cost: 180, size: 1.0, height: 44, startsUnlocked: true },
  { id: "nose-l", type: "nose", name: "Pointed Nose", mass: 0.3, cost: 350, size: 1.0, height: 72, startsUnlocked: false },

  { id: "chute-nose", type: "chute", mount: "nose", name: "Nose Chute", dragArea: 400, mass: 0.1, cost: 250, size: 0.8, startsUnlocked: true },
  { id: "chute-nose-l", type: "chute", mount: "nose", name: "Big Nose Chute", dragArea: 900, mass: 0.3, cost: 500, size: 1.0, startsUnlocked: false },
  { id: "chute-side", type: "chute", mount: "side", name: "Side Chutes", dragArea: 500, mass: 0.2, cost: 300, size: 1.0, startsUnlocked: true },
  { id: "chute-side-l", type: "chute", mount: "side", name: "Big Side Chutes", dragArea: 1100, mass: 0.4, cost: 600, size: 1.3, startsUnlocked: false },

  // Heat shields: "ablator" is how much heat they can soak up before they're used up.
  // "dragArea" is how much they slow you down when facing into the air (they're blunt).
  { id: "shield-s", type: "shield", name: "Small Heat Shield", ablator: 150, dragArea: 3, mass: 0.2, cost: 200, size: 0.8, startsUnlocked: true },
  { id: "shield-m", type: "shield", name: "Heat Shield", ablator: 300, dragArea: 6, mass: 0.4, cost: 350, size: 1.0, startsUnlocked: true },
  { id: "shield-l", type: "shield", name: "Large Heat Shield", ablator: 700, dragArea: 12, mass: 0.9, cost: 700, size: 1.3, startsUnlocked: false },

  { id: "decoupler-s", type: "decoupler", name: "Small Decoupler", mass: 0.1, cost: 150, size: 0.8, startsUnlocked: true },
  { id: "decoupler-m", type: "decoupler", name: "Decoupler", mass: 0.2, cost: 250, size: 1.0, startsUnlocked: true },
  { id: "decoupler-l", type: "decoupler", name: "Large Decoupler", mass: 0.4, cost: 450, size: 1.3, startsUnlocked: false },

  { id: "fin", type: "wing", name: "Small Fins", mass: 0.1, cost: 120, size: 1.0, shape: "fin", startsUnlocked: true },
  { id: "swept", type: "wing", name: "Swept Wings", mass: 0.4, cost: 400, size: 1.0, shape: "swept", startsUnlocked: false },
  { id: "delta", type: "wing", name: "Delta Wings", mass: 0.8, cost: 900, size: 1.0, shape: "delta", startsUnlocked: false },

  { id: "probe", type: "pod", name: "Probe Core", crew: 0, mass: 0.1, cost: 300, size: 0.8, startsUnlocked: true },
  { id: "solo", type: "pod", name: "Solo Pod", crew: 1, mass: 0.8, cost: 600, size: 0.8, startsUnlocked: true },
  { id: "duo", type: "pod", name: "Duo Pod", crew: 2, mass: 1.6, cost: 1200, size: 1.0, startsUnlocked: false },
  { id: "trio", type: "pod", name: "Trio Pod", crew: 3, mass: 2.6, cost: 2000, size: 1.3, startsUnlocked: false },

  // Engines: "isp" is fuel efficiency (higher = burns fuel more slowly for the same thrust).
  // Solid engines carry their own "solidFuel"; their mass includes it.
  { id: "spark", type: "liquid", name: "Spark", thrust: 30, isp: 360, mass: 0.5, cost: 200, size: 0.6, startsUnlocked: true },
  { id: "ember", type: "liquid", name: "Ember", thrust: 90, isp: 380, mass: 1.2, cost: 600, size: 0.8, startsUnlocked: true },
  { id: "blaze", type: "liquid", name: "Blaze", thrust: 220, isp: 400, mass: 3.0, cost: 1500, size: 1.0, startsUnlocked: false },
  { id: "nova", type: "liquid", name: "Nova", thrust: 520, isp: 420, mass: 6.0, cost: 4000, size: 1.3, startsUnlocked: false },

  { id: "pebble", type: "solid", name: "Pebble", thrust: 60, isp: 250, solidFuel: 80, mass: 0.9, cost: 300, size: 0.7, startsUnlocked: true },
  { id: "boulder", type: "solid", name: "Boulder", thrust: 320, isp: 260, solidFuel: 500, mass: 5.0, cost: 1800, size: 1.1, startsUnlocked: false },

  { id: "tank-s", type: "tank", name: "Small Tank", fuel: 100, mass: 0.6, cost: 150, size: 1.0, height: 40, startsUnlocked: true },
  { id: "tank-m", type: "tank", name: "Medium Tank", fuel: 250, mass: 1.4, cost: 350, size: 1.0, height: 70, startsUnlocked: true },
  { id: "tank-l", type: "tank", name: "Large Tank", fuel: 500, mass: 2.8, cost: 700, size: 1.0, height: 110, startsUnlocked: false },

  // Science instruments: press E in flight to take a reading where you are.
  //   points = base science, multiplied by how interesting the biome is
  //   needs  = "any" (works anywhere), "air" (below 100 km), "ground" (only when landed)
  { id: "thermometer", type: "science", name: "Thermometer", points: 3, needs: "any", mass: 0.05, cost: 150, size: 0.8, startsUnlocked: false },
  { id: "barometer", type: "science", name: "Barometer", points: 5, needs: "air", mass: 0.05, cost: 300, size: 0.8, startsUnlocked: false },
  { id: "seismometer", type: "science", name: "Seismometer", points: 8, needs: "ground", mass: 0.1, cost: 500, size: 0.9, startsUnlocked: false },
];

// How much science it costs to unlock each locked part (Science and Business modes)
const scienceCosts = {
  thermometer: 5,
  "nose-l": 10,
  barometer: 15,
  swept: 15,
  "decoupler-l": 20,
  "chute-nose-l": 25,
  "tank-l": 25,
  seismometer: 30,
  "shield-l": 30,
  boulder: 35,
  "chute-side-l": 35,
  duo: 40,
  delta: 40,
  blaze: 45,
  trio: 120,
  nova: 150,
};

// The sections shown in the parts panel, in order
const partCategories = [
  { type: "pod", title: "Command Pods" },
  { type: "nose", title: "Nose Cones" },
  { type: "chute", title: "Parachutes" },
  { type: "shield", title: "Heat Shields" },
  { type: "decoupler", title: "Decouplers" },
  { type: "liquid", title: "Liquid Engines" },
  { type: "solid", title: "Solid Engines" },
  { type: "tank", title: "Fuel Tanks" },
  { type: "wing", title: "Wings & Fins" },
  { type: "science", title: "Science Instruments" },
];

// Wing shapes. Each fin is drawn on the left; the right one is a mirror copy.
// "left" is how far past the 60-wide drawing the fins reach.
const wingShapes = {
  fin: { height: 30, left: 10, points: "12,4 -8,28 12,24" },
  swept: { height: 50, left: 25, points: "12,4 -24,40 -24,48 12,40" },
  delta: { height: 60, left: 30, points: "12,0 -28,58 12,58" },
};

const STARTING_BUDGET = 5000;

const buildPage = document.getElementById("buildPage");
const buildBackButton = document.getElementById("buildBackButton");
const buildMode = document.getElementById("buildMode");
const budgetDisplay = document.getElementById("budgetDisplay");
const scienceDisplay = document.getElementById("scienceDisplay");
const partsPanel = document.getElementById("partsPanel");
const buildWarning = document.getElementById("buildWarning");
const statFuel = document.getElementById("statFuel");
const statCrew = document.getElementById("statCrew");
const clearButton = document.getElementById("clearButton");

// Clear removes every part from the rocket (and refunds the budget)
clearButton.addEventListener("click", () => {
  build.stack = [];
  renderRocket();
});
const rocketEl = document.getElementById("rocket");
const buildHint = document.getElementById("buildHint");
const statParts = document.getElementById("statParts");
const statMass = document.getElementById("statMass");
const statThrust = document.getElementById("statThrust");
const statCost = document.getElementById("statCost");
const statCostBox = document.getElementById("statCostBox");

// The rocket is a stack of entries, bottom first. Each entry is
// { part, side }, where "side" is an optional pair of side parachutes.
let build = { mode: null, stack: [] };

// Draws a part as an SVG. All parts share a 60-unit-wide drawing space.
function partSVG(part, scale = 1) {
  let viewHeight;
  let shapes;
  let viewX = 0; // Wings are wider than 60, so they start further left
  let viewWidth = 60;

  if (part.type === "science") {
    // Small instrument box with a different gadget on the front
    viewHeight = 24;
    let gadget = "";
    if (part.id === "thermometer") {
      gadget = `
        <rect x="27" y="4" width="6" height="12" rx="3" fill="#eef1f4" />
        <rect x="29" y="8" width="2" height="9" fill="#ff5c35" />
        <circle cx="30" cy="18" r="3.5" fill="#ff5c35" />`;
    } else if (part.id === "barometer") {
      gadget = `
        <circle cx="30" cy="12" r="8" fill="#eef1f4" />
        <line x1="30" y1="12" x2="35" y2="8" stroke="#2b3340" stroke-width="1.5" />
        <circle cx="30" cy="12" r="1.5" fill="#2b3340" />`;
    } else {
      gadget = `
        <rect x="19" y="5" width="22" height="14" rx="1" fill="#16202a" />
        <polyline points="20,12 24,12 26,7 28,17 30,9 32,14 34,12 40,12" fill="none" stroke="#7ee787" stroke-width="1.2" />`;
    }
    shapes = `
      <rect x="14" y="0" width="32" height="24" rx="2" fill="#59616b" />
      <rect x="38" y="0" width="8" height="24" fill="#000" opacity="0.15" />
      ${gadget}`;
  } else if (part.type === "chute" && part.mount === "side") {
    // Small canister that clips onto the side of a part
    viewHeight = 30;
    viewWidth = 16;
    shapes = `
      <rect x="2" y="2" width="12" height="26" rx="4" fill="#ff8c32" />
      <rect x="2" y="9" width="12" height="3" fill="#ffffff" />
      <rect x="2" y="18" width="12" height="3" fill="#ffffff" />
      <rect x="10" y="2" width="4" height="26" fill="#000" opacity="0.12" />`;
  } else if (part.type === "chute") {
    // Rounded parachute cap that sits on top of the rocket
    viewHeight = 34;
    shapes = `
      <path d="M12 34 L12 20 Q12 2 30 2 Q48 2 48 20 L48 34 Z" fill="#ff8c32" />
      <path d="M22 4 Q30 2 38 4 L38 34 L22 34 Z" fill="#ffffff" opacity="0.85" />
      <path d="M38 4 Q48 8 48 20 L48 34 L40 34 Z" fill="#000" opacity="0.12" />
      <rect x="12" y="30" width="36" height="4" fill="#9aa4b1" />`;
  } else if (part.type === "shield") {
    // Wide, shallow brown dish with a metal rim
    viewHeight = 14;
    shapes = `
      <path d="M9 2 L51 2 L51 5 Q30 17 9 5 Z" fill="#6b4a3a" />
      <path d="M38 2 L51 2 L51 5 Q44 10 38 11 Z" fill="#000" opacity="0.15" />
      <rect x="9" y="0" width="42" height="3" fill="#9aa4b1" />`;
  } else if (part.type === "decoupler") {
    // Thin dark ring with yellow and black hazard stripes
    viewHeight = 12;
    shapes = `
      <rect x="12" y="0" width="36" height="12" fill="#3a4049" />
      <rect x="12" y="4" width="36" height="4" fill="#f7c948" />
      <path d="M15 4 L18 4 L16 8 L13 8 Z M23 4 L26 4 L24 8 L21 8 Z M31 4 L34 4 L32 8 L29 8 Z M39 4 L42 4 L40 8 L37 8 Z M47 4 L48 4 L48 6 Z" fill="#1a1d22" />`;
  } else if (part.type === "nose") {
    // Curved cone with a small tip
    const h = part.height;
    viewHeight = h;
    shapes = `
      <path d="M30 0 Q46 ${h * 0.35} 48 ${h} L12 ${h} Q14 ${h * 0.35} 30 0 Z" fill="#dfe5eb" />
      <path d="M30 0 Q46 ${h * 0.35} 48 ${h} L38 ${h} Q38 ${h * 0.35} 30 0 Z" fill="#000" opacity="0.12" />
      <rect x="12" y="${h - 4}" width="36" height="4" fill="#ff8c32" />`;
  } else if (part.type === "wing") {
    // A short body section with a fin on each side
    const wing = wingShapes[part.shape];
    viewHeight = wing.height;
    viewX = -wing.left;
    viewWidth = 60 + wing.left * 2;
    const mirrored = wing.points
      .split(" ")
      .map((pt) => {
        const [x, y] = pt.split(",").map(Number);
        return `${60 - x},${y}`;
      })
      .join(" ");
    shapes = `
      <polygon points="${wing.points}" fill="#cfd8dc" />
      <polygon points="${mirrored}" fill="#aab4be" />
      <rect x="12" y="0" width="36" height="${wing.height}" fill="#9aa4b1" />
      <rect x="38" y="0" width="10" height="${wing.height}" fill="#000" opacity="0.12" />
      <rect x="12" y="${wing.height / 2 - 2}" width="36" height="4" fill="#ff8c32" />`;
  } else if (part.type === "liquid") {
    // Mount plate, body, and a bell-shaped nozzle
    viewHeight = 70;
    shapes = `
      <rect x="12" y="0" width="36" height="12" rx="2" fill="#9aa4b1" />
      <rect x="12" y="4" width="36" height="3" fill="#ff8c32" />
      <rect x="20" y="12" width="20" height="14" fill="#6b7380" />
      <path d="M20 26 L40 26 L54 66 Q30 72 6 66 Z" fill="#c9d1da" />
      <path d="M20 26 L40 26 L42 32 L18 32 Z" fill="#8a94a1" />
      <path d="M26 30 L34 30 L46 64 Q30 68 14 64 Z" fill="#4b525c" opacity="0.5" />`;
  } else if (part.type === "solid") {
    // Tall white casing with red stripes and a short dark nozzle
    viewHeight = 110;
    shapes = `
      <rect x="14" y="0" width="32" height="6" fill="#9aa4b1" />
      <rect x="14" y="6" width="32" height="84" fill="#eef1f4" />
      <rect x="14" y="20" width="32" height="6" fill="#ff5c35" />
      <rect x="14" y="70" width="32" height="6" fill="#ff5c35" />
      <rect x="38" y="6" width="8" height="84" fill="#000" opacity="0.12" />
      <path d="M20 90 L40 90 L48 110 L12 110 Z" fill="#4b525c" />`;
  } else if (part.type === "pod" && part.crew === 0) {
    // Probe core: small box with an antenna and a status light
    viewHeight = 34;
    shapes = `
      <line x1="30" y1="0" x2="30" y2="10" stroke="#cfd8dc" stroke-width="2" />
      <circle cx="30" cy="2" r="2" fill="#cfd8dc" />
      <rect x="14" y="10" width="32" height="24" rx="3" fill="#9aa4b1" />
      <rect x="38" y="10" width="8" height="24" fill="#000" opacity="0.15" />
      <rect x="19" y="15" width="14" height="10" rx="1" fill="#2b3340" />
      <circle cx="26" cy="20" r="2.5" fill="#7ee787" />`;
  } else if (part.type === "pod") {
    // Crewed capsule: cone with a window, hatch, and heat shield
    viewHeight = 50;
    shapes = `
      <rect x="23" y="0" width="14" height="3" fill="#9aa4b1" />
      <path d="M20 3 L40 3 L48 46 L12 46 Z" fill="#dfe5eb" />
      <path d="M34 3 L40 3 L48 46 L40 46 Z" fill="#000" opacity="0.12" />
      <circle cx="30" cy="24" r="6" fill="#4fc3f7" stroke="#6b7380" stroke-width="2" />
      <circle cx="28" cy="22" r="1.8" fill="#ffffff" opacity="0.7" />
      <rect x="12" y="46" width="36" height="4" fill="#6b4a3a" />`;
  } else {
    // Fuel tank: cylinder with metal rings and an orange band
    const h = part.height;
    viewHeight = h;
    shapes = `
      <rect x="12" y="0" width="36" height="${h}" fill="#dfe5eb" />
      <rect x="12" y="0" width="36" height="5" fill="#9aa4b1" />
      <rect x="12" y="${h - 5}" width="36" height="5" fill="#9aa4b1" />
      <rect x="12" y="${h / 2 - 3}" width="36" height="6" fill="#ff8c32" />
      <rect x="38" y="0" width="10" height="${h}" fill="#000" opacity="0.12" />`;
  }

  const width = Math.round(viewWidth * part.size * scale);
  const height = Math.round(viewHeight * part.size * scale);
  return `
    <svg width="${width}" height="${height}" viewBox="${viewX} 0 ${viewWidth} ${viewHeight}" aria-hidden="true">
      ${shapes}
    </svg>`;
}

// ---------- Science career (saved separately for Science and Business mode) ----------
// Remembers your science points, unlocked parts, and which biomes and
// experiments you've already done, even after closing the page.
let career = null;

function emptyCareer() {
  return { science: 0, funds: 0, unlocked: [], discovered: [], experiments: [] };
}

function loadCareer(mode) {
  if (mode === "creative") return null; // no science in Creative
  try {
    const saved = JSON.parse(localStorage.getItem("spaceMission.career." + mode));
    if (saved) return { ...emptyCareer(), ...saved };
  } catch (error) {
    // Saving isn't available (e.g. private browsing): just start fresh
  }
  return emptyCareer();
}

function saveCareer() {
  if (!career) return;
  try {
    localStorage.setItem("spaceMission.career." + build.mode, JSON.stringify(career));
  } catch (error) {
    // Couldn't save: the career still works until the page is closed
  }
}

function updateScienceDisplay() {
  scienceDisplay.hidden = !career;
  if (career) scienceDisplay.textContent = `🔬 Science: ${Math.floor(career.science)}`;
}

function isUnlocked(part) {
  return !career || part.startsUnlocked || career.unlocked.includes(part.id);
}

// Spend science to unlock a part
function unlockPart(part) {
  const cost = scienceCosts[part.id] || 0;
  if (career.science < cost) {
    showHintMessage(`You need ${cost} science to unlock the ${part.name}.`);
    return;
  }
  career.science -= cost;
  career.unlocked.push(part.id);
  saveCareer();
  updateScienceDisplay();
  renderPartsList();
  showHintMessage(`Unlocked the ${part.name}!`);
}

// Every part on the rocket, including side parachutes, as one flat list
function allPlacedParts() {
  return build.stack.flatMap((entry) => (entry.side ? [entry.part, entry.side] : [entry.part]));
}

function totalCost() {
  return allPlacedParts().reduce((sum, p) => sum + p.cost, 0);
}

function budgetLeft() {
  // Business quests add to your budget for every rocket
  const bonus = career && career.funds ? career.funds : 0;
  return STARTING_BUDGET + bonus - totalCost();
}

function openBuilder(mode) {
  build = { mode, stack: [] };
  career = loadCareer(mode);
  updateScienceDisplay();
  loadQuests(mode);
  buildMode.textContent = modes[mode].name + " Mode";

  // Cost only matters in Business mode
  const hasBudget = mode === "business";
  budgetDisplay.hidden = !hasBudget;
  statCostBox.hidden = !hasBudget;

  renderPartsList();
  renderRocket();

  confirmPage.hidden = true;
  buildPage.hidden = false;
}

function renderPartsList() {
  partsPanel.innerHTML = "";
  const hasBudget = build.mode === "business";

  partCategories.forEach((category) => {
    const heading = document.createElement("h3");
    heading.textContent = category.title;
    partsPanel.appendChild(heading);

    const list = document.createElement("div");
    list.className = "parts-list";
    partsPanel.appendChild(list);

    parts
      .filter((part) => part.type === category.type)
      .forEach((part) => {
        const unlocked = isUnlocked(part);
        const card = document.createElement("button");
        const unlockCost = scienceCosts[part.id] || 0;
        const affordable = !unlocked && career && career.science >= unlockCost;
        card.className = "part-card" + (unlocked ? "" : " locked") + (affordable ? " affordable" : "");

        let statLines;
        let note;
        if (part.type === "pod") {
          statLines = `Crew: ${part.crew}<br>Mass: ${part.mass.toFixed(1)} t`;
          note = part.crew === 0 ? "Uncrewed: flies itself" : "Controls the rocket";
        } else if (part.type === "nose") {
          statLines = `Mass: ${part.mass.toFixed(1)} t`;
          note = "Reduces air drag";
        } else if (part.type === "wing") {
          statLines = `Mass: ${part.mass.toFixed(1)} t`;
          note = "Keeps the rocket stable";
        } else if (part.type === "shield") {
          statLines = `Protection: ${part.ablator}<br>Mass: ${part.mass.toFixed(1)} t`;
          note = "Must be the bottom part, facing the way you fall";
        } else if (part.type === "decoupler") {
          statLines = `Mass: ${part.mass.toFixed(1)} t`;
          note = "Separates rocket stages";
        } else if (part.type === "chute") {
          statLines = `Mass: ${part.mass.toFixed(1)} t`;
          note = part.mount === "side"
            ? "Pair: attaches to the sides of the top part"
            : "Goes on top like a nose cone";
        } else if (part.type === "science") {
          statLines = `Science: ${part.points} × biome<br>Mass: ${part.mass.toFixed(2)} t`;
          note = { any: "Works anywhere", air: "Needs air (below 100 km)", ground: "Only works when landed" }[part.needs];
        } else if (part.type === "tank") {
          statLines = `Fuel: ${part.fuel}<br>Mass: ${part.mass.toFixed(1)} t`;
          note = "For liquid engines";
        } else if (part.type === "liquid") {
          statLines =
            `Thrust: ${part.thrust} kN<br>Mass: ${part.mass.toFixed(1)} t<br>` +
            `Burns: ${burnRate(part).toFixed(1)} fuel/s`;
          note = "Needs a fuel tank";
        } else {
          const seconds = Math.round(part.solidFuel / burnRate(part));
          statLines =
            `Thrust: ${part.thrust} kN<br>Mass: ${part.mass.toFixed(1)} t<br>` +
            `Fuel: ${part.solidFuel} (burns ${seconds}s)`;
          note = "Fuel built in";
        }
        if (hasBudget) statLines += `<br>Cost: $${part.cost.toLocaleString()}`;

        const bottomLine = unlocked
          ? `<div class="part-note">${note}</div>`
          : `<div class="part-locked">🔒 Unlock: ${unlockCost} 🔬${affordable ? " (click)" : ""}</div>`;

        card.innerHTML = `
          <div class="part-icon">${partSVG(part, 0.7)}</div>
          <div>
            <div class="part-name">${part.name}</div>
            <div class="part-stats">${statLines}</div>
            ${bottomLine}
          </div>`;

        card.addEventListener("click", () => (unlocked ? addPart(part) : unlockPart(part)));
        list.appendChild(card);
      });
  });
}

function addPart(part) {
  if (build.mode === "business" && part.cost > budgetLeft()) {
    // Not enough money: flash the budget red
    budgetDisplay.classList.add("over-budget");
    setTimeout(() => budgetDisplay.classList.remove("over-budget"), 600);
    return;
  }

  if (part.mount === "side") {
    // Side parachutes attach to the top part of the rocket
    const top = build.stack[build.stack.length - 1];
    if (!top) {
      showHintMessage("Add a part first: side parachutes attach to the top part.");
      return;
    }
    if (top.side) {
      showHintMessage("The top part already has side parachutes.");
      return;
    }
    top.side = part;
  } else {
    build.stack.push({ part, side: null });
  }
  renderRocket();
}

function removePart(index) {
  build.stack.splice(index, 1);
  renderRocket();
}

function removeSide(index) {
  build.stack[index].side = null;
  renderRocket();
}

// Shows a short orange message in place of the hint, then puts the hint back
let hintTimer = null;
function showHintMessage(message) {
  clearTimeout(hintTimer);
  buildHint.textContent = message;
  buildHint.classList.add("hint-alert");
  hintTimer = setTimeout(updateHint, 2500);
}

function updateHint() {
  buildHint.classList.remove("hint-alert");
  buildHint.textContent = build.stack.length
    ? "Click a part on your rocket to remove it"
    : "Click a part to add it to your rocket";
}

// Builds one row of the launch-pad rocket: [left chute] part [right chute].
// Engines also get a flame underneath that shows while they are burning.
function stackRowHTML(entry, index) {
  const sideSVG = entry.side ? partSVG(entry.side, 1.2) : "";
  let flame = "";
  if (entry.part.type === "liquid" || entry.part.type === "solid") {
    const partWidth = 60 * entry.part.size * 1.2;
    const nozzleWidth = Math.round(partWidth * (entry.part.type === "liquid" ? 0.75 : 0.55));
    flame = `<div class="flame" style="width:${nozzleWidth}px;height:${nozzleWidth * 2.4}px"></div>`;
  }
  return `
    <div class="stack-item" data-index="${index}">
      ${sideSVG}${partSVG(entry.part, 1.2)}${sideSVG ? `<span class="mirror">${sideSVG}</span>` : ""}
      ${flame}
    </div>`;
}

function renderRocket() {
  rocketEl.innerHTML = "";

  // The first part added sits at the bottom (the column is reversed in CSS)
  build.stack.forEach((entry, index) => {
    const row = document.createElement("div");
    row.className = "stack-item";

    const makeButton = (part, onClick, extraClass = "") => {
      const button = document.createElement("button");
      button.className = "placed-part " + extraClass;
      button.title = `${part.name} (click to remove)`;
      button.innerHTML = partSVG(part, 1.2);
      button.addEventListener("click", onClick);
      return button;
    };

    if (entry.side) row.appendChild(makeButton(entry.side, () => removeSide(index)));
    row.appendChild(makeButton(entry.part, () => removePart(index)));
    if (entry.side) row.appendChild(makeButton(entry.side, () => removeSide(index), "mirror"));

    rocketEl.appendChild(row);
  });

  clearButton.disabled = build.stack.length === 0;
  clearTimeout(hintTimer);
  updateHint();

  const placed = allPlacedParts();
  const mass = placed.reduce((sum, p) => sum + p.mass, 0);
  const thrust = placed.reduce((sum, p) => sum + (p.thrust || 0), 0);
  const fuel = placed.reduce((sum, p) => sum + (p.fuel || 0), 0);
  statParts.textContent = placed.length;
  statMass.textContent = mass.toFixed(1) + " t";
  statThrust.textContent = thrust + " kN";
  statFuel.textContent = fuel;
  statCrew.textContent = placed.reduce((sum, p) => sum + (p.crew || 0), 0);

  // Check the rocket for problems
  const hasLiquidEngine = placed.some((p) => p.type === "liquid");
  const hasTank = placed.some((p) => p.type === "tank");
  const hasPod = placed.some((p) => p.type === "pod");
  const warnings = [];
  if (placed.length > 0 && !hasPod) {
    warnings.push("⚠ Your rocket needs a command pod or probe core to be controlled.");
  }
  if (hasLiquidEngine && !hasTank) {
    warnings.push("⚠ Liquid engines need a fuel tank!");
  } else if (hasTank && !hasLiquidEngine) {
    warnings.push("⚠ Fuel tanks need a liquid engine to use their fuel.");
  }
  buildWarning.textContent = warnings.join("\n");
  buildWarning.hidden = warnings.length === 0;
  statCost.textContent = "$" + totalCost().toLocaleString();
  budgetDisplay.textContent = "Budget: $" + budgetLeft().toLocaleString();
}

// ---------- Launch page ----------
const launchButton = document.getElementById("launchButton");
const launchPage = document.getElementById("launchPage");
const launchBackButton = document.getElementById("launchBackButton");
const launchMode = document.getElementById("launchMode");
const launchRocket = document.getElementById("launchRocket");
const launchEmpty = document.getElementById("launchEmpty");

// Launch Rocket puts the current rocket on the launch pad
launchButton.addEventListener("click", () => {
  launchMode.textContent = modes[build.mode].name + " Mode";
  launchRocket.innerHTML = build.stack.map(stackRowHTML).join("");
  launchEmpty.hidden = build.stack.length > 0;

  buildPage.hidden = true;
  launchPage.hidden = false;
  // Stop the Space key from "clicking" whichever button was last focused
  if (document.activeElement) document.activeElement.blur();

  setTimeWarp(1);
  resetFlight();
  layoutLaunchScene();
});

const launchScene = document.getElementById("launchScene");
const launchCanvas = document.getElementById("launchCanvas");
const flightHud = document.getElementById("flightHud");
const flightMessage = document.getElementById("flightMessage");
const explosion = document.getElementById("explosion");

// Camera settings, worked out in layoutLaunchScene
const camera = {
  width: 0,
  height: 0,
  zoom: 1,
  padScreenY: 0,
  x: 0, // world x (pixels) shown in the middle of the screen
  y: 0, // world y (pixels) shown where the pad normally sits; goes negative when following the rocket up
  towerWidth: 0, // size of the full rocket on the pad, used for the tower and zoom
  towerHeight: 0,
};

const mapCanvas = document.getElementById("mapCanvas");
const mapButton = document.getElementById("mapButton");
let mapOpen = false;

// Picks the zoom so the full rocket fits nicely, then draws everything
function layoutLaunchScene() {
  camera.width = launchScene.clientWidth;
  camera.height = launchScene.clientHeight;
  camera.padScreenY = camera.height - 90; // leave room to see the ground below the pad
  camera.zoom = clamp((camera.padScreenY - 60) / (camera.towerHeight + 80), 0.35, 1.6);
  updateLaunchView();
}

// Turns a local position (metres along the ground from the pad, metres up) into screen pixels
function toScreen(x, y) {
  return {
    x: camera.width / 2 + (x * PIXELS_PER_METER - camera.x) * camera.zoom,
    y: camera.padScreenY + (-y * PIXELS_PER_METER - camera.y) * camera.zoom,
  };
}

// Puts a rocket (or a dropped piece of one) on screen, centred on (x, y) and tilted
function placeOnScreen(element, x, y, angle) {
  const point = toScreen(x, y);
  element.style.left = point.x + "px";
  element.style.top = point.y + "px";
  element.style.transform = `translate(-50%, -50%) rotate(${angle}rad) scale(${camera.zoom})`;
}

// Moves the camera to follow the rocket, then redraws the world and the rocket
function updateLaunchView() {
  const { width, height, zoom, padScreenY } = camera;

  // Follow the rocket sideways, and upward once it climbs past ~65% of the screen
  // (or the astronaut, when they're out walking)
  const eva = flight.eva;
  const focusX = eva ? eva.x : flight.x;
  const extent = eva ? EVA_HEIGHT / 2 : halfExtent(flight.width, flight.height, flight.angle);
  const bottomWorldY = -((eva ? eva.y + EVA_HEIGHT / 2 : flight.y) - extent) * PIXELS_PER_METER;
  const groundWorldY = -groundHeightAt(focusX) * PIXELS_PER_METER;
  const followY = Math.min(padScreenY, Math.max(height * 0.65, extent * 2 * PIXELS_PER_METER * zoom + 40));
  camera.x = focusX * PIXELS_PER_METER;
  camera.y = Math.min(groundWorldY, bottomWorldY - (followY - padScreenY) / zoom);

  placeOnScreen(launchRocket, flight.x, flight.y, flight.angle);
  if (eva) placeAstronaut();
  flight.debris.forEach((piece) => {
    const local = localView(piece);
    placeOnScreen(piece.el, local.x, local.y, local.angle);
  });

  drawLaunchWorld(launchCanvas, {
    width,
    height,
    zoom,
    padScreenY,
    cameraX: camera.x,
    cameraY: camera.y,
    altitude: flight.altitude,
    body: flight.body.id,
    rocketWidth: camera.towerWidth,
    rocketHeight: camera.towerHeight,
  });

  // Light up the flame under each engine that is burning
  launchRocket.querySelectorAll(".stack-item").forEach((row) => row.classList.remove("firing"));
  flight.engines.forEach((engine) => {
    if (!engine.burning) return;
    const row = launchRocket.querySelector(`.stack-item[data-index="${engine.index}"]`);
    if (row) row.classList.add("firing");
  });

  // Glowing hot during reentry
  const glow = Math.min(1, flight.heatRate / 6);
  launchRocket.style.filter =
    glow > 0.05 ? `drop-shadow(0 0 ${6 + glow * 18}px rgba(255, ${Math.round(150 - glow * 90)}, 40, ${0.4 + glow * 0.6}))` : "";

  if (mapOpen) drawMap();
}

window.addEventListener("resize", () => {
  if (!launchPage.hidden) layoutLaunchScene();
});

// ---------- Planet and physics ----------
// The planet is round and smaller than Earth (600 km across the middle to the
// surface), like in many space games, so orbit needs about 2.2 km/s instead of 7.8 km/s.
//
// Physics uses "planet coordinates": metres from the centre of the planet, with
// the launch pad straight up at (0, PLANET_RADIUS). The rocket's "heading" is
// which way it points in space (0 = the pad's straight up, positive = clockwise).
// For drawing, positions are turned into "local" coordinates: distance along
// the ground from the pad, height above the pad, and tilt from local straight up.
const GRAVITY = 9.81; // m/s² at the surface
const FUEL_UNIT_KG = 5; // one unit of fuel weighs 5 kg
const PIXELS_PER_METER = 10; // how big the world is drawn
const PLANET_RADIUS = 600000; // metres
const GM = GRAVITY * PLANET_RADIUS ** 2; // planet's gravity strength
const SPACE_ALTITUDE = 100000; // metres: the edge of space
const SOFT_LANDING_SPEED = 8; // m/s: gentle touchdown
const SAFE_LANDING_SPEED = 20; // m/s: anything faster is a crash
const STEER_RATE = (60 * Math.PI) / 180; // A/D turn the rocket 60° per second
const BODY_DRAG_AREA = 0.2; // m²: the rocket body's own air resistance
// Reentry heating: going fast through air heats the rocket (heat ∝ √air density × speed³).
// At 100% heat it burns up. It slowly cools down again when it isn't heating.
const HEATING = 9e-9;
const COOLING = 0.05; // fraction of heat lost per second
const SHIELD_BLOCKS = 0.95; // a working heat shield stops 95% of the heat

// How many fuel units an engine burns each second at full thrust.
// Real rocket formula: fuel flow = thrust ÷ (isp × gravity).
function burnRate(part) {
  return (part.thrust * 1000) / (part.isp * GRAVITY) / FUEL_UNIT_KG;
}

// Keeps an angle between -180° and 180° (in radians)
function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

// Half of how tall a tilted box is, measured straight up and down
function halfExtent(width, height, angle) {
  return Math.abs((height / 2) * Math.cos(angle)) + Math.abs((width / 2) * Math.sin(angle));
}

// The four corners of a tilted box centred on (x, y), in local metres.
// Angle 0 = pointing straight up; positive = leaning right.
function boxCorners(x, y, width, height, angle) {
  const up = { x: Math.sin(angle), y: Math.cos(angle) };
  const right = { x: Math.cos(angle), y: -Math.sin(angle) };
  const corners = [];
  [-1, 1].forEach((u) => {
    [-1, 1].forEach((r) => {
      corners.push({
        x: x + up.x * (height / 2) * u + right.x * (width / 2) * r,
        y: y + up.y * (height / 2) * u + right.y * (width / 2) * r,
      });
    });
  });
  return corners;
}

// ---------- The planet and the Moon ----------
// The Moon circles the planet once every ~39 hours of game time, going the same
// way you orbit (clockwise on the map). Close to the Moon (inside its "sphere of
// influence") the Moon's gravity takes over from the planet's.
const PLANET = { id: "planet", name: "Planet", radius: PLANET_RADIUS, gm: GM };
const MOON = {
  id: "moon",
  name: "Moon",
  radius: 200000, // metres (a third of the planet)
  gm: 1.63 * 200000 ** 2, // 1.63 m/s² at the surface (like our Moon)
  orbitRadius: 12000000, // 12,000 km from the planet's centre
  startAngle: 2.5, // where it is around the planet when you launch (radians, clockwise from the pad)
};
MOON.speed = Math.sqrt(GM / MOON.orbitRadius ** 3); // radians per second
MOON.soi = MOON.orbitRadius * (MOON.gm / GM) ** 0.4; // ~2,400 km

// Where a body's centre is (and how fast it moves) at a time in the flight
function bodyState(body, time) {
  if (body !== MOON) return { x: 0, y: 0, vx: 0, vy: 0 };
  const a = MOON.startAngle + MOON.speed * time;
  const r = MOON.orbitRadius;
  return { x: r * Math.sin(a), y: r * Math.cos(a), vx: r * MOON.speed * Math.cos(a), vy: -r * MOON.speed * Math.sin(a) };
}

// Which body's gravity is in charge at a point: the Moon's when close to it
function referenceBody(px, py, time) {
  const moon = bodyState(MOON, time);
  return Math.hypot(px - moon.x, py - moon.y) < MOON.soi ? MOON : PLANET;
}

// Position and velocity relative to a body's centre
function relativeState(obj, body, time = flight.time) {
  const c = bodyState(body, time);
  return { px: obj.px - c.x, py: obj.py - c.y, vx: obj.vx - c.vx, vy: obj.vy - c.vy };
}

// Height of the ground (or sea) at x metres along the ground, in metres above the pad
// (on the Moon: above the Moon's average surface)
function groundHeightAt(x, body = flight.body) {
  if (body === MOON) return moonTerrainHeight(x);
  return -surfaceAt(x * PIXELS_PER_METER).y / PIXELS_PER_METER;
}

// How far the lowest corner of a tilted box is sunk into the ground (negative = above it)
function deepestPoint(x, y, width, height, angle, body = flight.body) {
  let deepest = -Infinity;
  boxCorners(x, y, width, height, angle).forEach((corner) => {
    deepest = Math.max(deepest, groundHeightAt(corner.x, body) - corner.y);
  });
  return deepest;
}

// Turns planet coordinates into local ones (see the note at the top of this section),
// measured around whichever body you're near
function localView(obj, body = flight.body) {
  const c = bodyState(body, flight.time);
  const rx = obj.px - c.x;
  const ry = obj.py - c.y;
  const r = Math.hypot(rx, ry);
  const theta = Math.atan2(rx, ry); // how far around the body (from the pad, on the planet)
  return {
    x: body.radius * theta,
    y: r - body.radius,
    angle: normalizeAngle(obj.heading - theta),
    up: { x: rx / r, y: ry / r },
    theta,
  };
}

// Gravity pulls toward the centre of the body you're near, weaker further away
function gravityPull(px, py, time = flight.time) {
  const body = referenceBody(px, py, time);
  const c = bodyState(body, time);
  const rx = px - c.x;
  const ry = py - c.y;
  const r = Math.hypot(rx, ry);
  const strength = body.gm / (r * r);
  const pull = { x: (-rx / r) * strength, y: (-ry / r) * strength };
  // Near the Moon you also get swung around the planet along with it
  // (so paths around the Moon stay steady while it travels)
  if (body === MOON) {
    const d = Math.hypot(c.x, c.y);
    const swing = GM / (d * d);
    pull.x -= (c.x / d) * swing;
    pull.y -= (c.y / d) * swing;
  }
  return pull;
}

// Works out the shape of the path the rocket is coasting along around a body:
// its highest point (apoapsis) and lowest point (periapsis), as heights above the ground.
function orbitInfo(px, py, vx, vy, body = PLANET) {
  const mu = body.gm;
  const r = Math.hypot(px, py);
  const speed2 = vx * vx + vy * vy;
  const energy = speed2 / 2 - mu / r;
  const angularMomentum = px * vy - py * vx;
  const radialSpeed = px * vx + py * vy;
  const ex = ((speed2 - mu / r) * px - radialSpeed * vx) / mu;
  const ey = ((speed2 - mu / r) * py - radialSpeed * vy) / mu;
  const e = Math.hypot(ex, ey);
  const semiLatus = (angularMomentum * angularMomentum) / mu;
  const periRadius = semiLatus / (1 + e);
  const escaping = energy >= 0;
  const apoRadius = escaping ? Infinity : semiLatus / (1 - e);
  return {
    e,
    semiLatus,
    argument: Math.atan2(ey, ex), // direction of the lowest point
    periapsis: periRadius - body.radius,
    apoapsis: apoRadius - body.radius,
    escaping,
    period: escaping ? Infinity : 2 * Math.PI * Math.sqrt((-mu / (2 * energy)) ** 3 / mu),
  };
}

// The rocket's current path around whichever body it's near
function currentOrbit(f = flight) {
  const rel = relativeState(f, f.body);
  return orbitInfo(rel.px, rel.py, rel.vx, rel.vy, f.body);
}

// Going round and round without hitting the ground (or air)?
function isOrbiting(f = flight) {
  if (!f.leftGround || f.state !== "flying") return false;
  const orbit = currentOrbit(f);
  if (orbit.escaping) return false;
  if (f.body === MOON) return orbit.periapsis > 10000 && orbit.apoapsis + MOON.radius < MOON.soi;
  return orbit.periapsis > SPACE_ALTITUDE;
}

// How far ahead of you the Moon is around the planet, 0–360° in the direction you orbit
function moonAheadDegrees() {
  const moon = bodyState(MOON, flight.time);
  const diff = Math.atan2(moon.x, moon.y) - Math.atan2(flight.px, flight.py);
  return Math.round((((diff * 180) / Math.PI) % 360 + 360) % 360);
}

let flight = null;
let flightFrameId = null;
let lastFrameTime = 0;

// Which steering keys are held down
const steering = { left: false, right: false, prograde: false, retrograde: false, jump: false };

// Speed-up button: each click moves to the next speed, then back to 1x
const WARP_SPEEDS = [1, 2, 4, 10, 50, 100, 1000, 10000];
const SAFE_WARP = 100; // fastest allowed while engines burn, in the air, or close to the ground
let timeWarp = 1;
const speedButton = document.getElementById("speedButton");

function setTimeWarp(speed) {
  timeWarp = speed;
  updateSpeedButton();
}

function updateSpeedButton() {
  const actual = flight ? effectiveWarp() : timeWarp;
  const text = actual < timeWarp ? `⏩ ${timeWarp}x (${actual}x now)` : `⏩ ${timeWarp}x`;
  if (speedButton.textContent !== text) speedButton.textContent = text;
  speedButton.classList.toggle("active", timeWarp > 1);
}

// Are any engines actually able to push right now?
function enginesRunning() {
  return flight.engines.some((e) => {
    if (!e.ignited || !isAttached(e.index)) return false;
    if (e.part.type === "solid") return e.fuel > 0;
    return !e.shutOff && flight.sections[e.section].liquidFuel > 0;
  });
}

// Is the rocket somewhere that needs small, careful physics steps?
function needsCarefulSteps() {
  const inAir = flight.body === PLANET && flight.altitude < SPACE_ALTITUDE;
  return enginesRunning() || inAir || flight.altitude < 20000;
}

// The really big speed-ups only work while coasting high above everything
function effectiveWarp() {
  if (flight.state !== "flying") return timeWarp;
  return needsCarefulSteps() ? Math.min(timeWarp, SAFE_WARP) : timeWarp;
}

// The longest physics step that stays accurate here (seconds of game time)
function maxPhysicsStep() {
  if (needsCarefulSteps()) return 0.0125;
  const rel = relativeState(flight, flight.body);
  const r = Math.hypot(rel.px, rel.py);
  return 0.004 * Math.sqrt(r ** 3 / flight.body.gm);
}

speedButton.addEventListener("click", () => {
  const next = WARP_SPEEDS[(WARP_SPEEDS.indexOf(timeWarp) + 1) % WARP_SPEEDS.length];
  setTimeWarp(next);
  speedButton.blur(); // so Space keeps controlling the rocket, not this button
});

// Pause button (or Esc): freezes everything until pressed again
let paused = false;
const pauseButton = document.getElementById("pauseButton");

function setPaused(value) {
  paused = value;
  pauseButton.textContent = paused ? "▶ Resume" : "⏸ Pause";
  pauseButton.classList.toggle("active", paused);
  launchScene.classList.toggle("paused", paused);
  steering.left = steering.right = steering.prograde = steering.retrograde = steering.jump = false;
  if (flight) renderFlightHud();
}

pauseButton.addEventListener("click", () => {
  setPaused(!paused);
  pauseButton.blur(); // so Space keeps controlling the rocket, not this button
});

// ---------- Science ----------
// Biomes are the different places you can be. More interesting (harder to
// reach) biomes multiply the science you get there.
const BIOMES = {
  launchPad: { name: "Launch Pad", multiplier: 1 },
  grasslands: { name: "Grasslands", multiplier: 1.5 },
  hills: { name: "Hills", multiplier: 2 },
  mountains: { name: "Mountains", multiplier: 3 },
  beach: { name: "Beach", multiplier: 2 },
  ocean: { name: "Ocean", multiplier: 2.5 },
  lowerAir: { name: "Lower Air", multiplier: 2 },
  upperAir: { name: "Upper Air", multiplier: 4 },
  lowSpace: { name: "Low Space", multiplier: 8 },
  highSpace: { name: "High Space", multiplier: 12 },
  nearMoon: { name: "Near the Moon", multiplier: 15 },
  moonLowlands: { name: "Moon Lowlands", multiplier: 20 },
  moonHighlands: { name: "Moon Highlands", multiplier: 25 },
};
const DISCOVERY_POINTS = 4; // × biome multiplier, for reaching a biome for the first time
const ORBIT_POINTS = 60; // the orbit experiment
const MOON_ORBIT_POINTS = 100; // orbiting the Moon

function isOnSurface() {
  return !flight.leftGround || (flight.state === "ended" && flight.result !== "crashed");
}

function currentBiome() {
  if (flight.eva) {
    if (flight.body === MOON) return moonBiome(flight.eva.x);
    return surfaceAt(flight.eva.x * PIXELS_PER_METER).water ? "ocean" : surfaceBiome(flight.eva.x * PIXELS_PER_METER);
  }
  if (flight.body === MOON) return isOnSurface() ? moonBiome(flight.x) : "nearMoon";
  if (isOnSurface()) return surfaceBiome(flight.x * PIXELS_PER_METER);
  if (flight.altitude < 12000) return "lowerAir";
  if (flight.altitude < SPACE_ALTITUDE) return "upperAir";
  if (flight.altitude < 300000) return "lowSpace";
  return "highSpace";
}

// Science is only kept for good once you're safely on the ground
function canBankScience() {
  return flight.state === "ready" || (flight.state === "ended" && flight.result !== "crashed");
}

// Has this bit of science already been done (in this career, or on this flight)?
function scienceDone(key) {
  return (
    career.discovered.includes(key) ||
    career.experiments.includes(key) ||
    flight.onboard.some((item) => item.key === key)
  );
}

// Adds science: straight to your total if you're on the ground, otherwise it's
// carried on the rocket until you land safely
function recordScience(item) {
  if (!career || scienceDone(item.key)) return false;
  if (canBankScience()) bankScience([item]);
  else flight.onboard.push(item);
  return true;
}

function bankScience(items) {
  items.forEach((item) => {
    career.science += item.points;
    (item.kind === "biome" ? career.discovered : career.experiments).push(item.key);
  });
  saveCareer();
}

// Gives science for reaching a biome you've never been to
function checkBiome() {
  if (!career || flight.state === "ready") return;
  const biome = currentBiome();
  const info = BIOMES[biome];
  const points = Math.round(DISCOVERY_POINTS * info.multiplier);
  if (recordScience({ key: "biome:" + biome, kind: "biome", label: info.name, points })) {
    const keep = canBankScience() ? "" : " (land safely to keep it)";
    flashMessage(`📍 New biome: ${info.name}! +${points} 🔬${keep}`, 3000);
  }
}

// The orbit experiment: done once your lowest point is above the edge of space
function checkOrbit() {
  if (!flight.leftGround || !isOrbiting()) return;
  if (flight.body === MOON) {
    if (flight.inMoonOrbit) return;
    flight.inMoonOrbit = true;
    const got = recordScience({ key: "moonOrbit", kind: "experiment", label: "Moon Orbit", points: MOON_ORBIT_POINTS });
    flashMessage(`🌙 You're orbiting the Moon!${got ? ` +${MOON_ORBIT_POINTS} 🔬 (land safely to keep it)` : ""}`, 4000);
    return;
  }
  if (flight.inOrbit) return;
  flight.inOrbit = true;
  const gotScience = recordScience({ key: "orbit", kind: "experiment", label: "Orbit", points: ORBIT_POINTS });
  flashMessage(`🛰️ You're in orbit!${gotScience ? ` +${ORBIT_POINTS} 🔬 (land safely to keep it)` : ""}`, 4000);
}

// E: take readings with every science instrument on the rocket
function runExperiments() {
  if (flight.state === "ended" && flight.result === "crashed") {
    flashMessage("The instruments were destroyed in the crash");
    return;
  }
  const instruments = [];
  build.stack.forEach((entry, index) => {
    if (isAttached(index) && entry.part.type === "science" && !instruments.includes(entry.part)) {
      instruments.push(entry.part);
    }
  });
  if (!instruments.length) {
    flashMessage("No science instruments on board");
    return;
  }

  const biome = currentBiome();
  const info = BIOMES[biome];
  const lines = instruments.map((part) => {
    if (part.needs === "air" && (flight.body !== PLANET || flight.altitude >= SPACE_ALTITUDE)) return `${part.name}: no air to measure`;
    if (part.needs === "ground" && !isOnSurface()) return `${part.name}: only works when landed`;
    const points = Math.round(part.points * info.multiplier);
    const key = `${part.id}@${biome}`;
    if (!flight.readings.includes(key)) flight.readings.push(key); // for quests
    if (!career) return `${part.name}: reading taken (no science in Creative)`;
    if (!recordScience({ key, kind: "experiment", label: `${part.name} (${info.name})`, points })) {
      return `${part.name}: already measured here`;
    }
    return `${part.name}: +${points} 🔬`;
  });
  const keep = !career || canBankScience() ? "" : "\n(land safely to keep it)";
  flashMessage(`${info.name}\n${lines.join("\n")}${keep}`, 3500);
  if (flight.state !== "ready") checkQuest(); // e.g. a reading taken after landing
}

// ---------- Setting up a flight ----------

// Puts the rocket back on the pad with full tanks, and works out its stages.
//
// Decouplers split the rocket into sections (bottom section first). Each
// section's liquid engines only use the fuel tanks in that same section.
// The stages, in the order Space fires them, are:
//   ignite the bottom section's engines → decouple it → ignite the next
//   section's engines → decouple it → ... → deploy parachutes
function resetFlight() {
  cancelAnimationFrame(flightFrameId);
  setPaused(false);

  // Put every part back on the rocket
  launchRocket.classList.remove("exploded");
  launchRocket.querySelectorAll(".stack-item").forEach((row) => row.classList.remove("detached", "firing"));
  const oldCanopies = launchRocket.querySelector(".canopies");
  if (oldCanopies) oldCanopies.remove();
  launchScene.querySelectorAll(".debris, .astronaut").forEach((el) => el.remove());
  explosion.hidden = true;

  camera.towerWidth = launchRocket.offsetWidth;
  camera.towerHeight = launchRocket.offsetHeight;

  // Split the stack into sections at each decoupler
  const sections = [{ liquidFuel: 0, liquidFuelMax: 0 }];
  const sectionOf = []; // which section each stack row is in
  const decouplers = []; // stack row of each decoupler, bottom first
  build.stack.forEach((entry, index) => {
    sectionOf[index] = sections.length - 1; // a decoupler drops away with the section below it
    if (entry.part.type === "decoupler") {
      decouplers.push(index);
      sections.push({ liquidFuel: 0, liquidFuelMax: 0 });
    }
    [entry.part, entry.side].forEach((part) => {
      if (part && part.type === "tank") {
        sections[sectionOf[index]].liquidFuel += part.fuel;
        sections[sectionOf[index]].liquidFuelMax += part.fuel;
      }
    });
  });

  const engines = [];
  const chutes = [];
  build.stack.forEach((entry, index) => {
    const part = entry.part;
    if (part.type === "liquid" || part.type === "solid") {
      engines.push({
        part,
        index,
        section: sectionOf[index],
        fuel: part.solidFuel || 0, // solid engines carry their own fuel
        ignited: false,
        shutOff: false,
        burning: false,
      });
    }
    [entry.part, entry.side].forEach((p) => {
      if (p && p.type === "chute") chutes.push({ part: p, index, deployed: false, open: 0 });
    });
  });

  // Build the list of stages
  const stages = [];
  sections.forEach((section, s) => {
    const sectionEngines = engines.filter((e) => e.section === s);
    if (sectionEngines.length) {
      const names = [...new Set(sectionEngines.map((e) => e.part.name))].join(" + ");
      stages.push({ type: "ignite", section: s, label: "Ignite " + names });
    }
    if (s < decouplers.length) stages.push({ type: "decouple", index: decouplers[s], label: "Decouple" });
  });
  if (chutes.length) stages.push({ type: "chutes", label: "Deploy parachutes" });

  // The rocket's size in metres (1 pixel on the pad = 0.1 m)
  const width = launchRocket.offsetWidth / PIXELS_PER_METER;
  const height = launchRocket.offsetHeight / PIXELS_PER_METER;

  flight = {
    state: "ready", // ready → flying → ended
    time: 0, // seconds of game time since launch (the Moon moves with it)
    body: PLANET, // the planet or the Moon: whichever one's gravity is in charge
    visitedMoon: false,
    landedOn: null,
    wasOnMoon: false, // has landed on the Moon at some point this flight
    relaunched: false, // took off again after landing
    eva: null, // the astronaut, while they're outside the rocket
    inMoonOrbit: false,
    // Planet coordinates (metres from the planet's centre) and velocity (m/s)
    px: 0,
    py: PLANET_RADIUS + height / 2,
    vx: 0,
    vy: 0,
    heading: 0,
    // Local view, worked out from the above by updateLocal()
    x: 0, // metres along the ground from the pad (centre of the rocket)
    y: 0, // metres above the pad (centre of the rocket)
    angle: 0, // tilt from straight up, in radians: positive = leaning right
    climbSpeed: 0, // m/s, positive = up
    altitude: 0, // metres from the pad level to the lowest point of the rocket
    width,
    height,
    maxAltitude: 0,
    leftGround: false,
    reachedSpace: false,
    inOrbit: false,
    sections,
    sectionOf,
    engines,
    chutes,
    stages,
    nextStage: 0,
    cutIndex: 0, // stack rows below this have been decoupled and dropped
    debris: [], // dropped pieces still falling
    onboard: [], // science collected this flight, kept if you land safely
    readings: [], // instrument readings taken this flight (for quests)
    heat: 0, // % (100 = burns up)
    heatRate: 0, // % per second right now (for the glow and warnings)
    shieldFacing: false, // is a heat shield facing into the airflow right now?
    shields: build.stack
      .map((entry, index) => ({ part: entry.part, index, ablator: entry.part.ablator || 0 }))
      .filter((s) => s.part.type === "shield"),
    flash: null, // short message shown after pressing a key
    warnedNoPod: false,
    result: "",
    onSide: false,
    inWater: false,
  };
  updateLocal();

  updateLaunchView();
  renderFlightHud();
}

// Updates the local view (position along the ground, height, tilt) from planet coordinates
function updateLocal() {
  flight.body = referenceBody(flight.px, flight.py, flight.time);
  const local = localView(flight);
  const rel = relativeState(flight, flight.body);
  flight.x = local.x;
  flight.y = local.y;
  flight.angle = local.angle;
  flight.climbSpeed = rel.vx * local.up.x + rel.vy * local.up.y;
  flight.altitude = flight.y - halfExtent(flight.width, flight.height, flight.angle);
}

function isAttached(index) {
  return index >= flight.cutIndex;
}

// The lowest section still attached to the rocket
function firstAttachedSection() {
  return flight.cutIndex < build.stack.length ? flight.sectionOf[flight.cutIndex] : Infinity;
}

// A command pod (or probe core) is needed to steer
function canSteer() {
  return build.stack.some((entry, index) => isAttached(index) && entry.part.type === "pod");
}

// Current mass of everything still attached, in tonnes
function rocketMass() {
  let kg = 0;
  build.stack.forEach((entry, index) => {
    if (!isAttached(index)) return;
    [entry.part, entry.side].forEach((part) => {
      if (!part) return;
      kg += part.mass * 1000;
      // Take away the fuel already included in the part's mass (added back below)
      if (part.type === "tank") kg -= part.fuel * FUEL_UNIT_KG;
      if (part.type === "solid") kg -= part.solidFuel * FUEL_UNIT_KG;
    });
  });
  flight.sections.forEach((section, s) => {
    if (s >= firstAttachedSection()) kg += section.liquidFuel * FUEL_UNIT_KG;
  });
  flight.engines.forEach((engine) => {
    if (isAttached(engine.index)) kg += engine.fuel * FUEL_UNIT_KG;
  });
  return Math.max(kg, 1) / 1000;
}

function flashMessage(text, duration = 1800) {
  flight.flash = { text, until: performance.now() + duration };
  renderFlightHud();
  // Clear the message afterwards, even if nothing is moving
  setTimeout(() => flight && renderFlightHud(), duration + 100);
}

// ---------- Space bar: launch, engines, stages ----------
function pressSpace() {
  if (flight.state === "ended") {
    if (canTakeOff()) takeOffAgain();
    else resetFlight();
    return;
  }

  if (flight.state === "ready") {
    if (flight.stages.length === 0) {
      flashMessage("Nothing to launch: add an engine!");
      return;
    }
    flight.state = "flying";
    lastFrameTime = performance.now();
    flightFrameId = requestAnimationFrame(flightFrame);
    activateNextStage();
    checkBiome();
    return;
  }

  // Flying: while liquid engines still have fuel, Space switches them off and
  // back on again. The next stage only fires once their fuel is all gone.
  const live = flight.engines.filter((e) => e.ignited && isAttached(e.index));
  const liquidWithFuel = live.filter(
    (e) => e.part.type === "liquid" && flight.sections[e.section].liquidFuel > 0
  );
  if (liquidWithFuel.length) {
    const anyRunning = liquidWithFuel.some((e) => !e.shutOff);
    liquidWithFuel.forEach((e) => (e.shutOff = anyRunning));
    flashMessage(anyRunning ? "Liquid engines shut off" : "Liquid engines back on");
    return;
  }

  // Solid engines can't be shut off, so wait for them to burn out
  if (live.some((e) => e.part.type === "solid" && e.fuel > 0)) {
    flashMessage("Wait: solid fuel is still burning");
    return;
  }

  if (flight.nextStage >= flight.stages.length) {
    flashMessage("No more stages");
    return;
  }
  activateNextStage();
}

// After a safe landing, the rocket can fly again if it's upright, everyone is
// on board, and it still has an engine with fuel
function canTakeOff() {
  const f = flight;
  if (f.state !== "ended" || f.eva || f.onSide) return false;
  if (f.result !== "landed" && f.result !== "hardLanding") return false;
  return f.engines.some((e) => {
    if (!isAttached(e.index)) return false;
    if (e.part.type === "solid") return !e.ignited && e.fuel > 0;
    return f.sections[e.section].liquidFuel > 0;
  });
}

function takeOffAgain() {
  flight.state = "flying";
  flight.result = "";
  flight.leftGround = false; // the ground holds it up until the engines lift it
  flight.relaunched = true;
  flight.recovered = 0;
  flight.lostScience = 0;
  lastFrameTime = performance.now();
  flightFrameId = requestAnimationFrame(flightFrame);
  pressSpace(); // turns the engines back on (or fires the next stage)
}

function activateNextStage() {
  const stage = flight.stages[flight.nextStage];
  flight.nextStage++;

  if (stage.type === "ignite") {
    flight.engines.filter((e) => e.section === stage.section).forEach((e) => (e.ignited = true));
  } else if (stage.type === "decouple") {
    decoupleAt(stage.index);
  } else {
    deployChutes();
  }
}

// Drops every part from the bottom of the rocket up to (and including) this decoupler
function decoupleAt(decouplerIndex) {
  if (!isAttached(decouplerIndex)) return;

  const rows = [...launchRocket.querySelectorAll(".stack-item")].filter((row) => {
    const index = Number(row.dataset.index);
    return isAttached(index) && index <= decouplerIndex;
  });
  const droppedHeight = rows.reduce((sum, row) => sum + row.offsetHeight, 0) / PIXELS_PER_METER;
  const droppedWidth = Math.max(...rows.map((row) => row.offsetWidth)) / PIXELS_PER_METER;

  // The dropped parts become a separate falling piece
  const piece = document.createElement("div");
  piece.className = "launch-rocket debris";
  rows.forEach((row) => {
    const copy = row.cloneNode(true);
    copy.classList.remove("firing");
    piece.appendChild(copy);
    row.classList.add("detached");
  });
  launchScene.insertBefore(piece, launchRocket);
  flight.cutIndex = decouplerIndex + 1;

  // Work out where both pieces are, along the rocket's axis (in planet coordinates)
  const axis = { x: Math.sin(flight.heading), y: Math.cos(flight.heading) };
  const bottom = { x: flight.px - axis.x * (flight.height / 2), y: flight.py - axis.y * (flight.height / 2) };
  const newHeight = launchRocket.offsetHeight / PIXELS_PER_METER;

  flight.debris.push({
    el: piece,
    px: bottom.x + axis.x * (droppedHeight / 2),
    py: bottom.y + axis.y * (droppedHeight / 2),
    vx: flight.vx - axis.x * 3, // pushed gently away
    vy: flight.vy - axis.y * 3,
    heading: flight.heading,
    width: droppedWidth,
    height: droppedHeight,
  });

  // In the air, the rest of the rocket stays exactly where it was.
  // On the pad, the top part just sits down where the bottom was.
  const shift = flight.leftGround ? droppedHeight + newHeight / 2 : newHeight / 2;
  flight.px = bottom.x + axis.x * shift;
  flight.py = bottom.y + axis.y * shift;
  flight.height = newHeight;
  flight.width = launchRocket.offsetWidth / PIXELS_PER_METER;
  updateLocal();
}

function deployChutes() {
  const attachedChutes = flight.chutes.filter((c) => isAttached(c.index));
  attachedChutes.forEach((c) => (c.deployed = true));
  if (!attachedChutes.length) return;

  const canopies = document.createElement("div");
  canopies.className = "canopies";
  canopies.innerHTML = canopySVG(attachedChutes);
  launchRocket.appendChild(canopies);
}

// Draws open parachutes with their lines running down to the top of the rocket
function canopySVG(chutes) {
  const width = 260;
  const height = 170;
  const middle = width / 2;

  const canopy = (x, y, r) => `
    <line x1="${x - r}" y1="${y}" x2="${middle - 3}" y2="${height}" stroke="#cfd8dc" stroke-width="1" />
    <line x1="${x}" y1="${y}" x2="${middle}" y2="${height}" stroke="#cfd8dc" stroke-width="1" />
    <line x1="${x + r}" y1="${y}" x2="${middle + 3}" y2="${height}" stroke="#cfd8dc" stroke-width="1" />
    <path d="M${x - r} ${y} Q${x - r} ${y - r} ${x} ${y - r} Q${x + r} ${y - r} ${x + r} ${y} Q${x} ${y - r * 0.25} ${x - r} ${y} Z" fill="#ff8c32" />
    <path d="M${x - r * 0.3} ${y - r * 0.12} Q${x - r * 0.3} ${y - r * 0.98} ${x} ${y - r} Q${x + r * 0.3} ${y - r * 0.98} ${x + r * 0.3} ${y - r * 0.12} Q${x} ${y - r * 0.22} ${x - r * 0.3} ${y - r * 0.12} Z" fill="#ffffff" opacity="0.85" />`;

  let shapes = "";
  chutes.forEach((chute) => {
    const big = chute.part.dragArea > 800;
    if (chute.part.mount === "side") {
      shapes += canopy(middle - (big ? 82 : 72), 70, big ? 38 : 30);
      shapes += canopy(middle + (big ? 82 : 72), 70, big ? 38 : 30);
    } else {
      shapes += canopy(middle, 62, big ? 58 : 46);
    }
  });
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true">${shapes}</svg>`;
}

// ---------- Each frame ----------
function flightFrame(now) {
  // Paused: nothing moves, just keep checking until it's unpaused
  if (paused) {
    lastFrameTime = now;
    flightFrameId = requestAnimationFrame(flightFrame);
    return;
  }
  // Real time since the last frame (steering uses this, so it isn't sped up)
  const realDt = Math.min(0.05, (now - lastFrameTime) / 1000);
  lastFrameTime = now;
  // With speed-up on, more game time passes each frame
  const dt = realDt * effectiveWarp();

  // A / D steering
  const turn = (steering.right ? 1 : 0) - (steering.left ? 1 : 0);
  if (turn && flight.state === "flying") {
    if (!canSteer()) {
      if (!flight.warnedNoPod) flashMessage("No command pod: you can't steer!");
      flight.warnedNoPod = true;
    } else if (flight.leftGround) {
      flight.heading += turn * STEER_RATE * realDt;
    }
  }

  // P / R: turn to face prograde (the way you're moving) or retrograde (backwards)
  const holdDirection = steering.prograde || steering.retrograde;
  if (holdDirection && !turn && flight.state === "flying" && flight.leftGround && canSteer()) {
    const rel = relativeState(flight, flight.body);
    if (Math.hypot(rel.vx, rel.vy) > 0.5) {
      const target = Math.atan2(rel.vx, rel.vy) + (steering.retrograde ? Math.PI : 0);
      const diff = normalizeAngle(target - flight.heading);
      const most = STEER_RATE * realDt;
      flight.heading += Math.max(-most, Math.min(most, diff));
    }
  }

  // Many small steps per frame keep the physics accurate. Steps are tiny near the
  // ground or with engines on, and much bigger when coasting far out in space.
  let remaining = dt;
  for (let i = 0; i < 3000 && remaining > 1e-9 && flight.state === "flying"; i++) {
    const step = Math.min(remaining, maxPhysicsStep());
    stepFlight(step);
    remaining -= step;
  }
  updateLocal();

  // Arriving at (or leaving) the Moon
  if (flight.state === "flying" && flight.body !== flight.lastBody) {
    if (flight.body === MOON) {
      flight.visitedMoon = true;
      if (timeWarp > SAFE_WARP) setTimeWarp(SAFE_WARP);
      flashMessage("🌙 Entered the Moon's gravity!", 4000);
    } else if (flight.lastBody === MOON) {
      flashMessage("Left the Moon's gravity", 3000);
    }
  }
  flight.lastBody = flight.body;

  if (flight.state === "flying") {
    checkBiome();
    checkOrbit();
    checkQuest();
  }

  // Dropped pieces just fall, and disappear when they hit the ground
  // (far away ones are forgotten about)
  const debrisSteps = Math.min(200, Math.ceil(dt / 0.05));
  flight.debris = flight.debris.filter((piece) => {
    for (let i = 0; i < debrisSteps; i++) {
      const pull = gravityPull(piece.px, piece.py);
      piece.vx += (pull.x * dt) / debrisSteps;
      piece.vy += (pull.y * dt) / debrisSteps;
      piece.px += (piece.vx * dt) / debrisSteps;
      piece.py += (piece.vy * dt) / debrisSteps;
    }
    const local = localView(piece);
    const farAway = Math.hypot(piece.px - flight.px, piece.py - flight.py) > 20000;
    if (farAway || deepestPoint(local.x, local.y, piece.width, piece.height, local.angle) > 0) {
      piece.el.remove();
      return false;
    }
    return true;
  });

  updateLaunchView();
  renderFlightHud();
  if (flight.state === "flying" || flight.debris.length) {
    flightFrameId = requestAnimationFrame(flightFrame);
  }
}

function stepFlight(dt) {
  flight.time += dt;
  let thrust = 0;
  flight.engines.forEach((e) => (e.burning = false));

  // Liquid engines: each one takes its own burn rate of fuel from the tanks
  // in its section. If there isn't enough left, they share what remains.
  flight.sections.forEach((section, s) => {
    const running = flight.engines.filter(
      (e) => e.section === s && e.part.type === "liquid" && e.ignited && !e.shutOff && isAttached(e.index)
    );
    const wanted = running.reduce((sum, e) => sum + burnRate(e.part) * dt, 0);
    const share = wanted > 0 ? Math.min(1, section.liquidFuel / wanted) : 0;
    section.liquidFuel = Math.max(0, section.liquidFuel - wanted * share);
    running.forEach((engine) => {
      engine.burning = share > 0;
      thrust += engine.part.thrust * share;
    });
  });

  // Solid engines: each burns its own built-in fuel until it runs out
  flight.engines
    .filter((e) => e.part.type === "solid" && e.ignited && isAttached(e.index))
    .forEach((engine) => {
      const wanted = burnRate(engine.part) * dt;
      const used = Math.min(engine.fuel, wanted);
      engine.fuel -= used;
      engine.burning = used > 0;
      thrust += engine.part.thrust * (used / wanted);
    });

  // Newton: acceleration = force ÷ mass (kN ÷ t = m/s²), pushing the way the
  // rocket points. Gravity pulls toward the centre of the planet.
  const mass = rocketMass();
  const pull = gravityPull(flight.px, flight.py);
  let ax = (thrust / mass) * Math.sin(flight.heading) + pull.x;
  let ay = (thrust / mass) * Math.cos(flight.heading) + pull.y;

  // Air resistance: the rocket body, plus parachutes (they open over 2 seconds),
  // plus a heat shield if it's facing into the air. Thicker (lower) air = more drag.
  // (all measured against the planet's air; the Moon has none)
  const speed = Math.hypot(flight.vx, flight.vy);
  const airDensity = flight.body === PLANET ? 1.225 * Math.exp(-Math.max(0, flight.altitude) / 8500) : 0;
  let dragArea = BODY_DRAG_AREA;
  let chuteArea = 0;
  flight.chutes.forEach((chute) => {
    if (!chute.deployed || !isAttached(chute.index)) return;
    chute.open = Math.min(1, chute.open + dt / 2);
    chuteArea += chute.part.dragArea * chute.open;
  });
  dragArea += chuteArea;

  // A heat shield only works if it's the bottom part of the rocket and the
  // rocket is falling bottom-first (so the shield meets the air first)
  const shield = activeShield();
  const axis = { x: Math.sin(flight.heading), y: Math.cos(flight.heading) };
  const bottomFirst = speed > 1 && (flight.vx * axis.x + flight.vy * axis.y) / speed < -0.7;
  flight.shieldFacing = Boolean(shield && bottomFirst);
  if (flight.shieldFacing) dragArea += shield.part.dragArea;

  // Reentry heating
  let heatIn = HEATING * Math.sqrt(airDensity) * speed ** 3 * dt;
  if (flight.shieldFacing && shield.ablator > 0) {
    const absorbed = Math.min(shield.ablator, heatIn * SHIELD_BLOCKS);
    shield.ablator -= absorbed;
    heatIn -= absorbed;
  }
  flight.heat = Math.max(0, flight.heat + heatIn - flight.heat * COOLING * dt);
  flight.heatRate = heatIn / dt;
  if (flight.heat >= 100) {
    burnUp();
    return;
  }

  if (speed > 0) {
    const dragForce = 0.5 * airDensity * speed ** 2 * dragArea; // newtons
    // Drag can slow the rocket to a stop but never push it backwards
    const dragAcceleration = Math.min(dragForce / (mass * 1000), speed / dt);
    ax -= (flight.vx / speed) * dragAcceleration;
    ay -= (flight.vy / speed) * dragAcceleration;

    // Hanging under a parachute (or a blunt heat shield) slowly turns the rocket
    // bottom-first into the air (unless you're steering)
    const steadying = chuteArea > 0 || flight.shieldFacing;
    if (steadying && airDensity > 0.01 && !steering.left && !steering.right) {
      flight.heading -= flight.angle * Math.min(1, 0.8 * dt * Math.min(1, speed / 5 + 0.3));
    }
  }

  flight.vx += ax * dt;
  flight.vy += ay * dt;
  flight.px += flight.vx * dt;
  flight.py += flight.vy * dt;
  updateLocal();

  // How far the lowest corner is above the ground (negative = touching/sunk in).
  // High up there's no ground anywhere near, so skip the slow check.
  const sunk =
    flight.altitude > 5000 ? -flight.altitude : deepestPoint(flight.x, flight.y, flight.width, flight.height, flight.angle);

  if (sunk < -0.5) flight.leftGround = true;
  flight.maxAltitude = Math.max(flight.maxAltitude, flight.altitude);

  if (!flight.reachedSpace && flight.altitude >= SPACE_ALTITUDE) {
    flight.reachedSpace = true;
    flashMessage("🌌 You reached space!", 4000);
  }

  // Touching the ground
  if (sunk > 0) {
    if (!flight.leftGround) {
      // Sitting on the pad: the pad holds it up (it can only move upward)
      const up = localView(flight).up;
      const rel = relativeState(flight, flight.body);
      const ground = bodyState(flight.body, flight.time);
      const upSpeed = Math.max(0, rel.vx * up.x + rel.vy * up.y);
      flight.px += up.x * sunk;
      flight.py += up.y * sunk;
      flight.vx = ground.vx + up.x * upSpeed;
      flight.vy = ground.vy + up.y * upSpeed;
      updateLocal();
    } else {
      touchDown();
      return;
    }
  }

  // Still on the pad with nothing burning and no stages left
  const anyBurning = flight.engines.some((e) => e.burning);
  if (flight.relaunched && !flight.leftGround && !anyBurning) {
    touchDown(); // sitting on the ground again after taking off: it's landed
    return;
  }
  if (!flight.leftGround && !anyBurning && flight.nextStage >= flight.stages.length) {
    endFlight("stuck", 0);
  }
}

// The heat shield that's currently the bottom part of the rocket (if any)
function activeShield() {
  return flight.shields.find((s) => s.index === flight.cutIndex && isAttached(s.index)) || null;
}

function burnUp() {
  if (flight.onboard.length) flight.lostScience = flight.onboard.reduce((s, item) => s + item.points, 0);
  endFlight("burnedUp", Math.hypot(flight.vx, flight.vy));
}

// The rocket hit the ground (or the sea). Slow enough = landed, in any position.
function touchDown() {
  // Speed compared with the ground you hit (the Moon is moving!)
  const rel = relativeState(flight, flight.body);
  const impactSpeed = Math.hypot(rel.vx, rel.vy);
  const ground = bodyState(flight.body, flight.time);
  flight.vx = ground.vx;
  flight.vy = ground.vy;
  flight.inWater = flight.body === PLANET && surfaceAt(flight.x * PIXELS_PER_METER).water;
  flight.landedOn = flight.body.id;

  if (impactSpeed > SAFE_LANDING_SPEED) {
    if (flight.onboard.length) flight.lostScience = flight.onboard.reduce((s, item) => s + item.points, 0);
    endFlight("crashed", impactSpeed);
    return;
  }

  // Settle into a resting position: upright if it was nearly upright,
  // otherwise it tips over and lies on its side
  const local = localView(flight);
  const degrees = (local.angle * 180) / Math.PI;
  let tilt = 0;
  if (Math.abs(degrees) > 35) {
    tilt = (Math.sign(degrees) * Math.PI) / 2;
    flight.onSide = true;
  }
  flight.heading = local.theta + tilt;
  updateLocal();
  // Rest the lowest corner exactly on the ground
  const lift = deepestPoint(flight.x, flight.y, flight.width, flight.height, flight.angle);
  flight.px += local.up.x * lift;
  flight.py += local.up.y * lift;
  updateLocal();

  endFlight(impactSpeed <= SOFT_LANDING_SPEED ? "landed" : "hardLanding", impactSpeed);
  if (flight.body === MOON) flight.wasOnMoon = true;
  // Switch off the liquid engines, ready to take off again later
  flight.engines.forEach((e) => {
    if (e.part.type === "liquid" && e.ignited) e.shutOff = true;
  });

  // Landed safely: keep all the science collected on this flight
  if (career && flight.onboard.length) {
    flight.recovered = flight.onboard.reduce((s, item) => s + item.points, 0);
    bankScience(flight.onboard);
    flight.onboard = [];
  }
  checkBiome(); // landing somewhere new counts too
  checkQuest();
}

function endFlight(result, impactSpeed) {
  flight.state = "ended";
  flight.result = result;
  flight.impactSpeed = impactSpeed;
  flight.engines.forEach((e) => (e.burning = false));

  flight.heatRate = 0;
  if (result === "crashed" || result === "burnedUp") {
    launchRocket.classList.add("exploded");
    const point = toScreen(flight.x, flight.y);
    explosion.style.left = point.x + "px";
    explosion.style.top = point.y + "px";
    explosion.hidden = false;
  }
}

// ---------- Getting out of the rocket (EVA) ----------
// After a safe landing, F lets one of the crew climb out and walk around.
// A / D walk, Space jumps (very high on the Moon!), E writes an EVA report for
// science, and F near the rocket climbs back in. Time stands still while you walk.
const EVA_HEIGHT = 2.2; // metres
const EVA_POINTS = 6; // × biome multiplier

function hasCrew() {
  return build.stack.some((entry, index) => isAttached(index) && entry.part.type === "pod" && entry.part.crew > 0);
}

function canExit() {
  return flight.state === "ended" && !flight.eva && (flight.result === "landed" || flight.result === "hardLanding") && hasCrew();
}

function nearRocket() {
  const reach = (flight.onSide ? flight.height : flight.width) / 2 + 3;
  return Math.abs(flight.eva.x - flight.x) < reach;
}

function toggleEva() {
  if (flight.eva) {
    if (!nearRocket()) {
      flashMessage("Walk back to the rocket to get in");
      return;
    }
    flight.eva.el.remove();
    flight.eva = null;
    cancelAnimationFrame(flightFrameId);
    updateLaunchView();
    flashMessage("Back in the rocket");
    return;
  }
  if (!canExit()) {
    if (flight.state === "flying") flashMessage("Land first, then press F to get out");
    else if (flight.state === "ended" && !hasCrew()) flashMessage("Nobody on board to get out!");
    return;
  }

  // Climb down next to the rocket
  const el = document.createElement("div");
  el.className = "astronaut";
  el.innerHTML = astronautSVG();
  launchScene.insertBefore(el, flightHud);
  const x = flight.x + (flight.onSide ? flight.height : flight.width) / 2 + 1.5;
  flight.eva = { el, x, y: groundHeightAt(x), vy: 0, facing: 1, onGround: true };
  steering.left = steering.right = steering.jump = false;
  lastFrameTime = performance.now();
  flightFrameId = requestAnimationFrame(evaFrame);
  flashMessage(flight.body === MOON ? "🧑‍🚀 One small step… You're walking on the Moon!" : "🧑‍🚀 You stepped outside!", 3000);
}

function evaFrame(now) {
  const eva = flight && flight.eva;
  if (!eva) return;
  if (paused) {
    lastFrameTime = now;
    flightFrameId = requestAnimationFrame(evaFrame);
    return;
  }
  const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
  lastFrameTime = now;

  const onMoon = flight.body === MOON;
  const gravity = flight.body.gm / flight.body.radius ** 2;
  const inWater = !onMoon && surfaceAt(eva.x * PIXELS_PER_METER).water;
  const walk = (steering.right ? 1 : 0) - (steering.left ? 1 : 0);
  const speed = inWater ? 1 : onMoon ? 2 : 2.5; // metres per second
  if (walk) eva.facing = walk;
  eva.x += walk * speed * dt;

  // Jumping and falling
  if (steering.jump && eva.onGround) {
    eva.vy = onMoon ? 3 : 3.5; // the same jump goes about 5x higher on the Moon
    eva.onGround = false;
  }
  eva.vy -= gravity * dt;
  eva.y += eva.vy * dt;
  const ground = groundHeightAt(eva.x);
  if (eva.y <= ground) {
    eva.y = ground;
    eva.vy = 0;
    eva.onGround = true;
  }

  eva.el.classList.toggle("walking", Boolean(walk) && eva.onGround);
  eva.el.classList.toggle("swimming", inWater);
  updateLaunchView();
  renderFlightHud();
  flightFrameId = requestAnimationFrame(evaFrame);
}

function placeAstronaut() {
  const eva = flight.eva;
  const point = toScreen(eva.x, eva.y + EVA_HEIGHT / 2);
  eva.el.style.left = point.x + "px";
  eva.el.style.top = point.y + "px";
  eva.el.style.transform = `translate(-50%, -50%) scale(${camera.zoom * eva.facing}, ${camera.zoom})`;
}

// E while walking: write a report about where you are
function evaReport() {
  const biome = currentBiome();
  const info = BIOMES[biome];
  const key = `eva@${biome}`;
  if (!flight.readings.includes(key)) flight.readings.push(key); // for quests
  let text = `📝 EVA report: ${info.name}`;
  if (career) {
    const points = Math.round(EVA_POINTS * info.multiplier);
    text += recordScience({ key, kind: "experiment", label: `EVA (${info.name})`, points })
      ? ` +${points} 🔬`
      : " (already reported from here)";
  }
  flashMessage(text, 3000);
  checkQuest();
}

// A little astronaut: white suit, gold visor, orange stripes
function astronautSVG() {
  return `
    <svg viewBox="0 0 22 32" width="15" height="22" aria-hidden="true">
      <rect x="3" y="11" width="5" height="10" rx="1.5" fill="#cfd6e0"/>
      <g class="astronaut-leg back"><rect x="8.5" y="20" width="4" height="10" rx="1.6" fill="#d8dee8"/></g>
      <rect x="6" y="11" width="11" height="11" rx="3" fill="#f2f5fa"/>
      <rect x="6" y="16" width="11" height="2" fill="#ff8c32"/>
      <g class="astronaut-leg front"><rect x="10.5" y="20" width="4" height="10" rx="1.6" fill="#f2f5fa"/></g>
      <rect x="14" y="13" width="3.5" height="7" rx="1.6" fill="#e4e9f1"/>
      <circle cx="12" cy="6.5" r="6" fill="#f2f5fa"/>
      <path d="M12.5 3.2 h3.6 a2.6 2.6 0 0 1 2.6 2.6 v1.6 a2.6 2.6 0 0 1 -2.6 2.6 h-3.6 z" fill="#e0a526"/>
      <path d="M13.5 4.2 h2.2" stroke="#fff6cf" stroke-width="0.9" stroke-linecap="round"/>
    </svg>`;
}

// ---------- Map view (M) ----------
// Shows the whole planet from far away, with the path the rocket is coasting along
function toggleMap() {
  mapOpen = !mapOpen;
  mapCanvas.hidden = !mapOpen;
  mapButton.classList.toggle("active", mapOpen);
  mapButton.blur();
  if (mapOpen) drawMap();
}

mapButton.addEventListener("click", toggleMap);

function drawMap() {
  const width = camera.width;
  const height = camera.height;
  const dpr = window.devicePixelRatio || 1;
  if (mapCanvas.width !== Math.round(width * dpr) || mapCanvas.height !== Math.round(height * dpr)) {
    mapCanvas.width = Math.round(width * dpr);
    mapCanvas.height = Math.round(height * dpr);
  }
  const ctx = mapCanvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#05070d";
  ctx.fillRect(0, 0, width, height);

  // The map is centred on whichever body you're near (the planet or the Moon)
  const body = flight.body;
  const onMoon = body === MOON;
  const orbit = currentOrbit();
  const rel = relativeState(flight, body);
  const rocketRadius = Math.hypot(rel.px, rel.py);
  const moon = bodyState(MOON, flight.time);

  // Zoom out far enough to see the body, the rocket and (most of) its path.
  // Around the planet, a path heading out toward the Moon zooms right out to show it.
  const apoRadius = orbit.escaping ? rocketRadius * 2 : orbit.apoapsis + body.radius;
  let viewRadius = Math.max(body.radius * 1.35, Math.min(apoRadius, body.radius * (onMoon ? 10 : 6)) * 1.1, rocketRadius * 1.1);
  if (!onMoon && (apoRadius > 2100000 || rocketRadius > 2100000)) viewRadius = MOON.orbitRadius + MOON.soi;
  const scale = (Math.min(width, height) * 0.45) / viewRadius;
  const cx = width / 2;
  const cy = height / 2;
  const toMap = (x, y) => ({ x: cx + x * scale, y: cy - y * scale });

  if (onMoon) {
    // The edge of the Moon's gravity
    ctx.strokeStyle = "rgba(200, 200, 210, 0.25)";
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(cx, cy, MOON.soi * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    // The edge of space (100 km up)
    ctx.strokeStyle = "rgba(79, 195, 247, 0.25)";
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(cx, cy, (PLANET_RADIUS + SPACE_ALTITUDE) * scale, 0, Math.PI * 2);
    ctx.stroke();

    // The Moon's path around the planet, the Moon, and the edge of its gravity
    ctx.strokeStyle = "rgba(200, 200, 210, 0.18)";
    ctx.beginPath();
    ctx.arc(cx, cy, MOON.orbitRadius * scale, 0, Math.PI * 2);
    ctx.stroke();
    const moonPoint = toMap(moon.x, moon.y);
    ctx.strokeStyle = "rgba(200, 200, 210, 0.35)";
    ctx.beginPath();
    ctx.arc(moonPoint.x, moonPoint.y, MOON.soi * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#b8b8c0";
    ctx.beginPath();
    ctx.arc(moonPoint.x, moonPoint.y, Math.max(4, MOON.radius * scale), 0, Math.PI * 2);
    ctx.fill();
    if (moonPoint.x > -50 && moonPoint.x < width + 50 && moonPoint.y > -50 && moonPoint.y < height + 50) {
      ctx.fillStyle = "#dddde5";
      ctx.font = "12px 'Exo 2', Arial, sans-serif";
      ctx.fillText("🌙 Moon", moonPoint.x + 8, moonPoint.y + 4);
    }
  }

  // The rocket's path: an ellipse (or an escape curve) around the body's centre
  if (flight.leftGround || flight.state === "flying") {
    ctx.strokeStyle = isOrbiting() ? "#7ee787" : "#ffb347";
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= 360; i++) {
      const nu = (i / 360) * Math.PI * 2 - Math.PI;
      const denom = 1 + orbit.e * Math.cos(nu);
      if (denom <= 0.02) {
        started = false;
        continue;
      }
      const r = orbit.semiLatus / denom;
      if (r > viewRadius * 3) {
        started = false;
        continue;
      }
      const angle = orbit.argument + nu;
      const point = toMap(r * Math.cos(angle), r * Math.sin(angle));
      if (started) ctx.lineTo(point.x, point.y);
      else ctx.moveTo(point.x, point.y);
      started = true;
    }
    ctx.stroke();
  }

  // The body itself (drawn over the path, so the part underground is hidden)
  const bodyRadius = Math.max(3, body.radius * scale);
  const globe = ctx.createRadialGradient(cx - bodyRadius * 0.3, cy - bodyRadius * 0.3, 0, cx, cy, bodyRadius);
  globe.addColorStop(0, onMoon ? "#9a9aa2" : "#2d6a8f");
  globe.addColorStop(1, onMoon ? "#3d3d44" : "#0f2a40");
  ctx.fillStyle = globe;
  ctx.beginPath();
  ctx.arc(cx, cy, bodyRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = onMoon ? "rgba(220, 220, 230, 0.7)" : "rgba(150, 210, 255, 0.7)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (!onMoon) {
    // The continent around the launch site (from the western coast to the eastern one)
    ctx.strokeStyle = "#3f7a35";
    ctx.lineWidth = 4;
    ctx.beginPath();
    const landStart = -950 / PLANET_RADIUS; // metres along the ground → angle around the planet
    const landEnd = 280 / PLANET_RADIUS;
    ctx.arc(cx, cy, Math.max(1, PLANET_RADIUS * scale - 2), -Math.PI / 2 + landStart, -Math.PI / 2 + landEnd);
    ctx.stroke();
    const pad = toMap(0, PLANET_RADIUS);
    ctx.fillStyle = "#ff8c32";
    ctx.fillRect(pad.x - 2, pad.y - 2, 4, 4);
  }

  // Highest and lowest points of the path
  const label = (text, x, y) => {
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px 'Exo 2', Arial, sans-serif";
    ctx.fillText(text, x + 6, y - 6);
  };
  if (flight.leftGround) {
    const pe = orbit.periapsis + body.radius;
    const pePoint = toMap(pe * Math.cos(orbit.argument), pe * Math.sin(orbit.argument));
    ctx.fillStyle = "#4fc3f7";
    ctx.beginPath();
    ctx.arc(pePoint.x, pePoint.y, 4, 0, Math.PI * 2);
    ctx.fill();
    label(`Pe ${formatDistance(orbit.periapsis)}${orbit.periapsis < 0 ? " (underground)" : ""}`, pePoint.x, pePoint.y);

    if (!orbit.escaping) {
      const ap = orbit.apoapsis + body.radius;
      const apPoint = toMap(-ap * Math.cos(orbit.argument), -ap * Math.sin(orbit.argument));
      ctx.fillStyle = "#f7c948";
      ctx.beginPath();
      ctx.arc(apPoint.x, apPoint.y, 4, 0, Math.PI * 2);
      ctx.fill();
      label(`Ap ${formatDistance(orbit.apoapsis)}`, apPoint.x, apPoint.y);
    }
  }

  // The rocket: an arrow pointing the way it's facing
  const rocket = toMap(rel.px, rel.py);
  ctx.save();
  ctx.translate(rocket.x, rocket.y);
  ctx.rotate(flight.heading);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(6, 7);
  ctx.lineTo(0, 3);
  ctx.lineTo(-6, 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ---------- Readout panel and messages ----------
function fuelBar(amount, max) {
  const percent = max > 0 ? (amount / max) * 100 : 0;
  return `<div class="fuel-bar"><div style="width:${percent}%"></div></div>`;
}

function regionName(f) {
  if (f.body === MOON) return "Near the Moon";
  if (f.altitude >= SPACE_ALTITUDE) return "Space";
  if (f.altitude >= 12000) return "Upper Air";
  return "Lower Air";
}

// 1234 → "1,234 m", 56789 → "56.8 km"
function formatDistance(metres) {
  if (!isFinite(metres)) return "escape!";
  const abs = Math.abs(metres);
  const sign = metres < 0 ? "-" : "";
  return abs >= 10000 ? `${sign}${(abs / 1000).toFixed(1)} km` : `${sign}${Math.round(abs).toLocaleString()} m`;
}

function renderFlightHud() {
  const f = flight;
  const rel = relativeState(f, f.body);
  const speed = Math.hypot(rel.vx, rel.vy); // compared with the planet or Moon below
  const tilt = Math.round((f.angle * 180) / Math.PI);
  const sideways = f.x >= 0 ? "▶" : "◀";
  const quest = activeQuest();
  let html = quest ? `<div class="hud-quest">📜 ${quest.title}: ${quest.goal}</div>` : "";
  html += `
    <div class="hud-row"><span>Altitude</span><strong>${formatDistance(Math.max(0, f.altitude))}</strong></div>
    <div class="hud-row"><span>Speed</span><strong>${speed.toFixed(0)} m/s</strong></div>
    <div class="hud-row"><span>Climb</span><strong>${f.climbSpeed >= 0 ? "▲" : "▼"} ${Math.abs(f.climbSpeed).toFixed(0)} m/s</strong></div>
    <div class="hud-row"><span>Distance</span><strong>${sideways} ${formatDistance(Math.abs(f.x))}</strong></div>
    <div class="hud-row"><span>Tilt</span><strong>${tilt === 0 ? "0°" : `${Math.abs(tilt)}° ${tilt > 0 ? "right" : "left"}`}</strong></div>
    <div class="hud-row"><span>Max Alt</span><strong>${formatDistance(f.maxAltitude)}</strong></div>
    <div class="hud-row"><span>Region</span><strong class="${f.altitude >= SPACE_ALTITUDE || f.body === MOON ? "in-space" : ""}">${regionName(f)}</strong></div>
    <div class="hud-row"><span>Biome</span><strong>${BIOMES[currentBiome()].name}</strong></div>`;

  // Highest and lowest points of the current path (once off the ground)
  // (around the Moon once you're in its gravity)
  if (f.leftGround && f.state === "flying") {
    const orbit = currentOrbit(f);
    const around = f.body === MOON ? " (Moon)" : "";
    html += `
      <div class="hud-row"><span>Apoapsis${around}</span><strong>${formatDistance(orbit.apoapsis)}</strong></div>
      <div class="hud-row"><span>Periapsis${around}</span><strong>${formatDistance(orbit.periapsis)}</strong></div>`;
    if (isOrbiting(f)) {
      html += `<div class="hud-row"><span>Status</span><strong class="in-space">${f.body === MOON ? "Orbiting the Moon 🌙" : "In orbit 🛰️"}</strong></div>`;
    }
  }
  // Where the Moon is: for timing the trip there
  if (f.leftGround && f.body === PLANET && f.altitude >= SPACE_ALTITUDE) {
    html += `<div class="hud-row"><span>Moon</span><strong>🌙 ${moonAheadDegrees()}° ahead</strong></div>`;
  }

  // Heat, and the heat shield (if one is at the bottom)
  if (f.heat >= 1 || f.heatRate > 0.2) {
    const level = f.heat > 70 ? "danger" : f.heat > 40 ? "warm" : "";
    html += `
      <div class="hud-title">Heat ${Math.round(f.heat)}%</div>
      <div class="fuel-bar heat-bar ${level}"><div style="width:${Math.min(100, f.heat)}%"></div></div>`;
  }
  const shieldNow = activeShield();
  if (shieldNow && f.leftGround) {
    html += `
      <div class="hud-title">Heat Shield ${Math.round((shieldNow.ablator / shieldNow.part.ablator) * 100)}%${f.shieldFacing ? " (facing the air)" : ""}</div>
      ${fuelBar(shieldNow.ablator, shieldNow.part.ablator)}`;
  }

  if (career) {
    const onboard = f.onboard.reduce((s, item) => s + item.points, 0);
    html += `<div class="hud-row"><span>Science</span><strong class="science-display">🔬 ${Math.floor(career.science)}${onboard ? ` (+${onboard} on board)` : ""}</strong></div>`;
  }

  // Stage list: done stages are dimmed, the next one is highlighted
  if (f.stages.length) {
    html += `<div class="hud-title">Stages</div>`;
    f.stages.forEach((stage, i) => {
      const status = i < f.nextStage ? "done" : i === f.nextStage ? "next" : "";
      html += `<div class="hud-stage ${status}">${i === f.nextStage ? "▶" : i + 1 + "."} ${stage.label}</div>`;
    });
  }

  // Fuel tanks for each section still attached
  f.sections.forEach((section, s) => {
    if (section.liquidFuelMax === 0 || s < firstAttachedSection()) return;
    const stageNumber = f.stages.findIndex((st) => st.type === "ignite" && st.section === s) + 1;
    html += `
      <div class="hud-title">${stageNumber ? `Stage ${stageNumber} fuel` : "Fuel"} ${Math.ceil(section.liquidFuel)} / ${section.liquidFuelMax}</div>
      ${fuelBar(section.liquidFuel, section.liquidFuelMax)}`;
  });

  // Engines still attached
  const engines = f.engines.filter((e) => isAttached(e.index));
  if (engines.length) html += `<div class="hud-title">Engines</div>`;
  engines.forEach((engine) => {
    const section = f.sections[engine.section];
    let status;
    if (!engine.ignited) status = "waiting";
    else if (engine.part.type === "solid") status = `${Math.ceil(engine.fuel)} / ${engine.part.solidFuel}`;
    else if (engine.shutOff) status = "shut off";
    else if (section.liquidFuelMax === 0) status = "no tank!";
    else if (section.liquidFuel <= 0) status = "out of fuel";
    else status = `${burnRate(engine.part).toFixed(1)} fuel/s`;

    html += `
      <div class="hud-engine ${engine.burning ? "burning" : ""}">
        <span>${engine.part.name}</span><span>${status}</span>
      </div>`;
    if (engine.part.type === "solid") html += fuelBar(engine.fuel, engine.part.solidFuel);
  });

  if (f.eva) {
    const gap = Math.abs(f.eva.x - f.x);
    html =
      `<div class="hud-title">🧑‍🚀 Out on a walk</div>
      <div class="hud-row"><span>Biome</span><strong>${BIOMES[currentBiome()].name}</strong></div>
      <div class="hud-row"><span>To rocket</span><strong>${gap.toFixed(0)} m ${f.eva.x > f.x ? "◀" : "▶"}</strong></div>` + html;
  }

  flightHud.innerHTML = html;
  flightMessage.textContent = currentMessage();
  updateSpeedButton();
}

// The big message in the middle of the screen
function currentMessage() {
  const f = flight;
  if (paused) return "⏸ Paused\nPress Esc or ▶ Resume to carry on";
  if (f.flash && performance.now() < f.flash.until) return f.flash.text;
  if (f.eva) {
    return nearRocket()
      ? "A / D walk · SPACE jump · E EVA report · F get back in"
      : "A / D walk · SPACE jump · E EVA report\n(walk back to the rocket to get in)";
  }

  const next = f.stages[f.nextStage];
  const nextLine = next ? `SPACE: ${next.label}` : "";

  if (f.state === "ready") {
    return f.stages.length
      ? "Press SPACE to launch\nA / D steer · P / R point forward / backward · E science · M map · Esc pause"
      : "Your rocket has no engines!";
  }

  if (f.state === "ended") {
    const max = formatDistance(f.maxAltitude);
    const speed = f.impactSpeed.toFixed(0);
    const where = f.landedOn === "moon" ? "🌙 Landed on the Moon" : f.inWater ? "🌊 Splashdown" : "🪂 Touched down";
    const side = f.onSide ? " on its side" : "";
    const results = {
      crashed: `💥 Crashed at ${speed} m/s! Max altitude: ${max}`,
      burnedUp: `🔥 Burned up during reentry at ${speed} m/s! Max altitude: ${max}`,
      landed: `${where}${side} at ${speed} m/s. Max altitude: ${max}`,
      hardLanding: `😬 Hard landing${side} at ${speed} m/s, but the crew is OK! Max altitude: ${max}`,
      stuck: "The rocket never left the pad.",
    };
    let notes = "";
    if (f.reachedSpace) notes += "\n🌌 You made it to space!";
    if (f.recovered) notes += `\n🔬 Recovered ${f.recovered} science!`;
    if (f.lostScience) notes += `\n🔬 ${f.lostScience} science was lost`;
    let next = "\nPress SPACE to reset";
    if (canTakeOff()) next = "\nSPACE: take off again · N: new launch";
    else if (f.onSide && f.result !== "crashed" && f.result !== "burnedUp") next = "\n(It fell over, so it can't take off) · SPACE: new launch";
    if (canExit()) next += " · F: get out";
    return results[f.result] + notes + next;
  }

  // Overheating warning
  if (f.heat > 50 && f.heatRate > 0.5) {
    if (f.shieldFacing) return "🔥 Heat shield is taking the heat!";
    if (activeShield()) return "🔥 Overheating! Turn your heat shield toward the ground";
    return "🔥 Overheating! You need a heat shield at the bottom";
  }

  const burning = f.engines.filter((e) => e.burning);
  if (burning.length && !f.leftGround) return "Not enough thrust to lift off!";
  if (burning.some((e) => e.part.type === "liquid")) return "SPACE: shut off liquid engines";
  if (burning.length) return "";

  const chutesOpen = f.chutes.some((c) => c.deployed && isAttached(c.index));
  if (chutesOpen) return "Parachutes open";
  const orbiting = isOrbiting(f);
  const motion = orbiting ? (f.body === MOON ? "Orbiting the Moon 🌙" : "In orbit 🛰️") : f.climbSpeed > 0 ? "Coasting" : "Falling!";

  // Liquid engines switched off but with fuel left: Space turns them back on
  const pausedLiquid = f.engines.some(
    (e) => e.ignited && e.shutOff && isAttached(e.index) && f.sections[e.section].liquidFuel > 0
  );
  if (pausedLiquid) return `${motion}\nSPACE: turn liquid engines back on`;
  return nextLine ? `${motion}\n${nextLine}` : motion;
}

// ---------- Keyboard ----------
// Space launches, stages, shuts off engines, or resets after the flight is over.
// A and D steer left and right while held. E records science. M opens the map.
document.addEventListener("keydown", (event) => {
  if (launchPage.hidden || !flight || questsOpen()) return;
  if (event.code === "Escape" && !event.repeat) {
    setPaused(!paused);
    return;
  }
  if (paused) {
    // Only the map works while paused
    if (event.code === "Space") event.preventDefault();
    if (event.code === "KeyM" && !event.repeat) toggleMap();
    return;
  }
  if (event.code === "KeyF" && !event.repeat) toggleEva();
  if (event.code === "KeyN" && !event.repeat && flight.state === "ended") resetFlight();
  if (flight.eva) {
    // Walking around outside: A/D walk, Space/W jump, E report, M map
    if (event.code === "KeyA") steering.left = true;
    if (event.code === "KeyD") steering.right = true;
    if (event.code === "Space" || event.code === "KeyW") {
      event.preventDefault();
      steering.jump = true;
    }
    if (event.code === "KeyE" && !event.repeat) evaReport();
    if (event.code === "KeyM" && !event.repeat) toggleMap();
    return;
  }
  if (event.code === "KeyA") steering.left = true;
  if (event.code === "KeyD") steering.right = true;
  if (event.code === "KeyP") steering.prograde = true;
  if (event.code === "KeyR") steering.retrograde = true;
  if (event.code === "KeyE" && !event.repeat) runExperiments();
  if (event.code === "KeyM" && !event.repeat) toggleMap();
  if (event.code !== "Space") return;
  event.preventDefault();
  if (!event.repeat) pressSpace();
});
document.addEventListener("keyup", (event) => {
  if (event.code === "KeyA") steering.left = false;
  if (event.code === "KeyD") steering.right = false;
  if (event.code === "KeyP") steering.prograde = false;
  if (event.code === "KeyR") steering.retrograde = false;
  if (event.code === "Space" || event.code === "KeyW") steering.jump = false;
  if (event.code === "Space" && !launchPage.hidden) event.preventDefault();
});
// Let go of the steering keys if the window loses focus
window.addEventListener("blur", () => {
  steering.left = false;
  steering.right = false;
  steering.prograde = false;
  steering.retrograde = false;
});

// Back to the builder, with the rocket still there
launchBackButton.addEventListener("click", () => {
  cancelAnimationFrame(flightFrameId);
  setPaused(false);
  launchPage.hidden = true;
  buildPage.hidden = false;
  // Science or budget may have changed during the flight
  updateScienceDisplay();
  renderPartsList();
  renderRocket();
});

// Back to the mission menu
buildBackButton.addEventListener("click", () => {
  buildPage.hidden = true;
  missionMenu.hidden = false;
});
