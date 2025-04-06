import { Dominance } from "../../../../../constants/geneticConstants";
import Trait from "../../subclasses/trait";


export const cases_getTraitsWithHighestGenerationCount = [
    {
        index: 0,
        description: "Happy path - return highest count",
        parameters: {
            traits:
            [
                new Trait('TEST_TRAIT1', Dominance.RECESSIVE, 5, true, 
                () => {console.log('alteration method run')}, () => {return true}),
        
                new Trait('TEST_TRAIT2', Dominance.RECESSIVE, 4, true, 
                () => {console.log('alteration method run')}, () => {return true}),
            ],
        },
        expected: 
        [
            new Trait('TEST_TRAIT1', Dominance.RECESSIVE, 5, true, 
            () => {console.log('alteration method run')}, () => {return true})        
        ]
    },
    {
        index: 1,
        description: 'Two traits have the same count, both should be returned in the array',
        parameters: {
            traits:
            [
                new Trait('TEST_TRAIT1', Dominance.RECESSIVE, 5, true, 
                () => {console.log('alteration method run')}, () => {return true}),
        
                new Trait('TEST_TRAIT2', Dominance.RECESSIVE, 4, true, 
                () => {console.log('alteration method run')}, () => {return true}),
    
                new Trait('TEST_TRAIT3', Dominance.RECESSIVE, 5, true, 
                () => {console.log('alteration method run')}, () => {return true}),
            ]
        },
        expected: 
        [
            new Trait('TEST_TRAIT1', Dominance.RECESSIVE, 5, true, 
            () => {console.log('alteration method run')}, () => {return true}),
            
            new Trait('TEST_TRAIT3', Dominance.RECESSIVE, 5, true, 
            () => {console.log('alteration method run')}, () => {return true}),
        ]
    },
    {
        index: 2,
        description: "Null value trait, should ignore and skip over it.",
        parameters: {
            traits:
            [
                null,
        
                new Trait('TEST_TRAIT1', Dominance.RECESSIVE, 4, true, 
                () => {console.log('alteration method run')}, () => {return true}),
    
                new Trait('TEST_TRAIT2', Dominance.RECESSIVE, 5, true, 
                () => {console.log('alteration method run')}, () => {return true})
            ]
        },
        expected: 
        [
            new Trait('TEST_TRAIT2', Dominance.RECESSIVE, 5, true, 
            () => {console.log('alteration method run')}, () => {return true})
        ]
    },
];