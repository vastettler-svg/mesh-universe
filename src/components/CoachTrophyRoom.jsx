import { useEffect, useState } from "react";
import { Award, Crown, Shield, Trophy, X } from "lucide-react";
import { getTrophyAsset, WEEKLY_HIGH_SCORE_ASSETS } from "../data/trophyAssetMap";

function formatScore(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "—";
}

function TrophyCard({ event, onOpen }) {
  const hasGameDetail = event.opponentName || event.score !== null;
  const asset = getTrophyAsset(event.assetKey);

  return (
    <button
      type="button"
      className="franchise-vault-trophy-card franchise-vault-trophy-button"
      onClick={() => onOpen(event)}
      aria-label={`View ${event.awardName}`}
    >
      <div className="franchise-vault-trophy-art" aria-hidden="true">
        {asset ? <img src={asset} alt="" loading="lazy" /> : <Trophy size={42} />}
      </div>

      <div className="franchise-vault-trophy-copy">
        <span>{event.season} • {event.tier}</span>
        <strong>{event.awardName}</strong>
        <small>{event.franchiseName || "MESH Franchise"}</small>
        {event.conferenceRecord ? (
          <div className="franchise-vault-result-line">
            Conference record: {event.conferenceRecord}
          </div>
        ) : hasGameDetail ? (
          <div className="franchise-vault-result-line">
            {event.opponentName ? `def. ${event.opponentName}` : "Championship result"}
            {event.score !== null && event.opponentScore !== null
              ? ` • ${formatScore(event.score)}–${formatScore(event.opponentScore)}`
              : ""}
          </div>
        ) : null}
        <small className="franchise-vault-view-label">Tap to view trophy</small>
      </div>
    </button>
  );
}

function tierCounts(trophies = []) {
  return ["NFL", "FBS", "FCS"].map((tier) => ({
    tier,
    count: trophies.filter((event) => event.tier === tier).length,
  }));
}

function TrophyShowcase({ event, onClose }) {
  if (!event) return null;
  const asset = getTrophyAsset(event.assetKey);

  return (
    <div className="franchise-vault-showcase" role="dialog" aria-modal="true" aria-label={event.awardName}>
      <button type="button" className="franchise-vault-showcase-close" onClick={onClose}>
        <X size={20} />
        <span>Back to Trophy Room</span>
      </button>
      <div className="franchise-vault-showcase-inner">
        <div className="franchise-vault-showcase-art">
          {asset ? <img src={asset} alt={`${event.awardName} trophy`} /> : <Trophy size={72} />}
        </div>
        <div className="franchise-vault-showcase-copy">
          <span>{event.season} • {event.tier}</span>
          <h2>{event.awardName}</h2>
          <strong>{event.franchiseName || "MESH Franchise"}</strong>
          {event.coachName ? <p>Coach: {event.coachName}</p> : null}
          {event.conferenceRecord ? (
            <p>Final conference record: {event.conferenceRecord}</p>
          ) : event.opponentName ? (
            <p>
              Defeated {event.opponentName}
              {event.score !== null && event.opponentScore !== null
                ? ` • ${formatScore(event.score)}–${formatScore(event.opponentScore)}`
                : ""}
            </p>
          ) : null}
        </div>
      </div>
      {selectedTrophy ? (
        <TrophyShowcase event={selectedTrophy} onClose={() => setSelectedTrophy(null)} />
      ) : null}
    </div>
  );
}

