import { LifeStage, ActionType, NeedType } from "../../../constants/creatureConstants";
import { Direction, CreatureDefaults } from "../../../constants/creatureConstants";
import { 
  determineSightCoordinates,
  getRandomShelterPosition,
  determineSightDirection,
  getPositionInNewDirection,
  canSetShelterInPosition,
  searchAreaForMate,
  addMovementRecord,
  checkForMovementPattern,
  isCreatureInRangeOfTargetPosition,
  prepareForDeath
} from "../creatureLogic";
import { MoveMode } from "../../../constants/creatureConstants";
import { CanvasInfo } from "../../../constants/canvasConstants";
import { RelativeToObject } from "../../../constants/objectConstants";
import { 
  isInPosition,
  getPositionDifference,
  getTriangleMovePosition,
  getStartAndEndPoints,
  getRandomPositionInBounds,
  getRandomCreatureTargetPosition, 
  getCreatureIdentityString
} from "../../universalLogic";
import {
  checkIfCreatureCollidesWithAnyObjects,
  isValidTargetPosition
} from "../../object/objectsLogic";
import Shelter from "./shelter";
import { 
  makeCreatureDie,
  makeCreatureSleep,
  creatureHasFoodInInventory,
  creatureHasFoodInShelter,
  eatFoodFromInventory,
  eatFoodFromShelter,
  findFoodTargetInArea,
  putTargetInFoodInventory,
  addFoodToShelter,
  arePositionsTheSame,
  modifyFoodTargetIfStuck
} from "./logic/actionLogic";
import { 
  isFoodInInventoryEnoughForFamily,
  isFoodInShelterEnoughForFamily,
  isCombinedFoodEnoughToMate,
  hasHungryChildren
 } from "./logic/needLogic";
import { canChasePrey, isPrey } from "./logic/safetyLogic";

export default class CreatureMovement {
    constructor(creature, sightRadius, sightDistance, speed) {
        this.creature = creature;
        this.sightRadius = sightRadius;
        this.sightDistance = sightDistance;
        this.speed = speed;
        this.direction = {
            x: null,
            y: null
        };
        this.moveMode = MoveMode.THINK;

        this.sideOfCollision = null;
        this.previousSide = null;
        this.newDirection = null;
        this.previousDirection = null;

        this.previousPlacement = null;

        this.movementRecords = [];

        this.intervalCount = 0;
        this.hasMoved = false;

        this.foodIntervals = 0;
        this.foodTargetPos = {x: -1, y: -1};
    }

    updateMovement = (objects, plants, creatures, shelters, CanvasInfo) => {

        if (this.creature.needs.startNewAction === true) {
          this.creature.needs.startNewAction = false;
          //console.log(`Creature ${this.creature.id} about to think`);
                this.moveMode = MoveMode.THINK;
                this.resetMovementProperties(); // keey?
        }

        // if creature is thinking, determine move mode based on priority
        let targetPos = null;
        if (this.moveMode === MoveMode.THINK) {
          //console.log(`Creature ${this.creature.id} thinking`);
            this.determineModeByPriority(creatures);
            targetPos = this.getInitialTargetPosition(objects, creatures, plants, shelters);
            //this.creature.targetPosition = this.getInitialTargetPosition(objects, creatures, plants, shelters);
        }

        // now move
        this.move(objects, plants, creatures, shelters, CanvasInfo, targetPos);
        this.hasMoved = true;

        // now check if creature is in shelter again - update their safety
        this.creature.safety.updateSafety(creatures);
        
    }

    resetMovementProperties = () => {
        this.direction = {
            x: null,
            y: null
        };
        this.sideOfCollision = null;
        //this.previousSide = null;
        this.newDirection = null;
        //this.previousDirection = null;
        this.intervalCount = 0;

        this.foodIntervals = 0;
        this.foodTargetPos = this.creature.position;
    }

    changeTarget = (newTarget) => {
      this.creature.currentTarget = newTarget;

      let newTargetPosition = newTarget !== null ? newTarget.position : null;
      this.changeTargetPosition(newTargetPosition);
    }

    changeTargetPosition = (newTargetPosition) => {
      if (newTargetPosition !== null) {
        this.creature.targetPosition = newTargetPosition;
      }
      //this.resetMovementProperties();
    }

    testWithMovementPatterns = () => {
      this.recordMovement();
      return this.detectPattern(); 
    }

    recordMovement = () => {
      let newRecord = {
        position: {...this.creature.position},
        direction: {...this.direction},
        sideOfCollision: this.sideOfCollision,
        targetPosition: {...this.creature.targetPosition}
      };
      this.movementRecords = addMovementRecord(this.movementRecords, newRecord);
    }

    detectPattern = () => {
      let result = checkForMovementPattern(this.movementRecords);
      if (result && result.pattern.length >= CreatureDefaults.PATTERN_DETECTION_SIZE) {
        console.log(`Movement pattern detected for ${this.creature.type} ${this.creature.id} - action: ${this.creature.needs.priority}`);
        //displayPatternResult(result);
        return true;
      }
      return false;
    }

    escapeCorner = (creatures, objects, shelters) => {
      this.resetMovementProperties();
      this.movementRecords = [];
      //this.creature.currentTarget = null;
      //this.creature.targetPosition = this.creature.position;
      //console.log(`Creature ${getCreatureIdentityString(this.creature)} is escaping corner...`);
      this.creature.position = this.creature.targetPosition;
      return this.moveToRandomPosition(objects, creatures, shelters, CanvasInfo);
    }

