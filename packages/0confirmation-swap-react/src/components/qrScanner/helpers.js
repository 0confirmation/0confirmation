import { QR_MAX_SIZE, QR_MIN_SIZE, PX_TO_REM, SPINNER_DEFAULT_SIZE } from './constants';

export const getQrSize = sizePx => {
  if (sizePx < QR_MIN_SIZE) {
    return QR_MIN_SIZE;
  }
  if (sizePx > QR_MAX_SIZE) {
    return QR_MAX_SIZE;
  }
  return sizePx;
};

export const getQrImageSrc = (data, sizePx = QR_MIN_SIZE) => {
  if (!data) {
    return null;
  }
  const qrSize = getQrSize(sizePx);
  return `https://chart.googleapis.com/chart?chs=${qrSize}x${qrSize}&choe=UTF-8&chld=M|0&cht=qr&chl=${data}`;
};

export const convertSizeToRem = (sizePx = QR_MIN_SIZE) => getQrSize(sizePx) / PX_TO_REM || null;

export const getSpinnerSize = sizePx => {
  const maxSize = parseInt(SPINNER_DEFAULT_SIZE, 10);
  const convertedSize = convertSizeToRem(sizePx);
  return convertedSize > maxSize ? SPINNER_DEFAULT_SIZE : `${convertedSize}rem`;
};

export const calculateProportion = (size, factor) => convertSizeToRem(size) / factor;
