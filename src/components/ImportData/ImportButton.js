import React from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import './ImportButton.css'
import {AssetCategoryEnum} from "../AssetCategoryEnum.js";
import ImportMenuOption from "./ImportMenuOption.js";

export const ImportButton = () => (
    <Popup
        trigger={<button className="button">Import</button>}
        position="right top"
        on="hover"
        contentStyle={{ padding: "0px", border: "none" }}
    >
        <div className="menu">
            {Object.values(AssetCategoryEnum).map(category =>
                <ImportMenuOption category={category} />
            )}
        </div>
    </Popup>
);
