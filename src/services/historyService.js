import { getStandingsArchive, getStandingsData } from "./googleSheets";
import { getCoachSeasonTenureRows } from "./coachData";

const CONFERENCE_ALIASES = {
  caa: "coastal",
  "coastal athletic association": "coastal",
  coastal: "coastal",
  mvc: "missouri valley",
  "missouri valley football conference": "missouri valley",
  "missouri valley": "missouri valley",
  nec: "northeast",
  "northeast conference": "northeast",
  northeast: "northeast",
};

const clean = (value) => String(value ?? "").trim();
const n = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

export function conferenceKey(value) {
  const key = clean(value).toLowerCase();
  return CONFERENCE_ALIASES[key] || key;
}

function addRecord(target, wins, losses, ties = 0) {
  target.wins += n(wins);
  target.losses += n(losses);
  target.ties += n(ties);
}

function finishRecord(row) {
  const games = row.wins + row.losses + row.ties;
  return {
    ...row,
    games,
    winPct: games ? row.wins / games : 0,
    record: row.ties ? `${row.wins}-${row.losses}-${row.ties}` : `${row.wins}-${row.losses}`,
  };
}

function uniqueSeasons(rows) {
  return new Set(rows.map((row) => Number(row.season)).filter(Boolean)).size;
}

function buildCoachRows(tenures, currentTeams, { tier, conference, population }) {
  const currentByCoach = new Map(
    currentTeams
      .filter((team) => team.coachId)
      .map((team) => [clean(team.coachId), team]),
  );

  const allCoachIds = new Set(
    population === "current"
      ? currentTeams
          .filter((team) => team.tier === tier && (conference === "all" || conferenceKey(team.conference) === conferenceKey(conference)))
          .map((team) => clean(team.coachId))
          .filter(Boolean)
      : tenures
          .filter((row) => row.tier === tier && (conference === "all" || conferenceKey(row.conference) === conferenceKey(conference)))
          .map((row) => clean(row.coachId))
          .filter(Boolean),
  );

  return [...allCoachIds].map((coachId) => {
    const career = tenures.filter((row) => clean(row.coachId) === coachId);
    const tierTenures = career.filter((row) => row.tier === tier);
    const conferenceTenures = conference === "all"
      ? tierTenures
      : tierTenures.filter((row) => conferenceKey(row.conference) === conferenceKey(conference));
    const current = currentByCoach.get(coachId);
    const latest = [...career].sort((a, b) => Number(b.season || 0) - Number(a.season || 0))[0] || {};

    const conf = { wins: 0, losses: 0, ties: 0 };
    conferenceTenures.forEach((row) => addRecord(conf, row.conferenceWins, row.conferenceLosses, row.conferenceTies));

    const tierRecord = { wins: 0, losses: 0, ties: 0 };
    tierTenures.forEach((row) => addRecord(tierRecord, row.overallWins, row.overallLosses, row.overallTies));

    // MESH career spans every tier the coach has worked in. This lets a coach
    // be 0-0 in a new conference while still carrying the career earned before
    // promotion/relegation or a move elsewhere in MESH.
    const meshRecord = { wins: 0, losses: 0, ties: 0 };
    career.forEach((row) => addRecord(meshRecord, row.overallWins, row.overallLosses, row.overallTies));

    const confDone = finishRecord(conf);
    const tierDone = finishRecord(tierRecord);
    const meshDone = finishRecord(meshRecord);

    return {
      type: "coach",
      id: coachId,
      name: current?.coach || latest.coachName || coachId,
      currentTeam: current?.team || "—",
      currentFranchiseId: current?.franchiseId || "",
      logo: current?.logo || "",
      currentTier: current?.tier || "",
      currentConference: current?.conference || "",
      conferenceSeasons: uniqueSeasons(conferenceTenures),
      tierSeasons: uniqueSeasons(tierTenures),
      meshSeasons: uniqueSeasons(career),
      conference: confDone,
      tier: tierDone,
      mesh: meshDone,
    };
  });
}

