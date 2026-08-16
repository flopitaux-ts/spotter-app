const js = require('@eslint/js');
const react = require('eslint-plugin-react');
const globals = require('globals');

module.exports = [
  { ignores: ['build/**', 'dist/**', 'node_modules/**'] },

  // Main process and build tooling: CommonJS on Node.
  {
    files: ['src/main/**/*.js', 'scripts/**/*.js', 'webpack.config.js', 'eslint.config.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },

  // Renderer: ES modules with JSX in the browser.
  {
    files: ['src/renderer/**/*.{js,jsx}'],
    ...js.configs.recommended,
    plugins: { react },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.flat.recommended.rules,
      // The app targets React 18 with the classic runtime, so React must stay in
      // scope, but prop-types are not used anywhere in this codebase.
      'react/prop-types': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
];
