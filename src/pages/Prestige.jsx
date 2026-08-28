import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Search,
  Star,
  Trophy,
  UserRound,
} from "lucide-react";

import {
  getCoachPrestigeRankings,
  getFranchisePrestigeRankings,
} from "../services/prestige";

import "../styles/prestige.css";

const TIERS = ["ALL", "NFL", "FBS", "FCS"];

const PRESTIGE_RULES = {
  NFL: [
    ["Regular Season Win", 1],
    ["Division Champion", 1.5],
    ["Make Playoffs", 2],
    ["Win Divisional Round", 2],
    ["Win Conference Championship", 3],
    ["Win Super Bowl", 5],
  ],
  FBS: [
    ["Regular Season Win", 0.6],
    ["Conference Champion", 1.5],
    ["Make Week 14 Bowl Game", 0.75],
    ["Win Week 14 Bowl Game", 0.75],
    ["Make Week 15 Bowl Game", 1],
    ["Win Week 15 Bowl Game", 1],
    ["Make CFP", 1.5],
    ["Win Quarterfinal Bowl Game", 1.5],
    ["Win Semifinal Bowl Game", 1.75],
    ["Win CFP National Championship", 2.5],
  ],
  FCS: [
    ["Regular Season Win", 0.4],
    ["Conference Champion", 1.5],
    ["Make Playoffs", 0.8],
    ["Make Quarterfinals", 0.8],
    ["Win Quarterfinal Game", 1],
    ["Win Semifinal Game", 1.3],
    ["Win FCS National Championship", 1.6],
  ],
};

function formatPoints(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0.0";
  return Number.isInteger(number) ? number.toFixed(1) : String(Number(number.toFixed(2)));
}

function tierClass(tier) {
  return String(tier || "").trim().toLowerCase();
}

