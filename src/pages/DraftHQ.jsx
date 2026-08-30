import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftRight, ClipboardList, Shield, UsersRound } from "lucide-react";

import PageHeader from "../components/PageHeader";
import { getDraftHQ, getStandingsData } from "../services/googleSheets";
import { MESH_PATCHES } from "../assets/logos/patches";
import meshShield from "../assets/logos/mfl-shield.png";

import "../styles/draftHQ.css";

const TIERS = ["NFL", "FBS", "FCS"];

const CONFERENCES_BY_TIER = {
  NFL: ["AFC", "NFC"],
  FBS: ["ACC", "Big Ten", "Big 12", "MAC", "Mountain West", "SEC", "Sun Belt"],
  FCS: ["Big Sky", "CAA", "Ivy", "MVC", "NEC", "Southland"],
};

function normalizePatchKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function canonicalConferenceKey(value) {
  const key = normalizePatchKey(value);

  const aliases = {
    "big-10": "big-ten",
    "big-ten-conference": "big-ten",
    "big-xii": "big-12",
    "big-12-conference": "big-12",
    "mtn-west": "mountain-west",
    mwc: "mountain-west",
    "mountain-west-conference": "mountain-west",
    coastal: "caa",
    "coastal-athletic-association": "caa",
    "ivy-league": "ivy",
    "missouri-valley": "mvc",
    "missouri-valley-conference": "mvc",
    northeast: "nec",
    "northeast-conference": "nec",
    slc: "southland",
    "southland-conference": "southland",
  };

  return aliases[key] ?? key;
}

function getConferencePatch(tier, conference) {
  const key = normalizePatchKey(conference);

  if (tier === "NFL") {
    if (key === "afc") return MESH_PATCHES.NFL.AFC;
    if (key === "nfc") return MESH_PATCHES.NFL.NFC;
    return MESH_PATCHES.tier.NFL;
  }

  if (tier === "FBS") {
    const map = {
      acc: MESH_PATCHES.FBS.ACC,
      "big-ten": MESH_PATCHES.FBS["Big Ten"],
      "big-10": MESH_PATCHES.FBS["Big Ten"],
      "big-12": MESH_PATCHES.FBS["Big 12"],
      mac: MESH_PATCHES.FBS.MAC,
      "mountain-west": MESH_PATCHES.FBS["Mountain West"],
      sec: MESH_PATCHES.FBS.SEC,
      "sun-belt": MESH_PATCHES.FBS["Sun Belt"],
    };
    return map[key] ?? MESH_PATCHES.tier.FBS;
  }

  if (tier === "FCS") {
    const map = {
      "big-sky": MESH_PATCHES.FCS["Big Sky"],
      caa: MESH_PATCHES.FCS.CAA,
      coastal: MESH_PATCHES.FCS.CAA,
      "coastal-athletic-association": MESH_PATCHES.FCS.CAA,
      ivy: MESH_PATCHES.FCS.Ivy,
      "ivy-league": MESH_PATCHES.FCS.Ivy,
      mvc: MESH_PATCHES.FCS.MVC,
      "missouri-valley": MESH_PATCHES.FCS.MVC,
      nec: MESH_PATCHES.FCS.NEC,
      northeast: MESH_PATCHES.FCS.NEC,
      southland: MESH_PATCHES.FCS.Southland,
    };
    return map[key] ?? MESH_PATCHES.tier.FCS;
  }

  return null;
}

function tierClass(tier) {
  return String(tier || "").toLowerCase();
}

