/**
 * Lemonaid - Client-side Application Logic
 * NHTSA vPIC & Safety Recalls Integration
 */

// ==========================================
// 1. Constants & Reference Data
// ==========================================

const NHTSA_RECALLS_EXTERNAL_URL = "https://www.nhtsa.gov/recalls";
const TIMEOUT_MS = 15000;
const SPEC_NOT_AVAILABLE = "Not available without the VIN";

// Curated public sample VINs (decode with ErrorCode 0 at NHTSA vPIC)
const SAMPLE_VINS = [
  { vin: "1HGCV1F37JA000001", label: "2018 Honda Accord" },
  { vin: "2T3C1RFV5MC000001", label: "2021 Toyota RAV4" },
  { vin: "1FTFW1E57KFA00001", label: "2019 Ford F-150" }
];

// Pre-purchase checklist items (10 total)
const CHECKLIST_ITEMS = [
  { id: 0, group: "Paperwork and history", text: "Match the 17-character VIN on the dashboard, door jamb, and title document." },
  { id: 1, group: "Paperwork and history", text: "Review title status (ensure no salvage, flood, or rebuilt title brand)." },
  { id: 2, group: "Paperwork and history", text: "Review available maintenance records and regular oil change history." },
  { id: 3, group: "Paperwork and history", text: "Check open safety recall status on nhtsa.gov/recalls." },
  { id: 4, group: "Walk-around inspection", text: "Inspect all 4 tires for even tread wear and healthy sidewalls." },
  { id: 5, group: "Walk-around inspection", text: "Check underneath the engine and transmission for fluid leaks." },
  { id: 6, group: "Walk-around inspection", text: "Test all lights, turn signals, power windows, locks, and climate control." },
  { id: 7, group: "Test drive", text: "Test drive at varying speeds: notice smooth shifting and normal engine noise." },
  { id: 8, group: "Test drive", text: "Test firm braking, steering centering, and suspension over bumps." },
  { id: 9, group: "Professional opinion", text: "Schedule an independent pre-purchase inspection with a trusted certified mechanic." }
];

// Comprehensive plain-English guide for owner-reported complaints by component
const COMPLAINT_COMPONENT_GUIDE = {
  "Engine and Engine Cooling": {
    title: "Engine & Cooling System",
    icon: "⚙️",
    summary: "Engine stalling, loss of motive power, overheating, head gasket failures, or oil leaks.",
    whatToLookFor: "Check for warning lights on the dashboard. Listen for ticking, knocking, or rattling noises when starting cold and idling. Check under the hood for coolant leaks, sweet smells, or low fluid. On the test drive, watch for hesitation during acceleration, rough idling at red lights, or temperature gauge creeping up."
  },
  "Powertrain and Transmission": {
    title: "Powertrain & Transmission",
    icon: "🕹️",
    summary: "Transmission gear slipping, hard shifting, shuddering, clunking, or sudden loss of drive power.",
    whatToLookFor: "While stopped, shift smoothly between Park, Reverse, and Drive—there should be no harsh clunk, jolt, or 2-second delay. During acceleration, ensure gears shift smoothly without surging (RPMs flaring up without speed), jerking, or hesitation from a stop."
  },
  "Driver Assist & Collision Avoidance": {
    title: "Driver Assist & Collision Avoidance",
    icon: "🛡️",
    summary: "Automatic emergency braking false triggers, cruise control failures, or camera/radar sensor faults.",
    whatToLookFor: "Look at the windshield camera area and front bumper radar for cracks or misalignment. During your test drive, test adaptive cruise control and lane centering. Watch for unexpected warning beeps, flashing brake warnings when no car is ahead, or sudden unprompted braking."
  },
  "Electrical System & Accessories": {
    title: "Electrical System & Accessories",
    icon: "⚡",
    summary: "Parasitic battery drain, alternator or starter failure, touchscreen freezes, or wiring shorts.",
    whatToLookFor: "Test all power windows, locks, infotainment display, backup camera, and climate control (verify cold air blows within 60 seconds). Ensure the engine cranks immediately on first turn without slow cranking or dashboard flickering."
  },
  "Service Brakes & Hydraulic System": {
    title: "Service Brakes & Hydraulic System",
    icon: "🛑",
    summary: "Brake booster failure, stiff or spongy pedals, ABS modulator faults, or reduced stopping ability.",
    whatToLookFor: "Before driving, press the brake pedal firmly—it should feel solid and not sink slowly to the floor. While test driving, perform gentle and firm stops: listen for grinding or high-pitched squealing, and verify the car stops straight without pulling to either side."
  },
  "Fuel and Propulsion System": {
    title: "Fuel & Propulsion System",
    icon: "⛽",
    summary: "High-pressure fuel pump failure, fuel injector leaks, raw gas odors, or sudden limp mode.",
    whatToLookFor: "Sniff around the vehicle and under the hood for any raw gasoline smells. While driving at 45–60 mph, test accelerating to ensure no sudden power drop (limp mode) or hesitation. Look under the rear for any fuel leaks or stains."
  },
  "Steering System": {
    title: "Steering System",
    icon: "🛞",
    summary: "Electric power steering assist failure, steering stiffness, binding, or wandering.",
    whatToLookFor: "Turn the steering wheel all the way left and right while parked—listen for groaning, whining, or clicking. On a straight flat road, verify the wheel stays centered and the vehicle doesn't pull or wander."
  },
  "Suspension": {
    title: "Suspension & Ride Control",
    icon: "🔩",
    summary: "Broken springs, worn control arms, leaking struts, or ball joint looseness.",
    whatToLookFor: "Drive over speed bumps or uneven pavement, listening for thumping, rattling, or creaking. Look at the car parked on level ground to ensure it sits evenly without sagging at any corner. Look behind tires for leaking shock oil."
  },
  "Air Bags & Restraints": {
    title: "Air Bags & Restraints",
    icon: "🦺",
    summary: "SRS airbag warning lights, crash sensor faults, or airbag inflator safety concerns.",
    whatToLookFor: "Turn the ignition on: the airbag/SRS light should light up for about 5 seconds, then turn completely off. If the light stays on, blinks, or never illuminates at startup, have a certified mechanic read the SRS fault codes."
  },
  "Back Over Prevention & Cameras": {
    title: "Back Over Prevention & Cameras",
    icon: "📷",
    summary: "Black screen, flickering, or delayed rearview backup camera display.",
    whatToLookFor: "Shift into Reverse and verify the rear camera display comes on immediately with a clear, sharp picture. Test in bright light and shade. If equipped with rear parking sensors, listen for steady beeping as you back up near an obstacle."
  },
  "Vehicle Structure & Frame": {
    title: "Structure, Frame & Body Panels",
    icon: "🏗️",
    summary: "Panel misalignment, frame corrosion, door latch weld failures, or water leaks into cabin.",
    whatToLookFor: "Examine gaps between body panels (doors, hood, trunk) for even width. Open and close all doors and the trunk lid—they should close cleanly without slamming. Inspect underneath the car and inside wheel wells for heavy rust or repaint overspray."
  },
  "Visibility & Windshield Wipers": {
    title: "Visibility & Windshield Wipers",
    icon: "🌧️",
    summary: "Wiper motor failure, windshield defroster grid defects, or washer fluid failure.",
    whatToLookFor: "Test all wiper speeds (intermittent, low, high) and spray washer fluid. Check that both front and rear defrosters heat up and clear fogged windows. Check windshield glass for any cracks or stone chips in the driver line of sight."
  },
  "Tires": {
    title: "Tires",
    icon: "🛞",
    summary: "Premature tread wear, tire pressure monitoring sensor (TPMS) failures, or sidewall bubbles.",
    whatToLookFor: "Check tread depth across all 4 tires with a penny or gauge. Look for heavy wear on only the inner or outer edge, which indicates alignment or suspension trouble. Check sidewalls for cracks or bulges."
  },
  "Wheels": {
    title: "Wheels & Rims",
    icon: "🔘",
    summary: "Cracked alloy rims, bent wheel lips from potholes, or loose lug nut seats.",
    whatToLookFor: "Look at rim edges for deep gouges or bent lips from potholes. While driving at 50–65 mph, notice if there is a hum or roar that changes when gently swerving, which indicates a worn wheel bearing."
  },
  "Exterior & Interior Lighting": {
    title: "Lighting (Headlights & Signals)",
    icon: "💡",
    summary: "Headlight module failure, burned-out LED daytime running lights, or tail light water intrusion.",
    whatToLookFor: "Walk around the car while someone toggles low beams, high beams, turn signals, hazard lights, brake lights, and reverse lights. Check lenses for moisture or cloudiness."
  },
  "Seat Belts": {
    title: "Seat Belts",
    icon: "🔒",
    summary: "Seat belt retractor jamming, failure to latch, or pretensioner electrical faults.",
    whatToLookFor: "Pull every seat belt out completely and yank quickly to ensure the locking retractor catches firmly. Click each tongue into its buckle and press the release button to verify it unlatches smoothly."
  },
  "Seats & Latches": {
    title: "Seats & Interior Latches",
    icon: "💺",
    summary: "Power seat track motor failure, loose seat frames, or fold-down seatback latches.",
    whatToLookFor: "Test all seat adjusters (power or manual), seat heaters, and folding seatback latches. Sit firmly in each seat and rock gently to ensure there is no loose seat frame play."
  },
  "Door Latches and Locks": {
    title: "Door Latches & Locks",
    icon: "🔑",
    summary: "Power door lock actuators failing, doors unlatching, or tailgate latch failure.",
    whatToLookFor: "Lock and unlock all doors using the key fob and interior switches. Open every door from inside and outside. Test child safety locks on rear doors. Check hood and fuel door release levers."
  },
  "Electronic Stability & Traction Control": {
    title: "Electronic Stability & Traction Control",
    icon: "⚠️",
    summary: "False traction control activation, wheel speed sensor faults, or steering angle sensor errors.",
    whatToLookFor: "Ensure the traction control / ESC warning light turns on briefly with the ignition and goes off. Press the traction control button to verify the system responds. A constant ESC light means an active sensor fault."
  },
  "Other Miscellaneous Components": {
    title: "Other Miscellaneous Equipment",
    icon: "🔍",
    summary: "Owner concerns reported across other vehicle systems and cabin components.",
    whatToLookFor: "Perform a thorough walk-around and test drive. Take notes on any odd sounds, smells, or warning lights. Have an independent certified mechanic perform a full diagnostic scan to read all vehicle modules for hidden trouble codes."
  }
};

function getComplaintCategory(rawComp) {
  const c = (rawComp || "").toUpperCase().trim();
  if (c.includes("ENGINE") || c === "GASOLINE" || c === "DIESEL") return "Engine and Engine Cooling";
  if (c.includes("POWER TRAIN") || c.includes("TRANSMISSION")) return "Powertrain and Transmission";
  if (c.includes("BRAKE") || c === "HYDRAULIC") return "Service Brakes & Hydraulic System";
  if (c.includes("ELECTRICAL")) return "Electrical System & Accessories";
  if (c.includes("FUEL")) return "Fuel and Propulsion System";
  if (c.includes("FORWARD COLLISION") || c.includes("COLLISION AVOIDANCE") || c.includes("LANE DEPARTURE") || c.includes("SPEED CONTROL")) return "Driver Assist & Collision Avoidance";
  if (c.includes("STEERING")) return "Steering System";
  if (c.includes("AIR BAG")) return "Air Bags & Restraints";
  if (c.includes("SUSPENSION")) return "Suspension";
  if (c.includes("BACK OVER") || c.includes("CAMERA")) return "Back Over Prevention & Cameras";
  if (c.includes("STRUCTURE")) return "Vehicle Structure & Frame";
  if (c.includes("TIRE")) return "Tires";
  if (c.includes("WHEEL")) return "Wheels";
  if (c.includes("LIGHTING")) return "Exterior & Interior Lighting";
  if (c.includes("VISIBILITY") || c.includes("WIPER")) return "Visibility & Windshield Wipers";
  if (c.includes("SEAT BELT")) return "Seat Belts";
  if (c.includes("SEAT")) return "Seats & Latches";
  if (c.includes("LATCH") || c.includes("LOCK")) return "Door Latches and Locks";
  if (c.includes("STABILITY") || c.includes("TRACTION")) return "Electronic Stability & Traction Control";
  return "Other Miscellaneous Components";
}

// Questions for the seller
const SELLER_QUESTIONS = [
  "Can you provide maintenance records or receipts for recent oil changes and service?",
  "Has the car ever had any major repairs, bodywork, or accident damage?",
  "Do you hold the clean title in hand, or is there an active bank lien?",
  "Are there any known mechanical or electrical issues that currently need attention?",
  "Can I take the car for an independent pre-purchase inspection with my mechanic?"
];

// Fallback popular car makes in case network is slow
const DEFAULT_POPULAR_MAKES = [
  "Acura", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler", "Dodge",
  "Ford", "GMC", "Honda", "Hyundai", "Infiniti", "Jeep", "Kia", "Lexus",
  "Lincoln", "Mazda", "Mercedes-Benz", "Nissan", "Ram", "Subaru", "Tesla", "Toyota", "Volkswagen", "Volvo"
];

// Calm plain-English recall titles mapped from NHTSA component names
const COMPONENT_TRANSLATIONS = [
  { key: "AIR BAG", title: "Air bags recall" },
  { key: "SERVICE BRAKES", title: "Brake system recall" },
  { key: "PARKING BRAKE", title: "Parking brake recall" },
  { key: "ELECTRICAL", title: "Electrical system recall" },
  { key: "ENGINE", title: "Engine and cooling recall" },
  { key: "FUEL SYSTEM", title: "Fuel system recall" },
  { key: "STEERING", title: "Steering system recall" },
  { key: "SUSPENSION", title: "Suspension recall" },
  { key: "SEAT BELT", title: "Seat belts recall" },
  { key: "SEAT", title: "Seats and latches recall" },
  { key: "TIRE", title: "Tires recall" },
  { key: "WHEEL", title: "Wheels recall" },
  { key: "VISIBILITY/WIPER", title: "Windshield wipers recall" },
  { key: "BACK OVER PREVENTION", title: "Backup camera recall" },
  { key: "CAMERA", title: "Backup camera recall" },
  { key: "FORWARD COLLISION", title: "Collision avoidance system recall" },
  { key: "VISIBILITY", title: "Visibility and glass recall" },
  { key: "EXTERIOR LIGHTING", title: "Exterior lighting recall" },
  { key: "LIGHTING", title: "Lighting recall" },
  { key: "POWER TRAIN", title: "Powertrain recall" },
  { key: "TRANSMISSION", title: "Transmission recall" },
  { key: "TAILGATE", title: "Tailgate latch recall" },
  { key: "LATCH", title: "Door and tailgate latches recall" },
  { key: "LOCK", title: "Door locks and latches recall" },
  { key: "EQUIPMENT:OTHER:LABELS", title: "Safety labels recall" },
  { key: "LABEL", title: "Safety labels recall" },
  { key: "ELECTRONIC STABILITY", title: "Stability control recall" },
  { key: "STRUCTURE", title: "Vehicle structure recall" },
  { key: "CHILD SEAT", title: "Child seat anchors recall" },
  { key: "HYBRID", title: "Hybrid and high-voltage battery recall" },
  { key: "DEFROST", title: "Windshield defroster recall" }
];

// ==========================================
// 2. Global State
// ==========================================

function createEmptyRecallsState(loading = false) {
  return {
    loading,
    error: null,
    modelSelectionNeeded: false,
    dataUnavailable: false,
    nhtsaRecallModels: [],
    selectedNhtsaModel: null,
    modelRecognizedByNhtsa: false,
    recalls: null,
    fetchTimestamp: null
  };
}

function createEmptyComplaintsState(loading = false) {
  return {
    loading,
    loaded: false,
    error: null,
    totalComplaints: null,
    topProblemAreas: null,
    selectedModel: null,
    matchedVariantModel: null,
    variantResults: [],
    modelConfirmedInNhtsa: false,
    fetchTimestamp: null
  };
}

const state = {
  currentPage: "home",
  theme: "light",
  vehicle: null,
  recentVehicles: [],
  checklist: new Set(),
  checklistsByVehicle: {},
  notes: {},
  allMakes: [...DEFAULT_POPULAR_MAKES],
  dropdownModels: [],
  loadingModels: false,
  modelsLoadError: false,
  
  // Recalls live state
  recallsState: createEmptyRecallsState(false),

  // Complaints live state
  complaintsState: createEmptyComplaintsState(false)
};

// ==========================================
// 3. Storage & Initialization
// ==========================================

function initApp() {
  loadStoredSettings();
  setupEventListeners();
  loadMakesList();
  renderActiveView();
}

