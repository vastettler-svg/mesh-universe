import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Flame, Gauge, Medal, Shield, Swords, Trophy } from "lucide-react";
import PageHeader from "../components/PageHeader";
import meshShield from "../assets/logos/mfl-shield.png";
import { calculateStats, getStatsCenterData } from "../services/statsService";
import "../styles/stats.css";

const CONFERENCES = {
  NFL: ["AFC", "NFC"],
  FBS: ["ACC", "Big Ten", "Big 12", "MAC", "Mountain West", "SEC", "Sun Belt"],
  FCS: ["Big Sky", "CAA", "Ivy", "MVC", "NEC", "Southland"],
};
const SORTS = [
  ["ppg", "PPG"], ["pf", "PF"], ["papg", "PA/G"], ["differentialPerGame", "+/-"],
  ["highScore", "High"], ["currentWinStreak", "Streak"],
];
const LOWER_IS_BETTER = new Set(["papg"]);
const fmt = (n) => Number.isFinite(Number(n)) ? Number(n).toFixed(1) : "—";
const score = (n) => Number.isFinite(Number(n)) ? Number(n).toFixed(2).replace(/\.00$/, "") : "—";

function TeamMark({ row }) {
  return <div className="stats-team-mark">{row?.logo ? <img src={row.logo} alt="" /> : <Shield size={25} />}<div><Link to={`/league/franchises/${row?.franchiseId}`}>{row?.team || "—"}</Link><span>{row?.conference || row?.tier || ""}</span></div></div>;
}

function TeamLeaderCard({ title, icon, item, value, detail }) {
  return <article className="stats-record-card"><div className="stats-record-title">{icon}{title}</div>{item ? <><TeamMark row={item}/><strong>{value}</strong><span>{detail}</span></> : <><strong>—</strong><span>No completed games</span></>}</article>;
}

function GameRecord({ title, icon, item, kind, conference }) {
  if (!item) return <article className="stats-record-card"><div className="stats-record-title">{icon}{title}</div><strong>—</strong><span>No completed games</span></article>;
  const isEntry = kind === "high" || kind === "low";
  const game = isEntry ? item : item.game;
  const displayTeam = isEntry ? item : (conference !== "all" ? item.conferenceTeam : item.winner);
  let value = "—";
  if (kind === "high" || kind === "low") value = score(item.pf);
  if (kind === "margin" || kind === "closest") value = `${score(item.margin)} pts`;
  if (kind === "combined") value = `${score(item.total)} pts`;
  if (kind === "losing") value = score(item.losingScore);
  const opponent = displayTeam?.id === game.team1Id ? game.team2Team : game.team1Team;
  return <article className="stats-record-card"><div className="stats-record-title">{icon}{title}</div><TeamMark row={{...displayTeam, franchiseId:displayTeam?.id}}/><strong>{value}</strong><span>vs {opponent} · {game.season} Wk {game.week}</span>{Number(game.season) >= 2026 && <Link className="stats-game-link" to={`/scores/${game.gameId}`}>Game Center →</Link>}</article>;
}

