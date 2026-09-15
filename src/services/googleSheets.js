import { getTeamLogoOverride } from "../assets/logos/overrides/teamLogoOverrides";
import { getCoachSeasonTenureRows } from "./coachData";

const LIVE_PLAYER_SCORES_GID = "1339342815";
const PLAYER_SCORE_ARCHIVE_GID = "841634242";
const PUBLISHED_SHEET_BASE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRwZdqNhyvQxRhmmZu9jzUdFnzB6ZFnh7gYe2bgN6qwPl9SGwPf9dYyrhLk8_dFONmrL9Ibi3iXYEnc/pub";

const TEAM_DATA_CSV_URL =
  `${PUBLISHED_SHEET_BASE_URL}?gid=1513820672&single=true&output=csv`;

const CURRENT_SEASON = 2026;

const FRANCHISE_DIRECTORY_CSV_URL =
  `${PUBLISHED_SHEET_BASE_URL}?gid=1358798530&single=true&output=csv`;

const GAME_RESULTS_CSV_URL =
  `${PUBLISHED_SHEET_BASE_URL}?gid=1867143153&single=true&output=csv`;

const STANDINGS_ARCHIVE_CSV_URL =
  `${PUBLISHED_SHEET_BASE_URL}?gid=1582021364&single=true&output=csv`;

const APP_SETTINGS_CSV_URL =
  `${PUBLISHED_SHEET_BASE_URL}?gid=121795657&single=true&output=csv`;

const COACH_CAROUSEL_CSV_URL =
  `${PUBLISHED_SHEET_BASE_URL}?gid=325208769&single=true&output=csv`;

const DRAFT_HQ_CSV_URL =
  `${PUBLISHED_SHEET_BASE_URL}?gid=436166201&single=true&output=csv`;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"' && insideQuotes && nextCharacter === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === "," && !insideQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if (
      (character === "\n" || character === "\r") &&
      !insideQuotes
    ) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      row.push(value);

      if (row.some((cell) => String(cell).trim() !== "")) {
        rows.push(row);
      }

      row = [];
      value = "";
      continue;
    }

    value += character;
  }

  row.push(value);

  if (row.some((cell) => String(cell).trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

function normalizeHeader(value) {
  return String(value ?? "").trim();
}

function csvRowsToObjects(csvRows) {
  if (csvRows.length < 2) {
    return [];
  }

  const headers = csvRows[0].map(normalizeHeader);

  return csvRows.slice(1).map((row) => {
    const result = {};

    headers.forEach((header, index) => {
      if (header) {
        result[header] = row[index] ?? "";
      }
    });

    return result;
  });
}

const CSV_CACHE_TTL_MS = 60_000;
const CSV_REQUEST_TIMEOUT_MS = 15_000;
const csvCache = new Map();
const csvInflight = new Map();

async function fetchCsvRows(url, label) {
  const now = Date.now();
  const cached = csvCache.get(url);

  // Re-visiting pages inside the app should be instant instead of issuing
  // another identical Google Sheets request every time a route remounts.
  if (cached && now - cached.timestamp < CSV_CACHE_TTL_MS) {
    return cached.rows;
  }

  // If several screens ask for the same sheet at once, share one request.
  if (csvInflight.has(url)) {
    return csvInflight.get(url);
  }

  const request = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      CSV_REQUEST_TIMEOUT_MS,
    );

    try {
      const response = await fetch(url, {
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `${label} request failed: ${response.status} ${response.statusText}`,
        );
      }

      const csvText = await response.text();
      const rows = csvRowsToObjects(parseCsv(csvText));

      if (rows.length === 0) {
        throw new Error(`${label} returned no rows.`);
      }

      csvCache.set(url, {
        rows,
        timestamp: Date.now(),
      });

      return rows;
    } catch (error) {
      /*
       * If Google briefly stalls after the user has already loaded the sheet
       * successfully, keep the app usable with the last known data rather than
       * leaving a page on "Loading..." indefinitely.
       */
      if (cached?.rows?.length) {
        console.warn(
          `${label} refresh failed; using cached rows instead.`,
          error,
        );
        return cached.rows;
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
      csvInflight.delete(url);
    }
  })();

  csvInflight.set(url, request);
  return request;
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const cleanedValue = String(value)
    .replace(/,/g, "")
    .replace(/%/g, "")
    .trim();

  const number = Number(cleanedValue);
  return Number.isFinite(number) ? number : fallback;
}

function toOptionalNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(number) ? number : null;
}

