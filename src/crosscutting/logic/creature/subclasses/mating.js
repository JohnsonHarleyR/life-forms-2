import { isPotentialMate, getRandomGender, getCreatureInfoByType } from "../creatureLogic";
import { LifeStage, Gender } from "../../../constants/creatureConstants";
import { getRandomIntInRange, getRandomPositionInBounds, addItemToArray, getCreatureIdentityString } from "../../universalLogic";
import Creature from "../creature";
import { getRandomShelterPosition } from "../creatureLogic";
import { hasYoungChildren } from "./logic/needLogic";
export default class CreatureMating {
    constructor(creature, genderOfShelterMaker,
        minOffspring, maxOffspring, canHaveMultipleLitters) {
        this.creature = creature;

        this.genderOfShelterMaker = genderOfShelterMaker;

        this.isMating = false;

        this.isPregnant = false;
        this.offspringCount = null;

        this.minOffspring = minOffspring;
        this.maxOffspring = maxOffspring;

        this.canHaveMultipleLitters = canHaveMultipleLitters;

        this.hasMateTarget = false;
        this.mateTarget = null;
        this.isMateTarget = false;
        this.mateTargetOf = null;
    }

    updateMating = () => {
        this.checkIfMateStillAlive();
        this.checkIfStillMateTarget();
        this.checkIfStillMating();
    }

    produceOffspring = () => {
        console.log(`creature ${this.creature.id} producing offspring with ${this.creature.family.mate.id}`);
        if (this.creature.gender === Gender.FEMALE &&
            (!hasYoungChildren(this.creature) || this.canHaveMultipleLitters)) {
            // if female, make them pregnant
            this.isPregnant = true;
            // get random number of offspring
            let newOffspringCount = getRandomIntInRange(this.minOffspring, this.maxOffspring);
            this.offspringCount = newOffspringCount;
            console.log(`creature ${this.creature.id} is female and is now pregnant and will produce ${newOffspringCount} children`);
        }
        // turn off mating
        this.isMating = false;
        this.creature.needs.matingLevel.points = this.creature.needs.maxMating;
        this.creature.needs.updateNeeds();
        //this.creature.needs.priorityComplete = true;
    }

    haveChild = (creatures) => {
        //console.log(`Creature ${this.creature.id} is giving birth. Offspring left: ${this.offspringCount}`);
        if (this.isPregnant && this.offspringCount > 0) {
            let newChild = this.createChild(creatures);
            this.creature.family.children.push(newChild);
            if (this.creature.family.mate) {
                this.creature.family.mate.family.children.push(newChild);
            }
            // update shelter too
            if (this.creature.safety.shelter) {
                this.creature.safety.shelter.addMemberToShelter(newChild);
            }
            this.offspringCount--;
            //console.log(`having child - ${this.offspringCount} left`);
        } else if (this.isPregnant && this.offspringCount === 0) {
            //console.log(`creature ${this.creature.id} has 0 children left to birth - stopping pregnancy`);
            this.isPregnant = false;
            this.offspringCount = null;
            this.displayNewChildren(creatures);
        }
    }

    displayNewChildren = (creatures) => {
        let str = "children: ";
        this.creature.family.children.forEach(c => {
            str += `${c.id}, `;
        });
        console.log(str);
    }

    createChild = (creatures) => {
        let mother = null;
        let father = null;
        let index = creatures.length;
        let lifeStage = LifeStage.CHILD;
        let gender = getRandomGender();
        let randomPosition = this.creature.safety.shelter.getRandomPositionInsideShelter(this.creature.size);
        let info = getCreatureInfoByType(this.creature.type);
        switch(this.creature.gender) {
            case Gender.MALE:
                father = this.creature;
                mother = this.creature.family.mate;
                break;
            case Gender.FEMALE:
                mother = this.creature;
                father = this.creature.family.mate;
                break;
        }

        let newChild = new Creature({id: `c${index}-${this.creature.id}`, gender: gender, lifeStage: lifeStage, position: randomPosition, 
        mother: mother, father: father, targetPosition: randomPosition, ...info });
        newChild.safety.shelter = this.creature.safety.shelter;
        return newChild;
    }

