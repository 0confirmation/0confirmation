# @0confirmation/keeper

WIP package for running a keeper instance in the context of 0confirmation, along with some helper scripts I've had to write to be able to get our own prototype keeper up and running.

## Usage

Create an .env file somewhere and source it with the environment variables PRIVATE_KEY and CHAIN=1 or CHAIN=42 (for Kovan) then fire away. Should work. Make sure you have renBTC

```shell

source .env
node keeper
```
