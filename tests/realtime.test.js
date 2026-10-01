import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { io } from 'socket.io-client';
import { createGameServer, originAllowed } from '../server/index.js';
import { EVENTS } from '../src/network/socketEvents.js';
import { GameRooms } from '../server/gameRooms.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const request = (socket, event, payload = {}) => new Promise((resolve, reject) => {
  socket.timeout(3000).emit(event, payload, (err, result) => err ? reject(err) : resolve(result));
});
const secret = () => randomBytes(32).toString('hex');
function waitState(socket, predicate) {
  if (predicate(socket.state)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.off(EVENTS.STATE, check); reject(new Error('Expected snapshot did not arrive.')); }, 3000);
    function check(state) { if (predicate(state)) { clearTimeout(timer); socket.off(EVENTS.STATE, check); resolve(); } }
    socket.on(EVENTS.STATE, check);
  });
}
test('real sockets enforce authorization, isolation, answer privacy, single submission, locks and reconnect', { timeout: 20000 }, async t => {
  const server = createGameServer();
  await new Promise(done => server.http.listen(0, '127.0.0.1', done));
  const url = `http://127.0.0.1:${server.http.address().port}`;
  const clients = [];
  t.after(async () => { clients.forEach(c => c.disconnect()); await server.close(); });
  async function connect() {
    const client = io(url, { transports: ['websocket'], forceNew: true }); clients.push(client);
    client.on(EVENTS.STATE, state => { client.state = state; });
    await new Promise((done, reject) => { client.on('connect', done); client.on('connect_error', reject); });
    return client;
  }
  const host = await connect(), publicScreen = await connect(), phone = await connect(), otherHost = await connect();
  const hostToken = secret();
  const { gameId } = await request(host, EVENTS.HOST_CONNECT, { hostToken });
  const command = (type, payload) => request(host, EVENTS.HOST_COMMAND, { type, payload });
  assert.equal((await command('LOAD_DEMO')).ok, true);
  const [team, second] = host.state.teams;
  assert.match(team.joinToken, /^[\w-]{32}$/);
  assert.notEqual(team.joinToken, second.joinToken);
  assert.equal((await request(phone, EVENTS.TEAM_JOIN, { gameId, joinToken: 'bad' })).ok, false);
  assert.equal((await request(phone, EVENTS.HOST_COMMAND, { type: 'START_GAME' })).ok, false);
  assert.equal((await request(phone, EVENTS.HOST_CONNECT, { gameId, hostToken: secret() })).ok, false);
  const { gameId: otherId } = await request(otherHost, EVENTS.HOST_CONNECT, { hostToken: secret() });
  assert.equal((await request(phone, EVENTS.TEAM_JOIN, { gameId: otherId, joinToken: team.joinToken })).ok, false);
  await request(phone, EVENTS.TEAM_JOIN, { gameId, joinToken: team.joinToken });
  await request(publicScreen, EVENTS.WATCH, { gameId });
  await waitState(host, s => s.teams[0].connection === 'Connected');
  assert.equal(host.state.teams[0].connection, 'Connected');
  await command('START_GAME'); await command('SHOW_QUESTION');
  await Promise.all([phone, publicScreen].map(c => waitState(c, s => s.phase === 'QUESTION_ACTIVE')));
  const question = host.state.questions[0];
  for (const viewer of [phone, publicScreen]) {
    // No answer keys, tokens (including rankings), or future question text in any snapshot.
    const wire = JSON.stringify(viewer.state);
    assert.equal(wire.includes('correctAnswerId'), false);
    assert.equal(wire.includes('joinToken'), false);
    assert.equal(wire.includes(host.state.questions[1].text), false);
  }
  assert.equal(otherHost.state.phase, 'SETUP');
  const payload = { gameId, teamId: team.id, questionId: question.id, answerId: question.correctAnswerId };
  assert.equal((await request(phone, EVENTS.TEAM_ANSWER, { ...payload, teamId: second.id })).ok, false);
  assert.equal((await request(phone, EVENTS.TEAM_ANSWER, { ...payload, questionId: 'stale' })).ok, false);
  assert.equal((await request(phone, EVENTS.TEAM_ANSWER, { ...payload, answerId: 'unknown' })).ok, false);
  const results = await Promise.all([request(phone, EVENTS.TEAM_ANSWER, payload), request(phone, EVENTS.TEAM_ANSWER, payload)]);
  assert.equal(results.filter(r => r.ok).length, 1);
  await waitState(publicScreen, s => s.answers[team.id] === true);
  assert.equal(publicScreen.state.answers[team.id], true);
  phone.disconnect();
  const restored = await connect();
  await request(restored, EVENTS.TEAM_JOIN, { gameId, joinToken: team.joinToken });
  assert.equal(restored.state.answers[team.id], question.correctAnswerId);
  assert.equal((await request(restored, EVENTS.TEAM_ANSWER, payload)).ok, false);
  const phone2 = await connect();
  await request(phone2, EVENTS.TEAM_JOIN, { gameId, joinToken: second.joinToken });
  await command('LOCK_ANSWERS');
  assert.equal((await request(phone2, EVENTS.TEAM_ANSWER, { ...payload, teamId: second.id })).error, 'Answers are locked.');
  assert.equal(JSON.stringify(phone2.state).includes('correctAnswerId'), false);
  await command('REVEAL_ANSWER');
  await waitState(restored, s => s.phase === 'ANSWER_REVEAL');
  assert.equal(restored.state.questions[0].correctAnswerId, question.correctAnswerId);
  await command('PROCESS_ROUND');
  assert.deepEqual(host.state.teams.slice(0, 2).map(t => [t.progress, t.crewRemaining]), [[1, 6], [0, 5]]);
  assert.equal((await command('PROCESS_ROUND')).ok, false);
  assert.equal((await request(restored, EVENTS.HOST_COMMAND, { type: 'RESET_GAME' })).ok, false);
  await command('REGENERATE_TOKEN', { id: team.id });
  assert.equal((await request(restored, EVENTS.TEAM_ANSWER, payload)).ok, false);
  assert.equal((await request(restored, EVENTS.TEAM_LOOKUP, { joinToken: team.joinToken })).ok, false);
  assert.notEqual(host.state.teams[0].joinToken, team.joinToken);
  // Presentation completes on the server even after every host disconnects.
  host.disconnect();
  await new Promise(done => setTimeout(done, 3550));
  assert.equal(publicScreen.state.phase, 'NEXT_ROUND');
  const newHost = await connect();
  await request(newHost, EVENTS.HOST_CONNECT, { gameId, hostToken });
  assert.equal(newHost.state.teams[0].progress, 1);
  assert.equal((await request(newHost, EVENTS.HOST_COMMAND, { type: 'NEXT_QUESTION' })).ok, true);
  await waitState(publicScreen, s => s.phase === 'READY');
  assert.equal(JSON.stringify(publicScreen.state).includes('correctAnswerId'), false);
  await request(newHost, EVENTS.HOST_COMMAND, { type: 'END_GAME' });
  assert.equal((await request(phone2, EVENTS.TEAM_JOIN, { gameId, joinToken: second.joinToken })).ok, false);
  const watcher = await connect();
  await request(watcher, EVENTS.WATCH, { gameId, joinToken: second.joinToken });
  assert.equal(watcher.state.myTeamId, second.id);
  assert.equal(watcher.state.phase, 'GAME_FINISHED');
  assert.equal((await request(watcher, EVENTS.TEAM_ANSWER, { ...payload, teamId: second.id })).ok, false);
});

