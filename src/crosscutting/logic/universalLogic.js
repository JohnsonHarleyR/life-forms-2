import { CanvasInfo, Axis } from "../constants/canvasConstants";
import { Corner, Side, RelativeToObject, RelativeToObjectCases } from "../constants/objectConstants";
import { Direction, CreatureDefaults, AddOrSubtract } from "../constants/creatureConstants";
import { checkIfCreatureCollidesWithAnyObjects, isNewCreaturePositionInsideAnyObject } from "./object/objectsLogic";
import { getNecessaryCollisionPadding } from "./creature/creatureLogic";
import { ColorType, GeneticDefaults } from "../constants/geneticConstants";

// display methods
export const getCreatureIdentityString = (creature) => {
    let str = `${creature.gender} ${creature.type} ${creature.id}`;
    return str;
}

// shuffle methods
export const shuffleArray = (array) => {
    let arrayCopy = [...array];
    let newArray = [];

    let arrayLength = arrayCopy.length;
    do {
        let spliceIndex = Math.floor(Math.random() * arrayLength);
        newArray.push(arrayCopy[spliceIndex]);
        arrayCopy.splice(spliceIndex, 1);
        arrayLength = arrayCopy.length;
    } while (arrayLength > 0);

    return newArray;
}

// random
export const isTrueByChance = (chancePercent = 0.5) => {
    let divider = chancePercent * 100;
    let random = Math.random() * 100;
    
    if (random <= divider) {
        return true;
    } else {
        return false;
    }
}

// time and rounding methods
export const calculateMsPerYear = (maxLifeSpan, maxYears) => {
    return maxLifeSpan / maxYears;
}

export const minutesToMilliseconds = (minutes) => {
    let minuteMilliseconds = Math.round(1000 * 60 * minutes);
    return minuteMilliseconds;
}

export const millisecondsToMinutes = (milliseconds) => {
    let minutes = milliseconds / 1000 / 60;
    let secondsRemainder = (minutes - Math.floor(minutes)) * 60;
    minutes = Math.floor(minutes);
    let millisecondsRemainder = (secondsRemainder - Math.floor(secondsRemainder)) * 1000;
    let seconds = Math.floor(secondsRemainder);
    let ms = Math.round(millisecondsRemainder);
    return `${minutes } min, ${seconds} sec, ${ms} ms`;
}

export const roundToPlace = (number, decimalPlaces) => {
    let timesAmount = decimalPlaces === 0 ? 1 : Math.pow(10, decimalPlaces);
    let newNumber = number * timesAmount;
    newNumber = Math.round(newNumber);
    newNumber = newNumber / timesAmount;
    return newNumber;
}

export const getRandomIntInRange = (min, max) => {
    let result = Math.floor(Math.random() * (max - min) + min);
    return result;
}

export const getRandomDecimalInRange = (min, max) => {
    let result = Math.random() * (max - min) + min;
    result = roundToPlace(result, 2);
    return result;
}

export const getRandomItemInArray = (array) => {
    let length = array.length;
    let result = Math.floor(Math.random() * length);
    return array[result];
}

// object collision - v2

// has to do with a method inside object class that determines side bools and stuff
// {isAwayFromLeft, isAwayFromRight, isAwayFromTop, isAwayFromBottom} = spread of boolResults
const getRelativeToObjectCondition = (boolResults) => {
    let condition = null;
    RelativeToObjectCases.forEach(c => {
        if (meetsRelativeToObjectCondition(boolResults, c)) {
            condition = c.condition;
        }
    });
    if (!condition) {
        throw `Error: no condition could be determined inside of getRelativeToObjectCondition. (universalLogic.js)\nParameter spread: ${JSON.stringify(boolResults)}`;
    }
    return condition;
}

export const fillRelativeFieldForObjectConditionResult = (fieldString, resultValue, resultObject) => {
    let copy = {...resultObject};
    switch (fieldString) {
        case "isAwayFromLeft":
            copy.isAwayFromLeft = resultValue;
            break;
        case "isAwayFromRight":
            copy.isAwayFromRight = resultValue;
            break;
        case "isAwayFromTop":
            copy.isAwayFromTop = resultValue;
            break;
        case "isAwayFromBottom":
            copy.isAwayFromBottom = resultValue;
            break;
        case "condition":
            copy.condition = getRelativeToObjectCondition(resultObject);
            break;
    }
    
    return copy;
}

const meetsRelativeToObjectCondition = (actual, expected) => {
    if (actual.isAwayFromLeft === expected.isAwayFromLeft &&
        actual.isAwayFromRight === expected.isAwayFromRight &&
        actual.isAwayFromTop === expected.isAwayFromTop &&
        actual.isAwayFromBottom === expected.isAwayFromBottom) {
            return true;
    }
    return false;
}

