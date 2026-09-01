import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Archive, ChevronRight, Landmark, Shield, Trophy, Users } from "lucide-react";
import PageHeader from "../components/PageHeader";
import meshShield from "../assets/logos/mfl-shield.png";
import { getCareerStandingsData, getChampionsHistoryData, getSeasonArchiveData } from "../services/historyService";
import "../styles/history.css";

const CONFERENCES = {
  NFL: ["AFC", "NFC"],
  FBS: ["ACC", "Big Ten", "Big 12", "MAC", "Mountain West", "SEC", "Sun Belt"],
  FCS: ["Big Sky", "CAA", "Ivy", "MVC", "NEC", "Southland"],
};

const COACH_SORTS = [
  ["conferenceWins", "Conference Wins"],
  ["tierWins", "Tier Wins"],
  ["meshWins", "MESH Wins"],
  ["conferencePct", "Conference Win %"],
  ["tierPct", "Tier Win %"],
  ["meshPct", "MESH Win %"],
];

const FRANCHISE_SORTS = [
  ["conferenceWins", "Conference Wins"],
  ["tierWins", "Tier Wins"],
  ["conferencePct", "Conference Win %"],
  ["tierPct", "Tier Win %"],
];

const pct = (value) => Number(value || 0).toFixed(3).replace(/^0/, "");

function Identity({ row, mode }) {
  const to = mode === "coaches" ? `/league/coaches/${row.id}` : `/league/franchises/${row.id}`;
  return (
    <div className="history-identity">
      <div className="history-logo">{row.logo ? <img src={row.logo} alt="" /> : <Shield size={28} />}</div>
      <div>
        <Link to={to}>{row.name}</Link>
        <span>{mode === "coaches" ? row.currentTeam : row.coach || row.currentConference}</span>
      </div>
    </div>
  );
}


function ChampionCard({ item }) {
  return <article className={`champion-hero champion-${item.tier.toLowerCase()}`}>
    <div className="champion-crown"><Trophy size={18}/><span>{item.tier}</span></div>
    {item.id ? <>
      <Link className="champion-logo" to={`/league/franchises/${item.id}`}>{item.logo ? <img src={item.logo} alt=""/> : <Shield size={54}/>}</Link>
      <div className="champion-kicker">{item.tier === "NFL" ? "SUPER BOWL CHAMPION" : "NATIONAL CHAMPION"}</div>
      <Link className="champion-name" to={`/league/franchises/${item.id}`}>{item.name}</Link>
      {item.coachId ? <Link className="champion-coach" to={`/league/coaches/${item.coachId}`}>Coach {item.coach}</Link> : <span className="champion-coach">{item.coach || ""}</span>}
      {item.game && <div className="champion-result">{item.score ?? "—"} <span>–</span> {item.opponentScore ?? "—"}<small>vs {item.opponent}</small></div>}
    </> : <div className="champion-empty">Champion not recorded</div>}
  </article>;
}



function conferenceHistoryKey(name) {
  const lower = String(name || "").toLowerCase();
  if (lower === "caa") return "coastal";
  if (lower === "mvc") return "missouri valley";
  if (lower === "nec") return "northeast";
  return lower;
}

function ChampionshipSectionTitle({ eyebrow, title, secondary = false }) {
  return <div className={`champions-title-row ${secondary ? "secondary" : ""}`}><span>{eyebrow}</span><h3>{title}</h3></div>;
}

function CompactChampion({ item, label, showOpponent = false }) {
  if (!item?.id) return <div className="compact-champion missing"><span>{label}</span><em>Not recorded</em></div>;
  return <div className="compact-champion">
    <span className="compact-champion-label">{label}</span>
    <div className="compact-champion-matchup">
      <Link to={`/league/franchises/${item.id}`}>{item.logo ? <img src={item.logo} alt=""/> : <Shield size={22}/>}<b>{item.name}</b></Link>
      {showOpponent && item.opponent ? <span className="compact-champion-opponent"><i>vs</i> {item.opponent}</span> : null}
    </div>
    <small>{item.coach || ""}</small>
  </div>;
}

function PastChampionList({ title, items, showOpponent = false }) {
  return <section className="past-champion-block">
    <h4>{title}</h4>
    <div className="past-champion-list">
      {items.map(({year,item}) => <div className="past-champion-row" key={year}><strong>{year}</strong><CompactChampion item={item} label="" showOpponent={showOpponent}/></div>)}
    </div>
  </section>;
}

