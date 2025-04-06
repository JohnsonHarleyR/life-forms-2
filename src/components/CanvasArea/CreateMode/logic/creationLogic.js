
import { CanvasInfo } from "../../../../crosscutting/constants/canvasConstants"
import { CreationDefaults } from "../../../../crosscutting/constants/creationConstants";
import {
  CreatureDefaults,
  AllCreatureDefaults,
} from "../../../../crosscutting/constants/creatureConstants"
import { ObjectType } from "../../../../crosscutting/constants/objectConstants";
import { drawBox, fillBackground } from "../../../../crosscutting/logic/canvasLogic";
import CreationCanvasClass from "../subclasses/creationCanvasInfo"
import TileClass from "../subclasses/tileInfo";

//#region Show creature colors logic
export const getCreatureSizesColorsAndPositions = () => {
  let array = [];

  let xStart = 5;
  let yStart = 5;
  AllCreatureDefaults.forEach(cd => {
    array.push({
      color: cd.color,
      size: cd.size,
      xStart: xStart,
      yStart: yStart
    });

    xStart = xStart + cd.size + 3;
  });

  return array;
}


//#endregion

//#region Conversion logic

export const convertJsonCodeToLandscapeObject = (jsonCode) => {
  let newObj = JSON.parse(jsonCode);
  let canvasClass = createCreationCanvasClass(newObj.xTiles, newObj.yTiles, newObj.bgColor);

  let landscapeName = newObj.name;
  let bgColor = newObj.bgColor;
  let canvasWidth = canvasClass.width;
  let canvasHeight = canvasClass.height;
  let objectInfos = [];

  newObj.objects.forEach(ro => {
    let info = convertObjectInfo(ro, canvasClass);
    objectInfos.push(info);
  });

  let landscape = {
    name: landscapeName,
    bgColor: bgColor,
    width: canvasWidth,
    height: canvasHeight,
    objects: objectInfos
  }

  return landscape;
}

//#endregion

//#region Creation Canvas Logic

export const createCreationCanvasClass = (xTiles, yTiles, bgColor) => {
  let newCanvas = new CreationCanvasClass(xTiles, yTiles, bgColor);
  return newCanvas;
}

export const renderCreationCanvas = (canvasRef, creationCanvas, showGridLines = true) => {
  // fill background
  fillBackground(canvasRef.current, creationCanvas.bgColor);

  // render all the tiles
  renderGridTiles(canvasRef, creationCanvas, showGridLines);
}

export const renderCColors = (canvasRef, cColors) => {
  console.log(`render cc colors`);
  cColors.forEach(cc => {
    renderCColor(canvasRef.current, cc);
  });
}

const renderCColor = (canvas, cColor) => {
  let ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.fillStyle = cColor.color;
  ctx.fillRect(
    cColor.xStart,
    cColor.yStart,
    cColor.size,
    cColor.size
  );
  ctx.closePath();
}

const renderGridTiles = (canvasRef, creationCanvas, showGridLines) => {
  for (let y = 0; y < creationCanvas.grid.length; y++) {
    let row = creationCanvas.grid[y];
    for (let x = 0; x < row.length; x++) {
      let tile = row[x];
      renderTile(canvasRef, tile, showGridLines);
    }
  }
}

const renderTile = (canvasRef, tileInfo, showGridLines) => {
  // first draw outer tile lines
  let color = tileInfo.isSelected
    ? CreationDefaults.OUTER_SELECTED_COLOR
    : CreationDefaults.OUTER_TILE_COLOR;
  let thickness = tileInfo.isSelected
    ? CreationDefaults.OUTER_SELECTED_THICKNESS
    : CreationDefaults.OUTER_TILE_LINE_THICKNESS;

  if (showGridLines || tileInfo.isSelected) {
    drawBox(canvasRef.current, color, thickness,
      tileInfo.xStartO, tileInfo.xEndO,
      tileInfo.yStartO, tileInfo.yEndO);
  }

  // draw inner tile lines
  if (showGridLines) {
    color = CreationDefaults.INNER_TILE_COLOR;
    thickness = CreationDefaults.INNER_TILE_LINE_THICKNESS;
    drawBox(canvasRef.current, color, thickness,
      tileInfo.xStartI, tileInfo.xEndI,
      tileInfo.yStartI, tileInfo.yEndI);
  }

  // draw object fill
  if (tileInfo.isColoredIn) {
    color = tileInfo.objectColor;
    let positions = tileInfo.getColorFillPositions();
    let ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.fillRect(positions.xStart, positions.yStart,
      positions.width, positions.height);
    ctx.closePath();
  }

}


//#endregion

//#region Selector Logic

