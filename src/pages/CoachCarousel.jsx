import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  CircleDot,
  History,
  Shield,
  UserRound,
} from "lucide-react";

import PageHeader from "../components/PageHeader";
import { getCoachCarousel, getStandingsData } from "../services/googleSheets";
import { MESH_PATCHES } from "../assets/logos/patches";
import meshShield from "../assets/logos/mfl-shield.png";

import "../styles/coachCarousel.css";

const TIERS = ["ALL", "NFL", "FBS", "FCS"];

function normalizePatchKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
      coastal: MESH_PATCHES.FCS.CAA,
      caa: MESH_PATCHES.FCS.CAA,
      "coastal-athletic-association": MESH_PATCHES.FCS.CAA,
      ivy: MESH_PATCHES.FCS.Ivy,
      "ivy-league": MESH_PATCHES.FCS.Ivy,
      mvc: MESH_PATCHES.FCS.MVC,
      "missouri-valley": MESH_PATCHES.FCS.MVC,
      "missouri-valley-conference": MESH_PATCHES.FCS.MVC,
      nec: MESH_PATCHES.FCS.NEC,
      northeast: MESH_PATCHES.FCS.NEC,
      "northeast-conference": MESH_PATCHES.FCS.NEC,
      southland: MESH_PATCHES.FCS.Southland,
      "southland-conference": MESH_PATCHES.FCS.Southland,
    };

    return map[key] ?? MESH_PATCHES.tier.FCS;
  }

  return null;
}

function rankLabel(value, fallback = "—") {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? `#${number}` : fallback;
}

function CoachLink({ coachId, children, profileCoachIds }) {
  if (!children) return <span>—</span>;

  const hasProfile =
    coachId && profileCoachIds?.has(String(coachId).trim());

  return hasProfile ? (
    <Link
      to={`/league/coaches/${encodeURIComponent(coachId)}`}
      className="carousel-inline-link"
    >
      {children}
    </Link>
  ) : (
    <span>{children}</span>
  );
}

function TeamLink({ franchiseId, children }) {
  if (!children) return <span>—</span>;

  return franchiseId ? (
    <Link
      to={`/league/franchises/${encodeURIComponent(franchiseId)}`}
      className="carousel-inline-link"
    >
      {children}
    </Link>
  ) : (
    <span>{children}</span>
  );
}

