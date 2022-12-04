//for storing tokens of user
//so that user can verify their email even when they verify their mail in different devices

const mongoose = require('mongoose');

const resetTokens = new mongoose.Schema({
    token: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    created: {
        type: Date,
        default: () => Date.now(),
    },
    // this token will automatically delete after 10 min
    // can be a bit delay, because the bg thread runs every 60 sec
    expire_at: { type: Date, default: Date.now, expires: 600 }
});

module.exports = mongoose.model('resetTokens', resetTokens);