function buildFranchiseRows(archive, currentTeams, { tier, conference }) {
  const eligible = currentTeams.filter(
    (team) => team.tier === tier && (conference === "all" || conferenceKey(team.conference) === conferenceKey(conference)),
  );

  return eligible.map((current) => {
    const history = archive.filter((row) => row.franchiseId === current.franchiseId && row.tier === tier);
    const rows = [...history];

    // TEAM DATA is the live/current season row. STANDINGS_ARCHIVE contains final prior seasons.
    rows.push({
      season: 2026,
      conference: current.conference,
      tierStandingsWins: current.tierStandingsWins,
      tierStandingsLosses: current.tierStandingsLosses,
      tierStandingsTies: current.tierStandingsTies,
      overallSeasonWins: current.overallSeasonWins,
      overallSeasonLosses: current.overallSeasonLosses,
      overallSeasonTies: current.overallSeasonTies,
    });

    const conferenceRows = conference === "all"
      ? rows
      : rows.filter((row) => conferenceKey(row.conference) === conferenceKey(conference));

    const conf = { wins: 0, losses: 0, ties: 0 };
    conferenceRows.forEach((row) => addRecord(conf, row.tierStandingsWins, row.tierStandingsLosses, row.tierStandingsTies));

    const tierRecord = { wins: 0, losses: 0, ties: 0 };
    rows.forEach((row) => addRecord(tierRecord, row.overallSeasonWins, row.overallSeasonLosses, row.overallSeasonTies));

    // Franchises are permanently tied to one tier, so MESH career and tier
    // career are currently equivalent. Keep both fields so the History UI uses
    // one consistent career table for coaches and franchises.
    const meshRecord = { wins: tierRecord.wins, losses: tierRecord.losses, ties: tierRecord.ties };

    return {
      type: "franchise",
      id: current.franchiseId,
      name: current.team,
      logo: current.logo,
      coach: current.coach,
      coachId: current.coachId,
      currentTier: current.tier,
      currentConference: current.conference,
      conferenceSeasons: uniqueSeasons(conferenceRows),
      tierSeasons: uniqueSeasons(rows),
      meshSeasons: uniqueSeasons(rows),
      conference: finishRecord(conf),
      tier: finishRecord(tierRecord),
      mesh: finishRecord(meshRecord),
    };
  });
}

export async function getCareerStandingsData(filters = {}) {
  const { tier = "FBS", conference = "ACC", population = "current" } = filters;
  const [tenures, currentTeams, archive] = await Promise.all([
    getCoachSeasonTenureRows(),
    getStandingsData(),
    getStandingsArchive(),
  ]);

  return {
    coaches: buildCoachRows(tenures, currentTeams, { tier, conference, population }),
    franchises: buildFranchiseRows(archive, currentTeams, { tier, conference }),
  };
}

function gameText(game) {
  return [game?.gameCategory, game?.gameType, game?.label, game?.bowlName]
    .filter(Boolean).join(" ").toLowerCase();
}

function winnerFromGame(game) {
  if (!game) return null;
  const winnerId = clean(game.winnerId);
  if (!winnerId) return null;
  if (winnerId === clean(game.team1Id)) return { id: game.team1Id, name: game.team1Team, logo: game.team1Logo, coachId: game.team1CoachId, coach: game.team1Coach, score: game.team1Score, opponent: game.team2Team, opponentScore: game.team2Score, conference: game.team1Conference };
  if (winnerId === clean(game.team2Id)) return { id: game.team2Id, name: game.team2Team, logo: game.team2Logo, coachId: game.team2CoachId, coach: game.team2Coach, score: game.team2Score, opponent: game.team1Team, opponentScore: game.team1Score, conference: game.team2Conference };
  return null;
}

function isTitleGame(game, tier) {
  const text = gameText(game);
  if (tier === "NFL") return text.includes("super bowl") || (Number(game.week) === 17 && game.tier === "NFL");
  if (tier === "FBS") return text.includes("national championship") || (Number(game.week) === 17 && game.tier === "FBS");
  if (tier === "FCS") return text.includes("national championship") || (Number(game.week) === 17 && game.tier === "FCS");
  return false;
}

function isCfpGame(game) {
  if (game?.tier !== "FBS") return false;
  const text = gameText(game);
  return text.includes("cfp") || text.includes("college football playoff") || text.includes("quarterfinal") || text.includes("semifinal") || text.includes("national championship");
}

function isFcsPlayoff(game) {
  return game?.tier === "FCS" && (gameText(game).includes("fcs playoff") || Number(game.week) >= 13);
}

function isNflPlayoff(game) {
  return game?.tier === "NFL" && (gameText(game).includes("nfl playoff") || Number(game.week) >= 14);
}

