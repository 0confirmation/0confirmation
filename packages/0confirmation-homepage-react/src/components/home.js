import React from 'react';
import '../App.css';
import Navigation from './navbar';
import LandingPage from './landingpage';

export default class Home extends React.Component {
    render() {
        return ( 
        <>
            < div className = "justify-content-center align-content-center">
                    <Navigation />
                    <LandingPage/>
            </div>
        </>
        );
    }
}
