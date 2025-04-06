import { AmountNeeded, AddOrSubtract, SleepProps, LifeStage } from "../../../../constants/creatureConstants";

// technical adult logic

// the technical adult is the sibling responsible for feeding the family in case the parents are dead
export const determineIfTechnicalAdult = (creature) => {
    if (creature.life.lifeStage !== LifeStage.CHILD) {
        return false;
    }
    
    return isOldestInShelter(creature);

}

const isOldestInShelter = (creature) => {
    if (creature.safety.shelter === null || creature.life.lifeStage === LifeStage.DECEASED) {
        return false;
    }

    let members = creature.safety.shelter.members;

    let oldestAge = 0;
    let oldestId = null;
    members.forEach(m => {
        if (m.life.age > oldestAge) {
            oldestAge = m.life.age;
            oldestId = m.id;
        }
    });

    if (creature.id === oldestId) {
        return true;
    }
    return false;
}

// ----------------------

export const getAmountNeededDecimal = (amountNeeded) => {
    switch (amountNeeded) {
        default:
            throw "Error: Invalid value inside of getAmountNeededDecimal. (needLogic.js)";
        case AmountNeeded.MIN:
            return 0.25;
        case AmountNeeded.AVG:
            return 0.50;
        case AmountNeeded.MAX:
            return 0.75;
    }
}

export const calculateAmountLostPerYear = (maxAmount, decayRate) => {
    let amountLostPerYear = maxAmount * decayRate;
    return amountLostPerYear;
}

// export const calculateAmountLostPerMs = (msPerYear, maxAmount, decayRate) => {
//     let amountLostPerYear = calculateAmountLostPerYear(maxAmount, decayRate);
//     let amountLostPerMs = amountLostPerYear / msPerYear;
//     return amountLostPerMs;
// }

export const calculateAmountLostPerMs = (msPerDay, amountNeededPerDay) => {
    let amountLostPerMs = amountNeededPerDay / msPerDay;
    return amountLostPerMs;
}

export const calculateAmountLost = (msPassed, amountPerMs) => {
    let amountLost = msPassed * amountPerMs;
    return amountLost;
}

export const calculateNewAmount = (currentAmount, amountLostPerMs, msPassed, addOrSubtract) => {
    let amountLost = calculateAmountLost(msPassed, amountLostPerMs);
    let newAmount = 0;
    if (addOrSubtract === AddOrSubtract.ADD) {
        newAmount = currentAmount + amountLost;
    } else {
        newAmount = currentAmount - amountLost;
    }
    if (newAmount < 0) {
        newAmount = 0;
    }
    return newAmount;
}

// mating
export const hasYoungChildren = (creature) => {
    if (creature.family.children.length === 0) {
        return false;
    }

    let children = creature.family.children;
    for (let i = 0; i < children.length; i++) {
        if (children[i].life.lifeStage === LifeStage.CHILD) {
            return true;
        }
    }

    return false;
}

export const hasStarvingChildren = (creature) => {
    if (!hasYoungChildren(creature)) {
        return false;
    }

    let children = creature.family.children;
    for (let i = 0; i < children.length; i++) {
        if (children[i].needs.foodLevel.percent <= 15) {
            return true;
        }
    }

    return false;
}

export const hasHungryChildren = (creature) => {
    if (!hasYoungChildren(creature)) {
        return false;
    }

    let children = creature.family.children;
    for (let i = 0; i < children.length; i++) {
        if (children[i].needs.foodLevel.percent <= 50) {
            return true;
        }
    }

    return false;
}


// food
export const isStarving = (creature) => {
    if (creature.needs.foodLevel.percent <= 15) {
        return true;
    }
    return false;
}

export const determineMaxFood = (creature, foodQuotient) => {
    let result = creature.energy * foodQuotient;
    return result;
}

export const isFoodInInventoryEnoughForFamily = (creature, fractionAmount = 1) => {
    if (creature.needs.foodPercentGoal === null) {
        return true;
    }

    let totalFoodInInventory = getTotalFoodPointsInInventory(creature.inventory);
    let totalFoodNeeded = getTotalFoodPointsNeededForFamily(creature) * fractionAmount;
    let percentInInventory = (totalFoodInInventory / totalFoodNeeded) * 100;

    if (percentInInventory >= creature.needs.foodPercentGoal) {
        return true;
    }
    return false;
}

export const isCombinedFoodEnoughToMate = (creature) => {
    let shelterFoodPoints = creature.safety.shelter ? creature.safety.shelter.totalFoodEnergy : 0;
    let inventoryFoodPoints = 0;
    creature.inventory.food.forEach(f => {
        inventoryFoodPoints += f.energy;
    });

    if (creature.family.mate) {
        let mate = creature.family.mate;
        mate.inventory.food.forEach(f => {
            inventoryFoodPoints += f.energy;
        });
    }

    let combinedFoodPoints = shelterFoodPoints + inventoryFoodPoints;
    if (combinedFoodPoints >= creature.needs.foodRequiredToMate) {
        return true;
    }
    return false;
}

export const isFoodInShelterEnoughForFamily = (creature) => {
    if (creature.needs.foodPercentGoal === null) {
        return true;
    }

    if (creature.safety.shelter === null) {
        return false;
    }

    let totalFoodInInventory = getTotalFoodPointsInInventory(creature.safety.shelter.inventory);
    let totalFoodNeeded = getTotalFoodPointsNeededForFamily(creature);
    let percentInInventory = (totalFoodInInventory / totalFoodNeeded) * 100;

    if (percentInInventory >= creature.needs.foodPercentGoal) {
        return true;
    }
    return false;
}

const getTotalFoodPointsInInventory = (inventory) => {
    let total = 0;
    inventory.food.forEach(f => {
        total += f.energy;
    });
    return total;
}

export const getTotalFoodPointsNeededForFamily = (creature) => {
    let needTotal = 0;

        // parents don't live with family (unless elder? For now they don't so don't worry about them--YET)
    // ACTUALLY, just add all family members. If they live in that shelter, count them.
    let members = [creature, creature.family.mate];
    creature.family.children.forEach(c => { // don't feel grown children
        members.push(c);
    });
    members.push(creature.family.mother);
    members.push(creature.family.father);

    // loop through members
    members.forEach(m => {
        if (m !== null && m.life.lifeStage !== LifeStage.DECEASED && 
            m.safety.shelter !== null && creature.safety.shelter !== null &&
            m.safety.shelter.id === creature.safety.shelter.id) {
                let foodNeeded = m.needs.maxFood - m.needs.foodLevel.points;
                needTotal += foodNeeded;
            }
    });
    
    return needTotal;
}

// sleep
export const calculateSleepRecoveryPerMs = (msPerHour) => { // divide ms per hour
    let hour = 1;
    let sleepPerMs = hour / msPerHour;
    return sleepPerMs;
}

// export const calculateSleepRecoveryPerMs = (maxSleep, msPerYear) => {
//     let msForMaxRecovery = calculateMsForMaxSleepRecovery(msPerYear);
//     let sleepPerMs = maxSleep / msForMaxRecovery;
//     return sleepPerMs;
// }

// const calculateMsForMaxSleepRecovery = (msPerYear) => {
//     let recoveryRate = calculateFullSleepRecoveryRate();
//     let msForMaxRecover = msPerYear * recoveryRate;
//     return msForMaxRecover;
// }

// const calculateFullSleepRecoveryRate = () => {
//     let rate = SleepProps.HOURS_FOR_FULL_RESTORE / SleepProps.HOURS_PER_YEAR;
//     return rate;
// }