# @0confirmation/keeper

WIP package for running a keeper instance in the context of 0confirmation, along with some helper scripts I've had to write to be able to get our own prototype keeper up and running.

## Usage

The 0cf Keeper can be run reliably as a service by performing the below steps:
- Fund an ethereum address with Eth and renBTC (As of April 15, 2021 the suggested minimum amounts are .1 BTC and 1 ETH)
- Copy the `.env.example` file to `.env`
```
cp .env.example .env
```
- Export the private key for the Keeper address and store it in your new `.env` file.
- Fill in the remaining required fields with data.  The current chains available are `1 - Ethereum Mainnet`, `42 - Kovan Ethereum Testnet`, and `buidler - local buidler environment`
- Copy the `zero-keeper.service` file to `/etc/systemd/system/zero-keeper.service`
- Update the service file to have the correct user and pathnames
- run `systemctl start zero-keeper.service`
