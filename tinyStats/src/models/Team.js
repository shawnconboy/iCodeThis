const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    sport: {
        type: String,
        required: true
    },
    ageGroup: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    coach: {
        name: String,
        contact: String
    },
    players: [{
        name: String,
        number: String,
        position: String
    }],
    stats: {
        wins: {
            type: Number,
            default: 0
        },
        losses: {
            type: Number,
            default: 0
        },
        ties: {
            type: Number,
            default: 0
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Team', teamSchema); 