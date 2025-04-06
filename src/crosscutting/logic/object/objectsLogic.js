import {
    getArrayOfCorners,
    addCornerSidesToArray,
    getStartAndEndPoints,
    // getCreatureObjectCollisionInfo,
    checkAnyArrayCollision,
    getObjectStartAndEndPoints,
    isCollision,
  determineAxisBySide,
getCornerPositionFromStartAndEndPoints, 
getCreatureIdentityString,
getPositionDifference} from "../universalLogic";
import { Side, Corner, RelativeToObject, CornerSideResult } from "../../constants/objectConstants";
import { CreatureDefaults, Direction } from "../../constants/creatureConstants";
import { Axis, CanvasInfo } from "../../constants/canvasConstants";
import { getNecessaryCollisionPadding as getNecessaryCollisionPreventionPadding } from "../creature/creatureLogic";


// v2 collision logic

export const isValidTargetPosition = (creature, objects) => {
  return !isNewCreaturePositionInsideAnyObject(creature, creature.targetPosition, objects);
}

// this one is ONLY for getting a bool whether a position for a creature would be overlapping any object
export const isNewCreaturePositionInsideAnyObject = (creature, newCreaturePosition, objects, padding = getNecessaryCollisionPreventionPadding()) => {

  let isCollision = false;
  for (let i = 0; i < objects.length; i++) {
    //let isObjCollision = objects[i].isCreatureInsideObject(creature, newCreaturePosition, padding);
    let isObjCollision = objects[i].doesNewPositionCollideWithObject(creature, newCreaturePosition, padding).isCollision;
    if (isObjCollision) {
      isCollision = true;
      break;
    }
  }

  return isCollision;
}

// this one provides collision information for a new position, including what side a collision occurs on an object
export const checkIfCreatureCollidesWithAnyObjects = (creature, newCreaturePosition, objects) => {
  let padding = CanvasInfo.OBJECT_PADDING;

  let endResult = {
    didCollide: false,
    objectCollided: null,
    collisionSide: null,
    directionToMove: null,
    prevPlacement: null,
    isCornerCollision: false
  }

  if (!objects) {
    console.log(`value of objects: ${JSON.stringify(objects)}`);
    return endResult;
  } else if (!creature) {
    console.log(`value of creature: ${JSON.stringify(creature)}`);
  }

  let relativePlacement = null;
  let placementBools = null;

  // determine collision
  for (let i = 0; i < objects.length; i++) {
    let result = objects[i].doesNewPositionCollideWithObject(creature, newCreaturePosition, padding);
    if (result.isCollision) {
      endResult.didCollide = true;
      endResult.objectCollided = objects[i];
      relativePlacement = result.relativePlacement;
      placementBools = result.placementBools;
      break;
    } 
  }

  endResult.prevPlacement = relativePlacement;

  // return if no collision
  if (!endResult.didCollide) {
    return endResult;
  }

  // throw exception if relative placement was already an overlap
  if (relativePlacement === RelativeToObject.OVERLAP) {

    // if the previous placement wasn't an overlap, return that instead of throwing an error
    if (creature.movement.previousPlacement !== RelativeToObject.OVERLAP) {
      relativePlacement = creature.movement.previousPlacement;
    } else {
    throw `Error: Creature ${creature.gender} ${creature.type} ${creature.id} was already colliding ` +
      `with object ${endResult.objectCollided.id} in position ${JSON.stringify(creature.position)} before ` +
      `moving. This should not happen.\n(method checkIfCreatureCollidesWithAnyObjects inside objectLogic.js)` + 
      `\n (Creature action was ${creature.needs.priority}, position was ${JSON.stringify(creature.position)}.)`+
      `(Previous placement recorded was: ${creature.movement.previousPlacement}.`;
    }

    
  }

  // determine if side or corner
  let isSide = isRelativeSideOfObject(relativePlacement);

  // determine side of object for determining direction
  let sideOfObject = null;
  let objCorner = null;
  let wasATie = false;
  let isCorner = false;
  if (isSide) {
    sideOfObject = getObjectSideFromRelativePlacement(relativePlacement);
  } else { // if it's a corner not a side, figure out which side of the object to deal with
	isCorner = true;
    objCorner = getObjectCornerFromRelativePlacement(relativePlacement)
    let cornerSideResult = getCreatureCornerObjectSideResult(objCorner, endResult.objectCollided, creature, newCreaturePosition, padding);
    // set side of object if it's not a tie
    if (cornerSideResult !== CornerSideResult.TIE) {
      sideOfObject = cornerSideResult;
    } else {
      //figure out what to do now if it was a tie - how do we determine which direction from here?
      sideOfObject = breakCornerTieToGetObjectSide(objCorner, endResult.objectCollided, creature);
      wasATie = true;
    }
  }
  endResult.collisionSide = sideOfObject;
  endResult.isCornerCollision = isCorner;

  // decide direction
  // NOTE: keep in mind cases of a corner tie where moving in the side of a direction doesn't make sense
  // keep this in mind if there are any weird bugs around this
  let direction = determineDirectionByTarget(creature, sideOfObject, endResult.objectCollided, CanvasInfo, isCorner);
  endResult.directionToMove = direction;
  
  if (wasATie) {
    console.log(`direction determined: ${direction}`);
  }

  // return result finally!
  return endResult;
}

