
const moment = require('moment');
exports.getPreviousTuesday = (date) => {
    const day = date.getDay(); // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const daysToSubtract = (day + 5) % 7; // Calculate how many days to subtract to get to the last Tuesday
    const lastTuesdayDate = new Date(date);
    lastTuesdayDate.setDate(date.getDate() - daysToSubtract);
    return lastTuesdayDate.toISOString().slice(0, 10);
};

exports.getNextMonday = (date) => {
    const day = date.getDay(); // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const daysToAdd = (8 - day) % 7; // Calculate how many days to add to get to the next Monday
    const nextMondayDate = new Date(date);
    nextMondayDate.setDate(date.getDate() + daysToAdd);
    return nextMondayDate.toISOString().slice(0, 10);
};

exports.getCurrentDateAndTime = () => {
    const now = new Date();
    const ISTOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
    const indianTime = new Date(now.getTime() + ISTOffset);
    return indianTime;
}

exports.getCurrentDate = () => {
    const now = new Date();
    const ISTOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
    const indianDate = new Date(now.getTime() + ISTOffset);
    return indianDate.toISOString().split('T')[0];
}

exports.getDateByMonth = (month_value) => {
    const inputDate = moment(exports.getCurrentDateAndTime());
    const newDate = inputDate.add(month_value, 'months');
    const formattedDate = newDate.format('YYYY-MM-DDTHH:mm:ss.SSSZ');
    return formattedDate;
}

exports.addDaysToDate = (days) => {
    const currentDate = exports.getCurrentDateAndTime();
    const daysToAdd = parseInt(days);
    currentDate.setDate(currentDate.getDate() + daysToAdd);
    const customDate = currentDate.toISOString();
    return customDate;
}

exports.checkDatesDifference = (date, dateDifference) => {

    let currentDate = exports.getCurrentDate();
    let nextDate = moment(date).format('YYYY-MM-DD');

    // Convert the given dates to Date objects if they are not already
    if (!(currentDate instanceof Date)) {
        currentDate = new Date(currentDate);
    }
    if (!(nextDate instanceof Date)) {
        nextDate = new Date(nextDate);
    }

    const differenceInMilliseconds = Math.abs(currentDate - nextDate);
    const daysDifference = differenceInMilliseconds / (1000 * 60 * 60 * 24);
    return daysDifference < parseInt(dateDifference);
}

exports.isDateExpired = (body) => {
    const date = new Date(body);
    const currentDateTime = new Date(exports.getCurrentDateAndTime());
    return date < currentDateTime;
}

exports.getNextDay = () => {
    const currentDateIST = moment().tz('Asia/Kolkata');
    const nextDayDateIST = currentDateIST.add(1, 'days');
    const formattedDate = nextDayDateIST.format('YYYY-MM-DD');
    return formattedDate;
}

exports.generateExpiryDate = (inputDate, numberOfDays) => {
    let date = new Date(inputDate);
    date.setDate(date.getDate() + parseInt(numberOfDays));
    let expiryDate = `${(moment(date).format("YYYY-MM-DD"))}T23:59:59.999Z`;
    return expiryDate;
}
