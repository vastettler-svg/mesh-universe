import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Crown,
  History,
  Medal,
  Trophy,
  UserRound,
} from "lucide-react";

import {
  getGameResults,
  getStandingsArchive,
  getStandingsData,
} from "../services/googleSheets";

import "../styles/franchises.css";

function formatPoints(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : "—";
}

function SectionHeading({ eyebrow, title, action }) {
  return (
    <div className="franchise-profile-section-heading">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {action ? <small>{action}</small> : null}
    </div>
  );
}

function CareerStat({ label, value = "—", detail }) {
  return (
    <article className="franchise-career-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

function RankStat({ label, value }) {
  return (
    <article className="franchise-rank-stat">
      <span>{label}</span>
      <strong>{Number(value) > 0 ? `#${value}` : "—"}</strong>
    </article>
  );
}

function CurrentStat({ label, value, detail }) {
  return (
    <article className="franchise-current-stat">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

function getFranchiseSide(game, franchiseId) {
  if (game.team1Id === franchiseId) return 1;
  if (game.team2Id === franchiseId) return 2;
  return null;
}

function getGameOpponent(game, franchiseId, teamLookup) {
  const side = getFranchiseSide(game, franchiseId);

  if (side === 1) {
    return {
      id: game.team2Id,
      name: game.team2Team,
      score: game.team2Score,
      ownScore: game.team1Score,
      logo: game.team2Logo || teamLookup.get(game.team2Id)?.logo || "",
      gameRank: Number(game.team2GameRank) || 0,
    };
  }

  if (side === 2) {
    return {
      id: game.team1Id,
      name: game.team1Team,
      score: game.team1Score,
      ownScore: game.team2Score,
      logo: game.team1Logo || teamLookup.get(game.team1Id)?.logo || "",
      gameRank: Number(game.team1GameRank) || 0,
    };
  }

  return null;
}

function getGameResult(game, franchiseId) {
  if (game.status !== "final") return "";
  if (!game.winnerId) return "T";
  return game.winnerId === franchiseId ? "W" : "L";
}

function FranchiseGameRow({ game, franchiseId, teamLookup }) {
  const opponent = getGameOpponent(game, franchiseId, teamLookup);
  if (!opponent) return null;

  const result = getGameResult(game, franchiseId);
  const hasScores =
    game.team1Score !== null &&
    game.team1Score !== undefined &&
    game.team2Score !== null &&
    game.team2Score !== undefined;

  const rowContent = (
    <>
      <div className="franchise-game-week">
        <span>WK</span>
        <strong>{game.week}</strong>
      </div>

      <div className="franchise-game-opponent-logo">
        {opponent.logo ? (
          <img src={opponent.logo} alt="" />
        ) : (
          <span>{opponent.name?.charAt(0) || "M"}</span>
        )}
      </div>

      <div className="franchise-game-copy">
        <span>{game.label || "Regular Season"}</span>
        <strong>
          {opponent.gameRank >= 1 && opponent.gameRank <= 25
            ? `#${opponent.gameRank} `
            : ""}
          {opponent.name || "Opponent TBD"}
        </strong>
      </div>

      <div className="franchise-game-result">
        {result ? (
          <span
            className={`franchise-result-badge franchise-result-${result.toLowerCase()}`}
          >
            {result}
          </span>
        ) : (
          <span className="franchise-result-badge franchise-result-upcoming">
            {game.status === "live" ? "LIVE" : "—"}
          </span>
        )}

        <strong>
          {hasScores
            ? `${formatPoints(opponent.ownScore)}–${formatPoints(opponent.score)}`
            : game.statusLabel || "Scheduled"}
        </strong>
      </div>

      <ChevronRight
        className={
          Number(game.season) >= 2026
            ? ""
            : "franchise-game-history-arrow"
        }
        size={16}
      />
    </>
  );

  /*
   * Game Center did not exist for the 2024 and 2025 seasons.
   * Preserve those games as readable schedule history, but do
   * not send users to an unavailable Game Center route.
   *
   * 2026+ remains clickable so 2026 Game Centers can remain
   * part of MESH history after future season rollovers.
   */
  if (Number(game.season) < 2026) {
    return (
      <div
        className="franchise-game-row franchise-game-row-history"
        aria-label={`Week ${game.week}: ${opponent.name || "Opponent"}`}
      >
        {rowContent}
      </div>
    );
  }

  return (
    <Link
      className="franchise-game-row"
      to={`/scores/${encodeURIComponent(game.gameId)}`}
    >
      {rowContent}
    </Link>
  );
}

function getCareerStats(tier) {
  if (tier === "NFL") {
    return [
      { label: "Super Bowl Championships" },
      { label: "Conference Titles" },
      { label: "Division Titles" },
      {
        label: "Playoff Appearances",
        detail: "Appearances: — • Playoff Record: —",
      },
      {
        label: "Overall Franchise Record",
        detail: "Record • Win % • Points For",
      },
      { label: "Franchise Prestige Points" },
      { label: "Highest Career Weekly Score" },
      { label: "Lowest Career Weekly Score" },
    ];
  }

  if (tier === "FBS") {
    return [
      { label: "FBS Championships" },
      {
        label: "Conference Championships",
        detail: "Titles: — • Title Game Record: —",
      },
      {
        label: "CFP Appearances",
        detail: "Appearances: — • CFP Record: —",
      },
      {
        label: "Bowl Game Appearances",
        detail: "Appearances: — • Bowl Record: —",
      },
      {
        label: "Overall Franchise Record",
        detail: "Record • Win % • Points For",
      },
      {
        label: "Overall Conference Record",
        detail: "Conference games only",
      },
      { label: "Weeks in the Top 25" },
      { label: "Franchise Prestige Points" },
      { label: "Highest Career Weekly Score" },
      { label: "Lowest Career Weekly Score" },
    ];
  }

  return [
    { label: "FCS Championships" },
    { label: "Conference Championships" },
    { label: "Playoff Appearances" },
    { label: "Playoff Record" },
    {
      label: "Overall Franchise Record",
      detail: "Record • Win % • Points For",
    },
    {
      label: "Overall Conference Record",
      detail: "Conference games only",
    },
    { label: "Weeks in the Top 25" },
    { label: "Franchise Prestige Points" },
    { label: "Highest Career Weekly Score" },
    { label: "Lowest Career Weekly Score" },
  ];
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
  if (text.includes("divisional")) return "Divisional Round";
  if (text.includes("wild card")) return "Wild Card";

  return "NFL Playoff";
}

function formatHistoricalPostseason(
  seasonRow,
  seasonGames,
  franchiseId,
) {
  if (seasonRow.isCurrent) return [];

  const tier = String(seasonRow.tier || "").toUpperCase();
  const conference = String(seasonRow.conference || "").trim();
  const division = String(seasonRow.division || "").trim();
  const conferenceResult =
    String(seasonRow.conferenceResult || "").trim();
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
        text.includes("first round") ||
        text.includes("1st round");

      const isCfpGame =
        cfpStage ||
        text.includes("cfp") ||
        text.includes("college football playoff");

      // Do not show standalone CFP first-round wins.
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

      const playoffResult =
        String(seasonRow.playoffResult || "").trim();
      const lower = playoffResult.toLowerCase();

      if (
        playoffResult &&
        !lower.includes("no postseason")
      ) {
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
          items.push("FCS Semifinalist");
        } else if (stage === "FCS Quarterfinal") {
          items.push("FCS Quarterfinalist");
        } else if (stage === "FCS Second Round") {
          items.push("FCS Second Round");
        } else if (stage === "FCS First Round") {
          items.push("FCS First Round");
        } else {
          items.push(stage);
        }
      }
    } else {
      const playoffResult =
        String(seasonRow.playoffResult || "").trim();
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
        items.push("FCS Semifinalist");
      } else if (lower.includes("quarter")) {
        items.push("FCS Quarterfinalist");
      } else if (lower.includes("second") || lower.includes("2nd")) {
        items.push("FCS Second Round");
      } else if (lower.includes("first") || lower.includes("1st")) {
        items.push("FCS First Round");
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
      } else {
        items.push(`${finalGame.stage}`);
      }
    } else {
      const playoffResult =
        String(seasonRow.playoffResult || "").trim();
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
        items.push(playoffResult);
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

function FranchiseProfile() {
  const { franchiseId } = useParams();
  const location = useLocation();

  const [teams, setTeams] = useState([]);
  const [games, setGames] = useState([]);
  const [archive, setArchive] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setStatus("loading");

        const [standingRows, gameRows, archiveRows] = await Promise.all([
          getStandingsData(),
          getGameResults({ allSeasons: true }),
          getStandingsArchive(),
        ]);

        if (!cancelled) {
          setTeams(standingRows);
          setGames(gameRows);
          setArchive(archiveRows);
          setStatus("ready");
        }
      } catch (error) {
        console.error("Unable to load franchise profile:", error);

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

  const franchise = useMemo(
    () =>
      teams.find(
        (team) =>
          String(team.franchiseId || "").toLowerCase() ===
          String(franchiseId || "").toLowerCase(),
      ),
    [teams, franchiseId],
  );

  const teamLookup = useMemo(
    () => new Map(teams.map((team) => [team.franchiseId, team])),
    [teams],
  );

  const franchiseGames = useMemo(() => {
    if (!franchise) return [];

    return games
      .filter(
        (game) =>
          game.team1Id === franchise.franchiseId ||
          game.team2Id === franchise.franchiseId,
      )
      .sort((a, b) => {
        if (Number(a.season) !== Number(b.season)) {
          return Number(b.season) - Number(a.season);
        }

        return Number(a.week) - Number(b.week);
      });
  }, [games, franchise]);

  const franchiseArchive = useMemo(() => {
    if (!franchise) return [];

    return archive
      .filter((row) => row.franchiseId === franchise.franchiseId)
      .sort((a, b) => b.season - a.season);
  }, [archive, franchise]);

  const availableSeasons = useMemo(() => {
    const seasons = new Set();

    franchiseGames.forEach((game) => {
      if (Number.isFinite(Number(game.season))) {
        seasons.add(Number(game.season));
      }
    });

    franchiseArchive.forEach((row) => {
      if (Number.isFinite(Number(row.season))) {
        seasons.add(Number(row.season));
      }
    });

    seasons.add(2026);

    return Array.from(seasons).sort((a, b) => b - a);
  }, [franchiseGames, franchiseArchive]);

  const currentSeason =
    availableSeasons.length > 0 ? availableSeasons[0] : 2026;

  useEffect(() => {
    if (selectedSeason === null && availableSeasons.length > 0) {
      setSelectedSeason(availableSeasons[0]);
    }
  }, [availableSeasons, selectedSeason]);

  const displayedSeason = selectedSeason ?? currentSeason;

  const currentSeasonGames = useMemo(
    () =>
      franchiseGames.filter(
        (game) => Number(game.season) === Number(displayedSeason),
      ),
    [franchiseGames, displayedSeason],
  );


  const currentSeasonArchiveRow = useMemo(() => {
    return franchiseArchive.find(
      (row) => Number(row.season) === Number(currentSeason),
    );
  }, [franchiseArchive, currentSeason]);

  const fullSeasonHistory = useMemo(() => {
    if (!franchise) return [];

    const currentRow = {
      season: currentSeason,
      franchiseId: franchise.franchiseId,
      franchiseName: franchise.team,
      team: franchise.team,
      logo: franchise.logo,
      coachId: franchise.coachId,
      coachName: franchise.coach,
      coach: franchise.coach,
      tier: franchise.tier,
      conference: franchise.conference,
      division: franchise.division,
      overallRank: franchise.overallRank,
      conferenceRank: franchise.conferenceRank,
      divisionRank: franchise.divisionRank,
      top25Rank: franchise.top25Rank,
      tierStandingsWins: franchise.tierStandingsWins || 0,
      tierStandingsLosses: franchise.tierStandingsLosses || 0,
      tierStandingsTies: franchise.tierStandingsTies || 0,
      tierStandingsRecord: franchise.tierStandingsRecord,
      overallSeasonWins: franchise.overallSeasonWins || 0,
      overallSeasonLosses: franchise.overallSeasonLosses || 0,
      overallSeasonTies: franchise.overallSeasonTies || 0,
      overallSeasonRecord: franchise.overallSeasonRecord,
      overallSeasonPF: franchise.overallSeasonPF || franchise.pointsFor || 0,
      postseasonWins: franchise.postseasonWins || 0,
      postseasonLosses: franchise.postseasonLosses || 0,
      playoffResult: franchise.seasonResult || franchise.playoffStatus || "",
      conferenceResult: "",
      bowlGames: [],
      notes: "",
      isCurrent: true,
    };

    const historical = franchiseArchive.filter(
      (row) => Number(row.season) !== Number(currentSeason),
    );

    return [currentRow, ...historical].sort(
      (a, b) => Number(b.season) - Number(a.season),
    );
  }, [franchise, franchiseArchive, currentSeason]);

  const careerSummary = useMemo(() => {
    if (!franchise) return null;

    const completedRows = franchiseArchive;

    const sum = (key) =>
      completedRows.reduce(
        (total, row) => total + (Number(row[key]) || 0),
        0,
      );

    const overallWins = sum("overallSeasonWins");
    const overallLosses = sum("overallSeasonLosses");
    const overallTies = sum("overallSeasonTies");
    const overallPF = sum("overallSeasonPF");

    const conferenceWins = sum("tierStandingsWins");
    const conferenceLosses = sum("tierStandingsLosses");
    const conferenceTies = sum("tierStandingsTies");

    const postseasonWins = sum("postseasonWins");
    const postseasonLosses = sum("postseasonLosses");

    const allGames = franchiseGames.filter((game) => {
      const side =
        game.team1Id === franchise.franchiseId
          ? 1
          : game.team2Id === franchise.franchiseId
            ? 2
            : null;

      if (!side) return false;

      const score = side === 1 ? game.team1Score : game.team2Score;
      return score !== null && score !== undefined && Number.isFinite(Number(score));
    });

    const scores = allGames.map((game) =>
      Number(
        game.team1Id === franchise.franchiseId
          ? game.team1Score
          : game.team2Score,
      ),
    );

    const highScore = scores.length ? Math.max(...scores) : null;
    const lowScore = scores.length ? Math.min(...scores) : null;

    const top25Weeks = new Set(
      allGames
        .filter((game) => {
          const rank =
            game.team1Id === franchise.franchiseId
              ? game.team1GameRank
              : game.team2GameRank;

          return Number(rank) >= 1 && Number(rank) <= 25;
        })
        .map((game) => `${game.season}-${game.week}`),
    ).size;

    const playoffAppearanceRows = completedRows.filter((row) => {
      const result = String(row.playoffResult || "").toLowerCase();
      return (
        Number(row.playoffSeed) > 0 ||
        Number(row.postseasonWins) > 0 ||
        Number(row.postseasonLosses) > 0 ||
        (result && !result.includes("no postseason"))
      );
    });

    const conferenceTitleRows = completedRows.filter((row) =>
      String(row.conferenceResult || "")
        .toLowerCase()
        .includes("conference champion"),
    );

    const championshipRows = completedRows.filter((row) => {
      const result = String(row.playoffResult || "").toLowerCase();
      return (
        result.includes("champion") &&
        !result.includes("conference championship")
      );
    });

    const divisionTitles =
      franchise.tier === "NFL"
        ? completedRows.filter((row) => Number(row.divisionRank) === 1).length
        : 0;

    const bowlGames = franchiseGames.filter((game) => {
      const text = [
        game.gameCategory,
        game.gameType,
        game.label,
        game.bowlName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes("bowl");
    });

    const cfpGames = franchiseGames.filter((game) => {
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
        text.includes("cfp") ||
        text.includes("college football playoff")
      );
    });

    const getRecordFromGames = (rows) => {
      let wins = 0;
      let losses = 0;

      rows.forEach((game) => {
        const result = getGameResult(game, franchise.franchiseId);

        if (result === "W") wins += 1;
        if (result === "L") losses += 1;
      });

      return `${wins}–${losses}`;
    };

    const overallGames = overallWins + overallLosses + overallTies;
    const winPct =
      overallGames > 0
        ? ((overallWins + overallTies * 0.5) / overallGames) * 100
        : null;

    return {
      overallRecord:
        overallTies > 0
          ? `${overallWins}–${overallLosses}–${overallTies}`
          : `${overallWins}–${overallLosses}`,
      overallWinPct: winPct,
      overallPF,
      conferenceRecord:
        conferenceTies > 0
          ? `${conferenceWins}–${conferenceLosses}–${conferenceTies}`
          : `${conferenceWins}–${conferenceLosses}`,
      playoffRecord: `${postseasonWins}–${postseasonLosses}`,
      playoffAppearances: playoffAppearanceRows.length,
      conferenceTitles: conferenceTitleRows.length,
      conferenceTitleGameRecord: `${conferenceTitleRows.length}–${Math.max(
        0,
        completedRows.filter((row) => {
          const value = String(row.conferenceResult || "").toLowerCase();
          return (
            value.includes("conference champion") ||
            value.includes("conference runner-up")
          );
        }).length - conferenceTitleRows.length,
      )}`,
      championships: championshipRows.length,
      divisionTitles,
      highScore,
      lowScore,
      top25Weeks,
      bowlAppearances: new Set(
        bowlGames.map((game) => `${game.season}-${game.bowlName || game.gameId}`),
      ).size,
      bowlRecord: getRecordFromGames(bowlGames),
      cfpAppearances: new Set(
        cfpGames.map((game) => game.season),
      ).size,
      cfpRecord: getRecordFromGames(cfpGames),
      prestigePoints: franchise.prestigePoints,
    };
  }, [franchise, franchiseArchive, franchiseGames]);

  const coachingTenures = useMemo(() => {
    if (!franchise) return [];

    const rows = [...fullSeasonHistory]
      .filter((row) => row.coach || row.coachName)
      .sort((a, b) => Number(a.season) - Number(b.season));

    const tenures = [];

    rows.forEach((row) => {
      const coachName = row.coach || row.coachName || "Coach TBD";
      const coachKey = row.coachId || coachName.toLowerCase();
      const last = tenures[tenures.length - 1];

      if (last && last.coachKey === coachKey) {
        last.endSeason = Number(row.season);
        last.wins += Number(row.overallSeasonWins) || 0;
        last.losses += Number(row.overallSeasonLosses) || 0;
        last.ties += Number(row.overallSeasonTies) || 0;
        last.isCurrent = last.isCurrent || Boolean(row.isCurrent);
      } else {
        tenures.push({
          coachKey,
          coachName,
          startSeason: Number(row.season),
          endSeason: Number(row.season),
          wins: Number(row.overallSeasonWins) || 0,
          losses: Number(row.overallSeasonLosses) || 0,
          ties: Number(row.overallSeasonTies) || 0,
          isCurrent: Boolean(row.isCurrent),
        });
      }
    });

    return tenures.sort((a, b) => b.endSeason - a.endSeason);
  }, [franchise, fullSeasonHistory]);

  const teamBackPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const from = params.get("from");

    if (
      from &&
      from.startsWith("/league/franchises")
    ) {
      return from;
    }

    return "/league/franchises";
  }, [location.search]);

  if (status === "loading") {
    return (
      <main className="franchise-profile-page">
        <div className="franchise-directory-state">
          Loading franchise profile…
        </div>
      </main>
    );
  }

  if (status === "error" || !franchise) {
    return (
      <main className="franchise-profile-page">
        <Link className="franchise-back-link" to={teamBackPath}>
          <ArrowLeft size={15} />
          Franchise Directory
        </Link>

        <div className="franchise-directory-state franchise-directory-error">
          This MESH franchise could not be found.
        </div>
      </main>
    );
  }

  const careerStats = getCareerStats(franchise.tier).map((stat) => {
    if (!careerSummary) return stat;

    const common = {
      "Overall Franchise Record": {
        value: careerSummary.overallRecord,
        detail: `${careerSummary.overallWinPct === null ? "—" : `${careerSummary.overallWinPct.toFixed(1)}%`} Win • ${careerSummary.overallPF.toFixed(2)} PF`,
      },
      "Overall Conference Record": {
        value: careerSummary.conferenceRecord,
        detail: "Conference games only",
      },
      "Franchise Prestige Points": {
        value:
          careerSummary.prestigePoints === null ||
          careerSummary.prestigePoints === undefined
            ? "—"
            : Number(careerSummary.prestigePoints).toFixed(1),
      },
      "Highest Career Weekly Score": {
        value:
          careerSummary.highScore === null
            ? "—"
            : careerSummary.highScore.toFixed(2),
      },
      "Lowest Career Weekly Score": {
        value:
          careerSummary.lowScore === null
            ? "—"
            : careerSummary.lowScore.toFixed(2),
      },
      "Weeks in the Top 25": {
        value: String(careerSummary.top25Weeks),
      },
      "Division Titles": {
        value: String(careerSummary.divisionTitles),
      },
      "Conference Titles": {
        value: String(careerSummary.conferenceTitles),
      },
      "Conference Championships": {
        value: String(careerSummary.conferenceTitles),
        detail:
          franchise.tier === "FCS"
            ? undefined
            : `Title Game Record: ${careerSummary.conferenceTitleGameRecord}`,
      },
      "Super Bowl Championships": {
        value: String(careerSummary.championships),
      },
      "FBS Championships": {
        value: String(careerSummary.championships),
      },
      "FCS Championships": {
        value: String(careerSummary.championships),
      },
      "Playoff Appearances": {
        value: String(careerSummary.playoffAppearances),
        detail:
          franchise.tier === "NFL"
            ? `Playoff Record: ${careerSummary.playoffRecord}`
            : stat.detail,
      },
      "Playoff Record": {
        value: careerSummary.playoffRecord,
      },
      "CFP Appearances": {
        value: String(careerSummary.cfpAppearances),
        detail: `CFP Record: ${careerSummary.cfpRecord}`,
      },
      "Bowl Game Appearances": {
        value: String(careerSummary.bowlAppearances),
        detail: `Bowl Record: ${careerSummary.bowlRecord}`,
      },
    };

    return {
      ...stat,
      ...(common[stat.label] || {}),
    };
  });

  return (
    <main
      className={`franchise-profile-page franchise-profile-${franchise.tierClass}`}
      style={{
        "--franchise-primary":
          franchise.primaryColor || "rgba(74, 137, 220, .72)",
        "--franchise-secondary":
          franchise.secondaryColor || "rgba(239, 64, 82, .42)",
      }}
    >
      <Link className="franchise-back-link" to={teamBackPath}>
        <ArrowLeft size={15} />
        Franchise Directory
      </Link>

      <section className="franchise-profile-hero franchise-profile-hero-clean">
        <div className="franchise-profile-hero-glow" />

        <div className="franchise-profile-logo">
          {franchise.logo ? (
            <img src={franchise.logo} alt={`${franchise.team} logo`} />
          ) : (
            <span>{franchise.team?.charAt(0) || "M"}</span>
          )}
        </div>

        <div className="franchise-profile-identity">
          <div className="franchise-profile-kicker">
            <span>{franchise.tier}</span>
            <span>•</span>
            <span>{franchise.conference}</span>
            {franchise.division ? (
              <>
                <span>•</span>
                <span>{franchise.division}</span>
              </>
            ) : null}
          </div>

          <h1>{franchise.team}</h1>

          <div className="franchise-profile-coach">
            <UserRound size={16} />
            <div>
              <span>Current Coach</span>
              <strong>{franchise.coach || "Coach TBD"}</strong>
            </div>
          </div>

          {franchise.tier === "NFL" ? (
            <div className="franchise-hero-current">
              <div>
                <span>DIV Rank</span>
                <strong>
                  {Number(franchise.divisionRank) > 0
                    ? `#${franchise.divisionRank}`
                    : "—"}
                </strong>
              </div>
              <div>
                <span>CONF Rank</span>
                <strong>
                  {Number(franchise.conferenceRank) > 0
                    ? `#${franchise.conferenceRank}`
                    : "—"}
                </strong>
              </div>
              <div>
                <span>NFL Rank</span>
                <strong>
                  {Number(franchise.overallRank) > 0
                    ? `#${franchise.overallRank}`
                    : "—"}
                </strong>
              </div>
              <div>
                <span>OVR Record</span>
                <strong>{franchise.overallSeasonRecord || "0–0"}</strong>
              </div>
              <div>
                <span>PF</span>
                <strong>
                  {formatPoints(
                    franchise.overallSeasonPF || franchise.pointsFor,
                  )}
                </strong>
              </div>
            </div>
          ) : (
            <div className="franchise-hero-current">
              <div>
                <span>CONF Rank</span>
                <strong>
                  {Number(franchise.conferenceRank) > 0
                    ? `#${franchise.conferenceRank}`
                    : "—"}
                </strong>
              </div>
              <div>
                <span>{franchise.tier} Rank</span>
                <strong>
                  {Number(franchise.overallRank) > 0
                    ? `#${franchise.overallRank}`
                    : "—"}
                </strong>
              </div>
              <div>
                <span>OVR Record</span>
                <strong>{franchise.overallSeasonRecord || "0–0"}</strong>
              </div>
              <div>
                <span>CONF Record</span>
                <strong>{franchise.tierStandingsRecord || "0–0"}</strong>
              </div>
              <div>
                <span>PF</span>
                <strong>
                  {formatPoints(
                    franchise.overallSeasonPF || franchise.pointsFor,
                  )}
                </strong>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="franchise-profile-section">
        <SectionHeading
          eyebrow="Achievements"
          title="Trophy Vault"
          action="Open the franchise trophy room"
        />

        <div className="franchise-trophy-entry">
          <div className="franchise-trophy-entry-icon">
            <Crown size={28} />
          </div>

          <div className="franchise-trophy-entry-copy">
            <span>Franchise Trophy Room</span>
            <strong>Trophies, banners & championships</strong>
            <p>
              This will become the visual collection of every trophy and banner
              earned by this franchise. Teams without an honor will simply have
              an empty trophy room.
            </p>
          </div>

          <ChevronRight size={18} />
        </div>
      </section>

      <section className="franchise-profile-section franchise-career-section">
        <SectionHeading
          eyebrow="Franchise Career"
          title="Career Résumé"
          action="Historical totals"
        />

        <div className="franchise-career-grid">
          {careerStats.map((stat) => (
            <CareerStat
              key={stat.label}
              label={stat.label}
              value={stat.value}
              detail={stat.detail}
            />
          ))}
        </div>
      </section>

      <section className="franchise-profile-section">
        <div className="franchise-schedule-heading">
          <SectionHeading
            eyebrow="Scores & Schedule"
            title={`${displayedSeason} Game Log`}
          />

          <label className="franchise-season-select">
            <span>Season</span>
            <select
              value={displayedSeason}
              onChange={(event) =>
                setSelectedSeason(Number(event.target.value))
              }
            >
              {availableSeasons.map((season) => (
                <option value={season} key={season}>
                  {season}
                </option>
              ))}
            </select>
          </label>
        </div>

        {currentSeasonGames.length > 0 ? (
          <div className="franchise-game-log">
            {currentSeasonGames.map((game) => (
              <FranchiseGameRow
                game={game}
                franchiseId={franchise.franchiseId}
                teamLookup={teamLookup}
                key={game.gameId}
              />
            ))}
          </div>
        ) : (
          <div className="franchise-history-empty">
            <CalendarDays size={20} />
            <div>
              <strong>Schedule not available yet</strong>
              <span>
                No GAME_RESULTS matchups are available for {displayedSeason}.
              </span>
            </div>
          </div>
        )}

      </section>

      <section className="franchise-profile-section">
        <SectionHeading
          eyebrow="Permanent History"
          title="Season History"
          action="Season-by-season results"
        />

        <div className="franchise-season-timeline">
          {fullSeasonHistory.map((seasonRow) => {
            const seasonGames = franchiseGames.filter(
              (game) =>
                Number(game.season) === Number(seasonRow.season),
            );

            const postseasonItems = formatHistoricalPostseason(
              seasonRow,
              seasonGames,
              franchise.franchiseId,
            );

            return (
              <article
                className={[
                  "franchise-season-card",
                  seasonRow.isCurrent ? "franchise-season-current" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={`${seasonRow.season}-${seasonRow.franchiseName}`}
              >
                <div className="franchise-season-year">
                  <span>Season</span>
                  <strong>{seasonRow.season}</strong>
                </div>

                <div className="franchise-season-identity">
                  {seasonRow.logo ? (
                    <img src={seasonRow.logo} alt="" />
                  ) : null}
                  <div>
                    <strong>{seasonRow.franchiseName || seasonRow.team}</strong>
                    <span>{seasonRow.coachName || seasonRow.coach || "Coach TBD"}</span>
                  </div>
                </div>

                <div className="franchise-season-finish">
                  <span>
                    OVR{" "}
                    <strong>{seasonRow.overallSeasonRecord || "0–0"}</strong>
                  </span>

                  {franchise.tier !== "NFL" ? (
                    <span>
                      CONF REC{" "}
                      <strong>{seasonRow.tierStandingsRecord || "0–0"}</strong>
                    </span>
                  ) : null}

                  {franchise.tier === "NFL" ? (
                    <span>
                      DIV{" "}
                      <strong>
                        {Number(seasonRow.divisionRank) > 0
                          ? `#${seasonRow.divisionRank}`
                          : "—"}
                      </strong>
                    </span>
                  ) : null}

                  <span>
                    CONF{" "}
                    <strong>
                      {Number(seasonRow.conferenceRank) > 0
                        ? `#${seasonRow.conferenceRank}`
                        : "—"}
                    </strong>
                  </span>

                  <span>
                    {franchise.tier}{" "}
                    <strong>
                      {Number(seasonRow.overallRank) > 0
                        ? `#${seasonRow.overallRank}`
                        : "—"}
                    </strong>
                  </span>
                </div>

                {postseasonItems.length > 0 ? (
                  <div className="franchise-season-postseason">
                    <Trophy size={14} />
                    <div className="franchise-season-postseason-list">
                      {postseasonItems.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

<section className="franchise-profile-section">
        <SectionHeading
          eyebrow="Leadership"
          title="Coaching History"
          action="Coach tenures"
        />

        <div className="franchise-coach-history">
          {coachingTenures.map((tenure) => {
            const record =
              tenure.ties > 0
                ? `${tenure.wins}–${tenure.losses}–${tenure.ties}`
                : `${tenure.wins}–${tenure.losses}`;

            const years =
              tenure.isCurrent
                ? `${tenure.startSeason} – Present`
                : tenure.startSeason === tenure.endSeason
                  ? `${tenure.startSeason}`
                  : `${tenure.startSeason} – ${tenure.endSeason}`;

            return (
              <article
                className="franchise-coach-history-row"
                key={`${tenure.coachKey}-${tenure.startSeason}`}
              >
                <div className="franchise-coach-avatar">
                  <UserRound size={19} />
                </div>

                <div>
                  <span>{years}</span>
                  <strong>{tenure.coachName}</strong>
                  <small>Franchise record: {record}</small>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default FranchiseProfile;