const checkIfPreviousRelativePlacementWasCollision = (objects, creature, padding) => {
  let prevPlacementWasCollision = false;

  // determine collision
  for (let i = 0; i < objects.length; i++) {
    let result = objects[i].doesNewPositionCollideWithObject(creature, creature.position, padding);
    if (result.isCollision) {
      prevPlacementWasCollision = true;
      break;
    } 
  }

  return prevPlacementWasCollision;
}

const breakCornerTieToGetObjectSide = (objCorner, obj, creature) => {
  let objSides = getSidesOfCorner(objCorner);

  let didPriorityChange = creature.needs.didPriorityChange(creature.needs.priority, creature.needs.previousPriority, false);

  // first, if one of the sides was the previous collision side, return the other one?
  // NOTE: actually, perhaps it would be better to return the same side until there's no longer a collision?
  // consider circumstances - ok, I'm choosing the side with opposite closest to target in this case
  let prevSide = creature.movement.previousSide;
  let checkedPreviousSide = false;
  if (!didPriorityChange && prevSide === objSides[0] || prevSide === objSides[1]) {
    checkedPreviousSide = true;
    let side = getObjectSideWithOppositeClosestToTarget(objSides, obj, creature.targetPosition);
    //let change = creature.needs.didPriorityChange();
    if (side !== CornerSideResult.TIE) {
      return side;
    }
    //  else {
    //   console.log(`There is a corner tie for ${getCreatureIdentityString(creature)} near obj ${obj.id},\n` + 
    //   `New side determined by checking previousSide and using getObjectSideWithOppositeClosestToTarget: ${side}`);
    // }
  }

  // try to break by shortest length
  let shortestSide = getObjectSideWithShortestLength(objSides, obj);
  if (checkedPreviousSide) {
    console.log(`There is a corner tie for ${getCreatureIdentityString(creature)} near obj ${obj.id}.\n` + 
    `New side determined by getObjectSideWithShortestLength: ${shortestSide}`);
  }
  if (shortestSide !== CornerSideResult.TIE) {
    return shortestSide;
  }

  // otherwise, try to break with side opposite closest to target again
  let side = getObjectSideWithOppositeClosestToTarget(objSides, obj, creature.targetPosition);
  console.log(`There is a corner tie for ${getCreatureIdentityString(creature)} near obj ${obj.id}.\n` + 
  `New side determined by getObjectSideWithOppositeClosestToTarget: ${side}`);
  //didPriorityChange = creature.needs.didPriorityChange();
  if (side !== CornerSideResult.TIE) {
    return side;
  }

  // if it's STILL a tie, return the side on the axis position

  side = getObjectSideWithYAxis(objSides);
  console.log(`There is still a corner tie at the end for ${getCreatureIdentityString(creature)} near obj ${obj.id}.\n` + 
  `New side determined by getObjectSideWithYAxis: ${side}`);
  //didPriorityChange = creature.needs.didPriorityChange();
  return side;

}

const getObjectSideWithYAxis = (sides) => {
  let side = null;
  sides.forEach(s => {
    let axis = determineAxisBySide(s);
    if (axis === Axis.Y) {
      side = s;
    }
  });

  if (side === null) {
    throw `Error: No side has Y axis for sides ${JSON.stringify(sides)} inside getObjectSideWithYAxis. (objectsLogic.js)`;
  }

  return side;
}

// const getAxisFromSide = (side) => {
//   switch (side) {
//     case Side.TOP:
//     case Side.BOTTOM:
//       return Axis.Y;
//     case Side.LEFT:
//     case Side.RIGHT:
//       return Axis.X;
//     default:
//       throw `Error: Axis could not be determined from side ${side} in getAxisFromSide. (objectsLogic.js)`;
//   }
// }

const getObjectSideWithOppositeClosestToTarget = (objSides, obj, targetPosition) => {
  let oppositeDistances = [];
  objSides.forEach(s => {
    let oppositeSide = getOppositeSide(s);
    let oppPosInfo = getObjectSideAxisPosition(oppositeSide, obj);
    let distance = getSideDistanceFromTarget(oppPosInfo.axis, oppPosInfo.position, targetPosition);
    oppositeDistances.push({objSide: s, oppositeDistance: distance});
  });

  if (oppositeDistances[0].distance > oppositeDistances[1].distance) {
    return oppositeDistances[1].objSide;
  } else if (oppositeDistances[0].distance < oppositeDistances[1].distance) {
    return oppositeDistances[0].objSide;
  } else {
    return CornerSideResult.TIE;
  }
}

const getObjectSideWithOppositeSideCloserToTarget = (objSides, obj, targetPosition) => {
  
}

const isOppositeCornerOnSideCloserToTarget = (obj, corner, side, targetPosition) => {

}

// const getObjectCornerDistanceFromTarget = () => {
//   let cornerAPos = getObjectCornerPosition(obj, cornerA);
//   let cornerBPos = getObjectCornerPosition(obj, cornerB);

//   let cornerADif = getPositionDifferenceFromCorner(axis, cornerAPos, targetPosition);
//   let cornerBDif = getPositionDifferenceFromCorner(axis, cornerBPos, targetPosition);
// }

const getSideDistanceFromTarget = (axis, objCoord, targetPosition) => {
  let targetCoord = null;
  if (axis === Axis.Y) {
    targetCoord = targetPosition.y;
  } else {
    targetCoord = targetPosition.x;
  }

  let distance = Math.abs(objCoord - targetCoord);
  return distance;
}

