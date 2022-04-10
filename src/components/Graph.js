import React, {Component} from 'react'
import * as d3 from 'd3'
import './Graph.css'
import * as asset from './../common/Asset'
import { AssetCategoryEnum } from './AssetCategoryEnum';
import appIcon from '../images/appIcon.png'
import dataIcon from '../images/dataIcon.png'
import infrastructureIcon from '../images/infrastructureIcon.png'
import * as ERRORLOG from '../common/ErrorLog'
import { tickStep } from 'd3';

export default class Graph extends Component {
    constructor (props){
        super(props);
        this.graphReference = React.createRef();
        this.state = {
            selectedCategory: this.props.selectedCategory,
            selectedAssetKey: this.props.selectedAssetKey,
            width: null,
            height: null,
            resizeTimeout: null,
            // data to display
            data: null,
            // assets that are related to those on the graph but not yet drawn
            undisplayed: []
        }
    }

    async componentWillReceiveProps(nextProps) {
		if(this.state.selectedCategory !== nextProps.selectedCategory ||  this.state.selectedAssetKey !== nextProps.selectedAssetKey) {
            this.setState({ selectedCategory: nextProps.selectedCategory, selectedAssetKey: nextProps.selectedAssetKey}, async () => {
                if(nextProps.selectedCategory && nextProps.selectedAssetKey) {
                    await this.initData();
                    this.updateForce(this.state.selectedCategory, this.state.selectedAssetKey)
                }
            });
        }
    }

