import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  CircleMinus,
  Flame,
  Medal,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";

import PageHeader from "../components/PageHeader";
import StandingsRaceCenter from "../components/StandingsRaceCenter";
import { getStandingsData } from "../services/googleSheets";
import meshShield from "../assets/logos/mfl-shield.png";

import "../styles/standings.css";

const primaryFilters = [
  { id: "overview", label: "Overview" },
  { id: "nfl", label: "NFL" },
  { id: "fbs", label: "FBS" },
  { id: "fcs", label: "FCS" },
];

const secondaryFilters = {
  nfl: [
    { id: "all", label: "All NFL" },
    { id: "playoff-picture", label: "Playoff Picture" },
    { id: "afc", label: "AFC" },
    { id: "nfc", label: "NFC" },
  ],
  fbs: [
    { id: "top-25", label: "Top 25" },
    { id: "overall", label: "Overall" },
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
    { id: "overall", label: "Overall" },
    { id: "big-sky", label: "Big Sky" },
    { id: "coastal", label: "Coastal" },
    { id: "ivy", label: "Ivy" },
    { id: "mvc", label: "Missouri Valley" },
    { id: "northeast", label: "Northeast" },
    { id: "southland", label: "Southland" },
  ],
};

const nflDivisionFilters = {
  afc: [
    { id: "all", label: "All AFC" },
    { id: "east", label: "East" },
    { id: "north", label: "North" },
    { id: "south", label: "South" },
    { id: "west", label: "West" },
  ],
  nfc: [
    { id: "all", label: "All NFC" },
    { id: "east", label: "East" },
    { id: "north", label: "North" },
    { id: "south", label: "South" },
    { id: "west", label: "West" },
  ],
};

const pulseStories = [
  {
    id: "rise",
    eyebrow: "Biggest Rise",
    title: "Rankings",
    detail: "Weekly movement will update from the live MESH standings.",
    value: "Live",
    tier: "FBS",
    tierClass: "fbs",
    icon: TrendingUp,
    type: "rise",
  },
  {
    id: "fall",
    eyebrow: "Biggest Fall",
    title: "Hot Seats",
    detail: "Programs under pressure will appear as rankings update.",
    value: "Live",
    tier: "FBS",
    tierClass: "fbs",
    icon: TrendingDown,
    type: "fall",
  },
  {
    id: "leaders",
    eyebrow: "League Leaders",
    title: "Playoff Race",
    detail: "Current playoff positions update from TEAM DATA.",
    value: "Live",
    tier: "NFL",
    tierClass: "nfl",
    icon: Flame,
    type: "streak",
  },
  {
    id: "race",
    eyebrow: "Closest Race",
    title: "Promotion Race",
    detail: "Follow every promotion and relegation race across MESH.",
    value: "Live",
    tier: "FCS",
    tierClass: "fcs",
    icon: Trophy,
    type: "race",
  },
];

