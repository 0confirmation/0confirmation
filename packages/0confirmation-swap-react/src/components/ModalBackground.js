import React from "react";

export default function ModalBackground(props) {
    return (
        props.isOpen ? <div className="modal-overlay"></div> : <></>
    )
}