    determineModeByPriority = (creatures) => {
      switch(this.creature.needs.priority) {
          default:
          case ActionType.NONE:
              //this.searchNeed = NeedType.NONE;
              this.creature.targetType = NeedType.NONE;
              //this.resetMovementProperties();
              this.moveMode = MoveMode.STAND_STILL;
              break;
          case ActionType.FIND_SAFETY:
            if (this.creature.safety.shelter !== null) {
              this.creature.targetType = NeedType.ESCAPE;
              this.moveMode = MoveMode.GO_TO_SHELTER;
              //console.log(`Creature ${getCreatureIdentityString(this.creature)} escaping to shelter`);
            } else {
              this.creature.targetType = NeedType.SHELTER;
              this.moveMode = MoveMode.SEARCH;
              //console.log(`Creature ${getCreatureIdentityString(this.creature)} escaping - creating shelter first`);
            }
            break;
          case ActionType.DIE:
            this.creature.targetType = NeedType.NONE;
            this.moveMode = MoveMode.STAND_STILL;
            prepareForDeath(this.creature);
            break;
          case ActionType.BE_DEAD:
            this.creature.targetType = NeedType.NONE;
            this.moveMode = MoveMode.STAND_STILL;
            break;
          case ActionType.LEAVE_WORLD:
            this.creature.targetType = NeedType.NONE;
            this.creature.hasLeftWorld = true;
            break;
          case ActionType.SLEEP_IN_SPOT:
            this.creature.targetType = NeedType.SLEEP;
            this.moveMode = MoveMode.STAND_STILL;
            break;
          case ActionType.SLEEP_IN_SHELTER:
            this.creature.targetType = NeedType.SLEEP;
            if (!this.creature.needs.isSleeping) {
              this.moveMode = MoveMode.GO_TO_SHELTER;
            } else {
              this.moveMode = MoveMode.STAND_STILL;
            }
            break;
          case ActionType.CREATE_SHELTER:
            this.creature.targetType = NeedType.SHELTER;
            this.moveMode = MoveMode.SEARCH;
              // if the creature's shelter is not null anymore,
              // set their priority to complete
              // if (this.creature.safety.shelter !== null) {
              //     this.creature.needs.priorityComplete = true;
              //     //this.resetMovementProperties();
              //     this.moveMode = MoveMode.STAND_STILL;
              // } else {
              //     this.creature.targetType = NeedType.SHELTER;
              //     this.moveMode = MoveMode.SEARCH;
              // }
              break;
          case ActionType.FIND_MATE:
            this.creature.targetType = NeedType.MATE;
            this.moveMode = MoveMode.SEARCH;
            break;
          case ActionType.FEED_SELF:
            //console.log(`creature ${this.creature.id} determineModeByPriority: FEED_SELF`);
              this.creature.targetType = NeedType.FOOD_FOR_SELF;
              this.moveMode = MoveMode.SEARCH;
              break;
          case ActionType.FEED_FAMILY:
            // console.log(`creature ${this.creature.id} determineModeByPriority: FEED_FAMILY` + 
            //   `\nFamily food percent: ${this.creature.needs.familyFoodPercent}\n goal: ${this.creature.needs.foodPercentGoal}` + 
            //   `\nCreature food percent: ${this.creature.needs.foodLevel.percent}`);
              this.creature.targetType = NeedType.FOOD_FOR_FAMILY;
              this.moveMode = MoveMode.SEARCH;
              break;
          case ActionType.GATHER_FOOD_TO_MATE:
            //console.log(`creature ${this.creature.id} determineModeByPriority: GATHER_FOOD_TO_MATE`);
            this.creature.targetType = NeedType.FOOD_TO_MATE;
            this.moveMode = MoveMode.SEARCH;
            break;
          case ActionType.MATE:
            if (this.creature.family.mate && !this.creature.family.mate.mating.isMating) {
                this.creature.family.mate.mating.isMating = true;
              }
            if (this.creature.safety.shelter) {
              this.creature.mating.ensureMatesHaveSameShelter(creatures);
              console.log(`MATING: creature ${getCreatureIdentityString(this.creature)} has shelter ${this.creature.safety.shelter.id}; ` +
              `mate: ${this.creature.family.mate !== null ? getCreatureIdentityString(this.creature.family.mate) : null}, ` + 
              `mate has shelter ${this.creature.family.mate !== null && this.creature.family.mate.safety.shelter !== null ? this.creature.family.mate.safety.shelter.id : null}`);
              this.creature.targetType = NeedType.MATE;
              let centerPosition = this.creature.safety.shelter.getCenterPosition();
              if (isInPosition(this.creature.position, centerPosition) && 
              isInPosition(this.creature.family.mate.position, centerPosition) && this.doPause(10)) {
                this.moveMode = MoveMode.COMPLETE_MATING;
              } else {
                this.moveMode = MoveMode.GO_TO_SHELTER;
              }
            } else {
              console.log(`error: creature ${this.creature.id} has no shelter`);
            }

            break;
          case ActionType.HAVE_CHILD:
            //console.log(`creature ${this.creature.id} HAVE_CHILD`);
            this.moveMode = MoveMode.STAND_STILL;
            break;
          case ActionType.LEAVE_SHELTER:
            this.creature.targetType = NeedType.SHELTER;
            this.moveMode = MoveMode.WANDER;

      }
  }

  

  getInitialTargetPosition = (objects, creatures, plants, shelters) => {
    switch(this.creature.needs.priority) {
        default:
        case ActionType.NONE:
            return this.creature.targetPosition; // temp
        case ActionType.DIE:
        case ActionType.SLEEP_IN_SPOT:
          return this.creature.position;
        case ActionType.SLEEP_IN_SHELTER:
          //console.log('getting random sleep position');
          return this.getRandomPositionInsideShelter();
        case ActionType.LEAVE_SHELTER:
          return getRandomCreatureTargetPosition(this.creature, objects, shelters);
          //return getRandomStartPosition(this.creature, creatures, objects, plants, shelters);
        case ActionType.CREATE_SHELTER:
            return getRandomShelterPosition(this.creature, creatures, objects, shelters);
        case ActionType.FEED_SELF:
        case ActionType.FEED_FAMILY:
        case ActionType.GATHER_FOOD_TO_MATE:
          //return this.creature.targetPosition;
            return this.creature.position; // temp
        case ActionType.MATE:
          if (this.creature.safety.shelter !== null) {
            return this.creature.safety.shelter.getCenterPosition();
          } else {
            return this.creature.position;
          }
        case ActionType.FIND_SAFETY:
          if (this.creature.safety.shelter !== null) {
            return this.creature.safety.shelter.getCenterPosition();
          } else {
            return getRandomShelterPosition(this.creature, creatures, objects, shelters);
          }

    }
  }