function loadStoredSettings() {
  // Theme
  const savedTheme = localStorage.getItem("lemonaid-theme") || 
    (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  setTheme(savedTheme, false);

  // Recent vehicles
  try {
    const savedRecents = localStorage.getItem("lemonaid-recent");
    if (savedRecents) {
      const parsed = JSON.parse(savedRecents);
      if (Array.isArray(parsed)) {
        state.recentVehicles = parsed.map(sanitizeVehicleSpecs);
      }
    }
  } catch (e) {
    console.error("Failed to load recents from localStorage", e);
  }

  // Per-vehicle checklists
  try {
    const savedChecklist = localStorage.getItem("lemonaid-checklist");
    if (savedChecklist) {
      const parsed = JSON.parse(savedChecklist);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        state.checklistsByVehicle = parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load checklist", e);
  }

  // Notes
  try {
    const savedNotes = localStorage.getItem("lemonaid-notes");
    if (savedNotes) {
      const parsed = JSON.parse(savedNotes);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        state.notes = parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load notes", e);
  }
}

function sanitizeVehicleSpecs(vehicle) {
  if (!vehicle || typeof vehicle !== "object") return vehicle;
  if (!vehicle.vin) {
    return {
      ...vehicle,
      trim: "",
      bodyClass: "",
      engineDisplacement: "",
      engineConfig: "",
      fuelType: "",
      driveType: "",
      plantCountry: "",
      plantCity: ""
    };
  }
  const plainError = vehicle.errorCode && vehicle.errorCode !== "0"
    ? formatVinDecodeNotice(vehicle.errorCode, vehicle.errorText)
    : null;
  return {
    ...vehicle,
    bodyClass: vehicle.bodyClass === "Not specified" ? "" : (vehicle.bodyClass || ""),
    driveType: vehicle.driveType === "Not specified" ? "" : (vehicle.driveType || ""),
    plantCountry: formatPlaceName(vehicle.plantCountry || ""),
    plantCity: formatPlaceName(vehicle.plantCity || ""),
    errorText: plainError
  };
}

function saveRecentVehicles() {
  try {
    localStorage.setItem("lemonaid-recent", JSON.stringify(state.recentVehicles));
  } catch (e) {
    console.error("Failed to save recents", e);
  }
}

function getChecklistKey(vehicle) {
  return getVehicleNoteKey(vehicle, "checklist");
}

function loadChecklistForVehicle(vehicle) {
  if (!vehicle) {
    state.checklist = new Set();
    return;
  }
  const key = getChecklistKey(vehicle);
  const saved = state.checklistsByVehicle[key];
  state.checklist = new Set(Array.isArray(saved) ? saved : []);
}

function saveChecklist() {
  if (state.vehicle) {
    const key = getChecklistKey(state.vehicle);
    state.checklistsByVehicle[key] = Array.from(state.checklist);
  }
  try {
    localStorage.setItem("lemonaid-checklist", JSON.stringify(state.checklistsByVehicle));
  } catch (e) {
    console.error("Failed to save checklist", e);
  }
}

function saveNotes() {
  try {
    localStorage.setItem("lemonaid-notes", JSON.stringify(state.notes));
  } catch (e) {
    console.error("Failed to save notes", e);
  }
}

// Key notes per vehicle by year, make, model, and area
function getVehicleNoteKey(vehicle, areaKey) {
  if (!vehicle) return String(areaKey || "general");
  const y = (vehicle.year || "").trim().toLowerCase();
  const m = (vehicle.make || "").trim().toLowerCase();
  const md = (vehicle.model || "").trim().toLowerCase();
  const a = (areaKey || "").trim().toLowerCase();
  return `${y}_${m}_${md}_${a}`;
}

function getNoteForArea(vehicle, areaKey) {
  const key = getVehicleNoteKey(vehicle, areaKey);
  return state.notes[key] || "";
}

function setNoteForArea(vehicle, areaKey, value) {
  const key = getVehicleNoteKey(vehicle, areaKey);
  state.notes[key] = value;
  saveNotes();
}

function setTheme(theme, save = true) {
  state.theme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  if (save) {
    try {
      localStorage.setItem("lemonaid-theme", theme);
    } catch (e) {}
  }
  updateThemeIcon();
}

function updateThemeIcon() {
  const btn = document.getElementById("theme-toggle-btn");
  if (!btn) return;
  if (state.theme === "dark") {
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    `;
    btn.setAttribute("aria-label", "Switch to light theme");
  } else {
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    `;
    btn.setAttribute("aria-label", "Switch to dark theme");
  }
}

// ==========================================
// 4. API Calls with Timeout
// ==========================================

async function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) {
      // NHTSA recalls/complaints endpoints return HTTP 400 with {"count":0,"results":[]} when 0 rows match
      if (res.status === 400) {
        try {
          const errJson = await res.json();
          if (errJson && (Array.isArray(errJson.results) || Array.isArray(errJson.Results))) {
            return errJson;
          }
        } catch {}
      }
      const httpErr = new Error(`HTTP error ${res.status}`);
      httpErr.isNetworkError = true;
      httpErr.status = res.status;
      throw httpErr;
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      const timeoutErr = new Error("Couldn't reach NHTSA. Check your connection and try again.");
      timeoutErr.isNetworkError = true;
      throw timeoutErr;
    }
    if (err.isNetworkError || err instanceof TypeError || /failed to fetch|network|load failed/i.test(err.message || "")) {
      err.isNetworkError = true;
    }
    throw err;
  }
}

// Convert NHTSA vPIC decode error codes into calm plain English
function formatVinDecodeNotice(errorCode, errorText) {
  const codes = String(errorCode || "")
    .split(",")
    .map(c => c.trim())
    .filter(c => c && c !== "0");

  if (codes.length === 0) return null;

  const messages = [];

  if (codes.includes("1")) {
    messages.push("This VIN may have a typo. Double-check it against the car and title before relying on this report.");
  }

  const plainErrorMap = {
    "2": "This VIN has a check-digit issue. Double-check the characters against the car and title.",
    "3": "One character in this VIN looked unusual and NHTSA had to guess a correction. Double-check it against the car and title.",
    "4": "Some characters in this VIN appear incorrect. Double-check it against the car and title.",
    "5": "Several characters in this VIN do not match manufacturer records. Double-check the VIN on the car and title.",
    "6": "This VIN appears incomplete, so some vehicle details could not be decoded.",
    "7": "This manufacturer is not registered with NHTSA for U.S. road vehicles, so details may be limited.",
    "8": "NHTSA does not have full specification details on file for this VIN.",
    "11": "The model-year character in this VIN does not appear valid. Double-check the VIN against the car and title.",
    "12": "Some characters in this VIN are not recognized for this model year. Double-check the VIN against the car and title.",
    "14": "NHTSA could not decode every character of this VIN from manufacturer records, so some details may be missing.",
    "400": "This VIN contains invalid characters. Double-check it against the car and title."
  };

  codes.forEach(code => {
    if (code === "1") return;
    if (plainErrorMap[code] && !messages.includes(plainErrorMap[code])) {
      messages.push(plainErrorMap[code]);
    }
  });

  if (messages.length === 0) {
    const cleaned = String(errorText || "")
      .split(";")
      .map(part => part.replace(/^\s*\d+\s*-\s*/, "").trim())
      .filter(Boolean)
      .join(" ");
    messages.push(cleaned || "NHTSA reported an issue decoding this VIN. Double-check it against the car and title.");
  }

  return messages.join(" ");
}

// Load car makes from NHTSA vPIC
async function loadMakesList() {
  try {
    const url = "https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json";
    const data = await fetchWithTimeout(url, {}, 8000);
    if (data && data.Results && Array.isArray(data.Results)) {
      const makesSet = new Set(state.allMakes);
      data.Results.forEach(r => {
        if (r.MakeName && r.MakeName.trim()) {
          makesSet.add(capitalizeWords(r.MakeName.trim()));
        }
      });
      state.allMakes = Array.from(makesSet).sort((a, b) => a.localeCompare(b));
      // Re-populate dropdown if rendered on home page
      updateMakeDropdownOptions();
    }
  } catch (err) {
    // Keep popular defaults if API call fails
    console.warn("Using default car makes list:", err.message);
  }
}

