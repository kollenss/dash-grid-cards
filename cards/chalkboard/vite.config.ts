import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({ jsxRuntime: 'classic' })],
  build: {
    lib: {
      entry: 'src/index.tsx',
      formats: ['iife'],
      name: 'DGCard_chalkboard',
      fileName: () => 'card.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'window.__dashgrid.React',
          'react-dom': 'window.__dashgrid.ReactDOM',
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
})