// color methods
// 0 is exactly color A, 1 is exactly color B
export const blendColors = (colorA, colorB, amount) => {
    const [rA, gA, bA] = colorA.match(/\w\w/g).map((c) => parseInt(c, 16));
    const [rB, gB, bB] = colorB.match(/\w\w/g).map((c) => parseInt(c, 16));
    const r = Math.round(rA + (rB - rA) * amount).toString(16).padStart(2, '0');
    const g = Math.round(gA + (gB - gA) * amount).toString(16).padStart(2, '0');
    const b = Math.round(bA + (bB - bA) * amount).toString(16).padStart(2, '0');
    return '#' + r + g + b;
}

// amount should be positive or negative
export const addToRGBValues = (colorHex, rAmount, gAmount, bAmount) => {
    let [rI, gI, bI] = colorHex.match(/\w\w/g).map((c) => parseInt(c, 16));

    rI = ensureValueInRange(rI + rAmount);
    gI = ensureValueInRange(gI + gAmount);
    bI = ensureValueInRange(bI + bAmount);
    
    const r = rI.toString(16).padStart(2, '0');
    const g = gI.toString(16).padStart(2, '0');
    const b = bI.toString(16).padStart(2, '0');

    let result = '#' + r + g + b;;
    return result;
}

// amount should be positive or negative
export const alterColorByAmount = (color, colorType, amount) => {
    let [rI, gI, bI] = color.match(/\w\w/g).map((c) => parseInt(c, 16));
    switch(colorType) {
        case ColorType.R:
            rI = ensureValueInRange(rI + amount);
            break;
        case ColorType.G:
            gI = ensureValueInRange(gI + amount);
            break;
        case ColorType.B:
            bI = ensureValueInRange(bI + amount);
            break;
    }
    const r = rI.toString(16).padStart(2, '0');
    const g = gI.toString(16).padStart(2, '0');
    const b = bI.toString(16).padStart(2, '0');

    let result = '#' + r + g + b;;
    return result;
}

// positive indicates lighter, negative indicates darker
export const alterColorDarkOrLight = (color, amount) => {
    let [rI, gI, bI] = color.match(/\w\w/g).map((c) => parseInt(c, 16));
    
    rI = ensureValueInRange(rI + amount);
    gI = ensureValueInRange(gI + amount);
    bI = ensureValueInRange(bI + amount);

    const r = rI.toString(16).padStart(2, '0');
    const g = gI.toString(16).padStart(2, '0');
    const b = bI.toString(16).padStart(2, '0');
    let result = '#' + r + g + b;
    return result;
}

const ensureValueInRange = (value) => {
    if (value < 0) {
        return 0;
    } else if (value > 255) {
        return 255;
    } else {
        return value;
    }
}

export const canColorChangeRequirementBeMet = (color, colorType, addOrSubtract,
    minDifference = GeneticDefaults.COLOR_DIFFERENCE_REQUIREMENT) => {
        const [r, g, b] = color.match(/\w\w/g).map((c) => parseInt(c, 16));
        let amount = 0;
        switch(addOrSubtract) {
            default:
            case AddOrSubtract.ADD:
                amount = minDifference;
                break;
            case AddOrSubtract.SUBTRACT:
                amount = -1 * minDifference;
        }
        
        switch(colorType) {
            case ColorType.R:
                let rC = r + amount;
                if (rC < 0 || rC > 255) {
                    return false;
                }
                return true;
            case ColorType.G:
                let gC = g + amount;
                if (gC < 0 || gC > 255) {
                    return false;
                }
                return true;
            case ColorType.B:
                let bC = b + amount;
                if (bC < 0 || bC > 255) {
                    return false;
                }
                return true;
            case ColorType.LIGHTER:
                return meetsLighterRequirement(r, g, b, amount, minDifference);
            case ColorType.DARKER:
                return meetsDarkerRequirement(r, g, b, amount, minDifference);
            default:
                return false;
        }
}

const meetsDarkerRequirement = (rValue, gValue, bValue,
    addAmount, minDifference = GeneticDefaults.COLOR_DIFFERENCE_REQUIREMENT) => {
        let rC = rValue + addAmount;
        let gC = gValue + addAmount;
        let bC = bValue + addAmount;
        
        let allValues = [rC, gC, bC];
        let min = minDifference;

        let over0Count = 0;
        let overMinCount = 0;
        allValues.forEach(v => {
            if (v >= min) {
                overMinCount++;
            } else if (v > 0) {
                over0Count++;
            }
        });

        if ((overMinCount >= 2) ||
            (over0Count >= 2 && overMinCount >= 1)) {
                return true;
        }
        return false;
}

