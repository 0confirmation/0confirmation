# 0confirmation

0confirmation is a project intended to help bridge the world of userspace dapp development to BTC using RenVM as a transport.

It comes with a suite of Solidity contracts, the parameters of which are authorized to be set by the DAO address, and extensions can be submitted from the same address.

The goal of 0confirmation is to provide a way to issue a short term loan to individuals looking to use the RenVM protocol, and also offer a way that their BTC minting event has its gas paid for out of the BTC swap.

It works because RenVM expects a tuple for a mint event that is something like

(token, amount, nonce, to)

Where in 0confirmation, the "to" address is what we call a "borrow proxy" address which, when we detect an intent to shift, we can trivially prove that it is an address computed from the extra parameters in a 0confirmation mint.

A borrow proxy smart contract can receive regular transactions via its proxy(address,uint256,bytes) call which will accept (to, value, calldata) as parameters, and proxy any transaction. A module in 0confirmation is looked up from the (to, calldata[0:4]) tuple and the transaction is delegated to that module.

Modules can only be voted in by the DAO.

Check @0confirmation/sol/adapters/asset/uniswap-v2 for an example of a handler for a module, which will properly handle any transaction meant for UniswapV2Router02 in the Uniswap V2 system.

The goal is to rewrite the transaction or handle it in a way where no funds escape control of the system, because a borrow proxy implement repayLoan and defaultLoan both, in the case that a RenVM mint was fraudulent or otherwise never comes through. The bond that a "keeper" submits to initialize the borrow must be burned to recoup any losses that the system cannot programmatically recover.

## Example Workflow (https://mainnet.0confirmation.com)

End-user with BTC signs message of structure keccak256((renBTC_address, amount, random_nonce, borrow_script))

Where borrow_script is an array of type

(to, value, calldata)[]

It actually will be one element which is

[(0x00..., 0, arbitrary_execution_script)]

Where the arbitrary_execution_script will run the preprocessor in @0confirmation/sol/contracts/preprocessors/V2SwapAndDrop.sol

Which is deployed to a static address,

The script will delegate to the preprocessor, then will compute the array of tuples as the return value of execute(bytes) and give the contract back:

[(dai_address, 0, erc20_approve_uniswap_for_entire_balance_calldata), (uniswap_v2_router, 0, swapExactTokensForTokens_entire_balance_renbtc_for_dai_calldata)]


The entire payload is sent to the zeronet network (a libp2p hosted network of keepers and borrowers) then picked up by a keeper to be sent with the executeBorrow transaction, which will supply a renBTC bond to secure 10% of the value of the loan, after the keeper verifies that the incoming transfer is from a borrow proxy that will be repaid.

The borrow script will run and the transaction flow will look like:

parse payload, swap some renbtc to eth to repay gas cost, lock up keeper renbtc, deploy borrow proxy to target address, supply with renbtc loan, run preprocessor script to compute transaction objects, send transaction objects to execute them in the context of the borrow proxy through the module system.

For a swap, the module will be looked up for UniswapV2Router02#swapExactTokensForTokens then handled through @0confirmation/sol/adapters/asset/uniswap-v2/UniswapV2Adapter.sol#handle (since the borrow script gives us one transaction to do this)

The repayLoan transaction through the borrow proxy will then move through the repaymentCallback list in the borrow proxy storage, then execute the repay function call on each registered callback once, pausing if more gas is needed, which will simply call the ERC20Adapter.sol repay function

The ERC20Adapter will simply forward escrow'ed funds which will be stored for each ERC20 locked up during the swap (just DAI), then it will selfdestruct the asset forwarders.

For defaultLoan, if the loan defaults, the borrow proxy will move through the defaultCallbacks, which will liquidate all ERC20 tokens held, after returning them from escrow, via UniswapV2Router02, restoring the original value, at least, for the liquidity pool.

## Audit Goals

We'd like to show that the module system is sound, where the DAO is the only governing power that can authorize a module.

We'd like to show that the Uniswap V2 example works properly, and no funds can be lost due to any malice.

We'd like to show that the borrow script system, i.e. the system that will run predefined transactions, is not subject to any malicious behavior. It should properly preprocess transactions if they are submitted without a "to" address, to compute an array of transactions, which should then be proxied to the appropriate modules as necessary. (This is how we have designed mainnet.0confirmation.com as well as will be designing sushiswap)

We'd like to have some guarantee that the supporting libraries in the system are correct for an arbitrary RenVM mint and borrow script, without assuming any given module is correct. For this we can ignore all contracts in adapters/* that do not belong to adapters/asset/uniswap-v2 (which we would like to say works)

