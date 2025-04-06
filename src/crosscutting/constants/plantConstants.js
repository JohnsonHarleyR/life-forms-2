import { CanvasDefaults } from "./canvasConstants"

const adjustInterval = (interval) => {
    return Math.round(interval * CanvasDefaults.PLANT_REGENERATION_ADJUSTMENT);
}

export const PlantDefaults = {
    MAX_PLANTS: 300,
    MAX_TOTAL_PLANTS: 1100
}

export const PlantSpecies = {
    SHRUB: "SHRUB",
    WEED: "WEED",
    WHEAT: "WHEAT",
    BUD: "BUD"
}

export const Bud = {
    type: PlantSpecies.BUD,
    color: "#AD6687",
    width: 4,
    height: 6,
    growInterval: adjustInterval(20),
    energy: 10,
    maxCount: 350,
    currentCount: 0
}

export const Shrub = {
    type: PlantSpecies.SHRUB,
    color: "#228B22",
    width: 6,
    height: 6,
    growInterval: adjustInterval(70),
    energy: 5,
    maxCount: 300,
    currentCount: 0
}

export const Weed = {
    type: PlantSpecies.WEED,
    color: "#00FF00",
    width: 5,
    height: 10,
    growInterval: adjustInterval(30),
    energy: 3,
    maxCount: 500,
    currentCount: 0
}

export const Wheat = {
    type: PlantSpecies.WHEAT,
    color: "#9ACD32",
    width: 5,
    height: 15,
    growInterval: adjustInterval(100),
    energy: 8,
    maxCount: 200,
    currentCount: 0
}

export const PlantConstants = [Bud, Weed, Shrub, Wheat];

PlantConstants.forEach(p => {
    p.width = p.width * CanvasDefaults.RESIZE_FACTOR;
    p.height = p.height * CanvasDefaults.RESIZE_FACTOR;
})

export const StartingPlants = [Bud, Weed, Shrub, Wheat];

export const Plants = [];