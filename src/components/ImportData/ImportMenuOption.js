import React, {Component} from "react";
import Popup from "reactjs-popup";

export default class ImportMenuOption extends Component {
    render() {
        return (<Popup
            trigger={this.asMenuItem()}
            modal
            contentStyle={{
                maxWidth: "600px",
                width: "50%",
                borderRadius: "10px",
                border: "1px solid #D6D6D6",
                boxShadow: "0 4px 4px rgba(0, 0, 0, 0.25)"
            }}
            nested
        >{close => (this.popupContent(close))}
        </Popup>)
    }

    popupContent(close) {
        return (<div className="modal">
            <div className="close" onClick={close}>
                &times;
            </div>
            <div className="header"
                 style={{
                     color: this.props.category.color, borderBottom: "1px solid " + this.props.category.color
                 }}> Import {this.props.category.name} </div>
            <div className="content">
                {/* tried using react-hook-form, failed */}
                <form onSubmit={this.loadAssets} style={{
                    display: "flex", flexDirection: "column", padding: "10px", alignItems: "center"
                }}>
                    <input type="file" accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                           id="asset-data" onChange={(e) => this.loadAssets(e.target.files[0])}/>
                    <button onClick={this.loadAssets} className="loadButton">Load</button>
                </form>
            </div>
        </div>)
    }

    asMenuItem() {
        return (<div className="menu-item" style={{color: this.props.category.color}}>{this.props.category.name}</div>)
    }

    loadAssets(file) {
        // why is this called when I click the import button and not the load button?
        console.log("test")

        if (file === null) {
            return
        }

        // it gets this far when I close the popup
        console.log("loading" + file.name)
    }
}
