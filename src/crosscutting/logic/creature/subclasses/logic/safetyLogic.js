import { LifeStage } from "../../../../constants/creatureConstants";
import { FoodType } from "../../../../constants/objectConstants";
import { isInSight } from "../../creatureLogic";
import { CanvasInfo } from "../../../../constants/canvasConstants";

//#region predator/prey logic
export const isPredator = (predator, creature) => {
    let creatureType = creature.type;

    let preyTypes = predator.food.prey;
    for (let i = 0; i < preyTypes.length; i++) {
        if (preyTypes[i] === creatureType) {
            return true;
        }
    }
    return false;
}

export const isPrey = (creature, potentialPrey) => {
    let isPrey = false;
    creature.food.prey.forEach(t => {
        if (potentialPrey.type === t) {
            isPrey = true;
        } 
    });
    return isPrey;
}

export const canChasePrey = (creature, prey) => {
    let canChase = true;
    if ((prey.safety.shelter && prey.safety.shelter.isPositionInsideThisShelter(prey.position) && prey.life.lifeStage !== LifeStage.DECEASED)
    || prey.isEaten) {
        canChase = false;
    }
    
    // TODO check if the target is in a reachable place
    return canChase;
}

export const getFoodTargetType = (food) => {
    let plantCount = 0;
    let preyCount = 0;

    food.plants.forEach(p => {
        plantCount++;
    });
    food.prey.forEach(p => {
        preyCount++;
    });
    
    if (plantCount > 0 && preyCount > 0) {
        return FoodType.BOTH;
    } else if (plantCount > 0) {
        return FoodType.PLANT;
    } else {
        return FoodType.PREY;
    }
}

export const getListOfPredators = (preyType, creatures) => {
    let predators = [];
    creatures.forEach(c => {
        if (c.food.prey.includes(preyType)) {
            predators.push(c);
        }
    });
    return predators;
}

export const isPredatorInSightOrChasing = (creature, predator) => {
    if (isPredatorInSight(creature, predator) || 
        (isPredatorChasing(creature, predator))) {
            return true;
        }
    return false;
}

export const isPredatorChasing = (creature, predator) => {
    if (predator.currentTarget !== null && predator.currentTarget.id === creature.id) {
        return true;
    }
    return false;
}

export const isPredatorInSight = (creature, predator) => {
    let sightCoords = creature.movement.getSightCoordinates(CanvasInfo);
    return isInSight(sightCoords, predator);
}

export const isPreyInSight = (creature, prey) => {
    let sightCoords = creature.movement.getSightCoordinates(CanvasInfo);
    return isInSight(sightCoords, prey);
}

//#endregion

//#region shelter logic



//#endregion