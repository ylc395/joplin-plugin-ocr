module.exports = {
  default: function (context: unknown) {
    return {
      plugin: () => {},
      assets: function () {
        return [{ name: 'attach.js' }, { name: 'style.css' }];
      },
    };
  },
};
