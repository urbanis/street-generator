import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.worktrees']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Fast-Refresh granularity rule. This project deliberately co-locates
      // components with their related constants/hooks (theme flags, tour steps,
      // cva variants, i18n hooks); the rule has no runtime/correctness impact.
      'react-refresh/only-export-components': 'off',
      // Underscore-prefixed args/vars are intentionally unused.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Syncing local state from props and one-shot mount animations are
      // intentional here; this newer rule flags those legitimate patterns.
      // rules-of-hooks and exhaustive-deps remain enforced.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
