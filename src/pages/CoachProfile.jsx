import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Shield,
  Trophy,
} from "lucide-react";

import {
  getGameResults,
  getStandingsArchive,
  getStandingsData,
} from "../services/googleSheets";

import {
  findCoachDataRow,
  getCoachDataRows,
  getCoachSeasonTenureRows,
} from "../services/coachData";

import "../styles/coaches.css";

function normalizeCoachId(team) {
  return String(team?.coachId || team?.ownerId || team?.coach || "").trim();
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatRecord(wins, losses, ties = 0) {
  const w = number(wins);
  const l = number(losses);
  const t = number(ties);

  return t > 0 ? `${w}-${l}-${t}` : `${w}-${l}`;
}

function formatPct(wins, losses, ties = 0) {
  const w = number(wins);
  const l = number(losses);
  const t = number(ties);
  const total = w + l + t;

  if (!total) return "—";

  return ((w + t * 0.5) / total).toFixed(3).replace(/^0/, "");
}

function formatPF(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : "—";
}

function CareerStat({ label, value = "—", detail }) {
  return (
    <article className="coach-career-stat coach-career-stat-clean">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

function TierCareerCard({ tier, title, rows }) {
  return (
    <article className={`coach-tier-career-card coach-tier-career-card-${tier.toLowerCase()}`}>
      <div className="coach-tier-career-heading">
        <div>
          <span>{tier} Career</span>
          <h3>{title}</h3>
        </div>
        <strong>{rows[0]?.value || "0"}</strong>
      </div>

      <div className="coach-tier-career-rows">
        {rows.slice(1).map((row) => (
          <div className="coach-tier-career-row" key={row.label}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
            {row.detail ? <small>{row.detail}</small> : null}
          </div>
        ))}
      </div>
    </article>
  );
}

function getGameSide(game, franchiseId) {
  if (game.team1Id === franchiseId) return 1;
  if (game.team2Id === franchiseId) return 2;
  return null;
}

function gameBelongsToTenure(game, tenure) {
  if (Number(game.season) !== Number(tenure.season)) return false;

  const side = getGameSide(game, tenure.franchiseId);
  if (!side) return false;

  const week = Number(game.week);

  if (
    Number.isFinite(Number(tenure.startWeek)) &&
    week < Number(tenure.startWeek)
  ) {
    return false;
  }

  if (
    Number.isFinite(Number(tenure.endWeek)) &&
    week > Number(tenure.endWeek)
  ) {
    return false;
  }

  return true;
}

function getTenureLogo(tenure, games, currentTeam) {
  if (
    Number(tenure.season) === 2026 &&
    tenure.franchiseId === currentTeam.franchiseId
  ) {
    return currentTeam.logo || "";
  }

  const game = games.find((item) => gameBelongsToTenure(item, tenure));

  if (!game) return "";

  if (game.team1Id === tenure.franchiseId) return game.team1Logo || "";
  if (game.team2Id === tenure.franchiseId) return game.team2Logo || "";

  return "";
}

function getSeasonRecord(tenure, currentTeam) {
  const isCurrent =
    Number(tenure.season) === 2026 &&
    tenure.franchiseId === currentTeam.franchiseId;

  if (isCurrent && tenure.overallWins === null) {
    return currentTeam.overallSeasonRecord || "0-0";
  }

  return formatRecord(
    tenure.overallWins,
    tenure.overallLosses,
    tenure.overallTies,
  );
}

function getGameResult(game, franchiseId) {
  if (game.status !== "final") return "";
  if (!game.winnerId) return "T";
  return game.winnerId === franchiseId ? "W" : "L";
}

function getGameDescriptor(game) {
  return [
    game.gameCategory,
    game.gameType,
    game.label,
    game.bowlName,
    game.notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isPostseasonGame(game) {
  const text = getGameDescriptor(game);

  return (
    text.includes("playoff") ||
    text.includes("wild card") ||
    text.includes("quarterfinal") ||
    text.includes("quarter final") ||
    text.includes("semifinal") ||
    text.includes("semi final") ||
    text.includes("championship") ||
    text.includes("bowl") ||
    text.includes("cfp")
  );
}

function getCfpStage(game) {
  const text = getGameDescriptor(game);

  if (
    text.includes("national championship") ||
    text.includes("cfp championship")
  ) {
    return "CFP National Championship";
  }

  if (text.includes("semifinal") || text.includes("semi final")) {
    return "CFP Semifinalist";
  }

  if (text.includes("quarterfinal") || text.includes("quarter final")) {
    return "CFP Quarterfinalist";
  }

  if (text.includes("first round") || text.includes("1st round")) {
    return "CFP First Round";
  }

  return "";
}

function getFcsStage(game) {
  const text = getGameDescriptor(game);

  if (text.includes("championship")) {
    return "FCS National Championship";
  }

  if (text.includes("semifinal") || text.includes("semi final")) {
    return "FCS Semifinal";
  }

  if (text.includes("quarterfinal") || text.includes("quarter final")) {
    return "FCS Quarterfinal";
  }

  if (text.includes("2nd round") || text.includes("second round")) {
    return "FCS Second Round";
  }

  if (text.includes("1st round") || text.includes("first round")) {
    return "FCS First Round";
  }

  return "FCS Playoff";
}

function getNflStage(game) {
  const text = getGameDescriptor(game);

  if (text.includes("super bowl")) return "Super Bowl";

  if (
    text.includes("conference championship") ||
    text.includes("conf championship")
  ) {
    return "Conference Championship";
  }

  if (text.includes("divisional")) return "Playoffs - Divisional Round";
  if (text.includes("wild card")) return "Playoffs - Wild Card";

  return "NFL Playoff";
}

function formatCoachSeasonAchievements(seasonRow, seasonGames, franchiseId) {
  if (!seasonRow || Number(seasonRow.season) === 2026) return [];

  const tier = String(seasonRow.tier || "").toUpperCase();
  const conference = String(seasonRow.conference || "").trim();
  const division = String(seasonRow.division || "").trim();
  const conferenceResult = String(seasonRow.conferenceResult || "").trim();
  const conferenceLower = conferenceResult.toLowerCase();

  const items = [];

  if (conferenceLower.includes("conference champion")) {
    items.push(
      tier === "NFL"
        ? conference
          ? `${conference} Champion`
          : "Conference Champion"
        : conference
          ? `${conference} Conference Champion`
          : "Conference Champion",
    );
  } else if (conferenceLower.includes("conference runner-up")) {
    items.push(
      tier === "NFL"
        ? conference
          ? `${conference} Runner-Up`
          : "Conference Runner-Up"
        : conference
          ? `${conference} Conference Runner-Up`
          : "Conference Runner-Up",
    );
  }

  if (tier === "NFL" && Number(seasonRow.divisionRank) === 1) {
    items.push(
      [conference, division, "Division Champion"]
        .filter(Boolean)
        .join(" "),
    );
  }

  const postseasonGames = (seasonGames || [])
    .filter(isPostseasonGame)
    .sort((a, b) => Number(a.week) - Number(b.week));

  if (tier === "FBS") {
    const cfpGames = postseasonGames.filter((game) => {
      const text = getGameDescriptor(game);

      return (
        text.includes("cfp") ||
        text.includes("college football playoff") ||
        text.includes("quarterfinal") ||
        text.includes("quarter final") ||
        text.includes("semifinal") ||
        text.includes("semi final") ||
        text.includes("national championship")
      );
    });

    if (cfpGames.length > 0) {
      items.push("CFP Qualifier");
    }

    postseasonGames.forEach((game) => {
      const result = getGameResult(game, franchiseId);
      if (!result) return;

      const text = getGameDescriptor(game);
      const bowlName = String(game.bowlName || "").trim();
      const cfpStage = getCfpStage(game);
      const isFirstRound =
        text.includes("first round") || text.includes("1st round");

      const isCfpGame =
        cfpStage ||
        text.includes("cfp") ||
        text.includes("college football playoff");

      if (isCfpGame && isFirstRound && result === "W") {
        return;
      }

      if (isCfpGame) {
        if (
          cfpStage === "CFP National Championship" &&
          result === "W"
        ) {
          items.push("CFP National Champion");
          return;
        }

        if (
          cfpStage === "CFP National Championship" &&
          result === "L"
        ) {
          items.push("CFP National Runner-Up");
          return;
        }

        if (result === "W") {
          if (bowlName) {
            items.push(`${bowlName} Winner`);
          } else if (!isFirstRound) {
            items.push(`${cfpStage || "CFP Game"} Winner`);
          }
          return;
        }

        items.push(
          [
            cfpStage || "CFP Qualifier",
            bowlName ? `${bowlName} Loser` : "Loss",
          ]
            .filter(Boolean)
            .join(" - "),
        );
        return;
      }

      if (bowlName || text.includes("bowl")) {
        items.push(
          [
            `Week ${game.week} Bowl Game ${
              result === "W" ? "Winner" : result === "L" ? "Loser" : "Tie"
            }`,
            bowlName,
          ]
            .filter(Boolean)
            .join(" - "),
        );
      }
    });

    if (postseasonGames.length === 0) {
      (seasonRow.bowlGames || []).forEach((bowl) => {
        if (bowl) items.push(bowl);
      });

      const playoffResult = String(seasonRow.playoffResult || "").trim();
      const lower = playoffResult.toLowerCase();

      if (playoffResult && !lower.includes("no postseason")) {
        if (
          lower === "champion" ||
          lower.includes("national champion")
        ) {
          items.push("CFP National Champion");
        } else if (
          lower.includes("runner-up") ||
          lower.includes("runner up")
        ) {
          items.push("CFP National Runner-Up");
        } else if (
          !lower.includes("first round") &&
          !lower.includes("1st round")
        ) {
          items.push(playoffResult);
        }
      }
    }
  }

  if (tier === "FCS") {
    const played = postseasonGames
      .map((game) => ({
        game,
        result: getGameResult(game, franchiseId),
        stage: getFcsStage(game),
      }))
      .filter((entry) => entry.result);

    if (played.length > 0) {
      const finalGame = played[played.length - 1];

      if (
        finalGame.stage === "FCS National Championship" &&
        finalGame.result === "W"
      ) {
        items.push("FCS National Champion");
      } else if (
        finalGame.stage === "FCS National Championship" &&
        finalGame.result === "L"
      ) {
        items.push("FCS National Runner-Up");
      } else {
        const stage = finalGame.stage;

        if (stage === "FCS Semifinal") {
          items.push("FCS Playoff Semifinalist");
        } else if (stage === "FCS Quarterfinal") {
          items.push("FCS Playoff Quarterfinalist");
        } else if (stage === "FCS Second Round") {
          items.push("FCS Playoffs - Second Round");
        } else if (stage === "FCS First Round") {
          items.push("FCS Playoffs - First Round");
        } else {
          items.push(stage);
        }
      }
    } else {
      const playoffResult = String(seasonRow.playoffResult || "").trim();
      const lower = playoffResult.toLowerCase();

      if (
        lower === "champion" ||
        lower.includes("fcs champion") ||
        lower.includes("national champion")
      ) {
        items.push("FCS National Champion");
      } else if (
        lower.includes("runner-up") ||
        lower.includes("runner up")
      ) {
        items.push("FCS National Runner-Up");
      } else if (lower.includes("semi")) {
        items.push("FCS Playoff Semifinalist");
      } else if (lower.includes("quarter")) {
        items.push("FCS Playoff Quarterfinalist");
      } else if (lower.includes("second") || lower.includes("2nd")) {
        items.push("FCS Playoffs - Second Round");
      } else if (lower.includes("first") || lower.includes("1st")) {
        items.push("FCS Playoffs - First Round");
      }
    }
  }

  if (tier === "NFL") {
    const played = postseasonGames
      .map((game) => ({
        game,
        result: getGameResult(game, franchiseId),
        stage: getNflStage(game),
      }))
      .filter((entry) => entry.result);

    if (played.length > 0) {
      const finalGame = played[played.length - 1];

      if (finalGame.stage === "Super Bowl" && finalGame.result === "W") {
        items.push("Super Bowl Champion");
      } else if (
        finalGame.stage === "Super Bowl" &&
        finalGame.result === "L"
      ) {
        items.push("Super Bowl Runner-Up");
      } else if (finalGame.stage === "Conference Championship") {
        items.push(
          conference
            ? `Playoffs - ${conference} Championship`
            : "Playoffs - Conference Championship",
        );
      } else {
        items.push(finalGame.stage);
      }
    } else {
      const playoffResult = String(seasonRow.playoffResult || "").trim();
      const lower = playoffResult.toLowerCase();

      if (lower === "champion") {
        items.push("Super Bowl Champion");
      } else if (
        lower.includes("runner-up") ||
        lower.includes("runner up")
      ) {
        items.push("Super Bowl Runner-Up");
      } else if (
        playoffResult &&
        !lower.includes("no postseason")
      ) {
        if (lower.includes("wild card")) {
          items.push("Playoffs - Wild Card");
        } else if (lower.includes("divisional")) {
          items.push("Playoffs - Divisional Round");
        } else if (lower.includes("conference championship")) {
          items.push(
            conference
              ? `Playoffs - ${conference} Championship`
              : "Playoffs - Conference Championship",
          );
        } else {
          items.push(playoffResult);
        }
      }
    }
  }

  const notes = String(seasonRow.notes || "").trim();

  if (
    notes &&
    !items.some(
      (item) => item.toLowerCase() === notes.toLowerCase(),
    )
  ) {
    items.push(notes);
  }

  return Array.from(new Set(items.filter(Boolean)));
}

function buildFranchiseStops(tenures) {
  const chronological = [...tenures].sort((a, b) => {
    if (Number(a.season) !== Number(b.season)) {
      return Number(a.season) - Number(b.season);
    }

    return number(a.startWeek, 1) - number(b.startWeek, 1);
  });

  const stops = [];

  chronological.forEach((tenure) => {
    const previous = stops[stops.length - 1];
    const consecutiveSeason =
      previous &&
      Number(tenure.season) <= Number(previous.endSeason) + 1;

    if (
      previous &&
      previous.franchiseId === tenure.franchiseId &&
      consecutiveSeason
    ) {
      previous.endSeason = Math.max(previous.endSeason, Number(tenure.season));
      previous.tenures.push(tenure);

      if (
        tenure.franchiseName &&
        !previous.teamNames.includes(tenure.franchiseName)
      ) {
        previous.teamNames.push(tenure.franchiseName);
      }

      return;
    }

    stops.push({
      franchiseId: tenure.franchiseId,
      startSeason: Number(tenure.season),
      endSeason: Number(tenure.season),
      teamNames: tenure.franchiseName ? [tenure.franchiseName] : [],
      tenures: [tenure],
    });
  });

  return stops.reverse();
}

function CoachProfile() {
  const { coachId } = useParams();
  const location = useLocation();

  const [teams, setTeams] = useState([]);
  const [coachRows, setCoachRows] = useState([]);
  const [tenureRows, setTenureRows] = useState([]);
  const [games, setGames] = useState([]);
  const [standingsArchive, setStandingsArchive] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setStatus("loading");

        const [
          standingRows,
          coachData,
          tenureData,
          gameRows,
          archiveRows,
        ] = await Promise.all([
          getStandingsData(),
          getCoachDataRows(),
          getCoachSeasonTenureRows(),
          getGameResults({ allSeasons: true }),
          getStandingsArchive(),
        ]);

        if (!cancelled) {
          setTeams(standingRows);
          setCoachRows(coachData);
          setTenureRows(tenureData);
          setGames(gameRows);
          setStandingsArchive(archiveRows);
          setStatus("ready");
        }
      } catch (error) {
        console.error("Unable to load coach profile:", error);

        if (!cancelled) setStatus("error");
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentTeam = useMemo(() => {
    const decodedCoachId = decodeURIComponent(coachId || "");

    return teams.find(
      (team) => normalizeCoachId(team) === decodedCoachId,
    );
  }, [teams, coachId]);

  const backPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const from = params.get("from");

    return from && from.startsWith("/league/coaches")
      ? from
      : "/league/coaches";
  }, [location.search]);

  const coachData = useMemo(() => {
    if (!currentTeam) return null;

    return findCoachDataRow(
      coachRows,
      normalizeCoachId(currentTeam),
      currentTeam.franchiseId,
    );
  }, [coachRows, currentTeam]);

  const coachTenures = useMemo(() => {
    if (!currentTeam) return [];

    const activeCoachId = normalizeCoachId(currentTeam);

    return tenureRows
      .filter((row) => row.coachId === activeCoachId)
      .sort((a, b) => {
        if (Number(a.season) !== Number(b.season)) {
          return Number(b.season) - Number(a.season);
        }

        return number(a.startWeek, 1) - number(b.startWeek, 1);
      });
  }, [tenureRows, currentTeam]);

  const metrics = useMemo(() => {
    if (!currentTeam) return null;

    const distinctSeasons = new Set(
      coachTenures.map((row) => Number(row.season)).filter(Number.isFinite),
    );

    const promotions = coachTenures.filter(
      (row) => row.movement.toLowerCase() === "promoted",
    ).length;

    const relegations = coachTenures.filter(
      (row) => row.movement.toLowerCase() === "relegated",
    ).length;

    const coachGames = games.filter((game) =>
      coachTenures.some((tenure) => gameBelongsToTenure(game, tenure)),
    );

    const weeklyScores = [];
    const rankedWeeks25 = new Set();
    const rankedWeeks10 = new Set();

    coachGames.forEach((game) => {
      const tenure = coachTenures.find((item) =>
        gameBelongsToTenure(game, item),
      );

      if (!tenure) return;

      const side = getGameSide(game, tenure.franchiseId);
      const score = side === 1 ? game.team1Score : game.team2Score;
      const rank = side === 1 ? game.team1GameRank : game.team2GameRank;

      if (score !== null && score !== undefined && Number.isFinite(Number(score))) {
        weeklyScores.push(Number(score));
      }

      if (Number(rank) >= 1 && Number(rank) <= 25) {
        rankedWeeks25.add(`${game.season}-${game.week}`);
      }

      if (Number(rank) >= 1 && Number(rank) <= 10) {
        rankedWeeks10.add(`${game.season}-${game.week}`);
      }
    });

    const tierTotals = {};

    ["NFL", "FBS", "FCS"].forEach((tier) => {
      const rows = coachTenures.filter((row) => row.tier === tier);

      tierTotals[tier] = {
        seasons: new Set(rows.map((row) => row.season)).size,
        wins: rows.reduce((sum, row) => sum + number(row.overallWins), 0),
        losses: rows.reduce((sum, row) => sum + number(row.overallLosses), 0),
        ties: rows.reduce((sum, row) => sum + number(row.overallTies), 0),
        pf: rows.reduce((sum, row) => sum + number(row.overallPF), 0),
        confWins: rows.reduce((sum, row) => sum + number(row.conferenceWins), 0),
        confLosses: rows.reduce((sum, row) => sum + number(row.conferenceLosses), 0),
        confTies: rows.reduce((sum, row) => sum + number(row.conferenceTies), 0),
      };
    });

    /*
     * The active 2026 tenure rows intentionally may not have final totals yet.
     * Add current live totals only when the tenure row is still blank.
     */
    const currentTenure = coachTenures.find(
      (row) =>
        Number(row.season) === 2026 &&
        row.franchiseId === currentTeam.franchiseId,
    );

    if (currentTenure && currentTenure.overallWins === null) {
      const tier = String(currentTeam.tier || "").toUpperCase();
      const target = tierTotals[tier];

      if (target) {
        target.wins += number(currentTeam.overallSeasonWins);
        target.losses += number(currentTeam.overallSeasonLosses);
        target.ties += number(currentTeam.overallSeasonTies);
        target.pf += number(currentTeam.overallSeasonPF);

        if (tier !== "NFL") {
          target.confWins += number(currentTeam.tierStandingsWins);
          target.confLosses += number(currentTeam.tierStandingsLosses);
          target.confTies += number(currentTeam.tierStandingsTies);
        }
      }
    }

    const totalChampionships =
      number(coachData?.nflChampionships) +
      number(coachData?.fbsChampionships) +
      number(coachData?.fcsChampionships);

    const totalConferenceTitles =
      number(coachData?.nflConferenceTitles) +
      number(coachData?.fbsConferenceTitles) +
      number(coachData?.fcsConferenceTitles);

    const playoffAppearances =
      number(coachData?.nflPlayoffAppearances) +
      number(coachData?.fbsCfpAppearances) +
      number(coachData?.fcsPlayoffAppearances);

    const playoffWins =
      number(coachData?.nflPostseasonWins) +
      number(coachData?.fbsCfpWins) +
      number(coachData?.fcsPlayoffWins);

    const playoffLosses =
      number(coachData?.nflPostseasonLosses) +
      number(coachData?.fbsCfpLosses) +
      number(coachData?.fcsPlayoffLosses);

    return {
      meshSeasons: distinctSeasons.size,
      promotions,
      relegations,
      highScore: weeklyScores.length ? Math.max(...weeklyScores) : null,
      lowScore: weeklyScores.length ? Math.min(...weeklyScores) : null,
      top25Weeks: rankedWeeks25.size,
      top10Weeks: rankedWeeks10.size,
      tierTotals,
      totalChampionships,
      totalConferenceTitles,
      playoffAppearances,
      playoffWins,
      playoffLosses,
    };
  }, [coachTenures, games, currentTeam, coachData]);

  if (status === "loading") {
    return (
      <main className="coach-profile-page">
        <div className="coach-profile-state">Loading coach career…</div>
      </main>
    );
  }

  if (status === "error" || !currentTeam) {
    return (
      <main className="coach-profile-page">
        <Link className="coach-back-link" to={backPath}>
          <ArrowLeft size={15} />
          Back to Coach Directory
        </Link>

        <div className="coach-profile-state coach-directory-error">
          This coach is not currently active in MESH.
        </div>
      </main>
    );
  }

  const coachName = String(currentTeam.coach || "").trim();
  const tier = String(currentTeam.tier || "").toUpperCase();
  const rawCoachPrestige = Number(
    coachData?.raw?.OVR_Prestige_Totals_COACH ??
      coachData?.raw?.OVR_Prestige_Total_COACH ??
      coachData?.raw?.Coach_Prestige_Total,
  );

  const normalizedCoachPrestige = Number(coachData?.prestige);

  const tenureCoachPrestige = coachTenures.reduce(
    (sum, row) => sum + number(row.prestigePoints),
    0,
  );

  const coachPrestigeValue =
    Number.isFinite(rawCoachPrestige) && rawCoachPrestige > 0
      ? rawCoachPrestige
      : Number.isFinite(normalizedCoachPrestige) &&
          normalizedCoachPrestige > 0
        ? normalizedCoachPrestige
        : tenureCoachPrestige;

  const prestige =
    Number.isFinite(coachPrestigeValue)
      ? coachPrestigeValue.toFixed(1)
      : "—";

  const meshWins =
    coachData?.meshWins ??
    Object.values(metrics.tierTotals).reduce((sum, row) => sum + row.wins, 0);

  const meshLosses =
    coachData?.meshLosses ??
    Object.values(metrics.tierTotals).reduce((sum, row) => sum + row.losses, 0);

  const meshTies =
    coachData?.meshTies ??
    Object.values(metrics.tierTotals).reduce((sum, row) => sum + row.ties, 0);

  const meshPF =
    coachData?.meshPF ??
    Object.values(metrics.tierTotals).reduce((sum, row) => sum + row.pf, 0);

  const overallCareerStats = [
    {
      label: "Overall MESH Record",
      value: formatRecord(meshWins, meshLosses, meshTies),
      detail: `${formatPct(meshWins, meshLosses, meshTies)} Win % • ${formatPF(meshPF)} PF`,
    },
    {
      label: "Championships",
      value: String(metrics.totalChampionships),
      detail: "NFL • FBS • FCS combined",
    },
    {
      label: "Conference Titles",
      value: String(metrics.totalConferenceTitles),
    },
    {
      label: "Playoff Appearances",
      value: String(metrics.playoffAppearances),
      detail: `Playoff Record: ${formatRecord(
        metrics.playoffWins,
        metrics.playoffLosses,
      )}`,
    },
    {
      label: "Promotions",
      value: String(metrics.promotions),
    },
    {
      label: "Relegations",
      value: String(metrics.relegations),
    },
    {
      label: "Highest Career Weekly Score",
      value:
        metrics.highScore === null ? "—" : metrics.highScore.toFixed(2),
    },
    {
      label: "Lowest Career Weekly Score",
      value:
        metrics.lowScore === null ? "—" : metrics.lowScore.toFixed(2),
    },
  ];

  const nfl = metrics.tierTotals.NFL;
  const fbs = metrics.tierTotals.FBS;
  const fcs = metrics.tierTotals.FCS;

  const tierCareerData = [
    {
      tier: "NFL",
      title: "Professional Tier",
      rows: [
        { label: "Seasons", value: String(nfl.seasons) },
        {
          label: "Career Record",
          value: formatRecord(nfl.wins, nfl.losses, nfl.ties),
          detail: `${formatPct(nfl.wins, nfl.losses, nfl.ties)} Win % • ${formatPF(nfl.pf)} PF`,
        },
        {
          label: "Super Bowl Championships",
          value: String(coachData?.nflChampionships || 0),
        },
        {
          label: "Conference Titles",
          value: String(coachData?.nflConferenceTitles || 0),
        },
        {
          label: "Division Titles",
          value: String(coachData?.nflDivisionTitles || 0),
        },
        {
          label: "Playoff Appearances",
          value: String(coachData?.nflPlayoffAppearances || 0),
        },
        {
          label: "Playoff Record",
          value: formatRecord(
            coachData?.nflPostseasonWins,
            coachData?.nflPostseasonLosses,
          ),
        },
      ],
    },
    {
      tier: "FBS",
      title: "Football Bowl Subdivision",
      rows: [
        { label: "Seasons", value: String(fbs.seasons) },
        {
          label: "Career Record",
          value: formatRecord(fbs.wins, fbs.losses, fbs.ties),
          detail: `${formatPct(fbs.wins, fbs.losses, fbs.ties)} Win % • ${formatPF(fbs.pf)} PF`,
        },
        {
          label: "Career Conf Record",
          value: formatRecord(fbs.confWins, fbs.confLosses, fbs.confTies),
        },
        {
          label: "FBS Championships",
          value: String(coachData?.fbsChampionships || 0),
        },
        {
          label: "Conference Titles",
          value: String(coachData?.fbsConferenceTitles || 0),
        },
        {
          label: "CFP Appearances",
          value: String(coachData?.fbsCfpAppearances || 0),
        },
        {
          label: "CFP Record",
          value: formatRecord(coachData?.fbsCfpWins, coachData?.fbsCfpLosses),
        },
        {
          label: "Bowl Appearances",
          value: String(coachData?.fbsBowlAppearances || 0),
        },
        {
          label: "Bowl Record",
          value: formatRecord(coachData?.fbsBowlWins, coachData?.fbsBowlLosses),
        },
        { label: "Weeks in Top 25", value: String(metrics.top25Weeks) },
        { label: "Weeks in Top 10", value: String(metrics.top10Weeks) },
      ],
    },
    {
      tier: "FCS",
      title: "Football Championship Subdivision",
      rows: [
        { label: "Seasons", value: String(fcs.seasons) },
        {
          label: "Career Record",
          value: formatRecord(fcs.wins, fcs.losses, fcs.ties),
          detail: `${formatPct(fcs.wins, fcs.losses, fcs.ties)} Win % • ${formatPF(fcs.pf)} PF`,
        },
        {
          label: "Career Conf Record",
          value: formatRecord(fcs.confWins, fcs.confLosses, fcs.confTies),
        },
        {
          label: "FCS Championships",
          value: String(coachData?.fcsChampionships || 0),
        },
        {
          label: "Conference Titles",
          value: String(coachData?.fcsConferenceTitles || 0),
        },
        {
          label: "Playoff Appearances",
          value: String(coachData?.fcsPlayoffAppearances || 0),
        },
        {
          label: "Playoff Record",
          value: formatRecord(
            coachData?.fcsPlayoffWins,
            coachData?.fcsPlayoffLosses,
          ),
        },
        { label: "Weeks in Top 25", value: String(metrics.top25Weeks) },
        { label: "Weeks in Top 10", value: String(metrics.top10Weeks) },
      ],
    },
  ];

  const franchiseStops = buildFranchiseStops(coachTenures);

  return (
    <main className="coach-profile-page">
      <Link className="coach-back-link" to={backPath}>
        <ArrowLeft size={15} />
        Back to Coach Directory
      </Link>

      <section
        className={`coach-profile-hero coach-profile-hero-${tier.toLowerCase()}`}
        style={{
          "--coach-primary": currentTeam.primaryColor || "#24435f",
          "--coach-secondary": currentTeam.secondaryColor || "#152b3f",
        }}
      >
        <div className="coach-profile-hero-glow" />

        <div className="coach-profile-identity coach-profile-identity-full">
          <div className="coach-profile-kicker">
            <span>ACTIVE COACH</span>
            <span>{tier}</span>
            {currentTeam.conference ? <span>{currentTeam.conference}</span> : null}
          </div>

          <div className="coach-profile-title-row">
            <h1>{coachName}</h1>
            <div className="coach-profile-title-prestige">
              <span>Coach Prestige</span>
              <strong>{prestige}</strong>
            </div>
          </div>

          <div className="coach-profile-hero-data">
            <article className="coach-hero-info coach-hero-current-franchise coach-hero-current-franchise-wide">
              <span>Current Franchise</span>
              <Link
                className="coach-hero-franchise-link"
                to={`/league/franchises/${encodeURIComponent(
                  currentTeam.franchiseId,
                )}`}
              >
                {currentTeam.logo ? <img src={currentTeam.logo} alt="" /> : null}
                <strong>{currentTeam.team}</strong>
              </Link>
            </article>

            <article className="coach-hero-info">
              <span>MESH Seasons</span>
              <strong>{metrics.meshSeasons}</strong>
            </article>

            <article className="coach-hero-info">
              <span>2026 OVR Rec</span>
              <strong>{currentTeam.overallSeasonRecord || "0-0"}</strong>
            </article>

            <article className="coach-hero-info">
              <span>2026 Conf Rec</span>
              <strong>
                {tier === "NFL"
                  ? "—"
                  : currentTeam.tierStandingsRecord || "0-0"}
              </strong>
            </article>

            <article className="coach-hero-info">
              <span>2026 PF</span>
              <strong>{formatPF(currentTeam.overallSeasonPF)}</strong>
            </article>
          </div>
        </div>
      </section>

      <section className="coach-profile-section coach-trophy-section">
        <div className="coach-section-heading">
          <div>
            <span>Achievements</span>
            <h2>Trophy Vault</h2>
          </div>
          <small>Career honors across every tier</small>
        </div>

        <div className="coach-trophy-entry">
          <div className="coach-trophy-icon">
            <Trophy size={27} />
          </div>

          <div>
            <span>Coach Trophy Room</span>
            <strong>{coachName}'s Career Vault</strong>
            <p>
              The Trophy Vault foundation is ready. Individual trophies and
              banners will be connected in the dedicated Trophy Vault phase.
            </p>
          </div>

          <ChevronRight size={19} />
        </div>
      </section>

      <section className="coach-profile-section">
        <div className="coach-section-heading">
          <div>
            <span>All Tiers Combined</span>
            <h2>Overall Career Résumé</h2>
          </div>
          <small>Permanent MESH coaching totals</small>
        </div>

        <div className="coach-overall-career-grid">
          {overallCareerStats.map((stat) => (
            <CareerStat
              key={stat.label}
              label={stat.label}
              value={stat.value}
              detail={stat.detail}
            />
          ))}
        </div>
      </section>

      <section className="coach-profile-section">
        <div className="coach-section-heading">
          <div>
            <span>Career by Level</span>
            <h2>Tier Career Breakdown</h2>
          </div>
          <small>NFL • FBS • FCS</small>
        </div>

        <div className="coach-tier-career-grid">
          {tierCareerData.map((career) => (
            <TierCareerCard
              key={career.tier}
              tier={career.tier}
              title={career.title}
              rows={career.rows}
            />
          ))}
        </div>
      </section>

      <section className="coach-profile-section">
        <div className="coach-section-heading">
          <div>
            <span>Timeline</span>
            <h2>Career History</h2>
          </div>
          <small>{metrics.meshSeasons} MESH seasons</small>
        </div>

        <div className="coach-career-history-list">
          {coachTenures.map((tenure, index) => {
            const logo = getTenureLogo(tenure, games, currentTeam);
            const isCurrent =
              Number(tenure.season) === 2026 &&
              tenure.franchiseId === currentTeam.franchiseId;

            const archivedSeason =
              standingsArchive.find(
                (row) =>
                  Number(row.season) === Number(tenure.season) &&
                  row.franchiseId === tenure.franchiseId,
              ) || {
                ...tenure,
                isCurrent,
                bowlGames: [],
                playoffResult: "",
                conferenceResult: "",
                divisionRank: 0,
              };

            const seasonGames = games.filter(
              (game) =>
                Number(game.season) === Number(tenure.season) &&
                (game.team1Id === tenure.franchiseId ||
                  game.team2Id === tenure.franchiseId),
            );

            const achievements = formatCoachSeasonAchievements(
              {
                ...archivedSeason,
                isCurrent,
              },
              seasonGames,
              tenure.franchiseId,
            );

            return (
              <article
                className="coach-career-history-row"
                key={`${tenure.season}-${tenure.franchiseId}-${tenure.startWeek || index}`}
              >
                <div className="coach-career-history-season">
                  <strong>{tenure.season}</strong>
                  <span>{isCurrent ? "Current" : tenure.movement || "Season"}</span>
                </div>

                <div className="coach-career-history-logo">
                  {logo ? <img src={logo} alt="" /> : <Shield size={22} />}
                </div>

                <div className="coach-career-history-copy">
                  <strong>{tenure.franchiseName || "Franchise"}</strong>
                  <span>
                    {tenure.tier}
                    {tenure.conference ? ` • ${tenure.conference}` : ""}
                    {tenure.division ? ` • ${tenure.division}` : ""}
                  </span>
                </div>

                <div className="coach-career-history-record">
                  <span>OVR</span>
                  <strong>{getSeasonRecord(tenure, currentTeam)}</strong>
                </div>

                {achievements.length > 0 ? (
                  <div className="coach-career-history-achievements">
                    <Trophy size={13} />
                    <div>
                      {achievements.map((achievement) => (
                        <span key={achievement}>{achievement}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="coach-profile-section">
        <div className="coach-section-heading">
          <div>
            <span>Teams Coached</span>
            <h2>Franchise Stops</h2>
          </div>
          <small>{franchiseStops.length} coaching stop{franchiseStops.length === 1 ? "" : "s"}</small>
        </div>

        <div className="coach-franchise-stops-list">
          {franchiseStops.map((stop) => {
            const latestTenure = stop.tenures[stop.tenures.length - 1];
            const logo = getTenureLogo(latestTenure, games, currentTeam);

            const wins = stop.tenures.reduce(
              (sum, row) => sum + number(row.overallWins),
              0,
            );
            const losses = stop.tenures.reduce(
              (sum, row) => sum + number(row.overallLosses),
              0,
            );
            const ties = stop.tenures.reduce(
              (sum, row) => sum + number(row.overallTies),
              0,
            );

            return (
              <Link
                key={`${stop.franchiseId}-${stop.startSeason}`}
                className="coach-franchise-stop"
                to={`/league/franchises/${encodeURIComponent(stop.franchiseId)}`}
              >
                <div className="coach-franchise-stop-logo">
                  {logo ? <img src={logo} alt="" /> : <Shield size={20} />}
                </div>

                <div>
                  <span>
                    {stop.startSeason === stop.endSeason
                      ? stop.startSeason
                      : `${stop.startSeason} – ${stop.endSeason}`}
                  </span>
                  <strong>
                    {stop.teamNames.length > 1
                      ? stop.teamNames.join(" → ")
                      : stop.teamNames[0] || "Franchise"}
                  </strong>
                  <small>
                    {latestTenure.tier}
                    {latestTenure.conference
                      ? ` • ${latestTenure.conference}`
                      : ""}
                    {" • "}
                    {formatRecord(wins, losses, ties)}
                  </small>
                </div>

                <ChevronRight size={18} />
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default CoachProfile;
