import {
  ArrowUp,
  BookOpen,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  Circle,
  ClipboardList,
  Flame,
  History,
  Medal,
  Star,
  Trophy,
  Users,
} from "lucide-react";

import "../styles/home.css";

const gamesOfTheWeek = [
  {
    tier: "NFL",
    tierClass: "nfl",
    status: "live",
    statusLabel: "Live matchup",
    awayTeam: "Bulldogs",
    awayInitial: "B",
    awayRecord: "3–1",
    awayScore: "142.3",
    homeTeam: "Lions",
    homeInitial: "L",
    homeRecord: "2–2",
    homeScore: "139.8",
    centerLabel: "Live",
    winProbability: 72,
  },
  {
    tier: "FBS",
    tierClass: "fbs",
    status: "preview",
    statusLabel: "Game preview",
    awayTeam: "Tigers",
    awayInitial: "T",
    awayRecord: "4–0",
    awayScore: "136.4",
    homeTeam: "Eagles",
    homeInitial: "E",
    homeRecord: "3–1",
    homeScore: "134.9",
    centerLabel: "Sun 1:00 PM",
    winProbability: 54,
  },
  {
    tier: "FCS",
    tierClass: "fcs",
    status: "preview",
    statusLabel: "Game preview",
    awayTeam: "Wildcats",
    awayInitial: "W",
    awayRecord: "4–0",
    awayScore: "131.7",
    homeTeam: "Rams",
    homeInitial: "R",
    homeRecord: "3–1",
    homeScore: "130.2",
    centerLabel: "Sun 4:25 PM",
    winProbability: 51,
  },
];

const headlines = [
  {
    category: "NFL",
    tierClass: "nfl",
    title: "Bulldogs survive a late push in the NFL Game of the Week",
    summary:
      "The featured matchup remains separated by fewer than three fantasy points entering the final games.",
    time: "12 minutes ago",
  },
  {
    category: "FBS",
    tierClass: "fbs",
    title: "Four unbeaten programs remain in the race for promotion",
    summary:
      "The top of the FBS rankings continues to tighten as the league enters a pivotal week.",
    time: "1 hour ago",
  },
  {
    category: "FCS",
    tierClass: "fcs",
    title: "Wildcats climb into an FBS promotion position",
    summary:
      "A fourth consecutive victory has pushed the Wildcats above the promotion line.",
    time: "3 hours ago",
  },
];

const pressureCards = [
  {
    id: "nfl-hot-seats",
    tier: "NFL",
    tierClass: "nfl",
    cardType: "hot-seat",
    eyebrow: "Relegation pressure",
    title: "NFL Hot Seats",
    description: "Bottom 4 move to the FBS Tier",
    lineLabel: "Relegation line",
    icon: Flame,
    teams: [
      {
        rank: 27,
        name: "Panthers",
        record: "2–3",
        detail: "+18.4",
        status: "Safe",
        position: "safe",
        heat: 1,
      },
      {
        rank: 28,
        name: "Raiders",
        record: "2–3",
        detail: "+6.2",
        status: "Warm",
        position: "safe",
        heat: 2,
      },
      {
        rank: 29,
        name: "Bears",
        record: "1–4",
        detail: "−6.2",
        status: "Hot",
        position: "danger",
        heat: 4,
      },
      {
        rank: 30,
        name: "Jets",
        record: "1–4",
        detail: "−14.7",
        status: "Critical",
        position: "danger",
        heat: 5,
      },
    ],
  },
  {
    id: "fbs-promotion",
    tier: "FBS",
    tierClass: "fbs",
    cardType: "promotion",
    eyebrow: "Moving toward the NFL",
    title: "FBS Promotion Watch",
    description: "Top 4 move to the NFL Tier",
    lineLabel: "Promotion line",
    icon: ArrowUp,
    teams: [
      {
        rank: 3,
        name: "Tigers",
        record: "4–1",
        detail: "+21.8",
        status: "Moving Up",
        position: "promotion",
      },
      {
        rank: 4,
        name: "Eagles",
        record: "4–1",
        detail: "+8.1",
        status: "Moving Up",
        position: "promotion",
      },
      {
        rank: 5,
        name: "Hurricanes",
        record: "3–2",
        detail: "−8.1",
        status: "Chasing",
        position: "chasing",
      },
      {
        rank: 6,
        name: "Longhorns",
        record: "3–2",
        detail: "−13.5",
        status: "Chasing",
        position: "chasing",
      },
    ],
  },
  {
    id: "fbs-hot-seats",
    tier: "FBS",
    tierClass: "fbs",
    cardType: "hot-seat",
    eyebrow: "Relegation pressure",
    title: "FBS Hot Seats",
    description: "Bottom 8 move to the FCS Tier",
    lineLabel: "Relegation line",
    icon: Flame,
    teams: [
      {
        rank: 89,
        name: "Falcons",
        record: "2–3",
        detail: "+11.3",
        status: "Safe",
        position: "safe",
        heat: 1,
      },
      {
        rank: 90,
        name: "Bobcats",
        record: "2–3",
        detail: "+3.9",
        status: "Warm",
        position: "safe",
        heat: 2,
      },
      {
        rank: 91,
        name: "Spartans",
        record: "1–4",
        detail: "−3.9",
        status: "Hot",
        position: "danger",
        heat: 4,
      },
      {
        rank: 92,
        name: "Owls",
        record: "1–4",
        detail: "−9.6",
        status: "Critical",
        position: "danger",
        heat: 5,
      },
    ],
  },
  {
    id: "fcs-promotion",
    tier: "FCS",
    tierClass: "fcs",
    cardType: "promotion",
    eyebrow: "Moving toward the FBS",
    title: "FCS Promotion Watch",
    description: "Top 8 move to the FBS Tier",
    lineLabel: "Promotion line",
    icon: ArrowUp,
    teams: [
      {
        rank: 7,
        name: "Wildcats",
        record: "4–1",
        detail: "+12.7",
        status: "Moving Up",
        position: "promotion",
      },
      {
        rank: 8,
        name: "Rams",
        record: "4–1",
        detail: "+4.3",
        status: "Moving Up",
        position: "promotion",
      },
      {
        rank: 9,
        name: "Bison",
        record: "3–2",
        detail: "−4.3",
        status: "Chasing",
        position: "chasing",
      },
      {
        rank: 10,
        name: "Hornets",
        record: "3–2",
        detail: "−10.8",
        status: "Chasing",
        position: "chasing",
      },
    ],
  },
];

