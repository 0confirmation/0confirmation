'use strict';

let b = require('./btc');
b = new b({});
b.sendWrapped('btc_getUTXOs', [{
  confirmations: 0,
  address: '3GDD9v5p7mRBmzUuWbaxhfjnX3hAp3RKTx'
}]).then(console.log);
