import React from "react";
import { Modal, ModalBody } from "reactstrap";

function getNetworkName(currentNetwork) {
    switch (currentNetwork) {
        case 1:
            return "Main";
        case 2:
            return "Morden";
        case 3:
            return "Ropsten";
        case 4:
            return "Rinkeby";
        case 42:
            return "Kovan";
        default:
            return "Unknown";
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
                        borderRadius: " 10px"
                    }} className="h-100 p-3">
                You are using the {currentNetworkName} network.  Please login and switch to the {correctNetworkName} network to continue.
            </ModalBody>
        </Modal>
    )
}