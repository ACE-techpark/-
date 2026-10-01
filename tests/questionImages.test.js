import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GameRooms } from '../server/gameRooms.js';
import { createDemoGame } from '../server/demoGame.js';
import { validateQuestionImage, MAX_IMAGE_BYTES } from '../src/utils/questionImage.js';
import { reduceGame } from '../src/logic/gameEngine.js';
import { ISLAND_FINISH_MS } from '../src/logic/presentationTiming.js';

const imageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=';
test('optional image fields reject unsafe, temporary and oversized serialized images', () => {
  for (const question of [{}, { imageUrl: '' }, { imageUrl }, { imageUrl: 'https://example.com/image.webp', imageAlt: 'An island' }])
    assert.doesNotThrow(() => validateQuestionImage(question));
  for (const url of ['blob:temporary', 'javascript:alert(1)', 'data:image/svg+xml;base64,AAAA', {}, 'data:image/png;base64,' + 'A'.repeat(MAX_IMAGE_BYTES * 2)])
    assert.throws(() => validateQuestionImage({ imageUrl: url }));
  assert.throws(() => validateQuestionImage({ imageAlt: 'a'.repeat(201) }));
});

test('images persist, only the active image reaches phones, and reset/edit/removal preserve the contract', () => {
  const directory = mkdtempSync(join(tmpdir(), 'pirate-image-test-'));
  try {
    const file = join(directory, 'games.json');
    let rooms = new GameRooms(file);
    let room = rooms.create('a'.repeat(64));
    rooms.command(room, { type: 'LOAD_DEMO', payload: createDemoGame() });
    const question = { ...room.state.questions[0], imageUrl, imageAlt: 'A tiny island' };
    rooms.command(room, { type: 'SAVE_QUESTION', payload: question });
    assert.equal(rooms.snapshot(room, 'public').questions[0].imageUrl, undefined);
    rooms = new GameRooms(file); room = rooms.get(room.gameId);
    assert.equal(room.state.questions[0].imageUrl, imageUrl);
    rooms.command(room, { type: 'START_GAME' }); rooms.command(room, { type: 'SHOW_QUESTION' });
    for (const role of ['public', 'team']) {
      const snapshot = rooms.snapshot(room, role, room.state.teams[0].id);
      assert.equal(snapshot.questions[0].imageUrl, imageUrl);
      assert.equal(snapshot.questions[0].imageAlt, 'A tiny island');
      assert.equal(snapshot.questions[0].correctAnswerId, undefined);
      assert.equal(snapshot.questions[1].text, undefined);
    }
    rooms.command(room, { type: 'RESET_GAME' });
    assert.equal(room.state.questions[0].imageUrl, imageUrl);
    rooms.command(room, { type: 'SAVE_QUESTION', payload: { ...question, imageUrl: '', imageAlt: '' } });
    assert.equal(room.state.questions[0].imageUrl, '');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('one and three survivors finish with rankings set before presentation; pause and completion retain results', () => {
  const rooms = new GameRooms(); const room = rooms.create('b'.repeat(64));
  const demo = createDemoGame(); demo.teams = demo.teams.slice(0, 2); demo.questions = demo.questions.slice(0, 1);
  rooms.command(room, { type: 'LOAD_DEMO', payload: demo });
  rooms.command(room, { type: 'START_GAME' }); rooms.command(room, { type: 'SHOW_QUESTION' });
  room.state.teams = room.state.teams.map((t, i) => ({ ...t, crewRemaining: i ? 3 : 1 }));
  const question = room.state.questions[0];
  room.state.answers = Object.fromEntries(room.state.teams.map(t => [t.id, question.correctAnswerId]));
  rooms.command(room, { type: 'LOCK_ANSWERS' }); rooms.command(room, { type: 'REVEAL_ANSWER' });
  const result = reduceGame(room.state, { type: 'PROCESS_ROUND' }, 1000);
  assert.equal(result.animationEndsAt, 1000 + ISLAND_FINISH_MS);
  assert.deepEqual(result.rankings.map(t => t.crewRemaining), [3, 1]);
  assert.ok(result.teams.every(t => t.status === 'FINISHED'));
  assert.throws(() => reduceGame(result, { type: 'COMPLETE_ROUND' }, 4400), /still playing/);
  const paused = reduceGame(result, { type: 'PAUSE_GAME' }, 4000);
  const resumed = reduceGame(paused, { type: 'RESUME_GAME' }, 10000);
  const completed = reduceGame(resumed, { type: 'COMPLETE_ROUND' }, resumed.animationEndsAt);
  assert.deepEqual(completed.rankings, result.rankings);
});
