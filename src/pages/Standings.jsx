import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  CircleMinus,
  Flame,
  Medal,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";

import PageHeader from "../components/PageHeader";
import meshShield from "../assets/logos/mfl-shield.png";

import "../styles/standings.css";

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
    { id: "overall", label: "Overall" },
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
    { id: "overall", label: "Overall" },
    { id: "top-25", label: "Top 25" },
    { id: "big-sky", label: "Big Sky" },
    { id: "coastal", label: "Coastal" },
    { id: "ivy", label: "Ivy" },
    { id: "missouri-valley", label: "Missouri Valley" },
    { id: "northeast", label: "Northeast" },
    { id: "southland", label: "Southland" },
  ],
};

const standingsData = [
  {
    id: "nfl-1",
    tier: "NFL",
    tierClass: "nfl",
    conferenceId: "afc",
    conference: "AFC",
    rank: 1,
    team: "Bulldogs",
    coach: "Coach Daniels",
    record: "5–0",
    wins: 5,
    losses: 0,
    pointsFor: 768.4,
    pointsAgainst: 641.2,
    streak: "W5",
    movement: 1,
    status: "playoff",
    statusLabel: "No. 1 Seed",
  },
  {
    id: "nfl-2",
    tier: "NFL",
    tierClass: "nfl",
    conferenceId: "nfc",
    conference: "NFC",
    rank: 2,
    team: "Lions",
    coach: "Coach Morris",
    record: "4–1",
    wins: 4,
    losses: 1,
    pointsFor: 742.1,
    pointsAgainst: 689.8,
    streak: "W3",
    movement: 2,
    status: "playoff",
    statusLabel: "Playoff Position",
  },
  {
    id: "nfl-3",
    tier: "NFL",
    tierClass: "nfl",
    conferenceId: "afc",
    conference: "AFC",
    rank: 3,
    team: "Panthers",
    coach: "Coach Carter",
    record: "4–1",
    wins: 4,
    losses: 1,
    pointsFor: 721.6,
    pointsAgainst: 693.5,
    streak: "W2",
    movement: 0,
    status: "playoff",
    statusLabel: "Playoff Position",
  },
  {
    id: "nfl-4",
    tier: "NFL",
    tierClass: "nfl",
    conferenceId: "nfc",
    conference: "NFC",
    rank: 4,
    team: "Raiders",
    coach: "Coach Walker",
    record: "3–2",
    wins: 3,
    losses: 2,
    pointsFor: 704.7,
    pointsAgainst: 698.2,
    streak: "L1",
    movement: -1,
    status: "neutral",
    statusLabel: "In the Hunt",
  },
  {
    id: "nfl-27",
    tier: "NFL",
    tierClass: "nfl",
    conferenceId: "afc",
    conference: "AFC",
    rank: 27,
    team: "Wolves",
    coach: "Coach Smith",
    record: "2–3",
    wins: 2,
    losses: 3,
    pointsFor: 654.2,
    pointsAgainst: 702.9,
    streak: "L2",
    movement: 1,
    status: "neutral",
    statusLabel: "Above the Line",
  },
  {
    id: "nfl-28",
    tier: "NFL",
    tierClass: "nfl",
    conferenceId: "nfc",
    conference: "NFC",
    rank: 28,
    team: "Ravens",
    coach: "Coach Hill",
    record: "2–3",
    wins: 2,
    losses: 3,
    pointsFor: 647.8,
    pointsAgainst: 711.4,
    streak: "L1",
    movement: -2,
    status: "warning",
    statusLabel: "Hot Seat",
  },
  {
    id: "nfl-29",
    tier: "NFL",
    tierClass: "nfl",
    conferenceId: "afc",
    conference: "AFC",
    rank: 29,
    team: "Bears",
    coach: "Coach Young",
    record: "1–4",
    wins: 1,
    losses: 4,
    pointsFor: 618.4,
    pointsAgainst: 735.6,
    streak: "L3",
    movement: -1,
    status: "relegation",
    statusLabel: "Relegation Zone",
  },
  {
    id: "nfl-30",
    tier: "NFL",
    tierClass: "nfl",
    conferenceId: "nfc",
    conference: "NFC",
    rank: 30,
    team: "Jets",
    coach: "Coach Green",
    record: "1–4",
    wins: 1,
    losses: 4,
    pointsFor: 606.9,
    pointsAgainst: 748.3,
    streak: "L4",
    movement: -3,
    status: "relegation",
    statusLabel: "Relegation Zone",
  },

  {
    id: "fbs-1",
    tier: "FBS",
    tierClass: "fbs",
    conferenceId: "sec",
    conference: "SEC",
    rank: 1,
    team: "Tigers",
    coach: "Coach Franklin",
    record: "5–0",
    wins: 5,
    losses: 0,
    pointsFor: 781.3,
    pointsAgainst: 632.4,
    streak: "W5",
    movement: 2,
    top25: true,
    status: "promotion",
    statusLabel: "Promotion Position",
  },
  {
    id: "fbs-2",
    tier: "FBS",
    tierClass: "fbs",
    conferenceId: "big-ten",
    conference: "Big Ten",
    rank: 2,
    team: "Eagles",
    coach: "Coach Morris",
    record: "5–0",
    wins: 5,
    losses: 0,
    pointsFor: 768.7,
    pointsAgainst: 648.9,
    streak: "W5",
    movement: 1,
    top25: true,
    status: "promotion",
    statusLabel: "Promotion Position",
  },
  {
    id: "fbs-3",
    tier: "FBS",
    tierClass: "fbs",
    conferenceId: "acc",
    conference: "ACC",
    rank: 3,
    team: "Hurricanes",
    coach: "Coach James",
    record: "4–1",
    wins: 4,
    losses: 1,
    pointsFor: 754.1,
    pointsAgainst: 671.5,
    streak: "W3",
    movement: -1,
    top25: true,
    status: "promotion",
    statusLabel: "Promotion Position",
  },
  {
    id: "fbs-4",
    tier: "FBS",
    tierClass: "fbs",
    conferenceId: "big-12",
    conference: "Big 12",
    rank: 4,
    team: "Longhorns",
    coach: "Coach Brown",
    record: "4–1",
    wins: 4,
    losses: 1,
    pointsFor: 746.8,
    pointsAgainst: 682.2,
    streak: "W2",
    movement: 3,
    top25: true,
    status: "promotion",
    statusLabel: "Promotion Position",
  },
  {
    id: "fbs-5",
    tier: "FBS",
    tierClass: "fbs",
    conferenceId: "mountain-west",
    conference: "Mountain West",
    rank: 5,
    team: "Broncos",
    coach: "Coach Miller",
    record: "4–1",
    wins: 4,
    losses: 1,
    pointsFor: 739.5,
    pointsAgainst: 681.6,
    streak: "W4",
    movement: 4,
    top25: true,
    status: "chasing",
    statusLabel: "First Team Out",
  },
  {
    id: "fbs-6",
    tier: "FBS",
    tierClass: "fbs",
    conferenceId: "sun-belt",
    conference: "Sun Belt",
    rank: 6,
    team: "Mountaineers",
    coach: "Coach Lee",
    record: "4–1",
    wins: 4,
    losses: 1,
    pointsFor: 724.2,
    pointsAgainst: 690.1,
    streak: "L1",
    movement: -2,
    top25: true,
    status: "neutral",
    statusLabel: "In the Hunt",
  },
  {
    id: "fbs-89",
    tier: "FBS",
    tierClass: "fbs",
    conferenceId: "mac",
    conference: "MAC",
    rank: 89,
    team: "RedHawks",
    coach: "Coach Reed",
    record: "2–3",
    wins: 2,
    losses: 3,
    pointsFor: 641.8,
    pointsAgainst: 704.3,
    streak: "L2",
    movement: 1,
    top25: false,
    status: "neutral",
    statusLabel: "Above the Line",
  },
  {
    id: "fbs-90",
    tier: "FBS",
    tierClass: "fbs",
    conferenceId: "sec",
    conference: "SEC",
    rank: 90,
    team: "Falcons",
    coach: "Coach Allen",
    record: "2–3",
    wins: 2,
    losses: 3,
    pointsFor: 635.4,
    pointsAgainst: 711.8,
    streak: "L1",
    movement: -3,
    top25: false,
    status: "warning",
    statusLabel: "Hot Seat",
  },
  {
    id: "fbs-91",
    tier: "FBS",
    tierClass: "fbs",
    conferenceId: "acc",
    conference: "ACC",
    rank: 91,
    team: "Blue Devils",
    coach: "Coach West",
    record: "1–4",
    wins: 1,
    losses: 4,
    pointsFor: 612.2,
    pointsAgainst: 733.9,
    streak: "L4",
    movement: -2,
    top25: false,
    status: "relegation",
    statusLabel: "Relegation Zone",
  },
  {
    id: "fbs-92",
    tier: "FBS",
    tierClass: "fbs",
    conferenceId: "big-12",
    conference: "Big 12",
    rank: 92,
    team: "Bobcats",
    coach: "Coach Adams",
    record: "1–4",
    wins: 1,
    losses: 4,
    pointsFor: 604.7,
    pointsAgainst: 741.5,
    streak: "L3",
    movement: -1,
    top25: false,
    status: "relegation",
    statusLabel: "Relegation Zone",
  },

  {
    id: "fcs-1",
    tier: "FCS",
    tierClass: "fcs",
    conferenceId: "big-sky",
    conference: "Big Sky",
    rank: 1,
    team: "Wildcats",
    coach: "Coach Carter",
    record: "5–0",
    wins: 5,
    losses: 0,
    pointsFor: 761.6,
    pointsAgainst: 628.9,
    streak: "W5",
    movement: 3,
    top25: true,
    status: "promotion",
    statusLabel: "Promotion Position",
  },
  {
    id: "fcs-2",
    tier: "FCS",
    tierClass: "fcs",
    conferenceId: "missouri-valley",
    conference: "Missouri Valley",
    rank: 2,
    team: "Bison",
    coach: "Coach Harris",
    record: "5–0",
    wins: 5,
    losses: 0,
    pointsFor: 748.3,
    pointsAgainst: 645.2,
    streak: "W5",
    movement: 1,
    top25: true,
    status: "promotion",
    statusLabel: "Promotion Position",
  },
  {
    id: "fcs-3",
    tier: "FCS",
    tierClass: "fcs",
    conferenceId: "ivy",
    conference: "Ivy",
    rank: 3,
    team: "Crimson",
    coach: "Coach Taylor",
    record: "4–1",
    wins: 4,
    losses: 1,
    pointsFor: 732.5,
    pointsAgainst: 662.8,
    streak: "W3",
    movement: -1,
    top25: true,
    status: "promotion",
    statusLabel: "Promotion Position",
  },
  {
    id: "fcs-4",
    tier: "FCS",
    tierClass: "fcs",
    conferenceId: "coastal",
    conference: "Coastal",
    rank: 4,
    team: "Seahawks",
    coach: "Coach Lewis",
    record: "4–1",
    wins: 4,
    losses: 1,
    pointsFor: 721.9,
    pointsAgainst: 669.4,
    streak: "W2",
    movement: 2,
    top25: true,
    status: "promotion",
    statusLabel: "Promotion Position",
  },
  {
    id: "fcs-7",
    tier: "FCS",
    tierClass: "fcs",
    conferenceId: "southland",
    conference: "Southland",
    rank: 7,
    team: "Lumberjacks",
    coach: "Coach King",
    record: "4–1",
    wins: 4,
    losses: 1,
    pointsFor: 701.2,
    pointsAgainst: 681.7,
    streak: "W4",
    movement: 4,
    top25: true,
    status: "promotion",
    statusLabel: "Promotion Position",
  },
  {
    id: "fcs-8",
    tier: "FCS",
    tierClass: "fcs",
    conferenceId: "northeast",
    conference: "Northeast",
    rank: 8,
    team: "Dukes",
    coach: "Coach White",
    record: "3–2",
    wins: 3,
    losses: 2,
    pointsFor: 692.6,
    pointsAgainst: 684.9,
    streak: "L1",
    movement: -2,
    top25: true,
    status: "promotion",
    statusLabel: "Promotion Position",
  },
  {
    id: "fcs-9",
    tier: "FCS",
    tierClass: "fcs",
    conferenceId: "big-sky",
    conference: "Big Sky",
    rank: 9,
    team: "Rams",
    coach: "Coach Hall",
    record: "3–2",
    wins: 3,
    losses: 2,
    pointsFor: 687.1,
    pointsAgainst: 689.8,
    streak: "W1",
    movement: 1,
    top25: true,
    status: "chasing",
    statusLabel: "First Team Out",
  },
  {
    id: "fcs-10",
    tier: "FCS",
    tierClass: "fcs",
    conferenceId: "southland",
    conference: "Southland",
    rank: 10,
    team: "Cowboys",
    coach: "Coach Martin",
    record: "3–2",
    wins: 3,
    losses: 2,
    pointsFor: 679.4,
    pointsAgainst: 693.2,
    streak: "L2",
    movement: -3,
    top25: true,
    status: "neutral",
    statusLabel: "In the Hunt",
  },
];

