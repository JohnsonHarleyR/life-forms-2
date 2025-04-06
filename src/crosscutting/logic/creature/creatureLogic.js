import { 
    getRandomStartPosition,
    getPositionDifference,
    getStartAndEndPoints,
    isAnyCollision,
    checkAnyArrayCollision,
    getRandomIntInRange,
    findArrayPatterns,
    getCreatureIdentityString,
    getRandomItemInArray,
    getRandomCreatureTargetPosition
} from "../universalLogic";
import { Direction, ActionType, NeedType, MoveMode, Gender, LifeStage,
    CreatureType, Bleep, Boop, CreatureDefaults, Biddy, CauseOfDeath, TimeProps, AllCreatureDefaults } from "../../constants/creatureConstants";
import { ShelterLine, CanvasInfo, Axis } from "../../constants/canvasConstants";
import { FoodType, Side } from "../../constants/objectConstants";
import { isNewCreaturePositionInsideAnyObject } from "../object/objectsLogic";

// #region birth
export const determineGeneration = (mother, father) => {
    if (mother === null && father === null) {
        return 1;
    }

    if (mother === null) {
        return father.generation + 1;
    }

    if (father === null) {
        return mother.generation + 1;
    }

    if (mother.generation > father.generation) {
        return mother.generation + 1;
    } else {
        return father.generation + 1;
    }
}
//#endregion

//#region dying
export const assessCauseOfDeath = (creature) => {
    let cause = CauseOfDeath.UNKNOWN;

    if (creature.safety.isBeingChased && creature.safety.isBeingEaten) {
        cause = CauseOfDeath.WAS_EATEN;
    } else if (creature.needs.foodLevel.points <= 0) {
        cause = CauseOfDeath.STARVATION;
    } else if (creature.life.LifeStage === LifeStage.DECEASED || 
        creature.life.age > creature.life.lifeSpan) {
            cause = CauseOfDeath.OLD_AGE;
    }

    console.log(`==========================================================================\n` +
        `CREATURE ${getCreatureIdentityString(creature)} HAS DIED DUE TO: ${cause}\n` +
        `==========================================================================`);

    creature.causeOfDeath = cause;
}

export const isTimeToMoveOn = (creature) => {
    if (!creature.life.isDead || creature.life.lifeStage !== LifeStage.DECEASED ||
        creature.life.timeOfDeath === null) {
        return false;
    }

    if (creature.isEaten) {
        return true;
    }

    let timeDead = Date.now() - creature.life.timeOfDeath;
    if (timeDead >= TimeProps.MS_PER_DAY) {
        return true;
    }
    return false;
}

export const prepareForDeath = (creature) => {
    // give everything a chance to be drawn
    // if (creature.safety.isBeingEaten && !creature.safety.isDrawnBeforeEaten) {
    //     creature.safety.isDrawnBeforeEaten = true;
    //     return;
    // }

    if (creature.safety.isBeingEaten) {
        creature.isEaten = true;
    }
    creature.safety.isBeingChased = false;
    creature.safety.isBeingEaten = false;
    creature.safety.isDrawnBeforeEaten = false;
    creature.life.isDead = true;
    creature.life.timeOfDeath = Date.now();
    creature.life.lifeStage = LifeStage.DECEASED;

    if (creature.safety.shelter !== null) {
        creature.safety.shelter.removeMemberFromShelter(creature);
    }

    if (creature.family.mate !== null) {
        creature.family.mate.family.mate = null;
        creature.family.mate = null;
    }
}
//#endregion

// #region creature collision fixes
export const getNecessaryCollisionPadding = () => {
    let halfLargest = CreatureDefaults.LARGEST_SIZE / 2;
    let padding = halfLargest + CanvasInfo.OBJECT_PADDING;
    return padding;
}

export const isCreatureInRangeOfTargetPosition = (creature) => {
    let pos = creature.position;
    let targetPos = creature.targetPosition;

    let xDif = Math.abs(targetPos.x - pos.x);
    let yDif = Math.abs(targetPos.y - pos.y);

    if (xDif <= creature.movement.speed && yDif <= creature.movement.speed) {
        return true;
    }
    return false;
}

