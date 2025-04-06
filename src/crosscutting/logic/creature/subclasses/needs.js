import { LifeStage, ActionType, AmountNeeded, AddOrSubtract } from "../../../constants/creatureConstants";
import { roundToPlace, getCreatureIdentityString, isInPosition } from "../../universalLogic";
import { assessCauseOfDeath, doesPotentialMateExist, isTimeToMoveOn } from "../creatureLogic";
import { 
    getAmountNeededDecimal,
    calculateAmountLostPerMs,
    calculateNewAmount,
    calculateSleepRecoveryPerMs,
    determineMaxFood,
    getTotalFoodPointsNeededForFamily,
    hasYoungChildren,
    isStarving,
    hasStarvingChildren,
    hasHungryChildren,
    determineIfTechnicalAdult
} from "./logic/needLogic";

export default class CreatureNeeds {
    constructor(creature, foodNeeded, sleepNeeded, matingNeeded) {
        this.creature = creature;

        this.foodQuotient = foodNeeded;
        this.matingDividend = matingNeeded;

        this.maxFood = determineMaxFood(creature, foodNeeded);
        this.maxSleep = sleepNeeded;
        this.maxMating = 100;

        this.foodLostPerMs = calculateAmountLostPerMs(this.creature.life.msPerYear, this.maxFood);
        this.sleepLostPerMs = calculateAmountLostPerMs(this.creature.life.msPerYear, this.maxSleep);
        this.matingLostPerMs = calculateAmountLostPerMs(this.creature.life.msPerYear, this.maxMating / this.matingDividend);

        this.sleepPerMs = calculateSleepRecoveryPerMs(this.maxSleep, this.creature.life.msPerYear);
        this.isSleeping = false;

        this.foodLevel = {
            points: this.maxFood / 2,
            percent: this.determineNeedPercent(this.maxFood / 2, this.maxFood)
        } 
        this.sleepLevel = {
            points: this.maxSleep / 2,
            percent: this.determineNeedPercent(this.maxSleep / 2, this.maxSleep)
        } 

        this.matingLevel = {
            points: creature.life.lifeStage !== LifeStage.CHILD ? 0 : this.maxMating,
            percent: this.determineNeedPercent(creature.life.lifeStage !== LifeStage.CHILD ? this.maxMating / 2 : this.maxMating, this.maxMating)
        } 

        this.isTechnicalAdult = determineIfTechnicalAdult(this.creature);

        this.priority = this.determinePriority();
        this.previousPriority = null;
        this.priorityComplete = true;
        this.startNewAction = false;

        this.foodPercentGoal = null;
        this.foodRequiredToMate = this.creature.adultEnergy * 2;
        this.familyFoodPercent = this.determineFamilyFoodPercent();;

        this.lastUpdate = Date.now();

    }

    updateNeeds = (creatures) => {
        let newUpdate = Date.now();
        //let timeLapsed = newUpdate - this.lastUpdate;

        // TODO determine how much the points have decayed
        let timeLapsed = newUpdate - this.lastUpdate;

        // update whether this creature is responsible for the family as a child
        let prevStatus = this.isTechnicalAdult;
        this.isTechnicalAdult = determineIfTechnicalAdult(this.creature);
        if (this.isTechnicalAdult && !prevStatus) {
            console.log(`Creature ${getCreatureIdentityString(this.creature)} is now the TECHNICAL ADULT in the family.`);
        }

        this.updateFoodRates(); // this can change after the creature is no longer a child

        // let foodPoints = this.foodLevel.points;
        // let sleepPoints = this.sleepLevel.points;
        // let matingPoints = this.matingLevel.points;

        let foodPoints = calculateNewAmount(this.foodLevel.points, this.foodLostPerMs, timeLapsed, AddOrSubtract.SUBTRACT); // TODO change
        let sleepPoints = calculateNewAmount(this.sleepLevel.points, this.sleepLostPerMs, timeLapsed, AddOrSubtract.SUBTRACT);
        let matingPoints = calculateNewAmount(this.matingLevel.points, this.matingLostPerMs, timeLapsed, AddOrSubtract.SUBTRACT);

        // double check sleep - if the creature is sleeping then recalculate sleep amount
        if (this.isSleeping) {
            //console.log(`creature ${this.creature.id} is sleeping`);
            sleepPoints = calculateNewAmount(this.sleepLevel.points, this.sleepPerMs, timeLapsed, AddOrSubtract.ADD);
            if (sleepPoints > this.maxSleep) {
                sleepPoints = this.maxSleep;
            }
        }

        // now update need levels
        this.updateNeedLevels(foodPoints, sleepPoints, matingPoints);

        // update family food percent
        this.familyFoodPercent = this.determineFamilyFoodPercent();

        //this.displayCreatureNeedLevels();

        // make sure creature is still alive - DONE?
        
        // set previous priority before changing the priority
        if (this.isPriorityComplete(this.priority, creatures)) {
            //console.log(`priority complete for ${getCreatureIdentityString(this.creature)}`);
            this.previousPriority = this.priority;
            this.priorityComplete = true;
        }

        // set the priority based on new levels
        this.priority = this.determinePriority(creatures);
        //console.log(`priority for ${getCreatureIdentityString(this.creature)}`);

        //this.priorityComplete = false;
        // turn sleeping back off
        //this.isSleeping = false;

        // set lastUpdate after all this
        this.lastUpdate = newUpdate;
    }


