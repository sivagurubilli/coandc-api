let { sendNotice } = require("../utils/appUtils");
let { Cook, Employer } = require("../models");
const chunkSize = 400;

exports.sendJobApplicationNotification = async (body) => {
    console.log({ body })
    let resp = await sendNotice({
        title: `New application received for ${body.designation}`,
        body: `A candidate has shown interest for ${body.designation}, contact them.`,
        data: {
            screen: 'jobapplication',
            id: (body.employerId).toString(),
            applicationId: (body.applicationId).toString()
        },
        userToken: [body.deviceToken],
        employerId: body.employerId
    })
    console.log({ resp })
}

exports.sendEventApplicationNotification = async (body) => {
    let resp = await sendNotice({
        title: `New application received for ${body.designation}`,
        body: `A candidate has shown interest for ${body.designation},contact them.`,
        data: {
            screen: "eventrequest",
            id: (body.employerId).toString(),
            applicationId: (body.applicationId).toString()
        },
        userToken: [body.deviceToken],
        employerId: body.employerId
    })
    console.log({ resp })
}

exports.sendHouseJobApplicationNotification = async (body) => {
    let resp = await sendNotice({
        title: `New application received for ${body.designation}`,
        body: `A candidate has shown interest for ${body.designation},contact them.`,
        data: {
            screen: "eventrequest",
            id: (body.employerId).toString(),
            applicationId: (body.applicationId).toString()
        },
        userToken: [body.deviceToken],
        employerId: body.employerId
    })
    console.log({ resp })
}

exports.sendBulkNotifications = async (body) => {
    const payload = { screen: body.screen, id: "cook" };
    if (body.jobId) payload.jobId = (body.jobId).toString();
    if (body.eventId) payload.eventId = (body.eventId).toString();
    if (body.requirementId) payload.requirementId = (body.requirementId).toString();
    let resp = await sendNotice({
        title: body.title,
        body: body.message,
        data: payload,
        userToken: body.tokens
    })
}

// Recursive function to process array in chunks
exports.processNotificationsInChunks = async (body) => {
    const { tokens, chunkSize, message, title, screen, jobId, eventId, requirementId } = body;
    if (tokens.length === 0) {
        return;
    }
    const chunk = tokens.slice(0, chunkSize);
    console.log({ chunkCount: chunk.length })
    await Promise.all([
        exports.sendBulkNotifications({ tokens: chunk, message, title, screen, jobId, eventId, requirementId })
    ]);
    this.processNotificationsInChunks({ tokens: tokens.slice(chunkSize), chunkSize, message, title, screen, jobId, eventId, requirementId });
}

exports.sendBulkJobNotificationsToChef = async (body) => {

    let data = await Cook.aggregate([
        {
            $geoNear: {
                near: { type: 'Point', coordinates: [body.longitude, body.latitude] },
                distanceField: 'distanceInMeters',
                maxDistance: 500 * 1000, //500 KM RADIUS
                spherical: true,
                key: 'currentCityCoordinates'
            }
        },
        {
            $match: { memberType: 1, cookType: 2, status: 1, chefProfileStatus: 1 }
        },
        {
            $project: {
                _id: 1,
                deviceToken: 1
            }
        }
    ])


    data = JSON.parse(JSON.stringify(data));
    let tokens = [];
    if (data.length) {
        data.map((x) => {
            if (x.deviceToken != null && x.deviceToken !== undefined && x.deviceToken !== "") tokens.push(x.deviceToken);
        })
    }
    if (tokens.length) {
        console.log({ tokensCount: tokens.length })
        await exports.processNotificationsInChunks({ jobId: body.jobId, screen: "findjob", chunkSize: 400, tokens, title: `New job posted in ${body.location}`, message: `New job for a ${body.designation} in your city. Contact them` })
    }
}

exports.sendBulkEventNotifications = async (body) => {

    let data = await Cook.aggregate([
        {
            $geoNear: {
                near: { type: 'Point', coordinates: [body.longitude, body.latitude] },
                distanceField: 'distanceInMeters',
                maxDistance: 100 * 1000, //100 KM RADIUS
                spherical: true,
                key: 'cityCoordinates'
            }
        },
        {
            $match:
            {
                $or: [
                    { memberType: 1, partyCook: 1, status: 1, chefProfileStatus: 1 },
                    { memberType: 2, status: 1, cateringProfileStatus: 1 }
                ]
            }
        },
        {
            $project: {
                _id: 1,
                deviceToken: 1
            }
        }
    ])


    data = JSON.parse(JSON.stringify(data));
    let tokens = [];
    if (data.length) {
        data.map((x) => {
            if (x.deviceToken != null && x.deviceToken !== undefined && x.deviceToken !== "") tokens.push(x.deviceToken);
        })
    }
    if (tokens.length) {
        console.log({ tokensCount: tokens.length })
        await exports.processNotificationsInChunks({ eventId: body.eventId, screen: "findevent", chunkSize: 400, tokens, title: `New event posted in ${body.location}`, message: `New requirement for a ${body.eventType} in your city. Contact them` })
    }
}

exports.sendBulkHouseJobNotifications = async (body) => {

    let data = await Cook.aggregate([
        {
            $geoNear: {
                near: { type: 'Point', coordinates: [body.longitude, body.latitude] },
                distanceField: 'distanceInMeters',
                maxDistance: 25 * 1000, //25 KM RADIUS
                spherical: true,
                key: 'areaCoordinates'
            }
        },
        {
            $match:
            {
                memberType: 1, cookType: 1, status: 1, houseCookProfileStatus: 1
            }
        },
        {
            $project: {
                _id: 1,
                deviceToken: 1
            }
        }
    ])


    data = JSON.parse(JSON.stringify(data));
    let tokens = [];
    if (data.length) {
        data.map((x) => {
            if (x.deviceToken != null && x.deviceToken !== undefined && x.deviceToken !== "") tokens.push(x.deviceToken);
        })
    }
    if (tokens.length) {
        console.log({ tokensCount: tokens.length, tokens })
        await exports.processNotificationsInChunks({ requirementId: body.requirementId, screen: "findhousejob", chunkSize: 900, tokens, title: `New requirement for a house cook in your area.`, message: `House cook required in ${body.jobAreaName}. Contact them` })
    }
}