const getObjectSideWithShortestLength = (objSides, obj) => {
  let sideLengths = [];
  objSides.forEach(s => {
    let length = getObjectSideLength(s, obj);
    sideLengths.push({objSide: s, length: length});
  });

  if (sideLengths[0].length > sideLengths[1].length) {
    return sideLengths[1].objSide;
  } else if (sideLengths[0].length < sideLengths[1].length) {
    return sideLengths[0].objSide;
  } else {
    return CornerSideResult.TIE;
  }
}

const getObjectSideLength = (side, obj) => {
  switch (side) {
    case Side.TOP:
    case Side.BOTTOM:
      return obj.width;
    case Side.LEFT:
    case Side.RIGHT:
      return obj.height;
    default:
      throw `Error: something went wrong inside of getObjectSideLength. (objectsLogic.js)`;
  }
}

// for determining which side of an object corner the creature is colliding with
// could be a tie that will need to be broken
const getCreatureCornerObjectSideResult = (objCorner, obj, creature, newPosition, padding) => {
  let objSides = getSidesOfCorner(objCorner);

  let sideDifs = [];
  objSides.forEach(s => {
    let creatureSide = getOppositeSide(s);
    let cPosInfo = getCreatureSideAxisPosition(creatureSide, creature, newPosition);
    let objPosInfo = getObjectSideAxisPosition(s, obj, padding);
    let dif = Math.abs(cPosInfo.position - objPosInfo.position);
    sideDifs.push({objSide: s, difference: dif});
  });

  if (sideDifs[0].difference > sideDifs[1].difference) {
    return sideDifs[1].objSide;
  } else if (sideDifs[0].difference < sideDifs[1].difference) {
    return sideDifs[0].objSide;
  } else {
    return CornerSideResult.TIE;
  }
}

const getObjectSideFromRelativePlacement = (placement) => {
  switch (placement) {
    case RelativeToObject.LEFT_SIDE:
      return Side.LEFT;
    case RelativeToObject.RIGHT_SIDE:
      return Side.RIGHT;
    case RelativeToObject.TOP_SIDE:
      return Side.TOP;
    case RelativeToObject.BOTTOM_SIDE:
      return Side.BOTTOM;
    default:
      throw `Error: Placement ${placement} is not a side. This should not happen inside this method.` +
      `\n(getObjectSideFromRelativePlacement inside objectLogic.js)`;
  }
}

const isRelativeSideOfObject = (placement) => {
  switch (placement) {
    case RelativeToObject.LEFT_SIDE:
    case RelativeToObject.RIGHT_SIDE:
    case RelativeToObject.TOP_SIDE:
    case RelativeToObject.BOTTOM_SIDE:
      return true;
    default:
      return false;
  }
}

const getObjectCornerFromRelativePlacement = (placement) => {
  switch (placement) {
    case RelativeToObject.TOP_LEFT_CORNER:
      return Corner.TOP_LEFT;
    case RelativeToObject.TOP_RIGHT_CORNER:
      return Corner.TOP_RIGHT;
    case RelativeToObject.BOTTOM_LEFT_CORNER:
      return Corner.BOTTOM_LEFT;
    case RelativeToObject.BOTTOM_RIGHT_CORNER:
      return Corner.BOTTOM_RIGHT;
    default:
      console.log(`Error: Placement ${placement} is not a corner. This should not happen inside this method.` +
      `\n(getObjectCornerFromRelativePlacement inside objectLogic.js)`);
      return Corner.BOTTOM_RIGHT;
  }
}

const isRelativeCornerOfObject = (placement) => {
  switch (placement) {
    case RelativeToObject.TOP_LEFT_CORNER:
    case RelativeToObject.TOP_RIGHT_CORNER:
    case RelativeToObject.BOTTOM_LEFT_CORNER:
    case RelativeToObject.BOTTOM_RIGHT_CORNER:
      return true;
    default:
      return false;
  }
}



// doesNewPositionCollideWithObject = (creature, newCreaturePosition, padding = 0) => {
//   let isCollision = false;   
//   let positionChecked = newCreaturePosition;     
//   let objectChecked = this;
//   let relativePlacement = null; // relative placement to object before collision (if collision)

//   let newCreaturePoints = getStartAndEndPoints(creature.id, newCreaturePosition, creature.size, creature.size);
//   let newPositionCondition = this.getRelativeToObjectCondition(newCreaturePoints, padding);

//   if (newPositionCondition === RelativeToObject.OVERLAP) {
//       isCollision = true;

//       let oldCreaturePoints = getStartAndEndPoints(creature.id, newCreaturePosition, creature.size, creature.size);
//       relativePlacement = this.getRelativeToObjectCondition(oldCreaturePoints, padding);
//   }
  
//   return {
//       isCollision: isCollision,
//       positionChecked: positionChecked,
//       objectChecked: objectChecked,
//       relativePlacement: relativePlacement
//   }
// }

// getRelativeToObjectCondition = (creaturePoints, padding = 0) => {
//   //let creaturePoints = getStartAndEndPoints(creature.id, creaturePosition, creature.size, creature.size);
//   let result = {
//       condition: null,
//       isAwayFromLeft: null,
//       isAwayFromRight: null,
//       isAwayFromTop: null,
//       isAwayFromBottom: null
//   }
//   let resultsToFill = [
//       {
//           side: Side.LEFT,
//           fieldString: "isAwayFromLeft"
//       }, 
//       {
//           side: Side.RIGHT,
//           fieldString: "isAwayFromRight"
//       }, 
//       {
//           side: Side.TOP,
//           fieldString: "isAwayFromTop"
//       }, 
//       {
//           side: Side.BOTTOM,
//           fieldString: "isAwayFromBottom"
//       },
//       {
//           side: null,
//           fieldString: "condition"
//       }, 
//   ];

