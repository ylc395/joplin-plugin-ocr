module.exports = {
  default: function (context: unknown) {
    return {
      plugin: () => {},
      assets: function () {
        return [{ name: 'webview.js' }, { name: 'style.css' }];
      },
    };
  },
};
