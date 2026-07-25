import { Routes, Route } from "react-router-dom";

import AppShell from "./components/AppShell";

import Home from "./pages/Home";
import Scores from "./pages/Scores";
import Standings from "./pages/Standings";
import League from "./pages/League";
import Stats from "./pages/Stats";
import More from "./pages/More";
import History from "./pages/History";

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scores" element={<Scores />} />
        <Route path="/standings" element={<Standings />} />

        <Route path="/league" element={<League />} />

        <Route path="/stats" element={<Stats />} />
        <Route path="/more" element={<More />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </AppShell>
  );
}

export default App;