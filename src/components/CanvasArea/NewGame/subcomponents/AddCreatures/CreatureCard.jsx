import React, {useRef, useState, useEffect, useContext} from 'react';
import './css/creatureCard.css';

const CreatureCard = ({typeInfo, showCounts, maleCount, femaleCount}) => {

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



  const determineGenderCounts = () => {
    let counts = <></>;
    if (showCounts) {
      counts = 
      <div>
        <b>Male:</b> {maleCount}<br></br>
        <b>Female:</b> {femaleCount}<br></br>
      </div>;
    }
    return counts;
  }

  const [genderCounts, setGenderCounts] = useState(determineGenderCounts());

  const name = `${typeInfo.type}`;

  const color = typeInfo.color;
  const size = `${typeInfo.size}`;
  const displayStyle = {
    backgroundColor: `${color}`,
    width: `${typeInfo.size}px`,
    height: `${typeInfo.size}px`,
  }
  const display = <div className="creature-icon"><div style={displayStyle}></div></div>;

  const speed = `${typeInfo.speed}`;
  const energyWhenEaten = `${typeInfo.energy}`;

  const foodPerDay = `${typeInfo.foodNeeded} meals/day`;
  const plants = `${createFoodString(typeInfo.food.plants)}`
  const prey = `${createFoodString(typeInfo.food.prey)}`;
  const sightDistance = `${typeInfo.sightRadius * 2}w x ${typeInfo.sightDistance}h`;

  const sleep = `${typeInfo.sleepNeeded} hrs/day`;

  const mating = `every ${typeInfo.matingNeeded} day(s)`;
  const offspring = `${typeInfo.minOffspring}-${typeInfo.maxOffspring}`;
  const multipleLitters = `${typeInfo.canHaveMultipleLitters}`;
  const shelterProvider = `${typeInfo.genderOfShelterMaker}`;

  const lifespan = `${typeInfo.lifeSpanRange.low}-${typeInfo.lifeSpanRange.high} days`;
  const lifeAsChild = `${typeInfo.fractionAsChild * 100}%`;
  const lifeAsElder = `${typeInfo.fractionAsElder * 100}%`;

  const specialTraits = '';
  const description = typeInfo.description;

  return (
    <div className="card">
      <table>
        <tbody>
          <tr>
            <td>
              <div style={{display: "flex"}}>
                <div>
                  {display}

                  {description}
                  </div>
                {genderCounts}
              </div>
              </td>
            <td>
              <b>Plants to eat:</b> {plants}<br></br>
              <b>Prey to eat:</b> {prey}<br></br>
              <b>Energy to predator:</b> {energyWhenEaten}<br></br>
            </td>
          </tr>
          <tr>
            <td>
              <b>Type:</b> {name}<br></br>
              <b>Size:</b> {size}<br></br>
              <b>Speed:</b> {speed}<br></br>
              <b>Sight:</b> {sightDistance}<br></br>
            </td>
            <td>
              <b>Food needed:</b> {foodPerDay}<br></br>
              <b>Sleep needed:</b> {sleep}<br></br>
              <b>Mating:</b> {mating}<br></br>
            </td>
          </tr>
          <tr>
            <td>
              <b>Lifespan: </b> {lifespan}<br></br>
              <b>As child: </b>{lifeAsChild}<br></br>
              <b>As elder: </b>{lifeAsElder}<br></br>
            </td>
            <td>
              <b>Offspring at once:</b> {offspring}<br></br>
              <b>Multiple litters?:</b> {multipleLitters}<br></br>
              <b>Shelter provider:</b> {shelterProvider}<br></br>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
    
  
}

export default CreatureCard;