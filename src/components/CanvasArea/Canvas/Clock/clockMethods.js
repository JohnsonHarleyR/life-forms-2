import { TimeProps } from "../../../../crosscutting/constants/creatureConstants";


export const getMsPassed = (startTime, currentTime) => {
    let ms = Math.abs(currentTime - startTime);
    return ms;
}

// export const getDaysPassed = (msPassed) => {
//     let msPerDay = TimeProps.MS_PER_DAY;
//     let days = Math.floor(msPassed / msPerDay);
//     return days;
// }

export const getHoursPassed = (msPassed, msPerHour) => {
    let hoursPassed = Math.floor(msPassed / msPerHour);
    return hoursPassed;
}

export const getDaysPassed = (hoursPassed) => {
    let hoursPerDay = TimeProps.HOURS_PER_DAY;
    let days = Math.floor(hoursPassed / hoursPerDay);
    return days;
}

export const getHoursPassedToday = (hoursPassed, daysPassed) => {
    let hoursPerDay = TimeProps.HOURS_PER_DAY;
    let hoursBeforeToday = daysPassed * hoursPerDay;
    let hoursToday = Math.floor(hoursPassed - hoursBeforeToday);
    return hoursToday;
}

export const getTimeStringFromHoursToday = (hoursToday) => {
    let hour = 0;
    let amOrPm = null;

    if (hoursToday === 0 || hoursToday === 24) {
        hour = 12;
        amOrPm = "AM";
    } else if (hoursToday === 12) {
        hour = 12;
        amOrPm = "PM";
    } else if (hoursToday > 12) {
        hour = hoursToday - 12;
        amOrPm = "PM";
    } else {
        hour = hoursToday;
        amOrPm = "AM";
    }

    let timeString = `${hour}:00 ${amOrPm}`;
    return timeString;
}