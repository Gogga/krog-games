import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer (generates stats.html after build)
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],

  // Enable host for mobile testing
  server: {
    host: true,
  },

  build: {
    // Target modern browsers for smaller bundle
    target: 'es2020',

    // Optimize chunks
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk (React core)
          vendor: ['react', 'react-dom'],

          // Chess logic chunk
          chess: ['chess.js'],

          // Socket.io chunk
          socket: ['socket.io-client'],
        },
      },
    },

    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },

    // No source maps in production
    sourcemap: false,

    // Chunk size warnings at 500KB
    chunkSizeWarningLimit: 500,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'chess.js', 'socket.io-client'],
  },
})
