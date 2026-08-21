import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Info,
  Repeat2,
  ShieldCheck,
  Trophy,
  UserRoundCog,
  Users,
} from "lucide-react";

import "../styles/rulesInfo.css";
import meshShield from "../assets/logos/mfl-shield.png";

const sections = [
  { id: "layout", label: "Layout", icon: Users },
  { id: "movement", label: "Movement", icon: ArrowUp },
  { id: "coaching", label: "Coaching", icon: UserRoundCog },
  { id: "trading", label: "Trading", icon: Repeat2 },
  { id: "drafts", label: "Drafts", icon: ClipboardList },
  { id: "waivers", label: "Waivers", icon: CircleDollarSign },
  { id: "schedule", label: "Schedule", icon: CalendarDays },
];

const tierData = [
  {
    tier: "NFL",
    className: "nfl",
    teams: 32,
    leagues: 2,
    leagueSize: 16,
    summary:
      "Two 16-team Sleeper leagues represent the AFC and NFC conferences.",
  },
  {
    tier: "FBS",
    className: "fbs",
    teams: 98,
    leagues: 7,
    leagueSize: 14,
    summary:
      "Seven 14-team Sleeper leagues each represent an NCAA FBS conference.",
  },
  {
    tier: "FCS",
    className: "fcs",
    teams: 72,
    leagues: 6,
    leagueSize: 12,
    summary:
      "Six 12-team Sleeper leagues each represent an NCAA FCS conference.",
  },
];

const movementData = [
  {
    tier: "NFL",
    className: "nfl",
    label: "Relegation",
    headline: "Bottom 4 coaches",
    copy:
      "The four lowest-finishing NFL coaches leave their teams behind and are relegated to coach at the FBS level the following season.",
    direction: "NFL → FBS",
    icon: ArrowDown,
  },
  {
    tier: "FBS",
    className: "fbs",
    label: "Promotion + Relegation",
    headline: "Top 4 up • Bottom 8 down",
    copy:
      "The top four FBS coaches are offered promotion to open NFL teams. The bottom eight FBS coaches are relegated to the FCS.",
    direction: "FCS ← FBS → NFL",
    icon: ArrowUp,
  },
  {
    tier: "FCS",
    className: "fcs",
    label: "Promotion",
    headline: "Top 8 coaches",
    copy:
      "The top eight FCS coaches are offered promotion to available FBS teams for the following season.",
    direction: "FCS → FBS",
    icon: ArrowUp,
  },
];

const vetoData = [
  { tier: "NFL", className: "nfl", votes: 7 },
  { tier: "FBS", className: "fbs", votes: 6 },
  { tier: "FCS", className: "fcs", votes: 5 },
];

const waiverAdjustments = {
  NFL: {
    base: 150,
    rows: [
      ["1st", "+$18"], ["2nd", "+$15"], ["3rd", "+$12"], ["4th", "+$9"],
      ["5th", "+$6"], ["6th", "+$3"], ["7th", "$0"], ["8th", "$0"],
      ["9th", "$0"], ["10th", "$0"], ["11th", "-$3"], ["12th", "-$6"],
      ["13th", "-$9"], ["14th", "-$12"], ["15th", "-$15"], ["16th", "-$18"],
    ],
  },
  FBS: {
    base: 100,
    rows: [
      ["1st", "+$12"], ["2nd", "+$10"], ["3rd", "+$8"], ["4th", "+$6"],
      ["5th", "+$4"], ["6th", "+$2"], ["7th", "$0"], ["8th", "$0"],
      ["9th", "-$2"], ["10th", "-$4"], ["11th", "-$6"], ["12th", "-$8"],
      ["13th", "-$10"], ["14th", "-$12"],
    ],
  },
  FCS: {
    base: 50,
    rows: [
      ["1st", "+$10"], ["2nd", "+$8"], ["3rd", "+$6"], ["4th", "+$4"],
      ["5th", "+$2"], ["6th", "$0"], ["7th", "$0"], ["8th", "-$2"],
      ["9th", "-$4"], ["10th", "-$6"], ["11th", "-$8"], ["12th", "-$10"],
    ],
  },
};

