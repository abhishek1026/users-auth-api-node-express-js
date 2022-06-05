const express = require('express');
const mongoose = require('mongoose');
var bodyParser = require('body-parser');
const sessions = require('express-session');
const authRoutes = require('./routes/routes');
require('dotenv').config();

const SESSION_MAX_TIME = 1000 * 60 * 60 * 24;
const ENVOY_SESSION_SECRET = process.env.SESSION_SECRET;

const SERVER_PORT = process.env.PORT;
const MONGO_DB_URL = process.env.DATABASE_URL;

mongoose.connect(MONGO_DB_URL);
const database = mongoose.connection;

database.on('error', function(error) {
    console.log(error);
});

database.once('connected', function() {
    console.log('Database Connected');
});

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(sessions({
    secret: ENVOY_SESSION_SECRET,
    saveUninitialized: true,
    cookie: { maxAge: SESSION_MAX_TIME },
    resave: false
}));
app.use('/auth', authRoutes);


app.listen(SERVER_PORT, function() {
    console.log(`Server Started at ${SERVER_PORT}`);
});