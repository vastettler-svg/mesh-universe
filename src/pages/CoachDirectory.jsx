import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Search,
  Shield,
  UserRound,
} from "lucide-react";

import PageHeader from "../components/PageHeader";
import meshShield from "../assets/logos/mfl-shield.png";
import { getStandingsData } from "../services/googleSheets";

import "../styles/coaches.css";

const TIERS = ["NFL", "FBS", "FCS"];

function normalizeCoachId(team) {
  return String(team?.coachId || team?.ownerId || team?.coach || "")
    .trim();
}

function buildActiveCoaches(teams) {
  const coaches = new Map();

  teams.forEach((team) => {
    const coachId = normalizeCoachId(team);
    const coachName = String(team?.coach || "").trim();

    if (!coachId || !coachName) return;

    /*
     * ACTIVE COACH MODEL
     *
     * The directory intentionally comes only from current TEAM DATA /
     * getStandingsData(). Historical/inactive coaches are not turned into
     * public profile pages. COACH_SEASON_TENURE will enrich these active
     * profiles later without changing this directory rule.
     */
    coaches.set(coachId, {
      coachId,
      coachName,
      franchiseId: String(team.franchiseId || "").trim(),
      team: String(team.team || "").trim(),
      logo: String(team.logo || "").trim(),
      tier: String(team.tier || "").trim().toUpperCase(),
      conference: String(team.conference || "").trim(),
      division: String(team.division || "").trim(),
      overallSeasonRecord:
        String(team.overallSeasonRecord || team.record || "").trim() || "0-0",
      conferenceRecord:
        String(team.tierStandingsRecord || "").trim() || "0-0",
      prestigePoints:
        team.prestigePoints === null || team.prestigePoints === undefined
          ? null
          : Number(team.prestigePoints),
    });
  });

  return Array.from(coaches.values()).sort((a, b) =>
    a.coachName.localeCompare(b.coachName),
  );
}

function CoachCard({ coach, backTo }) {
  return (
    <Link
      className={`coach-directory-card coach-directory-card-${coach.tier.toLowerCase()}`}
      to={`/league/coaches/${encodeURIComponent(coach.coachId)}?from=${encodeURIComponent(backTo)}`}
    >
      <div className="coach-directory-card-accent" />

      <div className="coach-directory-avatar coach-directory-avatar-team">
        {coach.logo ? (
          <img src={coach.logo} alt="" />
        ) : (
          <Shield size={24} />
        )}
      </div>

      <div className="coach-directory-copy">
        <span>
          {coach.tier}
          {coach.conference ? ` • ${coach.conference}` : ""}
        </span>

        <strong>{coach.coachName}</strong>

        <div className="coach-directory-team">
          <span>{coach.team || "Current Franchise"}</span>
        </div>
      </div>

      <div className="coach-directory-record">
        <span>2026</span>
        <strong>{coach.overallSeasonRecord}</strong>
      </div>

      <ChevronRight size={17} />
    </Link>
  );
}

function CoachDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [teams, setTeams] = useState([]);
  const [status, setStatus] = useState("loading");
  const [query, setQuery] = useState(searchParams.get("q") || "");

  const requestedTier = String(searchParams.get("tier") || "NFL").toUpperCase();
  const tier = TIERS.includes(requestedTier) ? requestedTier : "NFL";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setStatus("loading");
        const rows = await getStandingsData();

        if (!cancelled) {
          setTeams(rows);
          setStatus("ready");
        }
      } catch (error) {
        console.error("Unable to load active coaches:", error);

        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const coaches = useMemo(() => buildActiveCoaches(teams), [teams]);

  const filteredCoaches = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return coaches.filter((coach) => {
      if (coach.tier !== tier) return false;

      if (!needle) return true;

      return [
        coach.coachName,
        coach.team,
        coach.conference,
        coach.division,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [coaches, query, tier]);

  const tierCounts = useMemo(() => {
    return TIERS.reduce((result, currentTier) => {
      result[currentTier] = coaches.filter(
        (coach) => coach.tier === currentTier,
      ).length;
      return result;
    }, {});
  }, [coaches]);

  const updateTier = (nextTier) => {
    const next = new URLSearchParams(searchParams);
    next.set("tier", nextTier);

    if (query.trim()) next.set("q", query.trim());
    else next.delete("q");

    setSearchParams(next);
  };

  const updateQuery = (value) => {
    setQuery(value);

    const next = new URLSearchParams(searchParams);
    next.set("tier", tier);

    if (value.trim()) next.set("q", value.trim());
    else next.delete("q");

    setSearchParams(next, { replace: true });
  };

  const currentBackPath =
    `/league/coaches?${new URLSearchParams({
      tier,
      ...(query.trim() ? { q: query.trim() } : {}),
    }).toString()}`;

  return (
    <main className="coach-directory-page">
      <Link className="coach-back-link" to="/league">
        <ArrowLeft size={15} />
        Back to League
      </Link>

      <PageHeader
        eyebrow="Active coaching careers"
        title="Coaches"
        description="Explore the 202 active MESH coaches and follow each career across franchises, tiers, and seasons."
        imageSrc={meshShield}
        imageAlt="MESH Football shield"
        accent="league"
        size="compact"
      />

      <section className="coach-directory-controls">
        <div className="coach-tier-tabs">
          {TIERS.map((item) => (
            <button
              key={item}
              type="button"
              className={`coach-tier-tab coach-tier-tab-${item.toLowerCase()} ${
                tier === item ? "active" : ""
              }`}
              onClick={() => updateTier(item)}
            >
              <strong>{item}</strong>
              <span>{tierCounts[item] || 0} ACTIVE COACHES</span>
            </button>
          ))}
        </div>

        <label className="coach-search">
          <Search size={16} />
          <input
            type="search"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Search coach, team, or conference"
          />
        </label>
      </section>

      <div className="coach-directory-summary">
        <div>
          <UserRound size={14} />
          <strong>{filteredCoaches.length}</strong>
          <span>{tier} coaches shown</span>
        </div>

        <div>
          <Shield size={14} />
          <strong>{coaches.length}</strong>
          <span>active coach profiles</span>
        </div>
      </div>

      {status === "loading" ? (
        <div className="coach-directory-state">Loading active coaches…</div>
      ) : status === "error" ? (
        <div className="coach-directory-state coach-directory-error">
          Active coach data could not be loaded.
        </div>
      ) : (
        <section className="coach-directory-grid">
          {filteredCoaches.map((coach) => (
            <CoachCard
              key={coach.coachId}
              coach={coach}
              backTo={currentBackPath}
            />
          ))}

          {filteredCoaches.length === 0 ? (
            <div className="coach-directory-state">
              No active coaches match this filter.
            </div>
          ) : null}
        </section>
      )}
    </main>
  );
}

export default CoachDirectory;
