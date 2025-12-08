const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true,
    publicPath: '',
  },
  devtool:
    process.env.NODE_ENV === 'production'
      ? 'source-map' // Separate .map files for production
      : 'eval-source-map', // Faster rebuilds for development
  stats: {
    children: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  devServer: {
    static: './public',
    historyApiFallback: true,
    port: 3000,
    open: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(ttf|woff|woff2|eot|otf)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public',
          globOptions: {
            ignore: ['**/index.html'],
          },
        },
        {
          from: 'node_modules/@chobantonov/jsonforms-angular-webcomponent/dist/jsonforms-angular-webcomponent',
          to: 'jsonforms-angular-webcomponent',
        },
        {
          from: 'node_modules/@chobantonov/jsonforms-vue-webcomponent/dist',
          to: 'jsonforms-vue-webcomponent',
        },
      ],
    }),
    new MonacoWebpackPlugin({
      languages: ['json'],
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
};
