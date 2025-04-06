


export const compare_getTraitsWithHighestGenerationCount = (expected, result) => {
    let isSame = true;
    let reason = "The test case happened as expected."
    if (expected.length !== result.length) {
        return {
            isSame: false,
            reason: "The result array was not the same length as the array expected."
        };
    }

    for (let i = 0; i < expected.length; i++) {
        if (expected[i].name !== result[i].name) {
            isSame = false;
            reason = `Result array item ${i} did not have the same name as expected item ${i}`;
        } else if (expected[i].generationCount !== result[i].generationCount) {
            isSame = false;
            reason = `Result array item ${i} did not have the same generationCount as expected item ${i}`;
        }
    }

    return {
        isSame: isSame,
        reason: reason
    }
}