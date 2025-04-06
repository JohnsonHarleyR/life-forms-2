import { Corner, Side, RelativeToObject } from "../../constants/objectConstants";
import { getCenterPosition, getStartAndEndPoints, 
    // getRelativeToObjectCondition, 
    fillRelativeFieldForObjectConditionResult } from "../universalLogic";
import { Axis, CanvasInfo } from "../../constants/canvasConstants";
import { getNecessaryCollisionPadding } from "../creature/creatureLogic";

export default class NewObject {
    constructor(id, type, color, xStart, yStart, width, height) {
        this.id = id;
        this.type = type;
        this.color = color;
        this.width = width;
        this.height = height;
        this.xStart = xStart;
        this.xEnd = xStart + width;
        this.yStart = yStart;
        this.yEnd = yStart + height;
        this.position = getCenterPosition(xStart, yStart, width, height);
    }

    isCreatureInsideObject = (creature, creaturePosition = creature.position, padding = getNecessaryCollisionPadding()) => {
        let cPoints = getStartAndEndPoints(creature, creaturePosition, creature.width, creature.height);
        if (cPoints.xStart > this.xStart - padding && cPoints.xEnd < this.xEnd + padding &&
            cPoints.yStart > this.yStart - padding && cPoints.yEnd < this.yEnd + padding) {
                return true;
            }
        return false;
    }

    doesNewPositionCollideWithObject = (creature, newCreaturePosition, padding = 0) => {
        let isCollision = false;   
        let positionChecked = newCreaturePosition;     
        let objectChecked = this;
        let relativePlacement = null; // relative placement to object before collision (if collision)
        let placementBools = null;

        let newCreaturePoints = getStartAndEndPoints(creature.id, newCreaturePosition, creature.size, creature.size);
        let newPositionResult = this.getRelativeToObjectCondition(newCreaturePoints, padding);
        let newPositionCondition = newPositionResult.condition;

        if (newPositionCondition === RelativeToObject.OVERLAP) {
            isCollision = true;

            // let oldCreaturePoints = getStartAndEndPoints(creature.id, creature.position, creature.size, creature.size);
            // let placementResult = this.getRelativeToObjectCondition(oldCreaturePoints, padding);
            // relativePlacement = placementResult.condition;
            // placementBools = placementResult.bools;
        }

        let oldCreaturePoints = getStartAndEndPoints(creature.id, creature.position, creature.size, creature.size);
        let placementResult = this.getRelativeToObjectCondition(oldCreaturePoints, padding);
        relativePlacement = placementResult.condition;
        placementBools = placementResult.bools;
        
        return {
            isCollision: isCollision,
            positionChecked: positionChecked,
            objectChecked: objectChecked,
            relativePlacement: relativePlacement,
            placementBools: placementBools
        }
    }

    getRelativeToObjectCondition = (creaturePoints, padding = 0) => {
        //let creaturePoints = getStartAndEndPoints(creature.id, creaturePosition, creature.size, creature.size);
        let result = {
            condition: null,
            isAwayFromLeft: null,
            isAwayFromRight: null,
            isAwayFromTop: null,
            isAwayFromBottom: null
        }
        let resultsToFill = [
            {
                side: Side.LEFT,
                fieldString: "isAwayFromLeft"
            }, 
            {
                side: Side.RIGHT,
                fieldString: "isAwayFromRight"
            }, 
            {
                side: Side.TOP,
                fieldString: "isAwayFromTop"
            }, 
            {
                side: Side.BOTTOM,
                fieldString: "isAwayFromBottom"
            },
            {
                side: null,
                fieldString: "condition"
            }, 
        ];

        resultsToFill.forEach(rf => {
            let resultValue = null;
            if (rf.side !== null) {
                resultValue = this.isAwayFromSide(creaturePoints, rf.side, padding);
            };
            let newResult = fillRelativeFieldForObjectConditionResult(rf.fieldString, resultValue, result);
            result = newResult;
        });

        let bools = {
            isAwayFromLeft: result.isAwayFromLeft,
            isAwayFromRight: result.isAwayFromRight,
            isAwayFromTop: result.isAwayFromTop,
            isAwayFromBottom: result.isAwayFromBottom
        }

        let finalResult = {
            condition: result.condition,
            bools: bools
        };
        return finalResult;
    }

    isAwayFromSide = (creaturePoints, side, padding) => {
        let creaturePoint = null;
        let objPoint = null;
        let lessOrGreater = null;

        switch (side) {
            case Side.LEFT:
                creaturePoint = creaturePoints.xEnd;
                objPoint = this.xStart - padding;
                lessOrGreater = "less";
                break;
            case Side.RIGHT:
                creaturePoint = creaturePoints.xStart;
                objPoint = this.xEnd + padding;
                lessOrGreater = "greater";
                break;
            case Side.TOP:
                creaturePoint = creaturePoints.yEnd;
                objPoint = this.yStart - padding;
                lessOrGreater = "less";
                break;
            case Side.BOTTOM:
                creaturePoint = creaturePoints.yStart;
                objPoint = this.yEnd + padding;
                lessOrGreater = "greater";
                break;
        }

        let result = null;
        if (lessOrGreater === "less") {
            result = creaturePoint < objPoint;
        } else if (lessOrGreater === "greater") {
            result = creaturePoint > objPoint;
        }

        if (result !== null) {
            return result;
        }
        throw `isAwayFromSide could not be determined inside of class for object ${this.id} in position ${JSON.stringify(this.position)}`;
    }
}