  doPause = (maxIntervals) => {
    if (this.intervalCount >= maxIntervals) {
      this.intervalCount = 0;
      return false;
    }
    this.intervalCount++;
    return true;
  }

  standStill = (creatures) => {
    //console.log(`creature ${this.creature.id} is standing still`);
    // do actions depending on action type
    switch (this.creature.needs.priority) {
      default:
        break;
      case ActionType.DIE:
        makeCreatureDie(this.creature);
        break;
      case ActionType.SLEEP_IN_SPOT:
        makeCreatureSleep(this.creature);
        break;
      case ActionType.HAVE_CHILD:
        //console.log(`having child`);
        this.creature.mating.haveChild(creatures);
        break;
    }

    return this.creature.position;
  }

    move = (objects, plants, creatures, shelters, canvasInfo, targetPosition = null) => {
        //console.log(`${this.creature.id} start: ${JSON.stringify(this.creature.position)}`);
        //console.log(`move: Creature ${getCreatureIdentityString(this.creature)} - action: ${this.creature.needs.priority}, ${this.moveMode} ${this.creature.targetType}`);
        
        //console.log('moving creature');
        // if the creature is dead, don't move at all.
        if (this.creature.life.lifeStage === LifeStage.DECEASED || 
            this.moveMode === MoveMode.NONE) {
            return;
        }

        // setting a target position is not required but there is an option
        if (targetPosition !== null) {
            this.changeTargetPosition(targetPosition);
        }
        let endPosition = this.creature.targetPosition;
        let newPosition = this.position;

        switch (this.moveMode) {
            default:
            case MoveMode.STAND_STILL:
              //console.log('STAND_STILL');
              newPosition = this.standStill(creatures);
              break;
            case MoveMode.TOWARD_POINT:
              newPosition = this.moveToPoint(endPosition, objects, creatures, shelters);
              break;
            case MoveMode.WANDER:
              //console.log('wandering');
              newPosition = this.moveToRandomPosition(objects, canvasInfo);
              break;
            case MoveMode.SEARCH:
              // first wander
              // then look at the result to see
              newPosition = this.searchForTarget(plants, creatures, objects, shelters, canvasInfo);
              break;
            case MoveMode.GO_TO_SHELTER:
              //console.log(`MoveMode.GO_TO_SHELTER: Creature ${getCreatureIdentityString(this.creature)} going to shelter - ${this.moveMode} ${this.creature.targetType}`);
              newPosition = this.goToShelter(plants, creatures, objects, shelters, canvasInfo);
              //newPosition = this.moveToPoint(endPosition, objects, creatures, shelters);
              if (this.creature.targetType === NeedType.MATE && newPosition.x === endPosition.x && newPosition.y === endPosition.y && 
                this.creature.family.mate && isInPosition(this.creature.family.mate.position, endPosition)) {
                this.moveMode = MoveMode.THINK;
              }
              break;
            case MoveMode.COMPLETE_MATING:
              console.log('COMPLETE_MATING');
              this.creature.mating.produceOffspring();
              newPosition = this.creature.position;
              break;
          }

        this.creature.position = newPosition;

        //console.log(`${this.creature.id} end: ${JSON.stringify(newPosition)}`);
    }

    moveToPoint = (endPosition, objects, creatures, shelters, canvasInfo, allowCloseToObject = false) => {
      // let isPattern = this.testWithMovementPatterns();

      // if (isPattern 
      //   && 
      //   (this.creature.needs.priority === ActionType.FEED_FAMILY || 
      //     this.creature.needs.priority === ActionType.FEED_SELF)
      //     ) {
      //   console.log(`creature ${getCreatureIdentityString(this.creature)} is escaping corner to ${this.creature.needs.priority}`);
      //   this.escapeCorner(creatures, objects, shelters);
      // }

      // if (isPattern) {
      //   this.resetMovementProperties();
      //   // move creature to nearby position
      //   this.changeTargetPosition(this.creature.position);
      //   endPosition = this.creature.position;
      //   this.previousDirection = this.direction !== null ? {...this.direction} : null;
      //   this.previousSide = null;
      // }
      // else
      // {
      //   this.previousDirection = this.direction !== null ? {...this.direction} : null;
      //   this.previousSide = this.sideOfCollision;
      // }
      //this.previousDirection = this.direction !== null ? {...this.direction} : null;
      this.previousDirection = this.newDirection !== null ? this.newDirection : null;
      this.previousSide = this.sideOfCollision;


      let newPosition = this.creature.position;
      

      let result = this.moveTowardPosition(endPosition, objects, canvasInfo);
      if (result.success || isInPosition(result.forPosition, this.creature.targetPosition)) {
        this.sideOfCollision = null;
        //console.log(`no collision for ${this.creature.type} ${this.creature.id}`);
          newPosition = result.forPosition;
          //this.finishedFirstDirection = false;
          // // reset avoid object variables if they need to be reset
          if (this.newDirection) {
            //console.log(`Going in new direction around object`);
            this.newDirection = null;
            this.previousSide = null;
          }
    
        } else {
          //console.log(`object collision at point ${JSON.stringify(result.forPosition)} for ${this.creature.type} ${this.creature.id}. Moving around object.`);
          this.objectCollided = result.objectCollided;
          newPosition = this.moveAroundObject(
            result.objectCollided,
            result.collisionSide,
            result.directionToMove,
            result.isCornerCollision,
            canvasInfo
          );
        }

      return newPosition;
    }

