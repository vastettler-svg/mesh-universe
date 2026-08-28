import {
  getStandingsArchive,
  getStandingsData,
} from "./googleSheets";

import {
  getCoachDataRows,
  getCoachSeasonTenureRows,
} from "./coachData";

const CURRENT_SEASON = 2026;
const TIERS = ["NFL", "FBS", "FCS"];

function clean(value) {
  return String(value ?? "").trim();
}

function numberOrZero(value) {
  if (value === "" || value === null || value === undefined) return 0;

  const parsed = Number(
    String(value)
      .replace(/,/g, "")
      .replace(/%/g, "")
      .trim(),
  );

  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeTier(value) {
  return clean(value).toUpperCase();
}

function sortPrestigeRows(rows) {
  return [...rows].sort(
    (a, b) =>
      numberOrZero(b.points) - numberOrZero(a.points) ||
      String(a.name || "").localeCompare(String(b.name || "")),
  );
}

function addRanks(rows) {
  return sortPrestigeRows(rows).map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

function rawCoachCareerPrestige(row) {
  const raw = row?.raw || {};

  const candidates = [
    raw.OVR_Prestige_Totals_COACH,
    raw.OVR_Prestige_Total_COACH,
    raw.Coach_Prestige_Total,
    raw["Coach Prestige Total"],
    row?.prestige,
  ];

  for (const value of candidates) {
    if (value === "" || value === null || value === undefined) continue;

    const parsed = Number(String(value).replace(/,/g, "").trim());

    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

export async function getFranchisePrestigeRankings() {
  const [currentRows, archiveRows] = await Promise.all([
    getStandingsData(),
    getStandingsArchive(),
  ]);

  const totals = new Map();

  archiveRows
    .filter((row) => Number(row.season) < CURRENT_SEASON)
    .forEach((row) => {
      const franchiseId = clean(row.franchiseId);
      if (!franchiseId) return;

      const earned = numberOrZero(
        row.prestigePoints ??
          row.raw?.Franchise_Prestige_Points ??
          row.raw?.["Franchise Prestige Points"],
      );

      const existing = totals.get(franchiseId) || {
        id: franchiseId,
        franchiseId,
        name: row.franchiseName || row.team || franchiseId,
        points: 0,
        historicalPoints: 0,
        currentSeasonPoints: 0,
        tier: row.tier || "",
        conference: row.conference || "",
        logo: row.logo || "",
        coach: row.coachName || row.coach || "",
      };

      existing.historicalPoints += earned;
      existing.points += earned;
      totals.set(franchiseId, existing);
    });

  currentRows.forEach((row) => {
    const franchiseId = clean(row.franchiseId || row.id);
    if (!franchiseId) return;

    const currentPoints = numberOrZero(
      row.prestigePoints ??
        row.raw?.Prest_Crnt_Ssn_Total ??
        row.raw?.["Prest Crnt Ssn Total"],
    );

    const existing = totals.get(franchiseId) || {
      id: franchiseId,
      franchiseId,
      points: 0,
      historicalPoints: 0,
      currentSeasonPoints: 0,
    };

    totals.set(franchiseId, {
      ...existing,
      id: franchiseId,
      franchiseId,
      name: row.team || existing.name || franchiseId,
      tier: row.tier || existing.tier || "",
      conference: row.conference || existing.conference || "",
      logo: row.logo || row.logoUrl || existing.logo || "",
      coach: row.coach || existing.coach || "",
      currentSeasonPoints: currentPoints,
      points: numberOrZero(existing.historicalPoints) + currentPoints,
    });
  });

  return addRanks([...totals.values()]);
}

export async function getCoachPrestigeRankings() {
  /*
   * Reuse the exact same two shared services that now power Coach Profile.
   * This removes the second independent set of CSV fetches that was causing
   * the Prestige page to remain stuck in Loading.
   */
  const [coachRows, tenureRows, teams] = await Promise.all([
    getCoachDataRows(),
    getCoachSeasonTenureRows(),
    getStandingsData(),
  ]);

  const teamByCoachId = new Map();
  const teamByFranchiseId = new Map();

  teams.forEach((team) => {
    const coachId = clean(team.coachId || team.ownerId || team.coach);
    const franchiseId = clean(team.franchiseId || team.id);

    if (coachId) teamByCoachId.set(coachId, team);
    if (franchiseId) teamByFranchiseId.set(franchiseId, team);
  });

  const tenureByCoach = new Map();

  tenureRows.forEach((row, rowIndex) => {
    const coachId = clean(row.coachId);

    // Commissioner assignments intentionally have no Coach_ID.
    if (!coachId) return;

    const existing = tenureByCoach.get(coachId) || {
      coachId,
      points: 0,
      currentSeasonPoints: 0,
      latest: null,
    };

    const earned = numberOrZero(row.prestigePoints);
    existing.points += earned;

    if (Number(row.season) === CURRENT_SEASON) {
      existing.currentSeasonPoints += earned;
    }

    const candidate = {
      rowIndex,
      season: numberOrZero(row.season),
      endWeek: numberOrZero(row.endWeek),
      coachName: clean(row.coachName),
      franchiseId: clean(row.franchiseId),
      franchiseName: clean(row.franchiseName),
      tier: normalizeTier(row.tier),
      conference: clean(row.conference),
    };

    const latest = existing.latest;

    if (
      !latest ||
      candidate.season > latest.season ||
      (candidate.season === latest.season &&
        candidate.endWeek > latest.endWeek) ||
      (candidate.season === latest.season &&
        candidate.endWeek === latest.endWeek &&
        candidate.rowIndex > latest.rowIndex)
    ) {
      existing.latest = candidate;
    }

    tenureByCoach.set(coachId, existing);
  });

  const allCoachIds = new Set([
    ...coachRows.map((row) => clean(row.coachId)).filter(Boolean),
    ...tenureByCoach.keys(),
  ]);

  const coachDataById = new Map(
    coachRows
      .filter((row) => clean(row.coachId))
      .map((row) => [clean(row.coachId), row]),
  );

  const results = [];

  allCoachIds.forEach((coachId) => {
    const coachData = coachDataById.get(coachId);
    const tenure = tenureByCoach.get(coachId) || {
      points: 0,
      currentSeasonPoints: 0,
      latest: null,
    };

    const currentTeam =
      teamByCoachId.get(coachId) ||
      teamByFranchiseId.get(clean(coachData?.franchiseId)) ||
      null;

    const latest = tenure.latest || {};

    /*
     * COACH DATA currently contains the established career Prestige total
     * (OVR_Prestige_Totals_COACH). Use it when present so the leaderboard
     * matches existing Coach Profile / spreadsheet totals.
     *
     * COACH_SEASON_TENURE remains the fallback and permanent historical
     * source when a coach is no longer present in current COACH DATA.
     */
    const careerFromCoachData = rawCoachCareerPrestige(coachData);
    const careerFromTenure = numberOrZero(tenure.points);

    const points =
      careerFromCoachData !== null
        ? careerFromCoachData
        : careerFromTenure;

    const franchiseId =
      clean(currentTeam?.franchiseId || currentTeam?.id) ||
      clean(coachData?.franchiseId) ||
      clean(latest.franchiseId);

    results.push({
      id: coachId,
      coachId,
      name:
        clean(coachData?.coachName) ||
        clean(currentTeam?.coach) ||
        clean(latest.coachName) ||
        coachId,
      points,
      currentSeasonPoints: numberOrZero(tenure.currentSeasonPoints),
      franchiseId,
      franchiseName:
        clean(currentTeam?.team) ||
        clean(coachData?.currentTeam) ||
        clean(latest.franchiseName),
      tier:
        normalizeTier(currentTeam?.tier) ||
        normalizeTier(latest.tier),
      conference:
        clean(currentTeam?.conference) ||
        clean(latest.conference),
      logo:
        clean(currentTeam?.logo || currentTeam?.logoUrl),
    });
  });

  return addRanks(results);
}

function groupTopThreeByTier(rows) {
  return TIERS.reduce((result, tier) => {
    result[tier] = sortPrestigeRows(
      rows.filter(
        (row) => normalizeTier(row.tier) === tier,
      ),
    )
      .slice(0, 3)
      .map((row) => ({
        id: row.id,
        name: row.name,
        points: numberOrZero(row.points),
      }));

    return result;
  }, {});
}

export async function getFranchisePrestigeLeaders() {
  return groupTopThreeByTier(
    await getFranchisePrestigeRankings(),
  );
}

export async function getCoachPrestigeLeaders() {
  return groupTopThreeByTier(
    await getCoachPrestigeRankings(),
  );
}

export async function getPrestigeRankings(type = "franchise") {
  return type === "coach"
    ? getCoachPrestigeRankings()
    : getFranchisePrestigeRankings();
}
