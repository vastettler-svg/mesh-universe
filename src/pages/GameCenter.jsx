import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  Clock3,
  History,
  Radio,
  Trophy,
  Users,
} from "lucide-react";

import PageHeader from "../components/PageHeader";
import {
  getGameById,
  getGameRosterPlayers,
  getHeadToHeadHistory,
} from "../services/googleSheets";
import meshShield from "../assets/logos/mfl-shield.png";
import { MESH_PATCHES } from "../assets/logos/patches";

import "../styles/gameCenter.css";

function formatScore(value, status) {
  if (value === null || value === undefined) {
    return status === "upcoming" ? "—" : "0.0";
  }

  return Number(value).toFixed(1);
}

function formatProjection(value) {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value).toFixed(1);
}

function clampProbability(value) {
  if (value === null || value === undefined) return null;

  const number = Number(value);
  if (!Number.isFinite(number)) return null;

  return Math.max(0, Math.min(100, number));
}

function matchupStatusLabel(game) {
  if (game.status === "live") return "Live Matchup";
  if (game.status === "final") return "Final";
  return "Game Preview";
}

function normalizePatchKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getConferencePatch(tier, conference) {
  const conferenceKey = normalizePatchKey(conference);

  if (tier === "NFL") {
    if (conferenceKey === "afc") return MESH_PATCHES.NFL.AFC;
    if (conferenceKey === "nfc") return MESH_PATCHES.NFL.NFC;
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

    return map[conferenceKey] ?? MESH_PATCHES.tier.FBS;
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

    return map[conferenceKey] ?? MESH_PATCHES.tier.FCS;
  }

  return null;
}

function getGameCenterBranding(game) {
  const tier = String(game?.tier ?? "").trim().toUpperCase();
  const conference1 = String(game?.team1Conference || "").trim();
  const conference2 = String(game?.team2Conference || "").trim();

  const sameConference =
    conference1 &&
    conference2 &&
    normalizePatchKey(conference1) === normalizePatchKey(conference2);

  if (conference1 && conference2 && !sameConference) {
    return {
      isCrossConference: true,
      leftPatch: getConferencePatch(tier, conference1),
      rightPatch: getConferencePatch(tier, conference2),
      centerLabel: "Non-Conference",
      leftLabel: conference1,
      rightLabel: conference2,
    };
  }

  const conference = conference1 || conference2;

  return {
    isCrossConference: false,
    leftPatch: getConferencePatch(tier, conference),
    rightPatch: null,
    centerLabel: conference || tier,
    leftLabel: conference || tier,
    rightLabel: "",
  };
}

function centerStatusLabel(game) {
  if (game.status === "live") return "Live";
  if (game.status === "final") return "Final";
  return "Scheduled";
}

