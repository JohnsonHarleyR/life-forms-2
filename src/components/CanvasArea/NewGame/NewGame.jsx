import React, {useRef, useState, useEffect, useContext} from 'react';
import { LifeContext } from '../../../Context/LifeContext';
import { CanvasInfo } from '../../../crosscutting/constants/canvasConstants';
import { StartingCreatureDefaults } from '../../../crosscutting/constants/creatureConstants';
import { DefaultObjects } from '../../../crosscutting/constants/objectConstants';
import { convertJsonCodeToLandscapeObject } from '../CreateMode/logic/creationLogic';
import AddCreatures from './subcomponents/AddCreatures/AddCreatures';
import AddPlants from './subcomponents/AddPlants/AddPlants';
import { ChooseLandscape } from './subcomponents/ChooseLandscape/ChooseLandscape';

const NewGame = ({}) => {

  const startGameRef = useRef();
  const {setIsGameStarted} = useContext(LifeContext);
  const [landscapeJson, setLandscapeJson] = useState("");
  const [canStartGame, setCanStartGame] = useState(false);


  useEffect(() => {
    if (canStartGame) {
      startGameRef.current.disabled = false;
    } else {
      startGameRef.current.disabled = true;
    }
  }, [canStartGame]);

  const handleStartGameClick = (e) => {
    // before starting game, set the landscape stuff
    let obj = convertJsonCodeToLandscapeObject(landscapeJson);
    CanvasInfo.BG_COLOR = obj.bgColor;
    // setCanvasBgColor(obj.bgColor);
    CanvasInfo.WIDTH = obj.width;
    // setCanvasWidth(obj.width);
    CanvasInfo.HEIGHT = obj.height;
    // setCanvasHeight(obj.height);
    DefaultObjects.splice(0, DefaultObjects.length);
    obj.objects.forEach(o => {
      DefaultObjects.push(o);
    })
    // setStartingObjects(obj.objects);

    setIsGameStarted(true);
  }

  return (
    <>
      <AddCreatures setCanStartGame={setCanStartGame}/>
      <AddPlants />
      <ChooseLandscape setLandscapeJson={setLandscapeJson} />
      <br></br>
      {/* {startGameButton} */}
      <button ref={startGameRef} onClick={handleStartGameClick}>Start Game</button>
    </>
  );
}

export default NewGame;