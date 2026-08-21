const TEAM_DATA_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRwZdqNhyvQxRhmmZu9jzUdFnzB6ZFnh7gYe2bgN6qwPl9SGwPf9dYyrhLk8_dFONmrL9Ibi3iXYEnc/pub?gid=1513820672&single=true&output=csv";

const COACH_DATA_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRwZdqNhyvQxRhmmZu9jzUdFnzB6ZFnh7gYe2bgN6qwPl9SGwPf9dYyrhLk8_dFONmrL9Ibi3iXYEnc/pub?gid=2054535278&single=true&output=csv";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"' && insideQuotes && nextCharacter === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === "," && !insideQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if (
      (character === "\n" || character === "\r") &&
      !insideQuotes
    ) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      row.push(value);

      if (row.some((cell) => String(cell).trim() !== "")) {
        rows.push(row);
      }

      row = [];
      value = "";
      continue;
    }

    value += character;
  }

  row.push(value);

  if (row.some((cell) => String(cell).trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

function columnIndex(columnLetters) {
  return String(columnLetters)
    .toUpperCase()
    .split("")
    .reduce(
      (total, character) =>
        total * 26 + (character.charCodeAt(0) - 64),
      0,
    ) - 1;
}

function numericValue(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(number) ? number : null;
}

export async function getFranchisePrestigeLeaders() {
  const response = await fetch(TEAM_DATA_CSV_URL, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(
      `Franchise prestige request failed: ${response.status} ${response.statusText}`,
    );
  }

  const matrix = parseCsv(await response.text());

  const nameIndex = columnIndex("DP");
  const pointsIndex = columnIndex("DQ");
  const tierIndex = columnIndex("DR");

  const leaders = {
    NFL: [],
    FBS: [],
    FCS: [],
  };

  matrix.slice(1).forEach((row) => {
    const name = String(row[nameIndex] ?? "").trim();
    const points = numericValue(row[pointsIndex]);
    const tier = String(row[tierIndex] ?? "").trim().toUpperCase();

    if (!name || points === null || !leaders[tier]) {
      return;
    }

    leaders[tier].push({ name, points });
  });

  Object.keys(leaders).forEach((tier) => {
    leaders[tier] = leaders[tier]
      .sort((first, second) => {
        const pointsDifference =
          Number(second.points) - Number(first.points);

        if (pointsDifference !== 0) {
          return pointsDifference;
        }

        return first.name.localeCompare(second.name);
      })
      .slice(0, 3);
  });

  return leaders;
}


export async function getCoachPrestigeLeaders() {
  const response = await fetch(COACH_DATA_CSV_URL, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(
      `Coach prestige request failed: ${response.status} ${response.statusText}`,
    );
  }

  const matrix = parseCsv(await response.text());

  const nameIndex = columnIndex("DS");
  const pointsIndex = columnIndex("DT");
  const tierIndex = columnIndex("DU");

  const leaders = {
    NFL: [],
    FBS: [],
    FCS: [],
  };

  matrix.slice(1).forEach((row) => {
    const name = String(row[nameIndex] ?? "").trim();
    const points = numericValue(row[pointsIndex]);
    const tier = String(row[tierIndex] ?? "").trim().toUpperCase();

    if (!name || points === null || !leaders[tier]) {
      return;
    }

    leaders[tier].push({ name, points });
  });

  Object.keys(leaders).forEach((tier) => {
    leaders[tier] = leaders[tier]
      .sort((first, second) => {
        const pointsDifference =
          Number(second.points) - Number(first.points);

        if (pointsDifference !== 0) {
          return pointsDifference;
        }

        return first.name.localeCompare(second.name);
      })
      .slice(0, 3);
  });

  return leaders;
}
