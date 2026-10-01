import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { existsSync, readFileSync, mkdirSync, writeFileSync, renameSync } from 'node:fs';
import { dirname } from 'node:path';
import { createInitialState, reduceGame } from '../src/logic/gameEngine.js';
import { rankTeams } from '../src/logic/rankingEngine.js';
import { PHASE } from '../src/data/defaultGameSettings.js';
import { publicTranslations } from '../src/utils/questionTranslations.js';

const token = () => randomBytes(24).toString('base64url');
const digest = value => createHash('sha256').update(value).digest('hex');
const publicTeam = t => ({ id: t.id, name: t.name, crewInitial: t.crewInitial,
  crewRemaining: t.crewRemaining, shipColor: t.shipColor, progress: t.progress,
  status: t.status, finishRound: t.finishRound, finalRank: t.finalRank,
  currentAnswer: t.currentAnswer, answeredCorrectly: t.answeredCorrectly });
const editableTeam = t => ({ id: t.id || randomUUID(), name: t.name,
  crewInitial: t.crewInitial, shipColor: t.shipColor });

export class GameRooms {
  constructor(file) {
    this.file = file;
    this.rooms = new Map();
    if (file && existsSync(file)) {
      for (const room of JSON.parse(readFileSync(file, 'utf8'))) {
        this.rooms.set(room.gameId, { ...room, connections: new Map(), seen: new Set(room.seen) });
      }
    }
  }
  save() {
    if (!this.file) return;
    mkdirSync(dirname(this.file), { recursive: true });
    writeFileSync(`${this.file}.tmp`, JSON.stringify([...this.rooms.values()].map(r => ({
      gameId: r.gameId, hostHash: r.hostHash, state: r.state, seen: [...r.seen],
    }))));
    renameSync(`${this.file}.tmp`, this.file);
  }
  create(hostToken) {
    if (typeof hostToken !== 'string' || !/^[a-f0-9]{64}$/.test(hostToken)) throw new Error('Invalid host credential.');
    // An acknowledgement can be lost: retrying creation with the same secret is safe.
    const hostHash = digest(hostToken);
    const existing = [...this.rooms.values()].find(r => r.hostHash === hostHash);
    if (existing) return existing;
    const gameId = `PIRATE-${randomBytes(6).toString('hex').toUpperCase()}`;
    const room = { gameId, hostHash, state: createInitialState(), connections: new Map(), seen: new Set() };
    this.rooms.set(gameId, room); this.save(); return room;
  }
  get(gameId) {
    const room = this.rooms.get(gameId);
    if (!room) throw new Error('Game not found. Ask the host for a current link.');
    return room;
  }
  host(gameId, hostToken) {
    const room = this.get(gameId);
    if (typeof hostToken !== 'string' || digest(hostToken) !== room.hostHash) throw new Error('Host authorization required.');
    return room;
  }
  lookup(joinToken, gameId) {
    if (typeof joinToken === 'string' && joinToken.length >= 32) {
      for (const room of this.rooms.values()) {
        if (gameId && room.gameId !== gameId) continue;
        const team = room.state.teams.find(t => t.joinToken === joinToken);
        if (team) return { room, team };
      }
    }
    throw new Error('Invalid or expired team code.');
  }
  command(room, command) {
    let { type, payload = {} } = command;
    if (type === 'REGENERATE_TOKEN') {
      if (!room.state.teams.some(t => t.id === payload.id)) throw new Error('Team not found.');
      room.state = { ...room.state, revision: room.state.revision + 1,
        teams: room.state.teams.map(t => t.id === payload.id ? { ...t, joinToken: token() } : t) };
    } else {
      if (type === 'SAVE_TEAM') payload = editableTeam(payload);
      if (type === 'LOAD_DEMO') payload = { name: payload.name, description: payload.description,
        teams: payload.teams.map(t => editableTeam({ ...t, id: randomUUID() })), questions: payload.questions };
      const previous = room.state;
      const next = reduceGame(previous, { type, payload });
      next.teams = next.teams.map(t => ({ ...t, joinToken:
        (type !== 'LOAD_DEMO' && previous.teams.find(old => old.id === t.id)?.joinToken) || token() }));
      room.state = next;
    }
    room.state.rankings = rankTeams(room.state.teams);
    this.save();
  }
  snapshot(room, role, teamId) {
    const state = room.state;
    const phase = state.phase === PHASE.PAUSED ? state.pausedPhase : state.phase;
    // Ending a question early must not accidentally disclose its answer key.
    const revealed = [PHASE.ANSWER_REVEAL, PHASE.ROUND_ANIMATION, PHASE.NEXT_ROUND].includes(phase)
      || (phase === PHASE.GAME_FINISHED && state.roundResults.length > 0);
    const connection = id => room.connections.get(id)?.size ? 'Connected' : room.seen.has(id) ? 'Disconnected' : 'Not Connected';
    if (role === 'host') return { ...state, gameId: room.gameId,
      teams: state.teams.map(t => ({ ...t, connection: connection(t.id) })) };
    const sanitize = t => ({ ...publicTeam(t), currentAnswer: revealed || t.id === teamId ? t.currentAnswer : null,
      answeredCorrectly: revealed ? t.answeredCorrectly : null });
    return { ...state, gameId: room.gameId, myTeamId: teamId,
      questions: state.questions.map((q, i) => i === state.questionIndex && ![PHASE.SETUP, PHASE.LOBBY, PHASE.READY].includes(phase)
        ? { id: q.id, text: q.text, imageUrl: q.imageUrl, imageAlt: q.imageAlt, translations: publicTranslations(q), answers: q.answers.map(a => ({ id: a.id, text: a.text, translations: publicTranslations(a) })),
          ...(revealed ? { correctAnswerId: q.correctAnswerId } : {}) } : { id: q.id }),
      teams: state.teams.map(sanitize), rankings: state.rankings.map(sanitize),
      answers: Object.fromEntries(Object.entries(state.answers).map(([id, answer]) => [id, id === teamId ? answer : true])),
      roundResults: revealed ? state.roundResults : [],
    };
  }
}
