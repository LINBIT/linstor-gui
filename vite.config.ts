// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  // Load env variables based on mode
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  const HOST = env.VITE_HOST || '127.0.0.1';
  const PORT = Number(env.VITE_PORT) || 8000;
  const API_HOST = env.VITE_LINSTOR_API_HOST || 'http://192.168.123.214:3370';
  const GATEWAY_API_HOST = env.VITE_GATEWAY_API_HOST || 'http://192.168.123.214:8080';
  const VSAN_API_HOST = env.VITE_HCI_VSAN_API_HOST || 'https://192.168.123.214';

  // Check if coverage is requested via CLI argument
  const isCoverageMode = process.argv.includes('--coverage');

  return {
    plugins: [react(), tailwindcss(), tsconfigPaths()],

    resolve: {
      extensions: ['.js', '.ts', '.tsx', '.jsx'],
      alias: {
        '@app': resolve(__dirname, './src/app'),
      },
    },

    // Base public path, equivalent to Webpack's publicPath
    base: '',

    // Development server configuration
    server: {
      host: HOST,
      port: PORT,
      proxy: {
        '/v1': {
          target: API_HOST,
          changeOrigin: true,
        },
        '/metrics': {
          target: API_HOST,
          changeOrigin: true,
        },
        '/api/v2': {
          target: GATEWAY_API_HOST,
          changeOrigin: true,
        },
        '/api/frontend/v1': {
          target: VSAN_API_HOST,
          secure: false,
          changeOrigin: true,
        },
        [`ws://${HOST}:${PORT}/api/frontend/v1/system/update-with-reboot`]: {
          target: `${VSAN_API_HOST.replace('https', 'wss')}/api/frontend/v1/system/update-with-reboot`,
          ws: true,
          changeOrigin: true,
          secure: false,
        },
      },
    },

    // Build configuration
    build: {
      outDir: 'dist',
      assetsDir: '.',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-i18next', 'i18next', '@tanstack/react-query'],
          },
        },
      },
      sourcemap: false, // Disable sourcemaps in production
      cssCodeSplit: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
        },
      },
    },

    // Define global constants
    define: {
      'import.meta.env': {
        ...env,
      },

      'process.env': {},
    },

    // Asset handling
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],

    // Copy static assets similar to CopyPlugin
    publicDir: 'public',
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      css: true,
      include: ['src/app/**/__test__/**/*.{ts,tsx}', 'src/app/**/*.test.{ts,tsx}', 'src/app/**/*.spec.{ts,tsx}'],
      coverage: {
        enabled: isCoverageMode,
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'cobertura'],
        reportsDirectory: './coverage',
        exclude: [
          'node_modules/',
          'src/setupTests.ts',
          '**/*.d.ts',
          '**/*.config.*',
          '**/dist/**',
          'src/app/apis/**/*',
          'src/translations/**/*',
        ],
      },
      reporters: isCoverageMode ? ['default', 'junit'] : ['default'],
      outputFile: isCoverageMode
        ? {
            junit: './junit.xml',
          }
        : undefined,
    },
  };
});
