import { useEffect, useMemo, useState } from "react";
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
import { getGameResults } from "../services/googleSheets";
import meshShield from "../assets/logos/mfl-shield.png";

import "../styles/scores.css";

const primaryFilters = [
  { id: "featured", label: "Featured" },
  { id: "nfl", label: "NFL" },
  { id: "fbs", label: "FBS" },
  { id: "fcs", label: "FCS" },
];

const secondaryFilters = {
  nfl: [
    { id: "all", label: "All NFL" },
    { id: "afc", label: "AFC" },
    { id: "nfc", label: "NFC" },
  ],
  fbs: [
    { id: "all", label: "All FBS" },
    { id: "top-25", label: "Top 25" },
    { id: "acc", label: "ACC" },
    { id: "big-ten", label: "Big Ten" },
    { id: "big-12", label: "Big 12" },
    { id: "mac", label: "MAC" },
    { id: "mountain-west", label: "Mountain West" },
    { id: "sec", label: "SEC" },
    { id: "sun-belt", label: "Sun Belt" },
  ],
  fcs: [
    { id: "all", label: "All FCS" },
    { id: "top-25", label: "Top 25" },
    { id: "big-sky", label: "Big Sky" },
    { id: "coastal", label: "Coastal" },
    { id: "ivy", label: "Ivy" },
    { id: "missouri-valley", label: "Missouri Valley" },
    { id: "northeast", label: "Northeast" },
    { id: "southland", label: "Southland" },
  ],
};

function conferenceMatches(game, filterId) {
  const aliases = {
    coastal: ["coastal", "caa", "coastal-athletic-association"],
    "missouri-valley": ["missouri-valley", "mvc"],
    northeast: ["northeast", "nec"],
    southland: ["southland", "slc"],
  };

  const acceptedIds = aliases[filterId] ?? [filterId];
  return game.conferenceIds.some((id) => acceptedIds.includes(id));
}

function chooseInitialWeek(games) {
  const liveWeek = games.find((game) => game.status === "live")?.week;
  if (liveWeek) return liveWeek;

  const scheduledWeek = games.find(
    (game) => game.status === "upcoming",
  )?.week;
  if (scheduledWeek) return scheduledWeek;

  return Math.max(...games.map((game) => game.week), 1);
}

function statusPriority(status) {
  if (status === "live") return 0;
  if (status === "final") return 1;
  return 2;
}

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

function formatScore(score, status) {
  if (score === null || score === undefined) {
    return status === "upcoming" ? "—" : "0.0";
  }

  return Number(score).toFixed(1);
}

function TeamRow({
  team,
  initial,
  record,
  score,
  rank,
  tierClass,
  status,
  isWinner,
}) {
  return (
    <div className={`score-team-row${isWinner ? " winner" : ""}`}>
      <div className={`score-team-logo score-team-logo-${tierClass}`}>
        {initial}
      </div>

      <div className="score-team-info">
        <strong>
          {rank > 0 && rank <= 25 ? `#${rank} ` : ""}
          {team || "TBD"}
        </strong>
        <span>{record || "0–0"}</span>
      </div>

      <div className="score-team-numbers">
        <strong>{formatScore(score, status)}</strong>
        <span>{status === "upcoming" ? "SCHEDULED" : "SCORE"}</span>
      </div>
    </div>
  );
}

