import React, { useRef, useState } from 'react';
import { getStartingCreatureTypes, getStatsForCreatureType, getCreatureTypes } from './logic/statLogic';
import './css/creatureStats.css';

const CreatureStats = () => {

  const updateRef = useRef();

  let types = getStartingCreatureTypes();
  const [display, setDisplay] = useState(<div></div>);

  const handleUpdateClick = (e) => {
    types = getCreatureTypes();
    setDisplay(createDisplay());
  }

  const createDisplay = () => {
    let creatureStats = [];
    let count = 0;
    types.forEach(t => {
      creatureStats.push(createTypeDisplay(t, count));
      count++;
    });

    let newDisplay = <div><h2>Creature Stats</h2><div style={{display: "flex"}}>{creatureStats}</div></div>;
    return newDisplay;
  }

  const createTypeDisplay = (type, count) => {
    let stats = getStatsForCreatureType(type);
    return (
      <div key={`ct${count}`} className="stat-card">
        <b>Type: {type}</b><br></br>
        <br></br>
        <b>Generations: </b>{stats.highestGeneration}<br></br>
        <b>Most Common Cause of Death: </b><br></br>
        <ol>
          <li key="l1">{stats.mostCommonDeaths[0]}</li>
          <li key="l2">{stats.mostCommonDeaths[1]}</li>
          <li key="l3">{stats.mostCommonDeaths[2]}</li>
        </ol>
        <br></br>
        <b>Living: </b> {stats.livingCount}<br></br>
        <b>Passed Away: </b> {stats.passedOnCount}<br></br>
        <b>Total Count: </b> {stats.totalCount}<br></br>
        <br></br>
        <b>Living male count: </b> {stats.maleCount}<br></br>
        <b>Living female count: </b> {stats.femaleCount}<br></br>
        <br></br>
        <b>Living children: </b> {stats.childCount}<br></br>
        <b>Living adults without mate: </b> {stats.noMateCount}<br></br>
        <br></br>
        <b>Creatures with dominant mutations: </b> {stats.domMutationsCount}<br></br>
        <b>Creatures with permanent mutations: </b> {stats.permMutationsCount}<br></br>
        {/* <b>Active mutations: </b> {stats.mutationString}<br></br> */}
        <b>Genetic codes: </b> {stats.geneticCodesString}<br></br>
      </div>
    );
  }

  return (
    <div>
      <button ref={updateRef} onClick={handleUpdateClick}>Update Stats</button>
      <br></br>
      {display}
    </div>
  );

}

export default CreatureStats;