export const makeDeepSelectedTilesCopy = (selectedTiles) => {
  let copy = [];
  selectedTiles.forEach(st => {
    copy.push({
      hasSelectedTile: st.hasSelectedTile,
      // tile: makeDeepTileCopy(st.tile),
      tile: st.tile,
      iX: st.iX,
      iY: st.iY
    });
  });
  return copy;
}

export const isOnCanvasEdge = (iX, iY, xTiles, yTiles) => {
  if (iX === 0 || iX === xTiles - 1 ||
      iY === 0 || iY === yTiles - 1) {
        return true;
  }
  return false;
}

export const isObjectOnSurroundingTile = (iX, iY, creationCanvas) => {
  let relPositions = [
    {iX: -1, iY: -1}, {iX: 0, iY: -1}, {iX: 1, iY: -1},
    {iX: -1, iY: 0}, {iX: 0, iY: 0}, {iX: 1, iY: 0},
    {iX: -1, iY: 1}, {iX: 0, iY: 1}, {iX: 1, iY: 1},
  ];

  let checkPositions = [];
  relPositions.forEach(rp => {
    let iXNew = iX + rp.iX;
    let iYNew = iY + rp.iY;

    let doUse = true;
    if (iXNew < 0 || iXNew >= creationCanvas.xTiles ||
        iYNew < 0 || iYNew >= creationCanvas.yTiles) {
      doUse = false;
    }

    if (doUse) {
      checkPositions.push({iX: iXNew, iY: iYNew});
    }
  });
  
  for (let i = 0; i < checkPositions.length; i++) {
    let tile = creationCanvas.getTileAtGridPosition(checkPositions[i]);
    if (tile.hasObject) {
      return true;
    }
  }
  return false;
}

export const isSameGridPosition = (coord1, coord2) => {
  if (coord1.iX === coord2.iX &&
    coord1.iY === coord2.iY) {
      return true;
    }
  return false;
}

export const getEmptySelectorArray = () => { // should have 3
  return [
    getEmptySelectedIndicator(),
    getEmptySelectedIndicator(),
    getEmptySelectedIndicator()
  ];
}

export const getEmptySelectedIndicator = () => {
  return {
    hasSelectedTile: false,
    tile: null,
    iX: 0,
    iY: 0
  };
}

export const canSelectTileWithLastCheck = (selectorTiles, creationCanvas) => {
  let determiners = getStartAndEndDeterminers(selectorTiles);

  let grid = creationCanvas.grid;

  let iXStart = determiners.startXDeterminer.iX;
  let iYStart = determiners.startYDeterminer.iY;
  let iXEnd = determiners.endXDeterminer.iX;
  let iYEnd = determiners.endYDeterminer.iY;

  for (let y = iYStart; y <= iYEnd; y++) {
    let row = grid[y];
    for (let x = iXStart; x <= iXEnd; x++) {
      let tile = row[x];
      if (tile.hasObject) {
        return false;
      }
    }
  }
  
  return true;
}

//#endregion

//#region Tile Logic
export const makeDeepTileCopy = (tile) => {
  if (tile === null) {
    return null;
  }

  let newTile = new TileClass(tile.xIndex, tile.yIndex);
  newTile.isColoredIn = tile.isColoredIn;
  newTile.isLeftColored = tile.isLeftColored;
  newTile.isRightColored = tile.isRightColored;
  newTile.isTopColored = tile.isTopColored;
  newTile.isBottomColored = tile.isBottomColored;
  newTile.isSelected = tile.isSelected;
  newTile.hasObject = tile.hasObject;
  return newTile;
}

export const findTileCoordinate = (tileLength, mouseCoord) => {
  let coord = Math.floor(mouseCoord / tileLength)
    return coord;
}

export const determineOuterTileSize = () => {
  let size = determineInnerTileSize() + (2 * getInnerTileOffset());
  return size;
}

export const determineInnerTileSize = () => {
  return CreatureDefaults.LARGEST_SIZE;
}

export const getInnerTileOffset = () => {
  return CanvasInfo.OBJECT_PADDING + 1;
}

// Tile position determining
export const determineOuterTileStartPos = (index, outerSize) => {
  return index * outerSize;
}

//#endregion

//#region Object info methods

export const removeObjectFromTiles = (iXStart, iXEnd, iYStart, iYEnd, creationCanvas) => {
  for (let y = iYStart; y <= iYEnd; y++) {
    let row = creationCanvas.grid[y];
    for (let x = iXStart; x <= iXEnd; x++) {
      let tile = row[x];
      tile.hasObject = false;
    }
  }
}

