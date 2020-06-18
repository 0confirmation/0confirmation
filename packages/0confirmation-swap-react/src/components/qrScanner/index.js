import React from 'react';
import PropTypes from 'prop-types';
import withImageLoader from 'react-image-loader-hoc';
import { Image, QRCodeWrap } from './styles';
import { getQrImageSrc } from './helpers';
import { QR_DEFAULT_SIZE } from './constants';

const QRImage = withImageLoader(Image);

const QRCode = ({ data, size, ...rest }) => (
  <QRCodeWrap size={size} {...rest}>
    <QRImage
      src={getQrImageSrc(data, size)}
      size={size}
    />
  </QRCodeWrap>
);

QRCode.propTypes = {
  data: PropTypes.string,
  size: PropTypes.number,
};

QRCode.defaultProps = {
  data: null,
  size: QR_DEFAULT_SIZE,
};

export default QRCode;
