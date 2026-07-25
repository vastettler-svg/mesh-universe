import { useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Radio,
  Sparkles,
  Trophy,
} from "lucide-react";

import PageHeader from "../components/PageHeader";
import meshShield from "../assets/logos/mfl-shield.png";

import "../styles/scores.css";

const CURRENT_WEEK = 5;
const MAX_WEEK = 18;

const primaryFilters = [
  {
    id: "featured",
    label: "Featured",
  },
  {
    id: "nfl",
    label: "NFL",
  },
  {
    id: "fbs",
    label: "FBS",
  },
  {
    id: "fcs",
    label: "FCS",
  },
];

const secondaryFilters = {
  nfl: [
    {
      id: "all",
      label: "All NFL",
    },
    {
      id: "afc",
      label: "AFC",
    },
    {
      id: "nfc",
      label: "NFC",
    },
  ],
  fbs: [
    {
      id: "all",
      label: "All FBS",
    },
    {
      id: "top-25",
      label: "Top 25",
    },
    {
      id: "acc",
      label: "ACC",
    },
    {
      id: "big-ten",
      label: "Big Ten",
    },
    {
      id: "big-12",
      label: "Big 12",
    },
    {
      id: "mac",
      label: "MAC",
    },
    {
      id: "mountain-west",
      label: "Mountain West",
    },
    {
      id: "sec",
      label: "SEC",
    },
    {
      id: "sun-belt",
      label: "Sun Belt",
    },
  ],
  fcs: [
    {
      id: "all",
      label: "All FCS",
    },
    {
      id: "top-25",
      label: "Top 25",
    },
    {
      id: "big-sky",
      label: "Big Sky",
    },
    {
      id: "coastal",
      label: "Coastal",
    },
    {
      id: "ivy",
      label: "Ivy",
    },
    {
      id: "missouri-valley",
      label: "Missouri Valley",
    },
    {
      id: "northeast",
      label: "Northeast",
    },
    {
      id: "southland",
      label: "Southland",
    },
  ],
};

