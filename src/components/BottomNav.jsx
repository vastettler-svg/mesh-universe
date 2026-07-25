import { NavLink } from "react-router-dom";
import {
  House,
  CalendarDays,
  Trophy,
  Landmark,
  ChartNoAxesColumnIncreasing,
  Menu,
} from "lucide-react";

const navigationItems = [
  {
    label: "Home",
    path: "/",
    icon: House,
    end: true,
  },
  {
    label: "Scores",
    path: "/scores",
    icon: CalendarDays,
  },
  {
    label: "Standings",
    path: "/standings",
    icon: Trophy,
  },
  {
    label: "League",
    path: "/league",
    icon: Landmark,
  },
  {
    label: "Stats",
    path: "/stats",
    icon: ChartNoAxesColumnIncreasing,
  },
  {
    label: "More",
    path: "/more",
    icon: Menu,
  },
];

function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      <div className="bottom-nav-inner">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `bottom-nav-link${isActive ? " active" : ""}`
              }
            >
              <span className="bottom-nav-icon">
                <Icon size={22} strokeWidth={2.1} />
              </span>

              <span className="bottom-nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;