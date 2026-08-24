import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  Clock3,
  History,
  Radio,
  Trophy,
  Users,
} from "lucide-react";

import PageHeader from "../components/PageHeader";
import {
  getGameById,
  getGameRosterPlayers,
  getHeadToHeadHistory,
} from "../services/googleSheets";
import meshShield from "../assets/logos/mfl-shield.png";
import { MESH_PATCHES } from "../assets/logos/patches";

import "../styles/gameCenter.css";

function formatScore(value, status) {
  if (value === null || value === undefined) {
    return status === "upcoming" ? "—" : "0.0";
  }

  return Number(value).toFixed(1);
}

function formatProjection(value) {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value).toFixed(1);
}

function clampProbability(value) {
  if (value === null || value === undefined) return null;

  const number = Number(value);
  if (!Number.isFinite(number)) return null;

  return Math.max(0, Math.min(100, number));
}

function matchupStatusLabel(game) {
  if (game.status === "live") return "Live Matchup";
  if (game.status === "final") return "Final";
  return "Game Preview";
}

function normalizePatchKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getConferencePatch(tier, conference) {
  const conferenceKey = normalizePatchKey(conference);

  if (tier === "NFL") {
    if (conferenceKey === "afc") return MESH_PATCHES.NFL.AFC;
    if (conferenceKey === "nfc") return MESH_PATCHES.NFL.NFC;
    return MESH_PATCHES.tier.NFL;
  }

  if (tier === "FBS") {
    const map = {
      acc: MESH_PATCHES.FBS.ACC,
      "big-ten": MESH_PATCHES.FBS["Big Ten"],
      "big-12": MESH_PATCHES.FBS["Big 12"],
      mac: MESH_PATCHES.FBS.MAC,
      "mountain-west": MESH_PATCHES.FBS["Mountain West"],
      sec: MESH_PATCHES.FBS.SEC,
      "sun-belt": MESH_PATCHES.FBS["Sun Belt"],
    };

    return map[conferenceKey] ?? MESH_PATCHES.tier.FBS;
  }

  if (tier === "FCS") {
    const map = {
      "big-sky": MESH_PATCHES.FCS["Big Sky"],
      coastal: MESH_PATCHES.FCS.CAA,
      caa: MESH_PATCHES.FCS.CAA,
      "coastal-athletic-association": MESH_PATCHES.FCS.CAA,
      ivy: MESH_PATCHES.FCS.Ivy,
      "ivy-league": MESH_PATCHES.FCS.Ivy,
      mvc: MESH_PATCHES.FCS.MVC,
      "missouri-valley": MESH_PATCHES.FCS.MVC,
      "missouri-valley-conference": MESH_PATCHES.FCS.MVC,
      nec: MESH_PATCHES.FCS.NEC,
      northeast: MESH_PATCHES.FCS.NEC,
      "northeast-conference": MESH_PATCHES.FCS.NEC,
      southland: MESH_PATCHES.FCS.Southland,
      "southland-conference": MESH_PATCHES.FCS.Southland,
    };

    return map[conferenceKey] ?? MESH_PATCHES.tier.FCS;
  }

  return null;
}

function getGameCenterBranding(game) {
  const tier = String(game?.tier ?? "").trim().toUpperCase();
  const conference1 = String(game?.team1Conference || "").trim();
  const conference2 = String(game?.team2Conference || "").trim();

  const sameConference =
    conference1 &&
    conference2 &&
    normalizePatchKey(conference1) === normalizePatchKey(conference2);

  if (conference1 && conference2 && !sameConference) {
    return {
      isCrossConference: true,
      leftPatch: getConferencePatch(tier, conference1),
      rightPatch: getConferencePatch(tier, conference2),
      centerLabel: "Non-Conference",
      leftLabel: conference1,
      rightLabel: conference2,
    };
  }

  const conference = conference1 || conference2;

  return {
    isCrossConference: false,
    leftPatch: getConferencePatch(tier, conference),
    rightPatch: null,
    centerLabel: conference || tier,
    leftLabel: conference || tier,
    rightLabel: "",
  };
}