    displayCreatureNeedLevels = () => {
        console.log(`Need levels for creature ${this.creature.id}: \nFood: ${this.foodLevel.percent} ` +
        `\nSleep: ${this.sleepLevel.percent} \nMating: ${this.matingLevel.percent}`);
    }

    updateFoodRates = () => {
        this.maxFood = determineMaxFood(this.creature, this.foodQuotient);
        this.foodLostPerMs = calculateAmountLostPerMs(this.creature.life.msPerYear, this.maxFood);
    }


    determinePriority = (creatures) => {
        // if the priority is not none, complete action? (consider)
        let isShortenedList = false;
        if (!this.priorityComplete) {
            isShortenedList = true;
        }

        let possiblePriorities = this.getPriorityOrder();
        let lastPriority = this.priority;

        // loop through priorities and find the one that meets a condition
        let newPriority = ActionType.NONE;
        for (let i = 0; i < possiblePriorities.length; i++) {
            if (possiblePriorities[i].meetsCondition(creatures)) {
                newPriority = possiblePriorities[i].priority;
                break;
            }
        }

        // if it was a shortened list and different from last priority, prepare for new priority and return new priority
        // if (isShortenedList && newPriority !== lastPriority) {
        //     this.prepareForNextPriority();
        //     return newPriority;
        // }
        if (isShortenedList && this.didPriorityChange(newPriority, lastPriority, false)) {
            this.prepareForNextPriority();
            return newPriority;
        }

        // if (this.creature.life.lifeStage === LifeStage.CHILD) {
        //     console.log(`priority for CHILD ${getCreatureIdentityString(this.creature)}: ${newPriority}`);
        //     if (newPriority === ActionType.SLEEP_IN_SHELTER && this.creature.safety.shelter !== null) {
        //         console.log(`Shelter number: ${this.creature.safety.shelter.id}`);
        //     } else if (newPriority === ActionType.SLEEP_IN_SHELTER && this.creature.safety.shelter === null) {
        //         console.log(`No shelter for creature`);
        //     }
        // }

        // only set the new priority is priority is complete OR new priority is about death, falling asleep, running away
        // if (!this.priorityComplete && (this.priority === ActionType.DIE ||
        //     (this.priority === ActionType.FEED_SELF && this.foodLevel.percent <= 15) || 
        //     this.priority === ActionType.LEAVE_SHELTER)) {
        //         return  this.priority;
        //     }

        // What as I doing with the above part again?

        // if the priority is complete or the priority does not equal previous, set priorityComplete to false;
        if (this.priorityComplete) {
            this.priorityComplete = false;
        }
        // if (this.priorityComplete || newPriority !== this.priority) {
        //     this.priorityComplete = false;
        // }
        //console.log(`Creature ${this.creature.id} priority: ${newPriority}`);
        return newPriority;
    }

    
    prepareForNextPriority = () => {
        this.priorityComplete = false;
        this.previousPriority = this.priority;
        this.isSleeping = false;
        this.startNewAction = true;
    }

    didPriorityChange = (newPriority, oldPriority, showLog = false) => {
        if (newPriority !== oldPriority) {
            if (showLog) {
                console.log(`Priority changed for creature ${getCreatureIdentityString(this.creature)} from ${oldPriority} to ${newPriority}.`);
            }
            return true;
        }
        return false;
    }

