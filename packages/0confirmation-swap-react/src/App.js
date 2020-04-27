import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Row, Col, Modal, ModalBody, Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from "reactstrap";
import { async } from 'q';
const randomBytes = require('random-bytes').sync;

const { ZeroMock } = require('@0confirmation/sdk/dist');
const ethers = require('ethers');

let provider = new ethers.providers.Web3Provider(window.ethereum);

const zero = new ZeroMock(window.ethereum);
const { getAddresses } = require('@0confirmation/sdk/environments');

const contracts = getAddresses();

export default class App extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      value:0,
      rate:2000,
      coin: "BTC",
      calcValue: 0,
      percentage: 0.5,
      sliplimit: 0.5,
      modal: false,
      address: "X93jdjd90dkakdjdlalhhdohodhohofhohohdlslhjhlfhjslhjhkhk",
      menu: false,
      selectedAddress: '0x' + Array(40).fill('0').join(''),
      parcel: null,
      borrowProxy: null
    }
  }
  async componentDidMount() {
    await zero.initializeDriver();
    this.setState({
      selectedAddress: window.ethereum.selectedAddress
    });
  }
  async requestLoan() {
    const liquidityRequest = zero.createLiquidityRequest({
      token: contracts.renbtc,
      amount: this.state.value,
      nonce: '0x' + randomBytes(32).toString('hex'),
      gasRequested: ethers.utils.parseEther('0.01').toString()
    });
    console.log('signing');
    const parcel = await liquidityRequest.sign();
    await parcel.broadcast();
    console.log('broadcasted');
    this.setState({
      parcel,
      borrowProxy: await parcel.getBorrowProxy()
    });
  }
  render() {
    return (
      <>
        <div style={{minHeight:"100vh", overflowX:"hidden", backgroundColor:"#000000", fontFamily:"Arial"}} className="App pb-5 pt-4 px-5">
          <Modal isOpen={this.state.modal} centered fade style={{minWidth:"50vw"}} toggle={async () => await this.setState({ modal: !this.state.modal })}>
            <ModalBody>
              <div style={{ border: "1px solid #000000" }} className="m-3 py-5">
                <Row className="align-content-center justify-content-center">
                  <h6>Send</h6>
                </Row>
                <Row className="align-content-center justify-content-center">
                  <h4><b>{this.state.value} BTC</b></h4>
                </Row>
                <Row className="align-content-center justify-content-center">
                  <h6>to</h6>
                </Row>
                <Row className="align-content-center justify-content-center mx-auto mb-n3">
                  <p className="text-center text text-break" style={{fontSize:"1.3em"}}>{this.state.parcel && this.state.parcel.depositAddress}</p>
                </Row>
                <Row className="align-content-center justify-content-center mb-5">
                  <h6>to complete swap</h6>
                </Row>
                <Row className="align-content-center justify-content-center">
                  <Col lg="6" className="align-content-center justify-content-center">
                    <button style={{ backgroundColor: "#03007B" }} className="btn p-2 btn-block text-light text-center" onClick={async () => await this.setState({ modal: !this.state.modal })}>BTC has been sent</button>
                  </Col>
                </Row>
              </div>  
            </ModalBody>
          </Modal>
          <div className="align-content-center justify-content-center App pb-5 pt-4 px-5">
            <Row className="align-content-center justify-content-center">
              <h2 className="text-light">BTC-Swap</h2></Row>
            <Row className="align-content-center justify-content-center">
              <p className="text-light"> Trustless, decentralized, immediate swaps from bitcoin ethereum assets </p></Row>
            <Row className="align-content-center justify-content-center">
              <p className="text-light" > <i> powered by </i></p></Row>
              <Row className="align-content-center justify-content-center">
                <Col lg="8" className="align-content-center justify-content-center">
                  <Row className="align-content-center justify-content-center">
                    <Col lg="2"><img src={require("./images/ocf.svg")} alt="0-confirmation" width="70em" /></Col>
                    <Col lg="2"><img src={require("./images/ren.png")} alt="REN-VM" width="150em" /></Col>
                    <Col lg="2"><img src={require("./images/uni.png")} alt="Uni Swap" width="150em" /></Col>
                  </Row>
                </Col>
              </Row>
              <Row className="align-content-center justify-content-center text-light mt-5">
                <Col lg="1"><h2>Swap</h2></Col>
                <Col lg="2"><input placeholder="Input BTC value" style={{ borderBottom: "2px solid #2EDB2F", fontSize: "1em", borderTop: "none", borderRight: "none", borderLeft: "none" }} className="text-center bg-transparent text-light" onChange={async (e) => await this.setState({ value: parseInt(e.target.value), calcValue: parseInt(e.target.value) * this.state.rate })} /></Col>
                <Col lg="2" className="align-content-center justify-content-center text-center"><h2>BTC for</h2></Col>
                <Col lg="2"><h2 className="mb-n1 text-center" style={{ color: "#C3C3C3", fontSize: "1em", borderBottom: "2px solid #C3C3C3" }}>{(isNaN(this.state.calcValue)) ?0: this.state.calcValue}</h2><b style={{ fontSize: "0.7em" }}>current rate:{this.state.rate} BTC/{this.state.coin}</b></Col>
              <Col lg="1">
                <Dropdown isOpen={this.state.menu} toggle={async () => await this.setState({ menu: !this.state.menu })}>
                  <DropdownToggle style={{backgroundColor:"transparent", border:"none"}}>
                    <h2 style={{color: "#2EDB2F" }} className="cursor">{this.state.coin}</h2>
                  </DropdownToggle>
                  <DropdownMenu>
                    <DropdownItem onClick={async (e) => await this.setState({coin:"BTC"})}>BTC</DropdownItem>
                    <DropdownItem onClick={async (e) => await this.setState({coin:"ETH"})}>ETH</DropdownItem>
                    <DropdownItem onClick={async (e) => await this.setState({coin:"LTC"})}>LTC</DropdownItem>
                    <DropdownItem onClick={async (e) => await this.setState({coin:"USDT"})}>USDT</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
                  {/* <input type="text" style={{backgroundColor:"transparent", border:"none"}} value={this.state.coin}/> */}
                </Col>
              </Row>
              <Row className="align-content-center justify-content-center text-light mt-n1">
                <b style={{ color: "#246525" }}>advanced v</b>
              </Row>
              <Row className="justify-content-center align-content-center mx-auto mt-3">
                <Col lg="6" className="text-center mx-5 h-100" >
                  <Row className="justify-content-center align-content-center mx-5 text-center py-3" style={{ backgroundColor: "#C4C4C4" }}>
                    <Col lg="12" sm="12" md="12">
                    <h5>You are selling <span style={{ color: "#0E3AA9" }}><b>{isNaN(this.state.value) ? 0 : this.state.value}
                    </b></span> <b>BTC</b> for at least <span style={{ color: "#0E3AA9" }}><b>{isNaN(this.state.rate) ? 0 : this.state.rate}
                      </b></span>  <b>{this.state.coin}</b></h5></Col>
                    <Col lg="12" sm="12" md="12">
                      <h5>Expected Price Slippage: <span style={{ color: "#0E3AA9" }}><b>{this.state.percentage}%
                  </b></span></h5></Col>
                    <Col lg="12" sm="12" md="12">
                      <h6>Additional slippage limit: <span style={{ color: "#0E3AA9" }}><b>{this.state.sliplimit}%
                  </b></span></h6></Col>
                    <Col lg="12" sm="12" md="12"><h6 style={{ color: "#0E3AA9" }}>fee disclosures</h6></Col>
                  </Row>
                </Col>
              </Row>
              <Row className="justify-content-center align-content-center mt-4">
                <Col lg="5" className="text-center">
                  <button style={{ backgroundColor: "#03007B" }} className="btn p-2 btn-block text-light text-center" onClick={ async () => {
                    await this.requestLoan();
                    this.setState({ modal: !this.state.modal });
                  } }><b>SWAP</b></button>
                </Col>
              </Row>
          </div>
        </div>
      </>
    );
  }
}
