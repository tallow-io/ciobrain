import React from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import './ImportButton.css'
import {AssetCategoryEnum} from "../AssetCategoryEnum.js";
import ImportMenuOption from "./ImportMenuOption.js";

const menuStyle = {
    width: "200px",
    display: "flex",
    flexDirection: "column",
    background: "#ffffff",
    padding: "0px",
    border: "1px solid #D6D6D6",
    boxShadow: "0 4px 4px rgba(0, 0, 0, 0.25)",
    borderRadius: "10px"
}

export const ImportButton = () => (<Popup
        trigger={<button className="button">Import</button>}
        position="right top"
        on="hover"
        contentStyle={menuStyle}
        nested
    >
        {Object.values(AssetCategoryEnum).map(category => <ImportMenuOption category={category}/>)}
    </Popup>);
