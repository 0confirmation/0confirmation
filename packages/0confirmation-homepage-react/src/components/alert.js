import React from 'react';
import Expire from './expire'


export default class Alert extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            boldText: props.boldText,
            detailText: props.detailText,
            alertType: props.alertType,
            delay: props.delay ? props.delay : 4000
        }
    }

    render() {
        return (
            <Expire delay={this.state.delay}>
                <div className={`${this.state.alertType} ${this.state.visible ? ' fadeIn' : ' fadeOut'}`}>
                    <span class="alert-close" onClick={() => {this.setState({visible:false})}}>&times;</span> 
                    <p className="sub-header-text vertical-center py-2"><b>{this.state.boldText}</b> {this.state.detailText}</p>
                </div>
            </Expire>
        )
    }
    
}