function CarouselCard({ move, profileCoachIds }) {
  const patch = getConferencePatch(move.tier, move.conference);
  const hasOutgoingDestination =
    Boolean(move.outgoingNewFranchiseId) || Boolean(move.outgoingNewTeam);
  const hasIncomingPrevious =
    Boolean(move.incomingPrevFranchiseId) || Boolean(move.incomingPrevTeam);

  return (
    <article
      className={`carousel-card carousel-card-${move.tierClass} ${
        move.isOpen ? "carousel-card-open" : ""
      }`}
    >
      <div className="carousel-card-accent" />

      <header className="carousel-card-header">
        <div className="carousel-franchise-logo">
          {move.logo ? (
            <img src={move.logo} alt={`${move.franchiseName} logo`} />
          ) : (
            <Shield size={25} />
          )}
        </div>

        <div className="carousel-franchise-copy">
          <div className="carousel-franchise-meta">
            {patch ? <img src={patch} alt="" /> : null}
            <span>{move.conference || move.tier}</span>
            <span>•</span>
            <span>{move.tier}</span>
          </div>

          <h3>
            <TeamLink franchiseId={move.franchiseId}>
              {move.franchiseName}
            </TeamLink>
          </h3>
        </div>

        <div
          className={`carousel-status carousel-status-${
            move.isOpen ? "open" : "filled"
          }`}
        >
          {move.isOpen ? "OPEN" : "FILLED"}
        </div>
      </header>

      <div className="carousel-rank-strip">
        <div>
          <span>Conference Rank</span>
          <strong>{rankLabel(move.conferenceRank)}</strong>
        </div>
        <div>
          <span>{move.tier} Rank</span>
          <strong>{rankLabel(move.tierRank)}</strong>
        </div>
        <div>
          <span>Season</span>
          <strong>{move.season}</strong>
        </div>
      </div>

      {move.isOpen ? (
        <div className="carousel-open-job">
          <BriefcaseBusiness size={22} />
          <div>
            <span>Available Position</span>
            <strong>Head Coach Opening</strong>
            <small>
              This franchise is currently available in the MESH Coach Carousel.
            </small>
          </div>
        </div>
      ) : (
        <div className="carousel-move-grid">
          <section className="carousel-move-side carousel-move-out">
            <span className="carousel-side-label">Who's Out</span>

            <div className="carousel-coach-name">
              <UserRound size={14} />
              <CoachLink coachId={move.outgoingCoachId} profileCoachIds={profileCoachIds}>
                {move.outgoingCoachName}
              </CoachLink>
            </div>

            {move.outgoingReason ? (
              <small className="carousel-reason">{move.outgoingReason}</small>
            ) : null}

            <div className="carousel-destination">
              <span>{hasOutgoingDestination ? "New Team" : "Destination"}</span>
              <strong>
                {hasOutgoingDestination ? (
                  <TeamLink franchiseId={move.outgoingNewFranchiseId}>
                    {move.outgoingNewTeam || "New Franchise"}
                  </TeamLink>
                ) : (
                  move.outgoingReason || "—"
                )}
              </strong>
              {hasOutgoingDestination && move.outgoingNewTier ? (
                <small>{move.outgoingNewTier}</small>
              ) : null}
            </div>
          </section>

          <div className="carousel-move-arrow">
            <ArrowRight size={19} />
          </div>

          <section className="carousel-move-side carousel-move-in">
            <span className="carousel-side-label">Who's In</span>

            <div className="carousel-coach-name">
              <UserRound size={14} />
              <CoachLink coachId={move.incomingCoachId} profileCoachIds={profileCoachIds}>
                {move.incomingCoachName}
              </CoachLink>
            </div>

            {move.incomingReason ? (
              <small className="carousel-reason">{move.incomingReason}</small>
            ) : null}

            <div className="carousel-destination">
              <span>Previous Team</span>
              <strong>
                {hasIncomingPrevious ? (
                  <TeamLink franchiseId={move.incomingPrevFranchiseId}>
                    {move.incomingPrevTeam || "Previous Franchise"}
                  </TeamLink>
                ) : (
                  "New to MESH"
                )}
              </strong>
              {hasIncomingPrevious && move.incomingPrevTier ? (
                <small>{move.incomingPrevTier}</small>
              ) : null}
            </div>
          </section>
        </div>
      )}

      {move.notes ? <p className="carousel-card-notes">{move.notes}</p> : null}
    </article>
  );
}

function SectionHeading({ eyebrow, title, count }) {
  return (
    <div className="carousel-section-heading">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <strong>{count}</strong>
    </div>
  );
}