function centerStatusLabel(game) {
  if (game.status === "live") return "Live";
  if (game.status === "final") return "Final";
  return "Scheduled";
}

function TeamLogo({ src, initial, team, rank }) {
  const ranked = Number(rank) >= 1 && Number(rank) <= 25;

  return (
    <div className="game-center-logo-wrap">
      {ranked ? (
        <span className="game-center-logo-rank">#{rank}</span>
      ) : null}

      {src ? (
        <div className="game-center-logo">
          <img src={src} alt={`${team} logo`} />
        </div>
      ) : (
        <div className="game-center-logo game-center-logo-placeholder">
          {initial || "?"}
        </div>
      )}
    </div>
  );
}

function TeamSide({
  side,
  team,
  coach,
  conference,
  overallRecord,
  conferenceRecord,
  rank,
  score,
  projection,
  logo,
  initial,
  tier,
  status,
  isWinner,
  isLoser,
}) {
  const isCollege = tier === "FBS" || tier === "FCS";

  return (
    <section
      className={[
        "game-center-team-side",
        `game-center-team-side-${side}`,
        isWinner ? "winner" : "",
        isLoser ? "loser" : "",
      ].filter(Boolean).join(" ")}
    >
      <TeamLogo
        src={logo}
        initial={initial}
        team={team || "TBD"}
        rank={rank}
      />

      <div className="game-center-team-side-copy">
        <h2 className="game-center-team-name">
          <span>{team || "TBD"}</span>
        </h2>

        {coach ? <p className="game-center-coach">{coach}</p> : null}

        <div className="game-center-records">
          {isCollege ? (
            <>
              <span>OVR: {overallRecord || "0–0"}</span>
              <span>CONF: {conferenceRecord || "0–0"}</span>
            </>
          ) : (
            <span>{overallRecord || "0–0"}</span>
          )}
        </div>

        {conference ? (
          <span className="game-center-conference">{conference}</span>
        ) : null}
      </div>

      <div className="game-center-side-score">
        <strong>{formatScore(score, status)}</strong>
        {status !== "final" && projection !== null && projection !== undefined ? (
          <span>Proj: {Number(projection).toFixed(1)}</span>
        ) : null}
      </div>
    </section>
  );
}

function WinProbability({ game }) {
  const firstRaw = clampProbability(game.team1WinProbability);
  const secondRaw = clampProbability(game.team2WinProbability);

  if (firstRaw === null && secondRaw === null) {
    return (
      <div className="game-center-v1-probability">
        <span className="game-center-v1-probability-title">Win Probability</span>
        <div className="game-center-v1-probability-unavailable">
          Win probability will appear once the Sleeper probability feed is connected.
        </div>
      </div>
    );
  }

  const first = firstRaw !== null ? firstRaw : 100 - secondRaw;
  const second = secondRaw !== null ? secondRaw : 100 - first;

  const favoredSide = first >= second ? "left" : "right";
  const favoredProbability = Math.max(first, second);

  return (
    <div className="game-center-v1-probability">
      <span className="game-center-v1-probability-title">Win Probability</span>
      <div className="game-center-v1-probability-values">
        <strong>{Math.round(first)}%</strong>
        <strong>{Math.round(second)}%</strong>
      </div>

      <div className="game-center-v1-probability-track">
        <div
          className={[
            "game-center-v1-probability-fill",
            `game-center-v1-probability-fill-${game.tierClass}`,
            `game-center-v1-probability-fill-${favoredSide}`,
          ].join(" ")}
          style={{ width: `${favoredProbability}%` }}
        />
      </div>
    </div>
  );
}

