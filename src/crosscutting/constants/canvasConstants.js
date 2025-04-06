export const CanvasDefaults = {
    USE_CREATE_MODE: false,
    START_GAME_WITH_CANVAS: false,
    RESIZE_FACTOR: 1, // TODO implement this into all sizing and such - use in any new sizing - keep as 1 until implemented fully
    SPEED_ADJUSTMENT: 1,
    PLANT_REGENERATION_ADJUSTMENT: 2

}

export const CanvasInfo = {
    WIDTH: 600 * CanvasDefaults.RESIZE_FACTOR,
    HEIGHT: 400 * CanvasDefaults.RESIZE_FACTOR,
    BG_COLOR: "#D3D3D3",
    INTERVAL: 50,
    OBJECT_PADDING: 2 * CanvasDefaults.RESIZE_FACTOR,
    STARTING_HOUR: 14,
    START_TIME: Date.now(),
    CURRENT_DAY: 1,
};

export const XMark = {
    SIZE: 10 * CanvasDefaults.RESIZE_FACTOR,
    COLOR: "red",
    LINE_WIDTH: 2 * CanvasDefaults.RESIZE_FACTOR
};

export const PathLine = {
    COLOR: "#39FF14",
    LINE_WIDTH: 1 * CanvasDefaults.RESIZE_FACTOR
};

export const SightLine = {
    COLOR: 'cyan',
    LINE_WIDTH: 1 * CanvasDefaults.RESIZE_FACTOR
};

export const ShelterLine = {
    LINE_WIDTH: 2 * CanvasDefaults.RESIZE_FACTOR,
    MULTIPLIER: 4,
    FONT: "10px serif",
    FONT_COLOR: "#000000",
    X_TEXT_OFFSET: 2 * CanvasDefaults.RESIZE_FACTOR,
    Y_TEXT_OFFSET: 9 * CanvasDefaults.RESIZE_FACTOR
};

export const SleepIndicator = {
    X_OFFSET: 3 * CanvasDefaults.RESIZE_FACTOR,
    Y_OFFSET: -10 * CanvasDefaults.RESIZE_FACTOR,
    FONT: "7px serif",
    TEXT: "Z"
}

export const Axis = {
    X: "X",
    Y: "Y"
};