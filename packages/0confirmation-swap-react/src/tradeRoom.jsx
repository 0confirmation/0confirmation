import React, {Fragment} from 'react';
import '../App.css';
import {
    Row, Col,
    InputGroup,
    InputGroupButtonDropdown,
    Input,
    DropdownToggle,
    DropdownMenu,
    DropdownItem
} from "reactstrap";
import { Link } from "react-router-dom";
import { FaAngleDown } from 'react-icons/fa';
import { InlineIcon } from '@iconify/react';
import btcIcon from '@iconify/icons-cryptocurrency/btc';
import daiIcon from '@iconify/icons-cryptocurrency/dai';
import ltcIcon from '@iconify/icons-cryptocurrency/ltc';
import ethIcon from '@iconify/icons-cryptocurrency/eth';
import usdtIcon from '@iconify/icons-cryptocurrency/usdt';
import eosIcon from '@iconify/icons-cryptocurrency/eos';
import btgIcon from '@iconify/icons-cryptocurrency/btg';
export default class TradeRoom extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            showdetail: true,
            sendOpen:false,
            getOpen: false,
            send: 0,
            get: 0,
            rate:203,
            getvalue: 0,
            sendvalue: 0,
            slippage:0.5,
            _getcoins: 
                { coin: <Fragment><InlineIcon color="#ffffff" style={{fontSize:"1.5em"}} className="mr-2" icon={daiIcon} /></Fragment>, id: 0, name: "DAI" },
            _sendcoins:
                { coin: <Fragment><InlineIcon color="#ffffff" style={{fontSize:"1.5em"}} className="mr-2" icon={btcIcon} /></Fragment>, id: 0, name: "BTC" },
             
        }
        this.setsend = this.setsend.bind(this);
        this.setget = this.setget.bind(this);
    }
    setget (a) {
        alert(a)
    }

    setsend(a) {
        alert(a)
    }
    _send = 0;
    _get = 0;
    _coin = <Fragment><InlineIcon color="#ffffff" style={{fontSize:"1.5em"}} className="mr-2" icon={btcIcon} /></Fragment>
    _coins = [
        { coin: <Fragment><InlineIcon color="#ffffff" style={{fontSize:"1.5em"}} className="mr-2" icon={btcIcon} /></Fragment>,id:0, name: "BTC" },
        { coin: <Fragment><InlineIcon color="#ffffff" style={{fontSize:"1.5em"}} className="mr-2" icon={daiIcon} /></Fragment>,id:1, name: "DAI" },
        { coin: <Fragment><InlineIcon color="#ffffff" style={{fontSize:"1.5em"}} className="mr-2" icon={ltcIcon} /></Fragment>,id:2, name: "LTC" },
        { coin: <Fragment><InlineIcon color="#ffffff" style={{fontSize:"1.5em"}} className="mr-2" icon={ethIcon} /></Fragment>,id:3, name: "ETH" },
        { coin: <Fragment><InlineIcon color="#ffffff" style={{fontSize:"1.5em"}} className="mr-2" icon={usdtIcon} /></Fragment>,id:4, name: "USDT"},
        { coin: <Fragment><InlineIcon color="#ffffff" style={{fontSize:"1.5em"}} className="mr-2" icon={eosIcon} /></Fragment>,id:5, name: "EOS" },
        { coin: <Fragment><InlineIcon color="#ffffff" style={{fontSize:"1.5em"}} className="mr-2" icon={btgIcon} /></Fragment>,id:6, name: "BTG" },
    ];
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
                        {(window.location.pathname.split("/")[2] === "earn")?null:<Col lg="6" md="6" sm="6">
                            <Link to="/" style={{ outline: "none", textDecoration: "none", borderBottom: "1px solid #317333", color: "#317333", fontSize:"0.8em", fontStyle:"normal", fontWeight:"bold" }} href="/#"

                            >Recent Transactions</Link>
                        </Col>}
                    </Row>
                    <Row  className="justify-content-center align-content-center text-center">
                        <Col lg="8" md="8" sm="8" style={{ backgroundColor:"#1F2820", borderRadius:"10px 10px 0px 0px", minHeight:"70vh"}} className="shadow-lg mx-4">

                            <Row className="justify-content-center align-content-center text-center mx-auto mt-3">
                                {(window.location.pathname.split("/")[2] === "earn") ?
                                    <Col lg="6" md="6" sm="6">
                                        <p style={{ fontWeight: "bold", fontStyle: "normal", fontSize: "2em", fontFamily: "PT Sans", color: "#ffffff" }}>0cf Earn</p>
                                    </Col>
                                    :
                                    <Col lg="6" md="6" sm="6">
                                    <p style={{fontWeight:"bold", fontStyle:"normal", fontSize:"2em", fontFamily:"PT Sans", color:"#ffffff"}}>0cf Swap</p>
                                </Col>}
                            </Row>
                            <Row className="justify-content-center align-content-center text-center mx-auto">
                                {(window.location.pathname.split("/")[2] === "earn") ?
                                    <Col lg="12" md="12" sm="12">
                                        <p style={{ fontWeight: "normal", fontStyle: "normal", fontSize: "0.8em", fontFamily: "PT Sans", color: "#ffffff" }}>
                                            Add BTC to the 0cf pool to gain interest on short term liquidity loans
                                    </p>
                                    </Col>
                                    :
                                    <Col lg="12" md="12" sm="12">
                                    <p style={{ fontWeight: "normal", fontStyle: "normal", fontSize: "0.8em", fontFamily: "PT Sans", color: "#ffffff" }}>
                                        Instantly Swap BTC for ETH assets using decentralized exchanges
                                    </p>
                                </Col>}
                            </Row>
                           { (window.location.pathname.split("/")[2] === "earn") ?
                                <Row className="justify-content-center align-content-center text-center mx-auto my-3 text-light">
                                <Col lg="4" md="12" sm="12" className="mt-2">
                                    <InputGroup style={{height:"52px"}}> 
                                        <Input type="text"
                                        value={this.state.sendvalue} onChange={event => this.setState({sendvalue: event.target.value.replace(/\D/,'')})}
                                        className="sendcoin h-100" style={{backgroundColor:"#354737",
                                        borderRadius:"8px 0px 0px 8px", color:"#ffffff", border:"none", outline:"none"}} />
                                        <InputGroupButtonDropdown style={{backgroundColor:"#354737",borderRadius:"0px 8px 8px 0px", color:"#ffffff"}} direction="right" setActiveFromChild={true} addonType="append" isOpen={this.state.sendOpen} toggle={async (e) => await this.setState({ sendOpen: !this.state.sendOpen})}>
                                            <DropdownToggle style={{backgroundColor:"#485F4B", borderRadius:"0px 8px 8px 0px", color:"#ffffff", border:"none", outline:"none"}}>
                                                {this.state._sendcoins.coin}{' '} 
                                                {this.state._sendcoins.name}{' '}<FaAngleDown />
                                            </DropdownToggle>
                                            <DropdownMenu style={{ backgroundColor:"#354737", borderRadius:"8px 8px 8px 8px", color:"#ffffff", border:"none", outline:"none", marginTop:"3.5em", marginLeft:"-10em"}}>
                                                {this._coins.map((a,i)=> {
                                                    return (
                                                        <DropdownItem key={i} className="dhover" style={{ color: "#ffffff", backgroundColor: (this.state.send === a.id) ?"#485F4B":""}}
                                                            // onClick={() => { this._send = i; alert(this._send)}}
                                                            onClick={(i) => { this.setState({ send: a.id, _sendcoins:{name:a.name, id:a.id, coin:a.coin} }) }}
                                                        >
                                                            {a.coin}{a.name}</DropdownItem>
                                                    );
                                                })}
                                                {/* active={(a.id === this.state.send) ? true : false}  async ()=> await this.setState({send:a.id})*/}
                                            </DropdownMenu>
                                        </InputGroupButtonDropdown>
                                    </InputGroup>
                                </Col></Row>
                                :
                                <Row className="justify-content-center align-content-center text-center mx-auto my-3 text-light">

                                <Col lg="4" md="12" sm="12" className="mt-2">
                                    <InputGroup style={{height:"52px"}}> 
                                        <Input type="text"
                                        value={this.state.sendvalue} onChange={event => this.setState({sendvalue: event.target.value.replace(/\D/,'')})}
                                        className="sendcoin h-100" style={{backgroundColor:"#354737",
                                        borderRadius:"8px 0px 0px 8px", color:"#ffffff", border:"none", outline:"none"}} />
                                        <InputGroupButtonDropdown style={{backgroundColor:"#354737",borderRadius:"0px 8px 8px 0px", color:"#ffffff"}} direction="right" setActiveFromChild={true} addonType="append" isOpen={this.state.sendOpen} toggle={async (e) => await this.setState({ sendOpen: !this.state.sendOpen})}>
                                            <DropdownToggle style={{backgroundColor:"#485F4B", borderRadius:"0px 8px 8px 0px", color:"#ffffff", border:"none", outline:"none"}}>
                                                {this.state._sendcoins.coin}{' '} 
                                                {this.state._sendcoins.name}{' '}<FaAngleDown />
                                            </DropdownToggle>
                                            <DropdownMenu style={{ backgroundColor:"#354737", borderRadius:"8px 8px 8px 8px", color:"#ffffff", border:"none", outline:"none", marginTop:"3.5em", marginLeft:"-10em"}}>
                                                {this._coins.map((a,i)=> {
                                                    return (
                                                        <DropdownItem key={i} className="dhover" style={{ color: "#ffffff", backgroundColor: (this.state.send === a.id) ?"#485F4B":""}}
                                                            // onClick={() => { this._send = i; alert(this._send)}}
                                                            onClick={(i) => { this.setState({ send: a.id, _sendcoins:{name:a.name, id:a.id, coin:a.coin} }) }}
                                                        >
                                                            {a.coin}{a.name}</DropdownItem>
                                                    );
                                                })}
                                                {/* active={(a.id === this.state.send) ? true : false}  async ()=> await this.setState({send:a.id})*/}
                                            </DropdownMenu>
                                        </InputGroupButtonDropdown>
                                    </InputGroup>
                                </Col>
                                <Col lg="2" md="6" sm="6" className="mt-2">
                                    <img className="img-fluid" src={require("../images/swapicon.svg")} alt="Swap"/>
                                </Col>
                                <Col lg="4" md="12" sm="12" className="mt-2">
                                    <InputGroup style={{height:"52px"}}> 
                                        <Input readonly="readonly" type="text"
                                            value={this.state.sendvalue * this.state.rate}
                                            // value={this.state.getvalue}
                                            // onChange={event => this.setState({ getvalue: event.target.value.replace(/\D/, '') })}
                                        className="getcoin h-100"  style={{backgroundColor:"#354737",
                                        borderRadius:"8px 0px 0px 8px", color:"#ffffff", border:"none", outline:"none"}}/>
                                        <InputGroupButtonDropdown style={{backgroundColor:"#354737",borderRadius:"0px 8px 8px 0px", color:"#ffffff"}} direction="right" setActiveFromChild={true} addonType="append" isOpen={this.state.getOpen} toggle={async (e) => await this.setState({ getOpen: !this.state.getOpen })}>
                                            <DropdownToggle style={{backgroundColor:"#485F4B", borderRadius:"0px 8px 8px 0px", color:"#ffffff", border:"none", outline:"none"}}>

                                                {this.state._getcoins.coin}{' '}
                                                {this.state._getcoins.name}{' '}<FaAngleDown />
                                            </DropdownToggle>
                                            <DropdownMenu style={{ backgroundColor: "#354737", borderRadius: "8px 8px 8px 8px", color: "#ffffff", border: "none", outline: "none", marginTop: "3.5em", marginLeft: "-10em" }}>

                                                {this._coins.map( (a, i)=> {
                                                    return (
                                                        <DropdownItem key={i} className="dhover" style={{ color: "#ffffff", backgroundColor: (this.state.get === a.id) ? "#485F4B" : "" }}
                                                            // onClick={() => {this._get = i; alert(this._get)}}
                                                            onClick={(i) => { this.setState({ get: a.id, _getcoins: { name: a.name, id: a.id, coin: a.coin } }) }}
                                                        >
                                                            {a.coin}<tab/> {a.name}</DropdownItem>
                                                    );
                                                })}
                                                {/* active = {(a.id === this.state.get) ? true : false  async (e) => await this.setState({ get: a.id })*/}
                                            </DropdownMenu>
                                        </InputGroupButtonDropdown>
                                    </InputGroup>
                                </Col>
                            </Row>}
                            
                            <div className="justify-content-center align-content-center text-center mx-auto my-auto pt-3">
                                {(window.location.pathname.split("/")[2] === "earn") ?
                                    <button className="btn text-light button-small btn-sm px-5" style={{ fontSize: "24dp", backgroundColor: "#317333", borderRadius: "10px" }}>Pool</button>
                                :
                                    <button className="btn text-light button-small btn-sm px-5" style={{ fontSize: "24dp", backgroundColor: "#317333", borderRadius: "10px" }}>Swap</button>
                                }
                            </div>
                            <Row className="justify-content-center align-content-center text-center mx-auto py-3">
                                <Col lg="6" md="6" sm="6">
                                    <span onClick={async (e) => await this.setState({ showdetail: !this.state.showdetail })} className="text-light" style={{ fontWeight: "normal", cursor:"pointer", fontStyle: "normal", fontSize: "0.7em", fontFamily: "PT Sans", color: "#ffffff" }}>Details <FaAngleDown/></span>
                                </Col>
                            </Row>
                            {(this.state.showdetail)?
                                <Row className="justify-content-center align-content-center text-center mx-auto mt-1 mb-5">
                                    
                                    {(window.location.pathname.split("/")[2] === "earn") ?
                                    <Col lg="9" md="9" sm="9" style={{ backgroundColor: "#354737", borderRadius: "10px" }} className="shadow-lg mx-4  py-3">
                                        <Row className="justify-content-center align-content-center">
                                                <Col sm="7" lg="7" md="7">
                                                    <p className="text-center text-break" style={{ fontWeight: "normal", fontStyle: "normal", fontSize: "0.8em", fontFamily: "PT Sans", color: "#ffffff" }}>
                                                        {this.state.sendvalue} {this.state._sendcoins.name} has historic returns of 23.2% APY or .0232 BTC interest per year
                                                    </p>
                                                </Col>
                                                <Col sm="12" lg="12" md="12">
                                                    <Row>
                                                        <Col className="text-light align-content-start justify-content-start" sm="6" lg="6" md="6">
                                                            <p style={{ fontWeight: "normal", fontStyle: "normal", fontSize: "0.8em", fontFamily: "PT Sans", color: "#ffffff" }}>Current Pool Size</p>
                                                        </Col>
                                                        <Col className="text-light align-content-end justify-content-end" sm="6" lg="6" md="6">
                                                            <p style={{ fontWeight: "normal", fontStyle: "normal", fontSize: "0.8em", fontFamily: "PT Sans", color: "#ffffff" }}>450.392 BTC</p>
                                                        </Col>
                                                    </Row>
                                                </Col>
                                        </Row>
                                    </Col>
                                    :
                                    <Col lg="9" md="9" sm="9" style={{ backgroundColor: "#354737", borderRadius: "10px" }} className="shadow-lg mx-4  py-3">
                                            <Row className="align-content-center justify-content-center">
                                                <Col lg="7" md="7" sm="7" className="justify-content-center align-content-center">
                                                    <p className="text-center text-break" style={{ fontWeight: "normal", fontStyle: "normal", fontSize: "0.8em", fontFamily: "PT Sans", color: "#ffffff" }}>
                                                        You are selling <b>{this.state.sendvalue} {this.state._sendcoins.name}</b> for at least <b>{this.state.sendvalue * this.state.rate} {this.state._getcoins.name}</b> Expected Price Slippage: <b>{this.state.slippage}%</b>  Additional slippage limit: <b>{this.state.slippage}%</b> fee disclosures
                                                    </p>
                                                </Col>
                                        </Row>
                                    {/* <p className="text-center text-break" style={{ fontWeight: "normal", fontStyle: "normal", fontSize: "0.8em", fontFamily: "PT Sans", color: "#ffffff" }}>
                                        You are selling <b>{this.state.sendvalue} {this.state._sendcoins.name}</b> for at least <b>{this.state.sendvalue * this.state.rate} {this.state._getcoins.name}</b> <br />Expected Price Slippage: <b>{this.state.slippage}%</b>  <br />Additional slippage limit: <b>{this.state.slippage}%</b>  <br />fee disclosures
                                    </p> */}
                                        </Col>
                                    }
                                </Row>
                                : null
                            }
                        </Col>
                    </Row>
                </div>
            </>
        );
    }
}