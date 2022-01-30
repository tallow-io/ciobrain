import React, {Component} from 'react'

export default class MessageModal extends Component {
    constructor() {
        super();
        this.state = {  
        }
    }

    render () {
        return (
            <div className="alert info">
                <span className="closebtn" index = {this.props.index} onClick={this.props.removeMessage}>&times;</span>  
                <strong>WARNING: </strong> {this.props.message}
            </div>
        );
    }    
} 
    