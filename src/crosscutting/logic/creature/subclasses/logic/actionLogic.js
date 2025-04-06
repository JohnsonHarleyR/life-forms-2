import { LifeStage, InventoryLocation, ActionType, CreatureDefaults } from "../../../../constants/creatureConstants"
import { getTargetFromArea } from "../../creatureLogic";
import { FoodType } from "../../../../constants/objectConstants";
import { getCreatureIdentityString, getRandomCreatureTargetPosition, shuffleArray } from "../../../universalLogic";
import { isPrey } from "./safetyLogic";

export const makeCreatureDie = (creature) => {
    creature.life.lifeStage = LifeStage.DECEASED;
    creature.needs.isSleeping = false;
    creature.life.updateLife();
}

export const makeCreatureSleep = (creature) => {
    creature.needs.isSleeping = true;
}

// food
export const eatFood = (food, creature, location) => {
    // make the food say it has been eaten
    if (!isPrey(creature, food)) {
        food.isEaten = true;
    }
    // add energy from food to the creature
    addFoodEnergyToCreature(food.energy, creature);
    // remove food item from energy, depending on location
    if (location === InventoryLocation.SHELTER && creature.safety.shelter !== null) {
        creature.safety.shelter.inventory = removeFoodItemFromInventory(creature.safety.shelter.inventory, food.id);
    } else {
        creature.inventory = removeFoodItemFromInventory(creature.inventory, food.id);
    }

}

export const eatFoodFromInventory = (creature) => {
    if (creature.inventory.food.length === 0) {
        throw "Error: no food in inventory to eat. Method eatFoodFromInventory. (actionLogic.js)";
    }
    let food = creature.inventory.food[0];
    eatFood(food, creature, InventoryLocation.CREATURE);
}

export const eatFoodFromShelter = (creature) => {
    if (creature.safety.shelter === null || creature.safety.shelter.inventory.food.length === 0) {
        throw "Error: no food in inventory to eat. Method eatFoodFromInventory. (actionLogic.js)";
    }
    let food = creature.safety.shelter.inventory.food[0];
    eatFood(food, creature, InventoryLocation.SHELTER);
}

const removeFoodItemFromInventory = (inventory, foodId) => {
    let newFood = [];
    inventory.food.forEach(f => {
        if (f.id !== foodId) {
            newFood.push(f);
        }
    });
    inventory.food = newFood;
    return inventory;
}

const addFoodEnergyToCreature = (energy, creature) => {
    creature.needs.foodLevel.points += energy;
    creature.needs.updateNeedLevels(creature.needs.foodLevel.points, creature.needs.sleepLevel.points, creature.needs.matingLevel.points);
}

export const addFoodToShelter = (creature) => {
    if (creature.safety.shelter === null) {
        return;
    }

    creature.inventory.food.forEach(f => {
        creature.safety.shelter.inventory.food.push(f);
    });
    creature.inventory.food = [];
}

export const creatureHasFoodInInventory = (creature) => {
    if (creature.inventory.food.length > 0) {
        return true;
    }
    return false;
}

export const creatureHasFoodInShelter = (creature) => {
    if (creature.safety.shelter === null) {
        return false;
    }

    if (creature.safety.shelter.inventory.food.length > 0) {
        return true;
    }

    return false;
}

export const findFoodTargetInArea = (creature, plants, creatures, canvasInfo) => {
    let sightCoords = creature.movement.getSightCoordinates(canvasInfo);
    let possibles = [];
    let types = [];
    if (creature.foodTargetType === FoodType.PLANT) {
        possibles = plants;
        types = creature.food.plants;
    } else if (creature.foodTargetType === FoodType.PREY) {
        possibles = creatures;
        types = creature.food.prey;
    } else if (creature.foodTargetType === FoodType.BOTH) {
        possibles = [...creatures];
        plants.forEach(p => {
            possibles.push(p);
        })
        types = [...creature.food.prey];
        creature.food.plants.forEach(p => {
            types.push(p);
        });

          // shuffle possibilities
        possibles = shuffleArray(possibles);
    }



    let target = getTargetFromArea(sightCoords, types, possibles);
    return target;
}

