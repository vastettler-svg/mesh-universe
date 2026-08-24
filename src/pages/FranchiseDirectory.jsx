import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  Search,
  Shield,
  Users,
} from "lucide-react";

import PageHeader from "../components/PageHeader";
import meshShield from "../assets/logos/mfl-shield.png";
import { getStandingsData } from "../services/googleSheets";

import "../styles/franchises.css";

const TIER_ORDER = ["NFL", "FBS", "FCS"];

const NFL_DIVISION_ORDER = [
  "AFC East",
  "AFC North",
  "AFC South",
  "AFC West",
  "NFC East",
  "NFC North",
  "NFC South",
  "NFC West",
];

const CONFERENCE_ORDER = {
  NFL: ["AFC", "NFC"],
  FBS: [
    "ACC",
    "Big Ten",
    "Big 12",
    "MAC",
    "Mountain West",
    "SEC",
    "Sun Belt",
  ],
  FCS: [
    "Big Sky",
    "Coastal",
    "Coastal Athletic Association",
    "CAA",
    "Ivy League",
    "Ivy",
    "Missouri Valley",
    "MVC",
    "Northeast",
    "NEC",
    "Southland",
  ],
};

function tierLabel(tier) {
  if (tier === "NFL") return "32 Franchises";
  if (tier === "FBS") return "98 Franchises";
  return "72 Franchises";
}

function FranchiseCard({ team, backTo }) {
  return (
    <Link
      className={`franchise-card franchise-card-${team.tierClass}`}
      to={`/league/franchises/${encodeURIComponent(team.franchiseId)}?from=${encodeURIComponent(backTo)}`}
    >
      <div
        className="franchise-card-color"
        style={{
          "--franchise-primary": team.primaryColor || "rgba(255,255,255,.10)",
          "--franchise-secondary": team.secondaryColor || "rgba(255,255,255,.04)",
        }}
      />

      <div className="franchise-card-logo">
        {team.logo ? (
          <img src={team.logo} alt={`${team.team} logo`} />
        ) : (
          <span>{team.team?.charAt(0) || "M"}</span>
        )}
      </div>

      <div className="franchise-card-copy">
        <strong>{team.team || "Unnamed Franchise"}</strong>
        <span className="franchise-card-coach">
          {team.coach || "Coach TBD"}
        </span>

        <div className="franchise-card-record">
          {team.tier === "NFL" ? (
            <>
              <span>{team.record || "0–0"}</span>
              <span>{team.conference} {team.division}</span>
            </>
          ) : (
            <>
              <span>OVR: {team.overallSeasonRecord || "0–0"}</span>
              <span>CONF: {team.tierStandingsRecord || "0–0"}</span>
            </>
          )}
        </div>
      </div>

      <ArrowRight size={18} className="franchise-card-arrow" />
    </Link>
  );
}

function FranchiseDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTier = TIER_ORDER.includes(searchParams.get("tier"))
    ? searchParams.get("tier")
    : "NFL";

  const [teams, setTeams] = useState([]);
  const [tier, setTier] = useState(initialTier);
  const [conference, setConference] = useState(
    searchParams.get("conference") || "All",
  );
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState("loading");

  const updateDirectoryUrl = (nextTier, nextConference, nextQuery) => {
    const params = new URLSearchParams();

    params.set("tier", nextTier);

    if (nextConference && nextConference !== "All") {
      params.set("conference", nextConference);
    }

    if (String(nextQuery || "").trim()) {
      params.set("q", String(nextQuery).trim());
    }

    setSearchParams(params, { replace: true });
  };

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
        console.error("Unable to load franchise directory:", error);

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

  const tierTeams = useMemo(
    () => teams.filter((team) => team.tier === tier),
    [teams, tier],
  );

  const conferences = useMemo(() => {
    const available = Array.from(
      new Set(
        tierTeams
          .map((team) => String(team.conference || "").trim())
          .filter(Boolean),
      ),
    );

    const preferred = CONFERENCE_ORDER[tier] || [];

    return available.sort((a, b) => {
      const ai = preferred.indexOf(a);
      const bi = preferred.indexOf(b);

      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [tierTeams, tier]);

  useEffect(() => {
    if (conference !== "All" && !conferences.includes(conference)) {
      setConference("All");
      updateDirectoryUrl(tier, "All", query);
    }
  }, [conference, conferences]);

  const visibleTeams = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return tierTeams
      .filter((team) => conference === "All" || team.conference === conference)
      .filter((team) => {
        if (!needle) return true;

        return [
          team.team,
          team.coach,
          team.conference,
          team.division,
        ].some((value) =>
          String(value || "").toLowerCase().includes(needle),
        );
      })
      .sort((a, b) => {
        const conferenceCompare = String(a.conference || "").localeCompare(
          String(b.conference || ""),
        );

        if (conferenceCompare !== 0) return conferenceCompare;

        const divisionCompare = String(a.division || "").localeCompare(
          String(b.division || ""),
        );

        if (divisionCompare !== 0) return divisionCompare;

        return String(a.team || "").localeCompare(String(b.team || ""));
      });
  }, [tierTeams, conference, query]);

  const groupedTeams = useMemo(() => {
    const groups = new Map();

    visibleTeams.forEach((team) => {
      const groupName =
        tier === "NFL"
          ? [team.conference, team.division].filter(Boolean).join(" ") || "NFL"
          : team.conference || tier;

      if (!groups.has(groupName)) groups.set(groupName, []);
      groups.get(groupName).push(team);
    });

    const entries = Array.from(groups.entries());

    if (tier === "NFL") {
      entries.sort((a, b) => {
        const ai = NFL_DIVISION_ORDER.indexOf(a[0]);
        const bi = NFL_DIVISION_ORDER.indexOf(b[0]);

        if (ai === -1 && bi === -1) return a[0].localeCompare(b[0]);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
    }

    return entries;
  }, [visibleTeams, tier]);

  return (
    <main className="franchise-directory-page">
      <PageHeader
        eyebrow="Permanent MESH identities"
        title="Franchises"
        description="Browse all 202 permanent MESH franchises. Team names and coaches can change over time, but every franchise keeps the same history and Franchise ID."
        imageSrc={meshShield}
        imageAlt="MESH Football shield"
        accent="league"
        size="medium"
      />

      <section className="franchise-directory-controls">
        <div className="franchise-tier-tabs">
          {TIER_ORDER.map((item) => (
            <button
              type="button"
              key={item}
              className={[
                "franchise-tier-tab",
                `franchise-tier-tab-${item.toLowerCase()}`,
                tier === item ? "active" : "",
              ].join(" ")}
              onClick={() => {
                setTier(item);
                setConference("All");
                updateDirectoryUrl(item, "All", query);
              }}
            >
              <strong>{item}</strong>
              <span>{tierLabel(item)}</span>
            </button>
          ))}
        </div>

        <div className="franchise-filter-row">
          <label className="franchise-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => {
                const nextQuery = event.target.value;
                setQuery(nextQuery);
                updateDirectoryUrl(tier, conference, nextQuery);
              }}
              placeholder="Search team or coach"
            />
          </label>

          <label className="franchise-conference-filter">
            <span>Conference</span>
            <select
              value={conference}
              onChange={(event) => {
                const nextConference = event.target.value;
                setConference(nextConference);
                updateDirectoryUrl(tier, nextConference, query);
              }}
            >
              <option value="All">All {tier}</option>
              {conferences.map((name) => (
                <option value={name} key={name}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown size={15} aria-hidden="true" />
          </label>
        </div>

        <div className="franchise-directory-summary">
          <div>
            <Shield size={16} />
            <strong>{visibleTeams.length}</strong>
            <span>franchises shown</span>
          </div>
          <div>
            <Users size={16} />
            <span>Tap any franchise for its permanent MESH profile</span>
          </div>
        </div>
      </section>

      {status === "loading" ? (
        <div className="franchise-directory-state">
          Loading MESH franchises…
        </div>
      ) : status === "error" ? (
        <div className="franchise-directory-state franchise-directory-error">
          Franchise data could not be loaded. Try refreshing the page.
        </div>
      ) : groupedTeams.length === 0 ? (
        <div className="franchise-directory-state">
          No franchises match this search.
        </div>
      ) : (
        <div className="franchise-groups">
          {groupedTeams.map(([groupName, groupTeams]) => (
            <section className="franchise-group" key={groupName}>
              <div className="franchise-group-heading">
                <div>
                  <span>{tier} Directory</span>
                  <h2>{groupName}</h2>
                </div>
                <strong>{groupTeams.length}</strong>
              </div>

              <div className="franchise-grid">
                {groupTeams.map((team) => (
                  <FranchiseCard
                    team={team}
                    backTo={`${location.pathname}?${new URLSearchParams({
                      tier,
                      ...(conference !== "All"
                        ? { conference }
                        : {}),
                      ...(query.trim()
                        ? { q: query.trim() }
                        : {}),
                    }).toString()}`}
                    key={team.franchiseId}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

export default FranchiseDirectory;