function LineageCard({ title, subtitle, defending, history, tier = "NFL" }) {
  return <article className={`lineage-card lineage-${tier.toLowerCase()}`}>
    <header><span>DEFENDING</span><h4>{title}</h4></header>
    <div className="lineage-defending">
      {defending?.id ? <>
        <Link to={`/league/franchises/${defending.id}`}>{defending.logo ? <img src={defending.logo} alt=""/> : <Shield size={36}/>}<div><b>{defending.name}</b><small>{subtitle}</small></div></Link>
        <span>{defending.coach || ""}</span>
      </> : <em>Champion not recorded</em>}
    </div>
    <div className="lineage-past-title">PAST CHAMPIONS</div>
    <div className="lineage-history">
      {history.map(({year,item}) => <div key={year}><strong>{year}</strong>{item?.id ? <Link to={`/league/franchises/${item.id}`}>{item.logo ? <img src={item.logo} alt=""/> : <Shield size={18}/>}<span>{item.name}</span></Link> : <em>Not recorded</em>}</div>)}
    </div>
  </article>;
}


function ArchiveSectionTitle({ eyebrow, title, description = "" }) {
  return <div className="archive-section-title"><span>{eyebrow}</span><h3>{title}</h3>{description ? <p>{description}</p> : null}</div>;
}

function ArchiveTeamRow({ team, conferenceView = false, rankByConference = false }) {
  const primaryRank = rankByConference
    ? (team.conferenceRank || team.overallRank || "—")
    : conferenceView
      ? (team.conferenceRank || team.overallRank || "—")
      : (team.overallRank || team.conferenceRank || "—");

  return <div className="archive-team-row">
    <strong className="archive-team-rank">{primaryRank}</strong>
    <div className="archive-team-logo">{team.logo ? <img src={team.logo} alt=""/> : <Shield size={22}/>}</div>
    <div className="archive-team-copy">
      <Link to={`/league/franchises/${team.id}`}>{team.name}</Link>
      <span>{team.coach || ""}</span>
    </div>
    <div className="archive-team-record archive-team-record-stacked">
      {conferenceView ? <>
        <div><strong>{team.conferenceRecord || "—"}</strong><span>CONF</span></div>
        <div><strong>{team.overallRecord || "—"}</strong><span>OVERALL</span></div>
      </> : <div><strong>{team.overallRecord || "—"}</strong><span>OVERALL</span></div>}
    </div>
  </div>;
}

function ArchiveStandings({ rows, conferenceView = false, rankByConference = false }) {
  if (!rows?.length) return <div className="archive-empty">Final standings unavailable.</div>;
  return <div className="archive-standings-list">
    {rows.map((team) => <ArchiveTeamRow key={team.id} team={team} conferenceView={conferenceView} rankByConference={rankByConference}/>) }
  </div>;
}

function NflQualifierColumns({ qualifiers }) {
  const byConference = (conference) => qualifiers
    .filter((team) => String(team.conference || "").toUpperCase() === conference)
    .sort((a, b) => (a.playoffSeed || 99) - (b.playoffSeed || 99));

  return <div className="archive-nfl-qualifier-columns">
    {["AFC", "NFC"].map((conference) => <section className="archive-nfl-qualifier-column" key={conference}>
      <header><span>{conference}</span><strong>Playoff Qualifiers</strong></header>
      <div className="archive-nfl-seed-list">
        {byConference(conference).map((team) => <Link to={`/league/franchises/${team.id}`} className="archive-nfl-seed-row" key={team.id}>
          <b>#{team.playoffSeed}</b>
          <div className="archive-team-logo">{team.logo ? <img src={team.logo} alt=""/> : <Shield size={22}/>}</div>
          <div><strong>{team.name}</strong><span>{team.coach || ""}</span></div>
        </Link>)}
      </div>
    </section>)}
  </div>;
}