const weeklyHighScorers = [
  {
    tier: "NFL",
    tierClass: "nfl",
    team: "Bulldogs",
    coach: "Coach Daniels",
    score: "184.7",
    result: "Defeated Lions",
  },
  {
    tier: "FBS",
    tierClass: "fbs",
    team: "Tigers",
    coach: "Coach Morris",
    score: "176.3",
    result: "Defeated Hurricanes",
  },
  {
    tier: "FCS",
    tierClass: "fcs",
    team: "Wildcats",
    coach: "Coach Carter",
    score: "169.8",
    result: "Defeated Bison",
  },
];

const prestigeRisers = [
  {
    rank: 1,
    team: "Wildcats",
    tier: "FCS",
    tierClass: "fcs",
    change: "+18",
    reason: "Four-game winning streak",
  },
  {
    rank: 2,
    team: "Tigers",
    tier: "FBS",
    tierClass: "fbs",
    change: "+14",
    reason: "Unbeaten start",
  },
  {
    rank: 3,
    team: "Bulldogs",
    tier: "NFL",
    tierClass: "nfl",
    change: "+11",
    reason: "Top-three scoring offense",
  },
];

const topPerformers = [
  {
    position: "QB",
    player: "J. Allen",
    team: "Bulldogs",
    points: "38.6",
  },
  {
    position: "RB",
    player: "B. Robinson",
    team: "Tigers",
    points: "31.4",
  },
  {
    position: "WR",
    player: "J. Jefferson",
    team: "Wildcats",
    points: "29.8",
  },
  {
    position: "TE",
    player: "T. McBride",
    team: "Eagles",
    points: "23.1",
  },
  {
    position: "DEF",
    player: "Baltimore",
    team: "Rams",
    points: "18.0",
  },
];

const quickLinks = [
  {
    title: "Coach Carousel",
    description: "Track coaching changes across MESH",
    icon: Users,
  },
  {
    title: "Prestige",
    description: "View program prestige and movement",
    icon: Star,
  },
  {
    title: "History",
    description: "Champions, records and past seasons",
    icon: History,
  },
  {
    title: "League Rules",
    description: "Competition format and league policies",
    icon: BookOpen,
  },
  {
    title: "Draft HQ",
    description: "Draft order, picks and preparation",
    icon: ClipboardList,
  },
];

function TierBadge({ tier, tierClass }) {
  return (
    <span className={`home-tier-badge home-tier-badge-${tierClass}`}>
      {tier}
    </span>
  );
}

function SectionHeading({ eyebrow, title, action }) {
  return (
    <div className="home-section-heading">
      <div>
        <div className="home-section-eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
      </div>

      {action ? (
        <button type="button" className="home-text-button">
          {action}
        </button>
      ) : null}
    </div>
  );
}

