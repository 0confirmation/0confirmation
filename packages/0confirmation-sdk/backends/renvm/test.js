'use strict';
const payload = {
  tx: {
    to: 'BTC0Btc2Eth',
    in: [
      {
        name: 'p',
        type: 'ext_ethCompatPayload',
        value: {
          abi: 'W3sibmFtZSI6InNoaWZ0SW4iLCJ0eXBlIjoiZnVuY3Rpb24iLCJjb25zdGFudCI6ZmFsc2UsImlucHV0cyI6W3sibmFtZSI6Il9hbW91bnQiLCJ0eXBlIjoidWludDI1NiJ9LHsibmFtZSI6Il9uSGFzaCIsInR5cGUiOiJieXRlczMyIn0seyJuYW1lIjoiX3NpZyIsInR5cGUiOiJieXRlcyJ9XX1d',
          value: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
          fn: 'c2hpZnRJbg=='
        }
      },
      {
        name: 'token',
        type: 'ext_ethCompatAddress',
        value: '215976564DA8dbBbB09e70579862a303b38cbD31'
      },
      {
        name: 'to',
        type: 'ext_ethCompatAddress',
        value: '9dB483A8a4F5A97E59228617Bf9F90040C5f443E'
      },
      {
        name: 'n',
        type: 'b32',
        value: 'aLeu0ymWN/ftjQLUD7BKcn2JuzRIykOVlr1C1lpuFs0='
      },
      {
        name: 'utxo',
        type: 'ext_btcCompatUTXO',
        value: {
          vOut: '1',
          txHash: 'CCtqYlM1PWJohCzfA/SrtYsarixmm8W+piYNay8jvSA='
        }
      }
    ]
  }
}

const RenVMBackend = require('./renvm');

(async () => {
  const backend = new RenVMBackend('mainnet');
  await backend.sendWrapped('ren_submitTx', payload);
})().catch((err) => console.error(err));
