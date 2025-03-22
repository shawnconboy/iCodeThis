const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    }
}, {
    timestamps: true
});

// Compound index to ensure unique user-team combinations
favoriteSchema.index({ userId: 1, teamId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema); 