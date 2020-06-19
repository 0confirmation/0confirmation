
import * as blockchair from './blockchair';

test('it should get txid', async () => {
  await blockchair.getTxid('3Ft1DpcKLVXzEa3yDks6yPo1chfHcaYDcH');
});
