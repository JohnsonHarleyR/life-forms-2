import React, {useRef, useState, useEffect, useContext} from 'react';
import { LifeContext } from '../../../Context/LifeContext';
import CreationCanvas from './subcomponents/CreationCanvas';
import { CreationDefaults } from '../../../crosscutting/constants/creationConstants';

const CreateMode = ({}) => {

  const xRef = useRef();
  const yRef = useRef();
  const updateRef = useRef();

  const [xTiles, setXTiles] = useState(CreationDefaults.X_TILES_DEFAULT);
  const [yTiles, setYTiles] = useState(CreationDefaults.Y_TILES_DEFAULT);

  useEffect(() => {
    xRef.current.value = CreationDefaults.X_TILES_DEFAULT;
    yRef.current.value = CreationDefaults.Y_TILES_DEFAULT;
  }, []);

  const updateSize = (evt) => {
    let newX = parseInt(xRef.current.value);
    let newY = parseInt(yRef.current.value);
    setXTiles(newX);
    setYTiles(newY);
  }


  return (
    <div>
      <div>
        <CreationCanvas 
          xTiles={xTiles} 
          yTiles={yTiles}
        />
      </div>
      <div>
        X Tiles: <input type="number" ref={xRef} min={5} /> | 
        Y Tiles: <input type="number" ref={yRef} min={5} />
        <br></br>
        <sup>Warning: changing grid size after adding objects will erase progress.</sup>
        <br></br>
        <button ref={updateRef} onClick={updateSize}>Update Size</button>

      </div>
    </div>

  );
}

export default CreateMode;