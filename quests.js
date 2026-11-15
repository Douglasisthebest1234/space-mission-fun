// ---------- Quests ----------
// Each quest has a goal, exact step-by-step instructions, and (in Science and
// Business mode) requirements before you can pick it and a reward when you finish.
// In Creative mode every quest is available straight away.
//
// "parts" in the instructions are listed in the order to click them in the
// builder: the first part you click ends up at the bottom of the rocket.

const QUESTS = [
  {
    id: "firstHop",
    title: "First Hop",
    goal: "Fly higher than 1 km and land safely.",
    reward: { science: 10, funds: 1000 },
    requires: { quests: [], parts: [] },
    steps: [
      "In the builder, click these parts in this order: Pebble, Solo Pod, Nose Chute.",
      "Click 🚀 Launch Rocket.",
      "Press SPACE to light the Pebble. Don't steer: let it fly straight up.",
      "Wait for the Pebble to burn out. The rocket keeps coasting upward.",
      "When the message says \"Falling!\", press SPACE to open the parachute.",
      "Wait for touchdown (under 20 m/s is safe).",
    ],
    check: (f) => safelyLanded(f) && f.maxAltitude >= 1000,
  },
  {
    id: "scienceStarter",
    title: "Science Starter",
    goal: "Take a Thermometer reading in the Lower Air and land safely.",
    reward: { science: 15, funds: 1000 },
    requires: { quests: ["firstHop"], parts: ["thermometer"] },
    steps: [
      "In the builder, click these parts in this order: Pebble, Thermometer, Solo Pod, Nose Chute.",
      "Click 🚀 Launch Rocket.",
      "Press SPACE to light the Pebble.",
      "Straight away, while the panel says Biome: Lower Air (below 12 km), press E to take a reading.",
      "When the message says \"Falling!\", press SPACE to open the parachute.",
      "Land safely to bring the reading home.",
    ],
    check: (f) => safelyLanded(f) && f.readings.includes("thermometer@lowerAir"),
  },
  {
    id: "splashdown",
    title: "Splashdown",
    goal: "Land in the ocean east of the launch pad.",
    reward: { science: 15, funds: 1500 },
    requires: { quests: ["firstHop"], parts: [] },
    steps: [
      "In the builder, click these parts in this order: Pebble, Solo Pod, Nose Chute.",
      "Click 🚀 Launch Rocket.",
      "Press SPACE to light the Pebble.",
      "As soon as you're off the pad, tap D until the panel shows Tilt: about 20° right. The ocean is to the right (east).",
      "Let go of D and let the Pebble burn out. You'll fly up and to the right.",
      "When the message says \"Falling!\", press SPACE to open the parachute.",
      "You'll come down in the ocean: \"🌊 Splashdown\".",
    ],
    check: (f) => safelyLanded(f) && f.inWater,
  },
  {
    id: "firstSteps",
    title: "First Steps",
    goal: "Land, climb out of the rocket, and write an EVA report.",
    reward: { science: 10, funds: 1000 },
    requires: { quests: ["firstHop"], parts: [] },
    steps: [
      "In the builder, click these parts in this order: Pebble, Solo Pod, Nose Chute.",
      "Click 🚀 Launch Rocket and fly like in \"First Hop\": SPACE to launch, SPACE to open the parachute when it says \"Falling!\".",
      "When you've landed safely, press F to climb out.",
      "Walk with A and D. Press SPACE to jump.",
      "Press E to write an EVA report about where you're standing. Quest complete!",
      "Walk back next to the rocket and press F to climb back in. (Walk somewhere new, like the hills, for more reports.)",
    ],
    check: (f) => f.readings.some((r) => r.startsWith("eva@")),
  },
  {
    id: "landerTest",
    title: "Lander Test",
    goal: "Hop over 1 km high, then land on your engine and Landing Legs: no parachutes!",
    reward: { science: 20, funds: 2000 },
    requires: { quests: ["firstHop"], parts: ["legs", "radar", "lander"] },
    steps: [
      "In the builder, click these parts in this order: Ember, Medium Tank, Landing Legs, Landing Radar, Lander Cabin. (The legs clip onto the Medium Tank and hang down past the engine.)",
      "Click 🚀 Launch Rocket. Press SPACE to light the Ember and fly straight up.",
      "When Altitude reaches about 1.5 km, press SPACE to shut the Ember off. You'll keep rising, slow down, and start to fall.",
      "As soon as you're falling, hold R: this points the engine at the ground.",
      "Watch the 📡 Landing Radar on the panel. When the message says \"🔥 BURN NOW!\", press SPACE to turn the Ember on (keep holding R).",
      "When Speed is under about 10 m/s, tap SPACE on and off to drift down gently. With legs you can touch down at up to 30 m/s (under 12 m/s is a soft landing). Quest complete!",
    ],
    check: (f) => safelyLanded(f) && f.maxAltitude >= 1000 && f.chutes.length === 0 && f.landedOnLegs,
  },
  {
    id: "roverExplorer",
    title: "Rover Explorer",
    goal: "Land a rover, drive it to the Hills, and do a science scan there.",
    reward: { science: 20, funds: 2000 },
    requires: { quests: ["firstHop"], parts: ["rover"] },
    steps: [
      "In the builder, click these parts in this order: Pebble, Rover, Probe Core, Nose Chute.",
      "Click 🚀 Launch Rocket. Press SPACE to light the Pebble and fly straight up (don't steer).",
      "When the message says \"Falling!\", press SPACE to open the parachute, and land.",
      "Press V: the rover drives off the rocket. (Press E now for a free Grasslands scan!)",
      "Hold D to drive right (east). Use ⏩ to drive faster. After about 900 m, the panel's Biome changes to Hills.",
      "Press E for a science scan in the Hills. Quest complete! Keep exploring: the Beach is about 2.3 km east. (Rovers can't swim!)",
    ],
    check: (f) => f.readings.includes("rover@hills"),
  },
  {
    id: "edgeOfSpace",
    title: "Edge of Space",
    goal: "Fly higher than 100 km (into space) and land safely.",
    reward: { science: 30, funds: 2000 },
    requires: { quests: ["firstHop"], parts: [] },
    steps: [
      "In the builder, click these parts in this order: Ember, Medium Tank, Medium Tank, Decoupler, Small Heat Shield, Solo Pod, Nose Chute.",
      "Click 🚀 Launch Rocket. The stages should read: Ignite Ember → Decouple → Deploy parachutes.",
      "Press SPACE to light the Ember. Don't steer: fly straight up.",
      "Let it burn all its fuel (about 2 minutes). Use ⏩ to speed up if you like. You'll pass 100 km: \"🌌 You reached space!\".",
      "When the fuel is gone, press SPACE to decouple. The Small Heat Shield is now the bottom of your capsule.",
      "Let the capsule fall bottom-first. If the panel's Tilt isn't near 0°, steer with A/D until it is.",
      "Coming back down it will glow: the heat shield takes the heat.",
      "Once the speed is under about 250 m/s (low down in the Lower Air), press SPACE to open the parachute and land.",
    ],
    check: (f) => safelyLanded(f) && f.reachedSpace,
  },
  {
    id: "orbit",
    title: "Into Orbit",
    goal: "Get into orbit: both your highest (Apoapsis) and lowest (Periapsis) points above 100 km.",
    reward: { science: 80, funds: 5000 },
    requires: { quests: ["edgeOfSpace"], parts: ["boulder", "tank-l"] },
    steps: [
      "In the builder, click these parts in this order: Boulder, Small Decoupler, Ember, Large Tank, Large Tank, Small Decoupler, Heat Shield, Solo Pod, Nose Chute.",
      "Click 🚀 Launch Rocket. Stages: Ignite Boulder → Decouple → Ignite Ember → Decouple → Deploy parachutes.",
      "Press SPACE to light the Boulder and fly straight up.",
      "From 1 km up, slowly lean right with D, following the Tilt and Altitude on the panel: 30° right at 10 km, 55° right at 30 km, 70° right at 50 km.",
      "When the Boulder burns out, press SPACE to decouple it, then SPACE again to light the Ember. Keep following the tilt plan.",
      "Watch Apoapsis. When it reaches 120 km, press SPACE to shut off the Ember.",
      "Coast up to the top: speed up time with ⏩ until Climb is nearly 0 m/s (you're at about 120 km). Set ⏩ back to 1x.",
      "Hold D until Tilt shows 90° right (pointing along the horizon). Press SPACE to turn the Ember back on.",
      "Watch Periapsis rise. When it's above 100 km you'll see \"🛰️ You're in orbit!\". Press SPACE to shut off the Ember. Quest complete! Open 🗺️ Map (M) to see your orbit.",
      "To come home: hold A until Tilt shows 90° left (pointing backwards), press SPACE and burn until the Ember runs out of fuel.",
      "Press SPACE to decouple. Let the Heat Shield face the ground (Tilt near 0°), and when the speed drops under about 250 m/s, press SPACE to open the parachute.",
    ],
    check: (f) => f.inOrbit,
  },
  {
    id: "stationVisit",
    title: "Station Visit",
    goal: "Dock with Horizon Station, 150 km up.",
    reward: { science: 60, funds: 6000 },
    requires: { quests: ["orbit"], parts: ["boulder", "tank-l", "dock"] },
    steps: [
      "In the builder, click these parts in this order: Boulder, Small Decoupler, Ember, Large Tank, Large Tank, Small Decoupler, Heat Shield, Solo Pod, Side Chutes, Docking Port. (The Side Chutes clip onto the Solo Pod.)",
      "Get into orbit like in \"Into Orbit\". After \"🛰️ You're in orbit!\", keep burning until Periapsis is within 10 km of Apoapsis (a nice round orbit makes the next part work), then press SPACE to shut the Ember off.",
      "The panel now shows \"Station: …° ahead (burn at …°)\". You're lower than the station, so you slowly catch up. Speed up with ⏩ until \"ahead\" matches the \"burn at\" number. Set ⏩ back to 1x.",
      "Hold P and press SPACE to burn. Watch Apoapsis: when it reaches 150 km, press SPACE to shut the Ember off.",
      "Speed up gently (⏩ 10x) and coast up to the top. As you get close, the panel shows the station's Distance, Rel. speed and Closing speed, and an arrow ➤ at the edge of the screen points to it.",
      "Once it's under 50 km away: hold R (now that means backwards compared with the station) and tap SPACE on and off until Rel. speed is under 5 m/s.",
      "Hold T to point at the station. Tap SPACE on and off to push toward it until Closing shows about 50 m/s if it's over 10 km away, 20 m/s if it's closer, or 5 m/s once it's under 1 km. Let go and coast. If Closing turns into ◀▶, do this step again.",
      "When it's under 300 m away, hold R and tap SPACE until Rel. speed is under 5 m/s. Drift in: within 80 m you'll dock automatically: \"🔗 Docked!\". Quest complete! The station refills your tanks and radios your science home.",
      "To come home: press SPACE to undock. Hold R and burn until Periapsis is under 30 km. When the fuel runs out, SPACE decouples. Keep holding R so the Heat Shield faces forward, and open the chutes (SPACE) under 250 m/s.",
    ],
    check: (f) => f.visitedStation,
  },
  {
    id: "moonFlyby",
    title: "To the Moon",
    goal: "Fly into the Moon's gravity (\"🌙 Entered the Moon's gravity!\").",
    reward: { science: 50, funds: 5000 },
    requires: { quests: ["orbit"], parts: ["nova", "boulder", "tank-l"] },
    steps: [
      "In the builder, click these parts in this order: Boulder, Decoupler, Nova, Large Tank, Large Tank, Large Tank, Large Tank, Decoupler, Ember, Large Tank, Thermometer, Solo Pod.",
      "Click 🚀 Launch Rocket. Stages: Ignite Boulder → Decouple → Ignite Nova → Decouple → Ignite Ember.",
      "Get into orbit like in \"Into Orbit\": light the Boulder, follow the tilt plan (30° right at 10 km, 55° at 30 km, 70° at 50 km), decouple and light the Nova when the Boulder burns out, and shut the Nova off with SPACE when Apoapsis reaches 120 km.",
      "Coast to the top, hold P (points you forwards, the way you're moving), press SPACE to turn the Nova back on, and burn until \"🛰️ You're in orbit!\". Press SPACE to shut it off.",
      "Now wait for the Moon. The panel shows \"Moon: …° ahead\". Use ⏩ (up to 100x) until it says about 110° ahead. Set ⏩ back to 1x.",
      "Hold P to point forwards and press SPACE to burn. If the Nova runs out of fuel, press SPACE to decouple, then SPACE to light the Ember, and keep burning.",
      "Watch Apoapsis. When it reaches about 11,400 km, press SPACE to shut the engine off. Open the 🗺️ Map (M): your orange path should reach out to the Moon's dashed circle.",
      "Speed up with ⏩ (1000x works now you're coasting). In about 7 hours of game time you'll see \"🌙 Entered the Moon's gravity!\". Quest complete!",
    ],
    check: (f) => f.visitedMoon,
  },
  {
    id: "moonLanding",
    title: "Moon Landing",
    goal: "Land safely on the Moon and take a Thermometer reading there.",
    reward: { science: 150, funds: 10000 },
    requires: { quests: ["moonFlyby"], parts: ["thermometer"] },
    steps: [
      "Tip: this is MUCH easier with Landing Legs and a Landing Radar. Build the \"To the Moon\" rocket, but after the Ember's Large Tank click Landing Legs (they clip onto it) and then Landing Radar, before the Thermometer.",
      "Fly to the Moon with that rocket, following every step of \"To the Moon\". Try to keep some Ember fuel: you need about 1,000 m/s worth to land.",
      "Once you're in the Moon's gravity, the panel shows Apoapsis (Moon) and Periapsis (Moon). If Periapsis (Moon) is above 0, hold R (points you backwards) and burn until it's below 0 m. Now you're heading for the surface.",
      "If you still have the Nova, press SPACE (when it's empty) to decouple it and SPACE again to light the Ember, then shut the Ember off straight away with SPACE.",
      "Use ⏩ to speed up until you're about 40 km above the Moon. Set ⏩ back to 1x.",
      "Hold R the whole way down so the engine points at the ground. With a radar: wait for \"🔥 BURN NOW!\" (it slows time for you). Without one: at about 25 km. Press SPACE to turn the Ember on and burn until Speed is under 50 m/s.",
      "Now tap SPACE to switch the Ember on and off, keeping Speed between 10 and 20 m/s as you drop. Near the ground, touch down under 20 m/s (30 m/s with Landing Legs).",
      "You'll see \"🌙 Landed on the Moon\". Press E for a Thermometer reading. Quest complete! Press F to get out and go for a moonwalk. (This rocket doesn't have the fuel or heat shield to get home: try \"Moon and Back\" next.)",
    ],
    check: (f) => safelyLanded(f) && f.landedOn === "moon" && f.readings.some((r) => r.startsWith("thermometer@moon")),
  },
  {
    id: "moonRover",
    title: "Moon Rover",
    goal: "Drive a rover on the Moon and scan both the Moon Lowlands and the Moon Highlands.",
    reward: { science: 120, funds: 8000 },
    requires: { quests: ["moonLanding"], parts: ["rover"] },
    steps: [
      "Build the \"To the Moon\" rocket, but click Rover right after the Ember's Large Tank (Landing Legs and Landing Radar there too make landing easier): Boulder, Decoupler, Nova, Large Tank ×4, Decoupler, Ember, Large Tank, Landing Legs, Landing Radar, Rover, Thermometer, Solo Pod.",
      "Fly to the Moon and land, following \"To the Moon\" and \"Moon Landing\".",
      "Press V to drive the rover off. Press E to scan the biome you landed in (look at the panel's Biome).",
      "Now drive to the other kind of land. Hold A or D and speed up with ⏩ (up to 50x). Watch the Biome on the panel: it switches between Moon Lowlands and Moon Highlands every 1–30 km (usually about 20).",
      "Crater rims make the rover jump in the low gravity. Let go of the key to slow down if it's bouncing too much.",
      "When the Biome changes, press E to scan it. Quest complete! Press V to go back to the rocket.",
    ],
    check: (f) => f.readings.includes("rover@moonLowlands") && f.readings.includes("rover@moonHighlands"),
  },
  {
    id: "moonAndBack",
    title: "Moon and Back",
    goal: "Land on the Moon, take off again, and land safely back home on the planet.",
    reward: { science: 250, funds: 20000 },
    requires: { quests: ["moonLanding"], parts: [] },
    steps: [
      "In the builder, click these parts in this order: Nova, Large Tank ×7, Decoupler, Ember, Large Tank ×3, Small Decoupler, Spark, Large Tank, Small Decoupler, Heat Shield, Thermometer, Solo Pod, Nose Chute.",
      "Click 🚀 Launch Rocket. Stages: Ignite Nova → Decouple → Ignite Ember → Decouple → Ignite Spark → Decouple → Deploy parachutes.",
      "SPACE lights the Nova. Follow the tilt plan (30° right at 10 km, 55° at 30 km, 70° at 50 km) and shut it off with SPACE when Apoapsis is 120 km. At the top, hold P and burn until you're in orbit. When the Nova is empty, SPACE decouples it and SPACE lights the Ember.",
      "Fly to the Moon and land on it with the Ember, just like in \"To the Moon\" and \"Moon Landing\". Land upright: a rocket on its side can't take off.",
      "Moonwalk (optional): press F to get out, E for an EVA report, walk back to the rocket and press F to get in.",
      "Press SPACE to take off (the Ember turns back on). Fly straight up and keep burning. When the Ember runs out, press SPACE to decouple and SPACE again to light the Spark.",
      "Keep burning until Apoapsis (Moon) says \"escape!\", then press SPACE to shut the Spark off.",
      "Speed up with ⏩ until you see \"Left the Moon's gravity\". Set ⏩ back to 1x.",
      "Now look at Periapsis (around the planet). If it's above 30 km, hold R and burn until it's about 30 km. If it's below 0, hold P and burn until it's about 30 km. Then shut the Spark off.",
      "Speed up with ⏩ (about 8 hours of game time). When Altitude drops under 2,000 km, set ⏩ to 1x, hold R and burn ALL the Spark's leftover fuel. This slows you down so reentry is gentler.",
      "Press SPACE to decouple the Spark. Keep holding R: it turns the Heat Shield to face the way you're going, so it takes the heat.",
      "When Speed is under about 250 m/s, press SPACE to open the parachute. Land safely: you went to the Moon and back!",
    ],
    check: (f) => safelyLanded(f) && f.landedOn === "planet" && f.wasOnMoon,
  },
];

