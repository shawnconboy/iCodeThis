const mongoose = require('mongoose');

const playerFavoriteSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    teamId: {
        type: String,
        required: true
    },
    playerId: {
        type: String,
        required: true
    },
    player: {
        name: String,
        number: Number,
        position: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create a compound index to ensure a player can only be favorited once per user
playerFavoriteSchema.index({ userId: 1, playerId: 1 }, { unique: true });

module.exports = mongoose.model('PlayerFavorite', playerFavoriteSchema); 