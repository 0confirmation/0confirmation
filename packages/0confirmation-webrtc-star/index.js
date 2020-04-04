'use strict';

const signaling = require('libp2p-webrtc-star/src/sig-server');

module.exports = async ({
  host,
  port,
  metrics
} = {}) => {
  return await signaling.start({
    port: port || 9090,
    host: host || '127.0.0.1',
    metrics: metrics || false
  });
};
