/* eslint-env node */
const { VueLoaderPlugin } = require('vue-loader');
const tsImportPluginFactory = require('ts-import-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        loader: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: { postcssOptions: { config: './src/driver/dialogView/postcss.config.js' } },
          },
        ],
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.tsx?$/,
        exclude: [/node_modules/],
        loader: 'ts-loader',
        options: {
          appendTsSuffixTo: [/\.vue/],
          transpileOnly: true,
          getCustomTransformers: () => ({
            before: [
              tsImportPluginFactory({
                libraryName: 'ant-design-vue',
                style: 'css',
                libraryDirectory: 'es',
                failIfNotFound: true,
              }),
            ],
          }),
          compilerOptions: {
            module: 'es2015',
          },
        },
      },
      {
        test: /\.js$/,
        include: [/node_modules\/pdfjs-dist/],
        loader: 'ts-loader',
      },
    ],
  },
  plugins: [new VueLoaderPlugin(), new ForkTsCheckerWebpackPlugin()],
};
