import { addToRGBValues,
    alterColorDarkOrLight,
    canColorChangeRequirementBeMet,
    getRandomDecimalInRange,
    getRandomIntInRange, 
    roundToPlace} from "../logic/universalLogic"
    import { CanvasDefaults } from "./canvasConstants"


export const GeneticDefaults = {
    GENERATIONS_TO_BECOME_DOMINANT: 4,
    
    CHANCE_OF_MUTATION: .33,
    POSSIBLE_RECESSIVE_MUTATIONS: 3,
    ATTEMPTS_TO_MUTATE_ALLOWED: 15,

    MIN_SPEED: 1,
    MAX_SPEED: 14,
    SPEED_CHANGE_MIN: .10,
    SPEED_CHANGE_MAX: .20,

    MIN_SIZE: 4 * CanvasDefaults.RESIZE_FACTOR,
    MAX_SIZE: 20 * CanvasDefaults.RESIZE_FACTOR,
    SIZE_CHANGE_MIN: .10,
    SIZE_CHANGE_MAX: .20,

    COLOR_CHANGE_MIN: 15,
    COLOR_CHANGE_MAX: 40,
    VALUE_CHANGE_MIN: 15,
    VALUE_CHANGE_MAX: 40,
    COLOR_DIFFERENCE_REQUIREMENT: 15
}

export const Dominance = {
    DOMINANT: "DOMINANT",
    RECESSIVE: "RECESSIVE"
}

//#region  misc
export const ColorType = {
    R: "R",
    G: "G",
    B: "B",
    DARKER: "DARKER",
    LIGHTER: "LIGHTER"
}

export const AddOrSubtract = {
    ADD: "ADD",
    SUBTRACT: "SUBTRACT"
}

//#endregion

// genes and accompanying traits

export const GeneType = {
    COLOR: "COLOR",
    SIZE: "SIZE",
    SPEED: "SPEED"
}

//#region SPEED
// --traits
export const SPEED_DEFAULT = {
    name: "DEFAULT",
    letterCode: "a",
    dominance: Dominance.DOMINANT,
    isMutation: false,
    alter: () => {
        return;
    },
    canHaveTrait: () => {
        return true;
    }
}

export const FASTER = {
    name: "FASTER",
    letterCode: "b",
    dominance: Dominance.RECESSIVE,
    isMutation: true,
    alter: (creature, variables) => {
        if (variables === null) {
            variables = {
                changePercent: 1 + getRandomDecimalInRange(
                    GeneticDefaults.SPEED_CHANGE_MIN,
                    GeneticDefaults.SPEED_CHANGE_MAX)
            }
        }
        // let changePercent = 1 + getRandomDecimalInRange(
        //     GeneticDefaults.SPEED_CHANGE_MIN,
        //     GeneticDefaults.SPEED_CHANGE_MAX);
        let newSpeed = creature.movement.speed * variables.changePercent;
        if (newSpeed > GeneticDefaults.MAX_SPEED) {
            newSpeed = GeneticDefaults.MAX_SPEED;
        }
        creature.movement.speed = roundToPlace(newSpeed, 2);
    },
    canHaveTrait: (creature) => {
        let minNewSpeed = (1 + GeneticDefaults.SPEED_CHANGE_MIN) * creature.movement.speed;
        if (minNewSpeed > GeneticDefaults.MAX_SPEED) {
            return false;
        } else {
            return true;
        }
    }
}

