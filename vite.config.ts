// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import { configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

/** `<package.json version>-<commit>`, what a build without VITE_VERSION shows. */
const snapshotVersion = (): string => {
  const { version } = JSON.parse(readFileSync(resolve(import.meta.dirname, 'package.json'), 'utf8'));
  try {
    const commit = execSync('git rev-parse --short=8 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    return `${version}-${commit}`;
  } catch {
    // A source tarball has no .git; packaging passes VERSION anyway.
    return version;
  }
};

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  // Load env variables based on mode
  // VITE_* is the usual client-exposed set. LINBIT_SDS_VERSION is the one
  // unprefixed variable a product build (LINBIT SDS for Windows) sets in its
  // own make process; it shows up in the About panel when present.
  const env = loadEnv(mode, process.cwd(), ['VITE_', 'LINBIT_SDS_VERSION']);

  // Packaging sets VITE_VERSION (make build VERSION=...). A build without it
  // used to say "DEV" unless someone edited .env by hand; name the commit
  // instead. The dev server and the tests keep "DEV".
  if (command === 'build' && !env.VITE_VERSION?.trim()) {
    process.env.VITE_VERSION = snapshotVersion();
  }

  const HOST = env.VITE_HOST || '127.0.0.1';
  const PORT = Number(env.VITE_PORT) || 3373;
  const API_HOST = env.VITE_LINSTOR_API_HOST || 'http://192.168.123.214:3370';
  const GATEWAY_API_HOST = env.VITE_GATEWAY_API_HOST || 'http://192.168.123.214:8080';
  const VSAN_API_HOST = env.VITE_HCI_VSAN_API_HOST || 'https://192.168.123.214';

  // Check if coverage is requested via CLI argument
  const isCoverageMode = process.argv.includes('--coverage');

  return {
    plugins: [react(), tailwindcss()],

    resolve: {
      extensions: ['.js', '.ts', '.tsx', '.jsx'],
      alias: {
        '@app': resolve(import.meta.dirname, './src/app'),
      },
    },

    // Base public path, equivalent to Webpack's publicPath
    base: '',

    // Development server configuration
    server: {
      host: HOST,
      port: PORT,
      // Don't let transient tool output (e.g. Playwright MCP snapshots/console logs
      // written into .playwright-mcp/) trigger HMR full-reload loops.
      watch: {
        ignored: ['**/.playwright-mcp/**'],
      },
      proxy: {
        '/v1': {
          target: API_HOST,
          changeOrigin: true,
          secure: false,
        },
        '/metrics': {
          target: API_HOST,
          changeOrigin: true,
          secure: false,
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
      // No manualChunks: grouping libraries into fixed vendor chunks made any
      // first-load import of one module (e.g. a prop-types helper) pull its
      // whole group — apexcharts, every antd component — into the entry.
      // Pages are lazy (routes/), so the bundler's own split is the smaller one.
      sourcemap: false, // Disable sourcemaps in production
      // Two lazy chunks sit between 500 and 650 kB and cannot be split
      // further: apexcharts (~630 kB: its core alone is ~470 kB, plus the
      // types and features @app/components/Chart registers), and the OCF agent
      // catalog data behind the reactor editor. Anything else crossing 500 kB
      // should still warn, so the limit only covers those two.
      chunkSizeWarningLimit: 650,
      cssCodeSplit: true,
      // Vite's default oxc minifier; terser took 95% of the build time.
      rolldownOptions: {
        // Our own modules only matter for their exports, so an unused export
        // of a feature barrel (e.g. node's chart components behind useNodes)
        // no longer drags apexcharts into every page. i18n.ts initialises on
        // import, components/Chart registers the apexcharts chart types and
        // features it imports; CSS and node_modules keep the default.
        treeshake: {
          moduleSideEffects: [
            { test: /\/src\/i18n\.ts$/, sideEffects: true },
            { test: /\/src\/app\/components\/Chart\/index\.ts$/, sideEffects: true },
            { test: /\/src\/.*\.tsx?$/, sideEffects: false },
          ],
        },
        output: {
          minify: { compress: { dropConsole: true } },
        },
      },
    },

    // Which variables reach the client as import.meta.env.*. Must list the
    // unprefixed LINBIT_SDS_VERSION too: the define below only covers whole-
    // object access, the per-key replacement Vite does at build time keys off
    // this list.
    envPrefix: ['VITE_', 'LINBIT_SDS_VERSION'],

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
      // The shared CI runner is roughly ten times slower than a laptop: a
      // single render of an antd page with a Table and a DatePicker takes
      // 1.5-4 s there, so the 5 s default tripped on tests that are fine
      // locally. The limit is a hang guard, not a performance target.
      testTimeout: 20000,
      setupFiles: './src/setupTests.ts',
      // Every file gets a fresh worker: the suites vi.mock the same modules
      // differently and keep state in module scope. Set explicitly, which also
      // stops vitest from printing an "isolate: false is faster" hint per run.
      isolate: true,
      // No test reads computed styles (getComputedStyle is stubbed in
      // setupTests); running the CSS/Tailwind pipeline for every test file
      // only cost time (~12% of the run).
      css: false,
      // src/translations lives outside src/app but carries its own coverage
      // test, so the pattern is src/** rather than src/app/**.
      include: ['src/**/__test__/**/*.{ts,tsx}', 'src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
      // Shared helpers next to the suites are not suites themselves.
      exclude: [...configDefaults.exclude, '**/__test__/helpers.{ts,tsx}'],
      coverage: {
        enabled: isCoverageMode,
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'cobertura'],
        reportsDirectory: './coverage',
        // v8 only instruments files a test imports, so without an explicit
        // include the ~220 untested source files never reach the denominator
        // and the reported number was more than double the real one.
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'node_modules/',
          'src/setupTests.ts',
          '**/*.d.ts',
          '**/*.config.*',
          '**/dist/**',
          'src/app/apis/**/*',
          'src/translations/**/*',
          '**/__test__/**',
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
