import React, { useRef, useState, useEffect } from 'react';
import {
  AllCreatureDefaults,
  Gender,
  Creatures,
  StartingCreatureDefaults,
} from '../../../../crosscutting/constants/creatureConstants';
import {
  Objects,
  Shelters,
} from '../../../../crosscutting/constants/objectConstants';
import { Plants } from '../../../../crosscutting/constants/plantConstants';
import { createCreatures } from '../canvasMethods';
import CritterCard from './CritterCard';

const AddCritter = () => {

  const maleRef = useRef();
  const femaleRef = useRef();
  const addRef = useRef();

  const [creatureOptions, setCreatureOptions] = useState([]);

  const [chosenCreature, setChosenCreature] = useState(null);
  const [chosenGender, setChosenGender] = useState(Gender.FEMALE);

  const [creatureTypeDisplayOptions, setCreatureTypeDisplayOptions] = useState([]);
  const [creatureCardDisplay, setCreatureCardDisplay] = useState(<></>);

  useEffect(() => {
    AllCreatureDefaults.sort(function (a, b) {
      return a.type.localeCompare(b.type);
    });
    if (creatureOptions) {
      populateCreatureOptions();
    }
    setChosenCreature(AllCreatureDefaults[0]);
    maleRef.current.checked = false;
    femaleRef.current.checked = true;

  }, []);

  useEffect(() => {
    if (creatureOptions) {
      let newDisplay = [];
      creatureOptions.forEach(c => {
        newDisplay.push(<option key={c.label} value={c.value}>{c.label}</option>);
      });
      setCreatureTypeDisplayOptions(newDisplay);
    }
  }, [creatureOptions]);

  useEffect(() => {
    if (chosenCreature) {
      setCreatureCardDisplay(
        <CritterCard
          typeInfo={chosenCreature}
          />);
    } else {
      setCreatureCardDisplay(<></>);
    }
  }, [chosenCreature]);


  const populateCreatureOptions = () => {
    let newOptions = [];
    AllCreatureDefaults.forEach(d => {
      newOptions.push({
        label: d.type,
        value: d.type
      });
    });

    setCreatureOptions(newOptions);
  }

  const handleTypeSelectChange = (e) => {
    let typeName = e.target.value;
    let chosen = null;
    for (let i = 0; i < AllCreatureDefaults.length; i++) {
      if (AllCreatureDefaults[i].type === typeName) {
        chosen = AllCreatureDefaults[i];
      }
    }
    setChosenCreature(chosen);
  }

  const updateMaleSelect = (e) => {
    setChosenGender(Gender.MALE);
    femaleRef.current.checked = false;
  }

  const updateFemaleSelect = (e) => {
    setChosenGender(Gender.FEMALE);
    maleRef.current.checked = false;
  }

  const addCreatureToGame = (e) => {
    let addArray = [{
      type: chosenCreature,
      gender: chosenGender,
      count: 1
    }];
    let newCreatureArray = createCreatures(addArray, Objects, Plants, Shelters, Creatures);
    Creatures.push(newCreatureArray[0]);
  }

  // TODO consider adding rules for how often a new creature may be added

  return (
    <div className="add-creature-type">
      <div className="add-area">
        <b>Add Creature to Game</b>
        <div>
          <select onChange={handleTypeSelectChange}>
            {creatureTypeDisplayOptions}
          </select>
          <input type="radio" ref={maleRef} onChange={updateMaleSelect}/>Male
          <input type="radio" ref={femaleRef} onChange={updateFemaleSelect}/>Female
          <button onClick={addCreatureToGame}>Add</button>
        </div>
      </div>

      <div className="card-area">
        {creatureCardDisplay}
      </div>
    </div>

  );
}

export default AddCritter;