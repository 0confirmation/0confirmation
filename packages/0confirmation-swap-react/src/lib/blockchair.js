'use strict';

import axios from 'axios';

export const getTransaction = async (txid) => {
  const response = await axios.get('https://api.blockchair.com/bitcoin/dashboards/transaction/' + txid);
  return response;
};

export const getTxid = async (depositAddress) => {
  const response = await axios.get('https://api.blockchair.com/bitcoin/dashboards/address/' + depositAddress);
  console.log(response);
  return response;
};
