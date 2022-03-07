import React from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import './ImportButton.css'
import {AssetCategoryEnum} from "../AssetCategoryEnum.js";

export const ImportButton = () => (
    <Popup
        trigger={<button className="button">Import</button>}
        position="right top"
        on="hover"
        contentStyle={{ padding: "0px", border: "none" }}
    >
        <div className="menu">
            {Object.values(AssetCategoryEnum).map(category =>
                <div className="menu-item" style={{color: category.color}}>{category.name}</div>
            )}
        </div>
    </Popup>
);
