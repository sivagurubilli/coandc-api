let { Province, Languages, Qualification, PartyPlates, CateringPlates, Cuisines } = require("../models/index")

exports.isValidProvince = async (body) => {
    try {
        let data = await Province.findOne({ provinceName: body })
        if (!data) throw { statusCode: 400, responseCode: 2, msg: "Please enter valid state" }
        return data;
    }
    catch (e) {
        throw e
    }
}

exports.isValidLanguage = async (body) => {
    try {
        let data = await Languages.find({ languageName: { $in: body } })
        console.log({ data })
        const existingLanguages = new Set(data.map(lang => lang.languageName));
        console.log({ existingLanguages })
        const missingLanguages = body.filter(languageName => !existingLanguages.has(languageName));
        console.log({ missingLanguages })
        if (missingLanguages.length) throw { statusCode: 400, responseCode: 2, msg: `${missingLanguages[0]} is invalid language` }
        return data;
    }
    catch (e) {
        throw e
    }
}

exports.isValidCuisine = async (body) => {
    try {
        let data = await Cuisines.find({ cuisineName: { $in: body } })
        const existingCuisines = new Set(data.map(cuisine => cuisine.cuisineName));
        const missingCuisines = body.filter(cuisineName => !existingCuisines.has(cuisineName));
        if (missingCuisines.length) throw { statusCode: 400, responseCode: 2, msg: `${missingCuisines[0]} is invalid cuisine` }
        return data;
    }
    catch (e) {
        throw e
    }
}

exports.isValidQualification = async (body) => {
    try {
        let data = await Qualification.findOne({ qualificationName: body })
        if (!data) throw { statusCode: 400, responseCode: 2, msg: "Please enter valid qualification" }
        return data;
    }
    catch (e) {
        throw e
    }
}

exports.isValidPartyPlates = async (body) => {
    try {
        let data = await PartyPlates.findOne({ value: body })
        if (!data) throw { statusCode: 400, responseCode: 2, msg: "Invalid party maximum plates value" }
        return data;
    }
    catch (e) {
        throw e
    }
}

exports.isValidCateringPlates = async (body) => {
    try {
        let data = await CateringPlates.findOne({ value: body })
        if (!data) throw { statusCode: 400, responseCode: 2, msg: "Invalid catering maximum plates value" }
        return data;
    }
    catch (e) {
        throw e
    }
}

exports.isValidHouseJobPayments = (body) => {
    try {
        let data = ["1000 to 2000", "2000 to 3000", "3000 to 5000", "5000 to 10000", "10000 to 15000", "15000 to 25000", "Above 25000"];
        console.log(!data.find(item => item === body))
        if (!data.includes(body)) {
            throw { statusCode: 400, responseCode: 2, msg: "Please provide a valid payment value" };
        }
        return body;
    }
    catch (e) {
        throw e
    }
}
