const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { stylePaths } = require('./stylePaths');
const { DefinePlugin } = require('webpack');

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || '8000';

const API_HOST = process.env.LISNTOR_API_HOST || 'http://192.168.123.115:3370';
const GATEWAY_API_HOST = process.env.GATEWAY_API_HOST || 'http://192.168.123.115:8080';
const VSAN_API_HOST = process.env.VSAN_API_HOST || 'https://10.43.4.129';

module.exports = merge(common('development'), {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    contentBase: './dist',
    host: HOST,
    port: PORT,
    compress: true,
    inline: true,
    historyApiFallback: true,
    overlay: true,
    open: true,
    proxy: {
      '/v1': {
        target: API_HOST,
      },
      '/metrics': {
        target: API_HOST,
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
    },
  },
  plugins: [
    new DefinePlugin({
      'process.env.VERSION': 'DEV', // "mock" version in development environment
    }),
  ],
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
