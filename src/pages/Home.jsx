import { useEffect, useMemo, useState } from "react";
import {Link, useNavigate} from "react-router-dom";

import {
  ArrowUp,
  BookOpen,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  Circle,
  ClipboardList,
  ExternalLink,
  Flame,
  History,
  Medal,
  Star,
  Trophy,
  Users,
} from "lucide-react";

import { getAppSettings, getGameResults, getStandingsData, getLivePlayerScores, getHeadToHeadHistory } from "../services/googleSheets";
import { MESH_PATCHES } from "../assets/logos/patches";
import { getFranchisePrestigeLeaders, getCoachPrestigeLeaders } from "../services/prestige";

import "../styles/home.css";













const quickLinks = [
  {
    title: "League Rules & Info",
    description: "Competition format and league policies",
    icon: BookOpen,
    path: "/rules",
  },
  {
    title: "Sleeper Leagues",
    description: "Open all 15 MESH conference leagues",
    icon: ExternalLink,
    path: "/league-links",
  },
  {
    title: "Prestige",
    description: "View career prestige rankings and scoring guide",
    icon: Star,
    path: "/prestige",
  },
  {
    title: "Coach Carousel",
    description: "Track coaching changes across MESH",
    icon: Users,
    path: "/coach-carousel",
  },
  {
    title: "Draft HQ",
    description: "Draft order, picks and preparation",
    icon: ClipboardList,
    path: "/draft-hq",
  },
  {
    title: "History",
    description: "Champions, records and past seasons",
    icon: History,
  }
];

function TierBadge({ tier, tierClass }) {
  return (
    <span className={`home-tier-badge home-tier-badge-${tierClass}`}>
      {tier}
    </span>
  );
}

function SectionHeading({ eyebrow, title, action, actionTo }) {
  return (
    <div className="home-section-heading">
      <div>
        <div className="home-section-eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
      </div>

      {action && actionTo ? (
        <Link className="home-text-button" to={actionTo}>
          {action}
        </Link>
      ) : action ? (
        <button type="button" className="home-text-button">
          {action}
        </button>
      ) : null}
    </div>
  );
}

function formatHomePoints(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(1) : "—";
}

function TeamIdentity({
  team,
  coach,
  logo,
  initial,
  overallRecord,
  conferenceRecord,
  rank,
  tier,
  tierClass,
}) {
  const ranked = Number(rank) >= 1 && Number(rank) <= 25;

  return (
    <div className="game-team">
      <div className={`game-team-logo game-team-logo-${tierClass}`}>
        {logo ? (
          <img src={logo} alt={`${team} logo`} />
        ) : (
          <span>{initial}</span>
        )}
      </div>

      <strong title={team}>
        {ranked ? `#${rank} ` : ""}
        {team}
      </strong>

      <span className="game-team-coach">{coach || "Coach TBD"}</span>

      {tier === "FBS" || tier === "FCS" ? (
        <span className="game-team-records">
          <span>OVR: {overallRecord || "0–0"}</span>
          <span>CONF: {conferenceRecord || "0–0"}</span>
        </span>
      ) : (
        <span className="game-team-records">
          <span>{overallRecord || "0–0"}</span>
        </span>
      )}
    </div>
  );
}

