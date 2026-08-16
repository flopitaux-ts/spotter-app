const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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
  ],
});
