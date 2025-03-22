const express = require('express');
const router = express.Router();
const Game = require('../models/Game');

// Get all games
router.get('/', async (req, res) => {
    try {
        const games = await Game.find()
            .populate('homeTeam', 'name location')
            .populate('awayTeam', 'name location');
        res.json(games);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get game by ID
router.get('/:id', async (req, res) => {
    try {
        const game = await Game.findById(req.params.id)
            .populate('homeTeam', 'name location')
            .populate('awayTeam', 'name location');
        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }
        res.json(game);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get games by team ID
router.get('/team/:teamId', async (req, res) => {
    try {
        const games = await Game.find({
            $or: [
                { homeTeam: req.params.teamId },
                { awayTeam: req.params.teamId }
            ]
        })
        .populate('homeTeam', 'name location')
        .populate('awayTeam', 'name location');
        res.json(games);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new game
router.post('/', async (req, res) => {
    const game = new Game(req.body);
    try {
        const newGame = await game.save();
        res.status(201).json(newGame);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update game
router.patch('/:id', async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }
        Object.assign(game, req.body);
        const updatedGame = await game.save();
        res.json(updatedGame);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Add game event
router.post('/:id/events', async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }
        game.events.push(req.body);
        const updatedGame = await game.save();
        res.json(updatedGame);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete game
router.delete('/:id', async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }
        await game.remove();
        res.json({ message: 'Game deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 