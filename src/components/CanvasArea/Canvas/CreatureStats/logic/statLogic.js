import { 
    StartingCreatureDefaults,
    Creatures,
    PassedOnCreatures,
    Gender,
    LifeStage,
  } from "../../../../../crosscutting/constants/creatureConstants";
  import { Dominance } from "../../../../../crosscutting/constants/geneticConstants";
  
  //#region creature sorting
  
  export const getStartingCreatureTypes = () => {
    let typeList = [];
    StartingCreatureDefaults.forEach(sc => {
      if (!typeList.includes(sc.type.type)) {
        typeList.push(sc.type.type);
      }
    });
  
    typeList.sort((a, b) => {
      return a.localeCompare(b);
    });
  
    return typeList;
  }
  
  export const getCreatureTypes = () => {
    let combined = [...Creatures];
    PassedOnCreatures.forEach(po => {
      combined.push(po);
    })
  
    let typeList = [];
    combined.forEach(sc => {
      if (!typeList.includes(sc.type)) {
        typeList.push(sc.type);
      }
    });
  
    // StartingCreatureDefaults.forEach(sc => {
    //   if (!typeList.includes(sc.type)) {
    //     typeList.push(sc.type);
    //   }
    // });
  
    typeList.sort((a, b) => {
      return a.localeCompare(b);
    });
  
    return typeList;
  }
  
  
  //#endregion
  
  //#region determine creature stats
  
  export const getStatsForCreatureType = (type) => {
    let passedOnCreatures = getCreaturesOfType(PassedOnCreatures, type);
    let livingCreatures = getCreaturesOfTypeSortOutDead(Creatures, type, passedOnCreatures);
    let allCreatures = combineAllCreatures(livingCreatures, passedOnCreatures);
  
    let livingCount = livingCreatures.length;
      let livingMF = countMaleAndFemaleCreatures(livingCreatures);
    let passedOnCount = passedOnCreatures.length;
      let passedOnMF = countMaleAndFemaleCreatures(passedOnCreatures);
    let totalCount = allCreatures.length;
      let totalMF = countMaleAndFemaleCreatures(allCreatures);
    let highestGeneration = getHighestGenerationFromArray(allCreatures);
    let mostCommonDeaths = getMostCommonCausesOfDeath(passedOnCreatures);
    let domMutationsCount = countCreaturesWithDominantMutations(livingCreatures);
    let permMutationsCount = countCreaturesWithPermanentMutations(livingCreatures);
  
    let maleCount = countCreaturesWithGender(livingCreatures, Gender.MALE);
    let femaleCount = countCreaturesWithGender(livingCreatures, Gender.FEMALE);
    let childCount = countChildren(livingCreatures);
    let noMateCount = countAdultsWithoutMate(livingCreatures);
    let mutationString = getChosenMutationListString(livingCreatures);
    let geneticCodesString = getGeneticCodeListString(livingCreatures);
  
    let stats = {
      type: type,
      livingCount: livingCount,
      livingMFCounts: livingMF,
      passedOnCount: passedOnCount,
      passedOnMFCounts: passedOnMF,
      totalCount: totalCount,
      totalMFCounts: totalMF,
      highestGeneration: highestGeneration,
      mostCommonDeaths: mostCommonDeaths,
      domMutationsCount: domMutationsCount,
      permMutationsCount: permMutationsCount,
      noMateCount: noMateCount,
      maleCount: maleCount,
      femaleCount: femaleCount,
      childCount: childCount,
      mutationString: mutationString,
      geneticCodesString: geneticCodesString,
    }
  
    return stats;
  }
  
  const getGeneticCodeListString = (array) => {
    let codeNames = [];
    let codeCounts = [];
    array.forEach(a => {
      if (codeNames.includes(a.geneticProfile.geneticCode)) {
        addCountToCode(a.geneticProfile.geneticCode, codeCounts);
      } else {
        codeNames.push(a.geneticProfile.geneticCode);
        codeCounts.push({
          code: a.geneticProfile.geneticCode,
          count: 1
        });
      }
    });
    codeCounts.sort((a, b) => b.count - a.count);
    let newString = '';
    let index = 1;
    let denominator = array.length;
    codeCounts.forEach(mc => {
      let percent = mc.count / denominator;
      percent = percent * 100;
      percent = Math.round(percent * 10) / 10;
      let toAdd = `${percent}% ${mc.code}`;
      if (index !== codeCounts.length) {
        toAdd += ', ';
      }
      newString += toAdd;
      index++;
    });
  
    return newString;
  }
  
  const addCountToCode = (code, codeCounts) => {
    for (let i = 0; i < codeCounts.length; i++) {
      if (codeCounts[i].code === code) {
        codeCounts[i].count++;
        break;
      }
    }
  }
  
  const getChosenMutationListString = (array) => {
    let mutNames = [];
    let mutCounts = [];
    array.forEach(a => {
      let genes = a.geneticProfile.getAllGenes();
      genes.forEach(g => {
        if (g.chosenTrait.isMutation) {
          if (mutNames.includes(g.chosenTrait.name)) {
            addCountToMutation(g.chosenTrait.name, mutCounts);
          } else {
            mutNames.push(g.chosenTrait.name);
            mutCounts.push({
              name: g.chosenTrait.name,
              count: 1
            });
          }
        }
      });
    });
    mutCounts.sort((a, b) => b.count - a.count);
    let newString = '';
    let index = 1;
    mutCounts.forEach(mc => {
      let toAdd = `${mc.count} ${mc.name}`;
      if (index !== mutCounts.length) {
        toAdd += ', ';
      }
      newString += toAdd;
      index++;
    });
  
    return newString;
  }
  
  const addCountToMutation = (mutName, mutCounts) => {
    for (let i = 0; i < mutCounts.length; i++) {
      if (mutCounts[i].name === mutName) {
        mutCounts[i].count++;
        break;
      }
    }
  }
  
  const countChildren = (array) => {
    let count = 0;
    array.forEach(a => {
      if (a.life.lifeStage === LifeStage.CHILD) {
        count++;
      }
    });
    return count;
  }
  
  const countCreaturesWithGender = (array, gender) => {
    let count = 0;
    array.forEach(a => {
      if (a.gender === gender) {
        count++;
      }
    });
    return count;
  }
  
  const countAdultsWithoutMate = (array) => {
    let count = 0;
    array.forEach(a => {
      if (a.life.lifeStage !== LifeStage.CHILD &&
        a.family.mate === null) {
        count++;
      }
    });
    return count;
  }
  
  const countCreaturesWithDominantMutations = (array) => {
    let count = 0;
    array.forEach(a => {
      let genes = a.geneticProfile.getAllGenes();
      for (let i = 0; i < genes.length; i++) {
        if (genes[i].chosenTrait.isMutation &&
          genes[i].chosenTrait.dominance === Dominance.DOMINANT) {
          count++;
          break;
        }
      }
    });
    return count;
  }
  
  const countCreaturesWithPermanentMutations = (array) => {
    let count = 0;
    array.forEach(a => {
      let genes = a.geneticProfile.getAllGenes();
      for (let i = 0; i < genes.length; i++) {
        if (genes[i].permanentChanges.length > 0) {
          count++;
          break;
        }
      }
    });
    return count;
  }
  
  const getMostCommonCausesOfDeath = (array) => {
    let causeNames = [];
    let causeCounts = [];
    array.forEach(a => {
      if (a.life.isDead && a.causeOfDeath) {
        if (causeNames.includes(a.causeOfDeath)) {
          addCountToCauseOfDeath(a.causeOfDeath, causeCounts);
        } else {
          causeNames.push(a.causeOfDeath);
          causeCounts.push({
            causeType: a.causeOfDeath,
            count: 1
          });
        }
      }
    });
  
    causeCounts.sort((a, b) => b.count - a.count);
  
    let cause1 = causeCounts[0] !== undefined ? `${causeCounts[0].causeType}: ${causeCounts[0].count}` : "NONE";
    let cause2 = causeCounts[1] !== undefined ? `${causeCounts[1].causeType}: ${causeCounts[1].count}` : "NONE";
    let cause3 = causeCounts[2] !== undefined ? `${causeCounts[2].causeType}: ${causeCounts[2].count}` : "NONE";
  
    let causeOrder = [cause1, cause2, cause3];
  
    return causeOrder;
  
  }
  
  const addCountToCauseOfDeath = (causeType, causeCounts) => {
    for (let i = 0; i < causeCounts.length; i++) {
      if (causeCounts[i].causeType === causeType) {
        causeCounts[i].count++;
        break;
      }
    }
  }
  
  const getHighestGenerationFromArray = (array) => {
    let highest = 0;
    array.forEach(a => {
      if (a.generation > highest) {
        highest = a.generation;
      }
    });
    return highest;
  }
  
  const countMaleAndFemaleCreatures = (array) => {
    let maleCount = 0;
    let femaleCount = 0;
    array.forEach(a => {
      if (a.gender === Gender.MALE) {
        maleCount++;
      } else {
        femaleCount++;
      }
    });
  
    return {
      maleCount: maleCount,
      femaleCount: femaleCount
    }
  }
  
  const getCreaturesOfType = (array, type) => {
    let newArray = [];
    array.forEach(a => {
      if (a.type === type) {
        newArray.push(a);
      }
    });
    return newArray;
  }
  
  const getCreaturesOfTypeSortOutDead = (array, type, passedOnArray) => {
    let newArray = [];
    array.forEach(a => {
      if (a.type === type) {
        if (!a.life.isDead) {
          newArray.push(a);
        } else {
          passedOnArray.push(a);
        }
      }
    });
    return newArray;
  }
  
  const combineAllCreatures = (living, dead) => {
    let newArray = [...living];
    dead.forEach(d => {
      newArray.push(d);
    });
    return newArray;
  }
  
  //#endregion