// Load models for make & year from NHTSA vPIC
async function loadModelsForMakeYear(make, year) {
  if (!make || !year) return [];
  state.loadingModels = true;
  state.modelsLoadError = false;
  updateModelDropdownState();
  try {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${encodeURIComponent(year)}?format=json`;
    const data = await fetchWithTimeout(url);
    state.loadingModels = false;
    state.modelsLoadError = false;
    if (data && data.Results && Array.isArray(data.Results)) {
      const modelSet = new Set();
      data.Results.forEach(r => {
        if (r.Model_Name && r.Model_Name.trim()) {
          modelSet.add(r.Model_Name.trim());
        }
      });
      state.dropdownModels = Array.from(modelSet).sort((a, b) => a.localeCompare(b));
    } else {
      state.dropdownModels = [];
    }
  } catch (err) {
    state.loadingModels = false;
    state.modelsLoadError = true;
    state.dropdownModels = [];
    console.warn("Failed to load models for make/year:", err.message || err);
  }
  updateModelDropdownOptions();
}

// Decode VIN with NHTSA vPIC
async function decodeVin(vin) {
  const cleanVin = vin.trim().toUpperCase();
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(cleanVin)}?format=json`;
  const data = await fetchWithTimeout(url);
  
  if (!data || !data.Results || data.Results.length === 0) {
    throw new Error("No vehicle information returned for this VIN.");
  }
  
  const r = data.Results[0];
  const errorCode = r.ErrorCode || "0";
  const errorText = r.ErrorText || "";
  const plainDecodeNotice = formatVinDecodeNotice(errorCode, errorText);
  
  const engConf = (r.EngineConfiguration || "").trim();
  const engCyl = (r.EngineCylinders || "").trim();
  let engineConfig = "";
  if (engConf && engCyl) {
    engineConfig = `${engConf} (${engCyl} cyl)`;
  } else if (engConf) {
    engineConfig = engConf;
  } else if (engCyl) {
    engineConfig = `${engCyl} cylinders`;
  }

  // Create standardized vehicle object (leave blank fields empty; never guess)
  const vehicle = {
    vin: cleanVin,
    year: (r.ModelYear || "").trim(),
    make: capitalizeWords((r.Make || "").trim()),
    model: (r.Model || "").trim(),
    trim: (r.Trim || "").trim(),
    bodyClass: (r.BodyClass || "").trim(),
    engineDisplacement: r.DisplacementL ? `${String(r.DisplacementL).trim()}L` : "",
    engineConfig: engineConfig,
    fuelType: (r.FuelTypePrimary || "").trim(),
    driveType: (r.DriveType || "").trim(),
    plantCountry: formatPlaceName((r.PlantCountry || "").trim()),
    plantCity: formatPlaceName((r.PlantCity || "").trim()),
    errorCode: errorCode,
    errorText: plainDecodeNotice
  };

  if (!vehicle.year && !vehicle.make && !vehicle.model) {
    throw new Error(plainDecodeNotice || "Could not decode vehicle details from this VIN. Double-check it against the car and title.");
  }

  return vehicle;
}

// ==========================================
// 5. Recall & Complaints Matching Engine
// ==========================================

/**
 * Checks recalls and owner complaints for the given vehicle.
 * 1. Query recallsByVehicle and complaintsByVehicle in parallel with the vehicle's own model name.
 * 2. If either returns results (> 0), show them and treat the model name as recognized.
 * 3. Only if BOTH return 0, consult products/vehicle/models?issueType=r:
 *    - If the name is in the recall model list, show a genuine "0 recalls on file".
 *    - If not, show the naming-mismatch warning and model picker ("Choose a model…" default).
 */
let currentRecallsRequestId = 0;

function formatNhtsaTimestamp() {
  return new Date().toLocaleString([], {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

async function fetchNhtsaModelsList(year, make, issueType = "r") {
  const modelsUrl = `https://api.nhtsa.gov/products/vehicle/models?modelYear=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}&issueType=${encodeURIComponent(issueType)}`;
  const data = await fetchWithTimeout(modelsUrl);
  const rawList = (data && (data.results || data.Results)) || [];
  return [...new Set(rawList.map(item => {
    if (typeof item === "string") return item.trim();
    return (item.model || item.Model || item.modelName || item.ModelName || "").trim();
  }).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

async function fetchNhtsaRecallModels(year, make) {
  return fetchNhtsaModelsList(year, make, "r");
}

// When complaintsByVehicle returns 0, query likely model-name variants in parallel
async function resolveZeroComplaintsWithVariants(vehicle, queryModel, existingRecallModels = []) {
  const year = (vehicle.year || "").trim();
  const make = (vehicle.make || "").trim();

  const [cModelsOutcome, rModelsOutcome] = await Promise.allSettled([
    fetchNhtsaModelsList(year, make, "c"),
    existingRecallModels.length > 0
      ? Promise.resolve(existingRecallModels)
      : fetchNhtsaModelsList(year, make, "r")
  ]);

  const complaintModels = cModelsOutcome.status === "fulfilled" ? cModelsOutcome.value : [];
  const recallModels = rModelsOutcome.status === "fulfilled" ? rModelsOutcome.value : [];
  const recallModelsSucceeded = rModelsOutcome.status === "fulfilled";

  const allListedModels = [...new Set([...complaintModels, ...recallModels])];
  const queryLower = queryModel.toLowerCase();

  // Only confirm exact 0 complaints if the exact model name is present in NHTSA's own model list
  const exactConfirmed = allListedModels.some(m => m.trim().toLowerCase() === queryLower);

  // Build candidate variant list: listed names starting with queryModel + common duty suffixes
  const seenLower = new Set([queryLower]);
  const candidateVariants = [];

  allListedModels.forEach(m => {
    const trimmed = m.trim();
    const lower = trimmed.toLowerCase();
    if (lower.startsWith(queryLower) && !seenLower.has(lower)) {
      seenLower.add(lower);
      candidateVariants.push(trimmed);
    }
  });

  [" 1500", " 2500", " 3500", " HD"].forEach(suffix => {
    const candidate = `${queryModel}${suffix}`;
    const lower = candidate.toLowerCase();
    if (!seenLower.has(lower)) {
      seenLower.add(lower);
      candidateVariants.push(candidate);
    }
  });

  // Query all candidate variants in parallel
  const variantOutcomes = await Promise.allSettled(
    candidateVariants.map(async (variantName) => {
      const url = `https://api.nhtsa.gov/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(variantName)}&modelYear=${encodeURIComponent(year)}`;
      const data = await fetchWithTimeout(url);
      const parsed = parseComplaintsResponse(data);
      return {
        model: variantName,
        totalComplaints: parsed.totalCount,
        topProblemAreas: parsed.topProblemAreas
      };
    })
  );

  const variantResults = variantOutcomes
    .filter(o => o.status === "fulfilled" && o.value && o.value.totalComplaints > 0)
    .map(o => o.value)
    .sort((a, b) => (b.totalComplaints - a.totalComplaints) || a.model.localeCompare(b.model));

  return {
    variantResults,
    exactConfirmed,
    recallModels,
    recallModelsSucceeded
  };
}

function selectComplaintVariant(modelName) {
  const match = (state.complaintsState.variantResults || []).find(v => v.model === modelName);
  if (!match) return;
  state.complaintsState.selectedModel = match.model;
  state.complaintsState.matchedVariantModel = match.model;
  state.complaintsState.totalComplaints = match.totalComplaints;
  state.complaintsState.topProblemAreas = match.topProblemAreas;
  renderActiveView();
}

function renderComplaintVariantBarHtml(selectId) {
  const matched = state.complaintsState.matchedVariantModel;
  const variants = state.complaintsState.variantResults || [];
  if (!matched) return "";

  return `
    <div class="alert alert-info" style="padding: 10px 12px; margin-bottom: 12px; font-size: 13px;">
      <span class="alert-icon" aria-hidden="true" style="font-size: 16px;">ℹ️</span>
      <div class="alert-content" style="width: 100%; display: flex; flex-direction: column; gap: 6px;">
        <div>
          <strong>Complaints filed under ${escapeHtml(matched)}</strong>
          <span style="color: var(--text-secondary);">(${state.complaintsState.totalComplaints.toLocaleString()} complaint${state.complaintsState.totalComplaints === 1 ? "" : "s"})</span>
        </div>
        ${variants.length > 1 ? `
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <label for="${escapeHtml(selectId)}" class="form-label" style="font-size: 12px; margin: 0;">Switch variant:</label>
            <select id="${escapeHtml(selectId)}" class="form-select complaint-variant-select" style="font-size: 12px; padding: 6px 8px; min-height: 36px; width: auto; max-width: 100%;">
              ${variants.map(vr => `
                <option value="${escapeHtml(vr.model)}" ${vr.model === matched ? "selected" : ""}>
                  ${escapeHtml(vr.model)} (${vr.totalComplaints.toLocaleString()})
                </option>
              `).join("")}
            </select>
          </div>
        ` : ""}
      </div>
    </div>
  `;
}

function parseComplaintsResponse(data) {
  const rawList = (data && (data.results || data.Results)) || [];
  const totalCount = (data && typeof data.count === "number") ? data.count : rawList.length;

  const groups = {};
  rawList.forEach(c => {
    const rawComps = (c.components || "UNKNOWN OR OTHER").split(",").map(s => s.trim()).filter(Boolean);
    const compsInThisComplaint = new Set();

    rawComps.forEach(rc => {
      compsInThisComplaint.add(getComplaintCategory(rc));
    });

    if (compsInThisComplaint.size > 1 && compsInThisComplaint.has("Other Miscellaneous Components")) {
      compsInThisComplaint.delete("Other Miscellaneous Components");
    }

    compsInThisComplaint.forEach(catName => {
      if (!groups[catName]) {
        const guide = COMPLAINT_COMPONENT_GUIDE[catName] || {
          title: catName,
          icon: "🔍",
          summary: "Owner reported issues for this component.",
          whatToLookFor: `Check the ${catName.toLowerCase()} carefully during your test drive. Notice warning lights, strange noises, or erratic behavior.`
        };
        groups[catName] = {
          category: catName,
          key: catName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          title: guide.title,
          icon: guide.icon,
          summary: guide.summary,
          whatToLookFor: guide.whatToLookFor,
          count: 0,
          crashes: 0,
          fires: 0,
          injuries: 0
        };
      }
      groups[catName].count++;
      if (c.crash === true || c.crash === "true" || c.crash === 1) groups[catName].crashes++;
      if (c.fire === true || c.fire === "true" || c.fire === 1) groups[catName].fires++;
      const numInj = Number(c.numberOfInjuries);
      if (numInj > 0) groups[catName].injuries += numInj;
    });
  });

  const topProblemAreas = Object.values(groups)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { totalCount, topProblemAreas };
}

async function loadRecallsForVehicle(vehicle, manualModelChoice = null) {
  if (!vehicle || !vehicle.year || !vehicle.make) {
    state.recallsState = {
      ...createEmptyRecallsState(false),
      error: "Year and make are required to check NHTSA safety recalls."
    };
    state.complaintsState = {
      ...createEmptyComplaintsState(false),
      error: "Year and make are required to check NHTSA owner complaints."
    };
    renderActiveView();
    return;
  }

  const year = vehicle.year.trim();
  const make = vehicle.make.trim();
  const queryModel = (manualModelChoice || vehicle.model || "").trim();

  if (!queryModel) {
    state.recallsState = {
      ...createEmptyRecallsState(false),
      error: "Vehicle model name is missing, so safety recalls could not be checked."
    };
    state.complaintsState = {
      ...createEmptyComplaintsState(false),
      error: "Vehicle model name is missing, so owner complaints could not be checked."
    };
    renderActiveView();
    return;
  }

  const requestId = ++currentRecallsRequestId;
  const complaintsRequestId = ++currentComplaintsRequestId;
  const targetVehicle = vehicle;

  // Preserve recall model list when re-querying a manual model choice for the same vehicle
  const existingModels = manualModelChoice ? (state.recallsState.nhtsaRecallModels || []) : [];

  state.recallsState = {
    ...createEmptyRecallsState(true),
    nhtsaRecallModels: existingModels,
    selectedNhtsaModel: queryModel
  };
  state.complaintsState = {
    ...createEmptyComplaintsState(true),
    selectedModel: queryModel
  };
  renderActiveView();

  const recallsUrl = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(queryModel)}&modelYear=${encodeURIComponent(year)}`;
  const complaintsUrl = `https://api.nhtsa.gov/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(queryModel)}&modelYear=${encodeURIComponent(year)}`;

  // Step 1: Query recallsByVehicle and complaintsByVehicle in parallel with the vehicle's own model name
  const [recallsOutcome, complaintsOutcome] = await Promise.allSettled([
    fetchWithTimeout(recallsUrl),
    fetchWithTimeout(complaintsUrl)
  ]);

  if (requestId !== currentRecallsRequestId || state.vehicle !== targetVehicle) {
    return;
  }

  const nowStr = formatNhtsaTimestamp();

  // Evaluate direct complaints outcome
  let directComplaintsCount = 0;
  let complaintsSucceeded = false;
  let needComplaintVariants = false;

  if (complaintsRequestId === currentComplaintsRequestId) {
    if (complaintsOutcome.status === "fulfilled") {
      const parsed = parseComplaintsResponse(complaintsOutcome.value);
      directComplaintsCount = parsed.totalCount;
      complaintsSucceeded = true;
      if (parsed.totalCount > 0) {
        state.complaintsState = {
          loading: false,
          loaded: true,
          error: null,
          totalComplaints: parsed.totalCount,
          topProblemAreas: parsed.topProblemAreas,
          selectedModel: queryModel,
          matchedVariantModel: null,
          variantResults: [],
          modelConfirmedInNhtsa: true,
          fetchTimestamp: nowStr
        };
      } else {
        // Direct complaints returned 0 -> keep loading while checking likely variants in parallel
        needComplaintVariants = true;
      }
    } else {
      const err = complaintsOutcome.reason;
      state.complaintsState = {
        ...createEmptyComplaintsState(false),
        selectedModel: queryModel,
        error: (err && err.isNetworkError)
          ? "Couldn't reach NHTSA. Check your connection and try again."
          : ((err && err.message) || "Failed to load owner complaints from NHTSA. Please try again.")
      };
    }
  }

  // Evaluate direct recalls outcome
  let recallsResolved = false;
  if (recallsOutcome.status === "rejected") {
    const err = recallsOutcome.reason;
    state.recallsState.loading = false;
    state.recallsState.recalls = null;
    state.recallsState.error = (err && err.isNetworkError)
      ? "Couldn't reach NHTSA. Check your connection and try again."
      : ((err && err.message) || "Failed to load safety recalls from NHTSA. Please try again.");
    recallsResolved = true;
  } else {
    const recalls = (recallsOutcome.value && (recallsOutcome.value.results || recallsOutcome.value.Results)) || [];
    if (recalls.length > 0 || (complaintsSucceeded && directComplaintsCount > 0)) {
      state.recallsState.loading = false;
      state.recallsState.error = null;
      state.recallsState.dataUnavailable = false;
      state.recallsState.modelSelectionNeeded = false;
      state.recallsState.modelRecognizedByNhtsa = true;
      state.recallsState.selectedNhtsaModel = queryModel;
      state.recallsState.recalls = recalls;
      state.recallsState.fetchTimestamp = nowStr;
      recallsResolved = true;
    }
  }

  // Render immediately if recalls finished while complaint variants are still resolving
  if (recallsResolved && !needComplaintVariants) {
    renderActiveView();
    return;
  }
  if (recallsResolved && needComplaintVariants) {
    renderActiveView();
  }

  // Step 2 (if needed): Resolve 0 complaints via likely variants, and/or confirm 0 recalls via model list
  let recallModels = existingModels;
  let recallModelsSucceeded = existingModels.length > 0;

  if (needComplaintVariants) {
    const variantData = await resolveZeroComplaintsWithVariants(targetVehicle, queryModel, existingModels);
    if (state.vehicle !== targetVehicle) return;

    if (variantData.recallModelsSucceeded && recallModels.length === 0) {
      recallModels = variantData.recallModels;
      recallModelsSucceeded = true;
      state.recallsState.nhtsaRecallModels = recallModels;
    }

    if (complaintsRequestId === currentComplaintsRequestId) {
      if (variantData.variantResults.length > 0) {
        const best = variantData.variantResults[0];
        state.complaintsState = {
          loading: false,
          loaded: true,
          error: null,
          totalComplaints: best.totalComplaints,
          topProblemAreas: best.topProblemAreas,
          selectedModel: best.model,
          matchedVariantModel: best.model,
          variantResults: variantData.variantResults,
          modelConfirmedInNhtsa: true,
          fetchTimestamp: formatNhtsaTimestamp()
        };
      } else {
        state.complaintsState = {
          loading: false,
          loaded: true,
          error: null,
          totalComplaints: 0,
          topProblemAreas: [],
          selectedModel: queryModel,
          matchedVariantModel: null,
          variantResults: [],
          modelConfirmedInNhtsa: variantData.exactConfirmed,
          fetchTimestamp: formatNhtsaTimestamp()
        };
      }
    }
  }

  if (recallsResolved) {
    renderActiveView();
    return;
  }

  // Step 3: Both direct recalls and direct complaints returned 0 -> consult NHTSA's recall model list
  if (requestId !== currentRecallsRequestId || state.vehicle !== targetVehicle) {
    return;
  }

  if (!recallModelsSucceeded) {
    try {
      recallModels = await fetchNhtsaRecallModels(year, make);
      recallModelsSucceeded = true;
    } catch (err) {
      if (requestId !== currentRecallsRequestId || state.vehicle !== targetVehicle) return;
      state.recallsState.loading = false;
      state.recallsState.error = null;
      state.recallsState.dataUnavailable = false;
      state.recallsState.modelSelectionNeeded = false;
      state.recallsState.modelRecognizedByNhtsa = false;
      state.recallsState.selectedNhtsaModel = queryModel;
      state.recallsState.recalls = [];
      state.recallsState.fetchTimestamp = nowStr;
      renderActiveView();
      return;
    }

    if (requestId !== currentRecallsRequestId || state.vehicle !== targetVehicle) {
      return;
    }
    state.recallsState.nhtsaRecallModels = recallModels;
  }

  const normQuery = normalizeModelString(queryModel);
  const matchedInList = recallModels.some(m =>
    m.trim().toLowerCase() === queryModel.toLowerCase() ||
    normalizeModelString(m) === normQuery
  );

  state.recallsState.loading = false;
  state.recallsState.error = null;
  state.recallsState.dataUnavailable = false;
  state.recallsState.modelSelectionNeeded = false;
  state.recallsState.modelRecognizedByNhtsa = matchedInList;
  state.recallsState.selectedNhtsaModel = queryModel;
  state.recallsState.recalls = [];
  state.recallsState.fetchTimestamp = nowStr;
  renderActiveView();
}

async function promptModelSelection() {
  if (!state.vehicle) return;
  const targetVehicle = state.vehicle;
  state.recallsState.modelSelectionNeeded = true;
  state.recallsState.recalls = null;
  if (!state.recallsState.nhtsaRecallModels || state.recallsState.nhtsaRecallModels.length === 0) {
    state.recallsState.loading = true;
    renderActiveView();
    try {
      const models = await fetchNhtsaRecallModels(targetVehicle.year.trim(), targetVehicle.make.trim());
      if (state.vehicle !== targetVehicle) return;
      state.recallsState.nhtsaRecallModels = models;
    } catch {}
    if (state.vehicle !== targetVehicle) return;
    state.recallsState.loading = false;
  }
  renderActiveView();
}

// ==========================================
// 6. Owner Complaints & Problem Areas Engine
// ==========================================

let currentComplaintsRequestId = 0;

async function loadComplaintsForVehicle(vehicle, manualModelChoice = null) {
  if (!vehicle || !vehicle.year || !vehicle.make) {
    state.complaintsState = {
      ...createEmptyComplaintsState(false),
      error: "Year and make are required to check NHTSA owner complaints."
    };
    renderActiveView();
    return;
  }

  const queryModel = (manualModelChoice || state.recallsState.selectedNhtsaModel || vehicle.model || "").trim();
  if (!queryModel) {
    state.complaintsState = {
      ...createEmptyComplaintsState(false),
      error: "Vehicle model name is missing, so owner complaints could not be checked."
    };
    renderActiveView();
    return;
  }

  const year = (vehicle.year || "").trim();
  const make = (vehicle.make || "").trim();

  // Increment request ID and capture vehicle to ignore outdated responses
  const requestId = ++currentComplaintsRequestId;
  const targetVehicle = vehicle;

  state.complaintsState = {
    ...createEmptyComplaintsState(true),
    selectedModel: queryModel
  };
  renderActiveView();

  try {
    const url = `https://api.nhtsa.gov/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(queryModel)}&modelYear=${encodeURIComponent(year)}`;
    const data = await fetchWithTimeout(url);

    // Drop outdated responses or if active vehicle changed
    if (requestId !== currentComplaintsRequestId || state.vehicle !== targetVehicle) {
      return;
    }

    const parsed = parseComplaintsResponse(data);

    if (parsed.totalCount > 0) {
      state.complaintsState.loading = false;
      state.complaintsState.loaded = true;
      state.complaintsState.error = null;
      state.complaintsState.totalComplaints = parsed.totalCount;
      state.complaintsState.topProblemAreas = parsed.topProblemAreas;
      state.complaintsState.matchedVariantModel = null;
      state.complaintsState.variantResults = [];
      state.complaintsState.modelConfirmedInNhtsa = true;
      state.complaintsState.fetchTimestamp = formatNhtsaTimestamp();
    } else {
      const variantData = await resolveZeroComplaintsWithVariants(
        targetVehicle,
        queryModel,
        state.recallsState.nhtsaRecallModels || []
      );
      if (requestId !== currentComplaintsRequestId || state.vehicle !== targetVehicle) {
        return;
      }
      if (variantData.variantResults.length > 0) {
        const best = variantData.variantResults[0];
        state.complaintsState = {
          loading: false,
          loaded: true,
          error: null,
          totalComplaints: best.totalComplaints,
          topProblemAreas: best.topProblemAreas,
          selectedModel: best.model,
          matchedVariantModel: best.model,
          variantResults: variantData.variantResults,
          modelConfirmedInNhtsa: true,
          fetchTimestamp: formatNhtsaTimestamp()
        };
      } else {
        state.complaintsState = {
          loading: false,
          loaded: true,
          error: null,
          totalComplaints: 0,
          topProblemAreas: [],
          selectedModel: queryModel,
          matchedVariantModel: null,
          variantResults: [],
          modelConfirmedInNhtsa: variantData.exactConfirmed,
          fetchTimestamp: formatNhtsaTimestamp()
        };
      }
    }
  } catch (err) {
    if (requestId !== currentComplaintsRequestId || state.vehicle !== targetVehicle) {
      return;
    }

    state.complaintsState.loading = false;
    state.complaintsState.loaded = false;
    state.complaintsState.topProblemAreas = null;
    state.complaintsState.totalComplaints = null;
    state.complaintsState.error = (err && err.isNetworkError)
      ? "Couldn't reach NHTSA. Check your connection and try again."
      : ((err && err.message) || "Failed to load owner complaints from NHTSA. Please try again.");
  }

  renderActiveView();
}

function retryComplaints() {
  if (!state.vehicle) return;
  const modelToUse = state.complaintsState.selectedModel || state.recallsState.selectedNhtsaModel || state.vehicle.model;
  if (modelToUse) {
    loadComplaintsForVehicle(state.vehicle, modelToUse);
  }
}

function renderSafetyFlagsHtml(area) {
  const flags = [];
  if (area.crashes > 0) {
    flags.push(`
      <span class="status-pill serious" title="${area.crashes} reported crash(es)">
        <span aria-hidden="true">💥</span>
        <span>${area.crashes} crash${area.crashes === 1 ? "" : "es"} reported</span>
      </span>
    `);
  }
  if (area.fires > 0) {
    flags.push(`
      <span class="status-pill serious" title="${area.fires} reported fire(s)">
        <span aria-hidden="true">🔥</span>
        <span>${area.fires} fire${area.fires === 1 ? "" : "s"} reported</span>
      </span>
    `);
  }
  if (area.injuries > 0) {
    flags.push(`
      <span class="status-pill warning" title="${area.injuries} reported injury/injuries">
        <span aria-hidden="true">🩹</span>
        <span>${area.injuries} injur${area.injuries === 1 ? "y" : "ies"} reported</span>
      </span>
    `);
  }
  if (flags.length === 0) {
    flags.push(`
      <span class="status-pill good" title="No crashes, fires, or injuries reported in these complaints">
        <span aria-hidden="true">✔</span>
        <span>No crashes, fires, or injuries reported</span>
      </span>
    `);
  }
  return flags.join("");
}


function normalizeModelString(str) {
  return (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Plain-English translation for recall cards
function buildCalmRecallTitle(component) {
  const compUpper = (component || "").toUpperCase();
  for (const item of COMPONENT_TRANSLATIONS) {
    if (compUpper.includes(item.key)) {
      return item.title;
    }
  }
  const primary = (component || "Vehicle safety system")
    .split(":")[0]
    .replace(/[,/_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!primary) return "Safety component recall";
  const sentence = primary.charAt(0).toUpperCase() + primary.slice(1).toLowerCase();
  return /recall$/i.test(sentence) ? sentence : `${sentence} recall`;
}

function translateRecall(recall) {
  const component = (recall.Component || "Vehicle Safety System").trim();
  const summary = (recall.Summary || "").trim();
  const rawConsequence = (recall.Consequence || recall.Conequence || "").trim();
  const rawRemedy = (recall.Remedy || "").trim();
  const campaignNumber = recall.NHTSACampaignNumber || "NHTSA Campaign";
  const reportDate = recall.ReportReceivedDate || "";
  const notes = recall.Notes || "";
  const isTrueFlag = (val) => val === true || String(val).toLowerCase() === "true";
  const parkIt = isTrueFlag(recall.parkIt);
  const parkOutSide = isTrueFlag(recall.parkOutSide);

  // Calm plain-English title built from the component name
  const plainTitle = buildCalmRecallTitle(component);

  // Keep NHTSA's own consequence text as the risk (fall back to summary if blank)
  const plainRisk = rawConsequence || summary || "See NHTSA's original recall wording below for risk details.";

  // Plain-English Remedy
  let plainRemedy = rawRemedy;
  if (!plainRemedy) {
    plainRemedy = "Authorized franchise dealerships will inspect and repair the defective components free of charge.";
  } else if (!plainRemedy.toLowerCase().includes("free of charge") && !plainRemedy.toLowerCase().includes("free")) {
    plainRemedy += " (By federal law, safety recall repairs are provided free of charge by authorized franchise dealerships.)";
  }

  // Only High Risk when NHTSA sets parkIt or parkOutSide, or the consequence mentions fire
  const isHighSeverity = parkIt || parkOutSide || /\bfire(s)?\b/i.test(rawConsequence);

  return {
    campaignNumber,
    component,
    reportDate,
    plainTitle,
    plainRisk,
    plainRemedy,
    isHighSeverity,
    parkIt,
    parkOutSide,
    rawSummary: summary,
    rawConsequence: rawConsequence,
    rawRemedy: rawRemedy,
    rawNotes: notes
  };
}

// Plain-English drive type label (e.g., 4x2 -> Two-wheel drive (4x2))
function formatDriveType(rawDrive) {
  const raw = (rawDrive || "").trim();
  if (!raw) return "";
  const v = raw.toLowerCase();
  if (v === "4x2" || v === "2wd" || v.includes("4x2")) {
    return "Two-wheel drive (4x2)";
  }
  if (v.includes("fwd") || v.includes("front-wheel") || v.includes("front wheel")) {
    return "Front-wheel drive (FWD)";
  }
  if (v.includes("rwd") || v.includes("rear-wheel") || v.includes("rear wheel")) {
    return "Rear-wheel drive (RWD)";
  }
  if (v.includes("awd") || v.includes("all-wheel") || v.includes("all wheel")) {
    return "All-wheel drive (AWD)";
  }
  if (v.includes("4wd") || v.includes("4x4") || v.includes("4-wheel") || v.includes("four-wheel")) {
    return "Four-wheel drive (4WD)";
  }
  return raw;
}

// Normal capitalization for assembly plant city/country (preserves USA/UK acronyms)
function formatPlaceName(str) {
  if (!str) return "";
  const title = String(str)
    .trim()
    .toLowerCase()
    .replace(/(^|[\s\-\/(])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
  return title
    .replace(/\bUsa\b/g, "USA")
    .replace(/\bUk\b/g, "UK")
    .replace(/\bU\.s\.a\.\b/gi, "U.S.A.")
    .replace(/\bU\.s\.\b/gi, "U.S.");
}

// Helper: One-line plain-English explanation for vehicle specs
function getSpecExplanation(label, value) {
  const v = (value || "").toLowerCase();
  switch (label) {
    case "Year":
      return "The model year designated by the vehicle manufacturer.";
    case "Make":
      return "The automobile brand and manufacturing company.";
    case "Model":
      return "The specific product line produced by the brand.";
    case "Trim":
      return "The equipment, interior styling, and option package level.";
    case "Body style":
      if (!v) return "Vehicle body classification from NHTSA's VIN decoder.";
      return v.includes("suv") ? "Sport Utility Vehicle offering higher ground clearance and cargo space."
        : v.includes("sedan") ? "Traditional 4-door passenger car with a separate trunk."
        : v.includes("truck") || v.includes("pickup") ? "Light truck with an open rear cargo bed."
        : v.includes("coupe") ? "Two-door passenger vehicle with a sporty profile."
        : v.includes("hatchback") ? "Compact car with an upward-swinging rear door for cargo."
        : "Vehicle body classification reported by NHTSA.";
    case "Engine":
      return "Engine displacement in liters and cylinder configuration.";
    case "Fuel type":
      if (!v) return "Primary fuel or powertrain type from NHTSA's VIN decoder.";
      return v.includes("hybrid") ? "Uses both a gasoline engine and an electric motor to save fuel."
        : v.includes("electric") ? "100% battery-electric vehicle with zero tailpipe emissions."
        : v.includes("diesel") ? "Runs on diesel fuel for strong towing torque and highway efficiency."
        : v.includes("gasoline") ? "Runs on standard unleaded pump gasoline."
        : "Primary fuel type reported by NHTSA.";
    case "Drive type":
      if (!v) return "How engine power is sent to the wheels.";
      return (v.includes("4x2") || v.includes("2wd") || v.includes("two-wheel"))
        ? "Two-wheel drive sends engine power to two wheels (front or rear) for simpler maintenance and better fuel economy."
        : (v.includes("fwd") || v.includes("front"))
        ? "Front-wheel drive sends power to the front wheels for good rain traction and better fuel economy."
        : (v.includes("awd") || v.includes("all"))
        ? "All-wheel drive sends power to all four wheels automatically for extra grip in rain and snow."
        : (v.includes("4wd") || v.includes("4x4") || v.includes("four-wheel"))
        ? "Four-wheel drive powers all four wheels, built for snow, towing, or off-road traction."
        : (v.includes("rwd") || v.includes("rear"))
        ? "Rear-wheel drive sends power to the rear wheels for balanced handling and towing."
        : "How engine power is sent to the wheels.";
    case "Assembly plant":
      return "The factory location where this specific vehicle was assembled.";
    default:
      return "";
  }
}

// ==========================================
// 6. Navigation & Routing
// ==========================================

function navigateTo(pageId) {
  state.currentPage = pageId;
  closeMobileNav();
  updateNavSelection();
  renderActiveView();
  // Scroll to top
  const main = document.getElementById("main-content");
  if (main) main.scrollTop = 0;
}

function updateNavSelection() {
  document.querySelectorAll(".nav-link").forEach(btn => {
    const page = btn.getAttribute("data-page");
    if (page === state.currentPage) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Update checklist remaining badge
  const badge = document.getElementById("nav-checklist-badge");
  if (badge) {
    const remaining = CHECKLIST_ITEMS.length - state.checklist.size;
    badge.textContent = remaining > 0 ? remaining : "✓";
    badge.style.display = remaining === 0 ? "inline-block" : "inline-block";
    badge.setAttribute("aria-label", `${remaining} items remaining`);
  }
}

function closeMobileNav() {
  const drawer = document.getElementById("nav-drawer");
  const backdrop = document.getElementById("nav-backdrop");
  const toggleBtn = document.getElementById("menu-toggle-btn");
  if (drawer) drawer.classList.remove("open");
  if (backdrop) backdrop.classList.remove("open");
  if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
}

function toggleMobileNav() {
  const drawer = document.getElementById("nav-drawer");
  const backdrop = document.getElementById("nav-backdrop");
  const toggleBtn = document.getElementById("menu-toggle-btn");
  const isOpen = drawer && drawer.classList.contains("open");
  if (isOpen) {
    closeMobileNav();
  } else {
    if (drawer) drawer.classList.add("open");
    if (backdrop) backdrop.classList.add("open");
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "true");
  }
}

// ==========================================
// 7. Event Listeners & UI Helpers
// ==========================================

function setupEventListeners() {
  // Mobile Nav Toggle
  const toggleBtn = document.getElementById("menu-toggle-btn");
  if (toggleBtn) toggleBtn.addEventListener("click", toggleMobileNav);

  const backdrop = document.getElementById("nav-backdrop");
  if (backdrop) backdrop.addEventListener("click", closeMobileNav);

  // Home brand logo click
  const brandLink = document.getElementById("brand-home-link");
  if (brandLink) {
    brandLink.addEventListener("click", () => navigateTo("home"));
    brandLink.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        navigateTo("home");
      }
    });
  }

  // Nav Links
  document.querySelectorAll(".nav-link[data-page]").forEach(btn => {
    btn.addEventListener("click", () => {
      const page = btn.getAttribute("data-page");
      navigateTo(page);
    });
  });

  // Theme Toggle
  const themeBtn = document.getElementById("theme-toggle-btn");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const nextTheme = state.theme === "dark" ? "light" : "dark";
      setTheme(nextTheme, true);
      showToast(`Switched to ${nextTheme} theme`);
    });
  }

  // About Dialog
  const aboutBtn = document.getElementById("about-btn");
  const aboutModal = document.getElementById("about-modal");
  const aboutClose = document.getElementById("about-close-btn");
  const aboutGotIt = document.getElementById("about-got-it-btn");

  const openAbout = () => {
    if (aboutModal) {
      aboutModal.removeAttribute("hidden");
      aboutModal.style.display = "grid";
    }
  };

  const closeAbout = () => {
    if (aboutModal) {
      aboutModal.setAttribute("hidden", "");
      aboutModal.style.display = "none";
    }
  };

  if (aboutBtn) aboutBtn.addEventListener("click", openAbout);
  if (aboutClose) aboutClose.addEventListener("click", closeAbout);
  if (aboutGotIt) aboutGotIt.addEventListener("click", closeAbout);
  if (aboutModal) {
    aboutModal.addEventListener("click", (e) => {
      if (e.target === aboutModal) closeAbout();
    });
  }
  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && aboutModal && !aboutModal.hasAttribute("hidden") && aboutModal.style.display !== "none") {
      closeAbout();
    }
  });
}

function showToast(message) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3200);
}

function copyToClipboard(text, successMessage) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMessage || "Copied to clipboard!");
    }).catch(() => {
      fallbackCopy(text, successMessage);
    });
  } else {
    fallbackCopy(text, successMessage);
  }
}

