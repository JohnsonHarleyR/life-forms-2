import { CanvasInfo } from "../../../crosscutting/constants/canvasConstants";
import {LifeStage } from "../../../crosscutting/constants/creatureConstants";
import NewObject from "../../../crosscutting/logic/object/objects";
import { fillBackground, drawAllObjects, drawAllCreatures, drawAllPlants,
    drawAllShelters, drawAllCreatureLines, drawAllShelterTexts } from "../../../crosscutting/logic/canvasLogic";
import { getRandomPlantStartPosition } from "../../../crosscutting/logic/object/plants/plantsLogic";
import Plant from "../../../crosscutting/logic/object/plants/plant";
import { getRandomCreatureStartPosition } from "../../../crosscutting/logic/creature/creatureLogic";
import Creature from "../../../crosscutting/logic/creature/creature";
import { PlantDefaults, Plants } from "../../../crosscutting/constants/plantConstants";
import { Shelters } from "../../../crosscutting/constants/objectConstants";

// TODO generateCreature, generatePlant


// Creating and generating functions

export const createObjects = (startingObjects) => { // TODO create object class so that this will work
    let constants = startingObjects;

    let objs = [];
    constants.forEach(c => {
        let newObj = new NewObject(c.name, c.type, c.color, c.xStart, c.yStart, c.width, c.height);
        objs.push(newObj);
    })

    return objs;
};

export const createCreatures = (startingCreatureTypes, objects, plants, shelters, creatures = []) => {
    
    //array.push(creature); // HACK this is only while there is a main creature to test
    //let array = [];

    startingCreatureTypes.forEach(sc => {
        for (let i = 0; i < sc.count; i++) {
            creatures.push(generateCreature(sc.gender, LifeStage.ADULT, sc.type, null, null, creatures, objects, plants, shelters));
        }
    });
    
    return creatures;
}

const generateCreature = (gender, lifeStage = LifeStage.CHILD, info, mother, father, creatures, objects, plants, shelters) => { // TODO Be sure to include an id too - make it easier to pull out
    let index = creatures.length;
    let randomPosition = getRandomCreatureStartPosition(info, creatures, objects, plants, shelters);
    let creature = new Creature({id: `c${index}`, gender: gender, lifeStage: lifeStage, position: randomPosition, 
        mother: mother, father: father, targetPosition: randomPosition, ...info });
    return creature;
}

export const generatePlants = (intervals, plants, creatures, objects, shelters, plantConstants, largestCreatureSize) => { // TODO Be sure to include an id too - make it easier to pull out
    if (creatures === null || creatures === undefined) {
        return;
    }
    
    if (plants.length > PlantDefaults.MAX_TOTAL_PLANTS) {
        return;
    }

    //let plantCounts = countPlants(plantConstants, plants);
    
    let index = Plants.length;
    plantConstants.forEach(p => {
        //let count = plantCounts[`${p.type}`];
        if (intervals % p.growInterval === 0 &&
            p.currentCount < p.maxCount) {
                let newPlant = generatePlant(index, p, Plants, creatures, objects, shelters, largestCreatureSize);
                Plants.push(newPlant);
                p.currentCount++;
                index++;
        }
    });
}

const generatePlant = (index, speciesInfo, plants, creatures, objects, shelters, largestCreatureSize) => { // TODO Be sure to include an id too - make it easier to pull out
    let startPos = getRandomPlantStartPosition(speciesInfo, creatures, objects, plants, shelters, largestCreatureSize);
    let newPlant = new Plant({...speciesInfo, id: `p${index}`, xStart: startPos.xStart, yStart: startPos.yStart});
    return newPlant;
}

// helper functions

export const renderCanvas = (canvasRef, creatures, plants, objects, shelters) => {
    fillBackground(canvasRef.current, CanvasInfo.BG_COLOR);
    //drawPathLine({ canvas: canvasRef.current, ...lineInfo });
    //drawXMark(canvasRef.current, chosenCreature.targetPosition);
    drawAllPlants(canvasRef.current, plants);
    drawAllShelters(canvasRef.current, shelters);
    //drawCreature(canvasRef.current, CanvasInfo, creature);
    drawAllCreatureLines(canvasRef.current, CanvasInfo, creatures);
    drawAllObjects(canvasRef.current, objects);
    drawAllCreatures(canvasRef.current, CanvasInfo, creatures);
    drawAllShelterTexts(canvasRef.current, shelters);
};