const pulseStories = [
  {
    id: "rise",
    eyebrow: "Biggest Rise",
    title: "Broncos",
    detail: "Up four spots to No. 5 in the FBS rankings.",
    value: "+4",
    tier: "FBS",
    tierClass: "fbs",
    icon: TrendingUp,
    type: "rise",
  },
  {
    id: "fall",
    eyebrow: "Biggest Fall",
    title: "Falcons",
    detail: "Three-place drop puts the program near relegation.",
    value: "−3",
    tier: "FBS",
    tierClass: "fbs",
    icon: TrendingDown,
    type: "fall",
  },
  {
    id: "streak",
    eyebrow: "Longest Streak",
    title: "Bulldogs",
    detail: "Five straight wins and the current NFL No. 1 seed.",
    value: "W5",
    tier: "NFL",
    tierClass: "nfl",
    icon: Flame,
    type: "streak",
  },
  {
    id: "race",
    eyebrow: "Closest Race",
    title: "FCS Promotion",
    detail: "Only 14.5 points separate positions seven through nine.",
    value: "14.5",
    tier: "FCS",
    tierClass: "fcs",
    icon: Trophy,
    type: "race",
  },
];

function TierBadge({ tier, tierClass }) {
  return (
    <span
      className={`standings-tier-badge standings-tier-badge-${tierClass}`}
    >
      {tier}
    </span>
  );
}