const meetsLighterRequirement = (rValue, gValue, bValue,
    addAmount, minDifference = GeneticDefaults.COLOR_DIFFERENCE_REQUIREMENT) => {
        let rC = rValue + addAmount;
        let gC = gValue + addAmount;
        let bC = bValue + addAmount;
        
        let allValues = [rC, gC, bC];
        let max = 255 - minDifference;

        let under255Count = 0;
        let underMaxCount = 0;
        allValues.forEach(v => {
            if (v <= max) {
                underMaxCount++;
            } else if (v < 255) {
                under255Count++;
            }
        });

        if ((underMaxCount >= 2) ||
            (under255Count >= 2 && underMaxCount >= 1)) {
                return true;
        }
        return false;
}

// const ensureColorValueInRange = (value) => {
//     let newValue = value;
//     if (value < 0) {
//         let alterAmount = Math.abs(value);
//         newValue = 255 - alterAmount;
//     }
//     if (value > 255) {
//         newValue = value - 255;
//     }
//     return newValue;
// }

// adding and removing items
export const addItemToArray = (item, array, setFunction) => {
    if (!item || !array || !setFunction) {
        return false;
    }

    let arrayCopy = [...array];
    arrayCopy.push(item);
    setFunction(arrayCopy);

    return true;
}

export const removeItemFromArray = (itemId, array, setFunction) => {
    if (!itemId || !array || !setFunction) {
        return false;
    }

    let didFind = false;
    let arrayCopy = array.map(a => {
        if (a.id !== itemId) {
            return a;
        } else {
            didFind = true;
        }
    });
    setFunction(arrayCopy);

    return didFind;
}

// testing
export const showMessageIfInsideObject = (creature, message) => { // TODO finish method

}

// pattern finding
export const testFindArrayPatterns = () => {
    console.log(`testing findArrayPatterns`);
    let cases = [
        [5, 2, 1, 3, 5, 2, 1, 3],
        [5, 2, 1, 3, 5, 2, 1, 4, 5, 2, 1, 3],
        [5, 2, 6, 8, 5, 1, 5, 8, 8],
        [{x: 10, y: 10}, {x: 10, y: 15}, {x: 12, y: 10}, {x: 10, y: 10}, {x: 10, y: 15}, {x: 12, y: 10}, {x: 10, y: 10}, {x: 10, y: 15}, {x: 12, y: 10}]
    ];
    cases.forEach(c => {
        let result = findArrayPatterns(c);
        displayFindArrayPatternsResult(c, result);
    })
}

const displayFindArrayPatternsResult = (array, result) => {
    let str = `Array pattern:\n`;
    array.forEach(a => {
        str += `${JSON.stringify(a)}, `;
    });
    str += `\n\nResults:\n`;
    result.forEach(r => {
        str += `\tpattern: ${JSON.stringify(r.pattern)}\n`;
        str += `\ttimesOccured: ${r.timesOccured}\n`;
        str += `\tstartIndexes: ${JSON.stringify(r.startIndexes)}\n\n`;
    });
    console.log(str);
}

export const displayPatternResult = (result) => {
    let str = `no result`;
    if (result !== null) {
        str = `\tpattern:\n`;
        str = addPatternToString(result.pattern);
        str += `\ttimesOccured: ${result.timesOccured}\n`;
        str += `\tstartIndexes: ${JSON.stringify(result.startIndexes)}\n\n`;
    }
    //let str = `\n\nResults:\n`;
    console.log(str);
}

const addPatternToString = (pattern, str) => {
    let index = 0;
    pattern.forEach(p => {
        let result = p;
        str += `\t\t${index}:\n`;
        str += `\t\t\tposition: ${JSON.stringify(result.position)}\n`;
        str += `\t\t\tdirection: ${JSON.stringify(result.direction)}\n`;
        str += `\t\t\tsideOfCollision: ${JSON.stringify(result.sideOfCollision)}\n`;
        str += `\t\t\ttargetPosition: ${JSON.stringify(result.targetPosition)}\n`;
        index++;
    })
    return str;
}

// this is a recursive method
export const findArrayPatterns = (array, startingIndex = 0, patternsSoFar = []) => {

    for (let i = startingIndex; i < array.length; i++) {
        let potentialPattern = getPotentialPatternFromIndex(i, array);
        if (potentialPattern.length > 1 && !isPatternAlreadyInPatternsSoFar(potentialPattern, patternsSoFar)) {
            let isPatternResult = getIsActualPatternResult(potentialPattern, array);
            if (isPatternResult.isPattern) {
                patternsSoFar.push({
                    pattern: potentialPattern,
                    timesOccured: isPatternResult.timesOccured,
                    startIndexes: isPatternResult.startIndexes
                });
            }
        }

        // if it's the end of the array, return patterns so far - otherwise use recursion
        if (i === array.length - 1) {
            return patternsSoFar;
        } else {
            return (findArrayPatterns( array, i + 1, patternsSoFar));
        }
    }
    return patternsSoFar;
}

