import React, { Component } from 'react';
import { getApplicationAssetById, getDataAssetById, getInfrastructureAssetById, getTalentAssetById, getProjectsAssetById, getBusinessAssetById } from '../common/Asset';
import { AssetCategoryEnum } from './AssetCategoryEnum';
import * as ERRORLOG from './../common/ErrorLog'

export default class AssetDetails extends Component {

    constructor() {
        super();
        this.state = {
            selectedCategory: null,
            selectedAssetKey: null,
            asset: null,
            assetColor: null,
            assetConnections: null
            
        }
    }

    componentWillReceiveProps(nextProps) {
        if(this.state.selectedCategory !== nextProps.selectedCategory ||  this.state.selectedAssetKey !== nextProps.selectedAssetKey) {
            this.setState({ selectedCategory: nextProps.selectedCategory, selectedAssetKey: nextProps.selectedAssetKey});
            this.getAssetDetails(nextProps.selectedAssetKey, nextProps.selectedCategory)
        }
            
    }

    async getAssetDetails(selectedAssetKey, selectedCategory){
        //call api and store into object
        var asset;
        var assetConnections;

        switch(selectedCategory){
            case "Application": 
                asset = await getApplicationAssetById(selectedAssetKey);
                assetConnections = this.getAssetConnections(asset);
                this.setState({ asset: asset, assetColor: AssetCategoryEnum.APPLICATION.color, assetConnections: assetConnections});
                break;

            case "Data": 
                asset = await getDataAssetById(selectedAssetKey);
                assetConnections = this.getAssetConnections(asset);
                this.setState({ asset: asset, assetColor: AssetCategoryEnum.DATA.color, assetConnections: assetConnections});
                break;

            case "Infrastructure": 
                asset = await getInfrastructureAssetById(selectedAssetKey);
                assetConnections = this.getAssetConnections(asset);
                this.setState({ asset: asset, assetColor: AssetCategoryEnum.INFRASTRUCTURE.color, assetConnections: assetConnections});
                break;

            case "Talent": 
                asset = await getTalentAssetById(selectedAssetKey);
                assetConnections = this.getAssetConnections(asset);
                this.setState({ asset: asset, assetColor: AssetCategoryEnum.TALENT.color, assetConnections: assetConnections});
                break;
            
            case "Projects": 
                asset = await getProjectsAssetById(selectedAssetKey);
                assetConnections = this.getAssetConnections(asset);
                this.setState({ asset: asset, assetColor: AssetCategoryEnum.PROJECTS.color, assetConnections: assetConnections});
                break;

            case "Business": 
                asset = await getBusinessAssetById(selectedAssetKey);
                assetConnections = this.getAssetConnections(asset);
                this.setState({ asset: asset, assetColor: AssetCategoryEnum.BUSINESS.color, assetConnections: assetConnections});
                break;

            default: return;
        }
        this.validateAsset(asset);
    }

    validateAsset(asset) {
        var missingDetails = [];
        if(asset["Asset Type"] === "Infrastructure") {
            if(!asset["Long Type"] || asset["Long Type"].trim().length == 0) 
                missingDetails.push("Long Type");
        } else {
            if(!asset["Type"] || asset["Type"].trim().length == 0) 
                missingDetails.push("Type");
        }
        if(!asset["Owner"] || asset["Owner"].trim().length == 0) 
            missingDetails.push("Owner");
        if(!asset["Vendor"] || asset["Vendor"].trim().length == 0) 
            missingDetails.push("Vendor");
        if(!asset["Language"] || asset["Language"].trim().length == 0) 
            missingDetails.push("Language");
        if(missingDetails.length != 0)
        {
            ERRORLOG.log(missingDetails.join(", ") + ' details missing for asset "' + asset["Name"] + '"', JSON.stringify(asset));
        }
    }

    // TODO rename to countAssetConnections because that's what it does
    getAssetConnections(asset) {
        let connections = 0;

        if(asset["Application Connections"] && asset['Application Connections'].trim().length)
        {
            console.log(asset['Application Connections'])
            connections += asset['Application Connections'].split(';').length;
        }
        if(asset["Data Connections"] && asset['Data Connections'].trim().length)
        {
            connections += asset['Data Connections'].split(';').length;
        }
        if(asset["Infrastructure Connections"] && asset['Infrastructure Connections'].trim().length)
        {
            connections += asset['Infrastructure Connections'].split(';').length;
        }
        if(asset["Talent Connections"] && asset['Talent Connections'].trim().length)
        {
            connections += asset['Talent Connections'].split(';').length;
        }
        if(asset["Projects Connections"] && asset['Projects Connections'].trim().length)
        {
            connections += asset['Projects Connections'].split(';').length;
        }
        if(asset["Business Connections"] && asset['Business Connections'].trim().length)
        {
            connections += asset['Business Connections'].split(';').length;
        }

        return connections;
    }

    render() {
        if(this.state.asset){
            return (
                <div id="assetDetail" className="card">
                    <div id="assetDetailHeader">
                        <div> 
                            Details
                        </div>
                    </div>
                    <div id="assetName" style={{ color: this.state.assetColor }}>{this.state.asset["Name"]}</div>
                        <div id="assetDetailSections">
                            <div>Connections: {this.state.assetConnections}</div>
                            <div>Type: {this.state.asset["Asset Type"] === "Infrastructure" ? this.state.asset["Long Type"] : this.state.asset["Type"]}</div>
                            <div>Owner: {this.state.asset["Owner"]}</div>
                            <div>Vendor: {this.state.asset["Vendor"]}</div>
                            <div>Language: {this.state.asset["Language"]}</div>
                            <div>Software: {this.state.asset["Software"]}</div>
                            <div>Business Function: {this.state.asset["Business Function"]}</div>
                            <div>Comment: {this.state.asset["Comment"]}</div>
                        </div>
                </div>
    
            );
        } else {
            return null;
        }
    }
}

