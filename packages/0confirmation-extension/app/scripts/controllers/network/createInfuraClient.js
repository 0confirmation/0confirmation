import mergeMiddleware from 'json-rpc-engine/src/mergeMiddleware'
import createScaffoldMiddleware from 'json-rpc-engine/src/createScaffoldMiddleware'
import createBlockReRefMiddleware from 'eth-json-rpc-middleware/block-ref'
import createRetryOnEmptyMiddleware from 'eth-json-rpc-middleware/retryOnEmpty'
import createBlockCacheMiddleware from 'eth-json-rpc-middleware/block-cache'
import createInflightMiddleware from 'eth-json-rpc-middleware/inflight-cache'
import createBlockTrackerInspectorMiddleware from 'eth-json-rpc-middleware/block-tracker-inspector'
import providerFromMiddleware from 'eth-json-rpc-middleware/providerFromMiddleware'
import createInfuraMiddleware from 'eth-json-rpc-infura'
import BlockTracker from 'eth-block-tracker'

export default createInfuraClient

function createInfuraClient ({ network }) {
  const infuraMiddleware = createInfuraMiddleware({ network, maxAttempts: 5, source: 'metamask' })
  const infuraProvider = providerFromMiddleware(infuraMiddleware)
  const blockTracker = new BlockTracker({ provider: infuraProvider })

  const networkMiddleware = mergeMiddleware([
    createNetworkAndChainIdMiddleware({ network }),
    createBlockCacheMiddleware({ blockTracker }),
    createInflightMiddleware(),
    createBlockReRefMiddleware({ blockTracker, provider: infuraProvider }),
    createRetryOnEmptyMiddleware({ blockTracker, provider: infuraProvider }),
    createBlockTrackerInspectorMiddleware({ blockTracker }),
    infuraMiddleware,
  ])
  return { networkMiddleware, blockTracker }
}

function createNetworkAndChainIdMiddleware ({ network }) {
  let chainId
  let netId

  switch (network) {
    case 'mainnet':
      netId = '1'
      chainId = '0x01'
      break
    case 'ropsten':
      netId = '3'
      chainId = '0x03'
      break
    case 'rinkeby':
      netId = '4'
      chainId = '0x04'
      break
    case 'kovan':
      netId = '42'
      chainId = '0x2a'
      break
    case 'goerli':
      netId = '5'
      chainId = '0x05'
      break
    default:
      throw new Error(`createInfuraClient - unknown network "${network}"`)
  }

  return createScaffoldMiddleware({
    eth_chainId: chainId,
    net_version: netId,
  })
}