const isPatternAlreadyInPatternsSoFar = (pattern, array) => {
    let result = false;
    array.forEach(a => {
        if (isSamePattern(pattern, a.pattern)) {
            result = true;
        }
    });
    return result;
}

const isSamePattern = (pattern1, pattern2) => {
    if (pattern1.length !== pattern2.length) {
        return false;
    }

    for (let i = 0; i < pattern1.length; i++) {
        if (!isMatchingItem(pattern1[i], pattern2[i])) {
            return false;
        }
    }

    return true;
}

const getIsActualPatternResult = (pattern, array) => {
    let possibleStartIndexes = getItemIndexesInArray(pattern[0], array);
    let startIndexes = getStartingIndexesWithPattern(possibleStartIndexes, pattern, array);
    let occurances = startIndexes.length;
    let isPattern = occurances >= 2 ? true : false;
    return {
        isPattern: isPattern,
        timesOccured: occurances,
        startIndexes: startIndexes
    }
}

const getPotentialPatternFromIndex = (startIndex, array) => {
    let pattern = [];
    let itemToCompare = array[startIndex];

    for (let i = startIndex; i < array.length; i++) {
        if (i === startIndex || !isMatchingItem(array[i], itemToCompare)) {
            pattern.push(array[i]);
        } else if (i !== startIndex) {
            break;
        }
    }
    return pattern;
}

const isMatchingItem = (item1, item2) => {
    let json1 = JSON.stringify(item1);
    let json2 = JSON.stringify(item2);
    if (json1 === json2) {
        return true;
    }
    return false;
}

const getStartingIndexesWithPattern = (startIndexes, patternArray, array) => {
    let indexesWithPattern = [];
    startIndexes.forEach(i => {
        let doesMatch = doesMatchPatternAtIndex(i, patternArray, array);
        if (doesMatch) {
            indexesWithPattern.push(i);
        }
    });
    return indexesWithPattern;
}

const doesMatchPatternAtIndex = (startIndex, patternArray, array) => {
    // first get the relevent items in the array to check a match
    let compareArray = [];
    for (let i = startIndex; i < startIndex + patternArray.length; i++) {
        compareArray.push(array[i]);
    }

    // now see if this section matches
    let doesMatch = true;
    for (let i = 0; i < patternArray.length; i++) {
        if (!isMatchingItem(patternArray[i], compareArray[i])) {
            doesMatch = false;
            break;
        }
    }
    return doesMatch;
}

const getItemIndexesInArray = (item, array) => {
    let indexes = [];
    for (let i = 0; i < array.length; i++) {
        if (isMatchingItem(array[i], item)) {
            indexes.push(i);
        }
    }
    return indexes;
}


// position and collision methods

export const isInPosition = (currentPosition, newPosition) => {
    if (currentPosition.x === newPosition.x && 
      currentPosition.y === newPosition.y) {
        return true;
      }
    return false;
  }

export const getPositionDifference = (startPosition, endPosition) => {
    let xDifference = endPosition.x - startPosition.x;
    let yDifference = endPosition.y - startPosition.y;
    return {
        xDifference: xDifference,
        yDifference: yDifference
    };
};


export const getPositionChangeIntervals = (startPos, newPos) => {
    let posDif = getPositionDifference(startPos, newPos);
    let difIntervals = getPositionDifferenceIntervals(posDif);

    let changeIntervals = [];
    let prevPos = {...startPos};
    difIntervals.forEach(i => {
        changeIntervals.push({...prevPos});
        prevPos.x += i.xDifference;
        prevPos.y += i.yDifference;
    });

    changeIntervals.push(newPos);

    return changeIntervals;
}

// this one takes in the result of getPositionDifference to determine intervals
const getPositionDifferenceIntervals = (posDif) => {
    let difIntervals = [];

    let intervalCount = 0;
    let xInterval = 0;
    let yInterval = 0;

    let xDif = Math.abs(posDif.xDifference);
    let yDif = Math.abs(posDif.yDifference);

    if (xDif >= yDif) {
        intervalCount = xDif;
    }

    if (intervalCount === 0) {
        difIntervals.push({...posDif});
        return difIntervals;
    }

    xInterval = posDif.xDifference / intervalCount;
    yInterval = posDif.yDifference / intervalCount;


    let prevX = xInterval;
    let prevY = yInterval;
    for (let i = 0; i < intervalCount; i++) {
        difIntervals.push({
            xDifference: prevX,
            yDifference: prevY
        });
        prevX += xInterval;
        prevY += yInterval;
    }

    return difIntervals;
} 

