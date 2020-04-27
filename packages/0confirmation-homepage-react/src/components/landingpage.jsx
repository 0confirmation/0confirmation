import React from 'react';
import { Row, Col } from "reactstrap";

export default class LandingPage extends React.Component {
    render() {
        return (
            <>
                <div className="justify-content-center align-content-center py-5 overflow-hidden">
                    <Row className="justify-content-center align-content-center mb-5 px-5">
                        <Col md="12" lg="10" sm="12" className="justify-content-center align-content-center ">
                            <img src={require("../images/header.svg")} alt=" " width="100%" className="img-fluid"/>
                        </Col>
                    </Row>
                    {/* <Row className="justify-content-center align-content-center mx-auto py-5">
                        <Col lg="2" md="6" sm="6" className="justify-content-center align-content-center">
                            <Row className="mx-auto shadow-lg px-2 rounded py-1 my-2" style={{ backgroundColor:"#418CDA", color:"#ffffff"}}>
                                    <img src={require("../images/col1.svg")} alt=" " width="45rem" className="img-fluid"/>
                                    <div className="mx-auto text-center justify-content-center align-content-center">Download <br /> Extension</div>
                            </Row>
                        </Col>
                        <Col lg="2" md="6" sm="6" className="justify-content-center align-content-center">
                            <Row className="mx-auto shadow-lg px-2 rounded py-1 my-2" style={{ backgroundColor:"#38559B", color:"#ffffff"}}>
                                <img src={require("../images/col2.svg")} alt=" " width="45rem" className="img-fluid"/>
                                <div className="mx-auto text-center justify-content-center align-content-center">Integration <br /> Docs</div>
                            </Row>
                        </Col>
                        <Col lg="2" md="6" sm="6" className="justify-content-center align-content-center">
                            <Row className="mx-auto shadow-lg px-2 rounded py-1 my-2" style={{ backgroundColor:"#0B3ACB", color:"#ffffff"}}>
                                    <img src={require("../images/col3.svg")} alt=" " width="45rem" className="img-fluid"/>
                                <div className="mx-auto text-center justify-content-center align-content-center"> Earn yield <br /> on BTC</div>
                            </Row>
                        </Col>
                        <Col lg="2" md="6" sm="6" className="justify-content-center align-content-center">
                            <Row className="mx-auto shadow-lg px-2 rounded py-1 my-2" style={{ backgroundColor:"#3F8DDF", color:"#ffffff"}}>
                                <img src={require("../images/col4.svg")} alt=" " width="45rem" className="img-fluid" />
                                <div className="mx-auto text-center justify-content-center align-content-center">Preview <br /> Extension</div>
                            </Row>
                        </Col>
                    </Row> */}
                    <Row className="justify-content-center align-content-center py-5" style={{backgroundColor:"#000000"}}>
                        <Col lg="3" md="12" sm="12" className="justify-content-center align-content-center">
                            <Row className="align-content-center justify-content-center">
                                <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center text-center">
                                    <img src={require("../images/trade.svg")} alt=" " width="50rem" className="img-fluid" />
                                </Col>
                                <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center text-center">
                                    <h5 className="mt-2 text-light"><b>Trade</b></h5>
                                </Col>
                                <Col lg="10" md="12" sm="12" className="justify-content-center align-content-center text-center">
                                    <p style={{ fontSize: "0.8em" }} className="text-light text-break text-center">With 0confirmation shifts,
                                    you can trade your bitcoin on ethereum decentralised exchanges with no price slippage</p>
                                </Col>
                            </Row>
                        </Col>
                        <Col lg="3" md="12" sm="12" className="justify-content-center align-content-center">
                            <Row className="align-content-center justify-content-center">
                                <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center text-center">
                                    <img src={require("../images/earn.svg")} alt=" " width="50rem" className="img-fluid" />
                                </Col>
                                <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center text-center">
                                    <h5 className="mt-2 text-light"><b>Earn</b></h5>
                                </Col>
                                <Col lg="10" md="12" sm="12" className="justify-content-center align-content-center text-center">
                                    <p style={{ fontSize: "0.8em" }} className="text-light text-break text-center">Deposit renBTC to the 0confirmation liquidity pool and earn a yield from short term 0confirmation loans</p>
                                </Col>
                            </Row>
                        </Col>
                        <Col lg="3" md="12" sm="12" className="justify-content-center align-content-center">
                            <Row className="align-content-center justify-content-center">
                                <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center text-center">
                                    <img src={require("../images/integrate.svg")} alt=" " width="50rem" className="img-fluid" />
                                </Col>
                                <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center text-center">
                                    <h5 className="mt-2 text-light"><b>Integrate</b></h5>
                                </Col>
                                <Col lg="10" md="12" sm="12" className="justify-content-center align-content-center text-center">
                                    <p style={{ fontSize: "0.8em" }} className="text-light text-break text-center">Apply to enable integration for your application with 0confirmation and unlock a smooth experience for your users</p>
                                </Col>
                            </Row>
                        </Col>
                    </Row>



                    <Row className="justify-content-center align-content-center py-5 px-5">
                        <Col lg="3" md="12" sm="12" className="justify-content-center align-content-center">
                            <Row className="align-content-center justify-content-center">
                                <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center text-center mb-4">
                                    <img src={require("../images/blip.svg")} alt=" " width="120rem" className="img-fluid" />
                                </Col>
                                <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center text-center">
                                    <p style={{ fontSize: "0.8em" }} className="text-light text-break text-center">
                                        0confirmtion is the first product built using the Bonded Liquidity Protcol (BLP) with Smart Liquidation.
                                    </p>    
                                </Col>
                                {/* <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center text-center">
                                    <button className="btn py-2 text-light" style={{backgroundColor:"#0029FF"}}>BLP Overview</button>
                                </Col> */}
                            </Row>
                        </Col>
                        <Col lg="3" md="12" sm="12" className="justify-content-center align-content-center">
                            <Row className="align-content-center justify-content-center">
                                <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center text-center mb-4">
                                    <img src={require("../images/RenVM.svg")} alt=" " width="200rem" className="img-fluid" />
                                </Col>
                                <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center text-center">
                                    <p style={{ fontSize: "0.8em" }} className="text-light text-break text-center">
                                        Coming out of the renVM community, built to bring the DeFi user experience to all renVM enabled chains
                                    </p>
                                </Col>
                                {/* <Col lg="12" md="12" sm="12" className="justify-content-center align-content-center text-center">
                                    <button className="btn py-2 text-light" style={{backgroundColor:"#0029FF"}}>Learn More About remVM</button>
                                </Col> */}
                            </Row>
                        </Col>
                    </Row>
                </div>
            </>
        );
    }
}
