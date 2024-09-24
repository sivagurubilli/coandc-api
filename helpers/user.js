const { Employer, Cook, ClientPoints, IpAddress, BlockedMac, AllowedMac, MacList } = require("../models");
const { getCurrentDateAndTime, getCurrentDate, addDaysToDate, isDateExpired } = require("./dates");
const moment = require("moment");

exports.isEmailAvailable = async (email, messageCode) => {
    try {
        let message = (!messageCode || messageCode == 0) ? "This email is associated with an account. Please try signing in" : "This email is associated with an account. Please try with another email";
        let cookData = await Cook.findOne({ email: email.toLowerCase(), status: { $ne: 0 } });
        let employerData = await Employer.findOne({ email, status: { $ne: 0 } });

        if (cookData || employerData) throw { statusCode: 409, responseCode: 3, msg: message }
    }
    catch (e) {
        throw e
    }
}

exports.isMobileAvailable = async (mobile, messageCode) => {
    try {
        let message = (!messageCode || messageCode == 0) ? "This phone number is associated with an account. Please try signing in" : "This phone number is associated with an account. Please try with another phone number";
        let cookData = await Cook.findOne({ mobile, status: { $ne: 0 } });
        let employerData = await Employer.findOne({ mobile, status: { $ne: 0 } });
        if (cookData || employerData) throw { statusCode: 409, responseCode: 4, msg: message }
    }
    catch (e) {
        throw e
    }
}

exports.isWhatsappNumberAvailable = async (whatsappNumber, userId) => {
    try {
        let cookData = await Cook.findOne({ whatsappNumber, whatsappNumberVerified: 1 });
        let employerData = await Employer.findOne({ whatsappNumber, whatsappNumberVerified: 1 });
        if ((cookData && (cookData._id).toString() == userId) || (employerData && (employerData._id).toString() == userId)) throw { statusCode: 400, responseCode: 0, msg: "This whatsapp number is currently linked with your account." }
        if ((cookData && (cookData._id).toString() != userId) || (employerData && (employerData._id).toString() != userId)) throw { statusCode: 409, responseCode: 0, msg: "This whatsapp number is already linked with another account. Do you want to update it?" }
    }
    catch (e) {
        throw e
    }
}

exports.getMobileData = async (mobile) => {
    try {
        let cookData, empData = null;
        cookData = await Employer.findOne({ mobile, status: { $ne: 0 } })
        empData = await Cook.findOne({ mobile, status: { $ne: 0 } })
        if (cookData || empData) throw { statusCode: 409, responseCode: 4, msg: "This phone number is associated with an account. Please try signing in" }
    }
    catch (e) {
        throw e
    }
}

exports.checkRegistrationLimits = async (body) => {
    try {
        let { mobile, role } = body;
        let data, modelName, startDate, endDate, date = null;
        date = getCurrentDate();
        startDate = `${date}T00:00:00.000Z`, endDate = `${date}T23:59:59.999Z`
        modelName = (role == "cook") ? Cook : Employer;
        data = await modelName.find({ status: 0, mobile, createdAt: { $gte: startDate, $lt: endDate } }).countDocuments();
        if (data >= 5) throw { statusCode: 500, responseCode: 5, msg: "Daily registrations limit is reached for phone number" }
    }
    catch (e) {
        throw e
    }
}

exports.customFullNameValidator = (fullName) => {
    try {
        if (fullName.startsWith("'") || fullName.endsWith("'")) {
            throw { statusCode: 500, responseCode: 2, msg: "Full Name cannot start or end with an apostrophe" };
        }
        return fullName;
    }
    catch (e) {
        throw e
    }
};

exports.assignInitialFreePlan = async (body) => {
    try {
        let { userId, memberType } = body;
        let data = await ClientPoints.findOneAndUpdate({ _id: userId, planType: 'free', isDeleted: false }, {
            $set: {
                clientId: userId,
                planType: 'free', planStartsAt: getCurrentDateAndTime(), planExpiresAt: `${(moment(addDaysToDate(180)).format("YYYY-MM-DD"))}T23:59:59.999Z`,
                totalEventPoints: 2, totalHouseCookPoints: 20, totalPartyCateringPoints: 20,
                currentEventPoints: 2, currentHouseCookPoints: 20, currentPartyCateringPoints: 20,
                createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime()
            }
        }, { new: true, upsert: true })
        if (!data) throw Error("Unable to verify.Try again")
    }
    catch (e) {
        throw e
    }
}