//   resultsToFill.forEach(rf => {
//       let resultValue = null;
//       if (rf.side !== null) {
//           resultValue = this.isAwayFromSide(creaturePoints, side, padding);
//       };
//       let newResult = fillRelativeFieldForObjectConditionResult(rf.fieldString, resultValue, result);
//       result = newResult;
//   });

//   let finalResult = result.condition;
//   return finalResult;
// }

// const getObjectBorderPointsByType = (obj) => {
//   switch (obj.type) {
//     case ObjectType.WALL:
//       return {
//         xStart: obj.xStart,
//         xEnd: obj.xEnd,
//         yStart: obj.yStart,
//         yEnd: obj.yEnd
//       }
//     case ObjectType.SHELTER:
//       return {
//         xStart: obj.getXStart(),
//         xEnd: obj.getXEnd(),
//         yStart: obj.getYStart(),
//         yEnd: obj.getYEnd()
//       }
//   }
// }

// const isAwayFromSide = (obj, creaturePoints, side, padding) => {
//   let creaturePoint = null;
//   let objPoint = null;
//   let lessOrGreater = null;

//   let b = getObjectBorderPointsByType(obj);

//   switch (side) {
//       case Side.LEFT:
//           creaturePoint = creaturePoints.xEnd;
//           objPoint = b.xStart;
//           lessOrGreater = "less";
//           break;
//       case Side.RIGHT:
//           creaturePoint = creaturePoints.xStart;
//           objPoint = b.xEnd;
//           lessOrGreater = "greater";
//           break;
//       case Side.TOP:
//           creaturePoint = creaturePoints.yEnd;
//           objPoint = b.yStart;
//           lessOrGreater = "less";
//           break;
//       case Side.BOTTOM:
//           creaturePoint = creaturePoints.yStart;
//           objPoint = b.yEnd;
//           lessOrGreater = "greater";
//           break;
//   }

//   let result = null;
//   if (lessOrGreater === "less") {
//       result = creaturePoint < objPoint - padding;
//   } else if (lessOrGreater === "greater") {
//       result = creaturePoint > objPoint + padding;
//   }

//   if (result) {
//       return result;
//   }
//   throw `isAwayFromSide could not be determined inside of class for object ${this.id} in position ${this.position}`;
// }


// v1 collision logic
export const checkCreatureObjectCollision = (creationInfo, newPosition, objects) => {
    let creationPoints = getStartAndEndPoints(creationInfo.position, creationInfo.width, creationInfo.height);

    
}

export const checkAllCreatureObjectCollisions = (creature, newPosition, objects) => {
    let endResult = {
        didCollide: false,
        objectCollided: null,
        collisionSide: null
    }
    let creaturePoints = getStartAndEndPoints(creature.id, newPosition, creature.width, creature.height);
    let prevCreaturePoints = getStartAndEndPoints(creature.id, creature.position, creature.width, creature.height);


    // isCollision: yes or no
    // smallerId: id of the smaller object colliding
    //pointsOfCollision: points on the creature where there is a collision
    //collidedWith: object collided with
    let result = checkAnyArrayCollision(creaturePoints, objects, CanvasInfo.OBJECT_PADDING, creature.id);
    // for (let i = 0; i < objects.length; i++) {
    //     let obj = objects[i];
    //     let result = isCreatureObjectCollision(creature, newPosition, obj);
    //     if (result.isCollision) {
    //         endResult.didCollide = true;
    //         endResult.objectCollided = obj;
    //         endResult.collisionSide = result.collisionSide;
    //         break;
    //     }
    // }
    
    endResult.didCollide = result.isCollision;
    endResult.objectCollided = result.collidedWith;

    if (endResult.didCollide) { // determine object's side of collision if there was a collision 
      let points = [];
      result.pointsOfCollision.forEach(p => points.push(p.point));
        //console.log(`creature ${result.smallerId} collided with object ${result.collidedWith.id} at points: ${points}`);

        // first add all corners and sides and cornerSides to arrays
        let corners = [];
        let sides = [];
        //let cornerSides = [];
        result.pointsOfCollision.forEach(p => {
          if (isCorner(p.point)) {
            let newPos = getCornerPositionFromStartAndEndPoints(p.point, prevCreaturePoints);
            corners.push({
              name: p.point,
              x: newPos.x,
              y: newPos.y
            });
            //addCornerSidesToArray(p, cornerSides);
          } else if (isSide(p.point) && !sides.includes(p.point)) {
            sides.push(p.point);
          }
        });

        // get start and end points of the object
        let obj = result.collidedWith;
        let objStartAndEndPositions = getObjectStartAndEndPoints(obj);

        // now determine collision side by the above info
        endResult.collisionSide = determineCollisionSideByCollidingPoints(creature, creaturePoints, corners, sides, objStartAndEndPositions);
    }

    return endResult;
}

const isCorner = (point) => {
  switch (point) {
    case Corner.TOP_LEFT:
    case Corner.TOP_RIGHT:
    case Corner.BOTTOM_LEFT:
    case Corner.BOTTOM_RIGHT:
      return true;
    default:
      return false;
  }
}