function GameOfTheWeekCard({ game }) {
  const isLive = game.status === "live";

  return (
    <article className={`home-card game-card game-card-${game.tierClass}`}>
      <div className="game-card-top">
        {isLive ? (
          <span className="game-live-badge">
            <Circle size={8} fill="currentColor" />
            {game.statusLabel}
          </span>
        ) : (
          <span className="game-preview-badge">{game.statusLabel}</span>
        )}

        <TierBadge tier={game.tier} tierClass={game.tierClass} />
      </div>

      <h3 className="game-card-title">{game.tier} Game of the Week</h3>

      <div className="game-matchup">
        <div className="game-team">
          <div
            className={`game-team-logo game-team-logo-${game.tierClass}`}
          >
            {game.awayInitial}
          </div>

          <strong>{game.awayTeam}</strong>
          <span>{game.awayRecord}</span>
        </div>

        <div className="game-score">
          <div className="game-score-line">
            <strong>{game.awayScore}</strong>
            <span>{isLive ? "vs" : "proj"}</span>
            <strong>{game.homeScore}</strong>
          </div>

          <span className={isLive ? "game-status-live" : "game-status-time"}>
            {isLive ? "● Live" : game.centerLabel}
          </span>
        </div>

        <div className="game-team">
          <div
            className={`game-team-logo game-team-logo-${game.tierClass}`}
          >
            {game.homeInitial}
          </div>

          <strong>{game.homeTeam}</strong>
          <span>{game.homeRecord}</span>
        </div>
      </div>

      <div className="game-probability">
        <div className="game-probability-title">Win probability</div>

        <div className="game-probability-labels">
          <strong>{game.winProbability}%</strong>
          <strong>{100 - game.winProbability}%</strong>
        </div>

        <div className="game-probability-track">
          <div
            className={`game-probability-fill game-probability-fill-${game.tierClass}`}
            style={{ width: `${game.winProbability}%` }}
          />
        </div>
      </div>
    </article>
  );
}

function HeadlineCard({ headline }) {
  return (
    <article className="home-card headline-card">
      <div
        className={`headline-accent headline-accent-${headline.tierClass}`}
      />

      <div className="headline-body">
        <div className="headline-meta">
          <TierBadge
            tier={headline.category}
            tierClass={headline.tierClass}
          />

          <span>{headline.time}</span>
        </div>

        <h3>{headline.title}</h3>
        <p>{headline.summary}</p>
      </div>
    </article>
  );
}

function HeatMeter({ level }) {
  return (
    <div className="pressure-heat-meter" aria-label={`${level} of 5 heat`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Flame
          key={value}
          size={14}
          fill={value <= level ? "currentColor" : "none"}
          className={
            value <= level ? "pressure-heat-active" : "pressure-heat-inactive"
          }
        />
      ))}
    </div>
  );
}

