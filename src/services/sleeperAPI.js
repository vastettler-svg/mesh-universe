const SLEEPER_API_BASE_URL = "https://api.sleeper.app/v1";

async function sleeperRequest(endpoint) {
  const response = await fetch(`${SLEEPER_API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(
      `Sleeper request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

export function getLeague(leagueId) {
  return sleeperRequest(`/league/${leagueId}`);
}

export function getLeagueUsers(leagueId) {
  return sleeperRequest(`/league/${leagueId}/users`);
}

export function getLeagueRosters(leagueId) {
  return sleeperRequest(`/league/${leagueId}/rosters`);
}

export function getLeagueMatchups(leagueId, week) {
  return sleeperRequest(`/league/${leagueId}/matchups/${week}`);
}

export function getLeagueTransactions(leagueId, week) {
  return sleeperRequest(`/league/${leagueId}/transactions/${week}`);
}