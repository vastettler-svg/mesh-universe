import { useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Radio,
  Trophy,
} from "lucide-react";

import PageHero from "../components/PageHero";
import meshShield from "../assets/logos/mfl-shield.png";

import "../styles/scores.css";

const CURRENT_WEEK = 5;
const MAX_WEEK = 18;

const tierOptions = [
  { id: "all", label: "All" },
  { id: "nfl", label: "NFL" },
  { id: "fbs", label: "FBS" },
  { id: "fcs", label: "FCS" },
];

const scoreData = [
  {
    id: "nfl-1",
    tier: "NFL",
    tierClass: "nfl",
    league: "NFL League A",
    status: "live",
    statusLabel: "Live",
    clock: "4th Quarter",
    awayTeam: "Bulldogs",
    awayInitial: "B",
    awayRecord: "3–1",
    awayScore: 142.3,
    awayProjection: 151.8,
    homeTeam: "Lions",
    homeInitial: "L",
    homeRecord: "2–2",
    homeScore: 139.8,
    homeProjection: 147.2,
    winProbability: 72,
  },
  {
    id: "nfl-2",
    tier: "NFL",
    tierClass: "nfl",
    league: "NFL League B",
    status: "final",
    statusLabel: "Final",
    clock: "Final",
    awayTeam: "Panthers",
    awayInitial: "P",
    awayRecord: "3–2",
    awayScore: 131.4,
    awayProjection: 128.6,
    homeTeam: "Raiders",
    homeInitial: "R",
    homeRecord: "2–3",
    homeScore: 127.2,
    homeProjection: 130.1,
    winProbability: 100,
  },
  {
    id: "fbs-1",
    tier: "FBS",
    tierClass: "fbs",
    league: "SEC",
    status: "live",
    statusLabel: "Live",
    clock: "Sunday Afternoon",
    awayTeam: "Tigers",
    awayInitial: "T",
    awayRecord: "4–0",
    awayScore: 136.4,
    awayProjection: 154.7,
    homeTeam: "Eagles",
    homeInitial: "E",
    homeRecord: "3–1",
    homeScore: 134.9,
    homeProjection: 149.2,
    winProbability: 54,
  },
  {
    id: "fbs-2",
    tier: "FBS",
    tierClass: "fbs",
    league: "Big Ten",
    status: "upcoming",
    statusLabel: "Upcoming",
    clock: "Sun 4:25 PM",
    awayTeam: "Hurricanes",
    awayInitial: "H",
    awayRecord: "3–1",
    awayScore: null,
    awayProjection: 148.5,
    homeTeam: "Longhorns",
    homeInitial: "L",
    homeRecord: "3–1",
    homeScore: null,
    homeProjection: 146.1,
    winProbability: 52,
  },
  {
    id: "fbs-3",
    tier: "FBS",
    tierClass: "fbs",
    league: "Big 12",
    status: "final",
    statusLabel: "Final",
    clock: "Final",
    awayTeam: "Falcons",
    awayInitial: "F",
    awayRecord: "2–3",
    awayScore: 118.7,
    awayProjection: 121.3,
    homeTeam: "Bobcats",
    homeInitial: "B",
    homeRecord: "3–2",
    homeScore: 124.6,
    homeProjection: 119.8,
    winProbability: 0,
  },
  {
    id: "fcs-1",
    tier: "FCS",
    tierClass: "fcs",
    league: "Big Sky",
    status: "upcoming",
    statusLabel: "Upcoming",
    clock: "Sun 8:20 PM",
    awayTeam: "Wildcats",
    awayInitial: "W",
    awayRecord: "4–0",
    awayScore: null,
    awayProjection: 131.7,
    homeTeam: "Rams",
    homeInitial: "R",
    homeRecord: "3–1",
    homeScore: null,
    homeProjection: 130.2,
    winProbability: 51,
  },
  {
    id: "fcs-2",
    tier: "FCS",
    tierClass: "fcs",
    league: "Missouri Valley",
    status: "live",
    statusLabel: "Live",
    clock: "Sunday Night",
    awayTeam: "Bison",
    awayInitial: "B",
    awayRecord: "3–1",
    awayScore: 125.8,
    awayProjection: 141.3,
    homeTeam: "Hornets",
    homeInitial: "H",
    homeRecord: "2–2",
    homeScore: 119.5,
    homeProjection: 137.8,
    winProbability: 61,
  },
];

const heroStats = [
  { label: "Live", value: "3" },
  { label: "Upcoming", value: "2" },
  { label: "Final", value: "2" },
  { label: "Leagues", value: "15" },
];

function TierBadge({ tier, tierClass }) {
  return (
    <span className={`scores-tier-badge scores-tier-badge-${tierClass}`}>
      {tier}
    </span>
  );
}

function StatusBadge({ status, label }) {
  const icons = {
    live: Radio,
    upcoming: Clock3,
    final: Trophy,
  };

  const StatusIcon = icons[status] ?? Circle;

  return (
    <span className={`scores-status-badge scores-status-${status}`}>
      <StatusIcon size={12} />
      {label}
    </span>
  );
}

function TeamRow({
  team,
  initial,
  record,
  score,
  projection,
  tierClass,
  isWinner,
}) {
  return (
    <div className={`score-team-row${isWinner ? " winner" : ""}`}>
      <div className={`score-team-logo score-team-logo-${tierClass}`}>
        {initial}
      </div>

      <div className="score-team-info">
        <strong>{team}</strong>
        <span>{record}</span>
      </div>

      <div className="score-team-numbers">
        <strong>{score === null ? projection.toFixed(1) : score.toFixed(1)}</strong>

        <span>{score === null ? "PROJ" : `PROJ ${projection.toFixed(1)}`}</span>
      </div>
    </div>
  );
}