const questOverlay = document.getElementById("questOverlay");
const questList = document.getElementById("questList");
const questClose = document.getElementById("questClose");
const buildQuestTracker = document.getElementById("buildQuestTracker");

// Which quests are done and which one is selected, saved per mode
let questState = { completed: [], active: null };

function loadQuests(mode) {
  questState = { completed: [], active: null };
  try {
    const saved = JSON.parse(localStorage.getItem("spaceMission.quests." + mode));
    if (saved) questState = { ...questState, ...saved };
  } catch (error) {
    // Saving isn't available: start fresh
  }
  renderQuestTracker();
}

function saveQuests() {
  try {
    localStorage.setItem("spaceMission.quests." + build.mode, JSON.stringify(questState));
  } catch (error) {
    // Couldn't save: progress still works until the page is closed
  }
}

function safelyLanded(f) {
  return f.state === "ended" && (f.result === "landed" || f.result === "hardLanding");
}

function partName(id) {
  return parts.find((p) => p.id === id).name;
}

// What's still needed before a quest can be picked (nothing in Creative)
function missingRequirements(quest) {
  if (build.mode === "creative") return [];
  const missing = [];
  quest.requires.quests.forEach((id) => {
    if (!questState.completed.includes(id)) missing.push(`Finish "${QUESTS.find((q) => q.id === id).title}"`);
  });
  quest.requires.parts.forEach((id) => {
    const part = parts.find((p) => p.id === id);
    if (!isUnlocked(part)) missing.push(`Unlock the ${part.name} (${scienceCosts[id]} 🔬)`);
  });
  return missing;
}

