import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, reduceGame } from '../src/logic/gameEngine.js';
import { rankTeams } from '../src/logic/rankingEngine.js';
import { getShipWorldPosition, getShipLayout } from '../src/logic/movementRules.js';
import { createDemoGame } from '../server/demoGame.js';

function fixture(count = 2, questions = 4, crew = 2) {
  const demo = createDemoGame();
  demo.teams = Array.from({ length: count }, (_, i) => ({ ...demo.teams[i % 4], id: `team-${i}`, crewInitial: crew }));
  demo.questions = Array.from({ length: questions }, (_, i) => ({ ...demo.questions[i % 10], id: `q-${i}` }));
  return reduceGame(createInitialState(), { type: 'LOAD_DEMO', payload: demo });
}
const act = (state, type, payload, now = 1000) => reduceGame(state, { type, payload }, now);
function round(state, correctIds = []) {
  if (state.phase === 'SETUP') state = act(state, 'START_GAME');
  if (state.phase === 'NEXT_ROUND') state = act(state, 'NEXT_QUESTION');
  state = act(state, 'SHOW_QUESTION');
  const question = state.questions[state.questionIndex];
  for (const teamId of correctIds) state = act(state, 'SUBMIT_ANSWER', { teamId, questionId: question.id, answerId: question.correctAnswerId });
  state = act(state, 'LOCK_ANSWERS'); state = act(state, 'REVEAL_ANSWER');
  return act(state, 'PROCESS_ROUND');
}
const complete = s => act(s, 'COMPLETE_ROUND', undefined, s.animationEndsAt);

