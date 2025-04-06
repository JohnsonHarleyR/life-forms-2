import React, { useContext, useEffect, useState } from 'react';
import { LifeContext } from '../../Context/LifeContext';
import CreateMode from './CreateMode/CreateMode';
import NewGame from './NewGame/NewGame';
import Canvas from './Canvas/Canvas';
import GameOver from './GameOver/GameOver';

const CanvasArea = () => {

    const {
        isCreateMode,
        isGameStarted,
        isGameOver
    } = useContext(LifeContext);

    const determineDisplay = () => {
        if (isCreateMode) {
            return <CreateMode />;
        } else if (!isGameStarted) {
            return <NewGame />;
        } else if (isGameOver) {
            return <GameOver />;
        } else {
            return <Canvas />;
        }
    }

    const [display, setDisplay] = useState(determineDisplay());

    useEffect(() => {
        setDisplay(determineDisplay());
    }, [isCreateMode, isGameStarted, isGameOver]);

    return (
        <div>
            {display}
        </div>
    );
}

export default CanvasArea;