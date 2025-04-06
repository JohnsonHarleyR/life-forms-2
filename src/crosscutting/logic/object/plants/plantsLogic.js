
import { CanvasInfo } from "../../../constants/canvasConstants";
import { getRandomStartPosition } from "../../universalLogic";
import { getNecessaryCollisionPadding } from "../../creature/creatureLogic";

export const getRandomPlantStartPosition = (info, creatures, objects, plants, shelters, padding) => {
    let result = getRandomStartPosition(info, creatures, objects, plants, shelters, getNecessaryCollisionPadding());
    //let result = getRandomStartPosition(info, creatures, objects, plants, shelters, padding);
    let startX = result.x - (info.width / 2);
    let startY = result.y - (info.width / 2);
    return {xStart: startX, yStart: startY};
}