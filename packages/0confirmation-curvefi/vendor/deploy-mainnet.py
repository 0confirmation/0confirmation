#!/usr/bin/env python3

# from os.path import expanduser
from web3 import Web3
from web3 import middleware
from web3.gas_strategies.time_based import fast_gas_price_strategy
from tests.deploy import deploy_contract
import json

from deployment_config import DEPLOYER_ADDRESS

# Deployment parameters
provider = Web3.IPCProvider('~/.ethereum/geth.ipc', timeout=10000, request_kwargs={'timeout': 10000})
POA = False
N_COINS = 2
OLD_CONTRACT = "0x2e60CF74d81ac34eB21eEff58Db4D385920ef419"
OLD_TOKEN = "0x3740fb63ab7a09891d7c0d4299442A551D06F5fD"
NEW_CONTRACT = "0xA2B47E3D5c44877cca798226B7B8118F9BFb7A56"
NEW_TOKEN = "0x845838DF265Dcd2c412A1Dc9e959c7d08537f8a2"
C_COINS = [
        '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643',
        '0x39AA39c021dfbaE8faC545936693aC917d5E7563']
GETH_PASSWORD = None

w3 = Web3(provider)
w3.eth.setGasPriceStrategy(fast_gas_price_strategy)

w3.middleware_onion.add(middleware.time_based_cache_middleware)
w3.middleware_onion.add(middleware.latest_block_based_cache_middleware)
w3.middleware_onion.add(middleware.simple_cache_middleware)

if POA:
    w3.middleware_onion.inject(middleware.geth_poa_middleware, layer=0)
_ = w3.eth.accounts


def deploy():
    if GETH_PASSWORD:
        w3.geth.personal.unlockAccount(w3.eth.accounts[0], GETH_PASSWORD)
    migration_contract = deploy_contract(
            w3, ['migration.vy'], DEPLOYER_ADDRESS,
            OLD_CONTRACT, OLD_TOKEN, NEW_CONTRACT, NEW_TOKEN, C_COINS,
            replacements={
                '___N_COINS___': str(N_COINS),
                '___N_ZEROS___': '[' + ', '.join(['ZERO256'] * N_COINS) + ']'
            })

    abi = json.dumps(migration_contract.abi, indent=True)
    with open('migration.abi', 'w') as f:
        f.write(abi)
    print('---=== ABI ===---')
    print(abi)
    print('=================')
    print('Migration contract:', migration_contract.address)

    return migration_contract


if __name__ == '__main__':
    deploy()
