let { CookPlan, ClientPlan, EmployerPlan, Transaction, EmployerPoints, Employer, Jobs, ClientPoints, EmployerReports } = require("../models/index")
const { getCurrentDateAndTime } = require("./dates");

exports.isValidCookPlan = async (id) => {
    try {
        let data = await CookPlan.findOne({ _id: id });
        if (!data) throw { statusCode: 404, responseCode: 5, msg: "No plan found." }
        if (data && data.status == 0) throw { statusCode: 400, responseCode: 6, msg: "Please provide a valid active plan!" }
        return data;
    }
    catch (e) {
        throw e
    }
}

exports.isValidClientPlan = async (id) => {
    try {
        let data = await ClientPlan.findOne({ _id: id });
        if (!data) throw { statusCode: 404, responseCode: 5, msg: "No plan found." }
        if (data && data.status == 0) throw { statusCode: 400, responseCode: 6, msg: "Please provide a valid active plan!" }
        return data;
    }
    catch (e) {
        throw e
    }
}

exports.isValidEmployerPlan = async (id) => {
    try {
        let data = await EmployerPlan.findOne({ _id: id });
        if (!data) throw { statusCode: 404, responseCode: 5, msg: "No plan found." }
        if (data && data.status == 0) throw { statusCode: 400, responseCode: 6, msg: "Please provide a valid active plan!" }
        return data;
    }
    catch (e) {
        throw e
    }
}



