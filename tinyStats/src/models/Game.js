const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'in_progress', 'completed'],
        default: 'scheduled'
    },
    homeTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    awayTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    score: {
        home: {
            type: Number,
            default: 0
        },
        away: {
            type: Number,
            default: 0
        }
    },
    events: [{
        type: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            required: true
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Game', gameSchema); 