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

      </div>
    </header>
  );
}

export default Header;