const express = require('express');
const router = express.Router();
const user = require('../model/user');
const bcryptjs = require('bcryptjs'); //for hashing the password
const passport = require('passport');
require('./passportLocal')(passport);
require('./googleAuth')(passport);
const userRoutes = require('./accountRoutes');


//check for authentication
function checkAuth(req, res, next) {
    if (req.isAuthenticated()) {
        //to avoid storing of cached data
        //otherwise when we logout and hit back button on page then it will show profile page
        res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, post-check=0, pre-check=0');
        next();
    } 
    else {
        req.flash('error_messages', "Please Login to continue !");
        res.redirect('/login');
    }
}

//home route
//home page only be visible for logged users
router.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.render("index", { logged: true });
    } 
    else 
    {
        res.render("index", { logged: false });
    }
});

//login route
//include csrf token in form data
router.get('/login', (req, res) => {
    res.render("login", { csrfToken: req.csrfToken() });
});


//signup routes
//sending csrfToken
router.get('/signup', (req, res) => {
    res.render("signup", { csrfToken: req.csrfToken() });
});


//for validation of user
router.post('/signup', (req, res) => {
    
    // get all the values from form
    const { email, username, password, confirmpassword } = req.body;
    
    // check if input values are empty 
    if (!email || !username || !password || !confirmpassword) {
        //render signup page
        res.render("signup", 
        { 
            err: "All Fields Required !", csrfToken: req.csrfToken() 
        });
    } 
    //check if entered password & confirm password doesnt match
    else if (password != confirmpassword) {
        res.render("signup", 
        { 
            err: "Password Doesn't Match !", csrfToken: req.csrfToken() 
        });
    } 
    else {

        // validate email and username and password 
        // skipping validation
        // check if a user exists in database 
        //for finding users in database ,we have used username and email combination 
        //and both email & username should be unique for each user
        user.findOne({ $or: [{ email: email }, { username: username }] }, function (err, data) {
            if (err) throw err;
            if (data) {
                //user already exists in database
                res.render("signup", 
                { 
                    err: "User already Exists, Try Logging In !", csrfToken: req.csrfToken() 
                });
            } 
            else {
                //new user
                // generate a salt
                bcryptjs.genSalt(12, (err, salt) => {
                    if (err) throw err;
                    // hash the password
                    bcryptjs.hash(password, salt, (err, hash) => {
                        if (err) throw err;
                        // save user in database with hash value as password
                        user({
                            username: username,
                            email: email,
                            password: hash,
                            googleId: null,
                            provider: 'email',
                        }).save((err, data) => {
                            if (err) 
                                throw err;
                            //callback function
                            // login the user
                            // use req.login
                            // redirect , if you don't want to login
                            res.redirect('/login');
                        });
                    })
                });
            }
        });
    }
});


//login route
//authenticate the user with local strategy
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        failureRedirect: '/login', //on failure redirect to login
        successRedirect: '/profile', //on success redirect to profile
        failureFlash: true,
    })(req, res, next);
});
router.get('/main',(req,res) => {
    req.logout();
    req.session.destroy(function (err) {
        res.redirect('/main'); 
    });
});

//logout route
router.get('/logout', (req, res) => {
    req.logout();
    req.session.destroy(function (err) {
        res.redirect('/'); //redirect to home page
    });
});




//login route via google option
//user will be authenticated
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email',] }));

//after authentication, redirect to profile page
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/profile');
});

//only authenticated users can visit profile page
router.get('/profile', checkAuth, (req, res) => {
    // adding a new parameter for checking verification
    res.render('profile', 
        {   
            //getting these values from database
            username: req.user.username,
             verified : req.user.isVerified 
        }
        );

});


router.use(userRoutes);

module.exports = router;