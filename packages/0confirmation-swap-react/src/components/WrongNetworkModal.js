import React from "react";
import { Modal, ModalBody, Col } from "reactstrap";

function getNetworkName(currentNetwork) {
    switch (currentNetwork) {
        case 1:
            return "Main Ethereum Network";
        case 2:
            return "Morden Test Network";
        case 3:
            return "Ropsten Test Network";
        case 4:
            return "Rinkeby Test Network";
        case 42:
            return "Kovan Test Network";
        default:
            return "Unknown Ethereum Network";
    }
}

export default function WrongNetworkModal(props) {
    let currentNetworkName = getNetworkName(props.currentNetwork)
    let correctNetworkName = getNetworkName(props.correctNetwork)
    return (
        <Modal style={{ overflowX: "hidden", minWidth:"40%", height: "40%" }}
        className="dmodal"
        wrapClassName="dmodal"
        modalClassName="dmodal"
        backdropClassName="dmodal"
        contentClassName="dmodal"
        centered
        isOpen={props.modal}
        toggle={props.closeModal}>
            <ModalBody style={{
                        backgroundColor: "#0D0208", border: "1px solid #00FF41", color: "#ffffff",
                        borderRadius: "10px", textAlign: "center"
                    }} className="h-100 p-3">
                <Col>
                    <p style={{height:"10rem", paddingTop: "10%"}}>You are using the <span style={{color:"#00FF41"}}>{currentNetworkName}</span> network.  Please login and switch to the <span style={{color:"#00FF41"}}>{correctNetworkName}</span> network to continue.</p>
                </Col>
            </ModalBody>
        </Modal>
    )
}