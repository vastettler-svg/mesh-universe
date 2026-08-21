import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CalendarDays,
  Info,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

import "../styles/rulesInfo.css";

const sections = [
  { id: "structure", label: "Structure", icon: Users },
  { id: "franchises", label: "Franchises", icon: ShieldCheck },
  { id: "movement", label: "Movement", icon: ArrowUp },
  { id: "standings", label: "Standings", icon: Trophy },
  { id: "season", label: "Season", icon: CalendarDays },
];

const tierData = [
  {
    tier: "NFL",
    className: "nfl",
    teams: 32,
    leagues: 2,
    leagueSize: 16,
    summary: "The top MESH tier. Two 16-team leagues combine for 32 permanent NFL franchises.",
  },
  {
    tier: "FBS",
    className: "fbs",
    teams: 98,
    leagues: 7,
    leagueSize: 14,
    summary: "Seven 14-team conferences form the 98-franchise FBS tier and its national ranking race.",
  },
  {
    tier: "FCS",
    className: "fcs",
    teams: 72,
    leagues: 6,
    leagueSize: 12,
    summary: "Six 12-team conferences make up the 72-franchise FCS tier and the path into FBS.",
  },
];

const movementData = [
  {
    tier: "NFL",
    className: "nfl",
    label: "Relegation",
    headline: "Bottom 4 coaches",
    copy: "The four lowest-finishing NFL coaches leave their NFL franchises and move into FBS for the following season.",
    direction: "NFL → FBS",
    icon: ArrowDown,
  },
  {
    tier: "FBS",
    className: "fbs",
    label: "Promotion + Relegation",
    headline: "Top 4 up • Bottom 8 down",
    copy: "The top four FBS coaches earn promotion to NFL franchises. The bottom eight FBS coaches move to FCS franchises.",
    direction: "FCS ← FBS → NFL",
    icon: ArrowUp,
  },
  {
    tier: "FCS",
    className: "fcs",
    label: "Promotion",
    headline: "Top 8 coaches",
    copy: "The eight highest-finishing FCS coaches earn promotion and take over available FBS franchises the next season.",
    direction: "FCS → FBS",
    icon: ArrowUp,
  },
];

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
  const [activeSection, setActiveSection] = useState("structure");

  const jumpTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <main className="rules-page">
      <div className="page-heading rules-page-heading">
        <p className="eyebrow">Official MESH Football Handbook</p>
        <h1>League Rules & Info</h1>
        <p>
          The competitive structure, franchise model, standings framework, and
          promotion/relegation system that govern MESH Football.
        </p>
      </div>

      <div className="rules-overview" aria-label="MESH league overview">
        <div>
          <span>Total Franchises</span>
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

      <section className="rules-section" id="structure">
        <SectionHeading
          icon={Users}
          eyebrow="League Framework"
          title="Three-Tier Structure"
        />

        <div className="rules-callout">
          <Info size={17} />
          <p>
            <strong>MESH Football is one connected 202-franchise universe.</strong>{" "}
            The NFL, FBS, and FCS are separate competitive tiers, but coach
            movement connects all three from season to season.
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
                <strong>{item.teams} FRANCHISES</strong>
              </div>
              <p>
                {item.leagues} Sleeper {item.leagues === 1 ? "league" : "leagues"} •{" "}
                {item.leagueSize} teams each
              </p>
              <p>{item.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rules-section" id="franchises">
        <SectionHeading
          icon={ShieldCheck}
          eyebrow="Permanent Identity"
          title="Franchises Stay Put — Coaches Move"
        />

        <div className="rules-callout">
          <ShieldCheck size={17} />
          <p>
            <strong>Franchise_ID is permanent.</strong> Every MESH franchise is
            permanently assigned to its tier and conference. Promotion and
            relegation never move the franchise itself.
          </p>
        </div>

        <div className="rules-subcard">
          <h3>Franchise identity</h3>
          <ul className="rules-list">
            <li>
              A franchise keeps the same permanent Franchise_ID across every
              season in MESH history.
            </li>
            <li>
              Its tier and conference assignment remain fixed even when its
              coach changes.
            </li>
            <li>
              The displayed team name can change from season to season based on
              the coach controlling that franchise.
            </li>
            <li>
              Historical standings preserve the season-specific Franchise_Name
              alongside the permanent Franchise_ID.
            </li>
          </ul>
        </div>

        <div className="rules-subcard">
          <h3>Coach identity</h3>
          <ul className="rules-list">
            <li>
              A coach has a career that can span multiple franchises, tiers,
              and seasons.
            </li>
            <li>
              Promotion or relegation means that coach leaves the old franchise
              and takes over a franchise in the new tier the following season.
            </li>
            <li>
              Franchise history and coach history are tracked separately so
              both records remain intact.
            </li>
          </ul>
        </div>

        <div className="rules-process" aria-label="MESH identity model">
          <span>Permanent Franchise_ID</span>
          <strong>+</strong>
          <span>Season-Specific Team Name</span>
          <strong>+</strong>
          <span>Coach Career History</span>
        </div>
      </section>

      <section className="rules-section" id="movement">
        <SectionHeading
          icon={ArrowUp}
          eyebrow="Coach Carousel"
          title="Promotion & Relegation"
        />

        <div className="rules-callout">
          <Info size={17} />
          <p>
            Movement is based on <strong>coaches, not franchises.</strong> The
            permanent NFL, FBS, and FCS franchise pools do not change size when
            promotion and relegation occur.
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

      <section className="rules-section" id="standings">
        <SectionHeading
          icon={Trophy}
          eyebrow="Competition Format"
          title="Standings, Rankings & Qualification"
        />

        <div className="rules-table-card">
          <div className="rules-table-heading">
            <span>Tier Structure</span>
            <strong>Current MESH format</strong>
          </div>
          <div className="rules-table-scroll">
            <table className="rules-table">
              <thead>
                <tr>
                  <th scope="col">Tier</th>
                  <th scope="col">Field</th>
                  <th scope="col">Primary Views</th>
                  <th scope="col">Movement</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row" className="nfl">NFL</th>
                  <td>32</td>
                  <td>Divisions • Conferences • League • Playoff Picture</td>
                  <td>Bottom 4 ↓</td>
                </tr>
                <tr>
                  <th scope="row" className="fbs">FBS</th>
                  <td>98</td>
                  <td>National Ranking • Conference Standings • CFP</td>
                  <td>Top 4 ↑ • Bottom 8 ↓</td>
                </tr>
                <tr>
                  <th scope="row" className="fcs">FCS</th>
                  <td>72</td>
                  <td>National Ranking • Conference Standings</td>
                  <td>Top 8 ↑</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="rules-subcard rules-subcard-spaced">
          <h3>NFL standings</h3>
          <p>
            NFL competition is organized through division standings, full
            conference standings, the combined 32-team league view, and the NFL
            playoff picture.
          </p>
        </div>

        <div className="rules-subcard">
          <h3>FBS rankings & CFP</h3>
          <p>
            All 98 FBS franchises are ranked together nationally while each of
            the seven conferences maintains its own 14-team standings. Each FBS
            conference champion qualifies for the CFP.
          </p>
        </div>

        <div className="rules-subcard">
          <h3>FCS rankings</h3>
          <p>
            All 72 FCS franchises are ranked together nationally while each of
            the six conferences maintains its own 12-team standings.
          </p>
        </div>
      </section>

      <section className="rules-section" id="season">
        <SectionHeading
          icon={CalendarDays}
          eyebrow="Season Reference"
          title="Scores, Schedule & Historical Record"
        />

        <div className="rules-callout">
          <BookOpen size={17} />
          <p>
            The MESH Scores page is also the league schedule. Changing weeks
            lets users move between scheduled matchups, live games, and final
            scores without a separate schedule page.
          </p>
        </div>

        <div className="rules-subcard">
          <h3>Historical continuity</h3>
          <ul className="rules-list">
            <li>
              Completed seasons remain part of permanent franchise and coach
              history.
            </li>
            <li>
              Franchise pages follow one permanent franchise through every
              season-specific identity it has used.
            </li>
            <li>
              Coach pages follow one coach across every franchise and tier in
              that coach&apos;s MESH career.
            </li>
            <li>
              Championships, awards, and trophy records can therefore be
              credited independently to both franchises and coaches.
            </li>
          </ul>
        </div>

        <div className="rules-callout rules-coming-soon">
          <Info size={17} />
          <p>
            <strong>Handbook expansion:</strong> exact scoring, roster,
            transaction, trade-review, waiver/FAAB, draft, and detailed
            postseason rules will be added here from the official MESH rule set
            as those sections are locked. They are intentionally not guessed on
            this page.
          </p>
        </div>
      </section>

      <div className="rules-footer-note">
        <BookOpen size={14} />
        Official MESH Football league reference • Built to expand with future rules
      </div>
    </main>
  );
}

export default RulesInfo;