export const updateShelters = (creatures) => {
    // let sheltersCopy = [...Shelters];
    let shelterNames = [];
    let old = Shelters.splice(0, Shelters.length);
    creatures.forEach(c => {
        if (c.safety.shelter !== null && 
            !shelterNames.includes(c.safety.shelter.id)) {
                shelterNames.push(c.safety.shelter.id);
                Shelters.push(c.safety.shelter);
            }
    });
}

export const updatePlants = (plants, startingTypes) => {
    let plantsCopy = plants.splice(0, plants.length);
    plantsCopy.forEach(p => {
        if (!p.isEaten) {
            plants.push(p);
        } else {
            subtractOneFromPlantCount(p.type, startingTypes);
        }
    });
}

const subtractOneFromPlantCount = (type, startingTypes) => {
    for (let i = 0; i < startingTypes.length; i++) {
        if (startingTypes[i].type === type &&
            startingTypes[i].currentCount > 0) {
                startingTypes[i].currentCount--;
                break;
        }
    }
}

export const updateCreatures = (creatures, passedOnCreatures) => {
    let creaturesCopy = creatures.splice(0, creatures.length);
    //let passedOn = passedOnCreatures.splice(0, passedOnCreatures.length);
    let creatureNames = [];
    let passedOnNames = [];
    passedOnCreatures.forEach(po => {
        if (!passedOnNames.includes(po.id)) {
            passedOnNames.push(po.id);
        }
    })
    creaturesCopy.forEach(c => {
        if (!c.hasLeftWorld && !creatureNames.includes(c.id)) {
            creatures.push(c);
            creatureNames.push(c.id);
        } else if (c.hasLeftWorld && !passedOnNames.includes(c.id)) {
            passedOnCreatures.push(c);
            passedOnNames.push(c.id);
        }
        // if (( (c.life.isDead && !c.isEaten) || (!c.isEaten && !c.life.isDead)) 
        // && !creatureNames.includes(c.id)) {
        //     newCreatures.push(c);
        //     creatureNames.push(c.id);
        // }
        c.family.children.forEach(ch => {
            if (!ch.hasLeftWorld && !creatureNames.includes(ch.id)) {
                creatures.push(ch);
                creatureNames.push(ch.id);
            } else if (c.hasLeftWorld && !passedOnNames.includes(ch.id)) {
                passedOnCreatures.push(ch);
                passedOnNames.push(ch.id);
            }
        })
        // c.family.children.forEach(ch => {
        //     if (((c.life.isDead && !c.isEaten) || (!c.isEaten && !c.life.isDead))
        //     && !isInArray(ch.id, creatureNames)) {
        //         newCreatures.push(ch);
        //         creatureNames.push(ch.id);
        //     }
        // })
    });
    resetHasMovedForCreatures(creatures);
}

const resetHasMovedForCreatures = (creatures) => {
    creatures.forEach(c => {
        c.movement.hasMoved = false;
    });
}

const isInArray = (str, array) => {
    let result = false;
    array.forEach(a => {
        if (a === str) {
            result = true;
        }
    });
    return result;
}

export const setCreatureResult = (creature, result) => {
    creature.color = result.color;
    creature.size = result.size;
    creature.width = result.width;
    creature.height = result.height;
    creature.energy = result.energy;
    creature.life = result.life;
    creature.safety = result.safety;
    creature.family = result.family;
    creature.mating = result.mating;
    creature.needs = result.needs;
    creature.food = result.food;
    creature.targetType = result.targetType;
    creature.currentTarget = result.currentTarget;
    creature.targetPosition = result.targetPosition;
    creature.inventory = result.inventory;
    creature.position = result.position;
    creature.movement = result.movement;
}

// testing functions

export const showMousePos = (event, canvasRef) => {
    let pos = getMousePos(canvasRef.current, event);
    console.log(JSON.stringify(pos));
};

const getMousePos = (canvas, event) => {
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    return { x: x, y: y };
};