const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');

// Get user's favorite teams
router.get('/:userId', async (req, res) => {
    try {
        const favorites = await Favorite.find({ userId: req.params.userId })
            .populate('teamId', 'name sport location');
        res.json(favorites);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add favorite team
router.post('/', async (req, res) => {
    const favorite = new Favorite(req.body);
    try {
        const newFavorite = await favorite.save();
        res.status(201).json(newFavorite);
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ message: 'Team already in favorites' });
        } else {
            res.status(400).json({ message: error.message });
        }
    }
});

// Remove favorite team
router.delete('/:userId/:teamId', async (req, res) => {
    try {
        const favorite = await Favorite.findOneAndDelete({
            userId: req.params.userId,
            teamId: req.params.teamId
        });
        if (!favorite) {
            return res.status(404).json({ message: 'Favorite not found' });
        }
        res.json({ message: 'Favorite removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 