export const getCenterPosition = (xStart, yStart, width, height) => {
    let halfWidth = width / 2;
    let halfHeight = height / 2;
    let x = xStart + halfWidth;
    let y = yStart + halfHeight;
    return {x: x, y: y};
}

export const getStartAndEndPoints = (id, position, width, height) => { 
    let halfWidth = width / 2;
    let halfHeight = height / 2;
    let xStart = position.x - halfWidth;
    let xEnd = position.x + halfWidth;
    let yStart = position.y - halfHeight;
    let yEnd = position.y + halfHeight;
    return {
        id: id,
        width: width,
        height: height,
        position: position,
        xStart: xStart,
        xEnd: xEnd,
        yStart: yStart,
        yEnd: yEnd
    }
}

export const getObjectStartAndEndPoints = (obj) => { 
    return {
        id: obj.id,
        width: obj.width,
        height: obj.height,
        position: obj.position,
        xStart: obj.xStart,
        xEnd: obj.xEnd,
        yStart: obj.yStart,
        yEnd: obj.yEnd
    }
}

export const getArrayOfCorners = (creationInfo) => {
    let sae = getStartAndEndPoints(creationInfo.position, creationInfo.width, creationInfo.height);
    let corners = [
        getCornerObject(Corner.TOP_LEFT,sae.xStart, sae.yStart),
        getCornerObject(Corner.TOP_RIGHT, sae.xEnd, sae.yStart),
        getCornerObject(Corner.BOTTOM_RIGHT, sae.xStart, sae.yEnd),
        getCornerObject(Corner.BOTTOM_RIGHT, sae.xEnd, sae.yEnd)
    ];
    return corners;
}

const getCornerObject = (corner, x, y) => {
    return {
        name: corner,
        x: x,
        y: y
    }
}

export const addCornerSidesToArray = (corner, array) => {
    switch (corner.name) {
        case Corner.TOP_LEFT:
          array.push(Side.TOP);
          array.push(Side.LEFT);
          break;
        case Corner.TOP_RIGHT:
          array.push(Side.TOP);
          array.push(Side.RIGHT);
          break;
        case Corner.BOTTOM_LEFT:
          array.push(Side.BOTTOM);
          array.push(Side.LEFT);
          break;
        case Corner.BOTTOM_RIGHT:
          array.push(Side.BOTTOM);
          array.push(Side.RIGHT);
          break;
      }
    return array;
}

export const isOnCanvas = (points) => {
    let width = CanvasInfo.WIDTH;
    let height = CanvasInfo.HEIGHT;
    if (points.xStart < 0 || points.xEnd >= width || points.yStart < 0 || points.yEnd >= height) {
        return false;
    }
    return true;
}

export const getRandomPositionInBounds = (xStart, xEnd, yStart, yEnd, padding) => {
    let width = xEnd - xStart;
    let height = yEnd - yStart;
    let x;
    do {
        x = Math.floor((Math.random() * width) + xStart);
    } while (x < xStart - padding || x > xEnd - padding);

    let y;
    do {
        y = Math.floor((Math.random() * height) + yStart);
    } while (y < yStart - padding || y > yEnd - padding);

    return {x: x, y: y};
}

export const getRandomCreatureTargetPosition = (creature, objects, shelters, padding = getNecessaryCollisionPadding()) => {
    let maxX = CanvasInfo.WIDTH - (creature.size); // this prevents going over edge
    let maxY = CanvasInfo.HEIGHT - (creature.size);
  
    let isCollision = true;
    let randomPosition = null;
    do {
        let x = Math.floor((Math.random() * maxX));
        let y = Math.floor((Math.random() * maxY));
        randomPosition = {x: x, y: y};
        
        // check objects
        isCollision = isNewCreaturePositionInsideAnyObject(creature, randomPosition, objects, padding);
        //let objectCheck = checkIfCreatureCollidesWithAnyObjects(creature, randomPosition, objects);
        //isCollision = objectCheck.isCollision;
  
        // check shelters too
        if (!isCollision) {
            isCollision = isPositionInsideAnyShelter(randomPosition, shelters, creature);
        }
  
    } while (isCollision);
  
    return randomPosition;
}

export const isPositionInsideAnyShelter = (position, shelters, creatureWithShelterToExclude = null) => {
    let shelterIdToExclude = getShelterIdToExclude(creatureWithShelterToExclude);

    let isInsideShelter = false;
    for (let i = 0; i < shelters.length; i++) {
        let isInThisShelter = false;
        if (shelterIdToExclude === null || shelters[i].id !== shelterIdToExclude) {
            isInThisShelter = shelters[i].isPositionInsideThisShelter(position);
            if (isInThisShelter) {
                isInsideShelter = isInThisShelter;
                break;
            }
        }
    }

    return isInsideShelter;
}

