// for authentication of user who logged in via mail

const user = require('../model/user');
const bcryptjs = require('bcryptjs');
var localStrategy = require('passport-local').Strategy;


//here passport parameter will come from login route
module.exports = function (passport) {
    //using email as username
    //email and password will come from login route
    passport.use(new localStrategy({ usernameField: 'email' }, (email, password, done) => {
        
        //we are using email and password authentication
        user.findOne({ email: email }, (err, data) => {
            if (err) throw err;
            if (!data) {
                //user doesn't exist
                //done is callback function , so that login route can handle
                return done(null, false, { message: "User Doesn't Exist !" });
            }

            //user exists with this email
            //then compare the password from database with the password from the user
            //data : value from database
            bcryptjs.compare(password, data.password, (err, match) => {
                if (err) {
                    return done(null, false);
                }
                //password doesn't match
                if (!match) {
                    return done(null, false, { message: "Password Doesn't match !" });
                }
                if (match) {
                    //password matches
                    return done(null, data);
                }
            })
        })
    }));

    //it will return a user with its user id from user
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    //it will return a user from its user id
    //user will contains all info about that user
    passport.deserializeUser(function (id, done) {
        user.findById(id, function (err, user) {
            done(err, user);
        });
    });

}