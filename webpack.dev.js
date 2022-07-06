const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { stylePaths } = require('./stylePaths');
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || '8000';

const API_HOST = process.env.APP_BASE_API || 'http://139.155.73.188:43375/';
const GATEWAY_API_HOST = process.env.GATEWAY_API_HOST || 'http://139.155.73.188:48080/';

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
      },
    },
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
