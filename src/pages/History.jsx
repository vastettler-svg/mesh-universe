const historySections = [
  {
    name: "Champions",
    description: "View MESH champions from every season.",
  },
  {
    name: "Playoff Archives",
    description: "Browse past NFL and college playoff brackets.",
  },
  {
    name: "Promotion & Relegation",
    description: "See every tier movement in MESH history.",
  },
  {
    name: "Coach History",
    description: "Track coaching changes across every franchise.",
  },
  {
    name: "Team History",
    description: "Explore each franchise's complete timeline.",
  },
  {
    name: "Trophy Rooms",
    description: "View championships, awards and achievements.",
  },
  {
    name: "Prestige History",
    description: "See historical prestige rankings and movement.",
  },
  {
    name: "League Records",
    description: "Browse MESH single-game, season and career records.",
  },
  {
    name: "Hall of Fame",
    description: "Celebrate the greatest teams and coaches in MESH.",
  },
];

function History() {
  return (
    <main className="page">
      <div className="page-heading">
        <p className="eyebrow">MESH Archives</p>
        <h1>History</h1>
        <p>Explore the complete history of MESH Football.</p>
      </div>

      <div className="menu-grid">
        {historySections.map((section) => (
          <button type="button" className="menu-card" key={section.name}>
            <div>
              <strong>{section.name}</strong>
              <p>{section.description}</p>
            </div>

            <span aria-hidden="true">›</span>
          </button>
        ))}
      </div>
    </main>
  );
}

export default History;