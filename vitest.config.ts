import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// Standalone test config: the Vue plugin + the `@` alias, but NOT the monaco-editor
// plugin from vite.config.ts (tests don't bundle Monaco; monaco-dependent code is
// excluded from coverage instead).
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    // Services read import.meta.env.VITE_API_BASE_URL; give it a stable value in tests.
    env: { VITE_API_BASE_URL: 'http://test.local' },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        'src/**/*.test.ts',
        'src/main.ts',
        'src/**/*.d.ts',
        'src/components/ui/**', // shadcn-vue generated primitives — no logic
        'src/lib/buelo-language/**', // Monaco integration — needs the editor/browser
        // Monaco-coupled editor glue: imports monaco-editor, needs the real editor runtime
        // (and the v8 remapper can't parse these standalone).
        'src/composables/useMonacoEditor.ts',
        'src/composables/useFileValidation.ts',
        'src/composables/useTemplateDiagnostics.ts',
        'src/components/editors/ArtefactEditorTab.vue',
      ],
    },
  },
})