function fallbackCopy(text, successMessage) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    showToast(successMessage || "Copied to clipboard!");
  } catch (err) {
    showToast("Copy not supported on this browser.");
  }
  document.body.removeChild(textarea);
}

// ==========================================
// 8. Vehicle Selection Handler
// ==========================================

function selectVehicle(vehicle) {
  const cleanVehicle = sanitizeVehicleSpecs(vehicle);
  state.vehicle = cleanVehicle;

  // Load checklist progress saved for this specific vehicle (starts fresh for new cars)
  loadChecklistForVehicle(cleanVehicle);

  // Reset recalls and complaints state immediately and invalidate any in-flight fetches
  currentRecallsRequestId++;
  currentComplaintsRequestId++;
  state.recallsState = createEmptyRecallsState(true);
  state.complaintsState = createEmptyComplaintsState(true);
  
  // Add to recents
  const label = `${cleanVehicle.year} ${cleanVehicle.make} ${cleanVehicle.model}`;
  state.recentVehicles = state.recentVehicles.filter(v => 
    !(v.year === cleanVehicle.year && v.make === cleanVehicle.make && v.model === cleanVehicle.model)
  );
  state.recentVehicles.unshift({ ...cleanVehicle, label });
  if (state.recentVehicles.length > 5) state.recentVehicles.pop();
  saveRecentVehicles();

  // Navigate to overview first so both recalls and complaints show loading right away
  navigateTo("overview");

  // Trigger recall check (which also loads complaints once matched, or falls back to vehicle.model)
  loadRecallsForVehicle(cleanVehicle);
}

// ==========================================
// 9. View Renderers
// ==========================================

function renderActiveView() {
  const container = document.getElementById("page-container");
  if (!container) return;
  container.innerHTML = "";

  switch (state.currentPage) {
    case "home":
      renderHomePage(container);
      break;
    case "overview":
      renderOverviewPage(container);
      break;
    case "inspect":
      renderInspectPage(container);
      break;
    case "checklist":
      renderChecklistPage(container);
      break;
    case "recalls":
      renderRecallsPage(container);
      break;
    case "seller":
      renderSellerPage(container);
      break;
    default:
      renderHomePage(container);
  }

  updateNavSelection();
}

// ------------------------------------------
// View: Home Page
// ------------------------------------------
function renderHomePage(container) {
  const page = document.createElement("div");
  page.className = "page-container";
  const nextModelYear = new Date().getFullYear() + 1;
  const yearOptions = Array.from({ length: 26 }, (_, i) => nextModelYear - i);
  const defaultYear = yearOptions.includes(2018) ? 2018 : yearOptions[Math.min(5, yearOptions.length - 1)];

  page.innerHTML = `
    <header class="page-header">
      <div class="page-title-group">
        <h1>Know before you buy</h1>
        <p class="page-subtitle">Look up a vehicle, explore safety recalls from NHTSA, and bring a checklist to your test drive.</p>
      </div>
    </header>

    <!-- Main Hero: VIN Search & Dropdown Fallback -->
    <section class="hero-card" aria-labelledby="lookup-heading">
      <div class="hero-content">
        <div>
          <h2 id="lookup-heading" class="card-title" style="font-size: 20px;">Start with the vehicle VIN</h2>
          <p class="card-description">Enter the 17-character VIN found on the vehicle dashboard or title document.</p>
        </div>

        <form id="vin-search-form" class="form-group" novalidate>
          <label for="vin-input" class="form-label">
            Vehicle Identification Number (VIN)
            <span style="font-weight: 400; color: var(--text-secondary); font-size: 12px;">(17 chars, no I, O, or Q)</span>
          </label>
          <div class="form-row">
            <input type="text" id="vin-input" class="form-input vin-input" placeholder="e.g. 1HGCV1F37JA000001" maxlength="17" autocomplete="off" spellcheck="false" required>
            <button type="submit" id="vin-submit-btn" class="btn btn-primary" style="flex-shrink: 0;">
              <span>Look up</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
          <div id="vin-format-hint" class="form-hint" style="min-height: 18px;">0/17 characters</div>
        </form>

        <!-- Sample VIN Buttons -->
        <div class="form-group">
          <span class="form-label" style="font-size: 12px; color: var(--text-secondary);">Or try a public sample VIN:</span>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${SAMPLE_VINS.map(s => `
              <button type="button" class="btn btn-tag sample-vin-btn" data-vin="${s.vin}">
                ${escapeHtml(s.label)}
              </button>
            `).join("")}
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 6px 0;">

        <!-- Dropdown Alternative: Don't have VIN -->
        <details id="no-vin-details" style="font-size: 14px;">
          <summary style="cursor: pointer; font-weight: 600; color: var(--brand-text); padding: 8px 0; min-height: 44px; display: flex; align-items: center;">
            Don't have the VIN yet? Choose year, make, and model
          </summary>
          <form id="dropdown-search-form" style="display: flex; flex-direction: column; gap: 14px; padding-top: 12px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px;">
              <div class="form-group">
                <label for="select-year" class="form-label">Year</label>
                <select id="select-year" class="form-select">
                  ${yearOptions.map(y => `<option value="${y}" ${y === defaultYear ? "selected" : ""}>${y}</option>`).join("")}
                </select>
              </div>

              <div class="form-group">
                <label for="select-make" class="form-label">Make</label>
                <select id="select-make" class="form-select">
                  ${state.allMakes.map(m => `<option value="${m}" ${m.toLowerCase() === "honda" ? "selected" : ""}>${escapeHtml(m)}</option>`).join("")}
                </select>
              </div>

              <div class="form-group">
                <label for="select-model" class="form-label">Model</label>
                <select id="select-model" class="form-select">
                  <option value="">Select model…</option>
                </select>
                <div id="model-dropdown-error" class="form-hint error" style="display: none; align-items: center; gap: 6px; flex-wrap: wrap;"></div>
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end;">
              <button type="submit" id="dropdown-submit-btn" class="btn btn-secondary" style="min-width: 140px;">
                View report
              </button>
            </div>
          </form>
        </details>
      </div>

      <!-- Hero Visual Accent -->
      <div class="hero-art" aria-hidden="true">
        <svg class="hero-car-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M5 17h14a2 2 0 0 0 2-2v-4l-3-6H6L3 11v4a2 2 0 0 0 2 2z"></path>
          <circle cx="7.5" cy="17.5" r="2.5"></circle>
          <circle cx="16.5" cy="17.5" r="2.5"></circle>
        </svg>
        <div class="hero-chip chip-top">
          <span style="color: var(--brand-fill);">🛡️</span>
          <span>Live NHTSA Recalls</span>
        </div>
        <div class="hero-chip chip-bottom">
          <span style="color: var(--brand-fill);">📋</span>
          <span>10-Step Test Drive Checklist</span>
        </div>
      </div>
    </section>

    <!-- Recently Viewed Section -->
    ${state.recentVehicles.length > 0 ? `
      <section class="card" aria-labelledby="recent-heading">
        <div class="card-header">
          <h2 id="recent-heading" class="card-title" style="font-size: 16px;">Recently viewed vehicles</h2>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          ${state.recentVehicles.map((v, i) => `
            <button type="button" class="btn btn-secondary btn-sm recent-vehicle-btn" data-recent-index="${i}">
              🚗 ${escapeHtml(v.year)} ${escapeHtml(v.make)} ${escapeHtml(v.model)}
            </button>
          `).join("")}
        </div>
      </section>
    ` : ""}

    <!-- What Lemonaid Helps You Do Features Grid -->
    <section aria-labelledby="features-heading">
      <h2 id="features-heading" class="card-title" style="margin-bottom: 16px; font-size: 20px;">What Lemonaid helps buyers do</h2>
      <div class="features-grid">
        <div class="card">
          <div class="icon-tile">🔍</div>
          <h3 class="card-title" style="font-size: 16px;">Safety Recall Check</h3>
          <p class="card-description">Live safety recalls from NHTSA, translated into plain-English risks, remedies, and free dealer repair rights.</p>
          <button type="button" class="btn btn-subtle btn-sm" style="align-self: flex-start; padding-left: 0;" onclick="navigateTo('recalls')">
            Check safety recalls →
          </button>
        </div>

        <div class="card">
          <div class="icon-tile">🔧</div>
          <h3 class="card-title" style="font-size: 16px;">Things to check</h3>
          <p class="card-description">Real owner complaints from NHTSA grouped by component to show top problem areas, safety flags, and test drive symptoms.</p>
          <button type="button" class="btn btn-subtle btn-sm" style="align-self: flex-start; padding-left: 0;" onclick="navigateTo('inspect')">
            View inspection points →
          </button>
        </div>

        <div class="card">
          <div class="icon-tile">📝</div>
          <h3 class="card-title" style="font-size: 16px;">Pre-Purchase Checklist</h3>
          <p class="card-description">Interactive 10-point checklist covering title checks, tire wear, fluid leaks, and mechanic inspection advice.</p>
          <button type="button" class="btn btn-subtle btn-sm" style="align-self: flex-start; padding-left: 0;" onclick="navigateTo('checklist')">
            Open checklist →
          </button>
        </div>
      </div>
    </section>
  `;

  container.appendChild(page);
  setupHomePageInteractions(page);
}

