import { Link } from "react-router-dom";
import {
  ArrowRight,
  History,
  Shield,
  Trophy,
  UserRound,
} from "lucide-react";

import PageHeader from "../components/PageHeader";
import meshShield from "../assets/logos/mfl-shield.png";

import "../styles/league.css";

const leagueSections = [
  {
    title: "Franchises",
    description:
      "Explore all 202 permanent franchise histories across the NFL, FBS, and FCS tiers.",
    path: "/league/franchises",
    icon: Shield,
    type: "franchises",
    stats: [
      {
        label: "NFL",
        value: "32",
      },
      {
        label: "FBS",
        value: "98",
      },
      {
        label: "FCS",
        value: "72",
      },
    ],
    features: [
      "Season history",
      "Trophy vault",
      "Coaching history",
      "Prestige and records",
    ],
  },
  {
    title: "Coaches",
    description:
      "Follow every coach’s career across franchises, tiers, seasons, and championship runs.",
    path: "/league/coaches",
    icon: UserRound,
    type: "coaches",
    stats: [
      {
        label: "Careers",
        value: "All",
      },
      {
        label: "Teams",
        value: "Linked",
      },
      {
        label: "History",
        value: "Full",
      },
    ],
    features: [
      "Career timeline",
      "Teams coached",
      "Trophy vault",
      "Career records",
    ],
  },
];

const leagueHighlights = [
  {
    icon: History,
    title: "Connected histories",
    description:
      "Franchises retain their complete histories while coaches build careers across multiple teams.",
  },
  {
    icon: Trophy,
    title: "Two trophy perspectives",
    description:
      "The same honor appears in both the winning franchise’s vault and the coach’s career vault.",
  },
];

function LeagueSectionCard({ section }) {
  const SectionIcon = section.icon;

  return (
    <Link
      to={section.path}
      className={`league-section-card league-section-card-${section.type}`}
    >
      <div className="league-section-card-top">
        <div
          className={`league-section-icon league-section-icon-${section.type}`}
        >
          <SectionIcon size={30} strokeWidth={1.9} />
        </div>

        <span className="league-section-arrow" aria-hidden="true">
          <ArrowRight size={21} />
        </span>
      </div>

      <div className="league-section-copy">
        <span className="league-card-eyebrow">Explore MESH</span>

        <h2>{section.title}</h2>
        <p>{section.description}</p>
      </div>

      <div className="league-card-stats">
        {section.stats.map((stat) => (
          <div className="league-card-stat" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="league-card-features">
        {section.features.map((feature) => (
          <span key={feature}>{feature}</span>
        ))}
      </div>
    </Link>
  );
}

function League() {
  return (
    <main className="league-page">
      <PageHeader
        eyebrow="The history of MESH"
        title="League"
        description="Explore every franchise and coaching career across the complete history of MESH Football."
        imageSrc={meshShield}
        imageAlt="MESH Football shield"
        accent="league"
        size="medium"
      />

      <section className="league-section">
        <div className="league-section-heading">
          <div>
            <span>Choose a directory</span>
            <h2>Explore MESH</h2>
          </div>
        </div>

        <div className="league-sections-grid">
          {leagueSections.map((section) => (
            <LeagueSectionCard
              key={section.title}
              section={section}
            />
          ))}
        </div>
      </section>

      <section className="league-section">
        <div className="league-section-heading">
          <div>
            <span>Built for long-term history</span>
            <h2>One Connected League</h2>
          </div>
        </div>

        <div className="league-highlights-grid">
          {leagueHighlights.map((highlight) => {
            const HighlightIcon = highlight.icon;

            return (
              <article
                className="league-highlight-card"
                key={highlight.title}
              >
                <div className="league-highlight-icon">
                  <HighlightIcon size={21} />
                </div>

                <div>
                  <h3>{highlight.title}</h3>
                  <p>{highlight.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default League;