
import React from 'react';
import { Navbar, Nav, NavLink, NavItem, NavbarBrand, NavbarToggler } from "reactstrap";
import {Link} from "react-router-dom";
import "../App.css";
import { IoIosMenu } from "react-icons/io";
import Drawer from '@material-ui/core/Drawer';
export default class Navigation extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isopen: false,
            isScroll: false,
            position: null,
        }

        // this.initchecking = this.checking.bind(this);
        this.checking = this.checking.bind(this);    
    }
    async checking() {
        if (window.pageYOffset === 0) {
            await this.setState({ isScroll: false });

        } else {
            await this.setState({ isScroll: true });
        }
    }

    async componentDidMount() {
        var baseurl = window.location.pathname.split("/")[1];
        var id = window.location.pathname.split("/")[2];
        if (baseurl === "trade") {
            await this.setState({ position: id });
        }
        // this.initchecking()
        window.addEventListener('scroll', this.checking)

    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.checking)
    }
    render() {
        return (
            <>
                <div>
                    {(this.props.ismobile)?
                        <Navbar fixed="top" className={(this.state.isScroll) ? "px-5 py-3 shadow-sm bgs" : "px-5 py-3"}>
                            <NavbarBrand href="/"><img src={require("../images/0cf.svg")} alt="0cf" /></NavbarBrand>
                            <NavLink className="ml-auto" onClick={
                                async e => {
                                    e.preventDefault();
                                    await this.setState({ isopen: !this.state.isopen });
                                }
                            }>
                                <IoIosMenu size={25} color="#ffffff" />
                            </NavLink>
                            <Drawer anchor="right" open={this.state.isopen} onOpen={async () => { await this.setState({ isopen: true }) }} onClose={async ()=> await this.setState({isopen:false})}>
                                <div style={{ width: "250px" }} className="justify-content-start bgs min-vh-100 py-5"
                                    role="presentation"
                                    onClick={async () => { await this.setState({ isopen: false }) }}
                                    onKeyDown={async () => { await this.setState({ isopen: false }) }}>
                                    <Nav vertical>
                                        <NavItem className="p-2" style={{ backgroundColor: (window.location.pathname.split("/")[2] === "doc") ? "#1F2820" : "" }}>
                                            <Link to="/" style={{outline:"none", textDecoration:"none", color: "#ffffff"}} className="my-2"
              
                                            >Docs</Link>
                                        </NavItem>
                                        <NavItem className="p-2" style={{ backgroundColor: (window.location.pathname.split("/")[2] === "earn") ? "#1F2820" : ""}}>
                                            <Link to="/trade/earn" style={{outline:"none", textDecoration:"none", color: "#ffffff" }} className="my-2"
              
                                            >Earn</Link>
                                        </NavItem>
                                        <NavItem className="p-2" style={{ backgroundColor: (window.location.pathname.split("/")[2] === "swap") ? "#1F2820" : "" }}>
                                            <Link to="/trade/swap" style={{outline:"none", textDecoration:"none", color: "#ffffff" }} className="my-2"
                                   
                                            >Swap</Link>
                                        </NavItem>
                                    </Nav>
                                </div>
                            </Drawer>
                            
                        </Navbar>
                    :    
                    <Navbar fixed="top" className={(this.state.isScroll) ? "px-5 py-3 shadow-sm bgs" : "px-5 py-3"}>
                        <NavbarBrand href="/"><img src={require("../images/0cf.svg")} alt="0cf"/></NavbarBrand>
                        <NavbarToggler onClick={async()=>await this.setState({isopen:!this.state.isopen})} />
                        <Nav className="ml-auto">
                            <NavItem>
                                <Link to="/" style={{width:"115px", height:"50px", padding:"10px",outline:"none", textDecoration:"none", color: "#ffffff", backgroundColor:(window.location.pathname.split("/")[2] === "doc")?"#1F2820":"", borderRadius:(window.location.pathname.split("/")[2] === "doc")?"10px":"" }} className="mx-1" 
                                  
                                >Docs</Link>
                            </NavItem>
                            <NavItem>
                                    <Link to="/trade/earn" style={{width:"115px", height:"50px", padding:"10px",outline:"none", textDecoration:"none", color: "#ffffff", backgroundColor:(window.location.pathname.split("/")[2] === "earn")?"#1F2820":"", borderRadius:(window.location.pathname.split("/")[2] === "earn")?"10px":"" }} className="mx-1" 
                            
                                >Earn</Link>
                            </NavItem>
                            <NavItem>
                                    <Link to="/trade/swap" style={{width:"115px", height:"50px", padding:"10px",outline:"none", textDecoration:"none", color: "#ffffff", backgroundColor:(window.location.pathname.split("/")[2] === "swap")?"#1F2820":"", borderRadius:(window.location.pathname.split("/")[2] === "swap")?"10px":"" }} className="mx-1" 
 
                                >Swap</Link>
                            </NavItem>
                       </Nav>
                    </Navbar>}
                </div>
            </>
        );
    }
}