export const moveCreatureToNearbyValidPosition = (creature, objects) => {
    let padding = getNecessaryCollisionPadding();
    let relative = [
        {x: -padding, y: 0},
        {x: padding, y: 0},
        {x: 0, y: -padding},
        {x: 0, y: padding},
        {x: padding, y: padding},
        {x: padding, y: -padding},
        {x: -padding, y: padding},
        {x: -padding, y: -padding}
    ];

    let moveToPosition = {...creature.position};
    for (let i = 0; i < relative.length; i++) {
        let posToCheck = {x: creature.x + relative[i].x, y: creature.y + relative[i]. y};
        let isObjectCollision = isNewCreaturePositionInsideAnyObject(creature, posToCheck, objects);
        if (!isObjectCollision) {
            moveToPosition = posToCheck;
        }
    }

    this.creature.position = moveToPosition;
}

//#endregion

// #region search methods
export const getTargetFromArea = (sightCoords, possibleTypes, possibleTargets) => {
    let newTarget = null;
    possibleTargets.forEach(t => {
      if (possibleTypes.includes(t.type)) {
        let points = getStartAndEndPoints(t.id, t.position, t.width, t.height);
        if ((points.xStart >= sightCoords.xStart && points.xEnd <= sightCoords.xEnd) &&
            (points.yStart >= sightCoords.yStart && points.yEnd <= sightCoords.yEnd)) {
              newTarget = t;
            }
      }
    });

    // if (newTarget !== null && newTarget.type === CreatureType.BIDDY) {
    //     console.log(`targeting biddy`);
    // }

    return newTarget;
  }

//#endregion

// #region position methods

export const getRandomCreatureStartPosition = (info, creatures, objects, plants, shelters) => {
    let passInfo = {width: info.size, height: info.size};
    let result = getRandomStartPosition(passInfo, creatures, objects, plants, shelters, CreatureDefaults.LARGEST_SIZE);
    return result;
}

export const getNearbyPosition = (creature, creatures, objects, plants, shelters) => {
    let moveAmount = creature.size;
    let relativePositionsToTry = [
        {x: -moveAmount, y: -moveAmount},
        {x: -moveAmount, y: moveAmount},
        {x: moveAmount, y: -moveAmount},
        {x: moveAmount, y: moveAmount},
        {x: moveAmount, y: 0},
        {x: -moveAmount, y: 0},
        {x: 0, y: moveAmount},
        {x: 0, y: -moveAmount}
    ];

    for (let i = 0; i < relativePositionsToTry.length; i++) {
        let rp = relativePositionsToTry[i];
        let position = {x: creature.position.x + rp.x, y: creature.position.y + rp.y};
        let creatureInfo = {id: creature.id, position: position, width: creature.width, height: creature.height};
        let result = isAnyCollision(creatureInfo)
    }

}

const setCreatureDirectionByTargetPosition = (creature) => {
    let dif = getPositionDifference(creature.position, creature.targetPosition);
    creature.movement.setDirection(dif.xDifference, dif.yDifference);
}

export const addMovementRecord = (recordArray, newRecord) => {
    let copy = [...recordArray];
    if (copy.length < CreatureDefaults.MAX_MOVE_RECORDINGS) {
        copy.push(newRecord);
        return copy;
    }

    copy.splice(0, 1);
    copy.push(newRecord);
    return copy;
}

export const checkForMovementPattern = (records) => {
    let patternResults = findArrayPatterns(records);
    // detect largest pattern
    let largest = getResultWithLargestPattern(patternResults);
    return largest;
}

const getResultWithLargestPattern = (patternResults) => {
    let largestLength = 0;
    let largest = null;
    patternResults.forEach(r => {
        if (r.pattern.length > largestLength) {
            largestLength = r.pattern.length;
            largest = r;
        }
    });
    return largest;
}

// creature Corners



