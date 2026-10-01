// getRandomValues also works on plain HTTP LAN origins, unlike randomUUID.
export const createId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), n => n.toString(16).padStart(2, '0')).join('');
