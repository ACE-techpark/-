export const HOST_KEY = 'treasure-tide:host:v2';
export const GAME_KEY = 'treasure-tide:watch:v2';

// Safe development recovery: keep host credentials, quiz data and language preference.
// Team identity comes only from /join/:joinToken or /team/:joinToken, never storage.
export function resetLocalSession() {
  for (const storage of [localStorage, sessionStorage]) storage.removeItem(GAME_KEY);
}
