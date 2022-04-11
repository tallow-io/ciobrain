import React, {Component} from "react";
import Popup from "reactjs-popup";
import {AssetCategoryEnum} from "../AssetCategoryEnum.js";
import './AssetImport.css'
import 'reactjs-popup/dist/index.css';
import XLSX from "xlsx";
import * as ASSET from "../../common/Asset.js";

const modalStyle = {
    maxWidth: "600px",
    width: "80%",
    borderRadius: "10px",
    border: "1px solid #D6D6D6",
    boxShadow: "0 4px 4px rgba(0, 0, 0, 0.25)"
}

const formStyle = {display: "flex", flexDirection: "row", padding: "10px", justifyContent: "center"}

const INVALID_FILE = {};

export default class AssetImport extends Component {

    constructor(props) {
        super(props);
        this.state = {assetType: null, asset: null};
    }

    render() {
        return <Popup trigger={<button className="button">Import</button>} modal={true} closeOnEscape={false}
                      closeOnDocumentClick={false} contentStyle={modalStyle}>
            {close => this.popupContent(close)}
        </Popup>
    }

    popupContent(close) {
        const closeAndReset = (event) => {
            close(event);
            this.setState({assetType: null, asset: null});
        }

        const labelStyle = (color) => ({
            display: "flex", width: "33.33%", color: color, margin: "auto", fontSize: "20px", justifyContent: "center"
        })

        const inputResult = () => {
            const assetType = this.state.assetType;
            switch (assetType) {
                case null:
                    return "";
                case INVALID_FILE:
                    return <label style={labelStyle("red")}>Invalid File</label>;
                default:
                    return <>
                        <label style={labelStyle(assetType.color)}>{assetType.name}</label>
                        <button className="loadButton" type="submit" style={{width: "33.33%"}}>Confirm</button>
                    </>;
            }
        }

        const submit = (event) => {
            event.preventDefault();
            this.pushAssets().then(console.log);
        }

        return <div className="modal">
            <div className="close" onClick={closeAndReset}>&times;</div>
            <div className="header">Import Assets</div>
            <div className="content">
                <form onSubmit={submit} style={formStyle}>
                    <input type="file"
                           accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                           style={{width: "33.34%", margin: "auto"}}
                           id="asset-data"
                           onChange={event => this.validateFile(event.target.files[0])}/>
                    {inputResult()}
                </form>
            </div>
        </div>;
    }

    async pushAssets() {
        const state = this.state
        const assetType = state.assetType;
        const asset = state.asset;
        if (!assetType || !asset) return {error: "Invalid Asset"};
        switch (assetType) {
            case AssetCategoryEnum.APPLICATION:
                return await ASSET.postApplicationAsset(asset);
            case AssetCategoryEnum.DATA:
                return await ASSET.postDataAsset(asset);
            case AssetCategoryEnum.INFRASTRUCTURE:
                return await ASSET.postInfrastructureAsset(asset);
            case AssetCategoryEnum.TALENT:
                return await ASSET.postTalentAsset(asset);
            case AssetCategoryEnum.PROJECTS:
                return await ASSET.postProjectsAsset(asset);
            case AssetCategoryEnum.BUSINESS:
                return await ASSET.postBusinessAsset(asset);
            default:
                return {error: "Invalid Asset"};
        }
    }

    validateFile(file) {
        if (!file) {
            this.setState({assetType: null, asset: null})
            return;
        }
        const invalidFile = {assetType: INVALID_FILE, asset: INVALID_FILE};
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const workbook = XLSX.read(ev.target.result, {type: 'binary'});
                const assets = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                const type = Object.values(AssetCategoryEnum).find(type => assets[0].hasOwnProperty(type.name + " ID"));
                const valid = type && assets.every(asset => asset.hasOwnProperty(type.name + " ID"));
                this.setState(valid ? {assetType: type, asset: assets} : invalidFile);
            } catch (ex) {
                this.setState(invalidFile);
            }
        }
        reader.onerror = () => this.setState(invalidFile);
        reader.readAsBinaryString(file);
    }
}