import { LifeStage, Gender, CreatureDefaults, TimeProps } from "../../../constants/creatureConstants";
import { millisecondsToMinutes, blendColors, roundToPlace, calculateMsPerYear } from "../../universalLogic";

export default class CreatureLife { // TODO - make the creature grow up - and perform actions if they do
    constructor(creature, lifeSpanRange, initialStage, fractionOfLifeAsChild, fractionOfLifeAsElder) {
        this.lifeSpanRange = lifeSpanRange;
        this.maxYears = lifeSpanRange.high;
        this.lifeSpan = this.determineLifeSpan(lifeSpanRange);
        this.stageRanges = { // each one has a start and end property - elder ends with null
            child: {stage: LifeStage.CHILD, range: this.determineStageRange(LifeStage.CHILD, this.lifeSpan, fractionOfLifeAsChild, fractionOfLifeAsElder)},
            adult: {stage: LifeStage.ADULT, range: this.determineStageRange(LifeStage.ADULT, this.lifeSpan, fractionOfLifeAsChild, fractionOfLifeAsElder)},
            elder: {stage: LifeStage.ELDER, range: this.determineStageRange(LifeStage.ELDER, this.lifeSpan, fractionOfLifeAsChild, fractionOfLifeAsElder)},
            deceased: {stage: LifeStage.DECEASED, range: this.determineStageRange(LifeStage.DECEASED, this.lifeSpan, fractionOfLifeAsChild, fractionOfLifeAsElder)}
        }

        this.creature = creature;
        this.age = this.determineInitialAge(initialStage);
        this.lifeStage = initialStage;
        this.birthTime = Date.now() - this.age;

        this.isDead = false;
        this.timeOfDeath = null;

        this.msPerYear = TimeProps.MS_PER_DAY; // it's like the sims where a day is one year but it still functions like one day with the same number of hours
        this.msPerHour = TimeProps.MS_PER_DAY / TimeProps.HOURS_PER_DAY;

        // test
        this.intervals = 0;

    }

    // this should happen every time the creature gets updated
    updateLife = () => {
        this.age = this.determineAge();
        let newStage = this.determineLifeStage();
        if (newStage !== this.lifeStage && this.lifeStage === LifeStage.CHILD && newStage === LifeStage.ADULT) {
            this.creature.safety.isLeavingShelter = true;
        }
        this.lifeStage = newStage;
        this.creature.color = this.determineColor();
        let newSize = this.determineSize();
        this.updateSize(newSize);
        this.creature.energy = this.determineEnergy();
        this.checkToLeaveWorld();

        // test
        // this.intervals++;
        // if ((this.intervals < 11 && this.intervals % 10 === 0) || this.intervals % 100 === 0) {
        //     this.showAgingInfo();
        // }
    }

    checkToLeaveWorld = () => {
        if (!this.creature.hasLeftWorld && this.isDead && this.timeOfDeath !== null &&
            Date.now() - this.timeOfDeath >= CreatureDefaults.TIME_BEFORE_LEAVING_WORLD) {
                this.creature.hasLeftWorld = true;
        }
    }

    showAgingInfo = () => {
        console.log(`creatureId: ${this.creature.id}`);
        console.log(`Stage: ${this.lifeStage}`);
        console.log(`Size: ${this.creature.size}`);
        console.log(`Age: ${millisecondsToMinutes(this.age)}`);
        console.log(`Lifespan: ${millisecondsToMinutes(this.lifeSpan)}`);
        let ageToStartGrowing = this.determineAgeToStartGrowing();
        if (this.age < ageToStartGrowing) {
            console.log(`Time until growth starts: ${millisecondsToMinutes(ageToStartGrowing - this.age)}`);
            console.log(`Age to start growing: ${millisecondsToMinutes(ageToStartGrowing)}`);
        }
        console.log(`Time to next stage: ${millisecondsToMinutes(this.determineTimeToNextStage())}`);
        console.log(`Age to Become Adult: ${millisecondsToMinutes(this.stageRanges.adult.range.start)}`);
        console.log(`Age to Become Elder: ${millisecondsToMinutes(this.stageRanges.elder.range.start)}`);
        console.log(`Age to Die: ${millisecondsToMinutes(this.stageRanges.deceased.range.start)}`);
        console.log('------------------------');
    }

    determineTimeToNextStage = () => {
        let nextStage = this.determineNextStage();
        switch (nextStage) {
            default:
                return 0;
            case LifeStage.ADULT:
                return this.stageRanges.adult.range.start - this.age;
            case LifeStage.ELDER:
                return this.stageRanges.elder.range.start - this.age;
            case LifeStage.DECEASED:
                return this.stageRanges.deceased.range.start - this.age;
        }
    }

    determineNextStage = () => {
        switch(this.lifeStage) {
            case LifeStage.CHILD:
                return LifeStage.ADULT;
            case LifeStage.ADULT:
                return LifeStage.ELDER;
            case LifeStage.ELDER:
                return LifeStage.DECEASED;
            default:
            case LifeStage.DECEASED: // TODO do we want it to disappear or what? Consider changing colors with different stages slightly?
                return null;
        }
    }
    determineEnergy = () => {
        switch (this.lifeStage) {
            case LifeStage.CHILD:
                return this.determineChildEnergy();
            default:
            case LifeStage.ADULT:
            case LifeStage.ELDER:
                return this.creature.adultEnergy;
            case LifeStage.DECEASED: // keep it the same as what it was before death
            return this.creature.energy;
        }
    }