function PrestigeGuide({ onClose }) {
  return (
    <section className="prestige-guide" id="prestige-guide">
      <div className="prestige-guide-heading">
        <div>
          <span>How points are earned</span>
          <h2>Guide to Prestige</h2>
        </div>
        <button type="button" onClick={onClose} className="prestige-guide-close">
          <ChevronUp size={16} />
          Hide Guide
        </button>
      </div>

      <div className="prestige-guide-intro">
        <div className="prestige-guide-copy">
          <Star size={20} />
          <p>
            Prestige Points are awarded to Teams &amp; Coaches for winning
            certain competitions throughout each season. The better you do
            through the years, the more Prestige Points you will earn.
          </p>
        </div>

        <div className="prestige-guide-copy prestige-guide-copy-featured">
          <Trophy size={20} />
          <p>
            Prestige Points are the determining factor when applying for a new
            coaching position in the offseason. If multiple Coaches apply for
            the same team, the Coach with the highest Prestige rating will be
            awarded the Head Coaching Job.
          </p>
        </div>
      </div>

      <p className="prestige-guide-lead">
        Below is the full list of where and how many Prestige Points you can
        gain each season.
      </p>

      <div className="prestige-rule-grid">
        {Object.entries(PRESTIGE_RULES).map(([tier, rows]) => (
          <article
            className={`prestige-rule-card prestige-rule-card-${tierClass(tier)}`}
            key={tier}
          >
            <div className="prestige-rule-card-heading">
              <strong>{tier} Tier</strong>
              <span>Pts Awarded</span>
            </div>

            <div className="prestige-rule-list">
              {rows.map(([label, points]) => (
                <div className="prestige-rule-row" key={label}>
                  <span>{label}</span>
                  <strong>{points}</strong>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RankingRow({ entry, type }) {
  const isCoach = type === "coach";
  const route = isCoach
    ? `/league/coaches/${encodeURIComponent(entry.coachId)}`
    : `/league/franchises/${encodeURIComponent(entry.franchiseId)}`;

  const secondary = isCoach
    ? entry.franchiseName || "No current franchise"
    : entry.coach || "Coach unavailable";

  const initial = String(entry.name || "?").charAt(0).toUpperCase();

  return (
    <Link
      className={`prestige-rank-row prestige-rank-row-${tierClass(entry.tier)} ${
        entry.rank <= 3 ? `prestige-rank-row-podium prestige-rank-row-${entry.rank}` : ""
      }`}
      to={route}
    >
      <div className="prestige-rank-number">
        <strong>{entry.rank}</strong>
      </div>

      <div className="prestige-rank-identity">
        {isCoach && entry.logo ? (
          <div className="prestige-team-logo">
            <img src={entry.logo} alt={`${entry.franchiseName || entry.name} logo`} />
          </div>
        ) : isCoach ? (
          <div className={`prestige-coach-avatar prestige-avatar-${tierClass(entry.tier)}`}>
            <UserRound size={18} />
          </div>
        ) : entry.logo ? (
          <div className="prestige-team-logo">
            <img src={entry.logo} alt={`${entry.name} logo`} />
          </div>
        ) : (
          <div className={`prestige-team-logo prestige-team-logo-fallback prestige-avatar-${tierClass(entry.tier)}`}>
            {initial}
          </div>
        )}

        <div className="prestige-rank-copy">
          <strong>{entry.name}</strong>
          <span>{secondary}</span>
          <small>
            {entry.tier || "MESH"}
            {entry.conference ? ` • ${entry.conference}` : ""}
          </small>
        </div>
      </div>

      <div className="prestige-rank-points">
        <strong>{formatPoints(entry.points)}</strong>
        <span>PRESTIGE PTS</span>
      </div>

      <span className="prestige-rank-chevron" aria-hidden="true">›</span>
    </Link>
  );
}

function Prestige() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialType =
    searchParams.get("type") === "coach" ? "coach" : "franchise";
  const requestedTier = String(searchParams.get("tier") || "ALL").toUpperCase();
  const initialTier = TIERS.includes(requestedTier) ? requestedTier : "ALL";

  const [type, setType] = useState(initialType);
  const [tier, setTier] = useState(initialTier);
  const [query, setQuery] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [franchises, setFranchises] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPrestige() {
      setLoading(true);
      setError("");

      try {
        const [franchiseRows, coachRows] = await Promise.all([
          getFranchisePrestigeRankings(),
          getCoachPrestigeRankings(),
        ]);

        if (!cancelled) {
          setFranchises(franchiseRows);
          setCoaches(coachRows);
        }
      } catch (loadError) {
        console.error("Prestige data failed to load:", loadError);
        if (!cancelled) {
          setError(
            "Prestige rankings are temporarily unavailable. Confirm the published sheet columns are available, then refresh.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPrestige();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateFilters(nextType, nextTier) {
    setType(nextType);
    setTier(nextTier);

    const params = new URLSearchParams();
    if (nextType === "coach") params.set("type", "coach");
    if (nextTier !== "ALL") params.set("tier", nextTier);
    setSearchParams(params, { replace: true });
  }

  const activeRows = type === "coach" ? coaches : franchises;

  const filteredRows = useMemo(() => {
    const search = query.trim().toLowerCase();

    const rows = activeRows.filter((entry) => {
      if (tier !== "ALL" && String(entry.tier || "").toUpperCase() !== tier) {
        return false;
      }

      if (!search) return true;

      return [
        entry.name,
        entry.franchiseName,
        entry.coach,
        entry.conference,
        entry.franchiseId,
        entry.coachId,
      ].some((value) => String(value || "").toLowerCase().includes(search));
    });

    return rows.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }, [activeRows, query, tier]);

  return (
    <main className="page prestige-page">
      <section className="prestige-hero">
        <div className="prestige-hero-icon">
          <Trophy size={24} />
        </div>

        <div>
          <p className="eyebrow">MESH Football</p>
          <h1>Prestige</h1>
          <p>
            Career accomplishment rankings for every MESH franchise and coach.
          </p>
        </div>
      </section>

      <section className="prestige-switcher" aria-label="Prestige ranking type">
        <button
          type="button"
          className={type === "franchise" ? "active" : ""}
          onClick={() => updateFilters("franchise", tier)}
        >
          <Trophy size={17} />
          Franchise
        </button>
        <button
          type="button"
          className={type === "coach" ? "active" : ""}
          onClick={() => updateFilters("coach", tier)}
        >
          <UserRound size={17} />
          Coach
        </button>
      </section>

      <section className="prestige-toolbar">
        <div className="prestige-tier-filters">
          {TIERS.map((item) => (
            <button
              type="button"
              className={`${tier === item ? "active" : ""} prestige-tier-filter-${tierClass(item)}`}
              onClick={() => updateFilters(type, item)}
              key={item}
            >
              {item === "ALL" ? "All MESH" : item}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`prestige-guide-button ${showGuide ? "active" : ""}`}
          onClick={() => setShowGuide((value) => !value)}
        >
          <BookOpen size={16} />
          Guide to Prestige
          {showGuide ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </section>

      {showGuide ? <PrestigeGuide onClose={() => setShowGuide(false)} /> : null}

      <section className="prestige-rankings">
        <div className="prestige-rankings-heading">
          <div>
            <span>Career Rankings</span>
            <h2>
              {tier === "ALL" ? "MESH" : tier} {type === "coach" ? "Coach" : "Franchise"} Prestige
            </h2>
          </div>
          <strong>{filteredRows.length}</strong>
        </div>

        <div className="prestige-search">
          <Search size={16} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              type === "coach"
                ? "Search coaches or franchises"
                : "Search franchises or coaches"
            }
            aria-label="Search prestige rankings"
          />
        </div>

        {loading ? (
          <div className="prestige-state-card">Loading Prestige rankings…</div>
        ) : error ? (
          <div className="prestige-state-card prestige-state-card-error">{error}</div>
        ) : filteredRows.length === 0 ? (
          <div className="prestige-state-card">
            No Prestige entries match the selected filters.
          </div>
        ) : (
          <div className="prestige-rank-list">
            {filteredRows.map((entry) => (
              <RankingRow
                entry={entry}
                type={type}
                key={`${type}-${entry.id}`}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Prestige;
