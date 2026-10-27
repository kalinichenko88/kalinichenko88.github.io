import js from '@eslint/js';
import eslintPluginAstro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      curly: ['error', 'all'],
      'arrow-body-style': ['error', 'always'],
      // ponytail: deprecated core rule, removed in ESLint 11; move to @stylistic/padding-line-between-statements then
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
      ],
      // arrow-body-style's fix writes `return` into callbacks whose value nobody reads.
      'no-restricted-syntax': [
        'error',
        ...[
          "CallExpression[callee.property.name='forEach'] > ArrowFunctionExpression > BlockStatement > ReturnStatement[argument]",
          "CallExpression[callee.property.name='addEventListener'] > ArrowFunctionExpression > BlockStatement > ReturnStatement[argument]",
          "CallExpression[callee.name='addEventListener'] > ArrowFunctionExpression > BlockStatement > ReturnStatement[argument]",
          "ReturnStatement > CallExpression[callee.property.name='forEach']",
        ].map((selector) => {
          return { selector, message: 'Nobody reads this value: delete the `return`.' };
        }),
      ],
    },
  },
  {
    files: ['**/*.astro'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    ignores: ['dist/**', '.astro/**'],
  },
];