    moveTowardPosition = (endPosition, objects) => {
      // do a target position check - change target position if not

      let newPosition = { x: this.creature.position.x, y: this.creature.position.y };

      let dif = getPositionDifference(this.creature.position, endPosition);
      this.setDirection(dif.xDifference, dif.yDifference);
      //console.log(`Direction for ${this.creature.gender} ${this.creature.type} ${this.creature.id}: {x: ${this.direction.x}, y: ${this.direction.y}}` + 
        //`${JSON.stringify(this.creature.position)}`);
  
      // if a direction is null, that means it's not going in any direction
      // so set the new position to be the same as the end position
      if (this.direction.x === null) {
        newPosition.x = endPosition.x;
      }
  
      if (this.direction.y === null) {
        newPosition.y = endPosition.y;
      }
  
      // if neither direction is null, that means it's moving
      // in a diagonal
      if (this.direction.x !== null && this.direction.y !== null) {
        let triangeResult = getTriangleMovePosition(
          this.creature.position,
          Math.abs(dif.xDifference),
          this.direction.x,
          Math.abs(dif.yDifference),
          this.direction.y,
          this.speed
        );
        newPosition = triangeResult;
        // if x direction is null but not y, or vice versa, that means
        // it is moving in a line, not diagonal, so move accordingly
      } else if (this.direction.x === null) {
        newPosition.x = endPosition.x;
        let newY;
        if (this.direction.y === Direction.SOUTH) {
          newY = this.creature.position.y + this.speed;
          // if it's going to go past the end point,
          // set it to the end point
          if (newY > endPosition.y) {
            newY = endPosition.y;
          }
        } else {
          newY = this.creature.position.y - this.speed;
          // if it's going to go past the end point,
          // set it to the end point
          if (newY < endPosition.y) {
            newY = endPosition.y;
          }
        }
        newPosition.y = newY;
        // this will be similar logic as above, except for the
        // y directions instead of x
      } else if (this.direction.y === null) {
        newPosition.y = endPosition.y;
        let newX;
        if (this.direction.x === Direction.EAST) {
          newX = this.creature.position.x + this.speed;
          if (newX > endPosition.x) {
            newX = endPosition.x;
          }
        } else {
          newX = this.creature.position.x - this.speed;
          if (newX < endPosition.X) {
            newX = endPosition.x;
          }
        }
        newPosition.x = newX;
      }

      let attemptResult = this.attemptMoveTowardPosition(newPosition, dif, objects);
      this.previousPlacement = attemptResult.prevPlacement !== RelativeToObject.OVERLAP ? attemptResult.prevPlacement : this.previousPlacement;
      // make attempts toward the position - check collision with each interval
      // let changeIntervals = getPositionChangeIntervals(this.creature.position, newPosition);

      // let attemptResult = null;
      // let index = 0;
      // do {
      //   attemptResult = this.attemptMoveTowardPosition(changeIntervals[index], dif, objects);
      //   index++;
      // } while (attemptResult.success && index < changeIntervals.length);

      //attemptResult.forPosition = newPosition;

      return attemptResult;
    }

    attemptMoveTowardPosition = (newPosition, dif, objects) => {
    
        // TODO write logic in case creature cannot move diagonally
        // and can only move up or down, left or right
        //let collisionResult = checkAllCreatureObjectCollisions(this.creature, newPosition, objects);
        let collisionResult = checkIfCreatureCollidesWithAnyObjects(this.creature, newPosition, objects);
    
        //TODO write logic to also avoid going over other creature's shelters - move around them

        //console.log(newPosition);
        //return newPosition;
        return {
          success: !collisionResult.didCollide,
          forPosition: newPosition,
          difference: dif,
          objectCollided: collisionResult.objectCollided,
          collisionSide: collisionResult.collisionSide,
          directionToMove: collisionResult.directionToMove,
          prevPlacement: collisionResult.prevPlacement,
          isCornerCollision: collisionResult.isCornerCollision
        };
    }

    moveAroundObject = (obj, collisionSide, directionToMove, isCornerCollision, canvasInfo) => {
      // test
      // if (this.creature.needs.didPriorityChange()) {
      //   console.log(`moveAroundObject - priority change check`);
      // }

      if (isCreatureInRangeOfTargetPosition(this.creature)) {
        this.resetMovementProperties();
        return this.creature.targetPosition;
      }


      //console.log(`Collision side: ${collisionSide}`);
      this.sideOfCollision = collisionSide;
      // NOTE: the below if block could be a potential problem area?
      // if (this.newDirection === null || this.previousSide !== collisionSide) {
      //   //this.newDirection = determineDirectionByTarget(this.creature, this.sideOfCollision, obj, canvasInfo);
      //   this.newDirection = directionToMove;
      //   //console.log(`new direction: ${this.newDirection}`);
      // }
      this.previousDirection = this.newDirection;
      this.newDirection = directionToMove;
      this.previousSide = collisionSide;

      // now determine the new position based on the new direction
      let newPosition = getPositionInNewDirection(this.creature, this.newDirection, obj, collisionSide, isCornerCollision, 1);

      return newPosition;
    }

    setDirectionToNewDirection = () => {
      switch (this.newDirection) {
        case Direction.WEST:
        case Direction.EAST:
          this.direction.x = this.newDirection;
          this.direction.y = null;
          break;
        case Direction.NORTH:
        case Direction.SOUTH:
          this.direction.y = this.newDirection;
          this.direction.x = null;
          break;
        default:
          break;
      }
    }


