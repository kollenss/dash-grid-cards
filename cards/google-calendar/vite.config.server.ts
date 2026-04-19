import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/server.ts',
      formats: ['es'],
      fileName: () => 'server.js',
    },
    outDir: 'dist',
    emptyOutDir: false,
    target: 'node18',
    rollupOptions: {
      external: ['node:fs', 'node:path', 'node:url', 'fs', 'path', 'url', 'http', 'https', 'crypto', 'stream', 'buffer'],
    },
  },
})
