import * as blockchain from './bitcoin-helpers';

test('should lookup blockcount', async () => {
//  console.log(await blockchain.getLatestBlock());
  console.log(await blockchain.getReceivedByAddress('3Ft1DpcKLVXzEa3yDks6yPo1chfHcaYDcH'));
 // console.log(await blockchain.getBlockCount('3Ft1DpcKLVXzEa3yDks6yPo1chfHcaYDcH'));
  console.log(await blockchain.getBlockCount('3Ft1DpcKLVXzEa3yDks6yPo1chfHcaYDcF'));
});
