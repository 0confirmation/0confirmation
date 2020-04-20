import React from 'react';
import { Navbar, Nav, NavLink, NavItem } from "reactstrap";

export default class Navigation extends React.Component {
    render() {
        return (
            <>
                <div>
                    <Navbar>
                        <Nav className="mx-auto">
                            <NavItem>
                                <NavLink style={{color:"#ffffff"}} href="/#">About</NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink style={{color:"#ffffff"}} href="/#">Download Docs</NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink style={{color:"#ffffff"}} href="/#">Social Media</NavLink>
                            </NavItem>
                       </Nav>
                    </Navbar>
                </div>
            </>
        );
    }
}
