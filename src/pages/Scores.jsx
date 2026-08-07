import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Radio,
  Sparkles,
  Trophy,
} from "lucide-react";

import PageHeader from "../components/PageHeader";
import {
  getAppSettings,
  getGameResults,
} from "../services/googleSheets";
import meshShield from "../assets/logos/mfl-shield.png";

import "../styles/scores.css";

const MAX_WEEK = 17;
const NFL_DOUBLE_MATCHUP_WEEKS = new Set([3, 6, 9, 12]);

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
    { id: "top-25", label: "Top 25" },
    { id: "all", label: "All FBS" },
    { id: "acc", label: "ACC" },
    { id: "big-ten", label: "Big Ten" },
    { id: "big-12", label: "Big 12" },
    { id: "mac", label: "MAC" },
    { id: "mountain-west", label: "Mountain West" },
    { id: "sec", label: "SEC" },
    { id: "sun-belt", label: "Sun Belt" },
  ],
  fcs: [
    { id: "top-25", label: "Top 25" },
    { id: "all", label: "All FCS" },
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
  if (liveWeek >= 1 && liveWeek <= MAX_WEEK) return liveWeek;

  const scheduledWeek = games.find(
    (game) => game.status === "upcoming",
  )?.week;
  if (scheduledWeek >= 1 && scheduledWeek <= MAX_WEEK) {
    return scheduledWeek;
  }

  const latestWeek = Math.max(
    ...games.map((game) => game.week).filter((week) => week <= MAX_WEEK),
    1,
  );

  return latestWeek;
}