const getShelterIdToExclude = (creature) => {
    let idToExclude = creature !== null ? (creature.safety.shelter !== null ? creature.safety.shelter.id : null) : null;
    return idToExclude;
}

export const getRandomStartPosition = (info, creatures, objects, plants, shelters, largestCreatureSize = CreatureDefaults.LARGEST_SIZE, excludeCreatureId = null, checkForPlants = true) => {
    let maxX = CanvasInfo.WIDTH - (info.width); // this prevents going over edge
    let maxY = CanvasInfo.HEIGHT - (info.height);
  
    let isCollision = true;
    let randomPosition = null;
    do {
        let x = Math.floor((Math.random() * maxX));
        let y = Math.floor((Math.random() * maxY));
        randomPosition = {x: x, y: y};
        let creationInfo = {id: null, position: randomPosition, width: info.width, height: info.height};
  
      // validate position
      isCollision = isAnyCollision(creationInfo, creatures, objects, plants, shelters, largestCreatureSize, excludeCreatureId, checkForPlants);
  
    } while (isCollision);
  
    return randomPosition;
}



export const isAnyCollision = (creationInfo, creatures, objects, plants, shelters,
    objectPadding = CanvasInfo.OBJECT_PADDING, excludeCreatureId = null, checkForPlants = true) => {
    let id = creationInfo.id ? creationInfo.id : null;
    let creationPoints = getStartAndEndPoints(id, creationInfo.position, creationInfo.width, creationInfo.height);

    if (!isOnCanvas(creationPoints)) {
        return true;
    }

    // loop through each one
    //console.log('checking objects');
    let result = checkAnyArrayCollision(creationPoints, objects, objectPadding);
    if (result.isCollision) {
        return true;
    }
    //console.log('checking plants');
    if (checkForPlants) {
        result = checkAnyArrayCollision(creationPoints, plants, 0);
        if (result.isCollision) {
            return true;
        }
    }
    //console.log('checking shelters');
    result = checkAnyArrayCollision(creationPoints, shelters, 0);
    if (result.isCollision) {
        return true;
    }

    // THIS IS SPECIFICALLY FOR IF THE COLLISION BEING CHECKED IS FOR A CREATURE
    if (excludeCreatureId) {
        let creaturesCopy = [];
        creatures.forEach(c => {
            if (c.id !== excludeCreatureId) {
                creaturesCopy.push(c);
            }
        });
        //console.log(`checking creatures without id ${excludeCreatureId}`);
        result = checkAnyArrayCollision(creationPoints, creaturesCopy, 0);
    } else {
        //console.log('checking creatures');
        result = checkAnyArrayCollision(creationPoints, creatures, 0);
    }
    // it's the last check so return the result
    return result.isCollision;
}

// idForSmaller is in case we want to specify which item to count as "smaller"
//(mainly for creature object collisions in case an object is smaller than the creature)
export const checkAnyArrayCollision = (creationPoints, array, padding = CanvasInfo.OBJECT_PADDING, idForSmaller = null) => {
    let result = false;
    let collidedWith = null;
    let pointsToCollide = null;
    let smallerId = idForSmaller;
    for (let i = 0; i < array.length; i++) {
        let a = array[i];
        let id = a.id ? a.id : null;
        let comparePoints = getStartAndEndPoints(id, a.position, a.width, a.height);
        let collisionResult = isCollision(creationPoints, comparePoints, padding, idForSmaller)
        if(collisionResult.isCollision) {
            result = true;
            collidedWith = a;
            pointsToCollide = collisionResult.collisionPoints;
            smallerId = collisionResult.smallId;
            break;
        }
    }
    return {
        isCollision: result,
        smallerId: smallerId,
        pointsOfCollision: pointsToCollide,
        collidedWith: collidedWith
    };
}

export const isOverlap = (smallerPoints, obj, padding = 0) => {
    let isOverlap = false;
    let overlapSides = [];

    let sidesToCheck = getSidesForOverlapMethod(smallerPoints);

    // check all positions along smaller edges for if position is on object
    sidesToCheck.forEach(s => {
        if (isAxisPositionInObjectRange(s.axis, s.otherCoord, obj)) {

            for (let i = 0; i < s.length; i++) {
                let position = {x: null, y: null};
                switch (s.axis) {
                    case Axis.X:
                        position.x = s.startCoord + i;
                        position.y = s.otherCoord;
                        break;
                    case Axis.Y:
                        position.y = s.startCoord + i;
                        position.x = s.otherCoord;
                        break;
                    default:
                        throw "Error in isOverlap. No x or y axis specified.";
                }
                let isOnObject = isPositionOnObject(position, obj, padding);
                if (isOnObject) {
                    isOverlap = true;
                    overlapSides.push({
                        point: s.side,
                        x: position.x,
                        y: position.y
                    });
                }
            }
        }
    });
    return {
        isOverlap: isOverlap,
        overlapSides: overlapSides
    }
}

