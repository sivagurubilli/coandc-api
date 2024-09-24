const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const { mongoDb, environment } = require('./config/config');
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const moment = require("moment");
const app = express();
const indexRouter = require("./routes/index");
dotenv.config({ path: "./.env" });
const { databaseConnection } = require("./config/database");
const { ClientPoints, User, CookPlan, Cook, Employer, Events, Transaction, ClientRequirement, CookPoints, CookShortlist, Jobs, CookRatings } = require("./models/index");
const bodyParser = require('body-parser');
const { cronSchedulars } = require('./cron');
const { getNextDay, addDaysToDate, getCurrentDateAndTime } = require("./helpers/dates")
const port = (environment == "prod") ? 5003 : 5001;
var ip = require('ip');
var requestIP = require('request-ip');

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(function (req, res, next) {
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  req.clientIp = clientIp;
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );

  req.reqId = uuidv4();
  next();
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ limit: "200mb", extended: true }));

// parse application/json
app.use(bodyParser.json());

app.get('/', async (req, res) => {
  res.status(200).send({ status: 1, message: `Welcome to the COOK_AND_CHEF_BACKEND ${environment} APPLICATION` })
})

// Get the client's IPv6 address
app.get('/client-ipv6', (req, res) => {
  res.json(requestIP.getClientIp(req));
});

app.use("/api", indexRouter);


// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

//Scheduling the cron jobs
cronSchedulars();

//Running the server
app.listen(port, async function () {
  await databaseConnection().then(() => {

    console.log("Connected to MONGO-DB successfully");
    console.log(new Date((new Date()).getTime() + (5.5 * 60 * 60 * 1000)))
  }).catch((e) => {
    console.log({ e })
    "Unable to connect to MONGO-DB.Try again";
  });
  console.log(`Server started successfully on port ${port}`);
});

module.exports = app;