// methods about creature sight
export const determineSightDirection = (creature) => {
    let m = creature.movement;

    let creatureDirection = m.direction;
    let creaturePosition = creature.position;
    let targetPosition = creature.targetPosition;
    // check to see if there is only one direction listed - if so, return that
    if (creatureDirection.x && !creatureDirection.y) {
        return creatureDirection.x;
    } else if (creatureDirection.y && !creatureDirection.x) {
        return creatureDirection.y;
    } else if (!creatureDirection.x && !creatureDirection.y) {
      // if neither are there then figure out the direction based on the target
        setCreatureDirectionByTargetPosition(creature);
        if (m.direction.x === null && m.direction.y === null) { // if still null, just return a default direction of south
        return Direction.SOUTH;
        }
    }

    // otherwise determine the one furthest from the target because the diagonal will be skewed in that direction
    // TODO find out if there's a way to rotate the sight
    let xDistance = Math.abs(creaturePosition.x - targetPosition.x);
    let yDistance = Math.abs(creaturePosition.y - targetPosition.y);
    if (xDistance >= yDistance) { // let x be default in case of tie
        return creatureDirection.x;
    } else {
        return creatureDirection.y;
    }
}

export const determineSightCoordinates = (creature, sightDirection, canvasInfo) => {
    let m = creature.movement;

    let xStart = null;
    let xEnd = null;
    let yStart = null;
    let yEnd = null;
    let width = null;
    let height = null;

    let sightDiameter = m.sightRadius * 2;

    switch (sightDirection) {
        case Direction.NORTH:
            width = sightDiameter;
            xStart = creature.position.x - m.sightRadius;
            xEnd = xStart + width;
            height = m.sightDistance;
            yStart = creature.position.y - height;
            yEnd = creature.position.y;
            break;
        case Direction.SOUTH:
            width = sightDiameter;
            xStart = creature.position.x - m.sightRadius;
            xEnd = xStart + width;
            height = m.sightDistance;
            yStart = creature.position.y;
            yEnd = creature.position.y + height;
            break;
        case Direction.WEST:
            width = m.sightDistance;
            xStart = creature.position.x - width;
            xEnd = creature.position.x;
            height = sightDiameter;
            yStart = creature.position.y - m.sightRadius;
            yEnd = yStart + sightDiameter;
            break;
        case Direction.EAST:
            width = m.sightDistance;
            xStart = creature.position.x;
            xEnd = creature.position.x + width;
            height = sightDiameter;
            yStart = creature.position.y - m.sightRadius;
            yEnd = yStart + sightDiameter;
            break;
    }

    // if any values are over edge, adjust them
    if (yStart < 0) {
        yStart = 0;
        height = yEnd;
    }

    if (yEnd > canvasInfo.HEIGHT) {
        yEnd = canvasInfo.HEIGHT - 1;
        height = yEnd - yStart;
    }

    if (xStart < 0) {
        xStart = 0;
        width = xEnd;
    }

    if (xEnd > canvasInfo.WIDTH) {
        xEnd = canvasInfo.WIDTH - 1;
        width = xEnd - xStart;
    }

    // return result
    let result = offsetValues(m.sightOffset, width, height, xStart, xEnd, yStart, yEnd);


    return result;
}

const getOtherAddAmountForNewDirection = (creatureSize, positionValue, obj, isCornerCollision, collisionSide) => {
    if (!isCornerCollision) {
        return positionValue;
    }

    let halfSize = creatureSize / 2 + 1;
    let relativeAmount = getNecessaryCollisionPadding() + halfSize;

    let objCoord;
    let amountToAdd;
    switch(collisionSide) {
        case Side.TOP:
            objCoord = obj.yStart;
            amountToAdd = -1 * relativeAmount;
            break;
        case Side.BOTTOM:
            objCoord = obj.yEnd;
            amountToAdd = relativeAmount;
            break;
        case Side.LEFT:
            objCoord = obj.xStart;
            amountToAdd = -1 * relativeAmount;
            break;
        case Side.RIGHT:
            objCoord = obj.xEnd;
            amountToAdd = relativeAmount;
            break;
    }

    let result = positionValue + amountToAdd;
    return result;
}

