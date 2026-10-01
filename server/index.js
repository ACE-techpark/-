import express from 'express';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { isIP } from 'node:net';
import { Server } from 'socket.io';
import { GameRooms } from './gameRooms.js';
import { attachSocketHandlers } from './socketHandlers.js';

export function originAllowed(origin, { production = process.env.NODE_ENV === 'production', allowed = process.env.FRONTEND_ORIGIN || '' } = {}) {
  if (!origin) return true; // Native clients still require host/team authorization.
  const origins = allowed.split(',').map(s => s.trim()).filter(Boolean);
  if (origins.includes(origin)) return true;
  if (production) return false;
  try {
    const url = new URL(origin);
    const h = url.hostname;
    return ['http:', 'https:'].includes(url.protocol) && (h === 'localhost' || h === '[::1]' ||
      (isIP(h) === 4 && (h.startsWith('127.') || h.startsWith('10.') || h.startsWith('192.168.') || /^172\.(1[6-9]|2\d|3[01])\./.test(h))));
  } catch { return false; }
}
export function createGameServer({ file, demoEnabled = process.env.NODE_ENV !== 'production' } = {}) {
  const app = express();
  const http = createServer(app);
  const io = new Server(http, {
    cors: { origin: (origin, cb) => cb(null, originAllowed(origin)) },
    allowRequest: (req, cb) => cb(null, originAllowed(req.headers.origin)), maxHttpBufferSize: 500_000,
  });
  app.use((req, res, next) => {
    if (!originAllowed(req.headers.origin)) return res.sendStatus(403);
    if (req.headers.origin) res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Vary', 'Origin'); next();
  });
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  if (process.env.NODE_ENV !== 'production') app.get('/api/network', (_req, res) => res.json({
    addresses: Object.values(networkInterfaces()).flat().filter(n => n.family === 'IPv4' && !n.internal).map(n => n.address),
  }));
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(resolve('dist')));
    app.get('/{*path}', (_req, res) => res.sendFile(resolve('dist/index.html')));
  }
  const rooms = new GameRooms(file);
  const cleanup = attachSocketHandlers(io, rooms, { demoEnabled });
  return { app, http, io, rooms, close: () => { cleanup(); return new Promise(done => io.close(done)); } };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_ORIGIN) throw new Error('Set FRONTEND_ORIGIN to the production frontend origin.');
  const port = Number(process.env.PORT || 3001);
  const server = createGameServer({ file: resolve(process.env.GAME_STATE_FILE || 'server/data/games.json') });
  server.http.listen(port, '0.0.0.0', () => console.log(`Treasure Tide realtime server listening on port ${port}`));
}