function isConferenceTitleGame(game) {
  return gameText(game).includes("conference championship") || String(game?.gameType || "").toLowerCase().includes("conference championship");
}

function gameHasFranchise(game, id) {
  return clean(game?.team1Id) === clean(id) || clean(game?.team2Id) === clean(id);
}

function gameHasConference(game, conference) {
  const key = conferenceKey(conference);
  return conferenceKey(game?.team1Conference) === key || conferenceKey(game?.team2Conference) === key;
}

function gameResultFor(game, id) {
  if (!gameHasFranchise(game, id) || !clean(game?.winnerId)) return null;
  return clean(game.winnerId) === clean(id) ? "W" : "L";
}

function uniqueParticipants(games) {
  const map = new Map();
  games.forEach((game) => {
    [[game.team1Id, game.team1Team, game.team1Logo, game.team1CoachId, game.team1Coach, game.team1Conference, game.team1GameRank], [game.team2Id, game.team2Team, game.team2Logo, game.team2CoachId, game.team2Coach, game.team2Conference, game.team2GameRank]].forEach(([id,name,logo,coachId,coach,conference,seed]) => {
      if (!id || map.has(clean(id))) return;
      map.set(clean(id), { id, name, logo, coachId, coach, conference, seed: n(seed) || null });
    });
  });
  return [...map.values()].sort((a,b) => (a.seed || 99) - (b.seed || 99) || a.name.localeCompare(b.name));
}

function historicalIdentity(row) {
  return row ? { id: row.franchiseId, name: row.franchiseName, logo: row.logo, coachId: row.coachId, coach: row.coachName, conference: row.conference, record: row.overallSeasonRecord } : null;
}

function seasonConferenceChampion(seasonRows, seasonGames, tier, conference) {
  const key = conferenceKey(conference);
  const row = seasonRows.find((item) => item.tier === tier && conferenceKey(item.conference) === key && /conference champion/i.test(item.conferenceResult || ""));
  const titleGame = tier === "FBS" ? seasonGames.find((game) => game.tier === "FBS" && isConferenceTitleGame(game) && gameHasConference(game, conference)) : null;
  const winner = winnerFromGame(titleGame);
  return { champion: winner || historicalIdentity(row), game: titleGame || null };
}

function buildRecordBooks(archive, games, currentTeams) {
  const books = {};
  ["NFL","FBS","FCS"].forEach((tier) => {
    books[tier] = {};
    const conferences = [...new Set(currentTeams.filter((t) => t.tier === tier).map((t) => clean(t.conference)).filter(Boolean))];
    conferences.forEach((conference) => {
      const teams = currentTeams.filter((t) => t.tier === tier && conferenceKey(t.conference) === conferenceKey(conference));
      books[tier][conferenceKey(conference)] = teams.map((team) => {
        const id = clean(team.franchiseId);
        const teamArchive = archive.filter((r) => clean(r.franchiseId) === id && r.tier === tier);
        const teamGames = games.filter((g) => g.tier === tier && gameHasFranchise(g, id));
        const titles = teamGames.filter((g) => isTitleGame(g, tier) && clean(g.winnerId) === id).length;

        if (tier === "FBS") {
          const confTitleGames = teamGames.filter(isConferenceTitleGame);
          const cfp = teamGames.filter(isCfpGame);
          const bowls = teamGames.filter((g) => Boolean(g.bowlName) && !isCfpGame(g));
          return { id, name: team.team, logo: team.logo, nationalTitles: titles, conferenceChampionshipApps: confTitleGames.length, conferenceTitles: confTitleGames.filter((g) => clean(g.winnerId) === id).length || teamArchive.filter((r) => /conference champion/i.test(r.conferenceResult || "")).length, cfpApps: new Set(cfp.map((g) => Number(g.season))).size, cfpWins: cfp.filter((g) => gameResultFor(g,id) === "W").length, cfpLosses: cfp.filter((g) => gameResultFor(g,id) === "L").length, bowlApps: bowls.length, bowlWins: bowls.filter((g) => gameResultFor(g,id) === "W").length, bowlLosses: bowls.filter((g) => gameResultFor(g,id) === "L").length };
        }
        if (tier === "FCS") {
          const playoffs = teamGames.filter(isFcsPlayoff);
          return { id, name: team.team, logo: team.logo, nationalTitles: titles, conferenceTitles: teamArchive.filter((r) => /conference champion/i.test(r.conferenceResult || "")).length, playoffApps: new Set(playoffs.map((g) => Number(g.season))).size, playoffWins: playoffs.filter((g) => gameResultFor(g,id) === "W").length, playoffLosses: playoffs.filter((g) => gameResultFor(g,id) === "L").length };
        }
        const playoffs = teamGames.filter(isNflPlayoff);
        const confTitles = teamGames.filter((g) => Number(g.week) === 16 && clean(g.winnerId) === id).length;
        return { id, name: team.team, logo: team.logo, divisionTitles: teamArchive.filter((r) => Number(r.divisionRank) === 1).length, conferenceTitles: confTitles, superBowls: titles, playoffApps: new Set(playoffs.map((g) => Number(g.season))).size, playoffWins: playoffs.filter((g) => gameResultFor(g,id) === "W").length, playoffLosses: playoffs.filter((g) => gameResultFor(g,id) === "L").length };
      }).sort((a,b) => a.name.localeCompare(b.name));
    });
  });
  return books;
}

