import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist', 'src/app/apis', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/__test__/**', '**/__tests__/**'],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Design-system guard: these antd components have branded wrappers under
      // @app/components — import those instead. The wrapper files themselves
      // are exempted below.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'antd',
              importNames: ['Button', 'Popconfirm', 'Checkbox', 'Switch', 'Radio', 'Select', 'Input', 'InputNumber'],
              message:
                'Use the branded wrapper from @app/components/<Name> instead of the raw antd component (design system).',
            },
          ],
        },
      ],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    // The wrappers themselves must import the raw antd components they brand.
    files: [
      'src/app/components/Button/**',
      'src/app/components/Popconfirm/**',
      'src/app/components/Checkbox/**',
      'src/app/components/Switch/**',
      'src/app/components/Radio/**',
      'src/app/components/Select/**',
      'src/app/components/Input/**',
      'src/app/components/InputNumber/**',
    ],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
);
