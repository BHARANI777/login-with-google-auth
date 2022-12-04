// for authentication of user who logged in via google account

var GoogleStrategy = require('passport-google-oauth20').Strategy;
const user = require('../model/user');
const clientId = require('../config/googleData').clientId;
const clientSecreT = require('../config/googleData').clientSecret;

module.exports = function (passport) {
    //passport will use google strategy to authentication
    passport.use(new GoogleStrategy({
        clientID: clientId,
        clientSecret: clientSecreT,
        callbackURL: "http://localhost:3000/google/callback"
        
        //this callback will return accessToken , refreshToken , profile
    }, (accessToken, refreshToken, profile, done) => {
        console.log(profile.emails[0].value);

        // find if a user exist with this email or not in database
        user.findOne({ email: profile.emails[0].value }).then((data) => {
            if (data) {
                // user exists
                // update data
                // I am skipping that part here, may Update Later
                return done(null, data);
            } else {
                // create a user and store in database
                user({
                    username: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    password: null,
                    provider: 'google',
                    isVerified: true,
                }).save(function (err, data) {
                    return done(null, data);
                });
            }
        });
    }
    ));

    //find user id from user
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });


    //find user from user id
    passport.deserializeUser(function (id, done) {
        user.findById(id, function (err, user) {
            done(err, user);
        });
    });

}