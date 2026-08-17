const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Load .env so MIXPANEL_TOKEN does not have to be exported by hand on every
// build. A real environment variable still wins, which is what CI relies on.
require('dotenv').config();

module.exports = (_env, argv) => ({
  // Webpack's development default is 'eval', which the renderer's script-src 'self'
  // CSP blocks. Use a real source map in dev and none in the shipped bundle.
  devtool: argv.mode === 'development' ? 'source-map' : false,
  entry: './src/renderer/index.jsx',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'renderer.js',
    clean: true,
  },
  target: 'web',
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
    }),
    // The Mixpanel project token is baked in at build time rather than shipped in
    // the repo. Left undefined, analytics.js disables itself, so local builds and
    // forks never write into the project.
    new webpack.DefinePlugin({
      'process.env.MIXPANEL_TOKEN': JSON.stringify(process.env.MIXPANEL_TOKEN || ''),
    }),
  ],
});