    setDirection = (xDifference, yDifference) => {
      //this.previousDirection = {...this.direction};

        this.direction.x = xDifference > 0 ? Direction.EAST : Direction.WEST;
        this.direction.x = xDifference === 0 ? null : this.direction.x;
        if (Math.abs(xDifference) <= this.speed) {
            this.direction.x = null;
        }
        this.direction.y = yDifference > 0 ? Direction.SOUTH : Direction.NORTH;
        this.direction.y = yDifference === 0 ? null : this.direction.y;
        if (Math.abs(yDifference) <= this.speed) {
            this.direction.y = null;
        }
    };

    searchForTarget = (plants, creatures, objects, shelters, canvasInfo) => {

        // FIRST see if there are other things needed to be searched for besides food
        // A shelter should be the first thing to find!
        if (this.creature.targetType === NeedType.SHELTER) {
            
            
        } else if (this.creature.targetType === NeedType.FOOD_FOR_SELF) {
        }
    
        let newPosition = this.creature.position;
    
    
        if (this.creature.targetType === NeedType.SHELTER) {
            newPosition = this.searchForShelter(plants, creatures, objects, shelters, canvasInfo);
        // searching for a mate
        } else if (this.creature.targetType === NeedType.MATE) {
          newPosition = this.searchForMate(plants, creatures, objects, shelters, canvasInfo);
        } else if (this.creature.targetType === NeedType.FOOD_FOR_SELF) {
          //console.log(`creature ${this.creature.id} searchForTarget: searchForFoodForSelf`);
          newPosition = this.searchForFoodForSelf(plants, creatures, objects, shelters, canvasInfo);
        } else if (this.creature.targetType === NeedType.FOOD_FOR_FAMILY) {
          //console.log(`creature ${this.creature.id} searchForTarget: searchForFoodForFamily`);
          newPosition = this.searchForFoodForFamily(plants, creatures, objects, shelters, canvasInfo);
        } else if (this.creature.targetType === NeedType.FOOD_TO_MATE) {
          //console.log(`creature ${this.creature.id} searchForTarget: searchForFoodForFamily`);
          newPosition = this.searchForFoodToMate(plants, creatures, objects, shelters, canvasInfo);
        }
    
    
        
    
        return newPosition;
      }

      wanderAroundShelter = (objects, creatures, shelters, canvasInfo) => { // TODO improve method to actually work lol
        if (isInPosition(this.creature.position, this.creature.targetPosition)) {
          this.changeTargetPosition(this.getRandomPositionInsideShelter());
          //this.creature.targetPosition = this.getRandomPositionInsideShelter();
        }
       return this.moveToPoint(this.creature.targetPosition, objects, creatures, shelters, canvasInfo);
      }

    searchForFoodForSelf = (plants, creatures, objects, shelters, canvasInfo) => {
      // check first if creature is a child - if they are then do different steps
      if (this.creature.lifeStage === LifeStage.CHILD && !this.creature.needs.isTechnicalAdult) {
        this.foodIntervals = 0;
        // if there's food, go eat the food
        if (creatureHasFoodInShelter(this.creature)) {
          if (!arePositionsTheSame(this.creature.targetPosition, this.creature.safety.shelter.getCenterPosition())) {
            this.changeTargetPosition(this.getShelterCornerPosition());
          }
          
          //this.creature.targetPosition = this.getShelterCornerPosition();
          // if the creature is in the shelter corner, eat food
          if (isInPosition(this.creature.position, this.creature.targetPosition)) {
            eatFoodFromShelter(this.creature);
            this.creature.currentTarget = this.changeTarget(null);
            return this.creature.position;
          } // if not in the corner, move toward the corner
           else {
            return this.moveToPoint(this.creature.targetPosition, objects, creatures, shelters, canvasInfo);
          }

        } // if they don't have food in the shelter, move to random position waiting for food
        else
        {
          console.log('wandering around shelter');
          return this.wanderAroundShelter(objects, creatures, shelters, canvasInfo);
        }
      }

      // first determine if creature has food in shelter or personal inventory
      if (creatureHasFoodInShelter(this.creature) && !hasHungryChildren(this.creature)) {
        this.foodIntervals = 0;
        //console.log(`creature ${this.creature.type} ${this.creature.id} has food in shelter`);
        if (this.creature.safety.shelter.isInsideShelter(this.creature)) { // if inside shelter, eat from shelter inventory
          //console.log(`creature ${this.creature.id} is inside shelter`);
          eatFoodFromShelter(this.creature);
          this.creature.currentTarget = null;
          return this.creature.position;
        } else { // otherwise move to the creature's shelter to eat
          if (!arePositionsTheSame(this.creature.targetPosition, this.creature.safety.shelter.getCenterPosition())) {
            this.changeTargetPosition(this.getShelterCornerPosition());
          }
          let result = this.moveToPoint(this.creature.targetPosition, objects, creatures, shelters, canvasInfo);
          //console.log(`creature ${this.creature.id} is moving to shelter with result: ${JSON.stringify(result)}`);
          return result;
        }

      } else if (creatureHasFoodInInventory(this.creature)) {
        this.foodIntervals = 0;
        //console.log(`creature ${this.creature.type} ${this.creature.id} has food in inventory`);
        eatFoodFromInventory(this.creature);
        this.creature.currentTarget = null;
        return this.creature.position;
        
      } else if (this.creature.life.lifeStage === LifeStage.CHILD && !this.creature.needs.isTechnicalAdult) { // if child there's not much else to do but be hungry
        this.foodIntervals = 0;
        //console.log(`creature ${this.creature.id} is child`);
        return this.creature.position; // TODO change to moving to random position in shelter

      } else { // otherwise search for food!
        //console.log(`creature ${this.creature.id} needs to search elsewhere for food`);
        return this.searchForFoodTarget(plants, creatures, objects, shelters, canvasInfo);
      }
    }

