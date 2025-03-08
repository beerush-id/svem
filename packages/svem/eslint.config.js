import css from '@eslint/css';
import js from '@eslint/js';
import markdown from '@eslint/markdown';
import prettier from 'eslint-plugin-prettier/recommended';
import ts from 'typescript-eslint';

var eslint_default = [
  ...[js.configs.recommended],
  ...ts.configs.recommended,
  ...[prettier],
  ...[css.configs.recommended],
  ...markdown.configs.recommended,
  {
    ignores: [
      '.DS_Store',
      'node_modules',
      'build',
      'dist',
      '.svelte-kit',
      'package',
      '.env',
      '.env.*',
      '!.env.example',
      'pnpm-lock.yaml',
      'package-lock.json',
      'yarn.lock',
    ],
  },
];
export { eslint_default as default };
