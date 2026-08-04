const TEAM_DATA_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRwZdqNhyvQxRhmmZu9jzUdFnzB6ZFnh7gYe2bgN6qwPl9SGwPf9dYyrhLk8_dFONmrL9Ibi3iXYEnc/pub?gid=1513820672&single=true&output=csv";

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

  return csvRows
    .slice(1)
    .map((row) => {
      const result = {};

      headers.forEach((header, index) => {
        if (!header) {
          return;
        }

        result[header] = row[index] ?? "";
      });

      return result;
    })
    .filter((row) => String(row.Franchise_ID ?? "").trim());
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

function normalizeId(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildRecord(wins, losses, ties) {
  const winValue = toNumber(wins);
  const lossValue = toNumber(losses);
  const tieValue = toNumber(ties);

  return tieValue > 0
    ? `${winValue}–${lossValue}–${tieValue}`
    : `${winValue}–${lossValue}`;
}

function getStatus(team) {
  const tier = String(team.Tier ?? "").trim().toUpperCase();
  const overallRank = toNumber(team.Overall_Rank, 999);
  const playoffSeed = toNumber(team.Playoff_Seed);
  const playoffStatus = String(
    team.Playoff_Status ?? "",
  ).trim();

  if (tier === "NFL" && overallRank >= 29) {
    return {
      status: "relegation",
      statusLabel: "Relegation Zone",
    };
  }

  if (tier === "FBS" && overallRank >= 1 && overallRank <= 4) {
    return {
      status: "promotion",
      statusLabel: "Promotion Position",
    };
  }

  if (tier === "FCS" && overallRank >= 1 && overallRank <= 8) {
    return {
      status: "promotion",
      statusLabel: "Promotion Position",
    };
  }

  if (playoffSeed > 0) {
    return {
      status: "playoff",
      statusLabel:
        playoffSeed === 1
          ? "No. 1 Seed"
          : `No. ${playoffSeed} Seed`,
    };
  }

  if (playoffStatus) {
    const normalizedStatus = playoffStatus.toLowerCase();

    if (normalizedStatus.includes("eliminated")) {
      return {
        status: "warning",
        statusLabel: playoffStatus,
      };
    }

    if (
      normalizedStatus.includes("clinched") ||
      normalizedStatus.includes("playoff") ||
      normalizedStatus.includes("bye")
    ) {
      return {
        status: "playoff",
        statusLabel: playoffStatus,
      };
    }

    return {
      status: "neutral",
      statusLabel: playoffStatus,
    };
  }

  return {
    status: "neutral",
    statusLabel: "",
  };
}

async function fetchTeamDataRows() {
  const response = await fetch(TEAM_DATA_CSV_URL, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Google Sheets request failed: ${response.status} ${response.statusText}`,
    );
  }

  const csvText = await response.text();
  const csvRows = parseCsv(csvText);
  const objects = csvRowsToObjects(csvRows);

  if (objects.length === 0) {
    throw new Error(
      "TEAM DATA returned no franchise rows. Confirm that the published sheet uses row 1 as its header row.",
    );
  }

  return objects;
}

export async function getStandingsData() {
  const rows = await fetchTeamDataRows();

  return rows.map((row) => {
    const tier = String(row.Tier ?? "").trim().toUpperCase();
    const tierClass = tier.toLowerCase();
    const conference = String(row.Conference ?? "").trim();
    const division = String(row.Division ?? "").trim();

    const overallRank = toNumber(row.Overall_Rank, 999);
    const conferenceRank = toNumber(
      row.Conference_Rank,
      overallRank,
    );
    const divisionRank = toNumber(
      row.Division_Rank,
      conferenceRank,
    );
    const top25Rank = toNumber(row.Top25_Rank);
    const previousRank = toNumber(
      row.Previous_RPI_Rank,
      overallRank,
    );

    return {
      id: String(row.Franchise_ID ?? "").trim(),
      franchiseId: String(row.Franchise_ID ?? "").trim(),
      coachId: String(row.Coach_ID ?? "").trim(),

      tier,
      tierClass,

      conference,
      conferenceId: normalizeId(conference),

      division,
      divisionId: normalizeId(division),

      team: String(row.Franchise_Name ?? "").trim(),
      coach: String(row.Coach_Name ?? "").trim(),

      overallRank,
      conferenceRank,
      divisionRank,
      top25Rank,

      playoffSeed: toNumber(row.Playoff_Seed),
      playoffStatus: String(
        row.Playoff_Status ?? "",
      ).trim(),
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

      overallSeasonRecord: buildRecord(
        row.Overall_Season_Wins,
        row.Overall_Season_Losses,
        row.Overall_Season_Ties,
      ),

      record: buildRecord(
        row.Tier_Standings_Wins,
        row.Tier_Standings_Losses,
        row.Tier_Standings_Ties,
      ),

      regularSeasonPF: toNumber(row.Regular_Season_PF),
      overallSeasonPF: toNumber(row.Overall_Season_PF),
      pointsFor: toNumber(row.Regular_Season_PF),

      movement: previousRank - overallRank,
      top25: top25Rank >= 1 && top25Rank <= 25,

      streak: String(row.Streak ?? "").trim(),

      ...getStatus(row),
    };
  });
}