export const putTargetInFoodInventory = (creature) => {
    if (creature.currentTarget !== null) {
        creature.inventory.food.push(creature.currentTarget);
        if (!isPrey(creature, creature.currentTarget)) {
            creature.currentTarget.isEaten = true;
        } else {
            creature.inventory.food.push(creature.currentTarget);
            console.log(`***CREATURE ${getCreatureIdentityString(creature)} IS EATING ${getCreatureIdentityString(creature.currentTarget)}`);
        }
        creature.currentTarget = null;
    }
}

export const modifyFoodTargetIfStuck = (movement, objects, shelters) => {
    let creature = movement.creature;
    
    let doTargetReset = checkForTargetPositionReset(movement);
    if (doTargetReset) {
        //console.log(`Creature ${getCreatureIdentityString(creature)} is moving to new target position.`);
        creature.targetPosition = getRandomCreatureTargetPosition(creature, objects, shelters);
    }

    let doFoodIntervalReset = checkForFoodIntervalReset(movement);
    if (doFoodIntervalReset) {
        if (movement.foodIntervals >= CreatureDefaults.INTERVALS_BEFORE_NEW_TARGET_POSITION) {
            //console.log(`Creature ${getCreatureIdentityString(creature)} has exceeded the number of intervals, resetting intervals.`);
        } else if (creature.needs.priority === ActionType.FEED_FAMILY ||
        creature.needs.priority === ActionType.FEED_SELF) {
            //console.log(`Moving to a new target position, resetting intervals.`);
        }

        movement.foodIntervals = 0;
    }

    movement.foodTargetPos = creature.targetPosition;
}

const checkForFoodIntervalReset = (movement) => {
    let creature = movement.creature;

    if (creature.needs.priority !== ActionType.FEED_FAMILY &&
        creature.needs.priority !== ActionType.FEED_SELF) {
            if (movement.foodIntervals !== 0) {
                return true;
            }
            return false;
    }

    let areSameTargetPositions = arePositionsTheSame(creature.targetPosition, movement.foodTargetPos);
    if (!areSameTargetPositions ||
        movement.foodIntervals >= CreatureDefaults.INTERVALS_BEFORE_NEW_TARGET_POSITION) {
            return true;
    }
    return false;

}

const checkForTargetPositionReset = (movement) => {
    let creature = movement.creature;

    // return false unless they are searching for food
    if (creature.needs.priority !== ActionType.FEED_FAMILY &&
        creature.needs.priority !== ActionType.FEED_SELF) {
            return false;
    }

    // otherwise, check if current target position is the same as foodTargetPos
    // and the interval count has not reached the limit
    let areSameTargetPositions = arePositionsTheSame(creature.targetPosition, movement.foodTargetPos);
    if (areSameTargetPositions &&
        movement.foodIntervals >= CreatureDefaults.INTERVALS_BEFORE_NEW_TARGET_POSITION) {
        // if it has not, tell them not to reset yet
        return true;
    } else {
        return false;
    }
}

export const arePositionsTheSame = (pos1, pos2) => {
    if (pos1.x === pos2.x && pos1.y === pos2.y) {
        return true;
    }
    return false;
}

const determineFamilyFoodPercentAverage = (creature) => {
    let memberCount = 0;
    let foodTotal = 0;

    // parents don't live with family (unless elder? For now they don't so don't worry about them--YET)
    // ACTUALLY, just add all family members. If they live in that shelter, count them.
    let members = [creature.family.mate];
    this.creature.family.children.forEach(c => { // don't feel grown children
        members.push(c);
    });
    members.push(creature.family.mother);
    members.push(creature.family.father);

    // loop through members
    members.forEach(m => {
        if (m !== null && m.life.lifeStage !== LifeStage.DECEASED && 
            m.safety.shelter === creature.safety.shelter) {
                memberCount++;
                foodTotal += m.needs.foodLevel.percent;
            }
    })

    // find the average and return
    let average = foodTotal / memberCount;
    return average;

}