import { AllCreatureDefaults, Gender, StartingCreatureDefaults } from "../../../../crosscutting/constants/creatureConstants"
import { PlantConstants as Plants, StartingPlants } from "../../../../crosscutting/constants/plantConstants";

//#region starting plant logic
export const replaceStartingPlantDefaults = (newDefaults) => {
  StartingPlants.splice(0, StartingPlants.length);
  newDefaults.forEach(nd => {
    StartingPlants.push(nd);
  });
}

export const createBlankPlantsIncludedArray = () => {
  let array = [];
  Plants.forEach(p => {
    array.push({
      type: p,
      isIncluded: true
    });
  });
  return array;
}

export const getInfoFromPlantsIncludedArray = (typeName, array) => {
  for (let i = 0; i < array.length; i++) {
    if (array[i].type.type === typeName) {
      return array[i];
    }
  }
}

export const updatePlantsIncludedInArray = (typeName, newIsIncluded, array) => {
  for (let i = 0; i < array.length; i++) {
    if (array[i].type.type === typeName) {
      array[i].isIncluded = newIsIncluded;
      break;
    }
  }
}

export const createStartingPlantsArray = (plantIncludedArray) => {
  let array = [];
  plantIncludedArray.forEach(pi => {
    if (pi.isIncluded) {
      array.push(pi.type);
    }
  });
  return array;
}
//#endregion

//#region starting creature logic
export const replaceStartingCreatureDefaults = (newDefaults) => {
  StartingCreatureDefaults.splice(0, StartingCreatureDefaults.length);
  newDefaults.forEach(nd => {
    StartingCreatureDefaults.push(nd);
  });
}

export const createBlankCreatureCountArray = () => {
  let array = [];
  AllCreatureDefaults.forEach(c => {
    array.push({
      type: c,
      maleCount: 0,
      femaleCount: 0
    });
  });
  return array;
}

export const getInfoFromCreatureCountArray = (typeName, array) => {
  for (let i = 0; i < array.length; i++) {
    if (array[i].type.type === typeName) {
      return array[i];
    }
  }
}

export const updateCreatureCountInArray = (typeName, newCount, genderString, array) => {
  for (let i = 0; i < array.length; i++) {
    if (array[i].type.type === typeName) {
      if (genderString === "male") {
        array[i].maleCount = newCount;
      } else {
        array[i].femaleCount = newCount;
      }
      break;
    }
  }
}

export const createStartingCreatureTypeArray = (creatureCountArray) => {
  let array = [];
  creatureCountArray.forEach(cc => {
    if (cc.femaleCount > 0) {
      array.push({
        type: cc.type,
        gender: Gender.FEMALE,
        count: cc.femaleCount
      });
    }
    if (cc.maleCount > 0) {
      array.push({
        type: cc.type,
        gender: Gender.MALE,
        count: cc.maleCount
      });
    }
  });
  return array;
}

//#endregion