import { LifeStage } from "../../../constants/creatureConstants";
import { getListOfPredators, isPredatorInSight, isPredatorChasing } from "./logic/safetyLogic";

export default class CreatureSafety {
    constructor(creature, shelter, isBeingChased) {
        this.creature = creature;

        this.shelter = shelter;
        this.isInShelter = false;
        this.isLeavingShelter = false;

        this.predatorsDetected = [];
        this.predatorChasing = null;
        this.isBeingChased = isBeingChased;
        this.isBeingEaten = false;
    }

    updateSafety = (creatures) => {
        // scan for predators 
        this.updateIfInShelter();
        this.scanForPredators(creatures);
        this.updateIfBeingChased(creatures);

        // update shelter is there is a shelter
        if (this.shelter !== null) {
            this.shelter.updateShelter();
        }
    }

    updateIfInShelter = () => { // will be set to false if creature is deceased - allow predators to eat
        if (this.shelter !== null && this.shelter.isPositionInsideThisShelter(this.creature.position)
            && this.creature.life.lifeStage !== LifeStage.DECEASED) {
            this.isInShelter = true;
        } else {
            this.isInShelter = false;
        }
    }

    updateIfBeingChased = () => {
        // if the creature doesn't already see it's being chased, check any detected predators for whether they are chasing
        if (this.predatorChasing === null) {
            let result = false;
            this.predatorsDetected.forEach(d => {
                if (d.currentTarget === this.creature) {
                    this.predatorChasing = d;
                    result = true;
                }
            });
            this.isBeingChased = result;
        } else { // otherwise check if prey is still in a position to be chased or if predator chasing is no longer targeting them
            if ((this.isInShelter || this.predatorChasing.currentTarget !== this.creature) &&
                !this.isPredatorDetected(this.predatorChasing)) { // TODO add possibility of being in unreachable spot
                this.isBeingChased = false;
                this.predatorChasing = null;
            }
        }
    }

    isAnyPredatorDetected = () => {
        if (this.predatorsDetected.length > 0) {
            return true;
        }
        return false;
    }

    isPredatorDetected = (predator) => {
        if (!predator || this.predatorsDetected.length === 0) {
            return false;
        }

        let isDetected = false;
        this.predatorsDetected.forEach(d => {
            if (d.id === predator.id) {
                isDetected = true;
            }
        })
        return isDetected;
    }

    scanForPredators = (creatures) => {
        let possiblePredators = getListOfPredators(this.creature.type, creatures);
        this.predatorsDetected = [];
        possiblePredators.forEach(p => {
            if (isPredatorInSight(this.creature, p)) {
                this.predatorsDetected.push(p);
            }
        });
    }

}