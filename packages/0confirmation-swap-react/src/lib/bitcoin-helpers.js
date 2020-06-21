import axios from 'axios';
import url from 'url';
import queryString from 'query-string';
import path from 'path';

export const BLOCKCHAIN_INFO_HOSTNAME = 'blockchain.info';
export const BLOCKCHAIN_INFO_PROTOCOL = 'https:';

export const formatGetReceivedByAddressUrl = (depositAddress) => url.format({
  hostname: BLOCKCHAIN_INFO_HOSTNAME,
  protocol: BLOCKCHAIN_INFO_PROTOCOL,
  pathname: path.join('/', 'q', 'getreceivedbyaddress', depositAddress),
  search: '?' + queryString.stringify({ confirmations: 0 })
});

export const getReceivedByAddress = async (depositAddress) => {
  try {
    const response = await axios({
      method: 'GET',
      url: formatGetReceivedByAddressUrl(depositAddress)
    });
    return response.data;
  } catch (e) {
    return Object.getOwnPropertyNames(e).reduce((r, v) => {
      r[v] = e[v];
    }, {});
  }
};

export const BLOCKCHAIN_INFO_GET_LATEST_BLOCK_URL = () => url.format({
  hostname: 'blockchain.info',
  protocol: 'https:',
  pathname: path.join('/', 'latestblock')
});

export const getLatestBlockReq = async () => await axios({
  url: BLOCKCHAIN_INFO_GET_LATEST_BLOCK_URL,
  method: 'GET'
});

export const formatGetBlockCountUrl = (depositAddress) => url.format({
  hostname: BLOCKCHAIN_INFO_HOSTNAME,
  protocol: BLOCKCHAIN_INFO_PROTOCOL,
  pathname: path.join('/', 'q', 'getblockcount', depositAddress)
});

export const getBlockCount = async (depositAddress) => {
  try {
    const response = await axios({
      method: 'GET',
      url: formatGetBlockCountUrl(depositAddress)
    });
    return response.data;
  } catch (e) {
    return Object.getOwnPropertyNames(e).reduce((r, v) => {
      r[v] = e[v];
    }, {});
  }
};

export const getLatestBlock = async () => {
  const response = await getLatestBlockReq();
  return Number(response.data.block_index);
};
