const Zero = require('../lib/sdk');
const startSignalingServer = require('@0confirmation/webrtc-star');

const makeZero = async (contracts, provider) => {
  const zero = new Zero({
    backends: {
      ethereum: {
        provider
      },
      btc: {
        network: 'testnet'
      },
      renvm: {
        network: 'testnet'
      },
      zero: {
        multiaddr: '/ip4/127.0.0.1/tcp/9090/ws/p2p-webrtc-star/',
        dht: true
      }
    },
    shifterPool: contracts.shifterPool,
    mpkh: contracts.mpkh,
    borrowProxyLib: contracts.borrowProxyLib
  });
  zero.driver.registerBackend(Object.assign(Object.create(mockBtcBackend), {
    driver: zero.driver
  }));
  zero.driver.registerBackend(Object.assign(Object.create(mockRenVMBackend), {
    driver: zero.driver
  }));
  await zero.initializeDriver();
  await timeout(5000);
  return zero;
};

async function generatebtcaddress (){
	  const fixtures = {};
      before(async () => {
    await startSignalingServer();
    fixtures.contracts = await deploy();
    const [ borrower, keeper ] = await Promise.all([
      makeZero(fixtures.contracts, borrowerProvider),
      makeZero(fixtures.contracts, provider)
    ]);
    Object.assign(fixtures, {
      borrower,
      keeper
    });
    await (await fixtures.keeper.approveLiquidityToken(fixtures.contracts.zbtc)).wait();
    await (await fixtures.keeper.addLiquidity(fixtures.contracts.zbtc, utils.parseUnits('5', 8).toString())).wait();
    await (await fixtures.keeper.approvePool(fixtures.contracts.zbtc)).wait();
  })

    const liquidityRequest = fixtures.borrower.createLiquidityRequest({
      token: fixtures.contracts.zbtc,
      amount: utils.parseUnits('2', 8).toString(),
      nonce: '0x68b7aed3299637f7ed8d02d40fb04a727d89bb3448ca439596bd42d65a6e16ce',
      actions: [],
      gasRequested: utils.parseEther('0.01').toString()
    });
    const liquidityRequestParcel = await liquidityRequest.sign();
}

generatebtcaddress();