import { Routes, Route } from "react-router-dom";

import AppShell from "./components/AppShell";

import Home from "./pages/Home";
import Scores from "./pages/Scores";
import Standings from "./pages/Standings";
import League from "./pages/League";
import Stats from "./pages/Stats";
import More from "./pages/More";
import History from "./pages/History";
import GameCenter from "./pages/GameCenter";
import RulesInfo from "./pages/RulesInfo";
import LeagueLinks from "./pages/LeagueLinks";
import FranchiseDirectory from "./pages/FranchiseDirectory";
import FranchiseProfile from "./pages/FranchiseProfile";
import CoachDirectory from "./pages/CoachDirectory";
import CoachProfile from "./pages/CoachProfile";

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scores" element={<Scores />} />
        <Route path="/scores/:gameId" element={<GameCenter />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/league" element={<League />} />
        <Route path="/league/franchises" element={<FranchiseDirectory />} />
        <Route path="/league/franchises/:franchiseId" element={<FranchiseProfile />} />
        <Route path="/league/coaches" element={<CoachDirectory />} />
        <Route path="/league/coaches/:coachId" element={<CoachProfile />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/more" element={<More />} />
        <Route path="/history" element={<History />} />
        <Route path="/rules" element={<RulesInfo />} />
        <Route path="/league-links" element={<LeagueLinks />} />
      </Routes>
    </AppShell>
  );
}

export default App;