const isSide = (point) => { // does not count center points
  switch (point) {
    case Side.TOP:
    case Side.LEFT:
    case Side.RIGHT:
    case Side.BOTTOM:
      return true;
    default:
      return false;
  }
}

export const isCreatureObjectCollision = (creature, newPosition, obj) => {

    let creaturePoints = getStartAndEndPoints(creature.id, creature.position, creature.width, creature.height);
    let newCreaturePoints = getStartAndEndPoints(creature.id, newPosition, creature.width, creature.height);

    let creatureCornersStart = getArrayOfCorners(
        {
            position: creature.position,
            width: creature.width,
            height: creature.height
        });

    let creatureCorners = getArrayOfCorners(
        {
            position: newPosition,
            width: creature.width,
            height: creature.height
        });

    let result = false;
    let corners = [];
    let cornerSides = [];

    for (let i = 0; i < creatureCorners.length; i++) {
        let corner = creatureCorners[i];
        let startCorner = creatureCornersStart[i];

        if (
            corner.x >= obj.xStart &&
            corner.x <= obj.xEnd &&
            corner.y >= obj.yStart &&
            corner.y <= obj.yEnd
        ) {
    
            corners.push(startCorner);
            addCornerSidesToArray(corner, cornerSides);
    
            result = true;
        }
    }

    let collisionSide = null;
    if (result === true) {
        let objPositions = {
            xStart: obj.xStart,
            xEnd: obj.xEnd,
            yStart: obj.yStart,
            yEnd: obj.yEnd
    };
    collisionSide = determineCollisionSideByCollidingPoints(creature, creaturePoints, corners, cornerSides, objPositions);
    if (!collisionSide) {
        console.log(`Phantom collision object: ${JSON.stringify(objPositions)}`);
        result = false;
    }
    }
    return {
        isCollision: result,
        collisionSide: collisionSide
    };
}

const getSidesOfCorner = (corner) => {
  let sides = [];
  switch (corner) {
    case Corner.TOP_LEFT:
      sides.push(Side.TOP);
      sides.push(Side.LEFT);
      break;
    case Corner.TOP_RIGHT:
      sides.push(Side.TOP);
      sides.push(Side.RIGHT);
      break;
    case Corner.BOTTOM_LEFT:
      sides.push(Side.BOTTOM);
      sides.push(Side.LEFT);
      break;
    case Corner.BOTTOM_RIGHT:
      sides.push(Side.BOTTOM);
      sides.push(Side.RIGHT);
      break;
  }

  return sides;
}

const getMidCoordsBySide = (points, side) => {
  let halfWidth = points.width / 2;
  let halfHeight = points.height / 2;
  switch(side) {
    case Side.TOP:
      return {
        side: side,
        x: points.xStart + halfWidth,
        y: points.yStart
      }
    case Side.BOTTOM:
      return {
        side: side,
        x: points.xStart + halfWidth,
        y: points.yEnd
      }
    case Side.LEFT:
      return {
        side: side,
        x: points.xStart,
        y: points.yStart + halfHeight
      }
    case Side.RIGHT:
      return {
        side: side,
        x: points.xEnd,
        y: points.yStart + halfHeight
      }
  }
}


// determine which side of an object a creature/other collided with
export const determineCollisionSideByCollidingPoints = (creature, creaturePoints, corners, sides, objPositions) => {


  let initialSide = null;

  // if there is a side in sides, that is going to be the side of interest
  if (sides.length > 0) {
    initialSide = sides[0];
  }

    if (initialSide) {
      return getOppositeSide(initialSide);
    }

    // if there's more than one corner, use that to decide
    if (corners.length > 1) {
        let mostFrequent = getMostFrequentSide(cornerSides);
        let collisionSide = getOppositeSide(mostFrequent)
        return collisionSide;
    }


    // otherwise, use the one corner to determine
    //console.log( `corners: ${corners.length}`);
    let corner = corners[0];
    let position = {x: corner.x, y: corner.y};
    let cornerSides = [];
    cornerSides = addCornerSidesToArray(corner, cornerSides);
    cornerSides.forEach(s => {
      // if a side was not over an axis before the collision but is over after, then that's the side it collided with
      // it will be the opposite of that side of the corner
        let isOverAxisBeforeCollision = isOverAxis(s, objPositions, position);
        if (!isOverAxisBeforeCollision) {
            initialSide = s;
        }
    })
    if (initialSide) {
        return getOppositeSide(initialSide);
    }

    // if there's still no initial side and cornerSides is not empty,
    // that means it might be a tie so - check to see if there is a previous side, as this
    // would likely be the same one - otherwise, just return the opposite of the first side?
    if (cornerSides.length > 0) {
      console.log(`Tie for collision side - choosing side ${cornerSides[0]}`);
      if (creature.movement.previousSide) {
        console.log(`Returning the previous side: ${creature.movement.previousSide}`);
        return creature.movement.previousSide;
      }
      //initialSide = cornerSides[0];
      let closest = getSideClosestToOppositeOnObject(cornerSides, creaturePoints, objPositions);
      console.log(`closest: ${closest}`);
      initialSide = closest;
    }

    if (initialSide) {
      return getOppositeSide(initialSide);
  }

    console.log("No collision side could be determined.");
    return null;
    //throw "No collision side could be determined.";
}

