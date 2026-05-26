import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    'process.env': {}
  },
  build: {
    // Use terser (not esbuild) in production so we get a guaranteed
    // drop_console that strips library + our own console.* calls from the
    // final bundle — esbuild's `drop` only fires at the transform stage and
    // some library code slipped through.
    minify: mode === 'production' ? 'terser' : 'esbuild',
    sourcemap: false,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
}))
