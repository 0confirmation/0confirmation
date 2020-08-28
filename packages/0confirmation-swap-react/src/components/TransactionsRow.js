import React, { useState, Fragment } from 'react'
import { getSvgForConfirmations } from "../lib/confirmation-image-wheel";
import TransactionDetailsModal from "./TransactionDetailsModal";

export default function TransactionRow(props) {
    const [transactionDetails, setTransactionDetails] = useState("none");
    const [transactionModal, setTransactionModal] = useState(false);
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
                    <p
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
                    </p>
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