    isPriorityComplete = (priority, creatures) => {
        switch (priority) {
            case ActionType.LEAVE_WORLD:
                if (this.creature.hasLeftWorld) {
                    return true;
                }
                break;
            case ActionType.DIE:
                if (this.creature.life.isDead === true) {
                    //console.log(`creature ${getCreatureIdentityString(this.creature)} is officially dead.`);
                    //this.displayCreatureNeedLevels();
                    return true;
                }
                break;
            case ActionType.BE_DEAD:
                return false;
            case ActionType.GATHER_FOOD_TO_MATE:
                if (!this.creature.safety.shelter || this.creature.safety.shelter.totalFoodEnergy >= this.foodRequiredToMate) {
                    this.foodPercentGoal = null;
                    return true;
                }
                break;
            case ActionType.MATE:
                if (this.creature.safety.shelter && this.creature.safety.shelter.isInsideShelter(this.creature)
                && this.creature.mating.isMating === false
                && (!this.creature.family.mate || (this.creature.family.mate.safety.shelter &&
                    this.creature.family.mate.safety.shelter.isInsideShelter(this.creature.family.mate) &&
                this.creature.family.mate.mating.isMating === false))) {
                    return true;
                }
                break;
            case ActionType.HAVE_CHILD:
                if (this.creature.mating.offspringCount === null) {
                    return true;
                }
                break;
            case ActionType.SLEEP_IN_SPOT:
                if (this.sleepLevel.percent >= 20) {
                    return true;
                }
                break;
            case ActionType.LEAVE_SHELTER:
                if (this.creature.safety.shelter === null) {
                    this.creature.safety.isLeavingShelter = false;
                    return true;
                }
                // let momsShelter = this.creature.family.mother !== null ? this.creature.family.mother.safety.shelter : null;
                // if ((this.creature.safety.shelter !== null && !this.creature.safety.shelter.isInsideShelter(this.creature)) ||
                //     (this.creature.safety.shelter === null && momsShelter === null) ||
                //     (!momsShelter.isInsideShelter(this.creature) && 
                //     isInPosition(this.creature.position, this.creature.targetPosition))) {
                //     return true;
                // }
                break;
            case ActionType.FIND_SAFETY:
                if (this.creature.safety.isInShelter &&
                    (!this.creature.safety.isBeingChased && !this.creature.safety.isPredatorDetected())) {
                    return true;
                }
                break;
            case ActionType.FIND_MATE:
                if ((this.creature.family.mate !== null && this.creature.family.mate.life.lifeStage !== LifeStage.DECEASED) ||
                !doesPotentialMateExist(this.creature, creatures)) {
                    return true;
                }
                break;
            case ActionType.FEED_SELF:
                if (this.foodPercentGoal === null || this.foodLevel.percent >= this.foodPercentGoal) {
                    this.foodPercentGoal = null;
                    return true;
                }
                break;
            case ActionType.FEED_FAMILY:
                if (this.foodPercentGoal === null || 
                    (this.familyFoodPercent >= this.foodPercentGoal &&
                        this.foodLevel.percent >= this.foodPercentGoal)) {
                    // console.log(`creature ${this.creature.id} feed family is complete` + 
                    // `\nFamily food percent: ${this.creature.needs.familyFoodPercent}\n goal: ${this.creature.needs.foodPercentGoal}` + 
                    // `\nCreature food percent: ${this.creature.needs.foodLevel.percent}`);
                    
                    this.foodPercentGoal = null;
                    return true;
                }
                break;
            case ActionType.SLEEP_IN_SHELTER:
                if (this.creature.safety.shelter !== null && this.creature.safety.shelter.isInsideShelter(this.creature) && this.sleepLevel.percent > 95) {
                    //console.log(`sleep in shelter complete for ${this.creature.id}`);
                    return true;
                }
                break;
            case ActionType.CREATE_SHELTER:
                if (this.creature.safety.shelter !== null) {
                    return true;
                }
                break;
            case ActionType.NONE:
                return true;
            default:
                break;
        }

        return false;
    }

