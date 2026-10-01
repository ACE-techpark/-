import { create } from 'zustand';
import { gameService } from '../services/SocketGameService.js';
export const useGameStore = create(set => ({
  game: gameService.snapshot,
  connection: gameService.connection,
  error: null,
  clearError: () => set({ error: null }),
  act: async (type, payload) => {
    try { await gameService.dispatch({ type, payload }); set({ error: null }); return true; }
    catch (error) { set({ error: error.message }); return false; }
  },
}));
gameService.subscribeToGame(game => useGameStore.setState({ game }));
gameService.subscribeToConnection(connection => useGameStore.setState({ connection }));