function TeamLogo({
  src,
  initial,
  team,
  franchiseId,
  rank,
}) {
  const ranked = Number(rank) >= 1 && Number(rank) <= 25;

  const logo = (
    <div className="game-center-logo-wrap">
      <div
        className={[
          "game-center-logo",
          src ? "" : "game-center-logo-placeholder",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {src ? (
          <img src={src} alt={`${team} logo`} />
        ) : (
          initial || "?"
        )}
      </div>

      {ranked ? (
        <span
          className="game-center-logo-rank"
          aria-label={`Ranked number ${rank}`}
        >
          #{rank}
        </span>
      ) : null}
    </div>
  );

  return franchiseId ? (
    <Link
      to={`/league/franchises/${encodeURIComponent(franchiseId)}`}
      className="game-center-franchise-logo-link"
      aria-label={`Open ${team || "team"} franchise profile`}
    >
      {logo}
    </Link>
  ) : (
    logo
  );
}

function TeamSide({
  side,
  franchiseId,
  team,
  coach,
  coachId,
  conference,
  overallRecord,
  conferenceRecord,
  rank,
  score,
  projection,
  logo,
  initial,
  tier,
  status,
  isWinner,
  isLoser,
}) {
  const isCollege = tier === "FBS" || tier === "FCS";

  return (
    <section
      className={[
        "game-center-team-side",
        `game-center-team-side-${side}`,
        isWinner ? "winner" : "",
        isLoser ? "loser" : "",
      ].filter(Boolean).join(" ")}
    >
      <TeamLogo
        src={logo}
        initial={initial}
        team={team || "TBD"}
        franchiseId={franchiseId}
        rank={rank}
      />

      <div className="game-center-team-side-copy">
        <h2 className="game-center-team-name">
          {franchiseId ? (
            <Link
              to={`/league/franchises/${encodeURIComponent(franchiseId)}`}
              className="game-center-franchise-name-link"
            >
              {team || "TBD"}
            </Link>
          ) : (
            <span>{team || "TBD"}</span>
          )}
        </h2>

        {coach ? (
          coachId ? (
            <Link
              to={`/league/coaches/${encodeURIComponent(coachId)}`}
              className="game-center-coach game-center-coach-link"
            >
              {coach}
            </Link>
          ) : (
            <p className="game-center-coach">{coach}</p>
          )
        ) : null}

        <div className="game-center-records">
          {isCollege ? (
            <>
              <span>OVR: {overallRecord || "0–0"}</span>
              <span>CONF: {conferenceRecord || "0–0"}</span>
            </>
          ) : (
            <span>{overallRecord || "0–0"}</span>
          )}
        </div>

        {conference ? (
          <span className="game-center-conference">{conference}</span>
        ) : null}
      </div>

      <div className="game-center-side-score">
        <strong>{formatScore(score, status)}</strong>
        {status !== "final" && projection !== null && projection !== undefined ? (
          <span>Proj: {Number(projection).toFixed(1)}</span>
        ) : null}
      </div>
    </section>
  );
}

function WinProbability({ game }) {
  const firstRaw = clampProbability(game.team1WinProbability);
  const secondRaw = clampProbability(game.team2WinProbability);

  if (firstRaw === null && secondRaw === null) {
    return (
      <div className="game-center-v1-probability">
        <span className="game-center-v1-probability-title">Win Probability</span>
        <div className="game-center-v1-probability-unavailable">
          Win probability will appear once the Sleeper probability feed is connected.
        </div>
      </div>
    );
  }

  const first = firstRaw !== null ? firstRaw : 100 - secondRaw;
  const second = secondRaw !== null ? secondRaw : 100 - first;

  const favoredSide = first >= second ? "left" : "right";
  const favoredProbability = Math.max(first, second);

  return (
    <div className="game-center-v1-probability">
      <span className="game-center-v1-probability-title">Win Probability</span>
      <div className="game-center-v1-probability-values">
        <strong>{Math.round(first)}%</strong>
        <strong>{Math.round(second)}%</strong>
      </div>

      <div className="game-center-v1-probability-track">
        <div
          className={[
            "game-center-v1-probability-fill",
            `game-center-v1-probability-fill-${game.tierClass}`,
            `game-center-v1-probability-fill-${favoredSide}`,
          ].join(" ")}
          style={{ width: `${favoredProbability}%` }}
        />
      </div>
    </div>
  );
}

function postseasonText(game) {
  return [
    game?.gameCategory,
    game?.gameType,
    game?.label,
    game?.bowlName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isPostseasonGame(game) {
  const text = postseasonText(game);

  if (
    text.includes("playoff") ||
    text.includes("wild card") ||
    text.includes("divisional") ||
    text.includes("championship") ||
    text.includes("bowl") ||
    text.includes("cfp")
  ) {
    return true;
  }

  const tier = String(game?.tier || "").toUpperCase();
  const week = Number(game?.week);

  if (tier === "NFL") return week >= 14 && week <= 17;
  if (tier === "FBS") return week >= 13 && week <= 17;
  if (tier === "FCS") return week >= 13 && week <= 17;

  return false;
}

function getPostseasonRound(game) {
  const tier = String(game?.tier || "").trim().toUpperCase();
  const week = Number(game?.week);
  const text = postseasonText(game);

  // Explicit labels always win.
  if (game?.bowlName) {
    if (
      text.includes("national championship") ||
      text.includes("cfp national championship")
    ) {
      return "CFP National Championship";
    }

    if (
      text.includes("cfp") ||
      text.includes("playoff quarter") ||
      text.includes("playoff semi")
    ) {
      // Continue below so CFP rounds retain their round identity.
    } else {
      return game.bowlName;
    }
  }

  if (text.includes("super bowl")) return "Super Bowl";
  if (text.includes("afc championship")) return "AFC Championship";
  if (text.includes("nfc championship")) return "NFC Championship";
  if (text.includes("wild card")) return "Wild Card";
  if (text.includes("divisional")) return "Divisional Round";

  if (
    text.includes("cfp national championship") ||
    text.includes("college football playoff national championship")
  ) {
    return "CFP National Championship";
  }

  if (text.includes("national championship")) {
    return tier === "FCS"
      ? "FCS National Championship"
      : tier === "FBS"
        ? "CFP National Championship"
        : "National Championship";
  }

  if (text.includes("conference championship")) {
    return game?.gameType || game?.gameCategory || "Conference Championship";
  }

  if (text.includes("semifinal")) {
    return tier === "FCS" ? "FCS Semifinal" : "CFP Semifinal";
  }

  if (text.includes("quarterfinal")) {
    return tier === "FCS" ? "FCS Quarterfinal" : "CFP Quarterfinal";
  }

  if (text.includes("second round")) return "FCS Second Round";
  if (text.includes("first round")) {
    return tier === "FCS" ? "FCS First Round" : "CFP First Round";
  }

  // Week-based fallback for current/future manually scheduled rows.
  if (tier === "NFL") {
    if (week === 14) return "Wild Card";
    if (week === 15) return "Divisional Round";
    if (week === 16) return "Conference Championship";
    if (week === 17) return "Super Bowl";
  }

  if (tier === "FBS") {
    if (week === 13) return "Conference Championship";
    if (week === 14) return "CFP First Round";
    if (week === 15) return "CFP Quarterfinal";
    if (week === 16) return "CFP Semifinal";
    if (week === 17) return "CFP National Championship";
  }

  if (tier === "FCS") {
    if (week === 13) return "FCS First Round";
    if (week === 14) return "FCS Second Round";
    if (week === 15) return "FCS Quarterfinal";
    if (week === 16) return "FCS Semifinal";
    if (week === 17) return "FCS National Championship";
  }

  return game?.gameType || game?.gameCategory || "Postseason";
}

function getPostseasonSeriesLabel(game) {
  const tier = String(game?.tier || "").toUpperCase();
  const round = getPostseasonRound(game);

  if (game?.bowlName && !postseasonText(game).includes("cfp")) {
    return "FBS Bowl Season";
  }

  if (tier === "NFL") return "NFL Playoffs";
  if (tier === "FBS") return round.includes("Conference") ? "FBS Championship Week" : "College Football Playoff";
  if (tier === "FCS") return "FCS Playoffs";

  return "MESH Postseason";
}

function MatchupCard({ game, winnerState, rosters }) {
  const postseason = isPostseasonGame(game);
  const postseasonRound = postseason ? getPostseasonRound(game) : "";
  const postseasonSeries = postseason ? getPostseasonSeriesLabel(game) : "";
  const branding = getGameCenterBranding(game);

  const title = postseason ? postseasonRound : "REGULAR SEASON";

  return (
    <section
      className={[
        "game-center-hero",
        `game-center-hero-${game.tierClass}`,
        postseason ? "game-center-hero-postseason" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="game-center-hero-top game-center-hero-top-patched">
        <div className="game-center-hero-status">
          <span className={`gc-home-state-pill gc-home-state-pill-${game.status}`}>
            {game.status === "live" ? <Radio size={10} /> : null}
            {matchupStatusLabel(game)}
          </span>
        </div>

        <div
          className={[
            "game-center-hero-title",
            branding.isCrossConference
              ? "game-center-hero-title-cross-conference"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {branding.leftPatch ? (
            <img
              className="game-center-hero-patch"
              src={branding.leftPatch}
              alt={`${branding.leftLabel} MESH patch`}
            />
          ) : null}

          <div className="game-center-hero-title-copy">
            <span>{postseason ? postseasonSeries : branding.centerLabel}</span>
            <h2>{title}</h2>
          </div>

          {branding.isCrossConference && branding.rightPatch ? (
            <img
              className="game-center-hero-patch"
              src={branding.rightPatch}
              alt={`${branding.rightLabel} MESH patch`}
            />
          ) : null}
        </div>

        <span className={`gc-home-tier-pill gc-home-tier-pill-${game.tierClass}`}>
          {game.tier}
        </span>
      </div>

      {postseason ? (
        <div className={`game-center-postseason-strip game-center-postseason-strip-${game.tierClass}`}>
          <span>Postseason</span>
          <strong>{postseasonRound}</strong>
          <small>Week {game.week}</small>
        </div>
      ) : null}

      <div className="game-center-matchup-row">
        <TeamSide
          side="one"
          franchiseId={game.team1Id}
          team={game.team1Team}
          coach={game.team1Coach}
          coachId={game.team1CoachId}
          conference={game.team1Conference}
          overallRecord={game.team1OverallRecord}
          conferenceRecord={game.team1ConferenceRecord}
          rank={postseason ? game.team1GameRank : game.team1Top25Rank}
          score={game.team1Score}
          projection={
            rosters.team1ProjectedPoints ?? game.team1Projection
          }
          logo={game.team1Logo}
          initial={game.team1Initial}
          tier={game.tier}
          status={game.status}
          isWinner={winnerState.team1Winner}
          isLoser={winnerState.hasWinner && !winnerState.team1Winner}
        />

        <div className="game-center-middle">
          <span className="game-center-vs">VS</span>
        </div>

        <TeamSide
          side="two"
          franchiseId={game.team2Id}
          team={game.team2Team}
          coach={game.team2Coach}
          coachId={game.team2CoachId}
          conference={game.team2Conference}
          overallRecord={game.team2OverallRecord}
          conferenceRecord={game.team2ConferenceRecord}
          rank={postseason ? game.team2GameRank : game.team2Top25Rank}
          score={game.team2Score}
          projection={
            rosters.team2ProjectedPoints ?? game.team2Projection
          }
          logo={game.team2Logo}
          initial={game.team2Initial}
          tier={game.tier}
          status={game.status}
          isWinner={winnerState.team2Winner}
          isLoser={winnerState.hasWinner && !winnerState.team2Winner}
        />
      </div>

      <WinProbability game={game} />
    </section>
  );
}

function formatPlayerScore(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }

  return Number(value).toFixed(1);
}

function formatTeamProjection(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null;
  }

  return Number(value).toFixed(1);
}

function RosterPanel({ team, players, side }) {
  return (
    <div className={`game-center-roster-panel game-center-roster-panel-${side}`}>
      <div className="game-center-roster-panel-heading">
        <Users size={16} />
        <strong>{team || "TBD"}</strong>
      </div>

      <div className="game-center-roster-table">
        <div className="game-center-roster-table-head">
          <span>POS</span>
          <span>PLAYER</span>
          <span>PTS</span>
        </div>

        {players.length > 0 ? (
          players.map((player) => (
            <div className="game-center-player-row" key={player.playerId}>
              <span className="game-center-lineup-position">
                {player.lineupPosition || player.position || "—"}
              </span>

              <div className="game-center-player-copy">
                <strong>{player.playerName || player.playerId}</strong>
                <span>
                  {[player.position, player.nflTeam]
                    .filter(Boolean)
                    .join(" • ")}
                </span>
              </div>

              <div className="game-center-player-points">
                <strong>{formatPlayerScore(player.playerPoints)}</strong>

                {player.projectedPoints !== null ? (
                  <span>Proj {formatPlayerScore(player.projectedPoints)}</span>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="game-center-roster-empty">
            No starters found for this franchise and week.
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryCard({ meeting, currentTeam1Id }) {
  const team1WasCurrentLeft = meeting.team1Id === currentTeam1Id;

  const leftName = team1WasCurrentLeft ? meeting.team1Team : meeting.team2Team;
  const rightName = team1WasCurrentLeft ? meeting.team2Team : meeting.team1Team;
  const leftScore = team1WasCurrentLeft ? meeting.team1Score : meeting.team2Score;
  const rightScore = team1WasCurrentLeft ? meeting.team2Score : meeting.team1Score;

  return (
    <div className="game-center-history-row">
      <div>
        <span>{meeting.season} • Week {meeting.week}</span>
        <strong>
          {isPostseasonGame(meeting)
            ? getPostseasonRound(meeting)
            : meeting.gameType || meeting.gameCategory || "Matchup"}
        </strong>
      </div>

      <div className="game-center-history-score">
        <span>{leftName}</span>
        <strong>{leftScore === null ? "—" : Number(leftScore).toFixed(1)}</strong>
        <span className="game-center-history-vs">vs</span>
        <strong>{rightScore === null ? "—" : Number(rightScore).toFixed(1)}</strong>
        <span>{rightName}</span>
      </div>
    </div>
  );
}

function numericHistoryScore(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeHistoryMeeting(meeting, game) {
  const currentLeftIsMeetingLeft = meeting.team1Id === game.team1Id;

  return {
    ...meeting,
    leftName: currentLeftIsMeetingLeft ? meeting.team1Team : meeting.team2Team,
    rightName: currentLeftIsMeetingLeft ? meeting.team2Team : meeting.team1Team,
    leftScore: numericHistoryScore(
      currentLeftIsMeetingLeft ? meeting.team1Score : meeting.team2Score,
    ),
    rightScore: numericHistoryScore(
      currentLeftIsMeetingLeft ? meeting.team2Score : meeting.team1Score,
    ),
  };
}

function isPostseasonMeeting(meeting) {
  const label = `${meeting.gameType || ""} ${meeting.gameCategory || ""} ${meeting.bowlName || ""}`
    .trim()
    .toLowerCase();

  return [
    "playoff", "wild card", "wildcard", "divisional", "conference championship",
    "super bowl", "cfp", "quarterfinal", "quarter final", "semifinal",
    "semi final", "national championship", "bowl",
  ].some((term) => label.includes(term));
}

function buildSeriesAnalytics(history, game) {
  const completed = (history || [])
    .map((meeting) => normalizeHistoryMeeting(meeting, game))
    .filter(
      (meeting) =>
        meeting.leftScore !== null && meeting.rightScore !== null,
    );

  let leftWins = 0;
  let rightWins = 0;
  let ties = 0;
  let leftPoints = 0;
  let rightPoints = 0;

  completed.forEach((meeting) => {
    leftPoints += meeting.leftScore;
    rightPoints += meeting.rightScore;
    if (meeting.leftScore > meeting.rightScore) leftWins += 1;
    else if (meeting.rightScore > meeting.leftScore) rightWins += 1;
    else ties += 1;
  });

  const largestWin = completed.reduce((best, meeting) => {
    const margin = Math.abs(meeting.leftScore - meeting.rightScore);
    if (!best || margin > best.margin) {
      return {
        meeting,
        margin,
        winner:
          meeting.leftScore > meeting.rightScore
            ? meeting.leftName
            : meeting.rightScore > meeting.leftScore
              ? meeting.rightName
              : "Tie",
      };
    }
    return best;
  }, null);

  const closestMeeting = completed.reduce((best, meeting) => {
    const margin = Math.abs(meeting.leftScore - meeting.rightScore);
    if (!best || margin < best.margin) {
      return {
        meeting,
        margin,
        winner:
          meeting.leftScore > meeting.rightScore
            ? meeting.leftName
            : meeting.rightScore > meeting.leftScore
              ? meeting.rightName
              : "Tie",
      };
    }
    return best;
  }, null);

  const highestScoring = completed.reduce((best, meeting) => {
    const combined = meeting.leftScore + meeting.rightScore;
    return !best || combined > best.combined ? { meeting, combined } : best;
  }, null);

  let streakTeam = "";
  let streakCount = 0;
  for (const meeting of completed) {
    const winner =
      meeting.leftScore > meeting.rightScore
        ? game.team1Team
        : meeting.rightScore > meeting.leftScore
          ? game.team2Team
          : "";
    if (!winner) break;
    if (!streakTeam) {
      streakTeam = winner;
      streakCount = 1;
    } else if (winner === streakTeam) {
      streakCount += 1;
    } else {
      break;
    }
  }

  const postseason = completed.filter(isPostseasonMeeting);
  let postseasonLeftWins = 0;
  let postseasonRightWins = 0;
  postseason.forEach((meeting) => {
    if (meeting.leftScore > meeting.rightScore) postseasonLeftWins += 1;
    else if (meeting.rightScore > meeting.leftScore) postseasonRightWins += 1;
  });

  return {
    completed,
    meetings: completed.length,
    leftWins,
    rightWins,
    ties,
    leftAverage: completed.length ? (leftPoints / completed.length).toFixed(1) : "—",
    rightAverage: completed.length ? (rightPoints / completed.length).toFixed(1) : "—",
    largestWin,
    closestMeeting,
    highestScoring,
    lastMeeting: completed[0] || null,
    streakTeam,
    streakCount,
    postseason,
    postseasonLeftWins,
    postseasonRightWins,
  };
}

function formatHistoryMargin(value) {
  return Number.isFinite(Number(value)) ? `+${Number(value).toFixed(1)}` : "—";
}

function meetingLabel(meeting) {
  return `${meeting?.season || "—"} • Week ${meeting?.week || "—"}`;
}

function SeriesHistory({ game, analytics }) {
  if (!analytics?.meetings) {
    return (
      <section className="game-center-history">
        <div className="game-center-section-heading">
          <span>Archive</span>
          <h2>Matchup History</h2>
        </div>
        <div className="game-center-history-empty">
          <History size={18} />
          <div>
            <strong>No previous meetings</strong>
            <span>This is the first archived MESH meeting between these permanent franchises.</span>
          </div>
        </div>
      </section>
    );
  }

  const leader =
    analytics.leftWins === analytics.rightWins
      ? `Series tied ${analytics.leftWins}–${analytics.rightWins}`
      : analytics.leftWins > analytics.rightWins
        ? `${game.team1Team} leads ${analytics.leftWins}–${analytics.rightWins}`
        : `${game.team2Team} leads ${analytics.rightWins}–${analytics.leftWins}`;

  const last = analytics.lastMeeting;
  const largest = analytics.largestWin;
  const closest = analytics.closestMeeting;
  const highest = analytics.highestScoring;

  return (
    <section className="game-center-history game-center-history-restored">
      <div className={`game-center-series-hero game-center-series-hero-${String(game.tier || "").toLowerCase()}`}>
        <div className="game-center-series-hero-title">
          <History size={22} />
          <div>
            <span>All-Time Series</span>
            <h2>{leader}</h2>
          </div>
        </div>

        <div className="game-center-series-scoreboard">
          <div>
            <strong>{analytics.leftWins}</strong>
            <span>{game.team1Team}</span>
          </div>
          <div className="game-center-series-meetings">
            <strong>{analytics.meetings}</strong>
            <span>Previous Meetings</span>
          </div>
          <div>
            <strong>{analytics.rightWins}</strong>
            <span>{game.team2Team}</span>
          </div>
        </div>
      </div>

      <div className="game-center-history-stat-grid">
        <article className="game-center-history-stat-card">
          <span>Last Meeting</span>
          <div className="game-center-history-team-lines">
            <div>
              <strong>{last.leftName}</strong>
              <b>{last.leftScore.toFixed(1)}</b>
            </div>
            <div>
              <strong>{last.rightName}</strong>
              <b>{last.rightScore.toFixed(1)}</b>
            </div>
          </div>
          <small>{meetingLabel(last)}</small>
        </article>

        <article className="game-center-history-stat-card">
          <span>Current Streak</span>
          <div className="game-center-history-streak-copy">
            <span>{analytics.streakTeam || "No Active Streak"}</span>
            <strong>
              {analytics.streakCount
                ? `W${analytics.streakCount}`
                : "—"}
            </strong>
          </div>
        </article>

        <article className="game-center-history-stat-card">
          <span>Largest Win</span>
          {largest ? (
            <>
              <div className="game-center-history-team-lines">
                <div>
                  <strong>{largest.meeting.leftName}</strong>
                  <b>{largest.meeting.leftScore.toFixed(1)}</b>
                </div>
                <div>
                  <strong>{largest.meeting.rightName}</strong>
                  <b>{largest.meeting.rightScore.toFixed(1)}</b>
                </div>
              </div>
              <small><strong>Margin:</strong> {formatHistoryMargin(largest.margin)}</small>
            </>
          ) : (
            <small>—</small>
          )}
        </article>

        <article className="game-center-history-stat-card">
          <span>Closest Meeting</span>
          {closest ? (
            <>
              <div className="game-center-history-team-lines">
                <div>
                  <strong>{closest.meeting.leftName}</strong>
                  <b>{closest.meeting.leftScore.toFixed(1)}</b>
                </div>
                <div>
                  <strong>{closest.meeting.rightName}</strong>
                  <b>{closest.meeting.rightScore.toFixed(1)}</b>
                </div>
              </div>
              <small>
                {closest.margin === 0
                  ? "Margin: 0.0"
                  : `Margin: ${formatHistoryMargin(closest.margin)}`}
              </small>
            </>
          ) : (
            <small>—</small>
          )}
        </article>

        <article className="game-center-history-stat-card">
          <span>Highest-Scoring Meeting</span>
          {highest ? (
            <>
              <div className="game-center-history-team-lines">
                <div>
                  <strong>{highest.meeting.leftName}</strong>
                  <b>{highest.meeting.leftScore.toFixed(1)}</b>
                </div>
                <div>
                  <strong>{highest.meeting.rightName}</strong>
                  <b>{highest.meeting.rightScore.toFixed(1)}</b>
                </div>
              </div>
              <small><strong>Combined:</strong> {highest.combined.toFixed(1)}</small>
            </>
          ) : (
            <small>—</small>
          )}
        </article>

        <article className="game-center-history-stat-card">
          <span>Average Score</span>
          <div className="game-center-history-team-lines">
            <div>
              <strong>{game.team1Team}</strong>
              <b>{analytics.leftAverage}</b>
            </div>
            <div>
              <strong>{game.team2Team}</strong>
              <b>{analytics.rightAverage}</b>
            </div>
          </div>
          <small><strong>All-Time Average</strong></small>
        </article>
      </div>

      <div className="game-center-postseason-series">
        <span>Postseason Series</span>
        {analytics.postseason.length ? (
          <>
            <strong>
              {analytics.postseasonLeftWins === analytics.postseasonRightWins
                ? `Tied ${analytics.postseasonLeftWins}–${analytics.postseasonRightWins}`
                : analytics.postseasonLeftWins > analytics.postseasonRightWins
                  ? `${game.team1Team} leads ${analytics.postseasonLeftWins}–${analytics.postseasonRightWins}`
                  : `${game.team2Team} leads ${analytics.postseasonRightWins}–${analytics.postseasonLeftWins}`}
            </strong>
            <small>{analytics.postseason.length} postseason meeting{analytics.postseason.length === 1 ? "" : "s"}</small>
          </>
        ) : (
          <>
            <strong>No Postseason Meetings</strong>
            <small>Regular-season series only</small>
          </>
        )}
      </div>

      <div className="game-center-recent-meetings-heading">
        <div>
          <span>Archive</span>
          <h2>Recent Meetings</h2>
        </div>
        <small>Showing {analytics.meetings} of {analytics.meetings}</small>
      </div>

      <div className="game-center-recent-meetings">
        {analytics.completed.map((meeting) => {
          const leftWon = meeting.leftScore > meeting.rightScore;
          const rightWon = meeting.rightScore > meeting.leftScore;
          return (
            <div
              className="game-center-recent-meeting"
              key={`${meeting.gameId || ""}-${meeting.season}-${meeting.week}`}
            >
              <div className="game-center-recent-meta">
                <span>{meetingLabel(meeting)}</span>
                <strong>{meeting.gameType || meeting.gameCategory || "Regular Season"}</strong>
              </div>
              <div className="game-center-recent-score">
                <span>{meeting.leftName}</span>
                <strong className={leftWon ? "is-history-winner" : ""}>{meeting.leftScore.toFixed(1)}</strong>
                <em>vs</em>
                <strong className={rightWon ? "is-history-winner" : ""}>{meeting.rightScore.toFixed(1)}</strong>
                <span>{meeting.rightName}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function GameCenter() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [game, setGame] = useState(null);
  const [history, setHistory] = useState([]);
  const [rosters, setRosters] = useState({
    team1: [],
    team2: [],
    team1TotalPoints: null,
    team2TotalPoints: null,
    team1ProjectedPoints: null,
    team2ProjectedPoints: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadGame() {
      try {
        setLoading(true);
        setError("");

        const result = await getGameById(decodeURIComponent(gameId || ""));

        const [priorMeetings, rosterPlayers] = await Promise.all([
          getHeadToHeadHistory(
            result.team1Id,
            result.team2Id,
            result.gameId,
          ),
          getGameRosterPlayers(result),
        ]);

        if (isMounted) {
          setGame(result);
          setHistory(priorMeetings);
          setRosters(rosterPlayers);
        }
      } catch (loadError) {
        console.error("Unable to load Game Center:", loadError);

        if (isMounted) {
          setError("This MESH matchup could not be loaded.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadGame();

    return () => {
      isMounted = false;
    };
  }, [gameId]);

  const winnerState = useMemo(() => {
    if (!game || game.status !== "final" || !game.winnerId) {
      return {
        team1Winner: false,
        team2Winner: false,
        hasWinner: false,
      };
    }

    return {
      team1Winner: game.winnerId === game.team1Id,
      team2Winner: game.winnerId === game.team2Id,
      hasWinner: true,
    };
  }, [game]);

  const seriesAnalytics = useMemo(
    () => (game ? buildSeriesAnalytics(history, game) : null),
    [history, game],
  );

  const goBackToScores = () => {
    if (location.state?.scoresView) {
      navigate("/scores", {
        state: {
          restoreScores: location.state.scoresView,
        },
      });
      return;
    }

    navigate(-1);
  };

  if (loading) {
    return (
      <main className="game-center-page">
        <div className="game-center-message">
          <Activity size={28} />
          <h2>Loading Game Center</h2>
          <p>Retrieving matchup details.</p>
        </div>
      </main>
    );
  }

  if (error || !game) {
    return (
      <main className="game-center-page">
        <button type="button" className="game-center-back" onClick={goBackToScores}>
          <ArrowLeft size={16} />
          Back to Scores
        </button>

        <div className="game-center-message">
          <Activity size={28} />
          <h2>Game unavailable</h2>
          <p>{error || "This matchup could not be found."}</p>
        </div>
      </main>
    );
  }

  const postseason = isPostseasonGame(game);
  const postseasonRound = postseason ? getPostseasonRound(game) : "";
  const matchupLabel = postseason
    ? postseasonRound
    : game.gameType ||
      game.gameCategory ||
      "MESH Matchup";

  return (
    <main className="game-center-page">
      <button type="button" className="game-center-back" onClick={goBackToScores}>
        <ArrowLeft size={16} />
        Back to Scores
      </button>

      <PageHeader
        eyebrow={
          postseason
            ? `${game.tier} • Postseason • Week ${game.week}`
            : `${game.tier} • Week ${game.week}`
        }
        title="Game Center"
        description={matchupLabel}
        imageSrc={meshShield}
        imageAlt="MESH Football shield"
        accent="scores"
        size="compact"
      />

      <MatchupCard
        game={game}
        winnerState={winnerState}
        rosters={rosters}
      />

      <section className="game-center-rosters">
        <div className="game-center-section-heading">
          <span>Live scoring</span>
          <h2>Roster / Player Scoring</h2>
        </div>

        <div className="game-center-roster-grid">
          <RosterPanel
            team={game.team1Team}
            players={rosters.team1}
            side="one"
          />
          <RosterPanel
            team={game.team2Team}
            players={rosters.team2}
            side="two"
          />
        </div>
      </section>

      <SeriesHistory
        game={game}
        analytics={seriesAnalytics}
      />

      <section className="game-center-details">
        <div className="game-center-section-heading">
          <span>Matchup</span>
          <h2>Game Details</h2>
        </div>

        <div className="game-center-detail-card">
          <div><span>Season</span><strong>{game.season}</strong></div>
          <div><span>Week</span><strong>Week {game.week}</strong></div>
          <div><span>Tier</span><strong>{game.tier}</strong></div>
          {postseason ? (
            <div>
              <span>Postseason Round</span>
              <strong>{postseasonRound}</strong>
            </div>
          ) : null}
          {postseason &&
          (Number(game.team1GameRank) > 0 || Number(game.team2GameRank) > 0) ? (
            <div>
              <span>Seeds</span>
              <strong>
                {Number(game.team1GameRank) > 0
                  ? `#${game.team1GameRank}`
                  : "—"}
                {" vs "}
                {Number(game.team2GameRank) > 0
                  ? `#${game.team2GameRank}`
                  : "—"}
              </strong>
            </div>
          ) : null}
          {game.gameCategory ? (
            <div><span>Category</span><strong>{game.gameCategory}</strong></div>
          ) : null}
          {game.gameType ? (
            <div><span>Game Type</span><strong>{game.gameType}</strong></div>
          ) : null}
          {game.bowlName ? (
            <div><span>Bowl</span><strong>{game.bowlName}</strong></div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export default GameCenter;