    async componentDidMount() {
        this.initDimensions();
        window.addEventListener("resize", () => {
            if(this.state.selectedCategory && this.state.selectedAssetKey) {
                clearTimeout(this.state.resizeTimeout);
                this.setState({resizeTimeout: setTimeout(this.updateDimensions.bind(this), 500)});
            }
        });
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.updateDimensions.bind(this));
    }

    initDimensions() {
        this.setState({width: window.innerWidth, height: window.innerHeight});
    }

    updateDimensions() {
        this.setState({width: window.innerWidth, height: window.innerHeight});
        this.updateForce(this.state.selectedCategory, this.state.selectedAssetKey)
    }

    clearGraph() {
        d3.selectAll("svg")
            .remove()
            .exit();
    }

    async getImplicitConnections(key, type) {
        var connections = [];
        var assets = await asset.getAllAssets()
        assets.forEach(asset => {
            if (asset[type + ' Connections'] && asset[type + ' Connections'].trim().length ) {
                asset[type + ' Connections'].split(';').map(item => parseInt(item.replace(/\D/g, ''))).forEach(conn => {
                    if(conn == key) {
                        connections.push(asset)
                    }
                });
            }
        });
        return connections
    }

    // Add assets to the grapnh
    async expandAssetForce(node) {
        let toMove = this.state.undisplayed
            .filter(conn => conn["source"] === node["id"])
            .map(conn => conn["target"])
        this.tagNodes(toMove)

        // remove from undisplayed
        this.state.undisplayed = this.state.undisplayed
            .filter(conn => toMove.find(moving => this.equal(conn["target"], moving)) === undefined)

        let nodes = this.state.data.nodes.concat(toMove)
        nodes.forEach(node => node["connections"] = 0)
        let links = await this.createLinks(nodes)
        this.setState({data: { nodes: nodes, links: links }})
        this.updateForce(this.state.selectedCategory, this.state.selectedAssetKey)
    }

    async initData() {
        var nodes = await this.initNodes()
        var links = await this.createLinks(nodes)
        this.setState({data: { nodes: nodes, links: links }})
    }

    async initNodes() {
        var origin;
        var nodes = [];
        switch(this.state.selectedCategory) {
            case 'Application': 
                origin = await asset.getApplicationAssetById(this.state.selectedAssetKey)
                nodes.push(origin)
                nodes = nodes.concat((await asset.getApplicationAssetChildrenById(this.state.selectedAssetKey)).children);
                break;
            case 'Data':
                origin = await asset.getDataAssetById(this.state.selectedAssetKey)
                nodes.push(origin)
                nodes = nodes.concat((await asset.getDataAssetChildrenById(this.state.selectedAssetKey)).children);
                break;
            case 'Infrastructure':
                origin = await asset.getInfrastructureAssetById(this.state.selectedAssetKey)
                nodes.push(origin)
                nodes = nodes.concat((await asset.getInfrastructureAssetChildrenById(this.state.selectedAssetKey)).children);
                break;
            case 'Talent':
                origin = await asset.getTalentAssetById(this.state.selectedAssetKey)
                nodes.push(origin)
                nodes = nodes.concat((await asset.getTalentAssetChildrenById(this.state.selectedAssetKey)).children);
                break;
            case 'Projects':
                origin = await asset.getProjectsAssetById(this.state.selectedAssetKey)
                nodes.push(origin)
                nodes = nodes.concat((await asset.getProjectsAssetChildrenById(this.state.selectedAssetKey)).children);
                break;
            case 'Business':
                origin = await asset.getBusinessAssetById(this.state.selectedAssetKey)
                nodes.push(origin)
                nodes = nodes.concat((await asset.getBusinessAssetChildrenById(this.state.selectedAssetKey)).children);
                break;
        }
        var implicit = await this.getImplicitConnections(this.state.selectedAssetKey, this.state.selectedCategory)
        nodes = nodes.concat(implicit)
        this.tagNodes(nodes)

        return nodes
    }

    // Create links between all nodes and set their connections properly.
    // Also cache undisplayed connectons to the nodes that are in the graph
    async createLinks(nodes) {
        let direct;
        let inGraph;
        let undisplayed = this.state.undisplayed
        let links = [];
        for(var existing of nodes) {
            if(existing["Application ID"]) {
                direct = (await asset.getApplicationAssetChildrenById(existing["Application ID"])).children
            } else if(existing["Data ID"]) {
                direct = (await asset.getDataAssetChildrenById(existing["Data ID"])).children
            } else if(existing["Infrastructure ID"]) {
                direct = (await asset.getInfrastructureAssetChildrenById(existing["Infrastructure ID"])).children
            } else if(existing["Talent ID"]) {
                direct = (await asset.getTalentAssetChildrenById(existing["Talent ID"])).children
            } else if(existing["Projects ID"]) {
                direct = (await asset.getProjectsAssetChildrenById(existing["Projects ID"])).children
            } else if(existing["Business ID"]) {
                direct = (await asset.getBusinessAssetChildrenById(existing["Business ID"])).children
            }

            // get undisplayed connections that are implicitly connected to the node
            undisplayed = undisplayed.concat((await this.getImplicitConnections(existing[existing["Asset Type"] + " ID"], existing["Asset Type"]))
                .filter(impl => nodes.find(node => this.equal(node, impl)) === undefined)
                .map(conn => { return {source: existing["id"], target: conn} }))
                

            if(direct !== undefined) {
                // direct connections to other nodes in the graph
                inGraph = direct.map(connected =>
                    nodes.find(node =>
                        this.equal(node, connected)
                    )
                ).filter(node => node !== undefined)

                // and direct connections to those outside the graph
                undisplayed = undisplayed.concat(direct.map(connected => {
                    let found = nodes.find(node =>
                        this.equal(node, connected)
                    )
                    return found === undefined ? connected : undefined
                    }).filter(node => node !== undefined)
                    .map(conn => { return {source: existing["id"], target: conn} }))
            }
            inGraph.forEach(node => node["connections"] += 1)

            existing["connections"] += inGraph.length

            // create links between them
            links = links.concat(inGraph.map(connected => {
                return {source: existing["id"], target: connected["id"], value: 1}
            }))
        }

        this.state.undisplayed = undisplayed
        return links
    }

    // Add the "id", "connections", and "group" properties to nodes
    tagNodes(nodes) {
        nodes.forEach((node, index) => {
            node["connections"] = 0
            switch (node["Asset Type"]) {
                case "Application":
                    node["id"] = "A-" + node["Application ID"];
                    break;
                case "Data":
                    node["id"] = "D-" + node["Data ID"];
                    break;
                case "Infrastructure":
                    node["id"] = "I-" + node["Infrastructure ID"];
                    break;
                case "Talent":
                    node["id"] = "T-" + node["Talent ID"];
                    break;
                case "Projects":
                    node["id"] = "P-" + node["Projects ID"];
                    break;
                case "Business":
                    node["id"] = "B-" + node["Business ID"];
                    break;
                default:
                    break;
            }
            // mandatory, ignored
            node["group"] = index + 1
        })
        return nodes
    }

    //checks if asset1 is the same as asset2 
    equal(asset1, asset2){
        switch(asset1["Asset Type"]) {
            case "Application": return asset1["Application ID"] === asset2["Application ID"];
            case "Data": return asset1["Data ID"] === asset2["Data ID"];
            case "Infrastructure": return asset1["Infrastructure ID"] === asset2["Infrastructure ID"];
            case "Talent": return asset1["Talent ID"] === asset2["Talent ID"];
            case "Projects": return asset1["Projects ID"] === asset2["Projects ID"];
            case "Business": return asset1["Business ID"] === asset2["Business ID"];
            default: return false;
        }
    }

    // 
    async updateForce(selectedCategory, selectedAssetKey) {
        this.clearGraph();

        const container = d3.select(this.graphReference.current);
        const width = this.state.width - 500;
        const height = this.state.height - 50;

        const matchAsset = (d, ifMatch, otherwise) => { if(d[selectedCategory + " ID"] && d[selectedCategory + " ID"] == selectedAssetKey) { return ifMatch } else { return otherwise } }

        const svg = container
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(50,50)");

        const data = this.state.data

        // Initialize the links
        const link = svg
            .selectAll("line")
            .data(data.links)
            .enter()
            .append("line")
            .style("stroke", "#aaa")

        // Initialize the nodes
        const node = svg.selectAll(".node")
            .data(data.nodes)
            .enter().append("g")
            .attr("class", "node")
            .on("click", (_, d) => {
                this.expandAssetForce(d);
            });

        const assetTypes = Object.values(AssetCategoryEnum);

        node.append("circle")
            .attr("r", d => matchAsset(d, 22, 20) + (d["connections"] - 1) * 2)
            .style("fill", d => assetTypes.find(type => d["Asset Type"] === type.name).color)
            .attr("stroke", d => assetTypes.find(type => d["Asset Type"] === type.name).color)
            .style("stroke-width", 2);

        node.append("image")
            .attr("xlink:href", d => {
                switch (d["Asset Type"]) {
                    case "Application":
                        return appIcon;
                    case "Data":
                        return dataIcon;
                    case "Infrastructure":
                        return infrastructureIcon;
                    //Placeholder icons for Talent, Projects, and Business
                    case "Talent":
                        return infrastructureIcon;
                    case "Projects":
                        return infrastructureIcon;
                    case "Business":
                        return infrastructureIcon;
                    default:
                        return;
                }
            })
            .attr("x", d => -10 - (d["connections"] - 1))
            .attr("y", d => -10 - (d["connections"] - 1))
            .attr("width", d => 20 + (d["connections"] - 1) * 2)
            .attr("height", d => 20 + (d["connections"] - 1) * 2);

        node.append("text")
            .style("text-anchor", "middle")
            .attr("y", d => 40 + (d["connections"] - 1))
            .attr("font-weight", d => matchAsset(d, "bold", "normal"))
            .attr("font-size", d => matchAsset(d, "large", "medium"))
            .attr("text-decoration", d => matchAsset(d, "underline", "none"))
            .text(d => d["Name"]);

        //Container for the gradients
        const defs = svg.append("defs");

        // filter for the glow around non-selected nodes
        const normalFilter = defs.append("filter")
            .attr("id", "normalGlow");
        normalFilter.append("feGaussianBlur")
            .attr("stdDeviation", "1.5")
            .attr("result", "coloredBlur");

        // filter for the glow around selected nodes
        const selectedFilter = defs.append("filter")
            .attr("id", "selectedGlow");
        selectedFilter.append("feGaussianBlur")
            .attr("stdDeviation", "2.5")
            .attr("result", "coloredBlur");

        svg.selectAll("circle")
            .style("filter", d => matchAsset(d, "url(#selectedGlow)", "url(#normalGlow)"));

        // Let's list the force we wanna apply on the network
        const simulation = d3.forceSimulation(data.nodes)              // Force algorithm is applied to data.nodes
            .force("link", d3.forceLink()                        // This force provides links between nodes
                .id(d => d["id"])                                  // This provide  the id of a node
                .links(data.links)                                    // and this the list of links
            )
            .force("charge", d3.forceManyBody().strength(-1000))         // This adds repulsion between nodes. Play with the -400 for the repulsion strength
            .force("center", d3.forceCenter(width / 2, height / 2))      // This force attracts nodes to the center of the svg area
            .on("end", () => {
                link.attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);

                node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");
            });
        simulation.tick(1000);
    }

    render() {
        return (
            // <div className="graph" ref={this.graphReference} style={{ backgroundColor: "var(--green)" }}>
            <div className="graph" ref={this.graphReference}>
                
            </div>
        );
    }
} 
