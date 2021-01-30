"use strict";

import React from "react";
import btcIcon from "@iconify/icons-cryptocurrency/btc";
import daiIcon from "@iconify/icons-cryptocurrency/dai";
import { ethers } from "ethers";
import { Fragment } from "react";
import moment from "moment";
import { InlineIcon } from "@iconify/react";
import * as etherscan from "./etherscan";
import * as utils from "./utils";
import * as bitcoin from './bitcoin-helpers';

export const getStatus = (borrowProxy) => {
  console.log(borrowProxy.pendingTransfers);
  if (!borrowProxy.pendingTransfers) {
    if (borrowProxy.state === 'forced') return 'Forced';
    if (borrowProxy.state === 'signed') return 'Awaiting Deposit';
    if (borrowProxy.state === 'deposited') return 'Awaiting Keeper';
  }
  const record = borrowProxy.pendingTransfers[0];
  if (record.sendEvent && !record.resolutionEvent) {
    return "Pending";
  } else if (
    borrowProxy.address.toLowerCase() ===
    record.resolutionEvent.args.to.toLowerCase()
  ) {
    return "Liquidated";
  } else return "Completed";
};
export const getAddress = (borrow) => {
  if (!borrow.pendingTransfers) return '';
  return borrow.address;
};
export const getEscrow = (borrow) => {
  if (!borrow.pendingTransfers) return '';
  const transfer = borrow.pendingTransfers[0] || {};
  const sendEvent = transfer.sendEvent;
  return sendEvent && sendEvent.args.to || '';
};
export const getSent = (borrow) => {
  if (!borrow.pendingTransfers) return utils.toFormat(borrow.amount, 'btc');
  return utils.toFormat(borrow.decodedRecord.request.amount, "btc");
};
export const getValue = (borrow) => {
  if (!borrow.pendingTransfers) return '';
  return utils.toFormat(
    borrow.pendingTransfers[0].sendEvent.args.value,
    "dai"
  );
};
export const getSentcoin = () => {
  return (
    <Fragment>
      {" "}
      <InlineIcon
        color="#ffffff"
        style={{ fontSize: "2.5em" }}
        className="mr-2"
        icon={btcIcon}
      />
    </Fragment>
  );
};
export const getReceivedcoin = () => {
  return (
    <Fragment>
      {" "}
      <InlineIcon
        color="#ffffff"
        style={{ fontSize: "2.5em" }}
        className="mr-2"
        icon={daiIcon}
      />
    </Fragment>
  );
};
export const getSentname = () => {
  return "BTC";
};
export const getReceivedfullname = () => {
  return "DAI";
};
export const getReceivedname = () => {
  return "DAI";
};
export const getBlocks = async (borrow, zero) => {
  if (!borrow.pendingTransfers) return ''
  return Math.max(
    0,
    Number(borrow.decodedRecord.loan.params.timeoutExpiry) -
      Number(await (zero.getProvider().asEthers()).getBlockNumber())
  );
};
export const getTarget = (borrow) => {
  if (!borrow.pendingTransfers) return '';
  return borrow.pendingTransfers[0].recipient;
};
export const getFees = (borrow) => {
  if (!borrow.pendingTransfers) return '';
  return utils.truncateDecimals(
    (Number(
      ethers.utils.formatEther(borrow.decodedRecord.loan.params.poolFee)
    ) +
      Number(
        ethers.utils.formatEther(borrow.decodedRecord.loan.params.keeperFee)
      )) *
      Number(
        ethers.utils.formatUnits(
          String(borrow.decodedRecord.request.amount),
          utils.DECIMALS.btc
        )
      ),
    4
  );
};
export const getReceived = (borrow) => {
  if (!borrow.pendingTransfers) return '';
  const { sendEvent } = borrow.pendingTransfers[0];
  return sendEvent
    ? utils.toFormat(
        sendEvent && String(sendEvent.args.value),
        "dai"
      )
    : "";
};
export const getSentfullname = () => {
  return "Bitcoin";
};
export const getConfirmations = async (borrow, btcBlock) => {
  if (!borrow.pendingTransfers) return 'N/A';
  const depositAddress = borrow.getDepositAddress();
  if (!localStorage.getItem(depositAddress)) {
    localStorage.setItem(depositAddress, await bitcoin.getBlockCount(depositAddress));
  }
  const blockNo = Number(localStorage.getItem(depositAddress));
  console.log("blockNo: ", blockNo);
  console.log("btcBlock: ", btcBlock);
  return Math.max(0, Math.min(btcBlock - blockNo, 6));
};

export const getTransactionHash = (borrow) => {
  if (!borrow.pendingTransfers) return '';
  return borrow.pendingTransfers[0].sendEvent.transactionHash;
};
export const getCreated = async (zero, borrow) => {
  if (!borrow.pendingTransfers) return '';
  const block = await (zero
    .getProvider()
    .asEthers())
    .getBlock(borrow.pendingTransfers[0].sendEvent.blockHash);
  return moment(new Date(Number(block.timestamp) * 1000)).format(
    "MM/DD/YY HH:mm"
  );
};
export const getReceiveTransactionHash = (borrow) => {
  if (!borrow.pendingTransfers) return '';
  return (
    (borrow.pendingTransfers[0].resolutionEvent &&
      borrow.pendingTransfers[0].resolutionEvent.transactionHash) ||
    ""
  );
};
export const getDepositAddress = (borrow) => {
  if (!borrow.pendingTransfers) return borrow.depositAddress;
  return borrow.getDepositAddress();
};
const wrapLink = (s) => {
  return (fn) => etherscan.createEtherscanLink(s, fn(s));
};
export const getRecord = async (borrow, zero, btcBlock) => {
  return {
    parcel: !borrow.pendingTransfers && borrow,
    created: await getCreated(zero, borrow),
    sentfullname: getSentfullname(borrow),
    address: wrapLink(getAddress(borrow)),
    escrowAddress: wrapLink(getEscrow(borrow)),
    testEscrowAddress: getEscrow(borrow),
    fees: getFees(borrow),
    depositAddress: wrapLink(getDepositAddress(borrow)),
    recipient: wrapLink(getTarget(borrow)),
    transactionHash: wrapLink(getTransactionHash(borrow)),
    receiveTransactionHash: wrapLink(getReceiveTransactionHash(borrow)),
    receivedname: getReceivedname(borrow),
    receivedfullname: getReceivedfullname(borrow),
    sentname: getSentname(borrow),
    received: getReceived(borrow),
    receivedcoin: getReceivedcoin(borrow),
    sentcoin: getSentcoin(borrow),
    sent: getSent(borrow),
    value: getValue(borrow),
    blocks: await getBlocks(borrow, zero),
    confirmations: await getConfirmations(borrow, btcBlock),
    status: getStatus(borrow),
  };
};
export const decorateHistory = (history) => {
  return Object.assign(history, {
    none: {
      target: "",
      recipient: wrapLink(""),
      address: wrapLink(""),
      proxyAddress: wrapLink(""),
      transactionHash: wrapLink(""),
      receiveTransactionHash: wrapLink(""),
      depositAddress: wrapLink(""),
      escrowAddress: wrapLink('')
    },
  });
};
