#!/usr/bin/env python3

# from os.path import expanduser
from web3 import Web3
from web3.middleware import geth_poa_middleware
from tests.deploy import deploy_contract
import json

# Deployment parameters
provider = Web3.HTTPProvider('https://mainnet.infura.io/v3/7d0d81d0919f4f05b9ab6634be01ee73')
# provider = Web3.HTTPProvider('http://127.0.0.1:8545')
POA = True
FUND_DEV = True
N_COINS = 3
SWAP_DEPLOY_ADDRESS = '0x81852cf89dF0FE34716129f1a3f9F065Cf9f8DeC'
COINS_DEPLOY_ADDRESS = '0xC6C362126eB202b8c416266D0AF929317F4d663a'
TOKENS_FUND_ADDRS = ['0x08A9bC278d07FF55A344e9ED57cB57594e9ea9dF',
                     '0x07Aae93f2182e43245Fd35d709d9F8F69aaE4EDD']

HELP = """coins = deploy_test_erc20() to deploy test coins
swap, token = deploy_swap(coins, A, fee) to deploy swap contract from the list
transfer(coins) to fund accounts
====================================================="""

w3 = Web3(provider)
if __name__ == '__main__':
    deploy_contract(w3, 'CurveToken', 'ERC20.vy')
