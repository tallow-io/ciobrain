import "./App.css"
import React, { Component } from "react"
import Header from "./components/Header"
import AssetMenu from "./components/AssetMenu/AssetMenu"
import AssetDetails from "./components/AssetDetails"
import Graph from "./components/Graph"
import MessageModal from "./components/MessageModal"
import Popup from "reactjs-popup"

export default class App extends Component {
    constructor(props) {
        super(props)
        this.state = {
            selectedCategory: null,
            selectedAssetKey: null,
            messages: []
        }
        window.app = this
        this.removeMessage = this.removeMessage.bind(this)
    }

    addMessage(message) {
        let messages = this.state.messages
        messages.push(message)
        this.setState({ message: messages })
    }

    removeMessage(e) {
        const messages = this.state.messages
        messages.splice(e.currentTarget.outerHTML.replace(/\D/g, ""))
        this.setState({ message: messages })
    }

    selectAsset(selectedCategory, selectedAssetKey) {
        this.setState({
            selectedCategory: selectedCategory,
            selectedAssetKey: selectedAssetKey,
            messages: []
        })
    }

    render() {
        return (
            <div>
                <Header />
                <AssetDetails
                    selectedCategory={this.state.selectedCategory}
                    selectedAssetKey={this.state.selectedAssetKey}
                />
                <AssetMenu selectAsset={this.selectAsset.bind(this)} />
                <Graph
                    selectedCategory={this.state.selectedCategory}
                    selectedAssetKey={this.state.selectedAssetKey}
                />
                {this.state.messages &&
                    this.state.messages.map((message, index) => (
                        <MessageModal
                            key={index}
                            index={index}
                            message={message}
                            removeMessage={this.removeMessage}
                        />
                    ))}
            </div>
        )
    }
}
