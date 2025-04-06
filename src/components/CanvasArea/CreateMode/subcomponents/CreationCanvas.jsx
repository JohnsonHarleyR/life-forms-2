import React, {useRef, useState, useEffect, useContext} from 'react';
import {
    canSelectTileWithLastCheck,
    createCreationCanvasClass,
    createObjectInfoFromSelected,
    getCreatureSizesColorsAndPositions,
    getEmptySelectedIndicator,
    getEmptySelectorArray,
    isObjectOnSurroundingTile,
    isOnCanvasEdge,
    isSameGridPosition,
    makeDeepSelectedTilesCopy,
    removeObjectFromTiles,
    renderCColors,
    renderCreationCanvas,
} from '../logic/creationLogic';
import { LifeContext } from '../../../../Context/LifeContext';
import { drawAllObjects, getMousePos } from '../../../../crosscutting/logic/canvasLogic';

const CreationCanvas = ({xTiles, yTiles}) => {
    
    // TODO method to set the chosen creature

    const canvasRef = useRef();
    const addObjectRef = useRef();
    const colorRef = useRef();
    const bgColorRef = useRef();
    const showGridRef = useRef();
    const undoRef = useRef();
    const codeRef = useRef();
    const nameRef = useRef();
    const showCColorsRef = useRef();
    
    const {} = useContext(LifeContext);
    const [bgColor, setBgColor] = useState("#ffffff");
    const [creationCanvas, setCreationCanvas] // TODO allow updates to this with tiles
        = useState(createCreationCanvasClass(xTiles, yTiles, "#ffffff"));

    const [showGridLines, setShowGridLines] = useState(true);

    const [selectorIndex, setSelectorIndex] = useState(0);
    const [selectedTiles, setSelectedTiles] = useState(getEmptySelectorArray());
    const [canFinishObject, setCanFinishObject] = useState(false);
    
    const [objectColor, setObjectColor] = useState("#000000");
    const [objectCount, setObjectCount] = useState(1);
    const [newObjects, setNewObjects] = useState([]);
    const [relativeObjects, setRelativeObjects] = useState([]);

    const [showCColors, setShowCColors] = useState(false);
    const [cColors, setCColors] = useState(getCreatureSizesColorsAndPositions());

    const [landscapeName, setLandscapeName] = useState("Landscape Name Here");

    //#region effects

    useEffect(() => {
        colorRef.current.value = "#000000";
        bgColorRef.current.value = "#ffffff";
        showGridRef.current.checked = true;
        nameRef.current.value = landscapeName;
    }, []);

    useEffect(() => {
        if (xTiles && yTiles) {
            resetSelector();
            setNewObjects([]);
            setRelativeObjects([]);
            setCreationCanvas(createCreationCanvasClass(xTiles, yTiles, bgColor));
        }
    }, [xTiles, yTiles]);

    useEffect(() => {
        if (creationCanvas) {
            canvasRef.current.width = creationCanvas.width;
            canvasRef.current.height = creationCanvas.height;
            renderCanvas();
        }
    }, [creationCanvas]);

    useEffect(() => {
        if (selectedTiles) {
            renderCanvas();
        }
    }, [selectedTiles, newObjects]);

    useEffect(() => {
        if (selectorIndex !== undefined) {
            if (selectorIndex === 0) {
                setCanFinishObject(false);
            } else {
                setCanFinishObject(true);
            }
        }
    }, [selectorIndex]);

    useEffect(() => {
        if (canFinishObject) {
            addObjectRef.current.disabled = false;
        } else {
            addObjectRef.current.disabled = true;
        }
    }, [canFinishObject]);

    useEffect(() => {
        if (newObjects) {
            renderCanvas();

            if (newObjects.length === 0) {
                undoRef.current.disabled = true;
            } else {
                undoRef.current.disabled = false;
            }
        }
    }, [newObjects]);

    useEffect(() => {
        if (bgColor && creationCanvas) {
            creationCanvas.bgColor = bgColor;
            renderCanvas();
        }
    }, [bgColor]);

    useEffect(() => {
        renderCanvas();
    }, [showGridLines, showCColors]);

    //#endregion

    //#region render methods
    const renderCanvas = () => {
        renderCreationCanvas(canvasRef, creationCanvas, showGridLines);
        if (newObjects) {
            drawNewObjects();
        }
        if (showCColors) {
            console.log('show ccColors');
            renderCColors(canvasRef, cColors);
        }
    }
    //#endregion

    //#region click/change methods
    const clickCanvas = (evt) => {
        let mousePos = getMousePos(canvasRef.current, evt);
        //console.log(`Mouse pos: {x: ${Math.round(mousePos.x)}, y: ${Math.round(mousePos.y)}}`);

        // get selected grid coordinates for tile clicked
        let tileCoords = creationCanvas.getTileGridCoordinates(mousePos);

        // see if tile is already selected
        if (isTileAlreadySelected(tileCoords)) {
            // if it's already selected, deselect it and do all associated actions
            deselectTile(tileCoords);

        } // otherwise, see if tile can be selected
        else if (canTileBeSelected(tileCoords)) {
            // if it can, select the tile
            selectTile(tileCoords);
        }

    }

    const toggleCColors = (evt) => {
        if (showCColors) {
            setShowCColors(false);
        } else {
            setShowCColors(true);
        }
    }

    const clickLogCodeBtn = (evt) => {
        let json = createJsonObjectForCreation();
        console.log(json);
    }

    const changeLandscapeName = (evt) => {
        setLandscapeName(nameRef.current.value.trim());
    }

    const changeColor = (evt) => {
        setObjectColor(colorRef.current.value);
    }

    const changeBgColor = (evt) => {
        setBgColor(bgColorRef.current.value);
    }

    const toggleGridLines = (evt) => {
        setShowGridLines(showGridRef.current.checked);
    }

    const clickAddObjectBtn = (evt) => {
        // get object info
        let objectInfos = createObjectInfoFromSelected(objectCount, selectedTiles,
            creationCanvas, objectColor);
        // let newObjectInfo = createObjectInfoFromSelected(objectCount, selectedTiles,
        //     creationCanvas, objectColor);
        let newObjectInfo = objectInfos.mainInfo;
        let relativeInfo = objectInfos.relativeInfo;

        // adjust object count
        let newCount = objectCount + 1;
        setObjectCount(newCount);

        // reset selected tiles and selector index
        resetSelector();

        // add to new objects
        let copy = [...newObjects];
        copy.push(newObjectInfo);
        setNewObjects(copy);

        let relCopy = [...relativeObjects];
        relCopy.push(relativeInfo);
        setRelativeObjects(relCopy);
    }

    const clickUndoBtn = (evt) => {
        if (newObjects.length > 0 && relativeObjects.length > 0) {
            let newObjectsCopy = [...newObjects];
            newObjectsCopy.pop();
            let relativeObjectsCopy = [...relativeObjects];
            let erased = relativeObjectsCopy.pop();
            removeObjectFromTiles(
                erased.iXStart,
                erased.iXEnd,
                erased.iYStart,
                erased.iYEnd,
                creationCanvas);
            setNewObjects(newObjectsCopy);
            setRelativeObjects(relativeObjectsCopy);
        }
    }
    
    //#endregion

    //#region object methods
    const drawNewObjects = () => {
        drawAllObjects(canvasRef.current, newObjects);
    }

    //#endregion

    //#region selector index methods

        // for undoing a selected tile
        const decrementSelectorIndex = () => {
            let newNum = selectorIndex - 1;
            if (newNum < 0) { // cannot go below 0
                newNum = 0;
            }
            setSelectorIndex(newNum);
        }

        const incrementSelectorIndex = () => {
            let newNum = selectorIndex + 1;
            if (newNum > 2) { // cannot go below 0
                newNum = 2;
            }
            setSelectorIndex(newNum);
        }

        // after selecting a tile - if it reaches past 3, it's time to create the object
        const cycleSelectorIndexForward = () => {
            let newNum = selectorIndex + 1;
            if (newNum > 2) {
                newNum = 0;
            }
            setSelectorIndex(newNum);
        }

        const cycleSelectorIndexBackward = () => {
            let newNum = selectorIndex - 1;
            if (newNum < 0) {
                newNum = 2;
            }
            setSelectorIndex(newNum);
        }

    //#endregion

    //#region tile selector methods
    const resetSelector = () => {
        // first go through selected tiles and set isSelected to false
        selectedTiles.forEach(st => {
            if (st.hasSelectedTile) {
                st.tile.isSelected = false;
            }
        });

        setSelectedTiles(getEmptySelectorArray());
        setSelectorIndex(0);
    }

    const canTileBeSelected = ({iX, iY}) => {
        // TODO add logic to ensure object isn't right next to wall or another object
        if (selectedTiles[2].hasSelectedTile) {
            return false;
        }

        let tile = creationCanvas.getTileAtGridPosition({iX, iY});
        if (tile.hasObject) {
            return false;
        }
        if (isOnCanvasEdge(iX, iY, xTiles, yTiles) ||
            isObjectOnSurroundingTile(iX, iY, creationCanvas)) {
                return false;
        }

        let coord0;
        let coord1;
        switch(selectorIndex) {
            case 0:
                return true;
            case 1:
                coord0 = {iX: selectedTiles[0].iX, iY: selectedTiles[0].iY};
                if (coord0.iX === iX || coord0.iY === iY) {
                    return true;
                }
                return false;
            case 2:
                coord0 = {iX: selectedTiles[0].iX, iY: selectedTiles[0].iY};
                coord1 = {iX: selectedTiles[1].iX, iY: selectedTiles[1].iY};

                if ((coord0.iX === iX && coord1.iX === iX) ||
                    (coord0.iY === iY && coord1.iY === iY)) {
                    return false;
                }
                if (coord0.iX === iX || coord0.iY === iY ||
                    coord1.iX === iX || coord1.iY === iY ) {
                    return true;
                }
                return false;
        }
    }

    const selectTile = (coords) => {
        let tileToSelect = creationCanvas.getTileAtGridPosition(coords);

        //let selectedCopy = [...selectedTiles];
        let selectedCopy = makeDeepSelectedTilesCopy(selectedTiles);
        selectedCopy[selectorIndex].hasSelectedTile = true;
        selectedCopy[selectorIndex].tile = tileToSelect;
        selectedCopy[selectorIndex].iX = coords.iX;
        selectedCopy[selectorIndex].iY = coords.iY;

        if (canSelectTileWithLastCheck(selectedCopy, creationCanvas)) {
            tileToSelect.isSelected = true;
            setSelectedTiles(selectedCopy);
            incrementSelectorIndex();
        }
    }

    const isTileAlreadySelected = ({iX, iY}) => {
        if (selectorIndex === 0) {
            return false;
        }

        let startIndex = selectorIndex !== 2 ? selectorIndex - 1 : 2;
        for (let i = startIndex; i >= 0; i--) {
            if (isSameGridPosition(
                {iX, iY},
                {iX: selectedTiles[i].iX, iY: selectedTiles[i].iY}
                )) {
                    return true;
            }
        }

        return false;
    }

    const deselectTile = (coords) => {
        let selectedIndex = getSelectedIndexOfAlreadySelectedTile(coords);
        deselectTilesFromPointOfIndex(selectedIndex);
    }

    const getSelectedIndexOfAlreadySelectedTile = ({iX, iY}) => {
        if (selectorIndex === 0) {
            return 0;
        }

        let startIndex = selectorIndex !== 2 ? selectorIndex - 1 : 2;
        for (let i = startIndex; i >= 0; i--) {
            if (isSameGridPosition(
                {iX, iY},
                {iX: selectedTiles[i].iX, iY: selectedTiles[i].iY}
                )) {
                    return i;
            }
        }
        return 0;
    }

    const deselectTilesFromPointOfIndex = (index) => {
        let copy = [...selectedTiles];
        for (let i = selectorIndex; i >= index; i--) {
            if (copy[i].tile !== null) {
                creationCanvas.deselectTileInGrid(copy[i].iX, copy[i].iY);
                copy[i] = getEmptySelectedIndicator();
            }
        }

        setSelectedTiles(copy);
        setSelectorIndex(index);
    }
    

    //#endregion

    //#region generate code methods
    
    const createJsonObjectForCreation = () => {
        let obj = {
            name: landscapeName,
            bgColor: bgColor,
            xTiles: xTiles,
            yTiles: yTiles,
            objects: relativeObjects
        };
        return JSON.stringify(obj);
    }

    //#endregion

    return (
        <div>
            <div>
                <h2>Landscape Creator</h2>
                <input 
                type="text"
                ref={nameRef}
                onChange={changeLandscapeName}
                />
                <br></br>
                <button
                ref={codeRef}
                onClick={clickLogCodeBtn}
                >
                    Log Code
                </button>
                <br></br>
                <br></br>
                <button
                ref={showCColorsRef}
                onClick={toggleCColors}
                >
                    Toggle Creature Color Display
                </button>
                <br></br>
                Object Color:  
                <input
                type="color"
                ref={colorRef}
                onChange={changeColor}
                />
                <button 
                ref={addObjectRef}
                onClick={clickAddObjectBtn}>Add Object</button>
                <button
                ref={undoRef}
                onClick={clickUndoBtn}>
                    Undo Object
                </button>
                <br></br>
                <canvas
                ref={canvasRef}
                style={{ border: "2px solid black" }}
                onClick={clickCanvas}
                />
                <br></br>
                Background Color: 
                <input
                type="color"
                ref={bgColorRef}
                onChange={changeBgColor}
                />
                Show grid?: 
                <input 
                type="checkbox"
                ref={showGridRef}
                onChange={toggleGridLines}
                />
            </div>
        </div>

    );
}

export default CreationCanvas;