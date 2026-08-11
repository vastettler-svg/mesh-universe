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
      <div className="game-center-hero-top">
        <span className={`gc-home-state-pill gc-home-state-pill-${game.status}`}>
          {game.status === "live" ? <Radio size={10} /> : null}
          {matchupStatusLabel(game)}
        </span>

        <h2>{title}</h2>

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
