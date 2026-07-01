import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// Monaco workers are wired natively via `?worker` imports (see src/lib/monaco/workerSetup.ts),
// replacing the abandoned `vite-plugin-monaco-editor`.
//
// `path-browserify` is aliased to a vendored ESM shim: monaco-yaml's YAML worker imports it, but
// the package is CommonJS-only, and Vite dev serves module workers without CJS→ESM interop for the
// worker graph — the raw `module.exports` throws "module is not defined" and kills YAML tooling.
// See src/lib/monaco/path-browserify.js.
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'path-browserify': fileURLToPath(new URL('./src/lib/monaco/path-browserify.js', import.meta.url)),
    },
  },
  optimizeDeps: {
    include: ['monaco-editor', 'monaco-yaml'],
  },
})
