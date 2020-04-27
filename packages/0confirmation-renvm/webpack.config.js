'use strict';

const path = require('path');

module.exports = {
  mode: 'development',
  target: 'web',
  entry: path.join(__dirname, 'index.js'),
  output: {
    libraryTarget: 'umd',
    library: 'renvm',
    path: path.join(__dirname),
    filename: 'ren.bundle.js'
  },
  module: {
/*
    rules: [{
      test: /\.js$/,
      exclude: /node_modules(?!\/ren)/,
      use: ['babel-loader']
    }]
*/
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
