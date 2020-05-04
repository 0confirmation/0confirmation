import React from 'react';
import '../App.css';
import {
    Row, Col,
    InputGroup,
    InputGroupAddon,
    InputGroupButtonDropdown,
    Input,
    Button,
    DropdownToggle,
    DropdownMenu,
    DropdownItem
} from "reactstrap";
import { Link } from "react-router-dom";
import { FaAngleDown } from 'react-icons/fa';
import { InlineIcon } from '@iconify/react';
import btcIcon from '@iconify/icons-cryptocurrency/btc';
export default class TradeRoom extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            showdetail: true,
            sendOpen:false,
            getOpen: false,
        }
    }

    render() {
        return (
            <>
                <div className="justify-content-center align-content-center pt-5" style={{overflowX:"hidden"}} >
                    <div className="justify-content-center align-content-center text-center mx-auto my-auto pb-4 pt-5">
                        <button className="btn text-light button-small btn-sm" style={{ fontSize: "24dp", backgroundColor: "#317333", width: "248dp", borderRadius: "10px" }}>Connect Wallet</button>
                    </div>
                    <Row className="justify-content-center align-content-center text-center mx-auto">
                        <Col lg="2" md="2" sm="6" className="justify-content-center align-content-center mx-auto w-50" style={{ backgroundColor: "#1F2820", borderRadius: "10px"}}>
                            <Row className="justify-content-center align-content-center p-1 text-light">
                                <Col className="justify-content-center align-content-center py-1" lg="6" md="6" sm="6" style={{ borderRadius: (this.props.ismobile)? "0px":"13px",backgroundColor: (window.location.pathname.split("/")[2] === "swap") ? "#317333" : "" }}>
                                    <Link to="/trade/swap" style={{ outline: "none", textDecoration: "none", color: "#ffffff" }} href="/#"

                                    >Swap</Link>
                                </Col>
                                <Col className="justify-content-center align-content-center py-1" lg="6" md="6" sm="6" style={{ borderRadius: (this.props.ismobile)? "0px":"13px",backgroundColor: (window.location.pathname.split("/")[2] === "earn") ? "#317333" : "" }}>
                                 <Link to="/trade/earn" style={{ outline: "none", textDecoration: "none", color: "#ffffff" }} href="/#"

                                    >Earn</Link>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    <Row className="justify-content-center align-content-center text-center mx-auto my-1">
                        <Col lg="6" md="6" sm="6">
                            <Link to="/" style={{ outline: "none", textDecoration: "none", borderBottom: "1px solid #317333", color: "#317333", fontSize:"0.8em", fontStyle:"normal", fontWeight:"bold" }} href="/#"

                            >Recent Transactions</Link>
                        </Col>
                    </Row>
                    <Row  className="justify-content-center align-content-center text-center">
                        <Col lg="8" md="8" sm="8" style={{ backgroundColor:"#1F2820", borderRadius:"10px 10px 0px 0px", minHeight:"70vh"}} className="shadow-lg mx-4">

                            <Row className="justify-content-center align-content-center text-center mx-auto mt-3">
                                <Col lg="6" md="6" sm="6">
                                    <p style={{fontWeight:"bold", fontStyle:"normal", fontSize:"2em", fontFamily:"PT Sans", color:"#ffffff"}}>0cf Swap</p>
                                </Col>
                            </Row>
                            <Row className="justify-content-center align-content-center text-center mx-auto">
                                <Col lg="12" md="12" sm="12">
                                    <p style={{ fontWeight: "normal", fontStyle: "normal", fontSize: "0.8em", fontFamily: "PT Sans", color: "#ffffff" }}>
                                        Instantly Swap BTC for ETH assets using decentralized exchanges
                                    </p>
                                </Col>
                            </Row>
                            <Row className="justify-content-center align-content-center text-center mx-auto my-3 text-light">
                                <Col lg="4" md="12" sm="12">
                                    <InputGroup>
                                        <Input />
                                        <InputGroupButtonDropdown setActiveFromChild={true} addonType="append" isOpen={this.state.sendOpen} toggle={async (e) => await this.setState({ sendOpen: !this.state.sendOpen})}>
                                            <DropdownToggle caret>
                                                <InlineIcon icon={btcIcon} /> BTC
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <DropdownItem active>Header</DropdownItem>
                                                <DropdownItem>Action</DropdownItem>
                                                <DropdownItem>Another Action</DropdownItem>
                                                <DropdownItem>Another Action</DropdownItem>
                                            </DropdownMenu>
                                        </InputGroupButtonDropdown>
                                    </InputGroup>
                                </Col>
                                <Col lg="2" md="6" sm="6">
                                    <img className="img-fluid" src={require("../images/swapicon.svg")} alt="Swap"/>
                                </Col>
                                <Col lg="4" md="12" sm="12">
                                    <InputGroup>
                                        <Input />
                                        <InputGroupButtonDropdown setActiveFromChild={true} addonType="append" isOpen={this.state.getOpen} toggle={async (e) => await this.setState({ getOpen: !this.state.getOpen })}>
                                            <DropdownToggle caret>
                                                <InlineIcon icon={btcIcon} /> BTC
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <DropdownItem active>Header</DropdownItem>
                                                <DropdownItem>Action</DropdownItem>
                                                <DropdownItem>Another Action</DropdownItem>
                                                <DropdownItem>Another Action</DropdownItem>
                                            </DropdownMenu>
                                        </InputGroupButtonDropdown>
                                    </InputGroup>
                                </Col>
                            </Row>
                            <div className="justify-content-center align-content-center text-center mx-auto my-auto pt-3">
                                <button className="btn text-light button-small btn-sm px-5" style={{ fontSize: "24dp", backgroundColor: "#317333", borderRadius: "10px" }}>Swap</button>
                            </div>
                            <Row className="justify-content-center align-content-center text-center mx-auto py-3">
                                <Col lg="6" md="6" sm="6">
                                    <span onClick={async (e) => await this.setState({ showdetail: !this.state.showdetail })} className="text-light" style={{ fontWeight: "normal", cursor:"pointer", fontStyle: "normal", fontSize: "0.7em", fontFamily: "PT Sans", color: "#ffffff" }}>Details <FaAngleDown/></span>
                                </Col>
                            </Row>
                            {(this.state.showdetail)?
                                <Row className="justify-content-center align-content-center text-center mx-auto mt-1 mb-5">
                                    <Col lg="9" md="9" sm="9" style={{ backgroundColor: "#354737", borderRadius: "10px" }} className="shadow-lg mx-4  py-3">
                                        <p className="text-center" style={{ fontWeight: "normal", fontStyle: "normal", fontSize: "0.8em", fontFamily: "PT Sans", color: "#ffffff" }}>
                                            You are selling <b>.1 BTC</b> for at least <b>825 USDC</b> <br />Expected Price Slippage: <b>.5%</b>  <br />Additional slippage limit: <b>.5%</b>  <br />fee disclosures
                                    </p>
                                    </Col>
                                </Row>:null
                            }
                        </Col>
                    </Row>
                </div>
            </>
        );
    }
}