function rewardText(quest) {
  if (build.mode === "creative") return "";
  const bits = [`+${quest.reward.science} 🔬`];
  if (build.mode === "business") bits.push(`+$${quest.reward.funds.toLocaleString()} budget`);
  return bits.join(", ");
}

function openQuests() {
  renderQuestList();
  questOverlay.hidden = false;
  questClose.focus();
}

function closeQuests() {
  questOverlay.hidden = true;
}

function questsOpen() {
  return !questOverlay.hidden;
}

function selectQuest(id) {
  questState.active = questState.active === id ? null : id;
  saveQuests();
  renderQuestList();
  renderQuestTracker();
}

function renderQuestList() {
  questList.innerHTML = "";
  QUESTS.forEach((quest) => {
    const done = questState.completed.includes(quest.id);
    const active = questState.active === quest.id;
    const missing = missingRequirements(quest);
    const card = document.createElement("div");
    card.className = "quest-card" + (active ? " active" : "") + (done ? " done" : "") + (missing.length ? " locked" : "");

    const reward = rewardText(quest);
    let status = "";
    if (done) status = `<span class="quest-status done">✅ Done</span>`;
    else if (missing.length) status = `<span class="quest-status locked">🔒 Locked</span>`;
    else if (active) status = `<span class="quest-status active">▶ Active</span>`;

    let body = "";
    if (missing.length) {
      body = `<div class="quest-needs">Needs: ${missing.join(" · ")}</div>`;
    } else {
      body = `
        <ol class="quest-steps">${quest.steps.map((step) => `<li>${step}</li>`).join("")}</ol>
        <button class="quest-select">${active ? "Stop this quest" : done ? "Do it again" : "Start this quest"}</button>`;
    }

    card.innerHTML = `
      <div class="quest-head">
        <h3>${quest.title}</h3>
        ${status}
      </div>
      <p class="quest-goal">${quest.goal}</p>
      ${reward ? `<p class="quest-reward">Reward: ${reward}</p>` : ""}
      ${body}`;

    const button = card.querySelector(".quest-select");
    if (button) button.addEventListener("click", () => selectQuest(quest.id));
    questList.appendChild(card);
  });
}