function formatTierEventLabel(appSettings, tier, week) {
  if (!appSettings || !tier || tier === "FEATURED") {
    return "MESH Week";
  }

  const event = appSettings.tierEvents?.find(
    (item) => item.tier === tier && item.week === week,
  );

  if (!event) {
    return "Schedule";
  }

  const phase = String(event.phase || "").trim();
  const eventLabel = String(event.eventLabel || "").trim();
  const normalizedPhase = phase.toLowerCase();

  if (normalizedPhase === "regular season") {
    if (eventLabel && !/^week\s+\d+$/i.test(eventLabel)) {
      return eventLabel;
    }

    return "Regular Season";
  }

  if (normalizedPhase === "playoffs") {
    if (tier === "NFL") {
      return eventLabel ? `NFL Playoffs • ${eventLabel}` : "NFL Playoffs";
    }

    if (tier === "FCS") {
      return eventLabel ? `FCS Playoffs • ${eventLabel}` : "FCS Playoffs";
    }
  }

  return eventLabel || phase || "Schedule";
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

function formatProjection(projection) {
  if (projection === null || projection === undefined) {
    return "";
  }

  return `Proj: ${Number(projection).toFixed(1)}`;
}

function TeamRow({
  team,
  coach,
  initial,
  overallRecord,
  conferenceRecord,
  score,
  projection,
  rank,
  tier,
  tierClass,
  status,
  isWinner,
  isLoser,
}) {
  const isCollege = tier === "FBS" || tier === "FCS";

  return (
    <div
      className={[
        "score-team-row",
        isWinner ? "winner" : "",
        isLoser ? "loser" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={`score-team-logo score-team-logo-${tierClass}`}>
        {initial}
      </div>

      <div className="score-team-info">
        <strong>
          {rank > 0 && rank <= 25 ? `#${rank} ` : ""}
          {team || "TBD"}
        </strong>

        {coach ? <span className="score-team-coach">{coach}</span> : null}

        {isCollege ? (
          <span className="score-team-records">
            <span>OVR: {overallRecord || "0–0"}</span>
            <span>CONF: {conferenceRecord || "0–0"}</span>
          </span>
        ) : (
          <span className="score-team-records">
            <span>{overallRecord || "0–0"}</span>
          </span>
        )}
      </div>

      <div className="score-team-numbers">
        <strong>{formatScore(score, status)}</strong>
        {status !== "final" && projection !== null ? (
          <span>{formatProjection(projection)}</span>
        ) : null}
      </div>
    </div>
  );
}

function ScoreCard({ game, featured = false, featuredPosition = 0 }) {
  const team1Winner =
    game.status === "final" && game.winnerId === game.team1Id;
  const team2Winner =
    game.status === "final" && game.winnerId === game.team2Id;

  const hasFinalWinner =
    game.status === "final" && Boolean(game.winnerId);

  const featureLabel =
    featuredPosition === 0 ? "Game of the Week" : "Featured Matchup";

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
              <span
                className={[
                  "score-featured-label",
                  featuredPosition === 0
                    ? "score-featured-label-game-of-week"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <Sparkles size={10} />
                {featureLabel}
              </span>
            ) : null}
          </div>
        </div>

        <StatusBadge status={game.status} label={game.statusLabel} />
      </div>

      <div className="score-team-list">
        <TeamRow
          team={game.team1Team}
          coach={game.team1Coach}
          initial={game.team1Initial}
          overallRecord={game.team1OverallRecord}
          conferenceRecord={game.team1ConferenceRecord}
          score={game.team1Score}
          projection={game.team1Projection}
          rank={game.team1Top25Rank}
          tier={game.tier}
          tierClass={game.tierClass}
          status={game.status}
          isWinner={team1Winner}
          isLoser={hasFinalWinner && !team1Winner}
        />

        <TeamRow
          team={game.team2Team}
          coach={game.team2Coach}
          initial={game.team2Initial}
          overallRecord={game.team2OverallRecord}
          conferenceRecord={game.team2ConferenceRecord}
          score={game.team2Score}
          projection={game.team2Projection}
          rank={game.team2Top25Rank}
          tier={game.tier}
          tierClass={game.tierClass}
          status={game.status}
          isWinner={team2Winner}
          isLoser={hasFinalWinner && !team2Winner}
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
          {games.map((game, index) => (
            <ScoreCard
              key={game.id}
              game={game}
              featured
              featuredPosition={index}
            />
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
  const [appSettings, setAppSettings] = useState(null);
  const [scoresLoading, setScoresLoading] = useState(true);
  const [scoresError, setScoresError] = useState("");
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedPrimaryFilter, setSelectedPrimaryFilter] =
    useState("featured");
  const [selectedSecondaryFilter, setSelectedSecondaryFilter] =
    useState("all");
  const [selectedNflMatchup, setSelectedNflMatchup] = useState(1);

  useEffect(() => {
    let isMounted = true;

    async function loadScores() {
      try {
        setScoresLoading(true);
        setScoresError("");

        const [games, settings] = await Promise.all([
          getGameResults(),
          getAppSettings().catch((settingsError) => {
            console.warn("Unable to load APP_SETTINGS:", settingsError);
            return null;
          }),
        ]);

        if (isMounted) {
          setScoreData(games);
          setAppSettings(settings);

          const configuredWeek = Number(settings?.currentWeek);
          const initialWeek =
            configuredWeek >= 1 && configuredWeek <= MAX_WEEK
              ? configuredWeek
              : chooseInitialWeek(games);

          setSelectedWeek(initialWeek);
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
    () => Array.from({ length: MAX_WEEK }, (_, index) => index + 1),
    [],
  );

  const currentWeekIndex = availableWeeks.indexOf(selectedWeek);

  const selectedWeekGames = useMemo(
    () => scoreData.filter((game) => game.week === selectedWeek),
    [scoreData, selectedWeek],
  );

  const configuredCurrentWeek = Number(appSettings?.currentWeek);
  const currentWeek =
    configuredCurrentWeek >= 0 && configuredCurrentWeek <= MAX_WEEK
      ? configuredCurrentWeek
      : chooseInitialWeek(scoreData);

  const isFutureWeek = selectedWeek > currentWeek;
  const isNflDoubleMatchupWeek =
    selectedPrimaryFilter === "nfl" &&
    NFL_DOUBLE_MATCHUP_WEEKS.has(selectedWeek);

  const featuredGroups = useMemo(() => {
    return ["nfl", "fbs", "fcs"].map((tierClass) => ({
      tierClass,
      tier: tierClass.toUpperCase(),
      games: isFutureWeek
        ? []
        : selectedWeekGames
        .filter((game) => game.tierClass === tierClass)
        .sort((firstGame, secondGame) => {
          const firstFeatured = firstGame.featuredRank || 999;
          const secondFeatured = secondGame.featuredRank || 999;

          if (firstFeatured !== secondFeatured) {
            return firstFeatured - secondFeatured;
          }

          if (firstGame.bestTop25Rank !== secondGame.bestTop25Rank) {
            return firstGame.bestTop25Rank - secondGame.bestTop25Rank;
          }

          return firstGame.id.localeCompare(secondGame.id);
        })
        .slice(0, 3),
    }));
  }, [selectedWeekGames, isFutureWeek]);

  const visibleTierGames = useMemo(() => {
    if (selectedPrimaryFilter === "featured") return [];

    return selectedWeekGames
      .filter((game) => {
        if (game.tierClass !== selectedPrimaryFilter) return false;

        if (isNflDoubleMatchupWeek) {
          const category = String(game.gameCategoryId || "");
          const isConferenceGame = category === "conference";
          const isNonConferenceGame = category === "non-conference";

          if (selectedNflMatchup === 1 && !isConferenceGame) {
            return false;
          }

          if (selectedNflMatchup === 2 && !isNonConferenceGame) {
            return false;
          }
        }

        if (selectedSecondaryFilter === "all") return true;
        if (selectedSecondaryFilter === "top-25") return game.top25;
        return conferenceMatches(game, selectedSecondaryFilter);
      })
      .sort((firstGame, secondGame) => {
        if (selectedSecondaryFilter === "top-25") {
          if (firstGame.bestTop25Rank !== secondGame.bestTop25Rank) {
            return firstGame.bestTop25Rank - secondGame.bestTop25Rank;
          }
        }

        return firstGame.id.localeCompare(secondGame.id);
      });
  }, [
    selectedWeekGames,
    selectedPrimaryFilter,
    selectedSecondaryFilter,
    selectedNflMatchup,
    isNflDoubleMatchupWeek,
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
    if (selectedPrimaryFilter === "featured") {
      return "MESH Week";
    }

    return formatTierEventLabel(
      appSettings,
      selectedPrimaryFilter.toUpperCase(),
      selectedWeek,
    );
  }, [appSettings, selectedPrimaryFilter, selectedWeek]);

  const goToPreviousWeek = () => {
    if (currentWeekIndex > 0) {
      setSelectedWeek(availableWeeks[currentWeekIndex - 1]);
      setSelectedNflMatchup(1);
    }
  };

  const goToNextWeek = () => {
    if (
      currentWeekIndex >= 0 &&
      currentWeekIndex < availableWeeks.length - 1
    ) {
      setSelectedWeek(availableWeeks[currentWeekIndex + 1]);
      setSelectedNflMatchup(1);
    }
  };

  const selectPrimaryFilter = (filterId) => {
    setSelectedPrimaryFilter(filterId);
    setSelectedNflMatchup(1);

    if (filterId === "fbs" || filterId === "fcs") {
      setSelectedSecondaryFilter("top-25");
    } else {
      setSelectedSecondaryFilter("all");
    }
  };

  const viewAllTierGames = (tierClass) => {
    setSelectedPrimaryFilter(tierClass);
    setSelectedSecondaryFilter("all");
    setSelectedNflMatchup(1);

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
            disabled={currentWeekIndex >= availableWeeks.length - 1}
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
            <div className="scores-secondary-heading-copy">
              <span>Filter {activePrimaryLabel}</span>
              <strong>{activeSecondaryLabel}</strong>
            </div>

            {isNflDoubleMatchupWeek ? (
              <div
                className="scores-nfl-matchup-switch"
                aria-label="Choose NFL matchup set"
              >
                <button
                  type="button"
                  className={
                    selectedNflMatchup === 1
                      ? "scores-nfl-matchup-button active"
                      : "scores-nfl-matchup-button"
                  }
                  onClick={() => setSelectedNflMatchup(1)}
                >
                  Matchup 1
                </button>

                <button
                  type="button"
                  className={
                    selectedNflMatchup === 2
                      ? "scores-nfl-matchup-button active"
                      : "scores-nfl-matchup-button"
                  }
                  onClick={() => setSelectedNflMatchup(2)}
                >
                  Matchup 2
                </button>
              </div>
            ) : null}
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
              Three games from each tier, led by the MESH Game of the Week.
            </p>
          </div>

          {isFutureWeek ? (
            <div className="scores-empty-state">
              <Sparkles size={28} />
              <h3>Featured matchups not selected yet</h3>
              <p>
                Games of the Week and Featured Matchups are selected during
                the current game week.
              </p>
            </div>
          ) : (
            featuredGroups.map((group) => (
              <FeaturedTierSection
                key={group.tierClass}
                tierClass={group.tierClass}
                tier={group.tier}
                games={group.games}
                onViewAll={viewAllTierGames}
              />
            ))
          )}
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
