import { getGameResults } from "./googleSheets";

const REGULAR_SEASON = "regular season";
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

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function conferenceKey(value) {
  const key = String(value || "").trim().toLowerCase();
  return CONFERENCE_ALIASES[key] || key;
}

function isCompleted(game) {
  return num(game.team1Score) !== null && num(game.team2Score) !== null && game.status === "final";
}

function isRegularSeason(game) {
  return String(game.gameType || "").trim().toLowerCase() === REGULAR_SEASON;
}

function gameIdentity(game, side) {
  return side === 1
    ? { id: game.team1Id, team: game.team1Team, coachId: game.team1CoachId, coach: game.team1Coach, logo: game.team1Logo, conference: game.team1Conference }
    : { id: game.team2Id, team: game.team2Team, coachId: game.team2CoachId, coach: game.team2Coach, logo: game.team2Logo, conference: game.team2Conference };
}

function teamAppearance(game, side) {
  const identity = gameIdentity(game, side);
  const pf = num(side === 1 ? game.team1Score : game.team2Score) ?? 0;
  const pa = num(side === 1 ? game.team2Score : game.team1Score) ?? 0;
  return {
    ...identity,
    season: Number(game.season),
    week: Number(game.week),
    gameNumber: Number(game.gameNumber) || 0,
    tier: game.tier,
    gameId: game.gameId,
    pf,
    pa,
    result: pf > pa ? "W" : pf < pa ? "L" : "T",
    margin: pf - pa,
    opponent: side === 1 ? game.team2Team : game.team1Team,
    opponentId: side === 1 ? game.team2Id : game.team1Id,
  };
}

// "W Streak" is the team's active streak at the end of its most recent
// completed season in the selected data. It intentionally does not carry
// across offseasons and it counts postseason games when All Games is selected.
function currentWinningStreak(appearances) {
  if (!appearances.length) return { value: 0, season: null };
  const latestSeason = Math.max(...appearances.map((a) => a.season));
  const ordered = appearances
    .filter((a) => a.season === latestSeason)
    .sort((a, b) => b.week - a.week || b.gameNumber - a.gameNumber || b.gameId.localeCompare(a.gameId));

  let value = 0;
  for (const item of ordered) {
    if (item.result !== "W") break;
    value += 1;
  }
  return { value, season: latestSeason };
}

