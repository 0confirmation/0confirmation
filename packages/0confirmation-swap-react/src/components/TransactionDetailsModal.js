import React, { useState } from "react";
import { Row, Col, Modal, ModalBody, Tooltip } from "reactstrap";
import infoSvg from "../images/info.svg";
import PendingCheck from "../images/pendingcheck.svg"
import FailCheck from "../images/failcheck.svg"
import CompleteCheck from "../images/completecheck.svg"
import { getSvgForConfirmations } from "../lib/confirmation-image-wheel";

const TransactionDetailsModal = ({
  setTransactionModal,
  transactionModal,
  _history,
  transactionDetails,
  setBlockTooltip,
  blocktooltip,
  btcBlock,
  onFallbackShift,
  ismobile,
}) => {
  const record = _history[transactionDetails];
  const canFallback = record.parcel && record.parcel.isReady && record.status !== 'Forced';
  const [feetooltip, setFeetooltip] = useState(false);
  const closeModal = (e) => {
    e.preventDefault();
    setTransactionModal(false);
  };
  const txHash = _history[transactionDetails].transactionHash(
    (v) =>
      v.substr(0, 6) +
      "..." +
      v.substr(v.length - 5, v.length)
  );
  const closeBtn = (
    <button
      className="btn"
      style={{ color: "#317333", fontSize: transactionModal ? "2em" : "" }}
      onClick={closeModal}
    >
      &times;
    </button>
  );
  return (
    <Modal
      style={{minWidth:"60%", overflowX: "hidden" }}
      className="dmodal  mx-auto"
      wrapClassName="dmodal  mx-auto"
      modalClassName="dmodal  mx-auto"
      backdropClassName="dmodal  mx-auto"
      contentClassName="dmodal  mx-auto"
      centered
      isOpen={transactionModal}
      toggle={async () => {
        setTransactionModal(!transactionModal);
      }}
    >
      <ModalBody
        style={{ 
          backgroundColor: "#0D0208",
          border: "1px solid #00FF41", 
          color: "#ffffff",
          borderRadius: "10px",
       }}
        className="align-content-center justify-content-center py-5"
      >
        <Row>
          <Col
            md="12"
            lg="12"
            sm="12"
            className="justify-content-end align-content-end"
          >
          <Row className="d-flex justify-content-end" style={{ color: "#00FF41", justifyContent:"flex-end", marginTop: "-40px", paddingRight: "1em", height:"50%"}}>
            {closeBtn}
          </Row>
        </Col>
        </Row>
        <Row className="justify-content-center align-content-center">
          <Col
            lg="12"
            md="12"
            sm="12"
            className="justify-content-center align-content-center"
          >
            <p
              className="text-light text-center"
              style={{
                fontWeight: "bolder",
                fontSize: ismobile ? "1.3em" : "2em",
                fontFamily: "PT Sans",
              }}
            >
              Transaction Details
            </p>
          </Col>
        </Row>
        <Row className="justify-content-center align-content-center">
          <Col
            lg="5"
            md="9"
            sm="9"
            className="justify-content-center align-content-center text-center text-light"
          >
            <p style={{ fontWeight: "normal", color:"#00FF41", fontFamily: "PT Sans",fontSize:"0.9em"}}>
              Sent: {_history[`${transactionDetails}`].created}
            </p>
          </Col>
        </Row>
        <Row className="justify-content-center align-content-center">
          <Col
            lg="9"
            md="9"
            sm="9"
            className="justify-content-center align-content-center text-center text-light"
          >
            <p
              className="mx-auto"
              style={{
                color: "#000000",
                width: "10em",
                borderRadius: "5px",
                backgroundColor:
                  _history[`${transactionDetails}`].status === "Awaiting Keeper" || _history[`${transactionDetails}`].status === "Forced"
                  ? "#949B90"
                    : _history[`${transactionDetails}`].status === "Liquidated"
                    ? "#D4533B"
                    : _history[`${transactionDetails}`].status === "Completed"
                    ? "#317333"
                    : "#DAA520",
              }}
            >
              {_history[`${transactionDetails}`].status}
            </p>
          </Col>
        </Row>
        <Row className="justify-content-center align-content-center">
          <Col
            lg="6"
            md="9"
            sm="9"
            className="justify-content-center align-content-center text-light  my-3"
          >
            <Col
              className="w-100 h-100 py-3"
              style={{backgroundColor:"#0D0208", border:"3px solid #008F11", boxShadow:"0px 4px 4px rgba(0, 0, 0, 0.2005)", borderRadius:"20px"}}
              >
              <p
                className="text-center"
                style={{
                  fontWeight: "normal",
                  fontFamily: "PT Sans",
                  fontSize: "0.9em",
                }}
              >
                Sent {_history[`${transactionDetails}`].sentname} (
                {_history[`${transactionDetails}`].sentfullname})
              </p>
              <Row className="justify-content-center align-content-center text-center text-light">
                <Col
                  lg="4"
                  md="4"
                  sm="4"
                  className="justify-content-center align-content-center text-center text-light"
                >
                  {_history[`${transactionDetails}`].sentcoin}
                </Col>
              </Row>
              <Row className="justify-content-center align-content-center text-center text-light">
                <Col
                  lg="4"
                  sm="4"
                  md="4"
                  className="align-content-center justify-content-center text-center text-light my-2"
                >
                  <p
                    style={{
                      fontFamily: "PT Sans",
                      fontStyle: "normal",
                      fontWeight: "bold",
                      fontSize: "1.2em",
                    }}
                  >
                    {_history[`${transactionDetails}`].sent}
                  </p>
                </Col>
              </Row>
              <Row>
                <Col lg="6" md="6" sm="6">
                  <p style={{color:"#ffffff", fontFamily:"PT Sans", fontStyle:"normal", fontWeight:"normal", fontSize:"0.7em"}}>
                    To
                  </p>
                </Col>
                <Col lg="6" md="6" sm="6">
                  <p style={{color:"#00FF41", fontFamily:"PT Sans", fontStyle:"normal", fontWeight:"normal", fontSize:"0.9em"}}>
                    {_history[transactionDetails].depositAddress(
                      (v) =>
                        v.substr(0, 6) +
                        "..." +
                        v.substr(v.length - 5, v.length)
                    )}
                  </p>
                </Col>
              </Row>
              <Row>
                <Col lg="6" md="6" sm="6">
                  <p style={{ color: "#ffffff", fontFamily: "PT Sans", fontStyle: "normal", fontWeight: "normal", fontSize: "0.7em" }}>
                    Fees
                  </p>
                </Col>
                <Col lg="6" md="6" sm="6">
                  <p style={{color:"#00FF41", fontFamily:"PT Sans", fontStyle:"normal", fontWeight:"normal", fontSize:"0.9em"}}>
                    {_history[`${transactionDetails}`].fees} {" "}
                    {_history[`${transactionDetails}`].sentname}
                    <span>
                      <i id="liquidity">
                        <img
                          alt="i"
                          width="20px"
                          className="img-fluid ml-2"
                          src={infoSvg}
                        />
                      </i>
                      <Tooltip
                        placement="top"
                        isOpen={feetooltip}
                        target="liquidity"
                        toggle={() => {
                          setFeetooltip(!feetooltip);
                        }}
                      >
                        Fees are paid to renVM, the keeper handling your transaction, and the 0confirmation liquidity pools
                      </Tooltip>
                    </span>
                  </p>
                </Col>
              </Row>
              <Row>
                <Col lg="6" md="6" sm="6">
                  <p style={{color:"#ffffff", fontFamily:"PT Sans", fontStyle:"normal", fontWeight:"normal", fontSize:"0.7em"}}>
                    Transaction
                  </p>
                </Col>
                <Col lg="6" md="6" sm="6">
                  <p style={{color:"#00FF41", fontFamily:"PT Sans", fontStyle:"normal", fontWeight:"normal", fontSize:"0.9em"}}>
                    <a style={{color:"white", textDecoration: "none"}} href={txHash.props ? txHash.props.href : ''} target="_blank" referrerPolicy="no-referrer">{txHash.props ? txHash.props.children : ''}</a>
                  </p>
                </Col>
              </Row>
              <Row>
                <Col lg="6" md="6" sm="6">
                  <p style={{color:"#ffffff", fontFamily:"PT Sans", fontStyle:"normal", fontWeight:"normal", fontSize:"0.7em"}}>
                    Confirmations
                  </p>
                </Col>
                <Col lg="6" md="6" sm="6">
                  <p
                    style={{
                      color: "#ffffff",
                      fontFamily: "PT Sans",
                      fontStyle: "normal",
                      fontWeight: "normal",
                      fontSize: "0.7em",
                    }}
                  >
                    {" "}
                    {Number(btcBlock) === 0 ? getSvgForConfirmations('N/A') : 
                  (<img
                    alt={`${
                      _history[`${transactionDetails}`].confirmations
                    } of 6`}
                    width="30%"
                    height="30%"
                    src={getSvgForConfirmations(
                      _history[transactionDetails].confirmations
                    )}
                    className="img-fluid"
                  />) 
                  }
                    {" "}
                  </p>
                </Col>
              </Row>
            </Col>
          </Col>
          <Col
            lg="6"
            md="9"
            sm="9"
            className="justify-content-center align-content-center text-light my-3"
          >
            <Col
              className="w-100 h-100 py-3" style={{backgroundColor:"#0D0208", border:"3px solid #008F11", boxShadow:"0px 4px 4px rgba(0, 0, 0, 0.2005)", borderRadius:"20px"}} >
              <p
                className="text-center"
                style={{
                  fontWeight: "normal",
                  fontFamily: "PT Sans",
                  fontSize: "0.9em",
                }}
              >
                Received {_history[`${transactionDetails}`].receivedname} (
                {_history[`${transactionDetails}`].receivedfullname})
              </p>
              <Row className="justify-content-center align-content-center text-center text-light">
                <Col
                  lg="4"
                  md="4"
                  sm="4"
                  className="justify-content-center align-content-center text-center text-light"
                >
                  {_history[`${transactionDetails}`].receivedcoin}
                </Col>
              </Row>
              <Row className="justify-content-center align-content-center text-center text-light">
                <Col
                  lg="4"
                  sm="4"
                  md="4"
                  className="align-content-center justify-content-center text-center text-light my-2"
                >
                  <p
                    style={{
                      fontFamily: "PT Sans",
                      fontStyle: "normal",
                      fontWeight: "bold",
                      fontSize: "1.2em",
                    }}
                  >
                    {_history[`${transactionDetails}`].received}
                  </p>
                </Col>
              </Row>
              <Row>
                <Col lg="6" md="6" sm="6">
                  <p
                    style={{
                     color:"#ffffff",
                      fontFamily: "PT Sans",
                      fontStyle: "normal",
                      fontWeight: "normal",
                      fontSize: "0.7em",
                    }}
                  >
                    Destination
                  </p>
                </Col>
                <Col lg="6" md="6" sm="6">
                  <p
                    style={{
                      color:"#00FF41",
                      fontFamily: "PT Sans",
                      fontStyle: "normal",
                      fontWeight: "normal",
                      fontSize: "0.9em",
                    }}
                  >
                    {_history[`${transactionDetails}`].recipient(
                      (v) =>
                        v.substr(0, 6) +
                        "..." +
                        v.substr(v.length - 5, v.length)
                    )}
                  </p>
                </Col>
              </Row>
              <Row>
                <Col lg="6" md="6" sm="6">
                  <p
                    style={{
                      color:"#ffffff",
                      fontFamily: "PT Sans",
                      fontStyle: "normal",
                      fontWeight: "normal",
                      fontSize: "0.7em",
                    }}
                  >
                    Escrow
                  </p>
                </Col>
                <Col lg="6" md="6" sm="6">
                  <p
                    style={{
                      color:"#00FF41",
                      fontFamily: "PT Sans",
                      fontStyle: "normal",
                      fontWeight: "normal",
                      fontSize: "0.9em",
                    }}
                  >
                    {_history[`${transactionDetails}`].escrowAddress(
                      (v) =>
                        v.substr(0, 6) +
                        "..." +
                        v.substr(v.length - 5, v.length)
                    )}
                  </p>
                </Col>
              </Row>
              <Row>
                <Col lg="6" md="6" sm="6">
                  <p
                    style={{
                      color:"#ffffff",
                      fontFamily: "PT Sans",
                      fontStyle: "normal",
                      fontWeight: "normal",
                      fontSize: "0.7em",
                    }}
                  >
                    Transaction
                  </p>
                </Col>
                <Col lg="6" md="6" sm="6">
                  <p
                    style={{
                      color:"#00FF41",
                      fontFamily: "PT Sans",
                      fontStyle: "normal",
                      fontWeight: "normal",
                      fontSize: "0.9em",
                    }}
                  >
                    {_history[transactionDetails].receiveTransactionHash(
                      (v) =>
                        v.substr(0, 6) +
                        "..." +
                        v.substr(v.length - 5, v.length)
                    )}
                  </p>
                </Col>
              </Row>
              <Row>
                <Col lg="12" md="12" sm="12">
                  <p
                    style={{
                     color:"#ffffff",
                      fontFamily: "PT Sans",
                      fontStyle: "normal",
                      fontWeight: "normal",
                      fontSize: "0.7em",
                    }}
                  >
                    Blocks Until Liquidation
                    <span>
                      <i id="liquidity">
                        <img
                          alt="i"
                          width="18px"
                          className="img-fluid ml-2"
                          src={infoSvg}
                        />
                      </i>
                    </span>
                  </p>
                </Col>
                <Col lg="12" md="12" sm="12" className="mt-n4">
                  <p
                    className="mt-2 text-center"
                    style={{
                      color: "#ffffff",
                      fontFamily: "PT Sans",
                      fontStyle: "normal",
                      fontWeight: "normal",
                      fontSize: "1.8em",
                    }}
                  >
                    {_history[`${transactionDetails}`].blocks}
                  </p>
                  <p
                    style={{
                      color: "#757975",
                      fontFamily: "PT Sans",
                      fontStyle: "normal",
                      fontWeight: "normal",
                      fontSize: "0.8em",
                    }}
                    className="mt-n4 text-center"
                  >
                    out of 10,000
                  </p>
                </Col>
              </Row>
            </Col>
          </Col>
        </Row>
        <Col style={{textAlign: "center"}}>
          <Row style={{paddingLeft: "40%" , alignItems: "flex-start"}}>
            <img src={CompleteCheck} /> <span style={{width: "5px", display: "inline-block", lineHeight: "-5px"}} /> <p style={{display: "inline-block"}}>Initiating Transaction Found</p>
          </Row>
          <Row style={{paddingLeft: "40%" , alignItems: "flex-start"}}>
            <img src={CompleteCheck} /> <span style={{width: "5px", display: "inline-block", lineHeight: "-5px"}} /> <p style={{display: "inline-block"}}>Liquidity Request Created</p>
          </Row>
          <Row style={{paddingLeft: "40%" , alignItems: "flex-start"}}>
            <img src={record.status === 'Forced' ? FailCheck : record.status === 'Awaiting Keeper' ? PendingCheck : CompleteCheck } /> <span style={{width: "5px", display: "inline-block", lineHeight: "-5px"}} /> <p style={{display: "inline-block"}}>Liquidity Request Found by Keeper</p><br />
          </Row>
    { canFallback ? <Row style={{paddingLeft: "45%", alignItems: "first baseline", marginTop: "-10px"}}>
            <p onClick={ onFallbackShift } style={{ color:"#00FF41", cursor: "pointer", fontSize: "14px"}}>Trigger Fallback renVM Shift</p> <i style={{display: "inline-block"}} id="liquidity">
                        <img
                          alt="i"
                          width="20px"
                          className="img-fluid ml-2"
                          src={infoSvg}
                        />
                      </i>
          </Row> : <span></span> }
          <Row style={{paddingLeft: "40%" , alignItems: "flex-start"}}>
            <img src={record.status === 'Pending' || record.status === 'Forced' || record.status === 'Completed' ? CompleteCheck : record.status === 'Liquidated' ? FailCheck : PendingCheck} /> <span style={{width: "5px", display: "inline-block", lineHeight: "-5px"}} /> <p style={{display: "inline-block"}}>Swap Complete</p>
          </Row>
          <Row style={{paddingLeft: "40%" , alignItems: "flex-start"}}>
            <img src={record.status === 'Completed' || record.status === 'Forced' ? CompleteCheck : record.status === 'Liquidated' ? FailCheck : PendingCheck} /> <span style={{width: "5px", display: "inline-block", lineHeight: "-5px"}} /> <p style={{display: "inline-block"}}>Funds Released</p>
          </Row>
          <Row style={{justifyContent: "center", paddingTop: "30px"}}>
            <button style={{color: "#0D0208", fontWeight: "bold", backgroundColor: "#00FF41", maxWidth: "50%"}} onClick={closeModal} className={"btn btn-block rounded-pill text-center"}>
              Close
            </button>
          </Row>
        </Col>
      </ModalBody>
    </Modal>
  );
};

export default TransactionDetailsModal;
