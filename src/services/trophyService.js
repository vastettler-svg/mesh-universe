import {
  getGameResults,
  getStandingsArchive,
  getStandingsData,
} from "./googleSheets";

/*
 * MESH FOOTBALL — TROPHY VAULT DATA ENGINE
 *
 * Phase 9A deliberately keeps trophy-award logic outside the profile UI.
 * Franchise and Coach Trophy Rooms will both consume the same award events,
 * so a championship is calculated once and credited to both permanent
 * Franchise_ID and the coach who controlled that franchise when it was earned.
 *
 * Historical standings source: STANDINGS_ARCHIVE
 * Game / score source: GAME_RESULTS through getGameResults({ allSeasons: true })
 * Current identity fallback: TEAM DATA through getStandingsData()
 *
 * Future ACTIVE_STANDINGS can be merged into getUnifiedStandingsRows() without
 * changing the public Trophy Vault functions below.
 */

const REGULAR_SEASON_LAST_WEEK = {
  NFL: 13,
  FBS: 12,
  FCS: 12,
};

const TIER_ORDER = ["NFL", "FBS", "FCS"];

function text(value) {
  return String(value ?? "").trim();
}

function upper(value) {
  return text(value).toUpperCase();
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function optionalNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function slug(value) {
  return text(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeConference(value) {
  const raw = text(value);
  const key = raw.toLowerCase();

  const aliases = {
    coastal: "CAA",
    "coastal athletic association": "CAA",
    caa: "CAA",
    ivy: "Ivy League",
    "ivy league": "Ivy League",
    "missouri valley": "MVC",
    mvc: "MVC",
    mvfc: "MVC",
    northeast: "NEC",
    nec: "NEC",
  };

  return aliases[key] || raw;
}

function gameDescriptor(game) {
  return [
    game?.gameCategory,
    game?.gameType,
    game?.label,
    game?.bowlName,
    game?.notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isFinal(game) {
  return text(game?.status).toLowerCase() === "final";
}

function isRegularSeasonGame(game) {
  if (!isFinal(game)) return false;

  const descriptor = gameDescriptor(game);
  const gameType = text(game?.gameType).toLowerCase();

  if (gameType === "regular season") return true;

  return ![
    "playoff",
    "wild card",
    "divisional",
    "quarterfinal",
    "quarter final",
    "semifinal",
    "semi final",
    "championship",
    "bowl",
    "cfp",
  ].some((term) => descriptor.includes(term));
}

function isConferenceChampionshipGame(game) {
  const descriptor = gameDescriptor(game);
  return descriptor.includes("conference championship");
}

function isNationalChampionshipGame(game, tier) {
  const descriptor = gameDescriptor(game);

  if (tier === "NFL") return descriptor.includes("super bowl");

  if (tier === "FBS") {
    return (
      descriptor.includes("national championship") ||
      descriptor.includes("cfp championship")
    );
  }

  if (tier === "FCS") {
    return (
      descriptor.includes("national championship") ||
      (descriptor.includes("championship") && descriptor.includes("fcs"))
    );
  }

  return false;
}

function getGameSide(game, franchiseId) {
  if (text(game?.team1Id) === text(franchiseId)) return 1;
  if (text(game?.team2Id) === text(franchiseId)) return 2;
  return null;
}

function getGameParticipant(game, franchiseId) {
  const side = getGameSide(game, franchiseId);
  if (!side) return null;

  const ownPrefix = side === 1 ? "team1" : "team2";
  const opponentPrefix = side === 1 ? "team2" : "team1";

  return {
    franchiseId: text(game?.[`${ownPrefix}Id`]),
    franchiseName: text(game?.[`${ownPrefix}Team`]),
    coachId: text(game?.[`${ownPrefix}CoachId`]),
    coachName: text(game?.[`${ownPrefix}Coach`]),
    logo: text(game?.[`${ownPrefix}Logo`]),
    conference: normalizeConference(game?.[`${ownPrefix}Conference`]),
    score: optionalNumber(game?.[`${ownPrefix}Score`]),
    opponentFranchiseId: text(game?.[`${opponentPrefix}Id`]),
    opponentName: text(game?.[`${opponentPrefix}Team`]),
    opponentLogo: text(game?.[`${opponentPrefix}Logo`]),
    opponentScore: optionalNumber(game?.[`${opponentPrefix}Score`]),
  };
}

function winnerParticipant(game) {
  if (!isFinal(game) || !text(game?.winnerId)) return null;
  return getGameParticipant(game, game.winnerId);
}

function eventId(parts) {
  return parts.map((part) => slug(part) || "x").join("__");
}

function buildGameTrophyEvent({
  game,
  awardType,
  awardName,
  assetKey,
  conference = "",
}) {
  const winner = winnerParticipant(game);
  if (!winner) return null;

  return {
    id: eventId([
      game.season,
      awardType,
      awardName,
      winner.franchiseId,
      game.gameId,
    ]),
    season: number(game.season),
    week: number(game.week),
    tier: upper(game.tier),
    awardType,
    awardName,
    assetKey,
    franchiseId: winner.franchiseId,
    franchiseName: winner.franchiseName,
    franchiseLogo: winner.logo,
    coachId: winner.coachId,
    coachName: winner.coachName,
    conference: normalizeConference(conference || winner.conference),
    gameId: text(game.gameId),
    opponentFranchiseId: winner.opponentFranchiseId,
    opponentName: winner.opponentName,
    opponentLogo: winner.opponentLogo,
    score: winner.score,
    opponentScore: winner.opponentScore,
    conferenceRecord: "",
  };
}

function archiveIdentity(row) {
  return {
    franchiseId: text(row?.franchiseId),
    franchiseName: text(row?.franchiseName || row?.team),
    franchiseLogo: text(row?.logo),
    coachId: text(row?.coachId),
    coachName: text(row?.coachName || row?.coach),
    conference: normalizeConference(row?.conference),
  };
}

function assetKeyForConference(tier, conference) {
  return `${tier.toLowerCase()}_conference_${slug(normalizeConference(conference))}`;
}

function getUnifiedStandingsRows(archiveRows, currentRows) {
  /*
   * Today: completed seasons live in STANDINGS_ARCHIVE; currentRows are kept
   * available only as an identity fallback.
   *
   * Future ACTIVE_STANDINGS integration belongs here. When that source exists,
   * merge it with archiveRows and mark current rows appropriately rather than
   * changing any award-building function below.
   */
  return {
    completed: archiveRows || [],
    current: currentRows || [],
  };
}

function findChampionshipGame(games, row) {
  const tier = upper(row?.tier);
  const season = number(row?.season);
  const franchiseId = text(row?.franchiseId);

  return (games || []).find(
    (game) =>
      number(game.season) === season &&
      upper(game.tier) === tier &&
      getGameSide(game, franchiseId) &&
      isNationalChampionshipGame(game, tier),
  );
}

function findConferenceChampionshipGame(games, row) {
  const tier = upper(row?.tier);
  const season = number(row?.season);
  const franchiseId = text(row?.franchiseId);

  return (games || []).find(
    (game) =>
      number(game.season) === season &&
      upper(game.tier) === tier &&
      getGameSide(game, franchiseId) &&
      isConferenceChampionshipGame(game),
  );
}

function buildChampionshipEvents(archiveRows, games) {
  const events = [];

  (archiveRows || []).forEach((row) => {
    const tier = upper(row.tier);
    const playoffResult = text(row.playoffResult).toLowerCase();
    const conferenceResult = text(row.conferenceResult).toLowerCase();
    const identity = archiveIdentity(row);

    const isNationalChampion =
      playoffResult === "champion" ||
      playoffResult.includes("national champion") ||
      playoffResult.includes("super bowl champion");

    if (isNationalChampion) {
      const championshipGame = findChampionshipGame(games, row);

      if (championshipGame) {
        const awardName =
          tier === "NFL"
            ? "Super Bowl Champion"
            : tier === "FBS"
              ? "FBS National Champion"
              : "FCS National Champion";

        const assetKey =
          tier === "NFL"
            ? "nfl_super_bowl"
            : tier === "FBS"
              ? "fbs_national_championship"
              : "fcs_national_championship";

        const event = buildGameTrophyEvent({
          game: championshipGame,
          awardType: "national_champion",
          awardName,
          assetKey,
          conference: row.conference,
        });

        if (event) events.push(event);
      } else {
        events.push({
          id: eventId([
            row.season,
            "national-champion",
            tier,
            row.franchiseId,
          ]),
          season: number(row.season),
          week: null,
          tier,
          awardType: "national_champion",
          awardName:
            tier === "NFL"
              ? "Super Bowl Champion"
              : tier === "FBS"
                ? "FBS National Champion"
                : "FCS National Champion",
          assetKey:
            tier === "NFL"
              ? "nfl_super_bowl"
              : tier === "FBS"
                ? "fbs_national_championship"
                : "fcs_national_championship",
          ...identity,
          gameId: "",
          opponentFranchiseId: "",
          opponentName: "",
          opponentLogo: "",
          score: null,
          opponentScore: null,
          conferenceRecord: "",
        });
      }
    }

    if (conferenceResult.includes("conference champion")) {
      const conference = normalizeConference(row.conference);
      const championshipGame = findConferenceChampionshipGame(games, row);

      /*
       * NFL and FBS conference titles have title games, so prefer GAME_RESULTS
       * for opponent and final score. FCS conference champions do not use a
       * conference championship game in MESH; their placard uses final
       * conference record instead.
       */
      if ((tier === "NFL" || tier === "FBS") && championshipGame) {
        const event = buildGameTrophyEvent({
          game: championshipGame,
          awardType: "conference_champion",
          awardName:
            tier === "NFL"
              ? `${conference || "Conference"} Champion`
              : `${conference || "Conference"} Conference Champion`,
          assetKey: assetKeyForConference(tier, conference),
          conference,
        });

        if (event) events.push(event);
      } else {
        events.push({
          id: eventId([
            row.season,
            "conference-champion",
            tier,
            conference,
            row.franchiseId,
          ]),
          season: number(row.season),
          week: null,
          tier,
          awardType: "conference_champion",
          awardName:
            tier === "NFL"
              ? `${conference || "Conference"} Champion`
              : `${conference || "Conference"} Conference Champion`,
          assetKey: assetKeyForConference(tier, conference),
          ...identity,
          conference,
          gameId: "",
          opponentFranchiseId: "",
          opponentName: "",
          opponentLogo: "",
          score: null,
          opponentScore: null,
          conferenceRecord:
            tier === "FCS" ? text(row.tierStandingsRecord) : "",
        });
      }
    }
  });

  return events;
}

function buildBowlEvents(games) {
  return (games || [])
    .filter((game) => {
      if (!isFinal(game)) return false;
      if (upper(game.tier) !== "FBS") return false;
      if (!text(game.bowlName)) return false;

      /* The CFP National Championship is represented by its national title trophy. */
      const descriptor = gameDescriptor(game);
      if (
        descriptor.includes("national championship") ||
        descriptor.includes("cfp championship")
      ) {
        return false;
      }

      return Boolean(text(game.winnerId));
    })
    .map((game) =>
      buildGameTrophyEvent({
        game,
        awardType: "bowl_champion",
        awardName: `${text(game.bowlName)} Champion`,
        assetKey: `fbs_bowl_${slug(game.bowlName)}`,
      }),
    )
    .filter(Boolean);
}

function buildWeeklyHighScoreEvents(games) {
  const franchiseWeekScores = new Map();

  (games || []).forEach((game) => {
    const tier = upper(game.tier);
    const season = number(game.season);
    const week = number(game.week);
    const lastWeek = REGULAR_SEASON_LAST_WEEK[tier];

    if (!lastWeek || week < 1 || week > lastWeek) return;
    if (!isRegularSeasonGame(game)) return;

    [1, 2].forEach((side) => {
      const prefix = side === 1 ? "team1" : "team2";
      const franchiseId = text(game[`${prefix}Id`]);
      const score = optionalNumber(game[`${prefix}Score`]);

      if (!franchiseId || score === null) return;

      const key = `${season}|${tier}|${week}|${franchiseId}`;
      const existing = franchiseWeekScores.get(key);

      /*
       * GAME_RESULTS can contain duplicate franchise/week appearances. MESH's
       * high-score rule counts each Franchise_ID only once before the weekly
       * tier maximum is selected. If duplicates disagree, preserve the highest
       * stored score and its game identity.
       */
      if (!existing || score > existing.score) {
        franchiseWeekScores.set(key, {
          season,
          tier,
          week,
          score,
          game,
          participant: getGameParticipant(game, franchiseId),
        });
      }
    });
  });

  const byTierWeek = new Map();

  franchiseWeekScores.forEach((entry) => {
    const key = `${entry.season}|${entry.tier}|${entry.week}`;
    if (!byTierWeek.has(key)) byTierWeek.set(key, []);
    byTierWeek.get(key).push(entry);
  });

  const events = [];

  byTierWeek.forEach((entries) => {
    const topScore = Math.max(...entries.map((entry) => entry.score));

    entries
      .filter((entry) => entry.score === topScore)
      .forEach((entry) => {
        const participant = entry.participant;
        if (!participant) return;

        events.push({
          id: eventId([
            entry.season,
            entry.tier,
            entry.week,
            "weekly-high-score",
            participant.franchiseId,
          ]),
          season: entry.season,
          week: entry.week,
          tier: entry.tier,
          awardType: "weekly_high_score",
          awardName: `${entry.tier} Weekly High Score`,
          assetKey: `${entry.tier.toLowerCase()}_weekly_high_score_plaque`,
          franchiseId: participant.franchiseId,
          franchiseName: participant.franchiseName,
          franchiseLogo: participant.logo,
          coachId: participant.coachId,
          coachName: participant.coachName,
          conference: participant.conference,
          gameId: text(entry.game.gameId),
          opponentFranchiseId: participant.opponentFranchiseId,
          opponentName: participant.opponentName,
          opponentLogo: participant.opponentLogo,
          score: entry.score,
          opponentScore: participant.opponentScore,
          conferenceRecord: "",
        });
      });
  });

  return events.sort((a, b) => {
    if (a.season !== b.season) return b.season - a.season;
    if (a.week !== b.week) return b.week - a.week;
    if (a.tier !== b.tier) {
      return TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier);
    }
    return a.franchiseId.localeCompare(b.franchiseId);
  });
}

function uniqueEvents(events) {
  const map = new Map();
  (events || []).forEach((event) => {
    if (event?.id && !map.has(event.id)) map.set(event.id, event);
  });
  return Array.from(map.values());
}

function sortTrophyEvents(events) {
  return [...events].sort((a, b) => {
    if (a.season !== b.season) return b.season - a.season;

    const typeOrder = {
      national_champion: 1,
      conference_champion: 2,
      bowl_champion: 3,
      weekly_high_score: 4,
    };

    const aType = typeOrder[a.awardType] || 99;
    const bType = typeOrder[b.awardType] || 99;
    if (aType !== bType) return aType - bType;

    return text(a.awardName).localeCompare(text(b.awardName));
  });
}

function buildBannerAchievements(archiveRows) {
  const franchiseMap = new Map();

  function ensure(row) {
    const franchiseId = text(row.franchiseId);
    if (!franchiseMap.has(franchiseId)) {
      franchiseMap.set(franchiseId, {
        franchiseId,
        tier: upper(row.tier),
        superBowlChampions: [],
        conferenceChampions: [],
        divisionChampions: [],
        nationalChampions: [],
        cfpQualifiers: [],
        playoffQualifiers: [],
      });
    }
    return franchiseMap.get(franchiseId);
  }

  (archiveRows || []).forEach((row) => {
    const target = ensure(row);
    const tier = upper(row.tier);
    const season = number(row.season);
    const playoffResult = text(row.playoffResult).toLowerCase();
    const conferenceResult = text(row.conferenceResult).toLowerCase();

    const champion =
      playoffResult === "champion" || playoffResult.includes("national champion");

    if (conferenceResult.includes("conference champion")) {
      target.conferenceChampions.push(season);
    }

    if (tier === "NFL") {
      if (champion) target.superBowlChampions.push(season);
      if (number(row.divisionRank) === 1) target.divisionChampions.push(season);
    }

    if (tier === "FBS") {
      if (champion) target.nationalChampions.push(season);

      const qualified =
        number(row.playoffSeed) > 0 ||
        playoffResult.includes("cfp") ||
        playoffResult.includes("quarterfinal") ||
        playoffResult.includes("semifinal") ||
        playoffResult.includes("runner-up") ||
        champion;

      if (qualified) target.cfpQualifiers.push(season);
    }

    if (tier === "FCS") {
      if (champion) target.nationalChampions.push(season);

      const qualified =
        number(row.playoffSeed) > 0 ||
        (playoffResult && !playoffResult.includes("no postseason"));

      if (qualified) target.playoffQualifiers.push(season);
    }
  });

  franchiseMap.forEach((value) => {
    [
      "superBowlChampions",
      "conferenceChampions",
      "divisionChampions",
      "nationalChampions",
      "cfpQualifiers",
      "playoffQualifiers",
    ].forEach((field) => {
      value[field] = Array.from(new Set(value[field])).sort((a, b) => b - a);
    });
  });

  return franchiseMap;
}

export function buildTrophyVaultData({
  standingsArchive = [],
  currentStandings = [],
  games = [],
} = {}) {
  const unified = getUnifiedStandingsRows(standingsArchive, currentStandings);

  const championshipEvents = buildChampionshipEvents(unified.completed, games);
  const bowlEvents = buildBowlEvents(games);
  const weeklyHighScoreEvents = buildWeeklyHighScoreEvents(games);

  const trophyEvents = sortTrophyEvents(
    uniqueEvents([...championshipEvents, ...bowlEvents]),
  );

  return {
    trophyEvents,
    weeklyHighScoreEvents,
    bannerAchievements: buildBannerAchievements(unified.completed),
  };
}

export async function getAllTrophyVaultData() {
  const [standingsArchive, currentStandings, games] = await Promise.all([
    getStandingsArchive(),
    getStandingsData().catch(() => []),
    getGameResults({ allSeasons: true }),
  ]);

  return buildTrophyVaultData({
    standingsArchive,
    currentStandings,
    games,
  });
}

export async function getFranchiseTrophyVault(franchiseId) {
  const id = text(franchiseId);
  if (!id) {
    return {
      franchiseId: "",
      trophies: [],
      weeklyHighScores: [],
      banner: null,
    };
  }

  const data = await getAllTrophyVaultData();

  return {
    franchiseId: id,
    trophies: data.trophyEvents.filter((event) => event.franchiseId === id),
    weeklyHighScores: data.weeklyHighScoreEvents.filter(
      (event) => event.franchiseId === id,
    ),
    banner: data.bannerAchievements.get(id) || null,
  };
}

export async function getCoachTrophyVault(coachId) {
  const id = text(coachId);
  if (!id) {
    return {
      coachId: "",
      trophies: [],
      weeklyHighScores: [],
    };
  }

  const data = await getAllTrophyVaultData();

  return {
    coachId: id,
    trophies: data.trophyEvents.filter((event) => event.coachId === id),
    weeklyHighScores: data.weeklyHighScoreEvents.filter(
      (event) => event.coachId === id,
    ),
  };
}

export const trophyServiceInternals = {
  REGULAR_SEASON_LAST_WEEK,
  buildBannerAchievements,
  buildBowlEvents,
  buildChampionshipEvents,
  buildWeeklyHighScoreEvents,
  gameDescriptor,
  isRegularSeasonGame,
  normalizeConference,
  slug,
};
