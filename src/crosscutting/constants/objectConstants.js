export const ObjectType = {
    WALL: "WALL",
    PLANT: "PLANT",
    SHELTER: "SHELTER",
    CREATURE: "CREATURE"
};

export const Wall = {
    type: ObjectType.WALL
};

export const DefaultObjects = [
    {
        name: `w1`,
        type: ObjectType.WALL,
        color: "black",
        xStart: 65,
        yStart: 50,
        width: 15,
        height: 200
    },
    {
        name: `w2`,
        type: ObjectType.WALL,
        color: "black",
        xStart: 160,
        yStart: 140,
        width: 80,
        height: 20
    },
    {
        name: `w3`,
        type: ObjectType.WALL,
        color: "black",
        xStart: 320,
        yStart: 50,
        width: 15,
        height: 15
    },
    {
        name: `w4`,
        type: ObjectType.WALL,
        color: "black",
        xStart: 320,
        yStart: 95,
        width: 15,
        height: 110
    },
    {
        name: `w5`,
        type: ObjectType.WALL,
        color: "black",
        xStart: 320,
        yStart: 235,
        width: 15,
        height: 15
    },
]

export const FoodType = {
    PLANT: "PLANT",
    PREY: "PREY",
    BOTH: "BOTH"
}

export const Side = {
    LEFT: "LEFT",
    RIGHT: "RIGHT",
    TOP: "TOP",
    BOTTOM: "BOTTOM",
    CENTER: "CENTER"
};

export const Corner = {
    TOP_LEFT: "TOP_LEFT",
    TOP_RIGHT: "TOP_RIGHT",
    BOTTOM_LEFT: "BOTTOM_LEFT",
    BOTTOM_RIGHT: "BOTTOM_RIGHT"
};

export const RelativeToObject = {
    OVERLAP: "OVERLAP",
    LEFT_SIDE: Side.LEFT,
    RIGHT_SIDE: Side.RIGHT,
    TOP_SIDE: Side.TOP,
    BOTTOM_SIDE: Side.BOTTOM,
    TOP_LEFT_CORNER: Corner.TOP_LEFT,
    TOP_RIGHT_CORNER: Corner.TOP_RIGHT,
    BOTTOM_LEFT_CORNER: Corner.BOTTOM_LEFT,
    BOTTOM_RIGHT_CORNER: Corner.BOTTOM_RIGHT,
    NONE: null
};

export const CornerSideResult = {
    LEFT: Side.LEFT,
    RIGHT: Side.RIGHT,
    TOP: Side.TOP,
    BOTTOM: Side.BOTTOM,
    TIE: "TIE"
}

export const RelativeToObjectCases = [
    {
        isAwayFromLeft: false,
        isAwayFromRight: false,
        isAwayFromTop: false,
        isAwayFromBottom: false,
        condition: RelativeToObject.OVERLAP
    },
    {
        isAwayFromLeft: true,
        isAwayFromRight: false,
        isAwayFromTop: false,
        isAwayFromBottom: false,
        condition: RelativeToObject.LEFT_SIDE
    },
    {
        isAwayFromLeft: false,
        isAwayFromRight: true,
        isAwayFromTop: false,
        isAwayFromBottom: false,
        condition: RelativeToObject.RIGHT_SIDE
    },
    {
        isAwayFromLeft: false,
        isAwayFromRight: false,
        isAwayFromTop: true,
        isAwayFromBottom: false,
        condition: RelativeToObject.TOP_SIDE
    },
    {
        isAwayFromLeft: false,
        isAwayFromRight: false,
        isAwayFromTop: false,
        isAwayFromBottom: true,
        condition: RelativeToObject.BOTTOM_SIDE
    },
    {
        isAwayFromLeft: true,
        isAwayFromRight: false,
        isAwayFromTop: true,
        isAwayFromBottom: false,
        condition: RelativeToObject.TOP_LEFT_CORNER
    },
    {
        isAwayFromLeft: false,
        isAwayFromRight: true,
        isAwayFromTop: true,
        isAwayFromBottom: false,
        condition: RelativeToObject.TOP_RIGHT_CORNER
    },
    {
        isAwayFromLeft: true,
        isAwayFromRight: false,
        isAwayFromTop: false,
        isAwayFromBottom: true,
        condition: RelativeToObject.BOTTOM_LEFT_CORNER
    },
    {
        isAwayFromLeft: false,
        isAwayFromRight: true,
        isAwayFromTop: false,
        isAwayFromBottom: true,
        condition: RelativeToObject.BOTTOM_RIGHT_CORNER
    },
];

export const Objects = [];

export const Shelters = [];