import { determineInnerTileSize, determineOuterTileSize, determineOuterTileStartPos, getInnerTileOffset } from "../logic/creationLogic";


export default class TileClass {
  constructor(xIndex, yIndex) {
    this.xIndex = xIndex;
    this.yIndex = yIndex;

    // outer tile info
    this.sizeO = determineOuterTileSize(); // outerSize
    this.xStartO = determineOuterTileStartPos(this.xIndex, this.sizeO);
    this.xEndO = this.xStartO + this.sizeO - 1;
    this.yStartO = determineOuterTileStartPos(this.yIndex, this.sizeO);
    this.yEndO = this.yStartO + this.sizeO - 1;

    // inner tile info
    this.sizeI = determineInnerTileSize();
    this.offsetI = getInnerTileOffset();
    this.xStartI = this.xStartO + this.offsetI;
    this.xEndI = this.xStartI + this.sizeI - 1;
    this.yStartI = this.yStartO + this.offsetI;
    this.yEndI = this.yStartI + this.sizeI - 1;

    // color info
    this.isColoredIn = false;

    this.isLeftColored = false;
    this.isRightColored = false;
    this.isTopColored = false;
    this.isBottomColored = false;

    // selection info
    this.isSelected = false;
    this.hasObject = false;

  }

  updateTile = (tileLeft, tileRight, tileTop, tileBottom) => {
    this.setColoredInInfo(tileLeft, tileRight, tileTop, tileBottom);
  }

  getColorFillPositions = () => {
    let positions = {
      xStart: 0,
      xEnd: 0,
      yStart: 0,
      yEnd: 0,
      width: 0,
      height: 0
    };

    if (!this.isColoredIn) {
      return positions;
    }

    positions.xStart = this.xStartI;
    positions.xEnd = this.xEndI;
    positions.yStart = this.yStartI;
    positions.yEnd = this.yEndI;

    if (this.isLeftColored) {
      positions.xStart = this.xStartO;
    }

    if (this.isRightColored) {
      positions.xEnd = this.xEndO;
    }

    if (this.isTopColored) {
      positions.yStart = this.yStartO;
    }

    if (this.isBottomColored) {
      positions.yEnd = this.yEndO;
    }

    positions.width = positions.xEnd - positions.xStart;
    positions.height = positions.yEnd - positions.yStart;

    return positions;
  }

  setColoredInInfo = (tileLeft, tileRight, tileTop, tileBottom) => {
    if (!this.isColoredIn) {
      return;
    }

    if (tileLeft && tileLeft.isColoredIn) {
      this.isLeftColored = true;
    } else {
      this.isLeftColored = false;
    }

    if (tileRight && tileRight.isColoredIn) {
      this.isRightColored = true;
    } else {
      this.isRightColored = false;
    }

    if (tileTop && tileTop.isColoredIn) {
      this.isTopColored = true;
    } else {
      this.isTopColored = false;
    }

    if (tileBottom && tileBottom.isColoredIn) {
      this.isBottomColored = true;
    } else {
      this.isBottomColored = false;
    }

  }

}