export const SLOWER = {
    name: "SLOWER",
    letterCode: "c",
    dominance: Dominance.RECESSIVE,
    isMutation: true,
    alter: (creature, variables) => {
        if (variables === null) {
            variables = {
                changePercent: 1 - getRandomDecimalInRange(
                    GeneticDefaults.SPEED_CHANGE_MIN,
                    GeneticDefaults.SPEED_CHANGE_MAX)
            }
        }
        // let changePercent = 1 - getRandomDecimalInRange(
        //     GeneticDefaults.SPEED_CHANGE_MIN,
        //     GeneticDefaults.SPEED_CHANGE_MAX);
        let newSpeed = creature.movement.speed * variables.changePercent;
        if (newSpeed < GeneticDefaults.MIN_SPEED) {
            newSpeed = GeneticDefaults.MIN_SPEED;
        }
        creature.movement.speed = roundToPlace(newSpeed, 2);
    },
    canHaveTrait: (creature) => {
        let maxNewSpeed = (1 - GeneticDefaults.SPEED_CHANGE_MIN) * creature.movement.speed;
        if (maxNewSpeed < GeneticDefaults.MIN_SPEED) {
            return false;
        } else {
            return true;
        }
    }
}

// --gene
export const SPEED_GENE = {
    name: "SPEED_GENE",
    geneType: GeneType.SPEED,
    letterCode: "A",
    dominantTraits: [SPEED_DEFAULT],
    recessiveTraits: [
        FASTER,
        SLOWER
    ]
}

//#endregion

//#region SIZE
// --traits
export const SIZE_DEFAULT = {
    name: "DEFAULT",
    letterCode: "a",
    dominance: Dominance.DOMINANT,
    isMutation: false,
    alter: () => {
        return;
    },
    canHaveTrait: () => {
        return true;
    }
}

export const LARGER = {
    name: "LARGER",
    letterCode: "b",
    dominance: Dominance.RECESSIVE,
    isMutation: true,
    alter: (creature, variables) => {
        if (variables === null) {
            variables = {
                changePercent: 1 + getRandomDecimalInRange(
                    GeneticDefaults.SIZE_CHANGE_MIN,
                    GeneticDefaults.SIZE_CHANGE_MAX)
            }
        }
        // let changePercent = 1 + getRandomDecimalInRange(
        //     GeneticDefaults.SIZE_CHANGE_MIN,
        //     GeneticDefaults.SIZE_CHANGE_MAX);
        let newSize = creature.adultSize * variables.changePercent;
        if (newSize > GeneticDefaults.MAX_SIZE) {
            newSize = GeneticDefaults.MAX_SIZE;
        }
        creature.adultSize = roundToPlace(newSize, 2);
        creature.size = creature.life.determineSize();
    },
    canHaveTrait: (creature) => {
        let minNewSize = (1 + GeneticDefaults.SIZE_CHANGE_MIN) * creature.adultSize;
        if (minNewSize > GeneticDefaults.MAX_SIZE) {
            return false;
        } else {
            return true;
        }
    }
}

export const SMALLER = {
    name: "SMALLER",
    letterCode: "c",
    dominance: Dominance.RECESSIVE,
    isMutation: true,
    alter: (creature, variables) => {
        if (variables === null) {
            variables = {
                changePercent: 1 - getRandomDecimalInRange(
                    GeneticDefaults.SIZE_CHANGE_MIN,
                    GeneticDefaults.SIZE_CHANGE_MAX)
            }
        }
        // let changePercent = 1 - getRandomDecimalInRange(
        //     GeneticDefaults.SIZE_CHANGE_MIN,
        //     GeneticDefaults.SIZE_CHANGE_MAX);
        let newSize = creature.adultSize * variables.changePercent;
        if (newSize < GeneticDefaults.MIN_SIZE) {
            newSize = GeneticDefaults.MIN_SIZE;
        }
        creature.adultSize = roundToPlace(newSize, 2);
        creature.size = creature.life.determineSize();
    },
    canHaveTrait: (creature) => {
        let maxNewSize = (1 - GeneticDefaults.SIZE_CHANGE_MIN) * creature.adultSize;
        if (maxNewSize < GeneticDefaults.MIN_SIZE) {
            return false;
        } else {
            return true;
        }
    }
}

// --gene
export const SIZE_GENE = {
    name: "SIZE_GENE",
    letterCode: "B",
    geneType: GeneType.SIZE,
    dominantTraits: [SIZE_DEFAULT],
    recessiveTraits: [
        LARGER,
        SMALLER
    ]
}

