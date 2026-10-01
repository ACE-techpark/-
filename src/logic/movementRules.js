export const raceDistance = (questionCount, settings) => questionCount * settings.correctAnswerMovement;
export function getShipWorldPosition(progress, totalQuestions, settings) {
  return Math.max(0, Math.min(1, progress / (raceDistance(totalQuestions, settings) || 1)));
}
export function getShipLayout(teamCount) {
  const pageSize = 6;
  return { pageSize, pages: Math.max(1, Math.ceil(teamCount / pageSize)), shipScale: teamCount <= 3 ? 1.15 : teamCount <= 4 ? 1 : 0.95 };
}
