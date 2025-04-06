import React, {useRef, useState, useEffect } from 'react';
import { PlantConstants as Plants } from '../../../../../crosscutting/constants/plantConstants';
import { createBlankPlantsIncludedArray, createStartingPlantsArray, getInfoFromPlantsIncludedArray, replaceStartingPlantDefaults, updatePlantsIncludedInArray } from '../../logic/newGameLogic';
import PlantCard from './PlantCard';
import './css/plantCard.css';

const AddPlants = ({}) => {

  const isIncludedRef = useRef();

  const [plantOptions, setPlantOptions] = useState([]);
  const [plantsIncludedArray, setPlantsIncludedArray] = useState([]);

  const [chosenPlant, setChosenPlant] = useState(null);

  const [plantTypeDisplayOptions, setPlantTypeDisplayOptions] = useState([]);
  const [plantCardDisplay, setPlantCardDisplay] = useState(<></>);

  useEffect(() => {
    Plants.sort(function (a, b) {
      return a.type.localeCompare(b.type);
    });
    if (plantOptions) {
      populatePlantOptions();
    }
    setPlantsIncludedArray(createBlankPlantsIncludedArray());
    isIncludedRef.current.checked = true;

  }, []);

  useEffect(() => {
    if (plantOptions) {
      let newDisplay = [];
      plantOptions.forEach(c => {
        newDisplay.push(<option key={c.label} value={c.value}>{c.label}</option>);
      });
      setPlantTypeDisplayOptions(newDisplay);
    }
  }, [plantOptions]);

  useEffect(() => {
    if (plantsIncludedArray && plantsIncludedArray.length > 0) {
      setChosenPlant(plantsIncludedArray[0].type);
    }
    replaceStartingPlantDefaults(createStartingPlantsArray(plantsIncludedArray));
  }, [plantsIncludedArray]);

  useEffect(() => {
    if (chosenPlant) {
      let typeName = chosenPlant.type;
      let info = getInfoFromPlantsIncludedArray(typeName, plantsIncludedArray);
      isIncludedRef.current.checked = info.isIncluded ? true : false;
      setPlantCardDisplay(
        <PlantCard
          typeInfo={chosenPlant}
          />);
    } else {
      setPlantCardDisplay(<></>);
    }
  }, [chosenPlant]);


  const populatePlantOptions = () => {
    let newOptions = [];
    Plants.forEach(p => {
      newOptions.push({
        label: p.type,
        value: p.type
      });
    });

    setPlantOptions(newOptions);
  }

  const handleTypeSelectChange = (e) => {
    let typeName = e.target.value;
    let info = getInfoFromPlantsIncludedArray(typeName, plantsIncludedArray);
    setChosenPlant(info.type);
    isIncludedRef.current.checked = info.isIncluded ? true : false;
  }

  const updateIsIncluded = (e) => {
    let isIncluded = e.target.checked;
    updatePlantsIncludedInArray(chosenPlant.type, isIncluded, plantsIncludedArray);
  }

  return (
    <div className="add-creature-type">
      <div className="add-area">
        <b>Add Plants</b>
        <div>
          <label>Type: </label>
          <select onChange={handleTypeSelectChange}>
            {plantTypeDisplayOptions}
          </select>
        </div>
        <div>
        Include?: <input type="checkbox" ref={isIncludedRef} onChange={updateIsIncluded}/>
        </div>
      </div>

      <div className="card-area">
        {plantCardDisplay}
      </div>
    </div>

  );
}

export default AddPlants;