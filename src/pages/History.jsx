import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Archive, ChevronRight, Landmark, Shield, Trophy, Users } from "lucide-react";
import PageHeader from "../components/PageHeader";
import meshShield from "../assets/logos/mfl-shield.png";
import { getCareerStandingsData, getChampionsHistoryData } from "../services/historyService";
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

function MiniGame({ game, title }) {
  if (!game) return null;
  const winnerId = String(game.winnerId || "");
  return <article className="bowl-history-card">
    <div className="bowl-name"><Trophy size={15}/><strong>{title || game.bowlName || game.gameType || "Postseason"}</strong><span>Week {game.week}</span></div>
    <div className="bowl-matchup">
      <div className={winnerId === String(game.team1Id) ? "winner" : ""}>{game.team1Logo && <img src={game.team1Logo} alt=""/>}<span>{game.team1Team}</span><b>{game.team1Score ?? "—"}</b></div>
      <div className={winnerId === String(game.team2Id) ? "winner" : ""}>{game.team2Logo && <img src={game.team2Logo} alt=""/>}<span>{game.team2Team}</span><b>{game.team2Score ?? "—"}</b></div>
    </div>
  </article>;
}

function RecordBook({ tier, conference, rows }) {
  if (!rows?.length) return <div className="champions-empty-card">No historical records yet.</div>;
  return <div className="conference-record-wrap"><table className="conference-record-table"><thead><tr><th>Team</th>
    {tier === "FBS" && <><th>NC</th><th>CONF APP</th><th>CONF TITLES</th><th>CFP APP</th><th>CFP REC</th><th>BOWL APP</th><th>BOWL REC</th></>}
    {tier === "FCS" && <><th>NC</th><th>CONF TITLES</th><th>PLAYOFF APP</th><th>PLAYOFF REC</th></>}
    {tier === "NFL" && <><th>DIV TITLES</th><th>CONF TITLES</th><th>SUPER BOWLS</th><th>PLAYOFF APP</th><th>PLAYOFF REC</th></>}
  </tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><Link className="record-team" to={`/league/franchises/${row.id}`}>{row.logo ? <img src={row.logo} alt=""/> : <Shield size={24}/>}<span>{row.name}</span></Link></td>
    {tier === "FBS" && <><td>{row.nationalTitles}</td><td>{row.conferenceChampionshipApps}</td><td>{row.conferenceTitles}</td><td>{row.cfpApps}</td><td>{row.cfpWins}-{row.cfpLosses}</td><td>{row.bowlApps}</td><td>{row.bowlWins}-{row.bowlLosses}</td></>}
    {tier === "FCS" && <><td>{row.nationalTitles}</td><td>{row.conferenceTitles}</td><td>{row.playoffApps}</td><td>{row.playoffWins}-{row.playoffLosses}</td></>}
    {tier === "NFL" && <><td>{row.divisionTitles}</td><td>{row.conferenceTitles}</td><td>{row.superBowls}</td><td>{row.playoffApps}</td><td>{row.playoffWins}-{row.playoffLosses}</td></>}
  </tr>)}</tbody></table></div>;
}