const scoreData = [
  {
    id: "nfl-afc-1",
    tier: "NFL",
    tierClass: "nfl",
    conference: "AFC",
    conferenceId: "afc",
    league: "NFL League A",
    status: "live",
    statusLabel: "Live",
    clock: "Sunday Night",
    featured: true,
    featuredRank: 1,
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
    id: "nfl-nfc-1",
    tier: "NFL",
    tierClass: "nfl",
    conference: "NFC",
    conferenceId: "nfc",
    league: "NFL League B",
    status: "final",
    statusLabel: "Final",
    clock: "Final",
    featured: true,
    featuredRank: 2,
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
    id: "nfl-afc-2",
    tier: "NFL",
    tierClass: "nfl",
    conference: "AFC",
    conferenceId: "afc",
    league: "NFL League A",
    status: "upcoming",
    statusLabel: "Upcoming",
    clock: "Mon 8:15 PM",
    featured: true,
    featuredRank: 3,
    awayTeam: "Bears",
    awayInitial: "B",
    awayRecord: "1–3",
    awayScore: null,
    awayProjection: 144.8,
    homeTeam: "Jets",
    homeInitial: "J",
    homeRecord: "1–3",
    homeScore: null,
    homeProjection: 142.6,
    winProbability: 53,
  },
  {
    id: "nfl-nfc-2",
    tier: "NFL",
    tierClass: "nfl",
    conference: "NFC",
    conferenceId: "nfc",
    league: "NFL League B",
    status: "upcoming",
    statusLabel: "Upcoming",
    clock: "Sun 4:25 PM",
    featured: false,
    awayTeam: "Wolves",
    awayInitial: "W",
    awayRecord: "2–2",
    awayScore: null,
    awayProjection: 137.5,
    homeTeam: "Ravens",
    homeInitial: "R",
    homeRecord: "3–1",
    homeScore: null,
    homeProjection: 149.1,
    winProbability: 38,
  },

  {
    id: "fbs-sec-1",
    tier: "FBS",
    tierClass: "fbs",
    conference: "SEC",
    conferenceId: "sec",
    league: "SEC",
    status: "live",
    statusLabel: "Live",
    clock: "Sunday Afternoon",
    top25: true,
    featured: true,
    featuredRank: 1,
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
    id: "fbs-big-ten-1",
    tier: "FBS",
    tierClass: "fbs",
    conference: "Big Ten",
    conferenceId: "big-ten",
    league: "Big Ten",
    status: "upcoming",
    statusLabel: "Upcoming",
    clock: "Sun 4:25 PM",
    top25: true,
    featured: true,
    featuredRank: 2,
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
    id: "fbs-big-12-1",
    tier: "FBS",
    tierClass: "fbs",
    conference: "Big 12",
    conferenceId: "big-12",
    league: "Big 12",
    status: "final",
    statusLabel: "Final",
    clock: "Final",
    top25: true,
    featured: true,
    featuredRank: 3,
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
    id: "fbs-acc-1",
    tier: "FBS",
    tierClass: "fbs",
    conference: "ACC",
    conferenceId: "acc",
    league: "ACC",
    status: "upcoming",
    statusLabel: "Upcoming",
    clock: "Sun 1:00 PM",
    top25: false,
    featured: false,
    awayTeam: "Cardinals",
    awayInitial: "C",
    awayRecord: "2–2",
    awayScore: null,
    awayProjection: 139.7,
    homeTeam: "Blue Devils",
    homeInitial: "B",
    homeRecord: "3–1",
    homeScore: null,
    homeProjection: 143.2,
    winProbability: 46,
  },
  {
    id: "fbs-mac-1",
    tier: "FBS",
    tierClass: "fbs",
    conference: "MAC",
    conferenceId: "mac",
    league: "MAC",
    status: "final",
    statusLabel: "Final",
    clock: "Final",
    top25: false,
    featured: false,
    awayTeam: "Golden Flashes",
    awayInitial: "G",
    awayRecord: "1–4",
    awayScore: 110.4,
    awayProjection: 116.9,
    homeTeam: "RedHawks",
    homeInitial: "R",
    homeRecord: "3–2",
    homeScore: 129.8,
    homeProjection: 125.3,
    winProbability: 0,
  },
  {
    id: "fbs-mountain-west-1",
    tier: "FBS",
    tierClass: "fbs",
    conference: "Mountain West",
    conferenceId: "mountain-west",
    league: "Mountain West",
    status: "live",
    statusLabel: "Live",
    clock: "Sunday Night",
    top25: false,
    featured: false,
    awayTeam: "Broncos",
    awayInitial: "B",
    awayRecord: "3–1",
    awayScore: 127.8,
    awayProjection: 145.6,
    homeTeam: "Aggies",
    homeInitial: "A",
    homeRecord: "2–2",
    homeScore: 121.3,
    homeProjection: 139.8,
    winProbability: 63,
  },
  {
    id: "fbs-sun-belt-1",
    tier: "FBS",
    tierClass: "fbs",
    conference: "Sun Belt",
    conferenceId: "sun-belt",
    league: "Sun Belt",
    status: "upcoming",
    statusLabel: "Upcoming",
    clock: "Mon 7:15 PM",
    top25: false,
    featured: false,
    awayTeam: "Mountaineers",
    awayInitial: "M",
    awayRecord: "2–2",
    awayScore: null,
    awayProjection: 132.9,
    homeTeam: "Trojans",
    homeInitial: "T",
    homeRecord: "2–2",
    homeScore: null,
    homeProjection: 134.1,
    winProbability: 49,
  },

  {
    id: "fcs-big-sky-1",
    tier: "FCS",
    tierClass: "fcs",
    conference: "Big Sky",
    conferenceId: "big-sky",
    league: "Big Sky",
    status: "upcoming",
    statusLabel: "Upcoming",
    clock: "Sun 8:20 PM",
    top25: true,
    featured: true,
    featuredRank: 1,
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
    id: "fcs-missouri-valley-1",
    tier: "FCS",
    tierClass: "fcs",
    conference: "Missouri Valley",
    conferenceId: "missouri-valley",
    league: "Missouri Valley",
    status: "live",
    statusLabel: "Live",
    clock: "Sunday Night",
    top25: true,
    featured: true,
    featuredRank: 2,
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
  {
    id: "fcs-ivy-1",
    tier: "FCS",
    tierClass: "fcs",
    conference: "Ivy",
    conferenceId: "ivy",
    league: "Ivy",
    status: "final",
    statusLabel: "Final",
    clock: "Final",
    top25: true,
    featured: true,
    featuredRank: 3,
    awayTeam: "Crimson",
    awayInitial: "C",
    awayRecord: "4–1",
    awayScore: 128.9,
    awayProjection: 126.2,
    homeTeam: "Bears",
    homeInitial: "B",
    homeRecord: "3–2",
    homeScore: 122.1,
    homeProjection: 125.7,
    winProbability: 100,
  },
  {
    id: "fcs-coastal-1",
    tier: "FCS",
    tierClass: "fcs",
    conference: "Coastal",
    conferenceId: "coastal",
    league: "Coastal",
    status: "upcoming",
    statusLabel: "Upcoming",
    clock: "Sun 1:00 PM",
    top25: false,
    featured: false,
    awayTeam: "Seahawks",
    awayInitial: "S",
    awayRecord: "2–2",
    awayScore: null,
    awayProjection: 129.5,
    homeTeam: "Phoenix",
    homeInitial: "P",
    homeRecord: "3–1",
    homeScore: null,
    homeProjection: 136.2,
    winProbability: 42,
  },
  {
    id: "fcs-northeast-1",
    tier: "FCS",
    tierClass: "fcs",
    conference: "Northeast",
    conferenceId: "northeast",
    league: "Northeast",
    status: "final",
    statusLabel: "Final",
    clock: "Final",
    top25: false,
    featured: false,
    awayTeam: "Pioneers",
    awayInitial: "P",
    awayRecord: "2–3",
    awayScore: 115.8,
    awayProjection: 121.4,
    homeTeam: "Dukes",
    homeInitial: "D",
    homeRecord: "3–2",
    homeScore: 123.7,
    homeProjection: 119.2,
    winProbability: 0,
  },
  {
    id: "fcs-southland-1",
    tier: "FCS",
    tierClass: "fcs",
    conference: "Southland",
    conferenceId: "southland",
    league: "Southland",
    status: "live",
    statusLabel: "Live",
    clock: "Late Sunday",
    top25: false,
    featured: false,
    awayTeam: "Cowboys",
    awayInitial: "C",
    awayRecord: "3–1",
    awayScore: 117.9,
    awayProjection: 138.4,
    homeTeam: "Lumberjacks",
    homeInitial: "L",
    homeRecord: "2–2",
    homeScore: 113.6,
    homeProjection: 134.7,
    winProbability: 58,
  },
];

function TierBadge({ tier, tierClass }) {
  return (
    <span className={`scores-tier-badge scores-tier-badge-${tierClass}`}>
      {tier}
    </span>
  );
}

function StatusBadge({ status, label }) {
  const statusIcons = {
    live: Radio,
    upcoming: Clock3,
    final: Trophy,
  };

  const StatusIcon = statusIcons[status] ?? Activity;

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
  const displayedNumber =
    score === null ? projection.toFixed(1) : score.toFixed(1);

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
        <strong>{displayedNumber}</strong>

        <span>
          {score === null ? "PROJECTED" : `PROJ ${projection.toFixed(1)}`}
        </span>
      </div>
    </div>
  );
}

