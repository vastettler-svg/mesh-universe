import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  Clock3,
  Radio,
  Trophy,
} from "lucide-react";

import PageHeader from "../components/PageHeader";
import { getGameById } from "../services/googleSheets";
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
    return "";
  }

  return `Proj: ${Number(value).toFixed(1)}`;
}

function GameStatusBadge({ game }) {
  const icons = {
    live: Radio,
    upcoming: Clock3,
    final: Trophy,
  };

  const StatusIcon = icons[game.status] ?? Activity;

  return (
    <span className={`game-center-status game-center-status-${game.status}`}>
      <StatusIcon size={13} />
      {game.statusLabel}
    </span>
  );
}

function TeamPanel({
  side,
  team,
  coach,
  conference,
  overallRecord,
  conferenceRecord,
  rank,
  score,
  projection,
  tier,
  status,
  isWinner,
  isLoser,
}) {
  const isCollege = tier === "FBS" || tier === "FCS";

  return (
    <section
      className={[
        "game-center-team",
        `game-center-team-${side}`,
        isWinner ? "winner" : "",
        isLoser ? "loser" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="game-center-team-copy">
        <div className="game-center-team-name">
          {rank >= 1 && rank <= 25 ? (
            <span className="game-center-rank">#{rank}</span>
          ) : null}
          <h2>{team || "TBD"}</h2>
        </div>

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

      <div className="game-center-score-block">
        <strong>{formatScore(score, status)}</strong>
        {status !== "final" && projection !== null ? (
          <span>{formatProjection(projection)}</span>
        ) : null}
      </div>
    </section>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;

  return (
    <div className="game-center-detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function GameCenter() {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadGame() {
      try {
        setLoading(true);
        setError("");

        const result = await getGameById(decodeURIComponent(gameId || ""));

        if (isMounted) {
          setGame(result);
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
        <Link className="game-center-back" to="/scores">
          <ArrowLeft size={16} />
          Back to Scores
        </Link>

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
      <Link className="game-center-back" to="/scores">
        <ArrowLeft size={16} />
        Back to Scores
      </Link>

      <PageHeader
        eyebrow={`${game.tier} • Week ${game.week}`}
        title="Game Center"
        description={matchupLabel}
        imageSrc={meshShield}
        imageAlt="MESH Football shield"
        accent="scores"
        size="compact"
      />

      <section
        className={`game-center-hero game-center-hero-${game.tierClass}`}
      >
        <div className="game-center-hero-top">
          <div>
            <span className="game-center-tier">{game.tier}</span>
            <p>{matchupLabel}</p>
          </div>

          <GameStatusBadge game={game} />
        </div>

        <div className="game-center-matchup">
          <TeamPanel
            side="one"
            team={game.team1Team}
            coach={game.team1Coach}
            conference={game.team1Conference}
            overallRecord={game.team1OverallRecord}
            conferenceRecord={game.team1ConferenceRecord}
            rank={game.team1Top25Rank}
            score={game.team1Score}
            projection={game.team1Projection}
            tier={game.tier}
            status={game.status}
            isWinner={winnerState.team1Winner}
            isLoser={winnerState.hasWinner && !winnerState.team1Winner}
          />

          <div className="game-center-versus">VS</div>

          <TeamPanel
            side="two"
            team={game.team2Team}
            coach={game.team2Coach}
            conference={game.team2Conference}
            overallRecord={game.team2OverallRecord}
            conferenceRecord={game.team2ConferenceRecord}
            rank={game.team2Top25Rank}
            score={game.team2Score}
            projection={game.team2Projection}
            tier={game.tier}
            status={game.status}
            isWinner={winnerState.team2Winner}
            isLoser={winnerState.hasWinner && !winnerState.team2Winner}
          />
        </div>
      </section>

      <section className="game-center-details">
        <div className="game-center-section-heading">
          <span>Matchup</span>
          <h2>Game Details</h2>
        </div>

        <div className="game-center-detail-card">
          <DetailRow label="Season" value={String(game.season || "")} />
          <DetailRow label="Week" value={`Week ${game.week}`} />
          <DetailRow label="Tier" value={game.tier} />
          <DetailRow label="Category" value={game.gameCategory} />
          <DetailRow label="Game Type" value={game.gameType} />
          <DetailRow label="Bowl" value={game.bowlName} />
          <DetailRow label="Game ID" value={game.gameId} />
        </div>
      </section>

      <section className="game-center-coming-soon">
        <div className="game-center-section-heading">
          <span>Next</span>
          <h2>Game Center Expansion</h2>
        </div>

        <div className="game-center-future-grid">
          <div>
            <strong>Scoring</strong>
            <span>Live scoring and projections</span>
          </div>
          <div>
            <strong>Players</strong>
            <span>Starter and roster performance</span>
          </div>
          <div>
            <strong>History</strong>
            <span>Head-to-head and prior meetings</span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default GameCenter;
