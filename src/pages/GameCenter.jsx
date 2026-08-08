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
  getHeadToHeadHistory,
} from "../services/googleSheets";
import meshShield from "../assets/logos/mfl-shield.png";

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

function centerStatusLabel(game) {
  if (game.status === "live") return "Live";
  if (game.status === "final") return "Final";
  return "Scheduled";
}

function TeamLogo({ src, initial, team }) {
  if (src) {
    return (
      <div className="gc-home-logo">
        <img src={src} alt={`${team} logo`} />
      </div>
    );
  }

  return (
    <div className="gc-home-logo gc-home-logo-placeholder">
      {initial || "?"}
    </div>
  );
}

function HomeStyleTeam({
  side,
  team,
  coach,
  logo,
  initial,
  rank,
  overallRecord,
  conferenceRecord,
  conference,
  tier,
  isWinner,
  isLoser,
}) {
  const isCollege = tier === "FBS" || tier === "FCS";

  return (
    <div
      className={[
        "gc-home-team",
        `gc-home-team-${side}`,
        isWinner ? "winner" : "",
        isLoser ? "loser" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <TeamLogo src={logo} initial={initial} team={team || "TBD"} />

      <div className="gc-home-team-name">
        <strong>
          {rank >= 1 && rank <= 25 ? (
            <span className="gc-home-rank">#{rank}</span>
          ) : null}
          <span>{team || "TBD"}</span>
        </strong>
      </div>

      {coach ? <span className="gc-home-coach">{coach}</span> : null}

      <div className="gc-home-record">
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
        <span className="gc-home-conference">{conference}</span>
      ) : null}
    </div>
  );
}

function HomeStyleCenter({ game }) {
  const team1Projection = formatProjection(game.team1Projection);
  const team2Projection = formatProjection(game.team2Projection);

  const hasScores =
    game.team1Score !== null &&
    game.team1Score !== undefined &&
    game.team2Score !== null &&
    game.team2Score !== undefined;

  const hasProjections =
    team1Projection !== null && team2Projection !== null;

  return (
    <div className="gc-home-center">
      <div className="gc-home-score-line">
        {hasScores ? (
          <>
            <strong>{formatScore(game.team1Score, game.status)}</strong>
            <span>vs</span>
            <strong>{formatScore(game.team2Score, game.status)}</strong>
          </>
        ) : hasProjections ? (
          <>
            <strong>{team1Projection}</strong>
            <span className="gc-home-proj-label">PROJ</span>
            <strong>{team2Projection}</strong>
          </>
        ) : (
          <span className="gc-home-vs-large">VS</span>
        )}
      </div>

      {hasScores && hasProjections && game.status !== "final" ? (
        <div className="gc-home-projection-line">
          <span>PROJ {team1Projection}</span>
          <span>•</span>
          <span>{team2Projection}</span>
        </div>
      ) : null}

      <span className={`gc-home-center-status gc-home-center-status-${game.status}`}>
        {game.status === "live" ? <Radio size={9} /> : null}
        {game.status === "upcoming" && hasProjections
          ? "Projected"
          : centerStatusLabel(game)}
      </span>
    </div>
  );
}

function WinProbability({ game }) {
  const firstRaw = clampProbability(game.team1WinProbability);
  const secondRaw = clampProbability(game.team2WinProbability);

  if (firstRaw === null && secondRaw === null) {
    return (
      <div className="gc-home-probability">
        <span className="gc-home-probability-title">Win Probability</span>
        <div className="gc-home-probability-unavailable">
          Win probability will appear once the Sleeper probability feed is connected.
        </div>
      </div>
    );
  }

  const first = firstRaw !== null ? firstRaw : 100 - secondRaw;
  const second = secondRaw !== null ? secondRaw : 100 - first;

  return (
    <div className="gc-home-probability">
      <span className="gc-home-probability-title">Win Probability</span>

      <div className="gc-home-probability-values">
        <strong>{Math.round(first)}%</strong>
        <strong>{Math.round(second)}%</strong>
      </div>

      <div className="gc-home-probability-track">
        <div
          className={`gc-home-probability-fill gc-home-probability-fill-${game.tierClass}`}
          style={{ width: `${first}%` }}
        />
      </div>
    </div>
  );
}

