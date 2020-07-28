import React from 'react';
import { Row, Card, CardBody, Col, Tooltip } from "reactstrap";
import "../App.css";
import { FaTelegramPlane, FaMedium, FaRedditAlien, FaTwitter } from "react-icons/fa";
import {Link} from "react-router-dom";

export default class LandingPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tooltip1: false,
            tooltip2: false,
            tooltip3: false,
            tooltip4: false,
        }
    }
    render() {
        return (
           <>
                <div className="justify-content-center align-content-center overflow-hidden">
                    <Row className={(this.props.ismobile) ? "justify-content-center align-content-center px-3 mt-5" : "justify-content-center align-content-center landing mt-3 pb-5 px-3"}>
                        <Col lg="10" md="12" sm="12" className="justify-content-center mx-auto align-content-center mt-4 pt-5 pb-5">
                            <Row className="justify-content-center align-content-center">
                                <Col lg="6" md="12" sm="12" className="justify-content-center align-content-center my-auto">
                                    <Row className="justify-content-center align-content-center mx-auto">
                                        <Card className="card-shadow" style={{ backgroundColor: "#0D0208", border:"1px solid #008F11", borderRadius:"20px" }}>
                                            <CardBody>
                                                <Row className="justify-content-center align-content-center mx-auto">
                                                    <Col lg="5" md="5" sm="5" className="justify-content-center align-content-center mx-auto">
                                                        <Row className="justify-content-center align-content-center p-3">
                                                            <img className="img-fluid" src={require("../images/0cflogo.svg")} alt="0CF" />
                                                        </Row>
                                                    </Col>
                                                    <Col lg="7" md="7" sm="7" className="justify-content-start align-content-start mx-auto py-3">
                                                        <Row className="justify-content-start align-content-start px-5">
                                                            <img className="img-fluid" src={require("../images/list.svg")} alt="0CF" />
                                                        </Row>
                                                        <Row className="justify-content-start align-content-start py-3 px-2">
                                                        
                                                        <a href="https://swap.0confirmation.com/trade/swap" style={{ textDecoration: "none"}}>
                                                            <button style={{ backgroundColor: "#008F11", borderRadius: "0.8em"}} className="btn button-small button-text btn-block text-light mx-5 text-center bold">
                                                                Get Started
                                                            </button>
                                                        </a>
                                                        </Row>
                                                    </Col>
                                                </Row>
                                            </CardBody>
                                        </Card>
                                    </Row>
                                </Col>
                                <Col lg="6" md="12" sm="12" className="justify-content-center align-content-center text-light text-center">
                                    <Row className="justify-content-center align-content-center">
                                        <Col lg="6" md="6" sm="6" className="my-4">
                                            <Row className="mx-auto" style={{ height: "100%" }}>
                                                <Card className="card-shadow" style={{ backgroundColor: "#0D0208", width: "250em", border:"1px solid #008F11", borderRadius:"20px" }}>
                                                    <CardBody>
                                                        <Row>
                                                            <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center">
                                                                <Row className="justify-content-center align-content-center">
                                                                    <Col lg="6" md="6" sm="6" className="mx-auto justify-content-center align-content-center my-2">
                                                                        <Row className="mx-auto justify-content-center align-content-center">
                                                                            <img className="img-fluid mx-auto justify-content-center align-content-center " src={require("../images/speed.svg")} alt="Speed" />
                                                                        </Row>
                                                                    </Col>
                                                                    <Col lg="12" md="12" sm="12" className="text-center">
                                                                        <p className="mt-auto mb-auto pt-2 pb-2 header-text">Speed</p>
                                                                    </Col>
                                                                    <Col lg="12" md="12" sm="12">
                                                                        <p className="pb-3 sub-header-text">
                                                                            Use your non-ethereum assets with the most popular DeFi protocols in a fraction of the time it takes to deposit on centralized platforms
                                                                        </p>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center py-3">
                                                                    <a href="https://github.com/0confirmation/0confirmation/tree/master/packages/0confirmation-sdk" style={{ textDecoration: "none"}}>
                                                                        <button style={{ backgroundColor: "#008F11", borderRadius: "0.8em"}} className="btn button-small button-text btn-block text-light text-center bold">
                                                                            Add Your App as a 0cf Module
                                                                        </button>
                                                                    </a>
                                                                </Row>
                                                            </Col>
                                                        </Row>
                                                    </CardBody>
                                                </Card>
                                            </Row>
                                        </Col>
                                        <Col lg="6" md="6" sm="6" className="my-4">
                                            <Row className="mx-auto" style={{ height: "100%" }}>
                                                <Card className="card-shadow" style={{ backgroundColor: "#0D0208", width: "250em", border: "1px solid #008F11", borderRadius: "20px" }}>
                                                    <CardBody>
                                                        <Row className="justify-content-center align-content-center">
                                                            <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center">
                                                                <Row className="justify-content-center align-content-center">
                                                                    <Col lg="6" md="6" sm="6" className="mx-auto justify-content-center align-content-center my-2">
                                                                        <Row className="mx-auto justify-content-center align-content-center">
                                                                            <img className="img-fluid mx-auto justify-content-center align-content-center " src={require("../images/shield.svg")} alt="Speed" />
                                                                        </Row>
                                                                    </Col>
                                                                    <Col lg="12" md="12" sm="12" className="text-center">
                                                                        <p className="mt-auto mb-auto pt-2 pb-2 header-text">Non-Custodial</p>
                                                                    </Col>
                                                                    <Col className="mb-3" lg="12" md="12" sm="12">
                                                                        <p className="sub-header-text">
                                                                            Your keys, your coins.  You stay in control of your assets throughout the process.
                                                                        </p>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center py-3 mt-3">
                                                                    <a href="mailto:jon@0confirmation.com" style={{ textDecoration: "none"}}>
                                                                        <button style={{ backgroundColor: "#008F11", borderRadius: "0.8em"}} className="btn button-small button-text btn-block text-light text-center bold">
                                                                            Reach Out To Be A Keeper
                                                                        </button>
                                                                    </a>
                                                                </Row>
                                                            </Col>
                                                        </Row>
                                                    </CardBody>
                                                </Card>
                                            </Row>
                                        </Col>
                                    </Row>
                                    <Row className="justify-content-center align-content-center">
                                        <Col lg="6" md="6" sm="6" className="justify-content-center align-content-center my-4">
                                            <Row className="mx-auto" style={{ height: "100%" }}>
                                                <Card className="card-shadow" style={{ backgroundColor: "#0D0208", width: "250em", border: "1px solid #008F11", borderRadius: "20px" }}>
                                                    <CardBody>
                                                        <Row className="justify-content-center align-content-center">
                                                            <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center">
                                                                <Row className="justify-content-center align-content-center">
                                                                    <Col lg="6" md="6" sm="6" className="mx-auto justify-content-center align-content-center my-2">
                                                                        <Row className="mx-auto justify-content-center align-content-center">
                                                                            <img className="img-fluid mx-auto justify-content-center align-content-center " src={require("../images/noslippage.svg")} alt="no-slippage" />
                                                                        </Row>
                                                                    </Col>
                                                                    <Col lg="12" md="12" sm="12" className="text-center">
                                                                        <p className="mt-auto mb-auto pt-2 pb-2 header-text">Price Lock</p>
                                                                    </Col>
                                                                    <Col lg="12" md="12" sm="12">
                                                                        <p className="pb-3 sub-header-text">
                                                                            Execute your trade at the price you want directly from your hardware wallet
                                                                        </p>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center py-3">
                                                                    <a href="" style={{ textDecoration: "none"}}>
                                                                        <button style={{ backgroundColor: "#008F11", borderRadius: "0.8em"}} className="btn button-small button-text btn-block text-light text-center bold">
                                                                            Use the App
                                                                        </button>
                                                                    </a>
                                                                </Row>
                                                            </Col>
                                                            
                                                        </Row>
                                                    </CardBody>
                                                </Card>
                                            </Row>
                                        </Col>
                                        <Col lg="6" md="6" sm="6" className="justify-content-center align-content-center my-4">
                                            <Row className="mx-auto" style={{ height: "100%" }}>
                                                <Card className="card-shadow" style={{ flex: "flex-grow", backgroundColor: "#0D0208", minHeight: "15em", width: "250em", border: "1px solid #008F11", borderRadius: "20px" }}>
                                                    <CardBody>
                                                        <Row className="justify-content-center align-content-center">
                                                            <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center">
                                                                <Row className="justify-content-center align-content-center">
                                                                    <Col lg="6" md="6" sm="6" className="mx-auto justify-content-center align-content-center my-2">
                                                                        <Row className="mx-auto justify-content-center align-content-center">
                                                                            <img className="img-fluid mx-auto justify-content-center align-content-center " src={require("../images/income.svg")} alt="Speed" />
                                                                        </Row>
                                                                    </Col>
                                                                    <Col lg="12" md="12" sm="12" className="text-center">
                                                                        <p className="mt-auto mb-auto pt-2 pb-2 header-text">Earn</p>
                                                                    </Col>
                                                                    <Col lg="12" md="12" sm="12">
                                                                        <p className="pb-3 sub-header-text">
                                                                            Add liquidity to the 0cf pool and earn a return from the interest paid on short term loans
                                                                        </p>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center py-3">
                                                                    <a href="https://swap.0confirmation.com/trade/earn" style={{ textDecoration: "none"}}>
                                                                        <button style={{ backgroundColor: "#008F11", borderRadius: "0.8em"}} className="btn button-small button-text btn-block text-light text-center bold">
                                                                            Contribute To The Pool
                                                                        </button>
                                                                    </a>
                                                                </Row>
                                                            </Col>
                                                        </Row>
                                                    </CardBody>
                                                </Card>
                                            </Row>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>

                        </Col>
                        <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center text-center pt-5">
                            <Row className="justify-content-center align-content-center text-center py-4 mt-4">
                                <Col lg="8" md="10" sm="10" className="py-5 text-light mx-3"
                                    style={{ backgroundColor: "#0D0208", border: "1px solid #008F11", fontFamily:"PT Sans", borderRadius: "20px" }}>

                                    <p><h4>Integrated Modules</h4></p>
                                    <Row>
                                        <Col lg="12" md="12" sm="12" className="my-3">
                                            <img className="img-fluid" alt="UNISWAP" width="250em" src={require("../images/uniswap.svg")} />
                                        </Col>
                                        <Col lg="4" md="4" sm="4" className="mx-auto mt-5">
                                            <a href="https://github.com/0confirmation/0confirmation/tree/master/packages/0confirmation-sdk" style={{ textDecoration: "none"}}>
                                                <button style={{ backgroundColor: "#008F11", borderRadius: "0.8em"}} className="btn button-small button-text btn-block text-light text-center bold">
                                                    Integrate 0cf
                                                </button>
                                            </a>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        </Col>


                        <Col lg="12" md="12" sm="12">
                            <Row className="justify-content-center align-content-center text-center py-5 px-3 text-light">
                                
                                <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center text-center">
                                    <Row className="justify-content-center align-content-center text-center py-4">
                                        <Col lg="2" md="12" sm="12" className="align-content-center justify-content-center mx-3 my-2">
                                            <Row className="justify-content-center align-content-center mx-auto">
                                                <Card className="card-shadow py-4" 
                                                    style={{
                                                        backgroundColor: "#0D0208", width: "20em",
                                                        border: "1px solid #008F11", fontFamily: "PT Sans", borderRadius: "20px"
                                                    }}>
                                                    <CardBody>
                                                        <Row className="justify-content-center align-content-center">
                                                            <Col lg="14" md="14" sm="14" className="justify-content-center align-content-center">
                                                                <Row className="justify-content-center align-content-center">
                                                                    <Col lg="14" md="14" sm="14" className="text-center">
                                                                        <p className="header-text">Total Liquidity<span><i id="liquidity"><img alt="i" width="12px" className="img-fluid mb-3 ml-2" src={require("../images/info.svg")} /></i><Tooltip placement="top"
                                                                            isOpen={this.state.tooltip1} target="liquidity" toggle={async (e) => await this.setState({ tooltip1: !this.state.tooltip1 })} >
                                                                            info
                                                                            </Tooltip></span></p>
                                                                    </Col>
                                                                </Row>
                                                                <Col lg="14" md="14" sm="14">
                                                                    <b className="pb-3 sub-header-text">
                                                                        450.392 BTC<br />
                                                                        $4.05M
                                                                    </b>
                                                                </Col>
                                                            </Col>
                                                        </Row>
                                                    </CardBody>
                                                </Card>
                                            </Row>
                                        </Col>
                                        <Col lg="2" mm="12" sm="12" className="align-content-center justify-content-center mx-3 my-2">
                                            <Row className="justify-content-center align-content-center mx-auto">
                                                <Card className="card-shadow py-4" 
                                                style={{  width: "20em", backgroundColor: "#0D0208", border: "1px solid #008F11", fontFamily:"PT Sans", borderRadius: "20px"  }}>
                                                    <CardBody>
                                                        <Row className="justify-content-center align-content-center">
                                                            <Col lg="14" md="14" sm="14" className="justify-content-center align-content-center">
                                                                <Row className="justify-content-center align-content-center">
                                                                    <Col lg="14" md="14" sm="14" className="text-center">
                                                                        <p className="header-text">BTC On Loan<span><i id="loan"><img alt="i" width="12px" className="img-fluid mb-3 ml-2" src={require("../images/info.svg")} /></i><Tooltip placement="top"
                                                                            isOpen={this.state.tooltip2} target="loan" toggle={async (e) => await this.setState({ tooltip2: !this.state.tooltip2 })} >
                                                                            info
                                                                            </Tooltip></span></p>
                                                                    </Col>
                                                                </Row>
                                                                <Col lg="14" md="14" sm="14">
                                                                    <b className="pb-3 sub-header-text">
                                                                        450.392 BTC<br />
                                                                        $4.05M
                                                                    </b>
                                                                </Col>
                                                            </Col>
                                                        </Row>
                                                    </CardBody>
                                                </Card>
                                            </Row>
                                        </Col>
                                        <Col lg="2" mm="12" sm="12" className="align-content-center justify-content-center mx-3 my-2">
                                            <Row className="justify-content-center align-content-center mx-auto">
                                                <Card className="card-shadow py-4" 
                                                style={{ width: "20em", backgroundColor: "#0D0208", border: "1px solid #008F11", fontFamily:"PT Sans", borderRadius: "20px"  }}>
                                                    <CardBody>
                                                        <Row className="justify-content-center align-content-center">
                                                            <Col lg="14" md="14" sm="14" className="justify-content-center align-content-center">
                                                                <Row className="justify-content-center align-content-center">
                                                                    <Col lg="14" md="14" sm="14" className="text-center">
                                                                        <p className="header-text">Idle BTC<span><i id="idle-btc"><img alt="i" width="12px" className="img-fluid mb-3 ml-2" src={require("../images/info.svg")} /></i><Tooltip placement="top"
                                                                            isOpen={this.state.tooltip3} target="idle-btc" toggle={async (e) => await this.setState({ tooltip3: !this.state.tooltip3 })} >
                                                                            info
                                                                            </Tooltip></span></p>
                                                                    </Col>
                                                                </Row>
                                                                <Col lg="14" md="14" sm="14">
                                                                    <b className="pb-3 sub-header-text">
                                                                        450.392 BTC<br />
                                                                        $4.05M
                                                                    </b>
                                                                </Col>
                                                            </Col>
                                                        </Row>
                                                    </CardBody>
                                                </Card>
                                            </Row>
                                        </Col>
                                        <Col lg="2" md="12" sm="12" className="align-content-center justify-content-center mx-3 my-2">
                                            <Row className="justify-content-center align-content-center mx-auto">
                                                <Card className="card-shadow py-4" 
                                                style={{  width: "20em", backgroundColor: "#0D0208", border: "1px solid #008F11", fontFamily:"PT Sans", borderRadius: "20px"  }}>
                                                    <CardBody>
                                                        <Row className="justify-content-center align-content-center">
                                                            <Col lg="14" md="14" sm="14" className="justify-content-center align-content-center">
                                                                <Row className="justify-content-center align-content-center">
                                                                    <Col lg="14" md="14" sm="14" className="text-center">
                                                                        <p className="header-text">Total Returns<span><i id="returns"><img alt="i" width="12px" className="img-fluid mb-3 ml-2" src={require("../images/info.svg")} /></i><Tooltip placement="top"
                                                                            isOpen={this.state.tooltip4} target="returns" toggle={async (e) => await this.setState({ tooltip4: !this.state.tooltip4 })} >
                                                                            info
                                                                            </Tooltip></span></p>
                                                                    </Col>
                                                                </Row>
                                                                <Col lg="14" md="14" sm="14">
                                                                    <b className="pb-3 sub-header-text">
                                                                        450.392 BTC<br />
                                                                        $4.05M
                                                                    </b>
                                                                </Col>
                                                            </Col>
                                                        </Row>
                                                    </CardBody>
                                                </Card>
                                            </Row>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        </Col>

                        <div className="w-75">
                            <div style={{ backgroundColor: "#0D0208", border: "1px solid #008F11", display: "flex", borderRadius: "10px" }} className="py-2">
                                <div style={{paddingLeft: "20px", flex:"1"}}>
                                    <img style={{ width: "100px" }} alt="Powered By" src={require("../images/foot.svg")} />
                                </div>
                                <div style={{paddingRight:"25px", alignSelf:"center", display:"flex", justifyContent:"end", flex:"1"}}>
                                    <Row className="">
                                        <FaMedium size={25} style={{ cursor: "pointer" }} onClick={() => { window.open("https://medium.com/0confirmation"); }} color="#008F11" className="mr-2" />
                                        {/* <FaRedditAlien size={25} style={{cursor:"pointer"}} onClick={()=>{ window.open("https://www.reddit.com/r/RenProject");}} color="#008F11" className="mr-2"/> */}
                                        <FaTelegramPlane size={25} style={{ cursor: "pointer" }} onClick={() => { window.open("https://t.me/zeroconfirmation"); }} color="#008F11" className="mr-2" />
                                        <FaTwitter size={25} style={{ cursor: "pointer" }} onClick={() => { window.open("https://twitter.com/0confirmation"); }} color="#008F11" className="mr-2" />
                                    </Row>
                                </div>
                            </div>
                        </div>
                    </Row>
                    
                </div>
            </>
        );
    }
}
