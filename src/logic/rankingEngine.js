export function rankTeams(teams) {
  const category = t => t.status === 'FINISHED' ? 0 : t.status === 'ACTIVE' ? 1 : 2;
  const compare = (a, b) => category(a) - category(b) ||
    (a.status === 'FINISHED' ? a.finishRound - b.finishRound || b.crewRemaining - a.crewRemaining
      : b.progress - a.progress || b.crewRemaining - a.crewRemaining);
  const ordered = [...teams].sort(compare);
  return ordered.map((team, i) => ({ ...team, finalRank: i && compare(team, ordered[i - 1]) === 0
    ? ordered.slice(0, i).findIndex(other => compare(team, other) === 0) + 1 : i + 1 }));
}