//#endregion

//#region COLOR

// --traits
export const COLOR_DEFAULT = {
    name: "DEFAULT",
    letterCode: "a",
    dominance: Dominance.DOMINANT,
    isMutation: false,
    alter: () => {
        return;
    },
    canHaveTrait: () => {
        return true;
    }
}

export const MORE_RED = {
    name: "MORE_RED",
    letterCode: "b",
    dominance: Dominance.RECESSIVE,
    isMutation: true,
    alter: (creature, variables) => {
        let originalColor = creature.adultColor;

        if (variables === null) {
            variables = {
                changeAmount: getRandomIntInRange(GeneticDefaults.COLOR_CHANGE_MIN, GeneticDefaults.COLOR_CHANGE_MAX)
            
            }
        }
        //let changeAmount = getRandomIntInRange(GeneticDefaults.COLOR_CHANGE_MIN, GeneticDefaults.COLOR_CHANGE_MAX);
        //let halfAmount = -1 * Math.ceil(changeAmount / 2);
        let oppositeAmount = -1 * variables.changeAmount;

        //let newColor = alterColorByAmount(originalColor, ColorType.R, changeAmount);
        let newColor = addToRGBValues(originalColor, variables.changeAmount, oppositeAmount, oppositeAmount);

        creature.adultColor = newColor;
        creature.color = creature.life.determineColor();
    },
    canHaveTrait: (creature) => {
        let result = canColorChangeRequirementBeMet(
            creature.adultColor,
            ColorType.R,
            AddOrSubtract.ADD,
            GeneticDefaults.COLOR_CHANGE_MIN);
        return result;
    }
}

export const LESS_RED = {
    name: "LESS_RED",
    letterCode: "c",
    dominance: Dominance.RECESSIVE,
    isMutation: true,
    alter: (creature, variables) => {
        let originalColor = creature.adultColor;

        if (variables === null) {
            variables = {
                changeAmount: -1 * getRandomIntInRange(GeneticDefaults.COLOR_CHANGE_MIN, GeneticDefaults.COLOR_CHANGE_MAX)

            }
        }
        //let changeAmount = -1 * getRandomIntInRange(GeneticDefaults.COLOR_CHANGE_MIN, GeneticDefaults.COLOR_CHANGE_MAX);
        //let halfAmount = -1 * Math.ceil(changeAmount / 2);
        let oppositeAmount = -1 * variables.changeAmount;
        
        //let newColor = alterColorByAmount(originalColor, ColorType.R, changeAmount);
        let newColor = addToRGBValues(originalColor, variables.changeAmount, oppositeAmount, oppositeAmount);

        creature.adultColor = newColor;
        creature.color = creature.life.determineColor();
    },
    canHaveTrait: (creature) => {
        let result = canColorChangeRequirementBeMet(
            creature.adultColor,
            ColorType.R,
            AddOrSubtract.SUBTRACT,
            GeneticDefaults.COLOR_CHANGE_MIN);
        return result;
    }
}

export const MORE_GREEN = {
    name: "MORE_GREEN",
    letterCode: "d",
    dominance: Dominance.RECESSIVE,
    isMutation: true,
    alter: (creature, variables) => {
        let originalColor = creature.adultColor;
        
        if (variables === null) {
            variables = {
                changeAmount: getRandomIntInRange(GeneticDefaults.COLOR_CHANGE_MIN, GeneticDefaults.COLOR_CHANGE_MAX)
        
            }
        }
        //let changeAmount = getRandomIntInRange(GeneticDefaults.COLOR_CHANGE_MIN, GeneticDefaults.COLOR_CHANGE_MAX);
        //let halfAmount = -1 * Math.ceil(changeAmount / 2);
        let oppositeAmount = -1 * variables.changeAmount;
        
        //let newColor = alterColorByAmount(originalColor, ColorType.G, changeAmount);
        let newColor = addToRGBValues(originalColor, oppositeAmount, variables.changeAmount, oppositeAmount);

        creature.adultColor = newColor;
        creature.color = creature.life.determineColor();
    },
    canHaveTrait: (creature) => {
        let result = canColorChangeRequirementBeMet(
            creature.adultColor,
            ColorType.G,
            AddOrSubtract.ADD,
            GeneticDefaults.COLOR_CHANGE_MIN);
        return result;
    }
}