test('credentials and tokens survive server persistence; reset preserves codes; regeneration invalidates them', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tide-test-'));
  try {
    const file = join(dir, 'games.json');
    const rooms = new GameRooms(file), key = secret();
    const room = rooms.create(key);
    rooms.command(room, { type: 'SAVE_TEAM', payload: { name: 'Black Sharks', crewInitial: 6, shipColor: '#123456' } });
    const team = room.state.teams[0];
    rooms.command(room, { type: 'RESET_GAME' });
    assert.equal(room.state.teams[0].joinToken, team.joinToken);
    const restored = new GameRooms(file);
    assert.equal(restored.host(room.gameId, key).state.teams[0].joinToken, team.joinToken);
    assert.equal(restored.create(key).gameId, room.gameId);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('CORS permits LAN in development and requires exact production origins', () => {
  assert.equal(originAllowed('http://192.168.1.15:5173', { production: false }), true);
  assert.equal(originAllowed('https://untrusted.example', { production: false }), false);
  for (const hostname of ['192.168.evil.example', '10.evil.example', '127.evil.example', '172.16.evil.example']) {
    assert.equal(originAllowed(`http://${hostname}:5173`, { production: false }), false);
  }
  assert.equal(originAllowed('http://192.168.1.15:5173', { production: true }), false);
  assert.equal(originAllowed('https://pirates.example', { production: true, allowed: 'https://pirates.example' }), true);
  assert.equal(originAllowed('https://pirates.example.evil.test', { production: true, allowed: 'https://pirates.example' }), false);
});
