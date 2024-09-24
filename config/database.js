// const mongoose = require('mongoose');
// const { mongoDb } = require("./config");

// exports.databaseConnection = async () => {
//     console.log({ dbUrl: mongoDb.dbUrl })
//     await mongoose.connect(mongoDb.dbUrl, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//         useCreateIndex: true,
//         useFindAndModify: false
//     })
// }

const mongoose = require('mongoose');
const { mongoDb } = require("./config");

exports.databaseConnection = async () => {
    console.log({ dbUrl: mongoDb.dbUrl });

    await mongoose.connect(mongoDb.dbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
        poolSize: 10
    });

    const db = mongoose.connection;

    db.on('error', (err) => {
        console.error('MongoDB connection error:', err);
    });

    db.once('open', () => {
        console.log('MongoDB connected successfully');
    });

    db.on('disconnected', () => {
        console.log('MongoDB disconnected');
    });
};



