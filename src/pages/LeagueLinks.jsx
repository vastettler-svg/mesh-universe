import { ExternalLink } from "lucide-react";

import { MESH_PATCHES } from "../assets/logos/patches";
import "../styles/leagueLinks.css";

const leagueGroups = [
  {
    tier: "NFL",
    tierClass: "nfl",
    description: "MESH Tier 1 • AFC & NFC",
    leagues: [
      {
        name: "AFC",
        patch: MESH_PATCHES.NFL.AFC,
        url: "https://sleeper.com/i/LVowRLNB6wx7m",
        leagueId: "1347708428239261696",
      },
      {
        name: "NFC",
        patch: MESH_PATCHES.NFL.NFC,
        url: "http://sleeper.com/i/0NPVjYBaPgP9X",
        leagueId: "1347663469939269632",
      },
    ],
  },
  {
    tier: "FBS",
    tierClass: "fbs",
    description: "MESH Tier 2 • Seven FBS Conferences",
    leagues: [
      {
        name: "ACC",
        patch: MESH_PATCHES.FBS.ACC,
        url: "https://sleeper.com/i/zExoJdkWYAGJO",
        leagueId: "1352720458385985536",
      },
      {
        name: "Big Ten",
        patch: MESH_PATCHES.FBS["Big Ten"],
        url: "https://sleeper.com/i/V9x3eWOxzjmjO",
        leagueId: "1352734510784995328",
      },
      {
        name: "Big 12",
        patch: MESH_PATCHES.FBS["Big 12"],
        url: "https://sleeper.com/i/m7on2VjEM2J6M",
        leagueId: "1355978627824513024",
      },
      {
        name: "MAC",
        patch: MESH_PATCHES.FBS.MAC,
        url: "https://sleeper.com/i/0NPDmYAB2ZKd2",
        leagueId: "1355980000871858176",
      },
      {
        name: "Mountain West",
        patch: MESH_PATCHES.FBS["Mountain West"],
        url: "https://sleeper.com/i/LVoxez0M9R60W",
        leagueId: "1355980410814763008",
      },
      {
        name: "SEC",
        patch: MESH_PATCHES.FBS.SEC,
        url: "https://sleeper.com/i/JKo5oQqA59zkW",
        leagueId: "1353151099783106560",
      },
      {
        name: "Sun Belt",
        patch: MESH_PATCHES.FBS["Sun Belt"],
        url: "https://sleeper.com/i/LVoxeY0eW8RGb",
        leagueId: "1355981047879172096",
      },
    ],
  },
  {
    tier: "FCS",
    tierClass: "fcs",
    description: "MESH Tier 3 • Six FCS Conferences",
    leagues: [
      {
        name: "Big Sky",
        patch: MESH_PATCHES.FCS["Big Sky"],
        url: "https://sleeper.com/i/QB84NPmMPoJ7P",
        leagueId: "1360162081319440384",
      },
      {
        name: "Coastal Athletic Association",
        shortName: "CAA",
        patch: MESH_PATCHES.FCS.CAA,
        url: "http://sleeper.com/i/LVDW83ZLPVVOW",
        leagueId: "1360159391201898496",
      },
      {
        name: "Ivy League",
        shortName: "Ivy",
        patch: MESH_PATCHES.FCS.Ivy,
        url: "http://sleeper.com/i/kMgzdbm9Q20LG",
        leagueId: "1360162477605670912",
      },
      {
        name: "Missouri Valley",
        shortName: "MVC",
        patch: MESH_PATCHES.FCS.MVC,
        url: "http://sleeper.com/i/LVDW8QBPE62jw",
        leagueId: "1360161331835076608",
      },
      {
        name: "Northeast",
        shortName: "NEC",
        patch: MESH_PATCHES.FCS.NEC,
        url: "http://sleeper.com/i/QB84N7ME4wOE3",
        leagueId: "1360159919612887040",
      },
      {
        name: "Southland",
        patch: MESH_PATCHES.FCS.Southland,
        url: "http://sleeper.com/i/Y214elmKxw1N4",
        leagueId: "1360160311226675200",
      },
    ],
  },
];

function LeagueCard({ league, tierClass }) {
  return (
    <a
      className={`league-link-card league-link-card-${tierClass}`}
      href={league.url}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open ${league.name} on Sleeper`}
    >
      <div className="league-link-patch-wrap">
        <img
          className="league-link-patch"
          src={league.patch}
          alt={`${league.name} conference patch`}
        />
      </div>

      <div className="league-link-copy">
        <span>{league.shortName || league.name}</span>
        <strong>{league.name}</strong>
        <small>Open league on Sleeper</small>
      </div>

      <ExternalLink size={17} className="league-link-open-icon" />
    </a>
  );
}

function LeagueLinks() {
  return (
    <main className="league-links-page">
      <section className="league-links-hero">
        <div>
          <p className="eyebrow">MESH Football Network</p>
          <h1>Sleeper Leagues</h1>
          <p>
            Visit any of the 15 MESH leagues to follow conference activity,
            standings, matchups, and league chat directly in Sleeper.
          </p>
        </div>

        <div className="league-links-hero-count" aria-label="15 Sleeper leagues">
          <strong>15</strong>
          <span>LEAGUES</span>
        </div>
      </section>

      {leagueGroups.map((group) => (
        <section className="league-links-section" key={group.tier}>
          <div className="league-links-section-heading">
            <div className={`league-links-tier-mark league-links-tier-mark-${group.tierClass}`}>
              <img
                src={MESH_PATCHES.tier[group.tier]}
                alt={`${group.tier} tier patch`}
              />
            </div>

            <div>
              <span>{group.description}</span>
              <h2>{group.tier} Leagues</h2>
            </div>
          </div>

          <div className={`league-links-grid league-links-grid-${group.tierClass}`}>
            {group.leagues.map((league) => (
              <LeagueCard
                key={league.leagueId}
                league={league}
                tierClass={group.tierClass}
              />
            ))}
          </div>
        </section>
      ))}

      <div className="league-links-note">
        <ExternalLink size={14} />
        Links open the selected league directly in Sleeper.
      </div>
    </main>
  );
}

export default LeagueLinks;
