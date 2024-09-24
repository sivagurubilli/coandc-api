const { getCookBasicProfilePoints, getHouseCookProfilePoints, getChefProfilePoints, getPartyCookProfilePoints,
    getCateringProfilePoints, getEmployerProfilePoints, getClientProfilePoints } = require("../utils/points");
let { CookPlan, ClientPlan, EmployerPlan, Transaction, EmployerPoints, Employer, Jobs,
    ClientPoints, EmployerReports } = require("../models/index")
const { getCurrentDateAndTime } = require("./dates");

exports.calculateProfileScore = (body) => {

    let { payload, scoringKeys } = body;

    //Testing
    const missingKeys = Object.keys(scoringKeys).filter(key => !payload.hasOwnProperty(key));
    console.log({ missingKeys })

    let score = 0;
    for (const key in scoringKeys) {
        if (payload.hasOwnProperty(key)) {
            let value = payload[key];

            // Trim the value if it's a string
            if (typeof value === 'string') {
                value = value.trim();
            }

            // Check if the trimmed value is an array and contains at least one element
            if (Array.isArray(value) && value.length > 0) {
                score += parseInt(scoringKeys[key]);
            } else if (!Array.isArray(value) && value !== null && value !== undefined) {
                if (typeof value == "string" && value !== "") {
                    score += parseInt(scoringKeys[key]);
                }
                if (typeof value !== "string") {
                    score += parseInt(scoringKeys[key]);
                }
            }
        }
    }
    return parseInt(score);
}


exports.getCookProfilePercent = (body) => {
    body = JSON.parse(JSON.stringify(body));
    let score = body.profilePercent;

    //For Caterings
    if (body.memberType == 2) {
        score = exports.calculateProfileScore({ payload: body, scoringKeys: getCateringProfilePoints() });
    }

    //For Only House Cooks
    if (body.memberType == 1 && body.cookType == 1 && body.partyCook !== 1) {
        let basicProfileScore = exports.calculateProfileScore({ payload: body, scoringKeys: getCookBasicProfilePoints() });
        let houseCookProfileScore = exports.calculateProfileScore({ payload: body, scoringKeys: getHouseCookProfilePoints() });
        score = basicProfileScore + houseCookProfileScore;
    }

    //For Only Chefs
    if (body.memberType == 1 && body.cookType == 2 && body.partyCook !== 1) {
        let basicProfileScore = exports.calculateProfileScore({ payload: body, scoringKeys: getCookBasicProfilePoints() });
        let chefProfileScore = exports.calculateProfileScore({ payload: body, scoringKeys: getChefProfilePoints() });
        score = basicProfileScore + chefProfileScore;
    }

    //For House Cook & Party Cook
    if (body.memberType == 1 && body.cookType == 1 && body.partyCook == 1) {
        let basicProfileScore = exports.calculateProfileScore({ payload: body, scoringKeys: getCookBasicProfilePoints() });
        let houseCookProfileScore = exports.calculateProfileScore({ payload: body, scoringKeys: getHouseCookProfilePoints() });
        let partyCookProfileScore = exports.calculateProfileScore({ payload: body, scoringKeys: getPartyCookProfilePoints() });

        score = (basicProfileScore + (houseCookProfileScore + partyCookProfileScore) / 2);
    }

    //For Chef & Party Cook
    if (body.memberType == 1 && body.cookType == 2 && body.partyCook == 1) {
        let basicProfileScore = exports.calculateProfileScore({ payload: body, scoringKeys: getCookBasicProfilePoints() });
        let chefProfileScore = exports.calculateProfileScore({ payload: body, scoringKeys: getChefProfilePoints() });
        let partyCookProfileScore = exports.calculateProfileScore({ payload: body, scoringKeys: getPartyCookProfilePoints() });

        score = (basicProfileScore + (chefProfileScore + partyCookProfileScore) / 2);
    }

    //For Only Party Cook
    if (body.memberType == 1 && !body.cookType && body.partyCook == 1) {
        let basicProfileScore = exports.calculateProfileScore({ payload: body, scoringKeys: getCookBasicProfilePoints() });
        let partyCookProfileScore = exports.calculateProfileScore({ payload: body, scoringKeys: getPartyCookProfilePoints() });
        score = basicProfileScore + partyCookProfileScore;
    }
    return score;

}


exports.getEmployerProfilePercent = (body) => {
    console.log(body)
    body = JSON.parse(JSON.stringify(body));
    let score = body.profilePercent;
    if (body.memberType == 2) {
        score = exports.calculateProfileScore({ payload: body, scoringKeys: getEmployerProfilePoints() })
    }
    if (body.memberType == 1) {
        score = exports.calculateProfileScore({ payload: body, scoringKeys: getClientProfilePoints() })
        if (body.hasOwnProperty("lunch") || body.hasOwnProperty("dinner") || body.hasOwnProperty("breakfast")) score = score + 10;
    }
    return score;
}




//Plan_Points_Helpers
exports.getEmployerValidJobPoints = async (userId) => {
    let planData = await EmployerPoints.findOne({ employerId: userId, isDeleted: false, currentJobPoints: { $gt: 0 }, planExpiresAt: { $gte: getCurrentDateAndTime() }, planStartsAt: { $lt: getCurrentDateAndTime() } }).sort({ 'planExpiresAt': 1 });
    return planData;
}

