import { PlantSpecies } from "./plantConstants";
import { minutesToMilliseconds } from "../logic/universalLogic";
import { GeneticDefaults } from "./geneticConstants";
import { CanvasDefaults } from "./canvasConstants";

export const Direction = {
    NORTH: "NORTH",
    SOUTH: "SOUTH",
    EAST: "EAST",
    WEST: "WEST",
    NONE: "NONE"
};

export const MoveMode = {
    STAND_STILL: "STAND_STILL",
    TOWARD_POINT: "TOWARD_POINT",
    SEARCH: "SEARCH",
    HIDE: "HIDE",
    WANDER: "WANDER",
    GO_TO_SHELTER: "GO_TO_SHELTER",
    COMPLETE_MATING: "COMPLETE_MATING",
    THINK: "THINK", // for determining the next action,
    NONE: "NONE"
};

export const SleepProps = {
    HOURS_PER_YEAR: 24,
    HOURS_FOR_FULL_RESTORE: 8
}

export const TimeProps = {
    HOURS_PER_DAY: 24,
    MS_PER_DAY: minutesToMilliseconds(2)
}

export const CreatureDefaults = {
    SHOW_LINES: false,
    MUTATE_GENES: true,
    SET_UP_GENES: true,
    ALTER_COLOR_BY_GENDER: false,
    MOVE_MODE:  MoveMode.THINK,
    LARGEST_SIZE: GeneticDefaults.MAX_SIZE * CanvasDefaults.RESIZE_FACTOR,
    MAX_MOVE_RECORDINGS: 50,
    PATTERN_DETECTION_SIZE: 5,
    CHILD_MIN_FRACTION: .2,
    CHILD_MIN: 2.5,
    ELDER_SHRINK: .1,
    DECEASED_SHRINK: .25,
    DEATH_COLOR: "#808080",
    FEMALE_COLOR: "#F020D1",
    MALE_COLOR: "#001CDA",
    GENDER_BLEND_AMOUNT: .15,
    INTERVALS_BEFORE_NEW_TARGET_POSITION: 30,
    TIME_BEFORE_LEAVING_WORLD: TimeProps.MS_PER_DAY / 2
}

export const Gender = {
    MALE: "MALE",
    FEMALE: "FEMALE"
}

export const LifeStage = {
    CHILD: "CHILD",
    ADULT: "ADULT",
    ELDER: "ELDER",
    DECEASED: "DECEASED"
}

export const CauseOfDeath = {
    OLD_AGE: "OLD_AGE",
    STARVATION: "STARVATION",
    WAS_EATEN: "WAS_EATEN",
    UNKNOWN: "UNKNOWN"
}

export const AmountNeeded = {
    MIN: "MIN",
    AVG: "AVG",
    MAX: "MAX"
}

export const ActionType = {
    FIND_SAFETY: "FIND_SAFETY",
    FEED_SELF: "FEED_SELF", // if shelter, and food in shelter, eat food in shelter, otherwise eat outside shelter
    FEED_FAMILY: "FEED_FAMILY", // bring food to shelter, eat from shelter if hunger over 20%
    CREATE_SHELTER: "CREATE_SHELTER",
    LEAVE_SHELTER: "LEAVE_SHELTER",
    SLEEP_IN_SHELTER: "SLEEP_IN_SHELTER",
    SLEEP_IN_SPOT: "SLEEP_IN_SPOT",
    FIND_MATE: "FIND_MATE",
    GATHER_FOOD_TO_MATE: "GATHER_FOOD_TO_MATE",
    MATE: "MATE",
    PRODUCE_OFFSPRING: "PRODUCE_OFFSPRING",
    HAVE_CHILD: "HAVE_CHILD",
    DIE: "DIE",
    BE_DEAD: "BE_DEAD",
    LEAVE_WORLD: "LEAVE_WORLD",
    NONE: "NONE"
}

export const NeedType = {
    FOOD_FOR_SELF: "FOOD_FOR_SELF",
    FOOD_FOR_FAMILY: "FOOD_FOR_FAMILY",
    FOOD_TO_MATE: "FOOD_TO_MATE",
    SHELTER: "SHELTER",
    ESCAPE: "ESCAPE",
    SLEEP: "SLEEP",
    MATE: "MATE",
    NONE: "NONE"
}
export const AddOrSubtract = {
    ADD: "ADD",
    SUBTRACT: "SUBTRACT"
}

export const InventoryLocation = {
    CREATURE: "CREATURE",
    SHELTER: "SHELTER"
}

export const CreatureType = {
    BOOP: "BOOP",
    BLEEP: "BLEEP",
    BIDDY: "BIDDY",
    DUDIT: "DUDIT",
    PYGMY: "PYGMY",
    GRIBBIT: "GRIBBIT",
};

export const CreatureTypeList = [
    CreatureType.GRIBBIT,
    CreatureType.BOOP,
    CreatureType.BLEEP,
    CreatureType.BIDDY,
    CreatureType.DUDIT,
    CreatureType.PYGMY,
];

export const Boop = {
    type: CreatureType.BOOP,
    letterCode: 'A',
    color: "#A020F0",
    food: {
        plants: [
            PlantSpecies.SHRUB,
            PlantSpecies.WHEAT,
            PlantSpecies.BUD,
            PlantSpecies.WEED
        ],
        prey: []
    },
    energy: 20,
    size: 15,
    sightRadius: 20,
    sightDistance: 60,
    speed: 5,
    lifeSpanRange: {
        low: 60,
        high: 90
    },
    fractionAsChild: .20,
    fractionAsElder: .20,
    sleepNeeded: 8,
    foodNeeded: 3,
    matingNeeded: 5, // how many days before it's needed again
    genderOfShelterMaker: Gender.FEMALE,
    canHaveMultipleLitters: true,
    minOffspring: 1,
    maxOffspring: 3,
    description: "A long living herbivore that will keep your lawn cleared. TODO add family trait."
};