function normalizeSlug(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function conferenceMatches(team, filterId) {
  const conferenceId = normalizeSlug(team.conferenceId || team.conference);
  const aliases = {
    coastal: ["coastal", "caa", "coastal-athletic-association"],
    mvc: ["mvc", "missouri-valley", "missouri-valley-conference"],
    ivy: ["ivy", "ivy-league"],
    northeast: ["northeast", "nec"],
    southland: ["southland", "slc"],
  };

  return aliases[filterId]
    ? aliases[filterId].includes(conferenceId)
    : conferenceId === filterId;
}

function divisionMatches(team, divisionFilter) {
  const divisionId = normalizeSlug(team.divisionId || team.division);
  return divisionId === divisionFilter || divisionId.endsWith(`-${divisionFilter}`);
}

function formatPoints(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(1) : "0.0";
}

function TierBadge({ tier, tierClass }) {
  return (
    <span className={`standings-tier-badge standings-tier-badge-${tierClass}`}>
      {tier}
    </span>
  );
}

function MovementIndicator({ movement, isNew = false }) {
  if (isNew) {
    return (
      <span className="standings-movement standings-movement-new">
        NEW
      </span>
    );
  }

  if (movement > 0) {
    return (
      <span className="standings-movement standings-movement-up">
        <ArrowUp size={13} />
        {movement}
      </span>
    );
  }

  if (movement < 0) {
    return (
      <span className="standings-movement standings-movement-down">
        <ArrowDown size={13} />
        {Math.abs(movement)}
      </span>
    );
  }

  return (
    <span className="standings-movement standings-movement-even">
      <CircleMinus size={13} />
    </span>
  );
}

function StandingsRow({ team, isTop25View = false }) {
  const teamName = team.team || "Unnamed Franchise";
  const hasRank = Number(team.rank) > 0 && Number(team.rank) < 999;
  const movement = isTop25View ? team.top25Movement : team.movement;
  const isNew = isTop25View ? team.isNewTop25 : false;

  const teamStyle = {};

  if (team.primaryColor) {
    teamStyle["--team-primary"] = team.primaryColor;
  }

  if (team.secondaryColor) {
    teamStyle["--team-secondary"] = team.secondaryColor;
  }

  const shortRecordLabel = (label) => {
    if (label === "Overall") return "OVR";
    if (label === "Conference") return "CONF";
    return label === "Record" ? "RECORD" : String(label || "").toUpperCase();
  };

  return (
    <article
      className={[
        "standings-row",
        `standings-row-${team.status}`,
        `standings-row-${team.tierClass}`,
        team.logo ? "standings-row-branded" : "",
        isTop25View ? "standings-row-top25" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={teamStyle}
    >
      <div className="standings-rank">
        <strong>{hasRank ? team.rank : "—"}</strong>
        <MovementIndicator movement={movement} isNew={isNew} />
      </div>

      <div
        className={`standings-team-logo standings-team-logo-${team.tierClass}`}
        title={teamName}
      >
        {team.logo ? (
          <img
            src={team.logo}
            alt={`${teamName} logo`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span>{teamName.charAt(0).toUpperCase()}</span>
        )}
      </div>

      <div className="standings-team-info">
        <strong className="standings-team-name">{teamName}</strong>
        <span className="standings-coach">
          {team.coach || "Coach unavailable"}
        </span>

        <div className="standings-inline-records">
          {team.recordLines.map((line) => (
            <span key={`${team.id}-${line.label}`}>
              <small>{shortRecordLabel(line.label)}</small>
              <strong>{line.value || "0–0"}</strong>
            </span>
          ))}
        </div>
      </div>

      <span className="standings-conference-badge">
        {team.conference || team.tier}
      </span>

      <button
        type="button"
        className="standings-row-action"
        aria-label={`View ${teamName}`}
      >
        <ChevronRight size={17} />
      </button>

      <div className="standings-points-status">
        {team.statusLabel ? (
          <span className={`standings-status standings-status-${team.status}`}>
            {team.statusLabel}
          </span>
        ) : (
          <span aria-hidden="true" />
        )}

        <span className="standings-pf-value">
          <small>PF</small>
          <strong>{formatPoints(team.pointsFor)}</strong>
        </span>
      </div>
    </article>
  );
}

function StandingsLine({ type, label }) {
  const LineIcon = type === "promotion" ? ArrowUp : ArrowDown;
  return (
    <div className={`standings-line standings-line-${type}`}>
      <span>
        <LineIcon size={13} />
        {label}
      </span>
    </div>
  );
}

function StandingsList({
  teams,
  tierClass,
  showTierLines = true,
  isTop25View = false,
}) {
  const relegationStart =
    tierClass === "nfl" ? 29 : tierClass === "fbs" ? 95 : null;

  return (
    <div className="standings-list">
      <div className="standings-list-columns">
        <span>Rank</span>
        <span>Team</span>
        <span>Record</span>
        <span>Points</span>
      </div>

      {teams.map((team, index) => (
        <div key={team.id}>
          {showTierLines &&
          relegationStart &&
          index > 0 &&
          teams[index - 1].rank < relegationStart &&
          team.rank >= relegationStart ? (
            <StandingsLine type="relegation" label="Relegation Line" />
          ) : null}

          <StandingsRow team={team} isTop25View={isTop25View} />
        </div>
      ))}
    </div>
  );
}

function PulseCard({ story }) {
  const StoryIcon = story.icon;
  return (
    <article className={`standings-pulse-card standings-pulse-${story.type}`}>
      <div className="standings-pulse-top">
        <div className="standings-pulse-icon"><StoryIcon size={20} /></div>
        <TierBadge tier={story.tier} tierClass={story.tierClass} />
      </div>
      <span className="standings-pulse-eyebrow">{story.eyebrow}</span>
      <div className="standings-pulse-title">
        <h3>{story.title}</h3>
        <strong>{story.value}</strong>
      </div>
      <p>{story.detail}</p>
    </article>
  );
}

function Standings() {
  const [standingsData, setStandingsData] = useState([]);
  const [standingsLoading, setStandingsLoading] = useState(true);
  const [standingsError, setStandingsError] = useState("");
  const [selectedPrimaryFilter, setSelectedPrimaryFilter] = useState("overview");
  const [selectedSecondaryFilter, setSelectedSecondaryFilter] = useState("overall");
  const [selectedNflDivisionFilter, setSelectedNflDivisionFilter] = useState("all");

  useEffect(() => {
    let isMounted = true;

    async function loadStandings() {
      try {
        setStandingsLoading(true);
        setStandingsError("");
        const data = await getStandingsData();
        if (isMounted) setStandingsData(data);
      } catch (error) {
        console.error("Unable to load standings:", error);
        if (isMounted) setStandingsError("Standings could not be loaded from Google Sheets.");
      } finally {
        if (isMounted) setStandingsLoading(false);
      }
    }

    loadStandings();
    return () => { isMounted = false; };
  }, []);

  const activeSecondaryFilters = secondaryFilters[selectedPrimaryFilter] ?? [];
  const activePrimaryLabel = primaryFilters.find((filter) => filter.id === selectedPrimaryFilter)?.label ?? "Overview";
  const activeSecondaryLabel = activeSecondaryFilters.find((filter) => filter.id === selectedSecondaryFilter)?.label ?? "Overall";
  const activeNflDivisionFilters = nflDivisionFilters[selectedSecondaryFilter] ?? [];
  const activeNflDivisionLabel = activeNflDivisionFilters.find((filter) => filter.id === selectedNflDivisionFilter)?.label ?? "";

  /*
   * Current CFP field:
   * 7 current FBS conference leaders + the next 5 highest-ranked
   * at-large teams. The field stays blank during preseason until
   * at least one FBS game has been recorded.
   */
  const cfpFranchiseIds = useMemo(() => {
    const fbsTeams = standingsData.filter((team) => team.tierClass === "fbs");

    const seasonHasStarted = fbsTeams.some(
      (team) =>
        Number(team.regularSeasonWins) > 0 ||
        Number(team.regularSeasonLosses) > 0 ||
        Number(team.regularSeasonTies) > 0,
    );

    if (!seasonHasStarted) {
      return new Set();
    }

    const conferenceLeaders = fbsTeams
      .filter((team) => Number(team.conferenceRank) === 1)
      .sort((a, b) => (a.top25Rank || 999) - (b.top25Rank || 999));

    const selectedIds = new Set(
      conferenceLeaders.map((team) => team.franchiseId),
    );

    const atLarge = fbsTeams
      .filter(
        (team) =>
          !selectedIds.has(team.franchiseId) &&
          Number(team.top25Rank) >= 1 &&
          Number(team.top25Rank) <= 25,
      )
      .sort((a, b) => a.top25Rank - b.top25Rank)
      .slice(0, 5);

    atLarge.forEach((team) => selectedIds.add(team.franchiseId));

    return selectedIds;
  }, [standingsData]);

  const visibleStandings = useMemo(() => {
    if (selectedPrimaryFilter === "overview") return [];

    return standingsData
      .filter((team) => {
        if (team.tierClass !== selectedPrimaryFilter) return false;

        if (selectedPrimaryFilter === "nfl") {
          if (selectedSecondaryFilter === "all") return true;
          if (selectedSecondaryFilter === "playoff-picture") return Number(team.playoffSeed) > 0;

          if (selectedSecondaryFilter === "afc" || selectedSecondaryFilter === "nfc") {
            if (!conferenceMatches(team, selectedSecondaryFilter)) return false;
            if (selectedNflDivisionFilter === "all") return true;
            return divisionMatches(team, selectedNflDivisionFilter);
          }

          return false;
        }

        if (selectedSecondaryFilter === "overall") return true;
        if (selectedSecondaryFilter === "top-25") {
          return Number(team.top25Rank) >= 1 && Number(team.top25Rank) <= 25;
        }

        return conferenceMatches(team, selectedSecondaryFilter);
      })
      .sort((firstTeam, secondTeam) => {
        if (selectedPrimaryFilter === "nfl" && selectedSecondaryFilter === "playoff-picture") {
          return (firstTeam.playoffSeed || 999) - (secondTeam.playoffSeed || 999);
        }

        if (
          selectedPrimaryFilter === "nfl" &&
          (selectedSecondaryFilter === "afc" || selectedSecondaryFilter === "nfc")
        ) {
          return selectedNflDivisionFilter !== "all"
            ? firstTeam.divisionRank - secondTeam.divisionRank
            : firstTeam.conferenceRank - secondTeam.conferenceRank;
        }

        if (
          selectedPrimaryFilter !== "nfl" &&
          selectedSecondaryFilter !== "overall" &&
          selectedSecondaryFilter !== "top-25"
        ) {
          return firstTeam.conferenceRank - secondTeam.conferenceRank;
        }

        if (selectedSecondaryFilter === "top-25") {
          return firstTeam.top25Rank - secondTeam.top25Rank;
        }

        return firstTeam.overallRank - secondTeam.overallRank;
      });
  }, [standingsData, selectedPrimaryFilter, selectedSecondaryFilter, selectedNflDivisionFilter]);

  const displayStandings = useMemo(() => {
    return visibleStandings.map((team) => {
      const isNflConferenceView =
        selectedPrimaryFilter === "nfl" &&
        (selectedSecondaryFilter === "afc" || selectedSecondaryFilter === "nfc");

      const isCollegeConferenceView =
        selectedPrimaryFilter !== "nfl" &&
        selectedSecondaryFilter !== "overall" &&
        selectedSecondaryFilter !== "top-25";

      const isCollegeOverallView =
        selectedPrimaryFilter !== "nfl" &&
        (selectedSecondaryFilter === "overall" || selectedSecondaryFilter === "top-25");

      const isPlayoffPicture =
        selectedPrimaryFilter === "nfl" && selectedSecondaryFilter === "playoff-picture";

      let rank = team.overallRank;
      let pointsFor = team.regularSeasonPF;
      let recordLines = [
        { label: "Record", value: team.tierStandingsRecord, primary: true },
      ];

      if (isNflConferenceView) {
        rank = selectedNflDivisionFilter !== "all" ? team.divisionRank : team.conferenceRank;
      } else if (isPlayoffPicture) {
        rank = team.playoffSeed || team.overallRank;
      } else if (isCollegeConferenceView) {
        rank = team.conferenceRank;
        pointsFor = team.regularSeasonPF;
        recordLines = [
          { label: "Conference", value: team.tierStandingsRecord, primary: true },
          { label: "Overall", value: team.overallSeasonRecord, primary: false },
        ];
      } else if (isCollegeOverallView) {
        rank = selectedSecondaryFilter === "top-25" ? team.top25Rank : team.overallRank;
        pointsFor = team.overallSeasonPF;
        recordLines = [
          { label: "Overall", value: team.overallSeasonRecord, primary: true },
          { label: "Conference", value: team.tierStandingsRecord, primary: false },
        ];
      }

      let status = team.status;
      let statusLabel = team.statusLabel;

      if (team.tierClass === "fbs") {
        if (Number(team.overallRank) >= 95 && Number(team.overallRank) <= 98) {
          status = "relegation";
          statusLabel = "Relegation Zone";
        } else if (cfpFranchiseIds.has(team.franchiseId)) {
          status = "cfp";
          statusLabel = "CFP Position";
        } else if (Number(team.regularSeasonWins) >= 6) {
          status = "bowl";
          statusLabel = "Bowl Eligible";
        } else {
          status = "neutral";
          statusLabel = "";
        }
      }

      if (team.tierClass === "fcs" && status === "promotion") {
        status = "neutral";
        statusLabel = "";
      }

      return {
        ...team,
        rank,
        pointsFor,
        recordLines,
        status,
        statusLabel,
      };
    });
  }, [
    visibleStandings,
    selectedPrimaryFilter,
    selectedSecondaryFilter,
    selectedNflDivisionFilter,
    cfpFranchiseIds,
  ]);

  const showTierLines = ["all", "overall"].includes(selectedSecondaryFilter);
  const isTop25View =
    selectedPrimaryFilter !== "nfl" &&
    selectedSecondaryFilter === "top-25";
  const isNflPlayoffPicture = selectedPrimaryFilter === "nfl" && selectedSecondaryFilter === "playoff-picture";
  const isNflConferenceView = selectedPrimaryFilter === "nfl" && ["afc", "nfc"].includes(selectedSecondaryFilter);
  const standingsHeading = isNflConferenceView ? activeNflDivisionLabel : activeSecondaryLabel;

  const selectPrimaryFilter = (filterId) => {
    setSelectedPrimaryFilter(filterId);
    setSelectedNflDivisionFilter("all");
    setSelectedSecondaryFilter(
      filterId === "nfl"
        ? "all"
        : filterId === "fbs" || filterId === "fcs"
          ? "top-25"
          : "overall",
    );
  };

  const selectSecondaryFilter = (filterId) => {
    setSelectedSecondaryFilter(filterId);
    setSelectedNflDivisionFilter("all");
  };

  const viewTier = (tierClass) => {
    selectPrimaryFilter(tierClass);
    window.requestAnimationFrame(() => {
      document.querySelector(".standings-controls")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const renderStandingsContent = () => {
    if (standingsLoading) {
      return <div className="standings-empty-state"><Medal size={30} /><h3>Loading standings</h3><p>Retrieving the latest MESH standings.</p></div>;
    }

    if (standingsError) {
      return <div className="standings-empty-state"><Medal size={30} /><h3>Standings unavailable</h3><p>{standingsError}</p></div>;
    }

    if (isNflPlayoffPicture) {
      return (
        <div className="standings-playoff-picture">
          {["afc", "nfc"].map((conferenceId) => {
            const conferenceTeams = displayStandings
              .filter((team) => conferenceMatches(team, conferenceId))
              .sort((a, b) => (a.playoffSeed || 999) - (b.playoffSeed || 999));

            return (
              <section className="standings-playoff-conference" key={conferenceId}>
                <div className="standings-section-heading">
                  <div><span>Current playoff seeds</span><h2>{conferenceId.toUpperCase()}</h2></div>
                  <TierBadge tier="NFL" tierClass="nfl" />
                </div>
                {conferenceTeams.length > 0 ? (
                  <StandingsList
                    teams={conferenceTeams}
                    tierClass="nfl"
                    showTierLines={false}
                    isTop25View={false}
                  />
                ) : (
                  <div className="standings-empty-state"><Medal size={30} /><h3>No playoff data found</h3><p>Playoff teams will appear once seeds are available in TEAM DATA.</p></div>
                )}
              </section>
            );
          })}
        </div>
      );
    }

    if (displayStandings.length > 0) {
      return (
        <StandingsList
          teams={displayStandings}
          tierClass={selectedPrimaryFilter}
          showTierLines={showTierLines}
          isTop25View={isTop25View}
        />
      );
    }

    return <div className="standings-empty-state"><Medal size={30} /><h3>No standings found</h3><p>No teams currently match this tier, conference, and division filter.</p></div>;
  };

  return (
    <main className="standings-page">
      <PageHeader
        eyebrow="The race for MESH"
        title="Standings"
        description="Track playoff races, overall rankings, promotions, relegation pressure, and weekly movement."
        imageSrc={meshShield}
        imageAlt="MESH Football shield"
        accent="standings"
        size="compact"
      />

      <section className="standings-controls">
        <button type="button" className="standings-version-selector" aria-label="Choose standings season">
          <div><span>Season</span><strong>2026 Live</strong></div>
          <ChevronDown size={18} />
        </button>

        <div className="standings-primary-tabs" aria-label="Choose standings view">
          {primaryFilters.map((filter) => (
            <button
              type="button"
              key={filter.id}
              className={["standings-primary-tab", `standings-primary-tab-${filter.id}`, selectedPrimaryFilter === filter.id ? "active" : ""].filter(Boolean).join(" ")}
              onClick={() => selectPrimaryFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {selectedPrimaryFilter !== "overview" ? (
        <section className={`standings-secondary-filter standings-secondary-filter-${selectedPrimaryFilter}`}>
          <div className="standings-secondary-heading"><span>Filter {activePrimaryLabel}</span><strong>{activeSecondaryLabel}</strong></div>
          <div className="standings-secondary-tabs" aria-label={`Filter ${activePrimaryLabel} standings`}>
            {activeSecondaryFilters.map((filter) => (
              <button
                type="button"
                key={filter.id}
                className={selectedSecondaryFilter === filter.id ? "standings-secondary-tab active" : "standings-secondary-tab"}
                onClick={() => selectSecondaryFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {isNflConferenceView ? (
        <section className="standings-secondary-filter standings-secondary-filter-nfl">
          <div className="standings-secondary-heading"><span>Filter {selectedSecondaryFilter.toUpperCase()} divisions</span><strong>{activeNflDivisionLabel}</strong></div>
          <div className="standings-secondary-tabs" aria-label={`Filter ${selectedSecondaryFilter.toUpperCase()} divisions`}>
            {activeNflDivisionFilters.map((filter) => (
              <button
                type="button"
                key={filter.id}
                className={selectedNflDivisionFilter === filter.id ? "standings-secondary-tab active" : "standings-secondary-tab"}
                onClick={() => setSelectedNflDivisionFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {selectedPrimaryFilter === "overview" ? (
        <>
          <section className="standings-featured-section">
            <div className="standings-featured-heading">
              <div>
                <span><Sparkles size={13} />Weekly movement</span>
                <h2>MESH Pulse</h2>
                <p>The biggest stories shaping the current standings, promotion races, and relegation pressure.</p>
              </div>
            </div>
            <div className="standings-pulse-grid">
              {pulseStories.map((story) => <PulseCard key={story.id} story={story} />)}
            </div>
          </section>
          <StandingsRaceCenter onSelectTier={viewTier} />
        </>
      ) : (
        <section className={`standings-tier-view standings-tier-view-${selectedPrimaryFilter}`}>
          <div className="standings-section-heading">
            <div>
              <h2>{standingsHeading}</h2>
            </div>
            <TierBadge tier={activePrimaryLabel} tierClass={selectedPrimaryFilter} />
          </div>
          {renderStandingsContent()}
        </section>
      )}
    </main>
  );
}

export default Standings;