const schedules = {
  NFL: [
    [1, "Regular Season Matchup"],
    [2, "Regular Season Matchup"],
    [3, "Regular Season Matchup", "AFC vs NFC Matchup"],
    [4, "Regular Season Matchup"],
    [5, "Regular Season Matchup"],
    [6, "Regular Season Matchup", "AFC vs NFC Matchup"],
    [7, "Regular Season Matchup"],
    [8, "Regular Season Matchup"],
    [9, "Regular Season Matchup", "AFC vs NFC Matchup"],
    [10, "Regular Season Matchup"],
    [11, "Regular Season Matchup"],
    [12, "Regular Season Matchup", "AFC vs NFC Matchup"],
    [13, "Regular Season Matchup"],
    [14, "NFL Wild Card", "", "postseason"],
    [15, "NFL Quarter Finals", "", "postseason"],
    [16, "NFL Conference Championship", "", "postseason"],
    [17, "Super Bowl", "", "championship"],
  ],
  FBS: [
    [1, "Regular Season Matchup"],
    [2, "Regular Season Matchup", "Cross Conference • 4 conferences"],
    [3, "Regular Season Matchup"],
    [4, "Regular Season Matchup"],
    [5, "Regular Season Matchup", "Cross Conference • 4 conferences"],
    [6, "Regular Season Matchup"],
    [7, "Regular Season Matchup"],
    [8, "Regular Season Matchup", "Cross Conference • 4 conferences"],
    [9, "Regular Season Matchup"],
    [10, "Regular Season Matchup", "Cross Conference • 2 conferences"],
    [11, "Regular Season Matchup"],
    [12, "Regular Season Matchup", "Rivalry Week", "rivalry"],
    [13, "Conference Championship Week", "", "postseason"],
    [14, "Bowl Games & CFP 1st Round", "12 teams", "postseason"],
    [15, "Bowl Games & CFP Quarterfinals", "8 teams", "postseason"],
    [16, "CFP Semi Finals", "4 teams", "postseason"],
    [17, "CFP Championship", "2 teams", "championship"],
  ],
  FCS: [
    [1, "Regular Season Matchup"],
    [2, "Regular Season Matchup"],
    [3, "Regular Season Matchup", "Out of Conference Matchups"],
    [4, "Regular Season Matchup"],
    [5, "Regular Season Matchup"],
    [6, "Regular Season Matchup", "Random Matchup"],
    [7, "Regular Season Matchup"],
    [8, "Regular Season Matchup"],
    [9, "Regular Season Matchup", "Out of Conference Matchups"],
    [10, "Regular Season Matchup"],
    [11, "Regular Season Matchup"],
    [12, "Regular Season Matchup", "Rivalry Week", "rivalry"],
    [13, "FCS Playoffs 1st Round", "24 teams", "postseason"],
    [14, "FCS Playoffs 2nd Round", "16 teams", "postseason"],
    [15, "FCS Quarter Finals", "8 teams", "postseason"],
    [16, "FCS Semi Finals", "4 teams", "postseason"],
    [17, "FCS Championship", "2 teams", "championship"],
  ],
};

function SectionHeading({ icon: Icon, eyebrow, title }) {
  return (
    <div className="rules-section-heading">
      <div className="rules-section-icon">
        <Icon size={18} />
      </div>
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
    </div>
  );
}

