'use strict';

const path = require('path');

module.exports = {
  mode: 'production',
  entry: require.resolve('./plugin/find-imports'),
  target: 'node',
  output: {
    filename: 'compiler-imports-browser.js',
    path: path.join(__dirname, 'build'),
    libraryTarget: 'umd',
    library: 'compilerImports'
  },
  module: {
    rules: [{
      test: /\.js$/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            ['env', {
              targets: {
                node: 'current'
              }
            }]
          ],
          plugins: [ 'babel-plugin-mix-import-module-exports' ]
        }
      }
    }]
  },
};
