import {getFees} from './fees';
test('get fast', async () => {
  const fees = (await getFees('0.022'));
    console.log(fees);
})