    makeMate = (newMate, creatures) => {
        // make sure they haven't already been given a mate 
        if (this.creature.family.mate === null) {
            // first make them each other's mate
            this.creature.family.mate = newMate;
            newMate.family.mate = this.creature;
            this.updateMating();
            newMate.mating.updateMating();
            
            // determine whose shelter to make the main shelter
            if (this.genderOfShelterMaker === this.creature.gender) {
                // first remove the mates shelter from the mate
                let mateShelter = newMate.safety.shelter;
                if (mateShelter !== null && this.creature.safety.shelter !== null && 
                mateShelter.id !== this.creature.safety.shelter.id) {

                    mateShelter.putShelterFoodBackInInventory(newMate);
                    mateShelter.removeMemberFromShelter(newMate);
                    mateShelter.updateShelter();
                }

                // now add members to this creatures shelter
                let shelter = this.creature.safety.shelter;
                if (shelter !== null && newMate.safety.shelter === null) {
                    shelter.addMemberToShelter(newMate);
                    shelter.updateShelter();
                }

                newMate.safety.updateSafety(creatures);
            }
             else {
                // first remove creature from their shelter
                let shelter = this.creature.safety.shelter;
                let mateShelter = newMate.safety.shelter;
                if (shelter !== null && mateShelter !== null && shelter.id !== mateShelter.id) {
                    shelter.putShelterFoodBackInInventory(this.creature);
                    shelter.removeMemberFromShelter(this.creature);
                    shelter.updateShelter();
                }

                // now add members to this creatures shelter
                if (mateShelter !== null && this.creature.safety.shelter === null) {
                    mateShelter.addMemberToShelter(this.creature);
                    mateShelter.updateShelter();
                }

                this.creature.safety.updateSafety(creatures);
            }
            
            // set is mating
            //this.isMating = true;
            //newMate.mating.isMating = true;

        }

    }

    ensureMatesHaveSameShelter = (creatures) => {
        if (this.creature.family.mate === null) {
            throw `Error: creature ${getCreatureIdentityString(this.creature)} should have a mate when reaching this method.` +
            `\n(Method: ensureMatesHaveSameShelter; File: mating.js)`;
        } else if (this.creature.safety.shelter === null) {
            throw `Error: creature ${getCreatureIdentityString(this.creature)} should have a shelter when reaching this method.` +
            `\n(Method: ensureMatesHaveSameShelter; File: mating.js)`;
        } else if (this.creature.family.mate.safety.shelter === null) {
            this.moveIntoMateShelter(this.creature.family.mate, this.creature, creatures);
            // throw `Error: creature ${getCreatureIdentityString(this.creature)}'s mate should have a shelter when reaching this method.` +
            // `\n(Method: ensureMatesHaveSameShelter; File: mating.js)`;

        }

        let creature = this.creature;
        let mate = this.creature.family.mate;
        if ((creature.safety.shelter.id !== mate.safety.shelter.id) ||
            creature.safety.shelter.getCenterPosition() !==
            mate.safety.shelter.getCenterPosition()) {
            console.log(`MATING: creature ${getCreatureIdentityString(this.creature)} has shelter ${this.creature.safety.shelter.id}; ` +
                `mate: ${this.creature.family.mate !== null ? getCreatureIdentityString(this.creature.family.mate) : null}, ` + 
                `mate has shelter ${this.creature.family.mate !== null && this.creature.family.mate.safety.shelter !== null ? this.creature.family.mate.safety.shelter.id : null}`);

            this.combineShelterWithMate(creature, mate, creatures);
        }
    }

    combineShelterWithMate = (creature, mate, creatures) => {
        if (creature.mating.genderOfShelterMaker !== creature.gender) {
            console.log(`Creature ${getCreatureIdentityString(creature)} is moving into mate's shelter now.`);
            this.moveOutOfShelterForMate(creature, creatures);
            this.moveIntoMateShelter(creature, mate, creatures);
        }
    }