    getPriorityOrder = () => {

        // if (this.creature.life.lifeStage === LifeStage.DECEASED) {
        //     console.log(`creature ${getCreatureIdentityString(this.creature)} is deceased`);
        // }
        
        // first check if priority is complete - if it's not then get from the shortened list to continue the priority
        if (!this.priorityComplete) {
            return this.getShortenedPriorityOrder();
        }

        // if it is complete, set priorityComplete back to false and determine a new priority
        this.prepareForNextPriority();

        // special priorities for  child and deceased
        if (this.creature.life.isDead) {
            return [
                {
                    meetsCondition: () => {
                            if (!this.creature.hasLeftWorld && isTimeToMoveOn(this.creature)) {
                                return true;
                            }
                        },
                    priority: ActionType.LEAVE_WORLD
                },
                {
                    meetsCondition: () => {
                            return true;
                        },
                    priority: ActionType.BE_DEAD
                }
            ]
        } else if (this.creature.life.lifeStage === LifeStage.CHILD && !this.isTechnicalAdult) {
            //console.log(`getting child priority order for creature ${getCreatureIdentityString(this.creature)}`);
            return this.getChildPriorityOrder();
        }

        // otherwise return the default
        return [
            {
                // TODO write if statement for if creature is eaten
                meetsCondition: () => { // death condition - old age, hunger 0, or gets eaten
                    if ((this.creature.safety.isBeingChased && this.creature.safety.isBeingEaten)
                        || this.foodLevel.points <= 0 || (this.creature.life.age > this.creature.life.lifeSpan)
                        || this.creature.life.LifeStage === LifeStage.DECEASED) {
                            assessCauseOfDeath(this.creature);
                        return true;
                    }
                    return false;
                },
                priority: ActionType.DIE
            },
            {
                meetsCondition: () => { // if sleep is less than 5%, they are going to sleep no matter what...
                    if (this.sleepLevel.percent <= 5) {
                        return true;
                    }
                    return false;
                },
                priority: ActionType.SLEEP_IN_SPOT
            },
            { // check if creature needs to leave the shelter - mainly for growing up
                meetsCondition: () => {
                    if (this.creature.safety.isLeavingShelter) {
                        return true;
                    }
                    return false;
                },
                priority: ActionType.LEAVE_SHELTER
            },
            {
                meetsCondition: () => { // TODO also search for threat
                    if (this.creature.safety.isBeingChased || this.creature.safety.isPredatorDetected()) {
                        return  true;
                    }
                    return false;
                },
                priority: ActionType.FIND_SAFETY // in this case, if there is no shelter find it first!
            },
            { // check if they're a target of a mate or they have a mating target - then prioritize finding that mate
                meetsCondition: () => {
                    if(this.creature.life.lifeStage !== LifeStage.CHILD &&
                        this.creature.family.mate === null && 
                        this.creature.life.lifeStage !== LifeStage.DECEASED
                        && (this.creature.mating.hasMateTarget || this.creature.mating.isMateTarget)) {
                            return true;
                        }
                        return false;
                },
                priority: ActionType.FIND_MATE
            },
            {
                meetsCondition: () => {
                    if (this.creature.safety.shelter === null) {
                        return true;
                    }
                    return false;
                },
                priority: ActionType.CREATE_SHELTER
            },
            {
                meetsCondition: () => {
                    if (this.foodLevel.percent <= 15) {
                        this.foodPercentGoal = 40;
                        return true;
                    }
                    return false;
                },
                priority: ActionType.FEED_SELF
            },
            {
                meetsCondition: () => { // if sleep is less than 10%
                    if (this.sleepLevel.percent <= 15) {
                        return true;
                    }
                    return false;
                },
                priority: ActionType.SLEEP_IN_SHELTER
            },
            {
                meetsCondition: () => {
                    if (this.foodLevel.percent > 15 &&
                        this.familyFoodPercent <= 20) {
                            this.foodPercentGoal = 40;
                            return true;
                        }
                        return false;
                },
                priority: ActionType.FEED_FAMILY
            },
            {
                meetsCondition: (creatures) => {
                    if(this.creature.life.lifeStage !== LifeStage.CHILD &&
                        (this.creature.family.mate === null || 
                        this.creature.family.mate.life.lifeStage === LifeStage.DECEASED)
                        && doesPotentialMateExist(this.creature, creatures)) {
                            return true;
                        }
                        return false;
                },
                priority: ActionType.FIND_MATE
            },
            { // if the creature is mating, make that the priority
                meetsCondition: () => {
                    if (this.creature.life.lifeStage !== LifeStage.CHILD &&
                        this.creature.family.mate !== null && this.creature.lifeStage !== LifeStage.DECEASED && 
                        this.creature.mating.isMating === true) {
                            //console.log(`creature ${this.creature.id} is mating with ${this.creature.family.mate.id}`);
                        return true;
                    }
                    return false;
                },
                priority: ActionType.MATE
            },
            { // if the creature is pregnant, have a child
                meetsCondition: () => {
                    if (this.creature.life.lifeStage !== LifeStage.CHILD &&
                        this.creature.mating.isPregnant) {
                        //console.log(`creature ${this.creature.id} is having a child`);
                        return true;
                    }
                    return false;
                },
                priority: ActionType.HAVE_CHILD
            },
            {
                meetsCondition: () => {
                    if (this.creature.life.lifeStage !== LifeStage.CHILD &&
                        this.creature.safety.shelter && this.creature.family.mate && 
                        !this.creature.family.mate.life.isDead &&
                        this.matingLevel.percent <= 20 &&
                        !this.creature.mating.canMate()) {
                        return true;
                    }
                    return false;
                },
                priority: ActionType.GATHER_FOOD_TO_MATE
            },
            {
                meetsCondition: () => {
                    if (this.sleepLevel.percent <= 30) {
                        return true;
                    }
                    return false;
                },
                priority: ActionType.SLEEP_IN_SHELTER
            },
            {
                meetsCondition: () => {
                    if (this.creature.life.lifeStage !== LifeStage.CHILD &&
                        this.matingLevel.percent <= 20 && 
                        this.creature.mating.canMate()) {
                        return true;
                    }
                    return false;
                },
                priority: ActionType.MATE
            },
            {
                meetsCondition: () => {
                    if (this.foodLevel.percent <= 40 || 
                        this.familyFoodPercent <= 40) {
                            this.foodPercentGoal = 60;
            //                 console.log(`creature ${this.creature.id} will FEED_FAMILY` + 
            //   `\nFamily food percent: ${this.creature.needs.familyFoodPercent}\n goal: ${this.creature.needs.foodPercentGoal}` + 
            //   `\nCreature food percent: ${this.creature.needs.foodLevel.percent}`);
                            return true;
                        }
                        return false;
                },
                priority: ActionType.FEED_FAMILY
            },
            {
                meetsCondition: () => { // if sleep is less than 10%
                    if (this.sleepLevel.percent <= 40) {
                        return true;
                    }
                    return false;
                },
                priority: ActionType.SLEEP_IN_SHELTER
            },
            {
                meetsCondition: () => {
                    if (this.foodLevel.percent <= 60 || 
                        this.familyFoodPercent <= 60) {
                            this.foodPercentGoal = 80;
                            // console.log(`creature ${this.creature.id} will FEED_FAMILY` + 
                            // `\nFamily food percent: ${this.creature.needs.familyFoodPercent}\n goal: ${this.creature.needs.foodPercentGoal}` + 
                            // `\nCreature food percent: ${this.creature.needs.foodLevel.percent}`);
                            return true;
                        }
                        return false;
                },
                priority: ActionType.FEED_FAMILY
            },
            {
                meetsCondition: () => { // if sleep is less than 10%
                    if (this.sleepLevel.percent <= 60) {
                        return true;
                    }
                    return false;
                },
                priority: ActionType.SLEEP_IN_SHELTER
            },
            {
                meetsCondition: () => {
                    if (this.foodLevel.percent <= 80 || 
                        this.familyFoodPercent <= 80) {
                            this.foodPercentGoal = 90;
                            return true;
                        }
                        return false;
                },
                priority: ActionType.FEED_FAMILY
            },
            {
                meetsCondition: () => { // if sleep is less than 10%
                    if (this.sleepLevel.percent <= 80) {
                        return true;
                    }
                    return false;
                },
                priority: ActionType.SLEEP_IN_SHELTER
            },
            {
                meetsCondition: () => {
                    if (this.foodLevel.percent <= 90 || 
                        this.familyFoodPercent <= 90) {
                            this.foodPercentGoal = 95;
                            return true;
                        }
                        return false;
                },
                priority: ActionType.FEED_FAMILY
            },
            // {
            //     meetsCondition: () => {
            //         if (this.matingLevel.percent <= 80 ) {
            //             return true;
            //         }
            //         return false;
            //     },
            //     priority: ActionType.MATE
            // },
            {
                meetsCondition: () => { // if sleep is less than 10%
                    if (this.sleepLevel.percent <= 95) {
                        return true;
                    }
                    return false;
                },
                priority: ActionType.SLEEP_IN_SHELTER
            },
            {
                meetsCondition: () => {
                    return true;
                },
                priority: ActionType.NONE
            }
        ];
    }

