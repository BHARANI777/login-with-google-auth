//including all the necessary modules

const express = require('express');
const mongoose = require('mongoose');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const MemoryStore = require('memorystore')(expressSession)
const passport = require('passport');
const flash = require('connect-flash');

//create a server
const app = express();

//set it view engine
//set views path
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views',);

//middleware for parsing data
//setting body parser for parsing request body
app.use(express.urlencoded({ extended: true }));

//connecting to database
//used mongoose for connecting to mongodb database
const mongoURI = require('./config/mongoKEY');
mongoose.connect(mongoURI, 
    { 
        useNewUrlParser: true, 
        useUnifiedTopology: true,
        useFindAndModify: false, 
        useCreateIndex: true, 
    }
    ,)
    .then(() => console.log("Database Connected !"),);


//for parsing cookies info
app.use(cookieParser('random'));

//setting up express Session
app.use(expressSession({
    secret: "random",
    resave: true,
    saveUninitialized: true,
    // setting the max age to longer duration
    maxAge: 24 * 60 * 60 * 1000,
    store: new MemoryStore(),
}));

//for handling forgery request
//csrf authentication for forgery protection
//add an extra layer security to our apps
app.use(csrf());

//for authentication
app.use(passport.initialize());
app.use(passport.session());

//for showing  error messages via passport
app.use(flash());

//set up flash messages
app.use(function (req, res, next) {
    res.locals.success_messages = req.flash('success_messages');
    res.locals.error_messages = req.flash('error_messages');
    res.locals.error = req.flash('error');
    next();
});

app.use(require('./controller/routes.js'));

//app is running on port
const PORT = process.env.PORT || 3000;

//connecting to server
app.listen(PORT, () => console.log("Server Started At " + PORT));