/*
 * IMPORTANT:
 * The published GIDs are:
 *   2054535278 = COACH_DATA
 *   693483780  = COACH_SEASON_TENURE
 */
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

async function fetchCsvObjects(url, label) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`${label} request failed: ${response.status}`);
  }

  const text = await response.text();
  const rows = parseCsv(text);

  if (rows.length === 0) return [];

  const headers = rows[0].map((value) => String(value || "").trim());

  return rows.slice(1).map((values) => {
    const item = {};

    headers.forEach((header, index) => {
      if (!header) return;
      item[header] = values[index] ?? "";
    });

    return item;
  });
}

function clean(value) {
  return String(value ?? "").trim();
}

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;

  const normalized = String(value).replace(/,/g, "").replace(/%/g, "").trim();
  const number = Number(normalized);

  return Number.isFinite(number) ? number : null;
}

function normalizeCoachDataRow(row) {
  return {
    raw: row,
    coachId: clean(row.Coach_ID),
    coachName: clean(row.Coach),
    franchiseId: clean(row.Franchise_ID),
    currentTeam: clean(row["Current Team"]),
    prestige: numberOrNull(row.OVR_Prestige_Totals_COACH),

    nflDivisionTitles: numberOrNull(row.NFL_Division_Titles) || 0,
    nflConferenceTitles: numberOrNull(row.NFL_Conference_Titles) || 0,
    nflChampionships: numberOrNull(row.NFL_Championships) || 0,
    nflPlayoffAppearances: numberOrNull(row.NFL_Playoff_Appearances) || 0,
    nflPostseasonWins: numberOrNull(row.NFL_Postseason_Wins) || 0,
    nflPostseasonLosses: numberOrNull(row.NFL_Postseason_Losses) || 0,

    fbsChampionships: numberOrNull(row.FBS_CFP_Championships) || 0,
    fbsConferenceTitles:
      numberOrNull(row.FBS_Conference_Championships) || 0,
    fbsCfpAppearances: numberOrNull(row.FBS_CFP_Appearances) || 0,
    fbsCfpWins: numberOrNull(row.FBS_CFP_Wins) || 0,
    fbsCfpLosses: numberOrNull(row.FBS_CFP_Losses) || 0,
    fbsBowlAppearances: numberOrNull(row.FBS_Bowl_Appearances) || 0,
    fbsBowlWins: numberOrNull(row.FBS_Bowl_Wins) || 0,
    fbsBowlLosses: numberOrNull(row.FBS_Bowl_Losses) || 0,

    fcsChampionships: numberOrNull(row.FCS_Championships) || 0,
    fcsConferenceTitles: numberOrNull(row.FCS_Conference_Titles) || 0,
    fcsPlayoffAppearances: numberOrNull(row.FCS_Playoff_Appearances) || 0,
    fcsPlayoffWins: numberOrNull(row.FCS_Playoff_Wins) || 0,
    fcsPlayoffLosses: numberOrNull(row.FCS_Playoff_Losses) || 0,

    meshWins: numberOrNull(row.MESH_OVR_W),
    meshLosses: numberOrNull(row.MESH_OVR_L),
    meshTies: numberOrNull(row.MESH_OVR_T),
    meshWinPct: numberOrNull(row["MESH_OVR_WIN%"]),
    meshPF: numberOrNull(row.MESH_OVR_PF),
  };
}

function normalizeTenureRow(row) {
  return {
    raw: row,
    season: numberOrNull(row.Season),
    coachId: clean(row.Coach_ID),
    coachName: clean(row.Coach_Name),
    franchiseId: clean(row.Franchise_ID),
    franchiseName: clean(row.Franchise_Name),
    tier: clean(row.Tier).toUpperCase(),
    conference: clean(row.Conference),
    division: clean(row.Division),
    startWeek: numberOrNull(row.Start_Week),
    endWeek: numberOrNull(row.End_Week),
    tenureType: clean(row.Tenure_Type),
    exitReason: clean(row.Exit_Reason),

    conferenceWins: numberOrNull(row.Tier_Standings_Wins),
    conferenceLosses: numberOrNull(row.Tier_Standings_Losses),
    conferenceTies: numberOrNull(row.Tier_Standings_Ties),

    regularSeasonPF: numberOrNull(row.Regular_Season_PF),
    regularSeasonWins: numberOrNull(row.Regular_Season_Wins),
    regularSeasonLosses: numberOrNull(row.Regular_Season_Losses),
    regularSeasonTies: numberOrNull(row.Regular_Season_Ties),

    postseasonWins: numberOrNull(row.Postseason_Wins),
    postseasonLosses: numberOrNull(row.Postseason_Losses),

    overallWins: numberOrNull(row.Overall_Season_Wins),
    overallLosses: numberOrNull(row.Overall_Season_Losses),
    overallTies: numberOrNull(row.Overall_Season_Ties),
    overallPF: numberOrNull(row.Overall_Season_PF),

    eligibleForAchievements:
      clean(row.Eligible_For_Season_Achievements).toLowerCase() !== "false",
    movement: clean(row.Coach_Movement),
    notes: clean(row.Notes),
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

  /*
   * Defensive fallback:
   * current franchise is used only when a COACH_DATA Coach_ID cell is
   * temporarily mis-keyed but the current franchise row is still present.
   */
  if (franchise) {
    return rows.find((row) => row.franchiseId === franchise) || null;
  }

  return null;
}
