import {getFees} from './fees';
test('get fast', async () => {
  const fees = (await getFees('0.022'));
  console.log(Object.keys(fees).reduce((r, v) => {
    r[v] = {
      amount: fees[v].amount.toPrecision(),
      ratio: fees[v].ratio.toPrecision()
    };
    return r;
  }, {}));
})