function setupHomePageInteractions(page) {
  const vinInput = page.querySelector("#vin-input");
  const vinForm = page.querySelector("#vin-search-form");
  const vinHint = page.querySelector("#vin-format-hint");
  const vinSubmitBtn = page.querySelector("#vin-submit-btn");

  // Real-time VIN format checking
  if (vinInput && vinHint) {
    vinInput.addEventListener("input", () => {
      const val = vinInput.value.toUpperCase().replace(/\s/g, "");
      vinInput.value = val;
      
      const hasIllegalChars = /[IOQ]/.test(val);
      const isComplete = val.length === 17;
      const isValidChars = /^[A-HJ-NPR-Z0-9]*$/.test(val);

      if (hasIllegalChars) {
        vinHint.className = "form-hint error";
        vinHint.textContent = "VINs never contain the letters I, O, or Q (to prevent confusion with 1 and 0).";
      } else if (!isValidChars) {
        vinHint.className = "form-hint error";
        vinHint.textContent = "VINs only contain numbers and capital letters.";
      } else if (isComplete) {
        vinHint.className = "form-hint success";
        vinHint.textContent = "✔ Valid 17-character VIN format. Ready to look up.";
      } else {
        vinHint.className = "form-hint";
        vinHint.textContent = `${val.length}/17 characters`;
      }
    });

    vinForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const vin = vinInput.value.trim().toUpperCase();
      if (vin.length !== 17 || /[IOQ]/.test(vin) || !/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
        vinHint.className = "form-hint error";
        vinHint.textContent = "Please enter a valid 17-character VIN without the letters I, O, or Q.";
        vinInput.focus();
        return;
      }

      vinSubmitBtn.disabled = true;
      vinSubmitBtn.innerHTML = `<span class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></span><span>Decoding…</span>`;

      try {
        const decoded = await decodeVin(vin);
        selectVehicle(decoded);
      } catch (err) {
        vinHint.className = "form-hint error";
        if (err && err.isNetworkError) {
          const netMsg = "Couldn't reach NHTSA. Check your connection and try again.";
          vinHint.textContent = netMsg;
          showToast(netMsg);
        } else {
          const msg = (err && err.message) || "Could not decode this VIN. Double-check it against the car and title.";
          vinHint.textContent = msg;
          showToast(msg);
        }
      } finally {
        vinSubmitBtn.disabled = false;
        vinSubmitBtn.innerHTML = `<span>Look up</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
      }
    });
  }

  // Sample VIN buttons
  page.querySelectorAll(".sample-vin-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const vin = btn.getAttribute("data-vin");
      if (vinInput) {
        vinInput.value = vin;
        vinInput.dispatchEvent(new Event("input"));
      }
      if (vinForm) {
        vinForm.dispatchEvent(new Event("submit"));
      }
    });
  });

  // Recent vehicles buttons
  page.querySelectorAll(".recent-vehicle-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-recent-index"), 10);
      const vehicle = state.recentVehicles[idx];
      if (vehicle) selectVehicle(vehicle);
    });
  });

  // Dropdown make/model handling
  const yearSelect = page.querySelector("#select-year");
  const makeSelect = page.querySelector("#select-make");
  const modelSelect = page.querySelector("#select-model");
  const dropdownForm = page.querySelector("#dropdown-search-form");

  async function refreshModels() {
    if (!yearSelect || !makeSelect || !modelSelect) return;
    const y = yearSelect.value;
    const m = makeSelect.value;
    if (y && m) {
      await loadModelsForMakeYear(m, y);
    }
  }

  if (yearSelect && makeSelect) {
    yearSelect.addEventListener("change", refreshModels);
    makeSelect.addEventListener("change", refreshModels);
    // Initialize models list for default (2018 Honda)
    refreshModels();
  }

  if (dropdownForm) {
    dropdownForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const y = yearSelect.value;
      const m = makeSelect.value;
      const mod = modelSelect.value;
      if (!mod) {
        showToast("Please choose a vehicle model.");
        modelSelect.focus();
        return;
      }

      const vehicle = {
        vin: "",
        year: y,
        make: m,
        model: mod,
        trim: "",
        bodyClass: "",
        engineDisplacement: "",
        engineConfig: "",
        fuelType: "",
        driveType: "",
        plantCountry: "",
        plantCity: "",
        errorCode: "0",
        errorText: null
      };
      selectVehicle(vehicle);
    });
  }
}

function updateMakeDropdownOptions() {
  const select = document.getElementById("select-make");
  if (!select) return;
  const current = select.value;
  select.innerHTML = state.allMakes.map(m => 
    `<option value="${m}" ${m.toLowerCase() === current.toLowerCase() ? "selected" : ""}>${escapeHtml(m)}</option>`
  ).join("");
}

function updateModelDropdownState() {
  const select = document.getElementById("select-model");
  const errEl = document.getElementById("model-dropdown-error");
  if (errEl) {
    errEl.style.display = "none";
    errEl.innerHTML = "";
  }
  if (!select) return;
  if (state.loadingModels) {
    select.innerHTML = `<option value="">Loading models from NHTSA…</option>`;
    select.disabled = true;
  } else {
    select.disabled = false;
  }
}

function updateModelDropdownOptions() {
  const select = document.getElementById("select-model");
  const errEl = document.getElementById("model-dropdown-error");
  if (!select) return;
  select.disabled = false;

  if (state.modelsLoadError) {
    select.innerHTML = `<option value="">Couldn't load models. Try again</option>`;
    if (errEl) {
      errEl.style.display = "flex";
      errEl.innerHTML = `
        <span>Couldn't load models.</span>
        <button type="button" class="btn btn-subtle btn-sm" id="retry-models-btn" style="padding: 2px 8px; min-height: 32px; width: auto;">Try again</button>
      `;
      const retryBtn = errEl.querySelector("#retry-models-btn");
      if (retryBtn) {
        retryBtn.addEventListener("click", () => {
          const ySel = document.getElementById("select-year");
          const mSel = document.getElementById("select-make");
          if (ySel && mSel && ySel.value && mSel.value) {
            loadModelsForMakeYear(mSel.value, ySel.value);
          }
        });
      }
    }
    return;
  }

  if (errEl) {
    errEl.style.display = "none";
    errEl.innerHTML = "";
  }

  if (state.dropdownModels.length === 0) {
    select.innerHTML = `<option value="">No models found</option>`;
  } else {
    select.innerHTML = `
      <option value="">Select model…</option>
      ${state.dropdownModels.map(m => `<option value="${m}">${escapeHtml(m)}</option>`).join("")}
    `;
  }
}

// ------------------------------------------
// View: Report Overview Page
// ------------------------------------------
function renderOverviewPage(container) {
  const v = state.vehicle;
  if (!v) {
    renderEmptyVehicleState(container, "Report overview");
    return;
  }

  const page = document.createElement("div");
  page.className = "page-container";

  const recalls = state.recallsState.recalls;
  const recallLoading = state.recallsState.loading;
  const recallError = state.recallsState.error;
  const recallDataUnavailable = state.recallsState.dataUnavailable;
  const recallModelMismatch = state.recallsState.modelSelectionNeeded;
  const recallModelRecognized = state.recallsState.modelRecognizedByNhtsa;
  const nhtsaModels = state.recallsState.nhtsaRecallModels || [];
  const selectedModel = state.recallsState.selectedNhtsaModel || v.model;
  const engineDisplay = [v.engineDisplacement, v.engineConfig].filter(Boolean).join(" ") || SPEC_NOT_AVAILABLE;

  page.innerHTML = `
    <!-- Breadcrumbs -->
    <nav class="breadcrumbs" aria-label="Breadcrumbs">
      <button class="breadcrumb-link" onclick="navigateTo('home')">Home</button>
      <span>/</span>
      <span aria-current="page">${escapeHtml(v.year)} ${escapeHtml(v.make)} ${escapeHtml(v.model)}</span>
    </nav>

    <!-- Header -->
    <header class="page-header">
      <div class="page-title-group">
        <h1>
          <span>${escapeHtml(v.year)} ${escapeHtml(v.make)} ${escapeHtml(v.model)}</span>
          <span class="status-pill info">Vehicle report</span>
        </h1>
        <p class="page-subtitle">A starting point for your safety recall verification, pre-purchase checklist, and seller questions.</p>
      </div>
      <div class="page-actions">
        <button type="button" class="btn btn-secondary btn-sm" onclick="navigateTo('home')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          Change vehicle
        </button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="printReport()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Print report
        </button>
      </div>
    </header>

    <!-- NHTSA Data Source & Fetch Time Banner -->
    <div class="alert alert-info" role="region" aria-label="Data source notice">
      <span class="alert-icon" aria-hidden="true">🏛️</span>
      <div class="alert-content">
        <div class="alert-title">Data: NHTSA public datasets (vPIC, Recalls, Complaints)</div>
        <div>
          ${(state.recallsState.fetchTimestamp || state.complaintsState.fetchTimestamp) ? `Fetched live from NHTSA: <strong>${escapeHtml(state.complaintsState.fetchTimestamp || state.recallsState.fetchTimestamp)}</strong>. ` : "Connected to live NHTSA public datasets. "}
          Always verify individual VIN recall completion at 
          <a href="${NHTSA_RECALLS_EXTERNAL_URL}" target="_blank" rel="noopener" style="color: var(--brand-text); font-weight: 600;">nhtsa.gov/recalls</a>, and arrange an independent pre-purchase inspection with a trusted certified mechanic.
        </div>
      </div>
    </div>

    ${v.errorText ? `
      <div class="alert alert-warning" role="alert">
        <span class="alert-icon" aria-hidden="true">⚠️</span>
        <div class="alert-content">
          <div class="alert-title">VIN Decode Notice from NHTSA</div>
          <div>${escapeHtml(v.errorText)}</div>
        </div>
      </div>
    ` : ""}

    <!-- Dashboard Grid -->
    <div class="dash-grid">
      <!-- Left Column: Vehicle Details Specifications Card -->
      <section class="card col-7" aria-labelledby="specs-heading">
        <div class="card-header">
          <div class="card-title-group">
            <span class="icon-tile sm">🚗</span>
            <div>
              <h2 id="specs-heading" class="card-title">Vehicle details</h2>
              <p class="card-description">${v.vin ? "Decoded directly from NHTSA public vehicle records" : "Selected by year, make, and model (enter a VIN to decode trim, engine, and drivetrain)"}</p>
            </div>
          </div>
          ${v.vin ? `<span class="recall-campaign-badge" style="font-size: 11px;">VIN: ${escapeHtml(v.vin)}</span>` : ""}
        </div>

        <div class="specs-grid">
          <div class="spec-item">
            <span class="spec-label">Year, Make & Model</span>
            <span class="spec-value">${escapeHtml(v.year)} ${escapeHtml(v.make)} ${escapeHtml(v.model)}</span>
            <span class="spec-note">${getSpecExplanation("Model", v.model)}</span>
          </div>

          <div class="spec-item">
            <span class="spec-label">Trim level</span>
            <span class="spec-value">${escapeHtml(v.trim || SPEC_NOT_AVAILABLE)}</span>
            <span class="spec-note">${getSpecExplanation("Trim", v.trim)}</span>
          </div>

          <div class="spec-item">
            <span class="spec-label">Body style</span>
            <span class="spec-value">${escapeHtml(v.bodyClass || SPEC_NOT_AVAILABLE)}</span>
            <span class="spec-note">${getSpecExplanation("Body style", v.bodyClass)}</span>
          </div>

          <div class="spec-item">
            <span class="spec-label">Engine</span>
            <span class="spec-value">${escapeHtml(engineDisplay)}</span>
            <span class="spec-note">${getSpecExplanation("Engine", "")}</span>
          </div>

          <div class="spec-item">
            <span class="spec-label">Fuel type</span>
            <span class="spec-value">${escapeHtml(v.fuelType || SPEC_NOT_AVAILABLE)}</span>
            <span class="spec-note">${getSpecExplanation("Fuel type", v.fuelType)}</span>
          </div>

          <div class="spec-item">
            <span class="spec-label">Drive type</span>
            <span class="spec-value">${escapeHtml(formatDriveType(v.driveType) || SPEC_NOT_AVAILABLE)}</span>
            <span class="spec-note">${getSpecExplanation("Drive type", v.driveType)}</span>
          </div>

          ${v.plantCountry ? `
            <div class="spec-item">
              <span class="spec-label">Assembled in</span>
              <span class="spec-value">${escapeHtml(v.plantCity ? `${formatPlaceName(v.plantCity)}, ${formatPlaceName(v.plantCountry)}` : formatPlaceName(v.plantCountry))}</span>
              <span class="spec-note">${getSpecExplanation("Assembly plant", "")}</span>
            </div>
          ` : ""}
        </div>
      </section>

      <!-- Right Column: Safety Recalls Overview Card & Checklist Card -->
      <div class="col-5" style="display: flex; flex-direction: column; gap: 20px;">
        <!-- Recalls Summary Card -->
        <section class="card" aria-labelledby="recalls-card-heading">
          <div class="card-header">
            <div class="card-title-group">
              <span class="icon-tile sm">🛡️</span>
              <div>
                <h2 id="recalls-card-heading" class="card-title">Safety recalls</h2>
                <p class="card-description">NHTSA open defect recall database</p>
              </div>
            </div>
            ${recallLoading ? `
              <span class="status-pill info">Checking…</span>
            ` : recallError ? `
              <span class="status-pill serious">Check failed</span>
            ` : recallDataUnavailable ? `
              <span class="status-pill info">Data unavailable</span>
            ` : recallModelMismatch ? `
              <span class="status-pill warning">Model select needed</span>
            ` : (recalls !== null && recalls.length > 0) ? `
              <span class="status-pill warning">⚠️ ${recalls.length} recall${recalls.length === 1 ? "" : "s"}</span>
            ` : (recalls !== null && recalls.length === 0 && recallModelRecognized) ? `
              <span class="status-pill good">✔ 0 recalls on file</span>
            ` : (recalls !== null && recalls.length === 0 && !recallModelRecognized) ? `
              <span class="status-pill warning">⚠️ Possible name mismatch</span>
            ` : `
              <span class="status-pill info">Not checked</span>
            `}
          </div>

          <!-- Recalls Status Body -->
          <div id="overview-recalls-content">
            ${recallLoading ? `
              <div class="loading-box" style="padding: 20px 0;">
                <span class="spinner"></span>
                <span>Connecting to NHTSA recall database…</span>
              </div>
            ` : recallError ? `
              <div class="alert alert-serious" style="padding: 12px; font-size: 13px;">
                <span class="alert-icon" aria-hidden="true">⚠️</span>
                <div class="alert-content">
                  <strong>Could not verify recalls:</strong> ${escapeHtml(recallError)}
                  <p style="margin: 4px 0 0; color: var(--text-secondary); font-size: 12px;">
                    We could not reach NHTSA's safety recall registry. Do not assume 0 recalls.
                  </p>
                  <div style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap;">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="loadRecallsForVehicle(state.vehicle)">Try again</button>
                    <a href="${NHTSA_RECALLS_EXTERNAL_URL}" target="_blank" rel="noopener" class="btn btn-subtle btn-sm">Verify at nhtsa.gov/recalls ↗</a>
                  </div>
                </div>
              </div>
            ` : recallDataUnavailable ? `
              <div class="alert alert-info" style="padding: 12px; font-size: 13px;">
                <span class="alert-icon" aria-hidden="true">ℹ</span>
                <div class="alert-content">
                  <strong>Recall data unavailable from NHTSA:</strong> No model records on file for ${escapeHtml(v.year)} ${escapeHtml(v.make)}.
                  <p style="margin: 4px 0 0; color: var(--text-secondary); font-size: 12px;">
                    NHTSA has not indexed recall model data for this make and year. Do not assume 0 recalls.
                  </p>
                  <div style="margin-top: 8px;">
                    <a href="${NHTSA_RECALLS_EXTERNAL_URL}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
                      Check official VIN lookup at nhtsa.gov/recalls ↗
                    </a>
                  </div>
                </div>
              </div>
            ` : recallModelMismatch ? `
              <div class="alert alert-warning" style="padding: 12px; font-size: 13px;">
                <span class="alert-icon" aria-hidden="true">⚠️</span>
                <div class="alert-content" style="width: 100%;">
                  <strong>Model name confirmation needed:</strong> NHTSA lists recalls under specific model designations. None matched <em>"${escapeHtml(v.model)}"</em> automatically.
                  
                  <form id="overview-model-pick-form" style="margin-top: 10px; display: flex; flex-direction: column; gap: 6px;">
                    <label for="overview-model-select" class="form-label" style="font-size: 12px;">Select matching NHTSA recall model:</label>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                      <select id="overview-model-select" class="form-select" style="font-size: 13px; padding: 6px 8px; flex: 1; min-width: 160px;">
                        <option value="">Choose a model…</option>
                        ${nhtsaModels.map(m => `
                          <option value="${escapeHtml(m)}">${escapeHtml(m)}</option>
                        `).join("")}
                      </select>
                      <button type="submit" class="btn btn-primary btn-sm" style="flex-shrink: 0;">Check recalls</button>
                    </div>
                  </form>

                  <div style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                    <button type="button" class="btn btn-secondary btn-sm" id="overview-force-model-btn">
                      Search for "${escapeHtml(v.model)}" directly
                    </button>
                    <button type="button" class="btn btn-subtle btn-sm" onclick="navigateTo('recalls')">
                      Go to Recalls page →
                    </button>
                  </div>
                </div>
              </div>
            ` : (recalls !== null && recalls.length > 0) ? `
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.45;">
                  <strong>${recalls.length} safety recall campaign${recalls.length === 1 ? "" : "s"}</strong> on file for the ${escapeHtml(v.year)} ${escapeHtml(v.make)} ${escapeHtml(selectedModel)}.
                </p>
                <ul class="numbered-list" style="margin-top: 4px;">
                  ${recalls.slice(0, 3).map(r => {
                    const t = translateRecall(r);
                    return `
                      <li class="numbered-row" style="padding: 6px 0;">
                        <span class="number-bubble ${t.isHighSeverity ? "serious" : ""}" style="width: 20px; height: 20px; min-width: 20px; font-size: 11px;">!</span>
                        <div style="font-size: 13px; line-height: 1.35;">
                          <strong>${escapeHtml(t.plainTitle)}</strong>
                          <span style="color: var(--text-secondary); display: block; font-size: 11px;">NHTSA #${escapeHtml(t.campaignNumber)}</span>
                        </div>
                      </li>
                    `;
                  }).join("")}
                </ul>
                ${recalls.length > 3 ? `
                  <div style="font-size: 12px; color: var(--text-secondary);">+ ${recalls.length - 3} more recall campaigns</div>
                ` : ""}
                <div style="margin-top: 6px; display: flex; gap: 8px; flex-wrap: wrap;">
                  <button type="button" class="btn btn-primary btn-sm" onclick="navigateTo('recalls')">
                    View all recall details & remedies →
                  </button>
                  <a href="${NHTSA_RECALLS_EXTERNAL_URL}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
                    Verify VIN repair status ↗
                  </a>
                </div>
              </div>
            ` : (recalls !== null && recalls.length === 0 && recallModelRecognized) ? `
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.45; color: var(--status-good); font-weight: 600;">
                  ✔ No safety recalls found on file for this model year (${escapeHtml(selectedModel)}).
                </p>
                <p style="margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.4;">
                  Recalls apply by specific VIN. Check the exact VIN on NHTSA's official website to confirm if any past campaigns applied.
                </p>
                <div style="margin-top: 4px;">
                  <a href="${NHTSA_RECALLS_EXTERNAL_URL}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
                    Verify VIN at nhtsa.gov/recalls ↗
                  </a>
                </div>
              </div>
            ` : (recalls !== null && recalls.length === 0 && !recallModelRecognized) ? `
              <div class="alert alert-warning" style="padding: 12px; font-size: 13px;">
                <span class="alert-icon" aria-hidden="true">⚠️</span>
                <div class="alert-content" style="width: 100%;">
                  <strong>No results for this model name — this may be a naming mismatch, not a clean record</strong>
                  <p style="margin: 4px 0 0; color: var(--text-secondary); font-size: 12px;">
                    NHTSA's recall list does not recognize "${escapeHtml(selectedModel)}" for ${escapeHtml(v.year)} ${escapeHtml(v.make)}. ${nhtsaModels.length > 0 ? "Choose a model name from NHTSA's list below, or check the exact VIN at nhtsa.gov/recalls." : "Check the exact VIN at nhtsa.gov/recalls to be sure."}
                  </p>
                  ${nhtsaModels.length > 0 ? `
                    <form id="overview-model-pick-form" style="margin-top: 10px; display: flex; flex-direction: column; gap: 6px;">
                      <label for="overview-model-select" class="form-label" style="font-size: 12px;">NHTSA recall model name:</label>
                      <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        <select id="overview-model-select" class="form-select" style="font-size: 13px; padding: 6px 8px; flex: 1; min-width: 160px;">
                          <option value="">Choose a model…</option>
                          ${nhtsaModels.map(m => `
                            <option value="${escapeHtml(m)}">${escapeHtml(m)}</option>
                          `).join("")}
                        </select>
                        <button type="submit" class="btn btn-primary btn-sm" style="flex-shrink: 0;">Check recalls</button>
                      </div>
                    </form>
                  ` : ""}
                  <div style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap;">
                    <a href="${NHTSA_RECALLS_EXTERNAL_URL}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
                      Verify VIN at nhtsa.gov/recalls ↗
                    </a>
                  </div>
                </div>
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <p style="margin: 0; font-size: 13px; color: var(--text-secondary);">Safety recall check not run yet.</p>
                <div>
                  <button type="button" class="btn btn-primary btn-sm" onclick="loadRecallsForVehicle(state.vehicle)">Check recalls now</button>
                </div>
              </div>
            `}
          </div>
        </section>

        <!-- Checklist Progress Card -->
        <section class="card" aria-labelledby="checklist-card-heading">
          <div class="card-header">
            <div class="card-title-group">
              <span class="icon-tile sm">📋</span>
              <div>
                <h2 id="checklist-card-heading" class="card-title">Pre-purchase checklist</h2>
                <p class="card-description">Essential steps for your test drive</p>
              </div>
            </div>
          </div>

          <div class="progress-card">
            <div class="progress-header">
              <div class="big-stat">
                <span>${state.checklist.size}</span>
                <span class="stat-sub">of ${CHECKLIST_ITEMS.length} complete</span>
              </div>
              <button type="button" class="btn btn-subtle btn-sm" onclick="resetChecklist()" ${state.checklist.size === 0 ? "disabled" : ""}>
                Reset
              </button>
            </div>

            <div class="progress-bar-bg" role="progressbar" aria-valuenow="${state.checklist.size}" aria-valuemin="0" aria-valuemax="${CHECKLIST_ITEMS.length}">
              <div class="progress-bar-fill ${state.checklist.size === CHECKLIST_ITEMS.length ? "complete" : ""}" style="width: ${(state.checklist.size / CHECKLIST_ITEMS.length) * 100}%;"></div>
            </div>

            <div style="margin-top: 6px;">
              <button type="button" class="btn btn-secondary btn-sm" style="width: 100%;" onclick="navigateTo('checklist')">
                ${state.checklist.size === 0 ? "Start test drive checklist →" : state.checklist.size === CHECKLIST_ITEMS.length ? "Review completed checklist →" : "Continue checklist →"}
              </button>
            </div>
          </div>
        </section>
      </div>

      <!-- Seller Questions Preview Card -->
      <section class="card col-7" aria-labelledby="seller-preview-heading">
        <div class="card-header">
          <div class="card-title-group">
            <span class="icon-tile sm">💬</span>
            <div>
              <h2 id="seller-preview-heading" class="card-title">Questions to ask the seller</h2>
              <p class="card-description">Key questions to ask before you make an offer</p>
            </div>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="copyQuestions()">
            Copy questions
          </button>
        </div>

        <ol class="numbered-list">
          ${SELLER_QUESTIONS.map((q, idx) => `
            <li class="numbered-row">
              <span class="number-bubble">${idx + 1}</span>
              <span style="font-size: 14px; line-height: 1.45;">${escapeHtml(q)}</span>
            </li>
          `).join("")}
        </ol>

        <div>
          <button type="button" class="btn btn-subtle btn-sm" style="padding-left: 0;" onclick="navigateTo('seller')">
            View repair planning and seller guidance →
          </button>
        </div>
      </section>

      <!-- Things to Inspect Preview Card -->
      <section class="card col-5" aria-labelledby="inspect-preview-heading">
        <div class="card-header">
          <div class="card-title-group">
            <span class="icon-tile sm">🔎</span>
            <div>
              <h2 id="inspect-preview-heading" class="card-title">Things to check</h2>
              <p class="card-description">Top owner complaints & test drive symptoms</p>
            </div>
          </div>
        </div>

        ${state.complaintsState.loading ? `
          <div style="padding: 16px 0; text-align: center;">
            <div style="font-size: 20px; margin-bottom: 6px;">⏳</div>
            <p style="margin: 0; font-size: 13px; color: var(--text-secondary);">Loading owner complaints from NHTSA…</p>
          </div>
        ` : state.complaintsState.error ? `
          <div class="alert alert-serious" style="padding: 10px; margin-bottom: 12px;">
            <span class="alert-icon" style="font-size: 16px;">⚠️</span>
            <div class="alert-content" style="font-size: 12px;">
              <div>Unable to load owner complaints. Do not assume 0 complaints.</div>
              <button type="button" class="btn btn-secondary btn-sm" style="margin-top: 6px;" onclick="retryComplaints()">Try again</button>
            </div>
          </div>
        ` : (state.recallsState.modelSelectionNeeded && !state.complaintsState.loaded) ? `
          <div class="alert alert-warning" style="padding: 10px; margin-bottom: 12px;">
            <span class="alert-icon" style="font-size: 16px;">ℹ️</span>
            <div class="alert-content" style="font-size: 12px;">
              <div>Confirm the exact NHTSA model name above to load owner complaints.</div>
            </div>
          </div>
        ` : (state.complaintsState.loaded && state.complaintsState.topProblemAreas && state.complaintsState.topProblemAreas.length === 0 && state.complaintsState.modelConfirmedInNhtsa) ? `
          <div style="padding: 8px 0;">
            <p style="margin: 0 0 10px; font-size: 13px; color: var(--status-good); font-weight: 600;">
              ✔ No owner complaints on file with NHTSA for this model year.
            </p>
            <button type="button" class="btn btn-subtle btn-sm" style="padding-left: 0;" onclick="navigateTo('inspect')">
              Open inspection notes →
            </button>
          </div>
        ` : (state.complaintsState.loaded && state.complaintsState.topProblemAreas && state.complaintsState.topProblemAreas.length === 0 && !state.complaintsState.modelConfirmedInNhtsa) ? `
          <div style="padding: 8px 0;">
            <p style="margin: 0 0 10px; font-size: 13px; color: var(--text-secondary); line-height: 1.45;">
              No complaints filed under “${escapeHtml(state.complaintsState.selectedModel || v.model)}” — NHTSA may list this model under a more specific name. Check <a href="https://www.nhtsa.gov" target="_blank" rel="noopener" style="color: var(--brand-text); font-weight: 600;">nhtsa.gov</a>.
            </p>
            <button type="button" class="btn btn-subtle btn-sm" style="padding-left: 0;" onclick="navigateTo('inspect')">
              Open inspection notes →
            </button>
          </div>
        ` : (state.complaintsState.loaded && state.complaintsState.topProblemAreas && state.complaintsState.topProblemAreas.length > 0) ? `
          ${renderComplaintVariantBarHtml("overview-complaint-variant-select")}
          <ul class="numbered-list">
            ${state.complaintsState.topProblemAreas.slice(0, 3).map(area => `
              <li class="numbered-row">
                <span class="number-bubble">${area.icon}</span>
                <div style="font-size: 13px; line-height: 1.4; flex: 1;">
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; flex-wrap: wrap;">
                    <strong>${escapeHtml(area.title)}</strong>
                    <span class="recall-campaign-badge" style="font-size: 11px; padding: 1px 6px;">
                      ${area.count.toLocaleString()} complaint${area.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div style="margin-top: 4px; display: flex; gap: 4px; flex-wrap: wrap;">
                    ${area.crashes > 0 ? `<span class="status-pill serious" style="font-size: 10px; padding: 1px 6px;">💥 ${area.crashes} crash${area.crashes > 1 ? "es" : ""}</span>` : ""}
                    ${area.fires > 0 ? `<span class="status-pill serious" style="font-size: 10px; padding: 1px 6px;">🔥 ${area.fires} fire${area.fires > 1 ? "s" : ""}</span>` : ""}
                    ${area.injuries > 0 ? `<span class="status-pill warning" style="font-size: 10px; padding: 1px 6px;">🩹 ${area.injuries} injur${area.injuries > 1 ? "ies" : "y"}</span>` : ""}
                    ${(area.crashes === 0 && area.fires === 0 && area.injuries === 0) ? `<span class="status-pill good" style="font-size: 10px; padding: 1px 6px;">✔ No crashes/injuries</span>` : ""}
                  </div>
                  <p style="margin: 4px 0 0; color: var(--text-secondary); font-size: 12px; line-height: 1.35;">
                    ${escapeHtml(area.summary)}
                  </p>
                </div>
              </li>
            `).join("")}
          </ul>

          <div style="margin-top: 8px;">
            <button type="button" class="btn btn-subtle btn-sm" style="padding-left: 0;" onclick="navigateTo('inspect')">
              Open all top ${state.complaintsState.topProblemAreas.length} problem areas & notes →
            </button>
          </div>
        ` : `
          <div style="padding: 8px 0;">
            <p style="margin: 0 0 10px; font-size: 13px; color: var(--text-secondary);">
              Owner complaints check has not run yet.
            </p>
            <button type="button" class="btn btn-secondary btn-sm" onclick="retryComplaints()">
              Check owner complaints
            </button>
          </div>
        `}
      </section>
    </div>
  `;

  container.appendChild(page);

  // Setup complaint variant switcher if active
  const overviewVariantSelect = page.querySelector("#overview-complaint-variant-select");
  if (overviewVariantSelect) {
    overviewVariantSelect.addEventListener("change", () => {
      selectComplaintVariant(overviewVariantSelect.value);
    });
  }

  // Setup overview model picker listeners if active
  const overviewModelForm = page.querySelector("#overview-model-pick-form");
  if (overviewModelForm) {
    overviewModelForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const sel = page.querySelector("#overview-model-select");
      if (!sel || !sel.value) {
        showToast("Please choose a model from NHTSA's list.");
        if (sel) sel.focus();
        return;
      }
      loadRecallsForVehicle(state.vehicle, sel.value);
    });
  }
  const overviewForceBtn = page.querySelector("#overview-force-model-btn");
  if (overviewForceBtn) {
    overviewForceBtn.addEventListener("click", () => {
      loadRecallsForVehicle(state.vehicle, state.vehicle.model);
    });
  }
}