exports.isValidName = (fullName, userType) => {

    if (userType === 1) {
        // For userType 1, use the regex /^(?!\d+$)[a-zA-Z][a-zA-Z0-9_ ']{3,}$/
        return /^(?!\d+$)[a-zA-Z][a-zA-Z0-9_ ']{3,}$/.test(fullName);
    } else if (userType === 2) {
        // For userType 2, use the regex /^(?=.*[a-zA-Z])[a-zA-Z0-9'@& -_]{4,}$/
        return /^(?=.*[a-zA-Z])[a-zA-Z0-9'@& -_]{4,}$/.test(fullName);
    }
    return false; // Return false for unsupported userType
}

exports.calculateCookAverages = (arrayOfObjects) => {
    const result = {
        hygiene: { ratingSum: 0, ratingsCount: 0, ratingAvg: 0 },
        taste: { ratingSum: 0, ratingsCount: 0, ratingAvg: 0 },
        punctuality: { ratingSum: 0, ratingsCount: 0, ratingAvg: 0 },
        behaviour: { ratingSum: 0, ratingsCount: 0, ratingAvg: 0 },
    };

    if (arrayOfObjects.length === 0) {
        delete result.hygiene.ratingSum;
        delete result.taste.ratingSum;
        delete result.punctuality.ratingSum;
        delete result.behaviour.ratingSum;
        return result;
    }

    arrayOfObjects.forEach(obj => {
        for (const key in obj) {
            if (obj.hasOwnProperty(key) && result[key]) {
                result[key].ratingSum += obj[key];
                result[key].ratingsCount += 1;
            }
        }
    });

    for (const key in result) {
        if (result.hasOwnProperty(key)) {
            result[key].ratingAvg =
                result[key].ratingsCount > 0
                    ? result[key].ratingSum / result[key].ratingsCount
                    : 0;
            delete result[key].ratingSum;
        }
    }

    return result;
}


exports.calculateEmployerRatingAverages = (arrayOfObjects) => {
    const result = {
        workculture: { ratingSum: 0, ratingsCount: 0, ratingAvg: 0 },
        salary: { ratingSum: 0, ratingsCount: 0, ratingAvg: 0 },
        facilities: { ratingSum: 0, ratingsCount: 0, ratingAvg: 0 },
        behaviour: { ratingSum: 0, ratingsCount: 0, ratingAvg: 0 },
    };

    if (arrayOfObjects.length === 0) {
        delete result.workculture.ratingSum;
        delete result.salary.ratingSum;
        delete result.facilities.ratingSum;
        delete result.behaviour.ratingSum;
        return result;
    }

    arrayOfObjects.forEach(obj => {
        for (const key in obj) {
            if (obj.hasOwnProperty(key) && result[key]) {
                result[key].ratingSum += obj[key];
                result[key].ratingsCount += 1;
            }
        }
    });

    for (const key in result) {
        if (result.hasOwnProperty(key)) {
            result[key].ratingAvg =
                result[key].ratingsCount > 0
                    ? result[key].ratingSum / result[key].ratingsCount
                    : 0;
            delete result[key].ratingSum;
        }
    }

    return result;
}

exports.isBlockedMACOrNot = async (macaddress, scenario) => {
    try {
        const macCount = await BlockedMac.findOne({ macaddress });
        if (ipCount.length || macCount.length) throw { statusCode: 403, responseCode: 0, msg: `${scenario} failed. Please contact support team.` }
    }
    catch (e) {
        throw e
    }
}

exports.checkLoginMACLimit = async (macAddress) => {
    try {


        const data = await BlockedMac.findOne({ macAddress });
        if (data) throw { statusCode: 403, responseCode: 0, msg: `Login failed. Please contact support team.` }

        let cookMacsCount = await Cook.find({ loginMAC: macAddress, status: { $nin: [0] } }).countDocuments();
        let employerMacsCount = await Employer.find({ loginMAC: macAddress, status: { $nin: [0] } }).countDocuments();

        let totalMacsCount = cookMacsCount + employerMacsCount;
        if (totalMacsCount >= 10) throw { statusCode: 403, responseCode: 0, msg: `Login failed. Please contact support team.` }
    }
    catch (e) {
        throw e
    }
}

exports.checkRegistrationMACLimit = async (macAddress) => {
    try {
        const data = await BlockedMac.findOne({ macAddress });
        if (data) throw { statusCode: 403, responseCode: 0, msg: `Signup failed. Please contact support team.` }

        let cookMacsCount = await Cook.find({ registerMAC: macAddress, status: { $nin: [0] } }).countDocuments();
        let employerMacsCount = await Employer.find({ registerMAC: macAddress, status: { $nin: [0] } }).countDocuments();

        let totalMacsCount = cookMacsCount + employerMacsCount;
        if (totalMacsCount >= 10) throw { statusCode: 403, responseCode: 0, msg: `Signup failed. Please contact support team.` }
    }
    catch (e) {
        throw e
    }
}

exports.checkLoginMacAddress = async (macAddress, userId) => {
    try {
        userId = userId.toString();
        console.log({ type: typeof userId })
        const currentDate = getCurrentDateAndTime();
        const expiresAt = `${(moment(addDaysToDate(180)).format("YYYY-MM-DD"))}T23:59:59.999Z`;

        const macCount = await BlockedMac.findOne({ macAddress }).lean();
        if (macCount) throw { statusCode: 403, responseCode: 0, msg: `Login failed. Please contact support team.` }

        const allowedMac = await AllowedMac.findOne({ macAddress }).lean();
        if (!allowedMac) {

            const isMacExisted = await MacList.findOne({ macAddress }).lean();
            const users = (isMacExisted && isMacExisted.users) ? isMacExisted.users : [];

            if (isMacExisted && users.length >= 3 && !users.includes(userId) && !isDateExpired(isMacExisted.expiresAt)) {
                console.log("one")
                throw { statusCode: 403, responseCode: 0, msg: `Login failed. Please contact support team.` }
            }

            else if (isMacExisted && users.length < 3 && !users.includes(userId) && !isDateExpired(isMacExisted.expiresAt)) {
                console.log("Two")
                await MacList.findOneAndUpdate({ _id: isMacExisted._id }, { $push: { users: userId }, $set: { updatedAt: currentDate, expiresAt } }, { new: true })
            }

            else if (isMacExisted && !users.includes(userId) && isDateExpired(isMacExisted.expiresAt)) {
                console.log("Three")
                await MacList.findOneAndUpdate({ _id: isMacExisted._id }, { $set: { users: [userId], updatedAt: currentDate, expiresAt } }, { new: true })
            }

            else if (!isMacExisted) {
                console.log("Four")
                await MacList.create({ macAddress, users: [userId], createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime(), expiresAt })
            }
        }
    }
    catch (e) {
        throw e
    }
}

exports.checkRegistrationMacAddress = async (macAddress, userId) => {
    try {
        const currentDate = getCurrentDateAndTime();
        const expiresAt = `${(moment(addDaysToDate(180)).format("YYYY-MM-DD"))}T23:59:59.999Z`;

        const macCount = await BlockedMac.findOne({ macAddress }).lean();
        if (macCount) throw { statusCode: 403, responseCode: 0, msg: `Signup failed. Please contact support team.` }

        const allowedMac = await AllowedMac.findOne({ macAddress }).lean();
        if (!allowedMac) {

            const isMacExisted = await MacList.findOne({ macAddress }).lean();

            //For verify reg otp ,creating mac and assign user if it not exists earlier.
            if (userId && !isMacExisted) {
                console.log("one")
                await MacList.create({ macAddress, users: [userId], createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime(), expiresAt })
            }

            //For verify reg otp ,updating mac row if its expired.
            if (userId && isMacExisted && isDateExpired(isMacExisted.expiresAt)) {
                console.log("Two")
                await MacList.findOneAndUpdate({ _id: isMacExisted._id }, { $set: { users: [userId], updatedAt: currentDate, expiresAt } }, { new: true })
            }

            //For verify reg otp ,updating mac row if its not expired so we are pushing new user.
            if (userId && isMacExisted && !isDateExpired(isMacExisted.expiresAt) && (isMacExisted.users).length < 2) {
                console.log("Three")
                await MacList.findOneAndUpdate({ _id: isMacExisted._id }, { $push: { users: userId }, $set: { updatedAt: currentDate, expiresAt } }, { new: true })
            }

            //For registration checking macs limit
            if (!userId && isMacExisted && (isMacExisted.users).length >= 2 && !isDateExpired(isMacExisted.expiresAt)) {
                console.log("Four")
                throw { statusCode: 403, responseCode: 0, msg: `Signup failed. Please contact support team.` }
            }
        }
    }
    catch (e) {
        throw e
    }
}

exports.generateHourlyData = (data) => {
    const result = [];
    const formatHour = (hour) => (hour < 10 ? `0${hour}` : `${hour}`);
    const initializeHoursForDate = (dateString) => {
        const resultEntry = {
            date: dateString,
            data: {},
        };
        for (let hour = 0; hour < 24; hour++) {
            const hourString = `${formatHour(hour)}:00 - ${formatHour(hour + 1)}:00`;
            resultEntry.data[hourString] = 0;
        }
        result.push(resultEntry);
    };

    data.forEach((entry) => {
        const date = new Date(entry.createdAt);
        const dateString = date.toISOString().split('T')[0];
        const resultEntry = result.find((entry) => entry.date === dateString);
        if (!resultEntry) {
            initializeHoursForDate(dateString);
        }
        const hourString = `${formatHour(date.getUTCHours())}:00 - ${formatHour(date.getUTCHours() + 1)}:00`;
        const updatedResultEntry = result.find((entry) => entry.date === dateString);
        updatedResultEntry.data[hourString]++;
    });
    return result;

}