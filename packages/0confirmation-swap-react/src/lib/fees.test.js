import {getFast,price} from './fees';
test('get fast', async () => {
  console.log(await getFast());
  console.log(await price());
})