function MovementIndicator({ movement }) {
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

function StandingsRow({ team }) {
  return (
    <article
      className={`standings-row standings-row-${team.status} standings-row-${team.tierClass}`}
    >
      <div className="standings-rank">
        <strong>{team.rank}</strong>
        <MovementIndicator movement={team.movement} />
      </div>

      <div
        className={`standings-team-logo standings-team-logo-${team.tierClass}`}
      >
        {team.team.charAt(0)}
      </div>

      <div className="standings-team-info">
        <div className="standings-team-heading">
          <strong>{team.team}</strong>

          <span>{team.conference}</span>
        </div>

        <span className="standings-coach">{team.coach}</span>

        <span
          className={`standings-status standings-status-${team.status}`}
        >
          {team.statusLabel}
        </span>
      </div>

      <div className="standings-record">
        <strong>{team.record}</strong>
        <span>{team.streak}</span>
      </div>

      <div className="standings-points">
        <span>
          <small>PF</small>
          {team.pointsFor.toFixed(1)}
        </span>

        <span>
          <small>PA</small>
          {team.pointsAgainst.toFixed(1)}
        </span>
      </div>

      <button
        type="button"
        className="standings-row-action"
        aria-label={`View ${team.team}`}
      >
        <ChevronRight size={17} />
      </button>
    </article>
  );
}

function StandingsLine({ type, label }) {
  const LineIcon = type === "promotion" ? ArrowUp : ShieldAlert;

  return (
    <div className={`standings-line standings-line-${type}`}>
      <span>
        <LineIcon size={13} />
        {label}
      </span>
    </div>
  );
}

function StandingsList({ teams, tierClass }) {
  const promotionCutoff =
    tierClass === "fbs" ? 4 : tierClass === "fcs" ? 8 : null;

  const relegationStart =
    tierClass === "nfl" ? 29 : tierClass === "fbs" ? 91 : null;

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
          {promotionCutoff &&
          index > 0 &&
          teams[index - 1].rank <= promotionCutoff &&
          team.rank > promotionCutoff ? (
            <StandingsLine
              type="promotion"
              label="Promotion Line"
            />
          ) : null}

          {relegationStart &&
          index > 0 &&
          teams[index - 1].rank < relegationStart &&
          team.rank >= relegationStart ? (
            <StandingsLine
              type="relegation"
              label="Relegation Line"
            />
          ) : null}

          <StandingsRow team={team} />
        </div>
      ))}
    </div>
  );
}

