import { Dominance, GeneticDefaults } from "../../../../constants/geneticConstants";
import { getRandomItemInArray } from "../../../universalLogic";
import { createFirstGenerationTraitFromConstant, determineChosenTrait, doMakePermanentChange, findMainDefaultTrait, getDeepTraitCopy } from "../logic/geneticLogic";


// TODO figure out logic for permanent changes
export default class Gene {
    constructor(name, geneType, letterCode, dominantTraits, recessiveTraits,
        xTrait, yTrait, xPermChanges, yPermChanges) {
        this.name = name;
        this.geneType = geneType;
        this.letterCode = letterCode;
        this.dominantTraits = dominantTraits;
        this.recessiveTraits = recessiveTraits;
        this.xTrait = xTrait;
        this.yTrait = yTrait;
        
        this.permanentChanges = getRandomItemInArray([xPermChanges, yPermChanges]);

        // TODO determine whether to add new permanent change
        this.determineNewPermanentChanges();

        this.dominantTraitsToPass = [...dominantTraits]; // TODO consider getting rid of this stuff...
        this.recessiveTraitsToPass = [...recessiveTraits];
        //this.permanentChangesToPass = [...permanentChanges]

        this.chosenTrait = determineChosenTrait(this.xTrait, this.yTrait);

        //this.moveFromRecessiveToDominantTraits(); // in case a trait was switched from dominant to recessive
    }

    getRandomTraitToPass = () => { // for passing a trait to the next generation
        let traits = [this.xTrait, this.yTrait];
        let chosen = getRandomItemInArray(traits);

        // make copy and increase generation count - also do not let it say mutation
        let alteredCopy = getDeepTraitCopy(chosen);
        alteredCopy.generationCount++;

        // if the generation count is greater than that needed to become dominant, make it dominant
        // if (alteredCopy.dominance === Dominance.RECESSIVE &&
        //     alteredCopy.generationCount >= GeneticDefaults.GENERATIONS_TO_BECOME_DOMINANT) {
        //         alteredCopy.dominance = Dominance.DOMINANT;
        //         this.moveFromRecessiveToDominantTraitsToPass(alteredCopy.name);

        //     // also check for making a trait permanent
        // } 
        // else if (alteredCopy.dominance === Dominance.DOMINANT && alteredCopy.name !== "DEFAULT" && 
        //     alteredCopy.generationCount >= GeneticDefaults.GENERATIONS_TO_BECOME_PERMANENT) {

        //     }

        return alteredCopy;
    }

    determineNewPermanentChanges = () => {
        
        // See if the x and y traits qualify to make a change permanent
        if (doMakePermanentChange(this.xTrait, this.yTrait, this.permanentChanges)) {
            console.log(`MAKING NEW PERMANENT CHANGES!!`);

            // they're both the same name but may have different variables, so choose randomly.
            let newPermTrait = getRandomItemInArray([this.xTrait, this.yTrait]);
            newPermTrait.stamps = [this.xTrait.stamp, this.yTrait.stamp];
            // add to permanent changes
            this.permanentChanges.push(newPermTrait);

            // create new default traits for both x and y traits
            let defaultTraitConstant = findMainDefaultTrait(this.geneType);
            this.xTrait = createFirstGenerationTraitFromConstant(defaultTraitConstant);
            this.yTrait = createFirstGenerationTraitFromConstant(defaultTraitConstant);
        }

    }

    

    moveFromRecessiveToDominantTraitsToPass = (traitName) => {
        let listOfRecessive = [];
        let traitToMove = null;
        this.recessiveTraitsToPass.forEach(r => {
            if (r.name !== traitName) {
                listOfRecessive.push(r);
            } else {
                let copy = {
                    name: r.name,
                    dominance: Dominance.DOMINANT,
                    isMutation: r.isMutation,
                    alter: r.alter
                };
                traitToMove = copy;
            }
        });

        this.recessiveTraitsToPass = listOfRecessive;

        if (traitToMove !== null) {
            this.dominantTraitsToPass.push(traitToMove);
        }
    }

    moveFromDominantToRecessiveTraits = (traitName) => {
        let listOfDominant = [];
        let traitToMove = null;
        this.dominantTraits.forEach(d => {
            if (d.name !== traitName) {
                listOfDominant.push(d);
            } else {
                let copy = {
                    name: d.name,
                    dominance: Dominance.RECESSIVE,
                    isMutation: true,
                    alter: d.alter
                };
                traitToMove = copy;
            }
        });

        if (traitToMove !== null) {
            this.recessiveTraits.push(traitToMove);
        }
    }

    // moveFromRecessiveToDominantTraits = () => {
    //     let listOfRecessive = [];
    //     this.recessiveTraits.forEach(r => {
    //         listOfRecessive.push(r.name);
    //     });

    //     if (this.chosenTrait.dominance === Dominance.DOMINANT &&
    //         listOfRecessive.includes(this.chosenTrait.name)) {
    //         let newRecessive = [];
    //         listOfRecessive.forEach(r => {
    //             if (r.name !== this.chosenTrait.name) {
    //                 this.dominantTraits.push(r);
    //             } else {
    //                 newRecessive.push(r);
    //             }
    //         })
    //         this.recessiveTraits = newRecessive;
    //     }
    // }
}