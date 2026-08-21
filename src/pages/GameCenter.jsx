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

function TeamLogo({ src, initial, team }) {
  if (src) {
    return (
      <div className="game-center-logo">
        <img src={src} alt={`${team} logo`} />
      </div>
    );
  }

  return (
    <div className="game-center-logo game-center-logo-placeholder">
      {initial || "?"}
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
      <TeamLogo src={logo} initial={initial} team={team || "TBD"} />

      <div className="game-center-team-side-copy">
        <h2 className="game-center-team-name">
          {rank >= 1 && rank <= 25 ? (
            <span className="game-center-inline-rank">#{rank}</span>
          ) : null}
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

function meetingWinnerId(meeting) {
  if (meeting.winnerId) {
    return meeting.winnerId;
  }

  const firstScore = Number(meeting.team1Score);
  const secondScore = Number(meeting.team2Score);

  if (!Number.isFinite(firstScore) || !Number.isFinite(secondScore)) {
    return "";
  }

  if (firstScore === secondScore) {
    return "";
  }

  return firstScore > secondScore ? meeting.team1Id : meeting.team2Id;
}

function isPostseasonMeeting(meeting) {
  const text = [
    meeting.gameType,
    meeting.gameCategory,
    meeting.bowlName,
    meeting.label,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return [
    "playoff",
    "wild card",
    "wildcard",
    "quarterfinal",
    "semifinal",
    "semi-final",
    "championship",
    "bowl",
    "postseason",
  ].some((term) => text.includes(term));
}

function buildSeriesSummary(history, currentTeam1Id, currentTeam2Id) {
  const completed = history.filter(
    (meeting) =>
      Number.isFinite(Number(meeting.team1Score)) &&
      Number.isFinite(Number(meeting.team2Score)),
  );

  let team1Wins = 0;
  let team2Wins = 0;
  let ties = 0;

  let team1Points = 0;
  let team2Points = 0;

  let largestWin = null;
  let closestMeeting = null;
  let highestScoringMeeting = null;

  let postseasonMeetings = 0;
  let postseasonTeam1Wins = 0;
  let postseasonTeam2Wins = 0;
  let postseasonTies = 0;

  completed.forEach((meeting) => {
    const winnerId = meetingWinnerId(meeting);

    const rawTeam1Score = Number(meeting.team1Score);
    const rawTeam2Score = Number(meeting.team2Score);

    const currentTeam1Score =
      meeting.team1Id === currentTeam1Id
        ? rawTeam1Score
        : rawTeam2Score;

    const currentTeam2Score =
      meeting.team2Id === currentTeam2Id
        ? rawTeam2Score
        : rawTeam1Score;

    team1Points += currentTeam1Score;
    team2Points += currentTeam2Score;

    const margin = Math.abs(rawTeam1Score - rawTeam2Score);
    const combinedScore = rawTeam1Score + rawTeam2Score;

    if (!winnerId) {
      ties += 1;
    } else if (winnerId === currentTeam1Id) {
      team1Wins += 1;
    } else if (winnerId === currentTeam2Id) {
      team2Wins += 1;
    }

    if (
      winnerId &&
      (!largestWin || margin > largestWin.margin)
    ) {
      largestWin = {
        meeting,
        winnerId,
        margin,
      };
    }

    if (
      !closestMeeting ||
      margin < closestMeeting.margin
    ) {
      closestMeeting = {
        meeting,
        winnerId,
        margin,
      };
    }

    if (
      !highestScoringMeeting ||
      combinedScore > highestScoringMeeting.combinedScore
    ) {
      highestScoringMeeting = {
        meeting,
        combinedScore,
      };
    }

    if (isPostseasonMeeting(meeting)) {
      postseasonMeetings += 1;

      if (!winnerId) {
        postseasonTies += 1;
      } else if (winnerId === currentTeam1Id) {
        postseasonTeam1Wins += 1;
      } else if (winnerId === currentTeam2Id) {
        postseasonTeam2Wins += 1;
      }
    }
  });

  let streak = null;

  for (const meeting of completed) {
    const winnerId = meetingWinnerId(meeting);

    if (!winnerId) {
      if (!streak) {
        streak = { winnerId: "", count: 0, isTie: true };
      }
      break;
    }

    if (!streak) {
      streak = { winnerId, count: 1, isTie: false };
      continue;
    }

    if (streak.winnerId === winnerId) {
      streak.count += 1;
    } else {
      break;
    }
  }

  return {
    meetings: completed.length,
    team1Wins,
    team2Wins,
    ties,

    averageTeam1Score:
      completed.length > 0 ? team1Points / completed.length : null,

    averageTeam2Score:
      completed.length > 0 ? team2Points / completed.length : null,

    lastMeeting: completed[0] ?? null,
    streak,
    largestWin,
    closestMeeting,
    highestScoringMeeting,

    postseasonMeetings,
    postseasonTeam1Wins,
    postseasonTeam2Wins,
    postseasonTies,
  };
}


function HistoryCard({ meeting, currentTeam1Id }) {
  const team1WasCurrentLeft = meeting.team1Id === currentTeam1Id;

  const leftId = team1WasCurrentLeft ? meeting.team1Id : meeting.team2Id;
  const rightId = team1WasCurrentLeft ? meeting.team2Id : meeting.team1Id;

  const leftName = team1WasCurrentLeft
    ? meeting.team1Team
    : meeting.team2Team;

  const rightName = team1WasCurrentLeft
    ? meeting.team2Team
    : meeting.team1Team;

  const leftScore = team1WasCurrentLeft
    ? meeting.team1Score
    : meeting.team2Score;

  const rightScore = team1WasCurrentLeft
    ? meeting.team2Score
    : meeting.team1Score;

  const winnerId = meetingWinnerId(meeting);

  const leftWon = winnerId && winnerId === leftId;
  const rightWon = winnerId && winnerId === rightId;

  return (
    <div className="game-center-history-row">
      <div className="game-center-history-meta">
        <span>
          {meeting.season} • Week {meeting.week}
        </span>
        <strong>
          {meeting.bowlName ||
            meeting.gameType ||
            meeting.gameCategory ||
            "Matchup"}
        </strong>
      </div>

      <div className="game-center-history-score">
        <span className={leftWon ? "history-team-winner" : ""}>
          {leftName}
        </span>

        <strong className={leftWon ? "history-score-winner" : ""}>
          {leftScore === null ? "—" : Number(leftScore).toFixed(1)}
        </strong>

        <span className="game-center-history-vs">vs</span>

        <strong className={rightWon ? "history-score-winner" : ""}>
          {rightScore === null ? "—" : Number(rightScore).toFixed(1)}
        </strong>

        <span className={rightWon ? "history-team-winner" : ""}>
          {rightName}
        </span>
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

  const seriesSummary = useMemo(() => {
    if (!game) {
      return null;
    }

    return buildSeriesSummary(
      history,
      game.team1Id,
      game.team2Id,
    );
  }, [history, game]);

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

        {seriesSummary && seriesSummary.meetings > 0 ? (
          <>
            <div
              className={`game-center-series-summary game-center-series-summary-${game.tierClass}`}
            >
              <div className="game-center-series-title">
                <History size={18} />
                <div>
                  <span>All-Time Series</span>
                  <strong>
                    {seriesSummary.team1Wins === seriesSummary.team2Wins
                      ? `Series tied ${seriesSummary.team1Wins}–${seriesSummary.team2Wins}`
                      : seriesSummary.team1Wins > seriesSummary.team2Wins
                        ? `${game.team1Team} leads ${seriesSummary.team1Wins}–${seriesSummary.team2Wins}`
                        : `${game.team2Team} leads ${seriesSummary.team2Wins}–${seriesSummary.team1Wins}`}
                    {seriesSummary.ties > 0
                      ? `–${seriesSummary.ties}`
                      : ""}
                  </strong>
                </div>
              </div>

              <div className="game-center-series-record">
                <div>
                  <strong>{seriesSummary.team1Wins}</strong>
                  <span>{game.team1Team}</span>
                </div>

                <div className="game-center-series-meetings">
                  <strong>{seriesSummary.meetings}</strong>
                  <span>Previous Meetings</span>
                </div>

                <div>
                  <strong>{seriesSummary.team2Wins}</strong>
                  <span>{game.team2Team}</span>
                </div>
              </div>
            </div>

            <div className="game-center-series-facts game-center-series-facts-v2">
              <div className="game-center-series-fact">
                <span>Last Meeting</span>
                <strong>
                  {seriesSummary.lastMeeting
                    ? `${seriesSummary.lastMeeting.season} • Week ${seriesSummary.lastMeeting.week}`
                    : "—"}
                </strong>
                {seriesSummary.lastMeeting ? (
                  <>
                    <small>
                      {Number(seriesSummary.lastMeeting.team1Score).toFixed(1)}
                      {" – "}
                      {Number(seriesSummary.lastMeeting.team2Score).toFixed(1)}
                    </small>
                    <small className="game-center-series-team-labels">
                      {seriesSummary.lastMeeting.team1Id === game.team1Id
                        ? game.team1Team
                        : game.team2Team}
                      {" – "}
                      {seriesSummary.lastMeeting.team2Id === game.team2Id
                        ? game.team2Team
                        : game.team1Team}
                    </small>
                  </>
                ) : null}
              </div>

              <div className="game-center-series-fact">
                <span>Current Streak</span>
                <strong>
                  {!seriesSummary.streak
                    ? "—"
                    : seriesSummary.streak.isTie
                      ? "Tied last meeting"
                      : `${
                          seriesSummary.streak.winnerId === game.team1Id
                            ? game.team1Team
                            : game.team2Team
                        } W${seriesSummary.streak.count}`}
                </strong>
                <small>
                  {seriesSummary.streak &&
                  !seriesSummary.streak.isTie
                    ? `${seriesSummary.streak.count} straight`
                    : "Most recent result"}
                </small>
              </div>

              <div className="game-center-series-fact">
                <span>Largest Win</span>
                <strong>
                  {seriesSummary.largestWin
                    ? `${
                        seriesSummary.largestWin.winnerId === game.team1Id
                          ? game.team1Team
                          : game.team2Team
                      } +${seriesSummary.largestWin.margin.toFixed(1)}`
                    : "—"}
                </strong>
                <small>
                  {seriesSummary.largestWin
                    ? `${seriesSummary.largestWin.meeting.season} • Week ${seriesSummary.largestWin.meeting.week}`
                    : "No completed meetings"}
                </small>
              </div>

              <div className="game-center-series-fact">
                <span>Closest Meeting</span>
                <strong>
                  {seriesSummary.closestMeeting
                    ? seriesSummary.closestMeeting.margin === 0
                      ? "Tie Game"
                      : `${
                          seriesSummary.closestMeeting.winnerId === game.team1Id
                            ? game.team1Team
                            : game.team2Team
                        } +${seriesSummary.closestMeeting.margin.toFixed(1)}`
                    : "—"}
                </strong>
                <small>
                  {seriesSummary.closestMeeting
                    ? `${seriesSummary.closestMeeting.meeting.season} • Week ${seriesSummary.closestMeeting.meeting.week}`
                    : "No completed meetings"}
                </small>
              </div>

              <div className="game-center-series-fact">
                <span>Highest-Scoring Meeting</span>
                <strong>
                  {seriesSummary.highestScoringMeeting
                    ? `${seriesSummary.highestScoringMeeting.combinedScore.toFixed(1)} Combined`
                    : "—"}
                </strong>
                <small>
                  {seriesSummary.highestScoringMeeting
                    ? `${seriesSummary.highestScoringMeeting.meeting.season} • Week ${seriesSummary.highestScoringMeeting.meeting.week}`
                    : "No completed meetings"}
                </small>
              </div>

              <div className="game-center-series-fact">
                <span>Average Score</span>
                <strong>
                  {seriesSummary.averageTeam1Score !== null
                    ? `${seriesSummary.averageTeam1Score.toFixed(1)} – ${seriesSummary.averageTeam2Score.toFixed(1)}`
                    : "—"}
                </strong>
                <small>
                  {game.team1Team} – {game.team2Team}
                </small>
              </div>

              <div className="game-center-series-fact game-center-series-fact-wide">
                <span>Postseason Series</span>
                {seriesSummary.postseasonMeetings > 0 ? (
                  <>
                    <strong>
                      {seriesSummary.postseasonTeam1Wins ===
                      seriesSummary.postseasonTeam2Wins
                        ? `Tied ${seriesSummary.postseasonTeam1Wins}–${seriesSummary.postseasonTeam2Wins}`
                        : seriesSummary.postseasonTeam1Wins >
                            seriesSummary.postseasonTeam2Wins
                          ? `${game.team1Team} leads ${seriesSummary.postseasonTeam1Wins}–${seriesSummary.postseasonTeam2Wins}`
                          : `${game.team2Team} leads ${seriesSummary.postseasonTeam2Wins}–${seriesSummary.postseasonTeam1Wins}`}
                      {seriesSummary.postseasonTies > 0
                        ? `–${seriesSummary.postseasonTies}`
                        : ""}
                    </strong>
                    <small>
                      {seriesSummary.postseasonMeetings} postseason{" "}
                      {seriesSummary.postseasonMeetings === 1
                        ? "meeting"
                        : "meetings"}
                    </small>
                  </>
                ) : (
                  <>
                    <strong>No Postseason Meetings</strong>
                    <small>Regular-season series only</small>
                  </>
                )}
              </div>
            </div>

            <div className="game-center-history-subheading">
              <div>
                <span>Archive</span>
                <h3>Recent Meetings</h3>
              </div>

              <small>
                Showing {Math.min(history.length, 8)} of {history.length}
              </small>
            </div>

            <div className="game-center-history-list">
              {history.slice(0, 8).map((meeting) => (
                <HistoryCard
                  key={meeting.gameId}
                  meeting={meeting}
                  currentTeam1Id={game.team1Id}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="game-center-history-empty">
            <History size={20} />
            <div>
              <strong>No prior meetings found</strong>
              <span>
                This is the first archived meeting between these permanent
                MESH franchises.
              </span>
            </div>
          </div>
        )}
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