function ArchiveQualifierCard({ team, label }) {
  return <article className="archive-qualifier-card">
    <div className="archive-qualifier-top">
      <div className="archive-team-logo">{team.logo ? <img src={team.logo} alt=""/> : <Shield size={24}/>}</div>
      <div><Link to={`/league/franchises/${team.id}`}>{team.name}</Link><span>{team.coach || ""}</span></div>
      {team.playoffSeed ? <strong>#{team.playoffSeed}</strong> : null}
    </div>
    <div className="archive-qualifier-bottom"><span>{label}</span><b>{team.postseasonRecord || "0-0"}</b><small>{team.playoffResult || "Postseason qualifier"}</small></div>
  </article>;
}

function ArchiveGameCard({ game, bowl = false }) {
  const winner = String(game?.winnerId || "");
  const team = (side) => ({
    id: side === 1 ? game?.team1Id : game?.team2Id,
    name: side === 1 ? game?.team1Team : game?.team2Team,
    logo: side === 1 ? game?.team1Logo : game?.team2Logo,
    score: side === 1 ? game?.team1Score : game?.team2Score,
  });
  const one = team(1), two = team(2);
  const title = bowl ? (game?.bowlName || "Bowl Game") : (game?.gameType || game?.gameCategory || game?.label || `Week ${game?.week}`);
  return <article className="archive-game-card">
    <header><span>WEEK {game?.week}</span><strong>{title}</strong></header>
    {[one,two].map((item) => <div className={`archive-game-team ${winner && winner === String(item.id) ? "winner" : ""}`} key={item.id || item.name}>
      <div>{item.logo ? <img src={item.logo} alt=""/> : <Shield size={19}/>}<span>{item.name || "TBD"}</span></div>
      <strong>{item.score ?? "—"}</strong>
    </div>)}
  </article>;
}

function ArchiveGameGrid({ games, emptyText, bowl = false }) {
  if (!games?.length) return <div className="archive-empty">{emptyText}</div>;
  return <div className="archive-game-grid">{games.map((game, index) => <ArchiveGameCard key={game.gameId || `${game.week}-${game.gameNumber}-${index}`} game={game} bowl={bowl}/>)}</div>;
}

function ArchiveChampionStrip({ champion, label }) {
  if (!champion?.id) return <div className="archive-champion-strip empty">{label} not recorded</div>;
  return <div className="archive-champion-strip">
    <span>{label}</span>
    <Link to={`/league/franchises/${champion.id}`}>{champion.logo ? <img src={champion.logo} alt=""/> : <Shield size={30}/>}<div><strong>{champion.name}</strong><small>{champion.coach || ""}</small></div></Link>
  </div>;
}

function ArchiveRecordBook({ tier, rows }) {
  const [sortKey, setSortKey] = useState("default");
  const [sortDirection, setSortDirection] = useState("desc");

  if (!rows?.length) return <div className="archive-empty">Conference history unavailable.</div>;

  const recordValue = (row, winsKey, lossesKey) => ({
    wins: Number(row[winsKey] || 0),
    losses: Number(row[lossesKey] || 0),
  });

  const columns = tier === "FBS"
    ? [
        ["nationalTitles", "NAT TITLES", (row) => Number(row.nationalTitles || 0)],
        ["conferenceChampionshipApps", "CONF TITLE GAMES", (row) => Number(row.conferenceChampionshipApps || 0)],
        ["conferenceTitles", "CONF TITLES", (row) => Number(row.conferenceTitles || 0)],
        ["cfpApps", "CFP APP", (row) => Number(row.cfpApps || 0)],
        ["cfpRecord", "CFP REC", (row) => recordValue(row, "cfpWins", "cfpLosses")],
        ["bowlApps", "BOWL APP", (row) => Number(row.bowlApps || 0)],
        ["bowlRecord", "BOWL REC", (row) => recordValue(row, "bowlWins", "bowlLosses")],
      ]
    : tier === "FCS"
      ? [
          ["nationalTitles", "NAT TITLES", (row) => Number(row.nationalTitles || 0)],
          ["conferenceTitles", "CONF TITLES", (row) => Number(row.conferenceTitles || 0)],
          ["playoffApps", "PLAYOFF APP", (row) => Number(row.playoffApps || 0)],
          ["playoffRecord", "PLAYOFF REC", (row) => recordValue(row, "playoffWins", "playoffLosses")],
        ]
      : [
          ["divisionTitles", "DIV TITLES", (row) => Number(row.divisionTitles || 0)],
          ["conferenceTitles", "CONF TITLES", (row) => Number(row.conferenceTitles || 0)],
          ["superBowls", "SB", (row) => Number(row.superBowls || 0)],
          ["playoffApps", "PLAYOFF APP", (row) => Number(row.playoffApps || 0)],
          ["playoffRecord", "PLAYOFF REC", (row) => recordValue(row, "playoffWins", "playoffLosses")],
        ];

  const choose = (key) => {
    if (sortKey === key) setSortDirection((direction) => direction === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDirection(key === "franchise" ? "asc" : "desc"); }
  };

  const sortedRows = [...rows].sort((a, b) => {
    if (sortKey === "default") return 0;
    if (sortKey === "franchise") {
      const result = String(a.name || "").localeCompare(String(b.name || ""));
      return sortDirection === "asc" ? result : -result;
    }
    const column = columns.find(([key]) => key === sortKey);
    const av = column?.[2](a);
    const bv = column?.[2](b);
    let result = 0;
    if (typeof av === "object") result = av.wins - bv.wins || bv.losses - av.losses;
    else result = Number(av || 0) - Number(bv || 0);
    if (!result) result = String(a.name || "").localeCompare(String(b.name || ""));
    return sortDirection === "asc" ? result : -result;
  });

  const sortHeader = (key, label) => <button type="button" className={sortKey === key ? "active" : ""} onClick={() => choose(key)}>
    {label}<span>{sortKey === key ? (sortDirection === "desc" ? "↓" : "↑") : "↕"}</span>
  </button>;

  const totals = rows.reduce((acc, row) => {
    Object.keys(acc).forEach((key) => { acc[key] += Number(row[key] || 0); });
    return acc;
  }, {
    nationalTitles: 0, conferenceChampionshipApps: 0, conferenceTitles: 0, cfpApps: 0, cfpWins: 0, cfpLosses: 0, bowlApps: 0, bowlWins: 0, bowlLosses: 0,
    divisionTitles: 0, superBowls: 0, playoffApps: 0, playoffWins: 0, playoffLosses: 0,
  });

  return <div className="archive-record-wrap"><table className="archive-record-table">
    <thead><tr><th>{sortHeader("franchise", "Franchise")}</th>{columns.map(([key, label]) => <th key={key}>{sortHeader(key, label)}</th>)}</tr></thead>
    <tbody>{sortedRows.map((row) => <tr key={row.id}>
      <td><Link to={`/league/franchises/${row.id}`} className="archive-record-team">{row.logo ? <img src={row.logo} alt=""/> : <Shield size={20}/>}<span>{row.name}</span></Link></td>
      {tier === "FBS" ? <><td>{row.nationalTitles}</td><td>{row.conferenceChampionshipApps}</td><td>{row.conferenceTitles}</td><td>{row.cfpApps}</td><td>{row.cfpWins}-{row.cfpLosses}</td><td>{row.bowlApps}</td><td>{row.bowlWins}-{row.bowlLosses}</td></> : tier === "FCS" ? <><td>{row.nationalTitles}</td><td>{row.conferenceTitles}</td><td>{row.playoffApps}</td><td>{row.playoffWins}-{row.playoffLosses}</td></> : <><td>{row.divisionTitles}</td><td>{row.conferenceTitles}</td><td>{row.superBowls}</td><td>{row.playoffApps}</td><td>{row.playoffWins}-{row.playoffLosses}</td></>}
    </tr>)}
    <tr className="archive-record-total-row"><td><strong>TOTALS</strong></td>
      {tier === "FBS" ? <><td>{totals.nationalTitles}</td><td>{totals.conferenceChampionshipApps}</td><td>{totals.conferenceTitles}</td><td>{totals.cfpApps}</td><td>{totals.cfpWins}-{totals.cfpLosses}</td><td>{totals.bowlApps}</td><td>{totals.bowlWins}-{totals.bowlLosses}</td></> : tier === "FCS" ? <><td>{totals.nationalTitles}</td><td>{totals.conferenceTitles}</td><td>{totals.playoffApps}</td><td>{totals.playoffWins}-{totals.playoffLosses}</td></> : <><td>{totals.divisionTitles}</td><td>{totals.conferenceTitles}</td><td>{totals.superBowls}</td><td>{totals.playoffApps}</td><td>{totals.playoffWins}-{totals.playoffLosses}</td></>}
    </tr></tbody>
  </table></div>;
}


export default function History() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSection = ["career", "champions", "archive"].includes(searchParams.get("view")) ? searchParams.get("view") : "career";
  const [section, setSection] = useState(initialSection);
  const [mode, setMode] = useState(searchParams.get("mode") === "franchises" ? "franchises" : "coaches");
  const [population, setPopulation] = useState(searchParams.get("population") === "all" ? "all" : "current");
  const [tier, setTier] = useState(["NFL","FBS","FCS"].includes(searchParams.get("tier")) ? searchParams.get("tier") : "FBS");
  const [conference, setConference] = useState(searchParams.get("conference") || "ACC");
  const [sortKey, setSortKey] = useState("conferenceWins");
  const [sortDirection, setSortDirection] = useState("desc");
  const [data, setData] = useState({ coaches: [], franchises: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [championsData, setChampionsData] = useState({ seasons: [], bySeason: {} });
  const [championsLoading, setChampionsLoading] = useState(false);
  const [championsError, setChampionsError] = useState("");
  const [championTier, setChampionTier] = useState(["ALL","NFL","FBS","FCS"].includes(searchParams.get("championTier")) ? searchParams.get("championTier") : "ALL");
  const [archiveData, setArchiveData] = useState({ seasons: [], bySeason: {}, recordBooks: {} });
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState("");
  const [archiveSeason, setArchiveSeason] = useState(Number(searchParams.get("season")) || null);
  const [archiveTier, setArchiveTier] = useState(["NFL","FBS","FCS"].includes(searchParams.get("archiveTier")) ? searchParams.get("archiveTier") : "NFL");
  const [archiveConference, setArchiveConference] = useState(searchParams.get("archiveConference") || "ACC");
  const [nflStandingsConference, setNflStandingsConference] = useState(searchParams.get("nflConference") === "NFC" ? "NFC" : "AFC");

  const updateHistoryUrl = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") next.delete(key);
      else next.set(key, String(value));
    });
    setSearchParams(next, { replace: true });
  };

  const chooseSection = (nextSection) => {
    setSection(nextSection);
    if (nextSection === "archive") {
      setArchiveTier("NFL");
      setNflStandingsConference("AFC");
      updateHistoryUrl({ view: nextSection, archiveTier: "NFL", nflConference: "AFC" });
      return;
    }
    updateHistoryUrl({ view: nextSection });
  };

  useEffect(() => {
    const options = CONFERENCES[tier] || [];
    if (conference !== "all" && !options.includes(conference)) setConference("all");
  }, [tier, conference]);

  useEffect(() => {
    if (mode === "franchises" && (sortKey === "meshWins" || sortKey === "meshPct")) {
      setSortKey("conferenceWins");
      setSortDirection("desc");
    }
  }, [mode, sortKey]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    getCareerStandingsData({ tier, conference, population })
      .then((result) => live && setData(result))
      .catch((err) => live && setError(err.message || "History unavailable."))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [tier, conference, population]);


  useEffect(() => {
    if (section !== "champions" || championsData.seasons.length) return;
    let live = true;
    setChampionsLoading(true);
    getChampionsHistoryData()
      .then((result) => { if (!live) return; setChampionsData(result); })
      .catch((err) => live && setChampionsError(err.message || "Champions history unavailable."))
      .finally(() => live && setChampionsLoading(false));
    return () => { live = false; };
  }, [section, championsData.seasons.length]);


  useEffect(() => {
    if (section !== "archive" || archiveData.seasons.length) return;
    let live = true;
    setArchiveLoading(true);
    setArchiveError("");
    getSeasonArchiveData()
      .then((result) => {
        if (!live) return;
        setArchiveData(result);
        setArchiveSeason((current) => current || result.seasons[0] || null);
      })
      .catch((err) => live && setArchiveError(err.message || "Season archive unavailable."))
      .finally(() => live && setArchiveLoading(false));
    return () => { live = false; };
  }, [section, archiveData.seasons.length]);

  useEffect(() => {
    const options = CONFERENCES[archiveTier] || [];
    if ((archiveTier === "FBS" || archiveTier === "FCS") && !options.includes(archiveConference)) {
      setArchiveConference(options[0] || "");
    }
  }, [archiveTier, archiveConference]);

  const defendingSeason = championsData.seasons[0] || null;
  const championSeasonData = defendingSeason ? championsData.bySeason[defendingSeason] : null;

  const rows = useMemo(() => {
    const source = mode === "coaches" ? data.coaches : data.franchises;
    const value = (row) => {
      if (sortKey === "tierWins") return row.tier.wins;
      if (sortKey === "meshWins") return row.mesh.wins;
      if (sortKey === "conferencePct") return row.conference.winPct;
      if (sortKey === "tierPct") return row.tier.winPct;
      if (sortKey === "meshPct") return row.mesh.winPct;
      return row.conference.wins;
    };
    const multiplier = sortDirection === "asc" ? 1 : -1;
    return [...source].sort((a, b) => {
      const primary = value(a) - value(b);
      if (primary) return primary * multiplier;
      const confWins = a.conference.wins - b.conference.wins;
      if (confWins) return confWins * multiplier;
      const tierWins = a.tier.wins - b.tier.wins;
      if (tierWins) return tierWins * multiplier;
      return a.name.localeCompare(b.name);
    });
  }, [data, mode, sortKey, sortDirection]);

  const chooseSort = (key) => {
    if (key === sortKey) setSortDirection((direction) => direction === "desc" ? "asc" : "desc");
    else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const label = conference === "all" ? "CONF" : conference;
  const historyLabel = conference === "all" ? `${tier} History` : `${conference} History`;

  const selectedArchive = archiveSeason ? archiveData.bySeason?.[archiveSeason] : null;
  const archiveConferenceKey = conferenceHistoryKey(archiveConference);
  const archiveConferenceData = selectedArchive?.[archiveTier]?.conferences?.[archiveConferenceKey] || null;
  const archiveRecordRows = archiveData.recordBooks?.[archiveTier]?.[archiveConferenceKey] || [];

  return (
    <main className={`history-page history-${tier.toLowerCase()}`}>
      <PageHeader eyebrow="MESH Archives" title="History" description="Explore the people, franchises and seasons that built MESH Football." imageSrc={meshShield} imageAlt="MESH Football shield" accent="league" size="compact" />

      <div className="history-section-tabs">
        <button className={section === "career" ? "active" : ""} onClick={() => chooseSection("career")}><Landmark size={17}/>Career Standings</button>
        <button className={section === "champions" ? "active" : ""} onClick={() => chooseSection("champions")}><Trophy size={17}/>Champions</button>
        <button className={section === "archive" ? "active" : ""} onClick={() => chooseSection("archive")}><Archive size={17}/>Season Archive</button>
      </div>

      {section === "career" && <>
        <section className="history-intro">
          <span>CAREER LEADERBOARDS</span>
          <h2>{historyLabel}</h2>
          <p>{conference === "all" ? `Rank the entire ${tier} tier by conference and overall tier career performance.` : `Compare ${conference} success with complete ${tier} career performance.`}</p>
        </section>

        <div className="history-mode-tabs">
          <button className={mode === "coaches" ? "active" : ""} onClick={() => { setMode("coaches"); updateHistoryUrl({ mode: "coaches" }); }}><Users size={16}/>Coaches</button>
          <button className={mode === "franchises" ? "active" : ""} onClick={() => { setMode("franchises"); updateHistoryUrl({ mode: "franchises" }); }}><Shield size={16}/>Franchises</button>
        </div>

        <div className="history-filters">
          <label><span>Tier</span><select value={tier} onChange={(e) => { setTier(e.target.value); updateHistoryUrl({ tier: e.target.value }); }}>{["NFL","FBS","FCS"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Conference</span><select value={conference} onChange={(e) => { setConference(e.target.value); updateHistoryUrl({ conference: e.target.value }); }}><option value="all">All {tier}</option>{(CONFERENCES[tier] || []).map((item) => <option key={item}>{item}</option>)}</select></label>
          {mode === "coaches" && <label><span>Coaches</span><select value={population} onChange={(e) => { setPopulation(e.target.value); updateHistoryUrl({ population: e.target.value }); }}><option value="current">Current Coaches</option><option value="all">All-Time Coaches</option></select></label>}
        </div>

        <div className="history-rankby"><span>Rank by</span>{(mode === "coaches" ? COACH_SORTS : FRANCHISE_SORTS).map(([key, text]) => <button key={key} className={sortKey === key ? "active" : ""} onClick={() => chooseSort(key)}>{text}{sortKey === key && <span className="history-sort-arrow">{sortDirection === "desc" ? "↓" : "↑"}</span>}</button>)}</div>

        {loading && <div className="history-state">Loading MESH history…</div>}
        {error && <div className="history-state error">{error}</div>}
        {!loading && !error && <section className="history-table-wrap">
          <table className="history-table">
            <thead><tr><th>#</th><th>{mode === "coaches" ? "Coach" : "Franchise"}</th><th>{label} REC</th><th>{label} W</th><th>{label} WIN%</th><th>{tier} REC</th><th>{tier} W</th><th>{tier} WIN%</th>{mode === "coaches" && <><th>MESH REC</th><th>MESH W</th><th>MESH WIN%</th><th>SEASONS IN CONF</th><th>SEASONS IN MESH</th></>}</tr></thead>
            <tbody>{rows.map((row, index) => <tr key={row.id}>
              <td className="history-rank">{index + 1}</td>
              <td><Identity row={row} mode={mode}/></td>
              <td><b>{row.conference.record}</b></td>
              <td className={sortKey === "conferenceWins" ? "history-highlight" : ""}>{row.conference.wins}</td>
              <td className={sortKey === "conferencePct" ? "history-highlight" : ""}>{pct(row.conference.winPct)}</td>
              <td>{row.tier.record}</td>
              <td className={sortKey === "tierWins" ? "history-highlight" : ""}>{row.tier.wins}</td>
              <td className={sortKey === "tierPct" ? "history-highlight" : ""}>{pct(row.tier.winPct)}</td>
              {mode === "coaches" && <>
                <td>{row.mesh.record}</td>
                <td className={sortKey === "meshWins" ? "history-highlight" : ""}>{row.mesh.wins}</td>
                <td className={sortKey === "meshPct" ? "history-highlight" : ""}>{pct(row.mesh.winPct)}</td>
                <td>{row.conferenceSeasons}</td>
                <td>{row.meshSeasons}</td>
              </>}
            </tr>)}</tbody>
          </table>
        </section>}
      </>}

      {section === "champions" && <section className="champions-section">
        <section className="history-intro champions-intro">
          <span>MESH RECORD BOOK</span>
          <h2>Champions</h2>
          <p>Defending champions and the complete championship lineage of MESH.</p>
        </section>

        <div className="champions-tier-tabs champions-tier-only">
          {["ALL","NFL","FBS","FCS"].map((item) => <button key={item} className={championTier === item ? "active" : ""} onClick={() => { setChampionTier(item); updateHistoryUrl({ championTier: item }); }}>{item === "ALL" ? "All MESH" : item}</button>)}
        </div>

        {championsLoading && <div className="history-state">Loading MESH champions…</div>}
        {championsError && <div className="history-state error">{championsError}</div>}
        {!championsLoading && !championsError && championSeasonData && <>
          {championTier === "ALL" && <>
            <ChampionshipSectionTitle eyebrow={`${defendingSeason} SEASON`} title="MESH Defending Champions" />
            <div className="champion-hero-grid">
              {championSeasonData.champions.map((item) => <ChampionCard key={item.tier} item={item}/>) }
            </div>
            <ChampionshipSectionTitle eyebrow="MESH HISTORY" title="Past Champions" secondary />
            <div className="mesh-past-champions">
              {championsData.seasons.slice(1).map((year) => <div className="mesh-past-row" key={year}>
                <strong>{year}</strong>
                {championsData.bySeason[year].champions.map((item) => <CompactChampion key={`${year}-${item.tier}`} item={item} label={item.tier} showOpponent/>) }
              </div>)}
            </div>
          </>}

          {championTier === "NFL" && <>
            <ChampionshipSectionTitle eyebrow={`${defendingSeason} NFL`} title="Defending NFL Champion" />
            <div className="champion-hero-grid single"><ChampionCard item={championSeasonData.champions.find((x) => x.tier === "NFL") || {tier:"NFL"}}/></div>
            <PastChampionList title="Past NFL Champions" showOpponent items={championsData.seasons.slice(1).map((year) => ({year, item: championsData.bySeason[year].champions.find((x) => x.tier === "NFL")}))}/>

            <ChampionshipSectionTitle eyebrow="NFL CHAMPIONS" title="Conference Champions" secondary />
            <div className="championship-lineage-grid">
              {CONFERENCES.NFL.map((conf) => <LineageCard key={conf} title={conf} subtitle="Conference Champion" defending={championSeasonData.nflConferenceChampions.find((x) => String(x.conference).toUpperCase() === conf)} history={championsData.seasons.slice(1).map((year) => ({year,item: championsData.bySeason[year].nflConferenceChampions.find((x) => String(x.conference).toUpperCase() === conf)}))}/>) }
            </div>

            <ChampionshipSectionTitle eyebrow="NFL CHAMPIONS" title="Division Champions" secondary />
            <div className="championship-lineage-grid divisions">
              {[...new Set(championSeasonData.nflDivisionChampions.map((x) => `${x.conference}|${x.division}`))].map((key) => {
                const [conf, div] = key.split("|");
                return <LineageCard key={key} title={`${conf} ${div}`} subtitle="Division Champion" defending={championSeasonData.nflDivisionChampions.find((x) => x.conference === conf && x.division === div)} history={championsData.seasons.slice(1).map((year) => ({year,item: championsData.bySeason[year].nflDivisionChampions.find((x) => x.conference === conf && x.division === div)}))}/>;
              })}
            </div>
          </>}

          {(championTier === "FBS" || championTier === "FCS") && <>
            <ChampionshipSectionTitle eyebrow={`${defendingSeason} ${championTier}`} title={`Defending ${championTier} National Champion`} />
            <div className="champion-hero-grid single"><ChampionCard item={championSeasonData.champions.find((x) => x.tier === championTier) || {tier:championTier}}/></div>
            <PastChampionList title={`Past ${championTier} National Champions`} showOpponent items={championsData.seasons.slice(1).map((year) => ({year,item: championsData.bySeason[year].champions.find((x) => x.tier === championTier)}))}/>

            <ChampionshipSectionTitle eyebrow={`${championTier} CHAMPIONS`} title="Conference Champions" secondary />
            <div className="championship-lineage-grid conferences">
              {(CONFERENCES[championTier] || []).map((conf) => {
                const key = conferenceHistoryKey(conf);
                return <LineageCard key={conf} title={conf} subtitle="Conference Champion" tier={championTier} defending={championSeasonData.conferenceData?.[championTier]?.[key]?.champion} history={championsData.seasons.slice(1).map((year) => ({year,item: championsData.bySeason[year].conferenceData?.[championTier]?.[key]?.champion}))}/>;
              })}
            </div>
          </>}
        </>}
      </section>}

      {section === "archive" && <section className="season-archive-section">
        <section className="history-intro archive-intro">
          <span>MESH SEASON RECORD</span>
          <h2>Season Archive</h2>
          <p>Choose a completed season, then explore final conference standings and every postseason path from that year.</p>
        </section>

        <div className="archive-toolbar">
          <label className="archive-season-picker"><span>Season</span><select value={archiveSeason || ""} onChange={(e) => { const value = Number(e.target.value); setArchiveSeason(value); updateHistoryUrl({ season: value }); }}>{archiveData.seasons.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
          <div className="archive-tier-tabs">{["NFL","FBS","FCS"].map((item) => <button key={item} className={archiveTier === item ? "active" : ""} onClick={() => { setArchiveTier(item); updateHistoryUrl({ archiveTier: item }); }}>{item}</button>)}</div>
        </div>

        {archiveLoading && <div className="history-state">Loading season archive…</div>}
        {archiveError && <div className="history-state error">{archiveError}</div>}
        {!archiveLoading && !archiveError && selectedArchive && <>
          {archiveTier === "NFL" && <div className="archive-tier-view archive-nfl">
            <ArchiveSectionTitle eyebrow={`${archiveSeason} NFL`} title="NFL Season" description="Final conference standings and the complete AFC/NFC playoff fields from the selected season."/>

            <section className="archive-panel">
              <div className="archive-section-title-with-link">
                <ArchiveSectionTitle eyebrow="PLAYOFF FIELD" title="Playoff Qualifiers" description="AFC and NFC qualifiers shown in seed order."/>
                <Link className="archive-bracket-link" to={`/standings?tier=nfl&filter=playoff-bracket&season=${archiveSeason}`}>View {archiveSeason} NFL Bracket <ChevronRight size={13}/></Link>
              </div>
              <NflQualifierColumns qualifiers={selectedArchive.NFL.qualifiers}/>
            </section>

            <section className="archive-panel">
              <div className="archive-section-title-with-tabs">
                <ArchiveSectionTitle eyebrow="FINAL TABLE" title={`${nflStandingsConference} Final Standings`}/>
                <div className="archive-inline-tabs">{["AFC","NFC"].map((item) => <button type="button" key={item} className={nflStandingsConference === item ? "active" : ""} onClick={() => { setNflStandingsConference(item); updateHistoryUrl({ nflConference: item }); }}>{item}</button>)}</div>
              </div>
              <ArchiveStandings rows={selectedArchive.NFL.standingsByConference?.[nflStandingsConference] || []} rankByConference/>
            </section>

            <section className="archive-panel"><ArchiveSectionTitle eyebrow="NFL HISTORY" title="Franchise Postseason Record Book" description="Click any column heading to rank NFL franchises by that postseason accomplishment."/>
              <ArchiveRecordBook tier="NFL" rows={[...Object.values(archiveData.recordBooks?.NFL || {}).flat()].filter((row, index, all) => all.findIndex((item) => item.id === row.id) === index)}/>
            </section>
          </div>}

          {(archiveTier === "FBS" || archiveTier === "FCS") && <div className={`archive-tier-view archive-${archiveTier.toLowerCase()}`}>
            <div className="archive-conference-tabs">{(CONFERENCES[archiveTier] || []).map((item) => <button key={item} className={archiveConference === item ? "active" : ""} onClick={() => { setArchiveConference(item); updateHistoryUrl({ archiveConference: item }); }}>{item}</button>)}</div>

            {archiveConferenceData ? <>
              <ArchiveSectionTitle eyebrow={`${archiveSeason} ${archiveTier}`} title={`${archiveConference} Season`} description={`The complete ${archiveConference} archive for the ${archiveSeason} MESH season.`}/>
              <ArchiveChampionStrip champion={archiveConferenceData.champion} label={`${archiveConference} Champion`}/>
              {archiveTier === "FBS" && archiveConferenceData.championshipGame ? <section className="archive-panel archive-conference-title-game"><ArchiveSectionTitle eyebrow="CONFERENCE CHAMPIONSHIP" title="Title Game"/><ArchiveGameGrid games={[archiveConferenceData.championshipGame]} emptyText="Conference Championship result unavailable."/></section> : null}

              <section className="archive-panel"><ArchiveSectionTitle eyebrow="FINAL TABLE" title={`${archiveConference} Final Standings`}/><ArchiveStandings rows={archiveConferenceData.standings} conferenceView/></section>

              <section className="archive-panel"><ArchiveSectionTitle eyebrow={archiveTier === "FBS" ? "COLLEGE FOOTBALL PLAYOFF" : "FCS PLAYOFFS"} title="Postseason Qualifiers" description={`Every ${archiveConference} team that reached the ${archiveTier === "FBS" ? "CFP" : "FCS Playoffs"}, with its final postseason result.`}/>
                {archiveConferenceData.qualifiers.length ? <div className="archive-qualifier-grid">{archiveConferenceData.qualifiers.map((team) => <ArchiveQualifierCard key={team.id} team={team} label={`${archiveTier === "FBS" ? "CFP" : "PLAYOFF"} Record`}/>)}</div> : <div className="archive-empty">No {archiveConference} teams qualified for the {archiveTier === "FBS" ? "CFP" : "FCS Playoffs"}.</div>}
              </section>

              <section className="archive-panel"><ArchiveSectionTitle eyebrow="POSTSEASON RESULTS" title={archiveTier === "FBS" ? "CFP Games" : "FCS Playoff Games"}/><ArchiveGameGrid games={archiveConferenceData.playoffGames} emptyText={`No ${archiveConference} postseason games recorded for this season.`}/></section>

              {archiveTier === "FBS" && <section className="archive-panel archive-bowls"><ArchiveSectionTitle eyebrow="BOWL HISTORY" title={`${archiveConference} Bowl Games`} description="Every non-CFP bowl game involving this conference in the selected season."/><ArchiveGameGrid games={archiveConferenceData.bowls} emptyText={`No ${archiveConference} bowl games recorded for this season.`} bowl/></section>}

              <section className="archive-panel archive-history-book"><ArchiveSectionTitle eyebrow="CONFERENCE HISTORY" title={`${archiveConference} Franchise Record Book`} description="All-time postseason accomplishments for the permanent franchises in this conference. Click any column heading to sort."/><ArchiveRecordBook tier={archiveTier} rows={archiveRecordRows}/></section>
            </> : <div className="archive-empty">Conference archive unavailable.</div>}
          </div>}
        </>}
      </section>}
    </main>
  );
}
