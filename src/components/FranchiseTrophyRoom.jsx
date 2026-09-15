import { useEffect, useMemo, useState } from "react";
import { Crown, Shield, Trophy, X } from "lucide-react";
import { getTrophyAsset, WEEKLY_HIGH_SCORE_ASSETS } from "../data/trophyAssetMap";

function formatScore(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "—";
}

function years(values = []) {
  return values.length ? values.join("\n") : "—";
}

function bannerRows(tier, banner) {
  if (tier === "NFL") {
    return [
      ["Super Bowl Champion", banner?.superBowlChampions || []],
      ["Conference Champion", banner?.conferenceChampions || []],
      ["Division Champion", banner?.divisionChampions || []],
    ];
  }

  if (tier === "FBS") {
    return [
      ["National Champion", banner?.nationalChampions || []],
      ["Conference Champion", banner?.conferenceChampions || []],
      ["CFP Qualifier", banner?.cfpQualifiers || []],
    ];
  }

  return [
    ["National Champion", banner?.nationalChampions || []],
    ["Conference Champion", banner?.conferenceChampions || []],
    ["Playoff Qualifier", banner?.playoffQualifiers || []],
  ];
}

function isConferenceTrophy(event) {
  return String(event?.awardType || "").toLowerCase() === "conference_champion"
    || String(event?.assetKey || "").includes("_conference_");
}

function RoomTrophy({ event, onOpen }) {
  const asset = getTrophyAsset(event.assetKey);

  return (
    <button
      type="button"
      className="mesh-room-trophy"
      onClick={() => onOpen(event)}
      aria-label={`View ${event.awardName}`}
      title={event.awardName}
    >
      {asset ? <img src={asset} alt="" loading="lazy" /> : <Trophy size={34} />}
    </button>
  );
}

function TrophyCase({ title, trophies, onOpen, variant = "main" }) {
  return (
    <section className={`mesh-trophy-case mesh-trophy-case-${variant}`}>
      <div className="mesh-trophy-case-header">
        <span>{title}</span>
        <strong>{trophies.length}</strong>
      </div>

      <div className="mesh-trophy-case-glass">
        {trophies.length ? (
          <div className="mesh-trophy-shelves">
            {trophies.map((event) => (
              <RoomTrophy key={event.id} event={event} onOpen={onOpen} />
            ))}
          </div>
        ) : (
          <div className="mesh-trophy-case-empty">
            <Trophy size={30} />
            <span>Awaiting first championship</span>
          </div>
        )}
      </div>
    </section>
  );
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
    </div>
  );
}