export const getPositionInNewDirection = (creature, direction, obj, collisionSide, isCornerCollision, extra = 0) => {
    let newX = creature.position.x;
    let newY = creature.position.y;
    switch (direction) {
      case Direction.NORTH:
        newY = creature.position.y - creature.movement.speed - extra;
        newX = getOtherAddAmountForNewDirection(creature.size, newX, obj, isCornerCollision, collisionSide);
        break;
      case Direction.SOUTH:
        newY = creature.position.y + creature.movement.speed + extra;
        newX = getOtherAddAmountForNewDirection(creature.size, newX, obj, isCornerCollision, collisionSide);
        break;
      case Direction.WEST:
        newX = creature.position.x - creature.movement.speed - extra;
        newY = getOtherAddAmountForNewDirection(creature.size, newY, obj, isCornerCollision, collisionSide);
        break;
      case Direction.EAST:
        newX = creature.position.x + creature.movement.speed + extra;
        newY = getOtherAddAmountForNewDirection(creature.size, newY, obj, isCornerCollision, collisionSide);
        break;
      default:
        break;
    }

    // let newPos = modifyPositionInNewDirectionByTargetPosition(creature.targetPosition, {x: newX, y: newY}, direction);
    // return newPos;

    return {
      x: newX,
      y: newY
    };
  };

  // if a creature is going around a corner, they may get stuck if they are moving further than their target on one axis and then circling back - prevent this
const modifyPositionInNewDirectionByTargetPosition = (targetPos, newDirPos, direction) => {
    let modifiedPos = {...newDirPos};
    let doChange = false;
    let changeAxis = null;
    let changeValue = 0;

    switch (direction) {
        case Direction.WEST:
            if (newDirPos.x < targetPos.x) {
                doChange = true;
                changeAxis = Axis.X;
                changeValue = targetPos.x;
            }
            break;
        case Direction.EAST:
            if (newDirPos.x > targetPos.x) {
                doChange = true;
                changeAxis = Axis.X;
                changeValue = targetPos.x;
            }
            break;
        case Direction.NORTH:
            if (newDirPos.y < targetPos.y) {
                doChange = true;
                changeAxis = Axis.Y;
                changeValue = targetPos.y;
            }
            break;
        case Direction.NORTH:
            if (newDirPos.y > targetPos.y) {
                doChange = true;
                changeAxis = Axis.Y;
                changeValue = targetPos.y;
            }
            break;
    }

    if (doChange) {
        if (changeAxis === Axis.X) {
            modifiedPos.x = changeValue;
        } else {
            modifiedPos.y = changeValue;
        }
    }

    return modifiedPos;
}

const offsetValues = (offset, width, height, xStart, xEnd, yStart, yEnd) => {
    if (!offset) {
        offset = {
            x: 0,
            y: 0
        };
    }
    //console.log(`sight offset: ${JSON.stringify(offset)}`);
    let result = {
        width: width,
        height: height,
        xStart: xStart + offset.x,
        xEnd: xEnd + offset.x,
        yStart: yStart + offset.y,
        yEnd: yEnd + offset.y
    };
    return result;
}

//#endregion

// #region sight logic

export const getSightLineInfo = (creature) => {
    let lineInfo = {
        xStart: creature.position.x,
        yStart: creature.position.y,
        xEnd: creature.targetPosition.x,
        yEnd: creature.targetPosition.y
    };
    return lineInfo;
}

export const isInSight = (sightCoords, item) => {
    let iPoints = getStartAndEndPoints(item.id, item.position, item.width, item.height);
    if ((iPoints.xStart >= sightCoords.xStart && iPoints.xEnd <= sightCoords.xEnd) &&
    (iPoints.yStart >= sightCoords.yStart && iPoints.yEnd <= sightCoords.yEnd)) {
        return true;
    }
    return false;
}
export const checkSightAreaForItemInArray = (creature, items, canvasInfo) => {
    let sightCoords = creature.movement.getSightCoords(canvasInfo);
    let didSeeTarget = false;
    let targetsSeen = [];
    items.forEach(i => {
        if (isInSight(sightCoords, i)) {
            didSeeTarget = true;
            targetsSeen.push(i);
        }
    });

    return {
        didSeeTarget: didSeeTarget,
        targetsSeen: targetsSeen
    };
}
//#endregion