    getShortenedPriorityOrder = () => {
        return [
            {
                meetsCondition: () => {
                    if (this.creature.life.isDead) {
                        return true;
                    }
                },
                priority: ActionType.BE_DEAD
            },
            {
                // TODO write if statement for if creature is eaten
                meetsCondition: () => { // death condition - old age, hunger 0, or gets eaten
                    if ((this.creature.safety.isBeingChased && this.creature.safety.isBeingEaten)
                        || this.foodLevel.points <= 0 || (this.creature.life.age > this.creature.life.lifeSpan)
                        || this.creature.life.LifeStage === LifeStage.DECEASED) {
                            assessCauseOfDeath(this.creature);
                        return true;
                    }
                    return false;
                },
                priority: ActionType.DIE
            },
            {
                meetsCondition: () => { // if sleep is less than 5%, they are going to sleep no matter what...
                    if (this.sleepLevel.percent < 5 && this.priority !== ActionType.SLEEP_IN_SPOT) {
                        return true;
                    }
                    return false;
                },
                priority: ActionType.SLEEP_IN_SPOT
            },
            {
                meetsCondition: () => { // TODO also search for threat
                    if (this.priority !== ActionType.FIND_SAFETY &&
                        (this.creature.safety.isBeingChased || this.creature.safety.isPredatorDetected())) {
                        return  true;
                    }
                    return false;
                },
                priority: ActionType.FIND_SAFETY // in this case, if there is no shelter find it first!
            },
            {
                meetsCondition: () => { // food less than 15%;
                    if (this.foodLevel.percent <= 15 && 
                        this.priority !== ActionType.FEED_SELF) {
                            this.foodPercentGoal = 40;
                            return true;
                    }
                    return false;
                },
                priority: ActionType.FEED_SELF
            },
            {
                meetsCondition: () => { // food less than 20%;
                    if ((this.creature.life.lifeStage === LifeStage.CHILD && !this.isTechnicalAdult) ||
                        this.priority === ActionType.FEED_FAMILY 
                        // || 
                        // this.priority === ActionType.FIND_MATE ||
                        // this.priority === ActionType.GATHER_FOOD_TO_MATE || 
                        // this.priority === ActionType.HAVE_CHILD
                        ) {
                        return false;
                    }
                    if (this.foodLevel.percent > 15 &&
                        this.familyFoodPercent <= 20 && 
                        this.creature.safety.shelter !== null && 
                        this.creature.safety.shelter.inventory.food.length > 0) { // also check that there is food in shelter - a child should always have a shelter, otherwise they will die
                            this.foodPercentGoal = 40;
                            return true;
                    }
                    return false;
                },
                priority: ActionType.FEED_FAMILY
            },
            {
                meetsCondition: () => {
                    // if it gets to this point
                    return true;
                },
                priority: this.priority
            }
        ]
    }