const isAxisPositionInObjectRange = (axis, coord, obj) => {
    switch (axis) {
        case Axis.X:
            if (coord >= obj.yStart && coord <= obj.yEnd) {
                return true;
            }
            return false;
        case Axis.Y:
            if (coord >= obj.xStart && coord <= obj.xEnd) {
                return true;
            }
            return false;
        default:
            throw "Error in isAxisPositionInObjectRange. Invalid axis specified.";
    }
}

const getSidesForOverlapMethod = (smallerPoints) => {
    let width = smallerPoints.width;
    let height = smallerPoints.height;
    let array =
    [
        {
            side: Side.TOP,
            axis: Axis.X,
            startCoord: smallerPoints.xStart,
            otherCoord: smallerPoints.yStart,
            length: width
        },
        {
            side: Side.BOTTOM,
            axis: Axis.X,
            startCoord: smallerPoints.xStart,
            otherCoord: smallerPoints.yEnd,
            length: width
        },
        {
            side: Side.LEFT,
            axis: Axis.Y,
            startCoord: smallerPoints.yStart,
            otherCoord: smallerPoints.xStart,
            length: height
        },
        {
            side: Side.RIGHT,
            axis: Axis.Y,
            startCoord: smallerPoints.yStart,
            otherCoord: smallerPoints.xEnd,
            length: height
        }
    ];
    return array;
}

export const isPositionOnObject = (position, objectStartAndEndPoints, padding = 0) => {
    if (position.x >= objectStartAndEndPoints.xStart - padding &&
        position.x <= objectStartAndEndPoints.xEnd + padding && 
        position.y >= objectStartAndEndPoints.yStart - padding &&
        position.y <= objectStartAndEndPoints.yEnd + padding) {
            return true;
    }
    
    return false;
}


// idForSmaller is in case we want to specify which item to count as "smaller"
//(mainly for creature object collisions in case an object is smaller than the creature)
export const isCollision = (creation1, creation2, padding = CanvasInfo.OBJECT_PADDING, idForSmaller = null) => {

    let creation1Points = getStartAndEndPoints(creation1.id, creation1.position, creation1.width, creation1.height);
    let creation2Points = getStartAndEndPoints(creation2.id, creation2.position, creation2.width, creation2.height);

    let creationsBySize = determineLargest(creation1Points, creation2Points);

    if (idForSmaller !== null && creation1Points.id === idForSmaller) {
        creationsBySize.large = creation2Points;
        creationsBySize.small = creation1Points;
    } else if (idForSmaller !== null && creation2Points.id === idForSmaller) {
        creationsBySize.large = creation1Points;
        creationsBySize.small = creation2Points;
    }

    let result = compareLargeAndSmallForCollisionCheck(creationsBySize, padding);

    // if the collision resulted false, switch creationsBySize just to double check collision
    // if (!result.isCollision) {
    //     // let creationsBySizeSwitched = switchCreationsBySize(creationsBySize);
    //     // result = compareLargeAndSmallForCollisionCheck(creationsBySizeSwitched, padding);

    //     // try using the isOverlap method
    //     let overlapResult = isOverlap(creationsBySize.small, creationsBySize.large, padding);
    //     if (overlapResult.isOverlap) {
    //         console.log(`Small item ${creationsBySize.small.id} overlaps ${creationsBySize.large.id}`);

    //         result.isCollision = overlapResult.isOverlap;
    //         result.collisionPoints = overlapResult.overlapSides;
    //         result.collidedWith = creationsBySize.large;
    //         result.smallId = creationsBySize.small.id;
    //     }

    // }

    return result;

}

const compareLargeAndSmallForCollisionCheck = (creationsBySize, padding) => {
    let large = {...creationsBySize.large};
    let small = getCollisionCheckPoints({...creationsBySize.small});

    let halfPadding = padding / 2;
    large.xStart = large.xStart - halfPadding;
    large.xEnd = large.xEnd + halfPadding;
    large.yStart = large.yStart - halfPadding;
    large.yEnd = large.yEnd + halfPadding;

    let collision = false;
    let collisionPoints = [];
    for (let i = 0; i < small.length; i++) {
        let point = small[i];
        if (isPositionOnObject(point, large)) {
            collision = true;
            collisionPoints.push(point);
        }
        // if (point.x >= large.xStart && point.x <= large.xEnd && 
        //     point.y >= large.yStart && point.y <= large.yEnd) {
        //         collision = true;
        //         collisionPoints.push(point);
        //     }
    }
    return {
        isCollision: collision,
        collisionPoints: collisionPoints,
        collidedWith: large,
        smallId: creationsBySize.small.id
    };
}