export default function Stats() {
  const [raw, setRaw] = useState({ seasons: [], games: [], currentTeams: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("teams");
  const [season, setSeason] = useState("all");
  const [tier, setTier] = useState("NFL");
  const [conference, setConference] = useState("all");
  const [scope, setScope] = useState("regular");
  const [sortKey, setSortKey] = useState("ppg");
  const [sortDirection, setSortDirection] = useState("desc");

  useEffect(() => { let live = true; getStatsCenterData().then((data) => live && setRaw(data)).catch((e) => live && setError(e.message || "Stats unavailable.")).finally(() => live && setLoading(false)); return () => { live = false; }; }, []);
  useEffect(() => setConference("all"), [tier]);
  const data = useMemo(() => calculateStats(raw.games, { season, tier, conference, scope, currentTeams: raw.currentTeams }), [raw.games, raw.currentTeams, season, tier, conference, scope]);
  const teams = useMemo(() => [...data.teams].sort((a,b) => {
    const naturalAscending = LOWER_IS_BETTER.has(sortKey);
    const ascending = sortDirection === "asc" ? !naturalAscending : naturalAscending;
    const delta = Number(a[sortKey] || 0) - Number(b[sortKey] || 0);
    return (ascending ? delta : -delta) || b.ppg-a.ppg;
  }), [data.teams, sortKey, sortDirection]);
  const r = data.records;

  const chooseSort = (key) => {
    if (key === sortKey) setSortDirection((direction) => direction === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDirection("desc"); }
  };

  return <div className={`stats-page stats-${tier.toLowerCase()}`}>
    <PageHeader
      eyebrow="Inside the numbers"
      title="MESH Statistics"
      description="Explore team performance, league leaders, and the record-setting games that define MESH Football."
      imageSrc={meshShield}
      imageAlt="MESH Football shield"
      accent="stats"
      size="compact"
    />
    <div className="stats-view-tabs">
      <button className={view === "teams" ? "active" : ""} onClick={() => setView("teams")}><BarChart3 size={16}/>Team Stats</button>
      <button className={view === "leaders" ? "active" : ""} onClick={() => setView("leaders")}><Medal size={16}/>League Leaders</button>
      <button className={view === "records" ? "active" : ""} onClick={() => setView("records")}><Trophy size={16}/>MESH Records</button>
    </div>
    <div className="stats-tier-tabs">{["NFL","FBS","FCS"].map(t => <button key={t} className={`${tier===t?"active":""} tier-${t.toLowerCase()}`} onClick={() => setTier(t)}>{t}</button>)}</div>
    <div className="stats-filters">
      <label><span>Season</span><select value={season} onChange={e=>setSeason(e.target.value)}><option value="all">All-Time</option>{raw.seasons.map(y=><option key={y}>{y}</option>)}</select></label>
      <label><span>Conference</span><select value={conference} onChange={e=>setConference(e.target.value)}><option value="all">All {tier}</option>{(CONFERENCES[tier]||[]).map(c=><option key={c}>{c}</option>)}</select></label>
      <label><span>Games</span><select value={scope} onChange={e=>setScope(e.target.value)}><option value="regular">Regular Season</option><option value="all">All Games</option></select></label>
    </div>
    {loading && <div className="stats-state">Loading MESH statistics…</div>}
    {error && <div className="stats-state error">{error}</div>}
    {!loading && !error && data.games.length === 0 && <div className="stats-state"><Trophy size={28}/><strong>No completed games yet</strong><span>Choose an earlier season or All-Time to explore MESH history.</span></div>}

    {!loading && data.games.length > 0 && view === "teams" && <>
      <section className="stats-summary"><div><span>Completed Games</span><strong>{data.games.length}</strong></div><div><span>Teams</span><strong>{teams.length}</strong></div><div><span>Leader PPG</span><strong>{fmt(r.bestPpg?.ppg)}</strong></div></section>
      <div className="stats-sort"><span>Rank by</span>{SORTS.map(([k,l])=><button key={k} className={sortKey===k?"active":""} onClick={()=>chooseSort(k)}>{l}{sortKey===k && <span className="stats-sort-arrow">{sortDirection === "desc" ? "↓" : "↑"}</span>}</button>)}</div>
      <section className="stats-table-wrap"><table className="stats-table"><thead><tr><th>#</th><th>Team</th><th>REC</th><th className={sortKey === "ppg" ? "stats-active-column" : ""}>PPG</th><th className={sortKey === "pf" ? "stats-active-column" : ""}>PF</th><th className={sortKey === "papg" ? "stats-active-column" : ""}>PA/G</th><th className={sortKey === "differentialPerGame" ? "stats-active-column" : ""}>+/-</th><th className={sortKey === "highScore" ? "stats-active-column" : ""}>HIGH</th><th className={sortKey === "currentWinStreak" ? "stats-active-column" : ""}>W STREAK</th></tr></thead><tbody>{teams.map((row,i)=><tr key={row.franchiseId}><td className="rank">{i+1}</td><td><TeamMark row={row}/></td><td>{row.record}</td><td><b>{fmt(row.ppg)}</b></td><td>{fmt(row.pf)}</td><td>{fmt(row.papg)}</td><td className={row.differentialPerGame>=0?"positive":"negative"}>{row.differentialPerGame>=0?"+":""}{fmt(row.differentialPerGame)}</td><td>{score(row.highScore)}</td><td>{row.currentWinStreak || "—"}</td></tr>)}</tbody></table></section>
    </>}

    {!loading && data.games.length > 0 && view === "leaders" && <>
      <div className="stats-section-heading"><span>TEAM PERFORMANCE</span><h2>League Leaders</h2><p>Aggregate leaders for the selected season, tier, conference and game scope.</p></div>
      <section className="stats-record-grid">
        <TeamLeaderCard title="Highest Average Score" icon={<Gauge size={16}/>} item={r.bestPpg} value={`${fmt(r.bestPpg?.ppg)} PPG`} detail={`${r.bestPpg?.games || 0} games`}/>
        <TeamLeaderCard title="Best Point Differential" icon={<BarChart3 size={16}/>} item={r.bestDiff} value={`${Number(r.bestDiff?.differentialPerGame || 0) >= 0 ? "+" : ""}${fmt(r.bestDiff?.differentialPerGame)} / game`} detail={`${fmt(r.bestDiff?.pf)} PF · ${fmt(r.bestDiff?.pa)} PA`}/>
        <TeamLeaderCard title="Active Win Streak" icon={<Flame size={16}/>} item={r.bestStreak} value={`${r.bestStreak?.currentWinStreak || 0} W`} detail={`Through ${r.bestStreak?.currentWinStreakSeason || "—"}`}/>
        <TeamLeaderCard title="Most Wins" icon={<Trophy size={16}/>} item={r.mostWins} value={`${r.mostWins?.wins || 0} W`} detail={r.mostWins?.record || "—"}/>
        <TeamLeaderCard title="Most Points Scored" icon={<Medal size={16}/>} item={r.mostPf} value={`${fmt(r.mostPf?.pf)} PF`} detail={`${r.mostPf?.games || 0} games`}/>
        <TeamLeaderCard title="Best Scoring Defense" icon={<Shield size={16}/>} item={r.bestDefense} value={`${fmt(r.bestDefense?.papg)} PA/G`} detail={`${fmt(r.bestDefense?.pa)} points allowed`}/>
      </section>
    </>}

    {!loading && data.games.length > 0 && view === "records" && <>
      <div className="stats-section-heading"><span>SINGLE-GAME RECORD BOOK</span><h2>{season === "all" ? "All-Time MESH Records" : `${season} MESH Records`}</h2><p>Individual game extremes from completed GAME_RESULTS. Conference filters always display the selected conference's participant.</p></div>
      <section className="stats-record-grid">
        <GameRecord title="Highest Score" icon={<Trophy size={16}/>} item={r.highScore} kind="high" conference={conference}/>
        <GameRecord title="Lowest Score" icon={<Gauge size={16}/>} item={r.lowScore} kind="low" conference={conference}/>
        <GameRecord title="Largest Margin" icon={<Swords size={16}/>} item={r.biggest} kind="margin" conference={conference}/>
        <GameRecord title="Closest Decision" icon={<Swords size={16}/>} item={r.closest} kind="closest" conference={conference}/>
        <GameRecord title="Highest-Scoring Game" icon={<Flame size={16}/>} item={r.highestCombined} kind="combined" conference={conference}/>
        <GameRecord title="Highest Score in a Loss" icon={<Medal size={16}/>} item={r.highestLosingScore} kind="losing" conference={conference}/>
      </section>
    </>}
  </div>;
}