function CoachTrophyRoom({ coachName, currentTeam, vault, onClose }) {
  const [selectedTrophy, setSelectedTrophy] = useState(null);
  const trophies = vault?.trophies || [];
  const weeklyHighScores = vault?.weeklyHighScores || [];
  const counts = tierCounts(trophies);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="franchise-vault-overlay" role="dialog" aria-modal="true">
      <div className="franchise-vault-shell">
        <header className="franchise-vault-topbar">
          <button type="button" onClick={onClose} className="franchise-vault-close">
            <X size={20} />
            <span>Back to Coach</span>
          </button>

          <div className="franchise-vault-topbar-title">
            <Crown size={18} />
            <strong>Trophy Room</strong>
          </div>
        </header>

        <main className="franchise-vault-content">
          <section
            className={`franchise-vault-hero franchise-vault-hero-${String(currentTeam?.tier || "").toLowerCase()}`}
            style={{
              "--vault-primary": currentTeam?.primaryColor || "#12345a",
              "--vault-secondary": currentTeam?.secondaryColor || "#071728",
            }}
          >
            <div className="franchise-vault-hero-logo">
              {currentTeam?.logo ? (
                <img src={currentTeam.logo} alt={`${currentTeam.team || "Current franchise"} logo`} />
              ) : (
                <Shield size={42} />
              )}
            </div>

            <div>
              <span>Coach Trophy Room</span>
              <h1>{coachName || "MESH Coach"}</h1>
              <p>Career honors across every franchise and tier</p>
            </div>
          </section>

          <section className="franchise-vault-section">
            <div className="franchise-vault-section-heading">
              <div>
                <span>Career Legacy</span>
                <h2>Championship Collection</h2>
              </div>
              <Trophy size={22} />
            </div>

            <div className="coach-vault-tier-summary">
              {counts.map(({ tier, count }) => (
                <div key={tier} className={`coach-vault-tier-summary-card coach-vault-tier-${tier.toLowerCase()}`}>
                  <span>{tier}</span>
                  <strong>{count}</strong>
                  <small>{count === 1 ? "trophy" : "trophies"}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="franchise-vault-section">
            <div className="franchise-vault-section-heading">
              <div>
                <span>Championship Shelf</span>
                <h2>Trophies</h2>
              </div>
              <strong className="franchise-vault-count">{trophies.length}</strong>
            </div>

            {trophies.length ? (
              <div className="franchise-vault-trophy-grid">
                {trophies.map((event) => (
                  <TrophyCard key={event.id} event={event} onOpen={setSelectedTrophy} />
                ))}
              </div>
            ) : (
              <div className="franchise-vault-empty-shelf">
                <div className="franchise-vault-empty-pedestal">
                  <Trophy size={36} />
                </div>
                <strong>The trophy case is waiting for its first championship.</strong>
                <span>Future honors will appear here automatically throughout this coach&apos;s MESH career.</span>
              </div>
            )}
          </section>

          <section className="franchise-vault-section franchise-vault-weekly-section">
            <div className="franchise-vault-section-heading">
              <div>
                <span>Perpetual Plaque</span>
                <h2>Weekly High Scores</h2>
              </div>
              <Award size={22} />
            </div>

            <div className="franchise-vault-weekly-plaque">
              <div className="franchise-vault-plaque-art" aria-hidden="true">
                <img src={WEEKLY_HIGH_SCORE_ASSETS.coach} alt="" loading="lazy" />
              </div>
              <div className="franchise-vault-plaque-title">
                <Crown size={24} />
                <div>
                  <span>MESH Football</span>
                  <strong>Weekly High Score</strong>
                </div>
              </div>

              <div className="franchise-vault-plaque-entries">
                {weeklyHighScores.length ? (
                  weeklyHighScores.map((event) => (
                    <div key={event.id} className="franchise-vault-plaque-row">
                      <span>{event.season}</span>
                      <span>Week {event.week}</span>
                      <strong>{formatScore(event.score)}</strong>
                      <small>{event.franchiseName || "MESH Franchise"}</small>
                    </div>
                  ))
                ) : (
                  <div className="franchise-vault-plaque-empty">
                    No Weekly High Score entries yet.
                  </div>
                )}

                {Array.from({ length: Math.max(3, 6 - weeklyHighScores.length) }).map((_, index) => (
                  <div key={`future-${index}`} className="franchise-vault-plaque-row franchise-vault-plaque-row-empty">
                    <span>—</span><span>Future</span><strong>—</strong><small>Reserved</small>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default CoachTrophyRoom;
