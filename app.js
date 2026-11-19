/**
 * Lemonaid - Client-side Application Logic
 * NHTSA vPIC & Safety Recalls Integration
 */

// ==========================================
// 1. Constants & Reference Data
// ==========================================

const NHTSA_RECALLS_EXTERNAL_URL = "https://www.nhtsa.gov/recalls";
const TIMEOUT_MS = 15000;

// Curated public sample VINs verified against NHTSA vPIC
const SAMPLE_VINS = [
  { vin: "1HGCV1F30JA000000", label: "2018 Honda Accord" },
  { vin: "2T3C1RFV0MC000000", label: "2021 Toyota RAV4" },
  { vin: "1FTFW1E80KF000000", label: "2019 Ford F-150" }
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

// Things to inspect guide
const INSPECT_AREAS = [
  {
    id: 0,
    title: "Engine and warning lights",
    icon: "⚙️",
    description: "Look for warning lights on the dashboard, listen for knocking or ticking noises, and check for hesitation or rough idling.",
    whatToLookFor: "When turning the ignition, check that all dashboard warning lights illuminate briefly and turn off once the engine starts. A blinking check engine light indicates an active misfire."
  },
  {
    id: 1,
    title: "Transmission and drivetrain",
    icon: "🕹️",
    description: "During your test drive, notice hard shifts, unusual vibration, or delays when accelerating from a stop.",
    whatToLookFor: "Shifting into Drive or Reverse should take less than a second without a thud. While driving, gear shifts should feel prompt and smooth."
  },
  {
    id: 2,
    title: "Brakes and steering",
    icon: "🛑",
    description: "Test braking responsiveness, listen for squealing or grinding, and check that the car stays straight when you brake.",
    whatToLookFor: "A soft or spongy brake pedal can indicate air in brake lines or worn master cylinders. Vibrations through the pedal usually mean warped brake rotors."
  },
  {
    id: 3,
    title: "Electrical accessories and climate",
    icon: "⚡",
    description: "Test the air conditioner, heater, infotainment screen, power windows, mirrors, door locks, and backup camera.",
    whatToLookFor: "Make sure cold A/C blows within 60 seconds. Test every window switch from the driver door and individually."
  },
  {
    id: 4,
    title: "Tires, body, and suspension",
    icon: "🛞",
    description: "Inspect tire tread depth and alignment wear. Look for uneven body panel gaps or mismatched paint that may indicate past collision repairs.",
    whatToLookFor: "Tires worn heavily on the inner or outer edge signal alignment or suspension problems. Sight down the sides in good sunlight to spot body filler waves."
  }
];

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

// Component jargon dictionary for plain-English translations
const COMPONENT_TRANSLATIONS = [
  { key: "AIR BAG", title: "Air bags: may fail to deploy or could cause injury in a crash" },
  { key: "SERVICE BRAKES", title: "Brake system: potential reduced braking power or increased stopping distance" },
  { key: "PARKING BRAKE", title: "Parking brake: vehicle could roll away unexpectedly" },
  { key: "ELECTRICAL", title: "Electrical system: risk of short circuit, sudden shutdown, or fire" },
  { key: "ENGINE", title: "Engine & cooling: risk of sudden stall, mechanical failure, or engine fire" },
  { key: "FUEL SYSTEM", title: "Fuel system: risk of fuel leak, engine stall, or fire hazard" },
  { key: "STEERING", title: "Steering: potential stiffness or sudden loss of steering control" },
  { key: "SUSPENSION", title: "Suspension: loose or broken components affecting vehicle handling" },
  { key: "SEAT BELT", title: "Seat belts: restraint may fail to lock properly in a collision" },
  { key: "SEAT", title: "Seats & latches: seat structure or latch may fail in a crash" },
  { key: "TIRE", title: "Tires: risk of tread separation, sudden pressure loss, or blowout" },
  { key: "WHEEL", title: "Wheels: rim damage or loosening lug nuts affecting stability" },
  { key: "VISIBILITY/WIPER", title: "Windshield wipers: wipers may fail during adverse weather" },
  { key: "BACK OVER PREVENTION", title: "Backup camera: rearview screen may fail to display" },
  { key: "CAMERA", title: "Backup camera: rearview screen may fail to display" },
  { key: "FORWARD COLLISION", title: "Collision avoidance sensors: automatic emergency braking malfunction" },
  { key: "VISIBILITY", title: "Visibility & glass: camera, defrost, or window failure" },
  { key: "EXTERIOR LIGHTING", title: "Exterior lighting: headlights or exterior lamps may fail or not dim properly" },
  { key: "LIGHTING", title: "Exterior lighting: headlights, brake lights, or turn signals may fail" },
  { key: "POWER TRAIN", title: "Powertrain & transmission: unexpected gear shift, rollaway, or loss of drive power" },
  { key: "TRANSMISSION", title: "Transmission: risk of unexpected gear selection, rollaway, or loss of drive" },
  { key: "TAILGATE", title: "Tailgate latch: tailgate may unlatch unexpectedly while driving" },
  { key: "LATCH", title: "Door & tailgate latches: doors or tailgate may open unexpectedly while driving" },
  { key: "LOCK", title: "Door locks & latches: doors may open unexpectedly while driving" },
  { key: "EQUIPMENT:OTHER:LABELS", title: "Safety labels: missing warning labels or occupant instructions" },
  { key: "LABEL", title: "Safety labels: missing warning labels or critical instructions" },
  { key: "ELECTRONIC STABILITY", title: "Electronic stability control: traction system may fail to prevent skids" },
  { key: "STRUCTURE", title: "Vehicle structure & frame: weld defect or corrosion affecting safety" },
  { key: "CHILD SEAT", title: "Child safety seat anchors: child seat may not secure correctly" },
  { key: "HYBRID", title: "High-voltage battery & electrical: risk of battery overheating, stall, or shock" },
  { key: "DEFROST", title: "Windshield defrosting & defogging: reduced visibility in cold or wet weather" }
];

// ==========================================
// 2. Global State
// ==========================================

const state = {
  currentPage: "home",
  theme: "light",
  vehicle: null,
  recentVehicles: [],
  checklist: new Set(),
  notes: {},
  allMakes: [...DEFAULT_POPULAR_MAKES],
  dropdownModels: [],
  loadingModels: false,
  
  // Recalls live state
  recallsState: {
    loading: false,
    error: null,
    modelSelectionNeeded: false,
    dataUnavailable: false,
    nhtsaRecallModels: [],
    selectedNhtsaModel: null,
    recalls: null,
    fetchTimestamp: null
  }
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
      state.recentVehicles = JSON.parse(savedRecents);
    }
  } catch (e) {
    console.error("Failed to load recents from localStorage", e);
  }

  // Checklist
  try {
    const savedChecklist = localStorage.getItem("lemonaid-checklist");
    if (savedChecklist) {
      state.checklist = new Set(JSON.parse(savedChecklist));
    }
  } catch (e) {
    console.error("Failed to load checklist", e);
  }

  // Notes
  try {
    const savedNotes = localStorage.getItem("lemonaid-notes");
    if (savedNotes) {
      state.notes = JSON.parse(savedNotes);
    }
  } catch (e) {
    console.error("Failed to load notes", e);
  }
}

