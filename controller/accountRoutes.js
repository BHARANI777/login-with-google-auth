//for handling user reset password/verify account and send email etc

//including necessary modules
const express = require('express');
const router = express.Router();
const crypto = require('crypto'); //for generating a tokens
const resetToken = require('../model/resetTokens');
const user = require('../model/user');
const mailer = require('./sendMail');
const bcryptjs = require('bcryptjs');
const bodyparser =require("body-parser");


//for handling forgery request
function checkAuth(req, res, next) {
    if (req.isAuthenticated()) {
        res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, post-check=0, pre-check=0');
        next();
    } else {
        req.flash('error_messages', "Please Login to continue !");
        res.redirect('/login');
    }
}

//route for sending verification email
// adding the checkAuth middleware to make sure that 
// only authenticated users can send emails
router.get('/user/send-verification-email', checkAuth, async (req, res) => {
    // check if user is google or already verified
    if (req.user.isVerified || req.user.provider == 'google') {
        // already verified or google user
        // since we won't show any such option in the UI 
        // most probably this is being called by mistake or can be an attack
        // simply redirect to profile 
        res.redirect('/profile');
    } 
    else {
        //here send a verification email

        // generate a token
        //encoding will be hex 
        var token = crypto.randomBytes(32).toString('hex');
        // add that token to resetToken database , for verification process
        await resetToken(
            { 
                token: token, email: req.user.email 
            }).save();

        // send an email for verification
        mailer.sendVerifyEmail(req.user.email, token);

        //after verification, redirect user to profile page
        res.render('profile', 
            { 
                username: req.user.username, 
                verified: req.user.isVerified,
                 emailsent: true 
            });
    }
});


//route for verification of email
router.get('/user/verifyemail', async (req, res) => {
    // grab the token
    const token = req.query.token;
    
    // check if token exists 
    // or just send an error
    if (token) {

        //check if it is same token that we have sent ,that token is stored in database
        var check = await resetToken.findOne({ token: token });
        if (check) {
            // token verified
            // set the property of verified to true for the user in user database
            var userData = await user.findOne({ email: check.email });
            userData.isVerified = true;
            await userData.save();

            // delete the token from resetToken database  now itself
            await resetToken.findOneAndDelete({ token: token });
            res.redirect('/profile');
        } 
        else {
            //token doesnt match or some error
            res.render('profile', 
                {  
                    username: req.user.username, 
                    verified: req.user.isVerified,
                    err: "Invalid token or Token has expired, Try again." 
                });
        }
    } else {
        // doesnt have a token
        // I will simply redirect to profile 
        res.redirect('/profile');
    }
});


//route for reset the password
router.get('/user/forgot-password', async (req, res) => {
    // render reset password page 
    // not checking if user is authenticated 
    // so that you can use as an option to change password too
    res.render('forgot-password.ejs', { csrfToken: req.csrfToken() });

});



router.post('/user/forgot-password', async (req, res) => {
    
    //get email from request
    const { email } = req.body;
    // not checking if the field is empty or not 
    
    // check if a user existss with this email in user database
    var userData = await user.findOne({ email: email });
    //console.log(userData);

    
    if (userData) {

        //user exists with this email

        //check if user provider is google
        if (userData.provider == 'google') {
            // type is for bootstrap alert types
            res.render('forgot-password.ejs',
                 { 
                    csrfToken: req.csrfToken(), 
                    msg: "User exists with Google account. Try resetting your google account password or logging using it.", 
                    type: 'danger' 
                });
        } 
        else {
            // user exists and is not with google
            
            // generate token
            var token = crypto.randomBytes(32).toString('hex');
            
            // add that token to resetToken database
            await resetToken({ token: token, email: email }).save();
            
            // send an email for verification
            mailer.sendResetEmail(email, token);

            res.render('forgot-password.ejs', 
                { 
                    csrfToken: req.csrfToken(),
                    msg: "Reset email sent. Check your email for more info.", 
                    type: 'success' 
                });
        }
    } 
    else {
        res.render('forgot-password.ejs', { csrfToken: req.csrfToken(), msg: "No user Exists with this email.", type: 'danger' });

    }
});


//get the reset password from reset form
router.get('/user/reset-password', async (req, res) => {
    // do as in user verify , first check for a valid token 
    // and if the token is valid send the forgot password page to show the option to change password 

    const token = req.query.token;
    if (token) {
        var check = await resetToken.findOne({ token: token });
        if (check) {
            // token verified
            // send forgot-password page with reset to true
            // this will render the form to reset password
            // sending token too to grab email later
            res.render('forgot-password.ejs', 
                { 
                    csrfToken: req.csrfToken(), 
                    reset: true, 
                    email: check.email 
                });
        } 
        else {
            res.render('forgot-password.ejs', 
            { 
                csrfToken: req.csrfToken(),
                 msg: "Token Tampered or Expired.", 
                 type: 'danger' 
            });
        }
    } 
    else {
        // doesnt have a token
        // I will simply redirect to profile 
        res.redirect('/login');
    }

});


//this route will store the new password to user  database
router.post('/user/reset-password', async (req, res) => {
    // get passwords
    //password: new password
    //password2: new confirm password
    const { password, password2, email } = req.body;
    //console.log(password);
    //console.log(password2);

    //check fields
    if (!password || !password2 || (password2 != password)) {
        res.render('forgot-password.ejs', 
        { 
            csrfToken: req.csrfToken(),
            reset: true, 
            err: "Passwords Don't Match !", 
            email: email 
        });
    } 
    else {
        // encrypt/hash the password

        //generate the password
        var salt = await bcryptjs.genSalt(12);
        if (salt) {

            //hash the password
            var hash = await bcryptjs.hash(password, salt);
            
            //find user in database , then update its password in database
            await user.findOneAndUpdate({ email: email }, 
                                        { $set: { password: hash } }
                );
            
                //redirect to login page
            res.redirect('/login');
        } 
        else {
            res.render('forgot-password.ejs', 
                { 
                    csrfToken: req.csrfToken(), 
                    reset: true,
                    err: "Unexpected Error Try Again", 
                    email: email 
                });

        }
    }
});


module.exports = router;