export default function History() {
  const [section, setSection] = useState("career");
  const [mode, setMode] = useState("coaches");
  const [population, setPopulation] = useState("current");
  const [tier, setTier] = useState("FBS");
  const [conference, setConference] = useState("ACC");
  const [sortKey, setSortKey] = useState("conferenceWins");
  const [sortDirection, setSortDirection] = useState("desc");
  const [data, setData] = useState({ coaches: [], franchises: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [championsData, setChampionsData] = useState({ seasons: [], bySeason: {} });
  const [championsLoading, setChampionsLoading] = useState(false);
  const [championsError, setChampionsError] = useState("");
  const [championSeason, setChampionSeason] = useState(null);
  const [championTier, setChampionTier] = useState("ALL");
  const [championConference, setChampionConference] = useState("");
  const [championView, setChampionView] = useState("season");

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
      .then((result) => { if (!live) return; setChampionsData(result); setChampionSeason(result.seasons[0] || null); })
      .catch((err) => live && setChampionsError(err.message || "Champions history unavailable."))
      .finally(() => live && setChampionsLoading(false));
    return () => { live = false; };
  }, [section, championsData.seasons.length]);

  const championSeasonData = championSeason ? championsData.bySeason[championSeason] : null;
  const championConferences = championTier === "FBS" || championTier === "FCS" ? CONFERENCES[championTier] || [] : [];
  const selectedChampionConference = championConference || championConferences[0] || "";
  const conferenceDetail = championSeasonData?.conferenceData?.[championTier]?.[selectedChampionConference.toLowerCase() === "caa" ? "coastal" : selectedChampionConference.toLowerCase() === "mvc" ? "missouri valley" : selectedChampionConference.toLowerCase() === "nec" ? "northeast" : selectedChampionConference.toLowerCase()] || null;
  const recordBook = championsData.recordBooks?.[championTier]?.[selectedChampionConference.toLowerCase() === "caa" ? "coastal" : selectedChampionConference.toLowerCase() === "mvc" ? "missouri valley" : selectedChampionConference.toLowerCase() === "nec" ? "northeast" : selectedChampionConference.toLowerCase()] || [];

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

  return (
    <main className={`history-page history-${tier.toLowerCase()}`}>
      <PageHeader eyebrow="MESH Archives" title="History" description="Explore the people, franchises and seasons that built MESH Football." imageSrc={meshShield} imageAlt="MESH Football shield" accent="league" size="compact" />

      <div className="history-section-tabs">
        <button className={section === "career" ? "active" : ""} onClick={() => setSection("career")}><Landmark size={17}/>Career Standings</button>
        <button className={section === "champions" ? "active" : ""} onClick={() => setSection("champions")}><Trophy size={17}/>Champions</button>
        <button className={section === "archive" ? "active" : ""} onClick={() => setSection("archive")}><Archive size={17}/>Season Archive</button>
      </div>

      {section === "career" && <>
        <section className="history-intro">
          <span>CAREER LEADERBOARDS</span>
          <h2>{historyLabel}</h2>
          <p>{conference === "all" ? `Rank the entire ${tier} tier by conference and overall tier career performance.` : `Compare ${conference} success with complete ${tier} career performance.`}</p>
        </section>

        <div className="history-mode-tabs">
          <button className={mode === "coaches" ? "active" : ""} onClick={() => setMode("coaches")}><Users size={16}/>Coaches</button>
          <button className={mode === "franchises" ? "active" : ""} onClick={() => setMode("franchises")}><Shield size={16}/>Franchises</button>
        </div>

        <div className="history-filters">
          <label><span>Tier</span><select value={tier} onChange={(e) => setTier(e.target.value)}>{["NFL","FBS","FCS"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Conference</span><select value={conference} onChange={(e) => setConference(e.target.value)}><option value="all">All {tier}</option>{(CONFERENCES[tier] || []).map((item) => <option key={item}>{item}</option>)}</select></label>
          {mode === "coaches" && <label><span>Coaches</span><select value={population} onChange={(e) => setPopulation(e.target.value)}><option value="current">Current Coaches</option><option value="all">All-Time Coaches</option></select></label>}
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
        <section className="history-intro champions-intro"><span>MESH RECORD BOOK</span><h2>Champions</h2><p>Start with the champions, then drill into each tier and conference for the complete postseason story.</p></section>
        <div className="champions-toolbar">
          <div className="champions-season-tabs">{championsData.seasons.map((year) => <button key={year} className={Number(championSeason) === year ? "active" : ""} onClick={() => setChampionSeason(year)}>{year}</button>)}</div>
          <div className="champions-tier-tabs">{["ALL","NFL","FBS","FCS"].map((item) => <button key={item} className={championTier === item ? "active" : ""} onClick={() => { setChampionTier(item); setChampionConference(""); setChampionView("season"); }}>{item === "ALL" ? "All MESH" : item}</button>)}</div>
        </div>
        {championsLoading && <div className="history-state">Loading MESH champions…</div>}
        {championsError && <div className="history-state error">{championsError}</div>}
        {!championsLoading && !championsError && championSeasonData && <>
          <div className="champions-title-row"><span>{championSeason} SEASON</span><h3>{championTier === "ALL" ? "MESH Champions" : `${championTier} Champion`}</h3></div>
          <div className={`champion-hero-grid ${championTier !== "ALL" ? "single" : ""}`}>{championSeasonData.champions.filter((item) => championTier === "ALL" || item.tier === championTier).map((item) => <ChampionCard key={item.tier} item={item}/>)}</div>

          {championTier === "NFL" && <>
            <div className="champions-title-row secondary"><span>NFL POSTSEASON</span><h3>Conference Champions</h3></div>
            <div className="conference-champ-grid">{championSeasonData.nflConferenceChampions.map((item) => <article key={`${item.conference}-${item.id}`} className="conference-champ-card conference-nfl"><div className="conference-champ-label"><span>NFL</span><strong>{item.conference || "Conference"}</strong></div><Link to={`/league/franchises/${item.id}`} className="conference-champ-team">{item.logo ? <img src={item.logo} alt=""/> : <Shield size={34}/>}<div><b>{item.name}</b><small>Conference Champion</small></div></Link></article>)}</div>
            <div className="champions-title-row secondary"><span>REGULAR SEASON</span><h3>Division Champions</h3></div>
            <div className="conference-champ-grid">{championSeasonData.nflDivisionChampions.map((item) => <article key={`${item.division}-${item.id}`} className="conference-champ-card conference-nfl"><div className="conference-champ-label"><span>{item.conference}</span><strong>{item.division}</strong></div><Link to={`/league/franchises/${item.id}`} className="conference-champ-team">{item.logo ? <img src={item.logo} alt=""/> : <Shield size={34}/>}<div><b>{item.name}</b><small>Division Champion</small></div></Link></article>)}</div>
          </>}

          {(championTier === "FBS" || championTier === "FCS") && <>
            <div className="champions-title-row secondary"><span>{championTier} CONFERENCES</span><h3>Conference Drilldown</h3></div>
            <div className="champions-conference-tabs">{championConferences.map((item) => <button key={item} className={selectedChampionConference === item ? "active" : ""} onClick={() => { setChampionConference(item); setChampionView("season"); }}>{item}</button>)}</div>
            <div className="conference-view-tabs"><button className={championView === "season" ? "active" : ""} onClick={() => setChampionView("season")}>{championSeason} Season</button><button className={championView === "history" ? "active" : ""} onClick={() => setChampionView("history")}>Conference History</button></div>

            {championView === "season" && conferenceDetail && <div className="conference-drilldown">
              <div className="champions-title-row secondary"><span>{selectedChampionConference.toUpperCase()}</span><h3>Conference Champion</h3></div>
              {conferenceDetail.champion ? <article className={`conference-champion-feature conference-${championTier.toLowerCase()}`}><Link to={`/league/franchises/${conferenceDetail.champion.id}`}>{conferenceDetail.champion.logo ? <img src={conferenceDetail.champion.logo} alt=""/> : <Shield size={50}/>}<div><span>{championSeason} {selectedChampionConference} Champion</span><strong>{conferenceDetail.champion.name}</strong><small>{conferenceDetail.champion.coach ? `Coach ${conferenceDetail.champion.coach}` : ""}</small></div></Link>{conferenceDetail.championshipGame && <div className="conference-title-result"><b>{conferenceDetail.champion.score ?? "—"} – {conferenceDetail.champion.opponentScore ?? "—"}</b><span>def. {conferenceDetail.champion.opponent}</span></div>}</article> : <div className="champions-empty-card">Conference champion not recorded for this season.</div>}

              <div className="champions-title-row secondary"><span>{championTier === "FBS" ? "COLLEGE FOOTBALL PLAYOFF" : "FCS PLAYOFFS"}</span><h3>{championTier === "FBS" ? "CFP Qualifiers" : "Playoff Qualifiers"}</h3></div>
              <div className="cfp-history-grid">{conferenceDetail.qualifiers.length ? conferenceDetail.qualifiers.map((team) => <Link key={team.id} to={`/league/franchises/${team.id}`} className="cfp-history-team"><span className="cfp-seed">{team.seed ? `#${team.seed}` : championTier === "FBS" ? "CFP" : "PO"}</span>{team.logo ? <img src={team.logo} alt=""/> : <Shield size={30}/>}<div><b>{team.name}</b><small>{team.conference}</small></div></Link>) : <div className="champions-empty-card">No playoff qualifiers recorded.</div>}</div>
              {conferenceDetail.playoffGames.length > 0 && <div className="postseason-game-grid">{conferenceDetail.playoffGames.map((game) => <MiniGame key={game.gameId} game={game} title={game.bowlName || game.gameType}/>)}</div>}

              {championTier === "FBS" && <><div className="champions-title-row secondary"><span>{selectedChampionConference.toUpperCase()} POSTSEASON</span><h3>Bowl Games</h3></div><div className="bowl-history-list">{conferenceDetail.bowls.length ? conferenceDetail.bowls.map((game) => <MiniGame key={game.gameId} game={game} title={game.bowlName}/>) : <div className="champions-empty-card">No non-CFP bowl games recorded for this conference.</div>}</div></>}
            </div>}

            {championView === "history" && <div className="conference-history-book"><div className="champions-title-row secondary"><span>ALL-TIME RECORD BOOK</span><h3>{selectedChampionConference} Conference History</h3></div><p className="record-book-note">Career postseason accomplishments for the permanent MESH franchises currently assigned to the {selectedChampionConference}.</p><RecordBook tier={championTier} conference={selectedChampionConference} rows={recordBook}/></div>}
          </>}
        </>}
      </section>}

      {section === "archive" && <section className="history-coming"><Archive size={32}/><span>PHASE 8B</span><h2>Season Archive</h2><p>Season-by-season champions, conference results and postseason paths will live here.</p><Link to="/standings?season=2025">Open 2025 Final Standings <ChevronRight size={16}/></Link></section>}
    </main>
  );
}
