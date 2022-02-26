import React, { Component } from 'react';
import './AssetCategoryOption.css';
import * as asset from './../../common/Asset'

export default class AssetCategoryOption extends Component {

	constructor(props) {
		super(props);
		this.state = {
			selected: false,
			backgroundColor: "white",
			assetCategoryOptions: [],
			idColumnName: "",
			selectedAssetKey: null
		}
	}

	componentWillReceiveProps(nextProps) {
		this.setState({ selected: nextProps.selected, backgroundColor: nextProps.backgroundColor });
	}

	async componentDidMount() {
		var assetCategoryOption = [];
		
		switch(this.props.category) {
			case 'Application':
				assetCategoryOption = await asset.getAllApplicationAssets();
				break;
			case 'Data':
				assetCategoryOption = await asset.getAllDataAssets();
				break;
			case 'Infrastructure':
				assetCategoryOption = await asset.getAllInfrastructureAssets();
				break;
			case 'Talent':
				assetCategoryOption = await asset.getAllTalentAssets();
				break;
			case 'Projects':
				assetCategoryOption = await asset.getAllProjectsAssets();
				break;
			case 'Business':
				assetCategoryOption = await asset.getAllBusinessAssets();
				break;
		}
		
		this.setState({assetCategoryOptions: assetCategoryOption});
	}

	selectCategory(event) {
		this.props.selectCategory(this.props.category);
		event.preventDefault();
	}

	selectAsset(event){
		var arr = JSON.stringify(event.target.outerHTML).split(" ");
		var assetKey = arr.find(element => element.includes('data-key')).match(/\d+/g)[0];
		this.props.selectAsset(assetKey);
		this.setState({selectedAssetKey: assetKey})
		event.preventDefault();
	}

	render() {
		var idColumnName = this.props.category + ' ID'; 
		
		var getTextDecorationStyle = (assetId) => {
			if (this.state.selectedAssetKey == assetId) {
				return {color: this.props.color, textDecoration: "underline"};
			}
			return {color: this.props.color};
		}

		var getTextDecorationStyle = (assetId) => {
			if (this.state.selectedAssetKey == assetId) {
				return {color: this.props.color, textDecoration: "underline"};
			}
			return {color: this.props.color};

		}

		return (
			<div>
				<div className="assetCategoryOption" style={{ backgroundColor: this.state.backgroundColor }} onClick={this.selectCategory.bind(this)}>
					<div style={{ color: this.props.color }}>
						{this.props.category}
					</div>
				</div>
				{this.state.selected &&
					<div className="assetCategoryDropdown" >
						{this.state.assetCategoryOptions && this.state.assetCategoryOptions.map( (assetOption, index) => <div className="assetOption" key={index} data-key={assetOption[idColumnName]} value={index} style={getTextDecorationStyle(assetOption[idColumnName])} onClick={this.selectAsset.bind(this)}>{assetOption['Name']}</div>)}
					</div>
				}
			</div>
		);
	}
}