function PulseCard({ story }) {
  const StoryIcon = story.icon;

  return (
    <article
      className={`standings-pulse-card standings-pulse-${story.type}`}
    >
      <div className="standings-pulse-top">
        <div className="standings-pulse-icon">
          <StoryIcon size={20} />
        </div>

        <TierBadge
          tier={story.tier}
          tierClass={story.tierClass}
        />
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

function TierSnapshot({ tierClass, title, teams, onViewTier }) {
  return (
    <section
      className={`standings-snapshot standings-snapshot-${tierClass}`}
    >
      <div className="standings-section-heading">
        <div>
          <span>Current race</span>
          <h2>{title}</h2>
        </div>

        <TierBadge tier={title} tierClass={tierClass} />
      </div>

      <StandingsList teams={teams} tierClass={tierClass} />

      <button
        type="button"
        className={`standings-view-button standings-view-button-${tierClass}`}
        onClick={() => onViewTier(tierClass)}
      >
        View Full {title} Standings
        <ChevronRight size={16} />
      </button>
    </section>
  );
}

function Standings() {
  const [selectedPrimaryFilter, setSelectedPrimaryFilter] =
    useState("featured");

  const [selectedSecondaryFilter, setSelectedSecondaryFilter] =
    useState("overall");

  const featuredSnapshots = useMemo(
    () => ({
      nfl: standingsData.filter(
        (team) =>
          team.tierClass === "nfl" &&
          [1, 2, 28, 29].includes(team.rank),
      ),
      fbs: standingsData.filter(
        (team) =>
          team.tierClass === "fbs" &&
          [1, 4, 5, 91].includes(team.rank),
      ),
      fcs: standingsData.filter(
        (team) =>
          team.tierClass === "fcs" &&
          [1, 7, 8, 9].includes(team.rank),
      ),
    }),
    [],
  );

  const activeSecondaryFilters =
    secondaryFilters[selectedPrimaryFilter] ?? [];

  const activePrimaryLabel =
    primaryFilters.find(
      (filter) => filter.id === selectedPrimaryFilter,
    )?.label ?? "Featured";

  const activeSecondaryLabel =
    activeSecondaryFilters.find(
      (filter) => filter.id === selectedSecondaryFilter,
    )?.label ?? "Overall";

  const visibleStandings = useMemo(() => {
    if (selectedPrimaryFilter === "featured") {
      return [];
    }

    return standingsData
      .filter((team) => {
        if (team.tierClass !== selectedPrimaryFilter) {
          return false;
        }

        if (
          selectedSecondaryFilter === "all" ||
          selectedSecondaryFilter === "overall"
        ) {
          return true;
        }

        if (selectedSecondaryFilter === "top-25") {
          return Boolean(team.top25);
        }

        return team.conferenceId === selectedSecondaryFilter;
      })
      .sort((firstTeam, secondTeam) => firstTeam.rank - secondTeam.rank);
  }, [selectedPrimaryFilter, selectedSecondaryFilter]);

  const selectPrimaryFilter = (filterId) => {
    setSelectedPrimaryFilter(filterId);

    if (filterId === "nfl") {
      setSelectedSecondaryFilter("all");
    } else {
      setSelectedSecondaryFilter("overall");
    }
  };

  const viewTier = (tierClass) => {
    selectPrimaryFilter(tierClass);

    window.requestAnimationFrame(() => {
      document
        .querySelector(".standings-controls")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    });
  };

  return (
    <main className="standings-page">
      <PageHeader
        eyebrow="The race for MESH"
        title="Standings"
        description="Track playoff races, overall rankings, promotions, relegation pressure, streaks, and weekly movement."
        imageSrc={meshShield}
        imageAlt="MESH Football shield"
        accent="standings"
        size="compact"
      />

      <section className="standings-controls">
        <button type="button" className="standings-version-selector">
          <div>
            <span>Current Standings</span>
            <strong>Week 5</strong>
          </div>

          <ChevronDown size={18} />
        </button>

        <div
          className="standings-primary-tabs"
          aria-label="Choose standings view"
        >
          {primaryFilters.map((filter) => (
            <button
              type="button"
              key={filter.id}
              className={[
                "standings-primary-tab",
                `standings-primary-tab-${filter.id}`,
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
          className={`standings-secondary-filter standings-secondary-filter-${selectedPrimaryFilter}`}
        >
          <div className="standings-secondary-heading">
            <span>Filter {activePrimaryLabel}</span>
            <strong>{activeSecondaryLabel}</strong>
          </div>

          <div className="standings-secondary-tabs">
            {activeSecondaryFilters.map((filter) => (
              <button
                type="button"
                key={filter.id}
                className={
                  selectedSecondaryFilter === filter.id
                    ? "standings-secondary-tab active"
                    : "standings-secondary-tab"
                }
                onClick={() =>
                  setSelectedSecondaryFilter(filter.id)
                }
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {selectedPrimaryFilter === "featured" ? (
        <>
          <section className="standings-featured-section">
            <div className="standings-featured-heading">
              <div>
                <span>
                  <Sparkles size={13} />
                  Weekly movement
                </span>

                <h2>MESH Pulse</h2>

                <p>
                  The biggest stories shaping the current standings,
                  promotion races, and relegation pressure.
                </p>
              </div>
            </div>

            <div className="standings-pulse-grid">
              {pulseStories.map((story) => (
                <PulseCard key={story.id} story={story} />
              ))}
            </div>
          </section>

          <TierSnapshot
            tierClass="nfl"
            title="NFL"
            teams={featuredSnapshots.nfl}
            onViewTier={viewTier}
          />

          <TierSnapshot
            tierClass="fbs"
            title="FBS"
            teams={featuredSnapshots.fbs}
            onViewTier={viewTier}
          />

          <TierSnapshot
            tierClass="fcs"
            title="FCS"
            teams={featuredSnapshots.fcs}
            onViewTier={viewTier}
          />
        </>
      ) : (
        <section
          className={`standings-tier-view standings-tier-view-${selectedPrimaryFilter}`}
        >
          <div className="standings-section-heading">
            <div>
              <span>{visibleStandings.length} teams shown</span>
              <h2>{activeSecondaryLabel}</h2>
            </div>

            <TierBadge
              tier={activePrimaryLabel}
              tierClass={selectedPrimaryFilter}
            />
          </div>

          {visibleStandings.length > 0 ? (
            <StandingsList
              teams={visibleStandings}
              tierClass={selectedPrimaryFilter}
            />
          ) : (
            <div className="standings-empty-state">
              <Medal size={30} />

              <h3>No standings found</h3>

              <p>
                No teams currently match this tier and conference
                filter.
              </p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default Standings;