// ------------------------------------------
// View: Safety Recalls Page (Core Feature!)
// ------------------------------------------
function renderRecallsPage(container) {
  const v = state.vehicle;
  if (!v) {
    renderEmptyVehicleState(container, "Safety recalls");
    return;
  }

  const page = document.createElement("div");
  page.className = "page-container";

  const recalls = state.recallsState.recalls;
  const loading = state.recallsState.loading;
  const error = state.recallsState.error;
  const dataUnavailable = state.recallsState.dataUnavailable;
  const modelMismatch = state.recallsState.modelSelectionNeeded;
  const modelRecognized = state.recallsState.modelRecognizedByNhtsa;
  const nhtsaModels = state.recallsState.nhtsaRecallModels || [];
  const selectedNhtsaModel = state.recallsState.selectedNhtsaModel || v.model;

  page.innerHTML = `
    <!-- Breadcrumbs -->
    <nav class="breadcrumbs" aria-label="Breadcrumbs">
      <button class="breadcrumb-link" onclick="navigateTo('home')">Home</button>
      <span>/</span>
      <button class="breadcrumb-link" onclick="navigateTo('overview')">${escapeHtml(v.year)} ${escapeHtml(v.make)} ${escapeHtml(v.model)}</button>
      <span>/</span>
      <span aria-current="page">Safety recalls</span>
    </nav>

    <!-- Header -->
    <header class="page-header">
      <div class="page-title-group">
        <h1>
          <span>Safety recalls</span>
          ${loading ? `
            <span class="status-pill info">Checking NHTSA…</span>
          ` : error ? `
            <span class="status-pill serious">Check failed</span>
          ` : dataUnavailable ? `
            <span class="status-pill info">Data unavailable</span>
          ` : modelMismatch ? `
            <span class="status-pill warning">Model choice needed</span>
          ` : (recalls !== null && recalls.length > 0) ? `
            <span class="status-pill warning">⚠️ ${recalls.length} recall campaign${recalls.length === 1 ? "" : "s"}</span>
          ` : (recalls !== null && recalls.length === 0 && modelRecognized) ? `
            <span class="status-pill good">✔ 0 recalls on file</span>
          ` : (recalls !== null && recalls.length === 0 && !modelRecognized) ? `
            <span class="status-pill warning">⚠️ Possible name mismatch</span>
          ` : `
            <span class="status-pill info">Not checked</span>
          `}
        </h1>
        <p class="page-subtitle">
          Live safety recall campaigns from the National Highway Traffic Safety Administration (NHTSA) for 
          <strong>${escapeHtml(v.year)} ${escapeHtml(v.make)} ${escapeHtml(selectedNhtsaModel)}</strong>.
          ${(nhtsaModels.length > 0 && selectedNhtsaModel) ? `
            <button type="button" class="btn btn-subtle btn-sm" onclick="promptModelSelection()" style="padding: 2px 8px; font-size: 11px; margin-left: 6px;">
              Change recall model
            </button>
          ` : ""}
        </p>
      </div>
      <div class="page-actions">
        <button type="button" class="btn btn-secondary btn-sm" onclick="printReport()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Print report
        </button>
      </div>
    </header>

    <!-- VIN Verification Notice & Official Link Card -->
    <section class="card" style="border-left: 4px solid var(--brand-fill);" aria-labelledby="vin-repaired-heading">
      <div class="card-header">
        <div class="card-title-group">
          <span class="icon-tile sm">🔍</span>
          <div>
            <h2 id="vin-repaired-heading" class="card-title" style="font-size: 16px;">Has this specific vehicle been repaired?</h2>
            <p class="card-description">NHTSA recall data shows defects for the entire model line. Check whether this car was fixed.</p>
          </div>
        </div>
      </div>

      <p style="margin: 0; font-size: 14px; line-height: 1.5; color: var(--text-primary);">
        Automakers are required by federal law to repair safety recalls <strong>free of charge</strong>. 
        However, only the vehicle's specific 17-character VIN can confirm whether the previous owner completed the repair.
      </p>

      <div class="form-row" style="margin-top: 4px;">
        <div style="flex-grow: 1; min-width: 260px;">
          <label for="recalls-vin-input" class="form-label" style="font-size: 12px;">Vehicle VIN to verify:</label>
          <input type="text" id="recalls-vin-input" class="form-input vin-input" value="${escapeHtml(v.vin || "")}" placeholder="Enter 17-character VIN" maxlength="17">
        </div>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-secondary" onclick="copyVinFromRecalls()">
            Copy VIN
          </button>
          <a href="${NHTSA_RECALLS_EXTERNAL_URL}" target="_blank" rel="noopener" class="btn btn-primary">
            <span>Check at nhtsa.gov/recalls ↗</span>
          </a>
        </div>
      </div>
    </section>

    <!-- Recall Content Section -->
    <div id="recalls-main-section">
      ${loading ? `
        <div class="card loading-box">
          <span class="spinner" style="width: 32px; height: 32px; border-width: 3px;"></span>
          <div style="font-size: 16px; font-weight: 600;">Checking NHTSA recall records…</div>
          <p style="margin: 0; font-size: 13px; color: var(--text-secondary); max-width: 420px;">
            Connecting to NHTSA's safety recall API for ${escapeHtml(v.year)} ${escapeHtml(v.make)} ${escapeHtml(selectedNhtsaModel)}. This takes just a moment.
          </p>
        </div>
      ` : error ? `
        <!-- Error State: NEVER show 0 recalls on failure -->
        <div class="card alert-serious" style="padding: 24px;">
          <div style="display: flex; align-items: flex-start; gap: 14px;">
            <span class="alert-icon" style="font-size: 28px;">⚠️</span>
            <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
              <h2 class="card-title" style="color: var(--status-serious); font-size: 18px;">Unable to check recalls from NHTSA</h2>
              <p style="margin: 0; font-size: 14px; line-height: 1.5;">
                ${escapeHtml(error)}
              </p>
              <p style="margin: 0; font-size: 13px; color: var(--text-secondary);">
                We could not confirm the safety recall status for this vehicle. Do not assume there are 0 recalls.
              </p>
              <div style="display: flex; gap: 12px; margin-top: 8px; flex-wrap: wrap;">
                <button type="button" class="btn btn-primary" onclick="loadRecallsForVehicle(state.vehicle, state.recallsState.selectedNhtsaModel)">
                  Try again
                </button>
                <a href="${NHTSA_RECALLS_EXTERNAL_URL}" target="_blank" rel="noopener" class="btn btn-secondary">
                  Check directly at nhtsa.gov/recalls ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      ` : dataUnavailable ? `
        <!-- Data Unavailable State -->
        <div class="card" style="padding: 24px;">
          <div style="display: flex; align-items: flex-start; gap: 14px;">
            <span class="alert-icon" style="font-size: 28px;">ℹ</span>
            <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
              <h2 class="card-title" style="font-size: 18px;">Recall model data unavailable from NHTSA</h2>
              <p style="margin: 0; font-size: 14px; line-height: 1.5;">
                NHTSA's public safety recall model registry has no model designations on file for <strong>${escapeHtml(v.year)} ${escapeHtml(v.make)}</strong>.
              </p>
              <p style="margin: 0; font-size: 13px; color: var(--text-secondary);">
                Because no models are on file, we cannot confirm safety recalls for this vehicle. Do not assume there are 0 recalls.
              </p>
              <div style="display: flex; gap: 12px; margin-top: 8px; flex-wrap: wrap;">
                <button type="button" class="btn btn-secondary" onclick="loadRecallsForVehicle(state.vehicle, state.vehicle.model)">
                  Search recalls for "${escapeHtml(v.model)}" directly
                </button>
                <a href="${NHTSA_RECALLS_EXTERNAL_URL}" target="_blank" rel="noopener" class="btn btn-primary">
                  Check directly at nhtsa.gov/recalls ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      ` : modelMismatch ? `
        <!-- Model Mismatch State: Let the user pick the right model -->
        <div class="card" style="border: 1px solid var(--status-warning);" role="region" aria-labelledby="model-select-heading">
          <div class="card-header">
            <div class="card-title-group">
              <span class="icon-tile sm" style="background-color: var(--status-warning-bg); color: var(--status-warning);">⚠️</span>
              <div>
                <h2 id="model-select-heading" class="card-title" style="color: var(--status-warning);">Select the exact NHTSA model name</h2>
                <p class="card-description">NHTSA uses specific designations for recall records that differ slightly from standard names.</p>
              </div>
            </div>
          </div>

          <p style="margin: 0; font-size: 14px; line-height: 1.5;">
            We searched NHTSA's safety recall registry for <strong>${escapeHtml(v.make)}</strong> in <strong>${escapeHtml(v.year)}</strong>, 
            but could not automatically match your model: <em>"${escapeHtml(v.model)}"</em>.
            Please choose the model name from NHTSA's official recall list below to load live recalls:
          </p>

          <form id="nhtsa-model-pick-form" class="form-row" style="margin-top: 10px;">
            <div style="flex-grow: 1; min-width: 240px;">
              <label for="nhtsa-model-select" class="form-label">NHTSA Recall Model:</label>
              <select id="nhtsa-model-select" class="form-select">
                <option value="">Choose a model…</option>
                ${nhtsaModels.map(m => `
                  <option value="${escapeHtml(m)}">${escapeHtml(m)}</option>
                `).join("")}
              </select>
            </div>
            <button type="submit" class="btn btn-primary" style="flex-shrink: 0;">
              Check recalls for this model
            </button>
          </form>

          <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
            <span style="font-size: 13px; color: var(--text-secondary);">Or if your model is not listed in NHTSA's registry:</span>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-force-target-model">
              Search recalls for "${escapeHtml(v.model)}" directly
            </button>
          </div>
        </div>
      ` : (recalls !== null && recalls.length === 0 && modelRecognized) ? `
        <!-- Verified Zero Recalls State -->
        <div class="card" style="text-align: center; padding: 36px 20px;">
          <div style="font-size: 40px; margin-bottom: 8px;">🛡️</div>
          <h2 class="card-title" style="color: var(--status-good); font-size: 20px;">No safety recalls found on file</h2>
          <p style="margin: 8px auto 0; font-size: 14px; line-height: 1.5; color: var(--text-secondary); max-width: 540px;">
            NHTSA has zero safety recall campaigns on file for the <strong>${escapeHtml(v.year)} ${escapeHtml(v.make)} ${escapeHtml(selectedNhtsaModel)}</strong>.
          </p>
          <div style="margin-top: 16px;">
            <a href="${NHTSA_RECALLS_EXTERNAL_URL}" target="_blank" rel="noopener" class="btn btn-secondary">
              Double-check this VIN at nhtsa.gov/recalls ↗
            </a>
          </div>
        </div>
      ` : (recalls !== null && recalls.length === 0 && !modelRecognized) ? `
        <!-- Unrecognized Model Name Warning State -->
        <div class="card" style="border: 1px solid var(--status-warning); padding: 24px;">
          <div style="display: flex; align-items: flex-start; gap: 14px;">
            <span class="alert-icon" style="font-size: 28px;">⚠️</span>
            <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
              <h2 class="card-title" style="color: var(--status-warning); font-size: 18px;">
                No results for this model name — this may be a naming mismatch, not a clean record
              </h2>
              <p style="margin: 0; font-size: 14px; line-height: 1.5; color: var(--text-secondary);">
                NHTSA's recall list does not recognize <strong>"${escapeHtml(selectedNhtsaModel)}"</strong> for <strong>${escapeHtml(v.year)} ${escapeHtml(v.make)}</strong>. Because the model name was not matched in NHTSA's recall directory, do not treat empty results as 0 recalls.
              </p>
              ${nhtsaModels.length > 0 ? `
                <form id="nhtsa-model-pick-form" class="form-row" style="margin-top: 8px;">
                  <div style="flex-grow: 1; min-width: 220px;">
                    <label for="nhtsa-model-select" class="form-label">Choose a model from NHTSA's recall list:</label>
                    <select id="nhtsa-model-select" class="form-select">
                      <option value="">Choose a model…</option>
                      ${nhtsaModels.map(m => `
                        <option value="${escapeHtml(m)}">${escapeHtml(m)}</option>
                      `).join("")}
                    </select>
                  </div>
                  <button type="submit" class="btn btn-primary" style="flex-shrink: 0;">
                    Check recalls for this model
                  </button>
                </form>
              ` : ""}
              <div style="display: flex; gap: 12px; margin-top: 8px; flex-wrap: wrap;">
                <a href="${NHTSA_RECALLS_EXTERNAL_URL}" target="_blank" rel="noopener" class="btn btn-secondary">
                  Check this VIN at nhtsa.gov/recalls ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      ` : (recalls !== null && recalls.length > 0) ? `
        <!-- Recall Cards List -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <span style="font-size: 14px; color: var(--text-secondary);">
              Showing <strong>${recalls.length}</strong> recall campaign${recalls.length === 1 ? "" : "s"} from NHTSA records.
            </span>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button type="button" class="btn btn-subtle btn-sm" onclick="toggleAllDetails(true)">Expand all</button>
              <span>·</span>
              <button type="button" class="btn btn-subtle btn-sm" onclick="toggleAllDetails(false)">Collapse all</button>
            </div>
          </div>

          ${recalls.map((recall, index) => {
            const t = translateRecall(recall);
            return `
              <article class="recall-card ${t.isHighSeverity ? "serious" : ""}" aria-labelledby="recall-title-${index}">
                <div class="recall-card-header">
                  <div>
                    <span class="recall-campaign-badge">NHTSA Campaign: ${escapeHtml(t.campaignNumber)}</span>
                    <h3 id="recall-title-${index}" class="recall-title" style="margin-top: 6px;">
                      ${escapeHtml(t.plainTitle)}
                    </h3>
                    <span class="recall-component-tag">Component: ${escapeHtml(t.component)}</span>
                  </div>
                  ${t.parkIt ? `
                    <span class="status-pill serious">⛔ DO NOT DRIVE</span>
                  ` : t.parkOutSide ? `
                    <span class="status-pill serious">🔥 PARK OUTSIDE</span>
                  ` : t.isHighSeverity ? `
                    <span class="status-pill serious">High Risk</span>
                  ` : `
                    <span class="status-pill warning">Safety recall</span>
                  `}
                </div>

                <!-- Plain English Risk -->
                <div class="recall-section">
                  <span class="recall-section-label">
                    <span>⚠️</span>
                    <span>Safety Risk (Why it matters):</span>
                  </span>
                  <p class="recall-section-text">
                    ${escapeHtml(t.plainRisk)}
                  </p>
                </div>

                <!-- Plain English Remedy -->
                <div class="recall-section">
                  <span class="recall-section-label">
                    <span>🔧</span>
                    <span>Recommended Remedy:</span>
                  </span>
                  <p class="recall-section-text">
                    ${escapeHtml(t.plainRemedy)}
                  </p>
                </div>

                <!-- NHTSA Original Wording in Expander -->
                <details class="nhtsa-details">
                  <summary>View NHTSA's original government wording</summary>
                  <div class="nhtsa-raw-box">
                    <div class="raw-row">
                      <span class="raw-label">NHTSA Campaign Number:</span>
                      <span class="raw-value">${escapeHtml(t.campaignNumber)}</span>
                    </div>
                    ${t.reportDate ? `
                      <div class="raw-row">
                        <span class="raw-label">Report Received Date:</span>
                        <span class="raw-value">${escapeHtml(t.reportDate)}</span>
                      </div>
                    ` : ""}
                    <div class="raw-row">
                      <span class="raw-label">Component:</span>
                      <span class="raw-value">${escapeHtml(t.component)}</span>
                    </div>
                    <div class="raw-row">
                      <span class="raw-label">NHTSA Defect Summary:</span>
                      <span class="raw-value">${escapeHtml(t.rawSummary || "None specified in NHTSA record.")}</span>
                    </div>
                    <div class="raw-row">
                      <span class="raw-label">NHTSA Consequence:</span>
                      <span class="raw-value">${escapeHtml(t.rawConsequence || "None specified in NHTSA record.")}</span>
                    </div>
                    <div class="raw-row">
                      <span class="raw-label">NHTSA Remedy:</span>
                      <span class="raw-value">${escapeHtml(t.rawRemedy || "None specified in NHTSA record.")}</span>
                    </div>
                    ${t.rawNotes ? `
                      <div class="raw-row">
                        <span class="raw-label">NHTSA Notes:</span>
                        <span class="raw-value">${escapeHtml(t.rawNotes)}</span>
                      </div>
                    ` : ""}
                    ${t.parkIt ? `
                      <div class="raw-row" style="color: var(--status-serious); font-weight: 600;">
                        <span class="raw-label">Urgent Advisory:</span>
                        <span class="raw-value">NHTSA advises owners NOT to drive this vehicle until the recall repair has been performed.</span>
                      </div>
                    ` : ""}
                    ${t.parkOutSide ? `
                      <div class="raw-row" style="color: var(--status-serious); font-weight: 600;">
                        <span class="raw-label">Fire Advisory:</span>
                        <span class="raw-value">NHTSA advises parking this vehicle outside and away from structures until repaired.</span>
                      </div>
                    ` : ""}
                  </div>
                </details>
              </article>
            `;
          }).join("")}
        </div>
      ` : `
        <div class="card" style="text-align: center; padding: 36px 20px;">
          <h2 class="card-title" style="font-size: 18px;">Safety recall check not run yet</h2>
          <p style="margin: 8px auto 16px; font-size: 14px; color: var(--text-secondary); max-width: 420px;">
            Check live safety recall records from NHTSA for this vehicle.
          </p>
          <button type="button" class="btn btn-primary" onclick="loadRecallsForVehicle(state.vehicle)">
            Check recalls now
          </button>
        </div>
      `}
    </div>
  `;

  container.appendChild(page);

  // Setup model picker listener if active
  const modelPickForm = page.querySelector("#nhtsa-model-pick-form");
  if (modelPickForm) {
    modelPickForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const select = page.querySelector("#nhtsa-model-select");
      if (!select || !select.value) {
        showToast("Please choose a model from NHTSA's list.");
        if (select) select.focus();
        return;
      }
      loadRecallsForVehicle(state.vehicle, select.value);
    });
  }

  const forceBtn = page.querySelector("#btn-force-target-model");
  if (forceBtn) {
    forceBtn.addEventListener("click", () => {
      loadRecallsForVehicle(state.vehicle, state.vehicle.model);
    });
  }
}

