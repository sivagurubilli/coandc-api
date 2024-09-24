import AppUtils from "../utils/appUtils.js";

import { User  } from '../src/models/index.js'


const chunkSize = 400;

export const sendBulkNotifications = async (body) => {
    const payload = { screen: body.screen,  };

     let resp = await AppUtils.sendNotice({
        title: body.title,
        body: body.message,
        data: payload,
        userToken: body.tokens
    })
}

export const sendnoticationsinbulk = async (body) => {
    let users = await User.find({ isDeleted: false });
    let tokens = [];
    if (users.length) {
       users.map((x) => {
            if (x.deviceToken != null && x.deviceToken !== undefined && x.deviceToken !== "") tokens.push(x.deviceToken);
        })
    }
    if (tokens.length) {
        console.log({ tokensCount: tokens.length })
        await processNotificationsInChunks({  chunkSize: 400, tokens,screen: "currentAffairs", title: `CurrentAffairs posted  `, message: `New Current Affairs Posted for ${body?.date}. Please refer them` })
    }

}
// Recursive function to process array in chunks
export const processNotificationsInChunks = async (body) => {
    const { tokens, chunkSize, message, screen, title } = body;
    if (tokens.length === 0) {
        return;
    }

    const chunk = tokens.slice(0, chunkSize);
    console.log({ chunkCount: chunk.length });

    await sendBulkNotifications({ tokens: chunk, message, screen, title });

    // Recursively call the function with the remaining tokens
    await processNotificationsInChunks({ tokens: tokens.slice(chunkSize), chunkSize, message, screen, title });
};