function BannerShowcase({ franchise, rows, onClose }) {
  return (
    <div className="franchise-vault-showcase" role="dialog" aria-modal="true" aria-label="Franchise championship banner">
      <button type="button" className="franchise-vault-showcase-close" onClick={onClose}>
        <X size={20} />
        <span>Back to Trophy Room</span>
      </button>

      <div className="franchise-vault-showcase-inner">
        <div
          className="mesh-room-banner mesh-room-banner-expanded"
          style={{
            "--vault-primary": franchise?.primaryColor || "#12345a",
            "--vault-secondary": franchise?.secondaryColor || "#071728",
          }}
        >
          <div className="mesh-room-banner-logo">
            {franchise?.logo ? <img src={franchise.logo} alt="" /> : <Shield size={42} />}
          </div>
          <span>{franchise?.tier} Franchise</span>
          <h2>{franchise?.team || "MESH Franchise"}</h2>

          <div className="mesh-room-banner-rows">
            {rows.map(([label, values]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{years(values)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HighScoreShowcase({ franchise, weeklyHighScores, onClose }) {
  return (
    <div className="franchise-vault-showcase" role="dialog" aria-modal="true" aria-label="Weekly High Score plaque">
      <button type="button" className="franchise-vault-showcase-close" onClick={onClose}>
        <X size={20} />
        <span>Back to Trophy Room</span>
      </button>

      <div className="franchise-vault-showcase-inner">
        <div className="mesh-highscore-showcase">
          <img
            src={WEEKLY_HIGH_SCORE_ASSETS.franchise}
            alt="MESH Franchise Weekly High Score plaque"
          />
          <div className="mesh-highscore-live-list">
            <div className="mesh-highscore-live-title">
              <span>{franchise?.team || "MESH Franchise"}</span>
              <strong>Weekly High Score History</strong>
            </div>

            <div className="mesh-highscore-live-grid">
              {weeklyHighScores.length ? (
                weeklyHighScores.map((event) => (
                  <div key={event.id} className="mesh-highscore-live-row">
                    <span>{event.season}</span>
                    <span>Week {event.week}</span>
                    <strong>{formatScore(event.score)}</strong>
                    <small>{event.coachName || "Coach unavailable"}</small>
                  </div>
                ))
              ) : (
                <div className="mesh-highscore-live-empty">No Weekly High Score entries yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FranchiseTrophyRoom({ franchise, vault, onClose }) {
  const [selectedTrophy, setSelectedTrophy] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showPlaque, setShowPlaque] = useState(false);

  const trophies = vault?.trophies || [];
  const weeklyHighScores = vault?.weeklyHighScores || [];
  const banner = vault?.banner || null;
  const rows = bannerRows(franchise?.tier, banner);

  const { mainTrophies, conferenceTrophies } = useMemo(() => {
    const conference = trophies.filter(isConferenceTrophy);
    const main = trophies.filter((event) => !isConferenceTrophy(event));
    return { mainTrophies: main, conferenceTrophies: conference };
  }, [trophies]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (selectedTrophy) setSelectedTrophy(null);
      else if (showBanner) setShowBanner(false);
      else if (showPlaque) setShowPlaque(false);
      else onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, selectedTrophy, showBanner, showPlaque]);

  return (
    <div className="franchise-vault-overlay" role="dialog" aria-modal="true">
      <div
        className="mesh-franchise-room-shell"
        style={{
          "--vault-primary": franchise?.primaryColor || "#12345a",
          "--vault-secondary": franchise?.secondaryColor || "#071728",
        }}
      >
        <header className="franchise-vault-topbar">
          <button type="button" onClick={onClose} className="franchise-vault-close">
            <X size={20} />
            <span>Back to Franchise</span>
          </button>

          <div className="franchise-vault-topbar-title">
            <Crown size={18} />
            <strong>{franchise?.team || "MESH Franchise"} Trophy Room</strong>
          </div>
        </header>

        <main className="mesh-franchise-room">
          <div className="mesh-room-title">
            <span>{franchise?.tier} • {franchise?.conference}</span>
            <h1>{franchise?.team || "MESH Franchise"}</h1>
            <p>Franchise Trophy Room</p>
          </div>

          <div
              className={`mesh-room-scene ${String(franchise?.team || "").toLowerCase().includes("hawai") ? "mesh-room-scene-hawaii" : ""}`}
            >
            <div className="mesh-room-backwall" />

            <div className="mesh-room-main-case">
              <TrophyCase
                title="Championships & Bowl Wins"
                trophies={mainTrophies}
                onOpen={setSelectedTrophy}
                variant="main"
              />
            </div>

            <button
              type="button"
              className="mesh-room-banner-button"
              onClick={() => setShowBanner(true)}
              aria-label="View franchise championship banner"
            >
              <div className="mesh-room-banner">
                <div className="mesh-room-banner-logo">
                  {franchise?.logo ? <img src={franchise.logo} alt="" /> : <Shield size={42} />}
                </div>
                <span>{franchise?.tier} Franchise</span>
                <h2>{franchise?.team || "MESH Franchise"}</h2>

                <div className="mesh-room-banner-rows">
                  {rows.map(([label, values]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{years(values)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </button>

            <button
              type="button"
              className="mesh-room-plaque-button"
              onClick={() => setShowPlaque(true)}
              aria-label="View Weekly High Score plaque"
            >
              <div className="mesh-room-plaque-frame">
                <img src={WEEKLY_HIGH_SCORE_ASSETS.franchise} alt="" />
                <div className="mesh-room-plaque-overlay">
                  <span>Weekly High Scores</span>
                  <strong>{weeklyHighScores.length}</strong>
                </div>
              </div>
            </button>

            <div className="mesh-room-conference-case">
              <TrophyCase
                title="Conference Championships"
                trophies={conferenceTrophies}
                onOpen={setSelectedTrophy}
                variant="conference"
              />
            </div>

            <div className="mesh-room-hint">Tap any trophy, banner or plaque to view details</div>
          </div>
        </main>

        {selectedTrophy ? (
          <TrophyShowcase event={selectedTrophy} onClose={() => setSelectedTrophy(null)} />
        ) : null}

        {showBanner ? (
          <BannerShowcase franchise={franchise} rows={rows} onClose={() => setShowBanner(false)} />
        ) : null}

        {showPlaque ? (
          <HighScoreShowcase
            franchise={franchise}
            weeklyHighScores={weeklyHighScores}
            onClose={() => setShowPlaque(false)}
          />
        ) : null}
      </div>
    </div>
  );
}

export default FranchiseTrophyRoom;
