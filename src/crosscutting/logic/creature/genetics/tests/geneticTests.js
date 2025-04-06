import { getPrivateGeneticMethodsForTesting } from "../logic/geneticLogic";
import { compare_getTraitsWithHighestGenerationCount } from "./testHelpers/compare";
import { logTestCaseCompareResult } from "./testHelpers/resultLogging";
import { cases_getTraitsWithHighestGenerationCount } from "./testHelpers/testCases";


const privateMethods = getPrivateGeneticMethodsForTesting();

// RUN ALL TESTS
export const runAllGeneticTests = () => {
    // trait tests
    test_getTraitsWithHighestGenerationCount();
}

// TRAIT TESTS
const test_getTraitsWithHighestGenerationCount = (testCases = cases_getTraitsWithHighestGenerationCount) => {
    let logString = `**************************************\n` +
    `TEST: getTraitsWithHighestGenerationCount\n` +
    `**************************************`;
    console.log(logString);

    let caseIndex;
    let description;
    let isSame;
    let reason;
    for (let i = 0; i < testCases.length; i++) {
        let expected = testCases[i].expected;
        let result = privateMethods.getTraitsWithHighestGenerationCount(testCases[i].parameters.traits);
        let compareResult = compare_getTraitsWithHighestGenerationCount(expected, result);

        if (i === 0 || compareResult.isSame === false) {
            caseIndex = testCases[i].index;
            description = testCases[i].description;
            isSame = compareResult.isSame;
            reason = compareResult.reason;
        }

        if (compareResult.isSame === false) {
            break;
        }
    }

    logTestCaseCompareResult(caseIndex, description, isSame, reason);
    console.log(``);
}