import React, {useRef, useState, useEffect, useContext} from 'react';
import { 
    renderCanvas,
    createObjects,
    createCreatures,
    generatePlants,
    updateShelters,
    updateCreatures,
    updatePlants
} from './canvasMethods';
import { CanvasInfo } from '../../../crosscutting/constants/canvasConstants';
import { Plants, StartingPlants } from '../../../crosscutting/constants/plantConstants';
import { CreatureDefaults, Creatures, PassedOnCreatures, StartingCreatureDefaults } from '../../../crosscutting/constants/creatureConstants';
import { runAllGeneticTests } from '../../../crosscutting/logic/creature/genetics/tests/geneticTests';
import { getMousePos } from '../../../crosscutting/logic/canvasLogic';
import Clock from './Clock/Clock';
import CreatureStats from './CreatureStats/CreatureStats';
import { DefaultObjects, Shelters, Objects } from '../../../crosscutting/constants/objectConstants';
import AddCritter from './AddCritter/AddCritter';

const Canvas = () => {
    
    // TODO method to set the chosen creature

    const canvasRef = useRef();

    const [time, setTime] = useState(Date.now());
    const [intervals, setIntervals] = useState(0);

    useEffect(() => {
        canvasRef.current.width = CanvasInfo.WIDTH;
        canvasRef.current.height = CanvasInfo.HEIGHT;
        let objs = createObjects(DefaultObjects);
        objs.forEach(o => {
            Objects.push(o);
        })
        let newCreatures = createCreatures(StartingCreatureDefaults, Objects, Plants, Shelters);
        Creatures.splice(0, Creatures.length);
        newCreatures.forEach(nc => {
            Creatures.push(nc);
        });
        renderCanvas(canvasRef, Creatures, Plants, Objects, Shelters);
    }, []);

    useEffect(() => {
        if (time) {
            
            const worker = () => {
                let interval = setInterval(() => {
                    postMessage({
                        action: "setTime",
                        time: Date.now()
                    });
                }, 50);

                postMessage({
                    action: "clearInterval",
                    interval: interval
                });
            }
            
            let code = worker.toString();
            code = code.substring(code.indexOf("{")+1, code.lastIndexOf("}"));
            
            const blob = new Blob([code], {type: "application/javascript"});
            const newWorker = new Worker(URL.createObjectURL(blob));
            
            newWorker.onmessage = (m) => {
                if (m.data.action === "setTime") {
                    setTime(m.data.time);
                } else {
                    clearInterval(m.data.interval);
                }

            };
        }
    }, []);

    // TODO refactor the below part after creating creature
    useEffect(() => {
        setIntervals(intervals + 1);
        if (time && Creatures && Creatures.length !== 0) {
            Creatures.forEach(c => {
                c.update(Objects, Plants, Creatures, Shelters, CanvasInfo);
            });
            // update shelters too
            updateCreatures(Creatures, PassedOnCreatures);
            updateShelters(Creatures);
            updatePlants(Plants, StartingPlants);
        }
        renderCanvas(canvasRef, Creatures, Plants, Objects, Shelters);
    }, [time]);

    useEffect(() => {
        if (intervals) {
            //let numberOfPlants = plants.length;
            //console.log(`plant count: ${numberOfPlants}`);
            generatePlants(intervals, Plants, Creatures, Objects, Shelters, StartingPlants, CreatureDefaults.LARGEST_SIZE);
        }
    }, [intervals]);

    // to run tests, uncomment this out
    useEffect(() => {
        runAllGeneticTests();
    }, []);


    const showMousePos = (evt) => {
        let mousePos = getMousePos(canvasRef.current, evt);
        console.log(`Mouse pos: {x: ${Math.round(mousePos.x)}, y: ${Math.round(mousePos.y)}}`);
    }

    return (
        <div>
            <div>
                <Clock time={time} />
            </div>
            <div>
                <canvas
                ref={canvasRef}
                style={{ border: "2px solid black" }}
                onClick={showMousePos}
                />
            </div>
            <div>
                <AddCritter />
                <CreatureStats />
            </div>
        </div>

    );
}

export default Canvas;