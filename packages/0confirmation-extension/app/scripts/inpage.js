/*global Web3*/

// need to make sure we aren't affected by overlapping namespaces
// and that we dont affect the app with our namespace
// mostly a fix for web3's BigNumber if AMD's "define" is defined...
let __define

/**
 * Caches reference to global define object and deletes it to
 * avoid conflicts with other global define objects, such as
 * AMD's define function
 */
const cleanContextForImports = () => {
  __define = global.define
  try {
    global.define = undefined
  } catch (_) {
    console.warn('Zero - global.define could not be deleted.')
  }
}

/**
 * Restores global define object from cached reference
 */
const restoreContextAfterImports = () => {
  try {
    global.define = __define
  } catch (_) {
    console.warn('Zero - global.define could not be overwritten.')
  }
}

cleanContextForImports()

import log from 'loglevel'
import LocalMessageDuplexStream from 'post-message-stream'
import ZeroInpageProvider from './inpage-provider'

// TODO:deprecate:Q1-2020
import 'web3/dist/web3.min.js'

import setupDappAutoReload from './lib/auto-reload.js'

restoreContextAfterImports()

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn')

//
// setup plugin communication
//

// setup background connection
const zeroStream = new LocalMessageDuplexStream({
  name: '0cf-inpage',
  target: 'contentscript',
})

// compose the inpage provider
const inpageProvider = new ZeroInpageProvider(zeroStream)

// set a high max listener count to avoid unnecesary warnings
inpageProvider.setMaxListeners(100)

// Work around for web3@1.0 deleting the bound `sendAsync` but not the unbound
// `sendAsync` method on the prototype, causing `this` reference issues

//
// TODO:deprecate:Q1-2020
//

// setup web3

if (typeof window.web3 !== 'undefined') {
  throw new Error(`Zero detected another web3.
     Zero will not work reliably with another web3 extension.
     This usually happens if you have two Zeros installed,
     or Zero and another web3 extension. Please remove one
     and try again.`)
}

// setup dapp auto reload AND proxy web3
setupDappAutoReload(web3, inpageProvider._publicConfigStore)

//
// end deprecate:Q1-2020
//

(async () => {
  let ticks = 0;
  while (true) {
    if (window.ethereum) {
      inpageProvider.connect(window.ethereum);
      break;
    } else {
      ticks++;
      if (ticks === 10) { // we can't wait for a metamask forever
        log.debug('couldn\'t find a MetaMask here');
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
})().catch((err) => log.debug(err.message));