// The small "current quest" line in the builder (the flight panel shows it too)
function renderQuestTracker() {
  const quest = QUESTS.find((q) => q.id === questState.active);
  buildQuestTracker.hidden = !quest;
  if (quest) buildQuestTracker.textContent = `📜 ${quest.title}`;
}

function activeQuest() {
  return QUESTS.find((q) => q.id === questState.active) || null;
}

// Called during and after each flight: finishes the active quest if its goal is met
function checkQuest() {
  const quest = activeQuest();
  if (!quest || !flight || !quest.check(flight)) return;

  questState.completed.push(quest.id);
  questState.active = null;
  saveQuests();
  renderQuestTracker();

  let reward = "";
  if (career) {
    career.science += quest.reward.science;
    if (build.mode === "business") career.funds = (career.funds || 0) + quest.reward.funds;
    saveCareer();
    updateScienceDisplay();
    reward = ` ${rewardText(quest)}`;
  }
  flashMessage(`📜 Quest complete: ${quest.title}!${reward}`, 5000);
}

document.querySelectorAll("[data-open-quests]").forEach((button) => {
  button.addEventListener("click", () => {
    button.blur();
    openQuests();
  });
});
questClose.addEventListener("click", closeQuests);
questOverlay.addEventListener("click", (event) => {
  if (event.target === questOverlay) closeQuests(); // clicking outside the panel
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && questsOpen()) closeQuests();
});
