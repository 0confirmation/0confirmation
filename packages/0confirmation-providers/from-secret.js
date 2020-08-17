'use strict';

const { Wallet } = require('@ethersproject/wallet');
const { arrayify, concat, hexlify } = require('@ethersproject/bytes');
const { messagePrefix } = require('@ethersproject/hash');
const { toUtf8Bytes } = require('@ethersproject/strings');
const { makeEngine, makeBaseProvider } = require('./');

const packMessage = (message) => concat([
  toUtf8Bytes(messagePrefix),
  toUtf8Bytes(String(message.length)),
  message
]);

const isHexPrefixed = (s) => s.substr(0, 2) === '0x';

const formatTransaction = (o) => {
  const copy = Object.assign({}, o);
  const gas = copy.gas;
  copy.gasLimit = gas;
  delete copy.gas;
  return copy;
};


const fromSecret = (pvtOrMnemonic, provider) => {
  const wallet = isHexPrefixed(pvtOrMnemonic) ? new Wallet(pvtOrMnemonic) : Wallet.fromMnemonic(pvtOrMnemonic);
  const baseProvider = makeBaseProvider(provider);
  const engine = makeEngine();
  const ethersProvider = baseProvider.asEthers();
  let nonce;
  const getNonce = async () => {
    nonce = nonce || 0;
    let cachedNonce = nonce || 0;
    nonce++;
    const fromNetwork = Number(await ethersProvider.getTransactionCount(wallet.address));
    const useNonce = Math.max(cachedNonce, fromNetwork);
    nonce = Math.max(nonce, fromNetwork + 1);
    return hexlify(useNonce);
  };
  engine.push(async (req, res, next, end) => {
    try {
      switch (req.method) {
        case 'eth_sendTransaction':
          try {
            res.result = await ethersProvider.send('eth_sendRawTransaction', [ await wallet.signTransaction(formatTransaction(Object.assign({}, req.params[0], {
              nonce: await getNonce()
            }))) ]);
            end();
          } catch (e) {
            nonce--;
            res.error = e;
            end();
          }
          return;
          break;
        case 'eth_accounts':
          res.result = [ wallet.address ];
          end();
          return;
          break;
        case 'eth_sign':
          res.result = await wallet.signMessage(arrayify(req.params[0]));
          end();
          return;
          break;
        case 'personal_sign':
          res.result = await wallet.signMessage(arrayify(req.params[0]));
//          res.result = await wallet.signMessage(arrayify(packMessage(req.params[0])));
          end();
          return;
          break;
        default:
          next();
          return;
          break;
      }
    } catch (e) {
      res.error = e;
      end();
    }
  });
  engine.push(baseProvider.asMiddleware());
  return engine.asProvider();
};

module.exports = fromSecret;


