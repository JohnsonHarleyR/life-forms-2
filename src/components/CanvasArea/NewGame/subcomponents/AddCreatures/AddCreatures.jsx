import React, {useRef, useState, useEffect} from 'react';
import { AllCreatureDefaults, StartingCreatureDefaults } from '../../../../../crosscutting/constants/creatureConstants';
import { createBlankCreatureCountArray, createStartingCreatureTypeArray, getInfoFromCreatureCountArray, replaceStartingCreatureDefaults, updateCreatureCountInArray } from '../../logic/newGameLogic';
import CreatureCard from './CreatureCard';
import './css/creatureCard.css';

const AddCreatures = ({setCanStartGame}) => {

  const maleCountRef = useRef();
  const femaleCountRef = useRef();

  const [creatureOptions, setCreatureOptions] = useState([]);
  const [creatureCountArray, setCreatureCountArray] = useState([]);

  const [chosenCreature, setChosenCreature] = useState(null);

  const [creatureTypeDisplayOptions, setCreatureTypeDisplayOptions] = useState([]);
  const [creatureCardDisplay, setCreatureCardDisplay] = useState(<></>);

  useEffect(() => {
    AllCreatureDefaults.sort(function (a, b) {
      return a.type.localeCompare(b.type);
    });
    if (creatureOptions) {
      populateCreatureOptions();
    }
    setCreatureCountArray(createBlankCreatureCountArray());
    maleCountRef.current.value = 0;
    femaleCountRef.current.value = 0;

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
    if (creatureCountArray && creatureCountArray.length > 0) {
      setChosenCreature(creatureCountArray[0].type);
    }
  }, [creatureCountArray]);

  useEffect(() => {
    if (chosenCreature) {
      let typeName = chosenCreature.type;
      let info = getInfoFromCreatureCountArray(typeName, creatureCountArray);
      maleCountRef.current.value = info.maleCount;
      femaleCountRef.current.value = info.femaleCount;
      setCreatureCardDisplay(
        <CreatureCard
          typeInfo={chosenCreature}
          showCounts={false}
          maleCount={0}
          femaleCount={0}
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

  const checkIfCanStartGame = () => {
    if (StartingCreatureDefaults.length > 0) {
      setCanStartGame(true);
    } else {
      setCanStartGame(false);
    }
  }

  const handleTypeSelectChange = (e) => {
    let typeName = e.target.value;
    let info = getInfoFromCreatureCountArray(typeName, creatureCountArray);
    setChosenCreature(info.type);
    maleCountRef.current.value = info.maleCount;
    femaleCountRef.current.value = info.femaleCount;
  }

  const updateMaleCount = (e) => {
    updateCreatureCountInArray(chosenCreature.type, parseInt(e.target.value), "male", creatureCountArray);
    replaceStartingCreatureDefaults(createStartingCreatureTypeArray(creatureCountArray));
    checkIfCanStartGame();
  }

  const updateFemaleCount = (e) => {
    updateCreatureCountInArray(chosenCreature.type, parseInt(e.target.value), "female", creatureCountArray);
    replaceStartingCreatureDefaults(createStartingCreatureTypeArray(creatureCountArray));
    checkIfCanStartGame();
  }

  return (
    <div className="add-creature-type">
      <div className="add-area">
        <b>Add Creatures</b>
        <div>
          <label>Type: </label>
          <select onChange={handleTypeSelectChange}>
            {creatureTypeDisplayOptions}
          </select>
        </div>
        <div>
        Male Count: <input type="number" min="0" ref={maleCountRef} onChange={updateMaleCount}/><br></br>
        Female Count: <input type="number" min="0" ref={femaleCountRef} onChange={updateFemaleCount}/>
        </div>
      </div>

      <div className="card-area">
        {creatureCardDisplay}
      </div>
    </div>

  );
}

export default AddCreatures;