export const LESS_GREEN = {
    name: "LESS_GREEN",
    letterCode: "e",
    dominance: Dominance.RECESSIVE,
    isMutation: true,
    alter: (creature, variables) => {
        let originalColor = creature.adultColor;

        if (variables === null) {
            variables = {
                changeAmount: -1 * getRandomIntInRange(GeneticDefaults.COLOR_CHANGE_MIN, GeneticDefaults.COLOR_CHANGE_MAX)
        
            }
        }
        //let changeAmount = -1 * getRandomIntInRange(GeneticDefaults.COLOR_CHANGE_MIN, GeneticDefaults.COLOR_CHANGE_MAX);
        //let halfAmount = -1 * Math.ceil(changeAmount / 2);
        let oppositeAmount = -1 * variables.changeAmount;

        //let newColor = alterColorByAmount(originalColor, ColorType.G, changeAmount);
        let newColor = addToRGBValues(originalColor, oppositeAmount, variables.changeAmount, oppositeAmount);

        creature.adultColor = newColor;
        creature.color = creature.life.determineColor();
    },
    canHaveTrait: (creature) => {
        let result = canColorChangeRequirementBeMet(
            creature.adultColor,
            ColorType.G,
            AddOrSubtract.SUBTRACT,
            GeneticDefaults.COLOR_CHANGE_MIN);
        return result;
    }
}

export const MORE_BLUE = {
    name: "MORE_BLUE",
    letterCode: "f",
    dominance: Dominance.RECESSIVE,
    isMutation: true,
    alter: (creature, variables) => {
        let originalColor = creature.adultColor;

        if (variables === null) {
            variables = {
                changeAmount: getRandomIntInRange(GeneticDefaults.COLOR_CHANGE_MIN, GeneticDefaults.COLOR_CHANGE_MAX)
        
            }
        }
        //let changeAmount = getRandomIntInRange(GeneticDefaults.COLOR_CHANGE_MIN, GeneticDefaults.COLOR_CHANGE_MAX);
        //let halfAmount = -1 * Math.ceil(changeAmount / 2);
        let oppositeAmount = -1 * variables.changeAmount;
        
        //let newColor = alterColorByAmount(originalColor, ColorType.B, changeAmount);
        let newColor = addToRGBValues(originalColor, oppositeAmount, oppositeAmount, variables.changeAmount);

        creature.adultColor = newColor;
        creature.color = creature.life.determineColor();
    },
    canHaveTrait: (creature) => {
        let result = canColorChangeRequirementBeMet(
            creature.adultColor,
            ColorType.B,
            AddOrSubtract.ADD,
            GeneticDefaults.COLOR_CHANGE_MIN);
        return result;
    }
}

export const LESS_BLUE = {
    name: "LESS_BLUE",
    letterCode: "g",
    dominance: Dominance.RECESSIVE,
    isMutation: true,
    alter: (creature, variables) => {
        let originalColor = creature.adultColor;

        if (variables === null) {
            variables = {
                changeAmount: -1 * getRandomIntInRange(GeneticDefaults.COLOR_CHANGE_MIN, GeneticDefaults.COLOR_CHANGE_MAX)
    
            }
        }
        //let changeAmount = -1 * getRandomIntInRange(GeneticDefaults.COLOR_CHANGE_MIN, GeneticDefaults.COLOR_CHANGE_MAX);
        //let halfAmount = -1 * Math.ceil(changeAmount / 2);
        let oppositeAmount = -1 * variables.changeAmount;
        
        //let newColor = alterColorByAmount(originalColor, ColorType.B, changeAmount);
        let newColor = addToRGBValues(originalColor, oppositeAmount, oppositeAmount, variables.changeAmount);

        creature.adultColor = newColor;
        creature.color = creature.life.determineColor();
    },
    canHaveTrait: (creature) => {
        let result = canColorChangeRequirementBeMet(
            creature.adultColor,
            ColorType.B,
            AddOrSubtract.SUBTRACT,
            GeneticDefaults.COLOR_CHANGE_MIN);
        return result;
    }
}