function saveRecentVehicles() {
  try {
    localStorage.setItem("lemonaid-recent", JSON.stringify(state.recentVehicles));
  } catch (e) {
    console.error("Failed to save recents", e);
  }
}

function saveChecklist() {
  try {
    localStorage.setItem("lemonaid-checklist", JSON.stringify(Array.from(state.checklist)));
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
      throw new Error(`HTTP error ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      throw new Error("Request timed out after 15 seconds. Please try again.");
    }
    throw err;
  }
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
  updateModelDropdownState();
  try {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${encodeURIComponent(year)}?format=json`;
    const data = await fetchWithTimeout(url);
    state.loadingModels = false;
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
    state.dropdownModels = [];
    console.error("Failed to load models for make/year:", err);
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
  
  // Create standardized vehicle object
  const vehicle = {
    vin: cleanVin,
    year: r.ModelYear || "",
    make: capitalizeWords(r.Make || ""),
    model: r.Model || "",
    trim: r.Trim || "Base",
    bodyClass: r.BodyClass || "Not specified",
    engineDisplacement: r.DisplacementL ? `${r.DisplacementL}L` : "",
    engineConfig: r.EngineConfiguration ? `${r.EngineConfiguration} (${r.EngineCylinders || ""} cyl)` : (r.EngineCylinders ? `${r.EngineCylinders} cylinders` : "Standard"),
    fuelType: r.FuelTypePrimary || "Gasoline",
    driveType: r.DriveType || "Not specified",
    plantCountry: r.PlantCountry || "",
    plantCity: r.PlantCity || "",
    errorCode: errorCode,
    errorText: errorCode !== "0" && errorCode !== "" ? errorText : null
  };

  if (!vehicle.year && !vehicle.make && !vehicle.model) {
    throw new Error(errorText || "Could not decode vehicle details from this VIN. Please verify the characters.");
  }

  return vehicle;
}

// ==========================================
// 5. Recall Matching & Fetching Engine
// ==========================================

/**
 * Checks recalls for the given vehicle.
 * Implements strict requirement:
 * 1. Fetch NHTSA's recall model list for this make and year.
 * 2. Match vehicle model name against recall models.
 * 3. If exact or normalized match found, fetch recalls for that matched model.
 * 4. If no match found or ambiguous, prompt user to pick the model.
 * 5. NEVER show "0 recalls" on failure or mismatch.
 */
async function loadRecallsForVehicle(vehicle, manualModelChoice = null) {
  if (!vehicle || !vehicle.year || !vehicle.make) return;

  const year = vehicle.year.trim();
  const make = vehicle.make.trim();
  const targetModel = (manualModelChoice || vehicle.model || "").trim();

  state.recallsState = {
    loading: true,
    error: null,
    modelSelectionNeeded: false,
    dataUnavailable: false,
    nhtsaRecallModels: state.recallsState.nhtsaRecallModels || [],
    selectedNhtsaModel: manualModelChoice || null,
    recalls: null,
    fetchTimestamp: null
  };
  renderActiveView();

  try {
    let matchedRecallModel = manualModelChoice;

    // Step 1: If user hasn't explicitly selected a NHTSA recall model, check NHTSA model list first
    if (!matchedRecallModel) {
      const modelsUrl = `https://api.nhtsa.gov/products/vehicle/models?modelYear=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}&issueType=r`;
      let recallModelsData;
      try {
        recallModelsData = await fetchWithTimeout(modelsUrl);
      } catch (err) {
        state.recallsState.loading = false;
        state.recallsState.error = "Unable to connect to NHTSA's recall model directory. Please verify your connection or try again.";
        renderActiveView();
        return;
      }

      const rawList = (recallModelsData && (recallModelsData.results || recallModelsData.Results)) || [];
      const recallModels = [...new Set(rawList.map(item => {
        if (typeof item === "string") return item.trim();
        return (item.model || item.Model || item.modelName || item.ModelName || "").trim();
      }).filter(Boolean))].sort((a, b) => a.localeCompare(b));

      state.recallsState.nhtsaRecallModels = recallModels;

      if (recallModels.length === 0) {
        // NHTSA returned 0 model records on file for this make and year in its recall directory
        state.recallsState.loading = false;
        state.recallsState.dataUnavailable = true;
        state.recallsState.error = null;
        state.recallsState.recalls = null;
        state.recallsState.modelSelectionNeeded = false;
        renderActiveView();
        return;
      }

      // Attempt matching against NHTSA recall model list
      const normTarget = normalizeModelString(targetModel);

      // 1. Exact case-insensitive match
      const exactMatch = recallModels.find(m => m.trim().toLowerCase() === targetModel.toLowerCase());

      // 2. Normalized alphanumeric match (e.g. "F-150" vs "F150" or "CR-V" vs "CRV")
      const normMatch = exactMatch || recallModels.find(m => normalizeModelString(m) === normTarget);

      // 3. Unique prefix or substring match if unambiguous
      const candidates = recallModels.filter(m => {
        const nm = normalizeModelString(m);
        return nm === normTarget || nm.startsWith(normTarget) || normTarget.startsWith(nm);
      });
      const prefixMatch = normMatch || (candidates.length === 1 ? candidates[0] : null);

      if (prefixMatch) {
        matchedRecallModel = prefixMatch;
        state.recallsState.selectedNhtsaModel = matchedRecallModel;
      } else {
        // Model did NOT match NHTSA recall model list:
        // Never show "0 recalls". Prompt the user to pick the right model!
        state.recallsState.loading = false;
        state.recallsState.modelSelectionNeeded = true;
        state.recallsState.selectedNhtsaModel = null;
        state.recallsState.recalls = null;
        renderActiveView();
        return;
      }
    } else {
      state.recallsState.selectedNhtsaModel = matchedRecallModel;
    }

    // Step 2: Fetch recalls for the matched/selected model
    const queryModel = matchedRecallModel || targetModel;
    const recallsUrl = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(queryModel)}&modelYear=${encodeURIComponent(year)}`;

    const recallResults = await fetchWithTimeout(recallsUrl);
    const recalls = (recallResults && (recallResults.results || recallResults.Results)) || [];

    state.recallsState.loading = false;
    state.recallsState.error = null;
    state.recallsState.dataUnavailable = false;
    state.recallsState.modelSelectionNeeded = false;
    state.recallsState.recalls = recalls;
    state.recallsState.fetchTimestamp = new Date().toLocaleString([], {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  } catch (err) {
    state.recallsState.loading = false;
    state.recallsState.recalls = null;
    state.recallsState.error = err.message || "Failed to load safety recalls from NHTSA. Please try again.";
  }

  renderActiveView();
}

async function promptModelSelection() {
  if (!state.vehicle) return;
  state.recallsState.modelSelectionNeeded = true;
  state.recallsState.recalls = null;
  if (!state.recallsState.nhtsaRecallModels || state.recallsState.nhtsaRecallModels.length === 0) {
    state.recallsState.loading = true;
    renderActiveView();
    try {
      const modelsUrl = `https://api.nhtsa.gov/products/vehicle/models?modelYear=${encodeURIComponent(state.vehicle.year.trim())}&make=${encodeURIComponent(state.vehicle.make.trim())}&issueType=r`;
      const data = await fetchWithTimeout(modelsUrl);
      const rawList = (data && (data.results || data.Results)) || [];
      state.recallsState.nhtsaRecallModels = [...new Set(rawList.map(item => {
        if (typeof item === "string") return item.trim();
        return (item.model || item.Model || item.modelName || item.ModelName || "").trim();
      }).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    } catch {}
    state.recallsState.loading = false;
  }
  renderActiveView();
}

function normalizeModelString(str) {
  return (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Plain-English translation for recall cards
function translateRecall(recall) {
  const component = (recall.Component || "Vehicle Safety System").trim();
  const summary = (recall.Summary || "").trim();
  const rawConsequence = (recall.Conequence || recall.Consequence || "").trim();
  const rawRemedy = (recall.Remedy || "").trim();
  const campaignNumber = recall.NHTSACampaignNumber || "NHTSA Campaign";
  const reportDate = recall.ReportReceivedDate || "";
  const notes = recall.Notes || "";
  const parkIt = Boolean(recall.parkIt);
  const parkOutSide = Boolean(recall.parkOutSide);

  // Translate component title
  let plainTitle = "";
  const compUpper = component.toUpperCase();
  for (const item of COMPONENT_TRANSLATIONS) {
    if (compUpper.includes(item.key)) {
      plainTitle = item.title;
      break;
    }
  }
  if (!plainTitle) {
    const cleaned = component.replace(/[:\/_]+/g, " - ").replace(/\s+/g, " ").trim();
    plainTitle = `${capitalizeWords(cleaned)}: safety component defect`;
  }

  // Plain-English Risk
  let plainRisk = rawConsequence;
  if (!plainRisk) {
    plainRisk = summary ? (summary.length > 200 ? summary.substring(0, 200) + "…" : summary) : "Increases the risk of a crash, injury, or unexpected vehicle stall.";
  }

  // Plain-English Remedy
  let plainRemedy = rawRemedy;
  if (!plainRemedy) {
    plainRemedy = "Authorized franchise dealerships will inspect and repair the defective components free of charge.";
  } else if (!plainRemedy.toLowerCase().includes("free of charge") && !plainRemedy.toLowerCase().includes("free")) {
    plainRemedy += " (By federal law, safety recall repairs are provided free of charge by authorized franchise dealerships.)";
  }

  const isHighSeverity = parkIt || parkOutSide || /crash|fire|injury|injuries|stall|loss of steering|loss of brake|rollaway|unintended/i.test(plainRisk + plainTitle);

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
      return v.includes("suv") ? "Sport Utility Vehicle offering higher ground clearance and cargo space."
        : v.includes("sedan") ? "Traditional 4-door passenger car with a separate trunk."
        : v.includes("truck") || v.includes("pickup") ? "Light truck with an open rear cargo bed."
        : v.includes("coupe") ? "Two-door passenger vehicle with a sporty profile."
        : v.includes("hatchback") ? "Compact car with an upward-swinging rear door for cargo."
        : "Standard passenger vehicle body configuration.";
    case "Engine":
      return "Engine displacement in liters and cylinder configuration.";
    case "Fuel type":
      return v.includes("hybrid") ? "Uses both a gasoline engine and an electric motor to save fuel."
        : v.includes("electric") ? "100% battery-electric vehicle with zero tailpipe emissions."
        : v.includes("diesel") ? "Runs on diesel fuel for strong towing torque and highway efficiency."
        : "Runs on standard unleaded pump gasoline.";
    case "Drive type":
      return v.includes("fwd") || v.includes("front") ? "Front-wheel drive delivers good traction in rain and better fuel economy."
        : v.includes("awd") || v.includes("all") ? "All-wheel drive sends power to all 4 wheels for enhanced winter grip."
        : v.includes("4wd") || v.includes("4x4") ? "Four-wheel drive with selectable low range for heavy off-road or snow."
        : v.includes("rwd") || v.includes("rear") ? "Rear-wheel drive provides balanced sporty handling on dry pavement."
        : "How engine power is transmitted to the road wheels.";
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
  state.vehicle = vehicle;
  
  // Add to recents
  const label = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  state.recentVehicles = state.recentVehicles.filter(v => 
    !(v.year === vehicle.year && v.make === vehicle.make && v.model === vehicle.model)
  );
  state.recentVehicles.unshift({ ...vehicle, label });
  if (state.recentVehicles.length > 5) state.recentVehicles.pop();
  saveRecentVehicles();

  // Trigger recall check
  loadRecallsForVehicle(vehicle);

  // Navigate to overview
  navigateTo("overview");
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
            <input type="text" id="vin-input" class="form-input vin-input" placeholder="e.g. 1HGCV1F30JA000000" maxlength="17" autocomplete="off" spellcheck="false" required>
            <button type="submit" id="vin-submit-btn" class="btn btn-primary" style="flex-shrink: 0;">
              <span>Look up</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
          <div id="vin-format-hint" class="form-hint" style="min-height: 18px;">0/17 characters</div>
        </form>

        <!-- Sample VIN Buttons -->
        <div class="form-group">
          <span class="form-label" style="font-size: 12px; color: var(--text-secondary);">Or try a verified public sample VIN:</span>
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
                  ${Array.from({ length: 26 }, (_, i) => 2025 - i).map(y => `<option value="${y}" ${y === 2018 ? "selected" : ""}>${y}</option>`).join("")}
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
          <h3 class="card-title" style="font-size: 16px;">Things to Inspect</h3>
          <p class="card-description">Key mechanical symptoms to watch for on engine, transmission, brakes, and electrical systems with session notes.</p>
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
        vinHint.textContent = err.message || "Failed to decode VIN. Please check the characters.";
        showToast("VIN lookup failed. Please check the characters.");
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
        trim: "Standard",
        bodyClass: "Passenger Vehicle",
        engineDisplacement: "",
        engineConfig: "Standard",
        fuelType: "Gasoline",
        driveType: "Standard",
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
  if (!select) return;
  select.disabled = false;
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
  const nhtsaModels = state.recallsState.nhtsaRecallModels || [];
  const selectedModel = state.recallsState.selectedNhtsaModel || v.model;

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
        <div class="alert-title">Data: NHTSA public datasets (vPIC, Recalls)</div>
        <div>
          ${state.recallsState.fetchTimestamp ? `Fetched live from NHTSA: <strong>${escapeHtml(state.recallsState.fetchTimestamp)}</strong>. ` : "Connected to NHTSA live endpoints. "}
          Always verify individual vehicle repair status with the official VIN lookup at 
          <a href="${NHTSA_RECALLS_EXTERNAL_URL}" target="_blank" rel="noopener" style="color: var(--brand-text); font-weight: 600;">nhtsa.gov/recalls</a>.
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
              <p class="card-description">Decoded directly from NHTSA public vehicle records</p>
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
            <span class="spec-value">${escapeHtml(v.trim || "Base / Standard")}</span>
            <span class="spec-note">${getSpecExplanation("Trim", v.trim)}</span>
          </div>

          <div class="spec-item">
            <span class="spec-label">Body style</span>
            <span class="spec-value">${escapeHtml(v.bodyClass || "Not specified")}</span>
            <span class="spec-note">${getSpecExplanation("Body style", v.bodyClass)}</span>
          </div>

          <div class="spec-item">
            <span class="spec-label">Engine</span>
            <span class="spec-value">${escapeHtml(v.engineDisplacement ? `${v.engineDisplacement} ${v.engineConfig}` : v.engineConfig)}</span>
            <span class="spec-note">${getSpecExplanation("Engine", "")}</span>
          </div>

          <div class="spec-item">
            <span class="spec-label">Fuel type</span>
            <span class="spec-value">${escapeHtml(v.fuelType || "Gasoline")}</span>
            <span class="spec-note">${getSpecExplanation("Fuel type", v.fuelType)}</span>
          </div>

          <div class="spec-item">
            <span class="spec-label">Drive type</span>
            <span class="spec-value">${escapeHtml(v.driveType || "Standard")}</span>
            <span class="spec-note">${getSpecExplanation("Drive type", v.driveType)}</span>
          </div>

          ${v.plantCountry ? `
            <div class="spec-item">
              <span class="spec-label">Assembled in</span>
              <span class="spec-value">${escapeHtml(v.plantCity ? `${v.plantCity}, ${v.plantCountry}` : v.plantCountry)}</span>
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
            ` : (recalls !== null && recalls.length === 0) ? `
              <span class="status-pill good">✔ 0 recalls on file</span>
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
            ` : (recalls !== null && recalls.length === 0) ? `
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
              <p class="card-description">Mechanical symptoms to watch and listen for</p>
            </div>
          </div>
        </div>

        <ul class="numbered-list">
          ${INSPECT_AREAS.slice(0, 3).map(area => `
            <li class="numbered-row">
              <span class="number-bubble">${area.icon}</span>
              <div style="font-size: 13px; line-height: 1.4;">
                <strong>${escapeHtml(area.title)}</strong>
                <p style="margin: 2px 0 0; color: var(--text-secondary); font-size: 12px;">${escapeHtml(area.description)}</p>
              </div>
            </li>
          `).join("")}
        </ul>

        <div>
          <button type="button" class="btn btn-subtle btn-sm" style="padding-left: 0;" onclick="navigateTo('inspect')">
            Open full inspection points & notes →
          </button>
        </div>
      </section>
    </div>
  `;

  container.appendChild(page);

  // Setup overview model picker listeners if active
  const overviewModelForm = page.querySelector("#overview-model-pick-form");
  if (overviewModelForm) {
    overviewModelForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const sel = page.querySelector("#overview-model-select");
      if (sel && sel.value) {
        loadRecallsForVehicle(state.vehicle, sel.value);
      }
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
          ` : (recalls !== null && recalls.length === 0) ? `
            <span class="status-pill good">✔ 0 recalls on file</span>
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
      ` : (recalls !== null && recalls.length === 0) ? `
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
                    <span class="status-pill warning">Safety Recall</span>
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
      if (select && select.value) {
        loadRecallsForVehicle(state.vehicle, select.value);
      }
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
        <p class="page-subtitle">Mechanical symptoms, inspection points, and signs of trouble to discuss with an independent mechanic.</p>
      </div>
      <div class="page-actions">
        <button type="button" class="btn btn-secondary btn-sm" onclick="printReport()">Print notes</button>
      </div>
    </header>

    <div class="alert alert-info">
      <span class="alert-icon" aria-hidden="true">💡</span>
      <div class="alert-content">
        <strong>Session Notes:</strong> Any notes you type below are automatically saved for this vehicle and included when you print your report.
      </div>
    </div>

    <!-- Inspection Areas List -->
    <div style="display: flex; flex-direction: column; gap: 16px;">
      ${INSPECT_AREAS.map(area => `
        <article class="card" aria-labelledby="inspect-heading-${area.id}">
          <div class="card-header">
            <div class="card-title-group">
              <span class="icon-tile">${area.icon}</span>
              <div>
                <h2 id="inspect-heading-${area.id}" class="card-title" style="font-size: 18px;">${escapeHtml(area.title)}</h2>
                <p class="card-description">${escapeHtml(area.description)}</p>
              </div>
            </div>
          </div>

          <div style="background-color: var(--card-subtle-bg); border-radius: var(--radius-sm); padding: 12px 14px; font-size: 13px; line-height: 1.45;">
            <strong>What to look and listen for:</strong> ${escapeHtml(area.whatToLookFor)}
          </div>

          <div class="form-group" style="margin-top: 4px;">
            <label for="inspect-note-${area.id}" class="form-label">
              Your inspection notes:
            </label>
            <textarea id="inspect-note-${area.id}" class="form-textarea" rows="2" placeholder="e.g. Test drove at 45 mph, slight squeak when braking on downhill…" data-note-id="${area.id}">${escapeHtml(state.notes[area.id] || "")}</textarea>
          </div>
        </article>
      `).join("")}
    </div>
  `;

  container.appendChild(page);

  // Attach auto-save notes listeners
  page.querySelectorAll("textarea[data-note-id]").forEach(textarea => {
    textarea.addEventListener("input", () => {
      const id = textarea.getAttribute("data-note-id");
      state.notes[id] = textarea.value;
      saveNotes();
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
      renderChecklistPage(container);
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

  const recalls = state.recallsState.recalls || [];
  const fetchTime = state.recallsState.fetchTimestamp || new Date().toLocaleString();

  printArea.innerHTML = `
    <h1>Lemonaid Vehicle Pre-Purchase Report</h1>
    <p class="muted">
      Generated ${new Date().toLocaleDateString()} · Data: NHTSA public datasets (vPIC, Recalls) · Fetched: ${escapeHtml(fetchTime)}
    </p>

    <div class="print-section">
      <h2>Vehicle Details</h2>
      <p>
        <strong>Vehicle:</strong> ${v ? `${escapeHtml(v.year)} ${escapeHtml(v.make)} ${escapeHtml(v.model)}` : "No vehicle selected"}<br>
        <strong>VIN:</strong> ${v && v.vin ? escapeHtml(v.vin) : "Not specified (Check VIN on nhtsa.gov/recalls)"}<br>
        <strong>Trim / Body:</strong> ${v ? `${escapeHtml(v.trim || "Base")} · ${escapeHtml(v.bodyClass || "")}` : ""}<br>
        <strong>Engine / Drivetrain:</strong> ${v ? `${escapeHtml(v.engineDisplacement)} ${escapeHtml(v.engineConfig)} · ${escapeHtml(v.driveType)} · ${escapeHtml(v.fuelType)}` : ""}
      </p>
    </div>

    <div class="print-section">
      <h2>Safety Recalls</h2>
      <p class="muted">
        NHTSA recall data is by vehicle model line. Always verify open recall status for this specific VIN at: https://www.nhtsa.gov/recalls
      </p>
      ${state.recallsState.error ? `
        <p>⚠️ Unable to verify safety recalls from NHTSA (${escapeHtml(state.recallsState.error)}). Do not assume 0 recalls. Check directly at https://www.nhtsa.gov/recalls.</p>
      ` : state.recallsState.dataUnavailable ? `
        <p>ℹ Safety recall records unavailable from NHTSA for this make and year. Do not assume 0 recalls. Check directly at https://www.nhtsa.gov/recalls.</p>
      ` : state.recallsState.modelSelectionNeeded ? `
        <p>⚠️ Model name confirmation required for NHTSA recall registry. Check directly at https://www.nhtsa.gov/recalls.</p>
      ` : (state.recallsState.recalls && state.recallsState.recalls.length === 0) ? `
        <p>✔ No safety recall campaigns on file from NHTSA for this model year (${escapeHtml(state.recallsState.selectedNhtsaModel || (v ? v.model : ""))}).</p>
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
      <h2>Pre-Purchase Checklist (${state.checklist.size} of ${CHECKLIST_ITEMS.length} completed)</h2>
      ${CHECKLIST_ITEMS.map(it => `
        <div class="check-item">
          [ ${state.checklist.has(it.id) ? "X" : " "} ] ${escapeHtml(it.text)}
        </div>
      `).join("")}
    </div>

    <div class="print-section">
      <h2>Inspection Notes</h2>
      ${INSPECT_AREAS.map(area => `
        <p>
          <strong>${escapeHtml(area.title)}:</strong><br>
          <em>${escapeHtml(state.notes[area.id] || "No notes recorded.")}</em>
        </p>
      `).join("")}
    </div>

    <div class="print-section">
      <h2>Questions for the Seller</h2>
      <ol>
        ${SELLER_QUESTIONS.map(q => `<li>${escapeHtml(q)}</li>`).join("")}
      </ol>
    </div>

    <p class="muted" style="margin-top: 18pt; border-top: 1pt solid #ccc; padding-top: 6pt;">
      Lemonaid is an informational decision-support tool. Always arrange an independent inspection by a certified mechanic prior to purchase.
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