function copyVinFromRecalls() {
  const input = document.getElementById("recalls-vin-input");
  if (input && input.value) {
    copyToClipboard(input.value.trim(), "VIN copied to clipboard!");
  } else {
    showToast("No VIN entered to copy.");
  }
}

function toggleAllDetails(open) {
  document.querySelectorAll(".nhtsa-details").forEach(d => {
    d.open = open;
  });
}

// ------------------------------------------
// View: Things to Check (Inspection & Notes)
// ------------------------------------------
function renderInspectPage(container) {
  const v = state.vehicle;
  if (!v) {
    renderEmptyVehicleState(container, "Things to check");
    return;
  }

  // Trigger complaints load only if not already running, loaded, errored, or waiting on model confirmation
  if (
    !state.complaintsState.loading &&
    !state.complaintsState.loaded &&
    !state.complaintsState.error &&
    !state.recallsState.loading &&
    !state.recallsState.modelSelectionNeeded
  ) {
    loadComplaintsForVehicle(v, state.recallsState.selectedNhtsaModel || v.model);
  }

  const complaintsModelName = state.complaintsState.selectedModel || state.recallsState.selectedNhtsaModel || v.model;

  const page = document.createElement("div");
  page.className = "page-container";

  page.innerHTML = `
    <!-- Breadcrumbs -->
    <nav class="breadcrumbs" aria-label="Breadcrumbs">
      <button class="breadcrumb-link" onclick="navigateTo('home')">Home</button>
      <span>/</span>
      <button class="breadcrumb-link" onclick="navigateTo('overview')">${escapeHtml(v.year)} ${escapeHtml(v.make)} ${escapeHtml(v.model)}</button>
      <span>/</span>
      <span aria-current="page">Things to check</span>
    </nav>

    <!-- Header -->
    <header class="page-header">
      <div class="page-title-group">
        <h1>Things to check</h1>
        <p class="page-subtitle">Top 5 owner-reported problem areas from NHTSA, what to look and listen for, and session notes for your inspection.</p>
      </div>
      <div class="page-actions">
        <button type="button" class="btn btn-secondary btn-sm" onclick="printReport()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Print notes
        </button>
      </div>
    </header>

    <!-- NHTSA Complaints Source & Independent Inspection Banner -->
    <div class="alert alert-info" role="region" aria-label="Complaints data source notice">
      <span class="alert-icon" aria-hidden="true">🏛️</span>
      <div class="alert-content">
        <div class="alert-title">Data: NHTSA public datasets (Complaints)</div>
        <div>
          ${state.complaintsState.fetchTimestamp ? `Fetched live from NHTSA: <strong>${escapeHtml(state.complaintsState.fetchTimestamp)}</strong>. ` : "Connected to live NHTSA complaints database. "}
          Owner complaints reflect real driver reports for the ${escapeHtml(v.year)} ${escapeHtml(v.make)} ${escapeHtml(complaintsModelName)}.
          <strong>Always schedule an independent pre-purchase inspection with a trusted certified mechanic before buying.</strong>
        </div>
      </div>
    </div>

    <div class="alert alert-good" style="margin-top: 12px;">
      <span class="alert-icon" aria-hidden="true">📝</span>
      <div class="alert-content">
        <strong>Session Notes:</strong> Any notes you type in the problem areas below are automatically saved per vehicle in your browser and included when you print your report.
      </div>
    </div>

    <!-- Content Area: Loading, Error, or Real Problem Areas -->
    <div style="margin-top: 16px;">
      ${state.complaintsState.loading ? `
        <div class="card" style="text-align: center; padding: 40px 16px;">
          <div style="font-size: 32px; margin-bottom: 8px;">⏳</div>
          <h2 class="card-title" style="font-size: 18px; margin-bottom: 4px;">Loading owner complaints from NHTSA…</h2>
          <p class="card-description">Fetching public complaint records for the ${escapeHtml(v.year)} ${escapeHtml(v.make)} ${escapeHtml(complaintsModelName)}.</p>
        </div>
      ` : state.complaintsState.error ? `
        <div class="alert alert-serious" role="alert">
          <span class="alert-icon" aria-hidden="true">⚠️</span>
          <div class="alert-content">
            <div class="alert-title">Unable to check owner complaints from NHTSA</div>
            <div style="margin-bottom: 8px;">${escapeHtml(state.complaintsState.error)} Do not assume there are 0 complaints.</div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="retryComplaints()">
              Try again
            </button>
          </div>
        </div>
      ` : (state.recallsState.modelSelectionNeeded && !state.complaintsState.loaded) ? `
        <div class="card" style="border: 1px solid var(--status-warning);">
          <div class="card-header">
            <div class="card-title-group">
              <span class="icon-tile sm">ℹ️</span>
              <div>
                <h2 class="card-title" style="color: var(--status-warning);">Confirm vehicle model name</h2>
                <p class="card-description">Please confirm the exact model designation on the Report Overview or Safety Recalls page to load complaints.</p>
              </div>
            </div>
          </div>
          <div>
            <button type="button" class="btn btn-primary btn-sm" onclick="navigateTo('overview')">
              Return to Report overview
            </button>
          </div>
        </div>
      ` : (state.complaintsState.loaded && state.complaintsState.topProblemAreas && state.complaintsState.topProblemAreas.length === 0 && state.complaintsState.modelConfirmedInNhtsa) ? `
        <article class="card">
          <div class="card-header">
            <div class="card-title-group">
              <span class="icon-tile sm">✔</span>
              <div>
                <h2 class="card-title" style="font-size: 18px; color: var(--status-good);">No owner complaints on file with NHTSA</h2>
                <p class="card-description">NHTSA has received 0 safety complaints for the ${escapeHtml(v.year)} ${escapeHtml(v.make)} ${escapeHtml(complaintsModelName)}.</p>
              </div>
            </div>
          </div>
          <p style="margin: 0; line-height: 1.5; color: var(--text-secondary); font-size: 14px;">
            While no owner complaints have been registered with the federal government for this model year, general wear and mechanical faults can still exist on individual used cars. Always perform a test drive and have an independent certified mechanic inspect the car prior to purchase.
          </p>
          <div class="form-group" style="margin-top: 16px;">
            <label for="inspect-note-general" class="form-label" style="font-weight: 600;">
              Your general inspection notes:
            </label>
            <textarea id="inspect-note-general" class="form-textarea" rows="3" placeholder="e.g. Test drive observations, mechanic findings, or specific questions for the seller…" data-note-id="general">${escapeHtml(getNoteForArea(v, "general"))}</textarea>
          </div>
        </article>
      ` : (state.complaintsState.loaded && state.complaintsState.topProblemAreas && state.complaintsState.topProblemAreas.length === 0 && !state.complaintsState.modelConfirmedInNhtsa) ? `
        <article class="card">
          <div class="card-header">
            <div class="card-title-group">
              <span class="icon-tile sm">ℹ</span>
              <div>
                <h2 class="card-title" style="font-size: 18px;">No complaints filed under “${escapeHtml(complaintsModelName)}”</h2>
                <p class="card-description">NHTSA may list this model under a more specific name.</p>
              </div>
            </div>
          </div>
          <p style="margin: 0; line-height: 1.5; color: var(--text-secondary); font-size: 14px;">
            No complaints filed under “${escapeHtml(complaintsModelName)}” — NHTSA may list this model under a more specific name. Check <a href="https://www.nhtsa.gov" target="_blank" rel="noopener" style="color: var(--brand-text); font-weight: 600;">nhtsa.gov</a>.
          </p>
          <div class="form-group" style="margin-top: 16px;">
            <label for="inspect-note-general" class="form-label" style="font-weight: 600;">
              Your general inspection notes:
            </label>
            <textarea id="inspect-note-general" class="form-textarea" rows="3" placeholder="e.g. Test drive observations, mechanic findings, or specific questions for the seller…" data-note-id="general">${escapeHtml(getNoteForArea(v, "general"))}</textarea>
          </div>
        </article>
      ` : (state.complaintsState.loaded && state.complaintsState.topProblemAreas && state.complaintsState.topProblemAreas.length > 0) ? `
        ${renderComplaintVariantBarHtml("inspect-complaint-variant-select")}
        <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <span style="font-size: 13px; color: var(--text-secondary);">
            Showing top <strong>${state.complaintsState.topProblemAreas.length}</strong> problem areas from <strong>${state.complaintsState.totalComplaints.toLocaleString()}</strong> owner complaint(s) reported to NHTSA${state.complaintsState.matchedVariantModel ? ` under <strong>${escapeHtml(state.complaintsState.matchedVariantModel)}</strong>` : ""}
          </span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${state.complaintsState.topProblemAreas.map(area => `
            <article class="card" aria-labelledby="inspect-heading-${escapeHtml(area.key)}">
              <div class="problem-card-header">
                <div class="card-title-group" style="flex: 1;">
                  <span class="icon-tile">${area.icon}</span>
                  <div>
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 2px;">
                      <h2 id="inspect-heading-${escapeHtml(area.key)}" class="card-title" style="font-size: 18px; margin: 0;">
                        ${escapeHtml(area.title)}
                      </h2>
                      <span class="recall-campaign-badge" style="font-size: 12px; font-weight: 700;">
                        ${area.count.toLocaleString()} complaint${area.count === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p class="card-description" style="margin: 0;">${escapeHtml(area.summary)}</p>
                  </div>
                </div>
              </div>

              <!-- Safety Flags Row: crashes, fires, injuries -->
              <div class="safety-flags-group">
                ${renderSafetyFlagsHtml(area)}
              </div>

              <!-- What to look and listen for -->
              <div class="problem-area-symptoms">
                <strong>What to look and listen for:</strong> ${escapeHtml(area.whatToLookFor)}
              </div>

              <!-- Session Notes Box -->
              <div class="form-group" style="margin-top: 14px;">
                <label for="inspect-note-${escapeHtml(area.key)}" class="form-label" style="font-weight: 600; font-size: 13px;">
                  Your inspection notes for ${escapeHtml(area.title)}:
                </label>
                <textarea id="inspect-note-${escapeHtml(area.key)}" class="form-textarea" rows="2" placeholder="e.g. Test drove at 45 mph, checked for warning lights, mechanic will inspect during lift test…" data-note-id="${escapeHtml(area.key)}">${escapeHtml(getNoteForArea(v, area.key))}</textarea>
              </div>
            </article>
          `).join("")}
        </div>
      ` : `
        <div class="card" style="text-align: center; padding: 36px 20px;">
          <h2 class="card-title" style="font-size: 18px;">Owner complaints check not run yet</h2>
          <p style="margin: 8px auto 16px; font-size: 14px; color: var(--text-secondary); max-width: 420px;">
            Load live owner complaint reports from NHTSA for this vehicle.
          </p>
          <button type="button" class="btn btn-primary" onclick="retryComplaints()">
            Check owner complaints
          </button>
        </div>
      `}
    </div>
  `;

  container.appendChild(page);

  // Attach complaint variant switcher if active
  const inspectVariantSelect = page.querySelector("#inspect-complaint-variant-select");
  if (inspectVariantSelect) {
    inspectVariantSelect.addEventListener("change", () => {
      selectComplaintVariant(inspectVariantSelect.value);
    });
  }

  // Attach per-vehicle auto-save notes listeners
  page.querySelectorAll("textarea[data-note-id]").forEach(textarea => {
    textarea.addEventListener("input", () => {
      const id = textarea.getAttribute("data-note-id");
      setNoteForArea(v, id, textarea.value);
    });
  });
}