export async function getChampionsHistoryData() {
  const { getGameResults } = await import("./googleSheets");
  const [archive, games, currentTeams] = await Promise.all([getStandingsArchive(), getGameResults({ allSeasons: true }), getStandingsData()]);
  const seasons = [...new Set(archive.map((row) => Number(row.season)).filter(Boolean))].sort((a,b) => b-a);
  const bySeason = {};

  seasons.forEach((season) => {
    const seasonRows = archive.filter((row) => Number(row.season) === season);
    const seasonGames = games.filter((game) => Number(game.season) === season);
    const champions = ["NFL","FBS","FCS"].map((tier) => {
      const titleGame = seasonGames.find((game) => game.tier === tier && isTitleGame(game, tier));
      const winner = winnerFromGame(titleGame);
      if (winner) return { tier, ...winner, game: titleGame };
      const row = seasonRows.find((item) => item.tier === tier && /champion/i.test(item.playoffResult || "") && !/runner/i.test(item.playoffResult || ""));
      return row ? { tier, ...historicalIdentity(row), game: null } : { tier };
    });

    const nflConferenceChampions = seasonGames.filter((g) => g.tier === "NFL" && Number(g.week) === 16).map((g) => ({ ...winnerFromGame(g), tier: "NFL", conference: winnerFromGame(g)?.conference || "" })).filter((x) => x.id);
    const nflDivisionChampions = seasonRows.filter((r) => r.tier === "NFL" && Number(r.divisionRank) === 1).map((r) => ({ ...historicalIdentity(r), tier: "NFL", division: r.division }));

    const conferenceData = {};
    ["FBS","FCS"].forEach((tier) => {
      conferenceData[tier] = {};
      const conferences = [...new Set(currentTeams.filter((t) => t.tier === tier).map((t) => clean(t.conference)).filter(Boolean))];
      conferences.forEach((conference) => {
        const { champion, game } = seasonConferenceChampion(seasonRows, seasonGames, tier, conference);
        const postseasonGames = tier === "FBS" ? seasonGames.filter(isCfpGame) : seasonGames.filter(isFcsPlayoff);
        const confPostseasonGames = postseasonGames.filter((g) => gameHasConference(g, conference));
        const qualifiers = uniqueParticipants(confPostseasonGames).filter((t) => conferenceKey(t.conference) === conferenceKey(conference));
        const qualifierIds = new Set(qualifiers.map((t) => clean(t.id)));
        const playoffGames = postseasonGames.filter((g) => qualifierIds.has(clean(g.team1Id)) || qualifierIds.has(clean(g.team2Id))).sort((a,b) => Number(a.week)-Number(b.week) || Number(a.gameNumber)-Number(b.gameNumber));
        const bowls = tier === "FBS" ? seasonGames.filter((g) => g.tier === "FBS" && g.bowlName && !isCfpGame(g) && gameHasConference(g, conference)).sort((a,b) => Number(a.week)-Number(b.week) || String(a.bowlName).localeCompare(String(b.bowlName))) : [];
        conferenceData[tier][conferenceKey(conference)] = { conference, champion, championshipGame: game, qualifiers, playoffGames, bowls };
      });
    });

    bySeason[season] = { champions, nflConferenceChampions, nflDivisionChampions, conferenceData };
  });

  return { seasons, bySeason, recordBooks: buildRecordBooks(archive, games, currentTeams) };
}