function ScoreCard({ game, featured = false }) {
  const team1Winner =
    game.status === "final" && game.winnerId === game.team1Id;
  const team2Winner =
    game.status === "final" && game.winnerId === game.team2Id;

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
            <span className="score-league-name">{game.label}</span>

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
        <span>
          Week {game.week}
          {game.gameNumber > 1 ? ` • Game ${game.gameNumber}` : ""}
        </span>
      </div>

      <div className="score-team-list">
        <TeamRow
          team={game.team1Team}
          initial={game.team1Initial}
          record={game.team1Record}
          score={game.team1Score}
          rank={game.team1Top25Rank}
          tierClass={game.tierClass}
          status={game.status}
          isWinner={team1Winner}
        />

        <TeamRow
          team={game.team2Team}
          initial={game.team2Initial}
          record={game.team2Record}
          score={game.team2Score}
          rank={game.team2Top25Rank}
          tierClass={game.tierClass}
          status={game.status}
          isWinner={team2Winner}
        />
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

      {games.length > 0 ? (
        <div className="scores-grid">
          {games.map((game) => (
            <ScoreCard key={game.id} game={game} featured />
          ))}
        </div>
      ) : (
        <div className="scores-empty-state">
          <Activity size={28} />
          <h3>No matchups found</h3>
          <p>No {tier} games are scheduled for this week.</p>
        </div>
      )}

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
  const [scoreData, setScoreData] = useState([]);
  const [scoresLoading, setScoresLoading] = useState(true);
  const [scoresError, setScoresError] = useState("");
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedPrimaryFilter, setSelectedPrimaryFilter] =
    useState("featured");
  const [selectedSecondaryFilter, setSelectedSecondaryFilter] =
    useState("all");

  useEffect(() => {
    let isMounted = true;

    async function loadScores() {
      try {
        setScoresLoading(true);
        setScoresError("");

        const games = await getGameResults();

        if (isMounted) {
          setScoreData(games);
          setSelectedWeek(chooseInitialWeek(games));
        }
      } catch (error) {
        console.error("Unable to load scores:", error);

        if (isMounted) {
          setScoresError(
            "Scores could not be loaded from Google Sheets.",
          );
        }
      } finally {
        if (isMounted) {
          setScoresLoading(false);
        }
      }
    }

    loadScores();

    return () => {
      isMounted = false;
    };
  }, []);

  const availableWeeks = useMemo(
    () =>
      [...new Set(scoreData.map((game) => game.week))]
        .filter((week) => week > 0)
        .sort((a, b) => a - b),
    [scoreData],
  );

  const currentWeekIndex = availableWeeks.indexOf(selectedWeek);

  const selectedWeekGames = useMemo(
    () => scoreData.filter((game) => game.week === selectedWeek),
    [scoreData, selectedWeek],
  );

  const scoreTotals = useMemo(() => {
    const live = selectedWeekGames.filter(
      (game) => game.status === "live",
    ).length;
    const upcoming = selectedWeekGames.filter(
      (game) => game.status === "upcoming",
    ).length;
    const final = selectedWeekGames.filter(
      (game) => game.status === "final",
    ).length;

    return { live, upcoming, final };
  }, [selectedWeekGames]);

  const featuredGroups = useMemo(() => {
    return ["nfl", "fbs", "fcs"].map((tierClass) => ({
      tierClass,
      tier: tierClass.toUpperCase(),
      games: selectedWeekGames
        .filter((game) => game.tierClass === tierClass)
        .sort((firstGame, secondGame) => {
          const statusDifference =
            statusPriority(firstGame.status) -
            statusPriority(secondGame.status);

          if (statusDifference !== 0) return statusDifference;
          if (firstGame.top25 !== secondGame.top25) {
            return firstGame.top25 ? -1 : 1;
          }

          return firstGame.id.localeCompare(secondGame.id);
        })
        .slice(0, 3),
    }));
  }, [selectedWeekGames]);

  const visibleTierGames = useMemo(() => {
    if (selectedPrimaryFilter === "featured") return [];

    return selectedWeekGames
      .filter((game) => {
        if (game.tierClass !== selectedPrimaryFilter) return false;
        if (selectedSecondaryFilter === "all") return true;
        if (selectedSecondaryFilter === "top-25") return game.top25;
        return conferenceMatches(game, selectedSecondaryFilter);
      })
      .sort((firstGame, secondGame) => {
        const statusDifference =
          statusPriority(firstGame.status) -
          statusPriority(secondGame.status);

        if (statusDifference !== 0) return statusDifference;
        return firstGame.id.localeCompare(secondGame.id);
      });
  }, [
    selectedWeekGames,
    selectedPrimaryFilter,
    selectedSecondaryFilter,
  ]);

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

  const phaseLabel = useMemo(() => {
    const types = new Set(
      selectedWeekGames.map((game) => game.gameType).filter(Boolean),
    );

    if (types.size === 1) return [...types][0];
    if (types.has("Regular Season")) return "Regular Season";
    return "Postseason";
  }, [selectedWeekGames]);

  const goToPreviousWeek = () => {
    if (currentWeekIndex > 0) {
      setSelectedWeek(availableWeeks[currentWeekIndex - 1]);
    }
  };

  const goToNextWeek = () => {
    if (
      currentWeekIndex >= 0 &&
      currentWeekIndex < availableWeeks.length - 1
    ) {
      setSelectedWeek(availableWeeks[currentWeekIndex + 1]);
    }
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

  const shownCount =
    selectedPrimaryFilter === "featured"
      ? featuredGroups.reduce(
          (total, group) => total + group.games.length,
          0,
        )
      : visibleTierGames.length;

  return (
    <main className="scores-page">
      <PageHeader
        eyebrow="Live Game Center"
        title="Scores"
        description="Follow every MESH matchup by tier, conference, ranking, and week."
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
            disabled={currentWeekIndex <= 0}
            aria-label="Previous week"
          >
            <ChevronLeft size={19} />
          </button>

          <div>
            <span>{phaseLabel}</span>
            <strong>Week {selectedWeek}</strong>
          </div>

          <button
            type="button"
            onClick={goToNextWeek}
            disabled={
              currentWeekIndex === -1 ||
              currentWeekIndex >= availableWeeks.length - 1
            }
            aria-label="Next week"
          >
            <ChevronRight size={19} />
          </button>
        </div>

        <div className="scores-primary-tabs" aria-label="Choose scores view">
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
            <span>Scheduled</span>
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
            <strong>{shownCount}</strong>
            <span>Shown</span>
          </div>
        </div>
      </section>

      {scoresLoading ? (
        <div className="scores-empty-state">
          <Activity size={28} />
          <h3>Loading scores</h3>
          <p>Retrieving the latest MESH schedule and scores.</p>
        </div>
      ) : scoresError ? (
        <div className="scores-empty-state">
          <Activity size={28} />
          <h3>Scores unavailable</h3>
          <p>{scoresError}</p>
        </div>
      ) : selectedPrimaryFilter === "featured" ? (
        <section className="scores-featured-view">
          <div className="scores-featured-intro">
            <span>Weekly scoreboard</span>
            <h2>Featured Matchups</h2>
            <p>
              Three games from each tier, prioritizing live action and
              Top 25 matchups.
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
              <p>No games match this week, tier, and conference filter.</p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default Scores;