    searchForFoodForFamily = (plants, creatures, objects, shelters, canvasInfo) => {
      //console.log(`${this.creature.gender} ${this.creature.type} ${this.creature.id} is finding food for their family`);
      // if shelter and if the amount of food in the shelter inventory is greater than the amount to gather at once, let the creature get food for themselves
      if (this.creature.safety.shelter && isFoodInShelterEnoughForFamily(this.creature)) {
        //console.log(`creature has shelter and the shelter has enough food - searching for food for self`);
        return this.searchForFoodForSelf(plants, creatures, objects, shelters, canvasInfo);
      } // otherwise, if shelter and if the amount of food in their own inventory is greater than or equal to the amount to gather at once, take that food to shelter inventory
      else if (this.creature.safety.shelter && isFoodInInventoryEnoughForFamily(this.creature, 0.3)) {
        this.foodIntervals = 0;
        // see if creature is inside shelter - if they are, put creature food into shelter inventory
        //console.log(`creature has shelter and is taking inventory food to shelter`);
        if (this.creature.safety.shelter.isInsideShelter(this.creature)) {
          addFoodToShelter(this.creature);
          return this.creature.position;

        }  // if they are not, head for the shelter!
        else {
          //console.log(`creature is moving to shelter`);
          if (!arePositionsTheSame(this.creature.targetPosition, this.creature.safety.shelter.getCenterPosition())) {
            this.changeTargetPosition(this.creature.safety.shelter.getCenterPosition());
          }
          //this.creature.targetPosition = this.creature.safety.shelter.getCenterPosition();
          return this.moveToPoint(this.creature.safety.shelter.getCenterPosition(), objects, creatures, shelters, canvasInfo);
        }


      } // otherwise, search for food
      else {
        //console.log(`creature is going to search for food`);
        return this.searchForFoodTarget(plants, creatures, objects, shelters, canvasInfo);
      }

      
    }

    searchForFoodToMate = (plants, creatures, objects, shelters, canvasInfo) => {
      //console.log(`${this.creature.gender} ${this.creature.type} ${this.creature.id} is finding food for their family`);
      // if shelter and if the amount of food in the shelter inventory is greater than the amount to gather at once, let the creature get food for themselves
      if (this.creature.safety.shelter && isCombinedFoodEnoughToMate(this.creature)) {
        this.foodIntervals = 0;
        // see if creature is inside shelter - if they are, put creature food into shelter inventory
        //console.log(`creature has shelter and is taking inventory food to shelter`);
        if (this.creature.safety.shelter.isInsideShelter(this.creature)) {
          addFoodToShelter(this.creature);
          return this.creature.position;

        }  // if they are not, head for the shelter!
        else {
          //console.log(`creature is moving to shelter`);
          if (!arePositionsTheSame(this.creature.targetPosition, this.creature.safety.shelter.getCenterPosition())) {
            this.changeTargetPosition(this.creature.safety.shelter.getCenterPosition());
          }
          //this.changeTargetPosition(this.creature.safety.shelter.getCenterPosition());
          //this.creature.targetPosition = this.creature.safety.shelter.getCenterPosition();
          return this.moveToPoint(this.creature.targetPosition, objects, creatures, shelters, canvasInfo);
        }


      } // otherwise, search for food
      else {
        //console.log(`creature is going to search for food`);
        return this.searchForFoodTarget(plants, creatures, objects, shelters, canvasInfo);
      }

      
    }