export const LIGHTER = {
    name: "LIGHTER",
    letterCode: "h",
    dominance: Dominance.RECESSIVE,
    isMutation: true,
    alter: (creature, variables) => {
        let originalColor = creature.adultColor;

        if (variables === null) {
            variables = {
                changeAmount: getRandomIntInRange(GeneticDefaults.VALUE_CHANGE_MIN, GeneticDefaults.VALUE_CHANGE_MAX)
        
            }
        }
        //let changeAmount = getRandomIntInRange(GeneticDefaults.VALUE_CHANGE_MIN, GeneticDefaults.VALUE_CHANGE_MAX);
        let newColor = alterColorDarkOrLight(originalColor, variables.changeAmount);
        
        creature.adultColor = newColor;
        creature.color = creature.life.determineColor();
    },
    canHaveTrait: (creature) => {
        let result = canColorChangeRequirementBeMet(
            creature.adultColor,
            ColorType.LIGHTER,
            AddOrSubtract.ADD,
            GeneticDefaults.VALUE_CHANGE_MIN);
        return result;
    }
}

export const DARKER = {
    name: "DARKER",
    letterCode: "i",
    dominance: Dominance.RECESSIVE,
    isMutation: true,
    alter: (creature, variables) => {
        let originalColor = creature.adultColor;

        if (variables === null) {
            variables = {
                changeAmount: -1 * getRandomIntInRange(GeneticDefaults.VALUE_CHANGE_MIN, GeneticDefaults.VALUE_CHANGE_MAX)
            }
        }
        //let changeAmount = -1 * getRandomIntInRange(GeneticDefaults.VALUE_CHANGE_MIN, GeneticDefaults.VALUE_CHANGE_MAX);
        let newColor = alterColorDarkOrLight(originalColor, variables.changeAmount);
        
        creature.adultColor = newColor;
        creature.color = creature.life.determineColor();
    },
    canHaveTrait: (creature) => {
        let result = canColorChangeRequirementBeMet(
            creature.adultColor,
            ColorType.DARKER,
            AddOrSubtract.SUBTRACT,
            GeneticDefaults.VALUE_CHANGE_MIN);
        return result;
    }
}

// // bringing traits together
// export const ColorTrait = {
//     DEFAULT: COLOR_DEFAULT,
//     MORE_RED: MORE_RED,
//     LESS_RED: LESS_RED,
//     MORE_GREEN: MORE_GREEN,
//     LESS_GREEN: LESS_GREEN,
//     MORE_BLUE: MORE_BLUE,
//     LESS_BLUE: LESS_BLUE,
//     LIGHTER: LIGHTER,
//     DARKER: DARKER,
// }

// --gene
export const COLOR_GENE = {
    name: "COLOR_GENE",
    geneType: GeneType.COLOR,
    letterCode: "C",
    dominantTraits: [COLOR_DEFAULT],
    recessiveTraits: [
        MORE_RED,
        LESS_RED,
        MORE_GREEN,
        LESS_GREEN,
        MORE_BLUE,
        LESS_BLUE,
        LIGHTER,
        DARKER
    ]
}

//#endregion

// List of all genes
export const LIST_OF_GENES = [
    {
        geneType: GeneType.SPEED,
        constant: SPEED_GENE
    },
    {
        geneType: GeneType.SIZE,
        constant: SIZE_GENE
    },
    {
        geneType: GeneType.COLOR,
        constant: COLOR_GENE
    },
]

// Trait stamps
export const TraitStamps = [];