function MatchupCard({ game, winnerState }) {
  const normalizedType = String(
    game.gameType || game.gameCategory || "",
  ).toLowerCase();

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
    <section
      className={[
        "gc-home-card",
        `gc-home-card-${game.tierClass}`,
        `gc-home-card-${game.status}`,
      ].join(" ")}
    >
      <div className="gc-home-card-top">
        <span className={`gc-home-state-pill gc-home-state-pill-${game.status}`}>
          {game.status === "live" ? <Radio size={10} /> : null}
          {matchupStatusLabel(game)}
        </span>

        <span className={`gc-home-tier-pill gc-home-tier-pill-${game.tierClass}`}>
          {game.tier}
        </span>
      </div>

      <h2 className="gc-home-title">{title}</h2>

      <div className="gc-home-matchup">
        <HomeStyleTeam
          side="one"
          team={game.team1Team}
          coach={game.team1Coach}
          logo={game.team1Logo}
          initial={game.team1Initial}
          rank={game.team1Top25Rank}
          overallRecord={game.team1OverallRecord}
          conferenceRecord={game.team1ConferenceRecord}
          conference={game.team1Conference}
          tier={game.tier}
          isWinner={winnerState.team1Winner}
          isLoser={winnerState.hasWinner && !winnerState.team1Winner}
        />

        <HomeStyleCenter game={game} />

        <HomeStyleTeam
          side="two"
          team={game.team2Team}
          coach={game.team2Coach}
          logo={game.team2Logo}
          initial={game.team2Initial}
          rank={game.team2Top25Rank}
          overallRecord={game.team2OverallRecord}
          conferenceRecord={game.team2ConferenceRecord}
          conference={game.team2Conference}
          tier={game.tier}
          isWinner={winnerState.team2Winner}
          isLoser={winnerState.hasWinner && !winnerState.team2Winner}
        />
      </div>

      <WinProbability game={game} />
    </section>
  );
}

function RosterPlaceholder({ team, side }) {
  return (
    <div className={`game-center-roster-panel game-center-roster-panel-${side}`}>
      <div className="game-center-roster-panel-heading">
        <Users size={16} />
        <strong>{team || "TBD"}</strong>
      </div>

      <div className="game-center-roster-placeholder-table">
        <div>
          <span>POS</span>
          <span>PLAYER</span>
          <span>PTS</span>
        </div>
        <div>
          <span>—</span>
          <strong>Starter scoring will populate from Sleeper</strong>
          <span>—</span>
        </div>
      </div>
    </div>
  );
}

function HistoryCard({ meeting, currentTeam1Id }) {
  const team1WasCurrentLeft = meeting.team1Id === currentTeam1Id;

  const leftName = team1WasCurrentLeft ? meeting.team1Team : meeting.team2Team;
  const rightName = team1WasCurrentLeft ? meeting.team2Team : meeting.team1Team;
  const leftScore = team1WasCurrentLeft ? meeting.team1Score : meeting.team2Score;
  const rightScore = team1WasCurrentLeft ? meeting.team2Score : meeting.team1Score;

  return (
    <div className="game-center-history-row">
      <div>
        <span>{meeting.season} • Week {meeting.week}</span>
        <strong>{meeting.gameType || meeting.gameCategory || "Matchup"}</strong>
      </div>

      <div className="game-center-history-score">
        <span>{leftName}</span>
        <strong>{leftScore === null ? "—" : Number(leftScore).toFixed(1)}</strong>
        <span className="game-center-history-vs">vs</span>
        <strong>{rightScore === null ? "—" : Number(rightScore).toFixed(1)}</strong>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadGame() {
      try {
        setLoading(true);
        setError("");

        const result = await getGameById(decodeURIComponent(gameId || ""));
        const priorMeetings = await getHeadToHeadHistory(
          result.team1Id,
          result.team2Id,
          result.gameId,
        );

        if (isMounted) {
          setGame(result);
          setHistory(priorMeetings);
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

      <MatchupCard game={game} winnerState={winnerState} />

      <section className="game-center-rosters">
        <div className="game-center-section-heading">
          <span>Live scoring</span>
          <h2>Roster / Player Scoring</h2>
        </div>

        <div className="game-center-roster-grid">
          <RosterPlaceholder team={game.team1Team} side="one" />
          <RosterPlaceholder team={game.team2Team} side="two" />
        </div>
      </section>

      <section className="game-center-history">
        <div className="game-center-section-heading">
          <span>Series</span>
          <h2>Head-to-Head History & Prior Meetings</h2>
        </div>

        {history.length > 0 ? (
          <div className="game-center-history-list">
            {history.slice(0, 8).map((meeting) => (
              <HistoryCard
                key={meeting.gameId}
                meeting={meeting}
                currentTeam1Id={game.team1Id}
              />
            ))}
          </div>
        ) : (
          <div className="game-center-history-empty">
            <History size={20} />
            <div>
              <strong>No prior meetings found</strong>
              <span>
                Historical meetings will populate as earlier GAME_RESULTS seasons are added.
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