    getChildPriorityOrder = () => {
        return [
            {
                meetsCondition: () => {
                    if (this.creature.life.isDead) {
                        return true;
                    }
                },
                priority: ActionType.BE_DEAD
            },
            {
                // TODO write if statement for if creature is eaten
                meetsCondition: () => { // death condition - old age, hunger 0, or gets eaten
                    if ((this.creature.safety.isBeingChased && this.creature.safety.isBeingEaten)
                        || this.foodLevel.points <= 0 || (this.creature.life.age > this.creature.life.lifeSpan)
                        || this.creature.life.LifeStage === LifeStage.DECEASED) {
                            assessCauseOfDeath(this.creature);
                        return true;
                    }
                    return false;
                },
                priority: ActionType.DIE
            },
            {
                meetsCondition: () => { // if sleep is less than 5%, they are going to sleep no matter what...
                    if (this.sleepLevel.percent < 5) {
                        return true;
                    }
                    return false;
                },
                priority: ActionType.SLEEP_IN_SPOT
            },
            {
                meetsCondition: () => { // food less than 20%;
                    if (this.foodLevel.percent < 15 && 
                        this.creature.safety.shelter !== null && 
                        this.creature.safety.shelter.inventory.food.length > 0) { // also check that there is food in shelter - a child should always have a shelter, otherwise they will die
                        this.foodPercentGoal = 40;
                            return true;
                    }
                    return false;
                },
                priority: ActionType.FEED_SELF
            },
            {
                meetsCondition: () => { // sleep less than 20%;
                    if (this.sleepLevel.percent <= 20) {
                        return true;
                    }
                    return false;
                },
                priority: ActionType.SLEEP_IN_SHELTER
            },
            {
                meetsCondition: () => { // food less than 20%;
                    if (this.foodLevel.percent < 50 && 
                        this.creature.safety.shelter !== null && 
                        this.creature.safety.shelter.inventory.food.length > 0) { // also check that there is food in shelter - a child should always have a shelter, otherwise they will die
                        this.foodPercentGoal = 75;
                            return true;
                    }
                    return false;
                },
                priority: ActionType.FEED_SELF
            },
            {
                meetsCondition: () => {
                    if (this.sleepLevel.percent < 40) {
                        return true;
                    }
                    return false;
                },
                priority: ActionType.SLEEP_IN_SHELTER
            },
            {
                meetsCondition: () => { // food less than 20%;
                    if (this.foodLevel.percent < 70 && 
                        this.creature.safety.shelter !== null && 
                        this.creature.safety.shelter.inventory.food.length > 0) { // also check that there is food in shelter - a child should always have a shelter, otherwise they will die
                        this.foodPercentGoal = 95;
                            return true;
                    }
                    return false;
                },
                priority: ActionType.FEED_SELF
            },
            {
                meetsCondition: () => {
                    if (this.sleepLevel.percent < 75) {
                        return true;
                    }
                    return false;
                },
                priority: ActionType.SLEEP_IN_SHELTER
            },
            {
                meetsCondition: () => {
                    // if it gets to this point
                    return true;
                },
                priority: ActionType.NONE
            }
        ]
    }

