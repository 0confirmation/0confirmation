import axios from 'axios';
import url from 'url';
import queryString from 'query-string';
import path from 'path';

export const BLOCKCHAIN_INFO_HOSTNAME = 'blockchain.info';
export const BLOCKCHAIN_INFO_PROTOCOL = 'https:';

export const BLOCKCYPHER_HOSTNAME = 'api.blockcypher.com';
export const BLOCKCYPHER_PROTOCOL = 'https:';

export const BLOCKCYPHER_MAIN_PATHNAME = '/v1/btc/main';

export const formatGetReceivedByAddressUrl = (depositAddress) => url.format({
  hostname: BLOCKCHAIN_INFO_HOSTNAME,
  protocol: BLOCKCHAIN_INFO_PROTOCOL,
  pathname: path.join('/', 'q', 'getreceivedbyaddress', depositAddress),
  search: '?' + queryString.stringify({ confirmations: 0 })
});

export const getReceivedByAddress = async (depositAddress) => {
  const response = await axios({
    method: 'GET',
    url: formatGetReceivedByAddressUrl(depositAddress)
  });
  return response.data;
};

export const BLOCKCHAIN_INFO_GET_LATEST_BLOCK_URL = url.format({
  hostname: 'blockchain.info',
  pathname: path.join('/', 'latestblock')
});

export const CORS_ANYWHERE_LATEST_BLOCK_URL = url.format({
  hostname: 'cors-anywhere.herokuapp.com',
  protocol: 'https:',
  pathname: path.join('/', BLOCKCHAIN_INFO_GET_LATEST_BLOCK_URL)
});

export const getLatestBlockReq = async () => await axios({
  url: url.format({
    protocol: BLOCKCYPHER_PROTOCOL,
    hostname: BLOCKCYPHER_HOSTNAME,
    pathname: BLOCKCYPHER_MAIN_PATHNAME
  }),
  method: 'GET'
});

export const formatGetBlockCountUrl = (depositAddress) => url.format({
  hostname: BLOCKCHAIN_INFO_HOSTNAME,
  protocol: BLOCKCHAIN_INFO_PROTOCOL,
  pathname: path.join('/', 'q', 'getblockcount', depositAddress)
});

export const getBlockCount = async (depositAddress) => {
  const response = await axios({
    method: 'GET',
    url: formatGetBlockCountUrl(depositAddress)
  });
  return response.data;
};

let btcBlock = 0;

export const setLatestBlock = (n) => {
  btcBlock = n;
}

export const getLatestBlock = async () => {
  return btcBlock;
};

/*
export const getLatestBlock = async () => {
  const response = await getLatestBlockReq();
  return Number(response.data.height);
};
*/
