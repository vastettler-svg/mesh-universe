const COACH_DATA_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRwZdqNhyvQxRhmmZu9jzUdFnzB6ZFnh7gYe2bgN6qwPl9SGwPf9dYyrhLk8_dFONmrL9Ibi3iXYEnc/pub?gid=2054535278&single=true&output=csv";

const COACH_SEASON_TENURE_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRwZdqNhyvQxRhmmZu9jzUdFnzB6ZFnh7gYe2bgN6qwPl9SGwPf9dYyrhLk8_dFONmrL9Ibi3iXYEnc/pub?gid=693483780&single=true&output=csv";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;

      row.push(cell);
      cell = "";

      if (row.some((value) => String(value).trim() !== "")) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    cell += char;
  }

  row.push(cell);

  if (row.some((value) => String(value).trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

const COACH_CSV_TIMEOUT_MS = 15_000;
const COACH_CSV_CACHE_TTL_MS = 5 * 60_000;
const coachCsvMemoryCache = new Map();
const coachCsvInflight = new Map();

function sessionCacheKey(label) {
  return `mesh-coach-csv-v1:${label}`;
}

function readSessionCache(label) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(sessionCacheKey(label));
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed?.rows) || parsed.rows.length === 0) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeSessionCache(label, value) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(
      sessionCacheKey(label),
      JSON.stringify(value),
    );
  } catch {
    // Session storage is only an optimization; never fail data loading for it.
  }
}

async function fetchCsvObjects(url, label) {
  const now = Date.now();
  const memory = coachCsvMemoryCache.get(url);

  if (
    memory &&
    now - memory.timestamp < COACH_CSV_CACHE_TTL_MS
  ) {
    return memory.rows;
  }

  if (coachCsvInflight.has(url)) {
    return coachCsvInflight.get(url);
  }

  const session = readSessionCache(label);

  const request = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      COACH_CSV_TIMEOUT_MS,
    );

    try {
      const response = await fetch(url, {
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`${label} request failed: ${response.status}`);
      }

      const text = await response.text();
      const rows = parseCsv(text);

      if (rows.length === 0) {
        throw new Error(`${label} returned no rows.`);
      }

      const headers = rows[0].map((value) =>
        String(value || "").trim(),
      );

      const objects = rows.slice(1).map((values) => {
        const item = {};

        headers.forEach((header, index) => {
          if (!header) return;
          item[header] = values[index] ?? "";
        });

        return item;
      });

      const cachedValue = {
        rows: objects,
        timestamp: Date.now(),
      };

      coachCsvMemoryCache.set(url, cachedValue);
      writeSessionCache(label, cachedValue);

      return objects;
    } catch (error) {
      /*
       * Coach pages, Home Prestige and Prestige all share these two feeds.
       * If Google briefly throttles one request, use the most recent successful
       * data instead of taking all three features down together.
       */
      if (memory?.rows?.length) {
        console.warn(
          `${label} refresh failed; using memory cache instead.`,
          error,
        );
        return memory.rows;
      }

      if (session?.rows?.length) {
        console.warn(
          `${label} refresh failed; using session cache instead.`,
          error,
        );

        coachCsvMemoryCache.set(url, session);
        return session.rows;
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
      coachCsvInflight.delete(url);
    }
  })();

  coachCsvInflight.set(url, request);
  return request;
}

function clean(value) {
  return String(value ?? "").trim();
}

function headerKey(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getField(row, aliases) {
  const wanted = aliases.map(headerKey);

  for (const [header, value] of Object.entries(row || {})) {
    if (wanted.includes(headerKey(header))) {
      return value;
    }
  }

  return "";
}

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;

  const normalized = String(value).replace(/,/g, "").replace(/%/g, "").trim();
  const number = Number(normalized);

  return Number.isFinite(number) ? number : null;
}

function numberOrZeroFrom(row, aliases) {
  return numberOrNull(getField(row, aliases)) || 0;
}