exports.getEmployerValidProfileViewPoints = async (userId) => {
    let planData = await EmployerPoints.findOne({ employerId: userId, isDeleted: false, currentProfileViewPoints: { $gt: 0 }, planExpiresAt: { $gte: getCurrentDateAndTime() }, planStartsAt: { $lt: getCurrentDateAndTime() } }).sort({ 'planExpiresAt': 1 });
    return planData;

}

exports.getClientValidEventPoints = async (userId) => {

    let planData = await ClientPoints.findOne({ clientId: userId, isDeleted: false, currentEventPoints: { $gt: 0 }, planExpiresAt: { $gte: getCurrentDateAndTime() }, planStartsAt: { $lt: getCurrentDateAndTime() } }).sort({ 'planExpiresAt': 1 });
    return planData;

}

exports.getClientValidHouseCookPoints = async (userId) => {

    let planData = await ClientPoints.findOne({ clientId: userId, isDeleted: false, currentHouseCookPoints: { $gt: 0 }, planExpiresAt: { $gte: getCurrentDateAndTime() }, planStartsAt: { $lt: getCurrentDateAndTime() } }).sort({ 'planExpiresAt': 1 });
    return planData;

}

exports.getClientValidPartyCateringPoints = async (userId) => {
    let planData = await ClientPoints.findOne({ clientId: userId, isDeleted: false, currentPartyCateringPoints: { $gt: 0 }, planExpiresAt: { $gte: getCurrentDateAndTime() }, planStartsAt: { $lt: getCurrentDateAndTime() } }).sort({ 'planExpiresAt': 1 });
    return planData;
}

exports.getClientValidPartyCateringPointsId = async (userId) => {
    let planData = await ClientPoints.findOne({ clientId: userId, isDeleted: false, currentPartyCateringPoints: { $gt: 0 }, planExpiresAt: { $gte: getCurrentDateAndTime() }, planStartsAt: { $lt: getCurrentDateAndTime() } }).sort({ 'planExpiresAt': 1 });
    if (!planData) {
        planData = await ClientPoints.findOne({ clientId: userId, isDeleted: false, currentPartyCateringPoints: { $gt: 0 }, planExpiresAt: { $gte: getCurrentDateAndTime() }, planStartsAt: { $lt: getCurrentDateAndTime() } }).sort({ 'createdAt': -1, 'planExpiresAt': -1 });
    }
    return planData;
}

exports.getClientValidHouseCookPointsId = async (userId) => {

    let planData = await ClientPoints.findOne({ clientId: userId, isDeleted: false, currentHouseCookPoints: { $gt: 0 }, planExpiresAt: { $gte: getCurrentDateAndTime() }, planStartsAt: { $lt: getCurrentDateAndTime() } }).sort({ 'planExpiresAt': 1 });
    if (!planData) {
        planData = await ClientPoints.findOne({ clientId: userId, isDeleted: false, currentHouseCookPoints: { $gt: 0 }, planExpiresAt: { $gte: getCurrentDateAndTime() }, planStartsAt: { $lt: getCurrentDateAndTime() } }).sort({ 'createdAt': -1, 'planExpiresAt': -1 });
    }
    return planData;

}

exports.getEmployerValidProfileViewPointsId = async (userId) => {
    let planData = await EmployerPoints.findOne({ employerId: userId, isDeleted: false, currentProfileViewPoints: { $gt: 0 }, planExpiresAt: { $gte: getCurrentDateAndTime() }, planStartsAt: { $lt: getCurrentDateAndTime() } }).sort({ 'planExpiresAt': 1 });
    if (!planData) {
        planData = await EmployerPoints.findOne({ employerId: userId, isDeleted: false, currentProfileViewPoints: { $gte: 0 }, planExpiresAt: { $gte: getCurrentDateAndTime() }, planStartsAt: { $lt: getCurrentDateAndTime() } }).sort({ 'createdAt': -1, 'planExpiresAt': -1 });
    }
    return planData;

}

exports.getEmployerValidProfileViewPointsId = async (userId) => {
    let planData = await EmployerPoints.findOne({ employerId: userId, isDeleted: false, currentProfileViewPoints: { $gt: 0 }, planExpiresAt: { $gte: getCurrentDateAndTime() }, planStartsAt: { $lt: getCurrentDateAndTime() } }).sort({ 'planExpiresAt': 1 });
    if (!planData) {
        planData = await EmployerPoints.findOne({ employerId: userId, isDeleted: false, currentProfileViewPoints: { $gte: 0 }, planExpiresAt: { $gte: getCurrentDateAndTime() }, planStartsAt: { $lt: getCurrentDateAndTime() } }).sort({ 'createdAt': -1, 'planExpiresAt': -1 });
    }
    return planData;
}

exports.getEmployerActivePoints = async (userId) => {
    let data = await EmployerPoints.find({ employerId: userId, isDeleted: false, planExpiresAt: { $gte: getCurrentDateAndTime() }, planStartsAt: { $lt: getCurrentDateAndTime() } }).distinct('_id');
    return data;
}

exports.getClientActivePoints = async (userId) => {
    let data = await ClientPoints.find({ clientId: userId, isDeleted: false, planExpiresAt: { $gte: getCurrentDateAndTime() }, planStartsAt: { $lt: getCurrentDateAndTime() } }).distinct('_id');
    return data;
}