    searchForFoodTarget = (plants, creatures, objects, shelters, canvasInfo) => { // TODO logic for checking if prey can still be eaten
      this.foodIntervals++;

      let newPosition = this.creature.position;
      // if there is a current target, move toward it and then check if in same position. If so, put target in inventory.
      if (this.creature.currentTarget !== null) {
        //console.log(`Creature ${getCreatureIdentityString(this.creature)} has a food target.`);

        if (!isPrey(this.creature, this.creature.currentTarget)) { // if it's a plant, simple
          this.creature.targetPosition = this.creature.currentTarget.position;
          //console.log(`creature ${this.creature.id} has food target, moving toward target`);
          newPosition = this.moveToPoint(this.creature.currentTarget.position, objects, creatures, shelters, canvasInfo);
          if (isInPosition(newPosition, this.creature.currentTarget.position)) {
            //console.log(`creature ${this.creature.id} has captured food target`);
            putTargetInFoodInventory(this.creature);
          }
        } else { // otherwise, there is more complicated stuff to do!

          // check if prey is still being chased, update the prey's safety and then only keep chasing if still being chased
          if (this.creature.currentTarget.safety.isBeingChased) {
            //console.log(`prey is being chased`);
            this.creature.targetPosition = this.creature.currentTarget.position;
            //console.log(`creature ${this.creature.id} has food target, moving toward target`);
            newPosition = this.moveToPoint(this.creature.currentTarget.position, objects, creatures, shelters, canvasInfo);
            let preyHasMoved = this.creature.currentTarget.movement.hasMoved;
            let preyPosition = this.creature.currentTarget.position;
            if (!preyHasMoved) {
              let newPreyPosition = this.moveToPoint(this.creature.currentTarget.targetPosition, objects, creatures, shelters, canvasInfo);
              preyPosition = newPreyPosition;
            }
            if (isInPosition(newPosition, preyPosition)) {
              //console.log(`creature ${this.creature.id} has captured food target`);
              if (this.creature.currentTarget.life.isDead) {
                this.creature.currentTarget.isEaten = true;
              } else {
                this.creature.currentTarget.safety.isBeingEaten = true;
              }
              putTargetInFoodInventory(this.creature);

            }
          } else { // otherwise, deselect the target and use recursion
            //console.log(`The target seems to have escaped.`);
            this.creature.currentTarget = null;
            newPosition = this.searchForFoodTarget(plants, creatures, objects, shelters, canvasInfo);
          }
        }

        // this.creature.targetPosition = this.creature.currentTarget.position;
        // //console.log(`creature ${this.creature.id} has food target, moving toward target`);
        // newPosition = this.moveToPoint(this.creature.currentTarget.position, objects, creatures, shelters, canvasInfo);
        // if (isInPosition(newPosition, this.creature.currentTarget.position)) {
        //   //console.log(`creature ${this.creature.id} has captured food target`);
        //   putTargetInFoodInventory(this.creature);
        // }

         // if there is no current target, search for a target. If one is found, set that to new target and move toward it
      } else {
        //console.log(`Creature ${getCreatureIdentityString(this.creature)} is searching for food in area`);
        let newTarget = findFoodTargetInArea(this.creature, plants, creatures, canvasInfo);
        if (newTarget !== null) {
          //console.log(`target found!`);
          if (!isPrey(this.creature, newTarget)) { // if it's a plant, simply make it a target
            //console.log(`Target is a plant!`);
            this.creature.currentTarget = newTarget;
            this.creature.targetPosition = newTarget.position;
            //newPosition = this.moveToPoint(newTarget.position, objects, creatures, shelters, canvasInfo);
          } else { // otherwise, there is more complicated stuff to do!
            // see if prey is able to be chased
            if (canChasePrey(this.creature, newTarget)) {
              //console.log(`Now chasing prey!`);
              this.creature.currentTarget = newTarget;
              this.creature.targetPosition = newTarget.position;
              //newPosition = this.moveToPoint(newTarget.position, objects, creatures, shelters, canvasInfo);
            } else {
              //console.log(`The prey is unable to be chased.`);
              this.creature.currentTarget = null;
              if (isInPosition(this.creature.position, this.creature.targetPosition)) {
                //this.creature.targetPosition = this.moveToRandomPosition(objects, creatures, shelters, canvasInfo);
                this.creature.targetPosition = getRandomCreatureTargetPosition(this.creature, objects, shelters);
              } 
              // else {
              //   newPosition = this.moveToPoint(this.creature.targetPosition, objects, creatures, shelters, canvasInfo);
              // }

            }
          }

          //console.log(`creature ${this.creature.id} has new food target found`);

          //this.creature.targetPosition = newTarget.position;
          //newPosition = this.moveToPoint(newTarget.position, objects, creatures, shelters, canvasInfo);
        // if there is no target, move to random position
        } else {
          
          if (isInPosition(this.creature.position, this.creature.targetPosition)) {
            //console.log(`creature ${this.creature.id} sees no food but has reached target position. Moving toward new position.`);
            //this.creature.targetPosition = this.moveToRandomPosition(objects, creatures, shelters, canvasInfo);
            this.creature.targetPosition = getRandomCreatureTargetPosition(this.creature, objects, shelters);
          } else {
            //console.log(`creature ${this.creature.id} sees no food, continuing toward target position`);
            //newPosition = this.moveToPoint(this.creature.targetPosition, objects, creatures, shelters, canvasInfo);
          }
        }
        
      }

      modifyFoodTargetIfStuck(this, objects, shelters);

      newPosition = this.moveToPoint(this.creature.targetPosition, objects, creatures, shelters, canvasInfo);

      return newPosition;
    }

    searchForMate = (plants, creatures, objects, shelters, canvasInfo) => {

      // first determine if they already have a mate target or are a mate target
      if (this.creature.mating.hasMateTarget) {
        this.changeTargetPosition(this.creature.mating.mateTarget.position);
        //this.creature.targetPosition = this.creature.mating.mateTarget.position; // make mate position the target
        // now check if they are in the same position - if so, make that creature their mate
        let newPosition = this.moveToPoint(this.creature.targetPosition, objects, creatures, shelters, canvasInfo);
        if (isInPosition(newPosition, this.creature.targetPosition) && this.doPause(6)) {
          let newMate = this.creature.mating.mateTarget;
          this.creature.mating.makeMate(newMate, creatures);
          // also change the move mode to think for both creatures so they can proceed to mate
          // this.moveMode = MoveMode.THINK;
          // newMate.movement.moveMode = MoveMode.THINK;
        }
        return newPosition;
      } else if (this.creature.mating.isMateTarget) { // if they are a target, just stay in the same position
        // try also moving toward the mate to meet half way
        if (this.creature.mating.mateTargetOf !== null) {
          let newPosition = this.moveToPoint(this.creature.mating.mateTargetOf.position, objects, creatures, shelters, canvasInfo);
          return newPosition;
        } else {
          return this.creature.position;
        }
        //return this.creature.position;
      } else {

        // check for a mate in search area
        let mateResult = searchAreaForMate(this.creature, creatures);

        // if it found one, set the target position to that creature's position
        // TODO check if they are in the same position - if they are, make them mates
        if (mateResult.isMateFound) {
          console.log(`Mate found for ${this.creature.id}: ${mateResult.newMate.id}`);
          this.creature.mating.makeMateTarget(mateResult.newMate);
          this.changeTargetPosition(mateResult.newMate.position);
          //this.creature.targetPosition = mateResult.newMate.position;
          return this.moveToPoint(this.creature.targetPosition, objects, creatures, shelters, canvasInfo);
        } else { // if there's no targeted mate/mate targeting them, then move to random spot to look for a mate
          return this.moveToRandomPosition(objects, creatures, shelters, canvasInfo);
        }
      }


    }