    moveIntoMateShelter = (creature, mate, creatures) => {
        let mateShelter = mate.safety.shelter;
        mateShelter.addMemberToShelter(creature);
        mateShelter.updateShelter();
        creature.safety.updateSafety(creatures);
    }

    moveOutOfShelterForMate = (creature, creatures) => {
        // remove creature from their shelter
        let shelter = creature.safety.shelter;
        if (shelter !== null) {
            shelter.putShelterFoodBackInInventory(creature);
            shelter.removeMemberFromShelter(creature);
            shelter.updateShelter();
            creature.safety.updateSafety(creatures);
        }
    }

    // combineShelterWithMate = (newMate) => {
    //     if (this.genderOfShelterMaker === this.creature.gender) {
    //         // first remove the mates shelter from the mate
    //         let mateShelter = newMate.safety.shelter;
    //         if (mateShelter !== null) {
    //             mateShelter.removeMemberFromShelter(newMate);
    //             mateShelter.updateShelter();
    //         }

    //         // now add members to this creatures shelter
    //         let shelter = this.creature.safety.shelter;
    //         if (shelter !== null) {
    //             shelter.addMemberToShelter(newMate);
    //             shelter.updateShelter();
    //         }
    //     } else {
    //         // first remove creature from their shelter
    //         let shelter = this.creature.safety.shelter;
    //         if (shelter !== null) {
    //             shelter.putShelterFoodBackInInventory(this.creature);
    //             shelter.removeMemberFromShelter(this.creature);
    //             shelter.updateShelter();
    //         }

    //         // now add members to this creatures shelter
    //         let mateShelter = newMate.safety.shelter;
    //         if (mateShelter !== null) {
    //             mateShelter.addMemberToShelter(this.creature);
    //             mateShelter.updateShelter();
    //         }
    //     }
    // }

    makeMateTarget = (newMate) => {
        this.hasMateTarget = true;
        this.mateTarget = newMate;

        newMate.mating.isMateTarget = true;
        newMate.mating.mateTargetOf = this.creature;
    }

    checkIfMateStillAlive = () => {
        if (this.creature.family.mate !== null &&
            (this.creature.life.lifeStage === LifeStage.DECEASED ||
            this.creature.family.mate.life.lifeStage === LifeStage.DECEASED)) {
            this.creature.family.mate = null;
        }
    }

    checkIfStillMateTarget = () => {
        if (this.creature.family.mate !== null) { // cancel targeting if creature has a mate
            if (this.isMateTarget) {
                this.isMateTarget = false;
                this.mateTargetOf = null;
            }

            if (this.hasMateTarget) {
                this.hasMateTarget = false;
                this.mateTarget = null;
            }

        } else { // if there's no mate but they are a target/have a target, ensure that target is still an option
            if (this.hasMateTarget) {
                if (!isPotentialMate(this.creature, this.mateTarget)) {
                    this.hasMateTarget = false;
                    this.mateTarget = null;
                }
            }

            if (this.isMateTarget) {
                if (!isPotentialMate(this.creature, this.mateTargetOf)) {
                    this.isMateTarget = false;
                    this.mateTargetOf = null;
                }
            }
        }
    }

    checkIfStillMating = () => {
        if (this.isMating) {
            if (this.isPregnant || 
                (this.creature.family.mate !== null && this.creature.family.mate.mating.isPregnant) || 
                this.creature.life.lifeStage === LifeStage.DECEASED) {
                    this.isMating = false;
                }
        }
    }

    canMate = () => {
        if (this.creature.family.mate === null) {
            return false;
        }

        if (this.canMateNoPartnerCheck() && this.creature.family.mate.mating.canMateNoPartnerCheck()) {
            return true;
        }

        return false;
    }

    canMateNoPartnerCheck = () => {
        if (this.creature.safety.shelter && this.creature.family.mate && 
            this.creature.family.mate.life.lifeStage !== LifeStage.DECEASED && 
            this.creature.family.mate.life.lifeStage !== LifeStage.ELDER &&
            this.creature.safety.shelter.totalFoodEnergy >= this.creature.needs.foodRequiredToMate) {
                return true;
            }
            return false;
    }
}