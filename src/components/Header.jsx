import { Bell } from "lucide-react";
import meshLogo from "../assets/logos/mfl-shield.png";

function Header() {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-brand">
          <img
            src={meshLogo}
            alt="MESH Football"
            className="app-brand-logo"
          />

          <div className="app-brand-text">
            <span className="app-brand-name">MESH FOOTBALL</span>
            <span className="app-brand-tagline">
              Compete. Dominate. Legacy.
            </span>
          </div>
        </div>

        <button
          type="button"
          className="header-icon-button"
          aria-label="Notifications"
        >
          <Bell size={22} strokeWidth={2} />
          <span className="notification-dot" />
        </button>
      </div>
    </header>
  );
}

export default Header;