import React, {Component} from 'react'
import * as d3 from 'd3'
import './Graph.css'
import * as asset from './../common/Asset'
import { AssetCategoryEnum } from './AssetCategoryEnum';
import appIcon from '../images/appIcon.png'
import dataIcon from '../images/dataIcon.png'
import infrastructureIcon from '../images/infrastructureIcon.png'
import * as ERRORLOG from '../common/ErrorLog'

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
            hierarchy: null,
            nextIndex: 1
        }
        this.addToHierarchy.bind(this);
    }

    async componentWillReceiveProps(nextProps) {
		if(this.state.selectedCategory !== nextProps.selectedCategory ||  this.state.selectedAssetKey !== nextProps.selectedAssetKey) {
            this.setState({ selectedCategory: nextProps.selectedCategory, selectedAssetKey: nextProps.selectedAssetKey}, async () => {
                if(nextProps.selectedCategory && nextProps.selectedAssetKey) {
                    await this.initHierarchy();
                    // this.update(nextProps.selectedCategory, nextProps.selectedAssetKey);
                    this.updateForce()
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
        // this.update(this.state.selectedCategory, this.state.selectedAssetKey);
        this.updateForce()
    }

    clearGraph() {
        d3.selectAll("svg")
            .remove()
            .exit();
    }

    /* Performs a tree search to look for the index of the selected node in hierarchy
     * Adds the assetChildren to children attribute of the selected node
     * Checks if the children contain any of the parents on the selected node's graph path
     */
    addToHierarchy(index, assetChildren, hierarchy) {
        var children = hierarchy["children"];
        if(hierarchy["index"] == index) {
            hierarchy["children"] = assetChildren;
            return hierarchy;
        } else {
            if(children && children !== null) {
                var arrayIndex = 0;
                var parentArrayIndex = arrayIndex;
                while(arrayIndex < children.length && children[arrayIndex]["index"] <= index) {
                    parentArrayIndex = arrayIndex;
                    arrayIndex = arrayIndex + 1;
                }
                var parent = children[parentArrayIndex];
                assetChildren = assetChildren.filter(item => {
                    return !this.equal(hierarchy, item);
                })
                var temp = this.addToHierarchy(index, assetChildren, parent, []);
                hierarchy["children"][parentArrayIndex] = temp;
                return hierarchy;
            }
        }
        return hierarchy;
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

    async expandAsset(i,d) {
        var assetChildren = null;
        switch(d.data["Asset Type"]) {
            case "Application":
                assetChildren = await asset.getApplicationAssetChildrenById(d.data["Application ID"]);
                break;
            case "Data":
                assetChildren = await asset.getDataAssetChildrenById(d.data["Data ID"]);
                break;
            case "Infrastructure":
                assetChildren = await asset.getInfrastructureAssetChildrenById(d.data["Infrastructure ID"]);
                break;
            case "Talent":
                assetChildren = await asset.getTalentAssetChildrenById(d.data["Talent ID"]);
                break;
            case "Projects":
                assetChildren = await asset.getProjectsAssetChildrenById(d.data["Projects ID"]);
                break;
            case "Business":
                assetChildren = await asset.getBusinessAssetChildrenById(d.data["Business ID"]);
                break;
            default: return;
        }

        assetChildren = assetChildren.children
        assetChildren = assetChildren.concat(await this.getImplicitConnections(d.data[d.data["Asset Type"] + " ID"], d.data["Asset Type"]))
        let findResults = assetChildren.map(asset => {
            return this.isInHierarchy(this.state.hierarchy, asset)
        })
        // these are new assets that are not yet in the graph
        let unique = findResults.filter(result => {
            return !result[0]
        }).map(result => {
            return result[1]
        })
        // these assets from assetChildren are replaced by references to the assets already in the graph
        let duplicates = findResults.filter(result => {
            return result[0]
        }).map(result => {
            return result[1]
        })

        assetChildren = unique.concat(duplicates)

        if(assetChildren && assetChildren.length > 0) {
            var newHierarchy = this.addToHierarchy(d.data["index"], assetChildren, this.state.hierarchy);
            newHierarchy = this.indexHierarchy(newHierarchy);
            this.setState({hierarchy: newHierarchy});  
            // this.update(this.state.selectedCategory, this.state.selectedAssetKey);
            this.updateForce()
        }
    }

    /* FOR FUTURE ADAPATION TO THE DATABASE:
     * 
     * createHierarchy formats the data into hierarchical data to 
     * allow d3 functions like d3.hierarchy and d3.cluster to work its magic on it.
     * Depending on the future implementation of database calls and queries, this
     * will need to be pdated so that it still produces hierarchical data with a
     * children attribute, returning an array of child nodes:
     * 
     *      {
     *          ...data
     *          children : []
     *      }
     */
    async initHierarchy() {
        var hierarchy = {};
        switch(this.state.selectedCategory) {
            case 'Application': 
                hierarchy = await asset.getApplicationAssetChildrenById(this.state.selectedAssetKey);
                break;
            case 'Data':
                hierarchy = await asset.getDataAssetChildrenById(this.state.selectedAssetKey);
                break;
            case 'Infrastructure':
                hierarchy = await asset.getInfrastructureAssetChildrenById(this.state.selectedAssetKey);
                break;
            case 'Talent':
                hierarchy = await asset.getTalentAssetChildrenById(this.state.selectedAssetKey);
                break;
            case 'Projects':
                hierarchy = await asset.getProjectsAssetChildrenById(this.state.selectedAssetKey);
                break;
            case 'Business':
                hierarchy = await asset.getBusinessAssetChildrenById(this.state.selectedAssetKey);
                break;
        }
        hierarchy.children = hierarchy.children.concat(await this.getImplicitConnections(this.state.selectedAssetKey, this.state.selectedCategory))

        hierarchy = this.indexHierarchy(hierarchy);
        this.setState({hierarchy: hierarchy});
        var children = hierarchy['children'];
        if(!children || children == null || children.length == 0) {
            ERRORLOG.log("Selected " + this.state.selectedCategory.toLowerCase() + " asset \"" + hierarchy["Name"].trim() + "\" has no connections ",
            "Asset's hierarchy data: " + JSON.stringify(this.state.hierarchy));
        }
    }

    // Check if an asset is already in the graph, and get a reference to it if it is,
    // or a reference to asset if it isn't. The seen parameter is an object so changes to it
    // will remain after returning.
    isInHierarchy(hierarchy, asset, seen = {list: []}) {
        if(seen.list.find(asset => {
            return this.equal(hierarchy, asset)
        })) {
            return [true, hierarchy]
        }
        // base case
        if (this.equal(hierarchy, asset)) {
            return [true, hierarchy]
        }

        seen.list = seen.list.concat(hierarchy)

        // this is a leaf node, no children to check
        if (!("children" in hierarchy)) {
            return [false, asset]
        }
        // recursive case, may be in one of root's children subtrees
        for (let connection of hierarchy["children"]) {
            let [exists, existingAsset] = this.isInHierarchy(connection, asset, seen)
            if (exists) {
                return [true, existingAsset]
            }
        }

        // not found in any subtrees
        return [false, asset]
    }

    //Create indexes for asset nodes depth-first to allow for a binary search
    indexHierarchy(hierarchy) {
        if (!("index" in hierarchy)) {
            hierarchy["index"] = this.state.nextIndex;
            this.state.nextIndex++
        }
        var children = hierarchy['children'];
        if(children && children !== null) {
            hierarchy['children'] = children.map(item => this.indexHierarchy(item));
        }
        return hierarchy;
    }

    countChildren(asset){
        let childrenCount = 0;
        if (asset['Application Connections'] && asset['Application Connections'].trim().length) {
            childrenCount += asset['Application Connections'].split(';').map(item => parseInt(item.replace(/\D/g, ''))).length;
        }
        if (asset['Data Connections'] && asset['Data Connections'].trim().length ) {
            childrenCount += asset['Data Connections'].split(';').map(item => parseInt(item.replace(/\D/g, ''))).length;
        }
        if (asset['Infrastructure Connections'] && asset['Infrastructure Connections'].trim().length){
            childrenCount += asset['Infrastructure Connections'].split(';').map(item => parseInt(item.replace(/\D/g, ''))).length;
        }
        if (asset['Talent Connections'] && asset['Talent Connections'].trim().length){
            childrenCount += asset['Talent Connections'].split(';').map(item => parseInt(item.replace(/\D/g, ''))).length;
        }
        if (asset['Projects Connections'] && asset['Projects Connections'].trim().length){
            childrenCount += asset['Projects Connections'].split(';').map(item => parseInt(item.replace(/\D/g, ''))).length;
        }
        if (asset['Business Connections'] && asset['Business Connections'].trim().length){
            childrenCount += asset['Business Connections'].split(';').map(item => parseInt(item.replace(/\D/g, ''))).length;
        }

        childrenCount += this.getImplicitConnections(this.state.selectedAssetKey, this.state.selectedCategory).length;
        return childrenCount;
    }

    //checks if asset1 exists in the children of asset2
    findInChildren(asset1, asset2){
        let applicationAssetChildrenIds = [];
        let dataAssetChildrenIds = [];
        let infrastructureAssetChildrenIds = [];
        let talentAssetChildrenIds = [];
        let projectsAssetChildrenIds = [];
        let businessAssetChildrenIds = [];
        if (asset2['Application Connections'] && asset2['Application Connections'].trim().length) {
            applicationAssetChildrenIds = asset2['Application Connections'].split(';').map(item => parseInt(item.replace(/\D/g, '')));
            console.log("children: " + JSON.stringify(applicationAssetChildrenIds));
        }
        if (asset2['Data Connections'] && asset2['Data Connections'].trim().length ) {
            dataAssetChildrenIds = asset2['Data Connections'].split(';').map(item => parseInt(item.replace(/\D/g, '')));
            console.log("children: " + JSON.stringify(dataAssetChildrenIds));
        }
        if (asset2['Infrastructure Connections'] && asset2['Infrastructure Connections'].trim().length){
            infrastructureAssetChildrenIds = asset2['Infrastructure Connections'].split(';').map(item => parseInt(item.replace(/\D/g, '')));
            console.log("children: " + JSON.stringify(infrastructureAssetChildrenIds));
        }
        if (asset2['Talent Connections'] && asset2['Talent Connections'].trim().length){
            talentAssetChildrenIds = asset2['Talent Connections'].split(';').map(item => parseInt(item.replace(/\D/g, '')));
            console.log("children: " + JSON.stringify(talentAssetChildrenIds));
        }
        if (asset2['Projects Connections'] && asset2['Projects Connections'].trim().length){
            projectsAssetChildrenIds = asset2['Projects Connections'].split(';').map(item => parseInt(item.replace(/\D/g, '')));
            console.log("children: " + JSON.stringify(projectsAssetChildrenIds));
        }
        if (asset2['Business Connections'] && asset2['Business Connections'].trim().length){
            businessAssetChildrenIds = asset2['Business Connections'].split(';').map(item => parseInt(item.replace(/\D/g, '')));
            console.log("children: " + JSON.stringify(businessAssetChildrenIds));
        }

        switch(asset1["Asset Type"]) {
            case 'Application': 
                return applicationAssetChildrenIds.includes(asset1['Application ID']);
            case 'Data':
                return dataAssetChildrenIds.includes(asset1['Data ID']);
            case 'Infrastructure':
                return infrastructureAssetChildrenIds.includes(asset1['Infrastructure ID']);
            case 'Talent':
                return talentAssetChildrenIds.includes(asset1['Talent ID']);
            case 'Projects':
                return projectsAssetChildrenIds.includes(asset1['Projects ID']);
            case 'Business':
                return businessAssetChildrenIds.includes(asset1['Business ID']);
        }
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

    /* This function checks for whether the current node has valid children that need to be displayed
     * Cyclical possibilites with children must be removed but repeated nodes can be allowed to show connections back to (great) grandparents
     * Valid graph paths:
     *      1 - 2 - 3 - 4 - 1(great grandparent)
     *      1 - 2 - 3 - 4 - 2(grandparent)
     * Invalid graph paths:
     *      1 - 2 - 3 - 2(parent)
     * Return true if the asset has valid children that are not displayed. 
     * Return false if...
     *      current asset is repeated in the current path - a grandparent connection that displays but does not expand
     *      asset's only children is its parent - parent connection already displayed, no other valid children need to be displayed
    */
    checkForUndisplayedChildren(asset){
        // TODO change this to get all connections to asset and check if any of them are not yet in the graph

        let childrenCount = this.countChildren(asset.data);

        if(childrenCount === 0){
            //no children were found
            return false;
        }

        let parent = asset.parent;
        if(childrenCount === 1  && this.findInChildren(parent.data, asset.data)) {
            //only child is its parent
            return false;
        }

        let grandparent = parent.parent;
        while(grandparent && !this.equal(grandparent.data, asset.data))
        {
            grandparent = grandparent.parent;
        }
        if(grandparent && typeof grandparent !== 'undefined')
        {
            //asset was found to be a grandparent node
            return false;
        }

        return true;
    }

    /* FOR FUTURE ADAPTION TO THE DATABASE:
     * 
     * update() will take in hierarchical data and build a graph using d3 functions.
     * However, the function is currently parsing data based on the current xlsx 
     * sheet column names which may change in the database implementation.
     * If that is the case, the following attributes are being used below and 
     * may need to be updated:
     *      'Application ID'
     *      'Data ID'
     *      'Infrastructure ID'
     *      'Name'
     */
    update(selectedCategory, selectedAssetKey) {
        this.clearGraph();

        var container = d3.select(this.graphReference.current);
        var width = this.state.width - 500;
        var height = this.state.height - 50;

        var svg = container
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
                .attr("transform", "translate(50,50)");

        var cluster = d3.cluster()
            .size([height-100, width - 250]);

        var data = this.state.hierarchy;

        //empty graph container displayed if hierarchy data is empty
        if (!data || Object.keys(data).length === 0) {
            return;
        }

        //empty graph container displayed if screen size is too small
        if (width <= 350 || height <= 300) {
            return;
        }

        var root = d3.hierarchy(data, function(d) {
            return d.children;
        });

        root.sum(function(d) { 
                if(d['Application ID'])
                    return parseInt(d['Application ID'])
                else if (d['Data ID'])
                    return parseInt(d['Data ID'])
                else if (d['Infrastructure ID'])
                    return parseInt(d['Infrastructure ID'])
                else if (d['Talent ID'])
                    return parseInt(d['Talent ID'])
                else if (d['Projects ID'])
                    return parseInt(d['Projects ID'])
                else if (d['Business ID'])
                    return parseInt(d['Business ID'])
            })
            .sort(function(a, b) { return b.data.index - a.data.index; });

        
        cluster(root);

        svg.selectAll('path')
            .data( root.descendants().slice(1) )
            .enter()
            .append('path')
            .attr("d", function(d) {
                return "M" + d.y + "," + d.x
                + "C" + (d.parent.y + 50) + "," + d.x
                + " " + (d.parent.y + 150) + "," + d.parent.x // 50 and 150 are coordinates of inflexion, play with it to change links shape
                + " " + d.parent.y + "," + d.parent.x;
              })
            .style("fill", 'none')
            .attr("stroke", '#ccc');

        //Build graph nodes
        var nodes = svg.selectAll("g")
            .data(root.descendants())
            .enter()
            .append("g")
                .attr("transform", function(d) {
                    return "translate(" + d.y + "," + d.x + ")"
                })
            .append("circle")
                .attr("r", 15)
                .style("fill", function(d){
                    var assetType = Object.values(AssetCategoryEnum).filter( category => d.data["Asset Type"] === category.name )[0];
                    return assetType.color;
                })
                .attr("stroke", function(d){
                    var assetType = Object.values(AssetCategoryEnum).filter( category => d.data["Asset Type"] === category.name )[0];
                    return assetType.color;
                })
                .style("stroke-width", 2)

        //Container for the gradients
        var defs = svg.append("defs");

        //Apply filter for the outside glow on graph nodes
        var filter = defs.append("filter")
            .attr("id","glow");
        filter.append("feGaussianBlur")
            .attr("stdDeviation","2")
            .attr("result","coloredBlur");

        var feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode")
            .attr("in","coloredBlur");
        feMerge.append("feMergeNode")
            .attr("in","SourceGraphic");

        svg.selectAll("circle")
            .style("filter", "url(#glow)");

        //Add asset name labels to graph nodes
        svg.append("g")
                .attr("class", "labels")
            .selectAll("text")
                .data(root)
            .enter().append("text")
                .attr("transform", function(d) {
                    return "translate(" + (d.y + 10) + "," + ( d.x + 30) + ")"
                })
            .text(function(d) { return d.data['Name'] });
        
        //Add expand buttons to leaf nodes with undisplayed children
        var polygon = svg.selectAll('polygon')
            .data(root)
            .enter()
            .append('polygon')
                .filter((d, i) => {
                    if(!d.data.children) {
                        return this.checkForUndisplayedChildren(d);
                    } else {
                        return false;
                    }
                })
                .attr("points", function(d) {
                    return (d.y + 24)+ "," + (d.x - 10) + " "
                    + (d.y + 24) + "," + (d.x + 10) + " "
                    + (d.y + 32) + "," + (d.x ) ;
                  })
                .style("fill", "red")
                .attr("index", function(d) {
                    return d.data["index"];
                })
                .on("mouseover", function() {
                    d3.select(this).transition()
                        .duration('50')
                        .ease(d3.easeLinear)
                        .style("opacity", .8)
                        .attr("points", function(d) {
                            return (d.y + 24)+ "," + (d.x - 15) + " "
                            + (d.y + 24) + "," + (d.x + 15) + " "
                            + (d.y + 36) + "," + (d.x ) ;
                          });
                })
                .on("mouseout", function() {
                d3.select(this).transition()
                    .duration('50')
                    .ease(d3.easeLinear)
                    .style("opacity", 1)
                    .attr("points", function(d) {
                        return (d.y + 24)+ "," + (d.x - 10) + " "
                        + (d.y + 24) + "," + (d.x + 10) + " "
                        + (d.y + 32) + "," + (d.x ) ;
                        });
                })
                .on("click", (i, d) => {
                    this.expandAsset(i, d);
                });

        
        svg.append("g")
            .attr("class", "icons")
        .selectAll("icons")
            .data(root)
        .enter().append('svg:image')
            .attr("transform", function(d) {
                return "translate(" + (d.y-9) + "," + (d.x-11) + ")"
            })
            .attr('width', 18)
            .attr('height', 22)
            .attr("xlink:href",  function(d) {
                switch(d.data["Asset Type"]) {
                    case "Application": return appIcon;
                    case "Data":  return dataIcon;
                    case "Infrastructure":  return infrastructureIcon;
                    //Placeholder icons for Talent, Projects, and Business
                    case "Talent":  return infrastructureIcon;
                    case "Projects":  return infrastructureIcon;
                    case "Business":  return infrastructureIcon;
                    default: return;
                }
            });
       
    }

    async updateForce() {
        this.clearGraph();

        const container = d3.select(this.graphReference.current);
        const width = this.state.width - 500;
        const height = this.state.height - 50;

        const svg = container
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(50,50)");

        const data = {
            nodes: await Promise.all([
                asset.getBusinessAssetById(1),
                asset.getBusinessAssetById(3),
                asset.getDataAssetById(1),
                asset.getDataAssetById(2),
                asset.getApplicationAssetById(1),
                asset.getApplicationAssetById(2),
                asset.getTalentAssetById(1),
                asset.getTalentAssetById(2),
                asset.getTalentAssetById(5)
            ]),
            links: [
                {source: "B-1", target: "D-1", value: 1},
                {source: "B-1", target: "D-2", value: 1},
                {source: "D-1", target: "A-1", value: 1},
                {source: "D-1", target: "A-2", value: 1},
                {source: "D-1", target: "T-1", value: 1},
                {source: "D-1", target: "T-2", value: 1},
                {source: "D-1", target: "T-5", value: 1},
                {source: "D-2", target: "B-3", value: 1},
                {source: "D-2", target: "A-2", value: 1},
                {source: "D-2", target: "T-2", value: 1}
            ]
        }

        data.nodes.forEach((node, index) => {
            node["group"] = index + 1
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
        });

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
            .attr("class", "node");

        const assetTypes = Object.values(AssetCategoryEnum);

        node.append("circle")
            .attr("r", 20)
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
            .attr("x", -10)
            .attr("y", -10)
            .attr("width", 20)
            .attr("height", 20);

        node.append("text")
            .style("text-anchor", "middle")
            .attr("y", 40)
            .text(d => d["Name"]);

        //Container for the gradients
        const defs = svg.append("defs");

        //Apply filter for the outside glow on graph nodes
        const filter = defs.append("filter")
            .attr("id", "glow");
        filter.append("feGaussianBlur")
            .attr("stdDeviation", "2")
            .attr("result", "coloredBlur");

        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode")
            .attr("in", "coloredBlur");
        feMerge.append("feMergeNode")
            .attr("in", "SourceGraphic");

        svg.selectAll("circle")
            .style("filter", "url(#glow)");

        // Let's list the force we wanna apply on the network
        const simulation = d3.forceSimulation(data.nodes)              // Force algorithm is applied to data.nodes
            .force("link", d3.forceLink()                        // This force provides links between nodes
                .id(d => d["id"])                                  // This provide  the id of a node
                .links(data.links)                                    // and this the list of links
            )
            .force("charge", d3.forceManyBody().strength(-5000))         // This adds repulsion between nodes. Play with the -400 for the repulsion strength
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
