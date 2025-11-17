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
  const PORT = Number(env.VITE_PORT) || 3373;
  const API_HOST = env.VITE_LINSTOR_API_HOST || 'http://192.168.123.214:3370';
  const GATEWAY_API_HOST = env.VITE_GATEWAY_API_HOST || 'http://192.168.123.214:8080';
  const VSAN_API_HOST = env.VITE_HCI_VSAN_API_HOST || 'https://192.168.123.214';
  const GRAFANA_HOST = env.VITE_GRAFANA_HOST || 'http://192.168.123.117:3000';

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
        '/grafana-proxy': {
          target: GRAFANA_HOST,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/grafana-proxy/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              // Get the Grafana URL from header and update target dynamically if provided
              const grafanaUrl = req.headers['x-grafana-url'];
              if (grafanaUrl && typeof grafanaUrl === 'string') {
                try {
                  const url = new URL(grafanaUrl);
                  proxyReq.setHeader('host', url.host);
                  // Set the correct origin for CORS
                  proxyReq.setHeader('origin', url.origin);
                } catch (e) {
                  console.error('Invalid Grafana URL:', grafanaUrl);
                }
              } else {
                // Use default GRAFANA_HOST from env
                const url = new URL(GRAFANA_HOST);
                proxyReq.setHeader('host', url.host);
                proxyReq.setHeader('origin', url.origin);
              }
              // Remove any authentication headers that might interfere
              proxyReq.removeHeader('cookie');
              proxyReq.removeHeader('authorization');
            });

            proxy.on('error', (err, req, res) => {
              console.error('Proxy error:', err);
              if (res && typeof res.writeHead === 'function') {
                res.writeHead(500, {
                  'Content-Type': 'application/json',
                });
                res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
              }
            });
          },
          router: (req: any) => {
            // Dynamically route based on the X-Grafana-Url header
            const grafanaUrl = req.headers['x-grafana-url'];
            if (grafanaUrl && typeof grafanaUrl === 'string') {
              return grafanaUrl;
            }
            // Default to the Grafana server from env
            return GRAFANA_HOST;
          },
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
            // React core
            react: ['react', 'react-dom'],

            // Routing
            router: ['react-router-dom'],

            // Internationalization
            i18n: ['react-i18next', 'i18next'],

            // State management
            query: ['@tanstack/react-query'],
            redux: ['@rematch/core', '@rematch/loading', 'react-redux'],

            // UI libraries
            antd: ['antd', '@ant-design/icons'],
            emotion: ['@emotion/react', '@emotion/styled'],

            // Chart libraries
            charts: ['apexcharts', 'react-apexcharts'],

            // Utility libraries
            utils: ['lodash', 'dayjs', 'axios', 'crypto-js', 'camelcase'],

            // OpenAPI related
            openapi: ['openapi-fetch'],
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