function ScoreCard({ game }) {
  const awayWinner =
    game.status === "final" &&
    game.awayScore !== null &&
    game.homeScore !== null &&
    game.awayScore > game.homeScore;

  const homeWinner =
    game.status === "final" &&
    game.awayScore !== null &&
    game.homeScore !== null &&
    game.homeScore > game.awayScore;

  return (
    <article
      className={`score-card score-card-${game.tierClass} score-card-${game.status}`}
    >
      <div className="score-card-header">
        <div>
          <TierBadge tier={game.tier} tierClass={game.tierClass} />
          <span className="score-league-name">{game.league}</span>
        </div>

        <StatusBadge status={game.status} label={game.statusLabel} />
      </div>

      <div className="score-card-time">
        <CalendarDays size={13} />
        <span>{game.clock}</span>
      </div>

      <div className="score-team-list">
        <TeamRow
          team={game.awayTeam}
          initial={game.awayInitial}
          record={game.awayRecord}
          score={game.awayScore}
          projection={game.awayProjection}
          tierClass={game.tierClass}
          isWinner={awayWinner}
        />

        <TeamRow
          team={game.homeTeam}
          initial={game.homeInitial}
          record={game.homeRecord}
          score={game.homeScore}
          projection={game.homeProjection}
          tierClass={game.tierClass}
          isWinner={homeWinner}
        />
      </div>

      <div className="score-card-footer">
        <div className="score-probability-heading">
          <span>Win probability</span>
          <span>
            {game.winProbability}% / {100 - game.winProbability}%
          </span>
        </div>

        <div className="score-probability-track">
          <div
            className={`score-probability-fill score-probability-fill-${game.tierClass}`}
            style={{ width: `${game.winProbability}%` }}
          />
        </div>

        <button type="button" className="score-game-center-button">
          View Game Center
          <ChevronRight size={15} />
        </button>
      </div>
    </article>
  );
}

function Scores() {
  const [selectedWeek, setSelectedWeek] = useState(CURRENT_WEEK);
  const [selectedTier, setSelectedTier] = useState("all");

  const filteredGames = useMemo(() => {
    if (selectedTier === "all") {
      return scoreData;
    }

    return scoreData.filter(
      (game) => game.tierClass === selectedTier,
    );
  }, [selectedTier]);

  const groupedGames = useMemo(() => {
    return ["nfl", "fbs", "fcs"]
      .map((tierClass) => ({
        tierClass,
        tier: tierClass.toUpperCase(),
        games: filteredGames.filter(
          (game) => game.tierClass === tierClass,
        ),
      }))
      .filter((group) => group.games.length > 0);
  }, [filteredGames]);

  const goToPreviousWeek = () => {
    setSelectedWeek((week) => Math.max(1, week - 1));
  };

  const goToNextWeek = () => {
    setSelectedWeek((week) => Math.min(MAX_WEEK, week + 1));
  };

  return (
    <main className="scores-page">
      <PageHero
        eyebrow="Live Game Center"
        title="Scores"
        description="Follow every matchup across all 15 MESH leagues with live scores, projections, schedules, and final results."
        imageSrc={meshShield}
        imageAlt="MESH Football shield"
        accent="scores"
        stats={heroStats}
      />

      <section className="scores-controls">
        <div className="scores-week-selector">
          <button
            type="button"
            onClick={goToPreviousWeek}
            disabled={selectedWeek === 1}
            aria-label="Previous week"
          >
            <ChevronLeft size={19} />
          </button>

          <div>
            <span>Regular Season</span>
            <strong>Week {selectedWeek}</strong>
          </div>

          <button
            type="button"
            onClick={goToNextWeek}
            disabled={selectedWeek === MAX_WEEK}
            aria-label="Next week"
          >
            <ChevronRight size={19} />
          </button>
        </div>

        <div className="scores-tier-tabs" aria-label="Filter scores by tier">
          {tierOptions.map((tier) => (
            <button
              type="button"
              key={tier.id}
              className={
                selectedTier === tier.id
                  ? `scores-tier-tab active scores-tier-tab-${tier.id}`
                  : `scores-tier-tab scores-tier-tab-${tier.id}`
              }
              onClick={() => setSelectedTier(tier.id)}
            >
              {tier.label}
            </button>
          ))}
        </div>
      </section>

      <section className="scores-summary-bar">
        <div className="scores-summary-item">
          <Radio size={16} />
          <div>
            <strong>3</strong>
            <span>Live</span>
          </div>
        </div>

        <div className="scores-summary-item">
          <Clock3 size={16} />
          <div>
            <strong>2</strong>
            <span>Upcoming</span>
          </div>
        </div>

        <div className="scores-summary-item">
          <Trophy size={16} />
          <div>
            <strong>2</strong>
            <span>Final</span>
          </div>
        </div>

        <div className="scores-summary-item">
          <Activity size={16} />
          <div>
            <strong>{filteredGames.length}</strong>
            <span>Shown</span>
          </div>
        </div>
      </section>

      {groupedGames.map((group) => (
        <section
          className={`scores-tier-section scores-tier-section-${group.tierClass}`}
          key={group.tierClass}
        >
          <div className="scores-section-heading">
            <div>
              <span>{group.games.length} matchups</span>
              <h2>{group.tier}</h2>
            </div>

            <TierBadge
              tier={group.tier}
              tierClass={group.tierClass}
            />
          </div>

          <div className="scores-grid">
            {group.games.map((game) => (
              <ScoreCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

export default Scores;