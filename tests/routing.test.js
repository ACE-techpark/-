import test from 'node:test';
import assert from 'node:assert/strict';
import { getRouteContext } from '../src/config/routeConfig.js';
import { getPublicGameUrl } from '../src/config/networkConfig.js';
import { resetLocalSession, HOST_KEY, GAME_KEY } from '../src/services/localSession.js';

test('explicit routes determine mode, including React Router case/trailing-slash variants', () => {
  for (const path of ['/admin', '/admin/', '/ADMIN']) assert.deepEqual(getRouteContext(path), { mode: 'host' });
  for (const path of ['/', '/unknown']) assert.deepEqual(getRouteContext(path), { mode: 'landing' });
  for (const path of ['/game', '/results/']) assert.deepEqual(getRouteContext(path), { mode: 'public' });
  assert.deepEqual(getRouteContext('/join/abc/'), { mode: 'join', joinToken: 'abc' });
  assert.deepEqual(getRouteContext('/team/xyz'), { mode: 'team', joinToken: 'xyz' });
  assert.deepEqual(getRouteContext('/team/xyz/extra'), { mode: 'landing' });
});

test('QR base accepts HTTP origins and safely falls back for Markdown or invalid configuration', () => {
  const origin = 'http://localhost:5173';
  for (const value of ['', undefined, 'http://[bad', '[http://172.16.54.12:5173](http://172.16.54.12:5173)',
    'http://YOUR_LAN_IP:5173 (replace me)', 'javascript:alert(1)', 'ftp://example.com', 'https://user:password@example.com']) {
    assert.equal(getPublicGameUrl(value, origin), origin);
  }
  for (const value of ['http://172.16.54.12:5173', ' http://172.16.54.12:5173/// ', 'http://172.16.54.12:5173/team/stale?role=team#join']) {
    assert.equal(getPublicGameUrl(value, origin), 'http://172.16.54.12:5173');
  }
  assert.equal(getPublicGameUrl('https://game.example.com/', origin), 'https://game.example.com');
  assert.equal(getPublicGameUrl('http://[::1]:5173/', origin), 'http://[::1]:5173');
});

test('session recovery removes only the app watch key, retaining host access and preferences', () => {
  const local = new Map([[HOST_KEY, 'secret'], [GAME_KEY, 'stale'], ['treasure-tide:language:v1', 'ka'], ['unrelated', 'keep']]);
  const session = new Map([[GAME_KEY, 'stale'], ['unrelated', 'keep']]);
  const oldLocal = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const oldSession = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { removeItem: key => local.delete(key) } });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { removeItem: key => session.delete(key) } });
  try {
    resetLocalSession();
    assert.equal(local.has(GAME_KEY), false);
    assert.equal(session.has(GAME_KEY), false);
    assert.equal(local.get(HOST_KEY), 'secret');
    assert.equal(local.get('treasure-tide:language:v1'), 'ka');
    assert.equal(local.get('unrelated'), 'keep');
    assert.equal(session.get('unrelated'), 'keep');
  } finally {
    if (oldLocal) Object.defineProperty(globalThis, 'localStorage', oldLocal); else delete globalThis.localStorage;
    if (oldSession) Object.defineProperty(globalThis, 'sessionStorage', oldSession); else delete globalThis.sessionStorage;
  }
});
