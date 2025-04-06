import React, {useState, useEffect, useContext} from 'react';
import { LifeContext } from '../../../../../Context/LifeContext';
import { Landscapes } from '../../../../../crosscutting/constants/landscapeConstants';

export const ChooseLandscape = ({setLandscapeJson}) => {
  
  const [chosenLandscape, setChosenLandscape] = useState();
  const [landscapeOptions, setLandscapeOptions] = useState([]);
  const [landscapeDisplayOptions, setLandscapeDisplayOptions] = useState([]);

  useEffect(() => {
    Landscapes.sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
    setChosenLandscape(Landscapes[0].name);
    populateLandscapeOptions();
  }, []);

  useEffect(() => {
    if (landscapeOptions && landscapeOptions.length > 0) {
      let newDisplay = [];
      landscapeOptions.forEach(c => {
        newDisplay.push(<option key={c.label} value={c.value}>{c.label}</option>);
      });
      setLandscapeDisplayOptions(newDisplay);
    }
  }, [landscapeOptions]);

  useEffect(() => {
    if (chosenLandscape) {
      setLandscapeJson(findLandscapeJson(chosenLandscape));
    }
  }, [chosenLandscape]);

  const handleLandscapeChange = (e) => {
    setChosenLandscape(e.target.value);
  }

  const findLandscapeJson = (landscapeName) => {
    for (let i = 0; i < Landscapes.length; i++) {
      if (Landscapes[i].name === landscapeName) {
        return Landscapes[i].json;
      }
    }
  }

  const populateLandscapeOptions = () => {
    let newOptions = [];
    Landscapes.forEach(l => {
      newOptions.push({
        label: l.name,
        value: l.name
      });
    });
    setLandscapeOptions(newOptions);
  }

  return (
    <div>
      Choose landscape: 
      <select onChange={handleLandscapeChange}>
        {landscapeDisplayOptions}
      </select>
    </div>
  );
}