function ScoreCard({ game, featured = false }) {
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
      className={[
        "score-card",
        `score-card-${game.tierClass}`,
        `score-card-${game.status}`,
        featured ? "score-card-featured" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="score-card-header">
        <div className="score-card-identity">
          <TierBadge tier={game.tier} tierClass={game.tierClass} />

          <div>
            <span className="score-league-name">{game.league}</span>

            {featured ? (
              <span className="score-featured-label">
                <Sparkles size={10} />
                Featured matchup
              </span>
            ) : null}
          </div>
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

function FeaturedTierSection({ tierClass, tier, games, onViewAll }) {
  return (
    <section
      className={`featured-tier-section featured-tier-section-${tierClass}`}
    >
      <div className="scores-section-heading">
        <div>
          <span>Three games to watch</span>
          <h2>{tier}</h2>
        </div>

        <TierBadge tier={tier} tierClass={tierClass} />
      </div>

      <div className="scores-grid">
        {games.map((game) => (
          <ScoreCard key={game.id} game={game} featured />
        ))}
      </div>

      <button
        type="button"
        className={`scores-view-tier-button scores-view-tier-button-${tierClass}`}
        onClick={() => onViewAll(tierClass)}
      >
        View All {tier} Games
        <ChevronRight size={17} />
      </button>
    </section>
  );
}

function Scores() {
  const [selectedWeek, setSelectedWeek] = useState(CURRENT_WEEK);
  const [selectedPrimaryFilter, setSelectedPrimaryFilter] =
    useState("featured");
  const [selectedSecondaryFilter, setSelectedSecondaryFilter] =
    useState("all");

  const scoreTotals = useMemo(() => {
    const live = scoreData.filter((game) => game.status === "live").length;
    const upcoming = scoreData.filter(
      (game) => game.status === "upcoming",
    ).length;
    const final = scoreData.filter((game) => game.status === "final").length;

    return {
      live,
      upcoming,
      final,
    };
  }, []);

  const featuredGroups = useMemo(() => {
    return ["nfl", "fbs", "fcs"].map((tierClass) => ({
      tierClass,
      tier: tierClass.toUpperCase(),
      games: scoreData
        .filter(
          (game) => game.tierClass === tierClass && game.featured,
        )
        .sort(
          (firstGame, secondGame) =>
            firstGame.featuredRank - secondGame.featuredRank,
        )
        .slice(0, 3),
    }));
  }, []);

  const visibleTierGames = useMemo(() => {
    if (selectedPrimaryFilter === "featured") {
      return [];
    }

    return scoreData.filter((game) => {
      if (game.tierClass !== selectedPrimaryFilter) {
        return false;
      }

      if (selectedSecondaryFilter === "all") {
        return true;
      }

      if (selectedSecondaryFilter === "top-25") {
        return Boolean(game.top25);
      }

      return game.conferenceId === selectedSecondaryFilter;
    });
  }, [selectedPrimaryFilter, selectedSecondaryFilter]);

  const activeSecondaryFilters =
    secondaryFilters[selectedPrimaryFilter] ?? [];

  const activePrimaryLabel =
    primaryFilters.find(
      (filter) => filter.id === selectedPrimaryFilter,
    )?.label ?? "Featured";

  const activeSecondaryLabel =
    activeSecondaryFilters.find(
      (filter) => filter.id === selectedSecondaryFilter,
    )?.label ?? "";

  const goToPreviousWeek = () => {
    setSelectedWeek((week) => Math.max(1, week - 1));
  };

  const goToNextWeek = () => {
    setSelectedWeek((week) => Math.min(MAX_WEEK, week + 1));
  };

  const selectPrimaryFilter = (filterId) => {
    setSelectedPrimaryFilter(filterId);
    setSelectedSecondaryFilter("all");
  };

  const viewAllTierGames = (tierClass) => {
    setSelectedPrimaryFilter(tierClass);
    setSelectedSecondaryFilter("all");

    window.requestAnimationFrame(() => {
      document.querySelector(".scores-controls")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  return (
    <main className="scores-page">
      <PageHeader
        eyebrow="Live Game Center"
        title="Scores"
        description="Follow the biggest games first, then explore every matchup by tier, conference, ranking, and week."
        imageSrc={meshShield}
        imageAlt="MESH Football shield"
        accent="scores"
        size="compact"
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

        <div
          className="scores-primary-tabs"
          aria-label="Choose scores view"
        >
          {primaryFilters.map((filter) => (
            <button
              type="button"
              key={filter.id}
              className={[
                "scores-primary-tab",
                `scores-primary-tab-${filter.id}`,
                selectedPrimaryFilter === filter.id ? "active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => selectPrimaryFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {selectedPrimaryFilter !== "featured" ? (
        <section
          className={`scores-secondary-filter scores-secondary-filter-${selectedPrimaryFilter}`}
        >
          <div className="scores-secondary-filter-heading">
            <span>Filter {activePrimaryLabel}</span>
            <strong>{activeSecondaryLabel}</strong>
          </div>

          <div
            className="scores-secondary-tabs"
            aria-label={`Filter ${activePrimaryLabel} games`}
          >
            {activeSecondaryFilters.map((filter) => (
              <button
                type="button"
                key={filter.id}
                className={
                  selectedSecondaryFilter === filter.id
                    ? "scores-secondary-tab active"
                    : "scores-secondary-tab"
                }
                onClick={() => setSelectedSecondaryFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="scores-summary-bar">
        <div className="scores-summary-item scores-summary-live">
          <Radio size={16} />

          <div>
            <strong>{scoreTotals.live}</strong>
            <span>Live</span>
          </div>
        </div>

        <div className="scores-summary-item">
          <Clock3 size={16} />

          <div>
            <strong>{scoreTotals.upcoming}</strong>
            <span>Upcoming</span>
          </div>
        </div>

        <div className="scores-summary-item">
          <Trophy size={16} />

          <div>
            <strong>{scoreTotals.final}</strong>
            <span>Final</span>
          </div>
        </div>

        <div className="scores-summary-item">
          <Activity size={16} />

          <div>
            <strong>
              {selectedPrimaryFilter === "featured"
                ? "9"
                : visibleTierGames.length}
            </strong>

            <span>Shown</span>
          </div>
        </div>
      </section>

      {selectedPrimaryFilter === "featured" ? (
        <section className="scores-featured-view">
          <div className="scores-featured-intro">
            <span>Curated scoreboard</span>
            <h2>Featured Matchups</h2>

            <p>
              Three notable games from each tier, selected from live
              action, ranked matchups, close projections, and major
              weekly storylines.
            </p>
          </div>

          {featuredGroups.map((group) => (
            <FeaturedTierSection
              key={group.tierClass}
              tierClass={group.tierClass}
              tier={group.tier}
              games={group.games}
              onViewAll={viewAllTierGames}
            />
          ))}
        </section>
      ) : (
        <section
          className={`scores-tier-view scores-tier-view-${selectedPrimaryFilter}`}
        >
          <div className="scores-section-heading scores-tier-view-heading">
            <div>
              <span>{visibleTierGames.length} matchups shown</span>

              <h2>{activeSecondaryLabel || activePrimaryLabel}</h2>
            </div>

            <TierBadge
              tier={activePrimaryLabel}
              tierClass={selectedPrimaryFilter}
            />
          </div>

          {visibleTierGames.length > 0 ? (
            <div className="scores-grid">
              {visibleTierGames.map((game) => (
                <ScoreCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <div className="scores-empty-state">
              <Activity size={28} />

              <h3>No matchups found</h3>

              <p>
                No games currently match this tier and conference
                filter.
              </p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default Scores;