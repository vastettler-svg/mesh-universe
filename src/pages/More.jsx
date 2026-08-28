import { Link } from "react-router-dom";

const menuItems = [
  {
    name: "League Rules & Info",
    description: "Official MESH Football rules and league structure",
    path: "/rules",
  },
  {
    name: "Sleeper Leagues",
    description: "Open all 15 MESH conference leagues",
    path: "/league-links",
  },
  {
    name: "Prestige",
    description: "Career franchise and coach prestige rankings",
    path: "/prestige",
  },
  {
    name: "Coach Carousel",
    description: "Track coaching changes across MESH",
  },
  {
    name: "Draft HQ",
    description: "Draft order, picks and preparation",
  },
  {
    name: "History",
    description: "Champions, records and past seasons",
    path: "/history",
  },
];

function More() {
  return (
    <main className="page">
      <div className="page-heading">
        <p className="eyebrow">MESH Football</p>
        <h1>More</h1>
        <p>Explore league tools, archives and additional MESH features.</p>
      </div>

      <div className="menu-grid">
        {menuItems.map((item) =>
          item.path ? (
            <Link className="menu-card" to={item.path} key={item.name}>
              <div>
                <strong>{item.name}</strong>
                <p>{item.description}</p>
              </div>
              <span aria-hidden="true">›</span>
            </Link>
          ) : (
            <button type="button" className="menu-card" key={item.name}>
              <div>
                <strong>{item.name}</strong>
                <p>{item.description}</p>
              </div>
              <span aria-hidden="true">›</span>
            </button>
          ),
        )}
      </div>
    </main>
  );
}

export default More;
