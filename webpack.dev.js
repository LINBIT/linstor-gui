// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { stylePaths } = require('./stylePaths');
const dotenv = require('dotenv');

dotenv.config();

const HOST = process.env.HOST || '127.0.0.1';
const PORT = process.env.PORT || '8000';
const API_HOST = process.env.LINSTOR_API_HOST || 'http://192.168.123.214:3370';
const GATEWAY_API_HOST = process.env.GATEWAY_API_HOST || 'http://192.168.123.214:8080';
const VSAN_API_HOST = process.env.VSAN_API_HOST || 'https://192.168.123.214';

module.exports = merge(common('development'), {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    allowedHosts: 'all',
    host: HOST,
    port: PORT,
    proxy: [
      {
        context: ['/v1'],
        target: API_HOST,
      },
      {
        context: ['/metrics'],
        target: API_HOST,
      },
      {
        context: ['/api/v2'],
        target: GATEWAY_API_HOST,
        changeOrigin: true,
      },
      {
        context: ['/api/frontend/v1'],
        target: VSAN_API_HOST,
        secure: false,
        changeOrigin: true,
      },
      {
        context: [`ws://${HOST}:${PORT}/api/frontend/v1/system/update-with-reboot`],
        target: `${VSAN_API_HOST.replace('https', 'wss')}/api/frontend/v1/system/update-with-reboot`,
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    ],
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        include: [...stylePaths],
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
});