function normalizeCoachDataRow(row) {
  return {
    raw: row,

    coachId: clean(getField(row, ["Coach_ID", "Coach ID"])),
    coachName: clean(getField(row, ["Coach", "Coach_Name", "Coach Name"])),
    franchiseId: clean(getField(row, ["Franchise_ID", "Franchise ID"])),
    currentTeam: clean(
      getField(row, [
        "Current Team",
        "Current_Team",
        "Franchise_Name",
        "Franchise Name",
        "Team",
      ]),
    ),

    /*
     * Career/overall prestige remains preferred for the Coach Profile.
     * Prest_Crnt_Ssn_Total is only a final fallback so a live profile never
     * goes blank simply because the old overall header was renamed.
     */
    prestige: numberOrNull(
      getField(row, [
        "OVR_Prestige_Totals_COACH",
        "OVR_Prestige_Total_COACH",
        "Coach_Prestige_Total",
        "Coach Prestige Total",
        "Prestige_Total",
        "Prest_Crnt_Ssn_Total",
      ]),
    ),

    nflDivisionTitles: numberOrZeroFrom(row, [
      "NFL_Division_Titles",
      "NFL Division Titles",
      "NFL_Division_Championships",
    ]),
    nflConferenceTitles: numberOrZeroFrom(row, [
      "NFL_Conference_Titles",
      "NFL Conference Titles",
      "NFL_Conference_Championships",
    ]),
    nflChampionships: numberOrZeroFrom(row, [
      "NFL_Championships",
      "NFL Championships",
      "NFL_Super_Bowl_Championships",
      "NFL_Super_Bowls",
    ]),
    nflPlayoffAppearances: numberOrZeroFrom(row, [
      "NFL_Playoff_Appearances",
      "NFL Playoff Appearances",
    ]),
    nflPostseasonWins: numberOrZeroFrom(row, [
      "NFL_Postseason_Wins",
      "NFL Postseason Wins",
      "NFL_Playoff_Wins",
    ]),
    nflPostseasonLosses: numberOrZeroFrom(row, [
      "NFL_Postseason_Losses",
      "NFL Postseason Losses",
      "NFL_Playoff_Losses",
    ]),

    fbsChampionships: numberOrZeroFrom(row, [
      "FBS_CFP_Championships",
      "FBS CFP Championships",
      "FBS_Championships",
    ]),
    fbsConferenceTitles: numberOrZeroFrom(row, [
      "FBS_Conference_Championships",
      "FBS Conference Championships",
      "FBS_Conference_Titles",
    ]),
    fbsCfpAppearances: numberOrZeroFrom(row, [
      "FBS_CFP_Appearances",
      "FBS CFP Appearances",
    ]),
    fbsCfpWins: numberOrZeroFrom(row, [
      "FBS_CFP_Wins",
      "FBS CFP Wins",
    ]),
    fbsCfpLosses: numberOrZeroFrom(row, [
      "FBS_CFP_Losses",
      "FBS CFP Losses",
    ]),
    fbsBowlAppearances: numberOrZeroFrom(row, [
      "FBS_Bowl_Appearances",
      "FBS Bowl Appearances",
    ]),
    fbsBowlWins: numberOrZeroFrom(row, [
      "FBS_Bowl_Wins",
      "FBS Bowl Wins",
    ]),
    fbsBowlLosses: numberOrZeroFrom(row, [
      "FBS_Bowl_Losses",
      "FBS Bowl Losses",
    ]),

    fcsChampionships: numberOrZeroFrom(row, [
      "FCS_Championships",
      "FCS Championships",
    ]),
    fcsConferenceTitles: numberOrZeroFrom(row, [
      "FCS_Conference_Titles",
      "FCS Conference Titles",
      "FCS_Conference_Championships",
    ]),
    fcsPlayoffAppearances: numberOrZeroFrom(row, [
      "FCS_Playoff_Appearances",
      "FCS Playoff Appearances",
    ]),
    fcsPlayoffWins: numberOrZeroFrom(row, [
      "FCS_Playoff_Wins",
      "FCS Playoff Wins",
      "FCS_Postseason_Wins",
    ]),
    fcsPlayoffLosses: numberOrZeroFrom(row, [
      "FCS_Playoff_Losses",
      "FCS Playoff Losses",
      "FCS_Postseason_Losses",
    ]),

    meshWins: numberOrNull(
      getField(row, [
        "MESH_OVR_W",
        "MESH OVR W",
        "MESH_Overall_Wins",
        "MESH_Career_Wins",
        "Overall_MESH_Wins",
        "Career_Wins",
      ]),
    ),
    meshLosses: numberOrNull(
      getField(row, [
        "MESH_OVR_L",
        "MESH OVR L",
        "MESH_Overall_Losses",
        "MESH_Career_Losses",
        "Overall_MESH_Losses",
        "Career_Losses",
      ]),
    ),
    meshTies: numberOrNull(
      getField(row, [
        "MESH_OVR_T",
        "MESH OVR T",
        "MESH_Overall_Ties",
        "MESH_Career_Ties",
        "Overall_MESH_Ties",
        "Career_Ties",
      ]),
    ),
    meshWinPct: numberOrNull(
      getField(row, [
        "MESH_OVR_WIN%",
        "MESH_OVR_WIN_PCT",
        "MESH Win Pct",
      ]),
    ),
    meshPF: numberOrNull(
      getField(row, [
        "MESH_OVR_PF",
        "MESH OVR PF",
        "MESH_Overall_PF",
        "MESH_Career_PF",
        "Overall_MESH_PF",
        "Career_PF",
      ]),
    ),
  };
}

