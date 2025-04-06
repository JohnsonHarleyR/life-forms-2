import { determineOuterTileSize, findTileCoordinate } from "../logic/creationLogic";
import TileClass from "./tileInfo";


export default class CreationCanvasClass {
  constructor(xTiles, yTiles, bgColor) {
    this.bgColor = bgColor;
    
    this.xTiles = xTiles;
    this.yTiles = yTiles;

    this.outerTileSize = determineOuterTileSize();

    this.grid = this.createNewTileGrid();

    this.width = this.outerTileSize * this.xTiles;
    this.height = this.outerTileSize * this.yTiles;
  }

  getTile = (x, y) => {
    let row = this.grid[y];
    let tile = row[x];
    return tile;
  }

  deselectTileInGrid = (iX, iY) => {
    let row = this.grid[iY];
    let tile = row[iX];
    tile.isSelected = false;
  }

  createNewTileGrid = () => {
    let newGrid = [];
    for (let y = 0; y < this.yTiles; y++) {
      let row = [];
      for (let x = 0; x < this.xTiles; x++) {
        let newTile = new TileClass(x, y);
        row.push(newTile);
      }
      newGrid.push(row);
    }

    return newGrid;
  }

  getTileAtMousePosition = ({x, y}) => {
    let coords = this.findTileGridCoordinates(x, y);
    let row = this.grid[coords.iY];
    let tile = row[coords.iX];
    return tile;
  }

  getTileAtGridPosition = ({iX, iY}) => {
    let row = this.grid[iY];
    let tile = row[iX];
    return tile;
  }

  getTileGridCoordinates = ({x, y}) => {
    return {
      iX: findTileCoordinate(this.outerTileSize, x),
      iY: findTileCoordinate(this.outerTileSize, y)
    };
  }

}