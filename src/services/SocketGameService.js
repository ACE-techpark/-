import { io } from 'socket.io-client';
import { EVENTS } from '../network/socketEvents.js';
import { createInitialState } from '../logic/gameEngine.js';
import { socketUrl } from '../config/networkConfig.js';
import { getRouteContext } from '../config/routeConfig.js';
import { HOST_KEY, GAME_KEY } from './localSession.js';

const read = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const newSecret = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join('');

export class SocketGameService {
  constructor() {
    this.snapshot = createInitialState(); this.listeners = new Set(); this.connectionListeners = new Set();
    this.connection = { status: 'Disconnected', ready: false, joinInfo: null, routeError: null };
  }
  subscribeToGame(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  subscribeToConnection(fn) { this.connectionListeners.add(fn); return () => this.connectionListeners.delete(fn); }
  publish(game) { this.snapshot = game; this.listeners.forEach(fn => fn(game)); }
  status(update) { this.connection = { ...this.connection, ...update }; this.connectionListeners.forEach(fn => fn(this.connection)); }
  request(event, payload, socket = this.socket) {
    if (!socket?.connected) return Promise.reject(new Error('Server disconnected. Wait for reconnection.'));
    // Do not queue answers while offline; stale answers must never replay later.
    return new Promise((resolve, reject) => socket.timeout(7000).emit(event, payload, (err, result) => {
      if (err) reject(new Error('Server did not confirm the request. Reconnect to check its status.'));
      else if (!result?.ok) reject(new Error(result?.error || 'Request failed.'));
      else resolve(result);
    }));
  }
  configure(pathname, search) {
    this.socket?.disconnect();
    this.publish(createInitialState());
    this.status({ status: 'Connecting...', ready: false, routeError: null, joinInfo: null });
    const { mode, joinToken } = getRouteContext(pathname);
    this.mode = mode;
    this.joinToken = joinToken;
    const socket = io(socketUrl, { autoConnect: false }); this.socket = socket;
    socket.on(EVENTS.STATE, game => {
      if (this.socket !== socket) return;
      this.publish(game);
      // A team tab must not replace the host/projector's remembered game.
      if (mode === 'host' || mode === 'public') save(GAME_KEY, game.gameId);
    });
    socket.on(EVENTS.REVOKED, ({ error }) => {
      this.publish(createInitialState()); this.status({ ready: false, routeError: error });
    });
    socket.on('disconnect', () => this.status({ status: 'Reconnecting...', ready: false }));
    socket.on('connect_error', () => this.status({ status: 'Reconnecting...', ready: false }));
    socket.on('connect', async () => {
      if (this.socket !== socket) return;
      this.status({ status: 'Connecting...', routeError: null });
      try {
        if (mode === 'host') {
          let credentials = read(HOST_KEY);
          if (!credentials) { credentials = { hostToken: newSecret() }; save(HOST_KEY, credentials); }
          const result = await this.request(EVENTS.HOST_CONNECT, credentials, socket);
          if (this.socket !== socket) return;
          save(HOST_KEY, { ...credentials, gameId: result.gameId });
        } else if (joinToken) {
          const info = await this.request(EVENTS.TEAM_LOOKUP, { joinToken }, socket);
          if (this.socket !== socket) return;
          this.status({ joinInfo: info });
          if (mode === 'team') await this.request(info.team.status === 'ACTIVE' && !info.finished ? EVENTS.TEAM_JOIN : EVENTS.WATCH,
            { gameId: info.gameId, joinToken }, socket);
        } else {
          const gameId = new URLSearchParams(search).get('gameId') || read(GAME_KEY) || read(HOST_KEY)?.gameId;
          if (gameId) {
            try { await this.request(EVENTS.WATCH, { gameId }, socket); }
            catch (error) { if (mode !== 'landing') throw error; }
          } else if (mode !== 'landing') throw new Error('Open the game screen link from your host, or enter a game ID.');
        }
        if (this.socket === socket) this.status({ status: 'Connected', ready: true });
      } catch (error) {
        if (this.socket === socket) this.status({ status: 'Connected', routeError: error.message, ready: false });
      }
    });
    socket.connect();
    return () => {
      if (this.socket === socket) this.socket = null;
      socket.removeAllListeners(); socket.disconnect();
    };
  }
  async dispatch({ type, payload }) {
    if (!this.connection.ready) throw new Error('Wait for the server connection.');
    if (type === 'SUBMIT_ANSWER') return this.request(EVENTS.TEAM_ANSWER, { ...payload, gameId: this.snapshot.gameId });
    if (this.mode !== 'host') throw new Error('Host authorization required.');
    return this.request(EVENTS.HOST_COMMAND, { type, payload });
  }
}
export const gameService = new SocketGameService();
