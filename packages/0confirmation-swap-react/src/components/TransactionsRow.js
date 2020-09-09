import React, { useState, Fragment } from 'react'
import { getSvgForConfirmations } from "../lib/confirmation-image-wheel";
import TransactionDetailsModal from "./TransactionDetailsModal";
import Zero from '@0confirmation/sdk';
import environments from '@0confirmation/sdk/environments';
import { ethers } from 'ethers';
import * as persistence from '../lib/persistence';

const CHAIN = process.env.REACT_APP_CHAIN || process.env.CHAIN;

const chainToEnvironmentString = (v) => {
  switch (String(v)) {
    case '1':
      return 'mainnet';
    case '42':
      return 'kovan';
    case 'test':
      return 'buidler';
    default:
      return String(v);
  }
};


const transferAll = environments.getAddresses(chainToEnvironmentString(CHAIN)).transferAll;

export default function TransactionRow(props) {
    const [transactionDetails, setTransactionDetails] = useState("none");
    const [transactionModal, setTransactionModal] = useState(false);
    const shiftFallback = async (evt, parcel) => {
      evt.preventDefault();
      const { zero } = parcel;
      const [ user ] = await zero.getProvider().asEthers().listAccounts();
      const tx = await parcel.executeShiftFallback([
        Zero.staticPreprocessor(transferAll, ethers.utils.defaultAbiCoder.encode(['bytes'], [ ethers.utils.defaultAbiCoder.encode(['address'], [ user ]) ]))
      ]);
      const receipt = await tx.wait();
      if (receipt.logs.length) {
        parcel.state = 'forced';
        persistence.saveLoan(parcel);
      };
    };
    return (
        <Fragment>
            <div key={props.i} 
            style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-around",
                color: "white"
            }}
            onClick={async () => {
                setTransactionDetails(props.i);
                setTransactionModal(!transactionModal);
                }}>
                <div className="break-words" style={{lineHeight:"2.2rem", width: "16.5%"}}>{props.created}</div>
                <div className="break-words" style={{lineHeight:"2.2rem", width: "16.5%"}}>{props.escrowAddress}</div>
                <div className="break-words" style={{width: "16.5%"}}>
                    <img
                        alt={`${props.confirmations} of 6`}
                        // width="30%"
                        // height="30%"
                        src={getSvgForConfirmations(
                            props.confirmations
                        )}
                        className="img-fluid"
                    />
                </div>
                <div className="break-words" style={{lineHeight:"2.2rem", width: "16.5%"}}>{props.sent} {props.sentName}</div>
                <div className="break-words" style={{lineHeight:"2.2rem", width: "16.5%"}}>{props.received} {props.receivedName}</div>
                <div className="break-words" style={{lineHeight:"2.2rem", width: "16.5%"}}>
      { props.parcel && props.parcel.isReady && <button onClick={ (evt) => shiftFallback(evt, props.parcel) } style={ { color: '#000000', backgroundColor: '#317333' } }>Click to force swap</button> || <p
                        style={{
                        color: "#000000",
                        borderRadius: "5px",
                        paddingRight: "10px",
                        paddingLeft: "10px",
                        backgroundColor:
                            props.status === "Liquidated"
                            ? "#D4533B"
                            : props.status === "Completed"
                            ? "#317333"
                            : "#DAA520",
                        }}
                    >
                        {props.status}
                    </p> }
                </div>
                    
            </div>
            <TransactionDetailsModal
                ismobile={props.ismobile}
                setBlockTooltip={props.setBlockTooltip}
                blocktooltip={props.blocktooltip}
                transactionModal={transactionModal}
                _history={props._history}
                transactionDetails={transactionDetails}
                setTransactionModal={setTransactionModal}
            />
        </Fragment>
    )
    
}
