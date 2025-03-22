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
        name: {
            type: String,
            required: true
        },
        contact: {
            type: String,
            required: true
        }
    },
    players: [{
        name: {
            type: String,
            required: true
        },
        number: {
            type: String,
            required: true
        },
        position: {
            type: String,
            required: true
        }
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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Team', teamSchema); 