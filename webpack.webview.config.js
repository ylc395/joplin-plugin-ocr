/* eslint-env node */
const { VueLoaderPlugin } = require('vue-loader');

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        loader: ['style-loader', 'css-loader'],
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
        },
      },
      {
        test: /\.js$/,
        include: [/node_modules\/pdfjs-dist/],
        loader: 'ts-loader',
      },
    ],
  },
  plugins: [new VueLoaderPlugin()],
};
