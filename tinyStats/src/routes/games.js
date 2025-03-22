const express = require('express');
const router = express.Router();
const Game = require('../models/Game');

// Get all games
router.get('/', async (req, res) => {
    try {
        const games = await Game.find().populate('homeTeam awayTeam');
        res.json(games);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get games for a specific team
router.get('/team/:teamId', async (req, res) => {
    try {
        const games = await Game.find({
            $or: [
                { homeTeam: req.params.teamId },
                { awayTeam: req.params.teamId }
            ]
        }).populate('homeTeam awayTeam');
        res.json(games);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 