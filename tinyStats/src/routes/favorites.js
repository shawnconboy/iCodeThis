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
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add a favorite
router.post('/', async (req, res) => {
    try {
        const { userId, teamId } = req.body;
        const favorite = await Favorite.create({
            userId,
            teamId,
            type: 'team'
        });
        res.status(201).json(favorite);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Remove a favorite
router.delete('/:teamId', async (req, res) => {
    try {
        const favorite = await Favorite.findOneAndDelete({ 
            teamId: req.params.teamId,
            userId: req.query.userId // Get userId from query string
        });
        
        if (!favorite) {
            return res.status(404).json({ message: 'Favorite not found' });
        }
        
        res.json({ message: 'Favorite removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 