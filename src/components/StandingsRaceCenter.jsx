import {
    ArrowDown,
    ArrowUp,
    ChevronRight,
    ShieldAlert,
    Trophy,
  } from "lucide-react";
  
  import "../styles/standingsRaceCenter.css";
  
  const raceCards = [
    {
      id: "nfl-playoffs",
      tier: "NFL",
      tierClass: "nfl",
      eyebrow: "Playoff Picture",
      title: "NFL Championship Race",
      description:
        "The current leaders, playoff line, and teams under relegation pressure.",
      icon: Trophy,
      leaders: [
        {
          rank: 1,
          team: "Bulldogs",
          record: "5–0",
          note: "No. 1 Seed",
          status: "safe",
        },
        {
          rank: 2,
          team: "Lions",
          record: "4–1",
          note: "Playoff Position",
          status: "safe",
        },
        {
          rank: 28,
          team: "Ravens",
          record: "2–3",
          note: "NFL Hot Seat",
          status: "warning",
        },
        {
          rank: 29,
          team: "Bears",
          record: "1–4",
          note: "Relegation Zone",
          status: "danger",
        },
      ],
      footerLabel: "View NFL Playoff Picture",
    },
    {
      id: "fbs-race",
      tier: "FBS",
      tierClass: "fbs",
      eyebrow: "Promotion & Hot Seats",
      title: "FBS Pressure Index",
      description:
        "Four promotion places are available while eight programs face relegation.",
      icon: ShieldAlert,
      leaders: [
        {
          rank: 1,
          team: "Tigers",
          record: "5–0",
          note: "Promotion Position",
          status: "promotion",
        },
        {
          rank: 4,
          team: "Longhorns",
          record: "4–1",
          note: "Final Promotion Spot",
          status: "promotion",
        },
        {
          rank: 5,
          team: "Broncos",
          record: "4–1",
          note: "First Team Out",
          status: "chasing",
        },
        {
          rank: 91,
          team: "Blue Devils",
          record: "1–4",
          note: "Relegation Zone",
          status: "danger",
        },
      ],
      footerLabel: "View FBS Promotion Race",
    },
    {
      id: "fcs-race",
      tier: "FCS",
      tierClass: "fcs",
      eyebrow: "Promotion Watch",
      title: "FCS Race to the Top",
      description:
        "The top eight programs earn promotion into the FBS tier.",
      icon: ArrowUp,
      leaders: [
        {
          rank: 1,
          team: "Wildcats",
          record: "5–0",
          note: "Promotion Position",
          status: "promotion",
        },
        {
          rank: 7,
          team: "Lumberjacks",
          record: "4–1",
          note: "Promotion Position",
          status: "promotion",
        },
        {
          rank: 8,
          team: "Dukes",
          record: "3–2",
          note: "Final Promotion Spot",
          status: "promotion",
        },
        {
          rank: 9,
          team: "Rams",
          record: "3–2",
          note: "First Team Out",
          status: "chasing",
        },
      ],
      footerLabel: "View FCS Promotion Race",
    },
  ];
  
  function RacePositionRow({ position }) {
    return (
      <div className={`race-position-row race-position-${position.status}`}>
        <div className="race-position-rank">
          <strong>{position.rank}</strong>
  
          {position.status === "promotion" ||
          position.status === "safe" ? (
            <ArrowUp size={12} />
          ) : position.status === "danger" ? (
            <ArrowDown size={12} />
          ) : null}
        </div>
  
        <div className="race-position-team">
          <strong>{position.team}</strong>
          <span>{position.note}</span>
        </div>
  
        <strong className="race-position-record">
          {position.record}
        </strong>
      </div>
    );
  }
  
  function RaceCard({ card, onSelectTier }) {
    const CardIcon = card.icon;
  
    return (
      <article
        className={`standings-race-card standings-race-card-${card.tierClass}`}
      >
        <div className="standings-race-card-header">
          <div
            className={`standings-race-icon standings-race-icon-${card.tierClass}`}
          >
            <CardIcon size={21} />
          </div>
  
          <span
            className={`standings-race-tier standings-race-tier-${card.tierClass}`}
          >
            {card.tier}
          </span>
        </div>
  
        <span className="standings-race-eyebrow">
          {card.eyebrow}
        </span>
  
        <h3>{card.title}</h3>
        <p>{card.description}</p>
  
        <div className="race-position-list">
          {card.leaders.map((position) => (
            <RacePositionRow
              key={`${card.id}-${position.rank}`}
              position={position}
            />
          ))}
        </div>
  
        <button
          type="button"
          className={`standings-race-button standings-race-button-${card.tierClass}`}
          onClick={() => onSelectTier(card.tierClass)}
        >
          {card.footerLabel}
          <ChevronRight size={15} />
        </button>
      </article>
    );
  }
  
  function StandingsRaceCenter({ onSelectTier }) {
    return (
      <section className="standings-race-center">
        <div className="standings-race-center-heading">
          <span>Playoffs, promotion and relegation</span>
          <h2>The Race</h2>
  
          <p>
            A quick look at the most important position battles across
            all three MESH tiers.
          </p>
        </div>
  
        <div className="standings-race-grid">
          {raceCards.map((card) => (
            <RaceCard
              key={card.id}
              card={card}
              onSelectTier={onSelectTier}
            />
          ))}
        </div>
      </section>
    );
  }
  
  export default StandingsRaceCenter;