test('start requires teams, questions, names and valid crews', () => {
  assert.throws(() => act(createInitialState(), 'START_GAME'), /team/);
  const s = fixture();
  assert.throws(() => act({ ...s, questions: [] }, 'START_GAME'), /question/);
  for (const crewInitial of [1, 7, 2.5]) assert.throws(() => act(s, 'SAVE_TEAM', { ...s.teams[0], crewInitial }), /crew/);
  assert.throws(() => act(s, 'SAVE_TEAM', { ...s.teams[0], name: ' ' }), /name/);
});
test('questions require four nonempty answers and a valid correct answer', () => {
  const s = fixture(), q = s.questions[0];
  assert.throws(() => act(s, 'SAVE_QUESTION', { ...q, answers: q.answers.slice(0, 3) }), /four|4/);
  assert.throws(() => act(s, 'SAVE_QUESTION', { ...q, correctAnswerId: 'fake' }), /correct/);
  assert.throws(() => act(s, 'SAVE_QUESTION', { ...q, text: '' }), /text/);
});
test('correct answer moves exactly one and preserves crew; missing answer loses exactly one without movement', () => {
  const s = round(fixture(), ['team-0']);
  assert.equal(s.teams[0].progress, 1); assert.equal(s.teams[0].crewRemaining, 2);
  assert.equal(s.teams[1].progress, 0); assert.equal(s.teams[1].crewRemaining, 1);
  assert.equal(s.teams[1].status, 'ACTIVE'); assert.equal(s.roundResults[1].crewLost, 1);
});
test('an explicitly wrong answer loses exactly one crew and does not move', () => {
  let s = act(act(fixture(), 'START_GAME'), 'SHOW_QUESTION');
  const q = s.questions[0];
  s = act(s, 'SUBMIT_ANSWER', { teamId: 'team-0', questionId: q.id, answerId: q.answers.find(a => a.id !== q.correctAnswerId).id });
  s = act(act(act(s, 'LOCK_ANSWERS'), 'REVEAL_ANSWER'), 'PROCESS_ROUND');
  assert.equal(s.teams[0].progress, 0); assert.equal(s.teams[0].crewRemaining, 1); assert.equal(s.roundResults[0].missed, false);
});
test('one crew continues; zero eliminates; eliminated crew cannot submit or move later', () => {
  let s = complete(round(fixture(), ['team-0']));
  s = complete(round(s, ['team-0']));
  assert.equal(s.teams[1].crewRemaining, 0); assert.equal(s.teams[1].status, 'ELIMINATED');
  assert.equal(s.phase, 'NEXT_ROUND');
  s = act(act(s, 'NEXT_QUESTION'), 'SHOW_QUESTION');
  assert.throws(() => act(s, 'SUBMIT_ANSWER', { teamId: 'team-1', questionId: s.questions[2].id, answerId: s.questions[2].correctAnswerId }), /cannot answer/);
  s = act(act(act(s, 'LOCK_ANSWERS'), 'REVEAL_ANSWER'), 'PROCESS_ROUND');
  assert.equal(s.teams[1].crewRemaining, 0); assert.equal(s.teams[1].progress, 0);
});
test('duplicate, stale, unknown-team, invalid and late answers are rejected', () => {
  let s = act(act(fixture(), 'START_GAME'), 'SHOW_QUESTION');
  const payload = { teamId: 'team-0', questionId: s.questions[0].id, answerId: s.questions[0].correctAnswerId };
  assert.throws(() => act(s, 'SUBMIT_ANSWER', { ...payload, questionId: 'old' }), /ended/);
  assert.throws(() => act(s, 'SUBMIT_ANSWER', { ...payload, teamId: 'unknown' }), /cannot/);
  assert.throws(() => act(s, 'SUBMIT_ANSWER', { ...payload, answerId: 'invalid' }), /Invalid/);
  s = act(s, 'SUBMIT_ANSWER', payload);
  assert.throws(() => act(s, 'SUBMIT_ANSWER', payload), /already/);
  s = act(s, 'LOCK_ANSWERS'); assert.throws(() => act(s, 'SUBMIT_ANSWER', { ...payload, teamId: 'team-1' }), /unavailable/);
});
test('rounds cannot be double processed or advanced before presentation completes', () => {
  const s = round(fixture(), ['team-0']);
  assert.throws(() => act(s, 'PROCESS_ROUND'), /unavailable/);
  assert.throws(() => act(s, 'NEXT_QUESTION'), /unavailable/);
  assert.throws(() => act(s, 'COMPLETE_ROUND'), /still playing/);
  assert.equal(complete(s).phase, 'NEXT_ROUND');
});
test('pause rejects answers and resume preserves the round and remaining presentation time', () => {
  const s = act(act(fixture(), 'START_GAME'), 'SHOW_QUESTION');
  const paused = act(s, 'PAUSE_GAME');
  assert.throws(() => act(paused, 'SUBMIT_ANSWER', {}), /unavailable/);
  assert.equal(act(paused, 'RESUME_GAME').phase, 'QUESTION_ACTIVE');
  const animation = round(fixture());
  const frozen = act(animation, 'PAUSE_GAME', undefined, 2000);
  const resumed = act(frozen, 'RESUME_GAME', undefined, 9000);
  assert.equal(resumed.animationEndsAt, 11400);
});
test('all eliminated ends game; a single surviving team continues', () => {
  let s = complete(round(fixture()));
  s = complete(round(s));
  assert.equal(s.phase, 'GAME_FINISHED'); assert.ok(s.teams.every(t => t.status === 'ELIMINATED'));
  const single = complete(round(fixture(1, 3), ['team-0'])); assert.equal(single.phase, 'NEXT_ROUND');
});
test('simultaneous island arrivals tie break by remaining crew and freeze finished ships', () => {
  let s = fixture(2, 1); s.teams[1].crewRemaining = 3; s.teams[1].crewInitial = 3;
  s = round(s, ['team-0', 'team-1']);
  assert.ok(s.teams.every(t => t.status === 'FINISHED' && t.finishRound === 1));
  assert.equal(s.rankings[0].id, 'team-1');
  const next = complete(s); assert.equal(next.phase, 'GAME_FINISHED');
  const active = { ...s, phase: 'QUESTION_ACTIVE' };
  assert.throws(() => act(active, 'SUBMIT_ANSWER', { teamId: 'team-0', questionId: s.questions[0].id, answerId: s.questions[0].correctAnswerId }), /cannot/);
});
test('arrival round outranks crew; exact ties share a competition rank', () => {
  const teams = [
    { id: 'late', status: 'FINISHED', finishRound: 9, crewRemaining: 6 },
    { id: 'early', status: 'FINISHED', finishRound: 8, crewRemaining: 3 },
    { id: 'early-more', status: 'FINISHED', finishRound: 8, crewRemaining: 5 },
    { id: 'early-tie', status: 'FINISHED', finishRound: 8, crewRemaining: 5 },
  ];
  assert.deepEqual(rankTeams(teams).map(t => [t.id, t.finalRank]), [['early-more', 1], ['early-tie', 1], ['early', 3], ['late', 4]]);
});
test('question counts define distance and ending: 1, 3, 12, 30', () => {
  for (const count of [1, 3, 12, 30]) {
    let s = fixture(1, count, 6);
    for (let i = 0; i < count; i++) s = complete(round(s, ['team-0']));
    assert.equal(s.phase, 'GAME_FINISHED'); assert.equal(s.teams[0].progress, count);
    assert.equal(getShipWorldPosition(s.teams[0].progress, count, s.settings), 1);
  }
});
test('unlimited teams use display groups; six teams and varied crews work', () => {
  const s = fixture(100, 2); assert.equal(act(s, 'START_GAME').teams.length, 100);
  assert.equal(getShipLayout(100).pages, 17);
  assert.equal(getShipLayout(6).pages, 1);
  let six = fixture(6); six.teams = six.teams.map((t, i) => ({ ...t, crewInitial: 2 + i % 5 }));
  six = round(six, ['team-0', 'team-2', 'team-4']);
  assert.deepEqual(six.teams.map(t => t.crewRemaining), [2, 2, 4, 4, 6, 1]);
});
test('restart clears gameplay while keeping teams and questions; end preserves current standings', () => {
  const s = round(fixture(), ['team-0']);
  const end = act(s, 'END_GAME'); assert.equal(end.phase, 'GAME_FINISHED'); assert.equal(end.teams[0].progress, 1);
  const reset = act(end, 'RESET_GAME');
  assert.equal(reset.phase, 'SETUP'); assert.equal(reset.questions.length, 4);
  assert.ok(reset.teams.every(t => t.progress === 0 && t.crewRemaining === t.crewInitial && t.status === 'ACTIVE'));
  assert.deepEqual(reset.answers, {});
});
test('editing and reordering are setup only; source snapshots remain immutable', () => {
  const s = fixture(); const old = JSON.stringify(s);
  const reordered = act(s, 'REORDER_QUESTION', { id: 'q-0', direction: 1 });
  assert.equal(reordered.questions[1].id, 'q-0'); assert.equal(JSON.stringify(s), old);
  assert.throws(() => act(act(s, 'START_GAME'), 'REMOVE_TEAM', { id: 'team-0' }), /unavailable/);
});
test('JSON serialization and reload preserve round results and allow expired round recovery', () => {
  const saved = JSON.parse(JSON.stringify(round(fixture(), ['team-0'])));
  const recovered = complete(saved);
  assert.equal(recovered.phase, 'NEXT_ROUND'); assert.equal(recovered.teams[1].crewRemaining, 1);
});