// this will be the opposite of what you will expect - perpendicular
const getSideDirectionOfTarget = (position, targetPosition, side) => {
	switch (side) {
		case Side.TOP:
		case Side.BOTTOM:
			if (targetPosition.x <= position.x) {
				return Direction.WEST;
			} else {
				return Direction.EAST;
			}
		case Side.LEFT:
		case Side.RIGHT:
			if (targetPosition.y <= position.y) {
				return Direction.NORTH;
			} else {
				return Direction.SOUTH;
			}
	}
}

const getCornerSideDirections = (corner) => {
  let xDir = null;
  let yDir = null;
  switch (corner) {
    case Corner.TOP_LEFT:
      xDir = Direction.EAST;
      yDir = Direction.SOUTH;
      break;
    case Corner.TOP_RIGHT:
      xDir = Direction.WEST;
      yDir = Direction.SOUTH;
      break;
    case Corner.BOTTOM_LEFT:
      xDir = Direction.EAST;
      yDir = Direction.NORTH;
      break;
    case Corner.BOTTOM_RIGHT:
      xDir = Direction.WEST;
      yDir = Direction.NORTH;
      break;
  }

  return {xDir: xDir, yDir: yDir};
}

export const getOppositeDirection = (direction) => {
  switch (direction) {
    case Direction.NORTH:
      return Direction.SOUTH;
    case Direction.SOUTH:
      return Direction.NORTH;
    case Direction.WEST:
      return Direction.EAST;
    case Direction.EAST:
      return Direction.WEST;
  }
}

const getOppositeDirectionsOfCornerSides = (corner) => {
  let cornerDirections = getCornerSideDirections(corner);
  let opposite = {
    xDir: getOppositeDirection(cornerDirections.xDir),
    yDir: getOppositeDirection(cornerDirections.yDir)
  };
  return opposite;
}

export const getTargetDirections = (position, targetPosition) => {
  let xDir;
  if (targetPosition.x === position.x) {
    xDir = Direction.NONE;
  } else if (targetPosition.x < position.x) {
    xDir = Direction.WEST;
  } else {
    xDir = Direction.EAST;
  }

  let yDir;
  if (targetPosition.y === position.y) {
    yDir = Direction.NONE;
  } else if (targetPosition.y < position.y) {
    yDir = Direction.NORTH;
  } else {
    yDir = Direction.SOUTH;
  }

  return {xDir: xDir, yDir: yDir};
}

const isTargetOppositeFromCornerSides = (position, targetPosition, corner) => {

}

export const determineDirectionByTarget = (creature, objectSide, obj, canvasInfo, isCorner = false) => {
  
  // if there was a corner involved, determine the direction based on the direction of the target
  if (isCorner) {

    // also make sure it's not opposite of corner sides direction - fix bug TODO

	  let direction = getSideDirectionOfTarget(creature.position, creature.targetPosition, objectSide);
	  return direction;
  }

    // determine the axis of the side - if it's x axis that's top or bottom, y is left or right
  //console.log(`creature: ${creature.gender} ${creature.type} ${creature.id}`);
  let axis = determineAxisBySide(objectSide);

  // attempt to grab travel direction based on target distance from each corner
  let direction = getDirectionByCornerDistancesToTarget(obj, objectSide, axis, creature.targetPosition, creature.position);
  //console.log(`direction by corner distances to target: ${direction}`);

  // if it was null or anything attempt to grab direction from creature directions
  if (!direction) {
    if (axis === Axis.X) {
      direction = creature.movement.direction.x;
    } else if (axis === Axis.Y) {
      direction = creature.movement.direction.y;
    }
    //console.log(`direction by creature direction: ${direction}`);
  }

    // if the direction is still null, choose a direction by the side furthest from the wall
    if (!direction) {
      direction = chooseDirectionByFurthestSideFromWall(axis, obj, canvasInfo);
      //console.log(`direction based on side furthest from wall: ${direction}`);
    }
  
    // if it's still null, just choose a default...
    if (!direction) {
      direction = chooseDirectionByAxisDefault(axis);
      //console.log(`choosing default direction: ${direction}`);
    }
    
    return direction;

}

const getSideClosestToOppositeOnObject = (sides, points, objPoints) => {
  let sideToReturn = null;
  let distanceToAxis = 0;
  sides.forEach(s => {
    let objS = getOppositeSide(s);
    let side = getMidCoordsBySide(points, s);
    let objSide = getMidCoordsBySide(objPoints, objS);

    let distance = 0;

    let coord = null;
    let objCoord = null;
    switch(s) {
      case Side.TOP:
      case Side.BOTTOM:
        coord = side.y;
        objCoord = objSide.y;
        break;
      case Side.LEFT:
      case Side.RIGHT:
        coord = side.x;
        objCoord = objSide.x;
        break;
      default:
        throw "Error in getSideClosestToOppositeOnObject in objectsLogic.";
    }

    distance = Math.abs(coord - objCoord);
    if (sideToReturn === null || distance < distanceToAxis) {
      sideToReturn = s;
      distanceToAxis = distance;
    } else if (sideToReturn !== null && distance === distanceToAxis) {
      console.log(`Tie between side distances.`);
    }
    
  })

  return sideToReturn;
}