//#region mating logic

export const getRandomGender = () => {
    let genders = [Gender.MALE, Gender.FEMALE];
    let random = getRandomItemInArray(genders);
    return random;
}

export const getCreatureInfoByType = (type) => {
    let all = AllCreatureDefaults;
    for (let i = 0; i < all.length; i++) {
        if (all[i].type === type) {
            return all[i];
        }
    }
    throw "Error: No relevent creature type specified inside getCreatureInfoByType inside of CreatureLogic.js.";
}

export const searchAreaForMate = (creature, allCreatures) => {
    
    let sightCoords = creature.movement.getSightCoordinates(CanvasInfo);
    let isMateFound = false;
    let newMate = null;
    // loop through creatures to check if one is in sight and could be a mate
    for (let i = 0; i < allCreatures.length; i++) {
        let c = allCreatures[i];
        if (c.id !== creature.id && isInSight(sightCoords, c) && 
            isPotentialMate(creature, c)) {
                isMateFound = true;
                newMate = c;
                break;
            }
    }
    return {
        isMateFound: isMateFound,
        newMate: newMate
    }
}


export const getOppositeGender = (gender) => {
    switch(gender) {
        case Gender.MALE:
            return Gender.FEMALE;
        case Gender.FEMALE:
            return Gender.MALE;
        default:
            return null;
    }
}
export const doesPotentialMateExist = (creature, allCreatures) => {
    let result = false;
    allCreatures.forEach(c => {
        if (isPotentialMate(creature, c)) {
            result = true;
        }
    });
    return result;
}

export const isPotentialMate = (creature, otherCreature) => {
    if (creature.type === otherCreature.type &&
        otherCreature.gender === getOppositeGender(creature.gender) &&
        otherCreature.family.mate === null && 
        otherCreature.life.lifeStage === LifeStage.ADULT) {
            return true;
        }
    return false;
}


//#endregion
//#region shelter logic
export const getRandomShelterPosition = (creature, creatures, objects, shelters) => {
    let shelterSize = creature.adultSize * ShelterLine.MULTIPLIER;
    let shelterInfo = {width: shelterSize, height: shelterSize};
    // don't worry about plants
    let position = null;
    do {
        position = getRandomCreatureTargetPosition(creature, objects, shelters);
        //position = getRandomStartPosition(shelterInfo, creatures, objects, [], shelters, CreatureDefaults.LARGEST_SIZE, null, false);
    } while (!canSetShelterInPosition(position, creature, creatures, objects, shelters));

    return position;
}

export const canSetShelterInPosition = (position, creature, creatures, objects, shelters) => {
    let shelterSize = creature.adultSize * ShelterLine.MULTIPLIER;
    let creationInfo = {id: null, position: position, width: shelterSize, height: shelterSize};
    let collisionResult = isAnyCollision(creationInfo, creatures, objects, [], shelters, CanvasInfo.OBJECT_PADDING, creature.id, false);

    // if the result is still false, also loop through creatures - if they are setting up shelter, check their target position
    if (!collisionResult) {
        let futureShelters = [];
        creatures.forEach(c => {
            if (c.id !== creature.id && c.needs.priority === ActionType.CREATE_SHELTER 
                && c.movement.moveMode === MoveMode.SEARCH && c.targetType ==NeedType.SHELTER) {
                let futureShelterSize = c.adultSize * ShelterLine.MULTIPLIER;
                let futureShelter = {id: null, position: c.targetPosition, width: futureShelterSize, height: futureShelterSize};
                futureShelters.push(futureShelter);
            }
        });
        if (futureShelters.length > 0) {
            let creationPoints = getStartAndEndPoints(null, creationInfo.position, creationInfo.width, creationInfo.height);
            collisionResult = checkAnyArrayCollision(creationPoints, futureShelters, CanvasInfo.OBJECT_PADDING).isCollision;
        }
    }

    // if the result 
    return !collisionResult;
}

//#endregion