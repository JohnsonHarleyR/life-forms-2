import React, {useState, useEffect} from 'react';
import { getDaysPassed, getHoursPassed, getHoursPassedToday, getMsPassed, getTimeStringFromHoursToday } from './clockMethods';
import { TimeProps } from '../../../../crosscutting/constants/creatureConstants';
import { CanvasInfo } from '../../../../crosscutting/constants/canvasConstants';

const Clock = ({time}) => {

    const msPerHour = TimeProps.MS_PER_DAY / TimeProps.HOURS_PER_DAY;
    const msToAdd = msPerHour * CanvasInfo.STARTING_HOUR;

    const [displayString, setDisplayString] = useState('');


    useEffect(() => { 
        if (time) {
            let passed = getMsPassed(CanvasInfo.START_TIME, time) + msToAdd;
            let hoursPassed = getHoursPassed(passed, msPerHour);
            let daysPassed = getDaysPassed(hoursPassed);
            let day = CanvasInfo.CURRENT_DAY;
            if (daysPassed + 1 > day) {
                day = daysPassed + 1;
                CanvasInfo.CURRENT_DAY = day;
            }
            let hoursToday = getHoursPassedToday(hoursPassed, daysPassed);
            let tString = getTimeStringFromHoursToday(hoursToday);
            let newDisplay = `${tString} - Day ${day}`;
            setDisplayString(newDisplay);
        }
    }, [time]);

    return (
        <>
            <h2>
            {displayString}
            </h2>
        </>
    );
}

export default Clock;