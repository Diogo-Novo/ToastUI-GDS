import js from '@eslint/js';
import globals from 'globals';
import css from '@eslint/css';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    ignores: [
      './tui.color-picker-2.2.6/**',
      '**/dist/**',
      'tui.editor-editor-2.3.0/libs/squire/source/intro.js',
      'tui.editor-editor-2.3.0/libs/squire/source/outro.js'
    ]
  },
  {
    files: ['./tui.editor-editor-2.3.0/apps/editor/src/*.{js,mjs,cjs}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: { globals: globals.browser },

    // globals: {
    //   fixture: true,
    //   spyOnEvent: true
    // },
    rules: {
      'lines-around-directive': 0,
      'newline-before-return': 0,
      'padding-line-between-statements': [
        2,
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] }
      ],
      'no-useless-rename': 'error',
      'no-duplicate-imports': ['error', { includeExports: true }],
      'dot-notation': ['error', { allowKeywords: true }],
      'prefer-destructuring': [
        'error',
        {
          VariableDeclarator: {
            array: true,
            object: true
          },
          AssignmentExpression: {
            array: false,
            object: false
          }
        },
        {
          enforceForRenamedProperties: false
        }
      ],
      'arrow-body-style': ['error', 'as-needed', { requireReturnForObjectLiteral: true }],
      'object-property-newline': ['error', { allowMultiplePropertiesPerLine: true }],
      'no-sync': 0,
      complexity: 0
    }
  } // { files: ['**/*.css'], plugins: { css }, language: 'css/css', extends: ['css/recommended'] }
]);
