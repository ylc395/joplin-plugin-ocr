let TesseractCore = null;

module.exports = (_, res) => {
  if (TesseractCore === null) {
    res.progress({ status: 'loading tesseract core', progress: 0 });
    TesseractCore = __non_webpack_require__('tesseract.js-core');
    res.progress({ status: 'loaded tesseract core', progress: 1 });
  }
  return TesseractCore;
};
