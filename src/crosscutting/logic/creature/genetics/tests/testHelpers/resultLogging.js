
import { getCreatureIdentityString } from "../../../../universalLogic";

export const logTestCaseCompareResult = (caseIndex, description, isSame, reason) => {
    let result = isSame ? "pass" : "fail";

    let logString = `\nResult: ${result}\n`;

    if (!isSame) {
        logString += `Reason: ${reason}\n` +
        `\tTest case number: ${caseIndex}\n` +
        `\tDescription: ${description}`;
    }

    console.log(logString);
}

export const getProfileLogString = (profile) => {
    
    let profileString = `Genetic Profile:`;

    let creatureString = profile.creature === null ? 
    `None specified` : `${getCreatureIdentityString(profile.creature)}`;
    profileString += `\n\tcreature: ${creatureString}`;
    // for each gene
    profileString += `\n\tsizeGene: \n${getGeneLogString(profile.sizeGene, 2)}`;
    profileString += `\n\tcolorGene: \n${getGeneLogString(profile.colorGene, 2)}`;
    
    return profileString;
}

const getGeneLogString = (gene, numberOfTabs = 0) => {
    let geneString = `${getTabString(numberOfTabs)}GENE:`;
    geneString += `\n${getTabString(numberOfTabs + 1)}name: ${gene.name}`;
    let dominantTraitsString = ``;
    gene.dominantTraits.forEach(d => {
        dominantTraitsString += getTraitLogString(d, numberOfTabs + 2);
    });
    geneString += `\n${getTabString(numberOfTabs + 1)}dominantTraits[]: ${dominantTraitsString}`;
    let recessiveTraitsString = ``;
    gene.recessiveTraits.forEach(r => {
        recessiveTraitsString += getTraitLogString(r, numberOfTabs + 2);
    });
    geneString += `\n${getTabString(numberOfTabs + 1)}recessiveTraits[]: ${recessiveTraitsString}`;
    geneString += `\n${getTabString(numberOfTabs + 1)}xTrait: ${getTraitLogString(gene.xTrait, numberOfTabs + 2)}`;
    geneString += `\n${getTabString(numberOfTabs + 1)}yTrait: ${getTraitLogString(gene.yTrait, numberOfTabs + 2)}`;
    geneString += `\n${getTabString(numberOfTabs + 1)}chosenTrait: ${getTraitLogString(gene.chosenTrait, numberOfTabs + 2)}`;

    return geneString;
}

const getTraitLogString = (trait, numberOfTabs = 0) => {
    let traitString = `\n${getTabString(numberOfTabs)}TRAIT:`;
        traitString += `\n${getTabString(numberOfTabs + 1)}name: ${trait.name}`;
        traitString += `\n${getTabString(numberOfTabs + 1)}dominance: ${trait.dominance}`;
        if (trait.generationCount !== undefined) {
            traitString += `\n${getTabString(numberOfTabs + 1)}generationCount: ${trait.generationCount}`;
        }
        traitString += `\n${getTabString(numberOfTabs + 1)}isMutation: ${trait.isMutation}`;
        traitString += `\n${getTabString(numberOfTabs + 1)}alter: ${JSON.stringify(trait.alter)}`;
    return traitString;
}

const getTabString = (numberOfTabs) => {
    let newString = ``;
    for (let i = 0; i < numberOfTabs; i++) {
        newString += `\t`;
    }
    return newString;
}