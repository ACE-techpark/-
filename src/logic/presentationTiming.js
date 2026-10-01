export const SHIP_MOVEMENT_MS = 2500;
export const ISLAND_FINISH_MS = 7200;

export function roundPresentationMs(results, settings) {
  return Math.max(settings.animationDurationMs, results.some(r => r.finished) ? ISLAND_FINISH_MS : SHIP_MOVEMENT_MS);
}

export function presentationElapsed(game, now = Date.now()) {
  const duration = roundPresentationMs(game.roundResults, game.settings);
  const remaining = game.phase === 'PAUSED' ? game.animationRemaining : (game.animationEndsAt || now + duration) - now;
  return Math.max(0, Math.min(duration, duration - remaining));
}