function aggregateTeams(games) {
  const map = new Map();
  games.forEach((game) => {
    [teamAppearance(game, 1), teamAppearance(game, 2)].forEach((a) => {
      if (!map.has(a.id)) map.set(a.id, []);
      map.get(a.id).push(a);
    });
  });

  return [...map.entries()].map(([franchiseId, appearances]) => {
    const latest = [...appearances].sort((a, b) => b.season - a.season || b.week - a.week || b.gameNumber - a.gameNumber)[0];
    const wins = appearances.filter((a) => a.result === "W").length;
    const losses = appearances.filter((a) => a.result === "L").length;
    const ties = appearances.filter((a) => a.result === "T").length;
    const pf = appearances.reduce((sum, a) => sum + a.pf, 0);
    const pa = appearances.reduce((sum, a) => sum + a.pa, 0);
    const high = appearances.reduce((best, a) => !best || a.pf > best.pf ? a : best, null);
    const low = appearances.reduce((best, a) => !best || a.pf < best.pf ? a : best, null);
    const winsOnly = appearances.filter((a) => a.result === "W");
    const largestWin = winsOnly.reduce((best, a) => !best || a.margin > best.margin ? a : best, null);
    const closestWin = winsOnly.reduce((best, a) => !best || a.margin < best.margin ? a : best, null);
    const streak = currentWinningStreak(appearances);
    return {
      franchiseId,
      team: latest?.team || franchiseId,
      coach: latest?.coach || "",
      coachId: latest?.coachId || "",
      logo: latest?.logo || "",
      conference: latest?.conference || "",
      tier: latest?.tier || "",
      games: appearances.length,
      wins, losses, ties,
      record: ties ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`,
      pf, pa,
      ppg: appearances.length ? pf / appearances.length : 0,
      papg: appearances.length ? pa / appearances.length : 0,
      differential: pf - pa,
      differentialPerGame: appearances.length ? (pf - pa) / appearances.length : 0,
      highScore: high?.pf ?? null,
      highScoreGame: high,
      lowScore: low?.pf ?? null,
      lowScoreGame: low,
      largestWin,
      closestWin,
      currentWinStreak: streak.value,
      currentWinStreakSeason: streak.season,
    };
  });
}

function singleGameRecords(games, conference = "all") {
  const selectedConference = conferenceKey(conference);
  const eligibleEntry = (entry) => conference === "all" || conferenceKey(entry.conference) === selectedConference;
  const entries = games
    .flatMap((game) => [teamAppearance(game, 1), teamAppearance(game, 2)])
    .filter(eligibleEntry);

  const highScore = [...entries].sort((a, b) => b.pf - a.pf)[0] || null;
  const lowScore = [...entries].sort((a, b) => a.pf - b.pf)[0] || null;

  const margins = games.map((game) => {
    const a = teamAppearance(game, 1);
    const b = teamAppearance(game, 2);
    const winner = a.pf >= b.pf ? a : b;
    const loser = a.pf >= b.pf ? b : a;
    const conferenceTeam = conference === "all"
      ? winner
      : [a, b].find((entry) => eligibleEntry(entry)) || null;
    return { game, winner, loser, conferenceTeam, margin: Math.abs(a.pf - b.pf), total: a.pf + b.pf };
  }).filter((record) => conference === "all" || record.conferenceTeam);

  const biggest = [...margins].sort((a, b) => b.margin - a.margin)[0] || null;
  const closest = [...margins].filter((x) => x.margin > 0).sort((a, b) => a.margin - b.margin)[0] || null;
  const highestCombined = [...margins].sort((a, b) => b.total - a.total)[0] || null;
  const highestLosingScore = margins
    .map((record) => ({ ...record, losingScore: record.loser.pf }))
    .sort((a, b) => b.losingScore - a.losingScore)[0] || null;
  return { highScore, lowScore, biggest, closest, highestCombined, highestLosingScore };
}

export async function getStatsCenterData() {
  const all = (await getGameResults({ allSeasons: true })).filter(isCompleted);
  return {
    seasons: [...new Set(all.map((g) => Number(g.season)).filter(Boolean))].sort((a, b) => b - a),
    games: all,
  };
}

export function calculateStats(games, { season = "all", tier = "NFL", conference = "all", scope = "regular" } = {}) {
  const selectedConference = conferenceKey(conference);
  const filtered = games.filter((game) => {
    if (season !== "all" && Number(game.season) !== Number(season)) return false;
    if (tier !== "all" && game.tier !== tier) return false;
    if (scope === "regular" && !isRegularSeason(game)) return false;
    if (conference !== "all") {
      if (conferenceKey(game.team1Conference) !== selectedConference && conferenceKey(game.team2Conference) !== selectedConference) return false;
    }
    return true;
  });

  let teamRows = aggregateTeams(filtered);
  if (conference !== "all") teamRows = teamRows.filter((row) => conferenceKey(row.conference) === selectedConference);

  const records = singleGameRecords(filtered, conference);
  const bestPpg = [...teamRows].sort((a, b) => b.ppg - a.ppg)[0] || null;
  const bestDiff = [...teamRows].sort((a, b) => b.differentialPerGame - a.differentialPerGame)[0] || null;
  const bestStreak = [...teamRows].sort((a, b) => b.currentWinStreak - a.currentWinStreak || b.ppg - a.ppg)[0] || null;
  const mostWins = [...teamRows].sort((a, b) => b.wins - a.wins || b.ppg - a.ppg)[0] || null;
  const mostPf = [...teamRows].sort((a, b) => b.pf - a.pf)[0] || null;
  const bestDefense = [...teamRows].sort((a, b) => a.papg - b.papg || b.wins - a.wins)[0] || null;

  return { games: filtered, teams: teamRows, records: { ...records, bestPpg, bestDiff, bestStreak, mostWins, mostPf, bestDefense } };
}
