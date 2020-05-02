import React from 'react';
import { Navbar, Nav, NavLink, NavItem, NavbarBrand, NavbarToggler } from "reactstrap";
import "../App.css";
import { IoIosMenu } from "react-icons/io";
import Drawer from '@material-ui/core/Drawer';
export default class Navigation extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isopen: false,
            isScroll: false,
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

    componentDidMount() {

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
                        <Navbar fixed="top" className={(this.state.isScroll) ? "px-5 py-3 shadow-lg bgs" : "px-5 py-3"}>
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
                                        <NavItem>
                                            <NavLink style={{ color: "#ffffff" }} href="/#">Docs</NavLink>
                                        </NavItem>
                                        <NavItem>
                                            <NavLink style={{ color: "#ffffff" }} href="/#">Earn</NavLink>
                                        </NavItem>
                                        <NavItem>
                                            <NavLink style={{ color: "#ffffff" }} href="/#">Swap</NavLink>
                                        </NavItem>
                                    </Nav>
                                </div>
                            </Drawer>
                            
                        </Navbar>
                    :    
                    <Navbar fixed="top" className={(this.state.isScroll) ? "px-5 py-3 shadow-lg bgs" : "px-5 py-3"}>
                        <NavbarBrand href="/"><img src={require("../images/0cf.svg")} alt="0cf"/></NavbarBrand>
                        <NavbarToggler onClick={async()=>await this.setState({isopen:!this.state.isopen})} />
                        <Nav className="ml-auto">
                            <NavItem>
                                <NavLink style={{ color: "#ffffff" }} href="/#">Docs</NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink style={{ color: "#ffffff" }} href="/#">Earn</NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink style={{ color: "#ffffff" }} href="/#">Swap</NavLink>
                            </NavItem>
                       </Nav>
                    </Navbar>}
                </div>
            </>
        );
    }
}
