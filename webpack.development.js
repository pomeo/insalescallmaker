const path = require('path');
const webpack = require('webpack');
const AssetsPlugin = require('assets-webpack-plugin');

module.exports = {
  devtool: 'eval',
  entry: [
    'webpack-dev-server/client?http://localhost:3000',
    'webpack/hot/only-dev-server',
    './src/js/index.js',
  ],
  output: {
    path: path.join(__dirname, 'public/js'),
    filename: 'app.[chunkhash].js',
    publicPath: '/js/',
    vendor: ['react',
             'react-router',
             'lodash',
             'velocity-animate'],
  },
  resolveLoader: {
    root: path.join(__dirname, 'node_modules'),
  },
  module: {
    loader: [{
      test: /\.js$/,
      loader: ['react-hot', 'babel'],
      include: path.join(__dirname, 'src/js'),
    }],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.optimize.CommonsChunkPlugin(
      'vendor',
      'libs.[hash].js'
    ),
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false,
      },
      output: {
        comments: false,
      },
    }),
    new webpack.optimize.DedupePlugin(),
    new AssetsPlugin({
      path: path.join(__dirname, 'routes'),
      filename: 'assets.json',
    }),
  ],
  resolve: {
    extensions: ['', '.js', '.jsx'],
  },
};
