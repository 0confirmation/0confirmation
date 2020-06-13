
# Overview
0confirmation has been built to bridge the functionality and usability of decentralized finance applications on ethereum with the liquidity of Bitcoin.  Renprotocol did the hard work of creating a protocol for cross chain communicaton that can facilitate moving assets across blockchains. 0cf is focused on 

## The Problem
The problem being addressed stems from the  standard confirmation requirments still being required to complete a cross chain shift.   This means users still need to wait a full 6 confirmations on the bitcoin blockchain before using their newly minted asset on ethereum whcih can regularly take over an hour. In general shifting a native asset from a chain with a long settlement time to one with a shorter settlement time leaves an opportunity to improve the user experience but also address a couple risks.
### Price Risk
While waiting for the standard 6 confirmations for a bitcoin transaction to reach (probabilistic) finality, the price of bitcoin relative to the asset you are looking to acquire can change dramatically.  By allowing the transaction to happen immediately the price risk is removed.

### Distraction Risk
A user can initiate a shift, but then while waiting for the appropriate number of confirmations, lose their focus and forget about what they were going to do.  This can lead to loss of volume for the application they were intending to use or exacerbate price risk.

## The Solution
*0confirmation is solving this problem using an open liquidity pool that issues short term loans managed by a bonded set of keepers.* 

We are committed to being part of a fully decentralized stack facilitating the smooth flow of assets between chains.  In version 1 we will be enabling bitcoin holders to initiate a shift of their BTC onto ethereum and make transactions immediately.  

When a user initiates an eligible shift, keepers monitor the transaction and if they see it as likely to get to full 6 confirmations within the system liquidation threshold they will initiate the loan taking the following steps.
1. Post a bond worth 10% of the loan value 
2. Trigger creation of a borrow wallet contract
3. Initiate loan (deposit renBTC from liquidity pool to borrow wallet)
4. Execute transation payload

Keepers are responsible for monitoring the shift transaction and the proxy wallet.  If the shift transaction is delayed for an extended period of time (set at the protocol level) the borrow wallet can be liquidated (any assets acquired during the loan period are sold for renBTC) to repay the liquidity pool.  Any shortage is made up for by pulling from the keepers' bond to make the liquidity pool whole.

## RenVM
RenVM uses an open group of hundreds or thousands bonded nodes performing secure multiparty computation to generate and store private keys and sign messages across integrated chains.  This allows it to perate as a decentralized custodian, holding assets from one chain and approving the minting of assets on another.

## Terminology
- **Origin Chain** - In a shift, the base chain for the asset that is being shifted
- **Target Chain** - In a shift, the chain on which the asset is being minted on
- **Shift** - Any minting of an asset on a base chain different than its own using renVM
- **Proxy Wallet** - A smart contract that is generated when a 0confirmation shift is accepted that is controlled by the user but is limited in the tasks it can perform.

# Key Features
*In version 1 we are supporting shifts of BTC onto ethereum where it will be represented as an erc20 token renBTC*

## Liquidity Pool
Anyone with renBTC will be able to contribute to a 0confirmation liquidity pool.  This renBTC will be loaned out to those shifting BTC onto ethereum who have opted into the service.  All contributors to the pool will get zeroBTC erc20 token that represents proportional ownership in the liquidity pool.  As fees are earned from the loans they are added to the pool, increasing the value of the pool token (much like uniswap). Liquidity token holders can redeem their tokens for renBTC in the pool at any time.


## Keepers
The 0 confirmation protocol provides an environment for keepers operate in and earn a yield facilitating short term loans. A keeper system is needed to monitor the state of the system and perform necessary actions.

- Monitor target chain for liquidity requests
- Montor origin chain for transactons associated with liquidity requests
- Assess riskiness of originating transaction
- Source Liquidity from liquidity pool
- Trigger proxy wallet creation
- Submit borrowed renBTC and 
- Pay gas needed for ethereum transactions
- 
*Assess riskiness of each shift*
*initiate proxy wallet creation and funding from liquidity pool*
\*If bitcoin transaction fails or is delayed, liquidate proxy wallet to repay liquidity pool
\*If bitcoin transaction is successful, forward assets to target account 

## Proxy Wallet
A proxy wallet is a smart contract wallet that is created for each 0 confirmation transaction.  When a liquidity request is fulfilled the renBTC is delivered to the proxy wallet which then executes the payload transaction(s) and holds onto the resutling assets until 6 confirmations are reached on the intiating transaction or the liquidation threshold is reached. Once that occurs the assets are forwarded on to the users address and the proxy wallet is destroyed 

If 6 confirmations are not aceived before the liquidation threshold (currently 10k ethereum blocks) then the assets in the 


# Security Considerations
There are two ways in which the 0confirmation system can be negatively affected.
1. an origin transaction never reaches 6 confirmations and during the time before liquidation the price of the assets being held as collateral change more than the value of the keeper bond.
2. An origin transaction that had reached one or two confirmations and asset has been forwarded to the users address never reaches 6 confirms.  This leads to a total loss for the system

In honest occurences of the above scenarios the worst that can happen is that the system loses a small amount due to price movements and fees.  Given the maximum timeout threshold is a little over an hour the risk to major losses is minimal.

There are more targeted attacks that could be launched but require larger 0cf loans relative to the available liquidity for an asset being purchased in the transaction payload.  

To counter this there are some parameters that are deployed at the protocol level and managed by zeroDAO.

1. Asset Whitelist
2. Max Loan Size

By controlling these settings we can further limit the probability of any losses being incurred by liquidity providers.

## Fees
0cf charges a fee managed by Zero DAO that is charged on each transaction and distributed as detailed below:
* 45% to Liquidity Pool
* 45% to Keeper
* 10% to Zero DAO

The fees are also controleld by ZeroDAO and can be adjusted as we find the best balance to incentivize the participants
## Zero DAO
0cf is committed to the decentralized ethos of DeFi.  We aim to open up control of some of the parameters of the protocol to the community through a governance DAO.  As we bootstrap the product and find the right parameters to optimize participation the 0cf founders will be the only members of ZeroDAO.



# Links
*0cf telegram*
*renprotocol website*
*renprotocol telegram*


# Things we still need
1.  technical flow bits - describe the p2p network, why it was required, etc
2.  how to be a keeper
3.  apply to become a module


















