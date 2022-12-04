// schema of user
//user data will be stored in database in this form
//used mongoose for connecting to mongodb database
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
    },

    isVerified: {   //whether user is verified or not
                        //only required for email logged in users to check for valid email
        type: Boolean,
        default: false,
    },

    googleId: { //if user has logged in via google account,then store user info
        type: String,
    },
    provider: {  //either email or google 
        type: String,
        required: true,
    }
});

//exports user model
module.exports = mongoose.model('user', userSchema);