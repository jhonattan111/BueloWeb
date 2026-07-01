import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

// Flat config. Lints TS + Vue with the official Vue/TS rules; formatting is delegated to Prettier
// (skipFormatting disables the ESLint rules that would fight it). Run `pnpm lint` / `pnpm format`.
export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      // Vendored third-party ESM shim (path-browserify) — not our code to lint.
      'src/lib/monaco/path-browserify.js',
    ],
  },
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  skipFormatting,

  {
    name: 'app/rules',
    rules: {
      // Honor the `_`-prefix convention for deliberately-unused args/vars/catch bindings.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    // shadcn-vue primitives (Button, Dialog, …) and route index pages are single-word by design.
    name: 'app/single-word-components',
    files: ['src/components/ui/**/*.vue', 'src/pages/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
)