function CoachCarousel() {
  const [moves, setMoves] = useState([]);
  const [profileCoachIds, setProfileCoachIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tier, setTier] = useState("ALL");
  const [historySeason, setHistorySeason] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCarousel() {
      try {
        setLoading(true);
        setError("");

        const [rows, standingRows] = await Promise.all([
          getCoachCarousel(),
          getStandingsData().catch(() => []),
        ]);

        if (!cancelled) {
          setMoves(rows);
          setProfileCoachIds(
            new Set(
              standingRows
                .map((team) => String(team.coachId || "").trim())
                .filter(Boolean),
            ),
          );
        }
      } catch (loadError) {
        console.error("Unable to load Coach Carousel:", loadError);

        if (!cancelled) {
          setError("Coach Carousel data could not be loaded from Google Sheets.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCarousel();

    return () => {
      cancelled = true;
    };
  }, []);

  const seasons = useMemo(
    () =>
      [...new Set(moves.map((move) => Number(move.season)).filter(Boolean))]
        .sort((a, b) => b - a),
    [moves],
  );

  const activeSeason = seasons[0] || 0;

  useEffect(() => {
    if (!historySeason && seasons.length > 1) {
      setHistorySeason(seasons[1]);
    } else if (!historySeason && seasons.length === 1) {
      setHistorySeason(seasons[0]);
    }
  }, [seasons, historySeason]);

  const tierMatches = (move) => tier === "ALL" || move.tier === tier;

  const openJobs = useMemo(
    () =>
      moves.filter(
        (move) =>
          Number(move.season) === Number(activeSeason) &&
          move.isOpen &&
          tierMatches(move),
      ),
    [moves, activeSeason, tier],
  );

  const recentMoves = useMemo(
    () =>
      moves.filter(
        (move) =>
          Number(move.season) === Number(activeSeason) &&
          !move.isOpen &&
          tierMatches(move),
      ),
    [moves, activeSeason, tier],
  );

  const historyMoves = useMemo(
    () =>
      moves.filter(
        (move) =>
          Number(move.season) === Number(historySeason) &&
          tierMatches(move),
      ),
    [moves, historySeason, tier],
  );

  return (
    <main className="coach-carousel-page">
      <PageHeader
        eyebrow="MESH Football"
        title="Coach Carousel"
        description="Open jobs, coaching changes and the offseason movement archive."
        imageSrc={meshShield}
        imageAlt="MESH Football shield"
        accent="league"
        size="compact"
      />

      <section className="carousel-controls">
        <div className="carousel-tier-tabs">
          {TIERS.map((item) => (
            <button
              type="button"
              key={item}
              className={[
                "carousel-tier-tab",
                item === tier ? "active" : "",
                item !== "ALL" ? `carousel-tier-tab-${item.toLowerCase()}` : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setTier(item)}
            >
              {item === "ALL" ? "All MESH" : item}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="carousel-state">
          <CircleDot size={22} />
          <strong>Loading Coach Carousel…</strong>
        </div>
      ) : error ? (
        <div className="carousel-state carousel-state-error">
          <strong>Coach Carousel unavailable</strong>
          <span>{error}</span>
        </div>
      ) : (
        <>
          <section className="carousel-section">
            <SectionHeading
              eyebrow={`${activeSeason} Carousel`}
              title="Open Jobs"
              count={openJobs.length}
            />

            {openJobs.length ? (
              <div className="carousel-grid">
                {openJobs.map((move) => (
                  <CarouselCard move={move} profileCoachIds={profileCoachIds} key={move.id} />
                ))}
              </div>
            ) : (
              <div className="carousel-empty">
                <BriefcaseBusiness size={20} />
                <div>
                  <strong>No open jobs right now</strong>
                  <span>
                    New openings will appear automatically when Status is set to
                    Open in COACH_CAROUSEL.
                  </span>
                </div>
              </div>
            )}
          </section>

          <section className="carousel-section">
            <SectionHeading
              eyebrow={`${activeSeason} Carousel`}
              title="Recent Coach Moves"
              count={recentMoves.length}
            />

            {recentMoves.length ? (
              <div className="carousel-grid">
                {recentMoves.map((move) => (
                  <CarouselCard move={move} profileCoachIds={profileCoachIds} key={move.id} />
                ))}
              </div>
            ) : (
              <div className="carousel-empty">
                <UserRound size={20} />
                <div>
                  <strong>No completed moves yet</strong>
                  <span>
                    Filled coaching changes for {activeSeason} will appear here.
                  </span>
                </div>
              </div>
            )}
          </section>

          <section className="carousel-section carousel-history-section">
            <div className="carousel-history-heading">
              <div>
                <span>Permanent Archive</span>
                <h2>Carousel History</h2>
              </div>

              <div className="carousel-season-tabs" aria-label="Carousel history season">
                {seasons.map((season) => (
                  <button
                    type="button"
                    key={season}
                    className={`carousel-season-tab ${
                      Number(historySeason) === Number(season) ? "active" : ""
                    }`}
                    onClick={() => setHistorySeason(season)}
                  >
                    {season}
                  </button>
                ))}
              </div>
            </div>

            {historyMoves.length ? (
              <div className="carousel-grid">
                {historyMoves.map((move) => (
                  <CarouselCard move={move} profileCoachIds={profileCoachIds} key={`history-${move.id}`} />
                ))}
              </div>
            ) : (
              <div className="carousel-empty">
                <History size={20} />
                <div>
                  <strong>No moves stored for this season</strong>
                  <span>Select another Carousel season.</span>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default CoachCarousel;
