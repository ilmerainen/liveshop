import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const isProduction = process.env.NODE_ENV === 'production';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const stylesHandler = isProduction
  ? MiniCssExtractPlugin.loader
  : 'style-loader';

const config = {
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  watch: true,
  devServer: {
    static: path.resolve(__dirname, 'src/assets'),
    compress: true,
    port: 9000,
    // historyApiFallback: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: 'body',
      template: path.resolve(__dirname, './src/index.html'),
      templateParameters: {
        CSS: './dist/[name].css',
      },
    }),
    new CopyWebpackPlugin({
      patterns: [{ from: 'src/assets', to: 'assets' }],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/i,
        loader: 'babel-loader',
      },
      {
        test: /\.css$/i,
        use: [stylesHandler, 'css-loader'],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: 'asset',
      },

      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        test: /\.m?js$/i, // match .js and .mjs files
        extractComments: false, // remove comments
        terserOptions: {
          format: {
            comments: false,
          },
        },
      }),
    ],
  },
  experiments: {
    topLevelAwait: true,
  },
};

export default () => {
  if (isProduction) {
    config.mode = 'production';

    config.plugins.push(
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[id].css',
      }),
    );
  } else {
    config.mode = 'development';
  }
  return config;
};
