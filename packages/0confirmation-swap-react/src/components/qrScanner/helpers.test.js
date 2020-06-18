import { expect } from 'chai';
import { QR_MAX_SIZE, QR_MIN_SIZE, SPINNER_DEFAULT_SIZE, PX_TO_REM } from './constants';
import { getQrSize, convertSizeToRem, getSpinnerSize } from './helpers';

describe('qr-code helpers', () => {
  describe('getQrSize()', () => {
    it('Should return QR_MIN_SIZE if size arg is lower', () => {
      const sizePx = 10;
      const result = getQrSize(sizePx);
      expect(result).to.equal(QR_MIN_SIZE);
    });
    it('Should return QR_MAX_SIZE if size arg is higher', () => {
      const sizePx = 700;
      const result = getQrSize(sizePx);
      expect(result).to.equal(QR_MAX_SIZE);
    });
  });
  describe('convertSizeToRem()', () => {
    it('Should return pixels size converted to rem size', () => {
      const sizePx = 100;
      const expected = sizePx / PX_TO_REM;
      const result = convertSizeToRem(sizePx);
      expect(result).to.equal(expected);
    });
    it('Should return null if size is invalid', () => {
      const sizePx = '120px';
      const result = convertSizeToRem(sizePx);
      expect(result).to.equal(null);
    });
  });
  describe('getSpinnerSize()', () => {
    it('Should return SPINNER_DEFAULT_SIZE if size converted is larger', () => {
      const sizePx = 100;
      const result = getSpinnerSize(sizePx);
      expect(result).to.equal(SPINNER_DEFAULT_SIZE);
    });
    it('Should return a rem value if size converted is lower than SPINNER_DEFAULT_SIZE', () => {
      const sizePx = 30;
      const expected = `${(sizePx / PX_TO_REM)}rem`;
      const result = getSpinnerSize(sizePx);
      expect(result).to.equal(expected);
    });
  });
});
