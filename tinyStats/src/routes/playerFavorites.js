const express = require('express');
const router = express.Router();
const PlayerFavorite = require('../models/PlayerFavorite');

// Get all favorite players for a user
router.get('/:userId', async (req, res) => {
    try {
        console.log('Fetching favorites for user:', req.params.userId);
        const favorites = await PlayerFavorite.find({ userId: req.params.userId });
        console.log('Found favorites:', favorites);
        res.json(favorites);
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ message: error.message });
    }
});

// Add a player to favorites
router.post('/', async (req, res) => {
    try {
        console.log('Adding favorite:', req.body);
        
        // Check if favorite already exists
        const existingFavorite = await PlayerFavorite.findOne({
            userId: req.body.userId,
            playerId: req.body.playerId
        });
        
        if (existingFavorite) {
            console.log('Favorite already exists:', existingFavorite);
            return res.status(400).json({ message: 'Player is already a favorite' });
        }

        const favorite = new PlayerFavorite({
            userId: req.body.userId,
            teamId: req.body.teamId,
            playerId: req.body.playerId,
            player: req.body.player
        });

        const newFavorite = await favorite.save();
        console.log('Added favorite:', newFavorite);
        res.status(201).json(newFavorite);
    } catch (error) {
        console.error('Error adding favorite:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Player is already a favorite' });
        }
        res.status(400).json({ message: error.message });
    }
});

// Remove a player from favorites
router.delete('/:playerId', async (req, res) => {
    try {
        console.log('Removing favorite:', req.params.playerId, 'for user:', req.query.userId);
        const favorite = await PlayerFavorite.findOneAndDelete({
            playerId: req.params.playerId,
            userId: req.query.userId
        });
        
        if (!favorite) {
            console.log('Favorite not found');
            return res.status(404).json({ message: 'Favorite player not found' });
        }
        
        console.log('Removed favorite:', favorite);
        res.json({ message: 'Player removed from favorites' });
    } catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 