    determineSize = () => {
        switch (this.lifeStage) {
            case LifeStage.CHILD:
                return this.determineChildSize();
            default:
            case LifeStage.ADULT:
                return this.creature.adultSize;
            case LifeStage.ELDER:
                return this.determineElderSize();
            case LifeStage.DECEASED:
            return this.determineDeceasedSize();
        }
    }

    determineColor = () => {
        let def = this.creature.adultColor;

        if (CreatureDefaults.ALTER_COLOR_BY_GENDER) {
            switch(this.creature.gender) {
                case Gender.MALE:
                    def = blendColors(def, CreatureDefaults.MALE_COLOR, CreatureDefaults.GENDER_BLEND_AMOUNT);
                    break;
                case Gender.FEMALE:
                    def = blendColors(def, CreatureDefaults.FEMALE_COLOR, CreatureDefaults.GENDER_BLEND_AMOUNT);
                    break;
                default:
                    break;
            }
        }

        switch (this.lifeStage) {
            case LifeStage.CHILD:
                return def;
            default:
            case LifeStage.ADULT:
                return def;
            case LifeStage.ELDER:
                return this.determineElderColor(def);
            case LifeStage.DECEASED:
                return this.determineDeceasedColor(def);
        }
    }

    determineElderColor = (def) => {
        let c = blendColors(def, CreatureDefaults.DEATH_COLOR, .2);
        return c;
    }

    determineDeceasedColor = (def) => {
        //let c = blendColors(def, CreatureDefaults.DEATH_COLOR, .6);
        let c = CreatureDefaults.DEATH_COLOR;
        return c;
    }

    determineChildSize = () => {
        // determine what percentage the child has grown to an adult
        let fullGrownAge = this.stageRanges.adult.range.start;

        // if they're not a child, return the full grown size
        if (this.age >= fullGrownAge) {
            return this.creature.adultSize;
        }

        // otherwise, determine the percent
        let growthFraction = this.age / fullGrownAge;

        // now determine the size
        let newSize = this.creature.adultSize * growthFraction;

        // don't let it be less than min
        let minSize = this.creature.adultSize * CreatureDefaults.CHILD_MIN_FRACTION;
        minSize = minSize < CreatureDefaults.CHILD_MIN ? CreatureDefaults.CHILD_MIN : minSize;
        if (newSize < minSize) {
            newSize = minSize;
        }

        // round and return
        return roundToPlace(newSize, 1);
    }

    determineChildEnergy = () => {
        let energy = Math.round(this.creature.adultEnergy * ( 3 / 4));
        return energy;
    }

    determineAgeToStartGrowing = () => {
        let fullGrownAge = this.stageRanges.adult.range.start;

        // figure out growthFraction first
        let minSize = this.creature.adultSize * CreatureDefaults.CHILD_MIN_FRACTION;
        minSize = minSize < CreatureDefaults.CHILD_MIN ? CreatureDefaults.CHILD_MIN : minSize;
        let growthFraction = minSize / this.creature.adultSize;

        // now determine the age to get that big
        let age = growthFraction * fullGrownAge;

        return age;
    }

    determineElderSize = () => {
        let chipAwayAmount = roundToPlace(this.creature.adultSize * CreatureDefaults.ELDER_SHRINK, 1);

        return this.creature.adultSize - chipAwayAmount;
    }

    determineDeceasedSize = () => {
        if (this.creature.size < this.creature.adultSize) {
            return this.creature.size;
        }

        let chipAwayAmount = roundToPlace(this.creature.adultSize * CreatureDefaults.DECEASED_SHRINK, 1);
        
        return this.creature.adultSize - chipAwayAmount;
    }

    updateSize = (newSize) => {
        this.creature.size = newSize;
        this.creature.width = newSize;
        this.creature.height = newSize;
    }

    determineLifeStage = () => {
        if (this.lifeStage === LifeStage.DECEASED) {
            return LifeStage.DECEASED;
        }

        let ranges = [this.stageRanges.child, this.stageRanges.adult, this.stageRanges.elder, this.stageRanges.deceased];
        for (let i = 0; i < ranges.length; i++) {
            let s = ranges[i];
            if (this.age >= s.range.start && (s.range.end === null || this.age < s.range.end)) {
                return s.stage;
            }
        }
    }

    determineAge = () => {
        let now = Date.now();
        return now - this.birthTime;
    }

    determineInitialAge = (initialStage) => {
        switch(initialStage) {
            default:
            case LifeStage.CHILD:
                return this.stageRanges.child.range.start;
            case LifeStage.ADULT:
                return this.stageRanges.adult.range.start;
            case LifeStage.ELDER:
                return this.stageRanges.elder.range.start;
            case LifeStage.DECEASED:
                return this.stageRanges.deceased.range.start;
        }
    }

    determineLifeSpan = (range) => {
        let maxMs = range.high * TimeProps.MS_PER_DAY;
        let minMs = range.low * TimeProps.MS_PER_DAY;
        let difference = maxMs - minMs;
        let random = Math.floor(Math.random() * difference);
        let result = random + minMs;
        return result;
    }

    determineStageRange = (stage, lifeSpan, fractionAsChild, fractionAsElder) => {
        let childSpan = lifeSpan * fractionAsChild;
        let elderSpan = lifeSpan * fractionAsElder;
        let adultSpan = lifeSpan - childSpan - elderSpan;

        switch (stage) {
            case LifeStage.CHILD:
                return {
                    start: 0,
                    end: childSpan
                }
            case LifeStage.ADULT:
                return {
                    start: childSpan,
                    end: childSpan + adultSpan
                }
            case LifeStage.ELDER:
                return {
                    start: childSpan + adultSpan,
                    end: lifeSpan
                }
            case LifeStage.DECEASED:
                return {
                    start: lifeSpan,
                    end: null
                }
        }
    }
}