const getOppositeSide = (side) => {
    switch (side){
      case Side.TOP:
        return Side.BOTTOM;
      case Side.BOTTOM:
        return Side.TOP;
      case Side.LEFT:
        return Side.RIGHT;
      case Side.RIGHT:
        return Side.LEFT;
      default:
        throw 'No opposite side could be determined in getOppositeSide. (objectsLogic.js)';
    }
  }
  
  const isOverAxis = (side, objPositions, position) => {
    switch (side) {
      case Side.BOTTOM:
        if (position.y >= objPositions.yStart) {
          return true;
        }
        return false;
      case Side.TOP:
        if (position.y <= objPositions.yEnd) {
          return true;
        }
        return false;
      case Side.RIGHT:
        if (position.x >= objPositions.xStart) {
          return true;
        }
        return false;
      case Side.LEFT:
        if (position.x <= objPositions.xEnd) {
          return true;
        }
        return false;
      default:
        throw "cound not determine if side was over the axis."
    }
  }
  
  const getMostFrequentSide = (sides) => {
    let side = null;
    let count = 0;
  
    let possible = [Side.TOP, Side.LEFT, Side.RIGHT, Side.BOTTOM];
    possible.forEach(p => {
      let newCount = 0;
      sides.forEach(s => {
        if (p === s) {
          newCount++;
        }
        if (newCount > count) {
          side = p;
          count = newCount;
        }
      })
    });
    return side;
  }

  const getObjectCornerClosestToPosition = (cornerA, cornerB, position, obj) => {
    let cornerAPos = getObjectCornerPosition(obj, cornerA, 0);
    let cornerBPos = getObjectCornerPosition(obj, cornerB, 0);

    let cornerADifResult = getPositionDifference(position, cornerAPos);
    let cornerADif = {x: Math.abs(cornerADifResult.xDifference), y: Math.abs(cornerADifResult.yDifference)};

    let cornerBDifResult = getPositionDifference(position, cornerBPos);
    let cornerBDif = {x: Math.abs(cornerBDifResult.xDifference), y: Math.abs(cornerBDifResult.yDifference)};

    if (cornerADif.x > cornerBDif.x || cornerADif.y > cornerBDif.y) {
      return cornerA;
    } else if (cornerADif.x < cornerBDif.x || cornerADif.y < cornerBDif.y) {
      return cornerB;
    }

    return null;
  }

  export const getDirectionByCornerDistancesToTarget = (obj, collisionSide, axis, targetPosition, creaturePosition = null) => {
    let cornerA = null;
    let cornerB = null;
    switch (collisionSide) {
      case Side.TOP:
        cornerA = Corner.TOP_LEFT;
        cornerB = Corner.TOP_RIGHT;
        break;
      case Side.BOTTOM:
        cornerA = Corner.BOTTOM_LEFT;
        cornerB = Corner.BOTTOM_RIGHT;
        break;
      case Side.LEFT:
        cornerA = Corner.TOP_LEFT;
        cornerB = Corner.BOTTOM_LEFT;
        break;
      case Side.RIGHT:
        cornerA = Corner.TOP_RIGHT;
        cornerB = Corner.BOTTOM_RIGHT;
        break;
      default:
        throw "no side was passed into getDirectionCornerTargetDifference.";
    }
  
    let cornerAPos = getObjectCornerPosition(obj, cornerA);
    let cornerBPos = getObjectCornerPosition(obj, cornerB);
  
    let cornerADif = getPositionDifferenceFromCorner(axis, cornerAPos, targetPosition);
    let cornerBDif = getPositionDifferenceFromCorner(axis, cornerBPos, targetPosition);
  
    let cornerToMoveToward = null;
    if (cornerADif < cornerBDif) {
      cornerToMoveToward = cornerA;
    } else if (cornerBDif < cornerADif) {
      cornerToMoveToward = cornerB;
    }
    //console.log(`moving to corner: ${cornerToMoveToward}`);

    // if corner to move to is null,
    if (cornerToMoveToward === null && creaturePosition !== null) {
      let otherCorner = getObjectCornerClosestToPosition(cornerA, cornerB, creaturePosition, obj);
      if (otherCorner !== null) {
        cornerToMoveToward = otherCorner === cornerA ? cornerB : cornerA;
      }
    }
  
    // now use the gathered info to find the direction
    return determineDirectionByAxisAndCorner(axis, cornerToMoveToward);
  }

  const getCreatureCornerPosition = (creature, creaturePos, corner) => {

    let creaturePoints = getStartAndEndPoints(creature.id, creaturePos, creature.size, creature.size);
    let x = null;
    let y = null;
    
    switch (corner) {
      case Corner.TOP_LEFT:
        x = creaturePoints.xStart;
        y = creaturePoints.yStart;
        break;
      case Corner.TOP_RIGHT:
        x = creaturePoints.xEnd;
        y = creaturePoints.yStart;
        break;
      case Corner.BOTTOM_LEFT:
        x = creaturePoints.xStart;
        y = creaturePoints.yEnd;
        break;
      case Corner.BOTTOM_RIGHT:
        x = creaturePoints.xEnd;
        y = creaturePoints.yEnd;
        break;
      default:
        throw `Error: No opposite corner could be determined for ${corner}. This should not happen inside this method.` +
      `\n(getOppositeCorner inside objectLogic.js)`;
    }

    return {x: x, y: y};
  }

  const getOppositeCorner = (corner) => {
    switch (corner) {
      case Corner.TOP_LEFT:
        return Corner.BOTTOM_RIGHT;
      case Corner.TOP_RIGHT:
        return Corner.BOTTOM_LEFT;
      case Corner.BOTTOM_LEFT:
        return Corner.TOP_RIGHT;
      case Corner.BOTTOM_RIGHT:
        return Corner.TOP_LEFT;
      default:
        throw `Error: No opposite corner could be determined for ${corner}. This should not happen inside this method.` +
      `\n(getOppositeCorner inside objectLogic.js)`;
    }
  }

  const getPositionDifferenceFromCorner = (axis, cornerPos, position) => {
    let cornerNum;
    let positionNum;
    if (axis === Axis.X) {
      cornerNum = cornerPos.x;
      positionNum = position.x;
    } else {
      cornerNum = cornerPos.y;
      positionNum = position.y;
    }
    return Math.abs(cornerNum - positionNum);
  }

  const getBothPositionDifferencesFromCorner = (cornerPos, position) => {
    let x = Math.abs(cornerPos.x - position.x);
    let y= Math.abs(cornerPos.y - position.y);
    return {xDifference: x, yDifference: y};
  }

  const getCreatureSideAxisPosition = (side, creature, creaturePos) => {
    let creaturePoints = getStartAndEndPoints(creature.id, creaturePos, creature.size, creature.size);

    let axis = null;
    let position = null;
    switch(side) {
      case Side.TOP:
        axis = Axis.Y;
        position = creaturePoints.yStart;
        break;
      case Side.BOTTOM:
        axis = Axis.Y;
        position = creaturePoints.yEnd;
        break;
      case Side.LEFT:
        axis = Axis.X;
        position = creaturePoints.xStart;
        break;
      case Side.RIGHT:
        axis = Axis.X;
        position = creaturePoints.xEnd;
        break;
      default:
        throw `something went wrong inside getCreatureSideAxisPosition. (objectsLogic.js)`;
    }

    return {
      axis: axis,
      position: position
    }
  }

  const getObjectSideAxisPosition = (side, obj, padding = 0) => {
    let axis = null;
    let position = null;
    switch(side) {
      case Side.TOP:
        axis = Axis.Y;
        position = obj.yStart - padding;
        break;
      case Side.BOTTOM:
        axis = Axis.Y;
        position = obj.yEnd + padding;
        break;
      case Side.LEFT:
        axis = Axis.X;
        position = obj.xStart - padding;
        break;
      case Side.RIGHT:
        axis = Axis.X;
        position = obj.xEnd + padding;
        break;
      default:
        throw `something went wrong inside getCreatureSideAxisPosition. (objectsLogic.js)`;
    }

    return {
      axis: axis,
      position: position
    }
  }

  export const getObjectCornerPosition = (obj, corner, padding = 0) => {
    let position = null;
    switch (corner) {
      case Corner.TOP_LEFT:
        position = {
          x: obj.xStart - padding,
          y: obj.yStart - padding
        };
        break;
      case Corner.TOP_RIGHT:
        position = {
          x: obj.xEnd + padding,
          y: obj.yStart - padding
        };
        break;
      case Corner.BOTTOM_LEFT:
        position = {
          x: obj.xStart - padding,
          y: obj.yEnd + padding
        };
        break;
      case Corner.BOTTOM_RIGHT:
        position = {
          x: obj.xEnd + padding,
          y: obj.yEnd + padding
        };
        break;
      default:
        break;
    }
    return position;
  }

  const determineDirectionByAxisAndCorner = (axis, corner) => {
    switch (corner) {
      case Corner.TOP_LEFT:
        if (axis === Axis.X) {
          return Direction.WEST;
        } else if (axis === Axis.Y) {
          return Direction.NORTH;
        }
        break;
      case Corner.TOP_RIGHT:
        if (axis === Axis.X) {
          return Direction.EAST;
        } else if (axis === Axis.Y) {
          return Direction.NORTH;
        }
        break;
      case Corner.BOTTOM_LEFT:
        if (axis === Axis.X) {
          return Direction.WEST;
        } else if (axis === Axis.Y) {
          return Direction.SOUTH;
        }
        break;
      case Corner.BOTTOM_RIGHT:
        if (axis === Axis.X) {
          return Direction.EAST;
        } else if (axis === Axis.Y) {
          return Direction.SOUTH;
        }
        break;
      default:
        console.log(`No direction could be determined because there was no valid corner passed in.`);
        return null;
        break;
    }

  }

  const chooseDirectionByAxisDefault = (axis) => {
    if (axis === Axis.X) {
      return Direction.EAST;
    } else if (axis === Axis.Y) {
      return Direction.SOUTH;
    }
    throw "Error: no valid axis value in chooseDirectionByDefault method.";
  }

  const chooseDirectionByFurthestSideFromWall = (axis, obj, canvasInfo) => {
    let direction = null;
    if (axis === Axis.X) {
      let topPos = obj.yStart;
      let topDif = topPos; // it would be the top minus 0
      let bottomPos = obj.yEnd;
      let bottomDif = canvasInfo.HEIGHT - bottomPos;
      if (topDif < bottomDif) {
        direction = Direction.NORTH;
      } else if (bottomDif < topDif) {
        direction = Direction.SOUTH;
      }
    } else {
      let leftPos = obj.xStart;
      let leftDif = leftPos; // it would be left minus 0
      let rightPos = obj.xEnd;
      let rightDif = canvasInfo.WIDTH - rightPos;
      if (leftDif < rightDif) {
        direction = Direction.WEST;
      } else if (rightDif < leftDif) {
        direction = Direction.EAST;
      }
    }
  
    // if it's still null that means no direction could be determined this way.
    return direction;
  }