const switchCreationsBySize = (creationsBySize) => {
    let large = creationsBySize.small;
    let small = creationsBySize.large;
    creationsBySize.large = large;
    creationsBySize.small = small;
    return creationsBySize;
}

const determineLargest = (creation1, creation2) => {
    let creation1Area = creation1.width * creation1.height;
    let creation2Area = creation2.width * creation2.height;

    if (creation1Area > creation2Area) {
        return {
            large: creation1,
            small: creation2
        };
    } else {
        return {
            large: creation2,
            small: creation1
        }
    }
}

const getCollisionCheckPoints = ({xStart, xEnd, yStart, yEnd, width, height}) => {

    let points = [];

    let halfWidth = width / 2;
    let halfHeight = height / 2;

    //let quarterWidth = halfWidth / 2;
    //let threeQuarterWidth = width - quarterWidth;

    //let quarterHeight = halfHeight / 2;
    //let threeQuarterHeight = height - quarterHeight;

    points.push({ // 0
        point: Corner.TOP_LEFT,
        x: xStart,
        y: yStart
    });

    points.push({ // 1
        point: Side.TOP,
        x: xStart + halfWidth,
        y: yStart
    });

    points.push({ // 2
        point: Corner.TOP_RIGHT,
        x: xEnd,
        y: yStart
    });

    points.push({ // 3
        point: Side.LEFT,
        x: xStart,
        y: yStart + halfHeight
    });

    points.push({ // 4
        point: Side.CENTER,
        x: xStart + halfWidth,
        y: yStart + halfHeight
    });

    points.push({ // 5
        point: Side.RIGHT,
        x: xEnd,
        y: yStart + halfHeight
    });

    points.push({ // 6
        point: Corner.BOTTOM_LEFT,
        x: xStart,
        y: yEnd
    });

    points.push({ // 7
        point: Side.BOTTOM,
        x: xStart + halfWidth,
        y: yEnd
    });

    points.push({ // 8
        point: Corner.BOTTOM_RIGHT,
        x: xEnd,
        y: yEnd
    });

    return points;
}

export const getTriangleMovePosition = (
    currentPosition,
    xTotal,
    xDirection,
    yTotal,
    yDirection,
    speed
  ) => {
    if (!xTotal || !yTotal) {
      return currentPosition;
    }
  
    // console.log(
    //   `xDirection: ${xDirection}, yDirection: ${yDirection}, speed: ${speed}`
    // );
  
    //console.log(`xTotal: ${xTotal}, yTotal: ${yTotal}`);
    let zTotal = Math.sqrt(Math.pow(xTotal, 2) + Math.pow(yTotal, 2));
  
    //console.log(`zTotal: ${zTotal}`);
    let ratio = speed / zTotal;
  
    let xDistance = xTotal * ratio;
    let yDistance = yTotal * ratio;
  
    let x =
      xDirection === Direction.EAST
        ? currentPosition.x + xDistance
        : currentPosition.x - xDistance;
  
    let y =
      yDirection === Direction.SOUTH
        ? currentPosition.y + yDistance
        : currentPosition.y - yDistance;
  
  
    //console.log(`new Y: ${y}`);
    // TODO consider adding an offet to this for the sake of sight direction stuff
  
    return { x: Math.round(x), y: Math.round(y) };
  };

export const determineAxisBySide = (side) => {
    if (!side) {
        throw "Side is null or undefined for determineAxisBySide.";
      }
      if (side === Side.TOP || side === Side.BOTTOM) {
        return Axis.X;
      }
      return Axis.Y;
}

export const getCornerPositionFromStartAndEndPoints = (cornerName, points) => {
    let position = {
        x: null,
        y: null
    }
    switch (cornerName) {
        case Corner.TOP_LEFT:
            position.x = points.xStart;
            position.y = points.yStart;
            break;
        case Corner.TOP_RIGHT:
            position.x = points.xEnd;
            position.y = points.yStart;
            break;
        case Corner.BOTTOM_LEFT:
            position.x = points.xStart;
            position.y = points.yEnd;
            break;
        case Corner.BOTTOM_RIGHT:
            position.x = points.xEnd;
            position.y = points.yEnd;
            break;
        default:
            break;
    }

    return position;
}