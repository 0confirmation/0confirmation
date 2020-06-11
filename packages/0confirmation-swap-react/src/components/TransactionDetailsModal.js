import React, { useState } from "react";
import { Row, Col, Modal, ModalBody, Tooltip } from "reactstrap";
import infoSvg from "../images/info.svg";
import { getSvgForConfirmations } from "../lib/confirmation-image-wheel";

const TransactionDetailsModal = ({
  setTransactionModal,
  transactionModal,
  _history,
  transactionDetails,
  setBlockTooltip,
  blocktooltip,
  ismobile,
}) => {
  const [feetooltip, setFeetooltip] = useState(false);
  const closeModal = (e) => {
    e.preventDefault();
    setTransactionModal(false);
  };
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
      style={{ minWidth: ismobile ? "60%" : "60%", overflowX: "hidden" }}
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
        style={{ backgroundColor: "#1f2820" }}
        className="align-content-center justify-content-center py-5"
      >
        <Row>
          <Col
            md="12"
            lg="12"
            sm="12"
            className="justify-content-end align-content-end"
          >
            <span className="ml-auto">{closeBtn}</span>
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
            <p
              style={{
                fontWeight: "normal",
                fontFamily: "PT Sans",
                fontSize: "0.9em",
              }}
            >
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
                  _history[`${transactionDetails}`].status === "Liquidated"
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
              style={{
                backgroundColor: "#354737",
                boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.2005)",
                borderRadius: "20px",
              }}
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
                  <p
                    style={{
                      color: "#757975",
                      fontFamily: "PT Sans",
                      fontStyle: "normal",
                      fontWeight: "normal",
                      fontSize: "0.7em",
                    }}
                  >
                    To
                  </p>
                </Col>
                <Col lg="6" md="6" sm="6">
                  <p
                    style={{
                      color: "#ffffff",
                      fontFamily: "PT Sans",
                      fontStyle: "normal",
                      fontWeight: "normal",
                      fontSize: "0.9em",
                    }}
                  >
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
                  <p
                    style={{
                      color: "#757975",
                      fontFamily: "PT Sans",
                      fontStyle: "normal",
                      fontWeight: "normal",
                      fontSize: "0.7em",
                    }}
                  >
                    Fees
                  </p>
                </Col>
                <Col lg="6" md="6" sm="6">
                  <p
                    style={{
                      color: "#ffffff",
                      fontFamily: "PT Sans",
                      fontStyle: "normal",
                      fontWeight: "normal",
                      fontSize: "0.9em",
                    }}
                  >
                    {_history[`${transactionDetails}`].fees}
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
                        info
                      </Tooltip>
                    </span>
                  </p>
                </Col>
              </Row>
              <Row>
                <Col lg="6" md="6" sm="6">
                  <p
                    style={{
                      color: "#757975",
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
                      color: "#ffffff",
                      fontFamily: "PT Sans",
                      fontStyle: "normal",
                      fontWeight: "normal",
                      fontSize: "0.9em",
                    }}
                  >
                    {_history[`${transactionDetails}`].transactionHash(
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
                      color: "#757975",
                      fontFamily: "PT Sans",
                      fontStyle: "normal",
                      fontWeight: "normal",
                      fontSize: "0.7em",
                    }}
                  >
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
                    <img
                      alt={`${
                        _history[`${transactionDetails}`].confirmations
                      } of 6`}
                      width="30%"
                      height="30%"
                      src={getSvgForConfirmations(
                        _history[transactionDetails].confirmations
                      )}
                      className="img-fluid"
                    />{" "}
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
              className="w-100 h-100 py-3"
              style={{
                backgroundColor: "#354737",
                boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.2005)",
                borderRadius: "20px",
              }}
            >
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
                      color: "#757975",
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
                      color: "#ffffff",
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
                      color: "#757975",
                      fontFamily: "PT Sans",
                      fontStyle: "normal",
                      fontWeight: "normal",
                      fontSize: "0.7em",
                    }}
                  >
                    Proxy
                  </p>
                </Col>
                <Col lg="6" md="6" sm="6">
                  <p
                    style={{
                      color: "#ffffff",
                      fontFamily: "PT Sans",
                      fontStyle: "normal",
                      fontWeight: "normal",
                      fontSize: "0.9em",
                    }}
                  >
                    {_history[`${transactionDetails}`].address(
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
                      color: "#757975",
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
                      color: "#ffffff",
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
                      color: "#757975",
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
                      <Tooltip
                        placement="top"
                        isOpen={blocktooltip}
                        target="liquidity"
                        toggle={() => {
                          setBlockTooltip(!blocktooltip);
                        }}
                      >
                        info
                      </Tooltip>
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
      </ModalBody>
    </Modal>
  );
};

export default TransactionDetailsModal;
