import React, {Component} from "react";
import Popup from "reactjs-popup";

export default class ImportMenuOption extends Component {

    render() {
        return (
            <Popup
                trigger={this.asMenuItem()}
                modal
                contentStyle={{
                    maxWidth: "600px",
                    width: "90%"
                }}
                nested
            >{close => (
                this.popupContent(close)
            )}
            </Popup>
        )
    }

    popupContent(close) {
        return (
            <div className="modal">
                <div className="close" onClick={close}>
                    &times;
                </div>
                <div className="header" style={{color: this.props.category.color}}> Import {this.props.category.name} </div>
                <div className="content">
                    Select file
                </div>
            </div>
        )
    }

    asMenuItem() {
        return (
            <div className="menu-item" style={{color: this.props.category.color}}>{this.props.category.name}</div>
        )
    }
}
