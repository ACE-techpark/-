import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = `http://127.0.0.1:${env.PORT || 3001}`;
  return {
  plugins: [react()],
  server: {
    host: true,
    proxy: { '/socket.io': { target, ws: true }, '/api': { target } },
    // Server-only quiz files and stored host credentials must never be served by Vite.
    fs: { deny: ['.env', '.env.*', '**/server/**'] },
  },
  preview: { host: true, proxy: { '/socket.io': { target, ws: true }, '/api': { target } } },
};
})
