import React, { useState, useEffect } from "react";
import { QRCode } from "react-qrcode-logo";
import { Row, Col, Modal, ModalBody } from "reactstrap";
import copySvg from "../images/copy.svg";
import zeroCfSvg from "../images/0cf.svg";

const LoanModal = ({
  waiting,
  modal,
  closeModal,
  _sendcoins,
  _getcoins,
  value,
  calcValue,
  slippage,
  parcel,
  transactionModal,
}) => {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!modal) setCopied(false);
  }, [modal]);
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
      style={{ overflowX: "hidden" }}
      className="dmodal"
      wrapClassName="dmodal"
      modalClassName="dmodal"
      backdropClassName="dmodal"
      contentClassName="dmodal"
      centered
      isOpen={modal}
      toggle={closeModal}
    >
      <ModalBody style={{ backgroundColor: "#1f2820" }} className="h-100">
        <Row className="w-100 align-content-center justify-content-center my-3">
          <Col
            lg="10"
            sm="10"
            md="10"
            className="align-content-center justify-content-center text-center"
          >
            <span
              style={{
                fontSize: "1.7em",
                fontFamily: "PT Sans",
                fontWeight: "bolder",
              }}
              className="mx-auto align-content-center justify-content-center text-center text-light ml-3"
            >
              Bitcoin Payment
            </span>
          </Col>
          <Col lg="1" sm="1" md="1">
            {closeBtn}
          </Col>
        </Row>
        <Row className="w-100 align-content-center justify-content-center text-center text-light">
          <Col
            lg="12"
            sm="12"
            md="12"
            style={{ fontSize: "0.9em" }}
            className="align-content-center justify-content-center text-center text-light"
          >
            You are selling{" "}
            <b>
              {value} {_sendcoins.name}
            </b>{" "}
            for at least{" "}
            <b>
              {calcValue} {_getcoins.name}
            </b>
            <br />
            Expected Price Slippage: <b>{slippage}%</b>
            <br />
            Additional slippage limit: <b>{slippage}%</b>
          </Col>
        </Row>
        <Row className="my-3 align-content-start justify-content-start">
          <Col
            lg="3"
            md="3"
            sm="3"
            className="text-light text-center align-content-start justify-content-start"
          >
            <QRCode
              value={parcel && parcel.depositAddress}
              fgColor="#317333"
              logoHeight={30}
              logoWidth={30}
              logoOpacity={0.5}
              logoImage={zeroCfSvg}
              size={100}
              bgColor="transparent"
              qrStyle="squares"
            />
            {/* <img src={require("../images/barcode.svg")} alt="0CF" className="img-fluid" /> */}
          </Col>
          <Col
            lg="9"
            md="9"
            sm="9"
            className="align-content-start justify-content-start"
          >
            <Row
              style={{ border: "2px solid #317333", borderRadius: "10px" }}
              className="text-light mx-1 h-100 text-center align-content-center justify-content-center"
            >
              <Col
                lg="12"
                md="12"
                sm="12"
                className="text-light text-center align-content-center justify-content-center"
              >
                <span style={{ fontSize: "0.7em" }}>
                  To complete payment, send {value} BTC to the below address
                </span>
              </Col>
              <Col
                lg="12"
                md="12"
                sm="12"
                className="text-light text-center align-content-center justify-content-center"
              >
               
                <span className="mx-1">
                  <b
                    className="mr-1 pb-3"
                    style={{ borderBottom: "1px solid #137333 ",fontSize: "0.72em", letterSpacing: "0.05em", color: "#137333", }}
                  >
                    {parcel && parcel.depositAddress}
                  </b>
                  {copied ? (
                    <b
                      style={{
                        fontSize: "0.79em",
                        letterSpacing: "0.03em",
                        color: "#137333",
                      }}
                    >
                      Copied!
                    </b>
                  ) : (
                    <img
                      onClick={(e) => {
                        e.preventDefault();
                        // e.clipboardData.setData('text/plain', this.state.wallet);
                        navigator.clipboard.writeText(
                          parcel && parcel.depositAddress
                        );
                        setCopied(true);
                        setTimeout(()=>{
                          setCopied(false);
                        }, 1000);
                      }}
                      style={{ cursor: "pointer" }}
                      className="img-fluid"
                      src={copySvg}
                      alt="Copy"
                    />
                  )}
                </span>
              </Col>
              <Col
                lg="12"
                md="12"
                sm="12"
                className="text-light my-3 mx-1 text-center align-content-center justify-content-center"
              ></Col>
            </Row>
          </Col>
        </Row>
        <Row className="align-content-center justify-content-center mt-4 mb-5 text-center text-light">
          <Col
            lg="8"
            sm="8"
            md="8"
            style={{ fontSize: "0.9em" }}
            className="align-content-center justify-content-center"
          >
            <button className="btn btn-block rounded-pill bg-danger text-center text-light">
              {waiting ? "Awaiting Payment" : "Payment Found!"}
            </button>
          </Col>
        </Row>
      </ModalBody>
    </Modal>
  );
};

export default LoanModal;