function PressureCard({ card }) {
  const CardIcon = card.icon;
  const isHotSeat = card.cardType === "hot-seat";

  return (
    <article
      className={`home-card pressure-list-card pressure-list-card-${card.cardType}`}
    >
      <div className="pressure-list-heading">
        <div
          className={`pressure-list-icon pressure-list-icon-${card.cardType}`}
        >
          <CardIcon size={20} />
        </div>

        <div className="pressure-list-heading-copy">
          <div className="pressure-list-meta">
            <TierBadge tier={card.tier} tierClass={card.tierClass} />
            <span>{card.eyebrow}</span>
          </div>

          <h3>{card.title}</h3>
          <p>{card.description}</p>
        </div>
      </div>

      <div className="pressure-list-columns">
        <span>Rank</span>
        <span>Team</span>
        <span>Record</span>
        <span>{isHotSeat ? "Pressure" : "Status"}</span>
      </div>

      <div className="pressure-list-rows">
        {card.teams.map((team, index) => (
          <div key={`${card.id}-${team.name}`}>
            {index === 2 ? (
              <div
                className={`pressure-line pressure-line-${card.cardType}`}
              >
                <span>{card.lineLabel}</span>
              </div>
            ) : null}

            <div
              className={`pressure-team-row pressure-team-row-${team.position}`}
            >
              <span className="pressure-team-rank">{team.rank}</span>

              <div className="pressure-team-name">
                <strong>{team.name}</strong>
                <small>{team.detail} from line</small>
              </div>

              <span className="pressure-team-record">{team.record}</span>

              {isHotSeat ? (
                <div className="pressure-team-status pressure-team-status-hot">
                  <span>{team.status}</span>
                  <HeatMeter level={team.heat} />
                </div>
              ) : (
                <span
                  className={`pressure-team-status-label pressure-team-status-${team.position}`}
                >
                  {team.status}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function WeeklyHighScorerCard() {
  return (
    <article className="home-card pressure-summary-card">
      <div className="pressure-summary-heading">
        <div className="pressure-summary-icon pressure-summary-icon-score">
          <Trophy size={20} />
        </div>

        <div>
          <span>Previous week leaders</span>
          <h3>Weekly High Scorer</h3>
        </div>
      </div>

      <div className="weekly-scorer-list">
        {weeklyHighScorers.map((team, index) => (
          <div className="weekly-scorer-row" key={team.tier}>
            <div className="weekly-scorer-rank">
              <Medal size={16} />
              <span>{index + 1}</span>
            </div>

            <div className="weekly-scorer-info">
              <div>
                <strong>{team.team}</strong>
                <TierBadge tier={team.tier} tierClass={team.tierClass} />
              </div>

              <span>{team.coach}</span>
              <small>{team.result}</small>
            </div>

            <div className="weekly-scorer-points">
              <strong>{team.score}</strong>
              <span>PTS</span>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function PrestigeRisersCard() {
  return (
    <article className="home-card pressure-summary-card">
      <div className="pressure-summary-heading">
        <div className="pressure-summary-icon pressure-summary-icon-prestige">
          <Star size={20} />
        </div>

        <div>
          <span>Programs trending up</span>
          <h3>Prestige Risers</h3>
        </div>
      </div>

      <div className="prestige-list">
        {prestigeRisers.map((team) => (
          <div className="prestige-row" key={team.team}>
            <span className="pressure-summary-rank">{team.rank}</span>

            <div className="prestige-info">
              <div>
                <strong>{team.team}</strong>
                <TierBadge tier={team.tier} tierClass={team.tierClass} />
              </div>

              <span>{team.reason}</span>
            </div>

            <strong className="prestige-change">{team.change}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function Home() {
  return (
    <div className="home-page">
      <section className="home-week-toolbar">
        <button type="button" className="home-week-selector">
          <span>Week 5</span>
          <span className="home-week-divider">•</span>
          <span>Regular Season</span>
          <ChevronDown size={16} />
        </button>
      </section>

      <section className="home-section">
        <SectionHeading
          eyebrow="This week in MESH"
          title="Games of the Week"
          action="All scores"
        />

        <div className="games-grid">
          {gamesOfTheWeek.map((game) => (
            <GameOfTheWeekCard key={game.tier} game={game} />
          ))}
        </div>
      </section>

      <section className="home-section">
        <SectionHeading
          eyebrow="Around the league"
          title="MESH Headlines"
          action="View all"
        />

        <div className="headlines-grid">
          {headlines.map((headline) => (
            <HeadlineCard key={headline.title} headline={headline} />
          ))}
        </div>
      </section>

      <section className="home-section">
        <SectionHeading
          eyebrow="Movement, jobs & momentum"
          title="The Pressure Index"
          action="Full rankings"
        />

        <div className="pressure-cards-grid">
          {pressureCards.map((card) => (
            <PressureCard key={card.id} card={card} />
          ))}
        </div>

        <div className="pressure-summary-grid">
          <WeeklyHighScorerCard />
          <PrestigeRisersCard />
        </div>
      </section>

      <section className="home-section">
        <SectionHeading
          eyebrow="Week 5 leaders"
          title="Top Performers"
          action="All stats"
        />

        <div className="performers-grid">
          {topPerformers.map((performer) => (
            <article
              className="home-card performer-card"
              key={performer.position}
            >
              <div className="performer-position">{performer.position}</div>

              <div className="performer-info">
                <strong>{performer.player}</strong>
                <span>{performer.team}</span>
              </div>

              <div className="performer-points">
                <strong>{performer.points}</strong>
                <span>PTS</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section">
        <SectionHeading eyebrow="Explore MESH" title="Quick Links" />

        <div className="quick-links-grid">
          {quickLinks.map((link) => {
            const LinkIcon = link.icon;

            return (
              <button
                type="button"
                className="home-card quick-link-card"
                key={link.title}
              >
                <span className="quick-link-icon">
                  <LinkIcon size={21} />
                </span>

                <span className="quick-link-copy">
                  <strong>{link.title}</strong>
                  <small>{link.description}</small>
                </span>

                <ChartNoAxesColumnIncreasing
                  size={17}
                  className="quick-link-arrow"
                />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default Home;