function RulesInfo() {
  const [activeSection, setActiveSection] = useState("layout");
  const [scheduleTier, setScheduleTier] = useState("NFL");

  const jumpTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <main className="rules-page">
      <section className="rules-hero">
        <div className="rules-hero-copy">
          <p className="rules-hero-eyebrow">Official Handbook</p>
          <h1>League Rules & Info</h1>
          <div className="rules-hero-accent" />
          <p className="rules-hero-description">
            The official rules, structure, and systems that govern MESH Football
            and keep our league competitive.
          </p>
          <div className="rules-hero-season">
            <ShieldCheck size={16} />
            <span>Updated for 2026 Season</span>
          </div>
        </div>

        <div className="rules-hero-art" aria-hidden="true">
          <div className="rules-hero-playbook">
            <span className="rules-play-x x1">×</span>
            <span className="rules-play-x x2">×</span>
            <span className="rules-play-x x3">×</span>
            <span className="rules-play-o o1">○</span>
            <span className="rules-play-o o2">○</span>
            <span className="rules-play-o o3">○</span>
          </div>
          <div className="rules-hero-shield-wrap">
            <img
              src={meshShield}
              alt=""
              className="rules-hero-shield"
            />
          </div>
        </div>
      </section>

      <div className="rules-overview-label">MESH Overview</div>
      <div className="rules-overview" aria-label="MESH league overview">
        <div>
          <span>Total Teams / Owners</span>
          <strong>202</strong>
          <small>Across all three tiers</small>
        </div>
        <div>
          <span>Sleeper Leagues</span>
          <strong>15</strong>
          <small>2 NFL • 7 FBS • 6 FCS</small>
        </div>
        <div>
          <span>Competition Tiers</span>
          <strong>3</strong>
          <small>NFL • FBS • FCS</small>
        </div>
      </div>

      <nav className="rules-jump-nav" aria-label="Rules sections">
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            type="button"
            className={activeSection === id ? "active" : ""}
            onClick={() => jumpTo(id)}
            key={id}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </nav>

      <section className="rules-section" id="layout">
        <SectionHeading
          icon={Users}
          eyebrow="League Layout"
          title="Three Separate Competitive Tiers"
        />

        <div className="rules-callout">
          <Info size={17} />
          <p>
            <strong>MESH Football is made up of three tiers.</strong> The tiers
            themselves do not intermingle during competition. Coach movement
            through promotion, relegation, and the offseason carousel connects
            the larger 202-owner universe from season to season.
          </p>
        </div>

        <div className="rules-tier-grid">
          {tierData.map((item) => (
            <article
              className={`rules-tier-card rules-tier-${item.className}`}
              key={item.tier}
            >
              <div className="rules-tier-card-top">
                <span>{item.tier}</span>
                <strong>{item.teams} TEAMS</strong>
              </div>
              <p>
                {item.leagues} Sleeper leagues • {item.leagueSize} teams each
              </p>
              <p>{item.summary}</p>
            </article>
          ))}
        </div>

        <div className="rules-subcard rules-subcard-spaced">
          <h3>Teams stay in their tier — coaches can move</h3>
          <p>
            MESH teams remain part of their assigned tier and conference. A
            promotion, relegation, firing, or coaching-carousel move changes the
            coach controlling the team rather than moving the team itself.
          </p>
        </div>
      </section>

      <section className="rules-section" id="movement">
        <SectionHeading
          icon={ArrowUp}
          eyebrow="Promotion / Relegation"
          title="Coach Movement Between Tiers"
        />

        <div className="rules-subcard">
          <h3>Promotion offers</h3>
          <ul className="rules-list">
            <li>
              No coach is forced to accept a promotion. A coach may remain with
              their current team if they choose.
            </li>
            <li>
              If a qualifying coach declines promotion, the next highest-finishing
              coach in that tier is offered the opening. The process continues
              until all available teams in the tier above are filled.
            </li>
            <li>
              A coach promoted to a higher tier receives a one-year grace period
              because they are taking over a bottom-finishing team. That coach is
              exempt from relegation during the following season if they finish
              at the bottom.
            </li>
          </ul>
        </div>

        <div className="rules-callout">
          <ShieldCheck size={17} />
          <p>
            <strong>Relegation is mandatory.</strong> Coaches who finish in a
            relegation position move down a tier regardless of whether they wish
            to remain with their current team.
          </p>
        </div>

        <div className="rules-movement-grid">
          {movementData.map((item) => {
            const Icon = item.icon;
            return (
              <article
                className={`rules-movement-card rules-tier-${item.className}`}
                key={item.tier}
              >
                <span>{item.tier} • {item.label}</span>
                <strong>{item.headline}</strong>
                <p>{item.copy}</p>
                <div className="rules-move-arrow">
                  <Icon size={13} />
                  {item.direction}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rules-section" id="coaching">
        <SectionHeading
          icon={UserRoundCog}
          eyebrow="Coaching Moves"
          title="Activity, Firings & Coaching Carousel"
        />

        <div className="rules-subcard">
          <h3>Inactivity policy</h3>
          <ul className="rules-list">
            <li>Three straight weeks of inactivity will result in a firing.</li>
            <li>
              Seven total weeks of inactivity throughout the season will result
              in a firing.
            </li>
          </ul>
        </div>

        <div className="rules-subcard">
          <h3>Midseason openings</h3>
          <ul className="rules-list">
            <li>
              NFL and FBS teams whose coach is fired midseason will be managed by
              the commissioner and made available during the offseason coaching
              carousel.
            </li>
            <li>
              FCS teams whose coach is fired midseason will be filled by newcomers
              to MESH Football.
            </li>
            <li>All new owners begin in the FCS tier.</li>
          </ul>
        </div>

        <div className="rules-subcard">
          <h3>Offseason coaching carousel</h3>
          <ul className="rules-list">
            <li>
              Before the Promotion/Relegation period each offseason, coaches may
              apply for any available coaching job within their current tier.
            </li>
            <li>
              After the Coaching Carousel and Promotions/Relegations are complete,
              any remaining FCS openings are offered to newcomers.
            </li>
          </ul>
        </div>

        <div className="rules-process" aria-label="Offseason coaching order">
          <span>Coaching Carousel</span>
          <strong>→</strong>
          <span>Promotion / Relegation</span>
          <strong>→</strong>
          <span>Fill Remaining FCS Openings</span>
        </div>
      </section>

      <section className="rules-section" id="trading">
        <SectionHeading
          icon={Repeat2}
          eyebrow="Trading"
          title="Trade Review & League Voting"
        />

        <div className="rules-subcard">
          <ul className="rules-list">
            <li>Draft picks may not be traded three years out.</li>
            <li>All trades are voted on by league mates for Pass/Veto.</li>
            <li>Collusion is prohibited and will result in removal from MESH.</li>
            <li>
              Trades process automatically at midnight on the following night.
            </li>
            <li>
              Trades will not be pushed through early. Coaches should make trades
              with the processing timeline in mind.
            </li>
          </ul>
        </div>

        <div className="rules-veto-grid">
          {vetoData.map((item) => (
            <article
              className={`rules-movement-card rules-tier-${item.className}`}
              key={item.tier}
            >
              <span>{item.tier} TRADE REVIEW</span>
              <strong>{item.votes} veto votes</strong>
              <p>Votes required for a trade to be vetoed in that tier.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rules-section" id="drafts">
        <SectionHeading
          icon={ClipboardList}
          eyebrow="Rookie Drafts"
          title="Linear Drafts by Tier"
        />

        <div className="rules-draft-grid">
          <article className="rules-tier-card rules-tier-nfl">
            <div className="rules-tier-card-top">
              <span>NFL</span>
              <strong>7 ROUNDS</strong>
            </div>
            <p>Seven-round rookie draft.</p>
          </article>
          <article className="rules-tier-card rules-tier-fbs">
            <div className="rules-tier-card-top">
              <span>FBS</span>
              <strong>6 ROUNDS</strong>
            </div>
            <p>Six-round rookie draft.</p>
          </article>
          <article className="rules-tier-card rules-tier-fcs">
            <div className="rules-tier-card-top">
              <span>FCS</span>
              <strong>6 ROUNDS</strong>
            </div>
            <p>Six-round rookie draft.</p>
          </article>
        </div>

        <div className="rules-subcard rules-subcard-spaced">
          <ul className="rules-list">
            <li>
              Rookie drafts are linear and use reverse standings from the previous
              season. Last place receives the first pick in every round.
            </li>
            <li>Draft picks may not be traded three years out.</li>
          </ul>
        </div>
      </section>

      <section className="rules-section" id="waivers">
        <SectionHeading
          icon={CircleDollarSign}
          eyebrow="Waivers"
          title="Rolling Waivers & Seasonal FAAB"
        />

        <div className="rules-subcard">
          <ul className="rules-list">
            <li>Offseason waivers use rolling waivers and process nightly.</li>
            <li>
              During the season, every team begins with a tier-specific FAAB base.
            </li>
            <li>
              Teams receive a yearly FAAB reward or penalty based on the previous
              season&apos;s finish.
            </li>
            <li>
              The system represents stronger teams having a larger fan base and
              more revenue, while lower-finishing teams lose fan support and
              revenue.
            </li>
          </ul>
        </div>

        <div className="rules-faab-bases">
          <div className="rules-tier-nfl">
            <span>NFL BASE</span>
            <strong>$150</strong>
          </div>
          <div className="rules-tier-fbs">
            <span>FBS BASE</span>
            <strong>$100</strong>
          </div>
          <div className="rules-tier-fcs">
            <span>FCS BASE</span>
            <strong>$50</strong>
          </div>
        </div>

        <div className="rules-waiver-grid">
          {Object.entries(waiverAdjustments).map(([tier, data]) => (
            <div className="rules-table-card" key={tier}>
              <div className="rules-table-heading">
                <span>{tier} Yearly Adjustment</span>
                <strong>Base ${data.base}</strong>
              </div>
              <div className="rules-table-scroll">
                <table className="rules-table rules-waiver-table">
                  <thead>
                    <tr>
                      <th scope="col">Finish</th>
                      <th scope="col">FAAB Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map(([place, adjustment]) => (
                      <tr key={`${tier}-${place}`}>
                        <th scope="row">{place}</th>
                        <td className={tier.toLowerCase()}>{adjustment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rules-section" id="schedule">
        <SectionHeading
          icon={CalendarDays}
          eyebrow="Season Schedules"
          title="17-Week Tier Calendars"
        />

        <div className="rules-callout">
          <BookOpen size={17} />
          <p>
            Each tier follows its own 17-week schedule. Use the tier tabs below
            to review regular-season special events and each postseason path.
          </p>
        </div>

        <div className="rules-schedule-tabs">
          {["NFL", "FBS", "FCS"].map((tier) => (
            <button
              type="button"
              key={tier}
              className={[
                "rules-schedule-tab",
                `rules-schedule-tab-${tier.toLowerCase()}`,
                scheduleTier === tier ? "active" : "",
              ].join(" ")}
              onClick={() => setScheduleTier(tier)}
            >
              {tier}
            </button>
          ))}
        </div>

        <div className="rules-schedule-card">
          <div className="rules-schedule-card-heading">
            <div>
              <span>{scheduleTier} Tier</span>
              <strong>Season Schedule</strong>
            </div>
            <CalendarDays size={18} />
          </div>

          {schedules[scheduleTier].map(
            ([week, event, detail = "", type = ""]) => (
              <div
                className={[
                  "rules-schedule-row",
                  type,
                ].filter(Boolean).join(" ")}
                key={`${scheduleTier}-${week}`}
              >
                <span className="rules-week">WK {week}</span>
                <div>
                  <strong>{event}</strong>
                  {detail ? <small>{detail}</small> : null}
                </div>
                {type ? (
                  <span
                    className={[
                      "rules-event-badge",
                      type === "championship" ? "championship" : "",
                    ].join(" ")}
                  >
                    {type === "championship"
                      ? "Title"
                      : type === "rivalry"
                        ? "Rivalry"
                        : "Postseason"}
                  </span>
                ) : null}
              </div>
            ),
          )}
        </div>
      </section>

      <div className="rules-footer-note">
        <BookOpen size={14} />
        Official MESH Football league reference
      </div>
    </main>
  );
}

export default RulesInfo;
