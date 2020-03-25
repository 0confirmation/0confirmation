'use strict';

const path = require('path');

module.exports = {
  mode: 'development',
  target: 'web',
  entry: path.join(__dirname, 'lib', 'sdk.js'),
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'zero.bundle.js'
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules(?!\/ren)/,
      use: ['babel-loader']
    }]
  },
  node: {
    fs: 'empty',
    child_process: 'empty'
  },
  resolve: {
    alias: {
      scrypt: 'scrypt-js'
    },
    extensions: ['.js', '.json'],
  }
};