// ------------------------------------------
// View: Pre-Purchase Checklist Page
// ------------------------------------------
function renderChecklistPage(container) {
  const v = state.vehicle;
  if (!v) {
    renderEmptyVehicleState(container, "Pre-purchase checklist");
    return;
  }

  const page = document.createElement("div");
  page.className = "page-container";

  const total = CHECKLIST_ITEMS.length;
  const completed = state.checklist.size;
  const isDone = completed === total;

  // Group items by category
  const groups = {};
  CHECKLIST_ITEMS.forEach(item => {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  });

  page.innerHTML = `
    <!-- Breadcrumbs -->
    <nav class="breadcrumbs" aria-label="Breadcrumbs">
      <button class="breadcrumb-link" onclick="navigateTo('home')">Home</button>
      <span>/</span>
      <button class="breadcrumb-link" onclick="navigateTo('overview')">${escapeHtml(v.year)} ${escapeHtml(v.make)} ${escapeHtml(v.model)}</button>
      <span>/</span>
      <span aria-current="page">Pre-purchase checklist</span>
    </nav>

    <!-- Header -->
    <header class="page-header">
      <div class="page-title-group">
        <h1>Pre-purchase checklist</h1>
        <p class="page-subtitle">Take this 10-step checklist to your test drive. Tap each item as you complete it.</p>
      </div>
      <div class="page-actions">
        <button type="button" class="btn btn-secondary btn-sm" onclick="resetChecklist()" ${completed === 0 ? "disabled" : ""}>
          Reset checklist
        </button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="printReport()">
          Print checklist
        </button>
      </div>
    </header>

    <!-- Progress Card -->
    <div class="card progress-card">
      <div class="progress-header">
        <div class="big-stat">
          <span>${completed}</span>
          <span class="stat-sub">of ${total} completed</span>
        </div>
        ${isDone ? `
          <span class="status-pill good">🎉 All 10 complete!</span>
        ` : `
          <span class="status-pill info">${total - completed} remaining</span>
        `}
      </div>

      <div class="progress-bar-bg" role="progressbar" aria-valuenow="${completed}" aria-valuemin="0" aria-valuemax="${total}">
        <div class="progress-bar-fill ${isDone ? "complete" : ""}" style="width: ${(completed / total) * 100}%;"></div>
      </div>
    </div>

    ${isDone ? `
      <div class="alert alert-good" role="alert">
        <span class="alert-icon" aria-hidden="true">✔</span>
        <div class="alert-content">
          <strong>Checklist completed!</strong>
          Bring your notes to an independent certified mechanic for a full pre-purchase inspection before signing any sales agreement.
        </div>
      </div>
    ` : ""}

    <!-- Grouped Checklist -->
    <div class="dash-grid">
      ${Object.keys(groups).map(groupName => {
        const items = groups[groupName];
        const groupCompleted = items.filter(it => state.checklist.has(it.id)).length;
        return `
          <section class="card col-6 checklist-group" aria-labelledby="grp-${escapeHtml(groupName)}">
            <div class="checklist-group-title">
              <span id="grp-${escapeHtml(groupName)}">${escapeHtml(groupName)}</span>
              <span class="status-pill ${groupCompleted === items.length ? "good" : "info"}" style="font-size: 11px;">
                ${groupCompleted}/${items.length}
              </span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${items.map(item => {
                const checked = state.checklist.has(item.id);
                return `
                  <label class="checklist-item" for="chk-${item.id}">
                    <input type="checkbox" id="chk-${item.id}" class="checklist-checkbox" data-checklist-id="${item.id}" ${checked ? "checked" : ""}>
                    <span class="checklist-label ${checked ? "checked" : ""}">
                      ${escapeHtml(item.text)}
                    </span>
                  </label>
                `;
              }).join("")}
            </div>
          </section>
        `;
      }).join("")}
    </div>
  `;

  container.appendChild(page);

  // Checkbox event listeners
  page.querySelectorAll("input[data-checklist-id]").forEach(input => {
    input.addEventListener("change", () => {
      const id = parseInt(input.getAttribute("data-checklist-id"), 10);
      if (input.checked) {
        state.checklist.add(id);
      } else {
        state.checklist.delete(id);
      }
      saveChecklist();
      renderActiveView();
    });
  });
}

function resetChecklist() {
  if (confirm("Reset all 10 checklist items?")) {
    state.checklist.clear();
    saveChecklist();
    renderActiveView();
  }
}

// ------------------------------------------
// View: Seller and Costs Page
// ------------------------------------------
function renderSellerPage(container) {
  const v = state.vehicle;
  if (!v) {
    renderEmptyVehicleState(container, "Seller and costs");
    return;
  }

  const page = document.createElement("div");
  page.className = "page-container";

  page.innerHTML = `
    <!-- Breadcrumbs -->
    <nav class="breadcrumbs" aria-label="Breadcrumbs">
      <button class="breadcrumb-link" onclick="navigateTo('home')">Home</button>
      <span>/</span>
      <button class="breadcrumb-link" onclick="navigateTo('overview')">${escapeHtml(v.year)} ${escapeHtml(v.make)} ${escapeHtml(v.model)}</button>
      <span>/</span>
      <span aria-current="page">Seller and costs</span>
    </nav>

    <!-- Header -->
    <header class="page-header">
      <div class="page-title-group">
        <h1>Seller and costs</h1>
        <p class="page-subtitle">Questions to ask before you buy, and how to budget for inspections and repairs.</p>
      </div>
      <div class="page-actions">
        <button type="button" class="btn btn-secondary btn-sm" onclick="copyQuestions()">
          Copy questions
        </button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="printReport()">
          Print questions
        </button>
      </div>
    </header>

    <div class="dash-grid">
      <!-- Seller Questions Card -->
      <section class="card col-7" aria-labelledby="seller-questions-heading">
        <div class="card-header">
          <div class="card-title-group">
            <span class="icon-tile sm">💬</span>
            <div>
              <h2 id="seller-questions-heading" class="card-title">Key questions for the seller</h2>
              <p class="card-description">Ask these questions over phone or message before traveling to see the car.</p>
            </div>
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="copyQuestions()">
            Copy all questions
          </button>
        </div>

        <ol class="numbered-list">
          ${SELLER_QUESTIONS.map((q, idx) => `
            <li class="numbered-row">
              <span class="number-bubble">${idx + 1}</span>
              <div style="font-size: 14px; line-height: 1.45;">
                <strong>${escapeHtml(q)}</strong>
                <p style="margin: 4px 0 0; font-size: 12px; color: var(--text-secondary);">
                  ${idx === 0 ? "Maintenance receipts show if fluid services were performed on time, which is critical for long engine life."
                    : idx === 1 ? "Accidents affect vehicle structure, alignment, and future resale value."
                    : idx === 2 ? "A title with an active bank lien requires loan payoff before title transfer can occur."
                    : idx === 3 ? "Gives the seller an opportunity to disclose known flaws before your mechanic spots them."
                    : "A seller who refuses an independent inspection is usually hiding an expensive fault."}
                </p>
              </div>
            </li>
          `).join("")}
        </ol>
      </section>

      <!-- Repair & Cost Planning Card -->
      <section class="card col-5" aria-labelledby="cost-planning-heading">
        <div class="card-header">
          <div class="card-title-group">
            <span class="icon-tile sm">💰</span>
            <div>
              <h2 id="cost-planning-heading" class="card-title">Budgeting & repair planning</h2>
              <p class="card-description">Costs to expect with any used car purchase</p>
            </div>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px; font-size: 14px; line-height: 1.45;">
          <div class="spec-item">
            <span class="spec-label">Pre-Purchase Inspection (PPI)</span>
            <span class="spec-value">$150 – $250</span>
            <span class="spec-note">Paid to an independent shop. Best money you will spend; can save thousands in hidden defects.</span>
          </div>

          <div class="spec-item">
            <span class="spec-label">Safety Recall Repairs</span>
            <span class="spec-value">$0 (Free by Law)</span>
            <span class="spec-note">NHTSA safety recalls must be performed free of charge by authorized franchise dealerships.</span>
          </div>

          <div class="spec-item">
            <span class="spec-label">Immediate Catch-Up Maintenance</span>
            <span class="spec-value">$300 – $600</span>
            <span class="spec-note">Budget for fresh oil, engine air filter, cabin filter, and wiper blades immediately after purchase.</span>
          </div>

          <div class="spec-item">
            <span class="spec-label">Emergency Repair Reserve</span>
            <span class="spec-value">$1,000+</span>
            <span class="spec-note">Keep a dedicated cash cushion for unexpected battery, brake, or tire replacement during year one.</span>
          </div>
        </div>
      </section>
    </div>
  `;

  container.appendChild(page);
}

function copyQuestions() {
  const text = SELLER_QUESTIONS.map((q, i) => `${i + 1}. ${q}`).join("\n");
  copyToClipboard(text, "Seller questions copied to clipboard!");
}

// ------------------------------------------
// View: Empty Vehicle State Fallback
// ------------------------------------------
function renderEmptyVehicleState(container, title) {
  const page = document.createElement("div");
  page.className = "page-container";

  page.innerHTML = `
    <header class="page-header">
      <div class="page-title-group">
        <h1>${escapeHtml(title)}</h1>
        <p class="page-subtitle">No vehicle selected yet.</p>
      </div>
    </header>

    <div class="card" style="text-align: center; padding: 48px 24px;">
      <div style="font-size: 48px; margin-bottom: 12px;">🚗</div>
      <h2 class="card-title" style="font-size: 20px;">Please select a vehicle first</h2>
      <p style="margin: 8px auto 20px; font-size: 14px; color: var(--text-secondary); max-width: 420px;">
        Enter a VIN or pick a vehicle on the Home page to view live safety recalls, vehicle specifications, and inspection items.
      </p>
      <div>
        <button type="button" class="btn btn-primary" onclick="navigateTo('home')">
          Go to vehicle lookup
        </button>
      </div>
    </div>
  `;

  container.appendChild(page);
}

// ==========================================
// 10. Print Report Generator
// ==========================================

function printReport() {
  const v = state.vehicle;
  const printArea = document.getElementById("print-area");
  if (!printArea) return;

  const fetchTime = state.complaintsState.fetchTimestamp || state.recallsState.fetchTimestamp || new Date().toLocaleString();
  const printEngine = v ? ([v.engineDisplacement, v.engineConfig].filter(Boolean).join(" ") || SPEC_NOT_AVAILABLE) : "";
  const complaintsLoaded = Boolean(
    state.complaintsState.loaded &&
    !state.complaintsState.loading &&
    !state.complaintsState.error
  );

  printArea.innerHTML = `
    <h1>Lemonaid Vehicle Pre-Purchase Report</h1>
    <p class="muted">
      Generated ${new Date().toLocaleDateString()} · Data: NHTSA public datasets (vPIC, Recalls, Complaints) · Fetched: ${escapeHtml(fetchTime)}
    </p>

    <div class="print-section">
      <h2>Vehicle Details</h2>
      <p>
        <strong>Vehicle:</strong> ${v ? `${escapeHtml(v.year)} ${escapeHtml(v.make)} ${escapeHtml(v.model)}` : "No vehicle selected"}<br>
        <strong>VIN:</strong> ${v && v.vin ? escapeHtml(v.vin) : "Not provided (Check exact VIN at nhtsa.gov/recalls)"}<br>
        <strong>Trim / Body:</strong> ${v ? `${escapeHtml(v.trim || SPEC_NOT_AVAILABLE)} · ${escapeHtml(v.bodyClass || SPEC_NOT_AVAILABLE)}` : ""}<br>
        <strong>Engine / Drivetrain:</strong> ${v ? `${escapeHtml(printEngine)} · ${escapeHtml(formatDriveType(v.driveType) || SPEC_NOT_AVAILABLE)} · ${escapeHtml(v.fuelType || SPEC_NOT_AVAILABLE)}` : ""}
      </p>
    </div>

    <div class="print-section">
      <h2>Safety Recalls</h2>
      <p class="muted">
        NHTSA recall data is by vehicle model line. Always verify open recall status for this specific VIN at: https://www.nhtsa.gov/recalls
      </p>
      ${state.recallsState.loading ? `
        <p>Safety recall check is still in progress. Re-print once the check finishes.</p>
      ` : state.recallsState.error ? `
        <p>⚠️ Unable to verify safety recalls from NHTSA (${escapeHtml(state.recallsState.error)}). Do not assume 0 recalls. Check directly at https://www.nhtsa.gov/recalls.</p>
      ` : state.recallsState.dataUnavailable ? `
        <p>ℹ Safety recall records unavailable from NHTSA for this make and year. Do not assume 0 recalls. Check directly at https://www.nhtsa.gov/recalls.</p>
      ` : state.recallsState.modelSelectionNeeded ? `
        <p>⚠️ Model name confirmation required for NHTSA recall registry. Check directly at https://www.nhtsa.gov/recalls.</p>
      ` : (state.recallsState.recalls && state.recallsState.recalls.length === 0 && state.recallsState.modelRecognizedByNhtsa) ? `
        <p>✔ No safety recall campaigns on file from NHTSA for this model year (${escapeHtml(state.recallsState.selectedNhtsaModel || (v ? v.model : ""))}).</p>
      ` : (state.recallsState.recalls && state.recallsState.recalls.length === 0 && !state.recallsState.modelRecognizedByNhtsa) ? `
        <p>⚠️ No results for this model name — this may be a naming mismatch, not a clean record. Check directly at https://www.nhtsa.gov/recalls.</p>
      ` : (state.recallsState.recalls && state.recallsState.recalls.length > 0) ? `
        <p><strong>${state.recallsState.recalls.length} safety recall campaign(s) on file from NHTSA:</strong></p>
        <ul>
          ${state.recallsState.recalls.map(r => {
            const t = translateRecall(r);
            return `
              <li style="margin-bottom: 8pt;">
                <strong>${escapeHtml(t.plainTitle)}</strong> (NHTSA #${escapeHtml(t.campaignNumber)})<br>
                <span><strong>Risk:</strong> ${escapeHtml(t.plainRisk)}</span><br>
                <span><strong>Remedy:</strong> ${escapeHtml(t.plainRemedy)}</span>
              </li>
            `;
          }).join("")}
        </ul>
      ` : `
        <p>Safety recall lookup has not been performed yet. Check open recalls at https://www.nhtsa.gov/recalls.</p>
      `}
    </div>

    <div class="print-section">
      <h2>Things to Check: Top Problem Areas (NHTSA Owner Complaints)</h2>
      ${(complaintsLoaded && state.complaintsState.topProblemAreas && state.complaintsState.topProblemAreas.length > 0) ? `
        <p class="muted">
          ${state.complaintsState.matchedVariantModel
            ? `Complaints filed under <strong>${escapeHtml(state.complaintsState.matchedVariantModel)}</strong> (${state.complaintsState.totalComplaints.toLocaleString()} total owner complaint(s) on file for this model year).`
            : `NHTSA public records show ${state.complaintsState.totalComplaints.toLocaleString()} total owner complaint(s) on file for this vehicle model year.`}
          ${(state.complaintsState.variantResults && state.complaintsState.variantResults.length > 1)
            ? ` Other NHTSA variants with complaints: ${state.complaintsState.variantResults
                .filter(vr => vr.model !== state.complaintsState.matchedVariantModel)
                .map(vr => `${escapeHtml(vr.model)} (${vr.totalComplaints.toLocaleString()})`)
                .join(", ")}.`
            : ""}
        </p>
      ` : (complaintsLoaded && state.complaintsState.modelConfirmedInNhtsa) ? `
        <p class="muted">
          NHTSA public records show 0 total owner complaint(s) on file for this vehicle model year.
        </p>
      ` : ""}
      ${state.complaintsState.loading ? `
        <p>Owner complaints check is still in progress. Re-print once loading finishes.</p>
      ` : state.complaintsState.error ? `
        <p>⚠️ Unable to verify owner complaints from NHTSA (${escapeHtml(state.complaintsState.error)}). Do not assume 0 complaints.</p>
      ` : (complaintsLoaded && state.complaintsState.topProblemAreas && state.complaintsState.topProblemAreas.length === 0 && state.complaintsState.modelConfirmedInNhtsa) ? `
        <p>✔ No owner complaints on file with NHTSA for this model year.</p>
        <p>
          <strong>General Inspection Notes:</strong><br>
          <em>${escapeHtml(getNoteForArea(v, "general") || "No notes recorded.")}</em>
        </p>
      ` : (complaintsLoaded && state.complaintsState.topProblemAreas && state.complaintsState.topProblemAreas.length === 0 && !state.complaintsState.modelConfirmedInNhtsa) ? `
        <p>No complaints filed under “${escapeHtml(state.complaintsState.selectedModel || (v ? v.model : ""))}” — NHTSA may list this model under a more specific name. Check nhtsa.gov.</p>
        <p>
          <strong>General Inspection Notes:</strong><br>
          <em>${escapeHtml(getNoteForArea(v, "general") || "No notes recorded.")}</em>
        </p>
      ` : (complaintsLoaded && state.complaintsState.topProblemAreas && state.complaintsState.topProblemAreas.length > 0) ? `
        ${state.complaintsState.topProblemAreas.map(area => {
          const safetyInfo = [];
          if (area.crashes > 0) safetyInfo.push(`${area.crashes} crash(es)`);
          if (area.fires > 0) safetyInfo.push(`${area.fires} fire(s)`);
          if (area.injuries > 0) safetyInfo.push(`${area.injuries} injury/injuries`);
          const safetyText = safetyInfo.length > 0 ? safetyInfo.join(", ") + " reported" : "No crashes, fires, or injuries reported";
          const userNote = getNoteForArea(v, area.key) || "No notes recorded.";
          return `
            <div style="margin-bottom: 12pt; break-inside: avoid;">
              <p style="margin: 0 0 2pt;">
                <strong>${escapeHtml(area.title)}</strong> (${area.count.toLocaleString()} complaint${area.count === 1 ? "" : "s"})<br>
                <span><strong>Safety record:</strong> ${escapeHtml(safetyText)}</span><br>
                <span><strong>What to look and listen for:</strong> ${escapeHtml(area.whatToLookFor)}</span><br>
                <span><strong>Your inspection notes:</strong> <em>${escapeHtml(userNote)}</em></span>
              </p>
            </div>
          `;
        }).join("")}
      ` : `
        <p>Owner complaints check has not been performed yet.</p>
      `}
    </div>

    <div class="print-section">
      <h2>Pre-Purchase Checklist (${state.checklist.size} of ${CHECKLIST_ITEMS.length} completed)</h2>
      ${CHECKLIST_ITEMS.map(it => `
        <div class="check-item">
          [ ${state.checklist.has(it.id) ? "X" : " "} ] ${escapeHtml(it.text)}
        </div>
      `).join("")}
    </div>

    <div class="print-section">
      <h2>Questions for the Seller</h2>
      <ol>
        ${SELLER_QUESTIONS.map(q => `<li>${escapeHtml(q)}</li>`).join("")}
      </ol>
    </div>

    <p class="muted" style="margin-top: 18pt; border-top: 1pt solid #ccc; padding-top: 6pt;">
      Lemonaid is an informational decision-support tool built from public NHTSA data. Always arrange an independent inspection by a certified mechanic prior to purchase.
    </p>
  `;

  window.print();
}

// ==========================================
// 11. Helper Utilities
// ==========================================

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function capitalizeWords(str) {
  if (!str) return "";
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// Initialize application on DOM content loaded
document.addEventListener("DOMContentLoaded", initApp);