function normalizeId(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function firstValue(row, names, fallback = "") {
  for (const name of names) {
    const value = row[name];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return fallback;
}

function buildRecord(wins, losses, ties) {
  const winValue = toNumber(wins);
  const lossValue = toNumber(losses);
  const tieValue = toNumber(ties);

  return tieValue > 0
    ? `${winValue}–${lossValue}–${tieValue}`
    : `${winValue}–${lossValue}`;
}

function getStandingsStatus(team) {
  const tier = String(team.Tier ?? "").trim().toUpperCase();
  const overallRank = toOptionalNumber(team.Overall_Rank);
  const playoffSeed = toNumber(team.Playoff_Seed);
  const playoffStatus = String(team.Playoff_Status ?? "").trim();

  if (
    tier === "NFL" &&
    overallRank !== null &&
    overallRank >= 29 &&
    overallRank <= 32
  ) {
    return { status: "relegation", statusLabel: "Relegation Zone" };
  }

  if (
    tier === "FBS" &&
    overallRank !== null &&
    overallRank >= 91 &&
    overallRank <= 98
  ) {
    return { status: "relegation", statusLabel: "Relegation Zone" };
  }

  if (tier === "NFL" && playoffSeed > 0) {
    return {
      status: "playoff",
      statusLabel:
        playoffSeed === 1 ? "No. 1 Seed" : `No. ${playoffSeed} Seed`,
    };
  }

  if (tier === "NFL" && playoffStatus && playoffStatus !== "#N/A") {
    const normalizedStatus = playoffStatus.toLowerCase();

    if (normalizedStatus.includes("eliminated")) {
      return { status: "warning", statusLabel: playoffStatus };
    }

    if (
      normalizedStatus.includes("clinched") ||
      normalizedStatus.includes("playoff") ||
      normalizedStatus.includes("bye")
    ) {
      return { status: "playoff", statusLabel: playoffStatus };
    }

    return { status: "neutral", statusLabel: playoffStatus };
  }

  return { status: "neutral", statusLabel: "" };
}

async function fetchTeamDataRows() {
  const rows = await fetchCsvRows(TEAM_DATA_CSV_URL, "TEAM DATA");
  const franchiseRows = rows.filter((row) =>
    String(row.Franchise_ID ?? "").trim(),
  );

  if (franchiseRows.length === 0) {
    throw new Error(
      "TEAM DATA returned no franchise rows. Confirm row 1 contains the headers.",
    );
  }

  return franchiseRows;
}

async function fetchFranchiseDirectoryRows() {
  const rows = await fetchCsvRows(
    FRANCHISE_DIRECTORY_CSV_URL,
    "FRANCHISE_DIRECTORY",
  );

  const franchiseRows = rows.filter((row) =>
    String(row.Franchise_ID ?? "").trim(),
  );

  if (franchiseRows.length === 0) {
    throw new Error(
      "FRANCHISE_DIRECTORY returned no franchise rows. Confirm row 1 contains the headers.",
    );
  }

  return franchiseRows;
}

function createFranchiseBrandingLookup(rows) {
  return new Map(
    rows.map((row) => {
      const franchiseId = String(row.Franchise_ID ?? "").trim();

      return [
        franchiseId,
        {
          logo: String(row.Logo_URL ?? "").trim(),
          primaryColor: String(row.Primary_Color ?? "").trim(),
          secondaryColor: String(row.Secondary_Color ?? "").trim(),
        },
      ];
    }),
  );
}

export async function getStandingsData() {
  const [rows, franchiseDirectoryRows] = await Promise.all([
    fetchTeamDataRows(),
    fetchFranchiseDirectoryRows(),
  ]);

  const brandingLookup = createFranchiseBrandingLookup(
    franchiseDirectoryRows,
  );

  return rows.map((row) => {
    const tier = String(row.Tier ?? "").trim().toUpperCase();
    const conference = String(row.Conference ?? "").trim();
    const division = String(row.Division ?? "").trim();
    const overallRank = toOptionalNumber(row.Overall_Rank) ?? 0;
    const conferenceRank =
      toOptionalNumber(row.Conference_Rank) ?? overallRank;
    const divisionRank =
      toOptionalNumber(row.Division_Rank) ?? conferenceRank;
    const top25Rank = toNumber(row.Top25_Rank);
    const previousRank = toOptionalNumber(row.Previous_RPI_Rank) ?? overallRank;
    const previousTop25Rank = toNumber(row.Previous_Week_Top25_Rank);
    const franchiseId = String(row.Franchise_ID ?? "").trim();
    const branding = brandingLookup.get(franchiseId) ?? {};

    return {
      id: franchiseId,
      franchiseId,
      coachId: String(row.Coach_ID ?? "").trim(),
      tier,
      tierClass: tier.toLowerCase(),
      conference,
      conferenceId: normalizeId(conference),
      division,
      divisionId: normalizeId(division),
      team: String(row.Franchise_Name ?? "").trim(),
      coach: String(row.Coach_Name ?? "").trim(),

      prestigePoints:
        toOptionalNumber(
          firstValue(row, [
            "OVR_Prestige_Totals",
            "Franchise_Prestige_Points",
            "Prestige_Points",
            "Franchise_Prestige",
            "Prestige",
          ]),
        ),

      logo:
        getTeamLogoOverride(String(row.Franchise_Name ?? "").trim()) ||
        branding.logo ||
        "",
      logoUrl:
        getTeamLogoOverride(String(row.Franchise_Name ?? "").trim()) ||
        branding.logo ||
        "",
      primaryColor: branding.primaryColor || "",
      secondaryColor: branding.secondaryColor || "",

      overallRank,
      conferenceRank,
      divisionRank,
      top25Rank,
      rpi: toOptionalNumber(row.RPI),
      playoffSeed: toNumber(row.Playoff_Seed),
      playoffStatus: String(row.Playoff_Status ?? "").trim(),
      seasonResult: String(row.Season_Result ?? "").trim(),
      tierStandingsRecord: buildRecord(
        row.Tier_Standings_Wins,
        row.Tier_Standings_Losses,
        row.Tier_Standings_Ties,
      ),
      regularSeasonRecord: buildRecord(
        row.Regular_Season_Wins,
        row.Regular_Season_Losses,
        row.Regular_Season_Ties,
      ),
      regularSeasonWins: toNumber(row.Regular_Season_Wins),
      regularSeasonLosses: toNumber(row.Regular_Season_Losses),
      regularSeasonTies: toNumber(row.Regular_Season_Ties),
      overallSeasonRecord: buildRecord(
        row.Overall_Season_Wins,
        row.Overall_Season_Losses,
        row.Overall_Season_Ties,
      ),
      overallSeasonWins: toNumber(row.Overall_Season_Wins),
      overallSeasonLosses: toNumber(row.Overall_Season_Losses),
      overallSeasonTies: toNumber(row.Overall_Season_Ties),
      tierStandingsWins: toNumber(row.Tier_Standings_Wins),
      tierStandingsLosses: toNumber(row.Tier_Standings_Losses),
      tierStandingsTies: toNumber(row.Tier_Standings_Ties),
      postseasonWins: toNumber(row.Postseason_Wins),
      postseasonLosses: toNumber(row.Postseason_Losses),
      record: buildRecord(
        row.Tier_Standings_Wins,
        row.Tier_Standings_Losses,
        row.Tier_Standings_Ties,
      ),
      regularSeasonPF: toNumber(row.Regular_Season_PF),
      overallSeasonPF: toNumber(row.Overall_Season_PF),
      pointsFor: toNumber(row.Regular_Season_PF),
      movement:
        overallRank > 0 && previousRank > 0
          ? previousRank - overallRank
          : 0,
      previousTop25Rank,
      top25Movement:
        top25Rank >= 1 &&
        top25Rank <= 25 &&
        previousTop25Rank >= 1 &&
        previousTop25Rank <= 25
          ? previousTop25Rank - top25Rank
          : 0,
      isNewTop25:
        top25Rank >= 1 &&
        top25Rank <= 25 &&
        !(previousTop25Rank >= 1 && previousTop25Rank <= 25),
      top25: top25Rank >= 1 && top25Rank <= 25,
      streak: String(row.Streak ?? "").trim(),
      ...getStandingsStatus(row),
    };
  });
}

export async function getAppSettings() {
  const rows = await fetchCsvRows(APP_SETTINGS_CSV_URL, "APP_SETTINGS");

  const globalSettings = {};

  rows.forEach((row) => {
    const setting = String(row.Setting ?? "").trim();

    if (setting) {
      globalSettings[setting] = row.Value;
    }
  });

  const tierEvents = rows
    .filter((row) => {
      const tier = String(row.Tier ?? "").trim().toUpperCase();
      const week = toNumber(row.Week, -1);
      return ["NFL", "FBS", "FCS"].includes(tier) && week >= 0;
    })
    .map((row) => ({
      tier: String(row.Tier ?? "").trim().toUpperCase(),
      week: toNumber(row.Week),
      phase: String(row.Phase ?? "").trim(),
      eventLabel: String(row.Event_Label ?? "").trim(),
      standingsMode: String(row.Standings_Mode ?? "").trim(),
      isPostseason: String(row.Is_Postseason ?? "")
        .trim()
        .toLowerCase() === "true",
      notes: String(row.Notes ?? "").trim(),
    }));

  return {
    currentSeason: toNumber(globalSettings.Current_Season),
    currentWeek: toNumber(globalSettings.Current_Week),
    scoresState: String(globalSettings.Scores_State ?? "").trim(),
    appVersion: String(globalSettings.App_Version ?? "").trim(),
    lastUpdated: globalSettings.Last_Updated ?? "",
    defaultStandingsView: String(
      globalSettings.Default_Standings_View ?? "",
    ).trim(),
    tierEvents,
  };
}

function normalizeGameStatus(value) {
  const status = String(value ?? "").trim().toLowerCase();

  if (status === "in progress" || status === "live") {
    return { status: "live", statusLabel: "In Progress" };
  }

  if (status === "final" || status === "complete") {
    return { status: "final", statusLabel: "Final" };
  }

  return { status: "upcoming", statusLabel: "Scheduled" };
}

function buildGameLabel(row) {
  const gameCategory = String(row.Game_Category ?? "").trim();
  const gameType = String(row.Game_Type ?? "").trim();
  const bowlName = String(row.Bowl_Name ?? "").trim();

  if (bowlName) {
    return bowlName;
  }

  if (gameType && gameType.toLowerCase() !== "regular season") {
    return gameType;
  }

  return gameCategory || "Regular Season";
}

function createTeamLookup(rows, brandingLookup = new Map()) {
  return new Map(
    rows.map((row) => {
      const franchiseId = String(row.Franchise_ID ?? "").trim();
      const tier = String(row.Tier ?? "").trim().toUpperCase();
      const top25Rank = toNumber(row.Top25_Rank);
      const branding = brandingLookup.get(franchiseId) ?? {};

      return [
        franchiseId,
        {
          franchiseId,
          name: String(row.Franchise_Name ?? "").trim(),
          coachId: String(row.Coach_ID ?? "").trim(),
          coach: String(row.Coach_Name ?? "").trim(),
          logo:
            getTeamLogoOverride(String(row.Franchise_Name ?? "").trim()) ||
            branding.logo ||
            String(
              firstValue(row, [
                "Logo_URL",
                "Franchise_Logo_URL",
                "Franchise_Logo",
                "Team_Logo_URL",
                "Team_Logo",
                "Logo",
              ]) ?? "",
            ).trim(),
          conference: String(row.Conference ?? "").trim(),
          conferenceId: normalizeId(row.Conference),
          tier,
          tierClass: tier.toLowerCase(),
          overallRecord: buildRecord(
            row.Overall_Season_Wins,
            row.Overall_Season_Losses,
            row.Overall_Season_Ties,
          ),
          conferenceRecord: buildRecord(
            row.Tier_Standings_Wins,
            row.Tier_Standings_Losses,
            row.Tier_Standings_Ties,
          ),
          top25Rank,
          top25: top25Rank >= 1 && top25Rank <= 25,
        },
      ];
    }),
  );
}

function buildHistoricalTeamLogoLookup_(rows) {
  const lookup = new Map();

  (rows || []).forEach((row) => {
    const name = String(
      firstValue(row, [
        "Franchise_Name",
        "Team_Name",
        "School_Name",
        "Name",
      ]),
    ).trim();

    const logo = String(
      firstValue(row, [
        "Logo_URL",
        "Logo",
        "Team_Logo",
        "Franchise_Logo",
      ]),
    ).trim();

    if (name && logo) {
      lookup.set(name.toLowerCase(), logo);
    }
  });

  return lookup;
}

function mapStandingsArchiveRows_(rows, directoryRows = []) {
  const historicalLogoLookup =
    buildHistoricalTeamLogoLookup_(directoryRows);

  return rows
    .filter((row) => {
      return (
        String(row.Franchise_ID ?? "").trim() &&
        toNumber(row.Season) > 0
      );
    })
    .map((row) => {
      const tier = String(row.Tier ?? "").trim().toUpperCase();
      const franchiseName = String(row.Franchise_Name ?? "").trim();

      return {
        season: toNumber(row.Season),
        franchiseId: String(row.Franchise_ID ?? "").trim(),
        franchiseName,
        team: franchiseName,
        logo:
          getTeamLogoOverride(franchiseName) ||
          historicalLogoLookup.get(franchiseName.toLowerCase()) ||
          COACH_CAROUSEL_HISTORICAL_LOGOS[franchiseName.toLowerCase()] ||
          "",

        coachId: String(row.Final_Coach_ID ?? "").trim(),
        coachName: String(row.Final_Coach_Name ?? "").trim(),
        coach: String(row.Final_Coach_Name ?? "").trim(),

        tier,
        tierClass: tier.toLowerCase(),
        conference: String(row.Conference ?? "").trim(),
        division: String(row.Division ?? "").trim(),

        overallRank: toOptionalNumber(row.Overall_Rank) ?? 0,
        conferenceRank: toOptionalNumber(row.Conference_Rank) ?? 0,
        divisionRank: toOptionalNumber(row.Division_Rank) ?? 0,
        top25Rank: toOptionalNumber(row.Top25_Rank) ?? 0,
        rpi: toOptionalNumber(row.RPI),

        tierStandingsWins: toNumber(row.Tier_Standings_Wins),
        tierStandingsLosses: toNumber(row.Tier_Standings_Losses),
        tierStandingsTies: toNumber(row.Tier_Standings_Ties),
        tierStandingsRecord: buildRecord(
          row.Tier_Standings_Wins,
          row.Tier_Standings_Losses,
          row.Tier_Standings_Ties,
        ),

        regularSeasonWins: toNumber(row.Regular_Season_Wins),
        regularSeasonLosses: toNumber(row.Regular_Season_Losses),
        regularSeasonTies: toNumber(row.Regular_Season_Ties),
        regularSeasonRecord: buildRecord(
          row.Regular_Season_Wins,
          row.Regular_Season_Losses,
          row.Regular_Season_Ties,
        ),
        regularSeasonPF: toNumber(row.Regular_Season_PF),

        postseasonWins: toNumber(row.Postseason_Wins),
        postseasonLosses: toNumber(row.Postseason_Losses),

        overallSeasonWins: toNumber(row.Overall_Season_Wins),
        overallSeasonLosses: toNumber(row.Overall_Season_Losses),
        overallSeasonTies: toNumber(row.Overall_Season_Ties),
        overallSeasonRecord: buildRecord(
          row.Overall_Season_Wins,
          row.Overall_Season_Losses,
          row.Overall_Season_Ties,
        ),
        overallSeasonPF: toNumber(row.Overall_Season_PF),

        playoffSeed: toOptionalNumber(row.Playoff_Seed) ?? 0,
        bowlGames: [
          String(row.Bowl_Game_1 ?? "").trim(),
          String(row.Bowl_Game_2 ?? "").trim(),
          String(row.Bowl_Game_3 ?? "").trim(),
        ].filter(Boolean),

        playoffResult: String(row.Playoff_Result ?? "").trim(),
        conferenceResult: String(row.Conference_Result ?? "").trim(),
        notes: String(row.Notes ?? "").trim(),
      };
    })
    .sort((a, b) => {
      if (a.franchiseId !== b.franchiseId) {
        return a.franchiseId.localeCompare(b.franchiseId);
      }

      return b.season - a.season;
    });
}

export async function getStandingsArchive() {
  const [rows, directoryRows] = await Promise.all([
    fetchCsvRows(
      STANDINGS_ARCHIVE_CSV_URL,
      "STANDINGS_ARCHIVE",
    ),
    fetchCsvRows(
      FRANCHISE_DIRECTORY_CSV_URL,
      "FRANCHISE_DIRECTORY",
    ).catch(() => []),
  ]);

  return mapStandingsArchiveRows_(rows, directoryRows);
}

/*
 * Champions-only archive path.
 * Championship lineage does not need FRANCHISE_DIRECTORY to determine winners,
 * so do not let that optional branding request hold the Champions screen open.
 */
export async function getChampionsStandingsArchive() {
  /*
   * Champions originally skipped FRANCHISE_DIRECTORY while we were isolating
   * the loading problem. The loader issue was later traced to a React state
   * cleanup race, not this branding request.
   *
   * Reuse the normal archive loader now so historical champions receive the
   * same logo lookup as Career Standings / Season Archive while preserving the
   * fixed Champions loading behavior in History.jsx.
   */
  return getStandingsArchive();
}



const COACH_CAROUSEL_HISTORICAL_LOGOS = {
  "appalachian state mountaineers":
    "https://a.espncdn.com/i/teamlogos/ncaa/500/2026.png",
};

export async function getCoachCarousel() {
  const [rows, franchiseDirectoryRows] = await Promise.all([
    fetchCsvRows(COACH_CAROUSEL_CSV_URL, "COACH_CAROUSEL"),
    fetchCsvRows(
      FRANCHISE_DIRECTORY_CSV_URL,
      "FRANCHISE_DIRECTORY",
    ).catch(() => []),
  ]);

  const historicalLogoLookup =
    buildHistoricalTeamLogoLookup_(franchiseDirectoryRows);

  return rows
    .filter((row) => {
      return (
        toNumber(row.Season) > 0 &&
        String(row.Franchise_ID ?? "").trim()
      );
    })
    .map((row, index) => {
      const franchiseName = String(row.Franchise_Name ?? "").trim();
      const tier = String(row.Tier ?? "").trim().toUpperCase();
      const status = String(row.Status ?? "").trim() || "Filled";

      return {
        id: `${toNumber(row.Season)}-${String(row.Franchise_ID ?? "").trim()}-${index}`,
        season: toNumber(row.Season),
        franchiseId: String(row.Franchise_ID ?? "").trim(),
        franchiseName,
        team: franchiseName,
        tier,
        tierClass: tier.toLowerCase(),
        conference: String(row.Conference ?? "").trim(),
        conferenceRank: toOptionalNumber(row.Conference_Rank),
        tierRank: toOptionalNumber(row.Tier_Rank),

        logo:
          getTeamLogoOverride(franchiseName) ||
          historicalLogoLookup.get(franchiseName.toLowerCase()) ||
          "",

        outgoingCoachId: String(row.Outgoing_Coach_ID ?? "").trim(),
        outgoingCoachName: String(row.Outgoing_Coach_Name ?? "").trim(),
        outgoingReason: String(row.Outgoing_Reason ?? "").trim(),
        outgoingNewFranchiseId: String(
          row.Outgoing_New_Franchise_ID ?? "",
        ).trim(),
        outgoingNewTeam: String(row.Outgoing_New_Team ?? "").trim(),
        outgoingNewTier: String(row.Outgoing_New_Tier ?? "")
          .trim()
          .toUpperCase(),

        incomingCoachId: String(row.Incoming_Coach_ID ?? "").trim(),
        incomingCoachName: String(row.Incoming_Coach_Name ?? "").trim(),
        incomingReason: String(row.Incoming_Reason ?? "").trim(),
        incomingPrevFranchiseId: String(
          row.Incoming_Prev_Franchise_ID ?? "",
        ).trim(),
        incomingPrevTeam: String(row.Incoming_Prev_Team ?? "").trim(),
        incomingPrevTier: String(row.Incoming_Prev_Tier ?? "")
          .trim()
          .toUpperCase(),

        status,
        isOpen: status.toLowerCase() === "open",
        notes: String(row.Notes ?? "").trim(),
      };
    })
    .sort((a, b) => {
      if (a.season !== b.season) return b.season - a.season;
      if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
      if (a.tier !== b.tier) return a.tier.localeCompare(b.tier);
      return a.franchiseName.localeCompare(b.franchiseName);
    });
}


export async function getDraftHQ() {
  const [rows, franchiseDirectoryRows] = await Promise.all([
    fetchCsvRows(DRAFT_HQ_CSV_URL, "DRAFT_HQ"),
    fetchCsvRows(
      FRANCHISE_DIRECTORY_CSV_URL,
      "FRANCHISE_DIRECTORY",
    ).catch(() => []),
  ]);

  const historicalLogoLookup =
    buildHistoricalTeamLogoLookup_(franchiseDirectoryRows);

  const franchiseLogoById = new Map();
  franchiseDirectoryRows.forEach((row) => {
    const id = String(row.Franchise_ID ?? "").trim();
    const logo = String(row.Logo_URL ?? "").trim();
    if (id && logo && !franchiseLogoById.has(id)) {
      franchiseLogoById.set(id, logo);
    }
  });

  return rows
    .filter((row) => toNumber(row.Season) > 0 && toNumber(row.Pick) > 0)
    .map((row, index) => {
      const draftingFranchiseId = String(
        row.Drafting_Franchise_ID ?? "",
      ).trim();
      const draftingFranchiseName = String(
        row.Drafting_Franchise_Name ?? "",
      ).trim();
      const originalFranchiseId = String(
        row.Original_Franchise_ID ?? "",
      ).trim();
      const originalFranchiseName = String(
        row.Original_Franchise_Name ?? "",
      ).trim();
      const tier = String(row.Tier ?? "").trim().toUpperCase();
      const conference = String(
        row.Conference ?? row.League_Label ?? "",
      ).trim();

      // Draft history is season-specific: resolve the logo from the stored
      // historical team name before falling back to the permanent franchise ID.
      const draftingLogo =
        getTeamLogoOverride(draftingFranchiseName) ||
        historicalLogoLookup.get(draftingFranchiseName.toLowerCase()) ||
        franchiseLogoById.get(draftingFranchiseId) ||
        "";

      return {
        id: `${toNumber(row.Season)}-${String(row.Draft_ID ?? "").trim()}-${toNumber(row.Pick)}-${index}`,
        season: toNumber(row.Season),
        leagueLabel: String(row.League_Label ?? "").trim(),
        sleeperLeagueId: String(row.Sleeper_League_ID ?? "").trim(),
        draftId: String(row.Draft_ID ?? "").trim(),
        pick: toNumber(row.Pick),
        round: toNumber(row.Round),
        pickInRound: toNumber(row.Pick_In_Round),
        playerName: String(row.Player_Name ?? "").trim(),
        position: String(row.Position ?? "").trim().toUpperCase(),
        nflTeam: String(row.NFL_Team ?? "").trim().toUpperCase(),
        playerId: String(row.Player_ID ?? "").trim(),
        tier,
        tierClass: tier.toLowerCase(),
        conference,
        conferenceId: normalizeId(conference),
        draftingFranchiseId,
        draftingFranchiseName,
        draftingLogo,
        originalFranchiseId,
        originalFranchiseName,
        isTraded:
          Boolean(originalFranchiseId || originalFranchiseName) &&
          (originalFranchiseId
            ? originalFranchiseId !== draftingFranchiseId
            : originalFranchiseName.toLowerCase() !==
              draftingFranchiseName.toLowerCase()),
        isSelected: Boolean(String(row.Player_Name ?? "").trim()),
      };
    })
    .sort((a, b) => {
      if (a.season !== b.season) return b.season - a.season;
      if (a.tier !== b.tier) return a.tier.localeCompare(b.tier);
      if (a.conference !== b.conference) {
        return a.conference.localeCompare(b.conference);
      }
      return a.pick - b.pick;
    });
}


/*
 * Lightweight historical game feed used by History -> Champions / Season Archive.
 *
 * The full getGameResults() path is intentionally rich because Scores/Game Center
 * need current TEAM DATA, LIVE_PLAYER_SCORES, projections, and coach-tenure lookup.
 * History does not need any of that live scoring work. It only needs the stored
 * GAME_RESULTS result plus the season-specific identity already available in
 * STANDINGS_ARCHIVE.
 *
 * Keeping this separate prevents Champions / Season Archive from waiting on the
 * much larger live scoring feed or doing thousands of coach-tenure lookups.
 */
export async function getHistoryGameResults() {
  const [gameRows, archive] = await Promise.all([
    fetchCsvRows(GAME_RESULTS_CSV_URL, "GAME_RESULTS"),
    getStandingsArchive(),
  ]);

  const identityBySeasonFranchise = new Map();

  archive.forEach((row) => {
    const season = Number(row.season);
    const franchiseId = String(row.franchiseId || "").trim();
    if (!season || !franchiseId) return;

    identityBySeasonFranchise.set(`${season}|${franchiseId}`, {
      name: String(row.franchiseName || "").trim(),
      logo: String(row.logo || "").trim(),
      coachId: String(row.coachId || "").trim(),
      coach: String(row.coachName || "").trim(),
      conference: String(row.conference || "").trim(),
    });
  });

  return gameRows
    .filter((row) => {
      const gameId = String(row.Game_ID ?? "").trim();
      const team1Id = String(
        firstValue(row, ["Team1_Franchise_ID", "Franchise1_ID"]),
      ).trim();
      const team2Id = String(
        firstValue(row, ["Team2_Franchise_ID", "Franchise2_ID"]),
      ).trim();

      return gameId && team1Id && team2Id;
    })
    .map((row) => {
      const season = toNumber(
        firstValue(row, ["Season", "season", "Year", "YEAR"]),
      );
      const week = toNumber(
        firstValue(row, ["Week", "Schedule_Week"]),
      );
      const team1Id = String(
        firstValue(row, ["Team1_Franchise_ID", "Franchise1_ID"]),
      ).trim();
      const team2Id = String(
        firstValue(row, ["Team2_Franchise_ID", "Franchise2_ID"]),
      ).trim();

      const team1Identity =
        identityBySeasonFranchise.get(`${season}|${team1Id}`) || {};
      const team2Identity =
        identityBySeasonFranchise.get(`${season}|${team2Id}`) || {};

      const team1StoredName = String(
        firstValue(row, ["Team1_Franchise_Name", "Franchise1_Name"]),
      ).trim();
      const team2StoredName = String(
        firstValue(row, ["Team2_Franchise_Name", "Franchise2_Name"]),
      ).trim();

      let winnerId = String(row.Winner_Franchise_ID ?? "").trim();
      const team1Score = toOptionalNumber(
        firstValue(row, ["Team1_Score", "Franchise1_Score"]),
      );
      const team2Score = toOptionalNumber(
        firstValue(row, ["Team2_Score", "Franchise2_Score"]),
      );

      if (
        !winnerId &&
        team1Score !== null &&
        team2Score !== null
      ) {
        if (Number(team1Score) > Number(team2Score)) winnerId = team1Id;
        if (Number(team2Score) > Number(team1Score)) winnerId = team2Id;
      }

      const tier = String(row.Tier ?? "").trim().toUpperCase();

      return {
        id: String(row.Game_ID ?? "").trim(),
        gameId: String(row.Game_ID ?? "").trim(),
        season,
        week,
        gameNumber: toNumber(
          firstValue(row, [
            "Game_Numer",
            "Game_Number",
            "Week_Game_Number",
          ]),
          1,
        ),
        tier,
        tierClass: tier.toLowerCase(),
        gameCategory: String(row.Game_Category ?? "").trim(),
        gameType: String(row.Game_Type ?? "").trim(),
        label: buildGameLabel(row),
        bowlName: String(row.Bowl_Name ?? "").trim(),
        notes: String(row.Notes ?? "").trim(),
        winnerId,

        team1Id,
        team1Team:
          team1StoredName ||
          team1Identity.name ||
          team1Id,
        team1Logo: team1Identity.logo || "",
        team1CoachId: team1Identity.coachId || "",
        team1Coach: team1Identity.coach || "",
        team1Conference: team1Identity.conference || "",
        team1GameRank: toNumber(row.Team1_Game_Rank),
        team1Score,

        team2Id,
        team2Team:
          team2StoredName ||
          team2Identity.name ||
          team2Id,
        team2Logo: team2Identity.logo || "",
        team2CoachId: team2Identity.coachId || "",
        team2Coach: team2Identity.coach || "",
        team2Conference: team2Identity.conference || "",
        team2GameRank: toNumber(row.Team2_Game_Rank),
        team2Score,

        status: "final",
        statusLabel: "Final",
      };
    });
}

export async function getGameResults(options = {}) {
  const includeAllSeasons = Boolean(options.allSeasons);
  const includeLiveScores = options.includeLiveScores !== false;
  const [
    gameRows,
    teamRows,
    franchiseDirectoryAllRows,
    livePlayerRows,
    coachTenureRows,
  ] = await Promise.all([
    fetchCsvRows(GAME_RESULTS_CSV_URL, "GAME_RESULTS"),
    fetchTeamDataRows(),
    fetchCsvRows(
      FRANCHISE_DIRECTORY_CSV_URL,
      "FRANCHISE_DIRECTORY",
    ),
    includeLiveScores
      ? getLivePlayerScores().catch((error) => {
          console.warn(
            "LIVE_PLAYER_SCORES unavailable; score cards will fall back to GAME_RESULTS projections.",
            error,
          );
          return [];
        })
      : Promise.resolve([]),
    getCoachSeasonTenureRows().catch((error) => {
      console.warn(
        "COACH_SEASON_TENURE unavailable; games will fall back to current coach names.",
        error,
      );
      return [];
    }),
  ]);

  const franchiseDirectoryRows =
    franchiseDirectoryAllRows.filter((row) =>
      String(row.Franchise_ID ?? "").trim(),
    );

  const brandingLookup = createFranchiseBrandingLookup(
    franchiseDirectoryRows,
  );

  const historicalLogoLookup =
    buildHistoricalTeamLogoLookup_(franchiseDirectoryAllRows);

  const teamLookup = createTeamLookup(teamRows, brandingLookup);

  const historicalCoachForGame = (franchiseId, season, week, fallback = {}) => {
    const matchingTenures = coachTenureRows.filter(
      (tenure) =>
        String(tenure.franchiseId || "").trim() === String(franchiseId || "").trim() &&
        Number(tenure.season) === Number(season),
    );

    if (!matchingTenures.length) {
      return {
        coachId: fallback.coachId || "",
        coachName: fallback.coach || "",
      };
    }

    const weekMatched =
      matchingTenures.find((tenure) => {
        const start = Number(tenure.startWeek);
        const end = Number(tenure.endWeek);

        const startsInTime = !Number.isFinite(start) || start <= Number(week);
        const endsInTime = !Number.isFinite(end) || end <= 0 || end >= Number(week);

        return startsInTime && endsInTime;
      }) || matchingTenures[matchingTenures.length - 1];

    return {
      coachId: weekMatched.coachId || "",
      coachName: weekMatched.coachName || "",
    };
  };

  /*
   * LIVE_PLAYER_SCORES repeats the team totals/projections on every
   * player row. Build one lookup per Week + Franchise_ID so Scores can
   * use the same team projection totals already shown in Game Center.
   */
  const liveTeamLookup = new Map();

  livePlayerRows.forEach((row) => {
    const key = `${Number(row.week)}|${String(row.franchiseId || "").trim()}`;

    if (!liveTeamLookup.has(key)) {
      liveTeamLookup.set(key, {
        teamTotalPoints: row.teamTotalPoints,
        teamProjectedPoints: row.teamProjectedPoints,
      });
    }
  });

  return gameRows
    .filter((row) => {
      const rowSeason = Number(
        firstValue(row, ["Season", "season", "Year", "YEAR"]),
      );

      if (
        !includeAllSeasons &&
        Number.isFinite(rowSeason) &&
        rowSeason !== CURRENT_SEASON
      ) {
        return false;
      }

      const gameId = String(row.Game_ID ?? "").trim();
      const team1Id = String(
        firstValue(row, ["Team1_Franchise_ID", "Franchise1_ID"]),
      ).trim();
      const team2Id = String(
        firstValue(row, ["Team2_Franchise_ID", "Franchise2_ID"]),
      ).trim();

      return gameId && team1Id && team2Id;
    })
    .map((row) => {
      const team1Id = String(
        firstValue(row, ["Team1_Franchise_ID", "Franchise1_ID"]),
      ).trim();
      const team2Id = String(
        firstValue(row, ["Team2_Franchise_ID", "Franchise2_ID"]),
      ).trim();

      const team1 = teamLookup.get(team1Id) ?? {};
      const team2 = teamLookup.get(team2Id) ?? {};
      const rowSeason = toNumber(
        firstValue(row, ["Season", "season", "Year", "YEAR"]),
      );
      const isHistoricalSeason =
        Number.isFinite(rowSeason) && rowSeason !== CURRENT_SEASON;

      const tier = String(row.Tier || team1.tier || team2.tier || "")
        .trim()
        .toUpperCase();
      let statusData = normalizeGameStatus(row.Game_Status);
      let team1Score = toOptionalNumber(
        firstValue(row, ["Team1_Score", "Franchise1_Score"]),
      );
      let team2Score = toOptionalNumber(
        firstValue(row, ["Team2_Score", "Franchise2_Score"]),
      );
      const gameWeek = toNumber(
        firstValue(row, ["Week", "Schedule_Week"]),
      );

      const team1GameCoach = historicalCoachForGame(
        team1Id,
        rowSeason,
        gameWeek,
        team1,
      );
      const team2GameCoach = historicalCoachForGame(
        team2Id,
        rowSeason,
        gameWeek,
        team2,
      );

      const team1Live = liveTeamLookup.get(
        `${gameWeek}|${team1Id}`,
      ) ?? {};

      const team2Live = liveTeamLookup.get(
        `${gameWeek}|${team2Id}`,
      ) ?? {};

      const team1LiveActual = toOptionalNumber(team1Live.teamTotalPoints);
      const team2LiveActual = toOptionalNumber(team2Live.teamTotalPoints);

      const hasLiveActualScoring =
        (team1LiveActual !== null && team1LiveActual > 0) ||
        (team2LiveActual !== null && team2LiveActual > 0);

      const hasStoredFinalScoring =
        statusData.status === "final" &&
        team1Score !== null &&
        team2Score !== null;

      const hasStoredHistoricalScoring =
        isHistoricalSeason &&
        team1Score !== null &&
        team2Score !== null;

      // Final current-season games are authoritative in GAME_RESULTS after the
      // weekly rollover. Live games still use LIVE_PLAYER_SCORES below.
      const hasActualScoring =
        hasLiveActualScoring || hasStoredHistoricalScoring || hasStoredFinalScoring;

      /*
       * Current-season score cards must display the actual team totals from
       * LIVE_PLAYER_SCORES once real scoring has begun. GAME_RESULTS may still
       * contain 0.00 placeholders while a matchup is in progress, so do not
       * use those placeholder values for the live score display.
       */
      if (
        !isHistoricalSeason &&
        statusData.status !== "final" &&
        hasLiveActualScoring
      ) {
        if (team1LiveActual !== null) team1Score = team1LiveActual;
        if (team2LiveActual !== null) team2Score = team2LiveActual;
      }

      /*
       * During preseason/build testing, GAME_RESULTS can still contain
       * old copied test scores/statuses. LIVE_PLAYER_SCORES is our
       * authoritative signal that real scoring has actually begun.
       *
       * If no player scoring exists yet, render the matchup exactly like
       * the FBS/FCS scheduled cards: dash for score + projection beneath.
       */
      if (!hasActualScoring && !isHistoricalSeason) {
        statusData = {
          status: "upcoming",
          statusLabel: "Scheduled",
        };
        team1Score = null;
        team2Score = null;
      }

      if (isHistoricalSeason && team1Score !== null && team2Score !== null) {
        statusData = {
          status: "final",
          statusLabel: "Final",
        };
      }

      /*
       * Prefer the projection generated from LIVE_PLAYER_SCORES.
       * Fall back to a GAME_RESULTS projection field if one is ever
       * populated there.
       */
      const team1Projection =
        toOptionalNumber(team1Live.teamProjectedPoints) ??
        toOptionalNumber(
          firstValue(row, [
            "Team1_Projected_Score",
            "Team1_Projected",
            "Franchise1_Projected_Score",
          ]),
        );

      const team2Projection =
        toOptionalNumber(team2Live.teamProjectedPoints) ??
        toOptionalNumber(
          firstValue(row, [
            "Team2_Projected_Score",
            "Team2_Projected",
            "Franchise2_Projected_Score",
          ]),
        );

      const team1WinProbabilityRaw = toOptionalNumber(
        firstValue(row, [
          "Team1_Win_Probability",
          "Team1_Win_Prob",
          "Franchise1_Win_Probability",
        ]),
      );

      const team2WinProbabilityRaw = toOptionalNumber(
        firstValue(row, [
          "Team2_Win_Probability",
          "Team2_Win_Prob",
          "Franchise2_Win_Probability",
        ]),
      );

      let team1WinProbability = team1WinProbabilityRaw;
      let team2WinProbability = team2WinProbabilityRaw;

      if (
        team1WinProbability !== null &&
        team2WinProbability === null
      ) {
        team2WinProbability = 100 - team1WinProbability;
      }

      if (
        team2WinProbability !== null &&
        team1WinProbability === null
      ) {
        team1WinProbability = 100 - team2WinProbability;
      }

      let winnerId =
        hasActualScoring || isHistoricalSeason
          ? String(row.Winner_Franchise_ID ?? "").trim()
          : "";

      if (
        isHistoricalSeason &&
        !winnerId &&
        team1Score !== null &&
        team2Score !== null
      ) {
        if (Number(team1Score) > Number(team2Score)) {
          winnerId = team1Id;
        } else if (Number(team2Score) > Number(team1Score)) {
          winnerId = team2Id;
        }
      }
      const gameCategory = String(row.Game_Category ?? "").trim();
      const gameType = String(row.Game_Type ?? "").trim();

      /*
       * Historical ranking snapshot:
       * GAME_RESULTS stores the Top 25 rank each franchise held
       * when this matchup occurred. Current records and coach/team
       * information still come from TEAM DATA.
       */
      const team1GameRank = toNumber(row.Team1_Game_Rank);
      const team2GameRank = toNumber(row.Team2_Game_Rank);

      const gameRanks = [team1GameRank, team2GameRank].filter(
        (rank) => rank >= 1 && rank <= 25,
      );

      return {
        id: String(row.Game_ID ?? "").trim(),
        gameId: String(row.Game_ID ?? "").trim(),
        season: toNumber(row.Season),
        week: gameWeek,
        gameNumber: toNumber(
          firstValue(row, [
            "Game_Numer",
            "Game_Number",
            "Week_Game_Number",
          ]),
          1,
        ),
        featuredRank: toNumber(row.Featured_Rank),
        tier,
        tierClass: tier.toLowerCase(),
        gameCategory,
        gameCategoryId: normalizeId(gameCategory),
        gameType,
        label: buildGameLabel(row),
        notes: String(row.Notes ?? "").trim(),
        bowlName: String(row.Bowl_Name ?? "").trim(),
        ...statusData,
        team1Id,
        team1Team:
          isHistoricalSeason
            ? String(row.Team1_Franchise_Name ?? "").trim() || team1.name
            : team1.name || String(row.Team1_Franchise_Name ?? "").trim(),
        team1Initial: String(
          isHistoricalSeason
            ? String(row.Team1_Franchise_Name ?? "").trim() || team1.name || "?"
            : team1.name || row.Team1_Franchise_Name || "?",
        )
          .trim()
          .charAt(0)
          .toUpperCase(),
        team1CoachId: team1GameCoach.coachId || team1.coachId || "",
        team1Coach: team1GameCoach.coachName || team1.coach || "",
        team1Logo:
          (isHistoricalSeason
            ? (
                getTeamLogoOverride(
                  String(row.Team1_Franchise_Name ?? "").trim(),
                ) ||
                historicalLogoLookup.get(
                  String(row.Team1_Franchise_Name ?? "")
                    .trim()
                    .toLowerCase(),
                )
              )
            : "") ||
          team1.logo ||
          "",
        team1Conference:
          String(
            firstValue(row, [
              "Team1_Conference",
              "Team1_Game_Conference",
              "Franchise1_Conference",
            ]),
          ).trim() || team1.conference || "",
        team1ConferenceId: normalizeId(
          String(
            firstValue(row, [
              "Team1_Conference",
              "Team1_Game_Conference",
              "Franchise1_Conference",
            ]),
          ).trim() || team1.conference || "",
        ),
        team1OverallRecord:
          String(
            firstValue(row, [
              "Team1_Overall_Record",
              "Team1_Record",
              "Team1_Game_Record",
              "Team1_Season_Record",
            ]),
          ).trim() ||
          team1.overallRecord ||
          "0–0",
        team1ConferenceRecord: team1.conferenceRecord || "0–0",
        team1Top25Rank: team1GameRank,
        team1GameRank,
        team1CurrentTop25Rank: team1.top25Rank || 0,
        team1Top25: team1GameRank >= 1 && team1GameRank <= 25,
        team1Score,
        team1Projection,
        team1WinProbability,
        team2Id,
        team2Team:
          isHistoricalSeason
            ? String(row.Team2_Franchise_Name ?? "").trim() || team2.name
            : team2.name || String(row.Team2_Franchise_Name ?? "").trim(),
        team2Initial: String(
          isHistoricalSeason
            ? String(row.Team2_Franchise_Name ?? "").trim() || team2.name || "?"
            : team2.name || row.Team2_Franchise_Name || "?",
        )
          .trim()
          .charAt(0)
          .toUpperCase(),
        team2CoachId: team2GameCoach.coachId || team2.coachId || "",
        team2Coach: team2GameCoach.coachName || team2.coach || "",
        team2Logo:
          (isHistoricalSeason
            ? (
                getTeamLogoOverride(
                  String(row.Team2_Franchise_Name ?? "").trim(),
                ) ||
                historicalLogoLookup.get(
                  String(row.Team2_Franchise_Name ?? "")
                    .trim()
                    .toLowerCase(),
                )
              )
            : "") ||
          team2.logo ||
          "",
        team2Conference:
          String(
            firstValue(row, [
              "Team2_Conference",
              "Team2_Game_Conference",
              "Franchise2_Conference",
            ]),
          ).trim() || team2.conference || "",
        team2ConferenceId: normalizeId(
          String(
            firstValue(row, [
              "Team2_Conference",
              "Team2_Game_Conference",
              "Franchise2_Conference",
            ]),
          ).trim() || team2.conference || "",
        ),
        team2OverallRecord:
          String(
            firstValue(row, [
              "Team2_Overall_Record",
              "Team2_Record",
              "Team2_Game_Record",
              "Team2_Season_Record",
            ]),
          ).trim() ||
          team2.overallRecord ||
          "0–0",
        team2ConferenceRecord: team2.conferenceRecord || "0–0",
        team2Top25Rank: team2GameRank,
        team2GameRank,
        team2CurrentTop25Rank: team2.top25Rank || 0,
        team2Top25: team2GameRank >= 1 && team2GameRank <= 25,
        team2Score,
        team2Projection,
        team2WinProbability,
        winnerId,

        /*
         * Historical Top 25 filtering uses the saved matchup ranks.
         * A past week's Top 25 view therefore stays historically correct.
         */
        top25: gameRanks.length > 0,
        bestTop25Rank:
          gameRanks.length > 0 ? Math.min(...gameRanks) : 999,

        conferenceIds: [team1.conferenceId, team2.conferenceId].filter(
          Boolean,
        ),
      };
    })
    .sort((firstGame, secondGame) => {
      if (firstGame.week !== secondGame.week) {
        return firstGame.week - secondGame.week;
      }

      if (firstGame.tier !== secondGame.tier) {
        return firstGame.tier.localeCompare(secondGame.tier);
      }

      return firstGame.id.localeCompare(secondGame.id);
    });
}


/**
 * Returns one permanent MESH game by Game_ID.
 * Game-specific facts come from GAME_RESULTS while current
 * franchise/coach/record context continues to come from TEAM DATA.
 */
export async function getGameById(gameId) {
  const normalizedGameId = String(gameId ?? "").trim();

  if (!normalizedGameId) {
    throw new Error("A Game_ID is required.");
  }

  const games = await getGameResults({ allSeasons: true });
  const game = games.find((item) => item.gameId === normalizedGameId);

  if (!game) {
    throw new Error(`Game not found: ${normalizedGameId}`);
  }

  return game;
}


/**
 * Returns prior meetings between the same two permanent franchises.
 * Uses every GAME_RESULTS season currently available in the published sheet.
 */
export async function getHeadToHeadHistory(
  team1Id,
  team2Id,
  excludeGameId = "",
) {
  const firstId = String(team1Id ?? "").trim();
  const secondId = String(team2Id ?? "").trim();
  const excludedId = String(excludeGameId ?? "").trim();

  if (!firstId || !secondId) {
    return [];
  }

  const games = await getGameResults({ allSeasons: true });

  return games
    .filter((game) => {
      if (excludedId && game.gameId === excludedId) {
        return false;
      }

      const sameDirection =
        game.team1Id === firstId && game.team2Id === secondId;

      const oppositeDirection =
        game.team1Id === secondId && game.team2Id === firstId;

      return sameDirection || oppositeDirection;
    })
    .sort((a, b) => {
      if (a.season !== b.season) {
        return b.season - a.season;
      }

      return b.week - a.week;
    });
}


const LIVE_PLAYER_SCORES_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRwZdqNhyvQxRhmmZu9jzUdFnzB6ZFnh7gYe2bgN6qwPl9SGwPf9dYyrhLk8_dFONmrL9Ibi3iXYEnc/pub?gid=" +
  LIVE_PLAYER_SCORES_GID +
  "&single=true&output=csv";

const PLAYER_SCORE_ARCHIVE_CSV_URL =
  PUBLISHED_SHEET_BASE_URL +
  "?gid=" +
  PLAYER_SCORE_ARCHIVE_GID +
  "&single=true&output=csv";

function parseSimpleCsv_(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }

      row.push(field);
      field = "";

      if (row.some((value) => String(value).trim() !== "")) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    field += char;
  }

  row.push(field);

  if (row.some((value) => String(value).trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

function csvRowsToObjects_(rows) {
  if (!rows.length) return [];

  const headers = rows[0].map((header) => String(header || "").trim());

  return rows.slice(1).map((row) => {
    const object = {};

    headers.forEach((header, index) => {
      object[header] = row[index] ?? "";
    });

    return object;
  });
}

let livePlayerScoresCache = null;
let livePlayerScoresInflight = null;
const LIVE_PLAYER_SCORES_CACHE_TTL_MS = 60_000;

export async function getLivePlayerScores() {
  const now = Date.now();

  if (
    livePlayerScoresCache &&
    now - livePlayerScoresCache.timestamp < LIVE_PLAYER_SCORES_CACHE_TTL_MS
  ) {
    return livePlayerScoresCache.rows;
  }

  if (livePlayerScoresInflight) {
    return livePlayerScoresInflight;
  }

  livePlayerScoresInflight = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      CSV_REQUEST_TIMEOUT_MS,
    );

    try {
      const response = await fetch(LIVE_PLAYER_SCORES_CSV_URL, {
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `LIVE_PLAYER_SCORES request failed: ${response.status} ${response.statusText}`,
        );
      }

      const text = await response.text();
      const rows = csvRowsToObjects_(parseSimpleCsv_(text)).map((row) => ({
        season: Number(row.Season) || 0,
        week: Number(row.Week) || 0,
        franchiseId: String(row.Franchise_ID || "").trim(),
        franchiseName: String(row.Franchise_Name || "").trim(),
        sleeperLeagueId: String(row.Sleeper_League_ID || "").trim(),
        sleeperRosterId: Number(row.Sleeper_Roster_ID) || 0,
        sleeperMatchupId: String(row.Sleeper_Matchup_ID || "").trim(),
        playerId: String(row.Player_ID || "").trim(),
        playerName: String(row.Player_Name || "").trim(),
        position: String(row.Position || "").trim(),
        nflTeam: String(row.NFL_Team || "").trim(),
        lineupPosition: String(row.Lineup_Position || "").trim(),
        isStarter:
          String(row.Is_Starter || "").trim().toUpperCase() === "TRUE",
        playerPoints:
          row.Player_Points === "" ? null : Number(row.Player_Points),
        projectedPoints:
          row.Projected_Points === "" ? null : Number(row.Projected_Points),
        teamTotalPoints:
          row.Team_Total_Points === "" ? null : Number(row.Team_Total_Points),
        teamProjectedPoints:
          row.Team_Projected_Points === ""
            ? null
            : Number(row.Team_Projected_Points),
        updatedAt: String(row.Updated_At || "").trim(),
      }));

      livePlayerScoresCache = {
        rows,
        timestamp: Date.now(),
      };

      return rows;
    } catch (error) {
      if (livePlayerScoresCache?.rows?.length) {
        console.warn(
          "LIVE_PLAYER_SCORES refresh failed; using cached rows instead.",
          error,
        );
        return livePlayerScoresCache.rows;
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
      livePlayerScoresInflight = null;
    }
  })();

  return livePlayerScoresInflight;
}

export async function getPlayerScoreArchive() {
  const rows = await fetchCsvRows(
    PLAYER_SCORE_ARCHIVE_CSV_URL,
    "PLAYER_SCORE_ARCHIVE",
  );

  return rows
    .filter(
      (row) =>
        Number(row.Season) > 0 &&
        Number(row.Week) > 0 &&
        String(row.Player_ID || "").trim(),
    )
    .map((row) => ({
      season: Number(row.Season) || 0,
      week: Number(row.Week) || 0,
      franchiseId: String(row.Franchise_ID || "").trim(),
      franchiseName: String(row.Franchise_Name || "").trim(),
      sleeperLeagueId: String(row.Sleeper_League_ID || "").trim(),
      sleeperRosterId: Number(row.Sleeper_Roster_ID) || 0,
      sleeperMatchupId: String(row.Sleeper_Matchup_ID || "").trim(),
      playerId: String(row.Player_ID || "").trim(),
      playerName: String(row.Player_Name || "").trim(),
      position: String(row.Position || "").trim(),
      nflTeam: String(row.NFL_Team || "").trim(),
      lineupPosition: String(row.Lineup_Position || "").trim(),
      isStarter:
        String(row.Is_Starter || "").trim().toUpperCase() === "TRUE",
      playerPoints:
        row.Player_Points === "" ? null : Number(row.Player_Points),
    }));
}

export async function getGameRosterPlayers(game) {
  if (!game) return { team1: [], team2: [] };

  const rows = await getLivePlayerScores();

  const currentWeekRows = rows.filter(
    (row) => row.week === Number(game.week),
  );

  const sortStarters = (players) =>
    players
      .filter((player) => player.isStarter)
      .sort((a, b) => {
        const order = [
          "QB",
          "RB",
          "WR",
          "TE",
          "FLEX",
          "W/R/T",
          "SUPER_FLEX",
          "SUPER FLEX",
          "K",
          "DEF",
          "DL",
          "LB",
          "DB",
        ];

        const aIndex = order.indexOf(a.lineupPosition.toUpperCase());
        const bIndex = order.indexOf(b.lineupPosition.toUpperCase());

        if (aIndex !== bIndex) {
          return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
        }

        return a.playerName.localeCompare(b.playerName);
      });

  const team1Rows = currentWeekRows.filter(
    (row) => row.franchiseId === String(game.team1Id || ""),
  );

  const team2Rows = currentWeekRows.filter(
    (row) => row.franchiseId === String(game.team2Id || ""),
  );

  const firstNumericValue = (rows, key) => {
    const match = rows.find(
      (row) =>
        row[key] !== null &&
        row[key] !== undefined &&
        Number.isFinite(Number(row[key])),
    );

    return match ? Number(match[key]) : null;
  };

  return {
    team1: sortStarters(team1Rows),
    team2: sortStarters(team2Rows),
    team1TotalPoints: firstNumericValue(team1Rows, "teamTotalPoints"),
    team2TotalPoints: firstNumericValue(team2Rows, "teamTotalPoints"),
    team1ProjectedPoints: firstNumericValue(
      team1Rows,
      "teamProjectedPoints",
    ),
    team2ProjectedPoints: firstNumericValue(
      team2Rows,
      "teamProjectedPoints",
    ),
  };
}
