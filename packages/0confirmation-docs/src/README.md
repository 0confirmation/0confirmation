

# Getting Started
0confirmation is built to bring the functionality and user experiences of decentralized finance applications  on ethereum to Bitcoin.  Renprotocol did the hard work of bridging assets across blockchains but all standard confirmation thresholds apply, you can read more about how they have accomplished this here.  If you are a user of a chain with fast block times and you shift an asset with slower blocks and higher confirmation requirements the waiting can be burdensome and reduces the benefit of shifting the asset int he first place

0confirmation is solving this problem using an open liquidity pool that issues short term loans managed by a bonded set of keepers.  We are committed to being part of a fully decentralized stack facilitating the sooth flow of assets between chains.  In v1 we will be allowing for bitcoin holders to initiate a shift of their BTC onto ethereum and start using those funds immediately.  By doing this we are able to mitigate a number of risks.


## Price Risk 
While waiting for the standard 6 confirmations for a bitcoin transaction (1 hour or more), the price of bitcoin relative to the asset you are looking to acquire can change dramatically.  By allowing the transaction to happen immediately the price risk is removed.

## Distraction Risk
A user can initiate a shift, but then while waiting for the appropriate number of confirmations, lose their focus and forget about what they were going to do.  This can lead to loss of volume for the application 
They were intending to use or exacerbate price risk.

# How it works

0confirmation issues short-term loans for the time it takes for a transaction to reach the appropriate confirmations required by renVM.  When a user initiates an eligible shift, keepers monitor the transaction and if they see it as likely to get to full 6 confirmations they will initiate the loan taking the following steps.
1. Post a bond worth 10% of the loan value 
2. Trigger creation of a borrow wallet contract
3. Initiate loan (deposit renBTC from liquidity pool to borrow wallet)

Keepers are then responsible for monitoring the shift transaction and the borrow wallet.  If the shift transaction is delayed for an extended period of time (set at the protocol level) the borrow wallet can be liquidated (any assets acquired during the loan period are sold for renBTC) to repay the liquidity pool.  Any shortage is made up for by pulling from the keepers bond to make the liquidity pool whole.  

## RenVM
RenVM uses an open group of hundreds or thousands bonded nodes performing secure multiparty computation to generate and store private keys and sign messages across integrated chains.  This allows it to, in a decentralized manner, hold deposits fo an asset on one chain and mint a representative asset on different chain.

## Terminology
- **Origin Chain** - In a shift, the base chain for the asset that is being shifted
- **Target Chain** - In a shift, the chain on which the asset is being minted on
- **Shift** - Any minting of an asset on a base chain different than its own using renVM
- **Borrow Wallet** - A smart contract that is generated when a 0confirmation shift is accepted that is controlled by the user but is limited in the tasks it can perform.

# Key Features 
*In the first version of the product we are supporting shifts of BTC onto ethereum where it will be represented as an erc20 token renBTC*

## Liquidity Pool
Anyone with renBTC will be able to contribute to a 0confirmation liquidity pool.  This renBTC will be loaned out to those shifting BTC onto ethereum who have opted into the service.  All contributors to the pool will get zero_renBTC erc20 token that represents proportional ownership in the liquidity pool.  As fees are earned from the loans they are added to the pool, increasing the value of the pool token (much like uniswap). Liquidity token holders can redeem their tokens for renBTC in the pool at any time.


## Keepers
A keeper system is needed to monitor the state of the system and perform necessary actions

*Monitor bitcoin blockchain for valid 0 confirmation shift transactions*
*Assess riskiness of each shift*
*initiate proxy wallet creation and funding from liquidity pool*
*If bitcoin transaction fails or is delayed, liquidate proxy wallet to repay liquidity pool
*If bitcoin transaction is successful, forward assets to target account 

## Borrow Wallet

## Zero DAO


# Use Cases

## DeFi

## Point of Sale


# Risks


# Links
*0cf telegram*
*renprotocol website*
*renprotocol telegram*


## How to use it










