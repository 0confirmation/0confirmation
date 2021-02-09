import React from 'react';
import '../App.css';
import Navigation from './navbar';
import LandingPage from './landingpage';


export default class Home extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            ismobile: false,
        }
        this.initUpdateWindowDimensions = this.updateWindowDimensions.bind(this)
        this.updateWindowDimensions = this.updateWindowDimensions.bind(this)
        // this.updateWindowDimensions = debounce(this.updateWindowDimensions.bind(this), 200)
    }

    componentDidMount() {
        this.initUpdateWindowDimensions()
        window.addEventListener('resize', this.updateWindowDimensions)
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateWindowDimensions)
    }

    updateWindowDimensions() {
        if (window.innerWidth < 900) {
            this.setState({
                ismobile: true
            })
        } else {
            this.setState({
                ismobile: false
            })
        }
    }
    render() {
        return ( 
        <>
             <div className = "justify-content-center align-content-center" >
                    <Navigation ismobile={this.state.ismobile} />
                    <LandingPage ismobile = {this.state.ismobile}/> 
            </div>
        </>
        );
    }
}