    searchForShelter = (plants, creatures, objects, shelters, canvasInfo) => {
        //console.log('searchForShelter');
        let newPosition = this.creature.position;
    
        // if a position does exist, move toward that position
        // then set it to move to that position.

        // TODO check for predators in the area - change target to random spot if there is one
        // ensure that the target position still does not overlap with any shelters


        // for now do testing with this to get methods writting
        newPosition = this.moveToPoint(this.creature.targetPosition, objects, creatures, shelters, canvasInfo);
    
        // check if the creature is in that position. If so, create a shelter.
        if (isInPosition(this.creature.position, this.creature.targetPosition)) {

          // let shelterId = `sh${shelters.length}`;
          // let newShelter = new Shelter(shelterId, this.creature.position, this.creature.color, this.creature.size);
          // newShelter.addMemberToShelter(this.creature);
          // addItemToArray(newShelter, shelters, this.creature.setShelters);

          if (!canSetShelterInPosition(this.creature.targetPosition, this.creature, creatures, objects, shelters)) {
            this.changeTargetPosition(getRandomShelterPosition(this.creature, creatures, objects, shelters));
            //this.creature.targetPosition = getRandomShelterPosition(this.creature, creatures, objects, shelters);
            return this.searchForShelter(plants, creatures, objects, shelters, canvasInfo);
          } else {
            let shelterId = `sh-${this.creature.id}`;
            let newShelter = new Shelter(shelterId, this.creature.position, this.creature.color, this.creature.size);
            //this.creature.safety.shelter = newShelter;
            newShelter.addMemberToShelter(this.creature);
            //addItemToArray(newShelter, shelters, this.creature.setShelters);
          }

        }
    
        // return new position
        return newPosition;
    }

    goToShelter = (plants, creatures, objects, shelters, canvasInfo) => {
      //console.log(`goToShelter: Creature ${getCreatureIdentityString(this.creature)} going to shelter - ${this.moveMode} ${this.creature.targetType}`);
      if (this.creature.targetType === NeedType.SLEEP && isInPosition(this.creature.position, this.creature.targetPosition)) {
        makeCreatureSleep(this.creature);
        return this.creature.position;
      } else {
        //console.log(`${this.creature.id} target position: ${JSON.stringify(this.creature.targetPosition)}`);

        // Do something different than normal if the creature is escaping
        if (this.creature.targetType === NeedType.ESCAPE) {
          this.creature.targetPosition = this.creature.safety.shelter.getCenterPosition();
          //console.log(`goToShelter: Creature ${getCreatureIdentityString(this.creature)} going to shelter at position: ${this.creature.targetPosition}`);
          return this.moveToPoint(this.creature.targetPosition, objects, creatures, shelters);
        }

        return this.moveToPoint(this.creature.targetPosition, objects, creatures, shelters);
      }
    }

    

    leaveShelter = (objects, creatures, shelters, canvasInfo) => {

      if (isInPosition(this.creature.position, this.creature.targetPosition)) {
        this.creature.safety.shelter = null;
        return (this.creature.position);
      }
      //console.log(`creature ${this.creature.id} moving to position ${JSON.stringify(this.creature.targetPosition)}`);
      return this.moveToPoint(this.creature.targetPosition, objects, creatures, shelters, canvasInfo);
    }

    moveToRandomPosition = (objects, creatures, shelters, canvasInfo) => {
      if (this.creature.targetType === NeedType.SHELTER) {
        return this.leaveShelter(objects, creatures, shelters, canvasInfo);
      }
        //console.log('moveToRandomPosition');
            //console.log('moving to random position');
    // if creature is in the current target position, set the target position to a new random one
    if (isInPosition(this.creature.position, this.creature.targetPosition) || !isValidTargetPosition(this.creature, objects)) {
      //this.resetMovementProperties();
      //let newTargetPosition = getRandomStartPosition(this.creature, creatures, objects,[], shelters, CreatureDefaults.LARGEST_SIZE / 2 + CanvasInfo.OBJECT_PADDING + 1, this.creature.id, false);
      let newTargetPosition = getRandomCreatureTargetPosition(this.creature, objects, shelters);
      
      //console.log(`current position: ${JSON.stringify(this.creature.position)}; new target position: ${JSON.stringify(newTargetPosition)}`);
      this.changeTargetPosition(newTargetPosition);
      //this.creature.targetPosition = newTargetPosition;
      //this.logMovementProperties();
    }
    //console.log(`creature ${this.creature.id} moving to position ${JSON.stringify(this.creature.targetPosition)}`);
    return this.moveToPoint(this.creature.targetPosition, objects, creatures, shelters, canvasInfo);
    }

    getRandomPositionInsideShelter = () => {
      if (!this.creature.safety.shelter) {
        return this.creature.position;
      }

      let creaturePadding = (this.creature.size / 2) + 1;

      let shelter = this.creature.safety.shelter;
      let xAndY = getStartAndEndPoints(shelter.id, shelter.position, shelter.size, shelter.size);
      let randomPosition = getRandomPositionInBounds(xAndY.xStart, xAndY.xEnd, xAndY.yStart, xAndY.yEnd, creaturePadding);
      return randomPosition;
    }

    getShelterCornerPosition = () => {
      if (!this.creature.safety.shelter) {
        return this.creature.position;
      }

      let creaturePadding = (this.creature.size / 2) + 2;

      let shelter = this.creature.safety.shelter;
      let xAndY = getStartAndEndPoints(shelter.id, shelter.position, shelter.size, shelter.size);
      let position = {x: xAndY.xStart + creaturePadding, y: xAndY.yStart + creaturePadding};
      return position;
    }

    

        // sight targeting methods

    checkForPredators = () => {

    }

    getSightCoordinates = (canvasInfo) => {
        let direction = null;
        // if there is a newDirection set, use that for determining which way to show the site coordinates
        if (this.newDirection) {
        direction = this.newDirection;
        }

        // otherwise, use direction. For now, use the direction that is furthest from target if there's two
        // this is for simplicity - in the future maybe make it diagonal too.
        if (!direction) {
        direction = determineSightDirection(this.creature);
        }

        // now get the coordinates and return them
        let coord = determineSightCoordinates(this.creature, direction, canvasInfo);
        //console.log(`sight coords: ${JSON.stringify(coord)}`);
        return coord;
    }
}