export const convertObjectInfo = (relativeInfo, creationCanvas) => {
  let xStartTile = creationCanvas.getTileAtGridPosition({iX: relativeInfo.iXStart, iY: 0});
  let xStart = getPointFromInnerTile(xStartTile, "xStart");

  let xEndTile = creationCanvas.getTileAtGridPosition({iX: relativeInfo.iXEnd, iY: 0});
  let xEnd = getPointFromInnerTile(xEndTile, "xEnd");

  let yStartTile = creationCanvas.getTileAtGridPosition({iX: 0, iY: relativeInfo.iYStart});
  let yStart = getPointFromInnerTile(yStartTile, "yStart");

  let yEndTile = creationCanvas.getTileAtGridPosition({iX: 0, iY: relativeInfo.iYEnd});
  let yEnd = getPointFromInnerTile(yEndTile, "yEnd");

  let width = xEnd - xStart;
  let height = yEnd - yStart;

  let info = {
    name: relativeInfo.name,
    type: relativeInfo.type,
    color: relativeInfo.color,
    xStart: xStart,
    yStart: yStart,
    width: width,
    height: height
  }

  return info;
}

export const createObjectInfoFromSelected = (objectNumber, selectedTiles, creationCanvas, color) => {
  let name = `w${objectNumber}`;
  let type = ObjectType.WALL;
  let determiners = getStartAndEndDeterminers(selectedTiles);
  let pos = getAllStartPositionsAndLengths(determiners);

  // This also will set a bool in the object tiles so they can't be selected anymore
  setNewObjectOnTiles(determiners, creationCanvas);

  let info = {
    name: name,
    type: type,
    color: color,
    xStart: pos.xStart,
    yStart: pos.yStart,
    width: pos.width,
    height: pos.height
  };

  let iXStart = determiners.startXDeterminer.iX;
  let iYStart = determiners.startYDeterminer.iY;
  let iXEnd = determiners.endXDeterminer.iX;
  let iYEnd = determiners.endYDeterminer.iY;

  let info2 = {
    name: name,
    type: type,
    color: color,
    iXStart: iXStart,
    iYStart: iYStart,
    iXEnd: iXEnd,
    iYEnd: iYEnd
  };

  //return info;
  return {
    mainInfo: info,
    relativeInfo: info2
  }
}

const setNewObjectOnTiles = (determiners, creationCanvas) => {
  let grid = creationCanvas.grid;

  let iXStart = determiners.startXDeterminer.iX;
  let iYStart = determiners.startYDeterminer.iY;
  let iXEnd = determiners.endXDeterminer.iX;
  let iYEnd = determiners.endYDeterminer.iY;

  for (let y = iYStart; y <= iYEnd; y++) {
    let row = grid[y];
    for (let x = iXStart; x <= iXEnd; x++) {
      let tile = row[x];
      tile.hasObject = true;
    }
  }
}

const getStartAndEndDeterminers = (selectorTiles) => {
  let startXDeterminer = null;
  let endXDeterminer = null;
  let startYDeterminer = null;
  let endYDeterminer = null;

  selectorTiles.forEach(st => {
    if (st.hasSelectedTile) {
      if (startXDeterminer === null ||
          st.iX < startXDeterminer.iX) {
            startXDeterminer = st;
      }

      if (startYDeterminer === null ||
        st.iY < startXDeterminer.iY) {
          startYDeterminer = st;
      }

      if (endXDeterminer === null ||
        st.iX > endXDeterminer.iX) {
          endXDeterminer = st;
      }

      if (endYDeterminer === null ||
        st.iY > endYDeterminer.iY) {
          endYDeterminer = st;
      }
    }
  });

  return {
    startXDeterminer: startXDeterminer,
    endXDeterminer: endXDeterminer,
    startYDeterminer: startYDeterminer,
    endYDeterminer: endYDeterminer,
  }
}

const getAllStartPositionsAndLengths = ({startXDeterminer, startYDeterminer, endXDeterminer, endYDeterminer}) => {


  let xStart = getPointFromInnerTile(startXDeterminer.tile, "xStart");
  let yStart = getPointFromInnerTile(startYDeterminer.tile, "yStart");
  let xEnd = getPointFromInnerTile(endXDeterminer.tile, "xEnd");
  let yEnd = getPointFromInnerTile(endYDeterminer.tile, "yEnd");
  let width = xEnd - xStart;
  let height = yEnd - yStart;

  return {
    xStart: xStart,
    yStart: yStart,
    width: width,
    height: height
  };
}

const getPointFromInnerTile = (tile, pointName) => {
  switch (pointName) {
    case "xStart":
      return tile.xStartI;
    case "xEnd":
      return tile.xEndI;
    case "yStart":
      return tile.yStartI;
    case "yEnd":
      return tile.yEndI;
    default:
      return null;
  }
}

//#endregion