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
                <div className="justify-content-center align-content-center overflow-hidden pt-5">
                    <Row className={(this.props.ismobile) ? "justify-content-center align-content-center px-3" : "justify-content-center align-content-center landing px-3"}>
                        <Col lg="10" md="12" sm="12" className="justify-content-center mx-auto align-content-center my-4">
                            <Row className="justify-content-center align-content-center my-5">
                                <Col lg="6" md="12" sm="12" className="justify-content-center align-content-center my-auto">
                                    <Row className="justify-content-center align-content-center mx-auto">
                                        <Card className="card-shadow" style={{ backgroundColor: "#1F2820" }}>
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
                                                            <button className="btn button-small btn-block text-light mx-5 text-center bold" style={{ backgroundColor: "#317333", borderRadius: "0.8em" }}>Get Started</button>
                                                        </Row>
                                                    </Col>
                                                </Row>
                                            </CardBody>
                                        </Card>
                                    </Row>
                                </Col>
                                <Col lg="6" md="12" sm="12" className="justify-content-center align-content-center">
                                    <Row className="justify-content-center align-content-center">
                                        <Col lg="6" md="6" sm="6" className="my-4">
                                            <Row className="mx-auto" style={{height:"100%"}}>
                                                <Card className="card-shadow" style={{ backgroundColor: "#1F2820", width:"250em" }}>
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
                                                                            Access your non-ETH based assets on DeFi nearly instantly
                                                                            </p>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>
                                                    </CardBody>
                                                </Card>
                                            </Row>
                                        </Col>
                                        <Col lg="6" md="6" sm="6" className="my-4">
                                            <Row className="mx-auto" style={{height:"100%"}}>
                                                <Card className="card-shadow" style={{ backgroundColor: "#1F2820", width:"250em" }}>
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
                                                                        <p className="mt-auto mb-auto pt-2 pb-2 header-text">Decentralization</p>
                                                                    </Col>
                                                                    <Col className="mb-3" lg="12" md="12" sm="12">
                                                                        <p className="sub-header-text">
                                                                            Third parties will not control your assets while they are being transferred to their end destination
                                                                            </p>
                                                                    </Col>
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
                                        <Row className="mx-auto" style={{height:"100%"}}>
                                                <Card className="card-shadow" style={{ backgroundColor: "#1F2820", width:"250em" }}>
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
                                                                            0cf will lock in your price at time of execution, providing access to DeFi with no slippage
                                                                        </p>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>
                                                    </CardBody>
                                                </Card>
                                            </Row>
                                        </Col>
                                        <Col lg="6" md="6" sm="6" className="justify-content-center align-content-center my-4">
                                            <Row className="justify-content-center align-content-center mx-auto">
                                                <Card className="card-shadow" style={{ flex:"flex-grow", backgroundColor: "#1F2820", minHeight:"15em", width:"250em" }}>
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
                                                                        <p className="mt-auto mb-auto pt-2 pb-2 header-text">Income</p>
                                                                    </Col>
                                                                    <Col lg="12" md="12" sm="12">
                                                                        <p className="pb-3 sub-header-text">
                                                                            Add liquidity to the 0cf pool and earn income from short term loan interest
                                                                        </p>
                                                                    </Col>
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
                    </Row>
                    <Row className="bg-light justify-content-center align-content-center text-center py-5 px-3">
                        <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center text-center" style={{backgroundColor:"rgb(249, 250, 251)"}}>
                            <Row className="bg-light justify-content-center align-content-center text-center">
                                <h6 className="header-text" style={{ color: "#212529", fontSize:"42px", paddingTop:"40px"}}><b>Where Can I Use 0cf?</b></h6>
                            </Row>
                        </Col>
                        <Col lg="12" md="12" sm="12" className="bg-light justify-content-center align-content-center text-center">
                            <Row className="bg-light justify-content-center align-content-center text-center py-4">
                                <Col lg="3" md="4" sm="8" className="py-5">
                                    <Card className="card-shadow py-5">
                                        <CardBody>
                                            <img className="img-fluid" alt="UNISWAP" width="250em" src={require("../images/uniswap.svg")}/>
                                        </CardBody>
                                    </Card>
                                </Col>
                                <Col lg="3" md="4" sm="8" className="py-5">
                                <Card className="card-shadow py-5" style={{height:"100%"}}>
                                        <CardBody className="justify-content-center align-content-center" style={{display:"flex"}}>
                                            <img className="img-fluid" width="250em" style={{alignItems:"center", display:"inline-block"}} alt="CURVE" src={require("../images/curve.svg")}/>
                                        </CardBody>
                                    </Card>
                                    
                                </Col>
                            </Row>
                        </Col>
                        <Col lg="3" md="3" sm="2" className="bg-light justify-content-center align-content-center text-center">
                            <Row className="bg-light justify-content-center align-content-center text-center py-5">
                                <Link style={{textDecoration:"none"}} to="/"><p className="inline-block" style={{color: "#317333", fontSize:"24px", fontWeight:"bold"}}>Integrate 0cf →</p></Link>
                            </Row>
                        </Col>
                    </Row>
                    <Row className={(this.props.ismobile) ? "" : "footer"}>
                        <Col lg="12" md="12" sm="12">
                            <Row className="justify-content-center align-content-center text-center py-5 px-3">
                                <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center text-center">
                                    <Row className="justify-content-center align-content-center text-center">
                                        <h6 className="header-text" style={{fontSize: "42px", paddingTop: "40px", paddingBottom: "40px"}}><b>Usage Statistics</b></h6>
                                    </Row>
                                </Col>
                                <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center text-center">
                                    <Row className="justify-content-center align-content-center text-center py-4">
                                        <Col lg="2" md="12" sm="12" className="align-content-center justify-content-center mx-3 my-2">
                                            <Row className="justify-content-center align-content-center mx-auto">
                                                <Card className="card-shadow py-4" style={{ backgroundColor: "#1F2820",width:"20em" }}>
                                                    <CardBody>
                                                        <Row className="justify-content-center align-content-center">
                                                            <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center">
                                                                <Row className="justify-content-center align-content-center">
                                                                    <Col lg="12" md="12" sm="12" className="text-center">
                                                                        <p className="header-text">Total Liquidity<span><i id="liquidity"><img alt="i" width="12px" className="img-fluid mb-3 ml-2" src={require("../images/info.svg")}/></i><Tooltip placement="top"
                                                                            isOpen={this.state.tooltip1} target="liquidity" toggle={async (e) => await this.setState({ tooltip1: !this.state.tooltip1 })} >
                                                                                info
                                                                            </Tooltip></span></p>
                                                                    </Col>
                                                                    <Col lg="12" md="12" sm="12">
                                                                        <b className="pb-3 sub-header-text">
                                                                            450.392 BTC<br/>
                                                                            $4.05M
                                                                        </b>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>
                                                    </CardBody>
                                                </Card>
                                            </Row>
                                        </Col>
                                        <Col lg="2" mm="12" sm="12" className="align-content-center justify-content-center mx-3 my-2">
                                            <Row className="justify-content-center align-content-center mx-auto">
                                                <Card className="card-shadow py-4" style={{ backgroundColor: "#1F2820", width: "20em" }}>
                                                    <CardBody>
                                                        <Row className="justify-content-center align-content-center">
                                                            <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center">
                                                                <Row className="justify-content-center align-content-center">
                                                                    <Col lg="12" md="12" sm="12" className="text-center">
                                                                        <p className="header-text">BTC On Loan<span><i id="loan"><img alt="i" width="12px" className="img-fluid mb-3 ml-2" src={require("../images/info.svg")}/></i><Tooltip placement="top"
                                                                            isOpen={this.state.tooltip2} target="loan" toggle={async (e) => await this.setState({ tooltip2: !this.state.tooltip2 })} >
                                                                                info
                                                                            </Tooltip></span></p>
                                                                    </Col>
                                                                    <Col lg="12" md="12" sm="12">
                                                                        <b className="pb-3 sub-header-text">
                                                                            450.392 BTC<br/>
                                                                            $4.05M
                                                                        </b>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>
                                                    </CardBody>
                                                </Card>
                                            </Row>
                                    </Col>
                                        <Col lg="2" mm="12" sm="12" className="align-content-center justify-content-center mx-3 my-2">
                                            <Row className="justify-content-center align-content-center mx-auto">
                                                <Card className="card-shadow py-4" style={{ backgroundColor: "#1F2820", width: "20em" }}>
                                                    <CardBody>
                                                        <Row className="justify-content-center align-content-center">
                                                            <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center">
                                                                <Row className="justify-content-center align-content-center">
                                                                    <Col lg="12" md="12" sm="12" className="text-center">
                                                                        <p className="header-text">Idle BTC<span><i id="idle-btc"><img alt="i" width="12px" className="img-fluid mb-3 ml-2" src={require("../images/info.svg")}/></i><Tooltip placement="top"
                                                                            isOpen={this.state.tooltip3} target="idle-btc" toggle={async (e) => await this.setState({ tooltip3: !this.state.tooltip3 })} >
                                                                                info
                                                                            </Tooltip></span></p>
                                                                    </Col>
                                                                    <Col lg="12" md="12" sm="12">
                                                                        <b className="pb-3 sub-header-text">
                                                                            450.392 BTC<br/>
                                                                            $4.05M
                                                                        </b>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>
                                                    </CardBody>
                                                </Card>
                                            </Row>
                                    </Col>
                                        <Col lg="2" md="12" sm="12" className="align-content-center justify-content-center mx-3 my-2">
                                            <Row className="justify-content-center align-content-center mx-auto">
                                                <Card className="card-shadow py-4" style={{ backgroundColor: "#1F2820", width: "20em" }}>
                                                    <CardBody>
                                                        <Row className="justify-content-center align-content-center">
                                                            <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center">
                                                                <Row className="justify-content-center align-content-center">
                                                                    <Col lg="12" md="12" sm="12" className="text-center">
                                                                        <p className="header-text">Total Returns<span><i id="returns"><img alt="i" width="12px" className="img-fluid mb-3 ml-2" src={require("../images/info.svg")}/></i><Tooltip placement="top"
                                                                            isOpen={this.state.tooltip4} target="returns" toggle={async (e) => await this.setState({ tooltip4: !this.state.tooltip4 })} >
                                                                                info
                                                                            </Tooltip></span></p>
                                                                    </Col>
                                                                    <Col lg="12" md="12" sm="12">
                                                                        <b className="pb-3 sub-header-text">
                                                                            450.392 BTC<br/>
                                                                            $4.05M
                                                                        </b>
                                                                    </Col>
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
                        <Col lg="12" md="12" sm="12" className="align-content-start justify-content-start py-4">
                            <Row className="align-content-start justify-content-start">
                                <Col lg="2" md="2" sm="2" className="align-content-start justify-content-start">
                                    <img className="img-fluid ml-5" style={{width:"100px"}} alt="Powered By" src={require("../images/foot.svg")} />
                                </Col>
                                <Col lg="2" md="2" sm="2" className="align-content-start justify-content-start">
                                    <span style={{color:"#ffffff", fontFamily:"PT Sans", fontStyle:"normal", fontWeight:"normal", fontSize:"0.8em"}}>Follow Us</span>
                                    <Row className="align-content-start justify-content-start ml-1">
                                        <FaMedium size={20} style={{cursor:"pointer"}} onClick={()=>{ window.open("https://medium.com");}} color="#317333" className="mr-2"/>
                                        <FaRedditAlien size={20} style={{cursor:"pointer"}} onClick={()=>{ window.open("https://reddit.com");}} color="#317333" className="mr-2"/>
                                        <FaTelegramPlane size={20} style={{cursor:"pointer"}} onClick={()=>{ window.open("https://telegram.com");}} color="#317333" className="mr-2"/>
                                        <FaTwitter size={20} style={{cursor:"pointer"}} onClick={()=>{ window.open("https://twitter.com");}} color="#317333" className="mr-2"/>
                                    </Row>
                                </Col>
                            </Row>
                        </Col>
                   </Row>
                </div>
            </>
        );
    }
}
