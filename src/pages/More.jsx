import { Link } from "react-router-dom";

const internalLinks = [
  {
    name: "History",
    description: "Archives, champions, records and trophy rooms",
    path: "/history",
  },
];

const futureSections = [
  {
    name: "Draft HQ",
    description: "Draft orders, results and archived drafts",
  },
  {
    name: "Coach Carousel",
    description: "Coaching changes and available franchises",
  },
  {
    name: "Prestige",
    description: "Current and historical prestige rankings",
  },
  {
    name: "Trophy Rooms",
    description: "Team championships, awards and achievements",
  },
  {
    name: "League Rules & Info",
    description: "Official MESH Football rules and league structure",
  },
  {
    name: "League Links",
    description: "Open each of the 15 individual Sleeper leagues",
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
        {internalLinks.map((item) => (
          <Link className="menu-card" to={item.path} key={item.name}>
            <div>
              <strong>{item.name}</strong>
              <p>{item.description}</p>
            </div>

            <span aria-hidden="true">›</span>
          </Link>
        ))}

        {futureSections.map((item) => (
          <button type="button" className="menu-card" key={item.name}>
            <div>
              <strong>{item.name}</strong>
              <p>{item.description}</p>
            </div>

            <span aria-hidden="true">›</span>
          </button>
        ))}
      </div>
    </main>
  );
}

export default More;