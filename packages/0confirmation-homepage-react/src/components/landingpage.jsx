import React from 'react';
import { Row, Card, CardBody, Col, Tooltip } from "reactstrap";
import "../App.css";
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
                    <Row className={(this.props.ismobile) ? "justify-content-center align-content-center px-3" : "justify-content-center align-content-center landing px-3"}>
                        <Col lg="10" md="12" sm="12" className="justify-content-center mx-auto align-content-center my-4">
                            <Row className="justify-content-center align-content-center my-5">
                                <Col lg="6" md="12" sm="12" className="justify-content-center align-content-center my-auto">
                                    <Row className="justify-content-center align-content-center mx-auto">
                                        <Card style={{ backgroundColor: "#1F2820" }}>
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
                                        <Col lg="5" md="5" sm="5" className="justify-content-center align-content-center my-2">
                                            <Row className="justify-content-center align-content-center mx-auto">
                                                <Card style={{ backgroundColor: "#1F2820", height:"15em", width:"250em" }}>
                                                    <CardBody>
                                                        <Row className="justify-content-center align-content-center">
                                                            <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center">
                                                                <Row className="justify-content-center align-content-center">
                                                                    <Col lg="6" md="6" sm="6" className="mx-auto justify-content-center align-content-center my-2">
                                                                        <Row className="mx-auto justify-content-center align-content-center">
                                                                            <img className="img-fluid mx-auto justify-content-center align-content-center " src={require("../images/speed.svg")} alt="Speed" />
                                                                        </Row>
                                                                    </Col>
                                                                    <Col lg="12" md="12" sm="12" className="text-center">
                                                                        <p style={{
                                                                            fontSize: "12px", color: "#ffffff",
                                                                            fontFamily: "PT Sans", fontStyle: "normal", fontWeight: "bold"
                                                                        }}>SPEED</p>
                                                                    </Col>
                                                                    <Col lg="12" md="12" sm="12">
                                                                        <p className="pb-3" style={{
                                                                            fontSize: "10px", color: "#ffffff", letterSpacing: "0.2em",
                                                                            fontFamily: "PT Sans", fontStyle: "normal", fontWeight: "normal", textAlign: "center"
                                                                        }}>
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
                                        <Col lg="5" md="5" sm="5" className="justify-content-center align-content-center my-2">
                                            <Row className="justify-content-center align-content-center mx-auto">
                                                <Card style={{ backgroundColor: "#1F2820", height:"15em", width:"250em" }}>
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
                                                                        <p style={{
                                                                            fontSize: "12px", color: "#ffffff",
                                                                            fontFamily: "PT Sans", fontStyle: "normal", fontWeight: "bold"
                                                                        }}>DECENTRALIZATION</p>
                                                                    </Col>
                                                                    <Col lg="12" md="12" sm="12">
                                                                        <p className="pb-3" style={{
                                                                            fontSize: "10px", color: "#ffffff", letterSpacing: "0.2em",
                                                                            fontFamily: "PT Sans", fontStyle: "normal", fontWeight: "normal", textAlign: "center"
                                                                        }}>
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
                                        <Col lg="5" md="5" sm="5" className="justify-content-center align-content-center my-2">
                                            <Row className="justify-content-center align-content-center mx-auto">
                                                <Card style={{ backgroundColor: "#1F2820", height:"15em", width:"250em" }}>
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
                                                                        <p style={{
                                                                            fontSize: "12px", color: "#ffffff",
                                                                            fontFamily: "PT Sans", fontStyle: "normal", fontWeight: "bold"
                                                                        }}>PRICE LOCK</p>
                                                                    </Col>
                                                                    <Col lg="12" md="12" sm="12">
                                                                        <p className="pb-3" style={{
                                                                            fontSize: "10px", color: "#ffffff", letterSpacing: "0.2em",
                                                                            fontFamily: "PT Sans", fontStyle: "normal", fontWeight: "normal", textAlign: "center"
                                                                        }}>
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
                                        <Col lg="5" md="5" sm="5" className="justify-content-center align-content-center my-2">
                                            <Row className="justify-content-center align-content-center mx-auto">
                                                <Card style={{ backgroundColor: "#1F2820", height:"15em", width:"250em" }}>
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
                                                                        <p style={{
                                                                            fontSize: "12px", color: "#ffffff",
                                                                            fontFamily: "PT Sans", fontStyle: "normal", fontWeight: "bold"
                                                                        }}>SPEED</p>
                                                                    </Col>
                                                                    <Col lg="12" md="12" sm="12">
                                                                        <p className="pb-3" style={{
                                                                            fontSize: "10px", color: "#ffffff", letterSpacing: "0.2em",
                                                                            fontFamily: "PT Sans", fontStyle: "normal", fontWeight: "normal", textAlign: "center"
                                                                        }}>
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
                        <Col lg="12" md="12" sm="12" className="bg-light justify-content-center align-content-center text-center">
                            <Row className="bg-light justify-content-center align-content-center text-center">
                                <h6 style={{ color: "#141513", fontFamily:"PT Sans", fontSize:"28px", fontStyle:"normal"}}><b>Where Can I Use 0cf?</b></h6>
                            </Row>
                        </Col>
                        <Col lg="12" md="12" sm="12" className="bg-light justify-content-center align-content-center text-center">
                            <Row className="bg-light justify-content-center align-content-center text-center py-4">
                                <Col lg="2" md="4" sm="8" className="align-content-center justify-content-center px-3">
                                    <img className="img-fluid" alt="UNISWAP" width="250em" src={require("../images/uniswap.svg")}/>
                                </Col>
                                <Col lg="2" md="4" sm="8" className="align-content-center justify-content-center px-3 py-2">
                                    <img className="img-fluid" width="250em" alt="CURVE" src={require("../images/curve.svg")}/>
                                </Col>
                            </Row>
                        </Col>
                        <Col lg="3" md="3" sm="2" className="bg-light justify-content-center align-content-center text-center">
                            <Row className="bg-light justify-content-center align-content-center text-center">
                                <button className="btn button-small btn-block w-auto text-light text-center bold my-3"
                                    style={{ backgroundColor: "#317333", borderRadius:"0.8em" }}>Integrate 0cf</button>
                            </Row>
                        </Col>
                    </Row>
                    <Row className={(this.props.ismobile) ? "" : "footer"}>
                        <Col lg="12" md="12" sm="12">
                            <Row className="justify-content-center align-content-center text-center py-5 px-3">
                                <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center text-center">
                                    <Row className="justify-content-center align-content-center text-center">
                                        <h6 style={{ color: "#ffffff", fontFamily: "PT Sans", fontSize: "28px", fontStyle: "normal" }}><b>Usage Statistics</b></h6>
                                    </Row>
                                </Col>
                                <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center text-center">
                                    <Row className="justify-content-center align-content-center text-center py-4">
                                        <Col lg="2" md="12" sm="12" className="align-content-center justify-content-center mx-3 my-2">
                                            <Row className="justify-content-center align-content-center mx-auto">
                                                <Card style={{ backgroundColor: "#1F2820",width:"20em" }}>
                                                    <CardBody>
                                                        <Row className="justify-content-center align-content-center">
                                                            <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center">
                                                                <Row className="justify-content-center align-content-center">
                                                                    <Col lg="12" md="12" sm="12" className="text-center">
                                                                        <p style={{
                                                                            fontSize: "15px", color: "#ffffff",
                                                                            fontFamily: "PT Sans", fontStyle: "normal", fontWeight: "bold"
                                                                        }}><span><b>Total Liquidity</b><span><i id="liquidity"><img alt="i" width="12px" className="img-fluid mb-3 ml-2" src={require("../images/info.svg")}/></i><Tooltip placement="top"
                                                                            isOpen={this.state.tooltip1} target="liquidity" toggle={async (e) => await this.setState({ tooltip1: !this.state.tooltip1 })} >
                                                                                info
                                                                            </Tooltip></span></span></p>
                                                                    </Col>
                                                                    <Col lg="12" md="12" sm="12">
                                                                        <b className="pb-3" style={{
                                                                            fontSize: "20px", color: "#ffffff", 
                                                                            fontFamily: "PT Sans", fontStyle: "normal", fontWeight: "normal", textAlign: "center"
                                                                        }}>
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
                                                <Card style={{ backgroundColor: "#1F2820", width: "20em" }}>
                                                    <CardBody>
                                                        <Row className="justify-content-center align-content-center">
                                                            <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center">
                                                                <Row className="justify-content-center align-content-center">
                                                                    <Col lg="12" md="12" sm="12" className="text-center">
                                                                        <p style={{
                                                                            fontSize: "15px", color: "#ffffff",
                                                                            fontFamily: "PT Sans", fontStyle: "normal", fontWeight: "bold"
                                                                        }}><b>BTC On Loan</b><span><i id="loan"><img alt="i" width="12px" className="img-fluid mb-3 ml-2" src={require("../images/info.svg")}/></i><Tooltip placement="top"
                                                                            isOpen={this.state.tooltip2} target="loan" toggle={async (e) => await this.setState({ tooltip2: !this.state.tooltip2 })} >
                                                                                info
                                                                            </Tooltip></span></p>
                                                                    </Col>
                                                                    <Col lg="12" md="12" sm="12">
                                                                        <b className="pb-3" style={{
                                                                            fontSize: "20px", color: "#ffffff", 
                                                                            fontFamily: "PT Sans", fontStyle: "normal", fontWeight: "normal", textAlign: "center"
                                                                        }}>
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
                                                <Card style={{ backgroundColor: "#1F2820", width: "20em" }}>
                                                    <CardBody>
                                                        <Row className="justify-content-center align-content-center">
                                                            <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center">
                                                                <Row className="justify-content-center align-content-center">
                                                                    <Col lg="12" md="12" sm="12" className="text-center">
                                                                        <p style={{
                                                                            fontSize: "15px", color: "#ffffff",
                                                                            fontFamily: "PT Sans", fontStyle: "normal", fontWeight: "bold"
                                                                        }}><span><b>Idle BTC</b><span><i id="idle-btc"><img alt="i" width="12px" className="img-fluid mb-3 ml-2" src={require("../images/info.svg")}/></i><Tooltip placement="top"
                                                                            isOpen={this.state.tooltip3} target="idle-btc" toggle={async (e) => await this.setState({ tooltip3: !this.state.tooltip3 })} >
                                                                                info
                                                                            </Tooltip></span></span></p>
                                                                    </Col>
                                                                    <Col lg="12" md="12" sm="12">
                                                                        <b className="pb-3" style={{
                                                                            fontSize: "20px", color: "#ffffff", 
                                                                            fontFamily: "PT Sans", fontStyle: "normal", fontWeight: "normal", textAlign: "center"
                                                                        }}>
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
                                                <Card style={{ backgroundColor: "#1F2820", width: "20em" }}>
                                                    <CardBody>
                                                        <Row className="justify-content-center align-content-center">
                                                            <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center">
                                                                <Row className="justify-content-center align-content-center">
                                                                    <Col lg="12" md="12" sm="12" className="text-center">
                                                                        <p style={{
                                                                            fontSize: "15px", color: "#ffffff",
                                                                            fontFamily: "PT Sans", fontStyle: "normal", fontWeight: "bold"
                                                                        }}><span><b>Total Returns</b><span><i id="returns"><img alt="i" width="12px" className="img-fluid mb-3 ml-2" src={require("../images/info.svg")}/></i><Tooltip placement="top"
                                                                            isOpen={this.state.tooltip4} target="returns" toggle={async (e) => await this.setState({ tooltip4: !this.state.tooltip4 })} >
                                                                                info
                                                                            </Tooltip></span></span></p>
                                                                    </Col>
                                                                    <Col lg="12" md="12" sm="12">
                                                                        <b className="pb-3" style={{
                                                                            fontSize: "20px", color: "#ffffff", 
                                                                            fontFamily: "PT Sans", fontStyle: "normal", fontWeight: "normal", textAlign: "center"
                                                                        }}>
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
                        <Col lg="12" md="12" sm="12">
                            <Row>
                                <img className="img-fluid w-10 h-25 mx-4" alt="Powered By" src={require("../images/foot.svg")} />
                            </Row>
                        </Col>
                   </Row>
                </div>
            </>
        );
    }
}
