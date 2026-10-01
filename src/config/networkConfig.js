export const socketUrl = import.meta.env?.VITE_SOCKET_URL || globalThis.location?.origin;
// Sharing configuration must never throw during Admin rendering or select a route/role.
export function getPublicGameUrl(configuredUrl = import.meta.env?.VITE_PUBLIC_GAME_URL, origin = window.location.origin) {
  try {
    const value = configuredUrl?.trim();
    if (!value || !/^https?:\/\//i.test(value) || /[\s()]/.test(value)) return origin;
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return origin;
    return url.origin;
  } catch { return origin; }
}
export function getTeamJoinUrl(joinToken) {
  return `${getPublicGameUrl()}/join/${encodeURIComponent(joinToken)}`;
}
export function isPhoneAccessibleUrl(url) {
  const host = new URL(url).hostname;
  return host !== 'localhost' && !host.endsWith('.localhost') && host !== '[::1]' && host !== '0.0.0.0' && !host.startsWith('127.');
}
