import React, {useRef, useState, useEffect, useContext} from 'react';
import './css/critterCard.css';

const CritterCard = ({typeInfo}) => {

  const createFoodString = (array) => {
    let str = "NONE";
    for (let i = 0; i < array.length; i++) {
      if (i === 0) {
        str = "";
      }

      str += array[i];

      if (i !== array.length - 1) {
        str += ', ';
      }
    }
    return str;
  }

  const color = typeInfo.color;
  const displayStyle = {
    backgroundColor: `${color}`,
    width: `${typeInfo.size}px`,
    height: `${typeInfo.size}px`,
  }
  const display = <div className="creature-icon"><div style={displayStyle}></div></div>;

  const plants = `${createFoodString(typeInfo.food.plants)}`
  const prey = `${createFoodString(typeInfo.food.prey)}`;
  const description = typeInfo.description;

  return (
    <div className="card">
                    <div style={{display: "flex"}}>
                <div>
                  {display}

                  {description}
                  </div>
              </div>
              <div>
              <b>Plants to eat:</b> {plants}<br></br>
              <b>Prey to eat:</b> {prey}<br></br>
              </div>
    </div>
  );
    
  
}

export default CritterCard;