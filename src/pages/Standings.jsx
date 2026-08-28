import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  CircleMinus,
  Flame,
  Medal,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";

import PageHeader from "../components/PageHeader";
import { getGameResults, getStandingsArchive, getStandingsData } from "../services/googleSheets";
import meshShield from "../assets/logos/mfl-shield.png";

import { MESH_PATCHES } from "../assets/logos/patches";

import "../styles/standings.css";

const primaryFilters = [
  { id: "overview", label: "Pulse" },
  { id: "nfl", label: "NFL" },
  { id: "fbs", label: "FBS" },
  { id: "fcs", label: "FCS" },
];

const secondaryFilters = {
  nfl: [
    { id: "all", label: "All NFL" },
    { id: "afc", label: "AFC" },
    { id: "nfc", label: "NFC" },
    { id: "playoff-picture", label: "Playoff Picture" },
    { id: "playoff-bracket", label: "Playoff Bracket" },
  ],
  fbs: [
    { id: "top-25", label: "Top 25" },
    { id: "overall", label: "Overall" },
    { id: "acc", label: "ACC" },
    { id: "big-ten", label: "Big Ten" },
    { id: "big-12", label: "Big 12" },
    { id: "mac", label: "MAC" },
    { id: "mountain-west", label: "Mountain West" },
    { id: "sec", label: "SEC" },
    { id: "sun-belt", label: "Sun Belt" },
    { id: "cfp", label: "CFP" },
    { id: "bowl-games", label: "Bowl Games" },
  ],
  fcs: [
    { id: "top-25", label: "Top 25" },
    { id: "overall", label: "Overall" },
    { id: "big-sky", label: "Big Sky" },
    { id: "coastal", label: "Coastal" },
    { id: "ivy", label: "Ivy" },
    { id: "mvc", label: "Missouri Valley" },
    { id: "northeast", label: "Northeast" },
    { id: "southland", label: "Southland" },
    { id: "playoff-bracket", label: "Playoff Bracket" },
  ],
};

const nflDivisionFilters = {
  afc: [
    { id: "all", label: "All AFC" },
    { id: "east", label: "East" },
    { id: "north", label: "North" },
    { id: "south", label: "South" },
    { id: "west", label: "West" },
  ],
  nfc: [
    { id: "all", label: "All NFC" },
    { id: "east", label: "East" },
    { id: "north", label: "North" },
    { id: "south", label: "South" },
    { id: "west", label: "West" },
  ],
};

const standingsPatchMap = {
  nfl: {
    all: MESH_PATCHES.tier.NFL,
    "playoff-picture": MESH_PATCHES.tier.NFL,
    "playoff-bracket": MESH_PATCHES.tier.NFL,
    afc: MESH_PATCHES.NFL.AFC,
    nfc: MESH_PATCHES.NFL.NFC,
  },

  fbs: {
    "top-25": MESH_PATCHES.tier.FBS,
    overall: MESH_PATCHES.tier.FBS,
    cfp: MESH_PATCHES.tier.FBS,
    "bowl-games": MESH_PATCHES.tier.FBS,
    acc: MESH_PATCHES.FBS.ACC,
    "big-ten": MESH_PATCHES.FBS["Big Ten"],
    "big-12": MESH_PATCHES.FBS["Big 12"],
    mac: MESH_PATCHES.FBS.MAC,
    "mountain-west": MESH_PATCHES.FBS["Mountain West"],
    sec: MESH_PATCHES.FBS.SEC,
    "sun-belt": MESH_PATCHES.FBS["Sun Belt"],
  },

  fcs: {
    "top-25": MESH_PATCHES.tier.FCS,
    overall: MESH_PATCHES.tier.FCS,
    "playoff-bracket": MESH_PATCHES.tier.FCS,
    "big-sky": MESH_PATCHES.FCS["Big Sky"],
    coastal: MESH_PATCHES.FCS.CAA,
    ivy: MESH_PATCHES.FCS.Ivy,
    mvc: MESH_PATCHES.FCS.MVC,
    northeast: MESH_PATCHES.FCS.NEC,
    southland: MESH_PATCHES.FCS.Southland,
  },
};

