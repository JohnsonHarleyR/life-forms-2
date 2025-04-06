import React, {useRef, useState, useEffect, useContext} from 'react';
import { CanvasInfo } from '../../../../../crosscutting/constants/canvasConstants';
import './css/plantCard.css';

const PlantCard = ({typeInfo}) => {

  // const createFoodString = (array) => {
  //   let str = "NONE";
  //   for (let i = 0; i < array.length; i++) {
  //     if (i === 0) {
  //       str = "";
  //     }

  //     str += array[i];

  //     if (i !== array.length - 1) {
  //       str += ', ';
  //     }
  //   }
  //   return str;
  // }
  const calculateSpawnRate = (growInterval, intervalRate) => {
    let perMs = growInterval * intervalRate;
    let perS = perMs / 1000;
    return Math.round(perS * 100) / 100;
  }

  const name = `${typeInfo.type}`;
  const color = typeInfo.color;
  const width = typeInfo.width;
  const height = typeInfo.height;
  const energy = typeInfo.energy;
  const spawnRate = calculateSpawnRate(typeInfo.growInterval, CanvasInfo.INTERVAL);


  const displayStyle = {
    backgroundColor: `${color}`,
    width: `${width}px`,
    height: `${height}px`,
  }
  const display = <div className="plant-icon"><div style={displayStyle}></div></div>;


  return (
    <div className="card">
      <table>
        <tbody>
          <tr>
            <td>
              <div style={{display: "flex"}}>
                <div>
                  {display}
                </div>
                <div>
                  <b>Type:</b> {name}<br></br>
                  <b>Width:</b> {width}<br></br>
                  <b>Height:</b> {height}<br></br>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <b>Energy to creatures: </b> {energy}<br></br>
              <b>Spawn rate: </b>every {spawnRate} sec<br></br>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
    
  
}

export default PlantCard;