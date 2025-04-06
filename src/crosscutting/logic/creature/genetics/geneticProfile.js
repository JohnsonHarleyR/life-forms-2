import { 
    Dominance,
    GeneticDefaults,
    LIST_OF_GENES
} from "../../../constants/geneticConstants";
import { getRandomItemInArray, isTrueByChance } from "../../universalLogic";
import { createDefaultGeneticProfile, chooseValidTraitForCreature, createNewGeneFromConstant, createFirstGenerationTraitFromConstant, createNewGeneFromParentGenes, geneHasValidRecessiveTraitForCreature, getGeneFromProfile, replaceXOrYTraitAndChooseTrait, setProfileProperty, writeGeneticCode } from "./logic/geneticLogic";
export default class GeneticProfile {
    constructor(creature = null, doSetUpGenes = true, mutateRandomGene = true) {
        this.creature = creature;
        this.traitsAreApplied = false;

        this.colorGene = null;
        this.sizeGene = null;
        this.speedGene = null;

        //this.permanentChanges = []; // these will be determined from dominant traits before mutating anything

        if (doSetUpGenes) {
            this.setUpGenes(mutateRandomGene);
        }

        this.applyGenesToCreature();

        this.geneticCode = writeGeneticCode(this);
    }

    getAllGenes = () => {
        return [this.colorGene, this.sizeGene, this.speedGene];
    }

    applyGenesToCreature = () => {
        if (this.traitsAreApplied || this.creature === null) {
            return;
        }

        let allGenes = this.getAllGenes();
        allGenes.forEach(g => {
            if (g !== null) {
                g.chosenTrait.alter(this.creature);
            }
        });
        this.traitsAreApplied = true;
    }

    setUpGenes = (mutateRandomGene) => {

        // if xProfile and yProfile are null, then create default values for them
        let xProfile = null;
        if (this.creature !== null && this.creature.family.mother !== null) {
            xProfile = this.creature.family.mother.geneticProfile;
        }
        if (xProfile === null) {
            xProfile = createDefaultGeneticProfile();
        }

        let yProfile = null;
        if (this.creature !== null && this.creature.family.father !== null) {
            yProfile = this.creature.family.father.geneticProfile;
        }
        if (yProfile === null) {
            yProfile = createDefaultGeneticProfile();
        }

        // now set up all the genes without mutating yet
        let geneConstantList = LIST_OF_GENES;
        geneConstantList.forEach(c => {
            let xGene = getGeneFromProfile(xProfile, c.geneType);
            let yGene = getGeneFromProfile(yProfile, c.geneType);
            let newGene = createNewGeneFromParentGenes(xGene, yGene);

            // apply all permanent changes in gene to creature
            newGene.permanentChanges.forEach(pc => {
                pc.alter(this.creature);
            });

            setProfileProperty(this, c.geneType, newGene);

        });

        // if this is set to mutate a random gene, run through the genes
        // until we find one that isn't mutated. If we do, then replace that
        // gene with random recessive traits.
        if (mutateRandomGene && this.creature !== null) {

            let isFirstGen = this.creature.family.mother === null && this.creature.family.father === null;
            let times = isFirstGen ? 1 : GeneticDefaults.POSSIBLE_RECESSIVE_MUTATIONS;
            for (let i = 0; i < times; i++) {
                let willMutate = !isFirstGen ? isTrueByChance(GeneticDefaults.CHANCE_OF_MUTATION) : true;
                if (willMutate) {
                    let geneToMutate = this.selectGeneToMutate(isFirstGen);
                    if (geneToMutate !== null) {
                        if (isFirstGen) {
                            let replacementGene = createNewGeneFromConstant(geneToMutate, Dominance.RECESSIVE, this.creature);
                            if (replacementGene !== null) {
                                setProfileProperty(this, geneToMutate.geneType, replacementGene);
                            }
                        } else {
                            let traitConst = chooseValidTraitForCreature(geneToMutate.recessiveTraits, this.creature);
                            let trait = createFirstGenerationTraitFromConstant(traitConst);
                            replaceXOrYTraitAndChooseTrait(geneToMutate, trait);
                        }

                    }
                }
            }
        }

        //console.log(`Profile: ${JSON.stringify(this)}`);
        //console.log(getProfileLogString(this));
    }

    selectGeneToMutate = (isFirstGen) => {
        let allGenes = this.getAllGenes();

        let listItem = null;
        let itemsTried = [];
        let attemptCount = 0;
        // let permanentNames = [];
        // this.permanentChanges.forEach(p => {
        //     permanentNames.push(p.name);
        // });

        do {
            let possibleGene = getRandomItemInArray(allGenes);

            if (isFirstGen) {
                if (!itemsTried.includes(possibleGene.name) && 
                //(permanentNames.includes(possibleItem.chosenTrait.name) ||
                (!possibleGene.xTrait.isMutation && !possibleGene.xTrait.isMutation &&
                geneHasValidRecessiveTraitForCreature(this.creature, possibleGene))) {
                    listItem = possibleGene;
                }
            } else {
                if (!itemsTried.includes(possibleGene.name) && 
                //(permanentNames.includes(possibleItem.chosenTrait.name) ||
                (!possibleGene.xTrait.isMutation || !possibleGene.xTrait.isMutation &&
                geneHasValidRecessiveTraitForCreature(this.creature, possibleGene))) {
                    listItem = possibleGene;
                }
            }

            itemsTried.push(possibleGene.name);
            attemptCount++;
        } while (listItem === null && itemsTried.length < allGenes.length
        && attemptCount < GeneticDefaults.ATTEMPTS_TO_MUTATE_ALLOWED);

        // return result
        return listItem;
    }
}