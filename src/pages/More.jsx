import { Link } from "react-router-dom";
import {
  BookOpen,
  BriefcaseBusiness,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  History,
  Star,
} from "lucide-react";

import "../styles/more.css";

const menuItems = [
  {
    name: "League Rules & Info",
    description: "Official MESH Football rules, format and league structure",
    path: "/rules",
    icon: BookOpen,
    label: "League",
    tone: "rules",
  },
  {
    name: "Sleeper Leagues",
    description: "Jump directly to all 15 MESH conference leagues",
    path: "/league-links",
    icon: ExternalLink,
    label: "League Links",
    tone: "sleeper",
  },
  {
    name: "Prestige",
    description: "Career franchise and coach prestige rankings",
    path: "/prestige",
    icon: Star,
    label: "Rankings",
    tone: "prestige",
  },
  {
    name: "Coach Carousel",
    description: "Track openings, coaching changes and past moves",
    path: "/coach-carousel",
    icon: BriefcaseBusiness,
    label: "Offseason",
    tone: "carousel",
  },
  {
    name: "Draft HQ",
    description: "Current draft order and complete rookie draft history",
    path: "/draft-hq",
    icon: ClipboardList,
    label: "Drafts",
    tone: "draft",
  },
  {
    name: "History",
    description: "Champions, records and past MESH seasons",
    path: "/history",
    icon: History,
    label: "Archives",
    tone: "history",
  },
];

function More() {
  return (
    <main className="page more-page">
      <header className="more-heading">
        <p className="eyebrow">MESH Football</p>
        <h1>More</h1>
        <p>League tools, offseason hubs, archives and everything beyond game day.</p>
      </header>

      <section className="more-link-grid" aria-label="More MESH tools">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              className={`more-link-card more-link-card-${item.tone}`}
              to={item.path}
              key={item.name}
            >
              <span className="more-card-accent" aria-hidden="true" />

              <div className="more-card-icon" aria-hidden="true">
                <Icon size={22} strokeWidth={2.15} />
              </div>

              <div className="more-card-copy">
                <span className="more-card-label">{item.label}</span>
                <strong>{item.name}</strong>
                <p>{item.description}</p>
              </div>

              <div className="more-card-arrow" aria-hidden="true">
                <ChevronRight size={19} strokeWidth={2.4} />
              </div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}

export default More;
