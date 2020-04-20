---
id: intro
title: Key Terms and Roles
sidebar_label: Key Terms
---

# 0confirmation: 101

0confirmation is a PoC for a layer 2 protocol powered by libp2p and RenVM.

It allows for people to get access to funds pushed from a separate blockchain system, without having to wait for the usual confirmation period to start using their funds immediately from a temporary smart contract wallet, called the "borrow proxy."

## What does this mean for me?

You can quickly and seamlessly convert your BTC to ETH. Did we also mention that this is trustless?

## How do I integrate with 0confirmation?

0confirmation provides an SDK. Documentation coming soon!

## Daoist

A decentralized governor, which can vote to set rates (locked in when a borrow proxy is launched), and add new modules to extend the transparent functionality of a borrow proxy. Once added, a module cannot be changed. Modules cannot extend existing borrow proxies. Additionally, when a module is added, there is a safety period that must elapse before the module is valid for use, to ensure liquidity providers can exit the pool in the case of unannounced or otherwise malicious collusion among daoists.


## Liquidity Provider (LP)

An individual or organization who transfers a shifter asset supported by RenVM, into the liquidity pool. The liquidity provider receives a liquidity token which can be burned to receive his proportional stake in the pool at any time

## Keeper

An individual who is allowed to stake some collateral and earn a modest return on a borrow proxy repayment event, by signing a broadcasted liquidity request from a prospective borrower intending to shift in funds. A keeper can run our official image with his desired parameters, which will validate the safety of staking a given signature to borrow by performing the cryptographic computation necessary to ensure that a deposit from a supported chain represents a genuine loan carrying a negligible probability of default. To explain, the parameters used to compute a borrow proxy address are used to compute not only the address of the deposit address on the alternate chain, but also the message signed by the RenVM darknodes. That way, we can show that a BTC deposit is intended to be used only by a borrow proxy, which doesn't exist until the borrow happens. Nifty!

## Borrower

An individual who owns assets, such as BTC, on an alternate chain, and would like to use them as quickly as possible against Ethereum applications, or even simply liquidate to a stablecoin in near realtime. The user can simply make use of the 0cf extension to execute the liquidity access workflows, and the platforms he intends to consume with his borrow proxy can either integrate using the 0cf SDK to use the network in advanced ways, or the user can simply use the extension to use his borrow proxy transparently, without any integration needed by the target application
