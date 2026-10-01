import { EVENTS } from '../src/network/socketEvents.js';
import { PHASE } from '../src/data/defaultGameSettings.js';
import { createDemoGame } from './demoGame.js';

const HOST_COMMANDS = new Set(['CREATE_GAME', 'SAVE_GAME', 'SAVE_TEAM', 'REMOVE_TEAM', 'SAVE_QUESTION',
  'REMOVE_QUESTION', 'REORDER_QUESTION', 'RESET_GAME', 'START_GAME', 'SHOW_QUESTION', 'LOCK_ANSWERS',
  'REVEAL_ANSWER', 'PROCESS_ROUND', 'NEXT_QUESTION', 'PAUSE_GAME', 'RESUME_GAME', 'END_GAME', 'REGENERATE_TOKEN']);
export function attachSocketHandlers(io, rooms, { demoEnabled = true } = {}) {
  const timers = new Map();
  const roomName = id => `game:${id}`;
  function broadcast(room) {
    for (const id of io.sockets.adapter.rooms.get(roomName(room.gameId)) || []) {
      const peer = io.sockets.sockets.get(id);
      if (peer.data.teamId && !room.state.teams.some(t => t.id === peer.data.teamId && t.joinToken === peer.data.joinToken)) {
        peer.emit(EVENTS.REVOKED, { error: 'Invalid or expired team code.' });
        leave(peer); continue;
      }
    }
    for (const id of io.sockets.adapter.rooms.get(roomName(room.gameId)) || []) {
      const peer = io.sockets.sockets.get(id);
      if (peer.data.role === 'team-view' && room.state.phase !== PHASE.GAME_FINISHED &&
          room.state.teams.find(t => t.id === peer.data.teamId)?.status === 'ACTIVE') peer.data.role = 'team';
      peer.emit(EVENTS.STATE, rooms.snapshot(room, peer.data.role, peer.data.teamId));
    }
  }
  function schedule(room) {
    clearTimeout(timers.get(room.gameId));
    if (room.state.phase !== PHASE.ROUND_ANIMATION) return;
    timers.set(room.gameId, setTimeout(() => {
      rooms.command(room, { type: 'COMPLETE_ROUND' }); broadcast(room);
      timers.delete(room.gameId);
    }, Math.max(0, room.state.animationEndsAt - Date.now()) + 20));
  }
  function leave(socket) {
    const room = rooms.rooms.get(socket.data.gameId);
    if (room) {
      room.connections.get(socket.data.teamId)?.delete(socket.id);
      socket.leave(roomName(room.gameId));
    }
    socket.data = {};
    return room;
  }
  function join(socket, room, data) {
    const old = leave(socket);
    socket.data = { ...data, gameId: room.gameId };
    socket.join(roomName(room.gameId));
    if (data.teamId) {
      if (!room.connections.has(data.teamId)) room.connections.set(data.teamId, new Set());
      room.connections.get(data.teamId).add(socket.id); room.seen.add(data.teamId);
      rooms.save();
    }
    if (old && old !== room) broadcast(old);
    broadcast(room);
  }
  for (const room of rooms.rooms.values()) schedule(room);
  io.on('connection', socket => {
    const handle = (event, fn) => socket.on(event, (payload, ack) => {
      try {
        if (!payload || typeof payload !== 'object') throw new Error('Invalid request.');
        const result = fn(payload);
        if (typeof ack === 'function') ack({ ok: true, ...result });
      } catch (error) { if (typeof ack === 'function') ack({ ok: false, error: error.message }); }
    });
    handle(EVENTS.HOST_CONNECT, ({ gameId, hostToken }) => {
      const room = gameId ? rooms.host(gameId, hostToken) : rooms.create(hostToken);
      join(socket, room, { role: 'host' }); return { gameId: room.gameId };
    });
    handle(EVENTS.WATCH, ({ gameId, joinToken }) => {
      const room = rooms.get(gameId);
      if (joinToken) {
        const { team } = rooms.lookup(joinToken, gameId);
        // Finished/eliminated crews may reconnect to view results, without answer privileges.
        join(socket, room, { role: 'team-view', teamId: team.id, joinToken });
      } else join(socket, room, { role: 'public' });
    });
    handle(EVENTS.TEAM_LOOKUP, ({ joinToken }) => {
      const { room, team } = rooms.lookup(joinToken);
      return { gameId: room.gameId, finished: room.state.phase === PHASE.GAME_FINISHED, team: { id: team.id, name: team.name, shipColor: team.shipColor,
        crewRemaining: team.crewRemaining, status: team.status } };
    });
    handle(EVENTS.TEAM_JOIN, ({ gameId, joinToken }) => {
      if (!gameId) throw new Error('Game ID is required.');
      const { room, team } = rooms.lookup(joinToken, gameId);
      if (team.status !== 'ACTIVE' || room.state.phase === PHASE.GAME_FINISHED) throw new Error('This team has finished its voyage.');
      join(socket, room, { role: 'team', teamId: team.id, joinToken });
      return { teamId: team.id, gameId };
    });
    handle(EVENTS.TEAM_ANSWER, ({ gameId, teamId, questionId, answerId }) => {
      if (socket.data.role !== 'team' || gameId !== socket.data.gameId || teamId !== socket.data.teamId) throw new Error('Team authorization required.');
      const { room, team } = rooms.lookup(socket.data.joinToken, gameId);
      if (team.id !== teamId) throw new Error('Team authorization required.');
      if (room.state.phase === PHASE.ANSWERS_LOCKED) throw new Error('Answers are locked.');
      rooms.command(room, { type: 'SUBMIT_ANSWER', payload: { teamId, questionId, answerId } });
      broadcast(room);
    });
    handle(EVENTS.HOST_COMMAND, ({ type, payload }) => {
      if (socket.data.role !== 'host') throw new Error('Host authorization required.');
      const room = rooms.get(socket.data.gameId);
      if (type === 'LOAD_DEMO' && demoEnabled) payload = createDemoGame();
      else if (!HOST_COMMANDS.has(type)) throw new Error('Unsupported host command.');
      rooms.command(room, { type, payload }); schedule(room); broadcast(room);
    });
    socket.on('disconnect', () => { const room = leave(socket); if (room) broadcast(room); });
  });
  return () => { for (const timer of timers.values()) clearTimeout(timer); };
}
