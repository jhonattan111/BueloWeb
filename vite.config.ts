import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import monacoEditorPluginModule from 'vite-plugin-monaco-editor'

// vite-plugin-monaco-editor ships a CJS bundle; the callable is on .default
const monacoEditorPlugin = (monacoEditorPluginModule as unknown as { default: typeof monacoEditorPluginModule }).default ?? monacoEditorPluginModule

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    monacoEditorPlugin({ languageWorkers: ['editorWorkerService', 'json', 'typescript'] }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