function normalizeTenureRow(row) {
  return {
    raw: row,
    season: numberOrNull(getField(row, ["Season"])),
    coachId: clean(getField(row, ["Coach_ID", "Coach ID"])),
    coachName: clean(getField(row, ["Coach_Name", "Coach Name", "Coach"])),
    franchiseId: clean(getField(row, ["Franchise_ID", "Franchise ID"])),
    franchiseName: clean(
      getField(row, ["Franchise_Name", "Franchise Name", "Team"]),
    ),
    tier: clean(getField(row, ["Tier"])).toUpperCase(),
    conference: clean(getField(row, ["Conference"])),
    division: clean(getField(row, ["Division"])),
    startWeek: numberOrNull(getField(row, ["Start_Week", "Start Week"])),
    endWeek: numberOrNull(getField(row, ["End_Week", "End Week"])),
    tenureType: clean(getField(row, ["Tenure_Type", "Tenure Type"])),
    exitReason: clean(getField(row, ["Exit_Reason", "Exit Reason"])),

    conferenceWins: numberOrNull(
      getField(row, ["Tier_Standings_Wins", "Tier Standings Wins"]),
    ),
    conferenceLosses: numberOrNull(
      getField(row, ["Tier_Standings_Losses", "Tier Standings Losses"]),
    ),
    conferenceTies: numberOrNull(
      getField(row, ["Tier_Standings_Ties", "Tier Standings Ties"]),
    ),

    regularSeasonPF: numberOrNull(
      getField(row, ["Regular_Season_PF", "Regular Season PF"]),
    ),
    regularSeasonWins: numberOrNull(
      getField(row, ["Regular_Season_Wins", "Regular Season Wins"]),
    ),
    regularSeasonLosses: numberOrNull(
      getField(row, ["Regular_Season_Losses", "Regular Season Losses"]),
    ),
    regularSeasonTies: numberOrNull(
      getField(row, ["Regular_Season_Ties", "Regular Season Ties"]),
    ),

    postseasonWins: numberOrNull(
      getField(row, ["Postseason_Wins", "Postseason Wins"]),
    ),
    postseasonLosses: numberOrNull(
      getField(row, ["Postseason_Losses", "Postseason Losses"]),
    ),

    overallWins: numberOrNull(
      getField(row, ["Overall_Season_Wins", "Overall Season Wins"]),
    ),
    overallLosses: numberOrNull(
      getField(row, ["Overall_Season_Losses", "Overall Season Losses"]),
    ),
    overallTies: numberOrNull(
      getField(row, ["Overall_Season_Ties", "Overall Season Ties"]),
    ),
    overallPF: numberOrNull(
      getField(row, ["Overall_Season_PF", "Overall Season PF"]),
    ),

    prestigePoints: numberOrNull(
      getField(row, [
        "Coach_Prestige_Points",
        "Coach Prestige Points",
        "CoachPrestigePoints",
      ]),
    ),

    eligibleForAchievements:
      clean(
        getField(row, [
          "Eligible_For_Season_Achievements",
          "Eligible For Season Achievements",
        ]),
      ).toLowerCase() !== "false",

    movement: clean(getField(row, ["Coach_Movement", "Coach Movement"])),
    notes: clean(getField(row, ["Notes"])),
  };
}

let coachDataPromise = null;
let tenurePromise = null;

export async function getCoachDataRows() {
  if (!coachDataPromise) {
    coachDataPromise = fetchCsvObjects(COACH_DATA_CSV_URL, "COACH_DATA")
      .then((rows) => rows.map(normalizeCoachDataRow))
      .catch((error) => {
        coachDataPromise = null;
        throw error;
      });
  }

  return coachDataPromise;
}

export async function getCoachSeasonTenureRows() {
  if (!tenurePromise) {
    tenurePromise = fetchCsvObjects(
      COACH_SEASON_TENURE_CSV_URL,
      "COACH_SEASON_TENURE",
    )
      .then((rows) => rows.map(normalizeTenureRow))
      .catch((error) => {
        tenurePromise = null;
        throw error;
      });
  }

  return tenurePromise;
}

export function findCoachDataRow(rows, coachId, franchiseId = "") {
  const id = clean(coachId);
  const franchise = clean(franchiseId);

  const exact = rows.find((row) => row.coachId === id);
  if (exact) return exact;

  if (franchise) {
    return rows.find((row) => row.franchiseId === franchise) || null;
  }

  return null;
}