export const Bleep = {
    type: CreatureType.BLEEP,
    letterCode: 'B',
    color: "#03BB85",
    food: {
    plants: [PlantSpecies.WEED],
    prey: [CreatureType.BIDDY]
    },
    energy: 15,
    size: 8,
    sightRadius: 30,
    sightDistance: 60,
    speed: 7,
    lifeSpanRange: {
        low: 10,
        high: 15
    },
    fractionAsChild: .1,
    fractionAsElder: .15,
    sleepNeeded: 6,
    foodNeeded: 2,
    matingNeeded: 3,
    genderOfShelterMaker: Gender.MALE,
    canHaveMultipleLitters: false,
    minOffspring: 2,
    maxOffspring: 5,
    description: "An omnivore with a limited palette."
};

export const Biddy = {
    type: CreatureType.BIDDY,
    letterCode: 'C',
    color: "#AD1360",
    food: {
    plants: [PlantSpecies.BUD],
    prey: []
    },
    energy: 15,
    size: 5,
    sightRadius: 50,
    sightDistance: 50,
    speed: 7,
    lifeSpanRange: {
        low: 7,
        high: 15
    },
    fractionAsChild: .05,
    fractionAsElder: .15,
    sleepNeeded: 5,
    foodNeeded: 2,
    matingNeeded: 2,
    genderOfShelterMaker: Gender.MALE,
    canHaveMultipleLitters: false,
    minOffspring: 3,
    maxOffspring: 7,
    description: "A tiny creature that outwits predators with speed and large families. Relies on one beloved plant."
};

export const Dudit = {
    type: CreatureType.DUDIT,
    letterCode: 'D',
    color: "#ffd736",
    food: {
    plants: [],
    prey: [CreatureType.BOOP, CreatureType.BLEEP, CreatureType.BIDDY]
    },
    energy: 20,
    size: 15,
    sightRadius: 70,
    sightDistance: 40,
    speed: 6.5,
    lifeSpanRange: {
        low: 10,
        high: 25
    },
    fractionAsChild: .15,
    fractionAsElder: .15,
    sleepNeeded: 8,
    foodNeeded: 1,
    matingNeeded: 3,
    genderOfShelterMaker: Gender.MALE,
    canHaveMultipleLitters: false,
    minOffspring: 1,
    maxOffspring: 3,
    description: "A menacing predator on the lookout. TODO Add thief trait."
};

export const Pygmy = {
    type: CreatureType.PYGMY,
    letterCode: 'E',
    color: "#10AAAB",
    food: {
        plants: [
            PlantSpecies.SHRUB,
            PlantSpecies.WHEAT,
            PlantSpecies.BUD,
            PlantSpecies.WEED
        ],
        prey: []
    },
    energy: 6,
    size: 6,
    sightRadius: 30,
    sightDistance: 70,
    speed: 5,
    lifeSpanRange: {
        low: 2,
        high: 5
    },
    fractionAsChild: .15,
    fractionAsElder: .15,
    sleepNeeded: 4,
    foodNeeded: 3,
    matingNeeded: 0.75,
    genderOfShelterMaker: Gender.FEMALE,
    canHaveMultipleLitters: false,
    minOffspring: 2,
    maxOffspring: 5,
    description: "A pesky little critter that is great for studying genetics."
};

export const Gribbit = {
    type: CreatureType.GRIBBIT,
    letterCode: 'F',
    color: "#bbff00",
    food: {
    plants: [],
    prey: [CreatureType.PYGMY, CreatureType.BIDDY]
    },
    energy: 15,
    size: 10,
    sightRadius: 40,
    sightDistance: 70,
    speed: 8,
    lifeSpanRange: {
        low: 15,
        high: 25
    },
    fractionAsChild: .08,
    fractionAsElder: .20,
    sleepNeeded: 6,
    foodNeeded: 3,
    matingNeeded: 1,
    genderOfShelterMaker: Gender.MALE,
    canHaveMultipleLitters: true,
    minOffspring: 1,
    maxOffspring: 3,
    description: "Can you say pest control?"
};

export const AllCreatureDefaults = [
    Boop,
    Bleep,
    Biddy,
    Dudit,
    Pygmy,
    Gribbit,
];

AllCreatureDefaults.forEach(c => {
    c.size = c.size * CanvasDefaults.RESIZE_FACTOR;
});


export const StartingCreatureDefaults = [
    {
        type: Boop,
        gender: Gender.FEMALE,
        count: 2
    },
    {
        type: Boop,
        gender: Gender.MALE,
        count: 2
    },
    {
        type: Bleep,
        gender: Gender.FEMALE,
        count: 1
    },
    {
        type: Bleep,
        gender: Gender.MALE,
        count: 1
    },
    {
        type: Biddy,
        gender: Gender.FEMALE,
        count: 3
    },
    {
        type: Biddy,
        gender: Gender.MALE,
        count: 3
    },
    {
        type: Gribbit,
        gender: Gender.FEMALE,
        count: 1
    },
    {
        type: Gribbit,
        gender: Gender.MALE,
        count: 1
    },
    {
        type: Pygmy,
        gender: Gender.FEMALE,
        count: 2
    },
    {
        type: Pygmy,
        gender: Gender.MALE,
        count: 2
    },
];

export const Creatures = [];

export const PassedOnCreatures = [];