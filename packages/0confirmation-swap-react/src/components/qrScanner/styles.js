import styled from 'styled-components';
import { convertSizeToRem, calculateProportion } from './helpers';
import { BORDER_RADIUS_FACTOR, PADDING_FACTOR } from './constants';

export const Image = styled.div`
  background-image: url(${props => props.src});
  opacity: 1;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  font-size: inherit;
`;

export const QRCodeWrap = styled.div`
  position: relative;
  display: flex;
  box-sizing: content-box;
  justify-content: center;
  align-items: center;
  min-width: 1.875rem;
  min-height: 1.875rem;
  width: 1.875rem;
  height: 1.875rem;
  ${({ size }) => size && `
    width: ${convertSizeToRem(size)}rem;
    height: ${convertSizeToRem(size)}rem;
  `}
  ${({ framed, size }) => framed && `
    box-shadow: 0 0 1.25rem rgba(0, 0, 0, 0.1);
    border-radius: ${calculateProportion(size, BORDER_RADIUS_FACTOR)}rem;
    padding: ${calculateProportion(size, PADDING_FACTOR)}rem;
    background: transparent;
  `}
`;
