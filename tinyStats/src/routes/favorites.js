const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const Team = require('../models/Team');

// Get favorites for a user
router.get('/:userId', async (req, res) => {
    try {
        const favorites = await Favorite.find({ userId: req.params.userId });
        const favoritesWithTeamNames = await Promise.all(favorites.map(async (favorite) => {
            const team = await Team.findById(favorite.teamId);
            return {
                ...favorite.toObject(),
                teamName: team ? team.name : 'Unknown Team'
            };
        }));
        res.json(favoritesWithTeamNames);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Toggle favorite status
router.post('/toggle', async (req, res) => {
    try {
        const { userId, teamId } = req.body;
        const existingFavorite = await Favorite.findOne({ userId, teamId });
        
        if (existingFavorite) {
            await Favorite.findByIdAndDelete(existingFavorite._id);
        } else {
            await Favorite.create({ userId, teamId });
        }
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 