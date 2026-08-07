const PUBLISHED_SHEET_BASE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRwZdqNhyvQxRhmmZu9jzUdFnzB6ZFnh7gYe2bgN6qwPl9SGwPf9dYyrhLk8_dFONmrL9Ibi3iXYEnc/pub";

const TEAM_DATA_CSV_URL =
  `${PUBLISHED_SHEET_BASE_URL}?gid=1513820672&single=true&output=csv`;

const GAME_RESULTS_CSV_URL =
  `${PUBLISHED_SHEET_BASE_URL}?gid=1867143153&single=true&output=csv`;

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

async function fetchCsvRows(url, label) {
  const response = await fetch(url, { cache: "no-store" });

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

  return rows;
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
  const overallRank = toNumber(team.Overall_Rank, 999);
  const playoffSeed = toNumber(team.Playoff_Seed);
  const playoffStatus = String(team.Playoff_Status ?? "").trim();

  if (tier === "NFL" && overallRank >= 29) {
    return { status: "relegation", statusLabel: "Relegation Zone" };
  }

  if (tier === "FBS" && overallRank >= 1 && overallRank <= 4) {
    return { status: "promotion", statusLabel: "Promotion Position" };
  }

  if (tier === "FCS" && overallRank >= 1 && overallRank <= 8) {
    return { status: "promotion", statusLabel: "Promotion Position" };
  }

  if (playoffSeed > 0) {
    return {
      status: "playoff",
      statusLabel:
        playoffSeed === 1 ? "No. 1 Seed" : `No. ${playoffSeed} Seed`,
    };
  }

  if (playoffStatus) {
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

export async function getStandingsData() {
  const rows = await fetchTeamDataRows();

  return rows.map((row) => {
    const tier = String(row.Tier ?? "").trim().toUpperCase();
    const conference = String(row.Conference ?? "").trim();
    const division = String(row.Division ?? "").trim();
    const overallRank = toNumber(row.Overall_Rank, 999);
    const conferenceRank = toNumber(row.Conference_Rank, overallRank);
    const divisionRank = toNumber(row.Division_Rank, conferenceRank);
    const top25Rank = toNumber(row.Top25_Rank);
    const previousRank = toNumber(row.Previous_RPI_Rank, overallRank);

    return {
      id: String(row.Franchise_ID ?? "").trim(),
      franchiseId: String(row.Franchise_ID ?? "").trim(),
      coachId: String(row.Coach_ID ?? "").trim(),
      tier,
      tierClass: tier.toLowerCase(),
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
      ...getStandingsStatus(row),
    };
  });
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

function createTeamLookup(rows) {
  return new Map(
    rows.map((row) => {
      const franchiseId = String(row.Franchise_ID ?? "").trim();
      const tier = String(row.Tier ?? "").trim().toUpperCase();
      const top25Rank = toNumber(row.Top25_Rank);

      return [
        franchiseId,
        {
          franchiseId,
          name: String(row.Franchise_Name ?? "").trim(),
          coach: String(row.Coach_Name ?? "").trim(),
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

export async function getGameResults() {
  const [gameRows, teamRows] = await Promise.all([
    fetchCsvRows(GAME_RESULTS_CSV_URL, "GAME_RESULTS"),
    fetchTeamDataRows(),
  ]);

  const teamLookup = createTeamLookup(teamRows);

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
      const team1Id = String(
        firstValue(row, ["Team1_Franchise_ID", "Franchise1_ID"]),
      ).trim();
      const team2Id = String(
        firstValue(row, ["Team2_Franchise_ID", "Franchise2_ID"]),
      ).trim();

      const team1 = teamLookup.get(team1Id) ?? {};
      const team2 = teamLookup.get(team2Id) ?? {};
      const tier = String(row.Tier || team1.tier || team2.tier || "")
        .trim()
        .toUpperCase();
      const statusData = normalizeGameStatus(row.Game_Status);
      const team1Score = toOptionalNumber(
        firstValue(row, ["Team1_Score", "Franchise1_Score"]),
      );
      const team2Score = toOptionalNumber(
        firstValue(row, ["Team2_Score", "Franchise2_Score"]),
      );
      const team1Projection = toOptionalNumber(
        firstValue(row, [
          "Team1_Projected_Score",
          "Team1_Projected",
          "Franchise1_Projected_Score",
        ]),
      );
      const team2Projection = toOptionalNumber(
        firstValue(row, [
          "Team2_Projected_Score",
          "Team2_Projected",
          "Franchise2_Projected_Score",
        ]),
      );
      const winnerId = String(row.Winner_Franchise_ID ?? "").trim();
      const gameCategory = String(row.Game_Category ?? "").trim();
      const gameType = String(row.Game_Type ?? "").trim();

      return {
        id: String(row.Game_ID ?? "").trim(),
        gameId: String(row.Game_ID ?? "").trim(),
        season: toNumber(row.Season),
        week: toNumber(firstValue(row, ["Week", "Schedule_Week"])),
        gameNumber: toNumber(
          firstValue(row, ["Game_Number", "Week_Game_Number"]),
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
          team1.name || String(row.Team1_Franchise_Name ?? "").trim(),
        team1Initial: String(
          team1.name || row.Team1_Franchise_Name || "?",
        )
          .trim()
          .charAt(0)
          .toUpperCase(),
        team1Coach: team1.coach || "",
        team1Conference: team1.conference || "",
        team1ConferenceId: team1.conferenceId || "",
        team1OverallRecord: team1.overallRecord || "0–0",
        team1ConferenceRecord: team1.conferenceRecord || "0–0",
        team1Top25Rank: team1.top25Rank || 0,
        team1Top25: Boolean(team1.top25),
        team1Score,
        team1Projection,
        team2Id,
        team2Team:
          team2.name || String(row.Team2_Franchise_Name ?? "").trim(),
        team2Initial: String(
          team2.name || row.Team2_Franchise_Name || "?",
        )
          .trim()
          .charAt(0)
          .toUpperCase(),
        team2Coach: team2.coach || "",
        team2Conference: team2.conference || "",
        team2ConferenceId: team2.conferenceId || "",
        team2OverallRecord: team2.overallRecord || "0–0",
        team2ConferenceRecord: team2.conferenceRecord || "0–0",
        team2Top25Rank: team2.top25Rank || 0,
        team2Top25: Boolean(team2.top25),
        team2Score,
        team2Projection,
        winnerId,
        top25: Boolean(team1.top25 || team2.top25),
        bestTop25Rank: Math.min(
          ...[team1.top25Rank, team2.top25Rank].filter(
            (rank) => rank >= 1 && rank <= 25,
          ),
          999,
        ),
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