function GameOfTheWeekCard({ game }) {
  if (!game) return null;

  const isLive = game.status === "live";
  const isFinal = game.status === "final";
  const isPregame = !isLive && !isFinal;

  const team1Display = isPregame ? "—" : formatHomePoints(game.team1Score);
  const team2Display = isPregame ? "—" : formatHomePoints(game.team2Score);

  const tierPatch = MESH_PATCHES.tier[game.tier] ?? null;

  const firstProbabilityRaw = Number(game.team1WinProbability);
  const secondProbabilityRaw = Number(game.team2WinProbability);

  const hasFirstProbability = Number.isFinite(firstProbabilityRaw);
  const hasSecondProbability = Number.isFinite(secondProbabilityRaw);

  const firstProbability = hasFirstProbability
    ? Math.max(0, Math.min(100, firstProbabilityRaw))
    : hasSecondProbability
      ? 100 - Math.max(0, Math.min(100, secondProbabilityRaw))
      : null;

  const secondProbability = hasSecondProbability
    ? Math.max(0, Math.min(100, secondProbabilityRaw))
    : firstProbability !== null
      ? 100 - firstProbability
      : null;

  const favoredSide =
    firstProbability !== null && secondProbability !== null
      ? firstProbability >= secondProbability
        ? "left"
        : "right"
      : null;

  const favoredProbability =
    firstProbability !== null && secondProbability !== null
      ? Math.max(firstProbability, secondProbability)
      : null;

  return (
    <Link
      className={`home-card game-card game-card-${game.tierClass}`}
      to={`/scores/${encodeURIComponent(game.gameId)}`}
    >
      <div className="game-card-top">
        <span
          className={isLive ? "game-live-badge" : "game-preview-badge"}
        >
          {isLive ? <Circle size={8} fill="currentColor" /> : null}
          {isFinal ? "Final" : isLive ? "Live matchup" : "Game preview"}
        </span>

        <div className="game-card-tier-identity">
          {tierPatch ? (
            <img
              className="game-card-tier-patch"
              src={tierPatch}
              alt={`${game.tier} MESH patch`}
            />
          ) : null}
          <TierBadge tier={game.tier} tierClass={game.tierClass} />
        </div>
      </div>

      <h3 className="game-card-title">{game.tier} Game of the Week</h3>

      <div className="game-matchup">
        <TeamIdentity
          team={game.team1Team}
          coach={game.team1Coach}
          logo={game.team1Logo}
          initial={game.team1Initial}
          overallRecord={game.team1OverallRecord}
          conferenceRecord={game.team1ConferenceRecord}
          rank={game.team1GameRank}
          tier={game.tier}
          tierClass={game.tierClass}
        />

        <div className="game-score">
          <div className="game-score-line">
            <strong>{team1Display}</strong>
            <span>{isPregame ? "vs" : "—"}</span>
            <strong>{team2Display}</strong>
          </div>

          <div className="game-projection-line">
            <span>Proj: {formatHomePoints(game.team1Projection)}</span>
            <span>Proj: {formatHomePoints(game.team2Projection)}</span>
          </div>

          <span className={isLive ? "game-status-live" : "game-status-time"}>
            {isLive
              ? "● Live"
              : isFinal
                ? "Final"
                : game.label || "Regular Season"}
          </span>
        </div>

        <TeamIdentity
          team={game.team2Team}
          coach={game.team2Coach}
          logo={game.team2Logo}
          initial={game.team2Initial}
          overallRecord={game.team2OverallRecord}
          conferenceRecord={game.team2ConferenceRecord}
          rank={game.team2GameRank}
          tier={game.tier}
          tierClass={game.tierClass}
        />
      </div>

      {favoredProbability !== null ? (
        <div className="game-probability">
          <div className="game-probability-title">Win probability</div>

          <div className="game-probability-labels">
            <strong>{Math.round(firstProbability)}%</strong>
            <strong>{Math.round(secondProbability)}%</strong>
          </div>

          <div className="game-probability-track">
            <div
              className={[
                "game-probability-fill",
                `game-probability-fill-${game.tierClass}`,
                `game-probability-fill-${favoredSide}`,
              ].join(" ")}
              style={{ width: `${favoredProbability}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="game-card-footer">
        View Game Center
      </div>
    </Link>
  );
}


function HeadlineCard({ headline }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="home-card headline-card">
      <div
        className={`headline-accent headline-accent-${headline.tierClass}`}
      />

      <div className="headline-body">
        <div className="headline-meta">
          <div className="headline-meta-tier">
            {headline.patch ? (
              <img
                className="headline-tier-patch"
                src={headline.patch}
                alt={`${headline.category} MESH patch`}
              />
            ) : null}

            <TierBadge
              tier={headline.category}
              tierClass={headline.tierClass}
            />
          </div>

          <span>{headline.time}</span>
        </div>

        <h3>{headline.title}</h3>
        <p className="headline-teaser">{headline.summary}</p>

        {expanded ? (
          <div className="headline-full-story">
            {headline.fullStory.map((paragraph, index) => (
              <p key={`${headline.category}-story-${index}`}>
                {paragraph}
              </p>
            ))}
          </div>
        ) : null}

        <div className="headline-footer">
          <span>{headline.footer}</span>

          <button
            type="button"
            className="headline-more-button"
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? "Show Less" : "See More"}
          </button>
        </div>
      </div>
    </article>
  );
}



function WeeklyHighScorerCard({
  tier,
  tierClass,
  patch,
  week,
  winner,
}) {
  const hasWinner = Boolean(winner);

  return (
    <article
      className={`home-card weekly-award-card weekly-award-card-${tierClass}`}
    >
      <div className="weekly-award-top">
        <div className="weekly-award-identity">
          {patch ? (
            <img
              className="weekly-award-patch"
              src={patch}
              alt={`${tier} MESH patch`}
            />
          ) : null}

          <div>
            <span>{hasWinner ? `Week ${week} Winner` : "Season Award"}</span>
            <h3>{tier} Weekly High Scorer</h3>
          </div>
        </div>

        <TierBadge tier={tier} tierClass={tierClass} />
      </div>

      {hasWinner ? (
        <>
          <div className="weekly-award-winner">
            <div className="weekly-award-logo">
              {winner.logo ? (
                <img src={winner.logo} alt={`${winner.team} logo`} />
              ) : (
                <span>{winner.initial}</span>
              )}
            </div>

            <div className="weekly-award-team">
              <strong>{winner.team}</strong>
              <span>{winner.coach || "Coach TBD"}</span>
            </div>

            <div className="weekly-award-points">
              <strong>{winner.score.toFixed(2)}</strong>
              <span>PRESTIGE PTS</span>
            </div>
          </div>

          <div className="weekly-award-result">
            <Trophy size={16} />
            <span>{winner.result}</span>
          </div>

          <div className="weekly-award-career weekly-award-career-pending">
            <span>
              🏆 Career High Score Award total for this franchise will appear
              when the historical award archive is connected.
            </span>
            <span>
              🏆 Career High Score Award total for this coach will appear when
              the historical award archive is connected.
            </span>
          </div>
        </>
      ) : (
        <div className="weekly-award-empty">
          <Trophy size={24} />
          <strong>Awards begin after Week 1</strong>
          <span>
            The highest-scoring {tier} franchise each week will be recognized
            here once results are complete.
          </span>
          <small>
            Franchise and coach career award totals will be added from the
            historical archive.
          </small>
        </div>
      )}
    </article>
  );
}


const prestigePlaceholder = {
  NFL: {
    franchises: [
      { rank: 1, name: "Franchise Leader", points: "—" },
      { rank: 2, name: "Franchise Leader", points: "—" },
      { rank: 3, name: "Franchise Leader", points: "—" },
    ],
    coaches: [
      { rank: 1, name: "Coach Leader", points: "—" },
      { rank: 2, name: "Coach Leader", points: "—" },
      { rank: 3, name: "Coach Leader", points: "—" },
    ],
  },
  FBS: {
    franchises: [
      { rank: 1, name: "Franchise Leader", points: "—" },
      { rank: 2, name: "Franchise Leader", points: "—" },
      { rank: 3, name: "Franchise Leader", points: "—" },
    ],
    coaches: [
      { rank: 1, name: "Coach Leader", points: "—" },
      { rank: 2, name: "Coach Leader", points: "—" },
      { rank: 3, name: "Coach Leader", points: "—" },
    ],
  },
  FCS: {
    franchises: [
      { rank: 1, name: "Franchise Leader", points: "—" },
      { rank: 2, name: "Franchise Leader", points: "—" },
      { rank: 3, name: "Franchise Leader", points: "—" },
    ],
    coaches: [
      { rank: 1, name: "Coach Leader", points: "—" },
      { rank: 2, name: "Coach Leader", points: "—" },
      { rank: 3, name: "Coach Leader", points: "—" },
    ],
  },
};

function PrestigeLeaderList({ title, icon: Icon, entries, type }) {
  return (
    <div className="prestige-leader-block">
      <div className="prestige-leader-block-title">
        <Icon size={14} />
        <span>{title}</span>
      </div>

      <div className="prestige-leader-list">
        {entries.map((entry) => (
          <div
            className="prestige-leader-row"
            key={`${type}-${entry.rank}`}
          >
            <span className="prestige-leader-rank">{entry.rank}</span>

            <div className="prestige-leader-copy">
              <strong>{entry.name}</strong>
              <span>
                {type === "franchise"
                  ? "Career franchise prestige"
                  : "Career coach prestige"}
              </span>
            </div>

            <div className="prestige-leader-points">
              <strong>{entry.points}</strong>
              <span>PRESTIGE PTS</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrestigeTierCard({
  tier,
  tierClass,
  patch,
  franchiseLeaders,
  coachLeaders,
}) {
  const data = prestigePlaceholder[tier];

  const franchiseEntries =
    franchiseLeaders && franchiseLeaders.length > 0
      ? franchiseLeaders.map((entry, index) => ({
          rank: index + 1,
          name: entry.name,
          points: Number(entry.points).toFixed(1),
        }))
      : data.franchises;

  const coachEntries =
    coachLeaders && coachLeaders.length > 0
      ? coachLeaders.map((entry, index) => ({
          rank: index + 1,
          name: entry.name,
          points: Number(entry.points).toFixed(1),
        }))
      : data.coaches;

  return (
    <Link
      className={`home-card prestige-tier-card prestige-tier-card-${tierClass}`}
      to={`/prestige?tier=${encodeURIComponent(tier)}`}
      aria-label={`Open ${tier} Prestige Leaderboard`}
    >
      <div className="prestige-tier-heading">
        <div className="prestige-tier-identity">
          <img
            className="prestige-tier-patch"
            src={patch}
            alt={`${tier} MESH patch`}
          />

          <div>
            <span>Career Prestige</span>
            <h3>{tier} Leaders</h3>
          </div>
        </div>

        <TierBadge tier={tier} tierClass={tierClass} />
      </div>

      <PrestigeLeaderList
        title="Top Franchises"
        icon={Trophy}
        entries={franchiseEntries}
        type="franchise"
      />

      <PrestigeLeaderList
        title="Top Coaches"
        icon={Users}
        entries={coachEntries}
        type="coach"
      />
    </Link>
  );
}


function numericScore(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function gameHasResult(game) {
  return (
    numericScore(game?.team1Score) !== null &&
    numericScore(game?.team2Score) !== null
  );
}

function getWinnerSide(game) {
  if (!gameHasResult(game)) return null;

  const team1Score = Number(game.team1Score);
  const team2Score = Number(game.team2Score);

  if (team1Score === team2Score) return null;
  return team1Score > team2Score ? 1 : 2;
}


function historyWinnerId(meeting) {
  if (meeting?.winnerId) return meeting.winnerId;

  const score1 = numericScore(meeting?.team1Score);
  const score2 = numericScore(meeting?.team2Score);

  if (score1 === null || score2 === null || score1 === score2) return "";
  return score1 > score2 ? meeting.team1Id : meeting.team2Id;
}

function buildHistoricalContext(game, priorMeetings = []) {
  if (!game || !Array.isArray(priorMeetings)) return null;

  const currentWinnerSide = getWinnerSide(game);
  const currentWinnerId =
    currentWinnerSide === 1
      ? game.team1Id
      : currentWinnerSide === 2
        ? game.team2Id
        : "";

  const completedPrior = priorMeetings.filter(
    (meeting) =>
      numericScore(meeting?.team1Score) !== null &&
      numericScore(meeting?.team2Score) !== null,
  );

  let team1WinsBefore = 0;
  let team2WinsBefore = 0;
  let tiesBefore = 0;

  completedPrior.forEach((meeting) => {
    const winnerId = historyWinnerId(meeting);

    if (!winnerId) tiesBefore += 1;
    else if (winnerId === game.team1Id) team1WinsBefore += 1;
    else if (winnerId === game.team2Id) team2WinsBefore += 1;
  });

  const team1WinsAfter =
    team1WinsBefore + (currentWinnerId === game.team1Id ? 1 : 0);
  const team2WinsAfter =
    team2WinsBefore + (currentWinnerId === game.team2Id ? 1 : 0);
  const tiesAfter =
    tiesBefore + (!currentWinnerId && gameHasResult(game) ? 1 : 0);

  const meetingsAfter = completedPrior.length + (gameHasResult(game) ? 1 : 0);

  const leaderText =
    team1WinsAfter === team2WinsAfter
      ? `the all-time series is now tied ${team1WinsAfter}–${team2WinsAfter}`
      : team1WinsAfter > team2WinsAfter
        ? `${game.team1Team} now leads the all-time series ${team1WinsAfter}–${team2WinsAfter}`
        : `${game.team2Team} now leads the all-time series ${team2WinsAfter}–${team1WinsAfter}`;

  let currentStreakWinnerId = currentWinnerId;
  let currentStreakCount = currentWinnerId ? 1 : 0;

  if (currentWinnerId) {
    for (const meeting of completedPrior) {
      const winnerId = historyWinnerId(meeting);
      if (winnerId !== currentWinnerId) break;
      currentStreakCount += 1;
    }
  }

  const lastPrior = completedPrior[0] ?? null;
  let priorMeetingText = "";

  if (lastPrior) {
    const score1 = Number(lastPrior.team1Score).toFixed(1);
    const score2 = Number(lastPrior.team2Score).toFixed(1);
    priorMeetingText =
      ` Their previous meeting came in ${lastPrior.season}, Week ${lastPrior.week}, ` +
      `when ${lastPrior.team1Team} and ${lastPrior.team2Team} finished ${score1}–${score2}.`;
  }

  const streakText =
    currentStreakWinnerId && currentStreakCount >= 2
      ? ` The win also gives ${
          currentStreakWinnerId === game.team1Id
            ? game.team1Team
            : game.team2Team
        } ${currentStreakCount} straight in the series.`
      : "";

  return {
    priorMeetings: completedPrior.length,
    meetingsAfter,
    leaderText,
    priorMeetingText,
    streakText,
    tiesAfter,
  };
}

function buildResultHeadline(game, week, priorMeetings = []) {
  const winnerSide = getWinnerSide(game);
  if (!winnerSide) return null;

  const loserSide = winnerSide === 1 ? 2 : 1;

  const winnerTeam = game[`team${winnerSide}Team`];
  const loserTeam = game[`team${loserSide}Team`];
  const winnerCoach = game[`team${winnerSide}Coach`];
  const loserCoach = game[`team${loserSide}Coach`];
  const winnerScore = numericScore(game[`team${winnerSide}Score`]);
  const loserScore = numericScore(game[`team${loserSide}Score`]);
  const winnerRank = Number(game[`team${winnerSide}GameRank`]) || 0;
  const loserRank = Number(game[`team${loserSide}GameRank`]) || 0;

  const winnerRanked = winnerRank >= 1 && winnerRank <= 25;
  const loserRanked = loserRank >= 1 && loserRank <= 25;

  const isRankedUpset =
    (loserRanked && !winnerRanked) ||
    (winnerRanked && loserRanked && winnerRank > loserRank);

  const winnerLabel = winnerRanked
    ? `#${winnerRank} ${winnerTeam}`
    : winnerTeam;

  const loserLabel = loserRanked
    ? `#${loserRank} ${loserTeam}`
    : loserTeam;

  const margin = Math.abs(winnerScore - loserScore).toFixed(1);

  let title;

  if (isRankedUpset) {
    title = `${winnerLabel} knocks off ${loserLabel}`;
  } else if (Number(game.featuredRank) === 1) {
    title = `${winnerLabel} wins the ${game.tier} Game of the Week`;
  } else {
    title = `${winnerLabel} tops ${loserLabel} in Week ${week}`;
  }

  const summary =
    `${winnerCoach || winnerTeam} guided ${winnerLabel} to a ` +
    `${winnerScore.toFixed(1)}–${loserScore.toFixed(1)} victory over ${loserLabel}.`;

  const context = isRankedUpset
    ? `The result immediately changes the conversation in the ${game.tier} race, with ${winnerLabel} taking down a higher-ranked opponent.`
    : `The ${margin}-point margin made this one of the notable results from Week ${week}.`;

  const coachContext =
    winnerCoach && loserCoach
      ? `${winnerCoach} came out on top in the coaching matchup with ${loserCoach}, while both franchises now turn their attention to the next week of the MESH season.`
      : `Both franchises now move forward with the Week ${week} result added to their season résumé.`;

  const historicalContext = buildHistoricalContext(game, priorMeetings);

  const historyParagraph =
    historicalContext && historicalContext.priorMeetings > 0
      ? `With the result added to the archive, ${historicalContext.leaderText}.${historicalContext.streakText}${historicalContext.priorMeetingText}`
      : `This was the first archived meeting between ${game.team1Team} and ${game.team2Team} in the current MESH historical database.`;

  return {
    category: game.tier,
    tierClass: game.tierClass,
    patch: MESH_PATCHES.tier[game.tier] ?? null,
    title,
    summary,
    fullStory: [
      context,
      historyParagraph,
      coachContext,
    ],
    time: `Week ${week} recap`,
    footer:
      isRankedUpset
        ? "Top 25 impact"
        : Number(game.featuredRank) === 1
          ? `${game.tier} Game of the Week`
          : game.label || "Regular Season",
  };
}

function buildWeekOneMatchupStory(game, priorMeetings = []) {
  if (!game) return null;

  const team1Rank = Number(game.team1GameRank) || 0;
  const team2Rank = Number(game.team2GameRank) || 0;

  const team1Label =
    team1Rank >= 1 && team1Rank <= 25
      ? `#${team1Rank} ${game.team1Team}`
      : game.team1Team;

  const team2Label =
    team2Rank >= 1 && team2Rank <= 25
      ? `#${team2Rank} ${game.team2Team}`
      : game.team2Team;

  const completedPrior = priorMeetings.filter(
    (meeting) =>
      numericScore(meeting?.team1Score) !== null &&
      numericScore(meeting?.team2Score) !== null,
  );

  let historyParagraph;

  if (completedPrior.length > 0) {
    let team1Wins = 0;
    let team2Wins = 0;
    let ties = 0;

    completedPrior.forEach((meeting) => {
      const winnerId = historyWinnerId(meeting);
      if (!winnerId) ties += 1;
      else if (winnerId === game.team1Id) team1Wins += 1;
      else if (winnerId === game.team2Id) team2Wins += 1;
    });

    const seriesText =
      team1Wins === team2Wins
        ? `The permanent franchises enter the matchup tied ${team1Wins}–${team2Wins} in their archived series`
        : team1Wins > team2Wins
          ? `${game.team1Team}'s permanent franchise leads the archived series ${team1Wins}–${team2Wins}`
          : `${game.team2Team}'s permanent franchise leads the archived series ${team2Wins}–${team1Wins}`;

    const last = completedPrior[0];

    historyParagraph =
      `${seriesText}. Their most recent archived meeting was ${last.season}, Week ${last.week}, ` +
      `a ${Number(last.team1Score).toFixed(1)}–${Number(last.team2Score).toFixed(1)} result between ` +
      `${last.team1Team} and ${last.team2Team}.`;
  } else {
    historyParagraph =
      `No prior meeting is currently stored between these permanent franchises in the MESH GAME_RESULTS archive.`;
  }

  return {
    category: game.tier,
    tierClass: game.tierClass,
    patch: MESH_PATCHES.tier[game.tier] ?? null,
    title: `${team1Label} and ${team2Label} open the season in the spotlight`,
    summary:
      `${game.team1Coach || game.team1Team} and ${game.team2Coach || game.team2Team} meet in one of the biggest opening-week matchups on the MESH schedule.`,
    fullStory: [
      `With no 2026 results yet, the opening week is about setting the tone. This matchup gives both franchises an immediate chance to establish momentum before the standings begin to take shape.`,
      historyParagraph,
    ],
    time: "Week 1 preview",
    footer: "Opening week spotlight",
  };
}

function buildWeekOneFbsStory(team) {
  if (!team) return null;

  const rank = Number(team.top25Rank) || Number(team.overallRank) || 1;

  return {
    category: "FBS",
    tierClass: "fbs",
    patch: MESH_PATCHES.tier.FBS,
    title: `#${rank} ${team.team} opens 2026 at the top of the FBS poll`,
    summary:
      `${team.coach || team.team} begins the year with the No. ${rank} ranking as 98 FBS franchises start the race toward the CFP and the four promotion spots.`,
    fullStory: [
      `${team.team} enters Week 1 carrying the highest current FBS ranking. The opening slate will begin separating the early contenders from the rest of the 98-team field.`,
      `The national poll will start to move once results are in, with ranked wins, losses, strength of schedule and weekly performance beginning to reshape the Top 25.`,
    ],
    time: "FBS preseason",
    footer: "Top 25 watch",
  };
}

function buildWeekOneFcsStory(team) {
  if (!team) return null;

  const rank = Number(team.top25Rank) || Number(team.overallRank) || 1;

  return {
    category: "FCS",
    tierClass: "fcs",
    patch: MESH_PATCHES.tier.FCS,
    title: `${team.team} starts the season as the team to catch in the FCS`,
    summary:
      `${team.coach || team.team} opens 2026 at #${rank}, giving the program the first target on its back in a 72-team tier where eight coaches can earn promotion.`,
    fullStory: [
      `The FCS race begins with ${team.team} holding the top position, but the margin for error is small once weekly results begin feeding the national rankings.`,
      `With eight eventual promotion spots on the line, early wins can quickly become important résumé pieces as the season develops and the playoff picture begins to take shape.`,
    ],
    time: "FCS preseason",
    footer: "Promotion race begins",
  };
}


function getBestUpcomingGame(games, tier, week) {
  const tierGames = games.filter(
    (game) => game.tier === tier && Number(game.week) === Number(week),
  );

  if (tierGames.length === 0) return null;

  const gameOfWeek = tierGames.find(
    (game) => Number(game.featuredRank) === 1,
  );

  if (gameOfWeek) return gameOfWeek;

  if (tier !== "NFL") {
    const rankedGames = tierGames
      .map((game) => {
        const rank1 = Number(game.team1GameRank) || 999;
        const rank2 = Number(game.team2GameRank) || 999;
        const ranked1 = rank1 >= 1 && rank1 <= 25;
        const ranked2 = rank2 >= 1 && rank2 <= 25;

        return {
          game,
          rankedCount: Number(ranked1) + Number(ranked2),
          bestRank: Math.min(rank1, rank2),
          rankTotal:
            (ranked1 ? rank1 : 50) +
            (ranked2 ? rank2 : 50),
        };
      })
      .sort(
        (a, b) =>
          b.rankedCount - a.rankedCount ||
          a.bestRank - b.bestRank ||
          a.rankTotal - b.rankTotal,
      );

    if (rankedGames[0]?.rankedCount > 0) {
      return rankedGames[0].game;
    }
  }

  return tierGames[0];
}

function formatUpcomingTeamLabel(team, rank) {
  const numericRank = Number(rank) || 0;
  return numericRank >= 1 && numericRank <= 25
    ? `#${numericRank} ${team}`
    : team;
}

function buildUpcomingNflStory(game, week, priorMeetings = []) {
  if (!game) return null;

  const team1Label = formatUpcomingTeamLabel(
    game.team1Team,
    game.team1GameRank,
  );
  const team2Label = formatUpcomingTeamLabel(
    game.team2Team,
    game.team2GameRank,
  );

  const completedPrior = priorMeetings.filter(
    (meeting) =>
      numericScore(meeting?.team1Score) !== null &&
      numericScore(meeting?.team2Score) !== null,
  );

  let historyParagraph = null;

  if (completedPrior.length > 0) {
    let team1Wins = 0;
    let team2Wins = 0;

    completedPrior.forEach((meeting) => {
      const winnerId = historyWinnerId(meeting);

      if (winnerId === game.team1Id) team1Wins += 1;
      else if (winnerId === game.team2Id) team2Wins += 1;
    });

    const seriesText =
      team1Wins === team2Wins
        ? `The permanent franchises enter Week ${week} tied ${team1Wins}–${team2Wins} in their archived series`
        : team1Wins > team2Wins
          ? `${game.team1Team}'s permanent franchise leads the archived series ${team1Wins}–${team2Wins}`
          : `${game.team2Team}'s permanent franchise leads the archived series ${team2Wins}–${team1Wins}`;

    const last = completedPrior[0];

    historyParagraph =
      `${seriesText}. Their most recent archived meeting was ${last.season}, Week ${last.week}, ` +
      `when ${last.team1Team} and ${last.team2Team} finished ` +
      `${Number(last.team1Score).toFixed(1)}–${Number(last.team2Score).toFixed(1)}.`;
  }

  return {
    category: "NFL",
    tierClass: "nfl",
    patch: MESH_PATCHES.tier.NFL,
    gameId: game.gameId,
    title: `${team1Label} and ${team2Label} headline Week ${week}`,
    summary:
      `${game.team1Coach || game.team1Team} and ${game.team2Coach || game.team2Team} meet in the NFL Game of the Week as the next MESH slate comes into focus.`,
    fullStory: [
      `The NFL spotlight shifts to ${team1Label} against ${team2Label}. With promotion and relegation pressure building across MESH, every result can quickly reshape the race.`,
      historyParagraph,
    ].filter(Boolean),
    time: `Week ${week} preview`,
    footer: "NFL Game of the Week",
  };
}

function buildUpcomingFbsStory(game, week) {
  if (!game) return null;

  const team1Label = formatUpcomingTeamLabel(
    game.team1Team,
    game.team1GameRank,
  );
  const team2Label = formatUpcomingTeamLabel(
    game.team2Team,
    game.team2GameRank,
  );

  const rank1 = Number(game.team1GameRank) || 0;
  const rank2 = Number(game.team2GameRank) || 0;
  const hasRankedTeam =
    (rank1 >= 1 && rank1 <= 25) ||
    (rank2 >= 1 && rank2 <= 25);

  return {
    category: "FBS",
    tierClass: "fbs",
    patch: MESH_PATCHES.tier.FBS,
    gameId: game.gameId,
    title: hasRankedTeam
      ? `${team1Label} vs. ${team2Label} carries Top 25 weight`
      : `${team1Label} and ${team2Label} enter a pivotal FBS week`,
    summary:
      hasRankedTeam
        ? `Week ${week} brings another ranking test as the FBS Top 25 and CFP race continue to take shape.`
        : `Week ${week} brings another chance for FBS contenders to strengthen their conference and promotion résumés.`,
    fullStory: [
      `The FBS picture can move quickly once Week ${week} begins. Conference position, national ranking, and the race for four promotion places all give this matchup added importance.`,
      Number(game.featuredRank) === 1
        ? `This matchup has also been selected as the FBS Game of the Week.`
        : `A strong result here could become one of the résumé-building wins that matters later in the season.`,
    ],
    time: `Week ${week} preview`,
    footer: hasRankedTeam ? "Top 25 watch" : "FBS race",
  };
}

function buildUpcomingFcsStory(game, week) {
  if (!game) return null;

  const team1Label = formatUpcomingTeamLabel(
    game.team1Team,
    game.team1GameRank,
  );
  const team2Label = formatUpcomingTeamLabel(
    game.team2Team,
    game.team2GameRank,
  );

  return {
    category: "FCS",
    tierClass: "fcs",
    patch: MESH_PATCHES.tier.FCS,
    gameId: game.gameId,
    title: `${team1Label} and ${team2Label} meet with promotion points at stake`,
    summary:
      `The Week ${week} FCS slate puts another important result on the board in a tier where eight coaches can earn promotion to the FBS.`,
    fullStory: [
      `The FCS promotion race rewards consistency, and every Week ${week} result can change the order behind the leaders. This matchup gives both sides another chance to improve their position.`,
      Number(game.featuredRank) === 1
        ? `MESH has selected this matchup as the FCS Game of the Week.`
        : `The deeper the season goes, the more valuable wins like this become in the promotion conversation.`,
    ],
    time: `Week ${week} preview`,
    footer: "Promotion watch",
  };
}


function chooseHeadlineGame(games, tier, week) {
  const tierGames = games.filter(
    (game) => game.tier === tier && Number(game.week) === Number(week),
  );

  const resultGames = tierGames.filter(gameHasResult);
  if (resultGames.length === 0) return null;

  if (tier !== "NFL") {
    const upset = resultGames.find((game) => {
      const winnerSide = getWinnerSide(game);
      if (!winnerSide) return false;

      const loserSide = winnerSide === 1 ? 2 : 1;
      const winnerRank = Number(game[`team${winnerSide}GameRank`]) || 0;
      const loserRank = Number(game[`team${loserSide}GameRank`]) || 0;

      const winnerRanked = winnerRank >= 1 && winnerRank <= 25;
      const loserRanked = loserRank >= 1 && loserRank <= 25;

      return (
        (loserRanked && !winnerRanked) ||
        (winnerRanked && loserRanked && winnerRank > loserRank)
      );
    });

    if (upset) return upset;
  }

  const gameOfWeek = resultGames.find(
    (game) => Number(game.featuredRank) === 1,
  );

  if (gameOfWeek) return gameOfWeek;

  return [...resultGames].sort((a, b) => {
    const aTotal =
      (numericScore(a.team1Score) || 0) + (numericScore(a.team2Score) || 0);
    const bTotal =
      (numericScore(b.team1Score) || 0) + (numericScore(b.team2Score) || 0);

    return bTotal - aTotal;
  })[0];
}



function buildWeeklyHighScorers(games, week) {
  const tiers = ["NFL", "FBS", "FCS"];

  return tiers.reduce((result, tier) => {
    const tierGames = games.filter(
      (game) =>
        game.tier === tier &&
        Number(game.week) === Number(week) &&
        gameHasResult(game),
    );

    const franchiseMap = new Map();

    tierGames.forEach((game) => {
      [
        {
          id: game.team1Id,
          team: game.team1Team,
          coach: game.team1Coach,
          logo: game.team1Logo,
          initial: game.team1Initial,
          score: numericScore(game.team1Score),
          opponent: game.team2Team,
          opponentScore: numericScore(game.team2Score),
        },
        {
          id: game.team2Id,
          team: game.team2Team,
          coach: game.team2Coach,
          logo: game.team2Logo,
          initial: game.team2Initial,
          score: numericScore(game.team2Score),
          opponent: game.team1Team,
          opponentScore: numericScore(game.team1Score),
        },
      ].forEach((appearance) => {
        if (!appearance.id || appearance.score === null) return;

        if (!franchiseMap.has(appearance.id)) {
          franchiseMap.set(appearance.id, {
            id: appearance.id,
            team: appearance.team,
            coach: appearance.coach,
            logo: appearance.logo,
            initial: appearance.initial,
            score: appearance.score,
            appearances: [],
          });
        }

        franchiseMap.get(appearance.id).appearances.push({
          opponent: appearance.opponent,
          opponentScore: appearance.opponentScore,
        });
      });
    });

    const winner = [...franchiseMap.values()].sort(
      (a, b) => b.score - a.score,
    )[0];

    if (!winner) {
      result[tier] = null;
      return result;
    }

    const uniqueOpponents = [
      ...new Map(
        winner.appearances.map((item) => [item.opponent, item]),
      ).values(),
    ];

    let resultText = `Week ${week} High Score`;

    if (uniqueOpponents.length === 1) {
      const opponent = uniqueOpponents[0];
      const opponentScore = numericScore(opponent.opponentScore);

      if (opponentScore !== null) {
        if (winner.score > opponentScore) {
          resultText =
            `Defeated ${opponent.opponent}, ` +
            `${winner.score.toFixed(2)}–${opponentScore.toFixed(2)}`;
        } else if (winner.score < opponentScore) {
          resultText =
            `Scored ${winner.score.toFixed(2)} in a loss to ` +
            `${opponent.opponent}`;
        } else {
          resultText =
            `Scored ${winner.score.toFixed(2)} in a tie with ` +
            `${opponent.opponent}`;
        }
      }
    } else if (uniqueOpponents.length > 1) {
      const wins = uniqueOpponents.filter(
        (item) =>
          numericScore(item.opponentScore) !== null &&
          winner.score > Number(item.opponentScore),
      ).length;

      resultText =
        `${winner.score.toFixed(2)} PTS across ${uniqueOpponents.length} ` +
        `Week ${week} matchups • ${wins}-${uniqueOpponents.length - wins}`;
    }

    result[tier] = {
      ...winner,
      result: resultText,
    };

    return result;
  }, {});
}


const TOP_PERFORMER_POSITIONS = ["QB", "DL", "RB", "LB", "WR", "DB", "TE", "K"];

function buildTopPerformers(playerRows, week) {
  return TOP_PERFORMER_POSITIONS.map((position) => {
    const candidates = playerRows.filter(
      (row) =>
        Number(row.week) === Number(week) &&
        String(row.position || "").trim().toUpperCase() === position &&
        Number.isFinite(Number(row.playerPoints)),
    );

    if (candidates.length === 0) {
      return {
        position,
        player: "",
        nflTeam: "",
        points: null,
      };
    }

    const uniquePlayers = new Map();

    candidates.forEach((row) => {
      const key =
        String(row.playerId || "").trim() ||
        `${row.playerName}-${row.nflTeam}-${position}`;

      const existing = uniquePlayers.get(key);

      if (
        !existing ||
        Number(row.playerPoints) > Number(existing.playerPoints)
      ) {
        uniquePlayers.set(key, row);
      }
    });

    const leader = [...uniquePlayers.values()].sort(
      (a, b) =>
        Number(b.playerPoints) - Number(a.playerPoints) ||
        String(a.playerName || "").localeCompare(String(b.playerName || "")),
    )[0];

    return {
      position,
      player: String(leader.playerName || "").trim(),
      nflTeam: String(leader.nflTeam || "").trim(),
      points: Number(leader.playerPoints),
    };
  });
}

function TopPerformerCard({ performer }) {
  const hasWinner =
    performer.player && Number.isFinite(Number(performer.points));

  return (
    <article className="home-card performer-card performer-card-live">
      <div className="performer-position">{performer.position}</div>

      {hasWinner ? (
        <>
          <div className="performer-info">
            <strong>{performer.player}</strong>
            <span>{performer.nflTeam || "NFL"}</span>
          </div>

          <div className="performer-points">
            <strong>{Number(performer.points).toFixed(2)}</strong>
            <span>PTS</span>
          </div>
        </>
      ) : (
        <div className="performer-empty-copy">
          <strong>Awaiting results</strong>
          <span>Week leader will appear here</span>
        </div>
      )}
    </article>
  );
}

function Home() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [settings, setSettings] = useState(null);
  const [standings, setStandings] = useState([]);
  const [franchisePrestige, setFranchisePrestige] = useState({
    NFL: [],
    FBS: [],
    FCS: [],
  });
  const [coachPrestige, setCoachPrestige] = useState({
    NFL: [],
    FBS: [],
    FCS: [],
  });
  const [livePlayerScores, setLivePlayerScores] = useState([]);
  const [headlineHistory, setHeadlineHistory] = useState({});
  const [homeLoading, setHomeLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [weekMenuOpen, setWeekMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadHome() {
      try {
        const [gameResults, appSettings, standingsData] = await Promise.all([
          getGameResults(),
          getAppSettings(),
          getStandingsData(),
        ]);

        if (!cancelled) {
          setGames(gameResults);
          setSettings(appSettings);
          setStandings(standingsData);
          setSelectedWeek(
            (current) => current ?? (Number(appSettings?.currentWeek) || 1),
          );
        }
      } catch (error) {
        console.error("Home data failed to load:", error);
      } finally {
        if (!cancelled) {
          setHomeLoading(false);
        }
      }
    }

    loadHome();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadHeadlineHistory() {
      const currentWeek = Number(settings?.currentWeek) || 1;
      if (!games.length || !currentWeek) return;

      const targetGames = [];

      if (currentWeek <= 1) {
        const openingGame = games.find(
          (game) =>
            game.tier === "NFL" &&
            Number(game.week) === currentWeek &&
            Number(game.featuredRank) === 1,
        );

        if (openingGame) targetGames.push(openingGame);
      } else {
        ["NFL", "FBS", "FCS"].forEach((tier) => {
          const recapGame = chooseHeadlineGame(games, tier, currentWeek - 1);
          if (recapGame) targetGames.push(recapGame);
        });

        const upcomingNflGame = getBestUpcomingGame(
          games,
          "NFL",
          currentWeek,
        );

        if (upcomingNflGame) targetGames.push(upcomingNflGame);
      }

      const uniqueGames = targetGames.filter(
        (game, index, list) =>
          game?.gameId &&
          list.findIndex((item) => item.gameId === game.gameId) === index,
      );

      if (uniqueGames.length === 0) return;

      try {
        const entries = await Promise.all(
          uniqueGames.map(async (game) => {
            try {
              const history = await getHeadToHeadHistory(
                game.team1Id,
                game.team2Id,
                game.gameId,
              );

              return [game.gameId, history];
            } catch (error) {
              console.warn(
                `Headline history unavailable for ${game.gameId}.`,
                error,
              );
              return [game.gameId, []];
            }
          }),
        );

        if (!cancelled) {
          setHeadlineHistory(Object.fromEntries(entries));
        }
      } catch (error) {
        console.warn("Historical headline context unavailable.", error);
      }
    }

    loadHeadlineHistory();

    return () => {
      cancelled = true;
    };
  }, [games, settings?.currentWeek]);

  useEffect(() => {
    let cancelled = false;

    async function loadFranchisePrestige() {
      try {
        const data = await getFranchisePrestigeLeaders();

        if (!cancelled) {
          setFranchisePrestige(data);
        }
      } catch (error) {
        console.warn(
          "Franchise prestige unavailable; placeholders will remain.",
          error,
        );
      }
    }

    loadFranchisePrestige();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCoachPrestige() {
      try {
        const data = await getCoachPrestigeLeaders();

        if (!cancelled) {
          setCoachPrestige(data);
        }
      } catch (error) {
        console.warn(
          "Coach prestige unavailable; coach placeholders will remain.",
          error,
        );
      }
    }

    loadCoachPrestige();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTopPerformers() {
      try {
        const rows = await getLivePlayerScores();

        if (!cancelled) {
          setLivePlayerScores(rows);
        }
      } catch (error) {
        console.warn(
          "Top performer data unavailable; placeholders will remain.",
          error,
        );
      }
    }

    loadTopPerformers();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentWeek = Number(settings?.currentWeek) || 1;
  const activeWeek = Number(selectedWeek) || currentWeek;

  const availableWeeks = useMemo(() => {
    const weeks = [...new Set(
      games
        .map((game) => Number(game.week))
        .filter((week) => Number.isFinite(week) && week >= 1),
    )].sort((a, b) => a - b);

    return weeks.length > 0
      ? weeks.filter((week) => week <= 17)
      : Array.from({ length: 17 }, (_, i) => i + 1);
  }, [games]);

  const gamesOfTheWeek = useMemo(() => {
    const tiers = ["NFL", "FBS", "FCS"];

    return tiers
      .map((tier) =>
        games.find(
          (game) =>
            game.week === activeWeek &&
            game.tier === tier &&
            Number(game.featuredRank) === 1,
        ),
      )
      .filter(Boolean);
  }, [games, activeWeek]);

  const currentPhase = useMemo(() => {
    const event = settings?.tierEvents?.find(
      (item) => Number(item.week) === activeWeek && item.phase,
    );

    return event?.phase || "Regular Season";
  }, [settings, activeWeek]);

  const headlines = useMemo(() => {
    const tiers = ["NFL", "FBS", "FCS"];
    const previousWeek = currentWeek - 1;

    if (previousWeek < 1) {
      const nflGame = games.find(
        (item) =>
          item.tier === "NFL" &&
          Number(item.week) === currentWeek &&
          Number(item.featuredRank) === 1,
      );

      const fbsLeader = [...standings]
        .filter(
          (team) =>
            team.tier === "FBS" &&
            Number(team.top25Rank) >= 1 &&
            Number(team.top25Rank) <= 25,
        )
        .sort((a, b) => Number(a.top25Rank) - Number(b.top25Rank))[0];

      const fcsLeader = [...standings]
        .filter(
          (team) =>
            team.tier === "FCS" &&
            Number(team.top25Rank) >= 1 &&
            Number(team.top25Rank) <= 25,
        )
        .sort((a, b) => Number(a.top25Rank) - Number(b.top25Rank))[0];

      return [
        buildWeekOneMatchupStory(nflGame, headlineHistory[nflGame?.gameId] ?? []),
        buildWeekOneFbsStory(fbsLeader),
        buildWeekOneFcsStory(fcsLeader),
      ].filter(Boolean);
    }

    return tiers
      .map((tier) => {
        const game = chooseHeadlineGame(games, tier, previousWeek);
        return buildResultHeadline(game, previousWeek, headlineHistory[game?.gameId] ?? []);
      })
      .filter(Boolean);
  }, [games, standings, currentWeek, headlineHistory]);

  const previousWeek = currentWeek - 1;

  const showUpcomingHeadlines = useMemo(() => {
    if (currentWeek <= 1) return false;

    const day = new Date().getDay();

    // Thursday through Monday. Tuesday/Wednesday remain recap-only.
    return day === 4 || day === 5 || day === 6 || day === 0 || day === 1;
  }, [currentWeek]);

  const upcomingHeadlines = useMemo(() => {
    if (!showUpcomingHeadlines) return [];

    const nflGame = getBestUpcomingGame(games, "NFL", currentWeek);
    const fbsGame = getBestUpcomingGame(games, "FBS", currentWeek);
    const fcsGame = getBestUpcomingGame(games, "FCS", currentWeek);

    return [
      buildUpcomingNflStory(
        nflGame,
        currentWeek,
        headlineHistory[nflGame?.gameId] ?? [],
      ),
      buildUpcomingFbsStory(fbsGame, currentWeek),
      buildUpcomingFcsStory(fcsGame, currentWeek),
    ].filter(Boolean);
  }, [games, currentWeek, showUpcomingHeadlines, headlineHistory]);

  const weeklyHighScorers = useMemo(() => {
    if (previousWeek < 1) {
      return { NFL: null, FBS: null, FCS: null };
    }

    return buildWeeklyHighScorers(games, previousWeek);
  }, [games, previousWeek]);



  const topPerformersWeek = currentWeek - 1;

  const topPerformers = useMemo(() => {
    if (topPerformersWeek < 1) {
      return TOP_PERFORMER_POSITIONS.map((position) => ({
        position,
        player: "",
        nflTeam: "",
        points: null,
      }));
    }

    return buildTopPerformers(livePlayerScores, topPerformersWeek);
  }, [livePlayerScores, topPerformersWeek]);

  return (
    <div className="home-page">
      <section className="home-week-toolbar">
        <div className="home-week-menu">
          <button
            type="button"
            className="home-week-selector"
            aria-expanded={weekMenuOpen}
            aria-haspopup="listbox"
            onClick={() => setWeekMenuOpen((open) => !open)}
          >
            <span>Week {activeWeek}</span>
            <span className="home-week-divider">•</span>
            <span>{currentPhase}</span>
            <ChevronDown
              size={16}
              className={weekMenuOpen ? "home-week-chevron-open" : ""}
            />
          </button>

          {weekMenuOpen ? (
            <div
              className="home-week-options"
              role="listbox"
              aria-label="Select week"
            >
              {availableWeeks.map((week) => (
                <button
                  type="button"
                  key={week}
                  className={[
                    "home-week-option",
                    week === activeWeek ? "home-week-option-active" : "",
                    week === currentWeek ? "home-week-option-current" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    setSelectedWeek(week);
                    setWeekMenuOpen(false);
                  }}
                >
                  <span>Week {week}</span>
                  {week === currentWeek ? <small>Current</small> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="home-section">
        <SectionHeading
          eyebrow="This week in MESH"
          title="Games of the Week"
          action="All scores"
          actionTo="/scores"
        />

        {homeLoading ? (
          <div className="home-loading-card">Loading featured matchups…</div>
        ) : gamesOfTheWeek.length > 0 ? (
          <div className="games-grid">
            {gamesOfTheWeek.map((game) => (
              <GameOfTheWeekCard key={game.gameId} game={game} />
            ))}
          </div>
        ) : (
          <div className="home-loading-card">
            No Game of the Week has been assigned for Week {activeWeek}.
          </div>
        )}
      </section>

      <section className="home-section">
        <SectionHeading
          eyebrow={
            currentWeek <= 1
              ? "Opening week storylines"
              : showUpcomingHeadlines
                ? `Thursday preview • Week ${currentWeek}`
                : `Biggest stories from Week ${currentWeek - 1}`
          }
          title="MESH Headlines"
        />

        {homeLoading ? (
          <div className="home-loading-card">Loading MESH headlines…</div>
        ) : (
          <>
            {showUpcomingHeadlines && upcomingHeadlines.length > 0 ? (
              <div className="home-headline-group">
                <div
                  style={{
                    margin: "0 0 10px",
                    fontSize: ".63rem",
                    fontWeight: 900,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    color: "#9cadbd",
                  }}
                >
                  Looking Ahead to Week {currentWeek}
                </div>

                <div className="headlines-grid">
                  {upcomingHeadlines.map((headline) => (
                    <HeadlineCard
                      key={`upcoming-${headline.category}-${headline.gameId}`}
                      headline={headline}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {headlines.length > 0 ? (
              <div className="home-headline-group">
                {currentWeek > 1 ? (
                  <div
                    style={{
                      margin: showUpcomingHeadlines ? "20px 0 10px" : "0 0 10px",
                      fontSize: ".63rem",
                      fontWeight: 900,
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                      color: "#9cadbd",
                    }}
                  >
                    Week {currentWeek - 1} Recap
                  </div>
                ) : null}

                <div className="headlines-grid">
                  {headlines.map((headline) => (
                    <HeadlineCard
                      key={`recap-${headline.category}-${headline.gameId}`}
                      headline={headline}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="home-loading-card">
                Headlines will appear once featured matchups are available.
              </div>
            )}
          </>
        )}
      </section>

      <section className="home-section">
        <SectionHeading
          eyebrow={
            previousWeek < 1
              ? "Weekly awards begin after Week 1"
              : `Week ${previousWeek} award winners`
          }
          title="Weekly High Scorers"
        />

        <div className="weekly-award-grid">
          <WeeklyHighScorerCard
            tier="NFL"
            tierClass="nfl"
            patch={MESH_PATCHES.tier.NFL}
            week={previousWeek}
            winner={weeklyHighScorers.NFL}
          />

          <WeeklyHighScorerCard
            tier="FBS"
            tierClass="fbs"
            patch={MESH_PATCHES.tier.FBS}
            week={previousWeek}
            winner={weeklyHighScorers.FBS}
          />

          <WeeklyHighScorerCard
            tier="FCS"
            tierClass="fcs"
            patch={MESH_PATCHES.tier.FCS}
            week={previousWeek}
            winner={weeklyHighScorers.FCS}
          />
        </div>
      </section>

      <section className="home-section">
        <SectionHeading
          eyebrow="Career accomplishments across MESH"
          title="Prestige Leaders"
        />

        <div className="prestige-tier-grid">
          <PrestigeTierCard
            tier="NFL"
            tierClass="nfl"
            patch={MESH_PATCHES.tier.NFL}
            franchiseLeaders={franchisePrestige.NFL}
            coachLeaders={coachPrestige.NFL}
          />
          <PrestigeTierCard
            tier="FBS"
            tierClass="fbs"
            patch={MESH_PATCHES.tier.FBS}
            franchiseLeaders={franchisePrestige.FBS}
            coachLeaders={coachPrestige.FBS}
          />
          <PrestigeTierCard
            tier="FCS"
            tierClass="fcs"
            patch={MESH_PATCHES.tier.FCS}
            franchiseLeaders={franchisePrestige.FCS}
            coachLeaders={coachPrestige.FCS}
          />
        </div>
      </section>

      <section className="home-section">
        <SectionHeading
          eyebrow={
            topPerformersWeek < 1
              ? "Weekly leaders begin after Week 1"
              : `Week ${topPerformersWeek} leaders`
          }
          title="Top Performers"
        />

        <div className="performers-grid performers-grid-eight">
          {topPerformers.map((performer) => (
            <TopPerformerCard
              key={performer.position}
              performer={performer}
            />
          ))}
        </div>
      </section>

      <section className="home-section">
        <SectionHeading eyebrow="Explore MESH" title="Quick Links" />

        <div className="quick-links-grid">
          {quickLinks.map((link) => {
            const LinkIcon = link.icon;

            return (
              <button
                type="button"
                className="home-card quick-link-card"
                key={link.title}
                onClick={() => {
                  if (link.path) navigate(link.path);
                }}
              >
                <span className="quick-link-icon">
                  <LinkIcon size={21} />
                </span>

                <span className="quick-link-copy">
                  <strong>{link.title}</strong>
                  <small>{link.description}</small>
                </span>

                <ChartNoAxesColumnIncreasing
                  size={17}
                  className="quick-link-arrow"
                />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default Home;