    updateNeedLevels = (foodPoints, sleepPoints, matingPoints) => {
        this.foodLevel.points = foodPoints > this.maxFood ? this.maxFood : foodPoints;
        this.foodLevel.percent = this.determineNeedPercent(foodPoints, this.maxFood);

        this.sleepLevel.points = sleepPoints;
        this.sleepLevel.percent = this.determineNeedPercent(sleepPoints, this.maxSleep);

        this.matingLevel.points = matingPoints;
        this.matingLevel.percent = this.determineNeedPercent(matingPoints, this.maxMating);
    }

    determineNeedPercent = (level, maxLevel) => {
        let divided = level / maxLevel;
        let percent = divided * 100;
        return (roundToPlace(percent, 2));
    }

    determineFamilyFoodPercent = () => {
        let shelterFood = this.creature.safety.shelter ? this.creature.safety.shelter.totalFoodEnergy : 0;
        let needTotal = getTotalFoodPointsNeededForFamily(this.creature);

        let percent = (shelterFood / needTotal) * 100;
        return percent;

    }

    
    // determineFamilyFoodPercentAverage = () => {
    //     let memberCount = 0;
    //     let foodTotal = 0;

    //     // parents don't live with family (unless elder? For now they don't so don't worry about them--YET)
    //     // ACTUALLY, just add all family members. If they live in that shelter, count them.
    //     let members = [this.creature.family.mate];
    //     this.creature.family.children.forEach(c => { // don't feel grown children
    //         members.push(c);
    //     });
    //     members.push(this.creature.family.mother);
    //     members.push(this.creature.family.father);

    //     // loop through members
    //     members.forEach(m => {
    //         if (m !== null && m.life.lifeStage !== LifeStage.DECEASED && 
    //             m.safety.shelter === this.creature.safety.shelter) {
    //                 memberCount++;
    //                 foodTotal += m.needs.foodLevel.percent;
    //             }
    //     })

    //     // find the average and return
    //     let average = foodTotal / memberCount;
    //     return average;

    // }
}