function MatchupCard({ game, winnerState, rosters }) {
  const normalizedType = String(
    game.gameType || game.gameCategory || "",
  ).toLowerCase();

  const branding = getGameCenterBranding(game);

  const title =
    normalizedType.includes("playoff") ||
    normalizedType.includes("wild card") ||
    normalizedType.includes("quarterfinal") ||
    normalizedType.includes("semifinal") ||
    normalizedType.includes("championship") ||
    normalizedType.includes("bowl")
      ? "PLAYOFF"
      : "REGULAR SEASON";

  return (
    <section className={`game-center-hero game-center-hero-${game.tierClass}`}>
      <div className="game-center-hero-top game-center-hero-top-patched">
        <div className="game-center-hero-status">
          <span className={`gc-home-state-pill gc-home-state-pill-${game.status}`}>
            {game.status === "live" ? <Radio size={10} /> : null}
            {matchupStatusLabel(game)}
          </span>
        </div>

        <div
          className={[
            "game-center-hero-title",
            branding.isCrossConference
              ? "game-center-hero-title-cross-conference"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {branding.leftPatch ? (
            <img
              className="game-center-hero-patch"
              src={branding.leftPatch}
              alt={`${branding.leftLabel} MESH patch`}
            />
          ) : null}

          <div className="game-center-hero-title-copy">
            <span>{branding.centerLabel}</span>
            <h2>{title}</h2>
          </div>

          {branding.isCrossConference && branding.rightPatch ? (
            <img
              className="game-center-hero-patch"
              src={branding.rightPatch}
              alt={`${branding.rightLabel} MESH patch`}
            />
          ) : null}
        </div>

        <span className={`gc-home-tier-pill gc-home-tier-pill-${game.tierClass}`}>
          {game.tier}
        </span>
      </div>

      <div className="game-center-matchup-row">
        <TeamSide
          side="one"
          team={game.team1Team}
          coach={game.team1Coach}
          conference={game.team1Conference}
          overallRecord={game.team1OverallRecord}
          conferenceRecord={game.team1ConferenceRecord}
          rank={game.team1Top25Rank}
          score={game.team1Score}
          projection={
            rosters.team1ProjectedPoints ?? game.team1Projection
          }
          logo={game.team1Logo}
          initial={game.team1Initial}
          tier={game.tier}
          status={game.status}
          isWinner={winnerState.team1Winner}
          isLoser={winnerState.hasWinner && !winnerState.team1Winner}
        />

        <div className="game-center-middle">
          <span className="game-center-vs">VS</span>
        </div>

        <TeamSide
          side="two"
          team={game.team2Team}
          coach={game.team2Coach}
          conference={game.team2Conference}
          overallRecord={game.team2OverallRecord}
          conferenceRecord={game.team2ConferenceRecord}
          rank={game.team2Top25Rank}
          score={game.team2Score}
          projection={
            rosters.team2ProjectedPoints ?? game.team2Projection
          }
          logo={game.team2Logo}
          initial={game.team2Initial}
          tier={game.tier}
          status={game.status}
          isWinner={winnerState.team2Winner}
          isLoser={winnerState.hasWinner && !winnerState.team2Winner}
        />
      </div>

      <WinProbability game={game} />
    </section>
  );
}

function formatPlayerScore(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }

  return Number(value).toFixed(1);
}

function formatTeamProjection(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null;
  }

  return Number(value).toFixed(1);
}

