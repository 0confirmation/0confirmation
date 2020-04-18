import React from 'react';
import { Row, Col } from "reactstrap";

export default class LandingPage extends React.Component {
    render() {
        return (
            <>
                <div>
                    <Row className="justify-content-center align-content-center mx-5 px-5 py-5">
                        <Col md="12" lg="12" sm="12" className="justify-content-center align-content-center ">
                            <img src={require("../images/home.svg")} alt=" " width="100%" className="img-fluid"/>
                        </Col>
                    </Row>
                    <Row className="justify-content-center align-content-center mx-auto py-5">
                        <Col lg="2" md="6" sm="6" className="justify-content-center align-content-center">
                            <Row className="mx-auto shadow-lg px-2 rounded py-1 my-2" style={{backgroundColor:"blue", color:"#ffffff"}}>
                                {/* <Col sm="4" md="4" lg="4" className="justify-content-center align-content-center"> */}
                                    <img src={require("../images/col1.svg")} alt=" " width="45rem" className="img-fluid"/>
                                {/* </Col>
                                <Col lg="8" md="8" sm="8" className="justify-content-center h-100 w-100 align-content-center text-center"> */}
                                    <div className="ml-4 text-center justify-content-center align-content-center">Download <br /> Extension</div>
                                {/* </Col> */}
                            </Row>
                        </Col>
                        <Col lg="2" md="6" sm="6" className="justify-content-center align-content-center">
                            <Row className="mx-auto shadow-lg px-2 rounded py-1 my-2" style={{backgroundColor:"blue", color:"#ffffff"}}>
                                {/* <Col sm="4" md="4" lg="4" className="justify-content-center align-content-center"> */}
                                <img src={require("../images/col2.svg")} alt=" " width="45rem" className="img-fluid"/>
                                {/* </Col>
                                <Col lg="8" md="8" sm="8" className="justify-content-center h-100 w-100 align-content-center text-center"> */}
                                    <div className="ml-4 text-center justify-content-center align-content-center">Integration <br /> Docs</div>
                                {/* </Col> */}
                            </Row>
                        </Col>
                        <Col lg="2" md="6" sm="6" className="justify-content-center align-content-center">
                            <Row className="mx-auto shadow-lg px-2 rounded py-1 my-2" style={{backgroundColor:"blue", color:"#ffffff"}}>
                                {/* <Col sm="4" md="4" lg="4" className="justify-content-center align-content-center"> */}
                                    <img src={require("../images/col3.svg")} alt=" " width="45rem" className="img-fluid"/>
                                {/* </Col>
                                <Col lg="8" md="8" sm="8" className="justify-content-center h-100 w-100 align-content-center text-center"> */}
                                <div className="ml-4 text-center justify-content-center align-content-center"> Earn yield <br /> on BTC</div>
                                {/* </Col> */}
                            </Row>
                        </Col>
                        <Col lg="2" md="6" sm="6" className="justify-content-center align-content-center">
                            <Row className="mx-auto shadow-lg px-2 rounded py-1 my-2" style={{backgroundColor:"blue", color:"#ffffff"}}>
                                {/* <Col sm="4" md="4" lg="4" className="justify-content-center align-content-center"> */}
                                    <img src={require("../images/col4.svg")} alt=" " width="45rem" className="img-fluid"/>
                                {/* </Col>
                                <Col lg="8" md="8" sm="8 justify-content-center align-content-center" className="justify-content-center h-100 w-100 align-content-center text-center"> */}
                                <div className="ml-4 text-center justify-content-center align-content-center">Preview <br /> Extension</div>
                                {/* </Col> */}
                            </Row>
                        </Col>
                    </Row>
                </div>
            </>
        );
    }
}