function normalizeSlug(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function conferenceMatches(team, filterId) {
  const conferenceId = normalizeSlug(team.conferenceId || team.conference);
  const aliases = {
    coastal: ["coastal", "caa", "coastal-athletic-association"],
    mvc: ["mvc", "missouri-valley", "missouri-valley-conference"],
    ivy: ["ivy", "ivy-league"],
    northeast: ["northeast", "nec"],
    southland: ["southland", "slc"],
  };

  return aliases[filterId]
    ? aliases[filterId].includes(conferenceId)
    : conferenceId === filterId;
}

function divisionMatches(team, divisionFilter) {
  const divisionId = normalizeSlug(team.divisionId || team.division);
  return divisionId === divisionFilter || divisionId.endsWith(`-${divisionFilter}`);
}

function formatPoints(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(1) : "0.0";
}

function formatConferenceTag(value) {
  const label = String(value ?? "").trim();

  const displayLabels = {
    "Mountain West": "Mtn West",
    "Missouri Valley": "MVC",
    "Missouri Valley Conference": "MVC",
    "Coastal Athletic Association": "CAA",
    Coastal: "CAA",
    Northeast: "NEC",
    "Northeast Conference": "NEC",
    Southland: "SLC",
    "Southland Conference": "SLC",
  };

  return displayLabels[label] || label;
}

function TierBadge({ tier, tierClass }) {
  return (
    <span className={`standings-tier-badge standings-tier-badge-${tierClass}`}>
      {tier}
    </span>
  );
}

function MovementIndicator({ movement, isNew = false }) {
  if (isNew) {
    return (
      <span className="standings-movement standings-movement-new">
        NEW
      </span>
    );
  }

  if (movement > 0) {
    return (
      <span className="standings-movement standings-movement-up">
        <ArrowUp size={13} />
        {movement}
      </span>
    );
  }

  if (movement < 0) {
    return (
      <span className="standings-movement standings-movement-down">
        <ArrowDown size={13} />
        {Math.abs(movement)}
      </span>
    );
  }

  return (
    <span className="standings-movement standings-movement-even">
      <CircleMinus size={13} />
    </span>
  );
}

function StandingsRow({
  team,
  isTop25View = false,
  showTop25Prefix = false,
}) {
  const teamName = team.team || "Unnamed Franchise";
  const hasRank = Number(team.rank) > 0 && Number(team.rank) < 999;
  const movement = isTop25View ? team.top25Movement : team.movement;
  const isNew = isTop25View ? team.isNewTop25 : false;

  const teamStyle = {};

  if (team.primaryColor) {
    teamStyle["--team-primary"] = team.primaryColor;
  }

  if (team.secondaryColor) {
    teamStyle["--team-secondary"] = team.secondaryColor;
  }

  const shortRecordLabel = (label) => {
    if (label === "Overall") return "OVR";
    if (label === "Conference") return "CONF";
    return label === "Record" ? "RECORD" : String(label || "").toUpperCase();
  };

  return (
    <article
      className={[
        "standings-row",
        `standings-row-${team.status}`,
        `standings-row-${team.tierClass}`,
        team.logo ? "standings-row-branded" : "",
        isTop25View ? "standings-row-top25" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={teamStyle}
    >
      <div className="standings-rank">
        <strong>{hasRank ? team.rank : "—"}</strong>
        <MovementIndicator movement={movement} isNew={isNew} />
      </div>

      {team.franchiseId ? (
        <Link
          to={`/league/franchises/${encodeURIComponent(team.franchiseId)}`}
          className="standings-franchise-logo-link"
          aria-label={`Open ${teamName} franchise profile`}
        >
          <div
            className={`standings-team-logo standings-team-logo-${team.tierClass}`}
            title={teamName}
          >
            {team.logo ? (
              <img
                src={team.logo}
                alt={`${teamName} logo`}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span>{teamName.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </Link>
      ) : (
        <div
          className={`standings-team-logo standings-team-logo-${team.tierClass}`}
          title={teamName}
        >
          {team.logo ? (
            <img
              src={team.logo}
              alt={`${teamName} logo`}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span>{teamName.charAt(0).toUpperCase()}</span>
          )}
        </div>
      )}

      <div className="standings-team-info">
        <strong className="standings-team-name">
          {team.franchiseId ? (
            <Link
              to={`/league/franchises/${encodeURIComponent(team.franchiseId)}`}
              className="standings-franchise-name-link"
            >
              {showTop25Prefix &&
              Number(team.top25Rank) >= 1 &&
              Number(team.top25Rank) <= 25
                ? `#${team.top25Rank} ${teamName}`
                : teamName}
            </Link>
          ) : (
            <>
              {showTop25Prefix &&
              Number(team.top25Rank) >= 1 &&
              Number(team.top25Rank) <= 25
                ? `#${team.top25Rank} ${teamName}`
                : teamName}
            </>
          )}
        </strong>
        <span className="standings-coach">
          {team.coach || "Coach unavailable"}
        </span>

        <div className="standings-inline-records">
          {team.recordLines.map((line) => (
            <span key={`${team.id}-${line.label}`}>
              <small>{shortRecordLabel(line.label)}</small>
              <strong>{line.value || "0–0"}</strong>
            </span>
          ))}

          {isTop25View ? (
            <span className="standings-rpi">
              <small>RPI</small>
              <strong>
                {Number.isFinite(Number(team.rpi))
                  ? Number(team.rpi).toFixed(3)
                  : "—"}
              </strong>
            </span>
          ) : null}
        </div>
      </div>

      {team.franchiseId ? (
        <Link
          to={`/league/franchises/${encodeURIComponent(team.franchiseId)}`}
          className="standings-row-action"
          aria-label={`View ${teamName} franchise profile`}
        >
          <ChevronRight size={17} />
        </Link>
      ) : (
        <button
          type="button"
          className="standings-row-action"
          aria-label={`View ${teamName}`}
        >
          <ChevronRight size={17} />
        </button>
      )}

      <div className="standings-points-status">
        <span className="standings-conference-badge">
          {formatConferenceTag(team.conference || team.tier)}
        </span>

        <div className="standings-footer-status">
          {team.statusLabel ? (
            <span className={`standings-status standings-status-${team.status}`}>
              {team.statusLabel}
            </span>
          ) : null}
        </div>

        <span className="standings-pf-value">
          <small>PF</small>
          <strong>{formatPoints(team.pointsFor)}</strong>
        </span>
      </div>
    </article>
  );
}

function StandingsLine({ type, label }) {
  const LineIcon = type === "promotion" ? ArrowUp : ArrowDown;
  return (
    <div className={`standings-line standings-line-${type}`}>
      <span>
        <LineIcon size={13} />
        {label}
      </span>
    </div>
  );
}

function StandingsList({
  teams,
  tierClass,
  showTierLines = true,
  isTop25View = false,
  showTop25Prefix = false,
}) {
  const relegationStart =
    tierClass === "nfl" ? 29 : tierClass === "fbs" ? 91 : null;

  return (
    <div className="standings-list">
      <div className="standings-list-columns">
        <span>Rank</span>
        <span>Team</span>
        <span>Record</span>
        <span>Points</span>
      </div>

      {teams.map((team, index) => (
        <div key={team.id}>
          {showTierLines &&
          relegationStart &&
          index > 0 &&
          teams[index - 1].rank < relegationStart &&
          team.rank >= relegationStart ? (
            <StandingsLine type="relegation" label="Relegation Line" />
          ) : null}

          <StandingsRow
            team={team}
            isTop25View={isTop25View}
            showTop25Prefix={showTop25Prefix}
          />
        </div>
      ))}
    </div>
  );
}


function PulseMovementRow({
  label,
  team,
  coach,
  movement,
  isNew = false,
  entries = [],
}) {
  const hasMovement = Number.isFinite(Number(movement)) && Number(movement) !== 0;
  const hasEntries = Array.isArray(entries) && entries.length > 0;

  if (hasEntries) {
    return (
      <div className="standings-pulse-movement-row standings-pulse-movement-row-list">
        <span>{label}</span>

        <div className="standings-pulse-entry-list">
          {entries.map((entry) => (
            <div
              className="standings-pulse-entry"
              key={`${entry.rank}-${entry.team}`}
            >
              <div className="standings-pulse-entry-name">
                <strong>
                  {entry.rank ? `#${entry.rank} ${entry.team}` : entry.team}
                </strong>
                {entry.coach ? <span>{entry.coach}</span> : null}
              </div>

              <small className="standings-pulse-new">NEW</small>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="standings-pulse-movement-row">
      <span>{label}</span>
      <div className="standings-pulse-movement-team">
        <div className="standings-pulse-movement-name">
          <strong>{team || (isNew ? "No new entrant" : "No movement yet")}</strong>

          {team && coach ? (
            <span className="standings-pulse-movement-coach">{coach}</span>
          ) : null}
        </div>

        {isNew && team ? (
          <small className="standings-pulse-new">NEW</small>
        ) : hasMovement ? (
          <small
            className={
              Number(movement) > 0
                ? "standings-pulse-up"
                : "standings-pulse-down"
            }
          >
            {Number(movement) > 0 ? "▲" : "▼"} {Math.abs(Number(movement))}
          </small>
        ) : null}
      </div>
    </div>
  );
}

function PulseCutoff({ rows, lineAfter = 2 }) {
  return (
    <div className="standings-pulse-cutoff">
      <span className="standings-pulse-cutoff-label">Relegation Watch</span>

      <div className="standings-pulse-cutoff-list">
        {rows.map((row, index) => (
          <div key={`${row.rank}-${row.team || "open"}`}>
            {index === lineAfter ? (
              <div className="standings-pulse-relegation-line">
                <span>Relegation Line</span>
              </div>
            ) : null}

            <div
              className={[
                "standings-pulse-cutoff-row",
                row.danger ? "standings-pulse-cutoff-row-danger" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <strong>{row.rank}</strong>

              <div className="standings-pulse-cutoff-team">
                <span>{row.team || "—"}</span>
                {row.team && row.coach ? <small>{row.coach}</small> : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PulseCard({
  tier,
  tierClass,
  patch,
  leader,
  leaderCoach,
  statRows = [],
  movementRows = [],
  cutoffRows = [],
  onOpen,
}) {
  return (
    <button
      type="button"
      className={`standings-pulse-card standings-pulse-tier standings-pulse-tier-${tierClass} standings-pulse-card-clickable`}
      onClick={onOpen}
      aria-label={`Open ${tier} standings`}
    >
      <div className="standings-pulse-top">
        <img
          className="standings-pulse-patch"
          src={patch}
          alt={`${tier} MESH patch`}
        />

        <div className="standings-pulse-card-title">
          <span>{tier} Pulse</span>
          <strong>Live Standings Snapshot</strong>
        </div>

        <div className="standings-pulse-open">
          <TierBadge tier={tier} tierClass={tierClass} />
          <ChevronRight size={16} />
        </div>
      </div>

      {statRows.length > 0 ? (
        <div
          className={[
            "standings-pulse-tier-stats",
            statRows.length >= 3 ? "standings-pulse-tier-stats-three" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {statRows.map((stat) => (
            <div key={`${tier}-${stat.label}`}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="standings-pulse-live-leader">
        <span>Current No. 1</span>

        <div className="standings-pulse-leader-line">
          <strong>{leader || "Season not started"}</strong>

          {leader && leaderCoach ? (
            <small>{leaderCoach}</small>
          ) : null}
        </div>
      </div>

      {movementRows.length > 0 ? (
        <div className="standings-pulse-movement-list">
          {movementRows.map((row) => (
            <PulseMovementRow key={row.label} {...row} />
          ))}
        </div>
      ) : null}

      {cutoffRows.length > 0 ? <PulseCutoff rows={cutoffRows} /> : null}
    </button>
  );
}



function ChampionshipWinnerLogo({
  game,
  label,
  className = "",
}) {
  const winnerId = game?.winnerId || "";
  const winnerIsTeam1 = winnerId && winnerId === game?.team1Id;
  const winnerIsTeam2 = winnerId && winnerId === game?.team2Id;

  const logo = winnerIsTeam1
    ? game?.team1Logo
    : winnerIsTeam2
      ? game?.team2Logo
      : "";

  const teamName = winnerIsTeam1
    ? game?.team1Team
    : winnerIsTeam2
      ? game?.team2Team
      : "";

  return (
    <div className={`championship-winner-showcase ${className}`}>
      <div className="championship-winner-logo">
        {logo ? (
          <img src={logo} alt={`${teamName || "Champion"} logo`} />
        ) : (
          <span>?</span>
        )}
      </div>
      <strong>{label}</strong>
    </div>
  );
}

function canOpenPostseasonGameCenter(game) {
  return Boolean(game?.gameId) && Number(game?.season) >= 2026;
}

function NflPlayoffCard({ game, label, placeholder = "Matchup TBD" }) {
  return (
    <div className={`fbs-postseason-game nfl-modern-game ${!game ? "fbs-postseason-game-empty" : ""}`}>
      <div className="fbs-postseason-game-label">
        <span>{label}</span>
        <small>{game?.statusLabel || (game ? `Week ${game.week}` : placeholder)}</small>
      </div>

      <FbsPostseasonTeam
        game={game}
        side={1}
        winnerId={game?.winnerId}
        showCoach
        showRecord={false}
      />
      <FbsPostseasonTeam
        game={game}
        side={2}
        winnerId={game?.winnerId}
        showCoach
        showRecord={false}
      />

      {canOpenPostseasonGameCenter(game) ? (
        <Link
          className="fbs-postseason-game-center nfl-modern-game-center"
          to={`/game/${encodeURIComponent(game.gameId)}`}
        >
          Game Center <ChevronRight size={13} />
        </Link>
      ) : null}
    </div>
  );
}

function NflConferenceModernBracket({ conference, games, mirrored = false }) {
  const byWeek = (week) =>
    games
      .filter((game) => Number(game.week) === week)
      .sort((a, b) => {
        const aSeed = Math.min(
          Number(a.team1GameRank) || 99,
          Number(a.team2GameRank) || 99,
        );
        const bSeed = Math.min(
          Number(b.team1GameRank) || 99,
          Number(b.team2GameRank) || 99,
        );

        return aSeed - bSeed || Number(a.gameNumber) - Number(b.gameNumber);
      });

  const wildCardGames = byWeek(14);
  const divisionalGames = byWeek(15);
  const championshipGames = byWeek(16);

  const findWildCardPair = (a, b) =>
    wildCardGames.find((game) => {
      const seeds = [
        Number(game.team1GameRank),
        Number(game.team2GameRank),
      ].sort((x, y) => x - y);

      return (
        seeds[0] === Math.min(a, b) &&
        seeds[1] === Math.max(a, b)
      );
    });

  const wildCardSlots = [
    { label: "#4 vs #5", game: findWildCardPair(4, 5) },
    { label: "#3 vs #6", game: findWildCardPair(3, 6) },
    { label: "#2 vs #7", game: findWildCardPair(2, 7) },
  ];

  const wildCardColumn = (
    <section className="nfl-modern-round nfl-modern-wild-card">
      <div className="fbs-cfp-round-heading">
        <span>Week 14</span>
        <strong>Wild Card</strong>
      </div>

      <div className="nfl-modern-bye">#1 Seed · First-Round Bye</div>

      <div className="nfl-modern-wild-stack">
        {wildCardSlots.map((slot, index) => (
          <div
            className="nfl-modern-wild-slot"
            key={`${conference}-wc-${index}`}
          >
            <NflPlayoffCard
              game={slot.game}
              label={slot.label}
              placeholder="Wild Card matchup"
            />
          </div>
        ))}
      </div>
    </section>
  );

  const divisionalColumn = (
    <section className="nfl-modern-round nfl-modern-divisional">
      <div className="fbs-cfp-round-heading">
        <span>Week 15</span>
        <strong>Divisional</strong>
      </div>

      <div className="nfl-modern-reseed">
        Reseeded · highest remaining seed vs lowest
      </div>

      <div className="nfl-modern-divisional-stack">
        {[0, 1].map((index) => (
          <div
            className="nfl-modern-divisional-slot"
            key={`${conference}-div-${index}`}
          >
            <NflPlayoffCard
              game={divisionalGames[index]}
              label={`Divisional ${index + 1}`}
              placeholder="Reseeded matchup"
            />
          </div>
        ))}
      </div>
    </section>
  );

  const conferenceTitleColumn = (
    <section className="nfl-modern-round nfl-modern-conference-title">
      <div className="fbs-cfp-round-heading">
        <span>Week 16</span>
        <strong>{conference} Championship</strong>
      </div>

      <div className="nfl-modern-title-slot">
        <NflPlayoffCard
          game={championshipGames[0]}
          label={`${conference} Championship`}
          placeholder="Conference Championship matchup"
        />
      </div>
    </section>
  );

  const columns = mirrored
    ? [conferenceTitleColumn, divisionalColumn, wildCardColumn]
    : [wildCardColumn, divisionalColumn, conferenceTitleColumn];

  return (
    <div
      className={[
        "nfl-modern-conference",
        mirrored ? "nfl-modern-conference-mirrored" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="nfl-modern-conference-heading">
        <span>{conference}</span>
        <strong>{conference} Playoffs</strong>
      </div>

      <div className="nfl-modern-conference-columns">
        {columns}
      </div>
    </div>
  );
}

function NflPlayoffBracket({ games, loading, error }) {
  const availableSeasons = useMemo(() => {
    const gameSeasons = games
      .filter(
        (game) =>
          game.tierClass === "nfl" &&
          Number(game.week) >= 14 &&
          Number(game.week) <= 17,
      )
      .map((game) => Number(game.season))
      .filter(Boolean);

    return [...new Set([2026, 2025, 2024, ...gameSeasons])].sort(
      (a, b) => b - a,
    );
  }, [games]);

  const [season, setSeason] = useState(2026);

  const seasonGames = useMemo(
    () =>
      games.filter(
        (game) =>
          game.tierClass === "nfl" &&
          Number(game.season) === Number(season) &&
          Number(game.week) >= 14 &&
          Number(game.week) <= 17,
      ),
    [games, season],
  );

  const conferenceOf = (game) => {
    const text =
      `${game.gameCategory || ""} ${game.gameType || ""} ${game.label || ""}`.toUpperCase();

    if (text.includes("AFC")) return "AFC";
    if (text.includes("NFC")) return "NFC";

    const teamText =
      `${game.team1Conference || ""} ${game.team2Conference || ""}`.toUpperCase();

    if (teamText.includes("AFC")) return "AFC";
    if (teamText.includes("NFC")) return "NFC";

    return "";
  };

  const afcGames = seasonGames.filter(
    (game) => Number(game.week) <= 16 && conferenceOf(game) === "AFC",
  );
  const nfcGames = seasonGames.filter(
    (game) => Number(game.week) <= 16 && conferenceOf(game) === "NFC",
  );
  const superBowl =
    seasonGames.find((game) => Number(game.week) === 17) || null;

  if (loading) {
    return (
      <div className="standings-postseason-note">
        Loading NFL playoff history…
      </div>
    );
  }

  if (error) {
    return <div className="standings-postseason-note">{error}</div>;
  }

  return (
    <div className="nfl-playoff-bracket nfl-playoff-bracket-modern">
      <div className="nfl-bracket-topbar">
        <div>
          <span>NFL Postseason</span>
          <h3>{season} MESH NFL Playoffs</h3>
          <p>
            14 teams · four division champions per conference · three Wild Cards
            · #1 seeds receive first-round byes · Divisional Round reseeding.
          </p>
        </div>

        <label className="nfl-bracket-season-picker">
          <span>Season</span>
          <select
            value={season}
            onChange={(event) => setSeason(Number(event.target.value))}
          >
            {availableSeasons.map((year) => (
              <option value={year} key={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="nfl-modern-scroll">
        <div className="nfl-modern-board">
          <NflConferenceModernBracket
            conference="AFC"
            games={afcGames}
          />

          <section className="nfl-modern-super-bowl">
            <div className="fbs-cfp-round-heading">
              <span>Week 17</span>
              <strong>Super Bowl</strong>
            </div>

            <div className="nfl-modern-super-bowl-center">
              <ChampionshipWinnerLogo
                game={superBowl}
                label="NFL CHAMPION"
                className="championship-winner-showcase-nfl"
              />

              <NflPlayoffCard
                game={superBowl}
                label="Super Bowl"
                placeholder="AFC Champion vs NFC Champion"
              />
            </div>
          </section>

          <NflConferenceModernBracket
            conference="NFC"
            games={nfcGames}
            mirrored
          />
        </div>
      </div>
    </div>
  );
}

function FbsPostseasonTeam({
  game,
  side,
  winnerId,
  showCoach = false,
  showRecord = false,
}) {
  const isTeam1 = side === 1;
  const franchiseId = isTeam1 ? game?.team1Id : game?.team2Id;
  const team = isTeam1 ? game?.team1Team : game?.team2Team;
  const logo = isTeam1 ? game?.team1Logo : game?.team2Logo;
  const seed = isTeam1 ? game?.team1GameRank : game?.team2GameRank;
  const coach = isTeam1 ? game?.team1Coach : game?.team2Coach;
  const overallRecord = isTeam1
    ? game?.team1OverallRecord
    : game?.team2OverallRecord;
  const score = isTeam1 ? game?.team1Score : game?.team2Score;
  const isWinner = Boolean(franchiseId && winnerId && franchiseId === winnerId);
  const hasRank = Number(seed) > 0;

  if (!franchiseId && !team) {
    return (
      <div className="fbs-postseason-team fbs-postseason-team-empty">
        <span className="fbs-postseason-rank-space" />
        <span className="fbs-postseason-team-name">TBD</span>
        <strong>—</strong>
      </div>
    );
  }

  return (
    <div className={`fbs-postseason-team ${isWinner ? "winner" : ""}`}>
      {hasRank ? (
        <span className="fbs-postseason-seed">{seed}</span>
      ) : (
        <span className="fbs-postseason-rank-space" />
      )}

      {franchiseId ? (
        <Link
          className="fbs-postseason-team-link"
          to={`/league/franchises/${encodeURIComponent(franchiseId)}`}
        >
          <span className="fbs-postseason-mini-logo">
            {logo ? <img src={logo} alt="" loading="lazy" /> : team?.charAt(0)}
          </span>
          <span className="fbs-postseason-team-copy">
            <span className="fbs-postseason-team-name">{team || "TBD"}</span>
            {showRecord && coach ? (
              <small className="fbs-postseason-coach">{coach}</small>
            ) : null}
            {showCoach && coach ? (
              <small className="fbs-postseason-coach">{coach}</small>
            ) : null}
          </span>
        </Link>
      ) : (
        <span className="fbs-postseason-team-copy">
          <span className="fbs-postseason-team-name">{team || "TBD"}</span>
          {showCoach && coach ? (
            <small className="fbs-postseason-coach">{coach}</small>
          ) : null}
        </span>
      )}

      <strong>{score === null || score === undefined ? "—" : Number(score).toFixed(1)}</strong>
    </div>
  );
}

function FbsPostseasonGame({ game, label, placeholder = "Matchup TBD", bowl = false }) {
  return (
    <div
      className={[
        "fbs-postseason-game",
        bowl ? "fbs-bowl-game-card" : "",
        game?.bowlName ? "fbs-postseason-game-has-bowl-name" : "",
        !game ? "fbs-postseason-game-empty" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="fbs-postseason-game-label">
        <span>{game?.bowlName || label}</span>
        <small>{game?.statusLabel || (game ? `Week ${game.week}` : placeholder)}</small>
      </div>

      <FbsPostseasonTeam
        game={game}
        side={1}
        winnerId={game?.winnerId}
        showCoach={bowl}
        showRecord={!bowl}
      />
      <FbsPostseasonTeam
        game={game}
        side={2}
        winnerId={game?.winnerId}
        showCoach={bowl}
        showRecord={!bowl}
      />

      {canOpenPostseasonGameCenter(game) ? (
        <Link className="fbs-postseason-game-center" to={`/game/${encodeURIComponent(game.gameId)}`}>
          Game Center <ChevronRight size={13} />
        </Link>
      ) : null}
    </div>
  );
}

function isCfpGame(game) {
  const text = `${game?.gameCategory || ""} ${game?.gameType || ""} ${game?.label || ""} ${game?.bowlName || ""}`.toLowerCase();
  return (
    text.includes("cfp") ||
    text.includes("college football playoff") ||
    text.includes("national championship") ||
    text.includes("playoff first") ||
    text.includes("playoff quarter") ||
    text.includes("playoff semi")
  );
}

function FbsCfpBracket({ games, loading, error }) {
  const availableSeasons = useMemo(() => {
    const gameSeasons = games
      .filter((game) => game.tierClass === "fbs" && Number(game.week) >= 14 && Number(game.week) <= 17 && isCfpGame(game))
      .map((game) => Number(game.season))
      .filter(Boolean);

    return [...new Set([2026, 2025, 2024, ...gameSeasons])].sort((a, b) => b - a);
  }, [games]);

  const [season, setSeason] = useState(2026);

  const allSeasonFbsGames = useMemo(
    () =>
      games.filter(
        (game) =>
          game.tierClass === "fbs" &&
          Number(game.season) === Number(season),
      ),
    [games, season],
  );

  const seasonGames = useMemo(
    () =>
      allSeasonFbsGames.filter(
        (game) =>
          Number(game.week) >= 14 &&
          Number(game.week) <= 17 &&
          isCfpGame(game),
      ),
    [allSeasonFbsGames],
  );

  const byWeek = (week) =>
    seasonGames
      .filter((game) => Number(game.week) === week)
      .sort((a, b) => {
        const aSeed = Math.min(Number(a.team1GameRank) || 99, Number(a.team2GameRank) || 99);
        const bSeed = Math.min(Number(b.team1GameRank) || 99, Number(b.team2GameRank) || 99);
        return aSeed - bSeed || Number(a.gameNumber) - Number(b.gameNumber);
      });

  const firstRoundRaw = byWeek(14);
  const firstRoundByPair = (a, b) =>
    firstRoundRaw.find((game) => {
      const seeds = [Number(game.team1GameRank), Number(game.team2GameRank)].sort((x, y) => x - y);
      return seeds[0] === Math.min(a, b) && seeds[1] === Math.max(a, b);
    });

  // Fixed CFP path:
  // 8/9 -> #1, 5/12 -> #4, 6/11 -> #3, 7/10 -> #2.
  const firstRound = [
    firstRoundByPair(8, 9),
    firstRoundByPair(5, 12),
    firstRoundByPair(6, 11),
    firstRoundByPair(7, 10),
  ];

  const quarterfinals = byWeek(15);
  const quarterfinalForByeSeed = (byeSeed) =>
    quarterfinals.find(
      (game) =>
        Number(game.team1GameRank) === byeSeed ||
        Number(game.team2GameRank) === byeSeed,
    );
  const semifinals = byWeek(16);

  const championshipByIdentity =
    allSeasonFbsGames.find((game) => {
      const text = [
        game.gameCategory,
        game.gameType,
        game.label,
        game.bowlName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        text.includes("cfp national championship") ||
        text.includes("college football playoff national championship") ||
        text.includes("national championship")
      );
    }) || null;

  const championship =
    championshipByIdentity ||
    byWeek(17)[0] ||
    null;

  if (loading) return <div className="standings-postseason-note">Loading CFP history…</div>;
  if (error) return <div className="standings-postseason-note">{error}</div>;

  const pathRows = [
    {
      firstLabel: "#8 vs #9",
      byeSeed: 1,
      first: firstRound[0],
      quarter: quarterfinalForByeSeed(1),
    },
    {
      firstLabel: "#5 vs #12",
      byeSeed: 4,
      first: firstRound[1],
      quarter: quarterfinalForByeSeed(4),
    },
    {
      firstLabel: "#6 vs #11",
      byeSeed: 3,
      first: firstRound[2],
      quarter: quarterfinalForByeSeed(3),
    },
    {
      firstLabel: "#7 vs #10",
      byeSeed: 2,
      first: firstRound[3],
      quarter: quarterfinalForByeSeed(2),
    },
  ];

  return (
    <div className="fbs-cfp-bracket fbs-cfp-bracket-flow">
      <div className="fbs-postseason-topbar">
        <div>
          <span>FBS Postseason</span>
          <h3>{season} MESH College Football Playoff</h3>
          <p>12 teams · seven conference champions · five at-large selections · seeds #1–#4 receive first-round byes · fixed bracket.</p>
        </div>

        <label className="nfl-bracket-season-picker">
          <span>Season</span>
          <select value={season} onChange={(event) => setSeason(Number(event.target.value))}>
            {availableSeasons.map((year) => <option value={year} key={year}>{year}</option>)}
          </select>
        </label>
      </div>

      <div className="fbs-cfp-scroll">
        <div className="fbs-cfp-flow-board">
          <section className="fbs-cfp-flow-column fbs-cfp-first-column">
            <div className="fbs-cfp-round-heading"><span>Week 14</span><strong>First Round</strong></div>
            <div className="fbs-cfp-flow-stack">
              {pathRows.map((row) => (
                <div className="fbs-cfp-path-row" key={row.firstLabel}>
                  <FbsPostseasonGame game={row.first} label={row.firstLabel} placeholder="First Round matchup" />
                </div>
              ))}
            </div>
          </section>

          <section className="fbs-cfp-flow-column fbs-cfp-quarter-column">
            <div className="fbs-cfp-round-heading"><span>Week 15</span><strong>Quarterfinals</strong></div>
            <div className="fbs-cfp-fixed-note">Fixed bracket · no reseeding</div>
            <div className="fbs-cfp-flow-stack">
              {pathRows.map((row, index) => (
                <div className="fbs-cfp-path-row" key={`quarter-${row.byeSeed}`}>
                  <FbsPostseasonGame
                    game={row.quarter}
                    label={`Winner ${row.firstLabel} vs #${row.byeSeed}`}
                    placeholder={`Winner ${row.firstLabel} faces #${row.byeSeed}`}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="fbs-cfp-flow-column fbs-cfp-semi-column">
            <div className="fbs-cfp-round-heading"><span>Week 16</span><strong>Semifinals</strong></div>
            <div className="fbs-cfp-semi-stack">
              <div className="fbs-cfp-semi-slot">
                <FbsPostseasonGame game={semifinals[0]} label="Semifinal 1" placeholder="Winners of top two Quarterfinals" />
              </div>
              <div className="fbs-cfp-semi-slot">
                <FbsPostseasonGame game={semifinals[1]} label="Semifinal 2" placeholder="Winners of bottom two Quarterfinals" />
              </div>
            </div>
          </section>

          <section className="fbs-cfp-flow-column fbs-cfp-champ-column">
            <div className="fbs-cfp-champ-center">
              <div className="fbs-cfp-round-heading"><span>Week 17</span><strong>National Championship</strong></div>
              <ChampionshipWinnerLogo
                game={championship}
                label="FBS NATIONAL CHAMPION"
                className="championship-winner-showcase-fbs"
              />
              <FbsPostseasonGame game={championship} label="National Championship" placeholder="Semifinal winners" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function FbsBowlGames({ games, loading, error }) {
  const availableSeasons = useMemo(() => {
    const gameSeasons = games
      .filter((game) => game.tierClass === "fbs" && game.bowlName && !isCfpGame(game))
      .map((game) => Number(game.season))
      .filter(Boolean);

    return [...new Set([2026, 2025, 2024, ...gameSeasons])].sort((a, b) => b - a);
  }, [games]);

  const [season, setSeason] = useState(2026);

  const bowlGames = useMemo(
    () =>
      games
        .filter(
          (game) =>
            game.tierClass === "fbs" &&
            Number(game.season) === Number(season) &&
            [14, 15].includes(Number(game.week)) &&
            Boolean(game.bowlName) &&
            !isCfpGame(game),
        )
        .sort((a, b) => Number(a.week) - Number(b.week) || Number(a.gameNumber) - Number(b.gameNumber)),
    [games, season],
  );

  if (loading) return <div className="standings-postseason-note">Loading Bowl Games…</div>;
  if (error) return <div className="standings-postseason-note">{error}</div>;

  const week14 = bowlGames.filter((game) => Number(game.week) === 14);
  const week15 = bowlGames.filter((game) => Number(game.week) === 15);

  const renderWeek = (week, gamesForWeek, expected) => (
    <section className="fbs-bowl-week">
      <div className="fbs-bowl-week-heading">
        <div><span>Week {week}</span><strong>Bowl Games</strong></div>
        <small>{gamesForWeek.length || 0} of {expected} scheduled</small>
      </div>

      <div className="fbs-bowl-grid">
        {gamesForWeek.length ? (
          gamesForWeek.map((game) => (
            <FbsPostseasonGame key={game.gameId || `${week}-${game.gameNumber}`} game={game} label={game.bowlName || "Bowl Game"} bowl />
          ))
        ) : (
          <div className="fbs-bowl-empty">
            <Trophy size={20} />
            <strong>{expected} Bowl Games</strong>
            <span>Matchups will be scheduled following Week 13 Conference Championships.</span>
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div className="fbs-bowl-games">
      <div className="fbs-postseason-topbar">
        <div>
          <span>FBS Postseason</span>
          <h3>{season} MESH Bowl Games</h3>
          <p>Non-CFP bowls only · teams need six regular-season wins for bowl eligibility · matchups are assigned in GAME_RESULTS.</p>
        </div>

        <label className="nfl-bracket-season-picker">
          <span>Season</span>
          <select value={season} onChange={(event) => setSeason(Number(event.target.value))}>
            {availableSeasons.map((year) => <option value={year} key={year}>{year}</option>)}
          </select>
        </label>
      </div>

      {renderWeek(14, week14, 14)}
      {renderWeek(15, week15, 10)}
    </div>
  );
}


function FcsPlayoffBracket({ games, loading, error }) {
  const availableSeasons = useMemo(() => {
    const years = games
      .filter(
        (game) =>
          game.tierClass === "fcs" &&
          Number(game.week) >= 13 &&
          Number(game.week) <= 17,
      )
      .map((game) => Number(game.season))
      .filter(Boolean);

    return [...new Set([2026, 2025, 2024, ...years])].sort((a, b) => b - a);
  }, [games]);

  const [season, setSeason] = useState(2026);

  const seasonGames = useMemo(
    () =>
      games.filter(
        (game) =>
          game.tierClass === "fcs" &&
          Number(game.season) === Number(season) &&
          Number(game.week) >= 13 &&
          Number(game.week) <= 17,
      ),
    [games, season],
  );

  const byWeek = (week) =>
    seasonGames
      .filter((game) => Number(game.week) === week)
      .sort(
        (a, b) =>
          Number(a.gameNumber) - Number(b.gameNumber) ||
          Math.min(
            Number(a.team1GameRank) || 99,
            Number(a.team2GameRank) || 99,
          ) -
            Math.min(
              Number(b.team1GameRank) || 99,
              Number(b.team2GameRank) || 99,
            ),
      );

  const findSeedPair = (weekGames, a, b) =>
    weekGames.find((game) => {
      const seeds = [
        Number(game.team1GameRank),
        Number(game.team2GameRank),
      ].sort((x, y) => x - y);

      return (
        seeds[0] === Math.min(a, b) &&
        seeds[1] === Math.max(a, b)
      );
    });

  const gameContainsFranchise = (game, franchiseId) =>
    Boolean(
      game &&
        franchiseId &&
        (game.team1Id === franchiseId || game.team2Id === franchiseId),
    );

  const findAdvancementGame = (nextRoundGames, feederGames) => {
    const winnerIds = feederGames
      .map((game) => game?.winnerId)
      .filter(Boolean);

    if (winnerIds.length === 2) {
      const exact = nextRoundGames.find(
        (game) =>
          gameContainsFranchise(game, winnerIds[0]) &&
          gameContainsFranchise(game, winnerIds[1]),
      );
      if (exact) return exact;
    }

    if (winnerIds.length === 1) {
      const partial = nextRoundGames.find((game) =>
        gameContainsFranchise(game, winnerIds[0]),
      );
      if (partial) return partial;
    }

    return null;
  };

  const firstRoundGames = byWeek(13);
  const secondRoundGames = byWeek(14);
  const quarterfinalGames = byWeek(15);
  const semifinalGames = byWeek(16);
  const championshipGames = byWeek(17);

  /*
   * Fixed FCS bracket path.
   * Each Week 13 game feeds the bye seed immediately beside it.
   */
  const openingPaths = [
    { pair: [16, 17], bye: 1 },
    { pair: [9, 24], bye: 8 },
    { pair: [13, 20], bye: 4 },
    { pair: [12, 21], bye: 5 },
    { pair: [14, 19], bye: 3 },
    { pair: [11, 22], bye: 6 },
    { pair: [15, 18], bye: 2 },
    { pair: [10, 23], bye: 7 },
  ].map(({ pair, bye }) => {
    const first = findSeedPair(firstRoundGames, pair[0], pair[1]);

    const second =
      secondRoundGames.find(
        (game) =>
          Number(game.team1GameRank) === bye ||
          Number(game.team2GameRank) === bye,
      ) || null;

    return { pair, bye, first, second };
  });

  /*
   * Quarterfinal branches:
   * R2 1 + 2 -> QF1
   * R2 3 + 4 -> QF2
   * R2 5 + 6 -> QF3
   * R2 7 + 8 -> QF4
   *
   * Completed seasons are mapped by the actual winners from the two
   * feeder games. If winners are not known yet, GAME_RESULTS row order
   * is used only as a current-season placeholder.
   */
  const quarterBranches = [
    [openingPaths[0].second, openingPaths[1].second],
    [openingPaths[2].second, openingPaths[3].second],
    [openingPaths[4].second, openingPaths[5].second],
    [openingPaths[6].second, openingPaths[7].second],
  ].map((feeders, index) => ({
    feeders,
    game:
      findAdvancementGame(quarterfinalGames, feeders) ||
      quarterfinalGames[index] ||
      null,
  }));

  /*
   * Semifinal branches:
   * QF1 + QF2 -> SF1
   * QF3 + QF4 -> SF2
   */
  const semifinalBranches = [
    [quarterBranches[0].game, quarterBranches[1].game],
    [quarterBranches[2].game, quarterBranches[3].game],
  ].map((feeders, index) => ({
    feeders,
    game:
      findAdvancementGame(semifinalGames, feeders) ||
      semifinalGames[index] ||
      null,
  }));

  const championship =
    findAdvancementGame(
      championshipGames,
      semifinalBranches.map((branch) => branch.game),
    ) ||
    championshipGames[0] ||
    null;

  const secondRoundPlaceholder = (path) => ({
    team1GameRank: path.bye,
    team1Team: `#${path.bye} seed`,
    team2Team: "TBD",
    statusLabel: "Awaiting First Round",
  });

  if (loading) {
    return (
      <div className="standings-postseason-note">
        Loading FCS Playoff history…
      </div>
    );
  }

  if (error) {
    return <div className="standings-postseason-note">{error}</div>;
  }

  return (
    <div className="fcs-playoff-bracket">
      <div className="fbs-postseason-topbar fcs-postseason-topbar">
        <div>
          <span>FCS Postseason</span>
          <h3>{season} MESH FCS Football Playoff</h3>
          <p>
            24 teams · six conference champions · 18 at-large selections ·
            top eight seeds receive byes · fixed bracket with no reseeding.
          </p>
        </div>

        <label className="nfl-bracket-season-picker">
          <span>Season</span>
          <select
            value={season}
            onChange={(event) => setSeason(Number(event.target.value))}
          >
            {availableSeasons.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="fcs-playoff-scroll">
        <div className="fcs-playoff-board">
          <section className="fcs-playoff-column fcs-first-column">
            <div className="fbs-cfp-round-heading">
              <span>Week 13</span>
              <strong>First Round</strong>
            </div>

            <div className="fcs-opening-stack">
              {openingPaths.map((path) => (
                <div
                  className="fcs-path-row"
                  key={`fcs-first-${path.pair.join("-")}`}
                >
                  <FbsPostseasonGame
                    game={path.first}
                    label={`#${path.pair[0]} vs #${path.pair[1]}`}
                    placeholder="First Round matchup"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="fcs-playoff-column fcs-second-column">
            <div className="fbs-cfp-round-heading">
              <span>Week 14</span>
              <strong>Second Round</strong>
            </div>

            <div className="fcs-opening-stack">
              {openingPaths.map((path) => (
                <div
                  className="fcs-path-row"
                  key={`fcs-second-${path.bye}`}
                >
                  <FbsPostseasonGame
                    game={path.second || secondRoundPlaceholder(path)}
                    label={`#${path.bye} vs Winner ${path.pair[0]}/${path.pair[1]}`}
                    placeholder="Second Round matchup"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="fcs-playoff-column fcs-quarter-column">
            <div className="fbs-cfp-round-heading">
              <span>Week 15</span>
              <strong>Quarterfinals</strong>
            </div>

            <div className="fcs-quarter-stack">
              {quarterBranches.map((branch, index) => (
                <div
                  className="fcs-quarter-slot"
                  key={`fcs-quarter-${index + 1}`}
                >
                  <FbsPostseasonGame
                    game={branch.game}
                    label={`Quarterfinal ${index + 1}`}
                    placeholder={`Winners of Second Round games ${
                      index * 2 + 1
                    } & ${index * 2 + 2}`}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="fcs-playoff-column fcs-semi-column">
            <div className="fbs-cfp-round-heading">
              <span>Week 16</span>
              <strong>Semifinals</strong>
            </div>

            <div className="fcs-semi-stack">
              {semifinalBranches.map((branch, index) => (
                <div
                  className="fcs-semi-slot"
                  key={`fcs-semi-${index + 1}`}
                >
                  <FbsPostseasonGame
                    game={branch.game}
                    label={`Semifinal ${index + 1}`}
                    placeholder={`Winners of Quarterfinals ${
                      index * 2 + 1
                    } & ${index * 2 + 2}`}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="fcs-playoff-column fcs-title-column">
            <div className="fcs-title-center">
              <div className="fbs-cfp-round-heading">
                <span>Week 17</span>
                <strong>National Championship</strong>
              </div>

              <ChampionshipWinnerLogo
                game={championship}
                label="FCS NATIONAL CHAMPION"
                className="championship-winner-showcase-fcs"
              />

              <FbsPostseasonGame
                game={championship}
                label="FCS National Championship"
                placeholder="Semifinal winners"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function PostseasonShell({ tierClass, view, games = [], gamesLoading = false, gamesError = "" }) {
  if (tierClass === "nfl" && view === "playoff-bracket") {
    return <NflPlayoffBracket games={games} loading={gamesLoading} error={gamesError} />;
  }

  if (tierClass === "fbs" && view === "cfp") {
    return <FbsCfpBracket games={games} loading={gamesLoading} error={gamesError} />;
  }

  if (tierClass === "fbs" && view === "bowl-games") {
    return <FbsBowlGames games={games} loading={gamesLoading} error={gamesError} />;
  }

  if (tierClass === "fcs" && view === "playoff-bracket") {
    return <FcsPlayoffBracket games={games} loading={gamesLoading} error={gamesError} />;
  }

  const config = {
    "fbs:cfp": {
      eyebrow: "FBS Postseason",
      title: "College Football Playoff",
      description:
        "The MESH CFP field and complete championship bracket will live here.",
      phase: "Phase 4C",
      cards: ["CFP Field", "Playoff Bracket", "National Championship"],
    },
    "fbs:bowl-games": {
      eyebrow: "FBS Postseason",
      title: "Bowl Games",
      description:
        "Non-CFP bowl matchups will live here as their own postseason section, separate from the CFP.",
      phase: "Phase 4D",
      cards: ["Bowl Schedule", "Matchups & Scores", "Game Centers"],
    },
    "fcs:playoff-bracket": {
      eyebrow: "FCS Postseason",
      title: "FCS Playoff Bracket",
      description:
        "The complete FCS postseason path will live here from the opening round through the championship.",
      phase: "Phase 4E",
      cards: ["Opening Rounds", "Semifinals", "Championship"],
    },
  };

  const item = config[`${tierClass}:${view}`];
  if (!item) return null;

  return (
    <div className={`standings-postseason-shell standings-postseason-shell-${tierClass}`}>
      <div className="standings-postseason-hero">
        <div className="standings-postseason-icon"><Trophy size={24} /></div>
        <div>
          <span>{item.eyebrow}</span>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </div>
        <small>{item.phase}</small>
      </div>

      <div className="standings-postseason-preview-grid">
        {item.cards.map((card) => (
          <div className="standings-postseason-preview-card" key={card}>
            <span>Postseason</span>
            <strong>{card}</strong>
            <small>Framework ready</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function Standings() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlPrimary = searchParams.get("tier");
  const initialPrimary = primaryFilters.some((filter) => filter.id === urlPrimary)
    ? urlPrimary
    : "overview";

  const urlSecondary = searchParams.get("filter");
  const initialSecondary =
    secondaryFilters[initialPrimary]?.some((filter) => filter.id === urlSecondary)
      ? urlSecondary
      : initialPrimary === "nfl"
        ? "all"
        : initialPrimary === "fbs" || initialPrimary === "fcs"
          ? "top-25"
          : "overall";

  const urlDivision = searchParams.get("division");
  const initialDivision =
    nflDivisionFilters[initialSecondary]?.some((filter) => filter.id === urlDivision)
      ? urlDivision
      : "all";

  const urlSeason = Number(searchParams.get("season"));
  const initialSeason = [2026, 2025, 2024].includes(urlSeason) ? urlSeason : 2026;

  const [standingsData, setStandingsData] = useState([]);
  const [standingsArchive, setStandingsArchive] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(initialSeason);
  const [standingsLoading, setStandingsLoading] = useState(true);
  const [standingsError, setStandingsError] = useState("");
  const [playoffGames, setPlayoffGames] = useState([]);
  const [playoffGamesLoading, setPlayoffGamesLoading] = useState(true);
  const [playoffGamesError, setPlayoffGamesError] = useState("");
  const [selectedPrimaryFilter, setSelectedPrimaryFilter] = useState(initialPrimary);
  const [selectedSecondaryFilter, setSelectedSecondaryFilter] = useState(initialSecondary);
  const [selectedNflDivisionFilter, setSelectedNflDivisionFilter] = useState(initialDivision);

  useEffect(() => {
    let isMounted = true;

    async function loadStandings() {
      try {
        setStandingsLoading(true);
        setStandingsError("");
        const [liveData, archiveData] = await Promise.all([
          getStandingsData(),
          getStandingsArchive(),
        ]);

        if (isMounted) {
          setStandingsData(liveData);
          setStandingsArchive(archiveData);
        }
      } catch (error) {
        console.error("Unable to load standings:", error);
        if (isMounted) setStandingsError("Standings could not be loaded from Google Sheets.");
      } finally {
        if (isMounted) setStandingsLoading(false);
      }
    }

    loadStandings();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadPlayoffGames() {
      try {
        setPlayoffGamesLoading(true);
        setPlayoffGamesError("");
        const games = await getGameResults({ allSeasons: true });
        if (isMounted) setPlayoffGames(games);
      } catch (error) {
        console.error("Unable to load NFL playoff games:", error);
        if (isMounted) {
          setPlayoffGamesError("NFL playoff games could not be loaded from GAME_RESULTS.");
        }
      } finally {
        if (isMounted) setPlayoffGamesLoading(false);
      }
    }

    loadPlayoffGames();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const nextParams = new URLSearchParams();

    if (selectedSeason !== 2026) {
      nextParams.set("season", String(selectedSeason));
    }

    if (selectedPrimaryFilter !== "overview") {
      nextParams.set("tier", selectedPrimaryFilter);
      nextParams.set("filter", selectedSecondaryFilter);

      if (
        selectedPrimaryFilter === "nfl" &&
        (selectedSecondaryFilter === "afc" || selectedSecondaryFilter === "nfc")
      ) {
        nextParams.set("division", selectedNflDivisionFilter);
      }
    }

    setSearchParams(nextParams, { replace: true });
  }, [
    selectedPrimaryFilter,
    selectedSecondaryFilter,
    selectedNflDivisionFilter,
    selectedSeason,
    setSearchParams,
  ]);

  const activeSecondaryFilters = secondaryFilters[selectedPrimaryFilter] ?? [];
  const activePrimaryLabel = primaryFilters.find((filter) => filter.id === selectedPrimaryFilter)?.label ?? "Overview";
  const activeSecondaryLabel = activeSecondaryFilters.find((filter) => filter.id === selectedSecondaryFilter)?.label ?? "Overall";
  const activeNflDivisionFilters = nflDivisionFilters[selectedSecondaryFilter] ?? [];
  const activeNflDivisionLabel = activeNflDivisionFilters.find((filter) => filter.id === selectedNflDivisionFilter)?.label ?? "";

  /*
   * Current CFP field:
   * 7 current FBS conference leaders + the next 5 highest-ranked
   * at-large teams. The field stays blank during preseason until
   * at least one FBS game has been recorded.
   */
  const cfpFranchiseIds = useMemo(() => {
    const fbsTeams = standingsData.filter((team) => team.tierClass === "fbs");

    const seasonHasStarted = fbsTeams.some(
      (team) =>
        Number(team.regularSeasonWins) > 0 ||
        Number(team.regularSeasonLosses) > 0 ||
        Number(team.regularSeasonTies) > 0,
    );

    if (!seasonHasStarted) {
      return new Set();
    }

    const conferenceLeaders = fbsTeams
      .filter((team) => Number(team.conferenceRank) === 1)
      .sort((a, b) => (a.top25Rank || 999) - (b.top25Rank || 999));

    const selectedIds = new Set(
      conferenceLeaders.map((team) => team.franchiseId),
    );

    const atLarge = fbsTeams
      .filter(
        (team) =>
          !selectedIds.has(team.franchiseId) &&
          Number(team.top25Rank) >= 1 &&
          Number(team.top25Rank) <= 25,
      )
      .sort((a, b) => a.top25Rank - b.top25Rank)
      .slice(0, 5);

    atLarge.forEach((team) => selectedIds.add(team.franchiseId));

    return selectedIds;
  }, [standingsData]);

  const overviewData = useMemo(() => {
    const byTier = (tierClass) =>
      standingsData.filter((team) => team.tierClass === tierClass);

    const nflTeams = byTier("nfl");
    const fbsTeams = byTier("fbs");
    const fcsTeams = byTier("fcs");

    const rankedLeader = (teams, key) =>
      [...teams]
        .filter((team) => Number(team[key]) >= 1)
        .sort((a, b) => Number(a[key]) - Number(b[key]))[0] ?? null;

    const rankedAt = (teams, key, rank) =>
      teams.find((team) => Number(team[key]) === rank) ?? null;

    const biggestPositive = (teams, key) =>
      [...teams]
        .filter((team) => Number(team[key]) > 0)
        .sort((a, b) => Number(b[key]) - Number(a[key]))[0] ?? null;

    const biggestNegative = (teams, key) =>
      [...teams]
        .filter((team) => Number(team[key]) < 0)
        .sort((a, b) => Number(a[key]) - Number(b[key]))[0] ?? null;

    const newTop25Entries = (teams) =>
      [...teams]
        .filter(
          (team) =>
            team.isNewTop25 &&
            Number(team.top25Rank) >= 1 &&
            Number(team.top25Rank) <= 25,
        )
        .sort((a, b) => Number(a.top25Rank) - Number(b.top25Rank));

    const nflLeader = rankedLeader(nflTeams, "overallRank");
    const fbsLeader = rankedLeader(fbsTeams, "top25Rank");
    const fcsLeader = rankedLeader(fcsTeams, "top25Rank");

    const nflRiser = biggestPositive(nflTeams, "movement");
    const nflFaller = biggestNegative(nflTeams, "movement");

    const fbsRise = biggestPositive(
      fbsTeams.filter(
        (team) =>
          Number(team.top25Rank) >= 1 &&
          Number(team.top25Rank) <= 25,
      ),
      "top25Movement",
    );
    const fbsFall = biggestNegative(
      fbsTeams.filter(
        (team) =>
          Number(team.top25Rank) >= 1 &&
          Number(team.top25Rank) <= 25,
      ),
      "top25Movement",
    );

    const fcsRise = biggestPositive(
      fcsTeams.filter(
        (team) =>
          Number(team.top25Rank) >= 1 &&
          Number(team.top25Rank) <= 25,
      ),
      "top25Movement",
    );
    const fcsFall = biggestNegative(
      fcsTeams.filter(
        (team) =>
          Number(team.top25Rank) >= 1 &&
          Number(team.top25Rank) <= 25,
      ),
      "top25Movement",
    );

    const fbsNew = newTop25Entries(fbsTeams);
    const fcsNew = newTop25Entries(fcsTeams);

    return {
      nfl: {
        teams: nflTeams.length,
        leader: nflLeader?.team || "",
        leaderCoach: nflLeader?.coach || "",
        riser: nflRiser,
        faller: nflFaller,
        cutoff: [27, 28, 29, 30, 31, 32].map((rank) => {
          const team = rankedAt(nflTeams, "overallRank", rank);
          return {
            rank,
            team: team?.team || "",
            coach: team?.coach || "",
            danger: rank >= 29,
          };
        }),
      },

      fbs: {
        teams: fbsTeams.length,
        leader: fbsLeader?.team || "",
        leaderCoach: fbsLeader?.coach || "",
        rise: fbsRise,
        fall: fbsFall,
        newTop25: fbsNew,
        cutoff: [89, 90, 91, 92, 93, 94, 95, 96, 97, 98].map((rank) => {
          const team = rankedAt(fbsTeams, "overallRank", rank);
          return {
            rank,
            team: team?.team || "",
            coach: team?.coach || "",
            danger: rank >= 91,
          };
        }),
      },

      fcs: {
        teams: fcsTeams.length,
        leader: fcsLeader?.team || "",
        leaderCoach: fcsLeader?.coach || "",
        rise: fcsRise,
        fall: fcsFall,
        newTop25: fcsNew,
      },
    };
  }, [standingsData]);

  const activeStandingsData = useMemo(() => {
    if (selectedSeason === 2026) return standingsData;

    return standingsArchive
      .filter((team) => Number(team.season) === selectedSeason)
      .map((team) => ({
        ...team,
        id: `${team.franchiseId}-${selectedSeason}`,
        conferenceId: normalizeSlug(team.conference),
        divisionId: normalizeSlug(team.division),
        movement: 0,
        previousTop25Rank: 0,
        top25Movement: 0,
        isNewTop25: false,
        top25: Number(team.top25Rank) >= 1 && Number(team.top25Rank) <= 25,
        status: "neutral",
        statusLabel: "",
        record: team.tierStandingsRecord,
        pointsFor: team.regularSeasonPF,
      }));
  }, [selectedSeason, standingsData, standingsArchive]);

  const visibleStandings = useMemo(() => {
    if (selectedPrimaryFilter === "overview") return [];

    const postseasonViews = new Set([
      "playoff-bracket",
      "cfp",
      "bowl-games",
    ]);

    if (postseasonViews.has(selectedSecondaryFilter)) return [];

    return activeStandingsData
      .filter((team) => {
        if (team.tierClass !== selectedPrimaryFilter) return false;

        if (selectedPrimaryFilter === "nfl") {
          if (selectedSecondaryFilter === "all") return true;
          if (selectedSecondaryFilter === "playoff-picture") return Number(team.playoffSeed) > 0;

          if (selectedSecondaryFilter === "afc" || selectedSecondaryFilter === "nfc") {
            if (!conferenceMatches(team, selectedSecondaryFilter)) return false;
            if (selectedNflDivisionFilter === "all") return true;
            return divisionMatches(team, selectedNflDivisionFilter);
          }

          return false;
        }

        if (selectedSecondaryFilter === "overall") return true;
        if (selectedSecondaryFilter === "top-25") {
          return Number(team.top25Rank) >= 1 && Number(team.top25Rank) <= 25;
        }

        return conferenceMatches(team, selectedSecondaryFilter);
      })
      .sort((firstTeam, secondTeam) => {
        if (selectedPrimaryFilter === "nfl" && selectedSecondaryFilter === "playoff-picture") {
          return (firstTeam.playoffSeed || 999) - (secondTeam.playoffSeed || 999);
        }

        if (
          selectedPrimaryFilter === "nfl" &&
          (selectedSecondaryFilter === "afc" || selectedSecondaryFilter === "nfc")
        ) {
          return selectedNflDivisionFilter !== "all"
            ? firstTeam.divisionRank - secondTeam.divisionRank
            : firstTeam.conferenceRank - secondTeam.conferenceRank;
        }

        if (
          selectedPrimaryFilter !== "nfl" &&
          selectedSecondaryFilter !== "overall" &&
          selectedSecondaryFilter !== "top-25"
        ) {
          return firstTeam.conferenceRank - secondTeam.conferenceRank;
        }

        if (selectedSecondaryFilter === "top-25") {
          return firstTeam.top25Rank - secondTeam.top25Rank;
        }

        return firstTeam.overallRank - secondTeam.overallRank;
      });
  }, [activeStandingsData, selectedPrimaryFilter, selectedSecondaryFilter, selectedNflDivisionFilter]);

  const displayStandings = useMemo(() => {
    return visibleStandings.map((team, index) => {
      const isNflConferenceView =
        selectedPrimaryFilter === "nfl" &&
        (selectedSecondaryFilter === "afc" || selectedSecondaryFilter === "nfc");

      const isCollegeConferenceView =
        selectedPrimaryFilter !== "nfl" &&
        selectedSecondaryFilter !== "overall" &&
        selectedSecondaryFilter !== "top-25";

      const isCollegeOverallView =
        selectedPrimaryFilter !== "nfl" &&
        (selectedSecondaryFilter === "overall" || selectedSecondaryFilter === "top-25");

      const isPlayoffPicture =
        selectedPrimaryFilter === "nfl" && selectedSecondaryFilter === "playoff-picture";

      let rank = team.overallRank;
      let pointsFor = team.regularSeasonPF;
      let recordLines = [
        { label: "Record", value: team.tierStandingsRecord, primary: true },
      ];

      if (isNflConferenceView) {
        rank = selectedNflDivisionFilter !== "all" ? team.divisionRank : team.conferenceRank;
      } else if (isPlayoffPicture) {
        rank = team.playoffSeed || team.overallRank;
      } else if (isCollegeConferenceView) {
        /*
         * Conference tabs are always ranked locally 1-14 (or the
         * conference's actual team count), regardless of how the source
         * sheet numbers Conference_Rank across the tier.
         */
        rank = index + 1;
        pointsFor = team.regularSeasonPF;
        recordLines = [
          { label: "Conference", value: team.tierStandingsRecord, primary: true },
          { label: "Overall", value: team.overallSeasonRecord, primary: false },
        ];
      } else if (isCollegeOverallView) {
        rank = selectedSecondaryFilter === "top-25" ? team.top25Rank : team.overallRank;
        pointsFor = team.overallSeasonPF;
        recordLines = [
          { label: "Overall", value: team.overallSeasonRecord, primary: true },
          { label: "Conference", value: team.tierStandingsRecord, primary: false },
        ];
      }

      let status = team.status;
      let statusLabel = team.statusLabel;

      if (team.tierClass === "fbs" && selectedSeason === 2026) {
        if (Number(team.overallRank) >= 91 && Number(team.overallRank) <= 98) {
          status = "relegation";
          statusLabel = "Relegation Zone";
        } else if (cfpFranchiseIds.has(team.franchiseId)) {
          status = "cfp";
          statusLabel = "CFP Position";
        } else if (Number(team.regularSeasonWins) >= 6) {
          status = "bowl";
          statusLabel = "Bowl Eligible";
        } else {
          status = "neutral";
          statusLabel = "";
        }
      }

      if (team.tierClass === "fcs" && status === "promotion") {
        status = "neutral";
        statusLabel = "";
      }

      return {
        ...team,
        rank,
        pointsFor,
        recordLines,
        status,
        statusLabel,
      };
    });
  }, [
    visibleStandings,
    selectedPrimaryFilter,
    selectedSecondaryFilter,
    selectedNflDivisionFilter,
    selectedSeason,
    cfpFranchiseIds,
  ]);

  const showTierLines = ["all", "overall"].includes(selectedSecondaryFilter);
  const isTop25View =
    selectedPrimaryFilter !== "nfl" &&
    selectedSecondaryFilter === "top-25";

  const showTop25Prefix =
    selectedPrimaryFilter !== "nfl" &&
    selectedSecondaryFilter !== "overall" &&
    selectedSecondaryFilter !== "top-25";

  const isNflPlayoffPicture = selectedPrimaryFilter === "nfl" && selectedSecondaryFilter === "playoff-picture";
  const isNflConferenceView = selectedPrimaryFilter === "nfl" && ["afc", "nfc"].includes(selectedSecondaryFilter);
  const isPostseasonView = ["playoff-bracket", "cfp", "bowl-games"].includes(selectedSecondaryFilter);
  const standingsHeading = isNflConferenceView ? activeNflDivisionLabel : activeSecondaryLabel;

  const activeStandingsPatch =
    standingsPatchMap[selectedPrimaryFilter]?.[selectedSecondaryFilter] ??
    MESH_PATCHES.tier[activePrimaryLabel] ??
    null;

  const activeStandingsPatchLabel =
    isNflConferenceView
      ? activeSecondaryLabel
      : selectedSecondaryFilter === "top-25" ||
          selectedSecondaryFilter === "overall" ||
          selectedSecondaryFilter === "all" ||
          selectedSecondaryFilter === "playoff-picture"
        ? activePrimaryLabel
        : activeSecondaryLabel;

  const selectPrimaryFilter = (filterId) => {
    setSelectedPrimaryFilter(filterId);
    setSelectedNflDivisionFilter("all");
    setSelectedSecondaryFilter(
      filterId === "nfl"
        ? "all"
        : filterId === "fbs" || filterId === "fcs"
          ? "top-25"
          : "overall",
    );
  };

  const selectSecondaryFilter = (filterId) => {
    setSelectedSecondaryFilter(filterId);
    setSelectedNflDivisionFilter("all");
  };

  const viewTier = (tierClass) => {
    selectPrimaryFilter(tierClass);
    window.requestAnimationFrame(() => {
      document.querySelector(".standings-controls")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const renderStandingsContent = () => {
    if (standingsLoading) {
      return <div className="standings-empty-state"><Medal size={30} /><h3>Loading standings</h3><p>Retrieving the latest MESH standings.</p></div>;
    }

    if (standingsError) {
      return <div className="standings-empty-state"><Medal size={30} /><h3>Standings unavailable</h3><p>{standingsError}</p></div>;
    }

    if (isNflPlayoffPicture) {
      return (
        <div className="standings-playoff-picture">
          {["afc", "nfc"].map((conferenceId) => {
            const conferenceTeams = displayStandings
              .filter((team) => conferenceMatches(team, conferenceId))
              .sort((a, b) => (a.playoffSeed || 999) - (b.playoffSeed || 999));

            return (
              <section className="standings-playoff-conference" key={conferenceId}>
                <div className="standings-section-heading">
                  <div><span>Current playoff seeds</span><h2>{conferenceId.toUpperCase()}</h2></div>
                  <TierBadge tier="NFL" tierClass="nfl" />
                </div>
                {conferenceTeams.length > 0 ? (
                  <StandingsList
                    teams={conferenceTeams}
                    tierClass="nfl"
                    showTierLines={false}
                    isTop25View={false}
                  />
                ) : (
                  <div className="standings-empty-state"><Medal size={30} /><h3>No playoff data found</h3><p>Playoff teams will appear once seeds are available in TEAM DATA.</p></div>
                )}
              </section>
            );
          })}
        </div>
      );
    }

    if (displayStandings.length > 0) {
      return (
        <StandingsList
          teams={displayStandings}
          tierClass={selectedPrimaryFilter}
          showTierLines={showTierLines}
          isTop25View={isTop25View}
          showTop25Prefix={showTop25Prefix}
        />
      );
    }

    return <div className="standings-empty-state"><Medal size={30} /><h3>No standings found</h3><p>No teams currently match this tier, conference, and division filter.</p></div>;
  };

  return (
    <main className="standings-page">
      <PageHeader
        eyebrow="The race for MESH"
        title="Standings"
        description="Track playoff races, overall rankings, promotions, relegation pressure, and weekly movement."
        imageSrc={meshShield}
        imageAlt="MESH Football shield"
        accent="standings"
        size="compact"
      />

      <section className="standings-controls">
        <label className="standings-version-selector">
          <div>
            <span>Season</span>
            <strong>{selectedSeason === 2026 ? "2026 Live" : `${selectedSeason} Final`}</strong>
          </div>

          <div className="standings-season-select-wrap">
            <select
              className="standings-season-select"
              value={selectedSeason}
              onChange={(event) => setSelectedSeason(Number(event.target.value))}
              aria-label="Choose standings season"
            >
              <option value={2026}>2026 Live</option>
              <option value={2025}>2025 Final</option>
              <option value={2024}>2024 Final</option>
            </select>
            <ChevronDown size={18} aria-hidden="true" />
          </div>
        </label>

        <div className="standings-primary-tabs" aria-label="Choose standings view">
          {primaryFilters.map((filter) => (
            <button
              type="button"
              key={filter.id}
              className={["standings-primary-tab", `standings-primary-tab-${filter.id}`, selectedPrimaryFilter === filter.id ? "active" : ""].filter(Boolean).join(" ")}
              onClick={() => selectPrimaryFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {selectedPrimaryFilter !== "overview" ? (
        <section className={`standings-secondary-filter standings-secondary-filter-${selectedPrimaryFilter}`}>
          <div className="standings-secondary-heading"><span>Filter {activePrimaryLabel}</span><strong>{activeSecondaryLabel}</strong></div>
          <div className="standings-secondary-tabs" aria-label={`Filter ${activePrimaryLabel} standings`}>
            {activeSecondaryFilters.map((filter) => (
              <button
                type="button"
                key={filter.id}
                className={selectedSecondaryFilter === filter.id ? "standings-secondary-tab active" : "standings-secondary-tab"}
                onClick={() => selectSecondaryFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {isNflConferenceView ? (
        <section className="standings-secondary-filter standings-secondary-filter-nfl">
          <div className="standings-secondary-heading"><span>Filter {selectedSecondaryFilter.toUpperCase()} divisions</span><strong>{activeNflDivisionLabel}</strong></div>
          <div className="standings-secondary-tabs" aria-label={`Filter ${selectedSecondaryFilter.toUpperCase()} divisions`}>
            {activeNflDivisionFilters.map((filter) => (
              <button
                type="button"
                key={filter.id}
                className={selectedNflDivisionFilter === filter.id ? "standings-secondary-tab active" : "standings-secondary-tab"}
                onClick={() => setSelectedNflDivisionFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {selectedPrimaryFilter === "overview" ? (
        selectedSeason !== 2026 ? (
          <section className="standings-history-overview">
            <div className="standings-history-overview-copy">
              <span>Archived Season</span>
              <h2>{selectedSeason} Final Standings</h2>
              <p>
                Select NFL, FBS, or FCS above to explore the final archived standings
                from the {selectedSeason} MESH season.
              </p>
            </div>

            <div className="standings-history-tier-grid">
              {[
                ["nfl", "NFL", MESH_PATCHES.tier.NFL],
                ["fbs", "FBS", MESH_PATCHES.tier.FBS],
                ["fcs", "FCS", MESH_PATCHES.tier.FCS],
              ].map(([tierClass, label, patch]) => (
                <button
                  type="button"
                  key={tierClass}
                  className={`standings-history-tier-card standings-history-tier-card-${tierClass}`}
                  onClick={() => viewTier(tierClass)}
                >
                  <img src={patch} alt={`${label} MESH patch`} />
                  <div>
                    <span>{selectedSeason} Final</span>
                    <strong>{label} Standings</strong>
                  </div>
                  <ChevronRight size={17} />
                </button>
              ))}
            </div>
          </section>
        ) : (
        <>
          <section className="standings-featured-section standings-pulse-first">
            <div className="standings-featured-heading">
              <div>
                <span><Sparkles size={13} />League snapshot</span>
                <h2>MESH Pulse</h2>
                <p>
                  The biggest live movement across all three tiers — leaders,
                  ranking swings, new Top 25 teams, and relegation pressure.
                </p>
              </div>
            </div>

            <div className="standings-pulse-grid standings-pulse-grid-live">
              <PulseCard
                tier="NFL"
                tierClass="nfl"
                patch={MESH_PATCHES.tier.NFL}
                leader={overviewData.nfl.leader}
                leaderCoach={overviewData.nfl.leaderCoach}
                statRows={[
                  { value: overviewData.nfl.teams || 32, label: "Franchises" },
                  { value: 4, label: "Relegated" },
                ]}
                movementRows={[
                  {
                    label: "Biggest Rise",
                    team: overviewData.nfl.riser?.team,
                    coach: overviewData.nfl.riser?.coach,
                    movement: overviewData.nfl.riser?.movement,
                  },
                  {
                    label: "Biggest Fall",
                    team: overviewData.nfl.faller?.team,
                    coach: overviewData.nfl.faller?.coach,
                    movement: overviewData.nfl.faller?.movement,
                  },
                ]}
                cutoffRows={overviewData.nfl.cutoff}
                onOpen={() => viewTier("nfl")}
              />

              <PulseCard
                tier="FBS"
                tierClass="fbs"
                patch={MESH_PATCHES.tier.FBS}
                leader={overviewData.fbs.leader}
                leaderCoach={overviewData.fbs.leaderCoach}
                statRows={[
                  { value: overviewData.fbs.teams || 98, label: "Franchises" },
                  { value: 4, label: "Promoted" },
                  { value: 8, label: "Relegated" },
                ]}
                movementRows={[
                  {
                    label: "Biggest Top 25 Rise",
                    team: overviewData.fbs.rise?.team,
                    coach: overviewData.fbs.rise?.coach,
                    movement: overviewData.fbs.rise?.top25Movement,
                  },
                  {
                    label: "Biggest Top 25 Fall",
                    team: overviewData.fbs.fall?.team,
                    coach: overviewData.fbs.fall?.coach,
                    movement: overviewData.fbs.fall?.top25Movement,
                  },
                  {
                    label: "New Top 25 Entrants",
                    entries: overviewData.fbs.newTop25.map((team) => ({
                      rank: team.top25Rank,
                      team: team.team,
                      coach: team.coach,
                    })),
                    isNew: true,
                  },
                ]}
                cutoffRows={overviewData.fbs.cutoff}
                onOpen={() => viewTier("fbs")}
              />

              <PulseCard
                tier="FCS"
                tierClass="fcs"
                patch={MESH_PATCHES.tier.FCS}
                leader={overviewData.fcs.leader}
                leaderCoach={overviewData.fcs.leaderCoach}
                statRows={[
                  { value: overviewData.fcs.teams || 72, label: "Franchises" },
                  { value: 8, label: "Promoted" },
                ]}
                movementRows={[
                  {
                    label: "Biggest Top 25 Rise",
                    team: overviewData.fcs.rise?.team,
                    coach: overviewData.fcs.rise?.coach,
                    movement: overviewData.fcs.rise?.top25Movement,
                  },
                  {
                    label: "Biggest Top 25 Fall",
                    team: overviewData.fcs.fall?.team,
                    coach: overviewData.fcs.fall?.coach,
                    movement: overviewData.fcs.fall?.top25Movement,
                  },
                  {
                    label: "New Top 25 Entrants",
                    entries: overviewData.fcs.newTop25.map((team) => ({
                      rank: team.top25Rank,
                      team: team.team,
                      coach: team.coach,
                    })),
                    isNew: true,
                  },
                ]}
                onOpen={() => viewTier("fcs")}
              />
            </div>
          </section>
        </>
        )
      ) : (
        <section className={`standings-tier-view standings-tier-view-${selectedPrimaryFilter}`}>
          <div className="standings-section-heading standings-section-heading-patched">
            <div className="standings-section-identity">
              {activeStandingsPatch ? (
                <img
                  className="standings-section-patch"
                  src={activeStandingsPatch}
                  alt={`${activeStandingsPatchLabel} MESH patch`}
                />
              ) : null}

              <div className="standings-section-title-copy">
                <span>
                  {selectedSeason === 2026
                    ? `${activePrimaryLabel} Standings`
                    : `${selectedSeason} ${activePrimaryLabel} Final Standings`}
                </span>
                <h2>{standingsHeading}</h2>
              </div>
            </div>

            <TierBadge
              tier={activePrimaryLabel}
              tierClass={selectedPrimaryFilter}
            />
          </div>

          {isPostseasonView ? (
            <PostseasonShell
              tierClass={selectedPrimaryFilter}
              view={selectedSecondaryFilter}
              games={playoffGames}
              gamesLoading={playoffGamesLoading}
              gamesError={playoffGamesError}
            />
          ) : (
            renderStandingsContent()
          )}
        </section>
      )}
    </main>
  );
}

export default Standings;