function RosterPanel({ team, players, side }) {
  return (
    <div className={`game-center-roster-panel game-center-roster-panel-${side}`}>
      <div className="game-center-roster-panel-heading">
        <Users size={16} />
        <strong>{team || "TBD"}</strong>
      </div>

      <div className="game-center-roster-table">
        <div className="game-center-roster-table-head">
          <span>POS</span>
          <span>PLAYER</span>
          <span>PTS</span>
        </div>

        {players.length > 0 ? (
          players.map((player) => (
            <div className="game-center-player-row" key={player.playerId}>
              <span className="game-center-lineup-position">
                {player.lineupPosition || player.position || "—"}
              </span>

              <div className="game-center-player-copy">
                <strong>{player.playerName || player.playerId}</strong>
                <span>
                  {[player.position, player.nflTeam]
                    .filter(Boolean)
                    .join(" • ")}
                </span>
              </div>

              <div className="game-center-player-points">
                <strong>{formatPlayerScore(player.playerPoints)}</strong>

                {player.projectedPoints !== null ? (
                  <span>Proj {formatPlayerScore(player.projectedPoints)}</span>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="game-center-roster-empty">
            No starters found for this franchise and week.
          </div>
        )}
      </div>
    </div>
  );
}


function historyScore(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getHistoricalWinnerId(meeting) {
  const storedWinner = String(meeting?.winnerId || "").trim();

  if (storedWinner) return storedWinner;

  const score1 = historyScore(meeting?.team1Score);
  const score2 = historyScore(meeting?.team2Score);

  if (score1 === null || score2 === null || score1 === score2) {
    return "";
  }

  return score1 > score2 ? meeting.team1Id : meeting.team2Id;
}

function orientHistoricalMeeting(meeting, game) {
  const team1OnLeft = meeting.team1Id === game.team1Id;

  return {
    leftName: team1OnLeft ? meeting.team1Team : meeting.team2Team,
    rightName: team1OnLeft ? meeting.team2Team : meeting.team1Team,
    leftId: team1OnLeft ? meeting.team1Id : meeting.team2Id,
    rightId: team1OnLeft ? meeting.team2Id : meeting.team1Id,
    leftScore: historyScore(
      team1OnLeft ? meeting.team1Score : meeting.team2Score,
    ),
    rightScore: historyScore(
      team1OnLeft ? meeting.team2Score : meeting.team1Score,
    ),
  };
}

function isHistoricalPostseasonMeeting(meeting) {
  const text = [
    meeting?.gameType,
    meeting?.gameCategory,
    meeting?.label,
    meeting?.bowlName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    text.includes("playoff") ||
    text.includes("wild card") ||
    text.includes("divisional") ||
    text.includes("quarterfinal") ||
    text.includes("semifinal") ||
    text.includes("championship") ||
    text.includes("bowl") ||
    text.includes("cfp")
  );
}

function describeHistoryType(meeting) {
  return (
    meeting.gameType ||
    meeting.gameCategory ||
    meeting.label ||
    "Regular Season"
  );
}

function buildDetailedSeriesHistory(game, history = []) {
  if (!game) return null;

  const completed = history.filter((meeting) => {
    return (
      historyScore(meeting?.team1Score) !== null &&
      historyScore(meeting?.team2Score) !== null
    );
  });

  if (completed.length === 0) return null;

  let leftWins = 0;
  let rightWins = 0;
  let ties = 0;

  completed.forEach((meeting) => {
    const winnerId = getHistoricalWinnerId(meeting);

    if (!winnerId) ties += 1;
    else if (winnerId === game.team1Id) leftWins += 1;
    else if (winnerId === game.team2Id) rightWins += 1;
  });

  const seriesLeader =
    leftWins === rightWins
      ? `Series tied ${leftWins}–${rightWins}${ties ? `–${ties}` : ""}`
      : leftWins > rightWins
        ? `${game.team1Team} leads ${leftWins}–${rightWins}${ties ? `–${ties}` : ""}`
        : `${game.team2Team} leads ${rightWins}–${leftWins}${ties ? `–${ties}` : ""}`;

  const lastMeeting = completed[0];
  const orientedLast = orientHistoricalMeeting(lastMeeting, game);

  const lastMeetingScore =
    `${orientedLast.leftScore.toFixed(1)} – ${orientedLast.rightScore.toFixed(1)}`;

  let streakWinnerId = getHistoricalWinnerId(completed[0]);
  let streakCount = streakWinnerId ? 1 : 0;

  if (streakWinnerId) {
    for (let i = 1; i < completed.length; i += 1) {
      if (getHistoricalWinnerId(completed[i]) !== streakWinnerId) break;
      streakCount += 1;
    }
  }

  const streakTeam =
    streakWinnerId === game.team1Id
      ? game.team1Team
      : streakWinnerId === game.team2Id
        ? game.team2Team
        : "";

  let largest = null;
  let closest = null;
  let highestScoring = null;

  let team1Points = 0;
  let team2Points = 0;

  completed.forEach((meeting) => {
    const oriented = orientHistoricalMeeting(meeting, game);
    const margin = Math.abs(oriented.leftScore - oriented.rightScore);
    const total = oriented.leftScore + oriented.rightScore;
    const winnerId = getHistoricalWinnerId(meeting);

    team1Points += oriented.leftScore;
    team2Points += oriented.rightScore;

    const winnerName =
      winnerId === game.team1Id
        ? game.team1Team
        : winnerId === game.team2Id
          ? game.team2Team
          : "Tie";

    const marginEntry = {
      margin,
      winnerName,
      season: meeting.season,
      week: meeting.week,
    };

    if (!largest || margin > largest.margin) {
      largest = marginEntry;
    }

    if (!closest || margin < closest.margin) {
      closest = marginEntry;
    }

    if (!highestScoring || total > highestScoring.total) {
      highestScoring = {
        total,
        season: meeting.season,
        week: meeting.week,
      };
    }
  });

  const postseason = completed.filter(isHistoricalPostseasonMeeting);

  let postseasonText = "No Postseason Meetings";
  let postseasonSubtext = "Regular-season series only";

  if (postseason.length > 0) {
    let team1PostWins = 0;
    let team2PostWins = 0;
    let postTies = 0;

    postseason.forEach((meeting) => {
      const winnerId = getHistoricalWinnerId(meeting);
      if (!winnerId) postTies += 1;
      else if (winnerId === game.team1Id) team1PostWins += 1;
      else if (winnerId === game.team2Id) team2PostWins += 1;
    });

    if (team1PostWins === team2PostWins) {
      postseasonText =
        `Postseason series tied ${team1PostWins}–${team2PostWins}` +
        (postTies ? `–${postTies}` : "");
    } else if (team1PostWins > team2PostWins) {
      postseasonText =
        `${game.team1Team} leads postseason ${team1PostWins}–${team2PostWins}`;
    } else {
      postseasonText =
        `${game.team2Team} leads postseason ${team2PostWins}–${team1PostWins}`;
    }

    postseasonSubtext =
      `${postseason.length} postseason meeting${postseason.length === 1 ? "" : "s"}`;
  }

  return {
    completed,
    meetings: completed.length,
    leftWins,
    rightWins,
    ties,
    seriesLeader,
    lastMeeting,
    lastMeetingScore,
    lastMeetingTeams:
      `${orientedLast.leftName} – ${orientedLast.rightName}`,
    streakHeadline:
      streakTeam && streakCount
        ? `${streakTeam} W${streakCount}`
        : "Series tied",
    streakSubtext:
      streakCount >= 2
        ? `${streakCount} straight`
        : streakTeam
          ? "Won last meeting"
          : "No active streak",
    largest,
    closest,
    highestScoring,
    averageLeft: team1Points / completed.length,
    averageRight: team2Points / completed.length,
    postseasonText,
    postseasonSubtext,
  };
}

function SeriesHistoryPanel({ game, history }) {
  const stats = buildDetailedSeriesHistory(game, history);

  if (!stats) {
    return (
      <div className="game-center-history-empty">
        <History size={20} />
        <div>
          <strong>No prior meetings found</strong>
          <span>
            This is the first archived meeting between these permanent MESH franchises.
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="game-center-series-card">
        <div className="game-center-series-card-heading">
          <Clock3 size={22} />
          <div>
            <span>All-Time Series</span>
            <strong>{stats.seriesLeader}</strong>
          </div>
        </div>

        <div className="game-center-series-scoreboard">
          <div className="game-center-series-team">
            <strong>{stats.leftWins}</strong>
            <span>{game.team1Team}</span>
          </div>

          <div className="game-center-series-meetings">
            <strong>{stats.meetings}</strong>
            <span>Previous Meetings</span>
          </div>

          <div className="game-center-series-team">
            <strong>{stats.rightWins}</strong>
            <span>{game.team2Team}</span>
          </div>
        </div>
      </div>

      <div className="game-center-series-stat-grid">
        <div className="game-center-series-stat-card">
          <span>Last Meeting</span>
          <strong>{stats.lastMeeting.season} • Week {stats.lastMeeting.week}</strong>
          <em>{stats.lastMeetingScore}</em>
          <small>{stats.lastMeetingTeams}</small>
        </div>

        <div className="game-center-series-stat-card">
          <span>Current Streak</span>
          <strong>{stats.streakHeadline}</strong>
          <em>{stats.streakSubtext}</em>
        </div>

        <div className="game-center-series-stat-card">
          <span>Largest Win</span>
          <strong>
            {stats.largest.winnerName} +{stats.largest.margin.toFixed(1)}
          </strong>
          <em>{stats.largest.season} • Week {stats.largest.week}</em>
        </div>

        <div className="game-center-series-stat-card">
          <span>Closest Meeting</span>
          <strong>
            {stats.closest.winnerName} +{stats.closest.margin.toFixed(1)}
          </strong>
          <em>{stats.closest.season} • Week {stats.closest.week}</em>
        </div>

        <div className="game-center-series-stat-card">
          <span>Highest-Scoring Meeting</span>
          <strong>{stats.highestScoring.total.toFixed(1)} Combined</strong>
          <em>
            {stats.highestScoring.season} • Week {stats.highestScoring.week}
          </em>
        </div>

        <div className="game-center-series-stat-card">
          <span>Average Score</span>
          <strong>
            {stats.averageLeft.toFixed(1)} – {stats.averageRight.toFixed(1)}
          </strong>
          <em>{game.team1Team} – {game.team2Team}</em>
        </div>
      </div>

      <div className="game-center-postseason-series">
        <span>Postseason Series</span>
        <strong>{stats.postseasonText}</strong>
        <em>{stats.postseasonSubtext}</em>
      </div>

      <div className="game-center-history-archive-heading">
        <div>
          <span>Archive</span>
          <h3>Recent Meetings</h3>
        </div>
        <small>Showing {Math.min(stats.completed.length, 8)} of {stats.completed.length}</small>
      </div>

      <div className="game-center-history-list game-center-history-list-restored">
        {stats.completed.slice(0, 8).map((meeting) => (
          <HistoryCard
            key={meeting.gameId}
            meeting={meeting}
            currentTeam1Id={game.team1Id}
          />
        ))}
      </div>
    </>
  );
}

function HistoryCard({ meeting, currentTeam1Id }) {
  const team1WasCurrentLeft = meeting.team1Id === currentTeam1Id;

  const leftName = team1WasCurrentLeft ? meeting.team1Team : meeting.team2Team;
  const rightName = team1WasCurrentLeft ? meeting.team2Team : meeting.team1Team;
  const leftId = team1WasCurrentLeft ? meeting.team1Id : meeting.team2Id;
  const rightId = team1WasCurrentLeft ? meeting.team2Id : meeting.team1Id;
  const leftScore = historyScore(
    team1WasCurrentLeft ? meeting.team1Score : meeting.team2Score,
  );
  const rightScore = historyScore(
    team1WasCurrentLeft ? meeting.team2Score : meeting.team1Score,
  );
  const winnerId = getHistoricalWinnerId(meeting);

  return (
    <div className="game-center-history-row">
      <div className="game-center-history-row-meta">
        <span>{meeting.season} • Week {meeting.week}</span>
        <strong>{describeHistoryType(meeting)}</strong>
      </div>

      <div className="game-center-history-score">
        <span>{leftName}</span>
        <strong className={winnerId === leftId ? "history-winning-score" : ""}>
          {leftScore === null ? "—" : leftScore.toFixed(1)}
        </strong>

        <span className="game-center-history-vs">vs</span>

        <strong className={winnerId === rightId ? "history-winning-score" : ""}>
          {rightScore === null ? "—" : rightScore.toFixed(1)}
        </strong>
        <span>{rightName}</span>
      </div>
    </div>
  );
}

function GameCenter() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [game, setGame] = useState(null);
  const [history, setHistory] = useState([]);
  const [rosters, setRosters] = useState({
    team1: [],
    team2: [],
    team1TotalPoints: null,
    team2TotalPoints: null,
    team1ProjectedPoints: null,
    team2ProjectedPoints: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadGame() {
      try {
        setLoading(true);
        setError("");

        const result = await getGameById(decodeURIComponent(gameId || ""));

        const [priorMeetings, rosterPlayers] = await Promise.all([
          getHeadToHeadHistory(
            result.team1Id,
            result.team2Id,
            result.gameId,
          ),
          getGameRosterPlayers(result),
        ]);

        if (isMounted) {
          setGame(result);
          setHistory(priorMeetings);
          setRosters(rosterPlayers);
        }
      } catch (loadError) {
        console.error("Unable to load Game Center:", loadError);

        if (isMounted) {
          setError("This MESH matchup could not be loaded.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadGame();

    return () => {
      isMounted = false;
    };
  }, [gameId]);

  const winnerState = useMemo(() => {
    if (!game || game.status !== "final" || !game.winnerId) {
      return {
        team1Winner: false,
        team2Winner: false,
        hasWinner: false,
      };
    }

    return {
      team1Winner: game.winnerId === game.team1Id,
      team2Winner: game.winnerId === game.team2Id,
      hasWinner: true,
    };
  }, [game]);

  const goBackToScores = () => {
    if (location.state?.scoresView) {
      navigate("/scores", {
        state: {
          restoreScores: location.state.scoresView,
        },
      });
      return;
    }

    navigate(-1);
  };

  if (loading) {
    return (
      <main className="game-center-page">
        <div className="game-center-message">
          <Activity size={28} />
          <h2>Loading Game Center</h2>
          <p>Retrieving matchup details.</p>
        </div>
      </main>
    );
  }

  if (error || !game) {
    return (
      <main className="game-center-page">
        <button type="button" className="game-center-back" onClick={goBackToScores}>
          <ArrowLeft size={16} />
          Back to Scores
        </button>

        <div className="game-center-message">
          <Activity size={28} />
          <h2>Game unavailable</h2>
          <p>{error || "This matchup could not be found."}</p>
        </div>
      </main>
    );
  }

  const matchupLabel =
    game.bowlName ||
    game.gameType ||
    game.gameCategory ||
    "MESH Matchup";

  return (
    <main className="game-center-page">
      <button type="button" className="game-center-back" onClick={goBackToScores}>
        <ArrowLeft size={16} />
        Back to Scores
      </button>

      <PageHeader
        eyebrow={`${game.tier} • Week ${game.week}`}
        title="Game Center"
        description={matchupLabel}
        imageSrc={meshShield}
        imageAlt="MESH Football shield"
        accent="scores"
        size="compact"
      />

      <MatchupCard
        game={game}
        winnerState={winnerState}
        rosters={rosters}
      />

      <section className="game-center-rosters">
        <div className="game-center-section-heading">
          <span>Live scoring</span>
          <h2>Roster / Player Scoring</h2>
        </div>

        <div className="game-center-roster-grid">
          <RosterPanel
            team={game.team1Team}
            players={rosters.team1}
            side="one"
          />
          <RosterPanel
            team={game.team2Team}
            players={rosters.team2}
            side="two"
          />
        </div>
      </section>

      <section className="game-center-history">
        <div className="game-center-section-heading">
          <span>Series</span>
          <h2>Matchup History</h2>
        </div>

        <SeriesHistoryPanel game={game} history={history} />
      </section>

      <section className="game-center-details">
        <div className="game-center-section-heading">
          <span>Matchup</span>
          <h2>Game Details</h2>
        </div>

        <div className="game-center-detail-card">
          <div><span>Season</span><strong>{game.season}</strong></div>
          <div><span>Week</span><strong>Week {game.week}</strong></div>
          <div><span>Tier</span><strong>{game.tier}</strong></div>
          {game.gameCategory ? (
            <div><span>Category</span><strong>{game.gameCategory}</strong></div>
          ) : null}
          {game.gameType ? (
            <div><span>Game Type</span><strong>{game.gameType}</strong></div>
          ) : null}
          {game.bowlName ? (
            <div><span>Bowl</span><strong>{game.bowlName}</strong></div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export default GameCenter;
