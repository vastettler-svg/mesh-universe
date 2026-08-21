// MESH team-logo overrides for dark backgrounds.
import logo0 from "./new-york-jets.png";
import logo1 from "./new-york-giants.png";
import logo2 from "./los-angeles-rams.png";
import logo3 from "./virginia-cavaliers.png";
import logo4 from "./california-golden-bears.png";
import logo5 from "./michigan-state-spartans.png";
import logo6 from "./ohio-state-buckeyes.png";
import logo7 from "./penn-state-nittany-lions.png";
import logo8 from "./iowa-hawkeyes.png";
import logo9 from "./kansas-state-wildcats.png";
import logo10 from "./west-virginia-mountaineers.png";
import logo11 from "./wake-forest-demon-deacons.png";
import logo12 from "./utah-state-aggies.png";
import logo13 from "./air-force-falcons.png";
import logo14 from "./nevada-wolf-pack.png";
import logo15 from "./montana-grizzlies.png";
import logo16 from "./northern-arizona-lumberjacks.png";
import logo17 from "./uc-davis-aggies.png";
import logo18 from "./duquesne-dukes.png";

const TEAM_LOGO_OVERRIDES = {
  'new york jets': logo0,
  'jets': logo0,
  'new york giants': logo1,
  'giants': logo1,
  'los angeles rams': logo2,
  'la rams': logo2,
  'rams': logo2,
  'virginia cavaliers': logo3,
  'virginia': logo3,
  'california golden bears': logo4,
  'cal golden bears': logo4,
  'california': logo4,
  'cal': logo4,
  'michigan state spartans': logo5,
  'michigan state': logo5,
  'ohio state buckeyes': logo6,
  'ohio state': logo6,
  'penn state nittany lions': logo7,
  'penn state': logo7,
  'iowa hawkeyes': logo8,
  'iowa': logo8,
  'kansas state wildcats': logo9,
  'kansas state': logo9,
  'west virginia mountaineers': logo10,
  'west virginia': logo10,
  'wake forest demon deacons': logo11,
  'wake forest': logo11,
  'utah state aggies': logo12,
  'utah state': logo12,
  'air force falcons': logo13,
  'air force': logo13,
  'nevada wolf pack': logo14,
  'nevada wolfpack': logo14,
  'nevada': logo14,
  'montana grizzlies': logo15,
  'montana': logo15,
  'northern arizona lumberjacks': logo16,
  'northern arizona': logo16,
  'nau': logo16,
  'uc davis aggies': logo17,
  'uc davis': logo17,
  'duquesne dukes': logo18,
  'duquesne': logo18,
};

function normalizeTeamName(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getTeamLogoOverride(teamName) {
  return TEAM_LOGO_OVERRIDES[normalizeTeamName(teamName)] ?? "";
}

export { TEAM_LOGO_OVERRIDES };
