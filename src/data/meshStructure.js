export const meshTiers = {
  nfl: {
    id: "nfl",
    name: "NFL Tier",
    shortName: "NFL",
    teamCount: 32,
    promotionCount: 0,
    relegationCount: 4,

    leagues: [
      {
        id: "afc",
        name: "AFC",
        teamCount: 16,
        sleeperLeagueId: "",
        divisions: [
          { id: "afc-east", name: "AFC East" },
          { id: "afc-north", name: "AFC North" },
          { id: "afc-south", name: "AFC South" },
          { id: "afc-west", name: "AFC West" },
        ],
      },
      {
        id: "nfc",
        name: "NFC",
        teamCount: 16,
        sleeperLeagueId: "",
        divisions: [
          { id: "nfc-east", name: "NFC East" },
          { id: "nfc-north", name: "NFC North" },
          { id: "nfc-south", name: "NFC South" },
          { id: "nfc-west", name: "NFC West" },
        ],
      },
    ],

    standingsViews: [
      { id: "division", name: "Division Standings" },
      { id: "conference", name: "Conference Standings" },
      { id: "league", name: "League Standings" },
      { id: "playoffs", name: "Playoff Picture" },
    ],
  },

  fbs: {
    id: "fbs",
    name: "FBS Tier",
    shortName: "FBS",
    teamCount: 98,
    promotionCount: 4,
    relegationCount: 8,

    leagues: [
      { id: "acc", name: "ACC", teamCount: 14, sleeperLeagueId: "" },
      {
        id: "big-ten",
        name: "Big Ten",
        teamCount: 14,
        sleeperLeagueId: "",
      },
      {
        id: "big-12",
        name: "Big 12",
        teamCount: 14,
        sleeperLeagueId: "",
      },
      { id: "mac", name: "MAC", teamCount: 14, sleeperLeagueId: "" },
      {
        id: "mountain-west",
        name: "Mountain West",
        teamCount: 14,
        sleeperLeagueId: "",
      },
      { id: "sec", name: "SEC", teamCount: 14, sleeperLeagueId: "" },
      {
        id: "sun-belt",
        name: "Sun Belt",
        teamCount: 14,
        sleeperLeagueId: "",
      },
    ],

    standingsViews: [
      { id: "rankings", name: "Rankings" },
      { id: "acc", name: "ACC Standings" },
      { id: "big-ten", name: "Big Ten Standings" },
      { id: "big-12", name: "Big 12 Standings" },
      { id: "mac", name: "MAC Standings" },
      { id: "mountain-west", name: "Mountain West Standings" },
      { id: "sec", name: "SEC Standings" },
      { id: "sun-belt", name: "Sun Belt Standings" },
      { id: "playoffs", name: "Playoff Picture" },
    ],
  },

  fcs: {
    id: "fcs",
    name: "FCS Tier",
    shortName: "FCS",
    teamCount: 72,
    promotionCount: 8,
    relegationCount: 0,

    leagues: [
      {
        id: "big-sky",
        name: "Big Sky",
        teamCount: 12,
        sleeperLeagueId: "",
      },
      {
        id: "coastal",
        name: "Coastal",
        teamCount: 12,
        sleeperLeagueId: "",
      },
      {
        id: "ivy",
        name: "Ivy League",
        teamCount: 12,
        sleeperLeagueId: "",
      },
      {
        id: "missouri-valley",
        name: "Missouri Valley",
        teamCount: 12,
        sleeperLeagueId: "",
      },
      {
        id: "northeast",
        name: "Northeast",
        teamCount: 12,
        sleeperLeagueId: "",
      },
      {
        id: "southland",
        name: "Southland",
        teamCount: 12,
        sleeperLeagueId: "",
      },
    ],

    standingsViews: [
      { id: "rankings", name: "Rankings" },
      { id: "big-sky", name: "Big Sky Standings" },
      { id: "coastal", name: "Coastal Standings" },
      { id: "ivy", name: "Ivy League Standings" },
      {
        id: "missouri-valley",
        name: "Missouri Valley Standings",
      },
      { id: "northeast", name: "Northeast Standings" },
      { id: "southland", name: "Southland Standings" },
      { id: "playoffs", name: "Playoff Picture" },
    ],
  },
};

export const meshSummary = {
  tierCount: 3,
  sleeperLeagueCount: 15,
  teamCount: 202,
};