function PickRow({ pick, compact = false }) {
  const pickLabel = `${pick.round}.${String(pick.pickInRound || 0).padStart(2, "0")}`;

  return (
    <div className={`draft-pick-row ${compact ? "draft-pick-row-compact" : ""}`}>
      <div className="draft-pick-number">{pickLabel}</div>

      {!compact ? (
        <div className="draft-team-cell">
          {pick.draftingLogo ? (
            <img src={pick.draftingLogo} alt="" />
          ) : (
            <span className="draft-logo-fallback"><Shield size={17} /></span>
          )}
          <div>
            {pick.draftingFranchiseId ? (
              <Link to={`/league/franchises/${encodeURIComponent(pick.draftingFranchiseId)}`}>
                {pick.draftingFranchiseName || "Franchise TBD"}
              </Link>
            ) : (
              <strong>{pick.draftingFranchiseName || "Franchise TBD"}</strong>
            )}
            {pick.isTraded ? (
              <small className="draft-traded-from">
                <ArrowLeftRight size={12} /> From {pick.originalFranchiseName || "original franchise"}
              </small>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="draft-player-cell">
        {pick.isSelected ? (
          <>
            <strong>{pick.playerName}</strong>
            <span>{[pick.position, pick.nflTeam].filter(Boolean).join(" • ")}</span>
          </>
        ) : (
          <>
            <strong className="draft-available">Pick Available</strong>
            <span>Selection pending</span>
          </>
        )}
      </div>

      {compact && pick.isTraded ? (
        <div className="draft-team-origin">From {pick.originalFranchiseName || "original franchise"}</div>
      ) : null}
    </div>
  );
}

function DraftHQ() {
  const [rows, setRows] = useState([]);
  const [currentTeams, setCurrentTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("order");
  const [season, setSeason] = useState(null);
  const [tier, setTier] = useState("NFL");
  const [conference, setConference] = useState("");
  const [franchiseId, setFranchiseId] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [data, currentTeams] = await Promise.all([getDraftHQ(), getStandingsData()]);
        if (!cancelled) {
          setRows(data);
          setCurrentTeams(currentTeams);
          const latestSeason = Math.max(...data.map((row) => row.season));
          setSeason(Number.isFinite(latestSeason) ? latestSeason : null);
        }
      } catch (loadError) {
        console.error("Draft HQ failed to load:", loadError);
        if (!cancelled) setError("Draft HQ is temporarily unavailable. Please refresh and try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const seasons = useMemo(
    () => [...new Set(rows.map((row) => row.season))].sort((a, b) => b - a),
    [rows],
  );

  const conferences = useMemo(
    () => CONFERENCES_BY_TIER[tier] ?? [],
    [tier],
  );

  useEffect(() => {
    if (!conferences.length) return;
    if (!conferences.includes(conference)) setConference(conferences[0]);
  }, [conferences, conference]);

  const franchiseOptions = useMemo(() => {
    const selectedConferenceKey = canonicalConferenceKey(conference);

    return currentTeams
      .filter(
        (team) =>
          team.tier === tier &&
          (!conference || canonicalConferenceKey(team.conference) === selectedConferenceKey),
      )
      .map((team) => ({
        id: team.franchiseId,
        name: team.team,
        logo: team.logo || team.logoUrl || "",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [currentTeams, tier, conference]);

  useEffect(() => {
    if (!franchiseOptions.length) {
      setFranchiseId("");
      return;
    }
    if (!franchiseOptions.some((team) => team.id === franchiseId)) {
      setFranchiseId(franchiseOptions[0].id);
    }
  }, [franchiseOptions, franchiseId]);

  const orderRows = useMemo(() => {
    const selectedConferenceKey = canonicalConferenceKey(conference);

    return rows.filter(
      (row) =>
        row.season === season &&
        row.tier === tier &&
        canonicalConferenceKey(row.conference) === selectedConferenceKey,
    );
  }, [rows, season, tier, conference]);

  const roundGroups = useMemo(() => {
    const groups = new Map();
    orderRows.forEach((row) => {
      if (!groups.has(row.round)) groups.set(row.round, []);
      groups.get(row.round).push(row);
    });
    return [...groups.entries()].sort((a, b) => a[0] - b[0]);
  }, [orderRows]);

  const teamRows = useMemo(
    () => rows
      .filter((row) => row.draftingFranchiseId === franchiseId)
      .sort((a, b) => b.season - a.season || a.pick - b.pick),
    [rows, franchiseId],
  );

  const teamSeasonGroups = useMemo(() => {
    const groups = new Map();
    teamRows.forEach((row) => {
      if (!groups.has(row.season)) groups.set(row.season, []);
      groups.get(row.season).push(row);
    });
    return [...groups.entries()].sort((a, b) => b[0] - a[0]);
  }, [teamRows]);

  const selectedTeam = franchiseOptions.find((team) => team.id === franchiseId);
  const patch = getConferencePatch(tier, conference);

  return (
    <main className="page draft-hq-page">
      <div className="draft-page-header-wrap">
        <PageHeader
          eyebrow="MESH Football"
          title="Draft HQ"
          description="The home for all MESH rookie draft picks — past drafts, current orders, and live selections."
          imageSrc={meshShield}
          imageAlt="MESH Football shield"
          accent="scores"
          size="compact"
        />
        <Link
          to="/"
          className="draft-header-home-link"
          aria-label="MESH Football Home"
          title="MESH Football Home"
        />
      </div>

      <div className="draft-view-tabs" role="tablist" aria-label="Draft HQ view">
        <button type="button" className={view === "order" ? "active" : ""} onClick={() => setView("order")}>
          <ClipboardList size={16} /> Draft Order
        </button>
        <button type="button" className={view === "team" ? "active" : ""} onClick={() => setView("team")}>
          <UsersRound size={16} /> By Team
        </button>
      </div>

      <div className="draft-tier-tabs">
        {TIERS.map((item) => (
          <button
            type="button"
            key={item}
            className={`draft-tier-tab draft-tier-${tierClass(item)} ${tier === item ? "active" : ""}`}
            onClick={() => setTier(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {loading ? <div className="draft-state">Loading Draft HQ…</div> : null}
      {error ? <div className="draft-state draft-state-error">{error}</div> : null}

      {!loading && !error ? (
        <>
          <div className="draft-filter-bar">
            {view === "order" ? (
              <label>
                <span>Season</span>
                <select value={season ?? ""} onChange={(event) => setSeason(Number(event.target.value))}>
                  {seasons.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </label>
            ) : null}

            <label>
              <span>Conference</span>
              <select value={conference} onChange={(event) => setConference(event.target.value)}>
                {conferences.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>

            {view === "team" ? (
              <label className="draft-team-select">
                <span>Franchise</span>
                <select value={franchiseId} onChange={(event) => setFranchiseId(event.target.value)}>
                  {franchiseOptions.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
              </label>
            ) : null}
          </div>

          <section className={`draft-board draft-board-${tierClass(tier)}`}>
            <header className="draft-board-header">
              {view === "team" && selectedTeam?.id ? (
                <Link
                  className="draft-team-profile-link"
                  to={`/league/franchises/${encodeURIComponent(selectedTeam.id)}`}
                  aria-label={`Open ${selectedTeam.name} franchise page`}
                >
                  <div className="draft-board-patch">
                    {selectedTeam?.logo ? (
                      <img src={selectedTeam.logo} alt={`${selectedTeam.name} logo`} />
                    ) : null}
                  </div>
                  <div>
                    <span>{tier} • {conference}</span>
                    <h2>{selectedTeam?.name || "Franchise Draft History"}</h2>
                    <p>Rookie selections by season</p>
                  </div>
                </Link>
              ) : (
                <>
                  <div className="draft-board-patch">
                    {patch ? <img src={patch} alt="" /> : null}
                  </div>
                  <div>
                    <span>{tier} • {conference}</span>
                    <h2>{`${season} ${conference} Rookie Draft`}</h2>
                    <p>Complete rookie draft order and selections</p>
                  </div>
                </>
              )}
            </header>

            {view === "order" ? (
              roundGroups.length ? (
                <div className="draft-rounds">
                  {roundGroups.map(([round, picks]) => (
                    <section className="draft-round" key={round}>
                      <div className="draft-round-title"><span>Round {round}</span><small>{picks.length} picks</small></div>
                      <div className="draft-pick-list">
                        {picks.map((pick) => <PickRow key={pick.id} pick={pick} />)}
                      </div>
                    </section>
                  ))}
                </div>
              ) : <div className="draft-empty">No draft picks are available for this selection.</div>
            ) : (
              teamSeasonGroups.length ? (
                <div className="draft-team-history">
                  {teamSeasonGroups.map(([year, picks]) => (
                    <section className="draft-team-season" key={year}>
                      <div className="draft-round-title draft-team-year-title">
                        <span className="draft-year-team">
                          {picks[0]?.draftingLogo ? <img src={picks[0].draftingLogo} alt="" /> : null}
                          <span>{year} — {picks[0]?.draftingFranchiseName || "Franchise"}</span>
                        </span>
                        <small>{picks.length} picks</small>
                      </div>
                      <div className="draft-pick-list">
                        {picks.map((pick) => <PickRow key={pick.id} pick={pick} compact />)}
                      </div>
                    </section>
                  ))}
                </div>
              ) : <div className="draft-empty">No draft history is available for this franchise.</div>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}

export default DraftHQ;
